/* SPDX-License-Identifier: AGPL-3.0-or-later
   Tests for tcp-vs-udp-loss: tie-breaks first, then the rules of SPEC.md one by one, the presets' numbers, every
   random combination, then the generic block every sim keeps. Run: node --test sims/tcp-vs-udp-loss/sim.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over || {});
const run = (over) => logic.simulate(P(over));
const mask = (units) => units.reduce((a, k) => a + Math.pow(2, k - 1), 0);
const sends = (r) => r.tcp.sends.map((m) => `${m.unit}@${m.slot}${m.tx ? 'r' + m.tx : ''}${m.lost ? 'x' : ''}`).join(' ');
const acks = (r) => r.tcp.acks.map((a) => `${a.n}@${a.arrive}${a.dup ? 'd' : ''}`).join(' ');
const got = (d) => d.map((x) => `${x.unit}:${x.slot}`).join(' ');
const preset = (id) => logic.presets.find((x) => x.id === id).params;

// ── tie-breaks first ──

test('tie-break: units waiting behind a gap go up in the slot it is filled, after it, in sequence order', () => {
  const r = run({ n: 5, lose: mask([2]) });
  // unit 2 resent in slot 6, arrives 7; 3, 4, 5 arrived in 4, 5, 6 and wait
  assert.equal(got(r.tcp.delivered), '1:2 2:7 3:7 4:7 5:7');
  assert.deepEqual(r.tcp.delivered.map((d) => d.unit), [1, 2, 3, 4, 5]);
});

test('tie-break: a resend and a new unit arriving in the same slot are taken in sequence order, one ACK each', () => {
  const r = run({ n: 20, lose: mask([5, 13]) });
  // slot 10: the resent unit 5 and the new unit 9 arrive together; 5 first (fills, ACK 5000), then 9 (ACK 5500)
  const at10 = r.tcp.acks.filter((a) => a.slot === 10);
  assert.deepEqual(at10.map((a) => [a.of, a.n]), [[5, 5000], [9, 5500]]);
  assert.equal(got(r.tcp.delivered.filter((d) => d.slot === 10)), '5:10 6:10 7:10 8:10 9:10');
});

test('tie-break: an ACK arriving in the slot the RTO runs out wins (rto 2: nothing resent needlessly)', () => {
  const r = run({ n: 6, lose: 0, rto: 2 });
  assert.equal(r.tcp.retx, 0);
  assert.equal(r.tcp.finish, 7);
  // with a loss at rto 2: unit 3 is resent exactly 2 slots after its send
  assert.match(sends(run({ n: 4, lose: mask([3]), rto: 2 })), /3@5r1/);
});

test('tie-break: a resend leaves in the same slot as a new unit, listed first', () => {
  const r = run({ n: 20, lose: mask([5]) });
  const at9 = r.tcp.sends.filter((m) => m.slot === 9);
  assert.deepEqual(at9.map((m) => [m.unit, m.tx]), [[5, 1], [9, 0]]);
});

// ── the rules ──

test('rule 1: unit k first sent in slot k by both, octets from 1000 in steps of size', () => {
  for (const size of [100, 500, 1000]) {
    const r = run({ n: 4, lose: 0, size });
    assert.deepEqual(r.udp.sends.map((m) => [m.unit, m.slot, m.seq]), [1, 2, 3, 4].map((k) => [k, k, 1000 + (k - 1) * size]));
    assert.deepEqual(r.tcp.sends.map((m) => [m.unit, m.slot, m.seq]), [1, 2, 3, 4].map((k) => [k, k, 1000 + (k - 1) * size]));
  }
});

test('rule 2: one slot each way; the ACK for a unit sent in s reaches the sender in s + 2', () => {
  const r = run({ n: 3, lose: 0 });
  assert.deepEqual(r.tcp.sends.map((m) => m.arrive), [2, 3, 4]);
  assert.deepEqual(r.tcp.acks.map((a) => [a.slot, a.arrive]), [[2, 3], [3, 4], [4, 5]]);
  assert.deepEqual(r.udp.sends.map((m) => m.arrive), [2, 3, 4]);
});

test('rule 3: pattern loses the listed first sends, and the first resend only of units in lose2', () => {
  const r = run({ n: 6, lose: mask([2, 4]), lose2: mask([4]) });
  assert.deepEqual(r.tcp.sends.filter((m) => m.lost).map((m) => [m.unit, m.tx]), [[2, 0], [4, 0], [4, 1]]);
  assert.deepEqual(r.udp.missing, [2, 4]);
  // lose2 alone (unit not in lose) loses nothing
  assert.equal(run({ n: 6, lose: 0, lose2: mask([3]) }).tcp.sends.filter((m) => m.lost).length, 0);
});

test('rule 3: random mode loses the same first sends in TCP and UDP, deterministically, resends drawn too', () => {
  for (let seed = 1; seed <= 9; seed++) for (const loss of [0, 10, 25, 40]) {
    const p = { mode: 'random', seed, loss, n: 30 };
    const r = run(p);
    const tcpFirst = r.tcp.sends.filter((m) => m.tx === 0 && m.lost).map((m) => m.unit);
    assert.deepEqual(tcpFirst, r.udp.missing);
    assert.deepEqual(run(p), r);
    if (loss === 0) assert.equal(r.udp.missing.length, 0);
  }
  // the first-send draws do not depend on rto (resends come from their own stream)
  assert.deepEqual(run({ mode: 'random', seed: 4, loss: 30, n: 30, rto: 2 }).udp.missing,
    run({ mode: 'random', seed: 4, loss: 30, n: 30, rto: 8 }).udp.missing);
  // some resend is lost somewhere at 40 %
  assert.ok(run({ mode: 'random', seed: 2, loss: 40, n: 30, rto: 8 }).tcp.sends.some((m) => m.tx > 0 && m.lost));
  // the pattern masks are ignored in random mode
  assert.deepEqual(run({ mode: 'random', seed: 3, loss: 20, n: 20, lose: 0 }), run({ mode: 'random', seed: 3, loss: 20, n: 20, lose: mask([1, 2, 3]) }));
});

test('rule 4: UDP sends each datagram once, nothing goes back, delivers on arrival, finishes in N + 1', () => {
  const r = run({ n: 8, lose: mask([2, 8]) });
  assert.equal(r.udp.sends.length, 8);
  assert.ok(!('acks' in r.udp));
  assert.deepEqual(r.udp.delivered.map((d) => [d.unit, d.slot, d.arrived]), [1, 3, 4, 5, 6, 7].map((k) => [k, k + 1, k + 1]));
  assert.deepEqual(r.udp.missing, [2, 8]);
  assert.equal(r.udp.finish, 9);   // the last datagram is lost: still N + 1
});

test('rule 5: cumulative ACK; it repeats after a gap; in-order delivery only', () => {
  const r = run();   // book-example
  assert.equal(acks(r), '1500@3 1500@5d 2500@8');
  assert.equal(got(r.tcp.delivered), '1:2 2:7 3:7');
  // a held unit has arrived but is not delivered
  const d3 = r.tcp.delivered.find((d) => d.unit === 3);
  assert.deepEqual([d3.arrived, d3.slot], [4, 7]);
});

test('rule 5: an arrival after a gap is flagged held; in-order arrivals and resends are not', () => {
  const r = run({ n: 8, lose: mask([2, 3]) });
  const held = (k, tx) => r.tcp.sends.find((m) => m.unit === k && m.tx === tx).held === true;
  assert.equal(held(1, 0), false);
  for (const k of [4, 5, 6]) assert.equal(held(k, 0), true, `unit ${k}`);
  assert.equal(held(2, 1), false);   // the resend of the oldest gap goes up at once
  // after unit 2 is filled (slot 7), unit 3 is still missing: units arriving then are held too
  assert.equal(held(7, 0), true);
});

test('params: the defaults are SPEC.md\'s, t starts at the end', () => {
  assert.deepEqual(logic.defaults, { mode: 'pattern', n: 3, size: 500, loss: 10, seed: 1, rto: 4, lose: 2, lose2: 0, t: logic.END });
  assert.ok(logic.END >= 341, 't defaults to at least the longest run');
});

test('rule 6: only the oldest unacknowledged unit is resent, rto after its last send, doubling', () => {
  assert.equal(sends(run({ n: 10, lose: mask([4]), lose2: mask([4]) })), '1@1 2@2 3@3 4@4x 5@5 6@6 7@7 4@8r1x 8@8 9@9 10@10 4@16r2');
  // units held behind the gap are never resent, though their own rto passes before the ACK covers them
  const r = run({ n: 20, lose: mask([5]) });
  assert.deepEqual(r.tcp.sends.filter((m) => m.tx > 0).map((m) => m.unit), [5]);
  // rto changes when the resend leaves
  assert.match(sends(run({ n: 3, lose: mask([2]), rto: 7 })), /2@9r1/);
});

test('rule 6: a later lost unit whose time passed while it waited is resent as soon as it is the oldest', () => {
  // unit 2 lost twice (resent 6 lost, 14 arrives 15, ACK reaches the sender in 16); unit 3 lost once, its rto ran out
  // in 7, so it is resent in 16, the slot it becomes the oldest
  const r = run({ n: 4, lose: mask([2, 3]), lose2: mask([2]) });
  assert.equal(sends(r), '1@1 2@2x 3@3x 4@4 2@6r1x 2@14r2 3@16r1');
  assert.equal(got(r.tcp.delivered), '1:2 2:15 3:17 4:17');
});

test('rule 6: the backed-off RTO stops at 32 slots', () => {
  assert.equal(logic.RTO_MAX, 32);
  assert.deepEqual([1, 2, 3, 4, 5].map((tx) => logic.rtoAfter(P({ rto: 8 }), tx)), [8, 16, 32, 32, 32]);
  assert.deepEqual([1, 2, 3].map((tx) => logic.rtoAfter(P({ rto: 3 }), tx)), [3, 6, 12]);
});

test('rule 7: new units keep going out while a resend is pending', () => {
  const r = run({ n: 10, lose: mask([2]), lose2: mask([2]) });
  assert.deepEqual(r.tcp.sends.filter((m) => m.tx === 0).map((m) => m.slot), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('rule 8: stall = delivery − arrival; finish = last delivery; late units', () => {
  const r = run({ n: 20, lose: mask([5, 13]) });
  const d6 = r.tcp.delivered.find((d) => d.unit === 6);
  assert.equal(d6.slot - d6.arrived, 3);
  assert.equal(r.tcp.maxStall, 3);
  assert.equal(r.tcp.finish, 21);
  assert.equal(run({ n: 10, lose: 0 }).tcp.maxStall, 0);
});

// ── presets ──

test('preset book-example: URM ch13 Primjer 4', () => {
  const r = run(preset('book-example'));
  assert.equal(sends(r), '1@1 2@2x 3@3 2@6r1');
  assert.equal(acks(r), '1500@3 1500@5d 2500@8');
  assert.equal(got(r.tcp.delivered), '1:2 2:7 3:7');
  assert.deepEqual([r.tcp.finish, r.tcp.maxStall, r.tcp.delivered.length * 500], [7, 3, 1500]);
  assert.equal(got(r.udp.delivered), '1:2 3:4');
  assert.deepEqual([r.udp.finish, r.udp.delivered.length * 500, r.udp.missing], [4, 1000, [2]]);
  assert.equal(r.end, 7);
});

test('preset call-vs-file: units 5 and 13', () => {
  const r = run(preset('call-vs-file'));
  assert.match(sends(r), /5@9r1/);
  assert.match(sends(r), /13@17r1/);
  assert.equal(got(r.tcp.delivered.filter((d) => d.slot === 10)), '5:10 6:10 7:10 8:10 9:10');
  assert.equal(got(r.tcp.delivered.filter((d) => d.slot === 18)), '13:18 14:18 15:18 16:18 17:18');
  assert.deepEqual([r.tcp.delivered.length, r.tcp.finish, r.tcp.maxStall, r.tcp.retx], [20, 21, 3, 2]);
  assert.deepEqual([r.udp.delivered.length, r.udp.finish, r.udp.missing], [18, 21, [5, 13]]);
});

test('preset retransmit-lost: unit 4 and its first resend', () => {
  const r = run(preset('retransmit-lost'));
  assert.match(sends(r), /4@8r1x .* 4@16r2$/);
  assert.equal(got(r.tcp.delivered.filter((d) => d.slot === 17)), '4:17 5:17 6:17 7:17 8:17 9:17 10:17');
  assert.deepEqual([r.tcp.delivered.length, r.tcp.finish, r.tcp.maxStall], [10, 17, 11]);
  assert.deepEqual([r.udp.delivered.length, r.udp.finish], [9, 11]);
});

test('preset no-loss: identical timelines', () => {
  const r = run(preset('no-loss'));
  assert.deepEqual(r.tcp.delivered, r.udp.delivered);
  assert.deepEqual([r.tcp.finish, r.udp.finish, r.tcp.retx], [11, 11, 0]);
});

test('preset random-20: the fixed generator\'s numbers (SPEC.md)', () => {
  const r = run(preset('random-20'));
  assert.deepEqual(r.udp.missing, [2, 4, 8, 11, 12]);
  assert.equal(r.tcp.sends.filter((m) => m.tx > 0).map((m) => `${m.unit}@${m.slot}${m.lost ? 'x' : ''}`).join(' '), '2@6 4@8 8@12 11@15 12@17');
  assert.deepEqual([r.tcp.delivered.length, r.tcp.finish, r.tcp.maxStall, r.tcp.retx], [20, 21, 4, 5]);
  assert.deepEqual([r.udp.delivered.length, r.udp.finish], [15, 21]);
});

test('presets: unique ids, valid params', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const x of logic.presets) for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
});

test('every random combination ends, all units delivered by TCP, no duplicate, longest run 341', () => {
  let longest = 0;
  for (let seed = 1; seed <= 9; seed++) for (let loss = 0; loss <= 40; loss++) for (let n = 3; n <= 30; n++) for (let rto = 2; rto <= 8; rto++) {
    const r = run({ mode: 'random', seed, loss, n, rto });
    assert.equal(r.tcp.capped, false);
    assert.equal(r.tcp.delivered.length, n);
    assert.ok(!r.tcp.sends.some((m) => m.dup));
    assert.equal(r.udp.delivered.length + r.udp.missing.length, n);
    longest = Math.max(longest, r.end);
  }
  assert.equal(longest, 341);
});

// ── page helpers in the model ──

test('cycle: arrives → lost → lost with its first resend → arrives', () => {
  let m = { lose: 0, lose2: 0 };
  m = logic.cycle(m, 3); assert.deepEqual(m, { lose: 4, lose2: 0 });
  m = logic.cycle(m, 3); assert.deepEqual(m, { lose: 4, lose2: 4 });
  m = logic.cycle(m, 3); assert.deepEqual(m, { lose: 0, lose2: 0 });
  // a stray lose2 bit without lose is cleared on the way to lost
  assert.deepEqual(logic.cycle({ lose: 0, lose2: 4 }, 3), { lose: 4, lose2: 0 });
});

test('masks: random mode carries over to pattern mode unchanged', () => {
  const p = P({ mode: 'random', seed: 2, loss: 40, n: 30, rto: 8 });
  const m = logic.masks(p);
  const q = Object.assign({}, p, { mode: 'pattern' }, m);
  const a = logic.simulate(p), b = logic.simulate(q);
  assert.deepEqual(b.udp, a.udp);
  // first sends and first resends match; later resends are not in the pattern (rule 3)
  const two = (r) => r.tcp.sends.filter((x) => x.tx <= 1).map((x) => [x.unit, x.tx, x.lost]);
  assert.deepEqual(two(b).filter((x) => x[2]), two(a).filter((x) => x[2]));
});

test('fateAt: the strip\'s states over time', () => {
  const r = run();   // book-example
  const f = (proto, k) => [0, 2, 3, 4, 6, 7].map((t) => logic.fateAt(r, proto, k, t)).join(' ');
  assert.equal(f('tcp', 1), 'wait done done done done done');
  assert.equal(f('tcp', 2), 'wait wait gap gap gap done');
  assert.equal(f('tcp', 3), 'wait wait wait held held done');
  assert.equal(f('udp', 2), 'wait wait never never never never');
  assert.equal(f('udp', 3), 'wait wait wait done done done');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and in random mode', () => {
  for (const x of logic.presets) { const s = logic.initial(P(x.params)); assert.deepEqual(JSON.parse(JSON.stringify(s)), s); }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ mode: 'random', seed: 5, loss: 30, n: 25 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  // t never changes the run
  assert.deepEqual(logic.initial(Object.assign({}, p, { t: 3 })), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page: an explorer, its meta matches sim.json, it takes the presets from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(json.class, 'explorer');
  assert.ok(!('steps' in logic));
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const k of Object.keys(logic.defaults)) assert.match(html, new RegExp(`key: '${k}'`), `param ${k} is on the page`);
});
