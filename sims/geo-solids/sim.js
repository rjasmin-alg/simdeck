/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-solids: a cube, a cuboid, a pyramid, a cylinder, a cone and a sphere are told apart by their faces
   (flat or curved), edges and vertices; turning a solid shows the hidden ones; unfolding a cube or a cuboid shows its
   faces as a net; a sugar "cube" uses the word loosely. MAT OŠ C.4.5 (with C.1.1, C.1.3, C.2.1, C.2.2).
   Two modes: one solid turned and counted (count), a cube or a cuboid unfolded into a net (net).
   Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. `solids` is the reusable part: pure functions over plain numbers,
   no strings. */
(function (root) {
  'use strict';

  var MODES = ['count', 'net'];
  var SHOWS = ['v', 'e', 'f'];
  var SOLID_IDS = ['cube', 'cuboid', 'pyramid', 'cylinder', 'cone', 'sphere', 'sugar'];
  var NET_IDS = ['cube', 'cuboid', 'sugar'];
  var FACE_IDS = ['bottom', 'front', 'right', 'back', 'left', 'top'];
  var ROUND_N = 48;           // strips of a round surface
  var EPS = 1e-6;             // rule 3: edge-on is hidden
  var BASE = 13;              // rule 4: the lit order, one digit (index + 1) per item, at most 12 items
  var LIT_MAX = Math.pow(BASE, 12) - 1;
  var TURN = 30;              // rule 9
  var OPEN_STEP = 25;         // rule 10
  var TILT_MIN = -90, TILT_MAX = 90;

  /** Sizes (SPEC, Solids): boxes are a wide (x), b deep (z), c high (y). */
  var SOLIDS = {
    cube: { box: [4, 4, 4], unit: 'cm' },
    cuboid: { box: [6, 3, 4], unit: 'cm' },
    pyramid: { pyramid: [5, 5], unit: 'cm' },
    cylinder: { round: [2.5, 5], unit: 'cm' },
    cone: { round: [2.5, 5.5], cone: true, unit: 'cm' },
    sphere: { sphere: 3, unit: 'cm' },
    sugar: { box: [16, 16, 11], unit: 'mm' }
  };

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function wrap360(v, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return ((n % 360) + 360) % 360;
  }

  var solids = {
    /** Newell's normal of a polygon (not unit length). */
    normal: function (pts) {
      var n = [0, 0, 0];
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        n[0] += (a[1] - b[1]) * (a[2] + b[2]);
        n[1] += (a[2] - b[2]) * (a[0] + b[0]);
        n[2] += (a[0] - b[0]) * (a[1] + b[1]);
      }
      return n;
    },

    /** Rule 2: turn a point (or a direction) by yaw about the vertical axis, then by tilt about the horizontal one. */
    turn: function (p, yaw, tilt) {
      var f = yaw * Math.PI / 180, t = tilt * Math.PI / 180;
      var x = p[0] * Math.cos(f) - p[2] * Math.sin(f), z1 = p[0] * Math.sin(f) + p[2] * Math.cos(f);
      return [x, p[1] * Math.cos(t) - z1 * Math.sin(t), p[1] * Math.sin(t) + z1 * Math.cos(t)];
    },

    /** A box a wide, b deep, c high, centred. Points 0–3 the top, 4–7 the bottom (back left, back right, front
        right, front left); faces in FACE_IDS order, wound outwards. */
    box: function (a, b, c) {
      var pts = [], y;
      [c / 2, -c / 2].forEach(function (yy) {
        y = yy;
        pts.push([-a / 2, y, -b / 2], [a / 2, y, -b / 2], [a / 2, y, b / 2], [-a / 2, y, b / 2]);
      });
      var polys = [[4, 5, 6, 7], [7, 6, 2, 3], [6, 5, 1, 2], [5, 4, 0, 1], [4, 7, 3, 0], [0, 3, 2, 1]];
      return {
        pts: pts,
        faces: polys.map(function (ids, g) { return { ids: ids, g: g }; }),
        groups: polys.map(function (ids) { return { flat: true, ids: ids }; }),
        verts: [0, 1, 2, 3, 4, 5, 6, 7],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]],
        rims: []
      };
    },

    /** A pyramid on a square base s, height h: points 0–3 the base, 4 the apex. */
    pyramid: function (s, h) {
      var pts = [[-s / 2, -h / 2, -s / 2], [s / 2, -h / 2, -s / 2], [s / 2, -h / 2, s / 2], [-s / 2, -h / 2, s / 2], [0, h / 2, 0]];
      var polys = [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]];
      return {
        pts: pts,
        faces: polys.map(function (ids, g) { return { ids: ids, g: g }; }),
        groups: polys.map(function (ids) { return { flat: true, ids: ids }; }),
        verts: [4, 0, 1, 2, 3],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]],
        rims: []
      };
    },

    /** A cylinder (or a cone) of radius r and height h: ROUND_N strips; the bottom circle, the top circle (cylinder),
        then the curved surface. */
    round: function (r, h, cone) {
      var N = ROUND_N, pts = [], i;
      for (i = 0; i < N; i++) { var a = 2 * Math.PI * i / N; pts.push([r * Math.cos(a), -h / 2, -r * Math.sin(a)]); }
      var bottom = [], top = [];
      for (i = N - 1; i >= 0; i--) bottom.push(i);
      if (cone) pts.push([0, h / 2, 0]);
      else for (i = 0; i < N; i++) { var b = 2 * Math.PI * i / N; pts.push([r * Math.cos(b), h / 2, -r * Math.sin(b)]); top.push(N + i); }
      var groups = [{ flat: true, ids: bottom }], faces = [{ ids: bottom, g: 0 }];
      if (!cone) { groups.push({ flat: true, ids: top }); faces.push({ ids: top, g: 1 }); }
      var gc = groups.length;
      groups.push({ flat: false });
      for (i = 0; i < N; i++) {
        var j = (i + 1) % N;
        faces.push({ ids: cone ? [i, j, N] : [i, j, N + j, N + i], g: gc, strip: true });
      }
      var rimB = [];
      for (i = 0; i < N; i++) rimB.push(i);
      return {
        pts: pts, faces: faces, groups: groups,
        verts: cone ? [N] : [], edges: [],
        rims: cone ? [rimB] : [rimB, top.slice()]
      };
    },

    /** A sphere of radius r: a band mesh, one curved surface. */
    sphere: function (r) {
      var N = 24, M = 12, pts = [[0, r, 0]], faces = [], i, k;
      for (k = 1; k < M; k++) {
        var th = Math.PI * k / M;
        for (i = 0; i < N; i++) { var a = 2 * Math.PI * i / N; pts.push([r * Math.sin(th) * Math.cos(a), r * Math.cos(th), -r * Math.sin(th) * Math.sin(a)]); }
      }
      pts.push([0, -r, 0]);
      var S = pts.length - 1;
      function at(k, i) { return 1 + (k - 1) * N + (i % N); }
      for (i = 0; i < N; i++) faces.push({ ids: [0, at(1, i), at(1, i + 1)], g: 0, strip: true });
      for (k = 1; k < M - 1; k++) for (i = 0; i < N; i++) faces.push({ ids: [at(k, i), at(k + 1, i), at(k + 1, i + 1), at(k, i + 1)], g: 0, strip: true });
      for (i = 0; i < N; i++) faces.push({ ids: [at(M - 1, i), S, at(M - 1, i + 1)], g: 0, strip: true });
      return { pts: pts, faces: faces, groups: [{ flat: false }], verts: [], edges: [], rims: [] };
    },

    /** The geometry of a solid by id, with each face's outward normal. */
    geom: function (id) {
      var d = SOLIDS[id];
      var g = d.box ? solids.box(d.box[0], d.box[1], d.box[2]) : d.pyramid ? solids.pyramid(d.pyramid[0], d.pyramid[1])
        : d.round ? solids.round(d.round[0], d.round[1], !!d.cone) : solids.sphere(d.sphere);
      g.faces.forEach(function (f) { f.n = solids.normal(f.ids.map(function (i) { return g.pts[i]; })); });
      g.groups.forEach(function (gr) { gr.shape = gr.flat ? solids.shapeOf(gr.ids.map(function (i) { return g.pts[i]; })) : null; });
      return g;
    },

    /** Rule 8: a flat surface's shape. */
    shapeOf: function (pts) {
      if (pts.length === 3) return 'triangle';
      if (pts.length > 4) return 'circle';
      var L = pts.map(function (p, i) {
        var q = pts[(i + 1) % pts.length];
        return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      });
      return Math.max.apply(null, L) - Math.min.apply(null, L) <= 1e-9 ? 'square' : 'rectangle';
    },

    /** Rule 3: what is seen from (yaw, tilt): per face, per surface, per counted vertex and edge. */
    seen: function (g, yaw, tilt) {
      var face = g.faces.map(function (f) { return solids.turn(f.n, yaw, tilt)[2] > EPS; });
      var group = g.groups.map(function () { return false; });
      var point = g.pts.map(function () { return false; });
      g.faces.forEach(function (f, i) {
        if (!face[i]) return;
        group[f.g] = true;
        f.ids.forEach(function (p) { point[p] = true; });
      });
      var edge = g.edges.map(function (e) {
        return g.faces.some(function (f, i) { return face[i] && f.ids.indexOf(e[0]) >= 0 && f.ids.indexOf(e[1]) >= 0; });
      });
      return { face: face, group: group, point: point, v: g.verts.map(function (p) { return point[p]; }), e: edge, f: group };
    },

    /** Rule 4: the lit order as a number and back. */
    encode: function (list) {
      var n = 0, m = 1;
      for (var k = 0; k < list.length; k++) { n += (list[k] + 1) * m; m *= BASE; }
      return n;
    },
    decode: function (n, count) {
      var out = [];
      n = Math.floor(Number(n));
      if (!isFinite(n) || n < 0) return out;
      while (n > 0) {
        var d = n % BASE;
        n = (n - d) / BASE;
        var i = d - 1;
        if (i >= 0 && i < count && out.indexOf(i) < 0) out.push(i);
      }
      return out;
    },

    /** Rule 4: the next item to light: the first seen one not lit, else the first hidden one; -1 when none. */
    next: function (seen, lit) {
      var i;
      for (i = 0; i < seen.length; i++) if (seen[i] && lit.indexOf(i) < 0) return i;
      for (i = 0; i < seen.length; i++) if (lit.indexOf(i) < 0) return i;
      return -1;
    },

    /** Rule 12: a cube when every edge is equal; edges grouped by length, longest first. */
    kindOf: function (box) { return box[0] === box[1] && box[1] === box[2] ? 'cube' : 'cuboid'; },
    edgeGroups: function (box) {
      var out = [];
      box.forEach(function (len) {
        var hit = out.filter(function (x) { return x.len === len; })[0];
        if (hit) hit.n += 4; else out.push({ len: len, n: 4 });
      });
      return out.sort(function (x, y) { return y.len - x.len; });
    },

    /** Rule 10: the six faces' corners at open (0 … 100), the bottom on the table at y = −c/2. */
    unfold: function (box, open) {
      var a = box[0], b = box[1], c = box[2], y0 = -c / 2;
      var al = Math.max(0, Math.min(100, open)) * 0.9 * Math.PI / 180, ca = Math.cos(al), sa = Math.sin(al);
      var c2 = Math.cos(2 * al), s2 = Math.sin(2 * al);
      var X = [-a / 2, a / 2], Z = [-b / 2, b / 2];
      // corners wound so that Newell's normal points out of the closed box (rev: the other way round)
      function side(fn, rev) { var q = [fn(0, 0), fn(1, 0), fn(1, c), fn(0, c)]; return rev ? q.reverse() : q; }
      return {
        bottom: [[X[0], y0, Z[0]], [X[1], y0, Z[0]], [X[1], y0, Z[1]], [X[0], y0, Z[1]]],
        front: side(function (i, y) { return [X[i], y0 + y * ca, b / 2 + y * sa]; }),
        right: side(function (i, y) { return [a / 2 + y * sa, y0 + y * ca, Z[i]]; }, true),
        back: side(function (i, y) { return [X[i], y0 + y * ca, -b / 2 - y * sa]; }, true),
        left: side(function (i, y) { return [-a / 2 - y * sa, y0 + y * ca, Z[i]]; }),
        top: [[0, 0], [0, b], [1, b], [1, 0]].map(function (q) {
          return [X[q[0]], y0 + c * ca + q[1] * s2, -b / 2 - c * sa + q[1] * c2];
        })
      };
    },

    /** Rule 11: the flat net, rectangles [x0, z0, x1, z1] in the table's plane (x right, z towards the viewer). */
    net: function (box) {
      var a = box[0], b = box[1], c = box[2];
      return {
        bottom: [-a / 2, -b / 2, a / 2, b / 2],
        front: [-a / 2, b / 2, a / 2, b / 2 + c],
        back: [-a / 2, -b / 2 - c, a / 2, -b / 2],
        top: [-a / 2, -b / 2 - c - b, a / 2, -b / 2 - c],
        right: [a / 2, -b / 2, a / 2 + c, b / 2],
        left: [-a / 2 - c, -b / 2, -a / 2, b / 2]
      };
    },
    /** Rule 11: each face's sides, longer first. */
    faceSize: function (box, id) {
      var a = box[0], b = box[1], c = box[2];
      var s = id === 'bottom' || id === 'top' ? [a, b] : id === 'front' || id === 'back' ? [a, c] : [b, c];
      return s[0] >= s[1] ? s : [s[1], s[0]];
    }
  };

  var logic = {
    MODES: MODES, SHOWS: SHOWS, SOLID_IDS: SOLID_IDS, NET_IDS: NET_IDS, FACE_IDS: FACE_IDS, SOLIDS: SOLIDS,
    LIT_MAX: LIT_MAX, TURN: TURN, OPEN_STEP: OPEN_STEP, TILT_MIN: TILT_MIN, TILT_MAX: TILT_MAX,
    solids: solids,

    defaults: { mode: 'count', solid: 'cube', show: 'v', lit: 0, yaw: 30, tilt: 20, see: true, open: 0, hide: false },

    PRESETS: [
      { id: 'seen', params: { mode: 'count', solid: 'cube', show: 'v', see: false, hide: true } },
      { id: 'edges', params: { mode: 'count', solid: 'cube', show: 'e' } },
      { id: 'pyramid', params: { mode: 'count', solid: 'pyramid', show: 'f', tilt: 70, hide: true } },
      { id: 'cylinder', params: { mode: 'count', solid: 'cylinder', show: 'e' } },
      { id: 'sphere', params: { mode: 'count', solid: 'sphere', show: 'f' } },
      { id: 'net', params: { mode: 'net', solid: 'cube', tilt: 35 } },
      { id: 'cuboid-net', params: { mode: 'net', solid: 'cuboid', tilt: 35, open: 100 } },
      { id: 'sugar', params: { mode: 'net', solid: 'sugar', tilt: 35, hide: true } }
    ],

    /** Rule 1. */
    clean: function (p) {
      var mode = pick(p.mode, MODES, 'count');
      var solid = pick(p.solid, mode === 'net' ? NET_IDS : SOLID_IDS, 'cube');
      return {
        mode: mode, solid: solid, show: pick(p.show, SHOWS, 'v'),
        lit: p.lit == null || p.lit === '' || typeof p.lit === 'boolean' ? 0 : p.lit,
        yaw: wrap360(p.yaw, 30), tilt: int(p.tilt, TILT_MIN, TILT_MAX, 20),
        see: p.see !== false, open: int(p.open, 0, 100, 0), hide: p.hide === true
      };
    },

    /** The counted items of one kind: their number and which are seen. */
    countState: function (p) {
      var q = logic.clean(p), g = solids.geom(q.solid), sn = solids.seen(g, q.yaw, q.tilt);
      var seen = sn[q.show], N = seen.length;
      var lit = solids.decode(q.lit, N);
      var nSeen = seen.filter(Boolean).length;
      var allSeenLit = seen.every(function (x, i) { return !x || lit.indexOf(i) >= 0; });
      var shapes = {};
      g.groups.forEach(function (gr) { if (gr.flat) shapes[gr.shape] = (shapes[gr.shape] || 0) + 1; });
      var flat = g.groups.filter(function (gr) { return gr.flat; }).length;
      var s = {
        solid: q.solid, show: q.show, yaw: q.yaw, tilt: q.tilt, see: q.see,
        total: N, lit: lit, n: lit.length, seen: seen, nSeen: nSeen, nHidden: N - nSeen,
        done: N > 0 && lit.length === N,
        // rule 5: exactly the seen ones counted, a hidden one not yet
        onlySeen: lit.length < N && nSeen > 0 && lit.length === nSeen && allSeenLit,
        counts: { v: g.verts.length, e: g.edges.length, f: g.groups.length },
        flat: flat, curved: g.groups.length - flat, shapes: shapes, rims: g.rims.length,
        groupShapes: g.groups.map(function (gr) { return gr.shape; })
      };
      // rule 14: the pyramid's four triangles without its square
      s.forgotBase = q.solid === 'pyramid' && q.show === 'f' && lit.indexOf(0) < 0 && [1, 2, 3, 4].every(function (i) { return lit.indexOf(i) >= 0; });
      s.rimNotEdge = q.show === 'e' && g.rims.length > 0;
      if (SOLIDS[q.solid].box) { s.kind = solids.kindOf(SOLIDS[q.solid].box); s.box = SOLIDS[q.solid].box.slice(); }
      return s;
    },

    /** The net: faces' sizes and shapes, the kind, how far open. */
    netState: function (p) {
      var q = logic.clean(p), box = SOLIDS[q.solid].box;
      var faces = FACE_IDS.map(function (id) {
        var sz = solids.faceSize(box, id);
        return { id: id, w: sz[0], h: sz[1], shape: sz[0] === sz[1] ? 'square' : 'rectangle' };
      });
      var squares = faces.filter(function (f) { return f.shape === 'square'; }).length;
      return {
        solid: q.solid, yaw: q.yaw, tilt: q.tilt, see: q.see, open: q.open, flat: q.open === 100,
        box: box.slice(), unit: SOLIDS[q.solid].unit, kind: solids.kindOf(box), edgeGroups: solids.edgeGroups(box),
        faces: faces, squares: squares, rectangles: 6 - squares,
        netSize: [box[0] + 2 * box[2], 2 * box[1] + 2 * box[2]]
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var q = logic.clean(p);
      var s = q.mode === 'count' ? logic.countState(q) : logic.netState(q);
      s.mode = q.mode;
      s.hide = q.hide;
      s.unit = SOLIDS[q.solid].unit;
      // rule 12: the sugar "cube"
      s.sugar = q.solid === 'sugar';
      return s;
    },

    // ── actions: each returns a params patch and what happened ──

    /** Rule 4: light one more. */
    lightNext: function (p) {
      var s = logic.countState(p);
      if (s.total === 0) return { patch: {}, refused: 'none', idx: -1 };
      var i = solids.next(s.seen, s.lit);
      if (i < 0) return { patch: {}, refused: 'all', idx: -1 };
      return { patch: { lit: solids.encode(s.lit.concat([i])) }, refused: null, idx: i, hidden: !s.seen[i] };
    },
    /** Rule 4: a click lights an item, or puts it out. */
    toggle: function (p, i) {
      var s = logic.countState(p);
      if (!(i >= 0 && i < s.total)) return { lit: solids.encode(s.lit) };
      var k = s.lit.indexOf(i);
      var list = k >= 0 ? s.lit.slice(0, k).concat(s.lit.slice(k + 1)) : s.lit.concat([i]);
      return { lit: solids.encode(list) };
    },
    /** Rule 9: turn by d degrees. */
    turnBy: function (p, d) { return { yaw: wrap360(logic.clean(p).yaw + d, 30) }; },
    /** Rule 10: open to the next quarter; refused when open. */
    openMore: function (p) {
      var o = logic.clean(p).open;
      if (o >= 100) return { patch: {}, refused: 'open' };
      return { patch: { open: Math.min(100, (Math.floor(o / OPEN_STEP) + 1) * OPEN_STEP) }, refused: null };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
