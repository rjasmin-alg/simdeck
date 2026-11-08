/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wifi-roaming: a client walks a 60 m corridor past three access points of one ESS and decides itself
   when to roam (rules and numbers: SPEC.md). An explorer: the state is derived from the params by replaying the
   walk from 0 m in 1 m steps, so it has memory (hysteresis) and stays pure and deterministic.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   Reusable part (rssi, settingsOf, decide, walk) is plain functions over plain data, promotable to models/. */
(function (root) {
  'use strict';

  /** The three APs of one ESS on one distribution system: x along the corridor, all OFFSET m off the walking line. */
  var APS = [{ id: 'A', x: 0 }, { id: 'B', x: 30 }, { id: 'C', x: 60 }];
  var IDS = ['A', 'B', 'C'];
  var LENGTH = 60;
  var OFFSET = 3;

  /** Log-distance model: −40 dBm at 1 m, path-loss exponent 3 (rule 1; derived teaching model, not measured). */
  var REF_DBM = -40;
  var EXPONENT = 3;

  /** Client types (rule 2): when to look (trigger) and how much better a candidate must be (delta). */
  var CLIENTS = {
    'default': { trigger: -70, delta: 8 },
    sticky: { trigger: -85, delta: 8 }
  };

  var BTM_LEVEL = -75; // rule 5: the AP asks the client to move below this
  var LOST_LEVEL = -90; // rule 6: below this the client loses the AP
  var GOOD_LEVEL = -67; // rule 7: ≥ −67 good (voice-grade)
  var FAIR_LEVEL = -80; // rule 7: ≥ −80 fair, below poor

  function apById(id) { return APS[IDS.indexOf(id)]; }

  /** Received signal in dBm from the AP with id `id`, for a client at x m on the walking line (rule 1). */
  function rssi(id, x) {
    var dx = x - apById(id).x;
    var d = Math.sqrt(dx * dx + OFFSET * OFFSET);
    return REF_DBM - 10 * EXPONENT * Math.log10(d);
  }

  /** RSSI of every AP at x: { A, B, C }. */
  function rssiAll(x) {
    var r = {};
    IDS.forEach(function (id) { r[id] = rssi(id, x); });
    return r;
  }

  /** The strongest AP among ids; equal RSSI goes to the lower letter (rule 3: strict comparison in letter order). */
  function strongest(r, ids) {
    var best = null;
    IDS.forEach(function (id) { // letter order, whatever the order of ids
      if (ids.indexOf(id) >= 0 && (best === null || r[id] > r[best])) best = id;
    });
    return best;
  }

  function others(cur) { return IDS.filter(function (id) { return id !== cur; }); }

  /** Trigger and delta in use for the params: the client type's, or the sliders' for custom. */
  function settingsOf(p) {
    var c = CLIENTS[p.client];
    return c ? { trigger: c.trigger, delta: c.delta } : { trigger: p.trigger, delta: p.delta };
  }

  function quality(dbm) { return dbm >= GOOD_LEVEL ? 'good' : dbm >= FAIR_LEVEL ? 'fair' : 'poor'; }

  /**
   * One 1 m step of the walk at x, associated to `cur`. Returns what happened and why:
   * { to (AP after the step), roam ({ x, from, to, reason, rssiFrom, rssiTo } or null), request (BTM, or null),
   *   look: { under, best, margin, enough } (the client's own check, rule 2), btmSent }.
   * Order: link lost (rule 6), then the client's rule (rule 2), then the AP's BTM request (rule 5).
   */
  function decide(cur, x, set, p, btmSent) {
    var r = rssiAll(x);
    var out = { to: cur, roam: null, request: null, look: null, btmSent: btmSent };
    var best = strongest(r, others(cur));
    var margin = r[best] - r[cur];
    out.look = { under: r[cur] < set.trigger, best: best, margin: margin, enough: margin > set.delta };
    if (r[cur] < LOST_LEVEL) {
      // the client has lost the AP: it scans and joins the strongest one again (a full join, not a reassociation)
      out.roam = { x: x, from: cur, to: best, reason: 'lost', rssiFrom: r[cur], rssiTo: r[best] };
    } else if (out.look.under && out.look.enough) {
      out.roam = { x: x, from: cur, to: best, reason: 'client', rssiFrom: r[cur], rssiTo: r[best] };
    } else if (p.btm && !btmSent && r[cur] < BTM_LEVEL && r[best] > r[cur]) {
      // the AP can only ask, once per association, naming its strongest neighbour if that one is stronger
      var accepted = p.support === 'cooperative';
      out.request = { x: x, from: cur, to: best, accepted: accepted, rssiFrom: r[cur], rssiTo: r[best] };
      out.btmSent = true;
      if (accepted) out.roam = { x: x, from: cur, to: best, reason: 'btm', rssiFrom: r[cur], rssiTo: r[best] };
    }
    if (out.roam) { out.to = out.roam.to; out.btmSent = false; }
    return out;
  }

  /** The walk from 0 m to `to` m (rule 4: starts associated to AP-A). path[x] is the AP after the step at x. */
  function walk(p, to) {
    var set = settingsOf(p);
    var cur = 'A', sent = false;
    var path = [], roams = [], requests = [], looks = [];
    for (var x = 0; x <= to; x++) {
      var d = decide(cur, x, set, p, sent);
      if (d.request) requests.push(d.request);
      if (d.roam) roams.push(d.roam);
      cur = d.to;
      sent = d.btmSent;
      path.push(cur);
      looks.push(d.look);
    }
    return { path: path, roams: roams, requests: requests, looks: looks };
  }

  function upTo(list, x) { return list.filter(function (e) { return e.x <= x; }); }

  var logic = {
    APS: APS,
    IDS: IDS,
    LENGTH: LENGTH,
    OFFSET: OFFSET,
    CLIENTS: CLIENTS,
    BTM_LEVEL: BTM_LEVEL,
    LOST_LEVEL: LOST_LEVEL,
    GOOD_LEVEL: GOOD_LEVEL,
    FAIR_LEVEL: FAIR_LEVEL,

    /** Parameter defaults. trigger and delta are used only by the custom client. */
    defaults: { position: 0, client: 'default', trigger: -70, delta: 8, btm: false, support: 'legacy' },

    /** Presets (the page names them in strings.js as preset_<id>). Positions are the moments the captions talk about. */
    presets: [
      { id: 'default-walk', params: { client: 'default', position: 20 } },
      { id: 'sticky-client', params: { client: 'sticky', position: 30 } },
      { id: 'no-hysteresis', params: { client: 'custom', trigger: -70, delta: 0, position: 15 } },
      { id: 'ap-asks', params: { client: 'sticky', btm: true, support: 'legacy', position: 16 } },
      { id: 'ap-asks-cooperative', params: { client: 'sticky', btm: true, support: 'cooperative', position: 16 } }
    ],

    rssi: rssi,
    rssiAll: rssiAll,
    strongest: strongest,
    settingsOf: settingsOf,
    quality: quality,
    decide: decide,
    walk: walk,

    /**
     * State for the params (explorer: no steps). The walk to the client's position, plus the whole corridor's walk
     * (the chart draws where the roams will happen ahead; the walk is causal, so its first part is the same walk).
     */
    initial: function (p) {
      var x = p.position;
      var whole = walk(p, LENGTH);
      var r = rssiAll(x);
      var cur = whole.path[x];
      var set = settingsOf(p);
      return {
        x: x,
        current: cur,
        rssi: r,
        quality: quality(r[cur]),
        trigger: set.trigger,
        delta: set.delta,
        roams: upTo(whole.roams, x),
        requests: upTo(whole.requests, x),
        look: whole.looks[x],
        path: whole.path,
        allRoams: whole.roams,
        allRequests: whole.requests
      };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
