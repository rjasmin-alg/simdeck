/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for raft: Raft leader election and log replication on five servers S1–S5 (SPEC.md; D. Ongaro and
   J. Ousterhout, "In Search of an Understandable Consensus Algorithm", USENIX ATC 2014, §5 and Figure 2).
   An event-driven simulation in milliseconds: election timers, heartbeats, messages with a fixed delay, client
   commands, crashes and a partition. One step advances to the next event time that changes something you can see
   (SPEC.md "Steps"); quiet heartbeat rounds are folded into it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var IDS = ['S1', 'S2', 'S3', 'S4', 'S5'];
  var DELAY = 10;          // ms, one message on a link (SPEC.md rule 0)
  var HEARTBEAT = 50;      // ms between a leader's AppendEntries rounds (rule 4)
  var QUIET_CAP = 1000;    // ms of quiet heartbeats one step may fold before it stops anyway
  var FREE_STEPS = 20;     // steps once the user has pressed an action button

  // from sims/quorum-split-brain/sim.js @ ccda38b: more than half of the configured voters
  function neededOf(total) { return Math.floor(total / 2) + 1; }
  var MAJORITY = neededOf(IDS.length);

  var BASE = { S1: [150], S2: [200], S3: [250], S4: [280], S5: [300] };
  var PARTITION = [['S1', 'S2'], ['S3', 'S4', 'S5']];

  /** The five presets: per-server election timeouts (the k-th election a server starts draws entry k, the last one
      repeats), scenario events, the time step 0 shows (events up to it are replayed silently), and the step count. */
  var SCENARIOS = {
    'first-election': { timeouts: BASE, events: [], from: 0, steps: 4 },
    'replicate-commit': { timeouts: BASE, from: 190, steps: 4,
      events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }] },
    'leader-crash': { timeouts: BASE, from: 270, steps: 8,
      events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 300, type: 'crash', id: 'S1' },
        { at: 500, type: 'client', to: 'S2', cmd: 'x←2' }] },
    'minority-leader': { timeouts: BASE, from: 270, steps: 12,
      events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 310, type: 'partition' },
        { at: 310, type: 'client', to: 'S1', cmd: 'x←2' }, { at: 540, type: 'client', to: 'S3', cmd: 'x←3' },
        { at: 570, type: 'heal' }] },
    'split-vote': { timeouts: { S1: [150, 170], S2: [150, 230], S3: [250], S4: [280], S5: [300] }, from: 0, steps: 8,
      down: ['S5'], slow: { 'S1-S4': 20, 'S2-S3': 20 }, events: [] }
  };
  var SC_IDS = Object.keys(SCENARIOS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  /** The scenario of params p: a preset id, or (tests only) a scenario object of the same shape. */
  function sc(p) { return p.sc && typeof p.sc === 'object' ? p.sc : SCENARIOS[p.sc] || SCENARIOS['first-election']; }
  function srv(s, id) { for (var i = 0; i < s.servers.length; i++) if (s.servers[i].id === id) return s.servers[i]; return null; }
  function lastIndex(v) { return v.log.length; }
  function lastTerm(v) { return v.log.length ? v.log[v.log.length - 1].term : 0; }
  function timeoutOf(p, v) { var l = sc(p).timeouts[v.id]; return l[Math.min(v.elections, l.length - 1)]; }
  function delayOf(p, a, b) {
    var slow = sc(p).slow || {};
    return slow[a + '-' + b] || slow[b + '-' + a] || DELAY;
  }
  function canTalk(s, a, b) {
    if (!s.partition) return true;
    return s.partition.some(function (g) { return g.indexOf(a) >= 0 && g.indexOf(b) >= 0; });
  }

  /** User actions from the param: "5:crash,7:client" → [{ n: 5, type: 'crash' }, …] (n = the step they act in). */
  function parseActs(acts) {
    if (!acts) return [];
    return String(acts).split(',').map(function (a) {
      var m = /^(\d+):(crash|partition|heal|client)$/.exec(a.trim());
      return m ? { n: Number(m[1]), type: m[2] } : null;
    }).filter(Boolean);
  }
  /** acts with a new action at step n: later ones are dropped (the demo continues from here). */
  function addAct(acts, n, type) {
    return parseActs(acts).filter(function (a) { return a.n <= n; }).map(function (a) { return a.n + ':' + a.type; })
      .concat([n + ':' + type]).join(',');
  }

  // ── messages ──

  function send(s, p, from, to, m) {
    m.from = from; m.to = to; m.id = ++s.seq; m.sentAt = s.t;
    var dst = srv(s, to);
    if (!dst.up || !canTalk(s, from, to)) { s.ev.dropped.push(m); return; } // lost at once: crashed or cut off
    m.at = s.t + delayOf(p, from, to);
    s.msgs.push(m);
    s.ev.sent.push(m.id);
    if (m.type === 'RV' || m.type === 'RVR') s.ev.loud = true;
  }

  function sendAE(s, p, L, peer) {
    var prev = L.next[peer] - 1;
    send(s, p, L.id, peer, { type: 'AE', term: L.term, prevIndex: prev, prevTerm: prev > 0 ? L.log[prev - 1].term : 0,
      entries: clone(L.log.slice(prev)), commit: L.commitIndex });
  }

  function broadcastAE(s, p, L) {
    IDS.forEach(function (peer) { if (peer !== L.id) sendAE(s, p, L, peer); });
    L.hbAt = s.t + HEARTBEAT;
  }

  // ── roles (rules 1–5) ──

  /** Rule 1: a higher term makes any server a follower of that term with no vote yet. */
  function seeTerm(s, p, v, term) {
    if (term <= v.term) return;
    var was = v.role;
    v.term = term;
    v.votedFor = null;
    v.leader = null;
    if (was !== 'follower') {
      toFollower(s, p, v);
      s.notes.push({ k: 'stepdown', s: v.id, term: term, was: was });
    }
  }

  function toFollower(s, p, v) {
    v.role = 'follower';
    v.votes = [];
    v.hbAt = null;
    v.next = null;
    v.match = null;
    v.timerAt = s.t + v.timeout;
  }

  /** Rule 2: the election timer expires: next term, vote for yourself, ask everyone. */
  function startElection(s, p, v) {
    v.term += 1;
    v.role = 'candidate';
    v.votedFor = v.id;
    v.votes = [v.id];
    v.leader = null;
    v.elections += 1;
    v.timeout = timeoutOf(p, v);
    v.timerAt = s.t + v.timeout;
    s.notes.push({ k: 'timeout', s: v.id, term: v.term, next: v.timerAt });
    IDS.forEach(function (peer) {
      if (peer !== v.id) send(s, p, v.id, peer, { type: 'RV', term: v.term, lastIndex: lastIndex(v), lastTerm: lastTerm(v) });
    });
  }

  /** Rule 4: a majority of votes: leader, every follower's next entry is after our last, heartbeat at once. */
  function becomeLeader(s, p, v) {
    v.role = 'leader';
    v.leader = v.id;
    v.timerAt = null;
    v.next = {};
    v.match = {};
    IDS.forEach(function (peer) { if (peer !== v.id) { v.next[peer] = lastIndex(v) + 1; v.match[peer] = 0; } });
    s.notes.push({ k: 'leader', s: v.id, term: v.term, votes: v.votes.slice() });
    broadcastAE(s, p, v);
  }

  /** Rule 3 (§5.4.1): the candidate's log is at least as up to date as the voter's. */
  function upToDate(mTerm, mIndex, v) {
    return mTerm > lastTerm(v) || (mTerm === lastTerm(v) && mIndex >= lastIndex(v));
  }

  /** Rule 6 (§5.3, §5.4.2): the highest index of the current term stored on a majority is committed, and with it
      every earlier entry. Entries of earlier terms are never committed by counting. */
  function advanceCommit(s, L) {
    for (var n = lastIndex(L); n > L.commitIndex; n--) {
      if (L.log[n - 1].term !== L.term) continue;
      var on = storedOn(L, n);
      if (on.length >= MAJORITY) {
        s.notes.push({ k: 'commit', s: L.id, index: n, from: L.commitIndex + 1, on: on });
        L.commitIndex = n;
        return;
      }
    }
  }

  /** How many servers (itself included) a server can reach now: the size of its side of the partition. */
  function reachOf(s, id) {
    var side = s.partition ? s.partition.filter(function (g) { return g.indexOf(id) >= 0; })[0] : IDS;
    return side.filter(function (x) { return srv(s, x).up; }).length;
  }

  /** The servers the leader knows hold entry n (itself and every follower whose match reached n). */
  function storedOn(L, n) {
    return IDS.filter(function (id) { return id === L.id || (L.match[id] || 0) >= n; });
  }

  // ── delivery ──

  function deliver(s, p, m) {
    var v = srv(s, m.to);
    if (!v.up || !canTalk(s, m.from, m.to)) { s.ev.dropped.push(m); return; }
    var d = { id: m.id, from: m.from, to: m.to, type: m.type, term: m.term };
    s.ev.delivered.push(d);
    seeTerm(s, p, v, m.term);
    if (m.type === 'RV') {
      s.ev.loud = true;
      var why = null;
      if (m.term < v.term) why = 'term';
      else if (v.votedFor !== null && v.votedFor !== m.from) why = 'voted';
      else if (!upToDate(m.lastTerm, m.lastIndex, v)) why = 'log';
      if (!why) { v.votedFor = m.from; v.timerAt = s.t + v.timeout; }
      d.res = why ? 'deny-' + why : 'grant';
      s.notes.push({ k: 'vote', s: v.id, c: m.from, term: m.term, granted: !why, why: why, votedFor: v.votedFor });
      send(s, p, v.id, m.from, { type: 'RVR', term: v.term, granted: !why });
    } else if (m.type === 'RVR') {
      s.ev.loud = true;
      d.res = m.granted ? 'grant' : 'deny';
      if (!m.granted) s.notes.push({ k: 'refused', s: v.id, from: m.from, term: m.term, votes: v.votes.length });
      if (m.term !== v.term || !m.granted || v.role === 'follower' || v.votes.indexOf(m.from) >= 0) return;
      v.votes.push(m.from);
      if (v.role === 'candidate') {
        s.notes.push({ k: 'tally', s: v.id, term: v.term, votes: v.votes.slice() });
        if (v.votes.length >= MAJORITY) becomeLeader(s, p, v);
      }
    } else if (m.type === 'AE') {
      d.entries = m.entries.length;
      d.commit = m.commit;
      if (m.term < v.term) { // a stale leader
        d.res = 'stale';
        s.notes.push({ k: 'stale', s: v.id, from: m.from, term: m.term, mine: v.term });
        send(s, p, v.id, m.from, { type: 'AER', term: v.term, success: false, match: 0 });
        return;
      }
      if (v.role === 'candidate') { // a leader of our own term exists
        toFollower(s, p, v);
        s.notes.push({ k: 'stepdown', s: v.id, term: v.term, was: 'candidate' });
      }
      if (v.leader !== m.from) { v.leader = m.from; s.notes.push({ k: 'learn', s: v.id, leader: m.from, term: m.term }); }
      v.timerAt = s.t + v.timeout;
      // consistency check (§5.3): the entry before the new ones must match
      if (m.prevIndex > lastIndex(v) || (m.prevIndex > 0 && v.log[m.prevIndex - 1].term !== m.prevTerm)) {
        d.res = 'mismatch';
        s.notes.push({ k: 'mismatch', s: v.id, from: m.from, index: m.prevIndex });
        send(s, p, v.id, m.from, { type: 'AER', term: v.term, success: false, match: 0 });
        return;
      }
      // rule 7: a conflicting entry (same index, other term) goes, with everything after it
      var added = [];
      m.entries.forEach(function (e, i) {
        var idx = m.prevIndex + 1 + i;
        if (idx <= lastIndex(v)) {
          if (v.log[idx - 1].term === e.term) return;
          s.notes.push({ k: 'truncate', s: v.id, index: idx, removed: v.log.slice(idx - 1) });
          v.log = v.log.slice(0, idx - 1);
        }
        v.log.push({ term: e.term, cmd: e.cmd });
        added.push(idx);
      });
      if (added.length) s.notes.push({ k: 'append', s: v.id, from: m.from, first: added[0], last: added[added.length - 1] });
      var lastNew = m.prevIndex + m.entries.length;
      if (m.commit > v.commitIndex) {
        var c = Math.max(v.commitIndex, Math.min(m.commit, lastNew));
        if (c > v.commitIndex) { s.notes.push({ k: 'learnCommit', s: v.id, index: c, from: v.commitIndex + 1 }); v.commitIndex = c; }
      }
      d.res = 'ok';
      send(s, p, v.id, m.from, { type: 'AER', term: v.term, success: true, match: lastNew });
    } else if (m.type === 'AER') {
      d.res = m.success ? 'ok' : 'fail';
      if (v.role !== 'leader' || m.term !== v.term) return;
      if (m.success) {
        if (m.match > v.match[m.from]) {
          v.match[m.from] = m.match;
          var before = v.commitIndex;
          advanceCommit(s, v);
          if (v.commitIndex === before && v.log[m.match - 1] && m.match > v.commitIndex) {
            s.notes.push({ k: 'stored', s: v.id, from: m.from, index: m.match, on: storedOn(v, m.match),
              old: v.log[m.match - 1].term !== v.term, cut: reachOf(s, v.id) < MAJORITY });
          } else if (v.commitIndex === before) {
            s.notes.push({ k: 'acked', s: v.id, from: m.from, index: m.match }); // a follower caught up
          }
        }
        v.next[m.from] = Math.max(v.next[m.from], m.match + 1);
      } else {
        // the follower's log did not match: step one entry back and try again at once (§5.3)
        v.next[m.from] = Math.max(1, v.next[m.from] - 1);
        s.notes.push({ k: 'backoff', s: v.id, peer: m.from, next: v.next[m.from] });
        sendAE(s, p, v, m.from);
      }
    }
  }

  // ── one event time ──

  function outside(s, p, e) {
    if (e.type === 'crash') {
      var id = e.id || leaderOf(s);
      var v = id ? srv(s, id) : null;
      if (!v || !v.up) { s.notes.push({ k: 'noLeader', act: 'crash' }); return; }
      v.up = false;
      v.role = 'follower'; v.leader = null; v.votes = []; v.timerAt = null; v.hbAt = null; v.next = null; v.match = null;
      s.notes.push({ k: 'crash', s: v.id });
    } else if (e.type === 'partition') {
      if (s.partition) { s.notes.push({ k: 'already', act: 'partition' }); return; }
      s.partition = clone(PARTITION);
      s.notes.push({ k: 'partition', groups: clone(PARTITION) });
    } else if (e.type === 'heal') {
      var restarted = s.servers.filter(function (x) { return !x.up; }).map(function (x) { return x.id; });
      if (!s.partition && !restarted.length) { s.notes.push({ k: 'already', act: 'heal' }); return; }
      s.partition = null;
      restarted.forEach(function (id) { var x = srv(s, id); x.up = true; toFollower(s, p, x); });
      s.notes.push({ k: 'heal', restarted: restarted });
    }
  }

  function client(s, p, e) {
    s.cmds += 1;
    var cmd = e.cmd || 'x←' + s.cmds;
    var to = e.to || leaderOf(s);
    var L = to ? srv(s, to) : null;
    if (!L || !L.up || L.role !== 'leader') { s.notes.push({ k: 'clientRejected', s: to, cmd: cmd }); return; }
    L.log.push({ term: L.term, cmd: cmd });
    s.notes.push({ k: 'client', s: L.id, index: lastIndex(L), term: L.term, cmd: cmd });
    broadcastAE(s, p, L);
  }

  /** The leader a button acts on: the up leader with the highest term (ties: the lowest id). */
  function leaderOf(s) {
    var best = null;
    s.servers.forEach(function (v) { if (v.up && v.role === 'leader' && (!best || v.term > best.term)) best = v; });
    return best ? best.id : null;
  }

  function nextTime(s, p) {
    var t = Infinity;
    sc(p).events.forEach(function (e) { if (e.at > s.t && e.at < t) t = e.at; });
    s.servers.forEach(function (v) {
      if (!v.up) return;
      if (v.timerAt != null && v.timerAt < t) t = v.timerAt;
      if (v.hbAt != null && v.hbAt < t) t = v.hbAt;
    });
    s.msgs.forEach(function (m) { if (m.at < t) t = m.at; });
    return t;
  }

  /** What a step must show when it changes: roles, terms, votes, logs, commit indexes, known leaders, the leader's
      view of its followers, crashes and the partition. Timers are left out: they change in every quiet round. */
  function signature(s) {
    return JSON.stringify([s.partition, s.servers.map(function (v) {
      return [v.up, v.role, v.term, v.votedFor, v.log, v.commitIndex, v.leader, v.votes, v.match, v.next];
    })]);
  }

  /** Process every event at time T, in the order of SPEC.md "Order": outside events (crash, partition, heal), timer
      expiries (by server id), message deliveries by (deliverAt, from, to, sent order), client commands. */
  function processTime(s, p, T, acts) {
    s.t = T;
    s.ev = { delivered: [], dropped: [], sent: [], loud: false };
    s.notes = [];
    var before = signature(s);
    var evs = sc(p).events.filter(function (e) { return e.at === T; });
    var outs = evs.filter(function (e) { return e.type !== 'client'; }).concat(acts.filter(function (a) { return a.type !== 'client'; }));
    outs.forEach(function (e) { outside(s, p, e); });
    s.servers.forEach(function (v) {
      if (!v.up) return;
      if (v.role === 'leader' && v.hbAt === T) broadcastAE(s, p, v);
      else if (v.role !== 'leader' && v.timerAt === T) startElection(s, p, v);
    });
    var due = s.msgs.filter(function (m) { return m.at === T; }).sort(function (a, b) {
      return a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : a.id - b.id;
    });
    s.msgs = s.msgs.filter(function (m) { return m.at !== T; });
    due.forEach(function (m) { deliver(s, p, m); });
    evs.filter(function (e) { return e.type === 'client'; }).concat(acts.filter(function (a) { return a.type === 'client'; }))
      .forEach(function (e) { client(s, p, e); });
    return s.ev.loud || outs.length > 0 || s.notes.some(function (n) { return n.k === 'client' || n.k === 'clientRejected'; }) ||
      signature(s) !== before;
  }

  function changedOf(prev, next) {
    return next.servers.filter(function (v) {
      var u = srv(prev, v.id);
      return JSON.stringify([u.up, u.role, u.term, u.votedFor, u.log, u.commitIndex, u.leader]) !==
        JSON.stringify([v.up, v.role, v.term, v.votedFor, v.log, v.commitIndex, v.leader]);
    }).map(function (v) { return v.id; });
  }

  var logic = {
    IDS: IDS, DELAY: DELAY, HEARTBEAT: HEARTBEAT, MAJORITY: MAJORITY, QUIET_CAP: QUIET_CAP, FREE_STEPS: FREE_STEPS,
    SCENARIOS: SCENARIOS, SC_IDS: SC_IDS, PARTITION: PARTITION,
    neededOf: neededOf, upToDate: upToDate, parseActs: parseActs, addAct: addAct, leaderOf: leaderOf, storedOn: storedOn,
    lastTerm: lastTerm,

    /** sc: the preset's scenario; acts: the user's actions ("step:action", comma-separated). */
    defaults: { sc: 'first-election', acts: '' },

    /** Each preset has its own count; once the user acts, the demo runs on to FREE_STEPS. */
    steps: function (p) { return parseActs(p.acts).length ? FREE_STEPS : sc(p).steps; },

    /** State at step 0: every server a follower of term 0 with an empty log, then the scenario replayed up to `from`. */
    initial: function (p) {
      var c = sc(p);
      var s = { t: 0, seq: 0, cmds: 0, partition: null, msgs: [], notes: [], changed: [], folded: 0, foldFrom: null,
        ev: { delivered: [], dropped: [], sent: [], loud: false },
        servers: IDS.map(function (id) {
          var down = (c.down || []).indexOf(id) >= 0;
          var v = { id: id, up: !down, role: 'follower', term: 0, votedFor: null, log: [], commitIndex: 0, leader: null,
            votes: [], elections: 0, timeout: c.timeouts[id][0], timerAt: null, hbAt: null, next: null, match: null };
          if (!down) v.timerAt = v.timeout;
          return v;
        }) };
      for (var T = nextTime(s, p); T <= c.from; T = nextTime(s, p)) processTime(s, p, T, []);
      s.t = c.from;
      s.ev = { delivered: [], dropped: [], sent: [], loud: false };
      s.notes = [{ k: 'start', from: c.from }];
      return s;
    },

    /** State after step n: the user's actions for step n act at the next 10 ms tick; otherwise the next event time,
        folding quiet ones (only timers moved and heartbeats passed) until one changes something. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var acts = parseActs(p.acts).filter(function (a) { return a.n === n; });
      var start = null, folded = 0;
      if (acts.length) {
        processTime(s, p, s.t + DELAY, acts);
      } else {
        for (;;) {
          var T = nextTime(s, p);
          if (T === Infinity) { s.ev = { delivered: [], dropped: [], sent: [], loud: false }; s.notes = [{ k: 'idle' }]; break; }
          if (start === null) start = T;
          if (processTime(s, p, T, [])) break;
          folded += 1;
          if (T - start >= QUIET_CAP) { s.notes = [{ k: 'quiet' }]; break; }
        }
      }
      s.folded = folded;
      s.foldFrom = folded ? start : null;
      s.changed = changedOf(prev, s);
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
