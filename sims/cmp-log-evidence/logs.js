/* SPDX-License-Identifier: AGPL-3.0-or-later
   The log-evidence model: actions written as log records on the hosts where they happen, optionally copied at once to
   a central append-only store; a cover-up that deletes the local logs on some hosts; retention that ages records out;
   and, at the moment an investigation starts, which copies are left, the order their timestamps give, and which of
   the investigation's questions they still answer. SPEC.md rules 1-8.
   Catalogue §5.24: the evidence on top of cmp-policy-to-record's trail (cmp-log-evidence fills it with records), so
   it is pure functions over plain data, no words and no dependencies, ready for the coordinator to promote to
   models/logs.js unchanged (models/README.md). In a page it registers on globalThis.SimdeckModels.logs; under node it
   is module.exports. Times are whole minutes from day 0, 00:00. */
(function (root) {
  'use strict';

  var DAY = 1440;
  /** Copy statuses from shortest-lived to longest-lived (rule 4). */
  var RANK = ['unlogged', 'wiped', 'aged', 'kept'];
  var STORES = ['local', 'central'];
  var READERS = ['admins', 'named'];

  function rank(s) { return RANK.indexOf(s); }
  function dayOf(t) { return Math.floor(t / DAY); }

  /** Rule 1: the timestamp a host writes: true time minus how far its clock runs slow. */
  function stamp(a, setup) {
    var d = setup.drift && setup.drift[a.host];
    return a.at - (typeof d === 'number' ? d : 0);
  }

  /** Rule 3: a record written at true time `at` is aged out at time `now` when more than `keep` whole days lie
      between their days. Tie-break: exactly `keep` days later it is still there. */
  function isAged(at, now, keep) { return dayOf(now) - dayOf(at) > keep; }

  /** Rule 2: is the action recorded at all (completeness)? An action may name a log source that must be on. */
  function isLogged(a, setup) { return !a.needs || !!(setup.logged && setup.logged[a.needs]); }

  /** Rules 2-4: the copies of one action at time `now`, each { where, status }: 'local' on its host and, with a
      central store, 'central'. A copy exists only once now ≥ the action. Statuses: unlogged (never written), wiped (a
      local copy on a wiped host, once now ≥ the wipe; tie-break: a record written in the wipe's own minute goes with
      it), aged (rule 3), kept. The earliest cause wins: wiped before aged. */
  function copies(a, sc, setup, now) {
    if (now < a.at) return [];
    if (!isLogged(a, setup)) return [{ where: 'local', status: 'unlogged' }];
    var w = sc.wipe;
    var wiped = !!w && now >= w.at && a.at <= w.at && w.hosts.indexOf(a.host) >= 0;
    var aged = isAged(a.at, now, setup.keep);
    var out = [{ where: 'local', status: wiped ? 'wiped' : aged ? 'aged' : 'kept' }];
    if (setup.store === 'central') out.push({ where: 'central', status: aged ? 'aged' : 'kept' });
    return out;
  }

  /** Rule 4: the best copy's status (the longest-lived), or null before the action. */
  function best(cs) {
    return cs.reduce(function (b, c) { return b === null || rank(c.status) > rank(b) ? c.status : b; }, null);
  }

  /** Rule 5: the wipe as the central store sees it: one record per wiped host, sent before the local log goes, at
      the wipe's time; status kept or aged. None without a central store or before the wipe. */
  function wipeRecords(sc, setup, now) {
    var w = sc.wipe;
    if (!w || setup.store !== 'central' || now < w.at) return [];
    return w.hosts.map(function (host) {
      var a = { host: host, at: w.at };
      return { host: host, at: w.at, stamp: stamp(a, setup), status: isAged(w.at, now, setup.keep) ? 'aged' : 'kept' };
    });
  }

  /** Rule 6: the order the timestamps give. The actions still available (best copy kept), sorted by stamp; tie-break:
      equal stamps keep the scenario's host order for display, and any tie makes the order unknown. Returns
      { list: [{ id, host, stamp, at, seq }], ties, wrong, status, reason }. seq is the true position (0-based). */
  function order(sc, setup, now) {
    var hostIx = function (h) { return sc.hosts.indexOf(h); };
    var avail = [];
    sc.actions.forEach(function (a, i) {
      if (best(copies(a, sc, setup, now)) === 'kept') avail.push({ id: a.id, host: a.host, at: a.at, stamp: stamp(a, setup), seq: i });
    });
    var list = avail.slice().sort(function (x, y) { return x.stamp - y.stamp || hostIx(x.host) - hostIx(y.host) || x.seq - y.seq; });
    var ties = false, wrong = false;
    for (var i = 1; i < list.length; i++) {
      if (list[i].stamp === list[i - 1].stamp) ties = true;
      if (list[i].seq < list[i - 1].seq) wrong = true;
    }
    var drifted = avail.some(function (x) { return x.stamp !== x.at; });
    var status, reason;
    if (avail.length < 2) { status = 'no'; reason = 'gaps'; }
    else if (ties) { status = 'no'; reason = 'tie'; }
    else if (wrong) { status = 'no'; reason = 'wrong'; }
    else if (avail.length < sc.actions.length) { status = 'partly'; reason = 'gaps'; }
    else if (drifted) { status = 'partly'; reason = 'drift'; }
    else { status = 'yes'; reason = null; }
    return { list: list, ties: ties, wrong: wrong, status: status, reason: reason };
  }

  /** Rule 7: was evidence removed, and can the investigation tell? yes (the central store kept the wipe), partly (no
      store, but the local logs still visibly begin at the wipe), no (aged out, or no wipe seen yet). */
  function tamper(sc, setup, now) {
    var w = sc.wipe;
    if (!w || now < w.at) return { status: 'none', reason: null };
    if (isAged(w.at, now, setup.keep)) return { status: 'no', reason: 'aged' };
    if (setup.store === 'central') return { status: 'yes', reason: null };
    return { status: 'partly', reason: 'gap' };
  }

  /** Rule 8: the log itself holds personal data, so who may read it is a rule of its own: 'host' (logs on the hosts,
      read and deleted by every admin of each host), 'admins' (a central store every admin may search), 'named' (a
      central store only named reviewers may read). Only 'named' is ok. */
  function access(setup) {
    var who = setup.store !== 'central' ? 'host' : setup.readers === 'named' ? 'named' : 'admins';
    return { who: who, ok: who === 'named' };
  }

  /** Rules 4-8 at time now: per action { id, host, status, copies }, the order, the tamper answer, the access rule. */
  function investigate(sc, setup, now) {
    var acts = sc.actions.map(function (a) {
      var cs = copies(a, sc, setup, now);
      return { id: a.id, host: a.host, at: a.at, stamp: stamp(a, setup), copies: cs, status: best(cs) };
    });
    return { actions: acts, wipes: wipeRecords(sc, setup, now), order: order(sc, setup, now),
      tamper: tamper(sc, setup, now), access: access(setup) };
  }

  var model = {
    DAY: DAY, RANK: RANK, STORES: STORES, READERS: READERS,
    stamp: stamp, isAged: isAged, isLogged: isLogged, copies: copies, best: best, wipeRecords: wipeRecords,
    order: order, tamper: tamper, access: access, investigate: investigate
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).logs = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
