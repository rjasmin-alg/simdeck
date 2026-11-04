/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-wsus-cloned-id: cloned Windows machines share one client ID (SusClientId), and the WSUS console keeps
   one row per client ID, so many machines show as one. Rules and expected numbers: SPEC.md.
   One step = one event: the clones are deployed from the image, a machine reports, or the admin resets PC-02's ID.
   Client reporting follows sims/win-wsus-flow (a client's status report lands on the server); new here: the console's
   rows are keyed by client ID. Nothing is copied from it: that model has no client IDs.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var START = 7 * 60 + 30;          // Mon 07:30: the image is ready (step 0)
  var DEPLOY = 8 * 60;              // Mon 08:00: the clones start
  var FIRST_REPORT = 9 * 60;        // PC-01 reports at 09:00, each next clone 20 min later
  var REPORT_GAP = 20;
  var RESET_AFTER = 10;             // the admin's reset comes 10 min after the step before it
  var RECONTACT = 10;               // a reset machine contacts WSUS 10 min after the reset
  var IMAGE_ID = '7f3a';            // the reference machine contacted WSUS before capture: its ID is in the image
  var OWN_IDS = ['a2c4', 'd91e', '5b07', 'e3f8', '16bd'];   // created at first start from a generalised image
  var RESET_ID = '9c6b';            // PC-02's new ID after the reset
  var RESET_WHO = 1;                // the button resets PC-02 (machine index 1)

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function nameOf(i) { return 'PC-0' + (i + 1); }

  /** The next event after state s at step n, or null when the demo is over. Order: a pending reset (it comes right
      after the step the button was pressed at, or at the end), the deployment, then reports by (time, machine order). */
  function nextEvent(s, n, p) {
    var report = null;
    if (s.deployed) {
      s.machines.forEach(function (m, i) {
        if (m.nextReport === null) return;
        if (!report || m.nextReport < report.t) report = { kind: 'report', t: m.nextReport, who: i };   // strict <: machine order breaks ties
      });
    }
    var other = s.deployed ? report : { kind: 'deploy', t: DEPLOY };
    if (!s.resetDone && p.resetAt >= 0 && (n > p.resetAt || !other)) {
      return { kind: 'reset', t: s.t + RESET_AFTER, who: RESET_WHO };
    }
    return other;
  }

  /** Apply event e to state s (a copy). Returns the new state with s.ev describing what happened. */
  function apply(s0, e) {
    var s = clone(s0);
    s.t = Math.max(s.t, e.t);
    var ev = { kind: e.kind, t: s.t };
    if (e.kind === 'deploy') {
      s.deployed = true;
      s.machines.forEach(function (m, i) {
        m.clientId = s.image.generalised ? OWN_IDS[i] : s.image.id;     // rule 4 / rule 2
        m.nextReport = FIRST_REPORT + REPORT_GAP * i;
      });
      ev.ids = s.machines.map(function (m) { return m.clientId; });
    } else if (e.kind === 'report') {
      var m = s.machines[e.who];
      var row = s.console[m.clientId];                                  // rule 1: the row is found by client ID only
      ev.who = e.who;
      ev.id = m.clientId;
      if (row) {
        ev.created = false;
        ev.before = { name: row.name, ip: row.ip, status: row.status, lastReport: row.lastReport };
      } else {
        ev.created = true;
        row = s.console[m.clientId] = { seq: Object.keys(s.console).length };
      }
      row.name = m.name;                                                // rule 3: the last reporter's name, IP, status
      row.ip = m.ip;
      row.lastReport = s.t;
      row.status = m.patched ? 'installed' : 'needed';
      m.lastReport = s.t;
      m.reportedId = m.clientId;
      m.nextReport = null;                                              // the next report is a day later: outside the demo
    } else if (e.kind === 'reset') {
      ev.who = e.who;
      if (!s.deployed || e.who >= s.machines.length) {
        ev.rejected = 'notDeployed';
      } else {
        var r = s.machines[e.who];
        ev.oldId = r.clientId;
        ev.id = RESET_ID;
        r.clientId = RESET_ID;                                          // rule 5: a new ID now, a new row at next contact
        r.nextReport = r.nextReport === null ? s.t + RECONTACT : Math.min(r.nextReport, s.t + RECONTACT);
      }
      s.resetDone = true;
    }
    s.ev = ev;
    s.log.push(ev);
    return s;
  }

  var logic = {
    START: START, DEPLOY: DEPLOY, FIRST_REPORT: FIRST_REPORT, REPORT_GAP: REPORT_GAP, RECONTACT: RECONTACT,
    IMAGE_ID: IMAGE_ID, OWN_IDS: OWN_IDS, RESET_ID: RESET_ID,

    /** Parameter defaults. pc02Missing: PC-02 lacks KB-C (the task's patchPc02). resetAt: the admin resets PC-02's ID
        right after step resetAt (−1: never); the page's button sets it to the current step. */
    defaults: { clones: 3, generalised: false, pc02Missing: true, resetAt: -1 },

    /** Steps: every event until none is left (deploy, one report per clone, and a reset with its report). */
    steps: function (p) {
      var s = logic.initial(p), n = 0, e;
      while ((e = nextEvent(s, n + 1, p))) { n++; s = apply(s, e); }
      return n;
    },

    /** State at step 0: the image is ready, the clones are not deployed yet, the console is empty. */
    initial: function (p) {
      var k = Math.max(2, Math.min(5, Math.round(p.clones)));
      var machines = [];
      for (var i = 0; i < k; i++) {
        machines.push({ name: nameOf(i), ip: '10.0.20.' + (11 + i), clientId: null,
          patched: !(i === 1 && p.pc02Missing), nextReport: null, lastReport: null, reportedId: null });
      }
      return { t: START, image: { id: IMAGE_ID, generalised: !!p.generalised }, deployed: false, machines: machines,
        console: {}, resetDone: false, ev: null, log: [] };
    },

    /** State after step n from the state after step n − 1. Past the end it returns the state unchanged. */
    step: function (s, n, p) {
      var e = nextEvent(s, n, p);
      if (!e) { var same = clone(s); same.ev = null; return same; }
      return apply(s, e);
    },

    /** Console rows in the order they were created: [{ id, name, ip, lastReport, status }]. */
    rowsOf: function (s) {
      return Object.keys(s.console).map(function (id) { return Object.assign({ id: id }, s.console[id]); })
        .sort(function (a, b) { return a.seq - b.seq; });
    },

    /** What the console reports for KB-C, and the truth on the machines. */
    summaryOf: function (s) {
      var rows = logic.rowsOf(s);
      return {
        rows: rows.length,
        installed: rows.filter(function (r) { return r.status === 'installed'; }).length,
        needed: rows.filter(function (r) { return r.status === 'needed'; }).length,
        machines: s.machines.length,
        missing: s.machines.filter(function (m) { return !m.patched; }).length,
        unseen: s.machines.filter(function (m) { var r = s.console[m.clientId]; return !r || r.name !== m.name; }).length
      };
    },

    nextEvent: nextEvent
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
