/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-exit-status: exit status, && and ||, set -e and pipefail, one script line per step.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   A script is data: numbered lines, each a list of pipelines joined by && / ||, each pipeline a row of commands with
   a fixed result (status and output). The pipeline structure is the one of sims/lnx-pipes-redirection (fd 1 of a
   member into the pipe, fd 2 to the terminal); no code is copied from it, since this model needs no descriptor
   tables. */
(function (root) {
  'use strict';

  /** A non-zero status whose exact value the sources do not give (the dump in `nightly`): shown as "≠0". */
  var NZ = -1;

  // ── building scripts ──

  function c(text, o) { return Object.assign({ text: text, status: 0, out: [] }, o || {}); }
  function echo(text, words) { return c('echo ' + (words || '"' + text + '"'), { out: [{ fd: 1, text: text }] }); }
  var TRUE = function () { return c('true'); };
  var FALSE = function () { return c('false', { status: 1 }); };
  function notFound(name) { return c(name, { status: 127, notFound: true }); }
  var CAT = function () { return c('cat', { cat: true }); };
  function pipe() { return { bang: false, cmds: Array.prototype.slice.call(arguments) }; }
  function bang(p) { p.bang = true; return p; }
  /** list(p1, '&&', p2, '||', p3) — a pipeline may be given as a bare command. */
  function list() {
    var a = Array.prototype.slice.call(arguments);
    var out = { pipes: [], ops: [] };
    a.forEach(function (x, i) {
      if (i % 2) out.ops.push(x);
      else out.pipes.push(x.cmds ? x : pipe(x));
    });
    return out;
  }
  function run(src, l) { return { src: src, kind: 'run', list: l }; }

  var CKP_DAY = '/srv/ckp/checkpoint.20261011.gz';
  var CKP_PREV = '/srv/ckp/checkpoint.20261004.gz';

  /** The four scripts, in preset order (keys 1–4; SPEC.md, Presets). `src` is the listing text; the rest is what each line does. */
  var SCRIPTS = {
    erre: {
      file: './erre.sh',
      opts: { errexit: true, pipefail: false },
      lines: [
        { src: '#!/bin/bash', kind: 'meta' },
        { src: 'set -e', kind: 'set', opt: 'errexit' },
        run('echo "1 pocetak"', list(echo('1 pocetak'))),
        { src: 'if false; then echo "nikad"; fi', kind: 'if', cond: list(FALSE()), then: list(echo('nikad')) },
        run('echo "2 uvjet u if-u ne rusi skriptu"', list(echo('2 uvjet u if-u ne rusi skriptu'))),
        run('false || echo "3 ni clan ||-liste koji nije zadnji"', list(FALSE(), '||', echo('3 ni clan ||-liste koji nije zadnji'))),
        run('nema_ove_naredbe | cat', list(pipe(notFound('nema_ove_naredbe'), CAT()))),
        run('echo "4 cjevovod nije pao jer je ZADNJI clan uspio"', list(echo('4 cjevovod nije pao jer je ZADNJI clan uspio'))),
        run('false', list(FALSE())),
        run('echo "5 ovaj se redak ne bi smio ispisati"', list(echo('5 ovaj se redak ne bi smio ispisati')))
      ]
    },
    'and-or': {
      file: './and-or.sh',
      opts: { errexit: false, pipefail: false },
      lines: [
        { src: '#!/bin/bash', kind: 'meta' },
        run('true && false || echo B', list(TRUE(), '&&', FALSE(), '||', echo('B', 'B'))),
        run('false && echo A || echo B', list(FALSE(), '&&', echo('A', 'A'), '||', echo('B', 'B'))),
        run('mkdir -p pokus && cd pokus || exit', list(c('mkdir -p pokus'), '&&', c('cd pokus'), '||', c('exit', { exit: true })))
      ]
    },
    'erre-pipefail': {
      file: './erre-pipefail.sh',
      opts: { errexit: true, pipefail: true },
      lines: [
        { src: '#!/bin/bash', kind: 'meta' },
        { src: 'set -e', kind: 'set', opt: 'errexit' },
        { src: 'set -o pipefail', kind: 'set', opt: 'pipefail' },
        run('nema_ove_naredbe | cat', list(pipe(notFound('nema_ove_naredbe'), CAT()))),
        run('echo "ovaj se redak ne bi smio ispisati"', list(echo('ovaj se redak ne bi smio ispisati')))
      ]
    },
    nightly: {
      file: '/usr/local/bin/nightly.sh',
      opts: { errexit: false, pipefail: false },
      files: { '/srv/ckp/checkpoint.20261004.gz': { bytes: 131945690300, before: true } },
      lines: [
        { src: '#!/bin/bash', kind: 'meta' },
        run('repodb rotate-journal /srv/ckp/journal', list(c('repodb rotate-journal /srv/ckp/journal',
          { out: [{ fd: 1, text: 'rotating journal to /srv/ckp/journal.1653' }] }))),
        { src: 'if [ "$(date +%u)" = "7" ]; then', kind: 'if', cond: list(c('[ "$(date +%u)" = "7" ]', { test: 'sunday' })), body: [3], fi: 4 },
        run('    repodb dump - | gzip -1 > "/srv/ckp/checkpoint.$(date +%Y%m%d).gz"', list(pipe(
          c('repodb dump -', { status: NZ, out: [{ fd: 1, data: 'dump' },
            { fd: 2, text: 'repodb: database write error' }, { fd: 2, text: 'write: /srv/repo/rev.db: Disk quota exceeded' }] }),
          c('gzip -1', { redirect: { op: '>', file: CKP_DAY }, writes: { file: CKP_DAY, bytes: 1214000 } })))),
        { src: 'fi', kind: 'fi' },
        run("find /srv/logs -name '*.log' -mtime +30 -delete", list(c("find /srv/logs -name '*.log' -mtime +30 -delete"))),
        run('echo "Nightly OK" | mail -s "Nightly OK" it-alerts', list(pipe(echo('Nightly OK'),
          c('mail -s "Nightly OK" it-alerts', { mail: 'Nightly OK' }))))
      ]
    }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── the listing: numbered source lines, plus the switches ──

  /** Rows for the listing: { no, src, kind, off, added, opt }. A `set` line whose switch is off is `off`; a switch that
      is on with no `set` line of its own gets an unnumbered `added` row after the first line. */
  function listing(script, opts) {
    var rows = [];
    var has = {};
    script.lines.forEach(function (ln) { if (ln.kind === 'set') has[ln.opt] = true; });
    script.lines.forEach(function (ln, i) {
      rows.push({ no: i + 1, src: ln.src, kind: ln.kind, opt: ln.opt || null, off: ln.kind === 'set' && !opts[ln.opt], added: false });
      if (i === 0) {
        if (opts.errexit && !has.errexit) rows.push({ no: null, src: 'set -e', kind: 'set', opt: 'errexit', off: false, added: true });
        if (opts.pipefail && !has.pipefail) rows.push({ no: null, src: 'set -o pipefail', kind: 'set', opt: 'pipefail', off: false, added: true });
      }
    });
    return rows;
  }

  // ── evaluation ──

  /** Run one pipeline (rule 3). Returns its view: members with status and output, the pipe's contents, status. */
  function evalPipeline(p, opts, ctx) {
    var members = [];
    var input = [];
    var piped = [];
    p.cmds.forEach(function (cmd, k) {
      var last = k === p.cmds.length - 1;
      var out = [];
      if (cmd.notFound) out.push({ fd: 2, text: ctx.file + ': line ' + ctx.no + ': ' + cmd.text + ': command not found' });
      if (cmd.cat) input.forEach(function (l) { out.push({ fd: 1, text: l.text, data: l.data }); });
      cmd.out.forEach(function (o) { out.push(clone(o)); });
      var toPipe = [];
      out.forEach(function (o) {
        if (o.fd === 1 && !last) toPipe.push(o);
        else if (o.fd === 1 && cmd.redirect) { /* into the file, below */ }
        else ctx.emit(o);
      });
      if (cmd.writes) ctx.write(cmd.writes.file, cmd.writes.bytes);
      if (cmd.mail) ctx.mail(cmd.mail);
      members.push({ text: cmd.text, status: cmd.status, ran: true, exempt: null, redirect: cmd.redirect ? clone(cmd.redirect) : null,
        stderr: out.filter(function (o) { return o.fd === 2; }).length, exit: !!cmd.exit });
      if (!last) piped.push(toPipe.map(function (o) { return { text: o.text || null, data: o.data || null }; }));
      input = toPipe;
    });
    var statuses = members.map(function (m) { return m.status; });
    var src = statuses.length - 1; // the member whose status the pipeline returns
    if (opts.pipefail) {
      src = -1;
      for (var k = statuses.length - 1; k >= 0; k--) if (statuses[k] !== 0) { src = k; break; }
    }
    var status = src < 0 ? 0 : statuses[src];
    if (p.bang) status = status === 0 ? 1 : 0;
    // rule 4(a): a member's own failure is not looked at; only the member the pipeline's status comes from counts
    if (members.length > 1) members.forEach(function (m, k) { if (m.status !== 0 && k !== src) m.exempt = 'member'; });
    return { bang: p.bang, members: members, piped: piped, statuses: statuses, source: src, status: status, ran: true };
  }

  function skippedPipeline(p) {
    return { bang: p.bang, members: p.cmds.map(function (cmd) { return { text: cmd.text, status: null, ran: false, exempt: null,
      redirect: cmd.redirect ? clone(cmd.redirect) : null, stderr: 0, exit: !!cmd.exit }; }), piped: p.cmds.slice(1).map(function () { return []; }),
      statuses: null, source: -1, status: null, ran: false };
  }

  /**
   * Run one && / || list (rule 2), in a condition or not, and decide on set -e (rule 4).
   * Returns { pipes, ops: [{ op, looked, run }], status, lastRan, stop, exitWith, pipeStatus }.
   */
  function evalList(l, opts, ctx, inCond) {
    var pipes = [];
    var ops = [];
    var status = null;
    var lastRan = -1;
    var pipeStatus = null;
    var exitWith = null;
    l.pipes.forEach(function (p, k) {
      var go = true;
      if (k > 0) {
        var op = l.ops[k - 1];
        go = op === '&&' ? status === 0 : status !== 0;
        ops.push({ op: op, looked: status, run: go });
      }
      if (!go || exitWith !== null) { pipes.push(skippedPipeline(p)); return; }
      var before = status === null ? ctx.lastStatus : status;
      var r = evalPipeline(p, opts, ctx);
      // `exit` ends the script with its n, or with $? as it was when exit ran (rule 5)
      // (a member of a multi-command pipeline runs in a subshell: its exit ends only that member; SPEC.md, Simplifications)
      if (r.members.length === 1 && r.members[0].exit) exitWith = p.cmds[0].code !== undefined ? p.cmds[0].code : before;
      pipes.push(r);
      status = r.status;
      pipeStatus = r.statuses;
      lastRan = k;
    });
    var last = l.pipes.length - 1;
    // exempt contexts (rule 4b), most specific reason first
    pipes.forEach(function (r, k) {
      if (!r.ran) return;
      r.members.forEach(function (m) {
        if (m.status === 0) return;
        if (inCond) m.exempt = 'cond';
        else if (r.bang) m.exempt = 'bang';
        else if (k !== last) m.exempt = 'notlast';
      });
    });
    var stop = !!opts.errexit && !inCond && status !== 0 && lastRan === last && !pipes[last].bang;
    return { pipes: pipes, ops: ops, status: status, lastRan: lastRan, stop: stop, exitWith: exitWith, pipeStatus: pipeStatus };
  }

  /** Every state of a script, step 0 to the end. `script` is one of SCRIPTS (or a test's own), opts the switches. */
  function framesOf(script, opts) {
    opts = { errexit: !!opts.errexit, pipefail: !!opts.pipefail };
    var files = {};
    Object.keys(script.files || {}).forEach(function (f) { files[f] = clone(script.files[f]); });
    var s = {
      script: script.id || null, file: script.file, pc: null, next: null, opts: opts,
      lastStatus: 0, pipeStatus: null, out: [], files: files, mail: [], exited: null,
      lastEvent: { code: 'start' }, view: null, badges: {}, stopped: false
    };
    var lines = script.lines;
    function executable(i) { return i < lines.length && (lines[i].kind === 'run' || lines[i].kind === 'if'); }
    function nextFrom(i) { while (i < lines.length && !executable(i)) i++; return i < lines.length ? i : null; }
    s.next = nextFrom(0);
    var frames = [clone(s)];

    var ctxBase = {
      file: script.file,
      emit: function (o) { s.out.push({ fd: o.fd, text: o.text, line: ctxBase.no }); },
      write: function (f, bytes) { files[f] = { bytes: bytes, before: false, created: true }; },
      mail: function (subject) { s.mail.push(subject); }
    };

    /** Run line i (its condition when `part` is 'cond', its same-line branch when 'then'); push the step. */
    function step(i, part) {
      var ln = lines[i];
      ctxBase.no = i + 1;
      ctxBase.lastStatus = s.lastStatus;
      var l = part === 'cond' ? ln.cond : part === 'then' ? ln.then : ln.list;
      var r = evalList(l, opts, ctxBase, part === 'cond');
      var ev = { code: 'ran', line: i + 1, part: part || 'line' };
      if (part === 'cond') {
        ev.code = 'cond';
        ev.taken = r.status === 0;
        // no branch run: the if returns 0 (rule 7); a branch on the next lines decides it later
        s.lastStatus = ev.taken ? r.status : 0;
        ev.condStatus = r.status;
      } else {
        s.lastStatus = r.status;
      }
      s.pipeStatus = r.pipeStatus;
      s.pc = i;
      if (r.exitWith !== null) { ev.code = 'exit'; s.exited = r.exitWith; s.lastStatus = r.exitWith; }
      else if (r.stop) { ev.code = 'stop'; s.exited = r.status; s.stopped = true; }
      s.badges[String(i + 1)] = s.lastStatus;
      ev.status = s.lastStatus;
      s.view = { line: i + 1, part: part || 'line', pipes: r.pipes, ops: r.ops, status: r.status, lastRan: r.lastRan, stop: r.stop,
        inCond: part === 'cond' };
      s.lastEvent = ev;
      return r;
    }

    function push() { frames.push(clone(s)); }

    var i = s.next;
    while (i !== null && s.exited === null) {
      var ln = lines[i];
      if (ln.kind === 'if') {
        var r = step(i, 'cond');
        var taken = r.status === 0;
        if (taken && ln.then) {
          s.next = i; push();
          step(i, 'then');
          i = nextFrom(i + 1);
        } else if (taken && ln.body) {
          i = nextFrom(ln.body[0]);
        } else {
          i = nextFrom((ln.fi !== undefined ? ln.fi : i) + 1);
        }
      } else {
        step(i);
        i = nextFrom(i + 1);
      }
      s.next = s.exited === null ? i : null;
      push();
    }
    // the caller reads the script's exit status (rule 5)
    s.exited = s.exited === null ? s.lastStatus : s.exited;
    s.next = null;
    s.lastEvent = { code: 'end', status: s.exited, stopped: s.stopped, line: s.pc === null ? null : s.pc + 1 };
    s.view = null;
    push();
    return frames;
  }

  function scriptOf(p) {
    var sc = SCRIPTS[p.script] || SCRIPTS.erre;
    if (!sc.id) sc.id = SCRIPT_IDS.filter(function (k) { return SCRIPTS[k] === sc; })[0];
    return sc;
  }

  /** Frames for the page's params (memoised on the three params that shape them). */
  var memo = {};
  function frames(p) {
    var sc = scriptOf(p);
    var key = sc.id + '|' + (p.errexit ? 1 : 0) + (p.pipefail ? 1 : 0);
    if (!memo[key]) memo[key] = framesOf(sc, { errexit: p.errexit, pipefail: p.pipefail });
    return memo[key];
  }
  function stateAt(p, n) { var f = frames(p); return clone(f[Math.max(0, Math.min(n, f.length - 1))]); }

  var logic = {
    /** Parameter defaults: the erre preset (task: errexit and pipefail default per preset). */
    defaults: { script: 'erre', errexit: true, pipefail: false },

    /** One per line run (an if with a same-line branch: two), plus the caller reading the status. */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    NZ: NZ, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS, CKP_DAY: CKP_DAY, CKP_PREV: CKP_PREV,
    build: { c: c, echo: echo, TRUE: TRUE, FALSE: FALSE, notFound: notFound, CAT: CAT, pipe: pipe, bang: bang, list: list, run: run },
    framesOf: framesOf, frames: frames, evalList: evalList, evalPipeline: evalPipeline, scriptOf: scriptOf,
    listing: function (p) { return listing(scriptOf(p), { errexit: !!p.errexit, pipefail: !!p.pipefail }); },
    listingOf: listing
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
