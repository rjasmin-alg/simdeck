// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the quick poll's model (SPEC.md). Run: node --test sims/quick-poll/
// Rule numbers are SPEC.md's. Tie-breaks first.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const V = ['voter0001', 'voter0002', 'voter0003', 'voter0004', 'voter0005', 'voter0006', 'voter0007'];
const ballot = (s, voter, option, at = 0) => ({ pollId: s.pollId, voter, option, at });
/** A poll with these votes, in order: [[voter, option], …]. */
function polled(kind, pairs) {
  let s = logic.create(kind, 1);
  pairs.forEach(([v, o], i) => { s = logic.vote(s, ballot(s, v, o, i)); });
  return s;
}
const pct = (counts) => {
  const opts = ['A', 'B', 'C', 'D'].slice(0, counts.length);
  const c = {};
  opts.forEach((l, i) => { c[l] = counts[i]; });
  const p = logic.percents(c, opts);
  return opts.map((l) => p[l]);
};

// ── tie-breaks ──

test('rule 5: equal counts always get equal percentages, even when the sum is then not 100', () => {
  assert.deepEqual(pct([1, 1, 1]), [33, 33, 33]);
  assert.deepEqual(pct([2, 2, 2, 1]), [28, 28, 28, 14]);
  assert.deepEqual(pct([7, 7, 7, 2]), [30, 30, 30, 9]);
});

test('rule 5: a tie group that fits takes the leftover points together', () => {
  assert.deepEqual(pct([3, 3, 1]), [43, 43, 14]);
  assert.deepEqual(pct([2, 2, 1]), [40, 40, 20]);
  assert.deepEqual(pct([1, 1, 1, 1]), [25, 25, 25, 25]);
  assert.deepEqual(pct([1, 1]), [50, 50]);
});

test('rule 5: equal remainders, the larger count is served first', () => {
  // 1, 1, 4 of 6: all three remainders are 4/6; 4 takes the 1st point, the tied pair does not fit in the 1 left
  assert.deepEqual(pct([1, 1, 4]), [16, 16, 67]);
});

test('rule 5: largest remainder; the sum is 100 without ties', () => {
  assert.deepEqual(pct([10, 6, 4, 3]), [44, 26, 17, 13]);
  assert.deepEqual(pct([1, 2, 3, 4]), [10, 20, 30, 40]);
  assert.deepEqual(pct([2, 1]), [67, 33]);
  assert.deepEqual(pct([5, 0, 0, 0]), [100, 0, 0, 0]);
  assert.deepEqual(pct([0, 0, 0, 0]), [0, 0, 0, 0]);
});

test('rule 6: ballot checks in order: voter, poll, phase, option, then same / changed / recorded', () => {
  let s = logic.create('yesno', 3);
  // a bad voter id wins over everything: wrong poll, closed and a letter yes/no lacks
  assert.equal(logic.check(logic.close(s), { pollId: 2, voter: 'Ana', option: 'C' }), 'invalid-voter');
  // then the poll id, before the phase
  assert.equal(logic.check(logic.close(s), { pollId: 2, voter: V[0], option: 'C' }), 'stale');
  // then the phase, before the letter
  assert.equal(logic.check(logic.close(s), ballot(s, V[0], 'C')), 'closed');
  assert.equal(logic.check(s, ballot(s, V[0], 'C')), 'invalid-option');
  assert.equal(logic.check(s, ballot(s, V[0], 'A')), 'recorded');
  s = logic.vote(s, ballot(s, V[0], 'A'));
  assert.equal(logic.check(s, ballot(s, V[0], 'A')), 'same');
  assert.equal(logic.check(s, ballot(s, V[0], 'B')), 'changed');
});

// ── rules ──

test('rule 1: one vote per voter; a later vote replaces the earlier one, the total stays', () => {
  let s = polled('abcd', [[V[0], 'A'], [V[1], 'A'], [V[2], 'C']]);
  assert.deepEqual(logic.tally(s), { A: 2, B: 0, C: 1, D: 0, total: 3 });
  s = logic.vote(s, ballot(s, V[0], 'B', 9));
  assert.deepEqual(logic.tally(s), { A: 1, B: 1, C: 1, D: 0, total: 3 });
  assert.deepEqual(s.votes[V[0]], { option: 'B', at: 9 });
  const same = logic.vote(s, ballot(s, V[0], 'B', 10));
  assert.equal(same, s, 'the same option again changes nothing, not even at');
});

test('rule 2: votes after close are rejected, also after reveal; reopen accepts them again', () => {
  const s = polled('abcd', [[V[0], 'A']]);
  const closed = logic.close(s);
  assert.equal(closed.phase, 'closed');
  assert.equal(logic.vote(closed, ballot(closed, V[1], 'B')), closed);
  assert.equal(logic.vote(closed, ballot(closed, V[0], 'B')), closed, 'no change of mind after close');
  const revealed = logic.reveal(closed);
  assert.equal(logic.vote(revealed, ballot(revealed, V[1], 'B')), revealed);
  const again = logic.open(closed);
  assert.equal(again.phase, 'open');
  assert.equal(logic.tally(logic.vote(again, ballot(again, V[1], 'B'))).total, 2);
});

test('rule 3: before reveal the view has the total only; after it counts, percentages and the correct mark', () => {
  let s = logic.setCorrect(polled('abcd', [[V[0], 'A'], [V[1], 'B'], [V[2], 'B']]), 'B');
  for (const x of [s, logic.close(s)]) {
    const v = logic.view(x);
    assert.equal(v.total, 3);
    assert.equal(v.shown, false);
    assert.equal(v.correct, null);
    assert.equal(v.sum, null);
    for (const r of v.rows) {
      assert.equal(r.count, null);
      assert.equal(r.pct, null);
      assert.equal(r.correct, false);
      assert.equal(r.top, false);
    }
  }
  const v = logic.view(logic.reveal(s));
  assert.equal(v.shown, true);
  assert.equal(v.correct, 'B');
  assert.deepEqual(v.rows.map((r) => [r.option, r.count, r.pct, r.top, r.correct]),
    [['A', 1, 33, false, false], ['B', 2, 67, true, true], ['C', 0, 0, false, false], ['D', 0, 0, false, false]]);
  assert.equal(v.sum, 100);
});

test('rule 3: reveal closes an open poll; a revealed poll cannot be reopened', () => {
  const s = logic.reveal(polled('abcd', [[V[0], 'A']]));
  assert.equal(s.phase, 'revealed');
  assert.equal(logic.open(s), s);
  assert.equal(logic.close(s), s);
  assert.equal(logic.reveal(s), s);
  assert.equal(logic.check(s, ballot(s, V[1], 'A')), 'closed');
});

test('rule 3: reveal works from closed too (the usual Space path: close, then reveal)', () => {
  const s = logic.setCorrect(logic.close(polled('abcd', [[V[0], 'A']])), 'A');
  const r = logic.reveal(s);
  assert.equal(r.phase, 'revealed');
  assert.equal(logic.view(r).correct, 'A');
});

test('rule 3: a stored revealed poll stays revealed (no votes after a reload)', () => {
  const s = logic.reveal(polled('abcd', [[V[0], 'A']]));
  const back = logic.sanitize(JSON.parse(JSON.stringify(s)));
  assert.equal(back.phase, 'revealed');
  assert.equal(logic.vote(back, ballot(back, V[1], 'B')), back);
});

test('rule 4: voter ids are 8–32 lower-case letters and digits; names are refused', () => {
  const s = logic.create('abcd', 1);
  for (const bad of ['Ana', 'ana horvat', 'Voter0001', 'abc1234', 'a'.repeat(33), 12345678, null, undefined, 'ana.horvat']) {
    assert.equal(logic.check(s, { pollId: 1, voter: bad, option: 'A' }), 'invalid-voter', String(bad));
  }
  for (const ok of ['abcd1234', 'a'.repeat(32), '0123456789abcdef']) {
    assert.equal(logic.check(s, { pollId: 1, voter: ok, option: 'A' }), 'recorded', ok);
  }
  assert.equal(logic.check(s, null), 'invalid-voter');
});

test('rule 4: a vote stores the option and at, nothing else', () => {
  let s = logic.create('abcd', 1);
  s = logic.vote(s, { pollId: 1, voter: V[0], option: 'D', at: 5, name: 'Ana', device: 'x' });
  assert.deepEqual(s.votes, { [V[0]]: { option: 'D', at: 5 } });
});

test('rule 4: a ballot without a numeric at stores 0, so the state stays JSON-safe', () => {
  let s = logic.create('abcd', 1);
  s = logic.vote(s, { pollId: 1, voter: V[0], option: 'A' });
  s = logic.vote(s, { pollId: 1, voter: V[1], option: 'B', at: NaN });
  assert.deepEqual(s.votes, { [V[0]]: { option: 'A', at: 0 }, [V[1]]: { option: 'B', at: 0 } });
});

test('rule 6: an id that is also an object property name is still just an id', () => {
  const s = logic.create('abcd', 1);
  assert.equal(logic.check(s, { pollId: 1, voter: 'constructor', option: 'A' }), 'recorded');
  assert.deepEqual(logic.tally(logic.vote(s, { pollId: 1, voter: 'constructor', option: 'A' })).A, 1);
});

test('rule 6: the poll id must match exactly (a string "1" is another poll)', () => {
  const s = logic.create('abcd', 1);
  assert.equal(logic.check(s, { pollId: '1', voter: V[0], option: 'A' }), 'stale');
});

test('rule 6: a ballot for another poll is stale (a phone still on the last question)', () => {
  const s = logic.reset(polled('abcd', [[V[0], 'A']]));
  assert.equal(s.pollId, 2);
  assert.equal(logic.vote(s, { pollId: 1, voter: V[0], option: 'B' }), s);
});

test('rule 6: yes/no has only A and B', () => {
  const s = logic.create('yesno', 1);
  assert.deepEqual(s.options, ['A', 'B']);
  assert.deepEqual(logic.tally(s), { A: 0, B: 0, total: 0 });
  assert.equal(logic.vote(s, ballot(s, V[0], 'C')), s);
  assert.equal(logic.vote(s, ballot(s, V[0], 'total')), s);
});

test('rule 7: a new question is a new open poll with no votes; settings stay', () => {
  let s = logic.setText(logic.setCorrect(polled('abcd', [[V[0], 'A'], [V[1], 'C']]), 'C'), 'Q1', { A: 'x', B: 'y' });
  s = logic.reveal(s);
  const n = logic.reset(s, 'Q2');
  assert.equal(n.pollId, s.pollId + 1);
  assert.equal(n.phase, 'open');
  assert.deepEqual(n.votes, {});
  assert.equal(n.question, 'Q2');
  assert.equal(n.correct, 'C');
  assert.deepEqual(n.texts, { A: 'x', B: 'y', C: '', D: '' });
  assert.equal(logic.reset(s).question, 'Q1', 'no new question keeps the old one');
  assert.equal(logic.reset(s, '  a   b ' + 'x'.repeat(200)).question, ('a b ' + 'x'.repeat(200)).slice(0, 140), 'a new question is cut too');
  assert.equal(logic.create('abcd', 0).pollId, 1);
  assert.equal(logic.create('abcd', 2.5).pollId, 1);
});

test('rule 7: another kind is a new poll; the same kind changes nothing', () => {
  const s = logic.setCorrect(polled('abcd', [[V[0], 'A']]), 'D');
  assert.equal(logic.setKind(s, 'abcd'), s);
  const y = logic.setKind(s, 'yesno');
  assert.equal(y.pollId, 2);
  assert.deepEqual(y.options, ['A', 'B']);
  assert.deepEqual(y.votes, {});
  assert.equal(y.correct, null, 'D does not exist in yes/no');
  assert.equal(logic.setKind(logic.setText(s, 'Q', {}), 'yesno').question, 'Q', 'the question carries over');
  assert.equal(logic.setKind(logic.setCorrect(s, 'B'), 'yesno').correct, 'B');
  assert.equal(logic.setKind(s, 'nonsense').kind, 'abcd');
});

test('rule 8: the correct answer is a letter of the poll, never in a self-assessment', () => {
  const s = logic.create('abcd', 1);
  assert.equal(logic.setCorrect(s, 'C').correct, 'C');
  assert.equal(logic.setCorrect(s, 'none').correct, null);
  assert.equal(logic.setCorrect(s, 'E').correct, null);
  assert.equal(logic.setCorrect(logic.create('yesno', 1), 'C').correct, null);
  assert.equal(logic.setCorrect(logic.create('confidence', 1), 'A').correct, null);
  assert.equal(logic.setCorrect(s, 'none'), s, 'no change returns the same state');
});

test('rule 9: lecturer text is trimmed, collapsed and cut; votes stay', () => {
  const s = polled('yesno', [[V[0], 'A']]);
  const t = logic.setText(s, '  Is   it\n on? ', { A: ' Da ', B: 'x'.repeat(80), C: 'ignored' });
  assert.equal(t.question, 'Is it on?');
  assert.deepEqual(t.texts, { A: 'Da', B: 'x'.repeat(60) });
  assert.equal(logic.setText(s, 'q'.repeat(200), {}).question.length, 140);
  assert.equal(logic.tally(t).total, 1);
  assert.equal(logic.setText(t, 'Is it on?', { A: 'Da', B: 'x'.repeat(60) }), t);
  // cut by characters, not UTF-16 units: an emoji at the limit stays whole or goes whole
  const e = logic.setText(s, '', { A: 'x'.repeat(59) + '😀' + 'y' }).texts.A;
  assert.equal(e, 'x'.repeat(59) + '😀');
  assert.equal(Array.from(e).length, 60);
});

test('rule 10: join codes: base 31 without look-alikes, wrapping at 31^4', () => {
  assert.equal(logic.joinCode(0), '2222');
  assert.equal(logic.joinCode(1), '2223');
  assert.equal(logic.joinCode(31), '2232');
  assert.equal(logic.joinCode(923520), 'ZZZZ');
  assert.equal(logic.joinCode(923521), '2222');
  assert.equal(logic.joinCode(-1), '2223');
  assert.equal(logic.joinCode(31.9), '2232', 'fractions are dropped');
  for (let i = 0; i < 2000; i += 7) assert.match(logic.joinCode(i * 461), /^[2-9A-HJKMNP-Z]{4}$/);
});

test('the projector view marks the most chosen bars (ties all marked) only after reveal', () => {
  const s = logic.reveal(polled('abcd', [[V[0], 'A'], [V[1], 'B'], [V[2], 'B'], [V[3], 'A']]));
  assert.deepEqual(logic.view(s).rows.map((r) => r.top), [true, true, false, false]);
  assert.deepEqual(logic.view(logic.reveal(logic.create('abcd', 1))).rows.map((r) => r.top), [false, false, false, false]);
  assert.equal(logic.view(logic.reveal(polled('abcd', [[V[0], 'A'], [V[1], 'B'], [V[2], 'C']]))).sum, 99);
});

test('sanitize repairs a stored poll and refuses junk', () => {
  assert.equal(logic.sanitize(null), null);
  assert.equal(logic.sanitize({ kind: 'abc' }), null);
  const s = logic.setCorrect(polled('abcd', [[V[0], 'A'], [V[1], 'D']]), 'D');
  assert.deepEqual(logic.sanitize(JSON.parse(JSON.stringify(logic.close(s)))), logic.close(s));
  const bad = logic.sanitize({ kind: 'yesno', pollId: -4, phase: 'weird', correct: 'D',
    votes: { Ana: { option: 'A' }, [V[0]]: { option: 'C' }, [V[1]]: { option: 'B', at: 'x' } } });
  assert.equal(bad.pollId, 1);
  assert.equal(bad.phase, 'open');
  assert.equal(bad.correct, null);
  assert.deepEqual(bad.votes, { [V[1]]: { option: 'B', at: 0 } });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe after every action', () => {
  let s = logic.create('abcd', 1);
  const acts = [(x) => logic.vote(x, ballot(x, V[0], 'A', 1)), (x) => logic.setText(x, 'Q', { A: 'a' }),
    (x) => logic.setCorrect(x, 'A'), logic.close, logic.open, logic.reveal, (x) => logic.reset(x, 'Q2'),
    (x) => logic.setKind(x, 'confidence')];
  for (const a of acts) { s = a(s); assert.deepEqual(JSON.parse(JSON.stringify(s)), s); }
  assert.deepEqual(JSON.parse(JSON.stringify(logic.view(s))), logic.view(s));
});

test('the model is deterministic and does not mutate its input', () => {
  const s = polled('abcd', [[V[0], 'A'], [V[1], 'B']]);
  const copy = structuredClone(s);
  assert.deepEqual(logic.vote(s, ballot(s, V[2], 'C')), logic.vote(s, ballot(s, V[2], 'C')));
  logic.vote(s, ballot(s, V[0], 'D')); logic.close(s); logic.reveal(s); logic.reset(s, 'x'); logic.setKind(s, 'yesno');
  logic.setCorrect(s, 'A'); logic.setText(s, 'x', { A: 'y' }); logic.view(s); logic.tally(s);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page metadata matches the model: a tool, no steps; presets use model params', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'tool');
  assert.equal(meta.steps, undefined);
  assert.ok(!('step' in logic), 'no step function');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
