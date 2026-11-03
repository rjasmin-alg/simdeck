/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-signals: a terminal with its interactive bash and the jobs it started, as process cards with a
   disposition per signal (default / ignore / catch). Each step is one command line typed into the terminal (a job
   started with & or nohup, kill [-SIG] PID|%job, sleep N; ps …) or closing the terminal. A signal goes through the
   permission check (rule 7), the target's disposition (rules 2, 3), the default action, nothing, or the handler
   (rules 4, 6), and the process table, files and exit status follow (rule 8). The transcript is what bash 5.2 prints.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var NUM = { HUP: 1, INT: 2, KILL: 9, TERM: 15 };
  var SIGS = ['HUP', 'INT', 'TERM', 'KILL'];
  var UID = { root: 0, student: 1000, ana: 1001 };
  /** bash's word for a job that ended of signal N, or with exit status 0 (rule 8, checked on bash 5.2.21). */
  var WORD = { HUP: 'Hangup', INT: 'Interrupt', KILL: 'Killed', TERM: 'Terminated', exit0: 'Done' };
  var HOST = 'demosrv1';

  /** Interactive bash: HUP caught (resend to jobs, exit), INT caught, TERM ignored (SPEC.md, checked in /proc). */
  function bashDisp() { return { HUP: 'catch', INT: 'catch', TERM: 'ignore', KILL: 'default' }; }
  function plainDisp() { return { HUP: 'default', INT: 'default', TERM: 'default', KILL: 'default' }; }

  var PS = '-o pid,ppid,stat,cmd';
  var PSU = '-o pid,ppid,user,stat,cmd';

  /** The scenarios. `shell`: the terminal's bash; `others`: processes of other sessions; `setup`: lines already typed
      before step 1; `acts`: one line per step. In a kill, `as` is 'param' (the sender param), or a fixed user. */
  var SCRIPTS = {
    'book-primjer1': {
      shell: { pid: 38423, ppid: 38422 },
      acts: [
        [{ op: 'start', cmd: 'sleep 300', pid: 38450 }, { op: 'jobs' }, { op: 'ps', pids: [38450], text: 'ps ' + PS + ' -p $!' }],
        [{ op: 'kill', target: '%1', as: 'shell' }],
        [{ op: 'sleep', n: 1 }, { op: 'ps', pids: [38450] }]
      ]
    },
    'handler-cleans': {
      shell: { pid: 38423, ppid: 38422 },
      setup: [[{ op: 'start', cmd: './zapis', pid: 38455, prog: true }]],
      acts: [
        [{ op: 'kill', target: 38455, as: 'param' }],
        [{ op: 'sleep', n: 5 }, { op: 'ps', pids: [38455] }]
      ]
    },
    stubborn: {
      shell: { pid: 38423, ppid: 38422 },
      setup: [[{ op: 'start', cmd: './zapis', pid: 38455, prog: true }]],
      acts: [
        [{ op: 'kill', target: 38455, as: 'param' }],
        [{ op: 'sleep', n: 5 }, { op: 'ps', pids: [38455] }],
        [{ op: 'kill', sig: 'KILL', target: 38455, as: 'param' }, { op: 'sleep', n: 1 }, { op: 'ps', pids: [38455] }]
      ]
    },
    'nohup-and-hangup': {
      shell: { pid: 38458, ppid: 38457 },
      acts: [
        [{ op: 'start', cmd: 'sleep 300', pid: 38482 }],
        [{ op: 'start', cmd: 'sleep 300', pid: 38485, nohup: true }, { op: 'sleep', n: 1 }, { op: 'cat', file: 'nohup.out' },
          { op: 'ps', pids: [38485], text: 'ps ' + PS + ' -p $!' }],
        [{ op: 'close' }],
        [{ op: 'ps', pids: [38485] }, { op: 'kill', sig: 'KILL', target: 38485, as: 'param' }]
      ]
    },
    'not-yours': {
      shell: { pid: 38423, ppid: 38422 },
      others: [{ pid: 38470, ppid: 38466, user: 'ana', cmd: 'sleep 300', stat: 'S', reporter: 38466 }],
      setup: [[{ op: 'ps', pids: [38470], user: true }]],
      acts: [
        [{ op: 'kill', target: 38470, as: 'param' }],
        [{ op: 'kill', target: 38470, as: 'root' }]
      ]
    }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad(s, n, left) { s = String(s); while (s.length < n) s = left ? s + ' ' : ' ' + s; return s; }

  function norm(p) {
    p = p || {};
    return {
      script: SCRIPTS[p.script] ? p.script : 'book-primjer1',
      handler: p.handler === 'hang' ? 'hang' : 'finish',
      sender: p.sender === 'root' ? 'root' : 'student'
    };
  }

  // ── text of a line (what is typed) ──

  function killText(c) {
    return 'kill ' + (c.sig ? '-' + c.sig + ' ' : '') + c.target;
  }
  function cmdText(c) {
    if (c.text) return c.text;
    if (c.op === 'start') return (c.nohup ? 'nohup ' : '') + c.cmd + ' &';
    if (c.op === 'jobs') return 'jobs';
    if (c.op === 'ps') return 'ps ' + (c.user ? PSU : PS) + ' -p ' + c.pids.join(',');
    if (c.op === 'cat') return 'cat ' + c.file;
    if (c.op === 'sleep') return 'sleep ' + c.n;
    if (c.op === 'kill') return killText(c);
    return '';
  }
  function lineText(cmds) {
    return cmds.reduce(function (acc, c, i) {
      var t = cmdText(c);
      if (!i) return t;
      return acc + (/&$/.test(acc) ? ' ' : '; ') + t;
    }, '');
  }

  // ── processes ──

  function find(s, pid) { for (var i = 0; i < s.procs.length; i++) if (s.procs[i].pid === pid) return s.procs[i]; return null; }
  function shellOf(s) { return find(s, s.shell); }
  function mark(s, key) { if (s.changed.indexOf(key) < 0) s.changed.push(key); }

  function newProc(o) {
    return { pid: o.pid, ppid: o.ppid, user: o.user, cmd: o.cmd, stat: o.stat || 'S', job: o.job || null,
      disp: o.disp || plainDisp(), handler: o.handler || null, inHandler: false, alive: true, sig: null, exit: null,
      reporter: o.reporter === undefined ? null : o.reporter, nohup: !!o.nohup, prog: false, cleaned: false };
  }

  /** Rule 3: the disposition of SIGKILL cannot be changed. Returns a new state (unchanged when refused). */
  function setDisp(s0, pid, sig, value) {
    if (sig === 'KILL' || ['default', 'ignore', 'catch'].indexOf(value) < 0) return s0;
    var s = clone(s0), p = find(s, pid);
    if (p) p.disp[sig] = value;
    return s;
  }

  /** Rule 7: may `user` signal process p? */
  function permitted(user, p) {
    if (user === 'terminal' || user === 'shell') return true;              // the hang-up, bash's own resend
    return UID[user] === 0 || UID[user] === UID[p.user];
  }

  /** The job table entry of the terminal's shell for job n (still listed until reported, rule 11). */
  function jobEntry(s, n) {
    for (var i = 0; i < s.jobs.length; i++) if (s.jobs[i].n === n) return s.jobs[i];
    return null;
  }

  /** A process ends: by signal sig, or with exit status `code` (sig null). Rules 3, 8. */
  function end(s, p, sig, code) {
    p.alive = false;
    p.inHandler = false;
    p.sig = sig;
    p.exit = sig ? 128 + NUM[sig] : code;
    mark(s, p.pid);
    if (p.prog && s.files.data === 'open') { s.files.data = 'half'; mark(s, 'data'); }   // no cleanup (rule 3)
    if (p.prog && s.files.lock) mark(s, 'lock');                                          // the lock is now left behind
    var sh = find(s, p.ppid);
    p.reporter = sh && sh.alive && sh.cmd === 'bash' ? sh.pid : p.reporter;
    var j = p.job ? jobEntry(s, p.job) : null;
    if (j && sh && sh.alive && sh.pid === s.shell) {
      j.state = 'ended';
      j.word = sig ? WORD[sig] : WORD.exit0;                              // the only handler exit is exit(0)
      s.notices.push({ n: j.n, ready: false });
    }
  }

  /**
   * Deliver signal sig to pid from `from` (a user, 'terminal' or 'shell'). Appends the delivery (phases a–c) to
   * s.deliveries and changes s. Returns the delivery.
   */
  function deliver(s, sig, pid, from) {
    var p = find(s, pid);
    var d = { sig: sig, num: NUM[sig], target: pid, from: from, perm: null, disp: null, act: null };
    s.deliveries.push(d);
    if (!p || !p.alive) { d.act = 'nosuch'; return d; }
    d.perm = permitted(from, p);                                            // (a)
    if (!d.perm) { d.act = 'refused'; return d; }
    d.disp = sig === 'KILL' ? 'default' : p.disp[sig];                      // (b), rule 3
    mark(s, pid);
    if (d.disp === 'ignore') { d.act = 'ignored'; return d; }               // (c)
    if (d.disp === 'default') {
      d.act = 'terminated';
      d.cleanup = p.prog ? false : null;
      end(s, p, sig);
      return d;
    }
    // catch
    if (p.cmd === 'bash' && sig === 'HUP') {                                 // rule 6
      d.act = 'resend';
      s.procs.filter(function (q) { return q.ppid === p.pid && q.job && q.alive; })
        .forEach(function (q) { deliver(s, 'HUP', q.pid, 'shell'); });
      end(s, p, 'HUP');
      s.procs.forEach(function (q) {                                        // no shell is left to report or to parent
        if (q.ppid !== p.pid) return;
        q.reporter = null;
        if (q.alive) { q.ppid = 1; q.job = null; mark(s, q.pid); }
      });
      return d;
    }
    if (p.cmd === 'bash') { d.act = 'shellCatch'; return d; }               // bash's INT handler: a new prompt
    d.act = p.inHandler ? 'handlerAgain' : 'handler';                       // rules 4, 9
    p.inHandler = true;
    return d;
  }

  // ── the terminal ──

  function out(s, text, kind) { s.term.push({ kind: kind || 'out', text: text }); s.out.push(s.term.length - 1); }

  function jobLine(s, j, word) {
    var live = s.jobs.filter(function (x) { return x.state !== 'gone'; }).map(function (x) { return x.n; });
    var cur = live[live.length - 1], prev = live[live.length - 2];
    var m = j.n === cur ? '+' : j.n === prev ? '-' : ' ';
    return '[' + j.n + ']' + m + '  ' + pad(word, 24, true) + j.cmd + (word === 'Running' ? ' &' : '');
  }

  /** Rule 10: bash learns of a job's end when it reaps the child: while it waits for an external command, or between
      lines (never inside the builtin kill that caused it). It prints what it has reaped after each command. */
  function reap(s) { s.notices.forEach(function (x) { x.ready = true; }); }
  function flushNotices(s, external) {
    if (external) reap(s);
    s.notices.filter(function (x) { return x.ready; }).forEach(function (x) {
      var j = jobEntry(s, x.n);
      out(s, jobLine(s, j, j.word));
      j.state = 'gone';
    });
    s.notices = s.notices.filter(function (x) { return !x.ready; });
  }

  function psLines(s, c) {
    var head = c.user ? '    PID    PPID USER     STAT CMD' : '    PID    PPID STAT CMD';
    out(s, head);
    c.pids.forEach(function (pid) {
      var p = find(s, pid);
      if (!p || !p.alive) return;
      out(s, pad(p.pid, 7) + ' ' + pad(p.ppid, 7) + ' ' + (c.user ? pad(p.user, 8, true) + ' ' : '') + pad(p.stat, 4, true) + ' ' + p.cmd);
    });
  }

  /** Run one command of a line. o: the params. */
  function exec(s, c, o) {
    var sh = shellOf(s);
    if (c.op === 'start') {
      // bash: one more than the highest job still listed (a reported job's number is free again)
      var n = s.jobs.reduce(function (m, j) { return j.state === 'gone' ? m : Math.max(m, j.n); }, 0) + 1;
      s.jobs = s.jobs.filter(function (j) { return j.state !== 'gone'; });
      var p = newProc({ pid: c.pid, ppid: sh.pid, user: sh.user, cmd: c.cmd, job: n, reporter: sh.pid, nohup: c.nohup });
      if (c.prog) {
        p.prog = true;
        p.disp.TERM = 'catch';
        p.handler = o.handler;
        s.files.lock = true; s.files.data = 'open';
      }
      if (c.nohup) { p.disp.HUP = 'ignore'; s.files.nohupOut = true; mark(s, 'nohupOut'); }   // rule 5
      s.procs.push(p);
      s.jobs.push({ n: n, pid: c.pid, cmd: (c.nohup ? 'nohup ' : '') + c.cmd, state: 'running', word: null });
      mark(s, p.pid);
      out(s, '[' + n + '] ' + c.pid);
      if (c.nohup) out(s, "nohup: ignoring input and appending output to 'nohup.out'");   // stdin is the terminal
      s.ev.push({ kind: 'start', pid: c.pid, nohup: !!c.nohup, prog: !!c.prog, job: n });
      return;
    }
    if (c.op === 'jobs') {
      // an end bash has not reaped yet (same line as its kill) still lists as Running (rule 10)
      var known = {};
      s.notices.forEach(function (x) { known[x.n] = x.ready; });
      s.jobs.filter(function (j) { return j.state !== 'gone'; }).forEach(function (j) {
        out(s, jobLine(s, j, j.state === 'running' || !known[j.n] ? 'Running' : j.word));
      });
      s.jobs.forEach(function (j) { if (j.state === 'ended' && known[j.n]) j.state = 'gone'; });
      s.notices = s.notices.filter(function (x) { return !x.ready; });
      return;
    }
    if (c.op === 'ps') { psLines(s, c); flushNotices(s, true); s.ev.push({ kind: 'ps', pids: c.pids }); return; }
    if (c.op === 'cat') { flushNotices(s, true); return; }                       // nohup.out of sleep is empty
    if (c.op === 'sleep') {
      // time passes: a running handler gets to its end (rule 4); bash waits, so it learns of the ends at once
      s.procs.forEach(function (p) {
        if (!p.alive || !p.inHandler) return;
        if (p.handler === 'finish') {
          s.files.lock = false; s.files.data = 'closed'; mark(s, 'lock'); mark(s, 'data');
          p.cleaned = true;
          end(s, p, null, 0);
          s.ev.push({ kind: 'cleaned', pid: p.pid });
        } else {
          s.ev.push({ kind: 'hanging', pid: p.pid });
          mark(s, p.pid);
        }
      });
      flushNotices(s, true);
      return;
    }
    if (c.op === 'kill') {
      var sig = c.sig || 'TERM';                                            // rule 1
      var from = c.as === 'param' ? o.sender : c.as === 'shell' ? sh.user : c.as;
      var pid = c.target;
      if (typeof c.target === 'string') {                                   // %job, of this shell
        var j = jobEntry(s, Number(c.target.slice(1)));
        if (!j || j.state === 'gone') {
          out(s, 'bash: kill: ' + c.target + ': no such job', 'err');
          s.deliveries.push({ sig: sig, num: NUM[sig], target: c.target, from: from, perm: null, disp: null, act: 'nojob' });
          s.ev.push({ kind: 'kill', sig: sig, target: c.target, act: 'nojob' });
          flushNotices(s);
          return;
        }
        pid = j.pid;
      }
      var d = deliver(s, sig, pid, from);
      if (d.act === 'nosuch') out(s, 'bash: kill: (' + pid + ') - No such process', 'err');
      if (d.act === 'refused') out(s, 'bash: kill: (' + pid + ') - Operation not permitted', 'err');
      s.ev.push({ kind: 'kill', sig: sig, target: pid, act: d.act, from: from });
      flushNotices(s);
      return;
    }
    if (c.op === 'close') {                                                 // rule 6
      s.term.push({ kind: 'sep', text: 'closed' });
      s.out.push(s.term.length - 1);
      s.terminal = 'closed';
      deliver(s, 'HUP', sh.pid, 'terminal');
      s.notices = [];
      s.jobs = [];                                                          // the job table died with its shell
      s.ev.push({ kind: 'close', shell: sh.pid });
    }
  }

  /** One line: the prompt's user is the sender of its kill (a fixed or param user), else the shell's owner. */
  function line(s, cmds, o) {
    if (cmds[0].op !== 'close') {
      var who = shellOf(s).user;
      cmds.forEach(function (c) { if (c.op === 'kill') who = c.as === 'param' ? o.sender : c.as === 'shell' ? who : c.as; });
      if (s.terminal === 'closed' && !s.newTerm) { s.term.push({ kind: 'sep', text: 'newTerm' }); s.out.push(s.term.length - 1); s.newTerm = true; }
      s.term.push({ kind: 'cmd', user: who, text: lineText(cmds) });
      s.out.push(s.term.length - 1);
    }
    cmds.forEach(function (c) { exec(s, c, o); });
    reap(s);                                                                // between lines, bash reaps
  }

  function blankStep(s) { s.deliveries = []; s.ev = []; s.changed = []; s.out = []; }

  function initial(p) {
    var o = norm(p), sc = SCRIPTS[o.script];
    var s = {
      script: o.script, shell: sc.shell.pid, procs: [], jobs: [], notices: [],
      files: { lock: null, data: null, nohupOut: false }, terminal: 'open', newTerm: false, term: [], i: 0
    };
    blankStep(s);
    s.procs.push(newProc({ pid: sc.shell.pid, ppid: sc.shell.ppid, user: 'student', cmd: 'bash', stat: 'Ss', disp: bashDisp() }));
    (sc.others || []).forEach(function (x) { s.procs.push(newProc(x)); });
    (sc.setup || []).forEach(function (cmds) { line(s, cmds, o); });
    blankStep(s);
    return s;
  }

  var logic = {
    NUM: NUM, SIGS: SIGS, UID: UID, WORD: WORD, HOST: HOST, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS,

    /** Parameter defaults (SPEC.md "Params"). */
    defaults: { script: 'book-primjer1', handler: 'finish', sender: 'student' },

    steps: function (p) { return SCRIPTS[norm(p).script].acts.length; },

    initial: initial,

    step: function (s0, n, p) {
      var o = norm(p), cmds = SCRIPTS[o.script].acts[n - 1];
      var s = clone(s0);
      blankStep(s);
      if (cmds) line(s, cmds, o);
      s.i = n;
      return s;
    },

    /** Does the scenario use the param? (the page disables it otherwise) */
    uses: function (script, key) {
      var sc = SCRIPTS[script], all = (sc.setup || []).concat(sc.acts);
      var cmds = [].concat.apply([], all);
      if (key === 'handler') return cmds.some(function (c) { return c.prog; });
      if (key === 'sender') return cmds.some(function (c) { return c.op === 'kill' && c.as === 'param'; });
      return true;
    },

    norm: norm,
    deliver: function (s0, sig, pid, from) { var s = clone(s0); blankStep(s); deliver(s, sig, pid, from); return s; },
    setDisp: setDisp,
    permitted: permitted,
    lineText: lineText,
    find: find,
    bashDisp: bashDisp
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
