/* SPDX-License-Identifier: AGPL-3.0-or-later
   simdeck kit view K1: message sequence chart (docs/sim-ui.md §11).
   Lanes (one per party) with a card on top and a lifeline down through the rows; one row per message or event, time
   running down. Everything is HTML placed with percentages of the lane area, so text is 1:1 at any screen size (no
   SVG, no viewBox). The view holds no words: every text comes from the page's strings.
   A classic script: the page links ../../kit/sequence.js after kit.js. The pure part (lane positions, sides, timer
   parts, spec checks) touches no DOM, so node tests can require() this file. */
(function (root) {
  'use strict';

  var hasDom = typeof document !== 'undefined';
  var LINES = ['solid', 'dashed', 'dotted'];

  // ── pure core ──

  /**
   * Where the centre of lane i of k sits in the lane area, as { share, gaps }: x = share × (100% − (k − 1) × gap) +
   * gaps × gap. The lane cards sit in k equal grid columns with that gap, so the lifeline runs through the card's centre.
   */
  function laneAt(i, k) { return { share: (i + 0.5) / k, gaps: i }; }

  /** The point half way between two positions (a message lost on the wire). */
  function midway(a, b) { return { share: (a.share + b.share) / 2, gaps: (a.gaps + b.gaps) / 2 }; }

  /** The distance from a to b (b to the right of a). */
  function between(a, b) { return { share: b.share - a.share, gaps: b.gaps - a.gaps }; }

  /** A position as a CSS length; gap is a CSS length too. */
  function css(p, gap, k) {
    var n = function (v) { return Math.round(v * 1e6) / 1e6; };
    return 'calc((100% - ' + (k - 1) + ' * ' + gap + ') * ' + n(p.share) + ' + ' + n(p.gaps) + ' * ' + gap + ')';
  }

  function targetsOf(r) { return Array.isArray(r.to) ? r.to.slice() : r.to == null ? [] : [r.to]; }

  /**
   * Which side of the sender the label goes on: towards the receivers. With receivers on both sides (a sender in the
   * middle broadcasting), towards the farthest; tie-break: right.
   */
  function labelSide(fi, idx) {
    var right = 0, left = 0;
    idx.forEach(function (i) { if (i > fi) right = Math.max(right, i - fi); else if (i < fi) left = Math.max(left, fi - i); });
    return left > right ? 'l' : 'r';
  }

  /**
   * Which side of receiver ri its word goes on, for a message from fi among k lanes: 'in' (between sender and
   * receiver, the default) or 'out' (beyond the receiver). Out only when the arrow spans one lane, where the label
   * already fills the gap, and the receiver is not the outermost lane on that side (the word must stay in the chart).
   */
  function reSide(fi, ri, k) {
    if (Math.abs(ri - fi) !== 1) return 'in';
    return (ri > fi ? ri < k - 1 : ri > 0) ? 'out' : 'in';
  }

  /** The part of timer tm that row n draws: null, 'only', 'start', 'mid' or 'end'. A timer with no end runs to the last row. */
  function timerPart(tm, n, rows) {
    var to = tm.to == null ? rows - 1 : tm.to;
    if (n < tm.from || n > to) return null;
    if (tm.from === to) return 'only';
    return n === tm.from ? 'start' : n === to ? 'end' : 'mid';
  }

  /** Problems in a chart spec, as strings (empty when it is fine). The view logs them on the console. */
  function checkSpec(spec) {
    var out = [], ids = {};
    var lanes = spec.lanes || [];
    if (lanes.length < 2 || lanes.length > 6) out.push('lanes: ' + lanes.length + ' (the chart fits 2 to 6)');
    lanes.forEach(function (l) {
      if (!l.id) { out.push('a lane has no id'); return; }
      if (ids[l.id]) out.push('lane "' + l.id + '" twice');
      ids[l.id] = true;
    });
    var rows = spec.rows || [];
    rows.forEach(function (r, i) {
      var name = 'row ' + i;
      var kind = r.kind || 'msg';
      if (kind === 'note') {
        if (!ids[r.lane]) out.push(name + ': unknown lane "' + r.lane + '"');
        return;
      }
      if (kind !== 'msg') { out.push(name + ': unknown kind "' + kind + '"'); return; }
      var to = targetsOf(r);
      if (!ids[r.from]) out.push(name + ': unknown lane "' + r.from + '"');
      if (!to.length) out.push(name + ': a message needs a receiver');
      to.forEach(function (id) {
        if (!ids[id]) out.push(name + ': unknown lane "' + id + '"');
        else if (id === r.from) out.push(name + ': "' + id + '" sends to itself (use a note)');
      });
      if (r.drop && to.length !== 1) out.push(name + ': a message lost on the wire (drop) has one receiver');
      if (r.line && LINES.indexOf(r.line) < 0) out.push(name + ': unknown line "' + r.line + '"');
      if (r.place && r.place !== 'from' && r.place !== 'mid') out.push(name + ': unknown place "' + r.place + '"');
      (r.lost || []).forEach(function (id) { if (to.indexOf(id) < 0) out.push(name + ': lost at "' + id + '", which is not a receiver'); });
      (r.down || []).forEach(function (id) { if (!ids[id]) out.push(name + ': unknown lane "' + id + '"'); });
    });
    (spec.timers || []).forEach(function (tm, i) {
      var name = 'timer ' + (tm.id || i);
      if (!ids[tm.lane]) out.push(name + ': unknown lane "' + tm.lane + '"');
      if (!(tm.from >= 0) || tm.from >= rows.length) out.push(name + ': from must be a row index');
      else if (tm.to != null && (tm.to < tm.from || tm.to >= rows.length)) out.push(name + ': to must be a row index from ' + tm.from);
    });
    return out;
  }

  var core = { LINES: LINES, laneAt: laneAt, midway: midway, between: between, css: css, labelSide: labelSide, reSide: reSide,
    timerPart: timerPart, checkSpec: checkSpec };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    return;
  }

  // ── view ──

  var S = root.Simdeck;
  if (!S) { console.error('[simdeck] kit/sequence.js needs kit/kit.js loaded first'); return; }
  var h = S.h;
  var GAP = 'var(--sd-seq-gap)';
  /** data-* values without the empty ones (Simdeck.h would write null as the text "null"). */
  function ds(o) {
    var out = {};
    Object.keys(o).forEach(function (k) { if (o[k] != null && o[k] !== false) out[k] = String(o[k]); });
    return out;
  }
  /** A bare string or number is data (time, address): the word check skips translate="no". */
  function dataEl(v, cls) {
    if (v == null) return null;
    if (typeof v === 'string' || typeof v === 'number') return h('span', { class: cls || null, translate: 'no' }, String(v));
    return h('span', { class: cls || null }, v);
  }

  function headEl(l, anim) {
    var mark = l.mark !== null ? h('span', { class: 'sd-seq-mark sd-fill', dataset: ds({ c: l.c, shape: l.shape }), translate: 'no' },
      l.mark != null ? l.mark : l.id) : null;
    return h('div', { class: 'sd-seq-head' + (l.changed ? ' sd-changed' + (anim ? ' sd-anim-in' : '') : ''), dataset: ds({ lane: l.id, state: l.state }) },
      h('div', { class: 'sd-seq-head-h' }, mark, l.name != null ? h('span', { class: 'sd-seq-name' }, l.name) : null, l.tags || null),
      l.body || null);
  }

  /**
   * Simdeck.sequence(spec) → element. spec:
   *   lanes:  [{ id, mark, c, shape, name, tags, body, state, changed }]
   *   rows:   [{ kind: 'msg', from, to, label, c, fields, place, line, weight, lock, muted, drop, lost, re, time, cause, seen,
   *              changed, down }] or [{ kind: 'note', lane, text, k, time, cause, changed, down }]
   *   timers: [{ lane, from, to, label, end, side }]
   *   eve:    { title, width } (the eavesdropper column), dir (ctx.dir), timeWidth, gap, earlier(n), empty
   * docs/sim-ui.md §11 has the meaning of every field.
   */
  function sequence(spec) {
    checkSpec(spec).forEach(function (p) { console.error('[simdeck] sequence: ' + p); });
    var anim = spec.dir === 'forward' && !S.reducedMotion();
    var lanes = spec.lanes || [], k = lanes.length, rows = spec.rows || [], timers = spec.timers || [];
    var ids = lanes.map(function (l) { return l.id; });
    var at = function (id) { return laneAt(ids.indexOf(id), k); };
    var x = function (p) { return css(p, GAP, k); };
    var eve = spec.eve || null;
    var style = { '--sd-seq-k': String(k) };
    if (spec.timeWidth) style['--sd-seq-tcol'] = spec.timeWidth;
    if (spec.gap) style['--sd-seq-gap'] = spec.gap;
    if (eve && eve.width) style['--sd-seq-eve'] = eve.width;
    var el = h('div', { class: 'sd-seq' + (eve ? ' sd-seq--eve' : '') + (spec.className ? ' ' + spec.className : ''), style: style });

    var heads = h('div', { class: 'sd-seq-heads' }, h('div', { class: 'sd-seq-spacer' }), lanes.map(function (l) { return headEl(l, anim); }),
      eve ? h('div', { class: 'sd-seq-evehead' }, eve.title) : null);
    var list = h('div', { class: 'sd-seq-list' });

    function lifelines(lane, down) {
      lanes.forEach(function (l) {
        lane.append(h('span', { class: 'sd-seq-life', dataset: ds({ down: (down || []).indexOf(l.id) >= 0 ? 'true' : null }), style: { left: x(at(l.id)) } }));
      });
    }
    function newCls(r) { return r.changed ? ' sd-changed' + (anim ? ' sd-anim-in' : '') : ''; }

    function msgLane(r) {
      var lane = h('div', { class: 'sd-seq-lane' });
      lifelines(lane, r.down);
      var fi = ids.indexOf(r.from), to = targetsOf(r);
      var idx = to.map(function (id) { return ids.indexOf(id); });
      var from = laneAt(fi, k);
      var ends = r.drop ? [midway(from, laneAt(idx[0], k))] : idx.map(function (i) { return laneAt(i, k); });
      var lo = from, hi = from;
      ends.forEach(function (p) { if (p.share < lo.share) lo = p; if (p.share > hi.share) hi = p; });
      lane.append(h('span', { class: 'sd-seq-arrow', dataset: ds({ line: r.line && r.line !== 'solid' ? r.line : null, weight: r.weight, lock: r.lock ? 'true' : null, muted: r.muted ? 'true' : null }),
        style: { left: x(lo), width: x(between(lo, hi)) } }));
      var side = labelSide(fi, idx);
      if (r.label != null || r.fields != null) {
        var chip = r.label != null ? h('b', { class: 'sd-seq-chip' + (r.changed ? newCls(r) : r.muted ? '' : ' sd-fill'), dataset: ds({ c: r.c, muted: r.muted ? 'true' : null }), translate: typeof r.label === 'string' ? 'no' : null },
          r.lock ? h('span', { class: 'sd-seq-lock', 'aria-hidden': 'true' }) : null, r.label) : null;
        var place = r.place === 'mid' ? { left: x(midway(lo, hi)), transform: 'translateX(-50%)' }
          : side === 'r' ? { left: 'calc(' + x(from) + ' + 0.6rem)' } : { left: x(from), transform: 'translateX(calc(-100% - 0.6rem))' };
        lane.append(h('span', { class: 'sd-seq-label', dataset: { side: r.place === 'mid' ? 'r' : side }, style: place },
          chip, dataEl(r.fields, 'sd-seq-fields')));
      }
      ends.forEach(function (p, j) {
        var id = r.drop ? null : to[j];
        var dir = p.share > from.share ? 'r' : 'l';
        var lost = r.drop || (r.lost || []).indexOf(id) >= 0;
        if (lost) lane.append(h('span', { class: 'sd-seq-x', style: { left: x(p) }, 'aria-hidden': 'true' }, '✕'));
        else lane.append(h('span', { class: 'sd-seq-tip', dataset: ds({ dir: dir, muted: r.muted ? 'true' : null }), style: { left: x(p) } }));
        var word = r.drop ? r.re && r.re[to[0]] : r.re && r.re[id];
        if (word == null) return;
        // inside: before the tip, towards the sender; outside: beyond the tip (a drop's word sits past its ✕)
        var out = r.drop || reSide(fi, idx[j], k) === 'out';
        var right = (dir === 'r') === out;
        lane.append(h('span', { class: 'sd-seq-re', dataset: { side: out ? 'out' : 'in' },
          style: right ? { left: 'calc(' + x(p) + ' + 1.1rem)' } : { left: x(p), transform: 'translateX(calc(-100% - 1.1rem))' } }, word));
      });
      return lane;
    }

    function noteLane(r) {
      var lane = h('div', { class: 'sd-seq-lane' });
      lifelines(lane, r.down);
      lane.append(h('span', { class: 'sd-seq-note' + newCls(r), dataset: ds({ k: r.k }), style: { left: x(at(r.lane)) } }, r.text));
      return lane;
    }

    function timerSegs(lane, n) {
      timers.forEach(function (tm, i) {
        var part = timerPart(tm, n, rows.length);
        if (!part) return;
        var side = tm.side === 'r' ? 'r' : 'l';
        var seg = h('span', { class: 'sd-seq-timer', dataset: ds({ timer: i, part: part, side: side, end: (part === 'end' || part === 'only') ? tm.end : null }),
          style: { left: x(at(tm.lane)) } });
        if (part === 'start' || part === 'only') seg.append(h('span', { class: 'sd-seq-tlabel' }, tm.label));
        if ((part === 'end' || part === 'only') && tm.end === 'expired') seg.append(h('span', { class: 'sd-seq-tx', 'aria-hidden': 'true' }, '✕'));
        lane.append(seg);
      });
    }

    if (!rows.length && spec.empty != null) list.append(h('div', { class: 'sd-seq-nomsg' }, spec.empty));
    var rowEls = rows.map(function (r, n) {
      var lane = (r.kind || 'msg') === 'note' ? noteLane(r) : msgLane(r);
      timerSegs(lane, n);
      var cause = r.cause == null ? null : h('span', { class: 'sd-seq-cause' }, r.cause);
      var row = h('div', { class: 'sd-seq-row', dataset: ds({ new: r.changed ? '' : null, kind: r.kind || 'msg' }) },
        h('div', { class: 'sd-seq-time' }, dataEl(r.time), cause), lane);
      if (eve) row.append(h('div', { class: 'sd-seq-eve', dataset: ds({ lock: r.lock ? 'true' : null }) },
        r.lock ? h('span', { class: 'sd-seq-lock', 'aria-hidden': 'true' }) : null, r.seen != null ? r.seen : null));
      return row;
    });
    rowEls.forEach(function (r) { list.append(r); });
    el.append(heads, list);

    /** Drop the oldest rows until the list fits its box (at least two stay), and say how many are hidden. */
    function fit() {
      if (!el.isConnected || !list.clientHeight) return;
      list.replaceChildren.apply(list, rows.length ? rowEls : list.children.length ? [list.children[0]] : []);
      rowEls.forEach(function (r) { r.querySelectorAll('.sd-seq-tlabel[data-moved]').forEach(function (e) { e.remove(); }); });
      var hidden = 0, earlier = null;
      while (list.scrollHeight > list.clientHeight + 1 && rowEls.length - hidden > 2 && spec.earlier) {
        var gone = rowEls[hidden];
        // a timer that started in the dropped row keeps its label on its first row still shown
        gone.querySelectorAll('.sd-seq-tlabel').forEach(function (lab) {
          var tid = lab.parentNode.dataset.timer;
          var next = rowEls[hidden + 1] && rowEls[hidden + 1].querySelector('.sd-seq-timer[data-timer="' + tid + '"]');
          if (next && !next.querySelector('.sd-seq-tlabel')) { var c = lab.cloneNode(true); c.dataset.moved = ''; next.append(c); }
        });
        gone.remove();
        hidden++;
        if (!earlier) { earlier = h('div', { class: 'sd-seq-earlier' }); list.prepend(earlier); }
        earlier.textContent = spec.earlier(hidden);
      }
      el.dataset.hidden = String(hidden);
    }
    if (typeof ResizeObserver === 'function') {
      var last = -1;
      var ro = new ResizeObserver(function () {
        if (!el.isConnected) { ro.disconnect(); return; }
        if (list.clientHeight !== last) { last = list.clientHeight; fit(); }
      });
      ro.observe(list);
    }
    el.fit = fit;
    return el;
  }

  Object.keys(core).forEach(function (key) { sequence[key] = core[key]; });
  S.sequence = sequence;
})(typeof globalThis !== 'undefined' ? globalThis : this);
