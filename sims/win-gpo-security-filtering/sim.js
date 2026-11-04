/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-security-filtering: who one GPO applies to. The GPO "Sales Drive Maps" (user settings) is linked
   to OU=Staff; its delegation list (principal, Read, Apply Group Policy, allow or deny) and an optional WMI filter
   decide, per user logging on to PC07, along one decision path: in scope by link → the computer can read → the user
   has Read and Apply → no deny → WMI true → applied, or filtered with the reason the client's report gives.
   One step is the admin's change (when the params make one) or one target. Rules and sources: SPEC.md.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. decide(), effective() and keepOrder() take any scene, so they can move
   to models/ unchanged. */
(function (root) {
  'use strict';

  var AU = 'Authenticated Users', DC = 'Domain Computers', DA = 'Domain Admins';

  /** The default delegation of a new GPO (SPEC.md, "Scene"). */
  function defaultAcl() {
    return [
      { principal: AU, read: true, apply: true, deny: false },
      { principal: DA, read: true, apply: false, deny: false }
    ];
  }

  /** The delegation list the params ask for. */
  function aclOf(p) {
    var acl = defaultAcl();
    if (p.aclMode === 'sales' || p.aclMode === 'sales-dc') {
      acl = acl.filter(function (a) { return a.principal !== AU; });
      acl.push({ principal: 'Sales', read: true, apply: true, deny: false });
      if (p.aclMode === 'sales-dc') acl.push({ principal: DC, read: true, apply: false, deny: false });
    }
    if (p.denyManagers) acl.push({ principal: 'Managers', read: false, apply: true, deny: true });
    return acl;
  }

  var LAPTOPS = { name: 'Laptops only', query: 'SELECT * FROM Win32_SystemEnclosure WHERE ChassisTypes = 9 OR ChassisTypes = 10', chassis: [9, 10] };

  /** The computer: its groups in the directory, and the groups in its token (built at startup, rule 7). */
  function pcOf(p) {
    return { name: 'PC07', chassis: p.pc07Laptop ? 9 : 3, groups: [DC], bootGroups: [DC] };
  }

  var USERS = [
    { name: 'ana', ou: 'OU=Staff', groups: ['Sales'] },
    { name: 'eyardley', ou: 'OU=Staff', groups: [] },
    { name: 'boss', ou: 'OU=Staff', groups: ['Sales', 'Managers'] }
  ];

  /** Rule 7: a reboot builds the computer's token from its groups now. */
  function restart(pc) { return Object.assign({}, pc, { bootGroups: pc.groups.slice() }); }

  function pcToken(pc) { return [pc.name + '$', 'Everyone', AU].concat(pc.bootGroups); }
  function userToken(u) { return [u.name, 'Everyone', AU, 'Domain Users'].concat(u.groups); }

  /**
   * What the delegation list gives a token for one right ('read' | 'apply'): the principals of the matching allow
   * entries and of the matching deny entries.
   */
  function effective(acl, token, right) {
    var allow = [], deny = [];
    acl.forEach(function (a) {
      if (!a[right] || token.indexOf(a.principal) < 0) return;
      (a.deny ? deny : allow).push(a.principal);
    });
    return { allow: allow, deny: deny };
  }

  function uniq(xs) { return xs.filter(function (x, i) { return xs.indexOf(x) === i; }); }

  /** Is the user's OU the link's OU or below it? (distinguished names, child first) */
  function inScope(link, ou) { return ou === link || ou.slice(-(link.length + 1)) === ',' + link; }

  /** WMI filter result on the computer (rule 5): true when there is no filter. */
  function wmiTrue(wmi, pc) { return !wmi || wmi.chassis.indexOf(pc.chassis) >= 0; }

  /**
   * The decision path for one user on one computer (SPEC.md, "Decision path"). Each check: { id, pass, via } where
   * pass is true, false, or null (not reached) and via lists the principals that decided it. Returns
   * { path, applied, reason, alsoWmi, userOk } with reason null | scope | inaccessible | security | wmi; alsoWmi says that the
   * WMI filter would be false too when security stopped first (rule 8).
   */
  function decide(gpo, pc, user) {
    var acl = gpo.acl, pt = pcToken(pc), ut = userToken(user);
    var pcRead = effective(acl, pt, 'read');
    var uRead = effective(acl, ut, 'read'), uApply = effective(acl, ut, 'apply');
    var checks = [
      { id: 'scope', pass: inScope(gpo.link, user.ou), via: [gpo.link], reason: 'scope' },
      { id: 'pcRead', pass: pcRead.allow.length > 0 && pcRead.deny.length === 0,
        via: pcRead.deny.length ? pcRead.deny : pcRead.allow, reason: 'inaccessible' },
      { id: 'allow', pass: uRead.allow.length > 0 && uApply.allow.length > 0,
        via: uniq(uRead.allow.concat(uApply.allow)), reason: 'security' },
      { id: 'deny', pass: uRead.deny.length === 0 && uApply.deny.length === 0, via: uniq(uRead.deny.concat(uApply.deny)), reason: 'security' },
      { id: 'wmi', pass: wmiTrue(gpo.wmi, pc), via: gpo.wmi ? [gpo.wmi.name] : [], reason: 'wmi' }
    ];
    var stop = -1;
    checks.forEach(function (c, i) { if (stop < 0 && !c.pass) stop = i; });
    var path = checks.map(function (c, i) {
      return { id: c.id, pass: stop >= 0 && i > stop ? null : c.pass, via: c.via };
    });
    return {
      path: path,
      applied: stop < 0,
      reason: stop < 0 ? null : checks[stop].reason,
      alsoWmi: stop >= 0 && checks[stop].reason !== 'wmi' && !wmiTrue(gpo.wmi, pc),
      userOk: checks[2].pass && checks[3].pass      // the user's own rights would pass (the computer check aside)
    };
  }

  /** Rule 6: filtering removes GPOs from an ordered list; the rest keep their order. */
  function keepOrder(list, applies) { return list.filter(function (g) { return applies(g); }); }

  /** Does the delegation or WMI filter for these params differ from the default GPO? */
  function hasChange(p) { return p.aclMode !== 'default' || !!p.denyManagers || p.wmi !== 'none'; }

  /** Rows of the delegation table: the current list, plus removed rows kept (status kept | added | removed). */
  function rowsOf(before, after) {
    var key = function (a) { return a.principal + (a.deny ? '/deny' : ''); };
    var afterKeys = after.map(key), beforeKeys = before.map(key);
    var rows = before.map(function (a) {
      return Object.assign({}, a, { status: afterKeys.indexOf(key(a)) >= 0 ? 'kept' : 'removed' });
    });
    after.forEach(function (a) { if (beforeKeys.indexOf(key(a)) < 0) rows.push(Object.assign({}, a, { status: 'added' })); });
    return rows;
  }

  function gpoOf(acl, wmi) { return { name: 'Sales Drive Maps', link: 'OU=Staff', acl: acl, wmi: wmi }; }

  var logic = {
    defaults: { aclMode: 'default', denyManagers: false, wmi: 'none', pc07Laptop: false },

    presets: [
      { id: 'default', params: {} },
      { id: 'sales-only-broken', params: { aclMode: 'sales' } },
      { id: 'sales-fixed', params: { aclMode: 'sales-dc' } },
      { id: 'deny-managers', params: { aclMode: 'sales-dc', denyManagers: true } },
      { id: 'wmi-laptops', params: { wmi: 'laptops' } }
    ],

    /** Steps for these params: the admin's change (if any), then one per user (3 or 4). */
    steps: function (p) { return USERS.length + (hasChange(p) ? 1 : 0); },

    initial: function (p) {
      var acl = defaultAcl();
      return {
        changed: false,                     // the admin's change is made
        rows: rowsOf(acl, acl),
        wmi: null,
        pc: pcOf(p),
        targets: USERS.map(function (u) { return u.name; }),
        cursor: -1,                         // the user evaluated in this step (-1: none)
        results: {},                        // user → decide()
        event: null                         // admin | target
      };
    },

    step: function (s, n, p) {
      var admin = hasChange(p);
      if (admin && n === 1) {
        var after = aclOf(p);
        return Object.assign({}, s, {
          changed: true, rows: rowsOf(defaultAcl(), after), wmi: p.wmi === 'laptops' ? LAPTOPS : null,
          cursor: -1, event: 'admin'
        });
      }
      var k = n - 1 - (admin ? 1 : 0);
      var u = USERS[k];
      var gpo = gpoOf(s.rows.filter(function (r) { return r.status !== 'removed'; }).map(function (r) {
        return { principal: r.principal, read: r.read, apply: r.apply, deny: r.deny };
      }), s.wmi);
      var results = Object.assign({}, s.results);
      results[u.name] = decide(gpo, s.pc, u);
      return Object.assign({}, s, { cursor: k, results: results, event: 'target' });
    },

    USERS: USERS,
    LAPTOPS: LAPTOPS,
    CHECKS: ['scope', 'pcRead', 'allow', 'deny', 'wmi'],
    defaultAcl: defaultAcl,
    aclOf: aclOf,
    pcOf: pcOf,
    pcToken: pcToken,
    userToken: userToken,
    restart: restart,
    effective: effective,
    decide: decide,
    gpoOf: gpoOf,
    keepOrder: keepOrder,
    hasChange: hasChange,
    rowsOf: rowsOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
