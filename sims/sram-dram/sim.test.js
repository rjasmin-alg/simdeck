// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for sram-dram's model. Run: node --test sims/sram-dram/
// Numbers from the original page (single-page-labs/sram-dram.html): V_DD 1.2 V, C_s 20 fF, C_BL 200 fF, bitline
// precharged to V_DD/2, refresh window 64 ms; the leak rate (0.5 % of V_DD per ms toward GND) is the model's own
// (NOTES.md). Tie-breaks and edges first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const near = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);
const stepOf = (op, over) => {
  for (let n = 1; n <= logic.steps; n++) if (logic.opAt(n, P(over)).op === op) return n;
  return -1;
};

// ── tie-breaks and edges ──

test('a cell at exactly V_DD/2 gives no swing and resolves as 0', () => {
  assert.equal(logic.deltaV(50), 0);
  assert.equal(logic.sense(50), 0);
  assert.equal(logic.sense(50.000001), 1);
  assert.equal(logic.sense(49.99), 0);
});

test('leakage drains toward GND and stops there: a stored 0 has nothing to lose', () => {
  assert.equal(logic.leak(10, 32), 0);
  assert.equal(logic.leak(0, 1000), 0);
  const s = at({ bit: '0', refresh: false }, 8);
  assert.equal(s.dram.charge, 0);
  assert.equal(logic.lost(s.dram), false);
});

test('before anything is written: the latch is unknown, the capacitor empty, nothing is lost', () => {
  const s = at({}, 0);
  assert.equal(s.sram.q, null);
  assert.equal(s.dram.charge, 0);
  assert.equal(s.dram.bit, null);
  assert.equal(logic.lost(s.dram), false);
  assert.equal(s.ev, null);
});

test('the write-back writes the bit the sense amplifier read, not the bit that was written', () => {
  const p = P({ bit: '1', refresh: false });
  const read = kit.stateAt(logic, p, 9);
  assert.equal(read.ev.op, 'read');
  assert.equal(read.ev.dram.sensed, 0);
  const back = kit.stateAt(logic, p, 10);
  assert.equal(back.ev.op, 'restore');
  assert.equal(back.dram.charge, 0);
  assert.equal(back.dram.bit, 1);
  assert.equal(back.ev.dram.wrong, true);
  assert.equal(logic.lost(back.dram), true);
});

// ── the cell physics ──

test('the bitline swing: (V_cell − V_DD/2) · C_s / (C_s + C_BL), about ±55 mV for a full or empty cell', () => {
  near(logic.deltaV(100), 0.6 * 20 / 220);
  near(logic.deltaV(100), 0.054545);
  near(logic.deltaV(0), -0.054545);
  near(logic.deltaV(68), 0.019636);
});

test('charge sharing leaves the cell near V_DD/2: 54.5 % from full, 45.5 % from empty', () => {
  near(logic.share(100), 54.545455);
  near(logic.share(0), 45.454545);
  near(logic.share(50), 50);
});

test('leakage: 0.5 % per ms, so a full cell is at 84 % after 32 ms and at V_DD/2 after 100 ms', () => {
  assert.equal(logic.leak(100, 32), 84);
  assert.equal(logic.leak(100, 64), 68);
  assert.equal(logic.leak(100, 100), 50);
});

// ── the script ──

test('the script: 13 steps, write first and the other bit at step 11, refresh at step 6 only when on', () => {
  assert.equal(logic.steps, 13);
  assert.deepEqual(logic.opAt(1, P({ bit: '0' })), { op: 'write', bit: 0 });
  assert.deepEqual(logic.opAt(11, P({ bit: '0' })), { op: 'write', bit: 1 });
  assert.equal(logic.opAt(6, P({ refresh: true })).op, 'refresh');
  assert.equal(logic.opAt(6, P({ refresh: false })).op, 'skip');
  assert.equal(stepOf('refresh', { refresh: false }), -1);
});

test('time: only waits advance it, 32 ms each, to 128 ms', () => {
  const ts = [];
  for (let n = 0; n <= logic.steps; n++) ts.push(at({}, n).t);
  assert.deepEqual(ts, [0, 0, 0, 0, 32, 64, 64, 96, 128, 128, 128, 128, 128, 128]);
});

test('SRAM: a read leaves the latch as it was; only writes change Q, whatever the time', () => {
  for (const over of [{}, { bit: '0' }, { refresh: false }]) {
    const qs = [];
    for (let n = 0; n <= logic.steps; n++) qs.push(at(over, n).sram.q);
    const first = Number(P(over).bit);
    assert.deepEqual(qs, [null].concat(Array(10).fill(first), Array(3).fill(1 - first)));
  }
  const r = at({}, 2);
  assert.equal(r.ev.sram.read, 1);
  assert.equal(r.sram.wl, 1);
  assert.equal(r.sram.bl, 'up');
  assert.equal(r.sram.blb, 'down');
});

test('SRAM: writing the other bit overpowers the latch and flips it', () => {
  const s = at({}, 11);
  assert.equal(s.ev.sram.was, 1);
  assert.equal(s.sram.q, 0);
  assert.equal(s.sram.bl, 'gnd');
  assert.equal(s.sram.blb, 'vdd');
  assert.equal(at({}, 1).ev.sram.was, null);
});

test('DRAM: a read is destructive; the write-back restores the full level', () => {
  const r = at({}, 2);
  assert.equal(r.ev.dram.before, 100);
  near(r.dram.charge, 54.545455);
  assert.equal(r.dram.sa, 1);
  assert.equal(r.dram.bl, 'share');
  const b = at({}, 3);
  assert.equal(b.dram.charge, 100);
  assert.equal(b.dram.sa, null);
  assert.equal(b.dram.since, 0);
});

test('DRAM: the refresh at 64 ms finds 68 %, reads 1 and restores 100 %; the read at 128 ms still gives 1', () => {
  const r = at({}, 6);
  assert.equal(r.ev.dram.before, 68);
  assert.equal(r.ev.dram.sensed, 1);
  assert.equal(r.dram.charge, 100);
  assert.equal(r.dram.since, 0);
  const read = at({}, 9);
  assert.equal(read.ev.dram.before, 68);
  assert.equal(read.ev.dram.sensed, 1);
  assert.equal(read.ev.dram.wrong, false);
  for (let n = 0; n <= logic.steps; n++) assert.equal(logic.lost(at({}, n).dram), false, `step ${n}`);
});

test('DRAM without refresh: past the window the charge keeps leaking, and at 128 ms the 1 reads as 0', () => {
  const skip = at({ refresh: false }, 6);
  assert.equal(skip.ev.op, 'skip');
  assert.equal(skip.dram.charge, 68);
  assert.equal(skip.ev.dram.overdue, true);
  assert.equal(at({ refresh: false }, 7).dram.charge, 52);
  assert.equal(logic.lost(at({ refresh: false }, 7).dram), false);
  assert.equal(at({ refresh: false }, 8).dram.charge, 36);
  assert.equal(at({ refresh: false }, 8).dram.since, 128);
  assert.equal(logic.lost(at({ refresh: false }, 8).dram), true);
  const read = at({ refresh: false }, 9);
  assert.equal(read.ev.dram.sensed, 0);
  assert.equal(read.ev.dram.wrong, true);
  near(read.ev.dram.dv, -0.015273);
});

test('the window: waits are overdue only past 64 ms since the last restore', () => {
  assert.equal(at({}, 5).ev.dram.overdue, false);
  assert.equal(at({}, 8).ev.dram.overdue, false);
  assert.equal(at({ refresh: false }, 7).ev.dram.overdue, true);
});

test('a param change recomputes at the same step', () => {
  assert.equal(at({ refresh: true }, 8).dram.charge, 68);
  assert.equal(at({ refresh: false }, 8).dram.charge, 36);
  assert.equal(at({ bit: '0' }, 1).dram.charge, 0);
  assert.deepEqual(at({ view: 'table' }, 8), at({ view: 'cells' }, 8));
});

test('the trace records every step\'s charge for the chart', () => {
  const s = at({ refresh: false }, logic.steps);
  assert.equal(s.trace.length, logic.steps + 1);
  assert.deepEqual(s.trace.slice(0, 6).map((p) => p.charge).map(Math.round), [0, 100, 55, 100, 84, 68]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const bit of logic.bits) {
    for (const refresh of [true, false]) {
      for (let n = 0; n <= logic.steps; n++) {
        const s = at({ bit, refresh }, n);
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      }
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ bit: '0', refresh: false });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  const s1 = logic.step(logic.initial(p), 1, p);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every comparison row has a parameter, an SRAM and a DRAM cell in both languages', () => {
  for (const lang of ['hr', 'en']) {
    for (let i = 1; i <= 16; i++) assert.equal(strings[lang]['cmp' + i].split(' | ').length, 3, `${lang} cmp${i}`);
  }
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 4, 'found preset params');
  const offered = { bit: logic.bits, view: logic.views, refresh: ['true', 'false'] };
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):\s*'?([\w-]+)'?/g)) {
      assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
      assert.ok(offered[k[1]].includes(k[2]), `preset ${k[1]} ${k[2]} is offered`);
    }
  }
});
