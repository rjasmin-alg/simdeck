/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for domains: collision and broadcast domains of a small Ethernet, found by two walks over the same scene.
   Collision domains: union-find over links, where every hub joins all its links. Broadcast domains: union-find over
   (link, VLAN) items, where hubs and switches join their items (a VLAN switch only within one VLAN) and routers join
   nothing. Rules, tie-breaks and numbers: SPEC.md (URM ch. 7, Primjer 3).
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The walks (collisionDomains,
   broadcastDomains, changedDomains) take a plain scene and hold no strings, so they can move to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var VLANS = [10, 20];

  var defaults = { layout: 'two', net1Core: 'switch', net2Edge: 'hub', router: 'router', vlans: false };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** VLANs apply only in the two-network scene, on a switch (a hub has none), with a router at the trunk's end. */
  function vlansOn(p) { return !!p.vlans && p.layout === 'two' && p.net1Core === 'switch' && p.router === 'router'; }

  /** Why the VLAN toggle has no effect ('hub', 'noRouter', 'office'), or null when it applies. */
  function vlansBlocked(p) {
    if (p.layout !== 'two') return 'office';
    if (p.net1Core !== 'switch') return 'hub';
    if (p.router !== 'router') return 'noRouter';
    return null;
  }

  /**
   * The scene for a set of params: devices { id: { kind, net, vlan } } and links [{ id, a, b, net, trunk }], in the
   * order that numbers the domains (SPEC "Scenes").
   */
  function scene(p) {
    var devices = {}, links = [];
    function dev(id, kind, net, vlan) { devices[id] = { kind: kind, net: net, vlan: vlan == null ? null : vlan }; }
    function link(a, b, net, trunk) { links.push({ id: a + '-' + b, a: a, b: b, net: net, trunk: !!trunk }); }
    var i;
    if (p.layout === 'office') {
      dev('S1', p.net1Core, 1);
      for (i = 1; i <= 10; i++) { dev('o' + i, 'host', 1); link('S1', 'o' + i, 1); }
      return { layout: 'office', devices: devices, links: links, vlans: false };
    }
    var v = vlansOn(p);
    dev('S1', p.net1Core, 1);
    dev('R', p.router, 0);
    dev('S2', 'switch', 2);
    dev('X', p.net2Edge, 2);
    for (i = 1; i <= 4; i++) { dev('a' + i, 'host', 1, v ? VLANS[i <= 2 ? 0 : 1] : null); link('S1', 'a' + i, 1); }
    link('S1', 'R', 1, v);
    link('R', 'S2', 2);
    for (i = 1; i <= 2; i++) { dev('b' + i, 'host', 2); link('S2', 'b' + i, 2); }
    link('S2', 'X', 2);
    for (i = 1; i <= 3; i++) { dev('c' + i, 'host', 2); link('X', 'c' + i, 2); }
    return { layout: 'two', devices: devices, links: links, vlans: v };
  }

  // ── union-find over indices; classes() lists each class in index order, the classes in order of their first member ──
  function makeSets(n) {
    var parent = [];
    for (var i = 0; i < n; i++) parent.push(i);
    function find(x) { while (parent[x] !== x) x = parent[x]; return x; }
    function union(x, y) {
      var a = find(x), b = find(y);
      if (a !== b) parent[b] = a;
    }
    function classes() {
      var by = {}, order = [];
      for (var i = 0; i < n; i++) {
        var r = find(i);
        if (!by[r]) { by[r] = []; order.push(r); }
        by[r].push(i);
      }
      return order.map(function (r) { return by[r]; });
    }
    return { union: union, classes: classes };
  }

  /** Links of each device, in link order. */
  function linksOf(sc) {
    var out = {};
    Object.keys(sc.devices).forEach(function (id) { out[id] = []; });
    sc.links.forEach(function (l, i) { out[l.a].push(i); out[l.b].push(i); });
    return out;
  }

  function pushOnce(arr, x) { if (arr.indexOf(x) < 0) arr.push(x); }

  /**
   * Collision domains (rules 1–3): every hub joins all its links; switches and routers join none. Each domain:
   * { links: [ids], devices: [hosts and hubs], ports: [[device, link]] for each switch or router end, net }.
   */
  function collisionDomains(sc) {
    var by = linksOf(sc);
    var sets = makeSets(sc.links.length);
    Object.keys(sc.devices).forEach(function (id) {
      if (sc.devices[id].kind !== 'hub') return;
      by[id].forEach(function (li) { sets.union(by[id][0], li); });
    });
    return sets.classes().map(function (cls) {
      var d = { links: [], devices: [], ports: [], net: sc.links[cls[0]].net };
      cls.forEach(function (li) {
        var l = sc.links[li];
        d.links.push(l.id);
        [l.a, l.b].forEach(function (end) {
          var k = sc.devices[end].kind;
          if (k === 'host' || k === 'hub') pushOnce(d.devices, end);
          else d.ports.push([end, l.id]);
        });
      });
      return d;
    });
  }

  /** The VLANs a link carries: [null] without VLANs, the host's VLAN on an access link, all of them on a trunk. */
  function vlansOfLink(sc, l) {
    if (l.trunk) return VLANS.slice();
    var va = sc.devices[l.a].vlan, vb = sc.devices[l.b].vlan;
    if (va != null) return [va];
    if (vb != null) return [vb];
    return [null];
  }

  /**
   * Broadcast domains (rules 4, 5): union-find over (link, VLAN) items. A hub, or a switch without VLANs, joins all
   * items on its links; a VLAN switch joins items of the same VLAN; routers and hosts join nothing. Each domain:
   * { items: ['link' or 'link@vlan'], links, devices (hosts, hubs, switches), edges: [[router, link, vlan]], vlan }.
   */
  function broadcastDomains(sc) {
    var items = [];
    sc.links.forEach(function (l) { vlansOfLink(sc, l).forEach(function (v) { items.push({ link: l, vlan: v }); }); });
    var sets = makeSets(items.length);
    Object.keys(sc.devices).forEach(function (id) {
      var k = sc.devices[id].kind;
      if (k !== 'hub' && k !== 'switch') return;
      var mine = [];
      items.forEach(function (it, i) { if (it.link.a === id || it.link.b === id) mine.push(i); });
      var vlanAware = sc.vlans && k === 'switch' && mine.some(function (i) { return items[i].vlan != null; });
      mine.forEach(function (i) {
        var first = mine.filter(function (j) { return !vlanAware || items[j].vlan === items[i].vlan; })[0];
        sets.union(first, i);
      });
    });
    return sets.classes().map(function (cls) {
      var d = { items: [], links: [], devices: [], edges: [], vlan: items[cls[0]].vlan };
      cls.forEach(function (i) {
        var it = items[i], l = it.link;
        d.items.push(it.vlan == null ? l.id : l.id + '@' + it.vlan);
        pushOnce(d.links, l.id);
        [l.a, l.b].forEach(function (end) {
          if (sc.devices[end].kind === 'router') d.edges.push([end, l.id, it.vlan]);
          else pushOnce(d.devices, end);
        });
      });
      return d;
    });
  }

  /** Indices of the domains in `now` with no domain of exactly the same members in `before` (SPEC "Changed"). */
  function changedDomains(before, now, key) {
    if (!before) return [];
    var seen = before.map(function (d) { return d[key].slice().sort().join(' '); });
    var out = [];
    now.forEach(function (d, i) { if (seen.indexOf(d[key].slice().sort().join(' ')) < 0) out.push(i); });
    return out;
  }

  /** Collision domains per network: { 1: n, 2: n }. */
  function perNet(cds) {
    var out = { 1: 0, 2: 0 };
    cds.forEach(function (d) { out[d.net] = (out[d.net] || 0) + 1; });
    return out;
  }

  /** Everything the page draws for one set of params. */
  function domains(p) {
    var sc = scene(p);
    var cd = collisionDomains(sc), bd = broadcastDomains(sc);
    return { layout: sc.layout, scene: sc, vlans: sc.vlans, collision: cd, broadcast: bd, perNet: perNet(cd) };
  }

  /** The state with the changes against the "before" params (null: none) marked. */
  function compare(before, p) {
    var now = domains(p);
    var was = before && before.layout === p.layout ? domains(before) : null;
    now.changedCollision = was ? changedDomains(was.collision, now.collision, 'links') : [];
    now.changedBroadcast = was ? changedDomains(was.broadcast, now.broadcast, 'items') : [];
    now.was = was ? { collision: was.collision.length, broadcast: was.broadcast.length, perNet: was.perNet } : null;
    return now;
  }

  /** Which params differ, in the defaults' order. */
  function paramsChanged(a, b) {
    if (!a) return [];
    return Object.keys(defaults).filter(function (k) { return a[k] !== b[k]; });
  }

  /**
   * Language-neutral caption choice for the change from params a (null: none) to b:
   * { key, what, where, why }. key: capTwo / capOffice (no before), capColl, capBc, capBoth, capSame.
   * what: the swap ('net1Core-switch', 'office-hub', 'vlans-on', …, or 'many'); where: the network whose collision
   * count changed ('net1', 'net2', 'office', 'both'); why: what bounds the broadcast domains ('router', 'vlan', 'none',
   * 'office').
   */
  function captionKey(a, b) {
    var now = domains(b);
    var why = b.layout === 'office' ? 'office' : now.vlans ? 'vlan' : b.router === 'router' ? 'router' : 'none';
    var ch = paramsChanged(a, b);
    if (!a || a.layout !== b.layout || !ch.length) return { key: b.layout === 'office' ? 'capOffice' : 'capTwo', what: null, where: null, why: why };
    var was = domains(a);
    var what = 'many';
    if (ch.length === 1) {
      var k = ch[0];
      if (k === 'vlans') what = 'vlans-' + (b.vlans ? 'on' : 'off');
      else what = (k === 'net1Core' && b.layout === 'office' ? 'office' : k) + '-' + b[k];
    }
    var dc = now.collision.length !== was.collision.length;
    var db = now.broadcast.length !== was.broadcast.length;
    var where = null;
    if (dc) {
      if (b.layout === 'office') where = 'office';
      else {
        var n1 = now.perNet[1] !== was.perNet[1], n2 = now.perNet[2] !== was.perNet[2];
        where = n1 && n2 ? 'both' : n1 ? 'net1' : 'net2';
      }
    }
    return { key: dc && db ? 'capBoth' : dc ? 'capColl' : db ? 'capBc' : 'capSame', what: what, where: where, why: why };
  }

  /**
   * The "before" params after a change from prev to next: a preset's own "before" when the params are exactly the
   * preset's; else the params just before the change; unchanged params keep the old one (SPEC "Before").
   */
  function nextBefore(before, prev, next, preset) {
    if (preset && same(next, withDefaults(preset.params))) return preset.before ? withDefaults(preset.before) : null;
    if (!prev) return null;
    if (!paramsChanged(prev, next).length) return before;
    return withDefaults(prev);
  }
  function same(a, b) { return !paramsChanged(a, b).length; }

  /** Presets (SPEC "Expected numbers"): the params they load and the "before" they compare with. */
  var presets = [
    { id: 'primjer-3', params: {}, before: null },
    { id: 'primjer-3b', params: { net2Edge: 'switch' }, before: {} },
    { id: 'office-hub', params: { layout: 'office', net1Core: 'hub' }, before: null },
    { id: 'no-router', params: { router: 'switch' }, before: {} },
    { id: 'vlans', params: { net2Edge: 'switch', vlans: true }, before: { net2Edge: 'switch' } }
  ];

  var logic = {
    defaults: defaults,
    VLANS: VLANS,
    presets: presets,
    /** Explorer: no steps; the state is the domains of the current params. */
    initial: function (p) { return domains(p); },
    withDefaults: withDefaults,
    vlansOn: vlansOn,
    vlansBlocked: vlansBlocked,
    scene: scene,
    collisionDomains: collisionDomains,
    broadcastDomains: broadcastDomains,
    changedDomains: changedDomains,
    domains: domains,
    compare: compare,
    paramsChanged: paramsChanged,
    captionKey: captionKey,
    nextBefore: nextBefore
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
