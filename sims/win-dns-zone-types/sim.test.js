// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-zone-types. Run: node --test sims/win-dns-zone-types/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected tables, then the generic block.
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
const at = (over) => logic.initial(P(over));
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
/** The holdings of one zone as { server: hold }, leaving out servers that hold nothing. */
const col = (s, zone) => {
  const out = {};
  for (const sv of s.servers) { const c = s.holdings[sv.id][zone]; if (c.hold !== 'none') out[sv.id] = c.hold; }
  return out;
};
const rejected = (s) => s.errors.map((e) => [e.code, e.server]);

// ── tie-breaks first ──

test('tie-break: a rejected definition keeps the previous holdings and marks the cell (rule 9)', () => {
  const s = at({ host: 'MS1' });
  assert.equal(s.accepted, false);
  assert.deepEqual(rejected(s), [['not-dc', 'MS1']]);
  // what DC promotion left stays: corp.example in DomainDnsZones on the DNS DCs of corp.example
  assert.deepEqual(col(s, 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read' });
  assert.equal(s.holdings.MS1['corp.example'].hold, 'none');
  assert.equal(s.holdings.MS1['corp.example'].rejected, 'not-dc');
  // the rejection does not change any other cell
  assert.deepEqual(s.holdings.DC1, at({}).holdings.DC1);
});

test('tie-break: a copy on a server that already holds the zone is rejected there, nowhere else (rule 9)', () => {
  // a file secondary of corp.example on DC1, which holds the AD zone
  const s = at({ type: 'secondary', host: 'DC1' });
  assert.equal(s.accepted, false);
  assert.deepEqual(rejected(s), [['exists', 'DC1']]);
  assert.equal(s.holdings.DC1['corp.example'].hold, 'write');
  assert.equal(s.holdings.DC1['corp.example'].rejected, 'exists');
  // an AD stub of branch.corp.example with forest scope would land on DC4, which holds the real zone
  const f = at({ zone: 'branch.corp.example', type: 'adStub', scope: 'forest', allowXfr: true });
  assert.deepEqual(rejected(f), [['exists', 'DC4']]);
  assert.deepEqual(col(f, 'branch.corp.example'), { DC4: 'write' });
  // a copy cannot be made on a server without the DNS role at all (and only DC3 ever stores a zone without serving it)
  const servers = logic.serversOf({});
  const base = logic.baseline().map((d) => (d.name === 'corp.example' ? Object.assign({}, d, { scope: 'allDCsDomain' }) : d));
  const r = logic.holdingsOf(servers, base, { name: 'corp.example', type: 'secondary', scope: null, host: 'DC3', master: null }, { allowXfr: true });
  assert.deepEqual(r.errors.map((e) => e.code), ['no-dns']);
});

test('tie-break: a primary on a server holding the zone converts it; elsewhere it is a second zone (rule 9)', () => {
  // file primary on DC1, which holds the AD zone: converted, the AD copies on DC2 and RODC1 are gone
  assert.deepEqual(col(at({ type: 'primary' }), 'corp.example'), { DC1: 'write' });
  // AD primary on DC1 with another scope: the same zone, its scope changed
  assert.deepEqual(col(at({ scope: 'forest' }), 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', DC4: 'write' });
  // file primary on MS1 (does not hold it): a second, separate primary; the AD zone stays
  const two = at({ type: 'primary', host: 'MS1' });
  assert.deepEqual(col(two, 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', MS1: 'write' });
  assert.equal(two.def.host, 'MS1');
  assert.equal(two.zones.filter((d) => d.name === 'corp.example').length, 2);
  // AD primary on DC4 (does not hold it) while the zone is in AD: rejected, one name is one zone in the directory
  const ad = at({ host: 'DC4' });
  assert.equal(ad.accepted, false);
  assert.deepEqual(ad.errors, [{ code: 'exists-ad', server: 'DC4', zone: 'corp.example', by: 'zone', part: 'DomainDnsZones.corp.example' }]);
  assert.deepEqual(col(ad, 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read' });
  // a secondary on DC4 adds a copy and keeps the AD zone
  assert.deepEqual(col(at({ type: 'secondary', host: 'DC4', allowXfr: true }), 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', DC4: 'read' });
});

test('tie-break: "domain" is the domain of the DC the zone is created on, not the zone\'s name (rule 5)', () => {
  // partner.example created on DC4 with domain scope goes to DomainDnsZones.branch.corp.example: DC4 only
  const d = at({ zone: 'partner.example', host: 'DC4' });
  assert.equal(d.partition, 'DomainDnsZones.branch.corp.example');
  assert.deepEqual(col(d, 'partner.example'), { DC4: 'write' });
  // created on DC1: DomainDnsZones.corp.example
  const s = at({ zone: 'partner.example', host: 'DC1' });
  assert.equal(s.partition, 'DomainDnsZones.corp.example');
  assert.deepEqual(col(s, 'partner.example'), { DC1: 'write', DC2: 'write', RODC1: 'read' });
  // an AD stub of branch.corp.example made on DC1 is stored in DC1's domain partition, not branch's
  assert.equal(at({ zone: 'branch.corp.example', type: 'adStub', allowXfr: true }).partition, 'DomainDnsZones.corp.example');
});

test('tie-break: MS1\'s secondary on a server that already holds the zone is rejected; the zone itself stays (rule 9)', () => {
  const s = at({ type: 'primary', host: 'MS1', ms1Secondary: true, allowXfr: true });
  assert.equal(s.accepted, true);
  assert.equal(s.ms1, 'rejected');
  assert.deepEqual(rejected(s), [['exists', 'MS1']]);
  assert.equal(s.holdings.MS1['corp.example'].hold, 'write');
  assert.equal(s.errors[0].by, 'ms1Secondary');
});

// ── rule 1: a file-backed primary ──

test('rule 1: a primary zone in a file lives on one server and is writable there only', () => {
  for (const host of ['DC1', 'DC4', 'MS1']) {
    const s = at({ zone: 'partner.example', type: 'primary', host });
    assert.equal(s.accepted, true, host);
    assert.deepEqual(col(s, 'partner.example'), { [host]: 'write' }, host);
    assert.deepEqual(s.holdings[host]['partner.example'], { hold: 'write', via: 'file', from: null, serial: 2026101401 });
    assert.equal(s.partition, null);
    assert.equal(s.def.type, 'primary');
  }
});

// ── rule 2: a secondary ──

test('rule 2: a secondary is a read-only copy pulled from the master, only if the master allows the transfer', () => {
  const off = at({ type: 'secondary', host: 'DC4' });
  assert.equal(off.holdings.DC4['corp.example'].hold, 'refused');
  assert.equal(off.holdings.DC4['corp.example'].from, 'DC1');
  assert.equal(off.holdings.DC4['corp.example'].serial, null);
  const on = at({ type: 'secondary', host: 'DC4', allowXfr: true });
  assert.deepEqual(on.holdings.DC4['corp.example'], { hold: 'read', via: 'xfr', from: 'DC1', serial: 128 });
  // branch.corp.example's master is DC4
  assert.equal(at({ zone: 'branch.corp.example', type: 'secondary', host: 'DC1', allowXfr: true }).holdings.DC1['branch.corp.example'].from, 'DC4');
});

test('rule 2: the partner\'s server outside the forest allows the transfer; allowXfr is about our masters', () => {
  const s = at({ zone: 'partner.example', type: 'secondary', host: 'DC1' });
  assert.deepEqual(s.holdings.DC1['partner.example'], { hold: 'read', via: 'xfr', from: '10.20.0.53', serial: 2026101401 });
  assert.equal(logic.external('10.20.0.53'), true);
  assert.equal(logic.external('DC1'), false);
});

test('rule 2: a secondary cannot be AD-integrated: a file-backed zone with a scope is rejected', () => {
  const servers = logic.serversOf({});
  const r = logic.place(servers, { name: 'corp.example', type: 'secondary', scope: 'domain', host: 'DC4', master: 'DC1' }, { allowXfr: true });
  assert.deepEqual(r.errors, [{ code: 'scope-on-file', server: 'DC4' }]);
  assert.deepEqual(r.cells, {});
  // the page never builds one: a file type drops the scope param
  assert.equal(at({ type: 'secondary', scope: 'forest', host: 'DC4' }).created.scope, null);
  assert.deepEqual(logic.TYPES.filter((x) => logic.isAD(x)), ['adPrimary', 'adStub']);
});

// ── rule 3: a stub ──

test('rule 3: a stub zone holds only the SOA, the NS records and their glue A records', () => {
  const s = preset('stub-partner');
  const c = s.holdings.DC1['partner.example'];
  assert.equal(c.hold, 'stub');
  const ct = logic.contentOf(c, 'partner.example');
  assert.equal(ct.kind, 'stub');
  assert.deepEqual(ct.rr.map((r) => r.type), ['SOA', 'NS', 'NS', 'A', 'A']);
  assert.deepEqual(ct.rr.filter((r) => r.type === 'A').map((r) => r.data), ['10.20.0.53', '10.20.0.54']);
  // and does not answer for the zone's names: the query goes to the zone's own servers
  assert.deepEqual(ct.answer, { kind: 'refer', name: 'www.partner.example', ns: ['ns1.partner.example', 'ns2.partner.example'], addrs: ['10.20.0.53', '10.20.0.54'] });
  // a full copy answers
  assert.equal(logic.contentOf(s.holdings.DC1['corp.example'], 'corp.example').answer.kind, 'answer');
});

test('rule 3: a stub is refreshed from the master like a secondary, and can be AD-integrated', () => {
  assert.equal(at({ zone: 'branch.corp.example', type: 'stub', host: 'DC1' }).holdings.DC1['branch.corp.example'].hold, 'refused');
  const ad = at({ zone: 'branch.corp.example', type: 'adStub', scope: 'domain', allowXfr: true });
  assert.deepEqual(col(ad, 'branch.corp.example'), { DC1: 'stub', DC2: 'stub', RODC1: 'stub', DC4: 'write' });
  assert.equal(ad.holdings.DC1['branch.corp.example'].via, 'ad');
  assert.equal(ad.holdings.DC1['branch.corp.example'].from, 'DC4');
  const refused = at({ zone: 'branch.corp.example', type: 'adStub', scope: 'domain' });
  assert.deepEqual(col(refused, 'branch.corp.example'), { DC1: 'refused', DC2: 'refused', RODC1: 'refused', DC4: 'write' });
});

// ── rule 4: AD zones only on DCs ──

test('rule 4: an AD-integrated zone cannot be created on a server that is not a DC', () => {
  for (const type of ['adPrimary', 'adStub']) {
    const s = at({ zone: 'partner.example', type, host: 'MS1', allowXfr: true });
    assert.deepEqual(rejected(s), [['not-dc', 'MS1']], type);
  }
  // and no scope ever reaches MS1
  for (const scope of logic.SCOPES) assert.equal(at({ scope }).holdings.MS1['corp.example'].hold, 'none', scope);
});

// ── rule 5: replication scope ──

test('rule 5: forest = every DC running DNS in the forest', () => {
  assert.deepEqual(col(at({ scope: 'forest' }), 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', DC4: 'write' });
  assert.deepEqual(col(at({ scope: 'forest', dc3Dns: true }), 'corp.example'), { DC1: 'write', DC2: 'write', DC3: 'write', RODC1: 'read', DC4: 'write' });
  assert.equal(at({ scope: 'forest' }).partition, 'ForestDnsZones.corp.example');
});

test('rule 5: domain = every DC running DNS in the domain (the default)', () => {
  assert.equal(logic.defaults.scope, 'domain');
  assert.deepEqual(col(at({ scope: 'domain' }), 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read' });
  assert.deepEqual(col(at({ scope: 'domain', dc3Dns: true }), 'corp.example'), { DC1: 'write', DC2: 'write', DC3: 'write', RODC1: 'read' });
});

test('rule 5: all DCs in the domain = the domain partition, DCs without DNS too', () => {
  const s = at({ scope: 'allDCsDomain' });
  assert.deepEqual(col(s, 'corp.example'), { DC1: 'write', DC2: 'write', DC3: 'stored', RODC1: 'read' });
  assert.equal(s.partition, 'corp.example');
});

test('rule 5: custom = the DCs enlisted in the application partition, across domains', () => {
  const s = at({ scope: 'custom' });
  assert.deepEqual(col(s, 'corp.example'), { DC1: 'write', DC4: 'write' });
  assert.equal(s.partition, 'CustomDnsZones.corp.example');
  // a DC not enlisted cannot create a zone in it
  assert.deepEqual(rejected(at({ scope: 'custom', host: 'DC3', dc3Dns: true })), [['not-enlisted', 'DC3']]);
});

test('rule 5: reachOf names the column that keeps a server out', () => {
  const servers = logic.serversOf({});
  const def = { name: 'corp.example', type: 'adPrimary', scope: 'domain', host: 'DC1' };
  assert.deepEqual(logic.reachOf(servers, def, 'DC1'), []);
  assert.deepEqual(logic.reachOf(servers, def, 'DC3'), ['dns']);
  assert.deepEqual(logic.reachOf(servers, def, 'DC4'), ['domain']);
  assert.deepEqual(logic.reachOf(servers, def, 'MS1'), ['role']);
  assert.deepEqual(logic.reachOf(servers, Object.assign({}, def, { scope: 'forest' }), 'DC4'), []);
  assert.deepEqual(logic.reachOf(servers, Object.assign({}, def, { scope: 'allDCsDomain' }), 'DC3'), []);
  assert.deepEqual(logic.reachOf(servers, Object.assign({}, def, { scope: 'custom' }), 'DC2'), ['partition']);
  assert.deepEqual(logic.reachOf(servers, { name: 'corp.example', type: 'primary', scope: null, host: 'DC1' }, 'DC2'), ['host']);
});

// ── rule 6: stored, not served ──

test('rule 6: a DC without the DNS role stores the data and answers nothing; no zone is created on it', () => {
  const s = at({ scope: 'allDCsDomain' });
  const c = s.holdings.DC3['corp.example'];
  assert.equal(c.hold, 'stored');
  assert.equal(c.serial, null);
  assert.equal(logic.contentOf(c, 'corp.example').answer.kind, 'elsewhere');
  assert.deepEqual(rejected(at({ host: 'DC3' })), [['no-dns', 'DC3']]);
  assert.deepEqual(rejected(at({ type: 'primary', host: 'DC3' })), [['no-dns', 'DC3']]);
  assert.equal(at({ host: 'DC3', dc3Dns: true }).accepted, true);
});

// ── rule 7: multi-master, the RODC ──

test('rule 7: every writable DC in scope holds a writable copy; the RODC a read-only one and cannot create AD zones', () => {
  const s = at({ scope: 'forest' });
  const writable = s.servers.filter((sv) => s.holdings[sv.id]['corp.example'].hold === 'write').map((sv) => sv.id);
  assert.deepEqual(writable, ['DC1', 'DC2', 'DC4']);
  assert.equal(s.holdings.RODC1['corp.example'].hold, 'read');
  assert.equal(s.holdings.RODC1['corp.example'].via, 'ad');
  assert.deepEqual(rejected(at({ host: 'RODC1' })), [['rodc', 'RODC1']]);
  // an AD stub on the RODC is a stub (read-only like every stub)
  assert.equal(at({ zone: 'branch.corp.example', type: 'adStub', allowXfr: true }).holdings.RODC1['branch.corp.example'].hold, 'stub');
});

// ── rule 8: secure dynamic updates ──

test('rule 8: only an AD-integrated zone offers "secure only" dynamic updates', () => {
  assert.deepEqual(logic.updatesOf('adPrimary'), ['none', 'nonsecure', 'secure']);
  assert.deepEqual(logic.updatesOf('primary'), ['none', 'nonsecure']);
  for (const x of ['secondary', 'stub', 'adStub']) assert.deepEqual(logic.updatesOf(x), [], x);
});

// ── gaps found by the review's mutants ──

test('masters: only a primary is a master; MS1 copies from the zone\'s primary in force', () => {
  // a stub on DC1 is no master: MS1 copies partner.example from the partner's server
  const st = at({ zone: 'partner.example', type: 'stub', ms1Secondary: true });
  assert.equal(st.holdings.MS1['partner.example'].from, '10.20.0.53');
  assert.equal(st.ms1, 'ok');
  // a file primary of partner.example on DC4 is the master MS1 copies from (and needs allowXfr)
  const f = at({ zone: 'partner.example', type: 'primary', host: 'DC4', ms1Secondary: true });
  assert.equal(f.holdings.MS1['partner.example'].from, 'DC4');
  assert.equal(f.holdings.MS1['partner.example'].hold, 'refused');
  assert.equal(logic.masterFor([{ name: 'x', type: 'stub', host: 'DC1' }], 'x'), null);
});

test('MS1\'s secondary is added even when the student\'s definition is rejected (from the zone in force)', () => {
  const s = at({ host: 'MS1', ms1Secondary: true });
  assert.equal(s.accepted, false);
  assert.equal(s.ms1, 'refused');
  assert.equal(s.holdings.MS1['corp.example'].from, 'DC1');
  assert.equal(s.holdings.MS1['corp.example'].rejected, 'not-dc');
});

test('MS1\'s rejected extra copy marks MS1\'s cell', () => {
  const s = at({ type: 'primary', host: 'MS1', ms1Secondary: true });
  assert.equal(s.holdings.MS1['corp.example'].rejected, 'exists');
});

test('the selected zone\'s definition: the student\'s when accepted, the zone\'s primary when rejected, null for nobody', () => {
  assert.equal(at({ zone: 'partner.example', type: 'stub' }).def.type, 'stub');
  assert.equal(at({ type: 'secondary', host: 'DC4' }).def.host, 'DC4');
  assert.deepEqual(at({ host: 'MS1' }).def, logic.baseline()[0]);
  assert.equal(at({ zone: 'partner.example', type: 'adPrimary', host: 'MS1' }).def, null);
  assert.equal(at({ zone: 'partner.example', type: 'adStub', scope: 'forest' }).partition, 'ForestDnsZones.corp.example');
  assert.equal(at({ zone: 'partner.example', type: 'secondary' }).partition, null);
});

test('contents: a full copy answers, a stub shows its serial, a refused copy is not loaded (SERVFAIL)', () => {
  assert.deepEqual(logic.contentOf({ hold: 'read', serial: 128 }, 'corp.example').answer, { kind: 'answer', name: 'www.corp.example', addr: '10.0.0.80' });
  assert.equal(logic.contentOf({ hold: 'write', serial: 128 }, 'corp.example').records, 14);
  const stub = preset('stub-partner').holdings.DC1['partner.example'];
  assert.equal(stub.serial, 2026101401);
  assert.equal(logic.contentOf(stub, 'partner.example').rr[0].data, 'ns1.partner.example 2026101401');
  assert.equal(logic.contentOf({ hold: 'refused', serial: null }, 'corp.example').answer.kind, 'servfail');
  assert.equal(logic.contentOf({ hold: 'none' }, 'corp.example').answer.kind, 'elsewhere');
});

test('rule 6 before rule 2: a DC without DNS stores an AD stub even when the transfer is refused', () => {
  const s = at({ zone: 'branch.corp.example', type: 'adStub', scope: 'allDCsDomain' });
  assert.equal(s.holdings.DC3['branch.corp.example'].hold, 'stored');
  assert.equal(s.holdings.DC1['branch.corp.example'].hold, 'refused');
});

test('model-only checks: an AD zone needs a scope; an unknown host; external masters are addresses', () => {
  const servers = logic.serversOf({});
  assert.deepEqual(logic.place(servers, { name: 'corp.example', type: 'adPrimary', scope: null, host: 'DC1' }, {}).errors, [{ code: 'no-scope', server: 'DC1' }]);
  assert.deepEqual(logic.place(servers, { name: 'corp.example', type: 'primary', scope: null, host: 'DC9' }, {}).errors, [{ code: 'no-host', server: 'DC9' }]);
  for (const m of ['DC3', 'RODC1', 'MS1', null]) assert.equal(logic.external(m), false, m);
  // a file primary on RODC1 is our master: MS1's copy needs allowXfr
  assert.equal(at({ zone: 'partner.example', type: 'primary', host: 'RODC1', ms1Secondary: true }).holdings.MS1['partner.example'].hold, 'refused');
  // MS1 is not a DC: no not-enlisted on top of not-dc
  assert.deepEqual(rejected(at({ scope: 'custom', host: 'MS1' })), [['not-dc', 'MS1']]);
});

// ── the presets (SPEC §3) ──

test('preset domain-scope: DC1, DC2 writable, RODC1 read-only; DC3, DC4 nothing', () => {
  const s = preset('domain-scope');
  assert.deepEqual(col(s, 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read' });
  assert.deepEqual(s.errors, []);
});

test('preset forest-scope: DC1, DC2, DC4 writable, RODC1 read-only; DC3 nothing; _msdcs is forest-wide too', () => {
  const s = preset('forest-scope');
  assert.deepEqual(col(s, 'corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', DC4: 'write' });
  assert.deepEqual(col(s, '_msdcs.corp.example'), col(s, 'corp.example'));
});

test('preset all-dcs: DC3 stores the zone and does not serve it; DC4 nothing', () => {
  assert.deepEqual(col(preset('all-dcs'), 'corp.example'), { DC1: 'write', DC2: 'write', DC3: 'stored', RODC1: 'read' });
});

test('preset secondary-ms1: refused with transfers off; read-only at DC1\'s serial with them on', () => {
  const s = preset('secondary-ms1');
  assert.equal(s.ms1, 'refused');
  assert.deepEqual(s.holdings.MS1['corp.example'], { hold: 'refused', via: 'xfr', from: 'DC1', serial: null });
  const on = at(Object.assign({}, logic.presets.find((x) => x.id === 'secondary-ms1').params, { allowXfr: true }));
  assert.equal(on.ms1, 'ok');
  assert.deepEqual(on.holdings.MS1['corp.example'], { hold: 'read', via: 'xfr', from: 'DC1', serial: on.holdings.DC1['corp.example'].serial });
  assert.equal(on.holdings.MS1['corp.example'].serial, 128);
});

test('preset stub-partner: DC1 holds a stub with SOA, 2 NS, 2 glue A; nobody else holds partner.example', () => {
  const s = preset('stub-partner');
  assert.deepEqual(col(s, 'partner.example'), { DC1: 'stub' });
  assert.equal(logic.contentOf(s.holdings.DC1['partner.example'], 'partner.example').records, 5);
  assert.equal(s.holdings.DC1['partner.example'].from, '10.20.0.53');
});

test('preset ad-on-member: rejected, MS1 is not a DC', () => {
  const s = preset('ad-on-member');
  assert.equal(s.accepted, false);
  assert.deepEqual(rejected(s), [['not-dc', 'MS1']]);
});

test('the baseline: what DC promotion leaves, partner.example held by nobody', () => {
  const s = at({});
  assert.deepEqual(col(s, 'branch.corp.example'), { DC4: 'write' });
  assert.deepEqual(col(s, 'partner.example'), {});
  assert.deepEqual(col(s, '_msdcs.corp.example'), { DC1: 'write', DC2: 'write', RODC1: 'read', DC4: 'write' });
  assert.equal(logic.masterFor(logic.baseline(), 'partner.example'), '10.20.0.53');
  assert.equal(logic.masterFor(logic.baseline(), 'corp.example'), 'DC1');
});

test('presets: every preset sets every param to a valid value, ids are unique', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.deepEqual(ids, ['domain-scope', 'forest-scope', 'all-dcs', 'secondary-ms1', 'stub-partner', 'ad-on-member']);
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    assert.ok(logic.CHOICES.includes(x.params.zone) && logic.TYPES.includes(x.params.type) && logic.SCOPES.includes(x.params.scope) && logic.HOSTS.includes(x.params.host), x.id);
  }
});

test('changed cells: the cells whose holding differs from the previous state', () => {
  assert.deepEqual(logic.changedCells(preset('domain-scope'), preset('forest-scope')), [['DC4', 'corp.example']]);
  assert.deepEqual(logic.changedCells(preset('domain-scope'), preset('ad-on-member')), [['MS1', 'corp.example']]);
  assert.deepEqual(logic.changedCells(null, preset('domain-scope')), []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every combination of params', () => {
  let n = 0;
  for (const zone of logic.CHOICES) for (const type of logic.TYPES) for (const scope of logic.SCOPES) for (const host of logic.HOSTS) {
    for (const flags of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const s = at({ zone, type, scope, host, dc3Dns: !!(flags & 1), ms1Secondary: !!(flags & 2), allowXfr: !!(flags & 4) });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      // every server × zone has a cell, every rejection names a server and a zone of the table
      for (const sv of s.servers) for (const z of logic.ZONES) assert.ok(s.holdings[sv.id][z].hold);
      for (const e of s.errors) assert.ok(s.holdings[e.server][e.zone]);
      n++;
    }
  }
  assert.equal(n, 3 * 5 * 4 * 5 * 8);
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ zone: 'branch.corp.example', type: 'adStub', ms1Secondary: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  const base = logic.baseline(), bc = structuredClone(base);
  logic.holdingsOf(logic.serversOf(p), base, { name: 'corp.example', type: 'secondary', scope: null, host: 'DC4', master: null }, { allowXfr: true });
  assert.deepEqual(base, bc);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page: an explorer, its meta matches sim.json, it takes the presets from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(json.class, 'explorer');
  assert.deepEqual(meta.title, json.title);
  assert.deepEqual(meta.concept, json.concept);
  assert.ok(!('steps' in logic));
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const k of Object.keys(logic.defaults)) assert.match(html, new RegExp(`key: '${k}'`), `param ${k} is on the page`);
});
