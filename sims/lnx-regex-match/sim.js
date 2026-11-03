/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-regex-match: how a regular expression matches one line of text.
   A backtracking matcher (the model of grep -P) walks the pattern and the line one action per step: it tests one token
   at the text position, enters an alternation or takes one more repetition (each leaves a choice point on a stack), and
   on a failure goes back to the newest choice point; with no choice point left it moves the start one to the right.
   Beside it, the POSIX result (grep and grep -E: the leftmost-longest match) is computed by a set-of-positions
   matcher that does not backtrack, so the two can disagree only on which match from the same start they report.
   The form (BRE, ERE, PCRE) decides which characters are special (parse).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (parse, compile, run,
   posixMatch) works on plain data and is promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MODES = ['BRE', 'ERE', 'PCRE'];
  var MAX_STEPS = 20;          // a stepper demo: longer walks jump to the end at the last step
  var TRY_LIMIT = 100000;      // the matcher gives up after this many tries (a real engine has a limit too)
  var MAX_TEXT = 32;           // one /etc/passwd line from the book fits
  var MAX_PATTERN = 24;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── parsing: which characters are special depends on the form (rules 1 and 2) ──

  var CLASSES = {
    alpha: function (c) { return /[A-Za-z]/.test(c); },
    digit: function (c) { return /[0-9]/.test(c); },
    alnum: function (c) { return /[A-Za-z0-9]/.test(c); },
    upper: function (c) { return /[A-Z]/.test(c); },
    lower: function (c) { return /[a-z]/.test(c); },
    space: function (c) { return /\s/.test(c); },
    punct: function (c) { return /[!-\/:-@\[-`{-~]/.test(c); }
  };

  function ParseError(code, at) { this.code = code; this.at = at; }

  /**
   * parse(pattern, mode) → { ok: true, tokens, ast } | { ok: false, error: { code, at } }.
   * tokens: the pattern as a row for the stage, [{ kind, text, q, lit, from, to }]: kind is 'char' | 'any' | 'set' |
   * 'bol' | 'eol' | 'open' | 'close' | 'alt'; q the quantifier on it ('*', '+', '?' or null; a group's sits on its
   * 'close'); lit true for a character that is special in another form but ordinary in this one (BRE's + ? | ( ) { }).
   * ast: { t: 'group', alts: [[item]] } with items { t: 'char' | 'any' | 'set' | 'bol' | 'eol' | 'group' | 'rep' }.
   */
  function parse(pattern, mode) {
    if (MODES.indexOf(mode) < 0) mode = 'ERE';
    var src = String(pattern);
    var tokens = [];
    var i = 0;
    var groups = 0;

    function tok(kind, text, from, extra) {
      var t = { kind: kind, text: text, q: null, lit: false, from: from, to: i };
      if (extra) Object.keys(extra).forEach(function (k) { t[k] = extra[k]; });
      tokens.push(t);
      return tokens.length - 1;
    }

    function parseSet() {
      var from = i;
      i++; // [
      var neg = false;
      if (src[i] === '^') { neg = true; i++; }
      var items = [];
      var first = true;
      while (i < src.length && (src[i] !== ']' || first)) {
        first = false;
        if (src[i] === '[' && (src[i + 1] === '.' || src[i + 1] === '=')) throw new ParseError('unsupported-class', i);
        if (src[i] === '\\' && mode === 'PCRE') throw new ParseError('unsupported-escape', i);   // PCRE escapes inside [ ]
        if (src[i] === '[' && src[i + 1] === ':') {
          var end = src.indexOf(':]', i + 2);
          if (end < 0) throw new ParseError('unclosed-set', from);
          var name = src.slice(i + 2, end);
          if (!CLASSES[name]) throw new ParseError('unknown-class', i);
          items.push({ cls: name });
          i = end + 2;
          if (src[i] === '-' && src[i + 1] !== undefined && src[i + 1] !== ']') throw new ParseError('bad-range', i);
          continue;
        }
        var lo = src[i];
        if (src[i + 1] === '-' && src[i + 2] !== undefined && src[i + 2] !== ']') {
          var hi = src[i + 2];
          if (hi < lo) throw new ParseError('bad-range', i);
          items.push({ lo: lo, hi: hi });
          i += 3;
        } else {
          items.push({ lo: lo, hi: lo });
          i++;
        }
      }
      if (i >= src.length) throw new ParseError('unclosed-set', from);
      i++; // ]
      var ti = tok('set', src.slice(from, i), from);
      return { t: 'set', neg: neg, items: items, tok: ti };
    }

    function quantOf(c) { return c === '*' || c === '+' || c === '?' ? c : null; }

    // ── BRE: no groups, no alternation; + ? | ( ) { } are ordinary; ^ and $ anchor only at the ends; * first is ordinary
    function parseBRE() {
      var items = [];
      while (i < src.length) {
        var c = src[i], from = i, node;
        if (c === '^' && i === 0) { i++; items.push({ t: 'bol', tok: tok('bol', '^', from) }); continue; }
        if (c === '$' && i === src.length - 1) { i++; items.push({ t: 'eol', tok: tok('eol', '$', from) }); continue; }
        var atStart = items.length === 0 || (items.length === 1 && items[0].t === 'bol');
        if (c === '*' && !atStart) {
          var prev = items[items.length - 1];
          if (prev.t === 'rep') throw new ParseError('double-quantifier', i);
          if (prev.t === 'bol' || prev.t === 'eol') throw new ParseError('nothing-to-repeat', i);
          i++;
          tokens[prev.tok].q = '*';
          tokens[prev.tok].to = i;
          items[items.length - 1] = { t: 'rep', atom: prev, min: 0, max: Infinity, q: '*', tok: prev.tok };
          continue;
        }
        if (c === '.') { i++; node = { t: 'any', tok: tok('any', '.', from) }; }
        else if (c === '[') node = parseSet();
        else if (c === '\\') {
          var e = src[i + 1];
          if (e === undefined) throw new ParseError('trailing-backslash', i);
          if ('(){}|+?'.indexOf(e) >= 0) throw new ParseError('bre-operator', i);
          if ('.[]*^$\\'.indexOf(e) < 0) throw new ParseError('unsupported-escape', i);
          i += 2;
          node = { t: 'char', ch: e, tok: tok('char', '\\' + e, from, { ch: e }) };
        } else {
          i++;
          var lit = '+?|(){}'.indexOf(c) >= 0 || c === '*' || c === '^' || c === '$';
          node = { t: 'char', ch: c, tok: tok('char', c, from, { ch: c, lit: lit }) };
        }
        items.push(node);
      }
      return { t: 'group', alts: [items], implicit: true };
    }

    // ── ERE and PCRE (the same syntax for this subset): ( ) | * + ? ^ $ are operators
    function parseAlts(implicit, openTok) {
      var alts = [];
      var altToks = [];
      for (;;) {
        altToks.push(tokens.length);
        var seq = parseSeq();
        if (!seq.length) {
          var whole = implicit && !alts.length && i >= src.length;   // the empty pattern: matches the empty string
          if (!whole) {
            if (implicit && src[i] === ')') throw new ParseError('unmatched-close', i);
            throw new ParseError(!implicit && !alts.length && src[i] === ')' ? 'empty-group' : 'empty-alt', i);
          }
        }
        alts.push(seq);
        if (src[i] === '|') { var from = i; i++; tok('alt', '|', from); continue; }
        break;
      }
      return { alts: alts, altToks: altToks };
    }
    function parseSeq() {
      var items = [];
      while (i < src.length && src[i] !== '|' && src[i] !== ')') {
        var c = src[i], from = i, node;
        if (quantOf(c)) throw new ParseError('nothing-to-repeat', i);
        if (c === '{' || c === '}') throw new ParseError('unsupported-brace', i);
        if (c === '(') {
          i++;
          var g = groups++;
          var open = tok('open', '(', from, { g: g });
          var inner = parseAlts(false, open);
          if (src[i] !== ')') throw new ParseError('unclosed-group', from);
          var cf = i;
          i++;
          var close = tok('close', ')', cf, { g: g });
          tokens[open].close = close;
          node = { t: 'group', alts: inner.alts, altToks: inner.altToks, tok: open, close: close, g: g };
        } else if (c === '.') { i++; node = { t: 'any', tok: tok('any', '.', from) }; }
        else if (c === '[') node = parseSet();
        else if (c === '^') { i++; node = { t: 'bol', tok: tok('bol', '^', from) }; }
        else if (c === '$') { i++; node = { t: 'eol', tok: tok('eol', '$', from) }; }
        else if (c === '\\') {
          var e = src[i + 1];
          if (e === undefined) throw new ParseError('trailing-backslash', i);
          if ('.[]*+?|(){}^$\\'.indexOf(e) < 0) throw new ParseError('unsupported-escape', i);
          i += 2;
          node = { t: 'char', ch: e, tok: tok('char', '\\' + e, from, { ch: e }) };
        } else { i++; node = { t: 'char', ch: c, tok: tok('char', c, from, { ch: c }) }; }
        var q = quantOf(src[i]);
        if (q) {
          if (node.t === 'bol' || node.t === 'eol') throw new ParseError('nothing-to-repeat', i);
          var badge = node.t === 'group' ? node.close : node.tok;
          tokens[badge].q = q;
          i++;
          tokens[badge].to = i;
          if (quantOf(src[i]) || src[i] === '{') throw new ParseError('double-quantifier', i);
          node = { t: 'rep', atom: node, min: q === '+' ? 1 : 0, max: q === '?' ? 1 : Infinity, q: q, tok: badge };
        }
        items.push(node);
      }
      return items;
    }

    try {
      if (src.length > MAX_PATTERN) throw new ParseError('too-long', MAX_PATTERN);
      var ast;
      if (mode === 'BRE') ast = parseBRE();
      else {
        var top = parseAlts(true, -1);
        if (i < src.length) throw new ParseError('unmatched-close', i);
        ast = { t: 'group', alts: top.alts, altToks: top.altToks, implicit: true };
      }
      return { ok: true, tokens: tokens, ast: ast };
    } catch (e) {
      if (e instanceof ParseError) return { ok: false, error: { code: e.code, at: e.at, invalid: invalidInGrep(e.code, mode) }, tokens: tokens };
      throw e;
    }
  }

  /**
   * Is a refused pattern also an error for grep in this form (exit status 2), or one grep accepts that this page does
   * not cover? Checked with GNU grep 3.11 (NOTES.md, "Refused patterns").
   */
  var INVALID = { 'unclosed-group': 1, 'unclosed-set': 1, 'bad-range': 1, 'unknown-class': 1, 'trailing-backslash': 1 };
  var INVALID_PCRE = { 'unmatched-close': 1, 'nothing-to-repeat': 1, 'double-quantifier': 1 };
  function invalidInGrep(code, mode) { return !!(INVALID[code] || (mode === 'PCRE' && INVALID_PCRE[code])); }

  /** Does a one-character node (char, any, set) match character c? */
  function testChar(node, c) {
    if (c === undefined) return false;
    if (node.t === 'any') return true;
    if (node.t === 'char') return node.ch === c;
    var hit = node.items.some(function (it) { return it.cls ? CLASSES[it.cls](c) : c >= it.lo && c <= it.hi; });
    return node.neg ? !hit : hit;
  }
  function single(node) { return node.t === 'char' || node.t === 'any' || node.t === 'set'; }

  // ── compile to a small program for the backtracking walk ──
  // ops: test (char/any/set), bol, eol, alt { branches, tok }, jmp, rinit { r }, rmore { r, min, max, node | body, exit },
  //      rend { r, loop }, match

  function compile(ast) {
    var prog = [];
    var reps = 0;
    function emit(o) { prog.push(o); return prog.length - 1; }
    function seq(items) { items.forEach(item); }
    function alts(g, tokOf) {
      if (g.alts.length === 1) { seq(g.alts[0]); return; }
      var at = emit({ op: 'alt', branches: [], tok: tokOf, altToks: g.altToks });
      var jumps = [];
      g.alts.forEach(function (a, k) {
        prog[at].branches.push(prog.length);
        seq(a);
        if (k < g.alts.length - 1) jumps.push(emit({ op: 'jmp', to: -1 }));
      });
      jumps.forEach(function (j) { prog[j].to = prog.length; });
    }
    function item(n) {
      if (single(n)) { emit({ op: 'test', node: n, tok: n.tok }); return; }
      if (n.t === 'bol' || n.t === 'eol') { emit({ op: n.t, tok: n.tok }); return; }
      if (n.t === 'group') { alts(n, n.tok); return; }
      // rep
      var r = reps++;
      emit({ op: 'rinit', r: r });
      var more = emit({ op: 'rmore', r: r, min: n.min, max: n.max, q: n.q, tok: n.tok, node: single(n.atom) ? n.atom : null,
        body: -1, exit: -1, open: n.atom.t === 'group' ? n.atom.tok : null });
      if (!single(n.atom)) {
        prog[more].body = prog.length;
        item(n.atom);
        emit({ op: 'rend', r: r, loop: more });
      }
      prog[more].exit = prog.length;
    }
    alts(ast, -1);
    emit({ op: 'match' });
    return { prog: prog, reps: reps };
  }

  // ── the backtracking walk, one action at a time (rules 3–6, 8) ──

  function fresh(reps) { var a = []; for (var k = 0; k < reps; k++) a.push(0); return a; }

  /**
   * The machine: { start, pc, pos, counts, marks, stack, tries, failed, done, match, limit }.
   * act(m, prog, text) performs the next visible action and returns its record { k, ti, at, ok, ... }:
   *   k: 'test' | 'bol' | 'eol' (a token tested at pos), 'more' (one more repetition of a one-character atom: ok pushes
   *   a choice point, a miss ends the repetition), 'more-enter' (one more repetition of a group, a choice point pushed),
   *   'alt' (an alternation entered at its first branch, a choice point keeps the next), 'back-more' / 'back-alt'
   *   (a failure resumed at the newest choice point), 'restart' (no choice point left: start + 1), 'match', 'nomatch',
   *   'limit' (the matcher gave up).
   */
  function act(m, P, text) {
    var prog = P.prog;
    if (m.failed) {
      m.failed = false;
      if (m.stack.length) {
        var cp = m.stack.pop();
        m.pos = cp.pos; m.counts = cp.counts.slice(); m.marks = cp.marks.slice();
        if (cp.kind === 'alt') {
          var A = prog[cp.pc];
          if (cp.alt + 1 < A.branches.length) {
            m.stack.push({ kind: 'alt', pc: cp.pc, alt: cp.alt + 1, pos: cp.pos, counts: cp.counts.slice(), marks: cp.marks.slice(),
              ti: cp.ti, bti: A.altToks[cp.alt + 1] });
          }
          m.pc = A.branches[cp.alt];
          return { k: 'back-alt', ti: A.altToks[cp.alt], alt: cp.alt, at: m.pos, cpTi: cp.ti };
        }
        m.pc = cp.pc;
        return { k: 'back-more', ti: cp.ti, count: cp.count, at: m.pos, cpTi: cp.ti, r: cp.r };
      }
      if (m.start < text.length) {
        m.start++;
        m.pos = m.start; m.pc = 0; m.counts = fresh(P.reps); m.marks = fresh(P.reps);
        return { k: 'restart', ti: firstTok(P), at: m.start, from: m.start - 1 };
      }
      m.done = true;
      return { k: 'nomatch', ti: -1, at: m.pos };
    }
    if (m.tries >= TRY_LIMIT) { m.done = true; m.limit = true; return { k: 'limit', ti: -1, at: m.pos }; }
    for (;;) {
      var o = prog[m.pc];
      var c = text[m.pos];
      switch (o.op) {
        case 'jmp': m.pc = o.to; continue;
        case 'rinit': m.counts[o.r] = 0; m.pc++; continue;
        case 'rend':
          m.counts[o.r]++;
          // an iteration that took no characters ends the repetition (no endless empty loop)
          m.pc = m.pos === m.marks[o.r] ? prog[o.loop].exit : o.loop;
          continue;
        case 'test':
          m.tries++;
          if (testChar(o.node, c)) { m.pos++; m.pc++; return { k: 'test', ti: o.tok, at: m.pos - 1, ok: true, ch: c }; }
          m.failed = true;
          return { k: 'test', ti: o.tok, at: m.pos, ok: false, ch: c === undefined ? null : c };
        case 'bol':
        case 'eol':
          m.tries++;
          if (o.op === 'bol' ? m.pos === 0 : m.pos === text.length) { m.pc++; return { k: o.op, ti: o.tok, at: m.pos, ok: true }; }
          m.failed = true;
          return { k: o.op, ti: o.tok, at: m.pos, ok: false };
        case 'alt':
          m.stack.push({ kind: 'alt', pc: m.pc, alt: 1, pos: m.pos, counts: m.counts.slice(), marks: m.marks.slice(),
            ti: o.tok, bti: o.altToks[1] });
          m.pc = o.branches[0];
          return { k: 'alt', ti: o.altToks[0], at: m.pos, cpTi: o.tok };
        case 'rmore': {
          var n = m.counts[o.r];
          if (n >= o.max) { m.pc = o.exit; continue; }
          var must = n < o.min;
          if (!o.node) {                       // a group: enter the body
            m.marks[o.r] = m.pos;
            if (must) { m.pc = o.body; continue; }
            m.stack.push({ kind: 'more', pc: o.exit, pos: m.pos, count: n, counts: m.counts.slice(), marks: m.marks.slice(), ti: o.tok, r: o.r });
            m.pc = o.body;
            return { k: 'more-enter', ti: o.tok, at: m.pos, count: n + 1, open: o.open };
          }
          m.tries++;
          var ok = testChar(o.node, c);
          if (must) {                          // the repetitions + needs: a plain test, no choice point
            if (ok) { m.counts[o.r]++; m.pos++; return { k: 'test', ti: o.tok, at: m.pos - 1, ok: true, ch: c, count: n + 1, rep: true }; }
            m.failed = true;
            return { k: 'test', ti: o.tok, at: m.pos, ok: false, ch: c === undefined ? null : c, count: n, rep: true };
          }
          if (ok) {
            m.stack.push({ kind: 'more', pc: o.exit, pos: m.pos, count: n, counts: m.counts.slice(), marks: m.marks.slice(), ti: o.tok, r: o.r });
            m.counts[o.r]++; m.pos++;
            return { k: 'more', ti: o.tok, at: m.pos - 1, ok: true, ch: c, count: n + 1 };
          }
          // one more fails at once: the repetition stops here (the choice point it would leave is used at once)
          m.pc = o.exit;
          return { k: 'more', ti: o.tok, at: m.pos, ok: false, ch: c === undefined ? null : c, count: n };
        }
        case 'match':
          m.done = true;
          m.match = { from: m.start, to: m.pos };
          return { k: 'match', ti: -1, at: m.pos };
      }
      throw new Error('bad op ' + o.op);
    }
  }

  function firstTok(P) { return P.tokens.length ? 0 : -1; }

  function machine(reps) {
    return { start: 0, pc: 0, pos: 0, counts: fresh(reps), marks: fresh(reps), stack: [], tries: 0, failed: false,
      done: false, match: null, limit: false };
  }

  /** Run the whole walk without recording: { match, tries, actions, limit } (tests and the comparison). */
  function run(pattern, text, mode) {
    var p = parse(pattern, mode);
    if (!p.ok) return { error: p.error };
    var P = compile(p.ast);
    P.tokens = p.tokens;
    var m = machine(P.reps), actions = 0;
    while (!m.done) { act(m, P, text); actions++; }
    return { match: m.match, tries: m.tries, actions: actions, limit: m.limit };
  }

  // ── POSIX: the leftmost-longest match (rule 7), from the set of end positions each node can reach ──

  function ends(node, text, from) {
    // from: a sorted array of positions; returns the positions after node
    var out = {};
    function add(p) { out[p] = true; }
    if (single(node)) from.forEach(function (p) { if (testChar(node, text[p])) add(p + 1); });
    else if (node.t === 'bol') from.forEach(function (p) { if (p === 0) add(p); });
    else if (node.t === 'eol') from.forEach(function (p) { if (p === text.length) add(p); });
    else if (node.t === 'group') node.alts.forEach(function (a) { seqEnds(a, text, from).forEach(add); });
    else if (node.t === 'rep') {
      var cur = from, k = 0;
      var seen = {};
      if (node.min === 0) from.forEach(add);
      while (cur.length && k < node.max) {
        cur = ends(node.atom, text, cur);
        k++;
        var next = [];
        cur.forEach(function (p) {
          if (k >= node.min) add(p);
          if (!seen[p]) { seen[p] = true; next.push(p); }
        });
        if (k >= node.min) cur = next;   // a position already expanded gives nothing new
      }
    }
    return Object.keys(out).map(Number).sort(function (a, b) { return a - b; });
  }
  function seqEnds(items, text, from) {
    var cur = from;
    for (var k = 0; k < items.length && cur.length; k++) cur = ends(items[k], text, cur);
    return cur;
  }

  /** POSIX leftmost-longest: the first start with any match, and the longest match from it. */
  function posixMatch(pattern, text, mode) {
    var p = parse(pattern, mode);
    if (!p.ok) return null;
    for (var s = 0; s <= text.length; s++) {
      var e = ends(p.ast, text, [s]);
      if (e.length) return { from: s, to: e[e.length - 1] };
    }
    return null;
  }

  // ── frames: step 0 the start; one step per action; a walk longer than MAX_STEPS jumps to the end at the last step ──

  function clean(params) {
    var mode = MODES.indexOf(params.mode) >= 0 ? params.mode : 'ERE';
    var text = String(params.text == null ? '' : params.text).replace(/[\r\n\t]/g, ' ').slice(0, MAX_TEXT);
    var pattern = String(params.pattern == null ? '' : params.pattern).replace(/[\r\n\t]/g, ' ');
    return { mode: mode, text: text, pattern: pattern };
  }

  function view(m, P, base, a, extra) {
    var s = {
      mode: base.mode, pattern: base.pattern, text: base.text, tokens: P.tokens, error: null,
      start: m.start, ti: a ? a.ti : firstTok(P), pos: m.pos,
      stack: m.stack.map(function (cp) {
        return cp.kind === 'alt' ? { kind: 'alt', ti: cp.ti, bti: cp.bti, alt: cp.alt, pos: cp.pos }
          : { kind: 'more', ti: cp.ti, count: cp.count, pos: cp.pos };
      }),
      tries: m.tries, actions: extra.actions, act: a || { k: 'start', ti: firstTok(P), at: 0 },
      match: m.match, posix: null, done: m.done, limit: m.limit, jumped: 0, exit: null,
      pushed: !!(a && (a.k === 'alt' || a.k === 'more-enter' || (a.k === 'more' && a.ok))),
      popped: !!(a && (a.k === 'back-alt' || a.k === 'back-more'))
    };
    if (m.done) {
      s.posix = base.posix;
      s.exit = s.mode === 'PCRE' ? (m.limit ? 2 : m.match ? 0 : 1) : base.posix ? 0 : 1;
    }
    return s;
  }

  function framesOf(params) {
    var base = clean(params);
    var p = parse(base.pattern, base.mode);
    if (!p.ok) {
      var e = { mode: base.mode, pattern: base.pattern, text: base.text, tokens: p.tokens, error: p.error, start: 0, ti: -1, pos: 0,
        stack: [], tries: 0, actions: 0, act: { k: 'error', ti: -1, at: 0 }, match: null, posix: null, done: true, limit: false,
        jumped: 0, exit: p.error.invalid ? 2 : null, pushed: false, popped: false };
      return [e, clone(e)];
    }
    var P = compile(p.ast);
    P.tokens = p.tokens;
    base.posix = posixMatch(base.pattern, base.text, base.mode);
    var m = machine(P.reps);
    var frames = [clone(view(m, P, base, null, { actions: 0 }))];
    var actions = 0;
    var a = null;
    while (!m.done) {
      a = act(m, P, base.text);
      actions++;
      if (frames.length < MAX_STEPS) frames.push(clone(view(m, P, base, a, { actions: actions })));
    }
    if (actions >= MAX_STEPS) {
      // the last frame is the end of the walk; the actions between are skipped
      var last = view(m, P, base, a, { actions: actions });
      last.jumped = actions - (MAX_STEPS - 1);
      frames[MAX_STEPS] = clone(last);
      frames.length = MAX_STEPS + 1;
      if (actions === MAX_STEPS) frames[MAX_STEPS].jumped = 0;
    }
    return frames;
  }

  // ── captions: which sentence, and its data (pure; the page fills the strings) ──

  function tokText(s, ti) {
    if (ti == null || ti < 0) return '';
    var t = s.tokens[ti];
    return t.kind === 'close' ? groupText(s, ti) : t.text + (t.q || '');
  }
  /** The text of a group with its quantifier, e.g. "(a+)+", from the token that holds it. */
  function groupText(s, ti) {
    var t = s.tokens[ti];
    var open = -1;
    for (var k = 0; k < s.tokens.length; k++) if (s.tokens[k].kind === 'open' && s.tokens[k].g === t.g) open = k;
    return s.pattern.slice(s.tokens[open].from, t.to);
  }
  /** The text of the branch that starts at token bti (up to the next | or the group's end). */
  function branchText(s, bti) {
    var depth = 0, out = '';
    for (var k = bti; k < s.tokens.length; k++) {
      var t = s.tokens[k];
      if (depth === 0 && (t.kind === 'alt' || t.kind === 'close')) break;
      if (t.kind === 'open') depth++;
      if (t.kind === 'close') depth--;
      out += t.text + (t.q || '');
    }
    return out;
  }
  function spanText(s, m) { return m ? s.text.slice(m.from, m.to) : ''; }

  /**
   * The caption of a state: { key, vars, extra: [{ key, vars }] }. Vars: tok/q/alt/ch/span are data (code), pos/from/to
   * numbers; { t: key } is a word from the tables.
   */
  function captionOf(s) {
    var a = s.act;
    var v = {};
    var extra = [];
    if (a.k === 'error') {
      return { key: s.error.invalid ? 'cError' : 'cNotCovered', vars: { why: { t: 'err_' + s.error.code.replace(/-/g, '_') }, at: s.error.at + 1,
        tool: { t: 'tool_' + s.mode } }, extra: [] };
    }
    if (a.k === 'start') {
      return { key: s.tokens.length ? 'cStart' : 'cStartEmpty', vars: { mode: { t: 'form_' + s.mode } }, extra: [] };
    }
    if (s.jumped) extra.push({ key: 'xJumped', vars: { n: s.jumped, tries: s.tries } });
    switch (a.k) {
      case 'test':
        v = { tok: tokText(s, a.ti), pos: a.at };
        if (a.ok) return { key: a.rep ? 'cRepOk' : 'cTestOk', vars: Object.assign(v, { ch: a.ch, n: a.count }), extra: extra };
        return { key: a.ch == null ? 'cTestEnd' : 'cTestNo', vars: Object.assign(v, { ch: a.ch }), extra: extra };
      case 'bol':
      case 'eol':
        return { key: 'c_' + a.k + (a.ok ? '_ok' : '_no'), vars: { pos: a.at }, extra: extra };
      case 'more':
        v = { q: tokText(s, a.ti), pos: a.at, ch: a.ch, n: a.count, keep: a.count - 1 };
        if (a.ok) return { key: 'cMoreOk', vars: v, extra: extra };
        return { key: a.ch == null ? 'cMoreEnd' : 'cMoreNo', vars: v, extra: extra };
      case 'more-enter':
        return { key: 'cMoreEnter', vars: { q: tokText(s, a.ti), n: a.count, keep: a.count - 1, pos: a.at }, extra: extra };
      case 'alt':
        var cp = s.stack[s.stack.length - 1];
        return { key: 'cAlt', vars: { alt: branchText(s, a.ti), next: branchText(s, cp.bti), pos: a.at }, extra: extra };
      case 'back-alt':
        return { key: a.alt === 1 ? 'cBackAlt' : 'cBackAltNext', vars: { alt: branchText(s, a.ti), pos: a.at }, extra: extra };
      case 'back-more': {
        var q = s.tokens[a.ti];
        // a group stops at fewer repetitions; a one-character repetition gives back one character, and when it had
        // taken the line to its end and the next token found nothing, the task's caption says so (cBackMoreEnd)
        var key = q.kind === 'close' ? (a.count === 0 ? 'cBackGroupNone' : 'cBackGroup') : s.prevEnd ? 'cBackMoreEnd' : 'cBackMore';
        return { key: key, vars: { q: tokText(s, a.ti), n: a.count, pos: a.at, next: s.prevEnd || '' }, extra: extra };
      }
      case 'restart':
        return { key: 'cRestart', vars: { from: a.from, to: a.at }, extra: extra };
      case 'match':
      case 'nomatch':
      case 'limit':
        return verdictOf(s, extra);
    }
    throw new Error('no caption for ' + a.k);
  }

  function verdictOf(s, extra) {
    var a = s.act;
    var key = a.k === 'match' ? 'cMatch' : a.k === 'limit' ? 'cLimit' : 'cNoMatch';
    var v = { span: spanText(s, s.match), from: s.match ? s.match.from : 0, to: s.match ? s.match.to : 0, tries: s.tries,
      exit: s.exit, tool: { t: 'tool_' + s.mode } };
    if (a.k === 'match' && s.stack.length) extra.push({ key: 'xLeftover', vars: { n: s.stack.length } });
    if (a.k === 'match' && s.posix && (s.posix.from !== s.match.from || s.posix.to !== s.match.to)) {
      extra.push({ key: 'xPosixLonger', vars: { span: spanText(s, s.posix) } });
    }
    if (a.k === 'limit' && !s.posix) extra.push({ key: 'xLimitPosixNone', vars: {} });
    if (a.k === 'limit' && s.posix) extra.push({ key: 'xLimitPosixSpan', vars: { span: spanText(s, s.posix) } });
    if (a.k !== 'limit') extra.push({ key: 'xExit', vars: { exit: s.exit, tool: { t: 'tool_' + s.mode } } });
    return { key: key, vars: v, extra: extra };
  }

  /** Frames for the page's params (memoised on the params that shape them). After a failure that met the end of the
   *  line, the next back-more frame names the token that found nothing (prevEnd), for the caption. */
  var memo = {};
  function frames(p) {
    var b = clean(p);
    var key = b.mode + '\u0000' + b.pattern + '\u0000' + b.text;
    if (!memo[key]) {
      var fr = framesOf(p);
      for (var k = 1; k < fr.length; k++) {
        var prev = fr[k - 1], cur = fr[k];
        cur.prevEnd = null;
        if (cur.act.k === 'back-more' && (prev.act.k === 'test' || prev.act.k === 'eol') && !prev.act.ok && prev.act.at === prev.text.length) {
          var cp = prev.stack[prev.stack.length - 1];
          // the repetition that gives back had taken the last character of the line
          if (cp && cp.kind === 'more' && cp.pos === prev.text.length - 1) cur.prevEnd = tokText(prev, prev.act.ti);
        }
      }
      fr[0].prevEnd = null;
      memo[key] = fr;
    }
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  /** The presets (task "Presets"; SPEC.md). */
  var PRESETS = [
    { id: 'book-ro-t', params: { pattern: 'ro+t', text: 'root:x:0:0:root:/root:/bin/bash', mode: 'ERE' } },
    { id: 'book-root-bin', params: { pattern: '^(root|bin)', text: 'bin:x:1:1:bin:/bin:/sbin/nologin', mode: 'ERE' } },
    { id: 'greedy', params: { pattern: 'a.*b', text: 'aXbYb', mode: 'ERE' } },
    { id: 'leftmost-longest', params: { pattern: 'a|ab', text: 'ab', mode: 'ERE' } },
    { id: 'anchor-scan', params: { pattern: 't$', text: 'root:x', mode: 'ERE' } },
    { id: 'explosion', params: { pattern: '(a+)+b', text: 'aaaaaa', mode: 'ERE' } }
  ];

  var logic = {
    /** Parameter defaults: the first preset (ro+t on root's line, ERE). */
    defaults: Object.assign({}, PRESETS[0].params),

    /** One step per matcher action, at most MAX_STEPS (the last one jumps to the end of a longer walk). */
    steps: function (p) { return frames(p).length - 1; },
    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    MODES: MODES, MAX_STEPS: MAX_STEPS, TRY_LIMIT: TRY_LIMIT, MAX_TEXT: MAX_TEXT, MAX_PATTERN: MAX_PATTERN, PRESETS: PRESETS,
    parse: parse, invalidInGrep: invalidInGrep, compile: compile, testChar: testChar, run: run, posixMatch: posixMatch, framesOf: framesOf,
    frames: frames, captionOf: captionOf, tokText: tokText, branchText: branchText, clean: clean
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
