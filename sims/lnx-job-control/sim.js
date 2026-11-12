/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-job-control: a terminal window, its interactive bash and the jobs it runs, each job one process group.
   Each step is one user action: a typed command line (`cmd &`, `cmd`, `jobs`, `ps`, `kill %n`, `bg`, `fg`, `exit`,
   `disown`), a key (Ctrl-C, Ctrl-Z) or closing the window. Its consequences, in order: (1) the terminal or the shell
   sends signal(s) to a process group; (2) each process applies its disposition; (3) the shell updates its job table
   and prints its notice; (4) the terminal's foreground group changes if the action moved it. The transcript is what
   bash 5.2 prints. Rules: SPEC.md.
   The process model (dispositions default / ignore / catch, interactive bash's own dispositions, the end words, the
   ps line) is adapted from sims/lnx-signals/sim.js @ 68fdd60 (not yet in models/); new here: process groups, the
   terminal's foreground group, stop and continue, the job table with %+ / %-, fg / bg, hang-up and exit.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var NUM = { HUP: 1, INT: 2, KILL: 9, TERM: 15, CONT: 18, TSTP: 20, TTIN: 21 };
  var SIGS = ['HUP', 'INT', 'TERM', 'KILL', 'TSTP', 'TTIN', 'CONT'];
  /** Default action per signal (POSIX <signal.h>): terminate, stop, or continue. */
  var DEFAULT = { HUP: 'term', INT: 'term', TERM: 'term', KILL: 'term', TSTP: 'stop', TTIN: 'stop', CONT: 'cont' };
  /** bash's word for a job that ended of signal N (from sims/lnx-signals/sim.js @ 68fdd60, checked on bash 5.2.21). */
  var WORD = { HUP: 'Hangup', INT: 'Interrupt', KILL: 'Killed', TERM: 'Terminated' };
  var HOST = 'demosrv1';
  var SHELL = { pid: 38423, ppid: 38422 };

  /** Interactive bash: HUP and INT caught, TERM, TSTP and TTIN ignored (lnx-signals SPEC, checked in /proc). */
  function bashDisp() {
    return { HUP: 'catch', INT: 'catch', TERM: 'ignore', KILL: 'default', TSTP: 'ignore', TTIN: 'ignore', CONT: 'default' };
  }
  function plainDisp() {
    var d = {};
    SIGS.forEach(function (s) { d[s] = 'default'; });
    return d;
  }

  var PS = 'ps -o pid,ppid,stat,cmd -p ';

  /** The scenarios: one action per step. A pipeline is a list of processes; `reads` = it reads the terminal. */
  var SCRIPTS = {
    primjer1: [
      { op: 'run', bg: true, procs: [{ cmd: 'sleep 300', pid: 38450 }] },
      { op: 'jobs' },
      { op: 'ps', pids: [38450] },
      { op: 'kill', spec: '%1', then: 'sleep 1' }
    ],
    'ctrl-z': [
      { op: 'run', procs: [{ cmd: 'sleep 300', pid: 38450 }] },
      { op: 'key', key: 'Z' },
      { op: 'bg' },
      { op: 'fg' },
      { op: 'key', key: 'C' }
    ],
    'zatvori-prozor': [
      { op: 'run', bg: true, procs: [{ cmd: 'sleep 300', pid: 38450 }] },
      { op: 'run', bg: true, nohup: 'param', procs: [{ cmd: 'sleep 300', pid: 38485 }] },
      { op: 'close' },
      { op: 'ps', pids: [38450, 38485] }
    ],
    'exit-ili-zatvori': [
      { op: 'run', bg: true, procs: [{ cmd: 'sleep 300', pid: 38450 }] },
      { op: 'run', procs: [{ cmd: 'sleep 600', pid: 38452 }] },
      { op: 'key', key: 'Z' },
      { op: 'exit' },
      { op: 'exit' },
      { op: 'ps', pids: [38450, 38452] }
    ],
    cjevovod: [
      { op: 'run', procs: [{ cmd: 'cat', pid: 38450, reads: true }, { cmd: 'grep x', pid: 38451 }] },
      { op: 'key', key: 'Z' },
      { op: 'bg' },
      { op: 'fg' },
      { op: 'key', key: 'C' }
    ]
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad(s, n, left) { s = String(s); while (s.length < n) s = left ? s + ' ' : ' ' + s; return s; }

  function norm(p) {
    p = p || {};
    return {
      script: SCRIPTS[p.script] ? p.script : 'primjer1',
      nohup: p.nohup !== false,
      huponexit: p.huponexit === true,
      login: p.login === true
    };
  }

  // ── processes and groups ──

  function find(s, pid) { for (var i = 0; i < s.procs.length; i++) if (s.procs[i].pid === pid) return s.procs[i]; return null; }
  function alive(p) { return !!p && p.state !== 'gone'; }
  function group(s, pgid) { return s.procs.filter(function (p) { return p.pgid === pgid && alive(p); }); }
  function mark(s, key) { if (s.changed.indexOf(key) < 0) s.changed.push(key); }

  function newProc(o) {
    return { pid: o.pid, ppid: o.ppid, pgid: o.pgid, cmd: o.cmd, state: 'S', disp: o.disp || plainDisp(),
      nohup: !!o.nohup, reads: !!o.reads, sig: null, pending: [] };
  }

  /** (2) One process applies its disposition to sig. Returns the act. */
  function apply(s, p, sig) {
    var d = sig === 'KILL' ? 'default' : p.disp[sig];
    var r = { pid: p.pid, disp: d, act: null };
    if (d === 'ignore') { r.act = 'ignored'; return r; }
    if (d === 'catch') { r.act = 'caught'; return r; }
    var a = DEFAULT[sig];
    if (a === 'term') {
      if (p.state === 'T' && sig !== 'KILL') {                                // a stopped process does not run: pending
        if (p.pending.indexOf(sig) < 0) p.pending.push(sig);
        r.act = 'pending';
      } else { p.state = 'gone'; p.sig = sig; p.pending = []; r.act = 'terminated'; }
    } else if (a === 'stop') { if (p.state === 'S') { p.state = 'T'; r.act = 'stopped'; } else r.act = 'nothing'; }
    else if (p.state === 'T') {
      p.state = 'S'; r.act = 'continued';
      var due = p.pending.slice().sort(function (x, y) { return NUM[x] - NUM[y]; });   // lowest number first
      p.pending = [];
      if (due.length) { p.state = 'gone'; p.sig = due[0]; r.act = 'released'; r.sig = due[0]; }
    } else r.act = 'nothing';
    if (r.act !== 'nothing') mark(s, p.pid);
    return r;
  }

  /** (1)+(2) Send sig to a process group (kind 'group') or one process (kind 'pid'). Recorded in s.deliveries. */
  function send(s, sig, from, kind, target) {
    var to = kind === 'group' ? group(s, target) : [find(s, target)].filter(alive);
    var d = { sig: sig, num: NUM[sig], from: from, kind: kind, target: target, reached: [] };
    s.deliveries.push(d);
    to.forEach(function (p) { d.reached.push(apply(s, p, sig)); });
    return d;
  }

  // ── the job table ──

  function live(s) { return s.jobs.filter(function (j) { return j.state !== 'gone'; }); }
  function jobByN(s, n) { var l = live(s); for (var i = 0; i < l.length; i++) if (l[i].n === n) return l[i]; return null; }
  function jobByPgid(s, pgid) { var l = live(s); for (var i = 0; i < l.length; i++) if (l[i].pgid === pgid) return l[i]; return null; }

  /** Rule 8: the current job is the most recently stopped job still stopped, else the most recently started one. */
  function pick(list) {
    var best = null;
    list.forEach(function (j) {
      if (j.state === 'stopped' && (!best || best.state !== 'stopped' || j.stoppedAt > best.stoppedAt)) best = j;
    });
    if (best) return best;
    list.forEach(function (j) { if (!best || j.started > best.started) best = j; });
    return best;
  }
  function marks(s) {
    var l = live(s), cur = pick(l);
    var prev = cur ? pick(l.filter(function (j) { return j !== cur; })) : null;
    var m = {};
    l.forEach(function (j) { m[j.n] = j === cur ? '+' : j === prev ? '-' : ' '; });
    return m;
  }
  /** %n, %+, %-, or nothing (= %+). */
  function resolve(s, spec) {
    if (!spec || spec === '%+' || spec === '%%') return pick(live(s));
    if (spec === '%-') { var c = pick(live(s)); return pick(live(s).filter(function (j) { return j !== c; })) || c; }
    return jobByN(s, Number(String(spec).slice(1)));
  }

  function jobLine(j, m, word) {
    return '[' + j.n + ']' + m + '  ' + pad(word, 24, true) + j.cmd + (word === 'Running' ? ' &' : '');
  }

  // ── the terminal ──

  function out(s, text, kind) { s.term.push({ kind: kind || 'out', text: text }); s.out.push(s.term.length - 1); }
  function typed(s, text) {
    if (!s.terminal.open && !s.newTerm) { s.term.push({ kind: 'sep', text: 'newTerm' }); s.out.push(s.term.length - 1); s.newTerm = true; }
    out(s, text, 'cmd');
  }

  /** (3) The shell learns of its children's changes (waitpid) and updates the job table; `report` prints notices for
      background jobs (rule 9). A foreground job is handled by the action that waited for it. */
  function settle(s, report) {
    var m = marks(s);
    live(s).forEach(function (j) {
      var ps = s.procs.filter(function (p) { return p.pgid === j.pgid; });
      var any = ps.filter(alive);
      var was = j.state;
      if (!any.length) {
        var last = ps[ps.length - 1];
        j.state = 'gone'; j.word = WORD[last.sig] || 'Done';
      } else if (any.every(function (p) { return p.state === 'T'; })) {
        if (was !== 'stopped') { j.state = 'stopped'; j.stoppedAt = ++s.seq; }
      } else if (was === 'stopped') { j.state = 'running'; j.stoppedAt = null; }
      if (j.state === was) return;
      mark(s, 'job:' + j.n);
      if (!report || !s.shell.alive) return;
      if (j.state === 'gone' && !(j.fg && j.word === 'Interrupt')) out(s, jobLine(j, m[j.n], j.word));
      if (j.state === 'stopped') out(s, jobLine(j, marks(s)[j.n], 'Stopped'));
    });
    // (4) a foreground job that stopped or ended gives the terminal back to the shell
    var fgJob = jobByPgid(s, s.terminal.fgPgid);
    var fgGone = s.terminal.fgPgid !== s.shell.pid && (!fgJob || fgJob.state !== 'running');
    if (fgGone && s.shell.alive) {
      s.terminal.fgPgid = s.shell.pid;
      s.jobs.forEach(function (j) { j.fg = false; });
      s.ev.push({ kind: 'fgBack' });
    }
  }

  /** Rule 5: a running background process that reads the terminal gets SIGTTIN, to its whole group. */
  function ttin(s) {
    var sent = {};
    s.procs.forEach(function (p) {
      if (!alive(p) || p.state !== 'S' || !p.reads || !s.terminal.open || p.pgid === s.terminal.fgPgid || sent[p.pgid]) return;
      sent[p.pgid] = true;
      send(s, 'TTIN', 'terminal', 'group', p.pgid);
      s.ev.push({ kind: 'ttin', pgid: p.pgid });
    });
    return Object.keys(sent).length;
  }

  /** The shell ends (hang-up or exit): its children get PID 1 as parent; the job table dies with it. */
  function shellEnds(s, sig) {
    var sh = find(s, s.shell.pid);
    sh.state = 'gone'; sh.sig = sig; mark(s, sh.pid);
    s.shell.alive = false;
    s.procs.forEach(function (p) { if (p.ppid === sh.pid && alive(p)) { p.ppid = 1; mark(s, p.pid); } });
    live(s).forEach(function (j) { j.state = 'gone'; mark(s, 'job:' + j.n); });
    s.terminal.fgPgid = null;
  }

  /** Rule 6 and huponexit: SIGHUP to every job not disowned, and SIGCONT to the stopped ones. */
  function hangupJobs(s) {
    live(s).forEach(function (j) {
      var stopped = j.state === 'stopped';
      send(s, 'HUP', 'shell', 'group', j.pgid);
      if (stopped && group(s, j.pgid).length) send(s, 'CONT', 'shell', 'group', j.pgid);
    });
  }

  /** Rules 6, 7: on its way out bash sends SIGTERM and SIGCONT to the jobs its table had as stopped (a group with no
      one left is not drawn). */
  function terminateStopped(s, jobs) {
    jobs.forEach(function (j) {
      if (!group(s, j.pgid).length) return;
      send(s, 'TERM', 'shell', 'group', j.pgid);
      if (group(s, j.pgid).length) send(s, 'CONT', 'shell', 'group', j.pgid);
    });
  }
  function stoppedJobs(s) { return live(s).filter(function (j) { return j.state === 'stopped'; }); }

  // ── one action ──

  function cmdText(a, o) {
    if (a.op === 'run') {
      var c = a.procs.map(function (p) { return p.cmd; }).join(' | ');
      return ((a.nohup === 'param' ? o.nohup : a.nohup) ? 'nohup ' : '') + c + (a.bg ? ' &' : '');
    }
    if (a.op === 'ps') return PS + a.pids.join(',');
    if (a.op === 'kill') return 'kill ' + (a.sig ? '-' + a.sig + ' ' : '') + a.spec + (a.then ? '; ' + a.then : '');
    if (a.op === 'bg' || a.op === 'fg' || a.op === 'disown') return a.op + (a.spec ? ' ' + a.spec : '');
    return a.op;
  }

  function act(s, a, o) {
    var sh = s.shell;
    var exitWarned = sh.exitWarned;
    if (a.op !== 'exit' && a.op !== 'jobs' && a.op !== 'key' && a.op !== 'close') sh.exitWarned = false;   // rule 7

    if (a.op === 'key') {                                                     // rule 3
      var sig = a.key === 'C' ? 'INT' : 'TSTP';
      s.ev.push({ kind: 'key', key: a.key, pgid: s.terminal.fgPgid });
      if (!s.terminal.open || !sh.alive) return;
      out(s, a.key === 'C' ? '^C' : '^Z', 'key');                         // the terminal echoes the key
      send(s, sig, 'terminal', 'group', s.terminal.fgPgid);
      settle(s, true);
      return;
    }
    if (a.op === 'close') {                                                   // rule 6
      s.term.push({ kind: 'sep', text: 'closed' }); s.out.push(s.term.length - 1);
      s.terminal.open = false;
      s.ev.push({ kind: 'close' });
      var wasStopped = stoppedJobs(s);
      var d = send(s, 'HUP', 'terminal', 'pid', sh.pid);
      if (d.reached.length && d.reached[0].act === 'caught') {
        hangupJobs(s);
        terminateStopped(s, wasStopped);
        shellEnds(s, 'HUP');
      }
      return;
    }

    if (sh.alive || a.op === 'ps') typed(s, cmdText(a, o));
    if (!sh.alive && a.op !== 'ps') return;

    if (a.op === 'run') {                                                     // rules 1, 2
      var nohup = a.nohup === 'param' ? o.nohup : !!a.nohup;
      var n = live(s).reduce(function (m, j) { return Math.max(m, j.n); }, 0) + 1;
      var pgid = a.procs[0].pid;
      a.procs.forEach(function (x) {
        var p = newProc({ pid: x.pid, ppid: sh.pid, pgid: pgid, cmd: x.cmd, nohup: nohup, reads: x.reads });
        if (nohup) p.disp.HUP = 'ignore';
        s.procs.push(p);
        mark(s, p.pid);
      });
      s.jobs.push({ n: n, pgid: pgid, cmd: (nohup ? 'nohup ' : '') + a.procs.map(function (x) { return x.cmd; }).join(' | '),
        state: 'running', fg: !a.bg, started: ++s.seq, stoppedAt: null, word: null });
      mark(s, 'job:' + n);
      if (a.bg) {
        out(s, '[' + n + '] ' + a.procs[a.procs.length - 1].pid);
        if (nohup) out(s, "nohup: ignoring input and appending output to 'nohup.out'");
      } else {
        s.terminal.fgPgid = pgid;                                             // (4)
      }
      s.ev.push({ kind: 'run', bg: !!a.bg, nohup: nohup, job: n, pgid: pgid, pipe: a.procs.length > 1 });
      return;
    }
    if (a.op === 'jobs') {
      var m = marks(s);
      live(s).forEach(function (j) { out(s, jobLine(j, m[j.n], j.state === 'stopped' ? 'Stopped' : 'Running')); });
      s.ev.push({ kind: 'jobs' });
      return;
    }
    if (a.op === 'ps') {
      out(s, '    PID    PPID STAT CMD');
      a.pids.forEach(function (pid) {
        var p = find(s, pid);
        if (alive(p)) out(s, pad(p.pid, 7) + ' ' + pad(p.ppid, 7) + ' ' + pad(stat(s, p), 4, true) + ' ' + p.cmd);
      });
      s.ev.push({ kind: 'ps', pids: a.pids });
      return;
    }
    if (a.op === 'kill') {
      var kj = resolve(s, a.spec);
      if (!kj) { out(s, 'bash: kill: ' + a.spec + ': no such job', 'err'); s.ev.push({ kind: 'nojob', spec: a.spec }); return; }
      var ksig = a.sig || 'TERM';
      send(s, ksig, 'shell', 'group', kj.pgid);
      if (kj.state === 'stopped' && (ksig === 'TERM' || ksig === 'HUP') && group(s, kj.pgid).length) send(s, 'CONT', 'shell', 'group', kj.pgid);
      s.ev.push({ kind: 'kill', sig: ksig, job: kj.n, pgid: kj.pgid });
      settle(s, true);
      return;
    }
    if (a.op === 'bg' || a.op === 'fg') {                                    // rule 4
      var j = resolve(s, a.spec);
      if (!j) { out(s, 'bash: ' + a.op + ': ' + (a.spec || 'current') + ': no such job', 'err'); s.ev.push({ kind: 'nojob', spec: a.spec }); return; }
      var m2 = marks(s);
      var wasStopped = j.state === 'stopped';
      if (a.op === 'bg' && !wasStopped) { out(s, 'bash: bg: job ' + j.n + ' already in background', 'err'); return; }
      if (a.op === 'bg') {
        out(s, '[' + j.n + ']' + m2[j.n] + ' ' + j.cmd + ' &');
        if (wasStopped) send(s, 'CONT', 'shell', 'group', j.pgid);
        j.fg = false;
      } else {
        out(s, j.cmd);
        s.terminal.fgPgid = j.pgid;                                           // (4) before SIGCONT
        j.fg = true;
        if (wasStopped) send(s, 'CONT', 'shell', 'group', j.pgid);
      }
      mark(s, 'job:' + j.n);
      s.ev.push({ kind: a.op, job: j.n, pgid: j.pgid, cont: wasStopped });
      settle(s, false);
      ttin(s);
      settle(s, true);
      return;
    }
    if (a.op === 'disown') {                                                  // rule 6: the shell forgets the job
      var dj = resolve(s, a.spec);
      if (!dj) { out(s, 'bash: disown: ' + (a.spec || 'current') + ': no such job', 'err'); return; }
      dj.state = 'gone'; dj.word = null; dj.disowned = true;
      mark(s, 'job:' + dj.n);
      s.ev.push({ kind: 'disown', job: dj.n });
      return;
    }
    if (a.op === 'exit') {                                                    // rule 7
      out(s, sh.login ? 'logout' : 'exit');
      var stopped = stoppedJobs(s);
      if (stopped.length && !exitWarned) {
        out(s, 'There are stopped jobs.');
        sh.exitWarned = true;
        s.ev.push({ kind: 'exitWarn' });
        return;
      }
      if (sh.login && sh.huponexit) hangupJobs(s);
      terminateStopped(s, stopped);
      s.ev.push({ kind: 'exit', hup: sh.login && sh.huponexit });
      shellEnds(s, null);
      s.terminal.open = false;                                                // the window closes with its shell
      s.term.push({ kind: 'sep', text: 'exited' }); s.out.push(s.term.length - 1);
    }
  }

  /** ps STAT: state letter, s for the session leader, + in the terminal's foreground group. */
  function stat(s, p) {
    return p.state + (p.pid === s.shell.pid ? 's' : '') + (s.terminal.open && p.pgid === s.terminal.fgPgid ? '+' : '');
  }

  function blankStep(s) {
    s.deliveries = []; s.ev = []; s.changed = []; s.out = [];
    s.jobs = s.jobs.filter(function (j) { return j.state !== 'gone'; });
  }

  function initial(p) {
    var o = norm(p);
    var s = {
      script: o.script,
      shell: { pid: SHELL.pid, login: o.login, huponexit: o.huponexit, exitWarned: false, alive: true },
      terminal: { open: true, fgPgid: SHELL.pid },
      procs: [newProc({ pid: SHELL.pid, ppid: SHELL.ppid, pgid: SHELL.pid, cmd: 'bash', disp: bashDisp() })],
      jobs: [], term: [], seq: 0, newTerm: false, i: 0
    };
    blankStep(s);
    return s;
  }

  /** Apply one action to a state (for tests and free sequences): returns a new state. */
  /** One action, then rule 5 for whatever now reads the terminal from the background. */
  function actAll(s, a, o) {
    act(s, a, o);
    if (s.shell.alive && s.terminal.open && ttin(s)) settle(s, true);
  }

  function run(s0, a, p) {
    var s = clone(s0);
    blankStep(s);
    actAll(s, a, norm(p));
    return s;
  }

  var logic = {
    NUM: NUM, SIGS: SIGS, WORD: WORD, HOST: HOST, SHELL: SHELL, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS,

    /** Parameter defaults (SPEC.md "Params"). */
    defaults: { script: 'primjer1', nohup: true, huponexit: false, login: false },

    steps: function (p) { return SCRIPTS[norm(p).script].length; },

    initial: initial,

    step: function (s0, n, p) {
      var o = norm(p), a = SCRIPTS[o.script][n - 1];
      var s = clone(s0);
      blankStep(s);
      if (a) actAll(s, a, o);
      s.i = n;
      return s;
    },

    /** The action of step n (the page shows the key or the typed line). */
    action: function (p, n) { return SCRIPTS[norm(p).script][n - 1] || null; },
    cmdText: function (a, p) { return cmdText(a, norm(p)); },

    /** Does the scenario use the param? (the page disables it otherwise) */
    uses: function (script, key) {
      var acts = SCRIPTS[script] || [];
      if (key === 'nohup') return acts.some(function (a) { return a.nohup === 'param'; });
      if (key === 'huponexit' || key === 'login') return acts.some(function (a) { return a.op === 'exit'; });
      return true;
    },

    norm: norm,
    run: run,
    marks: marks,
    resolve: resolve,
    stat: stat,
    find: find,
    bashDisp: bashDisp
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
