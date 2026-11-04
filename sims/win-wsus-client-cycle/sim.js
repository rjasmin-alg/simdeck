/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-wsus-client-cycle: the Automatic Updates cycle of two Windows clients, DESK-1 (always on) and LAP-1
   (off at night), over a working week, Mon 00:00 → Sat 00:00, in 6-hour steps. One update, KB-A, is approved on WSUS
   on Monday at 10:00; each client finds it at its own scan, downloads it, installs it and restarts, as its Automatic
   Updates option (2, 3 or 4), its active hours and an optional deadline allow.
   Time is in whole minutes from Mon 00:00. One step advances 360 minutes; inside it every minute is processed in
   phase order (power, approval, deadline, scan, user, download, install, restart), DESK-1 before LAP-1.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md.
   Shapes follow sims/win-wsus-flow/sim.js (client: nextScan, interval, lastScan, state, detectT, installT; update:
   id): the scan rule is the same (detection frequency minus a fixed part of 0–20 % per client). */
(function (root) {
  'use strict';

  var DAY = 1440;
  var WINDOW = 360;             // one step: 6 hours
  var STEPS = 20;               // Mon 00:00 → Sat 00:00
  var HORIZON = STEPS * WINDOW; // 7200 minutes
  var APPROVED_AT = 600;        // KB-A approved on WSUS Mon 10:00
  var DEADLINES = { none: null, thu12: 3 * DAY + 12 * 60 };   // Thu 12:00 = minute 5040
  var ACTIVE = { '08-17': [8, 17], '06-23': [6, 23] };
  var SCHED_INSTALL = 3;        // AU 4: install every day at 03:00
  var DOWNLOAD = 60;            // minutes of download while the machine is on
  var STARTUP_DELAY = 5;        // a missed scan or scheduled install runs 5 minutes after start-up
  var USER_DELAY = 60;          // a user who answers notices does so an hour after the notice, inside active hours
  var ON_HOURS = [8, 18];       // LAP-1 with laptopOffAtNight: on 08:00–18:00

  /** Machines: scan anchor (a scan falls at anchor + k * interval) and the fixed cut of the 0–20 % random part. */
  var MACHINES = [
    { id: 'DESK-1', kind: 'desk', scanAnchor: 14 * 60, scanCut: 10 },
    { id: 'LAP-1', kind: 'lap', scanAnchor: 15 * 60, scanCut: 15 }
  ];

  function mod(a, b) { return ((a % b) + b) % b; }
  function tod(m) { return mod(m, DAY); }

  /** Is the machine powered at minute m (from its on-hours schedule; null = always on)? */
  function isOnAt(mac, m) {
    if (!mac.onHours) return true;
    var x = tod(m);
    return x >= mac.onHours[0] * 60 && x < mac.onHours[1] * 60;
  }
  /** Is minute m inside the machine's active hours ([from, to), hours of the day)? */
  function inActive(mac, m) {
    var x = tod(m);
    return x >= mac.activeHours[0] * 60 && x < mac.activeHours[1] * 60;
  }
  /** The scan interval in minutes: detection frequency (hours) minus the machine's fixed cut (percent). */
  function intervalOf(detection, cut) { return detection * 60 * (100 - cut) / 100; }

  function forced(s, mac, m) {
    return s.update.deadline !== null && mac.detectT !== null && m >= s.update.deadline;
  }

  function machine(def, p) {
    var interval = intervalOf(p.detection, def.scanCut);
    var first = mod(def.scanAnchor, interval);
    var onHours = def.kind === 'lap' && p.laptopOffAtNight ? ON_HOURS.slice() : null;
    return {
      id: def.id, kind: def.kind, onHours: onHours, au: p.au, schedInstall: SCHED_INSTALL,
      activeHours: ACTIVE[p.activeHours].slice(),
      scanAnchor: def.scanAnchor, scanCut: def.scanCut, interval: interval,
      nextScan: first === 0 ? interval : first, lastScan: null, missedScan: false,
      on: onHours ? isOnAt({ onHours: onHours }, 0) : true, upAt: null,
      state: 'idle', detectT: null, noticeT: null, dlStartT: null, dlLeft: 0, dlEndT: null,
      missedInstall: false, installT: null, installHow: null, restartT: null, restartHow: null,
      go: false, userT: null, userActs: { postpone: !p.userClicks }
    };
  }

  /** Process one minute m on a state copy (phase order; DESK-1 before LAP-1 in each phase). */
  function tick(s, m) {
    var log = s.log, macs = s.machines;
    function add(e) { e.t = m; log.push(e); }
    // (1) power
    macs.forEach(function (mac) {
      if (!mac.onHours) return;
      if (tod(m) === mac.onHours[0] * 60) { mac.on = true; mac.upAt = m; add({ who: mac.id, kind: 'on' }); }
      if (tod(m) === mac.onHours[1] * 60) {
        if (mac.state === 'pending') { mac.state = 'done'; mac.restartT = m; mac.restartHow = 'shutdown'; add({ who: mac.id, kind: 'restart', how: 'shutdown' }); }
        mac.on = false;
        add({ who: mac.id, kind: 'off' });
      }
    });
    // (2) approval and (3) deadline on WSUS
    if (m === s.update.approvedAt) { s.update.approved = true; add({ who: 'WSUS', kind: 'approve' }); }
    if (m === s.update.deadline) add({ who: 'WSUS', kind: 'deadline' });
    // (4) scan: when due and on; a scan due while off runs STARTUP_DELAY after the next start-up
    macs.forEach(function (mac) {
      if (m < mac.nextScan) return;
      if (!mac.on) { mac.missedScan = true; return; }
      if (mac.missedScan && m < mac.upAt + STARTUP_DELAY) return;
      var late = mac.missedScan;
      mac.missedScan = false;
      mac.lastScan = m;
      mac.nextScan = m + mac.interval;
      var found = 'none';
      if (s.update.approved && mac.state === 'idle') {
        found = 'new';
        mac.detectT = m;
        if (mac.au >= 3 || forced(s, mac, m)) { mac.state = 'downloading'; mac.dlStartT = m; mac.dlLeft = DOWNLOAD; }
        else { mac.state = 'detected'; mac.noticeT = m; }
      } else if (s.update.approved) found = 'known';
      add({ who: mac.id, kind: 'scan', found: found, late: late });
    });
    // (5) the user answers a notice (AU 2: download and install; AU 3: install)
    macs.forEach(function (mac) {
      var waiting = (mac.au === 2 && mac.state === 'detected') || (mac.au === 3 && mac.state === 'ready');
      if (!waiting || mac.userActs.postpone || mac.go || !mac.on || !inActive(mac, m) || m < mac.noticeT + USER_DELAY) return;
      mac.go = true;
      mac.userT = m;
      add({ who: mac.id, kind: 'user', au: mac.au });
    });
    // (6) download: starts on the user's answer or the deadline (AU 2); runs only while the machine is on
    macs.forEach(function (mac) {
      if (mac.state === 'detected' && mac.on && (mac.go || forced(s, mac, m))) {
        mac.state = 'downloading'; mac.dlStartT = m; mac.dlLeft = DOWNLOAD;
        return;
      }
      if (mac.state !== 'downloading' || m <= mac.dlStartT || !isOnAt(mac, m - 1)) return;
      mac.dlLeft--;
      if (mac.dlLeft > 0) return;
      mac.state = 'ready';
      mac.dlEndT = m;
      if (mac.au === 3 && !mac.go) mac.noticeT = m;
      add({ who: mac.id, kind: 'downloaded' });
    });
    // (7) install: the scheduled time (AU 4), after start-up when it was missed, the user's answer, or the deadline
    macs.forEach(function (mac) {
      if (mac.state !== 'ready') return;
      var atSched = tod(m) === mac.schedInstall * 60;
      if (mac.au === 4 && atSched && !mac.on && !mac.missedInstall) {
        mac.missedInstall = true;
        add({ who: mac.id, kind: 'missed' });
        return;
      }
      if (!mac.on) return;
      var how = forced(s, mac, m) ? 'deadline' : mac.go ? 'user'
        : mac.au === 4 && mac.missedInstall && m >= mac.upAt + STARTUP_DELAY ? 'missed'
        : mac.au === 4 && atSched ? 'scheduled' : null;
      if (!how) return;
      mac.state = 'pending';
      mac.installT = m;
      mac.installHow = how;
      mac.missedInstall = false;
      add({ who: mac.id, kind: 'install', how: how });
    });
    // (8) restart: outside active hours, or at once after the deadline (shut-down: phase 1)
    macs.forEach(function (mac) {
      if (mac.state !== 'pending' || !mac.on) return;
      var how = forced(s, mac, m) ? 'deadline' : !inActive(mac, m) ? 'outside' : null;
      if (!how) return;
      mac.state = 'done';
      mac.restartT = m;
      mac.restartHow = how;
      add({ who: mac.id, kind: 'restart', how: how });
    });
  }

  var logic = {
    DAY: DAY,
    WINDOW: WINDOW,
    HORIZON: HORIZON,
    APPROVED_AT: APPROVED_AT,
    DEADLINES: DEADLINES,
    ACTIVE: ACTIVE,
    DOWNLOAD: DOWNLOAD,
    STARTUP_DELAY: STARTUP_DELAY,
    USER_DELAY: USER_DELAY,
    MACHINES: MACHINES,
    isOnAt: isOnAt,
    inActive: inActive,
    intervalOf: intervalOf,

    /** Parameter defaults: Automatic Updates option, detection frequency (hours), active hours, deadline, whether
        LAP-1 is off 18:00–08:00, and whether the user answers notices (AU 2 and 3). */
    defaults: { au: 4, detection: 22, activeHours: '08-17', deadline: 'none', laptopOffAtNight: true, userClicks: false },

    steps: STEPS,

    /** State at step 0: Monday 00:00; KB-A is on WSUS, not yet approved. */
    initial: function (p) {
      return {
        t: 0,
        update: { id: 'KB-A', approvedAt: APPROVED_AT, approved: false, deadline: DEADLINES[p.deadline] },
        machines: MACHINES.map(function (d) { return machine(d, p); }),
        log: []
      };
    },

    /** State after step n: the 6 hours ((n - 1) * 360, n * 360] processed minute by minute. */
    step: function (s0, n) {
      var s = JSON.parse(JSON.stringify(s0));
      for (var m = (n - 1) * WINDOW + 1; m <= n * WINDOW; m++) tick(s, m);
      s.t = n * WINDOW;
      return s;
    },

    /** The next start of the given time of day (hour) strictly after minute m. */
    nextAtHour: function (m, hour) {
      var at = Math.floor(m / DAY) * DAY + hour * 60;
      return at > m ? at : at + DAY;
    },

    /** When the machine's next scan runs, seen from minute m: when due, or 5 min after the start-up that follows. */
    nextScanAt: function (mac, m) {
      if (!mac.onHours) return mac.nextScan;
      if (mac.missedScan) return (mac.on ? mac.upAt : logic.nextAtHour(m, mac.onHours[0])) + STARTUP_DELAY;
      if (isOnAt(mac, mac.nextScan)) return mac.nextScan;
      return logic.nextAtHour(mac.nextScan, mac.onHours[0]) + STARTUP_DELAY;
    },

    /** What a machine waits for at minute m, and from when it can happen: { what, at }.
        what: scan | user | download | install | startup | restart | shutdown | none. A machine that waits for
        the user waits for the user even while it is off. */
    waitingFor: function (s, mac, m) {
      if (mac.state === 'done') return { what: 'none', at: null };
      if (mac.state === 'idle') return { what: 'scan', at: logic.nextScanAt(mac, m) };
      var waitsUser = (mac.state === 'detected' || (mac.state === 'ready' && mac.au === 3)) && !mac.go;
      if (!mac.on && !waitsUser) {
        return { what: 'startup', at: mac.onHours ? logic.nextAtHour(m, mac.onHours[0]) : null };
      }
      if (mac.state === 'downloading') return { what: 'download', at: null };
      if (mac.state === 'pending') {
        var end = logic.nextAtHour(m, mac.activeHours[1]);
        var off = mac.onHours ? logic.nextAtHour(m, mac.onHours[1]) : null;
        return off !== null && off < end ? { what: 'shutdown', at: off } : { what: 'restart', at: end };
      }
      var dl = s.update.deadline !== null && m < s.update.deadline ? s.update.deadline : null;
      if (mac.state === 'ready' && mac.au === 4) return { what: 'install', at: logic.nextAtHour(m, mac.schedInstall) };
      return { what: 'user', at: null, deadline: dl };
    },

    /** Day index (0 = Monday) and "HH:MM" of a model minute. */
    clockOf: function (m) {
      var day = Math.floor(m / DAY), r = m - day * DAY;
      var hh = Math.floor(r / 60), mm = r % 60;
      return { day: day, hm: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
