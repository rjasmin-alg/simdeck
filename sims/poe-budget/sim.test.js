// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for poe-budget: the rules of SPEC.md (tie-breaks first), then the presets' numbers, then the generic block.
// Run: node --test sims/poe-budget/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const port = (s, n) => s.result[n - 1];
const states = (s) => s.result.filter((r) => r.device).reduce((o, r) => { o[r.state] = (o[r.state] || 0) + 1; return o; }, {});
const E = (n, want, rank) => ({ n, want, rank });

// ── tie-breaks first ──

test('tie-break rule 5: within the lowest priority, the highest port number is shed first', () => {
  // budget 10 W; ports 1, 2, 3 low at 3 W each (9 W), port 9 critical needs 4 W: shed one, the highest (3)
  const a = logic.allocate([E(1, 300, 0), E(2, 300, 0), E(3, 300, 0), E(9, 400, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'powered', 2: 'powered', 3: 'shed', 9: 'powered' });
  assert.equal(a.total, 1000, '9 − 3 + 4 = 10 W, exactly the budget');
});

test('tie-break rule 5: the lowest priority goes before a higher one, whatever the port numbers', () => {
  // port 5 is high (rank 1), ports 1 and 2 low: the low ones go first, port 2 before port 1
  const a = logic.allocate([E(1, 300, 0), E(2, 300, 0), E(5, 300, 1), E(9, 600, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'shed', 2: 'shed', 5: 'powered', 9: 'powered' });
  assert.deepEqual(a.events, [{ type: 'shed', n: 9, ports: [2, 1], freed: 600, left: 100 }]);
});

test('tie-break rule 5: equal priority never sheds; the newcomer is denied', () => {
  const a = logic.allocate([E(1, 600, 2), E(2, 600, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'powered', 2: 'denied' });
});

test('tie-break rule 5: if shedding every candidate is not enough, nothing is shed', () => {
  const a = logic.allocate([E(1, 300, 0), E(2, 500, 2), E(3, 900, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'powered', 2: 'powered', 3: 'denied' }, '3 W freed + 2 W left < 9 W');
  assert.equal(a.total, 800);
  assert.deepEqual(a.events, [{ type: 'deny', n: 3, need: 900, left: 200 }]);
});

test('tie-break rule 5: sheds one at a time and stops as soon as the device fits', () => {
  const a = logic.allocate([E(1, 300, 0), E(2, 300, 0), E(3, 300, 0), E(9, 500, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'powered', 2: 'shed', 3: 'shed', 9: 'powered' }, '1 W left: 3 W is short, 6 W fits');
});

test('tie-break rule 5: a shed port stays down; a later low device can still fit the leftover', () => {
  const a = logic.allocate([E(1, 700, 0), E(2, 600, 2), E(3, 200, 0)], 1000, true);
  // port 2 sheds port 1 (7 W), total 6 W; port 3 (2 W) fits: powered; port 1 is not re-admitted
  assert.deepEqual(a.byPort, { 1: 'shed', 2: 'powered', 3: 'powered' });
  assert.equal(a.total, 800);
});

test('tie-break rule 5: within a higher priority too, the highest port is shed first', () => {
  const a = logic.allocate([E(1, 300, 1), E(2, 300, 1), E(3, 100, 0), E(9, 500, 2)], 800, true);
  // 7 W used, 1 W left; port 9 needs 5 W: the low port 3 (1 W) first, then the high port 2 (3 W): 1 + 1 + 3 = 5
  assert.deepEqual(a.byPort, { 1: 'powered', 2: 'shed', 3: 'shed', 9: 'powered' });
  assert.deepEqual(a.events[0].ports, [3, 2]);
});

test('rule 5: a shed port leaves the powered list, and a device powered by shedding can be shed in turn', () => {
  const a = logic.allocate([E(1, 600, 0), E(2, 600, 1), E(3, 600, 2)], 1000, true);
  assert.deepEqual(a.byPort, { 1: 'shed', 2: 'shed', 3: 'powered' });
  const s = at({ cams: 8, priorities: true });
  assert.deepEqual(s.events.map((e) => [e.n, e.ports]), [[38, [24, 23]], [39, [22, 21]], [40, [20, 19]]]);
  assert.deepEqual(states(s), { powered: 30, shed: 6 });
  assert.equal(s.total, 369.2);
});

test('events are in port order', () => {
  assert.deepEqual(at({ phones: 7, aps: 2, budget: 60 }).events.map((e) => [e.type, e.n]), [['deny', 25], ['deny', 26]]);
});

test('tie-break rule 4: admission is in port order, whatever the entries\' order', () => {
  const a = logic.allocate([E(3, 600, 0), E(1, 600, 0)], 1000, false);
  assert.deepEqual(a.byPort, { 1: 'powered', 3: 'denied' });
});

test('rule 7: a total exactly equal to the budget is accepted', () => {
  assert.deepEqual(logic.allocate([E(1, 500, 0), E(2, 500, 0)], 1000, false).byPort, { 1: 'powered', 2: 'powered' });
  assert.deepEqual(logic.allocate([E(1, 500, 0), E(2, 501, 0)], 1000, false).byPort, { 1: 'powered', 2: 'denied' });
  // the whole model: 4 APs at 30 W on a 120 W budget is exactly full
  const s = at({ phones: 0, aps: 4, budget: 120 });
  assert.equal(s.total, 120);
  assert.equal(s.left, 0);
  assert.deepEqual(states(s), { powered: 4 });
});

// ── rules ──

test('rule 1: the class table (PSE at the port / PD at the device), and the loss is positive for every class', () => {
  assert.deepEqual(logic.CLASSES.map((c) => [c.cls, c.pse, c.pd, c.std]), [
    [0, 15.4, 12.95, 'af'], [1, 4, 3.84, 'af'], [2, 7, 6.49, 'af'], [3, 15.4, 12.95, 'af'], [4, 30, 25.5, 'at'],
    [5, 45, 40, 'bt'], [6, 60, 51, 'bt'], [7, 75, 62, 'bt'], [8, 90, 71.3, 'bt']
  ]);
  for (const c of logic.CLASSES) assert.ok(c.pse > c.pd, `class ${c.cls}`);
  assert.deepEqual(logic.PORT_TYPES, { at: { pse: 30, pd: 25.5 }, bt: { pse: 90, pd: 71.3 } });
  assert.deepEqual(logic.KINDS.map((k) => [k.id, k.cls, k.draw, k.priority, k.first, k.max]), [
    ['phone', 2, 3.5, 'low', 1, 24], ['ap', 4, 13, 'critical', 25, 8], ['cam', 3, 6, 'critical', 33, 8], ['ptz', 6, 40, 'critical', 41, 2]
  ]);
  assert.deepEqual(logic.RANK, { low: 0, high: 1, critical: 2 });
  assert.equal(port(at({}), 1).pd, 6.49, 'a phone (class 2) is guaranteed 6.49 W at the device');
});

test('rule 2: class mode reserves the class maximum, not the draw', () => {
  const s = at({});
  assert.equal(port(s, 1).allocated, 7, 'phone, class 2: 7.0 W although it draws 3.5 W');
  assert.equal(port(s, 25).allocated, 30, 'AP, class 4');
  assert.equal(port(at({ cams: 1 }), 33).allocated, 15.4, 'camera, class 3');
  assert.equal(s.draw, 136);
  assert.equal(s.demand, 288);
});

test('rule 3: measured mode reserves the draw', () => {
  const s = at({ allocMode: 'measured', cams: 1, ptz: 1, portType: 'bt' });
  assert.equal(port(s, 1).allocated, 3.5);
  assert.equal(port(s, 25).allocated, 13);
  assert.equal(port(s, 33).allocated, 6);
  assert.equal(port(s, 41).allocated, 40);
  assert.equal(s.demand, s.draw, 'with no port limited, measured demand equals the draws');
});

test('rule 4: a device that would push the total over the budget is denied; later smaller devices still fit', () => {
  // 7 phones (49 W) + 1 AP (30 W) on 60 W: phones 1–7 = 49 W, the AP (30 W) is denied, 11 W left
  const s = at({ phones: 7, aps: 1, budget: 60 });
  assert.equal(port(s, 25).state, 'denied');
  assert.equal(port(s, 25).allocated, 0);
  assert.equal(s.total, 49);
  assert.deepEqual(s.events, [{ type: 'deny', n: 25, need: 30, left: 11 }]);
  // an AP denied, then a camera (15.4 W) after it is still powered when it fits
  const t = at({ phones: 0, aps: 3, cams: 1, budget: 80 });
  assert.deepEqual([25, 26, 27, 33].map((n) => port(t, n).state), ['powered', 'powered', 'denied', 'powered']);
  assert.equal(t.total, 75.4);
});

test('rule 4: with priorities off, a critical device never sheds', () => {
  const s = at({ cams: 6 });
  assert.equal(port(s, 38).state, 'denied');
  assert.equal(states(s).shed, undefined);
  assert.ok(s.ports.every((p) => p.priority === null), 'no priorities shown');
});

test('rule 5: priorities on: phones are low, APs and cameras critical', () => {
  const s = at({ priorities: true, cams: 1, ptz: 1 });
  assert.deepEqual([1, 25, 33, 41].map((n) => s.ports[n - 1].priority), ['low', 'critical', 'critical', 'critical']);
});

test('rule 6: a class above the port type is capped and marked limited; bt gives it its class', () => {
  const s = at({ ptz: 1 });
  assert.deepEqual(port(s, 41), { n: 41, device: 'ptz', want: 30, allocated: 30, pd: 25.5, limited: true, state: 'limited', shedBy: null });
  const b = at({ ptz: 1, portType: 'bt' });
  assert.equal(port(b, 41).allocated, 60);
  assert.equal(port(b, 41).pd, 51);
  assert.equal(port(b, 41).state, 'powered');
  // measured mode on an at port: the 40 W draw is capped too, and the device is limited
  const m = port(at({ ptz: 1, allocMode: 'measured' }), 41);
  assert.equal(m.allocated, 30);
  assert.equal(m.state, 'limited');
  assert.equal(m.pd, 25.5);
  assert.equal(s.demand, 318, 'demand counts the capped 30 W');
  assert.equal(s.cap, 30);
  assert.equal(b.cap, 90);
  // class 4 on an at port fits exactly: not limited
  assert.equal(port(s, 25).limited, false);
  // a limited device that does not fit is denied, not limited
  assert.equal(port(at({ ptz: 1, budget: 300 }), 41).state, 'denied');
});

test('ports: each kind fills its own block, so one count never moves another kind', () => {
  const s = at({ phones: 3, aps: 2, cams: 2, ptz: 2 });
  const used = s.ports.filter((p) => p.device).map((p) => [p.n, p.device]);
  assert.deepEqual(used, [[1, 'phone'], [2, 'phone'], [3, 'phone'], [25, 'ap'], [26, 'ap'], [33, 'cam'], [34, 'cam'], [41, 'ptz'], [42, 'ptz']]);
  assert.equal(s.ports.length, 48);
});

test('params are clamped: counts to their maxima, the budget to 60 … 740 in steps of 10, bad choices to defaults', () => {
  const s = at({ phones: 99, aps: -3, cams: 'x', ptz: 2.6, budget: 9999, allocMode: 'nope', portType: 'af' });
  assert.deepEqual(states(s), { powered: 24, limited: 2 });
  assert.equal(s.budget, 740);
  assert.equal(s.allocMode, 'class');
  assert.equal(s.portType, 'at');
  assert.equal(at({ budget: 5 }).budget, 60);
  assert.equal(at({ budget: 374 }).budget, 370);
  assert.equal(at({ priorities: 'yes' }).priorities, false);
  assert.equal(at({ budget: 'x' }).budget, 370, 'not a number: the default');
  assert.equal(at({ budget: 375 }).budget, 380, 'rounded to the nearest step, halves up');
  assert.equal(port(at({ phones: 0, cams: 2.5 }), 35).device, 'cam', '2.5 cameras round to 3');
});

test('no devices: nothing allocated, the whole budget left', () => {
  const s = at({ phones: 0, aps: 0 });
  assert.equal(s.total, 0);
  assert.equal(s.left, 370);
  assert.deepEqual(logic.groups(s), []);
});

test('changedPorts: ports whose state or allocation changed; none without a previous state', () => {
  assert.deepEqual(logic.changedPorts(null, at({})), []);
  assert.deepEqual(logic.changedPorts(at({ cams: 6 }), at({ cams: 6, priorities: true })), [23, 24, 38]);
  assert.deepEqual(logic.changedPorts(at({}), at({ phones: 23 })), [24]);
  const q = { phones: 10, aps: 0, cams: 1, priorities: true };
  assert.deepEqual(logic.changedPorts(at(Object.assign({ budget: 60 }, q)), at(Object.assign({ budget: 70 }, q))), [7, 9, 10],
    'ports 9 and 10 go from denied to shed at 0 W both times');
  const m = logic.changedPorts(at({}), at({ allocMode: 'measured' }));
  assert.equal(m.length, 28, 'every allocation changes');
});

test('groups: runs of consecutive ports with the same device, state and allocation', () => {
  const g = logic.groups(at(preset('priority')));
  assert.deepEqual(g.map((x) => [x.from, x.to, x.device, x.state, x.allocated]), [
    [1, 22, 'phone', 'powered', 7], [23, 24, 'phone', 'shed', 0], [25, 28, 'ap', 'powered', 30], [33, 38, 'cam', 'powered', 15.4]
  ]);
  assert.equal(g[0].count, 22);
  // shed and denied ports side by side (both 0 W, both asked for 7 W) are two runs, not one
  const h = logic.groups(at({ budget: 60, phones: 10, aps: 0, cams: 1, priorities: true }));
  assert.deepEqual(h.map((x) => [x.from, x.to, x.state]), [[1, 6, 'powered'], [7, 8, 'shed'], [9, 10, 'denied'], [33, 33, 'powered']]);
  assert.equal(g[0].priority, 'low');
  assert.equal(g[3].cls, 3);
});

// ── presets (SPEC.md table) ──

test('preset office: 288 W of 370, 82 W left, all 28 powered, they draw 136 W', () => {
  const s = at(preset('office'));
  assert.equal(s.total, 288);
  assert.equal(s.left, 82);
  assert.equal(s.draw, 136);
  assert.deepEqual(states(s), { powered: 28 });
});

test('preset cameras: 365 W; the camera on port 38 needs 15.4 W with 5 W left and is denied', () => {
  const s = at(preset('cameras'));
  assert.equal(s.total, 365);
  assert.equal(s.left, 5);
  assert.equal(s.demand, 380.4);
  assert.deepEqual(states(s), { powered: 33, denied: 1 });
  assert.deepEqual(s.events, [{ type: 'deny', n: 38, need: 15.4, left: 5 }]);
});

test('preset measured: the same 34 devices reserve 172 W, 198 W left', () => {
  const s = at(preset('measured'));
  assert.equal(s.total, 172);
  assert.equal(s.left, 198);
  assert.deepEqual(states(s), { powered: 34 });
});

test('preset priority: port 38 sheds phones 24 and 23; 366.4 W, 6 cameras and 22 phones', () => {
  const s = at(preset('priority'));
  assert.equal(s.total, 366.4);
  assert.equal(s.left, 3.6);
  assert.deepEqual(s.events, [{ type: 'shed', n: 38, ports: [24, 23], freed: 14, left: 5 }]);
  assert.deepEqual(states(s), { powered: 32, shed: 2 });
  assert.equal(port(s, 24).shedBy, 38);
});

test('preset ptz: limited to 30 W on at (318 W); 60 W on bt (348 W)', () => {
  const s = at(preset('ptz'));
  assert.equal(port(s, 41).state, 'limited');
  assert.equal(s.total, 318);
  const b = at(Object.assign({}, preset('ptz'), { portType: 'bt' }));
  assert.equal(port(b, 41).state, 'powered');
  assert.equal(b.total, 348);
});

test('preset params are the SPEC table\'s', () => {
  assert.deepEqual(Object.fromEntries(logic.presets.map((p) => [p.id, p.params])), {
    office: {}, cameras: { cams: 6 }, measured: { cams: 6, allocMode: 'measured' }, priority: { cams: 6, priorities: true }, ptz: { ptz: 1 }
  });
  assert.deepEqual(logic.defaults, { budget: 370, allocMode: 'class', phones: 24, aps: 4, cams: 0, ptz: 0, portType: 'at', priorities: false });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const id of logic.presets.map((p) => p.id)) for (const portType of logic.TYPES) for (const allocMode of logic.MODES) {
    const s = logic.initial(P(Object.assign({}, preset(id), { portType, allocMode })));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, id);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('priority'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('allocate does not mutate its entries', () => {
  const e = [E(3, 600, 0), E(1, 600, 2)];
  const copy = structuredClone(e);
  logic.allocate(e, 1000, true);
  assert.deepEqual(e, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const k of logic.KINDS) for (const lang of ['hr', 'en']) {
    assert.ok(strings[lang]['kind_' + k.id], `${lang} name of ${k.id}`);
    assert.ok(strings[lang]['letter_' + k.id], `${lang} letter of ${k.id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
