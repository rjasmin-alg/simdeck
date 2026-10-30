// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for http-caching's model. Run: node --test sims/http-caching/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the button O, and the
// template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); return Array.from({ length: logic.steps(p) + 1 }, (_, n) => kit.stateAt(logic, p, n)); };
const entry = (v, cc, storedAt, initAge) => {
  const x = logic.version(v);
  return { url: logic.URL, etag: x.etag, version: v, bytes: x.bytes, cacheControl: cc, storedAt, initAge: initAge || 0 };
};
/** Step n from a hand-made state: the event comes from the schedule of p. */
const from = (s0, n, over) => logic.step(s0, n, P(over));
const base = (over, caches, originV) => {
  const s = logic.initial(P(over));
  Object.assign(s.caches, caches);
  const v = logic.version(originV || 1);
  Object.assign(s.origin, { version: v.version, etag: v.etag, bytes: v.bytes });
  return s;
};

const EVB = { cacheControl: 'max-age=60, s-maxage=300', browsers: 2 };

// ── tie-breaks ──

test('tie-break (rule 1): at age = lifetime the copy is stale, one second less it is fresh', () => {
  const e = entry(1, 'max-age=60', 0);
  assert.equal(logic.isFresh(e, 59, false), true);
  assert.equal(logic.isFresh(e, 60, false), false);
  // max-age preset: the browser's copy is exactly 60 s old at 60 s, so it revalidates instead of a hit
  const s = at({}, 3);
  assert.equal(s.now, 60);
  assert.equal(s.decisions.A, 'stale');
  assert.equal(s.got.status, 304);
});

test('tie-break (rule 1, shared): the edge copy at age = s-maxage is stale and goes to the origin', () => {
  const s = at(EVB, 5); // 300 s, A asks; the edge stored at 0 with s-maxage=300
  assert.equal(s.now, 300);
  assert.equal(s.decisions.edge, 'stale');
  assert.equal(s.reached, 'origin');
  const e = entry(1, 'max-age=60, s-maxage=300', 0);
  assert.equal(logic.isFresh(e, 299, true), true);
  assert.equal(logic.isFresh(e, 300, true), false);
});

test('tie-break (schedule): a change comes strictly between two requests, a third of the gap before the next one', () => {
  const ev = logic.schedule(P({ changes: 2 }));
  assert.deepEqual(ev.map((e) => [e.kind, e.t]), [['request', 0], ['change', 20], ['request', 30], ['request', 60], ['request', 90]]);
  const ten = logic.schedule(P({ changes: 2, interval: 10 }));
  assert.deepEqual(ten.slice(0, 3).map((e) => e.t), [0, 7, 10]);
  assert.equal(logic.schedule(P({ changes: 2, interval: 20 }))[1].t, 14, 'rounded down, not to the nearest');
});

// ── rules ──

test('rule 2: a shared cache takes s-maxage, a private one max-age; without max-age the lifetime is 0', () => {
  assert.equal(logic.lifetime('max-age=60, s-maxage=300', true), 300);
  assert.equal(logic.lifetime('max-age=60, s-maxage=300', false), 60);
  assert.equal(logic.lifetime('max-age=60', true), 60);
  assert.equal(logic.lifetime('private, max-age=60', false), 60);
  assert.equal(logic.lifetime('no-cache', false), 0);
  assert.equal(logic.lifetime('no-cache', true), 0);
  assert.equal(logic.lifetime('Max-Age=45', false), 45, 'directive names are case-insensitive');
});

test('rule 3: age = the Age it arrived with + time since stored; a cache answer carries Age, an origin answer none', () => {
  const s = at(EVB, 3); // 120 s, B: from the edge
  assert.equal(s.got.status, 200);
  assert.equal(s.got.age, 120);
  assert.equal(s.hops.at(-1).age, 120);
  assert.equal(s.caches.B.initAge, 120);
  assert.equal(logic.ageOf(s.caches.B, 120), 120);
  assert.equal(logic.ageOf(s.caches.B, 150), 150);
  assert.equal(logic.isFresh(s.caches.B, 120, false), false, 'stale on arrival: 120 ≥ max-age 60');
  const o = at({}, 1); // 0 s: from the origin
  assert.ok(o.hops.filter((m) => m.dir === 'resp').every((m) => m.age === null));
  assert.equal(o.caches.A.initAge, 0);
  // a 304 from the edge's own store carries its age; the browser takes it (SPEC rule 3, 5)
  const r = at(EVB, 6); // 330 s, B: 304 from the edge, whose copy was validated at 300
  assert.equal(r.got.status, 304);
  assert.equal(r.got.age, 30);
  assert.equal(r.caches.B.initAge, 30);
  assert.equal(logic.isFresh(r.caches.B, 330, false), true);
});

test('decisions and who answered: what the captions read', () => {
  assert.deepEqual(at({}, 1).decisions, { A: 'miss', edge: 'miss', origin: 'plain' });
  assert.deepEqual(at({}, 2).decisions, { A: 'fresh' });
  assert.equal(at({}, 1).got.by, 'origin');
  assert.equal(at({}, 2).got.by, 'A');
  assert.equal(at(EVB, 3).got.by, 'edge');
  // nothing is written where nothing may be stored
  assert.deepEqual(at({ cacheControl: 'private, max-age=60' }, 1).written, { A: 'stored' });
  assert.deepEqual(at({ cacheControl: 'no-store' }, 2).written, {});
});

test('initial: one browser has one cache; the origin sends the param', () => {
  const s = logic.initial(P({ cacheControl: 'no-cache' }));
  assert.deepEqual(Object.keys(s.caches), ['A', 'edge']);
  assert.deepEqual(Object.keys(logic.initial(P({ browsers: 2 })).caches), ['A', 'B', 'edge']);
  assert.equal(s.origin.cacheControl, 'no-cache');
  assert.equal(logic.URL, 'http://www.grafo.hr/katalog');
  assert.equal(logic.version(4).bytes, 49702);
});

test('rule 4: a fresh browser copy is used with no message at all; Age is its age', () => {
  const s = at({}, 2);
  assert.equal(s.got.status, 'hit');
  assert.equal(s.got.age, 30);
  assert.deepEqual(s.hops, []);
  assert.equal(s.reached, 'A');
  assert.deepEqual(s.path, ['A']);
  assert.deepEqual(s.written, {});
});

test('rule 4 at the edge: no If-None-Match → 200 with the body; a matching one → 304 without; origin not asked', () => {
  const s = at(EVB, 3);
  assert.deepEqual(s.hops.map((m) => [m.from, m.to, m.dir]), [['B', 'edge', 'req'], ['edge', 'B', 'resp']]);
  assert.equal(s.hops[0].inm, null);
  assert.equal(s.hops[1].bytes, logic.version(1).bytes);
  assert.equal(s.decisions.edge, 'fresh');
  const r = at(EVB, 4); // 150 s, B with "v1"
  assert.equal(r.hops[0].inm, '"v1"');
  assert.equal(r.hops[1].code, 304);
  assert.equal(r.hops[1].bytes, 0);
  assert.equal(r.hops[1].age, 150);
  assert.equal(r.reached, 'edge');
  // a fresh edge copy with a different tag than the browser's: 200 from the edge
  const s0 = base({}, { A: entry(1, 'max-age=60, s-maxage=300', -100), edge: entry(2, 'max-age=60, s-maxage=300', 0) }, 2);
  const x = from(s0, 2, { cacheControl: 'max-age=60, s-maxage=300' }); // request at 30
  assert.equal(x.got.status, 200);
  assert.equal(x.got.version, 2);
  assert.equal(x.got.age, 30);
  assert.equal(x.reached, 'edge');
});

test('rule 5: a stale copy is revalidated with its ETag; unchanged → 304 with no body, the copy fresh again', () => {
  const s = at({}, 3);
  assert.deepEqual(s.hops.map((m) => m.dir === 'req' ? 'req ' + m.inm : m.code + ' ' + m.bytes),
    ['req "v1"', 'req "v1"', '304 0', '304 0']);
  assert.deepEqual(s.written, { edge: 'revalidated', A: 'revalidated' });
  assert.equal(s.caches.A.storedAt, 60);
  assert.equal(s.caches.A.initAge, 0);
  assert.equal(logic.isFresh(s.caches.A, 60, false), true);
  assert.equal(s.decisions.origin, 'match');
});

test('rule 5: changed at the origin → 200 with the new body and ETag; both copies replaced', () => {
  const s = at({ changes: 2 }, 4); // 60 s
  assert.equal(s.decisions.origin, 'changed');
  assert.deepEqual(s.hops.map((m) => m.dir === 'req' ? m.inm : m.code), ['"v1"', '"v1"', 200, 200]);
  assert.equal(s.hops[2].etag, '"v2"');
  assert.equal(s.hops[2].bytes, logic.version(2).bytes);
  assert.equal(s.caches.A.etag, '"v2"');
  assert.equal(s.caches.edge.etag, '"v2"');
  assert.deepEqual(s.written, { edge: 'stored', A: 'stored' });
});

test('rule 6: an edge with no copy forwards the browser\'s If-None-Match unchanged and passes the 304 back', () => {
  const s = at({ cacheControl: 'private, max-age=60' }, 3); // 60 s, the edge holds nothing
  assert.equal(s.decisions.edge, 'miss');
  assert.deepEqual(s.hops.map((m) => [m.from, m.to, m.dir === 'req' ? m.inm : m.code]),
    [['A', 'edge', '"v1"'], ['edge', 'origin', '"v1"'], ['origin', 'edge', 304], ['edge', 'A', 304]]);
  assert.equal(s.got.by, 'origin');
  assert.equal(s.caches.edge, null);
});

test('rule 6: an edge with a stale copy validates its own tag, then answers the browser from it', () => {
  // the browser holds v1, the edge a stale v2, the origin is at v2
  const s0 = base({}, { A: entry(1, 'max-age=60', -100), edge: entry(2, 'max-age=60', -100) }, 2);
  const s = from(s0, 2, {}); // request at 30
  assert.deepEqual(s.hops.map((m) => m.dir === 'req' ? m.inm : m.code), ['"v1"', '"v2"', 304, 200]);
  assert.equal(s.hops[3].bytes, logic.version(2).bytes, 'the body comes from the edge');
  assert.equal(s.hops[2].bytes, 0);
  assert.equal(s.got.by, 'edge');
  assert.equal(s.got.age, null, 'validated with the origin for this request: no Age');
  assert.deepEqual(s.written, { edge: 'revalidated', A: 'stored' });
  // and with a matching browser tag the edge answers 304
  const s1 = base({}, { A: entry(2, 'max-age=60', -100), edge: entry(2, 'max-age=60', -100) }, 2);
  assert.deepEqual(from(s1, 2, {}).hops.map((m) => m.code || m.inm), ['"v2"', '"v2"', 304, 304]);
  // a stale edge copy behind the origin, a browser already holding the origin's version: 200 to the edge, 304 on
  const s2 = base({}, { A: entry(2, 'max-age=60', -100), edge: entry(1, 'max-age=60', -100) }, 2);
  assert.deepEqual(from(s2, 2, {}).hops.map((m) => m.code || m.inm), ['"v2"', '"v1"', 200, 304]);
});

test('rule 7: no-store — nobody stores, every request is a full 200 from the origin, never conditional', () => {
  for (const s of run({ cacheControl: 'no-store' }).slice(1)) {
    assert.equal(s.caches.A, null);
    assert.equal(s.caches.edge, null);
    assert.equal(s.got.status, 200);
    assert.equal(s.reached, 'origin');
    assert.ok(s.hops.filter((m) => m.dir === 'req').every((m) => m.inm === null));
  }
  assert.equal(logic.storable('no-store', false), false);
  assert.equal(logic.storable('no-store', true), false);
});

test('rule 7: no-cache — stored, but every use goes to the origin; 304 while unchanged', () => {
  const r = run({ cacheControl: 'no-cache' });
  assert.ok(r[1].caches.A && r[1].caches.edge, 'stored');
  for (const s of r.slice(2)) {
    assert.equal(s.decisions.A, 'nocache');
    assert.equal(s.decisions.edge, 'nocache');
    assert.equal(s.reached, 'origin');
    assert.equal(s.got.status, 304);
    assert.ok(s.hops.every((m) => m.dir === 'req' || m.bytes === 0));
  }
  // no-cache wins over a lifetime: even a copy with time left is not used
  const e = entry(1, 'no-cache, max-age=600', 0);
  assert.equal(logic.isFresh(e, 10, false), true);
  assert.equal(logic.usable(e, 10, false), false);
});

test('rule 7: private — the browser stores it, the edge never does', () => {
  for (const s of run({ cacheControl: 'private, max-age=60', browsers: 2 }).slice(1)) assert.equal(s.caches.edge, null);
  assert.equal(logic.storable('private, max-age=60', true), false);
  assert.equal(logic.storable('private, max-age=60', false), true);
  const s = at({ cacheControl: 'private, max-age=60', browsers: 2 }, 3); // B at 120: the origin, not the edge
  assert.equal(s.reached, 'origin');
  assert.equal(s.got.status, 200);
});

test('rule 8: a fresh copy hides a change at the origin until it goes stale', () => {
  const r = run({ changes: 2 });
  assert.equal(r[2].ev.kind, 'change');
  assert.equal(r[2].origin.etag, '"v2"');
  assert.deepEqual(r[2].hops, []);
  assert.equal(r[2].caches.A.etag, '"v1"', 'nobody is told');
  assert.equal(r[3].got.status, 'hit');
  assert.equal(r[3].got.etag, '"v1"');
  assert.equal(r[3].origin.etag, '"v2"');
  assert.equal(r[4].got.etag, '"v2"');
  // a change step clears what the request steps record, and the origin's new size and the log follow it
  assert.deepEqual([r[2].path, r[2].got, r[2].written, r[2].decisions, r[2].reached], [[], null, {}, {}, null]);
  assert.equal(r[2].origin.bytes, 48977);
  assert.equal(r[2].log.at(-1).version, 2);
});

// ── the schedule and the button O ──

test('schedule: one browser every interval, two browsers on A0 A1 B4 B5 A10 B11 intervals', () => {
  assert.deepEqual(logic.schedule(P({})).map((e) => e.t), [0, 30, 60, 90]);
  assert.deepEqual(logic.schedule(P({ interval: 120 })).map((e) => e.t), [0, 120, 240, 360]);
  assert.deepEqual(logic.schedule(P({ browsers: 2 })).map((e) => e.who + e.t), ['A0', 'A30', 'B120', 'B150', 'A300', 'B330']);
  assert.deepEqual([6, 7].map((k) => logic.requestAt(P({ browsers: 2 }), k)), [{ t: 360, who: 'A' }, { t: 390, who: 'B' }]);
  assert.deepEqual(logic.changesOf({ changes: 2 + 8 }), [1, 3]);
  assert.deepEqual(logic.changesOf({ changes: 1 }), [], 'bit 0 (before the first request) means nothing');
  assert.deepEqual(logic.changesOf({ changes: -2 }), []);
});

test('O: refused at step 0, on a change step, twice for the same gap, and past 20 steps', () => {
  const p = P({});
  assert.equal(logic.changeRefused(p, 0), 'first');
  assert.equal(logic.changeRefused(p, 1), null);
  assert.equal(logic.withChange(p, 1), 2);
  const q = P({ changes: 2 });
  assert.equal(logic.changeRefused(q, 1), 'already');
  assert.equal(logic.changeRefused(q, 2), 'already', 'a change step');
  assert.equal(logic.changeRefused(q, 3), null);
  // at the last request a change brings one more request: two steps
  assert.equal(logic.withChange(p, 4), 16);
  assert.equal(logic.steps(P({ changes: 16 })), 6);
  assert.deepEqual(logic.schedule(P({ changes: 16 })).slice(-2).map((e) => [e.kind, e.t]), [['change', 110], ['request', 120]]);
  // fill up: every gap changed up to 20 steps
  let r = P({});
  for (let n = 1; n <= logic.MAX_STEPS; n++) if (!logic.changeRefused(r, n)) r = P({ changes: logic.withChange(r, n) });
  assert.ok(logic.steps(r) <= logic.MAX_STEPS);
  assert.ok(logic.steps(r) >= logic.MAX_STEPS - 1);
  const last = logic.steps(r);
  assert.equal(logic.changeRefused(r, last), 'full');
  const cut = logic.schedule(P({ changes: Math.pow(2, 20) - 2 }));
  assert.ok(cut.length <= logic.MAX_STEPS, 'a hand-made URL is cut at 20 steps');
  assert.equal(cut.at(-1).kind, 'request', 'never ending on a change whose request is cut off');
  // exactly 20 is allowed: 18 steps + a change and the request it brings; 19 + a change before an existing request
  assert.equal(logic.changeRefused(P({ changes: 2032 }), 18), null);
  assert.equal(logic.steps(P({ changes: logic.withChange(P({ changes: 2032 }), 18) })), 20);
  assert.equal(logic.changeRefused(P({ changes: 2034 }), 3), null);
});

test('O: the change after step n is step n + 1 and the steps before it stay the same', () => {
  const p = P({});
  const q = P({ changes: logic.withChange(p, 2) });
  for (let n = 0; n <= 2; n++) assert.deepEqual(kit.stateAt(logic, q, n), kit.stateAt(logic, p, n));
  assert.equal(kit.stateAt(logic, q, 3).ev.kind, 'change');
});

// ── the presets (SPEC.md, expected numbers) ──

const brief = (s) => s.ev.kind === 'change' ? 'change ' + s.now + ' ' + s.origin.etag
  : [s.now, s.ev.who, s.got.status, s.got.etag, s.got.age === null ? '-' : s.got.age, s.path.join('>')].join(' ');

test('preset max-age: 200 origin, hit Age 30, 304 at the tie, hit Age 30', () => {
  assert.deepEqual(run({}).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', '30 A hit "v1" 30 A', '60 A 304 "v1" - A>edge>origin', '90 A hit "v1" 30 A']);
});

test('preset changed-file: v1 from the cache at 30 s although the origin has v2; 200 with v2 at 60 s', () => {
  assert.deepEqual(run({ changes: 2 }).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', 'change 20 "v2"', '30 A hit "v1" 30 A', '60 A 200 "v2" - A>edge>origin', '90 A hit "v2" 30 A']);
});

test('preset no-cache and no-store: every request reaches the origin', () => {
  assert.deepEqual(run({ cacheControl: 'no-cache' }).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', '30 A 304 "v1" - A>edge>origin', '60 A 304 "v1" - A>edge>origin', '90 A 304 "v1" - A>edge>origin']);
  assert.deepEqual(run({ cacheControl: 'no-store' }).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', '30 A 200 "v1" - A>edge>origin', '60 A 200 "v1" - A>edge>origin', '90 A 200 "v1" - A>edge>origin']);
});

test('preset edge-vs-browser: B\'s first request at 120 s is answered by the edge; private keeps the edge empty', () => {
  assert.deepEqual(run(EVB).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', '30 A hit "v1" 30 A', '120 B 200 "v1" 120 B>edge', '150 B 304 "v1" 150 B>edge',
    '300 A 304 "v1" - A>edge>origin', '330 B 304 "v1" 30 B>edge']);
  assert.deepEqual(run({ cacheControl: 'private, max-age=60', browsers: 2 }).slice(1).map(brief), [
    '0 A 200 "v1" - A>edge>origin', '30 A hit "v1" 30 A', '120 B 200 "v1" - B>edge>origin', '150 B hit "v1" 30 B',
    '300 A 304 "v1" - A>edge>origin', '330 B 304 "v1" - B>edge>origin']);
});

test('steps per preset: 4, 5, 4, 4, 6', () => {
  assert.deepEqual([{}, { changes: 2 }, { cacheControl: 'no-cache' }, { cacheControl: 'no-store' }, EVB].map((o) => logic.steps(P(o))), [4, 5, 4, 4, 6]);
});

test('the log keeps every step\'s hops in order (the chart\'s rows)', () => {
  const s = at(EVB, 6);
  assert.equal(s.log.length, 6);
  assert.deepEqual(s.log.map((x) => x.hops.length), [4, 0, 2, 2, 4, 2]);
  assert.deepEqual(s.log.at(-1).hops, s.hops);
});

test('start lines (from http-exchange)', () => {
  assert.equal(logic.startLine({ dir: 'req' }), 'GET /katalog HTTP/1.1');
  assert.equal(logic.startLine({ dir: 'resp', code: 304 }), 'HTTP/1.1 304 Not Modified');
  assert.equal(logic.startLine({ dir: 'resp', code: 200 }), 'HTTP/1.1 200 OK');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of [{}, { changes: 2 + 8 }, EVB, { cacheControl: 'no-store', browsers: 2 }]) {
    for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(Object.assign({ changes: 2 + 16 }, EVB));
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(EVB);
  for (let n = 1; n <= logic.steps(p); n++) {
    const s0 = kit.stateAt(logic, p, n - 1);
    const copy = structuredClone(s0);
    logic.step(s0, n, p);
    assert.deepEqual(s0, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const cc of [...html.matchAll(/cacheControl:\s*'([^']*)'/g)].map((m) => m[1])) assert.ok(logic.CACHE_CONTROLS.includes(cc), cc);
});
