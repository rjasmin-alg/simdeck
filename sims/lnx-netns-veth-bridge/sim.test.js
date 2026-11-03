// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-netns-veth-bridge: tie-breaks first, then one test or more per rule (SPEC.md), then the presets'
// numbers, then the template's generic block. Run: node --test sims/lnx-netns-veth-bridge/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (scene, n) => kit.stateAt(logic, P({ scene }), n);
const last = (scene) => at(scene, logic.steps(P({ scene })));

/** Run commands on a copy of s, the way steps do; returns the state after the last. */
function run(s, ...cmds) {
  for (const c of cmds) {
    const t = structuredClone(s);
    logic.blank(t);
    t.cmd = c; t.event.op = c.op;
    const before = structuredClone(t);
    logic.apply(t, c);
    logic.mark(before, t);
    s = t;
  }
  return s;
}
const fresh = () => logic.fresh('by-hand');
const ping = (s, ns, dst) => logic.ping(s, ns, dst);
const names = (s, ns) => logic.ns(s, ns).links.map((l) => l.name);
/** by-hand's wiring without its pings: two namespaces on a bridge, everything up. */
const wired = () => run(fresh(), ...logic.SCENES['by-hand'].script.filter((c) => c.op !== 'ping'));
/** ... plus the bridge's address and ns1's default route (to-the-world's steps 2 and 3). */
const routed = () => run(wired(), { op: 'addr-add', dev: 'br0', addr: '10.0.0.1/24' }, { op: 'route-add', ns: 'ns1', dst: 'default', via: '10.0.0.1' });
const FWD = { op: 'sysctl', value: 1 };
const NAT = { op: 'nat', src: '10.0.0.0/24', oif: 'enp1s0' };
const down = (s, ns, dev) => { s = structuredClone(s); logic.link(s, ns, dev).up = false; return s; };

// ── tie-breaks ──

test('tie-break (rule 9): a down link wins over every other stage, even when the packet stops earlier', () => {
  // no route to the gateway AND veth2-br down: link down is reported only if it is on the way; here it is not
  let s = down(wired(), 'root', 'veth2-br');
  assert.equal(ping(s, 'ns1', '192.168.122.1').stage, 'no-route', 'veth2-br is not on the way out');
  // the sender's own link down: ping says no route, the diagnosis says link down
  s = down(routed(), 'ns1', 'veth1');
  const r = ping(s, 'ns1', '192.168.122.1');
  assert.equal(r.stage, 'link-down');
  assert.equal(r.at, 'ns1:veth1');
  assert.deepEqual(r.out, ['ping: connect: Network is unreachable']);
  // a down link and no forwarding: link down first
  s = down(routed(), 'root', 'enp1s0');
  assert.equal(ping(s, 'ns1', '192.168.122.1').stage, 'link-down');
  assert.equal(ping(s, 'ns1', '192.168.122.1').at, 'root:enp1s0');
});

test('tie-break (rule 9): of two down links, the first on the path is reported', () => {
  let s = down(down(wired(), 'root', 'veth2-br'), 'ns2', 'veth2');
  assert.equal(ping(s, 'ns1', '10.0.0.3').at, 'root:veth2-br');
  s = down(down(wired(), 'root', 'br0'), 'root', 'veth2-br');
  assert.equal(ping(s, 'ns1', '10.0.0.3').at, 'root:br0');
});

test('tie-break (rule 9): the order of the stages', () => {
  assert.deepEqual(logic.STAGES, ['link-down', 'no-route', 'no-arp', 'not-forwarded', 'no-return']);
  // no route beats no ARP: ns1 with a route via a neighbour that does not exist is not reached at all without one
  const s = wired();
  assert.equal(ping(s, 'ns1', '192.168.122.1').stage, 'no-route');
  // no ARP reply beats not forwarded: a default route via an address nobody has
  const t = run(wired(), { op: 'route-add', ns: 'ns1', dst: 'default', via: '10.0.0.9' });
  assert.equal(ping(t, 'ns1', '192.168.122.1').stage, 'no-arp');
  // not forwarded beats no return path (no NAT either)
  assert.equal(ping(routed(), 'ns1', '192.168.122.1').stage, 'not-forwarded');
  assert.equal(ping(run(routed(), FWD), 'ns1', '192.168.122.1').stage, 'no-return');
});

test('tie-break (rule 6): longest prefix wins, then table order', () => {
  const s = routed();
  assert.equal(logic.lookup(s, 'ns1', '10.0.0.3').via, null, 'the /24 beats the default');
  assert.equal(logic.lookup(s, 'ns1', '8.8.8.8').via, '10.0.0.1');
  const r = logic.routes(s, 'root').map((x) => x.dst);
  assert.deepEqual(r, ['default', '10.0.0.0/24', '192.168.122.0/24'], 'default first, then by network');
});

// ── rules ──

test('rule 1: a new network namespace contains only lo, and lo is down without an address', () => {
  const s = run(fresh(), { op: 'netns-add', ns: 'ns1' });
  assert.deepEqual(names(s, 'ns1'), ['lo']);
  const lo = logic.link(s, 'ns1', 'lo');
  assert.equal(lo.up, false);
  assert.deepEqual(lo.addrs, []);
  assert.deepEqual(logic.routes(s, 'ns1'), [], 'no routes');
  assert.deepEqual(logic.ns(s, 'ns1').arp, [], 'its own, empty ARP table');
  assert.deepEqual(names(s, 'root'), ['lo', 'enp1s0'], 'the host is unchanged');
  assert.ok(s.changed.includes('ns:ns1'));
  const up = run(s, { op: 'link-up', ns: 'ns1', dev: 'lo' });
  assert.deepEqual(logic.link(up, 'ns1', 'lo').addrs, ['127.0.0.1/8'], 'lo gets 127.0.0.1 when it comes up');
  assert.equal(run(s, { op: 'netns-add', ns: 'ns1' }).lastError.includes('File exists'), true);
});

test('rule 2: a veth pair is two linked ends, both where they were made, both down', () => {
  const s = run(fresh(), { op: 'veth-add', a: 'veth1', b: 'veth1-br' });
  assert.deepEqual(names(s, 'root'), ['lo', 'enp1s0', 'veth1-br', 'veth1']);
  const a = logic.link(s, 'root', 'veth1'), b = logic.link(s, 'root', 'veth1-br');
  assert.deepEqual(a.peer, { ns: 'root', name: 'veth1-br' });
  assert.deepEqual(b.peer, { ns: 'root', name: 'veth1' });
  assert.equal(a.up || b.up, false);
  assert.ok(b.idx < a.idx, 'the peer is registered first');
  assert.ok(s.changed.includes('root:link:veth1') && s.changed.includes('root:link:veth1-br'));
  // peer straight into another namespace
  const t = run(fresh(), { op: 'netns-add', ns: 'c1' }, { op: 'veth-add', a: 'veth-c1', b: 'eth0', peerNs: 'c1' });
  assert.deepEqual(names(t, 'c1'), ['lo', 'eth0']);
  assert.deepEqual(logic.link(t, 'c1', 'eth0').peer, { ns: 'root', name: 'veth-c1' });
});

test('rule 2: what goes into one end comes out of the other', () => {
  const s = wired();
  const seg = logic.segment(s, 'ns1', 'veth1', '10.0.0.3', false);
  assert.deepEqual(seg.trail.slice(0, 2), ['ns1:veth1', 'root:veth1-br']);
});

test('rule 3: moving an interface takes it out of the host\'s view, down, without addresses or bridge', () => {
  let s = run(wired(), { op: 'addr-add', dev: 'veth1-br', addr: '10.9.9.9/24' }, { op: 'netns-add', ns: 'ns3' });
  assert.equal(logic.link(s, 'root', 'veth1-br').master, 'br0');
  s = run(s, { op: 'link-netns', dev: 'veth1-br', to: 'ns3' });
  assert.equal(logic.link(s, 'root', 'veth1-br'), null, 'gone from the host');
  const l = logic.link(s, 'ns3', 'veth1-br');
  assert.equal(l.up, false);
  assert.deepEqual(l.addrs, []);
  assert.equal(l.master, null);
  assert.deepEqual(logic.link(s, 'ns1', 'veth1').peer, { ns: 'ns3', name: 'veth1-br' }, 'the peer knows where it went');
  assert.deepEqual(s.gone.root, [{ name: 'veth1-br', to: 'ns3' }]);
  assert.ok(s.changed.includes('ns3:link:veth1-br') && s.changed.includes('ns1:link:veth1'));
  assert.ok(!logic.routes(s, 'root').some((r) => r.dev === 'veth1-br'), 'its routes went too');
  assert.equal(run(s, { op: 'link-netns', dev: 'veth1-br', to: 'ns3' }).lastError, 'Cannot find device "veth1-br"');
});

test('rule 3: moved after it had an address and was up: both are dropped', () => {
  let s = run(fresh(), { op: 'netns-add', ns: 'ns1' }, { op: 'veth-add', a: 'veth1', b: 'veth1-br' },
    { op: 'addr-add', dev: 'veth1', addr: '10.0.0.2/24' }, { op: 'link-up', dev: 'veth1' });
  assert.ok(logic.routes(s, 'root').some((r) => r.dev === 'veth1'));
  s = run(s, { op: 'link-netns', dev: 'veth1', to: 'ns1' });
  assert.deepEqual(logic.link(s, 'ns1', 'veth1').addrs, []);
  assert.equal(logic.link(s, 'ns1', 'veth1').up, false);
  assert.ok(!logic.routes(s, 'root').some((r) => r.dev === 'veth1'));
  assert.deepEqual(s.event.moved.hadAddrs, ['10.0.0.2/24']);
});

test('rule 4: a link is down until up; only an up link has its connected route', () => {
  let s = run(fresh(), { op: 'netns-add', ns: 'ns1' }, { op: 'veth-add', a: 'veth1', b: 'veth1-br' },
    { op: 'link-netns', dev: 'veth1', to: 'ns1' }, { op: 'addr-add', ns: 'ns1', dev: 'veth1', addr: '10.0.0.2/24' });
  assert.deepEqual(logic.routes(s, 'ns1'), []);
  const r = ping(s, 'ns1', '10.0.0.3');
  assert.equal(r.stage, 'link-down');
  assert.deepEqual(r.out, ['ping: connect: Network is unreachable']);
  s = run(s, { op: 'link-up', ns: 'ns1', dev: 'veth1' });
  assert.deepEqual(logic.routes(s, 'ns1').map(logic.routeLine), ['10.0.0.0/24 dev veth1 proto kernel scope link src 10.0.0.2 linkdown'], 'no carrier yet');
  assert.equal(logic.routes(run(s, { op: 'link-up', dev: 'veth1-br' }), 'ns1')[0].linkdown, false);
  assert.ok(s.changed.includes('ns1:route:10.0.0.0/24 veth1'));
  assert.equal(logic.carrier(s, logic.link(s, 'ns1', 'veth1')), false, 'no carrier while the other end is down');
});

test('rule 4: a down link anywhere on the way stops the frame (ARP fails), and is the stage', () => {
  const s = down(wired(), 'root', 'veth2-br');
  const r = ping(s, 'ns1', '10.0.0.3');
  assert.equal(r.stage, 'link-down');
  assert.equal(r.at, 'root:veth2-br');
  assert.equal(r.out[0], 'From 10.0.0.2 icmp_seq=1 Destination Host Unreachable');
  assert.equal(ping(down(wired(), 'root', 'br0'), 'ns1', '10.0.0.3').at, 'root:br0', 'a down bridge too');
});

test('rule 5: without a bridge the host ends are loose: nobody answers ARP', () => {
  const s = run(wired(), { op: 'link-master', dev: 'veth1-br', master: 'br0' });   // still a port; unplug the other
  const t = structuredClone(wired());
  logic.link(t, 'root', 'veth1-br').master = null;
  const r = ping(t, 'ns1', '10.0.0.3');
  assert.equal(r.stage, 'no-arp');
  assert.equal(r.at, 'root:veth1-br');
  assert.deepEqual(r.out, ['From 10.0.0.2 icmp_seq=1 Destination Host Unreachable', '1 packets transmitted, 0 received, +1 errors, 100% packet loss']);
  assert.equal(ping(s, 'ns1', '10.0.0.3').ok, true);
});

test('rule 5: through the bridge: ARP finds the target, both learn, the bridge learns one MAC per port', () => {
  const s = run(wired(), { op: 'ping', ns: 'ns1', dst: '10.0.0.3' });
  assert.equal(s.ping.ok, true);
  assert.deepEqual(s.ping.trail, ['ns1:veth1', 'root:veth1-br', 'root:br0', 'root:veth2-br', 'ns2:veth2']);
  const v1 = logic.link(s, 'ns1', 'veth1').mac, v2 = logic.link(s, 'ns2', 'veth2').mac;
  assert.deepEqual(logic.ns(s, 'ns1').arp.map((a) => [a.ip, a.mac]), [['10.0.0.3', v2]]);
  assert.deepEqual(logic.ns(s, 'ns2').arp.map((a) => [a.ip, a.mac]), [['10.0.0.2', v1]]);
  assert.deepEqual(logic.link(s, 'root', 'br0').fdb, [{ mac: v1, port: 'veth1-br' }, { mac: v2, port: 'veth2-br' }]);
  assert.deepEqual(logic.ns(s, 'root').arp.map((a) => a.ip), ['192.168.122.1'], 'the host stack saw nothing: switched, not routed');
  assert.deepEqual(logic.link(s, 'root', 'br0').addrs, [], 'the bridge needs no address for this');
  assert.ok(s.changed.includes('ns1:arp:10.0.0.3'));
});

test('rule 5: a failed ARP leaves a FAILED entry; the bridge still learns the sender', () => {
  const s = run(down(wired(), 'root', 'veth2-br'), { op: 'ping', ns: 'ns1', dst: '10.0.0.3' });
  assert.deepEqual(logic.ns(s, 'ns1').arp, [{ ip: '10.0.0.3', dev: 'veth1', mac: null, state: 'FAILED' }]);
  assert.deepEqual(logic.link(s, 'root', 'br0').fdb.map((f) => f.port), ['veth1-br']);
});

test('rule 5: the bridge answers for its own address; ARP is answered for any own address (arp_ignore 0)', () => {
  const s = run(wired(), { op: 'addr-add', dev: 'br0', addr: '10.0.0.1/24' });
  assert.equal(ping(s, 'ns1', '10.0.0.1').ok, true);
  assert.equal(ping(s, 'ns1', '10.0.0.1').at, 'root:br0');
  const seg = logic.segment(s, 'ns1', 'veth1', '192.168.122.57', false);
  assert.deepEqual(seg.owner.dev, 'br0', 'the host answers for enp1s0\'s address on br0');
});

test('rule 6: off-subnet needs a route; the gateway must be on a connected subnet', () => {
  const s = wired();
  const r = ping(s, 'ns1', '192.168.122.1');
  assert.equal(r.stage, 'no-route');
  assert.equal(r.at, 'ns1:');
  assert.deepEqual(r.out, ['ping: connect: Network is unreachable']);
  assert.equal(run(s, { op: 'route-add', ns: 'ns1', dst: 'default', via: '192.168.122.1' }).lastError, 'Error: Nexthop has invalid gateway.');
  const t = routed();
  assert.deepEqual(logic.routes(t, 'ns1').map(logic.routeLine)[0], 'default via 10.0.0.1 dev veth1');
  assert.notEqual(ping(t, 'ns1', '192.168.122.1').stage, 'no-route');
});

test('rule 7: the host forwards only with ip_forward; without it the packet stops at br0, silently', () => {
  const s = run(routed(), NAT);
  const r = ping(s, 'ns1', '192.168.122.1');
  assert.equal(r.stage, 'not-forwarded');
  assert.equal(r.at, 'root:br0');
  assert.deepEqual(r.out, ['1 packets transmitted, 0 received, 100% packet loss']);
  const t = run(s, FWD);
  assert.equal(t.ipForward, true);
  assert.deepEqual(t.out, ['net.ipv4.ip_forward = 1']);
  assert.ok(t.changed.includes('sys:forward'));
  assert.equal(ping(t, 'ns1', '192.168.122.1').ok, true);
  assert.deepEqual(run(s, { op: 'sysctl' }).out, ['net.ipv4.ip_forward = 0'], 'reading it changes nothing');
  // the host's own address needs no forwarding
  assert.equal(ping(s, 'ns1', '192.168.122.57').ok, true);
});

test('rule 8: without masquerade the gateway cannot answer; with it the reply comes back', () => {
  const s = run(routed(), FWD);
  const r = ping(s, 'ns1', '192.168.122.1');
  assert.equal(r.stage, 'no-return');
  assert.equal(r.at, 'gateway');
  assert.deepEqual(r.out, ['1 packets transmitted, 0 received, 100% packet loss']);
  const t = run(s, NAT);
  assert.ok(t.changed.includes('sys:nat'));
  const ok = ping(t, 'ns1', '192.168.122.1');
  assert.equal(ok.ok, true);
  assert.equal(ok.out[0], '64 bytes from 192.168.122.1: icmp_seq=1 ttl=63 time=0.412 ms', 'one router on the way');
  // a rule for another interface does not help
  assert.equal(ping(run(s, { op: 'nat', src: '10.0.0.0/24', oif: 'br0' }), 'ns1', '192.168.122.1').stage, 'no-return');
  // nor one for another source network
  assert.equal(ping(run(s, { op: 'nat', src: '10.1.0.0/24', oif: 'enp1s0' }), 'ns1', '192.168.122.1').stage, 'no-return');
  // "oifname != br0" matches enp1s0
  assert.equal(ping(run(s, { op: 'nat', src: '10.0.0.0/24', notOif: 'br0' }), 'ns1', '192.168.122.1').ok, true);
});

test('rule 8: inside the model a reply needs a route back too', () => {
  // ns2 on another subnet, behind the host; ns2 has no default route back
  let s = run(routed(), FWD, { op: 'netns-add', ns: 'ns3' }, { op: 'veth-add', a: 'veth3', b: 'veth3-br' },
    { op: 'link-netns', dev: 'veth3', to: 'ns3' }, { op: 'addr-add', ns: 'ns3', dev: 'veth3', addr: '10.0.1.2/24' },
    { op: 'link-up', ns: 'ns3', dev: 'veth3' }, { op: 'addr-add', dev: 'veth3-br', addr: '10.0.1.1/24' }, { op: 'link-up', dev: 'veth3-br' });
  assert.equal(ping(s, 'ns1', '10.0.1.2').stage, 'no-return');
  s = run(s, { op: 'route-add', ns: 'ns3', dst: 'default', via: '10.0.1.1' });
  assert.equal(ping(s, 'ns1', '10.0.1.2').ok, true);
});

test('rule 9: with forwarding off the stage is where the packet stopped, not a later one', () => {
  const s = run(routed(), NAT);
  assert.deepEqual([ping(s, 'ns1', '8.8.8.8').stage, ping(s, 'ns1', '8.8.8.8').at], ['not-forwarded', 'root:br0']);
  const t = run(s, FWD);
  const r = ping(t, 'ns1', '8.8.8.8');
  assert.deepEqual([r.stage, r.at], ['no-route', 'gateway']);
  assert.equal(r.out[0], 'From 192.168.122.1 icmp_seq=1 Destination Net Unreachable', 'the gateway reports it');
});

test('rule 1: own addresses and 127.0.0.0/8 go through the namespace\'s own lo', () => {
  let s = wired();
  let r = ping(s, 'ns1', '127.0.0.1');
  assert.deepEqual([r.stage, r.at], ['link-down', 'ns1:lo'], 'lo is down');
  assert.deepEqual(r.out, ['ping: connect: Network is unreachable']);
  assert.equal(ping(routed(), 'ns1', '127.0.0.1').at, 'ns1:lo', 'never out by the default route to the host\'s lo');
  assert.equal(ping(s, 'ns1', '10.0.0.2').at, 'ns1:lo', 'its own address too');
  s = run(s, { op: 'link-up', ns: 'ns1', dev: 'lo' });
  assert.deepEqual([ping(s, 'ns1', '127.0.0.1').ok, ping(s, 'ns1', '127.0.0.1').at], [true, 'ns1:lo']);
  assert.equal(ping(s, 'ns1', '10.0.0.2').ok, true);
  assert.equal(logic.localDev(s, 'root', '127.0.0.1'), null, 'nobody answers ARP for a loopback address');
});

test('rule 3: moving an interface takes its routes, ARP entries and MAC-table entries out of the old namespace', () => {
  let s = run(routed(), FWD, NAT, { op: 'ping', ns: 'ns1', dst: '192.168.122.1' }, { op: 'netns-add', ns: 'ns3' });
  assert.ok(logic.link(s, 'root', 'br0').fdb.some((f) => f.port === 'veth1-br'));
  assert.ok(logic.ns(s, 'ns1').arp.length && logic.ns(s, 'ns1').routes.length);
  s = run(s, { op: 'link-netns', dev: 'veth1-br', to: 'ns3' });
  assert.ok(!logic.link(s, 'root', 'br0').fdb.some((f) => f.port === 'veth1-br'), 'MAC table');
  s = run(s, { op: 'link-netns', ns: 'ns1', dev: 'veth1', to: 'ns3' });
  assert.deepEqual(logic.ns(s, 'ns1').routes, [], 'static route via it');
  assert.deepEqual(logic.ns(s, 'ns1').arp, [], 'ARP entries on it');
  assert.equal(run(s, { op: 'link-netns', dev: 'veth2-br', to: 'nsX' }).lastError, 'Invalid "netns" value');
});

test('rule 5: the target learns the sender from the request (STALE)', () => {
  const s = at('forgot-forward', 1);
  const e = logic.ns(s, 'root').arp.filter((a) => a.ip === '10.0.0.2')[0];
  assert.deepEqual([e.dev, e.mac, e.state], ['br0', logic.link(s, 'ns1', 'veth1').mac, 'STALE']);
  assert.equal(logic.ns(s, 'ns1').arp[0].state, 'REACHABLE', 'the sender got a reply');
});

test('rule 6: a gateway only reachable through another gateway, or a route the table has, is refused', () => {
  assert.equal(run(routed(), { op: 'route-add', ns: 'ns1', dst: '10.9.0.0/24', via: '192.168.122.1' }).lastError, 'Error: Nexthop has invalid gateway.');
  assert.equal(run(routed(), { op: 'route-add', ns: 'ns1', dst: '10.0.0.0/24', via: '10.0.0.1' }).lastError, 'RTNETLINK answers: File exists');
});

test('tie-break (rule 6): of two routes of the same length the first in table order wins', () => {
  const s = run(wired(), { op: 'veth-add', ns: 'ns1', a: 'vethz', b: 'vetha' }, { op: 'addr-add', ns: 'ns1', dev: 'vetha', addr: '10.0.0.9/24' },
    { op: 'addr-add', ns: 'ns1', dev: 'vethz', addr: '10.0.0.8/24' }, { op: 'link-up', ns: 'ns1', dev: 'vetha' }, { op: 'link-up', ns: 'ns1', dev: 'vethz' });
  assert.deepEqual(logic.routes(s, 'ns1').map((r) => r.dev), ['veth1', 'vetha', 'vethz']);
  assert.equal(logic.lookup(s, 'ns1', '10.0.0.3').dev, 'veth1');
});

test('rule 7: a namespace never forwards (its own ip_forward is 0)', () => {
  const s = run(routed(), FWD, { op: 'route-add', ns: 'ns1', dst: '10.9.0.0/24', via: '10.0.0.3' });
  assert.deepEqual([ping(s, 'ns1', '10.9.0.5').stage, ping(s, 'ns1', '10.9.0.5').at], ['not-forwarded', 'ns2:veth2']);
  const t = run(s, FWD, { op: 'sysctl' });
  assert.deepEqual([t.ipForward, t.out], [true, ['net.ipv4.ip_forward = 1']], 'reading leaves it at 1');
});

test('rule 8: masquerade is the host\'s, applied where the host forwards, never at the sender', () => {
  const s = run(routed(), FWD, { op: 'nat', src: '10.0.0.0/24', notOif: 'br0' }, { op: 'nat', src: '192.168.122.0/24', notOif: 'br0' });
  assert.equal(logic.walk(s, 'ns1', '10.0.0.3', false).natted, false, 'switched, not forwarded');
  assert.equal(logic.walk(s, 'root', '192.168.122.1', false).natted, false, 'the host\'s own packet');
  assert.equal(logic.walk(s, 'ns1', '192.168.122.1', false).natted, true);
});

// ── marks ──

test('changed marks: new rows and namespaces, nothing else', () => {
  const s = at('by-hand', 7);
  assert.deepEqual(s.changed.sort(), ['ns1:link:veth1']);
  assert.deepEqual(at('by-hand', 15).changed, ['root:link:br0']);
  assert.ok(at('by-hand', 16).changed.includes('root:link:veth1-br'));
  assert.deepEqual(at('by-hand', 9).changed, [], 'a failed ping changes nothing visible');
});

// ── presets (SPEC.md) ──

test('presets: step counts 19, 7, 4, 4, 6; sim.json and the page agree', () => {
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [19, 7, 4, 4, 6]);
  const sim = require('./sim.json');
  assert.equal(sim.steps, logic.steps(P({})));
  for (const e of sim.entries || []) assert.ok(logic.SCENE_IDS.includes(e.preset));
});

test('preset by-hand: the five numbers of the story', () => {
  assert.equal(at('by-hand', 5).gone.root[0].name, 'veth1');
  assert.deepEqual(names(at('by-hand', 6), 'root'), ['lo', 'enp1s0', 'veth1-br', 'veth2-br']);
  const p9 = at('by-hand', 9).ping, p14 = at('by-hand', 14).ping, p19 = at('by-hand', 19).ping;
  assert.deepEqual([p9.stage, p9.at], ['link-down', 'ns1:veth1']);
  assert.deepEqual([p14.stage, p14.at], ['no-arp', 'root:veth1-br']);
  assert.deepEqual([p19.ok, p19.out[0]], [true, '64 bytes from 10.0.0.3: icmp_seq=1 ttl=64 time=0.051 ms']);
  assert.deepEqual(at('by-hand', 18).lastPing.stage, 'no-arp', 'the last result stays until the next ping');
});

test('preset to-the-world: no route, no return path, reply', () => {
  const st = [1, 5, 7].map((n) => at('to-the-world', n).ping);
  assert.deepEqual(st.map((r) => r.stage), ['no-route', 'no-return', null]);
  assert.deepEqual(at('to-the-world', 0).netns.ns1.arp, [], 'starts from by-hand\'s wiring, tables empty');
  assert.equal(at('to-the-world', 6).out.length, 0);
  assert.equal(logic.cmdLines(at('to-the-world', 6).cmd).length, 3, 'table, chain, rule');
});

test('preset forgot-up: link down at veth2-br, the listing shows it, fixed', () => {
  assert.deepEqual([at('forgot-up', 1).ping.stage, at('forgot-up', 1).ping.at], ['link-down', 'root:veth2-br']);
  assert.deepEqual(at('forgot-up', 2).out.map((l) => l.split(/\s+/).slice(0, 2).join(' ')), ['veth1-br@if4 UP', 'veth2-br@if6 DOWN']);
  assert.equal(at('forgot-up', 4).ping.ok, true);
});

test('preset forgot-forward: not forwarded at br0, read the setting, fixed', () => {
  assert.deepEqual([at('forgot-forward', 1).ping.stage, at('forgot-forward', 1).ping.at], ['not-forwarded', 'root:br0']);
  assert.deepEqual(at('forgot-forward', 2).out, ['net.ipv4.ip_forward = 0']);
  assert.equal(at('forgot-forward', 4).ping.ok, true);
});

test('preset container-view: the engine does rules 1–8; both pings answer', () => {
  const s = last('container-view');
  assert.deepEqual(s.order, ['root', 'c1', 'c2']);
  assert.deepEqual(names(s, 'c1'), ['lo', 'eth0']);
  assert.equal(logic.link(s, 'c1', 'lo').up, true);
  assert.deepEqual(logic.portsOf(s, 'root', 'br0').map((l) => l.name), ['veth-c1', 'veth-c2']);
  assert.equal(s.ipForward, true);
  assert.equal(at('container-view', 4).ping.ok, true);
  assert.equal(at('container-view', 5).ping.ok, true);
  assert.deepEqual(s.out, ['default via 172.17.0.1 dev eth0', '172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.2']);
  for (let n = 1; n <= 6; n++) assert.equal(at('container-view', n).lastError, null);
});

test('every preset runs without a command error', () => {
  for (const id of logic.SCENE_IDS) for (let n = 0; n <= logic.steps(P({ scene: id })); n++) assert.equal(at(id, n).lastError, null, id + ' ' + n);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.SCENE_IDS) {
    for (let n = 0; n <= logic.steps(P({ scene: id })); n++) {
      const s = at(id, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.SCENE_IDS) {
    const p = P({ scene: id, showArp: true });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'by-hand' });
  const s0 = kit.stateAt(logic, p, 18);
  const copy = structuredClone(s0);
  logic.step(s0, 19, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/params:\s*\{\s*scene:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(scenes, logic.SCENE_IDS);
});
