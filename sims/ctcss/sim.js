/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ctcss: a receiver or repeater R with tone squelch opens its loudspeaker only when the carrier carries the
   set sub-audible tone. Rules and numbers: SPEC.md.
   One step = one 0.25 s slot. The detector is the real thing in miniature: each keyed station's demodulated audio is
   synthesised (tone + speech above 300 Hz + a little noise, 8000 samples/s), and a Goertzel filter measures the power
   at all 49 standard tones over the last 0.5 s; the best tone counts only when it is ≥ 12 dB above the median.
   Pure: no DOM, no Math.random (a seeded generator), no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // The 49 standard tones, Hz (HamMonitor ctcss.py CTCSS_TONES; EIA/TIA-603 (check), SPEC.md rule 2)
  var TONES = [
    67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5,
    91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8,
    118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4,
    156.7, 159.8, 162.2, 165.5, 167.9, 171.3, 173.8, 177.3,
    179.9, 183.5, 186.2, 189.9, 192.8, 196.6, 199.5, 203.5,
    206.5, 210.7, 218.1, 225.7, 229.1, 233.6, 241.8, 250.3,
    254.1
  ];
  var IDS = ['A', 'B', 'C'];
  var SLOT_S = 0.25;            // one step (task)
  var WINDOW_SLOTS = 2;         // 0.5 s of audio before a decision (HamMonitor DESIGN.md "CTCSS Detection")
  var RATE = 8000;              // audio samples per second after decimation (HamMonitor _TARGET_AUDIO_RATE)
  var SLOT_N = RATE * SLOT_S;   // 2000 samples per slot
  var THRESHOLD_DB = 12;        // best tone ≥ 12 dB over the median of all 49 (HamMonitor _TONE_THRESHOLD_DB)
  var HPF_HZ = 300;             // the speech path: tone filtered out below ≈ 300 Hz (rule 5, check)
  // Synthetic demodulated audio, in units of the peak deviation (SPEC.md "Audio")
  var TONE_AMP = 0.15;          // CTCSS deviation ≈ 15 % of the peak deviation (check)
  var VOICE = [[520, 0.35], [870, 0.25], [1330, 0.18], [2150, 0.1]];   // speech-like parts, all above 300 Hz
  var NOISE_AMP = 0.05;         // uniform noise of a strong signal

  /** Keying schedules, in slots (inclusive): slot n covers [(n − 1)·0.25 s, n·0.25 s). */
  var SCHEDULES = {
    A: { A: [1, 12] },                    // right-tone: A for 3 s
    B: { B: [1, 12] },                    // no-tone
    C: { C: [1, 12] },                    // wrong-tone
    AB: { A: [1, 12], B: [7, 14] }        // hidden-user: A 0–3 s, B 1.5–3.5 s
  };
  var STEPS = { A: 12, B: 12, C: 12, AB: 14 };

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function round1(x) { return Math.round(x * 10) / 10 + 0; }   // + 0 turns -0 into 0 (JSON-safe)

  /** mulberry32, the kit's generator (Simdeck.rng), inlined so the model stands alone. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** The station's tone param: a number (Hz) or null for "no tone". */
  function toneOf(p, id) {
    var v = p['tone' + id];
    return v === 'none' || v === null || v === undefined ? null : Number(v);
  }

  /** Stations keyed in slot n, in id order. */
  function keyedAt(p, n) {
    var sch = SCHEDULES[p.schedule] || SCHEDULES.A;
    return IDS.filter(function (id) { return sch[id] && sch[id][0] <= n && n <= sch[id][1]; });
  }

  /** Stations R receives in slot n: keyed and above the carrier squelch threshold (rule 1). A weak station stays
      under the threshold: it neither opens R nor doubles a strong one (SPEC.md rule 1, simplification). */
  function receivedAt(p, n) {
    return keyedAt(p, n).filter(function (id) { return p.weak !== id; });
  }

  /** Demodulated audio of slot n at R: the sum of the received stations' audio (rule 6: a doubled slot mixes both).
      Deterministic: the noise seed is the slot and the station. */
  function slotAudio(p, n) {
    var out = new Array(SLOT_N).fill(0);
    receivedAt(p, n).forEach(function (id, k) {
      var tone = toneOf(p, id), r = rng(n * 131 + IDS.indexOf(id) * 7919 + 17);
      var ph = 0.7 * (IDS.indexOf(id) + 1);
      for (var i = 0; i < SLOT_N; i++) {
        var t = (n - 1) * SLOT_S + i / RATE;
        var v = 0;
        if (tone !== null) v += TONE_AMP * Math.sin(2 * Math.PI * tone * t + ph);
        var env = 0.6 + 0.4 * Math.sin(2 * Math.PI * 3.1 * t + ph);      // syllables, about three a second
        for (var j = 0; j < VOICE.length; j++) v += env * VOICE[j][1] * Math.sin(2 * Math.PI * (VOICE[j][0] + 40 * k) * t + ph * (j + 1));
        v += NOISE_AMP * (2 * r() - 1);
        out[i] += v;
      }
    });
    return out;
  }

  /** Goertzel power at f, normalised by the window (HamMonitor ctcss.py _goertzel). */
  function goertzel(x, f) {
    var w = 2 * Math.PI * f / RATE, coeff = 2 * Math.cos(w), s1 = 0, s2 = 0;
    for (var i = 0; i < x.length; i++) { var s0 = x[i] + coeff * s1 - s2; s2 = s1; s1 = s0; }
    return (s1 * s1 + s2 * s2 - coeff * s1 * s2) / (x.length * x.length / 4);
  }

  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  /** Rule 3, the decision over the 49 tone powers (dB): the best one and its margin over the median. Tie-break: on
      equal power the lower tone wins (the first in the list, like argmax). decided = the best tone if its margin is
      ≥ 12 dB, else null. */
  function decide(db) {
    var med = median(db), best = 0;
    for (var i = 1; i < db.length; i++) if (db[i] > db[best]) best = i;
    var margin = db[best] - med;
    return {
      best: TONES[best],
      marginDb: round1(margin),
      decided: margin >= THRESHOLD_DB ? TONES[best] : null,
      powers: db.map(function (d) { return round1(d - med); })     // dB over the median, for the bar chart
    };
  }

  /** Rule 4b: a lock holds while the set tone is still the decided one (the best, ≥ 12 dB over the median). */
  function holds(r, rxTone) { return r.decided !== null && r.decided === rxTone; }

  /** Rule 3 on a stretch of audio: Goertzel power at every standard tone, then decide. */
  function analyse(audio) {
    return decide(TONES.map(function (f) { return 10 * Math.log10(Math.max(goertzel(audio, f), 1e-10)); }));
  }

  /** Analyse slots from..to (inclusive) of R's received audio. */
  function analyseSlots(p, from, to) {
    var a = [];
    for (var n = from; n <= to; n++) a = a.concat(slotAudio(p, n));
    return analyse(a);
  }

  var logic = {
    TONES: TONES, IDS: IDS, SLOT_S: SLOT_S, WINDOW_SLOTS: WINDOW_SLOTS, RATE: RATE, THRESHOLD_DB: THRESHOLD_DB,
    HPF_HZ: HPF_HZ, SCHEDULES: SCHEDULES, VOICE: VOICE,
    keyedAt: keyedAt, receivedAt: receivedAt, slotAudio: slotAudio, goertzel: goertzel, decide: decide, holds: holds, analyse: analyse,
    analyseSlots: analyseSlots, toneOf: toneOf,

    defaults: { squelch: 'tone', rxTone: '88.5', schedule: 'A', toneA: '88.5', toneB: 'none', toneC: '91.5', weak: 'none' },

    initial: function (p) {
      var sch = SCHEDULES[p.schedule] || SCHEDULES.A;
      return {
        t: 0,
        squelch: p.squelch === 'carrier' ? 'carrier' : 'tone',
        rxTone: Number(p.rxTone),
        stations: IDS.map(function (id) {
          var k = sch[id] || null;
          return {
            id: id, tone: toneOf(p, id), level: p.weak === id ? 'weak' : 'strong',
            keyed: k ? [(k[0] - 1) * SLOT_S, k[1] * SLOT_S] : null, on: false
          };
        }),
        carrier: false,
        detector: { collected: 0, bestTone: null, marginDb: null, decided: null, powers: null, locked: false, check: null },
        speaker: 'muted',
        heard: [],          // readable runs: [{ id, from, to }] in slots
        doubled: [],        // slots where two carriers were on the air
        slots: [],          // the strip, one record per slot
        events: []          // this slot's event codes, for the caption
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.t = n;
      s.events = [];
      var tone = s.squelch === 'tone';

      // (1) stations key up or release
      var keyed = keyedAt(p, n), rx = receivedAt(p, n);
      s.stations.forEach(function (x) {
        var on = keyed.indexOf(x.id) >= 0;
        if (on && !x.on) s.events.push('key.up:' + x.id);
        if (!on && x.on) s.events.push('key.down:' + x.id);
        x.on = on;
      });

      // (2) R measures the carrier (rule 1)
      var wasCarrier = s.carrier;
      s.carrier = rx.length > 0;
      if (s.carrier && !wasCarrier) s.events.push('carrier.on');
      if (!s.carrier && wasCarrier) s.events.push('carrier.off');

      // (3) the detector (rules 3 and 4), only with tone squelch
      var d = s.detector, lockedBefore = tone && d.locked, lost = false, state = 'off';
      d.check = null;
      if (tone) {
        if (!s.carrier) {
          d.collected = 0; d.bestTone = null; d.marginDb = null; d.decided = null; d.powers = null; d.locked = false;
          state = 'idle';
        } else {
          d.collected = Math.min(WINDOW_SLOTS, d.collected + 1);
          if (d.locked) {
            // rule 4: a lock is checked on every new 0.25 s; when the set tone is no longer the best ≥ 12 dB, it is lost
            // at once and the detector starts collecting again from this slot
            var c = analyseSlots(p, n, n);
            d.check = { best: c.best, marginDb: c.marginDb, ok: holds(c, s.rxTone) };
            if (!d.check.ok) {
              lost = true; d.locked = false; d.collected = 1; d.decided = null;
              s.events.push('det.lost');
            }
          }
          if (d.collected === WINDOW_SLOTS) {
            var a = analyseSlots(p, n - WINDOW_SLOTS + 1, n);
            d.bestTone = a.best; d.marginDb = a.marginDb; d.decided = a.decided; d.powers = a.powers;
            var was = d.locked;
            d.locked = a.decided === s.rxTone;
            if (d.locked && !was) s.events.push('det.lock');
            if (!d.locked && was) s.events.push('det.lost');
            state = a.decided === null ? 'none' : 'found';
          } else {
            d.bestTone = null; d.marginDb = null; d.powers = null;
            state = lost ? 'lost' : 'listening';
          }
        }
      }

      // (4) the loudspeaker for this slot: carrier squelch opens with the carrier; tone squelch needs the carrier and
      // a lock from the end of the last slot that still holds at the end of this one: a new lock opens it from the next
      // slot (T1), a lock lost in this slot, by the 0.25 s check or by the sliding decision, mutes this slot (rule 4b)
      var open = tone ? s.carrier && lockedBefore && d.locked : s.carrier;
      var speaker = open ? 'open' : 'muted';
      if (speaker !== s.speaker) s.events.push(open ? 'speaker.open' : 'speaker.mute');
      s.speaker = speaker;

      // (5) two carriers at once: doubling (rule 6), whatever the squelch shows
      var doubled = rx.length >= 2;
      if (doubled) { s.doubled.push(n); s.events.push('double'); }
      if (open && !doubled) {
        var last = s.heard[s.heard.length - 1];
        if (last && last.id === rx[0] && last.to === n - 1) last.to = n;
        else s.heard.push({ id: rx[0], from: n, to: n });
      }

      s.slots.push({
        n: n, keyed: keyed, received: rx, carrier: s.carrier, det: state,
        tone: tone && state === 'found' ? d.decided : null, marginDb: tone ? d.marginDb : null,
        collected: tone ? d.collected : 0, speaker: speaker, doubled: doubled
      });
      return s;
    },

    steps: function (p) { return STEPS[p.schedule] || 12; },

    /** Seconds of a transmission by station id that the listener heard readable, and its keyed seconds. */
    heardSeconds: function (s, id) {
      return s.heard.filter(function (h) { return h.id === id; }).reduce(function (a, h) { return a + (h.to - h.from + 1) * SLOT_S; }, 0);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
