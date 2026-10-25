/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for syn-outcomes: a client probes TCP ports with one SYN each and reads what comes back. A SYN gets a SYN+ACK
   (something listens: open), an RST (the host's TCP layer answers for a port nobody listens on: closed), an ICMP
   "administratively prohibited" from a filter, or nothing at all, even after two retransmissions (filtered). Between
   the client and the host there may be a firewall: first matching rule, then its default policy; a blocked SYN is
   dropped, rejected with ICMP 3/13, or answered with an RST in the host's name (rules: SPEC.md).
   Sources: URM ch. 15 "Tri ishoda jednog TCP SYN paketa" and Primjer 2, ch. 13 Primjer 3 (X = 4000, Y = 9500),
   ch. 18 (default deny); RFC 9293 §3.5.2, §3.10.7.1; RFC 6298 §2.1, §5.5; RFC 1812 §5.2.7.1; RFC 5737.
   Reuses tcp-handshake's SYN / SYN+ACK / ACK numbers (seq X, then seq Y ack X+1, then seq X+1 ack Y+1); its seqAdd
   is copied below (models/ has no TCP model yet).
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. */
(function (root) {
  'use strict';

  // from sims/tcp-handshake/sim.js @ 2941030: sequence numbers are 32-bit and wrap (RFC 9293 §3.4)
  var MOD = 4294967296;
  function seqAdd(a, k) { return (((a + k) % MOD) + MOD) % MOD; }

  /** RFC 6298 §2.1: the first RTO is 1 s; §5.5: each expiry doubles it. The page shows two retransmissions and gives up
      after the third SYN's timer (rule 5). */
  var RTO0 = 1000;
  var RETRIES = 2;
  /** ICMP Destination Unreachable (type 3) codes a filter or router sends for "you may not / cannot reach this"; a
      probe that gets one is filtered (rule 6). 13 = communication administratively prohibited (RFC 1812 §5.2.7.1). */
  var FILTER_CODES = [1, 2, 3, 9, 10, 13];
  var ICMP_PROHIBITED = 13;

  /** The scenes behind the presets. Each target: address, whether a host has it, the ports something listens on, the
      firewall on the path (null: none), the round-trip time in ms (ackAfter: the client's own delay
      before its ACK, from the capture). Each probe: a target and a port, and optionally
      `as`, the blocked action for this probe alone (drop-vs-reject). The strip is the ports the host card shows. */
  var DEFAULT_FW = 'drop';
  var SCENES = {
    // URM ch15 Primjer 2: three servers, port 8080, captures C (open), B (RST), A (silence); ranking C > B > A. The book
    // does not say why A is silent; here a firewall in front of A drops it (default deny, ch18), and A does listen.
    'book-three': {
      client: '192.168.1.139',
      targets: {
        C: { addr: '198.51.100.10', exists: true, listening: [8080], strip: [8080], fw: null, rtt: 20 },
        B: { addr: '198.51.100.20', exists: true, listening: [], strip: [8080], fw: null, rtt: 20 },
        A: { addr: '203.0.113.30', exists: true, listening: [443, 8080], strip: [443, 8080], rtt: 20,
          fw: { rules: [{ port: 443, action: 'allow' }], dflt: 'block' } }
      },
      probes: [{ target: 'C', port: 8080 }, { target: 'B', port: 8080 }, { target: 'A', port: 8080 }]
    },
    // URM ch15, figure ch15-tri-ishoda-syn.png: the book's real capture. Relative sequence numbers (seq 0, ack 1) as the
    // capture shows them; times from the capture; the two retransmissions came about 1 s apart there (SPEC.md).
    'book-capture': {
      client: '192.168.1.139',
      x: 0, y: 0,
      targets: {
        web: { addr: '172.66.147.243', exists: true, listening: [80], strip: [80], fw: null, rtt: 7.203, ackAfter: 0.033 },
        gw: { addr: '192.168.1.1', exists: true, listening: [], strip: [59999], fw: null, rtt: 0.628 },
        none: { addr: '192.0.2.1', exists: false, listening: [], strip: [80], fw: null, rtt: 0, gaps: [1029, 1024] }
      },
      probes: [{ target: 'web', port: 80 }, { target: 'gw', port: 59999 }, { target: 'none', port: 80 }]
    },
    // Derived: a server on another network (the firewall routes between the two). An SSH server listens on 22 but the firewall blocks it; 80 open; 8080 allowed, nothing listens.
    'behind-firewall': {
      client: '192.168.1.139',
      targets: {
        srv: { addr: '192.168.2.20', exists: true, listening: [22, 80], strip: [22, 80, 8080], rtt: 20,
          fw: { rules: [{ port: 22, action: 'block' }, { port: 80, action: 'allow' }, { port: 8080, action: 'allow' }], dflt: 'block' } }
      },
      probes: [{ target: 'srv', port: 22 }, { target: 'srv', port: 80 }, { target: 'srv', port: 8080 }]
    },
    // Derived: the same blocked port 22 with each of the three blocking actions.
    'drop-vs-reject': {
      client: '192.168.1.139',
      targets: {
        srv: { addr: '192.168.2.20', exists: true, listening: [22, 80], strip: [22, 80, 8080], rtt: 20,
          fw: { rules: [{ port: 22, action: 'block' }, { port: 80, action: 'allow' }, { port: 8080, action: 'allow' }], dflt: 'block' } }
      },
      probes: [{ target: 'srv', port: 22, as: 'drop' }, { target: 'srv', port: 22, as: 'reject-icmp' }, { target: 'srv', port: 22, as: 'reject-rst' }]
    },
    // RFC 5737 documentation address: nobody has it, so every port is silent, like a firewall's drop.
    'no-host': {
      client: '192.168.1.139',
      targets: {
        none: { addr: '192.0.2.1', exists: false, listening: [], strip: [22, 80], fw: null, rtt: 0 }
      },
      probes: [{ target: 'none', port: 22 }, { target: 'none', port: 80 }]
    }
  };

  /** Rule 1: the firewall's decision for a SYN to `port`: the first rule whose port matches, else the default policy.
      `blockAs` is what "block" means here (drop, reject-icmp or reject-rst). Returns { action, rule } with rule the
      index of the deciding rule, or 'default'. */
  function fwDecide(fw, port, blockAs) {
    var rule = 'default', action = fw.dflt;
    for (var i = 0; i < fw.rules.length; i++) {
      if (fw.rules[i].port === port) { rule = i; action = fw.rules[i].action; break; }
    }
    return { action: action === 'block' ? blockAs : action, rule: rule };
  }

  /** Rules 1–4: what happens to one probe. path: 'synack' (a listening host answers), 'rst' (the host's TCP answers
      for a closed port), 'fw-drop', 'fw-icmp', 'fw-rst' (the firewall blocks it) or 'nohost' (nobody has the address). */
  function pathOf(scene, probe, p) {
    var tg = scene.targets[probe.target];
    var fw = p.firewall ? tg.fw : null;
    var d = fw ? fwDecide(fw, probe.port, probe.as || p.fwAction) : null;
    var base = { fwRule: d ? d.rule : null, fwAction: d ? d.action : null };
    if (d && d.action !== 'allow') {
      base.path = d.action === 'drop' ? 'fw-drop' : d.action === 'reject-icmp' ? 'fw-icmp' : 'fw-rst';
      return base;
    }
    if (!tg.exists) base.path = 'nohost';
    else base.path = tg.listening.indexOf(probe.port) >= 0 ? 'synack' : 'rst';
    return base;
  }

  /** Rule 6: the verdict from what the client saw. reply: 'synack', 'rst', 'icmp' (with its code) or 'none'. */
  function verdictOf(reply, code) {
    if (reply === 'synack') return 'open';
    if (reply === 'rst') return 'closed';
    if (reply === 'none') return 'filtered';
    if (reply === 'icmp') return FILTER_CODES.indexOf(code) >= 0 ? 'filtered' : null;
    return null;
  }

  /** Rule 7: what the reply proves, from the client's side (it cannot tell an RST from the firewall from the host's). */
  var PROVES = { synack: 'app', rst: 'tcp', icmp: 'filter', none: 'nothing' };

  /** The retransmission gaps after the first SYN: the target's captured ones, or RFC 6298's doubling from 1 s. */
  function gapsOf(tg) {
    if (tg.gaps) return tg.gaps.slice(0, RETRIES);
    var out = [], rto = RTO0;
    for (var i = 0; i < RETRIES; i++) { out.push(rto); rto *= 2; }
    return out;
  }

  /** One probe as its list of events, one per step (SPEC.md "Steps"). Each event is a chart row: from, to (lanes C,
      F, S), flags, seq, ack, t (ms since the probe's first SYN), and what the page needs (kind, by, k). */
  function eventsOf(scene, probe, idx, p) {
    var tg = scene.targets[probe.target];
    var x = scene.x != null ? scene.x : 4000, y = scene.y != null ? scene.y : 9500;
    var pa = pathOf(scene, probe, p);
    var rtt = tg.rtt, half = Math.round(rtt / 2 * 1000) / 1000;
    var syn = { probe: idx, kind: 'syn', from: 'C', to: 'S', flags: ['SYN'], seq: x, ack: null, t: 0, k: 0 };
    var out = [];
    switch (pa.path) {
      case 'synack':
        syn.fate = 'host';
        out.push(syn);
        out.push({ probe: idx, kind: 'synack', from: 'S', to: 'C', flags: ['SYN', 'ACK'], seq: y, ack: seqAdd(x, 1), t: rtt, by: 'S' });
        out.push(p.scan === 'half-open'
          ? { probe: idx, kind: 'abort', from: 'C', to: 'S', flags: ['RST'], seq: seqAdd(x, 1), ack: null, t: rtt + (tg.ackAfter || 0) }
          : { probe: idx, kind: 'ack', from: 'C', to: 'S', flags: ['ACK'], seq: seqAdd(x, 1), ack: seqAdd(y, 1), t: rtt + (tg.ackAfter || 0) });
        break;
      case 'rst':
        // Rule 4 (RFC 9293 §3.10.7.1, CLOSED): no ACK on the SYN, so <SEQ=0><ACK=SEG.SEQ+SEG.LEN><CTL=RST,ACK>; the SYN
        // occupies one number, so the ack is X+1.
        syn.fate = 'host';
        out.push(syn);
        out.push({ probe: idx, kind: 'rst', from: 'S', to: 'C', flags: ['RST', 'ACK'], seq: 0, ack: seqAdd(x, 1), t: rtt, by: 'S' });
        break;
      case 'fw-rst':
        // Rule 1: a reject-with-reset forges the same RST+ACK the host would send, from the host's address.
        syn.fate = 'fw-reject';
        out.push(syn);
        out.push({ probe: idx, kind: 'rst', from: 'F', to: 'C', flags: ['RST', 'ACK'], seq: 0, ack: seqAdd(x, 1), t: half, by: 'F' });
        break;
      case 'fw-icmp':
        syn.fate = 'fw-reject';
        out.push(syn);
        out.push({ probe: idx, kind: 'icmp', from: 'F', to: 'C', flags: [], icmp: { type: 3, code: ICMP_PROHIBITED }, seq: null, ack: null, t: half, by: 'F' });
        break;
      default: {
        // fw-drop or nohost: silence, then rule 5's retransmissions of the same SYN (same seq)
        syn.fate = pa.path === 'fw-drop' ? 'fw-drop' : 'nohost';
        out.push(syn);
        var at = 0;
        gapsOf(tg).forEach(function (g, i) {
          at += g;
          out.push(Object.assign({}, syn, { kind: 'retx', t: at, k: i + 1 }));
        });
      }
    }
    var reply = pa.path === 'synack' ? 'synack' : pa.path === 'rst' || pa.path === 'fw-rst' ? 'rst'
      : pa.path === 'fw-icmp' ? 'icmp' : 'none';
    return { events: out, path: pa.path, fwRule: pa.fwRule, fwAction: pa.fwAction, reply: reply };
  }

  /** The whole run for these params: every probe with its events and outcome. */
  function plan(p) {
    var scene = SCENES[p.scene] || SCENES[logic.defaults.scene];
    return scene.probes.map(function (pr, i) {
      var tg = scene.targets[pr.target], e = eventsOf(scene, pr, i, p);
      var code = e.reply === 'icmp' ? ICMP_PROHIBITED : null;
      return {
        name: pr.target, addr: tg.addr, port: pr.port, as: pr.as || null,
        path: e.path, fwRule: e.fwRule, fwAction: e.fwAction,
        reply: e.reply, code: code, verdict: verdictOf(e.reply, code), proves: PROVES[e.reply],
        retries: e.events.filter(function (ev) { return ev.kind === 'retx'; }).length,
        events: e.events,
        gaps: tg.gaps ? 'captured' : 'rfc'
      };
    });
  }

  function steps(p) {
    return plan(p).reduce(function (n, pr) { return n + pr.events.length; }, 0);
  }

  /** State after n steps (0 = nothing sent). probes: each with phase 'wait' | 'run' | 'done'; cur: the probe of the
      newest event (null at 0); ev: that event; chart: every event so far, in order; timers: the client's running or
      expired retransmission timers (chart row indices); table: one verdict row per finished probe. */
  function analyze(p, n) {
    var pl = plan(p), chart = [], timers = [], table = [], cur = null, ev = null;
    var probes = pl.map(function (pr) {
      return { name: pr.name, addr: pr.addr, port: pr.port, as: pr.as, phase: 'wait', reply: null, verdict: null, retries: 0,
        path: pr.path, fwRule: pr.fwRule, fwAction: pr.fwAction };
    });
    var left = n;
    for (var i = 0; i < pl.length && left > 0; i++) {
      var pr = pl[i], q = probes[i];
      q.phase = 'run';
      for (var j = 0; j < pr.events.length && left > 0; j++, left--) {
        ev = pr.events[j];
        cur = i;
        chart.push(ev);
        if (ev.kind === 'retx') q.retries = ev.k;
        // a silent SYN starts the client's timer; the next retransmission ends it expired (rule 5)
        if (pr.reply === 'none') {
          if (timers.length && timers[timers.length - 1].probe === i && timers[timers.length - 1].to === null) {
            var tm = timers[timers.length - 1];
            tm.to = chart.length - 1;
            tm.end = 'expired';
          }
          var gaps = pr.events.slice(1).map(function (e2, k) { return e2.t - pr.events[k].t; });
          var rto = j < gaps.length ? gaps[j] : pr.gaps === 'rfc' ? RTO0 * Math.pow(2, j) : null;
          if (rto !== null) timers.push({ probe: i, from: chart.length - 1, to: null, end: null, rto: rto });
          // after the last SYN the client waits out its timer and gives up: drawn as expired on that row
          if (j === pr.events.length - 1 && rto !== null) { timers[timers.length - 1].to = chart.length - 1; timers[timers.length - 1].end = 'expired'; }
        }
        if (j === pr.events.length - 1) {
          q.phase = 'done';
          q.reply = pr.reply;
          q.verdict = pr.verdict;
          table.push({ probe: i, name: pr.name, addr: pr.addr, port: pr.port, reply: pr.reply, code: pr.code,
            verdict: pr.verdict, proves: pr.proves, path: pr.path, retries: pr.retries });
        }
      }
    }
    return { n: n, cur: cur, ev: ev, probes: probes, chart: chart, timers: timers, table: table,
      done: probes.every(function (q2) { return q2.phase === 'done'; }) };
  }

  var logic = {
    /** Preset 1, the book's three servers; firewall on, blocked SYNs dropped, a full connect, the truth hidden. */
    defaults: { scene: 'book-three', firewall: true, fwAction: DEFAULT_FW, scan: 'connect', reveal: false },
    scenes: Object.keys(SCENES),
    fwActions: ['drop', 'reject-icmp', 'reject-rst'],

    steps: steps,
    initial: function (p) { return analyze(p, 0); },
    /** Step n replays the run from the start, so a param change recomputes at the same step. */
    step: function (s, n, p) { return analyze(p, n); },

    MOD: MOD,
    RTO0: RTO0,
    RETRIES: RETRIES,
    FILTER_CODES: FILTER_CODES,
    SCENES: SCENES,
    seqAdd: seqAdd,
    fwDecide: fwDecide,
    pathOf: pathOf,
    verdictOf: verdictOf,
    gapsOf: gapsOf,
    eventsOf: eventsOf,
    plan: plan,
    analyze: analyze,
    /** Whether any target of the scene has a firewall on its path (the page disables the firewall controls if not). */
    hasFirewall: function (p) {
      var sc = SCENES[p.scene];
      return !!sc && Object.keys(sc.targets).some(function (k) { return !!sc.targets[k].fw; });
    },
    /** Whether fwAction changes anything: a firewall is on, and some probe without its own `as` is blocked. */
    fwActionMatters: function (p) {
      var sc = SCENES[p.scene];
      if (!sc || !p.firewall) return false;
      return sc.probes.some(function (pr) {
        var fw = sc.targets[pr.target].fw;
        return !pr.as && fw && fwDecide(fw, pr.port, 'x').action === 'x';
      });
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
