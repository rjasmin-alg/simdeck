/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for traceroute: A traces the chain A — R1 — … — Rn — S. One step is one TTL round: three probes with TTL k
   leave A, every router takes 1 off, the probes die at Rk (TTL 1 → 0) and Rk answers with ICMP Time Exceeded (11/0)
   unless it is silent; a probe that gets to S is answered with an echo reply (ICMP probes) or port unreachable (UDP
   probes), unless S filters it. Line k of the output is printed. Rules and numbers: SPEC.md.
   The per-hop TTL rule is hop-rewrite's (sims/hop-rewrite/sim.js @ 266f5d7, rule "TTL − 1 per router"); that model
   is not in models/ yet and nothing else of it is needed here (NOTES.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── the scene (SPEC.md "Scene", "Delays") ──

  var A_IP = '192.168.1.10', DST = '192.0.2.20';
  var MIN_R = 2, MAX_R = 11, MIN_HOPS = 4, MAX_HOPS = 30, PROBES = 3, BASE_PORT = 33434;
  /** One-way delay of the link into Rk (index k − 1), the link Rn — S, the reply delays; all in µs. */
  var LINK = [200, 1500, 3000, 18000, 2000, 1200, 800, 10500, 1000, 600, 400];
  var LINK_S = 300;
  var GEN = [300, 400, 500, 9000, 400, 600, 500, 700, 500, 400, 600];
  var GEN_S = 100;
  var JIT = [0, 41, 17, 63, 8, 52, 29, 74, 12, 47, 35, 58, 21];
  var TOOLS = ['tracert', 'traceroute'];
  var SILENT = ['none'];
  for (var i = 1; i <= MAX_R; i++) SILENT.push('R' + i);

  /** The address router k answers from: its interface towards A. */
  function routerAddr(k) { return k === 1 ? '192.168.1.1' : '10.0.' + (k - 1) + '.2'; }

  /** The chain for n routers: [{ id, kind, addr }], A first, S last. */
  function chain(n) {
    var out = [{ id: 'A', kind: 'host', addr: A_IP }];
    for (var k = 1; k <= n; k++) out.push({ id: 'R' + k, kind: 'router', addr: routerAddr(k) });
    out.push({ id: 'S', kind: 'server', addr: DST });
    return out;
  }

  // ── params ──

  function clampInt(v, lo, hi, dflt) {
    var x = Math.round(Number(v));
    return Math.max(lo, Math.min(hi, isFinite(x) ? x : dflt));
  }

  function norm(p) {
    p = p || {};
    return {
      tool: TOOLS.indexOf(p.tool) >= 0 ? p.tool : 'tracert',
      routers: clampInt(p.routers, MIN_R, MAX_R, 5),
      silent: SILENT.indexOf(p.silent) >= 0 ? p.silent : 'none',
      destFilter: p.destFilter === true || p.destFilter === 'true' || p.destFilter === 1,
      maxHops: clampInt(p.maxHops, MIN_HOPS, MAX_HOPS, MAX_HOPS)
    };
  }

  /** The silent router if it is on the chain, else null (rule 6: one outside the chain changes nothing). */
  function silentOn(p) {
    if (p.silent === 'none') return null;
    return Number(p.silent.slice(1)) <= p.routers ? p.silent : null;
  }

  // ── rules ──

  /** Rule 5: rounds in the trace. */
  function steps(params) {
    var p = norm(params);
    return p.destFilter ? p.maxHops : Math.min(p.routers + 1, p.maxHops);
  }

  /** Rule 1: the TTL on each link the probe with TTL k crosses (link 1 is A — R1), for n routers. A host does not
      decrement, so a probe past Rn keeps TTL k − n on the last link and arrives at S with it. */
  function ttlOnLinks(k, n) {
    var hop = Math.min(k, n + 1), out = [];
    for (var i = 1; i <= hop; i++) out.push(k - i + 1);
    return out;
  }

  /** Rule 8: the three RTTs (µs) of round k: twice the one-way delay to the hop, the hop's reply delay, jitter. */
  function rtts(k, n) {
    var dest = k > n, one = 0;
    for (var i = 0; i < Math.min(k, n); i++) one += LINK[i];
    if (dest) one += LINK_S;
    var gen = dest ? GEN_S : GEN[k - 1], out = [];
    for (var j = 0; j < PROBES; j++) out.push(2 * one + gen + JIT[(PROBES * (k - 1) + j) % JIT.length]);
    return out;
  }

  /** One round (rules 1–7): where the probes of TTL k stop, who answers and with what. */
  function round(k, params) {
    var p = norm(params), n = p.routers, quiet = silentOn(p);
    var dest = k > n, hop = dest ? n + 1 : k;
    var at = dest ? 'S' : 'R' + k;
    var links = ttlOnLinks(k, n);
    var reply, why;
    if (!dest) {
      why = at === quiet ? 'silent' : 'ttl';
      reply = why === 'silent' ? null : 'time-exceeded';
    } else {
      why = p.destFilter ? 'filtered' : 'dest';
      reply = why === 'filtered' ? null : p.tool === 'tracert' ? 'echo-reply' : 'port-unreachable';
    }
    var from = reply ? (dest ? DST : routerAddr(k)) : null;
    var times = reply ? rtts(k, n) : null;
    var probes = [];
    for (var j = 0; j < PROBES; j++) {
      var no = PROBES * (k - 1) + j;
      var pr = { ttl: k, kind: p.tool === 'tracert' ? 'echo' : 'udp', at: at, reply: reply, rtt: times ? times[j] : null };
      if (pr.kind === 'echo') pr.seq = no + 1; else pr.port = BASE_PORT + no;
      probes.push(pr);
    }
    return { ttl: k, hop: hop, at: at, ttlIn: links[links.length - 1], links: links, probes: probes, reply: reply,
      from: from, why: why, rtts: times };
  }

  /** The printed line of a round: { ttl, addr, rtts }, addr and rtts null for a * * * line. */
  function lineOf(r) { return { ttl: r.ttl, addr: r.from, rtts: r.rtts ? r.rtts.slice() : null }; }

  // ── printing (SPEC.md "Printing"): data, not language ──

  function padStart(s, w) { s = String(s); while (s.length < w) s = ' ' + s; return s; }

  /** Whole ms rounded half up, or <1 for under a millisecond (ICMP echo tool style). */
  function msWhole(us) { return us < 1000 ? '<1' : String(Math.floor((us + 500) / 1000)); }
  /** ms with three decimals, exact from µs (UDP tool style). */
  function msFine(us) { var r = us % 1000; return Math.floor(us / 1000) + '.' + (r < 10 ? '00' : r < 100 ? '0' : '') + r; }

  function formatLine(line, tool) {
    if (tool === 'tracert') {
      if (!line.addr) return padStart(line.ttl, 3) + [0, 1, 2].map(function () { return padStart('*', 6) + '   '; }).join('');
      return padStart(line.ttl, 3) + line.rtts.map(function (us) { return padStart(msWhole(us), 6) + ' ms'; }).join('') + '  ' + line.addr;
    }
    if (!line.addr) return padStart(line.ttl, 2) + '  * * *';
    return padStart(line.ttl, 2) + '  ' + line.addr + line.rtts.map(function (us) { return '  ' + msFine(us) + ' ms'; }).join('');
  }

  function command(params) {
    var p = norm(params);
    return p.tool === 'tracert' ? 'tracert -d -h ' + p.maxHops + ' ' + DST : 'traceroute -n -m ' + p.maxHops + ' ' + DST;
  }

  function copy(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }

  var logic = {
    /** Preset basic: 5 routers, ICMP echo probes, nobody silent, no filter, 30 hops max. */
    defaults: { tool: 'tracert', routers: 5, silent: 'none', destFilter: false, maxHops: 30 },

    steps: steps,

    /** Step 0: nothing sent, the output holds only the command line. */
    initial: function (params) {
      var p = norm(params), quiet = silentOn(p);
      return { tool: p.tool, routers: p.routers, dst: DST, maxHops: p.maxHops, silent: quiet ? [quiet] : [],
        silentOff: p.silent !== 'none' && !quiet ? p.silent : null, filteredAtDest: p.destFilter,
        round: null, lines: [], done: false, end: null };
    },

    /** State after round n, from the state after round n − 1. */
    step: function (s, n, params) {
      var total = steps(params);
      if (n < 1 || n > total) throw new Error('no step ' + n);
      var out = copy(s), r = round(n, params);
      out.round = r;
      out.lines.push(lineOf(r));
      out.done = n === total;
      out.end = !out.done ? null : r.why === 'dest' ? 'reply' : 'max-hops';
      return out;
    },

    round: round,
    rtts: rtts,
    ttlOnLinks: ttlOnLinks,
    silentOn: silentOn,
    chain: chain,
    routerAddr: routerAddr,
    formatLine: formatLine,
    command: command,
    msWhole: msWhole,
    msFine: msFine,
    norm: norm,
    A_IP: A_IP,
    DST: DST,
    SILENT: SILENT,
    MIN_R: MIN_R,
    MAX_R: MAX_R,
    MIN_HOPS: MIN_HOPS,
    MAX_HOPS: MAX_HOPS,
    BASE_PORT: BASE_PORT
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
