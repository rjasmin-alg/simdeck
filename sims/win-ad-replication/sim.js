/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ad-replication: three DCs in a ring, one user object with two attributes. An originating write takes
   the DC's next USN; a pull asks a partner for changes above the high-watermark, leaves out what the up-to-dateness
   vector says the destination already has, writes each winning change under the destination's own next USN with its
   originating metadata kept, and resolves a conflict per attribute: higher version, then later originating time, then
   the higher invocationID. Rules, tie-breaks and numbers: SPEC.md (rule numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   Values are phone numbers (data) or '@key' tokens the page translates (the title).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DCS = ['DC01', 'DC02', 'DC03'];
  var ATTRS = ['telephoneNumber', 'title'];
  /** Start: each DC's USN; the attributes' local USNs on each DC (SPEC.md "Start"). */
  var USN0 = { DC01: 4100, DC02: 7300, DC03: 2200 };
  var LOCAL0 = { DC01: 4000, DC02: 7200, DC03: 2100 };
  var INIT = {
    telephoneNumber: { value: '555-0100', ver: 1, origDc: 'DC01', origUsn: 4000, origTime: -3600 },
    title: { value: '@title0', ver: 1, origDc: 'DC01', origUsn: 4001, origTime: -3600 }
  };
  var PULL_AT = 15;   // the first pull, 15 s after the first write (SPEC.md "Timeline", check)

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clampInt(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.max(lo, Math.min(hi, n));
  }

  /** The params the model acts on (SPEC.md "Params"). */
  function eff(p) {
    return {
      edits1: clampInt(p.edits1, 1, 3, 1),
      edit2: p.edit2 !== false,
      t2: clampInt(p.t2, 0, 10, 2),
      sameAttr: p.sameAttr !== false,
      direct: !!p.direct
    };
  }

  /** Every step's event: the writes in time order (rule 7: DC01 before DC02 in one second), then the pulls. */
  function plan(p) {
    var e = eff(p);
    var writes = [];
    for (var i = 0; i < e.edits1; i++) writes.push({ kind: 'write', dc: 'DC01', attr: 'telephoneNumber', value: '555-011' + (i + 1), t: i });
    if (e.edit2) {
      writes.push(e.sameAttr
        ? { kind: 'write', dc: 'DC02', attr: 'telephoneNumber', value: '555-0222', t: e.t2 }
        : { kind: 'write', dc: 'DC02', attr: 'title', value: '@title1', t: e.t2 });
    }
    writes.sort(function (a, b) { return a.t - b.t || DCS.indexOf(a.dc) - DCS.indexOf(b.dc); });
    var pulls = [['DC02', 'DC01'], ['DC03', 'DC02']];
    if (e.direct) pulls.push(['DC03', 'DC01']);
    pulls.push(['DC01', 'DC03']);
    return writes.concat(pulls.map(function (pr, k) { return { kind: 'pull', dest: pr[0], src: pr[1], t: PULL_AT + k }; }));
  }

  /** Rule 5: incoming change a beats held b: higher version; equal → later originating time; equal → higher
      invocationID (the DC name). Adapted from sims/multimaster-conflict/sim.js @ fdaedd1 (adBeats, adRule). */
  function beats(a, b) {
    if (a.ver !== b.ver) return a.ver > b.ver;
    if (a.origTime !== b.origTime) return a.origTime > b.origTime;
    return a.origDc > b.origDc;
  }
  function ruleOf(a, b) { return a.ver !== b.ver ? 'version' : a.origTime !== b.origTime ? 'time' : 'id'; }
  function sameChange(a, b) { return a.origDc === b.origDc && a.origUsn === b.origUsn && a.ver === b.ver; }

  /** Rule 2: the source's attributes with a local USN above `hwm`, in local-USN order (current value and metadata). */
  function changesAbove(dc, hwm) {
    return ATTRS.filter(function (a) { return dc.obj[a].localUsn > hwm; })
      .sort(function (a, b) { return dc.obj[a].localUsn - dc.obj[b].localUsn || ATTRS.indexOf(a) - ATTRS.indexOf(b); });
  }

  /** Rule 3: does the destination already have this change? 'own' (it originated there), 'utd' (covered), or null. */
  function dampened(destId, dest, ch) {
    if (ch.origDc === destId) return 'own';
    return ch.origUsn <= dest.utd[ch.origDc] ? 'utd' : null;
  }

  /** Rule 1: an originating write. */
  function write(s, ev) {
    var dc = s.dcs[ev.dc];
    var cur = dc.obj[ev.attr];
    dc.usn += 1;
    var wid = s.writes.length + 1;
    dc.obj[ev.attr] = { value: ev.value, ver: cur.ver + 1, origDc: ev.dc, origUsn: dc.usn, origTime: ev.t, localUsn: dc.usn, wid: wid };
    s.writes.push({ wid: wid, dc: ev.dc, attr: ev.attr, value: ev.value, ver: cur.ver + 1, usn: dc.usn, t: ev.t, over: cur.wid });
    s.last = { kind: 'write', dc: ev.dc, attr: ev.attr, wid: wid };
    s.changed = [ev.dc + '.usn', ev.dc + '.obj.' + ev.attr];
  }

  /** Rules 2–6: one pull, destination ← source. */
  function pull(s, ev) {
    var src = s.dcs[ev.src], dest = s.dcs[ev.dest];
    var from = dest.hwm[ev.src];
    var changes = changesAbove(src, from).map(function (attr) {
      var a = src.obj[attr];
      var ch = { attr: attr, value: a.value, ver: a.ver, origDc: a.origDc, origUsn: a.origUsn, origTime: a.origTime, srcUsn: a.localUsn,
        wid: a.wid, outcome: null, rule: null, localUsn: null };
      var damp = dampened(ev.dest, dest, ch);
      if (damp) { ch.outcome = damp; return ch; }
      var held = dest.obj[attr];
      if (sameChange(ch, held)) { ch.outcome = 'same'; return ch; }
      ch.rule = ruleOf(ch, held);
      if (!beats(ch, held)) { ch.outcome = 'lost'; return ch; }
      ch.outcome = 'applied';
      return ch;
    });
    // rule 4: the winning changes of the object are one update on the destination, under its own next USN; the
    // originating metadata travels unchanged
    var won = changes.filter(function (c) { return c.outcome === 'applied'; });
    if (won.length) {
      dest.usn += 1;
      won.forEach(function (c) {
        dest.obj[c.attr] = { value: c.value, ver: c.ver, origDc: c.origDc, origUsn: c.origUsn, origTime: c.origTime, localUsn: dest.usn, wid: c.wid };
        c.localUsn = dest.usn;
        s.changed.push(ev.dest + '.obj.' + c.attr);
      });
      s.changed.push(ev.dest + '.usn');
    }
    // rule 2: the HWM becomes the source's current USN, whatever was left out
    dest.hwm[ev.src] = src.usn;
    if (src.usn !== from) s.changed.push(ev.dest + '.hwm.' + ev.src);
    // rule 4: the destination takes over the source's vector (its entry for the source is the source's USN)
    DCS.forEach(function (o) {
      if (o === ev.dest) return;
      var v = o === ev.src ? src.usn : src.utd[o];
      if (v > dest.utd[o]) { dest.utd[o] = v; s.changed.push(ev.dest + '.utd.' + o); }
    });
    s.last = { kind: 'pull', dest: ev.dest, src: ev.src, from: from, to: src.usn, changes: changes };
  }

  /** The DCs that hold write `wid` as their current value of its attribute. */
  function holders(s, wid) {
    var w = s.writes[wid - 1];
    return DCS.filter(function (d) { return s.dcs[d].obj[w.attr].wid === wid; });
  }

  /** Write `by` was made over write `wid` (its chain of `over` reaches it): it had seen it. A write supersedes itself. */
  function supersedes(s, by, wid) {
    for (var k = by; k > 0; k = s.writes[k - 1].over) if (k === wid) return true;
    return false;
  }

  /** Fate of a write once replication is over (SPEC.md "Fate"): 'kept', 'overwritten' (in order) or 'lost'. */
  function fateOf(s, wid) {
    var w = s.writes[wid - 1];
    var cur = s.dcs.DC01.obj[w.attr].wid;
    if (cur === wid) return 'kept';
    return supersedes(s, cur, wid) ? 'overwritten' : 'lost';
  }

  /** All three DCs hold the same change of every attribute. */
  function converged(s) {
    return ATTRS.every(function (a) {
      return DCS.every(function (d) { return s.dcs[d].obj[a].wid === s.dcs.DC01.obj[a].wid; });
    });
  }

  var logic = {
    DCS: DCS,
    ATTRS: ATTRS,

    defaults: { edits1: 1, edit2: true, t2: 2, sameAttr: true, direct: false },

    /** Writes (1–4) and pulls (3–4): 4 to 8 steps. */
    steps: function (p) { return plan(p).length; },

    initial: function (p) {
      var dcs = {};
      DCS.forEach(function (d) {
        var utd = {}, hwm = {}, obj = {};
        DCS.forEach(function (o) { if (o !== d) { utd[o] = USN0[o]; hwm[o] = USN0[o]; } });
        ATTRS.forEach(function (a, i) { obj[a] = Object.assign({}, INIT[a], { localUsn: LOCAL0[d] + i, wid: 0 }); });
        dcs[d] = { usn: USN0[d], utd: utd, hwm: hwm, obj: obj };
      });
      return { t: 0, dcs: dcs, writes: [], last: null, changed: [] };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var ev = plan(p)[n - 1];
      s.t = ev.t;
      s.changed = [];
      if (ev.kind === 'write') write(s, ev);
      else pull(s, ev);
      return s;
    },

    // exported for tests and the page
    eff: eff,
    plan: plan,
    beats: beats,
    ruleOf: ruleOf,
    sameChange: sameChange,
    changesAbove: changesAbove,
    dampened: dampened,
    holders: holders,
    supersedes: supersedes,
    fateOf: fateOf,
    converged: converged
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
