// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tcp-retransmit's model (rules: SPEC.md). Run: node --test sims/tcp-retransmit/
// Tie-breaks first, then rules 1–8 and the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'book-rto': {},
  'book-fast': { flow: 'fast' },
  'ack-lost': { flow: 'five', lose: 'a2' },
  backoff: { loseRetx: 2 },
  'no-buffer': { flow: 'fast', bufferOoo: false }
};
/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const last = (over) => run(over).slice(-1)[0];
const acks = (s) => s.msgs.filter((m) => m.k === 'ack');
const segs = (s) => s.msgs.filter((m) => m.k === 'seg');
const retx = (s) => segs(s).filter((m) => m.tx > 0);
/** The step at which message id arrives or is lost. */
const stepOf = (states, id) => states.findIndex((s) => s.ev.m != null && s.msgs[s.ev.m].id === id);

// ── tie-breaks ──

test('tie-break: an arrival at the same instant as the timer goes first', () => {
  // book-rto after step 6: the timer is due at 1100; add an ACK that arrives at exactly 1100
  const s = structuredClone(run({})[6]);
  assert.equal(s.rtoDeadline, 1100);
  s.msgs.push({ id: 'x', k: 'ack', n: 2500, ackNo: 9, sentAt: 1050, at: 1100, fate: 'flight', re: null, dup: 0, sample: null });
  s.rows.push({ m: s.msgs.length - 1 });
  assert.deepEqual(logic.nextEvent(s), { t: 1100, kind: 'arrive', i: s.msgs.length - 1 });
  // and the whole step: the ACK covers everything, the timer stops, nothing is resent
  const after = logic.step(s, 7, P({}));
  assert.equal(after.ev.kind, 'arrived');
  assert.equal(after.sndUna, 2500);
  assert.equal(after.rtoDeadline, null);
  assert.equal(retx(after).length, 0);
  assert.equal(after.notes.length, 0);
});

test('tie-break: two arrivals at one instant go in the order they were sent', () => {
  const s = structuredClone(run({})[1]);
  s.msgs[2].at = s.msgs[1].at;   // segments 1500 and 2000 now arrive together
  assert.equal(logic.nextEvent(structuredClone(run({})[2])).i, 1);
  const t = structuredClone(s);
  t.msgs[0].fate = 'arrived';
  assert.equal(logic.nextEvent(t).i, 1);
});

test('tie-break: sends come after the event that caused them, in the same step and instant', () => {
  const fast = run({ flow: 'fast' });
  const s = fast[10];                       // the third duplicate ACK
  const ev = s.msgs[s.ev.m];
  assert.equal(ev.re, 'fast');
  const rx = s.msgs[s.msgs.length - 1];
  assert.equal(rx.why, 'fast');
  assert.equal(rx.sentAt, s.t);             // the same instant
  assert.ok(s.rows.findIndex((r) => r.m === s.msgs.length - 1) > s.rows.findIndex((r) => r.m === s.ev.m));
  const rto = run({})[7];                   // the timer: its note row, then the resend
  assert.equal(rto.ev.kind, 'rto');
  const noteRow = rto.rows.findIndex((r) => r.note === 0);
  assert.equal(rto.rows[noteRow + 1].m, rto.msgs.length - 1);
  assert.equal(rto.msgs[rto.msgs.length - 1].sentAt, rto.notes[0].at);
});

test('time never runs backwards, and every send of the window precedes the first arrival', () => {
  for (const over of Object.values(PRESETS)) for (const rtt of [100, 300]) {
    const states = run(Object.assign({}, over, { rtt }));
    for (let i = 1; i < states.length; i++) assert.ok(states[i].t >= states[i - 1].t);
    const w = states[1];
    assert.ok(w.t < Math.min(...w.msgs.map((m) => m.at)));
  }
});

// ── rules ──

test('rule 1: the ACK number is the next byte B expects (URM ch13 Primjer 4)', () => {
  const s = run({})[2];
  assert.equal(s.msgs[s.ev.m].seq, 1000);
  assert.equal(s.rcvNxt, 1500);
  assert.equal(acks(s)[0].n, 1500);
});

test('rule 2: a segment after a gap repeats the ACK (duplicate)', () => {
  const s = run({})[4];
  assert.equal(s.msgs[s.ev.m].seq, 2000);
  assert.deepEqual(acks(s).map((a) => a.n), [1500, 1500]);
  const after = run({})[6];
  assert.equal(after.msgs[after.ev.m].dup, 1);
});

test('rule 3: B holds data after the gap; the ACK jumps over it once the gap is filled (URM ch15 Primjer 5)', () => {
  const states = run({ flow: 'fast' });
  assert.deepEqual(states[6].ooo, [[4875, 6000]]);
  assert.deepEqual(acks(states.at(-1)).map((a) => a.n), [4500, 4500, 4500, 4500, 6000]);
  const fill = states[11];
  assert.equal(fill.msgs[fill.ev.m].re, 'fills');
  assert.equal(fill.rcvNxt, 6000);
  assert.deepEqual(fill.ooo, []);
});

test('rule 3, off: B discards what arrives after a gap and acks only what is in order', () => {
  const states = run({ flow: 'fast', bufferOoo: false });
  assert.deepEqual(states[6].ooo, []);
  assert.deepEqual(states[6].discarded, [[4875, 5250], [5250, 5625], [5625, 6000]]);
  assert.equal(states[11].rcvNxt, 4875);
  assert.deepEqual(acks(states.at(-1)).map((a) => a.n), [4500, 4500, 4500, 4500, 4875, 5250, 5625, 6000]);
});

test('rule 4: the third duplicate ACK resends at once, well before the timer', () => {
  const s = last({ flow: 'fast' });
  const r = retx(s);
  assert.equal(r.length, 1);
  assert.equal(r[0].seq, 4500);
  assert.equal(r[0].why, 'fast');
  assert.equal(r[0].sentAt, 140);
  assert.ok(r[0].sentAt < 1100);
  assert.equal(s.notes.length, 0);
});

test('rule 4: two duplicate ACKs are not enough; the timer resends', () => {
  const s = last({ flow: 'fast', lose: 's3' });   // 4875 lost: only 5250 and 5625 come after it
  assert.equal(Math.max(...acks(s).map((a) => a.dup)), 2);
  const r = retx(s);
  assert.equal(r.length, 1);
  assert.equal(r[0].why, 'rto');
  const one = last({});                            // book-rto: one duplicate only
  assert.equal(Math.max(...acks(one).map((a) => a.dup)), 1);
  assert.equal(retx(one)[0].why, 'rto');
});

test('rule 4: fast retransmit fires once; a fourth duplicate resends nothing', () => {
  const s = last({ flow: 'five', lose: 's1' });   // 1500 … 3000 arrive after the gap: four duplicates of ACK 1000
  const d = acks(s).filter((a) => a.dup);
  assert.deepEqual(d.map((a) => [a.dup, a.re]), [[1, 'dup'], [2, 'dup'], [3, 'fast'], [4, 'dup']]);
  assert.equal(retx(s).filter((m) => m.why === 'fast').length, 1);
});

test('rule 4: a new ACK clears the duplicate count; an ACK with nothing outstanding is no duplicate', () => {
  const states = run({});
  assert.equal(states[6].dupCount, 1);
  assert.equal(states.at(-1).dupCount, 0);
  assert.equal(run({ flow: 'fast', bufferOoo: false })[12].dupCount, 0);
  const s = structuredClone(states.at(-1));   // everything acknowledged; one more ACK 2500 arrives
  s.msgs.push({ id: 'x', k: 'ack', n: 2500, ackNo: 9, sentAt: s.t, at: s.t + 50, fate: 'flight', re: null, dup: 0, sample: null });
  s.rows.push({ m: s.msgs.length - 1 });
  const after = logic.step(s, 10, P({}));
  assert.equal(after.msgs.at(-1).re, 'old');
  assert.equal(after.dupCount, 0);
});

test('rule 4b: while recovering, a partial ACK resends the next missing segment at once', () => {
  const s = last({ flow: 'fast', bufferOoo: false });
  assert.deepEqual(retx(s).map((m) => [m.seq, m.why]), [[4500, 'fast'], [4875, 'partial'], [5250, 'partial'], [5625, 'partial']]);
  // with the buffer on there is no partial ACK
  assert.ok(retx(last({ flow: 'fast' })).every((m) => m.why !== 'partial'));
});

test('rule 4b after a timeout; the backed-off RTO stays when a new ACK restarts the timer', () => {
  const s = last({ lose: 's1', bufferOoo: false });   // no duplicates can reach three: the timer resends 1000
  assert.deepEqual(retx(s).map((m) => [m.seq, m.why]), [[1000, 'rto'], [1500, 'partial'], [2000, 'partial']]);
  assert.deepEqual(s.timers.slice(1).map((tm) => tm.rto), s.timers.slice(1).map(() => 2000));
  assert.equal(s.rto, 2000);
});

test('rule 3: B acks a copy of data it already has, buffer on or off', () => {
  for (const bufferOoo of [true, false]) {
    const s = last({ flow: 'five', lose: 'a5', bufferOoo });
    assert.equal(retx(s)[0].re, 'already');
  }
});

test('rule 5: the timer restarts on each new ACK and resends the oldest unacknowledged segment', () => {
  const states = run({});
  assert.equal(states[1].rtoDeadline, 1000);    // started by the first send at 0 ms
  assert.equal(states[5].rtoDeadline, 1100);    // ACK 1500 at 100 ms restarts it (RFC 6298 §5.3)
  assert.equal(states[6].rtoDeadline, 1100);    // a duplicate does not
  const s = states[7];
  assert.equal(s.ev.kind, 'rto');
  assert.equal(s.t, 1100);
  assert.equal(s.msgs.at(-1).seq, 1500);
  assert.equal(s.msgs.at(-1).why, 'rto');
  assert.deepEqual(acks(states.at(-1)).map((a) => a.n), [1500, 1500, 2500]);
  assert.equal(states.at(-1).rtoDeadline, null); // stopped when everything is acknowledged (§5.2)
  // the chart's bars: started at the first send, restarted at ACK 1500, expired at the note, stopped at ACK 2500
  assert.deepEqual(states.at(-1).timers.map((tm) => [tm.from, tm.to, tm.rto, tm.end]),
    [[0, 2, 1000, 'stopped'], [3, 5, 1000, 'expired'], [6, 7, 2000, 'stopped']]);
});

test('rule 6: each timeout doubles the RTO: 1 s, then +2 s, then +4 s (RFC 6298 §5.5)', () => {
  const s = last({ loseRetx: 2 });
  assert.deepEqual(s.notes.map((n) => [n.at, n.rto, n.next]), [[1100, 1000, 2000], [3100, 2000, 4000], [7100, 4000, 8000]]);
  assert.deepEqual(retx(s).map((m) => m.tx), [1, 2, 3]);
  assert.equal(acks(s).at(-1).n, 2500);
  assert.equal(s.t, 7200);
});

test('rule 6: the backoff stops at the cap', () => {
  const s = structuredClone(run({ loseRetx: 2 })[10]);   // timer due at 7100 with RTO 4 s
  s.rto = 40000;
  assert.equal(logic.RTO_MAX, 60000);
  const after = logic.step(s, 11, P({ loseRetx: 2 }));
  assert.equal(after.rto, logic.RTO_MAX);
  assert.equal(after.notes.at(-1).next, logic.RTO_MAX);
  const again = structuredClone(after);
  again.msgs.at(-1).fate = 'lost';
  const third = logic.step(again, 12, P({ loseRetx: 2 }));
  assert.equal(third.ev.kind, 'rto');
  assert.equal(third.rto, logic.RTO_MAX);
});

test('rule 7: a later cumulative ACK covers a lost one; nothing is resent', () => {
  const s = last({ flow: 'five', lose: 'a2' });
  assert.equal(acks(s)[1].n, 2000);
  assert.equal(acks(s)[1].fate, 'lost');
  assert.equal(retx(s).length, 0);
  assert.equal(s.notes.length, 0);
  assert.equal(s.sndUna, 3500);
});

test('rule 7: a lost last ACK is recovered by the timer; B acks the copy it already has', () => {
  const s = last({ flow: 'five', lose: 'a5' });
  const r = retx(s);
  assert.equal(r.length, 1);
  assert.equal(r[0].seq, 3000);
  assert.equal(r[0].re, 'already');
  assert.equal(acks(s).at(-1).n, 3500);
});

test('rule 8: Karn: no RTT sample from an ACK for a resent segment', () => {
  assert.equal(acks(last({}))[0].sample, 100);
  assert.equal(acks(last({ rtt: 300 }))[0].sample, 300);
  assert.equal(acks(last({})).at(-1).sample, 'karn');
  assert.equal(acks(last({ flow: 'fast' })).at(-1).sample, 'karn');
  assert.ok(acks(last({ flow: 'five', lose: 'a2' })).filter((a) => a.sample != null).every((a) => a.sample === 100));
});

// ── the loss settings: applied from the next step ──

test('a loss changed at step n keeps steps 0 … n and acts on later steps only', () => {
  const p1 = P({ flow: 'fast' });
  const n = 4;   // 4125 arrived, 4500 lost, 4875 kept
  const p2 = P({ flow: 'fast', lose: 's1', keep: logic.lostBy(p1, n).join(','), from: n });
  assert.deepEqual(logic.lostBy(p1, n), ['s4500.0']);
  for (let i = 0; i <= n; i++) assert.deepEqual(kit.stateAt(logic, p2, i), kit.stateAt(logic, p1, i));
  // the boundary: 4875 arrives in step n itself; losing it now must not change step n
  const p4 = P({ flow: 'fast', lose: 's3', keep: logic.lostBy(p1, n).join(','), from: n });
  assert.equal(kit.stateAt(logic, p1, n).msgs[kit.stateAt(logic, p1, n).ev.m].seq, 4875);
  assert.deepEqual(kit.stateAt(logic, p4, n), kit.stateAt(logic, p1, n));
  // s1 (4125) arrived before the change: losing it now changes nothing; 4500 stays lost
  const s = last({ flow: 'fast', lose: 's1', keep: 's4500.0', from: n });
  assert.equal(s.msgs.find((m) => m.id === 's4125.0').fate, 'arrived');
  assert.equal(s.msgs.find((m) => m.id === 's4500.0').fate, 'lost');
  // a segment still on the way at step n can still be lost
  const p3 = { flow: 'fast', lose: 's4', keep: 's4500.0', from: n };
  const st = run(p3);
  assert.equal(st.at(-1).msgs.find((m) => m.id === 's5250.0').fate, 'lost');
  assert.ok(stepOf(st, 's5250.0') > n);
});

test('the victim\'s first retransmissions are lost too, others are not', () => {
  const s = last({ flow: 'fast', loseRetx: 1 });
  assert.deepEqual(segs(s).filter((m) => m.seq === 4500).map((m) => [m.tx, m.fate]), [[0, 'lost'], [1, 'lost'], [2, 'arrived']]);
  assert.ok(segs(s).filter((m) => m.seq !== 4500).every((m) => m.fate === 'arrived'));
  // an ACK victim has no retransmissions: loseRetx changes nothing
  assert.deepEqual(last({ flow: 'five', lose: 'a2', loseRetx: 2 }), last({ flow: 'five', lose: 'a2' }));
});

// ── presets and the scene ──

test('presets: steps and numbers (SPEC.md)', () => {
  const steps = Object.fromEntries(Object.entries(PRESETS).map(([id, o]) => [id, logic.steps(P(o))]));
  assert.deepEqual(steps, { 'book-rto': 9, 'book-fast': 12, 'ack-lost': 11, backoff: 13, 'no-buffer': 18 });
  for (const [id, o] of Object.entries(PRESETS)) assert.ok(last(o).done, id + ' ends with everything acknowledged');
  assert.deepEqual(logic.FLOWS.fast, { start: 4125, len: 375, count: 5 });
  assert.equal(logic.endOf(logic.FLOWS.fast), 6000);
  assert.deepEqual(segs(last({})).filter((m) => m.tx === 0).map((m) => [m.seq, m.sentAt]), [[1000, 0], [1500, 10], [2000, 20]]);
});

test('RTT 300 ms: the same exchange, slower', () => {
  const a = last({ flow: 'fast' }), b = last({ flow: 'fast', rtt: 300 });
  assert.deepEqual(acks(a).map((x) => x.n), acks(b).map((x) => x.n));
  assert.equal(b.t, 640);
  assert.equal(retx(b)[0].sentAt, 340);
});

test('every combination stays within 20 steps; timer bars never overlap', () => {
  for (const flow of Object.keys(logic.FLOWS)) for (const lose of logic.LOSE) for (const loseRetx of [0, 1, 2])
    for (const bufferOoo of [true, false]) for (const rtt of [100, 300]) {
      const o = { flow, lose, loseRetx, bufferOoo, rtt };
      const n = logic.steps(P(o));
      assert.ok(n >= 2 && n <= logic.MAX_STEPS, JSON.stringify(o));
      const s = kit.stateAt(logic, P(o), n);
      s.timers.forEach((tm, i) => {
        if (i) assert.ok(tm.from > s.timers[i - 1].to, 'timers ' + JSON.stringify(o));
        assert.ok(tm.from < s.rows.length);
      });
      if (n < logic.MAX_STEPS) assert.ok(s.done, JSON.stringify(o));
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ flow: 'fast' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
