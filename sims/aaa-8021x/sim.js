/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for aaa-8021x: a laptop (supplicant) plugs into a switch port or associates with an access point
   (authenticator); EAP runs over EAPOL to the switch and inside RADIUS to the server; the port opens only after the
   server accepts. Rules and sources: SPEC.md (rule numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var USER = 'ana@fakultet';
  var VLAN = 20;
  var UDP_AUTH = 1812;      // rule 3 [R]
  var UDP_ACCT = 1813;      // rule 3 [RA]
  /** Rule 4 [RV]: the VLAN attributes of Access-Accept. */
  var VLAN_ATTRS = [
    { name: 'Tunnel-Type', value: 'VLAN (13)' },
    { name: 'Tunnel-Medium-Type', value: '802 (6)' },
    { name: 'Tunnel-Private-Group-ID', value: String(VLAN) }
  ];

  /** Folded method rounds (SPEC, Simplifications): what the server asks and what the laptop answers. `check` is the
      round in which the server checks the proof; wrong credentials fail there. */
  var METHODS = {
    peap: { rounds: [['peapStart', 'tlsHello'], ['serverCert', 'keyFinished'], ['innerChallenge', 'innerProof'], ['innerResult', 'ack']], check: 3 },
    tls: { rounds: [['tlsStart', 'tlsHello'], ['serverCertReq', 'clientCert'], ['serverFinished', 'ack']], check: 2 }
  };

  /** Rule 1: what the port lets through. EAPOL always (uncontrolled port); everything else only when authorized. */
  function passes(port, proto) { return proto === 'EAPOL' || port === 'authorized'; }

  /** The step kinds of a run (SPEC, Steps). */
  function script(p) {
    var out = ['link', 'dhcpDrop', 'reqId', 'respId', 'accessReq'];
    if (!p.server) return out.concat(['retry', 'timeout']);
    var m = METHODS[p.method] || METHODS.peap;
    var last = p.credentials === 'wrong' ? m.check : m.rounds.length;
    for (var r = 1; r <= last; r++) out.push('round' + r);
    if (p.credentials === 'wrong') return out.concat(['reject', 'failure', 'dhcpDrop']);
    return out.concat(['accept', 'success', p.medium === 'wifi' ? 'handshake' : 'portUp', 'dhcpPass', 'acct']);
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function msg(step, from, to, proto, name, extra) {
    var m = { step: step, from: from, to: to, proto: proto, name: name, eap: null, round: null,
      udp: proto === 'RADIUS' ? UDP_AUTH : null, attrs: [], dropped: false, lost: false, retry: false, verdict: null };
    Object.keys(extra || {}).forEach(function (k) { m[k] = extra[k]; });
    return m;
  }

  /** Sends a frame from the laptop through the port (rule 1): dropped unless it passes. */
  function fromLaptop(s, step, proto, name, extra) {
    var m = msg(step, 'STA', 'SW', proto, name, extra);
    m.dropped = !passes(s.port, proto);
    return m;
  }

  function mark(s, key, step, ok) { s.aaa[key] = { step: step, ok: ok }; s.changed.push('aaa.' + key); }

  function apply(prev, kind, n, p) {
    var s = clone(prev), m = METHODS[p.method] || METHODS.peap;
    s.phase = kind;
    s.last = { did: kind, step: n };
    s.changed = [];
    function send(x) { s.msgs.push(x); }
    var round = /^round(\d)$/.exec(kind);
    if (round) {                                                       // rules 2, 6: one folded round
      var r = +round[1], q = m.rounds[r - 1];
      var fails = p.credentials === 'wrong' && r === m.check;
      send(msg(n, 'AS', 'SW', 'RADIUS', 'Access-Challenge', { eap: 'Request', round: q[0] }));
      send(msg(n, 'SW', 'STA', 'EAPOL', 'EAP-Request', { eap: 'Request', round: q[0] }));
      send(fromLaptop(s, n, 'EAPOL', 'EAP-Response', { eap: 'Response', round: q[1] }));
      send(msg(n, 'SW', 'AS', 'RADIUS', 'Access-Request', { eap: 'Response', round: q[1],
        verdict: r === m.check ? (fails ? 'wrong' : 'ok') : null }));
      if (r === m.check) mark(s, 'authenticated', n, !fails);
      return s;
    }
    switch (kind) {
      case 'link':                                                     // rule 1: up, unauthorized
        s.notes.push({ step: n, lane: 'SW', what: p.medium === 'wifi' ? 'associated' : 'linkUp' });
        s.changed.push('port');
        break;
      case 'dhcpDrop':                                                 // rules 1, 5
        send(fromLaptop(s, n, 'DHCP', 'DHCPDISCOVER'));
        break;
      case 'reqId':
        send(msg(n, 'SW', 'STA', 'EAPOL', 'EAP-Request', { eap: 'Request', round: 'identity' }));
        break;
      case 'respId':                                                   // rule 6: identification
        send(fromLaptop(s, n, 'EAPOL', 'EAP-Response', { eap: 'Response', round: 'identity' }));
        mark(s, 'identified', n, true);
        break;
      case 'accessReq':                                                // rule 2: repacked, not checked
      case 'retry':                                                    // rule 8: once more, no reply
        send(msg(n, 'SW', 'AS', 'RADIUS', 'Access-Request', { eap: 'Response', round: 'identity', lost: !p.server, retry: kind === 'retry' }));
        break;
      case 'timeout':                                                  // rule 8
        s.notes.push({ step: n, lane: 'SW', what: 'noReply' });
        s.outcome = 'noReply';
        break;
      case 'accept': {                                                 // rules 4, 6, 7: access control
        var attrs = VLAN_ATTRS.slice();
        if (p.medium === 'wifi') attrs.push({ name: 'PMK', value: 'protected' });
        send(msg(n, 'AS', 'SW', 'RADIUS', 'Access-Accept', { eap: 'Success', attrs: attrs }));
        mark(s, 'authorized', n, true);
        break;
      }
      case 'reject':                                                   // rule 5
        send(msg(n, 'AS', 'SW', 'RADIUS', 'Access-Reject', { eap: 'Failure' }));
        mark(s, 'authorized', n, false);
        break;
      case 'success':
        send(msg(n, 'SW', 'STA', 'EAPOL', 'EAP-Success', { eap: 'Success' }));
        break;
      case 'failure':                                                  // rule 5: port stays closed
        send(msg(n, 'SW', 'STA', 'EAPOL', 'EAP-Failure', { eap: 'Failure' }));
        s.outcome = 'rejected';
        break;
      case 'handshake':                                                // rule 7: EAPOL-Key, passes the closed port
        send(msg(n, 'SW', 'STA', 'EAPOL', '4-way handshake'));
        /* falls through: the handshake opens the port */
      case 'portUp':                                                   // rules 1, 4
        s.port = 'authorized';
        s.vlan = VLAN;
        s.outcome = 'authorized';
        s.notes.push({ step: n, lane: 'SW', what: 'portUp' });
        s.changed.push('port', 'vlan');
        break;
      case 'dhcpPass':                                                 // rule 1: now it passes
        send(fromLaptop(s, n, 'DHCP', 'DHCPDISCOVER'));
        break;
      case 'acct':                                                     // rules 3, 6: audit
        send(msg(n, 'SW', 'AS', 'RADIUS', 'Accounting-Request', { udp: UDP_ACCT, attrs: [{ name: 'Acct-Status-Type', value: 'Start' }] }));
        send(msg(n, 'AS', 'SW', 'RADIUS', 'Accounting-Response', { udp: UDP_ACCT }));
        mark(s, 'accounted', n, true);
        break;
      default:
        throw new Error('unknown step ' + kind);
    }
    return s;
  }

  var logic = {
    USER: USER, VLAN: VLAN, UDP_AUTH: UDP_AUTH, UDP_ACCT: UDP_ACCT, VLAN_ATTRS: VLAN_ATTRS, METHODS: METHODS,

    defaults: { medium: 'wired', credentials: 'correct', server: true, method: 'peap' },

    script: script,
    passes: passes,

    /** 14 for the defaults (SPEC, Steps). */
    steps: function (p) { return script(p).length; },

    initial: function (p) {
      return {
        medium: p.medium, method: p.method, credentials: p.credentials, server: !!p.server,
        phase: null, port: 'unauthorized', vlan: null, msgs: [], notes: [],
        aaa: { identified: null, authenticated: null, authorized: null, accounted: null },
        outcome: null, last: null, changed: []
      };
    },

    step: function (s, n, p) { return apply(s, script(p)[n - 1], n, p); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
