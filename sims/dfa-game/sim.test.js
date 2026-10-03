// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the DFA classroom game model (sim.js): tie-breaks first, then the rules, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = 'presenter-id';
function started(over) {
  return logic.start(logic.empty(), P, Object.assign({ taskType: 'exact', target: 'ab', alphabet: 'a,b', expectedPlayers: 2 }, over)).game;
}
function moves(game, list) {
  // list: [[playerId, action], …]; returns { game, events }
  let g = game, events = [];
  for (const [id, a] of list) { const r = logic.submit(g, id, id.toUpperCase(), a); g = r.game; events = events.concat(r.events); }
  return { game: g, events };
}
const keys = (events) => events.map((e) => e.key);
/** A DFA for exactly "ab" over {a, b}: q0 -a-> q1 -b-> q2 (accepting); everything else to a dead state d. */
function abDfa() {
  const g = started({ expectedPlayers: 1 });
  let s = g;
  const play = (a) => { s = logic.submit(s, 'p1', 'P1', a).game; };
  ['q0', 'q1', 'q2', 'd'].forEach((q) => play({ type: 'ADD_STATE', state: q }));
  play({ type: 'SET_START', state: 'q0' });
  play({ type: 'TOGGLE_ACCEPT', state: 'q2' });
  [['q0', 'a', 'q1'], ['q0', 'b', 'd'], ['q1', 'a', 'd'], ['q1', 'b', 'q2'], ['q2', 'a', 'd'], ['q2', 'b', 'd'], ['d', 'a', 'd'], ['d', 'b', 'd']]
    .forEach(([from, symbol, to]) => play({ type: 'ADD_TRANSITION', from, symbol, to }));
  return s;
}

// ── tie-breaks ──

test('tie-break: a round applies its moves in submission order, so the later of two clashing transitions wins', () => {
  let g = started();
  g = moves(g, [['p1', { type: 'ADD_STATE', state: 'q0' }], ['p2', { type: 'ADD_STATE', state: 'q1' }]]).game;
  const r = moves(g, [
    ['p2', { type: 'ADD_TRANSITION', from: 'q0', symbol: 'a', to: 'q1' }],
    ['p1', { type: 'ADD_TRANSITION', from: 'q0', symbol: 'a', to: 'q0' }]
  ]);
  assert.equal(r.game.dfa.delta.q0.a, 'q0', 'p1 submitted last, so p1\'s target stays');
  assert.deepEqual(keys(r.events), ['submitted', 'submitted', 'addTransition', 'addTransition', 'roundDone']);
});

test('tie-break: two players toggling the same state in one round cancel out', () => {
  let g = moves(started(), [['p1', { type: 'ADD_STATE', state: 'q0' }], ['p2', { type: 'ADD_STATE', state: 'q0' }]]).game;
  assert.deepEqual(g.dfa.states, ['q0'], 'adding an existing state is a no-op');
  g = moves(g, [['p1', { type: 'TOGGLE_ACCEPT', state: 'q0' }], ['p2', { type: 'TOGGLE_ACCEPT', state: 'q0' }]]).game;
  assert.deepEqual(g.dfa.accept, []);
});

test('tie-break: the counterexample is the first failing word in test order, the empty word first', () => {
  const g = started();
  const v = logic.validate(g);
  assert.equal(v.pass, false);
  // no start state: everything rejects; '' is expected to reject too, 'ab' is the first expected accept
  assert.equal(v.rows[0].input, '');
  assert.equal(v.counter.input, 'ab');
  assert.deepEqual(v.counter.reason, { code: 'noStart' });
  // several failing words: the counterexample is the first of them, not the last
  const broken = JSON.parse(JSON.stringify(abDfa()));
  broken.dfa.accept.push('d');
  const w = logic.validate(broken);
  const failing = w.rows.filter((r) => !r.ok).map((r) => r.input);
  assert.ok(failing.length > 1);
  assert.equal(w.counter.input, failing[0]);
});

test('tie-break: a failing move is skipped and the rest of the round still applies', () => {
  const r = moves(started(), [['p1', { type: 'ADD_STATE', state: '  ' }], ['p2', { type: 'ADD_STATE', state: 'q0' }]]);
  assert.deepEqual(r.game.dfa.states, ['q0']);
  assert.deepEqual(r.events.find((e) => e.key === 'rejected').vars, { name: 'P1', why: 'emptyState' });
  assert.equal(r.game.round, 2);
});

test('tie-break: test words keep their first occurrence and the fixed words come before the enumeration', () => {
  const g = started({ target: 'ab' });
  const t = logic.tests(g);
  assert.deepEqual(t.slice(0, 6), ['', 'ab', 'abab', 'a', 'aba', 'aab']);
  assert.equal(new Set(t).size, t.length);
});

// ── rules ──

test('rounds close only when every expected player has moved; more joined players raise the bar', () => {
  let g = started({ expectedPlayers: 2 });
  g = logic.join(g, 'p1', 'P1').game;
  g = logic.join(g, 'p2', 'P2').game;
  g = logic.join(g, 'p3', 'P3').game;
  assert.equal(logic.required(g), 3);
  g = moves(g, [['p1', { type: 'ADD_STATE', state: 'q0' }], ['p2', { type: 'ADD_STATE', state: 'q1' }]]).game;
  assert.equal(g.round, 1, 'two of three moves in: still round 1');
  assert.deepEqual(g.dfa.states, [], 'moves wait until the round closes');
  g = moves(g, [['p3', { type: 'ADD_STATE', state: 'q2' }]]).game;
  assert.equal(g.round, 2);
  assert.deepEqual(g.dfa.states, ['q0', 'q1', 'q2']);
  assert.deepEqual(g.actions, {});
  assert.ok(g.validation, 'a closed round is validated');
});

test('one move per player per round', () => {
  let g = started({ expectedPlayers: 3 });
  g = moves(g, [['p1', { type: 'ADD_STATE', state: 'q0' }]]).game;
  const r = logic.submit(g, 'p1', 'P1', { type: 'ADD_STATE', state: 'q9' });
  assert.deepEqual(keys(r.events), ['alreadyPlayed']);
  assert.equal(r.game.actions.p1.action.state, 'q0');
});

test('no moves before the game starts', () => {
  const r = logic.submit(logic.empty(), 'p1', 'P1', { type: 'ADD_STATE', state: 'q0' });
  assert.deepEqual(keys(r.events), ['notStarted']);
  assert.deepEqual(r.game.actions, {});
});

test('the presenter\'s own move counts toward the round but the presenter is not listed as a player', () => {
  let g = started({ expectedPlayers: 2 });
  g = logic.submit(g, P, 'Pres', { type: 'ADD_STATE', state: 'q0' }).game;
  assert.deepEqual(g.players, []);
  g = logic.submit(g, 'p1', 'P1', { type: 'ADD_STATE', state: 'q1' }).game;
  assert.equal(g.round, 2);
});

test('an unknown sender joins with its move; joining again renames', () => {
  let g = logic.submit(started({ expectedPlayers: 5 }), 'p1', 'Ana', { type: 'ADD_STATE', state: 'q0' }).game;
  assert.deepEqual(g.players, [{ id: 'p1', name: 'Ana' }]);
  g = logic.join(g, 'p1', 'Ana B.').game;
  assert.deepEqual(g.players, [{ id: 'p1', name: 'Ana B.' }]);
});

test('start: refuses an empty target and a long target for the even-count task; target symbols join the alphabet', () => {
  assert.equal(logic.start(logic.empty(), P, { taskType: 'exact', target: '  ', alphabet: 'a' }).error, 'targetEmpty');
  assert.equal(logic.start(logic.empty(), P, { taskType: 'evenSymbol', target: 'ab', alphabet: 'a' }).error, 'evenNeedsOne');
  const g = logic.start(logic.empty(), P, { taskType: 'exact', target: 'banana', alphabet: 'a, x,a', expectedPlayers: 500 }).game;
  assert.deepEqual(g.alphabet, ['a', 'x', 'b', 'n']);
  assert.deepEqual(g.dfa.alphabet, ['a', 'x', 'b', 'n']);
  assert.equal(g.expectedPlayers, 80);
  assert.equal(g.round, 1);
  assert.equal(logic.start(logic.empty(), P, { taskType: 'exact', target: 'a', expectedPlayers: 0 }).game.expectedPlayers, 1);
});

test('start keeps the players but clears the automaton, the moves and the log', () => {
  let g = logic.join(started({ expectedPlayers: 3 }), 'p1', 'P1').game;
  g = moves(g, [['p1', { type: 'ADD_STATE', state: 'q0' }]]).game;
  g = logic.record(g, [{ key: 'x', vars: {} }], '10:00:00');
  const r = logic.start(g, P, { taskType: 'ends', target: 'a', alphabet: 'a,b', expectedPlayers: 3 });
  assert.deepEqual(r.game.players, [{ id: 'p1', name: 'P1' }]);
  assert.deepEqual(r.game.actions, {});
  assert.deepEqual(r.game.log, []);
  assert.deepEqual(r.events, [{ key: 'newGame', vars: { taskType: 'ends', target: 'a' } }]);
});

test('oracle: the four tasks', () => {
  const g = (taskType, target) => Object.assign(logic.empty(), { taskType, target });
  assert.equal(logic.oracle(g('exact', 'ab'), 'ab'), true);
  assert.equal(logic.oracle(g('exact', 'ab'), 'aab'), false);
  assert.equal(logic.oracle(g('ends', 'ab'), 'bab'), true);
  assert.equal(logic.oracle(g('ends', 'ab'), 'ba'), false);
  assert.equal(logic.oracle(g('contains', 'ab'), 'bbabb'), true);
  assert.equal(logic.oracle(g('contains', 'ab'), 'ba'), false);
  assert.equal(logic.oracle(g('evenSymbol', 'a'), ''), true, 'zero is even');
  assert.equal(logic.oracle(g('evenSymbol', 'a'), 'aba'), true);
  assert.equal(logic.oracle(g('evenSymbol', 'a'), 'ab'), false);
});

test('run: reasons for rejecting', () => {
  const g = abDfa();
  assert.deepEqual(logic.run(g.dfa, 'ab'), { ok: true, path: ['q0', 'q1', 'q2'], reason: { code: 'accept' } });
  assert.deepEqual(logic.run(g.dfa, 'a').reason, { code: 'reject' });
  assert.deepEqual(logic.run(g.dfa, 'ax').reason, { code: 'notInAlphabet', sym: 'x' });
  const holey = logic.applyAction(JSON.parse(JSON.stringify(g)), 'x', { type: 'REMOVE_TRANSITION', from: 'q1', symbol: 'b' });
  assert.equal(holey.key, 'removeTransition');
  const g2 = JSON.parse(JSON.stringify(g));
  logic.applyAction(g2, 'x', { type: 'REMOVE_TRANSITION', from: 'q1', symbol: 'b' });
  assert.deepEqual(logic.run(g2.dfa, 'ab').reason, { code: 'missing', from: 'q1', sym: 'b' });
  assert.deepEqual(logic.run(logic.emptyDfa(), '').reason, { code: 'noStart' });
});

test('a correct automaton passes validation; breaking one transition gives a counterexample', () => {
  const g = abDfa();
  assert.equal(logic.validate(g).pass, true);
  const broken = JSON.parse(JSON.stringify(g));
  broken.dfa.delta.q2.a = 'q2';
  const v = logic.validate(broken);
  assert.equal(v.pass, false);
  assert.equal(v.counter.input, 'aba');
  assert.equal(v.counter.expected, false);
  assert.equal(v.counter.actual, true, 'ab·a now stays in the accepting q2');
});

test('test words: only over the alphabet, at most 240, enumeration up to min(4, max(2, |target|))', () => {
  const g = started({ target: 'a', alphabet: 'a,b' });
  const t = logic.tests(g);
  assert.ok(t.includes('bb'), 'length 2 words even for a one-letter target');
  assert.ok(!t.includes('aaa'), 'no length 3 for a one-letter target');
  assert.ok(t.every((w) => [...w].every((c) => 'ab'.includes(c))));
  assert.ok(!t.includes('banana'), 'the fixed banana words need n');
  const wide = started({ target: 'abcd', alphabet: 'a,b,c,d,e,f' });
  assert.equal(logic.tests(wide).length, 240);
});

test('moves: symbols must be one character; transitions need all three parts and create missing states', () => {
  const g = started();
  const apply = (a) => { const c = JSON.parse(JSON.stringify(g)); try { return { e: logic.applyAction(c, 'X', a), g: c }; } catch (e) { return { why: e.why }; } };
  assert.equal(apply({ type: 'ADD_SYMBOL', symbol: 'ab' }).why, 'oneChar');
  assert.equal(apply({ type: 'ADD_SYMBOL', symbol: ' ' }).why, 'emptySymbol');
  assert.deepEqual(apply({ type: 'ADD_SYMBOL', symbol: 'c' }).g.alphabet, ['a', 'b', 'c']);
  assert.equal(apply({ type: 'ADD_TRANSITION', from: 'q0', symbol: '', to: 'q1' }).why, 'incomplete');
  assert.equal(apply({ type: 'ADD_TRANSITION', from: 'q0', symbol: 'ab', to: 'q1' }).why, 'oneChar');
  const r = apply({ type: 'ADD_TRANSITION', from: 'q0', symbol: 'c', to: 'q1' });
  assert.deepEqual(r.g.dfa.states, ['q0', 'q1']);
  assert.deepEqual(r.g.dfa.alphabet, ['a', 'b', 'c']);
  assert.equal(apply({ type: 'NOPE' }).why, 'unknownAction');
});

test('removing a state removes its transitions both ways, its start and accepting marks', () => {
  const g = JSON.parse(JSON.stringify(abDfa()));
  logic.applyAction(g, 'X', { type: 'REMOVE_STATE', state: 'q0' });
  logic.applyAction(g, 'X', { type: 'REMOVE_STATE', state: 'q2' });
  assert.deepEqual(g.dfa.states, ['q1', 'd']);
  assert.equal(g.dfa.start, null);
  assert.deepEqual(g.dfa.accept, []);
  assert.deepEqual(g.dfa.delta.q1, { a: 'd' });
  assert.ok(!('q0' in g.dfa.positions));
});

test('new states go on the original ellipse; layout spreads them evenly; move clamps', () => {
  const g = JSON.parse(JSON.stringify(started()));
  logic.applyAction(g, 'X', { type: 'ADD_STATE', state: 'q0' });
  assert.deepEqual(g.dfa.positions.q0, { x: 450, y: 90 });
  logic.applyAction(g, 'X', { type: 'ADD_STATE', state: 'q1' });
  assert.deepEqual(g.dfa.positions.q1, { x: 696.82, y: 205 });
  const l = logic.layout(g).game;
  assert.deepEqual(l.dfa.positions.q0, { x: 450, y: 85 });
  assert.deepEqual(l.dfa.positions.q1, { x: 450, y: 555 });
  assert.deepEqual(logic.move(l, 'q0', -10, 900).game.dfa.positions.q0, { x: 45, y: 595 });
});

test('clear keeps the alphabet and drops the moves and the validation', () => {
  let g = logic.check(abDfa()).game;
  g.actions.p9 = { playerName: 'P9', action: { type: 'ADD_STATE', state: 'z' } };
  const c = logic.clear(g).game;
  assert.deepEqual(c.dfa.states, []);
  assert.deepEqual(c.dfa.alphabet, g.alphabet);
  assert.deepEqual(c.actions, {});
  assert.equal(c.validation, null);
});

test('edges group transitions by state pair', () => {
  const e = logic.edges(abDfa().dfa);
  assert.deepEqual(e.find((x) => x.from === 'd' && x.to === 'd').symbols, ['a', 'b']);
  assert.deepEqual(e.find((x) => x.from === 'q2').symbols, ['a', 'b']);
  assert.equal(e.length, 6);
});

test('sanitize repairs an imported game and rejects what is not one', () => {
  assert.throws(() => logic.sanitize([]));
  assert.throws(() => logic.sanitize(null));
  const g = logic.sanitize({
    taskType: 'bogus', target: 7, expectedPlayers: 1e9, round: -3, extra: 1,
    players: [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }, { name: 'x' }],
    actions: { a: { playerName: 'A', action: { type: 'ADD_STATE', state: 'q' } }, b: { action: { type: 'EVIL' } } },
    dfa: { states: ['q0', 'q1', 'q0', 3], start: 'zz', accept: ['q1', 'zz'], delta: { q0: { a: 'q1', b: 'zz' } }, positions: { q0: { x: 5000, y: 10 } } },
    log: [{ at: '1', key: 'joined', vars: { name: 'A' } }, 'junk']
  });
  assert.equal(g.taskType, 'exact');
  assert.equal(g.target, 'banana');
  assert.equal(g.expectedPlayers, 80);
  assert.equal(g.round, 0);
  assert.deepEqual(g.players, [{ id: 'a', name: 'A' }]);
  assert.deepEqual(Object.keys(g.actions), ['a']);
  assert.deepEqual(g.dfa.states, ['q0', 'q1']);
  assert.equal(g.dfa.start, null);
  assert.deepEqual(g.dfa.accept, ['q1']);
  assert.deepEqual(g.dfa.delta, { q0: { a: 'q1' }, q1: {} });
  assert.deepEqual(g.dfa.positions.q0, { x: 855, y: 45 });
  assert.equal(g.log.length, 1);
  assert.ok(!('extra' in g));
  // a full game survives a round trip
  const full = logic.record(logic.check(abDfa()).game, [{ key: 'joined', vars: { name: 'A' } }], '09:00:00');
  assert.deepEqual(logic.sanitize(JSON.parse(JSON.stringify(full))), full);
});

test('record: newest first, at most 100 lines', () => {
  let g = logic.empty();
  for (let i = 0; i < 120; i++) g = logic.record(g, [{ key: 'joined', vars: { name: 'P' + i } }], String(i));
  assert.equal(g.log.length, 100);
  assert.equal(g.log[0].vars.name, 'P119');
  g = logic.record(logic.empty(), [{ key: 'a', vars: {} }, { key: 'b', vars: {} }], 't');
  assert.deepEqual(g.log.map((l) => l.key), ['b', 'a']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe after every operation', () => {
  let g = started();
  const ops = [
    (x) => logic.join(x, 'p1', 'P1'),
    (x) => logic.submit(x, 'p1', 'P1', { type: 'ADD_STATE', state: 'q0' }),
    (x) => logic.submit(x, 'p2', 'P2', { type: 'SET_START', state: 'q0' }),
    (x) => logic.layout(x), (x) => logic.move(x, 'q0', 10, 10), (x) => logic.check(x), (x) => logic.clear(x)
  ];
  for (const op of ops) { g = op(g).game; assert.deepEqual(JSON.parse(JSON.stringify(g)), g); }
});

test('the model is deterministic and does not mutate its input', () => {
  const g = abDfa();
  const copy = structuredClone(g);
  const a = { type: 'ADD_STATE', state: 'z' };
  assert.deepEqual(logic.submit(g, 'p1', 'P1', a), logic.submit(g, 'p1', 'P1', a));
  logic.submit(g, 'p1', 'P1', a); logic.join(g, 'x', 'X'); logic.layout(g); logic.move(g, 'q0', 1, 1);
  logic.clear(g); logic.check(g); logic.record(g, [{ key: 'k', vars: {} }], 't');
  logic.start(g, P, { taskType: 'ends', target: 'b', alphabet: 'a,b' });
  assert.deepEqual(g, copy);
});

test('every event, error and reason code has a string in both languages', () => {
  for (const lang of ['hr', 'en']) {
    const s = strings[lang];
    for (const k of ['joined', 'newGame', 'addState', 'addSymbol', 'addTransition', 'setStart', 'acceptOn', 'acceptOff',
      'removeState', 'removeTransition', 'submitted', 'alreadyPlayed', 'notStarted', 'rejected', 'roundDone', 'cleared',
      'imported', 'isPresenter', 'sent']) assert.ok(s['ev_' + k], lang + ' ev_' + k);
    for (const k of ['emptyState', 'emptySymbol', 'oneChar', 'incomplete', 'unknownAction', 'targetEmpty', 'evenNeedsOne', 'notAGame'])
      assert.ok(s['why_' + k], lang + ' why_' + k);
    for (const k of ['noStart', 'notInAlphabet', 'missing', 'accept', 'reject']) assert.ok(s['reason_' + k], lang + ' reason_' + k);
    for (const k of logic.TASKS) { assert.ok(s[logic.describe({ taskType: k, target: 'x' }).key], lang + ' ' + k); assert.ok(s['opt_' + k]); }
    for (const k of logic.ACTIONS) assert.ok(s['act_' + k], lang + ' act_' + k);
  }
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page metadata matches the model: a tool, no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'tool');
  assert.equal(meta.steps, undefined);
  assert.ok(!('step' in logic), 'no step function');
});
