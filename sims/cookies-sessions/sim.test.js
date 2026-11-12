// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cookies-sessions. Run: node --test sims/cookies-sessions/
// Tie-breaks first, then rules 1–6 (SPEC.md), the presets' expected numbers, the action keys, then the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const preset = (id, over) => P(Object.assign({}, L.PRESETS[id], over));
const atPreset = (id, n, over) => kit.stateAt(L, preset(id, over), n);
const cookie = (over) => Object.assign({ name: 'sid', value: 'a1b2', domain: L.SHOP, path: '/', secure: true, httpOnly: true,
  sameSite: 'Lax', expires: null, created: 0 }, over);
const req = (over) => Object.assign(L.request(null, L.SHOP, '/katalog', 'GET', 'navigation', L.SHOP), over);
const shopReqs = (s, n) => s.log.filter((r) => r.k === 'req' && r.to === 'S' && r.n === n);

// ── tie-breaks ──

test('tie-break: the first reason that applies (expired, domain, path, secure, samesite)', () => {
  const cross = req({ initiator: L.OTHER, method: 'POST', kind: 'form', scheme: 'http', path: '/x' });
  // expired before everything
  assert.equal(L.whyNot(cookie({ domain: L.OTHER, path: '/y', expires: 10 }), cross, 10), 'expired');
  // another host's cookie is "domain", never "samesite"
  assert.equal(L.whyNot(cookie({ domain: L.OTHER, sameSite: 'Strict' }), cross, 0), 'domain');
  assert.equal(L.whyNot(cookie({ path: '/y' }), cross, 0), 'path');
  assert.equal(L.whyNot(cookie({ path: '/' }), cross, 0), 'secure');
  assert.equal(L.whyNot(cookie({ secure: false }), cross, 0), 'samesite');
  assert.equal(L.whyNot(cookie({ secure: false, sameSite: 'None' }), cross, 0), null);
});

test('tie-break: Cookie header order is longer path, then earlier creation, then name', () => {
  const jar = [
    cookie({ name: 'b', value: '1', created: 5 }),
    cookie({ name: 'a', value: '2', created: 5 }),
    cookie({ name: 'c', value: '3', created: 1 }),
    cookie({ name: 'd', value: '4', path: '/katalog', created: 9 })
  ];
  assert.equal(L.attach(jar, req(), 0).header, 'd=4; c=3; a=2; b=1');
});

test('tie-break: the same name, domain and path replaces the cookie and keeps its creation time', () => {
  let jar = L.store([], { name: 'sid', value: 'a1b2', path: '/', secure: true }, L.SHOP, 60).jar;
  jar = L.store(jar, { name: 'x', value: '1' }, L.SHOP, 70).jar;
  jar = L.store(jar, { name: 'sid', value: 'c3d4', path: '/', secure: true }, L.SHOP, 300).jar;
  assert.equal(jar.length, 2);
  assert.deepEqual(jar.map((c) => c.name + '=' + c.value + '@' + c.created), ['sid=c3d4@60', 'x=1@70']);
  // another path is another cookie
  jar = L.store(jar, { name: 'sid', value: 'e5f6', path: '/kosarica', secure: true }, L.SHOP, 400).jar;
  assert.equal(jar.length, 3);
});

test('tie-break: log in with a live session sets no cookie; with a dead sid a new one replaces it', () => {
  const twice = at({ acts: 'PP' }, 2);
  assert.equal(twice.ev.why, 'already');
  assert.deepEqual(twice.log.filter((r) => r.k === 'res' && r.n === 2)[0].setCookie, []);
  assert.deepEqual(Object.keys(twice.sessions), ['a1b2']);
  const again = at({ acts: 'PQP' }, 3);
  assert.equal(again.ev.why, 'created');
  assert.deepEqual(Object.keys(again.sessions), ['c3d4']);
  assert.deepEqual(again.jar.map((c) => c.name + '=' + c.value), ['sid=c3d4']);
  assert.deepEqual(again.changed.jar, ['sid']);
});

test('tie-break: no initiator (typed, reopened) is same-site; the shop reads the first sid sent', () => {
  assert.equal(L.isCrossSite(req({ initiator: null })), false);
  assert.equal(L.sameSiteAllows('Strict', req({ initiator: null, method: 'POST', kind: 'form' })), true);
  const sessions = { c3d4: { user: 'ana', cart: [] } };
  assert.deepEqual(L.lookup(sessions, [cookie({ value: 'a1b2' }), cookie({ value: 'c3d4' })]), { sid: 'a1b2', user: null, stale: true });
});

// ── rule 1: stateless, the server knows only what the request carries ──

test('rule 1: without sid the shop answers as to anyone; with a live sid, as ana', () => {
  const s1 = at({ acts: 'GPG' }, 1);
  assert.equal(shopReqs(s1, 1)[0].cookie, '');
  assert.equal(s1.page.user, null);
  assert.equal(s1.ev.why, 'anonymous');
  const s3 = at({ acts: 'GPG' }, 3);
  assert.equal(shopReqs(s3, 3)[0].cookie, 'sid=a1b2');
  assert.equal(s3.page.user, 'ana');
  assert.equal(s3.ev.why, 'known');
  assert.equal(L.lookup({}, []).user, null);
});

test('rule 1: an anonymous add to cart adds nothing anywhere', () => {
  const s = at({ acts: 'K' }, 1);
  assert.equal(s.ev.why, 'anonymous');
  assert.equal(s.page.view, 'login-needed');
  assert.deepEqual(s.sessions, {});
});

// ── rule 2: domain, path, expiry ──

test('rule 2: host-only domain match (case-insensitive) and path match (RFC 6265 §5.1.4)', () => {
  assert.equal(L.domainMatch('Trgovina.Example', 'trgovina.example'), true);
  assert.equal(L.domainMatch('www.trgovina.example', 'trgovina.example'), false);
  assert.equal(L.pathMatch('/katalog', '/'), true);
  assert.equal(L.pathMatch('/kosarica/1', '/kosarica'), true);
  assert.equal(L.pathMatch('/kosarica', '/kosarica'), true);
  assert.equal(L.pathMatch('/kosaricax', '/kosarica'), false);
  assert.equal(L.pathMatch('/katalog', '/kosarica/'), false);
});

test('rule 2: each site gets only its own cookies', () => {
  const s = atPreset('lax-link-vs-form', 3);
  // drugi.example's page load carries tema, not sid
  const other = s.log.filter((r) => r.k === 'req' && r.to === 'D' && r.n === 3)[0];
  assert.equal(other.cookie, 'tema=tamna');
  const tema = s.lastRequest.decisions.filter((d) => d.name === 'tema')[0];
  assert.deepEqual([tema.sent, tema.why], [false, 'domain']);
});

test('rule 2: an expired cookie is not sent and leaves the jar', () => {
  assert.equal(L.whyNot(cookie({ expires: 100 }), req(), 100), 'expired');
  assert.equal(L.whyNot(cookie({ expires: 101 }), req(), 100), null);
  // persistent sid set at 60 expires at 3660; the 12th close (+300 s each) reaches 3660 and evicts it as expired
  const twelve = P({ acts: 'P' + 'X'.repeat(12) + 'G', persistent: true });
  assert.deepEqual(kit.stateAt(L, twelve, 13).gone.jar, [{ name: 'sid', domain: L.SHOP, path: '/', why: 'expired' }]);
  const s = kit.stateAt(L, twelve, 14);
  assert.deepEqual([s.jar.length, s.ev.why], [0, 'anonymous']);
  assert.equal(at({ acts: 'P' + 'X'.repeat(11) + 'G', persistent: true }, 13).ev.why, 'known');
  // eviction on a request step too: P at 60 (expires 3660), 11 closes to 3360, then five browses to 3660
  const browse = P({ acts: 'P' + 'X'.repeat(11) + 'GGGGG', persistent: true });
  assert.equal(kit.stateAt(L, browse, 16).ev.why, 'known');
  const s17 = kit.stateAt(L, browse, 17);
  assert.deepEqual([s17.now, s17.ev.why, s17.jar.length, s17.gone.jar[0].why], [3660, 'anonymous', 0, 'expired']);
  const e = L.evict([cookie({ expires: 3660 })], 3660, false);
  assert.deepEqual([e.jar.length, e.gone[0].why], [0, 'expired']);
});

// ── rule 3: Secure and HttpOnly ──

test('rule 3: a Secure cookie goes only over https', () => {
  assert.equal(L.whyNot(cookie(), req({ scheme: 'http' }), 0), 'secure');
  assert.equal(L.whyNot(cookie({ secure: false }), req({ scheme: 'http' }), 0), null);
  assert.equal(L.whyNot(cookie(), req(), 0), null);
});

test('rule 3: page scripts see no HttpOnly cookie', () => {
  const s = atPreset('lax-link-vs-form', 2);
  assert.deepEqual(L.scriptVisible(s.jar, L.SHOP, 'https'), []);
  assert.deepEqual(L.scriptVisible(s.jar, L.OTHER, 'https'), ['tema=tamna']);
  assert.deepEqual(L.scriptVisible([cookie({ httpOnly: false })], L.SHOP, 'https'), ['sid=a1b2']);
  assert.deepEqual(L.scriptVisible([cookie({ httpOnly: false })], L.SHOP, 'http'), []);
});

test('rule 3: the shop sets sid Secure and HttpOnly', () => {
  const res = at({ acts: 'P' }, 1).log.filter((r) => r.k === 'res')[0];
  assert.deepEqual(res.setCookie, ['sid=a1b2; Path=/; Secure; HttpOnly; SameSite=Lax']);
});

// ── rule 4: session cookies and Max-Age ──

test('rule 4: closing the browser drops session cookies only', () => {
  const e = L.evict([cookie(), cookie({ name: 'p', expires: 5000 })], 400, true);
  assert.deepEqual(e.jar.map((c) => c.name), ['p']);
  assert.deepEqual(e.gone, [{ name: 'sid', domain: L.SHOP, path: '/', why: 'closed' }]);
  assert.deepEqual(L.evict([cookie()], 400, false).jar.length, 1);
});

test('rule 4: Max-Age=3600 sets expires to now + 3600; Max-Age ≤ 0 deletes', () => {
  const s = at({ acts: 'P', persistent: true }, 1);
  assert.equal(s.jar[0].expires, 60 + 3600);
  assert.equal(s.log[1].setCookie[0], 'sid=a1b2; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600');
  assert.equal(at({ acts: 'P' }, 1).jar[0].expires, null);
  const del = L.store(s.jar, { name: 'sid', value: '', path: '/', secure: true, maxAge: 0 }, L.SHOP, 100);
  assert.deepEqual([del.jar.length, del.stored, del.why], [0, false, 'deleted']);
});

// ── rule 5: SameSite ──

test('rule 5: Strict never cross-site; Lax only on a top-level GET/HEAD navigation; None always', () => {
  const link = req({ initiator: L.OTHER });
  const head = req({ initiator: L.OTHER, method: 'HEAD' });
  const form = req({ initiator: L.OTHER, method: 'POST', kind: 'form' });
  const sub = req({ initiator: L.OTHER, kind: 'subresource' });
  const getForm = req({ initiator: L.OTHER, method: 'GET', kind: 'form' });
  assert.deepEqual(L.verdicts(link), { Strict: false, Lax: true, None: true });
  assert.deepEqual(L.verdicts(head), { Strict: false, Lax: true, None: true });
  assert.deepEqual(L.verdicts(form), { Strict: false, Lax: false, None: true });
  assert.deepEqual(L.verdicts(sub), { Strict: false, Lax: false, None: true });
  assert.deepEqual(L.verdicts(getForm), { Strict: false, Lax: true, None: true }, 'a GET form navigates the tab: Lax sends');
  assert.deepEqual(L.verdicts(req({ initiator: L.OTHER, method: 'POST' })), { Strict: false, Lax: false, None: true }, 'a POST navigation');
  assert.deepEqual(L.verdicts(req()), { Strict: true, Lax: true, None: true });
  assert.deepEqual(L.verdicts(req({ initiator: 'www.trgovina.example' })), { Strict: true, Lax: true, None: true });
});

test('rule 5: no SameSite is treated as Lax', () => {
  assert.equal(L.effectiveSameSite(cookie({ sameSite: null })), 'Lax');
  const form = req({ initiator: L.OTHER, method: 'POST', kind: 'form' });
  assert.equal(L.whyNot(cookie({ sameSite: null }), form, 0), 'samesite');
  assert.equal(L.whyNot(cookie({ sameSite: null }), req({ initiator: L.OTHER }), 0), null);
});

test('rule 5: a None cookie without Secure is refused', () => {
  const r = L.store([], { name: 'x', value: '1', sameSite: 'None' }, L.SHOP, 0);
  assert.deepEqual([r.jar.length, r.stored, r.why], [0, false, 'none-needs-secure']);
  assert.equal(L.store([], { name: 'x', value: '1', sameSite: 'None', secure: true }, L.SHOP, 0).stored, true);
});

test('rule 5 in the run: the other site\'s form adds to the cart only with None', () => {
  for (const [ss, sent, cart] of [['Strict', false, 0], ['Lax', false, 0], ['None', true, 1]]) {
    const s = at({ acts: 'POG', sameSite: ss }, 3);
    const s2 = at({ acts: 'POG', sameSite: ss }, 2);
    assert.equal(s2.ev.sidSent, sent, ss);
    assert.equal(s.page.cart, cart, ss);
    if (sent) assert.deepEqual(s.sessions.a1b2.cart, ['x-1']);
  }
  const link = (ss) => at({ acts: 'PD', sameSite: ss }, 2);
  assert.equal(link('Strict').page.user, null);
  assert.equal(link('Strict').ev.sidWhy, 'samesite');
  assert.equal(link('Lax').page.user, 'ana');
  assert.equal(link('None').page.user, 'ana');
});

// ── rule 6: the session lives on the server ──

test('rule 6: log out deletes the row; the old sid, still sent, logs no one in', () => {
  const s3 = atPreset('logout', 3);
  assert.deepEqual(s3.sessions, {});
  assert.deepEqual(s3.gone.sessions, [{ sid: 'a1b2', row: { user: 'ana', cart: [] } }]);
  assert.deepEqual(s3.log.filter((r) => r.k === 'res' && r.n === 3)[0].setCookie, []);
  assert.equal(shopReqs(s3, 3)[0].user, 'ana', 'the shop knew who logged out');
  const s4 = atPreset('logout', 4);
  assert.equal(shopReqs(s4, 4)[0].cookie, 'sid=a1b2');
  assert.deepEqual([s4.ev.why, s4.ev.stale, s4.page.user], ['stale', true, null]);
});

test('rule 6: closing the browser leaves the session row on the server', () => {
  const s = atPreset('browser-closed', 3);
  assert.deepEqual(Object.keys(s.sessions), ['a1b2']);
  assert.deepEqual(s.ev.dropped, ['sid']);
  assert.deepEqual(s.ev.live, ['a1b2']);
});

test('a browse with no page open (step 0, after closing) is typed: no initiator; a form is on the shop\'s page', () => {
  assert.equal(at({ acts: 'G' }, 1).lastRequest.initiator, null);
  for (const a of ['P', 'K', 'Q', 'XP']) assert.equal(at({ acts: a }, a.length).lastRequest.initiator, L.SHOP, a);
  assert.equal(atPreset('browser-closed', 4).lastRequest.initiator, null);
  assert.equal(atPreset('browser-closed', 2).lastRequest.initiator, L.SHOP);
  assert.equal(atPreset('lax-link-vs-form', 2).lastRequest.initiator, L.OTHER);
});

test('log out without a session deletes nothing', () => {
  const s = at({ acts: 'Q' }, 1);
  assert.deepEqual([s.ev.why, s.page.view], ['anonymous', 'not-in']);
  assert.deepEqual(s.gone.sessions, []);
});

// ── presets and expected numbers (SPEC.md) ──

test('presets: step counts and the page params', () => {
  const steps = { 'login-browse': 5, 'lax-link-vs-form': 4, strict: 4, 'browser-closed': 4, logout: 4 };
  for (const id of Object.keys(steps)) assert.equal(L.steps(preset(id)), steps[id], id);
  assert.equal(L.steps(P()), 5);
});

test('preset login-browse: anonymous, then sid=a1b2 on three requests, cart 2', () => {
  const s = atPreset('login-browse', 5);
  const rows = s.log.filter((r) => r.k === 'req').map((r) => r.method + ' ' + r.path + ' | ' + r.cookie + ' | ' + r.user);
  assert.deepEqual(rows, [
    'GET /katalog |  | null', 'POST /prijava |  | null', 'POST /kosarica | sid=a1b2 | ana', 'POST /kosarica | sid=a1b2 | ana',
    'GET /katalog | sid=a1b2 | ana'
  ]);
  assert.deepEqual(s.sessions, { a1b2: { user: 'ana', cart: ['k-1', 'k-2'] } });
  assert.deepEqual([s.now, s.page.cart, s.page.user], [300, 2, 'ana']);
  assert.deepEqual(atPreset('login-browse', 2).changed.jar, ['sid']);
  assert.deepEqual(atPreset('login-browse', 2).changed.sessions, ['a1b2']);
  assert.deepEqual(atPreset('login-browse', 4).changed.sessions, ['a1b2']);
  assert.deepEqual(atPreset('login-browse', 4).changed.jar, []);
});

test('preset lax-link-vs-form: the link sends sid, the form does not', () => {
  const s2 = atPreset('lax-link-vs-form', 2);
  assert.deepEqual(s2.log.filter((r) => r.n === 2).map((r) => r.k + ' ' + (r.to || r.from) + ' ' + (r.cookie !== undefined ? r.cookie : r.setCookie.join())),
    ['req D ', 'res D tema=tamna', 'req S sid=a1b2', 'res S ']);
  assert.deepEqual([s2.ev.cross, s2.ev.sidSent, s2.page.user, s2.ev.otherSet.join()], [true, true, 'ana', 'tema']);
  assert.deepEqual(s2.jar.map((c) => c.name + ' ' + c.domain + ' ' + c.sameSite), ['sid trgovina.example Lax', 'tema drugi.example null']);
  const s3 = atPreset('lax-link-vs-form', 3);
  assert.deepEqual([s3.ev.cross, s3.ev.sidSent, s3.ev.sidWhy, s3.ev.why, s3.page.user], [true, false, 'samesite', 'anonymous', null]);
  assert.deepEqual(s3.verdicts, { Strict: false, Lax: false, None: true });
  assert.deepEqual(s3.ev.otherSet, [], 'drugi.example already has its cookie back');
  assert.deepEqual(s3.lastRequest.cookieSent, []);
  // the chart's hollow chips: sid held back on the form, tema (another host) never listed for the shop
  assert.deepEqual(shopReqs(s3, 3)[0].held, ['sid=a1b2']);
  assert.deepEqual(shopReqs(s2, 2)[0].held, []);
  const s4 = atPreset('lax-link-vs-form', 4);
  assert.deepEqual([s4.page.user, s4.page.cart], ['ana', 0]);
});

test('preset strict: the link arrives logged out, a browse from the shop is logged in', () => {
  const s3 = atPreset('strict', 3);
  assert.deepEqual([s3.ev.sidSent, s3.ev.sidWhy, s3.page.user, s3.ev.sameSite], [false, 'samesite', null, 'Strict']);
  assert.deepEqual(Object.keys(s3.sessions), ['a1b2']);
  const s4 = atPreset('strict', 4);
  assert.deepEqual([s4.ev.sidSent, s4.page.user, s4.ev.cross], [true, 'ana', false]);
});

test('preset browser-closed: session cookie gone, Max-Age=3600 still sent', () => {
  const s4 = atPreset('browser-closed', 4);
  assert.deepEqual([shopReqs(s4, 4)[0].cookie, s4.page.user, s4.now], ['', null, 480]);
  const p4 = atPreset('browser-closed', 4, { persistent: true });
  assert.deepEqual([shopReqs(p4, 4)[0].cookie, p4.page.user, p4.jar[0].expires], ['sid=a1b2', 'ana', 3660]);
  const p3 = atPreset('browser-closed', 3, { persistent: true });
  assert.deepEqual([p3.ev.dropped, p3.ev.kept], [[], ['sid']]);
  assert.deepEqual(p3.log[p3.log.length - 1], { k: 'note', n: 3, t: 420, what: 'close' });
});

// ── what the page reads (captions, cards, chart): pinned so a wrong value fails here ──

test('page fields: ev and page at log in, re-login, cart, logout and already', () => {
  const l = at({ acts: 'P' }, 1);
  assert.deepEqual([l.ev.sid, l.ev.user, l.ev.setCookie, l.page.user, l.page.path, l.page.cart], ['a1b2', 'ana', ['sid'], 'ana', '/prijava', 0]);
  assert.deepEqual([at({ acts: 'PQP' }, 3).ev.sid, at({ acts: 'PQP' }, 3).ev.user], ['c3d4', 'ana']);
  const already = at({ acts: 'PP' }, 2);
  assert.deepEqual([already.ev.user, already.page.user, already.ev.setCookie], ['ana', 'ana', []]);
  assert.deepEqual([3, 4].map((n) => atPreset('login-browse', n).ev.cart), [1, 2]);
  assert.deepEqual([atPreset('login-browse', 3).ev.user, atPreset('login-browse', 3).page.path], ['ana', '/kosarica']);
  const out = atPreset('logout', 3);
  assert.deepEqual([out.ev.deleted, out.ev.user, out.page.user, out.page.cart], ['a1b2', null, null, null]);
  assert.equal(atPreset('strict', 3).ev.jarSid, 'a1b2');
  assert.equal(atPreset('login-browse', 1).ev.jarSid, null);
});

test('page fields: a close step has no request and no verdicts; expired and closed are told apart', () => {
  const s = atPreset('browser-closed', 3);
  assert.deepEqual([s.lastRequest, s.verdicts, s.page, s.ev.dropped, s.ev.expired], [null, null, null, ['sid'], []]);
  const exp = at({ acts: 'P' + 'X'.repeat(12), persistent: true }, 13);
  assert.deepEqual([exp.ev.dropped, exp.ev.expired], [[], ['sid']]);
  const req = kit.stateAt(L, P({ acts: 'P' + 'X'.repeat(11) + 'GGGGG', persistent: true }), 17);
  assert.deepEqual(req.ev.expired, ['sid']);
  assert.deepEqual(atPreset('login-browse', 3).ev.expired, []);
});

test('page fields: the chart rows of a step from drugi.example', () => {
  const s = atPreset('lax-link-vs-form', 3);
  const rows = s.log.filter((r) => r.n === 3).map((r) => r.k === 'req'
    ? [r.k, r.to, r.method, r.path, r.cross, r.t] : [r.k, r.from, r.status, r.t]);
  assert.deepEqual(rows, [
    ['req', 'D', 'GET', '/', false, 180], ['res', 'D', 200, 180],
    ['req', 'S', 'POST', '/kosarica', true, 180], ['res', 'S', 200, 180]
  ]);
  assert.deepEqual([s.lastRequest.kind, s.lastRequest.method, s.lastRequest.to, s.lastRequest.crossSite], ['form', 'POST', L.SHOP, true]);
  assert.equal(atPreset('lax-link-vs-form', 2).lastRequest.kind, 'navigation');
});

test('cart items: the shop\'s k-n and drugi.example\'s x-n numbered apart', () => {
  assert.deepEqual(at({ acts: 'POKO', sameSite: 'None' }, 4).sessions.a1b2.cart, ['x-1', 'k-1', 'x-2']);
});

test('store: a new cookie with Max-Age ≤ 0 is not kept', () => {
  const r = L.store([], { name: 'x', value: '1', maxAge: 0 }, L.SHOP, 50);
  assert.deepEqual([r.jar.length, r.stored], [0, false]);
});

// ── the action keys ──

test('a key press is the next step and drops the rest of the run', () => {
  assert.equal(L.press('GPKKG', 2, 'q'), 'GPQ');
  assert.equal(L.press('GPKKG', 5, 'X'), 'GPKKGX');
  assert.equal(L.press('', 0, 'P'), 'P');
  assert.equal(L.press('GP', 20, 'P'), null);
  assert.equal(L.press('GP', 1, 'Z'), null);
  assert.equal(L.steps(P({ acts: 'G'.repeat(25) })), 20);
  assert.deepEqual(L.actsOf({ acts: 'gz?p' }), ['G', 'P']);
});

test('every action key is free in the kit and has a name', () => {
  const reserved = ['r', 'f', 'c', 'b', 'h', 'l'];
  for (const k of L.KEYS) assert.ok(reserved.indexOf(k.toLowerCase()) < 0, k);
  assert.deepEqual(L.KEYS, ['P', 'G', 'K', 'D', 'O', 'X', 'Q']);
  for (const k of L.KEYS) assert.ok(('act' + k) in strings.hr && ('act' + k) in strings.en, 'action name ' + k);
});

test('session IDs are handed out in order', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(L.sidAt), ['a1b2', 'c3d4', 'e5f6', 'g7h8', 's5', 's6']);
});

// ── generic checks every sim keeps ──

const RUNS = [P(), P({ acts: 'PDOXGKQGPOG', sameSite: 'None', persistent: true }), P({ acts: 'XKQPPDDOOG', sameSite: 'Strict' })];

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
  const p = RUNS[1];
  let s = L.initial(p);
  for (let n = 1; n <= L.steps(p); n++) {
    const before = structuredClone(s);
    const next = L.step(s, n, p);
    assert.deepEqual(s, before);
    s = next;
  }
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
