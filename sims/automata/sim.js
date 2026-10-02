/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for automata: four machines read one input word, one symbol per step (adopted from
   single-page-labs/automati-dijagrami-demo.html). The machines and their languages are the original's:
     dfa  accepts exactly "banana"; any wrong symbol leads to the dead state;
     nfa  accepts every word that ends in "ana"; the set of active states is followed in parallel;
     pda  accepts b aⁿ n aⁿ (n ≥ 0): push A for each a before the middle n, pop one A for each a after it;
     tm   accepts a word that contains "ana" anywhere; it reads the tape left to right and halts in ACCEPT or REJECT.
   One step is one transition. The DFA and the NFA take one more step at the end of the input to decide; the PDA
   decides with its ε-move (or a rejection) once the input is used up; the TM halts when it reaches ACCEPT, or reads
   the blank in any other state. So the number of steps depends on the machine and the word (steps(params)).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON: machine states are strings, the NFA's
   active set is a sorted array, the stack an array with its top last. Each step records its event in `ev` (kind,
   symbol, the transitions taken as [from, to] pairs) for the page's diagram and caption. */
(function (root) {
  'use strict';

  var MACHINES = ['dfa', 'nfa', 'pda', 'tm'];
  // The original's example words for all four machines, plus baanaa (a PDA word with n = 2) and bn (n = 0).
  // '' is the empty word ε.
  var WORDS = ['banana', '', 'ana', 'bana', 'baanaa', 'bn', 'banan', 'bananaa', 'anana', 'bandana', 'ananas', 'nana',
    'baba', 'baan', 'banaa', 'baana', 'bbb'];
  var TARGET = 'banana';       // the DFA's one word
  var BLANK = '□';             // the TM's blank symbol
  var GUARD = 100;             // a run never takes more steps than this (the longest word takes 8)

  var START = { dfa: 'q0', nfa: 'q0', pda: 'q0', tm: 'q0' };
  var ACCEPTING = { dfa: ['q6'], nfa: ['q3'], pda: ['q3'], tm: ['ACCEPT'] };

  function clone(s) { return JSON.parse(JSON.stringify(s)); }
  function sorted(xs) { return xs.slice().sort(); }

  function initial(params) {
    var m = params.machine, w = String(params.word);
    return {
      machine: m,
      word: w,
      pos: 0,                                  // input position, or the TM's head
      state: START[m],                         // dfa, pda, tm
      active: m === 'nfa' ? ['q0'] : [],       // nfa only, sorted
      stack: [],                               // pda only, top last
      path: m === 'nfa' ? [] : [START[m]],     // dfa, pda, tm: the state after every transition taken
      done: false,
      accepted: false,
      ev: null
    };
  }

  function finish(s, ok) { s.done = true; s.accepted = ok; }

  // ── DFA: exactly "banana" ──
  function stepDFA(s) {
    var w = s.word;
    if (s.pos >= w.length) {
      var ok = ACCEPTING.dfa.indexOf(s.state) >= 0;
      finish(s, ok);
      return { kind: ok ? 'endAccept' : 'endReject', state: s.state, edges: [] };
    }
    var ch = w[s.pos], from = s.state;
    s.pos++;
    if (from === 'dead') return { kind: 'deadStay', sym: ch, edges: [['dead', 'dead']] };
    var i = Number(from.slice(1));
    if (i < TARGET.length && ch === TARGET[i]) {
      s.state = 'q' + (i + 1);
      return { kind: 'move', sym: ch, from: from, to: s.state, edges: [[from, s.state]] };
    }
    s.state = 'dead';
    return { kind: 'toDead', sym: ch, from: from, expected: i < TARGET.length ? TARGET[i] : null, edges: [[from, 'dead']] };
  }

  // ── NFA: ends in "ana". q0 loops on every symbol; q0 -a-> q1 -n-> q2 -a-> q3; q3 has no way out ──
  function nfaMoves(st, ch) {
    if (st === 'q0') return ch === 'a' ? ['q0', 'q1'] : ['q0'];
    if (st === 'q1') return ch === 'n' ? ['q2'] : [];
    if (st === 'q2') return ch === 'a' ? ['q3'] : [];
    return [];
  }

  function stepNFA(s) {
    if (s.pos >= s.word.length) {
      var ok = s.active.some(function (q) { return ACCEPTING.nfa.indexOf(q) >= 0; });
      finish(s, ok);
      return { kind: ok ? 'endAccept' : 'endReject', active: s.active.slice(), edges: [] };
    }
    var ch = s.word[s.pos], next = [], edges = [], dropped = [];
    s.active.forEach(function (q) {
      var to = nfaMoves(q, ch);
      if (!to.length) dropped.push(q);
      to.forEach(function (r) { edges.push([q, r]); if (next.indexOf(r) < 0) next.push(r); });
    });
    s.pos++;
    s.active = sorted(next);
    return { kind: 'nfaRead', sym: ch, edges: edges, dropped: dropped, active: s.active.slice() };
  }

  // ── PDA: b aⁿ n aⁿ. q0 -b, push $-> q1 (a: push A) -n-> q2 (a: pop A) -ε, $-> q3 ──
  function top(s) { return s.stack.length ? s.stack[s.stack.length - 1] : null; }

  function stepPDA(s) {
    var end = s.pos >= s.word.length, ch = end ? null : s.word[s.pos];
    if (s.state === 'q0') {
      if (ch === 'b') { s.stack.push('$'); s.state = 'q1'; s.pos++; return { kind: 'pdaStart', sym: ch, edges: [['q0', 'q1']] }; }
      finish(s, false);
      return { kind: 'pdaNoB', sym: ch, edges: [] };
    }
    if (s.state === 'q1') {
      if (ch === 'a') { s.stack.push('A'); s.pos++; return { kind: 'pdaPush', sym: ch, edges: [['q1', 'q1']] }; }
      if (ch === 'n') { s.state = 'q2'; s.pos++; return { kind: 'pdaMiddle', sym: ch, edges: [['q1', 'q2']] }; }
      finish(s, false);
      return { kind: 'pdaBadQ1', sym: ch, edges: [] };
    }
    // q2
    if (ch === 'a' && top(s) === 'A') { s.stack.pop(); s.pos++; return { kind: 'pdaPop', sym: ch, edges: [['q2', 'q2']] }; }
    if (end && top(s) === '$') {
      s.stack.pop(); s.state = 'q3'; finish(s, true);
      return { kind: 'pdaAccept', sym: null, edges: [['q2', 'q3']] };
    }
    finish(s, false);
    if (end) return { kind: 'pdaLeft', sym: null, left: s.stack.filter(function (x) { return x === 'A'; }).length, edges: [] };
    return { kind: 'pdaBadQ2', sym: ch, top: top(s), edges: [] };
  }

  // ── TM: contains "ana". Reads left to right (writes nothing), halts in ACCEPT or REJECT ──
  function stepTM(s) {
    var ch = s.pos < s.word.length ? s.word[s.pos] : BLANK, from = s.state;
    if (ch === BLANK) {
      s.state = 'REJECT'; finish(s, false);
      return { kind: 'tmReject', sym: ch, from: from, edges: [[from, 'REJECT']] };
    }
    var to, kind;
    if (from === 'q0') { to = ch === 'a' ? 'qA' : 'q0'; kind = ch === 'a' ? 'tmA' : 'tmSkip'; }
    else if (from === 'qA') { to = ch === 'n' ? 'qAN' : ch === 'a' ? 'qA' : 'q0'; kind = ch === 'n' ? 'tmAN' : ch === 'a' ? 'tmAgain' : 'tmBack'; }
    else { to = ch === 'a' ? 'ACCEPT' : 'q0'; kind = ch === 'a' ? 'tmAccept' : 'tmBack'; }
    s.state = to;
    s.pos++;
    if (to === 'ACCEPT') finish(s, true);
    return { kind: kind, sym: ch, from: from, edges: [[from, to]] };
  }

  var STEPPERS = { dfa: stepDFA, nfa: stepNFA, pda: stepPDA, tm: stepTM };

  /** One transition. A halted machine stays as it is. */
  function advance(prev) {
    var s = clone(prev);
    if (s.done) { s.ev = null; return s; }
    s.ev = STEPPERS[s.machine](s);
    if (s.machine !== 'nfa' && s.ev.edges.length) s.path.push(s.state);
    return s;
  }

  /** How many steps the machine takes on the word before it halts. */
  function runLength(params) {
    var s = initial(params), n = 0;
    while (!s.done && n < GUARD) { s = advance(s); n++; }
    return n;
  }

  /** The tape the page shows: the word, and for the TM its blank after it. */
  function tape(s) {
    var cells = s.word.split('');
    if (s.machine === 'tm') cells.push(BLANK);
    return cells;
  }

  var logic = {
    machines: MACHINES,
    words: WORDS,
    accepting: ACCEPTING,
    BLANK: BLANK,
    defaults: { machine: 'dfa', word: 'banana' },
    steps: runLength,
    initial: initial,
    step: function (prev) { return advance(prev); },
    nfaMoves: nfaMoves,
    tape: tape
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
