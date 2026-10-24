// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-srv-records. Run: node --test sims/win-dns-srv-records/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the presets, then the generic block.
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
const run = (over) => logic.plan(P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const kinds = (over) => run(over).events.map((e) => e.kind);
const queries = (over) => run(over).events.filter((e) => e.kind === 'query').map((e) => e.name);
const present = (s, row, dc) => s.records.find((r) => r.row === row && r.target === dc).present;

const ALL = [];
for (const action of ['join', 'logon']) for (const site of ['hq', 'branch', 'unknown']) for (const dns of ['dc01', 'public'])
  for (let m = 0; m < 32; m++) ALL.push({ action, site, dns, locator: !!(m & 1), siteRecord: !!(m & 2), kerberos: !!(m & 4), gc: !!(m & 8), restartNetlogon: !!(m & 16) });

// ── tie-breaks ──

test('T1 / rule 8: equal priority and weight: the first listed target', () => {
  assert.equal(logic.pick([{ dc: 'DC01', prio: 0, weight: 100 }, { dc: 'DC02', prio: 0, weight: 100 }]), 0);
  assert.equal(logic.pick([{ dc: 'DC02', prio: 0, weight: 100 }, { dc: 'DC01', prio: 0, weight: 100 }]), 0);
  assert.equal(logic.pick([]), -1);
  // in the scene every domain-wide answer lists DC01 first
  const a = run({ siteRecord: true }).events.find((e) => e.kind === 'answer' && e.scope === 'domain');
  assert.deepEqual(a.targets.map((t) => t.dc), ['DC01', 'DC02']);
  assert.equal(a.pick, 'DC01');
});

test('rule 8: lowest priority first, then the highest weight', () => {
  assert.equal(logic.pick([{ dc: 'A', prio: 10, weight: 100 }, { dc: 'B', prio: 0, weight: 1 }]), 1);
  assert.equal(logic.pick([{ dc: 'A', prio: 0, weight: 50 }, { dc: 'B', prio: 0, weight: 60 }, { dc: 'C', prio: 0, weight: 60 }]), 1);
  assert.equal(logic.pick([{ dc: 'A', prio: 5, weight: 100 }, { dc: 'B', prio: 5, weight: 100 }, { dc: 'C', prio: 1, weight: 0 }]), 2);
});

test('T2: a member that knows its site asks the site record first; an unknown one, or a joining computer, the domain-wide record', () => {
  assert.equal(queries({ action: 'logon', site: 'hq' })[0], '_ldap._tcp.HQ._sites.dc._msdcs');
  assert.equal(queries({ action: 'logon', site: 'branch' })[0], '_ldap._tcp.Branch._sites.dc._msdcs');
  assert.equal(queries({ action: 'logon', site: 'unknown' })[0], logic.LDAP_DC);
  for (const site of ['hq', 'branch', 'unknown']) assert.equal(queries({ site })[0], logic.LDAP_DC, `join from ${site}`);
  assert.equal(logic.knownSite(P({ action: 'join' }), 'HQ'), null);
  assert.equal(logic.knownSite(P({ action: 'logon' }), 'HQ'), 'HQ');
});

test('rule 3: a joining computer learns its site from the LDAP ping', () => {
  assert.equal(at({}, 0).client.site, null);
  const pong = run({}).events.find((e) => e.kind === 'pong');
  assert.deepEqual([pong.from, pong.site, pong.closest, pong.learnt], ['DC01', 'HQ', true, true]);
  assert.equal(at({}, 4).client.site, 'HQ');
  // in Branch it learns Branch from DC01 and moves to DC02 (same as unknown)
  assert.deepEqual(run({ site: 'branch' }).events.filter((e) => e.kind === 'ping').map((e) => e.to), ['DC01', 'DC02']);
  assert.deepEqual(run({ site: 'branch' }).events.map((e) => e.kind), run({ site: 'unknown' }).events.map((e) => e.kind));
});

test('T3: after a failed site query a "not closest" ping answer sends no second site query', () => {
  const p = { action: 'logon', site: 'branch', siteRecord: true };
  const q = queries(p);
  assert.equal(q.filter((n) => n === logic.siteLdap('Branch')).length, 1);
  const pong = run(p).events.find((e) => e.kind === 'pong');
  assert.equal(pong.closest, false);
  assert.equal(kinds(p).filter((k) => k === 'ping').length, 1);
});

test('T3: the site query after a "not closest" answer finds nothing: no second ping, the DC across the WAN stays', () => {
  for (const p of [{ site: 'unknown', siteRecord: true }, { action: 'logon', site: 'unknown', siteRecord: true }]) {
    const r = run(p);
    assert.deepEqual(r.events.filter((e) => e.kind === 'ping').map((e) => e.to), ['DC01']);
    assert.deepEqual([r.result.dc, r.result.wan], ['DC01', true]);
  }
});

test('T4 / rule 1: restarting Netlogon on DC01 restores DC01\'s deleted records only', () => {
  const p = { locator: true, siteRecord: true, kerberos: true, gc: true, restartNetlogon: true };
  const s0 = at(p, 0), s2 = at(p, 2), s3 = at(p, 3);
  assert.equal(present(s0, 'ldapDc', 'DC01'), false);
  assert.equal(present(s2, 'ldapDc', 'DC01'), false, 'not before the UPDATE is answered');
  for (const r of s3.records) assert.equal(r.present, r.target === 'DC01' || r.row === 'guid2', r.key);
  assert.equal(run(p).events[1].count, 11);
  assert.equal(run(p).events[2].added, 10, 'every DC01 record but its replication CNAME was deleted');
  assert.equal(run({ restartNetlogon: true }).events[2].added, 0, 'nothing deleted: nothing added');
});

test('T5: no DC found: the run stops before any KDC lookup, no NTLM', () => {
  assert.deepEqual(kinds({ locator: true, siteRecord: true, kerberos: true }), ['query', 'answer']);
  assert.deepEqual(kinds({ action: 'logon', locator: true, siteRecord: true, kerberos: true }), ['query', 'answer', 'query', 'answer']);
  assert.ok(queries({ locator: true, siteRecord: true }).every((n) => n.startsWith('_ldap')));
});

test('T6 / rule 7: the public resolver answers NXDOMAIN for every name, with every record present', () => {
  const s = end({ dns: 'public' });
  assert.ok(s.records.every((r) => r.present));
  assert.ok(s.log.filter((e) => e.kind === 'answer').every((e) => e.rcode === 'NXDOMAIN'));
  assert.deepEqual(s.result, { ok: false, code: 'noDc', action: 'join' });
  // a restart still restores DC01's records in DC01's DNS server, which the client does not ask
  const r = end({ dns: 'public', locator: true, restartNetlogon: true });
  assert.equal(present(r, 'ldapDc', 'DC01'), true);
  assert.equal(r.result.ok, false);
});

test('T7 / rule 9: the GC toggle never changes the steps or the result', () => {
  for (const p of ALL.filter((x) => !x.gc)) {
    const a = run(p), b = run(Object.assign({}, p, { gc: true }));
    assert.equal(b.events.length, a.events.length);
    assert.deepEqual(b.result, a.result);
  }
});

// ── rules ──

test('rule 2: 14 rows, 21 records; DC01 11, DC02 10; every SRV 0 100 with its port', () => {
  const r = logic.initialRecords(P());
  assert.equal(logic.ROWS.length, 14);
  assert.equal(r.length, 21);
  assert.equal(r.filter((x) => x.target === 'DC01').length, 11);
  assert.equal(r.filter((x) => x.target === 'DC02').length, 10);
  for (const x of r.filter((y) => y.type === 'SRV')) { assert.equal(x.prio, 0); assert.equal(x.weight, 100); }
  const port = (row) => logic.ROWS.find((x) => x.id === row).port;
  assert.deepEqual(['ldap', 'ldapDc', 'krb', 'kpasswd', 'gc', 'gcMsdcs'].map(port), [389, 389, 88, 464, 3268, 3268]);
  assert.deepEqual(r.filter((x) => x.row === 'pdc').map((x) => x.target), ['DC01']);
});

test('rule 2: each toggle deletes its group; a record in two groups goes with either', () => {
  const gone = (over) => logic.initialRecords(P(over)).filter((x) => !x.present).map((x) => x.row);
  assert.deepEqual([...new Set(gone({ locator: true }))], ['ldap', 'ldapDc', 'pdc']);
  assert.deepEqual([...new Set(gone({ siteRecord: true }))], ['ldapHQ', 'ldapBranch', 'krbHQ', 'krbBranch']);
  assert.deepEqual([...new Set(gone({ kerberos: true }))], ['krb', 'krbDc', 'krbHQ', 'krbBranch', 'kpasswd']);
  assert.deepEqual([...new Set(gone({ gc: true }))], ['gc', 'gcMsdcs']);
  assert.deepEqual(gone({ locator: true, siteRecord: true, kerberos: true, gc: true }).filter((r) => r.startsWith('guid')), []);
});

test('rule 3: locate, ping; the DC answers the client\'s site and whether it is in it', () => {
  const ev = run({ action: 'logon' }).events;
  assert.deepEqual(ev.slice(0, 4).map((e) => e.kind), ['query', 'answer', 'ping', 'pong']);
  assert.equal(ev[1].pick, 'DC01');
  assert.deepEqual([ev[3].from, ev[3].site, ev[3].closest, ev[3].learnt], ['DC01', 'HQ', true, false]);
  // unknown: learns Branch from DC01, asks Branch's record, pings DC02 (closest)
  const u = run({ site: 'unknown' }).events;
  const pongs = u.filter((e) => e.kind === 'pong');
  assert.deepEqual(pongs.map((e) => [e.from, e.site, e.closest, e.learnt]), [['DC01', 'Branch', false, true], ['DC02', 'Branch', true, false]]);
  assert.equal(end({ site: 'unknown' }).client.site, 'Branch');
  assert.equal(at({ site: 'unknown' }, 3).client.site, null, 'not before the answer');
  assert.equal(run({ site: 'unknown' }).result.dc, 'DC02');
});

test('rule 4: site record missing: the domain-wide record, a DC in another site, over the WAN', () => {
  const r = run({ action: 'logon', site: 'branch', siteRecord: true });
  assert.deepEqual(r.result, { ok: true, how: 'kerberos', dc: 'DC01', kdc: 'DC01', wan: true, action: 'logon' });
  assert.equal(run({ site: 'hq', siteRecord: true }).result.wan, false, 'HQ falls back to DC01, its own site');
  // for a member that knows its site, the site record alone is enough: the domain-wide records may be gone
  assert.deepEqual(run({ action: 'logon', locator: true }).result, { ok: true, how: 'kerberos', dc: 'DC01', kdc: 'DC01', wan: false, action: 'logon' });
});

test('rule 5: no DC: the run ends with noDc after the last NXDOMAIN', () => {
  for (const action of ['join', 'logon']) {
    const p = { action, locator: true, siteRecord: true };
    const s = end(p);
    assert.deepEqual(s.result, { ok: false, code: 'noDc', action });
    assert.equal(at(p, logic.steps(P(p)) - 1).result, null);
  }
  // a joining computer needs _ldap._tcp.dc._msdcs: deleting the locator records alone stops the join (task rule 5)
  assert.deepEqual(run({ locator: true }).result, { ok: false, code: 'noDc', action: 'join' });
  assert.equal(run({ locator: true }).events.length, 2);
  // an unknown client cannot use the site records: domain-wide gone is enough
  assert.equal(run({ site: 'unknown', locator: true }).events.length, 2);
  assert.equal(run({ site: 'unknown', locator: true }).result.code, 'noDc');
});

test('rule 6: the KDC by its site record, then domain-wide; none found: NTLM with the located DC', () => {
  assert.deepEqual(queries({}).slice(1), ['_kerberos._tcp.HQ._sites.dc._msdcs']);
  assert.deepEqual(kinds({}).slice(-2), ['asReq', 'asRep']);
  const n = run({ action: 'logon', kerberos: true });
  assert.deepEqual(n.events.filter((e) => e.kind === 'query').map((e) => e.name).slice(1), [logic.siteKdc('HQ'), logic.KDC_DC]);
  assert.deepEqual(n.events.slice(-2).map((e) => [e.kind, e.to || e.from]), [['ntlm', 'DC01'], ['ntlmOk', 'DC01']]);
  assert.deepEqual(n.result, { ok: true, how: 'ntlm', dc: 'DC01', kdc: null, wan: false, action: 'logon' });
  // the site KDC record gone (site toggle): the domain-wide one, DC01 first
  assert.equal(run({ site: 'branch', siteRecord: true }).result.kdc, 'DC01');
  // AS goes to the KDC found; NTLM to the DC located (here DC02 in Branch)
  const b = run({ action: 'logon', site: 'branch', kerberos: true });
  assert.deepEqual(b.events.slice(-2).map((e) => e.to || e.from), ['DC02', 'DC02']);
  assert.deepEqual(b.result, { ok: true, how: 'ntlm', dc: 'DC02', kdc: null, wan: false, action: 'logon' });
});

test('rule 4 + 6: NTLM over the WAN: no site record and no Kerberos record in Branch', () => {
  assert.deepEqual(run({ action: 'logon', site: 'branch', siteRecord: true, kerberos: true }).result,
    { ok: true, how: 'ntlm', dc: 'DC01', kdc: null, wan: true, action: 'logon' });
});

test('rule 1 + 6: restart with kerberos deleted: DC01\'s Kerberos records back, DC02\'s not (the 17-step run)', () => {
  const r = run({ site: 'unknown', kerberos: true, restartNetlogon: true });
  assert.equal(r.events.length, 17);
  assert.deepEqual([r.result.dc, r.result.kdc, r.result.wan], ['DC02', 'DC01', true]);
  assert.deepEqual(r.events.filter((e) => e.kind === 'ping').map((e) => e.to), ['DC01', 'DC02']);
  assert.deepEqual(r.events.filter((e) => e.kind === 'asReq' || e.kind === 'asRep').map((e) => e.to || e.from), ['DC01', 'DC01']);
  const s = end({ site: 'unknown', kerberos: true, restartNetlogon: true });
  assert.deepEqual([s.client.dc, s.client.kdc], ['DC02', 'DC01']);
});

test('the client state follows the answers: dc, kdc', () => {
  const s = end({});
  assert.deepEqual([s.client.dc, s.client.kdc, s.client.ip, s.client.dns], ['DC01', 'DC01', '10.10.20.57', '10.10.0.10']);
  assert.equal(at({}, 1).focus, logic.LDAP_DC);
  assert.equal(at({}, 2).focus, logic.LDAP_DC, 'the answer keeps the queried row');
  assert.equal(at({}, 3).focus, null);
  assert.equal(at({ action: 'logon' }, 1).focus, logic.siteLdap('HQ'));
  assert.equal(end({ dns: 'public' }).client.dns, '203.0.113.53');
  assert.equal(end({ site: 'branch' }).client.ip, '10.20.20.57');
});

// ── presets (SPEC table, also checked by a separate hand count) ──

const PRESETS = {
  'healthy-join': [{}, 8, { ok: true, how: 'kerberos', dc: 'DC01', kdc: 'DC01', wan: false, action: 'join' }],
  'no-locator': [{ locator: true, siteRecord: true }, 2, { ok: false, code: 'noDc', action: 'join' }],
  'no-site-record': [{ action: 'logon', site: 'branch', siteRecord: true }, 12, { ok: true, how: 'kerberos', dc: 'DC01', kdc: 'DC01', wan: true, action: 'logon' }],
  'public-dns': [{ dns: 'public' }, 2, { ok: false, code: 'noDc', action: 'join' }],
  'netlogon-fix': [{ locator: true, siteRecord: true, restartNetlogon: true }, 11, { ok: true, how: 'kerberos', dc: 'DC01', kdc: 'DC01', wan: false, action: 'join' }],
  'no-kerberos': [{ action: 'logon', kerberos: true }, 10, { ok: true, how: 'ntlm', dc: 'DC01', kdc: null, wan: false, action: 'logon' }]
};
for (const [id, [p, steps, result]] of Object.entries(PRESETS)) {
  test(`preset ${id}: ${steps} steps`, () => {
    assert.equal(logic.steps(P(p)), steps);
    assert.deepEqual(end(p).result, result);
  });
}

test('netlogon-fix: DC01\'s 5 deleted records back, DC02\'s 4 not', () => {
  const p = { locator: true, siteRecord: true, restartNetlogon: true };
  assert.equal(run(p).events[2].added, 5);
  const s = at(p, 3);
  assert.deepEqual(s.restored, ['ldap|DC01', 'ldapDc|DC01', 'ldapHQ|DC01', 'pdc|DC01', 'krbHQ|DC01']);
  for (const k of s.restored) assert.equal(at(p, 2).records.find((r) => r.key === k).present, false);
  assert.equal(s.records.filter((r) => !r.present).length, 4);
  assert.ok(s.records.filter((r) => !r.present).every((r) => r.target === 'DC02'));
});

test('every combination: 2 to 17 steps, at most 20; defaults 8', () => {
  let max = 0;
  for (const p of ALL) { const n = logic.steps(P(p)); assert.ok(n >= 2 && n <= 20, JSON.stringify(p)); max = Math.max(max, n); }
  assert.equal(max, 17);
  assert.equal(logic.steps(P()), 8);
});

test('the result appears on the last step only', () => {
  for (const p of ALL.filter((x, i) => i % 7 === 0)) {
    const q = P(p), n = logic.steps(q);
    assert.equal(kit.stateAt(logic, q, n - 1).result, null);
    assert.notEqual(kit.stateAt(logic, q, n).result, null);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of [{}, { site: 'unknown', kerberos: true, restartNetlogon: true }, { dns: 'public' }]) {
    const q = P(p);
    for (let n = 0; n <= logic.steps(q); n++) {
      const s = kit.stateAt(logic, q, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ site: 'unknown', siteRecord: true, restartNetlogon: true });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ locator: true, restartNetlogon: true });
  let s = logic.initial(p);
  for (let n = 1; n <= 3; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and has the SPEC\'s step count', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P()), 'meta.steps matches the defaults');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*?params: \{([^}]*)\}/g)];
  assert.deepEqual(found.map((m) => m[1]).sort(), Object.keys(PRESETS).sort());
  for (const m of found) {
    const params = {};
    for (const k of m[2].matchAll(/(\w+): ('?)([\w-]+)\2/g)) {
      assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
      params[k[1]] = k[2] ? k[3] : k[3] === 'true';
    }
    assert.deepEqual(params, PRESETS[m[1]][0], `preset ${m[1]} params match the SPEC`);
  }
});
