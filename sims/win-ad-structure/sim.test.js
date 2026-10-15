// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ad-structure. Run: node --test sims/win-ad-structure/sim.test.js
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected results, then the generic block.
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
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const home = { ana: 'q-users', pc07: 'q-computers', gprojects: 'q-users' };

// ── tie-breaks first ──

test('tie-break: refusal reasons are checked in order unknown → site → not-container → other-domain', () => {
  assert.equal(logic.tryPlace(home, 'nobody', 'q-hq').reason, 'unknown');
  assert.equal(logic.tryPlace(home, 'ana', 'nowhere').reason, 'unknown');
  assert.equal(logic.tryPlace(home, 'nobody', 'branch').reason, 'unknown', 'an unknown object beats site');
  assert.equal(logic.tryPlace(home, 'nobody', 'q').reason, 'unknown');
  assert.equal(logic.tryPlace(home, 'ana', 'branch').reason, 'site', 'a site is refused as a site, not as "not a container"');
  assert.equal(logic.tryPlace(home, 'ana', 'brk').reason, 'not-container', 'another domain\'s head: not-container comes before other-domain');
  assert.equal(logic.tryPlace(home, 'ana', 'brkdc01').reason, 'not-container');
  assert.equal(logic.tryPlace(home, 'ana', 'thf-users').reason, 'other-domain');
});

test('tie-break: placing an object where it already is succeeds with same; a refusal leaves the placement as it was', () => {
  const r = logic.tryPlace(home, 'ana', 'q-users');
  assert.deepEqual([r.ok, r.same], [true, true]);
  const moved = Object.assign({}, home, { ana: 'q-hq' });
  assert.equal(logic.tryPlace(moved, 'ana', 'q-hq').same, true, 'same compares with the current placement');
  assert.equal(logic.tryPlace(moved, 'ana', 'q-users').same, false, 'not with the default container');
  const bad = logic.tryPlace(home, 'ana', 'brk-users');
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.placed, home);
});

test('tie-break: GPO order is the domain (link order of gpos.txt), then each OU top-down; no site on the path', () => {
  assert.deepEqual(logic.gposInScope('q-ws').map((g) => g.gpo),
    ['Default Domain Policy', 'Local Admins - Interactive', 'Drive Maps', 'Windows Update - Defer', 'Chirp Autostart']);
  assert.deepEqual(logic.gposInScope('q-ws').map((g) => g.at), ['q', 'q', 'q', 'q', 'q-ws']);
  for (const site of logic.SITES) assert.deepEqual(logic.gpoLinks(site.id), [], `no GPO linked to ${site.id}`);
});

test('trust path: through the forest root; the trusts form a tree, so the path is unique', () => {
  assert.deepEqual(logic.trustPath('brk', 'thf'), ['brk', 'q', 'thf']);
  assert.deepEqual(logic.trustPath('thf', 'brk'), ['thf', 'q', 'brk']);
  assert.deepEqual(logic.trustPath('q', 'q'), ['q']);
  assert.equal(logic.trustPath('q', 'nowhere'), null);
});

// ── rule 1: the forest is the security boundary ──

test('rule 1: Enterprise Admins reach every domain; Domain Admins only their own; the boundary is the forest', () => {
  assert.equal(logic.securityBoundary(), 'forest');
  assert.notEqual(logic.kindOf(logic.securityBoundary()), 'domain');
  assert.deepEqual(logic.reach('enterprise-admins'), ['q', 'brk', 'thf']);
  assert.deepEqual(logic.reach('domain-admins:brk'), ['brk']);
  assert.deepEqual(logic.reach('domain-admins:q'), ['q']);
  assert.deepEqual(logic.reach('schema-admins'), []);
  assert.deepEqual(logic.reach('domain-admins:nowhere'), []);
});

test('rule 1: all domains share one schema and one configuration (every DC holds them)', () => {
  for (const p of ['schema', 'config']) {
    assert.deepEqual(logic.replicas(p).map((r) => r.dc), logic.DCS.map((d) => d.id), p);
    assert.ok(logic.replicas(p).every((r) => r.copy === 'full'), p);
    assert.deepEqual(logic.replicas(p).map((r) => r.readOnly), [false, true, false, false], `${p}: read-only on the RODC`);
  }
});

// ── rule 2: replication ──

test('rule 2: a domain partition: full on its own DCs, partial on the GCs of other domains, nowhere else', () => {
  const brk = logic.replicas('domain:brk');
  assert.deepEqual(brk, [
    { dc: 'dc01', copy: 'partial', readOnly: true },
    { dc: 'brkdc01', copy: 'full', readOnly: false },
    { dc: 'thfdc01', copy: 'partial', readOnly: true }
  ]);
  assert.ok(!brk.some((r) => r.dc === 'rodc01'), 'RODC01 is not a GC, so it holds nothing of brk');
  assert.deepEqual(logic.replicas('domain:q'), [
    { dc: 'dc01', copy: 'full', readOnly: false },
    { dc: 'rodc01', copy: 'full', readOnly: true },
    { dc: 'brkdc01', copy: 'partial', readOnly: true },
    { dc: 'thfdc01', copy: 'partial', readOnly: true }
  ]);
  assert.deepEqual(logic.replicas('domain:nowhere'), []);
});

test('rule 2: what each DC holds; one password policy per domain, from its own Default Domain Policy', () => {
  assert.deepEqual(logic.partitionsOn('rodc01').map((p) => p.partition), ['schema', 'config', 'domain:q']);
  assert.deepEqual(logic.partitionsOn('thfdc01').map((p) => p.partition + ':' + p.copy),
    ['schema:full', 'config:full', 'domain:q:partial', 'domain:brk:partial', 'domain:thf:full']);
  for (const d of logic.DOMAINS) {
    assert.deepEqual(logic.passwordPolicy(d.id), { domain: d.id, gpo: 'Default Domain Policy' });
    assert.ok(d.gpos.includes('Default Domain Policy'), d.id);
  }
  assert.equal(logic.passwordPolicy('nowhere'), null);
});

// ── rule 3: trees and trusts ──

test('rule 3: a tree is a contiguous namespace; brk is a child of quillmoor, thornfell a new tree', () => {
  assert.equal(logic.isContiguous('brk.quillmoor.example', 'quillmoor.example'), true);
  assert.equal(logic.isContiguous('thornfell.example', 'quillmoor.example'), false);
  assert.equal(logic.isContiguous('a.brk.quillmoor.example', 'quillmoor.example'), false, 'a grandchild is not a direct child');
  assert.equal(logic.isContiguous('xquillmoor.example', 'quillmoor.example'), false, 'the label boundary matters');
  assert.equal(logic.isContiguous('brkxquillmoor.example', 'quillmoor.example'), false, 'label boundary, long prefix');
  assert.equal(logic.isContiguous('.quillmoor.example', 'quillmoor.example'), false, 'empty label');
  assert.equal(logic.isContiguous('quillmoor.example', 'quillmoor.example'), false, 'a domain is not its own child');
  for (const d of logic.DOMAINS) if (d.parent) assert.ok(logic.isContiguous(d.name, logic.node(d.parent).name), d.id);
  assert.deepEqual(logic.trees().map((x) => [x.id, x.domains]), [['tree-q', ['q', 'brk']], ['tree-thf', ['thf']]]);
});

test('rule 3: parent–child and tree-root trusts come automatically, two-way and transitive', () => {
  assert.deepEqual(logic.trusts(), [
    { a: 'q', b: 'brk', kind: 'parent-child', twoWay: true, transitive: true },
    { a: 'q', b: 'thf', kind: 'tree-root', twoWay: true, transitive: true }
  ]);
});

// ── rule 4: an OU is not a security principal ──

test('rule 4: OUs and containers carry no SID; users, computers and groups do', () => {
  for (const c of logic.CONTAINERS) assert.equal(logic.isPrincipal(c.id), false, c.id);
  for (const o of logic.OBJECTS) assert.equal(logic.isPrincipal(o.id), true, o.id);
  for (const x of logic.DCS) assert.equal(logic.isPrincipal(x.id), true, `${x.id}: a DC is a computer account`);
  assert.equal(logic.isPrincipal('q'), false);
  assert.equal(logic.isPrincipal('forest'), false);
  assert.equal(logic.isPrincipal('hq'), false);
});

test('rule 4: an OU lives inside one domain and can carry GPO links', () => {
  for (const c of logic.CONTAINERS.filter((x) => x.kind === 'ou')) {
    assert.equal(logic.canLinkGpo(c.id), true, c.id);
    assert.equal(logic.pathOf(c.id)[0], c.domain, c.id);
  }
});

// ── rule 5: CN= containers take no GPO link ──

test('rule 5: GPOs link to site, domain and OU only; never to CN=Users / CN=Computers, the forest or a tree', () => {
  for (const c of logic.CONTAINERS.filter((x) => x.kind === 'container')) assert.equal(logic.canLinkGpo(c.id), false, c.id);
  for (const id of ['hq', 'branch', 'q', 'brk', 'thf']) assert.equal(logic.canLinkGpo(id), true, id);
  for (const id of ['forest', 'tree-q', 'tree-thf', 'dc01', 'ana']) assert.equal(logic.canLinkGpo(id), false, id);
});

test('rule 5: an object in CN=Users gets only the domain-linked GPOs; in an OU also the OU links above it', () => {
  const domainOnly = ['Default Domain Policy', 'Local Admins - Interactive', 'Drive Maps', 'Windows Update - Defer'];
  assert.deepEqual(logic.gposInScope('q-users').map((g) => g.gpo), domainOnly);
  assert.deepEqual(logic.gposInScope('q-computers').map((g) => g.gpo), domainOnly);
  assert.deepEqual(logic.gposInScope('q-servers').map((g) => g.gpo), domainOnly.concat('Firewall Off'));
  assert.deepEqual(logic.gposInScope('q-hq').map((g) => g.gpo), domainOnly, 'no GPO is linked to Quillmoor, Staff or HQ');
  assert.deepEqual(logic.gposInScope('brk-users').map((g) => g.gpo), ['Default Domain Policy']);
  assert.deepEqual(at({ pc07: 'q-ws' }).gpos.pc07.map((g) => g.gpo), domainOnly.concat('Chirp Autostart'));
});

test('rule 5: GPOs apply to users and computers only; a group receives none wherever it sits', () => {
  assert.deepEqual(logic.OBJECTS.map((o) => logic.receivesGpo(o.id)), [true, true, false]);
  assert.equal(logic.receivesGpo('q-hq'), false);
  assert.deepEqual(at({}).gpos.gprojects, []);
  assert.deepEqual(at({ gprojects: 'q-ws' }).gpos.gprojects, []);
  assert.equal(at({ ana: 'q-ws' }).gpos.ana.length, 5);
});

test('rule 5: the estate counts are kept (155 users in CN=Users)', () => {
  const c = (id) => logic.node(id);
  assert.equal(c('q-users').users, 155);
  assert.equal(c('q-computers').computers, 159);
  assert.deepEqual([c('q-hq').users, c('q-brack').users, c('q-ws').computers, c('q-servers').computers], [21, 44, 35, 5]);
});

// ── rule 6: one parent ──

test('rule 6: every object sits in exactly one container; the DN has that one parent', () => {
  const s = at({});
  for (const o of logic.OBJECTS) {
    const inside = logic.CONTAINERS.filter((c) => logic.objectsIn(s.placed, c.id).includes(o.id));
    assert.equal(inside.length, 1, o.id);
  }
  assert.equal(s.dn.ana, 'CN=ana,CN=Users,DC=quillmoor,DC=example');
  assert.equal(at({ ana: 'q-hq' }).dn.ana, 'CN=ana,OU=HQ,OU=Staff,OU=Quillmoor,DC=quillmoor,DC=example');
  assert.equal(at({ pc07: 'q-ws' }).dn.pc07, 'CN=PC07,OU=Workstations,OU=Quillmoor,DC=quillmoor,DC=example');
});

test('rule 6: moving within the domain works; to another domain it is refused as a migration', () => {
  const r = logic.tryPlace(home, 'ana', 'q-hq');
  assert.deepEqual([r.ok, r.same, r.placed.ana], [true, false, 'q-hq']);
  assert.equal(home.ana, 'q-users', 'tryPlace does not mutate its input');
  for (const target of ['brk-users', 'brk-computers', 'thf-users', 'thf-computers']) {
    for (const o of logic.OBJECTS) assert.equal(logic.tryPlace(home, o.id, target).reason, 'other-domain', `${o.id} → ${target}`);
  }
});

test('default containers: users and groups in CN=Users, computers in CN=Computers', () => {
  assert.deepEqual(logic.OBJECTS.map((o) => o.home), ['q-users', 'q-computers', 'q-users']);
  for (const o of logic.OBJECTS) assert.equal(logic.defaults[o.id], o.home, o.id);
  assert.equal(at({ gprojects: 'brk-users' }).placed.gprojects, 'q-users');
});

test('rule 6: a placement param naming another domain or an unknown box falls back to the default container', () => {
  assert.equal(at({ ana: 'brk-users' }).placed.ana, 'q-users');
  assert.equal(at({ pc07: 'nowhere' }).placed.pc07, 'q-computers');
  assert.equal(at({ gprojects: 'q-ws' }).placed.gprojects, 'q-ws');
});

test('rule 6: the last attempt: a refusal is reported, a matching move is reported, a stale move is ignored', () => {
  assert.deepEqual(at({ last: 'ana>thf-users' }).attempt, { obj: 'ana', target: 'thf-users', ok: false, reason: 'other-domain' });
  assert.deepEqual(at({ ana: 'q-hq', last: 'ana>q-hq' }).attempt, { obj: 'ana', target: 'q-hq', ok: true, reason: null });
  assert.equal(at({ last: 'ana>q-hq' }).attempt, null, 'says moved, but ana is still in CN=Users');
  assert.equal(at({ last: 'nobody>q-hq' }).attempt, null);
  assert.equal(at({ last: 'garbage' }).attempt, null);
});

// ── rule 7: sites are independent of domains ──

test('rule 7: one site holds DCs of several domains, one domain spans several sites; objects never go in a site', () => {
  assert.deepEqual(logic.domainsInSite('hq'), ['q', 'thf']);
  assert.deepEqual(logic.domainsInSite('branch'), ['q', 'brk']);
  assert.deepEqual(logic.sitesOfDomain('q'), ['hq', 'branch']);
  assert.deepEqual(logic.sitesOfDomain('brk'), ['branch']);
  for (const site of logic.SITES) for (const o of logic.OBJECTS) assert.equal(logic.tryPlace(home, o.id, site.id).reason, 'site');
  for (const d of logic.DOMAINS) assert.ok(logic.DCS.some((x) => x.domain === d.id), `${d.id} has a DC`);
});

// ── lenses and presets ──

test('lenses: security lights the forest; replication the forest and each domain; policy 11 lit, 6 grey', () => {
  assert.deepEqual(logic.lensOf('security'), { mode: 'security', nodes: ['forest'], grey: [] });
  assert.deepEqual(logic.lensOf('replication').nodes, ['forest', 'q', 'brk', 'thf']);
  const pol = logic.lensOf('policy');
  assert.equal(pol.nodes.length, 11);
  assert.deepEqual(pol.grey, ['q-users', 'q-computers', 'brk-users', 'brk-computers', 'thf-users', 'thf-computers']);
  assert.deepEqual(logic.lensOf('none'), { mode: 'none', nodes: [], grey: [] });
  assert.deepEqual(logic.lensOf('bogus'), { mode: 'none', nodes: [], grey: [] });
});

test('presets: the expected results of SPEC §4', () => {
  const sec = preset('security');
  assert.deepEqual([sec.lens, sec.selected, sec.lit.nodes], ['security', 'forest', ['forest']]);
  const rep = preset('replication');
  assert.deepEqual([rep.lens, rep.selected], ['replication', 'forest']);
  const pol = preset('policy');
  assert.deepEqual([pol.lens, pol.selected], ['policy', 'q-users']);
  assert.ok(pol.lit.grey.includes('q-users'));
  const asis = preset('quillmoor-as-is');
  assert.deepEqual([asis.selected, asis.placed.ana], ['ana', 'q-users']);
  assert.deepEqual(asis.gpos.ana.map((g) => g.gpo), ['Default Domain Policy', 'Local Admins - Interactive', 'Drive Maps', 'Windows Update - Defer']);
  assert.ok(asis.gpos.ana.every((g) => g.at === 'q'), 'only domain-linked');
});

test('state guards: unknown selection, held object and lens fall back', () => {
  const s = at({ sel: 'nowhere', held: 'nobody', lens: 'bogus' });
  assert.deepEqual([s.selected, s.held, s.lens], [null, null, 'none']);
  assert.equal(at({ held: 'pc07' }).held, 'pc07');
});

test('every box id is unique and resolves to a node', () => {
  const ids = logic.allIds();
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(logic.node(id), id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and many param sets', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const lens of logic.LENSES) for (const sel of logic.allIds()) {
    const s = at({ lens, sel, held: 'ana', last: 'pc07>' + sel });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ lens: 'policy', ana: 'q-hq', last: 'ana>q-hq' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});

test('every refusal reason and kind has a string in both languages', () => {
  for (const k of ['cap_other', 'cap_site', 'cap_notContainer', 'cap_unknown', 'capGroup', 'fObjNoGpo', 'hUser', 'hComputer', 'hGroup', 'kForest', 'kTree', 'kDomain', 'kOu', 'kContainer', 'kSite', 'kDc', 'kUser', 'kComputer', 'kGroup']) {
    assert.ok(strings.hr[k] && strings.en[k], k);
  }
});
