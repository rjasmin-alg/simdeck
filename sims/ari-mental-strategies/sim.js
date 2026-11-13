/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-mental-strategies: a sum or a difference up to 1000 done in the head three ways, each a path of jumps
   on an empty number line from the first number, all landing on the same number: split the second number by place
   (rastavljanje), jump to a round number first, or compensate (stalnost zbroja, stalnost razlike: make the second
   number round, the first gives or takes what it got). Each jump is by place, to or from a round number, or with a
   crossing (prijelaz); the easiest way has the fewest crossings, then the fewest jumps. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic) after numberline.js; node tests require() it. */
(function (root) {
  'use strict';
  var NL = typeof module === 'object' && module.exports ? require('./numberline.js') : root.SimdeckModels['number-line'];

  /** Grade 3 computes with numbers up to 1000 (MAT OŠ A.3.2): every number on a path stays in 0…MAX. */
  var MAX = 1000;
  var OPS = ['add', 'sub'];
  /** The three ways, in the order the page draws them. */
  var WAYS = ['split', 'round', 'comp'];
  /** The jumps shown when nothing is asked: all of them (j is clamped to the longest path). */
  var J_ALL = 9;
  /** The smallest share of an empty line a gap between two marked numbers gets, so a jump of 3 stays visible. */
  var MIN_GAP = 0.08;
  /** Compensation rounds b to a hundred only when the hundred is at most this far; else to a ten. */
  var NEAR = 10;

  function int(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function sgn(op) { return op === 'sub' ? -1 : 1; }
  function valueOf(op, a, b) { return op === 'add' ? a + b : a - b; }
  function fits(op, a, b) {
    if (a < 0 || b < 0 || a > MAX || b > MAX) return false;
    return op === 'add' ? a + b <= MAX : b <= a;
  }
  /** The digits of v (0…9999), ones first. */
  function digits(v) { return [v % 10, Math.floor(v / 10) % 10, Math.floor(v / 100) % 10, Math.floor(v / 1000) % 10]; }

  var logic = {
    MAX: MAX, OPS: OPS, WAYS: WAYS, J_ALL: J_ALL, MIN_GAP: MIN_GAP, NEAR: NEAR,

    defaults: { op: 'add', a: 347, b: 285, j: J_ALL, mistake: false, scale: false },

    /** The presets (SPEC, Presets): the catalogue's example both ways, then one task where each way is the easiest,
        then compensation's typical mistake. */
    PRESETS: [
      { id: 'cat', params: { op: 'add', a: 347, b: 285 } },
      { id: 'back', params: { op: 'sub', a: 632, b: 285 } },
      { id: 'place', params: { op: 'add', a: 432, b: 256 } },
      { id: 'near', params: { op: 'add', a: 398, b: 245 } },
      { id: 'comp', params: { op: 'sub', a: 523, b: 198 } },
      { id: 'wrong', params: { op: 'sub', a: 523, b: 198, mistake: true } }
    ],

    valueOf: valueOf,
    fits: fits,

    /** The task from the params, made valid (rule 1; as ari-constant-difference): whole numbers in 0…MAX, an unknown
        op is a sum; a subtrahend above the minuend is lowered to it; a second addend over MAX − a is lowered to it. */
    numbersOf: function (p) {
      var op = OPS.indexOf(p.op) >= 0 ? p.op : 'add';
      var a = int(p.a, 0, MAX, 0), b = int(p.b, 0, MAX, 0);
      if (op === 'sub' && b > a) b = a;
      if (op === 'add' && a + b > MAX) b = MAX - a;
      return { op: op, a: a, b: b };
    },

    /** The second number split by place (rule 2): its hundreds, tens and ones, largest first, zeros left out
        (1000 is one part). */
    parts: function (b) {
      var out = [];
      var h = b - b % 100, t = b % 100 - b % 10, o = b % 10;
      if (h) out.push(h);
      if (t) out.push(t);
      if (o) out.push(o);
      return out;
    },

    /** The first jump of "to a round number" (rule 3): from a to the nearest hundred in the direction of the jump if
        it is no farther than b; else to the nearest ten that way if no farther than b; else 0. A number that is
        already a hundred (or a ten, for the ten) has none. */
    toRound: function (op, a, b) {
      var up = op === 'add';
      var d100 = up ? (100 - a % 100) % 100 : a % 100;
      if (d100 > 0 && d100 <= b) return d100;
      var d10 = up ? (10 - a % 10) % 10 : a % 10;
      if (d10 > 0 && d10 <= b) return d10;
      return 0;
    },

    /** The round number compensation makes of b (rule 4): the nearest hundred when it is at most NEAR away (and not
        0), else the nearest ten, both half up; below 10, b itself (nothing to compensate). */
    roundOf: function (b) {
      if (b < 10) return b;
      var hd = Math.floor((b + 50) / 100) * 100;
      if (hd > 0 && Math.abs(hd - b) <= NEAR) return hd;
      return Math.floor((b + 5) / 10) * 10;
    },

    /** The signed jump sizes of each way (rules 2–4), and compensation's shift. A way whose path would leave 0…MAX
        has out: true and no jumps. */
    sizes: function (op, a, b, way, mistake) {
      var s = sgn(op);
      if (way === 'split') return { sizes: logic.parts(b).map(function (x) { return s * x; }) };
      if (way === 'round') {
        var d = logic.toRound(op, a, b);
        var rest = logic.parts(b - d).map(function (x) { return s * x; });
        return { sizes: d ? [s * d].concat(rest) : rest };
      }
      // compensation: b grows by k to the round number R, so a moves by k the other way in a sum, the same way in a
      // difference (stalnost zbroja, stalnost razlike), then R split by place; the mistake moves a the wrong way.
      // When that order leaves 0…MAX, the round jumps go first and the shift last ('fix'); when both do, out.
      var R = logic.roundOf(b), k = R - b;
      var shift = (op === 'add' ? -k : k) * (mistake ? -1 : 1);
      var jumpsR = logic.parts(R).map(function (x) { return s * x; });
      var first = shift ? [shift].concat(jumpsR) : jumpsR;
      var over = logic.leaves(a, first);
      var order = 'shift', sz = first;
      if (over != null) {
        var second = shift ? jumpsR.concat([shift]) : jumpsR;
        order = logic.leaves(a, second) == null ? 'fix' : 'out';
        sz = order === 'fix' ? second : [];
      }
      return { sizes: sz, k: k, R: R, shift: shift, a1: a + shift, order: order, over: over, out: order === 'out' };
    },

    /** The first number a path from a by the sizes lands on outside 0…MAX, or null when it stays inside. */
    leaves: function (a, sizes) {
      var x = a;
      for (var i = 0; i < sizes.length; i++) { x += sizes[i]; if (x < 0 || x > MAX) return x; }
      return null;
    },

    /** What a jump from x by s is like (rule 5): 'place' when no digit carries or borrows (only the places of s
        change); else 'round' when it lands on or leaves a multiple of the place above s's largest place (a complement,
        347 + 53 = 400, 400 − 53 = 347); else 'cross' (prijelaz: it passes a ten or a hundred). */
    kindOf: function (x, s) {
      var y = x + s, m = Math.abs(s);
      var dx = digits(x), dm = digits(m), free = true, i;
      for (i = 0; i < 4; i++) {
        if (s > 0 && dx[i] + dm[i] > 9) free = false;
        if (s < 0 && dx[i] < dm[i]) free = false;
      }
      if (free) return 'place';
      var p = 1;
      while (p * 10 <= m) p *= 10;
      var next = p * 10;
      return y % next === 0 || x % next === 0 ? 'round' : 'cross';
    },

    /** A path: the jumps from a by the sizes, each { from, to, size, dir, kind }. */
    path: function (a, sizes) {
      var x = a;
      return sizes.map(function (s) {
        var j = NL.jump(x, x + s);
        j.kind = logic.kindOf(x, s);
        x += s;
        return j;
      });
    },

    /** Positions on an empty number line (rule 7): the marked numbers in order, each gap at least minGap of the line
        (default MIN_GAP), the rest shared in proportion; [[v, x], …] with x from 0 to 1. One number sits at 0.5. */
    emptyScale: function (values, minGap) {
      var g = minGap == null ? MIN_GAP : minGap;
      var vs = values.slice().sort(function (p, q) { return p - q; }).filter(function (v, i, arr) { return i === 0 || v !== arr[i - 1]; });
      if (vs.length === 1) return [[vs[0], 0.5]];
      var total = vs[vs.length - 1] - vs[0];
      var w = [];
      for (var i = 1; i < vs.length; i++) w.push(Math.max((vs[i] - vs[i - 1]) / total, g));
      var sum = w.reduce(function (p, q) { return p + q; }, 0);
      var out = [[vs[0], 0]], x = 0;
      for (i = 1; i < vs.length; i++) { x += w[i - 1] / sum; out.push([vs[i], i === vs.length - 1 ? 1 : x]); }
      return out;
    },

    /** Where v sits (0…1) on a line: an empty one ({ kind: 'empty', pts }, between two marked numbers in proportion)
        or one to scale ({ kind: 'scale', view }). */
    xOf: function (line, v) {
      if (line.kind === 'scale') return NL.pos(v, line.view);
      var pts = line.pts;
      if (v <= pts[0][0]) return pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        if (v <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (v - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      }
      return pts[pts.length - 1][1];
    },

    /** Everything the page shows (an explorer: one state; j is how many jumps of each path are drawn). */
    initial: function (p) {
      var n = logic.numbersOf(p), op = n.op, a = n.a, b = n.b, r = valueOf(op, a, b);
      var mistake = !!p.mistake;
      var ways = WAYS.map(function (id) {
        var z = logic.sizes(op, a, b, id, id === 'comp' && mistake);
        var jumps = logic.path(a, z.sizes);
        var end = jumps.length ? jumps[jumps.length - 1].to : a;
        var w = {
          id: id, jumps: jumps, end: end, ok: !z.out && end === r, out: !!z.out,
          count: jumps.length,
          cross: jumps.filter(function (x) { return x.kind === 'cross'; }).length,
          round: jumps.filter(function (x) { return x.kind === 'round'; }).length
        };
        if (id === 'comp') { w.k = z.k; w.R = z.R; w.shift = z.shift; w.a1 = z.a1; w.order = z.order; w.over = z.over; w.mistake = mistake; }
        return w;
      });
      var jmax = Math.max.apply(null, ways.map(function (w) { return w.count; }));
      var j = int(p.j, 0, jmax, jmax);
      // the easiest (rule 6): among the ways that land right, the fewest crossings, then the fewest jumps; ties all,
      // but none when every way that lands right ties (nothing to choose)
      var live = ways.filter(function (w) { return w.ok; });
      var key = function (w) { return w.cross * 100 + w.count; };
      var best = live.length ? Math.min.apply(null, live.map(key)) : null;
      var nBest = live.filter(function (w) { return key(w) === best; }).length;
      ways.forEach(function (w) {
        w.best = w.ok && key(w) === best && nBest < live.length;
        w.shown = Math.min(j, w.count);
        w.done = w.shown === w.count;
        w.at = w.shown ? w.jumps[w.shown - 1].to : a;
      });
      // one line for all three, so the same number sits at the same place on each (rule 7)
      var marks = [a, r];
      ways.forEach(function (w) { w.jumps.forEach(function (x) { marks.push(x.to); }); });
      var line = p.scale
        ? { kind: 'scale', view: NL.view(marks, { maxTicks: 10, pad: 0.04, minSpan: 10, ceil: MAX }) }
        : { kind: 'empty', pts: logic.emptyScale(marks) };
      return { op: op, a: a, b: b, r: r, j: j, jmax: jmax, done: j === jmax, mistake: mistake, ways: ways, line: line };
    },

    /** The task field (as ari-constant-difference): "347 + 285", "632-285", spaces anywhere, − or - or –, one "=" at
        the end ignored. { task: { op, a, b } } or { error }: empty, op, num, big, neg, sum. */
    parseTask: function (text) {
      var s = String(text == null ? '' : text).replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/=$/, '');
      if (!s) return { error: 'empty' };
      var ops = s.match(/[+-]/g);
      if (!ops || ops.length !== 1) return { error: 'op' };
      var op = ops[0] === '+' ? 'add' : 'sub';
      var parts = s.split(/[+-]/);
      if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return { error: 'num' };
      var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10);
      if (a > MAX || b > MAX) return { error: 'big' };
      if (op === 'sub' && b > a) return { error: 'neg' };
      if (op === 'add' && a + b > MAX) return { error: 'sum' };
      return { task: { op: op, a: a, b: b } };
    },

    taskText: function (n) { return n.a + (n.op === 'add' ? ' + ' : ' − ') + n.b; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
