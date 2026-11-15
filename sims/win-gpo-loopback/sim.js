/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-loopback: which user settings a user gets when logging on to a computer whose OU sets loopback
   processing (off, merge, replace). Two lists: the GPOs on the user's path (user list) and the GPOs on the computer's
   path (computer list, used for their user half). Each list keeps the normal precedence (processingList, from
   win-gpo-precedence). loopbackMode() reads the mode from the computer list's computer half; entriesOf() puts both
   lists in processing order and says what happens to each GPO's user settings (apply, unused, replaced, filtered, or a
   precedence drop); rowsOf() lists every user setting of every GPO. One step takes one GPO; the last step shows the
   result per setting (last value added wins; none: the default). Rules and sources: SPEC.md.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── from sims/win-gpo-precedence/sim.js @ 8f95399 (processingList, unchanged) ──

  /**
   * Every link on the path in processing order, with what it does for `setting`:
   *   1. local, site, domain, then OUs parent to child; within a container the highest link order first, link order 1 last;
   *   3. Block Inheritance on an OU drops the non-enforced links of every container above it except the local GPO;
   *   4. enforced links leave the normal order and come after all others, deepest container first, so the highest
   *      container's enforced link is processed last; the local GPO cannot be enforced;
   *   5. a disabled link, or a GPO whose half (computer/user) is disabled, is skipped;
   *   6. a GPO without a value for the setting is processed but changes nothing (not configured);
   *   8. a GPO linked twice is listed at each link.
   * Each entry: { gpo, container, kind, depth, order, enforced, status, value, by } where status is
   * apply | nc | blocked | link-off | half-off, and `by` is the blocking container's id for blocked entries.
   */
  function processingList(scene, setting) {
    var path = scene.containers;
    var blockAt = -1;
    path.forEach(function (c, i) { if (c.kind === 'ou' && c.block) blockAt = i; });
    var normal = [], enforced = [];
    path.forEach(function (c, depth) {
      var links = c.links.map(function (l, k) { return { l: l, k: k }; });
      links.sort(function (a, b) { return b.l.order - a.l.order || a.k - b.k; });   // highest link order first
      links.forEach(function (x) {
        var l = x.l, gpo = scene.gpos[l.gpo] || { values: {} };
        var e = { gpo: l.gpo, container: c.id, kind: c.kind, depth: depth, order: l.order,
          enforced: !!l.enforced && c.kind !== 'local', status: 'apply', value: null, by: null };
        if (!e.enforced && c.kind !== 'local' && depth < blockAt) { e.status = 'blocked'; e.by = path[blockAt].id; }
        else if (l.enabled === false) e.status = 'link-off';
        else if (gpo.off === 'all' || gpo.off === scene.half) e.status = 'half-off';
        else if (!Object.prototype.hasOwnProperty.call(gpo.values, setting)) e.status = 'nc';
        else e.value = gpo.values[setting];
        (e.enforced ? enforced : normal).push(e);
      });
    });
    enforced.sort(function (a, b) { return b.depth - a.depth; });   // stable: link order kept within a container
    return normal.concat(enforced);
  }

  // ── this sim ──

  /** The user settings, in the order the table and the result list them. */
  var SETTINGS = ['wallpaper', 'drive', 'hideCp'];

  /** A container on a path: { id, kind, name, links: [{ gpo, order, enforced, enabled }], block }. */
  function link(gpo) { return { gpo: gpo, order: 1, enforced: false, enabled: true }; }

  /**
   * The scene for these params. Each GPO: { name, user: {setting: value}, computer: {setting: value},
   * off: null | 'user' | 'computer' | 'all', read: { users, computers } } (read = Read + Apply Group Policy).
   */
  function sceneOf(p) {
    var domain = { id: 'domain', kind: 'domain', name: 'quillmoor.example', links: [] };
    return {
      user: 'ana',
      computer: 'KIOSK1',
      userPath: [domain, { id: 'ou-staff', kind: 'ou', name: 'OU=Staff', links: [link('staff')] }],
      computerPath: [domain, { id: 'ou-kiosks', kind: 'ou', name: 'OU=Kiosks', links: [link('kiosk')] }],
      gpos: {
        staff: { name: 'Staff User', user: { wallpaper: 'staff.jpg', drive: 'P:' }, computer: {}, off: null,
          read: { users: true, computers: true } },
        kiosk: { name: 'Kiosk Lockdown', user: { wallpaper: 'kiosk.jpg', hideCp: 'on' },
          computer: p.mode === 'off' ? {} : { loopback: p.mode }, off: null,
          read: { users: p.usersCanRead !== false, computers: p.computersCanRead !== false } }
      }
    };
  }

  /** One path of the scene, seen through one half (user or computer), in the shape processingList takes. */
  function halfOf(scene, path, half) {
    var gpos = {};
    Object.keys(scene.gpos).forEach(function (k) { gpos[k] = { values: scene.gpos[k][half], off: scene.gpos[k].off }; });
    return { half: half, containers: scene[path], gpos: gpos };
  }

  function canRead(scene, gpo, who) { var r = scene.gpos[gpo].read || {}; return r[who] !== false; }

  /**
   * Rule 2: the loopback mode the computer gets: the computer list's computer half, normal precedence (last writer
   * wins), only GPOs that apply to the computer (security filtering with the computer's token). 'off' when none sets it.
   */
  function loopbackMode(scene) {
    var mode = 'off';
    processingList(halfOf(scene, 'computerPath', 'computer'), 'loopback').forEach(function (e) {
      if (e.status === 'apply' && canRead(scene, e.gpo, 'computers')) mode = e.value;
    });
    return mode;
  }

  /**
   * Both lists in processing order, user list first (rules 1, 3, 4, 5, 6). Each entry: { gpo, path: 'user' | 'computer',
   * container, status, by } where status is apply | unused | replaced | filtered | blocked | link-off | half-off.
   * Precedence drops come first, then the loopback reason (unused, replaced), then security filtering against the user.
   */
  function entriesOf(scene, mode) {
    if (mode == null) mode = loopbackMode(scene);
    function list(path, tag) {
      return processingList(halfOf(scene, path, 'user'), '').map(function (e) {
        var status = e.status === 'nc' || e.status === 'apply' ? 'apply' : e.status;
        if (status === 'apply') {
          if (tag === 'computer' && mode === 'off') status = 'unused';
          else if (tag === 'user' && mode === 'replace') status = 'replaced';
          else if (!canRead(scene, e.gpo, 'users')) status = 'filtered';
        }
        return { gpo: e.gpo, path: tag, container: e.container, status: status, by: e.by };
      });
    }
    return list('userPath', 'user').concat(list('computerPath', 'computer'));
  }

  /** Every user setting of every entry, in order: { entry, gpo, path, setting, value }; a GPO with none gets one row, setting null. */
  function rowsOf(scene, entries) {
    var rows = [];
    entries.forEach(function (e, i) {
      var vals = scene.gpos[e.gpo].user, keys = SETTINGS.filter(function (k) { return Object.prototype.hasOwnProperty.call(vals, k); });
      Object.keys(vals).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
      if (!keys.length) rows.push({ entry: i, gpo: e.gpo, path: e.path, setting: null, value: null });
      keys.forEach(function (k) { rows.push({ entry: i, gpo: e.gpo, path: e.path, setting: k, value: vals[k] }); });
    });
    return rows;
  }

  /** The result after taking entries 0..upTo: per setting { value, from (gpo), row }; a setting nobody set is absent. */
  function resultOf(entries, rows, upTo) {
    var out = {};
    rows.forEach(function (r, i) {
      if (r.entry > upTo || entries[r.entry].status !== 'apply' || r.setting == null) return;
      out[r.setting] = { value: r.value, from: r.gpo, row: i };
    });
    return out;
  }

  var logic = {
    defaults: { mode: 'off', usersCanRead: true, computersCanRead: true },

    presets: [
      { id: 'no-loopback', params: { mode: 'off' } },
      { id: 'merge', params: { mode: 'merge' } },
      { id: 'replace', params: { mode: 'replace' } },
      { id: 'filtered', params: { mode: 'replace', usersCanRead: false } }
    ],

    /** One step per GPO in both lists, plus the result. */
    steps: function (p) { var sc = sceneOf(p); return entriesOf(sc).length + 1; },

    initial: function (p) {
      var scene = sceneOf(p), mode = loopbackMode(scene), entries = entriesOf(scene, mode);
      return {
        user: scene.user, computer: scene.computer,
        mode: mode,
        userGpos: entries.filter(function (e) { return e.path === 'user'; }).map(function (e) { return e.gpo; }),
        computerGpos: entries.filter(function (e) { return e.path === 'computer'; }).map(function (e) { return e.gpo; }),
        kioskReadableByUsers: canRead(scene, 'kiosk', 'users'),
        entries: entries,
        list: rowsOf(scene, entries),
        seen: rowsOf(scene, entries).map(function () { return null; }),   // null | applied | overwritten | dropped
        cursor: -1,       // the entry taken in the last step
        result: {},       // per setting: { value, from, row }
        event: null,      // { kind: entry status | 'result', entry, rows: [row indices], over: [row indices overwritten] }
        done: false
      };
    },

    step: function (s, n) {
      var seen = s.seen.slice(), result = {};
      Object.keys(s.result).forEach(function (k) { result[k] = s.result[k]; });
      var ev;
      if (n > s.entries.length) ev = { kind: 'result', entry: -1, rows: [], over: [] };
      else {
        var i = n - 1, e = s.entries[i];
        ev = { kind: e.status, entry: i, rows: [], over: [] };
        s.list.forEach(function (r, k) {
          if (r.entry !== i) return;
          ev.rows.push(k);
          if (e.status !== 'apply') { seen[k] = 'dropped'; return; }
          if (r.setting == null) { seen[k] = 'applied'; return; }
          var prev = result[r.setting];
          if (prev) { seen[prev.row] = 'overwritten'; ev.over.push(prev.row); }
          seen[k] = 'applied';
          result[r.setting] = { value: r.value, from: r.gpo, row: k };
        });
      }
      return { user: s.user, computer: s.computer, mode: s.mode, userGpos: s.userGpos, computerGpos: s.computerGpos,
        kioskReadableByUsers: s.kioskReadableByUsers, entries: s.entries, list: s.list, seen: seen,
        cursor: ev.kind === 'result' ? s.cursor : ev.entry, result: result, event: ev, done: ev.kind === 'result' };
    },

    sceneOf: sceneOf,
    processingList: processingList,
    halfOf: halfOf,
    loopbackMode: loopbackMode,
    entriesOf: entriesOf,
    rowsOf: rowsOf,
    resultOf: resultOf,
    SETTINGS: SETTINGS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
