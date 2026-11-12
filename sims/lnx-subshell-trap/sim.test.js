// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-subshell-trap's model. Run: node --test sims/lnx-subshell-trap/
// Rules and numbers: SPEC.md. Tie-breaks first, then the rules, the presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const { B, line, script } = logic.build;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** Run a script made of the given lines (each [src, cmds]) and return its frames. */
const run = (...lines) => logic.framesOf(script('./t.sh', [line('#!/bin/bash')].concat(lines.map(([src, cmds]) => line(src, cmds)))));
const last = (f) => f[f.length - 1];
const outOf = (f) => last(f).out.map((o) => o.text);
const env = (s, id) => s.envs.find((e) => e.id === id);

// ── tie-breaks ──

test('tie-break (rule 8): the main EXIT trap runs once, after the last line, and the status is the last command\'s', () => {
  const f = run(
    ['trap \'echo T\' EXIT', [B.trap('trap \'echo T\' EXIT', [B.echo('echo T', 'T')])]],
    ['echo a', [B.echo('echo a', 'a')]],
    ['false', [B.status('false', 1)]]
  );
  assert.deepEqual(outOf(f), ['a', 'T']);
  assert.equal(outOf(f).filter((x) => x === 'T').length, 1);
  assert.equal(last(f).exitStatus, 1, 'the trap does not replace the status');
  assert.equal(last(f).lastEvent.code, 'trap', 'the trap is a step of its own, the last one');
  assert.equal(f[f.length - 2].exitStatus, null, 'the status is returned only after the trap');
});

test('tie-break: a subshell\'s exit N sets N first, its own trap runs in the next step, then N reaches the parent', () => {
  const f = logic.frames({ script: 'trap-in-subshell' });
  const exitStep = f[2];
  assert.equal(exitStep.lastEvent.code, 'exit');
  assert.equal(env(exitStep, 's1').status, 1);
  assert.ok(env(exitStep, 's1').exiting, 'the subshell is exiting, its trap pending');
  assert.equal(env(exitStep, 'main').status, 0, 'the parent has not got the status yet');
  const trapStep = f[3];
  assert.equal(trapStep.lastEvent.code, 'trap');
  assert.deepEqual(env(trapStep, 's1').ended, { status: 1, how: 'exit' });
  assert.equal(env(trapStep, 'main').status, 1);
});

test('tie-break: without a trap, the step of the last command also returns the status (no extra step)', () => {
  const f = logic.frames({ script: 'cd-in-subshell' });
  assert.equal(last(f).lastEvent.code, 'cmd');
  assert.equal(last(f).lastEvent.final, 0);
  assert.equal(f[f.length - 2].exitStatus, null);
});

// ── rules ──

test('rule 1: a cd and an assignment inside ( … ) change only the copy', () => {
  const f = run(
    ['v=1', [B.assign('v=1', 'v', '1')]],
    ['cd /tmp', [B.cd('/tmp')]],
    ['( v=2; cd /etc; echo in $v )', [B.sub('( v=2; cd /etc; echo in $v )', [B.assign('v=2', 'v', '2'), B.cd('/etc'), B.echo('echo in $v', 'in $v')])]],
    ['echo out $v', [B.echo('echo out $v', 'out $v')]],
    ['pwd', [B.pwd()]]
  );
  assert.deepEqual(outOf(f), ['in 2', 'out 1', '/tmp']);
  // the copy starts with the parent's values
  const first = f.find((s) => s.envs.length === 2);
  assert.equal(env(first, 's1').cwd, '/tmp');
  assert.equal(env(first, 's1').status, env(first, 'main').status);
});

test('rule 2: exit inside ( … ) ends only the subshell; its status arrives as $? and the script goes on', () => {
  const f = run(
    ['( exit 4 )', [B.sub('( exit 4 )', [B.exit(4)])]],
    ['echo "st $?"', [B.echo('echo "st $?"', 'st $?')]],
    ['echo after', [B.echo('echo after', 'after')]]
  );
  assert.deepEqual(outOf(f), ['st 4', 'after']);
  assert.equal(last(f).exitStatus, 0);
});

test('rule 2: a subshell that runs off its end returns its last command\'s status', () => {
  const f = run(
    ['( true; false )', [B.sub('( true; false )', [B.status('true', 0), B.status('false', 1)])]],
    ['echo $?', [B.echo('echo $?', '$?')]]
  );
  assert.deepEqual(outOf(f), ['1']);
  const ended = f.find((s) => s.envs.some((e) => e.ended && e.kind === 'subshell'));
  assert.deepEqual(env(ended, 's1').ended, { status: 1, how: 'end' });
});

test('rule 3: entering a subshell resets the parent\'s EXIT trap; it does not run when the subshell exits', () => {
  const f = logic.frames({ script: 'book-ciscenje2' });
  const inSub = f[2];
  assert.equal(env(inSub, 's1').traps.EXIT, null);
  assert.equal(env(inSub, 's1').reset, true);
  assert.ok(env(inSub, 'main').traps.EXIT, 'the main script keeps its trap');
  assert.deepEqual(f[3].out.map((o) => o.text), ['u podljusci'], 'nothing printed by a trap when the subshell exits');
});

test('rule 3: no trap set, nothing to reset', () => {
  const s = logic.frames({ script: 'cd-in-subshell' })[2];
  assert.equal(env(s, 's1').reset, false);
});

test('rule 3: a command substitution with only a trap command keeps the traps ($(trap))', () => {
  const f = run(
    ['trap \'echo x\' EXIT', [B.trap('trap \'echo x\' EXIT', [B.echo('echo x', 'x')])]],
    ['t=$(trap)', [B.assign('t=$(trap)', 't', { cmdsub: [B.trap('trap')] })]],
    ['echo "[$t]"', [B.echo('echo "[$t]"', '[$t]')]]
  );
  assert.deepEqual(outOf(f), ["[trap -- 'echo x' EXIT]", 'x']);
  // with one more command it is no longer the exception
  const g = run(
    ['trap \'echo x\' EXIT', [B.trap('trap \'echo x\' EXIT', [B.echo('echo x', 'x')])]],
    ['t=$(trap; true)', [B.assign('t=$(trap; true)', 't', { cmdsub: [B.trap('trap'), B.status('true', 0)] })]],
    ['echo "[$t]"', [B.echo('echo "[$t]"', '[$t]')]]
  );
  // the model resets the copy's trap (POSIX); bash still prints the parent's trap text there, a display quirk out of
  // scope (SPEC.md), so the test checks the reset, not the printout
  const sub = g[2].envs.find((e) => e.via === 'cmdsub');
  assert.equal(sub.reset, true);
  assert.equal(sub.traps.EXIT, null);
  assert.equal(f[2].envs.find((e) => e.via === 'cmdsub').reset, false, '$(trap) keeps the copy');
});

test('rule 4: the EXIT trap runs on exit N before the end, and the status stays N', () => {
  const f = logic.frames({ script: 'book-ciscenje' });
  assert.deepEqual(outOf(f), ['radim u: ' + logic.TMPDIR, logic.TMPDIR, 'sada namjerno prekidam', 'trap: brisem ' + logic.TMPDIR]);
  assert.equal(last(f).exitStatus, 3);
  assert.equal(last(f).files[logic.TMPDIR], false, 'the directory is gone');
  assert.equal(f[6].files[logic.TMPDIR], true, 'it was there until the trap ran');
  // a failing command in the trap does not change it either
  const g = run(
    ['trap \'echo T; false\' EXIT', [B.trap('trap \'echo T; false\' EXIT', [B.echo('echo T', 'T'), B.status('false', 1)])]],
    ['exit 3', [B.exit(3)]],
    ['echo never', [B.echo('echo never', 'never')]]
  );
  assert.deepEqual(outOf(g), ['T']);
  assert.equal(last(g).exitStatus, 3);
});

test('rule 4: $? inside the trap action is the status the shell exits with', () => {
  const f = run(
    ['trap \'echo "st $?"\' EXIT', [B.trap('trap \'echo "st $?"\' EXIT', [B.echo('echo "st $?"', 'st $?')])]],
    ['exit 5', [B.exit(5)]]
  );
  assert.deepEqual(outOf(f), ['st 5']);
});

test('rule 5: { …; } runs in the current shell: no copy, the cd sticks', () => {
  const f = logic.frames({ script: 'cd-in-subshell' });
  const grp = f[5];
  assert.equal(grp.envs.length, 1, 'no nested box for { …; }');
  assert.equal(grp.lastEvent.group, true);
  assert.equal(f[1].lastEvent.group, false);
  assert.equal(env(grp, 'main').cwd, '/etc');
  assert.deepEqual(outOf(f), ['/etc', '/tmp', '/etc']);
});

test('rule 6: each member of a pipeline is a copy; a variable set in the while loop is lost', () => {
  const f = logic.frames({ script: 'pipe-loses-var' });
  assert.deepEqual(outOf(f), ['0']);
  const start = f[2];
  assert.deepEqual(start.envs.map((e) => [e.kind, e.via, e.member]), [['main', null, null], ['subshell', 'pipe', 1], ['subshell', 'pipe', 2]]);
  assert.equal(env(f[4], 's2').vars.n, '2', 'the member counted to 2');
  assert.equal(env(f[4], 's2').vars.x, '', 'the failed read emptied x');
  assert.equal(env(f[4], 'main').vars.n, '0');
  assert.equal(env(f[5], 'main').vars.x, undefined, 'x never reached the main shell');
});

test('rule 6: a command substitution runs in a subshell inside its command\'s step', () => {
  const s = logic.frames({ script: 'book-ciscenje' })[1];
  assert.equal(s.lastEvent.code, 'cmd');
  assert.deepEqual(s.lastEvent.entered, ['s1']);
  assert.deepEqual(s.lastEvent.ended, ['s1']);
  assert.equal(env(s, 's1').via, 'cmdsub');
  assert.equal(env(s, 'main').vars.rad, logic.TMPDIR, 'its output becomes the value');
  assert.deepEqual(s.out, [], 'captured, not printed');
  // a cd inside $( … ) does not stick either
  const f = run(
    ['d=$(cd /etc; pwd)', [B.assign('d=$(cd /etc; pwd)', 'd', { cmdsub: [B.cd('/etc'), B.pwd()] })]],
    ['echo "$d"', [B.echo('echo "$d"', '$d')]],
    ['pwd', [B.pwd()]]
  );
  assert.deepEqual(outOf(f), ['/etc', logic.HOME]);
});

test('rule 7: a trap set inside the subshell runs when the subshell exits, and its status stays', () => {
  const f = logic.frames({ script: 'trap-in-subshell' });
  assert.deepEqual(outOf(f), ['unutra', '1']);
  assert.equal(f[3].out[0].env, 's1', 'printed by the subshell');
  assert.equal(f[3].out[0].trap, true, 'by its trap action');
  assert.equal(f[4].out[1].trap, false);
  assert.equal(env(f[3], 'main').traps.EXIT, null, 'the trap never belonged to the main shell');
  // with the main trap too: sub, st 4, main
  const g = run(
    ['trap \'echo main\' EXIT', [B.trap('trap \'echo main\' EXIT', [B.echo('echo main', 'main')])]],
    ['( trap \'echo sub\' EXIT; exit 4 )', [B.sub('( trap \'echo sub\' EXIT; exit 4 )', [B.trap('trap \'echo sub\' EXIT', [B.echo('echo sub', 'sub')]), B.exit(4)])]],
    ['echo "st $?"', [B.echo('echo "st $?"', 'st $?')]]
  );
  assert.deepEqual(outOf(g), ['sub', 'st 4', 'main']);
});

test('rule 6: the pipe holds what the first member wrote until read takes it, one line per pass', () => {
  const f = logic.frames({ script: 'pipe-loses-var' });
  assert.deepEqual(f[2].pipe.lines, ['a', 'b'], 'printf wrote both lines');
  assert.deepEqual(f[3].pipe.lines, ['b']);
  assert.deepEqual(f[4].pipe.lines, []);
  assert.equal(f[5].pipe, null);
});

test('an assignment with a command substitution returns the substitution\'s status', () => {
  const f = run(
    ['v=$(exit 3)', [B.assign('v=$(exit 3)', 'v', { cmdsub: [B.exit(3)] })]],
    ['echo $?', [B.echo('echo $?', '$?')]]
  );
  assert.deepEqual(outOf(f), ['3']);
});

test('exit with no number exits with $? (also with a trap)', () => {
  const f = run(['false', [B.status('false', 1)]], ['exit', [B.exit()]]);
  assert.equal(last(f).exitStatus, 1);
  const g = run(
    ['trap \'echo T\' EXIT', [B.trap('trap \'echo T\' EXIT', [B.echo('echo T', 'T')])]],
    ['false', [B.status('false', 1)]], ['exit', [B.exit()]]
  );
  assert.deepEqual(outOf(g), ['T']);
  assert.equal(last(g).exitStatus, 1);
});

test('a box that ended is shown in its last step and gone in the next', () => {
  const f = logic.frames({ script: 'book-ciscenje2' });
  assert.ok(env(f[3], 's1').ended);
  assert.equal(env(f[4], 's1'), undefined);
});

test('exit in the main shell skips the rest of the script', () => {
  const f = run(['exit 2', [B.exit(2)]], ['echo never', [B.echo('echo never', 'never')]]);
  assert.deepEqual(outOf(f), []);
  assert.equal(last(f).exitStatus, 2);
  assert.equal(f.length - 1, 1);
});

test('changes(): values changed by a step, boxes created and ended', () => {
  const f = logic.frames({ script: 'book-ciscenje2' });
  const c2 = logic.changes(f[1], f[2]);
  assert.equal(c2.s1.created, true);
  assert.equal(c2.main.status, false);
  const c3 = logic.changes(f[2], f[3]);
  assert.equal(c3.s1.ended, true);
  assert.equal(c3.main.status, true, '$? in the parent changed to 1');
  const c1 = logic.changes(f[0], f[1]);
  assert.equal(c1.main.trap, true);
  const g = logic.frames({ script: 'cd-in-subshell' });
  assert.equal(logic.changes(g[0], g[1]).main.cwd, true);
  const p = logic.frames({ script: 'pipe-loses-var' });
  assert.deepEqual(logic.changes(p[2], p[3]).s2.vars.sort(), ['n', 'x']);
});

test('the listing: every command knows its span in its line', () => {
  for (const id of logic.SCRIPT_IDS) {
    for (const s of logic.frames({ script: id })) {
      if (!s.pc) continue;
      const src = logic.SCRIPTS[id].lines[s.pc.line - 1].src;
      assert.ok(s.pc.from >= 0 && s.pc.to <= src.length && s.pc.from < s.pc.to, id);
    }
  }
  const f = logic.frames({ script: 'book-ciscenje' });
  const src = logic.SCRIPTS['book-ciscenje'].lines[2].src;
  assert.equal(src.slice(f[7].pc.from, f[7].pc.to), 'echo "trap: brisem $rad"; rm -rf "$rad"', 'the trap step marks the action');
  const g = logic.frames({ script: 'book-ciscenje2' });
  assert.equal(logic.SCRIPTS['book-ciscenje2'].lines[2].src.slice(g[3].pc.from, g[3].pc.to), 'exit 1');
});

// ── from the fresh review (each checked in bash 5.2.21) ──

const T = (text, action) => B.trap(text, action);
const E = (text, arg) => B.echo(text, arg);

test('rule 1: the copy starts with the parent\'s $?; new names do not leak back', () => {
  const f = run(['false', [B.status('false', 1)]], ['( echo $? )', [B.sub('( echo $? )', [E('echo $?', '$?')])]]);
  assert.deepEqual(outOf(f), ['1']);
  const g = run(['( w=1 )', [B.sub('( w=1 )', [B.assign('w=1', 'w', '1')])]], ['echo "[$w]"', [E('echo "[$w]"', '[$w]')]]);
  assert.deepEqual(outOf(g), ['[]']);
});

test('rule 1: a nested copy is a copy of its own parent, not of the main shell', () => {
  const f = run(
    ['cd /tmp', [B.cd('/tmp')]],
    ['( cd /etc; v=1; ( pwd; echo "v=$v" ) )', [B.sub('( cd /etc; v=1; ( pwd; echo "v=$v" ) )', [B.cd('/etc'), B.assign('v=1', 'v', '1'),
      B.sub('( pwd; echo "v=$v" )', [B.pwd(), E('echo "v=$v"', 'v=$v')])])]],
    ['pwd', [B.pwd()]]
  );
  assert.deepEqual(outOf(f), ['/etc', 'v=1', '/tmp']);
});

test('rule 2: a bare exit in a subshell uses the subshell\'s own $?', () => {
  const f = run(['( false; exit )', [B.sub('( false; exit )', [B.status('false', 1), B.exit()])]], ['echo $?', [E('echo $?', '$?')]]);
  assert.deepEqual(outOf(f), ['1']);
});

test('rule 2: the ended box keeps its exit status, not the status of its trap\'s last command', () => {
  const f = run(['( trap \'echo s; false\' EXIT; exit 4 )', [B.sub('( trap \'echo s; false\' EXIT; exit 4 )',
    [T('trap \'echo s; false\' EXIT', [E('echo s', 's'), B.status('false', 1)]), B.exit(4)])]], ['echo $?', [E('echo $?', '$?')]]);
  const ended = f.find((s) => s.envs.some((e) => e.id === 's1' && e.ended));
  assert.deepEqual(env(ended, 's1').ended, { status: 4, how: 'exit' });
  assert.equal(env(ended, 's1').status, 4);
  assert.deepEqual(outOf(f), ['s', '4']);
});

test('rule 3: pipeline members and nested copies reset a trap; setting one\'s own clears the reset mark', () => {
  const trapMain = ['trap \'echo m\' EXIT', [T('trap \'echo m\' EXIT', [E('echo m', 'm')])]];
  const f = run(trapMain, ['printf \'a\\n\' | while read x; do :; done', [B.pipe('printf \'a\\n\' | while read x; do :; done',
    'printf \'a\\n\'', ['a'], 'while read x; do :; done', 'x', [B.status(':', 0)])]]);
  assert.ok(f[2].envs.filter((e) => e.via === 'pipe').every((e) => e.reset && e.traps.EXIT === null));
  const g = run(trapMain, ['( trap \'echo s\' EXIT; ( echo in ) )', [B.sub('( trap \'echo s\' EXIT; ( echo in ) )',
    [T('trap \'echo s\' EXIT', [E('echo s', 's')]), B.sub('( echo in )', [E('echo in', 'in')])])]]);
  assert.equal(env(g[2], 's1').reset, false, 'its own trap now');
  assert.equal(env(g[3], 's2').reset, true, 'the inner copy reset the outer subshell\'s trap');
  assert.deepEqual(outOf(g), ['in', 's', 'm']);
});

test('rule 5: an assignment in { } stays, and exit in { } ends the script', () => {
  const f = run(['{ v=2; }', [B.group('{ v=2; }', [B.assign('v=2', 'v', '2')])]], ['echo $v', [E('echo $v', '$v')]],
    ['{ exit 5; }', [B.group('{ exit 5; }', [B.exit(5)])]], ['echo no', [E('echo no', 'no')]]);
  assert.deepEqual(outOf(f), ['2']);
  assert.equal(last(f).exitStatus, 5);
});

test('rule 6: the pipeline returns the loop\'s status; exit in the loop ends only the member; no input, no pass', () => {
  const p = (text, lines, body) => B.pipe(text, text.split(' | ')[0], lines, text.split(' | ')[1], 'x', body);
  const f = run(['printf \'a\\n\' | while read x; do false; done', [p('printf \'a\\n\' | while read x; do false; done', ['a'], [B.status('false', 1)])]],
    ['echo $?', [E('echo $?', '$?')]]);
  assert.deepEqual(outOf(f), ['1']);
  const g = run(['printf \'a\\n\' | while read x; do exit 4; done', [p('printf \'a\\n\' | while read x; do exit 4; done', ['a'], [B.exit(4)])]],
    ['echo "st $?"', [E('echo "st $?"', 'st $?')]]);
  assert.deepEqual(outOf(g), ['st 4']);
  assert.equal(last(g).exitStatus, 0);
  const h = run(['true | while read x; do :; done', [p('true | while read x; do :; done', [], [B.status(':', 0)])]], ['echo $?', [E('echo $?', '$?')]]);
  assert.deepEqual(outOf(h), ['0']);
  assert.equal(h.length - 1, 2, 'one step for the pipeline, one for echo');
  assert.ok(h[1].envs.every((e) => e.kind === 'main' || e.ended), 'both members ended in the pipeline\'s step');
  assert.equal(h[2].envs.length, 1);
});

test('rule 6: everything printed inside $( … ) is captured: several lines, nested copies, a pipeline, its own trap', () => {
  const sub = (text, body) => B.assign(text, text.split('=')[0], { cmdsub: body });
  const f = run(['v=$(echo a; echo b)', [sub('v=$(echo a; echo b)', [E('echo a', 'a'), E('echo b', 'b')])]]);
  assert.equal(env(last(f), 'main').vars.v, 'a\nb');
  const g = run(['x=$(trap \'echo T\' EXIT; echo a)', [sub('x=$(trap \'echo T\' EXIT; echo a)', [T('trap \'echo T\' EXIT', [E('echo T', 'T')]), E('echo a', 'a')])]]);
  assert.equal(env(last(g), 'main').vars.x, 'a\nT');
  assert.deepEqual(outOf(g), []);
  const h = run(['x=$( ( echo a ) )', [sub('x=$( ( echo a ) )', [B.sub('( echo a )', [E('echo a', 'a')])])]]);
  assert.equal(env(last(h), 'main').vars.x, 'a');
  const k = run(['v=$(printf \'a\\n\' | while read x; do echo $x; done)', [sub('v=$(printf \'a\\n\' | while read x; do echo $x; done)',
    [B.pipe('printf \'a\\n\' | while read x; do echo $x; done', 'printf \'a\\n\'', ['a'], 'while read x; do echo $x; done', 'x', [E('echo $x', '$x')])])]]);
  assert.equal(env(last(k), 'main').vars.v, 'a');
  assert.equal(k.length - 1, 1, 'the substitution runs inside its command\'s step');
});

test('rule 7: $? inside a subshell\'s trap is its exit status', () => {
  const f = run(['( trap \'echo "t $?"\' EXIT; exit 4 )', [B.sub('( trap \'echo "t $?"\' EXIT; exit 4 )',
    [T('trap \'echo "t $?"\' EXIT', [E('echo "t $?"', 't $?')]), B.exit(4)])]]);
  assert.deepEqual(outOf(f), ['t 4']);
});

test('steps: a $( … ) box is gone at the next step; ( … ) boxes are listed as entered; a subshell trap marks its action', () => {
  assert.equal(logic.frames({ script: 'book-ciscenje' })[2].envs.length, 1);
  assert.deepEqual(logic.frames({ script: 'book-ciscenje2' })[2].lastEvent.entered, ['s1']);
  const f = logic.frames({ script: 'trap-in-subshell' });
  assert.equal(logic.SCRIPTS['trap-in-subshell'].lines[1].src.slice(f[3].pc.from, f[3].pc.to), 'echo unutra');
  assert.equal(logic.frames({ script: 'book-ciscenje' })[7].lastEvent.exitCmd, 'exit 3');
});

// ── presets: the task's numbers ──

test('presets: output, final status and steps (SPEC.md table)', () => {
  const want = {
    'book-ciscenje': [['radim u: /tmp/vjezba17.YHRD9D', '/tmp/vjezba17.YHRD9D', 'sada namjerno prekidam', 'trap: brisem /tmp/vjezba17.YHRD9D'], 3, 7],
    'book-ciscenje2': [['u podljusci', 'podljuska je zavrsila sa: 1', 'trap u glavnoj skripti'], 0, 5],
    'cd-in-subshell': [['/etc', '/tmp', '/etc'], 0, 6],
    'pipe-loses-var': [['0'], 0, 5],
    'trap-in-subshell': [['unutra', '1'], 0, 4]
  };
  assert.deepEqual(logic.SCRIPT_IDS, Object.keys(want));
  for (const [id, [out, st, steps]] of Object.entries(want)) {
    const f = logic.frames({ script: id });
    assert.deepEqual(outOf(f), out, id);
    assert.equal(last(f).exitStatus, st, id);
    assert.equal(logic.steps({ script: id }), steps, id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.SCRIPT_IDS) {
    for (let n = 0; n <= logic.steps({ script: id }); n++) {
      const s = at({ script: id }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.SCRIPT_IDS) {
    const p = P({ script: id });
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
    assert.deepEqual(logic.framesOf(logic.SCRIPTS[id]), logic.framesOf(logic.SCRIPTS[id]));
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'book-ciscenje2' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default preset');
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(logic.SCRIPT_IDS.includes(e.preset), e.preset);
});
