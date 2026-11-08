// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cors's model (rules: SPEC.md). Run: node --test sims/cors/
// Tie-breaks first, then rules 1–7, the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'same-origin': { targetOrigin: 'same' },
  'simple-blocked': {},
  'simple-allowed': { acao: 'exact' },
  preflight: { method: 'PUT', jsonBody: true, acao: 'exact', allowPut: true },
  'credentials-star': { credentials: true, acao: 'star', acac: true },
  'non-browser': { outside: true }
};

/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const end = (over) => run(over).at(-1);
const APP = { scheme: 'https', host: 'app.example', port: 443 };
const API = { scheme: 'https', host: 'api.example', port: 443 };
const res = (headers, code) => ({ code: code || 200, headers });
const ACAO = (v) => ['Access-Control-Allow-Origin', v];
const ACAC = ['Access-Control-Allow-Credentials', 'true'];

// ── tie-breaks ──

test('tie-break: a same-origin request is "same" whatever its method and headers (rule 2 before 3, 4)', () => {
  const c = logic.classify(APP, APP, 'PUT', [['Content-Type', 'application/json'], ['X-Token', '1']]);
  assert.equal(c.kind, 'same');
  assert.equal(end({ targetOrigin: 'same', method: 'PUT', jsonBody: true }).preflight, null);
  assert.equal(logic.steps(P({ targetOrigin: 'same', method: 'PUT', jsonBody: true })), 2);
});

test('tie-break: credentials, ACAO * and no ACAC fail on the *, the first test in order (rule 6)', () => {
  assert.equal(logic.corsCheck(res([ACAO('*')]), APP, true).fail, 'acao-star');
  assert.equal(end({ credentials: true, acao: 'star', acac: false }).check.fail, 'acao-star');
});

test('tie-break: a missing ACAO is reported before anything about credentials (rule 6 order)', () => {
  assert.equal(logic.corsCheck(res([]), APP, true).fail, 'acao-missing');
  assert.equal(logic.corsCheck(res([ACAC]), APP, true).fail, 'acao-missing');
});

test('tie-break: a failed preflight names the first failure: CORS check, then status, method, header (rule 4)', () => {
  // all three wrong: no ACAO, no PUT, no Content-Type → the CORS check
  const none = { code: 204, headers: [['Access-Control-Allow-Methods', 'GET, POST']] };
  assert.equal(logic.preflightCheck(none, APP, false, 'PUT', ['content-type']).fail, 'acao-missing');
  // ACAO fine, status not ok
  assert.equal(logic.preflightCheck({ code: 404, headers: [ACAO('*')] }, APP, false, 'PUT', []).fail, 'status');
  // ACAO fine, method and header missing → the method
  const both = { code: 204, headers: [ACAO('*'), ['Access-Control-Allow-Methods', 'GET, POST']] };
  assert.equal(logic.preflightCheck(both, APP, false, 'PUT', ['content-type']).fail, 'method');
  // in the run: PUT + JSON, allowPut off → method; POST + JSON → header
  assert.equal(end({ method: 'PUT', jsonBody: true, acao: 'exact' }).preflight.fail, 'method');
  assert.equal(end({ method: 'POST', jsonBody: true, acao: 'exact' }).preflight.fail, 'header');
  assert.equal(end({ method: 'POST', jsonBody: true, acao: 'exact' }).preflight.missing, 'content-type');
});

test('tie-break: a safelisted method needs no listing in Allow-Methods (rule 4)', () => {
  const r = { code: 204, headers: [ACAO('*'), ['Access-Control-Allow-Headers', 'Content-Type']] };
  assert.equal(logic.preflightCheck(r, APP, false, 'POST', ['content-type']).ok, true);
});

// ── rule 1: origins ──

test('rule 1: origin is scheme + host + port; all three must match', () => {
  assert.deepEqual(logic.compare(APP, APP), { scheme: true, host: true, port: true, same: true });
  assert.deepEqual(logic.compare(APP, API), { scheme: true, host: false, port: true, same: false });
  assert.deepEqual(logic.compare(APP, { scheme: 'https', host: 'app.example', port: 8443 }), { scheme: true, host: true, port: false, same: false });
  // http vs https: the scheme and the effective port both differ
  assert.deepEqual(logic.compare({ scheme: 'http', host: 'app.example', port: 80 }, APP), { scheme: false, host: true, port: false, same: false });
  // host comparison ignores case
  assert.equal(logic.compare(APP, { scheme: 'https', host: 'APP.example', port: 443 }).same, true);
});

test('rule 1: the serialised origin leaves a default port out', () => {
  assert.equal(logic.serialize(APP), 'https://app.example');
  assert.equal(logic.serialize({ scheme: 'http', host: 'app.example', port: 80 }), 'http://app.example');
  assert.equal(logic.serialize({ scheme: 'https', host: 'app.example', port: 8443 }), 'https://app.example:8443');
  assert.equal(logic.serialize({ scheme: 'http', host: 'app.example', port: 443 }), 'http://app.example:443');
});

test('rule 1: every target choice but "same" is cross-origin, in the parts SPEC.md lists', () => {
  const m = (t) => run({ targetOrigin: t })[0].match;
  assert.equal(m('same').same, true);
  assert.deepEqual([m('host').scheme, m('host').host, m('host').port], [true, false, true]);
  assert.deepEqual([m('port').scheme, m('port').host, m('port').port], [true, true, false]);
  assert.deepEqual([m('scheme').scheme, m('scheme').host, m('scheme').port], [false, true, false]);
  // `scheme` moves the page to http, the API stays on https (no mixed content)
  assert.equal(logic.serialize(run({ targetOrigin: 'scheme' })[0].pageOrigin), 'http://app.example');
  assert.equal(run({ targetOrigin: 'scheme' })[0].target.url, 'https://app.example/api/data');
});

// ── rules 2–4: classification ──

test('rule 2: same origin: no preflight, no check, the body goes to the script in the request step', () => {
  const r = run({ targetOrigin: 'same' });
  assert.equal(r.length - 1, 2);
  assert.equal(r[1].kind, 'same');
  assert.equal(r[2].scriptCanRead, true);
  assert.equal(r[2].delivered, '{"items":3}');
  assert.equal(r[2].check, null);
});

test('rule 3: GET, HEAD, POST with safelisted Content-Type are simple; credentials do not change that', () => {
  for (const m of ['GET', 'HEAD', 'POST']) assert.equal(logic.classify(APP, API, m, []).kind, 'simple', m);
  for (const ct of ['text/plain', 'text/plain;charset=UTF-8', 'multipart/form-data; boundary=x', 'application/x-www-form-urlencoded']) {
    assert.equal(logic.classify(APP, API, 'POST', [['Content-Type', ct]]).kind, 'simple', ct);
  }
  assert.equal(logic.classify(APP, API, 'GET', [['Origin', 'https://app.example'], ['Cookie', 'a=1']]).kind, 'simple');
  assert.equal(end({ method: 'POST' }).kind, 'simple');
  assert.equal(end({ credentials: true }).kind, 'simple');
});

test('rule 4: PUT, a custom header or application/json need a preflight; the reasons are listed', () => {
  assert.deepEqual(logic.classify(APP, API, 'PUT', []).why, { method: true, headers: [] });
  assert.equal(logic.classify(APP, API, 'GET', [['X-Token', '1']]).kind, 'preflight');
  const c = logic.classify(APP, API, 'POST', [['X-Token', '1'], ['Content-Type', 'application/json']]);
  assert.equal(c.kind, 'preflight');
  assert.deepEqual(c.why.headers, ['content-type', 'x-token'], 'lowercase, sorted');
  assert.deepEqual(logic.unsafeHeaders([['X-A', '1'], ['x-a', '2']]), ['x-a'], 'no duplicates');
});

test('rule 4: the preflight request: OPTIONS, Origin, the method, unsafe names; no Cookie, no body', () => {
  const s = end({ method: 'PUT', jsonBody: true, credentials: true, acao: 'exact', acac: true, allowPut: true });
  const pre = s.messages[0];
  assert.equal(pre.method, 'OPTIONS');
  assert.equal(pre.preflight, true);
  assert.deepEqual(pre.headers, [['Origin', 'https://app.example'], ['Access-Control-Request-Method', 'PUT'], ['Access-Control-Request-Headers', 'content-type']]);
  assert.equal(pre.body, '');
  // several unsafe names: lowercase, sorted, joined by "," without a space
  const two = logic.preflightReq(P({}), logic.intent(P({ method: 'PUT' })), ['content-type', 'x-token']);
  assert.deepEqual(logic.fieldValues(two.headers, 'Access-Control-Request-Headers'), ['content-type,x-token']);
  // PUT with text/plain: no Access-Control-Request-Headers
  const t = run({ method: 'PUT', acao: 'exact', allowPut: true })[2].messages[0];
  assert.deepEqual(logic.fieldValues(t.headers, 'Access-Control-Request-Headers'), []);
  // the actual request does carry the cookie
  assert.deepEqual(logic.fieldValues(s.messages[2].headers, 'Cookie'), [logic.COOKIE]);
});

test('rule 4: a failed preflight ends the run; the actual request is never sent', () => {
  const r = run({ method: 'PUT', jsonBody: true, acao: 'exact' });
  assert.equal(r.length - 1, 2);
  const s = r.at(-1);
  assert.equal(s.blocked, 'preflight');
  assert.equal(s.serverSaw, false);
  assert.deepEqual(s.server.log.map((l) => l.method), ['OPTIONS']);
  assert.equal(s.messages.length, 2);
  assert.equal(s.scriptCanRead, false);
  // a preflight answer without ACAO fails the same way, before the method
  assert.equal(end({ method: 'PUT', jsonBody: true, allowPut: true }).preflight.fail, 'acao-missing');
});

test('rule 4: the preflight is checked with the actual request\'s credentials', () => {
  const s = end({ method: 'PUT', credentials: true, acao: 'star', acac: true, allowPut: true });
  assert.equal(s.blocked, 'preflight');
  assert.equal(s.preflight.fail, 'acao-star');
  assert.equal(end({ method: 'PUT', credentials: true, acao: 'exact', acac: true, allowPut: true }).scriptCanRead, true);
});

// ── rules 5, 6: the CORS check ──

test('rule 5: ACAO * or the exact page origin lets the script read; missing or another origin does not', () => {
  assert.equal(logic.corsCheck(res([ACAO('*')]), APP, false).ok, true);
  assert.equal(logic.corsCheck(res([ACAO('https://app.example')]), APP, false).ok, true);
  assert.equal(logic.corsCheck(res([ACAO('https://app.example:443')]), APP, false).fail, 'acao-other', 'exact string');
  assert.equal(logic.corsCheck(res([ACAO('https://evil.example')]), APP, false).fail, 'acao-other');
  assert.equal(logic.corsCheck(res([]), APP, false).fail, 'acao-missing');
  assert.equal(end({}).check.fail, 'acao-missing');
  assert.equal(end({ acao: 'star' }).scriptCanRead, true);
  assert.equal(end({ acao: 'exact' }).scriptCanRead, true);
  // `exact` is the page's origin, also when the page is on http
  assert.equal(end({ targetOrigin: 'scheme', acao: 'exact' }).scriptCanRead, true);
});

test('rule 5: the ACAO value is compared byte for byte (no case folding)', () => {
  assert.equal(logic.corsCheck(res([ACAO('https://APP.example')]), APP, false).fail, 'acao-other');
  assert.equal(logic.corsCheck(res([ACAO('HTTPS://app.example')]), APP, true).fail, 'acao-other');
});

test('a blocked run never hands the body over: delivered stays null', () => {
  for (const over of [{}, { credentials: true, acao: 'star', acac: true }, { credentials: true, acao: 'exact' },
    { method: 'PUT', jsonBody: true, acao: 'exact' }, { method: 'POST' }]) {
    for (const s of run(over)) {
      assert.equal(s.delivered, null, JSON.stringify(over) + ' step ' + s.n);
      assert.equal(s.scriptCanRead, false);
    }
  }
  assert.equal(end({ acao: 'exact' }).delivered, '{"items":3}');
});

test('rule 6: with credentials ACAO must be exact and ACAC must be true', () => {
  assert.equal(logic.corsCheck(res([ACAO('https://app.example')]), APP, true).fail, 'acac-missing');
  assert.equal(logic.corsCheck(res([ACAO('https://app.example'), ['Access-Control-Allow-Credentials', 'TRUE']]), APP, true).fail, 'acac-missing');
  assert.equal(logic.corsCheck(res([ACAO('https://app.example'), ACAC]), APP, true).ok, true);
  assert.equal(end({ credentials: true, acao: 'exact' }).check.fail, 'acac-missing');
  assert.equal(end({ credentials: true, acao: 'exact', acac: true }).scriptCanRead, true);
  // without credentials ACAC is not needed
  assert.equal(logic.corsCheck(res([ACAO('https://app.example')]), APP, false).ok, true);
});

// ── rule 7: the browser enforces, the server only declares ──

test('rule 7: a blocked simple request reached the server; a POST was written', () => {
  const s = end({ method: 'POST' });
  assert.equal(s.blocked, 'response');
  assert.equal(s.serverSaw, true);
  assert.deepEqual(s.server.log, [{ method: 'POST', path: '/data', origin: 'https://app.example', code: 200, write: true }]);
  // the server answers the same whatever the Origin: its response is identical for the browser and the other client
  const b = end({}).messages.at(-1), o = end({ outside: true }).messages.at(-1);
  assert.deepEqual(b, o);
});

test('rule 7: the other client sends no Origin, no Cookie, makes no checks and gets the body', () => {
  for (const over of [{}, { method: 'PUT', jsonBody: true }, { credentials: true, acao: 'star' }]) {
    const r = run(Object.assign({ outside: true }, over));
    const s = r.at(-1);
    assert.equal(r.length - 1, 2);
    assert.equal(s.kind, 'other');
    assert.equal(s.preflight, null);
    assert.equal(s.check, null);
    assert.equal(s.scriptCanRead, true);
    assert.deepEqual(logic.fieldValues(s.messages[0].headers, 'Origin'), []);
    assert.deepEqual(logic.fieldValues(s.messages[0].headers, 'Cookie'), []);
    assert.equal(s.pageOrigin, null);
    assert.equal(s.target.credentials, false, 'a leftover credentials toggle does not reach the other client');
  }
});

test('Origin header: cross-origin always; same-origin only when the method is not GET or HEAD', () => {
  assert.deepEqual(logic.fieldValues(end({ targetOrigin: 'same' }).messages[0].headers, 'Origin'), []);
  assert.deepEqual(logic.fieldValues(end({ targetOrigin: 'same', method: 'POST' }).messages[0].headers, 'Origin'), ['https://app.example']);
  assert.deepEqual(logic.fieldValues(end({}).messages[0].headers, 'Origin'), ['https://app.example']);
});

test('the server sends what it is set to, to OPTIONS and to the actual request', () => {
  const s = end({ method: 'PUT', acao: 'exact', acac: true, allowPut: true, credentials: true });
  assert.deepEqual(s.messages[1].headers, [ACAO('https://app.example'), ACAC,
    ['Access-Control-Allow-Methods', 'GET, POST, PUT'], ['Access-Control-Allow-Headers', 'Content-Type']]);
  assert.equal(s.messages[1].code, 204);
  assert.deepEqual(s.messages[3].headers, [['Content-Type', 'application/json'], ACAO('https://app.example'), ACAC]);
  assert.equal(s.messages[3].body, '{"saved":true}');
  assert.deepEqual(end({ method: 'PUT', acao: 'star' }).messages[1].headers, [ACAO('*'), ['Access-Control-Allow-Methods', 'GET, POST']]);
});

test('GET carries no body; jsonBody only changes POST and PUT', () => {
  assert.deepEqual(end({ jsonBody: true }), end({ jsonBody: false }));
  assert.equal(end({ method: 'POST', acao: 'star' }).messages[0].body, 'x=1');
  assert.equal(end({ method: 'PUT', jsonBody: true, acao: 'star', allowPut: true }).messages[2].body, '{"x":1}');
});

test('the deciding header is marked on the response the browser read', () => {
  assert.deepEqual(end({ acao: 'exact' }).messages[1].marks, ['Access-Control-Allow-Origin']);
  assert.deepEqual(end({ credentials: true, acao: 'exact', acac: true }).messages[1].marks, ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']);
  assert.deepEqual(end({ method: 'PUT', acao: 'exact' }).messages[1].marks, ['Access-Control-Allow-Methods']);
  assert.deepEqual(end({}).messages[1].marks, [], 'a missing header cannot be marked');
});

// ── the presets' numbers (SPEC.md, Steps) ──

test('presets: steps and outcomes as SPEC.md lists them', () => {
  const want = {
    'same-origin': [2, 'same', true, true],
    'simple-blocked': [3, 'simple', true, false],
    'simple-allowed': [3, 'simple', true, true],
    preflight: [4, 'preflight', true, true],
    'credentials-star': [3, 'simple', true, false],
    'non-browser': [2, 'other', true, true]
  };
  for (const [id, over] of Object.entries(PRESETS)) {
    const s = end(over);
    assert.deepEqual([logic.steps(P(over)), s.kind, s.serverSaw, s.scriptCanRead], want[id], id);
    assert.equal(s.done, true, id);
  }
  assert.equal(end(PRESETS['credentials-star']).check.fail, 'acao-star');
  assert.deepEqual(end(PRESETS.preflight).server.log.map((l) => l.method), ['OPTIONS', 'PUT']);
  assert.equal(logic.steps(P(Object.assign({}, PRESETS.preflight, { allowPut: false }))), 2);
});

test('phases come in order and every step has one', () => {
  for (const over of Object.values(PRESETS)) {
    const r = run(over);
    const phases = r.slice(1).map((s) => s.phase);
    assert.equal(phases[0], 'classify');
    const order = ['classify', 'preflight', 'request', 'check'];
    for (let i = 1; i < phases.length; i++) assert.ok(order.indexOf(phases[i]) > order.indexOf(phases[i - 1]));
  }
});

// ── generic checks every sim keeps ──

const ALL = Object.values(PRESETS).concat([
  { method: 'PUT', jsonBody: true, acao: 'exact' },
  { method: 'POST', jsonBody: true, credentials: true, acao: 'exact', acac: true, allowPut: true },
  { targetOrigin: 'port', acao: 'star' },
  { targetOrigin: 'scheme', method: 'PUT', outside: true }
]);

test('state is JSON-safe at every step', () => {
  for (const o of ALL) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS.preflight);
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.equal(found.length, Object.keys(PRESETS).length, 'found every preset');
  for (const m of found) {
    const params = Function('return {' + m[2] + '}')();
    assert.deepEqual(params, PRESETS[m[1]], `preset ${m[1]} as the tests run it`);
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  }
});
