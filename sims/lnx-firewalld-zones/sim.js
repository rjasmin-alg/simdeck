/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-firewalld-zones: which zone a packet enters, and what that zone does with it. The zone comes from a
   source binding that contains the packet's source address, else from the incoming interface's binding, else it is
   the default zone; bindings are read in dispatch order (ingress priority, sources before interfaces, zone name).
   In the zone, a listed service or port accepts; otherwise the zone's target decides. Rules and numbers: SPEC.md.
   Builds on lnx-netfilter-path only in vocabulary (the packet card, accept / reject / drop); the zone picker is new.
   Scenario 'win' (preset task win-firewall-profiles) is a second, opt-in flow: Windows Firewall profiles picked per
   network connection; the firewalld scenarios do not touch it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The host's interfaces: address and network (SPEC.md "Scene"). */
  var IFACES = {
    enp1s0: { addr: '192.168.122.57', net: '192.168.122.0/24' },
    enp2s0: { addr: '10.20.0.1', net: '10.20.0.0/24' }
  };
  var IFACE_IDS = Object.keys(IFACES);
  /** The senders: address → host id (the page names them). */
  var HOSTS = { '192.168.122.186': 'democli1', '192.168.122.20': 'admin', '10.20.0.9': 'outside' };
  var SOURCES = Object.keys(HOSTS);
  /** What the student can send: a port/protocol, or an ICMP echo request. */
  var DPORTS = ['22/tcp', '8991/tcp', '9090/tcp', 'icmp'];

  /** Service definitions, as --info-service prints their ports (SPEC.md). */
  var SERVICE_DEFS = {
    cockpit: ['9090/tcp'],
    'dhcpv6-client': ['546/udp'],
    mdns: ['5353/udp'],
    'samba-client': ['137/udp', '138/udp'],
    ssh: ['22/tcp']
  };
  var TARGETS = ['default', 'ACCEPT', 'REJECT', 'DROP'];

  /** The scenarios: the configuration at step 0 and the one command at step 4 (SPEC.md "Scenarios"). */
  var SCENARIOS = {
    book: { enp2s0: null, cmd: { op: 'add-port', zone: null, arg: '8991/tcp' } },
    'by-source': { enp2s0: null, cmd: { op: 'add-source', zone: 'trusted', arg: '192.168.122.20/32' } },
    'drop-vs-block': { enp2s0: 'drop', cmd: { op: 'change-interface', zone: 'block', arg: 'enp2s0' } },
    'default-zone': { enp2s0: null, cmd: { op: 'set-default-zone', zone: 'home', arg: null } }
  };
  var SCENARIO_IDS = Object.keys(SCENARIOS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function zoneOf(target, services, ports) {
    return { target: target, prio: 0, services: services || [], ports: ports || [], sources: [], interfaces: [] };
  }

  /** The firewall at step 0: the book's public zone with enp1s0 (default), four more zones of the stock set. */
  function firewallOf(scenario) {
    var sc = SCENARIOS[scenario] || SCENARIOS.book;
    var zones = {
      block: zoneOf('REJECT'),
      drop: zoneOf('DROP'),
      home: zoneOf('default', ['cockpit', 'dhcpv6-client', 'mdns', 'samba-client', 'ssh']),
      'public': zoneOf('default', ['cockpit', 'dhcpv6-client', 'ssh'], ['514/tcp']),
      trusted: zoneOf('ACCEPT')
    };
    zones['public'].interfaces.push('enp1s0');
    if (sc.enp2s0) zones[sc.enp2s0].interfaces.push('enp2s0');
    return { zones: zones, defaultZone: 'public' };
  }

  // ── addresses ──

  function ipNum(a) { return String(a).split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }
  /** Is address a in prefix 'net/len' (a bare address is /32)? */
  function inNet(a, net) {
    var f = String(net).split('/'), len = f.length > 1 ? Number(f[1]) : 32;
    var size = Math.pow(2, 32 - len);
    return Math.floor(ipNum(a) / size) === Math.floor(ipNum(f[0]) / size);
  }
  /** The interface a packet from this source comes in on: the one whose network contains it. */
  function iifOf(src) {
    for (var i = 0; i < IFACE_IDS.length; i++) if (inNet(src, IFACES[IFACE_IDS[i]].net)) return IFACE_IDS[i];
    return null;
  }
  function packetOf(src, dport) {
    var iif = iifOf(src);
    var icmp = dport === 'icmp';
    return { src: src, iif: iif, dst: iif ? IFACES[iif].addr : null, proto: icmp ? 'icmp' : dport.split('/')[1],
      dport: icmp ? null : Number(dport.split('/')[0]), spec: dport };
  }

  // ── rules 1–3: bindings and the zone choice ──

  function byName(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /**
   * Every binding in dispatch order (rule 3): lower ingress priority first; at equal priority sources before
   * interfaces; then by zone name; then by the bound value (it never decides: a value is in one zone only).
   */
  function bindings(fw) {
    var out = [];
    Object.keys(fw.zones).forEach(function (name) {
      var z = fw.zones[name];
      z.sources.forEach(function (v) { out.push({ kind: 'source', value: v, zone: name, prio: z.prio }); });
      z.interfaces.forEach(function (v) { out.push({ kind: 'interface', value: v, zone: name, prio: z.prio }); });
    });
    out.sort(function (a, b) {
      return a.prio - b.prio || (a.kind === b.kind ? 0 : a.kind === 'source' ? -1 : 1) ||
        byName(a.zone, b.zone) || byName(a.value, b.value);
    });
    return out;
  }

  /** Does one binding contain the packet? A source binding by prefix, an interface binding by name. */
  function bindingHit(b, pkt) { return b.kind === 'source' ? inNet(pkt.src, b.value) : b.value === pkt.iif; }

  /**
   * The zone for a packet (rule 2): the first binding in dispatch order that contains it, else the default zone.
   * Returns { zone, row (index into rows, -1 = the default zone), kind, rows, hits (per row, up to the decider) }.
   */
  function pickZone(fw, pkt) {
    var rows = bindings(fw), hits = [];
    for (var i = 0; i < rows.length; i++) {
      var hit = bindingHit(rows[i], pkt);
      hits.push(hit);
      if (hit) return { zone: rows[i].zone, row: i, kind: rows[i].kind, rows: rows, hits: hits };
    }
    return { zone: fw.defaultZone, row: -1, kind: 'default', rows: rows, hits: hits };
  }

  // ── rules 4–5: the zone's lists, then its target ──

  /**
   * The verdict of a zone for a packet: { verdict: 'accept' | 'reject' | 'drop', by: 'service' | 'port' | 'target',
   * item: the matching service or port (null for the target), target }.
   */
  function judge(zone, pkt) {
    if (pkt.proto !== 'icmp') {
      for (var i = 0; i < zone.services.length; i++) {
        var def = SERVICE_DEFS[zone.services[i]] || [];
        if (def.indexOf(pkt.spec) >= 0) return { verdict: 'accept', by: 'service', item: zone.services[i], target: zone.target };
      }
      if (zone.ports.indexOf(pkt.spec) >= 0) return { verdict: 'accept', by: 'port', item: pkt.spec, target: zone.target };
    }
    var v;
    if (zone.target === 'ACCEPT') v = 'accept';
    else if (zone.target === 'DROP') v = 'drop';
    else if (zone.target === 'REJECT') v = 'reject';
    else v = pkt.proto === 'icmp' ? 'accept' : 'reject'; // default: ICMP accepted, everything else rejected
    return { verdict: v, by: 'target', item: null, target: zone.target };
  }

  /** What the client sees (rule 6): 'answer' | 'unreach' | 'timeout', per verdict. */
  function clientOf(verdict) { return verdict === 'accept' ? 'answer' : verdict === 'reject' ? 'unreach' : 'timeout'; }

  // ── configuration commands ──

  /** The zone that holds a binding of this kind and value, or null. */
  function holderOf(fw, kind, value) {
    var key = kind === 'source' ? 'sources' : 'interfaces';
    var names = Object.keys(fw.zones);
    for (var i = 0; i < names.length; i++) if (fw.zones[names[i]][key].indexOf(value) >= 0) return names[i];
    return null;
  }

  /**
   * Apply one command to a firewall (a copy is returned). cmd: { op, zone (null = the default zone), arg }.
   * Returns { fw, zone (the zone it acted on), refused: null | 'ZONE_CONFLICT' | 'ALREADY_ENABLED', moved (the zone an
   * interface left, or the old default zone), changed: marks for the page }.
   */
  function apply(fw0, cmd) {
    var fw = clone(fw0);
    var name = cmd.zone || fw.defaultZone;
    var z = fw.zones[name];
    var out = { fw: fw, zone: name, refused: null, moved: null, changed: [] };
    if (cmd.op === 'add-port') {
      if (z.ports.indexOf(cmd.arg) >= 0) out.refused = 'ALREADY_ENABLED';
      else { z.ports.push(cmd.arg); out.changed.push('port:' + cmd.arg); }
    } else if (cmd.op === 'add-source') {
      var holder = holderOf(fw, 'source', cmd.arg);
      if (holder === name) out.refused = 'ALREADY_ENABLED';
      else if (holder) { out.refused = 'ZONE_CONFLICT'; out.moved = holder; }
      else { z.sources.push(cmd.arg); out.changed.push('source:' + cmd.arg); }
    } else if (cmd.op === 'change-interface') {
      var from = holderOf(fw, 'interface', cmd.arg);
      if (from === name) out.refused = 'ALREADY_ENABLED';
      else {
        if (from) fw.zones[from].interfaces = fw.zones[from].interfaces.filter(function (x) { return x !== cmd.arg; });
        z.interfaces.push(cmd.arg);
        out.moved = from;
        out.changed.push('interface:' + cmd.arg);
      }
    } else if (cmd.op === 'set-default-zone') {
      if (fw.defaultZone === name) out.refused = 'ALREADY_ENABLED';
      else { out.moved = fw.defaultZone; fw.defaultZone = name; out.changed.push('default'); }
    }
    return out;
  }

  /** Interfaces in no zone: they use the default zone (rule 3). */
  function unbound(fw) { return IFACE_IDS.filter(function (i) { return !holderOf(fw, 'interface', i); }); }

  // ── steps ──

  var STEPS = 7;
  /** The phase of step n: a packet (1–3), the command (4), the same packet again (5–7). */
  var PHASES = ['idle', 'arrived', 'zoned', 'judged', 'config', 'arrived', 'zoned', 'judged'];

  function initial(p) {
    var fw = firewallOf(p.scenario);
    return { zones: fw.zones, defaultZone: fw.defaultZone, scenario: SCENARIOS[p.scenario] ? p.scenario : 'book',
      phase: 'idle', round: 0, packet: null, pick: null, zone: null, check: null, verdict: null, client: null,
      cmd: null, changed: [], event: { kind: 'start' } };
  }

  function step(s0, n, p) {
    var s = clone(s0);
    var phase = PHASES[n] || 'judged';
    s.phase = phase;
    s.changed = [];
    var fw = { zones: s.zones, defaultZone: s.defaultZone };
    if (phase === 'arrived') {
      s.round = n < 4 ? 1 : 2;
      s.packet = packetOf(p.source, p.dport);
      s.pick = null; s.zone = null; s.check = null; s.verdict = null; s.client = null;
      s.event = { kind: 'arrived' };
    } else if (phase === 'zoned') {
      var pk = pickZone(fw, s.packet);
      s.pick = { row: pk.row, kind: pk.kind, hits: pk.hits };
      s.zone = pk.zone;
      s.changed = ['pick'];
      s.event = { kind: 'zoned', by: pk.kind };
    } else if (phase === 'judged') {
      s.check = judge(s.zones[s.zone], s.packet);
      s.verdict = s.check.verdict;
      s.client = clientOf(s.verdict);
      s.changed = ['check'];
      s.event = { kind: 'judged', by: s.check.by };
    } else if (phase === 'config') {
      var cmd = clone(SCENARIOS[s.scenario].cmd);
      var r = apply(fw, cmd);
      s.zones = r.fw.zones;
      s.defaultZone = r.fw.defaultZone;
      s.cmd = { op: cmd.op, zone: r.zone, arg: cmd.arg, explicit: !!cmd.zone, refused: r.refused, moved: r.moved };
      s.packet = null; s.pick = null; s.check = null; s.verdict = null; s.client = null;
      s.zone = r.zone;
      s.changed = r.changed;
      s.event = { kind: 'config', op: cmd.op };
    }
    return s;
  }


  // ── the Windows flow (preset task win-firewall-profiles; SPEC.md "Windows profiles") ──
  // Opt-in: scenario 'win' hands initial, step and steps to it; every other scenario is the firewalld flow above,
  // unchanged. A profile is picked per network connection when the laptop joins a network (rule W2), not per packet;
  // each packet is judged by the profile of the adapter it arrives on (W3), by the rules enabled for that profile (W4).

  var WIN_DOMAIN = 'quillmoor.example';
  var WIN_HOST = 'PC07';
  /**
   * The networks PC07 can join (derived): PC07's address there, the network, prefixes routed through it (the VPN
   * reaches the office), the category it was given (null: a new network, never given one) and whether a domain
   * controller of the joined domain is reachable and authenticated through it.
   */
  var WIN_NETS = {
    office: { addr: '10.10.20.57', net: '10.10.20.0/24', routes: [], category: null, dcReachable: true },
    home: { addr: '192.168.1.23', net: '192.168.1.0/24', routes: [], category: 'private', dcReachable: false },
    cafe: { addr: '172.20.5.77', net: '172.20.5.0/24', routes: [], category: null, dcReachable: false },
    vpn: { addr: '10.10.250.7', net: '10.10.250.0/24', routes: ['10.10.0.0/16'], category: null, dcReachable: true }
  };
  var WIFI_NETS = ['office', 'home', 'cafe'];
  /** The senders: address → host id. The colleague PC12 sits in the office; at home a family PC; in the café a guest. */
  var WIN_HOSTS = { '10.10.20.31': 'pc12', '192.168.1.40': 'homepc', '172.20.5.14': 'guest' };
  /** Who sends from the Wi-Fi network PC07 is on. */
  var WIFI_SENDER = { office: '10.10.20.31', home: '192.168.1.40', cafe: '172.20.5.14' };
  /** Through the VPN the colleague in the office sends. */
  var VPN_SENDER = '10.10.20.31';
  var WPORTS = ['445/tcp', '3389/tcp', 'icmp'];
  var PROFILES = ['domain', 'private', 'public'];
  /** Every profile: inbound connections that match no rule are blocked, outbound allowed (Windows defaults, check). */
  var PROFILE_DEFAULTS = { inbound: 'block', outbound: 'allow' };
  /** Inbound allow rules and the profiles each is enabled for (derived rule set, SPEC.md). */
  var WIN_RULES = [
    { id: 'smb', spec: '445/tcp', profiles: ['domain', 'private'] },
    { id: 'echo', spec: 'icmp', profiles: ['domain', 'private'] },
    { id: 'rdp', spec: '3389/tcp', profiles: ['domain'] }
  ];
  /** The rows of the profile picker (rule W2), read top down; the implicit last row is a new network → public. */
  var DETECT_ROWS = [
    { id: 'dc', profile: 'domain' },
    { id: 'private', profile: 'private' },
    { id: 'public', profile: 'public' }
  ];

  function isWin(p) { return !!p && p.scenario === 'win'; }
  function wifiOf(p) { return WIFI_NETS.indexOf(p.wifi) >= 0 ? p.wifi : 'office'; }
  /** The VPN is used only away from the office (in the office the domain controller is reachable directly). */
  function vpnOn(p) { return !!p.vpn && wifiOf(p) !== 'office'; }
  function wportOf(p) { return WPORTS.indexOf(p.wport) >= 0 ? p.wport : '445/tcp'; }

  /** PC07's adapters for these params: Wi-Fi, plus the VPN adapter when it is on. */
  function adaptersOf(p) {
    var out = [{ name: 'Wi-Fi', network: wifiOf(p) }];
    if (vpnOn(p)) out.push({ name: 'VPN', network: 'vpn' });
    return out.map(function (a) {
      var n = WIN_NETS[a.network];
      return { name: a.name, network: a.network, addr: n.addr, category: n.category, dcReachable: n.dcReachable, profile: null };
    });
  }

  /**
   * The profile of one adapter (rule W2): the first detection row that holds, else the implicit row (a new network).
   * Returns { profile, row (index into DETECT_ROWS, -1 = the implicit row), hits (per row read, up to the decider) }.
   */
  function pickProfile(a) {
    var hits = [];
    for (var i = 0; i < DETECT_ROWS.length; i++) {
      var r = DETECT_ROWS[i];
      var hit = r.id === 'dc' ? !!a.dcReachable : a.category === r.id;
      hits.push(hit);
      if (hit) return { profile: r.profile, row: i, hits: hits };
    }
    return { profile: 'public', row: -1, hits: hits };
  }

  /** The adapter a packet from src comes in on: the one whose network, or a prefix routed through it, contains src. */
  function winIif(adapters, src) {
    for (var i = 0; i < adapters.length; i++) if (inNet(src, WIN_NETS[adapters[i].network].net)) return i;
    for (var j = 0; j < adapters.length; j++) {
      var routes = WIN_NETS[adapters[j].network].routes;
      for (var k = 0; k < routes.length; k++) if (inNet(src, routes[k])) return j;
    }
    return -1;
  }
  function winPacketOf(adapters, src, wport) {
    var i = winIif(adapters, src), icmp = wport === 'icmp';
    return { src: src, iif: i >= 0 ? adapters[i].name : null, adapter: i, dst: i >= 0 ? adapters[i].addr : null,
      proto: icmp ? 'icmp' : wport.split('/')[1], dport: icmp ? null : Number(wport.split('/')[0]), spec: wport };
  }

  /**
   * The verdict of a profile for a packet (rule W4): an inbound rule enabled for the profile that matches the packet
   * allows it; otherwise the profile's inbound default (block) drops it without a reply. Returns { verdict, by:
   * 'rule' | 'default', item (the deciding rule's id), lines: per rule { id, match (protocol and port), enabled (for
   * this profile) } }.
   */
  function judgeProfile(profile, pkt) {
    var lines = WIN_RULES.map(function (r) {
      return { id: r.id, match: r.spec === pkt.spec, enabled: r.profiles.indexOf(profile) >= 0 };
    });
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].match && lines[i].enabled) return { verdict: 'accept', by: 'rule', item: lines[i].id, profile: profile, lines: lines };
    }
    return { verdict: PROFILE_DEFAULTS.inbound === 'block' ? 'drop' : 'accept', by: 'default', item: null, profile: profile, lines: lines };
  }

  /** The steps for these params: each adapter connects (one step each), then each packet in three steps. */
  function winPlan(p) {
    var ads = adaptersOf(p), out = [];
    ads.forEach(function (a, i) { out.push({ phase: 'connect', adapter: i }); });
    var senders = [WIFI_SENDER[wifiOf(p)]];
    if (vpnOn(p)) senders.push(VPN_SENDER);
    senders.forEach(function (src, r) {
      out.push({ phase: 'arrived', round: r + 1, src: src });
      out.push({ phase: 'checked', round: r + 1 });
      out.push({ phase: 'judged', round: r + 1 });
    });
    return out;
  }
  function winSteps(p) { return winPlan(p).length; }

  function winInitial(p) {
    return { scene: 'win', scenario: 'win', wifi: wifiOf(p), vpn: vpnOn(p), adapters: adaptersOf(p), rounds: vpnOn(p) ? 2 : 1,
      phase: 'idle', round: 0, focus: -1, packet: null, pick: null, profile: null, check: null, verdict: null,
      client: null, changed: [], event: { kind: 'start' } };
  }

  function winStep(s0, n, p) {
    var s = clone(s0);
    var plan = winPlan(p);
    var at = plan[n - 1] || plan[plan.length - 1];
    s.phase = at.phase;
    s.changed = [];
    if (at.phase === 'connect') {
      var a = s.adapters[at.adapter];
      var pk = pickProfile(a);
      a.profile = pk.profile;
      s.focus = at.adapter;
      s.pick = pk;
      s.profile = pk.profile;
      s.packet = null; s.check = null; s.verdict = null; s.client = null;
      s.changed = ['adapter:' + at.adapter, 'pick'];
      s.event = { kind: 'connect', adapter: at.adapter, row: pk.row };
    } else if (at.phase === 'arrived') {
      s.round = at.round;
      s.packet = winPacketOf(s.adapters, at.src, wportOf(p));
      s.focus = s.packet.adapter;
      // the profile was chosen when the adapter connected; the packet only looks it up (rule W3)
      s.pick = s.focus >= 0 ? pickProfile(s.adapters[s.focus]) : null;
      s.profile = s.focus >= 0 ? s.adapters[s.focus].profile : null;
      s.check = null; s.verdict = null; s.client = null;
      s.changed = ['profile'];
      s.event = { kind: 'arrived' };
    } else if (at.phase === 'checked') {
      s.check = judgeProfile(s.profile, s.packet);
      s.changed = ['check'];
      s.event = { kind: 'checked', by: s.check.by };
    } else if (at.phase === 'judged') {
      s.verdict = s.check.verdict;
      s.client = clientOf(s.verdict);
      s.changed = ['verdict'];
      s.event = { kind: 'judged', verdict: s.verdict };
    }
    return s;
  }

  var logic = {
    /** Parameter defaults (task: source .186, 8991/tcp); wifi, vpn and wport belong to the Windows flow. */
    defaults: { scenario: 'book', source: '192.168.122.186', dport: '8991/tcp', wifi: 'office', vpn: false, wport: '445/tcp' },

    /** The packet, one command, the same packet again: 3 + 1 + 3 in every firewalld scenario; Windows: winPlan. */
    steps: function (p) { return isWin(p) ? winSteps(p) : STEPS; },

    initial: function (p) { return isWin(p) ? winInitial(p) : initial(p); },
    step: function (s, n, p) { return isWin(p) ? winStep(s, n, p) : step(s, n, p); },

    // pure helpers, for the page and the tests
    IFACES: IFACES, IFACE_IDS: IFACE_IDS, HOSTS: HOSTS, SOURCES: SOURCES, DPORTS: DPORTS, SERVICE_DEFS: SERVICE_DEFS,
    TARGETS: TARGETS, SCENARIOS: SCENARIOS, SCENARIO_IDS: SCENARIO_IDS, PHASES: PHASES,
    firewallOf: firewallOf, inNet: inNet, iifOf: iifOf, packetOf: packetOf, bindings: bindings, bindingHit: bindingHit,
    pickZone: pickZone, judge: judge, clientOf: clientOf, apply: apply, holderOf: holderOf, unbound: unbound,
    STEPS: STEPS,

    // the Windows flow
    WIN_DOMAIN: WIN_DOMAIN, WIN_HOST: WIN_HOST, WIN_NETS: WIN_NETS, WIFI_NETS: WIFI_NETS, WIN_HOSTS: WIN_HOSTS,
    WIFI_SENDER: WIFI_SENDER, VPN_SENDER: VPN_SENDER, WPORTS: WPORTS, PROFILES: PROFILES, PROFILE_DEFAULTS: PROFILE_DEFAULTS,
    WIN_RULES: WIN_RULES, DETECT_ROWS: DETECT_ROWS,
    isWin: isWin, vpnOn: vpnOn, adaptersOf: adaptersOf, pickProfile: pickProfile, winIif: winIif, winPacketOf: winPacketOf,
    judgeProfile: judgeProfile, winPlan: winPlan
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
