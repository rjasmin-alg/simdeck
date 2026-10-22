/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for http-exchange: one HTTP/1.1 exchange at a time between a client and a server. A run is a list of
   requests (the preset's script, then any the user sent with S); each exchange is two steps: (1) the client sends
   the request, (2) the server parses it, picks the virtual host by Host, looks the path up and answers. A 301 makes
   the client build the follow-up request from Location, which is the next exchange. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. Site content
   (page headings, paths, names) is data, not language. */
(function (root) {
  'use strict';

  var VERSION = 'HTTP/1.1';
  var HTML = 'text/html; charset=utf-8';
  var FORM = 'application/x-www-form-urlencoded';
  var FORM_BODY = 'upit=papir';
  var MAX_REDIRECTS = 5;       // a client stops following after a few hops (no loops in these tables)
  var MAX_SENT = 8;            // requests the user may queue with S on top of the script
  var MAX_STEPS = 20;          // and never past the contract's 20 steps

  /** Reason phrases (RFC 9110 §15). Data the server sends; the client never reads them (rule 5). */
  var REASON = {
    200: 'OK', 301: 'Moved Permanently', 400: 'Bad Request', 403: 'Forbidden', 404: 'Not Found',
    405: 'Method Not Allowed', 500: 'Internal Server Error'
  };
  /** The codes this client knows by number; anything else it reads as x00 of its class (rule 5). */
  var KNOWN = [200, 301, 400, 403, 404, 405, 500];

  var METHODS = ['GET', 'HEAD', 'POST'];

  /** Resource kinds: file (static, 200), redirect (301 + Location), form (a program: GET shows it, POST processes
      the body), broken (a program that fails: 500), unreadable (file present, not readable: 403), hidden (file
      present, the server will not reveal it: 404), none (listed so it can be asked for; no file: 404). */
  var SCENES = {
    grafo: {
      server: 'www.grafo.hr', client: 'browser',
      hosts: ['www.grafo.hr', ''],
      vhosts: [
        { name: 'www.grafo.hr', root: '/var/www/grafo', resources: {
          '/': { kind: 'file', body: '<h1>Grafo d.o.o.</h1>' },
          '/proizvodi': { kind: 'redirect', location: '/katalog' },
          '/katalog': { kind: 'file', body: '<h1>Katalog proizvoda</h1>' },
          '/obrazac': { kind: 'form', body: '<h1>Obrazac za upit</h1>', reply: '<h1>Upit primljen</h1>' },
          '/cjenik': { kind: 'broken' }
        } }
      ]
    },
    lab: {
      server: '192.168.180.1', client: 'cli',
      hosts: ['www1.lab.example', 'www2.lab.example', 'www3.lab.example', '192.168.180.1', ''],
      vhosts: [
        { name: 'www1.lab.example', root: '/var/www/www1', resources: {
          '/': { kind: 'file', body: '<h1>Prvi poslužitelj</h1>' },
          '/nema': { kind: 'none' },
          '/privatno': { kind: 'unreadable' },
          '/skriveno': { kind: 'hidden' }
        } },
        { name: 'www2.lab.example', root: '/var/www/www2', resources: {
          '/': { kind: 'file', body: '<h1>Drugi poslužitelj</h1>' }
        } }
      ]
    }
  };

  /** Every path of a scene, in table order (the path select). */
  function pathsOf(scene) {
    var out = [];
    SCENES[scene].vhosts.forEach(function (v) {
      Object.keys(v.resources).forEach(function (p) { if (out.indexOf(p) < 0) out.push(p); });
    });
    return out;
  }

  /** The presets' scripts: the scene and the requests the user makes ([method, path, host]; host '' = left out). */
  var SCRIPTS = {
    redirect: { scene: 'grafo', reqs: [['GET', '/proizvodi', 'www.grafo.hr']] },
    'host-missing': { scene: 'lab', reqs: [['GET', '/', ''], ['GET', '/', '192.168.180.1']] },
    'wrong-vhost': { scene: 'lab', reqs: [['GET', '/', 'www3.lab.example']] },
    'head-vs-get': { scene: 'grafo', reqs: [['GET', '/katalog', 'www.grafo.hr'], ['HEAD', '/katalog', 'www.grafo.hr']] },
    'not-found-vs-forbidden': { scene: 'lab', reqs: [['GET', '/nema', 'www1.lab.example'], ['GET', '/privatno', 'www1.lab.example']] }
  };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function sceneOf(p) { return SCRIPTS[p.script].scene; }

  /** Length of a string in UTF-8 bytes (Content-Length counts octets, RFC 9110 §8.6). */
  function utf8Length(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }

  // ── messages (rules 1, 2) ──

  /** Rule 1: request-line = method SP request-target SP HTTP-version; status-line = HTTP-version SP status-code SP
      [reason-phrase]. */
  function startLine(m) {
    return m.dir === 'req' ? m.method + ' ' + m.target + ' ' + m.version : m.version + ' ' + m.code + ' ' + m.reason;
  }
  /** Rule 2: start line, CRLF, header lines each ending in CRLF, an empty line (CRLF), then the body. */
  function wire(m) {
    return startLine(m) + '\r\n' + m.headers.map(function (f) { return f[0] + ': ' + f[1] + '\r\n'; }).join('') + '\r\n' + m.body;
  }
  /** Rule 2: header field names are case-insensitive. Every value of the field `name`, in order. */
  function fieldValues(headers, name) {
    var k = name.toLowerCase();
    return headers.filter(function (f) { return f[0].toLowerCase() === k; }).map(function (f) { return f[1]; });
  }

  /** The request the client builds for [method, path, host]. A host of '' leaves the Host line out (what a
      command-line client does when told to send an empty Host). POST carries the form's body. */
  function buildRequest(method, path, host, via) {
    var headers = host ? [['Host', host]] : [];
    var body = '';
    if (method === 'POST') {
      body = FORM_BODY;
      headers.push(['Content-Type', FORM], ['Content-Length', String(utf8Length(body))]);
    }
    return { dir: 'req', method: method, target: path, version: VERSION, headers: headers, body: body, host: host, via: via || 'user' };
  }

  // ── the server (rules 3, 4, 6, 7, 8) ──

  /** Rule 4: the virtual host whose name equals the Host value (names are case-insensitive), else the first one
      (the default). */
  function pickVhost(vhosts, host) {
    var h = String(host).toLowerCase();
    var hit = vhosts.filter(function (v) { return v.name.toLowerCase() === h; })[0];
    return hit ? { vhost: hit, byDefault: false } : { vhost: vhosts[0], byDefault: true };
  }

  /** What the resource gives, before the method: [code, body, extra headers]. Rule 8: hidden answers like none. */
  function outcome(res, method) {
    if (!res || res.kind === 'none' || res.kind === 'hidden') return { code: 404, why: res ? res.kind : 'none' };
    if (res.kind === 'unreadable') return { code: 403, why: 'unreadable' };
    if (res.kind === 'redirect') return { code: 301, why: 'redirect', location: res.location };
    var allow = res.kind === 'form' ? ['GET', 'HEAD', 'POST'] : ['GET', 'HEAD'];
    if (allow.indexOf(method) < 0) return { code: 405, why: 'method', allow: allow };
    if (res.kind === 'broken') return { code: 500, why: 'broken' };
    if (res.kind === 'form' && method === 'POST') return { code: 200, why: 'processed', body: res.reply };
    return { code: 200, why: res.kind === 'form' ? 'program' : 'file', body: res.body };
  }

  function errorBody(code) { return '<h1>' + code + ' ' + REASON[code] + '</h1>'; }

  /** The server's answer to one request: the response and how it decided (for the page). */
  function serve(scene, req) {
    var vhosts = SCENES[scene].vhosts;
    var hosts = fieldValues(req.headers, 'Host');
    var d = { hosts: hosts.length, host: hosts[0] === undefined ? null : hosts[0], vhost: null, byDefault: false, path: req.target, why: null };
    var o;
    // rule 3: an HTTP/1.1 request without Host, or any request with more than one, gets 400; no virtual host is picked
    if (hosts.length > 1 || (req.version === VERSION && !hosts.length)) o = { code: 400, why: 'host' };
    else {
      var pick = pickVhost(vhosts, hosts[0]);
      d.vhost = pick.vhost.name;
      d.byDefault = pick.byDefault;
      o = outcome(pick.vhost.resources[req.target], req.method);
    }
    d.why = o.why;
    var body = o.code === 200 ? o.body : o.code === 301 ? '' : errorBody(o.code);
    var headers = [];
    if (o.location) headers.push(['Location', o.location]);
    if (o.allow) headers.push(['Allow', o.allow.join(', ')]);
    if (body) headers.push(['Content-Type', HTML]);
    headers.push(['Content-Length', String(utf8Length(body))]);
    // rule 7: HEAD gets the same header fields as GET, and no body
    if (req.method === 'HEAD') body = '';
    var marks = o.location ? ['Location'] : o.allow ? ['Allow'] : [];
    return {
      res: { dir: 'resp', version: VERSION, code: o.code, reason: REASON[o.code], headers: headers, body: body, marks: marks },
      decision: d
    };
  }

  // ── the client (rules 5, 6) ──

  /** Rule 5: the first digit is the class. */
  function statusClass(code) { return Math.floor(code / 100); }
  /** Rule 5: a code the client does not know is read as x00 of its class. The reason phrase is never read. */
  function readAs(code) { return KNOWN.indexOf(code) >= 0 ? code : statusClass(code) * 100; }

  /** Rule 6: after a 301 the client sends a new request to Location, same host (the Location here is a
      path). It keeps the method, except POST, which it turns into GET without the body (RFC 9110 §15.4.2). */
  function followUp(req, res) {
    var code = readAs(res.code);
    if (code !== 301) return null;
    var loc = fieldValues(res.headers, 'Location')[0];
    if (!loc) return null;
    return buildRequest(req.method === 'POST' ? 'GET' : req.method, loc, req.host, 'redirect');
  }

  // ── the run ──

  /** The requests the user sent with S, decoded from the param `sent` (one number keeps it in the URL). Each
      request is a digit 1…base−1 in base `base`, the first sent the lowest digit. */
  function alphabet(scene) {
    var paths = pathsOf(scene), hosts = SCENES[scene].hosts;
    return { paths: paths, hosts: hosts, base: METHODS.length * paths.length * hosts.length + 1 };
  }
  function encodeReq(scene, r) {
    var a = alphabet(scene);
    var m = METHODS.indexOf(r[0]), pi = a.paths.indexOf(r[1]), hi = a.hosts.indexOf(r[2]);
    if (m < 0 || pi < 0 || hi < 0) throw new Error('request not in the scene: ' + r.join(' '));
    return 1 + (m * a.paths.length + pi) * a.hosts.length + hi;
  }
  function decodeSent(scene, sent) {
    var a = alphabet(scene), out = [], v = Math.floor(Number(sent) || 0);
    while (v > 0 && out.length < MAX_SENT) {
      var d = v % a.base - 1;
      v = Math.floor(v / a.base);
      if (d < 0) continue;
      var hi = d % a.hosts.length, rest = (d - hi) / a.hosts.length;
      var pi = rest % a.paths.length, m = (rest - pi) / a.paths.length;
      out.push([METHODS[m], a.paths[pi], a.hosts[hi]]);
    }
    return out;
  }
  /** `sent` with one more request queued (the S button). */
  function pushSent(scene, sent, r) {
    var n = decodeSent(scene, sent).length;
    return Number(sent || 0) + encodeReq(scene, r) * Math.pow(alphabet(scene).base, n);
  }
  function sentMax(scene) { return Math.pow(alphabet(scene).base, MAX_SENT) - 1; }

  /** Every exchange of a run, in order: the request and the server's answer, redirects followed. */
  function exchanges(p) {
    var scene = sceneOf(p);
    var reqs = SCRIPTS[p.script].reqs.concat(decodeSent(scene, p.sent));
    var out = [];
    reqs.forEach(function (r, k) {
      var req = buildRequest(r[0], r[1], r[2], 'user'), hops = 0;
      while (req) {
        var a = serve(scene, req);
        out.push({ req: req, res: a.res, decision: a.decision, user: k });
        req = hops++ < MAX_REDIRECTS ? followUp(req, a.res) : null;
      }
    });
    return out;
  }
  /** May the user queue this request? Only while the run stays within MAX_SENT requests and MAX_STEPS steps. */
  function canSend(p, r) {
    var scene = sceneOf(p);
    if (decodeSent(scene, p.sent).length >= MAX_SENT) return false;
    var next = Object.assign({}, p, { sent: pushSent(scene, p.sent, r) });
    return exchanges(next).length * 2 <= MAX_STEPS;
  }

  function serverOf(scene) {
    return {
      name: SCENES[scene].server,
      vhosts: SCENES[scene].vhosts.map(function (v, i) { return { name: v.name, root: v.root, default: i === 0 }; }),
      resources: SCENES[scene].vhosts.reduce(function (acc, v) {
        Object.keys(v.resources).forEach(function (path) {
          var r = v.resources[path], o = outcome(r, 'GET');
          acc[v.name + path] = { vhost: v.name, path: path, kind: r.kind, status: o.code, location: r.location || null, body: r.body || null };
        });
        return acc;
      }, {})
    };
  }

  var logic = {
    VERSION: VERSION, REASON: REASON, KNOWN: KNOWN, METHODS: METHODS, SCENES: SCENES, SCRIPTS: SCRIPTS,
    MAX_SENT: MAX_SENT, MAX_STEPS: MAX_STEPS, FORM_BODY: FORM_BODY,
    pathsOf: pathsOf, sceneOf: sceneOf, utf8Length: utf8Length, startLine: startLine, wire: wire, fieldValues: fieldValues,
    buildRequest: buildRequest, pickVhost: pickVhost, serve: serve, statusClass: statusClass, readAs: readAs,
    followUp: followUp, encodeReq: encodeReq, decodeSent: decodeSent, pushSent: pushSent, sentMax: sentMax,
    exchanges: exchanges, canSend: canSend,

    defaults: { script: 'redirect', sent: 0, method: 'GET', pathG: '/', hostG: 'www.grafo.hr', pathL: '/', hostL: 'www1.lab.example' },

    steps: function (p) { return exchanges(p).length * 2; },

    initial: function (p) {
      var scene = sceneOf(p), all = exchanges(p);
      return {
        n: 0, scene: scene, phase: 'start', ev: { kind: 'start' }, done: false,
        messages: [], server: serverOf(scene),
        pending: all.length ? all[0].req : null,
        decision: null, shown: null
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev), all = exchanges(p);
      var k = Math.floor((n - 1) / 2), x = all[k];
      s.n = n;
      if (!x) { s.ev = { kind: 'idle' }; s.done = true; return s; }
      if (n % 2 === 1) {
        // (1) the client sends the pending request
        s.phase = 'request';
        s.messages.push(x.req);
        s.pending = null;
        s.decision = null;
        s.ev = { kind: 'request' };
      } else {
        // (2) the server answers; the client reads the class and, after a 301, builds the follow-up
        s.phase = 'response';
        s.messages.push(x.res);
        s.decision = x.decision;
        var next = all[k + 1];
        s.pending = next ? next.req : null;
        var follow = next && next.req.via === 'redirect';
        s.shown = { code: x.res.code, method: x.req.method, body: x.res.body };
        s.ev = { kind: 'response', code: x.res.code, why: x.decision.why, byDefault: x.decision.byDefault, follow: !!follow,
          hops: all.filter(function (y) { return y.user === x.user; }).length };
      }
      s.done = n === all.length * 2;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
