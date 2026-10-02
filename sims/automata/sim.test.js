// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for automata's model. Run: node --test sims/automata/
// The machines and their languages are the original page's (single-page-labs/automati-dijagrami-demo.html): DFA exactly
// "banana", NFA ends in "ana", PDA b aⁿ n aⁿ, TM contains "ana". Each test is checked against the language itself
// (a regular expression or a count), so a broken transition shows up as a wrong verdict. Tie-breaks and edges first,
// then each machine's rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (machine, word) => Object.assign({}, logic.defaults, { machine, word });
const steps = (m, w) => kit.stepsOf(logic, P(m, w));
const end = (m, w) => kit.stateAt(logic, P(m, w), steps(m, w));
const states = (m, w) => { const out = []; for (let n = 0; n <= steps(m, w); n++) out.push(kit.stateAt(logic, P(m, w), n)); return out; };
const kinds = (m, w) => states(m, w).slice(1).map((s) => s.ev.kind);

// The four languages, written independently of the machines.
const LANG = {
  dfa: (w) => w === 'banana',
  nfa: (w) => /ana$/.test(w),
  pda: (w) => { const m = /^b(a*)n(a*)$/.exec(w); return !!m && m[1].length === m[2].length; },
  tm: (w) => w.includes('ana')
};
// Every word of length ≤ 6 over {a, b, n}, the original's examples and a few with another letter.
const ALL = (() => {
  const out = [''];
  let level = [''];
  for (let len = 1; len <= 6; len++) {
    level = level.flatMap((w) => ['a', 'b', 'n'].map((c) => w + c));
    out.push(...level);
  }
  return out.concat(logic.words, ['bandana', 'anas', 'bdn', 'bxna']);
})();

// ── tie-breaks and edges ──

test('the empty word: one step, and every machine rejects it', () => {
  for (const m of logic.machines) {
    assert.equal(steps(m, ''), 1, m);
    assert.equal(end(m, '').done, true, m);
    assert.equal(end(m, '').accepted, false, m);
  }
});

test('the DFA decides at the end of the input: one more step than the word has symbols', () => {
  for (const w of ['banana', 'banan', 'bananaa', 'x']) assert.equal(steps('dfa', w), w.length + 1, w);
  const s = kit.stateAt(logic, P('dfa', 'banana'), 6);
  assert.equal(s.state, 'q6');
  assert.equal(s.done, false, 'q6 after six symbols is not yet a verdict');
  assert.deepEqual(kinds('dfa', 'banana').slice(-1), ['endAccept']);
});

test('the DFA in q6 still reads on: a seventh symbol leads to the dead state, expecting the end', () => {
  const s = kit.stateAt(logic, P('dfa', 'bananaa'), 7);
  assert.equal(s.state, 'dead');
  assert.equal(s.ev.kind, 'toDead');
  assert.equal(s.ev.expected, null);
});

test('the dead state stays dead: every symbol after it is a dead → dead step, and the word is rejected', () => {
  const k = kinds('dfa', 'bandana');
  assert.deepEqual(k, ['move', 'move', 'move', 'toDead', 'deadStay', 'deadStay', 'deadStay', 'endReject']);
  assert.deepEqual(kit.stateAt(logic, P('dfa', 'bandana'), 5).ev.edges, [['dead', 'dead']]);
});

test('the NFA: q0 never dies (it loops on every symbol), so the active set is never empty', () => {
  for (const w of ALL) for (const s of states('nfa', w)) assert.ok(s.active.includes('q0'), `${w}: ${s.active}`);
});

test('the NFA: on an a, q0 takes both moves, and the active set is sorted with no duplicates', () => {
  const s = kit.stateAt(logic, P('nfa', 'aa'), 2);
  assert.deepEqual(s.ev.edges, [['q0', 'q0'], ['q0', 'q1']]);
  assert.deepEqual(s.ev.dropped, ['q1']);
  assert.deepEqual(s.active, ['q0', 'q1']);
  for (const w of ALL) for (const st of states('nfa', w)) assert.deepEqual(st.active, [...new Set(st.active)].sort());
});

test('the NFA: q3 has no way out, so a path that reached it dies on the next symbol', () => {
  const s = kit.stateAt(logic, P('nfa', 'ananas'), 6);
  assert.deepEqual(kit.stateAt(logic, P('nfa', 'ananas'), 5).active, ['q0', 'q1', 'q3']);
  assert.deepEqual(s.ev.dropped, ['q1', 'q3']);
  assert.deepEqual(s.active, ['q0']);
  assert.equal(end('nfa', 'ananas').accepted, false);
});

test('the PDA accepts n = 0: b n is in b aⁿ n aⁿ', () => {
  assert.equal(end('pda', 'bn').accepted, true);
  assert.deepEqual(kinds('pda', 'bn'), ['pdaStart', 'pdaMiddle', 'pdaAccept']);
});

test('the PDA rejects banana: the second n comes in q2', () => {
  const s = end('pda', 'banana');
  assert.equal(s.accepted, false);
  assert.equal(s.ev.kind, 'pdaBadQ2');
  assert.equal(s.ev.sym, 'n');
  assert.equal(steps('pda', 'banana'), 5);
});

test('the PDA: an a after the stack ran out of A is rejected on the spot (top is $)', () => {
  const s = end('pda', 'banaa');
  assert.equal(s.ev.kind, 'pdaBadQ2');
  assert.equal(s.ev.top, '$');
  assert.equal(s.pos, 4, 'the extra a is not consumed');
});

test('the PDA: A left on the stack at the end of the input is a rejection, with the count', () => {
  const s = end('pda', 'baana');
  assert.equal(s.ev.kind, 'pdaLeft');
  assert.equal(s.ev.left, 1);
});

test('the TM halts as soon as it finds ana, without reading the rest', () => {
  assert.equal(steps('tm', 'banana'), 4);
  const s = end('tm', 'banana');
  assert.equal(s.state, 'ACCEPT');
  assert.equal(s.pos, 4);
});

test('the TM: in qAN a symbol other than a sends it back to q0, not to qA', () => {
  const s = kit.stateAt(logic, P('tm', 'bandana'), 4);
  assert.equal(s.ev.kind, 'tmBack');
  assert.deepEqual(s.ev.edges, [['qAN', 'q0']]);
  assert.equal(end('tm', 'anna').accepted, false);
});

test('the TM: another a in qA stays in qA (aana contains ana)', () => {
  assert.deepEqual(kit.stateAt(logic, P('tm', 'aana'), 2).ev.edges, [['qA', 'qA']]);
  assert.equal(end('tm', 'aana').accepted, true);
});

test('the TM rejects on the blank from whichever state it is in, and the blank is not consumed', () => {
  for (const [w, from] of [['bbb', 'q0'], ['ba', 'qA'], ['ban', 'qAN']]) {
    const s = end('tm', w);
    assert.equal(s.state, 'REJECT', w);
    assert.deepEqual(s.ev.edges, [[from, 'REJECT']], w);
    assert.equal(s.pos, w.length, w);
  }
  assert.deepEqual(logic.tape(end('tm', 'ba')), ['b', 'a', logic.BLANK]);
});

// ── each machine against its language ──

for (const m of logic.machines) {
  test(`${m} accepts exactly its language on ${ALL.length} words`, () => {
    for (const w of ALL) assert.equal(end(m, w).accepted, LANG[m](w), `${m} on "${w}"`);
  });
}

test('a halted machine stays halted: every run ends with done, and no step after it changes anything', () => {
  for (const m of logic.machines) {
    for (const w of logic.words) {
      const n = steps(m, w);
      const last = kit.stateAt(logic, P(m, w), n);
      assert.equal(last.done, true, `${m} ${w}`);
      for (let k = 0; k < n; k++) assert.equal(kit.stateAt(logic, P(m, w), k).done, false, `${m} ${w} at ${k}`);
      const after = logic.step(last, n + 1, P(m, w));
      assert.equal(after.ev, null);
      assert.equal(after.state, last.state);
    }
  }
});

test('every run fits the step limit: at most 20 steps for every machine and offered word', () => {
  for (const m of logic.machines) for (const w of logic.words) assert.ok(steps(m, w) <= 20, `${m} ${w}: ${steps(m, w)}`);
  assert.equal(steps('dfa', 'banana'), 7, 'the default run, = sim.json steps');
});

test('every transition taken is one the diagram draws', () => {
  const drawn = {
    dfa: ['q0>q1', 'q1>q2', 'q2>q3', 'q3>q4', 'q4>q5', 'q5>q6', 'q0>dead', 'q1>dead', 'q2>dead', 'q3>dead', 'q4>dead', 'q5>dead', 'q6>dead', 'dead>dead'],
    nfa: ['q0>q0', 'q0>q1', 'q1>q2', 'q2>q3'],
    pda: ['q0>q1', 'q1>q1', 'q1>q2', 'q2>q2', 'q2>q3'],
    tm: ['q0>q0', 'q0>qA', 'qA>qA', 'qA>qAN', 'qAN>ACCEPT', 'qA>q0', 'qAN>q0', 'q0>REJECT', 'qA>REJECT', 'qAN>REJECT']
  };
  for (const m of logic.machines) {
    for (const w of ALL) {
      for (const s of states(m, w).slice(1)) for (const e of s.ev.edges) assert.ok(drawn[m].includes(e.join('>')), `${m} ${w}: ${e}`);
    }
  }
});

test('the path records the state after every transition (DFA, PDA, TM)', () => {
  assert.deepEqual(end('dfa', 'banana').path, ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
  assert.deepEqual(end('tm', 'bandana').path, ['q0', 'q0', 'qA', 'qAN', 'q0', 'qA', 'qAN', 'ACCEPT']);
  assert.deepEqual(end('pda', 'bana').path, ['q0', 'q1', 'q1', 'q2', 'q2', 'q3']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const m of logic.machines) {
    for (const w of logic.words) for (const s of states(m, w)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const m of logic.machines) {
    const p = P(m, 'bandana');
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(m, 'bandana'); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const m of logic.machines) {
    const p = P(m, 'baanaa');
    const s1 = logic.step(logic.initial(p), 1, p);
    const copy = structuredClone(s1);
    logic.step(s1, 2, p);
    assert.deepEqual(s1, copy);
  }
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every machine has its name, full name, language line and diagram note in both languages', () => {
  for (const lang of ['hr', 'en']) {
    for (const k of ['name', 'full', 'lang', 'note']) {
      for (const m of ['Dfa', 'Nfa', 'Pda', 'Tm']) assert.ok(strings[lang][k + m], `${lang} ${k}${m}`);
    }
  }
});
