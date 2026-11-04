/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for quorum-split-brain: a cluster of 2–5 nodes (and an optional witness) is partitioned; each side counts its
   votes against the configured total, a side with a majority keeps or starts the service, the others stop it. With
   quorum switched off every side runs it, each takes a different write, and the copies differ after the heal.
   Rules, tie-breaks and numbers: SPEC.md.
   A second, opt-in flow (param `failover`, set only by the Windows presets of task win-failover-cluster) plays a
   sequence of events (a node fails, the network splits, the witness goes away), recounts after each, and can adjust
   the votes (dynamic quorum and dynamic witness). SPEC.md "Windows failover sequence".
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var IDS = ['A', 'B', 'C', 'D', 'E'];
  /** The partitions offered per node count (SPEC.md "Params"): '|' between sides, '!X' = node X has failed. */
  var SPLITS = {
    2: ['A|B', 'A|!B', '!A|B'],
    3: ['AB|C', 'A|BC', 'A|B|C', 'AB|!C'],
    4: ['AB|CD', 'ABC|D', 'AB|C|D', 'A|BCD'],
    5: ['ABC|DE', 'AB|CDE', 'AB|CD|E', 'ABCD|E']
  };
  var OWNER = 'A';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clamp(n) { return Math.max(2, Math.min(5, Math.round(Number(n) || 3))); }

  /** The params the model acts on: the ceph scene has no witness and cannot ignore quorum (SPEC.md "Scene"). */
  function eff(p) {
    var n = clamp(p.nodes);
    var split = p['split' + n];
    if (SPLITS[n].indexOf(split) < 0) split = SPLITS[n][0];
    var ceph = p.scene === 'ceph';
    return { n: n, split: split, witness: !ceph && !!p.witness, witnessAt: p.witnessAt === 'last' ? IDS[n - 1] : 'A',
      policy: !ceph && p.policy === 'ignore' ? 'ignore' : 'stop' };
  }

  /** The split string as sides: [{ members: [ids], down: bool }], in string order (T4). */
  function parseSplit(split) {
    return split.split('|').map(function (g) {
      return g.charAt(0) === '!' ? { members: [g.slice(1)], down: true } : { members: g.split(''), down: false };
    });
  }

  /** The ring of links for n nodes: A–B, B–C, …, last–A (two nodes: one link). */
  function ringOf(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = IDS[i], b = IDS[(i + 1) % n];
      if (n === 2 && i === 1) break;
      out.push({ a: a, b: b, up: true });
    }
    return out;
  }

  /** Votes needed for quorum: more than half of the configured total (rule 1, T2). */
  function neededOf(total) { return Math.floor(total / 2) + 1; }

  /** Count one side (rules 1, 4, 8, T3): up members' votes plus the witness when the side reaches it. */
  function countSide(side, nodes, witness, total) {
    var up = side.members.filter(function (id) { return nodes.filter(function (x) { return x.id === id; })[0].up; });
    var withW = !!witness && witness.reach !== null && side.members.indexOf(witness.reach) >= 0;
    var votes = up.length + (withW ? witness.votes : 0);
    var needed = neededOf(total);
    return { votes: votes, total: total, needed: needed, quorum: votes >= needed, witness: withW, upCount: up.length };
  }

  function sideOfNode(sides, id) {
    for (var i = 0; i < sides.length; i++) if (sides[i].members.indexOf(id) >= 0) return i;
    return -1;
  }

  function nodeUp(s, id) { return s.nodes.filter(function (x) { return x.id === id; })[0].up; }

  /** The first up node of a side, by id (T1). */
  function firstUp(s, side) {
    var ids = side.members.filter(function (id) { return nodeUp(s, id); }).sort();
    return ids.length ? ids[0] : null;
  }

  /**
   * What one side does with the resource (rules 2, 6, 8). Returns { act, node }: act is keep | start | stop | off |
   * lost; node is where it runs after the step (keep, start) or ran (stop, lost).
   */
  function actOf(s, side, policy) {
    var here = side.node;
    if (side.down) return here ? { act: 'lost', node: here } : { act: 'off', node: null };
    var may = policy === 'ignore' || side.quorum;
    if (may) return here ? { act: 'keep', node: here } : { act: 'start', node: firstUp(s, side) };
    return here ? { act: 'stop', node: here } : { act: 'off', node: null };
  }

  /** The state after steps 1–3, without the step machinery: used for the step count. */
  function planOf(p) {
    var s = logic.initial(p);
    for (var n = 1; n <= 3; n++) s = logic.step(s, n, p);
    return s;
  }

  function writersOf(s) {
    return s.sides.map(function (sd, i) { return sd.running ? i : -1; }).filter(function (i) { return i >= 0; });
  }

  function sideSnap(sd) { return JSON.stringify([sd.members, sd.counted, sd.counted && sd.quorum, sd.running, sd.running ? sd.node : null, sd.value, sd.diverged]); }

  /** Mark sides whose status, action, data or membership changed (SPEC.md "Steps"). */
  function markChanged(prev, next) {
    var before = {};
    prev.sides.forEach(function (sd) { before[sd.members.join('')] = sideSnap(sd); });
    next.changed = next.sides.map(function (sd, i) { return before[sd.members.join('')] === sideSnap(sd) ? -1 : i; })
      .filter(function (i) { return i >= 0; });
    return next;
  }


  // ── Windows failover sequence (task win-failover-cluster; SPEC.md "Windows failover sequence") ──

  /** The event sequences offered per node count: ',' between events; '!X' node X fails, 'W' the witness goes away,
      'AB|CD' the network splits. A 'W' event is skipped when there is no witness. */
  var EVENTS = {
    2: ['!B', 'A|B', 'W,!B', '!A'],
    3: ['!C', 'AB|C', '!C,!B', 'W,!C,!B'],
    4: ['AB|CD', 'W,AB|CD', '!D,!C', '!D,!C,!B'],
    5: ['AB|CDE', 'AB|CD|E', '!E,!D', '!E,!D,!C']
  };
  var KINDS = ['none', 'disk', 'fileshare', 'cloud'];
  /** Static votes, or dynamic quorum and witness with the tie dropping the last node's vote, or A's (T6). */
  var VOTES = ['static', 'dynamic', 'dynamicA'];

  function parseEvent(e) {
    if (e === 'W') return { type: 'witness' };
    if (e.charAt(0) === '!') return { type: 'fail', node: e.slice(1) };
    return { type: 'cut', split: e };
  }

  /** The params the failover flow acts on. */
  function seqEff(p) {
    var n = clamp(p.nodes);
    var ev = p['ev' + n];
    if (EVENTS[n].indexOf(ev) < 0) ev = EVENTS[n][0];
    var kind = KINDS.indexOf(p.wkind) > 0 ? p.wkind : null;
    return { n: n, ev: ev, kind: kind, witnessAt: p.witnessAt === 'last' ? IDS[n - 1] : 'A', dynamic: p.votes === 'dynamic' || p.votes === 'dynamicA',
      tie: p.votes === 'dynamicA' ? 'A' : 'auto',
      events: ev.split(',').filter(function (e) { return e !== 'W' || !!kind; }).map(parseEvent) };
  }

  function nodeVotesOf(s) { return s.nodes.reduce(function (a, x) { return a + x.votes; }, 0); }
  /** All assigned votes, failed members included (rule W1): static votes never change, dynamic ones are adjusted. */
  function totalOf(s) { return nodeVotesOf(s) + (s.witness ? s.witness.votes : 0); }

  /** The node whose side reaches the witness: its own node, or the first up node when that one failed (W2, T3). */
  function reachOf(s) {
    if (!s.witness || !s.witness.up) return null;
    if (nodeUp(s, s.witness.at)) return s.witness.at;
    return firstUp(s, { members: IDS.slice(0, s.n) });
  }

  /** Live sides (the up members of each group, in group order), then one side per failed node, by id. */
  function seqSides(s) {
    var live = s.groups.map(function (g) { return g.filter(function (id) { return nodeUp(s, id); }); })
      .filter(function (g) { return g.length; })
      .map(function (g) { return { members: g, down: false }; });
    var dead = s.nodes.filter(function (x) { return !x.up; }).map(function (x) { return { members: [x.id], down: true }; });
    return live.concat(dead);
  }

  /** Count one side (W1, W2): the votes of its up members, plus the witness's vote when the side reaches it. */
  function seqCount(s, side) {
    var total = totalOf(s);
    var reached = !side.down && !!s.witness && s.witness.up && side.members.indexOf(s.witness.reach) >= 0;
    var votes = side.down ? 0 : side.members.reduce(function (a, id) {
      return a + s.nodes.filter(function (x) { return x.id === id; })[0].votes;
    }, 0) + (reached ? s.witness.votes : 0);
    var needed = neededOf(total);
    return { votes: votes, total: total, needed: needed, quorum: votes >= needed, witness: reached && s.witness.votes > 0,
      reachW: reached, upCount: side.down ? 0 : side.members.length };
  }

  /**
   * Dynamic quorum and dynamic witness (W4–W6), run by the side with quorum (its up members): every node outside it
   * loses its vote; the witness votes only when it is reachable and the node votes are even; if the total is still
   * even, one node of the side gives up its vote (the highest id, or A when chosen; T6).
   */
  function dynAdjust(s, members, tie) {
    var out = { removed: [], witness: null, tie: null, nodeVotes: 0 };
    s.nodes.forEach(function (x) { if (members.indexOf(x.id) < 0 && x.votes > 0) { x.votes = 0; out.removed.push(x.id); } });
    out.nodeVotes = nodeVotesOf(s);
    if (s.witness) {
      var wv = s.witness.up && members.indexOf(s.witness.reach) >= 0 ? (out.nodeVotes % 2 === 0 ? 1 : 0) : 0;
      if (wv !== s.witness.votes) out.witness = [s.witness.votes, wv];
      s.witness.votes = wv;
    }
    var total = totalOf(s);
    if (total > 0 && total % 2 === 0) {
      var voting = members.filter(function (id) { return s.nodes.filter(function (x) { return x.id === id; })[0].votes > 0; }).sort();
      var pick = tie === 'A' && voting.indexOf('A') >= 0 ? 'A' : voting[voting.length - 1];
      s.nodes.filter(function (x) { return x.id === pick; })[0].votes = 0;
      out.tie = { node: pick, before: total };
    }
    out.changed = out.removed.length > 0 || !!out.witness || !!out.tie;
    return out;
  }

  function seqSnap(sd) {
    if (sd.down) return JSON.stringify([sd.members, sd.counted, sd.act]);
    return JSON.stringify([sd.members, sd.counted, sd.counted && sd.votes, sd.counted && sd.total, sd.counted && sd.quorum, sd.running, sd.running ? sd.node : null]);
  }

  /** Mark sides whose membership, votes, total, quorum or roles changed (a failed node's side: only its own state). */
  function seqChanged(prev, next) {
    var before = {};
    prev.sides.forEach(function (sd) { before[(sd.down ? '!' : '') + sd.members.join('')] = seqSnap(sd); });
    next.changed = next.sides.map(function (sd, i) { return before[(sd.down ? '!' : '') + sd.members.join('')] === seqSnap(sd) ? -1 : i; })
      .filter(function (i) { return i >= 0; });
    return next;
  }

  function seqInitial(p) {
    var e = seqEff(p);
    var s = {
      mode: 'failover', phase: 'start', n: e.n, policy: 'stop', split: IDS.slice(0, e.n).join(''), ev: null, evIndex: -1,
      dynamic: e.dynamic, tie: e.tie,
      nodes: IDS.slice(0, e.n).map(function (id) { return { id: id, up: true, votes: 1 }; }),
      witness: e.kind ? { kind: e.kind, up: true, votes: 1, at: e.witnessAt, reach: OWNER } : null,
      groups: [IDS.slice(0, e.n)],
      links: ringOf(e.n), cut: [],
      sides: [], resource: { owner: OWNER, runningOn: [OWNER] }, writes: [], changed: [], diverged: false,
      stopped: false, lost: [], adjust: null
    };
    if (e.dynamic) s.adjust = dynAdjust(s, IDS.slice(0, e.n), e.tie);
    if (s.adjust && !s.adjust.changed) s.adjust = null;
    s.total = totalOf(s);
    var all = { members: IDS.slice(0, e.n), down: false };
    s.sides = [Object.assign(all, seqCount(s, all), { counted: true, act: 'keep', node: OWNER, running: true, value: 0, diverged: false })];
    return s;
  }

  /** Phase `ph` ({ phase: 'event' | 'recount' | 'adjust', i }) applied to a copy of `prev`. */
  function seqApply(prev, ph, e) {
    var s = clone(prev);
    s.changed = [];
    s.adjust = null;
    if (ph.phase === 'event') {
      var ev = e.events[ph.i];
      s.ev = ev;
      s.evIndex = ph.i;
      if (ev.type === 'fail') {
        s.nodes.filter(function (x) { return x.id === ev.node; })[0].up = false;
        if (s.resource.runningOn.indexOf(ev.node) >= 0) s.lost.push(ev.node);
        s.resource.runningOn = s.resource.runningOn.filter(function (id) { return id !== ev.node; });
      }
      if (ev.type === 'cut') { s.groups = ev.split.split('|').map(function (g) { return g.split(''); }); s.split = ev.split; }
      if (ev.type === 'witness') s.witness.up = false;
      if (s.witness) s.witness.reach = reachOf(s);
      var grp = function (id) { for (var i = 0; i < s.groups.length; i++) if (s.groups[i].indexOf(id) >= 0) return i; return -1; };
      s.links.forEach(function (l) { l.up = grp(l.a) === grp(l.b) && nodeUp(s, l.a) && nodeUp(s, l.b); });
      s.cut = s.links.filter(function (l) { return !l.up && nodeUp(s, l.a) && nodeUp(s, l.b); }).map(function (l) { return l.a + l.b; });
      s.sides = seqSides(s).map(function (sd) {
        var running = s.resource.runningOn.filter(function (id) { return sd.members.indexOf(id) >= 0; })[0] || null;
        var lost = sd.down && s.lost.indexOf(sd.members[0]) >= 0 ? sd.members[0] : null;
        return { members: sd.members, down: sd.down, counted: false, act: null, node: sd.down ? lost : running, running: !!running,
          value: null, diverged: false };
      });
      s.total = totalOf(s);
      s.phase = 'event';
      return seqChanged(prev, s);
    }
    if (ph.phase === 'recount') {
      s.sides = s.sides.map(function (sd) { return Object.assign(sd, seqCount(s, sd), { counted: true }); });
      var q = s.sides.filter(function (sd) { return sd.quorum; })[0] || null;
      s.sides.forEach(function (sd) {
        if (sd.down) { sd.act = sd.node ? 'lost' : 'off'; sd.running = false; return; }
        var here = s.resource.runningOn.filter(function (id) { return sd.members.indexOf(id) >= 0; })[0] || null;
        if (sd === q) { sd.act = here ? 'keep' : 'start'; sd.node = here || firstUp(s, sd); sd.running = true; }
        else { sd.act = here ? 'stop' : 'off'; sd.node = here; sd.running = false; }
      });
      s.wasStopped = s.stopped;
      s.stopped = !q;
      s.resource.runningOn = q ? [q.node] : [];
      s.phase = 'recount';
      return seqChanged(prev, s);
    }
    // adjust: the side with quorum drops the votes nobody casts any more (dynamic quorum, dynamic witness, tie)
    var qs = s.sides.filter(function (sd) { return sd.quorum; })[0];
    s.adjust = dynAdjust(s, qs.members, s.tie);
    s.total = totalOf(s);
    s.sides = s.sides.map(function (sd) { return Object.assign(sd, seqCount(s, sd)); });
    s.phase = 'adjust';
    return seqChanged(prev, s);
  }

  /** The phases after step 0, with the states they give: an adjust phase only when it changes a vote. */
  function seqRun(p) {
    var e = seqEff(p);
    var s = seqInitial(p);
    var out = [];
    e.events.forEach(function (ev, i) {
      s = seqApply(s, { phase: 'event', i: i }, e); out.push({ phase: 'event', i: i });
      s = seqApply(s, { phase: 'recount', i: i }, e); out.push({ phase: 'recount', i: i });
      if (e.dynamic && !s.stopped) {
        var probe = clone(s);
        var qs = probe.sides.filter(function (sd) { return sd.quorum; })[0];
        if (dynAdjust(probe, qs.members, probe.tie).changed) { s = seqApply(s, { phase: 'adjust', i: i }, e); out.push({ phase: 'adjust', i: i }); }
      }
    });
    return out;
  }

  var logic = {
    IDS: IDS,
    SPLITS: SPLITS,

    defaults: { scene: 'ha', nodes: 3, split2: 'A|B', split3: 'AB|C', split4: 'AB|CD', split5: 'AB|CD|E',
      witness: false, witnessAt: 'first', policy: 'stop',
      // the Windows failover sequence (off unless a preset sets it): SPEC.md "Windows failover sequence"
      failover: false, ev2: '!B', ev3: '!C', ev4: 'AB|CD', ev5: 'AB|CDE', wkind: 'fileshare', votes: 'static' },

    /** 4 steps (partition, count, act, heal), plus one write per running side when two or more run (rule 6). */
    steps: function (p) {
      if (p.failover) return seqRun(p).length;
      var w = writersOf(planOf(p)).length;
      return w >= 2 ? 4 + w : 4;
    },

    initial: function (p) {
      if (p.failover) return seqInitial(p);
      var e = eff(p);
      var nodes = IDS.slice(0, e.n).map(function (id) { return { id: id, up: true, votes: 1 }; });
      var total = e.n + (e.witness ? 1 : 0);
      var s = {
        phase: 'start', n: e.n, policy: e.policy, split: e.split,
        nodes: nodes,
        witness: e.witness ? { up: true, votes: 1, at: e.witnessAt, reach: OWNER } : null,
        links: ringOf(e.n),
        total: total,
        sides: [],
        resource: { owner: OWNER, runningOn: [OWNER] },
        writes: [],
        changed: [],
        diverged: false
      };
      var all = { members: IDS.slice(0, e.n), down: false };
      var c = countSide(all, nodes, s.witness ? { votes: 1, reach: 'A' } : null, total);
      s.sides = [Object.assign(all, c, { counted: true, act: 'keep', node: OWNER, running: true, value: 0, diverged: false })];
      return s;
    },

    step: function (prev, n, p) {
      if (p.failover) return seqApply(prev, seqRun(p)[n - 1], seqEff(p));
      var s = clone(prev);
      s.changed = [];
      if (n === 1) {
        // partition (or node failure): sides appear, not yet counted
        var sides = parseSplit(s.split);
        sides.forEach(function (sd) { if (sd.down) s.nodes.filter(function (x) { return x.id === sd.members[0]; })[0].up = false; });
        s.links.forEach(function (l) { l.up = sideOfNode(sides, l.a) === sideOfNode(sides, l.b) && nodeUp(s, l.a) && nodeUp(s, l.b); });
        s.cut = s.links.filter(function (l) { return !l.up && nodeUp(s, l.a) && nodeUp(s, l.b); }).map(function (l) { return l.a + l.b; });
        // the witness answers the side of its node; a failed node cuts no link, so then it answers the side still up (T3)
        if (s.witness) s.witness.reach = nodeUp(s, s.witness.at) ? s.witness.at : firstUp(s, { members: IDS.slice(0, s.n) });
        s.sides = sides.map(function (sd) {
          var running = s.resource.runningOn.filter(function (id) { return sd.members.indexOf(id) >= 0; })[0] || null;
          return { members: sd.members, down: sd.down, counted: false, act: null, node: running, running: !!running && !sd.down,
            value: sd.down ? null : 0, diverged: false };
        });
        // a failed node takes its running copy down with it (rule 8)
        s.resource.runningOn = s.resource.runningOn.filter(function (id) { return nodeUp(s, id); });
        s.phase = 'partition';
        return markChanged(prev, s);
      }
      if (n === 2) {
        s.sides = s.sides.map(function (sd) { return Object.assign(sd, countSide(sd, s.nodes, s.witness, s.total), { counted: true }); });
        s.phase = 'count';
        return markChanged(prev, s);
      }
      if (n === 3) {
        var acts = s.sides.map(function (sd) { return actOf(prev, sd, s.policy); });
        s.sides.forEach(function (sd, i) {
          sd.act = acts[i].act;
          sd.node = acts[i].node;
          sd.running = sd.act === 'keep' || sd.act === 'start';
        });
        s.resource.runningOn = s.sides.filter(function (sd) { return sd.running; }).map(function (sd) { return sd.node; });
        s.splitBrain = s.resource.runningOn.length >= 2;
        s.phase = 'act';
        return markChanged(prev, s);
      }
      if (n < logic.steps(p)) {
        // one client write per running side, in side order (rule 6, T5)
        var k = n - 3;
        var w = writersOf(s)[k - 1];
        s.sides[w].value = k;
        s.writes.push({ side: w, node: s.sides[w].node, value: k });
        s.phase = 'write';
        return markChanged(prev, s);
      }
      // heal: the links come back between up nodes; failed nodes stay down
      s.links.forEach(function (l) { l.up = nodeUp(s, l.a) && nodeUp(s, l.b); });
      s.cut = [];
      if (s.witness) s.witness.reach = firstUp(s, { members: IDS.slice(0, s.n) });
      var upIds = IDS.slice(0, s.n).filter(function (id) { return nodeUp(s, id); });
      var downIds = IDS.slice(0, s.n).filter(function (id) { return !nodeUp(s, id); });
      var whole = Object.assign({ members: upIds, down: false }, countSide({ members: upIds }, s.nodes, s.witness, s.total), { counted: true });
      var runningSides = s.sides.filter(function (sd) { return sd.running; });
      var values = runningSides.map(function (sd) { return sd.value; });
      var distinct = values.filter(function (v, i) { return values.indexOf(v) === i; });
      whole.diverged = distinct.length > 1;
      whole.copies = runningSides.map(function (sd) { return { members: sd.members, node: sd.node, value: sd.value }; });
      if (runningSides.length >= 1) {
        whole.act = runningSides.length > 1 ? 'conflict' : 'keep';
        whole.node = runningSides[0].node;
        whole.running = true;
        whole.value = runningSides.length > 1 ? null : runningSides[0].value;
      } else if (whole.quorum) {
        whole.act = 'start';
        whole.node = firstUp(s, whole);
        whole.running = true;
        whole.value = 0;
        s.resource.runningOn = [whole.node];
      } else {
        whole.act = 'off';
        whole.node = null;
        whole.running = false;
        whole.value = 0;
      }
      var gone = downIds.map(function (id) {
        var was = prev.sides[sideOfNode(prev.sides, id)];
        return { members: [id], down: true, counted: true, votes: 0, total: s.total, needed: neededOf(s.total), quorum: false,
          witness: false, upCount: 0, act: was.act, node: was.node, running: false, value: null, diverged: false };
      });
      s.sides = [whole].concat(gone);
      s.phase = 'heal';
      return markChanged(prev, s);
    },

    // exported for tests and the page
    eff: eff,
    parseSplit: parseSplit,
    ringOf: ringOf,
    neededOf: neededOf,
    countSide: countSide,
    sideOfNode: sideOfNode,
    writersOf: writersOf,
    EVENTS: EVENTS,
    KINDS: KINDS,
    VOTES: VOTES,
    seqEff: seqEff,
    seqRun: seqRun,
    totalOf: totalOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
