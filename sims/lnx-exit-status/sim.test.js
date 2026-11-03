// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-exit-status. Run: node --test sims/lnx-exit-status/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, the presets, and the template's generic block.
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
const last = (p) => at(p, steps(p));
const { c, echo, TRUE, FALSE, notFound, CAT, pipe, bang, list, run } = logic.build;

/** A test's own script: lines after a shebang. */
function script(lines, extra) {
  return Object.assign({ file: './t.sh', lines: [{ src: '#!/bin/bash', kind: 'meta' }].concat(lines) }, extra || {});
}
const runAll = (sc, opts) => logic.framesOf(sc, opts || {});
const endOf = (fr) => fr[fr.length - 1];
const texts = (s) => s.out.map((o) => o.text);
const lineStep = (fr, no) => fr.find((f) => f.lastEvent.line === no && f.lastEvent.code !== 'end');

// ── tie-breaks ──

test('tie-break (rule 2): a && b || c is not if/else — c runs after a succeeds and b fails', () => {
  const fr = runAll(script([run('true && false || echo B', list(TRUE(), '&&', FALSE(), '||', echo('B', 'B')))]));
  const s = fr[1];
  assert.deepEqual(s.view.ops.map((o) => [o.op, o.looked, o.run]), [['&&', 0, true], ['||', 1, true]]);
  assert.deepEqual(texts(s), ['B']);
  assert.equal(s.lastStatus, 0);
});

test('tie-break (rule 2): a skipped pipeline leaves the status for the next operator', () => {
  const fr = runAll(script([run('false && echo A || echo B', list(FALSE(), '&&', echo('A', 'A'), '||', echo('B', 'B')))]));
  const s = fr[1];
  assert.deepEqual(s.view.ops.map((o) => [o.op, o.looked, o.run]), [['&&', 1, false], ['||', 1, true]]);
  assert.equal(s.view.pipes[1].ran, false);
  assert.deepEqual(texts(s), ['B']);
  // and the list's status is that of the last pipeline that ran
  const fr2 = runAll(script([run('false && echo A', list(FALSE(), '&&', echo('A', 'A')))]));
  assert.equal(fr2[1].lastStatus, 1);
  assert.equal(fr2[1].view.lastRan, 0);
});

test('tie-break (rule 6): a message on stderr does not change the status', () => {
  const fr = runAll(script([run('nema | cat', list(pipe(notFound('nema'), CAT())))]));
  const s = fr[1];
  assert.deepEqual(s.out, [{ fd: 2, text: './t.sh: line 2: nema: command not found', line: 2 }]);
  assert.equal(s.lastStatus, 0);
  // and a status prints nothing: false fails silently
  const fr2 = runAll(script([run('false', list(FALSE()))]));
  assert.deepEqual(fr2[1].out, []);
  assert.equal(fr2[1].lastStatus, 1);
});

test('tie-break (rule 4): set -e looks at who produced the status — the last of the list, or not', () => {
  // true && false: the failing command is the last of the list → exit 1
  const a = runAll(script([run('true && false', list(TRUE(), '&&', FALSE())), run('echo x', list(echo('x')))]), { errexit: true });
  assert.equal(endOf(a).exited, 1);
  assert.equal(a[1].lastEvent.code, 'stop');
  assert.deepEqual(texts(endOf(a)), []);
  // false && true: the list returns 1, but from a command that is not last → no exit
  const b = runAll(script([run('false && true', list(FALSE(), '&&', TRUE())), run('echo x', list(echo('x')))]), { errexit: true });
  assert.equal(b[1].lastStatus, 1);
  assert.equal(b[1].lastEvent.code, 'ran');
  assert.deepEqual(texts(endOf(b)), ['x']);
  assert.equal(b[1].view.pipes[0].members[0].exempt, 'notlast');
});

test('tie-break (rule 7): if with no branch run returns 0, PIPESTATUS keeps the condition', () => {
  const fr = runAll(script([{ src: 'if false; then echo n; fi', kind: 'if', cond: list(FALSE()), then: list(echo('n', 'n')) }]), { errexit: true });
  const s = fr[1];
  assert.equal(s.lastEvent.code, 'cond');
  assert.equal(s.lastEvent.taken, false);
  assert.equal(s.lastEvent.condStatus, 1);
  assert.equal(s.lastStatus, 0);
  assert.deepEqual(s.pipeStatus, [1]);
  assert.equal(s.badges['2'], 0);
  assert.equal(fr.length, 3, 'one step for the condition, no branch step, then the end');
  assert.equal(endOf(fr).exited, 0);
});

// ── rules ──

test('rule 1: every command leaves a status; 127 not found, 126 not executable', () => {
  const fr = runAll(script([
    run('true', list(TRUE())), run('false', list(FALSE())), run('nema', list(notFound('nema'))),
    run('./x.sh', list(c('./x.sh', { status: 126 })))
  ]));
  assert.deepEqual(fr.slice(1, -1).map((f) => f.lastStatus), [0, 1, 127, 126]);
  assert.deepEqual(fr.slice(1, -1).map((f) => f.badges[String(f.lastEvent.line)]), [0, 1, 127, 126]);
});

test('rule 2: && runs on 0, || on non-zero; left to right', () => {
  const fr = runAll(script([
    run('true && echo a', list(TRUE(), '&&', echo('a', 'a'))),
    run('false && echo b', list(FALSE(), '&&', echo('b', 'b'))),
    run('true || echo c', list(TRUE(), '||', echo('c', 'c'))),
    run('false || echo d', list(FALSE(), '||', echo('d', 'd'))),
    run('false || false || echo e', list(FALSE(), '||', FALSE(), '||', echo('e', 'e')))
  ]));
  assert.deepEqual(texts(endOf(fr)), ['a', 'd', 'e']);
  assert.deepEqual(fr.slice(1, -1).map((f) => f.lastStatus), [0, 1, 0, 0, 0]);
});

test('rule 3: a pipeline returns its last member; with pipefail the rightmost failure, or 0', () => {
  const pl = () => script([run('false | (exit 3) | true', list(pipe(FALSE(), c('(exit 3)', { status: 3 }), TRUE())))]);
  const off = runAll(pl())[1];
  assert.equal(off.lastStatus, 0);
  assert.deepEqual(off.pipeStatus, [1, 3, 0]);
  assert.equal(off.view.pipes[0].source, 2);
  const on = runAll(pl(), { pipefail: true })[1];
  assert.equal(on.lastStatus, 3, 'the rightmost failure, not the first');
  assert.deepEqual(on.pipeStatus, [1, 3, 0]);
  assert.equal(on.view.pipes[0].source, 1);
  const none = runAll(script([run('true | true', list(pipe(TRUE(), TRUE())))]), { pipefail: true })[1];
  assert.equal(none.lastStatus, 0);
  // a failing last member is the status either way
  assert.equal(runAll(script([run('true | false', list(pipe(TRUE(), FALSE())))]))[1].lastStatus, 1);
});

test('rule 3: ! inverts the pipeline; PIPESTATUS keeps the members', () => {
  const s = runAll(script([run('! (exit 2) | true', list(bang(pipe(c('(exit 2)', { status: 2 }), TRUE()))))]), { pipefail: true })[1];
  assert.equal(s.lastStatus, 0);
  assert.deepEqual(s.pipeStatus, [2, 0]);
  assert.equal(runAll(script([run('! true', list(bang(pipe(TRUE()))))]))[1].lastStatus, 1);
});

test('rule 3: a member writes fd 1 into the pipe, fd 2 to the terminal; cat passes its input on', () => {
  const s = runAll(script([run('echo hi | cat', list(pipe(echo('hi', 'hi'), CAT())))]))[1];
  assert.deepEqual(s.out, [{ fd: 1, text: 'hi', line: 2 }]);
  assert.deepEqual(s.view.pipes[0].piped, [[{ text: 'hi', data: null }]]);
  const t = runAll(script([run('echo hi | nema', list(pipe(echo('hi', 'hi'), notFound('nema'))))]))[1];
  assert.deepEqual(t.out.map((o) => o.fd), [2], 'echo\'s line went into the pipe, only the error reaches the terminal');
});

test('rule 4(a): a failing member of a pipeline does not stop set -e; the pipeline\'s status does', () => {
  const sc = () => script([run('nema | cat', list(pipe(notFound('nema'), CAT()))), run('echo x', list(echo('x')))]);
  const off = runAll(sc(), { errexit: true });
  assert.equal(off[1].lastEvent.code, 'ran');
  assert.equal(off[1].view.pipes[0].members[0].exempt, 'member');
  assert.deepEqual(texts(endOf(off)), ['./t.sh: line 2: nema: command not found', 'x']);
  const on = runAll(sc(), { errexit: true, pipefail: true });
  assert.equal(on[1].lastEvent.code, 'stop');
  assert.equal(on[1].view.pipes[0].members[0].exempt, null, 'with pipefail the member is the pipeline\'s status');
  assert.equal(endOf(on).exited, 127);
});

test('rule 4(b): conditions, ! pipelines and non-last list members are ignored by set -e', () => {
  const fr = runAll(script([
    { src: 'if false; then :; fi', kind: 'if', cond: list(FALSE()), then: list(TRUE()) },
    run('! true', list(bang(pipe(TRUE())))),
    run('false || true', list(FALSE(), '||', TRUE())),
    run('echo x', list(echo('x')))
  ]), { errexit: true });
  assert.deepEqual(fr.slice(1, -1).map((f) => f.lastEvent.code), ['cond', 'ran', 'ran', 'ran']);
  assert.equal(fr[1].view.pipes[0].members[0].exempt, 'cond');
  assert.equal(fr[2].lastStatus, 1, '! true returns 1 and does not stop');
  assert.equal(fr[3].view.pipes[0].members[0].exempt, 'notlast');
  assert.equal(endOf(fr).exited, 0);
  // a ! pipeline that is last and fails does not stop either
  const b = runAll(script([run('! true', list(bang(pipe(TRUE()))))]), { errexit: true });
  assert.equal(b[1].lastEvent.code, 'ran');
});

test('rule 4(c): a compound command whose failure came from an ignored context does not stop', () => {
  const fr = runAll(script([
    { src: 'if true; then', kind: 'if', cond: list(TRUE()), body: [2], fi: 3 },
    run('  false && true', list(FALSE(), '&&', TRUE())),
    { src: 'fi', kind: 'fi' },
    run('echo x', list(echo('x')))
  ]), { errexit: true });
  assert.deepEqual(fr.slice(1, -1).map((f) => f.lastEvent.line), [2, 3, 5]);
  assert.equal(fr[2].lastStatus, 1, 'the if returns 1');
  assert.deepEqual(texts(endOf(fr)), ['x']);
  // the same body without the ignored context stops inside the if
  const g = runAll(script([
    { src: 'if true; then', kind: 'if', cond: list(TRUE()), body: [2], fi: 3 },
    run('  false', list(FALSE())),
    { src: 'fi', kind: 'fi' },
    run('echo x', list(echo('x')))
  ]), { errexit: true });
  assert.equal(g[2].lastEvent.code, 'stop');
  assert.equal(endOf(g).exited, 1);
});

test('rule 4: without set -e nothing stops', () => {
  const fr = runAll(script([run('false', list(FALSE())), run('echo x', list(echo('x')))]));
  assert.equal(fr[1].lastEvent.code, 'ran');
  assert.deepEqual(texts(endOf(fr)), ['x']);
  assert.equal(endOf(fr).exited, 0);
});

test('rule 5: the script ends with its last status, exit n, exit alone ($?), or the stopping command', () => {
  assert.equal(endOf(runAll(script([run('false', list(FALSE()))]))).exited, 1);
  assert.equal(endOf(runAll(script([run('false', list(FALSE())), run('true', list(TRUE()))]))).exited, 0);
  const n = runAll(script([run('exit 4', list(c('exit 4', { exit: true, code: 4 }))), run('echo x', list(echo('x')))]));
  assert.equal(endOf(n).exited, 4);
  assert.equal(n[1].lastEvent.code, 'exit');
  assert.deepEqual(texts(endOf(n)), []);
  // cd fails, so || runs exit, which ends with cd's status (rule 2 + rule 5)
  const e = runAll(script([run('cd /nema && echo y || exit', list(c('cd /nema', { status: 1 }), '&&', echo('y', 'y'), '||', c('exit', { exit: true }))),
    run('echo x', list(echo('x')))]));
  assert.equal(endOf(e).exited, 1);
  assert.equal(e.length, 3);
  // an exit that is skipped does nothing
  const k = runAll(script([run('true || exit', list(TRUE(), '||', c('exit', { exit: true }))), run('echo x', list(echo('x')))]));
  assert.deepEqual(texts(endOf(k)), ['x']);
  // under set -e: the stopping command's status
  assert.equal(endOf(runAll(script([run('(exit 5)', list(c('(exit 5)', { status: 5 }))), run('true', list(TRUE()))]), { errexit: true })).exited, 5);
});

test('if: a branch on the same line is a second step; a branch on its own lines runs as those lines', () => {
  const fr = runAll(script([{ src: 'if true; then echo y; fi', kind: 'if', cond: list(TRUE()), then: list(echo('y', 'y')) }]));
  assert.deepEqual(fr.slice(1, -1).map((f) => [f.lastEvent.line, f.lastEvent.part]), [[2, 'cond'], [2, 'then']]);
  assert.deepEqual(texts(endOf(fr)), ['y']);
  // a false condition skips the body lines and the fi
  const g = runAll(script([
    { src: 'if false; then', kind: 'if', cond: list(FALSE()), body: [2], fi: 3 },
    run('  echo y', list(echo('y'))), { src: 'fi', kind: 'fi' }, run('echo z', list(echo('z')))
  ]));
  assert.deepEqual(g.slice(1, -1).map((f) => f.lastEvent.line), [2, 5]);
  assert.deepEqual(texts(endOf(g)), ['z']);
});

test('the listing follows the switches: a set line off is struck, a switch without a line is added', () => {
  const erre = logic.listing(P({ script: 'erre', errexit: false, pipefail: true }));
  const setE = erre.find((r) => r.opt === 'errexit');
  assert.equal(setE.no, 2);
  assert.equal(setE.off, true);
  const added = erre.filter((r) => r.added);
  assert.deepEqual(added.map((r) => [r.no, r.src]), [[null, 'set -o pipefail']]);
  assert.equal(erre[1], added[0], 'added after the first line');
  assert.deepEqual(erre.filter((r) => r.no).map((r) => r.no), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'numbers unchanged');
  const none = logic.listing(P({ script: 'nightly', errexit: false, pipefail: false }));
  assert.equal(none.filter((r) => r.added || r.kind === 'set').length, 0);
});

test('rule 2 with a status other than 1: && skips on 127, || runs on 127', () => {
  const fr = runAll(script([run('nema && echo a || echo b', list(notFound('nema'), '&&', echo('a', 'a'), '||', echo('b', 'b')))]));
  assert.deepEqual(fr[1].view.ops.map((o) => [o.op, o.looked, o.run]), [['&&', 127, false], ['||', 127, true]]);
  assert.deepEqual(texts(fr[1]).slice(1), ['b']);
});

test('rule 4: a same-line then branch is not a condition — set -e stops in it', () => {
  const fr = runAll(script([{ src: 'if true; then false; fi', kind: 'if', cond: list(TRUE()), then: list(FALSE()) }, run('echo x', list(echo('x')))]), { errexit: true });
  assert.equal(fr[2].lastEvent.code, 'stop');
  assert.equal(endOf(fr).exited, 1);
  assert.deepEqual(texts(endOf(fr)), []);
});

test('rule 4(b): a failing member of a ! pipeline is hatched as "starts with !"', () => {
  const s = runAll(script([run('! false', list(bang(pipe(FALSE()))))]), { errexit: true })[1];
  assert.equal(s.lastStatus, 0);
  assert.equal(s.view.pipes[0].members[0].exempt, 'bang');
});

test('rule 5: exit stops the rest of its list; its badge and $? are the exit status', () => {
  const fr = runAll(script([run('true && exit 5 && echo x', list(TRUE(), '&&', c('exit 5', { exit: true, code: 5 }), '&&', echo('x', 'x'))),
    run('echo y', list(echo('y')))]));
  assert.deepEqual(texts(endOf(fr)), []);
  assert.equal(fr[1].lastStatus, 5);
  assert.equal(fr[1].badges['2'], 5);
  assert.equal(fr[1].view.pipes[2].ran, false);
  const g = runAll(script([run('false || exit', list(FALSE(), '||', c('exit', { exit: true })))]));
  assert.equal(g[1].badges['2'], 1);
  assert.equal(endOf(g).exited, 1);
  // exit as a pipeline member runs in a subshell: the script goes on
  const k = runAll(script([run('echo hi | exit 3', list(pipe(echo('hi', 'hi'), c('exit 3', { exit: true, code: 3, status: 3 })))), run('echo after', list(echo('after')))]));
  assert.deepEqual(texts(endOf(k)), ['after']);
});

test('rule 6: the view counts each member\'s stderr lines', () => {
  const s = runAll(script([run('nema | cat', list(pipe(notFound('nema'), CAT())))]))[1];
  assert.deepEqual(s.view.pipes[0].members.map((m) => m.stderr), [1, 0]);
});

// ── presets (SPEC.md, Presets and expected numbers) ──

test('erre (UL ch17): four lines, command not found, stops at line 9 with 1, after 8 steps', () => {
  const p = P({ script: 'erre' });
  assert.equal(steps(p), 8);
  const end = last(p);
  assert.deepEqual(end.out.map((o) => [o.fd, o.text]), [
    [1, '1 pocetak'], [1, '2 uvjet u if-u ne rusi skriptu'], [1, '3 ni clan ||-liste koji nije zadnji'],
    [2, './erre.sh: line 7: nema_ove_naredbe: command not found'], [1, '4 cjevovod nije pao jer je ZADNJI clan uspio']]);
  assert.equal(end.exited, 1);
  assert.equal(end.lastEvent.code, 'end');
  assert.equal(end.lastEvent.stopped, true);
  assert.equal(at(p, 7).lastEvent.code, 'stop');
  assert.equal(at(p, 7).lastEvent.line, 9);
  assert.deepEqual(at(p, 5).pipeStatus, [127, 0]);
  assert.equal(at(p, 5).lastStatus, 0);
  assert.deepEqual(Object.keys(end.badges).map(Number), [3, 4, 5, 6, 7, 8, 9]);
  assert.equal(end.badges['10'], undefined, 'line 10 never ran');
});

test('erre with other switches: off → 9 steps and 0; pipefail only → 127 at line 7, goes on; both → stops at 7', () => {
  const off = P({ script: 'erre', errexit: false });
  assert.equal(steps(off), 9);
  assert.equal(last(off).exited, 0);
  assert.equal(last(off).out.length, 6);
  const pf = P({ script: 'erre', errexit: false, pipefail: true });
  assert.equal(at(pf, 5).lastStatus, 127);
  assert.equal(last(pf).exited, 0);
  const both = P({ script: 'erre', pipefail: true });
  assert.equal(steps(both), 6);
  assert.equal(last(both).exited, 127);
  assert.equal(at(both, 5).lastEvent.line, 7);
});

test('erre-pipefail (UL ch17): stops at line 4 with 127 in 2 steps', () => {
  const p = P({ script: 'erre-pipefail', errexit: true, pipefail: true });
  assert.equal(steps(p), 2);
  assert.equal(at(p, 1).lastEvent.code, 'stop');
  assert.equal(at(p, 1).lastEvent.line, 4);
  assert.equal(last(p).exited, 127);
  assert.deepEqual(last(p).out.map((o) => o.text), ['./erre-pipefail.sh: line 4: nema_ove_naredbe: command not found']);
});

test('nightly: the dump fails, gzip succeeds, the pipeline returns 0, the OK mail goes out, the file is truncated', () => {
  const p = P({ script: 'nightly', errexit: false, pipefail: false });
  assert.equal(steps(p), 6);
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => at(p, n).lastEvent.line), [2, 3, 4, 6, 7]);
  const ck = at(p, 3);
  assert.deepEqual(ck.pipeStatus, [logic.NZ, 0]);
  assert.equal(ck.lastStatus, 0);
  assert.equal(ck.files[logic.CKP_DAY].bytes, 1214000);
  assert.equal(ck.files[logic.CKP_PREV].bytes, 131945690300);
  const end = last(p);
  assert.deepEqual(end.mail, ['Nightly OK']);
  assert.equal(end.exited, 0);
  assert.deepEqual(end.out.filter((o) => o.fd === 2).map((o) => o.line), [4, 4]);
  assert.ok(end.out.every((o) => o.text !== 'Nightly OK'), 'the echo goes into the mail, not the terminal');
});

test('nightly with both switches: stops at the checkpoint line, no mail, status non-zero, file still there', () => {
  const p = P({ script: 'nightly', errexit: true, pipefail: true });
  assert.equal(steps(p), 4);
  assert.equal(at(p, 3).lastEvent.code, 'stop');
  const end = last(p);
  assert.deepEqual(end.mail, []);
  assert.equal(end.exited, logic.NZ);
  assert.notEqual(end.exited, 0);
  assert.equal(end.files[logic.CKP_DAY].bytes, 1214000);
  // pipefail alone: $? ≠0 after line 4, but the script goes on and mails OK
  const pf = P({ script: 'nightly', errexit: false, pipefail: true });
  assert.equal(at(pf, 3).lastStatus, logic.NZ);
  assert.deepEqual(last(pf).mail, ['Nightly OK']);
  assert.equal(last(pf).exited, 0);
});

test('and-or: B, B, exit skipped; 4 steps, status 0, with or without set -e', () => {
  for (const errexit of [false, true]) {
    const p = P({ script: 'and-or', errexit, pipefail: false });
    assert.equal(steps(p), 4);
    assert.deepEqual(last(p).out.map((o) => o.text), ['B', 'B']);
    assert.equal(last(p).exited, 0);
    assert.deepEqual(at(p, 3).view.ops.map((o) => o.run), [true, false]);
  }
});

// ── generic checks every sim keeps ──

const ALL = logic.SCRIPT_IDS.flatMap((script) => [[false, false], [true, false], [false, true], [true, true]]
  .map(([errexit, pipefail]) => P({ script, errexit, pipefail })));

test('state is JSON-safe at every step', () => {
  for (const p of ALL) for (let n = 0; n <= steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s5 = at(p, 5);
  s5.pipeStatus[0] = 9;
  assert.equal(at(p, 5).pipeStatus[0], 127);
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
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of json.entries || []) assert.ok(logic.SCRIPTS[e.preset], e.preset);
});
