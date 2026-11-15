// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-firewalld-zones' model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (p, n) => kit.stateAt(logic, p, n);
/** One line per decision: "zone/kind" at steps 2 and 6, "verdict:by:item" at 3 and 7. */
const story = (p) => [2, 3, 6, 7].map((n) => {
  const s = at(p, n);
  return s.phase === 'zoned' ? `${s.zone}/${s.pick.kind}` : `${s.verdict}:${s.check.by}:${s.check.item || '-'}`;
});
const zone = (target, extra) => Object.assign({ target, prio: 0, services: [], ports: [], sources: [], interfaces: [] }, extra);
const pkt = (src, dport = '8991/tcp') => logic.packetOf(src, dport);
const ADMIN = '192.168.122.20', CLI = '192.168.122.186', OUT = '10.20.0.9';

// ── tie-breaks (rule 3) ──

test('tie-break: overlapping sources at equal priority go by zone name, not by prefix length', () => {
  const fw = { defaultZone: 'public', zones: {
    trusted: zone('ACCEPT', { sources: ['192.168.122.20/32'] }),
    dmz: zone('default', { services: ['ssh'], sources: ['192.168.122.0/24'] }),
    'public': zone('default', { interfaces: ['enp1s0'] })
  } };
  const r = logic.pickZone(fw, pkt(ADMIN));
  assert.equal(r.zone, 'dmz', 'dmz sorts before trusted, though /24 is the shorter prefix');
  assert.equal(r.row, 0);
  assert.deepEqual(r.rows.map((b) => b.zone), ['dmz', 'trusted', 'public']);
  // the other address of the /24 is in dmz too, and one outside both prefixes falls to the interface
  assert.equal(logic.pickZone(fw, pkt(CLI)).zone, 'dmz');
  fw.zones.dmz.sources = ['192.168.122.128/25'];
  assert.equal(logic.pickZone(fw, pkt(ADMIN)).zone, 'trusted');
  assert.equal(logic.pickZone(fw, pkt(CLI)).zone, 'dmz');
});

test('tie-break: a lower ingress priority goes first, whatever the zone name or the binding kind', () => {
  const fw = { defaultZone: 'public', zones: {
    trusted: zone('ACCEPT', { sources: ['192.168.122.20/32'], prio: -1 }),
    dmz: zone('default', { sources: ['192.168.122.0/24'] }),
    'public': zone('default', { interfaces: ['enp1s0'] })
  } };
  assert.equal(logic.pickZone(fw, pkt(ADMIN)).zone, 'trusted');
  assert.equal(logic.pickZone(fw, pkt(CLI)).zone, 'dmz');
  // an interface zone with a lower priority beats every source zone
  fw.zones['public'].prio = -10;
  assert.deepEqual(logic.bindings(fw).map((b) => b.kind + ':' + b.zone), ['interface:public', 'source:trusted', 'source:dmz']);
  assert.equal(logic.pickZone(fw, pkt(ADMIN)).zone, 'public');
});

test('tie-break: at equal priority every source binding is read before any interface binding', () => {
  const fw = { defaultZone: 'public', zones: {
    a: zone('DROP', { interfaces: ['enp1s0'] }),
    z: zone('ACCEPT', { sources: ['192.168.122.20/32'] })
  } };
  assert.deepEqual(logic.bindings(fw).map((b) => b.zone), ['z', 'a'], 'z (source) before a (interface)');
  assert.equal(logic.pickZone(fw, pkt(ADMIN)).zone, 'z');
  assert.equal(logic.pickZone(fw, pkt(CLI)).zone, 'a');
});

test('tie-break: the same prefix in another zone is refused (ZONE_CONFLICT) and nothing changes', () => {
  const fw = logic.apply(logic.firewallOf('by-source'), { op: 'add-source', zone: 'trusted', arg: '192.168.122.20/32' }).fw;
  const r = logic.apply(fw, { op: 'add-source', zone: 'home', arg: '192.168.122.20/32' });
  assert.equal(r.refused, 'ZONE_CONFLICT');
  assert.equal(r.moved, 'trusted');
  assert.deepEqual(r.fw, fw);
  assert.deepEqual(r.changed, []);
  // the same prefix in the same zone again: already there, unchanged
  const again = logic.apply(fw, { op: 'add-source', zone: 'trusted', arg: '192.168.122.20/32' });
  assert.equal(again.refused, 'ALREADY_ENABLED');
  assert.deepEqual(again.fw, fw);
  // an overlapping but different prefix is accepted
  assert.equal(logic.apply(fw, { op: 'add-source', zone: 'home', arg: '192.168.122.0/24' }).refused, null);
});

test('tie-break: --set-default-zone moves unbound interfaces only; an explicitly bound one stays', () => {
  const fw = logic.firewallOf('default-zone');
  assert.deepEqual(logic.unbound(fw), ['enp2s0']);
  const r = logic.apply(fw, { op: 'set-default-zone', zone: 'home', arg: null });
  assert.equal(r.fw.defaultZone, 'home');
  assert.equal(r.moved, 'public');
  assert.equal(logic.pickZone(r.fw, pkt(OUT)).zone, 'home');
  assert.equal(logic.pickZone(r.fw, pkt(CLI)).zone, 'public');
  assert.deepEqual(r.fw.zones['public'].interfaces, ['enp1s0']);
  assert.equal(logic.apply(r.fw, { op: 'set-default-zone', zone: 'home' }).refused, 'ALREADY_ENABLED');
});

test('commands: --add-port without --zone goes to the default zone, whichever it is; the same port again is refused', () => {
  const fw = logic.apply(logic.firewallOf('book'), { op: 'set-default-zone', zone: 'home' }).fw;
  const r = logic.apply(fw, { op: 'add-port', zone: null, arg: '8991/tcp' });
  assert.equal(r.zone, 'home');
  assert.deepEqual(r.fw.zones.home.ports, ['8991/tcp']);
  assert.deepEqual(r.fw.zones['public'].ports, ['514/tcp']);
  const again = logic.apply(r.fw, { op: 'add-port', zone: null, arg: '8991/tcp' });
  assert.equal(again.refused, 'ALREADY_ENABLED');
  assert.deepEqual(again.fw, r.fw);
  assert.deepEqual(again.changed, []);
});

test('addresses: a bare address is a /32; a prefix contains every address under its mask', () => {
  assert.equal(logic.inNet('192.168.122.20', '192.168.122.20'), true);
  assert.equal(logic.inNet('192.168.122.21', '192.168.122.20'), false);
  assert.equal(logic.inNet('192.168.122.21', '192.168.122.20/32'), false);
  assert.equal(logic.inNet('192.168.122.21', '192.168.122.0/24'), true);
  assert.equal(logic.inNet('192.168.123.1', '192.168.122.0/24'), false);
  assert.equal(logic.inNet('10.20.0.9', '0.0.0.0/0'), true);
});

// ── rule 1: one zone per interface and source ──

test('rule 1: --change-interface moves the interface out of its old zone; it is never in two', () => {
  const fw = logic.firewallOf('drop-vs-block');
  assert.equal(logic.holderOf(fw, 'interface', 'enp2s0'), 'drop');
  const r = logic.apply(fw, { op: 'change-interface', zone: 'block', arg: 'enp2s0' });
  assert.equal(r.moved, 'drop');
  assert.deepEqual(r.fw.zones.drop.interfaces, []);
  assert.deepEqual(r.fw.zones.block.interfaces, ['enp2s0']);
  for (const i of logic.IFACE_IDS) {
    const holders = Object.keys(r.fw.zones).filter((z) => r.fw.zones[z].interfaces.includes(i));
    assert.ok(holders.length <= 1, `${i} is in at most one zone`);
  }
  // an unbound interface can be bound; the same zone again changes nothing
  const r2 = logic.apply(logic.firewallOf('book'), { op: 'change-interface', zone: 'trusted', arg: 'enp2s0' });
  assert.equal(r2.moved, null);
  assert.deepEqual(r2.fw.zones.trusted.interfaces, ['enp2s0']);
  assert.equal(logic.apply(r2.fw, { op: 'change-interface', zone: 'trusted', arg: 'enp2s0' }).refused, 'ALREADY_ENABLED');
});

test('rule 1: every packet gets exactly one zone, at every step and for every param', () => {
  for (const scenario of logic.SCENARIO_IDS) for (const source of logic.SOURCES) for (const dport of logic.DPORTS) {
    const p = P({ scenario, source, dport });
    for (const n of [2, 6]) {
      const s = at(p, n);
      assert.equal(typeof s.zone, 'string');
      assert.ok(s.zone in s.zones, `${scenario} ${source} ${dport} step ${n}`);
    }
  }
});

// ── rule 2: source, then interface, then the default zone ──

test('rule 2: a source binding that contains the source wins over the interface\'s zone', () => {
  const p = P({ scenario: 'by-source', source: ADMIN });
  const s = at(p, 6);
  assert.equal(s.zone, 'trusted');
  assert.equal(s.pick.kind, 'source');
  assert.equal(s.packet.iif, 'enp1s0', 'it still came in on enp1s0');
  assert.deepEqual(s.pick.hits, [true]);
});

test('rule 2: a source binding that does not contain the source is read and passed over', () => {
  const s = at(P({ scenario: 'by-source', source: CLI }), 6);
  assert.equal(s.zone, 'public');
  assert.equal(s.pick.kind, 'interface');
  assert.equal(s.pick.row, 1);
  assert.deepEqual(s.pick.hits, [false, true]);
});

test('rule 2: no binding for the source or the interface → the default zone', () => {
  const s = at(P({ source: OUT }), 2);
  assert.equal(s.packet.iif, 'enp2s0');
  assert.equal(s.zone, 'public');
  assert.equal(s.pick.kind, 'default');
  assert.equal(s.pick.row, -1);
  assert.deepEqual(s.pick.hits, [false], 'the enp1s0 row was read');
});

test('rule 2: the interface and destination follow from the source address', () => {
  assert.deepEqual(pkt(CLI), { src: CLI, iif: 'enp1s0', dst: '192.168.122.57', proto: 'tcp', dport: 8991, spec: '8991/tcp' });
  assert.deepEqual(pkt(OUT, 'icmp'), { src: OUT, iif: 'enp2s0', dst: '10.20.0.1', proto: 'icmp', dport: null, spec: 'icmp' });
  assert.equal(logic.iifOf('172.16.0.1'), null);
});

// ── rule 4: services and ports ──

test('rule 4: a service matches through its definition (ssh → 22/tcp)', () => {
  const pub = logic.firewallOf('book').zones['public'];
  assert.deepEqual(logic.judge(pub, pkt(CLI, '22/tcp')), { verdict: 'accept', by: 'service', item: 'ssh', target: 'default' });
  assert.deepEqual(logic.judge(pub, pkt(CLI, '9090/tcp')).item, 'cockpit');
  // a service's name alone is not a port: drop its definition and the packet is rejected
  const bare = Object.assign({}, pub, { services: ['nosuch'] });
  assert.equal(logic.judge(bare, pkt(CLI, '22/tcp')).verdict, 'reject');
});

test('rule 4: a listed port matches; protocol counts', () => {
  const z = zone('default', { ports: ['8991/tcp'] });
  assert.deepEqual(logic.judge(z, pkt(CLI)), { verdict: 'accept', by: 'port', item: '8991/tcp', target: 'default' });
  assert.equal(logic.judge(zone('default', { ports: ['8991/udp'] }), pkt(CLI)).verdict, 'reject');
  assert.equal(logic.judge(zone('default', { services: ['dhcpv6-client'] }), pkt(CLI, '22/tcp')).verdict, 'reject');
});

test('rule 4: the lists are read before the target, in every zone', () => {
  assert.equal(logic.judge(zone('DROP', { services: ['ssh'] }), pkt(OUT, '22/tcp')).verdict, 'accept');
  assert.equal(logic.judge(zone('REJECT', { ports: ['22/tcp'] }), pkt(OUT, '22/tcp')).by, 'port');
  // services before ports when both match
  assert.equal(logic.judge(zone('default', { services: ['ssh'], ports: ['22/tcp'] }), pkt(CLI, '22/tcp')).by, 'service');
});

// ── rule 5: the target ──

test('rule 5: target default accepts ICMP and rejects the rest', () => {
  const z = zone('default');
  assert.deepEqual(logic.judge(z, pkt(CLI, 'icmp')), { verdict: 'accept', by: 'target', item: null, target: 'default' });
  assert.equal(logic.judge(z, pkt(CLI, '8991/tcp')).verdict, 'reject');
});

test('rule 5: REJECT rejects, DROP drops, ACCEPT accepts, ICMP included', () => {
  for (const d of ['8991/tcp', 'icmp']) {
    assert.equal(logic.judge(zone('REJECT'), pkt(OUT, d)).verdict, 'reject', d);
    assert.equal(logic.judge(zone('DROP'), pkt(OUT, d)).verdict, 'drop', d);
    assert.equal(logic.judge(zone('ACCEPT'), pkt(OUT, d)).verdict, 'accept', d);
  }
  // ICMP is never matched by a port or a service
  assert.equal(logic.judge(zone('REJECT', { ports: ['22/tcp'], services: ['ssh'] }), pkt(OUT, 'icmp')).by, 'target');
});

// ── rule 6: what the client sees ──

test('rule 6: reject → an answer that says no; drop → a timeout; accept → the service answers', () => {
  assert.equal(logic.clientOf('reject'), 'unreach');
  assert.equal(logic.clientOf('drop'), 'timeout');
  assert.equal(logic.clientOf('accept'), 'answer');
  assert.equal(at(P({}), 3).client, 'unreach');
  assert.equal(at(P({ scenario: 'drop-vs-block', source: OUT, dport: '22/tcp' }), 3).client, 'timeout');
});

// ── the steps and the presets' numbers ──

test('seven steps: the packet (arrived, zoned, judged), one command, the same packet again', () => {
  assert.equal(logic.steps(P({})), 7);
  const p = P({});
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((n) => at(p, n).phase),
    ['idle', 'arrived', 'zoned', 'judged', 'config', 'arrived', 'zoned', 'judged']);
  assert.deepEqual([1, 5].map((n) => at(p, n).round), [1, 2]);
  assert.equal(at(p, 0).packet, null);
  assert.equal(at(p, 1).zone, null, 'the zone is not known when the packet arrives');
  assert.equal(at(p, 2).verdict, null, 'the verdict comes a step after the zone');
  assert.equal(at(p, 4).packet, null);
  assert.deepEqual(at(p, 5).packet, at(p, 1).packet, 'the same packet again');
});

test('preset book: public by interface, reject (No route to host); --add-port=8991/tcp; then accept by port', () => {
  const p = P({ scenario: 'book' });
  assert.deepEqual(story(p), ['public/interface', 'reject:target:-', 'public/interface', 'accept:port:8991/tcp']);
  const c = at(p, 4);
  assert.deepEqual(c.cmd, { op: 'add-port', zone: 'public', arg: '8991/tcp', explicit: false, refused: null, moved: null });
  assert.deepEqual(c.zones['public'].ports, ['514/tcp', '8991/tcp']);
  assert.deepEqual(c.changed, ['port:8991/tcp']);
  // the other packets of the book: ssh by service, ICMP by the default target, cockpit by service
  assert.deepEqual(story(P({ dport: '22/tcp' })), ['public/interface', 'accept:service:ssh', 'public/interface', 'accept:service:ssh']);
  assert.deepEqual(story(P({ dport: 'icmp' })), ['public/interface', 'accept:target:-', 'public/interface', 'accept:target:-']);
  assert.deepEqual(story(P({ dport: '9090/tcp' })).slice(0, 2), ['public/interface', 'accept:service:cockpit']);
});

test('preset by-source: .20 goes from public (reject) to trusted (accept); .186 stays in public', () => {
  assert.deepEqual(story(P({ scenario: 'by-source', source: ADMIN })),
    ['public/interface', 'reject:target:-', 'trusted/source', 'accept:target:-']);
  assert.deepEqual(at(P({ scenario: 'by-source' }), 4).zones.trusted.sources, ['192.168.122.20/32']);
  assert.deepEqual(story(P({ scenario: 'by-source', source: CLI })),
    ['public/interface', 'reject:target:-', 'public/interface', 'reject:target:-']);
});

test('preset drop-vs-block: enp2s0 in drop gives silence, in block a reject', () => {
  const p = P({ scenario: 'drop-vs-block', source: OUT, dport: '22/tcp' });
  assert.deepEqual(story(p), ['drop/interface', 'drop:target:-', 'block/interface', 'reject:target:-']);
  assert.deepEqual([3, 7].map((n) => at(p, n).client), ['timeout', 'unreach']);
  assert.equal(at(p, 4).cmd.moved, 'drop');
  assert.deepEqual(story(P({ scenario: 'drop-vs-block', source: OUT, dport: 'icmp' })),
    ['drop/interface', 'drop:target:-', 'block/interface', 'reject:target:-']);
  // a packet on enp1s0 is not affected
  assert.deepEqual(story(P({ scenario: 'drop-vs-block', source: CLI, dport: '22/tcp' })),
    ['public/interface', 'accept:service:ssh', 'public/interface', 'accept:service:ssh']);
});

test('preset default-zone: enp2s0 is judged by public, then by home; enp1s0 does not move', () => {
  const p = P({ scenario: 'default-zone', source: OUT, dport: '22/tcp' });
  assert.deepEqual(story(p), ['public/default', 'accept:service:ssh', 'home/default', 'accept:service:ssh']);
  const c = at(p, 4);
  assert.equal(c.defaultZone, 'home');
  assert.deepEqual(c.cmd, { op: 'set-default-zone', zone: 'home', arg: null, explicit: true, refused: null, moved: 'public' });
  assert.deepEqual(story(P({ scenario: 'default-zone', source: CLI, dport: '22/tcp' })),
    ['public/interface', 'accept:service:ssh', 'public/interface', 'accept:service:ssh']);
  assert.deepEqual(story(P({ scenario: 'default-zone', source: OUT })),
    ['public/default', 'reject:target:-', 'home/default', 'reject:target:-']);
});

test('sim.json steps and the page\'s presets: four firewalld presets and four Windows ones, each with its scenario', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['book', 'by-source', 'drop-vs-block', 'default-zone', 'win-office', 'win-home', 'win-cafe', 'win-vpn']);
  for (const e of sim.entries || []) assert.ok(ids.includes(e.preset), e.preset);
});

// ── the Windows flow (preset task win-firewall-profiles; SPEC.md "Windows profiles") ──

const W = (over) => P(Object.assign({ scenario: 'win' }, over));
/** One line per step of the Windows flow: what each step decided. */
const wstory = (p) => {
  const out = [];
  for (let n = 1; n <= logic.steps(p); n++) {
    const s = at(p, n);
    if (s.phase === 'connect') out.push(`${s.adapters[s.focus].name}=${s.profile}`);
    else if (s.phase === 'arrived') out.push(`${s.packet.src}@${s.packet.iif}=${s.profile}`);
    else if (s.phase === 'checked') out.push(`${s.check.by}:${s.check.item || '-'}`);
    else out.push(`${s.verdict}/${s.client}`);
  }
  return out;
};
const adapter = (over) => Object.assign({ name: 'Wi-Fi', network: 'x', addr: '10.0.0.1', category: null, dcReachable: false, profile: null }, over);
const wpkt = (profile, spec) => ({ spec, proto: spec === 'icmp' ? 'icmp' : 'tcp', profile });

test('W tie-break: a reachable domain controller beats the category the network was given', () => {
  assert.deepEqual(logic.pickProfile(adapter({ category: 'private', dcReachable: true })), { profile: 'domain', row: 0, hits: [true] });
  assert.deepEqual(logic.pickProfile(adapter({ category: 'public', dcReachable: true })), { profile: 'domain', row: 0, hits: [true] });
});

test('W tie-break: a network given the category Public is decided by its row, not by the implicit new-network row', () => {
  assert.deepEqual(logic.pickProfile(adapter({ category: 'public' })), { profile: 'public', row: 2, hits: [false, false, true] });
  assert.deepEqual(logic.pickProfile(adapter({ category: null })), { profile: 'public', row: -1, hits: [false, false, false] });
});

test('W tie-break: a source on the Wi-Fi network and inside a VPN route comes in on the Wi-Fi (the direct network first)', () => {
  const ads = logic.adaptersOf(W({ wifi: 'home', vpn: true }));
  // fake an office-like Wi-Fi network that the VPN route also covers
  const both = [Object.assign({}, ads[1]), Object.assign({}, ads[0], { network: 'office' })];
  assert.equal(logic.winIif(both, '10.10.20.31'), 1, 'office Wi-Fi contains it directly; the VPN only routes it');
  assert.equal(logic.winIif(ads, '10.10.20.31'), 1, 'from home it comes through the VPN');
  assert.equal(logic.winIif(ads, '192.168.1.40'), 0);
  assert.equal(logic.winIif(ads, '172.20.5.14'), -1, 'no adapter reaches the café from home');
});

test('W1: every profile blocks inbound by default and allows outbound; a block drops without a reply', () => {
  assert.deepEqual(logic.PROFILE_DEFAULTS, { inbound: 'block', outbound: 'allow' });
  for (const pr of logic.PROFILES) {
    const r = logic.judgeProfile(pr, wpkt(pr, '8080/tcp'));
    assert.deepEqual([r.verdict, r.by, r.item], ['drop', 'default', null], pr);
    assert.equal(logic.clientOf(r.verdict), 'timeout');
  }
});

test('W2: the profile by detection: domain controller → Domain, category Private → Private, new network → Public', () => {
  const p = (net) => logic.pickProfile(logic.adaptersOf(W({ wifi: net }))[0]);
  assert.deepEqual([p('office').profile, p('office').row], ['domain', 0]);
  assert.deepEqual([p('home').profile, p('home').row], ['private', 1]);
  assert.deepEqual([p('cafe').profile, p('cafe').row], ['public', -1]);
  assert.deepEqual(logic.pickProfile(logic.adaptersOf(W({ wifi: 'cafe', vpn: true }))[1]).profile, 'domain');
});

test('W2: the profile is chosen when the adapter connects, before any packet, and stays with the adapter', () => {
  const p = W({ wifi: 'cafe', vpn: true });
  assert.deepEqual(at(p, 0).adapters.map((a) => a.profile), [null, null]);
  assert.deepEqual(at(p, 1).adapters.map((a) => a.profile), ['public', null]);
  assert.deepEqual(at(p, 2).adapters.map((a) => a.profile), ['public', 'domain']);
  assert.equal(at(p, 1).packet, null);
  for (let n = 3; n <= 8; n++) assert.deepEqual(at(p, n).adapters.map((a) => a.profile), ['public', 'domain'], `step ${n}`);
});

test('W3: two adapters, two profiles at once; each packet is judged by the profile of the adapter it comes in on', () => {
  const p = W({ wifi: 'cafe', vpn: true });
  assert.deepEqual(wstory(p), ['Wi-Fi=public', 'VPN=domain',
    '172.20.5.14@Wi-Fi=public', 'default:-', 'drop/timeout',
    '10.10.20.31@VPN=domain', 'rule:smb', 'accept/answer']);
  assert.equal(at(p, 6).packet.dst, '10.10.250.7', 'through the VPN the packet goes to the VPN address');
  assert.equal(at(p, 3).packet.dst, '172.20.5.77');
});

test('W3: the same laptop and packet give a different verdict on another network (the profile follows the network)', () => {
  const v = (wifi) => at(W({ wifi }), 4);
  assert.deepEqual(['office', 'home', 'cafe'].map((w) => v(w).verdict), ['accept', 'accept', 'drop']);
});

test('W4: rules are scoped to profiles: SMB and echo for Domain and Private, remote desktop for Domain only', () => {
  const j = (pr, spec) => { const r = logic.judgeProfile(pr, wpkt(pr, spec)); return `${r.verdict}:${r.item || '-'}`; };
  assert.deepEqual(logic.PROFILES.map((pr) => j(pr, '445/tcp')), ['accept:smb', 'accept:smb', 'drop:-']);
  assert.deepEqual(logic.PROFILES.map((pr) => j(pr, 'icmp')), ['accept:echo', 'accept:echo', 'drop:-']);
  assert.deepEqual(logic.PROFILES.map((pr) => j(pr, '3389/tcp')), ['accept:rdp', 'drop:-', 'drop:-']);
  // a rule that matches the port but is not enabled for the profile is shown so, and does not decide
  const r = logic.judgeProfile('public', wpkt('public', '445/tcp'));
  assert.deepEqual(r.lines.find((l) => l.id === 'smb'), { id: 'smb', match: true, enabled: false });
  // protocol counts: ICMP does not match a TCP rule
  assert.equal(logic.judgeProfile('domain', wpkt('domain', 'icmp')).item, 'echo');
});

test('W steps: each adapter connects in one step, each packet in three (arrived, checked, judged)', () => {
  assert.equal(logic.steps(W({ wifi: 'office' })), 4);
  assert.equal(logic.steps(W({ wifi: 'cafe', vpn: true })), 8);
  assert.equal(logic.steps(W({ wifi: 'office', vpn: true })), 4, 'no VPN in the office');
  const p = W({ wifi: 'home' });
  assert.deepEqual([0, 1, 2, 3, 4].map((n) => at(p, n).phase), ['idle', 'connect', 'arrived', 'checked', 'judged']);
  assert.equal(at(p, 2).check, null, 'the rules are read a step after the packet arrives');
  assert.equal(at(p, 3).verdict, null, 'the verdict comes a step after the rules');
});

test('W presets: win-office, win-home, win-cafe, win-vpn', () => {
  assert.deepEqual(wstory(W({ wifi: 'office' })), ['Wi-Fi=domain', '10.10.20.31@Wi-Fi=domain', 'rule:smb', 'accept/answer']);
  assert.deepEqual(wstory(W({ wifi: 'home' })), ['Wi-Fi=private', '192.168.1.40@Wi-Fi=private', 'rule:smb', 'accept/answer']);
  assert.deepEqual(wstory(W({ wifi: 'cafe' })), ['Wi-Fi=public', '172.20.5.14@Wi-Fi=public', 'default:-', 'drop/timeout']);
  assert.equal(wstory(W({ wifi: 'cafe', vpn: true })).length, 8);
  // the other packets one click away
  assert.deepEqual(wstory(W({ wifi: 'home', wport: '3389/tcp' })).slice(2), ['default:-', 'drop/timeout']);
  assert.deepEqual(wstory(W({ wifi: 'office', wport: '3389/tcp' })).slice(2), ['rule:rdp', 'accept/answer']);
  assert.deepEqual(wstory(W({ wifi: 'cafe', wport: 'icmp' })).slice(2), ['default:-', 'drop/timeout']);
});

test('W off: the firewalld scenarios ignore the Windows params', () => {
  const base = P({ scenario: 'by-source', source: ADMIN });
  const withWin = Object.assign({}, base, { wifi: 'cafe', vpn: true, wport: '3389/tcp' });
  for (let n = 0; n <= 7; n++) assert.deepEqual(at(withWin, n), at(base, n));
  assert.equal(logic.steps(withWin), 7);
  assert.equal(at(base, 0).scene, undefined, 'the firewalld state has no scene field');
});

test('W generic: JSON-safe, deterministic, step back = replay, input not mutated, unknown params fall back', () => {
  for (const wifi of logic.WIFI_NETS) for (const vpn of [false, true]) for (const wport of logic.WPORTS) {
    const p = W({ wifi, vpn, wport });
    let s = logic.initial(p);
    const forward = [s];
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      assert.deepEqual(JSON.parse(JSON.stringify(next)), next);
      s = next; forward.push(s);
    }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
  assert.deepEqual(wstory(W({ wifi: 'moon', wport: '9/udp' })), wstory(W({ wifi: 'office' })));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scenario of logic.SCENARIO_IDS) {
    const p = P({ scenario, source: OUT, dport: 'icmp' });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const scenario of logic.SCENARIO_IDS) {
    const p = P({ scenario, source: ADMIN });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scenario: 'drop-vs-block' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
  const fw = logic.firewallOf('book');
  const copy = structuredClone(fw);
  logic.apply(fw, { op: 'add-source', zone: 'trusted', arg: '192.168.122.20/32' });
  assert.deepEqual(fw, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(sets.length > 0, 'found preset params');
  for (const set of sets) {
    for (const k of [...set.matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const sc = set.match(/scenario:\s*'([^']+)'/);
    if (sc) assert.ok(logic.SCENARIO_IDS.includes(sc[1]) || sc[1] === 'win', sc[1]);
    const wf = set.match(/wifi:\s*'([^']+)'/);
    if (wf) assert.ok(logic.WIFI_NETS.includes(wf[1]), wf[1]);
    const wp = set.match(/wport:\s*'([^']+)'/);
    if (wp) assert.ok(logic.WPORTS.includes(wp[1]), wp[1]);
    const src = set.match(/source:\s*'([^']+)'/);
    if (src) assert.ok(logic.SOURCES.includes(src[1]), src[1]);
    const dp = set.match(/dport:\s*'([^']+)'/);
    if (dp) assert.ok(logic.DPORTS.includes(dp[1]), dp[1]);
  }
});
