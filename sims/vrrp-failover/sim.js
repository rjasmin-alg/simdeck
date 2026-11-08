/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for vrrp-failover: two routers R1 and R2 share the virtual gateway 192.168.1.1 and its virtual MAC
   00:00:5e:00:01:01 (VRID 1) on a switched segment with hosts A and B. The Master advertises every
   Advertisement_Interval; a Backup that hears nothing for Master_Down_Interval takes over, sends an advertisement and
   a gratuitous ARP (ARP announcement), and the switch learns the virtual MAC on the new port. Hosts change nothing.
   One run per scenario (`event`): the Master fails, R1 comes back (preemption), a clean shutdown (priority 0), both
   routers start (election, tie-break) or the routers stop hearing each other (two Masters).
   Rules, tie-breaks and numbers: SPEC.md (RFC 9568 §6, which calls the Master "Active").
   Times are in centiseconds, the RFC's unit. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   The scene's addresses follow sims/arp-local-remote (192.168.1.0/24, A .10, B .20, gateway .1); its MAC style
   (02:00:00:…) is reused, its functions are not needed here (no ARP resolution happens in this sim). */
(function (root) {
  'use strict';

  var VIP = '192.168.1.1';
  var VMAC = '00:00:5e:00:01:01';          // RFC 9568 §7.3: 00-00-5E-00-01-{VRID}, VRID 1
  var VRRP_GROUP = '224.0.0.18';           // RFC 9568 §5.1.1.2
  var VRRP_GROUP_MAC = '01:00:5e:00:00:12';
  var BROADCAST = 'ff:ff:ff:ff:ff:ff';
  var FAR = '8.8.8.8';

  var HOSTS = [
    { id: 'A', ip: '192.168.1.10', mac: '02:00:00:aa:aa:aa', port: 1 },
    { id: 'B', ip: '192.168.1.20', mac: '02:00:00:bb:bb:bb', port: 2 }
  ];
  var ROUTERS = [
    { id: 'R1', ip: '192.168.1.2', mac: '02:00:00:00:00:02', port: 3 },
    { id: 'R2', ip: '192.168.1.3', mac: '02:00:00:00:00:03', port: 4 }
  ];
  var EVENTS = ['fail', 'restore', 'shutdown', 'start', 'cut'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function ipToInt(ip) { return ip.split('.').reduce(function (acc, o) { return acc * 256 + Number(o); }, 0); }
  function clampPrio(v, dflt) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.max(1, Math.min(254, n));     // 255 is the address owner's (rule 3); no router here owns .1
  }
  function advOf(p) { return Number(p.advInterval) === 10 ? 10 : 100; }
  function eventOf(p) { return EVENTS.indexOf(p.event) >= 0 ? p.event : 'fail'; }

  // ── rules (SPEC.md) ──

  /** Rule 2: Skew_Time = ((256 − Priority) × Master_Adver_Interval) / 256, in centiseconds. */
  function skewTime(prio, adv) { return (256 - prio) * adv / 256; }
  /** Rule 2: Master_Down_Interval = 3 × Master_Adver_Interval + Skew_Time. */
  function downInterval(prio, adv) { return 3 * adv + skewTime(prio, adv); }

  /** Rule 3: does router a win the election over b? Higher priority; equal priority → higher primary address. */
  function wins(a, b) {
    if (a.prio !== b.prio) return a.prio > b.prio;
    return ipToInt(a.ip) > ipToInt(b.ip);
  }

  /** Rules 4 and 6, a Backup hears an advertisement with priority prio (RFC 9568 §6.4.2):
      'skew'    priority 0: the Master left, set the timer to Skew_Time;
      'reset'   preempt off, or the sender's priority ≥ own: reset the timer to Master_Down_Interval;
      'discard' preempt on (or the address owner) and the sender's priority is lower: ignore it, the timer runs out. */
  function backupHears(own, prio, preempt) {
    if (prio === 0) return 'skew';
    var pre = preempt || own === 255;           // the address owner always preempts (rule 4)
    if (!pre || prio >= own) return 'reset';
    return 'discard';
  }

  /** Rule 3 and 6, a Master hears another router's advertisement (RFC 9568 §6.4.3):
      'stepdown' the sender has a higher priority, or the same and a higher address: become Backup;
      'assert'   otherwise (and priority 0): discard it and send an advertisement at once. */
  function masterHears(self, sender) {
    if (sender.prio === 0) return 'assert';
    return wins(sender, self) ? 'stepdown' : 'assert';
  }

  // ── scene ──

  function router(s, id) { return s.routers.filter(function (r) { return r.id === id; })[0]; }
  function other(id) { return id === 'R1' ? 'R2' : 'R1'; }
  function portOf(id) {
    var all = HOSTS.concat(ROUTERS);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i].port;
    return null;
  }
  function idAtPort(port) {
    var all = HOSTS.concat(ROUTERS);
    for (var i = 0; i < all.length; i++) if (all[i].port === port) return all[i].id;
    return null;
  }

  /** Who forwards A's frames to the gateway now: the router on the switch port of the virtual MAC, if it is an up
      Master; null means the frames are lost. */
  function forwarder(s) {
    var port = s.switchMac[VMAC];
    if (port === undefined || port === null) return null;
    var id = idAtPort(port);
    var r = id ? router(s, id) : null;
    return r && r.up && r.state === 'master' ? r.id : null;
  }

  /** The routers that start as Master and Backup for this event (null when nobody is Master yet). */
  function rolesOf(p) {
    var ev = eventOf(p);
    var r1 = { id: 'R1', ip: ROUTERS[0].ip, prio: clampPrio(p.prioR1, 200) };
    var r2 = { id: 'R2', ip: ROUTERS[1].ip, prio: clampPrio(p.prioR2, 100) };
    if (ev === 'start') return { m: null, k: null };
    if (ev === 'restore') return { m: 'R2', k: 'R1' };   // R1 is down at step 0: R2 took over earlier
    var m = wins(r1, r2) ? 'R1' : 'R2';
    return { m: m, k: other(m) };
  }

  /** The phases of the run for these params (SPEC.md "Steps"). The branches come from the rules, not the preset. */
  function plan(p) {
    var ev = eventOf(p), roles = rolesOf(p);
    var p1 = clampPrio(p.prioR1, 200), p2 = clampPrio(p.prioR2, 100);
    var takeover = ['expire', 'announce', 'flood'];
    switch (ev) {
      case 'fail':
        return roles.m === 'R1' ? ['advert', 'fail', 'wait'].concat(takeover, ['frame', 'summary']) : ['advert', 'fail', 'summary'];
      case 'shutdown':
        return roles.m === 'R1' ? ['advert', 'shutdown'].concat(takeover, ['frame', 'summary']) : ['advert', 'shutdown', 'summary'];
      case 'restore':
        return backupHears(p1, p2, !!p.preempt) === 'discard'
          ? ['advert', 'restore', 'wait'].concat(takeover, ['frame', 'summary'])
          : ['advert', 'restore', 'wait', 'summary'];
      case 'start':
        return ['start'].concat(takeover, ['summary']);
      case 'cut':
        return ['advert', 'cut', 'wait'].concat(takeover, ['flap', 'summary']);
    }
    return [];
  }

  function hostArp(hasEntry) {
    var out = {};
    HOSTS.forEach(function (h) { out[h.id] = hasEntry ? [{ ip: VIP, mac: VMAC, state: 'old' }] : []; });
    return out;
  }

  function freshStep(s) {
    var out = clone(s);
    out.packets = [];
    out.frame = null;
    out.flap = null;
    out.switchChanged = false;
    out.routers.forEach(function (r) { r.heard = null; r.changed = false; r.sent = null; });
    Object.keys(out.arp).forEach(function (k) { out.arp[k].forEach(function (e) { e.state = 'old'; }); });
    return out;
  }

  function startTimer(r, t, adv) {
    r.downLen = downInterval(r.prio, adv);
    r.downAt = t + r.downLen;
  }

  /** Book the gateway's state at time t: count lost time while nobody forwards, and every change of forwarder. */
  function account(s) {
    var fw = forwarder(s);
    if (fw === null && s.lostFrom === null) s.lostFrom = s.t;
    if (fw !== null && s.lostFrom !== null) { s.lost += s.t - s.lostFrom; s.lostFrom = null; }
    if (fw !== null && s.gw !== null && fw !== s.gw) s.gwChanges += 1;
    if (fw !== null) s.gw = fw;
    s.fw = fw;
  }

  /** The advertisement frame of router r with priority prio (RFC 9568 §5.1, §7.2: source MAC is the virtual MAC). */
  function advertFrame(r, prio, adv) {
    return { kind: 'advert', from: r.id, srcMac: VMAC, dstMac: VRRP_GROUP_MAC, srcIp: r.ip, dstIp: VRRP_GROUP,
      vrid: 1, prio: prio, interval: adv, vip: VIP };
  }
  function garpFrame(r) {
    return { kind: 'garp', from: r.id, srcMac: VMAC, dstMac: BROADCAST, senderIp: VIP, senderMac: VMAC, targetIp: VIP };
  }

  /** Router `to` hears an advertisement from `from` (priority prio) at time s.t. Mutates s. */
  function hear(s, toId, from, prio, adv, preempt) {
    var r = router(s, toId);
    if (!r.up) { r.heard = 'deaf'; return; }
    if (r.state === 'backup') {
      var act = backupHears(r.prio, prio, preempt);
      r.heard = act;
      if (act === 'skew') { r.downLen = skewTime(r.prio, adv); r.downAt = s.t + r.downLen; r.changed = true; }
      if (act === 'reset') startTimer(r, s.t, adv);
    } else if (r.state === 'master') {
      var act2 = masterHears(r, { prio: prio, ip: from.ip });
      r.heard = act2;
      if (act2 === 'stepdown') { r.state = 'backup'; startTimer(r, s.t, adv); r.changed = true; }
    }
  }

  var logic = {
    VIP: VIP, VMAC: VMAC, BROADCAST: BROADCAST, VRRP_GROUP: VRRP_GROUP, VRRP_GROUP_MAC: VRRP_GROUP_MAC, FAR: FAR,
    HOSTS: HOSTS, ROUTERS: ROUTERS, EVENTS: EVENTS,

    /** Parameter defaults: R1 200 is Master, R2 100 Backup; preempt on; adverts every second (100 cs). */
    defaults: { event: 'fail', prioR1: 200, prioR2: 100, preempt: true, advInterval: 100 },

    /** Steps for these params: the length of the plan (8 for the defaults). */
    steps: function (p) { return plan(p).length; },

    /** State at step 0. */
    initial: function (p) {
      var ev = eventOf(p), adv = advOf(p), roles = rolesOf(p);
      var prios = { R1: clampPrio(p.prioR1, 200), R2: clampPrio(p.prioR2, 100) };
      var routers = ROUTERS.map(function (d) {
        var up = !(ev === 'restore' && d.id === 'R1');
        var state = !up || ev === 'start' ? 'init' : d.id === roles.m ? 'master' : 'backup';
        return { id: d.id, ip: d.ip, mac: d.mac, port: d.port, prio: prios[d.id], up: up, state: state,
          downAt: null, downLen: null, heard: null, changed: false, sent: null };
      });
      var s = {
        event: ev, phase: 'start0', t: 0, plan: plan(p), m: roles.m, k: roles.k,
        routers: routers, vip: VIP, vmac: VMAC, preempt: !!p.preempt, advInterval: adv,
        switchMac: {}, flap: null, switchChanged: false,
        arp: hostArp(ev !== 'start'),
        packets: [], frame: null, cut: false,
        gw: null, fw: null, lostFrom: null, lost: 0, gwChanges: 0, discarded: 0,
        takers: [], log: [], done: false
      };
      HOSTS.forEach(function (h) { s.switchMac[h.mac] = h.port; });
      if (roles.m) s.switchMac[VMAC] = portOf(roles.m);
      // the Backup's timer runs from the last advertisement, just before t = 0
      if (roles.k && router(s, roles.k).up) startTimer(router(s, roles.k), 0, adv);
      if (ev === 'start') s.lostFrom = 0;
      else { s.gw = forwarder(s); s.fw = s.gw; }
      return s;
    },

    /** State after step n, from the state after step n - 1. */
    step: function (prev, n, p) {
      var s = freshStep(prev), adv = s.advInterval, preempt = s.preempt;
      var phase = s.plan[n - 1];
      if (!phase) throw new Error('no step ' + n);
      s.phase = phase;
      var M = s.m ? router(s, s.m) : null, K = s.k ? router(s, s.k) : null;

      switch (phase) {
        case 'advert': {                       // t = 0: the Master advertises, the other router hears it
          var f = advertFrame(M, M.prio, adv);
          s.frame = f; M.sent = 'advert';
          s.packets.push({ kind: 'advert', from: M.id, to: 'SW', prio: M.prio },
            { kind: 'advert', from: 'SW', to: K.id, prio: M.prio, drop: !K.up });
          hear(s, K.id, M, M.prio, adv, preempt);
          s.log.push({ t: s.t, kind: 'advert', who: M.id, prio: M.prio });
          break;
        }
        case 'fail': {                         // R1 fails right after its advertisement, without a word
          var r1 = router(s, 'R1');
          r1.up = false; r1.state = 'init'; r1.downAt = null; r1.downLen = null; r1.changed = true;
          s.log.push({ t: s.t, kind: 'fail', who: 'R1' });
          break;
        }
        case 'shutdown': {                     // rule 6: a Master leaving cleanly sends priority 0; a Backup just stops
          var r = router(s, 'R1');
          if (r.state === 'master') {
            s.frame = advertFrame(r, 0, adv); r.sent = 'advert0';
            s.packets.push({ kind: 'advert0', from: 'R1', to: 'SW', prio: 0 }, { kind: 'advert0', from: 'SW', to: 'R2', prio: 0 });
            r.up = false; r.state = 'init'; r.changed = true;
            hear(s, 'R2', r, 0, adv, preempt);
          } else {
            r.up = false; r.state = 'init'; r.downAt = null; r.downLen = null; r.changed = true;
          }
          s.log.push({ t: s.t, kind: 'shutdown', who: 'R1' });
          break;
        }
        case 'restore': {                      // RFC 9568 §6.4.1: a non-owner starts as Backup with its timer running
          var back = router(s, 'R1');
          back.up = true; back.state = 'backup'; back.changed = true;
          startTimer(back, s.t, adv);
          s.log.push({ t: s.t, kind: 'restore', who: 'R1' });
          break;
        }
        case 'cut': {                          // rule 7: from now on the routers do not hear each other
          s.cut = true;
          s.log.push({ t: s.t, kind: 'cut', who: null });
          break;
        }
        case 'start': {                        // both routers start: Backup, timers running (RFC 9568 §6.4.1)
          s.routers.forEach(function (x) { x.state = 'backup'; x.changed = true; startTimer(x, s.t, adv); });
          s.log.push({ t: s.t, kind: 'start', who: null });
          break;
        }
        case 'wait': {                         // three advertisement intervals later
          s.t = 3 * adv;
          var talker = s.event === 'restore' ? M : s.event === 'cut' ? M : null;
          if (talker) {
            var listener = router(s, other(talker.id));
            for (var k = 1; k <= 3; k++) {
              var at = k * adv;
              s.log.push({ t: at, kind: 'advert', who: talker.id, prio: talker.prio, lost: s.cut });
              if (s.cut) continue;              // dropped on the way: the listener's timer keeps running
              var save = s.t; s.t = at;
              hear(s, listener.id, talker, talker.prio, adv, preempt);
              s.t = save;
              if (listener.heard === 'discard') s.discarded += 1;
            }
            s.frame = advertFrame(talker, talker.prio, adv); talker.sent = 'advert';
            s.packets.push({ kind: 'advert', from: talker.id, to: 'SW', prio: talker.prio },
              { kind: 'advert', from: 'SW', to: listener.id, prio: talker.prio, drop: s.cut });
            if (s.cut) listener.heard = 'lost';
          }
          break;
        }
        case 'expire': {                       // the earliest Master_Down timer runs out: Master (rule 2)
          var backups = s.routers.filter(function (x) { return x.up && x.state === 'backup' && x.downAt !== null; });
          var first = Math.min.apply(null, backups.map(function (x) { return x.downAt; }));
          s.t = first;
          s.takers = [];
          backups.forEach(function (x) {
            if (x.downAt === first) {
              x.state = 'master'; x.downAt = null; x.downLen = null; x.changed = true;
              s.takers.push(x.id);
              s.log.push({ t: s.t, kind: 'expire', who: x.id });
            }
          });
          break;
        }
        case 'announce': {                     // rule 5: each new Master sends an advertisement and a gratuitous ARP;
          var before = s.switchMac[VMAC];       // both carry the virtual MAC as source: the switch learns the port
          var ports = [];
          s.takers.forEach(function (id) {
            var x = router(s, id);
            x.sent = 'announce';
            s.packets.push({ kind: 'announce', from: id, to: 'SW', prio: x.prio });
            s.frame = garpFrame(x);
            s.log.push({ t: s.t, kind: 'garp', who: id });
            ports.push(x.port);
          });
          s.switchMac[VMAC] = ports[ports.length - 1];
          if (ports.length > 1) s.flap = ports;  // the same MAC from two ports at once (tie at start-up)
          s.switchChanged = s.switchMac[VMAC] !== before || ports.length > 1;
          account(s);
          break;
        }
        case 'flood': {                        // the switch floods both frames: hosts refresh the same entry, the
          var senders = s.takers.slice();       // other router hears the advertisement
          senders.forEach(function (id) {
            var x = router(s, id);
            s.packets.push({ kind: 'garp', from: 'SW', to: 'A' }, { kind: 'garp', from: 'SW', to: 'B' });
            var o = router(s, other(id));
            if (o.up) s.packets.push({ kind: 'advert', from: 'SW', to: o.id, prio: x.prio, drop: s.cut });
          });
          HOSTS.forEach(function (h) {         // RFC 826 merge: an existing entry is refreshed; none is added
            s.arp[h.id].forEach(function (e) { if (e.ip === VIP) { e.mac = VMAC; e.state = 'refreshed'; } });
          });
          var asserted = [];
          senders.forEach(function (id) {
            var o = router(s, other(id));
            if (!o.up) return;
            if (s.cut) { o.heard = 'lost'; return; }
            hear(s, o.id, router(s, id), router(s, id).prio, adv, preempt);
            if (o.heard === 'assert') asserted.push(o.id);
          });
          if (senders.length > 1) {            // tie: the one that stayed Master asserts; the switch settles on it
            s.flap = null;
            asserted.forEach(function (id) {
              var x = router(s, id);
              if (x.state !== 'master') return;
              x.sent = 'advert';
              s.packets.push({ kind: 'advert', from: id, to: 'SW', prio: x.prio, second: true });
              if (s.switchMac[VMAC] !== x.port) { s.switchMac[VMAC] = x.port; s.switchChanged = true; }
            });
          }
          s.frame = advertFrame(router(s, senders[0]), router(s, senders[0]).prio, adv);
          account(s);
          break;
        }
        case 'flap': {                         // rule 7: the old Master's next advertisement pulls the MAC back
          s.t = Math.ceil((s.t + 0.001) / adv) * adv;
          var old = router(s, s.m);
          old.sent = 'advert';
          s.frame = advertFrame(old, old.prio, adv);
          s.packets.push({ kind: 'advert', from: old.id, to: 'SW', prio: old.prio },
            { kind: 'advert', from: 'SW', to: other(old.id), prio: old.prio, drop: true });
          router(s, other(old.id)).heard = 'lost';
          s.switchMac[VMAC] = old.port; s.switchChanged = true;
          s.log.push({ t: s.t, kind: 'advert', who: old.id, prio: old.prio, lost: true });
          account(s);
          break;
        }
        case 'frame': {                        // A sends to 8.8.8.8 via the gateway: dst MAC is the virtual MAC
          var to = forwarder(s);
          var A = HOSTS[0];
          s.frame = { kind: 'ip', from: 'A', srcMac: A.mac, dstMac: VMAC, srcIp: A.ip, dstIp: FAR, via: to };
          s.packets.push({ kind: 'ip', from: 'A', to: 'SW' });
          if (to) s.packets.push({ kind: 'ip', from: 'SW', to: to }, { kind: 'ip', from: to, to: 'cloud' });
          s.log.push({ t: s.t, kind: 'frame', who: to });
          break;
        }
        case 'summary': {
          account(s);
          break;
        }
      }
      if (phase !== 'announce' && phase !== 'flood' && phase !== 'flap' && phase !== 'summary') account(s);
      s.done = n >= s.plan.length;
      return s;
    },

    // pure rule functions, for tests and the page
    skewTime: skewTime,
    downInterval: downInterval,
    wins: wins,
    backupHears: backupHears,
    masterHears: masterHears,
    plan: plan,
    rolesOf: rolesOf,
    forwarder: forwarder,
    idAtPort: idAtPort,
    clampPrio: clampPrio,
    ipToInt: ipToInt
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
