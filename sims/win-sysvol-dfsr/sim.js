/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-sysvol-dfsr: one GPO in two halves on two DCs. The GPC (in AD, versionNumber) travels by AD
   replication, the GPT (a SYSVOL folder: GPT.INI Version= and Drives.xml) by DFS Replication, each with its own delay;
   a WAN cut holds both pipes. The branch client PC-B reads the GPC version and the files from DC03 and applies the GPO
   only when the GPC version is newer than the one it last applied. Two admins saving at once: DFSR keeps the last
   writer's files and moves the other copy to ConflictAndDeleted. Rules, tie-breaks and numbers: SPEC.md (rule numbers
   in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Contents are keys (m5, m6a, m6b) the page shows as drive maps (data).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DCS = ['DC01', 'DC03'];
  var CLIENT_DC = 'DC03';          // PC-B's site DC
  var USER0 = 5;                   // user version at the start
  var COMPUTER = 1;                // computer version, never changed here
  var WAN_BACK_AFTER = 2;          // the WAN comes back two ticks after the cut
  var CONTENT = { DC01: 'm6a', DC03: 'm6b' };
  /** Order of events inside one tick (SPEC.md "Tie-break"). */
  var ORDER = { edit: 0, restore: 1, ad: 2, dfsr: 3, cut: 4, refresh: 5, force: 6 };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.max(lo, Math.min(hi, n));
  }
  function other(dc) { return dc === 'DC01' ? 'DC03' : 'DC01'; }

  /** Rule 3: versionNumber = user × 65536 + computer. */
  function versionNumber(user, computer) { return user * 65536 + (computer == null ? COMPUTER : computer); }
  function splitVersion(n) { return { user: Math.floor(n / 65536), computer: n % 65536 }; }

  /** The params the model acts on (SPEC.md "Timeline"). */
  function eff(p) {
    p = p || {};
    return {
      wanCut: p.wanCut === 'afterAd' || p.wanCut === 'afterDfsr' ? p.wanCut : 'never',
      adDelay: clampInt(p.adDelay, 1, 10, 2),
      dfsrDelay: clampInt(p.dfsrDelay, 1, 10, 4),
      refreshAt: clampInt(p.refreshAt, 1, 12, 5),
      twoEditors: !!p.twoEditors
    };
  }

  /** Timeline items 3–4: the cut and the WAN's return, and when each pipe actually delivers. */
  function timing(p) {
    var e = eff(p);
    var cutAt = e.wanCut === 'afterAd' ? e.adDelay : e.wanCut === 'afterDfsr' ? e.dfsrDelay : null;
    var backAt = cutAt === null ? null : cutAt + WAN_BACK_AFTER;
    function arrive(due) { return cutAt !== null && due > cutAt && due < backAt ? backAt : due; }
    return { cutAt: cutAt, backAt: backAt, ad: arrive(e.adDelay), dfsr: arrive(e.dfsrDelay) };
  }

  function sortEvents(list) {
    return list.sort(function (a, b) {
      return a.t - b.t || ORDER[a.kind] - ORDER[b.kind] || DCS.indexOf(a.dc) - DCS.indexOf(b.dc);
    });
  }

  /** The events before the forced refresh (timeline items 1–6). */
  function basePlan(p) {
    var e = eff(p), tm = timing(p);
    var ev = [{ kind: 'edit', dc: 'DC01', t: 0 }];
    if (e.twoEditors) ev.push({ kind: 'edit', dc: 'DC03', t: 0 });
    ev.push({ kind: 'ad', t: tm.ad }, { kind: 'dfsr', t: tm.dfsr }, { kind: 'refresh', t: e.refreshAt });
    if (tm.cutAt !== null) ev.push({ kind: 'cut', t: tm.cutAt }, { kind: 'restore', t: tm.backAt });
    var lastDelivery = Math.max(tm.ad, tm.dfsr);
    if (e.refreshAt < lastDelivery) ev.push({ kind: 'refresh', t: lastDelivery + 1, final: true });
    return sortEvents(ev);
  }

  /** Every step's event; a forced refresh is added when PC-B ends on other files than DC03 holds (item 7). */
  function plan(p) {
    var ev = basePlan(p);
    var s = initial(p);
    ev.forEach(function (x) { s = apply(s, x, p); });
    if (stale(s)) ev.push({ kind: 'force', t: ev[ev.length - 1].t + 1 });
    return ev;
  }

  /** PC-B applies settings other than the files on its DC (it recorded the version, the files came later). */
  function stale(s) { return s.client.applied.content !== s.dcs[CLIENT_DC].gpt.content; }

  /** GPMC status (rule 6): the DC's GPC and GPT versions differ. */
  function mismatch(s, dc) { return s.dcs[dc].gpc.ver !== s.dcs[dc].gpt.ver; }

  function initial() {
    var dcs = {};
    DCS.forEach(function (d) {
      dcs[d] = {
        gpc: { ver: USER0, seq: 0, by: null },
        gpt: { ver: USER0, content: 'm5', seq: 0, by: null },
        cad: []
      };
    });
    return {
      t: 0,
      wan: 'up',
      dcs: dcs,
      inflight: { ad: [], dfsr: [] },
      client: { applied: { ver: USER0, content: 'm5', gptVer: USER0 }, report: null },
      saves: 0,
      last: null,
      changed: []
    };
  }

  /** Rule 2: a save on one DC bumps both halves there and sends each half down its own pipe. */
  function edit(s, ev, adDue, dfsrDue) {
    var d = s.dcs[ev.dc];
    var seq = ++s.saves;
    var ver = Math.max(d.gpc.ver, d.gpt.ver) + 1;
    var content = CONTENT[ev.dc];
    var before = { gpc: d.gpc.ver, gpt: d.gpt.ver, content: d.gpt.content };
    d.gpc = { ver: ver, seq: seq, by: ev.dc };
    d.gpt = { ver: ver, content: content, seq: seq, by: ev.dc };
    var to = other(ev.dc);
    s.inflight.ad.push({ from: ev.dc, to: to, ver: ver, seq: seq, by: ev.dc, due: adDue, held: false });
    s.inflight.dfsr.push({ from: ev.dc, to: to, ver: ver, content: content, seq: seq, by: ev.dc, due: dfsrDue, held: false });
    s.changed.push(ev.dc + '.gpc', ev.dc + '.gpt');
    s.last = { kind: 'edit', dc: ev.dc, seq: seq, from: before, ver: ver, content: content };
  }

  /** Rule 4, AD: the GPC goes to the other DC when it is newer there (version, then the later save). */
  function deliverAd(s) {
    var items = s.inflight.ad.map(function (x) {
      var d = s.dcs[x.to];
      var newer = x.ver > d.gpc.ver || (x.ver === d.gpc.ver && x.seq > d.gpc.seq);
      var held = d.gpc.ver;
      var outcome = x.ver === held ? 'equal' : newer ? 'applied' : 'older';
      if (newer) {
        d.gpc = { ver: x.ver, seq: x.seq, by: x.by };
        s.changed.push(x.to + '.gpc');
      }
      return { from: x.from, to: x.to, ver: x.ver, by: x.by, held: held, outcome: outcome };
    });
    s.inflight.ad = [];
    s.last = { kind: 'ad', items: items };
  }

  /** Rule 4 and 7, DFSR: the GPT folder goes over when it is the later save; a conflict loser goes to
      ConflictAndDeleted on the DC that resolved it. */
  function deliverDfsr(s) {
    var items = s.inflight.dfsr.map(function (x) {
      var d = s.dcs[x.to];
      var held = clone(d.gpt);
      var outcome;
      if (x.seq > d.gpt.seq) {
        // the incoming save is later; a local save the incoming one had not seen loses
        if (d.gpt.seq > 0 && d.gpt.by === x.to) {
          d.cad.push({ ver: d.gpt.ver, content: d.gpt.content, by: d.gpt.by });
          s.changed.push(x.to + '.cad');
          outcome = 'won';
        } else outcome = 'applied';
        d.gpt = { ver: x.ver, content: x.content, seq: x.seq, by: x.by };
        s.changed.push(x.to + '.gpt');
      } else {
        // an earlier save than the one held (saves are never equal: one seq per save)
        d.cad.push({ ver: x.ver, content: x.content, by: x.by });
        s.changed.push(x.to + '.cad');
        outcome = 'lost';
      }
      return { from: x.from, to: x.to, ver: x.ver, content: x.content, by: x.by, held: held, outcome: outcome };
    });
    s.inflight.dfsr = [];
    s.last = { kind: 'dfsr', items: items };
  }

  /** Rule 5: PC-B reads the GPC version on DC03; newer than applied (or forced) → apply DC03's files under it. */
  function refresh(s, ev) {
    var d = s.dcs[CLIENT_DC];
    var force = ev.kind === 'force';
    var gpc = d.gpc.ver, gpt = d.gpt.ver;
    var was = clone(s.client.applied);
    var outcome;
    if (force || gpc > s.client.applied.ver) {
      s.client.applied = { ver: gpc, content: d.gpt.content, gptVer: gpt };
      s.client.report = gpt !== gpc ? 'mismatch' : null;
      outcome = 'applied';
      if (JSON.stringify(was) !== JSON.stringify(s.client.applied)) s.changed.push('client');
    } else outcome = 'skipped';
    s.last = { kind: force ? 'force' : 'refresh', final: !!ev.final, gpc: gpc, gpt: gpt, content: d.gpt.content, was: was,
      outcome: outcome, stale: stale(s) };
  }

  function apply(prev, ev, p) {
    var s = clone(prev);
    s.t = ev.t;
    s.changed = [];
    if (ev.kind === 'edit') {
      var tm = timing(p);
      edit(s, ev, tm.ad, tm.dfsr);
    } else if (ev.kind === 'ad') deliverAd(s);
    else if (ev.kind === 'dfsr') deliverDfsr(s);
    else if (ev.kind === 'cut') {
      s.wan = 'down';
      var backAt = timing(p).backAt;
      // held: a send that arrives when the WAN comes back (it was due during the outage); a later one is not held up
      ['ad', 'dfsr'].forEach(function (k) { s.inflight[k].forEach(function (x) { x.held = x.due <= backAt; }); });
      s.changed.push('wan');
      s.last = { kind: 'cut', waiting: ['ad', 'dfsr'].filter(function (k) { return s.inflight[k].some(function (x) { return x.held; }); }),
        later: ['ad', 'dfsr'].filter(function (k) { return s.inflight[k].some(function (x) { return !x.held; }); }) };
    } else if (ev.kind === 'restore') {
      s.wan = 'up';
      var waiting = ['ad', 'dfsr'].filter(function (k) { return s.inflight[k].some(function (x) { return x.held; }); });
      ['ad', 'dfsr'].forEach(function (k) { s.inflight[k].forEach(function (x) { x.held = false; }); });
      s.changed.push('wan');
      s.last = { kind: 'restore', waiting: waiting };
    } else refresh(s, ev);
    return s;
  }

  var logic = {
    DCS: DCS,
    CLIENT_DC: CLIENT_DC,
    COMPUTER: COMPUTER,

    defaults: { wanCut: 'never', adDelay: 2, dfsrDelay: 4, refreshAt: 5, twoEditors: false },

    /** 4 to 8 steps (SPEC.md "Presets"). */
    steps: function (p) { return plan(p).length; },

    initial: initial,

    step: function (prev, n, p) {
      return apply(prev, plan(p)[n - 1], p);
    },

    // exported for tests and the page
    eff: eff,
    timing: timing,
    plan: plan,
    versionNumber: versionNumber,
    splitVersion: splitVersion,
    mismatch: mismatch,
    stale: stale
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
