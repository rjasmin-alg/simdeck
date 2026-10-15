// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dc-promotion's model. Rules and numbers: SPEC.md. Run: node --test sims/win-dc-promotion/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (over) => { const p = P(over); const n = logic.steps(p); return { p, n, s: kit.stateAt(logic, p, n) }; };
const atPhase = (over, phase) => {
  const p = P(over);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { const s = kit.stateAt(logic, p, i); if (s.log[s.log.length - 1] === phase) return s; }
  throw new Error('no phase ' + phase);
};
const names = (srv, zone) => (srv.zones[zone] || []).map((r) => r.name + ' ' + r.type + ' ' + r.dc);
const FIRST = { server: 'dc01', dns: true };
const SECOND = { server: 'dc02', dns: true, dc2Dns: 'dc01', gc2: true };
const WRONG = { server: 'dc02', dns: true, dc2Dns: 'public' };
const NODNS = { server: 'dc01', dns: false };

// ── tie-breaks first (SPEC T1–T8) ──

test('T1: without DNS the dns phase is skipped, 3 partitions, no zone, the DNS client stays public', () => {
  const { n, s } = run(NODNS);
  assert.equal(n, 6);
  assert.deepEqual(s.log, ['role', 'forest', 'database', 'sysvol', 'reboot', 'register']);
  const d = s.servers.DC01;
  assert.deepEqual(d.partitions, ['schema', 'config', 'domain']);
  assert.deepEqual(d.zones, {});
  assert.equal(d.dnsServer, false);
  assert.equal(d.dnsClient, logic.PUBLIC);
});

test('T2: DC02 pointed at DC01 without DNS fails like a public resolver, but with noServer', () => {
  const { n, s } = run({ server: 'dc02', dns: false, dc2Dns: 'dc01' });
  assert.equal(n, 3);
  assert.equal(s.query.answer, 'noServer');
  assert.equal(s.query.server, logic.IP.DC01);
  assert.equal(s.result, 'stopped');
  assert.equal(run(WRONG).s.query.answer, 'nxdomain');
});

test('T3: gc2 off changes only DC02 (badge and _gc._tcp); DC01 stays a GC', () => {
  const on = run(SECOND).s, off = run(Object.assign({}, SECOND, { gc2: false })).s;
  assert.equal(on.servers.DC02.gc, true);
  assert.equal(off.servers.DC02.gc, false);
  assert.equal(off.servers.DC01.gc, true);
  const gc = (s) => s.servers.DC01.zones[logic.DOMAIN].filter((r) => r.name === '_gc._tcp').map((r) => r.dc);
  assert.deepEqual(gc(on), ['DC01', 'DC02']);
  assert.deepEqual(gc(off), ['DC01']);
  assert.equal(logic.recordCount(off.servers.DC01), 18);
});

test('T4: DC02 never gets a FSMO role or the PDC record', () => {
  const { s } = run(SECOND);
  assert.deepEqual(s.servers.DC02.fsmo, []);
  assert.deepEqual(s.servers.DC01.fsmo, logic.FSMO);
  const pdc = s.servers.DC02.zones[logic.MSDCS].filter((r) => r.name === '_ldap._tcp.pdc').map((r) => r.dc);
  assert.deepEqual(pdc, ['DC01']);
});

test('T5: connection objects only from DC02\'s restart; the copies before it are one-step flows', () => {
  const p = P(SECOND);
  const conns = [], flows = [];
  for (let i = 0; i <= logic.steps(p); i++) { const s = kit.stateAt(logic, p, i); conns.push(s.connections.length); flows.push(s.flows.map((f) => f.kind).join()); }
  assert.deepEqual(conns, [0, 0, 0, 0, 2, 2, 2]);
  assert.deepEqual(flows, ['', '', '', 'initial', '', 'sysvol', '']);
  assert.deepEqual(kit.stateAt(logic, p, 4).connections, [{ from: 'DC01', to: 'DC02' }, { from: 'DC02', to: 'DC01' }]);
});

test('T6: DC02 keeps its DNS client setting through promotion', () => {
  assert.equal(run(SECOND).s.servers.DC02.dnsClient, logic.IP.DC01);
  assert.equal(run(WRONG).s.servers.DC02.dnsClient, logic.PUBLIC);
});

test('T7: a failed run changes nothing on DC02 after the role, and DC01 not at all', () => {
  const p = P(WRONG);
  const s0 = kit.stateAt(logic, p, 0), s = run(WRONG).s;
  assert.deepEqual(s.servers.DC01, s0.servers.DC01);
  const d = s.servers.DC02;
  assert.equal(d.role, 'binaries');
  assert.deepEqual([d.partitions, d.shares, d.sysvol, d.fsmo, d.gc, d.dsrm, d.dnsServer], [[], [], [], [], false, false, false]);
  assert.deepEqual(s.connections, []);
  assert.deepEqual(s.log, ['role', 'locate', 'stop']);
});

test('T8: records are added once, and kept sorted by name, type, DC', () => {
  const { s } = run(SECOND);
  const z = s.servers.DC01.zones[logic.DOMAIN];
  const keys = z.map((r) => [r.name, r.type, r.dc].join('|'));
  assert.equal(new Set(keys).size, keys.length);
  const tuple = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  const rows = z.map((r) => [r.name, r.type, r.dc]);
  assert.deepEqual(rows, rows.slice().reverse().sort(tuple));
  // registering DC01 again (a periodic refresh) adds nothing
  const again = JSON.parse(JSON.stringify(run(FIRST).s));
  const before = logic.recordCount(again.servers.DC01);
  again.phase = 'register';
  assert.equal(logic.recordCount(logic.step(again, 8, P(FIRST)).servers.DC01), before);
});

// ── rules ──

test('rule 1: the role alone is binaries, no DC', () => {
  for (const over of [FIRST, SECOND]) {
    const s = kit.stateAt(logic, P(over), 1);
    const d = s.servers[over.server === 'dc02' ? 'DC02' : 'DC01'];
    assert.equal(d.role, 'binaries');
    assert.deepEqual(d.partitions, []);
    assert.deepEqual(d.shares, []);
    assert.equal(d.dsrm, false);
    assert.equal(logic.recordCount(d), 0);
  }
  assert.equal(kit.stateAt(logic, P(FIRST), 1).domain, null);
});

test('rule 2: the forest step creates the domain and DSRM; the database the three partitions', () => {
  const f = atPhase(FIRST, 'forest');
  assert.deepEqual(f.domain, { name: 'quillmoor.example', netbios: 'QUILLMOOR', level: '2016' });
  assert.equal(f.servers.DC01.dsrm, true);
  assert.deepEqual(f.servers.DC01.partitions, []);
  assert.deepEqual(atPhase(FIRST, 'database').servers.DC01.partitions, ['schema', 'config', 'domain']);
});

test('rule 3: DNS brings two AD-integrated zones in DomainDnsZones / ForestDnsZones, empty, client to loopback', () => {
  const d = atPhase(FIRST, 'dns').servers.DC01;
  assert.equal(d.dnsServer, true);
  assert.deepEqual(d.partitions, logic.PARTITIONS);
  assert.deepEqual(Object.keys(d.zones), ['quillmoor.example', '_msdcs.quillmoor.example']);
  assert.deepEqual(d.zones['quillmoor.example'], []);
  assert.equal(logic.ZONE_STORE['quillmoor.example'], 'domainDns');
  assert.equal(logic.ZONE_STORE['_msdcs.quillmoor.example'], 'forestDns');
  assert.equal(d.dnsClient, '127.0.0.1');
});

test('rule 4: Netlogon registers 10 records for DC01 (7 + 3), only after the restart', () => {
  assert.equal(logic.recordCount(atPhase(FIRST, 'reboot').servers.DC01), 0);
  const { s } = run(FIRST);
  const d = s.servers.DC01;
  assert.deepEqual(names(d, logic.DOMAIN), [
    '@ A DC01', '_gc._tcp SRV DC01', '_kerberos._tcp SRV DC01', '_kpasswd._tcp SRV DC01', '_ldap._tcp SRV DC01',
    '_ldap._tcp.Default-First-Site-Name._sites SRV DC01', 'dc01 A DC01']);
  assert.deepEqual(names(d, logic.MSDCS), [logic.GUID.DC01 + ' CNAME DC01', '_ldap._tcp.dc SRV DC01', '_ldap._tcp.pdc SRV DC01']);
  assert.equal(s.result, 'ok');
  const data = Object.fromEntries(d.zones[logic.DOMAIN].concat(d.zones[logic.MSDCS]).map((r) => [r.name, r.data]));
  assert.deepEqual(data, {
    '@': '10.10.0.10', dc01: '10.10.0.10',
    '_ldap._tcp': '0 100 389 dc01.quillmoor.example.', '_kerberos._tcp': '0 100 88 dc01.quillmoor.example.',
    '_kpasswd._tcp': '0 100 464 dc01.quillmoor.example.', '_gc._tcp': '0 100 3268 dc01.quillmoor.example.',
    '_ldap._tcp.Default-First-Site-Name._sites': '0 100 389 dc01.quillmoor.example.',
    '_ldap._tcp.dc': '0 100 389 dc01.quillmoor.example.', '_ldap._tcp.pdc': '0 100 389 dc01.quillmoor.example.',
    [logic.GUID.DC01]: 'dc01.quillmoor.example.'
  });
  const ports = Object.fromEntries(d.zones[logic.DOMAIN].filter((r) => r.type === 'SRV').map((r) => [r.name, r.port]));
  assert.deepEqual([ports['_ldap._tcp'], ports['_kerberos._tcp'], ports['_kpasswd._tcp'], ports['_gc._tcp']], [389, 88, 464, 3268]);
});

test('rule 4: without a zone every registration fails (10), nothing is written', () => {
  const { s } = run(NODNS);
  assert.equal(s.servers.DC01.failed.length, 10);
  assert.equal(logic.recordCount(s.servers.DC01), 0);
  assert.equal(s.registered, 0);
  assert.equal(s.result, 'unregistered');
});

test('rule 5: SYSVOL, NETLOGON, the two default GPOs, DFSR', () => {
  const d = atPhase(FIRST, 'sysvol').servers.DC01;
  assert.deepEqual(d.shares, ['SYSVOL', 'NETLOGON']);
  assert.deepEqual(d.sysvol, ['{31B2F340-016D-11D2-945F-00C04FB984F9}', '{6AC1786C-016F-11D2-945F-00C04FB984F9}']);
  assert.equal(d.dfsr, true);
  assert.equal(d.role, 'promoting');
});

test('rule 6: the first DC holds all five FSMO roles and is a GC after the restart', () => {
  const before = atPhase(FIRST, 'sysvol').servers.DC01, after = atPhase(FIRST, 'reboot').servers.DC01;
  assert.deepEqual([before.fsmo, before.gc], [[], false]);
  assert.deepEqual(after.fsmo, ['schema', 'naming', 'rid', 'pdc', 'infrastructure']);
  assert.equal(after.gc, true);
  assert.equal(after.role, 'dc');
  assert.equal(run(NODNS).s.servers.DC01.fsmo.length, 5);
});

test('rule 7: DC02 finds the domain by the locator SRV record at its DNS server', () => {
  const ok = atPhase(SECOND, 'locate');
  assert.deepEqual(ok.query, { from: 'DC02', server: '10.10.0.10', name: '_ldap._tcp.dc._msdcs.quillmoor.example', answer: 'found', target: 'DC01' });
  assert.equal(ok.servers.DC02.dsrm, true);
  assert.equal(ok.servers.DC02.role, 'promoting');
  const bad = atPhase(WRONG, 'locate');
  assert.equal(bad.query.answer, 'nxdomain');
  assert.equal(bad.servers.DC02.dsrm, false);
  assert.equal(run(WRONG).n, 3);
});

test('rule 8: DC02 pulls all five partitions from DC01, then SYSVOL by a DFSR sync of the same GPOs', () => {
  const r = atPhase(SECOND, 'replicate');
  assert.deepEqual(r.servers.DC02.partitions, logic.PARTITIONS);
  assert.deepEqual(r.flows, [{ from: 'DC01', to: 'DC02', kind: 'initial' }]);
  assert.deepEqual(r.servers.DC02.shares, []);
  assert.deepEqual(atPhase(SECOND, 'reboot').servers.DC02.shares, [], 'SYSVOL is shared only after the sync');
  const v = atPhase(SECOND, 'sysvol');
  assert.deepEqual(v.servers.DC02.shares, ['SYSVOL', 'NETLOGON']);
  assert.equal(v.servers.DC02.dfsr, true);
  assert.equal(v.servers.DC02.role, 'dc');
  assert.deepEqual(v.log, ['role', 'locate', 'replicate', 'reboot', 'sysvol']);
  assert.deepEqual(v.servers.DC02.sysvol, v.servers.DC01.sysvol);
  assert.deepEqual(v.flows, [{ from: 'DC01', to: 'DC02', kind: 'sysvol' }]);
});

test('rule 9: DC02 becomes GC and DNS server, registers 9 records; both DNS servers end with 19, two locators', () => {
  const rb = atPhase(SECOND, 'reboot').servers.DC02;
  assert.equal(rb.role, 'dc');
  assert.equal(rb.dnsServer, true);
  assert.equal(logic.recordCount(rb), 10);
  const { s, n } = run(SECOND);
  assert.equal(n, 6);
  assert.equal(logic.recordCount(s.servers.DC01), 19);
  assert.deepEqual(s.servers.DC02.zones, s.servers.DC01.zones);
  assert.equal(s.registered, 9);
  const loc = s.servers.DC02.zones[logic.MSDCS].filter((r) => r.name === '_ldap._tcp.dc').map((r) => r.dc);
  assert.deepEqual(loc, ['DC01', 'DC02']);
  assert.equal(logic.dcRecords('DC02', { gc: true, pdc: false }).length, 9);
  const mine = s.servers.DC01.zones[logic.DOMAIN].concat(s.servers.DC01.zones[logic.MSDCS]).filter((r) => r.dc === 'DC02');
  assert.deepEqual(mine.filter((r) => r.type !== 'SRV').map((r) => r.name + ' ' + r.data).sort(),
    ['@ 10.10.0.11', logic.GUID.DC02 + ' dc02.quillmoor.example.', 'dc02 10.10.0.11']);
  assert.ok(mine.filter((r) => r.type === 'SRV').every((r) => r.data === '0 100 ' + r.port + ' dc02.quillmoor.example.'));
  assert.equal(logic.dcRecords('DC02', { gc: false, pdc: false }).length, 8);
});

test('presets: step counts and end numbers of SPEC "Expected numbers"', () => {
  const f = run(FIRST);
  assert.equal(f.n, 7);
  const d = f.s.servers.DC01;
  assert.deepEqual([d.partitions.length, Object.keys(d.zones).length, logic.recordCount(d), d.shares.length, d.sysvol.length, d.fsmo.length, d.gc],
    [5, 2, 10, 2, 2, 5, true]);
  const s2 = run(SECOND);
  const e = s2.s.servers.DC02;
  assert.deepEqual([s2.n, e.partitions.length, Object.keys(e.zones).length, e.sysvol.length, e.fsmo.length, e.gc, s2.s.connections.length],
    [6, 5, 2, 2, 0, true, 2]);
  const w = run(WRONG);
  assert.deepEqual([w.n, w.s.result, w.s.query.answer], [3, 'stopped', 'nxdomain']);
  const x = run(NODNS);
  assert.deepEqual([x.n, x.s.servers.DC01.partitions.length, logic.recordCount(x.s.servers.DC01), x.s.servers.DC01.failed.length, x.s.result],
    [6, 3, 0, 10, 'unregistered']);
});

test('the second-DC run starts where the DC01 run with the same dns ends', () => {
  for (const dns of [true, false]) {
    const end = run({ server: 'dc01', dns }).s.servers.DC01;
    assert.deepEqual(kit.stateAt(logic, P({ server: 'dc02', dns }), 0).servers.DC01, end);
  }
});

// ── generic checks every sim keeps ──

const ALL = [];
for (const server of ['dc01', 'dc02']) for (const dns of [true, false]) for (const dc2Dns of ['dc01', 'public']) for (const gc2 of [true, false]) ALL.push({ server, dns, dc2Dns, gc2 });

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input; stepping past the end changes nothing', () => {
  const p = P(SECOND);
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const end = run(SECOND).s;
  assert.deepEqual(logic.step(end, 7, p), end);
});

test('every run stays within the 20-step limit', () => {
  for (const over of ALL) assert.ok(logic.steps(P(over)) <= 20);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; sim.json steps = the default run', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default run');
  assert.equal(sim.steps, meta.steps);
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const e of sim.entries) assert.ok(html.includes(`id: '${e.preset}'`), `entry ${e.preset} is a preset`);
});
