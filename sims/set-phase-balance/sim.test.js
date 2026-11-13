// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-phase-balance's model (rules in SPEC.md). Run: node --test sims/set-phase-balance/
// The "load" block covers load.js: set-circuit-load's tests for the copied part (from sims/set-circuit-load/sim.test.js
// @ 982e7d9) and the new three-phase functions; it moves with load.js to models/.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const load = require('./load.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < (eps || 1e-9), `${msg || ''} ${a} ≈ ${b}`);
const PH = (s, id) => s.phases.find((x) => x.id === id);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const K = load.CABLE.k;

// ── tie-breaks first ──

test('tie-break (rule 3): a phase exactly at 32 A does not trip, one watt more does', () => {
  assert.equal(load.trips(7360, 32), false);
  assert.equal(load.trips(7361, 32), true);
  const at = load.phaseLoad([[2000, 2000, 2000, 1360], [], []], 32);
  assert.equal(at.phases[0].tripped, false);
  assert.equal(at.liveW, 7360);
  const over = load.phaseLoad([[2000, 2000, 2000, 1361], [], []], 32);
  assert.equal(over.phases[0].tripped, true);
  assert.equal(over.liveW, 0);
});

test('tie-break (rule 4): equal phases cancel to exactly 0 in the neutral', () => {
  assert.equal(load.neutralW(6000, 6000, 6000), 0);
  assert.equal(load.neutralAmps(7360, 7360, 7360), 0);
  assert.equal(load.neutralW(0, 0, 0), 0);
  assert.equal(load.neutralW(1, 1, 1), 0);
  assert.equal(D(logic.PLAN).neutral.amps > 0, true, 'the plan is close, not exact: 6000, 6000, 5800');
});

test('tie-break (rule 7): departments always listed electric, camera, make-up, no repeats', () => {
  assert.deepEqual(logic.DEPTS, ['electric', 'camera', 'makeup']);
  // L3 holds the camera (fixed) first, then the kettle, then lamps: listed in the fixed order
  const s = D({ c1: 'kettle', c2: 'l2000', c3: 'l2000', c4: 'l2000' });
  assert.deepEqual(PH(s, 'L3').depts, ['electric', 'camera', 'makeup']);
  assert.deepEqual(s.dark, ['electric', 'camera', 'makeup']);
  // two trips: L1 (make-up, electric) and L3: the union in order, once each
  const t = D({ a1: 'kettle', a2: 'l2000', a3: 'l2000', a4: 'l2000', c1: 'kettle', c2: 'l2000', c3: 'l2000', c4: 'l2000' });
  assert.deepEqual(t.tripped, ['L1', 'L3']);
  assert.deepEqual(t.dark, ['electric', 'camera', 'makeup']);
  const u = D({ a1: 'kettle', a2: 'kettle', a3: 'kettle', a4: 'kettle' });
  assert.deepEqual(u.dark, ['makeup']);
});

test('tie-break (rule 8): changed sockets and trips in board order', () => {
  assert.deepEqual(logic.changedSlots(P({ c4: 'l650' }), P({ a1: 'l650', b2: 'l650' })), ['a1', 'b2', 'c4']);
  const before = D({});
  const after = D({ a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l2000', c1: 'l2000', c2: 'l2000', c3: 'l2000', c4: 'l2000' });
  assert.deepEqual(logic.changedTrips(before, after), ['L1', 'L3']);
  assert.deepEqual(logic.changedTrips(after, before), ['L1', 'L3']);
});

test('tie-break (rule 8): least to spare among loaded phases, board order on a tie', () => {
  assert.equal(logic.leastSpare(D({})), null, 'nothing plugged in (the camera alone does not count)');
  assert.equal(logic.leastSpare(D({ b1: 'l2000', c1: 'l1000' })).id, 'L2', 'L3 has 800 + 1000 < 2000');
  assert.equal(logic.leastSpare(D({ c1: 'l1000', b1: 'l1000', b2: 'l650', b3: 'l650' })).id, 'L2', 'L2 2300 > L3 1800');
  assert.equal(logic.leastSpare(D({ a1: 'l2000', b1: 'l2000' })).id, 'L1', 'L1 and L2 tie: board order');
  assert.equal(logic.leastSpare(D({ b1: 'l2000', a1: 'l2000', c1: 'l650' })).id, 'L1', 'L3 1450 < 2000 = L1 = L2');
  assert.equal(logic.leastSpare(D({ c1: 'l1000', b1: 'l1000', b2: 'l650', b3: 'l650', c2: 'l650' })).id, 'L3',
    'the camera counts in L3\'s load: 800 + 1650 = 2450 > 2300');
  assert.equal(logic.leastSpare(D({ c1: 'kettle', b1: 'l2000', b2: 'l1000' })).id, 'L2', 'L2 3000 = L3 800 + 2200: board order');
});

test('state: plugs in board order, the fixed camera first in L3', () => {
  const s = D({ c4: 'l650', b1: 'l1000', a3: 'kettle', c1: 'l2000' });
  assert.deepEqual(s.plugs.map((x) => x.slot || x.device), ['a3', 'b1', 'camera', 'c1', 'c4']);
});

// ── load (load.js): the part copied from set-circuit-load ──

test('load rule 1: I = P / V at 230 V', () => {
  assert.equal(load.V, 230);
  near(load.amps(2000), 8.695652173913043);
  near(load.amps(1000), 4.3478, 1e-4);
  near(load.amps(650), 2.8261, 1e-4);
  near(load.amps(2200), 9.5652, 1e-4);
  near(load.amps(800), 3.4783, 1e-4);
  near(load.amps(2000, 115), 2000 / 115, 1e-12, 'another voltage');
  assert.equal(load.limitW(16), 3680);
  assert.equal(load.limitW(32), 7360);
});

test('load rule 2/3: a circuit adds its devices; above the rating trips', () => {
  const l = load.circuitLoad([2000, 1000, 650], 16);
  assert.equal(l.watts, 3650);
  near(l.amps, 15.8696, 1e-4);
  assert.equal(l.tripped, false);
  assert.equal(load.circuitLoad([], 16).watts, 0);
  assert.equal(load.trips(3680, 16), false);
  assert.equal(load.trips(3681, 16), true);
});

test('load rule 4: cable temperature with I² (unchanged from set-circuit-load)', () => {
  near(load.cableTemp(2000, K.unwound), 37.0983, 1e-4);
  near(load.cableTemp(2000, K.coiled), 170.1796, 1e-4);
  assert.equal(load.cableOver(1113, K.coiled), false);
  assert.equal(load.cableOver(1114, K.coiled), true);
  near(load.cableMaxAmps(K.unwound), 16.7705, 1e-4);
});

test('load.js devices are set-circuit-load\'s, unchanged', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(load.DEVICES).map(([k, v]) => [k, [v.w, v.dept, v.kind]])), {
    l650: [650, 'electric', 'lamp'], l1000: [1000, 'electric', 'lamp'], l2000: [2000, 'electric', 'lamp'],
    kettle: [2200, 'makeup', 'appliance'], mirror: [800, 'makeup', 'appliance'], camera: [800, 'camera', 'fixed']
  });
});

// ── load (load.js): the three phases ──

test('rule 1: 400 V between phases, 230 × √3', () => {
  assert.equal(load.V_LL, 400);
  assert.ok(Math.abs(230 * Math.sqrt(3) - load.V_LL) < 2);
});

test('rule 4: the neutral is the phasor sum of the three phase currents', () => {
  // against complex arithmetic, written apart from the closed form
  const phasor = (w1, w2, w3) => {
    const re = (a) => Math.cos(a), im = (a) => Math.sin(a), t = 2 * Math.PI / 3;
    const x = w1 * re(0) + w2 * re(-t) + w3 * re(t), y = w1 * im(0) + w2 * im(-t) + w3 * im(t);
    return Math.hypot(x, y);
  };
  for (const w of [[7000, 4000, 6800], [8000, 0, 800], [6000, 6000, 0], [6000, 6000, 5800], [123, 4567, 890]]) {
    near(load.neutralW(...w), phasor(...w), 1e-6, String(w));
  }
  near(load.neutralW(6000, 6000, 5800), 200, 1e-9);
  near(load.neutralAmps(7000, 4000, 6800), 12.6312, 1e-4);
  near(load.neutralAmps(3000, 0, 0), 3000 / 230, 1e-12, 'one phase alone: all of it');
  near(load.neutralAmps(0, 3000, 0), 3000 / 230, 1e-12);
  near(load.neutralAmps(6000, 6000, 0), 6000 / 230, 1e-12, 'two equal, the third off: one phase\'s worth');
  assert.equal(load.neutralAmps(3680, 0, 0), 16);
  near(load.neutralAmps(3000, 0, 0, 115), 3000 / 115, 1e-12, 'another voltage');
});

test('rule 4: with resistive loads the neutral never carries more than the largest phase', () => {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % 8001; };
  for (let i = 0; i < 5000; i++) {
    const w = [rnd(), rnd(), rnd()];
    assert.ok(load.neutralW(...w) <= Math.max(...w) + 1e-9, String(w));
  }
});

test('rules 2–5: phaseLoad trips each phase on its own; the neutral and totals count live phases only', () => {
  const l = load.phaseLoad([[2000, 2000, 2000, 2000], [], [800]], 32);
  assert.deepEqual(l.phases.map((x) => x.tripped), [true, false, false]);
  assert.deepEqual(l.live, [0, 0, 800]);
  assert.equal(l.neutralW, 800, 'the tripped phase is 0 in the neutral');
  assert.equal(l.demandW, 8800);
  assert.equal(l.liveW, 800);
  assert.equal(l.limitW, 22080);
});

// ── the distribution (sim.js) ──

test('distribution: three phases of 32 A, four sockets each, the camera fixed on L3', () => {
  assert.equal(logic.RATING, 32);
  assert.deepEqual(logic.PHASES.map((x) => x.id), ['L1', 'L2', 'L3']);
  assert.deepEqual(logic.SLOTS, ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4', 'c1', 'c2', 'c3', 'c4']);
  assert.equal(logic.SLOT_PHASE.b3, 'L2');
  const s = D({});
  assert.deepEqual(s.plugs.map((x) => [x.device, x.phase, x.fixed]), [['camera', 'L3', true]]);
  assert.equal(PH(s, 'L3').watts, 800);
  assert.equal(s.supply.liveW, 800);
  near(s.neutral.amps, 800 / 230, 1e-12);
  assert.equal(s.supply.limitW, 22080);
});

test('rule 3: one phase trips while the others carry on', () => {
  const s = D({ a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l2000', b1: 'l1000' });
  assert.deepEqual(s.tripped, ['L1']);
  assert.ok(s.plugs.filter((x) => x.phase === 'L1').every((x) => !x.live));
  assert.ok(s.plugs.filter((x) => x.phase !== 'L1').every((x) => x.live));
  assert.deepEqual(PH(s, 'L1').dark, ['electric']);
  assert.deepEqual(PH(s, 'L2').dark, []);
  assert.equal(s.supply.demandW, 9800);
  assert.equal(s.supply.liveW, 1800);
});

test('rule 3: the same 8 kW spread over the phases trips nothing', () => {
  const s = D({ a1: 'l2000', a2: 'l2000', b1: 'l2000', c1: 'l2000' });
  assert.deepEqual(s.tripped, []);
  assert.equal(s.supply.liveW, 8800);
});

test('rule 4: the state\'s neutral uses the live phases', () => {
  const s = D({ a1: 'l2000', b1: 'l2000', c1: 'l2000' });
  near(s.neutral.watts, 800, 1e-9, 'the camera\'s 800 W is the only unbalance');
  assert.equal(s.neutral.rating, 32);
  const t = logic.derive(preset('kettle'));
  near(t.neutral.amps, 6000 / 230, 1e-9, 'L3 out: L1 and L2 no longer cancel');
});

test('rule 6: off-plan, missing and as planned', () => {
  const plan = D(logic.PLAN);
  assert.deepEqual(plan.offPlan, []);
  assert.deepEqual(plan.missing, []);
  assert.equal(plan.asPlanned, true);
  assert.equal(plan.plugs.find((x) => x.fixed).offPlan, false, 'the camera is never off-plan');
  const s = D(Object.assign({}, logic.PLAN, { a1: 'l1000', a4: 'l650', b2: '', c4: 'kettle' }));
  assert.deepEqual(s.offPlan, ['a1', 'a4', 'c4']);
  assert.deepEqual(s.missing, ['b2']);
  assert.equal(s.asPlanned, false);
  assert.deepEqual(D({}).missing, ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3']);
  assert.equal(D({}).asPlanned, false);
  assert.equal(D(Object.assign({}, logic.PLAN, { a4: 'toaster' })).asPlanned, true, 'an unknown id is empty');
  assert.deepEqual(D(Object.assign({}, logic.PLAN, { a1: 'toaster' })).missing, ['a1']);
});

test('rule 7: the camera goes dark only when L3 trips', () => {
  assert.equal(D({ c1: 'kettle', c2: 'l2000', c3: 'l2000', c4: 'l650' }).cameraDark, true, '800 + 6850 = 7650 W > 7360 W');
  assert.equal(D({ c1: 'kettle', c2: 'l2000', c3: 'l1000', c4: 'l650' }).cameraDark, false, '800 + 5850 = 6650 W');
  assert.equal(logic.derive(preset('pile')).cameraDark, false, 'a trip on L1 leaves the camera on');
  assert.deepEqual(PH(D({ c1: 'kettle', c2: 'l2000', c3: 'l2000', c4: 'l650' }), 'L3').dark, ['electric', 'camera', 'makeup']);
});

test('rule 9: a click plugs in what is in hand, or unplugs; unknown devices are empty', () => {
  assert.deepEqual(logic.click(P({ hand: 'kettle' }), 'c4'), { c4: 'kettle' });
  assert.deepEqual(logic.click(P({ hand: 'kettle', c4: 'l650' }), 'c4'), { c4: '' });
  assert.deepEqual(logic.click(P({ hand: 'l650', a1: 'toaster' }), 'a1'), { a1: 'l650' });
  assert.deepEqual(logic.click(P({ hand: 'l650', a1: 'camera' }), 'a1'), { a1: 'l650' });
  assert.deepEqual(logic.click(P({ hand: 'l650', a1: 'mirror' }), 'a1'), { a1: 'l650' }, 'not pluggable here: empty');
  const s = D({ a1: 'toaster', a2: 'camera', a3: 'mirror' });
  assert.equal(PH(s, 'L1').watts, 0);
  assert.equal(s.plugs.filter((x) => x.device === 'camera').length, 1, 'the fixed load cannot be plugged');
});

test('review: the plan plus one extra device is not as planned', () => {
  const s = D(Object.assign({}, logic.PLAN, { b4: 'l650' }));
  assert.equal(s.asPlanned, false);
  assert.deepEqual(s.offPlan, ['b4']);
  assert.deepEqual(s.missing, []);
});

test('review (rule 8): nothing is marked on the first render', () => {
  assert.deepEqual(logic.changedSlots(null, P({ a1: 'l2000' })), []);
  assert.deepEqual(logic.changedTrips(null, logic.derive(preset('pile'))), []);
  assert.deepEqual(logic.changedTrips(undefined, logic.derive(preset('kettle'))), []);
});

test('review (rule 8): an unknown id going to empty is not a change; key order does not matter', () => {
  assert.deepEqual(logic.changedSlots(P({ a1: 'toaster' }), P({})), []);
  assert.deepEqual(logic.changedSlots(P({ a1: 'toaster' }), P({ a1: 'l650' })), ['a1']);
  const odd = { c4: 'l650', hand: 'l2000', a1: 'l650' };
  assert.deepEqual(logic.changedSlots(P({}), odd), ['a1', 'c4']);
});

test('review (rule 4): a tripped L2 counts as 0 in the neutral', () => {
  const s = D({ a1: 'l2000', b1: 'l2000', b2: 'l2000', b3: 'l2000', b4: 'l2000' });
  assert.deepEqual(s.tripped, ['L2']);
  near(s.neutral.watts, load.neutralW(2000, 0, 800), 1e-9);
  near(s.neutral.watts, Math.sqrt(2000 * 2000 + 800 * 800 - 2000 * 800), 1e-9);
});

test('review: each plug carries its own current, P / 230', () => {
  const s = D({ a1: 'l2000', a2: 'l650', c4: 'kettle' });
  for (const x of s.plugs) near(x.amps, x.w / 230, 1e-12, x.device);
  near(s.plugs.find((x) => x.slot === 'c4').amps, 9.5652, 1e-4);
});

test('review (rule 8): a tripped phase counts for least to spare (negative headroom)', () => {
  const s = D({ a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l2000', b1: 'l650' });
  assert.equal(PH(s, 'L1').headroomW, -640);
  assert.equal(logic.leastSpare(s).id, 'L1');
});

test('review (rule 9): a click on an unknown socket, or with nothing pluggable in hand, changes nothing', () => {
  assert.deepEqual(logic.click(P({ hand: 'l650' }), 'zz'), {});
  assert.deepEqual(logic.click(P({ hand: 'mirror' }), 'a1'), {});
  assert.deepEqual(logic.click(P({ hand: 'mirror', a1: 'l650' }), 'a1'), { a1: '' }, 'unplugging still works');
});

test('review: phaseLoad and circuitLoad use the voltage they are given', () => {
  const l = load.phaseLoad([[2000], [], []], 10, 115);
  assert.equal(l.phases[0].tripped, true, '2000 W > 10 A × 115 V');
  assert.equal(l.limitW, 3 * 1150);
  near(load.phaseLoad([[1000], [], []], 10, 115).neutralAmps, 1000 / 115, 1e-12, '1000 W < 1150 W: live');
  assert.equal(load.circuitLoad([2000], 10, 115).tripped, true);
  assert.equal(load.circuitLoad([2000], 10).tripped, false, '2000 W < 10 A × 230 V');
});

// ── presets (SPEC.md "Presets and expected numbers") ──

test('presets: the sockets of SPEC.md\'s table; defaults: empty, 2 kW in hand', () => {
  const plugs = (id) => Object.fromEntries(logic.SLOTS.filter((k) => preset(id)[k]).map((k) => [k, preset(id)[k]]));
  assert.deepEqual(logic.presets.map((x) => x.id), ['plan', 'lopsided', 'pile', 'kettle']);
  assert.deepEqual(plugs('plan'), { a1: 'l2000', a2: 'l2000', a3: 'l2000', b1: 'l2000', b2: 'l2000', b3: 'l2000', c1: 'l2000', c2: 'l2000', c3: 'l1000' });
  assert.deepEqual(plugs('lopsided'), { a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l1000', b1: 'l2000', b2: 'l2000', c1: 'l2000', c2: 'l2000', c3: 'l2000' });
  assert.deepEqual(plugs('pile'), { a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l2000' });
  assert.deepEqual(plugs('kettle'), Object.assign(plugs('plan'), { c4: 'kettle' }));
  const lamps = (id) => Object.values(plugs(id)).sort();
  assert.deepEqual(lamps('lopsided'), lamps('plan'), 'lopsided uses the plan\'s nine lamps');
  assert.equal(logic.defaults.hand, 'l2000');
  assert.ok(logic.SLOTS.every((k) => logic.defaults[k] === ''));
});

test('preset plan: 6000 / 6000 / 5800 W, neutral 0.87 A, as planned', () => {
  const s = logic.derive(preset('plan'));
  assert.deepEqual(s.phases.map((x) => x.watts), [6000, 6000, 5800]);
  near(PH(s, 'L1').amps, 26.0870, 1e-4);
  near(PH(s, 'L3').amps, 25.2174, 1e-4);
  assert.deepEqual(s.tripped, []);
  near(s.neutral.amps, 0.8696, 1e-4);
  assert.equal(s.supply.liveW, 17800);
  assert.equal(s.asPlanned, true);
});

test('preset lopsided: the same lamps, nothing trips, neutral 12.63 A', () => {
  const s = logic.derive(preset('lopsided'));
  assert.deepEqual(s.phases.map((x) => x.watts), [7000, 4000, 6800]);
  assert.equal(PH(s, 'L1').headroomW, 360);
  assert.deepEqual(s.tripped, []);
  near(s.neutral.amps, 12.6312, 1e-4);
  assert.equal(s.supply.liveW, 17800);
  assert.deepEqual(s.offPlan, ['a4', 'c3']);
  assert.deepEqual(s.missing, ['b3']);
});

test('preset pile: four 2 kW on L1, 34.78 A > 32 A, the others idle', () => {
  const s = logic.derive(preset('pile'));
  near(PH(s, 'L1').amps, 34.7826, 1e-4);
  assert.deepEqual(s.tripped, ['L1']);
  assert.deepEqual(s.dark, ['electric']);
  assert.equal(s.supply.liveW, 800);
  near(s.neutral.amps, 3.4783, 1e-4);
  assert.deepEqual(s.offPlan, ['a4']);
});

test('preset kettle: L3 trips, the camera goes dark, the neutral jumps to 26.09 A', () => {
  const s = logic.derive(preset('kettle'));
  assert.equal(PH(s, 'L3').watts, 8000);
  assert.deepEqual(s.tripped, ['L3']);
  assert.deepEqual(s.dark, ['electric', 'camera', 'makeup']);
  assert.equal(s.cameraDark, true);
  near(s.neutral.amps, 26.0870, 1e-4);
  assert.deepEqual(s.offPlan, ['c4']);
  assert.equal(preset('kettle').hand, 'kettle');
});

test('the plan with 650 W more on a4: 28.91 A, neutral 3.35 A', () => {
  const s = D(Object.assign({}, logic.PLAN, { a4: 'l650' }));
  near(PH(s, 'L1').amps, 28.9130, 1e-4);
  near(s.neutral.amps, 3.3467, 1e-4);
});

// ── generic checks every sim keeps ──

/** A spread of params: every device in each socket alone, on top of the plan, and every preset. */
function* someParams() {
  for (const slot of logic.SLOTS) for (const d of logic.PLUGGABLE) {
    yield P({ [slot]: d });
    yield P(Object.assign({}, logic.PLAN, { [slot]: d }));
  }
  for (const x of logic.presets) yield x.params;
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ a1: 'l2000', c4: 'kettle', b2: 'l650' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; the page is an explorer', () => {
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    for (const slot of logic.SLOTS) assert.ok(x.params[slot] === '' || logic.PLUGGABLE.includes(x.params[slot]), `${x.id} ${slot}`);
    assert.ok(logic.PLUGGABLE.includes(x.params.hand));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const d of logic.PLUGGABLE.concat(['camera'])) assert.ok(strings[lang]['dev_' + d], `${lang} dev_${d}`);
    for (const d of logic.DEPTS) assert.ok(strings[lang]['dept_' + d], `${lang} dept_${d}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="load.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'load.js before sim.js');
});
