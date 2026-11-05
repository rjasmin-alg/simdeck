/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cap-under-partition: three replicas A, B, C of one key x, two clients (K1 sends to A, K2 to C) and a
   partition that separates {A, B} from {C}. In CP mode writes need W = 2 of 3 acknowledgements and reads consult
   R = 2 of 3, so the minority side answers with an error; in AP mode every replica answers alone (W = R = 1), so the
   minority side stays available, its reads may be stale, the sides diverge and the heal resolves the conflict by
   last-write-wins. One step per action of the run (a request, partition, heal), then a summary step.
   The state keeps db-replication's shape ({ servers, writes }, sims/db-replication/sim.js @ 7262ad5); its functions
   (a primary's log, lag, failover) do not apply to leaderless quorums, so none is copied. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C'];
  var SIDES = [['A', 'B'], ['C']];                 // the partition: K1's side, K2's side
  var CLIENTS = ['K1', 'K2'];                      // processing order within a step (rule 6, T1)
  var HOME = { K1: 'A', K2: 'C' };                 // the coordinator each client sends to
  var QUORUM = { cp: { n: 3, w: 2, r: 2 }, ap: { n: 3, w: 1, r: 1 } };
  var MAX_ACTIONS = 19;                            // + the summary step = 20 steps (COMMON.md §3)
  var TOKENS = { p: 1, h: 1, w1: 1, r1: 1, w2: 1, r2: 1 };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function modeOf(p) { return p.mode === 'ap' ? 'ap' : 'cp'; }

  /**
   * The run: a list of actions, each 'p', 'h' or a list of requests [{ client, op }] in client id order (T1). Unknown
   * tokens are dropped; one request per client per step; a step mixing p/h with requests keeps the first token kind.
   */
  function actionsOf(p) {
    var out = [];
    String(p.ops == null ? '' : p.ops).split('.').forEach(function (step) {
      if (out.length >= MAX_ACTIONS) return;
      var toks = step.split('+').filter(function (x) { return TOKENS[x]; });
      if (!toks.length) return;
      if (toks[0] === 'p' || toks[0] === 'h') { out.push(toks[0]); return; }
      var reqs = [], seen = {};
      toks.forEach(function (x) {
        if (x === 'p' || x === 'h') return;
        var client = 'K' + x.charAt(1);
        if (seen[client]) return;
        seen[client] = true;
        reqs.push({ client: client, op: x.charAt(0) === 'w' ? 'write' : 'read' });
      });
      reqs.sort(function (a, b) { return CLIENTS.indexOf(a.client) - CLIENTS.indexOf(b.client); });
      out.push(reqs);
    });
    return out;
  }

  /** The run back as the `ops` text (the page's buttons rewrite it). */
  function encode(actions) {
    return actions.map(function (a) {
      if (typeof a === 'string') return a;
      return a.map(function (r) { return (r.op === 'write' ? 'w' : 'r') + r.client.charAt(1); }).join('+');
    }).join('.');
  }

  function sideOf(id) { return SIDES[0].indexOf(id) >= 0 ? 0 : 1; }

  /** The replicas a coordinator can reach, itself included, in id order. */
  function reachable(s, from) {
    if (!s.partition) return IDS.slice();
    return IDS.filter(function (id) { return sideOf(id) === sideOf(from); });
  }

  /** LWW order of two versions: later step first, then the larger client id (T2). > 0 when a is newer. */
  function compare(a, b) {
    if (a.at !== b.at) return a.at - b.at;
    var ca = a.client ? CLIENTS.indexOf(a.client) : -1, cb = b.client ? CLIENTS.indexOf(b.client) : -1;
    if (ca !== cb) return ca - cb;
    return a.seq - b.seq;
  }

  /** The newest version among some replicas (T3), as a plain { value, at, client, seq }. */
  function newestOf(s, ids) {
    var best = null;
    ids.forEach(function (id) {
      var v = s.servers[id];
      if (!best || compare(v, best) > 0) best = v;
    });
    return { value: best.value, at: best.at, client: best.client, seq: best.seq };
  }

  function setVersion(s, id, w) {
    var sv = s.servers[id];
    sv.value = w.value; sv.at = w.at; sv.client = w.client; sv.seq = w.seq;
    if (sv.got.indexOf(w.seq) < 0) sv.got.push(w.seq);
    if (s.changed.servers.indexOf(id) < 0) s.changed.servers.push(id);
  }

  /** Rules 1–4: one write. Its value is 1 + the write requests so far; applied where the mode allows. */
  function write(s, client, n) {
    var coord = HOME[client];
    var reach = reachable(s, coord);
    var w = { seq: s.writes.length + 1, client: client, value: s.writes.length + 2, at: n, server: coord, result: 'ok', on: [], lost: false };
    // CP needs W acknowledgements; AP takes the coordinator's alone. Either way it lands on every reachable replica.
    if (reach.length < s.quorum.w) w.result = 'err';
    else {
      reach.forEach(function (id) { setVersion(s, id, w); });
      w.on = reach.slice();
    }
    s.writes.push(w);
    s.requests.push({ client: client, op: 'write', at: n, server: coord, result: w.result, value: w.value, seq: w.seq,
      consulted: reach, newest: null });
  }

  /** Rules 1–4: one read. CP consults every reachable replica and needs R; AP answers from the coordinator alone. */
  function read(s, client, n) {
    var coord = HOME[client];
    var reach = reachable(s, coord);
    var consulted = s.quorum.r === 1 ? [coord] : reach;
    var newest = newestOf(s, IDS);
    var rq = { client: client, op: 'read', at: n, server: coord, result: 'err', value: null, seq: null, consulted: consulted, newest: newest.value };
    if (consulted.length >= s.quorum.r) {
      var got = newestOf(s, consulted);
      rq.value = got.value;
      rq.seq = got.seq;
      rq.result = compare(got, newest) < 0 ? 'stale' : 'ok';
    }
    s.requests.push(rq);
  }

  /** Writes the given side acknowledged since the partition began. */
  function sideWrites(s, side) {
    return s.writes.filter(function (w) {
      return w.result === 'ok' && !w.lost && w.at > s.partitionedAt && sideOf(w.server) === side;
    });
  }

  /** Rule 4: one version per side once both sides accepted a write during this partition, else null. */
  function divergenceOf(s) {
    if (!s.partition) return null;
    if (!sideWrites(s, 0).length || !sideWrites(s, 1).length) return null;
    return SIDES.map(function (side) {
      var v = newestOf(s, side);
      return { side: side.slice(), value: v.value, at: v.at, client: v.client, seq: v.seq };
    });
  }

  /** Rule 5: the heal. A conflict (both sides wrote) is resolved by LWW; otherwise the replicas behind catch up. */
  function heal(s) {
    var div = divergenceOf(s);
    var newest = newestOf(s, IDS);
    var before = {};
    IDS.forEach(function (id) { before[id] = s.servers[id].seq; });
    var out = { kind: div ? 'conflict' : 'catchup', versions: div || [], winner: newest.seq, lost: [], caughtUp: [] };
    if (div) {
      var loser = div[0].seq === newest.seq ? 1 : 0;   // the side whose version lost
      sideWrites(s, loser).forEach(function (w) { w.lost = true; out.lost.push(w.seq); });
    }
    // the winner is a write: a heal with nothing newer than the start has nobody behind
    var w = s.writes.filter(function (x) { return x.seq === newest.seq; })[0];
    IDS.forEach(function (id) {
      if (before[id] !== newest.seq) { setVersion(s, id, w); out.caughtUp.push(id); }
    });
    if (w) IDS.forEach(function (id) { if (w.on.indexOf(id) < 0) w.on.push(id); });
    s.partition = null;
    s.partitionedAt = null;
    return out;
  }

  function tallyOf(s) {
    var out = { lost: s.writes.filter(function (w) { return w.lost; }).length };
    CLIENTS.forEach(function (c) {
      var t = { ok: 0, stale: 0, err: 0, n: 0 };
      s.requests.forEach(function (r) { if (r.client === c) { t[r.result]++; t.n++; } });
      out[c] = t;
    });
    return out;
  }

  var logic = {
    IDS: IDS, SIDES: SIDES, CLIENTS: CLIENTS, HOME: HOME, QUORUM: QUORUM, MAX_ACTIONS: MAX_ACTIONS,
    actionsOf: actionsOf, encode: encode, reachable: reachable, compare: compare, sideOf: sideOf,

    /** Parameter defaults: the first preset (no-partition). */
    defaults: { mode: 'cp', ops: 'w1.r2' },

    /** One step per action, then the summary. */
    steps: function (p) { return actionsOf(p).length + 1; },

    initial: function (p) {
      var mode = modeOf(p);
      var servers = {};
      IDS.forEach(function (id) { servers[id] = { id: id, value: 1, at: 0, client: null, seq: 0, got: [0] }; });
      return {
        n: 0, phase: 'start', mode: mode, quorum: clone(QUORUM[mode]), partition: null, partitionedAt: null,
        servers: servers, writes: [], requests: [], divergence: null, heal: null, tally: null,
        changed: { servers: [], requests: [] }, noop: null
      };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      s.n = n;
      s.heal = null;
      s.noop = null;
      s.changed = { servers: [], requests: [] };
      var act = actionsOf(p)[n - 1];
      if (act === undefined) {
        s.phase = 'summary';
        s.tally = tallyOf(s);
        return s;
      }
      if (act === 'p') {
        if (s.partition) { s.phase = 'noop'; s.noop = 'already'; return s; }
        s.phase = 'partition';
        s.partition = clone(SIDES);
        s.partitionedAt = n;
      } else if (act === 'h') {
        if (!s.partition) { s.phase = 'noop'; s.noop = 'notPartitioned'; return s; }
        s.phase = 'heal';
        s.heal = heal(s);
      } else {
        s.phase = 'request';
        act.forEach(function (r) {
          s.changed.requests.push(s.requests.length);
          if (r.op === 'write') write(s, r.client, n); else read(s, r.client, n);
        });
      }
      s.divergence = divergenceOf(s);
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
