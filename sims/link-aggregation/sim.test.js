// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for link-aggregation's model (rules in SPEC.md). Run: node --test sims/link-aggregation/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg || ''} ${a} ≈ ${b}`);
const byPreset = (id) => D(logic.presets.find((x) => x.id === id).params);

/** Every combination of the params the page offers. */
function* everyParams() {
  for (let members = 2; members <= 4; members++)
    for (const policy of logic.POLICIES)
      for (let flows = 1; flows <= 8; flows++)
        for (const fail of logic.FAILS)
          for (const sameClient of [false, true])
            for (const demand of [100, 300, 1000]) yield { members, policy, flows, fail, sameClient, demand };
}

// ── tie-breaks first ──

test('tie-break (rule 2): flows with the same inputs for the policy always share a member', () => {
  for (const policy of ['layer2', 'layer2+3']) {
    for (let members = 2; members <= 4; members++) {
      const s = D({ flows: 8, sameClient: true, policy, members });
      assert.equal(new Set(Object.values(s.assignment)).size, 1, `${policy} ${members}`);
      assert.ok(s.samePair);
    }
  }
  // layer3+4 reads the ports, so C1's flows are no longer "the same pair"
  const s = D({ flows: 4, sameClient: true, policy: 'layer3+4' });
  assert.equal(s.samePair, false);
  assert.deepEqual(s.assignment, { F1: 2, F2: 1, F3: 2, F4: 1 });
  // one flow is never "the same pair", and different clients on one link are not either
  assert.equal(D({ flows: 1, sameClient: true }).samePair, false);
  const two = D({ flows: 2 });
  assert.deepEqual(two.perMember[1], ['F1', 'F2']);
  assert.equal(two.samePair, false);
});

test('tie-break (rule 3): equal demands get equal shares, whatever their order', () => {
  assert.deepEqual(logic.share([1000, 1000, 1000, 1000], 1000), [250, 250, 250, 250]);
  assert.deepEqual(logic.share([300, 100, 300], 1000), [300, 100, 300]);     // all fit
  const a = logic.share([800, 100, 800], 1000), b = logic.share([800, 800, 100], 1000);
  near(a[0], 450); near(a[1], 100); near(a[2], 450);
  assert.deepEqual([b[0], b[1], b[2]], [a[0], a[2], a[1]]);
  assert.deepEqual(logic.share([], 1000), []);
});

test('tie-break (rule 5): a policy with the same assignment moves and marks nothing', () => {
  const a = D({ policy: 'layer2+3' }), b = D({ policy: 'layer3+4' });
  assert.deepEqual(a.assignment, { F1: 2 });
  assert.deepEqual(b.assignment, { F1: 2 });
  assert.deepEqual(logic.changed(a, b), []);
  // the same params twice: nothing
  assert.deepEqual(logic.changed(D({ flows: 8 }), D({ flows: 8 })), []);
  // a different assignment marks exactly the flows that moved
  const c = D({ flows: 4, sameClient: true, policy: 'layer2' }), d = D({ flows: 4, sameClient: true, policy: 'layer3+4' });
  assert.deepEqual(logic.changed(c, d), ['F1', 'F3']);
  assert.deepEqual(logic.changed(c, D({ flows: 4, sameClient: true, policy: 'layer2+3' })), ['F1', 'F2', 'F3', 'F4']);
  // no state before: nothing
  assert.deepEqual(logic.changed(null, d), []);
});

test('changed: flows are matched by their headers; new or different flows are not "moved"', () => {
  // adding flows: F1 keeps its link, the new ones are not marked
  assert.deepEqual(logic.changed(D({ flows: 1 }), D({ flows: 8 })), []);
  // sameClient on: F2…F8 are other flows (C1's ports), F1 is the same flow and stays
  assert.deepEqual(logic.changed(D({ flows: 8 }), D({ flows: 8, sameClient: true })), []);
  // a change of members moves flows on any link
  assert.deepEqual(logic.changed(D({ flows: 8 }), D({ flows: 8, members: 3 })), ['F2', 'F4', 'F5', 'F7', 'F8']);
  // demand alone moves nothing
  assert.deepEqual(logic.changed(D({ flows: 8 }), D({ flows: 8, demand: 200 })), []);
  // a flow with no link before or after (the bond down) did not move
  assert.deepEqual(logic.changed(D({ flows: 2, fail: 'all' }), D({ flows: 2 })), []);
  assert.deepEqual(logic.changed(D({ flows: 2 }), D({ flows: 2, fail: 'all' })), []);
  // the source port is part of a flow's identity: C1's other ports are other flows, not moved ones
  assert.deepEqual(logic.changed(D({ flows: 8, policy: 'layer3+4' }), D({ flows: 8, sameClient: true, policy: 'layer3+4' })), []);
});

// ── rule 1: one flow, one member ──

test('rule 1: every flow is on exactly one up member and never above one member\'s speed', () => {
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    for (const f of s.flows) {
      assert.ok(s.rate[f.id] <= logic.CAPACITY + 1e-9, JSON.stringify(p));
      if (s.bondDown) { assert.equal(s.assignment[f.id], null); continue; }
      assert.ok(s.up.includes(s.assignment[f.id]), JSON.stringify(p));
      const on = Object.values(s.perMember).filter((ids) => ids.includes(f.id));
      assert.equal(on.length, 1, `${f.id} on one member, ${JSON.stringify(p)}`);
    }
    assert.ok(s.fastest <= logic.CAPACITY + 1e-9);
  }
});

test('rule 1: one flow at full demand gets 1 Gbit/s, whatever the number of members', () => {
  for (let members = 2; members <= 4; members++) {
    for (const policy of logic.POLICIES) {
      const s = D({ members, policy });
      near(s.delivered, 1000);
      assert.equal(s.capacity, members * 1000);
      assert.equal(logic.idleMembers(s).length, members - 1);
    }
  }
});

// ── rule 2: the hash ──

test('rule 2: the three simplified hashes, worked for C1 → S', () => {
  const [f] = logic.flowsOf(P());
  assert.equal(logic.lastByte(f.srcMac), 0x3a);
  assert.equal(logic.lastByte(f.dstMac), 0x10);
  assert.equal(logic.lastOctet(f.srcIp), 21);
  assert.equal(logic.lastOctet(f.dstIp), 10);
  assert.equal(logic.hashOf(f, 'layer2'), 42);
  assert.equal(logic.hashOf(f, 'layer2+3'), 53);
  assert.equal(logic.hashOf(f, 'layer3+4'), 54819);
  // each policy reads only its own fields
  const g = { ...f, srcPort: f.srcPort + 1 };
  assert.equal(logic.hashOf(g, 'layer2'), logic.hashOf(f, 'layer2'));
  assert.equal(logic.hashOf(g, 'layer2+3'), logic.hashOf(f, 'layer2+3'));
  assert.notEqual(logic.hashOf(g, 'layer3+4'), logic.hashOf(f, 'layer3+4'));
  const i = { ...f, srcIp: '192.168.10.30' };
  assert.equal(logic.hashOf(i, 'layer2'), logic.hashOf(f, 'layer2'));
  assert.notEqual(logic.hashOf(i, 'layer2+3'), logic.hashOf(f, 'layer2+3'));
  const m = { ...f, srcMac: '02:00:00:0a:00:3b' };
  assert.notEqual(logic.hashOf(m, 'layer2'), logic.hashOf(f, 'layer2'));
  assert.equal(logic.hashOf(m, 'layer3+4'), logic.hashOf(f, 'layer3+4'));
});

test('rule 2: member = up[hash mod number of up members], up members in id order', () => {
  const s = D({ flows: 8, members: 3, fail: 'link2' });
  assert.deepEqual(s.up, [1, 3]);
  for (const f of s.flows) {
    assert.equal(s.index[f.id], s.hash[f.id] % 2);
    assert.equal(s.assignment[f.id], [1, 3][s.hash[f.id] % 2]);
  }
  const t = D({ flows: 8, members: 4 });
  assert.deepEqual(t.flows.map((f) => t.assignment[f.id]), t.flows.map((f) => (t.hash[f.id] % 4) + 1));
});

test('flows: added in a fixed order; sameClient uses C1 with ports 50612…', () => {
  const a = logic.flowsOf(P({ flows: 8 }));
  assert.deepEqual(a.map((f) => f.client), ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
  assert.ok(a.every((f) => f.dstMac === logic.SERVER.mac && f.dstIp === logic.SERVER.ip && f.dstPort === 5000));
  const b = logic.flowsOf(P({ flows: 8, sameClient: true }));
  assert.ok(b.every((f) => f.client === 'C1' && f.srcMac === a[0].srcMac && f.srcIp === a[0].srcIp));
  assert.deepEqual(b.map((f) => f.srcPort), [50612, 50613, 50614, 50615, 50616, 50617, 50618, 50619]);
  assert.equal(logic.flowKey(a[0]), logic.flowKey(b[0]), 'F1 is the same flow either way');
  assert.ok(a.every((f) => f.demand === 1000));
});

// ── rule 3: sharing ──

test('rule 3: flows on one member share its 1 Gbit/s; spare capacity is not lent', () => {
  const s = byPreset('many-clients');
  assert.deepEqual(s.perMember, { 1: ['F1', 'F2', 'F4', 'F5', 'F7', 'F8'], 2: ['F3', 'F6'] });
  for (const id of s.perMember[1]) near(s.rate[id], 1000 / 6, id);
  for (const id of s.perMember[2]) near(s.rate[id], 200, id);
  near(s.memberLoad[1], 1000);
  near(s.memberLoad[2], 400);
  assert.deepEqual(logic.overloaded(s), [1]);
  // water-filling with unequal demands: the small one is met, the rest split what is left
  const w = logic.share([100, 1000, 1000], 1000);
  near(w[0], 100); near(w[1], 450); near(w[2], 450);
  // a member whose flows want less than 1 Gbit/s carries exactly what they want
  const x = D({ flows: 4, sameClient: true, demand: 200 });
  near(x.memberLoad[1], 800);
  assert.deepEqual(logic.overloaded(x), []);
  // overloaded means wanting more than 1 Gbit/s: exactly 1 Gbit/s is full, not overloaded
  assert.deepEqual(logic.overloaded(D({ flows: 2, demand: 500 })), []);
  assert.deepEqual(logic.overloaded(D({ flows: 2, demand: 600 })), [1]);
  // it reads the demands, not the rates (4 × 250 delivered = exactly 1000, but 4000 wanted)
  assert.deepEqual(logic.overloaded(byPreset('same-pair')), [1]);
});

// ── rule 4: failure ──

test('rule 4: a failed member is removed and every flow is re-hashed; healthy flows can move', () => {
  const s = D({ members: 3, flows: 8, fail: 'link2', demand: 200 });
  assert.deepEqual(s.members.map((m) => m.up), [true, false, true]);
  assert.deepEqual(s.failover.failed, [2]);
  assert.deepEqual(s.failover.before, D({ members: 3, flows: 8, demand: 200 }).assignment);
  assert.deepEqual(s.failover.moved, ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']);
  assert.deepEqual(s.failover.fromFailed, ['F2', 'F3', 'F5', 'F6']);
  assert.deepEqual(s.failover.fromHealthy, ['F4', 'F7', 'F8']);
  assert.deepEqual(s.perMember[2], []);
  assert.equal(s.capacity, 2000);
  // nobody is dropped while one member is up
  for (const p of everyParams()) {
    if (p.fail === 'all') continue;
    const t = logic.derive(P(p));
    assert.ok(t.flows.every((f) => t.rate[f.id] > 0), JSON.stringify(p));
  }
  // no failure, no failover record
  assert.equal(D({ flows: 8 }).failover, null);
});

// ── rule 6: edge ──

test('rule 6: every member down → nothing delivered, no assignment, bond down', () => {
  for (let members = 2; members <= 4; members++) {
    const s = D({ members, flows: 5, fail: 'all' });
    assert.equal(s.bondDown, true);
    assert.deepEqual(s.up, []);
    assert.equal(s.delivered, 0);
    assert.equal(s.fastest, 0);
    assert.equal(s.capacity, 0);
    assert.equal(s.offered, 5000);
    assert.ok(Object.values(s.assignment).every((m) => m === null));
    assert.ok(Object.values(s.memberLoad).every((x) => x === 0));
    assert.deepEqual(logic.idleMembers(s), []);
  }
  assert.equal(D({ fail: 'link1' }).bondDown, false);
});

// ── presets: the task's numbers ──

test('preset one-flow: 1 Gbit/s on link 1, link 2 idle', () => {
  const s = byPreset('one-flow');
  assert.deepEqual(s.assignment, { F1: 1 });
  near(s.delivered, 1000);
  assert.deepEqual(logic.idleMembers(s), [2]);
});

test('preset same-pair: 4 × 0.25 on link 1 under layer2; 2 + 2 under layer3+4', () => {
  const s = byPreset('same-pair');
  assert.deepEqual(s.perMember, { 1: ['F1', 'F2', 'F3', 'F4'], 2: [] });
  for (const f of s.flows) near(s.rate[f.id], 250);
  near(s.delivered, 1000);
  assert.ok(s.samePair);
  const t = D({ ...logic.presets.find((x) => x.id === 'same-pair').params, policy: 'layer3+4' });
  assert.deepEqual(t.perMember, { 1: ['F2', 'F4'], 2: ['F1', 'F3'] });
  near(t.delivered, 2000);
});

test('preset many-clients: 6 + 2, link 1 full, 1.4 of 1.6 delivered; layer2+3 spreads 4 + 4', () => {
  const s = byPreset('many-clients');
  near(s.offered, 1600);
  near(s.delivered, 1400);
  near(s.fastest, 200);
  const t = D({ ...logic.presets.find((x) => x.id === 'many-clients').params, policy: 'layer2+3' });
  assert.deepEqual([t.perMember[1].length, t.perMember[2].length], [4, 4]);
  near(t.delivered, 1600);
});

test('preset fail: all 8 on link 1 at 0.125, 1 Gbit/s delivered, F3 and F6 moved', () => {
  const s = byPreset('fail');
  assert.deepEqual(s.perMember, { 1: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'], 2: [] });
  for (const f of s.flows) near(s.rate[f.id], 125);
  near(s.delivered, 1000);
  assert.deepEqual(s.failover.moved, ['F3', 'F6']);
  assert.deepEqual(s.failover.fromHealthy, []);
});

test('preset four-links: links 3, 1, 2 used, link 4 idle; fewer flows than links always leave one idle', () => {
  const s = byPreset('four-links');
  assert.deepEqual(s.assignment, { F1: 3, F2: 1, F3: 2 });
  assert.deepEqual(logic.idleMembers(s), [4]);
  near(s.delivered, 3000);
  for (const policy of logic.POLICIES) assert.ok(logic.idleMembers(D({ members: 4, flows: 3, policy })).length >= 1);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  const s = D({ fail: 'all', flows: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ members: 3, flows: 8, fail: 'link1', policy: 'layer3+4' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, on the controls\' scale, and named in both tables', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const k of Object.keys(logic.RANGES)) {
      const [min, max, step] = logic.RANGES[k], v = p.params[k];
      assert.ok(v >= min && v <= max && (v - min) % step === 0, `${p.id} ${k}`);
    }
    assert.ok(logic.POLICIES.includes(p.params.policy));
    assert.ok(logic.FAILS.includes(p.params.fail));
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
