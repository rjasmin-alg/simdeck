// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dhcp-scope-options. Run: node --test sims/win-dhcp-scope-options/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected numbers, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const RT = require('../../kit/ruletable.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const eff = (s, code) => s.effective.find((e) => e.code === code);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);

// ── tie-breaks first ──

test('tie-break: a reserved address is never handed to another client, even when it is the lowest free', () => {
  // Shrink the pool so the reservation is the lowest candidate: exclusion 10–30 on, laptop and phone already have 31, 32.
  const cfg = logic.config(P({}));
  cfg.scope.exclusions = [['10.0.10.10', '10.0.10.39']];
  assert.equal(logic.lowestFree(cfg, []), '10.0.10.41');
  assert.deepEqual(logic.leasesOf(cfg).map((l) => l.ip), ['10.0.10.41', '10.0.10.42']);
});

test('tie-break: per option, not per level — one client gets options from several levels at once', () => {
  const s = at({ scope006: false });
  assert.equal(eff(s, '003').level, 'scope');
  assert.equal(eff(s, '006').level, 'server');
  assert.equal(eff(s, '015').level, 'server');
  assert.equal(eff(s, '051').level, 'scope');
});

test('tie-break: levels have distinct ranks in the documented order; the kit view picks the same winner', () => {
  assert.deepEqual(logic.LEVELS.map((l) => l.id), ['server', 'serverClass', 'scope', 'scopeClass', 'reservation']);
  const ranks = logic.LEVELS.map((l) => l.rank);
  assert.deepEqual(ranks, ranks.slice().sort((a, b) => a - b));
  assert.equal(new Set(ranks).size, ranks.length);
  // K4 in most-specific mode over the same ladder agrees with the model for every option and client.
  for (const client of ['laptop', 'printer', 'phone']) {
    const s = at({ client, scope006: true, resOption003: true, classNtp: true });
    for (const code of logic.CODES) {
      const rows = s.ladders[code];
      const ev = RT.evaluate('specific', rows.map((r) => ({ hit: r.hit, rank: r.rank })), 'all', true);
      const winner = eff(s, code).level;
      const kitWin = ev.win.length ? rows[ev.win[0]].level : null;
      assert.equal(ev.implicit, winner === null ? 'win' : 'skip');
      assert.equal(kitWin, winner, `${client} ${code}`);
    }
  }
});

// ── rule 1: address ──

test('rule 1: a reservation gets its reserved address; others the lowest free, in lease order', () => {
  assert.equal(at({ client: 'printer' }).offer, '10.0.10.40');
  assert.equal(at({ client: 'laptop' }).offer, '10.0.10.31');
  assert.equal(at({ client: 'phone' }).offer, '10.0.10.32');
  assert.equal(at({}).nextFree, '10.0.10.33');
  const off = P({ exclusion: false });
  const s = at({ exclusion: false, held: logic.maskOf(off) });
  assert.equal(s.offer, '10.0.10.10');
  assert.equal(at({ client: 'phone', exclusion: false, held: logic.maskOf(off) }).offer, '10.0.10.11');
  assert.equal(at({ client: 'printer', exclusion: false, held: 0 }).offer, '10.0.10.40');
});

test('rule 1: the reserved address is not in the dynamic pool', () => {
  const cfg = logic.config(P({}));
  const taken = [];
  for (let i = 0; i < 9; i++) taken.push(logic.lowestFree(cfg, taken));
  assert.deepEqual(taken, ['10.0.10.31', '10.0.10.32', '10.0.10.33', '10.0.10.34', '10.0.10.35', '10.0.10.36', '10.0.10.37', '10.0.10.38', '10.0.10.39']);
  assert.equal(logic.lowestFree(cfg, taken), '10.0.10.41');
});

test('rule 1: an exhausted pool offers nothing', () => {
  const cfg = logic.config(P({}));
  cfg.scope.range = ['10.0.10.31', '10.0.10.31'];
  assert.equal(logic.lowestFree(cfg, ['10.0.10.31']), null);
});

// ── rule 2: reservations in the subnet, exclusions out of the pool ──

test('rule 2: the reservation lies in the scope subnet; inSubnet works on the boundaries', () => {
  const s = at({});
  assert.ok(logic.inSubnet(s.scope.reservations[0].ip, s.scope.subnet));
  assert.ok(logic.inSubnet('10.0.10.255', '10.0.10.0/24'));
  assert.ok(!logic.inSubnet('10.0.11.0', '10.0.10.0/24'));
  assert.ok(!logic.inSubnet('10.0.9.255', '10.0.10.0/24'));
  assert.ok(logic.inSubnet('10.0.11.7', '10.0.10.0/23'));
});

test('rule 2: the exclusion range takes 10–30 out of the pool; the reservation sits outside it', () => {
  const s = at({});
  assert.deepEqual(s.scope.exclusions, [['10.0.10.10', '10.0.10.30']]);
  assert.ok(s.leases.every((l) => Number(l.ip.split('.')[3]) > 30));
  assert.ok(Number(s.scope.reservations[0].ip.split('.')[3]) > 30);
  assert.deepEqual(at({ exclusion: false, held: 0 }).scope.exclusions, []);
});

// ── rule 3: precedence ──

test('rule 3: scope beats server; reservation beats scope; the beaten level is listed', () => {
  const s = at({ scope006: true, held: 5 });
  assert.deepEqual(eff(s, '006'), { code: '006', value: '10.0.10.53', level: 'scope', overridden: [{ level: 'server', value: '10.0.0.10' }] });
  const r = at({ client: 'printer', resOption003: true, held: 6 });
  assert.deepEqual(eff(r, '003'), { code: '003', value: '10.0.10.254', level: 'reservation', overridden: [{ level: 'scope', value: '10.0.10.1' }] });
});

test('rule 3: reservation options apply only to that reservation\'s client', () => {
  const s = at({ client: 'laptop', resOption003: true, held: 6 });
  assert.equal(eff(s, '003').value, '10.0.10.1');
  const row = s.ladders['003'].find((r) => r.level === 'reservation');
  assert.equal(row.value, '10.0.10.254');
  assert.equal(row.hit, false);
  assert.deepEqual(row.miss, ['level']);
});

// ── rule 4: class options ──

test('rule 4: a class option applies only to a client that presents the class, and beats the plain option of its level', () => {
  assert.equal(eff(at({ client: 'phone', classNtp: true, held: 12 }), '042').value, '10.0.0.123');
  assert.equal(eff(at({ client: 'phone', classNtp: true, held: 12 }), '042').level, 'scopeClass');
  const laptop = at({ client: 'laptop', classNtp: true, held: 12 });
  assert.equal(eff(laptop, '042').value, null);
  assert.deepEqual(laptop.ladders['042'].find((r) => r.level === 'scopeClass').miss, ['cls']);
  // Same level, plain and class: the class value wins for the phone, the plain one for the laptop.
  const cfg = logic.config(P({ classNtp: true }));
  cfg.scope.options['042'] = '10.0.0.200';
  const phone = Object.assign({}, logic.CLIENTS.phone);
  const lap = Object.assign({}, logic.CLIENTS.laptop);
  assert.deepEqual(logic.effectiveOf(cfg, phone).find((e) => e.code === '042'),
    { code: '042', value: '10.0.0.123', level: 'scopeClass', overridden: [{ level: 'scope', value: '10.0.0.200' }] });
  assert.equal(logic.effectiveOf(cfg, lap).find((e) => e.code === '042').level, 'scope');
});

test('rule 4: a user class counts like a vendor class', () => {
  const cfg = logic.config(P({ classNtp: true }));
  const c = { name: 'x', mac: '02-00-00-00-00-01', vendorClass: null, userClass: 'VoIP-Phone' };
  assert.equal(logic.effectiveOf(cfg, c).find((e) => e.code === '042').level, 'scopeClass');
});

// ── rule 5: not sent ──

test('rule 5: an option set at no level is not sent', () => {
  const e = eff(at({}), '042');
  assert.deepEqual(e, { code: '042', value: null, level: null, overridden: [] });
});

// ── rule 6: renewal ──

test('rule 6: a changed option reaches the client only at renewal; T1 is half the lease (4 of 8 days)', () => {
  const p = P({ scope006: true, held: 4 });
  const s = at(p);
  assert.equal(eff(s, '006').value, '10.0.10.53');
  assert.equal(s.has.options['006'], '10.0.0.10');
  assert.deepEqual(s.stale, ['006']);
  assert.equal(s.t1, 4 * 86400);
  assert.equal(logic.LEASE, 8 * 86400);
  const renewed = at(Object.assign({}, p, { held: logic.renewMask(p) }));
  assert.equal(renewed.has.options['006'], '10.0.10.53');
  assert.deepEqual(renewed.stale, []);
});

test('rule 6: on renewal a client keeps a still-valid address (exclusion on → off)', () => {
  const p = P({ exclusion: false, held: 4 });
  const s = at(p);
  assert.equal(s.has.ip, '10.0.10.31');
  assert.equal(s.offer, '10.0.10.31');
  assert.equal(s.nextFree, '10.0.10.10');
  assert.deepEqual(s.stale, []);
  const m = logic.renewMask(p);
  assert.equal(m & logic.BITS.exclusion, logic.BITS.exclusion, 'the lease still dates from the exclusion');
  assert.equal(at(Object.assign({}, p, { held: m })).offer, '10.0.10.31');
});

test('rule 6: on renewal an address that is now excluded is replaced (exclusion off → on)', () => {
  const p = P({ exclusion: true, held: 0 });
  const s = at(p);
  assert.equal(s.has.ip, '10.0.10.10');
  assert.equal(s.offer, '10.0.10.31');
  assert.deepEqual(s.stale, ['ip']);
  const r = at(Object.assign({}, p, { held: logic.renewMask(p) }));
  assert.equal(r.has.ip, '10.0.10.31');
  assert.deepEqual(r.stale, []);
});

test('rule 6: renew takes every option toggle from now', () => {
  const p = P({ scope006: true, resOption003: true, classNtp: true, held: 4 });
  assert.equal(logic.renewMask(p), 15);
  assert.equal(logic.renewMask(P({ held: 15 })), 4);
});

test('changedCodes: the options whose value or level changed', () => {
  assert.deepEqual(logic.changedCodes(at({}), at({ scope006: true })), ['006']);
  assert.deepEqual(logic.changedCodes(at({}), at({})), []);
  assert.deepEqual(logic.changedCodes(null, at({})), []);
});

test('changedCodes: a level change with the same value counts as changed', () => {
  const a = at({});
  const b = JSON.parse(JSON.stringify(a));
  b.effective.find((e) => e.code === '006').level = 'scope';
  assert.deepEqual(logic.changedCodes(a, b), ['006']);
});

test('client.reserved: only the printer', () => {
  assert.equal(at({ client: 'printer' }).client.reserved, true);
  assert.equal(at({ client: 'laptop' }).client.reserved, false);
  assert.equal(at({ client: 'phone' }).client.reserved, false);
});

test('leases and next free show what the clients hold before a renewal', () => {
  const s = at({ exclusion: true, held: 0 });
  assert.deepEqual(s.leases.map((l) => l.ip), ['10.0.10.10', '10.0.10.11']);
  assert.equal(s.nextFree, '10.0.10.31');
});

test('overridden levels are listed most specific first', () => {
  const cfg = logic.config(P({ scope006: true }));
  cfg.scope.reservations[0].options['006'] = '10.0.10.99';
  const e = logic.effectiveOf(cfg, logic.CLIENTS.printer).find((x) => x.code === '006');
  assert.equal(e.level, 'reservation');
  assert.deepEqual(e.overridden.map((o) => o.level), ['scope', 'server']);
});

test('class options: the class the client presents is chosen among several for the same code', () => {
  const cfg = logic.config(P({ classNtp: true }));
  cfg.scope.classOptions.unshift({ class: 'Printer-Class', code: '042', value: '10.0.0.9' });
  assert.equal(logic.effectiveOf(cfg, logic.CLIENTS.phone).find((x) => x.code === '042').value, '10.0.0.123');
  assert.equal(logic.effectiveOf(cfg, logic.CLIENTS.laptop).find((x) => x.code === '042').value, null);
});

// ── presets (SPEC §4) ──

test('preset server-and-scope', () => {
  const s = preset('server-and-scope');
  assert.equal(s.offer, '10.0.10.31');
  assert.deepEqual(s.effective.map((e) => [e.code, e.value, e.level]), [
    ['003', '10.0.10.1', 'scope'], ['006', '10.0.0.10', 'server'], ['015', 'corp.example', 'server'], ['042', null, null], ['051', 691200, 'scope']]);
  assert.deepEqual(s.stale, []);
});

test('preset scope-overrides', () => {
  const s = preset('scope-overrides');
  assert.equal(eff(s, '006').value, '10.0.10.53');
  assert.deepEqual(eff(s, '006').overridden, [{ level: 'server', value: '10.0.0.10' }]);
  assert.equal(eff(s, '015').level, 'server');
  assert.deepEqual(s.stale, []);
});

test('preset reservation: printer 10.0.10.40 with 003 from the reservation; the laptop keeps the scope router', () => {
  const pr = logic.presets.find((x) => x.id === 'reservation').params;
  const s = at(pr);
  assert.equal(s.offer, '10.0.10.40');
  assert.equal(eff(s, '003').value, '10.0.10.254');
  assert.equal(eff(at(Object.assign({}, pr, { client: 'laptop' })), '003').value, '10.0.10.1');
  assert.deepEqual(s.stale, []);
});

test('preset class-option: the phone gets 042, the laptop does not', () => {
  const pr = logic.presets.find((x) => x.id === 'class-option').params;
  assert.equal(eff(at(pr), '042').value, '10.0.0.123');
  assert.equal(eff(at(Object.assign({}, pr, { client: 'laptop' })), '042').value, null);
  assert.deepEqual(at(pr).stale, []);
});

test('preset change-needs-renew: new value on the server, old one on the client', () => {
  const s = preset('change-needs-renew');
  assert.equal(eff(s, '006').value, '10.0.10.53');
  assert.equal(s.has.options['006'], '10.0.0.10');
  assert.deepEqual(s.stale, ['006']);
});

test('the rule table spec is valid for every client, option and toggle set', () => {
  for (const client of ['laptop', 'printer', 'phone']) {
    for (let m = 0; m < 16; m++) {
      const s = at(logic.withMask(P({ client }), m));
      for (const code of logic.CODES) {
        const rows = s.ladders[code].map((r, i) => ({ no: i + 1, cells: { level: r.level, cls: r.cls || '—' }, action: String(r.value), rank: r.rank, hit: r.hit, miss: r.miss }));
        assert.deepEqual(RT.checkSpec({ mode: 'specific', columns: [{ key: 'level' }, { key: 'cls' }], rows, implicit: { text: 'x' }, at: 'all', done: true }), [], `${client} ${m} ${code}`);
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and every toggle set', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (let m = 0; m < 16; m++) for (let held = 0; held < 16; held++) {
    const s = at(Object.assign(logic.withMask(P({}), m), { held }));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ scope006: true, client: 'phone', held: 3 });
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
    assert.ok(new RegExp(`'${pr.id}':|\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
