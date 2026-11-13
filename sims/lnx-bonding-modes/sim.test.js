// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-bonding-modes' model (rules in SPEC.md). Run: node --test sims/lnx-bonding-modes/
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
const presetParams = (id) => logic.presets.find((x) => x.id === id).params;
const byPreset = (id) => D(presetParams(id));

/** Every combination of the params the page offers. */
function* everyParams() {
  for (const mode of logic.MODES)
    for (let members = 2; members <= 4; members++)
      for (const fail of logic.FAILS)
        for (const policy of logic.POLICIES)
          for (const switchCfg of logic.SWITCH)
            for (let flows = 1; flows <= 8; flows++)
              for (const gateway of [false, true]) yield { mode, members, fail, policy, switchCfg, flows, gateway };
}

// ── tie-breaks first ──

test('tie-break (rule 1): primary eth0 when up, otherwise the lowest-numbered up member', () => {
  assert.equal(logic.firstUp([0, 1, 2]), 0);
  assert.equal(logic.firstUp([1, 2, 3]), 1);
  assert.equal(logic.firstUp([3, 2]), 2, 'lowest, not first listed');
  assert.equal(logic.firstUp([]), null);
  assert.equal(D({ members: 4, fail: 'eth0' }).active, 1);
  assert.equal(D({ members: 4, fail: 'eth1' }).active, 0, 'a failed backup does not move the active member');
  assert.equal(D({ members: 3 }).active, 0, 'eth0 back: the primary is active again');
});

test('tie-break (rule 4): without a partner, 802.3ad uses the lowest-numbered up member', () => {
  for (const switchCfg of ['none', 'static']) {
    assert.equal(D({ mode: '802.3ad', switchCfg, members: 3 }).single, 0);
    assert.equal(D({ mode: '802.3ad', switchCfg, members: 3, fail: 'eth0' }).single, 1);
    assert.equal(D({ mode: '802.3ad', switchCfg, members: 3, fail: 'eth1' }).single, 0);
  }
  assert.equal(D({ mode: '802.3ad', switchCfg: 'lacp' }).single, null);
  // the single member is not an "active" member (no star), and active-backup has no single member
  assert.equal(D({ mode: '802.3ad' }).active, null);
  assert.equal(D({}).single, null);
});

test('tie-break (rule 3): flows with the same hash inputs share a member (all to the gateway under layer2)', () => {
  for (const mode of ['balance-xor', '802.3ad']) {
    for (let members = 2; members <= 4; members++) {
      const s = D({ mode, switchCfg: mode === '802.3ad' ? 'lacp' : 'static', policy: 'layer2', gateway: true, flows: 8, members });
      assert.equal(new Set(Object.values(s.assignment)).size, 1, `${mode} ${members}`);
      for (const f of s.flows) assert.equal(s.hash[f.id], 17);
    }
  }
});

test('tie-break (shares): flows on one member share it equally, whatever their order', () => {
  assert.deepEqual(logic.share([4000, 4000, 4000, 4000], 1000), [250, 250, 250, 250]);
  assert.deepEqual(logic.share([100, 4000], 1000), [100, 900], 'the copied max-min share: small demands first');
  const s = D({ mode: 'balance-xor', switchCfg: 'static', flows: 6, members: 3, policy: 'layer3+4' });
  for (const id of [0, 1, 2]) {
    const r = s.perMember[id].map((f) => s.rate[f]);
    for (const x of r) near(x, 1000 / r.length);
  }
});

// ── rules ──

test('rule 1: active-backup puts every flow on the active member; total ≤ one link; no switch config needed', () => {
  for (const p of everyParams()) {
    if (p.mode !== 'active-backup') continue;
    const s = D(p);
    assert.equal(s.how, 'active');
    for (const f of s.flows) assert.equal(s.assignment[f.id], s.active);
    near(s.delivered, 1000, JSON.stringify(p));
    assert.equal(s.switchOk, true);
    assert.deepEqual(s.warnings, []);
    assert.deepEqual(s.used, [s.active]);
  }
  const s = D({ fail: 'eth0' });
  assert.equal(s.active, 1);
  assert.ok(s.failover.activeMoved);
  assert.equal(s.failover.activeBefore, 0);
  assert.equal(D({ fail: 'eth1' }).failover.activeMoved, false);
});

test('rule 2: balance-rr spreads every flow over every up member at 0.8 of n links; reorder warning', () => {
  const one = D({ mode: 'balance-rr', switchCfg: 'static', flows: 1 });
  assert.deepEqual(one.assignment, { F1: 'all' });
  near(one.rate.F1, 1600);
  near(one.memberLoad[0], 800);
  near(one.memberLoad[1], 800);
  assert.deepEqual(one.perMember, { 0: ['F1'], 1: ['F1'] });
  assert.deepEqual(one.warnings, ['reorder']);
  assert.equal(one.unreliable, false);
  const four = D({ mode: 'balance-rr', switchCfg: 'static', flows: 4, members: 4 });
  near(four.delivered, 3200);
  for (const f of four.flows) near(four.rate[f.id], 800);
  // one member left: no reordering, no penalty
  const solo = D({ mode: 'balance-rr', switchCfg: 'static', flows: 1, fail: 'eth0' });
  near(solo.rate.F1, 1000);
  assert.deepEqual(solo.warnings, []);
  assert.deepEqual(solo.perMember, { 0: [], 1: ['F1'] });
  // only balance-rr lets one flow exceed one link
  for (const p of everyParams()) {
    const s = D(p);
    if (p.mode !== 'balance-rr') assert.ok(s.fastest <= 1000 + 1e-9, JSON.stringify(p));
  }
});

test('rule 2/3: balance-rr and balance-xor need a static aggregate; otherwise MAC flapping, delivered unreliable', () => {
  for (const mode of ['balance-rr', 'balance-xor']) {
    for (const switchCfg of logic.SWITCH) {
      const s = D({ mode, switchCfg, flows: 4, policy: 'layer3+4' });
      assert.equal(s.switchNeeds, 'static');
      assert.equal(s.switchOk, switchCfg === 'static');
      assert.equal(s.warnings.includes('macFlap'), switchCfg !== 'static', `${mode} ${switchCfg}`);
      assert.equal(s.unreliable, switchCfg !== 'static');
    }
  }
  // one member carrying: the MAC stays on one port, no flapping
  assert.deepEqual(D({ mode: 'balance-xor', switchCfg: 'none', gateway: true }).warnings, []);
  assert.deepEqual(D({ mode: 'balance-rr', switchCfg: 'none', fail: 'eth1' }).warnings, []);
});

test('rule 3: balance-xor member = up[hash mod up], the host\'s hash with S as the source', () => {
  const f = logic.flowsOf(P({ flows: 1 }))[0];
  assert.equal(logic.hashOf(f, 'layer2'), 0x10 ^ 0x3a);            // 42
  assert.equal(logic.hashOf(f, 'layer3+4'), 5000 ^ 50612 ^ 10 ^ 21); // 54819
  const s = D({ mode: 'balance-xor', switchCfg: 'static', flows: 4, policy: 'layer2' });
  assert.deepEqual(s.hash, { F1: 42, F2: 76, F3: 97, F4: 158 });
  assert.deepEqual(s.assignment, { F1: 0, F2: 0, F3: 1, F4: 0 });
  assert.deepEqual(s.index, { F1: 0, F2: 0, F3: 1, F4: 0 });
  near(s.delivered, 2000);
  // the index is into the up list: with eth0 failed on 3, index 0 is eth1
  const t = D({ mode: 'balance-xor', switchCfg: 'static', flows: 4, members: 3, fail: 'eth0', policy: 'layer2' });
  assert.deepEqual(t.up, [1, 2]);
  assert.deepEqual(t.assignment, { F1: 1, F2: 1, F3: 2, F4: 1 });
});

test('rule 4: 802.3ad hashes like balance-xor with LACP; without it one member, 1 Gbit/s, noPartner', () => {
  for (const policy of logic.POLICIES) {
    for (let members = 2; members <= 4; members++) {
      const a = D({ mode: '802.3ad', switchCfg: 'lacp', policy, members, flows: 8 });
      const b = D({ mode: 'balance-xor', switchCfg: 'static', policy, members, flows: 8 });
      assert.deepEqual(a.assignment, b.assignment);
      assert.deepEqual(a.warnings, []);
      assert.ok(a.switchOk);
    }
  }
  for (const switchCfg of ['none', 'static']) {
    const s = D({ mode: '802.3ad', switchCfg, members: 4, flows: 8, policy: 'layer3+4' });
    assert.equal(s.how, 'single');
    assert.deepEqual(s.used, [0]);
    near(s.delivered, 1000);
    assert.deepEqual(s.warnings, ['noPartner']);
    assert.equal(s.unreliable, false);
    assert.equal(s.switchOk, false);
  }
});

test('rule 5: a failed member is removed and flows re-hash; healthy flows can move; nobody is cut', () => {
  for (const p of everyParams()) {
    const s = D(p);
    for (const f of s.flows) {
      const m = s.assignment[f.id];
      assert.notEqual(m, null, 'a member is always up');
      if (m !== 'all') assert.ok(s.up.includes(m), `${JSON.stringify(p)} ${f.id} on a down member`);
      assert.ok(s.rate[f.id] > 0);
    }
  }
  const s = byPreset('xor-fail-rehash');
  assert.deepEqual(s.failover.before, { F1: 0, F2: 0, F3: 0, F4: 1, F5: 1, F6: 2 });
  assert.deepEqual(s.failover.moved, ['F1', 'F4', 'F5']);
  assert.deepEqual(s.failover.fromFailed, ['F4', 'F5']);
  assert.deepEqual(s.failover.fromHealthy, ['F1']);
  // balance-rr: nothing moves, it loses one member's share
  const rr = D({ mode: 'balance-rr', switchCfg: 'static', fail: 'eth1', flows: 2, members: 3 });
  assert.deepEqual(rr.failover.moved, []);
  near(rr.delivered, 1600);
});

test('rule 6 / summary: capacity is up members × 1 Gbit/s; delivered and fastest add up', () => {
  for (const p of everyParams()) {
    const s = D(p);
    assert.equal(s.capacity, s.up.length * 1000);
    const sum = Object.values(s.rate).reduce((a, b) => a + b, 0);
    near(s.delivered, sum);
    near(s.fastest, Math.max(...Object.values(s.rate)));
    assert.ok(s.delivered <= s.capacity + 1e-9);
    const load = Object.values(s.memberLoad).reduce((a, b) => a + b, 0);
    near(load, s.delivered, 'member loads add up to delivered');
  }
});

test('changed: flows matched by headers; all ↔ member is a move; the star marks only a moved active member', () => {
  const ab = D({}), rr = D({ mode: 'balance-rr', switchCfg: 'static' });
  assert.deepEqual(logic.changed(ab, rr), ['F1', 'F2', 'F3', 'F4']);
  assert.deepEqual(logic.changed(rr, D({ mode: 'balance-rr', switchCfg: 'none' })), []);
  assert.deepEqual(logic.changed(null, rr), []);
  assert.deepEqual(logic.changed(D({ flows: 1 }), D({ flows: 8 })), [], 'new flows are not moved');
  // the gateway changes the headers: they are other flows
  assert.deepEqual(logic.changed(D({ mode: 'balance-xor', switchCfg: 'static' }), D({ mode: 'balance-xor', switchCfg: 'static', gateway: true })), []);
  // same assignment: nothing
  assert.deepEqual(logic.changed(D({ mode: 'balance-xor', switchCfg: 'static' }), D({ mode: '802.3ad', switchCfg: 'lacp' })), []);
  // preset 5: against the unfailed state
  const before = D({ ...presetParams('xor-fail-rehash'), fail: 'none' });
  assert.deepEqual(logic.changed(before, byPreset('xor-fail-rehash')), ['F1', 'F4', 'F5']);
  // star
  assert.equal(logic.activeChanged(D({}), D({ fail: 'eth0' })), true);
  assert.equal(logic.activeChanged(D({}), D({ fail: 'eth1' })), false);
  assert.equal(logic.activeChanged(null, D({ fail: 'eth0' })), false);
  assert.equal(logic.activeChanged(D({}), D({ mode: 'balance-rr' })), false, 'no active member in balance-rr');
  assert.equal(logic.activeChanged(D({ mode: 'balance-rr' }), D({})), false, 'none before: the star did not move');
});

test('mode numbers and the gateway\'s addresses', () => {
  assert.deepEqual(logic.MODE_NO, { 'active-backup': 1, 'balance-rr': 0, 'balance-xor': 2, '802.3ad': 4 });
  const f = D({ gateway: true }).flows[0];
  assert.equal(f.dstIp, '10.20.30.21');
  assert.equal(f.dstMac, logic.GATEWAY.mac);
});

// ── presets ──

test('preset params are the ones in SPEC.md', () => {
  const want = {
    'active-backup-fail': { mode: 'active-backup', members: 2, flows: 4, fail: 'eth0', switchCfg: 'none', policy: 'layer2', gateway: false },
    'rr-one-flow': { mode: 'balance-rr', members: 2, flows: 1, fail: 'none', switchCfg: 'static', policy: 'layer2', gateway: false },
    'lacp-layer2-gateway': { mode: '802.3ad', members: 2, flows: 4, fail: 'none', switchCfg: 'lacp', policy: 'layer2', gateway: true },
    'lacp-no-partner': { mode: '802.3ad', members: 2, flows: 4, fail: 'none', switchCfg: 'none', policy: 'layer2', gateway: false },
    'xor-fail-rehash': { mode: 'balance-xor', members: 3, flows: 6, fail: 'eth1', switchCfg: 'static', policy: 'layer3+4', gateway: false }
  };
  assert.deepEqual(Object.fromEntries(logic.presets.map((x) => [x.id, x.params])), want);
});

test('preset active-backup-fail: eth1 active, 4 × 0.25 = 1 Gbit/s, no warning; eth0 back → eth0', () => {
  const s = byPreset('active-backup-fail');
  assert.equal(s.active, 1);
  assert.deepEqual(s.perMember, { 0: [], 1: ['F1', 'F2', 'F3', 'F4'] });
  for (const f of s.flows) near(s.rate[f.id], 250);
  near(s.delivered, 1000);
  assert.deepEqual(s.warnings, []);
  const back = D({ ...presetParams('active-backup-fail'), fail: 'none' });
  assert.equal(back.active, 0);
  near(back.delivered, 1000);
});

test('preset rr-one-flow: 1.6 Gbit/s for one flow with reordering; switch none adds MAC flapping', () => {
  const s = byPreset('rr-one-flow');
  near(s.fastest, 1600);
  assert.deepEqual(s.warnings, ['reorder']);
  const t = D({ ...presetParams('rr-one-flow'), switchCfg: 'none' });
  assert.deepEqual(t.warnings, ['reorder', 'macFlap']);
  assert.ok(t.unreliable);
});

test('preset lacp-layer2-gateway: all 4 on eth1 (hash 17); layer3+4 → F1 on eth1, F2–F4 on eth0, 2 Gbit/s', () => {
  const s = byPreset('lacp-layer2-gateway');
  assert.deepEqual(s.perMember, { 0: [], 1: ['F1', 'F2', 'F3', 'F4'] });
  near(s.delivered, 1000);
  const t = D({ ...presetParams('lacp-layer2-gateway'), policy: 'layer3+4' });
  assert.deepEqual(t.hash, { F1: 54819, F2: 54276, F3: 53712, F4: 57292 });
  assert.deepEqual(t.perMember, { 0: ['F2', 'F3', 'F4'], 1: ['F1'] });
  near(t.rate.F1, 1000);
  near(t.rate.F2, 1000 / 3);
  near(t.delivered, 2000);
});

test('preset lacp-no-partner: eth0 only, 1 Gbit/s, warning noPartner', () => {
  const s = byPreset('lacp-no-partner');
  assert.deepEqual(s.used, [0]);
  near(s.delivered, 1000);
  assert.deepEqual(s.warnings, ['noPartner']);
});

test('preset xor-fail-rehash: F2 F3 F4 on eth0, F1 F5 F6 on eth2, 2 Gbit/s', () => {
  const s = byPreset('xor-fail-rehash');
  assert.deepEqual(s.up, [0, 2]);
  assert.deepEqual(s.perMember, { 0: ['F2', 'F3', 'F4'], 1: [], 2: ['F1', 'F5', 'F6'] });
  near(s.delivered, 2000);
  assert.deepEqual(s.warnings, []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of everyParams()) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ mode: 'balance-xor', members: 3, flows: 8, fail: 'eth1', policy: 'layer3+4' });
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
    assert.deepEqual(Object.keys(p.params).sort(), Object.keys(logic.defaults).sort(), p.id);
    for (const k of Object.keys(logic.RANGES)) {
      const [min, max, step] = logic.RANGES[k], v = p.params[k];
      assert.ok(v >= min && v <= max && (v - min) % step === 0, `${p.id} ${k}`);
    }
    assert.ok(logic.MODES.includes(p.params.mode));
    assert.ok(logic.POLICIES.includes(p.params.policy));
    assert.ok(logic.FAILS.includes(p.params.fail));
    assert.ok(logic.SWITCH.includes(p.params.switchCfg));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
