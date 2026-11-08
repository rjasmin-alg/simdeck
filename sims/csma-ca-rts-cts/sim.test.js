// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for csma-ca-rts-cts's model. Run: node --test sims/csma-ca-rts-cts/sim.test.js
// Rules and numbers: SPEC.md. Scene: URM ch. 17, Primjer 1 (A — B — C, A and C hidden from each other).
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => logic.simulate(P(over));
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);

const PRESETS = {
  'hidden-no-rts': {},
  'hidden-rts': { rtscts: true, backoffC: 5 },
  'not-hidden': { hidden: false, backoffA: 3, backoffC: 5 },
  'rts-collision': { rtscts: true },
  threshold: { rtscts: true, threshold: 3, dataA: 2, dataC: 5, backoffC: 5 }
};

// one letter per slot for x: R C D A for a frame x sends, N for NAV, a digit for the counter after the slot,
// '=' for a frozen counter, '·' for anything else
const row = (r, x) => r.slots.map((s) => {
  if (s.sends[x]) return s.sends[x].kind[0];
  const c = s.cells[x];
  if (!c) return '·';
  if (c.nav) return 'N';
  if (c.k === 'count') return c.bo > 9 ? '+' : String(c.bo);
  if (c.k === 'freeze' || c.k === 'wait') return '=';
  if (c.k === 'difs') return 'd';
  return '·';
}).join('');
// what B hears: A or C, X for garbage, - while B sends, . for silence
const atB = (r) => r.slots.map((s) => (s.sends.B ? '-' : s.garbled.B ? 'X' : s.heard.B[0] || '.')).join('');
const evs = (r, e) => r.slots.flatMap((s) => s.events.filter((x) => x.e === e).map((x) => Object.assign({ n: s.n }, x)));

// ── tie-breaks first ──

test('rule 8: counters that reach 0 in the same slot both send in the next one, even when A and C hear each other', () => {
  for (const hidden of [true, false]) {
    const r = run({ hidden, backoffA: 3, backoffC: 3 });
    const starts = evs(r, 'start').filter((e) => e.k === 1);
    assert.deepEqual(starts.map((e) => [e.who, e.n]), [['A', 5], ['C', 5]], `hidden=${hidden}`);
    assert.equal(r.slots[4].garbled.B, true);
  }
});

test('rule 8: with RTS/CTS the tie costs one slot of garbage at B, without it the whole DATA frame', () => {
  const plain = run({});
  const rts = run({ rtscts: true });
  assert.equal(atB(plain).slice(3, 8), 'XXXX.');
  assert.equal(atB(rts).slice(3, 5), 'X.');
  assert.equal(plain.slots[plain.total - 1].lostSlots, 4);
  assert.equal(rts.slots[rts.total - 1].lostSlots, 1);
  // both time out right after their frame, with CW doubled to 31, in both cases
  assert.deepEqual(evs(plain, 'timeout').map((e) => [e.who, e.n, e.kind, e.cw]), [['A', 8, 'ACK', 31], ['C', 8, 'ACK', 31]]);
  assert.deepEqual(evs(rts, 'timeout').map((e) => [e.who, e.n, e.kind, e.cw]), [['A', 5, 'CTS', 31], ['C', 5, 'CTS', 31]]);
});

test('a NAV is never lowered, and a station never sets NAV from its own exchange', () => {
  // not hidden, RTS/CTS on: C hears A's RTS (NAV to 4 + 6 = 10) and then B's CTS (5 + 5 = 10, not higher)
  const r = run({ hidden: false, rtscts: true, backoffA: 2, backoffC: 5 });
  const navs = evs(r, 'nav');
  assert.deepEqual(navs.filter((e) => e.n <= 5).map((e) => [e.who, e.kind, e.until]), [['C', 'RTS', 10]]);
  assert.ok(navs.every((e) => e.who !== e.owner));
});

// ── one test per rule ──

test('rule 1: a station hears nothing while it sends, even a frame from a station in range', () => {
  // not hidden, the same draw: A and C send at once in range of each other; neither hears the other
  const tie = run({ hidden: false, backoffA: 3, backoffC: 3 });
  assert.deepEqual(tie.slots[4].heard.A, []);
  assert.deepEqual(tie.slots[4].heard.C, []);
  for (const over of [{}, { hidden: false, backoffA: 3, backoffC: 3 }, { hidden: false, rtscts: true }]) {
    const r = run(over);
    for (const s of r.slots) for (const x of ['A', 'B', 'C']) if (s.sends[x]) assert.deepEqual(s.heard[x], [], `slot ${s.n} ${x}`);
  }
});

test('rule 2: DIFS, then one count per idle slot; the slot after 0 sends; counter 0 sends right after DIFS', () => {
  const r = run({ hidden: false, backoffA: 3, backoffC: 5 });
  assert.equal(row(r, 'A').slice(0, 5), 'd210D');
  const z = run({ backoffA: 0, backoffC: 9 });
  assert.equal(row(z, 'A').slice(0, 2), 'dD');
});

test('rule 2: a busy slot freezes the counter; after a new DIFS it resumes where it stopped', () => {
  const r = run(PRESETS['not-hidden']);
  // C: DIFS, counts 4 3 2, hears A's DATA (5–8) and B's ACK (9): frozen at 2; DIFS in 10, then 1 0, DATA from 13
  assert.equal(row(r, 'C'), 'd432=====d10DDDD·');
  assert.deepEqual(evs(r, 'freeze').map((e) => [e.who, e.n, e.bo]), [['C', 5, 2]]);
  assert.deepEqual(evs(r, 'difs').filter((e) => e.resume).map((e) => [e.who, e.n, e.bo]), [['C', 10, 2]]);
});

test('rule 3: carrier sense is local: the hidden station counts on while the other one sends', () => {
  const r = run({});
  // after the retry draws (A 2, C 7) A sends DATA 12–15; C, not hearing A, counts 4 3 2 1 meanwhile
  assert.equal(row(r, 'C').slice(11, 15), '4321');
  assert.equal(row(r, 'C')[15], '=', 'B\'s ACK in 16 is heard by C: frozen');
  assert.deepEqual(evs(r, 'unheard').map((e) => [e.who, e.n]), [['C', 12]]);
  // the same draws with A and C in range: C freezes as soon as A starts
  const h = run({ hidden: false });
  assert.ok(evs(h, 'unheard').length === 0);
});

test('rule 3: NAV makes the medium busy though the station hears nothing', () => {
  const r = run(PRESETS['hidden-rts']);
  // C has NAV 6–10 (from the CTS in 5) and hears nothing of A's DATA in 6–9, yet does not count
  for (let n = 6; n <= 9; n++) {
    assert.deepEqual(r.slots[n - 1].heard.C, [], `slot ${n}`);
    assert.equal(r.slots[n - 1].cells.C.nav, true);
    assert.equal(r.slots[n - 1].sta.C.bo, 2);
  }
});

test('rule 4: B acknowledges an intact DATA in the next slot; the sender is done then', () => {
  const r = run(PRESETS['not-hidden']);
  assert.equal(atB(r), '....AAAA-...CCCC-');
  assert.deepEqual(evs(r, 'delivered').map((e) => [e.who, e.n]), [['A', 9], ['C', 17]]);
});

test('rule 4: CW doubles after every failure, 15 → 31 → 63 … and stops at 1023', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(logic.cwAfter), [15, 31, 63, 127, 255, 511, 1023, 1023]);
  for (let seed = 1; seed <= 99; seed++) {
    for (const cw of [15, 31, 1023]) {
      const d = logic.draw(seed, 'A', 2, cw);
      assert.ok(Number.isInteger(d) && d >= 0 && d <= cw);
      assert.equal(logic.draw(seed, 'A', 2, cw), d, 'same seed, same draw');
    }
  }
});

test('rule 5: overlap at B is garbage; no ACK; neither sender heard anything while sending', () => {
  const r = run({});
  assert.deepEqual(evs(r, 'garbled').map((e) => [e.from, e.kind, e.n]), [['A', 'DATA', 7], ['C', 'DATA', 7]]);
  assert.ok(r.frames.filter((f) => f.k === 1).every((f) => f.ok === false));
  assert.ok(!r.frames.some((f) => f.kind === 'ACK' && f.start === 8));
  for (let n = 4; n <= 7; n++) { assert.deepEqual(r.slots[n - 1].heard.A, []); assert.deepEqual(r.slots[n - 1].heard.C, []); }
});

test('rule 6: C never hears A, but hears B\'s CTS and sets NAV = end + DATA + ACK', () => {
  const r = run(PRESETS['hidden-rts']);
  assert.ok(r.slots.every((s) => !s.heard.C.includes('A')));
  assert.deepEqual(evs(r, 'nav').map((e) => [e.who, e.kind, e.n, e.dur, e.until]), [['C', 'CTS', 5, 5, 10], ['A', 'CTS', 15, 5, 20]]);
  assert.equal(logic.duration('RTS', 4), 6);
  assert.equal(logic.duration('CTS', 4), 5);
  assert.equal(atB(r), '...A-AAAA-...C-CCCC-');
  assert.equal(r.slots[r.total - 1].lostSlots, 0);
});

test('rule 6: a garbled RTS sets no NAV and gets no CTS', () => {
  const r = run({ rtscts: true, hidden: false });
  // in range of each other, both RTS in 4: each sends, so neither decodes the other's RTS; B hears garbage
  assert.ok(evs(r, 'nav').every((e) => e.n > 5));
  assert.ok(!r.frames.some((f) => f.kind === 'CTS' && f.start === 5));
});

test('rule 7: RTS only for frames above RTS_Threshold; 0 means every frame, RTS/CTS off means none', () => {
  assert.equal(logic.usesRts({ rtscts: true, threshold: 3 }, 2), false);
  assert.equal(logic.usesRts({ rtscts: true, threshold: 3 }, 3), false);
  assert.equal(logic.usesRts({ rtscts: true, threshold: 3 }, 4), true);
  assert.equal(logic.usesRts({ rtscts: true, threshold: 0 }, 2), true);
  assert.equal(logic.usesRts({ rtscts: false, threshold: 0 }, 6), false);
  const r = run(PRESETS.threshold);
  assert.deepEqual(evs(r, 'start').map((e) => [e.who, e.kind, e.size]), [['A', 'DATA', 2], ['C', 'RTS', 5]]);
});

test('rule 5: a partial overlap spoils both frames, the one already on air and the one that starts into it', () => {
  // A's DATA 4–7, C (counter 4, not hearing A) starts DATA in 6: B hears A, A, noise, noise, C, C
  const r = run({ backoffC: 4 });
  assert.equal(atB(r).slice(0, 10), '...AAXXCC.');
  assert.ok(r.frames.filter((f) => f.k === 1).every((f) => f.ok === false));
  assert.deepEqual(evs(r, 'timeout').map((e) => [e.who, e.n]), [['A', 8], ['C', 10]]);
});

test('rule 6: NAV uses the size of the frame being reserved, not the listener\'s own', () => {
  // C sends a 6-slot frame with RTS/CTS; A (2-slot frame) hears the CTS in 4: NAV = 4 + 6 + 1 = 11, the ACK's slot
  const r = run({ rtscts: true, dataA: 2, dataC: 6, backoffA: 6, backoffC: 1 });
  assert.deepEqual(evs(r, 'nav').filter((e) => e.n === 4).map((e) => [e.who, e.dur, e.until]), [['A', 7, 11]]);
  assert.deepEqual(evs(r, 'delivered').map((e) => [e.who, e.n]), [['C', 11], ['A', 21]]);
});

test('rule 7: in a run, a frame of exactly RTS_Threshold slots goes without RTS', () => {
  const kinds = (th) => evs(run({ rtscts: true, threshold: th, backoffC: 5 }), 'start').filter((e) => e.k === 1).map((e) => e.who + e.kind);
  assert.deepEqual(kinds(3), ['ARTS', 'CRTS']);
  assert.deepEqual(kinds(4), ['ADATA', 'CDATA']);
});

test('"unheard" is only for a station that is counting or passing DIFS, never one held by NAV', () => {
  const r = run(PRESETS['hidden-rts']);
  assert.deepEqual(evs(r, 'unheard').map((e) => [e.who, e.n, e.kind]), [['C', 4, 'RTS']]);
  for (const e of evs(run(PRESETS['rts-collision']), 'unheard')) {
    const c = run(PRESETS['rts-collision']).slots[e.n - 1].cells[e.who];
    assert.ok(['count', 'difs'].includes(c.k) && !c.nav, `slot ${e.n}`);
  }
});

test('a step keeps the events of its first folded slot (not-hidden, step 4: C resumes in slot 10)', () => {
  const s = at(PRESETS['not-hidden'], 4);
  assert.deepEqual([s.from, s.t], [9, 10]);
  assert.deepEqual(s.events.map((e) => [e.n, e.e, e.who, e.resume]), [[10, 'difs', 'C', true]]);
});

test('limits: 48 slots, 20 steps; a run stopped at the slot limit is not reported finished', () => {
  assert.equal(logic.maxSlots, 48);
  assert.equal(logic.maxSteps, 20);
  const end = (p) => at(p, stepsOf(p));
  assert.equal(end({}).finished, true);
  assert.equal(end({}).t, 23);
});

// ── the presets' numbers (SPEC.md table) ──

test('presets: slots, steps and outcomes as in SPEC.md', () => {
  const want = {
    'hidden-no-rts': { total: 23, steps: 8, A: 16, C: 23, lost: 4 },
    'hidden-rts': { total: 20, steps: 10, A: 10, C: 20, lost: 0 },
    'not-hidden': { total: 17, steps: 6, A: 9, C: 17, lost: 0 },
    'rts-collision': { total: 27, steps: 12, A: 15, C: 27, lost: 1 },
    threshold: { total: 16, steps: 8, A: 6, C: 16, lost: 0 }
  };
  for (const [id, w] of Object.entries(want)) {
    const r = run(PRESETS[id]);
    const end = r.slots[r.total - 1];
    assert.deepEqual({ total: r.total, steps: stepsOf(PRESETS[id]), A: end.sta.A.delivered, C: end.sta.C.delivered, lost: end.lostSlots }, w, id);
    assert.equal(r.finished, true, id);
  }
  assert.deepEqual(run({}).draws, { A: [2, 2], C: [2, 7] });
  assert.equal(stepsOf({}), 8, 'sim.json steps');
});

test('hidden-no-rts: the timeline slot by slot', () => {
  const r = run({});
  assert.equal(row(r, 'A'), 'd10DDDD·d10DDDD········');
  assert.equal(row(r, 'C'), 'd10DDDD·d654321=d0DDDD·');
  assert.equal(atB(r), '...XXXX....AAAA-..CCCC-');
});

test('rts-collision: RTS frames collide, then A goes first and C waits on its NAV', () => {
  const r = run(PRESETS['rts-collision']);
  assert.equal(row(r, 'A'), 'd10R·d10R·DDDD········NNNNN');
  assert.equal(row(r, 'C'), 'd10R·d654=NNNNNd3210R·DDDD·');
  assert.equal(atB(r), '...X....A-AAAA-.....C-CCCC-');
  assert.deepEqual(evs(r, 'nav').map((e) => [e.who, e.n, e.until]), [['C', 10, 15], ['A', 22, 27]]);
});

test('every run stays within 20 steps and 48 slots, and every step ends on a key slot', () => {
  for (const rtscts of [false, true]) for (const hidden of [false, true]) for (const a of [0, 7, 15]) for (const c of [0, 7, 15]) for (const seed of [1, 50, 99]) {
    const p = { rtscts, hidden, backoffA: a, backoffC: c, seed, dataA: 6, dataC: 6 };
    const r = run(p);
    assert.ok(r.total <= logic.maxSlots);
    const n = stepsOf(p);
    assert.ok(n >= 1 && n <= 20);
    assert.equal(at(p, n).t, r.keys[n - 1]);
  }
});

test('a step shows the events of the slots folded into it, in slot order', () => {
  const s = at({}, 2);
  assert.equal(s.from, 1);
  assert.equal(s.t, 4);
  assert.deepEqual(s.events.map((e) => [e.n, e.e, e.who || '']), [[3, 'zero', 'A'], [3, 'zero', 'C'], [4, 'start', 'A'], [4, 'start', 'C'], [4, 'collide', '']]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pre of Object.values(PRESETS)) {
    for (let n = 0; n <= stepsOf(pre); n++) {
      const s = at(pre, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['rts-collision']);
  const steps = stepsOf(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and matches the presets tested here', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, stepsOf({}), 'meta.steps matches the model');
  const found = [...html.matchAll(/id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.deepEqual(found.map((m) => m[1]), Object.keys(PRESETS));
  for (const m of found) {
    const params = Function('return {' + m[2] + '}')();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(P(params), P(PRESETS[m[1]]), m[1]);
  }
});
