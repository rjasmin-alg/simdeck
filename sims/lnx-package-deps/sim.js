/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-package-deps: a package manager installs or removes one package. The resolver takes one
   capability at a time from its work list: satisfied by an installed or planned package, or a provider chosen
   from the enabled repositories (tie-break, conflicts), whose own Requires join the list. Then the summary, the
   order and the execution. Rules, their order and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The resolver functions (providers, rank,
   conflictsWith, depthOrder, vercmp) work on plain data and are promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── packages (SPEC.md, Data) ──

  function pkg(name, ver, provides, requires, conflicts) {
    return { name: name, ver: ver, provides: [name].concat(provides || []), requires: requires || [], conflicts: conflicts || [] };
  }
  var P = {
    htop: pkg('htop', '3.3.0-5.el10_0', [], ['libhwloc.so.15']),
    'hwloc-libs': pkg('hwloc-libs', '2.11.1-4.el10', ['libhwloc.so.15'], ['libOpenCL.so.1']),
    'ocl-icd': pkg('ocl-icd', '2.3.2-8.el10', ['libOpenCL.so.1']),
    hwloc: pkg('hwloc', '2.11.1-4.el10', [], ['libhwloc.so.15']),
    tmux: pkg('tmux', '3.3a-13.el10', [], ['libevent_core-2.1.so.7', 'libtinfo.so.6']),
    libevent: pkg('libevent', '2.1.12-16.el10', ['libevent_core-2.1.so.7']),
    'ncurses-libs': pkg('ncurses-libs', '6.4-14.el10', ['libtinfo.so.6', 'libncursesw.so.6']),
    glibc: pkg('glibc', '2.39-37.el10', ['libc.so.6']),
    'mta-a': pkg('mta-a', '1.0-1', ['mail-transport'], [], ['mta-b']),
    'mta-b': pkg('mta-b', '2.0-1', ['mail-transport'], [], ['mta-a'])
  };
  var PRIORITY = { baseos: 99, epel: 99 };
  var BASE = ['glibc', 'ncurses-libs', 'libevent'];

  function inst(name, from, reason) { return Object.assign(clone(P[name]), { from: from, reason: reason }); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** The requests (the `request` param) and their scenes: which packages each repo shows, what is installed. */
  var REQUESTS = {
    'install-htop': { op: 'install', name: 'htop', repos: { baseos: ['hwloc-libs', 'ocl-icd', 'hwloc'], epel: ['htop'] }, epelNew: true },
    'remove-htop': { op: 'remove', name: 'htop', repos: { baseos: ['hwloc-libs', 'ocl-icd', 'hwloc'], epel: ['htop'] }, htopInstalled: true },
    'install-tmux': { op: 'install', name: 'tmux', repos: { baseos: ['tmux', 'libevent', 'ncurses-libs'], epel: ['htop'] } },
    'install-mta-b': { op: 'install', name: 'mta-b', repos: { baseos: ['mta-a', 'mta-b'], epel: ['htop'] }, mta: true }
  };
  var REQUEST_IDS = Object.keys(REQUESTS);

  /** The page's presets, in key order (1–6). */
  var PRESETS = [
    { id: 'htop-epel', params: { request: 'install-htop', epel: true, keepLibs: false } },
    { id: 'already-there', params: { request: 'install-tmux', epel: true, keepLibs: false } },
    { id: 'epel-off', params: { request: 'install-htop', epel: false, keepLibs: false } },
    { id: 'remove-htop', params: { request: 'remove-htop', epel: true, keepLibs: false } },
    { id: 'remove-kept', params: { request: 'remove-htop', epel: true, keepLibs: true } },
    { id: 'conflict', params: { request: 'install-mta-b', epel: true, keepLibs: false } }
  ];

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    return {
      request: REQUESTS[p.request] ? p.request : d.request,
      epel: p.epel === undefined ? d.epel : !!p.epel,
      keepLibs: p.keepLibs === undefined ? d.keepLibs : !!p.keepLibs
    };
  }

  // ── resolver functions (pure, promotable) ──

  /** rpm-style version comparison: segments of digits compare as numbers, letters as strings; -1, 0, 1. */
  function vercmp(a, b) {
    var sa = String(a).match(/\d+|[a-zA-Z]+/g) || [], sb = String(b).match(/\d+|[a-zA-Z]+/g) || [];
    for (var i = 0; i < Math.max(sa.length, sb.length); i++) {
      var x = sa[i], y = sb[i];
      if (x === undefined) return -1;
      if (y === undefined) return 1;
      var nx = /^\d/.test(x), ny = /^\d/.test(y);
      if (nx && ny) { var d = parseInt(x, 10) - parseInt(y, 10); if (d) return d > 0 ? 1 : -1; }
      else if (nx !== ny) return nx ? 1 : -1; // rpm: a number segment is newer than a letter segment
      else if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  /** Packages in `list` that provide cap (rule 1). */
  function providers(list, cap) { return list.filter(function (p) { return p.provides.indexOf(cap) >= 0; }); }

  /** Rule 5: does a conflict with b, in either direction? */
  function conflictsWith(a, b) {
    if (a.name === b.name) return false;
    function hits(x, y) { return x.conflicts.some(function (c) { return y.provides.indexOf(c) >= 0; }); }
    return hits(a, b) || hits(b, a);
  }

  /** Rule 4: candidates ({ pkg, repo, priority, installed }) in preference order, a new array. The keys are
      returned with each so the page and tests can say which one decided. */
  function rank(cands, cap) {
    var keyed = cands.map(function (c, i) { return { c: c, i: i }; });
    keyed.sort(function (x, y) {
      var a = x.c, b = y.c;
      if (!!a.installed !== !!b.installed) return a.installed ? -1 : 1;           // (a) installed
      if (a.priority !== b.priority) return a.priority - b.priority;              // (b) lowest priority value
      var na = a.pkg.name === cap, nb = b.pkg.name === cap;
      if (na !== nb) return na ? -1 : 1;                                          // (c) name equals capability
      var v = vercmp(b.pkg.ver, a.pkg.ver); if (v) return v;                      // (d) highest version
      if (a.pkg.name !== b.pkg.name) return a.pkg.name < b.pkg.name ? -1 : 1;     // (e) name
      return x.i - y.i;
    });
    return keyed.map(function (k) { return k.c; });
  }

  /** Which tie-break key separated the first two ranked candidates: 'installed' | 'priority' | 'name' |
      'version' | 'alpha' | null (one candidate). */
  function decidingKey(ranked, cap) {
    if (ranked.length < 2) return null;
    var a = ranked[0], b = ranked[1];
    if (!!a.installed !== !!b.installed) return 'installed';
    if (a.priority !== b.priority) return 'priority';
    if ((a.pkg.name === cap) !== (b.pkg.name === cap)) return 'name';
    if (vercmp(a.pkg.ver, b.pkg.ver)) return 'version';
    return 'alpha';
  }

  /** Rule 6: depth order over pkgs (each with requires/provides), ties in list order. reverse for erasing. */
  function depthOrder(pkgs, reverse) {
    var memo = {};
    function depth(p, seen) {
      if (memo[p.name] !== undefined) return memo[p.name];
      if (seen.indexOf(p.name) >= 0) return 0; // a cycle: stop counting
      var d = 0;
      p.requires.forEach(function (cap) {
        providers(pkgs, cap).forEach(function (q) { if (q.name !== p.name) d = Math.max(d, 1 + depth(q, seen.concat(p.name))); });
      });
      memo[p.name] = d;
      return d;
    }
    var keyed = pkgs.map(function (p, i) { return { name: p.name, d: depth(p, []), i: i }; });
    keyed.sort(function (x, y) { return (reverse ? y.d - x.d : x.d - y.d) || x.i - y.i; });
    return keyed.map(function (k) { return k.name; });
  }

  // ── the state ──

  function findIn(list, name) {
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }
  function repoOf(s, id) {
    for (var i = 0; i < s.repos.length; i++) if (s.repos[i].id === id) return s.repos[i];
    return null;
  }
  function repoPkgs(s) {
    var out = [];
    s.repos.forEach(function (r) { if (r.enabled) r.pkgs.forEach(function (p) { out.push({ pkg: p, repo: r.id, priority: r.priority }); }); });
    return out;
  }
  function plannedPkgs(s) {
    return s.plan.map(function (row) {
      if (row.repo.charAt(0) === '@') return findIn(s.installed, row.name);
      return findIn(repoOf(s, row.repo).pkgs, row.name);
    });
  }

  function initial(params) {
    var p = norm(params);
    var rq = REQUESTS[p.request];
    var repos = ['baseos', 'epel'].map(function (id) {
      var enabled = id === 'baseos' || p.epel;
      var meta = !enabled ? 'off' : id === 'epel' && rq.epelNew ? 'new' : 'cached';
      return { id: id, enabled: enabled, priority: PRIORITY[id], meta: meta, pkgs: rq.repos[id].map(function (n) { return clone(P[n]); }) };
    });
    var installed = BASE.map(function (n) { return inst(n, 'baseos', 'user'); });
    if (rq.mta) installed.push(inst('mta-a', 'baseos', 'user'));
    if (p.keepLibs && /htop$/.test(p.request)) {
      installed.push(inst('ocl-icd', 'baseos', 'dep'), inst('hwloc-libs', 'baseos', 'dep'), inst('hwloc', 'baseos', 'user'));
    }
    if (rq.htopInstalled) {
      if (!findIn(installed, 'ocl-icd')) installed.push(inst('ocl-icd', 'baseos', 'dep'), inst('hwloc-libs', 'baseos', 'dep'));
      installed.push(inst('htop', 'epel', 'user'));
    }
    return {
      request: { op: rq.op, name: rq.name },
      repos: repos,
      installed: installed,
      queue: [{ cap: rq.name, by: null }],
      last: null,
      resolved: [],
      plan: [],
      stage: 'resolve',
      order: null,
      problem: null,
      done: false,
      changed: []
    };
  }

  /** One install resolve action (rules 2, 4, 5, 8). Mutates s (a clone). */
  function resolveInstall(s) {
    var q = s.queue.shift();
    var cap = q.cap, by = q.by;
    if (!s.resolved.length) {
      // rule 8: the first action reads the metadata; a repository without any downloads its own list first
      s.repos.forEach(function (r) { if (r.meta === 'new') { r.meta = 'downloaded'; s.changed.push('meta:' + r.id); } });
    }
    var last = { kind: null, cap: cap, by: by, pkg: null, repo: null, cands: [], key: null, with: null };
    s.last = last;
    s.changed.push('cap:' + cap);

    var have = providers(s.installed, cap)[0];
    if (have) { last.kind = 'installed'; last.pkg = have.name; s.changed.push('inst:' + have.name); return note(s, last); }
    var planned = providers(plannedPkgs(s), cap)[0];
    if (planned) { last.kind = 'planned'; last.pkg = planned.name; s.changed.push('plan:' + planned.name); return note(s, last); }

    var cands = rank(repoPkgs(s).filter(function (c) { return c.pkg.provides.indexOf(cap) >= 0; }), cap);
    last.key = decidingKey(cands, cap);
    var others = s.installed.concat(plannedPkgs(s));
    var chosen = null;
    cands.forEach(function (c) {
      var row = { name: c.pkg.name, ver: c.pkg.ver, repo: c.repo, rejected: null };
      last.cands.push(row);
      if (chosen) return;
      var foe = others.filter(function (o) { return conflictsWith(c.pkg, o); })[0];
      if (foe) row.rejected = foe.name;
      else chosen = c;
    });
    if (!cands.length) {
      last.kind = by === null ? 'nomatch' : 'nothing';
      s.problem = { kind: last.kind, cap: cap, by: by, pkg: null, with: null };
      s.stage = 'aborted';
      s.changed.push('problem');
      return note(s, last);
    }
    if (!chosen) {
      last.kind = 'conflict';
      last.pkg = last.cands[0].name;
      last.with = last.cands[0].rejected;
      var inInst = !!findIn(s.installed, last.with);
      s.problem = { kind: 'conflict', cap: cap, by: by, pkg: last.pkg, ver: last.cands[0].ver, repo: last.cands[0].repo, with: last.with,
        withVer: findIn(others, last.with).ver, withInstalled: inInst, withRepo: inInst ? '@System' : findIn(s.plan, last.with).repo };
      s.stage = 'aborted';
      s.changed.push('problem', 'repo:' + last.pkg);
      return note(s, last);
    }
    last.kind = 'chosen';
    last.pkg = chosen.pkg.name;
    last.repo = chosen.repo;
    s.plan.push({ name: chosen.pkg.name, ver: chosen.pkg.ver, repo: chosen.repo, section: by === null ? 'install' : 'dep' });
    chosen.pkg.requires.forEach(function (c) { s.queue.push({ cap: c, by: chosen.pkg.name }); });
    s.changed.push('repo:' + chosen.pkg.name, 'plan:' + chosen.pkg.name);
    return note(s, last);
  }

  /** One remove resolve action (rule 7). Mutates s (a clone). */
  function resolveRemove(s) {
    var q = s.queue.shift();
    var cap = q.cap, by = q.by;
    var last = { kind: null, cap: cap, by: by, pkg: null, repo: null, cands: [], key: null, with: null, needer: null };
    s.last = last;
    s.changed.push('cap:' + cap);
    var going = s.plan.map(function (r) { return r.name; });

    if (by === null) {
      var target = findIn(s.installed, cap);
      if (!target) {
        last.kind = 'notinstalled';
        s.problem = { kind: 'notinstalled', cap: cap, by: null, pkg: null, with: null };
        s.stage = 'aborted';
        s.changed.push('problem');
        return note(s, last);
      }
      last.kind = 'remove';
      last.pkg = target.name;
      s.plan.push({ name: target.name, ver: target.ver, repo: '@' + target.from, section: 'remove' });
      target.requires.forEach(function (c) { s.queue.push({ cap: c, by: target.name }); });
      s.changed.push('inst:' + target.name, 'plan:' + target.name);
      return note(s, last);
    }

    var prov = providers(s.installed, cap)[0];
    if (!prov) { last.kind = 'none'; return note(s, last); }
    last.pkg = prov.name;
    s.changed.push('inst:' + prov.name);
    if (going.indexOf(prov.name) >= 0) { last.kind = 'going'; return note(s, last); }
    if (prov.reason === 'user') { last.kind = 'keptUser'; return note(s, last); }
    // does anything that stays installed still require what prov provides?
    var needer = null, needCap = null;
    s.installed.forEach(function (o) {
      if (needer || o.name === prov.name || going.indexOf(o.name) >= 0) return;
      o.requires.forEach(function (c) { if (!needer && prov.provides.indexOf(c) >= 0) { needer = o.name; needCap = c; } });
    });
    if (needer) { last.kind = 'keptNeeded'; last.needer = needer; last.with = needCap; s.changed.push('inst:' + needer); return note(s, last); }
    last.kind = 'unused';
    s.plan.push({ name: prov.name, ver: prov.ver, repo: '@' + prov.from, section: 'unused' });
    prov.requires.forEach(function (c) { s.queue.push({ cap: c, by: prov.name }); });
    s.changed.push('plan:' + prov.name);
    return note(s, last);
  }

  function note(s, last) {
    s.resolved.push({ cap: last.cap, by: last.by, kind: last.kind, pkg: last.pkg });
    if (s.stage === 'resolve' && !s.queue.length) s.stage = 'summary';
    return s;
  }

  function stepOnce(prev) {
    var s = clone(prev);
    s.changed = [];
    if (s.done) return s;
    if (s.stage === 'resolve') return s.request.op === 'install' ? resolveInstall(s) : resolveRemove(s);
    if (s.stage === 'aborted') { s.done = true; s.last = { kind: 'aborted' }; s.changed.push('problem'); return s; }
    if (s.stage === 'summary') {
      s.last = { kind: 'summary' };
      s.changed.push('summary');
      if (!s.plan.length) { s.done = true; s.stage = 'done'; return s; }
      s.stage = 'order';
      return s;
    }
    if (s.stage === 'order') {
      s.order = depthOrder(plannedPkgs(s), s.request.op === 'remove');
      s.last = { kind: 'order' };
      s.changed.push('order');
      s.stage = 'execute';
      return s;
    }
    // execute (rule 6/7 order, the installed set changes)
    s.last = { kind: 'execute' };
    if (s.request.op === 'install') {
      s.order.forEach(function (name) {
        var row = findIn(s.plan, name);
        var p = findIn(repoOf(s, row.repo).pkgs, name);
        s.installed.push(Object.assign(clone(p), { from: row.repo, reason: row.section === 'install' ? 'user' : 'dep' }));
        s.changed.push('inst:' + name);
      });
    } else {
      s.installed = s.installed.filter(function (p) { return s.order.indexOf(p.name) < 0; });
    }
    s.changed.push('execute');
    s.stage = 'done';
    s.done = true;
    return s;
  }

  /** The number of steps for these params: replay until done (at most 20 by the contract). */
  function steps(params) {
    var s = initial(params), n = 0;
    while (!s.done && n < 40) { s = stepOnce(s); n++; }
    return n;
  }

  var logic = {
    defaults: { request: 'install-htop', epel: true, keepLibs: false },
    steps: steps,
    initial: initial,
    step: function (prev, n, params) { return stepOnce(prev); },

    // helpers for the page and the tests
    norm: norm,
    vercmp: vercmp,
    providers: providers,
    conflictsWith: conflictsWith,
    rank: rank,
    decidingKey: decidingKey,
    depthOrder: depthOrder,
    findIn: findIn,
    /** Counts for the Transaction Summary. */
    summary: function (s) {
      return { op: s.request.op, n: s.plan.length, deps: s.plan.filter(function (r) { return r.section === 'dep' || r.section === 'unused'; }).length };
    },
    PKGS: P,
    PRIORITY: PRIORITY,
    REQUESTS: REQUESTS,
    REQUEST_IDS: REQUEST_IDS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
