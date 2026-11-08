// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for wifi-roaming's model (rules: SPEC.md). Run: node --test sims/wifi-roaming/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const D = (over) => logic.initial(P(over));
const whole = (over) => D(Object.assign({}, over, { position: 60 }));
const r1 = (v) => Math.round(v * 10) / 10;
const roamsOf = (s) => s.allRoams.map((r) => [r.x, r.from + r.to, r.reason]);
const preset = (id) => P(logic.presets.find((p) => p.id === id).params);
const CUSTOM = (trigger, delta) => ({ client: 'custom', trigger, delta });

// ── tie-breaks (rule 3) ──

test('tie-break: a candidate exactly as strong as the current AP never roams, even with delta 0', () => {
  const r = logic.rssiAll(15);
  assert.equal(r.A, r.B, 'at 15 m AP-A and AP-B are exactly equal');
  const s = D(Object.assign(CUSTOM(-70, 0), { position: 15 }));
  assert.equal(s.current, 'A');
  assert.deepEqual(s.roams, []);
  assert.equal(s.look.under, true);
  assert.equal(s.look.margin, 0);
  assert.equal(s.look.enough, false);
  assert.equal(D(Object.assign(CUSTOM(-70, 0), { position: 16 })).current, 'B');
});

test('tie-break: two equal candidates go to the lower letter', () => {
  const r = logic.rssiAll(45);
  assert.equal(r.B, r.C, 'at 45 m AP-B and AP-C are exactly equal');
  assert.equal(logic.strongest(r, ['B', 'C']), 'B');
  assert.equal(logic.strongest(r, ['C', 'B']), 'B', 'order of the list does not matter');
  const d = logic.decide('A', 45, { trigger: -60, delta: 0 }, P(), false);
  assert.equal(d.roam.to, 'B');
  assert.equal(d.look.best, 'B');
});

test('tie-break: a margin exactly equal to delta does not roam (strictly greater)', () => {
  // at 20 m AP-B is AP-A + margin; with delta set to that exact margin the client stays
  const r = logic.rssiAll(20);
  const margin = r.B - r.A;
  const stay = logic.decide('A', 20, { trigger: -70, delta: margin }, P(), false);
  assert.equal(stay.roam, null);
  const go = logic.decide('A', 20, { trigger: -70, delta: margin - 1e-9 }, P(), false);
  assert.equal(go.roam.to, 'B');
});

test('tie-break: RSSI exactly at the trigger does not look (strictly under)', () => {
  const r = logic.rssiAll(20);
  const d = logic.decide('A', 20, { trigger: r.A, delta: 0 }, P(), false);
  assert.equal(d.look.under, false);
  assert.equal(d.roam, null);
});

test('tie-break: the AP asks only for a neighbour strictly stronger than the current AP', () => {
  // at 15 m AP-A is −75.5 (under −75) but AP-B is equal: no request; at 16 m AP-B is stronger: request
  const p = P({ btm: true, support: 'cooperative' });
  const set = logic.settingsOf(P({ client: 'sticky' }));
  assert.ok(logic.rssi('A', 15) < logic.BTM_LEVEL);
  assert.equal(logic.decide('A', 15, set, p, false).request, null);
  assert.equal(logic.decide('A', 16, set, p, false).request.to, 'B');
});

// ── rules ──

test('rule 1: log-distance RSSI, −40 dBm at 1 m, exponent 3, APs 3 m off the line', () => {
  assert.equal(logic.rssi('B', 30), -40 - 30 * Math.log10(3));
  assert.equal(r1(logic.rssi('A', 0)), -54.3);
  assert.equal(r1(logic.rssi('A', 20)), -79.2);
  assert.equal(r1(logic.rssi('B', 20)), -70.6);
  assert.equal(r1(logic.rssi('A', 60)), -93.4);
  // weaker with distance, symmetric about each AP
  assert.ok(logic.rssi('A', 10) < logic.rssi('A', 5));
  assert.equal(logic.rssi('B', 25), logic.rssi('B', 35));
});

test('rule 2: the client roams only under its trigger and only to a candidate more than delta better', () => {
  // above the trigger it does not look, however strong another AP is
  const hi = logic.decide('A', 30, { trigger: -85, delta: 8 }, P(), false);
  assert.equal(hi.look.under, false);
  assert.ok(hi.look.margin > 30);
  assert.equal(hi.roam, null);
  // under the trigger with too small a margin it stays
  const small = logic.decide('A', 19, { trigger: -70, delta: 8 }, P(), false);
  assert.equal(small.look.under, true);
  assert.equal(r1(small.look.margin), 6.8);
  assert.equal(small.roam, null);
  // under the trigger with enough margin it roams, to the strongest other AP
  const go = logic.decide('A', 20, { trigger: -70, delta: 8 }, P(), false);
  assert.deepEqual([go.to, go.roam.reason, r1(go.roam.rssiFrom), r1(go.roam.rssiTo)], ['B', 'client', -79.2, -70.6]);
});

test('rule 2: the client looks only at the other APs; its own AP is never the candidate', () => {
  // default client on B at 40 m: under −70, B is still the strongest, C is 8.6 dB weaker
  const d = logic.decide('B', 40, { trigger: -70, delta: 8 }, P(), false);
  assert.equal(d.look.under, true);
  assert.equal(d.look.best, 'C');
  assert.equal(r1(d.look.margin), -8.6);
  assert.equal(d.roam, null);
  const w = whole({ client: 'sticky', btm: true, support: 'legacy' });
  for (let x = 0; x <= 60; x++) {
    const prev = x === 0 ? 'A' : w.path[x - 1];
    assert.notEqual(D({ client: 'sticky', btm: true, support: 'legacy', position: x }).look.best, prev, `at ${x} m`);
  }
});

test('rule 2: client types set trigger and delta; custom takes the sliders', () => {
  assert.deepEqual(logic.settingsOf(P({ client: 'default', trigger: -60, delta: 0 })), { trigger: -70, delta: 8 });
  assert.deepEqual(logic.settingsOf(P({ client: 'sticky' })), { trigger: -85, delta: 8 });
  assert.deepEqual(logic.settingsOf(P(CUSTOM(-77, 3))), { trigger: -77, delta: 3 });
  const s = D(Object.assign(CUSTOM(-77, 3), { position: 10 }));
  assert.deepEqual([s.trigger, s.delta], [-77, 3]);
});

test('rule 4: the walk starts on AP-A with no events, and a roam is to the new AP', () => {
  const s = D({ position: 0 });
  assert.equal(s.current, 'A');
  assert.deepEqual(s.roams, []);
  assert.deepEqual(s.requests, []);
  assert.equal(s.path[0], 'A');
  const w = whole({});
  assert.deepEqual(roamsOf(w), [[20, 'AB', 'client'], [50, 'BC', 'client']]);
  for (let x = 0; x <= 60; x++) assert.equal(w.path[x], x < 20 ? 'A' : x < 50 ? 'B' : 'C');
});

test('rule 5: the AP only asks (BTM); a legacy client ignores it, a cooperative one moves', () => {
  const legacy = whole({ client: 'sticky', btm: true, support: 'legacy' });
  assert.deepEqual(roamsOf(legacy), [[32, 'AB', 'client']]);
  assert.deepEqual(legacy.allRequests.map((r) => [r.x, r.from + r.to, r.accepted, r1(r.rssiFrom), r1(r.rssiTo)]),
    [[16, 'AB', false, -76.3, -74.7], [46, 'BC', false, -76.3, -74.7]]);
  const coop = whole({ client: 'sticky', btm: true, support: 'cooperative' });
  assert.deepEqual(roamsOf(coop), [[16, 'AB', 'btm'], [46, 'BC', 'btm']]);
  assert.deepEqual(coop.allRoams.map((r) => [r1(r.rssiFrom), r1(r.rssiTo)]), [[-76.3, -74.7], [-76.3, -74.7]]);
  assert.deepEqual(coop.allRequests.map((r) => [r.x, r.from + r.to, r.accepted]), [[16, 'AB', true], [46, 'BC', true]]);
  // off: no requests at all; support alone changes nothing
  assert.deepEqual(whole({ client: 'sticky', btm: false, support: 'cooperative' }).allRequests, []);
  assert.deepEqual(roamsOf(whole({ client: 'sticky', btm: false, support: 'cooperative' })), [[32, 'AB', 'client']]);
});

test('rule 5: the AP asks below −75 dBm only, once per association', () => {
  const set = logic.settingsOf(P({ client: 'sticky' }));
  const p = P({ btm: true, support: 'legacy' });
  assert.ok(logic.rssi('A', 14) > logic.BTM_LEVEL);
  assert.equal(logic.decide('A', 14, set, p, false).request, null, 'above −75 no request');
  const first = logic.decide('A', 16, set, p, false);
  assert.equal(first.btmSent, true);
  assert.equal(logic.decide('A', 17, set, p, true).request, null, 'not again on the same association');
  // a roam starts a new association, so the AP may ask again
  const coop = logic.decide('A', 16, set, P({ btm: true, support: 'cooperative' }), false);
  assert.equal(coop.btmSent, false);
});

test('rule 5: the client\'s own rule comes before the AP\'s request', () => {
  // default client at 20 m: roams by itself, no request is sent although AP-A is under −75
  const s = whole({ btm: true, support: 'cooperative' });
  assert.equal(s.allRoams.find((r) => r.x === 20), undefined, 'the cooperative default client already left at 16');
  const d = logic.decide('A', 20, { trigger: -70, delta: 8 }, P({ btm: true, support: 'legacy' }), false);
  assert.equal(d.roam.reason, 'client');
  assert.equal(d.request, null);
});

test('rule 6: under −90 dBm the link is lost; the client joins the strongest AP again', () => {
  const s = whole(CUSTOM(-90, 0));
  assert.deepEqual(roamsOf(s), [[47, 'AC', 'lost']]);
  const lost = s.allRoams[0];
  assert.ok(lost.rssiFrom < logic.LOST_LEVEL);
  assert.ok(logic.rssi('A', 46) >= logic.LOST_LEVEL, 'at 46 m still above −90');
  assert.equal(r1(lost.rssiTo), r1(logic.rssi('C', 47)));
  // lost wins over the client's own rule in the same step
  const d = logic.decide('A', 47, { trigger: -60, delta: 0 }, P(), false);
  assert.equal(d.roam.reason, 'lost');
});

test('rule 7: link quality bands at −67 and −80 dBm', () => {
  assert.equal(logic.quality(-67), 'good');
  assert.equal(logic.quality(-67.01), 'fair');
  assert.equal(logic.quality(-80), 'fair');
  assert.equal(logic.quality(-80.01), 'poor');
  assert.equal(D({ position: 0 }).quality, 'good');
  assert.equal(D({ client: 'sticky', position: 30 }).quality, 'poor');
});

test('the state at a position is the walk replayed to it: events up to x, the same path as the whole walk', () => {
  const all = whole({ client: 'sticky', btm: true, support: 'legacy' });
  for (let x = 0; x <= 60; x++) {
    const s = D({ client: 'sticky', btm: true, support: 'legacy', position: x });
    assert.equal(s.current, all.path[x]);
    assert.deepEqual(s.roams, all.allRoams.filter((r) => r.x <= x));
    assert.deepEqual(s.requests, all.allRequests.filter((r) => r.x <= x));
    assert.deepEqual(logic.walk(P({ client: 'sticky', btm: true, support: 'legacy' }), x).path, all.path.slice(0, x + 1));
  }
});

// ── presets: the task's numbers ──

test('preset default-walk: A→B at 20 m (−79.2 → −70.6), B→C at 50 m, ends on C', () => {
  const s = D(preset('default-walk'));
  assert.equal(s.x, 20);
  assert.equal(s.current, 'B');
  assert.deepEqual(s.roams.map((r) => [r.x, r1(r.rssiFrom), r1(r.rssiTo)]), [[20, -79.2, -70.6]]);
  assert.equal(r1(logic.rssi('B', 19) - logic.rssi('A', 19)), 6.8);
  const w = whole(preset('default-walk'));
  assert.deepEqual(roamsOf(w), [[20, 'AB', 'client'], [50, 'BC', 'client']]);
  assert.equal(w.current, 'C');
});

test('preset sticky-client: still on A at 30 m (−84.4, B −54.3); A→B at 32 m; on B at −84.4 at 60 m', () => {
  const s = D(preset('sticky-client'));
  assert.deepEqual([s.x, s.current, r1(s.rssi.A), r1(s.rssi.B)], [30, 'A', -84.4, -54.3]);
  const w = whole(preset('sticky-client'));
  assert.deepEqual(roamsOf(w), [[32, 'AB', 'client']]);
  assert.equal(r1(w.allRoams[0].rssiFrom), -85.2);
  assert.deepEqual([w.current, r1(w.rssi.B), r1(w.rssi.C)], ['B', -84.4, -54.3]);
});

test('preset no-hysteresis: equal at 15 m (−75.5), roams at 16 m, B→C at 46 m', () => {
  const s = D(preset('no-hysteresis'));
  assert.deepEqual([s.x, s.current, r1(s.rssi.A), r1(s.rssi.B)], [15, 'A', -75.5, -75.5]);
  assert.deepEqual(roamsOf(whole(preset('no-hysteresis'))), [[16, 'AB', 'client'], [46, 'BC', 'client']]);
});

test('preset ap-asks: the legacy client ignores the request at 16 m and still roams at 32 m', () => {
  const s = D(preset('ap-asks'));
  assert.deepEqual([s.x, s.current], [16, 'A']);
  assert.deepEqual(s.requests.map((r) => [r.x, r.to, r.accepted]), [[16, 'B', false]]);
  assert.deepEqual(roamsOf(whole(preset('ap-asks'))), roamsOf(whole(preset('sticky-client'))));
});

test('preset ap-asks-cooperative: request at 16 m (A −76.3), accepted, on B at −74.7; B→C at 46 m', () => {
  const s = D(preset('ap-asks-cooperative'));
  assert.deepEqual([s.x, s.current, r1(s.rssi.A), r1(s.rssi.B)], [16, 'B', -76.3, -74.7]);
  assert.deepEqual(s.roams.map((r) => [r.x, r.reason]), [[16, 'btm']]);
  assert.deepEqual(roamsOf(whole(preset('ap-asks-cooperative'))), [[16, 'AB', 'btm'], [46, 'BC', 'btm']]);
});

// ── generic checks every sim keeps ──

test('explorer: no steps; state is JSON-safe and deterministic for every preset and position', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(logic.step, undefined);
  for (const pr of logic.presets) {
    for (let x = 0; x <= 60; x += 7) {
      const a = D(Object.assign({}, pr.params, { position: x })), b = D(Object.assign({}, pr.params, { position: x }));
      assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
      assert.deepEqual(a, b);
    }
  }
});

test('initial does not mutate its params', () => {
  const p = P({ client: 'custom', trigger: -80, delta: 2, btm: true, position: 33 });
  const copy = structuredClone(p);
  logic.initial(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both languages', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: ${k} is a model param`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
});
