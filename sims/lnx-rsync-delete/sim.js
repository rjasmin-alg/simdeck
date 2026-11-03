/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-rsync-delete: a source tree on the client (~/vjezba/) and the server's home directory. Each step is one
   action of a scenario: a run of `rsync -av [--delete] [-n] ~/vjezba[/] …:<dest>`, or an event at the source (a file
   deleted, a file encrypted under a new name, time passing). A run builds the file list (the trailing slash decides the
   level, rule 1), deletes what the source lacks inside the synchronised directories (--delete, rules 3 and 6), sends
   what differs (quick check, rule 2), changes nothing on a dry run (rule 4) and prints the list in rsync's order
   (rule 7). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var HOME = '/home/student';
  var SRC = 'vjezba';
  /** Destination roots, relative to the server home ('' = the home itself). */
  var DESTS = { rsync: 'vjezba-rsync', rsync2: 'vjezba-rsync2', home: '' };
  var DEST_KEYS = ['rsync', 'rsync2', 'home'];
  var RPM = 'tmux-3.3a-13.20250207gitb202a2f.el10.x86_64.rpm';

  /** The scenarios. A run's `fix` names the flags it sets itself; `flip` turns the slash round and takes the other
      directory (book-slash's second command). `at` is a wall-clock label for the page. */
  var SCRIPTS = {
    'book-slash': { start: 'fresh', acts: [{ run: {} }, { run: { flip: true } }] },
    'delete-propagates': { start: 'fresh', acts: [{ run: {} }, { rm: 'vjezba/a.txt' }, { run: { delete: false } }, { run: { delete: true } }] },
    'dry-run-first': { start: 'synced', acts: [{ rm: 'vjezba/a.txt' }, { run: { delete: true, dryRun: true } }, { run: { delete: true, dryRun: false } }] },
    'wrong-destination': { start: 'synced', acts: [{ run: { dest: 'home', delete: true, dryRun: true } }] },
    'nightly-mirror': { start: 'synced', acts: [{ encrypt: 'vjezba/a.txt', at: '21:00' }, { run: { delete: true }, at: '22:00' }, { wait: true, at: '07:50' }] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);
  var FLAGS = ['slash', 'delete', 'dryRun', 'dest'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── paths ──

  function parent(p) { var i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); }
  function base(p) { var i = p.lastIndexOf('/'); return i < 0 ? p : p.slice(i + 1); }
  function join(a, b) { return !a ? b : !b ? a : a + '/' + b; }
  /** Direct children of dir in a tree. */
  function children(tree, dir) {
    return Object.keys(tree).filter(function (p) { return p !== dir && p !== '' && parent(p) === dir; });
  }
  /** rsync's name order inside one directory: files before directories, then by code point. */
  function order(tree) {
    return function (a, b) {
      var da = tree[a].kind === 'd' ? 1 : 0, db = tree[b].kind === 'd' ? 1 : 0;
      if (da !== db) return da - db;
      return a < b ? -1 : a > b ? 1 : 0;
    };
  }
  function sorted(tree, dir) { return children(tree, dir).sort(order(tree)); }
  /** The path and everything below it. */
  function subtree(tree, p) {
    return Object.keys(tree).filter(function (q) { return q === p || q.indexOf(p + '/') === 0; });
  }

  // ── start trees (SPEC.md "Start trees"); mtimes are clock ticks ──

  function file(size, mtime, data) { return { kind: 'f', size: size, mtime: mtime, data: data }; }
  function dir(mtime) { return { kind: 'd', size: null, mtime: mtime, data: null }; }

  function srcStart() {
    return {
      vjezba: dir(10), 'vjezba/a.txt': file(11, 10, 'a'), 'vjezba/pod': dir(10), 'vjezba/pod/b.txt': file(6, 10, 'b')
    };
  }
  /** The server home before the book's rsync runs; scp copies carry the time of the copy (20), not the source's. */
  function dstFresh() {
    var t = {
      '': dir(20), 'a.txt': file(11, 20, 'a'), 'nohup.out': file(null, 5, 'n'), paketi: dir(4),
      'pokvaren.rpm': file(400000, 4, 'p'), proba: dir(3), tajna: file(0, 3, ''),
      'vjezba-scp': dir(20), 'vjezba-scp/a.txt': file(11, 20, 'a'), 'vjezba-scp/pod': dir(20), 'vjezba-scp/pod/b.txt': file(6, 20, 'b')
    };
    t['paketi/' + RPM] = file(null, 4, 'r');
    return t;
  }
  /** The home of the book's sftp listing: fresh after `rsync -av ~/vjezba/ …:~/vjezba-rsync/` and
      `rsync -av ~/vjezba …:~/vjezba-rsync2/`. */
  function dstSynced() {
    var src = srcStart(), d = dstFresh();
    d = run(src, d, { slash: true, delete: false, dryRun: false, dest: 'rsync' }, 21).dst;
    d = run(src, d, { slash: false, delete: false, dryRun: false, dest: 'rsync2' }, 22).dst;
    return d;
  }

  // ── one run ──

  /** Rule 2: differ by size or mtime (quick check), or by content with checksum. */
  function differs(a, b, checksum) {
    if (!b || a.kind !== b.kind) return true;
    if (a.kind === 'd') return a.mtime !== b.mtime;
    if (checksum) return a.size !== b.size || a.data !== b.data;
    return a.size !== b.size || a.mtime !== b.mtime;
  }

  /** The command's effective flags and paths. */
  function plan(cmd) {
    var root0 = DESTS[cmd.dest];
    var name = function (p) {                                    // rule 1
      if (!cmd.slash) return p;
      return p === SRC ? '.' : p.slice(SRC.length + 1);
    };
    var target = function (nm) { return nm === '.' ? root0 : join(root0, nm); };
    return { root: root0, name: name, target: target };
  }

  /**
   * Run rsync on (src, dst) with cmd { slash, delete, dryRun, dest, checksum? } at clock `now`.
   * Returns { dst, list, created, sent, del, made, totalSize } (dst unchanged on a dry run).
   */
  function run(src, dst0, cmd, now) {
    var P = plan(cmd), dst = clone(dst0);
    var srcDirs = [], list = [], del = [], sent = [], made = [];
    var created = P.root !== '' && !dst[P.root];

    // the file list in rsync's order: depth first, files before subdirectories
    var flist = [];
    (function walk(p) {
      flist.push(p);
      sorted(src, p).forEach(function (q) { if (src[q].kind === 'f') flist.push(q); });
      sorted(src, p).forEach(function (q) { if (src[q].kind === 'd') walk(q); });
    })(SRC);
    flist.forEach(function (p) { if (src[p].kind === 'd') srcDirs.push(p); });

    // rule 3, 6: deletions, only inside the directories of the file list
    var delLines = {};                                            // per synchronised source directory
    if (cmd.delete) {
      srcDirs.forEach(function (sd) {
        delLines[sd] = [];
        var td = P.target(P.name(sd));
        if (!dst[td] || dst[td].kind !== 'd') return;
        var want = {};
        children(src, sd).forEach(function (q) { want[base(q)] = true; });
        var extra = children(dst, td).filter(function (q) { return !want[base(q)]; });
        // reverse order; a directory's contents before the directory itself
        (function rm(paths) {
          paths.sort(order(dst)).reverse().forEach(function (q) {
            if (dst[q].kind === 'd') rm(children(dst, q));
            var nm = P.name(sd) === '.' ? relTo(q, td) : join(P.name(sd), relTo(q, td));
            delLines[sd].push('deleting ' + nm + (dst[q].kind === 'd' ? '/' : ''));
            del.push(q);
          });
        })(extra);
      });
    }

    // rule 2: what is sent
    // rule 7: a directory's deletions just before its own line, in the walk's order
    var body = [];
    flist.forEach(function (p) {
      var nm = P.name(p), tp = P.target(nm), s = src[p], d = dst[tp];
      if (delLines[p]) body = body.concat(delLines[p]);
      if (!differs(s, d, cmd.checksum)) return;
      if (s.kind === 'd') {
        body.push(nm === '.' ? './' : nm + '/');
        if (!d) made.push(tp);
      } else {
        body.push(nm);
        sent.push(tp);
      }
    });

    var totalSize = flist.reduce(function (n, p) { return n + (src[p].kind === 'f' ? src[p].size : 0); }, 0);
    list.push('sending incremental file list');
    if (created) list.push('created directory ' + HOME + '/' + P.root);
    list = list.concat(body, ['', 'total size is ' + totalSize + (cmd.dryRun ? ' (DRY RUN)' : '')]);

    if (!cmd.dryRun) {                                            // rule 4: a dry run changes nothing
      var touch = {};
      if (created) { dst[P.root] = dir(now); touch[parent(P.root)] = true; }
      del.forEach(function (q) { if (dst[q]) subtree(dst, q).forEach(function (r) { delete dst[r]; }); touch[parent(q)] = true; });
      flist.forEach(function (p) {
        var tp = P.target(P.name(p)), s = src[p];
        if (src[p].kind === 'd') {
          if (!dst[tp]) { dst[tp] = dir(s.mtime); touch[parent(tp)] = true; }
        } else if (differs(s, dst[tp], cmd.checksum)) {
          if (!dst[tp]) touch[parent(tp)] = true;
          dst[tp] = file(s.size, s.mtime, s.data);
        }
      });
      // -a keeps times: every synchronised directory takes the source's mtime; others the clock's when touched
      var synced = {};
      srcDirs.forEach(function (sd) { var td = P.target(P.name(sd)); synced[td] = true; dst[td].mtime = src[sd].mtime; });
      Object.keys(touch).forEach(function (q) { if (!synced[q] && dst[q]) dst[q].mtime = now; });
    }
    return { dst: dst, list: list, created: created ? P.root : null, sent: sent, del: del, made: made, totalSize: totalSize };
  }
  function relTo(q, dirPath) { return dirPath ? q.slice(dirPath.length + 1) : q; }

  // ── the stepper ──

  function norm(p) {
    p = p || {};
    return {
      script: SCRIPTS[p.script] ? p.script : 'delete-propagates',
      slash: p.slash === undefined ? true : !!p.slash && p.slash !== 'false',
      delete: !!p.delete && p.delete !== 'false',
      dryRun: !!p.dryRun && p.dryRun !== 'false',
      dest: DESTS.hasOwnProperty(p.dest) ? p.dest : 'rsync'
    };
  }

  /** The command of a run action under params o (fixed flags win, rule "Further tie-breaks"). */
  function cmdFor(act, o) {
    var c = { slash: o.slash, delete: o.delete, dryRun: o.dryRun, dest: o.dest };
    var r = act.run;
    if (r.flip) { c.slash = !o.slash; c.dest = o.dest === 'rsync' ? 'rsync2' : 'rsync'; }
    FLAGS.forEach(function (k) { if (r[k] !== undefined) c[k] = r[k]; });
    return c;
  }

  /** Flags the scenario sets in every one of its runs (the page disables those params). */
  function fixedFlags(script) {
    var runs = SCRIPTS[script].acts.filter(function (a) { return a.run; });
    return FLAGS.filter(function (k) {
      return runs.every(function (a) { return a.run[k] !== undefined || (a.run.flip && (k === 'slash' || k === 'dest')); });
    });
  }

  function blankStep(s) {
    s.cmd = null; s.list = []; s.changed = []; s.deleted = []; s.gone = {};
    s.would = { del: [], made: [], sent: [], created: null };
    s.srcChanged = []; s.srcGone = {}; s.lastRunDry = false; s.created = null;
  }

  function initial(p) {
    var o = norm(p);
    var s = { script: o.script, src: srcStart(), dst: SCRIPTS[o.script].start === 'synced' ? dstSynced() : dstFresh(), clock: 30, i: 0, ev: null };
    blankStep(s);
    return s;
  }

  function act(s0, a, o) {
    var s = clone(s0);
    blankStep(s);
    s.clock += 1;
    if (a.rm || a.encrypt) {
      var p = a.rm || a.encrypt;
      s.srcGone[p] = s.src[p];
      delete s.src[p];
      if (a.encrypt) {
        var np = p + '.locked';
        s.src[np] = file(s0.src[p].size, s.clock, 'enc:' + s0.src[p].data);
        s.srcChanged.push(np);
      }
      s.src[parent(p)].mtime = s.clock;
      s.srcChanged.push(parent(p));
      s.ev = { kind: a.rm ? 'rm' : 'encrypt', path: p, to: a.encrypt ? p + '.locked' : null, at: a.at || null };
      return s;
    }
    if (a.wait) { s.ev = { kind: 'wait', at: a.at || null }; return s; }
    var cmd = cmdFor(a, o);
    var r = run(s.src, s.dst, cmd, s.clock);
    s.cmd = cmd;
    s.list = r.list;
    s.lastRunDry = cmd.dryRun;
    s.created = r.created;
    if (cmd.dryRun) {
      s.would = { del: r.del, made: r.made, sent: r.sent, created: r.created };
    } else {
      r.del.forEach(function (q) { subtree(s.dst, q).forEach(function (x) { s.gone[x] = s.dst[x]; }); });
      s.deleted = Object.keys(s.gone).sort();
      s.changed = r.made.concat(r.sent, s.deleted);
      s.dst = r.dst;
    }
    s.ev = { kind: 'run', dry: cmd.dryRun, at: a.at || null, sent: r.sent.length, del: r.del.length, made: r.made.length,
      totalSize: r.totalSize, flip: !!a.run.flip };
    return s;
  }

  var logic = {
    HOME: HOME, SRC: SRC, DESTS: DESTS, DEST_KEYS: DEST_KEYS, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS, RPM: RPM,

    /** Parameter defaults (SPEC.md "Params"): the delete-propagates scenario. */
    defaults: { script: 'delete-propagates', slash: true, delete: false, dryRun: false, dest: 'rsync' },

    steps: function (p) { return SCRIPTS[norm(p).script].acts.length; },

    initial: initial,

    step: function (s, n, p) {
      var o = norm(p), a = SCRIPTS[o.script].acts[n - 1];
      var r = a ? act(s, a, o) : clone(s);
      r.i = n;
      return r;
    },

    norm: norm,
    run: run,
    differs: differs,
    cmdFor: cmdFor,
    fixedFlags: fixedFlags,
    srcStart: srcStart,
    dstFresh: dstFresh,
    dstSynced: dstSynced,
    children: children,
    sorted: sorted,
    parent: parent,
    base: base,
    join: join
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
