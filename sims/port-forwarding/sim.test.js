// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for port-forwarding's model (SPEC.md). Run: node --test sims/port-forwarding/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const hops = (over) => logic.walk(P(over)).hops;
const sock = (e) => e.ip + ':' + e.port;
const ep = (ip, port) => ({ ip, port });
const pkt = (proto, src, dst) => ({ proto, src, dst });
const NET = logic.net;
const OUT = NET.outside;
const K = ep('198.51.100.77', 40000);
const A = ep('192.168.1.10', 51000);
const B = ep('192.168.1.11', 51000);
const S = ep('192.168.1.20', 80);
const WEB = ep('198.51.100.10', 443);
const FWD = { proto: 'tcp', extPort: 8080, to: S };
const fwd = (...fs) => fs.reduce((list, f) => logic.addForward(list, f).forwards, []);

const PRESETS = {
  'book-no-forward': { scene: 'book', forward: false, proto: 'tcp', extPort: '61050', hairpin: false },
  'add-forward': { scene: 'outside', forward: true, proto: 'tcp', extPort: '8080', hairpin: false },
  'reply-vs-forward': { scene: 'mixed', forward: true, proto: 'tcp', extPort: '8080', hairpin: false },
  'wrong-proto': { scene: 'outside', forward: true, proto: 'udp', extPort: '8080', hairpin: false },
  hairpin: { scene: 'inside', forward: true, proto: 'tcp', extPort: '8080', hairpin: false }
};

// ── tie-breaks ──

test('tie-break (rule 7): a known connection is matched before a forward on the same port', () => {
  const forwards = fwd(FWD);
  const first = logic.classify(NET, [], forwards, pkt('tcp', K, ep(OUT, 8080)), 'out', false);
  assert.equal(first.rule, 'forward');
  // K's next packet of the same connection: the row decides, the forwards are not read, no second row
  const again = logic.classify(NET, first.table, forwards, pkt('tcp', K, ep(OUT, 8080)), 'out', false);
  assert.equal(again.rule, 'row');
  assert.equal(again.row, 0);
  assert.equal(again.fwdCompare, null);
  assert.equal(again.table.length, 1);
  assert.deepEqual(again.out.dst, S);
});

test('tie-break (rule 7): a forward added over a PAT port still loses to that connection\'s answers', () => {
  const made = logic.classify(NET, [], [], pkt('tcp', A, WEB), 'in', false);
  assert.equal(sock(made.out.src), OUT + ':61000');
  const forwards = fwd({ proto: 'tcp', extPort: 61000, to: S });
  const answer = logic.classify(NET, made.table, forwards, pkt('tcp', WEB, ep(OUT, 61000)), 'out', false);
  assert.equal(answer.rule, 'row');
  assert.deepEqual(answer.out.dst, A);
  const stranger = logic.classify(NET, made.table, forwards, pkt('tcp', K, ep(OUT, 61000)), 'out', false);
  assert.equal(stranger.rule, 'forward');
  assert.deepEqual(stranger.out.dst, S);
});

test('tie-break (rule 7): dynamic ports skip every forwarded port, of any protocol', () => {
  const forwards = fwd({ proto: 'tcp', extPort: 61000, to: S }, { proto: 'udp', extPort: 61001, to: S });
  const a = logic.classify(NET, [], forwards, pkt('tcp', A, WEB), 'in', false);
  assert.equal(a.out.src.port, 61002);
  const b = logic.classify(NET, a.table, forwards, pkt('tcp', B, WEB), 'in', false);
  assert.equal(b.out.src.port, 61003);
  assert.equal(logic.nextPort(NET, b.table, forwards), 61004);
});

test('tie-break: the lowest free port from 61000, a freed hole first (nat\'s freePort)', () => {
  const rows = [{ outside: ep(OUT, 61000) }, { outside: ep(OUT, 61002) }];
  assert.equal(logic.freePort(rows, OUT, 61000), 61001);
  assert.equal(logic.freePort([], OUT, 61000), 61000);
  assert.equal(logic.freePort([{ outside: ep('203.0.113.6', 61000) }], OUT, 61000), 61000);
});

test('tie-break: R reads rows top down and stops at the first match; rows below are not compared', () => {
  const s = at(PRESETS['reply-vs-forward'], 2);
  assert.equal(s.hop.decision.rule, 'row');
  assert.equal(s.hop.decision.row, 0);
  assert.equal(s.hop.decision.compare.length, 1);
});

// ── rules ──

test('rule 1: an outbound packet of a new connection gets the source 203.0.113.5:61000 and a row', () => {
  const s = at({}, 2);
  assert.equal(s.hop.decision.rule, 'new');
  assert.deepEqual(s.hop.was.src, A);
  assert.equal(sock(s.hop.pkt.src), '203.0.113.5:61000');
  assert.deepEqual(s.hop.pkt.dst, WEB, 'the destination is untouched');
  assert.equal(s.table.length, 1);
  const v = logic.viewOf(s.table[0]);
  assert.deepEqual([sock(v.inside), sock(v.outside), sock(v.remote)], ['192.168.1.10:51000', '203.0.113.5:61000', '198.51.100.10:443']);
  assert.equal(s.hop.decision.fwdCompare, null, 'forwards are not read for a packet to another address');
});

test('rule 1: B, from the same port 51000, gets 61001 (book ch. 11, Primjer 4)', () => {
  const s = at({}, 4);
  assert.equal(sock(s.hop.pkt.src), '203.0.113.5:61001');
  assert.deepEqual(s.table.map((r) => logic.viewOf(r).inside.port), [51000, 51000]);
  assert.deepEqual(s.table.map((r) => logic.viewOf(r).outside.port), [61000, 61001]);
});

test('rule 2: an answer to 203.0.113.5:61000 from the connection\'s remote end goes back to A; only the destination changes', () => {
  const s = at(PRESETS['reply-vs-forward'], 2);
  assert.equal(s.hop.from, 'R');
  assert.equal(s.hop.to, 'A');
  assert.deepEqual(s.hop.was.dst, ep(OUT, 61000));
  assert.deepEqual(s.hop.pkt.dst, A);
  assert.deepEqual(s.hop.pkt.src, s.hop.was.src);
  assert.equal(s.hop.deliver, true);
});

test('rule 2: the same outside port from another remote end is not that connection (drop, miss on remote)', () => {
  const s = at({ extPort: '61000' }, 5);
  assert.equal(s.hop.drop, 'R');
  assert.equal(s.hop.decision.compare[0].hit, false);
  assert.deepEqual(s.hop.decision.compare[0].miss, ['remote']);
});

test('a row that does not match names the fields of the direction the packet travels (step 5: outside and remote)', () => {
  const s = at({}, 5);
  assert.deepEqual(s.hop.decision.compare.map((c) => c.miss.slice().sort()), [['outside', 'remote'], ['outside', 'remote']]);
});

test('a row matches one protocol: UDP to a TCP row\'s port is not that connection', () => {
  const made = logic.classify(NET, [], [], pkt('tcp', A, WEB), 'in', false);
  const d = logic.classify(NET, made.table, [], pkt('udp', WEB, ep(OUT, 61000)), 'out', false);
  assert.equal(d.rule, 'drop');
  assert.deepEqual(d.compare[0].miss, ['proto']);
});

test('miss tie-break: with equal differences and neither direction sent to the packet\'s address, the opener\'s direction', () => {
  const row = logic.classify(NET, [], [], pkt('tcp', A, WEB), 'in', false).table[0];
  // one difference each way is impossible here; two each: orig (inside, remote) vs reply (remote, outside)
  const c = logic.compareRow(row, pkt('tcp', ep(A.ip, 51001), ep(WEB.ip, 444)));
  assert.equal(c.hit, false);
  assert.deepEqual(c.miss.slice().sort(), ['inside', 'remote']);
  const near = logic.compareRow(row, pkt('tcp', A, ep(WEB.ip, 444)));
  assert.deepEqual(near.miss, ['remote'], 'the nearer direction wins');
});

test('the next free port the page shows: 61000, then 61001 after A, 61002 after B', () => {
  assert.equal(at({}, 0).nextPort, 61000);
  assert.equal(at({}, 2).nextPort, 61001);
  assert.equal(at({}, 4).nextPort, 61002);
});

test('rule 3: a forward rewrites the destination to 192.168.1.20:80; the source stays K\'s', () => {
  const s = at(PRESETS['add-forward'], 2);
  assert.equal(s.hop.decision.rule, 'forward');
  assert.equal(s.hop.decision.fwd, 0);
  assert.deepEqual(s.hop.was, pkt('tcp', K, ep(OUT, 8080)));
  assert.deepEqual(s.hop.pkt, pkt('tcp', K, S));
  assert.equal(s.hop.to, 'S');
  assert.equal(s.table.length, 1, 'R records the connection');
  assert.equal(s.table[0].by, 'forward');
});

test('rule 4: no row and no forward: R drops the packet to 61050 (Primjer 4 (b))', () => {
  const s = at({}, 5);
  assert.equal(s.hop.from, 'K');
  assert.equal(s.hop.drop, 'R');
  assert.equal(s.hop.decision.rule, 'drop');
  assert.deepEqual(s.hop.pkt.dst, ep(OUT, 61050));
  assert.deepEqual(s.hop.decision.fwdCompare, [], 'no forwards to read');
  assert.equal(s.table.length, 2, 'the drop adds no row');
});

test('rule 5: S\'s answer leaves with the source 203.0.113.5:8080; the destination (K) is untouched', () => {
  const s = at(PRESETS['add-forward'], 4);
  assert.equal(s.hop.decision.rule, 'row');
  assert.deepEqual(s.hop.was, pkt('tcp', S, K));
  assert.deepEqual(s.hop.pkt, pkt('tcp', ep(OUT, 8080), K));
  assert.equal(s.hop.to, 'K');
  assert.equal(s.hop.deliver, true);
  assert.equal(s.hop.unexpected, false);
});

test('rule 6: a TCP forward does not let UDP to the same port in', () => {
  const s = at(PRESETS['wrong-proto'], 1);
  assert.equal(s.hop.drop, 'R');
  assert.deepEqual(s.hop.decision.fwdCompare, [{ hit: false, miss: ['proto'] }]);
  const udp = logic.classify(NET, [], fwd({ proto: 'udp', extPort: 8080, to: S }), pkt('udp', K, ep(OUT, 8080)), 'out', false);
  assert.equal(udp.rule, 'forward', 'a UDP forward does');
});

test('rule 8: a second forward on the same protocol and outside port is refused; one server may have several', () => {
  const one = logic.addForward([], FWD);
  assert.equal(one.refused, false);
  const clash = logic.addForward(one.forwards, { proto: 'tcp', extPort: 8080, to: ep('192.168.1.11', 80) });
  assert.equal(clash.refused, true);
  assert.equal(clash.forwards, one.forwards, 'the list is unchanged');
  const second = logic.addForward(one.forwards, { proto: 'tcp', extPort: 8443, to: S });
  assert.equal(second.refused, false);
  assert.equal(second.forwards.length, 2);
  assert.equal(logic.addForward(one.forwards, { proto: 'udp', extPort: 8080, to: S }).refused, false, 'another protocol is another port');
});

test('rule 9: without hairpinning S answers A directly, from an address A did not call, and A drops it', () => {
  const h = hops(PRESETS.hairpin);
  assert.equal(h.length, 3);
  assert.deepEqual(h[1].pkt, pkt('tcp', A, S), 'R rewrote the destination only');
  assert.equal(h[2].from, 'S');
  assert.equal(h[2].to, 'A', 'the answer does not pass through R');
  assert.deepEqual(h[2].pkt.src, S);
  assert.deepEqual(h[2].called, ep(OUT, 8080));
  assert.equal(h[2].unexpected, true);
  assert.equal(h[2].drop, 'A');
});

test('rule 9: with hairpinning R also rewrites the source to 203.0.113.5:61000 and the answer comes back through R', () => {
  const h = hops(Object.assign({}, PRESETS.hairpin, { hairpin: true }));
  assert.equal(h.length, 4);
  assert.deepEqual(h[1].pkt, pkt('tcp', ep(OUT, 61000), S));
  assert.deepEqual([h[2].from, h[2].to], ['S', 'R']);
  assert.deepEqual(h[3].was, pkt('tcp', S, ep(OUT, 61000)));
  assert.deepEqual(h[3].pkt, pkt('tcp', ep(OUT, 8080), A), 'both fields rewritten');
  assert.equal(h[3].deliver, true);
  assert.equal(h[3].unexpected, false);
});

test('rule 9: the hairpin source port is the next free one, and the row shows it as the opener\'s outside socket', () => {
  const made = logic.classify(NET, [], fwd(FWD), pkt('tcp', B, WEB), 'in', false);
  const d = logic.classify(NET, made.table, fwd(FWD), pkt('tcp', A, ep(OUT, 8080)), 'in', true);
  assert.equal(d.rule, 'forward');
  assert.equal(sock(d.out.src), '203.0.113.5:61001');
  assert.equal(sock(logic.viewOf(d.table[1]).as), '203.0.113.5:61001');
  const off = logic.classify(NET, made.table, fwd(FWD), pkt('tcp', A, ep(OUT, 8080)), 'in', false);
  assert.equal(logic.viewOf(off.table[1]).as, null);
});

test('hairpinning changes nothing for a client outside', () => {
  assert.deepEqual(hops(Object.assign({}, PRESETS['add-forward'], { hairpin: true })), hops(PRESETS['add-forward']));
});

test('without a forward, a packet from inside to the outside address is dropped like one from outside', () => {
  const h = hops({ scene: 'inside', extPort: '8080' });
  assert.equal(h.length, 1);
  assert.equal(h[0].drop, 'R');
});

test('classify does not change the table or the forwards it is given', () => {
  const table = at(PRESETS['reply-vs-forward'], 0).table, forwards = fwd(FWD);
  const t0 = structuredClone(table), f0 = structuredClone(forwards);
  logic.classify(NET, table, forwards, pkt('tcp', K, ep(OUT, 8080)), 'out', false);
  logic.classify(NET, table, forwards, pkt('tcp', A, WEB), 'in', false);
  assert.deepEqual(table, t0);
  assert.deepEqual(forwards, f0);
});

test('the model takes the inside network as data (a container behind the host, as lnx-container-ports will)', () => {
  const host = { outside: '203.0.113.5', inside: '10.88.0.', first: 61000 };
  const c = ep('10.88.0.5', 80);
  const d = logic.classify(host, [], fwd({ proto: 'tcp', extPort: 8080, to: c }), pkt('tcp', K, ep('203.0.113.5', 8080)), 'out', false);
  assert.equal(d.rule, 'forward');
  assert.deepEqual(d.out, pkt('tcp', K, c));
});

// ── presets: the task's step counts ──

test('presets: step counts 5, 4, 4, 1, 3 (4 with hairpinning); every combination 1 to 6', () => {
  const n = (o) => logic.steps(P(o));
  assert.equal(n(PRESETS['book-no-forward']), 5);
  assert.equal(n(PRESETS['add-forward']), 4);
  assert.equal(n(PRESETS['reply-vs-forward']), 4);
  assert.equal(n(PRESETS['wrong-proto']), 1);
  assert.equal(n(PRESETS.hairpin), 3);
  assert.equal(n(Object.assign({}, PRESETS.hairpin, { hairpin: true })), 4);
  for (const scene of logic.scenes) for (const forward of [false, true]) for (const proto of logic.protos)
    for (const extPort of logic.extPorts) for (const hairpin of [false, true]) {
      const k = n({ scene, forward, proto, extPort, hairpin });
      assert.ok(k >= 1 && k <= 6, `${scene} ${forward} ${proto} ${extPort} ${hairpin}: ${k}`);
    }
});

test('reply-vs-forward: two inbound packets, two reasons (row 1, then forward 1)', () => {
  const h = hops(PRESETS['reply-vs-forward']);
  assert.deepEqual(h.map((x) => x.from + '>' + x.to), ['W>R', 'R>A', 'K>R', 'R>S']);
  assert.equal(h[1].decision.rule, 'row');
  assert.equal(h[3].decision.rule, 'forward');
  assert.deepEqual(at(PRESETS['reply-vs-forward'], 0).table.map((r) => logic.viewOf(r).outside.port), [61000, 61001]);
});

test('the default is the book\'s example and sim.json\'s step count', () => {
  const meta = require('./sim.json');
  assert.deepEqual(logic.defaults, PRESETS['book-no-forward']);
  assert.equal(logic.steps(logic.defaults), meta.steps);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['reply-vs-forward']);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['add-forward']);
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
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.equal(sets.length, Object.keys(PRESETS).length);
  for (const m of sets) {
    const keys = [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  }
  for (const [id, params] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[^\\n]*params: (\\{[^}]*\\})`));
    assert.ok(m, `preset ${id} is in the page`);
    const got = Function(`return (${m[1]});`)();
    assert.deepEqual(got, params, `preset ${id} matches the tests`);
  }
});
