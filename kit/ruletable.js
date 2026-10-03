/* SPDX-License-Identifier: AGPL-3.0-or-later
   simdeck kit view K4: rule table with the matching row (docs/sim-ui.md §12).
   An ordered rule list as an HTML table: a pointer column with the chip of the request being evaluated, the row
   number, the match columns, the action, and a mark column that says what each row did for this request (no match,
   match, beaten, not read). The row compared in this step is highlighted, the deciding row outlined, rows that are
   never read hatched, and an implicit default row closes the list. Three evaluation modes (first match, most
   specific, deny wins) decide which rows are read and which row wins, so a page can show the contrast of
   catalogue §5.1 on the same rows. All HTML, 1:1 at any screen size; the view holds no words: every text comes from
   the page's strings.
   A classic script: the page links ../../kit/ruletable.js after kit.js. The pure part (evaluate, checkSpec) touches no
   DOM, so node tests can require() this file. */
(function (root) {
  'use strict';

  var hasDom = typeof document !== 'undefined';
  var MODES = ['first', 'specific', 'deny'];
  var MARKS = ['pending', 'no', 'hit', 'win', 'beaten', 'skip'];
  var EFFECTS = ['allow', 'deny'];

  // ── pure core ──

  /**
   * What each row did for one request, from the rows' match results. rows: [{ hit, effect, rank, mark }]; hit is true
   * (matches), false (does not) or null (not compared yet). at: the row compared in this step (rows.length is the
   * implicit row; -1 none); rows after it are not read yet; 'all': every row is read (an explorer, no pointer).
   * done: the decision is made.
   *   first:    read top down; the first row that matches wins at once and the rows below it are never read (skip).
   *   specific: every row is read; when done, the matching row with the highest rank wins, the other matches are
   *             beaten. Tie-break: equal ranks, the earlier row wins.
   *   deny:     every row is read; when done, every matching deny row wins and the matching allow rows are beaten;
   *             with no matching deny, every matching allow row wins (allows add up). A row without an effect is an allow.
   * With no winner, the implicit row wins once every row is read (first: at reaches it; the others: done), and is
   * skipped when a row won. A row's own `mark` (one of MARKS) overrides the result for that row (a page with its own
   * rule, e.g. control flags); `win` lists only computed winners and rows marked 'win'.
   * Returns { marks: [...], implicit: mark, win: [indices], decided: done } (the outcome is shown only when decided).
   */
  function evaluate(mode, rows, at, done) {
    mode = mode || 'first';
    var n = rows.length;
    var readTo = at === 'all' ? n : at == null || at < 0 ? -1 : Math.min(at, n);
    var marks = rows.map(function (r, i) {
      if (i > readTo || r.hit == null) return 'pending';
      return r.hit ? 'hit' : 'no';
    });
    var hits = [];
    marks.forEach(function (m, i) { if (m === 'hit') hits.push(i); });
    var win = [];
    if (mode === 'first') {
      if (hits.length) {
        win = [hits[0]];
        for (var i = hits[0] + 1; i < n; i++) marks[i] = 'skip';
      }
    } else if (done) {
      if (mode === 'specific') {
        hits.forEach(function (i) { if (!win.length || rank(rows[i]) > rank(rows[win[0]])) win = [i]; });
      } else {
        var denies = hits.filter(function (i) { return rows[i].effect === 'deny'; });
        win = denies.length ? denies : hits.slice();
      }
      hits.forEach(function (i) { marks[i] = 'beaten'; });
    }
    win.forEach(function (i) { marks[i] = 'win'; });
    var implicit = win.length ? 'skip' : (mode === 'first' ? readTo >= n : done) ? 'win' : 'pending';
    rows.forEach(function (r, i) { if (r.mark) marks[i] = r.mark; });
    win = [];
    marks.forEach(function (m, i) { if (m === 'win') win.push(i); });
    return { marks: marks, implicit: implicit, win: win, decided: !!done };
  }
  function rank(r) { return typeof r.rank === 'number' ? r.rank : 0; }

  /** Problems in a table spec, as strings (empty when it is fine). The view logs them on the console. */
  function checkSpec(spec) {
    var out = [], keys = {};
    var mode = spec.mode || 'first';
    if (MODES.indexOf(mode) < 0) out.push('unknown mode "' + mode + '"');
    var cols = (spec.columns || []).concat(spec.extra || []);
    if (!(spec.columns || []).length) out.push('no columns');
    cols.forEach(function (c) {
      if (!c.key) { out.push('a column has no key'); return; }
      if (keys[c.key]) out.push('column "' + c.key + '" twice');
      keys[c.key] = true;
    });
    var rows = spec.rows || [];
    rows.forEach(function (r, i) {
      var name = 'row ' + i;
      if (r.hit !== true && r.hit !== false && r.hit != null) out.push(name + ': hit is true, false or null');
      if (r.effect != null && EFFECTS.indexOf(r.effect) < 0) out.push(name + ': unknown effect "' + r.effect + '"');
      if (r.mark != null && MARKS.indexOf(r.mark) < 0) out.push(name + ': unknown mark "' + r.mark + '"');
      if (mode === 'specific' && r.hit && typeof r.rank !== 'number') out.push(name + ': a matching row needs a rank in mode "specific"');
      Object.keys(r.cells || {}).forEach(function (k) { if (!keys[k]) out.push(name + ': unknown column "' + k + '"'); });
      (r.miss || []).forEach(function (k) { if (!keys[k]) out.push(name + ': miss names unknown column "' + k + '"'); });
      if ((r.miss || []).length && r.hit !== false) out.push(name + ': miss on a row that is not a "no" (hit: false)');
    });
    if (spec.at != null && spec.at !== 'all' && typeof spec.at !== 'number') out.push('at: a row index or "all"');
    else if (typeof spec.at === 'number' && spec.at >= 0) {
      if (spec.at > rows.length || (spec.at === rows.length && !spec.implicit)) out.push('at: ' + spec.at + ' is past the last row');
    }
    if (spec.implicit && spec.implicit.effect != null && EFFECTS.indexOf(spec.implicit.effect) < 0) out.push('implicit: unknown effect "' + spec.implicit.effect + '"');
    return out;
  }

  var core = { MODES: MODES, MARKS: MARKS, EFFECTS: EFFECTS, evaluate: evaluate, checkSpec: checkSpec };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    return;
  }

  // ── view ──

  var S = root.Simdeck;
  if (!S) { console.error('[simdeck] kit/ruletable.js needs kit/kit.js loaded first'); return; }
  var h = S.h;
  /** data-* values without the empty ones (Simdeck.h would write null as the text "null"). */
  function ds(o) {
    var out = {};
    Object.keys(o).forEach(function (k) { if (o[k] != null && o[k] !== false) out[k] = String(o[k]); });
    return out;
  }
  /** A bare string or number is data (rule text, an address, a number): the word check skips translate="no". */
  function dataEl(v, cls) {
    if (v == null || v === '') return null;
    if (typeof v === 'string' || typeof v === 'number') return h('span', { class: cls || null, translate: 'no' }, String(v));
    return cls ? h('span', { class: cls }, v) : v;
  }
  /** Tags: [{ k: 'hl' | 'dashed' | 'muted', text }] or nodes, each on its own line. */
  function tagsEl(tags) {
    return (tags || []).map(function (tg) {
      if (tg == null) return null;
      if (tg.nodeType) return tg;
      return h('span', { class: 'sd-rt-tag', dataset: ds({ k: tg.k }) }, tg.text);
    });
  }
  /** ✓ or ✕ and a word, in --ok or --danger: an outcome that reads in grayscale. */
  function verdict(ok, text) {
    return h('span', { class: 'sd-rt-verdict', dataset: { ok: String(!!ok) } }, (ok ? '✓ ' : '✕ ') + text);
  }

  var SYMBOL = { no: '–', hit: '▷', win: '▶', beaten: '▽' };

  /**
   * Simdeck.ruleTable(spec) → element. spec:
   *   mode: 'first' | 'specific' | 'deny', title, columns: [{ key, label, wrap }], extra: [{ key, label, wrap }],
   *   noLabel, actionLabel, markLabel, rows: [{ no, cells, action, effect, rank, hit, miss, tags, note, why, mark }],
   *   implicit: { text, action, effect }, at, subject: { mark, c }, done, outcome(i) → node, words: { hit, win, beaten,
   *   skip }, dir (ctx.dir), changed, bare, stickyMark, className.
   * docs/sim-ui.md §12 has the meaning of every field.
   */
  function ruleTable(spec) {
    checkSpec(spec).forEach(function (p) { console.error('[simdeck] ruleTable: ' + p); });
    var anim = spec.dir === 'forward' && !S.reducedMotion();
    var rows = spec.rows || [], cols = spec.columns || [], extra = spec.extra || [];
    var words = spec.words || {};
    var ev = evaluate(spec.mode, rows, spec.at, spec.done);
    var at = typeof spec.at === 'number' ? spec.at : -1;   // the pointer row; 'all' has none
    var changedAt = spec.changed !== false && at >= 0;
    var outcome = function (i) {
      if (!ev.decided || !spec.outcome) return null;
      return typeof spec.outcome === 'function' ? spec.outcome(i) : spec.outcome.cloneNode(true);
    };
    var chip = function () {
      if (!spec.subject) return null;
      return h('span', { class: 'sd-rt-chip sd-fill' + (anim ? ' sd-anim-in' : ''), dataset: ds({ c: spec.subject.c }), translate: 'no' },
        (spec.subject.mark != null ? spec.subject.mark : '') + ' ▸');
    };
    var colHead = function (c) { return h('th', { dataset: ds({ col: c.key }) }, c.label); };

    function markCell(mark, i, now) {
      var body = [];
      if (mark === 'no') body.push(SYMBOL.no);
      else if (mark === 'skip') body.push(words.skip != null ? words.skip : '');
      else if (SYMBOL[mark]) {
        var w = words[mark];
        body.push(h('span', { class: 'sd-rt-markword' }, SYMBOL[mark] + (w != null ? ' ' : ''), w != null ? w : null));
      }
      if (mark === 'win') {
        var o = outcome(i);
        if (o) body.push(' ', o);
        if (ev.decided && rows[i] && rows[i].why != null) body.push(h('span', { class: 'sd-rt-why' }, rows[i].why));
      }
      return h('td', { class: 'sd-rt-mark' + (now ? ' sd-changed' + (anim ? ' sd-anim-in' : '') : '') }, body,
        rows[i] ? tagsEl(rows[i].note) : null);
    }

    var head = h('tr', null, h('th', { class: 'sd-rt-ptr' }), h('th', { class: 'sd-rt-no' }, spec.noLabel != null ? spec.noLabel : '#'),
      cols.map(colHead), h('th', { class: 'sd-rt-act' }, spec.actionLabel != null ? spec.actionLabel : ''), extra.map(colHead),
      h('th', { class: 'sd-rt-mark' }, spec.markLabel != null ? spec.markLabel : ''));

    var body = rows.map(function (r, i) {
      var mark = ev.marks[i], now = i === at;
      var miss = r.miss || [];
      var cell = function (c) {
        var v = (r.cells || {})[c.key];
        return h('td', { dataset: ds({ col: c.key, wrap: c.wrap ? 'true' : null }) },
          dataEl(v == null ? '' : v, miss.indexOf(c.key) >= 0 ? 'sd-rt-miss' : null));
      };
      return h('tr', { dataset: ds({ mark: mark, now: now ? 'true' : null, effect: r.effect }) },
        h('td', { class: 'sd-rt-ptr' }, now ? chip() : null),
        h('td', { class: 'sd-rt-no' }, dataEl(r.no), tagsEl(r.tags)),
        cols.map(cell),
        h('td', { class: 'sd-rt-act' }, dataEl(r.action)),
        extra.map(cell),
        markCell(mark, i, now && changedAt));
    });

    if (spec.implicit) {
      var imp = spec.implicit, impNow = at === rows.length;
      var impMark = ev.implicit;
      var impCell;
      if (impMark === 'win') impCell = h('td', { class: 'sd-rt-mark' + (impNow && changedAt ? ' sd-changed' + (anim ? ' sd-anim-in' : '') : '') }, outcome(rows.length));
      else impCell = h('td', { class: 'sd-rt-mark' + (impNow && changedAt ? ' sd-changed' : '') }, impMark === 'skip' && words.skip != null ? words.skip : '');
      body.push(h('tr', { class: 'sd-rt-implicit', dataset: ds({ mark: impMark, now: impNow ? 'true' : null, effect: imp.effect }) },
        h('td', { class: 'sd-rt-ptr' }, impNow ? chip() : null),
        h('td', { class: 'sd-rt-no' }),
        h('td', { colspan: String(Math.max(1, cols.length)) }, imp.text),
        h('td', { class: 'sd-rt-act' }, dataEl(imp.action)),
        extra.map(function () { return h('td'); }),
        impCell));
    }

    var table = h('div', { class: 'sd-rt-scroll' },
      h('table', { class: 'sd-rt-table', dataset: { mode: spec.mode || 'first' } }, h('thead', null, head), h('tbody', null, body)));
    return h('section', { class: 'sd-rt' + (spec.bare ? ' sd-rt--bare' : '') + (spec.stickyMark ? ' sd-rt--sticky' : '') + (spec.className ? ' ' + spec.className : ''), dataset: { mode: spec.mode || 'first' } },
      spec.title != null ? h('h2', { class: 'sd-rt-title' }, spec.title) : null, table);
  }

  Object.keys(core).forEach(function (key) { ruleTable[key] = core[key]; });
  ruleTable.verdict = verdict;
  S.ruleTable = ruleTable;
})(typeof globalThis !== 'undefined' ? globalThis : this);
