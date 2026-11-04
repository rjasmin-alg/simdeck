/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-fgpp: which password policy one domain user gets. The candidates are the PSOs (password settings
   objects) applied to the user directly, the PSOs that reach the user through a global security group (nested groups
   too), the domain policy from the GPO linked at the domain root, and any password GPO linked to an OU (which never
   applies to domain accounts). Direct PSOs are looked at first, then group PSOs, then the domain policy; within a tier
   the lowest precedence number wins, equal numbers go to the smallest objectGUID. The first tier with a PSO decides
   and the rest is dropped; the winner replaces the domain policy as a whole. Rules and sources: SPEC.md.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. candidatesOf, eventsOf and winnerOf take any scene, so they can move to
   models/ unchanged. The rule table and the "winning row" display follow sims/win-gpo-precedence (its page, not its
   model: the selection rule here is different). */
(function (root) {
  'use strict';

  var MIN_LEVEL = 2008;   // rule 3: PSOs need the Windows Server 2008 domain functional level

  /** PSO and GPO settings: minimum length, complexity, lockout threshold (0 = never lock). */
  var SET = {
    ddp: { minLength: 7, complexity: true, lockout: 10 },
    staffPw: { minLength: 14, complexity: true, lockout: 5 },
    defaultStaff: { minLength: 4, complexity: false, lockout: 0 },
    finance: { minLength: 12, complexity: true, lockout: 5 },
    vip: { minLength: 15, complexity: true, lockout: 3 }
  };

  /** GUIDs whose first group repeats one byte, so text order and byte order agree (SPEC.md §2, rule 6). */
  var GUID = {
    defaultStaff: '2b2b2b2b-6c1e-4d0a-9f3e-5a7c1d2e8f01',
    finance: '7e7e7e7e-0b4d-4f6a-8c2d-3e9a1b5c7d02',
    vip: 'c4c4c4c4-3f2a-4b8e-a1d7-6e0c9b2a4f03'
  };

  /**
   * The scene for these params. Principals: the user, global security groups (members are users or groups), OUs.
   * psos[].appliesTo names principals; gpos are the password GPOs and where each is linked (domain root or an OU).
   */
  function sceneOf(p) {
    var staffMembers = p.noStaff ? [] : ['ana'];
    return {
      level: 2012,
      domain: 'quillmoor.example',
      user: { id: 'ana', ou: 'OU=HQ,OU=Staff' },
      groups: [
        { id: 'All Staff', scope: 'global', type: 'security', members: staffMembers },
        { id: 'Finance', scope: 'global', type: 'security', members: p.group2 ? ['ana'] : [] }
      ],
      ous: ['OU=Staff', 'OU=HQ,OU=Staff'],
      psos: [
        { id: 'Default-Staff', precedence: 10, guid: GUID.defaultStaff, appliesTo: ['All Staff'], settings: SET.defaultStaff },
        { id: 'Finance', precedence: p.samePrecedence ? 10 : 5, guid: GUID.finance, appliesTo: ['Finance'], settings: SET.finance },
        { id: 'VIP', precedence: 50, guid: GUID.vip, appliesTo: p.directPso ? ['ana'] : [], settings: SET.vip }
      ],
      gpos: [
        { id: 'Default Domain Policy', link: 'domain', order: 1, settings: SET.ddp }
      ].concat(p.ouGpo ? [{ id: 'Staff Passwords', link: 'OU=Staff', order: 1, settings: SET.staffPw }] : [])
    };
  }

  /** Every global security group the user is in, directly or through nested groups (rule 5), in scene order.
      Distribution groups and domain-local or universal groups never carry a PSO (rule 3). */
  function groupsOf(scene, userId) {
    var global = scene.groups.filter(function (g) { return g.scope === 'global' && g.type === 'security'; });
    var inside = [userId], grew = true;
    while (grew) {
      grew = false;
      global.forEach(function (g) {
        if (inside.indexOf(g.id) < 0 && g.members.some(function (m) { return inside.indexOf(m) >= 0; })) { inside.push(g.id); grew = true; }
      });
    }
    return global.map(function (g) { return g.id; }).filter(function (id) { return inside.indexOf(id) >= 0; });
  }

  /** Rule 4–6 order inside a tier: lowest precedence first, then the smallest objectGUID (compared as lowercase hex). */
  function psoOrder(a, b) {
    return a.precedence - b.precedence || (a.guid.toLowerCase() < b.guid.toLowerCase() ? -1 : a.guid.toLowerCase() > b.guid.toLowerCase() ? 1 : 0);
  }

  /**
   * The candidate rows for the user, in evaluation order (SPEC.md §2):
   *   tier 'direct': PSOs whose appliesTo names the user (rule 4);
   *   tier 'group':  PSOs that reach the user through a global group, not already direct (rules 3, 5); `via` = the group;
   *   tier 'domain': the GPO linked at the domain root (rule 1; one per scene, several are win-gpo-precedence's subject),
   *                  then password GPOs linked to OUs (rule 2, kind 'ou').
   * Within a PSO tier rows are sorted by precedence, then GUID. PSOs are ignored below functional level 2008 and
   * when they name only OUs or groups that are not global (rule 3). Each row:
   * { id, kind: pso | domain | ou, tier, precedence, guid, via, settings }.
   */
  function candidatesOf(scene) {
    var user = scene.user.id;
    var mine = groupsOf(scene, user);
    var direct = [], group = [];
    if (scene.level >= MIN_LEVEL) {
      scene.psos.forEach(function (pso) {
        var row = { id: pso.id, kind: 'pso', tier: null, precedence: pso.precedence, guid: pso.guid, via: null, settings: pso.settings };
        if (pso.appliesTo.indexOf(user) >= 0) { row.tier = 'direct'; row.via = 'direct'; direct.push(row); return; }
        var g = mine.filter(function (id) { return pso.appliesTo.indexOf(id) >= 0; })[0];
        if (g) { row.tier = 'group'; row.via = g; group.push(row); }
      });
    }
    direct.sort(psoOrder);
    group.sort(psoOrder);
    var dom = scene.gpos.filter(function (g) { return g.link === 'domain'; }).slice().sort(function (a, b) { return a.order - b.order; });
    var ou = scene.gpos.filter(function (g) { return g.link !== 'domain'; });
    return direct.concat(group,
      dom.map(function (g) { return { id: g.id, kind: 'domain', tier: 'domain', precedence: null, guid: null, via: 'domain', order: g.order, settings: g.settings }; }),
      ou.map(function (g) { return { id: g.id, kind: 'ou', tier: 'domain', precedence: null, guid: null, via: g.link, order: g.order, settings: g.settings }; }));
  }

  /** Rules 4–7: the winning row's index. The first PSO tier with a row decides; else the first domain-root GPO; -1 if none. */
  function winnerOf(rows) {
    for (var i = 0; i < rows.length; i++) if (rows[i].kind === 'pso' || rows[i].kind === 'domain') return i;
    return -1;
  }

  /**
   * The steps. One per tier that has rows, in order direct, group, domain: its best row is kept, the others are beaten
   * (by a precedence number or, at equal numbers, by the GUID). Once a tier has kept a row, every later row is dropped
   * in one step (direct before group, any PSO before the domain policy). OU-linked GPOs are always dropped. Last,
   * the winner. Each: { kind: tier | drop | winner, tier, rows: [indices], kept: index | -1,
   *   beaten: [{ row, by: precedence | guid }], dropped: [{ row, by: direct-first | pso | ou-gpo }] }.
   */
  function eventsOf(rows) {
    var out = [], kept = -1;
    var tiers = ['direct', 'group', 'domain'];
    for (var t = 0; t < tiers.length; t++) {
      var idx = [];
      rows.forEach(function (r, i) { if (r.tier === tiers[t]) idx.push(i); });
      if (!idx.length) continue;
      if (kept >= 0) {
        var rest = [];
        for (var i = idx[0]; i < rows.length; i++) rest.push(i);   // rows are in tier order: this tier and every later one
        out.push({ kind: 'drop', tier: tiers[t], rows: rest, kept: kept, beaten: [],
          dropped: rest.map(function (i) {
            var r = rows[i];
            return { row: i, by: r.kind === 'ou' ? 'ou-gpo' : r.tier === 'group' ? 'direct-first' : 'pso' };
          }) });
        break;
      }
      var ev = { kind: 'tier', tier: tiers[t], rows: idx, kept: -1, beaten: [], dropped: [] };
      idx.forEach(function (i) {
        var r = rows[i];
        if (r.kind === 'ou') { ev.dropped.push({ row: i, by: 'ou-gpo' }); return; }
        if (ev.kept < 0) { ev.kept = i; return; }
        var k = rows[ev.kept];
        ev.beaten.push({ row: i, by: r.kind === 'pso' && r.precedence === k.precedence ? 'guid' : 'precedence' });
      });
      kept = ev.kept;
      out.push(ev);
    }
    out.push({ kind: 'winner', tier: null, rows: [], kept: kept, beaten: [], dropped: [] });
    return out;
  }

  /** Rule 7: the resultant policy is the winner's settings as a whole (no merging); msDS-ResultantPSO names a PSO only. */
  function resultantOf(rows) {
    var w = winnerOf(rows);
    if (w < 0) return null;
    return { row: w, resultantPso: rows[w].kind === 'pso' ? rows[w].id : null, settings: rows[w].settings };
  }

  function rowsOf(p) { return candidatesOf(sceneOf(p)); }

  var logic = {
    defaults: { directPso: false, group2: false, samePrecedence: false, ouGpo: false, noStaff: false },

    presets: [
      { id: 'quillmoor', params: {} },
      { id: 'two-groups', params: { group2: true } },
      { id: 'direct-beats-group', params: { directPso: true, group2: true } },
      { id: 'tie', params: { group2: true, samePrecedence: true } },
      { id: 'ou-gpo', params: { ouGpo: true } }
    ],

    /** Steps for these params: tiers looked at, plus the winner (2 or 3 on this scene). */
    steps: function (p) { return eventsOf(rowsOf(p)).length; },

    initial: function (p) {
      var scene = sceneOf(p), rows = candidatesOf(scene);
      return {
        user: scene.user.id,
        groups: groupsOf(scene, scene.user.id),
        rows: rows,
        marks: rows.map(function () { return null; }),   // null | kept | beaten | dropped | won
        why: rows.map(function () { return null; }),     // precedence | guid | direct-first | pso | ou-gpo
        kept: -1,          // the row in the running now
        event: null,       // this step's event
        winner: null,      // set at the last step: a row index, or -1
        resultant: null    // set at the last step: resultantOf(rows)
      };
    },

    step: function (s, n, p) {
      var ev = eventsOf(s.rows)[n - 1];
      var marks = s.marks.slice(), why = s.why.slice(), winner = null, resultant = null;
      if (ev.kind === 'winner') {
        winner = winnerOf(s.rows);
        resultant = resultantOf(s.rows);
        if (winner >= 0) marks[winner] = 'won';
      } else {
        if (ev.kind === 'tier' && ev.kept >= 0) marks[ev.kept] = 'kept';
        ev.beaten.forEach(function (b) { marks[b.row] = 'beaten'; why[b.row] = b.by; });
        ev.dropped.forEach(function (d) { marks[d.row] = 'dropped'; why[d.row] = d.by; });
      }
      return { user: s.user, groups: s.groups, rows: s.rows, marks: marks, why: why,
        kept: ev.kind === 'tier' && ev.kept >= 0 ? ev.kept : s.kept,
        event: ev, winner: winner, resultant: resultant };
    },

    sceneOf: sceneOf,
    groupsOf: groupsOf,
    candidatesOf: candidatesOf,
    eventsOf: eventsOf,
    winnerOf: winnerOf,
    resultantOf: resultantOf,
    rowsOf: rowsOf,
    MIN_LEVEL: MIN_LEVEL
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
