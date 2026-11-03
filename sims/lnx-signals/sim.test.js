// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-signals' model (rules: SPEC.md). Run: node --test sims/lnx-signals/sim.test.js
// Transcripts, statuses and messages were checked against an interactive bash 5.2.21 (NOTES.md, "Checked against bash").
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const proc = (s, pid) => logic.find(s, pid);
/** The transcript lines this step added, as text (commands without the prompt). */
const added = (s) => s.out.map((i) => s.term[i]).filter((l) => l.kind !== 'cmd' && l.kind !== 'sep').map((l) => l.text);
const acts = (s) => s.deliveries.map((d) => [d.sig, d.target, d.act]);

// ── tie-breaks first ──

test('rule 9: a second SIGTERM to a hanging handler changes nothing; the count of signals never matters', () => {
  const p = P({ script: 'stubborn', handler: 'hang' });
  const s1 = kit.stateAt(logic, p, 1);
  const again = logic.deliver(s1, 'TERM', 38455, 'student');
  assert.deepEqual(acts(again), [['TERM', 38455, 'handlerAgain']]);
  const strip = (s) => Object.assign({}, s, { deliveries: [], ev: [], changed: [], out: [] });
  assert.deepEqual(strip(again).procs, strip(s1).procs);
  assert.deepEqual(again.files, s1.files);
  const thrice = logic.deliver(logic.deliver(again, 'TERM', 38455, 'student'), 'TERM', 38455, 'student');
  assert.deepEqual(thrice.procs, again.procs);
  assert.equal(proc(thrice, 38455).alive, true);
});

test('rule 9: a SIGTERM to a process already in its finish handler changes nothing either', () => {
  const s1 = at({ script: 'handler-cleans' }, 1);
  const again = logic.deliver(s1, 'TERM', 38455, 'student');
  assert.deepEqual(again.procs, s1.procs);
  assert.deepEqual(again.files, s1.files);
});

test('rule 10: a job\'s end is reported after the next external command, never right after kill', () => {
  const s2 = at({}, 2), s3 = at({}, 3);
  assert.deepEqual(added(s2), [], 'kill prints nothing');
  assert.equal(proc(s2, 38450).alive, false, 'yet the process has ended');
  assert.deepEqual(added(s3), ['[1]+  Terminated              sleep 300', '    PID    PPID STAT CMD']);
});

test('rule 10: an ended, unreported job: kill %1 says No such process, then the notice; then no such job', () => {
  // drive the interpreter with two extra kills, the way bash 5.2.21 answered them
  const sc = logic.SCRIPTS['book-primjer1'];
  const orig = sc.acts;
  try {
    sc.acts = orig.slice(0, 2).concat([[{ op: 'kill', target: '%1', as: 'shell' }], [{ op: 'kill', target: '%1', as: 'shell' }]]);
    const a3 = at({}, 3), a4 = at({}, 4);
    assert.deepEqual(added(a3), ['bash: kill: (38450) - No such process', '[1]+  Terminated              sleep 300']);
    assert.deepEqual(added(a4), ['bash: kill: %1: no such job']);
  } finally { sc.acts = orig; }
});

test('rule 10: jobs marks + for the newest job and - for the one before; words padded to 24', () => {
  const sc = logic.SCRIPTS['book-primjer1'], orig = sc.acts;
  try {
    sc.acts = [[{ op: 'start', cmd: 'sleep 300', pid: 1 }, { op: 'start', cmd: 'sleep 301', pid: 2 }, { op: 'jobs' }]];
    assert.deepEqual(added(at({}, 1)), ['[1] 1', '[2] 2', '[1]-  Running                 sleep 300 &', '[2]+  Running                 sleep 301 &']);
  } finally { sc.acts = orig; }
});

// ── rule 1: kill sends SIGTERM unless told ──

test('rule 1: kill %1 sends SIGTERM (15) to the job\'s PID; kill -KILL sends SIGKILL (9)', () => {
  const s2 = at({}, 2);
  assert.deepEqual(s2.deliveries.map((d) => [d.sig, d.num, d.target]), [['TERM', 15, 38450]]);
  assert.equal(s2.term[s2.out[0]].text, 'kill %1');
  const k = at({ script: 'stubborn', handler: 'hang' }, 3);
  assert.deepEqual(k.deliveries.map((d) => [d.sig, d.num]), [['KILL', 9]]);
  assert.match(k.term[k.out[0]].text, /^kill -KILL 38455;/);
});

// ── rule 2: dispositions ──

test('rule 2: default terminates, ignore does nothing, catch runs the handler', () => {
  const s0 = at({ script: 'handler-cleans' }, 0);
  assert.deepEqual(acts(logic.deliver(s0, 'HUP', 38455, 'student')), [['HUP', 38455, 'terminated']]);
  assert.deepEqual(acts(logic.deliver(s0, 'TERM', 38455, 'student')), [['TERM', 38455, 'handler']]);
  assert.deepEqual(acts(logic.deliver(s0, 'TERM', 38423, 'student')), [['TERM', 38423, 'ignored']], 'interactive bash ignores TERM');
  assert.equal(proc(logic.deliver(s0, 'TERM', 38423, 'student'), 38423).alive, true);
  assert.deepEqual(logic.bashDisp(), { HUP: 'catch', INT: 'catch', TERM: 'ignore', KILL: 'default' });
});

test('rule 2: the book\'s sleep: SIGTERM\'s default action ends it, ps shows only the header', () => {
  const s1 = at({}, 1), s3 = at({}, 3);
  assert.deepEqual(added(s1), ['[1] 38450', '[1]+  Running                 sleep 300 &', '    PID    PPID STAT CMD',
    '  38450   38423 S    sleep 300']);
  assert.deepEqual(proc(s3, 38450), Object.assign({}, proc(s3, 38450), { alive: false, sig: 'TERM', exit: 143 }));
});

// ── rule 3: SIGKILL cannot be caught or ignored ──

test('rule 3: SIGKILL\'s disposition cannot be changed; it ends even a catching or ignoring process', () => {
  const s0 = at({ script: 'nohup-and-hangup' }, 2);
  assert.deepEqual(logic.setDisp(s0, 38485, 'KILL', 'ignore'), s0);
  assert.deepEqual(logic.setDisp(s0, 38485, 'KILL', 'catch'), s0);
  const ign = logic.setDisp(s0, 38485, 'TERM', 'ignore');
  assert.equal(proc(ign, 38485).disp.TERM, 'ignore', 'other signals can be set');
  assert.deepEqual(acts(logic.deliver(ign, 'KILL', 38485, 'student')), [['KILL', 38485, 'terminated']]);
  const h = at({ script: 'handler-cleans' }, 0);
  assert.equal(proc(logic.deliver(h, 'KILL', 38455, 'student'), 38455).alive, false);
});

test('rule 3: SIGKILL leaves the lock and a half-written data file; status 137', () => {
  const s = at({ script: 'stubborn', handler: 'hang' }, 3);
  assert.deepEqual(s.files, { lock: true, data: 'half', nohupOut: false });
  assert.deepEqual([proc(s, 38455).alive, proc(s, 38455).sig, proc(s, 38455).exit], [false, 'KILL', 137]);
  assert.deepEqual(added(s), ['[1]+  Killed                  ./zapis', '    PID    PPID STAT CMD']);
});

test('rule 3: SIGKILL in the middle of a finish handler also leaves everything behind', () => {
  const s1 = at({ script: 'handler-cleans' }, 1);
  const k = logic.deliver(s1, 'KILL', 38455, 'student');
  assert.deepEqual(k.files, { lock: true, data: 'half', nohupOut: false });
  assert.equal(proc(k, 38455).cleaned, false);
});

// ── rule 4: the handler decides ──

test('rule 4: finish: the handler closes the file, removes the lock and exits 0; bash says Done', () => {
  const s1 = at({ script: 'handler-cleans' }, 1), s2 = at({ script: 'handler-cleans' }, 2);
  assert.equal(proc(s1, 38455).alive, true);
  assert.equal(proc(s1, 38455).inHandler, true);
  assert.deepEqual(s1.files, { lock: true, data: 'open', nohupOut: false }, 'nothing is cleaned until time passes');
  assert.deepEqual(s2.files, { lock: false, data: 'closed', nohupOut: false });
  assert.deepEqual([proc(s2, 38455).alive, proc(s2, 38455).sig, proc(s2, 38455).exit], [false, null, 0]);
  assert.deepEqual(added(s2), ['[1]+  Done                    ./zapis', '    PID    PPID STAT CMD']);
});

test('rule 4: hang: SIGTERM and time change nothing, the process is still in ps', () => {
  const s2 = at({ script: 'handler-cleans', handler: 'hang' }, 2);
  assert.equal(proc(s2, 38455).alive, true);
  assert.deepEqual(added(s2), ['    PID    PPID STAT CMD', '  38455   38423 S    ./zapis']);
  assert.deepEqual(s2.files, { lock: true, data: 'open', nohupOut: false });
});

test('rule 4: stubborn with a finishing handler: it ends in step 2, and kill -KILL finds no such process', () => {
  const s3 = at({ script: 'stubborn', handler: 'finish' }, 3);
  assert.deepEqual(acts(s3), [['KILL', 38455, 'nosuch']]);
  assert.equal(added(s3)[0], 'bash: kill: (38455) - No such process');
  assert.deepEqual(s3.files, { lock: false, data: 'closed', nohupOut: false });
});

// ── rule 5: nohup ──

test('rule 5: nohup sets SIGHUP to ignore and nothing else, and writes nohup.out', () => {
  const s2 = at({ script: 'nohup-and-hangup' }, 2), s1 = at({ script: 'nohup-and-hangup' }, 1);
  assert.deepEqual(proc(s2, 38485).disp, { HUP: 'ignore', INT: 'default', TERM: 'default', KILL: 'default' });
  assert.deepEqual(proc(s2, 38482).disp, { HUP: 'default', INT: 'default', TERM: 'default', KILL: 'default' });
  assert.equal(s1.files.nohupOut, false);
  assert.equal(s2.files.nohupOut, true);
  assert.deepEqual(added(s2), ['[2] 38485', "nohup: ignoring input and appending output to 'nohup.out'", '    PID    PPID STAT CMD',
    '  38485   38458 S    sleep 300']);
  assert.deepEqual(acts(logic.deliver(s2, 'TERM', 38485, 'student')), [['TERM', 38485, 'terminated']], 'TERM still ends it');
});

// ── rule 6: closing the terminal ──

test('rule 6: closing the terminal: HUP to the shell, the shell resends it; & dies, nohup survives with PPID 1', () => {
  const s = at({ script: 'nohup-and-hangup' }, 3);
  assert.deepEqual(s.deliveries.map((d) => [d.sig, d.target, d.from, d.act]), [
    ['HUP', 38458, 'terminal', 'resend'], ['HUP', 38482, 'shell', 'terminated'], ['HUP', 38485, 'shell', 'ignored']]);
  assert.equal(s.terminal, 'closed');
  assert.deepEqual([proc(s, 38458).alive, proc(s, 38458).exit], [false, 129]);
  assert.deepEqual([proc(s, 38482).alive, proc(s, 38482).exit, proc(s, 38482).reporter], [false, 129, null]);
  assert.deepEqual([proc(s, 38485).alive, proc(s, 38485).ppid, proc(s, 38485).job], [true, 1, null]);
});

test('rule 6: & alone does not protect: without nohup both jobs die', () => {
  const s2 = at({ script: 'nohup-and-hangup' }, 2);
  const plain = logic.setDisp(s2, 38485, 'HUP', 'default');
  const after = logic.deliver(plain, 'HUP', 38458, 'terminal');
  assert.equal(proc(after, 38482).alive, false);
  assert.equal(proc(after, 38485).alive, false);
});

test('rule 6: SIGKILL still ends the nohup job, from a new terminal; no shell reports it', () => {
  const s = at({ script: 'nohup-and-hangup' }, 4);
  assert.deepEqual(added(s), ['    PID    PPID STAT CMD', '  38485       1 S    sleep 300']);
  assert.deepEqual([proc(s, 38485).alive, proc(s, 38485).exit, proc(s, 38485).reporter], [false, 137, null]);
  assert.ok(s.term.some((l) => l.kind === 'sep' && l.text === 'newTerm'));
  assert.equal(s.files.nohupOut, true, 'nohup.out stays');
});

// ── rule 7: permission ──

test('rule 7: student to ana\'s process: Operation not permitted, nothing changes; root goes through', () => {
  const s0 = at({ script: 'not-yours' }, 0), s1 = at({ script: 'not-yours' }, 1), s2 = at({ script: 'not-yours' }, 2);
  assert.deepEqual(acts(s1), [['TERM', 38470, 'refused']]);
  assert.deepEqual(added(s1), ['bash: kill: (38470) - Operation not permitted']);
  assert.deepEqual(s1.procs, s0.procs);
  assert.deepEqual(s1.deliveries[0].disp, null, 'refused before the disposition is looked up');
  assert.deepEqual(acts(s2), [['TERM', 38470, 'terminated']]);
  assert.equal(s2.term[s2.out[0]].user, 'root');
  assert.deepEqual([proc(s2, 38470).exit, proc(s2, 38470).reporter], [143, 38466]);
});

test('rule 7: the UID check: same user or root', () => {
  const p = { user: 'ana' };
  assert.equal(logic.permitted('ana', p), true);
  assert.equal(logic.permitted('root', p), true);
  assert.equal(logic.permitted('student', p), false);
  assert.equal(logic.permitted('terminal', p), true);
});

test('rule 7: with sender root, not-yours step 1 goes through and step 2 finds no such process', () => {
  assert.deepEqual(acts(at({ script: 'not-yours', sender: 'root' }, 1)), [['TERM', 38470, 'terminated']]);
  assert.deepEqual(acts(at({ script: 'not-yours', sender: 'root' }, 2)), [['TERM', 38470, 'nosuch']]);
});

// ── rule 8: exit status ──

test('rule 8: exit status 128 + N: 129, 130, 137, 143', () => {
  const s0 = at({ script: 'handler-cleans' }, 0);
  const st = (sig) => proc(logic.deliver(s0, sig, 38455, 'student'), 38455).exit;
  assert.equal(st('HUP'), 129);
  assert.equal(st('INT'), 130);
  assert.equal(st('KILL'), 137);
  const b = at({}, 1);
  assert.equal(proc(logic.deliver(b, 'TERM', 38450, 'student'), 38450).exit, 143);
});

// ── scenario plumbing ──

test('steps per scenario: 3, 2, 3, 4, 2', () => {
  assert.deepEqual(logic.SCRIPT_IDS.map((k) => logic.steps({ script: k })), [3, 2, 3, 4, 2]);
  assert.equal(logic.steps(logic.defaults), 3);
});

test('a kill %job is typed by the job\'s shell owner; the sender param only moves PID kills', () => {
  assert.deepEqual(at({ sender: 'root' }, 2).deliveries[0].from, 'student');
  assert.equal(at({ script: 'handler-cleans', sender: 'root' }, 1).deliveries[0].from, 'root');
  assert.equal(logic.uses('book-primjer1', 'sender'), false);
  assert.equal(logic.uses('book-primjer1', 'handler'), false);
  assert.equal(logic.uses('stubborn', 'handler'), true);
  assert.equal(logic.uses('not-yours', 'sender'), true);
  assert.equal(logic.uses('nohup-and-hangup', 'handler'), false);
});

test('changed holds only this step\'s PIDs and files', () => {
  assert.deepEqual(at({}, 2).changed, [38450]);
  assert.deepEqual(at({ script: 'not-yours' }, 1).changed, [], 'a refused signal touches nothing');
  assert.deepEqual(at({ script: 'handler-cleans' }, 2).changed.sort(), [38455, 'data', 'lock'].sort());
});

test('norm: unknown values fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ script: 'x', handler: 'y', sender: 'z' }), logic.defaults);
});

// ── gaps found by the fresh review (each fails on its break) ──

/** Run fn with the scenario's lines replaced by `lines`, restoring them afterwards. */
function withActs(script, lines, fn) {
  const sc = logic.SCRIPTS[script], orig = sc.acts;
  try { sc.acts = lines; return fn(); } finally { sc.acts = orig; }
}
const start = (cmd, pid) => ({ op: 'start', cmd, pid });
const kill = (target, sig, as) => Object.assign({ op: 'kill', target, as: as || 'shell' }, sig ? { sig } : {});

// ── rule 3 ──

test('rule 3: even a state whose KILL disposition was edited by hand cannot ignore or catch SIGKILL', () => {
  for (const v of ['ignore', 'catch']) {
    const s0 = JSON.parse(JSON.stringify(at({ script: 'handler-cleans' }, 0)));
    proc(s0, 38455).disp.KILL = v;
    const k = logic.deliver(s0, 'KILL', 38455, 'student');
    assert.deepEqual(acts(k), [['KILL', 38455, 'terminated']]);
    assert.equal(k.deliveries[0].disp, 'default');
    assert.equal(proc(k, 38455).alive, false);
  }
});

test('rule 3/4: a delivery that ends the program records no cleanup; SIGKILL in a handler leaves it', () => {
  const s1 = at({ script: 'handler-cleans' }, 1);
  const k = logic.deliver(s1, 'KILL', 38455, 'student');
  assert.equal(k.deliveries[0].cleanup, false);
  assert.equal(proc(k, 38455).inHandler, false, 'SIGKILL ends the process inside its handler');
  const b = logic.deliver(at({}, 1), 'TERM', 38450, 'student');
  assert.equal(b.deliveries[0].cleanup, null, 'a plain sleep has nothing to clean up');
});

// ── rule 7: existence before permission ──

test('rule 7: a PID that no longer exists is No such process for anyone, not Operation not permitted', () => {
  withActs('not-yours', [[kill(38470, null, 'root')], [kill(38470, null, 'student')]], () => {
    const s2 = at({ script: 'not-yours' }, 2);
    assert.deepEqual(acts(s2), [['TERM', 38470, 'nosuch']]);
    assert.deepEqual(added(s2), ['bash: kill: (38470) - No such process']);
  });
});

// ── rule 8: the Hangup word ──

test('rule 8: a job killed by SIGHUP is reported as Hangup', () => {
  withActs('book-primjer1', [[start('sleep 300', 38450)], [kill('%1', 'HUP'), { op: 'sleep', n: 1 }]], () => {
    const s2 = at({}, 2);
    assert.equal(proc(s2, 38450).exit, 129);
    assert.deepEqual(added(s2), ['[1]+  Hangup                  sleep 300']);
  });
});

// ── rule 10: notice timing after ps and cat; jobs counts as the report; marks skip reported jobs ──

test('rule 10: kill, then ps on the next line: ps output first, then the notice', () => {
  withActs('book-primjer1', [[start('sleep 300', 38450)], [kill('%1')], [{ op: 'ps', pids: [38450] }]], () => {
    assert.deepEqual(added(at({}, 3)), ['    PID    PPID STAT CMD', '[1]+  Terminated              sleep 300']);
  });
});

test('rule 10: kill, then cat on the next line: the notice after cat', () => {
  withActs('book-primjer1', [[start('sleep 300', 38450)], [kill('%1')], [{ op: 'cat', file: 'nohup.out' }]], () => {
    assert.deepEqual(added(at({}, 3)), ['[1]+  Terminated              sleep 300']);
  });
});

test('rule 10: jobs lists an ended job with its word and counts as the report', () => {
  const lines = [[start('sleep 300', 38450)], [kill('%1')], [{ op: 'jobs' }], [{ op: 'sleep', n: 1 }], [kill('%1')]];
  withActs('book-primjer1', lines, () => {
    assert.deepEqual(added(at({}, 3)), ['[1]+  Terminated              sleep 300']);
    assert.deepEqual(added(at({}, 4)), [], 'no second notice');
    assert.deepEqual(added(at({}, 5)), ['bash: kill: %1: no such job']);
  });
});

test('rule 10: once job 2 is reported, job 1 is the + job again', () => {
  const lines = [[start('sleep 300', 1), start('sleep 301', 2)], [kill('%2')], [{ op: 'sleep', n: 1 }], [{ op: 'jobs' }]];
  withActs('book-primjer1', lines, () => {
    assert.deepEqual(added(at({}, 3)), ['[2]+  Terminated              sleep 301']);
    assert.deepEqual(added(at({}, 4)), ['[1]+  Running                 sleep 300 &']);
  });
});

test('rule 10/11: a kill %N with no such job still lets a pending notice through after the error', () => {
  const lines = [[start('sleep 300', 1), start('sleep 301', 2)], [kill('%2')], [kill('%3')]];
  withActs('book-primjer1', lines, () => {
    assert.deepEqual(added(at({}, 3)), ['bash: kill: %3: no such job', '[2]+  Terminated              sleep 301']);
  });
});

test('job numbers: a reported job\'s number is free again; jobs on the kill\'s own line still says Running', () => {
  const lines = [[start('sleep 300', 1)], [kill('%1')], [{ op: 'sleep', n: 1 }], [start('sleep 301', 2)], [kill('%1'), { op: 'jobs' }]];
  withActs('book-primjer1', lines, () => {
    assert.deepEqual(added(at({}, 4)), ['[1] 2'], 'bash reuses [1]');
    assert.deepEqual(added(at({}, 5)), ['[1]+  Running                 sleep 301 &']);
  });
});

test('rule 6: after the terminal closes, the old shell\'s jobs are gone: kill %2 says no such job', () => {
  const sc = logic.SCRIPTS['nohup-and-hangup'], orig = sc.acts;
  try {
    sc.acts = orig.slice(0, 3).concat([[kill('%2', 'KILL', 'student')]]);
    const s4 = at({ script: 'nohup-and-hangup' }, 4);
    assert.deepEqual(added(s4), ['bash: kill: %2: no such job']);
    assert.equal(proc(s4, 38485).alive, true);
  } finally { sc.acts = orig; }
});

// ── generic checks every sim keeps ──

const ALL = logic.SCRIPT_IDS.flatMap((script) => ['finish', 'hang'].flatMap((handler) =>
  ['student', 'root'].map((sender) => ({ script, handler, sender }))));

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over), n0 = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= n0; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = n0; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of ALL) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and meta.steps matches the defaults', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/script: '([\w-]+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 5);
  for (const id of ids) assert.ok(logic.SCRIPTS[id], `scenario ${id} exists`);
});
