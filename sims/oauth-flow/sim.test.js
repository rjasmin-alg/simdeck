// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for oauth-flow. Run: node --test sims/oauth-flow/
// Tie-breaks first, then rules 1–7 (SPEC.md), the presets' expected numbers, the page's fields, then the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const end = (over) => at(over, L.steps(P(over)));
const preset = (id, over) => P(Object.assign({}, L.PRESETS[id], over));
const atPreset = (id, n, over) => kit.stateAt(L, preset(id, over), n);
const endPreset = (id, over) => atPreset(id, L.steps(preset(id, over)), over);
const rowsAt = (s, n) => s.log.filter((r) => r.n === n);
const msgs = (s) => s.log.filter((r) => r.k === 'msg');
const ALL = [];
for (const attack of L.ATTACKS) for (const pkce of [true, false]) ALL.push(P({ attack, pkce }));

/** A fresh IdP with ana's code issued as at step 3. */
function idpWithCode(over) {
  const s = at(Object.assign({ attack: 'none' }, over), 3);
  return s.idp;
}
const goodReq = (over) => Object.assign({ code: 'Q3p9', clientId: L.CLIENT, redirectUri: L.REDIRECT, verifier: L.VERIFIER }, over);

// ── tie-breaks ──

test('tie-break: an unknown client is refused before the redirect URI is looked at', () => {
  assert.deepEqual(L.authorize(L.CLIENTS, { clientId: 'nobody', redirectUri: L.BAD_REDIRECT }), { ok: false, why: 'client' });
  assert.deepEqual(L.authorize(L.CLIENTS, { clientId: 'nobody', redirectUri: L.REDIRECT }), { ok: false, why: 'client' });
  assert.deepEqual(L.authorize(L.CLIENTS, { clientId: L.CLIENT, redirectUri: L.BAD_REDIRECT }), { ok: false, why: 'redirect' });
  assert.deepEqual(L.authorize(L.CLIENTS, { clientId: L.CLIENT, redirectUri: L.REDIRECT }), { ok: true, why: null });
});

test('tie-break: the redirect URI is compared as an exact string', () => {
  for (const uri of ['https://app.example/cb/', 'https://app.example/cb?x=1', 'https://APP.example/cb', 'http://app.example/cb',
    'https://app.example/CB', 'https://app.example.drugi.example/cb', '']) {
    assert.equal(L.authorize(L.CLIENTS, { clientId: L.CLIENT, redirectUri: uri }).why, 'redirect', uri);
  }
});

test('tie-break: state is exact and case-sensitive; a missing state never matches', () => {
  assert.equal(L.stateOk('x7f2', 'x7f2'), true);
  assert.equal(L.stateOk('x7f2', 'X7F2'), false);
  assert.equal(L.stateOk('x7f2', 'x7f2 '), false);
  assert.equal(L.stateOk('x7f2', null), false);
  assert.equal(L.stateOk('x7f2', undefined), false);
  assert.equal(L.stateOk(null, null), false);
  assert.equal(L.stateOk('', ''), false);
});

test('tie-break: token checks in order unknown, used, client, redirect_uri, PKCE', () => {
  const idp = idpWithCode();
  // everything wrong: unknown code wins
  assert.equal(L.redeem(idp, goodReq({ code: 'nope', clientId: 'x', redirectUri: 'y', verifier: null })).why, 'unknown');
  // client and redirect and PKCE wrong: client wins
  assert.equal(L.redeem(idp, goodReq({ clientId: 'x', redirectUri: 'y', verifier: null })).why, 'client');
  assert.equal(L.redeem(idp, goodReq({ redirectUri: 'y', verifier: null })).why, 'redirect');
  assert.equal(L.redeem(idp, goodReq({ verifier: null })).why, 'pkce');
  // used beats everything after it
  const used = L.redeem(idp, goodReq()).idp;
  assert.equal(L.redeem(used, goodReq({ clientId: 'x', verifier: null })).why, 'used');
});

test('tie-break: a failed token request does not use up the code', () => {
  let idp = idpWithCode();
  for (const bad of [{ verifier: null }, { verifier: 'wrong-verifier-wrong-verifier-wrong-verifier' }, { clientId: 'x' }, { redirectUri: L.BAD_REDIRECT }]) {
    const r = L.redeem(idp, goodReq(bad));
    assert.equal(r.ok, false);
    assert.equal(r.idp.codes.Q3p9.used, false);
    idp = r.idp;
  }
  assert.equal(L.redeem(idp, goodReq()).ok, true);
});

test('tie-break: a second use is refused and revokes the tokens issued for the code', () => {
  const first = L.redeem(idpWithCode(), goodReq());
  assert.equal(first.ok, true);
  const second = L.redeem(first.idp, goodReq());
  assert.equal(second.ok, false);
  assert.equal(second.why, 'used');
  assert.deepEqual(second.revoked, ['at-5Kd2', 'eyJ…1']);
  assert.equal(second.idp.tokens['at-5Kd2'].revoked, true);
  assert.equal(second.idp.tokens['eyJ…1'].revoked, true);
  // a third use revokes nothing new
  assert.deepEqual(L.redeem(second.idp, goodReq()).revoked, []);
});

test('tie-break: the third party asks before the app (steps 6–7 before 8–9)', () => {
  const s = end({ attack: 'steal' });
  const tokenRows = msgs(s).filter((r) => r.label === 'POST /token');
  assert.deepEqual(tokenRows.map((r) => [r.n, r.from]), [[6, 'X'], [8, 'A']]);
});

test('tie-break: who sees a row is its sender and receivers; a note only its lane', () => {
  const s = end({});
  for (const r of s.log) for (const lane of L.LANES) {
    const want = r.k === 'note' ? r.lane === lane : r.from === lane || r.to === lane;
    assert.equal(L.seenBy(r, lane), want);
  }
  const pw = s.log.filter((r) => r.label === 'POST /login')[0];
  assert.deepEqual(L.LANES.filter((x) => L.seenBy(pw, x)), ['B', 'I']);
});

// ── rule 1: the password goes only to the IdP ──

test('rule 1: the password is held by the browser and the IdP only, in every run', () => {
  for (const p of ALL) {
    for (let n = 0; n <= L.steps(p); n++) {
      const h = L.holders(kit.stateAt(L, p, n));
      for (const lane of Object.keys(h.password)) assert.ok(['B', 'I'].includes(lane), `${p.attack} ${n} ${lane}`);
    }
  }
  const s = end({});
  assert.deepEqual(Object.keys(L.holders(s).password).sort(), ['B', 'I']);
  // the only message with the password goes from the browser to the IdP
  const pw = msgs(s).filter((r) => r.carries.some((c) => c.item === 'password'));
  assert.deepEqual(pw.map((r) => r.from + r.to), ['BI']);
});

// ── rule 2: the code through the browser, tokens only on the back channel ──

test('rule 2: a row is front-channel exactly when it touches the browser', () => {
  for (const p of ALL) for (const r of msgs(end(p))) {
    assert.equal(r.channel, r.from === 'B' || r.to === 'B' ? 'front' : 'back');
  }
});

test('rule 2: tokens travel only on the back channel and the browser never holds one', () => {
  for (const p of ALL) {
    const s = end(p);
    for (const r of msgs(s)) {
      if (r.carries.some((c) => c.item === 'access' || c.item === 'id')) assert.equal(r.channel, 'back', `${p.attack} ${r.label}`);
    }
    const h = L.holders(s);
    assert.equal(h.access.B, undefined);
    assert.equal(h.id.B, undefined);
    for (const u of s.browser.history) assert.ok(!/at-|eyJ/.test(u), u);
  }
});

test('rule 2: the code comes back through the browser, once in its history', () => {
  const s = end({});
  const back = rowsAt(s, 4);
  assert.deepEqual(back.map((r) => [r.from + r.to, r.channel]), [['IB', 'front'], ['BA', 'front']]);
  for (const r of back) assert.deepEqual(r.carries.map((c) => c.item + '=' + c.value), ['code=Q3p9', 'state=x7f2']);
  assert.equal(s.browser.history.filter((u) => u.includes('code=')).length, 1);
  assert.equal(s.browser.history.length, 4);
  assert.deepEqual(Object.keys(L.holders(s).code).sort(), ['A', 'B', 'I']);
});

// ── rule 3: state ──

test('rule 3: a state that does not match stops the app before any token request', () => {
  const s = end({ attack: 'state' });
  assert.equal(s.ev.kind, 'check');
  assert.equal(s.ev.ok, false);
  assert.equal(s.app.error, 'state');
  assert.equal(s.outcome, 'state-mismatch');
  assert.equal(msgs(s).filter((r) => r.label === 'POST /token').length, 0);
  assert.equal(s.app.tokens, null);
  // with the right state the app goes on
  const ok = at({}, 5);
  assert.equal(ok.ev.ok, true);
  assert.equal(ok.app.error, null);
  assert.equal(ok.outcome, null);
});

test('rule 3: the state the app sends is the one it later compares', () => {
  const s = at({}, 5);
  const sent = rowsAt(s, 2)[0].carries.filter((c) => c.item === 'state')[0].value;
  assert.equal(sent, s.app.state);
  assert.equal(s.ev.sent, sent);
  assert.equal(s.ev.got, sent);
  assert.equal(at({ attack: 'state' }, 5).ev.got, L.FORGED_STATE);
});

// ── rule 4: PKCE ──

test('rule 4: the challenge is BASE64URL(SHA-256(verifier)), RFC 7636 Appendix B', () => {
  assert.equal(L.challengeOf(L.VERIFIER), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  for (const s of ['', 'a', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(119), L.VERIFIER]) {
    assert.equal(L.challengeOf(s), crypto.createHash('sha256').update(s, 'ascii').digest('base64url'), 'len ' + s.length);
  }
  assert.equal(L.VERIFIER.length, 43);
});

test('rule 4: with PKCE the authorization request carries the challenge and the token request the verifier', () => {
  const s = end({});
  const q = Object.fromEntries(rowsAt(s, 2)[1].query);
  assert.equal(q.code_challenge, L.challengeOf(L.VERIFIER));
  assert.equal(q.code_challenge_method, 'S256');
  const tr = rowsAt(s, 6)[0];
  assert.deepEqual(tr.carries.map((c) => c.item), ['code', 'verifier']);
  assert.equal(s.idp.codes.Q3p9.challenge, q.code_challenge);
  // without PKCE neither
  const n = end({ pkce: false });
  assert.equal(Object.fromEntries(rowsAt(n, 2)[1].query).code_challenge, undefined);
  assert.deepEqual(rowsAt(n, 6)[0].carries.map((c) => c.item), ['code']);
  assert.equal(n.outcome, 'ok');
});

test('rule 4: a code alone, or a wrong verifier, gets no token when a challenge is stored', () => {
  const idp = idpWithCode();
  assert.equal(L.redeem(idp, goodReq({ verifier: null })).why, 'pkce');
  assert.equal(L.redeem(idp, goodReq({ verifier: L.VERIFIER.slice(0, -1) + 'Y' })).why, 'pkce');
  assert.equal(L.redeem(idp, goodReq({ verifier: L.challengeOf(L.VERIFIER) })).why, 'pkce');
  assert.equal(L.redeem(idp, goodReq()).ok, true);
});

test('rule 4: without a stored challenge the code alone works, and a verifier is refused (downgrade)', () => {
  const idp = idpWithCode({ pkce: false });
  assert.equal(idp.codes.Q3p9.challenge, null);
  assert.equal(L.redeem(idp, goodReq({ verifier: null })).ok, true);
  assert.equal(L.redeem(idp, goodReq()).why, 'pkce');
});

// ── rule 5: redirect URI ──

test('rule 5: an unregistered redirect URI is refused at the IdP without a redirect and without a code', () => {
  const s = end({ attack: 'redirect' });
  assert.equal(L.steps(P({ attack: 'redirect' })), 2);
  const r2 = rowsAt(s, 2);
  assert.deepEqual(r2.map((r) => r.from + r.to + ' ' + r.label), ['BI GET /authorize', 'IB 400']);
  assert.equal(r2[1].refusal, 'redirect');
  assert.equal(Object.fromEntries(r2[0].query).redirect_uri, L.BAD_REDIRECT);
  assert.deepEqual(s.idp.codes, {});
  assert.equal(msgs(s).filter((r) => r.location && r.location.startsWith(L.BAD_REDIRECT)).length, 0);
  assert.ok(!s.browser.url.startsWith(L.BAD_REDIRECT));
  assert.equal(s.outcome, 'refused');
  assert.deepEqual(L.holders(s).code, {});
});

test('rule 5: the registered redirect URI is accepted and the code is bound to it', () => {
  const s = at({}, 3);
  assert.equal(s.idp.request.ok, true);
  assert.equal(s.idp.codes.Q3p9.redirectUri, L.REDIRECT);
  assert.ok(rowsAt(at({}, 4), 4)[0].location.startsWith(L.REDIRECT + '?'));
});

// ── rule 6: single use ──

test('rule 6: in the run without PKCE the thief uses the code first and the app is refused', () => {
  const s = endPreset('stolen-code-no-pkce');
  assert.equal(rowsAt(s, 7)[0].label, '200');
  assert.equal(rowsAt(s, 9)[0].label, '400');
  assert.equal(rowsAt(s, 9)[0].error, 'invalid_grant');
  assert.equal(at({ attack: 'steal', pkce: false }, 8).ev.why, 'used');
  assert.deepEqual(at({ attack: 'steal', pkce: false }, 8).ev.revoked, ['at-5Kd2', 'eyJ…1']);
  assert.equal(s.idp.tokens['at-5Kd2'].revoked, true);
});

// ── rule 7: bearer token and ID token ──

test('rule 7: the API accepts only an access token the IdP issued and has not revoked', () => {
  const idp = L.redeem(idpWithCode(), goodReq()).idp;
  assert.deepEqual(L.apiCheck(idp, 'Bearer at-5Kd2', 'albums'), { status: 200, why: null, user: 'ana' });
  assert.equal(L.apiCheck(idp, 'at-5Kd2', 'albums').why, 'missing');
  assert.equal(L.apiCheck(idp, null, 'albums').why, 'missing');
  assert.equal(L.apiCheck(idp, 'Bearer at-made-up-by-the-app', 'albums').why, 'unknown');
  assert.equal(L.apiCheck(idp, 'Bearer eyJ…1', 'albums').why, 'not-access');
  assert.equal(L.apiCheck(idp, 'Bearer at-5Kd2', 'contacts').status, 403);
  const revoked = L.redeem(idp, goodReq()).idp;
  assert.equal(L.apiCheck(revoked, 'Bearer at-5Kd2', 'albums').why, 'revoked');
});

test('rule 7: the app calls the API with Authorization: Bearer and learns who the user is from the ID token', () => {
  const s = end({});
  const call = rowsAt(s, 8)[0];
  assert.equal(call.header, 'Bearer at-5Kd2');
  assert.equal(call.channel, 'back');
  assert.deepEqual(s.idp.tokens['eyJ…1'].claims, { iss: 'https://idp.example', sub: 'ana', aud: 'fotoalbum' });
  assert.equal(at({}, 6).app.user, null);
  assert.equal(at({}, 7).app.user, 'ana');
  assert.deepEqual(s.api.last, { status: 200, why: null, albums: 3 });
});

test('rule 7: without openid in the scope there is no ID token, and the app does not know the user', () => {
  const idp = idpWithCode();
  idp.codes.Q3p9.scope = 'albums';
  const r = L.redeem(idp, goodReq());
  assert.equal(r.ok, true);
  assert.equal(r.id, null);
  assert.deepEqual(r.idp.codes.Q3p9.tokens, ['at-5Kd2']);
  // the same run with that scope: the app gets an access token and still does not know who the user is
  const p = P({});
  const s5 = structuredClone(at({}, 5));
  s5.idp.codes.Q3p9.scope = 'albums';
  const s7 = L.step(L.step(s5, 6, p), 7, p);
  assert.deepEqual(s7.app.tokens, { access: 'at-5Kd2', id: null });
  assert.equal(s7.app.user, null);
  assert.equal(L.apiCheck(s7.idp, 'Bearer at-5Kd2', 'albums').status, 200);
});

test('rule 7: the app user is the ID token\'s sub', () => {
  const p = P({});
  const s5 = structuredClone(at({}, 5));
  s5.idp.codes.Q3p9.user = 'iva';
  const s7 = L.step(L.step(s5, 6, p), 7, p);
  assert.equal(s7.app.user, 'iva');
  assert.equal(s7.idp.tokens[s7.app.tokens.id].claims.sub, 'iva');
});

test('rule 6: a reuse revokes only the tokens issued for that code', () => {
  let idp = L.redeem(idpWithCode(), goodReq()).idp;
  idp.codes.R2v6 = Object.assign({}, idp.codes.Q3p9, { used: false, tokens: [] });
  idp = L.redeem(idp, goodReq({ code: 'R2v6' })).idp;
  assert.deepEqual(idp.codes.R2v6.tokens, ['at-9Wq4', 'eyJ…2']);
  const again = L.redeem(idp, goodReq());
  assert.deepEqual(again.revoked, ['at-5Kd2', 'eyJ…1']);
  assert.equal(again.idp.tokens['at-9Wq4'].revoked, false);
  assert.equal(again.idp.tokens['eyJ…2'].revoked, false);
});

test('the third party: what it holds and who sees its note', () => {
  const st = end({ attack: 'steal' });
  assert.deepEqual(L.holders(st).code.X, ['Q3p9']);
  // from the note at step 4, before it sends anything
  assert.deepEqual(L.holders(at({ attack: 'steal' }, 5)).code.X, ['Q3p9']);
  assert.ok(at({ attack: 'steal' }, 4).changed.includes('code:X'));
  assert.equal(at({ attack: 'steal' }, 3).thief.code, null);
  const noteX = st.log.filter((r) => r.k === 'note' && r.lane === 'X')[0];
  assert.equal(noteX.n, 4);
  assert.deepEqual(L.LANES.filter((x) => L.seenBy(noteX, x)), ['X']);
  const sm = end({ attack: 'state' });
  assert.deepEqual(L.holders(sm).code.X, [L.FORGED_CODE]);
  assert.deepEqual(L.holders(sm).state.X, [L.FORGED_STATE]);
  assert.equal(L.holders(sm).code.I.join(), 'Q3p9');
  assert.equal(sm.app.state, L.STATE);
  assert.equal(sm.ev.sent, L.STATE);
  // the thief's answer never reaches the app
  const s7 = atPreset('stolen-code-no-pkce', 7);
  assert.equal(s7.app.tokens, null);
  assert.equal(s7.app.user, null);
  assert.equal(s7.app.error, null);
});

// ── presets ──

test('preset normal: 9 steps, 11 rows, tokens with the app, 3 albums', () => {
  const s = endPreset('normal');
  assert.equal(L.steps(preset('normal')), 9);
  assert.equal(s.log.length, 11);
  assert.deepEqual(s.app.tokens, { access: 'at-5Kd2', id: 'eyJ…1' });
  assert.equal(s.app.user, 'ana');
  assert.equal(s.outcome, 'ok');
  assert.equal(s.browser.history.length, 4);
  assert.equal(s.browser.history.filter((u) => u.includes('code=')).length, 1);
  const h = L.holders(s);
  assert.deepEqual(Object.keys(h.password).sort(), ['B', 'I']);
  assert.deepEqual(Object.keys(h.access).sort(), ['A', 'I', 'R']);
  assert.deepEqual(Object.keys(h.verifier).sort(), ['A', 'I']);
  assert.deepEqual(Object.keys(h.challenge).sort(), ['A', 'B', 'I']);
  assert.deepEqual(s.api.last.albums, 3);
});

test('preset state-mismatch: 5 steps, the app stops, the code Q3p9 stays unused', () => {
  const s = endPreset('state-mismatch');
  assert.equal(L.steps(preset('state-mismatch')), 5);
  assert.deepEqual(rowsAt(s, 4).map((r) => r.from + r.to), ['XB', 'BA']);
  assert.equal(s.app.got.code, L.FORGED_CODE);
  assert.equal(s.app.error, 'state');
  assert.equal(s.idp.codes.Q3p9.used, false);
  assert.equal(s.outcome, 'state-mismatch');
});

test('preset stolen-code-pkce: the thief gets invalid_grant, the app still gets its tokens', () => {
  const s = endPreset('stolen-code-pkce');
  assert.equal(L.steps(preset('stolen-code-pkce')), 9);
  assert.equal(s.log.length, 12);
  const s7 = atPreset('stolen-code-pkce', 7);
  assert.equal(rowsAt(s7, 7)[0].label, '400');
  assert.equal(rowsAt(s7, 7)[0].error, 'invalid_grant');
  assert.equal(s7.idp.codes.Q3p9.used, false);
  assert.equal(s.thief.tokens, null);
  assert.deepEqual(s.app.tokens, { access: 'at-5Kd2', id: 'eyJ…1' });
  assert.equal(s.outcome, 'ok');
  assert.deepEqual(Object.keys(L.holders(s).access).sort(), ['A', 'I']);
});

test('preset stolen-code-no-pkce: the thief holds the tokens from step 7, the app is refused', () => {
  const s = endPreset('stolen-code-no-pkce');
  assert.equal(L.steps(preset('stolen-code-no-pkce')), 9);
  assert.deepEqual(atPreset('stolen-code-no-pkce', 7).thief.tokens, { access: 'at-5Kd2', id: 'eyJ…1' });
  assert.equal(s.app.tokens, null);
  assert.equal(s.app.error, 'grant');
  assert.equal(s.outcome, 'stolen');
  assert.ok('X' in L.holders(s).access);
});

test('preset wrong-redirect: 2 steps, refused, nobody holds a code', () => {
  const s = endPreset('wrong-redirect');
  assert.equal(L.steps(preset('wrong-redirect')), 2);
  assert.equal(s.log.length, 3);
  assert.equal(s.outcome, 'refused');
  assert.equal(rowsAt(s, 1)[0].from + rowsAt(s, 1)[0].to, 'XB');
});

// ── fields the page reads ──

test('the page fields: ev kinds per step, the X lane only with an attack, changed holdings', () => {
  assert.deepEqual(L.planOf(P({})).map((w, i) => at({}, i + 1).ev.kind),
    ['click', 'toIdp', 'login', 'back', 'check', 'tokenRequest', 'tokenAnswer', 'api', 'albums']);
  for (const p of ALL) {
    const usesX = end(p).log.some((r) => r.from === 'X' || r.to === 'X' || r.lane === 'X');
    assert.equal(usesX, p.attack !== 'none', p.attack);
  }
  assert.deepEqual(at({}, 3).changed, ['password:B', 'password:I', 'code:I']);
  assert.deepEqual(at({}, 5).changed, []);
  assert.deepEqual(at({}, 7).changed, ['access:A', 'id:A']);
  assert.equal(at({}, 0).ev.kind, 'start');
  assert.equal(L.attackOf({ attack: 'bogus' }), 'none');
});

test('every view and attack has strings; every preset param is a model param', () => {
  for (const v of L.VIEWS) assert.ok(('view' + v) in strings.hr && ('eve' + v) in strings.en, v);
  for (const a of L.ATTACKS) assert.ok(('attack_' + a) in strings.hr && ('attack_' + a) in strings.en, a);
  // state, code_challenge and code_verifier are parameter names (data); the other items are words
  for (const it of ['password', 'code', 'access', 'id']) assert.ok(('item_' + it) in strings.hr && ('item_' + it) in strings.en, it);
});

// ── generic checks every sim keeps ──

const RUNS = ALL.concat([P({ view: 'I' })]);

test('state is JSON-safe at every step', () => {
  for (const p of RUNS) for (let n = 0; n <= L.steps(p); n++) {
    const s = kit.stateAt(L, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of RUNS) {
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of ALL) {
    let s = L.initial(p);
    for (let n = 1; n <= L.steps(p); n++) {
      const before = structuredClone(s);
      const next = L.step(s, n, p);
      assert.deepEqual(s, before);
      s = next;
    }
  }
});

test('a step past the end changes nothing but n and ev', () => {
  const s = end({});
  const after = L.step(s, 10, P({}));
  assert.equal(after.ev.kind, 'idle');
  assert.deepEqual(after.log, s.log);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model');
  for (const id of Object.keys(L.PRESETS)) {
    assert.ok(html.indexOf("id: '" + id + "'") >= 0, 'page lists preset ' + id);
    for (const k of Object.keys(L.PRESETS[id])) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  }
});
