/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for oauth-flow: the OAuth 2.0 authorization code flow with PKCE and the OpenID Connect ID token, between the
   user's browser (B), the client app Fotoalbum (A, app.example), the identity provider / authorization server (I,
   idp.example) and the album API (R, api.example), plus a third party (X, drugi.example) when an attack is chosen.
   One step is one message (or the app's state check). Rules, tie-breaks and numbers: SPEC.md. Redirects are
   `302` + `Location` as in sims/http-exchange (no model code copied: its model is a virtual-host table).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. Host names, URLs,
   parameter names and values are data, not language. */
(function (root) {
  'use strict';

  var APP = 'app.example';
  var IDP = 'idp.example';
  var API = 'api.example';
  var OTHER = 'drugi.example';
  var CLIENT = 'fotoalbum';
  var REDIRECT = 'https://app.example/cb';
  var BAD_REDIRECT = 'https://drugi.example/cb';
  var CLIENTS = { fotoalbum: { redirectUris: [REDIRECT] } };   // the IdP's registrations
  var USER = 'ana';
  var SCOPE = 'openid albums';
  var STATE = 'x7f2';
  var FORGED_STATE = 'zz91';
  var FORGED_CODE = 'M8k1';    // the third party's own code (attack `state`)
  var VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';   // RFC 7636 Appendix B
  var CODES = ['Q3p9', 'R2v6', 'T4m8'];
  var ACCESS = ['at-5Kd2', 'at-9Wq4', 'at-3Hn7'];
  var ALBUMS = 3;
  var ATTACKS = ['none', 'state', 'steal', 'redirect'];
  var VIEWS = ['B', 'A', 'I'];
  var LANES = ['B', 'A', 'I', 'R', 'X'];
  var ITEMS = ['password', 'state', 'challenge', 'verifier', 'code', 'access', 'id'];

  /** The run of each attack: one entry per step (SPEC.md, One step). */
  var PLANS = {
    none: ['click', 'toIdp', 'login', 'back', 'check', 'token', 'tokens', 'api', 'albums'],
    state: ['click', 'toIdp', 'login', 'forged', 'check'],
    steal: ['click', 'toIdp', 'login', 'back', 'check', 'thiefToken', 'thiefAnswer', 'token', 'tokens'],
    redirect: ['forgedLink', 'toIdpBad']
  };

  var PRESETS = {
    normal: {},
    'state-mismatch': { attack: 'state' },
    'stolen-code-pkce': { attack: 'steal' },
    'stolen-code-no-pkce': { attack: 'steal', pkce: false },
    'wrong-redirect': { attack: 'redirect' }
  };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function attackOf(p) { return ATTACKS.indexOf(p.attack) >= 0 ? p.attack : 'none'; }
  function planOf(p) { return PLANS[attackOf(p)]; }
  function codeAt(i) { return i < CODES.length ? CODES[i] : 'c' + (i + 1); }
  function accessAt(i) { return i < ACCESS.length ? ACCESS[i] : 'at-' + (i + 1); }
  function idAt(i) { return 'eyJ…' + (i + 1); }

  // ── SHA-256 and BASE64URL (rule 4), pure ──

  var K = [];
  (function () {
    var primes = [], x = 2;
    while (primes.length < 64) {
      var isP = true;
      for (var i = 0; i < primes.length && primes[i] * primes[i] <= x; i++) if (x % primes[i] === 0) { isP = false; break; }
      if (isP) primes.push(x);
      x++;
    }
    primes.forEach(function (q) { K.push((Math.pow(q, 1 / 3) % 1) * 4294967296 | 0); });
  })();

  /** SHA-256 of an ASCII string, as an array of 32 bytes (FIPS 180-4). */
  function sha256(ascii) {
    var bytes = [];
    for (var i = 0; i < ascii.length; i++) bytes.push(ascii.charCodeAt(i) & 0xff);
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var b = 7; b >= 0; b--) bytes.push(b >= 4 ? 0 : (bitLen >>> (b * 8)) & 0xff);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function rotr(v, r) { return (v >>> r) | (v << (32 - r)); }
    for (var off = 0; off < bytes.length; off += 64) {
      var w = [];
      for (var t = 0; t < 64; t++) {
        if (t < 16) w[t] = (bytes[off + 4 * t] << 24) | (bytes[off + 4 * t + 1] << 16) | (bytes[off + 4 * t + 2] << 8) | bytes[off + 4 * t + 3];
        else {
          var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
          var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
          w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
        }
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (var j = 0; j < 64; j++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H = [H[0] + a, H[1] + bb, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map(function (v) { return v | 0; });
    }
    var out = [];
    H.forEach(function (v) { out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); });
    return out;
  }

  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  /** BASE64URL without padding (RFC 7636 Appendix A). */
  function base64url(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      var chars = i + 2 < bytes.length ? 4 : i + 1 < bytes.length ? 3 : 2;
      for (var k = 0; k < chars; k++) out += B64.charAt((n >>> (18 - 6 * k)) & 63);
    }
    return out;
  }
  /** Rule 4: code_challenge = BASE64URL(SHA-256(ASCII(code_verifier))), method S256. */
  function challengeOf(verifier) { return base64url(sha256(verifier)); }

  // ── the IdP's and the app's checks (rules 3–7) ──

  /** Rule 5: the authorization request. Unknown client first, then the redirect URI by exact string comparison. */
  function authorize(clients, req) {
    var c = clients[req.clientId];
    if (!c) return { ok: false, why: 'client' };
    if (c.redirectUris.indexOf(req.redirectUri) < 0) return { ok: false, why: 'redirect' };
    return { ok: true, why: null };
  }

  /** Rule 3: the state that came back equals the one sent; exact and case-sensitive; a missing one never matches. */
  function stateOk(sent, got) { return typeof got === 'string' && got.length > 0 && got === sent; }

  /** Rules 4 and 6: a token request. Returns { idp (new), ok, why, access, id, revoked[] }. First failing check wins:
      unknown code, used, client, redirect_uri, PKCE. A failed request does not use up the code; a second use revokes
      the tokens issued for the code. */
  function redeem(idp, req) {
    var d = copy(idp);
    var code = d.codes[req.code];
    function fail(why, revoked) { return { idp: d, ok: false, why: why, access: null, id: null, revoked: revoked || [] }; }
    if (!code) return fail('unknown');
    if (code.used) {
      var revoked = code.tokens.filter(function (tk) { return !d.tokens[tk].revoked; });
      revoked.forEach(function (tk) { d.tokens[tk].revoked = true; });
      return fail('used', revoked);
    }
    if (req.clientId !== code.clientId) return fail('client');
    if (req.redirectUri !== code.redirectUri) return fail('redirect');
    if (code.challenge !== null) {
      if (!req.verifier || challengeOf(req.verifier) !== code.challenge) return fail('pkce');
    } else if (req.verifier) return fail('pkce');
    code.used = true;
    var i = d.issued;
    var access = accessAt(i), id = code.scope.split(' ').indexOf('openid') >= 0 ? idAt(i) : null;
    d.issued = i + 1;
    d.tokens[access] = { kind: 'access', user: code.user, scope: code.scope, code: req.code, revoked: false };
    code.tokens.push(access);
    if (id) {
      d.tokens[id] = { kind: 'id', user: code.user, scope: code.scope, code: req.code, revoked: false,
        claims: { iss: 'https://' + IDP, sub: code.user, aud: code.clientId } };
      code.tokens.push(id);
    }
    return { idp: d, ok: true, why: null, access: access, id: id, revoked: [] };
  }

  /** Rule 7: the API's check of an `Authorization` header. It asks the IdP (its token table), never the app. */
  function apiCheck(idp, header, need) {
    var m = /^Bearer (.+)$/.exec(header || '');
    if (!m) return { status: 401, why: 'missing' };
    var tk = idp.tokens[m[1]];
    if (!tk) return { status: 401, why: 'unknown' };
    if (tk.kind !== 'access') return { status: 401, why: 'not-access' };
    if (tk.revoked) return { status: 401, why: 'revoked' };
    if (tk.scope.split(' ').indexOf(need || 'albums') < 0) return { status: 403, why: 'scope' };
    return { status: 200, why: null, user: tk.user };
  }

  /** The query of the authorization request, as [name, value] pairs in the order sent. */
  function authorizeQuery(o) {
    var q = [['response_type', 'code'], ['client_id', o.clientId], ['redirect_uri', o.redirectUri], ['scope', SCOPE], ['state', o.state]];
    if (o.challenge) q.push(['code_challenge', o.challenge], ['code_challenge_method', 'S256']);
    return q;
  }
  function urlOf(base, q) {
    return base + '?' + q.map(function (x) { return x[0] + '=' + x[1]; }).join('&');
  }

  /** Who sees a chart row: a message its sender and receivers, a note its own lane. */
  function seenBy(row, lane) {
    if (row.k === 'note') return row.lane === lane;
    return row.from === lane || row.to === lane;
  }

  /** The holders of every item so far: { item: { lane: [values] } }, from `holds`. */
  function holders(s) {
    var out = {};
    ITEMS.forEach(function (it) { out[it] = {}; });
    s.holds.forEach(function (x) { (out[x.item][x.lane] = out[x.item][x.lane] || []).push(x.value); });
    return out;
  }

  // ── one step ──

  function hold(s, lane, item, value) {
    var has = s.holds.some(function (x) { return x.lane === lane && x.item === item && x.value === value; });
    if (!has) { s.holds.push({ item: item, value: value, lane: lane, n: s.n }); s.changed.push(item + ':' + lane); }
  }
  function msg(s, from, to, label, carries, extra) {
    var row = Object.assign({ k: 'msg', n: s.n, from: from, to: to, channel: from === 'B' || to === 'B' ? 'front' : 'back',
      label: label, carries: carries }, extra || {});
    s.log.push(row);
    carries.forEach(function (c) { hold(s, from, c.item, c.value); hold(s, to, c.item, c.value); });
    return row;
  }
  function note(s, lane, what, carries, extra) {
    var row = Object.assign({ k: 'note', n: s.n, lane: lane, what: what, carries: carries || [] }, extra || {});
    s.log.push(row);
    row.carries.forEach(function (c) { hold(s, lane, c.item, c.value); });
    return row;
  }
  function visit(s, url) { s.browser.url = url; s.browser.history.push(url); }
  function it(item, value) { return { item: item, value: value }; }

  var DO = {
    click: function (s) {
      msg(s, 'B', 'A', 'GET /login', [], { url: 'https://' + APP + '/login' });
      visit(s, 'https://' + APP + '/login');
      s.ev = { kind: 'click' };
    },

    toIdp: function (s, p) {
      var challenge = p.pkce ? challengeOf(VERIFIER) : null;
      s.app.state = STATE;
      s.app.verifier = p.pkce ? VERIFIER : null;
      hold(s, 'A', 'state', STATE);
      if (p.pkce) { hold(s, 'A', 'verifier', VERIFIER); hold(s, 'A', 'challenge', challenge); }
      var q = authorizeQuery({ clientId: CLIENT, redirectUri: REDIRECT, state: STATE, challenge: challenge });
      var url = urlOf('https://' + IDP + '/authorize', q);
      var carries = [it('state', STATE)].concat(challenge ? [it('challenge', challenge)] : []);
      msg(s, 'A', 'B', '302', carries, { location: url, query: q });
      msg(s, 'B', 'I', 'GET /authorize', carries, { url: url, query: q });
      visit(s, url);
      var a = authorize(CLIENTS, { clientId: CLIENT, redirectUri: REDIRECT });
      s.idp.request = { clientId: CLIENT, redirectUri: REDIRECT, state: STATE, challenge: challenge, ok: a.ok };
      s.ev = { kind: 'toIdp', ok: a.ok, why: a.why, pkce: !!challenge };
    },

    forgedLink: function (s) {
      var q = authorizeQuery({ clientId: CLIENT, redirectUri: BAD_REDIRECT, state: FORGED_STATE, challenge: null });
      var url = urlOf('https://' + IDP + '/authorize', q);
      visit(s, 'https://' + OTHER + '/');
      msg(s, 'X', 'B', '302', [], { location: url, query: q });
      s.ev = { kind: 'forgedLink', redirectUri: BAD_REDIRECT };
    },

    toIdpBad: function (s) {
      var req = s.log[s.log.length - 1];
      msg(s, 'B', 'I', 'GET /authorize', [], { url: req.location, query: req.query });
      visit(s, req.location);
      var a = authorize(CLIENTS, { clientId: CLIENT, redirectUri: BAD_REDIRECT });
      s.idp.request = { clientId: CLIENT, redirectUri: BAD_REDIRECT, state: FORGED_STATE, challenge: null, ok: a.ok };
      msg(s, 'I', 'B', '400', [], { refusal: a.why });
      s.outcome = 'refused';
      s.ev = { kind: 'toIdpBad', ok: a.ok, why: a.why, redirectUri: BAD_REDIRECT };
    },

    login: function (s) {
      hold(s, 'B', 'password', '••••••');
      msg(s, 'B', 'I', 'POST /login', [it('password', '••••••')], { user: USER, consent: SCOPE });
      visit(s, 'https://' + IDP + '/login');
      s.idp.session = USER;
      var code = codeAt(s.idp.next);
      s.idp.next += 1;
      var r = s.idp.request;
      s.idp.codes[code] = { clientId: r.clientId, redirectUri: r.redirectUri, challenge: r.challenge, user: USER,
        scope: SCOPE, used: false, tokens: [] };
      hold(s, 'I', 'code', code);
      s.ev = { kind: 'login', code: code };
    },

    back: function (s, p) {
      var code = codeAt(s.idp.next - 1);
      var url = s.idp.request.redirectUri + '?code=' + code + '&state=' + s.idp.request.state;
      var carries = [it('code', code), it('state', s.idp.request.state)];
      msg(s, 'I', 'B', '302', carries, { location: url });
      msg(s, 'B', 'A', 'GET /cb', carries, { url: url });
      visit(s, url);
      s.app.got = { code: code, state: s.idp.request.state };
      if (attackOf(p) === 'steal') {
        note(s, 'X', 'copied', [it('code', code)]);
        s.thief.code = code;
      }
      s.ev = { kind: 'back', code: code, stolen: attackOf(p) === 'steal' };
    },

    forged: function (s) {
      var url = REDIRECT + '?code=' + FORGED_CODE + '&state=' + FORGED_STATE;
      var carries = [it('code', FORGED_CODE), it('state', FORGED_STATE)];
      // X holds its own code and state by sending them (msg)
      visit(s, 'https://' + OTHER + '/');
      msg(s, 'X', 'B', '302', carries, { location: url });
      msg(s, 'B', 'A', 'GET /cb', carries, { url: url });
      visit(s, url);
      s.app.got = { code: FORGED_CODE, state: FORGED_STATE };
      s.ev = { kind: 'forged', code: FORGED_CODE };
    },

    check: function (s) {
      var ok = stateOk(s.app.state, s.app.got && s.app.got.state);
      note(s, 'A', ok ? 'stateOk' : 'stateBad', [], { sent: s.app.state, got: s.app.got ? s.app.got.state : null });
      if (!ok) { s.app.error = 'state'; s.outcome = 'state-mismatch'; }
      s.ev = { kind: 'check', ok: ok, sent: s.app.state, got: s.app.got ? s.app.got.state : null };
    },

    thiefToken: function (s) {
      tokenRequest(s, 'X', { code: s.thief.code, clientId: CLIENT, redirectUri: REDIRECT, verifier: null });
    },
    token: function (s) {
      tokenRequest(s, 'A', { code: s.app.got.code, clientId: CLIENT, redirectUri: REDIRECT, verifier: s.app.verifier });
    },
    thiefAnswer: function (s) { tokenAnswer(s, 'X'); },
    tokens: function (s) { tokenAnswer(s, 'A'); },

    api: function (s) {
      var header = 'Bearer ' + s.app.tokens.access;
      msg(s, 'A', 'R', 'GET /albums', [it('access', s.app.tokens.access)], { header: header });
      s.api.pending = apiCheck(s.idp, header, 'albums');
      s.ev = { kind: 'api', check: s.api.pending };
    },

    albums: function (s) {
      var r = s.api.pending;
      msg(s, 'R', 'A', String(r.status), [], { albums: r.status === 200 ? ALBUMS : null });
      s.api.last = { status: r.status, why: r.why, albums: r.status === 200 ? ALBUMS : null };
      s.api.pending = null;
      s.ev = { kind: 'albums', status: r.status, albums: s.api.last.albums };
    }
  };

  function tokenRequest(s, from, req) {
    var carries = [it('code', req.code)].concat(req.verifier ? [it('verifier', req.verifier)] : []);
    msg(s, from, 'I', 'POST /token', carries, { clientId: req.clientId, redirectUri: req.redirectUri, verifier: !!req.verifier });
    var r = redeem(s.idp, req);
    s.idp = r.idp;
    if (r.ok) { hold(s, 'I', 'access', r.access); if (r.id) hold(s, 'I', 'id', r.id); }
    s.pending = { to: from, ok: r.ok, why: r.why, access: r.access, id: r.id, revoked: r.revoked };
    s.ev = { kind: 'tokenRequest', from: from, code: req.code, verifier: !!req.verifier, ok: r.ok, why: r.why, revoked: r.revoked };
  }

  function tokenAnswer(s, to) {
    var r = s.pending;
    var carries = r.ok ? [it('access', r.access)].concat(r.id ? [it('id', r.id)] : []) : [];
    msg(s, 'I', to, r.ok ? '200' : '400', carries, { error: r.ok ? null : 'invalid_grant' });
    var tokens = r.ok ? { access: r.access, id: r.id } : null;
    if (to === 'X') s.thief.tokens = tokens;
    else {
      s.app.tokens = tokens;
      if (r.ok) s.app.user = r.id ? s.idp.tokens[r.id].claims.sub : null;
      else s.app.error = 'grant';
    }
    if (to === 'A') s.outcome = r.ok ? 'ok' : s.thief.tokens ? 'stolen' : 'refused';
    s.pending = null;
    s.ev = { kind: 'tokenAnswer', to: to, ok: r.ok, why: r.why, revoked: r.revoked, access: r.access, id: r.id };
  }

  var logic = {
    APP: APP, IDP: IDP, API: API, OTHER: OTHER, CLIENT: CLIENT, REDIRECT: REDIRECT, BAD_REDIRECT: BAD_REDIRECT,
    CLIENTS: CLIENTS, USER: USER, SCOPE: SCOPE, STATE: STATE, FORGED_STATE: FORGED_STATE, FORGED_CODE: FORGED_CODE,
    VERIFIER: VERIFIER, ALBUMS: ALBUMS, ATTACKS: ATTACKS, VIEWS: VIEWS, LANES: LANES, ITEMS: ITEMS, PLANS: PLANS,
    PRESETS: PRESETS,
    attackOf: attackOf, planOf: planOf, codeAt: codeAt, accessAt: accessAt, idAt: idAt,
    sha256: sha256, base64url: base64url, challengeOf: challengeOf, authorize: authorize, stateOk: stateOk,
    redeem: redeem, apiCheck: apiCheck, authorizeQuery: authorizeQuery, seenBy: seenBy, holders: holders,

    defaults: { pkce: true, attack: 'none', view: 'B' },

    steps: function (p) { return planOf(p).length; },

    initial: function () {
      return {
        n: 0, log: [], holds: [], changed: [],
        app: { state: null, verifier: null, got: null, tokens: null, user: null, error: null },
        idp: { session: null, request: null, codes: {}, tokens: {}, next: 0, issued: 0 },
        api: { pending: null, last: null },
        thief: { code: null, tokens: null },
        browser: { url: null, history: [] },
        pending: null, outcome: null, ev: { kind: 'start' }
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.n = n;
      s.changed = [];
      var what = planOf(p)[n - 1];
      if (!what) { s.ev = { kind: 'idle' }; return s; }
      DO[what](s, p);
      s.ev.step = what;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
