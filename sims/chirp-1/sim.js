/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for chirp-1 (chirp in a CW transmitter), after 50ohm's applet_chirp_1.html and sections/
   oszillator_spannungsstabilitaet.md (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
   A keyed oscillator whose supply voltage dips at every key-down: its frequency jumps by `jump` Hz and settles back to
   the true pitch exponentially, f(t) = F0 + jump · e^(−t/tau), t from the start of the element. A regulated supply does
   not dip, so the jump is 0. Morse timing (PARIS): dit 1 unit, dah 3, gap inside a letter 1, between letters 3.
   The recording's helpers (page of the plot, transcript so far) take the recording's data as an argument.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var F0 = 600;                       // the true pitch of the model's tone, Hz
  var DIT = 100;                      // ms: 12 words per minute, about the recording's speed
  var JUMP_MIN = -200, JUMP_MAX = 200, JUMP_STEP = 10;   // Hz; negative: the element starts below the true pitch
  var TAU_MIN = 20, TAU_MAX = 500, TAU_STEP = 10;        // ms
  var REC_DURATION = 37.56;           // s, the recording's length (recording.js)
  var REC_MAX = 37.5;                 // the last position the play-position slider takes
  var REC_PAGES = 8;                  // the recording's plot shows one eighth of it at a time

  var MORSE = { C: '-.-.', Q: '--.-', S: '...', O: '---' };
  var TEXT = 'CQ';                    // what the model sends: dahs and dits
  var SOURCES = ['rec', 'model'];

  var defaults = { src: 'rec', t: 0, reg: false, jump: -90, tau: 300 };

  var presets = [
    { id: 'rec', params: { src: 'rec', t: 0 } },
    { id: 'likeRec', params: { src: 'model', reg: false, jump: -90, tau: 300 } },
    { id: 'regulated', params: { src: 'model', reg: true, jump: -90, tau: 300 } },
    { id: 'fast', params: { src: 'model', reg: false, jump: -90, tau: 100 } },
    { id: 'above', params: { src: 'model', reg: false, jump: 150, tau: 60 } }
  ];

  /** A number snapped to step from lo (halves away from lo), clamped to [lo, hi]; a non-number gives def. */
  function snap(x, lo, hi, step, def) {
    var v = (x === null || x === '' || typeof x === 'boolean') ? NaN : Number(x);
    if (!isFinite(v)) v = def;
    v = Math.min(hi, Math.max(lo, v));
    return lo + Math.floor((v - lo) / step + 0.5 + 1e-9) * step;
  }
  function snapJump(x) { return snap(x, JUMP_MIN, JUMP_MAX, JUMP_STEP, defaults.jump); }
  function snapTau(x) { return snap(x, TAU_MIN, TAU_MAX, TAU_STEP, defaults.tau); }
  function source(x) { return SOURCES.indexOf(x) >= 0 ? x : 'rec'; }
  /** The recording's play position in s, 0 … REC_MAX, to 0.1 s (a non-number is 0). */
  function snapT(x) { return Math.round(snap(x, 0, REC_MAX, 0.1, 0) * 10) / 10; }

  /** The key-down intervals of a text, in ms from 0: [{ on, off, dah, ch }], in order. Letters without a code are skipped. */
  function keying(text, dit) {
    var u = dit || DIT, t = 0, out = [], first = true;
    String(text).split('').forEach(function (ch) {
      var code = MORSE[ch];
      if (!code) return;
      if (!first) t += 3 * u;                 // the gap between letters (after the element's own 1-unit gap: 3 in all)
      first = false;
      code.split('').forEach(function (sym, i) {
        if (i > 0) t += u;
        var len = sym === '-' ? 3 * u : u;
        out.push({ on: t, off: t + len, dah: sym === '-', ch: ch });
        t += len;
      });
    });
    return out;
  }

  /** The pitch ms after key-down: the true pitch plus the jump, decaying with tau. */
  function pitch(ms, jump, tau) { return F0 + jump * Math.exp(-ms / tau); }

  /** How far from the true pitch an element of length ms ends, in Hz (signed, like the jump). */
  function endOffset(ms, jump, tau) { return jump * Math.exp(-ms / tau); }

  /** The recording's page for position t (s): [from, to] in s. The end belongs to the last page. */
  function recPage(t) {
    var w = REC_DURATION / REC_PAGES, i = Math.min(REC_PAGES - 1, Math.floor(t / w + 1e-9));
    return { i: i, from: i * w, to: (i + 1) * w };
  }

  /** The transcript up to t (s), by the original's rule: a character shows once its time is reached (ms ≤ t). */
  function transcript(events, t) {
    var ms = t * 1000 + 1e-6, s = '';
    for (var i = 0; i < events.length && events[i][0] <= ms; i++) s += (events[i][2] ? ' ' : '') + events[i][1];
    return s;
  }

  function initial(p) {
    var src = source(p.src);
    var reg = p.reg === true, jumpSet = snapJump(p.jump), tau = snapTau(p.tau);
    var jump = reg ? 0 : jumpSet;             // a regulated supply does not dip at key-down
    var els = keying(TEXT, DIT);
    var ditEnd = endOffset(DIT, jump, tau), dahEnd = endOffset(3 * DIT, jump, tau);
    return {
      src: src, t: snapT(p.t), page: recPage(snapT(p.t)), word: TEXT,
      reg: reg, jumpSet: jumpSet, jump: jump, tau: tau, f0: F0, dit: DIT,
      elements: els, duration: els.length ? els[els.length - 1].off : 0,
      dir: jump < 0 ? 'below' : jump > 0 ? 'above' : 'none',
      // offsets at the end of each element kind, rounded to whole Hz as the page shows them
      ditEnd: Math.round(ditEnd) || 0, dahEnd: Math.round(dahEnd) || 0
    };
  }

  var logic = {
    F0: F0, DIT: DIT, JUMP_MIN: JUMP_MIN, JUMP_MAX: JUMP_MAX, JUMP_STEP: JUMP_STEP,
    TAU_MIN: TAU_MIN, TAU_MAX: TAU_MAX, TAU_STEP: TAU_STEP,
    REC_DURATION: REC_DURATION, REC_MAX: REC_MAX, REC_PAGES: REC_PAGES,
    MORSE: MORSE, TEXT: TEXT,
    defaults: defaults,
    presets: presets,
    initial: initial,
    snapJump: snapJump, snapTau: snapTau, snapT: snapT, source: source,
    keying: keying, pitch: pitch, endOffset: endOffset, recPage: recPage, transcript: transcript
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
