/* SPDX-License-Identifier: AGPL-3.0-or-later
   simdeck kit view K5: paper columns (docs/sim-ui.md §14).
   Arithmetic written the way it is on squared paper: one digit or sign per square, numbers aligned by place (ones
   under ones), a small carry or borrow row, a sign column, a rule over the result, the current column as a band
   (highlighter tint and an ink frame), digits crossed out (rewritten, or wrong) and a small tag in a cell's corner,
   rows shifted left by places (partial products) and squares right of the ones (the Croatian division line
   "846 : 3 = 282" with the working under the dividend), and a plain aside column right of the paper (a value in
   decimal). Every cell is HTML on a CSS grid sized from the container (cq units), so text is drawn at 1:1. The view
   holds no words: cell texts are data, place labels and the aside head are the page's strings.
   Also here: digits of any base 2–16 (0–9 then A–F) and the audience switch shared by the ari- pages (teacher by
   default, adult, child), remembered in localStorage under one key and in ?audience=.
   A classic script: the page links ../../kit/papercolumns.js after kit.js. The pure part (checkSpec, layout, digits,
   numeral, audienceOf) touches no DOM, so node tests can require() this file. */
(function (root) {
  'use strict';

  var hasDom = typeof document !== 'undefined';
  var DIGITS = '0123456789ABCDEF';
  var KINDS = ['carry', 'result'];
  var AUDIENCES = ['teacher', 'adult', 'child'];
  var AUDIENCE_KEY = 'simdeck.ari.audience';

  // ── pure core ──

  /** The digits of a non-negative integer v in base b, by place (index 0 = the ones). 0 is [0]. */
  function digits(v, b) {
    b = b || 10;
    var n = Math.floor(Math.abs(v)), out = [];
    do { out.push(n % b); n = Math.floor(n / b); } while (n > 0);
    return out;
  }
  /** v written in base b (2–16), most significant digit first: numeral(26, 16) → '1A'. */
  function numeral(v, b) {
    return digits(v, b).reverse().map(function (d) { return DIGITS[d]; }).join('');
  }

  function isCellObj(c) { return c != null && typeof c === 'object' && !(hasDom && c.nodeType); }
  function textOf(c) { return isCellObj(c) ? c.text : c; }

  /**
   * A row's cells by place: [{ k, cell }] for the cells that are not empty. `cells` is indexed by place from `at`
   * (cells[0] sits at place at); `text` is written left to right, one character per square, its last character at
   * place at, and a space leaves a square empty.
   */
  function rowCells(r) {
    var at = r.at || 0, out = [];
    if (typeof r.text === 'string') {
      var s = r.text;
      for (var i = 0; i < s.length; i++) if (s[i] !== ' ') out.push({ k: at + (s.length - 1 - i), cell: s[i] });
    } else {
      (r.cells || []).forEach(function (c, i) { if (c != null && textOf(c) != null && textOf(c) !== '') out.push({ k: at + i, cell: c }); });
    }
    return out;
  }

  function bandOf(b) { return typeof b === 'number' ? { k: b } : (b || {}); }

  /**
   * Where everything goes: { cols, right, sign (0 or 1 sign column), gc(k) → grid column of place k, first (the grid
   * row of rows[0]), rows: n, lastSquare (the grid column of the rightmost square), aside (its grid column or 0) }.
   */
  function layout(spec) {
    var rows = spec.rows || [];
    var hi = 0, lo = 0, signed = !!spec.signs;
    rows.forEach(function (r) {
      rowCells(r).forEach(function (x) { hi = Math.max(hi, x.k + 1); lo = Math.min(lo, x.k); });
      if (r.sign != null) signed = true;
    });
    (spec.band || []).forEach(function (b) { var k = bandOf(b).k; if (typeof k === 'number') { hi = Math.max(hi, k + 1); lo = Math.min(lo, k); } });
    var cols = spec.cols != null ? spec.cols : Math.max(1, hi);
    var right = spec.right != null ? spec.right : lo < 0 ? -lo : 0;
    var sign = signed ? 1 : 0;
    var hasAside = spec.asideHead != null || rows.some(function (r) { return r.aside != null; });
    return {
      cols: cols, right: right, sign: sign,
      gc: function (k) { return sign + cols - k; },
      first: spec.places ? 2 : 1,
      rows: rows.length,
      lastSquare: sign + cols + right,
      aside: hasAside ? sign + cols + right + 1 : 0
    };
  }

  /** Problems in a paper spec, as strings (empty when it is fine). The view logs them on the console. */
  function checkSpec(spec) {
    var out = [];
    var rows = spec.rows || [];
    if (!rows.length) out.push('no rows');
    var L = layout(spec);
    rows.forEach(function (r, i) {
      var name = 'row ' + i;
      if (r.kind != null && KINDS.indexOf(r.kind) < 0) out.push(name + ': unknown kind "' + r.kind + '"');
      if (r.text != null && r.cells != null) out.push(name + ': give text or cells, not both');
      if (r.text != null && typeof r.text !== 'string') out.push(name + ': text is a string');
      if (r.at != null && (typeof r.at !== 'number' || r.at !== Math.floor(r.at))) out.push(name + ': at is a whole number');
      rowCells(r).forEach(function (x) {
        if (x.k >= L.cols || x.k < -L.right) out.push(name + ': a cell at place ' + x.k + ' is off the paper (places ' + (-L.right) + '…' + (L.cols - 1) + ')');
        if (isCellObj(x.cell) && x.cell.x != null && x.cell.x !== true && x.cell.x !== false && x.cell.x !== 'wrong') out.push(name + ', place ' + x.k + ': x is true, false or "wrong"');
      });
      if (r.rule != null && r.rule !== true && r.rule !== false) {
        var f = r.rule.from, t = r.rule.to;
        if (typeof f !== 'number' || typeof t !== 'number' || f < t) out.push(name + ': rule needs from ≥ to (places, from is the left end)');
        else if (f >= L.cols || t < -L.right) out.push(name + ': rule ' + f + '…' + t + ' runs off the paper');
      }
    });
    (spec.band || []).forEach(function (b, i) {
      var o = bandOf(b);
      if (typeof o.k !== 'number') { out.push('band ' + i + ': no place k'); return; }
      if (o.k >= L.cols || o.k < -L.right) out.push('band ' + i + ': place ' + o.k + ' is off the paper');
      var from = o.from != null ? o.from : 0, to = o.to != null ? o.to : rows.length - 1;
      if (from < 0 || to >= rows.length || from > to) out.push('band ' + i + ': rows ' + from + '…' + to + ' are not rows of the paper');
    });
    if (spec.places && spec.places.length > L.cols) out.push('places has ' + spec.places.length + ' labels for ' + L.cols + ' columns');
    return out;
  }

  /**
   * The audience to show: ?audience= in the query string first, then the stored choice, then the first of values
   * (teacher). Unknown values are ignored.
   */
  function audienceOf(search, stored, values) {
    var vals = values || AUDIENCES;
    var q = null;
    try { q = new URLSearchParams(search || '').get('audience'); } catch (e) { q = null; }
    if (vals.indexOf(q) >= 0) return q;
    if (vals.indexOf(stored) >= 0) return stored;
    return vals[0];
  }

  var core = { DIGITS: DIGITS, KINDS: KINDS, AUDIENCES: AUDIENCES, AUDIENCE_KEY: AUDIENCE_KEY,
    digits: digits, numeral: numeral, rowCells: rowCells, layout: layout, checkSpec: checkSpec, audienceOf: audienceOf };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    return;
  }

  // ── view ──

  var S = root.Simdeck;
  if (!S) { console.error('[simdeck] kit/papercolumns.js needs kit/kit.js loaded first'); return; }
  var h = S.h;

  /**
   * Simdeck.paperColumns(spec) → element (the paper, a CSS grid). spec:
   *   rows: [{ kind: 'carry'|'result', cells: [cell by place] | text: 'left to right', at, sign, rule, aside }],
   *   cell: text | { text, x: true|'wrong', now, tag, label },
   *   cols, right, signs, places: [label by place], placeTitles, band: [k | { k, from, to }], asideHead, asideWidth,
   *   big, label, className.
   * Put it in an element with class sd-paper-box (or any size container): the squares are sized from its cq units.
   * docs/sim-ui.md §14 has the meaning of every field.
   */
  function paperColumns(spec) {
    checkSpec(spec).forEach(function (p) { console.error('[simdeck] paperColumns: ' + p); });
    var L = layout(spec);
    var rows = spec.rows || [];
    var first = L.first;
    var lastRow = first + rows.length - 1;
    var kids = [];
    var pos = function (row, col) { return { gridRow: String(row), gridColumn: String(col) }; };

    (spec.band || []).forEach(function (b) {
      var o = bandOf(b);
      var from = o.from != null ? o.from : 0, to = o.to != null ? o.to : rows.length - 1;
      kids.push(h('div', { class: 'sd-pc-band', 'aria-hidden': 'true', style: { gridRow: (first + from) + ' / ' + (first + to + 1), gridColumn: String(L.gc(o.k)) } }));
    });
    if (spec.places) {
      spec.places.forEach(function (label, k) {
        if (k < L.cols && label != null && label !== '') {
          kids.push(h('div', { class: 'sd-pc-c sd-pc-pl', title: spec.placeTitles ? spec.placeTitles[k] : null, style: pos(1, L.gc(k)) }, label));
        }
      });
      if (L.aside && spec.asideHead != null) kids.push(h('div', { class: 'sd-pc-aside sd-pc-pl', style: pos(1, L.aside) }, spec.asideHead));
    }
    if (L.aside) {
      // the aside column is not squared paper: a plain strip under its values
      kids.push(h('div', { class: 'sd-pc-asidebg', 'aria-hidden': 'true', style: { gridRow: '1 / ' + (lastRow + 1), gridColumn: String(L.aside) } }));
    }

    rows.forEach(function (r, i) {
      var line = first + i;
      var small = r.kind === 'carry';
      if (r.rule) {
        var span = r.rule === true ? '1 / ' + (L.lastSquare + 1) : L.gc(r.rule.from) + ' / ' + (L.gc(r.rule.to) + 1);
        kids.push(h('div', { class: 'sd-pc-rule', 'aria-hidden': 'true', style: { gridRow: String(line), gridColumn: span } }));
      }
      if (r.sign != null) kids.push(h('div', { class: 'sd-pc-c sd-pc-sign', style: pos(line, 1), translate: 'no' }, r.sign));
      rowCells(r).forEach(function (x) {
        var c = x.cell, o = isCellObj(c) ? c : { text: c };
        var text = String(o.text);
        var cls = 'sd-pc-c' + (small ? ' sd-pc-small' : '') + (r.kind === 'result' ? ' sd-pc-res' : '') +
          (!small && text.length > 1 ? ' sd-pc-wide' : '') + (o.now ? ' sd-changed' : '') +
          (o.x === 'wrong' ? ' sd-pc-x sd-pc-x--wrong' : o.x ? ' sd-pc-x' : '');
        kids.push(h('div', { class: cls, style: pos(line, L.gc(x.k)), translate: 'no', 'aria-label': o.label != null ? o.label : null },
          text, o.tag != null ? h('span', { class: 'sd-pc-tag' }, String(o.tag)) : null));
      });
      if (r.aside != null && L.aside) kids.push(h('div', { class: 'sd-pc-aside', style: pos(line, L.aside), translate: 'no' }, r.aside));
    });

    var asideW = 0;
    if (L.aside) {
      if (spec.asideWidth != null) asideW = spec.asideWidth;
      else {
        var longest = rows.map(function (r) { return r.aside; }).concat([spec.asideHead]).reduce(function (m, s) { return s == null ? m : Math.max(m, String(s).length); }, 0);
        asideW = 1 + longest * 0.4;
      }
    }
    return h('div', { class: 'sd-paper' + (spec.className ? ' ' + spec.className : ''), dataset: spec.big ? { big: '' } : {},
      role: 'img', 'aria-label': spec.label || null,
      style: { '--pc-w': String(L.lastSquare), '--pc-xw': String(asideW), '--pc-h': String(lastRow + 0.3),
        gridTemplateColumns: 'repeat(' + L.lastSquare + ', var(--pc-cell))' + (L.aside ? ' auto' : '') } }, kids);
  }

  /** A place label for a base other than 10: the base with the place as a superscript (2³, 16²), data. */
  paperColumns.power = function (b, k) {
    return h('span', { translate: 'no' }, String(b), h('sup', null, String(k)));
  };

  /**
   * The audience switch, shared by the ari- pages. o: { host, label, group, names: { teacher, adult, child },
   * hints: { … }, values (default teacher, adult, child), key (default 'simdeck.ari.audience'), onChange(a) }.
   * Builds the label and a segmented button group into host. Returns { value, set(a), sync() }: value is the current
   * audience (?audience=, else the stored choice, else the first value); set stores the choice (localStorage, in
   * try/catch: the page works without it), writes ?audience= (left out for the first value), syncs the buttons and
   * calls onChange. The words come from the page's strings.
   */
  paperColumns.audience = function (o) {
    var vals = o.values || AUDIENCES;
    var key = o.key || AUDIENCE_KEY;
    var stored = null;
    try { stored = root.localStorage.getItem(key); } catch (e) { /* storage off */ }
    var ctl = { value: audienceOf(root.location.search, stored, vals) };
    var btns = vals.map(function (a) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false', title: o.hints ? o.hints[a] : null, onclick: function () { ctl.set(a); } }, o.names ? o.names[a] : a);
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });   // a click keeps the clicker keys
      return b;
    });
    function writeUrl() {
      try {
        var u = new URLSearchParams(root.location.search);
        if (ctl.value === vals[0]) u.delete('audience'); else u.set('audience', ctl.value);
        var qs = u.toString();
        root.history.replaceState(null, '', root.location.pathname + (qs ? '?' + qs : '') + root.location.hash);
      } catch (e) { /* file:// in some browsers */ }
    }
    ctl.sync = function () { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(ctl.value === vals[i])); }); };
    ctl.set = function (a) {
      if (vals.indexOf(a) < 0) return;
      ctl.value = a;
      try { root.localStorage.setItem(key, a); } catch (e) { /* storage off */ }
      writeUrl();
      ctl.sync();
      if (o.onChange) o.onChange(a);
    };
    if (o.host) {
      o.host.classList.add('sd-pc-aud');
      o.host.replaceChildren(h('span', null, o.label != null ? o.label : ''), h('div', { class: 'sd-seg', role: 'group', 'aria-label': o.group || null }, btns));
    }
    ctl.buttons = btns;
    writeUrl();
    ctl.sync();
    return ctl;
  };

  Object.keys(core).forEach(function (key) { paperColumns[key] = core[key]; });
  S.paperColumns = paperColumns;
})(typeof globalThis !== 'undefined' ? globalThis : this);
