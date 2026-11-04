// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-forwarders' model (rules: SPEC.md). Run: node --test sims/win-dns-forwarders/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const runOf = (sc) => logic.run(sc);
const last = (a) => a[a.length - 1];
const route = (msgs) => msgs.map((m) => `${m.from}>${m.to}:${m.kind}${m.lost ? '✕' : ''}@${m.t}`);
const lookup = (s, k) => s.msgs.filter((m) => m.lookup === k);
const PARAMS = (() => {
  const out = [];
  for (const name of ['fs1', 'crm', 'www'])
    for (let b = 0; b < 32; b++)
      out.push({ name, condFwd: !!(b & 1), forwarderUp: !!(b & 2), rootHints: !!(b & 4), recursion: !!(b & 8), repeat: !!(b & 16) });
  return out;
})();

/** A scene from the page's params, then changed by `edit` (more forwarders, more conditional domains, other names). */
function scene(over, edit) {
  const sc = logic.sceneOf(P(over));
  if (edit) edit(sc);
  return sc;
}
function addServer(sc, ip, role, zone, up) {
  sc.servers[ip] = { lane: ip, role, zone };
  sc.up[ip] = up !== false;
}

// ── tie-breaks first ──

test('rule 2 tie-break: the longest matching conditional domain wins, wherever it stands in the list', () => {
  const sc = scene({ name: 'crm' }, (s) => {
    s.name = 'crm.eu.partner.example';
    s.dc.condForwarders.push({ domain: 'eu.partner.example', targets: ['10.30.0.53'], on: true });
    addServer(s, '10.30.0.53', 'auth', 'partner.example');
  });
  const ev = logic.evaluate(sc.dc, logic.hints(), sc.name, 0, []);
  const kinds = ev.rows.map((r) => r.kind);
  assert.deepEqual(kinds, ['cache', 'zone', 'cond', 'cond', 'fwd', 'hints']);
  assert.equal(ev.win, 3, 'eu.partner.example (listed second) wins');
  assert.equal(ev.rows[2].hit, false);
  assert.equal(ev.rows[2].note, 'shorter');
  const r = runOf(sc);
  assert.equal(last(r).msgs[1].server, '10.30.0.53');
  // a name only in the shorter domain still goes to the shorter one
  assert.equal(logic.evaluate(sc.dc, logic.hints(), 'crm.partner.example', 0, []).win, 2);
});

test('rule 2 tie-break: the same domain twice, the first in the list wins', () => {
  const sc = scene({ name: 'crm' }, (s) => s.dc.condForwarders.push({ domain: 'partner.example', targets: ['10.30.0.53'], on: true }));
  assert.equal(logic.evaluate(sc.dc, logic.hints(), sc.name, 0, []).win, 2);
});

test('rule 2: a domain matches itself and names under it, not a name that only ends in the same letters', () => {
  assert.equal(logic.inDomain('crm.partner.example', 'partner.example'), true);
  assert.equal(logic.inDomain('partner.example', 'partner.example'), true);
  assert.equal(logic.inDomain('xpartner.example', 'partner.example'), false);
  assert.equal(logic.inDomain('fs1.corp.example', 'corp.example'), true);
  assert.equal(logic.inDomain('fs1.corp.example.org', 'corp.example'), false);
  const sc = scene({ name: 'crm' }, (s) => { s.name = 'xpartner.example'; });
  assert.equal(logic.evaluate(sc.dc, logic.hints(), sc.name, 0, []).rows[2].hit, false);
});

test('rule 3 tie-break: server forwarders in list order; the second only after the first timed out (3 s)', () => {
  const two = (firstUp) => scene({ name: 'www', forwarderUp: firstUp }, (s) => {
    s.dc.forwarders.push('192.0.2.99');
    addServer(s, '192.0.2.99', 'resolver');
  });
  const up = last(runOf(two(true)));
  assert.deepEqual(up.msgs.filter((m) => m.from === 'DC' && m.to !== 'PC').map((m) => m.server), ['198.51.100.53']);
  const down = last(runOf(two(false)));
  assert.deepEqual(route(down.msgs), ['PC>DC:query@0', 'DC>fwd:query✕@0', 'DC>192.0.2.99:query@3', '192.0.2.99>DC:answer@3', 'DC>PC:answer@3']);
  assert.equal(down.outcome[0].rule, 'fwd');
});

test('rule 7 tie-break: a cache entry with 0 s left is expired', () => {
  const e = { expiresAt: 100 };
  assert.equal(logic.valid(e, 99), true);
  assert.equal(logic.valid(e, 100), false);
  assert.equal(logic.left(e, 99), 1);
  assert.equal(logic.valid({ expiresAt: null }, 1e9), true, 'root hints never expire');
});

// ── rules ──

test('rule 1: a name in the hosted zone is answered from the zone with aa; nothing leaves DC1, whatever else is set', () => {
  for (const p of PARAMS.filter((x) => x.name === 'fs1')) {
    const s = end(p);
    const one = lookup(s, 1);
    assert.deepEqual(route(one), ['PC>DC:query@0', 'DC>PC:answer@0'], JSON.stringify(p));
    assert.equal(one[1].aa, true);
    assert.equal(one[1].rr.data[0], '10.0.0.21');
    assert.equal(s.outcome[0].rule, 'zone');
  }
});

test('rule 1: NXDOMAIN in the hosted zone is final (aa), no forwarder and no root hints', () => {
  const s = last(runOf(scene({}, (x) => { x.name = 'nope.corp.example'; })));
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>PC:nxdomain@0']);
  assert.equal(s.msgs[1].aa, true);
});

test('rule 1: the zone\'s own answers are not cached, so a repeat is answered from the zone again', () => {
  const s = end({ name: 'fs1', repeat: true });
  assert.equal(s.outcome[1].rule, 'zone');
  assert.equal(logic.find(s.cache, 'fs1.corp.example', 'A'), null);
});

test('rule 2: a partner name goes to the conditional forwarder with rd, and its authoritative answer comes back', () => {
  const s = end({ name: 'crm' });
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>partner:query@0', 'partner>DC:answer@0', 'DC>PC:answer@0']);
  assert.equal(s.msgs[1].rd, true);
  assert.equal(s.msgs[1].server, '10.20.0.53');
  assert.equal(s.msgs[2].aa, true);
  assert.equal(s.msgs[3].rr.data[0], '10.20.5.8');
  assert.equal(s.outcome[0].rule, 'cond');
  // internet names never go to the partner
  for (const p of PARAMS.filter((x) => x.name === 'www')) assert.ok(end(p).msgs.every((m) => m.to !== 'partner'), JSON.stringify(p));
});

test('rule 2: with the conditional forwarder off, a partner name goes to the server forwarder', () => {
  const s = end({ name: 'crm', condFwd: false });
  assert.equal(s.msgs[1].to, 'fwd');
  const row = s.table.rows.find((r) => r.kind === 'cond');
  assert.equal(row.note, 'off');
  assert.equal(row.hit, false);
});

test('rule 3: the forwarder gets 3 s; a conditional forwarder target gets 5 s', () => {
  assert.equal(logic.FWD_TIMEOUT, 3);
  assert.equal(logic.COND_TIMEOUT, 5);
  const s = end({ name: 'www', forwarderUp: false });
  assert.equal(s.msgs[1].lost, true);
  assert.equal(s.msgs[1].wait, 3);
  assert.equal(s.msgs[2].t, 3);
  const sc = scene({ name: 'crm' }, (x) => {
    x.dc.condForwarders[0].targets = ['10.20.0.54', '10.20.0.53'];
    addServer(x, '10.20.0.54', 'auth', 'partner.example', false);
  });
  const c = last(runOf(sc));
  assert.deepEqual(route(c.msgs), ['PC>DC:query@0', 'DC>10.20.0.54:query✕@0', 'DC>partner:query@5', 'partner>DC:answer@5', 'DC>PC:answer@5']);
});

test('rule 4: forwarder down → 3 s, then root → .org → example.org → answer (9 messages)', () => {
  const s = end({ name: 'www', forwarderUp: false });
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>fwd:query✕@0', 'DC>root:query@3', 'root>DC:referral@3', 'DC>tld:query@3',
    'tld>DC:referral@3', 'DC>auth:query@3', 'auth>DC:answer@3', 'DC>PC:answer@3']);
  assert.equal(s.msgs[2].rd, false, 'iterative from the root');
  assert.equal(s.outcome[0].rule, 'hints');
  assert.equal(s.outcome[0].ip, '203.0.113.80');
  const fwd = s.table.rows.find((r) => r.kind === 'fwd');
  assert.equal(fwd.note, 'timeout');
  assert.equal(fwd.mark, 'beaten');
  assert.equal(s.table.rows[s.table.at].kind, 'hints');
});

test('rule 4: root hints off → SERVFAIL after 3 s, no root query', () => {
  const s = end({ name: 'www', forwarderUp: false, rootHints: false });
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>fwd:query✕@0', 'DC>PC:servfail@3']);
  assert.equal(s.table.at, s.table.rows.length, 'the implicit row decides');
  assert.equal(s.table.rows.find((r) => r.kind === 'hints').note, 'off');
});

test('rule 4: with no forwarders at all DC1 uses the root hints at once, whatever the fallback box says', () => {
  for (const rootHints of [true, false]) {
    const s = last(runOf(scene({ name: 'www', rootHints }, (x) => { x.dc.forwarders = []; })));
    assert.equal(s.msgs[1].to, 'root', String(rootHints));
    assert.equal(s.msgs[1].t, 0);
  }
});

test('rule 5: a forwarder\'s NXDOMAIN ends the search: no root hints, no next forwarder', () => {
  const s = end({ name: 'crm', condFwd: false });
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>fwd:query@0', 'fwd>DC:nxdomain@0', 'DC>PC:nxdomain@0']);
  assert.equal(s.table.rows[s.table.at].kind, 'fwd');
  const two = last(runOf(scene({ name: 'crm', condFwd: false }, (x) => { x.dc.forwarders.push('192.0.2.99'); addServer(x, '192.0.2.99', 'resolver'); })));
  assert.equal(two.msgs.length, 4);
  assert.ok(two.msgs.every((m) => m.to !== '192.0.2.99'));
});

test('rule 5: an answer from the forwarder too (no root query when the forwarder answers)', () => {
  const s = end({ name: 'www' });
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>fwd:query@0', 'fwd>DC:answer@0', 'DC>PC:answer@0']);
});

test('rule 6: recursion off → SERVFAIL at once, even with a conditional forwarder; ra clear; zones still answer', () => {
  for (const name of ['crm', 'www']) {
    const s = end({ name, recursion: false });
    assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>PC:servfail@0'], name);
    assert.equal(s.msgs[1].ra, false);
    ['cond', 'fwd', 'hints'].forEach((k) => assert.equal(s.table.rows.find((r) => r.kind === k).note, 'norec', k));
  }
  const z = end({ name: 'fs1', recursion: false });
  assert.equal(z.msgs[1].kind, 'answer');
  assert.equal(z.msgs[1].ra, false);
});

test('rule 7: answers are cached for their TTL; the repeat 60 s later comes from the cache with 3540 s left', () => {
  const s = end({ name: 'www', repeat: true });
  assert.deepEqual(route(lookup(s, 2)), ['PC>DC:query@60', 'DC>PC:answer@60']);
  assert.equal(s.msgs[5].fromCache, true);
  assert.equal(s.msgs[5].ttl, 3540);
  assert.equal(s.outcome[1].rule, 'cache');
  assert.equal(s.table.rows[0].hit, true);
});

test('rule 7: NXDOMAIN is cached for min(SOA TTL, MINIMUM) capped at 900 s, and the repeat is answered from it', () => {
  const s = end({ name: 'crm', condFwd: false, repeat: true });
  assert.equal(s.msgs[2].ttl, 86400, 'the forwarder sends the root SOA: 86400 / 86400');
  const neg = logic.find(s.cache, 'crm.partner.example', 'NXDOMAIN');
  assert.equal(neg.ttl, 900);
  assert.equal(logic.MAX_NEG_TTL, 900);
  assert.deepEqual(route(lookup(s, 2)), ['PC>DC:query@60', 'DC>PC:nxdomain@60']);
  assert.equal(s.msgs[5].ttl, 840);
  assert.equal(logic.negTtl({ ttl: 3600, minimum: 300 }), 300);
});

test('rule 7: the cache comes before the zone, the conditional forwarder and the forwarders', () => {
  const sc = scene({ name: 'crm' });
  const cache = logic.hints().concat([{ name: 'crm.partner.example', type: 'A', data: ['10.20.5.8'], ttl: 3600, expiresAt: 3600, negative: false }]);
  const ev = logic.evaluate(sc.dc, cache, sc.name, 0, []);
  assert.equal(ev.win, 0);
  assert.equal(logic.evaluate(sc.dc, cache, sc.name, 3600, []).win, 2, 'expired: the conditional forwarder again');
});

test('rule 7: SERVFAIL is not cached: the repeat waits 3 s again', () => {
  const s = end({ name: 'www', forwarderUp: false, rootHints: false, repeat: true });
  assert.deepEqual(route(lookup(s, 2)), ['PC>DC:query@63', 'DC>fwd:query✕@63', 'DC>PC:servfail@66']);
});

test('rule 8: a conditional forwarder whose every target is down → SERVFAIL after its 5 s', () => {
  const s = last(runOf(scene({ name: 'crm' }, (x) => { x.up['10.20.0.53'] = false; })));
  assert.deepEqual(route(s.msgs), ['PC>DC:query@0', 'DC>partner:query✕@0', 'DC>PC:servfail@5']);
});

test('flags: rd from the client and on forwarded queries, none on iterative ones; aa only from authoritative data', () => {
  const s = end({ name: 'www', forwarderUp: false });
  assert.equal(s.msgs[0].rd, true);
  assert.equal(s.msgs[1].rd, true);
  [2, 4, 6].forEach((i) => assert.equal(s.msgs[i].rd, false));
  assert.equal(s.msgs[3].aa, false, 'referral');
  assert.equal(s.msgs[7].aa, true, 'the authoritative answer');
  assert.equal(s.msgs[8].aa, false, 'DC1 relays: not authoritative');
  assert.equal(s.msgs[8].ra, true);
  const f = end({ name: 'www' });
  assert.equal(f.msgs[2].aa, false, 'the forwarder is a resolver');
  assert.equal(f.msgs[2].ra, true);
});

test('the walk asks the first listed NS and caches each referral for its own TTL', () => {
  const s = end({ name: 'www', forwarderUp: false });
  assert.deepEqual([2, 4, 6].map((i) => s.msgs[i].server), ['a.root-servers.net', 'a.ns.org', 'ns1.example.org']);
  assert.equal(logic.find(s.cache, 'org', 'NS').ttl, 172800);
  assert.equal(logic.find(s.cache, 'example.org', 'NS').ttl, 86400);
  assert.equal(logic.find(s.cache, 'a.ns.org', 'A').expiresAt, 3 + 172800);
  assert.equal(logic.find(s.cache, 'org', 'NS').expiresAt, 3 + 172800);
  assert.equal(logic.find(s.cache, 'example.org', 'NS').expiresAt, 3 + 86400);
  const p = P({ name: 'www', forwarderUp: false });
  assert.deepEqual(kit.stateAt(logic, p, 3).touched, [{ key: '. NS', how: 'used' }], 'the root hints are used');
  assert.deepEqual(kit.stateAt(logic, p, 4).touched, [{ key: 'org NS', how: 'added' }], 'the referral is highlighted in the cache');
  assert.deepEqual(kit.stateAt(logic, p, 9).touched, [{ key: 'www.example.org A', how: 'used' }]);
});

test('more flags and TTLs: SERVFAIL keeps ra with recursion on; the partner gives aa without ra; the forwarder NXDOMAIN without aa', () => {
  const sf = end({ name: 'www', forwarderUp: false, rootHints: false });
  assert.equal(sf.msgs[2].ra, true);
  const pa = end({ name: 'crm' });
  assert.equal(pa.msgs[2].ra, false);
  assert.equal(pa.msgs[2].ttl, 3600);
  const nx = end({ name: 'crm', condFwd: false });
  assert.equal(nx.msgs[2].aa, false);
  assert.equal(nx.msgs[2].ra, true);
  const z = end({ name: 'fs1' });
  assert.equal(z.msgs[1].ttl, 3600);
  assert.equal(z.msgs[1].ra, true);
  const zn = last(runOf(scene({}, (x) => { x.name = 'nope.corp.example'; })));
  assert.equal(zn.msgs[1].ttl, 900, 'zone NXDOMAIN: min(SOA 3600, MINIMUM 900)');
});

test('outcome: message counts and cache use per lookup (they feed the comparison caption)', () => {
  const s = end({ name: 'www', repeat: true });
  assert.deepEqual(s.outcome.map((o) => [o.msgs, o.fromCache, o.out, o.start, o.end]), [[4, false, 1, 0, 0], [2, true, 0, 60, 60]]);
  const d = end({ name: 'www', forwarderUp: false, repeat: true });
  assert.deepEqual(d.outcome.map((o) => [o.msgs, o.out, o.rule]), [[9, 4, 'hints'], [2, 0, 'cache']]);
});

test('rule 6: with recursion off a valid cached answer still answers (the cache row comes first)', () => {
  const sc = scene({ name: 'www', recursion: false });
  const cache = logic.hints().concat([{ name: 'www.example.org', type: 'A', data: ['203.0.113.80'], ttl: 3600, expiresAt: 3600, negative: false }]);
  assert.equal(logic.evaluate(sc.dc, cache, sc.name, 0, []).win, 0);
  assert.equal(logic.evaluate(sc.dc, logic.hints(), sc.name, 0, []).win, -1);
});

test('rule 8: a lost conditional target waits 5 s; the rows under the failed conditional forwarder are not read', () => {
  const sc = scene({ name: 'crm' }, (x) => { x.up['10.20.0.53'] = false; });
  const r = runOf(sc);
  assert.equal(r[2].msgs[1].wait, 5);
  const s = last(r);
  const kinds = s.table.rows.map((x) => [x.kind, x.mark, x.hit]);
  assert.deepEqual(kinds, [['cache', null, false], ['zone', null, false], ['cond', 'beaten', false], ['fwd', 'skip', false], ['hints', 'skip', false]]);
  assert.equal(s.table.at, s.table.rows.length);
});

test('rule 2: an equal domain listed later gets its own note, not "shorter"', () => {
  const sc = scene({ name: 'crm' }, (s) => s.dc.condForwarders.push({ domain: 'partner.example', targets: ['10.30.0.53'], on: true }));
  assert.equal(logic.evaluate(sc.dc, logic.hints(), sc.name, 0, []).rows[3].note, 'same');
});

test('the decision table: at the query the deciding row; while waiting on the forwarder it still decides', () => {
  const p = P({ name: 'www', forwarderUp: false });
  const s0 = kit.stateAt(logic, p, 0);
  assert.equal(s0.table.at, -1);
  assert.ok(s0.table.rows.every((r) => r.hit === null));
  const s1 = kit.stateAt(logic, p, 1);
  assert.equal(s1.table.rows[s1.table.at].kind, 'fwd');
  assert.equal(s1.table.rows.find((r) => r.kind === 'hints').hit, false, 'root hints only after every forwarder timed out');
  const s2 = kit.stateAt(logic, p, 2);
  assert.equal(s2.table.rows[s2.table.at].kind, 'fwd');
  assert.equal(s2.table.rows[s2.table.at].note, null);
  const s3 = kit.stateAt(logic, p, 3);
  assert.equal(s3.table.rows[s3.table.at].kind, 'hints');
  assert.equal(s3.table.result, null);
  assert.equal(kit.stateAt(logic, p, 7).table.result, null, 'still waiting while DC1 asks example.org');
  assert.deepEqual(kit.stateAt(logic, p, 8).table.result, { kind: 'answer', ip: '203.0.113.80', ttl: 3600 }, 'known when the answer arrives');
  assert.deepEqual(kit.stateAt(logic, p, 9).table.result, { kind: 'answer', ip: '203.0.113.80', ttl: 3600 });
});

test('presets: the expected numbers of SPEC.md', () => {
  const cases = [
    [{ name: 'fs1' }, 2, ['answer'], 0],
    [{ name: 'crm' }, 4, ['answer'], 0],
    [{ name: 'www', repeat: true }, 6, ['answer', 'answer'], 60],
    [{ name: 'www', forwarderUp: false }, 9, ['answer'], 3],
    [{ name: 'crm', condFwd: false }, 4, ['nxdomain'], 0],
    [{ name: 'www', forwarderUp: false, rootHints: false }, 3, ['servfail'], 3],
    [{ name: 'crm', recursion: false }, 2, ['servfail'], 0],
    [{ name: 'crm', condFwd: false, forwarderUp: false }, 5, ['nxdomain'], 3],
    [{ name: 'crm', condFwd: false, forwarderUp: false, rootHints: false }, 3, ['servfail'], 3]
  ];
  for (const [over, steps, results, tEnd] of cases) {
    assert.equal(logic.steps(P(over)), steps, JSON.stringify(over));
    const s = end(over);
    assert.deepEqual(s.outcome.map((o) => o.result), results, JSON.stringify(over));
    assert.equal(s.t, tEnd, JSON.stringify(over));
  }
  assert.equal(logic.steps(logic.defaults), 2);
});

test('every run: at most 20 steps, every message between lanes of the chart, one reply per lookup', () => {
  let most = 0;
  for (const p of PARAMS) {
    const n = logic.steps(p);
    most = Math.max(most, n);
    assert.ok(n <= 20, JSON.stringify(p));
    const s = end(p);
    const lanes = logic.lanes(p);
    s.msgs.forEach((m) => { assert.ok(lanes.includes(m.from) && lanes.includes(m.to), `${m.from}>${m.to} ${JSON.stringify(p)}`); });
    assert.equal(s.msgs.filter((m) => m.to === 'PC').length, p.repeat ? 2 : 1);
    assert.equal(s.phase, 'done');
  }
  assert.equal(most, 11);
  assert.equal(logic.lanes(P({ name: 'www' })).length, 6);
  assert.equal(logic.lanes(P({ name: 'crm' })).length, 5);
});

test('firstDone: the step at which the first lookup has answered', () => {
  assert.equal(logic.firstDone(P({ name: 'www', repeat: true })), 4);
  assert.equal(logic.firstDone(P({ name: 'www', forwarderUp: false, repeat: true })), 9);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { name: 'www', forwarderUp: false, repeat: true }, { name: 'crm', condFwd: false, repeat: true }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ name: 'www', forwarderUp: false, repeat: true });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ name: 'www', forwarderUp: false, repeat: true });
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
