/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for xss: cross-site scripting on a blog with comments. An attacker's comment (stored) or a crafted link
   (reflected) carries markup; the server puts it into a page another visitor's browser parses. With no output
   encoding the markup becomes nodes in the page tree and its script "runs"; HTML encoding or setting textContent
   keeps it text. HttpOnly hides the session cookie from the script; a Content-Security-Policy refuses inline code.
   Nothing is ever evaluated: a small HTML tokenizer builds the tree, "runs" is a flag and a log line.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md.
   The request/response exchange (a request line, a status line, the body the browser parses) follows
   sims/http-exchange; no code is shared with it (models/ has no HTTP model yet). */
(function (root) {
  'use strict';

  /** Where things live. Names are data, not language. */
  var PAGE = '/blog/42';
  var SEARCH = '/blog?q=';
  var EVIL = 'evil.example';
  var SID = 'sid=7f3a9c21';
  var ATTACKER = 'mallory';
  /** The comments already on the page, in post order. */
  var SEED = [
    { id: 1, author: 'ana', body: '+1' },
    { id: 2, author: 'ivo', body: ':)' }
  ];
  /** What the payload param puts in the comment box. 'own' is the page's text field (param comment). */
  var PAYLOADS = {
    script: '<script>steal()</script>',
    img: '<img src=x onerror=steal()>',
    plain: '+1'
  };
  /** Elements that have no closing tag (HTML void elements; the subset a comment might hold). */
  var VOID = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'embed', 'col', 'base', 'track'];
  /** Events that fire without the victim doing anything: error on an element with a src (an injected src is taken
      not to load: src=x is not an image), load on an element that loads by itself (svg, body, iframe). Every other
      on* handler waits for the victim to click, hover or type (armed). */
  var SELF_LOAD = ['svg', 'body', 'iframe'];
  /** Elements whose content is not parsed as tags: raw text (script, style, xmp) and escapable raw text (textarea,
      title: character references are decoded, tags are not). The content runs up to the matching end tag. */
  var RAW = { script: 'raw', style: 'raw', xmp: 'raw', textarea: 'rc', title: 'rc' };

  // ── encoding (rule 3) ──

  /** HTML-encode for the HTML body context: the five characters OWASP lists. & first, so nothing is encoded twice. */
  function htmlEncode(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }

  var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  /** The browser's side: character references back to characters (named subset, decimal, hex). */
  function decode(s) {
    return String(s).replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, function (m, e) {
      if (e[0] === '#') {
        var code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, e) ? ENTITIES[e] : m;
    });
  }

  // ── parsing (rule 1) ──

  /** Parse an HTML fragment the way a browser decides code vs text: by its structure, at parse time.
      ranges: [[from, to), …] character ranges that came from the input; every node records whether it starts in
      one (input: true). Returns a list of nodes: { t: 'el', tag, attrs: [[name, value]], kids, input } or
      { t: 'text', text, input }. A small subset: start and end tags, quoted and bare attributes (a repeated
      attribute keeps the first), void elements, comments (dropped), raw text elements up to their end tag (an element
      still open at the end is marked unterminated: a script that never ends does not run), character references in
      text and attribute values. Not modelled: implied end tags (<li> inside an open li nests), foreign content. */
  function parse(html, ranges) {
    ranges = ranges || [];
    function fromInput(i) {
      for (var k = 0; k < ranges.length; k++) if (i >= ranges[k][0] && i < ranges[k][1]) return true;
      return false;
    }
    var root = { t: 'el', tag: '#root', attrs: [], kids: [] };
    var stack = [root];
    var i = 0, n = html.length;
    function top() { return stack[stack.length - 1]; }
    function addText(text, at) {
      if (!text) return;
      var kids = top().kids, last = kids[kids.length - 1];
      var inp = fromInput(at);
      if (last && last.t === 'text' && last.input === inp) last.text += text;
      else kids.push({ t: 'text', text: text, input: inp });
    }
    while (i < n) {
      var c = html[i];
      if (c === '<' && html.slice(i, i + 4) === '<!--') { // a comment: not a node the page shows
        var ce = html.indexOf('-->', i + 4);
        i = ce < 0 ? n : ce + 3;
        continue;
      }
      if (c === '<' && (html[i + 1] === '!' || html[i + 1] === '?')) { // a bogus comment, up to the next >
        var be = html.indexOf('>', i);
        i = be < 0 ? n : be + 1;
        continue;
      }
      if (c === '<' && html[i + 1] === '/' && /[a-zA-Z]/.test(html[i + 2] || '')) {
        var end = html.indexOf('>', i);
        if (end < 0) { addText(html.slice(i), i); break; }
        var name = html.slice(i + 2, end).trim().split(/[\s/]/)[0].toLowerCase();
        for (var d = stack.length - 1; d > 0; d--) {
          if (stack[d].tag === name) { stack.length = d; break; }
        }
        i = end + 1;
        continue;
      }
      if (c === '<' && /[a-zA-Z]/.test(html[i + 1] || '')) {
        var start = i;
        var j = i + 1;
        while (j < n && /[^\s/>]/.test(html[j])) j++;
        var tag = html.slice(i + 1, j).toLowerCase();
        var attrs = [];
        while (j < n && html[j] !== '>') {
          if (/[\s/]/.test(html[j])) { j++; continue; }
          var a = j;
          while (j < n && /[^\s/>=]/.test(html[j])) j++;
          var an = html.slice(a, j).toLowerCase(), av = '';
          while (j < n && /\s/.test(html[j])) j++;
          if (html[j] === '=') {
            j++;
            while (j < n && /\s/.test(html[j])) j++;
            if (html[j] === '"' || html[j] === "'") {
              var q = html[j], close = html.indexOf(q, j + 1);
              if (close < 0) close = n;
              av = html.slice(j + 1, close);
              j = close + 1;
            } else {
              var b = j;
              while (j < n && /[^\s>]/.test(html[j])) j++;
              av = html.slice(b, j);
            }
          }
          if (an && !attrs.some(function (x) { return x[0] === an; })) attrs.push([an, decode(av)]);
        }
        if (j >= n) { addText(html.slice(start), start); break; } // an unclosed tag is not a tag
        i = j + 1;
        var el = { t: 'el', tag: tag, attrs: attrs, kids: [], input: fromInput(start) };
        top().kids.push(el);
        if (RAW[tag]) {
          var stop = html.toLowerCase().indexOf('</' + tag, i);
          if (stop < 0) { stop = n; el.unterminated = true; }
          var body = html.slice(i, stop);
          if (body) el.kids.push({ t: 'text', text: RAW[tag] === 'rc' ? decode(body) : body, input: fromInput(i) });
          var gt = html.indexOf('>', stop);
          i = gt < 0 ? n : gt + 1;
        } else if (VOID.indexOf(tag) < 0) {
          stack.push(el);
        }
        continue;
      }
      var next = html.indexOf('<', i + 1);
      if (next < 0) next = n;
      // text runs up to the next '<'; a run that crosses into or out of the input is split there
      var cut = next;
      for (var k2 = 0; k2 < ranges.length; k2++) {
        if (ranges[k2][0] > i && ranges[k2][0] < cut) cut = ranges[k2][0];
        if (ranges[k2][1] > i && ranges[k2][1] < cut) cut = ranges[k2][1];
      }
      addText(decode(html.slice(i, cut)), i);
      i = cut;
    }
    return root.kids;
  }

  /** Every element node in a tree, depth first. */
  function elements(nodes, out) {
    out = out || [];
    nodes.forEach(function (x) {
      if (x.t === 'el') { out.push(x); elements(x.kids, out); }
    });
    return out;
  }
  function attr(el, name) {
    for (var i = 0; i < el.attrs.length; i++) if (el.attrs[i][0] === name) return el.attrs[i][1];
    return null;
  }

  /** Code the tree would run, in document order (rules 1, 6). A parser-inserted script runs; an image whose src
      fails fires error (src=x is not an image); other on* handlers and javascript: URLs are armed: they run when
      the victim clicks or hovers. With a CSP that refuses inline code every one is blocked. */
  function runsOf(nodes, csp) {
    var out = [];
    elements(nodes).forEach(function (el, idx) {
      if (el.tag === 'script' && !el.unterminated) {
        var code = el.kids.length ? el.kids[0].text : '';
        var src = attr(el, 'src');
        // a script from the page's own origin is allowed by script-src 'self'; inline code and other origins are not
        var self = src !== null && !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/i.test(src);
        out.push({ how: 'script', tag: 'script', idx: idx, event: null, code: src !== null ? 'src=' + src : code, auto: true, input: !!el.input, self: self });
      }
      el.attrs.forEach(function (a) {
        if (a[0].slice(0, 2) === 'on') {
          var auto = (a[0] === 'onerror' && attr(el, 'src') !== null) || (a[0] === 'onload' && SELF_LOAD.indexOf(el.tag) >= 0);
          out.push({ how: 'handler', tag: el.tag, idx: idx, event: a[0], code: a[1], auto: auto, input: !!el.input });
        }
        var url = a[1].replace(/[\t\n\r]/g, ''); // browsers drop tabs and newlines from URLs
        if ((a[0] === 'href' || a[0] === 'src' || a[0] === 'action' || a[0] === 'formaction') && /^[\s\x00-\x1f]*javascript:/i.test(url)) {
          out.push({ how: 'url', tag: el.tag, idx: idx, event: a[0], code: url.replace(/^[\s\x00-\x1f]*javascript:/i, ''), auto: false, input: !!el.input });
        }
      });
    });
    out.forEach(function (r) { r.blocked = !!csp && !r.self; delete r.self; });
    return out;
  }

  /** Does this code read the session cookie, and does it send it away? steal() is the attacker's function: it reads
      document.cookie and sends it to evil.example; code that only mentions document.cookie reads it and keeps it.
      The model never evaluates code; it only looks for these names. */
  function readsCookie(code) { return /steal\s*\(|document\.cookie/.test(code); }
  function sendsCookie(code) { return /steal\s*\(/.test(code); }

  /** The input, from the params: a chosen payload or the page's text field. */
  function inputOf(p) {
    return p.payload === 'own' ? String(p.comment == null ? '' : p.comment) : PAYLOADS[p.payload];
  }

  /** Would a raw insert make an element from this comment, in its place in the page (inside its li)? The store's
      mark, judged where the comment goes, as the step count is. */
  function hasMarkup(text) {
    text = String(text);
    var html = '<li>' + text + '</li>\n</ul>';
    return elements(parse(html, [[4, 4 + text.length]])).some(function (e) { return e.input; });
  }

  /** Post a comment: the next id, appended, so identical comments keep post order (the tie-break). */
  function addComment(store, author, body) {
    var id = store.reduce(function (m, c) { return Math.max(m, c.id); }, 0) + 1;
    return store.concat([{ id: id, author: author, body: body, bad: hasMarkup(body) }]);
  }
  function seedStore() { return SEED.map(function (c) { return { id: c.id, author: c.author, body: c.body, bad: false }; }); }

  /** The response the server sends for a request, as text with the input's characters marked, and the tree the
      browser builds from it (rules 1–4). req: { path: PAGE } (the blog post, with the store's comments) or
      { q: '…' } (a search: the term is copied into the results page, nothing is saved).
      encoding 'none' pastes the text in; 'htmlEncode' pastes it HTML-encoded; 'textContent' sends an empty slot
      per item and the values as data, which the page's own script puts in with textContent. */
  function respond(req, store, encoding) {
    var items = req.q != null
      ? [{ slot: 'q', open: '<h2 id="q">', close: '</h2>', value: String(req.q), user: true }]
      : store.slice().sort(function (a, b) { return a.id - b.id; }).map(function (c) {
        return { slot: 'c' + c.id, open: '<li id="c' + c.id + '">', close: '</li>', value: c.body, user: c.author === ATTACKER, id: c.id };
      });
    var segs = [];
    function page(s) { segs.push({ s: s, input: false }); }
    var wrapOpen = req.q != null ? null : '<ul id="comments">', wrapClose = req.q != null ? '<ol id="results"></ol>' : '</ul>';
    if (wrapOpen) page(wrapOpen + '\n');
    items.forEach(function (it) {
      page(it.open);
      if (encoding === 'none') segs.push({ s: it.value, input: it.user });
      else if (encoding === 'htmlEncode') segs.push({ s: htmlEncode(it.value), input: it.user });
      page(it.close + '\n');
    });
    page(wrapClose);
    // the text and the input's ranges in it
    var html = '', ranges = [];
    segs.forEach(function (sg) {
      if (sg.input && sg.s.length) ranges.push([html.length, html.length + sg.s.length]);
      html += sg.s;
    });
    var nodes = parse(html, ranges);
    var data = [];
    if (encoding === 'textContent') {
      items.forEach(function (it) {
        data.push({ slot: it.slot, value: it.value, input: it.user });
        var el = elements(nodes).filter(function (e) { return attr(e, 'id') === it.slot; })[0];
        if (el && it.value !== '') el.kids = [{ t: 'text', text: it.value, input: it.user }]; // textContent: one text node
      });
    }
    // lines of segments, for the "as text" pane
    var lines = [[]];
    segs.forEach(function (sg) {
      var parts = sg.s.split('\n');
      parts.forEach(function (part, k) {
        if (k > 0) lines.push([]);
        if (part) lines[lines.length - 1].push({ s: part, input: sg.input });
      });
    });
    if (!lines[lines.length - 1].length) lines.pop();
    return { asText: { lines: lines, data: data }, nodes: nodes, html: html };
  }

  /** Who gets the input in their page (rule 2): the victim who opens the attacker's route in, and an ordinary
      visitor who just opens the blog post. */
  function reach(kind, store, input, encoding) {
    function has(r) { return r.asText.lines.some(function (l) { return l.some(function (s) { return s.input; }); }) || r.asText.data.some(function (d) { return d.input; }); }
    if (kind === 'stored') return { victim: has(respond({ path: PAGE }, store, encoding)), other: has(respond({ path: PAGE }, store, encoding)) };
    return { victim: has(respond({ q: input }, store, encoding)), other: has(respond({ path: PAGE }, store, encoding)) };
  }

  /** Steps: post or link, store or follow, open or reflect, response and parse, then the outcome. When the input
      becomes markup (no encoding and an element from the input) two more: the cookie, then the fix. */
  function willBeMarkup(p) {
    if (p.encoding !== 'none') return false;
    var input = inputOf(p);
    var r = p.kind === 'stored' ? respond({ path: PAGE }, addComment(seedStore(), ATTACKER, input), 'none') : respond({ q: input }, [], 'none');
    return elements(r.nodes).some(function (e) { return e.input; });
  }
  function steps(p) { return willBeMarkup(p) ? 7 : 5; }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  var logic = {
    defaults: { kind: 'stored', encoding: 'none', payload: 'script', httpOnly: false, csp: false, comment: '' },

    steps: steps,

    initial: function (p) {
      return {
        phase: 'start', kind: p.kind, encoding: p.encoding, input: inputOf(p),
        stored: seedStore(), link: null, request: null, rendered: null, runs: [], live: [],
        scriptRuns: false, blockedBy: null, cookieRead: null, cookieStolen: false, attackerHas: null,
        reach: null, events: [], log: [], fix: null, note: 'start', changed: []
      };
    },

    step: function (s, n, p) {
      var x = clone(s);
      x.changed = [];
      var stored = p.kind === 'stored';
      var input = x.input;
      function ev(e) { e.n = n; x.events.push(e); }
      function log(code, extra) { var l = { n: n, code: code }; if (extra) Object.keys(extra).forEach(function (k) { l[k] = extra[k]; }); x.log.push(l); }

      if (n === 1) {
        if (stored) {
          x.phase = 'post';
          ev({ kind: 'msg', from: 'A', to: 'S', what: 'post', line: 'POST ' + PAGE, data: input });
          x.note = 'post';
        } else {
          x.phase = 'link';
          x.link = SEARCH + input;
          ev({ kind: 'msg', from: 'A', to: 'V', what: 'link', line: SEARCH, data: input });
          x.note = 'link';
        }
        x.changed.push('input');
        return x;
      }
      if (n === 2) {
        if (stored) {
          x.phase = 'store';
          x.stored = addComment(x.stored, ATTACKER, input);
          ev({ kind: 'note', lane: 'S', what: 'saved', id: x.stored[x.stored.length - 1].id });
          x.changed.push('store');
          x.reach = reach('stored', x.stored, input, p.encoding);
          x.note = 'store';
        } else {
          x.phase = 'click';
          x.request = 'GET ' + SEARCH;
          ev({ kind: 'msg', from: 'V', to: 'S', what: 'get-q', line: 'GET ' + SEARCH, data: input });
          x.note = 'click';
        }
        return x;
      }
      if (n === 3) {
        if (stored) {
          x.phase = 'open';
          x.request = 'GET ' + PAGE;
          ev({ kind: 'msg', from: 'V', to: 'S', what: 'get', line: 'GET ' + PAGE });
          x.note = 'open';
        } else {
          x.phase = 'reflect';
          ev({ kind: 'note', lane: 'S', what: 'reflect' });
          x.reach = reach('reflected', x.stored, input, p.encoding);
          x.changed.push('reach');
          x.note = 'reflect';
        }
        return x;
      }
      if (n === 4) {
        x.phase = 'response';
        x.rendered = respond(stored ? { path: PAGE } : { q: input }, x.stored, p.encoding);
        delete x.rendered.html;
        ev({ kind: 'msg', from: 'S', to: 'V', what: 'response', line: '200 OK', csp: !!p.csp });
        x.changed.push('text', 'tree');
        x.note = 'response';
        return x;
      }
      if (n === 5) {
        var nodes = x.rendered.nodes;
        x.live = elements(nodes).filter(function (e) { return e.input; }).map(function (e) { return e.tag; });
        x.runs = runsOf(nodes, p.csp).filter(function (r) { return r.input; });
        var ran = x.runs.filter(function (r) { return r.auto && !r.blocked; });
        var blocked = x.runs.filter(function (r) { return r.blocked; });
        x.scriptRuns = ran.length > 0;
        x.blockedBy = blocked.length ? 'csp' : null;
        if (!x.live.length) {
          x.phase = 'text';
          x.note = 'text';
          ev({ kind: 'note', lane: 'V', what: 'text' });
          log('text');
        } else {
          x.phase = 'run';
          x.runs.forEach(function (r) {
            if (r.auto && !r.blocked) log('ran', { how: r.how, tag: r.tag, event: r.event, src: r.code });
            else if (r.blocked) log('csp', { how: r.how, tag: r.tag, event: r.event, src: r.code });
            else log('armed', { how: r.how, tag: r.tag, event: r.event, src: r.code });
          });
          if (!x.runs.length) log('markup', { tags: x.live.slice() });
          x.note = x.scriptRuns ? 'ran' : x.blockedBy ? 'csp' : x.runs.length ? 'armed' : 'markup';
          ev({ kind: 'note', lane: 'V', what: x.note });
        }
        x.changed.push('tree', 'log');
        return x;
      }
      if (n === 6) {
        x.phase = 'exfil';
        var reader = x.runs.filter(function (r) { return r.auto && !r.blocked && readsCookie(r.code); })[0];
        if (!reader) {
          x.note = x.scriptRuns ? 'ran-no-cookie' : 'nothing-ran';
          log(x.note);
        } else if (p.httpOnly) {
          x.cookieRead = '';
          x.note = 'httponly';
          log('cookie-empty');
          ev({ kind: 'note', lane: 'V', what: 'cookie-empty' });
        } else if (!sendsCookie(reader.code)) {
          x.cookieRead = SID;
          x.note = 'read';
          log('read', { value: SID });
          ev({ kind: 'note', lane: 'V', what: 'read' });
        } else {
          x.cookieRead = SID;
          x.cookieStolen = true;
          x.attackerHas = SID;
          x.note = 'stolen';
          log('sent', { value: SID });
          ev({ kind: 'msg', from: 'V', to: 'A', what: 'exfil', line: 'GET /c?', data: SID });
          x.changed.push('attacker');
        }
        x.changed.push('log', 'cookie');
        return x;
      }
      // n === 7: the same input, HTML-encoded (what the fix changes)
      x.phase = 'fix';
      var fixed = respond(stored ? { path: PAGE } : { q: input }, x.stored, 'htmlEncode');
      delete fixed.html;
      x.fix = fixed;
      x.note = 'fix';
      log('fix');
      ev({ kind: 'note', lane: 'V', what: 'fix' });
      x.changed.push('text', 'tree', 'log');
      return x;
    },

    // helpers the page and the tests use
    PAGE: PAGE, SEARCH: SEARCH, EVIL: EVIL, SID: SID, ATTACKER: ATTACKER, PAYLOADS: PAYLOADS,
    htmlEncode: htmlEncode,
    decode: decode,
    parse: parse,
    elements: elements,
    runsOf: runsOf,
    readsCookie: readsCookie,
    sendsCookie: sendsCookie,
    inputOf: inputOf,
    hasMarkup: hasMarkup,
    addComment: addComment,
    seedStore: seedStore,
    respond: respond,
    reach: reach
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
