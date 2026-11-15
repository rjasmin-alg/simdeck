/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for regex-to-nfa: Thompson construction (Dragon book Algorithm 3.23, concatenation by merging states) and
   subset construction (Algorithm 3.20), one postfix token or one DFA state per step. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No visible strings here: the page words everything from strings.js. */
(function (root) {
  'use strict';

  /** The presets, in key order (1–4). */
  var PRESETS = [
    { id: 'abb', regex: '(a|b)*abb' },
    { id: 'aorb', regex: 'a|b' },
    { id: 'astar', regex: 'a*' },
    { id: 'ana', regex: '(a|b|n)*ana' }
  ];
  var MAX_STEPS = 20;
  var MAX_SYMBOLS = 4;
  var MAX_LENGTH = 24;
  var CAT = '·';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function isSym(c) { return c >= 'a' && c <= 'z' && c.length === 1; }
  function num(a, b) { return a - b; }
  function uniqSorted(xs) {
    var out = xs.slice().sort(num);
    return out.filter(function (x, i) { return i === 0 || x !== out[i - 1]; });
  }

  // ── rule 1: parsing ──

  /** Parse src into a nested tree, or return { error: { code, at, ch } }. Codes: empty, length, char, operand,
      open (a '(' never closed), close (a ')' with no '(' before it). */
  function parseTree(src) {
    if (typeof src !== 'string' || src.length === 0) return { error: { code: 'empty', at: 0, ch: '' } };
    if (src.length > MAX_LENGTH) return { error: { code: 'length', at: MAX_LENGTH, ch: '' } };
    for (var k = 0; k < src.length; k++) {
      var c = src.charAt(k);
      if (!isSym(c) && '|*()'.indexOf(c) < 0) return { error: { code: 'char', at: k, ch: c } };
    }
    var pos = 0, depth = 0;
    function peek() { return pos < src.length ? src.charAt(pos) : null; }
    function fail(code) { throw { code: code, at: pos, ch: peek() || '' }; }
    function union() {
      var n = concat();
      while (peek() === '|') { pos++; n = { op: 'or', kids: [n, concat()] }; }
      return n;
    }
    function concat() {
      var n = star();
      while (peek() !== null && (isSym(peek()) || peek() === '(')) n = { op: 'cat', kids: [n, star()] };
      return n;
    }
    function star() {
      var n = atom();
      while (peek() === '*') { pos++; n = { op: 'star', kids: [n] }; }
      return n;
    }
    function atom() {
      var c = peek();
      if (c === '(') {
        pos++; depth++;
        var n = union();
        if (peek() !== ')') fail('open');
        pos++; depth--;
        return n;
      }
      if (c !== null && isSym(c)) { pos++; return { op: 'sym', sym: c, kids: [] }; }
      if (c === ')' && depth === 0) fail('close');
      fail('operand'); // '|', '*', ')' or the end where an operand must be
    }
    try {
      var tree = union();
      if (pos < src.length) fail(peek() === ')' ? 'close' : 'operand');
      return { tree: tree };
    } catch (e) {
      if (e && e.code) return { error: e };
      throw e;
    }
  }

  /** Flatten a nested tree into postfix order: nodes { op, sym, kids: [token indices] }. */
  function postfixOf(n, out) {
    var kids = n.kids.map(function (k) { return postfixOf(k, out); });
    out.push({ op: n.op, sym: n.sym || null, kids: kids });
    return out.length - 1;
  }

  // ── rule 6: the book's numbering, fixed before the construction ──

  /** Final numbers in pre-order (a node's new start, its operands, its new accept); the right operand of a
      concatenation gets its start from the left one's accept. Nodes that create a start state of their own record it
      in `own`; one that will be merged gets a provisional id (N, N+1, … in postfix order) and an alias. */
  function number(tree) {
    var next = 0, root = tree.length - 1;
    function go(k, given) {
      var n = tree[k];
      if (n.op === 'cat') {
        go(n.kids[0], given);
        go(n.kids[1], tree[n.kids[0]].accept);
        n.start = tree[n.kids[0]].start;
        n.accept = tree[n.kids[1]].accept;
        return;
      }
      if (given == null) n.start = next++;
      else { n.start = given; n.mergeInto = given; }
      n.kids.forEach(function (c) { go(c, null); });
      n.accept = next++;
    }
    go(root, null);
    var alias = {};
    var N = next;
    tree.forEach(function (n) {
      if (n.op === 'cat') { n.own = null; return; }
      if (n.mergeInto != null) { n.own = next; alias[next] = n.mergeInto; next++; delete n.mergeInto; }
      else n.own = n.start;
    });
    return { states: N, alias: alias };
  }

  // ── ε-closure and move (rule 7) ──

  function closure(set, edges) {
    var seen = {}, out = [], todo = set.slice();
    set.forEach(function (x) { seen[x] = true; out.push(x); });
    while (todo.length) {
      var x = todo.pop();
      edges.forEach(function (e) {
        if (e.from === x && e.sym === null && !seen[e.to]) { seen[e.to] = true; out.push(e.to); todo.push(e.to); }
      });
    }
    return uniqSorted(out);
  }

  function move(set, sym, edges) {
    var out = [];
    edges.forEach(function (e) { if (e.sym === sym && set.indexOf(e.from) >= 0) out.push(e.to); });
    return uniqSorted(out);
  }

  function letter(i) { return String.fromCharCode(65 + i); }
  function sameSet(a, b) { return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }

  // ── the model ──

  function regexOf(p) { return typeof p.regex === 'string' ? p.regex : ''; }

  /** The state at step 0 for regex src (no limits checked), or an error state. */
  function start(src) {
    var parsed = parseTree(src);
    if (parsed.error) return { regex: src, phase: 'error', error: parsed.error, ev: null };
    var tree = [];
    postfixOf(parsed.tree, tree);
    var num0 = number(tree);
    var alphabet = uniqSorted(tree.filter(function (n) { return n.op === 'sym'; }).map(function (n) { return n.sym.charCodeAt(0); }))
      .map(function (c) { return String.fromCharCode(c); });
    return {
      regex: src,
      phase: 'thompson',
      tokens: tree.map(function (n) { return n.op === 'sym' ? n.sym : n.op === 'or' ? '|' : n.op === 'star' ? '*' : CAT; }),
      ti: 0,
      tree: tree,
      size: num0.states,
      stack: [],
      nfa: { states: [], edges: [], start: null, accept: null },
      alias: num0.alias,
      alphabet: alphabet,
      dfa: { states: [], trans: {}, unmarked: [], dead: false },
      ev: null
    };
  }

  /** One Thompson step: process token s.ti (rules 2–5). */
  function thompson(s) {
    var k = s.ti, n = s.tree[k], nfa = s.nfa, ev = { kind: n.op, token: k, added: [], edges: [] };
    function add(id) { nfa.states.push(id); ev.added.push(id); }
    function edge(from, sym, to) { var e = { from: from, sym: sym, to: to }; nfa.edges.push(e); ev.edges.push(e); }
    if (n.op === 'sym') {
      add(n.own); add(n.accept);
      edge(n.own, n.sym, n.accept);
      s.stack.push({ node: k, start: n.own, accept: n.accept });
    } else if (n.op === 'or') {
      var t = s.stack.pop(), a = s.stack.pop();
      add(n.own); add(n.accept);
      edge(n.own, null, a.start); edge(n.own, null, t.start);
      edge(a.accept, null, n.accept); edge(t.accept, null, n.accept);
      s.stack.push({ node: k, start: n.own, accept: n.accept });
    } else if (n.op === 'star') {
      var b = s.stack.pop();
      add(n.own); add(n.accept);
      edge(n.own, null, b.start); edge(b.accept, null, b.start);
      edge(b.accept, null, n.accept); edge(n.own, null, n.accept);
      s.stack.push({ node: k, start: n.own, accept: n.accept });
    } else { // cat: merge accept(s) with start(t) (rule 4)
      var r = s.stack.pop(), l = s.stack.pop();
      var gone = r.start, into = l.accept;
      nfa.edges.forEach(function (e) {
        if (e.from === gone) e.from = into;
        if (e.to === gone) e.to = into;
      });
      nfa.states = nfa.states.filter(function (x) { return x !== gone; });
      ev.merged = { gone: gone, into: into };
      s.stack.push({ node: k, start: l.start, accept: r.accept });
    }
    nfa.states.sort(num);
    s.ti++;
    if (s.ti === s.tokens.length) {
      s.phase = 'subset';
      nfa.start = s.stack[0].start;
      nfa.accept = s.stack[0].accept;
    }
    s.ev = ev;
    return s;
  }

  /** One subset-construction step: the first unmarked DFA state, every symbol in alphabetical order (rule 7). */
  function subset(s) {
    var nfa = s.nfa, dfa = s.dfa, first = dfa.states.length === 0;
    function find(set) {
      for (var i = 0; i < dfa.states.length; i++) if (sameSet(dfa.states[i].set, set)) return dfa.states[i].name;
      return null;
    }
    function create(set) {
      var name = letter(dfa.states.length);
      dfa.states.push({ name: name, set: set, accepting: set.indexOf(nfa.accept) >= 0 });
      dfa.unmarked.push(name);
      return name;
    }
    if (first) create(closure([nfa.start], nfa.edges));
    var name = dfa.unmarked.shift();
    var D = dfa.states.filter(function (x) { return x.name === name; })[0];
    var row = {}, moves = [];
    s.alphabet.forEach(function (c) {
      var mv = move(D.set, c, nfa.edges), U = closure(mv, nfa.edges), to = null, isNew = false;
      if (U.length) {
        to = find(U);
        if (to === null) { to = create(U); isNew = true; }
        row[c] = to;
      } else dfa.dead = true;
      moves.push({ sym: c, move: mv, set: U, to: to, isNew: isNew });
    });
    dfa.trans[name] = row;
    if (!dfa.unmarked.length) s.phase = 'done';
    s.ev = { kind: 'row', name: name, set: D.set, first: first, moves: moves };
    return s;
  }

  function step(s0) {
    if (s0.phase === 'error' || s0.phase === 'done') return s0;
    var s = clone(s0);
    return s.phase === 'thompson' ? thompson(s) : subset(s);
  }

  /** Every state of a regex from step 0 to the end (memoised; the states are fresh copies for callers). */
  var runs = Object.create(null); // no prototype: a regex like "constructor" is a key like any other
  function run(src) {
    if (runs[src]) return runs[src];
    var out = [start(src)];
    while (out[out.length - 1].phase !== 'error' && out[out.length - 1].phase !== 'done') out.push(step(out[out.length - 1]));
    runs[src] = out;
    return out;
  }

  /** Is src usable? { ok, steps } or { ok: false, error: { code, at, ch, steps?, symbols? } } (rules 1 and 8). */
  var checks = Object.create(null);
  function check(src) {
    if (checks[src]) return checks[src];
    var s0 = start(src), out;
    if (s0.phase === 'error') out = { ok: false, error: s0.error };
    else if (s0.alphabet.length > MAX_SYMBOLS) out = { ok: false, error: { code: 'symbols', symbols: s0.alphabet.length } };
    else {
      var n = run(src).length - 1;
      out = n > MAX_STEPS ? { ok: false, error: { code: 'steps', steps: n } } : { ok: true, steps: n };
    }
    checks[src] = out;
    return out;
  }

  // ── layout (pure, in grid units; the page scales it) ──

  /** Start state of the fragment of node k as it exists when built (the own id of its leftmost creating node). */
  function startOf(tree, k) { return tree[k].op === 'cat' ? startOf(tree, tree[k].kids[0]) : tree[k].own; }

  /** Layout of the built fragment of node k, its start at (0, 0): { w, up, down, pos: { id: [x, y] }, bend, via }.
      bend['from>to'] = y of the arc's peak (the star's back edge above, its bypass below); via['from>to'] = the
      corner of an elbow (the shorter union branch runs level to the last column, then to the union's accept). */
  function fragLayout(tree, k, startId) {
    var n = tree[k];
    if (startId == null) startId = startOf(tree, k);
    var pos = {}, bend = {}, via = {};
    function put(L, dx, dy) {
      Object.keys(L.pos).forEach(function (id) { pos[id] = [L.pos[id][0] + dx, L.pos[id][1] + dy]; });
      Object.keys(L.bend).forEach(function (key) { bend[key] = L.bend[key] + dy; });
      Object.keys(L.via).forEach(function (key) { via[key] = [L.via[key][0] + dx, L.via[key][1] + dy]; });
    }
    if (n.op === 'sym') {
      pos[startId] = [0, 0]; pos[n.accept] = [1, 0];
      return { w: 1, up: 0.5, down: 0.5, pos: pos, bend: bend, via: via };
    }
    if (n.op === 'cat') {
      var l = fragLayout(tree, n.kids[0], startId), r = fragLayout(tree, n.kids[1], tree[n.kids[0]].accept);
      put(l, 0, 0); put(r, l.w, 0);
      return { w: l.w + r.w, up: Math.max(l.up, r.up), down: Math.max(l.down, r.down), pos: pos, bend: bend, via: via };
    }
    if (n.op === 'or') {
      var a = fragLayout(tree, n.kids[0]), b = fragLayout(tree, n.kids[1]);
      var total = a.up + a.down + b.up + b.down, ya = -total / 2 + a.up, yb = ya + a.down + b.up;
      var w = Math.max(a.w, b.w) + 2;
      pos[startId] = [0, 0]; put(a, 1, ya); put(b, 1, yb); pos[n.accept] = [w, 0];
      var ka = tree[n.kids[0]].accept, kb = tree[n.kids[1]].accept;
      if (a.w < b.w) via[ka + '>' + n.accept] = [w - 1, ya];
      if (b.w < a.w) via[kb + '>' + n.accept] = [w - 1, yb];
      return { w: w, up: total / 2, down: total / 2, pos: pos, bend: bend, via: via };
    }
    // star
    var c = fragLayout(tree, n.kids[0]), cs = startOf(tree, n.kids[0]);
    pos[startId] = [0, 0]; put(c, 1, 0); pos[n.accept] = [c.w + 2, 0];
    bend[tree[n.kids[0]].accept + '>' + cs] = -(c.up + 0.3);
    bend[startId + '>' + n.accept] = c.down + 0.3;
    return { w: c.w + 2, up: c.up + 0.5, down: c.down + 0.5, pos: pos, bend: bend, via: via };
  }

  var GAP = 1; // columns between fragments on the stack

  /** Layout of the NFA as it stands in state s: the stack's fragments left to right, bottom first. */
  function nfaLayout(s) {
    var pos = {}, bend = {}, via = {}, x = 0, up = 0.5, down = 0.5;
    if (!s.tree) return { pos: pos, bend: bend, via: via, w: 0, up: up, down: down };
    s.stack.forEach(function (f, i) {
      var L = fragLayout(s.tree, f.node, f.start);
      if (i) x += GAP;
      Object.keys(L.pos).forEach(function (id) { pos[id] = [L.pos[id][0] + x, L.pos[id][1]]; });
      Object.keys(L.bend).forEach(function (key) { bend[key] = L.bend[key]; });
      Object.keys(L.via).forEach(function (key) { via[key] = [L.via[key][0] + x, L.via[key][1]]; });
      x += L.w;
      up = Math.max(up, L.up); down = Math.max(down, L.down);
    });
    return { pos: pos, bend: bend, via: via, w: x, up: up, down: down };
  }

  /** The shape of NFA edge from → to in a layout, in grid units: a polyline { kind, pts }. 'line' is straight;
      'via' is an elbow (level, then to the union's accept); 'arc' goes straight up (or down) from its start to the
      peak, across, and straight back to its end, so it clears the operand it spans whatever its width (the page
      rounds its corners). */
  function edgeShape(lay, from, to) {
    var a = lay.pos[from], b = lay.pos[to], key = from + '>' + to;
    if (lay.bend[key] != null) return { kind: 'arc', pts: [a, [a[0], lay.bend[key]], [b[0], lay.bend[key]], b] };
    if (lay.via[key]) return { kind: 'via', pts: [a, lay.via[key], b] };
    return { kind: 'line', pts: [a, b] };
  }

  /** The largest NFA box over every step of a regex, so the drawing keeps one scale while it grows. */
  function nfaBox(src) {
    var box = { w: 1, up: 0.5, down: 0.5 };
    run(src).forEach(function (s) {
      var L = nfaLayout(s);
      box.w = Math.max(box.w, L.w); box.up = Math.max(box.up, L.up); box.down = Math.max(box.down, L.down);
    });
    return box;
  }

  /** Parse-tree layout: [x, depth] per token index; leaves left to right, a binary node over the middle of its
      operands, a star over its operand. */
  function treeLayout(tree) {
    var pos = [], leaf = 0, deep = 0;
    function go(k, d) {
      var n = tree[k];
      deep = Math.max(deep, d);
      if (n.op === 'sym') pos[k] = [leaf++, d];
      else {
        n.kids.forEach(function (c) { go(c, d + 1); });
        var xs = n.kids.map(function (c) { return pos[c][0]; });
        pos[k] = [(xs[0] + xs[xs.length - 1]) / 2, d];
      }
    }
    if (tree && tree.length) go(tree.length - 1, 0);
    return { pos: pos, cols: leaf, rows: deep + 1 };
  }

  /** DFA layout on the unit circle in creation order, A on the left, clockwise; the dead state ∅ last if shown. */
  function dfaLayout(names) {
    var pos = {}, n = names.length;
    names.forEach(function (name, i) {
      var a = Math.PI + (n === 1 ? 0 : 2 * Math.PI * i / n);
      pos[name] = [Math.round(Math.cos(a) * 1e6) / 1e6 + 0, Math.round(Math.sin(a) * 1e6) / 1e6 + 0]; // + 0: no −0
    });
    return pos;
  }

  /** The regex text of node k, with the parentheses its place needs: "(a|b)" under a star or in a concatenation. */
  function textOf(tree, k) {
    var n = tree[k];
    function wrap(c, ops) { var x = textOf(tree, c); return ops.indexOf(tree[c].op) >= 0 ? '(' + x + ')' : x; }
    if (n.op === 'sym') return n.sym;
    if (n.op === 'star') return wrap(n.kids[0], ['cat', 'or']) + '*';
    if (n.op === 'cat') return wrap(n.kids[0], ['or']) + wrap(n.kids[1], ['or', 'cat']);
    return textOf(tree, n.kids[0]) + '|' + wrap(n.kids[1], ['or']);
  }

  /** Pairs of DFA states with the same row and the same acceptance: equivalent, so the DFA is not minimal. */
  function sameRows(dfa) {
    var out = [], st = dfa.states;
    for (var i = 0; i < st.length; i++) {
      for (var j = i + 1; j < st.length; j++) {
        var a = dfa.trans[st[i].name], b = dfa.trans[st[j].name];
        if (!a || !b || st[i].accepting !== st[j].accepting) continue;
        if (JSON.stringify(a) === JSON.stringify(b)) out.push([st[i].name, st[j].name]);
      }
    }
    return out;
  }

  var logic = {
    PRESETS: PRESETS,
    MAX_STEPS: MAX_STEPS,
    MAX_SYMBOLS: MAX_SYMBOLS,
    MAX_LENGTH: MAX_LENGTH,
    CAT: CAT,

    defaults: { regex: PRESETS[0].regex, showDead: false },

    /** Steps = tokens + DFA states (a regex that is rejected: 1 step that changes nothing). */
    steps: function (p) { var c = check(regexOf(p)); return c.ok ? c.steps : 1; },

    /** Step 0; a rejected regex (rules 1 and 8) gives { phase: 'error', regex, error }. */
    initial: function (p) {
      var src = regexOf(p), c = check(src);
      return c.ok ? clone(run(src)[0]) : { regex: src, phase: 'error', error: c.error, ev: null };
    },

    step: function (s) { return step(s); },

    regexOf: regexOf,
    textOf: textOf,
    sameRows: sameRows,
    parseTree: parseTree,
    check: check,
    closure: closure,
    move: move,
    run: function (src) { return clone(run(src)); },
    fragLayout: fragLayout,
    nfaLayout: nfaLayout,
    edgeShape: edgeShape,
    nfaBox: nfaBox,
    treeLayout: treeLayout,
    dfaLayout: dfaLayout,
    /** Display label of an NFA state: a provisional (not yet merged) start is the number it merges into, primed. */
    label: function (s, id) { return s.alias && s.alias[id] != null ? s.alias[id] + '′' : String(id); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
