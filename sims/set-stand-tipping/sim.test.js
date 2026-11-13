// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-stand-tipping's model (rules in SPEC.md). Run: node --test sims/set-stand-tipping/
// The "statics" block covers statics.js (the shared forces-and-moments model) and moves with it to models/.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const st = require('./statics.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < (eps || 1e-9), `${msg || ''} ${a} ≈ ${b}`);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const DP = (id, over) => logic.derive(Object.assign({}, preset(id), over || {}));

// ── tie-breaks first ──

test('tie-break (rule 4): overturning equal to restoring stands; a hair more tips', () => {
  assert.equal(st.tips(100, 100), false);
  assert.equal(st.tips(100 + 1e-12, 100), false, 'within EPS counts as equal');
  assert.equal(st.tips(100.001, 100), true);
  // A stand pushed by exactly its restoring moment stands.
  const feet = st.tripod(0.6, 'gap');
  const w = [{ w: 200, x: 0, y: 0 }];
  const r = st.balance(feet, w, 0, 0).restoring;
  assert.equal(st.balance(feet, w, r, 0).tips, false);
  assert.equal(st.balance(feet, w, r + 0.01, 0).tips, true);
});

test('tie-break (rule 4): equal edges, the first in the order A–B, B–C, C–A governs', () => {
  // Load over a leg: A–B and C–A face the push and are equal by symmetry; A–B wins.
  const b = st.balance(st.tripod(0.6, 'leg'), [{ w: 100, x: 0, y: 0 }], 0, 0);
  assert.equal(b.edges[0].a + b.edges[0].b, 'AB');
  near(b.edges[0].restoring, b.edges[2].restoring, 1e-9);
  assert.equal(b.edge, 0);
  assert.equal(D({ bags: 0 }).edge.a + D({ bags: 0 }).edge.b, 'AB');
  // A bag on C makes C–A stronger, A–B still governs; a bag on B makes A–B stronger, C–A governs.
  const feet = st.tripod(0.6, 'leg');
  const onB = st.balance(feet, [{ w: 100, x: 0, y: 0 }, { w: 50, x: feet[1].x / 4, y: feet[1].y / 4 }], 0, 0);
  const onC = st.balance(feet, [{ w: 100, x: 0, y: 0 }, { w: 50, x: feet[2].x / 4, y: feet[2].y / 4 }], 0, 0);
  assert.equal(onB.edge, 0, 'B lies on A–B: A–B is the weaker');
  assert.equal(onC.edge, 2, 'C lies on C–A: C–A is the weaker');
  near(onB.restoring, onC.restoring, 1e-9, 'one bag on either back leg: the same weakest edge');
});

test('tie-break (rule 11): a speed exactly at a limit is not above it', () => {
  assert.equal(logic.above(8, 8), false);
  assert.equal(logic.above(8 + 1e-12, 8), false, 'within EPS counts as equal');
  assert.equal(logic.above(8.001, 8), true);
});

test('tie-break (rule 4) through the stand: overturning equal to restoring stands', () => {
  // lamp 98.1 N at 0.6 m against (137.34 + 98.1) N × 0.25 m: both 58.86 N·m
  const s = D({ head: 'lamp', arm: 0.6, reach: 0.5, orient: 'gap', bags: 0, wind: 0 });
  near(s.overturn, s.restoring, 1e-9);
  assert.equal(s.tips, false);
  assert.equal(D({ head: 'lamp', arm: 0.7, reach: 0.5, orient: 'gap', bags: 0, wind: 0 }).tips, true);
});

test('tie-break (rule 11): wind exactly at the day\'s limit is not over it', () => {
  assert.equal(D({ head: 'frame', wind: 8, limit: 8 }).overLimit, false);
  assert.equal(D({ head: 'frame', wind: 8.5, limit: 8 }).overLimit, true);
  assert.equal(D({ head: 'lamp', wind: 12, limit: 8 }).overLimit, false, 'the limit is for flags and frames');
  assert.equal(D({ head: 'flag', wind: 12, limit: 8 }).overLimit, true);
});

// ── statics.js: the shared forces-and-moments model ──

test('statics rule 1: W = m·g', () => {
  assert.equal(st.G, 9.81);
  near(st.weight(14), 137.34);
  near(st.weight(0), 0);
});

test('statics rule 2: wind force ½·ρ·Cd·A·v², with the area and the square of the speed', () => {
  assert.equal(st.RHO, 1.25);
  assert.equal(st.CD, 1.2);
  near(st.windForce(10, 1), 75);
  near(st.windForce(7, 3.24), 119.07);
  near(st.windForce(14, 1.44) / st.windForce(7, 1.44), 4, 1e-12, 'twice the speed, four times the push');
  near(st.windForce(7, 2.88) / st.windForce(7, 1.44), 2, 1e-12, 'twice the area, twice the push');
  near(st.windForce(10, 1, 1, 1), 50, 1e-12, 'cd and rho can be passed');
  assert.equal(st.windForce(0, 3.24), 0);
});

test('statics rule 3: a tripod\'s feet and edges; the edge along the push is r over a leg, r/2 between two', () => {
  const leg = st.tripod(0.6, 'leg'), gap = st.tripod(0.6, 'gap');
  assert.deepEqual(leg.map((f) => f.leg), ['A', 'B', 'C']);
  near(leg[0].x, 0.6); near(leg[0].y, 0); near(leg[1].x, -0.3); near(leg[2].y, -0.6 * Math.sqrt(3) / 2);
  near(gap[0].x, -0.6); near(gap[1].x, 0.3); near(gap[1].y, 0.6 * Math.sqrt(3) / 2);
  for (const f of leg.concat(gap)) near(Math.hypot(f.x, f.y), 0.6);
  const el = st.edges(leg), eg = st.edges(gap);
  assert.deepEqual(el.map((e) => e.a + e.b), ['AB', 'BC', 'CA']);
  for (const e of el.concat(eg)) near(e.e, 0.3, 1e-12, 'every edge r/2 from the column');
  // facing the push: A–B and C–A over a leg (crossing at foot A, r), B–C between two (r/2)
  near(el[0].cross, 0.6); assert.equal(el[1].cross, null); near(el[2].cross, 0.6);
  assert.equal(eg[0].cross, null); near(eg[1].cross, 0.3); assert.equal(eg[2].cross, null);
  near(eg[1].nx, 1); assert.equal(eg[1].ny, 0);
  for (const e of el.concat(eg)) near(e.nx * e.nx + e.ny * e.ny, 1, 1e-12, 'unit normal');
});

test('statics rule 4: restoring = weight × its distance from the edge along the push; 0 on the edge, negative beyond', () => {
  const eg = st.edges(st.tripod(0.6, 'gap'))[1];
  near(st.restoringOf(eg, 100, 0, 0), 30);
  near(st.restoringOf(eg, 100, -0.15, 0), 45);
  near(st.restoringOf(eg, 100, 0.3, 0.2), 0, 1e-12, 'on the edge');
  assert.ok(st.restoringOf(eg, 100, 0.5, 0) < 0, 'beyond it');
  const el = st.edges(st.tripod(0.6, 'leg'))[0];
  near(st.restoringOf(el, 100, 0, 0), 60, 1e-12, 'over a leg the column is r from the edge along the push');
  near(st.restoringOf(el, 100, 0.6, 0), 0, 1e-12, 'foot A is on the edge');
});

test('statics rule 4: the balance takes the weakest edge facing the push and adds the hand', () => {
  const feet = st.tripod(0.6, 'gap');
  const b = st.balance(feet, [{ w: 100, x: 0, y: 0 }], 20, 5);
  assert.equal(b.edge, 1);
  assert.equal(b.edges[0].restoring, null);
  assert.equal(b.edges[2].restoring, null);
  near(b.restoring, 35);
  assert.equal(b.overturn, 20);
  near(b.ratio, 20 / 35);
  assert.equal(b.tips, false);
  assert.equal(st.balance(feet, [], 1, 0).ratio, Infinity, 'nothing restores');
});

test('statics rule 5: critical speed, 0 when it tips without wind, infinite without area or height', () => {
  near(st.criticalSpeed(75, 0, 1, 1), 10, 1e-12);
  near(st.criticalSpeed(375, 300, 1, 1), 10, 1e-12, 'the other overturning moment uses up part');
  assert.equal(st.criticalSpeed(50, 60, 1, 1), 0);
  assert.equal(st.criticalSpeed(50, 0, 0, 2), Infinity);
  assert.equal(st.criticalSpeed(50, 0, 1, 0), Infinity);
  near(st.windForce(st.criticalSpeed(200, 20, 1.44, 3), 1.44) * 3 + 20, 200, 1e-9, 'round trip');
});

test('statics rule 6: lean angle atan(dist / height); centre of gravity height', () => {
  near(st.leanAngle(1, 1), 45);
  near(st.leanAngle(0.3, 0.3 * Math.sqrt(3)), 30, 1e-9);
  assert.equal(st.leanAngle(0, 1), 0);
  assert.equal(st.leanAngle(-0.1, 1), 0);
  near(st.cgHeight([{ m: 1, z: 0 }, { m: 3, z: 2 }]), 1.5);
  assert.equal(st.cgHeight([]), 0);
  assert.ok(st.leanAngle(0.3, 2) < st.leanAngle(0.3, 1), 'a higher centre of gravity falls at a smaller lean');
});

// ── sim.js: the stand ──

test('rule 7: the heads, the stand, the bag, the bases and the grip', () => {
  assert.deepEqual(logic.HEAD_IDS, ['lamp', 'flag', 'frame', 'bigframe']);
  assert.deepEqual(logic.HEAD_IDS.map((h) => logic.HEADS[h].area), [0.12, 0.27, 1.44, 3.24]);
  assert.deepEqual(logic.HEAD_IDS.map((h) => logic.HEADS[h].m), [10, 1.5, 4, 7]);
  assert.deepEqual(logic.HEAD_IDS.map((h) => logic.HEADS[h].sail), [false, true, true, true]);
  for (const h of ['flag', 'frame', 'bigframe']) near(logic.HEADS[h].w * logic.HEADS[h].hgt, logic.HEADS[h].area, 1e-12, h);
  assert.deepEqual(logic.STAND, { m: 14, cg: 0.4 });
  assert.deepEqual(logic.BAG, { m: 15, along: 0.25, z: 0.25 });
  assert.deepEqual(logic.RANGES.reach, { min: 0.45, max: 0.75, step: 0.05 });
  assert.deepEqual(logic.HOLD, { f: 120, z: 1.2 });
});

test('rule 8: bags fill the legs of their side in turn, a quarter of the way out; on the ground they carry nothing', () => {
  const at = (o) => D(Object.assign({ bags: 3 }, o)).bags;
  assert.deepEqual(at({ orient: 'leg', bagOn: 'load' }).map((b) => b.leg), ['A', 'A', 'A']);
  assert.deepEqual(at({ orient: 'leg', bagOn: 'back' }).map((b) => b.leg), ['B', 'C', 'B']);
  assert.deepEqual(at({ orient: 'gap', bagOn: 'load' }).map((b) => b.leg), ['B', 'C', 'B']);
  assert.deepEqual(at({ orient: 'gap', bagOn: 'back' }).map((b) => b.leg), ['A', 'A', 'A']);
  assert.deepEqual(at({ orient: 'gap', bagOn: 'ground' }).map((b) => b.leg), ['B', 'C', 'B']);
  const s = D({ bags: 1, orient: 'leg', bagOn: 'load' });
  near(s.bags[0].x, 0.15); near(s.bags[0].y, 0); assert.equal(s.bags[0].onLeg, true);
  const g = D({ bags: 2, orient: 'gap', bagOn: 'ground' });
  assert.ok(g.bags.every((b) => !b.onLeg));
  near(g.bags[0].x, 0.3, 1e-12, 'beside the foot');
  assert.deepEqual(g.parts.bags, [0, 0]);
  near(g.restoring, D({ bags: 0, orient: 'gap' }).restoring, 1e-12, 'bags on the ground: as if there were none');
  assert.deepEqual(D({ bags: 0 }).bags, []);
});

test('rule 8: which leg — over a leg one bag holds the same on any leg; between two legs the back leg holds more', () => {
  const f = { head: 'frame', arm: 0, wind: 6 };
  near(D(Object.assign({ orient: 'leg', bags: 1, bagOn: 'load' }, f)).restoring,
    D(Object.assign({ orient: 'leg', bags: 1, bagOn: 'back' }, f)).restoring, 1e-9);
  near(D(Object.assign({ orient: 'leg', bags: 2, bagOn: 'load' }, f)).restoring, 238.38, 0.005);
  near(D(Object.assign({ orient: 'leg', bags: 2, bagOn: 'back' }, f)).restoring, 304.60, 0.005);
  near(D(Object.assign({ orient: 'gap', bags: 2, bagOn: 'load' }, f)).restoring, 119.19, 0.005);
  near(D(Object.assign({ orient: 'gap', bags: 2, bagOn: 'back' }, f)).restoring, 185.41, 0.005);
  // one bag's lever on the load leg over a leg: 0.75 × r
  near(D({ bags: 1, orient: 'leg', bagOn: 'load' }).parts.bags[0], 147.15 * 0.45, 1e-9);
});

test('rule 9: params are cleaned', () => {
  const s = logic.derive({ head: 'piano', reach: 2, orient: 'up', bagOn: 'roof', height: 9, arm: -1, bags: 2.6, wind: 'x', limit: 1, hold: 'yes' });
  assert.deepEqual(s.params, { head: 'lamp', height: 4, reach: 0.75, orient: 'leg', arm: 0, bags: 3, bagOn: 'load', wind: 3, hold: false, limit: 4 });
  assert.equal(logic.clean({ reach: 0.5300000001 }).reach, 0.55, 'reach snapped to 5 cm');
  assert.equal(logic.clean({ hold: true }).hold, true);
  assert.equal(logic.clean({ bags: -2 }).bags, 0);
  assert.deepEqual(logic.clean({}), logic.defaults);
});

test('rule 10: overturning = F·h + W·d; restoring = (stand + head)·lever + bags + hand; ratio and tips', () => {
  const s = D({ head: 'frame', height: 3, arm: 0.5, wind: 6, bags: 2, bagOn: 'back', hold: true });
  near(s.force, st.windForce(6, 1.44));
  near(s.parts.wind, s.force * 3);
  near(s.parts.offset, 4 * 9.81 * 0.5);
  near(s.overturn, s.parts.wind + s.parts.offset);
  near(s.parts.standHead, 18 * 9.81 * 0.6, 1e-9, 'over a leg: the column is r from the edge along the push');
  near(s.parts.hold, 144);
  near(s.restoring, s.parts.standHead + s.parts.bags[0] + s.parts.bags[1] + s.parts.hold);
  near(s.ratio, s.overturn / s.restoring);
  assert.equal(s.tips, st.tips(s.overturn, s.restoring));
  near(D({ hold: true }).restoring - D({}).restoring, 144, 1e-9, 'the hand adds 120 N × 1.2 m');
  assert.equal(D({ orient: 'gap', bags: 0 }).edge.a + D({ orient: 'gap', bags: 0 }).edge.b, 'BC');
  near(D({ orient: 'gap', bags: 0, arm: 0 }).parts.standHead, 24 * 9.81 * 0.3, 1e-9, 'between two legs: r/2');
});

test('rule 10: the head offset and the load over a leg', () => {
  const tipsGap = D({ arm: 0.8, reach: 0.45, orient: 'gap', bags: 0, wind: 0 });
  const holdsLeg = D({ arm: 0.8, reach: 0.45, orient: 'leg', bags: 0, wind: 0 });
  assert.equal(tipsGap.tips, true);
  assert.equal(holdsLeg.tips, false);
  near(holdsLeg.restoring, 2 * tipsGap.restoring, 1e-9, 'over a leg the lever doubles');
  near(D({ arm: 0 }).parts.offset, 0);
  assert.ok(D({ arm: 0.8 }).overturn > D({ arm: 0.2 }).overturn);
});

test('rule 10: raising the riser lengthens the wind\'s lever; a wider base lengthens the restoring lever', () => {
  const lo = D({ head: 'frame', arm: 0, wind: 7, height: 2 }), hi = D({ head: 'frame', arm: 0, wind: 7, height: 4 });
  near(hi.parts.wind, 2 * lo.parts.wind, 1e-9);
  near(hi.restoring, lo.restoring, 1e-9, 'on level ground the riser does not change the restoring moment');
  near(D({ reach: 0.75 }).parts.standHead / D({ reach: 0.45 }).parts.standHead, 0.75 / 0.45, 1e-9);
});

test('rule 11: critical speed and the day\'s limit', () => {
  const s = D({ head: 'bigframe', height: 3, arm: 0, wind: 7 });
  near(s.vCrit, 5.10, 0.005);
  assert.equal(s.critOverLimit, false, 'this stand tips below the day\'s 8 m/s');
  assert.equal(D({ head: 'flag', height: 3, arm: 0, wind: 7 }).critOverLimit, true);
  assert.equal(D({ head: 'lamp' }).critOverLimit, false, 'a lamp is not a frame');
  assert.equal(D({ arm: 0.8, reach: 0.45, orient: 'gap', bags: 0, wind: 0 }).vCrit, 0, 'tips without wind');
  const at = D({ head: 'frame', arm: 0, wind: 0 });
  near(st.windForce(at.vCrit, 1.44) * 2.5, at.restoring, 1e-9, 'at vCrit the moments are equal');
  // vCrit tie with the limit: exactly equal is not over
  const lim = Math.round(at.vCrit * 2) / 2;
  assert.equal(D({ head: 'frame', arm: 0, wind: 0, limit: lim }).critOverLimit, at.vCrit > lim);
});

test('rule 12: lean angle and the centre of gravity rise with the riser', () => {
  const lo = D({ head: 'frame', arm: 0, height: 2 }), hi = D({ head: 'frame', arm: 0, height: 4 });
  assert.ok(hi.cgZ > lo.cgZ);
  assert.ok(hi.lean < lo.lean);
  // lamp 10 kg at h, stand 14 kg at 0.4 h, bag 15 kg at 0.25 m
  near(D({ arm: 0, height: 2.5 }).cgZ, (14 * 1 + 10 * 2.5 + 15 * 0.25) / 39, 1e-12);
  near(D({ arm: 0, bags: 0, orient: 'gap', height: 2.5 }).lean, Math.atan2(0.3, (14 + 25) / 24) * 180 / Math.PI, 1e-9);
  assert.equal(D({ arm: 0.8, reach: 0.45, orient: 'gap', bags: 0 }).lean, 0, 'already over');
  near(D({ bags: 1, bagOn: 'ground' }).mass, 24, 1e-12, 'a bag on the ground is not part of the stand');
  assert.equal(D({ bags: 2, bagOn: 'ground', arm: 0.5 }).cgX, D({ bags: 0, arm: 0.5 }).cgX, 'nor of its centre of gravity');
  assert.equal(D({ hold: true }).lean, D({}).lean, 'the lean is without the hand');
  assert.equal(D({ wind: 12 }).lean, D({ wind: 0 }).lean, 'and without wind');
  near(D({ arm: 0.5, bags: 1, bagOn: 'load' }).cgX, (10 * 0.5 + 15 * 0.15) / 39, 1e-12, 'centre of gravity along the push');
});

test('presets: the expected numbers in SPEC.md', () => {
  const e = (id, o, r, tips) => {
    const s = DP(id);
    near(s.overturn, o, 0.005, id + ' overturn');
    near(s.restoring, r, 0.005, id + ' restoring');
    assert.equal(s.tips, tips, id + ' tips');
    return s;
  };
  assert.deepEqual(logic.presets.map((x) => x.id), ['arm', 'flag', 'bigframe', 'riser', 'ground', 'limit']);
  const spec = {
    arm: { arm: 0.8, reach: 0.45, orient: 'gap', bags: 0, wind: 0 },
    flag: { head: 'flag', height: 3, arm: 0, wind: 7 },
    bigframe: { head: 'bigframe', height: 3, arm: 0, wind: 7 },
    riser: { head: 'frame', height: 4, arm: 0, wind: 7 },
    ground: { head: 'frame', height: 2.5, arm: 0, orient: 'gap', bags: 2, bagOn: 'ground', wind: 6 },
    limit: { head: 'bigframe', height: 2, reach: 0.75, arm: 0, bags: 3, wind: 9, hold: true }
  };
  for (const id of Object.keys(spec)) assert.deepEqual(preset(id), P(spec[id]), id + ' params as in SPEC.md');
  assert.deepEqual(logic.defaults, { head: 'lamp', height: 2.5, reach: 0.6, orient: 'leg', arm: 0.3, bags: 1, bagOn: 'load', wind: 3, hold: false, limit: 8 });
  e('arm', 78.48, 52.97, true);
  near(DP('arm', { orient: 'leg' }).restoring, 105.95, 0.005);
  near(DP('arm', { orient: 'leg' }).lean, 2.1, 0.05);
  const f = e('flag', 29.77, 157.45, false);
  near(f.vCrit, 16.10, 0.005);
  const b = e('bigframe', 357.21, 189.82, true);
  near(b.force, 119.07, 0.005);
  assert.equal(DP('bigframe', { height: 1.5 }).tips, false);
  e('riser', 211.68, 172.17, true);
  assert.equal(DP('riser', { height: 2 }).tips, false);
  assert.equal(DP('riser', { height: 3.25 }).tips, false, 'the tipping height is just above 3.25 m');
  assert.equal(DP('riser', { height: 3.5 }).tips, true);
  e('ground', 97.20, 52.97, true);
  assert.equal(DP('ground', { bagOn: 'load' }).tips, false);
  const l = e('limit', 393.66, 546.82, false);
  assert.equal(l.overLimit, true);
  near(l.vCrit, 10.61, 0.005);
  near(DP('limit', { hold: false }).restoring, 402.82, 0.005);
  near(D({}).overturn, 31.45, 0.005);
  near(D({}).restoring, 207.48, 0.005);
});

// ── generic checks every sim keeps ──

/** A spread of params: every choice, and every preset. */
function* someParams() {
  for (const head of logic.HEAD_IDS) for (const reach of [0.45, 0.6, 0.75]) for (const orient of ['leg', 'gap'])
    for (const bagOn of ['load', 'back', 'ground']) for (const bags of [0, 1, 2, 3])
      yield P({ head, reach, orient, bagOn, bags, wind: 9, height: 3.5, arm: 0.4, hold: bags === 2 });
  for (const x of logic.presets) yield x.params;
}

test('state is JSON-safe, and stable over the whole spread', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    const j = JSON.parse(JSON.stringify(Object.assign({}, s, { vCrit: isFinite(s.vCrit) ? s.vCrit : null })));
    assert.equal(typeof j.tips, 'boolean');
    assert.ok(isFinite(s.overturn) && isFinite(s.restoring) && s.restoring > 0);
    assert.ok(s.lean >= 0 && s.lean < 90);
    assert.ok(isFinite(s.vCrit), 'every head has area and height');
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ head: 'frame', bags: 2, bagOn: 'back', hold: true });
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
    assert.deepEqual(logic.clean(x.params), x.params, x.id + ' is already clean');
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const h of logic.HEAD_IDS) assert.ok(strings[lang]['head_' + h], `${lang} head_${h}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="statics.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'statics.js before sim.js');
});
