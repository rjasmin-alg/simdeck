// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for regex-to-nfa (rules: SPEC.md). Run: node --test sims/regex-to-nfa/
// Tie-breaks first, then one test per rule, the presets' numbers, the languages, the layout, the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const typed = (src) => P({ regex: src });
const preset = (id) => P({ regex: L.PRESETS.find((x) => x.id === id).regex });
const steps = (p) => L.steps(p);
const at = (p, n) => kit.stateAt(L, p, n);
const end = (p) => at(p, steps(p));
const last = (src) => { const all = L.run(src); return all[all.length - 1]; };
const postfix = (src) => L.run(src)[0].tokens.join(' ');
const sets = (s) => Object.fromEntries(s.dfa.states.map((d) => [d.name, d.set]));
const rows = (s) => s.dfa.trans;
const eps = (s) => s.nfa.edges.filter((e) => e.sym === null);
const key = (e) => e.from + (e.sym === null ? '-ε' : '-' + e.sym) + '>' + e.to;

// ── tie-breaks ──

test('tie-break: unmarked DFA states are processed in creation order', () => {
  for (const id of ['abb', 'ana']) {
    const p = preset(id);
    const s0 = at(p, 0), first = s0.tokens.length + 1;
    const done = [];
    for (let n = first; n <= steps(p); n++) done.push(at(p, n).ev.name);
    const names = end(p).dfa.states.map((d) => d.name);
    assert.deepEqual(done, names, id);
    assert.deepEqual(names, names.slice().sort(), 'names are letters in creation order');
  }
});

test('tie-break: symbols in alphabetical order, whatever their order in the regex', () => {
  // b appears first, but a is tried first, so the state reached on a is B
  const s = last('b|a');
  assert.deepEqual(s.alphabet, ['a', 'b']);
  assert.deepEqual(rows(s).A, { a: 'B', b: 'C' });
  assert.deepEqual(sets(s).B, [4, 5]); // the a branch is the right operand: 3 –a→ 4
  const p = preset('ana');
  const row = at(p, at(p, 0).tokens.length + 1).ev;
  assert.deepEqual(row.moves.map((m) => m.sym), ['a', 'b', 'n']);
  assert.deepEqual(row.moves.map((m) => m.to), ['B', 'C', 'D']);
});

test('tie-break: a set seen before is reused, not renamed (preset 1: C a→B)', () => {
  const s = end(preset('abb'));
  assert.equal(s.dfa.states.length, 5);
  assert.equal(rows(s).C.a, 'B');
  assert.equal(rows(s).E.b, 'C');
});

// ── rule 1: syntax ──

test('rule 1: precedence * > concatenation > |, both binary operators left-associative', () => {
  assert.equal(postfix('a|b|n'), 'a b | n |');
  assert.equal(postfix('abc'), 'a b · c ·');
  assert.equal(postfix('ab*'), 'a b * ·');
  assert.equal(postfix('a|bc'), 'a b c · |');
  assert.equal(postfix('(a|b)c'), 'a b | c ·');
  assert.equal(postfix('a**'), 'a * *');
  assert.equal(postfix('a(bc)'), 'a b c · ·');
  assert.equal(postfix('(a|b)*abb'), 'a b | * a · b · b ·');
});

test('rule 1: other characters, empty groups, missing operands and unbalanced parentheses are rejected', () => {
  const code = (src) => (L.check(src).error || {}).code;
  assert.equal(code(''), 'empty');
  for (const src of ['a+b', 'a?', '[ab]', 'a b', 'A', 'a.b', 'ε', '1']) assert.equal(code(src), 'char', src);
  assert.deepEqual(L.check('a+b').error, { code: 'char', at: 1, ch: '+' });
  for (const src of ['|a', 'a|', '*a', '()', '(|a)', 'a||b', '(*)']) assert.equal(code(src), 'operand', src);
  assert.equal(code('(a'), 'open');
  assert.equal(code('a)'), 'close');
  assert.equal(code('(a))'), 'close');
  assert.deepEqual(L.check(')a').error, { code: 'close', at: 0, ch: ')' });
  // names of Object.prototype are regexes like any other (the memos have no prototype)
  for (const src of ['constructor', 'tostring', 'valueof']) assert.equal(typeof L.check(src).ok, 'boolean', src);
  assert.equal(L.initial(P({ regex: 'constructor' })).error.code, 'symbols');
  assert.equal(L.initial(P({ regex: '__proto__' })).error.code, 'char');
  assert.equal(code('a'.repeat(L.MAX_LENGTH + 1)), 'length');
  for (const src of ['a', 'a*', '(a)', '((a))', 'a**', 'ab|c*', '(a|b)*abb']) assert.equal(L.check(src).ok, true, src);
});

// ── rules 2–5: one token per step ──

test('rule 2: a symbol adds two states and one edge i –c→ f', () => {
  const s = at(typed('a'), 1);
  assert.deepEqual(s.nfa.states, [0, 1]);
  assert.deepEqual(s.nfa.edges, [{ from: 0, sym: 'a', to: 1 }]);
  assert.deepEqual(s.ev.added, [0, 1]);
});

test('rule 3: union adds i with ε to both starts and f with ε from both accepts', () => {
  const p = preset('aorb');
  const before = at(p, 2), s = at(p, 3);
  assert.equal(s.nfa.states.length, before.nfa.states.length + 2);
  assert.deepEqual(s.ev.edges.map(key).sort(), ['0-ε>1', '0-ε>3', '2-ε>5', '4-ε>5']);
  assert.deepEqual(s.stack, [{ node: 2, start: 0, accept: 5 }]);
});

test('rule 4: concatenation merges accept(s) with start(t): no new state, no ε-edge', () => {
  const p = typed('ab');
  const pushed = at(p, 2), s = at(p, 3);
  // before the merge, b's start is a state of its own, shown as 1′
  assert.equal(pushed.nfa.states.length, 4);
  const prov = pushed.stack[1].start;
  assert.ok(prov >= 3, 'provisional id after the final numbers');
  assert.equal(L.label(pushed, prov), '1′');
  assert.equal(s.nfa.states.length, 3);
  assert.deepEqual(s.nfa.states, [0, 1, 2]);
  assert.deepEqual(s.nfa.edges.map(key), ['0-a>1', '1-b>2']);
  assert.equal(eps(s).length, 0);
  assert.deepEqual(s.ev.merged, { gone: prov, into: 1 });
  assert.deepEqual(s.ev.edges, []);
});

test('rule 5: star adds i, f and ε i→start, accept→start, accept→f, i→f', () => {
  const s = at(preset('astar'), 2);
  assert.deepEqual(s.ev.added, [0, 3]);
  assert.deepEqual(s.ev.edges.map(key), ['0-ε>1', '2-ε>1', '2-ε>3', '0-ε>3']);
  assert.deepEqual(s.nfa.states, [0, 1, 2, 3]);
});

// ── rule 6: the book's numbers from the first step on ──

test('rule 6: preset 1 is numbered 0…10 as in the book, and the star adds 0 and 7', () => {
  const p = preset('abb');
  assert.deepEqual(at(p, 1).nfa.states, [2, 3]); // a
  assert.deepEqual(at(p, 2).nfa.states, [2, 3, 4, 5]); // b
  assert.deepEqual(at(p, 3).ev.added, [1, 6]); // |
  assert.deepEqual(at(p, 4).ev.added, [0, 7]); // *
  const s = end(p);
  assert.deepEqual(s.nfa.states, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(s.nfa.edges.map(key).sort(), [
    '0-ε>1', '0-ε>7', '1-ε>2', '1-ε>4', '2-a>3', '3-ε>6', '4-b>5', '5-ε>6', '6-ε>1', '6-ε>7', '7-a>8', '8-b>9', '9-b>10'
  ].sort());
  assert.equal(s.nfa.start, 0);
  assert.equal(s.nfa.accept, 10);
});

test('rule 4: provisional ids follow the final numbers in creation (postfix) order', () => {
  const all = L.run('a(bc)d'); // b's start merges into 1, c's into 2, d's into 3
  const seen = [];
  for (const st of all) if (st.ev && st.ev.kind === 'sym' && st.alias[st.ev.added[0]] != null) seen.push([st.ev.added[0], st.alias[st.ev.added[0]]]);
  assert.deepEqual(seen, [[5, 1], [6, 2], [7, 3]]);
});

test('rule 6: provisional ids disappear; every final NFA is numbered 0 … N−1', () => {
  for (const src of ['a(bc)', '(ab)(cd)', 'a*b*', '(a|b)*abb', 'ab|cd', '((a))b', 'a(b|c)*d']) {
    const s = last(src);
    assert.deepEqual(s.nfa.states, s.nfa.states.map((_, i) => i), src);
    for (const e of s.nfa.edges) assert.ok(e.from < s.size && e.to < s.size, src);
  }
});

// ── rule 7: subset construction ──

test('rule 7: preset 1 gives the book\'s five sets and transitions', () => {
  const s = end(preset('abb'));
  assert.deepEqual(sets(s), {
    A: [0, 1, 2, 4, 7], B: [1, 2, 3, 4, 6, 7, 8], C: [1, 2, 4, 5, 6, 7], D: [1, 2, 4, 5, 6, 7, 9], E: [1, 2, 4, 5, 6, 7, 10]
  });
  assert.deepEqual(rows(s), {
    A: { a: 'B', b: 'C' }, B: { a: 'B', b: 'D' }, C: { a: 'B', b: 'C' }, D: { a: 'B', b: 'E' }, E: { a: 'B', b: 'C' }
  });
  assert.deepEqual(s.dfa.states.filter((d) => d.accepting).map((d) => d.name), ['E']);
  assert.deepEqual(rows(s).A, rows(s).C, 'A and C are equivalent: not minimised');
  assert.equal(s.dfa.dead, false);
});

test('rule 7: D0 = ε-closure(start) is created in the first subset step', () => {
  const p = preset('abb');
  const before = at(p, 10), s = at(p, 11);
  assert.equal(before.phase, 'subset');
  assert.equal(before.dfa.states.length, 0);
  assert.equal(s.ev.first, true);
  assert.deepEqual(s.dfa.states[0].set, L.closure([0], s.nfa.edges));
  assert.deepEqual(s.ev.moves.map((m) => [m.sym, m.move, m.to, m.isNew]), [['a', [3, 8], 'B', true], ['b', [5], 'C', true]]);
});

test('rule 7: an empty U gives no transition and marks the dead state, without a step of its own', () => {
  const s = end(preset('aorb'));
  assert.deepEqual(rows(s), { A: { a: 'B', b: 'C' }, B: {}, C: {} });
  assert.equal(s.dfa.dead, true);
  assert.equal(steps(Object.assign(preset('aorb'), { showDead: true })), steps(preset('aorb')));
  const row = at(preset('aorb'), 5).ev;
  assert.deepEqual(row.moves.map((m) => [m.sym, m.set, m.to]), [['a', [], null], ['b', [], null]]);
});

test('rule 7: a DFA state is accepting iff its set holds the NFA accept state', () => {
  for (const src of ['a*', 'a|b', '(a|b)*abb', '(a|b|n)*ana', 'ab*', '(ab)*']) {
    const s = last(src);
    for (const d of s.dfa.states) assert.equal(d.accepting, d.set.includes(s.nfa.accept), src + ' ' + d.name);
  }
  assert.deepEqual(last('a*').dfa.states.map((d) => d.accepting), [true, true]);
});

test('ε-closure and move', () => {
  const s = last('(a|b)*abb');
  assert.deepEqual(L.closure([0], s.nfa.edges), [0, 1, 2, 4, 7]);
  assert.deepEqual(L.move([0, 1, 2, 4, 7], 'a', s.nfa.edges), [3, 8]);
  assert.deepEqual(L.closure([3, 8], s.nfa.edges), [1, 2, 3, 4, 6, 7, 8]);
  assert.deepEqual(L.move([0, 1], 'b', s.nfa.edges), []);
});

test('sub-regex text for captions, and identical DFA rows (preset 1: A and C)', () => {
  const s = last('(a|b)*abb');
  assert.deepEqual(s.tree.map((_, k) => L.textOf(s.tree, k)),
    ['a', 'b', 'a|b', '(a|b)*', 'a', '(a|b)*a', 'b', '(a|b)*ab', 'b', '(a|b)*abb']);
  const t = last('a(b|c)');
  assert.equal(L.textOf(t.tree, t.tree.length - 1), 'a(b|c)');
  const u = last('a(bc)');
  assert.equal(L.textOf(u.tree, u.tree.length - 1), 'a(bc)');
  assert.deepEqual(L.sameRows(s.dfa), [['A', 'C']]);
  assert.deepEqual(L.sameRows(last('(a|b|n)*ana').dfa), [['A', 'C'], ['A', 'D'], ['C', 'D']]);
  assert.deepEqual(L.sameRows(last('a|b').dfa), [['B', 'C']]);
});

// ── rule 8: limits ──

test('rule 8: a typed regex has at most 20 steps and 4 symbols', () => {
  assert.equal(L.check('abbaab').ok, true); // 11 tokens + 7 states
  assert.equal(L.check('abbaab').steps, 18);
  assert.deepEqual(L.check('abcde|f').error, { code: 'symbols', symbols: 6 });
  const long = L.check('abababab'); // 15 tokens + 9 states
  assert.equal(long.ok, false);
  assert.equal(long.error.code, 'steps');
  assert.equal(long.error.steps, 24);
  assert.equal(L.check('abcd').ok, true);
  assert.equal(L.check('abcd|e').ok, false);
  // the boundaries: 20 steps pass, 21 do not; 4 letters pass, 5 do not; 24 characters pass, 25 do not
  assert.deepEqual(L.check('(a|b)*(a|b)abb'), { ok: true, steps: 20 });
  assert.deepEqual(L.check('abbaabb').error, { code: 'steps', steps: 21 });
  assert.equal(L.check('a|b|c|d').ok, true);
  assert.equal(L.check('((((((((((a))))))))))|ab').ok, true); // 24 characters
  assert.equal(L.check('((((((((((a))))))))))|abb').error.code, 'length');
});

// ── presets ──

test('presets: tokens, NFA states and ε-edges, DFA states and steps as in SPEC.md', () => {
  const want = { abb: [10, 11, 8, 5, 15], aorb: [3, 6, 4, 3, 6], astar: [2, 4, 4, 2, 4], ana: [12, 15, 12, 6, 18] };
  for (const [id, w] of Object.entries(want)) {
    const p = preset(id), s = end(p);
    assert.deepEqual([s.tokens.length, s.nfa.states.length, eps(s).length, s.dfa.states.length, steps(p)], w, id);
    assert.equal(s.phase, 'done');
    assert.ok(steps(p) <= L.MAX_STEPS);
    assert.equal(L.check(L.PRESETS.find((x) => x.id === id).regex).ok, true);
  }
  assert.equal(steps(L.defaults), 15);
});

test('preset 4: the sets and transitions of SPEC.md', () => {
  const s = end(preset('ana'));
  assert.deepEqual(sets(s), {
    A: [0, 1, 2, 3, 5, 8, 11], B: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12], C: [1, 2, 3, 5, 6, 7, 8, 10, 11],
    D: [1, 2, 3, 5, 8, 9, 10, 11], E: [1, 2, 3, 5, 8, 9, 10, 11, 13], F: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 14]
  });
  assert.deepEqual(rows(s), {
    A: { a: 'B', b: 'C', n: 'D' }, B: { a: 'B', b: 'C', n: 'E' }, C: { a: 'B', b: 'C', n: 'D' },
    D: { a: 'B', b: 'C', n: 'D' }, E: { a: 'F', b: 'C', n: 'D' }, F: { a: 'B', b: 'C', n: 'E' }
  });
});

// ── the languages: DFA and NFA against the platform's regex engine on every short word ──

function words(alpha, max) {
  const out = [''];
  let layer = [''];
  for (let n = 1; n <= max; n++) { layer = layer.flatMap((w) => alpha.map((c) => w + c)); out.push(...layer); }
  return out;
}
function dfaAccepts(s, w) {
  let q = 'A';
  for (const c of w) { q = (s.dfa.trans[q] || {})[c]; if (!q) return false; }
  return s.dfa.states.find((d) => d.name === q).accepting;
}
function nfaAccepts(s, w) {
  let cur = L.closure([s.nfa.start], s.nfa.edges);
  for (const c of w) cur = L.closure(L.move(cur, c, s.nfa.edges), s.nfa.edges);
  return cur.includes(s.nfa.accept);
}

test('the NFA and the DFA accept exactly the regex\'s language (words up to length 6)', () => {
  const regexes = ['(a|b)*abb', 'a|b', 'a*', '(a|b|n)*ana', 'a(bc)', 'a**', '(ab|b)*a', 'a*b*', '(a|b)*', 'ab|cd',
    '(a*b)*', 'a(b|c)*d', '((a))b', 'a|b|c|d', '(a|ab)(c|bcd)', 'ba*|ab*'];
  for (const src of regexes) {
    const s = last(src), re = new RegExp('^(?:' + src.replace(/\*+/g, '*') + ')$'); // (a*)* = a*; the engine refuses a**
    for (const w of words(s.alphabet, s.alphabet.length > 3 ? 4 : 6)) {
      assert.equal(dfaAccepts(s, w), re.test(w), src + ' DFA ' + JSON.stringify(w));
      assert.equal(nfaAccepts(s, w), re.test(w), src + ' NFA ' + JSON.stringify(w));
    }
  }
});

test('preset 4 accepts exactly the words over {a, b, n} that end in "ana"', () => {
  const s = end(preset('ana'));
  for (const w of words(['a', 'b', 'n'], 6)) assert.equal(dfaAccepts(s, w), w.endsWith('ana'), w);
});

// ── layout ──

test('layout: no two NFA states share a place at any step', () => {
  for (const src of [...L.PRESETS.map((x) => x.regex), 'a(bc)', 'a**', '(a|ab)(c|bcd)', 'ab|cd', 'a|b|c|d']) {
    for (const s of L.run(src)) {
      const lay = L.nfaLayout(s);
      assert.deepEqual(Object.keys(lay.pos).map(Number).sort((a, b) => a - b), s.nfa.states, src + ' every state placed');
      const seen = new Set();
      for (const id of s.nfa.states) {
        const k = lay.pos[id].join();
        assert.ok(!seen.has(k), src + ' step ' + s.ti + ' overlap at ' + k);
        seen.add(k);
      }
    }
  }
});

test('layout: the fragment keeps its start at the left on the centre line, and the box covers every step', () => {
  const s = last('(a|b)*abb'), lay = L.nfaLayout(s), box = L.nfaBox('(a|b)*abb');
  assert.deepEqual(lay.pos[0], [0, 0]);
  assert.deepEqual(lay.pos[10], [lay.w, 0]);
  assert.equal(box.w, 9); // the stack never gets wider than the finished NFA here
  for (const st of L.run('(a|b)*abb')) {
    const l = L.nfaLayout(st);
    for (const id of Object.keys(l.pos)) {
      assert.ok(l.pos[id][0] <= box.w && -l.pos[id][1] <= box.up && l.pos[id][1] <= box.down);
    }
  }
  // the star's two arcs: back edge above, bypass below
  assert.ok(lay.bend['6>1'] < 0);
  assert.ok(lay.bend['0>7'] > 0);
});

// a seeded generator of small regexes over {a, b, c} (LCG), for the layout checks
function regexes(seed, count) {
  let x = seed >>> 0;
  const r = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; };
  const gen = (d) => {
    const v = r();
    if (d > 3 || v < 0.3) return 'abc'[Math.floor(r() * 3)];
    if (v < 0.5) return '(' + gen(d + 1) + ')*';
    if (v < 0.75) return gen(d + 1) + gen(d + 1);
    return '(' + gen(d + 1) + '|' + gen(d + 1) + ')';
  };
  const out = [];
  while (out.length < count) { const src = gen(0); if (L.check(src).ok) out.push(src); }
  return out;
}
function along(sh, t) {
  const p = sh.pts, n = p.length - 1, f = Math.min(n - 1e-9, t * n), i = Math.floor(f), u = f - i;
  return [p[i][0] + (p[i + 1][0] - p[i][0]) * u, p[i][1] + (p[i + 1][1] - p[i][1]) * u];
}

test('layout: no edge passes through a state it does not join, and every edge stays inside the box', () => {
  const COL = 100, ROW = 92, CLEAR = 32; // the page's column and row in drawing units; state radius 29
  const srcs = [...L.PRESETS.map((x) => x.regex), '(a|b*)*', '(b|(ab)*)*', 'c|a*(a*|b*)', '((b|(c)*)ac)*', ...regexes(7, 300)];
  for (const src of srcs) {
    const box = L.nfaBox(src);
    for (const st of L.run(src)) {
      const lay = L.nfaLayout(st);
      for (const e of st.nfa.edges) {
        const sh = L.edgeShape(lay, e.from, e.to);
        for (let i = 0; i <= 40; i++) {
          const q = along(sh, i / 40);
          assert.ok(q[1] >= -box.up && q[1] <= box.down && q[0] >= 0 && q[0] <= box.w, src + ' edge outside the box');
          if (i === 0 || i === 40) continue;
          for (const id of st.nfa.states) {
            if (id === e.from || id === e.to) continue;
            const p = lay.pos[id];
            assert.ok(Math.hypot((q[0] - p[0]) * COL, (q[1] - p[1]) * ROW) >= CLEAR, `${src}: edge ${e.from}→${e.to} crosses state ${id}`);
          }
        }
      }
    }
  }
});

test('layout: the shorter union branch runs level to the last column, then to the accept', () => {
  const s = last('a|bc'), lay = L.nfaLayout(s);
  const sh = L.edgeShape(lay, 2, 6); // a's accept 2 → the union's accept 6
  assert.equal(sh.kind, 'via');
  assert.deepEqual(sh.pts[1], [lay.w - 1, lay.pos[2][1]]);
  assert.equal(L.edgeShape(lay, 5, 6).kind, 'line'); // the longer branch (bc) goes straight
});

test('layout: parse tree and DFA positions', () => {
  const s = last('(a|b)*abb'), t = L.treeLayout(s.tree);
  assert.equal(t.cols, 5);
  assert.equal(t.rows, 6);
  assert.deepEqual(t.pos[s.tree.length - 1], [t.pos[s.tree.length - 1][0], 0]);
  const d = L.dfaLayout(['A', 'B']);
  assert.deepEqual(d.A, [-1, 0]);
  assert.deepEqual(d.B, [1, 0]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of L.PRESETS) {
    const p = P({ regex: pr.regex });
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = preset('ana');
  const forward = [];
  let s = L.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = preset('abb');
  let s = L.initial(p);
  for (let n = 1; n <= steps(p); n++) {
    const copy = structuredClone(s);
    const next = L.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('a rejected regex gives an error state with one step that changes nothing', () => {
  const p = typed('a+');
  assert.equal(steps(p), 1);
  const s = at(p, 0);
  assert.equal(s.phase, 'error');
  assert.deepEqual(at(p, 1), s);
  assert.equal(at(typed('abababab'), 0).error.code, 'steps');
  assert.equal(at(typed('abcde'), 0).error.code, 'symbols');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(L.defaults), 'meta.steps matches the default regex');
  assert.match(html, /presets:\s*L\.PRESETS\.map/, 'the page takes its presets from the model');
  assert.deepEqual(L.PRESETS.map((x) => x.id), ['abb', 'aorb', 'astar', 'ana']);
  for (const pr of L.PRESETS) assert.equal(L.check(pr.regex).ok, true, pr.id);
});
