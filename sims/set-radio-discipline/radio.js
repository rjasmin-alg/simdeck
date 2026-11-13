/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-radio-discipline: the shared radio channel, second by second. Radios on one channel carry one voice at a time:
   a radio that hears the channel busy waits (the queue), every waiting radio presses the moment it goes quiet, and two
   transmissions that overlap block each other (doubled: neither is heard). A radio that hears nobody (far off) presses
   whenever it has something to say. A doubled message is repeated only if its sender notices, that is, when no "copy"
   came back (the sender expects one) or for the urgent call (the sender sees nobody react); otherwise it is lost and
   nobody knows. Priority: with a gap rule, ordinary radios wait one quiet second before pressing, so a priority call
   said at once takes the channel first.
   Pure, no strings, knows nothing of a film set: radios, channels, segments, seconds. Registers
   SimdeckModels['radio-channel'] (catalogue §5.25 / models/README.md, "Promotion"). Rules: SPEC.md rules 5–11. */
(function (root) {
  'use strict';

  /**
   * Run the channels for `len` seconds (t = 0 … len − 1).
   * spec = {
   *   len,                                    // seconds
   *   radios: [{ deaf, backoff }],            // in tie-break order; deaf: hears no one (far off); backoff: seconds
   *                                           // before it repeats a doubled segment that got no copy
   *   arrivals: [{ t, radio, tag, segs: [{ ch, len, copy, prio, … }], urgent, first }],  // sorted by t, then given order
   *   gap,                                    // quiet seconds an ordinary segment waits before pressing (0 = none)
   *   retryUrgent                             // seconds before a doubled urgent segment is repeated
   * }
   * A message is its segments, sent in turn by one radio; a radio sends one segment at a time, its messages in order.
   * `first`: the message goes before everything the radio had queued (dropped) and cuts its own transmission on air.
   * When an urgent message is heard, every radio that hears stops: queues dropped, no new messages (the deaf go on).
   * Transmissions that end in the same second are all settled before the silence, whatever their order.
   * Returns { tx: [{ radio, msg, seg, ch, start, end, talk, copy, prio, urgent, doubled, lost, noticed, repeat, cut }],
   *           (noticed: doubled and a repeat was due; repeat: it was really sent again)
   *           msgs: [{ id, radio, tag, t, segs, urgent, done, outcome: 'heard'|'lost'|'dropped'|null, end, tries }],
   *           queue: [radios waiting for 'main', per second], heard: t | null }.
   */
  function run(spec) {
    var L = spec.len, R = spec.radios.length, gap = spec.gap || 0;
    var fifo = [], cur = [];        // per radio: queued messages; the head message's next segment and when it is ready
    for (var r = 0; r < R; r++) { fifo.push([]); cur.push(null); }
    var tx = [], msgs = [], queue = [], heard = null, ai = 0, silent = false;
    var active = [];                // indices into tx with end > t

    function startNext(r, t) {
      var m = fifo[r][0];
      cur[r] = m ? { msg: m, seg: m.done, ready: t } : null;
    }
    function finish(r, t, outcome) {
      var m = fifo[r].shift();
      m.outcome = outcome;
      m.end = t;
      startNext(r, t);
    }
    function silence(t) {
      silent = true;
      for (var r = 0; r < R; r++) {
        if (spec.radios[r].deaf) continue;
        fifo[r].forEach(function (m) { if (!m.outcome) { m.outcome = 'dropped'; m.end = t; } });
        fifo[r] = [];
        cur[r] = null;
      }
    }

    for (var t = 0; t < L; t++) {
      // 1. transmissions that end now: all are settled first, then (if the urgent call was heard) the silence
      var heardNow = false;
      active = active.filter(function (i) {
        var x = tx[i];
        if (x.end !== t) return true;
        var r = x.radio, m = msgs[x.msg];
        if (m.outcome) return false;           // dropped while on air (cannot happen today: silence waits for the end)
        if (x.doubled) {
          if (m.urgent || x.copy > 0) {
            x.noticed = true;                    // a repeat is due; x.repeat is set only when it is really sent
            cur[r] = { msg: m, seg: m.done, ready: t + (m.urgent ? spec.retryUrgent : spec.radios[r].backoff) };
          } else {
            x.lost = true;
            finish(r, t, 'lost');
          }
        } else {
          m.done++;
          if (m.done >= m.segs.length) {
            finish(r, t, 'heard');
            if (m.urgent && heard === null) { heard = t; heardNow = true; }
          } else {
            cur[r] = { msg: m, seg: m.done, ready: t };
          }
        }
        return false;
      });
      if (heardNow) silence(t);
      // 2. arrivals
      while (ai < spec.arrivals.length && spec.arrivals[ai].t === t) {
        var a = spec.arrivals[ai++];
        if (silent && !spec.radios[a.radio].deaf) continue;
        var m = { id: msgs.length, radio: a.radio, tag: a.tag, t: t, segs: a.segs, urgent: !!a.urgent, done: 0, outcome: null, end: null, tries: 0 };
        msgs.push(m);
        var f = fifo[a.radio];
        if (a.first) {
          // the urgent call goes first: what the radio was about to say is dropped; if it is talking, it lets go now
          f.forEach(function (q) { if (!q.outcome) { q.outcome = 'dropped'; q.end = t; } });
          active = active.filter(function (i) {
            var x = tx[i];
            if (x.radio !== a.radio) return true;
            x.end = t; x.cut = true;
            return false;
          });
          fifo[a.radio] = [m];
          cur[a.radio] = { msg: m, seg: 0, ready: t };
        } else {
          f.push(m);
          if (f.length === 1) cur[a.radio] = { msg: m, seg: 0, ready: t };
        }
      }
      // 3. who presses (tie-break: radio order; radios that press in the same second do not hear each other)
      var started = [];
      for (r = 0; r < R; r++) {
        var c = cur[r];
        if (!c || c.ready > t || onAir(r)) continue;
        var seg = c.msg.segs[c.seg];
        if (!spec.radios[r].deaf && !clear(seg.ch, t, seg.prio ? 0 : gap)) continue;
        var x = { radio: r, msg: c.msg.id, seg: c.seg, ch: seg.ch, start: t, end: t + seg.len + (seg.copy || 0),
          talk: seg.len, copy: seg.copy || 0, prio: !!seg.prio, urgent: c.msg.urgent, doubled: false, lost: false, noticed: false,
          repeat: false, cut: false };
        c.msg.tries++;
        for (var j = tx.length - 1; j >= 0; j--) {   // the doubled try this one repeats
          if (tx[j].msg === c.msg.id && tx[j].seg === c.seg) { tx[j].repeat = true; break; }
        }
        started.push(tx.length);
        tx.push(x);
        cur[r] = null;
      }
      // 4. overlaps: a new transmission doubles with everything on air on its channel, and with the others that started now
      started.forEach(function (i) {
        var x = tx[i];
        active.concat(started).forEach(function (j) {
          if (j === i) return;
          var y = tx[j];
          if (y.ch === x.ch && y.start < x.end && x.start < y.end) { x.doubled = true; y.doubled = true; }
        });
      });
      active = active.concat(started);
      // 5. the queue on 'main': radios with a segment ready for main that are not on air
      var q = 0;
      for (r = 0; r < R; r++) {
        var cq = cur[r];
        if (cq && cq.ready <= t && cq.msg.segs[cq.seg].ch === 'main' && !onAir(r)) q++;
      }
      queue.push(q);
    }

    function onAir(r) {
      return active.some(function (i) { return tx[i].radio === r; });
    }
    /** Clear for a radio that hears: nothing on `ch` started before t and still on air at t, nor in the `g` seconds
     *  before t. */
    function clear(ch, t, g) {
      return !tx.some(function (y) { return y.ch === ch && y.start < t && y.end > t - g; });
    }

    return { tx: tx, msgs: msgs, queue: queue, heard: heard };
  }

  var api = { run: run };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {})['radio-channel'] = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
