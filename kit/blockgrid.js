/* SPDX-License-Identifier: AGPL-3.0-or-later
   simdeck kit view K3: block grid (docs/sim-ui.md §13).
   Rows of equal cells for blocks, chunks, pages, extents or bands. A cell's state is shown by colour and pattern
   together (owned/new: solid series fill; shared/reused: a tint with hatching; invalid: crossed and grey; lost: ✕ in
   --danger; reserved: a dashed outline), with a reference count in its corner. Spans outline runs of cells (chunks,
   extents, stripes) with their number in a band under the row, brackets mark a range above it (a rolling window, a
   stripe being rebuilt), arrows join cells or rows (backing chains, pointers, a map), and a header carries the
   counter of space used. Cells, labels and spans are HTML on a CSS grid; the arrows are drawn over them after layout
   in CSS pixels (no viewBox), so every text is 1:1. The view holds no words: every text comes from the page's
   strings.
   A classic script: the page links ../../kit/blockgrid.js after kit.js. The pure part (checkSpec, space, split, route)
   touches no DOM, so node tests can require() this file. */
(function (root) {
  'use strict';

  var hasDom = typeof document !== 'undefined';
  var KINDS = ['free', 'fill', 'soft', 'dead', 'bad', 'ghost'];
  var MARKS = ['under', 'gap'];
  var STYLES = ['solid', 'dashed', 'dotted'];

  // ── pure core ──

  function rowKey(rows, ref) {
    if (typeof ref === 'number') return ref >= 0 && ref < rows.length ? ref : -1;
    for (var i = 0; i < rows.length; i++) if (rows[i].id != null && rows[i].id === ref) return i;
    return -1;
  }

  /** Problems in a grid spec, as strings (empty when it is fine). The view logs them on the console. */
  function checkSpec(spec) {
    var out = [], ids = {};
    var rows = spec.rows || [];
    if (!rows.length) out.push('no rows');
    rows.forEach(function (r, i) {
      var name = 'row ' + (r.id != null ? '"' + r.id + '"' : i);
      if (r.id != null) {
        if (ids[r.id]) out.push('row id "' + r.id + '" twice');
        ids[r.id] = true;
      }
      var n = (r.cells || []).length + (r.offset || 0);
      (r.cells || []).forEach(function (c, k) {
        if (!c) return;
        if (c.kind != null && KINDS.indexOf(c.kind) < 0) out.push(name + ', cell ' + k + ': unknown kind "' + c.kind + '"');
        if (c.mark != null && MARKS.indexOf(c.mark) < 0) out.push(name + ', cell ' + k + ': unknown mark "' + c.mark + '"');
        if (c.now != null && c.now !== true && c.now !== false && c.now !== 'gap') out.push(name + ', cell ' + k + ': now is true, false or "gap"');
      });
      var range = function (what, s) {
        if (typeof s.from !== 'number' || typeof s.len !== 'number' || s.len < 1 || s.from < 0) out.push(name + ': ' + what + ' needs from ≥ 0 and len ≥ 1');
        else if (s.from + s.len > n) out.push(name + ': ' + what + ' ' + s.from + '+' + s.len + ' runs past the row (' + n + ' cells)');
      };
      (r.spans || []).forEach(function (s) {
        range('span', s);
        if (s.style != null && STYLES.indexOf(s.style) < 0) out.push(name + ': unknown span style "' + s.style + '"');
      });
      (r.brackets || []).forEach(function (b) { range('bracket', b); });
    });
    var widest = rows.reduce(function (m, r) { return Math.max(m, (r.cells || []).length + (r.offset || 0)); }, 0);
    if (spec.cols != null && spec.cols < widest) out.push('cols ' + spec.cols + ' is less than the widest row (' + widest + ')');
    (spec.links || []).forEach(function (l, i) {
      [['from', l.from], ['to', l.to]].forEach(function (e) {
        if (!e[1]) { out.push('link ' + i + ': no ' + e[0]); return; }
        var r = rowKey(rows, e[1].row);
        if (r < 0) out.push('link ' + i + ': ' + e[0] + ' names unknown row "' + e[1].row + '"');
        else if (e[1].cell != null && !(e[1].cell >= 0 && e[1].cell < (rows[r].cells || []).length)) out.push('link ' + i + ': ' + e[0] + ' cell ' + e[1].cell + ' is not in row "' + e[1].row + '"');
        else if (e[1].cell != null && rows[r].cells[e[1].cell] == null) out.push('link ' + i + ': ' + e[0] + ' cell ' + e[1].cell + ' of row "' + e[1].row + '" is a hole');
      });
      if (l.from && l.to && rowKey(rows, l.from.row) === rowKey(rows, l.to.row) && l.from.cell === l.to.cell) out.push('link ' + i + ': from and to are the same');
      if (l.style != null && STYLES.indexOf(l.style) < 0) out.push('link ' + i + ': unknown style "' + l.style + '"');
    });
    return out;
  }

  /**
   * The counter of space used, over the cells of some rows: { total, free, used, shared, kinds: { kind: n },
   * colours: { c: n } }. A cell without a kind is free; a null cell is a hole (no block there) and is not counted. used = every cell that holds space: fill,
   * soft, dead (invalid pages still take room until they are erased) and bad; ghost (reserved, promised, not
   * allocated) and free do not. shared = cells with refs ≥ 2, or of kind soft when they give no refs.
   * colours counts the used cells per series colour (owners).
   */
  function space(rows) {
    var out = { total: 0, free: 0, used: 0, shared: 0, kinds: {}, colours: {} };
    KINDS.forEach(function (k) { out.kinds[k] = 0; });
    (rows || []).forEach(function (r) {
      (r.cells || []).forEach(function (c) {
        if (c == null) return;
        var kind = c.kind || 'free';
        out.total++;
        out.kinds[kind] = (out.kinds[kind] || 0) + 1;
        if (kind === 'free') out.free++;
        if (kind === 'free' || kind === 'ghost') return;
        out.used++;
        if (typeof c.refs === 'number' ? c.refs >= 2 : kind === 'soft') out.shared++;
        if (c.c != null) out.colours[c.c] = (out.colours[c.c] || 0) + 1;
      });
    });
    return out;
  }

  /**
   * One long row as rows of n cells (a pool of 100 blocks as ten rows of ten). Spans and brackets are cut at the
   * line ends: a piece that goes on to the next line has open: 'end', one that comes from the line before
   * open: 'start' (or 'both'); the label stays on the first piece. The new rows' ids are id + '/' + line.
   */
  function split(row, n) {
    var cells = row.cells || [];
    var lines = Math.max(1, Math.ceil(cells.length / n));
    var out = [];
    var cut = function (list, l) {
      var lo = l * n, hi = lo + n, res = [];
      (list || []).forEach(function (s) {
        var a = Math.max(s.from, lo), b = Math.min(s.from + s.len, hi);
        if (b <= a) return;
        var piece = {};
        Object.keys(s).forEach(function (k) { piece[k] = s[k]; });
        piece.from = a - lo;
        piece.len = b - a;
        var openStart = a > s.from, openEnd = b < s.from + s.len;
        if (openStart) delete piece.label;
        if (openStart || openEnd) piece.open = openStart && openEnd ? 'both' : openStart ? 'start' : 'end';
        res.push(piece);
      });
      return res;
    };
    for (var l = 0; l < lines; l++) {
      var r = {};
      Object.keys(row).forEach(function (k) { if (k !== 'cells' && k !== 'spans' && k !== 'brackets') r[k] = row[k]; });
      if (row.id != null) r.id = row.id + '/' + l;
      if (l > 0) { delete r.label; delete r.aside; }
      r.cells = cells.slice(l * n, l * n + n);
      if (row.spans) r.spans = cut(row.spans, l);
      if (row.brackets) r.brackets = cut(row.brackets, l);
      out.push(r);
    }
    return out;
  }

  /**
   * The path of an arrow from box a to box b ({ left, top, width, height } in CSS pixels; u = 1rem in pixels).
   * b below a: from a's bottom centre down to b's top centre, with the level run just above b (0.35 rem), so it
   * crosses the rows in between in the gap over b's row, not through their cells; halfway when the gap is smaller.
   * b above a: the same, upwards, the level run just under b. Side by side (the boxes overlap vertically; tie-break: the same row goes over the
   * top): up from a's top centre by `lift` (0.9 rem), across, and down into b's top centre.
   * Returns { points: [[x, y], …], tip: [x, y], dir: [dx, dy] (unit, the direction at the tip) }.
   */
  function route(a, b, u) {
    u = u || 16;
    var ax = a.left + a.width / 2, bx = b.left + b.width / 2;
    var aBot = a.top + a.height, bBot = b.top + b.height;
    var pts;
    if (b.top >= aBot) {
      var my = Math.max((aBot + b.top) / 2, b.top - 0.35 * u);
      pts = [[ax, aBot], [ax, my], [bx, my], [bx, b.top]];
    } else if (bBot <= a.top) {
      var my2 = Math.min((a.top + bBot) / 2, bBot + 0.35 * u);
      pts = [[ax, a.top], [ax, my2], [bx, my2], [bx, bBot]];
    } else {
      var top = Math.min(a.top, b.top) - 0.9 * u;
      pts = [[ax, a.top], [ax, top], [bx, top], [bx, b.top]];
    }
    // a straight drop has no level run: drop repeated points, then the middle of three in a line
    pts = pts.filter(function (p, i) { return i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]; });
    pts = pts.filter(function (p, i) {
      if (i === 0 || i === pts.length - 1) return true;
      var q = pts[i - 1], r = pts[i + 1];
      return (p[0] - q[0]) * (r[1] - q[1]) !== (p[1] - q[1]) * (r[0] - q[0]);
    });
    var p1 = pts[pts.length - 1], p0 = pts[pts.length - 2] || p1;
    var len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    return { points: pts, tip: p1, dir: [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len] };
  }

  var core = { KINDS: KINDS, MARKS: MARKS, STYLES: STYLES, checkSpec: checkSpec, space: space, split: split, route: route };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    return;
  }

  // ── view ──

  var S = root.Simdeck;
  if (!S) { console.error('[simdeck] kit/blockgrid.js needs kit/kit.js loaded first'); return; }
  var h = S.h;
  var svgNs = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var e = document.createElementNS(svgNs, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }
  function r1(n) { return Math.round(n * 10) / 10; }
  /** data-* values without the empty ones (Simdeck.h would write null as the text "null"). */
  function ds(o) {
    var out = {};
    Object.keys(o).forEach(function (k) { if (o[k] != null && o[k] !== false) out[k] = String(o[k]); });
    return out;
  }
  function isData(v) { return typeof v === 'string' || typeof v === 'number'; }
  /** In the grid a bare string or number is data (bytes, block ids, LBAs, file names): the word check skips it. */
  function dataEl(v, cls) {
    if (v == null || v === '') return null;
    if (isData(v)) return h('span', { class: cls || null, translate: 'no' }, String(v));
    return cls ? h('span', { class: cls }, v) : v;
  }
  var KIND_CLASS = { fill: ' sd-fill', soft: ' sd-soft sd-hatch', dead: ' sd-bg-dead', bad: ' sd-bg-bad', ghost: ' sd-bg-ghost' };

  /**
   * Simdeck.blockGrid(spec) → element. spec:
   *   title, meta: [text], count: text | { text, hl }, rows: [{ id, label, aside, offset, cells: [{ text, kind, c,
   *   refs, sub, dim, mark, now }], spans: [{ from, len, label, style, now, open }], brackets: [{ from, len, label,
   *   open }] }], cols, colLabels, links: [{ from: { row, cell }, to: { row, cell }, style, now, broken, c, head }],
   *   foot: [nodes], joined, cellWidth, cellWidthPhone, cellHeight, dir (ctx.dir), bare, className.
   * docs/sim-ui.md §13 has the meaning of every field.
   */
  function blockGrid(spec) {
    checkSpec(spec).forEach(function (p) { console.error('[simdeck] blockGrid: ' + p); });
    var anim = spec.dir === 'forward' && !S.reducedMotion();
    var rows = spec.rows || [];
    var n = spec.cols || rows.reduce(function (m, r) { return Math.max(m, (r.cells || []).length + (r.offset || 0)); }, 0);
    var hasLabel = rows.some(function (r) { return r.label != null; });
    var hasAside = rows.some(function (r) { return r.aside != null; });
    var c0 = hasLabel ? 2 : 1;                       // the grid column of cell 0
    var tracks = [];
    var line = 1;
    var kids = [];
    var cellEls = {}, rowEls = {};

    if (spec.colLabels) {
      tracks.push('auto');
      spec.colLabels.forEach(function (lab, k) {
        if (lab == null || lab === '') return;
        kids.push(h('div', { class: 'sd-bg-colhead', style: { gridColumn: String(c0 + k), gridRow: String(line) } }, dataEl(lab)));
      });
      line++;
    }

    rows.forEach(function (r, ri) {
      if (ri > 0) { tracks.push('var(--bg-row-gap)'); line++; }
      var bLine = line, cLine = line + 1, nLine = line + 2;
      tracks.push('auto', spec.cellHeight || '2.5rem', 'auto');
      line += 3;
      var off = r.offset || 0;
      var col = function (from, len) { return (c0 + off + from) + ' / span ' + len; };
      // band above: the bracket pad keeps the band's height when the row has a brackets list, even an empty one
      if (r.brackets) {
        kids.push(h('div', { class: 'sd-bg-bpad', style: { gridColumn: c0 + ' / span ' + n, gridRow: String(bLine) } }));
        r.brackets.forEach(function (b) {
          kids.push(h('div', { class: 'sd-bg-bracket' + (anim ? ' sd-anim-in' : ''), dataset: ds({ open: b.open }), style: { gridColumn: col(b.from, b.len), gridRow: String(bLine) } },
            b.label != null ? b.label : null));
        });
      }
      if (r.label != null) {
        var lab = h('div', { class: 'sd-bg-label', style: { gridColumn: '1', gridRow: String(cLine) } }, dataEl(r.label));
        rowEls[ri] = lab;
        kids.push(lab);
      }
      (r.cells || []).forEach(function (c, k) {
        if (c == null) return;                       // a hole: no block in this column
        var cls = 'sd-bg-cell' + (KIND_CLASS[c.kind] || '') + (c.dim ? ' sd-bg-dim' : '') +
          (c.mark === 'under' ? ' sd-bg-under' : c.mark === 'gap' ? ' sd-bg-gap' : '') +
          (c.now === true ? ' sd-changed' : c.now === 'gap' ? ' sd-bg-gap-now' : '');
        var plain = isData(c.text);
        var el = h('div', { class: cls, translate: plain ? 'no' : null,
          dataset: ds({ c: c.c, kind: c.kind, refs: typeof c.refs === 'number' ? c.refs : null }),
          style: { gridColumn: String(c0 + off + k), gridRow: String(cLine) } },
          c.text == null ? null : plain ? String(c.text) : c.text,
          c.sub != null ? dataEl(c.sub, 'sd-bg-sub') : null,
          typeof c.refs === 'number' && c.refs >= 2 ? h('span', { class: 'sd-bg-refs', translate: 'no' }, '×' + c.refs) : null);
        cellEls[ri + ':' + k] = el;
        if (!rowEls[ri]) rowEls[ri] = el;
        kids.push(el);
      });
      (r.spans || []).forEach(function (s) {
        var cs = col(s.from, s.len);
        kids.push(h('div', { class: 'sd-bg-span' + (s.now ? ' sd-changed' : ''), dataset: ds({ style: s.style && s.style !== 'solid' ? s.style : null, open: s.open, c: s.c }),
          style: { gridColumn: cs, gridRow: String(cLine) } }));
        if (s.label != null) {
          kids.push(h('div', { class: 'sd-bg-num' + (s.now ? ' sd-bg-num--now' + (anim ? ' sd-anim-in' : '') : ''), translate: isData(s.label) ? 'no' : null,
            style: { gridColumn: cs, gridRow: String(nLine) } }, isData(s.label) ? String(s.label) : s.label));
        }
      });
      if (r.aside != null) kids.push(h('div', { class: 'sd-bg-aside', style: { gridColumn: String(c0 + n), gridRow: String(cLine) } }, dataEl(r.aside)));
    });

    var grid = h('div', { class: 'sd-bg-grid', dataset: ds({ label: hasLabel ? 'true' : null, aside: hasAside ? 'true' : null, joined: spec.joined ? 'true' : null }),
      style: { '--bg-n': String(n), '--bg-cw': spec.cellWidth || null, '--bg-cw-phone': spec.cellWidthPhone || null, gridTemplateRows: tracks.join(' ') } }, kids);

    var links = spec.links || [];
    if (links.length) {
      // lines and halos pass under the cells (they never hide a cell's text); heads and crosses go over them
      var under = svg('svg', { class: 'sd-bg-links', 'aria-hidden': 'true' });
      var over = svg('svg', { class: 'sd-bg-links sd-bg-links--over', 'aria-hidden': 'true' });
      grid.append(under, over);
      var find = function (e) {
        var ri = rowKey(rows, e.row);
        return e.cell == null ? rowEls[ri] : cellEls[ri + ':' + e.cell];
      };
      var draw = function () {
        var R = grid.getBoundingClientRect();
        if (!R.width) return;
        var u = rem();
        var box = function (el) { var b = el.getBoundingClientRect(); return { left: b.left - R.left, top: b.top - R.top, width: b.width, height: b.height }; };
        [under, over].forEach(function (layer) {
          layer.setAttribute('width', String(r1(grid.scrollWidth)));
          layer.setAttribute('height', String(r1(grid.scrollHeight)));
          layer.replaceChildren();
        });
        links.forEach(function (l) {
          var A = find(l.from || {}), B = find(l.to || {});
          if (!A || !B) return;
          var g = route(box(A), box(B), u);
          var cls = 'sd-bg-link' + (l.style && l.style !== 'solid' ? ' sd-bg-link--' + l.style : '') + (l.now ? ' sd-bg-link--now' : '') + (l.broken ? ' sd-bg-link--broken' : '');
          var pts = g.points.slice();
          var withHead = l.head !== false;
          var hl = 0.8 * u, hw = 0.45 * u;
          if (withHead) {   // stop the line at the head's base so a thick line does not poke through the tip
            var t = g.tip;
            pts[pts.length - 1] = [t[0] - g.dir[0] * hl * 0.8, t[1] - g.dir[1] * hl * 0.8];
          }
          var gEl = svg('g', ds({ class: cls, 'data-c': l.c })), gTop = svg('g', ds({ class: cls, 'data-c': l.c }));
          if (l.now) gEl.append(svg('polyline', { class: 'sd-bg-link-halo', points: pts.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') }));
          gEl.append(svg('polyline', { class: 'sd-bg-link-line', points: pts.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') }));
          if (withHead) {
            var tp = g.tip, d = g.dir, bx = tp[0] - d[0] * hl, by = tp[1] - d[1] * hl;
            gTop.append(svg('polygon', { class: 'sd-bg-link-head', points: [tp[0], tp[1], bx - d[1] * hw, by + d[0] * hw, bx + d[1] * hw, by - d[0] * hw].map(r1).join(' ') }));
          }
          if (l.broken) {   // a cross halfway along the longest leg: the reference no longer resolves
            var best = 0, at = [0, 0];
            for (var i = 1; i < g.points.length; i++) {
              var p0 = g.points[i - 1], p1 = g.points[i], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
              if (L > best) { best = L; at = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]; }
            }
            var s = 0.45 * u;
            gTop.append(svg('line', { class: 'sd-bg-link-x', x1: r1(at[0] - s), y1: r1(at[1] - s), x2: r1(at[0] + s), y2: r1(at[1] + s) }));
            gTop.append(svg('line', { class: 'sd-bg-link-x', x1: r1(at[0] - s), y1: r1(at[1] + s), x2: r1(at[0] + s), y2: r1(at[1] - s) }));
          }
          under.append(gEl);
          over.append(gTop);
        });
      };
      if (typeof ResizeObserver === 'function') {
        var ro = new ResizeObserver(function () {
          if (!grid.isConnected) { ro.disconnect(); return; }
          draw();
        });
        ro.observe(grid);
      } else {
        requestAnimationFrame(draw);
      }
      grid.draw = draw;
    }

    var count = spec.count;
    if (count != null && (isData(count) || count.nodeType)) count = { text: count };
    var head = spec.title != null || (spec.meta && spec.meta.length) || count ? h('div', { class: 'sd-bg-head' },
      spec.title != null ? h('h2', { class: 'sd-bg-title' }, spec.title) : null,
      (spec.meta || []).map(function (m) { return m == null ? null : h('span', { class: 'sd-bg-meta' }, m); }),
      count ? h('span', { class: 'sd-bg-count' + (count.hl ? ' sd-bg-count--hl' : '') }, count.text) : null) : null;

    return h('section', { class: 'sd-bg' + (spec.bare ? ' sd-bg--bare' : '') + (spec.className ? ' ' + spec.className : '') },
      head, h('div', { class: 'sd-bg-scroll' }, grid), spec.foot || null);
  }

  /**
   * A bar of space used: { total, parts: [{ n, kind, c }], mark: { at, label }, label, text }. Each part is a segment
   * of n / total of the bar, drawn like a cell of its kind (fill, soft, dead, bad, ghost) in series colour c; parts
   * past the total are cut off and the bar gets a dashed --danger edge (overcommitted). mark is a tick at `at` (a
   * threshold) with its label under it; label goes before the bar, text after it. Strings here are words.
   */
  blockGrid.meter = function (o) {
    var total = o.total || 1, sum = 0;
    var segs = (o.parts || []).map(function (p) {
      var w = Math.max(0, Math.min(p.n, total - sum));
      sum += p.n;
      return w > 0 ? h('span', { class: 'sd-bg-seg' + (KIND_CLASS[p.kind || 'fill'] || ''), dataset: ds({ c: p.c, kind: p.kind || 'fill' }), style: { width: r1(100 * w / total) + '%' } }) : null;
    });
    var over = sum > total;
    var mark = o.mark ? h('span', { class: 'sd-bg-tick', style: { left: r1(100 * Math.min(1, o.mark.at / total)) + '%' } },
      o.mark.label != null ? h('span', { class: 'sd-bg-tick-label' }, o.mark.label) : null) : null;
    return h('div', { class: 'sd-bg-meter', dataset: ds({ over: over ? 'true' : null }) },
      o.label != null ? h('span', { class: 'sd-bg-meter-label' }, o.label) : null,
      h('span', { class: 'sd-bg-bar' + (o.mark && o.mark.label != null ? ' sd-bg-bar--ticked' : '') }, segs, mark),
      o.text != null ? h('span', { class: 'sd-bg-meter-text' }, o.text) : null);
  };

  Object.keys(core).forEach(function (key) { blockGrid[key] = core[key]; });
  S.blockGrid = blockGrid;
})(typeof globalThis !== 'undefined' ? globalThis : this);
