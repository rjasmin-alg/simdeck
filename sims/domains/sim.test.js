// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for domains' model (rules and numbers in SPEC.md). Run: node --test sims/domains/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.domains(P(over));
const counts = (over) => { const d = D(over); return [d.collision.length, d.broadcast.length]; };
const preset = (id) => logic.presets.find((x) => x.id === id);
const sorted = (a) => a.slice().sort();

// ── tie-breaks first ──

test('tie-break: collision domains are numbered by their first link, so network 1 keeps 1–5', () => {
  const a = D({}), b = D({ net2Edge: 'switch' });
  assert.deepEqual(a.collision.slice(0, 5).map((d) => d.links), [['S1-a1'], ['S1-a2'], ['S1-a3'], ['S1-a4'], ['S1-R']]);
  assert.deepEqual(b.collision.slice(0, 5), a.collision.slice(0, 5));
  assert.deepEqual(a.collision.map((d) => d.links[0]), ['S1-a1', 'S1-a2', 'S1-a3', 'S1-a4', 'S1-R', 'R-S2', 'S2-b1', 'S2-b2', 'S2-X']);
  // the hub's domain lists its links in scene order
  assert.deepEqual(a.collision[8].links, ['S2-X', 'X-c1', 'X-c2', 'X-c3']);
});

test('tie-break: broadcast domains are lettered by their first item, VLANs ascending within a link', () => {
  const v = D({ net2Edge: 'switch', vlans: true });
  assert.deepEqual(v.broadcast.map((d) => d.vlan), [10, 20, null]);
  assert.deepEqual(v.broadcast[0].items, ['S1-a1@10', 'S1-a2@10', 'S1-R@10']);
  assert.deepEqual(v.broadcast[1].items, ['S1-a3@20', 'S1-a4@20', 'S1-R@20']);
  assert.equal(v.broadcast[2].items[0], 'R-S2');
});

test('tie-break: VLANs apply only with a switch in network 1 and a router in the middle, in the two-network scene', () => {
  assert.equal(logic.vlansOn(P({ vlans: true })), true);
  assert.equal(logic.vlansOn(P({ vlans: true, net1Core: 'hub' })), false);
  assert.equal(logic.vlansOn(P({ vlans: true, router: 'switch' })), false);
  assert.equal(logic.vlansOn(P({ vlans: true, layout: 'office' })), false);
  assert.equal(logic.vlansBlocked(P({ net1Core: 'hub' })), 'hub');
  assert.equal(logic.vlansBlocked(P({ router: 'switch' })), 'noRouter');
  assert.equal(logic.vlansBlocked(P({})), null);
  assert.deepEqual(counts({ vlans: true, net1Core: 'hub' }), [5, 2]);
  assert.deepEqual(counts({ vlans: true, router: 'switch' }), [9, 1]);
  assert.equal(D({ vlans: true, router: 'switch' }).scene.links.some((l) => l.trunk), false, 'no trunk without VLANs');
});

test('tie-break: changed = no domain with the same members before; nothing without a before or across layouts', () => {
  const a = logic.compare(P({}), P({ net2Edge: 'switch' }));
  assert.deepEqual(a.changedCollision, [8, 9, 10, 11]);
  assert.deepEqual(a.changedBroadcast, []);
  const r = logic.compare(P({}), P({ router: 'switch' }));
  assert.deepEqual(r.changedCollision, [], 'the router links become switch-port links: same members');
  assert.deepEqual(r.changedBroadcast, [0]);
  const v = logic.compare(P({ net2Edge: 'switch' }), P({ net2Edge: 'switch', vlans: true }));
  assert.deepEqual(v.changedCollision, []);
  assert.deepEqual(v.changedBroadcast, [0, 1], 'VLAN 10 and 20 changed, network 2 did not');
  const none = logic.compare(null, P({}));
  assert.deepEqual([none.changedCollision, none.changedBroadcast, none.was], [[], [], null]);
  const across = logic.compare(P({}), P({ layout: 'office' }));
  assert.deepEqual([across.changedCollision, across.changedBroadcast, across.was], [[], [], null]);
  // members are compared as sets: the order they are listed in does not matter
  assert.deepEqual(logic.changedDomains([{ links: ['b', 'a'] }], [{ links: ['a', 'b'] }], 'links'), []);
});

test('tie-break: before = the preset\'s own, else the params before the change; unchanged params keep it', () => {
  const p3b = preset('primjer-3b');
  assert.deepEqual(logic.nextBefore(null, null, P(p3b.params), p3b), P({}));
  assert.equal(logic.nextBefore(null, null, P({}), preset('primjer-3')), null);
  assert.equal(logic.nextBefore(null, null, P({}), null), null, 'first load');
  const b1 = logic.nextBefore(null, P({}), P({ net1Core: 'hub' }), null);
  assert.deepEqual(b1, P({}));
  assert.equal(logic.nextBefore(b1, P({ net1Core: 'hub' }), P({ net1Core: 'hub' }), null), b1, 're-render keeps it');
  const b2 = logic.nextBefore(b1, P({ net1Core: 'hub' }), P({ net1Core: 'hub', router: 'switch' }), null);
  assert.deepEqual(b2, P({ net1Core: 'hub' }));
  // a preset still named but with params changed by hand counts as a hand change
  assert.deepEqual(logic.nextBefore(null, P(p3b.params), P({ net2Edge: 'switch', net1Core: 'hub' }), p3b), P(p3b.params));
});

test('tie-break: a collision domain counts in the network of its first link (S1–R in network 1)', () => {
  assert.deepEqual(D({}).perNet, { 1: 5, 2: 4 });
  assert.deepEqual(D({ router: 'switch' }).perNet, { 1: 5, 2: 4 });
  assert.deepEqual(D({ net1Core: 'hub' }).perNet, { 1: 1, 2: 4 });
});

// ── rules ──

test('rule 1: a hub is one collision domain with everything on it, the far switch port included', () => {
  const hub = D({}).collision[8];
  assert.deepEqual(sorted(hub.devices), ['X', 'c1', 'c2', 'c3']);
  assert.deepEqual(hub.ports, [['S2', 'S2-X']], 'the port of S2 on the far end');
  const office = D({ layout: 'office', net1Core: 'hub' });
  assert.equal(office.collision.length, 1);
  assert.equal(office.collision[0].links.length, 10);
  // a hub in network 1 takes the router's interface into its domain too
  const n1 = D({ net1Core: 'hub' }).collision[0];
  assert.deepEqual(n1.links, ['S1-a1', 'S1-a2', 'S1-a3', 'S1-a4', 'S1-R']);
  assert.deepEqual(n1.ports, [['R', 'S1-R']]);
});

test('rule 2: each switch port is its own collision domain; it does not reach the switch\'s other ports', () => {
  const d = D({ net2Edge: 'switch' });
  const byLink = (id) => d.collision.find((x) => x.links.includes(id));
  for (const id of ['S1-a1', 'S1-a2', 'S1-a3', 'S1-a4', 'S2-b1', 'S2-b2', 'S2-X', 'X-c1', 'X-c2', 'X-c3']) {
    assert.deepEqual(byLink(id).links, [id], id);
  }
  assert.deepEqual(byLink('S1-a1').devices, ['a1'], 'the switch is not inside a port\'s domain');
  assert.deepEqual(byLink('S1-a1').ports, [['S1', 'S1-a1']]);
  assert.deepEqual(counts({ layout: 'office', net1Core: 'switch' }), [10, 1]);
});

test('rule 3: each router interface is its own collision domain', () => {
  const d = D({});
  assert.deepEqual(d.collision[4], { links: ['S1-R'], devices: [], ports: [['S1', 'S1-R'], ['R', 'S1-R']], net: 1 });
  assert.deepEqual(d.collision[5].links, ['R-S2']);
});

test('rule 4: only a router stops broadcasts; each router interface bounds one broadcast domain', () => {
  const d = D({});
  assert.equal(d.broadcast.length, 2);
  assert.deepEqual(d.broadcast[0].edges, [['R', 'S1-R', null]]);
  assert.deepEqual(d.broadcast[1].edges, [['R', 'R-S2', null]]);
  assert.deepEqual(sorted(d.broadcast[1].devices), sorted(['S2', 'b1', 'b2', 'X', 'c1', 'c2', 'c3']), 'hub and switch pass it');
  const nr = D({ router: 'switch' });
  assert.equal(nr.broadcast.length, 1);
  assert.deepEqual(nr.broadcast[0].edges, []);
  assert.equal(nr.broadcast[0].devices.length, 13, 'every device, the middle switch included');
});

test('rule 5: VLANs split network 1\'s switch into two broadcast domains; the trunk carries both, one subinterface each', () => {
  const v = D({ vlans: true });
  assert.deepEqual(counts({ vlans: true }), [9, 3]);
  assert.deepEqual(sorted(v.broadcast[0].devices), ['S1', 'a1', 'a2']);
  assert.deepEqual(sorted(v.broadcast[1].devices), ['S1', 'a3', 'a4'], 'the switch is in both');
  assert.deepEqual(v.broadcast[0].edges, [['R', 'S1-R', 10]]);
  assert.deepEqual(v.broadcast[1].edges, [['R', 'S1-R', 20]]);
  assert.equal(v.scene.links.find((l) => l.id === 'S1-R').trunk, true);
  assert.deepEqual(v.collision, D({}).collision, 'VLANs change no collision domain');
});

test('rule 6: the counts are independent: hub → switch moves only the first, router → switch only the second', () => {
  assert.deepEqual(counts({}), [9, 2]);
  assert.deepEqual(counts({ net2Edge: 'switch' }), [12, 2]);
  assert.deepEqual(counts({ router: 'switch' }), [9, 1]);
  assert.deepEqual(counts({ layout: 'office', net1Core: 'hub' }), [1, 1]);
  assert.deepEqual(counts({ layout: 'office', net1Core: 'switch' }), [10, 1]);
  for (const k of ['net1Core', 'net2Edge']) {
    for (const v of ['hub', 'switch']) {
      assert.equal(D({ [k]: v }).broadcast.length, D({}).broadcast.length, `${k} ${v}: broadcast unchanged`);
    }
  }
  assert.equal(D({ router: 'switch', net1Core: 'hub' }).collision.length, D({ net1Core: 'hub' }).collision.length);
});

test('rule 7: a full-duplex switch port still counts: two switches back to back are one collision domain', () => {
  const d = D({ net2Edge: 'switch' });
  const sx = d.collision.find((x) => x.links.includes('S2-X'));
  assert.deepEqual(sx, { links: ['S2-X'], devices: [], ports: [['S2', 'S2-X'], ['X', 'S2-X']], net: 2 });
});

test('expected numbers: every preset and SPEC row', () => {
  const rows = [
    [{}, 9, 2, { 1: 5, 2: 4 }],
    [{ net2Edge: 'switch' }, 12, 2, { 1: 5, 2: 7 }],
    [{ layout: 'office', net1Core: 'hub' }, 1, 1],
    [{ layout: 'office', net1Core: 'switch' }, 10, 1],
    [{ router: 'switch' }, 9, 1, { 1: 5, 2: 4 }],
    [{ net2Edge: 'switch', vlans: true }, 12, 3, { 1: 5, 2: 7 }],
    [{ net1Core: 'hub' }, 5, 2, { 1: 1, 2: 4 }],
    [{ net1Core: 'hub', net2Edge: 'switch', router: 'switch' }, 8, 1, { 1: 1, 2: 7 }],
    [{ vlans: true, net1Core: 'hub' }, 5, 2],
    [{ vlans: true, router: 'switch' }, 9, 1]
  ];
  for (const [over, c, b, per] of rows) {
    const d = D(over);
    assert.deepEqual([d.collision.length, d.broadcast.length], [c, b], JSON.stringify(over));
    if (per) assert.deepEqual(d.perNet, per, JSON.stringify(over));
  }
  const expect = { 'primjer-3': [9, 2], 'primjer-3b': [12, 2], 'office-hub': [1, 1], 'no-router': [9, 1], vlans: [12, 3] };
  for (const p of logic.presets) assert.deepEqual(counts(p.params), expect[p.id], p.id);
});

test('caption keys: what changed, where, and which count moved', () => {
  const k = (a, b) => logic.captionKey(a && P(a), P(b));
  assert.deepEqual(k(null, {}), { key: 'capTwo', what: null, where: null, why: 'router' });
  assert.deepEqual(k({}, { net2Edge: 'switch' }), { key: 'capColl', what: 'net2Edge-switch', where: 'net2', why: 'router' });
  assert.deepEqual(k({}, { net1Core: 'hub' }), { key: 'capColl', what: 'net1Core-hub', where: 'net1', why: 'router' });
  assert.deepEqual(k({}, { router: 'switch' }), { key: 'capBc', what: 'router-switch', where: null, why: 'none' });
  assert.deepEqual(k({ net2Edge: 'switch' }, { net2Edge: 'switch', vlans: true }), { key: 'capBc', what: 'vlans-on', where: null, why: 'vlan' });
  assert.equal(k({ layout: 'office', net1Core: 'hub' }, { layout: 'office' }).what, 'office-switch');
  assert.equal(k({ layout: 'office', net1Core: 'hub' }, { layout: 'office' }).where, 'office');
  assert.equal(k({}, { layout: 'office' }).key, 'capOffice', 'a layout change starts afresh');
  assert.deepEqual(k({}, { net1Core: 'hub', router: 'switch' }), { key: 'capBoth', what: 'many', where: 'net1', why: 'none' });
  assert.equal(k({ net1Core: 'hub' }, { net1Core: 'hub', vlans: true }).key, 'capSame', 'VLANs on a hub change nothing');
  assert.equal(k({}, {}).key, 'capTwo');
});

test('caption keys: why follows the VLANs that apply, VLANs off is named, a change in both networks is "both"', () => {
  const k = (a, b) => logic.captionKey(a && P(a), P(b));
  assert.equal(k(null, { vlans: true, net1Core: 'hub' }).why, 'router', 'VLANs on a hub are ignored');
  assert.equal(k(null, { vlans: true }).why, 'vlan');
  assert.equal(k(null, { layout: 'office', vlans: true }).why, 'office');
  assert.deepEqual(k({ vlans: true }, {}), { key: 'capBc', what: 'vlans-off', where: null, why: 'router' });
  assert.deepEqual(k({ net1Core: 'hub', net2Edge: 'switch' }, {}), { key: 'capColl', what: 'many', where: 'both', why: 'router' });
  assert.equal(logic.vlansBlocked(P({ net1Core: 'hub', router: 'switch' })), 'hub', 'the hub is named first');
  assert.equal(logic.vlansBlocked(P({ layout: 'office', net1Core: 'hub' })), 'office');
});

test('compare: the counts before, per network too', () => {
  const c = logic.compare(P({}), P({ net2Edge: 'switch' }));
  assert.deepEqual(c.was, { collision: 9, broadcast: 2, perNet: { 1: 5, 2: 4 } });
  const r = logic.compare(P({ net2Edge: 'switch' }), P({ router: 'switch', net2Edge: 'switch' }));
  assert.deepEqual(r.was, { collision: 12, broadcast: 2, perNet: { 1: 5, 2: 7 } });
  assert.equal(r.broadcast.length, 1);
});

test('presets carry their own before (SPEC "Expected numbers")', () => {
  const befores = Object.fromEntries(logic.presets.map((p) => [p.id, p.before]));
  assert.deepEqual(befores, {
    'primjer-3': null, 'primjer-3b': {}, 'office-hub': null, 'no-router': {}, vlans: { net2Edge: 'switch' }
  });
  // each preset with a before is one swap away from it, so its caption names that swap
  const what = { 'primjer-3b': 'net2Edge-switch', 'no-router': 'router-switch', vlans: 'vlans-on' };
  for (const p of logic.presets.filter((x) => x.before)) {
    assert.equal(logic.captionKey(P(p.before), P(p.params)).what, what[p.id], p.id);
  }
});

test('every caption key the model can return has a string in both languages', () => {
  const whats = ['net1Core-switch', 'net1Core-hub', 'net2Edge-switch', 'net2Edge-hub', 'router-switch', 'router-router',
    'office-switch', 'office-hub', 'vlans-on', 'vlans-off', 'many'];
  for (const lang of ['hr', 'en']) {
    for (const w of whats) assert.ok(strings[lang]['what_' + w], `${lang} what_${w}`);
    for (const key of ['capTwo', 'capOffice_hub', 'capOffice_switch', 'capColl', 'capBc', 'capMerge', 'capSplit', 'capBoth', 'capSame']) {
      assert.ok(strings[lang][key], `${lang} ${key}`);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    const c = logic.compare(p.before && P(p.before), P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(c)), c);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ net2Edge: 'switch', vlans: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables', () => {
  for (const p of logic.presets) {
    for (const x of [p.before || {}, p.params]) for (const k of Object.keys(x)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.deepEqual(meta.entries.map((e) => e.preset), logic.presets.map((p) => p.id));
});
