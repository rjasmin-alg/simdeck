// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-regex-match: the rules of SPEC.md, tie-breaks first, then the presets' numbers, the captions and the
// template's generic block. Run: node --test sims/lnx-regex-match/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const frames = (over) => logic.frames(P(over));
const preset = (id) => logic.PRESETS.find((x) => x.id === id).params;
const span = (m) => (m ? [m.from, m.to] : null);
const bt = (pattern, text, mode = 'ERE') => span(logic.run(pattern, text, mode).match);
const posix = (pattern, text, mode = 'ERE') => span(logic.posixMatch(pattern, text, mode));
const kinds = (pattern, mode) => logic.parse(pattern, mode).tokens.map((t) => (t.lit ? 'lit:' : '') + t.kind + (t.q ? t.q : ''));
const acts = (fr) => fr.map((s) => s.act.k + (s.act.ok === undefined ? '' : s.act.ok ? '+' : '-'));
const ROOT = 'root:x:0:0:root:/root:/bin/bash';
const BIN = 'bin:x:1:1:bin:/bin:/sbin/nologin';
const OPERATOR = 'operator:x:11:0:operator:/root:/sbin/nologin';

// ── rule 8, tie-breaks first ──

test('tie-break: on a failure the newest choice point is resumed first (a stack)', () => {
  const fr = frames(preset('greedy'));
  const before = fr[7], after = fr[8];
  assert.equal(before.act.k, 'test');
  assert.equal(before.act.ok, false);
  assert.equal(after.act.k, 'back-more');
  // the newest entry (.* could stop at 3, from 4) is popped; the older three stay in order
  assert.deepEqual(before.stack.map((c) => [c.count, c.pos]), [[0, 1], [1, 2], [2, 3], [3, 4]]);
  assert.deepEqual(after.stack.map((c) => [c.count, c.pos]), [[0, 1], [1, 2], [2, 3]]);
  assert.equal(after.pos, 4);
});

test('tie-break: within a quantifier more repetitions are tried before fewer (greedy)', () => {
  assert.deepEqual(bt('a*', 'aaa'), [0, 3]);
  assert.deepEqual(bt('a?a', 'aa'), [0, 2]);
  assert.deepEqual(bt('(ab)*', 'ababx'), [0, 4]);
  // the first action of a* on aaa takes one more, it does not stop
  const fr = frames({ pattern: 'a*', text: 'aaa' });
  assert.deepEqual(acts(fr).slice(1), ['more+', 'more+', 'more+', 'more-', 'match']);
});

test('tie-break: within an alternation the left side is tried before the right', () => {
  assert.deepEqual(bt('(b|bc)', 'bc'), [0, 1]);
  assert.deepEqual(bt('(bc|b)', 'bc'), [0, 2]);
  const fr = frames({ pattern: '(x|y|z)', text: 'z' });
  // x first, then y, then z: each back-alt resumes the next branch
  assert.deepEqual(acts(fr).slice(1), ['alt', 'test-', 'back-alt', 'test-', 'back-alt', 'test+', 'match']);
  assert.deepEqual(fr.filter((s) => s.act.k === 'back-alt').map((s) => s.act.alt), [1, 2]);
});

// ── rule 1: ordinary characters match themselves; special ones describe rules ──

test('rule 1: a plain character matches itself, . any one, [ ] a set, [^ ] its complement', () => {
  assert.deepEqual(bt('abc', 'xxabc'), [2, 5]);
  assert.deepEqual(bt('a.c', 'abc'), [0, 3]);
  assert.deepEqual(bt('[xyz]', 'abz'), [2, 3]);
  assert.deepEqual(bt('[^ab]', 'abz'), [2, 3]);
  assert.deepEqual(bt('[a-c]+', 'xxbcay'), [2, 5]);
  assert.deepEqual(bt('[[:digit:]]+', 'uid=1000'), [4, 8]);
  assert.deepEqual(bt('a\\.c', 'abc a.c'), [4, 7]);
  assert.deepEqual(kinds('a.[bc]^$', 'ERE'), ['char', 'any', 'set', 'bol', 'eol']);
});

// ── rule 2: BRE vs ERE ──

test('rule 2: in BRE + ? | ( ) are ordinary characters, in ERE operators', () => {
  assert.deepEqual(kinds('ro+t', 'BRE'), ['char', 'char', 'lit:char', 'char']);
  assert.deepEqual(kinds('ro+t', 'ERE'), ['char', 'char+', 'char']);
  assert.deepEqual(kinds('^(root|bin)', 'BRE').slice(0, 2), ['bol', 'lit:char']);
  assert.deepEqual(kinds('a|b', 'BRE'), ['char', 'lit:char', 'char']);
  // the book: ro+t finds nothing without -E, and root and operator with it
  for (const line of [ROOT, BIN, OPERATOR]) assert.equal(bt('ro+t', line, 'BRE'), null);
  assert.deepEqual(bt('ro+t', ROOT, 'ERE'), [0, 4]);
  assert.notEqual(bt('ro+t', OPERATOR, 'ERE'), null);
  assert.equal(bt('ro+t', BIN, 'ERE'), null);
  // ^(root|bin): root and bin with -E, nothing without
  assert.deepEqual(bt('^(root|bin)', BIN, 'ERE'), [0, 3]);
  assert.deepEqual(bt('^(root|bin)', ROOT, 'ERE'), [0, 4]);
  assert.equal(bt('^(root|bin)', BIN, 'BRE'), null);
  // a BRE * is a quantifier except first; a + read literally does match a +
  assert.deepEqual(bt('a+b', 'a+b', 'BRE'), [0, 3]);
  assert.deepEqual(kinds('*a', 'BRE'), ['lit:char', 'char']);
  assert.deepEqual(kinds('a*', 'BRE'), ['char*']);
});

test('rule 2: the BRE/ERE switch changes the exit status of the book\'s commands (1 vs 0)', () => {
  assert.equal(at({ mode: 'BRE' }, logic.steps(P({ mode: 'BRE' }))).exit, 1);
  assert.equal(at({ mode: 'ERE' }, logic.steps(P({ mode: 'ERE' }))).exit, 0);
  const rb = preset('book-root-bin');
  assert.equal(at(Object.assign({}, rb, { mode: 'BRE' }), 20).exit, 1);
});

// ── rule 3: leftmost first ──

test('rule 3: starts are tried 0, 1, 2, … and the first start with any match wins', () => {
  assert.deepEqual(bt('b', 'abab'), [1, 2]);
  assert.deepEqual(bt('ab|b', 'xbab'), [1, 2]);   // b at 1 beats ab at 2
  const fr = frames({ pattern: 'c', text: 'abc' });
  assert.deepEqual(fr.filter((s) => s.act.k === 'restart').map((s) => s.start), [1, 2]);
  assert.deepEqual(span(fr[fr.length - 1].match), [2, 3]);
  // a restart clears the cursors: the pattern begins again at the new start
  const r = fr.find((s) => s.act.k === 'restart');
  assert.equal(r.pos, r.start);
  assert.deepEqual(r.stack, []);
});

// ── rule 4: anchors ──

test('rule 4: ^ holds only at position 0, $ only at the end of the line', () => {
  assert.equal(bt('^b', 'ab'), null);
  assert.deepEqual(bt('^a', 'ab'), [0, 1]);
  assert.deepEqual(bt('b$', 'abab'), [3, 4]);
  assert.equal(bt('a$', 'ab'), null);
  assert.deepEqual(bt('^$', ''), [0, 0]);
  // with ^ only start 0 can succeed: every later start fails at the anchor itself
  const fr = frames({ pattern: '^x', text: 'axa' });
  const bols = fr.filter((s) => s.act.k === 'bol');
  assert.deepEqual(bols.map((s) => [s.start, s.act.ok]), [[0, true], [1, false], [2, false], [3, false]]);
  // anchor-scan: every start is tried and fails, t matches at 3 but $ fails at 4
  const scan = frames(preset('anchor-scan'));
  assert.equal(scan.filter((s) => s.act.k === 'restart').length, 6);
  const eol = scan.find((s) => s.act.k === 'eol');
  assert.deepEqual([eol.start, eol.act.at, eol.act.ok], [3, 4, false]);
  assert.equal(scan[scan.length - 1].act.k, 'nomatch');
});

// ── rule 5: greedy quantifiers give back one at a time ──

test('rule 5: a greedy quantifier takes as many as it can, each "how many" a choice point, then gives back one', () => {
  const fr = frames(preset('greedy'));
  assert.deepEqual(acts(fr), ['start', 'test+', 'more+', 'more+', 'more+', 'more+', 'more-', 'test-', 'back-more', 'test+', 'match']);
  // .* took XbYb (4), each repetition left one choice point
  assert.equal(fr[5].stack.length, 4);
  assert.equal(fr[6].act.count, 4);
  // the step back gives back exactly one character: .* keeps 3, b is tried at 4
  assert.equal(fr[8].act.count, 3);
  assert.equal(fr[9].act.at, 4);
  assert.deepEqual(span(fr[10].match), [0, 5]);
  // + needs one repetition with no choice point; ? at most one
  const plus = frames({ pattern: 'a+', text: 'b' });
  assert.deepEqual(acts(plus).slice(1, 3), ['test-', 'restart']);
  assert.deepEqual(bt('ba?', 'baa'), [0, 2]);
});

test('rule 5: a group repetition that takes no characters ends the repetition (no endless loop)', () => {
  const r = logic.run('(a*)*b', 'aaac', 'ERE');
  assert.equal(r.match, null);
  assert.equal(r.limit, false);
  assert.deepEqual(bt('(a*)*', 'aa'), [0, 2]);
  assert.deepEqual(bt('(a?)+', 'aa'), [0, 2]);
});

// ── rule 6: alternation, backtracking keeps the first that leads to a match ──

test('rule 6: the backtracking matcher keeps the first alternative that leads to a match', () => {
  assert.deepEqual(bt('a|ab', 'ab'), [0, 1]);
  assert.deepEqual(bt('ab|a', 'ab'), [0, 2]);
  // the left side failing later still falls back to the right: (a|ab)c on abc
  assert.deepEqual(bt('(a|ab)c', 'abc'), [0, 3]);
  const fr = frames(preset('book-root-bin'));
  assert.deepEqual(acts(fr), ['start', 'bol+', 'alt', 'test-', 'back-alt', 'test+', 'test+', 'test+', 'match']);
  assert.equal(fr[3].act.at, 0);          // r against b
  assert.equal(fr[2].stack[0].kind, 'alt');
});

// ── rule 7: POSIX leftmost-longest ──

test('rule 7: POSIX reports the longest match from the leftmost start; the page shows both', () => {
  assert.deepEqual(posix('a|ab', 'ab'), [0, 2]);
  assert.deepEqual(bt('a|ab', 'ab'), [0, 1]);
  const fr = frames(preset('leftmost-longest'));
  const last = fr[fr.length - 1];
  assert.deepEqual(span(last.match), [0, 1]);
  assert.deepEqual(span(last.posix), [0, 2]);
  // the POSIX result appears only when the walk is done
  assert.ok(fr.slice(0, -1).every((s) => s.posix === null));
  // the form decides whose result the tool reports; the exit status is the same
  assert.equal(last.exit, 0);
  assert.equal(at(Object.assign({}, preset('leftmost-longest'), { mode: 'PCRE' }), 3).exit, 0);
  // longest even when a later alternative is the longer one, and through a quantifier
  assert.deepEqual(posix('(a|ab)(c|bcd)', 'abcd'), [0, 4]);
  assert.deepEqual(bt('(a|ab)(c|bcd)', 'abcd'), [0, 4]);
  assert.deepEqual(posix('x*|xxy', 'xxy'), [0, 3]);
  assert.deepEqual(bt('x*|xxy', 'xxy'), [0, 2]);
});

test('rule 7: both models agree on whether and where a match starts (only the end may differ)', () => {
  const cases = [['a|ab', 'ab'], ['(a|ab)(c|bcd)(d*)', 'abcd'], ['x*', 'abc'], ['b+|ab', 'aab'], ['(a+)+b', 'aaab'],
    ['t$', 'root:x'], ['^(root|bin)', BIN], ['[^:]*:', ROOT], ['o*t', 'root']];
  for (const [p, s] of cases) {
    const b = bt(p, s), q = posix(p, s);
    assert.equal(b === null, q === null, p);
    if (b) { assert.equal(b[0], q[0], p); assert.ok(q[1] >= b[1], p); }
  }
});

test('checked against GNU grep (-G, -E, -P) on this machine: the pinned cases', () => {
  // 3000 random ERE and 1500 BRE patterns were run against grep -bo (NOTES.md, "Cross-check"); these are pinned.
  // [pattern, text, mode, backtracking (grep -P), POSIX (grep / grep -E)]
  const REAL = [
    ['ro+t', ROOT, 'ERE', [0, 4], [0, 4]],
    ['ro+t', ROOT, 'BRE', null, null],
    ['^(root|bin)', BIN, 'ERE', [0, 3], [0, 3]],
    ['a.*b', 'aXbYb', 'ERE', [0, 5], [0, 5]],
    ['a|ab', 'ab', 'ERE', [0, 1], [0, 2]],
    ['(a|ab)(c|bcd)(d*)', 'abcd', 'ERE', [0, 4], [0, 4]],
    ['x*|xxy', 'xxy', 'ERE', [0, 2], [0, 3]],
    ['t$', 'root:x', 'ERE', null, null],
    ['(a+)+b', 'aaaaaa', 'ERE', null, null],
    ['a+b', 'aa+b', 'BRE', [1, 4], [1, 4]],
    ['(ab|a)(bc|c)?', 'abc', 'ERE', [0, 3], [0, 3]],
    ['(a|ab)(bc)?', 'abc', 'ERE', [0, 3], [0, 3]],
    ['(a|ab)c?', 'abc', 'ERE', [0, 1], [0, 3]]
  ];
  for (const [p, s, m, b, q] of REAL) {
    assert.deepEqual(bt(p, s, m), b, `backtracking ${p} on ${s}`);
    assert.deepEqual(posix(p, s, m), q, `POSIX ${p} on ${s}`);
  }
});

// ── the presets' numbers (task "Presets" and "Steps"; SPEC.md "Presets") ──

test('presets: steps, tries, results and exit status', () => {
  const want = {
    'book-ro-t': { steps: 6, tries: 5, bt: [0, 4], posix: [0, 4], exit: 0 },
    'book-root-bin': { steps: 8, tries: 5, bt: [0, 3], posix: [0, 3], exit: 0 },
    greedy: { steps: 10, tries: 8, bt: [0, 5], posix: [0, 5], exit: 0 },
    'leftmost-longest': { steps: 3, tries: 1, bt: [0, 1], posix: [0, 2], exit: 0 },
    'anchor-scan': { steps: 15, tries: 8, bt: null, posix: null, exit: 1 },
    explosion: { steps: 20, tries: 367, bt: null, posix: null, exit: 1 }
  };
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const n = logic.steps(p);
    const end = kit.stateAt(logic, p, n);
    const w = want[pr.id];
    assert.deepEqual([n, end.tries, span(end.match), span(end.posix), end.exit, end.done], [w.steps, w.tries, w.bt, w.posix, w.exit, true], pr.id);
  }
});

test('explosion: the walk is capped at 20 steps; the last one jumps to the end and keeps the count', () => {
  const p = P(preset('explosion'));
  assert.equal(logic.run(p.pattern, p.text, p.mode).actions, 671);
  const fr = logic.frames(p);
  assert.equal(fr.length, logic.MAX_STEPS + 1);
  assert.equal(fr[19].done, false);
  assert.equal(fr[20].jumped, 671 - 19);
  assert.equal(fr[20].act.k, 'nomatch');
  // a walk of exactly MAX_STEPS actions does not jump
  for (let k = 1; k <= 8; k++) {
    const q = P({ pattern: 'x', text: 'a'.repeat(k) });
    const f = logic.frames(q);
    assert.ok(f.length - 1 <= logic.MAX_STEPS);
    assert.equal(f[f.length - 1].jumped > 0, logic.run('x', 'a'.repeat(k), 'ERE').actions > logic.MAX_STEPS);
  }
  // with BRE ro+t the walk is long too and ends in no match, exit status 1
  const bre = logic.frames(P({ mode: 'BRE' }));
  assert.equal(bre.length, 21);
  assert.deepEqual([bre[20].act.k, bre[20].exit, bre[20].jumped], ['nomatch', 1, 70 - 19]);
});

test('the matcher gives up after TRY_LIMIT tries: grep -P exits 2, POSIX still answers', () => {
  const p = P({ pattern: '(a+)+b', text: 'a'.repeat(24), mode: 'PCRE' });
  const fr = logic.frames(p);
  const end = fr[fr.length - 1];
  assert.equal(end.act.k, 'limit');
  assert.equal(end.limit, true);
  assert.ok(end.tries >= logic.TRY_LIMIT);
  assert.equal(end.exit, 2);
  assert.equal(end.posix, null);
  assert.equal(logic.frames(Object.assign({}, p, { mode: 'ERE' })).slice(-1)[0].exit, 1);
});

// ── parsing errors and limits ──

test('patterns outside the subset or invalid in their form are refused with a reason', () => {
  const code = (p, m = 'ERE') => (logic.parse(p, m).ok ? null : logic.parse(p, m).error.code);
  assert.equal(code('a**'), 'double-quantifier');
  assert.equal(code('*a'), 'nothing-to-repeat');
  assert.equal(code('*a', 'BRE'), null);
  assert.equal(code('a|'), 'empty-alt');
  assert.equal(code('()'), 'empty-group');
  assert.equal(code('(a'), 'unclosed-group');
  assert.equal(code('a)'), 'unmatched-close');
  assert.equal(code(')'), 'unmatched-close');
  assert.equal(code('[ab'), 'unclosed-set');
  assert.equal(code('[z-a]'), 'bad-range');
  assert.equal(code('[[:foo:]]'), 'unknown-class');
  assert.equal(code('a{2}'), 'unsupported-brace');
  assert.equal(code('a{2}', 'BRE'), null);
  assert.equal(code('\\(a\\)', 'BRE'), 'bre-operator');
  assert.equal(code('\\d'), 'unsupported-escape');
  assert.equal(code('a\\'), 'trailing-backslash');
  assert.equal(code('^*'), 'nothing-to-repeat');
  assert.equal(code('a'.repeat(25)), 'too-long');
  assert.equal(code(''), null);
  const s = at({ pattern: '(a' }, 1);
  assert.deepEqual([s.error.code, s.exit, s.done, logic.steps(P({ pattern: '(a' }))], ['unclosed-group', 2, true, 1]);
});

test('a refused pattern is a grep error (exit 2) only where GNU grep refuses it too; otherwise "not covered", no exit', () => {
  // checked with /usr/bin/grep 3.11 (NOTES.md, "Refused patterns")
  const err = (p, m = 'ERE') => { const s = at({ pattern: p, mode: m }, 0); return [s.error.code, s.error.invalid, s.exit]; };
  assert.deepEqual(err('(a'), ['unclosed-group', true, 2]);
  assert.deepEqual(err('[ab', 'BRE'), ['unclosed-set', true, 2]);
  assert.deepEqual(err('[z-a]'), ['bad-range', true, 2]);
  assert.deepEqual(err('[[:alpha:]-z]'), ['bad-range', true, 2]);
  assert.deepEqual(err('a\\'), ['trailing-backslash', true, 2]);
  assert.deepEqual(err('a)'), ['unmatched-close', false, null]);
  assert.deepEqual(err(')'), ['unmatched-close', false, null]);
  assert.deepEqual(err('a)', 'PCRE'), ['unmatched-close', true, 2]);
  assert.deepEqual(err('*a'), ['nothing-to-repeat', false, null]);
  assert.deepEqual(err('*a', 'PCRE'), ['nothing-to-repeat', true, 2]);
  assert.deepEqual(err('a**'), ['double-quantifier', false, null]);
  assert.deepEqual(err('()'), ['empty-group', false, null]);
  assert.deepEqual(err('a|'), ['empty-alt', false, null]);
  assert.deepEqual(err('a{2}'), ['unsupported-brace', false, null]);
  assert.deepEqual(err('\\(a\\)', 'BRE'), ['bre-operator', false, null]);
  assert.deepEqual(err('[[.a.]]'), ['unsupported-class', false, null]);
  assert.deepEqual(err('[[=a=]]'), ['unsupported-class', false, null]);
  // in PCRE \ escapes inside brackets (not covered); in POSIX forms it is an ordinary character there
  assert.deepEqual(err('[\\]]', 'PCRE'), ['unsupported-escape', false, null]);
  assert.deepEqual(bt('[\\]x', 'a\\x'), [1, 3]);
  assert.equal(logic.captionOf(at({ pattern: '(a' }, 0)).key, 'cError');
  assert.equal(logic.captionOf(at({ pattern: 'a{2}' }, 0)).key, 'cNotCovered');
});

test('caption: a group that takes no repetition, and a third branch after the second failed', () => {
  const g = frames({ pattern: '(ab)*c', text: 'abx' }).map((s) => logic.captionOf(s).key);
  assert.ok(g.includes('cBackGroupNone'));
  const keys = frames({ pattern: '(x|y|z)', text: 'z' }).map((s) => logic.captionOf(s).key);
  assert.deepEqual(keys.filter((k) => k.startsWith('cBackAlt')), ['cBackAlt', 'cBackAltNext']);
});

test('the empty pattern matches the empty string at 0; the line is cut to MAX_TEXT', () => {
  assert.deepEqual(bt('', 'abc'), [0, 0]);
  const s = at({ pattern: 'z', text: 'x'.repeat(40) }, 0);
  assert.equal(s.text.length, logic.MAX_TEXT);
});

// ── captions ──

test('every frame of every preset (and the BRE switch) has a caption whose keys are in the tables', () => {
  const pages = logic.PRESETS.flatMap((pr) => logic.MODES.map((m) => Object.assign({}, pr.params, { mode: m })));
  pages.push({ pattern: '(x|y|z)+q', text: 'xyzw', mode: 'ERE' }, { pattern: 'a*ab', text: 'aaab', mode: 'ERE' }, { pattern: '(a', text: 'a', mode: 'ERE' }, { pattern: '', text: 'a', mode: 'ERE' },
    { pattern: '(a+)+b', text: 'a'.repeat(24), mode: 'PCRE' });
  const used = new Set();
  for (const p of pages) {
    for (const s of logic.frames(P(p))) {
      const c = logic.captionOf(s);
      for (const x of [c].concat(c.extra)) {
        used.add(x.key);
        assert.ok(x.key in strings.en && x.key in strings.hr, x.key);
        for (const v of Object.values(x.vars)) if (v && typeof v === 'object') assert.ok(v.t in strings.en, v.t);
      }
    }
  }
  for (const k of ['cStart', 'cTestOk', 'cTestNo', 'cTestEnd', 'cRepOk', 'cMoreOk', 'cMoreNo', 'cMoreEnd', 'cMoreEnter', 'cAlt',
    'cBackAlt', 'cBackMore', 'cBackGroup', 'cBackMoreEnd', 'cRestart', 'cMatch', 'cNoMatch', 'cLimit', 'cError', 'cStartEmpty',
    'c_bol_ok', 'c_eol_no', 'xJumped', 'xLeftover', 'xPosixLonger', 'xExit']) assert.ok(used.has(k), `caption ${k} is reached`);
});

test('caption: the task\'s greedy sentence at the step back, naming .* and b', () => {
  const s = at(preset('greedy'), 8);
  const c = logic.captionOf(s);
  assert.equal(c.key, 'cBackMoreEnd');
  assert.deepEqual([c.vars.q, c.vars.next], ['.*', 'b']);
  // a give-back that was not caused by the end of the line uses the plain sentence
  const f = frames({ pattern: 'a*ab', text: 'aaab' });
  assert.ok(f.some((x) => logic.captionOf(x).key === 'cBackMore'));
});

test('caption: the first match leaves choice points untried, and POSIX would say longer', () => {
  const c = logic.captionOf(at(preset('leftmost-longest'), 3));
  assert.equal(c.key, 'cMatch');
  assert.deepEqual(c.extra.map((x) => x.key), ['xLeftover', 'xPosixLonger', 'xExit']);
  assert.equal(c.extra[1].vars.span, 'ab');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ pattern: '(a|ab)(c|bcd)', text: 'xabcd' });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(preset('greedy'));
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s3 = kit.stateAt(logic, p, 3);
  s3.stack.push({ junk: true });
  assert.equal(kit.stateAt(logic, p, 3).stack.length, 2);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, and the page meta has the default demo\'s steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(logic.parse(pr.params.pattern, pr.params.mode).ok, pr.id);
    assert.ok(pr.params.text.length <= logic.MAX_TEXT, pr.id);
    assert.ok(logic.steps(P(pr.params)) <= logic.MAX_STEPS, pr.id);
  }
  for (const e of json.entries) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
