/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for nas-vs-san: file-level vs block-level storage, who owns the filesystem (SPEC.md).
   Two panels run the same operations: NAS (the server's filesystem, clients send file requests) and SAN (a target
   with a LUN of numbered blocks, each client runs its own filesystem from its own cache).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var BLOCKS = 16;
  var META = [0, 1, 2];                 // superblock, bitmap, directory
  var DATA_FIRST = 10;                  // 3–9 reserved for metadata, 10–15 data (SPEC.md "Scene")
  var MAX_ACTIONS = 20;                 // COMMON.md §3: a stepper has at most 20 steps
  var CLIENTS = ['A', 'B'];
  var FILE = { A: 'a.txt', B: 'b.txt' };
  var VERBS = 'fmwlru';                 // format, mount, write, list, read, remount
  var TWO = 'fA.mA.mB.wA.wB.rA.uA';

  // ── the run (`ops`) ──

  /** The operations of the run, cleaned: [{ verb, who }], at most MAX_ACTIONS. */
  function actionsOf(p) {
    var out = [];
    String(p && p.ops != null ? p.ops : '').split('.').forEach(function (tok) {
      if (tok.length === 2 && VERBS.indexOf(tok[0]) >= 0 && CLIENTS.indexOf(tok[1]) >= 0 && out.length < MAX_ACTIONS) {
        out.push({ verb: tok[0], who: tok[1] });
      }
    });
    return out;
  }

  /** The run back as the `ops` text (the page's buttons rewrite it). */
  function encode(actions) {
    return actions.map(function (a) { return a.verb + a.who; }).join('.');
  }

  // ── on-disk encoding of the toy filesystem (LBA 0 superblock, 1 bitmap, 2 directory) ──

  function bitmapText(bm) { return bm.join(','); }
  function dirText(dir) { return dir.map(function (e) { return e[0] + '=' + e[1]; }).join(';'); }
  function parseBitmap(s) { return s ? s.split(',').map(Number) : []; }
  function parseDir(s) {
    return s ? s.split(';').map(function (e) { var kv = e.split('='); return [kv[0], Number(kv[1])]; }) : [];
  }

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function byName(a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; }
  function lookup(dir, name) {
    for (var i = 0; i < dir.length; i++) if (dir[i][0] === name) return dir[i][1];
    return null;
  }
  function addEntry(dir, name, lba) { var d = dir.concat([[name, lba]]); d.sort(byName); return d; }
  /** Lowest data block not in the bitmap, or null when the data area is full (tie-break: lowest LBA). */
  function firstFree(bm) {
    for (var b = DATA_FIRST; b < BLOCKS; b++) if (bm.indexOf(b) < 0) return b;
    return null;
  }
  function blank() { var d = []; for (var i = 0; i < BLOCKS; i++) d.push(''); return d; }
  function names(dir) { return dir.map(function (e) { return e[0]; }); }

  function emptyClients() {
    return { A: { mounted: false, dir: null, bitmap: null }, B: { mounted: false, dir: null, bitmap: null } };
  }

  function nasInitial() {
    var disk = blank(), by = blank();
    disk[0] = 'fs'; disk[1] = ''; disk[2] = '';           // the server's own filesystem, made before the demo
    by[0] = by[1] = by[2] = 'S';
    return {
      disk: disk, by: by,
      server: { dir: [], bitmap: [], locks: [] },
      clients: emptyClients(), reservation: null,
      wire: [], changed: [], res: { code: 'start' }, conflicts: [], lost: []
    };
  }

  function sanInitial(p) {
    return {
      disk: blank(), by: blank(), server: null,
      clients: emptyClients(), reservation: p.reservation ? 'A' : null,
      wire: [], changed: [], res: { code: 'start' }, conflicts: [], lost: []
    };
  }

  // ── NAS: the server owns the filesystem (rules 1, 2) ──

  function nasMsg(who, op, arg, reply) { return { from: who, to: 'S', kind: 'file', op: op, arg: arg, reply: reply, ok: true }; }

  function nasStep(prev, a) {
    var s = copy(prev);
    s.wire = []; s.changed = []; s.lost = [];
    var c = s.clients[a.who], srv = s.server, f = FILE[a.who];
    switch (a.verb) {
      case 'f':
        s.res = { code: 'noDevice' };
        break;
      case 'm':
      case 'u':
        if (a.verb === 'm' && c.mounted) { s.res = { code: 'already' }; break; }   // mount twice: refused, nothing sent
        var again = c.mounted;                                                    // remount before any mount = mount
        s.wire.push(nasMsg(a.who, 'mount', '/share', 'OK'));
        if (again) srv.locks = srv.locks.filter(function (l) { return l[1] !== a.who; });
        c.mounted = true; c.dir = copy(srv.dir);
        s.res = { code: again ? 'remounted' : 'mounted', files: names(c.dir) };
        break;
      default:
        if (!c.mounted) { s.res = { code: 'notMounted' }; break; }
        if (a.verb === 'l') {
          s.wire.push(nasMsg(a.who, 'list', '/share', names(srv.dir).join(' ') || '—'));
          c.dir = copy(srv.dir);
          s.res = { code: 'listed', files: names(c.dir), cached: false };
        } else if (a.verb === 'r') {
          var at = lookup(srv.dir, f);
          if (at === null) { s.wire.push(nasMsg(a.who, 'read', f, 'NOENT')); s.wire[0].ok = false; s.res = { code: 'notFound', file: f }; break; }
          s.wire.push(nasMsg(a.who, 'read', f, 'data:' + s.disk[at]));
          s.res = { code: 'read', file: f, lba: at, data: s.disk[at], wrong: s.disk[at] !== a.who };
        } else { // write
          var lba = lookup(srv.dir, f), fresh = lba === null;
          if (fresh) lba = firstFree(srv.bitmap);
          if (lba === null) { s.wire.push(nasMsg(a.who, 'write', f, 'NOSPC')); s.wire[0].ok = false; s.res = { code: 'full' }; break; }
          s.wire.push(nasMsg(a.who, 'write', f, 'OK'));
          s.disk[lba] = a.who; s.by[lba] = 'S'; s.changed.push(lba);
          if (fresh) {
            srv.bitmap = srv.bitmap.concat([lba]).sort(function (x, y) { return x - y; });
            srv.dir = addEntry(srv.dir, f, lba);
            s.disk[1] = bitmapText(srv.bitmap); s.disk[2] = dirText(srv.dir);
            s.by[1] = s.by[2] = 'S'; s.changed.push(1, 2);
          }
          srv.locks = srv.locks.filter(function (l) { return l[0] !== f; }).concat([[f, a.who]]).sort(byName);
          if (lookup(c.dir, f) === null) c.dir = addEntry(c.dir, f, lba);
          s.res = { code: 'wrote', file: f, lba: lba, fresh: fresh };
        }
    }
    s.conflicts = [];
    return s;
  }

  // ── SAN: the target sees only LBAs; each client runs its own filesystem (rules 3–6) ──

  function blockMsg(who, op, lba, reply, ok) {
    return { from: who, to: 'T', kind: 'block', op: op, arg: lba, reply: reply, ok: ok };
  }

  /** The target's answer to a WRITE: rejected when another initiator holds the reservation (rule 5). */
  function writable(s, who) { return !s.reservation || s.reservation === who; }

  function sanStep(prev, a) {
    var s = copy(prev);
    s.wire = []; s.changed = []; s.lost = [];
    var c = s.clients[a.who], f = FILE[a.who];
    switch (a.verb) {
      case 'f':
        if (c.mounted) { s.res = { code: 'busy' }; break; }
        if (!writable(s, a.who)) {
          s.wire.push(blockMsg(a.who, 'WRITE', [0, 2], 'RESERVATION CONFLICT', false));
          s.res = { code: 'formatConflict' };
          break;
        }
        s.wire.push(blockMsg(a.who, 'WRITE', [0, 2], 'GOOD', true));
        s.disk[0] = 'fs'; s.disk[1] = ''; s.disk[2] = '';
        s.by[0] = s.by[1] = s.by[2] = a.who; s.changed.push(0, 1, 2);
        s.res = { code: 'formatted' };
        break;
      case 'm':
      case 'u':
        if (a.verb === 'm' && c.mounted) { s.res = { code: 'already' }; break; }   // mount twice: refused, nothing sent
        var old = c.mounted ? c.dir : null;                                       // remount before any mount = mount
        if (s.disk[0] !== 'fs') {
          s.wire.push(blockMsg(a.who, 'READ', [0, 2], 'GOOD', true));
          c.mounted = false; c.dir = null; c.bitmap = null;
          s.res = { code: 'noFs' };
          break;
        }
        s.wire.push(blockMsg(a.who, 'READ', [0, 2], 'GOOD', true));
        c.mounted = true; c.bitmap = parseBitmap(s.disk[1]); c.dir = parseDir(s.disk[2]);
        if (old) s.lost = names(old).filter(function (n) { return lookup(c.dir, n) === null; });
        s.res = { code: old ? 'remounted' : 'mounted', files: names(c.dir), dirBy: s.by[2] };
        break;
      default:
        if (!c.mounted) { s.res = { code: 'notMounted' }; break; }
        if (a.verb === 'l') {
          s.res = { code: 'listed', files: names(c.dir), cached: true };      // no message: the cache answers
        } else if (a.verb === 'r') {
          var at = lookup(c.dir, f);
          if (at === null) { s.res = { code: 'notFound', file: f }; break; }
          s.wire.push(blockMsg(a.who, 'READ', at, 'data:' + s.disk[at], true));
          s.res = { code: 'read', file: f, lba: at, data: s.disk[at], wrong: s.disk[at] !== a.who };
        } else { // write: the client's own filesystem allocates from its cached bitmap (rule 4)
          var lba = lookup(c.dir, f), fresh = lba === null;
          if (fresh) lba = firstFree(c.bitmap);
          if (lba === null) { s.res = { code: 'full' }; break; }
          if (!writable(s, a.who)) {           // rule 5: rejected, the filesystem aborts, its cache stays as it was
            s.wire.push(blockMsg(a.who, 'WRITE', lba, 'RESERVATION CONFLICT', false));
            s.res = { code: 'conflict', lba: lba, file: f };
            break;
          }
          s.wire.push(blockMsg(a.who, 'WRITE', lba, 'GOOD', true));
          s.disk[lba] = a.who; s.by[lba] = a.who; s.changed.push(lba);
          if (fresh) {
            c.bitmap = c.bitmap.concat([lba]).sort(function (x, y) { return x - y; });
            c.dir = addEntry(c.dir, f, lba);
            // rule 6: the client writes its own whole bitmap and directory; the last writer wins on disk
            s.wire.push(blockMsg(a.who, 'WRITE', 1, 'GOOD', true), blockMsg(a.who, 'WRITE', 2, 'GOOD', true));
            s.disk[1] = bitmapText(c.bitmap); s.disk[2] = dirText(c.dir);
            s.by[1] = s.by[2] = a.who; s.changed.push(1, 2);
          }
          s.res = { code: 'wrote', file: f, lba: lba, fresh: fresh };
        }
    }
    s.conflicts = sanConflicts(s);
    return s;
  }

  /** Conflict mark (SPEC.md): a data block claimed by two different names among the mounted caches and the on-disk
      directory; LBA 2 when a mounted cache holds an entry the disk's directory lacks. Ascending. */
  function sanConflicts(s) {
    if (s.disk[0] !== 'fs') return [];
    var disk = parseDir(s.disk[2]);
    var dirs = [disk], stale = false;
    CLIENTS.forEach(function (k) {
      var c = s.clients[k];
      if (!c.mounted) return;
      dirs.push(c.dir);
      c.dir.forEach(function (e) { if (lookup(disk, e[0]) === null) stale = true; });
    });
    var out = [];
    for (var b = DATA_FIRST; b < BLOCKS; b++) {
      var claim = [];
      dirs.forEach(function (d) { d.forEach(function (e) { if (e[1] === b && claim.indexOf(e[0]) < 0) claim.push(e[0]); }); });
      if (claim.length > 1) out.push(b);
    }
    if (stale) out.unshift(2);
    return out;
  }

  // ── the stepper ──

  var logic = {
    BLOCKS: BLOCKS, META: META, DATA_FIRST: DATA_FIRST, MAX_ACTIONS: MAX_ACTIONS, FILE: FILE, TWO: TWO,
    actionsOf: actionsOf, encode: encode, parseDir: parseDir, parseBitmap: parseBitmap,

    defaults: { mode: 'both', reservation: false, ops: TWO },

    steps: function (p) { return actionsOf(p).length; },

    initial: function (p) {
      return { op: null, nas: nasInitial(), san: sanInitial(p) };
    },

    step: function (s, n, p) {
      var a = actionsOf(p)[n - 1];
      if (!a) return copy(s);
      return { op: a, nas: nasStep(s.nas, a), san: sanStep(s.san, a) };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
