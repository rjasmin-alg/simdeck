/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-container-volumes: where a container's data lives, and what each lifecycle command keeps or deletes.
   A container sees its image under its writable layer (the overlay stack of lnx-overlayfs-layers), with mounts laid
   over it: a named or anonymous volume in the engine's storage area, or a host directory (bind mount). One step is one
   command (run, a write inside, a write on the host, stop, start, rm, rm -v, the exit of a run --rm container, volume ls,
   volume prune, ls, cat): resolve which store a path belongs to, apply the command, recompute what the container sees,
   mark what was created or lost. Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is
   plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function f(text) { return { kind: 'file', text: text }; }

  // ── paths and the overlay stack ──
  // from sims/lnx-overlayfs-layers/sim.js @ 1c1fd95: parts, comparePaths, sortPaths, ancestors, under, baseName,
  // dirName, lookupIn, mergedIn (the layer stack and its merged view, unchanged)

  function parts(p) { return p.split('/').filter(Boolean); }
  /** Paths sorted component by component, so a directory comes right before its entries. */
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

  /**
   * Look one path up through a stack of layers, top-down: an ancestor that is a whiteout or a file hides the path; the
   * path itself, a whiteout ends the lookup, anything else wins; an opaque ancestor stops before the layers below.
   * Returns { visited, hit, entry, stop, at }.
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
  function allPaths(stack) {
    var set = {};
    stack.forEach(function (L) { Object.keys(L.files).forEach(function (p) { set[p] = true; }); });
    return sortPaths(Object.keys(set));
  }
  /** The merged view of a stack: { path: { from, entry } } for every path the lookup finds. */
  function mergedIn(stack) {
    var out = {};
    allPaths(stack).forEach(function (p) {
      var r = lookupIn(stack, p);
      if (r.hit) out[p] = { from: r.hit, entry: r.entry };
    });
    return out;
  }

  // ── stores ──
  // Row ids: 'layer:<container id>' (the writable layer), 'vol:<name>', 'bind:<host dir>', 'image'.

  function containerOf(s, name) {
    return s.containers.filter(function (c) { return c.alive && c.name === name; })[0] || null;
  }
  function volumeOf(s, name) { return s.volumes.filter(function (v) { return v.name === name; })[0] || null; }
  function storeId(m) { return m.kind === 'bind' ? 'bind:' + m.source : 'vol:' + m.source; }
  /** The files of a mount's source, keyed by the path relative to the mount target ('/rows.db'). */
  function sourceFiles(s, m) {
    if (m.kind === 'bind') return s.hostDirs[m.source] || {};
    var v = volumeOf(s, m.source);
    return v ? v.files : {};
  }

  /**
   * Rule 1: the store a path inside a container belongs to. The mount with the longest target that is the path or one
   * of its ancestors wins; with no such mount, the container's writable layer.
   * Returns { store: row id, mount, rel } (rel: the path inside the mount's source, or the path itself in the layer).
   */
  function resolve(c, path) {
    var best = null;
    c.mounts.forEach(function (m) {
      if ((path === m.target || under(path, m.target)) && (!best || m.target.length > best.target.length)) best = m;
    });
    if (best) return { store: storeId(best), mount: best, rel: path.slice(best.target.length) || '/' };
    return { store: 'layer:' + c.id, mount: null, rel: path };
  }

  /**
   * What a container sees (computed, never stored): the overlay stack (its writable layer over the image), then each
   * mount's source over its target, the deepest target last so it wins (rules 1 and 7: a mount hides what was there).
   * Returns { path: { from: row id, text } }.
   */
  function merged(s, c) {
    var base = mergedIn([{ id: 'layer:' + c.id, files: c.upper }, { id: 'image', files: s.image.files }]);
    var out = {};
    Object.keys(base).forEach(function (p) {
      if (resolve(c, p).mount) return;                         // under a mount target: hidden by the mount
      out[p] = { from: base[p].from, text: base[p].entry.text };
    });
    c.mounts.forEach(function (m) {
      var files = sourceFiles(s, m);
      Object.keys(files).forEach(function (rel) {
        var p = m.target + rel;
        if (resolve(c, p).mount === m) out[p] = { from: storeId(m), text: files[rel].text };
      });
    });
    return out;
  }
  /** The entries `ls dir` lists in a container: the merged view's direct children of dir. */
  function list(s, c, dir) {
    var m = merged(s, c);
    return sortPaths(Object.keys(m).filter(function (p) { return under(p, dir) && parts(p).length === parts(dir).length + 1; }));
  }

  /** Rule 9 helper: the alive containers (running or stopped) whose mounts use a volume. */
  function usersOf(s, name) {
    return s.containers.filter(function (c) {
      return c.alive && c.mounts.some(function (m) { return m.kind !== 'bind' && m.source === name; });
    }).map(function (c) { return c.id; });
  }

  // ── one command ──

  var IDS = ['3f2a', '9c41', '5e07', 'b2d8'];
  var HASHES = ['a91c3e', '7d20b5', 'e4f19a', '2c6d07'];

  /** A -v spec: { target, source? , nocopy? }. No source: anonymous; a source that starts with / is a host directory. */
  function kindOf(spec) { return !spec.source ? 'anon' : spec.source.charAt(0) === '/' ? 'bind' : 'volume'; }

  /**
   * Apply one command to state s (mutates s; the caller clones). Returns { result, changed, lost }:
   * changed [{ row, path }] is what this command created or changed in a store (path: the container path of the cell),
   * lost [{ row, path, text }] what it deleted from one.
   */
  function apply(s, cmd) {
    var changed = [], lost = [];
    var mark = function (row, path) { changed.push({ row: row, path: path }); };
    var c = cmd.c ? containerOf(s, cmd.c) : null;
    var result;

    if (cmd.op === 'run') {
      var specs = cmd.volumes || [];
      // rule 10: two mounts on one target are refused before anything is made
      var dup = specs.map(function (v) { return v.target; }).filter(function (t, i, a) { return a.indexOf(t) !== i; })[0];
      if (dup) return { result: { what: 'refused', why: 'duplicate', target: dup }, changed: changed, lost: lost };
      if (containerOf(s, cmd.name)) return { result: { what: 'refused', why: 'name', name: cmd.name }, changed: changed, lost: lost };
      // rule 6: every VOLUME path of the image that no -v names gets a new anonymous volume
      specs = specs.concat(s.image.declaredVolumes.filter(function (p) {
        return !specs.some(function (v) { return v.target === p; });
      }).map(function (p) { return { target: p, fromImage: true }; }));
      var id = IDS[s.seq.c++ % IDS.length];
      var mounts = [], made = [], populated = [];
      specs.forEach(function (v) {
        var kind = kindOf(v);
        var m = { target: v.target, kind: kind, source: v.source, fromImage: !!v.fromImage };
        if (kind === 'anon') m.source = HASHES[s.seq.v++ % HASHES.length];
        if (kind === 'bind') { if (!s.hostDirs[m.source]) s.hostDirs[m.source] = {}; }
        else if (!volumeOf(s, m.source)) {
          s.volumes.push({ name: m.source, anon: kind === 'anon', files: {}, at: v.target, usedBy: [] });
          made.push(m.source);
        }
        // rule 7: an empty volume is first filled with the image's files at the target (not with nocopy); a host
        // directory never is
        if (kind !== 'bind' && !v.nocopy) {
          var vol = volumeOf(s, m.source);
          if (!Object.keys(vol.files).length) {
            sortPaths(Object.keys(s.image.files)).filter(function (p) { return under(p, v.target); }).forEach(function (p) {
              vol.files[p.slice(v.target.length)] = clone(s.image.files[p]);
              mark(storeId(m), p);
              populated.push(p);
            });
          }
        }
        mounts.push(m);
      });
      s.containers.push({ id: id, name: cmd.name, image: s.image.name, alive: true, running: true, autoRm: !!cmd.rm, upper: {}, mounts: mounts });
      result = { what: 'created', id: id, made: made, populated: populated };
    } else if (cmd.op === 'write') {
      if (!c || !c.running) return { result: { what: 'refused', why: 'not-running' }, changed: changed, lost: lost };
      var r = resolve(c, cmd.path);
      var files = r.mount ? sourceFiles(s, r.mount) : c.upper;
      var had = files[r.rel];
      files[r.rel] = f(cmd.append && had ? had.text + '\n' + cmd.text : cmd.text);
      mark(r.store, cmd.path);
      result = { what: 'written', store: r.store, rel: r.rel, isNew: !had };
    } else if (cmd.op === 'host-write') {
      // rule 8: the host writes into its own directory; a container that bind-mounts it sees the same file
      var dir = Object.keys(s.hostDirs).filter(function (d) { return under(cmd.path, d); })[0];
      var rel = cmd.path.slice(dir.length);
      var old = s.hostDirs[dir][rel];
      s.hostDirs[dir][rel] = f(cmd.append && old ? old.text + '\n' + cmd.text : cmd.text);
      s.containers.filter(function (x) { return x.alive; }).forEach(function (x) {
        x.mounts.forEach(function (m) { if (m.kind === 'bind' && m.source === dir) mark('bind:' + dir, m.target + rel); });
      });
      result = { what: 'written', store: 'bind:' + dir, rel: rel, isNew: !old };
    } else if (cmd.op === 'stop') {
      c.running = false;                                       // rule 2: the container and its layer stay
      result = { what: 'stopped' };
    } else if (cmd.op === 'start') {
      c.running = true;
      result = { what: 'started' };
    } else if (cmd.op === 'rm' || cmd.op === 'exit') {
      if (cmd.op === 'rm' && c.running && !cmd.force) return { result: { what: 'refused', why: 'running' }, changed: changed, lost: lost };
      if (cmd.op === 'exit') { c.running = false; if (!c.autoRm) return { result: { what: 'exited' }, changed: changed, lost: lost }; }
      // rule 3: the container and its writable layer go; rules 4–5: rm -v and run --rm also take its anonymous volumes
      var withAnon = cmd.op === 'exit' || !!cmd.v;
      sortPaths(Object.keys(c.upper)).forEach(function (p) { lost.push({ row: 'layer:' + c.id, path: p, text: c.upper[p].text }); });
      c.alive = false;
      c.running = false;
      c.upper = {};
      var gone = [], kept = [];
      c.mounts.forEach(function (m) {
        if (m.kind === 'bind') return;
        var v = volumeOf(s, m.source);
        if (withAnon && v.anon && !usersOf(s, v.name).length) { dropVolume(s, v, lost); gone.push(v.name); } else kept.push(v.name);
      });
      result = { what: 'removed', id: c.id, gone: gone, kept: kept, auto: cmd.op === 'exit' };
    } else if (cmd.op === 'volume-ls') {
      result = { what: 'volumes', list: s.volumes.map(function (v) { return { name: v.name, anon: v.anon, users: usersOf(s, v.name) }; }) };
    } else if (cmd.op === 'prune') {
      // rule 9: every volume no container uses, running or stopped
      var pruned = [];
      s.volumes.slice().forEach(function (v) { if (!usersOf(s, v.name).length) { dropVolume(s, v, lost); pruned.push(v.name); } });
      result = { what: 'pruned', gone: pruned };
    } else if (cmd.op === 'ls') {
      result = { what: 'list', entries: list(s, c, cmd.path) };
    } else if (cmd.op === 'cat') {
      var e = merged(s, c)[cmd.path];
      result = e ? { what: 'read', from: e.from, text: e.text } : { what: 'missing' };
    }
    return { result: result, changed: changed, lost: lost };
  }

  function dropVolume(s, v, lost) {
    sortPaths(Object.keys(v.files)).forEach(function (rel) { lost.push({ row: 'vol:' + v.name, path: v.at + rel, text: v.files[rel].text }); });
    s.volumes = s.volumes.filter(function (x) { return x !== v; });
  }

  // ── the scenes ──

  var DB = { name: 'db', files: { '/etc/db.conf': f('port 5432'), '/data/schema.sql': f('CREATE TABLE rows') }, declaredVolumes: [] };
  var DB_VOL = { name: 'db', files: DB.files, declaredVolumes: ['/data'] };
  var WEB = { name: 'web', files: { '/etc/web.conf': f('listen 80'), '/var/www/html/index.html': f('<h1>It works</h1>') }, declaredVolumes: [] };
  var ROWS = { op: 'write', c: 'db', path: '/data/rows.db', text: 'row 1' };

  /** Where /data lives in layer-lost (param `kind`): the -v it runs with, and the host directory a bind needs. */
  var KIND = {
    layer: { volumes: [] },
    named: { volumes: [{ source: 'dbdata', target: '/data' }] },
    anon: { volumes: [{ target: '/data' }] },
    bind: { volumes: [{ source: '/srv/db', target: '/data' }], hostDirs: { '/srv/db': {} } }
  };

  /** A scene: the image, the host directories, setup commands already run at step 0, and the script. */
  function sceneOf(p) {
    var rmV = !!p.rmV;
    var rm = { op: 'rm', c: 'db', v: rmV };
    switch (p.scene) {
      case 'named-survives': {
        var run = { op: 'run', name: 'db', image: 'db', volumes: KIND.named.volumes };
        return { image: DB, script: [run, ROWS, { op: 'stop', c: 'db' }, rm, run, { op: 'volume-ls' }] };
      }
      case 'anon-orphan': {
        var runA = { op: 'run', name: 'db', image: 'db' };
        return { image: DB_VOL, script: [runA, ROWS, { op: 'stop', c: 'db' }, rm, runA, { op: 'ls', c: 'db', path: '/data' },
          { op: 'volume-ls' }, { op: 'prune' }] };
      }
      case 'bind-hides':
        return {
          image: WEB, hostDirs: { '/srv/site': {} },
          script: [
            { op: 'run', name: 'web', image: 'web', volumes: [{ source: '/srv/site', target: '/var/www/html' }] },
            { op: 'ls', c: 'web', path: '/var/www/html' },
            { op: 'host-write', path: '/srv/site/index.html', text: 'hi' },
            { op: 'write', c: 'web', path: '/var/www/html/index.html', text: 'bye', append: true },
            { op: 'stop', c: 'web' },
            { op: 'rm', c: 'web', v: rmV }
          ]
        };
      case 'rm-flags':
        return {
          image: DB_VOL,
          setup: [{ op: 'run', name: 'db', image: 'db', volumes: [{ source: 'dblogs', target: '/var/log/db' }] }],
          script: [ROWS, { op: 'write', c: 'db', path: '/var/log/db/db.log', text: 'started' }, { op: 'stop', c: 'db' }, rm]
        };
      default: {
        var k = KIND[p.kind] || KIND.layer;
        var runL = { op: 'run', name: 'db', image: 'db', volumes: k.volumes };
        return {
          image: DB, hostDirs: k.hostDirs,
          // after start the container runs again, and rm refuses a running container: -f stops it first
          script: [runL, ROWS, { op: 'stop', c: 'db' }, { op: 'start', c: 'db' }, { op: 'rm', c: 'db', v: rmV, force: true }, runL,
            { op: 'cat', c: 'db', path: '/data/rows.db' }]
        };
      }
    }
  }
  var SCENE_IDS = ['layer-lost', 'named-survives', 'anon-orphan', 'bind-hides', 'rm-flags'];

  function fresh(p) {
    var sc = sceneOf(p);
    return {
      scene: SCENE_IDS.indexOf(p.scene) >= 0 ? p.scene : 'layer-lost',
      image: clone(sc.image), hostDirs: clone(sc.hostDirs || {}), containers: [], volumes: [],
      seq: { c: 0, v: 0 }, cmd: null, result: null, changed: [], lost: [], gone: [], seen: null
    };
  }

  /** Phases 3–4: who uses each volume, what the current container sees, and the names that appeared or vanished there. */
  function finish(s, prev) {
    s.volumes.forEach(function (v) { v.usedBy = usersOf(s, v.name); });
    var c = current(s);
    s.seen = c ? c.id : null;
    s.gone = [];
    if (prev && c) {
      // a container that was not there before saw, in effect, the image alone
      var pc = prev.containers.filter(function (x) { return x.id === c.id && x.alive; })[0];
      var before = pc ? merged(prev, pc) : mergedIn([{ id: 'image', files: prev.image.files }]);
      var now = merged(s, c);
      var keys = sortPaths(Object.keys(before).concat(Object.keys(now)).filter(function (p, i, a) { return a.indexOf(p) === i; }));
      keys.forEach(function (p) {
        var b = before[p], n = now[p];
        var bText = b && (b.text !== undefined ? b.text : b.entry.text);
        if (!b && n) s.changed.push({ row: 'sees', path: p });
        else if (b && !n) { s.changed.push({ row: 'sees', path: p }); s.gone.push(p); }
        else if (b && n && (b.from !== n.from || bText !== n.text)) s.changed.push({ row: 'sees', path: p });
      });
    }
    return s;
  }
  /** The container the stage shows: the last alive one. */
  function current(s) {
    var alive = s.containers.filter(function (c) { return c.alive; });
    return alive.length ? alive[alive.length - 1] : null;
  }

  function step1(s, cmd) {
    var prev = clone(s);
    s.changed = []; s.lost = [];
    var out = apply(s, cmd);
    s.cmd = clone(cmd);
    s.result = out.result;
    s.changed = out.changed;
    s.lost = out.lost;
    return finish(s, prev);
  }

  /** Every state from step 0 to the end, for the params. */
  function framesOf(p) {
    var sc = sceneOf(p);
    var s = fresh(p);
    (sc.setup || []).forEach(function (cmd) { apply(s, cmd); });
    s = finish(s, null);
    s.setup = (sc.setup || []).map(clone);
    var frames = [clone(s)];
    sc.script.forEach(function (cmd) { s = step1(s, cmd); frames.push(clone(s)); });
    return frames;
  }

  var memo = {};
  function frames(p) {
    var key = [p.scene, p.kind, !!p.rmV].join('|');
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }
  function script(p) { return sceneOf(p).script.map(clone); }

  /** Every container path that appears in any frame: the grid's columns, fixed for the whole run. */
  function columns(p) {
    var set = {};
    frames(p).forEach(function (s) {
      Object.keys(s.image.files).forEach(function (q) { set[q] = true; });
      s.containers.forEach(function (c) {
        Object.keys(c.upper).forEach(function (q) { set[q] = true; });
        if (c.alive) Object.keys(merged(s, c)).forEach(function (q) { set[q] = true; });
      });
      s.volumes.forEach(function (v) { Object.keys(v.files).forEach(function (rel) { set[v.at + rel] = true; }); });
      s.lost.forEach(function (x) { set[x.path] = true; });
    });
    return sortPaths(Object.keys(set));
  }

  var logic = {
    /** Parameter defaults (task: preset layer-lost, kind layer, rm without -v). */
    defaults: { scene: 'layer-lost', kind: 'layer', rmV: false },

    /** One step per command (SPEC.md: 7, 6, 8, 6, 4). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    SCENE_IDS: SCENE_IDS, KIND: KIND, IDS: IDS, HASHES: HASHES,
    comparePaths: comparePaths, sortPaths: sortPaths, ancestors: ancestors, under: under, baseName: baseName, dirName: dirName,
    lookupIn: lookupIn, mergedIn: mergedIn,
    resolve: resolve, merged: merged, list: list, usersOf: usersOf, containerOf: containerOf, volumeOf: volumeOf,
    current: current, apply: apply, fresh: fresh, finish: finish, step1: step1, sceneOf: sceneOf, script: script,
    framesOf: framesOf, frames: frames, columns: columns
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
