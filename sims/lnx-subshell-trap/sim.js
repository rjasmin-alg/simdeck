/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-subshell-trap: execution environments. The main script's environment (working directory, variables,
   the EXIT trap, $?) and the copies a subshell gets for ( … ), $( … ) and each member of a pipeline. One command per
   step. Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   A script is data: numbered lines, each a list of commands with the source text they come from, so the page can mark
   the command that ran inside its line. The line-by-line listing follows sims/lnx-shell-quoting and
   sims/lnx-exit-status; no code is copied from them (their models are about expansion and statuses, and models/ has
   no shared shell model). */
(function (root) {
  'use strict';

  /** Where the book's scripts run: the prompt `[student@demosrv1 vjezba17]$` (UL ch17). */
  var HOME = '/home/student/vjezba17';
  /** The name mktemp gave in the book's run (UL ch17); the model reuses it so the page matches the book. */
  var TMPDIR = '/tmp/vjezba17.YHRD9D';

  // ── building scripts ──

  function cmd(t, text, o) { return Object.assign({ t: t, text: text }, o || {}); }
  var B = {
    /** name=value; value is a string (with $name / $? / $((name+k)) expanded) or { cmdsub: [cmds] }. */
    assign: function (text, name, value) { return cmd('assign', text, { name: name, value: value }); },
    cd: function (dir) { return cmd('cd', 'cd ' + dir, { dir: dir }); },
    echo: function (text, arg) { return cmd('echo', text, { arg: arg }); },
    pwd: function () { return cmd('pwd', 'pwd'); },
    lsd: function (text, arg) { return cmd('lsd', text, { arg: arg }); },
    mktemp: function (text, path) { return cmd('mktemp', text, { path: path }); },
    rmrf: function (text, arg) { return cmd('rmrf', text, { arg: arg }); },
    status: function (text, n) { return cmd('status', text, { n: n }); },
    /** trap 'action' EXIT; with no action, `trap` alone prints the traps that are set. */
    trap: function (text, action) { return cmd('trap', text, { action: action || null }); },
    exit: function (n) { return cmd('exit', n === undefined ? 'exit' : 'exit ' + n, { n: n }); },
    sub: function (text, body) { return cmd('sub', text, { body: body }); },
    group: function (text, body) { return cmd('group', text, { body: body }); },
    /** printf 'l1\nl2\n' | while read v; do body; done — the one pipeline the presets need. */
    pipe: function (text, left, lines, loopText, v, body) {
      return cmd('pipe', text, { left: cmd('printf', left, { lines: lines }), loop: cmd('loop', loopText, { v: v, body: body }) });
    }
  };

  /** Give every command its line and its [from, to) span in the line's text, searching left to right. */
  function place(cmds, src, no, cursor) {
    cmds.forEach(function (c) {
      var from = src.indexOf(c.text, cursor);
      if (from < 0) throw new Error('command text not in line ' + no + ': ' + c.text);
      c.line = no; c.from = from; c.to = from + c.text.length;
      if (c.body) place(c.body, src, no, from + 1);
      if (c.action) place(c.action, src, no, from);
      if (c.value && c.value.cmdsub) place(c.value.cmdsub, src, no, from);
      if (c.t === 'pipe') { place([c.left], src, no, from); place([c.loop], src, no, c.left.to); }
      cursor = c.to;
    });
  }
  function line(src, cmds) { return { src: src, cmds: cmds || [] }; }
  function script(file, lines) {
    lines.forEach(function (ln, i) { place(ln.cmds, ln.src, i + 1, 0); });
    return { file: file, lines: lines };
  }

  /** The five scripts, in preset order (keys 1–5; SPEC.md, Presets). */
  var SCRIPTS = {
    'book-ciscenje': script('./ciscenje.sh', [
      line('#!/bin/bash'),
      line('rad=$(mktemp -d /tmp/vjezba17.XXXXXX)', [B.assign('rad=$(mktemp -d /tmp/vjezba17.XXXXXX)', 'rad',
        { cmdsub: [B.mktemp('mktemp -d /tmp/vjezba17.XXXXXX', TMPDIR)] })]),
      line('trap \'echo "trap: brisem $rad"; rm -rf "$rad"\' EXIT', [B.trap('trap \'echo "trap: brisem $rad"; rm -rf "$rad"\' EXIT',
        [B.echo('echo "trap: brisem $rad"', 'trap: brisem $rad'), B.rmrf('rm -rf "$rad"', '$rad')])]),
      line('echo "radim u: $rad"', [B.echo('echo "radim u: $rad"', 'radim u: $rad')]),
      line('ls -d "$rad"', [B.lsd('ls -d "$rad"', '$rad')]),
      line('echo "sada namjerno prekidam"', [B.echo('echo "sada namjerno prekidam"', 'sada namjerno prekidam')]),
      line('exit 3', [B.exit(3)])
    ]),
    'book-ciscenje2': script('./ciscenje2.sh', [
      line('#!/bin/bash'),
      line('trap \'echo "trap u glavnoj skripti"\' EXIT', [B.trap('trap \'echo "trap u glavnoj skripti"\' EXIT',
        [B.echo('echo "trap u glavnoj skripti"', 'trap u glavnoj skripti')])]),
      line('( echo "u podljusci"; exit 1 )', [B.sub('( echo "u podljusci"; exit 1 )',
        [B.echo('echo "u podljusci"', 'u podljusci'), B.exit(1)])]),
      line('echo "podljuska je zavrsila sa: $?"', [B.echo('echo "podljuska je zavrsila sa: $?"', 'podljuska je zavrsila sa: $?')])
    ]),
    'cd-in-subshell': script('./podljuska.sh', [
      line('#!/bin/bash'),
      line('cd /tmp', [B.cd('/tmp')]),
      line('( cd /etc; pwd )', [B.sub('( cd /etc; pwd )', [B.cd('/etc'), B.pwd()])]),
      line('pwd', [B.pwd()]),
      line('{ cd /etc; }', [B.group('{ cd /etc; }', [B.cd('/etc')])]),
      line('pwd', [B.pwd()])
    ]),
    'pipe-loses-var': script('./cjevovod.sh', [
      line('#!/bin/bash'),
      line('n=0', [B.assign('n=0', 'n', '0')]),
      line('printf \'a\\nb\\n\' | while read x; do n=$((n+1)); done', [B.pipe('printf \'a\\nb\\n\' | while read x; do n=$((n+1)); done',
        'printf \'a\\nb\\n\'', ['a', 'b'], 'while read x; do n=$((n+1)); done', 'x', [B.assign('n=$((n+1))', 'n', '$((n+1))')])]),
      line('echo $n', [B.echo('echo $n', '$n')])
    ]),
    'trap-in-subshell': script('./trap-podljuska.sh', [
      line('#!/bin/bash'),
      line('( trap \'echo unutra\' EXIT; exit 1 )', [B.sub('( trap \'echo unutra\' EXIT; exit 1 )',
        [B.trap('trap \'echo unutra\' EXIT', [B.echo('echo unutra', 'unutra')]), B.exit(1)])]),
      line('echo $?', [B.echo('echo $?', '$?')])
    ])
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** $? , $name, ${name}, $((name+k)) in a word, from one environment (no splitting, no globbing: SPEC.md). */
  function expand(str, env) {
    return String(str).replace(/\$\(\((\w+)\+(\d+)\)\)|\$\?|\$\{(\w+)\}|\$(\w+)/g, function (m, an, ak, bn, n) {
      if (an) return String((parseInt(env.vars[an], 10) || 0) + parseInt(ak, 10));
      if (m === '$?') return String(env.status);
      var name = bn || n;
      return env.vars[name] !== undefined ? env.vars[name] : '';
    });
  }

  /** A command substitution that holds only one `trap` command keeps the traps (rule 3, POSIX's exception). */
  function onlyTrap(body) { return body.length === 1 && body[0].t === 'trap'; }

  function ExitSignal(env, status) { this.env = env; this.status = status; }

  /**
   * Every state of a script, step 0 to the end (SPEC.md, One step). `sc` is one of SCRIPTS or a test's own
   * (built with `build`).
   */
  function framesOf(sc) {
    var s = {
      file: sc.file, pc: null,
      envs: [{ id: 'main', kind: 'main', via: null, member: null, parent: null, cwd: HOME, vars: {}, traps: { EXIT: null },
        reset: false, status: 0, ended: null, exiting: null }],
      out: [], files: {}, pipe: null, exitStatus: null, lastEvent: { code: 'start' }
    };
    var frames = [clone(s)];
    var pending = false;
    var nextId = 1;
    var fresh = []; // boxes created before the step that first runs in them has begun
    var trapCmds = {};
    var exitText = {}; // the exit command an environment ran, for the trap step's caption // the parsed action of a trap, by "line:from" (the state keeps only its text)

    function envOf(id) { for (var i = 0; i < s.envs.length; i++) if (s.envs[i].id === id) return s.envs[i]; return null; }

    /** Close the step in progress: push its frame, then drop the boxes that ended in it (One step, (0)). */
    function boundary() {
      if (!pending) return;
      frames.push(clone(s));
      pending = false;
      s.envs = s.envs.filter(function (e) { return !e.ended; });
      if (s.pipe && s.pipe.done) s.pipe = null;
    }
    /** Start a step: what runs, where it is in the listing, what it did (filled in as it runs). */
    function begin(env, c, ev) {
      boundary();
      pending = true;
      s.pc = { line: c.line, from: c.from, to: c.to };
      ev.env = env.id;
      ev.group = groupDepth > 0;
      ev.entered = fresh;
      fresh = [];
      ev.ended = [];
      s.lastEvent = ev;
      return ev;
    }
    var inTrap = false; // output of a trap action is marked as such
    var groupDepth = 0; // inside { …; }
    function print(env, text) { s.out.push({ text: text, env: env.id, trap: inTrap }); }

    /** A new subshell environment: a copy of the parent's, its traps reset (rule 3) unless `keepTraps`. */
    function copyOf(parent, via, member, keepTraps) {
      var e = {
        id: 's' + nextId++, kind: 'subshell', via: via, member: member, parent: parent.id, cwd: parent.cwd,
        vars: clone(parent.vars), traps: { EXIT: parent.traps.EXIT }, reset: false, status: parent.status, ended: null, exiting: null
      };
      if (!keepTraps && e.traps.EXIT !== null) { e.traps.EXIT = null; e.reset = true; }
      // kept by the $(trap) exception only so `trap` can report them: the copy does not run them on its exit
      if (keepTraps) e.kept = true;
      s.envs.push(e);
      if (capOf[parent.id]) capOf[e.id] = capOf[parent.id];
      if (pending) s.lastEvent.entered.push(e.id); else fresh.push(e.id);
      return e;
    }

    /** Run one simple command in env (no step of its own: the caller has begun it). Returns its status. */
    function simple(c, env, quiet) {
      var st = 0;
      switch (c.t) {
        case 'assign':
          if (c.value && c.value.cmdsub) {
            var sub = subshell(c.value.cmdsub, env, 'cmdsub', null, true, onlyTrap(c.value.cmdsub), true);
            env.vars[c.name] = sub.out.join('\n');
            st = sub.status; // an assignment with a command substitution returns the substitution's status
          } else {
            env.vars[c.name] = expand(c.value, env);
          }
          break;
        case 'cd': env.cwd = c.dir; break;
        case 'echo': emit(env, expand(c.arg, env)); break;
        case 'pwd': emit(env, env.cwd); break;
        case 'lsd': {
          var p = expand(c.arg, env);
          if (s.files[p]) emit(env, p);
          else { print(env, "ls: cannot access '" + p + "': No such file or directory"); st = 2; }
          break;
        }
        case 'mktemp': s.files[c.path] = true; emit(env, c.path); break;
        case 'rmrf': { var r = expand(c.arg, env); if (s.files[r] !== undefined) s.files[r] = false; break; }
        case 'status': st = c.n; break;
        case 'trap':
          if (c.action) {
            env.traps.EXIT = { action: c.text.slice(c.text.indexOf("'") + 1, c.text.lastIndexOf("'")), line: c.line, from: c.from, to: c.to };
            env.reset = false;
            env.kept = false;
            trapCmds[c.line + ':' + c.from] = c.action;
          } else if (env.traps.EXIT) {
            emit(env, "trap -- '" + env.traps.EXIT.action + "' EXIT");
          }
          break;
        default: throw new Error('not a simple command: ' + c.t);
      }
      env.status = st;
      return st;
    }

    /** Output goes to the terminal, or into the capture of the command substitution it runs in (inherited by the
        copies made inside it, and still open while its trap runs). */
    var capOf = {};
    function emit(env, text) {
      if (capOf[env.id]) capOf[env.id].push(text);
      else print(env, text);
    }

    /** Run a list of commands in env. `quiet`: inside a step already begun (a command substitution, a loop pass). */
    function list(cmds, env, quiet) {
      cmds.forEach(function (c) { one(c, env, quiet); });
      return env.status;
    }

    function one(c, env, quiet) {
      if (c.t === 'sub') { subshell(c.body, env, 'paren', null, quiet, false, false); return; }
      if (c.t === 'group') { groupDepth++; list(c.body, env, quiet); groupDepth--; return; } // rule 5: the current environment, no copy
      if (c.t === 'pipe') { pipeline(c, env, quiet); return; }
      if (c.t === 'exit') {
        var n = c.n === undefined ? env.status : c.n;
        exitText[env.id] = c.text;
        if (!quiet) begin(env, c, { code: 'exit', status: n });
        env.status = n;
        throw new ExitSignal(env.id, n);
      }
      var ev = quiet ? null : begin(env, c, { code: 'cmd', t: c.t });
      var st = simple(c, env, quiet);
      if (ev) ev.status = st;
    }

    /**
     * End an environment: run its EXIT trap as a step of its own (rules 4, 7, 8), then mark it ended and hand its
     * status to the parent as $? (rule 2). The status is the one it exited with; the trap does not change it.
     */
    function finish(env, status, how, quiet) {
      var act = env.kept ? null : env.traps.EXIT;
      if (act) {
        if (how === 'exit') env.exiting = { status: status, how: how }; // shown in the exit step: the trap is pending
        if (!quiet) begin(env, { line: act.line, from: act.from, to: act.to }, { code: 'trap', status: status, how: how, exitCmd: how === 'exit' ? exitText[env.id] : null });
        if (!quiet) {
          // the action's span inside the quotes
          var cmds = trapCmds[act.line + ':' + act.from];
          s.pc = { line: act.line, from: cmds[0].from, to: cmds[cmds.length - 1].to };
        }
        env.status = status; // $? in the action is the value before it (POSIX trap, cited in UL ch17)
        var was = inTrap;
        inTrap = true;
        list(trapCmds[act.line + ':' + act.from], env, true);
        inTrap = was;
      }
      env.status = status;
      env.exiting = null;
      env.ended = { status: status, how: how };
      if (s.lastEvent.ended) s.lastEvent.ended.push(env.id);
      var parent = env.parent ? envOf(env.parent) : null;
      if (parent) parent.status = status;
    }

    /** ( … ) or $( … ): a copy runs the body; exit ends only the copy (rules 1–3, 6, 7). */
    function subshell(body, parent, via, member, quiet, keepTraps, capture) {
      if (!quiet) boundary();
      var env = copyOf(parent, via, member, keepTraps);
      var cap = capture ? [] : null;
      if (cap) capOf[env.id] = cap;
      var status, how;
      try { list(body, env, quiet); status = env.status; how = 'end'; } catch (e) {
        if (!(e instanceof ExitSignal) || e.env !== env.id) throw e;
        status = e.status; how = 'exit';
      }
      finish(env, status, how, quiet);
      // a command substitution's trailing newlines are removed; each emitted line is one element here
      return { status: status, out: cap || [] };
    }

    /**
     * printf 'a\nb\n' | while read x; do …; done: each member in its own copy (rule 6). Shown one after the other (the
     * first member writes and ends, then one step per pass), though real members run at the same time.
     */
    function pipeline(c, parent, quiet) {
      var v = c.loop.v;
      if (!quiet) begin(parent, c.left, { code: 'printf', count: c.left.lines.length });
      var left = copyOf(parent, 'pipe', 1, false);
      var right = copyOf(parent, 'pipe', 2, false);
      var lines = c.left.lines.slice(); // the pipe
      if (!quiet) s.pipe = { from: left.id, to: right.id, lines: lines, done: false };
      finish(left, 0, 'end', true);
      var k = 0;
      var status = 0; // a while loop that runs no pass returns 0; otherwise its last body command's status
      var how = 'end';
      try {
        while (lines.length) {
          k++;
          var pev = quiet ? null : begin(right, c.loop, { code: 'pass', k: k });
          var x = lines.shift(); // read takes one line from the pipe
          if (pev) { pev.value = x; pev.last = !lines.length; }
          right.vars[v] = x;
          status = list(c.loop.body, right, true);
        }
        // the next read finds no line: it empties the variable and fails, the loop ends and so does the member, in
        // the step of the last pass (SPEC.md, One step)
        right.vars[v] = '';
      } catch (e) {
        if (!(e instanceof ExitSignal) || e.env !== right.id) throw e;
        status = e.status; how = 'exit';
      }
      if (!quiet) s.pipe.done = true;
      right.status = status;
      finish(right, status, how, true);
      parent.status = status; // a pipeline's status is its last member's
    }

    var main = s.envs[0];
    var status, how;
    try { list(sc.lines.reduce(function (a, ln) { return a.concat(ln.cmds); }, []), main, false); status = main.status; how = 'end'; } catch (e) {
      if (!(e instanceof ExitSignal) || e.env !== 'main') throw e;
      status = e.status; how = 'exit';
    }
    finish(main, status, how, false);
    s.exitStatus = status;
    s.lastEvent.final = status;
    s.lastEvent.how = how;
    pending = true;
    boundary();
    return frames;
  }

  /**
   * What changed from prev to s, per environment id: { created, ended, cwd, vars: [names], trap, status }.
   * "Changed" on the page marks these (task: the values changed by this step and the box created or removed).
   */
  function changes(prev, s) {
    var out = {};
    var before = {};
    if (prev) prev.envs.forEach(function (e) { before[e.id] = e; });
    s.envs.forEach(function (e) {
      var p = before[e.id];
      var c = { created: !p, ended: !!e.ended && !(p && p.ended), cwd: false, vars: [], trap: false, status: false };
      if (p) {
        c.cwd = p.cwd !== e.cwd;
        Object.keys(e.vars).forEach(function (k) { if (p.vars[k] !== e.vars[k]) c.vars.push(k); });
        c.trap = JSON.stringify(p.traps.EXIT) !== JSON.stringify(e.traps.EXIT) || p.reset !== e.reset;
        c.status = p.status !== e.status;
      }
      out[e.id] = c;
    });
    return out;
  }

  var memo = {};
  function scriptOf(p) { return SCRIPTS[p.script] || SCRIPTS[SCRIPT_IDS[0]]; }
  function frames(p) {
    var id = SCRIPTS[p.script] ? p.script : SCRIPT_IDS[0];
    if (!memo[id]) memo[id] = framesOf(SCRIPTS[id]);
    return memo[id];
  }
  function stateAt(p, n) { var f = frames(p); return clone(f[Math.max(0, Math.min(n, f.length - 1))]); }

  var logic = {
    /** Parameter defaults: the first preset, nested boxes showing their copied values. */
    defaults: { script: 'book-ciscenje', showCopy: true },

    /** One per command run, plus one per trap action (SPEC.md, One step). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    HOME: HOME, TMPDIR: TMPDIR, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS,
    build: { B: B, line: line, script: script },
    framesOf: framesOf, frames: frames, changes: changes, expand: expand, scriptOf: scriptOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
