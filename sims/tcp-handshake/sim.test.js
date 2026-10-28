// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tcp-handshake's model. Run: node --test sims/tcp-handshake/
// Numbers from the URM book, ch. 13 (13-transportni-sloj.md), Primjer 3 (X = 4000, Y = 9500), the fragment's
// exercises (trostruko-rukovanje.html: X = 100, Y = 500) and the chapter's capture (2762080915, 2945746186).
// Edges and tie-breaks first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const wire = (s) => s.segs.map((g) => [g.from + '>' + g.to, g.flags.join('+'), g.seq, g.ack]);

// ── edges and tie-breaks ──

test('32 bits: X = 2^32 - 1 makes the acknowledgment 0, not 2^32', () => {
  const s = at({ isn: 'wrap' }, 3);
  assert.equal(s.x, 4294967295);
  assert.equal(s.segs[1].ack, 0);
  assert.equal(s.segs[2].seq, 0);
  assert.equal(s.B.rcvNxt, 0);
  assert.equal(s.A.sndNxt, 0);
  assert.equal(s.wrapsX, true);
  assert.equal(s.wrapsY, false);
  assert.equal(s.established, true);
});

test('seqAdd works modulo 2^32 both ways and leaves smaller numbers alone', () => {
  assert.equal(logic.seqAdd(4294967295, 1), 0);
  assert.equal(logic.seqAdd(4294967295, 2), 1);
  assert.equal(logic.seqAdd(0, -1), 4294967295);
  assert.equal(logic.seqAdd(4000, 1), 4001);
  assert.equal(logic.seqAdd(4294967296, 0), 0);
});

test('equal ISNs (X = Y) still give each side its own numbers and the same rule', () => {
  const s = at({ x: 4000, y: 4000 }, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 4000, null], ['B>A', 'SYN+ACK', 4000, 4001], ['A>B', 'ACK', 4001, 4001]]);
  assert.equal(s.A.rcvNxt, 4001);
  assert.equal(s.B.rcvNxt, 4001);
  assert.equal(s.established, true);
});

test('X = 0 and Y = 0 are valid ISNs (the slider\'s lower end)', () => {
  const s = at({ x: 0, y: 0 }, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 0, null], ['B>A', 'SYN+ACK', 0, 1], ['A>B', 'ACK', 1, 1]]);
});

test('the named pairs override the sliders; an own value out of range is taken modulo 2^32', () => {
  assert.deepEqual(logic.isns(P({ isn: 'real', x: 1, y: 2 })), { x: 2762080915, y: 2945746186 });
  assert.deepEqual(logic.isns(P({ isn: 'wrap', x: 1, y: 2 })), { x: 4294967295, y: 9500 });
  assert.deepEqual(logic.isns(P({ isn: 'own', x: 4294967297, y: -1 })), { x: 1, y: 4294967295 });
});

test('an ACK for a number the receiver never sent does not confirm its ISN', () => {
  const segs = logic.segments(4000, 9500);
  const bad = [segs[0], Object.assign({}, segs[1], { ack: 4000 }), Object.assign({}, segs[2], { ack: 9500 })];
  const s = logic.sides(4000, 9500, bad, 3);
  assert.equal(s.A.acked, false);
  assert.equal(s.B.acked, false);
});

// ── rules ──

test('the book\'s example: SYN 4000; SYN+ACK 9500 / 4001; ACK 9501 (URM ch. 13, Primjer 3)', () => {
  const s = at({}, 3);
  assert.deepEqual(wire(s), [['A>B', 'SYN', 4000, null], ['B>A', 'SYN+ACK', 9500, 4001], ['A>B', 'ACK', 4001, 9501]]);
});

test('the fragment\'s exercise 1: X = 100, Y = 500 gives acknowledgments 101 and 501', () => {
  const s = at({ x: 100, y: 500 }, 3);
  assert.equal(s.segs[1].ack, 101);
  assert.equal(s.segs[2].ack, 501);
});

test('the capture\'s numbers: every acknowledgment is one more than the number it acknowledges', () => {
  const s = at({ isn: 'real' }, 3);
  assert.equal(s.segs[1].ack, 2762080916);
  assert.equal(s.segs[2].ack, 2945746187);
});

test('three messages carry four conceptual steps; steps 2 and 3 travel together in the SYN+ACK', () => {
  const segs = logic.segments(4000, 9500);
  assert.equal(segs.length, 3);
  assert.equal(logic.steps, 3);
  assert.deepEqual(segs.map((g) => g.concept), [[1], [2, 3], [4]]);
  assert.deepEqual(segs[1].flags, ['SYN', 'ACK']);
});

test('a SYN occupies one sequence number, a pure ACK none', () => {
  const segs = logic.segments(4000, 9500);
  assert.deepEqual(segs.map(logic.seqLen), [1, 1, 0]);
});

test('each side, step by step: what it sends next, what it expects, whether it is confirmed', () => {
  const side = (s) => ['A', 'B'].map((k) => [s[k].sndNxt, s[k].rcvNxt, s[k].acked]);
  assert.deepEqual(side(at({}, 0)), [[4000, null, false], [9500, null, false]]);
  // after the SYN: A has used X; B expects X+1
  assert.deepEqual(side(at({}, 1)), [[4001, null, false], [9500, 4001, false]]);
  // after the SYN+ACK: B has used Y; A expects Y+1 and knows B has its X
  assert.deepEqual(side(at({}, 2)), [[4001, 9501, true], [9501, 4001, false]]);
  // after the ACK: nothing new is used (the ACK takes no number); B knows A has its Y
  assert.deepEqual(side(at({}, 3)), [[4001, 9501, true], [9501, 4001, true]]);
});

test('the connection is established only after the third message', () => {
  assert.deepEqual([0, 1, 2, 3].map((n) => at({}, n).established), [false, false, false, true]);
});

test('the closing ACK carries seq X+1, the number B waits for (A\'s first data octet)', () => {
  for (const x of [0, 4000, 9999, 4294967295]) {
    const s = at({ isn: 'own', x }, 3);
    assert.equal(s.segs[2].seq, s.B.rcvNxt);
    assert.equal(s.segs[2].seq, logic.seqAdd(s.x, 1));
  }
});

test('the default is the book\'s example', () => {
  assert.deepEqual(logic.defaults, { isn: 'own', x: 4000, y: 9500, mode: 'open', closer: 'A' });
  assert.equal(logic.min, 0);
  assert.equal(logic.max, 9999);
});

// ── teardown (task tcp-teardown): FIN/ACK both ways, half close, TIME-WAIT ──
// RFC 9293 Figure 5, Figure 13, §3.4.2, §3.6, §3.6.1, §3.10.7.4; URM ch. 13 "TCP: zatvaranje veze". Numbers continue
// Primjer 3 (X = 4000, Y = 9500): both ends start ESTABLISHED, A sending from 4001, B from 9501.

const C = (mode, over) => P(Object.assign({ mode }, over));
const end = (mode, over) => { const p = C(mode, over); return at(p, logic.stepsFor(p)); };
const rows = (s) => s.chart.map((r) => r.timeout ? ['timeout', r.closed.join('')] :
  r.segs.map((g) => [g.from + '>' + g.to, g.flags.join('+') || 'data', g.seq, g.ack, g.len]));
const states = (s) => s.chart.map((r) => [r.after.A, r.after.B]);

test('tie-break: a FIN+ACK takes the closer from FIN-WAIT-1 straight to TIME-WAIT; three segments, not four', () => {
  const s = end('finack');
  assert.deepEqual(rows(s), [
    [['A>B', 'FIN', 4001, 9501, 0]],
    [['B>A', 'FIN+ACK', 9501, 4002, 0]],
    [['A>B', 'ACK', 4002, 9502, 0]],
    ['timeout', 'A']]);
  assert.deepEqual(states(s).slice(0, 2), [['FIN-WAIT-1', 'CLOSE-WAIT'], ['TIME-WAIT', 'LAST-ACK']]);
  assert.ok(!s.chart.some((r) => r.after.A === 'FIN-WAIT-2'), 'A never shows FIN-WAIT-2');
  assert.equal(s.chart.filter((r) => !r.timeout).length, 3);
});

test('tie-break: the same FIN without the ACK of A\'s FIN leaves A in CLOSING, not TIME-WAIT', () => {
  const rx = { state: 'FIN-WAIT-1', sndNxt: 4002, rcvNxt: 9501, finSent: true };
  logic.receive(rx, { from: 'B', to: 'A', flags: ['FIN'], seq: 9501, ack: 4001, len: 0 });
  assert.equal(rx.state, 'CLOSING');
  assert.equal(rx.rcvNxt, 9502);
});

test('tie-break: simultaneous close: the two FINs cross, both CLOSING, both TIME-WAIT on the ACKs', () => {
  const s = end('simul');
  assert.deepEqual(rows(s), [
    [['A>B', 'FIN', 4001, 9501, 0], ['B>A', 'FIN', 9501, 4001, 0]],
    [['A>B', 'ACK', 4002, 9502, 0], ['B>A', 'ACK', 9502, 4002, 0]],
    ['timeout', 'AB']]);
  assert.deepEqual(states(s), [['CLOSING', 'CLOSING'], ['TIME-WAIT', 'TIME-WAIT'], ['CLOSED', 'CLOSED']]);
  assert.equal(s.closer, null);
  assert.equal(logic.stepsFor(C('simul', { closer: 'B' })), 3);
  assert.deepEqual(rows(end('simul', { closer: 'B' })), rows(s), 'the closer choice does not change a simultaneous close');
});

test('rule 1: CLOSE sends a FIN from the next number; the other end may still send', () => {
  const s = at(C('close'), 1);
  assert.deepEqual(rows(s), [[['A>B', 'FIN', 4001, 9501, 0]]]);
  assert.equal(s.ends.A.state, 'FIN-WAIT-1');
  assert.equal(logic.canSend(s.ends.B.state), true);
  assert.equal(logic.canSend(s.ends.A.state), false);
});

test('rule 2: a FIN takes one sequence number, so its ACK is FIN.seq + 1; a pure ACK takes none', () => {
  for (const mode of ['close', 'half', 'finack', 'simul']) {
    const s = end(mode);
    const segs = s.chart.flatMap((r) => r.segs);
    for (const fin of segs.filter((g) => g.flags.includes('FIN'))) {
      const acks = segs.filter((g) => g.from === fin.to && g.ack === logic.seqAdd(fin.seq, 1));
      assert.ok(acks.length >= 1, `${mode}: the FIN ${fin.seq} is acknowledged with ${fin.seq + 1}`);
    }
    assert.deepEqual(segs.filter((g) => g.flags.join() === 'ACK').map(logic.seqLen).filter((k) => k), []);
  }
  assert.equal(logic.seqLen({ flags: ['FIN'], len: 0 }), 1);
  const half = end('half');
  assert.deepEqual([half.ends.A.finSeq, half.ends.B.finSeq], [4001, 9701], 'the FIN takes the number after the data');
});

test('rule 3: A closes: FIN-WAIT-1, FIN-WAIT-2, TIME-WAIT; B: CLOSE-WAIT, LAST-ACK, CLOSED (close-client)', () => {
  const s = end('close');
  assert.deepEqual(rows(s), [
    [['A>B', 'FIN', 4001, 9501, 0]],
    [['B>A', 'ACK', 9501, 4002, 0]],
    [['B>A', 'FIN', 9501, 4002, 0]],
    [['A>B', 'ACK', 4002, 9502, 0]],
    ['timeout', 'A']]);
  assert.deepEqual(states(s), [
    ['FIN-WAIT-1', 'CLOSE-WAIT'], ['FIN-WAIT-2', 'CLOSE-WAIT'], ['TIME-WAIT', 'LAST-ACK'], ['TIME-WAIT', 'CLOSED'],
    ['CLOSED', 'CLOSED']]);
});

test('rule 3, mirrored: B closes first with the same numbers and ends in TIME-WAIT (close-server)', () => {
  const s = end('close', { closer: 'B' });
  assert.deepEqual(rows(s), [
    [['B>A', 'FIN', 9501, 4001, 0]],
    [['A>B', 'ACK', 4001, 9502, 0]],
    [['A>B', 'FIN', 4001, 9502, 0]],
    [['B>A', 'ACK', 9502, 4002, 0]],
    ['timeout', 'B']]);
  assert.deepEqual(states(s).map((x) => x.slice().reverse()), states(end('close')));
});

test('rule 3: an ACK that does not cover the FIN changes no state', () => {
  const rx = { state: 'FIN-WAIT-1', sndNxt: 4002, rcvNxt: 9501, finSent: true };
  logic.receive(rx, { from: 'B', to: 'A', flags: ['ACK'], seq: 9501, ack: 4001, len: 0 });
  assert.equal(rx.state, 'FIN-WAIT-1');
  const last = { state: 'LAST-ACK', sndNxt: 9502, rcvNxt: 4002, finSent: true };
  logic.receive(last, { from: 'A', to: 'B', flags: ['ACK'], seq: 4002, ack: 9501, len: 0 });
  assert.equal(last.state, 'LAST-ACK');
});

test('half close: after its FIN, A still receives 200 octets and acknowledges them; B\'s FIN then takes 9701', () => {
  const s = end('half');
  assert.deepEqual(rows(s), [
    [['A>B', 'FIN', 4001, 9501, 0]],
    [['B>A', 'ACK', 9501, 4002, 0]],
    [['B>A', 'data', 9501, 4002, 200]],
    [['A>B', 'ACK', 4002, 9701, 0]],
    [['B>A', 'FIN', 9701, 4002, 0]],
    [['A>B', 'ACK', 4002, 9702, 0]],
    ['timeout', 'A']]);
  assert.deepEqual(states(s)[2], ['FIN-WAIT-2', 'CLOSE-WAIT']);
  assert.equal(at(C('half'), 3).ends.A.rcvNxt, 9701);
  assert.equal(logic.canReceive('FIN-WAIT-1'), true);
  assert.equal(logic.canReceive('FIN-WAIT-2'), true);
  assert.equal(logic.canReceive('CLOSE-WAIT'), false);
});

test('rule 4: only the end that closed first passes TIME-WAIT, for 2 × MSL = 240 s; the timeout closes it', () => {
  assert.equal(logic.MSL, 120);
  for (const [mode, closer, tw] of [['close', 'A', 'A'], ['close', 'B', 'B'], ['half', 'A', 'A'], ['finack', 'A', 'A'], ['finack', 'B', 'B']]) {
    const s = end(mode, { closer });
    const passed = ['A', 'B'].filter((k) => s.chart.some((r) => r.after[k] === 'TIME-WAIT'));
    assert.deepEqual(passed, [tw], `${mode} ${closer}`);
    const before = at(C(mode, { closer }), logic.stepsFor(C(mode, { closer })) - 1);
    assert.equal(before.ends[tw].state, 'TIME-WAIT');
    assert.equal(s.ends[tw].state, 'CLOSED');
    assert.equal(s.chart.at(-1).timeout, true);
  }
});

test('each preset has the step count of the task: 5, 5, 7, 4, 3; the handshake keeps 3', () => {
  assert.deepEqual(['close', 'half', 'finack', 'simul', 'open'].map((m) => logic.stepsFor(C(m))), [5, 7, 4, 3, 3]);
  assert.equal(logic.stepsFor(C('close', { closer: 'B' })), 5);
  assert.equal(logic.steps, 3);
});

test('a close continues from the ISNs in use: X+1 and Y+1, modulo 2^32', () => {
  const small = at(C('close', { x: 100, y: 500 }), 4);
  assert.deepEqual(rows(small)[0], [['A>B', 'FIN', 101, 501, 0]]);
  assert.deepEqual(rows(small)[3], [['A>B', 'ACK', 102, 502, 0]]);
  const wrap = at(C('close', { isn: 'wrap' }), 4);
  assert.deepEqual(rows(wrap)[0], [['A>B', 'FIN', 0, 9501, 0]]);
  assert.deepEqual(rows(wrap)[1], [['B>A', 'ACK', 9501, 1, 0]]);
});

test('step 0 of a close: both ESTABLISHED, nothing sent, the handshake\'s end numbers', () => {
  const s = at(C('half'), 0);
  assert.deepEqual(s.chart, []);
  assert.deepEqual(['A', 'B'].map((k) => [s.ends[k].state, s.ends[k].sndNxt, s.ends[k].rcvNxt]),
    [['ESTABLISHED', 4001, 9501], ['ESTABLISHED', 9501, 4001]]);
});

test('closes: JSON-safe, replay equals stepping, extra steps change nothing', () => {
  for (const mode of ['close', 'half', 'finack', 'simul']) {
    for (const closer of ['A', 'B']) {
      const p = C(mode, { closer });
      const n = logic.stepsFor(p);
      let s = logic.initial(p);
      for (let k = 1; k <= n; k++) {
        s = logic.step(s, k, p);
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
        assert.deepEqual(kit.stateAt(logic, p, k), s);
      }
      assert.deepEqual(logic.analyze(p, n + 2), s);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const isn of logic.isnModes) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at({ isn, x: 123, y: 9876 }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ x: 777, y: 31 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
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

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(sets.length >= 6, 'found the presets');
  for (const body of sets) {
    for (const k of [...body.matchAll(/(\w+):/g)].map((m) => m[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const isn = body.match(/isn:\s*'(\w+)'/);
    assert.ok(isn && logic.isnModes.includes(isn[1]), 'preset isn is a mode');
    for (const m of body.matchAll(/\b([xy]):\s*(\d+)/g)) {
      const v = Number(m[2]);
      assert.ok(v >= logic.min && v <= logic.max, `preset ${m[1]} = ${v} is within the slider`);
    }
  }
});
