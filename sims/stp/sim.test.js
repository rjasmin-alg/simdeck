// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the stp model: rules (SPEC.md), tie-breaks first, then the presets' expected numbers, then the
// template's generic block. Run: node --test sims/stp/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const port = (s, key) => s.ports.find((q) => q.key === key);
const bridge = (s, id) => s.bridges.find((b) => b.id === id);
const mac = (n) => '02:00:00:00:00:0' + n;
const vec = (root, cost, bridgeBid, portNo) => ({ root, cost, bridge: bridgeBid, port: logic.portIdOf(portNo) });
const B = (prio, n) => logic.bidOf(prio, mac(n));

/** Run any scene (not only the page's) to the end; returns every state. */
function run(scene, p) {
  const out = [logic.initialStp(scene, Object.assign({ topo: 'custom', cutLink: 'none' }, p))];
  while (!out[out.length - 1].done && out.length < 60) out.push(logic.stepStp(scene, out[out.length - 1]));
  return out;
}
function sw(id, n, prio) { return { id, kind: 'switch', prio: prio || 32768, mac: mac(n), bid: B(prio || 32768, n) }; }
function link(id, a, pa, b, pb, cost) { return { id, a, pa, b, pb, speed: 1000, cost: cost || 4 }; }

// ── rule 2: the BPDU compare (tie-breaks first) ──

test('rule 2: the first difference decides, in the order root, cost, sender BID, sender port', () => {
  const r1 = B(32768, 1), r2 = B(32768, 2), s2 = B(32768, 2), s3 = B(32768, 3);
  // sender port decides only when root, cost and sender are equal
  assert.equal(logic.cmpVec(vec(r1, 4, s2, 1), vec(r1, 4, s2, 2)), -1);
  assert.equal(logic.decidedBy(vec(r1, 4, s2, 1), vec(r1, 4, s2, 2)), 'port');
  // sender BID beats a lower port number
  assert.equal(logic.cmpVec(vec(r1, 4, s2, 9), vec(r1, 4, s3, 1)), -1);
  assert.equal(logic.decidedBy(vec(r1, 4, s2, 9), vec(r1, 4, s3, 1)), 'bridge');
  // cost beats sender BID
  assert.equal(logic.cmpVec(vec(r1, 4, s3, 1), vec(r1, 8, s2, 1)), -1);
  assert.equal(logic.decidedBy(vec(r1, 4, s3, 1), vec(r1, 8, s2, 1)), 'cost');
  // root beats cost
  assert.equal(logic.cmpVec(vec(r1, 100, s3, 1), vec(r2, 0, s2, 1)), -1);
  assert.equal(logic.decidedBy(vec(r1, 100, s3, 1), vec(r2, 0, s2, 1)), 'root');
  assert.equal(logic.decidedBy(vec(r1, 4, s2, 1), vec(r1, 4, s2, 1)), null);
});

test('rule 1: bridge ID = priority first, then MAC; lower is better', () => {
  assert.ok(B(4096, 3) < B(32768, 1), 'a lower priority wins over a lower MAC');
  assert.ok(B(32768, 1) < B(32768, 2), 'equal priority: the lower MAC wins');
  assert.equal(B(32768, 1), '8000020000000001');
  assert.equal(logic.portIdOf(1), 0x8001);
});

// ── rule 4: root port tie-breaks ──

test('rule 4: equal cost → the lower sender BID decides the root port', () => {
  // square: S1 root; S4 reaches it via S2 or S3, both cost 8 → the port facing S2 (lower BID)
  const scene = { topo: 'custom', sender: null, nodes: [sw('S1', 1), sw('S2', 2), sw('S3', 3), sw('S4', 4)],
    links: [link('a', 'S1', 1, 'S2', 1), link('b', 'S1', 2, 'S3', 1), link('c', 'S3', 2, 'S4', 1), link('d', 'S2', 2, 'S4', 2)] };
  const end = run(scene).at(-1);
  assert.equal(bridge(end, 'S4').cost, 8);
  assert.equal(bridge(end, 'S4').rootPort, 2, 'port 2 faces S2, even though port 1 has the lower own number');
  assert.equal(port(end, 'S4:1').role, 'blocked');
});

test('rule 4: equal cost and sender → the sender\'s port ID decides, not the own port (preset port-id)', () => {
  const s = last({ topo: 'pair' });
  assert.equal(bridge(s, 'S2').rootPort, 2, 'S2 p2 faces S1 p1 (128.1)');
  assert.equal(port(s, 'S2:1').role, 'blocked');
  assert.equal(port(s, 'S2:2').role, 'root');
});

test('rule 4: everything equal up to the own port → the lower own port ID', () => {
  // two ports holding the same BPDU (as on a shared segment): the root port is the lower-numbered one
  const scene = { topo: 'custom', nodes: [sw('S1', 1), sw('S2', 2)], links: [link('x', 'S1', 1, 'S2', 1), link('y', 'S1', 2, 'S2', 2)] };
  const st = logic.initialStp(scene, { topo: 'custom' });
  const same = Object.assign(vec(B(32768, 1), 0, B(32768, 1), 1), { at: 0 });
  port(st, 'S2:2').stored = Object.assign({}, same);
  port(st, 'S2:1').stored = Object.assign({}, same);
  st.ports.reverse();   // so the scan meets p2 first: only the own-port tie-break can pick p1
  logic.recompute(scene, st);
  assert.equal(bridge(st, 'S2').rootPort, 1);
});

// ── rule 5: designated tie-breaks ──

test('rule 5: equal cost on a link → the lower BID is designated (preset triangle: S3 p2 blocks)', () => {
  const s = last({});
  assert.equal(port(s, 'S2:2').role, 'designated');
  assert.equal(port(s, 'S3:2').role, 'blocked');
});

test('rule 5: equal cost and bridge → the lower port ID is designated (a cable looped back into one switch)', () => {
  const scene = { topo: 'custom', nodes: [sw('S1', 1)], links: [link('loop', 'S1', 1, 'S1', 2)] };
  const end = run(scene).at(-1);
  assert.equal(port(end, 'S1:1').role, 'designated');
  assert.equal(port(end, 'S1:2').role, 'blocked');
});

test('rule 5: lower cost beats a lower BID for designated (the other end may have the better bridge ID)', () => {
  // square, root S1 (priority 4096); S4 has the lowest MAC of the rest but is 8 from the root, S3 only 4
  const scene = { topo: 'custom', nodes: [sw('S1', 9, 4096), sw('S2', 2), sw('S3', 3), sw('S4', 0)],
    links: [link('a', 'S1', 1, 'S2', 1), link('b', 'S1', 2, 'S3', 1), link('c', 'S3', 2, 'S4', 1), link('d', 'S2', 2, 'S4', 2)] };
  const end = run(scene).at(-1);
  assert.equal(port(end, 'S3:2').role, 'designated', 'S3 (cost 4) beats S4 (cost 8, lower BID)');
  assert.equal(port(end, 'S2:2').role, 'designated');
  assert.ok(['S4:1', 'S4:2'].some((k) => port(end, k).role === 'blocked'));
});

test('rule 5: the designated compare runs to the port ID (own offer 128.1 beats a stored 128.2 from itself)', () => {
  const scene = { topo: 'custom', nodes: [sw('S1', 1)], links: [link('loop', 'S1', 1, 'S1', 2)] };
  const st = logic.initialStp(scene, { topo: 'custom' });
  port(st, 'S1:1').stored = Object.assign(vec(B(32768, 1), 0, B(32768, 1), 2), { at: 0 });
  logic.recompute(scene, st);
  assert.equal(port(st, 'S1:1').role, 'designated');
});

// ── rules 3, 6 ──

test('rule 3: the lowest BID is root and all its ports are designated', () => {
  for (const over of [{}, { prioS3: 4096 }, { prioS2: 28672 }, { slowLink: 'S1-S3' }]) {
    const s = last(over);
    const low = s.bridges.map((b) => b.bid).sort()[0];
    const rootB = s.bridges.find((b) => b.bid === low);
    assert.equal(rootB.root, low);
    s.bridges.forEach((b) => assert.equal(b.root, low, `${b.id} agrees on the root`));
    s.ports.filter((q) => q.bridge === rootB.id).forEach((q) => assert.equal(q.role, 'designated'));
  }
});

test('rule 6: a blocked port keeps receiving BPDUs but forwards no frames', () => {
  const steps = [];
  const p = P({});
  for (let n = 0; n <= logic.steps(p); n++) steps.push(kit.stateAt(logic, p, n));
  const stable = steps.find((s) => s.phase === 'stable');
  assert.ok(stable.bpdus.some((m) => m.to === 'S3' && m.toPort === 2 && m.result === 'refreshed'), 'S3 p2 still hears S2');
  const frame = steps.at(-1);
  assert.equal(frame.phase, 'frame');
  const hop = frame.frame.hops.find((h) => h.from === 'S2' && h.to === 'S3');
  assert.equal(hop.drop, true, 'the copy towards the blocked port is discarded');
  assert.equal(frame.frame.hops.filter((h) => h.to === 'S3' && !h.drop).length, 1, 'S3 gets the broadcast once');
  assert.deepEqual(frame.frame.recv, { H3: 1 });
});

// ── rule 7: path costs ──

test('rule 7: short path costs; the slow link loses to two fast hops (preset cost-wins)', () => {
  assert.deepEqual(logic.COST, { 10: 100, 100: 19, 1000: 4, 10000: 2 });
  assert.equal(logic.linkOf(logic.sceneOf(P({ slowLink: 'S1-S3' })), 'S1-S3').cost, 19);
  const s = last({ slowLink: 'S1-S3' });
  assert.equal(bridge(s, 'S3').cost, 8, '4 + 4 = 8 < 19');
  assert.equal(bridge(s, 'S3').rootPort, 2);
  assert.equal(port(s, 'S3:1').role, 'blocked', 'S3 p1 (towards S1) blocks: the slow link carries nothing');
  assert.equal(port(s, 'S1:2').role, 'designated');
});

// ── rule 8: timers ──

test('rule 8: listening at 0 s, learning at 15 s, forwarding at 30 s; the blocked port stays blocking', () => {
  const p = P({});
  const states = [];
  for (let n = 0; n <= logic.steps(p); n++) states.push(kit.stateAt(logic, p, n));
  assert.deepEqual(states.map((s) => s.t), [0, 0, 2, 4, 15, 30, 30]);
  assert.deepEqual(states.map((s) => s.phase), ['power', 'claims', 'round', 'stable', 'timer', 'timer', 'frame']);
  assert.equal(port(states[1], 'S1:1').state, 'listening');
  assert.equal(port(states[4], 'S1:1').state, 'learning');
  assert.equal(port(states[5], 'S1:1').state, 'forwarding');
  assert.equal(port(states[5], 'S3:2').state, 'blocking');
  assert.equal(port(states[1], 'S3:2').state, 'listening', 'designated after the claims');
  assert.equal(port(states[2], 'S3:2').state, 'blocking', 'back to blocking when it loses at t = 2 s');
});

test('rule 8: indirect failure: the inferior BPDU is ignored until max age, then 15 s + 15 s (≈ 50 s)', () => {
  const p = P({ cutLink: 'S1-S2' });
  const n = logic.steps(p);
  const states = [];
  for (let i = 0; i <= n; i++) states.push(kit.stateAt(logic, p, i));
  const cut = states.find((s) => s.phase === 'cut');
  assert.equal(cut.t, logic.CUT_AT);
  assert.equal(bridge(cut, 'S2').root, B(32768, 2), 'S2 claims root');
  const claim = cut.bpdus.find((m) => m.from === 'S2' && m.to === 'S3');
  assert.equal(claim.result, 'ignored');
  assert.equal(port(cut, 'S3:2').role, 'blocked');
  const aged = states.find((s) => s.phase === 'aged');
  assert.equal(aged.t - logic.CUT_AT, 20, 'max age');
  assert.equal(port(aged, 'S3:2').role, 'designated');
  assert.equal(port(aged, 'S3:2').state, 'listening');
  assert.equal(bridge(aged, 'S2').rootPort, 2);
  assert.equal(bridge(aged, 'S2').cost, 8);
  assert.equal(port(aged, 'S2:2').state, 'forwarding', 'a forwarding port that becomes root port stays forwarding');
  const fwd = states.find((s) => s.t > aged.t && port(s, 'S3:2').state === 'forwarding');
  assert.equal(fwd.t - logic.CUT_AT, 50);
  assert.equal(states.find((s) => port(s, 'S3:2').state === 'learning' && s.t > aged.t).t - logic.CUT_AT, 35);
});

test('rule 8: direct failure skips max age (≈ 30 s)', () => {
  const p = P({ cutLink: 'S1-S3' });
  const states = [];
  for (let i = 0; i <= logic.steps(p); i++) states.push(kit.stateAt(logic, p, i));
  const cut = states.find((s) => s.phase === 'cut');
  assert.equal(bridge(cut, 'S3').rootPort, 2, 'the blocked port already holds S2\'s BPDU');
  assert.equal(port(cut, 'S3:2').state, 'listening');
  assert.ok(!states.some((s) => s.phase === 'aged'));
  const fwd = states.find((s) => s.t > cut.t && port(s, 'S3:2').state === 'forwarding');
  assert.equal(fwd.t - logic.CUT_AT, 30);
});

test('cutting the link with the blocked port changes nothing in the tree', () => {
  const s = last({ cutLink: 'S2-S3' });
  assert.equal(bridge(s, 'S2').rootPort, 1);
  assert.equal(bridge(s, 'S3').rootPort, 1);
  assert.equal(port(s, 'S3:2').role, 'disabled');
  assert.ok(!s.ports.some((q) => q.role === 'blocked'));
});

test('a non-root bridge relays only while its root port hears the root, so stale information is not refreshed', () => {
  // chain S1–S2–S3–S4, cut S1–S2 at 40 s: S3 relays the root's BPDU it heard at 40 s once more (one hop per
  // hello, SPEC.md "One step") and then stops, so S4's stored BPDU ages out 2 s after S3's, not 20 s later (a
  // bridge that kept sending every hello would refresh S4 with the dead root)
  const scene = { topo: 'triangle', sender: null, nodes: [sw('S1', 1), sw('S2', 2), sw('S3', 3), sw('S4', 4)],
    links: [link('a', 'S1', 1, 'S2', 1), link('b', 'S2', 2, 'S3', 1), link('c', 'S3', 2, 'S4', 1)] };
  const states = run(scene, { topo: 'triangle', cutLink: 'a' });
  const after = states.filter((s) => s.t > logic.CUT_AT + logic.HELLO);
  assert.ok(after.length > 2);
  after.forEach((s) => s.bpdus.filter((m) => m.from === 'S3').forEach((m) => assert.notEqual(m.vec.root, B(32768, 1), 't = ' + s.t)));
  const aged = states.filter((s) => s.phase === 'aged');
  assert.deepEqual(aged.map((s) => [s.t, s.aged.map((a) => a.key)]), [[logic.CUT_AT + 20, ['S3:1']], [logic.CUT_AT + 22, ['S4:1']]]);
  assert.deepEqual(states.at(-1).bridges.slice(1).map((b) => b.root), [B(32768, 2), B(32768, 2), B(32768, 2)]);
});

// ── rule 9: STP off ──

test('rule 9: STP off: the broadcast circles the triangle and never dies (preset no-stp)', () => {
  const p = P({ stp: false });
  assert.equal(logic.steps(p), logic.FLOOD_STEPS);
  const counts = [];
  for (let n = 1; n <= 6; n++) counts.push(at({ stp: false }, n).inFlight);
  assert.deepEqual(counts, [1, 2, 3, 3, 4, 3]);
  assert.deepEqual(at({ stp: false }, 6).recv, { H3: 3, H1: 2 });
  // run on past the page's steps: it never stops
  const scene = logic.sceneOf(p);
  let s = logic.initialFlood(scene);
  const h3 = [];
  for (let n = 1; n <= 30; n++) { s = logic.stepFlood(scene, s); assert.ok(s.inFlight > 0); h3.push(s.recv.H3 || 0); }
  assert.ok(h3[29] >= 9, 'H3 keeps receiving copies');
});

test('flood engine (for broadcast-storm): more than two inter-switch ports multiply copies; a router ends the domain; a tree ends the flood', () => {
  const mesh = { topo: 'custom', sender: 'H1', nodes: [sw('S1', 1), sw('S2', 2), sw('S3', 3), sw('S4', 4), { id: 'H1', kind: 'host' }],
    links: [link('12', 'S1', 1, 'S2', 1), link('13', 'S1', 2, 'S3', 1), link('14', 'S1', 3, 'S4', 1), link('23', 'S2', 2, 'S3', 2),
      link('24', 'S2', 3, 'S4', 2), link('34', 'S3', 3, 'S4', 3), link('h', 'H1', null, 'S1', 4)] };
  let s = logic.initialFlood(mesh);
  const inFlight = [];
  for (let n = 1; n <= 6; n++) { s = logic.stepFlood(mesh, s); inFlight.push(s.inFlight); }
  assert.ok(inFlight[5] > inFlight[2] * 2, 'copies multiply: ' + inFlight.join(','));

  const routed = { topo: 'custom', sender: 'H1', nodes: [sw('S1', 1), sw('S2', 2), { id: 'R', kind: 'router' }, { id: 'H1', kind: 'host' }, { id: 'H2', kind: 'host' }],
    links: [link('h1', 'H1', null, 'S1', 1), link('r1', 'S1', 2, 'R', null), link('r2', 'R', null, 'S2', 1), link('h2', 'S2', 2, 'H2', null)] };
  s = logic.initialFlood(routed);
  for (let n = 1; n <= 6; n++) s = logic.stepFlood(routed, s);
  assert.equal(s.recv.H2, undefined, 'the broadcast never crosses the router');
  assert.equal(s.inFlight, 0);

  const tree = { topo: 'custom', sender: 'H1', nodes: [sw('S1', 1), sw('S2', 2), sw('S3', 3), { id: 'H1', kind: 'host' }, { id: 'H3', kind: 'host' }],
    links: [link('12', 'S1', 1, 'S2', 1), link('13', 'S1', 2, 'S3', 1), link('h1', 'H1', null, 'S1', 3), link('h3', 'S3', 2, 'H3', null)] };
  s = logic.initialFlood(tree);
  for (let n = 1; n <= 6; n++) s = logic.stepFlood(tree, s);
  assert.deepEqual(s.recv, { H3: 1 });
  assert.equal(s.inFlight, 0, 'no loop, no storm');
});

// ── presets: expected numbers (SPEC.md "Presets") ──

test('preset triangle: root S1, root ports face S1 (cost 4), S3 p2 blocks', () => {
  const s = last({});
  assert.equal(bridge(s, 'S1').root, B(32768, 1));
  assert.deepEqual([bridge(s, 'S2').rootPort, bridge(s, 'S2').cost, bridge(s, 'S3').rootPort, bridge(s, 'S3').cost], [1, 4, 1, 4]);
  assert.deepEqual(s.ports.filter((q) => q.role === 'blocked').map((q) => q.key), ['S3:2']);
});

test('preset priority: S3 with 4096 is root; on S1–S2 S1 wins, S2 p1 blocks', () => {
  const s = last({ prioS3: 4096 });
  assert.equal(bridge(s, 'S1').root, B(4096, 3));
  assert.equal(bridge(s, 'S1').rootPort, 2);
  assert.equal(bridge(s, 'S2').rootPort, 2);
  assert.deepEqual(s.ports.filter((q) => q.role === 'blocked').map((q) => q.key), ['S2:1']);
});

test('steps: per preset, and never more than 20 for any params', () => {
  const steps = (o) => logic.steps(P(o));
  assert.equal(steps({}), 6);
  assert.equal(steps({ prioS3: 4096 }), 6);
  assert.equal(steps({ slowLink: 'S1-S3' }), 6);
  assert.equal(steps({ topo: 'pair' }), 5);
  assert.equal(steps({ cutLink: 'S1-S2' }), 12);
  assert.equal(steps({ stp: false }), 6);
  for (const topo of ['triangle', 'pair']) for (const cutLink of ['none', 'S1-S2', 'S1-S3', 'S2-S3'])
    for (const slowLink of ['none', 'S1-S3']) for (const pr of [[32768, 32768, 32768], [4096, 32768, 32768], [32768, 4096, 32768], [32768, 32768, 4096], [61440, 4096, 8192]]) {
      const n = steps({ topo, cutLink, slowLink, prioS1: pr[0], prioS2: pr[1], prioS3: pr[2] });
      assert.ok(n > 0 && n <= 20, `${topo} ${cutLink} ${slowLink} ${pr}: ${n}`);
      assert.equal(at({ topo, cutLink, slowLink, prioS1: pr[0], prioS2: pr[1], prioS3: pr[2] }, n).phase, 'frame');
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { cutLink: 'S1-S2' }, { stp: false }, { topo: 'pair' }]) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ cutLink: 'S1-S2', prioS2: 8192 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  for (const over of [{}, { stp: false }]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let i = 1; i <= 3; i++) {
      const copy = structuredClone(s);
      const next = logic.step(s, i, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
