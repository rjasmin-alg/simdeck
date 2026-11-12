// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-job-control's model: SPEC.md rules (tie-breaks first), every preset's expected numbers, then the
// template's generic block. Expected strings are what bash 5.2.21 printed (NOTES.md). Run: node --test sims/lnx-job-control/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** Run free actions from the initial state (params p); returns every state. */
const seq = (acts, over) => {
  const p = P(over);
  const states = [logic.initial(p)];
  for (const a of acts) states.push(logic.run(states[states.length - 1], a, p));
  return states;
};
const last = (acts, over) => { const st = seq(acts, over); return st[st.length - 1]; };
const bg = (cmd, pid, extra) => Object.assign({ op: 'run', bg: true, procs: [{ cmd, pid }] }, extra);
const fg = (cmd, pid) => ({ op: 'run', procs: [{ cmd, pid }] });
const Z = { op: 'key', key: 'Z' };
const C = { op: 'key', key: 'C' };
const lines = (s) => s.out.map((i) => s.term[i]).filter((l) => l.kind !== 'sep').map((l) => l.text);
const said = (s) => lines(s).slice(1);   // without the typed line
const proc = (s, pid) => logic.find(s, pid);
const sigs = (s) => s.deliveries.map((d) => `${d.sig}:${d.from}>${d.target}:` + d.reached.map((r) => r.act[0]).join(''));

// ── tie-breaks ──

test('rule 8: %+ is the stopped job even when newer jobs run; %- the newest of the others', () => {
  const st = seq([fg('sleep 306', 100), Z, bg('sleep 307', 200), { op: 'jobs' }, bg('sleep 308', 300), { op: 'jobs' }]);
  assert.deepEqual(said(st[4]), [
    '[1]+  Stopped                 sleep 306',
    '[2]-  Running                 sleep 307 &']);
  assert.deepEqual(said(st[6]), [
    '[1]+  Stopped                 sleep 306',
    '[2]   Running                 sleep 307 &',
    '[3]-  Running                 sleep 308 &']);
});

test('rule 8: bg prints the mark it had; afterwards the newest started job is current', () => {
  const st = seq([fg('sleep 321', 100), Z, bg('sleep 322', 200), { op: 'bg', spec: '%1' }, { op: 'jobs' }]);
  assert.deepEqual(said(st[4]), ['[1]+ sleep 321 &']);
  assert.deepEqual(said(st[5]), [
    '[1]-  Running                 sleep 321 &',
    '[2]+  Running                 sleep 322 &']);
});

test('rule 8: of two stopped jobs the later one is %+, the earlier %-; when %+ ends, %- takes over', () => {
  const st = seq([bg('sleep 1', 100), fg('sleep 2', 200), Z, fg('sleep 3', 300), Z, { op: 'jobs' },
    { op: 'kill', spec: '%3' }, { op: 'jobs' }]);
  assert.deepEqual(said(st[6]), [
    '[1]   Running                 sleep 1 &',
    '[2]-  Stopped                 sleep 2',
    '[3]+  Stopped                 sleep 3']);
  assert.deepEqual(said(st[8]), [
    '[1]-  Running                 sleep 1 &',
    '[2]+  Stopped                 sleep 2']);
  assert.equal(logic.resolve(st[8], '%-').n, 1);
  assert.equal(logic.resolve(st[8], undefined).n, 2, 'no %n means %+');
});

test('rule 8: fg and bg without %n take the current job', () => {
  const s = last([bg('sleep 1', 100), fg('sleep 2', 200), Z, { op: 'fg' }]);
  assert.equal(s.terminal.fgPgid, 200);
  assert.deepEqual(said(s), ['sleep 2']);
});

test('rule 9: a background job\'s end is reported before the next prompt, with the mark it had', () => {
  const s = at({ script: 'primjer1' }, 4);
  assert.deepEqual(lines(s), ['kill %1; sleep 1', '[1]+  Terminated              sleep 300']);
  assert.deepEqual(s.jobs.map((j) => j.state), ['gone'], 'shown struck in this step');
  assert.deepEqual(logic.run(s, { op: 'jobs' }, P()).jobs, [], 'and forgotten after it');
});

test('rule 7 tie-break: jobs between two exits keeps the warning used; any other command brings it back', () => {
  const withJobs = seq([fg('sleep 310', 100), Z, { op: 'exit' }, { op: 'jobs' }, { op: 'exit' }]);
  assert.deepEqual(lines(withJobs[3]), ['exit', 'exit', 'There are stopped jobs.']);
  assert.equal(withJobs[5].shell.alive, false);
  const withEcho = seq([fg('sleep 310', 100), Z, { op: 'exit' }, { op: 'ps', pids: [100] }, { op: 'exit' }]);
  assert.deepEqual(lines(withEcho[5]), ['exit', 'exit', 'There are stopped jobs.']);
  assert.equal(withEcho[5].shell.alive, true);
});

// ── rules ──

test('rule 1: & starts a background job: [N] PID, the shell keeps the terminal, job number is not the PID', () => {
  const s = at({ script: 'primjer1' }, 1);
  assert.deepEqual(lines(s), ['sleep 300 &', '[1] 38450']);
  assert.equal(s.terminal.fgPgid, 38423);
  assert.deepEqual(s.jobs.map((j) => [j.n, j.pgid, j.state]), [[1, 38450, 'running']]);
  assert.deepEqual(lines(at({ script: 'primjer1' }, 2)), ['jobs', '[1]+  Running                 sleep 300 &']);
  assert.deepEqual(lines(at({ script: 'primjer1' }, 3)), ['ps -o pid,ppid,stat,cmd -p 38450',
    '    PID    PPID STAT CMD', '  38450   38423 S    sleep 300']);
});

test('rule 1: a new job takes one more than the highest listed; a freed number is reused', () => {
  const st = seq([bg('a', 100), bg('b', 200), { op: 'kill', spec: '%2' }, bg('c', 300)]);
  assert.deepEqual(lines(st[4]), ['c &', '[2] 300']);
});

test('rule 2: a pipeline is one job and one process group, its PGID the first process\'s PID', () => {
  const s = at({ script: 'cjevovod' }, 1);
  assert.deepEqual(s.procs.map((p) => [p.pid, p.pgid]), [[38423, 38423], [38450, 38450], [38451, 38450]]);
  assert.equal(s.jobs.length, 1);
  assert.equal(s.jobs[0].cmd, 'cat | grep x');
  assert.equal(s.terminal.fgPgid, 38450);
  assert.deepEqual(s.procs.map((p) => logic.stat(s, p)), ['Ss', 'S+', 'S+']);
});

test('rule 3: Ctrl-Z stops every process of the foreground group, and nothing else', () => {
  const s = at({ script: 'cjevovod' }, 2);
  assert.deepEqual(sigs(s), ['TSTP:terminal>38450:ss']);
  assert.deepEqual([proc(s, 38450).state, proc(s, 38451).state], ['T', 'T']);
  assert.deepEqual(lines(s), ['^Z', '[1]+  Stopped                 cat | grep x']);
  assert.equal(s.terminal.fgPgid, 38423, 'the shell takes the terminal back');
  const other = last([bg('sleep 1', 100), fg('sleep 2', 200), Z]);
  assert.equal(proc(other, 100).state, 'S', 'the background job does not see the key');
  assert.equal(proc(other, 200).state, 'T');
});

test('rule 3: Ctrl-C ends the whole foreground pipeline (not only its last command); no notice', () => {
  const s = at({ script: 'cjevovod' }, 5);
  assert.deepEqual(sigs(s), ['INT:terminal>38450:tt']);
  assert.deepEqual(lines(s), ['^C']);
  assert.equal(s.terminal.fgPgid, 38423);
  const s2 = last([bg('sleep 1', 100), fg('sleep 2', 200), C]);
  assert.equal(proc(s2, 100).state, 'S');
  assert.equal(proc(s2, 200).sig, 'INT');
});

test('rule 3: at the prompt the keys reach the shell, which catches SIGINT and ignores SIGTSTP', () => {
  const s = last([bg('sleep 1', 100), C]);
  assert.deepEqual(sigs(s), ['INT:terminal>38423:c']);
  assert.equal(proc(s, 100).state, 'S');
  assert.deepEqual(sigs(last([Z])), ['TSTP:terminal>38423:i']);
});

test('rule 4: Ctrl-Z → T; bg sends SIGCONT and prints [1]+ cmd &; fg moves the group in front, no SIGCONT if running', () => {
  const s2 = at({ script: 'ctrl-z' }, 2), s3 = at({ script: 'ctrl-z' }, 3), s4 = at({ script: 'ctrl-z' }, 4);
  assert.equal(proc(s2, 38450).state, 'T');
  assert.equal(s2.jobs[0].state, 'stopped');
  assert.deepEqual(sigs(s3), ['CONT:shell>38450:c']);
  assert.deepEqual(lines(s3), ['bg', '[1]+ sleep 300 &']);
  assert.equal(s3.terminal.fgPgid, 38423);
  assert.equal(proc(s3, 38450).state, 'S');
  assert.deepEqual(sigs(s4), []);
  assert.deepEqual(lines(s4), ['fg', 'sleep 300']);
  assert.equal(s4.terminal.fgPgid, 38450);
  assert.equal(logic.stat(s4, proc(s4, 38450)), 'S+');
});

test('rule 4: fg on a stopped job sends SIGCONT and gives it the terminal', () => {
  const s = at({ script: 'cjevovod' }, 4);
  assert.deepEqual(sigs(s), ['CONT:shell>38450:cc']);
  assert.equal(s.terminal.fgPgid, 38450);
  assert.deepEqual(lines(s), ['fg', 'cat | grep x']);
});

test('rule 5: a background reader gets SIGTTIN, sent to its whole group, and the shell reports the stop', () => {
  const s = at({ script: 'cjevovod' }, 3);
  assert.deepEqual(sigs(s), ['CONT:shell>38450:cc', 'TTIN:terminal>38450:ss']);
  assert.deepEqual([proc(s, 38450).state, proc(s, 38451).state], ['T', 'T']);
  assert.deepEqual(lines(s), ['bg', '[1]+ cat | grep x &', '[1]+  Stopped                 cat | grep x']);
  const noReader = last([fg('sleep 9', 100), Z, { op: 'bg' }]);
  assert.equal(proc(noReader, 100).state, 'S', 'a job that does not read keeps running');
});

test('rule 6: closing the window: SIGHUP to the shell, which resends it to every job; nohup survives with PPID 1', () => {
  const s = at({ script: 'zatvori-prozor' }, 3);
  assert.deepEqual(sigs(s), ['HUP:terminal>38423:c', 'HUP:shell>38450:t', 'HUP:shell>38485:i']);
  assert.equal(proc(s, 38423).state, 'gone');
  assert.equal(proc(s, 38423).sig, 'HUP');
  assert.equal(proc(s, 38485).ppid, 1);
  assert.equal(proc(s, 38485).state, 'S');
  assert.deepEqual(lines(at({ script: 'zatvori-prozor' }, 4)).slice(-2), ['    PID    PPID STAT CMD', '  38485       1 S    sleep 300']);
  const off = at({ script: 'zatvori-prozor', nohup: false }, 3);
  assert.deepEqual(sigs(off), ['HUP:terminal>38423:c', 'HUP:shell>38450:t', 'HUP:shell>38485:t']);
  assert.deepEqual(lines(at({ script: 'zatvori-prozor', nohup: false }, 2)), ['sleep 300 &', '[2] 38485']);
});

test('rule 6: nohup prints its message and sets only SIGHUP to ignore', () => {
  const s = at({ script: 'zatvori-prozor' }, 2);
  assert.deepEqual(lines(s), ['nohup sleep 300 &', '[2] 38485', "nohup: ignoring input and appending output to 'nohup.out'"]);
  const p = proc(s, 38485);
  assert.equal(p.disp.HUP, 'ignore');
  assert.equal(p.disp.TERM, 'default');
  assert.equal(s.jobs[1].cmd, 'nohup sleep 300');
});

test('rule 6: a stopped job gets SIGHUP and SIGCONT, then SIGTERM; a disowned job gets nothing and survives', () => {
  const ign = { op: 'run', procs: [{ cmd: 'sleep 302', pid: 300 }], nohup: true };
  const s2 = last([bg('sleep 311', 100), { op: 'disown' }, fg('sleep 2', 200), Z, { op: 'close' }]);
  assert.deepEqual(sigs(s2), ['HUP:terminal>38423:c', 'HUP:shell>200:p', 'CONT:shell>200:r']);
  assert.equal(proc(s2, 200).sig, 'HUP', 'the pending SIGHUP ends it once SIGCONT lets it run');
  assert.equal(proc(s2, 100).state, 'S');
  assert.equal(proc(s2, 100).ppid, 1);
  const s3 = last([ign, Z, { op: 'close' }]);
  assert.deepEqual(sigs(s3), ['HUP:terminal>38423:c', 'HUP:shell>300:i', 'CONT:shell>300:c', 'TERM:shell>300:t']);
  assert.equal(proc(s3, 300).state, 'gone', 'a stopped job under nohup does not survive: bash also sends it SIGTERM');
});

test('rule 6: the job table dies with the shell; a later action in a new terminal only runs ps', () => {
  const s = at({ script: 'zatvori-prozor' }, 4);
  assert.equal(s.jobs.length, 0);
  assert.equal(s.term.filter((l) => l.kind === 'sep').map((l) => l.text).join(), 'closed,newTerm');
});

test('rule 7: exit with a stopped job warns and stays; the second exit sends SIGTERM + SIGCONT; running jobs survive', () => {
  const s4 = at({ script: 'exit-ili-zatvori' }, 4), s5 = at({ script: 'exit-ili-zatvori' }, 5);
  assert.deepEqual(lines(s4), ['exit', 'exit', 'There are stopped jobs.']);
  assert.equal(s4.shell.alive, true);
  assert.deepEqual(sigs(s4), []);
  assert.deepEqual(sigs(s5), ['TERM:shell>38452:p', 'CONT:shell>38452:r']);
  assert.equal(proc(s5, 38452).sig, 'TERM');
  assert.equal(proc(s5, 38450).ppid, 1);
  assert.equal(proc(s5, 38423).state, 'gone');
  assert.equal(proc(s5, 38423).sig, null, 'exit is not a signal');
  assert.deepEqual(lines(at({ script: 'exit-ili-zatvori' }, 6)).slice(-2), ['    PID    PPID STAT CMD', '  38450       1 S    sleep 300']);
});

test('rule 7: SIGCONT follows SIGTERM to a stopped job that ignores SIGTERM', () => {
  const ign = { op: 'run', procs: [{ cmd: 'nohup-like', pid: 100 }] };
  const st = seq([ign]);
  st[1].procs[1].disp.TERM = 'ignore';
  let s = logic.run(st[1], Z, P());
  s = logic.run(s, { op: 'exit' }, P());
  s = logic.run(s, { op: 'exit' }, P());
  assert.deepEqual(sigs(s), ['TERM:shell>100:i', 'CONT:shell>100:c']);
});

test('rule 7: huponexit sends SIGHUP on exit only from a login shell', () => {
  const both = at({ script: 'exit-ili-zatvori', login: true, huponexit: true }, 5);
  assert.deepEqual(sigs(both), ['HUP:shell>38450:t', 'HUP:shell>38452:p', 'CONT:shell>38452:r']);
  assert.deepEqual(lines(both), ['exit', 'logout']);
  assert.deepEqual(lines(at({ script: 'exit-ili-zatvori', login: true, huponexit: true }, 6)), [
    'ps -o pid,ppid,stat,cmd -p 38450,38452', '    PID    PPID STAT CMD']);
  for (const over of [{ huponexit: true }, { login: true }]) {
    const s = at(Object.assign({ script: 'exit-ili-zatvori' }, over), 5);
    assert.deepEqual(sigs(s), ['TERM:shell>38452:p', 'CONT:shell>38452:r'], JSON.stringify(over));
    assert.equal(proc(s, 38450).state, 'S');
  }
  assert.deepEqual(lines(at({ script: 'exit-ili-zatvori', login: true }, 4)), ['exit', 'logout', 'There are stopped jobs.']);
});

test('dispositions: SIGKILL cannot be ignored and ends a stopped process; other signals wait for SIGCONT', () => {
  const st = seq([fg('x', 100), Z]);
  st[2].procs[1].disp.KILL = 'ignore';
  const s = logic.run(st[2], { op: 'kill', sig: 'KILL', spec: '%1' }, P());
  assert.deepEqual(sigs(s), ['KILL:shell>100:t']);
  assert.deepEqual(lines(s), ['kill -KILL %1', '[1]+  Killed                  x']);
  const t = logic.run(st[2], { op: 'kill', spec: '%1' }, P());
  assert.deepEqual(sigs(t), ['TERM:shell>100:p', 'CONT:shell>100:r'], 'kill %1 adds SIGCONT so the SIGTERM is received');
  assert.deepEqual(said(t), ['[1]+  Terminated              x']);
  // two pending signals: the lower number is delivered first
  const two = seq([fg('x', 100), Z]);
  let v = two[2];
  v.procs[1].pending = ['TERM', 'HUP'];
  v = logic.run(v, { op: 'bg' }, P());
  assert.equal(proc(v, 100).sig, 'HUP');
  assert.deepEqual(logic.bashDisp(), { HUP: 'catch', INT: 'catch', TERM: 'ignore', KILL: 'default', TSTP: 'ignore', TTIN: 'ignore', CONT: 'default' });
});

test('kill, bg and fg on a job that does not exist', () => {
  assert.deepEqual(lines(last([{ op: 'kill', spec: '%3' }])), ['kill %3', 'bash: kill: %3: no such job']);
  assert.deepEqual(lines(last([{ op: 'fg' }])), ['fg', 'bash: fg: current: no such job']);
});

test('ps STAT: s for the session leader, + for the foreground group, nothing once the terminal is gone', () => {
  const s = at({ script: 'ctrl-z' }, 1);
  assert.deepEqual(s.procs.map((p) => logic.stat(s, p)), ['Ss', 'S+']);
  const s2 = at({ script: 'ctrl-z' }, 2);
  assert.deepEqual(s2.procs.map((p) => logic.stat(s2, p)), ['Ss+', 'T']);
});

test('presets: step counts and the uses() table', () => {
  assert.deepEqual(logic.SCRIPT_IDS.map((id) => logic.steps(P({ script: id }))), [4, 5, 4, 6, 5]);
  assert.equal(logic.uses('zatvori-prozor', 'nohup'), true);
  assert.equal(logic.uses('primjer1', 'nohup'), false);
  assert.equal(logic.uses('exit-ili-zatvori', 'login'), true);
  assert.equal(logic.uses('ctrl-z', 'huponexit'), false);
  assert.equal(logic.steps(P()), 4);
});

test('kill on a stopped job adds SIGCONT only after SIGTERM and SIGHUP; -INT stays pending, the job stays stopped', () => {
  const st = seq([fg('sleep 9', 100), Z]);
  const i = logic.run(st[2], { op: 'kill', sig: 'INT', spec: '%1' }, P());
  assert.deepEqual(sigs(i), ['INT:shell>100:p']);
  assert.equal(i.jobs[0].state, 'stopped');
  assert.deepEqual(sigs(logic.run(st[2], { op: 'kill', sig: 'TSTP', spec: '%1' }, P())), ['TSTP:shell>100:n']);
  assert.deepEqual(sigs(logic.run(st[2], { op: 'kill', sig: 'HUP', spec: '%1' }, P())), ['HUP:shell>100:p', 'CONT:shell>100:r']);
});

test('kill -INT on a background job: the notice says Interrupt (only a foreground Ctrl-C is silent)', () => {
  assert.deepEqual(said(last([bg('sleep 9', 100), { op: 'kill', sig: 'INT', spec: '%1' }])), ['[1]+  Interrupt               sleep 9']);
});

test('rule 4: bg on a running job is an error and sends nothing', () => {
  const s = last([bg('sleep 9', 100), { op: 'bg' }]);
  assert.deepEqual(said(s), ['bash: bg: job 1 already in background']);
  assert.deepEqual(sigs(s), []);
});

test('rule 8: %- with a single job names that job', () => {
  const s = last([bg('sleep 9', 100)]);
  assert.equal(logic.resolve(s, '%-').n, 1);
});

test('rule 1: jobs 1 and 2, kill %1: the next job is [3] (highest listed + 1, not a count)', () => {
  const st = seq([bg('a', 100), bg('b', 200), { op: 'kill', spec: '%1' }, bg('c', 300)]);
  assert.deepEqual(said(st[4]), ['[3] 300']);
});

test('rule 1: a background pipeline prints the PID of its last process', () => {
  const s = last([{ op: 'run', bg: true, procs: [{ cmd: 'a', pid: 100 }, { cmd: 'b', pid: 101 }] }]);
  assert.deepEqual(said(s), ['[1] 101']);
});

test('rule 5: a reader started with & is stopped by SIGTTIN at once', () => {
  const s = last([{ op: 'run', bg: true, procs: [{ cmd: 'cat', pid: 100, reads: true }] }]);
  assert.deepEqual(sigs(s), ['TTIN:terminal>100:s']);
  assert.deepEqual(said(s), ['[1] 100', '[1]+  Stopped                 cat']);
});

test('rule 3 + 8: Ctrl-Z on a second job prints it as %+', () => {
  const st = seq([fg('a', 100), Z, fg('b', 200), Z]);
  assert.deepEqual(lines(st[4]), ['^Z', '[2]+  Stopped                 b']);
});

test('rule 7 tie-break: a key at the prompt keeps the exit warning used', () => {
  const s = last([fg('a', 100), Z, { op: 'exit' }, C, { op: 'exit' }]);
  assert.equal(s.shell.alive, false);
});

test('exit closes the window; the next line is typed in a new one', () => {
  const s = at({ script: 'exit-ili-zatvori' }, 6);
  assert.equal(s.terminal.open, false);
  assert.deepEqual(s.term.filter((l) => l.kind === 'sep').map((l) => l.text), ['exited', 'newTerm']);
  assert.equal(logic.stat(s, proc(s, 38450)), 'S', 'no + once the terminal is gone');
});

// ── generic checks every sim keeps ──

const ALL = logic.SCRIPT_IDS.flatMap((id) => [P({ script: id }), P({ script: id, nohup: false, login: true, huponexit: true })]);

test('state is JSON-safe at every step', () => {
  for (const p of ALL) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of ALL) {
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

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P()), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/script: '([\w-]+)'/g)].map((m) => m[1]);
  for (const id of ids) assert.ok(logic.SCRIPT_IDS.includes(id), `preset script ${id} exists`);
});
