// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-fsmo-roles' model: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers,
// then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, kit.stepsOf(logic, P(over)));
const s0 = (over) => logic.initial(P(over));
const row = (s, p, op) => logic.panel(s, P(p)).find((r) => r.op === op);

const PRESETS = {
  quillmoor: { scenario: 'quillmoor', ridLeft: 250, usersToCreate: 300 },
  'rid-only': { scenario: 'rid-only', ridLeft: 250, usersToCreate: 150 },
  transfer: { scenario: 'transfer', ridLeft: 250, usersToCreate: 300 },
  'seize-and-return': { scenario: 'seize-and-return', ridLeft: 250, usersToCreate: 300 },
  'infra-single-domain': { scenario: 'infra-single-domain', ridLeft: 250, usersToCreate: 300 }
};

// ── tie-breaks ──

test('rule 12 tie-break: the panel is evaluated against this step\'s state, in panel order, each row on its own copy', () => {
  // step 1 of quillmoor turns qm-dc01 off: the same step's panel already sees it off
  const s = at({}, 1);
  const before = structuredClone(s);
  const rows = logic.panel(s, P({}));
  assert.deepEqual(rows.map((r) => r.op), logic.OPS);
  assert.deepEqual(rows.map((r) => r.status), ['ok', 'degraded', 'degraded', 'degraded', 'fail', 'fail', 'ok']);
  // evaluating the panel spends no RIDs and requests no pool
  assert.deepEqual(s, before);
  const live = s0({ ridLeft: 0 });
  const liveBefore = structuredClone(live);
  logic.panel(live, P({}));
  assert.deepEqual(live, liveBefore, 'not even when the create row would be granted a pool');
  // a row's create does not leak into the next row: two panels give the same create row
  assert.deepEqual(row(s, {}, 'create'), row(s, {}, 'create'));
  assert.equal(row(at({}, 0), {}, 'schema').status, 'ok', 'at step 0 the holder is on');
});

test('rule 9 tie-break: owner facts by version, then the later step, then the larger DC id', () => {
  assert.equal(logic.newer({ dc: 'DC01', ver: 2, at: 1 }, { dc: 'DC02', ver: 1, at: 5 }), true);
  assert.equal(logic.newer({ dc: 'DC02', ver: 1, at: 5 }, { dc: 'DC01', ver: 2, at: 1 }), false);
  assert.equal(logic.newer({ dc: 'DC01', ver: 2, at: 4 }, { dc: 'DC02', ver: 2, at: 3 }), true);
  assert.equal(logic.newer({ dc: 'DC02', ver: 2, at: 3 }, { dc: 'DC01', ver: 2, at: 4 }), false);
  assert.equal(logic.newer({ dc: 'DC03', ver: 2, at: 3 }, { dc: 'DC02', ver: 2, at: 3 }), true);
  assert.equal(logic.newer({ dc: 'DC02', ver: 2, at: 3 }, { dc: 'DC03', ver: 2, at: 3 }), false);
});

test('rule 3 tie-break: a pool left at exactly 250 asks at the next allocation; 251 does not', () => {
  const s = s0({});
  s.dcs.DC02.ridPool.left = 251;
  const a = logic.createUsers(s, 'DC02', 1);
  assert.equal(a.request, 'granted', '251 → 250 is at the threshold');
  const s2 = s0({});
  s2.dcs.DC02.ridPool.left = 252;
  assert.equal(logic.createUsers(s2, 'DC02', 1).request, null, '252 → 251 is above it');
  // an empty pool with a next pool moves on to it, and the same allocation counts
  const s3 = s0({ ridLeft: 0 });
  s3.dcs.DC02.ridPool.next = { from: 9001, to: 9500 };
  const c = logic.createUsers(s3, 'DC02', 1);
  assert.equal(c.created, 1);
  assert.equal(c.first, 9001);
  assert.equal(s3.dcs.DC02.ridPool.left, 499);
});

// ── rules ──

test('rule 1: schema master off → extend the schema fails, every other row as before', () => {
  const s = s0({ scenario: 'quillmoor' });
  // move only the schema master's power: put schema alone on brk-dc03 and turn it off
  for (const d of logic.DCS) s.dcs[d].copy.owner.schema = 'DC03';
  s.dcs.DC03.on = false;
  const rows = logic.panel(s, P({}));
  assert.deepEqual(rows.map((r) => [r.op, r.status]), [['logon', 'ok'], ['create', 'ok'], ['password', 'ok'], ['time', 'ok'],
    ['schema', 'fail'], ['domain', 'ok'], ['xref', 'ok']]);
});

test('rule 2: domain naming master off → add a domain fails; schema still works', () => {
  const s = s0({});
  for (const d of logic.DCS) s.dcs[d].copy.owner.naming = 'DC03';
  s.dcs.DC03.on = false;
  assert.equal(row(s, {}, 'domain').status, 'fail');
  assert.equal(row(s, {}, 'schema').status, 'ok');
});

test('rule 3: pools of 500, a request at half used, creation from the rest when the master is gone', () => {
  // master on: 300 from 250 left → the first user triggers a request, the next pool covers the rest
  const s = s0({});
  const ok = logic.createUsers(s, 'DC02', 300);
  assert.deepEqual([ok.created, ok.failed, ok.request], [300, 0, 'granted']);
  assert.deepEqual(ok.granted, { from: 4601, to: 5100, by: 'DC01' });
  assert.deepEqual([s.dcs.DC02.ridPool.from, s.dcs.DC02.ridPool.left], [4601, 450]);
  assert.equal(s.dcs.DC01.copy.avail, 5101, 'the master raised its next free RID by 500');
  assert.equal(logic.POOL, 500);
  // master off: 250 created, 50 fail
  const q = at({}, 4).last;
  assert.deepEqual([q.created, q.failed, q.request, q.status], [250, 50, 'failed', 'degraded']);
  // nothing left and no master: ✕
  const z = s0({ ridLeft: 0 });
  z.dcs.DC01.on = false;
  assert.equal(logic.runOp(z, 'create', 'DC02', 10).status, 'fail');
  assert.equal(logic.runOp(s0({}), 'create', 'DC02', 0).status, 'ok', 'zero users: nothing to fail');
  // an empty pool asks before it fails, when the master is there
  const e = s0({ ridLeft: 0 });
  const r = logic.runOp(e, 'create', 'DC02', 10);
  assert.deepEqual([r.status, r.created, r.request, r.first], ['ok', 10, 'granted', 4601]);
  // a request that failed is not repeated in the same run
  const f = s0({ ridLeft: 100 });
  f.dcs.DC01.on = false;
  const fr = logic.createUsers(f, 'DC02', 300);
  assert.deepEqual([fr.created, fr.failed, fr.requestAt, fr.requestWhy], [100, 200, 1, 'off']);
});

test('rule 4: PDC gone → password and time degraded; a PDC without an external source runs on its own clock', () => {
  const off = at({}, 1);
  assert.equal(row(off, {}, 'password').why, 'noPdc');
  assert.equal(row(off, {}, 'time').why, 'drift');
  assert.equal(row(s0({}), {}, 'time').why, 'external', 'qm-dc01 has the external source');
  const moved = at({ scenario: 'transfer' }, 1);
  assert.deepEqual([row(moved, {}, 'time').status, row(moved, {}, 'time').why], ['degraded', 'ownClock']);
  assert.equal(row(moved, {}, 'password').status, 'ok');
});

test('rule 5: infrastructure master off in a one-domain forest → update references still ✓', () => {
  const s = at({ scenario: 'infra-single-domain' }, 1);
  assert.equal(s.dcs.DC03.on, false);
  const r = row(s, {}, 'xref');
  assert.deepEqual([r.status, r.why, r.holder, r.holderWhy], ['ok', 'oneDomain', 'DC03', 'off']);
  assert.ok(logic.panel(s, P({})).every((x) => x.status === 'ok'), 'nothing breaks');
});

test('rule 6: log on needs no role, only an online DC', () => {
  const s = at({}, 1);
  assert.equal(row(s, {}, 'logon').status, 'ok');
  assert.equal(row(s, {}, 'logon').role, null);
  const d = s0({});
  d.dcs.DC02.on = false;
  assert.equal(logic.runOp(d, 'logon', 'DC02', 0).why, 'atOff');
  assert.equal(logic.runOp(d, 'logon', 'DC02', 0).status, 'fail');
});

test('rule 7: a transfer needs the holder; refused when it is off, and nothing changes', () => {
  const s = at({ scenario: 'transfer' }, 1);
  assert.deepEqual(logic.rolesOf(s, 'DC02'), ['pdc']);
  assert.deepEqual(logic.rolesOf(s, 'DC01'), ['schema', 'naming', 'rid', 'infra']);
  assert.equal(s.dcs.DC03.copy.owner.pdc, 'DC02', 'replicated to brk-dc03');
  assert.equal(s.dcs.DC03.copy.ver.pdc, 2);
  assert.deepEqual(s.seized, {});
  const o = s0({});
  o.dcs.DC01.on = false;
  const before = structuredClone(o);
  const e = logic.doTransfer(o, { kind: 'transfer', role: 'rid', to: 'DC02' });
  assert.equal(e.refused, 'off');
  assert.deepEqual(o, before);
});

test('rule 8: a seize takes over without the holder; the RID seize skips 10,000; with the holder online it is a transfer', () => {
  const s = at({ scenario: 'seize-and-return' }, 3);
  assert.deepEqual(s.seized, { rid: 'DC01' });
  assert.deepEqual(logic.rolesOf(s, 'DC02'), ['rid']);
  assert.equal(s.dcs.DC02.copy.avail, 14601);
  assert.equal(s.dcs.DC03.copy.avail, 4601, 'brk-dc03 is on the other side of the split');
  assert.equal(s.dcs.DC03.copy.owner.rid, 'DC01');
  // holder online: done as a transfer, no skip, nothing marked seized
  const o = s0({});
  const e = logic.doTransfer(o, { kind: 'seize', role: 'rid', to: 'DC02' });
  assert.equal(e.asTransfer, true);
  assert.deepEqual(o.seized, {});
  assert.equal(o.dcs.DC02.copy.avail, 4601);
  assert.equal(o.dcs.DC01.copy.owner.rid, 'DC02');
  // a seize of a role other than RID skips nothing
  const p = s0({});
  p.dcs.DC01.on = false;
  logic.doTransfer(p, { kind: 'seize', role: 'pdc', to: 'DC02' });
  assert.equal(p.dcs.DC02.copy.avail, 4601);
  assert.deepEqual(p.seized, { pdc: 'DC01' });
});

test('rule 9: online DCs that reach each other merge; off and cut-off DCs keep their copies', () => {
  const s = s0({});
  s.dcs.DC01.on = false;
  s.cut = 'DC03';
  assert.deepEqual(logic.islands(s), [['DC02'], ['DC03']]);
  s.cut = null;
  assert.deepEqual(logic.islands(s), [['DC02', 'DC03']]);
  s.dcs.DC02.copy.avail = 9000;
  s.dcs.DC01.copy.avail = 99999;
  logic.converge(s);
  assert.equal(s.dcs.DC03.copy.avail, 9000);
  assert.equal(s.dcs.DC01.copy.avail, 99999, 'off: untouched');
});

test('rule 10: a DC that powers on does not act until it merged with a partner; a restore drops its pool', () => {
  const s = s0({});
  s.dcs.DC01.on = false;
  s.cut = 'DC01';
  s.dcs.DC01.on = true;
  s.dcs.DC01.synced = false;
  logic.converge(s);
  assert.equal(s.dcs.DC01.synced, false, 'alone: nobody to replicate from');
  assert.deepEqual(logic.holderFor(s, 'DC01', 'schema'), { dc: 'DC01', ok: false, why: 'waiting' });
  // a returning holder that hears of the seizure gives the role up
  const r = at({ scenario: 'seize-and-return' }, 6);
  assert.deepEqual(logic.rolesOf(r, 'DC01'), ['schema', 'naming', 'pdc', 'infra']);
  assert.deepEqual(logic.rolesOf(r, 'DC02'), ['rid']);
  const back = at({ scenario: 'seize-and-return' }, 4);
  assert.equal(back.dcs.DC01.restored, true);
  assert.equal(back.dcs.DC01.ridPool.left, 0);
  assert.equal(back.dcs.DC01.synced, true, 'merged with brk-dc03');
});

test('rule 11: two acting holders across a split; a conflict for S, N, R only; overlapping pools are duplicates', () => {
  const s = at({ scenario: 'seize-and-return' }, 4);
  assert.deepEqual(logic.conflicts(s), [{ role: 'rid', dcs: ['DC01', 'DC02'], conflict: true }]);
  assert.deepEqual(logic.acting(s, 'rid'), ['DC01', 'DC02']);
  assert.deepEqual(logic.conflicts(at({ scenario: 'seize-and-return' }, 6)), []);
  assert.deepEqual(Object.keys(logic.CONFLICT), ['schema', 'naming', 'rid']);
  const d = s0({});
  assert.deepEqual(logic.duplicatePools(d), []);
  d.pools.push({ dc: 'DC03', from: 3601, to: 4100, by: 'DC01' });
  assert.deepEqual(logic.duplicatePools(d), [[1, 3]]);
  d.pools.push({ dc: 'DC02', from: 3601, to: 4100, by: 'DC01' });
  assert.equal(logic.duplicatePools(d).length, 2, 'the same DC twice is not a duplicate between DCs');
});

test('rules 1–5 and 7: a holder that is on but cut off does not serve the desk; a transfer then is refused', () => {
  const s = s0({});
  s.cut = 'DC01';
  assert.deepEqual(logic.holderFor(s, 'DC02', 'schema'), { dc: 'DC01', ok: false, why: 'cut' });
  assert.deepEqual(logic.holderFor(s, 'DC01', 'schema'), { dc: 'DC01', ok: true, why: null }, 'on its own side it works');
  assert.equal(row(s, {}, 'schema').status, 'fail');
  assert.equal(logic.doTransfer(structuredClone(s), { kind: 'transfer', role: 'pdc', to: 'DC02' }).refused, 'cut');
  const w = s0({});
  w.dcs.DC01.synced = false;
  assert.equal(logic.doTransfer(w, { kind: 'transfer', role: 'pdc', to: 'DC02' }).refused, 'waiting');
});

test('rule 10: the on action itself leaves the DC unsynced until a partner is there', () => {
  const s = s0({});
  s.dcs.DC01.on = false;
  s.cut = 'DC01';
  logic.act(s, { kind: 'on', dc: 'DC01' }, 0);
  assert.equal(s.dcs.DC01.synced, false);
  assert.deepEqual(logic.acting(s, 'rid'), [], 'an unsynced DC that names itself does not act');
  assert.equal(s.dcs.DC01.restored, false);
  logic.act(s, { kind: 'join' }, 0);
  assert.equal(s.dcs.DC01.synced, true);
  assert.deepEqual(logic.acting(s, 'rid'), ['DC01']);
});

test('rule 11 boundary: pools that share one RID are duplicates; adjacent pools are not', () => {
  const d = s0({});
  d.pools = [{ dc: 'DC01', from: 1, to: 500, by: 'DC01' }, { dc: 'DC02', from: 501, to: 1000, by: 'DC01' }];
  assert.deepEqual(logic.duplicatePools(d), []);
  d.pools.push({ dc: 'DC03', from: 1000, to: 1499, by: 'DC01' });
  assert.deepEqual(logic.duplicatePools(d), [[1, 2]]);
});

// ── presets ──

test('quillmoor: 6 steps; log on ✓, password △, 250 created and 50 fail, schema ✕, time △', () => {
  const p = PRESETS.quillmoor;
  assert.equal(kit.stepsOf(logic, P(p)), 6);
  assert.deepEqual(logic.rolesOf(s0(p), 'DC01'), logic.ROLES);
  const st = [1, 2, 3, 4, 5, 6].map((n) => at(p, n).last);
  assert.deepEqual(st.map((e) => e.kind === 'op' ? e.op + ':' + e.status : e.kind),
    ['off', 'logon:ok', 'password:degraded', 'create:degraded', 'schema:fail', 'time:degraded']);
  assert.deepEqual([st[3].created, st[3].failed], [250, 50]);
});

test('rid-only: 4 steps; 150 created with 100 left, password ✓, then 100 created and 50 fail', () => {
  const p = PRESETS['rid-only'];
  assert.equal(kit.stepsOf(logic, P(p)), 4);
  const a = at(p, 2);
  assert.deepEqual([a.last.created, a.last.failed, a.last.request, a.dcs.DC02.ridPool.left], [150, 0, 'failed', 100]);
  assert.equal(at(p, 3).last.status, 'ok');
  const b = at(p, 4).last;
  assert.deepEqual([b.created, b.failed], [100, 50]);
});

test('transfer: 3 steps; clean, then time on its own clock, then qm-dc01 off: password ✓, schema ✕', () => {
  const p = PRESETS.transfer;
  assert.equal(kit.stepsOf(logic, P(p)), 3);
  assert.equal(at(p, 1).last.refused, null);
  assert.equal(at(p, 2).last.why, 'ownClock');
  const s = at(p, 3);
  assert.equal(row(s, p, 'password').status, 'ok');
  assert.equal(row(s, p, 'schema').status, 'fail');
});

test('seize-and-return: 6 steps; two RID masters, qm-dc01 grants 4601–5100, pools 10,000 apart, R back to one', () => {
  const p = PRESETS['seize-and-return'];
  assert.equal(kit.stepsOf(logic, P(p)), 6);
  const g = at(p, 5).last;
  assert.deepEqual(g.granted, { from: 4601, to: 5100, by: 'DC01' });
  assert.equal(g.at, 'DC03');
  const e = end(p);
  assert.deepEqual(logic.DCS.map((d) => e.dcs[d].copy.avail), [14601, 14601, 14601]);
  assert.deepEqual(logic.duplicatePools(e), []);
  assert.equal(e.cut, null);
});

test('infra-single-domain: 2 steps; nothing breaks', () => {
  const p = PRESETS['infra-single-domain'];
  assert.equal(kit.stepsOf(logic, P(p)), 2);
  assert.equal(end(p).last.status, 'ok');
});

test('the page has these presets with these params', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
  for (const [id, params] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[^\\n]*params: (\\{[^}]*\\})`));
    assert.ok(m, id);
    assert.deepEqual(Function(`return ${m[1]}`)(), params, id);
  }
});

test('every combination of params stays valid: at most 6 steps, pools within 0–500, no duplicate pools', () => {
  for (const scenario of logic.SCENARIOS) {
    for (let r = 0; r <= 500; r += 10) {
      for (let u = 0; u <= 600; u += 50) {
        const p = { scenario, ridLeft: r, usersToCreate: u };
        const n = kit.stepsOf(logic, P(p));
        assert.ok(n >= 1 && n <= 6);
        for (let k = 0; k <= n; k++) {
          const s = at(p, k);
          for (const d of logic.DCS) assert.ok(s.dcs[d].ridPool.left >= 0 && s.dcs[d].ridPool.left <= 500, JSON.stringify(p));
          assert.deepEqual(logic.duplicatePools(s), [], JSON.stringify(p));
          if (s.last && s.last.kind === 'op' && s.last.op === 'create') assert.equal(s.last.created + s.last.failed, u);
        }
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    for (let n = 0; n <= kit.stepsOf(logic, P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const N = kit.stepsOf(logic, p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    let s = logic.initial(p);
    for (let n = 1; n <= kit.stepsOf(logic, p); n++) {
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
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, P({})), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
