/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the HTTP status codes poster: five classes (1xx … 5xx), the codes that matter as cards, each with an
   example exchange on the course book's site (request, response and the follow-up the client makes, if any), the
   five codes of the book as the core set. A reference page: no steps; the state is derived from the params (class
   filter, core toggle, the preset's view and the selected card). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The five classes (RFC 9110 §15): the first digit. letter: the badge that carries the class besides colour;
      whose: whose problem it is (the strings.js key suffix). */
  var CLASSES = [
    { cls: 1, id: '1xx', letter: 'I', whose: 'nobody-yet' },
    { cls: 2, id: '2xx', letter: 'S', whose: 'nobody' },
    { cls: 3, id: '3xx', letter: 'R', whose: 'client-acts' },
    { cls: 4, id: '4xx', letter: 'C', whose: 'client' },
    { cls: 5, id: '5xx', letter: 'E', whose: 'server' }
  ];
  var CLASS_IDS = ['all'].concat(CLASSES.map(function (c) { return c.id; }));

  /** A message: start (request line or status line, null for a request whose rest is only its body), headers,
      body (false: the message has no content), note (a strings.js key suffix for words about it, or null). */
  function msg(start, headers, body, note) { return { start: start, headers: headers || [], body: body !== false, note: note || null }; }

  /** The cards in poster order (class, then code). rfc: the section that defines the code. core: one of the five
      of URM ch14. ex: the example exchange; followUp.same: the follow-up is the rest of the same request (100),
      not a new one. after: a strings.js key suffix for what the client does after the last response, or null. */
  var CARDS = [
    { code: 100, phrase: 'Continue', rfc: 'RFC 9110 §15.2.1', ex: {
      request: msg('POST /narudzbe', ['Expect: 100-continue']),
      response: msg('100 Continue', [], false),
      followUp: { same: true, request: msg(null, [], true, 'formSent'), response: msg('201 Created', ['Location: /narudzbe/42']) } } },
    { code: 101, phrase: 'Switching Protocols', rfc: 'RFC 9110 §15.2.2', after: 'switched', ex: {
      request: msg('GET /chat', ['Connection: Upgrade', 'Upgrade: websocket']),
      response: msg('101 Switching Protocols', ['Connection: Upgrade', 'Upgrade: websocket'], false), followUp: null } },
    { code: 200, phrase: 'OK', rfc: 'RFC 9110 §15.3.1', core: true, ex: {
      request: msg('GET /katalog'), response: msg('200 OK'), followUp: null } },
    { code: 201, phrase: 'Created', rfc: 'RFC 9110 §15.3.2', ex: {
      request: msg('POST /narudzbe', [], true, 'formSent'), response: msg('201 Created', ['Location: /narudzbe/42']), followUp: null } },
    { code: 204, phrase: 'No Content', rfc: 'RFC 9110 §15.3.5', ex: {
      request: msg('DELETE /kosarica/7'), response: msg('204 No Content', [], false), followUp: null } },
    { code: 206, phrase: 'Partial Content', rfc: 'RFC 9110 §15.3.7', ex: {
      request: msg('GET /katalog.pdf', ['Range: bytes=0-999']),
      response: msg('206 Partial Content', ['Content-Range: bytes 0-999/48000']), followUp: null } },
    { code: 301, phrase: 'Moved Permanently', rfc: 'RFC 9110 §15.4.2', core: true, ex: {
      request: msg('GET /proizvodi'), response: msg('301 Moved Permanently', ['Location: /katalog']),
      followUp: { same: false, request: msg('GET /katalog'), response: msg('200 OK') } } },
    { code: 302, phrase: 'Found', rfc: 'RFC 9110 §15.4.3', core: true, ex: {
      request: msg('GET /akcija'), response: msg('302 Found', ['Location: /akcija-studeni']),
      followUp: { same: false, request: msg('GET /akcija-studeni'), response: msg('200 OK') } } },
    { code: 304, phrase: 'Not Modified', rfc: 'RFC 9110 §15.4.5', after: 'useStored', ex: {
      request: msg('GET /katalog', ['If-None-Match: "v7"']), response: msg('304 Not Modified', ['ETag: "v7"'], false), followUp: null } },
    { code: 307, phrase: 'Temporary Redirect', rfc: 'RFC 9110 §15.4.8', ex: {
      request: msg('POST /narudzbe', [], true, 'formSent'), response: msg('307 Temporary Redirect', ['Location: /pricuva/narudzbe']),
      followUp: { same: false, request: msg('POST /pricuva/narudzbe', [], true, 'formSent'), response: msg('201 Created', ['Location: /pricuva/narudzbe/42']) } } },
    { code: 308, phrase: 'Permanent Redirect', rfc: 'RFC 9110 §15.4.9', ex: {
      request: msg('PUT /cjenik', [], true, 'priceList'), response: msg('308 Permanent Redirect', ['Location: /v2/cjenik']),
      followUp: { same: false, request: msg('PUT /v2/cjenik', [], true, 'priceList'), response: msg('200 OK') } } },
    { code: 400, phrase: 'Bad Request', rfc: 'RFC 9110 §15.5.1', ex: {
      request: msg('GET /trazi?q=%zz'), response: msg('400 Bad Request'), followUp: null } },
    { code: 401, phrase: 'Unauthorized', rfc: 'RFC 9110 §15.5.2', ex: {
      request: msg('GET /admin'), response: msg('401 Unauthorized', ['WWW-Authenticate: Basic realm="admin"']),
      followUp: { same: false, request: msg('GET /admin', ['Authorization: Basic …']), response: msg('200 OK') } } },
    { code: 403, phrase: 'Forbidden', rfc: 'RFC 9110 §15.5.4', after: 'noRetry', ex: {
      request: msg('GET /admin', ['Authorization: Basic …']), response: msg('403 Forbidden'), followUp: null } },
    { code: 404, phrase: 'Not Found', rfc: 'RFC 9110 §15.5.5', core: true, ex: {
      request: msg('GET /katalog/stari'), response: msg('404 Not Found'), followUp: null } },
    { code: 405, phrase: 'Method Not Allowed', rfc: 'RFC 9110 §15.5.6', ex: {
      request: msg('DELETE /katalog'), response: msg('405 Method Not Allowed', ['Allow: GET, HEAD']), followUp: null } },
    { code: 409, phrase: 'Conflict', rfc: 'RFC 9110 §15.5.10', ex: {
      request: msg('PUT /cjenik', [], true, 'oldVersion'), response: msg('409 Conflict'), followUp: null } },
    { code: 429, phrase: 'Too Many Requests', rfc: 'RFC 6585 §4', check: true, ex: {
      request: msg('GET /trazi?q=papir'), response: msg('429 Too Many Requests', ['Retry-After: 60']), followUp: null } },
    { code: 500, phrase: 'Internal Server Error', rfc: 'RFC 9110 §15.6.1', core: true, ex: {
      request: msg('GET /katalog'), response: msg('500 Internal Server Error'), followUp: null } },
    { code: 502, phrase: 'Bad Gateway', rfc: 'RFC 9110 §15.6.3', ex: {
      request: msg('GET /katalog'), response: msg('502 Bad Gateway', [], true, 'fromGateway'), followUp: null } },
    { code: 503, phrase: 'Service Unavailable', rfc: 'RFC 9110 §15.6.4', ex: {
      request: msg('GET /katalog'), response: msg('503 Service Unavailable', ['Retry-After: 120']), followUp: null } },
    { code: 504, phrase: 'Gateway Timeout', rfc: 'RFC 9110 §15.6.5', ex: {
      request: msg('GET /katalog'), response: msg('504 Gateway Timeout', [], true, 'fromGateway'), followUp: null } }
  ];

  var BY_CODE = Object.create(null);
  CARDS.forEach(function (c) { BY_CODE[c.code] = c; });
  var CORE = CARDS.filter(function (c) { return c.core; }).map(function (c) { return c.code; });

  /** An own key of a table, so 'constructor' or '__proto__' in a URL is no key. */
  function own(table, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key); }

  // ── rules 1 and 2: the class, and how an unknown code is read ──

  function valid(code) { return typeof code === 'number' && Math.floor(code) === code && code >= 100 && code <= 599; }

  /** The class of a valid code (its first digit), else null. */
  function classOf(code) { return valid(code) ? Math.floor(code / 100) : null; }

  /** What a client that knows the poster's codes reads a code as: the code itself if it knows it, else the x00 of its
      class (RFC 9110 §15); an invalid code is read as a server error, 500. */
  function readAs(code) {
    if (!valid(code)) return 500;
    return BY_CODE[code] ? code : classOf(code) * 100;
  }

  // ── rule 3: redirects ──

  var REDIRECTS = { 301: { permanent: true, keepsMethod: false }, 302: { permanent: false, keepsMethod: false },
    307: { permanent: false, keepsMethod: true }, 308: { permanent: true, keepsMethod: true } };

  /** For 301, 302, 307 and 308: permanent or temporary, and whether the method must stay; else null. */
  function redirect(code) {
    return Object.prototype.hasOwnProperty.call(REDIRECTS, code) ? { permanent: REDIRECTS[code].permanent, keepsMethod: REDIRECTS[code].keepsMethod } : null;
  }

  /** The value of a header in a message, or null. */
  function header(m, name) {
    var pre = name.toLowerCase() + ':';
    for (var i = 0; i < m.headers.length; i++) {
      if (m.headers[i].toLowerCase().indexOf(pre) === 0) return m.headers[i].slice(pre.length).trim();
    }
    return null;
  }

  /** Method and target of a request line ('GET /katalog' → { method, target }), or null. */
  function requestLine(m) {
    if (!m.start) return null;
    var parts = m.start.split(' ');
    return { method: parts[0], target: parts[1] };
  }

  /** How many requests and responses one click costs: a new follow-up request adds one of each; a follow-up that
      is the rest of the same request (100 Continue) adds only the final response. */
  function messages(code) {
    var c = BY_CODE[code];
    if (!c) return null;
    var f = c.ex.followUp;
    return { requests: 1 + (f && !f.same ? 1 : 0), responses: 1 + (f ? 1 : 0) };
  }

  // ── params, filter and views ──

  /** Views, set by the presets. cls/core: the filter the preset sets (the view is on while the filter is that);
      focus: the codes it keeps active, or null; compare: the codes the detail strip shows (side by side when more
      than one) while nothing is selected. */
  var VIEWS = {
    'none': { cls: 'all', core: false, focus: null, compare: [] },
    'book-five': { cls: 'all', core: true, focus: null, compare: [] },
    'redirect': { cls: 'all', core: false, focus: [200, 301], compare: [301] },
    'whose-fault': { cls: 'all', core: false, focus: [404, 500, 503], compare: [404, 500, 503] },
    'cache': { cls: 'all', core: false, focus: [304], compare: [304] },
    'auth': { cls: 'all', core: false, focus: [401, 403], compare: [401, 403] }
  };
  var VIEW_IDS = Object.keys(VIEWS);

  function classParam(p) { return CLASS_IDS.indexOf(p.class) >= 0 ? p.class : 'all'; }
  function coreParam(p) { return p.core === true; }

  /** The view that is on: the preset's view while the filter is the one it set, else null (a filter ends a view). */
  function viewOf(p) {
    if (!own(VIEWS, p.view) || p.view === 'none') return null;
    var v = VIEWS[p.view];
    return classParam(p) === v.cls && coreParam(p) === v.core ? p.view : null;
  }

  /** The active codes, in poster order. */
  function activeOf(p) {
    var cls = classParam(p), core = coreParam(p);
    var view = viewOf(p);
    var focus = view ? VIEWS[view].focus : null;
    return CARDS.filter(function (c) {
      return (cls === 'all' || CLASSES[classOf(c.code) - 1].id === cls) && (!core || c.core) &&
        (!focus || focus.indexOf(c.code) >= 0);
    }).map(function (c) { return c.code; });
  }

  /** The selected code (a card on the poster, dimmed or not), else null. */
  function selectedOf(p) {
    if (typeof p.sel !== 'string' || !/^[1-5][0-9][0-9]$/.test(p.sel)) return null;
    return BY_CODE[Number(p.sel)] ? Number(p.sel) : null;
  }

  /** The cards that became active from one state to the next ("changed"), in poster order. */
  function appeared(before, after) {
    if (!before) return [];
    return after.active.filter(function (code) { return before.active.indexOf(code) < 0; });
  }

  function copyMsg(m) { return { start: m.start, headers: m.headers.slice(), body: m.body, note: m.note }; }

  var logic = {
    CLASSES: CLASSES, CLASS_IDS: CLASS_IDS, CARDS: CARDS, BY_CODE: BY_CODE, CORE: CORE, VIEWS: VIEWS, VIEW_IDS: VIEW_IDS,

    defaults: { class: 'all', core: false, view: 'none', sel: '' },

    /** A reference page: no steps. */
    steps: 0,

    /** The whole poster as plain data, derived from the params. */
    initial: function (p) {
      var active = activeOf(p);
      var selected = selectedOf(p);
      var view = viewOf(p);
      var detail = selected !== null ? [selected] : view ? VIEWS[view].compare.slice() : [];
      return {
        filter: { class: classParam(p), core: coreParam(p) },
        view: view,
        selected: selected,
        detail: detail,
        active: active,
        cards: CARDS.map(function (c) {
          var f = c.ex.followUp;
          return {
            code: c.code, phrase: c.phrase, cls: classOf(c.code), rfc: c.rfc, core: !!c.core, check: !!c.check,
            after: c.after || null,
            example: {
              request: copyMsg(c.ex.request), response: copyMsg(c.ex.response),
              followUp: f ? { same: f.same, request: copyMsg(f.request), response: copyMsg(f.response) } : null
            },
            messages: messages(c.code),
            active: active.indexOf(c.code) >= 0,
            selected: c.code === selected
          };
        })
      };
    },

    step: function (s) { return s; },

    classOf: classOf, readAs: readAs, redirect: redirect, header: header, requestLine: requestLine, messages: messages,
    viewOf: viewOf, activeOf: activeOf, selectedOf: selectedOf, appeared: appeared
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
