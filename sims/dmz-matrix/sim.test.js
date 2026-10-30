// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dmz-matrix's model (rules in SPEC.md). Run: node --test sims/dmz-matrix/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.evaluate(P(over));
const byId = (s, id) => s.tests.find((x) => x.id === id);
const preset = (id) => P(logic.presets.find((p) => p.id === id).params);
/** Params with one cell's service (or reply entry) toggled. */
const flip = (p, cell, service, reply) => Object.assign({}, p, { [logic.param[cell]]: logic.toggle(p[logic.param[cell]], service, reply) });
/** Params with every cell empty. */
const EMPTY = Object.fromEntries(logic.cells.map((c) => [logic.param[c], 0]));
const okIds = (s) => s.tests.filter((x) => x.ok).map((x) => x.id);

// ── tie-breaks first ──

test('tie-break: a test inside one zone never crosses the firewall, whatever the cells and the mode', () => {
  for (const over of [{}, EMPTY, Object.assign({ stateful: false }, EMPTY), { stateful: false }]) {
    const t9 = byId(S(over), 't9');
    assert.equal(t9.from, 'lan');
    assert.equal(t9.to, 'lan');
    assert.deepEqual([t9.result, t9.reason, t9.reply, t9.ok], ['pass', 'same-zone', { result: 'pass', reason: 'same-zone' }, true]);
  }
  const a5 = byId(S(Object.assign({ compromised: true }, EMPTY)), 'a5');
  assert.deepEqual([a5.from, a5.to, a5.reason, a5.ok], ['dmz', 'dmz', 'same-zone', true]);
  assert.deepEqual(logic.cells.filter((c) => c.split('>')[0] === c.split('>')[1]), [], 'no diagonal cell');
});

test('tie-break: any covers every service, also one whose own chip is off', () => {
  const p = P(Object.assign({}, EMPTY, { [logic.param['dmz>lan']]: logic.mask(['any']) }));
  const s = logic.evaluate(p);
  assert.equal(byId(s, 't8').reason, 'cell-allow');
  assert.equal(logic.lookup(s.cells, 'dmz', 'lan', 'udp/161'), true);
  assert.equal(logic.lookup(s.cells, 'lan', 'dmz', 'udp/161'), false, 'only that cell');
});

test('tie-break: stateless, any in the reverse cell covers every reply', () => {
  const p = flip(P({ stateful: false }), 'inet>lan', 'any');
  const t6 = byId(logic.evaluate(p), 't6');
  assert.deepEqual(t6.reply, { result: 'pass', reason: 'cell-allow' });
});

test('tie-break: stateful ignores reply entries; the state table decides the reply first', () => {
  const p = flip(P({}), 'inet>lan', 'tcp/443', true);
  assert.deepEqual(byId(logic.evaluate(p), 't6').reply, { result: 'pass', reason: 'reply-of-tracked' });
  assert.deepEqual(byId(S({}), 't6').reply, { result: 'pass', reason: 'reply-of-tracked' });
});

test('tie-break: a dropped request has no reply, in both modes', () => {
  for (const stateful of [true, false]) {
    const t2 = byId(S({ stateful }), 't2');
    assert.deepEqual([t2.result, t2.reason, t2.reply, t2.ok], ['drop', 'default-deny', null, false]);
  }
});

test('tie-break: a reply entry never allows a request', () => {
  // ↩ tcp/445 in internet → LAN: still no way for the visitor to open tcp/445 there
  const p = flip(P({ stateful: false }), 'inet>lan', 'tcp/445', true);
  assert.deepEqual(logic.evaluate(p).replies['inet>lan'], ['tcp/445']);
  assert.equal(byId(logic.evaluate(p), 't2').reason, 'default-deny');
  assert.equal(logic.toggle(0, 'any', true), 0, 'no reply entry for any');
});

// ── rules ──

test('rule 1: every test between zones is judged by its cell, DMZ ↔ LAN included', () => {
  // with every cell empty, every cross-zone test is dropped: there is no path but a cell
  const s = logic.evaluate(EMPTY);
  for (const x of s.tests) {
    if (x.from === x.to) continue;
    assert.equal(x.reason, 'default-deny', x.id);
  }
  // the DMZ → LAN cell decides t8, and only it
  const opened = logic.evaluate(flip(P(EMPTY), 'dmz>lan', 'tcp/5432'));
  assert.equal(byId(opened, 't8').reason, 'cell-allow');
  assert.deepEqual(okIds(opened), ['t8', 't9']);
});

test('rule 2: lookup is one cell, a set: order does not matter', () => {
  const cells = { 'inet>dmz': ['tcp/25', 'tcp/443'] };
  const swapped = { 'inet>dmz': ['tcp/443', 'tcp/25'] };
  for (const svc of logic.services) {
    assert.equal(logic.lookup(cells, 'inet', 'dmz', svc), logic.lookup(swapped, 'inet', 'dmz', svc), svc);
  }
  assert.equal(logic.lookup(cells, 'inet', 'dmz', 'tcp/443'), true);
  assert.equal(logic.lookup(cells, 'inet', 'lan', 'tcp/443'), false, 'another cell is not read');
  assert.equal(logic.lookup(cells, 'dmz', 'inet', 'tcp/443'), false, 'the reverse cell is not read');
  // the number's bit order is the chip order; mask and unmask agree
  const m = logic.mask(['udp/53', 'tcp/443'], ['tcp/25']);
  assert.deepEqual(logic.unmask(m), { services: ['tcp/443', 'udp/53'], replies: ['tcp/25'] });
});

test('rule 3: deny by default, in both directions', () => {
  const s = S({});
  assert.equal(byId(s, 't2').reason, 'default-deny', 'internet → LAN');
  assert.equal(byId(s, 't8').reason, 'default-deny', 'DMZ → LAN');
  const a6 = byId(S({ compromised: true }), 'a6');
  assert.equal(a6.reason, 'default-deny', 'outbound, DMZ → internet');
  // taking a service out drops it
  const p = flip(P({}), 'lan>inet', 'tcp/443');
  assert.equal(byId(logic.evaluate(p), 't6').reason, 'default-deny');
});

test('rule 4: stateful passes the reply by state; stateless needs a reply entry in the reverse cell', () => {
  assert.deepEqual(byId(S({}), 't6').reply, { result: 'pass', reason: 'reply-of-tracked' });
  const sl = P({ stateful: false });
  const t6 = byId(logic.evaluate(sl), 't6');
  assert.deepEqual([t6.result, t6.reply, t6.ok], ['pass', { result: 'drop', reason: 'no-rule-for-reply' }, false]);
  // a service chip tcp/443 in internet → LAN is not a reply entry
  assert.equal(byId(logic.evaluate(flip(sl, 'inet>lan', 'tcp/443')), 't6').reply.reason, 'no-rule-for-reply');
  // the reply entry ↩ tcp/443 is
  const fixed = logic.evaluate(flip(sl, 'inet>lan', 'tcp/443', true));
  assert.deepEqual(byId(fixed, 't6').reply, { result: 'pass', reason: 'cell-allow' });
  assert.deepEqual(okIds(fixed), ['t6', 't9']);
  // in the reverse cell of its own pair only: ↩ tcp/443 in internet → LAN does not help t1 (DMZ → internet)
  assert.equal(byId(fixed, 't1').reply.reason, 'no-rule-for-reply');
  assert.equal(byId(logic.evaluate(flip(sl, 'dmz>inet', 'tcp/443', true)), 't1').ok, true);
});

test('rule 5: a compromised DMZ web server reaches the LAN only through the DMZ → LAN cell', () => {
  const s = S({ compromised: true });
  assert.equal(s.compromised, 'dmz-web');
  assert.deepEqual(s.tests.map((x) => x.id), ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']);
  for (const x of s.tests) assert.equal(x.src, logic.attacker, x.id);
  assert.deepEqual(okIds(s), ['a5']);
  const db = logic.evaluate(flip(P({ compromised: true }), 'dmz>lan', 'tcp/5432'));
  assert.deepEqual(okIds(db), ['a3', 'a5']);
  const any = logic.evaluate(flip(P({ compromised: true }), 'dmz>lan', 'any'));
  assert.deepEqual(okIds(any), ['a1', 'a2', 'a3', 'a4', 'a5']);
  assert.equal(S({}).compromised, null);
});

test('rule 6: no NAT: every host keeps its address, and the matrix has six cells and no other row', () => {
  assert.deepEqual(logic.cells, ['inet>dmz', 'inet>lan', 'dmz>inet', 'dmz>lan', 'lan>inet', 'lan>dmz']);
  assert.deepEqual(Object.keys(S({}).cells), logic.cells);
  assert.deepEqual(logic.zones, ['inet', 'dmz', 'lan']);
  assert.equal(logic.hosts.web.ip, '203.0.113.10');
  assert.equal(logic.hosts.client.ip, '192.168.1.10');
});

// ── presets and their numbers (SPEC.md table) ──

test('presets: the numbers of SPEC.md', () => {
  const row = (id) => { const s = logic.evaluate(preset(id)); return [okIds(s), logic.tally(s)]; };
  let [ok, n] = row('book');
  assert.deepEqual(ok, ['t1', 't6', 't7', 't9']);
  assert.deepEqual(n, { total: 9, ok: 4, denied: 5, noReply: 0, sameZone: 1 });
  [ok, n] = row('stateless');
  assert.deepEqual(ok, ['t9']);
  assert.deepEqual(n, { total: 9, ok: 1, denied: 5, noReply: 3, sameZone: 1 });
  [ok, n] = row('web-compromised');
  assert.deepEqual(ok, ['a5']);
  assert.deepEqual(n, { total: 6, ok: 1, denied: 5, noReply: 0, sameZone: 1 });
  [ok, n] = row('any-any');
  assert.deepEqual(ok, ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't9']);
  assert.equal(n.denied, 1);
  [ok, n] = row('rdp-forward');
  assert.deepEqual(ok, ['t1', 't3', 't4', 't6', 't7', 't9']);
  assert.equal(n.denied, 3);
});

test('presets: the book\'s matrix is the default, and any-any keeps it', () => {
  const s = S({});
  assert.deepEqual(s.cells, { 'inet>dmz': ['tcp/443', 'tcp/25'], 'inet>lan': [], 'dmz>inet': [], 'dmz>lan': [], 'lan>inet': ['tcp/443', 'udp/53'], 'lan>dmz': ['tcp/22'] });
  assert.equal(s.stateful, true);
  const aa = logic.evaluate(preset('any-any')).cells;
  assert.deepEqual(aa['inet>lan'], ['udp/161', 'any']);
  assert.deepEqual(aa['inet>dmz'], ['tcp/443', 'tcp/25', 'udp/161']);
  assert.deepEqual(aa['lan>inet'], ['tcp/443', 'udp/53']);
});

test('tables: the tests, the attacker\'s tests and every preset\'s cells are those of SPEC.md', () => {
  const row = (x) => [x.id, x.src, x.dst, x.service].join(' ');
  assert.deepEqual(logic.tests.map(row), [
    't1 visitor web tcp/443', 't2 visitor files tcp/445', 't3 visitor client tcp/3389', 't4 visitor files tcp/3389',
    't5 visitor web udp/161', 't6 client extWeb tcp/443', 't7 client web tcp/22', 't8 web db tcp/5432', 't9 client files tcp/445']);
  assert.deepEqual(logic.attacks.map(row), [
    'a1 web files tcp/445', 'a2 web client tcp/3389', 'a3 web db tcp/5432', 'a4 web client tcp/22', 'a5 web mail tcp/25', 'a6 web extWeb tcp/443']);
  const cells = (id) => { const c = logic.cellsOf(preset(id)); return [c.cells, c.replies]; };
  const none = { 'inet>dmz': [], 'inet>lan': [], 'dmz>inet': [], 'dmz>lan': [], 'lan>inet': [], 'lan>dmz': [] };
  const book = { 'inet>dmz': ['tcp/443', 'tcp/25'], 'inet>lan': [], 'dmz>inet': [], 'dmz>lan': [], 'lan>inet': ['tcp/443', 'udp/53'], 'lan>dmz': ['tcp/22'] };
  for (const id of ['book', 'stateless', 'web-compromised']) assert.deepEqual(cells(id), [book, none], id);
  assert.deepEqual(cells('any-any'), [Object.assign({}, book, { 'inet>dmz': ['tcp/443', 'tcp/25', 'udp/161'], 'inet>lan': ['udp/161', 'any'], 'dmz>lan': ['udp/161'] }), none]);
  assert.deepEqual(cells('rdp-forward'), [Object.assign({}, book, { 'inet>lan': ['tcp/3389'] }), none]);
  assert.deepEqual([preset('stateless').stateful, preset('web-compromised').compromised, preset('book').stateful, preset('book').compromised], [false, true, true, false]);
});

test('changed: the tests whose verdict differs, none across a switch of the test list', () => {
  const a = S({ stateful: false });
  const b = logic.evaluate(flip(P({ stateful: false }), 'inet>lan', 'tcp/443', true));
  assert.deepEqual(logic.changed(a, b), ['t6']);
  assert.deepEqual(logic.changed(S({}), S({ stateful: false })), ['t1', 't6', 't7']);
  assert.deepEqual(logic.changed(S({}), S({ compromised: true })), []);
  assert.deepEqual(logic.changed(null, S({})), []);
});

test('params: cell numbers stay in range; bits past the last reply entry are ignored', () => {
  assert.equal(logic.maxCell, Math.pow(2, 19) - 1);
  for (const p of logic.presets) {
    const q = P(p.params);
    for (const c of logic.cells) assert.ok(Number.isInteger(q[logic.param[c]]) && q[logic.param[c]] >= 0 && q[logic.param[c]] <= logic.maxCell, `${p.id} ${c}`);
  }
  assert.deepEqual(logic.unmask(Math.pow(2, 19) | 1), { services: ['tcp/443'], replies: [] });
  assert.equal(logic.toggle(logic.toggle(5, 'tcp/22'), 'tcp/22'), 5);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ stateful: false, compromised: true, dmzLan: logic.mask(['any'], ['tcp/22']) });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; every zone, host, reason has its words', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const z of logic.zones) assert.ok(strings[lang]['zone_' + z], `${lang} zone ${z}`);
    for (const host of Object.keys(logic.hosts)) assert.ok(strings[lang]['host_' + host], `${lang} host ${host}`);
    for (const r of ['cell-allow', 'default-deny', 'same-zone']) assert.ok(strings[lang]['why_' + r], `${lang} ${r}`);
    for (const r of ['reply-of-tracked', 'cell-allow', 'no-rule-for-reply']) assert.ok(strings[lang]['reply_' + r], `${lang} reply ${r}`);
  }
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
