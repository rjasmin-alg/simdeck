// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-domain-logon. Run: node --test sims/win-domain-logon/
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
const pings = (over) => run(over).events.filter((e) => e.kind === 'ping').map((e) => e.to + (e.lost ? '✕' : ''));
const HQ = logic.siteLdap('HQ'), BR = logic.siteLdap('Branch');

const ALL = [];
for (const location of ['hq', 'branch', 'offline']) for (const lastSite of ['HQ', 'Branch', 'none']) for (const user of ['ana', 'marko'])
  for (let m = 0; m < 16; m++) ALL.push({ location, lastSite, user, subnets: !!(m & 1), wan: !!(m & 2), cachedOnPc: !!(m & 4), rodcHasPwd: !!(m & 8) });

// ── tie-breaks ──

test('T1 / rule 1: targets in answer order: lowest priority, highest weight, then the first listed', () => {
  const t = (dc, prio, weight) => ({ dc, prio, weight });
  assert.equal(logic.pick([t('A', 0, 100), t('B', 0, 100)]), 0);
  assert.equal(logic.pick([t('B', 0, 100), t('A', 0, 100)]), 0);
  assert.equal(logic.pick([t('A', 10, 100), t('B', 0, 1)]), 1);
  assert.equal(logic.pick([t('A', 0, 50), t('B', 0, 60), t('C', 0, 60)]), 1);
  assert.equal(logic.pick([]), -1);
  assert.deepEqual(logic.order([t('A', 0, 100), t('B', 0, 100), t('C', 0, 100)]).map((x) => x.dc), ['A', 'B', 'C']);
  assert.deepEqual(logic.order([t('A', 5, 100), t('B', 0, 10), t('C', 0, 90)]).map((x) => x.dc), ['C', 'B', 'A']);
});

test('T2: a remembered site is asked first; none asks the domain-wide record first', () => {
  assert.equal(queries({})[0], HQ);
  assert.equal(queries({ lastSite: 'Branch' })[0], BR);
  assert.equal(queries({ lastSite: 'none' })[0], logic.LDAP_DC);
  assert.equal(queries({ location: 'branch', lastSite: 'none' })[0], logic.LDAP_DC);
});

test('T3: a DC that did not answer is not pinged again', () => {
  const p = { location: 'branch', wan: false };
  assert.deepEqual(queries(p), [HQ, logic.LDAP_DC]);
  assert.deepEqual(pings(p), ['DC01✕']);
  assert.deepEqual(kinds(p), ['query', 'answer', 'ping', 'query', 'answer', 'noLogon']);
});

test('T4: one query per site: a "not closest" reply never repeats a site already asked', () => {
  // remembered Branch, now in HQ, WAN up: RODC01 says HQ; HQ was not asked yet, so it is asked once
  assert.deepEqual(queries({ lastSite: 'Branch' }), [BR, HQ]);
  for (const p of ALL) {
    const q = queries(p);
    assert.equal(new Set(q).size, q.length, JSON.stringify(p));
  }
});

test('T5: offline: every DNS query is lost, no answer step, then the cache', () => {
  assert.deepEqual(kinds({ location: 'offline' }), ['query', 'query', 'noLogon']);
  assert.ok(run({ location: 'offline' }).events.filter((e) => e.kind === 'query').every((e) => e.lost && e.server === null));
  assert.deepEqual(kinds({ location: 'offline', lastSite: 'none', cachedOnPc: true }), ['query', 'cachedLogon']);
  for (const p of ALL.filter((x) => x.location === 'offline')) assert.ok(!kinds(p).some((k) => k === 'answer' || k === 'ping'));
});

test('T6: the cache changes only after an online Kerberos success', () => {
  for (const p of ALL) {
    const s = end(p), r = s.result;
    const before = p.cachedOnPc ? ['ana'] : [];
    if (r.how === 'kerberos') assert.ok(s.pc.cache.includes(p.user));
    else assert.deepEqual(s.pc.cache, before, JSON.stringify(p));
  }
});

test('T7: an RODC with the password answers itself, tunnel up or down', () => {
  for (const wan of [true, false]) {
    const p = { location: 'branch', lastSite: 'Branch', wan, rodcHasPwd: true };
    const r = run(p);
    assert.deepEqual(r.events.filter((e) => e.kind === 'asReq' || e.kind === 'asRep').map((e) => e.from + '→' + e.to), ['PC→RODC01', 'RODC01→PC']);
    assert.deepEqual([r.result.how, r.result.dc, r.result.forwarded, r.result.wan], ['kerberos', 'RODC01', false, false]);
  }
});

// ── rules ──

test('records: the RODC is only in its site\'s record; the domain-wide record names DC01 alone', () => {
  assert.deepEqual(logic.answer(logic.LDAP_DC).map((x) => x.dc), ['DC01']);
  assert.deepEqual(logic.answer(HQ).map((x) => x.dc), ['DC01']);
  assert.deepEqual(logic.answer(BR).map((x) => x.dc), ['RODC01']);
  assert.ok(logic.answer(BR).every((x) => x.prio === 0 && x.weight === 100 && x.port === 389));
  assert.deepEqual(logic.answer('nothing'), []);
});

test('reachability: across the sites only with the tunnel; offline nothing', () => {
  assert.equal(logic.reaches(P({ location: 'hq', wan: false }), 'PC', 'DC01'), true);
  assert.equal(logic.reaches(P({ location: 'hq', wan: false }), 'PC', 'RODC01'), false);
  assert.equal(logic.reaches(P({ location: 'branch', wan: false }), 'PC', 'DC01'), false);
  assert.equal(logic.reaches(P({ location: 'branch', wan: true }), 'PC', 'DC01'), true);
  assert.equal(logic.reaches(P({ location: 'offline' }), 'PC', 'DC01'), false);
  assert.equal(logic.reaches(P({ wan: false }), 'RODC01', 'DC01'), false);
  assert.equal(logic.crosses(P({ location: 'branch' }), 'PC', 'DC01'), true);
  assert.equal(logic.crosses(P({ location: 'branch' }), 'PC', 'RODC01'), false);
});

test('rule 1: no site remembered: the domain-wide record, the first target that answers', () => {
  const ev = run({ lastSite: 'none' }).events;
  assert.deepEqual(ev.slice(0, 4).map((e) => e.kind), ['query', 'answer', 'ping', 'pong']);
  assert.deepEqual(ev[1].targets, ['DC01']);
  assert.equal(ev[1].server, 'DC01', 'in HQ, the DNS server on DC01');
  assert.equal(run({ location: 'branch' }).events[1].server, 'RODC01', 'in Branch, the DNS server on RODC01');
});

test('rule 2: the reply names the client\'s site; a DC in another site sends the client to its site record', () => {
  const ev = run({ location: 'branch' }).events;
  const pongs = ev.filter((e) => e.kind === 'pong');
  assert.deepEqual(pongs.map((e) => [e.from, e.site, e.closest]), [['DC01', 'Branch', false], ['RODC01', 'Branch', true]]);
  assert.deepEqual(queries({ location: 'branch' }), [HQ, BR]);
  assert.equal(at({ location: 'branch' }, 3).pc.site, 'HQ', 'not before the reply');
  assert.equal(at({ location: 'branch' }, 4).pc.site, 'Branch');
  assert.equal(at({ location: 'branch' }, 4).dcChosen, 'DC01');
  assert.equal(at({ location: 'branch' }, 8).dcChosen, 'RODC01');
  assert.equal(end({ location: 'branch' }).pc.site, 'Branch', 'stored for next time');
  // the same client without a remembered site: domain-wide → DC01, then Branch → RODC01
  assert.deepEqual(queries({ location: 'branch', lastSite: 'none' }), [logic.LDAP_DC, BR]);
  assert.equal(run({ location: 'branch', lastSite: 'none' }).result.dc, 'RODC01');
});

test('rule 2: in HQ remembering Branch: RODC01 answers over the WAN, says HQ, the client moves to DC01', () => {
  // (the DC of the client's own site always answers here, so "keep the DC that did" shows only without subnets, rule 3)
  const r = run({ lastSite: 'Branch' });
  assert.deepEqual(pings({ lastSite: 'Branch' }), ['RODC01', 'DC01']);
  assert.equal(r.result.dc, 'DC01');
  assert.equal(r.events.find((e) => e.kind === 'ping').wan, true);
});

test('rule 2a: the remembered site does not answer: the domain-wide record next', () => {
  const p = { lastSite: 'Branch', wan: false };
  assert.deepEqual(queries(p), [BR, logic.LDAP_DC]);
  assert.deepEqual(pings(p), ['RODC01✕', 'DC01']);
  assert.deepEqual(run(p).result.dc, 'DC01');
  assert.equal(run(p).result.wan, false);
});

test('rule 3: no subnets: no site in the reply, the remembered site forgotten, the DC that answered kept', () => {
  const p = { location: 'branch', subnets: false };
  const pong = run(p).events.find((e) => e.kind === 'pong');
  assert.deepEqual([pong.from, pong.site, pong.closest], ['DC01', null, false]);
  assert.deepEqual(queries(p), [HQ]);
  assert.equal(end(p).pc.site, null);
  assert.equal(run(p).result.site, null);
  assert.deepEqual([run(p).result.dc, run(p).result.wan], ['DC01', true]);
  assert.equal(logic.siteOf(P({ location: 'branch', subnets: false })), null);
  assert.equal(logic.siteOf(P({ location: 'branch' })), 'Branch');
});

test('rule 4: Kerberos is the AS exchange with the DC located, two messages', () => {
  const ev = run({}).events;
  assert.deepEqual(ev.slice(4, 6).map((e) => [e.kind, e.from, e.to, e.user]), [['asReq', 'PC', 'DC01', 'ana'], ['asRep', 'DC01', 'PC', 'ana']]);
  assert.equal(at({}, 5).phase, 'logon');
});

test('rule 5: success stores the verifier: 0 → 1 / 10, refresh keeps the count, the oldest goes past 10', () => {
  assert.deepEqual(at({}, 6).pc.cache, []);
  assert.deepEqual(end({}).pc.cache, ['ana']);
  assert.deepEqual(run({}).events[6], { kind: 'cacheStore', user: 'ana', added: true, count: 1, result: run({}).result });
  assert.deepEqual(end({ cachedOnPc: true }).pc.cache, ['ana']);
  assert.equal(run({ cachedOnPc: true }).events.at(-1).added, false);
  assert.deepEqual(end({ cachedOnPc: true, user: 'marko' }).pc.cache, ['ana', 'marko']);
  const ten = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'];
  assert.deepEqual(logic.store(ten, 'u11'), ten.slice(1).concat('u11'));
  assert.deepEqual(logic.store(ten, 'u5'), ten.filter((u) => u !== 'u5').concat('u5'), 'refreshed: now the most recently used');
  assert.deepEqual(logic.store(['a', 'b'], 'a'), ['b', 'a']);
  assert.deepEqual(logic.store(['a', 'b'], 'c', 2), ['b', 'c']);
  assert.equal(logic.CACHE_MAX, 10);
});

test('rule 6: no DC: a cached user logs on with cached credentials, a new one does not', () => {
  assert.deepEqual(run({ location: 'offline', cachedOnPc: true }).result,
    { ok: true, how: 'cached', dc: null, reason: 'noDc', user: 'ana', site: 'HQ' });
  assert.deepEqual(run({ location: 'offline' }).result, { ok: false, how: null, dc: null, reason: 'noDc', user: 'ana', site: 'HQ' });
  assert.deepEqual(run({ location: 'offline', user: 'marko', cachedOnPc: true }).result,
    { ok: false, how: null, dc: null, reason: 'noDc', user: 'marko', site: 'HQ' });
  assert.equal(run({ location: 'offline', user: 'marko', cachedOnPc: true }).events.at(-1).count, 1);
});

test('rule 7: RODC without the password forwards to DC01 over the WAN; WAN down: error, then rule 6', () => {
  const up = run({ location: 'branch', lastSite: 'Branch' });
  assert.deepEqual(up.events.slice(4).map((e) => e.kind + ' ' + e.from + '→' + e.to),
    ['asReq PC→RODC01', 'asReq RODC01→DC01', 'asRep DC01→RODC01', 'asRep RODC01→PC', 'cacheStore undefined→undefined']);
  assert.deepEqual([up.result.dc, up.result.forwarded, up.result.wan], ['RODC01', true, false], 'PC07 talks to RODC01 locally');
  assert.deepEqual(up.events.slice(4, 8).map((e) => e.wan), [false, true, true, false], 'only the forward and its reply cross');
  const down = run({ location: 'branch', lastSite: 'Branch', wan: false });
  assert.deepEqual(down.events.slice(4).map((e) => e.kind + (e.lost ? '✕' : '')), ['asReq', 'asReq✕', 'krbError', 'noLogon']);
  assert.equal(down.result.reason, 'rodc');
  assert.equal(run({ location: 'branch', lastSite: 'Branch', wan: false, cachedOnPc: true }).result.how, 'cached');
});

test('initial state: PC07\'s DNS server and the RODC\'s passwords (the user\'s and PC07\'s)', () => {
  assert.deepEqual([at({}, 0).pc.dns, at({ location: 'branch' }, 0).pc.dns, at({ location: 'offline' }, 0).pc.dns], ['DC01', 'RODC01', null]);
  assert.deepEqual(at({ rodcHasPwd: true, user: 'marko' }, 0).rodcCached, ['marko', 'PC07']);
  assert.deepEqual(at({}, 0).rodcCached, []);
  assert.deepEqual([at({}, 0).wanUp, at({ wan: false }, 0).wanUp], [true, false]);
  assert.deepEqual([at({}, 0).pc.ip, at({ location: 'branch' }, 0).pc.ip, at({ location: 'offline' }, 0).pc.ip], ['10.10.20.57', '10.20.20.57', null]);
});

test('tunnel flags: every message between the sites, and only those, is marked wan', () => {
  const site = (p, who) => (who === 'PC' ? { hq: 'HQ', branch: 'Branch' }[p.location] : logic.DC[who].site);
  for (const p of ALL) {
    const q = P(p);
    for (const e of logic.plan(q).events) {
      if (!/^(ping|pong|asReq|asRep)$/.test(e.kind)) continue;
      const a = e.kind === 'ping' ? 'PC' : e.from, b = e.kind === 'pong' ? 'PC' : e.to;
      assert.equal(e.wan, site(q, a) !== site(q, b), JSON.stringify([p, e]));
    }
  }
});

test('phases: locate, logon (an RODC error too), done', () => {
  const p = { location: 'branch', lastSite: 'Branch', wan: false };
  assert.deepEqual([1, 4, 5, 7, 8].map((n) => at(p, n).phase), ['locate', 'locate', 'logon', 'logon', 'done']);
  assert.equal(at(p, 0).phase, 'start');
});

test('the chosen DC follows the replies; a failed logon clears it', () => {
  assert.equal(at({}, 3).dcChosen, null);
  assert.equal(at({}, 4).dcChosen, 'DC01');
  const p = { location: 'branch', lastSite: 'Branch', wan: false, cachedOnPc: true };
  assert.equal(at(p, 7).dcChosen, 'RODC01');
  assert.equal(end(p).dcChosen, null);
});

// ── presets (SPEC table, also checked by a separate hand count over every combination) ──

const PRESETS = {
  hq: [{}, 7, { ok: true, how: 'kerberos', dc: 'DC01', wan: false, forwarded: false, user: 'ana', site: 'HQ' }],
  'branch-first': [{ location: 'branch' }, 13, { ok: true, how: 'kerberos', dc: 'RODC01', wan: false, forwarded: true, user: 'ana', site: 'Branch' }],
  'branch-wan-down': [{ location: 'branch', lastSite: 'Branch', wan: false, cachedOnPc: true }, 8, { ok: true, how: 'cached', dc: null, reason: 'rodc', user: 'ana', site: 'Branch' }],
  'offline-new-user': [{ location: 'offline', user: 'marko', cachedOnPc: true }, 3, { ok: false, how: null, dc: null, reason: 'noDc', user: 'marko', site: 'HQ' }],
  'no-subnets': [{ location: 'branch', subnets: false, lastSite: 'none' }, 7, { ok: true, how: 'kerberos', dc: 'DC01', wan: true, forwarded: false, user: 'ana', site: null }]
};
for (const [id, [p, steps, result]] of Object.entries(PRESETS)) {
  test(`preset ${id}: ${steps} steps`, () => {
    assert.equal(logic.steps(P(p)), steps);
    assert.deepEqual(end(p).result, result);
  });
}

test('SPEC "other combinations": 6, 11, 13, 2', () => {
  assert.equal(logic.steps(P({ location: 'branch', wan: false, cachedOnPc: true })), 6);
  assert.equal(run({ location: 'branch', wan: false, cachedOnPc: true }).result.how, 'cached');
  assert.equal(logic.steps(P({ lastSite: 'Branch' })), 11);
  assert.equal(logic.steps(P({ location: 'branch', lastSite: 'none' })), 13);
  assert.equal(logic.steps(P({ location: 'offline', lastSite: 'none' })), 2);
});

test('every combination: 2 to 13 steps; defaults 7', () => {
  const n = ALL.map((p) => logic.steps(P(p)));
  assert.equal(Math.min(...n), 2);
  assert.equal(Math.max(...n), 13);
  assert.equal(logic.steps(P()), 7);
});

test('the result appears on the last step only', () => {
  for (const p of ALL.filter((x, i) => i % 5 === 0)) {
    const q = P(p), n = logic.steps(q);
    assert.equal(kit.stateAt(logic, q, n - 1).result, null);
    assert.notEqual(kit.stateAt(logic, q, n).result, null);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of [{}, { location: 'branch' }, { location: 'offline', cachedOnPc: true }]) {
    const q = P(p);
    for (let n = 0; n <= logic.steps(q); n++) {
      const s = kit.stateAt(logic, q, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ location: 'branch', cachedOnPc: true });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ location: 'branch' });
  let s = logic.initial(p);
  for (let n = 1; n <= 5; n++) {
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
