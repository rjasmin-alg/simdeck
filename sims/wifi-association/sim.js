/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wifi-association: a station (STA) joins the Wi-Fi network Grafo. Two access points carry Grafo (AP1 on
   channel 6, AP2 on channel 11), a third carries Kafic (AP3 on channel 1). One step is one frame exchange or one
   decision: scan (Probe Request and the responses, or Beacons one channel at a time) → choose an AP → Authentication
   (Open System, or SAE Commit and Confirm) → Association Request → Association Response → (WPA: the 4-way handshake,
   one collapsed step) → data. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. */
(function (root) {
  'use strict';

  var WANT = 'Grafo';          // the network the station is told to join (the user picked it, or it is saved)
  var OK = 0;                  // IEEE 802.11-2020 §9.4.1.9: status 0 = success
  var REFUSED = 17;            // status 17: the AP cannot take more associated stations (check)

  /** The access points in range. `sec: null` takes the `security` param (the Grafo network); Kafic is open.
      `aid` is the association ID each AP would give this station (others are associated already). */
  var APS = [
    { id: 'AP1', bssid: '02:1a:2b:3c:4d:01', ssid: 'Grafo', ch: 6, rssi: -45, sec: null, aid: 4 },
    { id: 'AP2', bssid: '02:1a:2b:3c:4d:02', ssid: 'Grafo', ch: 11, rssi: -70, sec: null, aid: 2 },
    { id: 'AP3', bssid: '02:7e:55:90:00:03', ssid: 'Kafic', ch: 1, rssi: -55, sec: 'open', aid: 7 }
  ];
  /** Scan order: channel by channel, lowest first (1, 6, 11): AP3, AP1, AP2. */
  var SCAN = APS.slice().sort(function (a, b) { return a.ch - b.ch || (a.id < b.id ? -1 : 1); });

  /** The station's ladder towards its chosen AP (the 802.11 states 1–4, then data). */
  var LADDER = ['none', 'auth', 'assoc', 'keys', 'data'];

  function apOf(id) { return APS.filter(function (a) { return a.id === id; })[0]; }
  function secOf(ap, p) { return ap.sec || p.security; }
  function copy(s) { return JSON.parse(JSON.stringify(s)); }

  /** Rule 2: the station chooses, among the APs it heard that carry the wanted SSID and have not refused it, the one
      with the strongest signal; equal signals: the one heard first. null when none is left. */
  function choose(heard, ssid, refused) {
    var best = null;
    heard.forEach(function (h) {
      if (h.ssid !== ssid || (refused || []).indexOf(h.ap) >= 0) return;
      if (!best || h.rssi > best.rssi) best = h;   // strict >: the earlier-heard wins a tie
    });
    return best ? best.ap : null;
  }

  /** Rule 6: data frames pass only once associated, and on a WPA network only once the handshake installed keys. */
  function dataAllowed(sec, pair) { return pair >= 3 && (sec === 'open' || pair >= 4); }

  /** The steps of a run, in order (each one action). The second attempt after a refusal needs no choose step: the
      refusal itself turns the station to the next AP. */
  function plan(p) {
    var out = p.scan === 'passive' ? SCAN.map(function (a) { return 'beacon:' + a.id; }) : ['probe', 'responses'];
    out.push('choose');
    var tries = p.reject ? 2 : 1;
    for (var i = 0; i < tries; i++) {
      if (p.security === 'wpa3') out.push('sae-commit', 'sae-confirm');
      else out.push('auth');
      out.push('assoc-req', 'assoc-resp');
    }
    if (p.security !== 'open') out.push('keys');
    out.push('data');
    return out;
  }

  // ── what each action does ──

  function hear(s, ap, via, p) {
    s.heard.push({ ap: ap.id, bssid: ap.bssid, ssid: ap.ssid, ch: ap.ch, rssi: ap.rssi, sec: secOf(ap, p), via: via });
  }
  function frame(s, f) { s.frames.push(f); return f; }
  function ladder(s) {
    var k = s.chosen ? s.pair[s.chosen] : 1;
    s.staState = s.dataOn ? 'data' : LADDER[k - 1];
  }

  var ACT = {
    probe: function (s) {
      // one Probe Request on each channel in turn, to anyone listening there (broadcast)
      frame(s, { type: 'probe-req', from: 'STA', to: SCAN.map(function (a) { return a.id; }), ch: SCAN.map(function (a) { return a.ch; }) });
      s.ev = { kind: 'probe' };
    },
    responses: function (s, p) {
      // rule 2: every AP that heard the probe answers, on its own channel
      SCAN.forEach(function (a) {
        frame(s, { type: 'probe-resp', from: a.id, to: 'STA', ch: a.ch, ssid: a.ssid });
        hear(s, a, 'probe', p);
      });
      s.ev = { kind: 'responses', count: SCAN.length };
    },
    beacon: function (s, p, id) {
      var a = apOf(id);
      frame(s, { type: 'beacon', from: a.id, to: 'STA', ch: a.ch, ssid: a.ssid });
      hear(s, a, 'beacon', p);
      s.ev = { kind: 'beacon', ap: a.id, last: s.heard.length === SCAN.length };
    },
    choose: function (s) {
      s.chosen = choose(s.heard, WANT, s.refused);
      s.ev = { kind: 'choose', ap: s.chosen };
    },
    auth: function (s) {
      // Open System: two Authentication frames; the AP lets any client in (rule 4)
      var a = apOf(s.chosen);
      frame(s, { type: 'auth', alg: 'open', seq: 1, from: 'STA', to: a.id, ch: a.ch });
      frame(s, { type: 'auth', alg: 'open', seq: 2, from: a.id, to: 'STA', ch: a.ch, status: OK });
      s.pair[a.id] = 2;
      s.ev = { kind: 'auth', ap: a.id };
    },
    'sae-commit': function (s) {
      // WPA3-Personal: SAE runs in the Authentication frames, Commit each way, then Confirm each way (rule 4)
      var a = apOf(s.chosen);
      frame(s, { type: 'auth', alg: 'sae', seq: 1, from: 'STA', to: a.id, ch: a.ch });
      frame(s, { type: 'auth', alg: 'sae', seq: 1, from: a.id, to: 'STA', ch: a.ch, status: OK });
      s.ev = { kind: 'sae-commit', ap: a.id };
    },
    'sae-confirm': function (s) {
      var a = apOf(s.chosen);
      frame(s, { type: 'auth', alg: 'sae', seq: 2, from: 'STA', to: a.id, ch: a.ch });
      frame(s, { type: 'auth', alg: 'sae', seq: 2, from: a.id, to: 'STA', ch: a.ch, status: OK });
      s.pair[a.id] = 2;
      s.ev = { kind: 'sae-confirm', ap: a.id };
    },
    'assoc-req': function (s) {
      var a = apOf(s.chosen);
      // rule 3: authentication always comes first
      if (s.pair[a.id] < 2) throw new Error('association before authentication');
      frame(s, { type: 'assoc-req', from: 'STA', to: a.id, ch: a.ch, ssid: a.ssid });
      s.ev = { kind: 'assoc-req', ap: a.id };
    },
    'assoc-resp': function (s, p) {
      var a = apOf(s.chosen);
      // rule 5: with `reject`, the first AP the station asks refuses; the next one accepts
      if (p.reject && s.refused.length === 0) {
        frame(s, { type: 'assoc-resp', from: a.id, to: 'STA', ch: a.ch, status: REFUSED });
        s.status = REFUSED;
        s.refused.push(a.id);
        s.chosen = choose(s.heard, WANT, s.refused);
        s.ev = { kind: 'refused', ap: a.id, next: s.chosen };
        return;
      }
      frame(s, { type: 'assoc-resp', from: a.id, to: 'STA', ch: a.ch, status: OK, aid: a.aid });
      frame(s, { type: 'ds', at: a.id });   // the AP tells the distribution system the station is here (a note)
      s.status = OK;
      s.aid = a.aid;
      s.pair[a.id] = 3;
      s.ev = { kind: 'assoc', ap: a.id, aid: a.aid };
    },
    keys: function (s) {
      var a = apOf(s.chosen);
      frame(s, { type: 'hs', from: a.id, to: 'STA', ch: a.ch });
      s.pair[a.id] = 4;
      s.ev = { kind: 'keys', ap: a.id };
    },
    data: function (s, p) {
      var a = apOf(s.chosen);
      if (!dataAllowed(secOf(a, p), s.pair[a.id])) throw new Error('data before the station may send');
      frame(s, { type: 'data', from: 'STA', to: a.id, ch: a.ch, enc: secOf(a, p) !== 'open' });
      s.dataOn = true;
      s.ev = { kind: 'data', ap: a.id, enc: secOf(a, p) !== 'open' };
    }
  };

  var logic = {
    WANT: WANT, OK: OK, REFUSED: REFUSED, APS: APS, SCAN: SCAN, LADDER: LADDER,
    apOf: apOf, choose: choose, dataAllowed: dataAllowed, plan: plan,

    defaults: { scan: 'active', security: 'wpa2', reject: false },

    steps: function (p) { return plan(p).length; },

    initial: function (p) {
      return {
        n: 0, phase: 'start', ev: { kind: 'start' }, done: false,
        scanMode: p.scan, security: p.security,
        heard: [], chosen: null, refused: [],
        pair: { AP1: 1, AP2: 1, AP3: 1 },     // the 802.11 state of the station with each AP (1 = not authenticated)
        staState: 'none', dataOn: false,
        frames: [], aid: null, status: null
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      var all = plan(p);
      s.n = n;
      var act = all[n - 1];
      if (!act) { s.ev = { kind: 'idle' }; s.done = true; return s; }
      var parts = act.split(':');
      s.phase = parts[0];
      ACT[parts[0]](s, p, parts[1]);
      ladder(s);
      s.done = n === all.length;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
