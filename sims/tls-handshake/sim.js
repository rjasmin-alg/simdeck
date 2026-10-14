/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for tls-handshake: the TLS 1.2 and TLS 1.3 full handshakes side by side, one flight per step in lockstep,
   after the TCP handshake; or a client that offers only TLS 1.1 (a local error, or the server's alert 70).
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers; the state is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Message flags: enc (encrypted on the wire), share (carries a key share, public half), cert (the certificate),
      app (application data), alert. reads: what a passive observer reads of it (item codes). */
  function m(name, o) {
    o = o || {};
    return { name: name, enc: !!o.enc, share: !!o.share, cert: !!o.cert, app: !!o.app, alert: o.alert || null,
      reads: o.reads || [] };
  }

  /** TCP's handshake: SYN and SYN+ACK, one round trip (rule 1). The ACK leaves with the ClientHello. */
  var TCP = [
    { from: 'C', msgs: [m('SYN', { reads: ['tcp'] })] },
    { from: 'S', msgs: [m('SYN, ACK', { reads: ['tcp'] })] }
  ];

  /** The TLS flights after TCP, per version (rules 3 and 4). */
  var FLIGHTS = {
    '1.2': [
      { from: 'C', msgs: [m('ClientHello', { reads: ['sni', 'versions', 'suites'] })] },
      { from: 'S', msgs: [m('ServerHello', { reads: ['version', 'suite'] }), m('Certificate', { cert: true, reads: ['cert'] }),
        m('ServerKeyExchange', { share: true, reads: ['shareS'] }), m('ServerHelloDone')] },
      { from: 'C', msgs: [m('ClientKeyExchange', { share: true, reads: ['shareC'] }), m('ChangeCipherSpec'), m('Finished', { enc: true })] },
      { from: 'S', msgs: [m('ChangeCipherSpec'), m('Finished', { enc: true })] },
      { from: 'C', msgs: [m('data', { enc: true, app: true })] }
    ],
    '1.3': [
      { from: 'C', msgs: [m('ClientHello', { share: true, reads: ['sni', 'versions', 'suites', 'shareC'] })] },
      { from: 'S', msgs: [m('ServerHello', { share: true, reads: ['version', 'suite', 'shareS'] }),
        m('EncryptedExtensions', { enc: true }), m('Certificate', { enc: true, cert: true }),
        m('CertificateVerify', { enc: true }), m('Finished', { enc: true })] },
      { from: 'C', msgs: [m('Finished', { enc: true }), m('data', { enc: true, app: true })] }
    ],
    // a client that offers only TLS 1.1, allowed by its policy: the server answers with alert 70 (rule 6). The alert is
    // scripted, not negotiated from SERVER_ACCEPTS (which the page only shows): the model does no version negotiation.
    'old-allowed': [
      { from: 'C', msgs: [m('ClientHello', { reads: ['sni', 'versions', 'suites'] })] },
      { from: 'S', msgs: [m('Alert', { alert: 'protocol_version', reads: ['alert'] })] }
    ],
    // a client whose policy forbids the only version it wants: nothing TLS is sent (rule 6)
    'old-forbidden': []
  };

  /** Negotiated cipher suites as the book prints them (UL ch21, "Šire o temi"). */
  var SUITES = { '1.2': 'ECDHE-RSA-AES256-GCM-SHA384', '1.3': 'TLS_AES_256_GCM_SHA384' };
  var ALERT_CODE = { protocol_version: 70 };
  /** Versions the server accepts: TLS 1.0 and 1.1 are deprecated (RFC 8996). */
  var SERVER_ACCEPTS = ['1.2', '1.3'];

  function other(side) { return side === 'C' ? 'S' : 'C'; }

  /** One flight's messages grouped into chart rows: consecutive messages with the same protection share a row, at most
      two per row; application data always has its own row. Returns the row index (within the flight) per message. */
  function rowsOf(msgs) {
    var out = [], row = -1, n = 0, prev = null;
    msgs.forEach(function (x) {
      if (!prev || prev.enc !== x.enc || n === 2 || x.app || prev.app) { row += 1; n = 0; }
      out.push(row);
      n += 1;
      prev = x;
    });
    return out;
  }

  /** All flights of a column, TCP first. */
  function script(key) { return TCP.concat(FLIGHTS[key]); }

  /** Steps of a column: TCP is one step (two flights), then one step per flight; a local failure adds one step. */
  function columnSteps(key) { return 1 + FLIGHTS[key].length + (key === 'old-forbidden' ? 1 : 0); }

  function mode(p) { return p.clientOffers === 'modern' ? 'compare' : 'fail'; }

  function newColumn(key, v) {
    return { key: key, v: v, i: 0, msgs: [], rtt: 0, keysAt: { C: null, S: null }, appDataAt: null,
      done: false, waiting: false, failed: null, read: [], suite: null };
  }

  /** Draw step n of one column (n = 1 is TCP). Returns a new column; a finished column only waits. */
  function stepColumn(col, n) {
    var c = JSON.parse(JSON.stringify(col));
    var total = columnSteps(c.key);
    if (c.done) { c.waiting = true; return c; }
    var all = script(c.key);
    // step 1: SYN (half 0) and SYN+ACK (half 1); step n > 1: TLS flight n - 1, which leaves after n one-way trips
    var flights = n === 1 ? [{ f: all[0], half: 0, k: 0 }, { f: all[1], half: 1, k: 1 }]
      : n < all.length ? [{ f: all[n], half: n, k: n }] : [];
    flights.forEach(function (x) {
      var rows = rowsOf(x.f.msgs);
      x.f.msgs.forEach(function (msg, j) {
        var out = Object.assign({}, msg, { step: n, flight: x.k, from: x.f.from, to: other(x.f.from), half: x.half, row: rows[j],
          tcp: n === 1 });
        // a side holds the keys from the step in which the other side's key share reaches it (rule 2)
        if (msg.share && c.keysAt[out.to] == null) c.keysAt[out.to] = n;
        if (msg.app && c.appDataAt == null) c.appDataAt = x.half / 2;
        if (msg.alert) c.failed = msg.alert;
        msg.reads.forEach(function (it) { if (c.read.indexOf(it) < 0) c.read.push(it); });
        if (msg.reads.indexOf('suite') >= 0) c.suite = SUITES[c.v] || null;
        c.msgs.push(out);
      });
      c.rtt = (x.half + 1) / 2;   // when the last flight drawn arrives (the page's "last flight arrives")
    });
    if (c.key === 'old-forbidden' && n === 2) c.failed = 'no_protocols_local';
    c.i = n;
    if (n >= total) c.done = true;
    return c;
  }

  var logic = {
    defaults: { rttMs: 50, clientOffers: 'modern', attackerView: true, suites: false },

    /** 6 side by side (1.2 runs longest), 3 with the alert, 2 with the local error (SPEC.md, Steps). */
    steps: function (p) {
      if (p.clientOffers === 'old-allowed') return columnSteps('old-allowed');
      if (p.clientOffers === 'old-forbidden') return columnSteps('old-forbidden');
      return Math.max(columnSteps('1.2'), columnSteps('1.3'));
    },

    initial: function (p) {
      var md = mode(p);
      var s = { mode: md, rttMs: p.rttMs, wanted: md === 'compare' ? ['1.2', '1.3'] : ['1.1'], offered: [], failure: null,
        last: 0 };
      s.offered = p.clientOffers === 'old-forbidden' ? [] : s.wanted.slice();
      if (md === 'compare') { s.v12 = newColumn('1.2', '1.2'); s.v13 = newColumn('1.3', '1.3'); }
      else s.att = newColumn(p.clientOffers, '1.1');
      return s;
    },

    step: function (s, n, p) {
      var out = JSON.parse(JSON.stringify(s));
      out.last = n;
      out.rttMs = p.rttMs;
      if (out.mode === 'compare') {
        out.v12 = stepColumn(s.v12, n);
        out.v13 = stepColumn(s.v13, n);
      } else {
        out.att = stepColumn(s.att, n);
        out.failure = out.att.failed;
      }
      return out;
    },

    /** Milliseconds of a time in halves of a round trip. */
    msOf: function (half, rttMs) { return half * rttMs / 2; },

    rowsOf: rowsOf,
    TCP: TCP,
    FLIGHTS: FLIGHTS,
    SUITES: SUITES,
    ALERT_CODE: ALERT_CODE,
    SERVER_ACCEPTS: SERVER_ACCEPTS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
