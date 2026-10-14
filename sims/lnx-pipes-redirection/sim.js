/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-pipes-redirection: where the three streams of each command go, as the shell applies a command line.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   The shell applies one thing per step, in a fixed order: the starting fd table of every process; every pipe, left
   to right; each command's redirections, left to right; then one output line per step, written wherever the fd
   points at that moment (per process left to right, stdout lines before stderr lines); then a final step. */
(function (root) {
  'use strict';

  /** The preset command lines (UL ch06 "Tokovi, preusmjeravanje i cjevovodi" and derived ones, SPEC.md). */
  var LINES = {
    samo1: 'cat /nema-me > ~/samo1.txt',
    greska: 'cat /nema-me 2> ~/greska.txt',
    sve: 'cat /nema-me > ~/sve.txt 2>&1',
    obrnuto: 'cat /nema-me 2>&1 > ~/sve.txt',
    cijev: 'cat /etc/hostname /nema-me | wc -l',
    'cijev-2': 'cat /etc/hostname /nema-me 2>&1 | wc -l'
  };
  var LINE_IDS = Object.keys(LINES);

  /** The machine's files before the line runs. /nema-me exists only when the `missing` param is off. */
  var HOSTNAME = 'demosrv1';
  var NEMA_ME_LINE = 'demo';
  function filesystem(missing) {
    var fs = { '/etc/hostname': [HOSTNAME] };
    if (!missing) fs['/nema-me'] = [NEMA_ME_LINE];
    return fs;
  }

  var REDIR = /^(\d*)(>>|>&|>|<)(.*)$/;
  /** Default fd of each operator (POSIX XCU §2.7: output 1, input 0, duplication of output 1). */
  var DEFAULT_FD = { '>': 1, '>>': 1, '>&': 1, '<': 0 };

  /**
   * Parse a command line of the small language the presets use: words, `|`, `|&`, and redirections
   * `[n]> f`, `[n]>> f`, `[n]< f`, `[n]>&m` (the target may follow as the next word).
   * Returns { cmds: [{ words, redirs: [{ fd, op, file | to, text, token }], pipe: null | '|' | '|&' }], tokens }.
   */
  function parse(text) {
    var words = text.trim().split(/\s+/);
    var cmds = [];
    var tokens = [];
    var cur = null;
    function open() {
      if (!cur) {
        cur = { words: [], redirs: [], pipe: null };
        cmds.push(cur);
      }
      return cur;
    }
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var c;
      if (w === '|' || w === '|&') {
        c = open();
        c.pipe = w;
        tokens.push({ id: 'p' + (cmds.length - 1), kind: 'pipe', text: w, proc: cmds.length - 1 });
        cur = null;
        continue;
      }
      var m = REDIR.exec(w);
      if (m) {
        c = open();
        var op = m[2];
        var arg = m[3];
        var tx = w;
        if (arg === '') { arg = words[++i]; tx = w + ' ' + arg; }
        if (arg === undefined || arg === '|' || arg === '|&') throw new Error('redirection without a target: ' + w);
        if (op === '>&' && !/^\d+$/.test(arg)) throw new Error('not a descriptor number: ' + tx);
        var r = { fd: m[1] === '' ? DEFAULT_FD[op] : Number(m[1]), op: op, text: tx };
        if (op === '>&') r.to = Number(arg);
        else r.file = arg;
        var pi = cmds.length - 1;
        r.token = 'r' + pi + '-' + c.redirs.length;
        c.redirs.push(r);
        tokens.push({ id: r.token, kind: 'redir', text: tx, proc: pi });
        continue;
      }
      c = open();
      var prevTok = tokens[tokens.length - 1];
      // the words of a command form one token; a word after a redirection starts a new one (same command)
      if (prevTok && prevTok.kind === 'cmd' && prevTok.proc === cmds.length - 1) prevTok.text += ' ' + w;
      else tokens.push({ id: 'c' + (cmds.length - 1) + (c.words.length ? '-' + c.words.length : ''), kind: 'cmd', text: w, proc: cmds.length - 1 });
      c.words.push(w);
    }
    return { cmds: cmds, tokens: tokens };
  }

  function lineText(p) { return p.text || LINES[p.line] || LINES.samo1; }

  /** Every file a line names in a redirection, in order of first mention. */
  function namedFiles(line) {
    var out = [];
    line.cmds.forEach(function (c) {
      c.redirs.forEach(function (r) { if (r.file && r.op !== '<' && out.indexOf(r.file) < 0) out.push(r.file); });
    });
    return out;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** The lines a process reads from fd 0, and what reading does to the source (a pipe is drained). */
  function readInput(s, proc, fsys) {
    var t = proc.fds['0'];
    if (!t) return [];
    var m = /^pipe:(\d+):r$/.exec(t);
    if (m) {
      var pipe = s.pipes[Number(m[1])];
      var got = pipe.buffer.slice();
      pipe.buffer = [];
      pipe.read += got.length;
      return got.map(function (l) { return l.text; });
    }
    if (t.indexOf('file:') === 0) {
      var name = t.slice(5);
      if (s.files[name]) return s.files[name].lines.map(function (l) { return l.text; });
      return (fsys[name] || []).slice();
    }
    return []; // the terminal: nothing is typed in this demo (SPEC.md, simplifications)
  }

  /**
   * What one program writes, as [{ fd, text }], stdout lines first, then stderr lines (SPEC.md step order).
   * Input lines are read from fd 0 at the moment the program writes its first line, which is after every
   * process to its left has written everything (one process at a time, left to right).
   */
  function outputsOf(words, input, fsys) {
    var prog = words[0];
    var args = words.slice(1);
    var out = [];
    if (prog === 'cat') {
      if (!args.length) input().forEach(function (l) { out.push({ fd: 1, text: l }); });
      args.forEach(function (f) {
        if (fsys[f]) fsys[f].forEach(function (l) { out.push({ fd: 1, text: l }); });
        else out.push({ fd: 2, text: 'cat: ' + f + ': No such file or directory' });
      });
    } else if (prog === 'wc' && args[0] === '-l') {
      out.push({ fd: 1, text: String(input().length) });
    } else if (prog === 'echo') {
      out.push({ fd: 1, text: args.join(' ') });
    }
    return out.filter(function (o) { return o.fd === 1; }).concat(out.filter(function (o) { return o.fd === 2; }));
  }

  /** Write one line through fd `fd` of process `proc`: wherever that fd points now. */
  function write(s, proc, fd, text) {
    var t = proc.fds[String(fd)];
    var line = { text: text, fd: fd, proc: proc.id };
    var m;
    if (t === 'tty') s.terminal.push(line);
    else if (t && t.indexOf('file:') === 0) s.files[t.slice(5)].lines.push(line);
    else if (t && (m = /^pipe:(\d+):w$/.exec(t))) s.pipes[Number(m[1])].buffer.push(line);
    else return { target: t || null, lost: true }; // not open for writing: the line is lost (no preset does this)
    return { target: t, lost: false };
  }

  /** Every state of a line, step 0 to the end. `line` is a parsed line, `missing` the param. */
  function framesOf(line, missing, pre) {
    var fsys = filesystem(missing);
    var files = {};
    Object.keys(pre || {}).forEach(function (f) {
      files[f] = { lines: pre[f].map(function (t) { return { text: t, fd: 0, proc: -1 }; }), created: true };
    });
    namedFiles(line).forEach(function (f) {
      if (!files[f]) files[f] = fsys[f] ? { lines: fsys[f].map(function (t) { return { text: t, fd: 0, proc: -1 }; }), created: true } : { lines: [], created: false };
    });

    var s = {
      phase: 'typed', cursor: null, changed: [], opened: null, wrote: null, error: null,
      procs: line.cmds.map(function (c, i) {
        return { id: i, cmd: c.words.join(' '), fds: { '0': null, '1': null, '2': null }, ran: false, failed: false, read: null };
      }),
      pipes: [], files: files, terminal: []
    };
    var frames = [clone(s)];
    /** One step: the persistent state as it is now, plus what this step did. An error stays once it happened. */
    function push(ch) {
      if (ch.error) s.error = ch.error;
      var f = clone(s);
      f.phase = ch.phase;
      f.cursor = ch.cursor || null;
      f.changed = ch.changed || [];
      f.opened = ch.opened || null;
      f.wrote = ch.wrote || null;
      frames.push(f);
    }

    // (1) every process starts with 0, 1 and 2 open, inherited from the shell: all on the terminal (rule 1).
    s.procs.forEach(function (p) { p.fds = { '0': 'tty', '1': 'tty', '2': 'tty' }; });
    push({ phase: 'start', cursor: null, changed: allFds(s) });

    // (2) every pipe, left to right, before any redirection (rules 2, 3).
    line.cmds.forEach(function (c, i) {
      if (!c.pipe || i === line.cmds.length - 1) return;
      var id = s.pipes.length;
      s.pipes.push({ id: id, from: i, to: i + 1, buffer: [], read: 0 });
      s.procs[i].fds['1'] = 'pipe:' + id + ':w';
      s.procs[i + 1].fds['0'] = 'pipe:' + id + ':r';
      push({ phase: 'pipe', cursor: 'p' + i, changed: [i + ':1', (i + 1) + ':0'] });
    });

    // (3) each command's redirections, left to right, one per step (rules 4–7); `|&` adds 2>&1 after them (rule 3).
    line.cmds.forEach(function (c, i) {
      var proc = s.procs[i];
      var redirs = c.redirs.slice();
      if (c.pipe === '|&' && i < line.cmds.length - 1) redirs.push({ fd: 2, op: '>&', to: 1, text: '2>&1', token: 'p' + i, implicit: true });
      for (var k = 0; k < redirs.length; k++) {
        var r = redirs[k];
        var key = String(r.fd);
        if (r.op === '>&') {
          var src = proc.fds[String(r.to)];
          if (!src) { // not an open descriptor: a redirection error, the command does not run (rule 5)
            proc.failed = true;
            push({ phase: 'redir', cursor: r.token, changed: [], error: { code: 'bad-fd', proc: i, fd: r.to } });
            return;
          }
          proc.fds[key] = src; // a copy of fd m as it is now (rule 5)
          push({ phase: 'redir', cursor: r.token, changed: [i + ':' + key] });
        } else if (r.op === '<') {
          if (!fsys[r.file] && !(s.files[r.file] && s.files[r.file].created)) {
            proc.failed = true;
            push({ phase: 'redir', cursor: r.token, changed: [], error: { code: 'no-file', proc: i, file: r.file } });
            return;
          }
          proc.fds[key] = 'file:' + r.file;
          if (!s.files[r.file]) s.files[r.file] = { lines: (fsys[r.file] || []).map(function (t) { return { text: t, fd: 0, proc: -1 }; }), created: true, input: true };
          push({ phase: 'redir', cursor: r.token, changed: [i + ':' + key], opened: r.file });
        } else {
          var f = s.files[r.file];
          if (r.op === '>') f.lines = []; // created if missing, emptied at open, before the command runs (rule 4)
          f.created = true;
          proc.fds[key] = 'file:' + r.file;
          push({ phase: 'redir', cursor: r.token, changed: [i + ':' + key], opened: r.file });
        }
      }
    });

    // (4) running: one output line per step, per process left to right.
    s.procs.forEach(function (proc, i) {
      if (proc.failed) return;
      var input = function () { var l = readInput(s, proc, fsys); proc.read = l.length; return l; };
      var outs = outputsOf(line.cmds[i].words, input, fsys);
      proc.ran = true;
      outs.forEach(function (o) {
        var w = write(s, proc, o.fd, o.text);
        push({ phase: 'run', cursor: 'c' + i, changed: [], wrote: { proc: i, fd: o.fd, text: o.text, target: w.target, lost: w.lost } });
      });
    });

    // (5) the final picture.
    push({ phase: 'done', cursor: null, changed: [] });
    return frames;
  }

  function allFds(s) {
    var out = [];
    s.procs.forEach(function (p) { ['0', '1', '2'].forEach(function (fd) { out.push(p.id + ':' + fd); }); });
    return out;
  }

  /** Frames for the page's params (memoised on the two params that shape them). */
  var memo = {};
  function frames(p) {
    var text = lineText(p);
    var key = text + '\u0000' + (p.missing ? 1 : 0);
    if (!memo[key]) memo[key] = framesOf(parse(text), !!p.missing);
    return memo[key];
  }

  function stateAt(p, n) { return clone(frames(p)[Math.max(0, Math.min(n, frames(p).length - 1))]); }

  var logic = {
    /** Parameter defaults (task: line samo1, missing on, labels on). */
    defaults: { line: 'samo1', missing: true, labels: true },

    /** 1 (start) + one per pipe + one per redirection + one per output line + 1 (final). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    LINES: LINES, LINE_IDS: LINE_IDS, HOSTNAME: HOSTNAME, NEMA_ME_LINE: NEMA_ME_LINE,
    parse: parse, framesOf: framesOf, frames: frames, lineText: lineText, namedFiles: namedFiles,
    tokensOf: function (p) { return parse(lineText(p)).tokens; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
