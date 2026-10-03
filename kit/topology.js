/* SPDX-License-Identifier: AGPL-3.0-or-later
   simdeck kit view K2: topology with moving packets (docs/sim-ui.md §10).
   Nodes (host, switch, router, server, AP, cloud) are HTML cards on a grid; links, the shared bus and the packets of
   the step are drawn over them after layout, measured in CSS pixels, so lines and text are 1:1 at any screen size
   (no viewBox scaling; every label is HTML). The view holds no words: every text comes from the page's strings.
   A classic script: the page links ../../kit/topology.js after kit.js. The pure part (geometry,
   spec checks) touches no DOM, so node tests can require() this file. */
(function (root) {
  'use strict';

  var KINDS = ['host', 'switch', 'router', 'server', 'ap', 'cloud'];
  var hasDom = typeof document !== 'undefined';

  // ── pure core ──

  /** Centre of a rect { left, top, width, height }. */
  function centre(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /** Where the ray from the centre of rect r towards point p leaves r grown by gap on every side. */
  function edgePoint(r, p, gap) {
    var c = centre(r), dx = p.x - c.x, dy = p.y - c.y;
    var hw = r.width / 2 + (gap || 0), hh = r.height / 2 + (gap || 0);
    if (dx === 0 && dy === 0) return c;
    var t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    t = Math.min(t, 1);
    return { x: c.x + dx * t, y: c.y + dy * t };
  }

  /** The point a share t of the way from a to b, or `back` units before b when back is given instead. */
  function along(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function before(a, b, dist) {
    var len = Math.hypot(b.x - a.x, b.y - a.y);
    return len <= dist ? along(a, b, 0.5) : along(a, b, 1 - dist / len);
  }

  /** The segment a→b moved by d to the left of travel (y grows down, so left of a rightward move is up). */
  function beside(a, b, d) {
    var len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!len) return { a: a, b: b };
    var nx = (b.y - a.y) / len * d, ny = -(b.x - a.x) / len * d;
    return { a: { x: a.x + nx, y: a.y + ny }, b: { x: b.x + nx, y: b.y + ny } };
  }

  /** The link between two node ids, either way round, or null. */
  function linkBetween(spec, a, b) {
    var ls = spec.links || [];
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i];
      if (l.bus) continue;
      if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) return l;
    }
    return null;
  }

  /** The bus that holds every given id, or null. */
  function busWith(spec, ids) {
    var ls = spec.links || [];
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i];
      if (l.bus && ids.every(function (id) { return l.bus.indexOf(id) >= 0; })) return l;
    }
    return null;
  }

  function targetsOf(p) { return Array.isArray(p.to) ? p.to.slice() : [p.to]; }

  /**
   * How a packet travels: { kind: 'bus', link } when sender and every receiver sit on one bus (a broadcast goes to
   * several), else { kind: 'link', link } over the direct link, else null (the spec is wrong). Bus first: on a
   * shared segment the frame goes over the wire, even where a link is drawn too.
   */
  function routeOf(spec, p) {
    var to = targetsOf(p);
    var bus = busWith(spec, [p.from].concat(to));
    if (bus) return { kind: 'bus', link: bus };
    if (to.length !== 1) return null;
    var l = linkBetween(spec, p.from, to[0]);
    return l ? { kind: 'link', link: l } : null;
  }

  /** Of the receivers, the one farthest from the sender along x (ties: the first in the list). */
  function farthest(fromX, xs) {
    var best = 0;
    for (var i = 1; i < xs.length; i++) if (Math.abs(xs[i] - fromX) > Math.abs(xs[best] - fromX)) best = i;
    return best;
  }

  /** Problems in a view spec, as strings (empty when it is fine). The view logs them on the console. */
  function checkSpec(spec) {
    var out = [], ids = {};
    var cols = spec.cols || 0;
    (spec.nodes || []).forEach(function (n) {
      if (!n.id) { out.push('a node has no id'); return; }
      if (ids[n.id]) out.push('node "' + n.id + '" twice');
      ids[n.id] = true;
      if (KINDS.indexOf(n.kind || 'host') < 0) out.push('node "' + n.id + '": unknown kind "' + n.kind + '"');
      if (!(n.col >= 0) || !(n.row >= 0)) out.push('node "' + n.id + '": col and row must be numbers from 0');
      else if (cols && n.col + (n.span || 1) > cols) out.push('node "' + n.id + '": col ' + n.col + ' is outside ' + cols + ' columns');
    });
    var lids = {};
    (spec.links || []).forEach(function (l, i) {
      var name = l.id || (l.bus ? 'bus ' + i : l.a + '-' + l.b);
      if (l.id) { if (lids[l.id]) out.push('link "' + l.id + '" twice'); lids[l.id] = true; }
      var ends = l.bus ? l.bus : [l.a, l.b];
      if (l.bus && !(l.row >= 0)) out.push('bus "' + name + '": row must be a number from 0');
      if (l.bus && ends.length < 2) out.push('bus "' + name + '": fewer than two nodes');
      ends.forEach(function (id) { if (!ids[id]) out.push('link "' + name + '": unknown node "' + id + '"'); });
    });
    (spec.packets || []).forEach(function (p, i) {
      var name = 'packet ' + (p.id || i);
      [p.from].concat(targetsOf(p)).forEach(function (id) { if (!ids[id]) out.push(name + ': unknown node "' + id + '"'); });
      if (!out.length && !routeOf(spec, p)) out.push(name + ': no link or bus from "' + p.from + '" to "' + targetsOf(p).join(', ') + '"');
    });
    return out;
  }

  var core = { KINDS: KINDS, centre: centre, edgePoint: edgePoint, along: along, before: before, beside: beside, linkBetween: linkBetween,
    busWith: busWith, routeOf: routeOf, farthest: farthest, checkSpec: checkSpec };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    return;
  }

  // ── view ──

  var S = root.Simdeck;
  if (!S) { console.error('[simdeck] kit/topology.js needs kit/kit.js loaded first'); return; }
  var h = S.h;
  var svgNs = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var e = document.createElementNS(svgNs, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    return e;
  }
  function px(n) { return Math.round(n * 10) / 10 + 'px'; }
  /** data-* values without the empty ones (Simdeck.h would write null as the text "null"). */
  function ds(o) {
    var out = {};
    Object.keys(o).forEach(function (k) { if (o[k] != null && o[k] !== false) out[k] = String(o[k]); });
    return out;
  }
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }

  /** A text that is data (address, MAC, id) is not language: the word check skips translate="no". */
  function lineEl(l) {
    if (l == null) return null;
    var o = typeof l === 'object' && !(l instanceof Node) && !Array.isArray(l) ? l : { text: l, kind: 'addr' };
    var kind = o.kind || 'addr';
    return h('span', { class: 'sd-topo-' + kind, translate: kind === 'role' ? null : 'no' }, o.text);
  }

  function badgeEl(b, anim) {
    var o = typeof b === 'object' && !(b instanceof Node) ? b : { text: b };
    return h('span', { class: 'sd-topo-badge' + (anim && o.anim !== false ? ' sd-anim-in' : ''), dataset: { k: o.k || 'solid' } }, o.text);
  }

  function cardEl(n, anim) {
    var kind = n.kind || 'host';
    var cls = 'sd-topo-card' + (n.changed ? ' sd-changed' + (anim ? ' sd-anim-in' : '') : '') + (n.state === 'down' ? ' sd-hatch' : '');
    var kids = [];
    if (kind === 'cloud') {
      kids.push(n.name != null ? h('b', null, n.name) : null);
    } else {
      kids.push(h('span', { class: 'sd-topo-mark sd-fill', dataset: ds({ c: n.c }), translate: 'no' },
        n.mark != null ? n.mark : n.id));
      if (n.name != null) kids.push(h('b', { class: 'sd-topo-name' }, n.name));
    }
    (n.lines || []).forEach(function (l) { kids.push(lineEl(l)); });
    if (n.badges) kids.push(h('div', { class: 'sd-topo-badges' }, n.badges.map(function (b) { return badgeEl(b, anim); })));
    if (n.extra) kids.push(n.extra);
    return h('div', { class: cls, dataset: ds({ id: n.id, kind: kind, state: n.state }) }, kids);
  }

  /**
   * Simdeck.topology(spec) → element. Draws spec into a grid; the overlay (links, bus, packets) is drawn after
   * layout and again on every resize. spec:
   *   cols, rows (CSS row tracks, e.g. ['auto', '4.2rem', 'auto']), dir (ctx.dir: packets move only on 'forward'),
   *   nodes:   [{ id, kind, col, row, span, mark, c, name, lines, badges, extra, state, changed, align, table, tableRow }]
   *   links:   [{ id, a, b, state, active, style, ends: { a, b } }] or a bus [{ id, bus: [ids], row, state }]
   *   packets: [{ from, to (id or [ids]), label, c, cast, chip, arrow, move, drop, mid }]
   * docs/sim-ui.md §10 has the meaning of every field.
   */
  function topology(spec) {
    var problems = checkSpec(spec);
    problems.forEach(function (p) { console.error('[simdeck] topology: ' + p); });
    var anim = spec.dir === 'forward' && !S.reducedMotion();
    var cols = spec.cols || Math.max.apply(null, (spec.nodes || []).map(function (n) { return n.col + (n.span || 1); }).concat([1]));
    var el = h('div', { class: 'sd-topo' + (spec.className ? ' ' + spec.className : ''), style: {
      gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))',
      gridTemplateRows: spec.rows ? spec.rows.join(' ') : null,
      columnGap: spec.gap || null
    } });
    var cards = {}, lanes = {};

    (spec.links || []).forEach(function (l, i) {
      if (!l.bus) return;
      var lane = h('div', { class: 'sd-topo-lane', 'aria-hidden': 'true', style: { gridRow: String(l.row + 1) } });
      lanes[l.id || 'bus' + i] = lane;
      el.append(lane);
    });
    (spec.nodes || []).forEach(function (n) {
      var card = cardEl(n, anim);
      card.style.gridColumn = (n.col + 1) + ' / span ' + (n.span || 1);
      card.style.gridRow = String(n.row + 1);
      if (n.align) card.style.alignSelf = n.align;
      cards[n.id] = card;
      var wrap = h('div', { class: 'sd-topo-node', dataset: { id: n.id } }, card);
      if (n.table) {
        var side = h('div', { class: 'sd-topo-side' }, n.table);
        side.style.gridColumn = card.style.gridColumn;
        side.style.gridRow = String((n.tableRow != null ? n.tableRow : n.row + 1) + 1);
        wrap.append(side);
      }
      el.append(wrap);
    });
    var back = svg('svg', { class: 'sd-topo-links', 'aria-hidden': 'true' });
    var front = h('div', { class: 'sd-topo-over', 'aria-hidden': 'true' });
    var frontSvg = svg('svg', { class: 'sd-topo-arrows' });
    front.append(frontSvg);
    el.append(back, front);

    var animate = anim;
    function draw() {
      var R = el.getBoundingClientRect();
      if (!R.width) return;
      var u = rem();
      var rect = function (e) { var r = e.getBoundingClientRect(); return { left: r.left - R.left, top: r.top - R.top, width: r.width, height: r.height }; };
      var box = {};
      Object.keys(cards).forEach(function (id) { box[id] = rect(cards[id]); });
      back.replaceChildren();
      frontSvg.replaceChildren();
      Array.prototype.slice.call(front.children, 1).forEach(function (c) { c.remove(); });
      var line = function (parent, a, b, cls) { parent.append(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls })); };
      var cross = function (parent, p, s) {
        line(parent, { x: p.x - s, y: p.y - s }, { x: p.x + s, y: p.y + s }, 'sd-topo-x');
        line(parent, { x: p.x - s, y: p.y + s }, { x: p.x + s, y: p.y - s }, 'sd-topo-x');
      };
      var label = function (text, p, cls, extra) {
        var e = h('span', { class: cls, style: Object.assign({ left: px(p.x), top: px(p.y) }, extra || {}) }, text);
        front.append(e);
        return e;
      };
      var laneGeom = {};

      (spec.links || []).forEach(function (l, i) {
        var state = l.state || 'up';
        if (l.bus) {
          var lr = rect(lanes[l.id || 'bus' + i]);
          var xs = l.bus.map(function (id) { return centre(box[id]).x; });
          var y = lr.top + lr.height - 0.4 * u - 0.175 * u;
          laneGeom[l.id || 'bus' + i] = { top: lr.top, y: y };
          line(back, { x: Math.min.apply(null, xs), y: y }, { x: Math.max.apply(null, xs), y: y }, 'sd-topo-bus' + (state !== 'up' ? ' sd-topo-' + state : ''));
          l.bus.forEach(function (id, k) {
            var b = box[id];
            line(back, { x: xs[k], y: Math.min(b.top + b.height, lr.top) }, { x: xs[k], y: y }, 'sd-topo-stub');
          });
          if (state === 'down') cross(frontSvg, { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y: y }, 0.6 * u);
          return;
        }
        var A = box[l.a], B = box[l.b];
        if (!A || !B) return;
        var ca = centre(A), cb = centre(B);
        var cls = 'sd-topo-link' + (l.style === 'dashed' ? ' sd-topo-dashed' : '') + (l.active ? ' sd-topo-active' : '') + (state !== 'up' ? ' sd-topo-' + state : '');
        line(back, ca, cb, cls);
        var ea = edgePoint(A, cb, 0), eb = edgePoint(B, ca, 0);
        if (state === 'down') cross(frontSvg, along(ea, eb, 0.5), 0.6 * u);
        if (l.ends) {
          if (l.ends.a != null) label(l.ends.a, along(ea, eb, Math.min(0.3, 2.2 * u / Math.max(1, Math.hypot(eb.x - ea.x, eb.y - ea.y)))), 'sd-topo-end');
          if (l.ends.b != null) label(l.ends.b, along(eb, ea, Math.min(0.3, 2.2 * u / Math.max(1, Math.hypot(eb.x - ea.x, eb.y - ea.y)))), 'sd-topo-end');
        }
      });

      (spec.packets || []).forEach(function (p) {
        var route = routeOf(spec, p);
        if (!route || !box[p.from]) return;
        var dashed = p.cast === 'broadcast';
        var moving = animate && p.move !== false;
        var showChip = p.chip !== false && p.label != null;
        var to = targetsOf(p);
        var head = function (tip, dir, cls) {   // dir: unit vector of travel
          var bx = tip.x - dir.x * 0.9 * u, by = tip.y - dir.y * 0.9 * u, nx = -dir.y * 0.55 * u, ny = dir.x * 0.55 * u;
          frontSvg.append(svg('polygon', { points: [tip.x, tip.y, bx + nx, by + ny, bx - nx, by - ny].join(' '), class: cls }));
          return { x: bx, y: by };
        };
        var chip = function (p0, p1, centred) {
          var e = label(p.label, p1, 'sd-topo-chip sd-fill' + (centred ? ' sd-topo-centred' : '') + (moving ? ' sd-topo-move' : ''),
            { '--x0': px(p0.x), '--y0': px(p0.y) });
          if (p.c != null) e.dataset.c = String(p.c);
        };
        if (route.kind === 'bus') {
          var g = laneGeom[route.link.id || 'bus' + (spec.links || []).indexOf(route.link)];
          var y = g.top + 2.3 * u + 0.15 * u;
          var fx = centre(box[p.from]).x;
          var xs = to.map(function (id) { return centre(box[id]).x; });
          var far = xs[farthest(fx, xs)];
          if (p.arrow !== false) {
            line(frontSvg, { x: fx, y: y }, { x: far, y: y }, 'sd-topo-path' + (dashed ? ' sd-topo-dashed' : ''));
            xs.forEach(function (x) { head({ x: x, y: y }, { x: x > fx ? 1 : -1, y: 0 }, 'sd-topo-head'); });
          }
          if (showChip) xs.forEach(function (x) {
            var end = { x: x + (x > fx ? -2.2 : 2.2) * u, y: g.top + 0.1 * u };
            chip({ x: fx, y: end.y }, p.mid ? { x: (fx + x) / 2, y: end.y } : end, false);
          });
          return;
        }
        var A = box[p.from], B = box[to[0]];
        // beside the link, on the left of travel: the link's own state stays visible, and a reply passes the other side
        var side = beside(edgePoint(A, centre(B), 0.3 * u), edgePoint(B, centre(A), 0.3 * u), 0.6 * u);
        var a = side.a, b = side.b;
        var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        var dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
        var tip = p.mid ? along(a, b, 0.5) : b;
        if (p.arrow !== false) {
          if (p.drop) {
            line(frontSvg, a, tip, 'sd-topo-path' + (dashed ? ' sd-topo-dashed' : ''));
            cross(frontSvg, tip, 0.55 * u);
          } else {
            line(frontSvg, a, head(tip, dir, 'sd-topo-head'), 'sd-topo-path' + (dashed ? ' sd-topo-dashed' : ''));
          }
        }
        if (showChip) chip(a, along(a, tip, p.at != null ? p.at : 0.6), true);
      });
      animate = false; // a resize redraws without moving the packets again
    }

    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(function () {
        if (!el.isConnected) { ro.disconnect(); return; }
        draw();
      });
      ro.observe(el);
    } else {
      requestAnimationFrame(draw);
    }
    el.draw = draw;
    return el;
  }

  /**
   * A table beside a node (ARP table, MAC table, route table, best BPDU): { title, rows, empty, foot }.
   * rows: [{ cells: [strings, data], note (a word like "new"), c (series colour of the left bar), mark: 'new' |
   * 'refreshed' | 'hit' }]. dir: animate new rows only on a forward step.
   */
  topology.table = function (o, dir) {
    var anim = dir === 'forward';
    var rows = o.rows || [];
    return h('div', { class: 'sd-topo-tab' },
      o.title != null ? h('h3', null, o.title) : null,
      rows.length ? h('ul', null, rows.map(function (r) {
        var cls = (r.mark === 'new' ? 'sd-changed' + (anim ? ' sd-anim-in' : '') : '');
        return h('li', { class: cls || null, dataset: ds({ mark: r.mark, c: r.c }) },
          (r.cells || []).map(function (c) { return c instanceof Node ? c : h('span', { translate: 'no' }, c); }),
          r.note != null ? h('b', null, r.note) : null);
      })) : o.empty != null ? h('div', { class: 'sd-topo-empty' }, o.empty) : null,
      o.foot || null);
  };

  /**
   * The headers of the packet in flight, outermost layer first: [{ title, fields: [[label, value, { changed }]],
   * body, dashed, c }]. Each next layer sits inside the one before (frame ⊃ packet ⊃ segment ⊃ data). A string
   * value is data (monospace, translate="no"); a node or array is placed as given.
   */
  topology.headers = function (layers, dir) {
    var anim = dir === 'forward';
    function layer(i) {
      var L = layers[i];
      if (!L) return null;
      var kv = L.fields && L.fields.length ? h('dl', { class: 'sd-topo-kv' }, L.fields.map(function (f) {
        var v = f[1], o = f[2] || {};
        var plain = typeof v === 'string' || typeof v === 'number';
        return [h('dt', null, f[0]), h('dd', { class: o.changed ? 'sd-changed' : null, translate: plain ? 'no' : null }, plain ? String(v) : v)];
      })) : null;
      return h('div', { class: i === 0 ? 'sd-topo-hdr' + (anim ? ' sd-anim-in' : '') : 'sd-topo-layer', dataset: ds({ dashed: L.dashed ? 'true' : null, c: L.c }) },
        L.title != null ? h('b', null, L.title) : null, kv, L.body || null, layer(i + 1));
    }
    return layer(0);
  };

  Object.keys(core).forEach(function (k) { topology[k] = core[k]; });
  S.topology = topology;
})(typeof globalThis !== 'undefined' ? globalThis : this);
