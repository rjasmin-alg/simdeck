// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-circuit-load's model (rules in SPEC.md). Run: node --test sims/set-circuit-load/
// The "load" block covers load.js (the shared electrical-load model, catalogue §5.25); it moves with it to models/.
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
const C = (s, id) => s.circuits.find((c) => c.id === id);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const K = load.CABLE.k;

// ── tie-breaks first ──

test('tie-break (rule 3): exactly at the rating does not trip, one watt more does', () => {
  assert.equal(load.trips(3680, 16), false);
  assert.equal(load.trips(3681, 16), true);
  assert.equal(load.trips(2300, 10), false);
  assert.equal(load.trips(2301, 10), true);
  assert.equal(load.circuitLoad([2000, 1000, 680], 16).tripped, false, '3680 W on 16 A');
  assert.equal(load.circuitLoad([2000, 1000, 681], 16).tripped, true);
});

test('tie-break (rule 4): exactly at the insulation limit is not over', () => {
  const k = [45, 1]; // 45 K per A²: 1 A gives exactly the 45 K from 25 to 70 °C
  assert.equal(load.cableTemp(230, k), 70);
  assert.equal(load.cableOver(230, k), false);
  assert.equal(load.cableOver(231, k), true);
});

test('tie-break (rule 6): departments always listed electric, camera, make-up', () => {
  assert.deepEqual(logic.DEPTS, ['electric', 'camera', 'makeup']);
  // c3 holds the camera (fixed) first, then make-up's kettle, then a lamp: listed in the fixed order
  const s = D({ s5: 'kettle', s6: 'l2000' });
  assert.deepEqual(C(s, 'c3').depts, ['electric', 'camera', 'makeup']);
  assert.deepEqual(s.dark, ['electric', 'camera', 'makeup']);
  // two trips: dark is the union, still in order, no repeats
  const t = D({ s5: 'kettle', s6: 'mirror', s1: 'l2000', s2: 'l2000' });
  assert.deepEqual(t.dark, ['electric', 'camera', 'makeup']);
  assert.deepEqual(t.tripped, ['c1', 'c3'], 'board order');
});

test('tie-break (rule 6): the dark union is sorted and has no repeats', () => {
  // c3 (camera, make-up) and c4 with lamps (electric): board order would give camera, make-up, electric
  const a = D({ s5: 'kettle', s6: 'mirror', s7: 'l2000', s8: 'l650' });
  assert.deepEqual(a.tripped, ['c3', 'c4']);
  assert.deepEqual(a.dark, ['electric', 'camera', 'makeup']);
  // make-up on two tripped circuits is listed once
  const b = D({ s5: 'kettle', s6: 'mirror', s7: 'kettle', s8: 'mirror' });
  assert.deepEqual(b.dark, ['camera', 'makeup']);
});

test('tie-break (rule 8): two trips changing at once are reported in board order', () => {
  const before = D({});
  const after = D({ s1: 'l2000', s2: 'l2000', s7: 'kettle', s8: 'mirror' });
  assert.deepEqual(logic.changedTrips(before, after), ['c1', 'c4']);
  assert.deepEqual(logic.changedTrips(after, before), ['c1', 'c4']);
});

test('state: plugs in board order, fixed devices first in their circuit', () => {
  const s = D({ s8: 'mirror', s6: 'l650', s5: 'kettle', r2: 'l1000', s1: 'l650' });
  assert.deepEqual(s.plugs.map((x) => x.slot || x.device), ['s1', 'r2', 'camera', 's5', 's6', 's8']);
});

// ── load (load.js) ──

test('rule 1: I = P / V at 230 V', () => {
  assert.equal(load.V, 230);
  near(load.amps(2000), 8.695652173913043);
  near(load.amps(1000), 4.3478, 1e-4);
  near(load.amps(650), 2.8261, 1e-4);
  near(load.amps(2200), 9.5652, 1e-4);
  near(load.amps(800), 3.4783, 1e-4);
  near(load.amps(2000, 115), 2000 / 115, 1e-12, 'another voltage');
  assert.equal(load.limitW(16), 3680);
  assert.equal(load.limitW(10), 2300);
});

test('rule 2: a circuit adds the power of its devices', () => {
  const l = load.circuitLoad([2000, 1000, 650], 16);
  assert.equal(l.watts, 3650);
  near(l.amps, 15.8696, 1e-4);
  assert.equal(l.tripped, false);
  assert.equal(load.circuitLoad([], 16).watts, 0);
});

test('rule 4: temperature rises with I²; coiled 12 × unwound; the most each carries', () => {
  near(load.cableTemp(0, K.unwound), 25);
  near(load.cableTemp(2000, K.unwound), 37.0983, 1e-4);
  near(load.cableTemp(2000, K.coiled), 170.1796, 1e-4);
  const rise = (w, k) => load.cableTemp(w, k) - 25;
  near(rise(2000, K.coiled) / rise(1000, K.coiled), 4, 1e-9, 'double the current, four times the rise');
  near(rise(1000, K.coiled) / rise(1000, K.unwound), 12, 1e-9);
  near(load.cableMaxAmps(K.unwound), 16.7705, 1e-4);
  near(load.cableMaxAmps(K.coiled), 4.8412, 1e-4);
  assert.ok(load.cableMaxAmps(K.unwound) > 16, 'unwound it carries more than the 16 A breaker lets through');
  assert.ok(load.cableMaxAmps(K.coiled) < 16 / 3, 'coiled far less');
  assert.equal(load.cableOver(1000, K.coiled), false, '1 kW coiled: 61 °C');
  assert.equal(load.cableOver(1113, K.coiled), false);
  assert.equal(load.cableOver(1114, K.coiled), true);
  assert.equal(load.cableOver(3857, K.unwound), false);
  assert.equal(load.cableOver(3858, K.unwound), true);
});

test('load.js lamps carry what set-lamp-heat needs', () => {
  for (const id of ['l650', 'l1000', 'l2000']) {
    assert.equal(load.DEVICES[id].kind, 'lamp');
    assert.equal(load.DEVICES[id].dept, 'electric');
    assert.equal(load.DEVICES[id].lamp, 'tungsten');
  }
});

// ── the location (sim.js) ──

test('location: four circuits, ratings, departments and sockets as in SPEC.md', () => {
  assert.deepEqual(logic.CIRCUITS.map((c) => [c.id, c.rating, c.dept]),
    [['c1', 16, 'electric'], ['c2', 16, 'electric'], ['c3', 16, 'camera'], ['c4', 10, 'makeup']]);
  assert.deepEqual(logic.SLOTS, ['s1', 's2', 'r1', 'r2', 's3', 's4', 's5', 's6', 's7', 's8']);
  assert.equal(logic.SLOT_CIRCUIT.r1, 'c1');
  const s = D({});
  assert.equal(C(s, 'c3').watts, 800, 'the camera is always on c3');
  assert.deepEqual(s.plugs.map((x) => x.device), ['camera']);
  assert.equal(s.totalW, 800);
});

test('rule 2/5: the drum\'s outlets count in c1', () => {
  const s = D({ s1: 'l1000', r1: 'l650', r2: 'l2000' });
  assert.equal(C(s, 'c1').watts, 3650);
  assert.equal(C(s, 'c1').tripped, false);
  assert.equal(s.reel.watts, 2650);
});

test('rule 3: above the rating trips and everything on the circuit is dark', () => {
  const s = D({ s1: 'l2000', s2: 'l2000' });
  assert.equal(C(s, 'c1').tripped, true);
  assert.ok(s.plugs.filter((x) => x.circuit === 'c1').every((x) => !x.live));
  assert.ok(s.plugs.filter((x) => x.circuit !== 'c1').every((x) => x.live));
  assert.deepEqual(C(s, 'c1').dark, ['electric']);
  assert.deepEqual(C(s, 'c2').dark, []);
  assert.equal(s.totalW, 800, 'only the camera is still drawing');
});

test('rule 3: the same load trips the 10 A circuit and not a 16 A one', () => {
  assert.equal(C(D({ s7: 'kettle', s8: 'mirror' }), 'c4').tripped, true);
  assert.equal(C(D({ s3: 'kettle', s4: 'mirror' }), 'c2').tripped, false);
});

test('rule 5: a tripped circuit\'s drum carries nothing and is at the air\'s temperature', () => {
  const s = D({ r1: 'l2000', s1: 'l2000' });
  assert.equal(C(s, 'c1').tripped, true);
  assert.equal(s.reel.demandW, 2000);
  assert.equal(s.reel.watts, 0);
  assert.equal(s.reel.amps, 0);
  assert.equal(s.reel.temp, 25);
  assert.equal(s.reel.over, false);
});

test('rule 4/5: the drum coiled is over at 2 kW and the breaker stays in; unwound it is fine', () => {
  const coiled = D({ r1: 'l2000', reel: 'coiled' });
  assert.equal(C(coiled, 'c1').tripped, false);
  assert.equal(coiled.reel.over, true);
  near(coiled.reel.temp, 170.1796, 1e-4);
  assert.equal(coiled.reel.maxW, 1113);
  const unwound = D({ r1: 'l2000', reel: 'unwound' });
  assert.equal(unwound.reel.over, false);
  near(unwound.reel.temp, 37.0983, 1e-4);
  assert.equal(unwound.reel.maxW, 3857);
  assert.equal(D({ r1: 'l2000', reel: 'nonsense' }).reel.mode, 'coiled', 'an unknown mode is coiled');
});

test('rule 6: off-plan devices; the camera goes dark when its circuit trips', () => {
  const s = D({ s5: 'kettle', s6: 'mirror' });
  assert.equal(C(s, 'c3').offPlan, 2);
  assert.equal(C(s, 'c3').tripped, true);
  assert.equal(s.cameraDark, true);
  assert.deepEqual(s.dark, ['camera', 'makeup']);
  assert.equal(s.plugs.find((x) => x.device === 'camera').offPlan, false);
  const lamp = D({ s5: 'l1000' });
  assert.equal(lamp.plugs.find((x) => x.slot === 's5').offPlan, true, 'a lamp on the camera\'s circuit is off-plan');
  assert.equal(lamp.cameraDark, false);
  assert.equal(D({ s3: 'l2000' }).plugs.find((x) => x.slot === 's3').offPlan, false, 'c2 is electric\'s');
  assert.equal(D({ s7: 'mirror' }).plugs.find((x) => x.slot === 's7').offPlan, false);
  assert.equal(D({ s7: 'l650' }).plugs.find((x) => x.slot === 's7').offPlan, true);
  assert.equal(D({ s1: 'l2000', s2: 'l2000' }).cameraDark, false, 'a trip elsewhere leaves the camera on');
});

test('rule 7: the total counts live circuits only', () => {
  assert.equal(D({ s1: 'l2000', s3: 'l2000' }).totalW, 4800);
  assert.equal(D({ s5: 'kettle', s6: 'mirror', s1: 'l650' }).totalW, 650);
});

test('rule 8: changed sockets and trips, in board order; none on the first render', () => {
  assert.deepEqual(logic.changedSlots(null, P({})), []);
  assert.deepEqual(logic.changedSlots(P({ s1: 'l2000' }), P({ s1: 'l2000' })), []);
  assert.deepEqual(logic.changedSlots(P({ s3: 'l2000' }), P({ s1: 'l650', r2: 'l650' })), ['s1', 'r2', 's3']);
  assert.deepEqual(logic.changedTrips(null, D({ s1: 'l2000', s2: 'l2000' })), []);
  assert.deepEqual(logic.changedTrips(D({ s1: 'l2000' }), D({ s1: 'l2000', s2: 'l2000' })), ['c1']);
  assert.deepEqual(logic.changedTrips(D({ s1: 'l2000', s2: 'l2000' }), D({ s1: 'l2000' })), ['c1']);
  assert.deepEqual(logic.changedTrips(D({ s1: 'l2000' }), D({ s1: 'l1000' })), []);
});

test('rule 9: a click plugs in what is in hand, or unplugs; unknown devices are empty', () => {
  assert.deepEqual(logic.click(P({ hand: 'kettle' }), 's5'), { s5: 'kettle' });
  assert.deepEqual(logic.click(P({ hand: 'kettle', s5: 'l650' }), 's5'), { s5: '' });
  const s = D({ s1: 'toaster' });
  assert.equal(C(s, 'c1').watts, 0);
  assert.deepEqual(logic.click(P({ hand: 'l650', s1: 'toaster' }), 's1'), { s1: 'l650' }, 'an unknown id is empty: a click plugs in');
  assert.deepEqual(logic.click(P({ hand: 'l650', s1: 'camera' }), 's1'), { s1: 'l650' });
  assert.equal(D({ s1: 'camera' }).plugs.filter((x) => x.device === 'camera').length, 1, 'the fixed load cannot be plugged');
});

// ── presets (SPEC.md "Presets and expected numbers") ──

test('presets: the sockets of SPEC.md\'s table; defaults: empty, 2 kW in hand, drum coiled', () => {
  const plugs = (id) => Object.fromEntries(logic.SLOTS.filter((k) => preset(id)[k]).map((k) => [k, preset(id)[k]]));
  assert.deepEqual(logic.presets.map((x) => x.id), ['one-lamp', 'trip', 'spread', 'coiled', 'makeup', 'camera']);
  assert.deepEqual(plugs('one-lamp'), { s1: 'l2000' });
  assert.deepEqual(plugs('trip'), { s1: 'l2000', s2: 'l2000' });
  assert.deepEqual(plugs('spread'), { s1: 'l2000', s3: 'l2000' });
  assert.deepEqual(plugs('coiled'), { r1: 'l2000' });
  assert.equal(preset('coiled').reel, 'coiled');
  assert.deepEqual(plugs('makeup'), { s7: 'kettle', s8: 'mirror' });
  assert.deepEqual(plugs('camera'), { s5: 'kettle', s6: 'mirror' });
  assert.equal(logic.defaults.hand, 'l2000');
  assert.equal(logic.defaults.reel, 'coiled');
  assert.ok(logic.SLOTS.every((k) => logic.defaults[k] === ''));
});

test('preset one-lamp: 2 kW = 8.70 A of 16 A, 1680 W to spare', () => {
  const s = logic.derive(preset('one-lamp'));
  near(C(s, 'c1').amps, 8.6957, 1e-4);
  assert.equal(C(s, 'c1').headroomW, 1680);
  assert.deepEqual(s.tripped, []);
});

test('preset trip: 4000 W = 17.39 A > 16 A on c1', () => {
  const s = logic.derive(preset('trip'));
  near(C(s, 'c1').amps, 17.3913, 1e-4);
  assert.deepEqual(s.tripped, ['c1']);
  assert.deepEqual(s.dark, ['electric']);
});

test('preset spread: the same two lamps on two circuits, nothing trips', () => {
  const s = logic.derive(preset('spread'));
  assert.deepEqual(s.tripped, []);
  assert.equal(s.totalW, 4800);
  near(C(s, 'c2').amps, 8.6957, 1e-4);
});

test('preset coiled: 8.70 A, no trip, the drum at 170 °C over 70 °C', () => {
  const s = logic.derive(preset('coiled'));
  assert.deepEqual(s.tripped, []);
  assert.equal(s.reel.over, true);
  assert.equal(Math.round(s.reel.temp * 10) / 10, 170.2);
  const u = logic.derive(Object.assign({}, preset('coiled'), { reel: 'unwound' }));
  assert.equal(Math.round(u.reel.temp * 10) / 10, 37.1);
});

test('preset makeup: kettle and mirror, 13.04 A on the 10 A circuit', () => {
  const s = logic.derive(preset('makeup'));
  near(C(s, 'c4').amps, 13.0435, 1e-4);
  assert.deepEqual(s.tripped, ['c4']);
  assert.deepEqual(s.dark, ['makeup']);
  assert.equal(s.cameraDark, false);
});

test('preset camera: 3800 W = 16.52 A on the camera\'s circuit; the kettle alone does not trip', () => {
  const s = logic.derive(preset('camera'));
  assert.equal(C(s, 'c3').watts, 3800);
  near(C(s, 'c3').amps, 16.5217, 1e-4);
  assert.equal(s.cameraDark, true);
  const kettle = D({ s5: 'kettle' });
  assert.equal(C(kettle, 'c3').watts, 3000);
  assert.equal(kettle.cameraDark, false);
});

test('just under: 2 kW + 1 kW + 650 W on c1 = 3650 W, 30 W to spare', () => {
  const s = D({ s1: 'l2000', s2: 'l1000', r1: 'l650' });
  assert.equal(C(s, 'c1').headroomW, 30);
  assert.equal(C(s, 'c1').tripped, false);
});

// ── generic checks every sim keeps ──

/** A spread of params: every device in each socket alone, every preset, both drum modes. */
function* someParams() {
  for (const reel of logic.REEL_MODES) {
    for (const slot of logic.SLOTS) for (const d of logic.PLUGGABLE) yield P({ reel, [slot]: d });
    for (const x of logic.presets) yield Object.assign({}, x.params, { reel });
  }
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ s1: 'l2000', r1: 'l1000', s5: 'kettle', s6: 'mirror' });
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
    assert.ok(logic.REEL_MODES.includes(x.params.reel));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const d of logic.PLUGGABLE.concat(['camera'])) assert.ok(strings[lang]['dev_' + d], `${lang} dev_${d}`);
    for (const c of logic.CIRCUITS) assert.ok(strings[lang]['room_' + c.room], `${lang} room_${c.room}`);
    for (const d of logic.DEPTS) assert.ok(strings[lang]['dept_' + d], `${lang} dept_${d}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="load.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'load.js before sim.js');
});
