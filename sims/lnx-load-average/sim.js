/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-load-average: load counts runnable and D-state tasks, not CPU percent.
   An explorer: the state is a pure function of the params (SPEC.md). The params define a workload (CPU tasks and I/O
   tasks started at t = 0, stopped after runFor); the model replays the kernel's 5-second samples and reads the scene
   at the cursor t.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. sampleLoad, loadAt and seriesOf hold no
   strings and no page code: promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // Rule 3: include/linux/sched/loadavg.h (checked against linux-headers 6.8.0): FSHIFT 11, FIXED_1 = 2048,
  // EXP_1 1884, EXP_5 2014, EXP_15 2037, LOAD_FREQ 5 s (5·HZ + 1 ticks). Used as fractions in floating point.
  var FIXED_1 = 2048;
  var EXP = [1884, 2014, 2037];
  var LOAD_FREQ = 5;            // seconds between samples
  var MAX_T = 1800;             // the t slider's end (30 min)
  var SHORT_SPAN = 300;         // the chart shows 0–5 min while t and runFor fit in it, else 0–30 min
  var MAX_CORES = 8;

  var defaults = { cores: 2, cpuTasks: 2, ioTasks: 0, runFor: 65, t: 65 };

  /** Rule 3: one sample. load = load·e + n·(1 − e) for each of the three averages, e = EXP_k / FIXED_1. */
  function sampleLoad(load, n) {
    return load.map(function (l, k) {
      var e = EXP[k] / FIXED_1;
      return l * e + n * (1 - e);
    });
  }

  /** Rules 1 and 5: the number the sample at time s counts: the CPU tasks (R, running or waiting for a core) plus the
      I/O tasks (D). The tasks start at 0 and still count at s = runFor; the stop takes effect after that sample. */
  function activeAt(p, s) {
    return s <= p.runFor ? p.cpuTasks + p.ioTasks : 0;
  }

  /** The last sample time at or before t (samples at 5, 10, 15 … s; none at 0). */
  function lastSample(t) {
    return Math.floor((t + 1e-9) / LOAD_FREQ) * LOAD_FREQ;
  }

  /** The three averages at time t: every sample from 5 s up to t replayed from 0 (rule 3). cores plays no part
      (rule 2). */
  function loadAt(p, t) {
    var load = [0, 0, 0];
    for (var s = LOAD_FREQ; s <= lastSample(t); s += LOAD_FREQ) load = sampleLoad(load, activeAt(p, s));
    return load;
  }

  /** [[s, l1, l5, l15], …] for s = 0, 5, … end: the whole curve the chart draws. */
  function seriesOf(p, end) {
    var load = [0, 0, 0];
    var out = [[0, 0, 0, 0]];
    for (var s = LOAD_FREQ; s <= end; s += LOAD_FREQ) {
      load = sampleLoad(load, activeAt(p, s));
      out.push([s, load[0], load[1], load[2]]);
    }
    return out;
  }

  /** The chart's time axis: 0–5 min while both t and runFor fit, else 0–30 min. */
  function spanOf(p) {
    return p.t <= SHORT_SPAN && p.runFor <= SHORT_SPAN ? SHORT_SPAN : MAX_T;
  }

  /** As uptime prints them: two decimals (the kernel rounds to the nearest hundredth). */
  function round2(x) { return Math.round(x * 100 + 1e-9) / 100; }

  /** Rule 6: the reading of the three numbers left to right. 'falling' l1 > l5 > l15 (a load that just started),
      'rising' l1 < l5 < l15 (higher earlier, easing), else 'flat' (all equal) or 'mixed'. Compared as printed. */
  function trendOf(load) {
    var a = round2(load[0]), b = round2(load[1]), c = round2(load[2]);
    if (a > b && b > c) return 'falling';
    if (a < b && b < c) return 'rising';
    if (a === b && b === c) return 'flat';
    return 'mixed';
  }

  /** Rule 4: the scene at the cursor. While the workload runs (t ≤ runFor), min(cpuTasks, cores) CPU tasks hold a
      core, the rest wait in the run queue, the I/O tasks sit on the disk lane. Task numbers: CPU tasks 1…c, I/O
      tasks c + 1…c + io. Cores are taken in order (core 0 first). */
  function sceneAt(p) {
    var on = p.t <= p.runFor;
    var c = on ? p.cpuTasks : 0;
    var io = on ? p.ioTasks : 0;
    var busy = Math.min(c, p.cores);
    var running = [], queued = [], dstate = [], coreTask = [];
    for (var i = 1; i <= c; i++) (i <= busy ? running : queued).push(i);
    for (var j = 1; j <= io; j++) dstate.push(c + j);
    for (var k = 0; k < p.cores; k++) coreTask.push(k < busy ? running[k] : null);
    var waiting = Math.min(io, p.cores - busy);   // idle cores with an I/O task waiting: shown as iowait (wa)
    return {
      on: on,
      running: running,
      queued: queued,
      dstate: dstate,
      coreTask: coreTask,
      n: c + io,
      cpuPct: busy / p.cores * 100,
      waPct: waiting / p.cores * 100,
      idlePct: (p.cores - busy - waiting) / p.cores * 100
    };
  }

  /** The state the page draws. */
  function initial(p) {
    var sc = sceneAt(p);
    var load = loadAt(p, p.t);
    var span = spanOf(p);
    return {
      t: p.t,
      cores: p.cores,
      runFor: p.runFor,
      on: sc.on,
      running: sc.running,
      queued: sc.queued,
      dstate: sc.dstate,
      coreTask: sc.coreTask,
      n: sc.n,
      load: load,
      printed: load.map(round2),
      perCore: load[0] / p.cores,
      cpuPct: sc.cpuPct,
      waPct: sc.waPct,
      idlePct: sc.idlePct,
      trend: trendOf(load),
      span: span,
      peak: p.cpuTasks + p.ioTasks,
      series: seriesOf(p, span)
    };
  }

  /** What moved between two states (the page marks it): load indices whose printed value changed, and cores whose
      busy/idle state flipped (a core that exists in only one state counts as flipped). */
  function changed(a, b) {
    if (!a || !b) return { load: [], cores: [] };
    var load = [];
    for (var k = 0; k < 3; k++) if (a.printed[k] !== b.printed[k]) load.push(k);
    var cores = [];
    for (var i = 0; i < b.cores; i++) {
      var was = i < a.cores ? a.coreTask[i] != null : null;
      var is = b.coreTask[i] != null;
      if (was !== is) cores.push(i);
    }
    return { load: load, cores: cores };
  }

  /** Which caption explains the state (the page words it). a: how to read the 1-minute load against the cores
      (rule 2); b: what is happening at the cursor (rules 4–6), or null.
      a, first that applies:
        cFirst     the tasks run but no sample has been taken yet (t < 5 s): the averages are still 0.00
        cZero      all three print 0.00 and there never was a workload
        cFaded     all three print 0.00 after the workload stopped: the averages have decayed
        cLag       the workload at the cursor wants more than the cores (n > cores) while the printed l1 is still ≤ cores:
                   the 1-minute average lags behind a queue that is there
        cDisk      only D tasks at the cursor, every core idle: the number counts disk waits, not a CPU queue
        cUnderOne  1 < l1 ≤ cores (the task's caption)
        cUnder     l1 ≤ 1 and l1 ≤ cores
        cOver      l1 > cores
      b: stopped → bRising or bStopped (null without a workload); running → bQueue (CPU tasks queued; before D),
      bDisk (D tasks beside running CPU tasks), bFalling, bSteady; null for cFirst, cZero, cFaded and cDisk. */
  function captionKey(s) {
    var l1 = s.printed[0];
    var allZero = s.printed[0] === 0 && s.printed[1] === 0 && s.printed[2] === 0;
    var a, b = null;
    if (s.on && s.n > 0 && lastSample(s.t) < LOAD_FREQ) return { a: 'cFirst', b: null };
    if (allZero) return { a: s.peak > 0 && !s.on ? 'cFaded' : 'cZero', b: null };
    if (s.on && s.n > s.cores && l1 <= s.cores) a = 'cLag';
    else if (s.on && s.dstate.length && !s.running.length) return { a: 'cDisk', b: null };
    else if (l1 <= s.cores) a = l1 > 1 ? 'cUnderOne' : 'cUnder';
    else a = 'cOver';
    if (!s.on) {
      if (s.peak > 0) b = s.trend === 'rising' ? 'bRising' : 'bStopped';
    } else if (s.queued.length) b = 'bQueue';
    else if (s.dstate.length) b = 'bDisk';
    else if (s.trend === 'falling') b = 'bFalling';
    else b = 'bSteady';
    return { a: a, b: b };
  }

  var presets = [
    { id: 'book-yes', params: { cores: 2, cpuTasks: 2, ioTasks: 0, runFor: 65, t: 65 } },
    { id: 'book-top-later', params: { cores: 2, cpuTasks: 2, ioTasks: 0, runFor: 65, t: 80 } },
    { id: 'one-core-queue', params: { cores: 1, cpuTasks: 2, ioTasks: 0, runFor: 600, t: 600 } },
    { id: 'io-bound', params: { cores: 4, cpuTasks: 0, ioTasks: 4, runFor: 600, t: 600 } },
    { id: 'easing', params: { cores: 4, cpuTasks: 4, ioTasks: 0, runFor: 600, t: 900 } }
  ];

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    sampleLoad: sampleLoad,
    activeAt: activeAt,
    lastSample: lastSample,
    loadAt: loadAt,
    seriesOf: seriesOf,
    spanOf: spanOf,
    round2: round2,
    trendOf: trendOf,
    sceneAt: sceneAt,
    changed: changed,
    captionKey: captionKey,
    EXP: EXP,
    FIXED_1: FIXED_1,
    LOAD_FREQ: LOAD_FREQ,
    MAX_T: MAX_T,
    MAX_CORES: MAX_CORES
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
