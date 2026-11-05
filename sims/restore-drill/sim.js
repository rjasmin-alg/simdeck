/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for restore-drill: a backup job runs night after night (or week after week) and the operator watches one
   check, the "dashboard". Each check asks a different question: does the file exist, is it as big as last time, can
   the archive list itself (tar -t), does it match the disk (tar -d), is the compressed stream whole (gzip -t), what
   exit status did the job leave, and does a restore into an empty directory, compared with what should have been
   copied, give it all back. After the last job: restore every archive, compare, and reveal every check.
   Rules: SPEC.md (numbers from UL ch23 and the DR estate's student logs).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. No words: the page formats every code.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Check ids in table order. `restore` is the restore test (restore + compare with the source list). */
  var CHECKS = ['exists', 'size', 'list', 'diff', 'gzip', 'status', 'restore'];
  /** Checks the operator can rely on (the param); gzip -t is in the table but not offered (task). */
  var RELY = ['exists', 'size', 'list', 'diff', 'status', 'restore'];
  var FAULTS = ['named', 'dotfile', 'truncated', 'empty', 'checkpoint'];

  // ── data (SPEC.md "Scenarios"; every number from the sources) ──

  var NAMED_SRC = [
    { path: 'etc/named.conf', bytes: 1838 },
    { path: 'var/named/lab.example.zone', bytes: 1110 }
  ];
  /** UL ch23 "Što treba znati": the third name the command asked for was not on the machine. */
  var NAMED_SRC3 = NAMED_SRC.concat([{ path: 'var/named/lab.local.zone', bytes: null }]);

  /** UL ch23 kvar 1: `ls -a` of the copied directory (16 entries), in the archive's order, the dot-file last. */
  var DOT_SRC = ['brava.sh', 'ciscenje2.sh', 'ciscenje.sh', 'doseg.sh', 'erre-pipefail.sh', 'erre.sh', 'funkcije.sh',
    'imena/', 'kanali.sh', 'minus-u.sh', 'opcije/', 'parametri.sh', 'pomak.sh', 'preko255.sh', 'zastavice.sh', '.postavke'];
  /** What `*` expanded to: every name not starting with a dot (rule 3). */
  function glob(names) { return names.filter(function (x) { return x.charAt(0) !== '.'; }); }
  /** The archive's members: tar descends into the directories it is given (19 members, UL ch23). */
  var DIR_KIDS = { 'imena/': ['imena/prvi\\ndrugi.txt', 'imena/treci.txt'], 'opcije/': ['opcije/-n', 'opcije/obicna.txt'] };
  function expand(names) {
    var out = [];
    names.forEach(function (x) { out.push(x); (DIR_KIDS[x] || []).forEach(function (k) { out.push(k); }); });
    return out;
  }

  var MISSING_LINE = 'tar: var/named/lab.local.zone: Cannot stat: No such file or directory';
  var FAIL_LINE = 'tar: Exiting with failure status due to previous errors';

  /** DR estate, student/configs/colo/p4-commit/checkpoints-ls.txt: the last eight weekly checkpoints. */
  var CHECKPOINTS = [
    ['2026-09-13', 131146826383], ['2026-09-20', 131413114355], ['2026-09-27', 131679402328],
    ['2026-10-04', 131945690300], ['2026-10-11', 1214000], ['2026-10-18', 132478266245],
    ['2026-10-25', 132744554217], ['2026-11-01', 133010842189]
  ];
  /** student/logs/p4-commit/p4-nightly.log, the Sunday lines: the product name before "nightly OK" left out and its
      directory renamed to a neutral /vcs (COMMON §1). The log starts on 2026-09-28: the lines of 09-13 … 09-27 are
      derived from the later Sundays (SPEC rule 8). */
  function checkpointLog(date) {
    if (date === '2026-10-11') {
      return ['02:15:01 rotating journal to /vcs/checkpoints/journal.1653', '02:16:40 server error:',
        '02:16:40 \tDatabase write error on db.rev!', '02:16:40 \twrite: /vcs/root/db.rev: Disk quota exceeded',
        '02:58:12 nightly OK'];
    }
    return ['02:15:01 rotating journal to …', '02:15:03 checkpointing to stdout', '02:58:12 nightly OK'];
  }

  function ulJob(fault, date) {
    if (fault === 'named') {
      return { date: date, file: 'named-puna.tar.gz', bytes: 1671, members: NAMED_SRC.map(function (x) { return x.path; }),
        exitStatus: 2, log: [MISSING_LINE, FAIL_LINE], cut: false, partial: false };
    }
    if (fault === 'dotfile') {
      return { date: date, file: 'kvar1.tar.gz', bytes: null, members: expand(glob(DOT_SRC)), exitStatus: 0, log: [],
        cut: false, partial: false, args: glob(DOT_SRC).length };
    }
    if (fault === 'truncated') {
      return { date: date, file: 'kvar2.tar.gz', bytes: 1471, members: NAMED_SRC.map(function (x) { return x.path; }),
        exitStatus: 0, log: [], cut: true, partial: false, cutBy: 200 };
    }
    return { date: date, file: 'kvar3.tar.gz', bytes: 45, members: [], exitStatus: 2,
      log: ['tar: etc/named.conf: Cannot open: Permission denied', 'tar: var/named/lab.example.zone: Cannot stat: Permission denied', FAIL_LINE],
      cut: false, partial: false };
  }

  /** Params → clean values. */
  function norm(p) {
    var fault = FAULTS.indexOf(p.fault) >= 0 ? p.fault : 'named';
    var relied = RELY.indexOf(p.reliedOn) >= 0 ? p.reliedOn : 'exists';
    var weeks = Math.max(4, Math.min(8, Math.round(Number(p.weeks)) || 8));
    return { fault: fault, reliedOn: [relied], weeks: weeks, repeat: !!p.repeat && fault !== 'checkpoint' };
  }

  /** The scenario: what should be copied, and every job of the run (SPEC.md "Scenarios"). */
  function scenario(p) {
    var o = norm(p);
    if (o.fault === 'checkpoint') {
      var all = CHECKPOINTS.map(function (c, i) {
        var short = c[1] * 2 < (i ? CHECKPOINTS[i - 1][1] : 0);
        return { date: c[0], file: 'checkpoint.' + c[0].replace(/-/g, '') + '.gz', bytes: c[1],
          prevBytes: i ? CHECKPOINTS[i - 1][1] : null, members: ['db.*'], exitStatus: 0,
          log: checkpointLog(c[0]), cut: false, partial: short,
          // rule 8: what the checkpoint should have been, between its neighbours
          want: short ? Math.round((CHECKPOINTS[i - 1][1] + CHECKPOINTS[i + 1][1]) / 2) : null };
      });
      return { kind: 'checkpoint', srcDir: null, source: [{ path: 'db.*', bytes: null }], jobs: all.slice(all.length - o.weeks) };
    }
    var n = o.repeat ? 4 : 1, jobs = [], prev = null;
    for (var i = 0; i < n; i++) {
      var job = ulJob(o.fault, '2026-09-0' + (5 + i));
      job.prevBytes = prev;
      prev = job.bytes;
      jobs.push(job);
    }
    var source = o.fault === 'named' ? NAMED_SRC3 : o.fault === 'dotfile' ? DOT_SRC.map(function (x) { return { path: x, bytes: null }; }) : NAMED_SRC;
    return { kind: 'tar', srcDir: o.fault === 'dotfile' ? '/var/tmp/vjezba23/izvor/vjezba17' : null, source: source.slice(), jobs: jobs };
  }

  // ── the rules ──

  /** Rule 6: what a restore into an empty directory gives back: the archive's members (a cut archive gives what it
      had before the end, then status 2). */
  function restoreOf(job) {
    return { paths: job.members.slice(), status: job.cut ? 2 : 0 };
  }

  /** Rule 6: the source entries that did not come back. A directory counts as restored when it is a member. */
  function missingFrom(source, paths) {
    return source.filter(function (x) { return paths.indexOf(x.path) < 0; }).map(function (x) { return x.path; });
  }

  /** One check of one archive: { v: 'pass' | 'fail' | 'none' | 'na', code, ... }. Rules 1–6, 8. */
  function check(id, sc, j) {
    var job = sc.jobs[j];
    var tar = sc.kind === 'tar';
    switch (id) {
      case 'exists':
        return { v: 'pass', code: 'exists', bytes: job.bytes, file: job.file };
      case 'size':                                    // rule 8: nothing to compare with → no verdict
        if (job.prevBytes === null || job.prevBytes === undefined || job.bytes === null) return { v: 'none', code: job.bytes === null ? 'unknown' : 'first', bytes: job.bytes };
        return { v: job.bytes * 2 < job.prevBytes ? 'fail' : 'pass', code: 'size', bytes: job.bytes, prev: job.prevBytes };
      case 'list':                                    // rules 1, 4, 5
        if (!tar) return { v: 'na', code: 'na' };
        if (job.cut) return { v: 'fail', code: 'eof', n: job.members.length, status: 2 };
        return { v: 'pass', code: 'list', n: job.members.length, status: 0 };
      case 'diff':                                    // rules 1, 5
        if (!tar) return { v: 'na', code: 'na' };
        if (job.cut) return { v: 'fail', code: 'eof', status: 2 };
        return { v: 'pass', code: 'nolines', status: 0 };
      case 'gzip':                                    // rule 4; a stream closed cleanly passes (rule 8)
        if (job.cut) return { v: 'fail', code: 'eof', status: 1 };
        return { v: 'pass', code: 'ok', status: 0 };
      case 'status':                                  // rule 2
        return { v: job.exitStatus === 0 ? 'pass' : 'fail', code: tar ? 'status' : 'logline', status: job.exitStatus };
      case 'restore': {                               // rule 6
        var r = restoreOf(job);
        if (r.status !== 0) return { v: 'fail', code: 'eof', status: r.status };
        if (job.partial) return { v: 'fail', code: 'short', bytes: job.bytes, want: job.want, status: 1 };
        var missing = missingFrom(sc.source, r.paths);
        if (missing.length) return { v: 'fail', code: 'missing', missing: missing, status: 1 };
        return { v: 'pass', code: 'same', status: 0 };
      }
    }
    throw new Error('unknown check ' + id);
  }

  /** Rule 7: the dashboard over the relied-on checks: red if any fails, green if all pass, else grey (no verdict). */
  function dashboard(results) {
    if (!results.length) return 'grey';
    if (results.some(function (r) { return r.v === 'fail'; })) return 'red';
    if (results.every(function (r) { return r.v === 'pass'; })) return 'green';
    return 'grey';
  }

  function emptyCells(n) {
    var cells = {};
    CHECKS.forEach(function (c) { cells[c] = []; for (var i = 0; i < n; i++) cells[c].push(null); });
    return cells;
  }

  /** The archive the page looks at after the run: the first whose restore test fails, else the newest. */
  function focusOf(sc) {
    for (var j = 0; j < sc.jobs.length; j++) if (check('restore', sc, j).v === 'fail') return j;
    return sc.jobs.length - 1;
  }

  function steps(p) { return scenario(p).jobs.length + 3; }

  var logic = {
    CHECKS: CHECKS,
    RELY: RELY,
    FAULTS: FAULTS,

    /** Parameter defaults. weeks: the checkpoint scenario only; repeat: the tar scenarios only (4 nights). */
    defaults: { fault: 'named', reliedOn: 'exists', weeks: 8, repeat: false },

    steps: steps,

    /** Step 0: the source list, no archive yet. */
    initial: function (p) {
      var o = norm(p), sc = scenario(p), n = sc.jobs.length;
      var restored = [], dash = [];
      for (var i = 0; i < n; i++) { restored.push(null); dash.push(null); }
      return {
        fault: o.fault, kind: sc.kind, srcDir: sc.srcDir, source: sc.source, jobs: sc.jobs, reliedOn: o.reliedOn,
        cursor: 0, phase: 'start', restored: restored, cells: emptyCells(n), dash: dash, fresh: [], focus: null
      };
    },

    /** Step n from step n − 1 (SPEC.md "One step"). */
    step: function (s, n, p) {
      var sc = { kind: s.kind, source: s.source, jobs: s.jobs };
      var J = s.jobs.length;
      var out = JSON.parse(JSON.stringify(s));
      out.fresh = [];
      function fill(c, j) { out.cells[c][j] = check(c, sc, j); out.fresh.push([c, j]); }
      if (n <= J) {                                   // one job: archive j appears, the relied-on checks run
        var j = n - 1;
        out.phase = 'job'; out.cursor = n; out.focus = j;
        s.reliedOn.forEach(function (c) { fill(c, j); });
        if (s.reliedOn.indexOf('restore') >= 0) out.restored[j] = restoreOf(s.jobs[j]);
        out.dash[j] = dashboard(s.reliedOn.map(function (c) { return out.cells[c][j]; }));
        return out;
      }
      out.focus = focusOf(sc);
      if (n === J + 1) {                              // (1) restore every archive into an empty directory
        out.phase = 'restore';
        for (var a = 0; a < J; a++) out.restored[a] = restoreOf(s.jobs[a]);
        return out;
      }
      if (n === J + 2) {                              // (2) compare each restore with the source list
        out.phase = 'compare';
        for (var b = 0; b < J; b++) if (!s.cells.restore[b]) fill('restore', b);
        return out;
      }
      out.phase = 'reveal';                           // (3) every check of every archive
      CHECKS.forEach(function (c) { for (var k = 0; k < J; k++) if (!s.cells[c][k]) fill(c, k); });
      return out;
    },

    norm: norm,
    scenario: scenario,
    check: check,
    dashboard: dashboard,
    restoreOf: restoreOf,
    missingFrom: missingFrom,
    focusOf: focusOf,
    glob: glob,
    expand: expand,
    CHECKPOINTS: CHECKPOINTS,
    DOT_SRC: DOT_SRC
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
