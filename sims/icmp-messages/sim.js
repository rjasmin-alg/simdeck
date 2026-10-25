/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for icmp-messages: one ping from the PC towards 192.168.2.50 (or 192.168.1.77) over PC — R1 — R2 — S, with
   one thing broken per scenario. Each router applies its checks in order (route, TTL, filter, ARP); the first rule
   that fires answers with an ICMP error, or with nothing (a filter that drops). The target answers echo reply. The
   console line is printed when the answer reaches the PC, or when the 4 s timer runs out. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The path, the per-hop TTL decrement and the ICMP source address follow sims/hop-rewrite/sim.js (its sceneOf and
   the Time Exceeded step; hop-rewrite's model is not in models/ yet, so the few lines needed are written here, NOTES.md).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PC_IP = '192.168.1.10', SERVER = '192.168.2.50', LOCAL = '192.168.1.77';
  var ARP_TRIES = 3, ARP_GAP = 1000;                        // SPEC.md rule 4 (check)
  var TIMEOUT = 4000;                                       // Windows' default wait, rule 6
  var ICMP_TTL = 64, REPLY_TTL = 64;                        // a sender's initial TTL (SPEC.md "At the target")
  var COUNT = 4;                                            // requests a ping sends (Windows' default)

  /** The scene (SPEC.md "Scene"). Nodes in path order; link k joins nodes k and k + 1. */
  var NODES = [
    { id: 'PC', kind: 'host', ip: PC_IP, prefix: 24, gw: '192.168.1.1' },
    { id: 'R1', kind: 'router', ifs: ['192.168.1.1', '10.0.12.1'],
      routes: [{ net: '192.168.1.0/24', via: null }, { net: '10.0.12.0/30', via: null }, { net: '192.168.2.0/24', via: '10.0.12.2' }] },
    { id: 'R2', kind: 'router', ifs: ['10.0.12.2', '192.168.2.1'],
      routes: [{ net: '10.0.12.0/30', via: null }, { net: '192.168.2.0/24', via: null }, { net: '192.168.1.0/24', via: '10.0.12.1' }] },
    { id: 'S', kind: 'server', ip: SERVER, prefix: 24 }
  ];
  var DELAY = [0.5, 2, 0.5];                                // one-way ms of link PC–R1, R1–R2, R2–S

  var SCENARIOS = ['ok', 'noRoute', 'hostDown', 'fwDrop', 'fwReject', 'local'];

  function ipNum(ip) { return ip.split('.').reduce(function (a, x) { return a * 256 + Number(x); }, 0); }
  function inNet(ip, cidr) {
    var parts = cidr.split('/'), bits = Number(parts[1]);
    var size = Math.pow(2, 32 - bits);
    return Math.floor(ipNum(ip) / size) === Math.floor(ipNum(parts[0]) / size);
  }
  /** ip AND mask, as a dotted address (the PC's same-network test, URM ch08 Primjer 2). */
  function netOf(ip, prefix) {
    var size = Math.pow(2, 32 - prefix), n = Math.floor(ipNum(ip) / size) * size;
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }

  function scenarioOf(p) { return SCENARIOS.indexOf(p.scenario) >= 0 ? p.scenario : 'ok'; }
  function ttlOf(p) { var v = Math.round(Number(p.ttl)); return Math.max(1, Math.min(64, isFinite(v) ? v : 64)); }
  function targetOf(p) { return scenarioOf(p) === 'local' ? LOCAL : SERVER; }

  /** The routing table of router id in this scenario (noRoute: R1 without 192.168.2.0/24 and no default). */
  function routesOf(id, p) {
    var r = NODES.filter(function (n) { return n.id === id; })[0];
    return r.routes.filter(function (x) { return !(id === 'R1' && scenarioOf(p) === 'noRoute' && x.net === '192.168.2.0/24'); });
  }
  /** Longest-prefix match (one candidate per prefix here). */
  function lookup(id, dst, p) {
    var best = null;
    routesOf(id, p).forEach(function (x) {
      if (inNet(dst, x.net) && (!best || Number(x.net.split('/')[1]) > Number(best.net.split('/')[1]))) best = x;
    });
    return best;
  }
  /** The filter on R2, or null. */
  function filterOf(p) {
    var sc = scenarioOf(p);
    return sc === 'fwDrop' ? 'drop' : sc === 'fwReject' ? 'reject' : null;
  }
  function serverUp(p) { return scenarioOf(p) !== 'hostDown'; }

  /** Rules 2–5 at router i for a request with ttlIn: the checks in order (RFC 1812 §5.2.1.2: next hop, forwarding
      permitted, TTL, link-layer address) and the rule that fired (or null). */
  function routerChecks(i, ttlIn, dst, p) {
    var id = NODES[i].id, checks = [], fired = null;
    var skip = function (k) { checks.push({ k: k, st: 'skip' }); };
    var route = lookup(id, dst, p);
    checks.push(route ? { k: 'route', st: 'ok', net: route.net, via: route.via } : { k: 'route', st: 'fail', dst: dst });
    if (!route) fired = 'net';
    var f = id === 'R2' ? filterOf(p) : null;
    if (f) {
      if (fired) skip('filter');
      else { checks.push({ k: 'filter', st: f, action: f }); fired = f; }
    }
    if (fired) skip('ttl');
    else {
      var out = ttlIn - 1;
      checks.push({ k: 'ttl', st: out <= 0 ? 'fail' : 'ok', a: ttlIn, b: Math.max(0, out) });
      if (out <= 0) fired = 'ttl';
    }
    var direct = route && route.via === null;
    var hop = route ? route.via || dst : null;
    if (fired) skip('arp');
    else {
      var answers = !direct || serverUp(p);
      checks.push({ k: 'arp', st: answers ? 'ok' : 'fail', ip: hop });
      if (!answers) fired = 'host';
    }
    return { node: id, checks: checks, fired: fired };
  }

  var ERR = { net: { type: 3, code: 0 }, host: { type: 3, code: 1 }, reject: { type: 3, code: 13 }, ttl: { type: 11, code: 0 } };
  var RESULT = { net: 'net', host: 'host', reject: 'prohibited', ttl: 'ttl' };

  /** The whole run as a list of events, one per step (SPEC.md "Steps"). */
  function plan(p) {
    var sc = scenarioOf(p), dst = targetOf(p), ev = [];
    var tries = function (t0) { var out = []; for (var k = 0; k < ARP_TRIES; k++) out.push(t0 + k * ARP_GAP); return out; };
    if (sc === 'local') {                                   // rule 7: the PC's own ARP fails, nothing leaves
      ev.push({ ev: 'arp', node: 'PC', ip: dst, tries: tries(0), t: (ARP_TRIES - 1) * ARP_GAP,
        local: { net: netOf(dst, 24), own: netOf(PC_IP, 24) } });
      ev.push({ ev: 'decide', node: 'PC', rule: 'local', t: ARP_TRIES * ARP_GAP,
        print: { kind: 'host', from: PC_IP } });
      return ev;
    }
    var t = 0, ttl = ttlOf(p), i = 0, fwd = null;
    var req = function (from, to, ttlNow) { return { kind: 'request', type: 8, code: 0, src: PC_IP, dst: dst, ttl: ttlNow, from: from, to: to }; };
    /** Hops back from node i to the PC, routers decrementing the TTL; the last one prints. */
    var back = function (pkt, j, print) {
      var ttlNow = pkt.ttl, via = null;
      for (var k = j; k > 0; k--) {
        t += DELAY[k - 1];
        var msg = Object.assign({}, pkt, { ttl: ttlNow, from: NODES[k].id, to: NODES[k - 1].id });
        var e = { ev: 'hop', pkt: msg, t: t, fwd: via };
        if (k === 1) e.print = Object.assign({}, print, { time: t, ttl: ttlNow });
        ev.push(e);
        if (k > 1) {                                        // the router on the way back forwards it
          var r = NODES[k - 1], route = lookup(r.id, PC_IP, p);
          via = { node: r.id, checks: [{ k: 'route', st: 'ok', net: route.net, via: route.via },
            { k: 'ttl', st: 'ok', a: ttlNow, b: ttlNow - 1 }, { k: 'arp', st: 'ok', ip: route.via || PC_IP }] };
          ttlNow -= 1;
        }
      }
    };
    for (;;) {
      t += DELAY[i];
      ev.push({ ev: 'hop', pkt: req(NODES[i].id, NODES[i + 1].id, ttl), t: t, fwd: fwd });
      i += 1;
      var n = NODES[i];
      if (n.kind === 'server') {                            // rule 1: echo reply, same data, its own TTL
        ev.push({ ev: 'decide', node: 'S', rule: 'echo', t: t, ttlIn: ttl,
          answer: { kind: 'reply', type: 0, code: 0, src: SERVER, dst: PC_IP, ttl: REPLY_TTL } });
        back(ev[ev.length - 1].answer, i, { kind: 'reply', from: SERVER });
        return ev;
      }
      var c = routerChecks(i, ttl, dst, p);                 // rules 2–5, 8
      if (!c.fired) { fwd = c; ttl -= 1; continue; }
      var d = { ev: 'decide', node: n.id, rule: c.fired, checks: c.checks, t: t, ttlIn: ttl, answer: null };
      if (c.fired === 'host') {                             // rule 3: the ARP attempts are a step of their own
        var hopIp = c.checks[c.checks.length - 1].ip;
        ev.push({ ev: 'arp', node: n.id, ip: hopIp, tries: tries(t), t: t + (ARP_TRIES - 1) * ARP_GAP, checks: c.checks });
        t += ARP_TRIES * ARP_GAP;
        d.t = t;
      }
      if (c.fired === 'drop') {                             // rule 5 drop and rule 6: silence, then the timer
        ev.push(d);
        ev.push({ ev: 'wait', t: TIMEOUT / 2 });
        ev.push({ ev: 'print', t: TIMEOUT, print: { kind: 'timeout' } });
        return ev;
      }
      // rules 2, 3, 4, 5 reject: an ICMP error from the interface towards the PC (RFC 1812 §4.3.2.4)
      d.answer = { kind: 'error', type: ERR[c.fired].type, code: ERR[c.fired].code, src: n.ifs[0], dst: PC_IP, ttl: ICMP_TTL };
      ev.push(d);
      back(d.answer, i, { kind: RESULT[c.fired], from: n.ifs[0] });
      return ev;
    }
  }

  // ── console (what ping prints: the OS's own output, data in both page languages) ──

  function msText(ms, os) {
    if (os === 'linux') return ms.toFixed(ms < 10 ? 2 : ms < 100 ? 1 : 0) + ' ms';
    return ms < 1 ? 'time<1ms' : 'time=' + Math.round(ms) + 'ms';
  }
  var WIN = { net: 'Destination net unreachable.', host: 'Destination host unreachable.', prohibited: 'Destination net unreachable.',
    ttl: 'TTL expired in transit.' };
  var LNX = { net: 'Destination Net Unreachable', host: 'Destination Host Unreachable', prohibited: 'Packet filtered',
    ttl: 'Time to live exceeded' };

  /** The line ping prints for request number seq, or null (Linux prints nothing for a lost request). */
  function lineFor(r, os, seq) {
    if (os === 'linux') {
      if (r.kind === 'timeout') return null;
      if (r.kind === 'reply') return '64 bytes from ' + r.from + ': icmp_seq=' + seq + ' ttl=' + r.ttl + ' time=' + msText(r.time, os);
      return 'From ' + r.from + ' icmp_seq=' + seq + ' ' + LNX[r.kind];
    }
    if (r.kind === 'timeout') return 'Request timed out.';
    if (r.kind === 'reply') return 'Reply from ' + r.from + ': bytes=32 ' + msText(r.time, os) + ' TTL=' + r.ttl;
    return 'Reply from ' + r.from + ': ' + WIN[r.kind];
  }

  /** Counts for the summary: Windows counts every "Reply from" line as received; Linux counts errors apart. */
  function tally(r, os) {
    var got = r.kind === 'reply' || (os !== 'linux' && r.kind !== 'timeout');
    var errors = os === 'linux' && r.kind !== 'reply' && r.kind !== 'timeout' ? COUNT : 0;
    var received = got ? COUNT : 0;
    return { sent: COUNT, received: received, lost: COUNT - received, loss: Math.round(100 * (COUNT - received) / COUNT), errors: errors };
  }

  /** The console: header, then (once printed) the lines of the 4 requests and the summary. */
  function consoleOf(result, os, dst) {
    var head = os === 'linux' ? 'PING ' + dst + ' (' + dst + ') 56(84) bytes of data.' : 'Pinging ' + dst + ' with 32 bytes of data:';
    if (!result) return { head: head, lines: [], summary: [], tally: null };
    var lines = [];
    for (var k = 1; k <= COUNT; k++) lines.push(lineFor(result, os, k));
    var c = tally(result, os), sum;
    var rtt = result.kind === 'reply' ? result.time : null;
    if (os === 'linux') {
      sum = ['--- ' + dst + ' ping statistics ---',
        c.sent + ' packets transmitted, ' + c.received + ' received, ' + (c.errors ? '+' + c.errors + ' errors, ' : '') + c.loss + '% packet loss'];
      if (rtt != null) sum.push('rtt min/avg/max/mdev = ' + [rtt, rtt, rtt, 0].map(function (v) { return v.toFixed(3); }).join('/') + ' ms');
    } else {
      sum = ['Ping statistics for ' + dst + ':',
        '    Packets: Sent = ' + c.sent + ', Received = ' + c.received + ', Lost = ' + c.lost + ' (' + c.loss + '% loss),'];
      if (rtt != null) {
        var m = Math.round(rtt) + 'ms';
        sum.push('Approximate round trip times in milli-seconds:', '    Minimum = ' + m + ', Maximum = ' + m + ', Average = ' + m);
      }
    }
    return { head: head, lines: lines, summary: sum, tally: c };
  }

  function copy(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }

  var logic = {
    defaults: { scenario: 'ok', ttl: 64, os: 'win' },

    /** Steps for these params (7 for the defaults, at most 7). */
    steps: function (p) { return plan(p).length; },

    /** Step 0: the PC is about to send; nothing on the wire. */
    initial: function (p) {
      return { scenario: scenarioOf(p), target: targetOf(p), ttl: ttlOf(p), ev: 'start', t: 0, at: 'PC',
        pkt: null, decision: null, arp: null, fwd: null, answer: null, result: null, dropped: null, done: false };
    },

    /** State after step n, from the state after step n - 1. */
    step: function (s, n, p) {
      var e = plan(p)[n - 1];
      if (!e) throw new Error('no step ' + n);
      var out = copy(s);
      out.ev = e.ev;
      out.t = e.t;
      out.pkt = copy(e.pkt) || null;
      out.fwd = copy(e.fwd) || null;
      out.arp = null;
      out.decision = null;
      if (e.ev === 'hop') out.at = e.pkt.to;
      if (e.ev === 'arp') out.arp = { node: e.node, ip: e.ip, tries: e.tries.slice(), local: copy(e.local) || null, checks: copy(e.checks) || null };
      if (e.ev === 'decide') {
        out.at = e.node;
        out.decision = { node: e.node, rule: e.rule, checks: copy(e.checks) || null, ttlIn: e.ttlIn == null ? null : e.ttlIn };
        out.answer = copy(e.answer) || null;
        if (e.rule !== 'echo') out.dropped = { node: e.node, rule: e.rule };
      }
      if (e.print) { out.result = copy(e.print); out.at = 'PC'; }
      out.done = n === plan(p).length;
      return out;
    },

    plan: plan,
    routerChecks: routerChecks,
    lookup: lookup,
    routesOf: routesOf,
    netOf: netOf,
    inNet: inNet,
    consoleOf: consoleOf,
    lineFor: lineFor,
    tally: tally,
    NODES: NODES,
    SCENARIOS: SCENARIOS,
    TIMEOUT: TIMEOUT,
    COUNT: COUNT,
    PC_IP: PC_IP,
    SERVER: SERVER,
    LOCAL: LOCAL
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
