// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-client-order's model (SPEC.md). Run: node --test sims/win-dns-client-order/
// Tie-breaks first, then the rules, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (over) => kit.stepsOf(logic, P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, steps(over));
/** A run of a hand-made scene: the page's scene with changes. */
const runWith = (over, change) => { const sc = logic.scene(P(over)); change(sc); return logic.run(sc); };
const last = (run) => run[run.length - 1];
const trail = (s) => s.tries.map((t) => t.stage + (t.server ? '@' + t.server : '') + ':' + t.result);
const fqdns = (list) => list.map((c) => c.fqdn);

const PRESETS = {
  'short-name': {},
  'search-list': { searchList: 'example.com' },
  'fqdn-dot': { typed: 'fs1.corp.example.' },
  'stale-hosts': { hostsEntry: true, repeat: true, flush: true },
  'public-alternate': { preferredUp: false, alternate: '203.0.113.53', repeat: true },
  'llmnr-answer': { typed: 'printer' }
};

// ── tie-breaks ──

test('rule 8 tie-break: two link-local answers, the first in segment order wins', () => {
  const run = runWith({ typed: 'printer' }, (sc) => { sc.segment.push({ name: 'printer', ip: '10.0.0.66', llmnr: true, netbios: true }); });
  assert.deepEqual(last(run).last.answers, ['10.0.0.77', '10.0.0.66']);
  assert.deepEqual(last(run).answer, { ip: '10.0.0.77', stage: 'llmnr' });
  const rev = runWith({ typed: 'printer' }, (sc) => { sc.segment.unshift({ name: 'printer', ip: '10.0.0.66', llmnr: true, netbios: true }); });
  assert.deepEqual(last(rev).answer, { ip: '10.0.0.66', stage: 'llmnr' });
  // the same rule for NetBIOS (LLMNR off)
  const nb = runWith({ typed: 'printer', llmnr: false }, (sc) => { sc.segment.unshift({ name: 'printer', ip: '10.0.0.66', llmnr: false, netbios: true }); });
  assert.deepEqual(last(nb).answer, { ip: '10.0.0.66', stage: 'netbios' });
});

test('rule 1 tie-break: two hosts lines for the same name, the first line wins', () => {
  const run = runWith({}, (sc) => { sc.hosts = [{ name: 'fs1', ip: '10.0.0.98' }, { name: 'FS1', ip: '10.0.0.99' }]; });
  assert.deepEqual(last(run).answer, { ip: '10.0.0.98', stage: 'hosts' });
  const rev = runWith({}, (sc) => { sc.hosts = [{ name: 'fs1', ip: '10.0.0.99' }, { name: 'fs1', ip: '10.0.0.98' }]; });
  assert.deepEqual(last(rev).answer, { ip: '10.0.0.99', stage: 'hosts' });
});

test('rule 2 tie-break: a cache entry with 0 s left is expired', () => {
  assert.equal(logic.valid({ expiresAt: 61 }, 60), true);
  assert.equal(logic.valid({ expiresAt: 60 }, 60), false);
  assert.equal(logic.valid({ expiresAt: null }, 1e9), true, 'hosts rows never expire');
  // the repeat at 60 s against a negative entry with exactly 0 s left: DNS is asked again
  const zero = runWith(PRESETS['public-alternate'], (sc) => { sc.lookups[1].at = 901; });
  assert.deepEqual(last(zero).answer, { ip: '10.0.0.21', stage: 'dns' });
  const one = runWith(PRESETS['public-alternate'], (sc) => { sc.lookups[1].at = 900; });
  assert.equal(last(one).answer, null);
  assert.equal(last(one).stages.cache, 'neg');
});

test('rule 3 tie-break: a suffix that repeats is tried once, at its first place', () => {
  const st = { primarySuffix: 'corp.example', connSuffix: 'corp.example', searchList: null, devolution: true };
  assert.deepEqual(logic.candidates('fs1', st), [{ fqdn: 'fs1.corp.example', src: 'primary' }]);
  const st2 = { primarySuffix: 'zg.corp.example', connSuffix: 'corp.example', searchList: null, devolution: true };
  assert.deepEqual(logic.candidates('fs1', st2), [{ fqdn: 'fs1.zg.corp.example', src: 'primary' }, { fqdn: 'fs1.corp.example', src: 'devolution' }]);
  assert.deepEqual(fqdns(logic.candidates('fs1', { searchList: ['a.example', 'b.example', 'a.example'] })), ['fs1.a.example', 'fs1.b.example']);
});

// ── rules ──

test('rule 1: a hosts entry wins over DNS, which is never asked', () => {
  const s = end({ hostsEntry: true });
  assert.deepEqual(trail(s), ['hosts:ok']);
  assert.deepEqual(s.answer, { ip: '10.0.0.99', stage: 'hosts' });
  assert.equal(s.stages.dns, 'idle');
  assert.deepEqual(s.queries, []);
  // it matches the name as typed (a final dot ignored), not another name
  assert.equal(end({ hostsEntry: true, typed: 'fs1.' }).answer.stage, 'hosts');
  assert.equal(end({ hostsEntry: true, typed: 'fs1.corp.example' }).answer.ip, '10.0.0.21');
  // it matches a candidate FQDN too
  const fq = runWith({}, (sc) => { sc.hosts = [{ name: 'fs1.corp.example', ip: '10.0.0.98' }]; });
  assert.deepEqual(last(fq).answer, { ip: '10.0.0.98', stage: 'hosts' });
});

test('rule 2: the cache is checked before DNS; a positive entry answers', () => {
  const s = end({ repeat: true });
  assert.deepEqual(trail(s), ['hosts:no', 'cache:no', 'dns@10.0.0.10:ok', 'hosts:no', 'cache:ok']);
  assert.deepEqual(s.answer, { ip: '10.0.0.21', stage: 'cache' });
  assert.equal(s.cache.find((r) => r.name === 'fs1.corp.example').expiresAt - s.t, 1140, 'TTL 1200 s, 60 s later');
});

test('rule 2: a negative entry rules the name out for DNS for 900 s; the fallbacks still run', () => {
  const s = end(PRESETS['public-alternate']);
  const row = s.cache.find((r) => r.name === 'fs1.corp.example');
  assert.equal(row.ip, null);
  assert.equal(row.expiresAt, 1 + logic.NEG_TTL);
  assert.equal(row.expiresAt - s.t, 841);
  assert.equal(s.stages.cache, 'neg');
  assert.equal(s.stages.dns, 'skip', 'no server asked in the repeat');
  assert.equal(s.queries.length, 0);
  assert.deepEqual(trail(s).slice(6), ['hosts:no', 'cache:neg', 'llmnr:no', 'netbios:no']);
  // with two candidates, a negative entry for the first sends DNS to the second only
  const two = runWith({ repeat: true }, (sc) => {
    sc.settings.searchList = ['example.com', 'corp.example'];
    sc.lookups[0].up = {};
  });
  assert.deepEqual(trail(last(two)), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx', 'dns@10.0.0.10:ok', 'hosts:no', 'cache:ok']);
});

test('rule 2: a negative entry for one candidate leaves the others to DNS', () => {
  // lookup 1 caches fs1.example.com as negative (NXDOMAIN), fs1.corp.example as positive; lookup 2 answers from cache
  const run = runWith({ repeat: true }, (sc) => { sc.settings.searchList = ['example.com', 'corp.example']; });
  const s = last(run);
  assert.deepEqual(s.candidates.map((c) => c.result), ['neg', 'cache']);
  assert.deepEqual(s.answer, { ip: '10.0.0.21', stage: 'cache' });
  // negative for the first, nothing for the second: DNS asks the second only
  const run2 = runWith({ repeat: true }, (sc) => {
    sc.settings.searchList = ['example.com', 'corp.example'];
    sc.ttl = 30; // the positive entry is gone by 60 s
  });
  const s2 = last(run2);
  assert.deepEqual(trail(s2).slice(4), ['hosts:no', 'cache:neg', 'dns@10.0.0.10:ok']);
  assert.equal(s2.queries[0].fqdn, 'fs1.corp.example');
});

test('rule 3: a single-label name gets the primary suffix, then devolution, then the connection suffix', () => {
  assert.deepEqual(logic.candidates('fs1', logic.scene(P({})).settings), [{ fqdn: 'fs1.corp.example', src: 'primary' }]);
  const st = { primarySuffix: 'zg.hr.corp.example', connSuffix: 'lab.example', searchList: null, devolution: true };
  assert.deepEqual(logic.candidates('FS1', st), [
    { fqdn: 'fs1.zg.hr.corp.example', src: 'primary' },
    { fqdn: 'fs1.hr.corp.example', src: 'devolution' },
    { fqdn: 'fs1.corp.example', src: 'devolution' },
    { fqdn: 'fs1.lab.example', src: 'connection' }
  ]);
  assert.deepEqual(fqdns(logic.candidates('fs1', Object.assign({}, st, { devolution: false }))), ['fs1.zg.hr.corp.example', 'fs1.lab.example']);
});

test('rule 3: a search list replaces the primary suffix, devolution and the connection suffix', () => {
  const st = { primarySuffix: 'zg.corp.example', connSuffix: 'lab.example', searchList: ['example.com', 'corp.example'], devolution: true };
  assert.deepEqual(logic.candidates('fs1', st), [{ fqdn: 'fs1.example.com', src: 'list' }, { fqdn: 'fs1.corp.example', src: 'list' }]);
  const s = end(PRESETS['search-list']);
  assert.deepEqual(fqdns(s.candidates), ['fs1.example.com']);
  assert.ok(!s.queries.some((q) => q.fqdn === 'fs1.corp.example'), 'fs1.corp.example is never asked');
});

test('rule 3: a name with a final dot is tried only as typed', () => {
  const st = logic.scene(P({ searchList: 'example.com' })).settings;
  assert.deepEqual(logic.candidates('fs1.corp.example.', st), [{ fqdn: 'fs1.corp.example', src: 'typed' }]);
  assert.deepEqual(logic.candidates('fs1.', st), [{ fqdn: 'fs1', src: 'typed' }]);
  assert.deepEqual(trail(end({ typed: 'fs1.' })), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx']);
});

test('rule 4: a dotted name is tried as typed; suffixes only with appendMulti', () => {
  const st = logic.scene(P({})).settings;
  assert.deepEqual(logic.candidates('fs1.corp.example', st), [{ fqdn: 'fs1.corp.example', src: 'typed' }]);
  assert.deepEqual(logic.candidates('fs1.lab', Object.assign({}, st, { appendMulti: true })),
    [{ fqdn: 'fs1.lab', src: 'typed' }, { fqdn: 'fs1.lab.corp.example', src: 'primary' }]);
});

test('rule 5: the alternate is asked only when the preferred does not answer within 1 s', () => {
  // preferred up: the alternate is never asked, whatever the answer
  assert.deepEqual(trail(end({ alternate: '10.0.0.11' })), ['hosts:no', 'cache:no', 'dns@10.0.0.10:ok']);
  // preferred down: the alternate at t = 1 s
  const s = at({ preferredUp: false, alternate: '10.0.0.11' }, 3);
  assert.equal(s.last.result, 'timeout');
  assert.equal(s.t, 1);
  assert.deepEqual(s.next, { phase: 'dns', cand: 0, srv: 1, waited: 1 });
  const e = end({ preferredUp: false, alternate: '10.0.0.11' });
  assert.deepEqual(trail(e), ['hosts:no', 'cache:no', 'dns@10.0.0.10:timeout', 'dns@10.0.0.11:ok']);
  assert.equal(e.answer.ip, '10.0.0.21');
  assert.equal(e.t, 1);
});

test('rule 5: NXDOMAIN from the preferred is an answer, the alternate is not asked', () => {
  const s = end({ typed: 'printer', alternate: '10.0.0.11' });
  assert.deepEqual(trail(s), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx', 'llmnr:ok']);
  // the public alternate's NXDOMAIN ends DNS the same way
  assert.deepEqual(trail(end({ preferredUp: false, alternate: '203.0.113.53' })).slice(2, 4), ['dns@10.0.0.10:timeout', 'dns@203.0.113.53:nx']);
});

test('rule 5: nobody answers → give up 10 s after the first query; nothing cached', () => {
  const one = end({ preferredUp: false });
  assert.deepEqual(trail(one), ['hosts:no', 'cache:no', 'dns@10.0.0.10:timeout', 'llmnr:no', 'netbios:no']);
  assert.equal(one.t, logic.GIVE_UP);
  assert.deepEqual(one.cache, []);
  const both = runWith({ preferredUp: false, alternate: '10.0.0.11' }, (sc) => { sc.lookups[0].up['10.0.0.11'] = false; });
  assert.deepEqual(last(both).queries.map((q) => q.wait), [1, 9]);
  assert.equal(last(both).t, 10);
  assert.equal(last(both).candidates[0].result, 'timeout');
});

test('rule 6: LLMNR, then NetBIOS, only after DNS failed and only for a name without a dot', () => {
  assert.deepEqual(trail(end({ typed: 'printer' })).slice(-1), ['llmnr:ok']);
  assert.deepEqual(trail(end({ typed: 'printer', llmnr: false })), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx', 'netbios:ok']);
  assert.equal(end({ typed: 'printer', llmnr: false }).stages.llmnr, 'skip');
  assert.deepEqual(trail(end({ typed: 'printer', llmnr: false, netbios: false })), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx']);
  assert.equal(end({ typed: 'printer', llmnr: false, netbios: false }).answer, null);
  // a dotted name: no fallbacks
  const fq = runWith({ typed: 'fs1.corp.example', preferredUp: false }, () => {});
  assert.deepEqual(trail(last(fq)), ['hosts:no', 'cache:no', 'dns@10.0.0.10:timeout']);
  assert.equal(last(fq).stages.llmnr, 'skip');
  assert.equal(last(fq).stages.netbios, 'skip');
  assert.equal(logic.singleLabel('fs1'), true);
  assert.equal(logic.singleLabel('fs1.'), false);
  // DNS answered positively: no fallback is tried
  assert.equal(end({}).stages.llmnr, 'idle');
});

test('rule 6: any host on the link may answer; link-local answers are not cached', () => {
  const s = end({ typed: 'printer', repeat: true });
  assert.deepEqual(trail(s), ['hosts:no', 'cache:no', 'dns@10.0.0.10:nx', 'llmnr:ok', 'hosts:no', 'cache:neg', 'llmnr:ok']);
  assert.deepEqual(s.cache.map((r) => r.name), ['printer.corp.example']);
});

test('rule 7: positive answers cached for the TTL, capped at 1 day; a flush reloads the hosts entries', () => {
  assert.equal(end({}).cache[0].expiresAt, logic.RECORD_TTL);
  const capped = runWith({}, (sc) => { sc.ttl = 5 * 86400; });
  assert.equal(last(capped).cache[0].expiresAt, logic.MAX_CACHE_TTL);
  const s = end(PRESETS['stale-hosts']);
  assert.equal(s.flushed, true);
  assert.deepEqual(s.cache, [{ name: 'fs1', ip: '10.0.0.99', expiresAt: null, from: 'hosts' }]);
  // flush clears the negative entry: the repeat asks DNS again
  const f = end(Object.assign({}, PRESETS['public-alternate'], { flush: true }));
  assert.deepEqual(trail(f).slice(6), ['hosts:no', 'cache:no', 'dns@10.0.0.10:ok']);
  assert.equal(f.cache[0].expiresAt - f.t, 1200);
  // flush is ignored without the repeat
  assert.equal(logic.eff({ flush: true }).flush, false);
});

test('rule 1: hosts names match without regard to case; hosts rows are in the cache from the start', () => {
  const run = runWith({}, (sc) => { sc.hosts = [{ name: 'FS1', ip: '10.0.0.98' }]; });
  assert.deepEqual(last(run).answer, { ip: '10.0.0.98', stage: 'hosts' });
  assert.deepEqual(at({ hostsEntry: true }, 0).cache, [{ name: 'fs1', ip: '10.0.0.99', expiresAt: null, from: 'hosts' }]);
});

test('rule 3: an empty search list counts as no list', () => {
  assert.deepEqual(logic.candidates('fs1', { primarySuffix: 'corp.example', searchList: [] }), [{ fqdn: 'fs1.corp.example', src: 'primary' }]);
});

test('rule 5: every candidate starts again at the preferred server; a give-up moves on to the next candidate', () => {
  const run = runWith({ preferredUp: false, alternate: '10.0.0.11' }, (sc) => { sc.settings.searchList = ['example.com', 'corp.example']; });
  assert.deepEqual(trail(last(run)), ['hosts:no', 'cache:no', 'dns@10.0.0.10:timeout', 'dns@10.0.0.11:nx', 'dns@10.0.0.10:timeout', 'dns@10.0.0.11:ok']);
  assert.equal(last(run).t, 2);
  const gone = runWith({ preferredUp: false }, (sc) => { sc.settings.searchList = ['example.com', 'corp.example']; });
  assert.deepEqual(trail(last(gone)).slice(2, 4), ['dns@10.0.0.10:timeout', 'dns@10.0.0.10:timeout']);
  assert.equal(last(gone).t, 20);
});

test('rule 5: an answer from the alternate is cached; the DNS stage ends as ok or no, never trying', () => {
  const e = end({ preferredUp: false, alternate: '10.0.0.11' });
  assert.deepEqual(e.cache, [{ name: 'fs1.corp.example', ip: '10.0.0.21', expiresAt: 1201, from: 'dns' }]);
  assert.equal(e.stages.dns, 'ok');
  assert.equal(end(PRESETS['search-list']).stages.dns, 'no');
  assert.equal(end({ preferredUp: false }).stages.dns, 'no');
  assert.equal(at({ preferredUp: false, alternate: '10.0.0.11' }, 3).stages.dns, 'trying');
});

test('rule 6: a link host answers only by the protocols it speaks; LLMNR runs with NetBIOS off', () => {
  const run = runWith({ typed: 'printer' }, (sc) => { sc.segment[0].llmnr = false; });
  assert.deepEqual(trail(last(run)).slice(-2), ['llmnr:no', 'netbios:ok']);
  const nb = runWith({ typed: 'printer', llmnr: false }, (sc) => { sc.segment[0].netbios = false; });
  assert.equal(last(nb).answer, null);
  assert.equal(end({ typed: 'printer', netbios: false }).answer.stage, 'llmnr');
});

test('the numbers of SPEC.md', () => {
  assert.equal(logic.NEG_TTL, 900);
  assert.equal(logic.MAX_CACHE_TTL, 86400);
  assert.equal(logic.GIVE_UP, 10);
  assert.equal(logic.RECORD_TTL, 1200);
  assert.equal(logic.REPEAT_AT, 60);
});

// ── presets (SPEC.md table) ──

test('presets: steps and outcomes', () => {
  const want = {
    'short-name': [3, [{ ip: '10.0.0.21', stage: 'dns' }]],
    'stale-hosts': [2, [{ ip: '10.0.0.99', stage: 'hosts' }, { ip: '10.0.0.99', stage: 'hosts' }]],
    'llmnr-answer': [4, [{ ip: '10.0.0.77', stage: 'llmnr' }]],
    'public-alternate': [10, [null, null]],
    'search-list': [5, [null]],
    'fqdn-dot': [3, [{ ip: '10.0.0.21', stage: 'dns' }]]
  };
  for (const [id, over] of Object.entries(PRESETS)) {
    const s = end(over);
    assert.equal(steps(over), want[id][0], id + ' steps');
    assert.deepEqual(s.results.concat([s.answer]), want[id][1], id + ' outcome');
    assert.equal(s.done, true, id + ' done');
  }
  assert.equal(steps(Object.assign({}, PRESETS['public-alternate'], { flush: true })), 9);
  assert.deepEqual(trail(end(PRESETS['public-alternate'])).slice(0, 6),
    ['hosts:no', 'cache:no', 'dns@10.0.0.10:timeout', 'dns@203.0.113.53:nx', 'llmnr:no', 'netbios:no']);
});

test('every page param combination stays within 11 steps and ends', () => {
  let max = 0;
  for (const typed of logic.TYPED) for (const searchList of ['none', 'example.com']) for (const alternate of logic.ALTERNATES)
    for (const preferredUp of [true, false]) for (const hostsEntry of [true, false]) for (const llmnr of [true, false])
      for (const repeat of [true, false]) for (const flush of [true, false]) {
        const over = { typed, searchList, alternate, preferredUp, hostsEntry, llmnr, repeat, flush };
        const n = steps(over);
        max = Math.max(max, n);
        assert.ok(n >= 1);
        assert.equal(at(over, n).done, true);
        assert.equal(at(over, n - 1).done, false);
      }
  assert.equal(max, 11);
});

test('params are cleaned', () => {
  assert.deepEqual(logic.eff({ typed: 'x', searchList: 'y', alternate: '1.2.3.4', preferredUp: 0, hostsEntry: 1, llmnr: '', repeat: 1, flush: 1 }),
    { typed: 'fs1', searchList: 'none', alternate: 'none', preferredUp: false, hostsEntry: true, llmnr: false, netbios: true, repeat: true, flush: true });
  assert.equal(steps({ typed: 'nonsense' }), 3);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of Object.values(PRESETS)) {
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const n = kit.stepsOf(logic, p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
    for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
    assert.deepEqual(forward, logic.run(logic.scene(p)), 'the page replay equals the model run');
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['public-alternate']);
  let s = logic.initial(p);
  for (let i = 1; i <= kit.stepsOf(logic, p); i++) {
    const copy = structuredClone(s);
    const next = logic.step(s, i, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, with the params of SPEC.md', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model at its defaults');
  const found = [...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)];
  assert.deepEqual(found.map((m) => m[1]), Object.keys(PRESETS));
  for (const m of found) {
    const params = Function('return ' + m[2])();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(params, PRESETS[m[1]], m[1]);
  }
});
