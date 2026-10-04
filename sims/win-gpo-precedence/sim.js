/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-precedence: which GPO's value wins for one setting on one computer.
   The containers on the computer's path (local, site, domain, OUs parent to child) each hold GPO links (link order,
   Enforced, enabled); an OU may block inheritance. processingList() puts every link in processing order and says what
   it does for the setting (applies a value, not configured, blocked, link disabled, half disabled); one step processes
   one GPO (all GPOs dropped by Block Inheritance go in one step), the last step names the winner: the last GPO that
   applied a value. Rules and sources: SPEC.md.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. processingList and eventsOf take any scene, so they can move to
   models/ unchanged (win-gpo-loopback extends this sim). */
(function (root) {
  'use strict';

  /** Values per setting of each GPO (minutes for 'lock', 'on' for 'usb'); a missing key is "not configured". */
  var GPOS = {
    local: { name: null, values: { lock: 20 } },
    lockdown: { name: 'Domain Lockdown', values: { lock: 15, usb: 'on' } },
    base: { name: 'Quillmoor Base', values: {} },
    std: { name: 'WS Standard', values: { lock: 10 } },
    kiosk: { name: 'WS Kiosk', values: { lock: 5 } }
  };

  var SETTINGS = ['lock', 'usb'];

  /**
   * The scene for these params: the target computer, the containers on its path top down (local first), each with
   * its links, and the GPOs. kind: local | site | domain | ou. A container's depth is its index in the path.
   */
  function sceneOf(p) {
    var inOu = !p.cn;
    var containers = [
      { id: 'local', kind: 'local', name: null, links: [{ gpo: 'local', order: 1, enforced: false, enabled: true }] },
      { id: 'hq', kind: 'site', name: 'HQ', links: [] },
      { id: 'domain', kind: 'domain', name: 'quillmoor.example', links: [{ gpo: 'lockdown', order: 1, enforced: !!p.enforceDomain, enabled: true }] }
    ];
    if (inOu) {
      containers.push({ id: 'ou-quillmoor', kind: 'ou', name: 'OU=Quillmoor', links: [{ gpo: 'base', order: 1, enforced: false, enabled: true }] });
      containers.push({ id: 'ou-ws', kind: 'ou', name: 'OU=Workstations', block: !!p.blockWs, links: [
        { gpo: 'std', order: p.swapOrder ? 1 : 2, enforced: false, enabled: !p.disableStd },
        { gpo: 'kiosk', order: p.swapOrder ? 2 : 1, enforced: !!p.enforceOu, enabled: true }
      ] });
    }
    return {
      target: inOu ? 'PC07' : 'PC19',
      where: inOu ? 'ou-ws' : 'cn-computers',
      half: 'computer',
      containers: containers,
      gpos: GPOS
    };
  }

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

  /**
   * The steps: one per entry, except that every blocked entry goes into one step at the place of the first; then a
   * last step for the winner. Each: { kind: apply | nc | blocked | link-off | half-off | winner, rows: [indices] }.
   */
  function eventsOf(list) {
    var out = [], blocked = null;
    list.forEach(function (e, i) {
      if (e.status === 'blocked') {
        if (blocked) { blocked.rows.push(i); return; }
        blocked = { kind: 'blocked', rows: [i] };
        out.push(blocked);
      } else out.push({ kind: e.status, rows: [i] });
    });
    out.push({ kind: 'winner', rows: [] });
    return out;
  }

  /** Rule 2: the last entry that applied a value wins; -1 when none did (not configured). */
  function winnerOf(list) {
    var w = -1;
    list.forEach(function (e, i) { if (e.status === 'apply') w = i; });
    return w;
  }

  function listOf(p) { return processingList(sceneOf(p), p.setting); }

  var logic = {
    defaults: { setting: 'lock', cn: false, blockWs: false, enforceDomain: false, enforceOu: false, swapOrder: false, disableStd: false },

    presets: [
      { id: 'lsdou', params: {} },
      { id: 'link-order', params: { swapOrder: true } },
      { id: 'block', params: { blockWs: true } },
      { id: 'enforced-vs-block', params: { blockWs: true, enforceDomain: true } },
      { id: 'two-enforced', params: { enforceDomain: true, enforceOu: true } },
      { id: 'computers-container', params: { cn: true } }
    ],

    /** Steps for these params: one per processing event plus the winner (at most 6 on this scene). */
    steps: function (p) { return eventsOf(listOf(p)).length; },

    initial: function (p) {
      var scene = sceneOf(p), list = processingList(scene, p.setting);
      return {
        target: scene.target, where: scene.where, setting: p.setting,
        list: list,
        seen: list.map(function () { return null; }),   // null | applied | overwritten | nc | skipped
        current: -1,      // the entry whose value stands now (-1: not configured)
        event: null,      // this step's event
        winner: null      // set at the last step: an entry index, or -1 (not configured)
      };
    },

    step: function (s, n, p) {
      var ev = eventsOf(s.list)[n - 1];
      var seen = s.seen.slice(), current = s.current, prev = s.current, winner = null;
      if (ev.kind === 'winner') winner = winnerOf(s.list);
      else ev.rows.forEach(function (i) {
        var e = s.list[i];
        if (e.status === 'apply') {
          if (current >= 0) seen[current] = 'overwritten';
          seen[i] = 'applied';
          current = i;
        } else seen[i] = e.status === 'nc' ? 'nc' : 'skipped';
      });
      return { target: s.target, where: s.where, setting: s.setting, list: s.list, seen: seen, current: current,
        event: { kind: ev.kind, rows: ev.rows, prev: prev }, winner: winner };
    },

    sceneOf: sceneOf,
    processingList: processingList,
    eventsOf: eventsOf,
    winnerOf: winnerOf,
    listOf: listOf,
    SETTINGS: SETTINGS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
