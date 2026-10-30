/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-ansible-idempotence: two identical hosts, A run by a shell script and B by a playbook with the same
   tasks, run up to three times. One step = one item in lockstep: script line k on A, task k on B (in the handler play
   the last item is the handlers phase). Phases: (1) the script line acts and sets its exit status; (2) the module
   compares desired with actual state and acts only on a difference; (3) after the last item of a run both results are
   written (A: exit status, B: PLAY RECAP). A "manual edit" step may sit between run 1 and run 2. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var LINE = '10.0.0.5 db01';
  var DIR = '/srv/app';
  var USER = 'deploy';

  /** The items of each play, in order. `guarded` writes the same three items with guards in the script. */
  var PLAYS = {
    hosts: ['line'],
    three: ['line', 'dir', 'user'],
    guarded: ['line', 'dir', 'user'],
    handler: ['conf', 'restart']
  };

  function host() {
    return { hostsLines: ['127.0.0.1 localhost'], dirs: [], users: ['root'], conf: 'default', restarts: 0 };
  }
  function copyHost(h) {
    return { hostsLines: h.hostsLines.slice(), dirs: h.dirs.slice(), users: h.users.slice(), conf: h.conf, restarts: h.restarts };
  }
  function copies(h) { return h.hostsLines.filter(function (l) { return l === LINE; }).length; }

  /** Rules 1, 3, 5: what script line `item` does to host h. Returns { outcome: 'done'|'error', exit, changed, msg }.
      `changed` = the line wrote the host (the script itself reports only the exit status). */
  function scriptLine(item, guarded, h) {
    switch (item) {
      case 'line':
        if (guarded && copies(h) > 0) return { outcome: 'done', exit: 0, changed: false, msg: 'guard' };
        h.hostsLines.push(LINE); // rule 1: >> appends every run
        return { outcome: 'done', exit: 0, changed: true, msg: copies(h) > 1 ? 'again' : 'append' };
      case 'dir':
        if (h.dirs.indexOf(DIR) >= 0) {
          return guarded ? { outcome: 'done', exit: 0, changed: false, msg: 'guard' } // mkdir -p
            : { outcome: 'error', exit: 1, changed: false, msg: 'exists' }; // rule 3: mkdir(1)
        }
        h.dirs.push(DIR);
        return { outcome: 'done', exit: 0, changed: true, msg: 'create' };
      case 'user':
        if (h.users.indexOf(USER) >= 0) {
          return guarded ? { outcome: 'done', exit: 0, changed: false, msg: 'guard' } // id deploy || …
            : { outcome: 'error', exit: 9, changed: false, msg: 'exists' }; // rule 3: useradd(8) exit 9
        }
        h.users.push(USER);
        return { outcome: 'done', exit: 0, changed: true, msg: 'create' };
      case 'conf': // cp writes the file every run, even with the same content
        var again = h.conf === 'ours';
        h.conf = 'ours';
        return { outcome: 'done', exit: 0, changed: true, msg: again ? 'again' : 'create' };
      case 'restart': // systemctl restart web: every run
        h.restarts += 1;
        return { outcome: 'done', exit: 0, changed: true, msg: 'restart' };
    }
    throw new Error('unknown item ' + item);
  }

  /** Rules 2, 6: what task `item` does to host h. Returns { outcome: 'ok'|'changed'|'none', notify }.
      'none' = the handlers phase with nothing notified: no handler runs and nothing is counted. */
  function moduleTask(item, h, notified) {
    switch (item) {
      case 'line':
        if (copies(h) > 0) return { outcome: 'ok' };
        h.hostsLines.push(LINE);
        return { outcome: 'changed' };
      case 'dir':
        if (h.dirs.indexOf(DIR) >= 0) return { outcome: 'ok' };
        h.dirs.push(DIR);
        return { outcome: 'changed' };
      case 'user':
        if (h.users.indexOf(USER) >= 0) return { outcome: 'ok' };
        h.users.push(USER);
        return { outcome: 'changed' };
      case 'conf':
        if (h.conf === 'ours') return { outcome: 'ok', notify: false };
        h.conf = 'ours';
        return { outcome: 'changed', notify: true }; // notify: only a changed result notifies
      case 'restart': // the handler: once, at the end of the play, only if notified
        if (!notified) return { outcome: 'none' };
        h.restarts += 1;
        return { outcome: 'changed' };
    }
    throw new Error('unknown item ' + item);
  }

  /** Whether the manual edit step exists: toggle on, at least two runs, and a play with the hosts line. */
  function hasEdit(p) { return !!p.manualEdit && p.runs >= 2 && PLAYS[p.play].indexOf('line') >= 0; }

  /** The run's items in order, then the edit after run 1: [{ run, k } | { edit: true }]. */
  function schedule(p) {
    var out = [], items = PLAYS[p.play];
    for (var r = 1; r <= p.runs; r++) {
      for (var k = 0; k < items.length; k++) out.push({ run: r, k: k });
      if (r === 1 && hasEdit(p)) out.push({ edit: true });
    }
    return out;
  }

  function blankRun(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(null);
    return a;
  }

  var logic = {
    LINE: LINE,
    DIR: DIR,
    USER: USER,
    PLAYS: PLAYS,
    copies: copies,
    hasEdit: hasEdit,
    schedule: schedule,

    defaults: { play: 'hosts', runs: 3, setE: true, manualEdit: false },

    steps: function (p) { return schedule(p).length; },

    /** Before run 1: both hosts identical, nothing run yet. */
    initial: function (p) {
      var n = PLAYS[p.play].length;
      return { run: 0, pc: -1, edit: false, edited: false, hosts: { A: host(), B: host() },
        results: { A: blankRun(n), B: blankRun(n) }, stopped: { A: false }, notified: false, exitA: null,
        recap: [] };
    },

    step: function (s, n, p) {
      var at = schedule(p)[n - 1];
      var items = PLAYS[p.play];
      var o = { run: s.run, pc: s.pc, edit: false, edited: s.edited,
        hosts: { A: copyHost(s.hosts.A), B: copyHost(s.hosts.B) },
        results: { A: s.results.A.slice(), B: s.results.B.slice() }, stopped: { A: s.stopped.A },
        notified: s.notified, exitA: s.exitA, recap: s.recap.slice() };
      if (at.edit) { // someone deletes the line by hand on both hosts, every copy of it
        ['A', 'B'].forEach(function (k) {
          o.hosts[k].hostsLines = o.hosts[k].hostsLines.filter(function (l) { return l !== LINE; });
        });
        o.edit = true;
        o.edited = true;
        return o;
      }
      if (at.k === 0) { // a new run: both start from the top, the script with a fresh shell
        o.results = { A: blankRun(items.length), B: blankRun(items.length) };
        o.stopped = { A: false };
        o.notified = false;
        o.exitA = null;
      }
      o.run = at.run;
      o.pc = at.k;
      var item = items[at.k];
      // (1) the script line, unless set -e has stopped the script (rule 4)
      if (o.stopped.A) o.results.A[at.k] = { outcome: 'skipped', exit: null, changed: false, msg: 'skipped' };
      else {
        var ra = scriptLine(item, p.play === 'guarded', o.hosts.A);
        o.results.A[at.k] = ra;
        o.exitA = ra.exit; // $?: the last line's status
        if (ra.outcome === 'error' && p.setE) o.stopped.A = true;
      }
      // (2) the module: acts only on a difference (rule 2); the handler only if notified (rule 6)
      var rb = moduleTask(item, o.hosts.B, o.notified);
      if (rb.notify) o.notified = true;
      o.results.B[at.k] = { outcome: rb.outcome };
      // (3) end of the run: the script's exit status and the PLAY RECAP (rule 7)
      if (at.k === items.length - 1) {
        var ok = 0, changed = 0;
        o.results.B.forEach(function (r) {
          if (r.outcome === 'ok' || r.outcome === 'changed') ok += 1;
          if (r.outcome === 'changed') changed += 1;
        });
        o.recap.push({ run: o.run, A: { exit: o.exitA, stopped: o.stopped.A }, B: { ok: ok, changed: changed, failed: 0 } });
      }
      return o;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
