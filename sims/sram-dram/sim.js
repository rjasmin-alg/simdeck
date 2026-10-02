/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for sram-dram: one 6T SRAM cell and one 1T1C DRAM cell take the same operations side by side (adopted from
   single-page-labs/sram-dram.html). The SRAM cell is a latch: its bit is held as long as the supply is on, a read
   leaves it as it was. The DRAM cell is a capacitor: its charge leaks away, a read shares it with the bitline and so
   destroys it, and only a write-back or a refresh within the 64 ms window brings it back.
   The 13 steps: write a bit, read it, write it back, wait 2 × 32 ms, refresh (or skip it), wait 2 × 32 ms, read,
   write back, write the other bit, read, write back.
   Charge is a percentage of V_DD on the storage capacitor. Numbers from the original page: V_DD 1.2 V, C_s 20 fF,
   C_BL 200 fF, bitline precharged to V_DD/2, refresh window 64 ms. The leak rate is the model's own (NOTES.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The cell functions (leak, share, deltaV,
   sense) are pure over numbers, ready for models/ (rowhammer could reuse them). */
(function (root) {
  'use strict';

  var VDD = 1.2;        // V
  var CS = 20;          // fF, storage capacitor
  var CBL = 200;        // fF, bitline
  var LEAK = 0.5;       // % of V_DD per ms, toward GND: a full cell reaches V_DD/2 after 100 ms
  var WAIT = 32;        // ms per wait step
  var WINDOW = 64;      // ms, the refresh window (tREFW)

  /** The script: what happens at step n (1-based). 'first' and 'other' are the bit param and its complement. */
  var SCRIPT = ['write:first', 'read', 'restore', 'wait', 'wait', 'refresh', 'wait', 'wait', 'read', 'restore',
    'write:other', 'read', 'restore'];

  function round(x, d) { var f = Math.pow(10, d); return Math.round(x * f) / f; }

  /** Charge after `ms` of leakage: it drains toward GND (0 %) at LEAK % per ms and stops there. */
  function leak(charge, ms) { return Math.max(0, round(charge - LEAK * ms, 6)); }

  /** Charge sharing: the cell and the bitline (precharged to V_DD/2) settle at one voltage. Returns that voltage in
      % of V_DD, which is what the cell holds after the read: its own level is gone. */
  function share(charge) { return round((CS * charge + CBL * 50) / (CS + CBL), 6); }

  /** The small swing the sense amplifier sees, in volts: (V_cell - V_DD/2) * C_s / (C_s + C_BL). Signed. */
  function deltaV(charge) { return round((charge / 100 - 0.5) * VDD * CS / (CS + CBL), 6); }

  /** The bit the sense amplifier resolves: 1 only when the bitline is above the V_DD/2 reference. A cell that has
      leaked to exactly V_DD/2 gives no swing and resolves as 0. */
  function sense(charge) { return charge > 50 ? 1 : 0; }

  function copy(s) { return JSON.parse(JSON.stringify(s)); }

  var logic = {
    /** bit: the first bit written ('1' or '0'); refresh: whether the refresh at 64 ms happens; view: the page shows
        the cells or the comparison table (the model ignores it). */
    defaults: { bit: '1', refresh: true, view: 'cells' },
    bits: ['1', '0'],
    views: ['cells', 'table'],
    steps: SCRIPT.length,
    script: SCRIPT,
    VDD: VDD, CS: CS, CBL: CBL, LEAK: LEAK, WAIT: WAIT, WINDOW: WINDOW,
    leak: leak, share: share, deltaV: deltaV, sense: sense,

    /** The DRAM cell has lost its bit when a read now would give something other than what was written. */
    lost: function (dram) { return dram.bit !== null && sense(dram.charge) !== dram.bit; },

    /** Power just came on: the SRAM latch holds an unknown value, the DRAM capacitor is empty and means nothing yet. */
    initial: function () {
      return {
        t: 0,
        sram: { q: null, wl: 0, bl: 'pre', blb: 'pre' },
        dram: { charge: 0, bit: null, since: 0, wl: 0, bl: 'pre', sa: null },
        trace: [{ t: 0, charge: 0 }],
        ev: null
      };
    },

    /** The op at step n for these params: { op, bit? }. */
    opAt: function (n, p) {
      var name = SCRIPT[n - 1];
      var first = Number(p.bit);
      if (name === 'write:first') return { op: 'write', bit: first };
      if (name === 'write:other') return { op: 'write', bit: 1 - first };
      if (name === 'refresh' && !p.refresh) return { op: 'skip' };
      return { op: name };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      var o = logic.opAt(n, p);
      var S = s.sram, D = s.dram;
      var ev = { op: o.op, sram: {}, dram: { before: D.charge } };

      // Every op starts from the idle bus: wordline low, bitlines precharged, sense amplifier off.
      S.wl = 0; S.bl = 'pre'; S.blb = 'pre';
      D.wl = 0; D.bl = 'pre';
      if (o.op !== 'restore') D.sa = null;

      if (o.op === 'write') {
        ev.bit = o.bit;
        ev.sram.was = S.q;
        S.q = o.bit; S.wl = 1; S.bl = o.bit ? 'vdd' : 'gnd'; S.blb = o.bit ? 'gnd' : 'vdd';
        D.bit = o.bit; D.charge = o.bit ? 100 : 0; D.since = 0; D.wl = 1; D.bl = o.bit ? 'vdd' : 'gnd';
      } else if (o.op === 'read') {
        // SRAM: the latch drives the precharged bitlines apart; nothing in the cell changes.
        ev.sram.read = S.q;
        if (S.q !== null) { S.wl = 1; S.bl = S.q ? 'up' : 'down'; S.blb = S.q ? 'down' : 'up'; }
        // DRAM: charge sharing, then the sense amplifier compares with V_DD/2.
        ev.dram.dv = deltaV(D.charge);
        D.charge = share(D.charge);
        ev.dram.sensed = sense(ev.dram.before);
        ev.dram.wrong = D.bit !== null && ev.dram.sensed !== D.bit;
        D.wl = 1; D.bl = 'share'; D.sa = ev.dram.sensed;
      } else if (o.op === 'restore') {
        // DRAM: the sense amplifier drives the bit it read back into the cell, right or wrong.
        ev.dram.sensed = D.sa;
        D.charge = D.sa ? 100 : 0; D.since = 0; D.wl = 1; D.bl = D.sa ? 'vdd' : 'gnd';
        ev.dram.wrong = D.bit !== null && D.sa !== D.bit;
        D.sa = null;
      } else if (o.op === 'refresh') {
        // A refresh is a read and a write-back of the whole row; the SRAM cell needs none.
        ev.dram.dv = deltaV(D.charge);
        ev.dram.sensed = sense(D.charge);
        ev.dram.wrong = D.bit !== null && ev.dram.sensed !== D.bit;
        D.charge = ev.dram.sensed ? 100 : 0; D.since = 0; D.wl = 1; D.bl = ev.dram.sensed ? 'vdd' : 'gnd';
      } else if (o.op === 'skip') {
        ev.dram.overdue = D.since >= WINDOW;
      } else if (o.op === 'wait') {
        s.t += WAIT; D.since += WAIT;
        D.charge = leak(D.charge, WAIT);
        ev.dram.overdue = D.since > WINDOW;
      }
      ev.dram.after = D.charge;
      s.trace.push({ t: s.t, charge: D.charge });
      s.ev = ev;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
