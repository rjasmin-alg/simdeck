/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wireguard: two peers, a 1-RTT handshake, cryptokey routing (AllowedIPs as routing table and inbound
   filter) and roaming (the endpoint learned from the latest authenticated packet). Rules and numbers: SPEC.md.
   No real cryptography: keys are fixed strings, "authenticated" means the packet carries the session key the
   receiver holds for that peer.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words live in strings.js. */
(function (root) {
  'use strict';

  var PORT = 51820;
  // Placeholder public keys: base64 of SHA-256("simdeck-wireguard-<id>"), shaped like real ones (SPEC.md).
  var KEYS = {
    A: 'JHP7uraphZAA6lCMG/DQ9FF/CdBERK0eR96dGH/cNOk=',
    B: 'fZ0fPf+eI19cOHppOlxm+9U2LvvD24xKJndBpsXx6rQ=',
    C: 'ZNWC2nEajZRorl9XRj73PmtJ7N1/V9/U9Laaj4oADDM='
  };
  var SCENE = {
    A: { tunnelIP: '10.0.0.1', endpoint: '198.51.100.10:41414', roamTo: '203.0.113.77:53001', lanHost: '192.168.1.20' },
    B: { tunnelIP: '10.0.0.2', endpoint: '192.0.2.1:' + PORT },
    C: { endpoint: '203.0.113.5:' + PORT }
  };
  var INNER_DSTS = ['10.0.0.2', '192.168.2.10', '10.0.0.3', '198.51.100.7'];
  var STEPS = { handshake: 4, send: 7, roam: 9 };
  var PHASES = ['configure', 'initiation', 'response', 'keys', 'lookup', 'send', 'check', 'roam', 'learn'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── addresses and prefixes ──

  function ipToInt(ip) {
    return ip.split('.').reduce(function (acc, o) { return acc * 256 + Number(o); }, 0);
  }
  function parsePrefix(prefix) {
    var parts = prefix.split('/');
    return { net: ipToInt(parts[0]), len: Number(parts[1]) };
  }
  /** Whether ip lies in prefix (a.b.c.d/len). Arithmetic, not bit operators, so /0 … /32 stay unsigned. */
  function inPrefix(ip, prefix) {
    var p = parsePrefix(prefix), size = Math.pow(2, 32 - p.len);
    return Math.floor(ipToInt(ip) / size) === Math.floor(p.net / size);
  }

  /** The cryptokey routing table from a peer list, in config order. A prefix given to a later peer moves to it
      (rule 3, second tie-break): the earlier owner's row goes. */
  function buildTable(peers) {
    var rows = [];
    peers.forEach(function (p) {
      p.allowedIPs.forEach(function (prefix) {
        rows = rows.filter(function (r) { return r.prefix !== prefix; });
        rows.push({ prefix: prefix, peer: p.peer, len: parsePrefix(prefix).len });
      });
    });
    return rows;
  }

  /** Longest prefix match (rule 3, tie-break): hits per row, and the winning row's index (−1: no peer).
      Equal lengths cannot both match unless the prefixes are equal, which buildTable rules out; the earlier wins. */
  function lookup(table, ip) {
    var hits = table.map(function (r) { return inPrefix(ip, r.prefix); });
    var win = -1;
    hits.forEach(function (hit, i) { if (hit && (win < 0 || table[i].len > table[win].len)) win = i; });
    return { ip: ip, hits: hits, win: win, peer: win < 0 ? null : table[win].peer };
  }

  /** Rule 1: the initiator is whoever owns the static public key in the Initiation; an unknown key is nobody. */
  function identify(peers, pub) {
    for (var i = 0; i < peers.length; i++) if (peers[i].pub === pub) return peers[i].peer;
    return null;
  }

  function peerOf(node, id) {
    for (var i = 0; i < node.peers.length; i++) if (node.peers[i].peer === id) return node.peers[i];
    return null;
  }

  /** A transport-data packet arriving at node (rules 3, 4, 5). Authenticated = it decrypts with the session key
      node holds for the sender. Then, in this order: the sender's endpoint := the outer source (rule 4); the inner
      source must route back to the sender in node's own table (rule 3). Never a reply (rule 5).
      Returns { authenticated, from, endpoint, check, delivered, dropReason, reply }. */
  function receiveData(node, table, pkt) {
    var from = pkt.from, peer = peerOf(node, from);
    var ok = !!(peer && node.session && pkt.key === node.session.recv);
    if (!ok) return { authenticated: false, from: from, endpoint: peer ? peer.endpoint : null, check: null,
      delivered: false, dropReason: 'unauthenticated', reply: null };
    var check = lookup(table, pkt.innerSrc);
    check.ok = check.peer === from;
    return { authenticated: true, from: from, endpoint: pkt.outerSrc, check: check, delivered: check.ok,
      dropReason: check.ok ? null : 'allowedIPs', reply: null };
  }

  function node(id) {
    return { id: id, staticPub: KEYS[id], tunnelIP: SCENE[id].tunnelIP, endpoint: SCENE[id].endpoint,
      configured: false, peers: [], session: null };
  }

  function norm(p) {
    return {
      action: STEPS[p.action] ? p.action : 'handshake',
      innerDst: INNER_DSTS.indexOf(p.innerDst) >= 0 ? p.innerDst : INNER_DSTS[0],
      allowedOk: p.allowedOk !== false,
      endpointKnown: p.endpointKnown !== false
    };
  }

  var logic = {
    PORT: PORT,
    KEYS: KEYS,
    SCENE: SCENE,
    INNER_DSTS: INNER_DSTS,
    PHASES: PHASES,
    STEPS: STEPS,

    defaults: { action: 'handshake', innerDst: '10.0.0.2', allowedOk: true, endpointKnown: true },

    /** handshake 4, send 7, roam 9 (SPEC.md "Steps"). */
    steps: function (p) { return STEPS[norm(p).action]; },
    norm: norm,

    initial: function () {
      return {
        phase: 'start',
        a: node('A'),
        b: node('B'),
        handshake: { init: false, from: null, resp: false, established: false, sessionKeys: null, ephemeral: { A: null, B: null } },
        routing: [],
        routingB: [],
        lookup: null,
        check: null,
        packet: null,
        roamed: false,
        lastSeenEndpoint: null,
        rows: [],
        changed: []
      };
    },

    step: function (prev, n, params) {
      var s = clone(prev);
      var q = norm(params);
      var phase = PHASES[n - 1];
      var A = s.a, B = s.b, H = s.handshake;
      var innerSrc = q.allowedOk ? SCENE.A.tunnelIP : SCENE.A.lanHost;
      s.phase = phase;
      s.changed = [];
      function row(r) { r.step = n; s.rows.push(r); }

      /** A sends one transport-data packet with counter c (steps 6 and 9): rule 3 outbound, rule 6. */
      function send(c) {
        var lk = s.lookup;
        var pkt = { kind: 'data', where: 'wire', innerSrc: innerSrc, innerDst: q.innerDst, outerSrc: A.endpoint,
          outerDst: null, peer: lk.peer, counter: c, delivered: false, dropReason: null };
        var bPeer = peerOf(A, 'B');
        if (lk.peer === null) pkt.dropReason = 'noPeer';
        else if (lk.peer !== 'B') pkt.dropReason = 'otherPeer';
        else if (!bPeer.endpoint || !A.session) pkt.dropReason = 'noEndpoint';
        else pkt.outerDst = bPeer.endpoint;
        if (pkt.dropReason) { pkt.where = 'atA'; pkt.outerSrc = null; }
        s.packet = pkt;
        s.changed.push('packet');
        if (pkt.dropReason) row({ kind: 'note', lane: 'A', what: pkt.dropReason, peer: lk.peer });
        else row({ kind: 'msg', from: 'A', to: 'B', msg: 'data', lock: true, counter: c, outerSrc: pkt.outerSrc });
        return pkt;
      }
      /** B receives what A sent (steps 7 and 9). Returns false when nothing reached B. */
      function arrive(pkt, n7) {
        if (pkt.dropReason) return false;
        var res = receiveData(B, s.routingB, { from: 'A', key: H.sessionKeys.ab, innerSrc: pkt.innerSrc, outerSrc: pkt.outerSrc });
        var pa = peerOf(B, 'A');
        if (res.authenticated && pa.endpoint !== res.endpoint) {
          pa.endpoint = res.endpoint;
          s.lastSeenEndpoint = res.endpoint;
          s.changed.push('b.endpointA');
        }
        s.check = res.check;
        if (s.changed.indexOf('packet') < 0) s.changed.push('packet');
        s.changed.push('tableB');
        s.packet = clone(pkt);
        s.packet.where = n7 ? 'atB' : 'wire';
        s.packet.delivered = res.delivered;
        s.packet.dropReason = res.dropReason;
        return res;
      }

      switch (phase) {
        case 'configure':   // 1. out of band: each side gets the other's public key and AllowedIPs (rule 1); nothing sent (rule 5)
          A.peers = [
            { peer: 'B', pub: KEYS.B, allowedIPs: ['10.0.0.2/32', '192.168.2.0/24'], endpoint: q.endpointKnown ? SCENE.B.endpoint : null },
            { peer: 'C', pub: KEYS.C, allowedIPs: ['10.0.0.0/24'], endpoint: SCENE.C.endpoint }
          ];
          B.peers = [{ peer: 'A', pub: KEYS.A, allowedIPs: ['10.0.0.1/32'], endpoint: null }];
          A.configured = B.configured = true;
          s.routing = buildTable(A.peers);
          s.routingB = buildTable(B.peers);
          s.changed.push('a.peers', 'b.peers', 'tableA', 'tableB');
          break;

        case 'initiation':  // 2. A → B: ephemeral in clear, A's static key encrypted to B's (rules 1, 2); B stores A's endpoint (rule 4)
          var bEnd = peerOf(A, 'B').endpoint;
          if (!bEnd) {
            row({ kind: 'note', lane: 'A', what: 'noEndpoint' });
            s.packet = null;
            break;
          }
          H.init = true;
          H.ephemeral.A = 'eA';
          s.packet = { kind: 'init', where: 'wire', innerSrc: null, innerDst: null, outerSrc: A.endpoint, outerDst: bEnd,
            peer: 'B', counter: null, delivered: true, dropReason: null, staticPub: A.staticPub };
          var who = identify(B.peers, A.staticPub);
          H.from = who;
          if (who === 'A') {
            peerOf(B, 'A').endpoint = A.endpoint;
            s.lastSeenEndpoint = A.endpoint;
            s.changed.push('b.endpointA');
          }
          row({ kind: 'msg', from: 'A', to: 'B', msg: 'init', recognised: who });
          s.changed.push('packet');
          break;

        case 'response':    // 3. B → A, to the endpoint it just learned (rule 2); an unknown key gets nothing (rules 1, 5)
          if (!H.init || H.from !== 'A') break;
          H.resp = true;
          H.ephemeral.B = 'eB';
          s.packet = { kind: 'resp', where: 'wire', innerSrc: null, innerDst: null, outerSrc: B.endpoint,
            outerDst: peerOf(B, 'A').endpoint, peer: 'A', counter: null, delivered: true, dropReason: null };
          row({ kind: 'msg', from: 'B', to: 'A', msg: 'resp' });
          s.changed.push('packet');
          break;

        case 'keys':        // 4. both derive the same pair of session keys: 1-RTT (rule 2)
          if (!H.resp) break;
          H.established = true;
          H.sessionKeys = { ab: 'k1', ba: 'k2' };
          A.session = { send: 'k1', recv: 'k2' };
          B.session = { send: 'k2', recv: 'k1' };
          row({ kind: 'note', lane: 'A', what: 'keys' });
          row({ kind: 'note', lane: 'B', what: 'keys' });
          s.changed.push('a.session', 'b.session');
          break;

        case 'lookup':      // 5. the inner destination in A's table, most specific prefix wins (rule 3)
          s.lookup = lookup(s.routing, q.innerDst);
          s.packet = { kind: 'data', where: 'atA', innerSrc: innerSrc, innerDst: q.innerDst, outerSrc: null, outerDst: null,
            peer: s.lookup.peer, counter: 0, delivered: false, dropReason: null };
          row({ kind: 'note', lane: 'A', what: 'lookup', ip: q.innerDst, peer: s.lookup.peer });
          s.changed.push('tableA', 'packet');
          break;

        case 'send':        // 6. encrypted with the session key, in UDP to B's endpoint (rules 3, 6)
          send(0);
          break;

        case 'check':       // 7. B decrypts, checks the inner source (rule 3); drops silently (rule 5)
          var res = arrive(s.packet, true);
          if (res) row({ kind: 'note', lane: 'B', what: res.delivered ? 'delivered' : 'dropped', ip: s.packet.innerSrc });
          break;

        case 'roam':        // 8. A's outer address changes; nobody is told (rule 4)
          A.endpoint = SCENE.A.roamTo;
          s.roamed = true;
          row({ kind: 'note', lane: 'A', what: 'roam', endpoint: A.endpoint });
          s.changed.push('a.endpoint');
          break;

        case 'learn':       // 9. A's next packet from the new address; B learns it from the authenticated packet (rule 4)
          var pkt = send(1);
          var r9 = arrive(pkt, false);
          if (r9) {
            s.rows[s.rows.length - 1].learned = r9.authenticated ? r9.endpoint : null;
            row({ kind: 'note', lane: 'B', what: r9.delivered ? 'delivered' : 'dropped', ip: pkt.innerSrc });
          }
          break;
      }
      return s;
    },

    ipToInt: ipToInt,
    inPrefix: inPrefix,
    buildTable: buildTable,
    lookup: lookup,
    identify: identify,
    receiveData: receiveData,
    peerOf: peerOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
