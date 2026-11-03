/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-lvm-snapshot: a classic (thick) LVM snapshot `snap` of the origin LV `lv_data` (16 chunks A…P) in the
   VG `podaci`. The snapshot has a fixed copy-on-write (CoW) area of `cap` slots: the first write to an origin chunk
   copies the old chunk into a slot; a write to the snapshot stores its data in a slot; a chunk already in the area
   takes no new slot. Data% = used / cap. A write that needs slot cap + 1 invalidates the snapshot (lvs attr I): its
   content is lost, the origin goes on. Optional autoextend grows the area from the VG's free space.
   Rules: SPEC.md. The VG name is lnx-lvm-extend's (UL ch12); that model's PE allocation is not needed here: VG free
   space is one count, in slots.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The snapshot operations
   (snapshotWrite as write/read over { origin, cow, cap, valid, vgFree }) hold no words, so they can move to models/
   unchanged (lnx-thin-overcommit, sto-backing-chains share the block-grid view, catalogue §5.2). */
(function (root) {
  'use strict';

  var VG = 'podaci';
  var ORIGIN = 'lv_data';
  var SNAP = 'snap';
  var CHUNKS = 'ABCDEFGHIJKLMNOP';            // 16 origin chunks, fixed

  function w(chunk) { return { op: 'write', target: 'origin', chunk: chunk }; }
  function ws(chunk) { return { op: 'write', target: 'snap', chunk: chunk }; }
  function r(chunk) { return { op: 'read', chunk: chunk }; }

  /** The preset scripts (SPEC.md "Presets"): one I/O per step. */
  var SCENES = {
    'fill-up': [w('C'), w('F'), w('H'), w('K'), w('M'), w('A')],
    'same-chunks': [w('A'), w('B'), w('A'), w('B'), w('A'), w('B'), w('A'), w('B'), w('A'), w('B')],
    autoextend: [w('C'), w('F'), w('H'), w('K'), w('M'), w('A')],
    'snapshot-write': [w('C'), ws('H'), w('F'), ws('K'), w('M')],
    'backup-window': [w('C'), r('A'), w('D'), r('C'), w('E'), w('F'), r('D'), r('E')]
  };
  var SCENE_IDS = Object.keys(SCENES);
  /** Scenes where the snapshot is mounted (read by a backup, or written as a test copy): lvs shows it open. */
  var OPEN = { 'snapshot-write': true, 'backup-window': true };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function norm(p) {
    p = p || {};
    var clamp = function (v, lo, hi, step, d) {
      v = Number(v);
      if (!Number.isFinite(v)) return d;
      v = Math.round(v / step) * step;
      return Math.min(hi, Math.max(lo, v));
    };
    return {
      scene: SCENES[p.scene] ? p.scene : 'fill-up',
      cap: clamp(p.cap, 2, 8, 1, 4),
      autoextend: p.autoextend === true,
      threshold: clamp(p.threshold, 50, 95, 5, 70),
      percent: clamp(p.percent, 10, 100, 10, 50),
      vgFree: clamp(p.vgFree, 0, 8, 1, 4)
    };
  }
  function script(p) { return SCENES[norm(p).scene]; }
  function steps(p) { return script(p).length; }

  function slotOf(s, chunk) {
    for (var i = 0; i < s.cow.length; i++) if (s.cow[i].chunk === chunk) return i;
    return -1;
  }
  function originOf(s, chunk) {
    for (var i = 0; i < s.origin.length; i++) if (s.origin[i].id === chunk) return s.origin[i];
    return null;
  }

  /** Rule 5: used slots / cap × 100; 100 when invalid (rule 6). */
  function dataPct(s) { return s.valid ? (s.cow.length / s.cap) * 100 : 100; }
  /** lvs prints two decimals: 66.666… → "66.67". */
  function pctText(pct) { return (Math.round(pct * 100) / 100).toFixed(2); }
  /** lvs Attr of the snapshot: 's' snapshot, 'w' writable, 'i' inherited, active 'a' or invalid 'I', open 'o' when
      mounted (the scenes where it is read or written), target 's'. */
  function snapAttr(s) { return 's' + 'wi-' + (s.valid ? 'a' : 'I') + (s.open ? 'o' : '-') + 's---'; }
  /** lvs Attr of the origin: 'o' origin; mounted ('o' open). */
  function originAttr() { return 'owi-aos---'; }

  /** Rule 3: what a reader of the snapshot gets for one chunk: { from: 'cow'|'origin'|'lost', ver, src, slot }. */
  function readSnap(s, chunk) {
    if (!s.valid) return { from: 'lost', ver: null, src: null, slot: -1 };
    var k = slotOf(s, chunk);
    if (k >= 0) return { from: 'cow', ver: s.cow[k].ver, src: s.cow[k].src, slot: k };
    return { from: 'origin', ver: originOf(s, chunk).ver, src: null, slot: -1 };
  }

  /** Rule 7: one autoextend check (one monitoring poll): Data% above the threshold grows the area. Returns { grew, want, short } and changes s in place. */
  function autoextend(s, o) {
    var out = { grew: 0, want: 0, short: false };
    if (!o.autoextend || !s.valid || dataPct(s) <= o.threshold) return out;   // strictly above ("exceeds")
    out.want = Math.max(1, Math.ceil(s.cap * o.percent / 100));
    if (s.vgFree < out.want) { out.short = true; return out; }    // all or nothing
    s.cap += out.want;
    s.vgFree -= out.want;
    out.grew = out.want;
    return out;
  }

  /** One I/O on { origin, cow, cap, valid, vgFree }: returns { s, ev } with a new state; rules 1–7. */
  function io(s0, op, o) {
    var s = clone(s0);
    var ev = { op: op.op, target: op.target || SNAP, chunk: op.chunk, had: slotOf(s, op.chunk) >= 0,
      slot: -1, saved: null, invalidated: false, failed: false, grew: 0, want: 0, short: false, read: null,
      before: dataPct(s0) };
    if (op.op === 'read') {
      ev.read = readSnap(s, op.chunk);
      ev.failed = ev.read.from === 'lost';
      ev.after = dataPct(s);
      return { s: s, ev: ev };
    }
    var org = originOf(s, op.chunk);
    if (op.target === 'snap' && !s.valid) {                        // rule 6: an invalid snapshot takes no writes
      ev.failed = true;
      ev.after = dataPct(s);
      return { s: s, ev: ev };
    }
    if (s.valid) {
      var k = slotOf(s, op.chunk);                                 // (a) rule 2: per chunk, not per write
      if (k < 0) {
        if (s.cow.length >= s.cap) {                               // (b) rule 6: slot cap + 1
          s.valid = false;
          ev.invalidated = true;
        } else if (op.target === 'origin') {                       // (c) rule 1: save the old chunk
          s.cow.push({ chunk: op.chunk, ver: org.ver, src: 'origin' });
          ev.slot = s.cow.length - 1;
          ev.saved = org.ver;
        } else {                                                   // (c) rule 4: the snapshot's own data
          s.cow.push({ chunk: op.chunk, ver: org.ver + 1, src: 'snap' });
          ev.slot = s.cow.length - 1;
        }
      } else if (op.target === 'snap') {                           // rule 4: rewrite its own slot
        s.cow[k].ver += 1;
        if (s.cow[k].src === 'origin') s.cow[k].src = 'snap';
        ev.slot = k;
        ev.rewrote = true;
      }
    }
    if (op.target === 'origin') org.ver += 1;                       // (d) the origin's write always goes through
    ev.after = dataPct(s);                                          // (e)
    var a = autoextend(s, o);
    ev.grew = a.grew; ev.want = a.want; ev.short = a.short;
    ev.final = dataPct(s);
    return { s: s, ev: ev };
  }

  var logic = {
    VG: VG,
    ORIGIN: ORIGIN,
    SNAP: SNAP,
    CHUNKS: CHUNKS,
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,

    /** Parameter defaults (SPEC.md "Params"). scene: the preset script. */
    defaults: { scene: 'fill-up', cap: 4, autoextend: false, threshold: 70, percent: 50, vgFree: 4 },

    steps: steps,
    script: script,
    norm: norm,

    /** Step 0: the snapshot was just taken: every origin chunk at version 1, an empty CoW area. */
    initial: function (p) {
      var o = norm(p);
      return {
        origin: CHUNKS.split('').map(function (id) { return { id: id, ver: 1 }; }),
        cow: [], cap: o.cap, valid: true, vgFree: o.vgFree, open: !!OPEN[o.scene], i: 0, ev: null
      };
    },

    /** Step n from step n − 1: one I/O of the script. */
    step: function (s, n, p) {
      var o = norm(p), op = script(p)[n - 1];
      var res = io(s, op, o);
      res.s.i = n;
      res.s.ev = res.ev;
      return res.s;
    },

    io: io,
    readSnap: readSnap,
    autoextend: autoextend,
    dataPct: dataPct,
    pctText: pctText,
    snapAttr: snapAttr,
    originAttr: originAttr,
    slotOf: slotOf,
    originOf: originOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
