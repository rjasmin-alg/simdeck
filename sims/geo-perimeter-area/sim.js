/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-perimeter-area: the perimeter (opseg, o) is the length of the edge around a shape, counted in the
   sides of unit squares on its edge; the area (površina, P) is the number of unit squares it covers. They are
   different things: twelve unit squares make rectangles 1 × 12, 2 × 6 and 3 × 4 with the same area and perimeters
   26, 16 and 14. Counted, never by a formula (MAT OŠ D.3.3, D.4.2). Three modes on one squared-paper plane (one
   square = 1 cm): colour squares (paint), the same n squares as every rectangle (twelve), walk around the edge (walk).
   Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after paper.js (the squared-paper model, copied from sims/geo-lines/paper.js @ 132bf88); node
   tests require() it. */
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./paper.js') : root.SimdeckModels['squared-paper'];

  /** The paper: 24 × 12 squares of 1 cm; square [x, y] has its lower-left corner at (x, y), y grows upwards. */
  var W = 24, H = 12;
  var BOX = { x0: 0, y0: 0, x1: W - 1, y1: H - 1 }; // the squares' lower-left corners that lie on the paper
  var MODES = ['paint', 'twelve', 'walk'];
  /** Mode twelve: how many squares; up to 20, so even 1 × n leaves two squares each side for the sides' labels. */
  var N_MIN = 1, N_MAX = 20;
  /** The four sides of a square, walked with the square on the left (anticlockwise): bottom, right, top, left. */
  var SIDES = [
    { d: [1, 0], from: [0, 0], nb: [0, -1] },
    { d: [0, 1], from: [1, 0], nb: [1, 0] },
    { d: [-1, 0], from: [1, 1], nb: [0, 1] },
    { d: [0, -1], from: [0, 1], nb: [-1, 0] }
  ];

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function key(x, y) { return x + ',' + y; }

  /* ── unit squares on squared paper: the part of this model meant for models/squared-paper.js (catalogue §5.27;
        NOTES.md, Shared requests). Pure functions over plain data, no strings. A shape is a list of squares [x, y]. ── */
  var area = {
    /** Rule 1: the squares on the paper, each once, in reading order (top row first, left to right). Anything that is
        not a pair of whole numbers on the paper is dropped. */
    norm: function (cells) {
      var seen = {}, out = [];
      (Array.isArray(cells) ? cells : []).forEach(function (c) {
        if (!Array.isArray(c) || c.length !== 2) return;
        var x = c[0], y = c[1];
        if (typeof x !== 'number' || typeof y !== 'number' || x !== Math.floor(x) || y !== Math.floor(y)) return;
        if (!G.cornerIn([x, y], BOX)) return;
        var k = key(x, y);
        if (seen[k]) return;
        seen[k] = true;
        out.push([x + 0, y + 0]);
      });
      return out.sort(function (a, b) { return b[1] - a[1] || a[0] - b[0]; });
    },

    /** A set of the squares, for lookups. */
    set: function (cells) { var s = {}; cells.forEach(function (c) { s[key(c[0], c[1])] = true; }); return s; },

    /** Rule 2: the edge (rub) is every side of a coloured square whose neighbour across it is not coloured (off the
        paper counts as not coloured). Each side is walked with its square on the left, so the outer edge runs
        anticlockwise and the edge of a hole clockwise. Returns [{ from, to, d, cell, side }] in the squares' order. */
    edges: function (cells) {
      var s = area.set(cells), out = [];
      cells.forEach(function (c) {
        SIDES.forEach(function (sd, i) {
          if (s[key(c[0] + sd.nb[0], c[1] + sd.nb[1])]) return;
          var f = [c[0] + sd.from[0], c[1] + sd.from[1]];
          out.push({ from: f, to: [f[0] + sd.d[0], f[1] + sd.d[1]], d: sd.d, cell: c, side: i });
        });
      });
      return out;
    },

    /** Rule 3: the shapes (likovi): squares joined by a whole side make one shape; squares that touch only at a corner
        are two. Shapes in the reading order of their first square. Returns lists of squares, each in reading order. */
    pieces: function (cells) {
      var s = area.set(cells), done = {}, out = [];
      cells.forEach(function (c) {
        if (done[key(c[0], c[1])]) return;
        var piece = [], stack = [c];
        done[key(c[0], c[1])] = true;
        while (stack.length) {
          var q = stack.pop();
          piece.push(q);
          SIDES.forEach(function (sd) {
            var n = [q[0] + sd.nb[0], q[1] + sd.nb[1]], k = key(n[0], n[1]);
            if (s[k] && !done[k]) { done[k] = true; stack.push(n); }
          });
        }
        out.push(area.norm(piece));
      });
      return out;
    },

    /** Rule 4: the walk around the edge. Each shape in turn; a shape's walk starts at the lower-left corner of its
        lowest, leftmost square, along that square's bottom side (anticlockwise). At every corner the walk takes the
        side that turns left, else straight on, else right: so it stays with the square it walks along, and where two
        squares meet only at a corner it does not cross over. When a loop closes and the shape still has unwalked
        edge (a hole), the walk goes on from its lowest, leftmost unwalked side. Returns
        [{ from, to, d, cell, piece, loop, n }] where n counts the sides of that shape's edge from 1 and loop is 0 for
        its outer edge, 1, 2 … for the edges of its holes. */
    walk: function (cells) {
      var out = [];
      area.pieces(cells).forEach(function (piece, pi) {
        var es = area.edges(piece), from = {};
        es.forEach(function (e) { (from[key(e.from[0], e.from[1])] = from[key(e.from[0], e.from[1])] || []).push(e); });
        var left = es.slice().sort(function (a, b) { return a.from[1] - b.from[1] || a.from[0] - b.from[0] || a.side - b.side; });
        var used = new Set(), n = 0, loop = -1;
        left.forEach(function (start) {
          if (used.has(start)) return;
          var e = start;
          loop++;
          do {
            used.add(e);
            out.push({ from: e.from, to: e.to, d: e.d, cell: e.cell, piece: pi, loop: loop, n: ++n });
            var d = e.d, prefs = [[-d[1], d[0]], d, [d[1], -d[0]]];
            var outs = from[key(e.to[0], e.to[1])] || [];
            var next = null;
            for (var i = 0; i < 3 && !next; i++) {
              for (var j = 0; j < outs.length; j++) if (outs[j].d[0] === prefs[i][0] && outs[j].d[1] === prefs[i][1]) { next = outs[j]; break; }
            }
            e = next;
          } while (e && !used.has(e));
        });
      });
      return out;
    },

    /** Rule 5: the area P (squares) and the perimeter o (sides on the edge) of a shape, its holes (loops of its edge
        past the first), and the squares that touch the edge (the count of the typical mistake). */
    measure: function (cells) {
      var es = area.edges(cells), onEdge = {};
      es.forEach(function (e) { onEdge[key(e.cell[0], e.cell[1])] = true; });
      var w = area.walk(cells), loops = 0;
      w.forEach(function (e, i) { if (i === 0 || e.piece !== w[i - 1].piece || !same(e.from, w[i - 1].to)) loops++; });
      return { P: cells.length, o: es.length, edgeCells: Object.keys(onEdge).length, loops: loops };
    },

    /** Rule 6: what colouring (or erasing) one square does: P by 1, o by 4 − 2k where k is the number of its sides
        it shares with coloured squares (each shared side leaves the edge, each free side joins it). */
    toggle: function (cells, c) {
      var s = area.set(cells), had = !!s[key(c[0], c[1])], k = 0;
      SIDES.forEach(function (sd) { if (s[key(c[0] + sd.nb[0], c[1] + sd.nb[1])]) k++; });
      var dO = 4 - 2 * k;
      return had ? { add: false, dP: -1, dO: 0 - dO, shared: k } : { add: true, dP: 1, dO: dO, shared: k };
    },

    /** A rectangle of a × b squares with its lower-left corner at (x0, y0), in reading order. */
    rect: function (a, b, x0, y0) {
      var out = [];
      for (var y = y0 + b - 1; y >= y0; y--) for (var x = x0; x < x0 + a; x++) out.push([x, y]);
      return out;
    },

    /** Rule 7: every rectangle of n squares, short side b first: b ≤ a, a · b = n, b from 1 up. */
    rects: function (n) {
      var out = [];
      for (var b = 1; b * b <= n; b++) if (n % b === 0) out.push({ b: b, a: n / b });
      return out;
    },

    /** A shape from a picture: rows top to bottom, '#' a coloured square; the lower-left square of the picture at
        (x0, y0). For readable presets and tests. */
    fromRows: function (rows, x0, y0) {
      var out = [];
      rows.forEach(function (row, i) {
        for (var j = 0; j < row.length; j++) if (row[j] === '#') out.push([x0 + j, y0 + rows.length - 1 - i]);
      });
      return area.norm(out);
    }
  };
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }

  /** The shapes of the presets. */
  var SHAPES = {
    eight: area.fromRows(['###.', '####', '.#..'], 10, 5),
    notch: area.fromRows(['##.', '###', '###'], 10, 4),
    sameO: area.norm(area.fromRows(['#####'], 3, 6).concat(area.fromRows(['###', '###', '###'], 15, 4))),
    rect34: area.rect(4, 3, 10, 4),
    u: area.fromRows(['#..#', '#..#', '####'], 10, 4)
  };

  /** The squares in the URL: one hexadecimal number per row, bottom row first, bit x for square x; rows joined by
      '.' and trailing empty rows dropped. '' is no squares. */
  function encode(cells) {
    var rows = [];
    for (var y = 0; y < H; y++) rows.push(0);
    area.norm(cells).forEach(function (c) { rows[c[1]] += Math.pow(2, c[0]); });
    while (rows.length && rows[rows.length - 1] === 0) rows.pop();
    return rows.map(function (r) { return r.toString(16); }).join('.');
  }
  function decode(str) {
    var out = [];
    if (typeof str !== 'string' || !/^[0-9a-f.]*$/.test(str)) return out;
    str.split('.').slice(0, H).forEach(function (hx, y) {
      var r = hx === '' ? 0 : parseInt(hx, 16);
      for (var x = 0; x < W; x++) if (Math.floor(r / Math.pow(2, x)) % 2 === 1) out.push([x, y]);
    });
    return area.norm(out);
  }

  var logic = {
    W: W, H: H, MODES: MODES, N_MIN: N_MIN, N_MAX: N_MAX,
    area: area, SHAPES: SHAPES, encode: encode, decode: decode,

    defaults: {
      mode: 'paint', cells: SHAPES.eight, n: 12, b: 1, seen: 0, k: 0, hide: false
    },

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'eight', params: { mode: 'paint', cells: SHAPES.eight, hide: true } },
      { id: 'notch', params: { mode: 'paint', cells: SHAPES.notch } },
      { id: 'same-perimeter', params: { mode: 'paint', cells: SHAPES.sameO } },
      { id: 'twelve', params: { mode: 'twelve', n: 12, b: 1, seen: 0, hide: true } },
      { id: 'sixteen', params: { mode: 'twelve', n: 16, b: 4, seen: 0 } },
      { id: 'walk', params: { mode: 'walk', cells: SHAPES.rect34, k: 0 } },
      { id: 'walk-u', params: { mode: 'walk', cells: SHAPES.u, k: 0 } },
      { id: 'blank', params: { mode: 'paint', cells: [] } }
    ],

    // ── mode 'paint': colour squares and watch P and o ──
    paint: function (p) {
      var cells = area.norm(p.cells);
      var m = area.measure(cells);
      var pieces = area.pieces(cells).map(function (pc) {
        var mm = area.measure(pc);
        return { cells: pc, P: mm.P, o: mm.o, holes: mm.loops - 1 };
      });
      return {
        cells: cells, P: m.P, o: m.o, edgeCells: m.edgeCells, edges: area.edges(cells),
        pieces: pieces, holes: pieces.reduce(function (t, pc) { return t + pc.holes; }, 0)
      };
    },

    // ── mode 'twelve': the same n squares as every rectangle; P stays, o changes ──
    twelve: function (p, hide) {
      var n = int(p.n, N_MIN, N_MAX, 12);
      var rs = area.rects(n);
      // rule 7 (tie-break): b is a short side of a rectangle of n squares: the largest one not above the asked b
      var want = int(p.b, 1, N_MAX, 1), i = 0;
      rs.forEach(function (r, j) { if (r.b <= want) i = j; });
      var list = rs.map(function (r) {
        var c = area.rect(r.a, r.b, 0, 0), m = area.measure(c);
        return { b: r.b, a: r.a, P: m.P, o: m.o, sides: [r.a, r.b, r.a, r.b] };
      });
      var cur = list[i];
      // the rectangle lies on the paper, long side along it, in the middle
      var x0 = Math.floor((W - cur.a) / 2), y0 = Math.floor((H - cur.b) / 2);
      var all = (1 << list.length) - 1;
      // rule 8: a rectangle counts as built (its row of the table filled) once its o has been shown
      var seen = (int(p.seen, 0, 15, 0) | (hide ? 0 : 1 << i)) & all;
      var os = list.map(function (r) { return r.o; });
      return {
        n: n, b: cur.b, a: cur.a, idx: i, rects: list, P: cur.P, o: cur.o, sides: cur.sides,
        cells: area.rect(cur.a, cur.b, x0, y0), x0: x0, y0: y0, edges: area.edges(area.rect(cur.a, cur.b, x0, y0)),
        seen: seen, allSeen: seen === all, oMin: Math.min.apply(null, os), oMax: Math.max.apply(null, os),
        square: cur.a === cur.b
      };
    },

    // ── mode 'walk': walk around the edge and count its sides ──
    walk: function (p) {
      var cells = area.norm(p.cells);
      var w = area.walk(cells), o = w.length;
      var k = int(p.k, 0, o, 0);
      var pieces = area.pieces(cells).map(function (pc) { var m = area.measure(pc); return { P: m.P, o: m.o, holes: m.loops - 1 }; });
      var cur = k < o ? w[k] : w[o - 1];
      return {
        cells: cells, P: cells.length, o: o, k: k, done: k === o, path: w,
        at: o ? (k < o ? w[k].from : w[o - 1].to) : null,
        next: k < o ? w[k] : null,
        piece: cur ? cur.piece : 0,
        // how far into the current shape, and its whole edge (a shape's o)
        pieceN: k === 0 ? 0 : w[k - 1].n,
        // the shape of the last side walked (the one pieceN counts)
        lastPiece: k === 0 ? 0 : w[k - 1].piece,
        pieceDone: k > 0 && (k === o || w[k].piece !== w[k - 1].piece),
        // the walk has just jumped to the edge of a hole (a new loop of the same shape)
        jump: k > 0 && k < o && w[k].piece === w[k - 1].piece && !same(w[k].from, w[k - 1].to),
        // walking round a hole: the last side walked is on a hole's edge
        inHole: k > 0 && w[k - 1].loop > 0,
        pieces: pieces, edgeCells: area.measure(cells).edgeCells,
        holes: pieces.reduce(function (t, pc) { return t + pc.holes; }, 0)
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'paint');
      // rule 9: asking first hides o and P (paint) or the rectangle's o (twelve); the walk counts as it goes
      var hide = mode !== 'walk' && p.hide === true;
      var s = mode === 'paint' ? logic.paint(p) : mode === 'twelve' ? logic.twelve(p, hide) : logic.walk(p);
      s.mode = mode;
      s.hide = hide;
      // rule 10: o and P can be the same number and still differ: cm against cm² (4 × 4: o = 16 cm, P = 16 cm²);
      // only for one shape (a sum over shapes is no shape's perimeter)
      s.sameNumber = s.P > 0 && s.o === s.P && (!s.pieces || s.pieces.length === 1);
      return s;
    },

    /** The square under a point of the paper (x, y real): what a click colours. Kept on the paper. */
    cellAt: function (x, y) {
      return [Math.min(W - 1, Math.max(0, Math.floor(x))), Math.min(H - 1, Math.max(0, Math.floor(y)))];
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
