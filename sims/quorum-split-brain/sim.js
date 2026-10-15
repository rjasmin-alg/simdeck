/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for quorum-split-brain: a cluster of 2–5 nodes (and an optional witness) is partitioned; each side counts its
   votes against the configured total, a side with a majority keeps or starts the service, the others stop it. With
   quorum switched off every side runs it, each takes a different write, and the copies differ after the heal.
   Rules, tie-breaks and numbers: SPEC.md.
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

  var logic = {
    IDS: IDS,
    SPLITS: SPLITS,

    defaults: { scene: 'ha', nodes: 3, split2: 'A|B', split3: 'AB|C', split4: 'AB|CD', split5: 'AB|CD|E',
      witness: false, witnessAt: 'first', policy: 'stop' },

    /** 4 steps (partition, count, act, heal), plus one write per running side when two or more run (rule 6). */
    steps: function (p) {
      var w = writersOf(planOf(p)).length;
      return w >= 2 ? 4 + w : 4;
    },

    initial: function (p) {
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
    writersOf: writersOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
