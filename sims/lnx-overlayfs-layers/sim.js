/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-overlayfs-layers: read-only image layers, a writable upper layer per container, copy-up and
   whiteouts. One step is one command in one container: look the path up through the stack, apply copy-up, a whiteout
   or a plain write, recompute the merged view and the upper layer's size, mark what changed. Rules and numbers:
   SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var KB = 1024, MB = 1024 * 1024;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function f(size) { return { size: size, kind: 'file' }; }
  function d() { return { size: 0, kind: 'dir' }; }

  // ── paths ──

  function parts(p) { return p.split('/').filter(Boolean); }
  /** Rule 10: paths sorted component by component, so a directory comes right before its entries. */
  function comparePaths(a, b) {
    var x = parts(a), y = parts(b);
    for (var i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    }
    return x.length - y.length;
  }
  function sortPaths(list) { return list.slice().sort(comparePaths); }
  /** The proper ancestors of a path, nearest first: /a/b/c → /a/b, /a. */
  function ancestors(p) {
    var x = parts(p), out = [];
    for (var i = x.length - 1; i > 0; i--) out.push('/' + x.slice(0, i).join('/'));
    return out;
  }
  function under(p, dir) { return p.indexOf(dir + '/') === 0; }
  function baseName(p) { var x = parts(p); return x[x.length - 1]; }
  function dirName(p) { var x = parts(p); return '/' + x.slice(0, -1).join('/') + (x.length > 1 ? '/' : ''); }

  // ── the stack ──

  /** The stack a container reads, top-down (rule 1): its upper, then the image layers from the topmost to the base. */
  function stackOf(s, cid) {
    var out = [];
    var c = containerOf(s, cid);
    if (c) out.push({ id: 'upper:' + cid, files: c.upper, upper: true });
    for (var i = s.layers.length - 1; i >= 0; i--) out.push({ id: s.layers[i].id, files: s.layers[i].files, upper: false });
    return out;
  }
  function containerOf(s, cid) { return s.containers.filter(function (c) { return c.id === cid; })[0] || null; }

  /**
   * Look one path up through a stack (rules 1, 2, 5, 7). Each layer, top-down:
   *  - an ancestor of the path that is a whiteout or a non-directory hides the path here and below: not found;
   *  - the path itself: a whiteout ends the lookup (not found); a file wins; a directory wins too (its entries are
   *    looked up one by one, which merges them, rule 2);
   *  - otherwise, an opaque ancestor directory in this layer stops the lookup before the layers below it.
   * Returns { visited: [row ids], hit: row id | null, entry, stop: 'whiteout' | 'file' | 'opaque' | null, at: row id }.
   */
  function lookupIn(stack, path) {
    var visited = [];
    var anc = ancestors(path);
    for (var i = 0; i < stack.length; i++) {
      var L = stack[i];
      visited.push(L.id);
      for (var k = 0; k < anc.length; k++) {
        var a = L.files[anc[k]];
        if (a && (a.kind === 'whiteout' || a.kind === 'file')) return { visited: visited, hit: null, entry: null, stop: a.kind, at: L.id };
      }
      var e = L.files[path];
      if (e) {
        if (e.kind === 'whiteout') return { visited: visited, hit: null, entry: null, stop: 'whiteout', at: L.id };
        return { visited: visited, hit: L.id, entry: clone(e), stop: null, at: L.id };
      }
      for (var j = 0; j < anc.length; j++) {
        var o = L.files[anc[j]];
        if (o && o.kind === 'opaque') return { visited: visited, hit: null, entry: null, stop: 'opaque', at: L.id };
      }
    }
    return { visited: visited, hit: null, entry: null, stop: null, at: null };
  }
  function lookup(s, cid, path) { return lookupIn(stackOf(s, cid), path); }

  /** Every path in any layer of the stack. */
  function allPaths(stack) {
    var set = {};
    stack.forEach(function (L) { Object.keys(L.files).forEach(function (p) { set[p] = true; }); });
    return sortPaths(Object.keys(set));
  }

  /** The merged view (computed, never stored): { path: { from, size, kind } } for every path the lookup finds. */
  function mergedIn(stack) {
    var out = {};
    allPaths(stack).forEach(function (p) {
      var r = lookupIn(stack, p);
      if (r.hit) out[p] = { from: r.hit, size: r.entry.size, kind: r.entry.kind };
    });
    return out;
  }
  function merged(s, cid) { return mergedIn(stackOf(s, cid)); }
  /** The image as one read-only stack (what a new container would see before it writes anything). */
  function imageView(s) { return mergedIn(stackOf({ layers: s.layers, containers: [] }, null)); }

  /** The entries `ls dir` lists: the merged view's direct children of dir (rule 2: a union over the layers). */
  function list(s, cid, dir) {
    var m = merged(s, cid);
    return Object.keys(m).filter(function (p) { return under(p, dir) && parts(p).length === parts(dir).length + 1; })
      .sort(comparePaths).map(function (p) { return { path: p, from: m[p].from }; });
  }

  function sumFiles(files) {
    return Object.keys(files).reduce(function (n, p) { return n + (files[p].kind === 'file' ? files[p].size : 0); }, 0);
  }
  function upperBytes(s, cid) { var c = containerOf(s, cid); return c ? sumFiles(c.upper) : 0; }
  function imageBytes(s) { return s.layers.reduce(function (n, l) { return n + sumFiles(l.files); }, 0); }
  function seenBytes(s, cid) {
    var m = merged(s, cid);
    return Object.keys(m).reduce(function (n, p) { return n + (m[p].kind === 'file' ? m[p].size : 0); }, 0);
  }

  // ── one command ──

  /**
   * A lower name is visible below this upper layer (so deleting it needs a whiteout, rules 5–6): the image layers have
   * it, and no opaque directory above it in the upper layer already hides them (rule 7).
   */
  function inLower(s, path, up) {
    var opaque = ancestors(path).some(function (a) { return up && up[a] && up[a].kind === 'opaque'; });
    return !opaque && !!lookupIn(stackOf({ layers: s.layers, containers: [] }, null), path).hit;
  }

  /**
   * Apply one command to state s (mutates s; the caller clones). cmd: { c, op, path, bytes?, mode?, text? }.
   * op: 'read' | 'append' | 'create' | 'chmod' | 'rm' | 'rmrf' | 'mkdir' | 'ls'. Returns { lookup, result, changed }.
   * result.what: 'read' | 'copyup' | 'write' | 'new' | 'whiteout' | 'removed' | 'missing' | 'opaque' | 'mkdir' |
   * 'exists' | 'list'.
   * changed: the upper cells this command created, changed or replaced ([{ row, path }]).
   */
  function apply(s, cmd) {
    var c = containerOf(s, cmd.c);
    var up = c.upper;
    var lk = lookup(s, cmd.c, cmd.path);
    var row = 'upper:' + cmd.c;
    var result = { what: null };
    var changed = [];
    var mark = function () { changed.push({ row: row, path: cmd.path }); };
    var hitUpper = lk.hit === row;

    if (cmd.op === 'read') {
      result = lk.hit ? { what: 'read', from: lk.hit, size: lk.entry.size } : { what: 'missing', stop: lk.stop, at: lk.at };
    } else if (cmd.op === 'ls') {
      // a directory the lookup does not find (whited out, or never there) cannot be listed; parent directories the
      // scenes leave implicit (/usr/bin) count as there when something is visible under them
      var kids = list(s, cmd.c, cmd.path);
      result = lk.hit || (!lk.stop && kids.length) ? { what: 'list', entries: kids } : { what: 'missing', stop: lk.stop, at: lk.at };
    } else if (cmd.op === 'append' || cmd.op === 'chmod') {
      if (!lk.hit) {
        if (cmd.op === 'chmod') result = { what: 'missing', stop: lk.stop, at: lk.at };
        else { up[cmd.path] = f(cmd.bytes); result = { what: 'new', added: cmd.bytes }; mark(); }
      } else if (hitUpper) {
        if (cmd.op === 'append') up[cmd.path].size += cmd.bytes;
        else up[cmd.path].mode = cmd.mode;
        result = { what: 'write', added: cmd.op === 'append' ? cmd.bytes : 0 };
        mark();
      } else {
        // rule 4: the whole file is copied up, then changed in upper; the lower layer is not touched. A directory is
        // copied up as a directory (its metadata; its entries stay where they are)
        up[cmd.path] = { size: lk.entry.size, kind: lk.entry.kind === 'file' ? 'file' : 'dir', copied: true };
        if (cmd.op === 'append') up[cmd.path].size += cmd.bytes;
        else up[cmd.path].mode = cmd.mode;
        result = { what: 'copyup', from: lk.hit, copied: lk.entry.size, added: cmd.op === 'append' ? cmd.bytes : 0 };
        mark();
      }
    } else if (cmd.op === 'create') {
      // a new file where nothing is below (the presets never truncate a lower file)
      up[cmd.path] = f(cmd.bytes);
      result = { what: 'new', added: cmd.bytes };
      mark();
    } else if (cmd.op === 'rm' || cmd.op === 'rmrf') {
      if (!lk.hit) result = { what: 'missing', stop: lk.stop, at: lk.at };
      else {
        var dropped = 0;
        Object.keys(up).forEach(function (p) {
          if (p === cmd.path || (cmd.op === 'rmrf' && under(p, cmd.path))) { if (up[p].kind === 'file') dropped += up[p].size; delete up[p]; }
        });
        if (inLower(s, cmd.path, up)) { up[cmd.path] = { size: 0, kind: 'whiteout' }; result = { what: 'whiteout', dropped: dropped }; }
        else result = { what: 'removed', dropped: dropped };
        mark();
      }
    } else if (cmd.op === 'mkdir') {
      if (lk.hit) result = { what: 'exists', from: lk.hit };      // the name is there already: nothing changes
      else {
        if (up[cmd.path] && up[cmd.path].kind === 'whiteout') { up[cmd.path] = { size: 0, kind: 'opaque' }; result = { what: 'opaque' }; }
        else { up[cmd.path] = d(); result = { what: 'mkdir' }; }
        mark();
      }
    }
    return { lookup: lk, result: result, changed: changed };
  }

  /** Rule 10: several commands in one step apply in order; on the same path the later one wins. */
  function applyAll(s, cmds) {
    var out = null;
    cmds.forEach(function (cmd) { out = apply(s, cmd); });
    return out;
  }

  /** Save a container's upper as a new read-only image layer (rule 9) and remove the container. */
  function commit(s, cid, layerId) {
    var c = containerOf(s, cid);
    s.layers.push({ id: layerId, ro: true, files: clone(c.upper) });
    s.containers = s.containers.filter(function (x) { return x.id !== cid; });
  }

  // ── the scenes ──

  var WEB = [
    { id: 'L1', ro: true, files: { '/etc/os-release': f(KB), '/etc/web/server.conf': f(3 * KB) } },
    { id: 'L2', ro: true, files: { '/var/www/html/index.html': f(KB) } }
  ];
  var CONF = '/etc/web/server.conf', OSR = '/etc/os-release', INDEX = '/var/www/html/index.html';
  var LOG = '/var/log/app.log', VI = '/usr/bin/vi', NEW = '/tmp/new.txt', APP = '/app', CACHE = '/var/cache/dnf';

  /** An appended line's bytes: its characters plus the newline. */
  function line(text) { return text.length + 1; }

  var SCENES = {
    'edit-config': {
      layers: WEB, containers: ['A'],
      script: [
        { c: 'A', op: 'read', path: CONF, cmd: 'cat' },
        { c: 'A', op: 'append', path: CONF, text: 'workers 2', bytes: line('workers 2') },
        { c: 'A', op: 'read', path: CONF, cmd: 'cat' },
        { c: 'A', op: 'append', path: CONF, text: 'keepalive on', bytes: line('keepalive on') },
        { c: 'A', op: 'chmod', path: OSR, mode: '640' }
      ]
    },
    'big-file': {
      layers: [
        { id: 'L1', ro: true, files: { '/etc/os-release': f(KB), '/usr/bin/app': f(5 * MB) } },
        { id: 'L2', ro: true, files: { '/var/log/app.log': f(200 * MB) } }
      ],
      containers: ['A'],
      script: [
        { c: 'A', op: 'read', path: LOG, cmd: 'tail' },
        { c: 'A', op: 'append', path: LOG, text: 'job done', bytes: line('job done') },
        { c: 'A', op: 'append', path: LOG, text: 'job done', bytes: line('job done') },
        { c: 'A', op: 'rm', path: LOG }
      ]
    },
    'delete': {
      layers: [
        { id: 'L1', ro: true, files: { '/etc/os-release': f(KB), '/usr/bin/ls': f(140 * KB), '/usr/bin/vi': f(MB) } }
      ],
      containers: ['A'],
      script: [
        { c: 'A', op: 'create', path: NEW, text: 'hi', bytes: line('hi') },
        { c: 'A', op: 'rm', path: VI },
        { c: 'A', op: 'read', path: VI, cmd: 'cat' },
        { c: 'A', op: 'rm', path: NEW },
        { c: 'A', op: 'read', path: NEW, cmd: 'cat' },
        { c: 'A', op: 'ls', path: '/usr/bin' }
      ]
    },
    'two-containers': {
      layers: WEB, containers: ['A', 'B'],
      // E = the editor (param `container`), O = the other one
      script: [
        { c: 'E', op: 'read', path: INDEX, cmd: 'cat' },
        { c: 'O', op: 'read', path: INDEX, cmd: 'cat' },
        { c: 'E', op: 'append', path: INDEX, text: '<p>E</p>', bytes: line('<p>E</p>') },
        { c: 'E', op: 'read', path: INDEX, cmd: 'cat' },
        { c: 'O', op: 'read', path: INDEX, cmd: 'cat' },
        { c: 'O', op: 'append', path: INDEX, text: '<p>O</p>', bytes: line('<p>O</p>') }
      ]
    },
    'build-rm': {
      layers: [{ id: 'L1', ro: true, files: { '/etc/os-release': f(KB), '/usr/bin/sh': f(MB) } }],
      containers: [],
      script: [
        { build: 'run', layer: 'L2', run: 'install', writes: {
          '/usr/bin/gcc': f(MB), '/usr/libexec/gcc/cc1': f(99 * MB), '/var/cache/dnf': d(), '/var/cache/dnf/metadata': f(50 * MB) } },
        { build: 'commit', layer: 'L2' },
        { build: 'run', layer: 'L3', run: 'rmrf', cmd: { op: 'rmrf', path: CACHE } },
        { build: 'commit', layer: 'L3' },
        { build: 'container', c: 'A', cmd: { c: 'A', op: 'ls', path: CACHE } }
      ]
    },
    'opaque': {
      layers: [
        { id: 'L1', ro: true, files: { '/app': d(), '/app/main.py': f(4 * KB), '/app/util.py': f(2 * KB) } },
        { id: 'L2', ro: true, files: { '/app': d(), '/app/config.ini': f(KB) } }
      ],
      containers: ['A'],
      script: [
        { c: 'A', op: 'ls', path: APP },
        { c: 'A', op: 'rmrf', path: APP },
        { c: 'A', op: 'mkdir', path: APP },
        { c: 'A', op: 'ls', path: APP }
      ]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);
  var BUILD = 'build';

  /** The container ids a scene's command runs in: E and O follow the param in two-containers. */
  function who(c, p) {
    var e = p.container === 'B' ? 'B' : 'A';
    return c === 'E' ? e : c === 'O' ? (e === 'A' ? 'B' : 'A') : c;
  }
  /** The text a command appends, with E and O replaced by the container's id. */
  function textOf(text, p) { return text && text.replace(/<p>([EO])<\/p>/, function (m, x) { return '<p>' + who(x, p) + '</p>'; }); }

  function initialOf(p) {
    var sc = SCENES[p.scene] || SCENES['edit-config'];
    var s = {
      scene: SCENES[p.scene] ? p.scene : 'edit-config', phase: 'start',
      layers: clone(sc.layers),
      containers: sc.containers.map(function (id) { return { id: id, upper: {} }; }),
      cmd: null, result: null, lookup: null, changed: [], bytesUpper: {}, imageBytes: 0, gone: []
    };
    return finish(s, null);
  }

  /** Phases 3–4: sizes, and the merged rows whose view changed since prev (names that appeared or vanished). */
  function finish(s, prev) {
    s.bytesUpper = {};
    s.containers.forEach(function (c) { s.bytesUpper[c.id] = sumFiles(c.upper); });
    s.imageBytes = imageBytes(s);
    s.gone = [];
    if (prev) {
      s.containers.forEach(function (c) {
        // a container that was not there before saw, in effect, the image alone (an empty upper over prev's layers)
        var before = prev.containers.some(function (x) { return x.id === c.id; }) ? merged(prev, c.id) : imageView(prev);
        var now = merged(s, c.id);
        var row = 'merged:' + c.id;
        var paths = sortPaths(Object.keys(before).concat(Object.keys(now)).filter(function (p, i, a) { return a.indexOf(p) === i; }));
        paths.forEach(function (p) {
          var b = before[p], n = now[p];
          if (!b && n) s.changed.push({ row: row, path: p });
          else if (b && !n) { s.changed.push({ row: row, path: p }); s.gone.push({ row: row, path: p, kind: b.kind }); }
          else if (b && n && (b.from !== n.from || b.size !== n.size)) s.changed.push({ row: row, path: p });
        });
      });
    }
    return s;
  }

  /** Every state from step 0 to the end, for the params. */
  function framesOf(p) {
    var s = initialOf(p);
    var sc = SCENES[s.scene];
    var frames = [clone(s)];
    sc.script.forEach(function (st) {
      var prev = clone(s);
      s.changed = []; s.lookup = null; s.result = null;
      if (st.build) {
        s.phase = 'build-' + st.build;
        if (st.build === 'run') {
          s.containers = [{ id: BUILD, upper: {} }];
          s.cmd = { c: BUILD, op: 'run', run: st.run, layer: st.layer, path: st.cmd ? st.cmd.path : null };
          if (st.writes) {
            Object.keys(st.writes).forEach(function (q) { s.containers[0].upper[q] = clone(st.writes[q]); });
            s.result = { what: 'written', bytes: sumFiles(s.containers[0].upper) };
            s.changed = sortPaths(Object.keys(st.writes)).map(function (q) { return { row: 'upper:' + BUILD, path: q }; });
          } else {
            var out = apply(s, Object.assign({ c: BUILD }, st.cmd));
            s.lookup = out.lookup; s.result = out.result;
            s.changed = out.changed;
          }
        } else if (st.build === 'commit') {
          var bytes = upperBytes(s, BUILD);
          var paths = sortPaths(Object.keys(containerOf(s, BUILD).upper));
          commit(s, BUILD, st.layer);
          s.cmd = { c: BUILD, op: 'commit', layer: st.layer };
          s.result = { what: 'commit', layer: st.layer, bytes: bytes };
          s.changed = paths.map(function (q) { return { row: st.layer, path: q }; });
        } else {
          s.containers = [{ id: st.c, upper: {} }];
          var o = apply(s, st.cmd);
          s.cmd = clone(st.cmd);
          s.lookup = o.lookup; s.result = o.result;
        }
        s = finish(s, prev);
      } else {
        var cmd = Object.assign({}, st, { c: who(st.c, p), text: textOf(st.text, p) });
        var r = apply(s, cmd);
        s.phase = 'cmd';
        s.cmd = cmd;
        s.lookup = r.lookup; s.result = r.result;
        s.changed = r.changed;
        s = finish(s, prev);
      }
      frames.push(clone(s));
    });
    return frames;
  }

  /** Frames for the page's params (memoised on the params that shape them). */
  var memo = {};
  function frames(p) {
    var key = [p.scene, p.container].join('|');
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  /** Every path that appears in any frame of the scene: the grid's columns, fixed for the whole run (rule 10 order). */
  function columns(p) {
    var set = {};
    frames(p).forEach(function (s) {
      s.layers.forEach(function (l) { Object.keys(l.files).forEach(function (q) { set[q] = true; }); });
      s.containers.forEach(function (c) { Object.keys(c.upper).forEach(function (q) { set[q] = true; }); });
    });
    return sortPaths(Object.keys(set));
  }

  var logic = {
    /** Parameter defaults (task: preset edit-config, container A, sizes on). */
    defaults: { scene: 'edit-config', container: 'A', showSizes: true },

    /** One step per scripted command (SPEC.md: 5, 4, 6, 6, 5, 4). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    KB: KB, MB: MB, SCENES: SCENES, SCENE_IDS: SCENE_IDS, BUILD: BUILD,
    comparePaths: comparePaths, sortPaths: sortPaths, ancestors: ancestors, baseName: baseName, dirName: dirName,
    stackOf: stackOf, lookup: lookup, lookupIn: lookupIn, merged: merged, imageView: imageView, list: list,
    apply: apply, applyAll: applyAll, commit: commit, inLower: inLower,
    sumFiles: sumFiles, upperBytes: upperBytes, imageBytes: imageBytes, seenBytes: seenBytes,
    framesOf: framesOf, frames: frames, columns: columns, who: who
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
