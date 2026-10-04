// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dns-resolution's model (rules: SPEC.md). Run: node --test sims/dns-resolution/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const route = (msgs) => msgs.map((m) => `${m.from}>${m.to}:${m.kind}`);
const lookup = (s, k) => s.msgs.filter((m) => m.lookup === k);

// ── tie-breaks first ──

test('rule 8 tie-break: of several NS the first listed with an address is asked', () => {
  const s = end({});
  const asked = s.msgs.filter((m) => m.from === 'R' && m.to !== 'S').map((m) => m.server);
  assert.deepEqual(asked, ['a.root-servers.net', 'a.ns.hr', 'ns1.grafo.hr']);
  // the first listed without a valid address is skipped for the next one
  const cache = logic.hints(P()).concat([
    { name: 'grafo.hr', type: 'NS', data: ['ns1.grafo.hr', 'ns2.grafo.hr'], ttl: 100, expiresAt: 100, negative: false },
    { name: 'ns1.grafo.hr', type: 'A', data: ['203.0.113.53'], ttl: 10, expiresAt: 10, negative: false },
    { name: 'ns2.grafo.hr', type: 'A', data: ['203.0.113.54'], ttl: 100, expiresAt: 100, negative: false }
  ]);
  assert.equal(logic.deepestNS(cache, 'www.grafo.hr', 5).server, 'ns1.grafo.hr');
  assert.equal(logic.deepestNS(cache, 'www.grafo.hr', 50).server, 'ns2.grafo.hr');
});

test('rule 5 tie-break: at 0 s left an entry is expired; 1 s before it is valid', () => {
  const e = { expiresAt: 3600 };
  assert.equal(logic.valid(e, 3599), true);
  assert.equal(logic.valid(e, 3600), false);
  assert.equal(logic.valid({ expiresAt: null }, 1e9), true, 'root hints never expire');
  // www at t = 3600 with TTL 3600 goes out again (the task's "t = 3601")
  assert.equal(lookup(end({ advance: 3600 }), 2).length, 4);
  assert.equal(lookup(end({ advance: 3600, ttlA: 3660 }), 2).length, 2);
});

// ── rules ──

test('rule 1: the stub sends one recursive query (rd) and gets an answer or an error, never a referral', () => {
  for (const name of ['www', 'mail', 'nema']) {
    for (const advance of [60, 3600, 86400]) {
      const s = end({ name, advance });
      const fromStub = s.msgs.filter((m) => m.from === 'S');
      assert.equal(fromStub.length, 2, 'one query per lookup');
      fromStub.forEach((m) => { assert.equal(m.to, 'R'); assert.equal(m.kind, 'query'); assert.equal(m.rd, true); });
      const toStub = s.msgs.filter((m) => m.to === 'S');
      assert.equal(toStub.length, 2);
      toStub.forEach((m) => assert.ok(m.kind === 'answer' || m.kind === 'nxdomain', m.kind));
      // nobody but the resolver talks to the servers
      s.msgs.forEach((m) => { if (m.from === 'S') assert.equal(m.to, 'R'); if (m.to === 'S') assert.equal(m.from, 'R'); });
    }
  }
});

test('rule 2: the resolver asks iteratively (no rd), each server answers from its own data', () => {
  const s = end({});
  assert.deepEqual(route(lookup(s, 1)), [
    'S>R:query', 'R>root:query', 'root>R:referral', 'R>tld:query', 'tld>R:referral', 'R>auth:query', 'auth>R:answer', 'R>S:answer'
  ]);
  s.msgs.filter((m) => m.from === 'R' && m.to !== 'S').forEach((m) => assert.equal(m.rd, false));
  const z = logic.zones(P());
  assert.equal(logic.serve(z, '.', 'www.grafo.hr', 'A').kind, 'referral');
  assert.equal(logic.serve(z, 'hr', 'www.grafo.hr', 'A').kind, 'referral');
  assert.equal(logic.serve(z, 'grafo.hr', 'www.grafo.hr', 'A').kind, 'answer');
  assert.equal(logic.serve(z, 'grafo.hr', 'nema.grafo.hr', 'A').kind, 'nxdomain');
  // a referral goes to the child zone closer to the name, not a name that only ends in the same letters
  assert.equal(logic.serve(z, 'hr', 'xgrafo.hr', 'A').kind, 'nxdomain');
});

test('rule 3: a referral carries the child NS and glue, no aa; both are cached for the delegation TTL', () => {
  const s = at({ ttlNS: 7200 }, 5);
  const ref = s.msgs[4];
  assert.equal(ref.kind, 'referral');
  assert.equal(ref.aa, false);
  assert.equal(ref.zone, 'grafo.hr');
  assert.deepEqual(ref.ns, ['ns1.grafo.hr', 'ns2.grafo.hr']);
  assert.deepEqual(ref.glue.map((g) => g.ip), ['203.0.113.53', '203.0.113.54']);
  assert.equal(logic.find(s.cache, 'grafo.hr', 'NS').expiresAt, 7200);
  assert.equal(logic.find(s.cache, 'ns2.grafo.hr', 'A').expiresAt, 7200);
  assert.equal(logic.find(s.cache, 'hr', 'NS').expiresAt, logic.TTL_TLD);
  assert.deepEqual(s.touched.map((x) => x.how), ['added', 'added', 'added']);
});

test('rule 4: only the authoritative server sets aa; the reply to the stub has ra and no aa', () => {
  for (const name of ['www', 'nema']) {
    const s = end({ name });
    s.msgs.forEach((m) => {
      if (m.aa) assert.equal(m.from, 'auth', `aa from ${m.from}`);
      if (m.to === 'S') { assert.equal(m.aa, false); assert.equal(m.ra, true); }
      if (m.from === 'auth') assert.equal(m.aa, true);
    });
  }
});

test('rule 5: cached for its TTL; within it the answer comes from the cache with no packet out, TTL left', () => {
  const s = end({});
  assert.deepEqual(route(lookup(s, 2)), ['S>R:query', 'R>S:answer']);
  const r = lookup(s, 2)[1];
  assert.equal(r.fromCache, true);
  assert.equal(r.ttl, 3540);
  assert.equal(r.rr.ttl, 3540);
  assert.equal(lookup(s, 1)[7].ttl, 3600);
  assert.equal(logic.find(s.cache, 'www.grafo.hr', 'A').expiresAt, 3600);
  // ttlA reaches the record
  assert.equal(lookup(end({ ttlA: 120 }), 2)[1].ttl, 60);
});

test('rule 6: the walk starts from the deepest NS still cached', () => {
  // same zone, 60 s later: straight to the authoritative server
  assert.deepEqual(route(lookup(end({ again: 'mail' }), 2)), ['S>R:query', 'R>auth:query', 'auth>R:answer', 'R>S:answer']);
  // a day later: grafo.hr NS (86400) expired, hr NS (172800) not → from the TLD
  assert.deepEqual(route(lookup(end({ advance: 86400 }), 2)),
    ['S>R:query', 'R>tld:query', 'tld>R:referral', 'R>auth:query', 'auth>R:answer', 'R>S:answer']);
  // a short NS TTL: both the answer and the delegation gone → from the TLD again after an hour
  assert.equal(lookup(end({ advance: 3600, ttlNS: 3600 }), 2)[1].to, 'tld');
  assert.equal(logic.deepestNS(logic.hints(P()), 'www.grafo.hr', 0).zone, '.', 'root hints when nothing else');
});

test('rule 7: NXDOMAIN has aa and is cached as a negative answer for min(SOA TTL, MINIMUM) = 900 s', () => {
  const s = end({ name: 'nema' });
  const nx = lookup(s, 1)[6];
  assert.equal(nx.kind, 'nxdomain');
  assert.equal(nx.aa, true);
  assert.equal(nx.ttl, Math.min(logic.SOA.ttl, logic.SOA.minimum));
  assert.equal(nx.ttl, 900);
  const e = logic.find(s.cache, 'nema.grafo.hr', 'NXDOMAIN');
  assert.equal(e.negative, true);
  assert.equal(e.expiresAt, 900);
  assert.deepEqual(route(lookup(s, 2)), ['S>R:query', 'R>S:nxdomain']);
  assert.equal(lookup(s, 2)[1].ttl, 840);
  assert.equal(lookup(s, 2)[1].fromCache, true);
  // after 900 s the negative entry is gone: asked again (NS still cached → straight to auth)
  assert.equal(lookup(end({ name: 'nema', advance: 3600 }), 2).length, 4);
  // the lower of the two decides, whichever it is
  const z = logic.zones(P());
  z['grafo.hr'].soa = { ttl: 300, minimum: 900 };
  assert.equal(logic.serve(z, 'grafo.hr', 'nema.grafo.hr', 'A').ttl, 300);
});

test('rule 9: a new RRset replaces the cached one of the same name and type; hints never leave', () => {
  const s = end({ advance: 3600 });
  assert.equal(s.cache.filter((e) => e.name === 'www.grafo.hr' && e.type === 'A').length, 1);
  assert.equal(logic.find(s.cache, 'www.grafo.hr', 'A').expiresAt, 7200);
  assert.ok(s.cache.some((e) => e.hint && e.name === '.'));
});

test('presets: the task\'s numbers', () => {
  const runs = {
    cold: [{}, 8, 2, 10],
    'same-zone': [{ again: 'mail' }, 8, 4, 12],
    'ttl-expired': [{ advance: 3600 }, 8, 4, 12],
    nxdomain: [{ name: 'nema' }, 8, 2, 10]
  };
  for (const [id, [over, a, b, total]] of Object.entries(runs)) {
    const s = end(over);
    assert.equal(lookup(s, 1).length, a, id);
    assert.equal(lookup(s, 2).length, b, id);
    assert.equal(logic.steps(P(over)), total, id);
    assert.equal(logic.firstDone(P(over)), a, id);
  }
  // cold: 3 iterative round trips
  assert.equal(end({}).outcome[0].out, 3);
  // the most a run can take stays under the stepper limit
  // (the hr delegation, 172800 s, outlives the longest advance, so lookup 2 never goes back to the root)
  let most = 0;
  for (const name of ['www', 'mail', 'nema']) for (const again of ['same', 'www', 'mail', 'nema'])
    for (const advance of [60, 3600, 86400]) for (const ttlNS of [3600, 86400, 172800]) for (const ttlA of [60, 3600, 86400])
      most = Math.max(most, logic.steps(P({ name, again, advance, ttlNS, ttlA })));
  assert.equal(most, 14);
});

test('one message per step; touched names the cache rows used', () => {
  const p = P({ again: 'mail' });
  for (let n = 1; n <= logic.steps(p); n++) assert.equal(kit.stateAt(logic, p, n).msgs.length, n);
  const s = at({ again: 'mail' }, 9);
  assert.deepEqual(s.touched, [{ key: 'grafo.hr NS', how: 'used' }, { key: 'ns1.grafo.hr A', how: 'used' }]);
  assert.deepEqual(at({}, 10).touched, [{ key: 'www.grafo.hr A', how: 'used' }]);
});

// ── from the review: the parts the rule tests did not pin down ──

test('deepest NS: an expired NS set is skipped even when its glue is still valid', () => {
  const cache = logic.hints(P()).concat([
    { name: 'hr', type: 'NS', data: ['a.ns.hr'], ttl: 1000, expiresAt: 1000, negative: false },
    { name: 'a.ns.hr', type: 'A', data: ['198.51.100.10'], ttl: 1000, expiresAt: 1000, negative: false, glue: true },
    { name: 'grafo.hr', type: 'NS', data: ['ns1.grafo.hr'], ttl: 10, expiresAt: 10, negative: false },
    { name: 'ns1.grafo.hr', type: 'A', data: ['203.0.113.53'], ttl: 1000, expiresAt: 1000, negative: false, glue: true }
  ]);
  assert.equal(logic.deepestNS(cache, 'www.grafo.hr', 5).zone, 'grafo.hr');
  assert.equal(logic.deepestNS(cache, 'www.grafo.hr', 50).zone, 'hr');
});

test('a negative entry answers only its own name', () => {
  const s = end({ name: 'nema', again: 'www' });
  assert.deepEqual(route(lookup(s, 2)), ['S>R:query', 'R>auth:query', 'auth>R:answer', 'R>S:answer']);
  assert.equal(logic.cachedAnswer(s.cache, 'mail.grafo.hr', 'A', 60), null);
});

test('NXDOMAIN from the authoritative server carries the zone\'s SOA', () => {
  const nx = lookup(end({ name: 'nema' }), 1)[6];
  assert.deepEqual(nx.soa, { zone: 'grafo.hr', ttl: logic.SOA.ttl, minimum: logic.SOA.minimum });
  assert.deepEqual(logic.SOA, { ttl: 3600, minimum: 900 });
});

test('outcome counts the queries the resolver sent in each lookup', () => {
  assert.deepEqual(end({ again: 'mail' }).outcome.map((o) => [o.msgs, o.out, o.fromCache]), [[8, 3, false], [4, 1, false]]);
  assert.deepEqual(end({}).outcome.map((o) => [o.msgs, o.out, o.fromCache]), [[8, 3, false], [2, 0, true]]);
  assert.deepEqual(end({ advance: 86400 }).outcome[1].out, 2);
});

test('touched: each step names the rows it used or added', () => {
  assert.deepEqual(at({}, 2).touched, [{ key: '. NS', how: 'used' }, { key: 'a.root-servers.net A', how: 'used' }]);
  assert.deepEqual(at({}, 1).touched, [{ key: '. NS', how: 'used' }, { key: 'a.root-servers.net A', how: 'used' }]);
  assert.deepEqual(at({}, 7).touched, [{ key: 'www.grafo.hr A', how: 'added' }]);
});

test('glue is marked as glue; the root hints are two servers that never expire', () => {
  const s = end({});
  ['a.ns.hr', 'b.ns.hr', 'ns1.grafo.hr', 'ns2.grafo.hr'].forEach((n) => assert.equal(logic.find(s.cache, n, 'A').glue, true, n));
  assert.equal(logic.find(s.cache, 'www.grafo.hr', 'A').glue, undefined);
  const hints = logic.hints(P());
  assert.deepEqual(hints.map((e) => [e.name, e.type, e.expiresAt, e.hint]), [
    ['.', 'NS', null, true], ['a.root-servers.net', 'A', null, true], ['b.root-servers.net', 'A', null, true]]);
  assert.deepEqual(hints[0].data, ['a.root-servers.net', 'b.root-servers.net']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { name: 'nema', again: 'mail', advance: 86400 }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ again: 'mail', advance: 86400, ttlA: 600 });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
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
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
