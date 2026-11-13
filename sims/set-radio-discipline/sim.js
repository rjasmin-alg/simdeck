/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-radio-discipline: two minutes of radio traffic on a fictional shooting day. Five departments and the 1st AD talk
   on handheld radios; at 0:40 the 1st AD has to call "stop". The student puts the departments' own talk on the main
   channel or on channels of their own, sets how often and how long people talk, and switches three practices on or
   off: short messages that say who for and who from and are acknowledged ("copy"), talk between departments moved to
   a side channel, and the agreed emergency word. The stage shows every transmission on each channel, the doubled
   ones, the queue on the main channel and the delay until the stop is heard on the floor; the comparison runs the same
   traffic with no practice and with all three. The channel itself is radio.js. An explorer: the state follows from
   the params. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var radio = typeof module === 'object' && module.exports
    ? require('./radio.js')
    : root.SimdeckModels['radio-channel'];

  var LEN = 120;             // seconds shown
  var STOP_AT = 40;          // the second the 1st AD needs to call stop
  var STOP_LEN = 2;          // "Stop! Stop!" (illustrative)
  var SHORT = 4;             // a short message: who for, who from, what (illustrative)
  var COPY = 1;              // "copy" back from whoever it was for
  var HAIL = 2;              // the call on the main channel that moves a talk: "Grip from camera: go to the side channel"
  var GAP = 1;               // with the emergency word: ordinary radios wait one quiet second before pressing
  var RETRY_STOP = 1;        // the 1st AD repeats a doubled stop one second later (nobody reacted)
  var RATES = [60, 30, 15];  // seconds between one department's messages
  var LEN_MIN = 4, LEN_MAX = 20, LEN_STEP = 2;

  /** The radios, in tie-break order (SPEC.md rule 1). kinds: what each message in turn is about, cycled ('own': within
   *  the department, 'cross': to another department, 'ad': for the 1st AD or, from the 1st AD, a call to all);
   *  phase: the first message at phase × period; every: the period in units of the rate; backoff: seconds before a
   *  doubled message that got no copy is repeated; far: hears nobody on the floor. */
  var STATIONS = [
    { id: 'ad', kinds: ['ad'], phase: 0.25, every: 1, backoff: 2, far: false },
    { id: 'camera', kinds: ['own', 'cross', 'own', 'ad'], phase: 0.3, every: 1, backoff: 3, far: false },
    { id: 'electric', kinds: ['cross', 'own', 'ad', 'own'], phase: 0.85, every: 1, backoff: 4, far: false },
    { id: 'grip', kinds: ['own', 'cross', 'ad', 'own'], phase: 0.1, every: 1, backoff: 5, far: false },
    { id: 'art', kinds: ['own', 'ad', 'cross', 'own'], phase: 0.45, every: 1, backoff: 6, far: false },
    { id: 'base', kinds: ['ad'], phase: 0.15, every: 2, backoff: 7, far: true }
  ];
  var IDS = STATIONS.map(function (s) { return s.id; });

  var defaults = { channels: 'one', rate: 30, len: 12, short: false, side: false, word: false };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  var NONE = { short: false, side: false, word: false };
  var ALL = { short: true, side: true, word: true };
  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'crowded', params: {} },
    { id: 'quiet', params: { rate: 60 } },
    { id: 'own', params: { channels: 'own' } },
    { id: 'short', params: { channels: 'own', short: true } },
    { id: 'side', params: { channels: 'own', short: true, side: true } },
    { id: 'word', params: { channels: 'own', short: true, side: true, word: true } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  function pick(list, x, dflt) { return list.indexOf(x) >= 0 ? x : dflt; }
  /** Rule 2: the params, cleaned: unknown choices → the default; len rounded to 2 s within 4 … 20, not a number → 12;
   *  a practice is on only when it is exactly true. */
  function clean(p) {
    var len = typeof p.len === 'number' || (typeof p.len === 'string' && p.len.trim() !== '') ? Number(p.len) : NaN;
    len = !isNaN(len) ? Math.min(LEN_MAX, Math.max(LEN_MIN, LEN_STEP * Math.round(len / LEN_STEP))) : defaults.len;
    return {
      channels: pick(['one', 'own'], p.channels, defaults.channels),
      rate: pick(RATES, Number(p.rate), defaults.rate),
      len: len, short: p.short === true, side: p.side === true, word: p.word === true
    };
  }

  /** Rule 3: where a message goes and how long it takes, as segments sent in turn. */
  function route(p, id, kind) {
    var talk = p.short ? SHORT : p.len, copy = p.short ? COPY : 0;
    if (kind === 'own' && p.channels === 'own') return [{ ch: 'own-' + id, len: talk, copy: copy, prio: false, role: 'msg' }];
    if ((kind === 'own' || kind === 'cross') && p.side) {
      return [{ ch: 'main', len: HAIL, copy: copy, prio: false, role: 'hail' },
        { ch: 'side', len: talk, copy: copy, prio: false, role: 'msg' }];
    }
    return [{ ch: 'main', len: talk, copy: copy, prio: false, role: 'msg' }];
  }

  /** Rule 4: the messages of the two minutes, in time order (ties: radio order), with the stop at STOP_AT; a call the
   *  1st AD would make in that same second is replaced by the stop. */
  function arrivals(p) {
    var out = [];
    for (var t = 0; t < LEN; t++) {
      STATIONS.forEach(function (st, r) {
        if (t === STOP_AT && st.id === 'ad') {
          out.push({ t: t, radio: r, tag: 'stop', urgent: true, first: true,
            segs: [{ ch: 'main', len: STOP_LEN, copy: 0, prio: p.word, role: 'stop' }] });
          return;
        }
        var every = p.rate * st.every, off = Math.round(st.phase * every);
        if (t < off || (t - off) % every !== 0) return;
        var kind = st.kinds[((t - off) / every) % st.kinds.length];
        out.push({ t: t, radio: r, tag: kind, segs: route(p, st.id, kind) });
      });
    }
    return out;
  }

  /** Rules 5–11 on cleaned params: radio.js over the arrivals. */
  function simulate(p) {
    return radio.run({
      len: LEN,
      radios: STATIONS.map(function (s) { return { deaf: s.far, backoff: s.backoff }; }),
      arrivals: arrivals(p), gap: p.word ? GAP : 0, retryUrgent: RETRY_STOP
    });
  }

  /** Rule 12: the numbers the page shows, for cleaned params. */
  function score(p) {
    var res = simulate(p);
    var busy = 0;
    for (var t = 0; t < STOP_AT; t++) {
      if (res.tx.some(function (x) { return x.ch === 'main' && x.start <= t && t < x.end; })) busy++;
    }
    return {
      res: res,
      heard: res.heard,
      delay: res.heard === null ? null : res.heard - STOP_AT,
      doubled: res.tx.filter(function (x) { return x.doubled; }).length,
      lost: res.msgs.filter(function (m) { return m.outcome === 'lost'; }).length,
      repeats: res.tx.filter(function (x) { return x.repeat; }).length,
      waiting: res.queue[STOP_AT - 1],
      busy: busy / STOP_AT,
      stopTries: res.tx.filter(function (x) { return x.urgent; }).length
    };
  }

  /** Rule 13: the channels the stage draws, in order. */
  function channelsOf(p) {
    var out = ['main'];
    if (p.side) out.push('side');
    if (p.channels === 'own') STATIONS.forEach(function (st) { if (st.kinds.indexOf('own') >= 0) out.push('own-' + st.id); });
    return out;
  }

  /** Rule 12: the main reason for the delay (caption), first that applies: a stop transmission doubled by the far
   *  radio; doubled by the floor; the first stop waited for the channel; it went at once. 'busy' when no stop got on
   *  air at all. waited: seconds from 0:40 to the first stop transmission. */
  function reasonOf(tx) {
    var stops = tx.filter(function (x) { return x.urgent; });
    if (!stops.length) return { reason: 'busy', waited: null };
    var waited = stops[0].start - STOP_AT;
    function by(x, far) {
      return tx.some(function (y) {
        return y !== x && y.ch === x.ch && y.start < x.end && x.start < y.end && STATIONS[y.radio].far === far;
      });
    }
    if (stops.some(function (x) { return x.doubled && by(x, true); })) return { reason: 'far', waited: waited };
    if (stops.some(function (x) { return x.doubled; })) return { reason: 'queue', waited: waited };
    return { reason: waited > 0 ? 'wait' : 'once', waited: waited };
  }

  function brief(s) { return { delay: s.delay, doubled: s.doubled, lost: s.lost }; }

  /** The whole state from the params. */
  function derive(raw) {
    var p = clean(raw || {});
    var s = score(p), res = s.res, why = reasonOf(res.tx);
    return {
      reason: why.reason, waited: why.waited,
      p: p, chans: channelsOf(p),
      tx: res.tx.map(function (x) {
        var m = res.msgs[x.msg];
        return {
          st: IDS[x.radio], ch: x.ch, start: x.start, end: Math.min(x.end, LEN), over: x.end > LEN,
          talk: x.talk, copy: x.copy, kind: m.tag, role: m.segs[x.seg].role,
          doubled: x.doubled, lost: x.lost, noticed: x.noticed, repeat: x.repeat, cut: x.cut
        };
      }),
      queue: res.queue,
      heard: s.heard, delay: s.delay, doubled: s.doubled, lost: s.lost, repeats: s.repeats, waiting: s.waiting,
      busy: s.busy, stopTries: s.stopTries,
      none: brief(score(Object.assign({}, p, NONE))),
      all: brief(score(Object.assign({}, p, ALL)))
    };
  }

  var logic = {
    radio: radio, LEN: LEN, STOP_AT: STOP_AT, STOP_LEN: STOP_LEN, SHORT: SHORT, COPY: COPY, HAIL: HAIL, GAP: GAP,
    RETRY_STOP: RETRY_STOP, RATES: RATES, LEN_MIN: LEN_MIN, LEN_MAX: LEN_MAX, LEN_STEP: LEN_STEP,
    STATIONS: STATIONS, IDS: IDS,
    defaults: defaults, presets: presets, withDefaults: withDefaults, clean: clean, route: route, arrivals: arrivals,
    simulate: simulate, score: score, channelsOf: channelsOf, reasonOf: reasonOf,
    initial: derive, derive: derive
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
