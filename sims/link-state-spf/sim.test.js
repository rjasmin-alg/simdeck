// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for link-state-spf's model. Run: node --test sims/link-state-spf/
// Rule numbers are SPEC.md's. Tie-breaks first, then the rules, the presets' numbers, the generic block.
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
const last = (over) => at(over, logic.steps(P(over)));
/** The SPF steps of a run: "A0 B2 C3 …", the picks in order with their distances. */
const finals = (over) => {
  const p = P(over), out = [];
  for (let n = 1; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    if (s.kind === 'spf') out.push(s.spf.picked + s.spf.dist[s.spf.picked]);
  }
  return out.join(' ');
};
/** A routing table as "B2/B C3/B …", next hops joined. */
const table = (rows) => rows.map((r) => r.dest + r.cost + '/' + r.via.join('')).join(' ');
const kinds = (over) => {
  const p = P(over), out = [];
  for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n).kind);
  return out.join(' ');
};
const floods = (over) => {
  const p = P(over), out = [];
  for (let n = 1; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    if (s.kind === 'flood') out.push(s.inFlight.length + '/' + s.inFlight.filter((c) => c.fate === 'dup').length);
  }
  return out.join(' ');
};
const full = (seq) => logic.everyone(logic.linksOf(logic.defaults, false), seq);

const PRESETS = {
  'spf-from-a': {},
  'cost-change': { costBC: 5 },
  'link-fails': { fail: 'C-D' },
  'spf-from-e': { source: 'E' }
};

// ── tie-breaks ──

test('rule 5: equal distances when picking: the lower router name first (source C: B before D, A before E)', () => {
  assert.equal(finals({ source: 'C' }), 'C0 B1 D1 A3 E3');
  const spf = logic.spfInit('C');
  spf.final = ['C'];
  Object.assign(spf.dist, { B: 1, D: 1 });
  assert.equal(logic.pickOf(spf), 'B');
  Object.assign(spf.dist, { B: 2 });
  assert.equal(logic.pickOf(spf), 'D', 'a smaller distance wins over the name');
});

test('rule 5: the tie-break orders the steps only; the table does not depend on it', () => {
  const g = logic.graphOf(full(1).lsdb.C, full(1).lsas);
  const byName = logic.runSpf(g, 'C');
  assert.equal(table(logic.tableOf(byName, 'C')), 'A3/B B1/B D1/D E3/D');
  // the same graph with the routers renamed backwards gives the same distances and next hops
  const rename = (x) => ({ A: 'E', B: 'D', C: 'C', D: 'B', E: 'A' })[x];
  const back = {};
  Object.keys(g).forEach((u) => { back[rename(u)] = g[u].map(([v, c]) => [rename(v), c]); });
  const rev = logic.runSpf(back, 'C');
  for (const r of ['A', 'B', 'D', 'E']) {
    assert.equal(rev.dist[rename(r)], byName.dist[r], r);
    assert.deepEqual(rev.nextHop[rename(r)].map(rename).sort(), byName.nextHop[r], r);
  }
});

test('rule 2: two copies of one LSA in the same round: the first sender (name order) is stored, the second dropped', () => {
  const s = at({}, 3);   // round 2: B gets E's LSA from C and from D
  const toB = s.inFlight.filter((c) => c.to === 'B' && c.o === 'E');
  assert.deepEqual(toB.map((c) => c.from + ':' + c.fate), ['C:new', 'D:dup']);
  assert.ok(s.pending.some((x) => x.at === 'B' && x.o === 'E' && x.from === 'C'));
});

// ── rules ──

test('rule 1: an LSA lists only its router\'s own links that are up, with their costs', () => {
  const before = logic.linksOf(logic.defaults, false);
  assert.deepEqual(logic.lsaOf(before, 'C', 1).links, [['A', 5], ['B', 1], ['D', 1], ['E', 6]]);
  assert.deepEqual(logic.lsaOf(before, 'A', 1).links, [['B', 2], ['C', 5]]);
  const after = logic.linksOf(P({ fail: 'C-D', costBC: 4 }), true);
  assert.deepEqual(logic.lsaOf(after, 'C', 2).links, [['A', 5], ['B', 4], ['E', 6]]);
  const s = at({}, 1);
  assert.equal(s.kind, 'originate');
  for (const r of logic.ROUTERS) assert.deepEqual(s.lsdb[r], { [r]: 1 }, `${r} holds only its own LSA`);
});

test('rule 2: round 1 sends each own LSA to every neighbour; every copy is new', () => {
  const s = at({}, 2);
  assert.equal(s.kind, 'flood');
  assert.equal(s.inFlight.length, 14);
  assert.ok(s.inFlight.every((c) => c.fate === 'new' && c.o === c.from));
  assert.deepEqual(s.lsdb.A, { A: 1, B: 1, C: 1 });
  assert.deepEqual(s.lsdb.E, { C: 1, D: 1, E: 1 });
});

test('rule 2: a copy is never sent back to the router it came from, and a dropped copy is not sent on', () => {
  const s2 = at({}, 2), s3 = at({}, 3);
  for (const c of s3.inFlight) {
    const came = s2.inFlight.find((x) => x.to === c.from && x.o === c.o && x.fate === 'new');
    assert.ok(came, `${c.from} sends ${c.o} only because it stored it last round`);
    assert.notEqual(c.to, came.from, `${c.from} does not send ${c.o} back to ${came.from}`);
  }
  assert.ok(s3.inFlight.some((c) => c.fate === 'dup'));
  assert.equal(s3.pending.length, s3.inFlight.filter((c) => c.fate === 'new').length, 'only new copies are pending');
});

test('rule 2: a higher sequence number replaces the copy held; the same or a lower one is dropped', () => {
  const links = logic.linksOf(logic.defaults, false);
  const lsdb = { A: { B: 1 }, B: { B: 2 }, C: { B: 3 }, D: {}, E: {} };
  const r = logic.floodRound(lsdb, [{ at: 'B', o: 'B', from: null }], links);
  const fate = (to) => r.sent.find((c) => c.to === to);
  assert.equal(fate('A').fate, 'new');
  assert.equal(fate('A').held, 1);
  assert.equal(r.lsdb.A.B, 2);
  assert.equal(fate('C').fate, 'dup', 'C holds a newer one (3)');
  assert.equal(r.lsdb.C.B, 3);
  assert.equal(fate('D').fate, 'new');
  const again = logic.floodRound(r.lsdb, [{ at: 'B', o: 'B', from: null }], links);
  assert.ok(again.sent.every((c) => c.fate === 'dup'), 'the same number again is dropped everywhere');
  assert.deepEqual(lsdb.A, { B: 1 }, 'floodRound does not change its input');
});

test('rule 2: flooding ends when every LSDB holds every newest LSA; then all five are identical', () => {
  for (const o of [{}, { costBC: 5 }, { fail: 'C-D' }, { fail: 'B-D', costBC: 9 }]) {
    const p = P(o);
    let n = 0, s;
    do { n++; s = kit.stateAt(logic, p, n); } while (s.kind !== 'spf');
    const before = kit.stateAt(logic, p, n - 1);
    assert.equal(before.kind, 'flood');
    assert.ok(logic.complete(before.lsdb, before.lsas), JSON.stringify(o));
    for (const r of logic.ROUTERS) assert.deepEqual(before.lsdb[r], before.lsdb.A, `${r} equals A`);
    const prev = kit.stateAt(logic, p, n - 2);
    assert.ok(!logic.complete(prev.lsdb, prev.lsas), 'not complete one step earlier');
  }
});

test('rule 3: the source reads the graph from its own LSDB only, and a link needs both ends\' LSAs (two-way check)', () => {
  const links = logic.linksOf(logic.defaults, false);
  const lsas = full(1).lsas;
  const g = logic.graphOf({ A: 1, B: 1, C: 1 }, lsas);
  assert.deepEqual(Object.keys(g), ['A', 'B', 'C']);
  assert.deepEqual(g.B, [['A', 2], ['C', 1]], 'B–D is not used: D\'s LSA is not held');
  // link-fails, half way: A holds C's new LSA (no D) and D's old one (still lists C): C–D is not used
  const after = logic.linksOf(P({ fail: 'C-D' }), true);
  lsas['C#2'] = logic.lsaOf(after, 'C', 2);
  const half = logic.graphOf({ A: 1, B: 1, C: 2, D: 1, E: 1 }, lsas);
  assert.ok(!half.D.some((e) => e[0] === 'C'), 'D–C needs C to list D');
  assert.ok(!half.C.some((e) => e[0] === 'D'));
  assert.ok(links.length === 7);
});

test('rule 3: every router computes its own tree from the same LSDB (A and E)', () => {
  assert.deepEqual(last({}).lsdb, last({ source: 'E' }).lsdb);
  assert.equal(table(last({ source: 'E' }).table), 'A6/D B4/D C3/D D2/D');
  assert.equal(table(last({}).table), 'B2/B C3/B D4/B E6/B');
});

test('rule 4: a smaller offer replaces distance, next hop and parent; a larger one changes nothing; finals are not examined', () => {
  const s4 = at({}, 4), s5 = at({}, 5), s6 = at({}, 6);
  assert.deepEqual(s4.spf.relaxed.map((x) => x.r + ':' + x.how + ':' + x.offer), ['B:new:2', 'C:new:5']);
  assert.deepEqual(s5.spf.relaxed.map((x) => x.r + ':' + x.how + ':' + x.offer), ['C:better:3', 'D:new:6'], 'A is final: not examined');
  assert.deepEqual(s5.spf.parents.C, ['B']);
  assert.deepEqual(s6.spf.relaxed.map((x) => x.r + ':' + x.how + ':' + x.offer), ['D:better:4', 'E:new:9']);
  assert.equal(s6.spf.relaxed[0].old.dist, 6);
  const cc = at({ costBC: 5 }, 6);   // B made final: C via B would be 7, worse than 5
  assert.equal(cc.spf.picked, 'B');
  const c = cc.spf.relaxed.find((x) => x.r === 'C');
  assert.equal(c.how, 'worse');
  assert.equal(cc.spf.dist.C, 5);
  assert.deepEqual(cc.spf.nextHop.C, ['C']);
});

test('rule 4: one router becomes final per SPF step, five steps in all, the source first at 0', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const spf = [];
    for (let n = 1; n <= logic.steps(p); n++) { const s = kit.stateAt(logic, p, n); if (s.kind === 'spf') spf.push(s); }
    assert.equal(spf.length, 5);
    assert.equal(spf[0].spf.picked, p.source);
    spf.forEach((s, i) => assert.equal(s.spf.final.length, i + 1));
  }
});

test('rule 6: an equal distance by another path keeps both next hops (ECMP) and both parents', () => {
  const s = last({ costBC: 5 });
  assert.equal(table(s.table), 'B2/B C5/C D6/BC E8/BC');
  const d = at({ costBC: 5 }, 7).spf.relaxed.find((x) => x.r === 'D');
  assert.equal(d.how, 'equal');
  assert.deepEqual(s.spf.parents.D, ['B', 'C']);
  assert.deepEqual(s.tree.filter((e) => e.ecmp).map((e) => e.a + e.b), ['BD', 'CD']);
  assert.deepEqual(s.spf.parents.E, ['D'], 'E has one parent; its two next hops come from D');
  assert.equal(table(last({ costBC: 3 }).table), 'B2/B C5/BC D6/BC E8/BC', 'a direct neighbour can have two next hops');
});

test('rule 7: the next hop of a direct neighbour is itself; further away it is inherited from the parent', () => {
  const s4 = at({}, 4);
  assert.deepEqual(s4.spf.nextHop.B, ['B']);
  assert.deepEqual(s4.spf.nextHop.C, ['C']);
  assert.deepEqual(at({}, 5).spf.nextHop.C, ['B'], 'C through B: next hop B');
  assert.deepEqual(last({}).spf.nextHop.A, [], 'the source has none');
  assert.ok(last({}).table.every((r) => r.dest !== 'A'), 'no row for the source');
});

test('rule 8: a change: the routers at its ends write LSAs with sequence + 1, the others keep theirs', () => {
  assert.deepEqual(logic.changeOf(P({ costBC: 5 })).ends, ['B', 'C']);
  assert.deepEqual(logic.changeOf(P({ fail: 'C-D' })).ends, ['C', 'D']);
  assert.deepEqual(logic.changeOf(P({ fail: 'B-D', costBC: 2 })).ends, ['B', 'C', 'D']);
  assert.equal(logic.changeOf(P({})), null);
  const s0 = at({ costBC: 5 }, 0);
  assert.equal(table(s0.table), 'B2/B C3/B D4/B E6/B', 'the old table, computed before the change');
  assert.equal(s0.links.find((l) => l.id === 'B-C').cost, 1);
  const s1 = at({ costBC: 5 }, 1);
  assert.equal(s1.kind, 'change');
  assert.equal(s1.links.find((l) => l.id === 'B-C').cost, 5);
  assert.deepEqual(s1.lsdb, s0.lsdb, 'nobody has a new LSA yet');
  const s2 = at({ costBC: 5 }, 2);
  assert.equal(s2.kind, 'originate');
  assert.deepEqual(s2.originated, ['B', 'C']);
  assert.deepEqual(s2.lsdb.B, { A: 1, B: 2, C: 1, D: 1, E: 1 });
  assert.deepEqual(s2.lsdb.A, s0.lsdb.A);
  assert.deepEqual(s2.lsas['B#2'].links, [['A', 2], ['C', 5], ['D', 4]]);
});

test('rule 8: with flooding hidden, the change step puts the new LSAs in every LSDB and SPF follows', () => {
  assert.equal(kinds({ costBC: 5, showFlood: false }), 'start change spf spf spf spf spf table');
  const s1 = at({ costBC: 5, showFlood: false }, 1);
  for (const r of logic.ROUTERS) assert.deepEqual(s1.lsdb[r], { A: 1, B: 2, C: 2, D: 1, E: 1 });
  assert.equal(table(last({ costBC: 5, showFlood: false }).table), table(last({ costBC: 5 }).table));
});

test('rule 9: the metric is the sum of costs, not the hop count: A–B–C (3) beats the direct A–C (5)', () => {
  const s = last({});
  assert.equal(s.spf.dist.C, 3);
  assert.deepEqual(s.spf.parents.C, ['B']);
  assert.equal(last({ costBC: 4 }).spf.dist.C, 5, 'at B–C 4 the direct link wins (5 < 6)');
  assert.deepEqual(last({ costBC: 4 }).spf.nextHop.C, ['C']);
});

test('showFlood off without a change: the LSDBs are complete at step 0 and SPF starts at step 1', () => {
  const s0 = at({ showFlood: false }, 0);
  assert.ok(logic.complete(s0.lsdb, s0.lsas));
  assert.equal(kinds({ source: 'E', showFlood: false }), 'start spf spf spf spf spf table');
});

test('state fields the page draws: round counts up, the tree holds final routers only, no copies outside flooding', () => {
  assert.deepEqual([2, 3].map((n) => at({}, n).round), [1, 2]);
  const mid = at({}, 6);   // A, B, C final; D and E tentative
  assert.deepEqual(mid.tree.map((e) => e.a + e.b), ['AB', 'BC']);
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      if (s.kind !== 'flood') assert.deepEqual(s.inFlight, [], `${JSON.stringify(o)} step ${n}`);
    }
  }
});

test('change details the captions use: the old cost, who originated, the old parents of a better path', () => {
  assert.deepEqual(logic.changeOf(P({ costBC: 7 })).cost, { from: 1, to: 7 });
  assert.deepEqual(at({ costBC: 5, showFlood: false }, 1).originated, ['B', 'C']);
  const d = at({}, 6).spf.relaxed.find((x) => x.r === 'D');
  assert.deepEqual(d.old, { dist: 6, nextHop: ['B'], parents: ['B'] });
});

// ── presets (SPEC.md "Expected numbers") ──

test('preset spf-from-a: 9 steps, 14/0 then 28/22 copies, finals A0 B2 C3 D4 E6, every next hop B', () => {
  assert.equal(logic.steps(P({})), 9);
  assert.equal(kinds({}), 'start originate flood flood spf spf spf spf spf table');
  assert.equal(floods({}), '14/0 28/22');
  assert.equal(finals({}), 'A0 B2 C3 D4 E6');
  assert.equal(table(last({}).table), 'B2/B C3/B D4/B E6/B');
  assert.equal(last({}).tree.filter((e) => e.ecmp).length, 0);
});

test('preset cost-change: 10 steps, 7/0 then 12/11, finals A0 B2 C5 D6 E8, D and E via B and C', () => {
  assert.equal(logic.steps(P({ costBC: 5 })), 10);
  assert.equal(kinds({ costBC: 5 }), 'start change originate flood flood spf spf spf spf spf table');
  assert.equal(floods({ costBC: 5 }), '7/0 12/11');
  assert.equal(finals({ costBC: 5 }), 'A0 B2 C5 D6 E8');
  assert.equal(table(last({ costBC: 5 }).table), 'B2/B C5/C D6/BC E8/BC');
});

test('preset link-fails: 10 steps, 5/0 then 7/4, finals A0 B2 C3 D6 E8, every next hop B', () => {
  assert.equal(logic.steps(P({ fail: 'C-D' })), 10);
  assert.equal(floods({ fail: 'C-D' }), '5/0 7/4');
  assert.equal(finals({ fail: 'C-D' }), 'A0 B2 C3 D6 E8');
  assert.equal(table(last({ fail: 'C-D' }).table), 'B2/B C3/B D6/B E8/B');
  assert.ok(!last({ fail: 'C-D' }).links.find((l) => l.id === 'C-D').up);
});

test('preset spf-from-e: 9 steps (6 without flooding), finals E0 D2 C3 B4 A6, every next hop D', () => {
  assert.equal(logic.steps(P({ source: 'E' })), 9);
  assert.equal(logic.steps(P({ source: 'E', showFlood: false })), 6);
  assert.equal(finals({ source: 'E' }), 'E0 D2 C3 B4 A6');
  assert.equal(table(last({ source: 'E' }).table), 'A6/D B4/D C3/D D2/D');
});

test('other params: B–D fails changes nothing from A; a change without flooding takes 7 steps', () => {
  assert.equal(floods({ fail: 'B-D' }), '4/0 8/4');
  assert.equal(table(last({ fail: 'B-D' }).table), table(last({ fail: 'B-D' }).oldTable));
  assert.equal(logic.steps(P({ fail: 'C-D', showFlood: false })), 7);
  for (const source of logic.ROUTERS) {
    for (const costBC of [1, 2, 5, 10]) {
      for (const fail of logic.FAILS) {
        for (const showFlood of [true, false]) {
          const p = P({ source, costBC, fail, showFlood });
          const n = logic.steps(p);
          assert.ok(n <= 20, JSON.stringify(p));
          const s = kit.stateAt(logic, p, n);
          assert.ok(s.end && s.kind === 'table', JSON.stringify(p));
          assert.equal(s.table.length, 4, 'the graph stays connected: four destinations');
        }
      }
    }
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
    for (let n = 1; n <= logic.steps(p); n++) {
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
    const params = Function('return ' + m[2])();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(P(params), P(PRESETS[m[1]]), m[1]);
  }
});
