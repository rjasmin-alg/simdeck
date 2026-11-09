/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipsec-ike: two IPsec peers bring up an IKEv2 SA (IKE_SA_INIT with Diffie–Hellman, then IKE_AUTH with the
   first Child SA and its traffic selectors), a packet crosses as ESP in tunnel or transport mode, and the Child SA
   pair is rekeyed. Rules and numbers: SPEC.md.
   No real cryptography: "encrypted" and "ICV ok" mean the packet carries the key id the receiver holds for that SA.
   The DH arithmetic is real, with the toy numbers of sims/diffie-hellman.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words live in strings.js. */
(function (root) {
  'use strict';

  // ── Diffie–Hellman (IKE_SA_INIT's KE payloads) ──

  /** b^e mod m for small integers, by repeated squaring (exact while m² < 2^53).
      From sims/diffie-hellman/sim.js @ 95725f1 (not in models/ yet). */
  function powMod(b, e, m) {
    var r = 1 % m;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) r = (r * b) % m;
      b = (b * b) % m;
      e = Math.floor(e / 2);
    }
    return r;
  }

  var DH = { p: 23, g: 5, a: 6, b: 15 };

  // ── the scene ──

  var LANES = ['HA', 'GA', 'GB', 'HB'];
  var ADDR = { HA: '10.1.0.5', GA: '198.51.100.1', GB: '203.0.113.1', HB: '10.2.0.9' };
  // Transport mode: one routed private network (two sites of one organisation), so the routers have private addresses
  // and the hosts' own addresses can be the outer header (SPEC.md "Scene").
  var ROUTER = { GA: '10.1.0.1', GB: '10.2.0.1' };
  var SITE = { A: '10.1.0.0/24', B: '10.2.0.0/24' };
  var OFF_DST = '10.2.1.9';            // behind GW-B, outside every PROTECT entry
  var SPI = { 1: { A: 'a1000001', B: 'b2000001' }, 2: { A: 'a1000002', B: 'b2000002' } };   // SPI[gen][receiver]
  var OLD_SEQ = 5120;
  var IKE_PORT = 500;
  var ESP_PROTO = 50;
  var NEXT = { tunnel: 4, transport: 6 };   // ESP trailer's next header: IPv4 inside, or TCP

  var PHASES = {
    bringUp: ['init', 'auth', 'send', 'match', 'wrap', 'receive', 'deliver', 'lifetime'],
    bringUpOff: ['init', 'auth', 'send', 'match', 'policy'],
    send: ['send', 'match', 'wrap', 'receive', 'deliver'],
    sendOff: ['send', 'match', 'policy'],
    rekey: ['traffic', 'soft', 'ccs', 'moved', 'delete', 'reply']
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── addresses and prefixes ──

  function ipToInt(ip) { return ip.split('.').reduce(function (acc, o) { return acc * 256 + Number(o); }, 0); }
  function prefixLen(prefix) { return Number(prefix.split('/')[1]); }
  /** Whether ip lies in prefix (a.b.c.d/len). Arithmetic, not bit operators, so /0 … /32 stay unsigned. */
  function inPrefix(ip, prefix) {
    var parts = prefix.split('/'), size = Math.pow(2, 32 - Number(parts[1]));
    return Math.floor(ipToInt(ip) / size) === Math.floor(ipToInt(parts[0]) / size);
  }

  /** A lane's address as drawn: in transport mode the middle lanes are the private network's routers. */
  function laneAddr(mode, lane) { return mode === 'transport' && ROUTER[lane] ? ROUTER[lane] : ADDR[lane]; }

  /** Which lane is IPsec peer A or B in this mode (SPEC.md "Scene"). */
  function peerLane(mode, who) { return mode === 'transport' ? (who === 'A' ? 'HA' : 'HB') : (who === 'A' ? 'GA' : 'GB'); }

  /** The traffic selectors IKE_AUTH negotiates: TSi (A's side) and TSr (B's side). */
  function selectorsFor(mode) {
    return mode === 'transport' ? { local: ADDR.HA + '/32', remote: ADDR.HB + '/32' } : { local: SITE.A, remote: SITE.B };
  }

  /** A's outbound SPD (RFC 4301 §4.4.1), most specific entry first; the implicit last entry is BYPASS. */
  function spdFor(mode) {
    var ts = selectorsFor(mode);
    return [
      { src: ts.local, dst: ts.remote, action: 'protect' },
      { src: ts.local, dst: '10.0.0.0/8', action: 'discard' }
    ];
  }

  /** Rule 6 and the tie-break: every entry whose source and destination match is a hit; the most specific
      destination prefix wins (then the more specific source; then the earlier entry). No hit: the implicit
      entry (index spd.length), BYPASS. */
  function spdLookup(spd, src, dst) {
    var hits = spd.map(function (e) { return inPrefix(src, e.src) && inPrefix(dst, e.dst); });
    var win = -1;
    hits.forEach(function (hit, i) {
      if (!hit) return;
      if (win < 0) { win = i; return; }
      var a = spd[i], w = spd[win];
      if (prefixLen(a.dst) > prefixLen(w.dst) || (prefixLen(a.dst) === prefixLen(w.dst) && prefixLen(a.src) > prefixLen(w.src))) win = i;
    });
    return { src: src, dst: dst, hits: hits, win: win < 0 ? spd.length : win, action: win < 0 ? 'bypass' : spd[win].action };
  }

  /** Rule 3: an SA is found by SPI + protocol + destination; deleted SAs are gone. */
  function findSA(sas, spi, proto, dst) {
    for (var i = 0; i < sas.length; i++) {
      var sa = sas[i];
      if (sa.spi === spi && sa.proto === proto && sa.to === dst && sa.state !== 'deleted') return sa;
    }
    return null;
  }

  /** The active outbound SA from `from` whose selectors cover the packet (rule 6), newest first. */
  function outboundSA(sas, from, src, dst) {
    var best = null;
    sas.forEach(function (sa) {
      if (sa.from !== from || sa.state !== 'active') return;
      if (!inPrefix(src, sa.ts.src) || !inPrefix(dst, sa.ts.dst)) return;
      if (!best || sa.gen > best.gen) best = sa;
    });
    return best;
  }

  /** A Child SA pair (rule 3): two one-way SAs, each SPI chosen by its receiver. Selectors seen from the sender. */
  function childPair(gen, ts) {
    return [
      { spi: SPI[gen].B, proto: 'esp', from: 'A', to: 'B', gen: gen, seq: 0, key: 'k-' + SPI[gen].B, ts: { src: ts.local, dst: ts.remote }, state: 'active' },
      { spi: SPI[gen].A, proto: 'esp', from: 'B', to: 'A', gen: gen, seq: 0, key: 'k-' + SPI[gen].A, ts: { src: ts.remote, dst: ts.local }, state: 'active' }
    ];
  }

  /** Rules 4 and 5: ESP around an inner packet. Tunnel: a new outer header between the peers, the whole inner packet
      encrypted, next header 4. Transport: the inner header stays as the outer one (protocol 50), only the payload is
      encrypted, next header 6. The outer header is never encrypted. */
  function wrap(inner, sa, mode, peerAddr) {
    var tunnel = mode === 'tunnel';
    return {
      kind: 'esp', mode: mode,
      outerSrc: tunnel ? peerAddr[sa.from] : inner.src,
      outerDst: tunnel ? peerAddr[sa.to] : inner.dst,
      proto: ESP_PROTO,
      innerSrc: inner.src, innerDst: inner.dst,
      spi: sa.spi, seq: sa.seq, key: sa.key, next: NEXT[mode],
      encrypted: tunnel ? ['innerIP', 'tcp', 'data', 'trailer'] : ['tcp', 'data', 'trailer'],
      authenticated: tunnel ? ['esp', 'innerIP', 'tcp', 'data', 'trailer'] : ['esp', 'tcp', 'data', 'trailer'],
      espProtected: true
    };
  }

  /** Inbound ESP at receiver `me` (rules 3, 5, 6, RFC 4303 §3.4, RFC 4301 §5.2), in this order: the SA by SPI + ESP +
      destination; the ICV (before decrypting); then the inner addresses against that SA's selectors.
      Returns { sa, spiOk, authOk, tsOk, delivered, drop }. */
  function receiveEsp(sas, pkt, me) {
    var sa = findSA(sas, pkt.spi, 'esp', me);
    if (!sa) return { sa: null, spiOk: false, authOk: null, tsOk: null, delivered: false, drop: 'noSA' };
    if (pkt.key !== sa.key) return { sa: sa.spi, spiOk: true, authOk: false, tsOk: null, delivered: false, drop: 'authFail' };
    var tsOk = inPrefix(pkt.innerSrc, sa.ts.src) && inPrefix(pkt.innerDst, sa.ts.dst);
    return { sa: sa.spi, spiOk: true, authOk: true, tsOk: tsOk, delivered: tsOk, drop: tsOk ? null : 'tsFail' };
  }

  function norm(p) {
    p = p || {};
    return {
      mode: p.mode === 'transport' ? 'transport' : 'tunnel',
      auth: p.auth === 'cert' ? 'cert' : 'psk',
      action: p.action === 'send' || p.action === 'rekey' ? p.action : 'bring-up',
      selectorMatch: p.selectorMatch !== false
    };
  }

  function phasesOf(p) {
    var q = norm(p);
    if (q.action === 'rekey') return PHASES.rekey;
    if (q.action === 'send') return q.selectorMatch ? PHASES.send : PHASES.sendOff;
    return q.selectorMatch ? PHASES.bringUp : PHASES.bringUpOff;
  }

  /** IKE payloads (RFC 7296 §1.2, §1.3, §1.4.1). `sk` lists what travels inside SK {…}, encrypted with the IKE SA. */
  function ikeMsg(exchange, from, to, auth) {
    var cert = auth === 'cert';
    var m = { kind: 'ike', exchange: exchange, from: from, to: to, port: IKE_PORT, clear: [], sk: [] };
    var i = from === 'A';
    switch (exchange) {
      case 'IKE_SA_INIT':
        m.clear = i ? ['SAi1', 'KEi', 'Ni'] : ['SAr1', 'KEr', 'Nr'].concat(cert ? ['CERTREQ'] : []);
        m.ke = i ? powMod(DH.g, DH.a, DH.p) : powMod(DH.g, DH.b, DH.p);
        break;
      case 'IKE_AUTH':
        m.sk = (i ? ['IDi'] : ['IDr']).concat(cert ? ['CERT'] : [], ['AUTH', i ? 'SAi2' : 'SAr2', 'TSi', 'TSr']);
        break;
      case 'CREATE_CHILD_SA':
        m.sk = i ? ['N(REKEY_SA)', 'SA', 'Ni', 'TSi', 'TSr'] : ['SA', 'Nr', 'TSi', 'TSr'];
        break;
      case 'INFORMATIONAL':
        m.sk = ['D'];
        break;
    }
    return m;
  }

  var logic = {
    DH: DH, LANES: LANES, ADDR: ADDR, ROUTER: ROUTER, SITE: SITE, OFF_DST: OFF_DST, SPI: SPI, OLD_SEQ: OLD_SEQ,
    IKE_PORT: IKE_PORT, ESP_PROTO: ESP_PROTO, NEXT: NEXT, PHASES: PHASES,

    defaults: { mode: 'tunnel', auth: 'psk', action: 'bring-up', selectorMatch: true },

    /** bring-up 8 (5 off the selectors), send 5 (3), rekey 6 (SPEC.md "Params and steps"). */
    steps: function (p) { return phasesOf(p).length; },
    phasesOf: phasesOf,
    norm: norm,

    initial: function (params) {
      var q = norm(params);
      var up = q.action !== 'bring-up';     // send and rekey start with the tunnel already up
      var ts = selectorsFor(q.mode);
      var s = {
        phase: 'start',
        mode: q.mode,
        peers: { A: peerLane(q.mode, 'A'), B: peerLane(q.mode, 'B') },
        ikeSA: { state: up ? 'up' : 'none', authMethod: up ? q.auth : null, dh: null },
        childSAs: up ? childPair(1, ts) : [],
        selectors: up ? ts : null,
        spd: spdFor(q.mode),
        lookup: null,
        packet: null,
        ike: [],
        check: null,
        outcome: null,
        rows: [],
        changed: []
      };
      if (up) {
        s.ikeSA.dh = { p: DH.p, g: DH.g, KEi: powMod(DH.g, DH.a, DH.p), KEr: powMod(DH.g, DH.b, DH.p), sA: 2, sB: 2 };
        if (q.action === 'rekey') s.childSAs[0].seq = OLD_SEQ - 1;
      }
      return s;
    },

    step: function (prev, n, params) {
      var s = clone(prev);
      var q = norm(params);
      var phase = phasesOf(q)[n - 1];
      var LA = s.peers.A, LB = s.peers.B;
      var tunnel = q.mode === 'tunnel';
      var peerAddr = { A: ADDR[LA], B: ADDR[LB] };
      var dst = q.selectorMatch ? ADDR.HB : OFF_DST;
      s.phase = phase;
      s.changed = [];
      s.check = null;
      s.ike = [];          // the IKE messages of this step only
      function row(r) { r.step = n; s.rows.push(r); return s.rows.length - 1; }
      function ch() { for (var i = 0; i < arguments.length; i++) if (s.changed.indexOf(arguments[i]) < 0) s.changed.push(arguments[i]); }
      function sa(spi) { for (var i = 0; i < s.childSAs.length; i++) if (s.childSAs[i].spi === spi) return s.childSAs[i]; return null; }
      function ike(exchange, from, extra) {
        var m = ikeMsg(exchange, from, from === 'A' ? 'B' : 'A', q.auth);
        if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; });
        s.ike.push(m);
        row({ kind: 'msg', from: s.peers[from], to: s.peers[m.to], msg: exchange, lock: m.sk.length > 0, fields: m.clear.length ? m.clear : m.sk, ike: true,
          del: m.del || null, rekeys: m.rekeys || null, ke: m.ke == null ? null : m.ke });
        return m;
      }
      /** Tunnel mode: the plain leg between a host and its gateway (the rekey's traffic steps). */
      function leg(fromLane, toLane, inner) {
        if (tunnel) row({ kind: 'msg', from: fromLane, to: toLane, msg: 'IP', src: inner.src, dst: inner.dst, plain: true });
      }
      /** One ESP packet from peer `from` on its newest matching outbound SA (rules 3–5). */
      function sendEsp(from, inner) {
        var out = outboundSA(s.childSAs, from, inner.src, inner.dst);
        out.seq += 1;
        var pkt = wrap(inner, out, q.mode, peerAddr);
        pkt.where = 'wire';
        s.packet = pkt;
        row({ kind: 'msg', from: s.peers[from], to: s.peers[out.to], msg: 'ESP', lock: true, spi: out.spi, seq: out.seq, esp: true });
        ch('packet', 'sa.' + out.spi);
        return pkt;
      }
      function receive(me) {
        var res = receiveEsp(s.childSAs, s.packet, me);
        s.check = res;
        s.packet.where = s.peers[me];
        s.packet.authOk = res.authOk;
        s.packet.tsOk = res.tsOk;
        return res;
      }

      switch (phase) {
        case 'init':      // 1. IKE_SA_INIT: proposals, DH, nonces in the clear; keys, nobody authenticated (rule 2)
          ike('IKE_SA_INIT', 'A');
          ike('IKE_SA_INIT', 'B');
          var KEi = powMod(DH.g, DH.a, DH.p), KEr = powMod(DH.g, DH.b, DH.p);
          s.ikeSA = { state: 'keyed', authMethod: null, dh: { p: DH.p, g: DH.g, KEi: KEi, KEr: KEr, sA: powMod(KEr, DH.a, DH.p), sB: powMod(KEi, DH.b, DH.p) } };
          s.packet = null;
          ch('ike', 'ikeSA');
          break;

        case 'auth':      // 2. IKE_AUTH under SK: identities, AUTH, first Child SA pair + selectors (rules 1, 2, 3, 6)
          ike('IKE_AUTH', 'A');
          ike('IKE_AUTH', 'B');
          s.ikeSA.state = 'up';
          s.ikeSA.authMethod = q.auth;
          s.selectors = selectorsFor(q.mode);
          s.childSAs = childPair(1, s.selectors);
          ch('ike', 'ikeSA', 'childSAs', 'selectors', 'spd');
          break;

        case 'send':      // 3. Host A sends to Host B (or to 10.2.1.9): in tunnel mode to its gateway, in the clear
          s.packet = { kind: 'plain', innerSrc: ADDR.HA, innerDst: dst, where: 'HA', espProtected: false };
          s.lookup = null;
          if (tunnel) {
            s.packet.where = 'GA';
            row({ kind: 'msg', from: 'HA', to: 'GA', msg: 'IP', src: ADDR.HA, dst: dst, plain: true });
          } else {
            row({ kind: 'note', lane: 'HA', what: 'born', dst: dst });
          }
          ch('packet');
          break;

        case 'match':     // 4. A's SPD: most specific entry wins; PROTECT names the Child SA (rule 6, tie-break)
          s.lookup = spdLookup(s.spd, s.packet.innerSrc, s.packet.innerDst);
          if (s.lookup.action === 'protect') {
            var o = outboundSA(s.childSAs, 'A', s.packet.innerSrc, s.packet.innerDst);
            s.lookup.sa = o ? o.spi : null;
          }
          row({ kind: 'note', lane: LA, what: 'match', action: s.lookup.action, sa: s.lookup.sa || null });
          ch('spd', 'packet');
          break;

        case 'policy':    // 5 (off the selectors). DISCARD: dropped at A, no ESP, nothing in the clear (rule 6)
          s.outcome = s.lookup.action === 'discard' ? 'discarded' : s.lookup.action === 'bypass' ? 'bypassed' : 'noSA';
          s.packet.dropped = s.outcome === 'discarded';
          row({ kind: 'note', lane: LA, what: s.outcome });
          ch('packet', 'spd');
          break;

        case 'wrap':      // 5. ESP per mode, A → B (rules 4, 5)
          sendEsp('A', { src: s.packet.innerSrc, dst: s.packet.innerDst });
          break;

        case 'receive':   // 6. B: SA by SPI, ICV, decrypt (rules 3, 5)
          var r6 = receive('B');
          row({ kind: 'note', lane: LB, what: r6.drop || 'decrypted', spi: s.packet.spi });
          ch('packet', 'sa.' + s.packet.spi);
          break;

        case 'deliver':   // 7. B: inner addresses against the SA's selectors, then deliver (rule 6)
          var r7 = s.check = receiveEsp(s.childSAs, s.packet, 'B');
          s.packet.tsOk = r7.tsOk;
          s.packet.authOk = r7.authOk;
          s.outcome = r7.delivered ? 'delivered' : r7.drop;
          s.packet.delivered = r7.delivered;
          if (r7.delivered && tunnel) {
            s.packet.where = 'HB';
            row({ kind: 'msg', from: 'GB', to: 'HB', msg: 'IP', src: s.packet.innerSrc, dst: s.packet.innerDst, plain: true, ts: true });
          } else {
            row({ kind: 'note', lane: LB, what: r7.delivered ? 'delivered' : r7.drop });
          }
          ch('packet', 'selectors');
          break;

        case 'lifetime':  // 8. the Child SA lives for a set time (local policy), then it is rekeyed
          row({ kind: 'note', lane: LA, what: 'lifetime' });
          ch('childSAs');
          break;

        // ── rekey ──
        case 'traffic':   // 1. a packet on the old pair
          leg('HA', 'GA', { src: ADDR.HA, dst: ADDR.HB });
          sendEsp('A', { src: ADDR.HA, dst: ADDR.HB });
          s.packet.where = 'wire';
          break;

        case 'soft':      // 2. the soft lifetime runs out at A
          row({ kind: 'note', lane: LA, what: 'soft' });
          ch('sa.' + SPI[1].B, 'sa.' + SPI[1].A);
          break;

        case 'ccs':       // 3. CREATE_CHILD_SA inside the IKE SA: a new pair, same selectors (RFC 7296 §2.8)
          ike('CREATE_CHILD_SA', 'A', { rekeys: SPI[1].A });
          ike('CREATE_CHILD_SA', 'B');
          s.childSAs.forEach(function (x) { if (x.gen === 1) x.state = 'old'; });
          s.childSAs = s.childSAs.concat(childPair(2, s.selectors));
          s.packet = null;
          ch('ike', 'childSAs', 'sa.' + SPI[2].B, 'sa.' + SPI[2].A);
          break;

        case 'moved':     // 4. traffic moves to the new SA; its sequence number starts at 1
          leg('HA', 'GA', { src: ADDR.HA, dst: ADDR.HB });
          sendEsp('A', { src: ADDR.HA, dst: ADDR.HB });
          break;

        case 'delete':    // 5. INFORMATIONAL with Delete: each side names its own inbound SPI; the old pair is gone
          s.packet = null;
          ike('INFORMATIONAL', 'A', { del: SPI[1].A });
          ike('INFORMATIONAL', 'B', { del: SPI[1].B });
          s.childSAs.forEach(function (x) { if (x.gen === 1) x.state = 'deleted'; });
          ch('ike', 'childSAs', 'sa.' + SPI[1].B, 'sa.' + SPI[1].A);
          break;

        case 'reply':     // 6. Host B answers: B's outbound SA of the new pair, into A
          leg('HB', 'GB', { src: ADDR.HB, dst: ADDR.HA });
          var rp = sendEsp('B', { src: ADDR.HB, dst: ADDR.HA });
          var rr = receiveEsp(s.childSAs, rp, 'A');
          s.check = rr;
          rp.authOk = rr.authOk;
          rp.tsOk = rr.tsOk;
          rp.delivered = rr.delivered;
          s.outcome = rr.delivered ? 'rekeyed' : rr.drop;
          if (rr.delivered) leg('GA', 'HA', { src: ADDR.HB, dst: ADDR.HA });
          break;
      }
      return s;
    },

    powMod: powMod,
    ipToInt: ipToInt,
    inPrefix: inPrefix,
    peerLane: peerLane,
    laneAddr: laneAddr,
    selectorsFor: selectorsFor,
    spdFor: spdFor,
    spdLookup: spdLookup,
    findSA: findSA,
    outboundSA: outboundSA,
    childPair: childPair,
    wrap: wrap,
    receiveEsp: receiveEsp,
    ikeMsg: ikeMsg
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
