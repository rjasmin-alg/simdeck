/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-timers-cron: cron vs systemd timers — missed runs, Persistent=, randomised delay.
   Time passes with the machine off. Two lanes of scheduled jobs (a crontab line, a timer that activates a service)
   run over a timeline; one step = the clock advanced to the next event (a scheduled time, a shutdown, a boot, a
   delayed start), and at each event every job applies its rules in lane order (cron first, then the timer).
   Rules and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. Randomness through the kit's Simdeck.rng(seed). State is plain
   JSON. Time is whole seconds since Mon 2026-08-31 00:00:00 local time (the book's week); the calendar arithmetic
   is integer only (days from civil), with no time zones (out of scope) beyond the CEST/CET label.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var kitRng = root.Simdeck && root.Simdeck.rng ? root.Simdeck.rng
    : (typeof require === 'function' ? require('../../kit/kit.js').rng : null);

  var MIN = 60, HOUR = 3600, DAY = 86400;

  // ── the calendar: integer days from 2026-08-31 (day 0, a Monday) ──

  /** Days from 1970-01-01 to y-m-d (H. Hinnant's days_from_civil). */
  function daysFromCivil(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  var DAY0 = daysFromCivil(2026, 8, 31);

  /** Civil date of day d (0 = Mon 2026-08-31): { y, m, dom, dow } with dow 0 = Monday … 6 = Sunday. */
  function civil(d) {
    var z = DAY0 + d + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var dom = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    var y = yoe + era * 400 + (m <= 2 ? 1 : 0);
    return { y: y, m: m, dom: dom, dow: ((d % 7) + 7) % 7 };
  }
  function dayOf(t) { return Math.floor(t / DAY); }

  /** Central European summer time, for the zone label only: last Sunday of March to last Sunday of October. */
  function lastSunday(y, m) {
    var last = m === 3 ? 31 : 31; // March and October both have 31 days
    var d = daysFromCivil(y, m, last) - DAY0;
    return last - ((civil(d).dow + 1) % 7); // dow 6 = Sunday
  }
  function zone(t) {
    var c = civil(dayOf(t));
    if (c.m > 3 && c.m < 10) return 'CEST';
    if (c.m === 3) return c.dom >= lastSunday(c.y, 3) ? 'CEST' : 'CET';
    if (c.m === 10) return c.dom < lastSunday(c.y, 10) ? 'CEST' : 'CET';
    return 'CET';
  }

  // ── the two kinds of schedule ──

  /** Rule 1–2: a crontab line's five fields. null = '*'. dow in cron numbering, 0 or 7 = Sunday.
      Day-of-month and day-of-week both restricted → either may match (logical OR); otherwise both must. */
  function cronDayMatches(spec, d) {
    var c = civil(d);
    var cdow = (c.dow + 1) % 7; // Monday → 1, Sunday → 0
    var monOk = spec.mon == null || spec.mon.indexOf(c.m) >= 0;
    var domOk = spec.dom == null || spec.dom.indexOf(c.dom) >= 0;
    var dowOk = spec.dow == null || spec.dow.indexOf(cdow) >= 0 || (cdow === 0 && spec.dow.indexOf(7) >= 0);
    var day = spec.dom != null && spec.dow != null ? (domOk || dowOk) : (domOk && dowOk);
    return monOk && day;
  }
  /** Rule 3: an OnCalendar= expression: weekday list (0 = Mon), date, time. Every given part must hold (AND). */
  function timerDayMatches(spec, d) {
    var c = civil(d);
    return (spec.dow == null || spec.dow.indexOf(c.dow) >= 0) &&
      (spec.mon == null || spec.mon.indexOf(c.m) >= 0) &&
      (spec.dom == null || spec.dom.indexOf(c.dom) >= 0);
  }
  function dayMatches(spec, d) { return spec.kind === 'cron' ? cronDayMatches(spec, d) : timerDayMatches(spec, d); }
  function timeOfDay(spec) { return spec.hour * HOUR + spec.min * MIN + (spec.sec || 0); }

  var SEARCH_DAYS = 3 * 366;
  /** The first scheduled time strictly after t, or null within three years. */
  function nextTick(spec, t) {
    var tod = timeOfDay(spec);
    for (var d = dayOf(t), end = d + SEARCH_DAYS; d <= end; d++) {
      var x = d * DAY + tod;
      if (x > t && dayMatches(spec, d)) return x;
    }
    return null;
  }
  /** The last scheduled time strictly before t, or null. */
  function prevTick(spec, t) {
    var tod = timeOfDay(spec);
    for (var d = dayOf(t), end = d - SEARCH_DAYS; d >= end; d--) {
      var x = d * DAY + tod;
      if (x < t && dayMatches(spec, d)) return x;
    }
    return null;
  }
  /** Every scheduled time in (a, b]. */
  function ticksIn(spec, a, b) {
    var out = [], x = nextTick(spec, a);
    while (x != null && x <= b) { out.push(x); x = nextTick(spec, x); }
    return out;
  }

  // ── randomised delay (rule 6) ──

  /** RandomizedDelaySec=: an evenly distributed delay in [0, max) whole seconds, fixed by the seed and the time it is
      added to (a scheduled time, or the boot time for a catch-up), so replays and step back agree. */
  function delayFor(seed, at, max) {
    if (!max) return 0;
    var r = kitRng(((Math.imul(seed | 0, 2654435761) ^ (at | 0)) >>> 0) || 1);
    r(); // the first draw of mulberry32 is close to linear in nearby seeds; skip it
    return Math.floor(r() * max);
  }

  // ── scenes: the jobs and the window of each preset ──

  var D = function (d, h, m) { return d * DAY + (h || 0) * HOUR + (m || 0) * MIN; };
  var WEEKDAYS = [0, 1, 2, 3, 4];

  var SCENES = {
    // ch10 Primjer 2 and 3: the book's week, Mon 2026-08-31 00:00 → Mon 2026-09-07 00:00
    arhiva: {
      start: D(0), end: D(7),
      cron: { kind: 'cron', min: 30, hour: 3, dom: null, mon: null, dow: null, fields: ['30', '3', '*', '*', '*'], cmd: '/usr/local/sbin/arhiva.sh' },
      timer: { kind: 'timer', name: 'arhiva', dow: WEEKDAYS, dom: null, mon: null, hour: 3, min: 30, cal: 'Mon..Fri *-*-* 03:30:00' }
    },
    // daily over a long weekend: Thu 2026-09-03 12:00 → Mon 2026-09-07 12:00
    daily: {
      start: D(3, 12), end: D(7, 12),
      cron: { kind: 'cron', min: 0, hour: 0, dom: null, mon: null, dow: null, fields: ['0', '0', '*', '*', '*'], cmd: '/usr/local/sbin/arhiva.sh' },
      timer: { kind: 'timer', name: 'arhiva', dow: null, dom: null, mon: null, hour: 0, min: 0, cal: 'daily' }
    },
    // ch10 `systemctl cat logrotate.timer`, three nights: Mon 2026-08-31 12:00 → Thu 2026-09-03 12:00
    logrotate: {
      start: D(0, 12), end: D(3, 12),
      cron: { kind: 'cron', min: 0, hour: 0, dom: null, mon: null, dow: null, fields: ['0', '0', '*', '*', '*'], cmd: '/usr/sbin/logrotate /etc/logrotate.conf' },
      timer: { kind: 'timer', name: 'logrotate', dow: null, dom: null, mon: null, hour: 0, min: 0, cal: 'daily' }
    },
    // ch10 the OR trap, September 2026: Tue 2026-09-01 00:00 → Thu 2026-10-01 00:00
    'cron-or': {
      start: D(1), end: D(31),
      cron: { kind: 'cron', min: 0, hour: 3, dom: [1], mon: null, dow: [1], fields: ['0', '3', '1', '*', '1'], cmd: '/usr/local/sbin/mjesecno.sh' },
      timer: { kind: 'timer', name: 'mjesecno', dow: [0], dom: [1], mon: null, hour: 3, min: 0, cal: 'Mon *-*-01 03:00:00' }
    }
  };
  var SCENE_IDS = Object.keys(SCENES);

  /** Power-off and boot times the page offers: each day of the book's week (and the next Monday) at these times. */
  var OFF_TIMES = [[3, 30], [8, 0], [18, 0], [22, 0]];
  var OFF_OPTIONS = [];
  for (var od = 0; od <= 7; od++) OFF_TIMES.forEach(function (hm) { OFF_OPTIONS.push(D(od, hm[0], hm[1])); });

  var PRESETS = [
    { id: 'book-arhiva', params: { scene: 'arhiva', persistent: true, delay: 0, offFrom: String(D(1, 22)), offTo: String(D(2, 8)), seed: 3 } },
    { id: 'no-persistent', params: { scene: 'arhiva', persistent: false, delay: 0, offFrom: String(D(1, 22)), offTo: String(D(2, 8)), seed: 3 } },
    { id: 'long-weekend', params: { scene: 'daily', persistent: true, delay: 0, offFrom: String(D(4, 18)), offTo: String(D(7, 8)), seed: 3 } },
    { id: 'randomized', params: { scene: 'logrotate', persistent: true, delay: HOUR, offFrom: 'none', offTo: String(D(2, 8)), seed: 3 } },
    { id: 'cron-or-trap', params: { scene: 'cron-or', persistent: true, delay: 0, offFrom: 'none', offTo: String(D(2, 8)), seed: 3 } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    var seed = Math.round(Number(p.seed));
    var from = p.offFrom === 'none' ? 'none' : (OFF_OPTIONS.indexOf(Number(p.offFrom)) >= 0 ? String(Number(p.offFrom)) : (p.offFrom === undefined ? d.offFrom : 'none'));
    var to = OFF_OPTIONS.indexOf(Number(p.offTo)) >= 0 ? String(Number(p.offTo)) : d.offTo;
    return {
      scene: SCENES[p.scene] ? p.scene : d.scene,
      persistent: p.persistent === undefined ? d.persistent : (p.persistent === true || p.persistent === 'true' || p.persistent === 1),
      delay: Number(p.delay) === HOUR ? HOUR : 0,
      offFrom: from,
      offTo: to,
      seed: isFinite(seed) && p.seed !== null && p.seed !== '' ? Math.min(99, Math.max(1, seed)) : d.seed
    };
  }

  /** The outage as one half-open interval [from, to): off at `from`, up again at `to`. Reversed picks are swapped;
      equal ones mean no outage. */
  function powerOf(p) {
    if (p.offFrom === 'none') return [];
    var a = Number(p.offFrom), b = Number(p.offTo);
    if (a === b) return [];
    return [{ from: Math.min(a, b), to: Math.max(a, b) }];
  }
  /** Rule 7: on at t unless from ≤ t < to — a boot exactly at a scheduled time counts as on, a shutdown as off. */
  function isOn(power, t) {
    for (var i = 0; i < power.length; i++) if (t >= power[i].from && t < power[i].to) return false;
    return true;
  }

  function initial(params) {
    var p = norm(params);
    var sc = SCENES[p.scene];
    var power = powerOf(p);
    var t0 = sc.start;
    // the timer was enabled long before the window: its last trigger is the previous scheduled time (plus its delay)
    // the last scheduled time before the window at which the machine was on (an outage may start before the window)
    var prev = prevTick(sc.timer, t0);
    while (prev != null && !isOn(power, prev)) prev = prevTick(sc.timer, prev);
    var last = prev == null ? null : Math.min(t0, prev + delayFor(p.seed, prev, p.delay));
    var on = isOn(power, t0);
    return {
      scene: p.scene, start: sc.start, end: sc.end, now: t0, on: on, power: power, seed: p.seed,
      jobs: [
        { kind: 'cron', id: 'cron', spec: clone(sc.cron), runs: [], missed: [] },
        { kind: 'timer', id: 'timer', spec: clone(sc.timer), name: sc.timer.name, persistent: p.persistent, delay: p.delay,
          lastTrigger: on ? last : null, stamp: p.persistent ? last : null, pending: null,
          runs: [], missed: [], absorbed: [] }
      ],
      last: null, changed: [], events: []
    };
  }

  function job(s, kind) { return s.jobs[kind === 'cron' ? 0 : 1]; }

  /** The time of the next event after s.now within the window, or null. */
  function nextEvent(s) {
    var c = [];
    s.power.forEach(function (w) { if (w.from > s.now) c.push(w.from); if (w.to > s.now) c.push(w.to); });
    var cr = job(s, 'cron'), tm = job(s, 'timer');
    var a = nextTick(cr.spec, s.now); if (a != null) c.push(a);
    var b = nextTick(tm.spec, s.now); if (b != null) c.push(b);
    if (tm.pending && tm.pending.at > s.now) c.push(tm.pending.at);
    var t = null;
    c.forEach(function (x) { if (x <= s.end && (t == null || x < t)) t = x; });
    return t;
  }

  /** One event: advance the clock and apply the rules. Mutates s (a clone). */
  function advance(s) {
    var T = nextEvent(s);
    if (T == null) throw new Error('no event left in the window');
    s.now = T;
    var cr = job(s, 'cron'), tm = job(s, 'timer');
    var last = { t: T, shutdown: false, boot: false, cron: null, timer: null, lost: null, missedInOutage: 0, cronMissedInOutage: 0,
      absorbed: false, fired: null, pending: null };
    var ch = [];

    // 1. power: shutdown loses a waiting (delayed) start; boot activates the timer again
    s.power.forEach(function (w) {
      if (w.from === T) {
        s.on = false; last.shutdown = true; ch.push('power');
        if (tm.pending) {
          if (!tm.pending.catchup) { tm.missed.push(tm.pending.sched); last.lost = tm.pending.sched; ch.push('timer:missed:' + tm.pending.sched); }
          tm.pending = null;
        }
      }
      if (w.to === T) {
        s.on = true; last.boot = true; ch.push('power');
        // what the outage cost each lane (ticks from the shutdown, inclusive, up to the boot; also before the window)
        last.missedInOutage = ticksIn(tm.spec, w.from - 1, T - 1).length;
        last.cronMissedInOutage = ticksIn(cr.spec, w.from - 1, T - 1).length;
        // rule 4: without Persistent= nothing is stored; the timer counts from its activation, the past is gone
        tm.lastTrigger = tm.persistent ? tm.stamp : null;
        // rule 5: with Persistent= the stored time decides: at least one elapse since then, before now → one catch-up
        if (tm.persistent && tm.stamp != null) {
          var nx = nextTick(tm.spec, tm.stamp);
          if (nx != null && nx < T) {
            var covers = ticksIn(tm.spec, tm.stamp, T - 1);
            var dl = delayFor(s.seed, T, tm.delay);  // rule 6: the catch-up is delayed too, from the boot time
            tm.pending = { sched: T, at: T + dl, delay: dl, catchup: true, covers: covers };
            last.timer = 'catchup-wait';
          }
        }
      }
    });

    // 2. cron (rule 1): runs if crond runs in that minute, otherwise the time is gone
    if (dayMatches(cr.spec, dayOf(T)) && T === dayOf(T) * DAY + timeOfDay(cr.spec)) {
      if (s.on) { cr.runs.push({ t: T }); last.cron = 'run'; ch.push('cron:run:' + T); }
      else { cr.missed.push(T); last.cron = 'missed'; ch.push('cron:missed:' + T); }
    }

    // 3. timer (rules 3–6): a scheduled time elapses while the machine is on
    if (dayMatches(tm.spec, dayOf(T)) && T === dayOf(T) * DAY + timeOfDay(tm.spec)) {
      if (!s.on) { tm.missed.push(T); last.timer = 'missed'; ch.push('timer:missed:' + T); }
      else if (tm.pending) { tm.absorbed.push(T); last.absorbed = true; if (!last.timer) last.timer = 'absorbed'; }
      else {
        var dly = delayFor(s.seed, T, tm.delay);
        tm.pending = { sched: T, at: T + dly, delay: dly, catchup: false, covers: [] };
        last.timer = 'elapse';
      }
    }

    // 4. the timer starts its service when the (possibly delayed) time comes
    if (s.on && tm.pending && tm.pending.at === T) {
      var pd = tm.pending;
      var run = { t: T, sched: pd.sched, delay: pd.delay, catchup: pd.catchup, covers: pd.covers };
      tm.runs.push(run);
      tm.lastTrigger = T;
      if (tm.persistent) { tm.stamp = T; ch.push('stamp'); }
      ch.push('timer:run:' + T);
      last.fired = run;
      last.timer = pd.catchup ? 'catchup' : 'run';
      tm.pending = null;
    } else if (!last.timer && tm.pending && tm.pending.at > T) {
      last.timer = 'waiting';
    }
    if (tm.pending) { last.pending = clone(tm.pending); if (last.timer === 'elapse' || last.timer === 'catchup-wait') ch.push('timer:pending'); }

    s.last = last;
    s.changed = ch;
    s.events.push({ t: T, cron: last.cron, timer: last.timer, boot: last.boot, shutdown: last.shutdown });
    return s;
  }

  var stepsMemo = {};
  /** One step per event in the window; the delayed starts make it depend on the params. */
  function steps(params) {
    var p = norm(params);
    var key = JSON.stringify(p);
    if (stepsMemo[key] != null) return stepsMemo[key];
    var s = initial(p), n = 0;
    while (nextEvent(s) != null && n < 200) { advance(s); n++; }
    stepsMemo[key] = n;
    return n;
  }

  // ── what the page shows: next elapse, list-timers, formatted times ──

  /** What `systemctl list-timers` would show as NEXT (scheduled time + its delay), null while the machine is off. */
  function nextOf(s) {
    var tm = job(s, 'timer');
    if (!s.on) return null;
    if (tm.pending) return { at: tm.pending.at, sched: tm.pending.sched, delay: tm.pending.delay, catchup: tm.pending.catchup };
    var x = nextTick(tm.spec, s.now);
    if (x == null) return null;
    var dl = delayFor(s.seed, x, tm.delay);
    return { at: x + dl, sched: x, delay: dl, catchup: false };
  }

  var WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function two(n) { return (n < 10 ? '0' : '') + n; }
  /** systemd's timestamp: `Wed 2026-09-02 08:00:00 CEST`. */
  function stamp(t) {
    var d = dayOf(t), c = civil(d), r = t - d * DAY;
    return WD[c.dow] + ' ' + c.y + '-' + two(c.m) + '-' + two(c.dom) + ' ' + clock(r) + ' ' + zone(t);
  }
  function clock(r) { return two(Math.floor(r / HOUR)) + ':' + two(Math.floor(r % HOUR / MIN)) + ':' + two(r % MIN); }

  /** systemd's relative time (format_timestamp_relative), as list-timers prints LEFT and PASSED. */
  var MONTH = 2629800, YEAR = 31557600, WEEK = 7 * DAY;
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function relative(sec) {
    if (sec >= YEAR) return plural(Math.floor(sec / YEAR), 'year', 'years') + ' ' + plural(Math.floor(sec % YEAR / MONTH), 'month', 'months');
    if (sec >= MONTH) return plural(Math.floor(sec / MONTH), 'month', 'months') + ' ' + plural(Math.floor(sec % MONTH / DAY), 'day', 'days');
    if (sec >= WEEK) return plural(Math.floor(sec / WEEK), 'week', 'weeks') + ' ' + plural(Math.floor(sec % WEEK / DAY), 'day', 'days');
    if (sec >= 2 * DAY) return Math.floor(sec / DAY) + ' days';
    if (sec >= 25 * HOUR) return '1 day ' + Math.floor((sec - DAY) / HOUR) + 'h';
    if (sec >= 6 * HOUR) return Math.floor(sec / HOUR) + 'h';
    if (sec >= HOUR) return Math.floor(sec / HOUR) + 'h ' + Math.floor(sec % HOUR / MIN) + 'min';
    if (sec >= 5 * MIN) return Math.floor(sec / MIN) + 'min';
    if (sec >= MIN) return Math.floor(sec / MIN) + 'min ' + (sec % MIN) + 's';
    if (sec >= 1) return sec + 's';
    return 'now';
  }

  /** The list-timers table for the timer: header and one row, columns as systemd 255 lays them out. */
  function listTimers(s) {
    var tm = job(s, 'timer');
    var nx = nextOf(s);
    var cells = {
      next: nx ? stamp(nx.at) : '-',
      left: nx ? relative(nx.at - s.now) : '-',
      last: tm.lastTrigger != null ? stamp(tm.lastTrigger) : '-',
      passed: tm.lastTrigger == null ? '-' : (s.now === tm.lastTrigger ? 'now' : relative(s.now - tm.lastTrigger) + ' ago'),
      unit: tm.name + '.timer',
      activates: tm.name + '.service'
    };
    var cols = [['next', 'NEXT', true], ['left', 'LEFT', false], ['last', 'LAST', true], ['passed', 'PASSED', false],
      ['unit', 'UNIT', true], ['activates', 'ACTIVATES', true]];
    function pad(x, w, left) { x = String(x); while (x.length < w) x = left ? x + ' ' : ' ' + x; return x; }
    var head = [], row = [];
    cols.forEach(function (c) {
      var w = Math.max(c[1].length, cells[c[0]].length);
      head.push(pad(c[1], w, c[2])); row.push(pad(cells[c[0]], w, c[2]));
    });
    return { cells: cells, head: head.join(' ').replace(/\s+$/, ''), row: row.join(' ').replace(/\s+$/, '') };
  }

  /** The crontab line as written. */
  function cronLine(spec) { return spec.fields.join(' ') + ' ' + spec.cmd; }
  /** The timer unit's [Timer] section as the params write it. */
  function timerLines(tm) {
    var out = ['OnCalendar=' + tm.spec.cal];
    if (tm.delay) out.push('RandomizedDelaySec=' + (tm.delay % HOUR ? tm.delay + 's' : tm.delay / HOUR + 'h'));
    if (tm.persistent) out.push('Persistent=true');
    out.push('Unit=' + tm.name + '.service');
    return out;
  }

  var logic = {
    defaults: { scene: 'arhiva', persistent: true, delay: 0, offFrom: String(D(1, 22)), offTo: String(D(2, 8)), seed: 3 },

    steps: steps,
    initial: initial,
    step: function (prev, n, params) { return advance(clone(prev)); },

    // helpers for the page and the tests
    norm: norm,
    powerOf: powerOf,
    isOn: isOn,
    civil: civil,
    zone: zone,
    dayOf: dayOf,
    cronDayMatches: cronDayMatches,
    timerDayMatches: timerDayMatches,
    nextTick: nextTick,
    prevTick: prevTick,
    ticksIn: ticksIn,
    delayFor: delayFor,
    nextEvent: nextEvent,
    nextOf: nextOf,
    stamp: stamp,
    clock: clock,
    relative: relative,
    listTimers: listTimers,
    cronLine: cronLine,
    timerLines: timerLines,
    job: job,
    D: D,
    DAY: DAY,
    HOUR: HOUR,
    MIN: MIN,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,
    OFF_OPTIONS: OFF_OPTIONS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
