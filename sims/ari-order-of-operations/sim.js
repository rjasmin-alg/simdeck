/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-order-of-operations: an expression with several operations, worked out in the agreed order (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The expression is a text param; parse() turns it into tokens (the columns of the drawing) and a tree of nodes;
   planOf() fixes the order the operations are done in (rules 1–5) and the value of each; the step function walks
   that order, two steps per operation: pick it (which rule chose it), then do it (the node folds into its value).
   The typical mistake is the same text parsed with every operation of equal rank ("strictly left to right").
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MAX_DIGITS = 4;        // each number typed: 0 … 9999
  var MAX_NUMBERS = 7;       // at most 6 operations, 12 steps
  var MAX_VALUE = 99999;     // every value on the way, and the result
  var MAX_BRACKET_NUMBERS = 4; // the bracket buttons are offered for 2 to 4 numbers
  var MINUS = '−', DOT = '·';

  var SIGN = { '+': '+', '-': MINUS, '*': DOT, ':': ':' };
  var RANK = { '*': 0, ':': 0, '+': 1, '-': 1 };

  // ── tokens ──

  /** Characters to tokens. Returns { tokens } or { error, at } (at: 1-based character). */
  function tokenize(text) {
    var s = String(text == null ? '' : text), out = [], i = 0;
    var opOf = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '·': '*', '⋅': '*', '×': '*',
      'x': '*', 'X': '*', '•': '*', ':': ':', '/': ':', '÷': ':' };
    while (i < s.length) {
      var ch = s.charAt(i);
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9]/.test(ch)) {
        var j = i;
        while (j < s.length && /[0-9]/.test(s.charAt(j))) j++;
        if (j - i > MAX_DIGITS) return { error: 'long', at: i + 1 };
        var digits = s.slice(i, j).replace(/^0+(?=\d)/, '');
        out.push({ t: 'num', v: Number(digits), at: i + 1 });
        i = j;
        continue;
      }
      if (opOf[ch]) { out.push({ t: 'op', op: opOf[ch], at: i + 1 }); i++; continue; }
      if (ch === '(' || ch === ')') { out.push({ t: ch, at: i + 1 }); i++; continue; }
      return { error: 'char', at: i + 1, ch: ch };
    }
    if (!out.length) return { error: 'empty', at: 0 };
    return { tokens: out };
  }

  // ── the tree ──

  /** Parse text into { ok, tokens, nodes, root, numbers, ops } or { ok: false, error, at }.
      Rule 2 is in the grammar: a term is factors joined by · and :, an expression is terms joined by + and −, both
      left-associative (rule 3). opts.flat (the typical mistake): every operation has one rank, still left to right,
      and brackets still group. Nodes: { id, kind: 'num' | 'op', v, op, a, b, tok, br, open, close }. */
  function parse(text, opts) {
    var flat = !!(opts && opts.flat);
    var T = tokenize(text);
    if (T.error) return { ok: false, error: T.error, at: T.at, ch: T.ch };
    var src = T.tokens, i = 0, nodes = [], tokens = [];
    var count = src.filter(function (x) { return x.t === 'num'; }).length;
    if (count > MAX_NUMBERS) return { ok: false, error: 'many', at: 0 };

    function fail(error, tok) { throw { parseError: error, at: tok ? tok.at : 0 }; }
    function peek() { return src[i]; }
    function emit(tok) { tokens.push(Object.assign({}, tok)); return tokens.length - 1; }

    function factor() {
      var tok = peek();
      if (!tok || tok.t === 'op' || tok.t === ')') fail('number', tok);
      if (tok.t === 'num') {
        i++;
        var tix = emit({ t: 'num', v: tok.v });
        nodes.push({ id: nodes.length, kind: 'num', v: tok.v, tok: tix, br: 0 });
        return nodes.length - 1;
      }
      // '('
      var openTok = tok;
      i++;
      var openIx = emit({ t: '(' });
      var inner = expr();
      var close = peek();
      if (!close || close.t !== ')') {
        if (close && close.t !== 'op') fail('sign', close);
        fail('open', openTok);
      }
      i++;
      var closeIx = emit({ t: ')' });
      var n = nodes[inner];
      if (n.kind === 'num') fail('lone', openTok);
      n.br++;
      // the outermost pair of this node: the first open and the last close around it
      n.open = openIx;
      n.close = closeIx;
      tokens[openIx].node = inner;
      tokens[closeIx].node = inner;
      return inner;
    }
    function chain(next, ops) {
      var left = next();
      for (;;) {
        var tok = peek();
        if (!tok || tok.t !== 'op' || ops.indexOf(tok.op) < 0) return left;
        i++;
        var tix = emit({ t: 'op', op: tok.op });
        var right = next();
        nodes.push({ id: nodes.length, kind: 'op', op: tok.op, a: left, b: right, tok: tix, br: 0 });
        tokens[tix].node = nodes.length - 1;
        left = nodes.length - 1;
      }
    }
    function term() { return chain(factor, ['*', ':']); }
    function expr() { return flat ? chain(factor, ['*', ':', '+', '-']) : chain(term, ['+', '-']); }

    try {
      var rootId = expr();
      var rest = peek();
      if (rest) {
        if (rest.t === ')') fail('close', rest);
        fail('sign', rest); // a number or '(' right after a number or ')'
      }
      tokens.forEach(function (tk, ix) { if (tk.t === 'num') tk.node = nodes.filter(function (n) { return n.kind === 'num' && n.tok === ix; })[0].id; });
      if (nodes[rootId].kind === 'num') return { ok: false, error: 'single', at: 0 };
      // a node's tokens run from its first to its last token: record them for the drawing and the written form
      nodes.forEach(function (n) { var r = spanOf(nodes, n.id); n.from = r[0]; n.to = r[1]; });
      return { ok: true, flat: flat, tokens: tokens, nodes: nodes, root: rootId,
        numbers: tokens.filter(function (x) { return x.t === 'num'; }).length,
        ops: nodes.filter(function (n) { return n.kind === 'op'; }).length };
    } catch (e) {
      if (e && e.parseError) return { ok: false, error: e.parseError, at: e.at };
      throw e;
    }
  }

  /** The first and last token of a node, its brackets included. */
  function spanOf(nodes, id) {
    var n = nodes[id];
    if (n.br) return [n.open, n.close];
    if (n.kind === 'num') return [n.tok, n.tok];
    return [spanOf(nodes, n.a)[0], spanOf(nodes, n.b)[1]];
  }

  function inSubtree(nodes, top, id) {
    if (top === id) return true;
    var n = nodes[top];
    return n.kind === 'op' && (inSubtree(nodes, n.a, id) || inSubtree(nodes, n.b, id));
  }
  function opsUnder(nodes, top) {
    var n = nodes[top];
    if (n.kind !== 'op') return [];
    return opsUnder(nodes, n.a).concat([top], opsUnder(nodes, n.b));
  }

  /** Rule 4: one operation of whole numbers, or why it cannot be done at this level. */
  function apply(a, op, b) {
    if (op === '+') return a + b > MAX_VALUE ? { error: 'big' } : { v: a + b };
    if (op === '-') return a < b ? { error: 'negative' } : { v: a - b };
    if (op === '*') return a * b > MAX_VALUE ? { error: 'big' } : { v: a * b };
    if (b === 0) return { error: 'zero' };
    return a % b ? { error: 'notWhole' } : { v: a / b };
  }

  /** Rule 1 and 2: the operation to do next, given the done ones; null when all are done.
      The group is the leftmost innermost bracket not yet done (rule 1, tie-break 1), or the whole expression. In it,
      · and : before + and − (rule 2; in flat mode one rank), and of equal rank the leftmost (rule 3). */
  function pickNext(tree, done) {
    var nodes = tree.nodes;
    var isDone = function (id) { return done.indexOf(id) >= 0; };
    var pending = nodes.filter(function (n) { return n.kind === 'op' && n.br > 0 && !isDone(n.id); });
    var innermost = pending.filter(function (g) {
      return !pending.some(function (o) { return o.id !== g.id && inSubtree(nodes, g.id, o.id); });
    }).sort(function (x, y) { return x.open - y.open; });
    var group = innermost.length ? innermost[0].id : tree.root;
    var cands = opsUnder(nodes, group).filter(function (id) { return !isDone(id); });
    if (!cands.length) return null;
    var rank = function (id) { return tree.flat ? 0 : RANK[nodes[id].op]; };
    var best = cands.slice().sort(function (x, y) { return rank(x) - rank(y) || nodes[x].tok - nodes[y].tok; })[0];
    var bn = nodes[best];
    // the token after the right operand, inside the group: an operation of the same rank means "left to right" decided
    var after = tree.tokens[nodes[bn.b].to + 1];
    var nextSame = !!(after && after.t === 'op' && inSubtree(nodes, group, after.node) && rank(after.node) === rank(best));
    return {
      id: best,
      group: innermost.length ? group : null,
      rank: tree.flat ? (RANK[bn.op] ? 'add' : 'mul') : (rank(best) ? 'add' : 'mul'),
      // another operation of the same rank still waits to the right in the group: left to right chose this one
      ltr: cands.some(function (id) { return id !== best && rank(id) === rank(best) && nodes[id].tok > bn.tok; }),
      nextSame: nextSame,
      // an operation of the lower rank to the left in the group was passed over (rule 2 over reading order)
      skipped: cands.some(function (id) { return rank(id) > rank(best) && nodes[id].tok < bn.tok; }),
      // an operation of the lower rank waits anywhere in the group: rule 2 chose this one over it
      waits: cands.some(function (id) { return rank(id) > rank(best); }),
      // more than one bracket waits: the leftmost was chosen (tie-break 1)
      brackets: innermost.length
    };
  }

  /** The whole order: each operation with its operands, its value and the rule that picked it. When an operation
      cannot be done (rule 4) the plan stops there: { stuck: { id, a, op, b, error } }. */
  function planOf(tree) {
    var vals = {}, done = [], order = [];
    tree.nodes.forEach(function (n) { if (n.kind === 'num') vals[n.id] = n.v; });
    for (;;) {
      var pick = pickNext(tree, done);
      if (!pick) break;
      var n = tree.nodes[pick.id];
      var a = vals[n.a], b = vals[n.b];
      var r = apply(a, n.op, b);
      if (r.error) return { tree: tree, order: order, vals: vals, stuck: Object.assign({ a: a, op: n.op, b: b, error: r.error }, pick) };
      vals[pick.id] = r.v;
      done.push(pick.id);
      order.push(Object.assign({ a: a, op: n.op, b: b, v: r.v }, pick));
    }
    return { tree: tree, order: order, vals: vals, value: vals[tree.root], stuck: null };
  }

  /** Parse and plan; ok only when every operation can be done (rule 4). */
  function analyse(text, opts) {
    var tree = parse(text, opts);
    if (!tree.ok) return tree;
    var plan = planOf(tree);
    if (plan.stuck && !(opts && opts.flat)) {
      var s = plan.stuck;
      return { ok: false, error: s.error, a: s.a, op: s.op, b: s.b, at: 0 };
    }
    return Object.assign({ ok: true }, plan);
  }

  /** Why an analysed text cannot be worked out: { error, a, op, b }, or null when it can. */
  function failOf(A) { return A.ok ? null : { error: A.error, a: A.a, op: A.op, b: A.b, at: A.at }; }

  // ── written forms ──

  /** The expression as tokens after `k` operations of the plan are done: a done node is its value, its brackets gone.
      Each token: { t: 'num' | 'op' | '(' | ')', v, op, node } (node: the tree node it stands for). */
  function writtenAt(plan, k) {
    var nodes = plan.tree.nodes, done = plan.order.slice(0, k).map(function (o) { return o.id; });
    var out = [];
    (function rec(id) {
      var n = nodes[id];
      if (n.kind === 'num' || done.indexOf(id) >= 0) { out.push({ t: 'num', v: plan.vals[id], node: id }); return; }
      var i;
      for (i = 0; i < n.br; i++) out.push({ t: '(', node: id });
      rec(n.a);
      out.push({ t: 'op', op: n.op, node: id });
      rec(n.b);
      for (i = 0; i < n.br; i++) out.push({ t: ')', node: id });
    })(plan.tree.root);
    return out;
  }

  /** Tokens to the canonical text: "543 − (423 + 28)". */
  function textOf(tokens) {
    var s = '';
    tokens.forEach(function (tk, i) {
      var prev = tokens[i - 1];
      if (tk.t === 'op') { s += ' ' + SIGN[tk.op] + ' '; return; }
      if (tk.t === ')') { s += ')'; return; }
      s += tk.t === '(' ? '(' : String(tk.v);
    });
    return s;
  }
  function canonical(text) { var t = parse(text); return t.ok ? textOf(t.tokens) : null; }

  /** The tree's shape by number position, brackets left out: two texts with one shape are worked out alike. */
  function shapeOf(tree) {
    var idx = {}, k = 0;
    tree.tokens.forEach(function (tk) { if (tk.t === 'num') idx[tk.node] = k++; });
    return (function rec(id) {
      var n = tree.nodes[id];
      return n.kind === 'num' ? String(idx[id]) : '[' + rec(n.a) + n.op + rec(n.b) + ']';
    })(tree.root);
  }

  /** Rule 6: the same numbers and signs without any brackets. null when the text has none. */
  function withoutBrackets(text) {
    var tree = parse(text);
    if (!tree.ok || !tree.tokens.some(function (x) { return x.t === '('; })) return null;
    var bare = textOf(tree.tokens.filter(function (x) { return x.t === 'num' || x.t === 'op'; }));
    var A = analyse(bare);
    return { text: bare, ok: A.ok, value: A.ok ? A.value : null, error: A.ok ? null : A.error, fail: failOf(A),
      same: shapeOf(parse(bare)) === shapeOf(tree) };
  }

  /** Rule 7: one pair of brackets in every place it can go (around two or more neighbouring numbers, not all of
      them), and none; offered for 2 to 4 numbers. Each: { text, i, j, ok, value, error, same } (same: the order of
      work is the one without brackets). */
  function bracketOptions(text) {
    var tree = parse(text);
    if (!tree.ok || tree.numbers > MAX_BRACKET_NUMBERS) return [];
    var nums = tree.tokens.filter(function (x) { return x.t === 'num'; });
    var ops = tree.tokens.filter(function (x) { return x.t === 'op'; });
    var N = nums.length;
    var bareShape = shapeOf(parse(textOf(tree.tokens.filter(function (x) { return x.t !== '(' && x.t !== ')'; }))));
    var out = [];
    function build(i, j) {
      var tk = [];
      for (var k = 0; k < N; k++) {
        if (k === i) tk.push({ t: '(' });
        tk.push({ t: 'num', v: nums[k].v });
        if (k === j) tk.push({ t: ')' });
        if (k < N - 1) tk.push({ t: 'op', op: ops[k].op });
      }
      var s = textOf(tk), A = analyse(s);
      // a refused choice keeps the operation that fails (a, op, b), for its reason
      out.push({ text: s, i: i, j: j, ok: A.ok, value: A.ok ? A.value : null, error: A.ok ? null : A.error,
        a: A.ok ? null : A.a, op: A.ok ? null : A.op, b: A.ok ? null : A.b, same: shapeOf(parse(s)) === bareShape });
    }
    build(-1, -1);
    for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) if (!(i === 0 && j === N - 1)) build(i, j);
    return out;
  }

  /** Rule 3, shown: at a pick decided left to right, the expression with the right-hand one done first instead (the
      next operation of the same rank put in brackets), and its value or why it cannot be done. */
  function otherOrderOf(plan, k) {
    var o = plan.order[k];
    if (!o || !o.nextSame) return null;
    var line = writtenAt(plan, k), nodes = plan.tree.nodes;
    var bTok = -1;
    line.forEach(function (tk, ix) { if (tk.t === 'num' && tk.node === nodes[o.id].b) bTok = ix; });
    if (bTok < 0 || !line[bTok + 2] || line[bTok + 2].t !== 'num') return null;
    var tk = line.slice(0, bTok).concat([{ t: '(' }], line.slice(bTok, bTok + 3), [{ t: ')' }], line.slice(bTok + 3));
    var s = textOf(tk), A = analyse(s);
    return { text: s, ok: A.ok, value: A.ok ? A.value : null, error: A.ok ? null : A.error, fail: failOf(A),
      a: line[bTok].v, op: line[bTok + 1].op, b: line[bTok + 2].v };
  }

  /** Rule 8, the typical mistake: the same text, every operation of one rank (brackets still first). Its plan, its
      value or where it gets stuck, and whether it differs from the right result. */
  function mistakeOf(text) {
    var right = analyse(text);
    var tree = parse(text, { flat: true });
    if (!right.ok || !tree.ok) return null;
    var plan = planOf(tree);
    return { plan: plan, value: plan.stuck ? null : plan.value, stuck: plan.stuck,
      same: !plan.stuck && plan.value === right.value, right: right.value };
  }

  // ── params, steps, state ──

  var DEFAULT_EXPR = '543 − (423 + 28)';
  var cache = { text: null, plan: null };

  /** The plan of the params' expression; a text that does not work falls back to the default (the page only sets
      texts that do). Cached by text: the step function asks for it on every step. */
  function planFor(p) {
    var text = p && typeof p.expr === 'string' ? p.expr : DEFAULT_EXPR;
    if (cache.text === text) return cache.plan;
    var A = analyse(text);
    if (!A.ok) A = analyse(DEFAULT_EXPR);
    cache.text = text;
    cache.plan = A;
    return A;
  }

  var PRESETS = [
    { id: 'brackets', params: { expr: '543 − (423 + 28)' } },
    { id: 'no-brackets', params: { expr: '543 − 423 + 28' } },
    { id: 'times-first', params: { expr: '6 + 4 · 3', mistake: true } },
    { id: 'same-rank', params: { expr: '24 : 4 · 2' } },
    { id: 'two-brackets', params: { expr: '(36 + 14) : (12 − 7)' } },
    { id: 'everything', params: { expr: '100 − (12 + 8) · 4 + 30 : 5', mistake: true } }
  ];

  var logic = {
    MAX_DIGITS: MAX_DIGITS, MAX_NUMBERS: MAX_NUMBERS, MAX_VALUE: MAX_VALUE, MAX_BRACKET_NUMBERS: MAX_BRACKET_NUMBERS,
    SIGN: SIGN, RANK: RANK, PRESETS: PRESETS, DEFAULT_EXPR: DEFAULT_EXPR,
    tokenize: tokenize, parse: parse, apply: apply, pickNext: pickNext, planOf: planOf, analyse: analyse,
    writtenAt: writtenAt, textOf: textOf, canonical: canonical, shapeOf: shapeOf, withoutBrackets: withoutBrackets,
    bracketOptions: bracketOptions, otherOrderOf: otherOrderOf, mistakeOf: mistakeOf, planFor: planFor,

    defaults: { expr: DEFAULT_EXPR, mistake: false },

    /** Two steps per operation: pick it, do it. */
    steps: function (p) { return 2 * planFor(p).order.length; },

    initial: function () { return { phase: 'start', k: 0, cur: null }; },

    /** pick: the next operation is marked (k done so far); do: it is done (k + 1 done). */
    step: function (s, n, p) {
      var plan = planFor(p);
      if (s.phase === 'start' || s.phase === 'do') {
        var o = plan.order[s.k];
        return o ? { phase: 'pick', k: s.k, cur: o.id } : { phase: s.phase, k: s.k, cur: s.cur };
      }
      return { phase: 'do', k: s.k + 1, cur: s.cur };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
