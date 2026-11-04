/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-time-hierarchy: time in one Active Directory domain (the forest root). An external source (loom) →
   the PDC emulator → the other DCs → the members. One step = one sync round: every clock drifts by its rate, then every
   syncing node takes its source's time, top-down, then the Kerberos strip compares fixed pairs (refused past 5 min).
   Rules, tie-break and numbers: SPEC.md (rule numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var IDS = ['loom', 'DC01', 'DC02', 'DC03', 'PC-A', 'PC-B'];
  var DCS = ['DC01', 'DC02', 'DC03'];
  /** Rule 1: each member's DC (the one it authenticated against). */
  var SITE_DC = { 'PC-A': 'DC02', 'PC-B': 'DC03' };
  /** Own drift, s per round, of the nodes no param drives (SPEC.md "Scene"; made up, small). */
  var BASE_DRIFT = { loom: 0, DC01: 1, DC02: -2, DC03: 3, 'PC-A': -5 };
  /** The Kerberos strip: two logons, then DC to DC. */
  var PAIRS = [
    { a: 'PC-A', b: 'DC02', kind: 'logon' },
    { a: 'PC-B', b: 'DC03', kind: 'logon' },
    { a: 'DC02', b: 'DC01', kind: 'dc' },
    { a: 'DC03', b: 'DC01', kind: 'dc' }
  ];
  /** Kerberos policy: maximum tolerance for computer clock synchronization, 5 minutes. */
  var SKEW = 300;
  var MAX_ROUNDS = 10;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (v === '' || v === null || v === undefined || !isFinite(n)) n = dflt;
    return Math.max(lo, Math.min(hi, n));
  }

  /** The params the model acts on, clamped. */
  function eff(p) {
    p = p || {};
    return {
      pdcSource: p.pdcSource === 'none' ? 'none' : 'external',
      pdcDrift: clampInt(p.pdcDrift, -60, 60, 0),
      memberStopped: !!p.memberStopped,
      pcbDrift: clampInt(p.pcbDrift, 0, 120, 40),
      pdcOn: p.pdcOn === 'DC02' ? 'DC02' : 'DC01',
      rounds: clampInt(p.rounds, 1, MAX_ROUNDS, 4)
    };
  }

  /** Rule 5 (from sims/win-kerberos/sim.js @ 7577d92, skewOk, in seconds): within 5 minutes passes, 300 s included. */
  function skewOk(a, b) { return Math.abs(a - b) <= SKEW; }

  /** Each node's configuration from the params (SPEC.md "Configuration"). */
  function config(p) {
    var e = eff(p), out = {};
    IDS.forEach(function (id) {
      var drift = id === e.pdcOn ? e.pdcDrift : id === 'PC-B' ? e.pcbDrift : BASE_DRIFT[id];
      out[id] = {
        config: id === 'loom' ? 'local' : id === 'DC01' && e.pdcSource === 'external' ? 'manual' : 'domhier',
        pdc: id === e.pdcOn,
        syncs: id !== 'loom' && !(id === 'PC-B' && e.memberStopped),
        driftPerRound: drift
      };
    });
    return out;
  }

  /** Rules 1–4 and 6: whom a node syncs from (null: nobody). */
  function sourceOf(id, cfg) {
    var n = cfg[id];
    if (!n.syncs) return null;                 // loom, or a stopped service (rule 6)
    if (n.config === 'manual') return 'loom';  // rule 3: the configured external peer
    if (n.pdc) return null;                    // rules 3–4: a domhier PDC of the forest root has nobody above it
    if (DCS.indexOf(id) >= 0) {                // rule 2: by role
      for (var i = 0; i < DCS.length; i++) if (cfg[DCS[i]].pdc) return DCS[i];
    }
    return SITE_DC[id];                        // rule 1
  }

  function sources(p) {
    var cfg = config(p), out = {};
    IDS.forEach(function (id) { out[id] = sourceOf(id, cfg); });
    return out;
  }

  /** Rule 7: top-down by depth in the sync tree, then by name. */
  function order(src) {
    function depth(id) { var d = 0; for (var x = src[id]; x; x = src[x]) d++; return d; }
    return IDS.slice().sort(function (a, b) {
      var da = depth(a), db = depth(b);
      return da - db || (a < b ? -1 : a > b ? 1 : 0);
    });
  }

  /** The PDC with nobody above it (rule 3's event 12), or null. */
  function lonePdc(p) {
    var cfg = config(p), src = sources(p);
    for (var i = 0; i < DCS.length; i++) if (cfg[DCS[i]].pdc && cfg[DCS[i]].syncs && !src[DCS[i]]) return DCS[i];
    return null;
  }

  /** Rule 5: the strip from the offsets. */
  function kerberos(nodes) {
    return PAIRS.map(function (pr) {
      var a = nodes[pr.a].offset, b = nodes[pr.b].offset;
      return { a: pr.a, b: pr.b, kind: pr.kind, skew: Math.abs(a - b), ok: skewOk(a, b) };
    });
  }

  function initial(p) {
    var cfg = config(p), src = sources(p), nodes = {};
    IDS.forEach(function (id) {
      nodes[id] = { offset: 0, driftPerRound: cfg[id].driftPerRound, source: src[id], syncs: cfg[id].syncs, pdc: cfg[id].pdc,
        config: cfg[id].config, drifted: 0, corrected: 0 };
    });
    return { round: 0, nodes: nodes, krb: kerberos(nodes), events: [], order: order(src), changed: [] };
  }

  function step(prev, n, p) {
    var s = clone(prev);
    s.round = n;
    var ord = order(sourcesFromState(s));
    // (a) drift
    IDS.forEach(function (id) {
      var x = s.nodes[id];
      x.offset += x.driftPerRound;
      x.drifted = x.offset;
    });
    // (b) sync, top-down (rule 7)
    ord.forEach(function (id) {
      var x = s.nodes[id];
      if (x.source) x.offset = s.nodes[x.source].offset;
      x.corrected = x.offset - x.drifted;
    });
    // rule 3: event 12, once
    var lone = lonePdc(p);
    if (lone && !s.events.some(function (e) { return e.code === 'noSource' && e.node === lone; })) {
      s.events.push({ round: n, node: lone, code: 'noSource' });
    }
    // (c) the strip (rule 5)
    var before = prev.krb;
    s.krb = kerberos(s.nodes);
    s.krb.forEach(function (k, i) {
      if (before[i].ok && !k.ok) s.events.push({ round: n, node: k.a, peer: k.b, code: 'krbFail' });
      else if (!before[i].ok && k.ok) s.events.push({ round: n, node: k.a, peer: k.b, code: 'krbOk' });
    });
    s.order = ord;
    s.changed = IDS.filter(function (id) { return s.nodes[id].offset !== prev.nodes[id].offset; });
    return s;
  }

  function sourcesFromState(s) {
    var out = {};
    IDS.forEach(function (id) { out[id] = s.nodes[id].source; });
    return out;
  }

  /** The offset the domain agrees on: every DC and member, when they are all equal; else null. */
  function domainOffset(s) {
    var ids = IDS.filter(function (id) { return id !== 'loom'; });
    var v = s.nodes[ids[0]].offset;
    for (var i = 1; i < ids.length; i++) if (s.nodes[ids[i]].offset !== v) return null;
    return v;
  }

  var logic = {
    IDS: IDS,
    DCS: DCS,
    SITE_DC: SITE_DC,
    PAIRS: PAIRS,
    SKEW: SKEW,
    MAX_ROUNDS: MAX_ROUNDS,

    defaults: { pdcSource: 'external', pdcDrift: 0, memberStopped: false, pcbDrift: 40, pdcOn: 'DC01', rounds: 4 },

    /** One step per sync round (SPEC.md "Presets"). */
    steps: function (p) { return eff(p).rounds; },

    initial: initial,
    step: step,

    // exported for tests and the page
    eff: eff,
    config: config,
    sources: sources,
    order: order,
    lonePdc: lonePdc,
    skewOk: skewOk,
    domainOffset: domainOffset
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
