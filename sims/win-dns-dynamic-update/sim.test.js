// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-dynamic-update's model (rules: SPEC.md). Run: node --test sims/win-dns-dynamic-update/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** The run as short codes: soa, U (unsigned), S (signed), tkey, ok / no (answers), admin. */
const path = (s) => s.msgs.map((e) => e.kind === 'update' ? (e.signed ? 'S' : 'U') : e.kind === 'answer' ? (e.rcode === 'NOERROR' ? 'ok' : 'no') : e.kind);
const rec = (s, name) => logic.find(s.zone.records, name);
const { SID } = logic;
const zone = (updates, records) => ({ name: 'corp.example', updates, records });
const A = (name, data, owner) => ({ name, type: 'A', data, owner, timestamp: 0, static: false });

// ── tie-breaks first ──

test('T1: an update is all or nothing; one name the sender may not write refuses the whole update', () => {
  const z = zone('secureOnly', [A('pc2', '10.0.0.52', SID.PC2), A('pc9', '10.0.0.99', SID.PC1)]);
  const r = logic.applyUpdate(z, { adds: [{ name: 'pc2-new', data: '10.0.0.52' }], deletes: ['pc9'] }, { sid: SID.PC2, signed: true }, 5);
  assert.equal(r.rcode, 'REFUSED');
  assert.equal(r.reason, 'owner');
  assert.deepEqual(r.records, z.records, 'nothing changed: pc2-new not created');
  assert.deepEqual(r.added, []);
  assert.deepEqual(r.items.map((i) => i.may), [true, false]);
});

test('T2: ownership is the SID, not the name', () => {
  const recs = [A('pc1', '10.0.0.51', SID.PC1)];
  assert.equal(logic.mayWrite(recs, 'pc1', SID.PC1_NEW), false, 'a new PC1$ with another SID');
  assert.equal(logic.mayWrite(recs, 'pc1', SID.PC1), true, 'the same SID');
  // the renamed account keeps its SID and still owns its old record
  const s = end({ action: 'rename' });
  assert.equal(s.clients[0].name, 'PC2-NEW');
  assert.equal(s.clients[0].sid, SID.PC2);
  assert.deepEqual(s.msgs.at(-1).removed, ['pc2']);
  // rebuild with a new account: refused; with the reset account (same SID): accepted
  assert.equal(end({ action: 'rebuildNew' }).result, 'owner');
  assert.equal(end({ action: 'rebuildReset' }).result, 'ok');
});

test('T3: names compare case-insensitively', () => {
  const recs = [A('pc1', '10.0.0.51', SID.PC1)];
  assert.equal(logic.find(recs, 'PC1').data, '10.0.0.51');
  assert.equal(logic.mayWrite(recs, 'PC1', SID.PC1_NEW), false);
  const r = logic.applyUpdate(zone('secureOnly', recs), { adds: [{ name: 'PC1', data: '10.0.1.23' }], deletes: [] }, { sid: SID.PC1, signed: true }, 9);
  assert.equal(r.records.length, 1, 'PC1 updates pc1, no second record');
  assert.equal(r.records[0].data, '10.0.1.23');
  assert.deepEqual(r.updated, ['pc1']);
  // a new name is stored lower-case
  const c = logic.applyUpdate(zone('secureOnly', []), { adds: [{ name: 'PC2-NEW', data: '10.0.0.52' }], deletes: [] }, { sid: SID.PC2, signed: true }, 1);
  assert.equal(c.records[0].name, 'pc2-new');
  assert.deepEqual(c.added, ['pc2-new']);
  // the client PC2-NEW registers the lower-case name
  assert.ok(rec(end({ action: 'rename' }), 'pc2-new'));
  assert.equal(end({ action: 'rename' }).zone.records.find((x) => x.name === 'pc2-new').name, 'pc2-new');
});

test('T4: "None" refuses the owner too; "Nonsecure and secure" accepts a non-owner at the first unsigned try', () => {
  const recs = [A('pc1', '10.0.0.51', SID.PC1)];
  const u = { adds: [{ name: 'pc1', data: '10.0.0.77' }], deletes: [] };
  assert.equal(logic.applyUpdate(zone('none', recs), u, { sid: SID.PC1, signed: true }, 1).rcode, 'REFUSED');
  assert.equal(logic.applyUpdate(zone('none', recs), u, { sid: SID.PC1, signed: true }, 1).reason, 'zoneNone');
  const r = logic.applyUpdate(zone('nonsecureAndSecure', recs), u, { sid: null, signed: false }, 1);
  assert.equal(r.rcode, 'NOERROR');
  assert.equal(r.records[0].data, '10.0.0.77');
  assert.deepEqual(path(end({ updates: 'nonsecureAndSecure', action: 'rebuildNew' })), ['soa', 'U', 'ok']);
  assert.deepEqual(path(end({ updates: 'none', action: 'move' })), ['soa', 'U', 'no', 'tkey', 'S', 'no']);
  assert.equal(rec(end({ updates: 'none', action: 'move' }), 'pc1').data, '10.0.0.51');
});

test('T5: the admin fix applies only after a refusal by ownership', () => {
  assert.equal(logic.steps(P({ action: 'rebuildNew', adminDelete: true })), 13);
  assert.equal(logic.fixPossible(P({ action: 'rebuildNew' })), true);
  assert.equal(logic.fixPossible(P({ action: 'rebuildNew', adminDelete: true })), true, 'the toggle stays enabled once on');
  for (const over of [{ updates: 'none', action: 'rebuildNew' }, { action: 'rogue' }, { action: 'join' }, { updates: 'nonsecureAndSecure', action: 'rebuildNew' }]) {
    assert.equal(logic.fixPossible(P(over)), false, JSON.stringify(over));
    assert.equal(logic.steps(P(Object.assign({ adminDelete: true }, over))), logic.steps(P(over)), JSON.stringify(over));
    assert.ok(!path(end(Object.assign({ adminDelete: true }, over))).includes('admin'));
  }
});

// ── rules ──

test('rule 2: the client asks for the SOA of the name it registers; DC1 answers as the primary', () => {
  const s = at({}, 1);
  assert.deepEqual([s.msgs[0].kind, s.msgs[0].q, s.msgs[0].primary], ['soa', 'pc1.corp.example', 'dc1.corp.example']);
  assert.equal(at({ action: 'rename' }, 1).msgs[0].q, 'pc2-new.corp.example');
  assert.equal(at({ action: 'rogue' }, 1).msgs[0].q, 'fs1.corp.example');
});

test('rule 3: unsigned first; refused under "Secure only", then TKEY and the same update signed', () => {
  const s = end({});
  assert.deepEqual(path(s), ['soa', 'U', 'no', 'tkey', 'S', 'ok']);
  assert.equal(s.msgs[2].reason, 'unsigned');
  assert.deepEqual(s.msgs[1].update, s.msgs[4].update, 'the same update twice');
  assert.equal(s.msgs[3].account, 'PC1$');
  assert.equal(s.msgs[3].sid, SID.PC1);
  assert.equal(logic.zoneAccepts('secureOnly', false), false);
  assert.equal(logic.zoneAccepts('secureOnly', true), true);
});

test('rule 5: a new name is created by any signed sender, who becomes its owner', () => {
  const s = end({});
  assert.deepEqual(rec(s, 'pc1'), { name: 'pc1', type: 'A', data: '10.0.0.51', owner: SID.PC1, timestamp: logic.START + 6, static: false });
  assert.deepEqual(s.msgs.at(-1).added, ['pc1']);
  assert.equal(logic.mayWrite([], 'anything', SID.PC1_NEW), true);
});

test('rule 6: an existing name: the owner may write it, another SID is refused and the old data stays', () => {
  const s = end({ action: 'rebuildNew' });
  assert.deepEqual(path(s), ['soa', 'U', 'no', 'tkey', 'S', 'no']);
  assert.equal(s.msgs.at(-1).reason, 'owner');
  assert.deepEqual(s.msgs.at(-1).items, [{ name: 'pc1', exists: true, owner: SID.PC1, may: false }]);
  assert.equal(rec(s, 'pc1').data, '10.0.0.51');
  assert.equal(rec(s, 'pc1').owner, SID.PC1);
  // a record with no owner (created unsigned) is open
  assert.equal(logic.mayWrite([A('x', '1', null)], 'x', SID.PC1_NEW), true);
});

test('rule 7: "Nonsecure and secure" takes an unsigned update for any name; new records have no owner, old keep theirs', () => {
  const j = end({ updates: 'nonsecureAndSecure' });
  assert.deepEqual(path(j), ['soa', 'U', 'ok']);
  assert.equal(rec(j, 'pc1').owner, null);
  assert.deepEqual(j.msgs.at(-1).added, ['pc1']);
  // a member's unsigned update keeps the old owner (the dead SID), so Secure only would refuse it again
  const b = end({ updates: 'nonsecureAndSecure', action: 'rebuildNew' });
  assert.equal(rec(b, 'pc1').data, '10.0.0.77');
  assert.equal(rec(b, 'pc1').owner, SID.PC1);
  // unsigned to an unowned record: data and timestamp change, still no owner
  const u = logic.applyUpdate(zone('nonsecureAndSecure', [A('x', '1', null)]), { adds: [{ name: 'x', data: '2' }], deletes: [] }, { sid: SID.PC1, signed: false }, 7);
  assert.deepEqual([u.records[0].data, u.records[0].owner, u.records[0].timestamp], ['2', null, 7]);
  const h = end({ updates: 'nonsecureAndSecure', action: 'rogue' });
  assert.deepEqual(path(h), ['soa', 'U', 'ok']);
  assert.equal(rec(h, 'fs1').data, '10.0.0.66');
  assert.equal(rec(h, 'fs1').owner, SID.FS1);
  assert.deepEqual(h.msgs.at(-1).updated, ['fs1']);
  assert.equal(rec(h, 'fs1').timestamp, logic.START + 3);
  assert.equal(h.msgs.at(-1).items[0].may, false, 'by the ACL the laptop may not write fs1, and it is not consulted');
  // a signed update to an unowned record takes ownership
  const r = logic.applyUpdate(zone('secureOnly', [A('x', '1', null)]), { adds: [{ name: 'x', data: '2' }], deletes: [] }, { sid: SID.PC1, signed: true }, 3);
  assert.equal(r.records[0].owner, SID.PC1);
});

test('rule 8: "None" refuses every update; a member still tries signed and is refused again', () => {
  for (const a of ['join', 'move', 'rename', 'rebuildNew', 'rebuildReset']) {
    const s = end({ updates: 'none', action: a });
    assert.deepEqual(path(s), ['soa', 'U', 'no', 'tkey', 'S', 'no'], a);
    assert.equal(s.result, 'zoneNone', a);
    assert.equal(s.msgs[2].reason, 'zoneNone', a + ': the unsigned try is refused by the setting too');
    assert.deepEqual(s.zone.records, logic.initial(P({ updates: 'none', action: a })).zone.records, a);
  }
});

test('rule 9: an address change by the owner is accepted; data and timestamp change', () => {
  const s0 = logic.initial(P({ action: 'move' }));
  const s = end({ action: 'move' });
  assert.equal(rec(s0, 'pc1').data, '10.0.0.51');
  assert.equal(rec(s, 'pc1').data, '10.0.1.23');
  assert.ok(rec(s, 'pc1').timestamp > rec(s0, 'pc1').timestamp);
  assert.equal(rec(s, 'pc1').timestamp, logic.START + 6);
  assert.deepEqual(s.msgs.at(-1).updated, ['pc1']);
});

test('rule 10: rename adds the new name and removes the old one in one update', () => {
  const s = end({ action: 'rename' });
  assert.deepEqual(s.update, { adds: [{ name: 'pc2-new', data: '10.0.0.52' }], deletes: ['pc2'] });
  assert.equal(rec(s, 'pc2'), null);
  assert.equal(rec(s, 'pc2-new').owner, SID.PC2);
  assert.deepEqual(s.ad.computers.map((c) => c.name), ['DC1', 'FS1', 'PC2-NEW']);
});

test('rule 11: rebuild with a new account: the old account is gone, the record keeps the old SID', () => {
  const s = logic.initial(P({ action: 'rebuildNew' }));
  assert.ok(!s.ad.computers.some((c) => c.sid === SID.PC1), 'old account deleted');
  assert.equal(s.ad.computers.find((c) => c.name === 'PC1').sid, SID.PC1_NEW);
  assert.equal(rec(s, 'pc1').owner, SID.PC1);
  assert.equal(s.clients[0].sid, SID.PC1_NEW);
  const r = logic.initial(P({ action: 'rebuildReset' }));
  assert.equal(r.ad.computers.find((c) => c.name === 'PC1').sid, SID.PC1);
  assert.equal(rec(end({ action: 'rebuildReset' }), 'pc1').data, '10.0.0.77');
});

test('rule 12: the admin deletes the stale record; the next registration creates it with the new owner', () => {
  const p = { action: 'rebuildNew', adminDelete: true };
  const s = end(p);
  assert.deepEqual(path(s), ['soa', 'U', 'no', 'tkey', 'S', 'no', 'admin', 'soa', 'U', 'no', 'tkey', 'S', 'ok']);
  const adm = s.msgs[6];
  assert.deepEqual([adm.deleted, adm.data, adm.owner, adm.t], ['pc1', '10.0.0.51', SID.PC1, logic.ADMIN_AT]);
  assert.equal(rec(at(p, 7), 'pc1'), null, 'gone after the admin step');
  assert.deepEqual(rec(s, 'pc1'), { name: 'pc1', type: 'A', data: '10.0.0.77', owner: SID.PC1_NEW, timestamp: logic.ADMIN_AT + 6, static: false });
  assert.deepEqual(s.msgs.at(-1).added, ['pc1']);
  assert.deepEqual(s.msgs.map((e) => e.round), [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2]);
});

test('rule 13: a workgroup client gives up after REFUSED; nothing changes', () => {
  for (const u of ['secureOnly', 'none']) {
    const s = end({ updates: u, action: 'rogue' });
    assert.deepEqual(path(s), ['soa', 'U', 'no'], u);
    assert.equal(s.msgs.at(-1).gaveUp, true);
    assert.equal(rec(s, 'fs1').data, '10.0.0.20');
  }
  assert.equal(end({}).msgs[2].gaveUp, undefined, 'a member does not give up');
});

test('records stay sorted by name after an add', () => {
  const r = logic.applyUpdate(zone('secureOnly', [A('pc1', '10.0.0.51', SID.PC1)]), { adds: [{ name: 'dc9', data: '10.0.0.9' }], deletes: [] }, { sid: SID.PC1, signed: true }, 1);
  assert.deepEqual(r.records.map((x) => x.name), ['dc9', 'pc1']);
});

test('scenes: the standing records, the accounts and the client flags the page reads', () => {
  const D = 86400, H = 3600;
  assert.deepEqual(logic.initial(P({ action: 'move' })).zone.records, [
    { name: 'dc1', type: 'A', data: '10.0.0.10', owner: SID.DC1, timestamp: 7 * H, static: false },
    { name: 'fs1', type: 'A', data: '10.0.0.20', owner: SID.FS1, timestamp: 8 * H, static: false },
    { name: 'pc1', type: 'A', data: '10.0.0.51', owner: SID.PC1, timestamp: 2 * D + 9 * H + 15 * 60, static: false }]);
  assert.deepEqual(rec(logic.initial(P({ action: 'rename' })), 'pc2'), { name: 'pc2', type: 'A', data: '10.0.0.52', owner: SID.PC2, timestamp: D + 9 * H, static: false });
  assert.equal(logic.ADMIN_AT, logic.START + 1800);
  const cl = (a) => logic.initial(P({ action: a })).clients[0];
  assert.equal(cl('rebuildReset').reset, true);
  assert.equal(cl('rebuildNew').oldSid, SID.PC1);
  assert.equal(cl('rename').renamedFrom, 'PC2');
  for (const a of ['join', 'move', 'rogue']) assert.deepEqual([cl(a).reset, cl(a).oldSid, cl(a).renamedFrom], [undefined, undefined, undefined], a);
  assert.deepEqual([cl('rogue').sid, cl('rogue').domainMember], [null, false]);
});

test('times: day 3 10:00:00, one second per step; records sorted by name', () => {
  const s = end({ action: 'rename' });
  assert.deepEqual(s.msgs.map((e) => e.t), [1, 2, 3, 4, 5, 6].map((k) => logic.START + k));
  assert.equal(logic.START, 3 * 86400 + 10 * 3600);
  assert.deepEqual(s.zone.records.map((r) => r.name), ['dc1', 'fs1', 'pc2-new']);
  assert.deepEqual(end({ action: 'move' }).zone.records.map((r) => r.name), ['dc1', 'fs1', 'pc1']);
});

test('presets: join 6, move 6, rebuild-new-sid 6 (13 fixed), rebuild-reset 6, rename 6, hijack 3; at most 13', () => {
  const cases = [[{}, 6], [{ action: 'move' }, 6], [{ action: 'rebuildNew' }, 6], [{ action: 'rebuildNew', adminDelete: true }, 13],
    [{ action: 'rebuildReset' }, 6], [{ action: 'rename' }, 6], [{ updates: 'nonsecureAndSecure', action: 'rogue' }, 3]];
  for (const [over, n] of cases) assert.equal(logic.steps(P(over)), n, JSON.stringify(over));
  let max = 0;
  for (const updates of logic.UPDATES) for (const action of logic.ACTION_IDS) for (const adminDelete of [false, true]) {
    const s = end({ updates, action, adminDelete });
    max = Math.max(max, s.msgs.length);
    assert.equal(s.phase, 'done');
    assert.equal(s.msgs.at(-1).kind, 'answer', 'ends with an answer');
  }
  assert.equal(max, 13);
  assert.equal(logic.steps(logic.defaults), 6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { action: 'rebuildNew', adminDelete: true }, { updates: 'nonsecureAndSecure', action: 'rename' }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ action: 'rebuildNew', adminDelete: true });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ action: 'rename' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?(\w+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'action') assert.ok(logic.ACTION_IDS.includes(v), `action ${v}`);
    if (k === 'updates') assert.ok(logic.UPDATES.includes(v), `updates ${v}`);
  }
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
