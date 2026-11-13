/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-delegation: delegating password resets on an OU instead of putting the helpdesk in Domain Admins.
   The OU tree of quillmoor.example (from sims/win-ad-structure/sim.js @ 36f2f87: the subset this sim needs, plus
   OU=Disabled from the estate's ou-tree.txt), five users, the group Helpdesk with hd-mia, and Domain Admins.
   One step = one admin action (the delegation wizard on an OU, a move, a Domain Admins change, an SDProp run) or
   one test as hd-mia. Rules and expected results: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers;
   state is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Containers, parents before children (the order the page draws them). dn = the name the page shows. */
  var CONTAINERS = [
    { id: 'q', kind: 'domain', dn: 'quillmoor.example', parent: null },
    { id: 'users', kind: 'container', dn: 'CN=Users', parent: 'q' },
    { id: 'quillmoor', kind: 'ou', dn: 'OU=Quillmoor', parent: 'q' },
    { id: 'staff', kind: 'ou', dn: 'OU=Staff', parent: 'quillmoor' },
    { id: 'hq', kind: 'ou', dn: 'OU=HQ', parent: 'staff' },
    { id: 'brack', kind: 'ou', dn: 'OU=Brackenridge', parent: 'staff' },
    { id: 'disabled', kind: 'ou', dn: 'OU=Disabled', parent: 'quillmoor' }
  ];
  /** Users the page can test, in the order of the target param. Homes from the estate's users.csv. */
  var USERS = ['eyardley', 'aashdown', 'afenwick', 'tbrennan-adm', 'administrator'];
  var SCOPES = { staff: 'staff', brack: 'brack' };
  var TESTER = 'hd-mia';
  var GROUP = 'Helpdesk';
  var DA = 'Domain Admins';
  var SCENARIOS = ['delegate-staff', 'narrow', 'protected-admin', 'move-user', 'quillmoor'];
  /** What each test needs (rule 4): reset = the Reset Password extended right; unlock = write lockoutTime. */
  var NEEDS = { reset: 'reset', unlock: 'lockoutTime' };

  /** Rule 1: the wizard's task "reset passwords and force a change at next logon": two allow ACEs, Helpdesk,
      applying to descendant user objects. */
  function wizardAces() {
    return [
      { trustee: GROUP, type: 'allow', right: 'reset', appliesTo: 'users' },
      { trustee: GROUP, type: 'allow', right: 'pwdLastSet', appliesTo: 'users' }
    ];
  }
  /** A user object's own ACL: the schema default for new users (Domain Admins full control) or, once SDProp has
      stamped it (adminCount = 1), AdminSDHolder's copy (rule 5). Reduced to the rows the lesson needs. */
  var DEFAULT_ACL = [{ trustee: DA, type: 'allow', right: 'full', appliesTo: 'this', src: 'default' }];
  var ADMINSDHOLDER_ACL = [
    { trustee: DA, type: 'allow', right: 'full', appliesTo: 'this', src: 'adminsdholder' },
    { trustee: 'Administrators', type: 'allow', right: 'full', appliesTo: 'this', src: 'adminsdholder' }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function container(id) { for (var i = 0; i < CONTAINERS.length; i++) if (CONTAINERS[i].id === id) return CONTAINERS[i]; return null; }
  /** The container and its ancestors, nearest first. */
  function ancestors(id) { var out = []; for (var c = container(id); c; c = container(c.parent)) out.push(c.id); return out; }
  function sameAce(a, b) { return a.trustee === b.trustee && a.type === b.type && a.right === b.right && a.appliesTo === b.appliesTo; }

  /** The script of a scenario: { kind, ... }. The wizard runs on the scope param. */
  function script(p) {
    var ou = SCOPES[p.scope] || 'staff';
    function test(user, action) { return { kind: 'test', user: user, action: action || 'reset' }; }
    switch (p.scenario) {
      case 'narrow':
        return [{ kind: 'wizard', ou: ou }, test('aashdown'), test('eyardley'), test('afenwick')];
      case 'protected-admin':
        return [{ kind: 'wizard', ou: ou }, { kind: 'daAdd', user: 'tbrennan-adm' }, test('tbrennan-adm'), { kind: 'sdprop' }, test('tbrennan-adm')];
      case 'move-user':
        return [test('aashdown'), { kind: 'move', user: 'aashdown', to: 'disabled' }, test('aashdown')];
      case 'quillmoor':
        return [test('administrator'), { kind: 'daRemoveHelpdesk' }, { kind: 'wizard', ou: ou }, test('administrator')];
      default: // delegate-staff
        return [{ kind: 'wizard', ou: ou }, test('aashdown'), test('eyardley'), test('afenwick'), test('aashdown', 'unlock')];
    }
  }

  /** The security identifiers in hd-mia's token: herself, Helpdesk, and Domain Admins while Helpdesk is in it. */
  function sidsOf(s) { return [TESTER, GROUP].concat(s.helpdeskInDA ? [DA] : []); }

  /** Rules 1, 3, 5, 7: the user's ACL in canonical order. Explicit rows (deny before allow), then, unless SDProp
      turned inheritance off, the ACEs of each ancestor that apply to descendant users, nearest ancestor first
      (deny before allow within one ancestor). Each row: { trustee, type, right, appliesTo, inherited, from }. */
  function aclOf(s, userId) {
    var u = s.users[userId];
    var own = (u.adminCount === 1 ? ADMINSDHOLDER_ACL : DEFAULT_ACL).map(function (a) {
      return { trustee: a.trustee, type: a.type, right: a.right, appliesTo: a.appliesTo, inherited: false, from: a.src };
    });
    var rows = byType(own);
    if (u.adminCount === 1) return rows;                                  // rule 5: inheritance off
    ancestors(u.container).forEach(function (cid) {
      var here = (s.aces[cid] || []).filter(function (a) { return a.appliesTo === 'users'; }).map(function (a) {
        return { trustee: a.trustee, type: a.type, right: a.right, appliesTo: a.appliesTo, inherited: true, from: cid };
      });
      rows = rows.concat(byType(here));
    });
    return rows;
  }
  function byType(list) {
    return list.filter(function (a) { return a.type === 'deny'; }).concat(list.filter(function (a) { return a.type !== 'deny'; }));
  }

  function covers(right, need) { return right === 'full' || right === need; }

  /** Rule 2: walk the ACL in canonical order; the first row that names a SID of the token and covers the right
      decides (a deny refuses, an allow grants). No such row: refused (decider -1). */
  function check(s, userId, action) {
    var need = NEEDS[action], sids = sidsOf(s);
    var rows = aclOf(s, userId).map(function (r) {
      var m = sids.indexOf(r.trustee) >= 0 && covers(r.right, need);
      return Object.assign({}, r, { match: m });
    });
    var decider = -1;
    for (var i = 0; i < rows.length; i++) if (rows[i].match) { decider = i; break; }
    return { user: userId, action: action, need: need, rows: rows, decider: decider, ok: decider >= 0 && rows[decider].type === 'allow' };
  }

  /** Who the panel shows: the user this step tests, or else the target param (reset). */
  function focus(s, p) {
    var e = s.last;
    if (e && e.kind === 'test') return { user: e.user, action: e.action, tested: true };
    return { user: p.target, action: 'reset', tested: false };
  }

  var logic = {
    CONTAINERS: CONTAINERS, USERS: USERS, SCENARIOS: SCENARIOS, TESTER: TESTER, GROUP: GROUP, DA: DA, NEEDS: NEEDS,

    defaults: { scenario: 'delegate-staff', scope: 'staff', target: 'aashdown' },

    /** One step per action: 5 / 4 / 5 / 3 / 4. */
    steps: function (p) { return script(p).length; },

    script: script,
    ancestors: ancestors,
    container: container,
    wizardAces: wizardAces,
    sidsOf: sidsOf,
    aclOf: aclOf,
    check: check,
    focus: focus,

    /** The containers holding a delegated ACE that reaches c (c itself excluded): for the tree's inherited mark. */
    reachedBy: function (s, cid) {
      return ancestors(cid).slice(1).filter(function (a) { return (s.aces[a] || []).some(function (x) { return x.appliesTo === 'users'; }); });
    },

    initial: function (p) {
      var s = {
        aces: {},
        users: {
          eyardley: { container: 'hq', adminCount: 0 },
          aashdown: { container: 'brack', adminCount: 0 },
          afenwick: { container: 'users', adminCount: 0 },
          'tbrennan-adm': { container: 'users', adminCount: 1 },
          administrator: { container: 'users', adminCount: 1 }
        },
        da: ['administrator', 'tbrennan-adm'],
        helpdeskInDA: false,
        sdpropRun: false,
        log: [],
        last: null
      };
      if (p.scenario === 'protected-admin') {           // a new admin account, made in OU=Staff, not yet in DA
        s.users['tbrennan-adm'] = { container: 'staff', adminCount: 0 };
        s.da = ['administrator'];
      }
      if (p.scenario === 'move-user') s.aces[SCOPES[p.scope] || 'staff'] = wizardAces();
      if (p.scenario === 'quillmoor') s.helpdeskInDA = true;
      return s;
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var e = script(p)[n - 1];
      if (!e) return s;
      var rec = { n: n, kind: e.kind };
      if (e.kind === 'wizard') {                                         // rule 1, duplicates not added twice
        var list = s.aces[e.ou] || [];
        var added = wizardAces().filter(function (a) { return !list.some(function (b) { return sameAce(a, b); }); });
        s.aces[e.ou] = list.concat(added);
        rec.ou = e.ou; rec.added = added.length;
      } else if (e.kind === 'move') {                                    // rule 7
        rec.user = e.user; rec.from = s.users[e.user].container; rec.to = e.to;
        s.users[e.user].container = e.to;
      } else if (e.kind === 'daAdd') {                                   // rule 6: adminCount waits for SDProp
        rec.user = e.user;
        if (s.da.indexOf(e.user) < 0) s.da.push(e.user);
      } else if (e.kind === 'daRemoveHelpdesk') {
        s.helpdeskInDA = false;
      } else if (e.kind === 'sdprop') {                                  // rule 5
        rec.stamped = s.da.filter(function (u) { return s.users[u] && s.users[u].adminCount !== 1; });
        s.da.forEach(function (u) { if (s.users[u]) s.users[u].adminCount = 1; });
        s.sdpropRun = true;
      } else if (e.kind === 'test') {                                    // rules 2, 3, 4, 8
        var r = check(s, e.user, e.action);
        rec.user = e.user; rec.action = e.action; rec.ok = r.ok;
        rec.decider = r.decider >= 0 ? r.rows[r.decider] : null;
        s.log.push({ n: n, user: e.user, action: e.action, ok: r.ok });
      }
      s.last = rec;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
