/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-fsmo-roles: three DCs of one domain, the five operations master roles, RID pools, and one action per
   step (power, network, transfer, seize, or an operation). Each DC keeps its own copy of who holds each role (with
   the version of that fact) and of the next free RID; online DCs that reach each other merge their copies after
   every action. Operations are evaluated live against the state of the step. Rules and numbers: SPEC.md (rule
   numbers below). No shared model: models/ has none for AD, and win-ad-structure's model (OU placement) is not
   used here.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DCS = ['DC01', 'DC02', 'DC03'];
  var ROLES = ['schema', 'naming', 'rid', 'pdc', 'infra'];
  var FOREST_WIDE = { schema: true, naming: true };
  /** Roles whose two holders persist conflicting data (rule 11). */
  var CONFLICT = { schema: true, naming: true, rid: true };
  var OPS = ['logon', 'create', 'password', 'time', 'schema', 'domain', 'xref'];
  var NEEDS = { logon: null, create: 'rid', password: 'pdc', time: 'pdc', schema: 'schema', domain: 'naming', xref: 'infra' };
  var POOL = 500;          // RIDs per pool (rule 3)
  var THRESHOLD = 250;     // ask for the next pool at half used (rule 3, check)
  var SEIZE_SKIP = 10000;  // a RID master seizure raises the next free RID (rule 8)
  var AVAIL0 = 4601;
  var POOLS0 = { DC01: [3101, 3600, 480], DC02: [3601, 4100, null], DC03: [4101, 4600, 400] };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt, step) {
    var n = Number(v);
    if (!isFinite(n)) n = dflt;
    n = Math.round(n / step) * step;
    return Math.max(lo, Math.min(hi, n));
  }

  // ── scenarios (SPEC.md "Presets") ──

  var SCENARIOS = {
    quillmoor: {
      place: {},
      script: [{ kind: 'off', dc: 'DC01' }, { kind: 'op', op: 'logon' }, { kind: 'op', op: 'password' },
        { kind: 'op', op: 'create' }, { kind: 'op', op: 'schema' }, { kind: 'op', op: 'time' }]
    },
    'rid-only': {
      place: { rid: 'DC03' },
      script: [{ kind: 'off', dc: 'DC03' }, { kind: 'op', op: 'create' }, { kind: 'op', op: 'password' }, { kind: 'op', op: 'create' }]
    },
    transfer: {
      place: {},
      script: [{ kind: 'transfer', role: 'pdc', to: 'DC02' }, { kind: 'op', op: 'time' }, { kind: 'off', dc: 'DC01' }]
    },
    'seize-and-return': {
      place: {},
      script: [{ kind: 'off', dc: 'DC01' }, { kind: 'cut', dc: 'DC02' }, { kind: 'seize', role: 'rid', to: 'DC02' },
        { kind: 'on', dc: 'DC01', restore: true }, { kind: 'op', op: 'create', at: 'DC03' }, { kind: 'join' }]
    },
    'infra-single-domain': {
      place: { infra: 'DC03' },
      script: [{ kind: 'off', dc: 'DC03' }, { kind: 'op', op: 'xref' }]
    }
  };

  /** The params the model acts on (SPEC.md "Params"). */
  function eff(p) {
    p = p || {};
    return {
      scenario: SCENARIOS[p.scenario] ? p.scenario : 'quillmoor',
      ridLeft: clampInt(p.ridLeft, 0, POOL, 250, 10),
      usersToCreate: clampInt(p.usersToCreate, 0, 600, 300, 10)
    };
  }

  function script(p) { return SCENARIOS[eff(p).scenario].script; }

  // ── who holds what ──

  /** The roles a DC believes it holds: those its own copy names it for. */
  function rolesOf(s, id) {
    var o = s.dcs[id].copy.owner;
    return ROLES.filter(function (r) { return o[r] === id; });
  }

  /** Can a and b talk? Both on, and neither cut off (a DC always reaches itself while on). */
  function reach(s, a, b) {
    if (!s.dcs[a].on || !s.dcs[b].on) return false;
    if (a === b) return true;
    return s.cut !== a && s.cut !== b;
  }

  /** Rules 1–5, 10: the holder of role as the DC `at` sees it, and whether it acts for `at` now. */
  function holderFor(s, at, role) {
    var owner = s.dcs[at].copy.owner[role];
    var h = s.dcs[owner];
    var why = null;
    if (!h.on) why = 'off';
    else if (!reach(s, at, owner)) why = 'cut';
    else if (!h.synced) why = 'waiting';
    return { dc: owner, ok: !why, why: why };
  }

  /** Rule 11: the DCs that act as holder of role (online, synced, naming themselves). */
  function acting(s, role) {
    return DCS.filter(function (d) { return s.dcs[d].on && s.dcs[d].synced && s.dcs[d].copy.owner[role] === d; });
  }

  /** Rule 11: roles with two acting holders, with whether they conflict. */
  function conflicts(s) {
    return ROLES.map(function (r) { return { role: r, dcs: acting(s, r), conflict: !!CONFLICT[r] }; })
      .filter(function (x) { return x.dcs.length > 1; });
  }

  /** Rule 11: pairs of pools given to two different DCs that share RIDs. */
  function duplicatePools(s) {
    var out = [];
    for (var i = 0; i < s.pools.length; i++) {
      for (var j = i + 1; j < s.pools.length; j++) {
        var a = s.pools[i], b = s.pools[j];
        if (a.dc !== b.dc && a.from <= b.to && b.from <= a.to) out.push([i, j]);
      }
    }
    return out;
  }

  // ── replication (rule 9) ──

  /** Owner fact x beats y: higher version, then the later step, then the larger DC id. */
  function newer(x, y) {
    if (x.ver !== y.ver) return x.ver > y.ver;
    if (x.at !== y.at) return x.at > y.at;
    return x.dc > y.dc;
  }

  function fact(copy, role) { return { dc: copy.owner[role], ver: copy.ver[role], at: copy.at[role] }; }

  /** Groups of online DCs that reach each other, in DC order. */
  function islands(s) {
    var seen = {}, out = [];
    DCS.forEach(function (d) {
      if (seen[d] || !s.dcs[d].on) return;
      var g = DCS.filter(function (e) { return !seen[e] && reach(s, d, e); });
      g.forEach(function (e) { seen[e] = true; });
      out.push(g);
    });
    return out;
  }

  /** Merge the copies within each island of two or more DCs; those DCs are synced (rule 10). */
  function converge(s) {
    islands(s).forEach(function (g) {
      if (g.length < 2) return;
      var best = {}, avail = 0;
      g.forEach(function (d) {
        var c = s.dcs[d].copy;
        ROLES.forEach(function (r) { var f = fact(c, r); if (!best[r] || newer(f, best[r])) best[r] = f; });
        avail = Math.max(avail, c.avail);
      });
      g.forEach(function (d) {
        var c = s.dcs[d].copy;
        ROLES.forEach(function (r) { c.owner[r] = best[r].dc; c.ver[r] = best[r].ver; c.at[r] = best[r].at; });
        c.avail = avail;
        s.dcs[d].synced = true;
      });
    });
  }

  // ── operations (rules 1–6, 12) ──

  /** Rule 3: create n users on DC at; changes s. Returns { created, failed, request: null | 'granted' | holder why }. */
  function createUsers(s, at, n) {
    var dc = s.dcs[at], pool = dc.ridPool;
    var out = { created: 0, failed: 0, request: null, granted: null, first: null, lastRid: null };
    function ask() {
      var h = holderFor(s, at, 'rid');
      out.requestAt = out.created;
      if (!h.ok) { out.request = 'failed'; out.requestWhy = h.why; return; }
      var m = s.dcs[h.dc].copy;
      pool.next = { from: m.avail, to: m.avail + POOL - 1 };
      s.pools.push({ dc: at, from: m.avail, to: m.avail + POOL - 1, by: h.dc });
      m.avail += POOL;
      out.request = 'granted';
      out.granted = { from: pool.next.from, to: pool.next.to, by: h.dc };
    }
    for (var k = 0; k < n; k++) {
      // an empty pool with no next one asks before it fails (once per run)
      if (pool.left === 0 && !pool.next && out.request !== 'failed') ask();
      if (pool.left === 0 && pool.next) {
        pool.from = pool.next.from; pool.to = pool.next.to; pool.left = POOL; pool.next = null;
      }
      if (pool.left === 0) { out.failed = n - k; break; }
      var rid = pool.to - pool.left + 1;
      if (out.first === null) out.first = rid;
      out.lastRid = rid;
      pool.left--;
      out.created++;
      if (pool.left <= THRESHOLD && !pool.next && out.request !== 'failed') ask();
    }
    return out;
  }

  function verdict(ok, partial) { return ok ? 'ok' : partial ? 'degraded' : 'fail'; }

  /** One operation on DC at, run on s (changes s only for create). { op, at, status, role, holder, why, … } */
  function runOp(s, op, at, n) {
    var role = NEEDS[op];
    var r = { op: op, at: at, role: role, holder: null, status: 'ok', why: null };
    if (!s.dcs[at].on) { r.status = 'fail'; r.why = 'atOff'; return r; }
    var h = role ? holderFor(s, at, role) : null;
    if (h) { r.holder = h.dc; r.holderWhy = h.why; }
    switch (op) {
      case 'logon': r.why = 'anyDc'; break;
      case 'create':
        var c = createUsers(s, at, n);
        Object.assign(r, c, { n: n });
        r.status = n === 0 ? 'ok' : verdict(c.failed === 0, c.created > 0);
        r.why = c.failed ? 'poolEmpty' : c.request === 'failed' ? 'requestFailed' : c.request === 'granted' ? 'granted' : 'fromPool';
        if (c.request === 'failed' && c.failed === 0) r.why = 'requestFailed';
        break;
      case 'password': r.status = h.ok ? 'ok' : 'degraded'; r.why = h.ok ? 'pdcFirst' : 'noPdc'; break;
      case 'time':
        if (!h.ok) { r.status = 'degraded'; r.why = 'drift'; }
        else if (!s.dcs[h.dc].external) { r.status = 'degraded'; r.why = 'ownClock'; }
        else r.why = 'external';
        break;
      case 'schema': r.status = h.ok ? 'ok' : 'fail'; r.why = h.ok ? 'holderOk' : 'holderGone'; break;
      case 'domain': r.status = h.ok ? 'ok' : 'fail'; r.why = h.ok ? 'holderOk' : 'holderGone'; break;
      case 'xref': r.status = 'ok'; r.why = 'oneDomain'; break;
    }
    return r;
  }

  /** Rule 12: every panel row against this state, in panel order, each on its own copy. */
  function panel(s, p) {
    var n = eff(p).usersToCreate;
    return OPS.map(function (op) { return runOp(clone(s), op, s.desk, n); });
  }

  // ── actions ──

  function doTransfer(s, ev) {
    var from = s.dcs[ev.to].copy.owner[ev.role];
    var h = holderFor(s, ev.to, ev.role);
    var e = { kind: ev.kind, role: ev.role, to: ev.to, from: from, refused: null, asTransfer: false };
    if (from === ev.to) { e.refused = 'already'; return e; }
    if (!s.dcs[ev.to].on) { e.refused = 'targetOff'; return e; }
    if (ev.kind === 'transfer' && !h.ok) { e.refused = h.why; return e; }
    var c = s.dcs[ev.to].copy;
    c.owner[ev.role] = ev.to;
    c.ver[ev.role] += 1;
    c.at[ev.role] = s.n;
    if (ev.kind === 'transfer' || h.ok) {
      // rule 7: graceful; the holder hands over (and gets the new fact at once)
      e.asTransfer = ev.kind === 'seize';
      var hc = s.dcs[from].copy;
      hc.owner[ev.role] = ev.to; hc.ver[ev.role] = c.ver[ev.role]; hc.at[ev.role] = s.n;
    }
    else {
      // rule 8: forced takeover
      s.seized[ev.role] = from;
      if (ev.role === 'rid') { e.availFrom = c.avail; c.avail += SEIZE_SKIP; e.availTo = c.avail; }
    }
    return e;
  }

  /** One action on s (changes s): power, network, transfer, seize or an operation; then replication (rule 9). */
  function act(s, ev, nUsers) {
    var e;
    if (ev.kind === 'off') { s.dcs[ev.dc].on = false; e = { kind: 'off', dc: ev.dc, roles: rolesOf(s, ev.dc) }; }
    else if (ev.kind === 'on') {
      var dc = s.dcs[ev.dc];
      dc.on = true;
      dc.synced = false;
      if (ev.restore) { dc.restored = true; dc.ridPool.left = 0; dc.ridPool.next = null; }
      e = { kind: 'on', dc: ev.dc, restore: !!ev.restore, roles: rolesOf(s, ev.dc) };
    }
    else if (ev.kind === 'cut') { s.cut = ev.dc; e = { kind: 'cut', dc: ev.dc }; }
    else if (ev.kind === 'join') { e = { kind: 'join', dc: s.cut, before: rolesOf(s, 'DC01') }; s.cut = null; }
    else if (ev.kind === 'transfer' || ev.kind === 'seize') e = doTransfer(s, ev);
    else {
      s.desk = ev.at || 'DC02';
      e = runOp(s, ev.op, s.desk, nUsers);
      e.kind = 'op';
    }
    converge(s);
    s.last = e;
  }

  var logic = {
    DCS: DCS,
    ROLES: ROLES,
    OPS: OPS,
    NEEDS: NEEDS,
    FOREST_WIDE: FOREST_WIDE,
    CONFLICT: CONFLICT,
    POOL: POOL,
    THRESHOLD: THRESHOLD,
    SEIZE_SKIP: SEIZE_SKIP,
    SCENARIOS: Object.keys(SCENARIOS),

    defaults: { scenario: 'quillmoor', ridLeft: 250, usersToCreate: 300 },

    steps: function (p) { return script(p).length; },

    initial: function (p) {
      var e = eff(p), place = SCENARIOS[e.scenario].place;
      var dcs = {}, pools = [];
      DCS.forEach(function (d) {
        var owner = {}, ver = {}, at = {};
        ROLES.forEach(function (r) { owner[r] = place[r] || 'DC01'; ver[r] = 1; at[r] = 0; });
        var p0 = POOLS0[d];
        dcs[d] = { on: true, synced: true, restored: false, external: d === 'DC01',
          ridPool: { from: p0[0], to: p0[1], left: p0[2] === null ? e.ridLeft : p0[2], next: null },
          copy: { owner: owner, ver: ver, at: at, avail: AVAIL0 } };
        pools.push({ dc: d, from: p0[0], to: p0[1], by: 'DC01' });
      });
      return { n: 0, desk: 'DC02', cut: null, dcs: dcs, pools: pools, seized: {}, last: null };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      s.n = n;
      act(s, script(p)[n - 1], eff(p).usersToCreate);
      return s;
    },

    // exported for tests and the page
    act: act,
    eff: eff,
    script: script,
    rolesOf: rolesOf,
    reach: reach,
    holderFor: holderFor,
    acting: acting,
    conflicts: conflicts,
    duplicatePools: duplicatePools,
    newer: newer,
    islands: islands,
    converge: converge,
    createUsers: createUsers,
    runOp: runOp,
    panel: panel,
    doTransfer: doTransfer
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
