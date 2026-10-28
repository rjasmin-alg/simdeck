// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for vlan-trunk's model (SPEC.md). Run: node --test sims/vlan-trunk/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const fr = (s, id) => s.frames.find((f) => f.id === id);
const trunk = (native, allowed) => ({ mode: 'trunk', native, allowed: allowed || [[1, 4094]] });
const access = (vlan) => ({ mode: 'access', vlan });

// ── tie-breaks first ──

test('tie-break: the native VLAN leaves a trunk untagged, even VLAN 10', () => {
  assert.deepEqual(logic.egress(trunk(10), 10), { tag: null });
  assert.deepEqual(logic.egress(trunk(10), 20), { tag: 20 });
  const s = at({ native1: 10, send: 'ra1-ra2' }, 3);
  assert.equal(fr(s, 'f1').tag, null);
  assert.equal(fr(s, 'f1').len, 1518);
});

test('tie-break: the allowed list beats the native VLAN on egress', () => {
  assert.deepEqual(logic.egress(trunk(20, [[1, 19], [21, 4094]]), 20), { drop: 'not-allowed' });
});

test('tie-break: a known port equal to the ingress port is filtered', () => {
  const sc = logic.sceneOf(P({}));
  assert.deepEqual(logic.forward(sc, 'SW2', 10, 'Gi0/1', 'Ra1'), { ports: [], how: 'known' });
});

test('tie-break: a flood to two ports makes two copies, one port keeps the id', () => {
  const s = at({ native1: 20, send: 'pr1-bcast' }, 3);
  assert.deepEqual(s.frames.map((f) => f.id), ['f1.Fa0/3', 'f1.Gi0/1']);
  assert.deepEqual(at({ send: 'pr1-bcast' }, 3).frames.map((f) => f.id), ['f1']);
});

test('tie-break: a leak is marked at the ingress, also when the frame ends ignored', () => {
  // native1 10: Ra1's frame leaves SW1 untagged, SW2 puts it in VLAN 1 where Ra2 is unknown → flooded to M2
  const s4 = at({ native1: 10, send: 'ra1-ra2' }, 4);
  assert.equal(fr(s4, 'f1').vlan, 1);
  assert.equal(fr(s4, 'f1').leak, true);
  const s5 = at({ native1: 10, send: 'ra1-ra2' }, 5);
  assert.equal(fr(s5, 'f1').status, 'ignored');
  assert.deepEqual(s5.delivered, []);
});

// ── rules ──

test('rule 1: hosts send untagged 1518-byte frames and receive them untagged', () => {
  for (const send of logic.sends) {
    for (const link of logic.links) {
      const s1 = at({ send, link }, 1);
      for (const f of s1.frames) { assert.equal(f.tag, null); assert.equal(f.len, 1518); }
      const s5 = at({ send, link }, 5);
      for (const f of s5.frames.filter((x) => x.status === 'delivered')) assert.equal(f.tag, null);
    }
  }
});

test('rule 2: access port: untagged in → port VLAN; out only its own VLAN, untagged', () => {
  assert.deepEqual(logic.ingress(access(20), null), { vlan: 20, how: 'port' });
  assert.deepEqual(logic.egress(access(20), 20), { tag: null });
  assert.deepEqual(logic.egress(access(20), 10), { drop: 'other-vlan' });
});

test('rule 3: trunk egress tags with the VID unless native', () => {
  assert.deepEqual(logic.egress(trunk(1), 10), { tag: 10 });
  assert.deepEqual(logic.egress(trunk(1), 1), { tag: null });
  const s = at({}, 3);
  assert.equal(fr(s, 'f1').tag, 10);
  assert.equal(fr(s, 'f2').tag, 20);
  assert.equal(fr(s, 'f1').change, 'added');
});

test('rule 4: trunk ingress: tag → its VID, untagged → the port\'s native VLAN', () => {
  assert.deepEqual(logic.ingress(trunk(1), 20), { vlan: 20, how: 'tag' });
  assert.deepEqual(logic.ingress(trunk(99), null), { vlan: 99, how: 'native' });
  assert.equal(fr(at({ send: 'm1-m2' }, 4), 'f1').vlan, 1);
});

test('rule 5: allowed list: not sent on egress, dropped on ingress', () => {
  const al = logic.without([[1, 4094]], 20);
  assert.deepEqual(al, [[1, 19], [21, 4094]]);
  assert.equal(logic.inAllowed(al, 20), false);
  assert.equal(logic.inAllowed(al, 21), true);
  assert.deepEqual(logic.egress(trunk(1, al), 20), { drop: 'not-allowed' });
  assert.deepEqual(logic.ingress(trunk(1, al), 20), { drop: 'not-allowed', vlan: 20 });
  const s = at({ allow20: false }, 3);
  assert.equal(fr(s, 'f2').status, 'dropped');
  assert.deepEqual(s.dropped, [{ frame: 'f2', where: 'SW1', port: 'Gi0/1', reason: 'not-allowed' }]);
  assert.equal(fr(at({ allow20: false }, 5), 'f1').status, 'delivered');
});

test('rule 6: the tag is 4 bytes: 1518 → 1522 → 1518; VID 1–4094', () => {
  assert.equal(logic.frameLen(null), 1518);
  assert.equal(logic.frameLen(10), 1522);
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => fr(at({}, n), 'f2').len), [1518, 1518, 1522, 1522, 1518]);
  assert.equal(fr(at({}, 5), 'f2').change, 'removed');
  assert.equal(logic.validVid(0), false);
  assert.equal(logic.validVid(1), true);
  assert.equal(logic.validVid(4094), true);
  assert.equal(logic.validVid(4095), false);
});

test('rule 7: a broadcast from Pr1 reaches Pr2 and no other host', () => {
  const s2 = at({ send: 'pr1-bcast' }, 2);
  assert.deepEqual(fr(s2, 'f1').where.out, ['Gi0/1']);
  assert.equal(fr(s2, 'f1').where.how, 'broadcast');
  const s4 = at({ send: 'pr1-bcast' }, 4);
  assert.deepEqual(fr(s4, 'f1').where.out, ['Fa0/2']);
  assert.deepEqual(at({ send: 'pr1-bcast' }, 5).delivered, [{ frame: 'f1', host: 'Pr2', leak: false }]);
  const sc = logic.sceneOf(P({}));
  assert.deepEqual(logic.forward(sc, 'SW1', 20, 'Fa0/2', 'broadcast').ports, ['Gi0/1']);
  assert.deepEqual(logic.forward(sc, 'SW1', 10, 'Fa0/1', 'broadcast').ports, ['Gi0/1']);
  assert.deepEqual(logic.forward(sc, 'SW1', 1, 'Gi0/1', 'broadcast').ports, ['Fa0/3']);
});

test('rule 8: cable as access VLAN 10: VLAN 10 untagged across, VLAN 20 stops at SW1', () => {
  const s3 = at({ link: 'access-10' }, 3);
  assert.equal(fr(s3, 'f1').tag, null);
  assert.equal(fr(s3, 'f1').where.link, 'isl');
  const s2 = at({ link: 'access-10' }, 2);
  assert.deepEqual(s2.dropped, [{ frame: 'f2', where: 'SW1', port: 'Fa0/2', reason: 'no-port' }]);
  const s5 = at({ link: 'access-10' }, 5);
  assert.deepEqual(s5.delivered.map((d) => d.host), ['Ra2']);
  assert.deepEqual(at({ link: 'access-20' }, 5).delivered.map((d) => d.host), ['Pr2']);
});

test('rule 9: native mismatch: M1\'s VLAN 1 frame lands in VLAN 99 on SW2', () => {
  const p = { send: 'm1-m2', native2: 99 };
  const s3 = at(p, 3);
  assert.equal(fr(s3, 'f1').tag, null);
  const s4 = at(p, 4);
  assert.equal(fr(s4, 'f1').vlan, 99);
  assert.equal(fr(s4, 'f1').leak, true);
  assert.equal(fr(s4, 'f2').vlan, 10);
  assert.equal(fr(s4, 'f2').leak, false);
  const s5 = at(p, 5);
  assert.deepEqual(s5.delivered, [{ frame: 'f1', host: 'M2', leak: true }, { frame: 'f2', host: 'Ra2', leak: false }]);
  // and with matching natives there is no leak
  assert.deepEqual(at({ send: 'm1-m2' }, 5).delivered.map((d) => d.leak), [false, false]);
});

test('rule 10: a tagged frame on an access port is dropped', () => {
  assert.deepEqual(logic.ingress(access(10), 10), { drop: 'tagged-on-access' });
});

test('rule 5 on ingress in the scene: an untagged frame lands in SW2\'s native VLAN 20, which is not allowed', () => {
  const p = { native2: 20, allow20: false, send: 'm1-m2' };
  // both trunks drop 20, so SW2's native VLAN 20 is outside its own list: M1's untagged frame is dropped at SW2
  const s4 = at(p, 4);
  assert.deepEqual(s4.dropped, [{ frame: 'f1', where: 'SW2', port: 'Gi0/1', reason: 'not-allowed' }]);
  assert.deepEqual(s4.events.find((e) => e.f === 'f1'), { f: 'f1', code: 'drop-in', sw: 'SW2', port: 'Gi0/1', reason: 'not-allowed', vlan: 20 });
  assert.equal(fr(at(p, 5), 'f2').status, 'delivered');
  // and M1's frames, dropped on SW2's ingress, never teach SW2 where M1 is
  const sc = logic.sceneOf(P(p));
  assert.equal(logic.macTable(sc, 'SW2').some((r) => r.host === 'M1'), false);
  assert.equal(logic.macTable(sc, 'SW1').some((r) => r.host === 'M2'), false);
});

test('events: what the captions are built from', () => {
  const ev = (o, n, id) => at(o, n).events.filter((e) => e.f === id);
  assert.deepEqual(ev({}, 1, 'f1'), [{ f: 'f1', code: 'send', host: 'Ra1' }]);
  assert.deepEqual(ev({}, 2, 'f2'), [{ f: 'f2', code: 'in', sw: 'SW1', port: 'Fa0/2', how: 'port', vlan: 20, from: null, fwd: 'known', out: ['Gi0/1'] }]);
  assert.deepEqual(ev({}, 3, 'f2'), [{ f: 'f2', code: 'out', sw: 'SW1', port: 'Gi0/1' }]);
  assert.deepEqual(ev({}, 4, 'f1'), [{ f: 'f1', code: 'in', sw: 'SW2', port: 'Gi0/1', how: 'tag', vlan: 10, from: 10, fwd: 'known', out: ['Fa0/1'] }]);
  assert.deepEqual(ev({}, 5, 'f1'), [{ f: 'f1', code: 'deliver', sw: 'SW2', port: 'Fa0/1', host: 'Ra2' }]);
  const mm = { send: 'm1-m2', native2: 99 };
  assert.deepEqual(ev(mm, 4, 'f1'), [{ f: 'f1', code: 'in', sw: 'SW2', port: 'Gi0/1', how: 'native', vlan: 99, from: 1, fwd: 'known', out: ['Fa0/3'] }]);
  assert.deepEqual(ev({ allow20: false }, 3, 'f2'), [{ f: 'f2', code: 'drop-out', sw: 'SW1', port: 'Gi0/1', reason: 'not-allowed', vlan: 20 }]);
  assert.deepEqual(ev({ link: 'access-10' }, 2, 'f2').map((e) => e.code), ['in', 'drop-fwd']);
  assert.deepEqual(ev({ native1: 10, send: 'ra1-ra2' }, 5, 'f1'), [{ f: 'f1', code: 'ignore', sw: 'SW2', port: 'Fa0/3', host: 'M2' }]);
});

test('MAC tables: a host is learnt in the VLAN its frames arrive in, or not at all', () => {
  const sc = logic.sceneOf(P({ native2: 99 }));
  const m2 = logic.macTable(sc, 'SW1').find((r) => r.host === 'M2');
  assert.deepEqual([m2.vlan, m2.port], [1, 'Gi0/1']);
  const sa = logic.sceneOf(P({ allow20: false }));
  assert.equal(logic.macTable(sa, 'SW1').some((r) => r.host === 'Pr2'), false);
  assert.equal(logic.forward(sa, 'SW1', 20, 'Fa0/2', 'Pr2').how, 'unknown');
});

test('presets: every one takes 5 steps and ends as SPEC.md says', () => {
  assert.equal(logic.steps, 5);
  const end = (o) => at(o, 5);
  assert.deepEqual(end({}).delivered.map((d) => d.host), ['Ra2', 'Pr2']);
  assert.deepEqual(end({ link: 'access-10' }).dropped.map((d) => d.reason), ['no-port']);
  assert.deepEqual(end({ send: 'pr1-bcast' }).delivered.map((d) => d.host), ['Pr2']);
  assert.deepEqual(end({ send: 'm1-m2' }).delivered.map((d) => d.host), ['M2', 'Ra2']);
  assert.deepEqual(end({ send: 'm1-m2', native2: 99 }).delivered.map((d) => d.leak), [true, false]);
  assert.deepEqual(end({ allow20: false }).dropped.map((d) => d.reason), ['not-allowed']);
});

test('unknown params fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ link: 'x', native1: 0, native2: 'a', send: 'y' }),
    { link: 'trunk', native1: 1, native2: 1, allow20: true, send: 'both' });
  assert.equal(logic.norm({ native1: 100 }).native1, 1);
  assert.equal(logic.norm({ native2: 99 }).native2, 99);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ native1: 20, send: 'pr1-bcast' }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ send: 'm1-m2', native2: 99 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
