/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-shell-quoting: what the shell does to a line before the command sees it.
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   One step = one stage for the whole line, in the POSIX order (XCU §2.6): 0 the typed line; 1 words, quote spans
   marked; 2 tilde, parameter and command substitution; 3 field splitting; 4 pathname expansion; 5 quote removal,
   giving argv; 6 the command runs. Every character is tracked with where it came from, so a later stage knows
   whether it was quoted and whether it came from an expansion. */
(function (root) {
  'use strict';

  /** The variables of the demo machine (UL ch16 navodnici.sh, razmaci.sh, polja.sh; x from "rm $x"). */
  var VARS = { ime: 'Ana Marija', datoteka: 'moj izvjestaj.txt', niz: 'a b c', x: '*.txt' };
  /** The working directory and its files (razmaci.sh: touch "moj izvjestaj.txt" drugi.txt). */
  var CWD = '~/vjezba16/pokus';
  var FILES = ['moj izvjestaj.txt', 'drugi.txt'];
  var HOME = '/home/student';
  /** IFS choices: the default (POSIX §2.5.3), a colon, a newline only. */
  var IFS = { 'default': ' \t\n', colon: ':', newline: '\n' };
  var IFS_IDS = Object.keys(IFS);
  /** A long listing line as the book prints it (razmaci.sh output). Data, not language. */
  var LS_DATE = 'Sep  1 11:38';

  /** The preset lines; `quoted` wraps the line's expansion in double quotes (null: the line has none). */
  var LINES = {
    bez: { plain: 'echo bez navodnika: $ime', quoted: 'echo bez navodnika: "$ime"' },
    jednostruki: { plain: "echo jednostruki: '$ime'", quoted: null },
    razmaci: { plain: 'ls -l $datoteka', quoted: 'ls -l "$datoteka"' },
    polja: { plain: 'for x in $niz', quoted: 'for x in "$niz"' },
    uzorak: { plain: 'rm $x', quoted: 'rm "$x"' },
    zamjena: { plain: 'for f in $(ls)', quoted: 'for f in "$(ls)"' }
  };
  var LINE_IDS = Object.keys(LINES);
  var STAGES = 6;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function isName(c) { return /[A-Za-z0-9_]/.test(c); }
  function isIfsWhite(c) { return c === ' ' || c === '\t' || c === '\n'; }
  function sortNames(a) { return a.slice().sort(function (x, y) { return x < y ? -1 : x > y ? 1 : 0; }); }

  /**
   * Stage 1: cut the line into words at unquoted blanks (POSIX §2.3), marking quote spans.
   * A word is a list of items: a character { c, q, qc } (q = 'none' | 'single' | 'double', qc = it is a quote
   * character the shell will remove) or an expansion { exp: { kind, name | cmd, text, q } } still to be done.
   * `$name`, `${name}`, `$(cmd)` expand outside quotes and inside double quotes; never inside single ones (rule 2).
   * `~` at the start of an unquoted word is a tilde prefix. A backslash is not part of this language.
   */
  function tokenize(line) {
    var words = [];
    var cur = null;
    var q = 'none';
    var i = 0;
    function word() { if (!cur) { cur = []; words.push(cur); } return cur; }
    function ch(c, quote, qc) { word().push({ c: c, q: quote, qc: !!qc }); }
    while (i < line.length) {
      var c = line[i];
      if (q === 'single') {
        if (c === "'") { ch(c, 'single', true); q = 'none'; } else ch(c, 'single');
        i++;
        continue;
      }
      if (c === '\\') throw new Error('backslash is not part of this language');
      if (q === 'none' && (c === ' ' || c === '\t')) { cur = null; i++; continue; }
      if (q === 'none' && c === "'") { ch(c, 'single', true); q = 'single'; i++; continue; }
      if (c === '"') { ch(c, 'double', true); q = q === 'double' ? 'none' : 'double'; i++; continue; }
      if (c === '$') {
        var m;
        var rest = line.slice(i);
        if ((m = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}/.exec(rest)) || (m = /^\$([A-Za-z_][A-Za-z0-9_]*)/.exec(rest))) {
          word().push({ exp: { kind: 'param', name: m[1], text: m[0], q: q } });
          i += m[0].length;
          continue;
        }
        if (rest[1] === '(') {
          var close = rest.indexOf(')');
          if (close < 0) throw new Error('unclosed $(');
          word().push({ exp: { kind: 'cmd', cmd: rest.slice(2, close).trim(), text: rest.slice(0, close + 1), q: q } });
          i += close + 1;
          continue;
        }
      }
      if (c === '~' && q === 'none' && !cur && (i + 1 === line.length || line[i + 1] === '/' || line[i + 1] === ' ')) {
        word().push({ exp: { kind: 'tilde', text: '~', q: 'none' } });
        i++;
        continue;
      }
      ch(c, q);
      i++;
    }
    if (q !== 'none') throw new Error('unclosed ' + q + ' quote');
    return words;
  }

  /** Command substitution drops every trailing newline of the output, not just one (POSIX §2.6.3). */
  function dropTrailingNewlines(s) { return s.replace(/\n+$/, ''); }

  /** What a command substitution prints: only `ls` (one name per line, as when the output is not a terminal). */
  function substitute(cmd, files) {
    if (cmd === 'ls') return sortNames(files).map(function (f) { return f + '\n'; }).join('');
    throw new Error('command substitution knows only ls: ' + cmd);
  }

  /**
   * Stage 2: tilde, parameter and command substitution, left to right (rule 1). Each character of a result is tagged
   * x (came from an expansion, with its index e) and keeps the quote context of the expansion. Command substitution
   * drops its trailing newlines (rule 6). Returns { words, exps }.
   */
  function expand(words, env) {
    var exps = [];
    var out = words.map(function (w, wi) {
      var chars = [];
      w.forEach(function (it) {
        if (!it.exp) { chars.push({ c: it.c, q: it.q, qc: it.qc, x: false, e: null }); return; }
        var e = it.exp;
        var value;
        if (e.kind === 'param') value = Object.prototype.hasOwnProperty.call(env.vars, e.name) ? env.vars[e.name] : '';
        else if (e.kind === 'tilde') value = HOME;
        else {
          var printed = substitute(e.cmd, env.files);
          value = dropTrailingNewlines(printed);
          e.printed = printed;
        }
        var id = exps.length;
        exps.push({ id: id, word: wi, kind: e.kind, name: e.name || null, cmd: e.cmd || null, text: e.text, q: e.q, value: value, printed: e.printed || null });
        // a tilde result is treated as quoted: it is never split or used as a pattern (POSIX §2.6.1)
        value.split('').forEach(function (c) { chars.push({ c: c, q: e.q, qc: false, x: true, e: id, lit: e.kind === 'tilde' }); });
      });
      return chars;
    });
    return { words: out, exps: exps };
  }

  /**
   * Stage 3: field splitting (rules 3, 4, 8). Only characters that came from an expansion outside double quotes can
   * split, and only at IFS characters. IFS white space: leading and trailing dropped, a run is one separator. Any
   * other IFS character delimits a field together with the white space next to it, and two in a row make an empty
   * field. A word left with no character at all (an unquoted empty expansion) gives zero fields.
   */
  function splitWord(chars, ifs) {
    var fields = [];
    var cur = [];
    var started = false;
    var afterWhite = false;
    chars.forEach(function (ch) {
      var splits = ch.x && ch.q === 'none' && !ch.lit && ifs.indexOf(ch.c) >= 0;
      if (!splits) { cur.push(ch); started = true; afterWhite = false; return; }
      if (isIfsWhite(ch.c)) {
        if (started) { fields.push(cur); cur = []; started = false; afterWhite = true; }
        return;
      }
      if (started) { fields.push(cur); cur = []; started = false; } else if (!afterWhite) fields.push([]);
      afterWhite = false;
    });
    if (started) fields.push(cur);
    return fields;
  }

  /** A field is a pattern when an unquoted *, ? or a [ that opens a bracket expression is in it (rule 5). */
  function patternChars(chars) {
    var live = chars.filter(function (ch) { return !ch.qc; });
    var any = false;
    for (var i = 0; i < live.length; i++) {
      var ch = live[i];
      if (ch.q !== 'none' || ch.lit) continue;
      if (ch.c === '*' || ch.c === '?') any = true;
      if (ch.c === '[' && bracketEnd(live, i) > 0) any = true;
    }
    return any;
  }
  /** The index of the ] that closes the bracket expression at i, or -1. */
  function bracketEnd(live, i) {
    var j = i + 1;
    if (j < live.length && live[j].q === 'none' && (live[j].c === '!' || live[j].c === '^')) j++;
    if (j < live.length && live[j].c === ']') j++;
    for (; j < live.length; j++) if (live[j].c === ']' && live[j].q === 'none' && !live[j].lit) return j;
    return -1;
  }
  function hasGlobChar(chars) { return chars.some(function (ch) { return !ch.qc && (ch.c === '*' || ch.c === '?' || ch.c === '['); }); }

  /** Does a name match the pattern? Quoted characters match only themselves; a leading `.` must be matched literally. */
  function matches(chars, name) {
    var live = chars.filter(function (ch) { return !ch.qc; });
    function at(pi, ni) {
      if (pi === live.length) return ni === name.length;
      var ch = live[pi];
      var special = ch.q === 'none' && !ch.lit;
      var dotStart = ni === 0 && name[0] === '.';
      if (special && ch.c === '*') {
        if (dotStart) return false;
        for (var k = ni; k <= name.length; k++) if (at(pi + 1, k)) return true;
        return false;
      }
      if (ni === name.length) return false;
      if (special && ch.c === '?') return !dotStart && at(pi + 1, ni + 1);
      if (special && ch.c === '[') {
        var end = bracketEnd(live, pi);
        if (end > 0) {
          if (dotStart) return false;
          var body = live.slice(pi + 1, end).map(function (x) { return x.c; }).join('');
          var neg = live[pi + 1].q === 'none' && (body[0] === '!' || body[0] === '^');
          if (neg) body = body.slice(1);
          var hit = false;
          for (var b = 0; b < body.length; b++) {
            if (body[b + 1] === '-' && b + 2 < body.length) { if (name[ni] >= body[b] && name[ni] <= body[b + 2]) hit = true; b += 2; }
            else if (body[b] === name[ni]) hit = true;
          }
          return hit !== neg && at(end + 1, ni + 1);
        }
      }
      return ch.c === name[ni] && at(pi + 1, ni + 1);
    }
    return at(0, 0);
  }

  /** Text of a list of characters, and the same grouped into parts for drawing. */
  function textOf(chars) { return chars.map(function (ch) { return ch.c; }).join(''); }
  function partsOf(chars) {
    var parts = [];
    chars.forEach(function (ch) {
      var p = parts[parts.length - 1];
      var x = !!ch.x;
      var qc = !!ch.qc;
      if (p && p.quoted === ch.q && p.fromExpansion === x && p.quoteChar === qc) p.text += ch.c;
      else parts.push({ text: ch.c, quoted: ch.q, fromExpansion: x, quoteChar: qc });
    });
    return parts;
  }
  function itemOf(chars, src, extra) { return Object.assign({ src: src, parts: partsOf(chars), text: textOf(chars) }, extra || {}); }

  /** The listing line ls -l prints for one file (format of the book's razmaci.sh output). */
  function lsLong(name) { return '-rw-r--r--. 1 student student 0 ' + LS_DATE + ' ' + name; }

  /** Stage 6: run the command with its argv. Knows echo, ls [-l], rm, and `for name in …`; nothing else runs. */
  function run(argv, kind, files) {
    if (kind === 'for') return { kind: 'for', name: argv[1], items: argv.slice(3), out: [], status: 0, removed: [] };
    var cmd = argv[0];
    var args = argv.slice(1);
    if (cmd === 'echo') return { kind: 'cmd', out: [args.join(' ')], status: 0, removed: [] };
    if (cmd === 'ls') {
      var long = args.indexOf('-l') >= 0;
      var ops = args.filter(function (a) { return a[0] !== '-'; });
      if (!ops.length) return { kind: 'cmd', out: sortNames(files).map(function (f) { return long ? lsLong(f) : f; }), status: 0, removed: [] };
      var errs = [];
      var found = [];
      ops.forEach(function (o) {
        if (files.indexOf(o) >= 0) found.push(o);
        else errs.push("ls: cannot access '" + o + "': No such file or directory");
      });
      return { kind: 'cmd', out: errs.concat(sortNames(found).map(function (f) { return long ? lsLong(f) : f; })), status: errs.length ? 2 : 0, removed: [], missing: ops.length - found.length };
    }
    if (cmd === 'rm') {
      var out = [];
      var removed = [];
      args.forEach(function (o) {
        if (files.indexOf(o) >= 0 && removed.indexOf(o) < 0) removed.push(o);
        else out.push("rm: cannot remove '" + o + "': No such file or directory");
      });
      return { kind: 'cmd', out: out, status: out.length ? 1 : 0, removed: removed };
    }
    return { kind: 'unknown', out: [], status: null, removed: [] }; // not one of the four: the model does not run it
  }

  /**
   * Every stage of one line, computed once. `env` = { vars, ifs (the string), files, noglob }.
   * Returns the pieces the states reveal stage by stage.
   */
  function pipeline(line, env) {
    var words = tokenize(line);
    var kind = words.length >= 3 && textOf(words[0]) === 'for' && textOf(words[2]) === 'in' && words[0].every(function (it) { return !it.exp; }) ? 'for' : 'cmd';
    var syntaxCount = kind === 'for' ? 3 : 0;

    // stage 1: the words as typed, expansions still in them as text
    var words1 = words.map(function (w, wi) {
      var chars = [];
      w.forEach(function (it) {
        if (it.exp) it.exp.text.split('').forEach(function (c) { chars.push({ c: c, q: it.exp.q, qc: false, x: false }); });
        else chars.push(it);
      });
      return itemOf(chars, wi, { syntax: wi < syntaxCount });
    });

    // stage 2: expansions (the words of a for are syntax and are not expanded: there are no expansions in them)
    var ex = expand(words, env);
    var words2 = ex.words.map(function (chars, wi) {
      return itemOf(chars, wi, { syntax: wi < syntaxCount, changed: ex.exps.some(function (e) { return e.word === wi; }) });
    });

    // stage 3: field splitting
    var split = [];
    var fields = [];
    ex.words.forEach(function (chars, wi) {
      var fs = wi < syntaxCount ? [chars] : splitWord(chars, env.ifs);
      var changed = fs.length !== 1 || textOf(fs[0]) !== textOf(chars);
      if (!fs.length) split.push(itemOf([], wi, { vanished: true, changed: true }));
      fs.forEach(function (f) {
        split.push(itemOf(f, wi, { syntax: wi < syntaxCount, changed: changed }));
        fields.push({ src: wi, chars: f });
      });
    });
    var splitInfo = ex.exps.map(function (e) {
      if (e.q === 'double') return { exp: e.id, outcome: 'quoted', fields: [] };
      var mine = fields.filter(function (f) { return f.chars.some(function (ch) { return ch.e === e.id; }); });
      var hasIfs = e.value.split('').some(function (c) { return env.ifs.indexOf(c) >= 0; });
      var outcome;
      if (e.kind === 'tilde') outcome = 'whole';
      else if (!mine.length) outcome = fields.some(function (f) { return f.src === e.word; }) ? 'blank' : 'empty';
      else if (mine.length > 1) outcome = 'split';
      else outcome = hasIfs ? 'trim' : 'whole';
      return { exp: e.id, outcome: outcome, fields: mine.map(function (f) { return textOf(f.chars); }) };
    });

    // stage 4: pathname expansion (skipped under set -f)
    var globbed = [];
    var finals = [];
    var globInfo = [];
    fields.forEach(function (f) {
      var syntax = f.src < syntaxCount;
      if (syntax || !hasGlobChar(f.chars)) { globbed.push(itemOf(f.chars, f.src, { syntax: syntax })); finals.push(f); return; }
      var info = { field: textOf(f.chars.filter(function (ch) { return !ch.qc; })), outcome: null, matches: [] };
      globInfo.push(info);
      if (!patternChars(f.chars)) info.outcome = f.chars.some(function (ch) { return !ch.qc && ch.q === 'none' && !ch.lit && (ch.c === '*' || ch.c === '?' || ch.c === '['); }) ? 'notpattern' : 'quoted';
      else if (env.noglob) info.outcome = 'noglob';
      else {
        info.matches = sortNames(env.files.filter(function (name) { return matches(f.chars, name); }));
        info.outcome = info.matches.length ? 'matched' : 'nomatch';
      }
      if (info.outcome !== 'matched') { globbed.push(itemOf(f.chars, f.src)); finals.push(f); return; }
      info.matches.forEach(function (name) {
        var chars = name.split('').map(function (c) { return { c: c, q: 'none', qc: false, x: false }; });
        globbed.push(itemOf(chars, f.src, { changed: true, fromGlob: true }));
        finals.push({ src: f.src, chars: chars });
      });
    });

    // stage 5: quote removal gives argv
    var argvItems = finals.map(function (f, i) {
      var kept = f.chars.filter(function (ch) { return !ch.qc; });
      return itemOf(kept, f.src, { syntax: f.src < syntaxCount, changed: kept.length !== f.chars.length, index: i });
    });
    var argv = argvItems.map(function (it) { return it.text; });

    // stage 6: the command runs
    var result = run(argv, kind, env.files);
    var removedQuotes = argvItems.filter(function (it) { return it.changed; }).length;

    return {
      kind: kind, words: words1, expanded: words2, split: split, globbed: globbed, argv: argvItems, argvText: argv,
      exps: ex.exps, splitInfo: splitInfo, globInfo: globInfo, removedQuotes: removedQuotes, result: result
    };
  }

  function lineText(p) {
    var l = LINES[p.line] || LINES.bez;
    return p.quoted && l.quoted ? l.quoted : l.plain;
  }
  function envOf(p) {
    return { vars: clone(VARS), ifs: IFS[p.ifs] || IFS['default'], files: FILES.slice(), noglob: !!p.noglob };
  }

  /** The state at stage n: every strip up to n, the rest still null. */
  function stateOf(line, env, n) {
    var pl = pipeline(line, env);
    var s = {
      stage: n, line: line, kind: pl.kind,
      vars: env.vars, ifs: env.ifs, cwd: CWD, cwdFiles: sortNames(env.files), noglob: env.noglob,
      words: null, expanded: null, split: null, globbed: null, argv: null, result: null,
      exps: pl.exps, splitInfo: null, globInfo: null, removedQuotes: null
    };
    if (n >= 1) s.words = pl.words;
    if (n >= 2) s.expanded = pl.expanded;
    if (n >= 3) { s.split = pl.split; s.splitInfo = pl.splitInfo; }
    if (n >= 4) { s.globbed = pl.globbed; s.globInfo = pl.globInfo; }
    if (n >= 5) { s.argv = pl.argv; s.removedQuotes = pl.removedQuotes; }
    if (n >= 6) s.result = pl.result;
    return s;
  }

  var memo = {};
  function stateAt(p, n) {
    var line = lineText(p);
    var env = envOf(p);
    var k = Math.max(0, Math.min(n, STAGES));
    var key = line + '\u0000' + env.ifs + '\u0000' + (env.noglob ? 1 : 0) + '\u0000' + k;
    if (!memo[key]) memo[key] = stateOf(line, env, k);
    return clone(memo[key]);
  }

  var logic = {
    /** Parameter defaults (task: line bez, quoted off, IFS default, set -f off). */
    defaults: { line: 'bez', quoted: false, ifs: 'default', noglob: false },

    /** Six steps after the typed line, one per stage, for every line (stages with nothing to do still take one). */
    steps: STAGES,

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    LINES: LINES, LINE_IDS: LINE_IDS, VARS: VARS, FILES: FILES, CWD: CWD, HOME: HOME, IFS: IFS, IFS_IDS: IFS_IDS,
    tokenize: tokenize, expand: expand, dropTrailingNewlines: dropTrailingNewlines, splitWord: splitWord, matches: matches, pipeline: pipeline, stateOf: stateOf,
    lineText: lineText, envOf: envOf, lsLong: lsLong,
    /** Run one line through every stage with a custom environment (tests type their own lines). */
    analyse: function (line, over) {
      var env = Object.assign({ vars: clone(VARS), ifs: IFS['default'], files: FILES.slice(), noglob: false }, over || {});
      return pipeline(line, env);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
