/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for backup-window: data size vs bandwidth vs backup window, and why the first offsite copy goes by truck.
   An explorer: the state is a pure function of the params (no steps). From the data size, the daily change rate, the
   link speed and its efficiency, and the length of the nightly backup window it derives how long the first full copy
   and the nightly incremental take, how many nights seeding over the link needs, whether the nightly change fits,
   how long the changes queued during seeding take to drain, and what the same seeding costs by truck (copy to disks,
   drive, copy in).
   Rules: SPEC.md. All arithmetic is in whole seconds (rounded once per transfer), so equal times compare equal.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. No words here. */
(function (root) {
  'use strict';

  var TB = 1e12;                 // bytes (decimal, as link speeds are quoted)
  var MBIT = 1e6;                // bit/s
  var MB = 1e6;                  // bytes/s
  var HOUR = 3600;
  var DAY = 86400;
  var SEED_NIGHTS_MAX = 3;       // the truck lane appears when seeding over the link needs more nights than this
  var WINDOW_MIDDLE = 13;        // the window is centred on 01:00, i.e. 13 h after noon (12 h: 19:00–07:00)

  var LINKS = [20, 50, 80, 300, 500, 1000, 10000];
  var SEED_BY = ['link', 'truck'];

  var defaults = {
    sizeTB: 21.4, changePct: 1, linkMbit: 1000, efficiency: 0.8, windowH: 12, localMBs: 200, driveH: 2, seedBy: 'link'
  };

  var RANGES = {
    sizeTB: [0.5, 100], changePct: [0.1, 10], efficiency: [0.5, 1], windowH: [4, 14], localMBs: [100, 1000], driveH: [0, 12]
  };

  /** Presets: sizes and links from the DR estate (student side), efficiency 1.0 so the times match the task. */
  var presets = [
    { id: 'hq-to-cloud', params: { sizeTB: 21.4, changePct: 1, linkMbit: 1000, efficiency: 1, windowH: 12, seedBy: 'link' } },
    { id: 'brk-uplink', params: { sizeTB: 21.4, changePct: 1, linkMbit: 50, efficiency: 1, windowH: 12, seedBy: 'link' } },
    { id: 'truck', params: { sizeTB: 21.4, changePct: 1, linkMbit: 50, efficiency: 1, windowH: 12, localMBs: 200, driveH: 2, seedBy: 'truck' } },
    { id: 'vm-dumps-to-nas', params: { sizeTB: 10.4, changePct: 1, linkMbit: 1000, efficiency: 1, windowH: 12, seedBy: 'link' } },
    { id: 'never-catches-up', params: { sizeTB: 5, changePct: 2, linkMbit: 20, efficiency: 1, windowH: 8, seedBy: 'link' } }
  ];

  function num(v, key) {
    var x = Number(v), r = RANGES[key];
    if (!Number.isFinite(x)) x = defaults[key];
    return Math.min(r[1], Math.max(r[0], x));
  }

  /** Params → clean values (a URL may carry anything). */
  function norm(p) {
    p = p || {};
    var link = Number(p.linkMbit);
    return {
      sizeTB: num(p.sizeTB, 'sizeTB'),
      changePct: num(p.changePct, 'changePct'),
      linkMbit: LINKS.indexOf(link) >= 0 ? link : defaults.linkMbit,
      efficiency: num(p.efficiency, 'efficiency'),
      windowH: num(p.windowH, 'windowH'),
      localMBs: num(p.localMBs, 'localMBs'),
      driveH: num(p.driveH, 'driveH'),
      seedBy: SEED_BY.indexOf(p.seedBy) >= 0 ? p.seedBy : defaults.seedBy
    };
  }

  /** Rule 1: seconds to move `bytes` over a link of `linkMbit` at `efficiency` (bytes × 8 / usable bit/s). */
  function transferS(bytes, linkMbit, efficiency) {
    return Math.round(bytes * 8 / (linkMbit * MBIT * efficiency));
  }

  /** Rule 2: the nightly incremental moves the day's changed share of the data. */
  function changedBytes(sizeTB, changePct) { return sizeTB * TB * changePct / 100; }

  /** Rule 4: nights to seed over the link (only inside the window), and the hours from the first night's start to
      the end of the copy (full nights in between count 24 h each). */
  function seedNights(fullS, windowS) { return Math.max(1, Math.ceil(fullS / windowS)); }
  function linkElapsedS(fullS, windowS) {
    var n = seedNights(fullS, windowS);
    return (n - 1) * DAY + (fullS - (n - 1) * windowS);
  }

  /** Rule 5: copy out to local disks, drive, copy in at the other end, at the same local rate. */
  function truckParts(sizeTB, localMBs, driveH) {
    var copy = Math.round(sizeTB * TB / (localMBs * MB));
    return { out: copy, drive: Math.round(driveH * HOUR), in: copy };
  }

  /** Rule 6: equal times prefer the link (no disks to handle). */
  function faster(linkS, truckS) { return linkS <= truckS ? 'link' : 'truck'; }

  /** Rule 4: the changes of every day the seeding took wait in a queue; each later night drains what the window has
      left after that night's own change. Nights to drain, or null when the change takes the whole window or more
      (incrS ≥ windowS: the queue never shrinks). */
  function catchUp(days, incrS, windowS) {
    var backlog = days * incrS;
    if (backlog === 0) return { backlogS: 0, nights: 0, growS: 0 };
    if (incrS >= windowS) return { backlogS: backlog, nights: null, growS: incrS - windowS };
    return { backlogS: backlog, nights: Math.ceil(backlog / (windowS - incrS)), growS: 0 };
  }

  /** The whole state, from the params. Times are in seconds; the page converts. */
  function compute(params, opts) {
    var p = norm(params);
    var maxNights = opts && opts.seedNightsMax != null ? opts.seedNightsMax : SEED_NIGHTS_MAX;
    var windowS = Math.round(p.windowH * HOUR);
    var bytes = p.sizeTB * TB;
    var incrBytes = changedBytes(p.sizeTB, p.changePct);
    var fullS = transferS(bytes, p.linkMbit, p.efficiency);
    var incrS = transferS(incrBytes, p.linkMbit, p.efficiency);
    var nights = seedNights(fullS, windowS);
    var linkS = linkElapsedS(fullS, windowS);
    var tp = truckParts(p.sizeTB, p.localMBs, p.driveH);
    var truckS = tp.out + tp.drive + tp.in;
    var seedS = p.seedBy === 'truck' ? truckS : linkS;
    var days = Math.ceil(seedS / DAY);
    var cu = catchUp(days, incrS, windowS);
    return {
      p: p,
      windowS: windowS,
      windowFrom: WINDOW_MIDDLE - p.windowH / 2,      // hours after noon
      bytes: bytes,
      incrBytes: incrBytes,
      fullS: fullS,
      incrS: incrS,
      perTBS: transferS(TB, p.linkMbit, p.efficiency),
      fullFits: fullS <= windowS,                    // rule 3 for a nightly full
      fitsNightly: incrS <= windowS,                 // rule 3
      overflowS: Math.max(0, incrS - windowS),
      nightsToSeed: nights,
      linkS: linkS,
      truck: tp,
      truckS: truckS,
      showTruck: nights > maxNights || p.seedBy === 'truck',
      best: faster(linkS, truckS),
      slower: p.seedBy === 'link' ? truckS < linkS : linkS < truckS,   // the chosen plan is strictly slower than the other
      seedS: seedS,
      seedDays: days,
      backlogS: cu.backlogS,
      catchUpNights: cu.nights,
      growS: cu.growS
    };
  }

  /** The outputs that cross a threshold: the page marks a tile "changed" when one of them flips. */
  function verdicts(s) {
    return {
      fullFits: s.fullFits,
      fitsNightly: s.fitsNightly,
      showTruck: s.showTruck,
      best: s.showTruck ? s.best : null,            // the faster plan counts only while the truck lane shows it
      catchesUp: s.catchUpNights !== null
    };
  }
  function flipped(a, b) {
    if (!a || !b) return [];
    var va = verdicts(a), vb = verdicts(b);
    return Object.keys(vb).filter(function (k) { return va[k] !== vb[k]; });
  }

  /** The caption's main sentence and its notes, as keys the page turns into words. */
  function captionKey(s) {
    var notes = [];
    var key;
    // the nightly overflow wins over every seeding plan: whichever way the first copy travels, the copy never catches up
    if (!s.fitsNightly) key = s.overflowS > (24 - s.p.windowH) * HOUR ? 'cIncrNoDay' : 'cIncrOver';
    else if (s.p.seedBy === 'truck') key = 'cTruck';
    else if (s.fullFits) key = 'cAllFit';
    else if (!s.showTruck) key = 'cFewNights';
    else key = 'cLongSeed';
    if (key === 'cTruck' && s.best === 'link') notes.push('nLinkFaster');
    if (key === 'cLongSeed' && s.best === 'link') notes.push('nLinkStill');
    if (s.fitsNightly && !s.fullFits) {
      if (s.catchUpNights === null) notes.push('nNeverDrains');
      else if (s.catchUpNights > 0) notes.push('nCatchUp');
    }
    return { key: key, notes: notes };
  }

  var logic = {
    defaults: defaults,
    initial: compute,
    compute: compute,
    presets: presets,
    LINKS: LINKS,
    SEED_NIGHTS_MAX: SEED_NIGHTS_MAX,
    norm: norm,
    transferS: transferS,
    changedBytes: changedBytes,
    seedNights: seedNights,
    linkElapsedS: linkElapsedS,
    truckParts: truckParts,
    faster: faster,
    catchUp: catchUp,
    verdicts: verdicts,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
