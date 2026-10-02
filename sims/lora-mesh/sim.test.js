// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lora-mesh's model. Run: node --test sims/lora-mesh/
// Tie-breaks first, then the rules of each network (sim.js header), then the template's generic block.
// Hand-made fields go through `withNodes`, which swaps the seeded field for a fixed one.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, kit.stepsOf(logic, P(over)));
const senders = (rounds) => rounds.map((r) => r.map((e) => e.from));

/** A copy of the model on a fixed field: [[x, y, role]], role '' | 'gw' | 'rep'; ids in order. */
function withNodes(list) {
  const nodes = list.map(([x, y, role], id) => ({ id, x, y, gw: role === 'gw', rep: role === 'rep' }));
  return {
    nodes,
    model: Object.assign({}, logic, { step: (s, n, p) => logic.step(s, n, p, nodes), steps: (p) => logic.steps(p, nodes) })
  };
}

// A diamond 0 – {1, 2} – 3 (range 30 % of 560 = 168): 0–1, 0–2, 1–2, 1–3, 2–3 are links, 0–3 is not.
const DIAMOND = [[100, 280], [220, 200], [220, 360], [340, 280]];

// ── tie-breaks ──

test('manet: two shortest paths: the one through the lower id wins', () => {
  const { nodes } = withNodes(DIAMOND);
  const p = P({ mode: 'manet', nodes: 4, src: 1, dst: 4 });
  assert.deepEqual(senders(logic.plan(p, nodes)), [[0], [1]]);
});

test('relay: two repeater chains of the same length: the lower id wins', () => {
  const { nodes } = withNodes(DIAMOND.map(([x, y], i) => [x, y, i === 1 || i === 2 ? 'rep' : '']));
  const p = P({ mode: 'relay', nodes: 4, src: 1, dst: 4 });
  assert.deepEqual(senders(logic.plan(p, nodes)), [[0], [1]]);
});

test('star: two gateways at the same distance: the lower id is the one used', () => {
  const { nodes } = withNodes([[500, 300], [500, 420], [400, 300, 'gw'], [600, 300, 'gw']]);
  const p = P({ mode: 'star', nodes: 2, src: 1, dst: 2 });
  const rounds = logic.plan(p, nodes);
  assert.deepEqual(rounds[0][0].to, [2, 3], 'the uplink is heard by both, nearest (then lower id) first');
  assert.deepEqual(rounds[1][0], { kind: 'ip', from: 2, to: [2], hop: 1 });
  assert.equal(rounds[2][0].from, 2);
});

test('flood: a node heard by two senders in one round is credited to the first sender only', () => {
  const { nodes } = withNodes(DIAMOND);
  const p = P({ mode: 'flood', nodes: 4, src: 1, dst: 4 });
  const rounds = logic.plan(p, nodes);
  assert.deepEqual(rounds[0], [{ kind: 'tx', from: 0, to: [1, 2], hop: 1 }]);
  assert.deepEqual(rounds[1][0], { kind: 'tx', from: 1, to: [3], hop: 2 });
  const heard = rounds.flatMap((r) => r.flatMap((e) => e.to));
  assert.equal(new Set(heard).size, heard.length, 'nobody hears the message for the first time twice');
});

test('duty cycle: using exactly the allowance is allowed; one millisecond more is blocked', () => {
  // 1 % of 60 s = 0.6 s
  assert.notEqual(end({ airtime: 600 }).status, 'duty');
  const s = end({ airtime: 650 });
  assert.equal(s.status, 'duty');
  assert.equal(s.blocked, 0, 'the source is the first sender');
  assert.equal(s.tx, 0);
});

// ── star (LoRaWAN) ──

test('star: end nodes never link to each other, only to gateways', () => {
  const p = P({ mode: 'star' });
  const nodes = logic.nodesOf(p);
  for (const [a, b] of logic.links(p, nodes)) assert.notEqual(nodes[a].gw, nodes[b].gw);
  assert.equal(nodes.filter((n) => n.gw).length, logic.gatewayCount(p.nodes));
});

test('star: uplink, the server over IP, downlink; the IP step is not a radio transmission', () => {
  const p = P({ mode: 'star' });
  assert.equal(kit.stepsOf(logic, p), 3);
  assert.deepEqual([1, 2, 3].map((n) => at({ mode: 'star' }, n).tx), [1, 1, 2]);
  const s = end({ mode: 'star' });
  assert.equal(s.status, 'delivered');
  assert.equal(s.hops, 2);
});

test('star: no gateway in range of the source: no route, in one step', () => {
  const { model, nodes } = withNodes([[100, 100], [500, 300], [900, 500, 'gw']]);
  const p = P({ mode: 'star', nodes: 2, src: 1, dst: 2 });
  assert.deepEqual(logic.plan(p, nodes), []);
  assert.equal(kit.stepsOf(model, p), 1);
  assert.equal(kit.stateAt(model, p, 1).status, 'noroute');
});

test('gateway count: one per 12 nodes, 1 to 3', () => {
  assert.deepEqual([5, 18, 24, 30, 42].map(logic.gatewayCount), [1, 2, 2, 3, 3]);
});

// ── flood ──

test('flood: every frontier node transmits once per round, even when nobody new hears it', () => {
  const { nodes } = withNodes([[100, 280], [220, 280], [800, 280]]);
  const p = P({ mode: 'flood', nodes: 3, src: 1, dst: 3 });
  const rounds = logic.plan(p, nodes);
  assert.deepEqual(rounds, [[{ kind: 'tx', from: 0, to: [1], hop: 1 }], [{ kind: 'tx', from: 1, to: [], hop: 2 }]]);
  const { model } = withNodes([[100, 280], [220, 280], [800, 280]]);
  const s = kit.stateAt(model, p, kit.stepsOf(model, p));
  assert.equal(s.tx, 2);
  assert.equal(s.status, 'lost');
});

test('flood: stops in the round the destination hears it, and never runs past the hop limit', () => {
  const s = end({});
  assert.equal(s.status, 'delivered');
  assert.equal(s.hops, kit.stepsOf(logic, P({})));
  for (let seed = 1; seed <= 99; seed++) {
    for (const range of [15, 42]) {
      const p = P({ seed, range, nodes: 42, dst: 42 });
      const rounds = logic.plan(p);
      assert.ok(rounds.length <= logic.HOP_LIMIT);
      const reachedAt = rounds.findIndex((r) => r.some((e) => e.to.includes(41)));
      if (reachedAt >= 0) assert.equal(reachedAt, rounds.length - 1, `seed ${seed}: nothing after the destination heard it`);
    }
  }
});

test('flood costs more transmissions than the shortest route on the same field', () => {
  const flood = end({ mode: 'flood' }), manet = end({ mode: 'manet' });
  assert.equal(flood.status, 'delivered');
  assert.equal(manet.status, 'delivered');
  assert.ok(flood.tx > manet.tx, `${flood.tx} > ${manet.tx}`);
  assert.ok(flood.heard.length > manet.heard.length);
});

// ── relay ──

test('relay: plain nodes never relay; a direct link needs no repeater', () => {
  const { nodes } = withNodes(DIAMOND);
  assert.deepEqual(logic.plan(P({ mode: 'relay', nodes: 4, src: 1, dst: 4 }), nodes), [], 'no repeaters: no route');
  assert.deepEqual(senders(logic.plan(P({ mode: 'relay', nodes: 4, src: 1, dst: 2 }), nodes)), [[0]], 'direct link');
  for (let flip = 0; flip < 64; flip++) {
    const p = P({ mode: 'relay', flip });
    const field = logic.nodesOf(p);
    const rounds = logic.plan(p);
    for (const r of rounds.slice(1)) assert.ok(field[r[0].from].rep, `flip ${flip}: node ${r[0].from + 1} relays`);
  }
});

test('relay: the default field has no chain; the preset chain (flip 4162) makes a 6-hop route', () => {
  assert.equal(end({ mode: 'relay' }).status, 'noroute');
  const s = end({ mode: 'relay', flip: 4162 });
  assert.equal(s.status, 'delivered');
  assert.equal(s.hops, 6);
});

test('repeater roles: the original\'s defaults, and a flip toggles one node (also above 32 bits)', () => {
  const p = P({ mode: 'relay' });
  assert.deepEqual(logic.nodesOf(p).filter((n) => n.rep).map((n) => n.id), [2, 8]);
  const f = logic.toggleRepeater(p, 40);
  assert.equal(f, Math.pow(2, 40));
  assert.equal(logic.isRepeater(P({ nodes: 42, flip: f }), 40), true);
  assert.equal(logic.toggleRepeater(P({ flip: f }), 40), 0);
  assert.equal(logic.isRepeater(P({ flip: logic.toggleRepeater(p, 2) }), 2), false, 'a default repeater turned off');
});

// ── manet and the field ──

test('manet: the route has the fewest hops of any path', () => {
  const p = P({ mode: 'manet' });
  const rounds = logic.plan(p);
  assert.equal(rounds.length, 6);
  // no path of 5 hops: breadth-first distances from the source
  const lk = logic.links(p);
  const distOf = { 0: 0 };
  let q = [0];
  while (q.length) {
    const u = q.shift();
    for (const v of logic.neighbours(lk, u)) if (!(v in distOf)) { distOf[v] = distOf[u] + 1; q.push(v); }
  }
  assert.equal(distOf[17], 6);
});

test('more nodes only add nodes; range is a share of the field height', () => {
  const a = logic.nodesOf(P({ nodes: 10 })), b = logic.nodesOf(P({ nodes: 30 }));
  assert.deepEqual(b.slice(0, 10), a);
  assert.equal(logic.reach(P({ range: 25 })), 140);
});

test('same source and destination: nothing to send', () => {
  assert.deepEqual(logic.plan(P({ dst: 1 })), []);
  assert.equal(end({ dst: 1 }).tx, 0);
});

test('limit off: never blocked; the load is channel use, total airtime over 60 s', () => {
  const s = end({ airtime: 1500, dutyPct: 0 });
  assert.equal(s.status, 'delivered');
  const ld = logic.load(s, P({ airtime: 1500, dutyPct: 0 }));
  assert.equal(ld.pct, Math.round(s.tx * 1.5 / 60 * 1000) / 10);
});

test('every mode stays within 20 steps on any field', () => {
  for (const mode of logic.MODES) {
    for (let seed = 1; seed <= 99; seed += 7) {
      for (const range of [15, 30, 42]) {
        const n = kit.stepsOf(logic, P({ mode, seed, range, nodes: 42, dst: 42 }));
        assert.ok(n >= 1 && n <= 20, `${mode} ${seed} ${range}: ${n}`);
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { mode: 'star' }, { mode: 'relay', flip: 4162 }, { mode: 'manet' }, { airtime: 1000 }]) {
    const steps = kit.stepsOf(logic, P(over));
    for (let n = 0; n <= steps; n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{ seed: 7, nodes: 30 }, { mode: 'star', nodes: 40 }, { mode: 'manet', range: 20 }]) {
    const p = P(over), steps = kit.stepsOf(logic, p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{}, { mode: 'star' }]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= 3; n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
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
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const modes = [...html.matchAll(/params: \{ mode: '(\w+)'/g)].map((m) => m[1]);
  for (const m of modes) assert.ok(logic.MODES.includes(m), `mode ${m}`);
});
