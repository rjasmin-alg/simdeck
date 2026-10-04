/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-group-scopes: two domains of one forest, users and groups of three scopes (global, domain local,
   universal), "is member of" edges and a share's ACL. Every edge and ACE is checked against the group scope table,
   and a user's access is the union of the valid ACEs reached along valid edges. An explorer: initial(params) is the
   whole model, no steps. Rules and expected results: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var RES_DOMAIN = 'quillmoor';
  var DOMAINS = { quillmoor: 'quillmoor.example', brk: 'brk.quillmoor.example' };
  var SCOPES = ['G', 'DL', 'U'];
  var USERS = [
    { id: 'ana', name: 'ana', domain: 'brk', kind: 'user' },
    { id: 'ivo', name: 'ivo', domain: 'quillmoor', kind: 'user' }
  ];

  /** The scene for a set of params (SPEC §1). */
  function scene(p) {
    var scopeA = SCOPES.indexOf(p.scopeA) >= 0 ? p.scopeA : 'G';
    var scopeB = SCOPES.indexOf(p.scopeB) >= 0 ? p.scopeB : 'DL';
    var domainB = p.bInBrk ? 'brk' : RES_DOMAIN;
    var testUser = p.userDomain === 'quillmoor' ? 'ivo' : 'ana';
    var groups = [
      { id: 'A', name: scopeA + '-Projects', domain: 'brk', scope: scopeA },
      { id: 'B', name: scopeB + '-Projects-Modify', domain: domainB, scope: scopeB }
    ];
    var members;
    if (p.viaU) {
      groups.push({ id: 'C', name: 'G-Projects-HQ', domain: 'quillmoor', scope: 'G' },
        { id: 'U', name: 'U-Projects', domain: 'quillmoor', scope: 'U' });
      members = [['ana', 'A'], ['ivo', 'C'], ['A', 'U'], ['C', 'U'], ['U', 'B']];
    } else {
      members = [['ana', 'A']];
      if (testUser === 'ivo') members.push(['ivo', 'A']);
    }
    if (p.aInB) members.push(['A', 'B']);
    groups.push({ id: 'DA', name: 'Domain Admins', domain: 'quillmoor', scope: 'G' });
    var principal = p.aclPrincipal === 'A' ? 'A' : p.aclPrincipal === 'user' ? testUser : 'B';
    return {
      users: USERS.map(function (u) { return Object.assign({}, u); }),
      groups: groups,
      members: members,
      acl: [{ principal: 'DA', right: 'full' }, { principal: principal, right: 'modify' }],
      testUser: testUser
    };
  }

  /** The first user or group with this id (SPEC rule 10), or null. */
  function find(sc, id) {
    var all = sc.users.concat(sc.groups);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function scopeOf(x) { return x.kind === 'user' ? 'account' : x.scope; }

  /** May child be a member of parent? (SPEC rule 4) → { valid, reason } */
  function edgeCheck(child, parent) {
    if (!child || !parent || parent.kind === 'user') return { valid: false, reason: 'unknown' };
    if (child === parent) return { valid: false, reason: 'self' };
    var c = scopeOf(child), sameDomain = child.domain === parent.domain;
    if (c === 'DL' && parent.scope !== 'DL') return { valid: false, reason: 'dl-only-in-dl' };
    if (c === 'DL' && !sameDomain) return { valid: false, reason: 'dl-own-domain' };
    if (parent.scope === 'G' && c === 'U') return { valid: false, reason: 'g-members' };
    if (parent.scope === 'G' && !sameDomain) return { valid: false, reason: 'g-own-domain' };
    return { valid: true, reason: null };
  }

  /** May this principal be on an ACL in resDomain? (SPEC rule 5) */
  function aceCheck(principal, resDomain) {
    if (!principal) return { valid: false, reason: 'unknown' };
    if (principal.kind !== 'user' && principal.scope === 'DL' && principal.domain !== resDomain) return { valid: false, reason: 'dl-foreign-acl' };
    return { valid: true, reason: null };
  }

  /** Edges, deduplicated (first kept), each with its verdict. */
  function edgesOf(sc) {
    var seen = {}, out = [];
    sc.members.forEach(function (m) {
      var key = m[0] + '>' + m[1];
      if (seen[key]) return;
      seen[key] = true;
      var v = edgeCheck(find(sc, m[0]), find(sc, m[1]));
      out.push({ child: m[0], parent: m[1], valid: v.valid, reason: v.reason });
    });
    return out;
  }

  /** Shortest valid chain from the user to every group it reaches (SPEC rule 8): { id: [user, ..., id] }. */
  function chainsFrom(edges, userId) {
    var paths = {};
    paths[userId] = [userId];
    var queue = [userId];
    while (queue.length) {
      var cur = queue.shift();
      edges.forEach(function (e) {
        if (e.valid && e.child === cur && !paths[e.parent]) {
          paths[e.parent] = paths[cur].concat(e.parent);
          queue.push(e.parent);
        }
      });
    }
    return paths;
  }

  function labelOf(sc, path) {
    var scopes = path.slice(1).map(function (id) { return find(sc, id).scope; }).join(',');
    if (scopes === 'G,DL') return 'agdlp';
    if (scopes === 'G,U,DL') return 'agudlp';
    return 'other';
  }

  /** Access of one user (SPEC rules 7–9). */
  function accessOf(sc, edges, aces, userId) {
    var paths = chainsFrom(edges, userId);
    var rights = [], best = -1;
    aces.forEach(function (a, i) {
      if (!a.valid || !paths[a.principal]) return;
      if (rights.indexOf(a.right) < 0) rights.push(a.right);
      if (best < 0 || paths[a.principal].length < paths[aces[best].principal].length) best = i;
    });
    if (best < 0) return { granted: false, rights: [], ace: null, path: null, hops: null, label: null, reached: Object.keys(paths) };
    var path = paths[aces[best].principal];
    return { granted: true, rights: rights, ace: best, path: path, hops: path.length, label: labelOf(sc, path), reached: Object.keys(paths) };
  }

  /** Everything derived from a scene. */
  function evaluate(sc) {
    var edges = edgesOf(sc);
    var aces = sc.acl.map(function (a) {
      var v = aceCheck(find(sc, a.principal), RES_DOMAIN);
      return { principal: a.principal, right: a.right, valid: v.valid, reason: v.reason };
    });
    var access = {};
    sc.users.forEach(function (u) { if (!access[u.id]) access[u.id] = accessOf(sc, edges, aces, u.id); });
    return { edges: edges, aces: aces, access: access };
  }

  var logic = {
    defaults: { scopeA: 'G', scopeB: 'DL', bInBrk: false, aInB: true, userDomain: 'brk', aclPrincipal: 'B', viaU: false, tested: false },

    RES_DOMAIN: RES_DOMAIN,
    DOMAINS: DOMAINS,
    SCOPES: SCOPES,

    presets: [
      { id: 'agdlp', params: { scopeA: 'G', scopeB: 'DL', bInBrk: false, aInB: true, userDomain: 'brk', aclPrincipal: 'B', viaU: false, tested: true } },
      { id: 'global-cross-domain-member', params: { scopeA: 'G', scopeB: 'DL', bInBrk: false, aInB: true, userDomain: 'quillmoor', aclPrincipal: 'B', viaU: false, tested: true } },
      { id: 'dl-on-foreign-acl', params: { scopeA: 'G', scopeB: 'DL', bInBrk: true, aInB: true, userDomain: 'brk', aclPrincipal: 'B', viaU: false, tested: true } },
      { id: 'dl-into-global', params: { scopeA: 'DL', scopeB: 'G', bInBrk: false, aInB: true, userDomain: 'brk', aclPrincipal: 'B', viaU: false, tested: true } },
      { id: 'agudlp', params: { scopeA: 'G', scopeB: 'DL', bInBrk: false, aInB: false, userDomain: 'brk', aclPrincipal: 'B', viaU: true, tested: true } }
    ],

    initial: function (p) {
      var sc = scene(p);
      var ev = evaluate(sc);
      return {
        resDomain: RES_DOMAIN,
        users: sc.users,
        groups: sc.groups,
        members: sc.members,
        acl: sc.acl,
        testUser: sc.testUser,
        tested: !!p.tested,
        edges: ev.edges,
        aces: ev.aces,
        access: ev.access
      };
    },

    scene: scene,
    evaluate: evaluate,
    edgeCheck: edgeCheck,
    aceCheck: aceCheck,
    chainsFrom: chainsFrom,
    find: find,

    /** What changed between two states (the page's "changed" mark): group ids whose scope or domain changed or that
        are new, edge keys that are new or changed verdict, and whether the tested user's result changed. */
    changes: function (a, b) {
      var out = { groups: [], edges: [], access: false };
      if (!a || !b) return out;
      b.groups.forEach(function (g) {
        var o = a.groups.filter(function (x) { return x.id === g.id; })[0];
        if (!o || o.scope !== g.scope || o.domain !== g.domain) out.groups.push(g.id);
      });
      b.edges.forEach(function (e) {
        var o = a.edges.filter(function (x) { return x.child === e.child && x.parent === e.parent; })[0];
        if (!o || o.valid !== e.valid) out.edges.push(e.child + '>' + e.parent);
      });
      var ra = a.access[a.testUser], rb = b.access[b.testUser];
      out.access = a.testUser !== b.testUser || a.tested !== b.tested ||
        JSON.stringify([ra.granted, ra.rights, ra.path]) !== JSON.stringify([rb.granted, rb.rights, rb.path]);
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
