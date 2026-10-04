/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-wsus-flow: how one update (KB-A) travels Microsoft Update → WSUS-HQ (upstream) → WSUS-BR (downstream,
   replica or autonomous) → the clients PC-HQ1 and PC-BR1. One step = the next scheduled or admin event that changes
   something (SPEC.md, "One step"); events at the same time run in phase order: sync, approval, content, scan, client
   download, install, report.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules and numbers: SPEC.md.
   Reusable part (later WSUS sims): servers, clients and the update are plain objects; eventsAt/apply/nextStep work on
   any state of that shape, with no strings and no page code. */
(function (root) {
  'use strict';

  var GROUP = 'All Computers';
  var PHASE = { sync: 1, approve: 2, content: 3, scan: 4, download: 5, install: 6, report: 7 };
  var HORIZON = 168;            // a week of model time (hours from Tue 19:00); nothing is scheduled past it
  var SERVER_DL = 0.5;          // content download of a server (from Microsoft Update or from its upstream), hours
  var CLIENT_DL = 0.5;          // client download from the WSUS server at its own site
  var CLIENT_DL_WAN = 1;        // client download from the other site's server, over the WAN
  var INSTALL_HOUR = 3;         // scheduled install at 03:00 (Automatic Updates, the model's setting)
  var START_HOUR = 19;          // t = 0 is Tuesday 19:00
  var MAX_STEPS = 40;           // safety stop for the replay; the page's runs are far shorter

  /** The next time at or after t whose hour of day is `hour` (t in hours from Tue 19:00). */
  function nextAtHour(t, hour) {
    var first = ((hour - START_HOUR) % 24 + 24) % 24;     // first such time after the start
    if (t <= first) return first;
    return first + Math.ceil((t - first) / 24) * 24;
  }

  function server(id, site, syncHour) {
    return { id: id, site: site, syncHour: syncHour, meta: false, approvals: {}, approvedT: null, content: false,
      contentT: null, needT: null, lastSync: null, upRev: -1, rev: 0, reports: {} };
  }

  var logic = {
    GROUP: GROUP,
    PHASE: PHASE,
    HORIZON: HORIZON,
    SERVER_DL: SERVER_DL,
    CLIENT_DL: CLIENT_DL,
    CLIENT_DL_WAN: CLIENT_DL_WAN,
    nextAtHour: nextAtHour,

    /** Parameter defaults. approveAt: hours from Tue 19:00 (14 = Wed 09:00, 8.5 = Wed 03:30). brAt: the branch admin
        approves right after step brAt (−1: never); the page's button sets it to the current step. */
    defaults: { mode: 'replica', upstreamProducts: true, branchPointsToHQ: false, approveAt: 14, brAt: -1 },

    /** State at step 0: Tuesday 19:00, KB-A just released on Microsoft Update; nobody has anything yet. */
    initial: function (p) {
      var hq = server('HQ', 'hq', 3), br = server('BR', 'br', 4);
      hq.products = p.upstreamProducts ? ['Windows Server'] : [];
      hq.storeLocally = true;
      br.mode = p.mode;
      return {
        t: 0,
        update: { id: 'KB-A', product: 'Windows Server', released: 0, sizeMB: 480 },
        hqApproveAt: p.approveAt,
        hqApproveDone: false,
        rollup: true,
        servers: { HQ: hq, BR: br },
        clients: [
          { id: 'PC-HQ1', site: 'hq', server: 'HQ', group: GROUP, nextScan: 19, interval: 20, state: 'idle', seen: null,
            lastScan: null, detectT: null, dlT: null, installT: null, reportDue: null, reportT: null, scanT: null },
          { id: 'PC-BR1', site: 'br', server: p.branchPointsToHQ ? 'HQ' : 'BR', group: GROUP, nextScan: 22, interval: 18,
            state: 'idle', seen: null, lastScan: null, detectT: null, dlT: null, installT: null, reportDue: null, reportT: null, scanT: null }
        ],
        last: null,
        done: false,
        log: []
      };
    },

    approvedFor: function (srv, group) { return !!(srv.approvals[group] || srv.approvals[GROUP]); },

    /** Client download time: its server must hold the content; over the WAN when the server is at the other site. */
    clientDlTime: function (s, c) {
      var srv = s.servers[c.server];
      if (c.state !== 'detected' || !srv.content) return null;
      return Math.max(c.detectT, srv.contentT) + (srv.site === c.site ? CLIENT_DL : CLIENT_DL_WAN);
    },

    /** Every event scheduled after `after` (exclusive of nothing: syncs and scans at or after `after`), sorted
        by (time, phase, entity). Admin approval at the branch is not scheduled: it comes from params.brAt. */
    events: function (s) {
      var out = [], hq = s.servers.HQ, br = s.servers.BR;
      function add(t, phase, order, kind, who) { if (t != null && t <= HORIZON) out.push({ t: t, phase: phase, order: order, kind: kind, who: who }); }
      // (1) syncs: each server once a day at its hour; a sync at the time of the last event has already run
      [hq, br].forEach(function (srv, i) {
        var at = nextAtHour(s.t, srv.syncHour);
        if (srv.lastSync === at) at += 24;
        add(at, PHASE.sync, i, 'sync', srv.id);
      });
      // (2) the HQ admin's approval, once
      if (!s.hqApproveDone && s.hqApproveAt >= s.t) add(s.hqApproveAt, PHASE.approve, 0, 'approve', 'HQ');
      // (3) content downloads of the servers
      if (hq.needT != null && !hq.content) add(hq.needT + SERVER_DL, PHASE.content, 0, 'content', 'HQ');
      if (logic.approvedFor(br, GROUP) && !br.content && hq.content) add(Math.max(br.approvedT, hq.contentT) + SERVER_DL, PHASE.content, 1, 'content', 'BR');
      s.clients.forEach(function (c, i) {
        add(c.nextScan, PHASE.scan, 2 + i, 'scan', c.id);                                   // (4)
        add(logic.clientDlTime(s, c), PHASE.download, 2 + i, 'download', c.id);             // (5)
        if (c.state === 'downloaded') add(nextAtHour(c.dlT, INSTALL_HOUR), PHASE.install, 2 + i, 'install', c.id); // (6)
        if (c.state === 'installed' && c.reportDue != null) add(c.reportDue, PHASE.report, 2 + i, 'report', c.id); // (7)
      });
      out.sort(function (a, b) { return a.t - b.t || a.phase - b.phase || a.order - b.order; });
      return out;
    },

    /** Apply one event to a copy of s. Returns { state, worthy } (worthy: the event changes something the page shows). */
    apply: function (s0, ev) {
      var s = JSON.parse(JSON.stringify(s0));
      var hq = s.servers.HQ, br = s.servers.BR, worthy = false, rec = { t: ev.t, kind: ev.kind, who: ev.who };
      s.t = ev.t;
      var client = s.clients.filter(function (c) { return c.id === ev.who; })[0];
      if (ev.kind === 'sync' && ev.who === 'HQ') {
        var first = hq.lastSync === null;
        hq.lastSync = ev.t;
        var selected = hq.products.indexOf(s.update.product) >= 0;
        rec.selected = selected;
        rec.got = [];
        if (s.update.released <= ev.t && !hq.meta && selected) { hq.meta = true; hq.rev++; rec.got.push('meta'); }
        rec.outcome = rec.got.length ? 'new' : selected ? 'nothing' : 'skipped';
        worthy = first || rec.got.length > 0;
      } else if (ev.kind === 'sync') {
        var firstBr = br.lastSync === null, upChanged = hq.rev !== br.upRev;
        br.lastSync = ev.t;
        br.upRev = hq.rev;
        rec.mode = br.mode;
        rec.got = [];
        if (hq.meta && !br.meta) { br.meta = true; br.rev++; rec.got.push('meta'); }
        if (br.mode === 'replica') {
          if (JSON.stringify(hq.approvals) !== JSON.stringify(br.approvals)) {
            br.approvals = JSON.parse(JSON.stringify(hq.approvals));
            br.approvedT = logic.approvedFor(br, GROUP) ? ev.t : null;
            br.rev++;
            rec.got.push('approval');
            if (logic.approvedFor(br, GROUP) && !hq.content && hq.needT == null) hq.needT = ev.t;
          }
          rec.rolled = [];
          if (s.rollup) Object.keys(br.reports).sort().forEach(function (id) {
            if (hq.reports[id] !== br.reports[id]) { hq.reports[id] = br.reports[id]; rec.rolled.push(id); }
          });
        } else if (logic.approvedFor(hq, GROUP) && !logic.approvedFor(br, GROUP)) {
          rec.notInherited = true;
        }
        rec.outcome = rec.got.length || (rec.rolled && rec.rolled.length) ? 'new' : hq.meta || rec.notInherited ? 'nothing' : 'empty';
        // an upstream change is worth a step when the branch takes it, or (autonomous) visibly does not take its approval
        worthy = firstBr || rec.got.length > 0 || (rec.rolled && rec.rolled.length > 0) || (upChanged && (br.mode === 'replica' || !!rec.notInherited));
      } else if (ev.kind === 'approve') {
        var srv = s.servers[ev.who];
        if (ev.who === 'HQ') s.hqApproveDone = true;
        rec.mode = srv.mode || null;
        if (ev.who === 'BR' && br.mode === 'replica') rec.outcome = 'replica';
        else if (!srv.meta) rec.outcome = 'noMeta';
        else if (logic.approvedFor(srv, GROUP)) rec.outcome = 'already';
        else {
          srv.approvals[GROUP] = true;
          srv.approvedT = ev.t;
          srv.rev++;
          rec.outcome = 'approved';
          if (srv.storeLocally && !srv.content && srv.needT == null) srv.needT = ev.t;   // HQ: download when approved
          if (ev.who === 'BR' && !hq.content && hq.needT == null) hq.needT = ev.t;       // BR needs it from HQ first
        }
        worthy = true;
      } else if (ev.kind === 'content') {
        var cs = s.servers[ev.who];
        cs.content = true;
        cs.contentT = ev.t;
        rec.from = ev.who === 'HQ' ? 'MU' : 'HQ';
        rec.sizeMB = s.update.sizeMB;
        worthy = true;
      } else if (ev.kind === 'scan') {
        var ss = s.servers[client.server];
        var seen = !ss.meta ? 'absent' : !logic.approvedFor(ss, client.group) ? 'notApproved' : 'approved';
        var before = client.state, seenBefore = client.seen;
        client.seen = seen;
        client.lastScan = ev.t;
        client.nextScan = ev.t + client.interval;
        if (client.state === 'idle' && seen === 'approved') { client.state = 'detected'; client.detectT = ev.t; }
        if (client.state === 'installed' && client.reportDue == null) client.reportDue = ev.t;   // reports at this contact
        rec.server = client.server;
        rec.seen = seen;
        rec.outcome = client.state !== before ? 'detected' : seen;
        worthy = client.state !== before || seen !== seenBefore;
        if (worthy) client.scanT = ev.t;               // the scan the page shows (silent scans keep lastScan moving)
      } else if (ev.kind === 'download') {
        client.state = 'downloaded';
        client.dlT = ev.t;
        rec.server = client.server;
        rec.wan = s.servers[client.server].site !== client.site;
        rec.sizeMB = s.update.sizeMB;
        worthy = true;
      } else if (ev.kind === 'install') {
        client.state = 'installed';
        client.installT = ev.t;
        worthy = true;
      } else if (ev.kind === 'report') {
        client.state = 'reported';
        client.reportDue = null;
        client.reportT = ev.t;
        var rs = s.servers[client.server];
        rs.reports[client.id] = 'installed';
        rec.server = client.server;
        worthy = true;
      }
      s.last = rec;
      return { state: s, worthy: worthy };
    },

    /** The state after the next event that changes something; done: true when nothing is left before the horizon. */
    nextStep: function (s0) {
      var s = s0;
      for (;;) {
        var ev = logic.events(s)[0];
        if (!ev) { var end = JSON.parse(JSON.stringify(s0)); end.done = true; end.last = null; return end; }
        var r = logic.apply(s, ev);
        s = r.state;
        if (r.worthy) return s;
      }
    },

    /** State after step n (n = 1, 2, ...), from the state after step n - 1. */
    step: function (s0, n, p) {
      var s;
      if (p.brAt >= 0 && n === p.brAt + 1) s = logic.apply(s0, { t: s0.t, phase: PHASE.approve, order: 1, kind: 'approve', who: 'BR' }).state;
      else s = logic.nextStep(s0);
      if (s.done) return s;
      s.last.n = n;
      s.log = s0.log.concat([s.last]);
      return s;
    },

    /** Steps of a run: until nothing more happens before the horizon. */
    steps: function (p) {
      var s = logic.initial(p);
      for (var n = 1; n <= MAX_STEPS; n++) {
        s = logic.step(s, n, p);
        if (s.done) return n - 1;
      }
      return MAX_STEPS;
    },

    /** Day index (0 = Tuesday) and "HH:MM" of a model time. */
    clockOf: function (t) {
      var mins = Math.round((t + START_HOUR) * 60);
      var day = Math.floor(mins / 1440), r = mins - day * 1440;
      var hh = Math.floor(r / 60), mm = r % 60;
      return { day: day, hm: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
