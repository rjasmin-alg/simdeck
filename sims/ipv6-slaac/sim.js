/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipv6-slaac: a host H joins an IPv6 link with a router R and a neighbour N. One phase per step: build the
   interface ID (modified EUI-64), form the link-local address (tentative), DAD (NS, wait RetransTimer), RS, RA, form
   the global address from the prefix option, DAD again. Rules and numbers: SPEC.md (RFC 4861, 4862, 4291, 2464).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. Addresses are written in the RFC 5952 short form. */
(function (root) {
  'use strict';

  var MACS = ['00:1a:2b:3c:4d:5e', '02:00:00:00:00:01', '00:00:5e:00:53:01'];

  /** RFC 4861 §10 and §6.2.1, RFC 4862 §5.1: the defaults this link runs with. Lifetimes in seconds. */
  var C = {
    retransTimer: 1,                 // RETRANS_TIMER 1000 ms: the DAD wait
    dupAddrDetectTransmits: 1,       // one NS per tentative address
    validLifetime: 2592000,          // AdvValidLifetime, 30 days
    preferredLifetime: 604800,       // AdvPreferredLifetime, 7 days
    routerLifetime: 1800             // AdvDefaultLifetime = 3 × MaxRtrAdvInterval (600 s)
  };

  var UNSPEC = '::', ALL_NODES = 'ff02::1', ALL_ROUTERS = 'ff02::2';
  var ROUTER = { ll: 'fe80::1', global: '2001:db8:1::1', prefix: '2001:db8:1::' };
  var N_LL = 'fe80::2';

  // ── addresses: 8 groups of 16 bits ──

  /** '2001:db8::1' → [0x2001, 0xdb8, 0, 0, 0, 0, 0, 1]. */
  function parse(str) {
    var halves = str.split('::');
    var head = halves[0] ? halves[0].split(':') : [];
    var tail = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
    var fill = halves.length > 1 ? 8 - head.length - tail.length : 0;
    var out = head.map(function (g) { return parseInt(g, 16); });
    for (var i = 0; i < fill; i++) out.push(0);
    return out.concat(tail.map(function (g) { return parseInt(g, 16); }));
  }

  /** RFC 5952 §4: lower case, no leading zeros, the longest run of two or more zero groups as :: (the first on a tie). */
  function compress(groups) {
    var best = -1, bestLen = 1, i = 0;
    while (i < 8) {
      if (groups[i] !== 0) { i++; continue; }
      var j = i;
      while (j < 8 && groups[j] === 0) j++;
      if (j - i > bestLen) { best = i; bestLen = j - i; }
      i = j;
    }
    var hex = groups.map(function (g) { return g.toString(16); });
    if (best < 0) return hex.join(':');
    return hex.slice(0, best).join(':') + '::' + hex.slice(best + bestLen).join(':');
  }

  /** All 32 hex digits, four per group: '2001:0db8:0001:0000:…'. */
  function full(groups) {
    return groups.map(function (g) { return ('000' + g.toString(16)).slice(-4); }).join(':');
  }

  function same(a, b) { return compress(parse(a)) === compress(parse(b)); }

  function hex2(b) { return ('0' + b.toString(16)).slice(-2); }

  /** Octets to groups: 8 octets → 4 groups. */
  function groupsOfOctets(oct) {
    var out = [];
    for (var i = 0; i < oct.length; i += 2) out.push(oct[i] * 256 + oct[i + 1]);
    return out;
  }

  /** RFC 4291 §2.5.1 and Appendix A, RFC 2464 §4: split the 48-bit MAC, insert ff:fe in the middle, invert the
      U/L bit (0x02 of the first octet). Every stage is returned so the page can draw it. */
  function eui64(mac) {
    var m = mac.split(':').map(function (x) { return parseInt(x, 16); });
    var inserted = m.slice(0, 3).concat([0xff, 0xfe], m.slice(3));
    var iid = inserted.slice();
    iid[0] = iid[0] ^ 0x02;
    return {
      mac: m,
      split: [m.slice(0, 3), m.slice(3)],
      inserted: inserted,
      iid: iid,
      ulBefore: (m[0] >> 1) & 1,
      ulAfter: (iid[0] >> 1) & 1,
      groups: groupsOfOctets(iid)
    };
  }

  /** prefix (its first len bits) + interface ID; null when len + 64 ≠ 128 (RFC 4862 §5.5.3 (d)). */
  function withIid(prefix, len, iidGroups) {
    if (len + 64 !== 128) return null;
    return compress(parse(prefix).slice(0, 4).concat(iidGroups));
  }

  /** RFC 4291 §2.7.1: ff02::1:ff00:0/104 + the low 24 bits of the address. */
  function solicitedNode(addr) {
    var g = parse(addr);
    return compress([0xff02, 0, 0, 0, 0, 1, 0xff00 | (g[6] & 0xff), g[7]]);
  }

  /** The solicited-node group split for display: the fixed ff02::1:ff and the low 24 bits of the address. */
  function solicitedNodeParts(addr) {
    var g = parse(addr);
    return { fixed: 'ff02::1:ff', low: hex2(g[6] & 0xff) + ':' + ('000' + g[7].toString(16)).slice(-4) };
  }

  function isLinkLocal(addr) { return (parse(addr)[0] & 0xffc0) === 0xfe80; }   // fe80::/10

  /** RFC 4862 §5.5.3 (a)–(d), in that order: the first rule that fails is the reason. */
  function prefixCheck(opt) {
    if (!opt.A) return { ok: false, reason: 'a-flag' };
    if (isLinkLocal(opt.prefix)) return { ok: false, reason: 'link-local' };
    if (opt.preferred > opt.valid) return { ok: false, reason: 'lifetimes' };
    if (opt.len + 64 !== 128) return { ok: false, reason: 'length' };
    return { ok: true, reason: null };
  }

  /** RFC 4862 §5.4.3–5.4.5: what a node probing `target` makes of the messages it heard from other nodes. An NA for
      the target, or a DAD probe (NS from ::) for the same target, means duplicate: two nodes probing at once both lose.
      An NS from a real address (address resolution) and messages about other targets are ignored. */
  function dadOutcome(target, heard) {
    for (var i = 0; i < heard.length; i++) {
      var m = heard[i];
      if (!m.target || !same(m.target, target)) continue;
      if (m.type === 'NA') return 'duplicate';
      if (m.type === 'NS' && m.src === UNSPEC) return 'duplicate';
    }
    return 'unique';
  }

  // ── the link ──

  function hAddrs(p) {
    var e = eui64(p.mac);
    return { ll: withIid('fe80::', 64, e.groups), global: withIid(ROUTER.prefix, 64, e.groups) };
  }

  /** N's and R's addresses. `duplicate` gives N the link-local or the global H is about to form (a cloned interface,
      or an address set by hand). */
  function others(p) {
    var mine = hAddrs(p);
    var n = p.duplicate === 'link-local' ? [mine.ll] : p.duplicate === 'global' ? [N_LL, mine.global] : [N_LL];
    var r = [ROUTER.ll, ROUTER.global];
    function node(id, addrs, router) {
      var groups = [ALL_NODES].concat(router ? [ALL_ROUTERS] : []);
      addrs.forEach(function (a) { var sn = solicitedNode(a); if (groups.indexOf(sn) < 0) groups.push(sn); });
      return { id: id, addrs: addrs, groups: groups, router: router };
    }
    return [node('N', n, false), node('R', r, true)];
  }

  function nodeAddrs(s, p, id) {
    if (id === 'H') return s.addrs.filter(function (a) { return a.state !== 'duplicate'; }).map(function (a) { return a.addr; });
    return others(p).filter(function (o) { return o.id === id; })[0].addrs;
  }
  function nodeGroups(s, p, id) {
    if (id === 'H') return s.groups.map(function (g) { return g.addr; });
    return others(p).filter(function (o) { return o.id === id; })[0].groups;
  }

  /** Who hears a multicast: everyone else on the link sees the frame, only the group's members take it. What each
      member does with it is `react`: owns (the target is its address), notMine, answers (a router and an RS),
      processes (H and an RA or NA), hears. */
  function deliver(s, p, m) {
    var to = ['H', 'N', 'R'].filter(function (id) { return id !== m.from; });
    var members = to.filter(function (id) { return nodeGroups(s, p, id).indexOf(m.dst) >= 0; });
    var react = {};
    to.forEach(function (id) {
      if (members.indexOf(id) < 0) { react[id] = 'notMember'; return; }
      if (m.type === 'NS') react[id] = nodeAddrs(s, p, id).some(function (a) { return same(a, m.target); }) ? 'owns' : 'notMine';
      else if (m.type === 'RS') react[id] = id === 'R' ? 'answers' : 'hears';
      else react[id] = id === 'H' ? 'processes' : 'hears';
    });
    return { to: to, members: members, react: react };
  }

  function raOption(p) {
    return { prefix: ROUTER.prefix, len: p.prefixLen, L: true, A: p.aFlag, valid: C.validLifetime, preferred: C.preferredLifetime };
  }

  // ── steps ──

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function last(list) { return list[list.length - 1]; }

  function addMsg(s, p, m) {
    m.n = s.msgs.length + 1;
    m.t = s.t;
    var d = deliver(s, p, m);
    m.to = d.to; m.members = d.members; m.react = d.react;
    s.msgs.push(m);
    s.rows.push({ kind: 'msg', n: m.n });
    return m;
  }
  function addNote(s, what, addr) { s.rows.push({ kind: 'note', lane: 'H', what: what, addr: addr || null, t: s.t }); }

  function addrOf(s, addr) { return s.addrs.filter(function (a) { return a.addr === addr; })[0]; }

  /** opt: the RA's prefix option the address comes from (its lifetimes); none for the link-local (infinite: null). */
  function form(s, addr, scope, opt) {
    s.addrs.push({ addr: addr, scope: scope, state: 'tentative', valid: opt ? opt.valid : null, preferred: opt ? opt.preferred : null });
    var joined = [];
    if (!s.groups.some(function (g) { return g.addr === ALL_NODES; })) { s.groups.push({ addr: ALL_NODES, kind: 'all-nodes' }); joined.push(ALL_NODES); }
    var sn = solicitedNode(addr);
    if (!s.groups.some(function (g) { return g.addr === sn; })) { s.groups.push({ addr: sn, kind: 'solicited' }); joined.push(sn); }
    s.joined = joined;
    s.probe = addr;
    s.changed = [addr];
    addNote(s, 'formed', addr);
  }

  var phases = {
    // the interface-ID-only scene (eui64)
    split: function (s) { s.stage = 1; s.next = 'insert'; },
    insert: function (s) { s.stage = 2; s.next = 'flip'; },
    flip: function (s) { s.stage = 3; s.next = 'compare'; },
    compare: function (s) { s.stage = 4; s.next = null; },

    // the link
    iid: function (s, p) { s.iid = full(eui64(p.mac).groups); s.stage = 3; s.next = 'll'; },
    ll: function (s, p) { form(s, hAddrs(p).ll, 'link'); s.next = 'dadNs'; },
    dadNs: function (s, p) {
      var m = addMsg(s, p, { type: 'NS', from: 'H', src: UNSPEC, dst: solicitedNode(s.probe), target: s.probe });
      s.timers.push({ lane: 'H', from: s.rows.length - 1, to: null, end: null });   // RetransTimer
      var owners = m.members.filter(function (id) { return m.react[id] === 'owns'; });
      s.next = owners.length ? 'dadNa' : 'dadOk';
    },
    dadNa: function (s, p) {
      var ns = s.msgs[s.msgs.length - 1];
      var owner = ns.members.filter(function (id) { return ns.react[id] === 'owns'; })[0];
      // RFC 4861 §7.2.4: the NS came from ::, so the answer goes to all-nodes with S = 0
      var na = addMsg(s, p, { type: 'NA', from: owner, src: s.probe, dst: ALL_NODES, target: s.probe, flags: { S: false, O: true } });
      last(s.timers).to = s.rows.length - 1; last(s.timers).end = 'stopped';
      var a = addrOf(s, s.probe);
      a.state = dadOutcome(s.probe, [na]);   // 'duplicate'
      s.dupOf = owner;
      s.changed = [a.addr];
      s.joined = [];
      if (a.scope === 'link') { s.ipv6 = false; s.outcome = 'llDuplicate'; }   // RFC 4862 §5.4.5: stop IPv6
      else s.outcome = 'globalDuplicate';
      s.probe = null;
      s.next = null;
    },
    dadOk: function (s) {
      s.t += C.retransTimer;
      var a = addrOf(s, s.probe);
      if (dadOutcome(a.addr, []) === 'unique') a.state = 'preferred';   // nothing heard in RetransTimer
      addNote(s, 'preferred', a.addr);
      last(s.timers).to = s.rows.length - 1; last(s.timers).end = 'expired';
      s.changed = [a.addr];
      s.joined = [];
      s.next = a.scope === 'link' ? 'rs' : 'ready';
      s.probe = null;
    },
    rs: function (s, p) {
      s.changed = [];
      addMsg(s, p, { type: 'RS', from: 'H', src: hAddrs(p).ll, dst: ALL_ROUTERS });
      s.next = 'ra';
    },
    ra: function (s, p) {
      var opt = raOption(p);
      addMsg(s, p, { type: 'RA', from: 'R', src: ROUTER.ll, dst: ALL_NODES, prefix: opt,
        flags: { M: !p.aFlag, O: false }, routerLifetime: C.routerLifetime });   // M = 1 with A = 0: the a-off preset
      s.defaultRouter = { addr: ROUTER.ll, lifetime: C.routerLifetime };   // RFC 4861 §6.3.4: router lifetime ≠ 0
      s.changed = ['router'];
      var check = prefixCheck(opt);
      s.prefixCheck = check;
      s.next = check.ok ? 'gua' : 'noAddr';
    },
    gua: function (s, p) { form(s, withIid(ROUTER.prefix, p.prefixLen, eui64(p.mac).groups), 'global', raOption(p)); s.next = 'dadNs'; },
    noAddr: function (s) {
      // only (a) and (d) can fail here: R's prefix is global and its preferred lifetime is below the valid one
      s.outcome = { 'a-flag': 'noAFlag', length: 'noLength' }[s.prefixCheck.reason];
      s.changed = [];
      addNote(s, 'noAddr', null);
      s.next = null;
    },
    ready: function (s) { s.outcome = 'ready'; s.changed = []; s.next = null; }
  };

  var logic = {
    MACS: MACS,
    C: C,
    ROUTER: ROUTER,
    N_LL: N_LL,
    UNSPEC: UNSPEC,
    ALL_NODES: ALL_NODES,
    ALL_ROUTERS: ALL_ROUTERS,

    /** Parameter defaults. iidOnly: only the interface ID is built (the eui64 preset), not the whole link. */
    defaults: { iidOnly: false, mac: MACS[0], prefixLen: 64, aFlag: true, duplicate: 'none' },

    /** Steps for these params: the run until no phase is left (join 10, dad-fail 9, prefix-56 and a-off 7, eui64 4). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.next && n < 20) s = logic.step(s, ++n, p);
      return n;
    },

    /** State at step 0: H's interface is up and has no IPv6 address. */
    initial: function (p) {
      return {
        mode: p.iidOnly ? 'iid' : 'link', phase: 'start', next: p.iidOnly ? 'split' : 'iid', t: 0, stage: 0,
        iid: null, addrs: [], groups: [], joined: [], defaultRouter: null, msgs: [], rows: [], timers: [],
        probe: null, prefixCheck: null, dupOf: null, ipv6: true, outcome: null, changed: []
      };
    },

    /** State after step n: the next phase applied to a copy of the state after step n - 1. */
    step: function (prev, n, p) {
      var s = copy(prev);
      if (!s.next) return s;
      s.phase = s.next;
      phases[s.phase](s, p);
      return s;
    },

    parse: parse,
    compress: compress,
    full: full,
    hex2: hex2,
    eui64: eui64,
    withIid: withIid,
    solicitedNode: solicitedNode,
    solicitedNodeParts: solicitedNodeParts,
    isLinkLocal: isLinkLocal,
    prefixCheck: prefixCheck,
    dadOutcome: dadOutcome,
    hAddrs: hAddrs,
    others: others,
    raOption: raOption
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
