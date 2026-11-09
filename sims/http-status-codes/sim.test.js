// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the HTTP status codes poster. Run: node --test sims/http-status-codes/
// Order: tie-breaks, then the rules of SPEC.md §3, then the expected numbers of SPEC.md §2 and §4, then the generic block.
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
const S = (over) => logic.initial(P(over));
const card = (code) => logic.BY_CODE[code];
const codes = () => logic.CARDS.map((c) => c.code);

// ── tie-breaks (SPEC.md §5) ──

test('tie-break: a filter ends a view', () => {
  // the auth view keeps 401 and 403 active and compares them
  assert.equal(S({ view: 'auth' }).view, 'auth');
  assert.deepEqual(S({ view: 'auth' }).active, [401, 403]);
  assert.deepEqual(S({ view: 'auth' }).detail, [401, 403]);
  // a class filter or the core toggle ends it: the filter alone decides
  const s = S({ view: 'auth', class: '5xx' });
  assert.equal(s.view, null);
  assert.deepEqual(s.active, [500, 502, 503, 504]);
  assert.deepEqual(s.detail, []);
  assert.equal(S({ view: 'auth', core: true }).view, null);
  assert.deepEqual(S({ view: 'auth', core: true }).active, [200, 301, 302, 404, 500]);
  // book-five is on with core, and off without it
  assert.equal(S({ view: 'book-five', core: true }).view, 'book-five');
  assert.equal(S({ view: 'book-five' }).view, null);
});

test('tie-break: the selection beats the view\'s side-by-side detail', () => {
  assert.deepEqual(S({ view: 'whose-fault' }).detail, [404, 500, 503]);
  assert.deepEqual(S({ view: 'whose-fault', sel: '502' }).detail, [502]);
  assert.equal(S({ view: 'whose-fault', sel: '502' }).view, 'whose-fault');
});

test('tie-break: a dimmed card can still be selected', () => {
  const s = S({ class: '2xx', sel: '404' });
  assert.equal(s.selected, 404);
  assert.deepEqual(s.detail, [404]);
  const c = s.cards.find((x) => x.code === 404);
  assert.equal(c.active, false);
  assert.equal(c.selected, true);
});

test('tie-break: an unknown class, view or sel is all, no view and no selection; core only for true', () => {
  for (const k of ['constructor', '__proto__', 'toString', 'x', '', null, undefined, '6xx', 'all ']) {
    const s = S({ class: k, view: k, sel: k });
    assert.equal(s.filter.class, 'all', String(k));
    assert.equal(s.view, null, String(k));
    assert.equal(s.selected, null, String(k));
    assert.deepEqual(s.active, codes());
  }
  for (const sel of ['300', '418', '42', '4040', ' 404', '404 ', 404, '0x194', '404.0']) assert.equal(S({ sel }).selected, null, String(sel));
  for (const core of ['true', 1, 'on', {}]) assert.equal(S({ core }).filter.core, false, String(core));
  assert.equal(S({ view: 'none' }).view, null);
  // an unknown class is all and a non-true core is off, so a valid view stays on with them
  assert.equal(S({ view: 'auth', class: 'constructor' }).view, 'auth');
  assert.equal(S({ view: 'auth', class: undefined }).view, 'auth');
  assert.equal(S({ view: 'auth', core: 'true' }).view, 'auth');
  assert.equal(S({ view: 'book-five', core: 'true' }).view, null);
});

test('tie-break: cards and lists are in poster order (class, then code)', () => {
  assert.deepEqual(codes(), codes().slice().sort((a, b) => a - b));
  for (const v of logic.VIEW_IDS) {
    const s = S({ view: v, core: logic.VIEWS[v].core });
    assert.deepEqual(s.active, s.active.slice().sort((a, b) => a - b), v);
  }
  assert.deepEqual(logic.appeared(S({ class: '4xx' }), S({})), [100, 101, 200, 201, 204, 206, 301, 302, 304, 307, 308, 500, 502, 503, 504]);
});

// ── rule 1: the first digit is the class ──

test('rule 1: the first digit is the class, and every card sits in its class column', () => {
  assert.equal(logic.classOf(100), 1);
  assert.equal(logic.classOf(299), 2);
  assert.equal(logic.classOf(308), 3);
  assert.equal(logic.classOf(429), 4);
  assert.equal(logic.classOf(599), 5);
  for (const v of [99, 600, 0, -404, 404.5, '404', null]) assert.equal(logic.classOf(v), null, String(v));
  for (const c of S({}).cards) assert.equal(c.cls, Math.floor(c.code / 100));
  assert.deepEqual(logic.CLASSES.map((c) => c.letter), ['I', 'S', 'R', 'C', 'E']);
  // the class filter keeps one column
  for (const cls of logic.CLASSES) assert.ok(S({ class: cls.id }).active.every((code) => logic.classOf(code) === cls.cls), cls.id);
});

test('rule 1: whose problem: 4xx the client\'s, 5xx the server\'s (a 404 is the server answering)', () => {
  assert.deepEqual(logic.CLASSES.map((c) => c.whose), ['nobody-yet', 'nobody', 'client-acts', 'client', 'server']);
  assert.deepEqual(logic.CLASSES.map((c) => c.id), ['1xx', '2xx', '3xx', '4xx', '5xx']);
  const whose = (code) => logic.CLASSES[logic.classOf(code) - 1].whose;
  assert.equal(whose(404), 'client');
  assert.equal(whose(500), 'server');
  assert.equal(whose(503), 'server');
  assert.equal(whose(301), 'client-acts');
  // 404 is a response: there is a status line from the server
  assert.equal(card(404).ex.response.start, '404 Not Found');
});

// ── rule 2: an unknown code is read as x00 of its class ──

test('rule 2: unknown codes are read as x00; invalid ones as a server error', () => {
  assert.equal(logic.readAs(471), 400); // RFC 9110 §15's own example
  assert.equal(logic.readAs(299), 200);
  assert.equal(logic.readAs(150), 100);
  assert.equal(logic.readAs(399), 300); // 300 is not on the poster, still the x00
  assert.equal(logic.readAs(418), 400);
  assert.equal(logic.readAs(599), 500);
  for (const c of codes()) assert.equal(logic.readAs(c), c, String(c));
  for (const v of [600, 99, 0, 999, 404.5, '404', null, undefined, NaN]) assert.equal(logic.readAs(v), 500, String(v));
});

// ── rule 3: redirects carry the new URI in Location ──

test('rule 3: 301, 302, 307 and 308 carry Location, and the follow-up asks for exactly that URI', () => {
  const reds = codes().filter((c) => logic.redirect(c));
  assert.deepEqual(reds, [301, 302, 307, 308]);
  for (const code of reds) {
    const ex = card(code).ex;
    const loc = logic.header(ex.response, 'Location');
    assert.ok(loc, code + ' has Location');
    assert.equal(ex.response.start.split(' ')[0], String(code), 'the status line carries only the code');
    assert.ok(!ex.response.start.includes(loc), 'the URI is not in the status line');
    assert.equal(ex.followUp.same, false);
    assert.equal(logic.requestLine(ex.followUp.request).target, loc, code + ' follows Location');
  }
  // header() matches the whole field name, case-insensitive: Content-Location is not Location
  assert.equal(logic.header({ headers: ['Content-Location: /x'] }, 'Location'), null);
  assert.equal(logic.header({ headers: ['location: /y'] }, 'Location'), '/y');
  // 304 is a 3xx without Location
  assert.equal(logic.redirect(304), null);
  assert.equal(logic.header(card(304).ex.response, 'Location'), null);
});

test('rule 3: 301/308 permanent, 302/307 temporary; 307/308 keep the method', () => {
  assert.deepEqual(logic.redirect(301), { permanent: true, keepsMethod: false });
  assert.deepEqual(logic.redirect(302), { permanent: false, keepsMethod: false });
  assert.deepEqual(logic.redirect(307), { permanent: false, keepsMethod: true });
  assert.deepEqual(logic.redirect(308), { permanent: true, keepsMethod: true });
  for (const code of [301, 302, 307, 308]) {
    const ex = card(code).ex;
    const m0 = logic.requestLine(ex.request).method, m1 = logic.requestLine(ex.followUp.request).method;
    if (logic.redirect(code).keepsMethod) {
      assert.equal(m1, m0, code + ' keeps the method');
      assert.notEqual(m0, 'GET', code + ' shows a method that could change');
    } else {
      assert.equal(m1, 'GET', code + ' follows with GET');
    }
  }
  assert.equal(logic.redirect(300), null);
  assert.equal(logic.redirect('constructor'), null);
});

test('rule 3: Primjer 3: GET /proizvodi → 301 + Location: /katalog → GET /katalog → 200, two requests for one click', () => {
  const s = S({ view: 'redirect', sel: '301' });
  assert.deepEqual(s.detail, [301]);
  const c = s.cards.find((x) => x.code === 301);
  assert.equal(c.example.request.start, 'GET /proizvodi');
  assert.equal(c.example.response.start, '301 Moved Permanently');
  assert.deepEqual(c.example.response.headers, ['Location: /katalog']);
  assert.equal(c.example.followUp.request.start, 'GET /katalog');
  assert.equal(c.example.followUp.response.start, '200 OK');
  assert.deepEqual(c.messages, { requests: 2, responses: 2 });
  assert.deepEqual(s.active, [200, 301]);
});

// ── rule 4: 304 answers a conditional request; no body ──

test('rule 4: 304 answers a conditional GET or HEAD and has no body', () => {
  const ex = card(304).ex;
  const rl = logic.requestLine(ex.request);
  assert.ok(['GET', 'HEAD'].includes(rl.method));
  assert.ok(logic.header(ex.request, 'If-None-Match') || logic.header(ex.request, 'If-Modified-Since'));
  assert.equal(ex.response.body, false);
  assert.equal(ex.followUp, null);
  // the validator the client sent is the one the server confirms
  assert.equal(logic.header(ex.response, 'ETag'), logic.header(ex.request, 'If-None-Match'));
  // no body either: 1xx and 204; every other response has one
  const noBody = codes().filter((c) => card(c).ex.response.body === false);
  assert.deepEqual(noBody, [100, 101, 204, 304]);
  // only 304 answers a conditional request
  assert.deepEqual(codes().filter((c) => logic.header(card(c).ex.request, 'If-None-Match')), [304]);
});

// ── rule 5: 401 authenticate, 403 no ──

test('rule 5: 401 asks to authenticate; 403 refuses even with credentials', () => {
  const a = card(401).ex, f = card(403).ex;
  assert.ok(logic.header(a.response, 'WWW-Authenticate'), '401 MUST carry WWW-Authenticate');
  assert.equal(logic.header(a.request, 'Authorization'), null);
  assert.ok(logic.header(a.followUp.request, 'Authorization'));
  assert.equal(a.followUp.response.start, '200 OK');
  assert.ok(logic.header(f.request, 'Authorization'), '403 came with credentials');
  assert.equal(logic.header(f.response, 'WWW-Authenticate'), null);
  assert.equal(f.followUp, null);
  assert.deepEqual(logic.messages(401), { requests: 2, responses: 2 });
  assert.deepEqual(logic.messages(403), { requests: 1, responses: 1 });
});

// ── rule 6: the card set and the core set ──

test('rule 6: the card set and the core set of URM ch14', () => {
  assert.deepEqual(codes(), [100, 101, 200, 201, 204, 206, 301, 302, 304, 307, 308, 400, 401, 403, 404, 405, 409, 429, 500, 502, 503, 504]);
  assert.deepEqual(logic.CORE, [200, 301, 302, 404, 500]);
  assert.deepEqual(S({ core: true }).active, [200, 301, 302, 404, 500]);
  // the reason phrase follows the code in the status line
  for (const c of logic.CARDS) assert.equal(c.ex.response.start, c.code + ' ' + c.phrase, String(c.code));
  // only 429 comes from RFC 6585, and it is the one marked (check)
  assert.deepEqual(logic.CARDS.filter((c) => c.check).map((c) => c.code), [429]);
  assert.deepEqual(logic.CARDS.filter((c) => !c.rfc.startsWith('RFC 9110 §15.')).map((c) => c.code), [429]);
});

test('rule 6: the card data is SPEC.md §2: phrases, RFC sections, requests, responses and follow-ups', () => {
  const line = (m) => [m.start].concat(m.headers).join(' + ') + (m.body ? '' : ' (no body)');
  const T = {
    100: ['Continue', '9110 §15.2.1', 'POST /narudzbe + Expect: 100-continue', '100 Continue (no body)', ' → 201 Created + Location: /narudzbe/42'],
    101: ['Switching Protocols', '9110 §15.2.2', 'GET /chat + Connection: Upgrade + Upgrade: websocket', '101 Switching Protocols + Connection: Upgrade + Upgrade: websocket (no body)', null],
    200: ['OK', '9110 §15.3.1', 'GET /katalog', '200 OK', null],
    201: ['Created', '9110 §15.3.2', 'POST /narudzbe', '201 Created + Location: /narudzbe/42', null],
    204: ['No Content', '9110 §15.3.5', 'DELETE /kosarica/7', '204 No Content (no body)', null],
    206: ['Partial Content', '9110 §15.3.7', 'GET /katalog.pdf + Range: bytes=0-999', '206 Partial Content + Content-Range: bytes 0-999/48000', null],
    301: ['Moved Permanently', '9110 §15.4.2', 'GET /proizvodi', '301 Moved Permanently + Location: /katalog', 'GET /katalog → 200 OK'],
    302: ['Found', '9110 §15.4.3', 'GET /akcija', '302 Found + Location: /akcija-studeni', 'GET /akcija-studeni → 200 OK'],
    304: ['Not Modified', '9110 §15.4.5', 'GET /katalog + If-None-Match: "v7"', '304 Not Modified + ETag: "v7" (no body)', null],
    307: ['Temporary Redirect', '9110 §15.4.8', 'POST /narudzbe', '307 Temporary Redirect + Location: /pricuva/narudzbe', 'POST /pricuva/narudzbe → 201 Created + Location: /pricuva/narudzbe/42'],
    308: ['Permanent Redirect', '9110 §15.4.9', 'PUT /cjenik', '308 Permanent Redirect + Location: /v2/cjenik', 'PUT /v2/cjenik → 200 OK'],
    400: ['Bad Request', '9110 §15.5.1', 'GET /trazi?q=%zz', '400 Bad Request', null],
    401: ['Unauthorized', '9110 §15.5.2', 'GET /admin', '401 Unauthorized + WWW-Authenticate: Basic realm="admin"', 'GET /admin + Authorization: Basic … → 200 OK'],
    403: ['Forbidden', '9110 §15.5.4', 'GET /admin + Authorization: Basic …', '403 Forbidden', null],
    404: ['Not Found', '9110 §15.5.5', 'GET /katalog/stari', '404 Not Found', null],
    405: ['Method Not Allowed', '9110 §15.5.6', 'DELETE /katalog', '405 Method Not Allowed + Allow: GET, HEAD', null],
    409: ['Conflict', '9110 §15.5.10', 'PUT /cjenik', '409 Conflict', null],
    429: ['Too Many Requests', '6585 §4', 'GET /trazi?q=papir', '429 Too Many Requests + Retry-After: 60', null],
    500: ['Internal Server Error', '9110 §15.6.1', 'GET /katalog', '500 Internal Server Error', null],
    502: ['Bad Gateway', '9110 §15.6.3', 'GET /katalog', '502 Bad Gateway', null],
    503: ['Service Unavailable', '9110 §15.6.4', 'GET /katalog', '503 Service Unavailable + Retry-After: 120', null],
    504: ['Gateway Timeout', '9110 §15.6.5', 'GET /katalog', '504 Gateway Timeout', null]
  };
  assert.deepEqual(Object.keys(T).map(Number), codes());
  for (const c of logic.CARDS) {
    const [phrase, rfc, req, resp, follow] = T[c.code];
    assert.equal(c.phrase, phrase, c.code);
    assert.equal(c.rfc, 'RFC ' + rfc, c.code);
    assert.equal(line(c.ex.request), req, c.code);
    assert.equal(line(c.ex.response), resp, c.code);
    const f = c.ex.followUp;
    assert.equal(f ? [f.request.start].concat(f.request.headers).filter(Boolean).join(' + ') + ' → ' + line(f.response) : null, follow, c.code);
  }
  // a 9110 card's section sits under its class: §15.(class + 1)
  for (const c of logic.CARDS) if (c.rfc.startsWith('RFC 9110')) assert.ok(c.rfc.startsWith('RFC 9110 §15.' + (logic.classOf(c.code) + 1) + '.'), c.code);
  // what the client does after the last response (SPEC.md §2's follow-up column)
  const after = {};
  for (const c of logic.CARDS) if (c.after) after[c.code] = c.after;
  assert.deepEqual(after, { 101: 'switched', 304: 'useStored', 403: 'noRetry' });
});

// ── expected numbers (SPEC.md §2, §4) ──

test('numbers: 22 cards; per class 2, 4, 5, 7, 4', () => {
  assert.equal(logic.CARDS.length, 22);
  const want = { '1xx': 2, '2xx': 4, '3xx': 5, '4xx': 7, '5xx': 4, all: 22 };
  for (const id of logic.CLASS_IDS) assert.equal(S({ class: id }).active.length, want[id], id);
});

test('numbers: core 5; 3xx + core 2; 1xx + core 0', () => {
  assert.equal(S({ core: true }).active.length, 5);
  assert.deepEqual(S({ class: '3xx', core: true }).active, [301, 302]);
  assert.deepEqual(S({ class: '1xx', core: true }).active, []);
  const perClass = logic.CLASSES.map((c) => S({ class: c.id, core: true }).active.length);
  assert.deepEqual(perClass, [0, 1, 2, 1, 1]);
});

test('numbers: requests and responses per click', () => {
  const two = codes().filter((c) => logic.messages(c).requests === 2);
  assert.deepEqual(two, [301, 302, 307, 308, 401]);
  assert.deepEqual(logic.messages(100), { requests: 1, responses: 2 }); // an interim and the final response
  for (const c of codes()) if (![100, 301, 302, 307, 308, 401].includes(c)) assert.deepEqual(logic.messages(c), { requests: 1, responses: 1 }, String(c));
  assert.equal(logic.messages(418), null);
});

test('numbers: views and their active sets and detail', () => {
  const want = {
    'book-five': { p: { core: true }, active: [200, 301, 302, 404, 500], detail: [] },
    'redirect': { p: {}, active: [200, 301], detail: [301] },
    'whose-fault': { p: {}, active: [404, 500, 503], detail: [404, 500, 503] },
    'cache': { p: {}, active: [304], detail: [304] },
    'auth': { p: {}, active: [401, 403], detail: [401, 403] }
  };
  for (const v of Object.keys(want)) {
    const s = S(Object.assign({ view: v }, want[v].p));
    assert.equal(s.view, v);
    assert.deepEqual(s.active, want[v].active, v);
    assert.deepEqual(s.detail, want[v].detail, v);
  }
});

test('numbers: changed = the cards that appeared with the last filter', () => {
  assert.deepEqual(logic.appeared(S({ class: '4xx' }), S({ class: '5xx' })), [500, 502, 503, 504]);
  assert.deepEqual(logic.appeared(S({}), S({ class: '4xx' })), []);
  assert.equal(logic.appeared(S({ core: true }), S({})).length, 17);
  assert.deepEqual(logic.appeared(null, S({})), []);
});

// ── generic checks every sim keeps ──

test('a reference page: no steps, and step changes nothing', () => {
  assert.equal(logic.steps, 0);
  const s = S({ class: '3xx', sel: '301' });
  assert.deepEqual(logic.step(s, 1, P({})), s);
});

test('state is JSON-safe for every param combination', () => {
  for (const cls of logic.CLASS_IDS) for (const core of [false, true]) for (const view of logic.VIEW_IDS) {
    for (const sel of ['', '301', '404']) {
      const s = S({ class: cls, core, view, sel });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      // the cards carry the same active set and selection as the state
      assert.deepEqual(s.cards.filter((c) => c.active).map((c) => c.code), s.active);
      assert.deepEqual(s.cards.filter((c) => c.selected).map((c) => c.code), s.selected === null ? [] : [s.selected]);
    }
  }
});

test('deterministic, and the model data is not mutated', () => {
  const before = structuredClone(logic.CARDS);
  const a = S({ view: 'redirect', sel: '301' });
  a.cards[6].example.response.headers.push('x');
  a.active.push(1);
  a.detail.push(1);
  S({ view: 'auth' }).detail.push(1);
  S({ view: 'redirect' }).detail.push(1);
  assert.deepEqual(S({ view: 'redirect', sel: '301' }), logic.initial(P({ view: 'redirect', sel: '301' })));
  assert.deepEqual(logic.VIEWS.redirect.compare, [301]);
  assert.deepEqual(logic.CARDS, before);
  assert.deepEqual(logic.VIEWS.auth.compare, [401, 403]);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every card, class and message note has its words in both languages', () => {
  for (const lang of ['hr', 'en']) {
    const T = strings[lang];
    for (const c of logic.CARDS) {
      assert.ok(T['m' + c.code], lang + ' m' + c.code);
      assert.ok(T['d' + c.code], lang + ' d' + c.code);
      if (c.after) assert.ok(T['after_' + c.after], lang + ' after_' + c.after);
      const ms = [c.ex.request, c.ex.response].concat(c.ex.followUp ? [c.ex.followUp.request, c.ex.followUp.response] : []);
      for (const m of ms) if (m.note) assert.ok(T['note_' + m.note], lang + ' note_' + m.note);
    }
    for (const k of logic.CLASSES) {
      assert.ok(T['c' + k.cls], lang + ' c' + k.cls);
      assert.ok(T['w_' + k.whose], lang + ' w_' + k.whose);
    }
  }
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'reference');
  assert.equal(meta.steps, undefined);
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(presets.length, 5);
  for (const body of presets) {
    const p = {};
    for (const [, k, v] of body.matchAll(/(\w+):\s*('([^']*)'|true|false)/g)) {
      assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
      p[k] = v === 'true' ? true : v === 'false' ? false : v.slice(1, -1);
    }
    assert.ok(logic.VIEW_IDS.includes(p.view), 'preset sets a view');
    // each preset's view is on with the params the preset sets
    assert.equal(S(p).view, p.view, JSON.stringify(p));
  }
});
