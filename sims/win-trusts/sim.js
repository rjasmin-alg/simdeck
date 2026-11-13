/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-trusts: three forests (Quillmoor, Pellucid, Carrow), the trusts between their domains, and access
   tests "a user of domain U opens a share in domain R". One step: one admin action (create a trust, grant "Allowed to
   Authenticate"), one hop of a test's path (one Kerberos referral), or the verdict at the resource. Rules, tie-breaks
   and expected numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The page
   loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var Q = 'quillmoor.example', BRK = 'brk.quillmoor.example', EMB = 'emberline.example', PFX = 'pfx.internal', CAR = 'carrow.example';

  /** The domains, in display order. */
  var DOMAINS = [
    { id: Q, netbios: 'QUILLMOOR', forest: 'Quillmoor', root: true, place: 'root', user: 'ana', server: 'hq-fs01', share: 'Cinematics', group: 'Quillmoor-Access' },
    { id: BRK, netbios: 'BRK', forest: 'Quillmoor', root: false, place: 'child', user: 'ivan', server: 'brk-fs01', share: 'branch', group: 'Brk-Access' },
    { id: EMB, netbios: 'EMBERLINE', forest: 'Quillmoor', root: false, place: 'tree', user: 'maja', server: 'em-fs01', share: 'assets', group: 'Emberline-Access' },
    { id: PFX, netbios: 'PELLUCID', forest: 'Pellucid', root: true, place: 'root', user: 'jwren', server: 'pfx-fs1', share: 'comp', group: 'Pellucid-Access' },
    { id: CAR, netbios: 'CARROW', forest: 'Carrow', root: true, place: 'root', user: 'sara', server: 'cr-fs01', share: 'shared', group: 'Carrow-Access' }
  ];
  var IDS = DOMAINS.map(function (d) { return d.id; });
  var BY = {};
  DOMAINS.forEach(function (d) { BY[d.id] = d; });
  var FORESTS = ['Quillmoor', 'Pellucid', 'Carrow'];
  var SCENARIOS = ['in-forest', 'quillmoor-pellucid', 'one-way', 'no-third-forest', 'selective'];
  var IN_FOREST = { 'parent-child': true, 'tree-root': true, shortcut: true };
  var CROSS = { forest: true, external: true };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function has(list, x) { return list.indexOf(x) >= 0; }
  function dom(id) { return BY[id]; }
  function forestOf(id) { return BY[id].forest; }
  function valid(id, fallback) { return BY[id] ? id : fallback; }

  /** A trust; from trusts to. Transitive except external (rules 2–5). Flags only on forest and external trusts. */
  function trust(id, from, to, type, twoWay, p, auto) {
    var cross = !!CROSS[type];
    return { id: id, from: from, to: to, type: type, twoWay: !!twoWay, transitive: type !== 'external',
      selectiveAuth: cross && !!p.selective, sidFiltering: cross && !!p.sidFilter, auto: !!auto };
  }

  /** Rule 2 and 5: the trusts that exist before the scenario's script, numbered in creation order. */
  function initialTrusts(p) {
    var out = [trust(1, Q, BRK, 'parent-child', true, p, true), trust(2, Q, EMB, 'tree-root', true, p, true)];
    if (p.shortcut) out.push(trust(3, BRK, EMB, 'shortcut', true, p, false));
    if (p.scenario === 'selective') out.push(trust(out.length + 1, Q, CAR, 'forest', true, p, false));
    return out;
  }

  /** The script of a scenario: events; tests take U and R from the params. */
  function script(p) {
    var U = valid(p.userDomain, BRK), R = valid(p.resourceDomain, PFX);
    function T(u, r) { return { kind: 'test', user: u, resource: r }; }
    function C(from, to, type, twoWay) { return { kind: 'create', from: from, to: to, type: type, twoWay: twoWay }; }
    switch (p.scenario) {
      case 'in-forest': return [T(U, R)];
      case 'one-way': return [C(Q, CAR, 'forest', false), T(U, R), T(R, U)];
      case 'no-third-forest': return [C(Q, PFX, 'forest', true), C(PFX, CAR, 'forest', true), T(U, R)];
      case 'selective': return [T(U, R), { kind: 'grant', user: U, server: R }, T(U, R)];
      default: return [C(Q, PFX, 'external', true), T(PFX, Q), T(U, R)]; // quillmoor-pellucid
    }
  }

  /** Access edges x → y (y trusts x), each with the trust it crosses. A two-way trust gives both. */
  function accessEdges(trusts) {
    var out = [];
    trusts.forEach(function (tr) {
      out.push({ a: tr.to, b: tr.from, trust: tr });
      if (tr.twoWay) out.push({ a: tr.from, b: tr.to, trust: tr });
    });
    return out;
  }

  /** Every simple path from u to r over access edges that `ok(edge, phase, x)` admits; phase is returned by ok.
      Sorted by length, then by the trust ids hop by hop (T1). Returns the first, or null. */
  function search(trusts, u, r, ok) {
    var edges = accessEdges(trusts), found = [];
    function go(x, path, hops, phase) {
      if (x === r) { found.push({ path: path, hops: hops }); return; }
      edges.forEach(function (e) {
        if (e.a !== x || has(path, e.b)) return;
        var next = ok(e, phase, x);
        if (next === false) return;
        go(e.b, path.concat([e.b]), hops.concat([e.trust.id]), next);
      });
    }
    go(u, [u], [], 0);
    found.sort(function (A, B) {
      if (A.hops.length !== B.hops.length) return A.hops.length - B.hops.length;
      for (var i = 0; i < A.hops.length; i++) if (A.hops[i] !== B.hops[i]) return A.hops[i] - B.hops[i];
      return 0;
    });
    return found[0] || null;
  }

  /** Rules 2–5: a valid access path from u to r. Phase 0: still in u's forest; 1: crossed a forest trust; 2: crossed an
      external trust (which must be the whole path). */
  function findPath(trusts, u, r) {
    return search(trusts, u, r, function (e, phase, x) {
      var ty = e.trust.type;
      if (IN_FOREST[ty]) return phase === 2 ? false : phase;
      if (ty === 'forest') return phase === 0 ? 1 : false;
      if (ty === 'external') return phase === 0 && x === u && e.b === r ? 2 : false;
      return false;
    });
  }

  /** Any path at all, ignoring rules 3 and 4. */
  function naivePath(trusts, u, r) { return search(trusts, u, r, function () { return 0; }); }

  function trustById(trusts, id) { for (var i = 0; i < trusts.length; i++) if (trusts[i].id === id) return trusts[i]; return null; }

  /** Why no valid path exists: { rule, path (access order, may be null), at (hop index of the ✕, or -1) }. */
  function blockOf(trusts, u, r) {
    var n = naivePath(trusts, u, r);
    if (n) {
      var types = n.hops.map(function (id) { return trustById(trusts, id).type; });
      var ext = types.indexOf('external');
      // the ✕ goes on the hop that chains with the external trust: the external hop itself unless it comes first
      if (ext >= 0) return { rule: 'external', path: n.path, hops: n.hops, at: ext > 0 ? ext : 1 };
      var forests = [];
      types.forEach(function (ty, i) { if (ty === 'forest') forests.push(i); });
      if (forests.length >= 2) return { rule: 'third-forest', path: n.path, hops: n.hops, at: forests[1] };
    }
    var back = naivePath(trusts, r, u);
    if (back) return { rule: 'direction', path: back.path, hops: back.hops, at: -1 };          // path: the other way, R → U
    return { rule: 'none', path: null, hops: [], at: -1 };
  }

  /** The verdict at the resource (rules 6–8). path: access order; hops: trust ids. */
  function verdict(s, test, p) {
    var U = test.user, R = test.resource;
    var token = [{ sid: dom(U).netbios + '\\' + dom(U).user, dom: U, kind: 'user' },
      { sid: dom(U).netbios + '\\Domain Users', dom: U, kind: 'group' }];
    if (p.sidHistory && U !== R) token.push({ sid: dom(R).netbios + '\\Domain Admins', dom: R, kind: 'history' });
    var crossed = null;
    test.hops.forEach(function (id) { var tr = trustById(s.trusts, id); if (CROSS[tr.type]) crossed = tr; });
    var filtered = !!(crossed && crossed.sidFiltering);
    // rule 8: filtering on drops SIDs outside the trusted domain (external) or forest (forest). Across a forest trust the
    // SIDs of the trusting forest itself are dropped even with filtering off (ForestSpecific, MS-PAC 4.1.2.2).
    var forestSpecific = !!(crossed && crossed.type === 'forest');
    token.forEach(function (x) {
      x.kept = !filtered || (crossed.type === 'external' ? x.dom === U : forestOf(x.dom) === forestOf(U));
      if (forestSpecific && forestOf(x.dom) === forestOf(R) && forestOf(R) !== forestOf(U)) { x.kept = false; x.forestSpecific = !filtered; }
    });
    var admin = token.some(function (x) { return x.kind === 'history' && x.kept; });
    var selApplies = !!(crossed && crossed.selectiveAuth);
    var granted = s.grants.some(function (g) { return g.user === U && g.server === R; });
    var selOk = !selApplies || granted || admin;                                  // rule 7
    var aceOk = !!p.aceGranted || admin;                                          // rule 6
    var block = !selOk ? 'selective' : !aceOk ? 'ace' : null;
    return {
      token: token, crossed: crossed ? crossed.id : null, filtered: filtered, forestSpecific: forestSpecific, viaAdmin: admin,
      selective: { applies: selApplies, granted: granted, ok: selOk },
      ace: { granted: !!p.aceGranted, ok: aceOk },
      ok: !block, block: block
    };
  }

  /** Start a test: its path and hops, the cached hops skipped (rule 9). */
  function startTest(s, ev) {
    var found = ev.user === ev.resource ? { path: [ev.user], hops: [] } : findPath(s.trusts, ev.user, ev.resource);
    var test = { user: ev.user, resource: ev.resource, path: null, hops: [], cached: [], done: 0, verdict: null, block: null, why: null, checks: null };
    if (!found) {
      test.why = blockOf(s.trusts, ev.user, ev.resource);
      test.block = test.why.rule;
      test.verdict = 'deny';
      return test;
    }
    test.path = found.path;
    test.hops = found.hops;
    var mine = s.cache[ev.user] || [];
    test.cached = found.path.slice(1).map(function (d) { return has(mine, d); });
    while (test.done < test.hops.length && test.cached[test.done]) test.done++;
    return test;
  }

  function addCache(s, user, realm) {
    var mine = s.cache[user] || (s.cache[user] = [user]);
    if (!has(mine, realm)) mine.push(realm);
  }

  /** One step: the next hop or verdict of the running test, else the next script event. Mutates s, returns a record. */
  function advance(s, p) {
    var t = s.test;
    if (t && !t.verdict) {
      if (t.done < t.hops.length) {                                               // rule 9: one referral
        var i = t.done;
        addCache(s, t.user, t.path[i + 1]);
        t.done++;
        while (t.done < t.hops.length && t.cached[t.done]) t.done++;
        return { kind: 'hop', i: i, from: t.path[i], to: t.path[i + 1], trust: t.hops[i] };
      }
      t.checks = verdict(s, t, p);
      t.verdict = t.checks.ok ? 'allow' : 'deny';
      t.block = t.checks.block;
      return { kind: 'verdict', ok: t.checks.ok, block: t.block };
    }
    var ev = script(p)[s.ev];
    if (!ev) return null;
    s.ev++;
    if (ev.kind === 'create') {
      var tr = trust(s.trusts.length ? s.trusts[s.trusts.length - 1].id + 1 : 1, ev.from, ev.to, ev.type, ev.twoWay, p, false);
      s.trusts.push(tr);
      s.test = null;
      return { kind: 'create', trust: tr.id };
    }
    if (ev.kind === 'grant') {
      var dup = s.grants.some(function (g) { return g.user === ev.user && g.server === ev.server; });
      if (!dup) s.grants.push({ user: ev.user, server: ev.server });
      s.test = null;
      return { kind: 'grant', user: ev.user, server: ev.server, already: dup };
    }
    s.test = startTest(s, ev);
    s.tests++;
    if (s.test.verdict) return { kind: 'blocked', block: s.test.block };
    return advance(s, p);
  }

  function initial(p) {
    var s = { trusts: initialTrusts(p), grants: [], cache: {}, ev: 0, tests: 0, test: null, log: [], last: null };
    IDS.forEach(function (d) { s.cache[d] = [d]; });                              // every user holds its own TGT
    return s;
  }

  function stepState(prev, n, p) {
    var s = clone(prev);
    var rec = advance(s, p);
    if (!rec) return s;
    rec.n = n;
    rec.test = s.tests;
    if (s.test && (rec.kind === 'hop' || rec.kind === 'verdict' || rec.kind === 'blocked')) {
      rec.user = s.test.user;
      rec.resource = s.test.resource;
    }
    s.last = rec;
    s.log.push({ n: n, kind: rec.kind, ok: rec.kind === 'verdict' ? rec.ok : rec.kind === 'blocked' ? false : null,
      user: rec.user || null, resource: rec.resource || null, from: rec.from || null, to: rec.to || null, trust: rec.trust || null });
    return s;
  }

  /** Steps of a run: replay until the script and the last test are done. */
  function steps(p) {
    var s = initial(p), n = 0;
    while (n < 50) {
      var t = s.test;
      var more = (t && !t.verdict) || s.ev < script(p).length;
      if (!more) break;
      n++;
      s = stepState(s, n, p);
    }
    return n;
  }

  var logic = {
    DOMAINS: DOMAINS, IDS: IDS, FORESTS: FORESTS, SCENARIOS: SCENARIOS,
    defaults: { scenario: 'quillmoor-pellucid', userDomain: BRK, resourceDomain: PFX, aceGranted: true, selective: false,
      sidFilter: true, sidHistory: false, shortcut: false },
    steps: steps,
    initial: initial,
    step: stepState,
    script: script,
    findPath: findPath,
    naivePath: naivePath,
    blockOf: blockOf,
    domain: dom,
    forestOf: forestOf,
    trustById: trustById,
    initialTrusts: initialTrusts
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
