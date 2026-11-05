/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for db-replication: a client writes x once per 100 ms to a primary that acknowledges at once (asynchronous
   replication); one or two replicas apply the same log records in LSN order, each later by its lag. The client may read
   x back from a replica (stale unless it waits for its own LSN), or the primary fails: the replica with the highest
   applied LSN is promoted, acknowledged records above it are lost, the other replica follows it, and the old primary
   coming back is refused and rebuilt. Rules, tie-breaks and numbers: SPEC.md.
   Preset sync-async-replication (SPEC.md "Synchronous commit"): R1 may be synchronous (the primary acknowledges a write
   only once R1 has it, one round trip later), R1 may become unreachable at 500 ms, and the primary then blocks its
   commits or degrades to asynchronous. Those params add fields to the state; without them every state is the host's.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON; time is an integer in ms.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var TICK = 100;          // one step of the clock (ms); LSN k is written at k × TICK
  var READ_AT = 600;       // the read scenario: writes 1–5, then the client reads x back at 600 ms
  var READ_AFTER = 5;      // the client's own last write before the read
  var READ_TICKS = 8;      // the read scenario runs at least to 800 ms
  var PLAIN_TICKS = 10;    // no read and no failure: ten writes
  var REPLICAS = ['R1', 'R2'];
  var RTTS = [1, 10, 40];  // the synchronous replica's round-trip time (ms): same room, same city, another site
  var DOWN_AT = 500;       // R1 becomes unreachable from the primary after the write at 500 ms

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampLag(v) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = 0;
    return Math.max(0, Math.min(1000, n));
  }

  /** The params the model acts on (SPEC.md "Params"): a read scenario has no failure; prefer only with two replicas. */
  function eff(p) {
    var read = !!p.read;
    var sync = !read && p.mode === 'sync';
    // synchronous commit is shown with one replica (quorum commit over several is out of scope)
    var replicas = Number(p.replicas) === 2 && !sync ? 2 : 1;
    var fail = Number(p.failAt);
    var failAt = !read && (fail === 600 || fail === 1000) ? fail : 0;
    var prefer = replicas === 2 && (p.prefer === 'R1' || p.prefer === 'R2') ? p.prefer : 'none';
    return {
      replicas: replicas,
      lags: { R1: clampLag(p.lag1), R2: clampLag(p.lag2) },
      read: read,
      readFrom: p.readFrom === 'primary' ? 'P' : 'R1',
      rywWait: read && p.readFrom !== 'primary' && !!p.rywWait,
      failAt: failAt,
      prefer: prefer,
      oldBack: !!failAt && !!p.oldBack,
      // synchronous commit (SPEC.md S1–S5): not with the read scenario; R1 unreachable only when it is synchronous
      mode: sync ? 'sync' : 'async',
      rttMs: RTTS.indexOf(Number(p.rttMs)) >= 0 ? Number(p.rttMs) : RTTS[0],
      onSyncLost: p.onSyncLost === 'degrade' ? 'degrade' : 'block',
      r1DownAt: sync && Number(p.replicaDown) === DOWN_AT ? DOWN_AT : 0
    };
  }

  /** The synchronous-commit params are in use: the state carries their fields (SPEC.md "State added"). */
  function extOf(e) { return e.mode === 'sync'; }

  /** Commit latency the replication adds: one round trip to a synchronous replica, nothing when asynchronous (S1, S3). */
  function commitLatency(mode, rttMs) { return mode === 'sync' ? rttMs : 0; }

  /** A client that waits for each commit before the next one manages at most 1000 / latency commits per second (S1). */
  function serialRate(latencyMs) { return latencyMs > 0 ? Math.floor(1000 / latencyMs) : null; }

  /** Clock ticks before any failover step (SPEC.md "Steps"). */
  function ticksOf(e) {
    if (e.read) return e.readFrom === 'P' ? READ_TICKS : Math.max(READ_TICKS, Math.ceil((READ_AFTER * TICK + e.lags.R1) / TICK));
    if (e.failAt) return e.failAt / TICK;
    return PLAIN_TICKS;
  }

  /** The event of step n after the ticks: fail, promote, follow (two replicas), return and rebuild (old primary back). */
  function eventsOf(e) {
    if (!e.failAt) return [];
    var out = ['fail', 'promote'];
    if (e.replicas === 2) out.push('follow');
    if (e.oldBack) out.push('return', 'rebuild');
    return out;
  }

  /**
   * Every step in order: the ticks 1 … n (numbers), the replica becoming unreachable right after its tick
   * ('replicaDown', no clock time), then the failover events.
   */
  function planOf(e) {
    var out = [], ticks = ticksOf(e);
    for (var n = 1; n <= ticks; n++) {
      out.push(n);
      if (e.r1DownAt && n * TICK === e.r1DownAt) out.push('replicaDown');
    }
    return out.concat(eventsOf(e));
  }

  /** Rule 1: the highest LSN a replica has applied at time t (records apply in LSN order, at `at + lag`). */
  function appliedAt(writes, lag, t) {
    var k = 0;
    while (k < writes.length && writes[k].at + lag <= t) k++;
    return k;
  }

  /** Rule 2: the value of x on a server that has applied up to `applied` (x = k after record k; 0 before any). */
  function valueAt(writes, applied) {
    return applied > 0 ? writes[applied - 1].value : 0;
  }

  /**
   * Rule 4: the replica to promote among the reachable candidates [{ id, applied }]: the highest applied LSN; on a tie
   * the preferred replica (`prefer`), then the lower id. Returns the id, or null with no candidate.
   */
  function pickPromoted(cands, prefer) {
    var list = cands.slice().sort(function (a, b) {
      if (a.applied !== b.applied) return b.applied - a.applied;
      var pa = a.id === prefer ? 0 : 1, pb = b.id === prefer ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return list.length ? list[0].id : null;
  }

  /** Rule 5: the acknowledged LSNs above the promoted replica's applied LSN. */
  function lostTail(primaryLsn, promotedLsn) {
    var out = [];
    for (var k = promotedLsn + 1; k <= primaryLsn; k++) out.push(k);
    return out;
  }

  /**
   * Rules 6 and 7: what a server with `applied` must do to follow a new primary at `newLsn`. Behind or level: catch up
   * (receive the records it lacks). Ahead: it holds records the new history does not have, so it is rewound (those
   * records discarded), never re-attached as it is.
   */
  function followPlan(applied, newLsn) {
    var receive = [], discard = [];
    for (var k = applied + 1; k <= newLsn; k++) receive.push(k);
    for (var j = newLsn + 1; j <= applied; j++) discard.push(j);
    return { action: discard.length ? 'rewind' : 'catchup', receive: receive, discard: discard };
  }

  function lastOwnLsn(s) { return s.writes.length ? s.writes[s.writes.length - 1].lsn : 0; }

  /** Serve a read if it may be answered now (rule 3): with a wait, only once the server has applied that LSN. */
  function serve(s, read, lags) {
    var sv = s.servers[read.from];
    if (read.wait !== null && sv.applied < read.wait) return false;
    read.got = valueAt(s.writes, sv.applied);
    read.gotLsn = sv.applied;
    read.fresh = sv.applied >= read.own;
    // answered when the record it waited for was applied (between ticks), never before it was asked
    read.servedAt = read.wait === null ? read.at : Math.max(read.at, s.writes[read.wait - 1].at + (read.from === 'P' ? 0 : lags[read.from]));
    return true;
  }

  function tick(s, e, n) {
    s.t = n * TICK;
    s.phase = 'tick';
    var P = s.servers.P;
    // (1) the client's write reaches the primary and is acknowledged at once (rule 1)
    var writes = e.read ? s.t <= READ_AFTER * TICK : true;
    if (writes) {
      var lsn = s.writes.length + 1;
      s.writes.push({ lsn: lsn, at: s.t, key: 'x', value: lsn, acked: true });
      P.applied = lsn;
      s.changed.applied.P = [lsn];
      s.changed.wrote = lsn;
    }
    // (2) each replica applies the records whose time has come, in LSN order
    REPLICAS.slice(0, e.replicas).forEach(function (id) {
      var r = s.servers[id];
      var to = appliedAt(s.writes, r.lagMs, s.t);
      if (to > r.applied) {
        var got = [];
        for (var k = r.applied + 1; k <= to; k++) got.push(k);
        s.changed.applied[id] = got;
        r.applied = to;
      }
    });
    // (3) the read: asked at READ_AT, or a waiting one answered now
    if (e.read && s.t === READ_AT) {
      var read = { at: s.t, from: e.readFrom, key: 'x', own: lastOwnLsn(s), wait: e.rywWait ? lastOwnLsn(s) : null,
        got: null, gotLsn: null, fresh: null, servedAt: null };
      s.reads.push(read);
      s.changed.asked = true;
      if (serve(s, read, e.lags)) s.changed.served = true;
    } else {
      s.reads.forEach(function (rd) {
        if (rd.servedAt === null && serve(s, rd, e.lags)) s.changed.served = true;
      });
    }
  }

  /**
   * A tick with the synchronous-commit params (S1–S5): (1) the write reaches the primary's log, (2) each reachable
   * replica takes what has come (a synchronous one: everything, it confirms within the tick since RTT < 100 ms),
   * (3) the primary acknowledges what it may: at once when asynchronous or degraded, one round trip later when R1 has
   * confirmed, and never while R1 is unreachable and the policy is block.
   */
  function tickExt(s, e, n) {
    s.t = n * TICK;
    s.phase = 'tick';
    var P = s.servers.P;
    var lsn = s.writes.length + 1;
    s.writes.push({ lsn: lsn, at: s.t, key: 'x', value: lsn, acked: false, ackAt: null });
    P.applied = lsn;
    s.changed.applied.P = [lsn];
    s.changed.wrote = lsn;
    REPLICAS.slice(0, e.replicas).forEach(function (id) {
      var r = s.servers[id];
      if (!r.reachable) return;
      var to = r.mode === 'sync' ? s.writes.length : appliedAt(s.writes, r.lagMs, s.t);
      if (to > r.applied) {
        var got = [];
        for (var k = r.applied + 1; k <= to; k++) got.push(k);
        s.changed.applied[id] = got;
        r.applied = to;
      }
    });
    var R1 = s.servers.R1;
    var waits = R1.mode === 'sync' && !s.degraded;
    s.writes.forEach(function (w) {
      if (w.acked) return;
      var ms;
      if (!waits) ms = 0;
      else if (R1.reachable && R1.applied >= w.lsn) ms = s.rttMs;
      else {
        if (s.blocked.indexOf(w.lsn) < 0) { s.blocked.push(w.lsn); s.changed.blocked.push(w.lsn); }
        return;
      }
      w.acked = true;
      w.ackAt = w.at + ms;
      s.ackLatency.push({ lsn: w.lsn, ms: ms });
      s.changed.acked.push(w.lsn);
    });
  }

  function freshChanged(e) {
    var c = { applied: {}, roles: [], received: {}, discarded: {} };
    if (extOf(e)) { c.acked = []; c.blocked = []; }
    return c;
  }

  var logic = {
    TICK: TICK,
    DOWN_AT: DOWN_AT,
    READ_AT: READ_AT,

    defaults: { replicas: 1, lag1: 250, lag2: 600, read: false, readFrom: 'replica', rywWait: false, failAt: 0,
      prefer: 'none', oldBack: false, mode: 'async', rttMs: 1, onSyncLost: 'block', replicaDown: 0 },

    /** Ticks (8–15, 6 or 10 before a failure), [replicaDown], then fail, promote, [follow], [return, rebuild]: at most 15. */
    steps: function (p) {
      return planOf(eff(p)).length;
    },

    initial: function (p) {
      var e = eff(p);
      var servers = { P: { id: 'P', up: true, applied: 0, role: 'primary', lagMs: 0, follows: null, extra: [], discarded: [] } };
      REPLICAS.slice(0, e.replicas).forEach(function (id) {
        servers[id] = { id: id, up: true, applied: 0, role: 'replica', lagMs: e.lags[id], follows: 'P', extra: [], discarded: [] };
        if (extOf(e)) {
          servers[id].mode = e.mode;
          servers[id].reachable = true;
        }
      });
      var s = {
        t: 0, phase: 'start', ids: ['P'].concat(REPLICAS.slice(0, e.replicas)),
        writes: [], servers: servers, reads: [],
        primary: 'P', failedAt: null, promoted: null, lost: [], refused: false,
        changed: freshChanged(e)
      };
      if (extOf(e)) {
        s.mode = e.mode;
        s.rttMs = e.rttMs;
        s.onSyncLost = e.onSyncLost;
        s.degraded = false;
        s.ackLatency = [];
        s.blocked = [];
      }
      return s;
    },

    step: function (prev, n, p) {
      var e = eff(p);
      var s = clone(prev);
      s.changed = freshChanged(e);
      var ev = planOf(e)[n - 1];
      if (typeof ev === 'number') {
        if (extOf(e)) tickExt(s, e, ev);
        else tick(s, e, ev);
        return s;
      }
      s.phase = ev;
      var P = s.servers.P;
      if (ev === 'replicaDown') {
        // S4: R1 (or the link to it) fails; the primary cannot reach it. A synchronous primary blocks or degrades.
        s.servers.R1.reachable = false;
        if (e.onSyncLost === 'degrade') s.degraded = true;
        s.changed.roles = ['R1'];
        return s;
      }
      if (ev === 'fail') {
        // the primary stops; records it had not yet shipped never reach a replica
        P.up = false;
        s.failedAt = s.t;
        s.changed.roles = ['P'];
        return s;
      }
      if (ev === 'promote') {
        var cands = s.ids.filter(function (id) { return id !== 'P' && s.servers[id].up; })
          .map(function (id) { return { id: id, applied: s.servers[id].applied }; });
        var id = pickPromoted(cands, e.prefer);
        var np = s.servers[id];
        np.role = 'primary';
        np.follows = null;
        s.primary = id;
        s.promoted = id;
        P.role = 'old';
        // only what the client was told was committed is lost; a blocked commit was never acknowledged (S4)
        s.lost = lostTail(P.applied, np.applied).filter(function (k) { return s.writes[k - 1].acked; });
        s.writes.forEach(function (w) { if (s.lost.indexOf(w.lsn) >= 0) w.lost = true; });
        s.changed.roles = [id, 'P'];
        return s;
      }
      var NP = s.servers[s.primary];
      if (ev === 'follow') {
        s.ids.filter(function (x) { return x !== 'P' && x !== s.primary; }).forEach(function (x) {
          var r = s.servers[x];
          var plan = followPlan(r.applied, NP.applied);
          r.follows = s.primary;
          r.applied = NP.applied;
          r.discarded = plan.discard;
          r.lagMs = 0;
          s.changed.received[x] = plan.receive;
          s.changed.discarded[x] = plan.discard;
          if (plan.receive.length) s.changed.applied[x] = plan.receive;
          s.changed.roles.push(x);
        });
        return s;
      }
      if (ev === 'return') {
        // rule 7: it comes back with its whole log; records the new primary lacks conflict with the new history
        P.up = true;
        P.role = 'returned';
        P.extra = followPlan(P.applied, NP.applied).discard;
        s.refused = P.extra.length > 0;
        s.changed.roles = ['P'];
        return s;
      }
      // rebuild: the old primary drops what the new history lacks and follows the new primary as a replica
      var plan = followPlan(P.applied, NP.applied);
      P.discarded = plan.discard;
      P.extra = [];
      P.applied = NP.applied;
      P.role = 'replica';
      P.follows = s.primary;
      s.changed.discarded.P = plan.discard;
      s.changed.received.P = plan.receive;
      s.changed.roles = ['P'];
      return s;
    },

    // exported for tests and the page
    eff: eff,
    ticksOf: ticksOf,
    eventsOf: eventsOf,
    appliedAt: appliedAt,
    valueAt: valueAt,
    pickPromoted: pickPromoted,
    lostTail: lostTail,
    followPlan: followPlan,
    extOf: extOf,
    planOf: planOf,
    commitLatency: commitLatency,
    serialRate: serialRate
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
