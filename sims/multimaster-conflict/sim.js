/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for multimaster-conflict: two masters accept writes locally and replicate them asynchronously; a partition
   queues the messages; at the heal each receiver resolves the conflict by last-writer-wins, version vectors or the
   AD-style per-attribute rule, and the resolution step shows the winner and what was lost. Rules and sources: SPEC.md
   (rule numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Values are numbers (row x), phone numbers (data) or '@key' tokens the page translates (the AD title). */
(function (root) {
  'use strict';

  var NODES = ['M1', 'M2'];
  /** Originating DC GUIDs for the AD rule's last tie-break (rule 6); DC2's is the higher one. Shown shortened. */
  var GUID = { M1: '4f2a07c1-6d3e-4b8a-9e21-03b7c5d1a9e0', M2: '9c71e5b2-0a4f-4c6d-8b13-5e2f9a7d4c38' };
  var OTHER = { M1: 'M2', M2: 'M1' };

  // ── versions and their order ──

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function versionsOf(field) { return field ? (field.siblings ? field.siblings : [field]) : []; }

  /** Rule 3: a beats b under last-writer-wins: larger stamp; equal stamps → the larger origin id (M2 > M1). */
  function lwwBeats(a, b) { return a.stamp !== b.stamp ? a.stamp > b.stamp : a.origin > b.origin; }
  /** Which part of rule 3 decides between a and b. */
  function lwwRule(a, b) { return a.stamp !== b.stamp ? 'stamp' : 'origin'; }

  /** Rule 5: version vector a dominates-or-equals b when every counter of a is ≥ b's. */
  function vvGe(a, b) { return NODES.every(function (n) { return (a[n] || 0) >= (b[n] || 0); }); }
  function vvEq(a, b) { return vvGe(a, b) && vvGe(b, a); }
  /** 'equal' | 'a' (a dominates) | 'b' (b dominates) | 'concurrent' (neither). */
  function vvCompare(a, b) {
    var ab = vvGe(a, b), ba = vvGe(b, a);
    return ab && ba ? 'equal' : ab ? 'a' : ba ? 'b' : 'concurrent';
  }
  function vvMerge(list) {
    var out = {};
    NODES.forEach(function (n) { out[n] = Math.max.apply(null, [0].concat(list.map(function (v) { return v[n] || 0; }))); });
    return out;
  }

  /** Rule 6: AD-style per attribute: higher version; equal → later originating stamp; equal → higher originating DC GUID. */
  function adBeats(a, b) {
    if (a.version !== b.version) return a.version > b.version;
    if (a.stamp !== b.stamp) return a.stamp > b.stamp;
    return GUID[a.origin] > GUID[b.origin];
  }
  function adRule(a, b) { return a.version !== b.version ? 'version' : a.stamp !== b.stamp ? 'stamp' : 'guid'; }

  function same(a, b) { return a.wid === b.wid; }

  /** Apply one incoming version to a field at a receiver (rules 3, 5, 6). Returns { field, outcome, rule }:
      outcome 'applied' (incoming kept), 'kept' (local kept, incoming discarded), 'siblings' (both kept), 'same'. */
  function merge(strategy, local, inc) {
    if (!local) return { field: inc, outcome: 'applied', rule: 'new' };
    var locals = versionsOf(local);
    if (locals.some(function (v) { return same(v, inc); })) return { field: local, outcome: 'same', rule: 'same' };
    if (strategy === 'vv') {
      // dominated by (or equal to) something we hold: nothing new
      if (locals.some(function (v) { return vvGe(v.vv, inc.vv); })) return { field: local, outcome: 'kept', rule: 'dominates' };
      var rest = locals.filter(function (v) { return !vvGe(inc.vv, v.vv); });
      if (!rest.length) return { field: inc, outcome: 'applied', rule: 'dominates' };
      return { field: { siblings: rest.concat([inc]) }, outcome: 'siblings', rule: 'concurrent' };
    }
    var cur = locals[0];
    if (strategy === 'ad') return adBeats(inc, cur) ? { field: inc, outcome: 'applied', rule: adRule(inc, cur) } : { field: local, outcome: 'kept', rule: adRule(inc, cur) };
    return lwwBeats(inc, cur) ? { field: inc, outcome: 'applied', rule: lwwRule(inc, cur) } : { field: local, outcome: 'kept', rule: lwwRule(inc, cur) };
  }

  // ── the plan: one action per step, from the params ──

  /** Writes of the scene. Values: row x 20 / 30 (or +1 with inc, rule 7); the AD user ana's attributes. */
  function writeOf(p, side, round) {
    if (p.strategy === 'ad') {
      if (round === 2) return side === 'M1' ? { field: 'title', value: '@title2' } : { field: 'telephoneNumber', value: '555-0404' };
      return { field: 'telephoneNumber', value: side === 'M1' ? '555-0202' : '555-0303' };
    }
    return p.inc ? { field: 'x', inc: 1 } : { field: 'x', value: side === 'M1' ? 20 : 30 };
  }

  /** Real times (s): initial write 0, replication 1, partition 2, M1 writes at 5, M2 at 7 (AD: 8, "3 s later"), heal 9,
      round 2 writes at 14 and 15; any other step one second after the one before. */
  function plan(p) {
    var out = [];
    var t2 = p.strategy === 'ad' ? 8 : 7;
    out.push({ do: 'repl', t: 1 });
    var w = [];
    if (p.writers === 'both' || p.writers === 'M1') w.push({ do: 'write', side: 'M1', round: 1, t: 5 });
    if (p.writers === 'both' || p.writers === 'M2') w.push({ do: 'write', side: 'M2', round: 1, t: t2 });
    if (p.partition) {
      out.push({ do: 'part', t: 2 });
      w.forEach(function (a) { out.push(a); });
      out.push({ do: 'heal', t: 9 });
      w.forEach(function () { out.push({ do: 'deliver' }); });
    } else {
      w.forEach(function (a) { out.push(a); out.push({ do: 'deliver' }); });
    }
    out.push({ do: 'resolve', round: 1 });
    if (p.strategy === 'ad') {
      // round 2: different attributes, written before either change arrives (replication is asynchronous); the
      // same writers as round 1, and the round-2 summary comes with the last delivery
      var w2 = [];
      if (p.writers === 'both' || p.writers === 'M1') w2.push({ do: 'write', side: 'M1', round: 2, t: 14 });
      if (p.writers === 'both' || p.writers === 'M2') w2.push({ do: 'write', side: 'M2', round: 2, t: 15 });
      w2.forEach(function (a) { out.push(a); });
      w2.forEach(function (a, i) { out.push(i === w2.length - 1 ? { do: 'deliver', resolve: 2 } : { do: 'deliver' }); });
    }
    var t = 0;
    out.forEach(function (a) {
      t = a.t != null ? Math.max(a.t, t + 1) : t + 1;
      a.t = t;
    });
    return out;
  }

  // ── resolution summary (rule 3–7) ──

  function resolve(s, round) {
    var writes = s.writes.filter(function (w) { return w.round === round; });
    var names = [];
    writes.forEach(function (w) { if (names.indexOf(w.field) < 0) names.push(w.field); });
    var lost = [];
    var fields = names.map(function (name) {
      var ws = writes.filter(function (w) { return w.field === name; });
      var a = versionsOf(s.copies.M1.fields[name]), b = versionsOf(s.copies.M2.fields[name]);
      var converged = a.length === b.length && a.every(function (v) { return b.some(function (x) { return same(v, x); }); });
      var kept = ws.filter(function (w) { return a.some(function (v) { return v.wid === w.wid; }) && b.some(function (v) { return v.wid === w.wid; }); });
      // a write replaced by a kept write that had already seen it (its vector ≥) is overwritten in order, not lost
      var gone = ws.filter(function (w) { return kept.indexOf(w) < 0; });
      var over = gone.filter(function (w) { return kept.some(function (k) { return vvCompare(k.v.vv, w.v.vv) === 'a'; }); });
      gone = gone.filter(function (w) { return over.indexOf(w) < 0; });
      gone.forEach(function (w) { lost.push(w.wid); });
      var rule = 'single';
      if (ws.length > 1) {
        var x = ws[0].v, y = ws[1].v;
        if (s.strategy === 'vv') rule = vvCompare(x.vv, y.vv) === 'concurrent' ? 'concurrent' : 'dominates';
        else if (s.strategy === 'ad') rule = adRule(x, y);
        else rule = lwwRule(x, y);
      }
      return {
        field: name, writes: ws.map(function (w) { return w.wid; }), kept: kept.map(function (w) { return w.wid; }),
        lost: gone.map(function (w) { return w.wid; }), overwritten: over.map(function (w) { return w.wid; }), siblings: a.length > 1, converged: converged, rule: rule,
        winner: kept.length === 1 && ws.length > 1 ? kept[0].wid : null
      };
    });
    var res = { round: round, fields: fields, lost: lost, siblings: fields.some(function (f) { return f.siblings; }) };
    // rule 4: a lost write that happened later in real time than the one that won
    res.laterLost = lost.some(function (wid) {
      var l = byWid(s, wid), f = fields.filter(function (x) { return x.field === l.field; })[0];
      return f.winner && l.t > byWid(s, f.winner).t;
    });
    // rule 7: increments both applied on the base they read, so the intended result is base + every increment
    var incs = writes.filter(function (w) { return w.inc; });
    if (incs.length) {
      var fin = versionsOf(s.copies.M1.fields.x);
      res.intended = incs[0].read + incs.length;
      res.got = fin.length === 1 ? fin[0].value : null;
    }
    return res;
  }
  function byWid(s, wid) { return s.writes.filter(function (w) { return w.wid === wid; })[0]; }

  // ── the model ──

  var logic = {
    defaults: { strategy: 'lww', skewM2: -4, partition: true, writers: 'both', inc: false },

    /** 8 steps for the default run (and presets 1–3, 5); AD 12; fewer with the partition off or one write. */
    steps: function (p) { return plan(p).length; },

    plan: plan,

    initial: function (p) {
      var clocks = { M1: { offset: 0 }, M2: { offset: p.skewM2 } };
      var fields = {};
      var w0 = [];
      if (p.strategy === 'ad') {
        fields.telephoneNumber = { value: '555-0101', stamp: 0, version: 1, origin: 'M1', vv: { M1: 1, M2: 0 }, wid: 'a0', t: 0 };
        fields.title = { value: '@title1', stamp: 0, version: 1, origin: 'M1', vv: { M1: 1, M2: 0 }, wid: 'b0', t: 0 };
      } else {
        fields.x = { value: 10, stamp: 0, version: 1, origin: 'M1', vv: { M1: 1, M2: 0 }, wid: 'w0', t: 0 };
      }
      Object.keys(fields).forEach(function (f) { w0.push({ field: f, value: fields[f].value }); });
      return {
        t: 0, clocks: clocks, partitioned: false,
        copies: { M1: { fields: fields }, M2: { fields: {} } },
        pending: [],
        events: [{ step: 0, kind: 'create', side: 'M1', t: 0, fields: w0 }],
        strategy: p.strategy, round: 1, writes: [], result: null, last: null
      };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var a = plan(p)[n - 1];
      s.t = a.t;
      s.last = { do: a.do };
      var ev;
      if (a.do === 'repl') {
        // the initial replication: M1 sends the whole record and M2 applies it in the same step
        var change = clone(s.copies.M1.fields);
        var out = {};
        Object.keys(change).forEach(function (f) {
          var m = merge(s.strategy, s.copies.M2.fields[f], change[f]);
          s.copies.M2.fields[f] = m.field;
          out[f] = { outcome: m.outcome, rule: m.rule };
        });
        ev = { kind: 'deliver', from: 'M1', to: 'M2', change: change, outcomes: out, initial: true };
      } else if (a.do === 'part') {
        s.partitioned = true;
        ev = { kind: 'partition' };
      } else if (a.do === 'heal') {
        s.partitioned = false;
        ev = { kind: 'heal', queued: s.pending.length };
      } else if (a.do === 'write') {
        // rule 1: the master accepts the write locally, stamps it with its own clock and replicates asynchronously
        var side = a.side, wr = writeOf(p, side, a.round);
        var copy = s.copies[side].fields;
        var stored = copy[wr.field];
        var olds = versionsOf(stored);
        var read = olds.length ? olds[0].value : null;
        var v = {
          value: wr.inc ? read + wr.inc : wr.value,
          stamp: a.t + s.clocks[side].offset,
          version: Math.max.apply(null, [0].concat(olds.map(function (o) { return o.version; }))) + 1,
          origin: side,
          vv: vvMerge(olds.map(function (o) { return o.vv; })),
          wid: 'w' + (s.writes.length + 1),
          t: a.t
        };
        v.vv[side] += 1;
        var accepted = true, beatenBy = null;
        if (s.strategy === 'lww' && stored && lwwBeats(olds[0], v)) { accepted = false; beatenBy = olds[0].wid; } // rule 4, locally
        if (accepted) copy[wr.field] = v;
        var w = { wid: v.wid, round: a.round, side: side, field: wr.field, value: v.value, t: a.t, stamp: v.stamp, v: clone(v), accepted: accepted };
        if (wr.inc) { w.inc = wr.inc; w.read = read; }
        if (beatenBy) w.beatenBy = beatenBy;
        s.writes.push(w);
        var ch = {};
        ch[wr.field] = v;
        s.pending.push({ from: side, to: OTHER[side], change: ch, sent: a.t, wid: v.wid });
        ev = { kind: 'write', side: side, wid: v.wid, field: wr.field, value: v.value, stamp: v.stamp, accepted: accepted, queued: s.partitioned };
        if (wr.inc) { ev.inc = wr.inc; ev.read = read; }
      } else if (a.do === 'deliver') {
        // rule 2: delivered after the heal in send order
        var msg = s.pending.shift();
        var outs = {};
        Object.keys(msg.change).forEach(function (f) {
          var m = merge(s.strategy, s.copies[msg.to].fields[f], msg.change[f]);
          s.copies[msg.to].fields[f] = m.field;
          outs[f] = { outcome: m.outcome, rule: m.rule };
        });
        ev = { kind: 'deliver', from: msg.from, to: msg.to, change: msg.change, outcomes: outs, wid: msg.wid, sent: msg.sent };
        if (a.resolve) s.result = resolve(s, a.resolve);
      } else if (a.do === 'resolve') {
        s.result = resolve(s, a.round);
        ev = { kind: 'resolve', round: a.round };
      }
      if (a.do === 'write' && a.round !== s.round) { s.round = a.round; s.result = null; }
      ev.step = n;
      ev.t = a.t;
      s.events.push(ev);
      s.last = ev;
      return s;
    },

    // exported for tests and the page
    NODES: NODES, GUID: GUID, versionsOf: versionsOf, lwwBeats: lwwBeats, vvCompare: vvCompare, adBeats: adBeats,
    merge: merge, resolve: resolve, vvMerge: vvMerge
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
