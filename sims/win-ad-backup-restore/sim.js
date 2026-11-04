/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ad-backup-restore: two DCs, qm-dc01 backed up (or snapshotted), changed, restored (non-authoritatively,
   then optionally authoritatively) or reverted, and the pulls after it. Changes travel in blocks of 100 USNs. A pull
   asks above the high-watermark (from 0 when the source's invocationID changed), leaves out what the up-to-dateness
   vector covers, and applies the rest under the destination's own USNs; a reverted DC with its old invocationID reuses
   USNs its partner has already seen, which the partner never pulls, unless the partner's vector shows the source went
   backwards (event 2095, Netlogon paused, replication refused). Rules and numbers: SPEC.md (rule numbers below).
   The pull and dampening follow sims/win-ad-replication/sim.js @ 2797397 (rules 2-4 there), adapted to blocks and
   invocationIDs; nothing is shared code (models/ has no replication model yet).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DCS = ['DC01', 'DC02'];
  var BLOCK = 100;          // USNs per cell (SPEC.md "Scene")
  var BASE = 5000;          // qm-dc01's USN at the backup/snapshot (task)
  var USN0 = { DC01: BASE, DC02: 8200 };
  var INV = { DC01: 'a1f3', DC02: 'e52b' };
  var NEW_INV = 'b82e';     // qm-dc01's invocationID after a restore or a VM-GenID reset
  var DAYS = 3;             // the backup is 3 days old when it is restored (task)
  var AUTH_INC = 100000;    // version raise per day since the backup (rule 5, check)
  var STEPS = 7;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt, step) {
    var n = Number(v);
    if (!isFinite(n)) n = dflt;
    n = Math.round(n / step) * step;
    return Math.max(lo, Math.min(hi, n));
  }

  /** The params the model acts on (SPEC.md "Params"). */
  function eff(p) {
    var mode = p.mode === 'auth' || p.mode === 'revert' ? p.mode : 'nonauth';
    return {
      mode: mode,
      vmGenId: mode === 'revert' && !!p.vmGenId,
      writesAfter: clampInt(p.writesAfter, 100, 1000, 600, BLOCK),
      writesAfterRevert: clampInt(p.writesAfterRevert, 0, 1000, 400, BLOCK)
    };
  }

  /** The event of each step (SPEC.md "Timeline"). */
  function plan(p) {
    var e = eff(p);
    return [
      { kind: e.mode === 'revert' ? 'snapshot' : 'backup' },
      { kind: 'write', n: e.writesAfter, gen: 1, deleteOu: true },
      { kind: 'pull', dest: 'DC02', src: 'DC01' },
      { kind: e.mode === 'revert' ? 'revert' : 'restore', genId: e.vmGenId },
      e.mode === 'auth' ? { kind: 'auth' } : { kind: 'write', n: e.writesAfterRevert, gen: 2, deleteOu: false },
      { kind: 'pull', dest: 'DC02', src: 'DC01' },
      { kind: 'pull', dest: 'DC01', src: 'DC02' }
    ];
  }

  /** Rule 6: incoming OU change a beats held b: higher version; tie → later day; tie → higher invocationID. */
  function beats(a, b) {
    if (a.ver !== b.ver) return a.ver > b.ver;
    if (a.day !== b.day) return a.day > b.day;
    return a.inv > b.inv;
  }

  /** Rule 2: is the block left out for the destination? 'own', 'utd' or null. */
  function dampened(dest, blk) {
    if (blk.inv === dest.inv) return 'own';
    return (dest.utd[blk.inv] || 0) >= blk.usn ? 'utd' : null;
  }

  /** Rule 8: does the destination's vector show the source went backwards under the same invocationID? */
  function rolledBack(dest, src) {
    return (dest.utd[src.inv] || 0) > src.usn;
  }

  /** Rule 1: n originating changes on qm-dc01 in blocks of 100; with deleteOu the last block deletes the OU. */
  function write(s, ev) {
    var dc = s.dcs.DC01;
    var ids = [];
    for (var k = 0; k < ev.n / BLOCK; k++) {
      var isOu = ev.deleteOu && k === ev.n / BLOCK - 1;
      dc.usn += BLOCK;
      var blk = { id: s.blocks.length + 1, inv: dc.inv, gen: ev.gen, col: dc.usn / BLOCK - BASE / BLOCK - 1, usn: dc.usn,
        ou: isOu ? 'del' : null, ver: isOu ? dc.ou.ver + 1 : 0, day: s.day };
      s.blocks.push(blk);
      dc.held[blk.id] = { local: dc.usn, live: true };
      if (isOu) setOu(dc, blk);
      ids.push(blk.id);
    }
    s.last = { kind: 'write', dc: 'DC01', n: ev.n, from: dc.usn - ev.n, to: dc.usn, blocks: ids, gen: ev.gen };
  }

  /** The DC's OU becomes the block's change; the block it held for the OU stops being live. */
  function setOu(dc, blk) {
    if (dc.ou.by && dc.held[dc.ou.by]) dc.held[dc.ou.by].live = false;
    dc.ou = { exists: blk.ou !== 'del', ver: blk.ver, by: blk.id, inv: blk.inv, day: blk.day };
  }

  /** Rules 2, 3, 6, 8: one pull, destination ← source. */
  function pull(s, ev) {
    var src = s.dcs[ev.src], dest = s.dcs[ev.dest];
    var e = { kind: 'pull', dest: ev.dest, src: ev.src, hwm: dest.hwm[ev.src], from: null, to: null, reset: false,
      refused: null, detected: false, sent: [], left: [] };
    s.last = e;
    // rule 8: a source that went back under the same invocationID is caught by the destination's vector
    if (src.writable && rolledBack(dest, src)) {
      src.writable = false;
      src.netlogon = 'paused';
      s.events.push({ dc: ev.src, code: 2095, day: s.day });
      e.detected = true;
      e.refused = ev.src;
      e.utdSeen = dest.utd[src.inv];
      s.health = 'error';
      return;
    }
    if (!src.writable || !dest.writable) {
      e.refused = !src.writable ? ev.src : ev.dest;
      s.health = 'error';
      return;
    }
    // rule 3: the HWM was taken against another invocationID of the source: start from 0
    e.reset = dest.knows[ev.src] !== src.inv;
    e.from = e.reset ? 0 : dest.hwm[ev.src];
    var offered = Object.keys(src.held).map(Number)
      .filter(function (id) { return src.held[id].live && src.held[id].local > e.from; })
      .sort(function (a, b) { return src.held[a].local - src.held[b].local || a - b; });
    offered.forEach(function (id) {
      var blk = s.blocks[id - 1];
      var why = dampened(dest, blk);
      if (why) { e.left.push({ id: id, why: why }); return; }
      if (blk.ou) {
        var held = { ver: dest.ou.ver, day: dest.ou.day, inv: dest.ou.inv };
        if (!beats(blk, held)) { e.sent.push({ id: id, outcome: 'lost' }); return; }
        dest.usn += BLOCK;
        dest.held[id] = { local: dest.usn, live: true };
        setOu(dest, blk);
        e.sent.push({ id: id, outcome: 'applied', ou: true });
        return;
      }
      dest.usn += BLOCK;
      dest.held[id] = { local: dest.usn, live: true };
      e.sent.push({ id: id, outcome: 'applied' });
    });
    e.to = src.usn;
    dest.hwm[ev.src] = src.usn;
    dest.knows[ev.src] = src.inv;
    // win-ad-replication rule 4: take over the source's vector, and its own entry = its USN
    var vec = Object.assign({}, src.utd);
    vec[src.inv] = src.usn;
    Object.keys(vec).forEach(function (inv) {
      if (inv === dest.inv) return;
      if (!(vec[inv] <= (dest.utd[inv] || 0))) dest.utd[inv] = vec[inv];
    });
  }

  /** Step 1: the backup or snapshot holds a copy of qm-dc01's state. */
  function save(s, kind) {
    var dc = s.dcs.DC01;
    s.shelf.push({ dc: 'DC01', kind: kind === 'snapshot' ? 'vm-snapshot' : 'systemstate', day: s.day, usn: dc.usn, inv: dc.inv,
      image: clone(dc) });
    s.last = { kind: kind };
  }

  /** Rules 4, 7, 9: qm-dc01 gets the image back; a supported restore or VM-GenID gives a new invocationID. */
  function restore(s, ev) {
    var img = s.shelf[s.shelf.length - 1];
    var before = s.dcs.DC01;
    var dc = clone(img.image);
    var fresh = ev.kind === 'restore' || ev.genId;
    if (fresh) {
      dc.utd[dc.inv] = img.usn;   // the retired invocationID stays in the vector at the image's USN
      dc.inv = NEW_INV;
    }
    dc.dsrm = ev.kind === 'restore';
    s.dcs.DC01 = dc;
    s.last = { kind: ev.kind, genId: !!ev.genId, fresh: fresh, oldUsn: before.usn, oldInv: before.inv, inv: dc.inv, usn: dc.usn };
  }

  /** Rule 5: the authoritative restore of the OU raises its version by 100,000 per day since the backup. */
  function auth(s) {
    var dc = s.dcs.DC01;
    var img = s.shelf[s.shelf.length - 1];
    var days = s.day - img.day;
    dc.usn += BLOCK;
    var blk = { id: s.blocks.length + 1, inv: dc.inv, gen: 2, col: dc.usn / BLOCK - BASE / BLOCK - 1, usn: dc.usn, ou: 'auth',
      ver: dc.ou.ver + days * AUTH_INC, day: s.day };
    s.blocks.push(blk);
    dc.held[blk.id] = { local: dc.usn, live: true };
    var was = dc.ou.ver;
    setOu(dc, blk);
    s.last = { kind: 'auth', block: blk.id, days: days, was: was, ver: blk.ver, usn: dc.usn };
  }

  // ── what the page reads ──

  /** Who holds block id: { on1, on2 } (live), and whether it is overwritten on every DC that held it. */
  function where(s, id) {
    var h1 = s.dcs.DC01.held[id], h2 = s.dcs.DC02.held[id];
    return { on1: !!(h1 && h1.live), on2: !!(h2 && h2.live), dead: !!((h1 || h2) && !(h1 && h1.live) && !(h2 && h2.live)) };
  }

  /** A block on qm-dc01 only that qm-dc02 will never pull: its vector already covers the USN under the same
      invocationID. A block on qm-dc02 only that qm-dc01 will never get back: it originated under qm-dc01's current
      invocationID (it counts it as its own and leaves it out, rule 2), or qm-dc01 is quarantined. */
  function never(s, id) {
    var w = where(s, id), blk = s.blocks[id - 1];
    var d1 = s.dcs.DC01, d2 = s.dcs.DC02;
    if (w.on1 && !w.on2) return !d1.writable || !d2.writable || (blk.inv === d1.inv && (d2.utd[blk.inv] || 0) >= blk.usn);
    if (w.on2 && !w.on1) return !d1.writable || blk.inv === d1.inv;
    return false;
  }

  /** The god's-eye view (SPEC.md "Scene"): changes only one DC holds, how many will never arrive, and the OU. */
  function reality(s) {
    var only1 = 0, only2 = 0, never1 = 0, never2 = 0;
    s.blocks.forEach(function (b) {
      var w = where(s, b.id);
      if (w.on1 && !w.on2) { only1 += BLOCK; if (never(s, b.id)) never1 += BLOCK; }
      if (w.on2 && !w.on1) { only2 += BLOCK; if (never(s, b.id)) never2 += BLOCK; }
    });
    var o1 = s.dcs.DC01.ou, o2 = s.dcs.DC02.ou;
    var ouSame = o1.exists === o2.exists && o1.ver === o2.ver;
    return { only1: only1, only2: only2, never1: never1, never2: never2, ouSame: ouSame,
      inStep: !only1 && !only2 && ouSame };
  }

  var logic = {
    DCS: DCS,
    BLOCK: BLOCK,
    BASE: BASE,
    COLS: 10,

    defaults: { mode: 'nonauth', vmGenId: false, writesAfter: 600, writesAfterRevert: 400 },

    /** Seven events in every mode (SPEC.md "Timeline"). */
    steps: STEPS,

    initial: function () {
      var dcs = {};
      DCS.forEach(function (d) {
        var o = d === 'DC01' ? 'DC02' : 'DC01';
        var utd = {}, hwm = {}, knows = {};
        utd[INV[o]] = USN0[o];
        hwm[o] = USN0[o];
        knows[o] = INV[o];
        dcs[d] = { usn: USN0[d], inv: INV[d], netlogon: 'running', writable: true, dsrm: false, utd: utd, hwm: hwm, knows: knows,
          held: {}, ou: { exists: true, ver: 1, by: 0, inv: INV.DC01, day: -30 } };
      });
      return { day: 0, dcs: dcs, blocks: [], shelf: [], health: 'ok', events: [], last: null };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var ev = plan(p)[n - 1];
      if (n === 2) s.day = DAYS;    // the writes run over days 1–3; everything after is on day 3
      if (n >= 5) s.dcs.DC01.dsrm = ev.kind === 'auth';
      if (ev.kind === 'backup' || ev.kind === 'snapshot') save(s, ev.kind);
      else if (ev.kind === 'write') write(s, ev);
      else if (ev.kind === 'pull') pull(s, ev);
      else if (ev.kind === 'auth') auth(s);
      else restore(s, ev);
      return s;
    },

    // exported for tests and the page
    eff: eff,
    plan: plan,
    beats: beats,
    dampened: dampened,
    rolledBack: rolledBack,
    where: where,
    never: never,
    reality: reality
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
