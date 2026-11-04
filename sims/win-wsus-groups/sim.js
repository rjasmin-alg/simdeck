/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-wsus-groups: WSUS computer groups, approvals per group with deadlines, and server-side vs client-side
   targeting (which group a computer is in). Rules, tie-breaks and expected numbers: SPEC.md.
   One step = one day: the admin's actions for the day, then every computer contacts the server, in a fixed order.
   Builds on sims/win-wsus-flow (a client scans, finds an approved update, installs it); nothing is copied from it:
   that model has no groups, and models/ has no WSUS model. New here: groups, targeting, approval resolution, deadlines.
   Host for win-update-rings (task): approvals are a plan with a `day` per entry, updates carry a `health` flag.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DAYS = 10;                          // the timeline: days 0–9, one step each
  var ALL = 'All Computers';
  var UNASSIGNED = 'Unassigned Computers';
  var GROUPS = [
    { name: ALL, parent: null },
    { name: UNASSIGNED, parent: ALL },
    { name: 'Pilot', parent: ALL },
    { name: 'Production', parent: ALL },
    { name: 'Kiosks', parent: ALL }
  ];
  /** The fleet (SPEC.md, "Computers"). groups: membership at step 0 (null: new, registers on day 0); gpo: the group
      names its Group Policy sets for client-side targeting; postpone: days a user puts off an install when asked. */
  var COMPUTERS = [
    { name: 'PC-P1', groups: ['Pilot'], gpo: 'Pilot', postpone: 0 },
    { name: 'PC-P2', groups: ['Pilot'], gpo: 'Pilot', postpone: 3 },
    { name: 'PC-P3', groups: null, gpo: null, postpone: 0 },            // gpo from the param gpoName
    { name: 'PC-K1', groups: ['Pilot', 'Kiosks'], gpo: 'Pilot;Kiosks', postpone: 0 },
    { name: 'PC-K2', groups: ['Kiosks'], gpo: 'Kiosks', postpone: 0 },
    { name: 'PC-01', groups: ['Production'], gpo: 'Production', postpone: 0 },
    { name: 'PC-02', groups: ['Production'], gpo: 'Production', postpone: 0 },
    { name: 'PC-03', groups: ['Production'], gpo: 'Production', postpone: 0 },
    { name: 'PC-04', groups: ['Production'], gpo: 'Production', postpone: 0 },
    { name: 'PC-05', groups: ['Production'], gpo: 'Production', postpone: 3 },
    { name: 'PC-06', groups: ['Production'], gpo: 'Production', postpone: 3 }
  ];
  var NEW_PC = 'PC-P3';
  var UPDATES = [{ id: 'KB-A', health: 'good' }, { id: 'KB-B', health: 'good' }];
  var SUBJECT = 'KB-B';                   // the update the timeline and the captions follow
  var PROD_DAY = 4;                       // the admin approves KB-B for Production on day 4
  var MOVE_DAY = 1;                       // the admin moves PC-P3 out of Unassigned Computers on day 1
  var RANK = { install: 2, remove: 1, notApproved: 0 };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function groupOf(s, name) { return s.groups.filter(function (g) { return g.name === name; })[0] || null; }
  function computer(s, name) { return s.computers.filter(function (c) { return c.name === name; })[0]; }

  /** The groups a computer is in, in the tree's order. */
  function groupsOf(s, pc) {
    return s.groups.filter(function (g) { return g.members.indexOf(pc) >= 0; }).map(function (g) { return g.name; });
  }
  function setMembership(s, pc, names) {
    s.groups.forEach(function (g) {
      var i = g.members.indexOf(pc);
      var want = names.indexOf(g.name) >= 0;
      if (i >= 0 && !want) g.members.splice(i, 1);
      if (i < 0 && want) g.members.push(pc);
    });
  }

  /** Rule 3: a group's approval for an update, its own or the nearest ancestor's ("same as parent"). */
  function groupApproval(s, group, update) {
    var g = group;
    while (g) {
      var own = s.approvals.filter(function (a) { return a.update === update && a.group === g; })[0];
      if (own) return { action: own.action, deadline: own.deadline, from: g, inherited: g !== group };
      var node = groupOf(s, g);
      g = node ? node.parent : null;
    }
    return { action: 'notApproved', deadline: null, from: null, inherited: false };
  }

  /** Rules 4 and 5: a computer's effective approval. Declined beats everything; else the strongest group wins
      (install > remove > notApproved) and the deadline is the earliest among the groups giving install. */
  function effectiveOf(s, pc, update) {
    if (s.declined.indexOf(update) >= 0) return { action: 'declined', deadline: null };
    var best = 'notApproved', deadline = null;
    groupsOf(s, pc).forEach(function (g) {
      var a = groupApproval(s, g, update);
      if (RANK[a.action] > RANK[best]) best = a.action;
      if (a.action === 'install' && a.deadline !== null && (deadline === null || a.deadline < deadline)) deadline = a.deadline;
    });
    return { action: best, deadline: best === 'install' ? deadline : null };
  }

  /** Rule 1 (client-side): the existing groups a Group Policy value names; Unassigned Computers when none exists.
      All Computers and Unassigned Computers cannot be targeted. */
  function targetGroups(s, gpo) {
    var names = String(gpo || '').split(';').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
    var hit = s.groups.filter(function (g) {
      return g.name !== ALL && g.name !== UNASSIGNED && names.indexOf(g.name.toLowerCase()) >= 0;
    }).map(function (g) { return g.name; });
    return hit.length ? hit : [UNASSIGNED];
  }

  /** The admin's plan for KB-B (SPEC.md, "One step"). Each entry has the day it is made. */
  function plan(p) {
    var out = [];
    var all = p.firstApproval === 'all';
    out.push({ kind: 'approve', update: SUBJECT, group: all ? ALL : 'Pilot', action: 'install', deadline: null, day: 0 });
    if (p.kioskRemove) out.push({ kind: 'approve', update: SUBJECT, group: 'Kiosks', action: 'remove', deadline: null, day: 0 });
    out.push({ kind: 'move', pc: NEW_PC, to: 'Pilot', day: MOVE_DAY });
    if (!all) {
      out.push({ kind: 'approve', update: SUBJECT, group: 'Production', action: 'install',
        deadline: p.prodDeadline >= 0 ? p.prodDeadline : null, day: PROD_DAY });
    }
    return out;
  }

  /** Effective approvals of every registered computer. */
  function deriveEffective(s) {
    var eff = {};
    s.computers.forEach(function (c) {
      if (!c.registered) return;
      eff[c.name] = {};
      s.updates.forEach(function (u) { eff[c.name][u.id] = effectiveOf(s, c.name, u.id); });
    });
    return eff;
  }

  /** Apply one approval (it replaces the group's earlier one for that update). */
  function approve(s, a) {
    s.approvals = s.approvals.filter(function (x) { return !(x.update === a.update && x.group === a.group); });
    s.approvals.push({ update: a.update, group: a.group, action: a.action, deadline: a.deadline, day: a.day });
  }

  /** One computer's contact on day d (rules 1, 4–6 and tie-breaks 2–3). */
  function contact(s, c, ev) {
    var d = s.day;
    if (!c.registered) {
      c.registered = true;
      if (s.targeting !== 'client') setMembership(s, c.name, [UNASSIGNED]);   // rule 1, server-side
      ev.reg.push(c.name);
    }
    if (s.targeting === 'client') {                                           // rule 1 / tie-break 2
      var before = groupsOf(s, c.name);
      setMembership(s, c.name, targetGroups(s, c.gpoGroup));
      var after = groupsOf(s, c.name);
      if (before.join('|') !== after.join('|')) ev.member.push({ pc: c.name, groups: after });
    }
    s.updates.forEach(function (u) {
      var st = s.pc[c.name][u.id];
      var e = effectiveOf(s, c.name, u.id);
      function note(what) { ev.pcs.push({ pc: c.name, update: u.id, what: what }); }
      st.forced = false;
      if (st.st === 'installed') {
        if (e.action === 'remove') { st.st = 'none'; st.due = null; st.det = null; note('removed'); }
        return;
      }
      if (e.action !== 'install') {
        if (st.st === 'detected') { st.st = 'none'; st.due = null; st.det = null; note('withdrawn'); }
        return;
      }
      if (st.st === 'none') {
        st.st = 'detected'; st.det = d; st.due = d + 1 + c.postpone;
        note('detected');
      }
      if (d >= st.due) { st.st = 'installed'; note('installed'); }            // tie-break 3: the user's day first
      else if (e.deadline !== null && d >= e.deadline) { st.st = 'installed'; st.forced = true; note('forced'); }
      else if (d === st.det + 1 && c.postpone > 0) note('postponed');
    });
  }

  function code(st) {
    if (st.st === 'installed') return st.forced ? 'forced' : 'inst';
    return st.st === 'detected' ? 'det' : 'na';
  }

  var logic = {
    DAYS: DAYS, ALL: ALL, UNASSIGNED: UNASSIGNED, SUBJECT: SUBJECT, NEW_PC: NEW_PC, PROD_DAY: PROD_DAY, MOVE_DAY: MOVE_DAY,

    /** Parameter defaults. prodDeadline: day of the Production deadline (−1: none). firstApproval: KB-B's day-0
        approval goes to Pilot or to All Computers. declineAt: KB-B is declined on day declineAt (−1: never); the
        page's button sets it to the current step, so the decline is the next step. */
    defaults: { targeting: 'server', gpoName: 'Pilot', prodDeadline: -1, kioskRemove: false, firstApproval: 'pilot', declineAt: -1 },

    /** Every run is the 10 days of the timeline. */
    steps: DAYS,

    /** State at step 0: before day 0. KB-A was rolled out on day −7 to Pilot, Production and Kiosks; KB-B is new. */
    initial: function (p) {
      var s = {
        targeting: p.targeting === 'client' ? 'client' : 'server',
        day: -1,
        groups: GROUPS.map(function (g) { return { name: g.name, parent: g.parent, members: [] }; }),
        computers: COMPUTERS.map(function (c) {
          return { name: c.name, gpoGroup: c.name === NEW_PC ? String(p.gpoName) : c.gpo, postpone: c.postpone,
            registered: c.groups !== null };
        }),
        updates: clone(UPDATES),
        approvals: [],
        declined: [],
        pc: {},
        effective: {},
        hist: {},
        plan: plan(p),
        declineAt: typeof p.declineAt === 'number' ? p.declineAt : -1,
        ev: null
      };
      COMPUTERS.forEach(function (c) {
        if (c.groups) setMembership(s, c.name, c.groups);
        s.pc[c.name] = {};
        s.updates.forEach(function (u) { s.pc[c.name][u.id] = { st: 'none', det: null, due: null, forced: false }; });
        s.hist[c.name] = [];
      });
      ['Pilot', 'Production', 'Kiosks'].forEach(function (g) {
        approve(s, { update: 'KB-A', group: g, action: 'install', deadline: null, day: -7 });
      });
      s.computers.forEach(function (c) {
        if (c.registered && effectiveOf(s, c.name, 'KB-A').action === 'install') s.pc[c.name]['KB-A'].st = 'installed';
      });
      s.effective = deriveEffective(s);
      return s;
    },

    /** State after step n (day n − 1) from the state after step n − 1. Past the end it returns the state unchanged. */
    step: function (s0, n) {
      var s = clone(s0);
      if (s.day >= DAYS - 1) { s.ev = null; return s; }
      s.day += 1;
      var d = s.day;
      var ev = { day: d, admin: [], reg: [], member: [], pcs: [] };
      // 1. admin actions: the button's decline first, then the plan (an approval of a declined update is skipped)
      if (s.declineAt === d && s.declined.indexOf(SUBJECT) < 0) {
        s.declined.push(SUBJECT);
        ev.admin.push({ kind: 'decline', update: SUBJECT });
      }
      s.plan.filter(function (a) { return a.day === d; }).forEach(function (a) {
        if (a.kind === 'approve') {
          if (s.declined.indexOf(a.update) >= 0) { ev.admin.push({ kind: 'skipped', update: a.update, group: a.group }); return; }
          approve(s, a);
          ev.admin.push({ kind: 'approve', update: a.update, group: a.group, action: a.action, deadline: a.deadline });
        } else if (a.kind === 'move') {
          var c = computer(s, a.pc);
          if (!c.registered || groupsOf(s, a.pc).join('|') !== UNASSIGNED) return;     // nothing to move
          if (s.targeting === 'client') { ev.admin.push({ kind: 'move', pc: a.pc, to: a.to, rejected: 'clientSide' }); return; }   // rule 2
          setMembership(s, a.pc, [a.to]);
          ev.admin.push({ kind: 'move', pc: a.pc, to: a.to });
        }
      });
      // 2–3. every computer contacts the server, in the fleet's order
      s.computers.forEach(function (c) { contact(s, c, ev); });
      s.effective = deriveEffective(s);
      s.computers.forEach(function (c) { s.hist[c.name][d] = code(s.pc[c.name][SUBJECT]); });
      s.ev = ev;
      return s;
    },

    /** What a grid cell shows: a group's approval for an update, own or inherited; ⊘ when declined. */
    cell: function (s, group, update) {
      if (s.declined.indexOf(update) >= 0) return { action: 'declined', deadline: null, inherited: false, from: null };
      return groupApproval(s, group, update);
    },

    /** Counts of KB-B's states over the registered computers. */
    countOf: function (s) {
      var out = { installed: 0, detected: 0, none: 0, computers: 0 };
      s.computers.forEach(function (c) {
        if (!c.registered) return;
        out.computers++;
        var st = s.pc[c.name][SUBJECT];
        if (st.st === 'installed') out.installed++;
        else if (st.st === 'detected') out.detected++;
        else out.none++;
      });
      return out;
    },

    groupsOf: groupsOf,
    effectiveOf: effectiveOf,
    groupApproval: groupApproval,
    targetGroups: targetGroups,
    plan: plan
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
