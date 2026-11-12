/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-policy-routing: the rule list (RPDB) that runs before the route lookup and picks the table to look in.
   rt1 routes a LAN to two ISPs. One step is one event of one packet's decision: a rule test, the lookup in the rule's
   table (a miss goes on to the next rule), or the packet forwarded; or one command (ip route add / ip rule add) of the
   preset's script. Rules and numbers: SPEC.md (checked on a Linux 6.8 kernel).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // from sims/lnx-routing-decision/sim.js @ 104fc2f (parse, format, mask, match, lookup); models/ has no IPv4 model yet
  /** "10.1.2.55" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
  function parse(str) {
    var parts = String(str).split('.');
    if (parts.length !== 4) return null;
    var v = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = Number(parts[i]);
      if (n > 255) return null;
      v = v * 256 + n;
    }
    return v;
  }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) {
    return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
  }

  /** The mask of a prefix length: p ones from the left, then zeros. p = 0 is 0.0.0.0, p = 32 is 255.255.255.255. */
  function mask(p) {
    return p <= 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; // a shift by 32 would be a shift by 0, hence the p = 0 case
  }

  /** An entry matches when the first `prefix` bits of the destination equal those of the entry's network.
      Prefix 0 compares no bit, so the default route matches every address. */
  function match(dest, net, prefix) {
    var m = mask(prefix);
    return ((dest & m) >>> 0) === ((net & m) >>> 0);
  }

  /**
   * Route lookup (rule 3) over a table of { dst, prefix, metric }: of the routes whose prefix contains the destination,
   * the longest prefix wins; equal length, the lowest metric; equal metric, the first in table order. Returns the
   * matching indices in table order, the winner (-1: no route) and the matching indices ordered best first.
   */
  function lookup(table, destIp) {
    var dest = parse(destIp);
    var matches = [];
    table.forEach(function (r, i) { if (match(dest, parse(r.dst), r.prefix)) matches.push(i); });
    var order = matches.slice().sort(function (a, b) {
      var ra = table[a], rb = table[b];
      if (ra.prefix !== rb.prefix) return rb.prefix - ra.prefix;               // longer prefix first
      if ((ra.metric || 0) !== (rb.metric || 0)) return (ra.metric || 0) - (rb.metric || 0); // then lower metric
      return a - b;                                                            // then table order
    });
    return { dest: destIp, matches: matches, winner: order.length ? order[0] : -1, order: order };
  }
  // end of the copy from sims/lnx-routing-decision

  // ── the scene (task "Scene"; RFC 5737 documentation prefixes) ──

  var IFACES = {
    eth0: { ip: '203.0.113.10', prefix: 24, gw: '203.0.113.1', isp: 'ispA' },
    eth1: { ip: '198.51.100.10', prefix: 24, gw: '198.51.100.1', isp: 'ispB' },
    eth2: { ip: '192.168.10.1', prefix: 24, gw: null, isp: null }
  };
  var LAN = { '192.168.10.20': 'pc20', '192.168.10.30': 'pc30' };
  var SERVER = '192.0.2.80';
  /** Who sends: a LAN host comes in on eth2, rt1 sends from lo with its ISP-B address, the internet host comes in on
      eth1 (to ISP-B's address of rt1, the reply-path request). */
  var SOURCES = {
    pc20: { src: '192.168.10.20', iif: 'eth2' },
    pc30: { src: '192.168.10.30', iif: 'eth2' },
    rt1: { src: '198.51.100.10', iif: 'lo' },
    inet: { src: SERVER, iif: 'eth1' }
  };
  var ISP_GW = { '203.0.113.1': 'ispA', '198.51.100.1': 'ispB' };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function netOf(ip, prefix) { return format((parse(ip) & mask(prefix)) >>> 0); }
  /** "192.168.10.30/32" or "192.0.2.0/24" → { net, prefix }; null → null (all). A bare address is /32. */
  function prefixOf(s) {
    if (s == null) return null;
    var parts = String(s).split('/');
    return { net: parts[0], prefix: parts.length > 1 ? Number(parts[1]) : 32 };
  }
  function inPrefix(ip, s) {
    var p = prefixOf(s);
    return !p || match(parse(ip), parse(p.net), p.prefix);
  }

  // ── tables ──

  function connected(dev) {
    var i = IFACES[dev];
    return { dst: netOf(i.ip, i.prefix), prefix: i.prefix, via: null, dev: dev, type: 'unicast', proto: 'kernel', scope: 'link', src: i.ip };
  }
  /** The tables at boot (kernel listing order; SPEC.md "The scene"). Table 200 and `default` do not exist. */
  function baseTables() {
    return {
      local: ['eth2', 'eth1', 'eth0'].map(function (d) {
        return { dst: IFACES[d].ip, prefix: 32, via: null, dev: d, type: 'local', proto: 'kernel', scope: 'host', src: IFACES[d].ip };
      }),
      main: [{ dst: '0.0.0.0', prefix: 0, via: IFACES.eth0.gw, dev: 'eth0', type: 'unicast', proto: 'boot', scope: null, src: null },
        connected('eth2'), connected('eth1'), connected('eth0')],
      100: [{ dst: '0.0.0.0', prefix: 0, via: IFACES.eth1.gw, dev: 'eth1', type: 'unicast', proto: 'boot', scope: null, src: null }]
    };
  }
  /** `ip route add <dst>/<prefix> dev <dev> table <t>` (rule 6d): refused when the same route is there. A new route goes
      after the routes already in the table (kernel listing: default first, then this one). */
  function routeAdd(tables, t, r) {
    var tab = tables[t] || (tables[t] = []);
    var dup = tab.some(function (x) { return x.dst === r.dst && x.prefix === r.prefix; });
    if (dup) return false;
    tab.push({ dst: r.dst, prefix: r.prefix, via: r.via || null, dev: r.dev, type: 'unicast', proto: 'boot', scope: r.via ? null : 'link', src: null });
    return true;
  }

  /** The line `ip route show table …` prints for a route. */
  function routeLine(r) {
    var s = r.type === 'local' ? 'local ' + r.dst : (r.prefix === 0 ? 'default' : r.dst + '/' + r.prefix);
    if (r.via) s += ' via ' + r.via;
    s += ' dev ' + r.dev;
    if (r.proto && r.proto !== 'boot') s += ' proto ' + r.proto;
    if (r.scope) s += ' scope ' + r.scope;
    if (r.src) s += ' src ' + r.src;
    return s;
  }

  // ── rules ──

  function defaultRules() {
    return [
      { id: 'r0', prio: 0, from: null, to: null, iif: null, action: 'lookup', table: 'local' },
      { id: 'r32766', prio: 32766, from: null, to: null, iif: null, action: 'lookup', table: 'main' },
      { id: 'r32767', prio: 32767, from: null, to: null, iif: null, action: 'lookup', table: 'default' }
    ];
  }
  /** Rule 6b: the priority a rule added without one gets: the second rule's priority minus one, if it is not 0. */
  function autoPrio(rules) {
    return rules.length > 1 && rules[1].prio ? rules[1].prio - 1 : 0;
  }
  /** `ip rule add` (rules 6a–c): a new rule goes before the first rule with a higher priority, so after its equals;
      no priority → rule 6b; an identical rule at the same priority is refused (File exists), at a new priority it is
      added again. Returns the rule as added, or null when refused. */
  function ruleAdd(rules, r) {
    var nr = { id: null, prio: r.prio == null ? autoPrio(rules) : r.prio, from: r.from || null, to: r.to || null,
      iif: r.iif || null, action: r.action || 'lookup', table: r.action && r.action !== 'lookup' ? null : String(r.table) };
    if (rules.some(function (x) { return sameRule(x, nr) && x.prio === nr.prio; })) return null;
    var at = rules.length;
    for (var i = 0; i < rules.length; i++) if (rules[i].prio > nr.prio) { at = i; break; }
    var k = 1, base = 'r' + nr.prio;
    nr.id = base;
    while (rules.some(function (x) { return x.id === nr.id; })) nr.id = base + '-' + (++k);
    rules.splice(at, 0, nr);
    return nr;
  }
  /** Two rules with the same selector and action (the priority aside). */
  function sameRule(a, b) {
    return a.from === b.from && a.to === b.to && a.iif === b.iif && a.action === b.action && a.table === b.table;
  }
  /** The selector (rule 2): every selector the rule has must match; returns the fields that fail. */
  function selectorMiss(rule, pk) {
    var miss = [];
    if (!inPrefix(pk.src, rule.from)) miss.push('from');
    if (!inPrefix(pk.dst, rule.to)) miss.push('to');
    if (rule.iif && rule.iif !== pk.iif) miss.push('iif');
    return miss;
  }
  /** The line `ip rule` prints for a rule. */
  function ruleLine(r) {
    var s = r.prio + ':\tfrom ' + (r.from ? r.from.replace(/\/32$/, '') : 'all');
    if (r.to) s += ' to ' + r.to;
    if (r.iif) s += ' iif ' + r.iif;
    return s + ' ' + (r.action === 'lookup' ? 'lookup ' + r.table : r.action);
  }

  // ── the toggles and the scripts ──

  var RULE_FROM30 = { prio: 1000, from: '192.168.10.30/32', action: 'lookup', table: '100' };
  var RULE_900 = { prio: 900, from: '192.168.10.20/32', action: 'lookup', table: '200' };
  var RULE_BLACKHOLE = { prio: 500, to: '192.0.2.0/24', action: 'blackhole' };
  var RULE_REPLY = { from: '198.51.100.10/32', action: 'lookup', table: '100' };
  var LAN_IN_100 = { dst: '192.168.10.0', prefix: 24, dev: 'eth2' };

  /** The scripts, one per preset (SPEC.md "Presets"); `one` sends one packet from the `source` and `dst` params. */
  var SCRIPTS = {
    'two-sources': [{ k: 'send', from: 'pc20', dst: SERVER }, { k: 'send', from: 'pc30', dst: SERVER }],
    'lan-leak': [{ k: 'send', from: 'pc20', dst: IFACES.eth1.ip }, { k: 'send', from: 'rt1', dst: '192.168.10.20' },
      { k: 'routeAdd', table: '100', route: LAN_IN_100 }, { k: 'send', from: 'rt1', dst: '192.168.10.20' }],
    'empty-table': [{ k: 'send', from: 'pc20', dst: SERVER }],
    'reply-path': [{ k: 'send', from: 'inet', dst: IFACES.eth1.ip }, { k: 'send', from: 'rt1', dst: SERVER },
      { k: 'ruleAdd', rule: RULE_REPLY }, { k: 'send', from: 'rt1', dst: SERVER }],
    blackhole: [{ k: 'send', from: 'pc20', dst: SERVER }]
  };
  var SCRIPT_IDS = ['two-sources', 'lan-leak', 'empty-table', 'reply-path', 'blackhole', 'one'];

  function scriptOf(p) {
    if (p.script === 'one') return [{ k: 'send', from: p.source, dst: p.dst }];
    return SCRIPTS[p.script] || SCRIPTS['two-sources'];
  }

  /** The rules a scenario brings with it (task "Presets": rule 900 for empty-table, rule 500 for blackhole). */
  var SCRIPT_RULES = { 'empty-table': [RULE_900], blackhole: [RULE_BLACKHOLE] };

  /** The configuration at step 0 from the toggles and the scenario, in a fixed order (SPEC.md "Params"). */
  function configFor(p) {
    var rules = defaultRules(), tables = baseTables();
    if (p.ruleFrom30) ruleAdd(rules, RULE_FROM30);
    (SCRIPT_RULES[p.script] || []).forEach(function (r) { ruleAdd(rules, r); });
    if (p.replyRule) ruleAdd(rules, RULE_REPLY);
    if (p.lanInTable100) routeAdd(tables, '100', LAN_IN_100);
    return { rules: rules, tables: tables };
  }

  // ── one packet's decision ──

  /**
   * Rule 8: what happens after rt1 sends the packet out of a route. On the LAN: the host gets it (or nobody is there).
   * To an ISP: a LAN destination is lost there; a source that is the other uplink's address is filtered (BCP 38); else
   * it reaches the internet host. LAN sources pass (NAT on rt1, assumed and not drawn).
   */
  function fateOf(route, pk) {
    if (!route.via) {
      if (route.dev === 'eth2') return LAN[pk.dst] ? { fate: 'delivered', at: LAN[pk.dst] } : { fate: 'lost', at: 'lan' };
      return { fate: 'lost', at: IFACES[route.dev].isp };
    }
    var isp = ISP_GW[route.via];
    if (inPrefix(pk.dst, '192.168.10.0/24')) return { fate: 'lost', at: isp };
    var own = Object.keys(IFACES).filter(function (d) { return IFACES[d].isp === isp; })[0];
    var other = Object.keys(IFACES).some(function (d) { return d !== own && IFACES[d].isp && IFACES[d].ip === pk.src; });
    if (other) return { fate: 'filtered', at: isp };
    return { fate: 'delivered', at: pk.dst === SERVER ? 'inet' : isp };
  }

  /**
   * The whole decision for a packet on a configuration, as the events the steps show (rules 1–5, 7, 8):
   * { kind: 'rule', idx, miss, match, end } — a rule test (end: the action that ended it, rule 5);
   * { kind: 'lookup', idx, table, exists, matches, winner, order, route } — the lookup in the rule's table;
   * { kind: 'forward', idx, table, route, fate, at } — the packet sent out of the route.
   * The last event carries `outcome` and `get` (the `ip route get` line).
   */
  function decide(cfg, pk) {
    var evs = [];
    // a LAN host's own route lookup finds its link for a LAN address: the packet never reaches rt1
    if (pk.iif === 'eth2' && inPrefix(pk.dst, '192.168.10.0/24') && pk.dst !== IFACES.eth2.ip) {
      var host = LAN[pk.dst] || 'lan';
      return [{ kind: 'direct', idx: -1, outcome: { kind: 'direct', fate: host === 'lan' ? 'lost' : 'delivered', at: host, rule: -1, table: null }, get: null }];
    }
    for (var i = 0; i < cfg.rules.length; i++) {
      var r = cfg.rules[i];
      var miss = selectorMiss(r, pk);
      if (miss.length) { evs.push({ kind: 'rule', idx: i, miss: miss, match: false }); continue; }
      if (r.action !== 'lookup') {
        var err = { blackhole: 'Invalid argument', unreachable: 'Network is unreachable', prohibit: 'Permission denied' }[r.action];
        evs.push({ kind: 'rule', idx: i, miss: [], match: true, end: r.action,
          outcome: { kind: r.action, fate: r.action === 'blackhole' ? 'dropped' : 'error', at: 'rt1', rule: i, table: null },
          get: 'RTNETLINK answers: ' + err });
        return evs;
      }
      evs.push({ kind: 'rule', idx: i, miss: [], match: true });
      var tab = cfg.tables[r.table];
      var lk = tab ? lookup(tab, pk.dst) : { dest: pk.dst, matches: [], winner: -1, order: [] };
      var ev = { kind: 'lookup', idx: i, table: r.table, exists: !!tab, matches: lk.matches, winner: lk.winner, order: lk.order };
      evs.push(ev);
      if (lk.winner < 0) continue; // rule 4: no route in this table, the next rule
      var route = tab[lk.winner];
      if (route.type === 'local') {
        ev.outcome = { kind: 'local', fate: 'delivered', at: 'rt1', rule: i, table: r.table, route: lk.winner };
        ev.get = 'local ' + pk.dst + ' from ' + pk.src + ' dev lo table local';
        return evs;
      }
      var f = fateOf(route, pk);
      evs.push({ kind: 'forward', idx: i, table: r.table, route: lk.winner, via: route.via, dev: route.dev, fate: f.fate, at: f.at,
        outcome: { kind: 'forward', fate: f.fate, at: f.at, rule: i, table: r.table, route: lk.winner, via: route.via, dev: route.dev },
        get: pk.dst + ' from ' + pk.src + (route.via ? ' via ' + route.via : '') + ' dev ' + route.dev +
          (r.table !== 'main' ? ' table ' + r.table : '') + (pk.iif === 'lo' ? ' uid 0' : '') });
      // the get line belongs to the lookup step too: the decision is made there
      ev.get = evs[evs.length - 1].get;
      return evs;
    }
    // rule 4, the last rule failed as well
    var last = evs[evs.length - 1];
    last.outcome = { kind: 'noroute', fate: 'error', at: 'rt1', rule: -1, table: null };
    last.get = 'RTNETLINK answers: Network is unreachable';
    return evs;
  }

  /** The `ip route get` command line for a packet (data). */
  function getCommand(pk) {
    return 'ip route get ' + pk.dst + ' from ' + pk.src + (pk.iif !== 'lo' ? ' iif ' + pk.iif : '');
  }

  /** The marks of the rules after events 0..ev of a decision: pending, no, hit (matched, its table is next or being
      read), empty (matched, the table had no route: go on), win (decided here), skip (never read: below the decision). */
  function marksAt(rules, evs, ev) {
    var marks = rules.map(function () { return 'pending'; });
    for (var k = 0; k <= ev; k++) {
      var e = evs[k];
      if (e.kind === 'rule') marks[e.idx] = e.match ? (e.end ? 'win' : 'hit') : 'no';
      else if (e.kind === 'lookup') marks[e.idx] = e.winner < 0 ? 'empty' : 'win';
    }
    // once a rule decided, the rows below it are never read
    var w = marks.indexOf('win');
    if (w >= 0) for (var j = w + 1; j < marks.length; j++) marks[j] = 'skip';
    return marks;
  }

  // ── the steps ──

  /** The number of steps an item takes: its decision's events for a send, one for a command. */
  function eventsOf(cfg, item) {
    if (item.k !== 'send') return 1;
    return decide(cfg, packetOf(item, 0)).length;
  }
  function packetOf(item, n) {
    var s = SOURCES[item.from] || SOURCES.pc20;
    return { n: n, from: item.from, src: s.src, dst: item.dst, iif: s.iif };
  }
  /** Run a command on the configuration (changed in place). */
  function runCommand(cfg, item) {
    if (item.k === 'routeAdd') {
      var ok = routeAdd(cfg.tables, item.table, item.route);
      return { ok: ok, text: 'ip route add ' + item.route.dst + '/' + item.route.prefix + ' dev ' + item.route.dev + ' table ' + item.table,
        out: ok ? [] : ['RTNETLINK answers: File exists'], exit: ok ? 0 : 2, table: item.table, added: ok ? item.route.dst + '/' + item.route.prefix : null };
    }
    var nr = ruleAdd(cfg.rules, item.rule);
    var r = item.rule;
    var text = 'ip rule add from ' + r.from.replace(/\/32$/, '') + ' lookup ' + r.table + (r.prio != null ? ' priority ' + r.prio : '');
    if (!nr) return { ok: false, text: text, out: ['RTNETLINK answers: File exists'], exit: 2, rule: null, prio: r.prio, dup: true };
    return { ok: true, text: text, out: [], exit: 0, rule: nr.id, prio: nr.prio,
      dup: cfg.rules.filter(function (x) { return sameRule(x, nr); }).length > 1 };
  }

  function total(p) {
    var cfg = configFor(p), n = 0;
    scriptOf(p).forEach(function (item) {
      n += eventsOf(cfg, item);
      if (item.k !== 'send') runCommand(cfg, item);
    });
    return n;
  }

  /** Fill the view fields of a state from the decision of its current item at event ev. */
  function showEvent(s, evs, ev) {
    var e = evs[ev];
    s.ev = ev;
    s.phase = e.kind;
    s.ruleIdx = e.idx;
    s.marks = marksAt(s.rules, evs, ev);
    s.miss = e.kind === 'rule' ? e.miss : [];
    s.lookup = e.kind === 'lookup' ? { table: e.table, exists: e.exists, matches: e.matches, winner: e.winner, order: e.order, dest: s.packet.dst } : null;
    var rule = s.rules[e.idx];
    s.chosen = !rule || (e.kind === 'rule' && !e.match) ? null
      : { table: rule.action === 'lookup' ? rule.table : null, route: e.kind === 'lookup' ? e.winner : e.kind === 'forward' ? e.route : null };
    s.outcome = e.outcome || null;
    s.get = e.get || null;
    s.forward = e.kind === 'forward' ? { via: e.via, dev: e.dev, fate: e.fate, at: e.at }
      : e.kind === 'direct' ? { via: null, dev: null, fate: e.outcome.fate, at: e.outcome.at, direct: true } : null;
    s.end = e.end || null;
    if (e.outcome) {
      s.log = s.log.concat([{ n: s.packet.n, from: s.packet.from, src: s.packet.src, dst: s.packet.dst, prio: e.outcome.rule >= 0 ? s.rules[e.outcome.rule].prio : null,
        table: e.outcome.table, kind: e.outcome.kind, fate: e.outcome.fate, at: e.outcome.at, via: e.outcome.via || null, dev: e.outcome.dev || null }]);
    }
  }

  var logic = {
    IFACES: IFACES,
    LAN: LAN,
    SERVER: SERVER,
    SOURCES: SOURCES,
    SCRIPTS: SCRIPTS,
    SCRIPT_RULES: SCRIPT_RULES,
    SCRIPT_IDS: SCRIPT_IDS,
    parse: parse,
    format: format,
    match: match,
    lookup: lookup,
    inPrefix: inPrefix,
    baseTables: baseTables,
    defaultRules: defaultRules,
    autoPrio: autoPrio,
    ruleAdd: ruleAdd,
    routeAdd: routeAdd,
    selectorMiss: selectorMiss,
    ruleLine: ruleLine,
    routeLine: routeLine,
    configFor: configFor,
    decide: decide,
    fateOf: fateOf,
    getCommand: getCommand,
    scriptOf: scriptOf,

    /** Parameter defaults (task "Params"; `script` picks the preset's packet list). */
    defaults: { script: 'two-sources', source: 'pc20', dst: SERVER, ruleFrom30: true, lanInTable100: false, replyRule: false },

    /** Steps: every event of every packet's decision, plus one per command: 11, 13, 8, 14, 3. */
    steps: function (p) { return total(p); },

    /** Step 0: the configuration from the toggles, nothing sent yet. */
    initial: function (p) {
      var cfg = configFor(p);
      return {
        rules: cfg.rules, tables: cfg.tables,
        item: -1, ev: -1, cmd: null, packet: null, phase: 'start', ruleIdx: -1, marks: cfg.rules.map(function () { return 'pending'; }),
        miss: [], lookup: null, chosen: null, outcome: null, get: null, forward: null, end: null, run: null, getCmd: null, log: [], packets: 0,
        event: { kind: 'start', changed: [] }
      };
    },

    /** State after step n: the next event of the current packet's decision, or the next item of the script. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var script = scriptOf(p);
      var cfg = { rules: s.rules, tables: s.tables };
      // the current item still has events: show the next one
      if (s.cmd && s.cmd.k === 'send' && s.packet) {
        var evsNow = decide(cfg, s.packet);
        if (s.ev + 1 < evsNow.length) {
          showEvent(s, evsNow, s.ev + 1);
          s.event = { kind: s.phase, changed: [] };
          return s;
        }
      }
      s.item += 1;
      var item = script[s.item];
      s.cmd = item;
      s.run = null;
      if (item.k === 'send') {
        s.packets += 1;
        s.packet = packetOf(item, s.packets);
        s.getCmd = getCommand(s.packet);
        showEvent(s, decide(cfg, s.packet), 0);
        s.event = { kind: s.phase, changed: [], fresh: true };
      } else {
        var r = runCommand(cfg, item);
        s.rules = cfg.rules; s.tables = cfg.tables;
        s.packet = null; s.phase = 'change'; s.ruleIdx = -1; s.marks = s.rules.map(function () { return 'pending'; });
        s.miss = []; s.lookup = null; s.chosen = null; s.outcome = null; s.get = null; s.forward = null; s.end = null; s.getCmd = null;
        s.run = r;
        s.event = { kind: item.k, changed: item.k === 'routeAdd' ? ['table:' + item.table] : ['rules'] };
      }
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
