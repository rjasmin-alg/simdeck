/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-netns-veth-bridge: how container networking is wired by hand. One step is one command from the
   preset's script (ip netns, ip link, ip addr, ip route, sysctl, an nftables masquerade rule) or a ping, which shows
   where the packet stops and why. Interfaces are objects that live in exactly one network namespace; a veth pair is
   two linked ends; a bridge forwards frames between its ports by learned MAC address; the host forwards between br0
   and enp1s0 only with ip_forward; replies from outside need masquerade. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var ROOT = 'root';
  /** The router outside the host (the course books' lab: 192.168.122.0/24, the host is demosrv1 .57). It knows only
      its own network: a packet from 10.0.0.0/24 gets no reply unless the host masquerades it (rule 8). */
  var GATEWAY = { ip: '192.168.122.1', mac: '52:54:00:5a:0e:01', knows: ['192.168.122.0/24'] };
  /** Locally administered MACs, handed out in creation order (illustrative; the kernel picks random ones). */
  var MACS = ['ee:4a:1c:02:6b:01', 'ee:4a:1c:02:6b:02', 'ee:4a:1c:02:6b:03', 'ee:4a:1c:02:6b:04', 'ee:4a:1c:02:6b:05',
    'ee:4a:1c:02:6b:06', 'ee:4a:1c:02:6b:07', 'ee:4a:1c:02:6b:08', 'ee:4a:1c:02:6b:09', 'ee:4a:1c:02:6b:0a'];
  var MAC_LO = '00:00:00:00:00:00';
  /** Rule 9: the order in which a failed ping's stage is reported. */
  var STAGES = ['link-down', 'no-route', 'no-arp', 'not-forwarded', 'no-return'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function padR(x, n) { x = String(x); while (x.length < n) x += ' '; return x; }

  // ── addresses ──

  function ipNum(ip) { return ip.split('.').reduce(function (a, b) { return a * 256 + Number(b); }, 0); }
  function numIp(n) { return [24, 16, 8, 0].map(function (sh) { return Math.floor(n / Math.pow(2, sh)) % 256; }).join('.'); }
  function cidr(c) { var p = c.split('/'); return { ip: p[0], len: Number(p[1]) }; }
  function netNum(ip, len) { var size = Math.pow(2, 32 - len); return Math.floor(ipNum(ip) / size) * size; }
  /** 10.0.0.2/24 → 10.0.0.0/24 */
  function prefixOf(c) { var x = cidr(c); return numIp(netNum(x.ip, x.len)) + '/' + x.len; }
  function inNet(ip, net) { var x = cidr(net); return netNum(ip, x.len) === netNum(x.ip, x.len); }
  function ipOf(c) { return cidr(c).ip; }

  // ── looking things up ──

  function ns(s, id) { return s.netns[id] || null; }
  function link(s, nsId, name) {
    var n = ns(s, nsId);
    if (!n) return null;
    for (var i = 0; i < n.links.length; i++) if (n.links[i].name === name) return n.links[i];
    return null;
  }
  function key(nsId, name) { return nsId + ':' + name; }
  /** The other end of a veth, wherever it lives now. */
  function peerOf(s, l) { return l && l.peer ? link(s, l.peer.ns, l.peer.name) : null; }
  function portsOf(s, nsId, br) { return ns(s, nsId).links.filter(function (l) { return l.master === br; }); }
  /** Is ip one of this namespace's own addresses (on any interface but lo: lo's 127.0.0.0/8 never leaves the
      namespace, and Linux answers ARP for no loopback address)? */
  function localDev(s, nsId, ip) {
    var n = ns(s, nsId);
    for (var i = 0; i < n.links.length; i++) if (n.links[i].kind !== 'lo' && n.links[i].addrs.some(function (a) { return ipOf(a) === ip; })) return n.links[i];
    return null;
  }
  var LOOPBACK = '127.0.0.0/8';

  /** Rules 4, 6: the main routing table. A connected route for every address on an interface that is up (lo's goes
      to the local table, not here), and the static routes whose interface is up. ignoreDown: as if every link were up,
      to find where the packet would have gone (rule 9's diagnosis). Sorted: default first, then by network, then by
      prefix length, connected before static, then by interface name. */
  function routes(s, nsId, ignoreDown) {
    var n = ns(s, nsId), out = [];
    n.links.forEach(function (l) {
      if (l.kind === 'lo' || !(l.up || ignoreDown)) return;
      var lk = !carrier(s, l);
      l.addrs.forEach(function (a) { out.push({ dst: prefixOf(a), dev: l.name, via: null, src: ipOf(a), kernel: true, linkdown: lk }); });
    });
    n.routes.forEach(function (r) {
      var l = link(s, nsId, r.dev);
      if (l && (l.up || ignoreDown)) out.push({ dst: r.dst, dev: r.dev, via: r.via, src: r.src || null, kernel: false });
    });
    function len(r) { return r.dst === 'default' ? 0 : cidr(r.dst).len; }
    function num(r) { return r.dst === 'default' ? -1 : ipNum(cidr(r.dst).ip); }
    return out.sort(function (a, b) {
      return num(a) - num(b) || len(a) - len(b) || (a.kernel === b.kernel ? 0 : a.kernel ? -1 : 1) || (a.dev < b.dev ? -1 : a.dev > b.dev ? 1 : 0);
    });
  }
  /** Longest prefix match; equal lengths keep the table order. The source is the outgoing interface's address in
      the next hop's subnet, else its first address. */
  function lookup(s, nsId, dst, ignoreDown) {
    var best = null, bestLen = -1;
    routes(s, nsId, ignoreDown).forEach(function (r) {
      var l = r.dst === 'default' ? 0 : cidr(r.dst).len;
      if ((r.dst === 'default' || inNet(dst, r.dst)) && l > bestLen) { best = r; bestLen = l; }
    });
    if (!best) return null;
    var dev = link(s, nsId, best.dev), nh = best.via || dst;
    var src = best.src || (dev.addrs.filter(function (a) { return inNet(nh, prefixOf(a)); })[0] || dev.addrs[0] || '');
    return { dst: best.dst, dev: best.dev, via: best.via, src: src.indexOf('/') >= 0 ? ipOf(src) : src };
  }

  // ── the wire: one L2 segment ──

  /** Rules 2, 4, 5: who answers an ARP request for ip sent out of (nsId, dev)? A frame sent into a veth comes out of
      its peer; a frame sent out of a bridge goes to its ports; a frame arriving on a port goes into its bridge, which
      delivers it to its own interface and floods it to its other ports (the request is a broadcast); enp1s0 leads to
      the gateway outside. A link that is down stops the frame, unless ignoreDown (then it is noted and passed).
      Breadth first, ports in table order. Linux answers ARP for any of the namespace's own addresses on whichever
      interface the request came in (arp_ignore 0).
      → { owner: { ns, dev, mac } | { gateway: true } | null, trail: keys to the owner (or every key reached),
          downs: down keys on the owner's path, entered: [{ ns, br, port }] bridges entered and through which port,
          exit: { ns, br, port } where the owner's side leaves its bridge (the reply teaches the MAC table) }. */
  function segment(s, nsId, dev, ip, ignoreDown) {
    var start = link(s, nsId, dev);
    var seen = {}, order = [], queue = [];
    var owner = null, ownerNode = null;
    function node(n, l, dir, from, via) { return { ns: n, l: l, dir: dir, from: from, via: via || null }; }
    function push(nd) {
      var k = key(nd.ns, nd.l.name) + '>' + nd.dir;
      if (seen[k]) return;
      seen[k] = true; queue.push(nd);
    }
    push(node(nsId, start, 'out', null));
    var entered = [];
    while (queue.length && !owner) {
      var nd = queue.shift();
      var l = nd.l;
      if (order.indexOf(key(nd.ns, l.name)) < 0) order.push(key(nd.ns, l.name));
      if (!l.up && !ignoreDown) continue;
      if (nd.dir === 'out') {
        if (l.kind === 'veth') { var p = peerOf(s, l); if (p) push(node(l.peer.ns, p, 'in', nd)); }
        else if (l.kind === 'bridge') portsOf(s, nd.ns, l.name).forEach(function (q) { if (q !== nd.via) push(node(nd.ns, q, 'out', nd)); });
        else if (l.kind === 'phys') {
          if (ip === GATEWAY.ip) { owner = { gateway: true }; ownerNode = nd; }
        }
      } else {
        if (l.master) {
          var br = link(s, nd.ns, l.master);
          entered.push({ ns: nd.ns, br: br.name, port: l.name });
          // the bridge itself: it receives the frame for its own stack, and floods it to its other ports
          var bnode = node(nd.ns, br, 'bridge', nd, l);
          var bk = key(nd.ns, br.name) + '>bridge';
          if (seen[bk]) continue;
          seen[bk] = true;
          if (order.indexOf(key(nd.ns, br.name)) < 0) order.push(key(nd.ns, br.name));
          if (!br.up && !ignoreDown) continue;
          if (localDev(s, nd.ns, ip)) { owner = { ns: nd.ns, dev: br.name, mac: br.mac }; ownerNode = bnode; break; }
          portsOf(s, nd.ns, br.name).forEach(function (q) { if (q !== l) push(node(nd.ns, q, 'out', bnode, l)); });
        } else if (localDev(s, nd.ns, ip)) { owner = { ns: nd.ns, dev: l.name, mac: l.mac }; ownerNode = nd; }
      }
    }
    if (!owner) return { owner: null, trail: order, downs: [], entered: entered, exit: null };
    var path = [];
    for (var x = ownerNode; x; x = x.from) path.unshift(x);
    var trail = [], downs = [], exit = null;
    path.forEach(function (x, i) {
      var k = key(x.ns, x.l.name);
      if (trail[trail.length - 1] !== k) trail.push(k);
      if (!x.l.up && downs.indexOf(k) < 0) downs.push(k);
      if (x.dir === 'bridge' && path[i + 1]) exit = { ns: x.ns, br: x.l.name, port: path[i + 1].l.name };
    });
    if (owner.gateway) trail.push('gateway');
    return { owner: owner, trail: trail, downs: downs, entered: entered.filter(function (e) {
      return path.some(function (x) { return x.dir === 'bridge' && x.ns === e.ns && x.l.name === e.br && x.via && x.via.name === e.port; });
    }), exit: exit };
  }

  // ── a ping ──

  function natFor(s, src, outDev) {
    for (var i = 0; i < s.nat.length; i++) {
      var r = s.nat[i];
      if (inNet(src, r.src) && (r.oif ? outDev === r.oif : outDev !== r.notOif)) return r;
    }
    return null;
  }

  /** Rules 4–8: follow one echo request hop by hop. Each hop: route lookup (no route: stop), ARP across the segment
      (nobody answers: stop), then either delivery (the target's own address; the reply must find its way back), the
      outside gateway (it answers only addresses it can route to), or forwarding (the host only with ip_forward;
      masquerade rewrites the source on the way out). ignoreDown (rule 9's diagnosis): down links are noted and
      passed, and so is a host that does not forward; the other stages still stop the packet.
      → { ok, stage, at, trail, downs, learn, forwards, src, natted, reporter: who sends an ICMP error } */
  function walk(s, from, dst, ignoreDown, isReply) {
    var trail = [], downs = [], learn = [], cur = from, src = null, natted = false, forwards = 0, inIp = null;
    function stop(stage, at) {
      return { ok: false, stage: stage, at: at, trail: trail, downs: downs, learn: learn, forwards: forwards, src: src, natted: natted, reporter: cur === from ? null : inIp };
    }
    function done(at) { return { ok: true, stage: null, at: at, trail: trail, downs: downs, learn: learn, forwards: forwards, src: src, natted: natted }; }
    // rule 1: the namespace's own addresses and 127.0.0.0/8 are delivered through its own lo, which must be up
    if (inNet(dst, LOOPBACK) || localDev(s, from, dst)) {
      var own = link(s, from, 'lo');
      src = dst;
      if (own.up) return done(key(from, 'lo'));
      downs.push(key(from, 'lo'));
      return stop('link-down', key(from, 'lo'));
    }
    for (var hop = 0; hop < 8; hop++) {
      var r = lookup(s, cur, dst, false);
      if (!r && ignoreDown) { r = lookup(s, cur, dst, true); if (r) downs.push(key(cur, r.dev)); }
      if (!r) return stop('no-route', cur === from ? cur + ':' : trail[trail.length - 1]);
      if (src === null) src = r.src;
      if (cur === ROOT && cur !== from) {                 // the host's firewall; a namespace has its own (none here)
        var rule = natFor(s, src, r.dev);
        if (rule) { src = ipOf(link(s, cur, r.dev).addrs[0]); natted = true; }
      }
      var nh = r.via || dst;
      var seg = segment(s, cur, r.dev, nh, ignoreDown);
      var outL = link(s, cur, r.dev);
      // the bridges learn the sender's MAC from the request, whatever happens next
      seg.entered.forEach(function (e) { learn.push({ fdb: e.br, ns: e.ns, mac: outL.mac, port: e.port }); });
      trail = trail.concat(seg.trail.filter(function (k) { return trail[trail.length - 1] !== k; }));
      downs = downs.concat(seg.downs.filter(function (k) { return downs.indexOf(k) < 0; }));
      if (!seg.owner) {
        learn.push({ ns: cur, ip: nh, dev: r.dev, mac: null, state: 'FAILED' });
        return stop('no-arp', seg.trail[seg.trail.length - 1]);
      }
      if (seg.owner.gateway) {
        learn.push({ ns: cur, ip: nh, dev: r.dev, mac: GATEWAY.mac, state: 'REACHABLE' });
        if (dst !== GATEWAY.ip) { inIp = GATEWAY.ip; return stop('no-route', 'gateway'); }
        if (!GATEWAY.knows.some(function (n) { return inNet(src, n); })) return stop('no-return', 'gateway');
        return done('gateway');
      }
      var at = seg.owner;
      learn.push({ ns: cur, ip: nh, dev: r.dev, mac: at.mac, state: 'REACHABLE' });
      learn.push({ ns: at.ns, ip: r.src, dev: at.dev, mac: outL.mac, state: 'STALE' });   // learnt from the request
      if (seg.exit) learn.push({ fdb: seg.exit.br, ns: seg.exit.ns, mac: at.mac, port: seg.exit.port });   // and from the reply
      inIp = (link(s, at.ns, at.dev).addrs[0] || '').split('/')[0] || null;
      if (localDev(s, at.ns, dst)) {
        if (!isReply && !natted) {
          var back = walk(s, at.ns, src, ignoreDown, true);
          learn = learn.concat(back.learn);
          downs = downs.concat(back.downs.filter(function (k) { return downs.indexOf(k) < 0; }));
          if (!back.ok) return stop('no-return', back.at);
        }
        return done(key(at.ns, localDev(s, at.ns, dst).name));
      }
      // rule 7: only the host forwards, and only with ip_forward (the namespaces' own ip_forward stays 0)
      if ((at.ns !== ROOT || !s.ipForward) && (!ignoreDown || at.ns !== ROOT)) { cur = at.ns; return stop('not-forwarded', key(at.ns, at.dev)); }
      forwards++;
      cur = at.ns;
    }
    return stop('no-route', trail[trail.length - 1]);
  }

  /** Rule 9: the stage reported is the first that fails in the order link down → no route → no ARP reply → not
      forwarded → no return path. A down link on the way the packet would take wins (the diagnosis walk passes down
      links, and a host that does not forward, to find one); otherwise the stage is where the real packet stopped,
      which on one path is always the earliest of the rest. What ping prints, and what the tables learn, follow the
      real walk. */
  function ping(s, from, dst) {
    var real = walk(s, from, dst, false);
    var res = { from: from, to: dst, ok: real.ok, stage: null, at: real.at, trail: real.trail, learn: real.learn };
    if (!real.ok) {
      // the diagnosis walk passes a host that does not forward only to look for down links further on
      var diag = walk(s, from, dst, true);
      if (diag.downs.length) { res.stage = 'link-down'; res.at = diag.downs[0]; }
      else { res.stage = real.stage; res.at = real.at; }
    }
    res.out = pingLines(real, dst);
    return res;
  }
  function pingLines(real, dst) {
    if (real.ok) {
      var ttl = 64 - real.forwards;
      return ['64 bytes from ' + dst + ': icmp_seq=1 ttl=' + ttl + ' time=' + (real.forwards ? '0.412' : '0.051') + ' ms',
        '1 packets transmitted, 1 received, 0% packet loss'];
    }
    if ((real.stage === 'no-route' || real.stage === 'link-down') && !real.reporter && real.at !== 'gateway') return ['ping: connect: Network is unreachable'];
    var errLoss = '1 packets transmitted, 0 received, +1 errors, 100% packet loss';
    if (real.stage === 'no-arp') return ['From ' + (real.reporter || real.src) + ' icmp_seq=1 Destination Host Unreachable', errLoss];
    if (real.stage === 'no-route') return ['From ' + (real.reporter || real.src) + ' icmp_seq=1 Destination Net Unreachable', errLoss];
    return ['1 packets transmitted, 0 received, 100% packet loss'];
  }
  /** What a successful (or failed) ARP and the bridge's learning leave in the tables. */
  function remember(s, learn) {
    learn.forEach(function (e) {
      if (e.fdb) {
        var br = link(s, e.ns, e.fdb);
        if (!br) return;
        var f = br.fdb.filter(function (x) { return x.mac === e.mac; })[0];
        if (f) f.port = e.port; else br.fdb.push({ mac: e.mac, port: e.port });
        return;
      }
      var n = ns(s, e.ns);
      var a = n.arp.filter(function (x) { return x.ip === e.ip && x.dev === e.dev; })[0];
      if (a) { a.mac = e.mac; a.state = e.state; } else n.arp.push({ ip: e.ip, dev: e.dev, mac: e.mac, state: e.state });
    });
  }

  // ── command output, as the tools print it ──

  /** ip -br link: name@peer padded to 16, state to 14, MAC, flags. A veth whose peer is down has no carrier. */
  function carrier(s, l) {
    if (!l.up) return false;
    if (l.kind === 'veth') { var p = peerOf(s, l); return !!p && p.up; }
    return true;
  }
  function brLink(s, nsId, l) {
    var p = l.peer ? (l.peer.ns === nsId ? '@' + l.peer.name : '@if' + peerOf(s, l).idx) : '';
    var state = !l.up ? 'DOWN' : !carrier(s, l) ? 'LOWERLAYERDOWN' : l.kind === 'lo' ? 'UNKNOWN' : 'UP';
    var flags = l.kind === 'lo' ? (l.up ? '<LOOPBACK,UP,LOWER_UP>' : '<LOOPBACK>')
      : !l.up ? '<BROADCAST,MULTICAST>' : carrier(s, l) ? '<BROADCAST,MULTICAST,UP,LOWER_UP>' : '<NO-CARRIER,BROADCAST,MULTICAST,UP>';
    return padR(l.name + p, 16) + ' ' + padR(state, 14) + ' ' + l.mac + ' ' + flags;
  }
  function routeLine(r) {
    return r.dst + (r.via ? ' via ' + r.via : '') + ' dev ' + r.dev + (r.kernel ? ' proto kernel scope link src ' + r.src : '') + (r.linkdown ? ' linkdown' : '');
  }

  /** The command as typed (data: the page shows it as is). */
  function cmdLines(c) {
    var inNs = function (n) { return n && n !== ROOT ? 'ip -n ' + n + ' ' : 'ip '; };
    switch (c.op) {
      case 'netns-add': return ['ip netns add ' + c.ns];
      case 'veth-add': return ['ip link add ' + c.a + ' type veth peer name ' + c.b + (c.peerNs ? ' netns ' + c.peerNs : '')];
      case 'link-netns': return ['ip link set ' + c.dev + ' netns ' + c.to];
      case 'addr-add': return [inNs(c.ns) + 'addr add ' + c.addr + ' dev ' + c.dev];
      case 'link-up': return [inNs(c.ns) + 'link set ' + c.dev + ' up'];
      case 'bridge-add': return ['ip link add ' + c.name + ' type bridge'];
      case 'link-master': return ['ip link set ' + c.dev + ' master ' + c.master + (c.up ? ' up' : '')];
      case 'route-add': return [inNs(c.ns) + 'route add ' + c.dst + ' via ' + c.via];
      case 'sysctl': return [c.value == null ? 'sysctl net.ipv4.ip_forward' : 'sysctl -w net.ipv4.ip_forward=' + c.value];
      case 'nat': return ['nft add table ip nat',
        "nft add chain ip nat postrouting '{ type nat hook postrouting priority srcnat; }'",
        'nft add rule ip nat postrouting ip saddr ' + c.src + ' oifname ' + (c.oif ? '"' + c.oif + '"' : '!= "' + c.notOif + '"') + ' masquerade'];
      case 'ping': return ['ip netns exec ' + c.ns + ' ping -c 1 ' + c.dst];
      case 'show-links': return ['ip -br link show master ' + c.master];
      case 'show-routes': return [inNs(c.ns) + 'route'];
      case 'engine': return c.cmds.reduce(function (a, x) { return a.concat(cmdLines(x)); }, []);
    }
    return [];
  }

  // ── building the state ──

  function lo(up) { return { name: 'lo', kind: 'lo', idx: 1, mac: MAC_LO, up: up, addrs: up ? ['127.0.0.1/8'] : [], master: null, peer: null }; }
  function fresh(scene) {
    return {
      scene: scene,
      netns: {
        root: {
          links: [lo(true), { name: 'enp1s0', kind: 'phys', idx: 2, mac: '52:54:00:dc:b4:80', up: true, addrs: ['192.168.122.57/24'], master: null, peer: null }],
          routes: [{ dst: 'default', via: GATEWAY.ip, dev: 'enp1s0', src: '192.168.122.57' }],
          arp: [{ ip: GATEWAY.ip, dev: 'enp1s0', mac: GATEWAY.mac, state: 'REACHABLE' }]
        }
      },
      order: [ROOT],
      ipForward: false,
      nat: [],
      nextIdx: 3, nextMac: 0,
      cmd: null, out: [], lastError: null, changed: [], gone: {}, event: { op: null }, ping: null, lastPing: null
    };
  }
  function blank(s) {
    s.cmd = null; s.out = []; s.lastError = null; s.changed = []; s.gone = {}; s.event = { op: null }; s.ping = null;
  }

  function fail(s, msg) { s.lastError = msg; s.out = [msg]; return false; }
  function needLink(s, nsId, name) {
    var l = link(s, nsId, name);
    if (!l) fail(s, 'Cannot find device "' + name + '"');
    return l;
  }
  function newLink(s, name, kind) {
    return { name: name, kind: kind, idx: s.nextIdx++, mac: MACS[s.nextMac++ % MACS.length], up: false, addrs: [], master: null, peer: null };
  }
  /** Rule 3: leaving a namespace takes an interface out of everything it was part of there. */
  function detach(s, nsId, l) {
    var n = ns(s, nsId);
    n.links = n.links.filter(function (x) { return x !== l; });
    n.routes = n.routes.filter(function (r) { return r.dev !== l.name; });
    n.arp = n.arp.filter(function (a) { return a.dev !== l.name; });
    n.links.forEach(function (x) { if (x.fdb) x.fdb = x.fdb.filter(function (f) { return f.port !== l.name; }); });
  }

  /** Apply one command. ev collects what the captions need. */
  function apply(s, c) {
    var ev = s.event;
    switch (c.op) {
      case 'netns-add':                                  // rule 1: only lo, and lo is down
        if (s.netns[c.ns]) return fail(s, 'Cannot create namespace file "/run/netns/' + c.ns + '": File exists');
        s.netns[c.ns] = { links: [lo(false)], routes: [], arp: [] };
        s.order.push(c.ns);
        return true;
      case 'veth-add': {                                 // rule 2: two linked ends, both where they were made
        var where = c.ns || ROOT, peerNs = c.peerNs || where;
        if (!ns(s, peerNs)) return fail(s, 'Invalid "netns" value');
        if (link(s, where, c.a) || link(s, peerNs, c.b)) return fail(s, 'RTNETLINK answers: File exists');
        var b = newLink(s, c.b, 'veth'), a = newLink(s, c.a, 'veth');   // the peer is registered first
        a.peer = { ns: peerNs, name: c.b }; b.peer = { ns: where, name: c.a };
        a.end = 'a'; b.end = 'b';
        ns(s, peerNs).links.push(b);
        ns(s, where).links.push(a);
        return true;
      }
      case 'link-netns': {                               // rule 3: one namespace at a time; down, addresses gone
        var from = c.ns || ROOT;
        var l = needLink(s, from, c.dev);
        if (!l) return false;
        if (!ns(s, c.to)) return fail(s, 'Invalid "netns" value');
        if (link(s, c.to, c.dev)) return fail(s, 'RTNETLINK answers: File exists');
        ev.moved = { dev: c.dev, from: from, to: c.to, hadAddrs: l.addrs.slice(), wasUp: l.up };
        detach(s, from, l);
        l.up = false; l.addrs = []; l.master = null;
        if (l.kind === 'veth') { var p = peerOf(s, l); if (p) p.peer = { ns: c.to, name: l.name }; }
        ns(s, c.to).links.push(l);
        (s.gone[from] = s.gone[from] || []).push({ name: c.dev, to: c.to });
        return true;
      }
      case 'addr-add': {
        var la = needLink(s, c.ns || ROOT, c.dev);
        if (!la) return false;
        if (la.addrs.indexOf(c.addr) >= 0) return fail(s, 'RTNETLINK answers: File exists');
        la.addrs.push(c.addr);
        return true;
      }
      case 'link-up': {
        var lu = needLink(s, c.ns || ROOT, c.dev);
        if (!lu) return false;
        lu.up = true;
        if (lu.kind === 'lo' && lu.addrs.length === 0) lu.addrs.push('127.0.0.1/8');
        return true;
      }
      case 'bridge-add': {
        if (link(s, ROOT, c.name)) return fail(s, 'RTNETLINK answers: File exists');
        var br = newLink(s, c.name, 'bridge');
        br.fdb = [];
        ns(s, ROOT).links.push(br);
        return true;
      }
      case 'link-master': {                              // rule 5: a port of the bridge
        var lm = needLink(s, c.ns || ROOT, c.dev);
        if (!lm) return false;
        var m = link(s, c.ns || ROOT, c.master);
        if (!m || m.kind !== 'bridge') return fail(s, 'Device does not exist');
        lm.master = c.master;
        if (c.up) lm.up = true;
        return true;
      }
      case 'route-add': {                                // rule 6: the gateway must be on a connected subnet
        var n = c.ns || ROOT;
        var via = lookup(s, n, c.via, false);
        if (!via || via.via) return fail(s, 'Error: Nexthop has invalid gateway.');
        if (routes(s, n, false).some(function (r) { return r.dst === c.dst; })) return fail(s, 'RTNETLINK answers: File exists');
        ns(s, n).routes.push({ dst: c.dst, via: c.via, dev: via.dev, src: null });
        return true;
      }
      case 'sysctl':                                     // rule 7
        if (c.value != null) s.ipForward = !!c.value;
        s.out = ['net.ipv4.ip_forward = ' + (s.ipForward ? 1 : 0)];
        return true;
      case 'nat':                                        // rule 8
        s.nat.push({ src: c.src, oif: c.oif || null, notOif: c.notOif || null });
        return true;
      case 'ping': {
        var r = ping(s, c.ns, c.dst);
        remember(s, r.learn);
        delete r.learn;
        s.ping = r; s.lastPing = { from: r.from, to: r.to, ok: r.ok, stage: r.stage, at: r.at };
        s.out = r.out;
        return true;
      }
      case 'show-links':
        s.out = portsOf(s, c.ns || ROOT, c.master).map(function (l) { return brLink(s, c.ns || ROOT, l); });
        return true;
      case 'show-routes':
        s.out = routes(s, c.ns || ROOT, false).map(routeLine);
        return true;
      case 'engine':
        for (var i = 0; i < c.cmds.length; i++) if (!apply(s, c.cmds[i])) return false;
        s.out = [];
        return true;
    }
    return fail(s, 'unknown command');
  }

  // ── what changed ──

  /** Row keys for marking: ns:<id>; <ns>:link:<name> (up, addresses, bridge, where its peer is); <ns>:route:<dst>
      <dev>; <ns>:arp:<ip>; <ns>:fdb:<bridge>:<mac>; sys:forward; sys:nat. */
  function rowsOf(s) {
    var out = {};
    s.order.forEach(function (id) {
      var n = s.netns[id];
      out['ns:' + id] = '';
      n.links.forEach(function (l) {
        out[id + ':link:' + l.name] = [l.up, l.addrs.join(','), l.master, l.peer ? l.peer.ns : ''].join('|');
        (l.fdb || []).forEach(function (f) { out[id + ':fdb:' + l.name + ':' + f.mac] = f.port; });
      });
      routes(s, id, false).forEach(function (r) { out[id + ':route:' + r.dst + ' ' + r.dev] = String(r.via); });
      n.arp.forEach(function (a) { out[id + ':arp:' + a.ip] = a.mac + '|' + a.state; });
    });
    out['sys:forward'] = String(s.ipForward);
    out['sys:nat'] = String(s.nat.length);
    return out;
  }
  function mark(before, s) {
    var a = rowsOf(before), b = rowsOf(s);
    s.changed = Object.keys(b).filter(function (k) { return !(k in a) || a[k] !== b[k]; });
  }

  // ── the presets (SPEC.md "Presets") ──

  function P(nsId, dst) { return { op: 'ping', ns: nsId, dst: dst }; }
  var L2 = [
    { op: 'netns-add', ns: 'ns1' }, { op: 'netns-add', ns: 'ns2' },
    { op: 'veth-add', a: 'veth1', b: 'veth1-br' }, { op: 'veth-add', a: 'veth2', b: 'veth2-br' },
    { op: 'link-netns', dev: 'veth1', to: 'ns1' }, { op: 'link-netns', dev: 'veth2', to: 'ns2' },
    { op: 'addr-add', ns: 'ns1', dev: 'veth1', addr: '10.0.0.2/24' }, { op: 'addr-add', ns: 'ns2', dev: 'veth2', addr: '10.0.0.3/24' },
    P('ns1', '10.0.0.3'),
    { op: 'link-up', ns: 'ns1', dev: 'veth1' }, { op: 'link-up', ns: 'ns2', dev: 'veth2' },
    { op: 'link-up', dev: 'veth1-br' }, { op: 'link-up', dev: 'veth2-br' },
    P('ns1', '10.0.0.3'),
    { op: 'bridge-add', name: 'br0' },
    { op: 'link-master', dev: 'veth1-br', master: 'br0' }, { op: 'link-master', dev: 'veth2-br', master: 'br0' },
    { op: 'link-up', dev: 'br0' },
    P('ns1', '10.0.0.3')
  ];
  var WIRED = L2.filter(function (c) { return c.op !== 'ping'; });
  var BR_ADDR = { op: 'addr-add', dev: 'br0', addr: '10.0.0.1/24' };
  var ROUTE = { op: 'route-add', ns: 'ns1', dst: 'default', via: '10.0.0.1' };
  var FWD = { op: 'sysctl', value: 1 };
  var NAT = { op: 'nat', src: '10.0.0.0/24', oif: 'enp1s0' };
  function engineRun(n, host, addr) {
    return { op: 'engine', what: 'run', ns: n, cmds: [
      { op: 'netns-add', ns: n },
      { op: 'veth-add', a: host, b: 'eth0', peerNs: n },
      { op: 'link-master', dev: host, master: 'br0', up: true },
      { op: 'addr-add', ns: n, dev: 'eth0', addr: addr },
      { op: 'link-up', ns: n, dev: 'lo' },
      { op: 'link-up', ns: n, dev: 'eth0' },
      { op: 'route-add', ns: n, dst: 'default', via: '172.17.0.1' }] };
  }
  var SCENES = {
    'by-hand': { setup: [], script: L2 },
    'to-the-world': { setup: WIRED, script: [P('ns1', GATEWAY.ip), BR_ADDR, ROUTE, FWD, P('ns1', GATEWAY.ip), NAT, P('ns1', GATEWAY.ip)] },
    'forgot-up': {
      setup: WIRED.filter(function (c) { return !(c.op === 'link-up' && c.dev === 'veth2-br'); }),
      script: [P('ns1', '10.0.0.3'), { op: 'show-links', master: 'br0' }, { op: 'link-up', dev: 'veth2-br' }, P('ns1', '10.0.0.3')] },
    'forgot-forward': {
      setup: WIRED.concat([BR_ADDR, ROUTE, NAT]),
      script: [P('ns1', GATEWAY.ip), { op: 'sysctl' }, FWD, P('ns1', GATEWAY.ip)] },
    'container-view': {
      setup: [],
      script: [
        { op: 'engine', what: 'start', cmds: [{ op: 'bridge-add', name: 'br0' }, { op: 'addr-add', dev: 'br0', addr: '172.17.0.1/16' },
          { op: 'link-up', dev: 'br0' }, { op: 'sysctl', value: 1 }, { op: 'nat', src: '172.17.0.0/16', notOif: 'br0' }] },
        engineRun('c1', 'veth-c1', '172.17.0.2/16'), engineRun('c2', 'veth-c2', '172.17.0.3/16'),
        P('c1', '172.17.0.3'), P('c1', GATEWAY.ip), { op: 'show-routes', ns: 'c1' }] }
  };
  var SCENE_IDS = Object.keys(SCENES);
  function sceneOf(p) { return SCENES[p && p.scene] ? p.scene : 'by-hand'; }

  function initialOf(scene) {
    var s = fresh(scene);
    SCENES[scene].setup.forEach(function (c) { apply(s, clone(c)); });
    blank(s);
    return s;
  }
  function stepOf(s, n, p) {
    var t = clone(s);
    blank(t);
    var c = clone(SCENES[sceneOf(p)].script[n - 1]);
    t.cmd = c;
    t.event.op = c.op;
    var before = clone(t);
    apply(t, c);
    mark(before, t);
    return t;
  }

  var logic = {
    /** Parameter defaults: preset by-hand; neighbour tables hidden. */
    defaults: { scene: 'by-hand', showArp: false },
    /** One step per scripted command (SPEC.md: 19, 7, 4, 4, 6). */
    steps: function (p) { return SCENES[sceneOf(p)].script.length; },
    initial: function (p) { return initialOf(sceneOf(p)); },
    step: function (s, n, p) { return stepOf(s, n, p); },

    // pure helpers, for the page and the tests
    ROOT: ROOT, GATEWAY: GATEWAY, STAGES: STAGES, SCENES: SCENES, SCENE_IDS: SCENE_IDS,
    ns: ns, link: link, key: key, peerOf: peerOf, portsOf: portsOf, localDev: localDev, carrier: carrier,
    routes: routes, lookup: lookup, segment: segment, walk: walk, ping: ping, remember: remember,
    apply: apply, blank: blank, mark: mark, rowsOf: rowsOf, fresh: fresh, initialOf: initialOf,
    cmdLines: cmdLines, brLink: brLink, routeLine: routeLine, prefixOf: prefixOf, inNet: inNet
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
