/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the exercise countdown: a projector-sized timer for in-class exercises (docs/tasks/w3/countdown.md,
   catalogue tool-countdown). A tool (lecturer-only, docs/site-structure.md §2.1): no steps.
   Pure: no DOM, no Math.random, no Date, no timers (docs/sim-ui.md §5). The clock lives in the page: it reads
   Date.now() and passes `now` (ms) into every function here; tests pass chosen values. Because everything shown is
   computed from timestamps, a throttled background tab is correct again on its next frame (rule 6).
   Timer state is plain JSON:
     { durationMs, status: 'idle'|'running'|'paused'|'done', startedAt|null, pausedAt|null, pausedTotalMs, warnAtMs }
   The page loads this as a classic script (window.SimLogic); node tests require() it. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var SEC = 1000;
  var MIN = 60 * SEC;
  /** Longest timer: 99:59, so the display stays mm:ss with two digits of minutes. */
  var MAX_MS = 99 * MIN + 59 * SEC;
  /** Shortest timer the −1 min button leaves before the start (the seconds slider's step). */
  var MIN_MS = 5 * SEC;

  var defaults = { minutes: 5, seconds: 0, warn: 60, label: 'none', sound: false };

  function clampDuration(ms) { return Math.max(MIN_MS, Math.min(MAX_MS, Math.round(ms))); }

  /** The duration the params choose: minutes + seconds. */
  function durationOf(p) { return clampDuration(Number(p.minutes) * MIN + Number(p.seconds) * SEC); }

  /** A fresh, idle timer. */
  function create(durationMs, warnAtMs) {
    return { durationMs: clampDuration(durationMs), status: 'idle', startedAt: null, pausedAt: null, pausedTotalMs: 0,
      warnAtMs: Math.max(0, Number(warnAtMs) || 0) };
  }

  function copy(s, patch) { return Object.assign({}, s, patch); }

  /** Time the timer has run: paused time does not count; idle is 0. Done keeps counting (for +1 min after the end). */
  function elapsed(s, now) {
    if (s.status === 'idle' || s.startedAt === null) return 0;
    var upTo = s.status === 'paused' ? s.pausedAt : now;
    return Math.max(0, upTo - s.startedAt - s.pausedTotalMs);
  }

  /** Rule 1: remaining = max(0, duration − (now − startedAt − pausedTotal)). */
  function remaining(s, now) {
    if (s.status === 'done') return 0;
    return Math.max(0, s.durationMs - elapsed(s, now));
  }

  /** Whole seconds shown: rounded up, so 0 only at the very end. */
  function shownSeconds(ms) { return Math.ceil(ms / SEC); }

  /** mm:ss of the shown seconds (minutes not padded: 5:00, 12:30, 0:07). */
  function clock(ms) {
    var t = shownSeconds(ms);
    var m = Math.floor(t / 60), sec = t % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /** Rule 3: running while remaining > warnAt; warning while 0 < remaining ≤ warnAt; done at 0. Idle is its own. */
  function phaseOf(s, rem) {
    if (s.status === 'idle') return 'idle';
    if (s.status === 'done' || rem <= 0) return 'done';
    return rem <= s.warnAtMs ? 'warning' : 'running';
  }

  /** Wall-clock hh:mm of a time in ms since the epoch, shifted by offsetMin (the page passes −getTimezoneOffset()),
      rounded to the nearest minute (half a minute rounds up). */
  function clockTime(ms, offsetMin) {
    var mins = Math.floor((ms + 30 * SEC) / MIN) + (offsetMin || 0);
    var day = ((mins % 1440) + 1440) % 1440;
    var hh = Math.floor(day / 60), mm = day % 60;
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /** Everything the page shows, from the state and the time. endClock: when it ends (running or paused: now +
      remaining; idle: null; done: when it ended). fraction: remaining / duration, 1 → 0. */
  function view(s, now, offsetMin) {
    var rem = remaining(s, now);
    var phase = phaseOf(s, rem);
    var end = null;
    if (s.status === 'running' || s.status === 'paused') end = now + rem;
    else if (s.status === 'done') end = s.startedAt + s.pausedTotalMs + s.durationMs;
    return {
      remainingMs: rem,
      shownSeconds: shownSeconds(rem),
      clock: clock(rem),
      minutesLeft: Math.ceil(rem / MIN),
      phase: phase,
      status: s.status,
      paused: s.status === 'paused',
      fraction: s.durationMs > 0 ? rem / s.durationMs : 0,
      endClock: end === null ? null : clockTime(end, offsetMin)
    };
  }

  // ── actions: each returns a new state (or the same object when nothing changes) ──

  /** Start from idle, or resume from pause (rule 2: resume adds now − pausedAt to pausedTotal). */
  function start(s, now) {
    if (s.status === 'idle') return copy(s, { status: 'running', startedAt: now, pausedAt: null, pausedTotalMs: 0 });
    if (s.status === 'paused') return copy(s, { status: 'running', pausedTotalMs: s.pausedTotalMs + Math.max(0, now - s.pausedAt), pausedAt: null });
    return s;
  }

  /** Rule 2: pause stores pausedAt. */
  function pause(s, now) {
    if (s.status !== 'running') return s;
    return copy(s, { status: 'paused', pausedAt: now });
  }

  /** Reset: idle with the same duration (and warning). */
  function reset(s) { return create(s.durationMs, s.warnAtMs); }

  /** Space: idle → running, running → paused, paused → running, done → idle (clears "time is up"). */
  function toggle(s, now) {
    if (s.status === 'running') return pause(s, now);
    if (s.status === 'done') return reset(s);
    return start(s, now);
  }

  /** The end is reached: a running (or paused, after −1 min) timer whose remaining time is 0 becomes done. The page calls it every frame; a new
      object means the timer just ended (the moment for the tone). */
  function settle(s, now) {
    if (s.status === 'running' && remaining(s, now) <= 0) return copy(s, { status: 'done' });
    // paused and cut to 0 by −1 min: it ends now, so the pause so far joins pausedTotal and the end is `now`
    if (s.status === 'paused' && remaining(s, now) <= 0) {
      return copy(s, { status: 'done', pausedAt: null, pausedTotalMs: s.pausedTotalMs + Math.max(0, now - s.pausedAt) });
    }
    return s;
  }

  /** Rule 4: +1 / −1 min. Running or paused: the duration moves, never below the time already run (so −1 min with
      30 s left ends the timer). Idle: the duration moves within 0:05…99:59. Done: +1 min starts a new one-minute
      run from now, however long the timer stood finished; −1 min does nothing. The duration never exceeds 99:59. */
  function adjust(s, deltaMs, now) {
    if (s.status === 'idle') {
      var d = clampDuration(s.durationMs + deltaMs);
      return d === s.durationMs ? s : copy(s, { durationMs: d });
    }
    if (s.status === 'done') {
      if (deltaMs <= 0) return s;
      return copy(s, { status: 'running', durationMs: Math.min(MAX_MS, deltaMs), startedAt: now, pausedAt: null, pausedTotalMs: 0 });
    }
    var next = Math.min(MAX_MS, Math.max(elapsed(s, now), s.durationMs + deltaMs));
    return next === s.durationMs ? s : copy(s, { durationMs: next });
  }

  /** Can this adjustment change anything? (for aria-disabled on the buttons) */
  function canAdjust(s, deltaMs, now) { return adjust(s, deltaMs, now) !== s; }

  /** The warning threshold changed in the panel: applies at once, the timer keeps running. */
  function setWarn(s, warnAtMs) {
    return s.warnAtMs === warnAtMs ? s : copy(s, { warnAtMs: warnAtMs });
  }

  /** The page's settings changed (kit params, a preset or R). Decides what happens to the timer:
      R or a preset loaded (`reset`, the page knows which), a new duration (minutes, seconds), or a change with nothing
      different → a fresh idle timer with the chosen duration; anything else (warning, title, sound changed by hand)
      keeps the timer running and only takes the new warning. prevCfg null = first load. */
  function reconcile(s, prevCfg, cfg, reset) {
    if (!s || !prevCfg || reset) return create(cfg.durationMs, cfg.warnAtMs);
    var same = Object.keys(cfg).every(function (k) { return cfg[k] === prevCfg[k]; });
    if (same || cfg.durationMs !== prevCfg.durationMs) return create(cfg.durationMs, cfg.warnAtMs);
    return setWarn(s, cfg.warnAtMs);
  }

  /** A stored timer (sessionStorage, kept across the language switch's reload), repaired; null if unusable. */
  function sanitize(x) {
    if (!x || typeof x !== 'object') return null;
    var st = ['idle', 'running', 'paused', 'done'].indexOf(x.status) >= 0 ? x.status : null;
    var num = function (v) { return typeof v === 'number' && Number.isFinite(v) ? v : null; };
    if (!st || num(x.durationMs) === null || x.durationMs <= 0 || num(x.warnAtMs) === null) return null;
    var s = create(x.durationMs, x.warnAtMs);
    if (st === 'idle') return s;
    if (num(x.startedAt) === null || (st === 'paused' && num(x.pausedAt) === null)) return s;
    s.status = st;
    s.startedAt = x.startedAt;
    s.pausedAt = st === 'paused' ? x.pausedAt : null;
    s.pausedTotalMs = Math.max(0, num(x.pausedTotalMs) || 0);
    s.durationMs = Math.min(MAX_MS, Math.max(0, x.durationMs));
    return s;
  }

  var api = {
    SEC: SEC, MIN: MIN, MAX_MS: MAX_MS, MIN_MS: MIN_MS,
    defaults: defaults,
    durationOf: durationOf, create: create, elapsed: elapsed, remaining: remaining, shownSeconds: shownSeconds,
    clock: clock, phaseOf: phaseOf, clockTime: clockTime, view: view,
    start: start, pause: pause, reset: reset, toggle: toggle, settle: settle, adjust: adjust, canAdjust: canAdjust,
    setWarn: setWarn, reconcile: reconcile, sanitize: sanitize,
    /** The kit's state is the configuration the params choose; the timer itself lives in the page. A new object
        from the kit (its cache is cleared on every param change, preset and R) is what reconcile() looks at. */
    initial: function (p) {
      return { durationMs: durationOf(p), warnAtMs: Number(p.warn) * SEC, label: p.label, sound: !!p.sound };
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SimLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
