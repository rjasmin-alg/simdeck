/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for buffer-overflow: one function's stack frame, an input copied into char buf[N] with no bounds check, and
   what happens on return with a stack canary, a non-executable stack (NX) and address-space layout randomization
   (ASLR). Rules: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.

   The frame is drawn in 4-byte words, high addresses at the top. Offsets are bytes from the start of buf:
     [0, N)          buf            (lowest addresses; the copy writes upward from offset 0)
     [N, N+4)        stack canary   (only when the canary is on)
     next 4          saved frame pointer
     next 4          return address
     after that      the caller's frame (at least one word shown, more when the input reaches further)
   Every address is a small illustrative integer, not a real memory layout. */
(function (root) {
  'use strict';

  var WORD = 4;
  /** Without ASLR: where the return-address slot sits, where the program's code is, the two code addresses. */
  var RA_SLOT = 0x7f7c;
  var STACK_LO = 0x7f00, STACK_HI = 0x8000;
  var CODE_LO = 0x1000, CODE_HI = 0x2000;
  var RET_POINT = 0x1a2c;     // in main, just after the call: where a normal return goes
  var ADMIN_FN = 0x1b40;      // an existing function the program never calls from here (target "code")
  var CALLER_FP = 0x1c;       // the caller's frame pointer, this many bytes above the return-address slot
  /** With ASLR this run's stack and code sit elsewhere (fixed shifts: the model stays deterministic). */
  var ASLR_STACK = -0x2400, ASLR_CODE = 0x3000;
  var CANARY = 0xc3a95e17;    // illustrative; a real one is random per run
  var FILL = 0x41;            // 'A'

  function shifts(aslr) { return aslr ? { stack: ASLR_STACK, code: ASLR_CODE } : { stack: 0, code: 0 }; }

  /** Frame layout for the params: offsets (from buf) of each slot, shown region, and this run's addresses. */
  function layout(p) {
    var n = p.bufSize;
    var canaryOff = p.canary ? n : -1;
    var fpOff = n + (p.canary ? WORD : 0);
    var raOff = fpOff + WORD;
    var callerOff = raOff + WORD;
    var beyond = Math.max(0, p.inputLen - callerOff);
    var end = callerOff + Math.max(WORD, Math.ceil(beyond / WORD) * WORD);
    var sh = shifts(p.aslr);
    var raAddr = RA_SLOT + sh.stack;
    return {
      bufSize: n, canaryOff: canaryOff, fpOff: fpOff, raOff: raOff, callerOff: callerOff, end: end,
      bufAddr: raAddr - raOff, raAddr: raAddr,
      stack: [STACK_LO + sh.stack, STACK_HI + sh.stack], code: [CODE_LO + sh.code, CODE_HI + sh.code],
      retPoint: RET_POINT + sh.code, admin: ADMIN_FN + sh.code, callerFP: raAddr + CALLER_FP
    };
  }

  /** Which slot an offset belongs to. */
  function slotOf(L, off) {
    if (off < L.bufSize) return 'buf';
    if (L.canaryOff >= 0 && off >= L.canaryOff && off < L.canaryOff + WORD) return 'canary';
    if (off >= L.fpOff && off < L.fpOff + WORD) return 'fp';
    if (off >= L.raOff && off < L.raOff + WORD) return 'ra';
    return 'caller';
  }

  /** The address the input's author wrote into it: taken from a run without ASLR (a hardcoded guess). */
  function targetAddr(p) {
    if (p.target === 'code') return ADMIN_FN;
    return layout(Object.assign({}, p, { aslr: false })).bufAddr;
  }

  /** The input, byte by byte: what kind each byte is ('code' injected bytes, 'fill' padding, 'addr' the target's
      bytes, little-endian) and its value. It is laid out for this frame, so the address lands on the return
      address; the canary's value is unknown to its author, so padding goes over it. */
  function inputBytes(p) {
    var L = layout(p), t = targetAddr(p), out = [];
    for (var i = 0; i < p.inputLen; i++) {
      if (p.target === 'stack' && i < WORD) out.push({ k: 'code', v: 0xc0 + i });
      else if (i >= L.raOff && i < L.raOff + WORD) out.push({ k: 'addr', v: (t >>> (8 * (i - L.raOff))) & 0xff });
      else out.push({ k: 'fill', v: FILL });
    }
    return out;
  }

  /** Bytes copied per step: 2, or 4 for inputs over 24 bytes, so a demo stays at most 16 steps. */
  function chunkOf(p) { return p.inputLen > 24 ? 4 : 2; }
  function copySteps(p) { return Math.max(1, Math.ceil(p.inputLen / chunkOf(p))); }

  /** Where a jump to addr goes in this run. */
  function regionOf(L, addr) {
    if (addr >= L.code[0] && addr < L.code[1]) return 'code';
    if (addr >= L.stack[0] && addr < L.stack[1]) return 'stack';
    return 'none';
  }

  function hex(v) { return '0x' + (v >>> 0).toString(16).toUpperCase().padStart(4, '0'); }

  /** The frame's slots from the cells: canary intact?, saved FP intact?, return address (whole, partly or not
      overwritten, and its value when known). */
  function slots(p, L, cells) {
    function touched(off) {
      for (var i = off; i < off + WORD; i++) if (cells[i] !== 'orig') return true;
      return false;
    }
    function full(off) {
      for (var i = off; i < off + WORD; i++) if (cells[i] === 'orig') return false;
      return true;
    }
    var raTouched = touched(L.raOff), raFull = full(L.raOff);
    var t = targetAddr(p);
    var ra = !raTouched ? { value: L.retPoint, label: 'caller', state: 'orig' }
      : raFull ? { value: t, label: p.target === 'code' ? 'admin' : 'buf', state: 'target' }
        : { value: null, label: 'mixed', state: 'partial' };
    return {
      canary: { present: !!p.canary, value: CANARY, intact: !p.canary || !touched(L.canaryOff) },
      savedFP: { value: touched(L.fpOff) ? null : L.callerFP, intact: !touched(L.fpOff) },
      retAddr: ra
    };
  }

  /** The ending, from the frame after the copy (rules 3–6, in the order the CPU meets them). */
  function resolve(p, L, sl) {
    if (!sl.canary.intact) return { outcome: 'canary-trip', layer: 'canary', jump: null };
    var ra = sl.retAddr;
    if (ra.state === 'orig') {
      return { outcome: sl.savedFP.intact ? 'normal' : 'crash', layer: null, why: sl.savedFP.intact ? null : 'fp',
        jump: { to: ra.value, region: 'code', what: 'caller' } };
    }
    if (ra.state === 'partial') return { outcome: 'crash', layer: null, why: 'mixed', jump: { to: null, region: 'none', what: 'mixed' } };
    var region = regionOf(L, ra.value);
    var meant = p.target === 'code' ? 'code' : 'stack';
    if (region !== meant) return { outcome: 'aslr-miss', layer: 'aslr', jump: { to: ra.value, region: region, what: 'unmapped' } };
    if (region === 'stack' && p.nx) return { outcome: 'nx-block', layer: 'nx', jump: { to: ra.value, region: 'stack', what: 'buf' } };
    return { outcome: 'hijack', layer: null, jump: { to: ra.value, region: region, what: ra.label } };
  }

  /** Rule 7: what each mitigation did in this run. 'off'; 'stopped' (it decided); 'not-reached' (an earlier layer
      stopped it first); 'not-needed' (nothing to stop: the return address was not replaced); 'no-effect' (it was on
      and the run went past it). Only meaningful once the outcome is known. */
  function layers(p, r) {
    var order = ['canary', 'aslr', 'nx']; // the order the CPU meets them: the check on return, then the jump
    var stoppedAt = r.layer ? order.indexOf(r.layer) : -1;
    var out = {};
    order.forEach(function (m, i) {
      if (!p[m]) out[m] = 'off';
      else if (r.layer === m) out[m] = 'stopped';
      else if (stoppedAt >= 0 && i > stoppedAt) out[m] = 'not-reached';
      else if (r.outcome === 'normal' || r.outcome === 'crash') out[m] = 'not-needed';
      else out[m] = 'no-effect';
    });
    return out;
  }

  var logic = {
    defaults: { bufSize: 8, inputLen: 0, canary: false, nx: false, aslr: false, target: 'stack' },

    /** frame, the copy (one step per chunk, at least one), return, jump, outcome. */
    steps: function (p) { return 1 + copySteps(p) + 3; },

    initial: function (p) {
      var L = layout(p);
      var cells = [];
      for (var i = 0; i < L.end; i++) cells.push(i >= L.callerOff ? 'orig' : 'none');
      return {
        phase: 'start', bufSize: p.bufSize, input: p.inputLen, written: 0, from: 0, cells: cells, changed: [],
        canary: { present: !!p.canary, value: CANARY, intact: true }, savedFP: { value: L.callerFP, intact: true },
        retAddr: { value: L.retPoint, label: 'caller', state: 'orig' }, nx: !!p.nx, aslr: !!p.aslr,
        hit: [], jump: null, outcome: null, layer: null, why: null, layers: null
      };
    },

    step: function (s, n, p) {
      var L = layout(p);
      var c = copySteps(p);
      var next = JSON.parse(JSON.stringify(s));
      next.changed = [];
      next.hit = [];
      if (n === 1) {
        next.phase = 'frame';
        for (var i = 0; i < L.callerOff; i++) next.cells[i] = i < L.bufSize ? 'empty' : 'orig';
        return next;
      }
      if (n <= 1 + c) {
        var bytes = inputBytes(p), k = chunkOf(p);
        var from = (n - 2) * k, to = Math.min(p.inputLen, from + k);
        next.phase = 'copy';
        next.from = from;
        for (var j = from; j < to; j++) {
          next.cells[j] = bytes[j].k;
          next.changed.push(j);
          var slot = slotOf(L, j);
          if (next.hit.indexOf(slot) < 0) next.hit.push(slot);
        }
        next.written = Math.max(from, to);
        var sl = slots(p, L, next.cells);
        next.canary = sl.canary;
        next.savedFP = sl.savedFP;
        next.retAddr = sl.retAddr;
        return next;
      }
      var r = resolve(p, L, s);
      if (n === 2 + c) {
        next.phase = 'return';
        if (r.outcome === 'canary-trip') { next.outcome = r.outcome; next.layer = r.layer; }
        return next;
      }
      next.outcome = r.outcome;
      next.layer = r.layer;
      next.why = r.why || null;
      next.jump = r.jump;
      if (n === 3 + c) { next.phase = 'jump'; return next; }
      next.phase = 'outcome';
      next.layers = layers(p, r);
      return next;
    },

    // helpers the page and the tests use
    WORD: WORD,
    layout: layout,
    slotOf: slotOf,
    inputBytes: inputBytes,
    targetAddr: targetAddr,
    chunkOf: chunkOf,
    copySteps: copySteps,
    regionOf: regionOf,
    hex: hex
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
