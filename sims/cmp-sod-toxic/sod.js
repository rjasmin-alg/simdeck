/* SPDX-License-Identifier: AGPL-3.0-or-later
   Segregation of duties over a people × rights assignment (catalogue §5.24: cmp-jml-drift is the hub of people ×
   roles × rights; this sim reads the same kind of assignment, one bit mask of rights per person, and checks it
   against a conflict matrix). A small firm's eight duties in four toxic pairs, a team of 3-12 people in two
   departments (office and IT), who may hold which duty, the conflicts an assignment has, how many holders each duty
   needs (one, or two with a deputy), the fewest conflicts a team can reach, an assignment that reaches them, moving
   one duty of a conflict to someone else, and whether a compensating control (an independent review of a log the
   person cannot edit) holds. SPEC.md rules 1-8.
   Pure functions over plain data, no words and no dependencies, ready to be promoted to models/ unchanged
   (models/README.md). In a page it registers on globalThis.SimdeckModels['sod']; under node it is module.exports. */
(function (root) {
  'use strict';

  /** Rule 1: the duties, two per toxic pair: pair k is duties 2k and 2k + 1. */
  var DUTIES = 8;
  var PAIRS = 4;
  var REQUEST = 0, APPROVE = 1, CREATE = 2, PAY = 3, CODE = 4, DEPLOY = 5, BACKUPS = 6, LOGS = 7;
  /** Rule 1: the conflict matrix, as the list of forbidden pairs [a, b] (a < b). */
  var RULES = [[REQUEST, APPROVE], [CREATE, PAY], [CODE, DEPLOY], [BACKUPS, LOGS]];
  var MIN_TEAM = 3, MAX_TEAM = 12;
  var OFFICE = 0, IT = 1;
  var ALL = (1 << DUTIES) - 1;

  /** Rule 2: the department of person i (0-based): office, IT, office, IT, ... */
  function deptOf(i) { return i % 2 === 0 ? OFFICE : IT; }
  /** Rule 2: who may hold a duty: the money duties (0-3) the office, the production duties (4-6) IT, the logs anyone. */
  function eligible(dept, duty) {
    if (duty === LOGS) return true;
    return duty < CODE ? dept === OFFICE : dept === IT;
  }
  /** Rule 2: the duties a person of this department may hold, as a mask. */
  function eligibleMask(dept) {
    var m = 0;
    for (var d = 0; d < DUTIES; d++) if (eligible(dept, d)) m |= 1 << d;
    return m;
  }
  /** The team of n people: [{ id, dept }], id 0…n − 1. */
  function team(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push({ id: i, dept: deptOf(i) });
    return out;
  }
  function popcount(x) {                       // from sims/cmp-jml-drift/access.js @ 59b7f46
    var n = 0;
    while (x) { x &= x - 1; n++; }
    return n;
  }
  function has(mask, d) { return (mask & (1 << d)) !== 0; }

  /** Rule 3: holders each duty needs: one, or two when every duty needs a deputy (cover for absence). */
  function need(deputies) { return deputies ? 2 : 1; }

  /** Rule 3: how many people hold each duty. masks[i] is person i's duties. */
  function holders(masks) {
    var out = [];
    for (var d = 0; d < DUTIES; d++) {
      var c = 0;
      masks.forEach(function (m) { if (has(m, d)) c++; });
      out.push(c);
    }
    return out;
  }
  /** Rule 3: the duties with fewer holders than needed, in duty order: [{ duty, have, need }]. */
  function uncovered(masks, deputies) {
    var r = need(deputies);
    return holders(masks).map(function (have, d) { return { duty: d, have: have, need: r }; })
      .filter(function (x) { return x.have < x.need; });
  }

  /** Rule 4: the conflicts: one per person and forbidden pair the person holds both of, by person, then pair. */
  function conflicts(masks) {
    var out = [];
    masks.forEach(function (m, i) {
      RULES.forEach(function (rule, k) {
        if (has(m, rule[0]) && has(m, rule[1])) out.push({ person: i, pair: k });
      });
    });
    return out;
  }
  /** Rule 4: the matrix: cell [a][b] = how many people hold both duty a and duty b (the diagonal: holders of a). */
  function matrix(masks) {
    var out = [];
    for (var a = 0; a < DUTIES; a++) {
      var row = [];
      for (var b = 0; b < DUTIES; b++) {
        var c = 0;
        masks.forEach(function (m) { if (has(m, a) && has(m, b)) c++; });
        row.push(c);
      }
      out.push(row);
    }
    return out;
  }
  /** Rule 4: the forbidden pair of two duties, or −1. */
  function pairOf(a, b) {
    for (var k = 0; k < PAIRS; k++) {
      var r = RULES[k];
      if ((r[0] === a && r[1] === b) || (r[0] === b && r[1] === a)) return k;
    }
    return -1;
  }

  /** Rule 5: the fewest conflicts a team of n can reach, and how short of holders it stays, per pair. For a pair whose
      two duties the same e people may hold: overlap max(0, 2r − e) if e ≥ r, else all e hold both. For the
      backups-and-logs pair: backups from IT, logs from anyone, overlap max(0, 2r − n) (0 for every team here). */
  function minimum(n, deputies) {
    var r = need(deputies), people = team(n), perPair = [], short = 0;
    RULES.forEach(function (rule) {
      var ea = people.filter(function (p) { return eligible(p.dept, rule[0]); }).length;
      var eb = people.filter(function (p) { return eligible(p.dept, rule[1]); }).length;
      var both = people.filter(function (p) { return eligible(p.dept, rule[0]) && eligible(p.dept, rule[1]); }).length;
      var ha = Math.min(r, ea), hb = Math.min(r, eb);
      short += (r - ha) + (r - hb);
      // the a holders come from the people who may hold both only when there is nobody else; b likewise
      var onlyA = ea - both, onlyB = eb - both;
      var aFromBoth = Math.max(0, ha - onlyA), bFromBoth = Math.max(0, hb - onlyB);
      perPair.push(Math.max(0, aFromBoth + bFromBoth - both));
    });
    return { total: perPair.reduce(function (s, x) { return s + x; }, 0), perPair: perPair, short: short };
  }

  /** Rule 6: an assignment that reaches the minimum. Pairs in order. For a pair whose two duties the same e people may
      hold, k = max(0, 2r − e) of them must hold both (all e when e < r): those k are picked first, people already in
      a conflict before the others (so the overlaps pile up on one person and the rest stay free to hold the logs),
      then fewest duties, then id; the remaining holders of the first duty, then of the second, come from the others
      by fewest duties, then id. For backups + logs: backups to the r IT people with the fewest duties (ties by id),
      logs to the r people not holding backups, people holding no conflict first (so their compensating control
      stays possible), then fewest duties, then id. Returns masks for people 0…n − 1. */
  function share(n, deputies) {
    var r = need(deputies), people = team(n);
    var masks = people.map(function () { return 0; });
    function load(i) { return popcount(masks[i]); }
    function inConflict(i) {
      return RULES.some(function (rule) { return has(masks[i], rule[0]) && has(masks[i], rule[1]); });
    }
    function none() { return 0; }
    function conflictFirst(i) { return inConflict(i) ? 0 : 1; }
    function noConflictFirst(i) { return inConflict(i) ? 1 : 0; }
    function pick(cands, k, key) {
      return cands.slice().sort(function (x, y) { return key(x) - key(y) || load(x) - load(y) || x - y; }).slice(0, k);
    }
    function who(d) { return people.filter(function (p) { return eligible(p.dept, d); }).map(function (p) { return p.id; }); }
    function give(ids, d) { ids.forEach(function (i) { masks[i] |= 1 << d; }); }
    RULES.forEach(function (rule) {
      var a = rule[0], b = rule[1], ea = who(a), eb = who(b);
      if (ea.join() === eb.join()) {
        var e = ea.length, k = e < r ? e : Math.max(0, 2 * r - e), each = Math.min(r, e) - k;
        var both = pick(ea, k, conflictFirst);
        give(both, a); give(both, b);
        var rest = ea.filter(function (i) { return both.indexOf(i) < 0; });
        var ga = pick(rest, each, none);
        give(ga, a);
        give(pick(rest.filter(function (i) { return ga.indexOf(i) < 0; }), each, none), b);
      } else {
        give(pick(ea, r, none), a);
        give(pick(eb.filter(function (i) { return !has(masks[i], a); }), r, noConflictFirst), b);
      }
    });
    return masks;
  }

  /** Rule 7: split one conflict by moving one of its two duties to someone else. The second duty first, then the
      first; the taker may hold that duty (rule 2), holds neither duty of the pair now, and is the one with the fewest
      duties (ties by id). Holders per duty stay the same, and no new conflict appears. Returns { masks, duty, to }
      or null when nobody can take either duty. */
  function split(masks, person, pair, depts) {
    var rule = RULES[pair];
    if (!has(masks[person], rule[0]) || !has(masks[person], rule[1])) return null;
    var order = [rule[1], rule[0]];
    for (var j = 0; j < order.length; j++) {
      var d = order[j];
      var best = -1;
      for (var i = 0; i < masks.length; i++) {
        if (i === person || !eligible(depts[i], d)) continue;
        if (has(masks[i], rule[0]) || has(masks[i], rule[1])) continue;
        if (best < 0 || popcount(masks[i]) < popcount(masks[best])) best = i;
      }
      if (best >= 0) {
        var out = masks.slice();
        out[person] &= ~(1 << d);
        out[best] |= 1 << d;
        return { masks: out, duty: d, to: best };
      }
    }
    return null;
  }

  /** Rule 8: a compensating control on a conflict holds when (a) the person cannot edit the log the review reads (does
      not hold the logs duty) and (b) someone independent reviews it: another person holding neither duty of the
      pair, the first by id. Returns { ok, why: null | 'logs' | 'reviewer', reviewer: id | null }; 'logs' wins. */
  function control(masks, person, pair) {
    var rule = RULES[pair], reviewer = null;
    for (var i = 0; i < masks.length; i++) {
      if (i !== person && !has(masks[i], rule[0]) && !has(masks[i], rule[1])) { reviewer = i; break; }
    }
    if (has(masks[person], LOGS)) return { ok: false, why: 'logs', reviewer: reviewer };
    if (reviewer === null) return { ok: false, why: 'reviewer', reviewer: null };
    return { ok: true, why: null, reviewer: reviewer };
  }

  var model = {
    DUTIES: DUTIES, PAIRS: PAIRS, RULES: RULES, MIN_TEAM: MIN_TEAM, MAX_TEAM: MAX_TEAM, OFFICE: OFFICE, IT: IT,
    ALL: ALL, REQUEST: REQUEST, APPROVE: APPROVE, CREATE: CREATE, PAY: PAY, CODE: CODE, DEPLOY: DEPLOY,
    BACKUPS: BACKUPS, LOGS: LOGS,
    deptOf: deptOf,
    eligible: eligible,
    eligibleMask: eligibleMask,
    team: team,
    popcount: popcount,
    has: has,
    need: need,
    holders: holders,
    uncovered: uncovered,
    conflicts: conflicts,
    matrix: matrix,
    pairOf: pairOf,
    minimum: minimum,
    share: share,
    split: split,
    control: control
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).sod = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
