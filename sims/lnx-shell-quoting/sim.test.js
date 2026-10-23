// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-shell-quoting's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
/** argv of a line typed as text, with extra variables or another IFS. */
const argv = (line, over = {}) => logic.analyse(line, Object.assign({}, over, { vars: Object.assign({}, logic.VARS, over.vars) })).argvText;
const texts = (items) => items.map((i) => i.text);
const FILES_SORTED = ['drugi.txt', 'moj izvjestaj.txt'];

// ── tie-breaks ──

test('tie-break (rule 8): within one word only the unquoted expansion parts split', () => {
  assert.deepEqual(argv('echo pre$ime"post $ime"$ime'), ['echo', 'preAna', 'Marijapost Ana MarijaAna', 'Marija']);
  assert.deepEqual(argv('echo "$ime"$ime'), ['echo', 'Ana MarijaAna', 'Marija']);
  assert.deepEqual(argv('echo $ime"$ime"'), ['echo', 'Ana', 'MarijaAna Marija']);
});

test('tie-break (rule 8): within one word only the unquoted part is a pattern', () => {
  assert.deepEqual(argv('echo "$x"$x', { vars: { x: '*' } }), ['echo', '**'], 'no name starts with *, so no match: kept');
  assert.deepEqual(argv('echo "d"$x', { vars: { x: '*' } }), ['echo', 'drugi.txt']);
  assert.deepEqual(argv('echo "$x"', { vars: { x: 'd*' } }), ['echo', 'd*']);
  assert.deepEqual(argv('echo \'*\'.txt'), ['echo', '*.txt']);
});

test('tie-break (rules 3, 5): a glob result is never split, so the space in a matched name survives', () => {
  const r = logic.analyse('rm $x');
  assert.deepEqual(texts(r.split.filter((i) => !i.syntax)), ['rm', '*.txt']);
  assert.deepEqual(r.argvText, ['rm', ...FILES_SORTED]);
});

test('tie-break (rule 4): empty unquoted expansion vanishes, quoted gives one empty argument', () => {
  assert.deepEqual(argv('echo $nema'), ['echo']);
  assert.deepEqual(argv('echo "$nema"'), ['echo', '']);
  assert.deepEqual(argv('echo $sp', { vars: { sp: '   ' } }), ['echo']);
  assert.deepEqual(argv('echo $sp""', { vars: { sp: '   ' } }), ['echo', '']);
  const r = logic.analyse('echo $nema');
  assert.equal(r.split.filter((i) => i.vanished).length, 1, 'the vanished word is drawn as a ghost');
  assert.equal(r.splitInfo[0].outcome, 'empty');
});

// ── rules ──

test('rule 1: the stages come in the POSIX order, one per step, revealed one at a time', () => {
  const p = P({});
  const keys = ['words', 'expanded', 'split', 'globbed', 'argv', 'result'];
  for (let n = 0; n <= 6; n++) {
    const s = at(p, n);
    assert.equal(s.stage, n);
    keys.forEach((k, i) => assert.equal(s[k] === null, i + 1 > n, `${k} at step ${n}`));
  }
  // expansion before splitting, splitting before globbing: the value's * is globbed only after splitting
  const r = logic.analyse('echo $v', { vars: { v: 'd* m*' } });
  assert.deepEqual(r.argvText, ['echo', 'drugi.txt', 'moj izvjestaj.txt']);
});

test('rule 2: single quotes keep $ literal; double quotes still expand', () => {
  assert.deepEqual(argv("echo '$ime'"), ['echo', '$ime']);
  assert.equal(argv("echo '$ime'")[1].length, 4);
  assert.deepEqual(argv('echo "$ime"'), ['echo', 'Ana Marija']);
  assert.deepEqual(argv('echo "\'$ime\'"'), ['echo', "'Ana Marija'"], 'a single quote inside double quotes is literal and $ still expands');
  assert.equal(logic.analyse("echo '$ime'").exps.length, 0, 'no expansion inside single quotes');
  assert.throws(() => logic.tokenize("echo 'don't'"), /unclosed/, 'a single quote cannot occur inside single quotes');
});

test('rule 3: only unquoted expansion results split; typed blanks are words already and IFS does not touch them', () => {
  assert.deepEqual(argv('echo $ime'), ['echo', 'Ana', 'Marija']);
  assert.deepEqual(argv('echo $ime', { ifs: ':' }), ['echo', 'Ana Marija']);
  assert.deepEqual(argv('echo a b $v', { ifs: ':', vars: { v: 'c:d' } }), ['echo', 'a', 'b', 'c', 'd']);
  assert.deepEqual(argv('echo a:b'), ['echo', 'a:b']);
  assert.deepEqual(argv('echo a:b', { ifs: ':' }), ['echo', 'a:b'], 'a typed colon is not from an expansion');
  assert.deepEqual(argv('echo "$v"', { ifs: ':', vars: { v: 'c:d' } }), ['echo', 'c:d']);
});

test('rule 4: IFS white space collapses and is trimmed; other IFS characters delimit, two give an empty field', () => {
  assert.deepEqual(argv('echo $v', { vars: { v: '  a \t b\n\nc  ' } }), ['echo', 'a', 'b', 'c']);
  assert.deepEqual(argv('$v', { ifs: ':', vars: { v: 'a::b' } }), ['a', '', 'b']);
  assert.deepEqual(argv('$v', { ifs: ':', vars: { v: ':a' } }), ['', 'a']);
  assert.deepEqual(argv('$v', { ifs: ':', vars: { v: 'a:' } }), ['a']);
  assert.deepEqual(argv('$v', { ifs: ' :', vars: { v: 'a : b' } }), ['a', 'b']);
  assert.deepEqual(argv('$v', { ifs: ' :', vars: { v: ' :a' } }), ['', 'a']);
  assert.deepEqual(logic.splitWord([], ' '), []);
  assert.deepEqual(argv('$v', { ifs: ' :', vars: { v: 'a : : b' } }), ['a', '', 'b'], 'white space next to a delimiter is absorbed, not the delimiter');
  // outcomes the captions read
  const blank = logic.analyse('echo a$sp', { vars: { sp: '  ' } });
  assert.deepEqual(blank.argvText, ['echo', 'a']);
  assert.equal(blank.splitInfo[0].outcome, 'blank', 'the word stays, only the expansion is gone');
  const trim = logic.analyse('echo $v', { vars: { v: 'a ' } });
  assert.deepEqual([trim.argvText, trim.splitInfo[0].outcome], [['echo', 'a'], 'trim']);
  // a value with no IFS character is one field, and the caption says why
  assert.equal(end(P({ line: 'uzorak' })).splitInfo[0].outcome, 'whole');
  assert.equal(end(P({ line: 'bez', ifs: 'colon' })).splitInfo[0].outcome, 'whole');
});

test('rule 5: unquoted patterns become the matching names, sorted; no match stays; dot files; set -f', () => {
  const files = ['b.txt', 'a.txt', '.skriveno.txt', 'c.log'];
  assert.deepEqual(argv('echo *.txt', { files }), ['echo', 'a.txt', 'b.txt']);
  assert.deepEqual(argv('echo ?.*', { files }), ['echo', 'a.txt', 'b.txt', 'c.log']);
  assert.deepEqual(argv('echo [ab].txt', { files }), ['echo', 'a.txt', 'b.txt']);
  assert.deepEqual(argv('echo [!a].*', { files }), ['echo', 'b.txt', 'c.log']);
  assert.deepEqual(argv('echo [a-b]*', { files }), ['echo', 'a.txt', 'b.txt']);
  assert.deepEqual(argv('echo .*.txt', { files }), ['echo', '.skriveno.txt'], 'a literal leading dot matches');
  assert.deepEqual(argv('echo *.TXT', { files }), ['echo', '*.TXT']);
  assert.deepEqual(argv('echo [x', { files }), ['echo', '[x'], 'an unclosed [ is not a pattern');
  assert.equal(logic.analyse('echo [x', { files }).globInfo[0].outcome, 'notpattern');
  // a leading dot is matched only by a literal dot: not by ?, not by a bracket (checked in bash)
  const dots = ['.a', 'b', 'd.x'];
  assert.deepEqual(argv('echo ?a', { files: dots }), ['echo', '?a']);
  assert.deepEqual(argv('echo [.]a', { files: dots }), ['echo', '[.]a']);
  assert.deepEqual(argv('echo d[.]x', { files: dots }), ['echo', 'd.x'], 'a dot elsewhere matches a bracket');
  // brackets: ] first is a member, a quoted ] does not close, ^ negates, a quoted ! does not
  assert.deepEqual(argv('echo []d]*'), ['echo', 'drugi.txt']);
  assert.deepEqual(argv('echo [dm"]"*'), ['echo', '[dm]*']);
  assert.deepEqual(argv('echo [^d]*'), ['echo', 'moj izvjestaj.txt']);
  assert.deepEqual(argv('echo ["!"d]*'), ['echo', 'drugi.txt']);
  assert.deepEqual(argv('echo *.txt', { files, noglob: true }), ['echo', '*.txt']);
  const r = logic.analyse('echo *.txt "*".txt', { files });
  assert.deepEqual(r.globInfo.map((g) => g.outcome), ['matched', 'quoted']);
  assert.deepEqual(logic.analyse('echo *.zip', { files }).globInfo[0].outcome, 'nomatch');
  assert.deepEqual(logic.analyse('echo *', { files, noglob: true }).globInfo[0].outcome, 'noglob');
});

test('rule 6: command substitution loses trailing newlines, then splits like a value', () => {
  const r = logic.analyse('for f in $(ls)');
  assert.equal(r.exps[0].printed, 'drugi.txt\nmoj izvjestaj.txt\n');
  assert.equal(r.exps[0].value, 'drugi.txt\nmoj izvjestaj.txt');
  assert.deepEqual(r.result.items, ['drugi.txt', 'moj', 'izvjestaj.txt']);
  assert.deepEqual(logic.analyse('for f in "$(ls)"').result.items, ['drugi.txt\nmoj izvjestaj.txt'], 'no trailing newline inside the quoted value');
  assert.deepEqual(logic.analyse('for f in $(ls)', { ifs: '\n' }).result.items, FILES_SORTED);
  assert.deepEqual(argv('echo $(ls)', { files: [] }), ['echo']);
  assert.equal(logic.dropTrailingNewlines('a\n\nb\n\n\n'), 'a\n\nb', 'every trailing newline goes, inner ones stay');
  assert.throws(() => logic.tokenize('echo $(ls'), /unclosed/);
});

test('rule 7: quote removal deletes only the quote characters the shell interpreted', () => {
  const r = logic.analyse('echo "a\'b" \'c"d\' e');
  assert.deepEqual(r.argvText, ['echo', "a'b", 'c"d', 'e']);
  assert.deepEqual(r.argv.map((i) => !!i.changed), [false, true, true, false]);
  assert.equal(r.removedQuotes, 2);
  // the quote characters are visible up to the pathname-expansion strip, and gone in argv
  const bez = logic.analyse('echo "$ime"');
  assert.ok(bez.globbed[1].parts.some((x) => x.quoteChar));
  assert.ok(!bez.argv[1].parts.some((x) => x.quoteChar));
});

test('tilde: a leading unquoted ~ is the home directory; elsewhere or quoted it is literal; its result never splits', () => {
  assert.deepEqual(argv('echo ~ ~/x "~" a~'), ['echo', logic.HOME, logic.HOME + '/x', '~', 'a~']);
  assert.deepEqual(argv('echo ~/x', { ifs: '/' }), ['echo', logic.HOME + '/x']);
});

test('parts: quote context and "came from an expansion" are kept per character', () => {
  const r = logic.analyse('echo x"$ime"');
  const w = r.expanded[1];
  assert.deepEqual(w.parts, [
    { text: 'x', quoted: 'none', fromExpansion: false, quoteChar: false },
    { text: '"', quoted: 'double', fromExpansion: false, quoteChar: true },
    { text: 'Ana Marija', quoted: 'double', fromExpansion: true, quoteChar: false },
    { text: '"', quoted: 'double', fromExpansion: false, quoteChar: true }
  ]);
  assert.equal(w.changed, true);
  assert.equal(r.expanded[0].changed, false);
});

test('for: the first three words are syntax, the rest are the items', () => {
  const r = logic.analyse('for x in $niz');
  assert.equal(r.kind, 'for');
  assert.deepEqual(r.argv.map((i) => !!i.syntax), [true, true, true, false, false, false]);
  assert.deepEqual(r.result, { kind: 'for', name: 'x', items: ['a', 'b', 'c'], out: [], status: 0, removed: [] });
  assert.equal(logic.analyse('frobnicate $ime').result.kind, 'unknown');
  assert.throws(() => logic.tokenize('echo a\\ b'), /backslash/);
});

test('state the page draws: argv index, quote context before expansion, glob changes, syntax marks, sorted files', () => {
  const r = logic.analyse('echo a "$ime"');
  assert.deepEqual(r.argv.map((i) => i.index), [0, 1, 2]);
  assert.ok(r.words[2].parts.some((x) => x.quoted === 'double' && x.text === '$ime'), 'the $ime still to expand is drawn inside its double quotes');
  const g = logic.analyse('rm $x');
  assert.deepEqual(g.globbed.map((i) => !!i.changed), [false, true, true]);
  assert.deepEqual(g.globbed.map((i) => !!i.fromGlob), [false, true, true]);
  const f = logic.analyse('for x in $niz');
  for (const strip of ['words', 'expanded', 'split', 'globbed', 'argv']) {
    assert.deepEqual(f[strip].map((i) => !!i.syntax), [true, true, true, ...f[strip].slice(3).map(() => false)], strip);
  }
  assert.equal(end(P({ line: 'razmaci' })).result.missing, 2);
  assert.deepEqual(at(P({}), 0).cwdFiles, FILES_SORTED);
});

test('small language: tabs are blanks, ${name}, $( ls ), for needs a literal in, rm twice, an empty argument', () => {
  assert.deepEqual(argv('echo\ta'), ['echo', 'a']);
  assert.deepEqual(argv('echo ${ime}x'), ['echo', 'Ana', 'Marijax']);
  assert.deepEqual(argv('echo $( ls )'), ['echo', 'drugi.txt', 'moj', 'izvjestaj.txt']);
  assert.equal(logic.analyse('for x of $niz').kind, 'cmd');
  const rm = logic.analyse('rm drugi.txt drugi.txt').result;
  assert.deepEqual([rm.removed, rm.out.length, rm.status], [['drugi.txt'], 1, 1]);
  assert.deepEqual(logic.analyse('echo ""').result.out, ['']);
  assert.deepEqual(logic.analyse('echo ""').argvText, ['echo', '']);
  assert.deepEqual(logic.analyse('echo "" a').result.out, [' a'], 'an empty argument still takes its place');
  assert.equal(logic.analyse('$k x in a', { vars: { k: 'for' } }).kind, 'cmd', 'for is recognised only as typed');
  assert.deepEqual(logic.analyse('ls').result.out, FILES_SORTED);
  assert.deepEqual(logic.analyse('ls -l').result.out, FILES_SORTED.map(logic.lsLong));
});

test('details the captions and boxes read', () => {
  assert.deepEqual(argv('echo [a-c].txt', { files: ['b.txt', '-.txt', 'd.txt'] }), ['echo', 'b.txt'], 'a range is one member, not three');
  assert.equal(logic.analyse('echo $v', { vars: { v: ' a' } }).split[1].changed, true, 'trimming blanks is a change');
  assert.equal(logic.analyse('echo "*".txt').globInfo[0].field, '*.txt', 'the pattern is named without its quotes');
  const g = logic.analyse('rm $x');
  assert.ok(g.globbed.slice(1).every((i) => i.parts.every((x) => !x.fromExpansion)), 'matched names did not come from the expansion');
  assert.deepEqual(logic.analyse('echo $ime ${ime}').exps.map((e) => e.text), ['$ime', '${ime}']);
});

// ── the task's presets ──

test('preset bez: 4 arguments unquoted, 3 quoted; the same output', () => {
  const a = end(P({ line: 'bez' }));
  assert.deepEqual(texts(a.argv), ['echo', 'bez', 'navodnika:', 'Ana', 'Marija']);
  assert.equal(a.argv.length - 1, 4);
  const b = end(P({ line: 'bez', quoted: true }));
  assert.equal(b.line, 'echo bez navodnika: "$ime"');
  assert.deepEqual(texts(b.argv), ['echo', 'bez', 'navodnika:', 'Ana Marija']);
  assert.deepEqual(a.result.out, ['bez navodnika: Ana Marija']);
  assert.deepEqual(b.result.out, a.result.out);
  assert.equal(a.splitInfo[0].outcome, 'split');
  assert.equal(b.splitInfo[0].outcome, 'quoted');
});

test('preset jednostruki: the argument is the 4 characters $ime; no quoted variant', () => {
  const s = end(P({ line: 'jednostruki' }));
  assert.deepEqual(texts(s.argv), ['echo', 'jednostruki:', '$ime']);
  assert.deepEqual(s.result.out, ['jednostruki: $ime']);
  assert.equal(logic.LINES.jednostruki.quoted, null);
  assert.equal(end(P({ line: 'jednostruki', quoted: true })).line, logic.LINES.jednostruki.plain);
});

test('preset razmaci: two missing names and status 2; quoted, one name and status 0', () => {
  const a = end(P({ line: 'razmaci' }));
  assert.deepEqual(texts(a.argv), ['ls', '-l', 'moj', 'izvjestaj.txt']);
  assert.deepEqual(a.result.out, ["ls: cannot access 'moj': No such file or directory", "ls: cannot access 'izvjestaj.txt': No such file or directory"]);
  assert.equal(a.result.status, 2);
  const b = end(P({ line: 'razmaci', quoted: true }));
  assert.deepEqual(texts(b.argv), ['ls', '-l', 'moj izvjestaj.txt']);
  assert.deepEqual(b.result.out, [logic.lsLong('moj izvjestaj.txt')]);
  assert.equal(b.result.status, 0);
  assert.equal(end(P({ line: 'razmaci', ifs: 'colon' })).result.status, 0, 'no colon in the value: one field');
});

test('preset polja: 3 fields unquoted, 1 quoted', () => {
  assert.deepEqual(end(P({ line: 'polja' })).result.items, ['a', 'b', 'c']);
  assert.deepEqual(end(P({ line: 'polja', quoted: true })).result.items, ['a b c']);
  assert.deepEqual(end(P({ line: 'polja', ifs: 'newline' })).result.items, ['a b c']);
});

test('preset uzorak: one field *.txt, then two names; quoted or set -f: literal, status 1', () => {
  const p = P({ line: 'uzorak' });
  assert.deepEqual(texts(at(p, 3).split), ['rm', '*.txt']);
  const s = end(p);
  assert.deepEqual(texts(s.globbed), ['rm', ...FILES_SORTED]);
  assert.equal(s.argv.length - 1, 2);
  assert.deepEqual(s.result.removed, FILES_SORTED);
  assert.equal(s.result.status, 0);
  for (const over of [{ quoted: true }, { noglob: true }]) {
    const q = end(P(Object.assign({ line: 'uzorak' }, over)));
    assert.deepEqual(texts(q.argv), ['rm', '*.txt']);
    assert.deepEqual(q.result.out, ["rm: cannot remove '*.txt': No such file or directory"]);
    assert.equal(q.result.status, 1);
  }
  assert.equal(end(P({ line: 'uzorak', quoted: true })).globInfo[0].outcome, 'quoted');
  assert.equal(end(P({ line: 'uzorak', noglob: true })).globInfo[0].outcome, 'noglob');
});

test('preset zamjena: 3 fields from two names; newline-only IFS gives 2', () => {
  assert.deepEqual(end(P({ line: 'zamjena' })).result.items, ['drugi.txt', 'moj', 'izvjestaj.txt']);
  assert.deepEqual(end(P({ line: 'zamjena', ifs: 'newline' })).result.items, FILES_SORTED);
  assert.deepEqual(end(P({ line: 'zamjena', quoted: true })).result.items, ['drugi.txt\nmoj izvjestaj.txt']);
});

test('every preset has 7 states (6 steps) under every param', () => {
  for (const line of logic.LINE_IDS) for (const quoted of [false, true]) for (const ifs of logic.IFS_IDS) for (const noglob of [false, true]) {
    const p = P({ line, quoted, ifs, noglob });
    assert.equal(steps(p), 6);
    assert.equal(end(p).stage, 6);
    assert.ok(end(p).result, `${line} runs`);
  }
});

test('sim.json steps is the model\'s count, and its preset entries are the page\'s presets', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})));
  for (const e of sim.entries || []) assert.ok(logic.LINE_IDS.includes(e.preset), e.preset);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.LINE_IDS) {
    const p = P({ line: id });
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.LINE_IDS) {
    const p = P({ line: id, quoted: id === 'polja' });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ line: 'uzorak' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s5 = at(p, 5);
  s5.argv[0].text = 'x';
  assert.equal(at(p, 5).argv[0].text, 'rm');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  assert.match(html, /presets: L\.LINE_IDS\.map\(function \(id\) \{ return \{ id: id,/);
});
