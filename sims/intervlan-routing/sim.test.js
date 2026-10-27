// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for intervlan-routing's model. Run: node --test sims/intervlan-routing/
// Numbers from SPEC.md: URM ch12 (Grafo d.o.o. addresses, "Konfiguracija mrežnog sučelja", Primjer 1), ch07
// ("VLAN-ovi: jedna žica, više logičkih mreža", Primjer 6), IEEE 802.1Q (1518 → 1522), RFC 1812 §5.3.1 (TTL).
// Tie-breaks first, then one test per rule, then the presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); const out = [logic.initial(p)]; for (let n = 1; n <= logic.steps(p); n++) out.push(logic.step(out[n - 1], n, p)); return out; };
const end = (over) => { const r = run(over); return r[r.length - 1]; };
const PRESETS = { roas: {}, 'l3-svi': { mode: 'l3' }, 'same-vlan': { dst: 'p2' }, 'access-port': { fault: 'access-port' }, 'vid-mismatch': { fault: 'vid-mismatch' } };
const M = logic.MAC;
const scene = (over) => logic.sceneOf(P(over));
const host = (id) => scene({}).hosts.find((h) => h.id === id);

// ── tie-breaks ──

test('tie-break rule 1: the sender\'s own mask decides, not the destination\'s network', () => {
  // 192.168.1.66 lives in a /27, but P1 ANDs with its /26: 192.168.1.64 ≠ 192.168.1.0
  const d = logic.hostDecision(host('P1'), '192.168.1.66');
  assert.deepEqual([d.own, d.theirs, d.mask, d.local, d.nextHop], ['192.168.1.0', '192.168.1.64', '255.255.255.192', false, '192.168.1.1']);
  // and Q1 ANDs with its /27 for P1: 192.168.1.0 ≠ 192.168.1.64
  const q = logic.hostDecision(host('Q1'), '192.168.1.2');
  assert.deepEqual([q.own, q.theirs, q.local, q.nextHop], ['192.168.1.64', '192.168.1.0', false, '192.168.1.65']);
  // and the step hands P1's own host record (its /26) to the decision, not the target's
  assert.deepEqual(at({}, 1).decision, d);
  assert.equal(at({ mode: 'l3' }, 1).decision.mask, '255.255.255.192');
});

test('a host drops a frame that is tagged, for another MAC, or for another IP', () => {
  const p = P({});
  const s7 = at({}, 7);
  const deliver = (patch) => logic.step(Object.assign(structuredClone(s7), { frame: Object.assign({}, s7.frame, patch) }), 8, p);
  assert.equal(deliver({}).outcome, 'delivered');
  for (const patch of [{ vid: 20 }, { dstMac: M.P2 }, { dstIp: '192.168.1.67' }]) {
    const s = deliver(patch);
    assert.deepEqual([s.at, s.outcome, s.dropReason], ['Q1', 'dropped', 'not-mine'], JSON.stringify(patch));
  }
});

test('tie-break rule 2: an access port tags nothing, even a frame of its own VLAN', () => {
  const sw = scene({}).sw;
  const f = { dstMac: M.P2, srcMac: M.P1, vid: null, size: 1518, srcIp: '192.168.1.2', dstIp: '192.168.1.3', ttl: 64 };
  assert.equal(logic.switchEgress(sw, 'Fa0/5', f, 10).vid, null);
  assert.equal(logic.switchEgress(sw, 'Fa0/5', f, 10).size, 1518);
  assert.equal(logic.switchEgress(sw, 'Fa0/5', f, 20), null, 'an access port in VLAN 10 never carries VLAN 20');
  // with the access-port fault, Gi0/1 sends VLAN 10 untagged
  assert.equal(logic.switchEgress(scene({ fault: 'access-port' }).sw, 'Gi0/1', f, 10).vid, null);
});

test('tie-break rule 5: the subinterface number is a label; the dot1q VID decides', () => {
  const r = scene({ fault: 'vid-mismatch' }).router;
  assert.equal(r.subifs[1].name, 'Gi0/0.20');
  assert.equal(r.subifs[1].vid, 21);
  assert.deepEqual(logic.subifFor(r, 20), { subif: null, drop: 'no-subif' }, 'a VID 20 frame does not find "Gi0/0.20"');
  assert.deepEqual(logic.subifFor(r, 21), { subif: 1, drop: null });
  // a router with the names swapped still maps by VID
  const swapped = { subifs: [{ name: 'Gi0/0.20', vid: 10 }, { name: 'Gi0/0.10', vid: 20 }] };
  assert.equal(swapped.subifs[logic.subifFor(swapped, 10).subif].name, 'Gi0/0.20');
});

test('tie-break rule 9: an untagged frame matches no subinterface, not even the one for VLAN 10', () => {
  const r = scene({}).router;
  assert.deepEqual(logic.subifFor(r, null), { subif: null, drop: 'untagged' });
  assert.deepEqual(logic.subifFor(r, 10), { subif: 0, drop: null });
});

test('tie-break rule 6: the longest prefix wins; equal prefixes go to the first listed', () => {
  const ifs = [{ ip: '10.0.0.1', prefix: 8 }, { ip: '10.1.0.1', prefix: 16 }, { ip: '10.1.0.2', prefix: 16 }];
  assert.deepEqual(logic.routeLookup(ifs, '10.1.2.3'), { iface: 1, net: '10.1.0.0/16' });
  assert.deepEqual(logic.routeLookup(ifs, '10.9.9.9'), { iface: 0, net: '10.0.0.0/8' });
  assert.equal(logic.routeLookup(ifs, '192.168.0.1'), null);
  assert.deepEqual(logic.routeLookup(scene({}).router.subifs, '192.168.1.66'), { iface: 1, net: '192.168.1.64/27' });
  assert.deepEqual(logic.routeLookup(scene({ mode: 'l3' }).sw.svis, '192.168.1.66'), { iface: 1, net: '192.168.1.64/27' });
});

// ── rules ──

test('rule 1: remote destination → the gateway\'s MAC (R1 or SW1); same subnet → the host\'s own MAC', () => {
  assert.equal(at({}, 1).frame.dstMac, M.R1);
  assert.equal(at({ mode: 'l3' }, 1).frame.dstMac, M.SW1);
  assert.equal(at({ dst: 'p2' }, 1).frame.dstMac, M.P2);
  assert.equal(at({ dst: 'p2', mode: 'l3' }, 1).frame.dstMac, M.P2);
  assert.deepEqual(at({}, 1).events, ['host-remote']);
  assert.deepEqual(at({ dst: 'p2' }, 1).events, ['host-local']);
  // the same-subnet frame never reaches R1: the trunk stays at 0 and R1 decides nothing
  const r = run({ dst: 'p2' });
  assert.equal(end({ dst: 'p2' }).linkUses.trunk, 0);
  assert.ok(r.every((s) => s.at !== 'R1' && s.at !== 'trunk'));
});

test('rule 2: hosts send and receive untagged; the access port assigns the VLAN on ingress', () => {
  for (const over of Object.values(PRESETS)) {
    const r = run(over);
    assert.equal(r[1].frame.vid, null, 'leaves P1 untagged');
    const last = r[r.length - 1];
    if (last.outcome === 'delivered') assert.equal(last.frame.vid, null, 'delivered untagged');
  }
  assert.equal(at({}, 2).vlan, 10);
  assert.equal(at({ fault: 'access-port' }, 2).vlan, 10);
  assert.equal(logic.arrivalVlan('access-20', 10), 20, 'an access port never looks for a tag');
});

test('rule 3: the switch looks the MAC up in the frame\'s VLAN only; R1 is in both VLANs on Gi0/1', () => {
  const sw = scene({}).sw;
  const h10 = logic.macLookup(sw, 10, M.R1), h20 = logic.macLookup(sw, 20, M.R1);
  assert.equal(h10.port, 'Gi0/1');
  assert.equal(h20.port, 'Gi0/1');
  assert.notEqual(h10.row, h20.row);
  assert.equal(logic.macLookup(sw, 20, M.P1), null, 'P1 is not in VLAN 20');
  assert.equal(logic.macLookup(sw, 10, M.Q1), null, 'Q1 is not in VLAN 10');
  assert.deepEqual(at({}, 2).lookup, { table: 'mac', vlan: 10, mac: M.R1, row: h10.row });
  assert.deepEqual(at({}, 6).lookup, { table: 'mac', vlan: 20, mac: M.Q1, row: logic.macLookup(sw, 20, M.Q1).row });
  assert.equal(at({}, 6).outPort, 'Fa0/2');
  // with a fault, R1's VLAN 20 frames never reached SW1: not learnt in VLAN 20
  for (const fault of ['access-port', 'vid-mismatch']) assert.equal(logic.macLookup(scene({ fault }).sw, 20, M.R1), null);
});

test('rule 4: trunk egress inserts the tag (1518 → 1522); trunk ingress drops a VID the switch lacks', () => {
  const s3 = at({}, 3);
  assert.deepEqual([s3.at, s3.frame.vid, s3.frame.size], ['trunk', 10, 1522]);
  assert.deepEqual(s3.changed, ['vid', 'size']);
  const sw = scene({}).sw;
  assert.deepEqual(logic.switchIngress(sw, 'Gi0/1', { vid: 20 }), { vlan: 20, drop: null });
  assert.deepEqual(logic.switchIngress(sw, 'Gi0/1', { vid: 21 }), { vlan: null, drop: 'unknown-vlan' });
  // and the access egress strips it again (1522 → 1518)
  const s7 = at({}, 7);
  assert.deepEqual([s7.at, s7.frame.vid, s7.frame.size], ['q1', null, 1518]);
  assert.deepEqual(s7.changed, ['vid', 'size']);
});

test('rule 5: R1 takes VID 10 on Gi0/0.10', () => {
  const s4 = at({}, 4);
  assert.deepEqual([s4.at, s4.phase, s4.inSubif], ['R1', 'received', 0]);
  assert.deepEqual(s4.lookup, { table: 'subif', vid: 10, row: 0 });
});

test('rule 6: routing rewrites MACs, decrements TTL and tags with the egress subinterface\'s VID', () => {
  const s5 = at({}, 5);
  assert.deepEqual(s5.frame, { dstMac: M.Q1, srcMac: M.R1, vid: 20, size: 1522, srcIp: '192.168.1.2', dstIp: '192.168.1.66', ttl: 63 });
  assert.deepEqual(s5.changed, ['dstMac', 'srcMac', 'vid', 'ttl'], 'the IP addresses stay; the tag goes from 10 to 20');
  assert.deepEqual(s5.lookup, { table: 'route', iface: 1, net: '192.168.1.64/27' });
  assert.equal(s5.outSubif, 1);
  // pure rewrite
  const f = { dstMac: 'a', srcMac: 'b', vid: 10, size: 1522, srcIp: 'x', dstIp: 'y', ttl: 5 };
  assert.deepEqual(logic.rewrite(f, 'r', 'q', null), { dstMac: 'q', srcMac: 'r', vid: null, size: 1518, srcIp: 'x', dstIp: 'y', ttl: 4 });
  assert.equal(f.ttl, 5, 'rewrite does not change its input');
});

test('rule 7: router on a stick crosses the trunk twice, every other used link once', () => {
  assert.deepEqual(end({}).linkUses, { p1: 1, q1: 1, p2: 0, trunk: 2 });
  assert.deepEqual(end({}).hops, [{ link: 'p1', vid: null }, { link: 'trunk', vid: 10 }, { link: 'trunk', vid: 20 }, { link: 'q1', vid: null }]);
  assert.deepEqual(run({}).map((s) => s.linkChanged), [null, 'p1', null, 'trunk', null, 'trunk', null, 'q1', null]);
});

test('rule 8: an L3 switch routes inside itself; no tag on any wire, no trunk', () => {
  const r = run({ mode: 'l3' });
  assert.ok(!('trunk' in r[0].linkUses));
  assert.ok(r.every((s) => !s.frame || s.frame.vid === null));
  assert.deepEqual(end({ mode: 'l3' }).hops, [{ link: 'p1', vid: null }, { link: 'q1', vid: null }]);
  assert.equal(r[2].phase, 'to-svi');
  assert.equal(r[2].lookup.row, logic.macLookup(scene({ mode: 'l3' }).sw, 10, M.SW1).row, 'the hit is SW1\'s own row');
  assert.deepEqual(r[3].frame, { dstMac: M.Q1, srcMac: M.SW1, vid: null, size: 1518, srcIp: '192.168.1.2', dstIp: '192.168.1.66', ttl: 63 });
  assert.deepEqual([r[3].vlan, r[3].outPort], [20, 'Fa0/2']);
  assert.ok(!scene({ mode: 'l3' }).router);
});

test('rule 9: the switch port left as access VLAN 10 sends untagged; R1 drops it at step 4', () => {
  const r = run({ fault: 'access-port' });
  assert.deepEqual([r[3].at, r[3].frame.vid, r[3].frame.size], ['trunk', null, 1518]);
  assert.deepEqual([r[4].at, r[4].outcome, r[4].dropReason], ['R1', 'dropped', 'untagged']);
  assert.equal(r[4].linkUses.trunk, 1);
});

test('rule 10: one MAC for R1 on every subinterface, one for SW1 on every SVI', () => {
  assert.equal(at({}, 3).frame.dstMac, at({}, 5).frame.srcMac);
  assert.equal(at({ mode: 'l3' }, 1).frame.dstMac, at({ mode: 'l3' }, 3).frame.srcMac);
});

test('vid-mismatch: R1 routes and tags VID 21; SW1 has no VLAN 21 and drops it at step 6', () => {
  const r = run({ fault: 'vid-mismatch' });
  assert.equal(r[5].frame.vid, 21);
  assert.equal(r[5].frame.ttl, 63);
  assert.deepEqual([r[6].at, r[6].outcome, r[6].dropReason, r[6].inPort], ['SW1', 'dropped', 'unknown-vlan', 'Gi0/1']);
  assert.equal(r[6].linkUses.trunk, 2);
});

test('a host takes only a frame for its own MAC, untagged', () => {
  for (const over of Object.values(PRESETS)) {
    const e = end(over);
    if (e.outcome === 'delivered') assert.equal(e.at, over.dst === 'p2' ? 'P2' : 'Q1');
  }
});

// ── presets ──

test('presets: steps 8, 5, 4, 4, 6 and their outcomes (SPEC.md)', () => {
  const want = { roas: [8, 'delivered'], 'l3-svi': [5, 'delivered'], 'same-vlan': [4, 'delivered'], 'access-port': [4, 'dropped'], 'vid-mismatch': [6, 'dropped'] };
  for (const [id, over] of Object.entries(PRESETS)) {
    assert.equal(logic.steps(P(over)), want[id][0], id);
    assert.equal(end(over).outcome, want[id][1], id);
  }
  // every combination: at most 8 steps; the fault is ignored in l3 and when the frame never leaves VLAN 10's hosts
  for (const mode of logic.modes) for (const dst of logic.dsts) for (const fault of logic.faults) {
    const n = logic.steps(P({ mode, dst, fault }));
    assert.ok(n >= 4 && n <= 8);
    if (mode === 'l3') assert.deepEqual(run({ mode, dst, fault }), run({ mode, dst }));
    if (dst === 'p2') assert.equal(n, 4);
  }
  assert.equal(logic.steps(logic.defaults), 8);
});

test('the roas run: where the frame is and its TTL at every step (SPEC.md table)', () => {
  const r = run({});
  assert.deepEqual(r.map((s) => s.at), ['P1', 'p1', 'SW1', 'trunk', 'R1', 'trunk', 'SW1', 'q1', 'Q1']);
  assert.deepEqual(r.slice(1).map((s) => s.frame.ttl), [64, 64, 64, 64, 63, 63, 63, 63]);
  assert.deepEqual(r.slice(1).map((s) => s.frame.vid), [null, null, 10, 10, 20, 20, null, null]);
});

test('params out of range fall back to the defaults', () => {
  assert.equal(logic.steps({ mode: 'x', dst: 'y', fault: 'z' }), 8);
  assert.equal(logic.sceneOf({ mode: 'l3', fault: 'access-port' }).fault, 'none');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const forward = run(over);
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/\{ id: '([a-z0-9-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});
