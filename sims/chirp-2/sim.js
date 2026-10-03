/* SPDX-License-Identifier: AGPL-3.0-or-later
   Logic for chirp-2 (chirp heard in a QSO), after 50ohm's applet_chirp_2.html and sections/
   oszillator_spannungsstabilitaet.md (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
   A recording of a QSO in two passes: the first station's tone is steady, the second's (OM3YCY) rises in every element.
   The page's one param is the play position. These helpers take the recording's data (recording.js) as an argument:
   the page of the plot, the transcript of each pass so far, who is sending, and how far each pass's dahs rise from
   key-down to key-up.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var REC_DURATION = 36.75;           // s, the recording's length (recording.js)
  var REC_MAX = 36.7;                 // the last position the play-position slider takes
  var REC_PAGES = 8;                  // the plot shows one eighth of the recording at a time
  var DAH_SAMPLES = 10;               // an element with at least this many pitch samples (100 ms) counts as a dah
  var EDGE = 5;                       // samples at each end whose median is the pitch at key-down and at key-up

  var defaults = { t: 0 };

  var presets = [
    { id: 'first', params: { t: 0 } },
    { id: 'second', params: { t: 8.8 } },
    { id: 'whole', params: { t: 31.4 } }
  ];

  /** The play position in s, 0 … REC_MAX, to 0.1 s (halves up; a non-number is 0). */
  function snapT(x) {
    var v = (x === null || x === '' || typeof x === 'boolean') ? NaN : Number(x);
    if (!isFinite(v)) v = 0;
    v = Math.min(REC_MAX, Math.max(0, v));
    return Math.round(Math.floor(v * 10 + 0.5 + 1e-9)) / 10;
  }

  /** The recording's page for position t (s): { i, from, to } in s. A boundary belongs to the later page, the end to the last. */
  function recPage(t) {
    var w = REC_DURATION / REC_PAGES, i = Math.min(REC_PAGES - 1, Math.max(0, Math.floor(t / w + 1e-9)));
    return { i: i, from: i * w, to: (i + 1) * w };
  }

  /** One pass's transcript up to t (s), by the original's rule: a character shows once its time is reached (ms ≤ t).
      events: [ms, character, space before, station]. A pass's first character never takes a space. */
  function transcript(events, t, station) {
    var ms = t * 1000 + 1e-6, s = '';
    for (var i = 0; i < events.length && events[i][0] <= ms; i++) {
      if (events[i][3] !== station) continue;
      s += (events[i][2] && s ? ' ' : '') + events[i][1];
    }
    return s;
  }

  /** Who sent the last character heard by t: 0 or 1, or -1 before the first. */
  function sender(events, t) {
    var ms = t * 1000 + 1e-6, who = -1;
    for (var i = 0; i < events.length && events[i][0] <= ms; i++) who = events[i][3];
    return who;
  }

  function median(xs) {
    var a = xs.slice().sort(function (p, q) { return p - q; }), m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  /** How far a dah's pitch moves from key-down to key-up, in Hz: the median of its last EDGE samples minus the median
      of its first EDGE. Positive: it rises. null for an element too short to be a dah. */
  function rise(f) {
    if (!f || f.length < DAH_SAMPLES) return null;
    return median(f.slice(-EDGE)) - median(f.slice(0, EDGE));
  }

  /** The dahs of one pass that ended by `upTo` s (all of them when upTo is omitted): { n, mean } with mean rounded
      to whole Hz (never −0), or mean null when there is none yet. track: [station, on, off, t0, [f]]. */
  function passRise(track, station, upTo) {
    var end = upTo == null ? Infinity : upTo, sum = 0, n = 0;
    track.forEach(function (e) {
      if (e[0] !== station || e[2] > end + 1e-9) return;
      var r = rise(e[4]);
      if (r === null) return;
      sum += r; n++;
    });
    return { n: n, mean: n ? (Math.round(sum / n) || 0) : null };
  }

  function initial(p) {
    var t = snapT(p.t);
    return { t: t, page: recPage(t) };
  }

  var logic = {
    REC_DURATION: REC_DURATION, REC_MAX: REC_MAX, REC_PAGES: REC_PAGES, DAH_SAMPLES: DAH_SAMPLES, EDGE: EDGE,
    defaults: defaults,
    presets: presets,
    initial: initial,
    snapT: snapT, recPage: recPage, transcript: transcript, sender: sender, median: median, rise: rise, passRise: passRise
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
