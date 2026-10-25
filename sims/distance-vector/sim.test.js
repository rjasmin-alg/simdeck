// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for distance-vector's model. Run: node --test sims/distance-vector/
// Rule numbers are SPEC.md's. Tie-breaks first, then the rules, the presets' numbers, the end of a run, the generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const N = (s, r) => s.tables[r].N ? s.tables[r].N.metric + '/' + (s.tables[r].N.via || '*') : '-';
const row = (s) => Object.keys(s.tables).map((r) => r + '=' + N(s, r)).join(' ');
const links = (pairs) => pairs.map(([a, b]) => ({ id: logic.linkId(a, b), a: a < b ? a : b, b: a < b ? b : a, up: true }));

const PRESETS = {
  'cold-start': {},
  'count-to-infinity': { start: 'converged', events: '1:down' },
  'split-horizon': { start: 'converged', mode: 'split', events: '1:down' },
  'ring-reroute': { topo: 'ring', mode: 'split', events: '3:cut:B-C' },
  'triangle-plain': { topo: 'triangle', start: 'converged', events: '1:cut:C-D' },
  'ring-split': { topo: 'ring', start: 'converged', mode: 'split', events: '1:down' }
};

// ── tie-breaks ──

test('rule 6: an equal metric from another neighbour does not replace the current route', () => {
  const t = { A: { N: { metric: 3, via: 'B' } } };
  assert.equal(logic.offer(t.A, 'A', 'D', 'N', 3), null);
  assert.deepEqual(t.A.N, { metric: 3, via: 'B' });
});

test('rule 6: two equal new offers in one round: the sender first in name order wins', () => {
  // ring, round 2 from cold: B and D both offer 2 to A
  const s = at({ topo: 'ring' }, 2);
  assert.equal(N(s, 'A'), '3/B');
  // the order of the links in the scene does not matter: the same tables with D's link listed first
  const r = logic.round({ A: {}, B: { N: { metric: 2, via: 'C' } }, C: { N: { metric: 1, via: null } }, D: { N: { metric: 2, via: 'C' } } },
    links([['A', 'D'], ['C', 'D'], ['B', 'C'], ['A', 'B']]), 'plain');
  assert.deepEqual(r.tables.A.N, { metric: 3, via: 'B' });
  // triangle, round 1 after the cut: A and B both offer 4 to C, A wins
  assert.equal(N(at(PRESETS['triangle-plain'], 2), 'C'), '4/A');
});

test('rule 6a: vectors are processed in the sender\'s name order against the table so far', () => {
  // A has 3 via C. B offers 3 (→ 4, not better), then C (next hop) says 16: A ends at 16, not at 4 via B.
  const r = logic.round({ A: { N: { metric: 3, via: 'C' } }, B: { N: { metric: 3, via: 'C' } }, C: { N: { metric: 16, via: 'D' } } },
    links([['A', 'B'], ['A', 'C'], ['B', 'C']]), 'plain');
  assert.deepEqual(r.tables.A.N, { metric: 16, via: 'C' });
  // ring after the cut: B (next hop, 16) comes before D (2): A believes B, then takes D's better offer
  const s = at(PRESETS['ring-reroute'], 4);
  assert.equal(N(s, 'A'), '3/D');
  assert.deepEqual(s.changes.filter((c) => c.r === 'A').map((c) => c.why + ':' + c.by), ['nexthop:B', 'better:D']);
});

// ── rules ──

test('rule 1: every router sends its whole table to every neighbour over up links, from the start-of-round snapshot', () => {
  const s = at({ start: 'converged' }, 1); // one quiet round on the converged line
  assert.deepEqual(s.ads.map((a) => a.from + '>' + a.to + ':' + a.metric), ['A>B:3', 'B>A:2', 'B>C:2', 'C>B:1']);
  // a router with no entry sends nothing
  assert.deepEqual(at({}, 1).ads.map((a) => a.from + '>' + a.to), ['C>B']);
  // snapshot: in the cold start's round 1, A does not learn from B's brand-new route
  assert.equal(N(at({}, 1), 'A'), '-');
  // a cut link carries nothing
  assert.ok(at(PRESETS['ring-reroute'], 4).ads.every((a) => logic.linkId(a.from, a.to) !== 'B-C'));
});

test('rule 2: a direct network has metric 1; a received metric becomes m + 1, capped at 16', () => {
  assert.equal(N(at({}, 0), 'C'), '1/*');
  assert.equal(N(at({}, 1), 'B'), '2/C');
  const t = { A: { N: { metric: 15, via: 'B' } } };
  logic.offer(t.A, 'A', 'B', 'N', Math.min(15 + 1, logic.INF));
  assert.equal(t.A.N.metric, 16);
  const r = logic.round({ A: { N: { metric: 15, via: 'B' } }, B: { N: { metric: 16, via: 'A' } } }, links([['A', 'B']]), 'plain');
  assert.equal(r.tables.B.N.metric, 16, '15 + 1 = 16, not 16 + 1');
  assert.equal(r.tables.A.N.metric, 16, '16 + 1 is capped at 16');
});

test('rule 3: 16 is unreachable, so a 15-hop route is the longest; a route at 16 is not added', () => {
  const t = {};
  assert.equal(logic.offer(t, 'A', 'B', 'N', 16), null);
  assert.equal(t.N, undefined);
  assert.ok(logic.offer(t, 'A', 'B', 'N', 15));
  assert.equal(t.N.metric, 15);
});

test('rule 4: accept when there is no route, or a strictly lower metric; a route at 16 is beaten by any finite offer', () => {
  const t = {};
  assert.equal(logic.offer(t, 'A', 'B', 'N', 5).why, 'new');
  assert.equal(logic.offer(t, 'A', 'D', 'N', 4).why, 'better');
  assert.deepEqual(t.N, { metric: 4, via: 'D' });
  assert.equal(logic.offer(t, 'A', 'B', 'N', 6), null, 'worse from another neighbour is ignored');
  const down = { N: { metric: 16, via: null } };  // a direct network that went down
  assert.equal(logic.offer(down, 'C', 'B', 'N', 3).why, 'better');
  assert.deepEqual(down.N, { metric: 3, via: 'B' });
  // count to infinity, round 1: C takes B's old 2
  assert.equal(N(at(PRESETS['count-to-infinity'], 2), 'C'), '3/B');
});

test('rule 5: an update from the current next hop is always believed, even if worse', () => {
  const t = { N: { metric: 3, via: 'B' } };
  assert.equal(logic.offer(t, 'A', 'B', 'N', 9).why, 'nexthop');
  assert.deepEqual(t.N, { metric: 9, via: 'B' });
  assert.equal(logic.offer(t, 'A', 'B', 'N', 16).why, 'nexthop');
  assert.equal(t.N.metric, 16);
  assert.equal(logic.offer(t, 'A', 'B', 'N', 16), null, 'the same metric is no change');
  // count to infinity, round 1: B believes C's 16
  assert.equal(N(at(PRESETS['count-to-infinity'], 2), 'B'), '16/C');
});

test('rule 7: network down sets 16 on its own router only; a cut link sets 16 on the routes across it, on both ends', () => {
  const d = at(PRESETS['count-to-infinity'], 1);
  assert.equal(d.kind, 'down');
  assert.equal(row(d), 'A=3/B B=2/C C=16/*');
  const c = at(PRESETS['ring-reroute'], 3);
  assert.equal(c.kind, 'cut');
  assert.ok(at(PRESETS['ring-reroute'], 2).ads.length > 0);
  assert.equal(c.ads.length, 0, 'a topology change moves no vectors');
  assert.equal(row(c), 'A=3/B B=16/C C=1/* D=2/C', 'C\'s direct route does not go across the link');
  assert.equal(c.links.find((l) => l.id === 'B-C').up, false);
  // both ends: a line cut between two routers that each route across it
  const s = logic.applyEvent({ tables: { A: { N: { metric: 2, via: 'B' }, M: { metric: 1, via: null } }, B: { N: { metric: 1, via: null }, M: { metric: 2, via: 'A' } } },
    links: links([['A', 'B']]), nets: {} }, { kind: 'cut', link: 'A-B' });
  assert.deepEqual(s.tables.A.N, { metric: 16, via: 'B' });
  assert.deepEqual(s.tables.B.M, { metric: 16, via: 'A' });
  assert.deepEqual(s.tables.A.M, { metric: 1, via: null });
});

test('rule 7: a cut leaves routes that are already at 16 alone', () => {
  // count to infinity is over at step 15 (C = 16 via B); cutting B–C then changes no table
  const s = at({ start: 'converged', events: '1:down,16:cut:B-C' }, 16);
  assert.equal(s.kind, 'cut');
  assert.equal(s.noop, false);
  assert.deepEqual(s.changes, []);
});

test('rule 7: repeated events are steps that change nothing', () => {
  const s = at({ start: 'converged', events: '1:down,2:down' }, 2);
  assert.equal(s.kind, 'down');
  assert.equal(s.noop, true);
  assert.equal(s.changes.length, 0);
  const c = at({ topo: 'ring', start: 'converged', events: '1:cut:A-B,2:cut:A-B' }, 2);
  assert.equal(c.noop, true);
});

test('rule 8: split horizon holds a route back from the neighbour it came from; poisoned reverse sends it as 16', () => {
  const tables = { A: { N: { metric: 3, via: 'B' } }, B: { N: { metric: 2, via: 'C' } }, C: { N: { metric: 1, via: null } } };
  const L = links([['A', 'B'], ['B', 'C']]);
  const fmt = (ads) => ads.map((a) => a.from + '>' + a.to + ':' + a.metric + ':' + a.sent);
  assert.deepEqual(fmt(logic.adsOf(tables, L, 'plain')), ['A>B:3:full', 'B>A:2:full', 'B>C:2:full', 'C>B:1:full']);
  assert.deepEqual(fmt(logic.adsOf(tables, L, 'split')), ['A>B:3:suppressed', 'B>A:2:full', 'B>C:2:suppressed', 'C>B:1:full']);
  assert.deepEqual(fmt(logic.adsOf(tables, L, 'poison')), ['A>B:16:poison', 'B>A:2:full', 'B>C:16:poison', 'C>B:1:full']);
  // a suppressed ad changes nothing at the receiver
  const r = logic.round({ B: { N: { metric: 2, via: 'C' } }, C: { N: { metric: 16, via: null } } }, links([['B', 'C']]), 'split');
  assert.deepEqual(r.tables.C.N, { metric: 16, via: null });
});

test('rule 8: split horizon and poisoned reverse stop the two-router loop in 2 rounds', () => {
  for (const mode of ['split', 'poison']) {
    const p = P({ start: 'converged', mode, events: '1:down' });
    assert.equal(logic.steps(p), 3, mode);
    assert.equal(row(kit.stateAt(logic, p, 2)), 'A=3/B B=16/C C=16/*', mode);
    assert.equal(row(kit.stateAt(logic, p, 3)), 'A=16/B B=16/C C=16/*', mode);
  }
});

test('the vectors that changed a table are marked used, the others not', () => {
  const used = (s) => s.ads.filter((a) => a.used).map((a) => a.from + '>' + a.to);
  assert.deepEqual(used(at({}, 1)), ['C>B']);
  assert.deepEqual(used(at({ start: 'converged' }, 1)), []);
  // count to infinity, round 1: B believes C's 16, C takes B's old 2; A's 3 (to B) and B's 2 (to A) change nothing
  assert.deepEqual(used(at(PRESETS['count-to-infinity'], 2)), ['B>C', 'C>B']);
});

test('false routes: a finite route written at a router cut off from N is marked', () => {
  const s = at(PRESETS['count-to-infinity'], 4);  // round 3: A and C write 5 via B
  assert.deepEqual(s.cutOff, ['A', 'B', 'C']);
  assert.deepEqual(s.changes.map((c) => c.r + ':' + c.to.metric + ':' + c['false']), ['A:5:true', 'B:16:false', 'C:5:true']);
  assert.ok(at({ topo: 'ring' }, 2).changes.every((c) => !c['false']));
});

// ── presets: the numbers in SPEC.md ──

test('preset cold-start: B = 2 via C, then A = 3 via B, round 3 no change (3 steps)', () => {
  const p = PRESETS['cold-start'];
  assert.equal(logic.steps(P(p)), 3);
  assert.deepEqual([0, 1, 2, 3].map((n) => row(at(p, n))),
    ['A=- B=- C=1/*', 'A=- B=2/C C=1/*', 'A=3/B B=2/C C=1/*', 'A=3/B B=2/C C=1/*']);
  assert.equal(at(p, 3).end, 'quiet');
});

test('preset count-to-infinity: 4, 5, 6 … until all three are 16 at round 14 (15 steps)', () => {
  const p = PRESETS['count-to-infinity'];
  assert.equal(logic.steps(P(p)), 15);
  assert.equal(row(at(p, 2)), 'A=3/B B=16/C C=3/B');
  assert.equal(row(at(p, 3)), 'A=16/B B=4/A C=16/B');
  assert.equal(row(at(p, 4)), 'A=5/B B=16/A C=5/B');
  assert.equal(row(at(p, 14)), 'A=15/B B=16/A C=15/B');
  const last = at(p, 15);
  assert.equal(last.round, 14);
  assert.equal(row(last), 'A=16/B B=16/A C=16/B');
  assert.equal(last.end, 'unreachable');
});

test('preset split-horizon: B = 16 in round 1, A = 16 in round 2 (3 steps)', () => {
  const p = PRESETS['split-horizon'];
  assert.equal(logic.steps(P(p)), 3);
  assert.equal(row(at(p, 2)), 'A=3/B B=16/C C=16/*');
  assert.equal(row(at(p, 3)), 'A=16/B B=16/C C=16/*');
});

test('preset ring-reroute: A = 3 via D, then B = 4 via A (6 steps)', () => {
  const p = PRESETS['ring-reroute'];
  assert.equal(logic.steps(P(p)), 6);
  assert.equal(row(at(p, 2)), 'A=3/B B=2/C C=1/* D=2/C');
  assert.equal(row(at(p, 4)), 'A=3/D B=16/C C=1/* D=2/C');
  assert.equal(row(at(p, 5)), 'A=3/D B=4/A C=1/* D=2/C');
  assert.equal(at(p, 6).end, 'quiet');
  assert.equal(logic.steps(P(Object.assign({}, p, { mode: 'plain' }))), 5, 'plain: B takes A\'s 3 already in round 1');
});

test('preset triangle-plain: C = 4 via A, then 5, 6 … all 16 by round 13 (14 steps); D keeps N', () => {
  const p = PRESETS['triangle-plain'];
  assert.equal(logic.steps(P(p)), 14);
  assert.equal(row(at(p, 1)), 'A=3/C B=3/C C=16/D D=1/*');
  assert.equal(row(at(p, 2)), 'A=16/C B=16/C C=4/A D=1/*');
  assert.equal(row(at(p, 3)), 'A=5/C B=5/C C=16/A D=1/*');
  assert.equal(row(at(p, 14)), 'A=16/C B=16/C C=16/A D=1/*');
  assert.equal(at(p, 14).round, 13);
  assert.equal(logic.steps(P(Object.assign({}, p, { mode: 'split' }))), 2);
});

test('preset ring-split: split horizon does not stop the loop through three or more routers (15 steps)', () => {
  const p = PRESETS['ring-split'];
  assert.equal(logic.steps(P(p)), 15);
  assert.equal(row(at(p, 2)), 'A=3/B B=16/C C=16/* D=16/C');
  assert.equal(row(at(p, 3)), 'A=16/B B=16/C C=16/* D=4/A');
  assert.equal(row(at(p, 4)), 'A=16/B B=16/C C=5/D D=16/A');
  assert.equal(row(at(p, 5)), 'A=16/B B=6/C C=16/D D=16/A');
  assert.equal(row(at(p, 15)), 'A=16/B B=16/C C=16/D D=16/A');
});

// ── the end of a run, events ──

test('end: quiet round, bad news complete, or the 20-step limit', () => {
  assert.equal(logic.steps(P({ start: 'converged' })), 1, 'converged, nothing happens: one quiet round');
  // unreachable ends without a quiet round; quiet ends with one
  assert.equal(at(PRESETS['split-horizon'], 3).end, 'unreachable');
  assert.equal(at(PRESETS['split-horizon'], 2).end, null);
  // limit: count to infinity started late enough to need more than 20 steps
  const p = P({ events: '7:down' });
  assert.equal(logic.steps(p), 20);
  assert.equal(kit.stateAt(logic, p, 20).end, 'limit');
  // no end before the last event, even after a quiet round
  const q = { events: '5:cut:B-C' };
  assert.equal(at(q, 3).quiet, true);
  assert.equal(at(q, 3).end, null);
  assert.equal(at(q, 5).kind, 'cut');
});

test('end: a router cut off before it learned N is no bad news; the run ends quiet', () => {
  const p = P({ events: '1:cut:A-B' });
  assert.equal(logic.steps(p), 3);
  assert.equal(kit.stateAt(logic, p, 3).end, 'quiet');
  assert.equal(kit.stateAt(logic, p, 2).end, null);
  // A isolated with no entry, then B and C count to infinity: A's empty table does not hold the end back
  const q = P({ events: '1:cut:A-B,3:down' });
  assert.equal(logic.steps(q), 17);
  assert.equal(kit.stateAt(logic, q, 17).end, 'unreachable');
  assert.deepEqual(kit.stateAt(logic, q, 17).tables.A, {});
});

test('end: not while a connected router is still learning, and never on an event step', () => {
  // triangle, A isolated holding 16; C learns from D this round, B would learn from C the next: no end yet
  const p = P({ topo: 'triangle' });
  const s = logic.initial(p);
  s.tables.A.N = { metric: 16, via: 'C' };
  s.links.forEach((l) => { if (l.a === 'A') l.up = false; });
  const r = logic.step(s, 1, p);
  assert.equal(N(r, 'C'), '2/D');
  assert.equal(r.end, null);
  assert.equal(N(logic.step(r, 2, p), 'B'), '3/C');
  // cold line, N down at step 1: everyone is cut off and nobody has a finite route, but the event step does not end it
  const q = P({ events: '1:down' });
  assert.equal(kit.stateAt(logic, q, 1).end, null);
  assert.equal(logic.steps(q), 2);
});

test('end: "after k rounds" counts from the last topology change', () => {
  const p = P({ events: '4:down' });   // cold start, converged at round 3, then N down
  const last = kit.stateAt(logic, p, logic.steps(p));
  assert.equal(last.end, 'unreachable');
  assert.equal(last.round, 17);
  assert.equal(last.since, 14);
});

test('events as a number: one base-6 digit per step, the same events as the text form', () => {
  assert.equal(logic.code('line', '1:down'), 1);
  assert.equal(logic.code('ring', '3:cut:B-C'), 2 * 36 + 36);   // digit 3 (link 1, B-C) at step 3
  assert.equal(logic.code('triangle', '1:cut:C-D'), 5);
  for (const [topo, text] of [['line', '4:cut:B-C,6:down'], ['ring', '1:cut:A-D,20:down'], ['triangle', '2:cut:A-B,3:cut:C-D']]) {
    const n = logic.code(topo, text);
    assert.ok(Number.isSafeInteger(n) && n <= logic.MAX_CODE);
    assert.deepEqual(logic.eventsOf(P({ topo, events: n })), logic.eventsOf(P({ topo, events: text })));
    assert.equal(logic.steps(P({ topo, events: n })), logic.steps(P({ topo, events: text })));
  }
  assert.deepEqual(logic.eventsOf(P({ events: -1 })), {});
  assert.deepEqual(logic.eventsOf(P({ events: 1.5 })), {});
  assert.deepEqual(logic.eventsOf(P({ events: logic.MAX_CODE + 1 })), {});
  assert.deepEqual(logic.eventsOf(P({ events: 4 })), {}, 'digit 4 is link 2, which the line does not have');
});

test('events: malformed, unknown, out-of-range and duplicate entries are ignored', () => {
  const ev = logic.eventsOf(P({ events: '1:down, 2:cut:B-C,2:down,x,0:down,21:down,3:cut:A-D,4:cut,5:up,6:down:N' }));
  assert.deepEqual(ev, { 1: { kind: 'down', dest: 'N' }, 2: { kind: 'cut', link: 'B-C' } });
  assert.deepEqual(logic.eventsOf(P({ topo: 'ring', events: '3:cut:A-D' })), { 3: { kind: 'cut', link: 'A-D' } });
  assert.deepEqual(logic.eventsOf(P({ events: '' })), {});
  assert.deepEqual(logic.eventsOf(P({ events: 0 })), {});
});

test('the converged start is the same in every mode', () => {
  for (const topo of ['line', 'ring', 'triangle']) {
    const rows = ['plain', 'split', 'poison'].map((mode) => row(at({ topo, start: 'converged', mode }, 0)));
    assert.equal(rows[1], rows[0], topo);
    assert.equal(rows[2], rows[0], topo);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    for (let n = 1; n <= 4; n++) {
      const s0 = kit.stateAt(logic, p, n - 1);
      const copy = structuredClone(s0);
      logic.step(s0, n, p);
      assert.deepEqual(s0, copy);
    }
  }
});

test('every preset run fits the contract: at most 20 steps', () => {
  for (const o of Object.values(PRESETS)) assert.ok(logic.steps(P(o)) <= 20);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches SPEC.md', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default run');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*?params: (\{[^}]*\})/g)];
  assert.deepEqual(found.map((m) => m[1]), Object.keys(PRESETS), 'the page lists the presets in SPEC.md order');
  for (const m of found) {
    const params = Function('L', 'return ' + m[2])(logic);
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const want = P(PRESETS[m[1]]);
    const got = P(params);
    for (const k of ['topo', 'start', 'mode']) assert.equal(got[k], want[k], `${m[1]}.${k}`);
    assert.deepEqual(logic.eventsOf(got), logic.eventsOf(want), `${m[1]}.events`);
  }
});
