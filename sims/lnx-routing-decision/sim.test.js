// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-routing-decision's model. Run: node --test sims/lnx-routing-decision/
// Rules and numbers: SPEC.md. Tie-breaks first, then one test or more per rule, the presets, the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const R = (dst, prefix, metric, via) => ({ dst, prefix, metric, via: via || null, dev: 'enp1s0', proto: via ? 'boot' : 'kernel', src: null });
const results = (s) => s.phases.map((x) => x.result);

// ── tie-breaks (rule 3) ──

test('tie-break: equal prefix length, the lowest metric wins, whatever the order', () => {
  const a = [R('0.0.0.0', 0, 600, '192.168.122.2'), R('0.0.0.0', 0, 100, '192.168.122.1')];
  assert.equal(logic.lookup(a, '1.1.1.1').winner, 1);
  const b = [a[1], a[0]];
  assert.equal(logic.lookup(b, '1.1.1.1').winner, 0);
  assert.deepEqual(logic.lookup(a, '1.1.1.1').order, [1, 0]);
});

test('tie-break: equal prefix and equal metric, the first in table order wins', () => {
  const t = [R('0.0.0.0', 0, 100, '192.168.122.2'), R('0.0.0.0', 0, 100, '192.168.122.1')];
  assert.equal(logic.lookup(t, '8.8.8.8').winner, 0);
  assert.equal(logic.lookup([t[1], t[0]], '8.8.8.8').winner, 0);
});

test('tie-break: a longer prefix beats a lower metric', () => {
  const t = [R('10.0.0.0', 8, 0, '192.168.122.254'), R('10.1.0.0', 16, 500, '192.168.122.253')];
  assert.equal(logic.lookup(t, '10.1.2.3').winner, 1);
});

// ── rule 2: longest prefix, default = 0/0 ──

test('rule 2: of the routes that contain the destination, the longest prefix wins', () => {
  const s = at({ script: 'longest-prefix' }, 2);
  const lines = s.routes.map(logic.routeLine);
  const idx = (pre) => lines.findIndex((l) => l.startsWith(pre));
  const lk = (ip) => logic.lookup(s.routes, ip);
  assert.equal(lk('10.1.2.3').winner, idx('10.1.0.0/16'));
  assert.deepEqual(lk('10.1.2.3').matches.length, 3);           // default, /8 and /16 contain it
  assert.equal(lk('10.2.0.1').winner, idx('10.0.0.0/8'));
  assert.equal(lk('8.8.8.8').winner, idx('default'));
  assert.equal(lk('192.168.122.186').winner, idx('192.168.122.0/24'));
});

test('rule 2: default is 0/0 and matches every address with length 0', () => {
  const t = [R('0.0.0.0', 0, 100, '192.168.122.1')];
  for (const ip of ['0.0.0.0', '1.1.1.1', '255.255.255.255', '10.1.2.3']) assert.equal(logic.lookup(t, ip).winner, 0);
  assert.equal(logic.routeLine(Object.assign(t[0], { proto: 'dhcp', src: '192.168.122.57' })), 'default via 192.168.122.1 dev enp1s0 proto dhcp src 192.168.122.57 metric 100');
});

test('rule 2: no route contains the destination → no winner', () => {
  assert.equal(logic.lookup([R('192.168.122.0', 24, 100)], '1.1.1.1').winner, -1);
  assert.equal(logic.lookup([], '1.1.1.1').winner, -1);
});

// ── rule 4: connected routes exist only with an address on an interface that is up ──

test('rule 4: the healthy table is the book\'s two rows', () => {
  assert.deepEqual(logic.healthyConfig().routes.map(logic.routeLine), [
    'default via 192.168.122.1 dev enp1s0 proto dhcp src 192.168.122.57 metric 100',
    '192.168.122.0/24 dev enp1s0 proto kernel scope link src 192.168.122.57 metric 100'
  ]);
});

test('rule 4: removing the address removes the connected route (and the default that used it as its source)', () => {
  const cfg = logic.healthyConfig();
  logic.delAddr(cfg);
  assert.deepEqual(cfg.routes, []);
  assert.equal(cfg.iface.addr, null);
  assert.deepEqual(at({ break: 'address' }, 0).routes, []);
});

test('rule 4: link down removes every route on the device; up again brings the connected route back', () => {
  const cfg = logic.healthyConfig();
  logic.setLink(cfg, 'down');
  assert.deepEqual(cfg.routes, []);
  logic.setLink(cfg, 'up');
  assert.deepEqual(cfg.routes.map(logic.routeLine), ['192.168.122.0/24 dev enp1s0 proto kernel scope link src 192.168.122.57 metric 100']);
});

test('the table is listed by network, then prefix length, then metric (the kernel\'s order: the longer prefix first on one network, check)', () => {
  const t = logic.healthyConfig().routes;
  logic.insertRoute(t, { dst: '10.9.9.0', prefix: 24, via: '192.168.122.254', dev: 'enp1s0', metric: 0, proto: 'boot', scope: null, src: null });
  logic.insertRoute(t, { dst: '0.0.0.0', prefix: 0, via: '192.168.122.2', dev: 'enp1s0', metric: 600, proto: 'dhcp', scope: null, src: null });
  logic.insertRoute(t, { dst: '10.9.0.0', prefix: 16, via: '192.168.122.254', dev: 'enp1s0', metric: 0, proto: 'boot', scope: null, src: null });
  logic.insertRoute(t, { dst: '10.9.0.0', prefix: 24, via: '192.168.122.254', dev: 'enp1s0', metric: 0, proto: 'boot', scope: null, src: null });
  logic.insertRoute(t, { dst: '0.0.0.0', prefix: 0, via: '192.168.122.3', dev: 'enp1s0', metric: 50, proto: 'static', scope: null, src: null });
  assert.deepEqual(t.map((r) => r.dst + '/' + r.prefix + ':' + r.metric), ['0.0.0.0/0:50', '0.0.0.0/0:100', '0.0.0.0/0:600', '10.9.0.0/24:0', '10.9.0.0/16:0', '10.9.9.0/24:0', '192.168.122.0/24:100']);
});

// ── rule 5: on-link without via, off-link via the gateway, nothing → unreachable ──

test('rule 5: off-link goes via the gateway (the book\'s ip route get 1.1.1.1)', () => {
  const s = at({}, 3);
  assert.deepEqual(s.text, ['ip route get 1.1.1.1']);
  assert.deepEqual(s.out, ['1.1.1.1 via 192.168.122.1 dev enp1s0 src 192.168.122.57 uid 1000', '    cache']);
  assert.equal(s.exit, 0);
});

test('rule 5: on-link has no via', () => {
  const s = at({}, 4);
  assert.deepEqual(s.out[0], '192.168.122.186 dev enp1s0 src 192.168.122.57 uid 1000');
  assert.equal(s.route.via, null);
});

test('rule 5: no matching route → Network is unreachable (ip route get exit 2, ping exit 2)', () => {
  const g = at({ break: 'route' }, 3);
  assert.deepEqual(g.out, ['RTNETLINK answers: Network is unreachable']);
  assert.equal(g.exit, 2);
  const p = at({ script: 'no-default', break: 'route' }, 4);
  assert.deepEqual(p.out, ['ping: connect: Network is unreachable']);
  assert.equal(p.exit, 2);
});

// ── rule 6: the source address ──

test('rule 6: the source is the interface\'s address', () => {
  assert.equal(at({}, 3).route.src, '192.168.122.57');
  assert.equal(at({}, 4).route.src, '192.168.122.57');
  const cfg = logic.healthyConfig();
  logic.insertRoute(cfg.routes, { dst: '10.0.0.0', prefix: 8, via: '192.168.122.254', dev: 'enp1s0', metric: 0, proto: 'boot', scope: null, src: null });
  assert.equal(logic.routeGet(cfg, '10.9.9.9').src, '192.168.122.57'); // a route without src: the interface's address
});

test('rule 6: the packet goes to the next hop, and comes back only if someone is there', () => {
  assert.equal(logic.answers('1.1.1.1', '192.168.122.1'), true);
  assert.equal(logic.answers('192.168.122.186', '192.168.122.186'), true);
  assert.equal(logic.answers('192.168.122.99', '192.168.122.99'), false);
  assert.equal(logic.answers('10.1.2.3', '192.168.122.253'), false);
  assert.equal(logic.answers('198.51.100.7', '192.168.122.1'), false, 'nobody at that address beyond the gateway');
  assert.equal(logic.answers('1.1.1.1', '192.168.122.186'), false, 'democli1 does not forward');
});

// ── rule 1: names ──

test('rule 1: with files before dns, a line of /etc/hosts answers and DNS is never asked', () => {
  const s = at({ script: 'stale-hosts', break: 'hosts' }, 2);
  assert.equal(s.name.ip, '192.168.122.99');
  assert.equal(s.name.from, 'files');
  assert.deepEqual(s.name.trace.map((x) => x.src + ':' + x.result), ['files:hit', 'dns:skip', 'myhostname:skip']);
  assert.deepEqual(s.out, ['192.168.122.99  democli1']);
  assert.equal(s.lookup, null, 'no route lookup to the name server');
});

test('rule 1: the order of the hosts: line decides (dns before files gets the zone\'s answer)', () => {
  const cfg = logic.configFor('hosts');
  cfg.nsswitch = ['dns', 'files', 'myhostname'];
  assert.equal(logic.resolve(cfg, 'democli1').ip, '192.168.122.186');
  assert.equal(logic.resolve(cfg, 'democli1').from, 'dns');
});

test('rule 1: DNS needs a route to the name server; without one the source is unavailable', () => {
  const s = at({ script: 'no-address', break: 'address' }, 4);
  assert.equal(s.exit, 2);
  assert.deepEqual(s.out, []);
  assert.equal(s.name.trace[1].why, 'noroute');
  assert.equal(s.lookup.purpose, 'dns');
  assert.equal(s.lookup.winner, -1);
});

test('rule 1: nobody at the name server → a time-out, exit 2', () => {
  const s = at({ script: 'bad-resolver', break: 'resolver' }, 3);
  assert.equal(s.exit, 2);
  assert.equal(s.name.trace[1].why, 'timeout');
  assert.equal(s.name.err, 'tempfail');
  assert.equal(s.lookup.purpose, 'dns');
  assert.ok(s.lookup.winner >= 0, 'the route to 192.168.122.250 exists (on-link)');
});

test('rule 1: a name nobody knows → not found (getent exit 2, ping: Name or service not known)', () => {
  const cfg = logic.healthyConfig();
  const r = logic.resolve(cfg, 'nosuchhost');
  assert.equal(r.err, 'notfound');
  const run = logic.run(cfg, { k: 'ping', name: 'nosuchhost', ip: '192.168.122.77' }, P({}));
  assert.deepEqual(run.out, ['ping: nosuchhost: Name or service not known']);
  assert.equal(run.exit, 2);
});

test('rule 1: myhostname answers the host\'s own name (127.0.0.2 without an address)', () => {
  const cfg = logic.healthyConfig();
  cfg.hosts = cfg.hosts.slice(0, 1);
  cfg.resolv.nameserver = '192.168.122.250';
  assert.equal(logic.resolve(cfg, 'demosrv1').from, 'myhostname');
  assert.equal(logic.resolve(cfg, 'demosrv1').ip, '192.168.122.57');
  logic.delAddr(cfg);
  assert.equal(logic.resolve(cfg, 'demosrv1').ip, '127.0.0.2');
});

// ── the phases of one step and the ladder (rule 7) ──

test('phases: the first phase that fails ends the step; later phases stay pending', () => {
  assert.deepEqual(results(at({ break: 'resolver' }, 6)), ['fail', 'pending', 'pending']);
  assert.deepEqual(results(at({ script: 'no-default', break: 'route' }, 4)), ['ok', 'fail', 'pending']);
  assert.deepEqual(results(at({ break: 'hosts' }, 6)), ['ok', 'ok', 'fail']);
  assert.deepEqual(results(at({}, 6)), ['ok', 'ok', 'ok']);
});

test('target by-address skips the name phase', () => {
  const s = at({ break: 'resolver', target: 'by-address' }, 6);
  assert.deepEqual(s.text, ['ping -c1 -W1 192.168.122.186']);
  assert.deepEqual(s.phases.map((x) => x.phase), ['route', 'link']);
  assert.equal(s.exit, 0);
});

test('rule 7: the caption\'s rung is the lowest that failed', () => {
  assert.equal(at({ break: 'address' }, 3).event.rung, 'address');   // no address, so no route either
  assert.equal(at({ break: 'route' }, 3).event.rung, 'route');
  assert.equal(at({ break: 'hosts' }, 6).event.rung, 'other');
  assert.equal(at({ break: 'resolver' }, 5).event.rung, 'name');
  assert.equal(at({ break: 'address' }, 5).event.rung, 'address', 'no route to the name server is not the name\'s fault');
  assert.equal(at({ break: 'address' }, 6).event.rung, 'address');
  assert.equal(at({ script: 'no-address', break: 'address' }, 2).event.rung, 'address', 'ip route, empty');
  assert.equal(at({}, 6).event.rung, null);
});

test('break each place: every break makes a command of the healthy script fail', () => {
  const failing = (b) => {
    const out = [];
    for (let n = 1; n <= 6; n++) { const s = at({ break: b }, n); if (s.phases.some((x) => x.result === 'fail')) out.push(n); }
    return out;
  };
  assert.deepEqual(failing('none'), []);
  assert.deepEqual(failing('address'), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(failing('route'), [2, 3]);
  assert.deepEqual(failing('resolver'), [5, 6]);
  assert.deepEqual(failing('hosts'), [6]);
});

// ── the presets (task "Presets", SPEC.md) ──

test('steps per preset: 6, 6, 4, 5, 4, 5', () => {
  assert.deepEqual(logic.SCRIPT_IDS.map((id) => logic.steps(P({ script: id }))), [6, 6, 4, 5, 4, 5]);
  assert.equal(logic.steps(logic.defaults), 6);
});

test('preset healthy: the book\'s outputs', () => {
  assert.deepEqual(at({}, 1).out, ['lo               UNKNOWN        127.0.0.1/8', 'enp1s0           UP             192.168.122.57/24']);
  assert.equal(at({}, 2).out.length, 2);
  assert.deepEqual(at({}, 5).out, ['192.168.122.186 democli1']);
  assert.equal(at({}, 6).exit, 0);
});

test('preset stale-hosts: .99 from /etc/hosts, no reply, remove the line, DNS gives .186', () => {
  const p = { script: 'stale-hosts', break: 'hosts' };
  assert.equal(at(p, 1).exit, 0);
  assert.equal(at(p, 2).name.ip, '192.168.122.99');
  assert.equal(at(p, 3).exit, 1);
  assert.equal(at(p, 3).out[0], 'PING democli1 (192.168.122.99) 56(84) bytes of data.');
  assert.deepEqual(at(p, 4).out, ['10:hosts:      files  dns myhostname']);
  assert.equal(at(p, 5).hosts.some((x) => x.ip === '192.168.122.99'), false);
  const s6 = at(p, 6);
  assert.equal(s6.name.ip, '192.168.122.186');
  assert.equal(s6.name.from, 'dns');
});

test('preset no-default: one row, the gateway answers, the name resolves, the route does not', () => {
  const p = { script: 'no-default', break: 'route' };
  assert.deepEqual(at(p, 1).out, ['192.168.122.0/24 dev enp1s0 proto kernel scope link src 192.168.122.57 metric 100']);
  assert.equal(at(p, 2).exit, 0);
  assert.equal(at(p, 3).name.ip, '203.0.113.10');
  assert.equal(at(p, 3).name.from, 'dns');
  const s4 = at(p, 4);
  assert.equal(s4.name.ip, '203.0.113.10');
  assert.equal(s4.lookup.winner, -1);
  assert.equal(s4.exit, 2);
});

test('preset no-address: no address, empty table, nothing reachable, /etc/hosts still answers', () => {
  const p = { script: 'no-address', break: 'address' };
  assert.deepEqual(at(p, 1).out[1], 'enp1s0           UP            ');
  assert.deepEqual(at(p, 2).out, []);
  assert.deepEqual(at(p, 3).out, ['ping: connect: Network is unreachable']);
  assert.equal(at(p, 4).exit, 2);
  assert.deepEqual(at(p, 5).out, ['192.168.122.57  demosrv1']);
  assert.equal(at(p, 5).exit, 0);
});

test('preset bad-resolver: .250, ping by address works, getent exit 2, the fix goes into the profile', () => {
  const p = { script: 'bad-resolver', break: 'resolver' };
  assert.equal(at(p, 1).out[2], 'nameserver 192.168.122.250');
  assert.equal(at(p, 2).exit, 0);
  assert.equal(at(p, 3).exit, 2);
  const s4 = at(p, 4);
  assert.equal(s4.profile.dns, '192.168.122.1');
  assert.equal(s4.resolv.nameserver, '192.168.122.1');
  assert.equal(s4.text.length, 2);
});

test('preset longest-prefix: .253, .254, default', () => {
  const p = { script: 'longest-prefix' };
  assert.equal(at(p, 2).routes.length, 4);
  assert.deepEqual(at(p, 2).routes.map(logic.routeLine).slice(1, 3), ['10.0.0.0/8 via 192.168.122.254 dev enp1s0', '10.1.0.0/16 via 192.168.122.253 dev enp1s0']);
  assert.equal(at(p, 3).route.via, '192.168.122.253');
  assert.equal(at(p, 4).route.via, '192.168.122.254');
  assert.equal(at(p, 5).route.via, '192.168.122.1');
  // without an address the gateways are not on the link: the routes cannot be added
  assert.deepEqual(at({ script: 'longest-prefix', break: 'address' }, 1).out, ['Error: Nexthop has invalid gateway.']);
});

test('the profile fix brings the connection up again: address, routes and name server come from the profile', () => {
  const s = at({ script: 'bad-resolver', break: 'address' }, 4);
  assert.deepEqual(s.iface.addr, { ip: '192.168.122.57', prefix: 24 });
  assert.equal(s.routes.length, 2);
  assert.ok(s.event.changed.includes('iface') && s.event.changed.includes('routes'));
  assert.deepEqual(at({ script: 'bad-resolver', break: 'route' }, 4).routes.map(logic.routeLine), logic.healthyConfig().routes.map(logic.routeLine));
});

test('the DNS query of a name lookup reads the routing table too (to the name server)', () => {
  const s = at({ script: 'no-default', break: 'route' }, 3);
  assert.equal(s.lookup.purpose, 'dns');
  assert.equal(s.lookup.dest, '192.168.122.1');
  assert.equal(s.packet.kind, 'dns');
  assert.equal(s.packet.reply, true);
});

test('faults: the places still broken, and a repair clears them', () => {
  assert.deepEqual(logic.faults(at({}, 0)), []);
  assert.deepEqual(logic.faults(at({ break: 'address' }, 0)), ['iface']);
  assert.deepEqual(logic.faults(at({ break: 'route' }, 0)), ['route']);
  assert.deepEqual(logic.faults(at({ break: 'resolver' }, 0)), ['resolv']);
  assert.deepEqual(logic.faults(at({ break: 'hosts' }, 0)), ['hosts']);
  assert.deepEqual(logic.faults(at({ script: 'stale-hosts', break: 'hosts' }, 5)), []);
  assert.deepEqual(logic.faults(at({ script: 'bad-resolver', break: 'resolver' }, 4)), []);
});

test('strangers: LAN addresses where nobody is, over the whole script', () => {
  assert.deepEqual(logic.strangers(P({})), []);
  assert.deepEqual(logic.strangers(P({ script: 'stale-hosts', break: 'hosts' })), ['192.168.122.99']);
  assert.deepEqual(logic.strangers(P({ script: 'bad-resolver', break: 'resolver' })), ['192.168.122.250']);
  assert.deepEqual(logic.strangers(P({ break: 'hosts', target: 'by-address' })), []);
});

test('files: the first line naming the host answers', () => {
  const cfg = logic.healthyConfig();
  cfg.hosts.push({ ip: '192.168.122.99', names: ['democli1'] }, { ip: '192.168.122.98', names: ['democli1'] });
  assert.equal(logic.resolve(cfg, 'democli1').ip, '192.168.122.99');
});

test('route add: a gateway reachable only through the default route is refused', () => {
  const cfg = logic.healthyConfig();
  const r = logic.run(cfg, { k: 'routeAdd', dst: '10.0.0.0', prefix: 8, via: '8.8.8.8' }, P({}));
  assert.deepEqual(r.out, ['Error: Nexthop has invalid gateway.']);
  assert.equal(r.exit, 2);
  assert.equal(cfg.routes.length, 2);
});

test('packets: the DNS query to nobody gets no reply; an off-link ping goes via the gateway', () => {
  const d = at({ script: 'bad-resolver', break: 'resolver' }, 3).packet;
  assert.equal(d.kind, 'dns');
  assert.equal(d.reply, false);
  const p = at({ script: 'bad-resolver', break: 'resolver' }, 2).packet;
  assert.equal(p.via, '192.168.122.1');
  assert.equal(p.reply, true);
  assert.equal(at({ script: 'no-default', break: 'route' }, 4).packet, null, 'a ping that found no route sent nothing');
});

test('breaks at step 0: the resolver break is in the profile too; the fix marks only what it changed', () => {
  assert.equal(at({ break: 'resolver' }, 0).profile.dns, '192.168.122.250');
  const s = at({ script: 'bad-resolver', break: 'resolver' }, 4);
  assert.deepEqual(s.event.changed, ['profile', 'resolv']);
  assert.deepEqual(at({ script: 'bad-resolver', break: 'route' }, 4).event.changed, ['profile', 'resolv', 'routes']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const script of logic.SCRIPT_IDS) for (const b of logic.BREAKS) {
    const p = { script, break: b };
    for (let n = 0; n <= logic.steps(P(p)); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ script: 'stale-hosts', break: 'hosts' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ script: 'longest-prefix' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const presets = [...html.matchAll(/\{ id: '([\w-]+)', label: [^}]*params: \{([^}]*)\}/g)];
  assert.equal(presets.length, 6, 'six presets');
  for (const m of presets) {
    const keys = [...m[2].matchAll(/'?(\w+)'?:/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(m[2].includes("script: '" + m[1] + "'"), `preset ${m[1]} runs its own script`);
  }
});
