/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cors: one cross-origin call, phase by phase. A script on a page asks the browser to fetch a URL; the
   browser (1) classifies the request (same origin / simple / needs a preflight), (2) if needed sends the preflight
   OPTIONS and checks its answer, (3) sends the actual request, which the server answers, and (4) checks the response
   headers and hands the body to the script or blocks it. A client that is not a browser sends the same request with no
   origin and no checks. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. URLs, header fields
   and bodies are data, not language.
   Message helpers (startLine, fieldValues) from sims/http-exchange/sim.js @ ac86af3 (not in models/ yet). */
(function (root) {
  'use strict';

  var VERSION = 'HTTP/1.1';
  var REASON = { 200: 'OK', 204: 'No Content' };
  var DEFAULT_PORT = { http: 80, https: 443 };

  /** Rule 3: the CORS-safelisted methods and the Content-Type values a simple request may carry (Fetch Standard). */
  var SAFE_METHODS = ['GET', 'HEAD', 'POST'];
  var SAFE_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
  /** Header names the browser sets itself (forbidden to scripts): they never make a request "not simple". */
  var BROWSER_SET = ['origin', 'cookie', 'host'];

  var METHODS = ['GET', 'POST', 'PUT'];
  var TARGETS = ['same', 'host', 'port', 'scheme'];

  var APP = { scheme: 'https', host: 'app.example', port: 443 };
  /** Where each target choice puts the page and the API. `scheme` moves the page to http and keeps the API on https:
      an https page calling http is stopped as mixed content before CORS, which is out of scope (SPEC.md). */
  var PLACES = {
    same: { page: APP, api: APP, path: '/api/data' },
    host: { page: APP, api: { scheme: 'https', host: 'api.example', port: 443 }, path: '/data' },
    port: { page: APP, api: { scheme: 'https', host: 'app.example', port: 8443 }, path: '/data' },
    scheme: { page: { scheme: 'http', host: 'app.example', port: 80 }, api: APP, path: '/api/data' }
  };

  var COOKIE = 'session=7f3a';
  var BODY = { json: '{"x":1}', text: 'x=1' };
  var DATA = { GET: '{"items":3}', POST: '{"saved":true}', PUT: '{"saved":true}' };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }

  // ── origins (rule 1) ──

  /** Rule 1: the serialised origin: scheme "://" host, then ":" port only when it is not the scheme's default. */
  function serialize(o) { return o.scheme + '://' + o.host + (o.port === DEFAULT_PORT[o.scheme] ? '' : ':' + o.port); }
  /** Rule 1: which parts of the triple match (the port is the effective port: 443 for https, 80 for http). */
  function compare(a, b) {
    var m = { scheme: a.scheme === b.scheme, host: a.host.toLowerCase() === b.host.toLowerCase(), port: a.port === b.port };
    m.same = m.scheme && m.host && m.port;
    return m;
  }

  // ── messages (from http-exchange) ──

  function startLine(m) {
    return m.dir === 'req' ? m.method + ' ' + m.target + ' ' + m.version : m.version + ' ' + m.code + ' ' + m.reason;
  }
  function fieldValues(headers, name) {
    var k = name.toLowerCase();
    return headers.filter(function (f) { return f[0].toLowerCase() === k; }).map(function (f) { return f[1]; });
  }

  // ── the request (rules 2, 3, 4) ──

  /** The essence of a MIME type: the part before ';', trimmed, lowercase. */
  function essence(v) { return String(v).split(';')[0].trim().toLowerCase(); }

  /** Rule 3: is this author header CORS-safelisted? Only Content-Type matters here (Accept and the language headers
      are safelisted too; the scripts here set none of them). Any other name a script sets is not. */
  function safeHeader(name, value) {
    var n = name.toLowerCase();
    if (n === 'accept' || n === 'accept-language' || n === 'content-language') return true;
    if (n === 'content-type') return SAFE_TYPES.indexOf(essence(value)) >= 0;
    return false;
  }

  /** Rule 4: the request headers that are not safelisted, as lowercase names, sorted, no duplicates (the form
      Access-Control-Request-Headers takes). Headers the browser sets itself are never counted. */
  function unsafeHeaders(headers) {
    var out = [];
    headers.forEach(function (f) {
      var n = f[0].toLowerCase();
      if (BROWSER_SET.indexOf(n) >= 0 || safeHeader(f[0], f[1])) return;
      if (out.indexOf(n) < 0) out.push(n);
    });
    return out.sort();
  }

  /**
   * Rules 2–4: how a browser treats a request: 'same' (same origin: no CORS), 'simple' (cross-origin, sent at once) or
   * 'preflight' (cross-origin, OPTIONS first). why: { method: the method is not safelisted, headers: unsafe names }.
   * Tie-break: a same-origin request is 'same' whatever its method and headers.
   */
  function classify(pageOrigin, apiOrigin, method, headers) {
    var why = { method: SAFE_METHODS.indexOf(method) < 0, headers: unsafeHeaders(headers) };
    if (compare(pageOrigin, apiOrigin).same) return { kind: 'same', why: why };
    return { kind: why.method || why.headers.length ? 'preflight' : 'simple', why: why };
  }

  // ── the browser's checks (rules 4, 5, 6) ──

  /**
   * Rules 5 and 6, the CORS check of a response, in the Fetch Standard's order: ACAO missing → 'acao-missing';
   * ACAO * without credentials → ok; ACAO not the page's origin → 'acao-star' (it was * with credentials) or
   * 'acao-other'; without credentials → ok; ACAC not exactly "true" → 'acac-missing'; else ok.
   * Tie-break: the first failing test names the reason (credentials, ACAO * and no ACAC → 'acao-star').
   */
  function corsCheck(res, pageOrigin, credentials) {
    var acao = fieldValues(res.headers, 'Access-Control-Allow-Origin')[0];
    if (acao === undefined) return { ok: false, fail: 'acao-missing', mark: [] };
    if (!credentials && acao === '*') return { ok: true, fail: null, mark: ['Access-Control-Allow-Origin'] };
    if (acao !== serialize(pageOrigin)) return { ok: false, fail: acao === '*' ? 'acao-star' : 'acao-other', mark: ['Access-Control-Allow-Origin'] };
    if (!credentials) return { ok: true, fail: null, mark: ['Access-Control-Allow-Origin'] };
    var acac = fieldValues(res.headers, 'Access-Control-Allow-Credentials')[0];
    if (acac !== 'true') return { ok: false, fail: 'acac-missing', mark: [] };
    return { ok: true, fail: null, mark: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'] };
  }

  function listOf(v) { return v === undefined ? [] : v.split(',').map(function (x) { return x.trim(); }).filter(Boolean); }

  /**
   * Rule 4, the browser's reading of a preflight answer: the CORS check (rules 5, 6, with the actual request's
   * credentials), an ok status (2xx), then the method (a safelisted method needs no listing), then every unsafe header
   * name (case-insensitive). The first failure names the reason: the CORS check's, 'status', 'method' or 'header'.
   */
  function preflightCheck(res, pageOrigin, credentials, method, unsafe) {
    var c = corsCheck(res, pageOrigin, credentials);
    if (!c.ok) return c;
    if (res.code < 200 || res.code > 299) return { ok: false, fail: 'status', mark: [] };
    var methods = listOf(fieldValues(res.headers, 'Access-Control-Allow-Methods')[0]);
    if (SAFE_METHODS.indexOf(method) < 0 && methods.indexOf(method) < 0) {
      return { ok: false, fail: 'method', mark: ['Access-Control-Allow-Methods'], missing: method };
    }
    var allowed = listOf(fieldValues(res.headers, 'Access-Control-Allow-Headers')[0]).map(function (x) { return x.toLowerCase(); });
    var miss = unsafe.filter(function (n) { return allowed.indexOf(n) < 0; });
    if (miss.length) return { ok: false, fail: 'header', mark: ['Access-Control-Allow-Headers'], missing: miss[0] };
    var mark = ['Access-Control-Allow-Origin'];
    if (SAFE_METHODS.indexOf(method) < 0) mark.push('Access-Control-Allow-Methods');
    if (unsafe.length) mark.push('Access-Control-Allow-Headers');
    return { ok: true, fail: null, mark: mark };
  }

  // ── the server (rule 7: it only declares) ──

  /** What the server is set to send. It sends the same CORS headers to everyone and never refuses on Origin. */
  function serverOf(p) {
    var place = PLACES[p.targetOrigin];
    return {
      origin: serialize(place.api),
      acao: p.acao === 'star' ? '*' : p.acao === 'exact' ? serialize(place.page) : null,
      acac: !!p.acac,
      allowMethods: p.allowPut ? ['GET', 'POST', 'PUT'] : ['GET', 'POST'],
      allowHeaders: p.allowPut ? ['Content-Type'] : [],
      log: []
    };
  }

  function corsHeaders(srv) {
    var out = [];
    if (srv.acao !== null) out.push(['Access-Control-Allow-Origin', srv.acao]);
    if (srv.acac) out.push(['Access-Control-Allow-Credentials', 'true']);
    return out;
  }

  /** The server's answer. OPTIONS: 204 with what it allows. Anything else: 200 with JSON; a write is done. */
  function serve(srv, req) {
    var headers = corsHeaders(srv), body = '';
    if (req.method === 'OPTIONS') {
      headers.push(['Access-Control-Allow-Methods', srv.allowMethods.join(', ')]);
      if (srv.allowHeaders.length) headers.push(['Access-Control-Allow-Headers', srv.allowHeaders.join(', ')]);
      return { dir: 'resp', version: VERSION, code: 204, reason: REASON[204], headers: headers, body: '', preflight: true, marks: [] };
    }
    body = DATA[req.method];
    return { dir: 'resp', version: VERSION, code: 200, reason: REASON[200],
      headers: [['Content-Type', 'application/json']].concat(headers), body: body, preflight: false, marks: [] };
  }

  // ── the run ──

  /** The fetch the script asks for (or the request the other client builds), before any browser header. */
  function intent(p) {
    var place = PLACES[p.targetOrigin], hasBody = p.method !== 'GET';
    var ctype = hasBody ? (p.jsonBody ? 'application/json' : 'text/plain') : null;
    return {
      url: serialize(place.api) + place.path,
      method: p.method,
      path: place.path,
      contentType: ctype,
      body: hasBody ? (p.jsonBody ? BODY.json : BODY.text) : '',
      headers: ctype ? [['Content-Type', ctype]] : [],
      credentials: !p.outside && !!p.credentials
    };
  }

  /** The actual request on the wire. A browser adds Origin to a cross-origin request and to any request whose method
      is not GET or HEAD (Fetch, "append a request Origin header"), and Cookie when the script asked for credentials.
      The other client adds neither: it has no page and no user's cookies. */
  function actual(p, it, kind) {
    var headers = [];
    if (!p.outside) {
      if (kind !== 'same' || (it.method !== 'GET' && it.method !== 'HEAD')) headers.push(['Origin', serialize(PLACES[p.targetOrigin].page)]);
      if (it.credentials) headers.push(['Cookie', COOKIE]);
    }
    return { dir: 'req', method: it.method, target: it.path, version: VERSION, headers: headers.concat(it.headers), body: it.body, preflight: false, marks: [] };
  }

  /** Rule 4: the preflight request: OPTIONS, Origin, the method and the unsafe header names; never credentials. */
  function preflightReq(p, it, unsafe) {
    var headers = [['Origin', serialize(PLACES[p.targetOrigin].page)], ['Access-Control-Request-Method', it.method]];
    if (unsafe.length) headers.push(['Access-Control-Request-Headers', unsafe.join(',')]);
    return { dir: 'req', method: 'OPTIONS', target: it.path, version: VERSION, headers: headers, body: '', preflight: true, marks: [] };
  }

  /** Everything the run will do, computed once: the classification, the preflight and the checks. */
  function plan(p) {
    var place = PLACES[p.targetOrigin], it = intent(p);
    var c = !p.outside ? classify(place.page, place.api, it.method, it.headers) : { kind: 'other', why: { method: false, headers: [] } };
    var srv = serverOf(p);
    var out = { kind: c.kind, why: c.why, intent: it, phases: ['classify'] };
    if (c.kind === 'preflight') {
      var pre = preflightReq(p, it, c.why.headers), preRes = serve(srv, pre);
      var pc = preflightCheck(preRes, place.page, it.credentials, it.method, c.why.headers);
      preRes.marks = pc.mark;
      out.preflight = { req: pre, res: preRes, check: pc };
      out.phases.push('preflight');
      if (!pc.ok) return out;
    }
    var req = actual(p, it, c.kind), res = serve(srv, req);
    out.req = req; out.res = res;
    out.phases.push('request');
    if (c.kind === 'simple' || c.kind === 'preflight') {
      var cc = corsCheck(res, place.page, it.credentials);
      res.marks = cc.mark;
      out.check = cc;
      out.phases.push('check');
    }
    return out;
  }

  function logLine(req, res) {
    return { method: req.method, path: req.target, origin: fieldValues(req.headers, 'Origin')[0] || null, code: res.code, write: req.method === 'POST' || req.method === 'PUT' };
  }

  var logic = {
    VERSION: VERSION, SAFE_METHODS: SAFE_METHODS, SAFE_TYPES: SAFE_TYPES, METHODS: METHODS, TARGETS: TARGETS, PLACES: PLACES,
    COOKIE: COOKIE, DEFAULT_PORT: DEFAULT_PORT,
    serialize: serialize, compare: compare, startLine: startLine, fieldValues: fieldValues, essence: essence,
    safeHeader: safeHeader, unsafeHeaders: unsafeHeaders, classify: classify, corsCheck: corsCheck,
    preflightCheck: preflightCheck, preflightReq: preflightReq, serverOf: serverOf, serve: serve, intent: intent, plan: plan,

    defaults: { outside: false, targetOrigin: 'host', method: 'GET', jsonBody: false, credentials: false, acao: 'none', acac: false, allowPut: false },

    steps: function (p) { return plan(p).phases.length; },

    initial: function (p) {
      var place = PLACES[p.targetOrigin], pl = plan(p), it = pl.intent;
      return {
        n: 0, phase: 'start', ev: { kind: 'start' }, done: false,
        client: p.outside ? 'other' : 'browser',
        pageOrigin: p.outside ? null : place.page,
        apiOrigin: place.api,
        match: p.outside ? null : compare(place.page, place.api),
        target: { url: it.url, origin: serialize(place.api), method: it.method, path: it.path, headers: it.headers.map(function (f) { return f[0]; }),
          contentType: it.contentType, credentials: it.credentials },
        kind: null, why: null,
        server: serverOf(p),
        messages: [],
        preflight: null,
        check: null,
        serverSaw: false,
        scriptCanRead: false,
        blocked: null,
        delivered: null
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev), pl = plan(p), phase = pl.phases[n - 1];
      s.n = n;
      if (!phase) { s.ev = { kind: 'idle' }; return s; }
      s.phase = phase;
      if (phase === 'classify') {
        // (1) the browser classifies the request (the other client: there is nothing to classify)
        s.kind = pl.kind;
        s.why = pl.why;
        s.ev = { kind: 'classify', class: pl.kind, method: pl.why.method, headers: pl.why.headers.slice() };
      } else if (phase === 'preflight') {
        // (2) OPTIONS and its answer; a failed preflight ends the run, the actual request is never sent
        var pf = pl.preflight;
        s.messages.push(pf.req, pf.res);
        s.server.log.push(logLine(pf.req, pf.res));
        s.preflight = { sent: true, ok: pf.check.ok, fail: pf.check.fail, missing: pf.check.missing || null };
        if (!pf.check.ok) { s.blocked = 'preflight'; s.scriptCanRead = false; }
        s.ev = { kind: 'preflight', ok: pf.check.ok, fail: pf.check.fail, missing: pf.check.missing || null };
      } else if (phase === 'request') {
        // (3) the actual request reaches the server, which answers; with no check to make the body goes on at once
        s.messages.push(pl.req, pl.res);
        s.server.log.push(logLine(pl.req, pl.res));
        s.serverSaw = true;
        var free = pl.kind === 'same' || pl.kind === 'other';
        if (free) { s.scriptCanRead = true; s.delivered = pl.res.body; }
        s.ev = { kind: 'request', class: pl.kind, code: pl.res.code, free: free };
      } else {
        // (4) the browser checks the response headers: the body to the script, or a network error and a console line
        s.check = { ok: pl.check.ok, fail: pl.check.fail };
        s.scriptCanRead = pl.check.ok;
        if (pl.check.ok) s.delivered = pl.res.body;
        else s.blocked = 'response';
        s.ev = { kind: 'check', ok: pl.check.ok, fail: pl.check.fail, write: pl.req.method !== 'GET' };
      }
      s.done = n === pl.phases.length;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
