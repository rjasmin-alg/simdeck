/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ad-structure: one sample forest (two trees, three domains), the OU tree of quillmoor.example, two
   sites with their DCs, and three objects that can be moved between containers. The forest is constant data; the
   functions answer what each boundary is for (security, replication, policy) and whether a move is allowed. An
   explorer: initial(params) is the whole model, no steps. Rules and expected results: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FOREST = { id: 'forest', kind: 'forest', name: 'quillmoor.example', rootDomain: 'q' };

  /** Domains in creation order; parent null = a tree root. dc = the DN suffix. */
  var DOMAINS = [
    { id: 'q', kind: 'domain', name: 'quillmoor.example', parent: null, gpos: ['Default Domain Policy', 'Local Admins - Interactive', 'Drive Maps', 'Windows Update - Defer'] },
    { id: 'brk', kind: 'domain', name: 'brk.quillmoor.example', parent: 'q', gpos: ['Default Domain Policy'] },
    { id: 'emb', kind: 'domain', name: 'emberline.example', parent: null, gpos: ['Default Domain Policy'] }
  ];

  /** OUs and CN= containers, parents before children (the order the page draws them). parent = a container id or
      the domain id. users / computers: object counts from the estate (null = not known). */
  var CONTAINERS = [
    { id: 'q-users', kind: 'container', name: 'CN=Users', domain: 'q', parent: 'q', users: 155, computers: 0, gpos: [] },
    { id: 'q-computers', kind: 'container', name: 'CN=Computers', domain: 'q', parent: 'q', users: 0, computers: 159, gpos: [] },
    { id: 'q-quillmoor', kind: 'ou', name: 'OU=Quillmoor', domain: 'q', parent: 'q', users: 0, computers: 0, gpos: [] },
    { id: 'q-staff', kind: 'ou', name: 'OU=Staff', domain: 'q', parent: 'q-quillmoor', users: 0, computers: 0, gpos: [] },
    { id: 'q-hq', kind: 'ou', name: 'OU=HQ', domain: 'q', parent: 'q-staff', users: 21, computers: 0, gpos: [] },
    { id: 'q-brack', kind: 'ou', name: 'OU=Brackenridge', domain: 'q', parent: 'q-staff', users: 44, computers: 0, gpos: [] },
    { id: 'q-ws', kind: 'ou', name: 'OU=Workstations', domain: 'q', parent: 'q-quillmoor', users: 0, computers: 35, gpos: ['Chirp Autostart'] },
    { id: 'q-servers', kind: 'ou', name: 'OU=Servers', domain: 'q', parent: 'q-quillmoor', users: 0, computers: 5, gpos: ['Firewall Off'] },
    { id: 'brk-users', kind: 'container', name: 'CN=Users', domain: 'brk', parent: 'brk', users: null, computers: null, gpos: [] },
    { id: 'brk-computers', kind: 'container', name: 'CN=Computers', domain: 'brk', parent: 'brk', users: null, computers: null, gpos: [] },
    { id: 'emb-users', kind: 'container', name: 'CN=Users', domain: 'emb', parent: 'emb', users: null, computers: null, gpos: [] },
    { id: 'emb-computers', kind: 'container', name: 'CN=Computers', domain: 'emb', parent: 'emb', users: null, computers: null, gpos: [] }
  ];

  var SITES = [
    { id: 'hq', kind: 'site', name: 'HQ', subnets: ['10.10.0.0/16'], gpos: [] },
    { id: 'branch', kind: 'site', name: 'Branch', subnets: ['10.20.0.0/16'], gpos: [] }
  ];
  var SITE_LINKS = [{ id: 'hq-branch', name: 'HQ–Branch', sites: ['hq', 'branch'] }];

  var DCS = [
    { id: 'dc01', kind: 'dc', name: 'DC01', domain: 'q', site: 'hq', gc: true, rodc: false },
    { id: 'rodc01', kind: 'dc', name: 'RODC01', domain: 'q', site: 'branch', gc: false, rodc: true },
    { id: 'brkdc01', kind: 'dc', name: 'BRK-DC01', domain: 'brk', site: 'branch', gc: true, rodc: false },
    { id: 'embdc01', kind: 'dc', name: 'EMB-DC01', domain: 'emb', site: 'hq', gc: true, rodc: false }
  ];

  /** The three objects the student moves; home = where a new object of that kind is created. */
  var OBJECTS = [
    { id: 'ana', kind: 'user', name: 'ana', domain: 'q', home: 'q-users' },
    { id: 'pc07', kind: 'computer', name: 'PC07', domain: 'q', home: 'q-computers' },
    { id: 'gprojects', kind: 'group', name: 'G-Projects', domain: 'q', home: 'q-users' }
  ];

  var LENSES = ['none', 'security', 'replication', 'policy'];

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /** Any box of the scene by id (the forest, a tree, a domain, a container, a site, a DC or an object). */
  function node(id) {
    if (id === FOREST.id) return FOREST;
    var tr = byId(trees(), id);
    if (tr) return tr;
    return byId(DOMAINS, id) || byId(CONTAINERS, id) || byId(SITES, id) || byId(DCS, id) || byId(OBJECTS, id);
  }
  function kindOf(id) { var n = node(id); return n ? n.kind : null; }
  function domain(id) { return byId(DOMAINS, id); }

  /** The domain a box belongs to (null for the forest, trees and sites). */
  function domainOf(id) {
    var n = node(id);
    if (!n) return null;
    if (n.kind === 'domain') return n.id;
    return n.domain || null;
  }

  // ── rule 3: trees and trusts ──

  /** True when child's DNS name is one label plus parent's name (a contiguous namespace). */
  function isContiguous(childName, parentName) {
    var rest = childName.slice(0, childName.length - parentName.length);
    return childName.length > parentName.length && childName.slice(-parentName.length - 1) === '.' + parentName &&
      rest.length > 1 && rest.slice(0, -1).indexOf('.') < 0;
  }
  function treeRootOf(d) {
    var x = domain(d);
    while (x && x.parent) x = domain(x.parent);
    return x ? x.id : null;
  }
  /** The trees, in domain order: { id: 'tree-<root>', root, name, domains[] }. */
  function trees() {
    var out = [];
    DOMAINS.forEach(function (d) {
      var r = treeRootOf(d.id);
      var tr = byId(out, 'tree-' + r);
      if (!tr) { tr = { id: 'tree-' + r, kind: 'tree', root: r, name: domain(r).name, domains: [] }; out.push(tr); }
      tr.domains.push(d.id);
    });
    return out;
  }
  /** Trusts that come with the forest: parent–child for every child domain, tree-root for every other tree root.
      All two-way and transitive. */
  function trusts() {
    var out = [];
    DOMAINS.forEach(function (d) {
      if (d.parent) out.push({ a: d.parent, b: d.id, kind: 'parent-child', twoWay: true, transitive: true });
      else if (d.id !== FOREST.rootDomain) out.push({ a: FOREST.rootDomain, b: d.id, kind: 'tree-root', twoWay: true, transitive: true });
    });
    return out;
  }
  /** Trust path from domain a to domain b (breadth first; the forest's trusts form a tree, so it is the only one). */
  function trustPath(a, b) {
    if (!domain(a) || !domain(b)) return null;
    var prev = {}, seen = {}, queue = [a];
    seen[a] = true;
    while (queue.length) {
      var x = queue.shift();
      if (x === b) break;
      trusts().forEach(function (t) {
        var y = t.a === x ? t.b : t.b === x ? t.a : null;
        if (y && !seen[y]) { seen[y] = true; prev[y] = x; queue.push(y); }
      });
    }
    if (!seen[b]) return null;
    var path = [b];
    while (path[0] !== a) path.unshift(prev[path[0]]);
    return path;
  }

  // ── rule 1: security ──

  function securityBoundary() { return FOREST.id; }
  /** The domains an admin group has rights in: 'enterprise-admins' (forest root domain) → every domain;
      'schema-admins' → the schema only (no domain); 'domain-admins:<d>' → [d]. */
  function reach(group) {
    if (group === 'enterprise-admins') return DOMAINS.map(function (d) { return d.id; });
    if (group === 'schema-admins') return [];
    var m = /^domain-admins:(.+)$/.exec(group || '');
    return m && domain(m[1]) ? [m[1]] : [];
  }

  // ── rule 2: replication ──

  /** Which DCs hold a partition: 'schema', 'config' or 'domain:<d>'. [{ dc, copy: 'full' | 'partial', readOnly }]
      in DC order. */
  function replicas(partition) {
    var out = [];
    var m = /^domain:(.+)$/.exec(partition || '');
    if (partition === 'schema' || partition === 'config') {
      DCS.forEach(function (x) { out.push({ dc: x.id, copy: 'full', readOnly: x.rodc }); });
    } else if (m && domain(m[1])) {
      DCS.forEach(function (x) {
        if (x.domain === m[1]) out.push({ dc: x.id, copy: 'full', readOnly: x.rodc });
        else if (x.gc) out.push({ dc: x.id, copy: 'partial', readOnly: true });
      });
    }
    return out;
  }
  /** The partitions a DC holds, as [{ partition, copy, readOnly }]: schema, config, own domain, then GC copies. */
  function partitionsOn(dcId) {
    var out = [];
    ['schema', 'config'].concat(DOMAINS.map(function (d) { return 'domain:' + d.id; })).forEach(function (p) {
      replicas(p).forEach(function (r) { if (r.dc === dcId) out.push({ partition: p, copy: r.copy, readOnly: r.readOnly }); });
    });
    return out;
  }
  /** The one domain password policy comes from the domain's own Default Domain Policy. */
  function passwordPolicy(d) { return domain(d) ? { domain: d, gpo: 'Default Domain Policy' } : null; }

  // ── rule 4, 5: policy ──

  function isPrincipal(id) { var k = kindOf(id); return k === 'user' || k === 'computer' || k === 'group' || k === 'dc'; }
  /** Group Policy applies to users and computers only; a group receives none (it can only filter a GPO). */
  function receivesGpo(id) { var k = kindOf(id); return k === 'user' || k === 'computer'; }
  function canLinkGpo(id) { var k = kindOf(id); return k === 'site' || k === 'domain' || k === 'ou'; }
  function gpoLinks(id) { var n = node(id); return n && canLinkGpo(id) ? n.gpos.slice() : []; }

  /** From the domain down to the container: [domainId, ..., containerId]. */
  function pathOf(containerId) {
    var out = [];
    var x = byId(CONTAINERS, containerId);
    while (x) { out.unshift(x.id); x = byId(CONTAINERS, x.parent); }
    var c = byId(CONTAINERS, containerId);
    if (c) out.unshift(c.domain);
    return out;
  }
  /** GPOs linked in the scope of an object in a container: the domain, then each OU top-down. Containers add
      nothing (rule 5). The site is not on this path: a computer's site comes from its subnet, not from the
      directory tree, and no GPO is linked to a site in this scene. [{ at, gpo }]. */
  function gposInScope(containerId) {
    var out = [];
    pathOf(containerId).forEach(function (id) { gpoLinks(id).forEach(function (g) { out.push({ at: id, gpo: g }); }); });
    return out;
  }
  /** The object's distinguished name in a container: CN=<name>,<container path bottom-up>,DC=..,DC=.. */
  function dn(objId, containerId) {
    var o = byId(OBJECTS, objId);
    var path = pathOf(containerId);
    if (!o || !path.length) return null;
    var parts = ['CN=' + o.name];
    for (var i = path.length - 1; i >= 1; i--) parts.push(byId(CONTAINERS, path[i]).name);
    domain(path[0]).name.split('.').forEach(function (l) { parts.push('DC=' + l); });
    return parts.join(',');
  }

  // ── rule 6: one parent ──

  /** Try to put an object in a target box. Returns { ok, reason, same, placed } with a new placed map. */
  function tryPlace(placed, objId, target) {
    var o = byId(OBJECTS, objId);
    var out = { ok: false, reason: null, same: false, placed: Object.assign({}, placed) };
    if (!o || !node(target)) { out.reason = 'unknown'; return out; }
    var k = kindOf(target);
    if (k === 'site') { out.reason = 'site'; return out; }
    if (k !== 'ou' && k !== 'container') { out.reason = 'not-container'; return out; }
    if (domainOf(target) !== o.domain) { out.reason = 'other-domain'; return out; }
    out.ok = true;
    out.same = placed[objId] === target;
    out.placed[objId] = target;
    return out;
  }

  // ── lenses ──

  /** What a lens lights up: { mode, nodes: lit box ids, grey: greyed box ids }. */
  function lensOf(lens) {
    var out = { mode: LENSES.indexOf(lens) >= 0 ? lens : 'none', nodes: [], grey: [] };
    if (out.mode === 'security') out.nodes = [securityBoundary()];
    else if (out.mode === 'replication') out.nodes = [FOREST.id].concat(DOMAINS.map(function (d) { return d.id; }));
    else if (out.mode === 'policy') {
      SITES.concat(DOMAINS, CONTAINERS).forEach(function (x) {
        if (canLinkGpo(x.id)) out.nodes.push(x.id);
        else out.grey.push(x.id);
      });
    }
    return out;
  }

  /** Every box id the page can select, in drawing order. */
  function allIds() {
    return [FOREST.id].concat(trees().map(function (t) { return t.id; }), DOMAINS.map(function (d) { return d.id; }),
      CONTAINERS.map(function (c) { return c.id; }), SITES.map(function (s) { return s.id; }),
      DCS.map(function (d) { return d.id; }), OBJECTS.map(function (o) { return o.id; }));
  }

  /** A placement param is valid when it names an OU or container of the object's own domain. */
  function validHome(o, id) {
    var c = byId(CONTAINERS, id);
    return c && c.domain === o.domain ? id : o.home;
  }

  var logic = {
    defaults: { lens: 'none', sel: '', held: '', ana: 'q-users', pc07: 'q-computers', gprojects: 'q-users', last: '' },

    presets: [
      { id: 'security', params: { lens: 'security', sel: 'forest' } },
      { id: 'replication', params: { lens: 'replication', sel: 'forest' } },
      { id: 'policy', params: { lens: 'policy', sel: 'q-users' } },
      { id: 'quillmoor-as-is', params: { lens: 'none', sel: 'ana' } }
    ],

    /** The whole model for a set of params (SPEC §3). */
    initial: function (p) {
      var placed = {};
      OBJECTS.forEach(function (o) { placed[o.id] = validHome(o, p[o.id]); });
      var attempt = null;
      var m = /^([^>]+)>(.+)$/.exec(p.last || '');
      if (m && byId(OBJECTS, m[1])) {
        var r = tryPlace(placed, m[1], m[2]);
        // A successful attempt is already in the placement params; one that does not match them is stale.
        if (!r.ok || placed[m[1]] === m[2]) attempt = { obj: m[1], target: m[2], ok: r.ok, reason: r.reason };
      }
      var dns = {}, gpos = {};
      OBJECTS.forEach(function (o) { dns[o.id] = dn(o.id, placed[o.id]); gpos[o.id] = receivesGpo(o.id) ? gposInScope(placed[o.id]) : []; });
      return {
        lens: LENSES.indexOf(p.lens) >= 0 ? p.lens : 'none',
        selected: node(p.sel) ? p.sel : null,
        held: byId(OBJECTS, p.held) ? p.held : null,
        placed: placed,
        attempt: attempt,
        dn: dns,
        gpos: gpos,
        lit: lensOf(p.lens)
      };
    },

    FOREST: FOREST, DOMAINS: DOMAINS, CONTAINERS: CONTAINERS, SITES: SITES, SITE_LINKS: SITE_LINKS, DCS: DCS,
    OBJECTS: OBJECTS, LENSES: LENSES,
    node: node, kindOf: kindOf, domainOf: domainOf, allIds: allIds,
    isContiguous: isContiguous, trees: trees, trusts: trusts, trustPath: trustPath,
    securityBoundary: securityBoundary, reach: reach,
    replicas: replicas, partitionsOn: partitionsOn, passwordPolicy: passwordPolicy,
    isPrincipal: isPrincipal, receivesGpo: receivesGpo, canLinkGpo: canLinkGpo, gpoLinks: gpoLinks, pathOf: pathOf, gposInScope: gposInScope, dn: dn,
    tryPlace: tryPlace, lensOf: lensOf,

    /** Rule 7: the domains with a DC in a site, and the sites a domain has DCs in (DC order). */
    domainsInSite: function (site) {
      var out = [];
      DCS.forEach(function (x) { if (x.site === site && out.indexOf(x.domain) < 0) out.push(x.domain); });
      return out;
    },
    sitesOfDomain: function (d) {
      var out = [];
      DCS.forEach(function (x) { if (x.domain === d && out.indexOf(x.site) < 0) out.push(x.site); });
      return out;
    },
    /** The objects currently in a container, in object order. */
    objectsIn: function (placed, containerId) {
      return OBJECTS.filter(function (o) { return placed[o.id] === containerId; }).map(function (o) { return o.id; });
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
