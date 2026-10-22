// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the bgp-path-selection model: tie-breaks first, then each rule (SPEC.md), then the presets' expected
// numbers, then the template's generic block. Run: node --test sims/bgp-path-selection/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const all = (over) => { const p = P(over), out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const last = (over) => all(over).at(-1);
const best = (s, id) => s.ases[id].best;
const via = (s, id) => (best(s, id) ? best(s, id).from : null);
const pathOf = (s, id) => (best(s, id) ? best(s, id).path : null);
const msg = (s, from, to) => s.msgs.find((m) => m.from === from && m.to === to);
const O = 64496, A = 64497, B = 64498, C = 64499, D = 64500;

/** A scene of its own: ases [id, asn, routerId], links 'X-Y', lp { recv: { from: v } }. */
function scene(ases, links, lp, fail) {
  return {
    prefix: logic.PREFIX, origin: ases[0][0],
    ases: ases.map(([id, asn, routerId]) => ({ id, asn, routerId })),
    links: links.map((l) => ({ id: l, a: l.split('-')[0], b: l.split('-')[1] })),
    lp: lp || {}, prepend: {}, fail: fail || null
  };
}
function run(sc) {
  const out = [logic.initialOf(sc)];
  while (!out.at(-1).done && out.length < 40) out.push(logic.stepOf(sc, out.at(-1)));
  return out;
}
const route = (from, path, lp) => ({ from, path, lp: lp == null ? 100 : lp });

// ── tie-breaks first (rules 3–6) ──

test('rule 6: equal LOCAL_PREF and length → the lower router ID of the neighbour (preset router-id-tie)', () => {
  const s = at({ watch: 'C' }, 2);
  assert.deepEqual(s.ases.C.rib.map((e) => [e.from, e.path]), [['A', [A, O]], ['B', [B, O]]]);
  assert.equal(via(s, 'C'), 'A', '192.0.2.1 < 192.0.2.2');
  assert.equal(s.ases.C.by, 'rid');
});

test('rule 6: router IDs compare as numbers, not as text', () => {
  const sc = scene([['O', O, '10.0.0.1'], ['X', A, '192.0.2.10'], ['Y', B, '192.0.2.9'], ['Z', C, '10.0.0.3']],
    ['O-X', 'O-Y', 'X-Z', 'Y-Z']);
  const end = run(sc).at(-1);
  assert.equal(via(end, 'Z'), 'Y', '192.0.2.9 < 192.0.2.10, although "192.0.2.10" < "192.0.2.9" as text');
  assert.equal(logic.ridNum('192.0.2.10') - logic.ridNum('192.0.2.9'), 1);
});

test('rule 6 comes after length: a lower router ID does not beat a shorter path', () => {
  const sc = logic.sceneOf(P({}));
  const d = logic.decide(sc, [route('A', [A, C, O]), route('B', [B, O])]);
  assert.equal(d.best.from, 'B');
  assert.equal(d.by, 'len');
});

test('rule 4: shorter AS path first; a prepended ASN counts each time', () => {
  const sc = logic.sceneOf(P({}));
  assert.equal(logic.decide(sc, [route('B', [B, O, O, O]), route('C', [C, A, O])]).best.from, 'C', '4 > 3');
  assert.equal(logic.decide(sc, [route('B', [B, O]), route('C', [C, A, O])]).by, 'len');
});

test('rule 3: higher LOCAL_PREF beats a shorter path; equal LOCAL_PREF passes to rule 4', () => {
  const sc = logic.sceneOf(P({}));
  const d = logic.decide(sc, [route('B', [B, O], 100), route('C', [C, A, O], 200)]);
  assert.equal(d.best.from, 'C');
  assert.equal(d.by, 'lp');
  assert.equal(logic.decide(sc, [route('B', [B, O], 100), route('C', [C, A, O], 100)]).best.from, 'B');
  // and LP beats the router ID too: B has the lower router ID
  assert.equal(logic.decide(sc, [route('B', [B, O], 50), route('C', [C, O], 100)]).best.from, 'C');
});

test('rule 5: ORIGIN and MED never decide; the last guard (scene order) is never reached in any run', () => {
  for (const lp of [100, 200]) for (const failLink of ['none', 'O-B', 'O-A']) for (const pr of [0, 1, 2, 3]) {
    for (const s of all({ dLocalPrefFromC: lp, failLink, prependOtoB: pr })) {
      for (const id of Object.keys(s.ases)) assert.notEqual(s.ases[id].by, 'order', `${lp} ${failLink} ${pr} ${id}`);
    }
  }
});

test('decide: none, only, and the locally originated route', () => {
  const sc = logic.sceneOf(P({}));
  assert.deepEqual(logic.decide(sc, []), { best: null, runner: null, by: null });
  assert.equal(logic.decide(sc, [route('B', [B, O])]).by, 'only');
  const own = { from: null, path: [], lp: 100, local: true };
  assert.equal(logic.decide(sc, [route('A', [A], 900), own]).best.local, true);
  assert.equal(logic.decide(sc, [own]).by, 'local', 'O\'s table says "own prefix", not "only path"');
  assert.equal(logic.decide(sc, [route('A', [A], 900), own]).by, 'local');
});

// ── rule 3: LOCAL_PREF is local ──

test('rule 3: LOCAL_PREF is the receiver\'s, never sent: B stores D\'s path with its own 100 (preset local-pref)', () => {
  const s3 = at({ dLocalPrefFromC: 200 }, 3);
  assert.equal(via(s3, 'D'), 'C');
  assert.equal(best(s3, 'D').lp, 200);
  assert.equal(s3.ases.D.by, 'lp');
  const s4 = at({ dLocalPrefFromC: 200 }, 4);
  const toB = msg(s4, 'D', 'B');
  assert.deepEqual(Object.keys(toB).sort(), ['from', 'kind', 'link', 'path', 'removed', 'result', 'to']);
  assert.deepEqual(toB.path, [D, C, A, O]);
  assert.equal(s4.ases.B.rib.find((e) => e.from === 'D').lp, 100);
  assert.equal(logic.lpFor(logic.sceneOf(P({ dLocalPrefFromC: 200 })), 'B', 'D'), 100);
});

// ── rule 2: prepend and loop prevention ──

test('rule 2: the sender prepends its own ASN; a receiver drops a path holding its own ASN', () => {
  const s2 = at({}, 2);
  assert.deepEqual(msg(s2, 'A', 'C').path, [A, O]);
  assert.equal(msg(s2, 'A', 'C').result, 'stored');
  assert.equal(msg(s2, 'A', 'O').result, 'loop', 'O sees 64496 in [64497 64496]');
  assert.deepEqual(s2.ases.O.rib.map((e) => !!e.local), [true]);
  const s3 = at({}, 3);
  assert.equal(msg(s3, 'C', 'A').result, 'loop');
  assert.equal(msg(s3, 'D', 'B').result, 'loop');
  assert.ok(!s3.ases.A.rib.some((e) => e.from === 'C'));
});

test('rule 2: a dropped path still replaces what that neighbour sent before (implicit withdrawal)', () => {
  // link-failure: C held [64498 64496] from B; B's new [64498 64499 64497 64496] holds 64499 → dropped, old one gone
  const s4 = at({ failLink: 'O-B' }, 4);
  assert.ok(s4.ases.C.rib.some((e) => e.from === 'B'));
  const s5 = at({ failLink: 'O-B' }, 5);
  const m = msg(s5, 'B', 'C');
  assert.equal(m.result, 'loop');
  assert.deepEqual(m.removed, [B, O]);
  assert.ok(!s5.ases.C.rib.some((e) => e.from === 'B'));
});

test('prepend: O sends its ASN three times to B and once to A', () => {
  const s1 = at({ prependOtoB: 2 }, 1);
  assert.deepEqual(msg(s1, 'O', 'B').path, [O, O, O]);
  assert.deepEqual(msg(s1, 'O', 'A').path, [O]);
});

// ── rule 7: withdrawal, failure, fallback ──

test('rule 7: an AS with no path left withdraws; the receiver falls back; the AS relearns (preset withdrawal)', () => {
  const s = all({ failLink: 'O-A' });
  assert.equal(s[4].phase, 'fail');
  assert.equal(s[4].failed, 'O-A');
  assert.equal(best(s[4], 'A'), null, 'C\'s path held 64497: A has nothing else');
  assert.deepEqual(s[4].changed, ['A']);
  assert.deepEqual(s[5].msgs.map((m) => [m.from, m.to, m.kind, m.result]), [['A', 'C', 'withdraw', 'withdrawn']], 'not to O: that link is down');
  assert.equal(via(s[5], 'C'), 'B');
  assert.deepEqual(pathOf(s[5], 'C'), [B, O]);
  assert.deepEqual(pathOf(s[6], 'A'), [C, B, O], 'A relearns via C');
  assert.equal(msg(s[6], 'C', 'B').result, 'loop');
  assert.equal(via(s[6], 'D'), 'B', 'D keeps the shorter path');
  assert.equal(msg(s[7], 'A', 'C').result, 'loop');
  assert.equal(s[8].phase, 'converged');
});

test('rule 7: a failed link removes what each end heard over it; an AS with an alternative needs no withdrawal', () => {
  const s = all({ failLink: 'O-B' });
  assert.deepEqual(s[4].lost, [{ at: 'B', from: 'O', path: [O] }]);
  assert.equal(via(s[4], 'B'), 'C', 'B already held C\'s path');
  assert.ok(!s.some((x) => x.msgs.some((m) => m.kind === 'withdraw')));
  assert.ok(!s.slice(5).some((x) => x.msgs.some((m) => m.link === 'O-B')), 'nothing crosses a failed link');
});

test('rule 7: a withdrawal travels on when the receiver has nothing left either (a chain)', () => {
  const sc = scene([['O', O, '1.0.0.1'], ['X', A, '1.0.0.2'], ['Y', B, '1.0.0.3']], ['O-X', 'X-Y'], {}, 'O-X');
  const s = run(sc);
  const fail = s.findIndex((x) => x.phase === 'fail');
  assert.equal(best(s[fail], 'X'), null);
  assert.deepEqual(s[fail + 1].msgs.map((m) => [m.from, m.to, m.kind]), [['X', 'Y', 'withdraw']]);
  assert.equal(best(s[fail + 1], 'Y'), null);
  assert.deepEqual(s[fail + 2].msgs.map((m) => [m.from, m.to, m.kind]), [['Y', 'X', 'withdraw']]);
  assert.equal(s.at(-1).phase, 'converged');
});

test('the link fails only once the network has converged (nothing to send)', () => {
  const s = all({ failLink: 'O-B', dLocalPrefFromC: 200 });
  const f = s.findIndex((x) => x.phase === 'fail');
  assert.equal(f, 5, 'local-pref needs 4 rounds');
  assert.deepEqual(s[f - 1].changed, []);
});

// ── one step ──

test('one step: only the ASes whose best changed send, to every neighbour over an up link', () => {
  const s = all({});
  assert.deepEqual(s[0].changed, ['O']);
  assert.deepEqual(s[1].msgs.map((m) => m.from + m.to), ['OA', 'OB']);
  assert.deepEqual(s[1].changed, ['A', 'B']);
  assert.deepEqual(s[2].msgs.map((m) => m.from + m.to), ['AO', 'AC', 'BO', 'BC', 'BD']);
  assert.deepEqual(s[2].changed, ['C', 'D']);
  assert.deepEqual(s[3].msgs.map((m) => m.from + m.to), ['CA', 'CB', 'CD', 'DB', 'DC']);
  assert.deepEqual(s[3].changed, []);
  assert.equal(s[4].phase, 'converged');
  assert.equal(s[4].msgs.length, 0);
});

test('a path from the same neighbour replaces the old one; a change of path from the same neighbour is a change', () => {
  // link-failure round 5: D's entry from B is replaced, [64498 64496] → [64498 64499 64497 64496]
  const s5 = at({ failLink: 'O-B' }, 5);
  const m = msg(s5, 'B', 'D');
  assert.deepEqual(m.removed, [B, O]);
  assert.deepEqual(s5.ases.D.rib.filter((e) => e.from === 'B').map((e) => e.path), [[B, C, A, O]]);
  // prepend 3: B's best moves from O to C in round 3 and B sends its new path in round 4
  const p3 = all({ prependOtoB: 3 });
  assert.ok(p3[3].changed.includes('B'));
  assert.deepEqual(msg(p3[4], 'B', 'D').path, [B, C, A, O]);
});

// ── presets: expected numbers (SPEC.md "Presets") ──

test('preset shortest-path: D via B, [64498 64496] beats [64499 64497 64496]; converged at step 4', () => {
  const s = last({});
  assert.equal(logic.steps(P({})), 4);
  assert.deepEqual(s.ases.D.rib.map((e) => [e.from, e.path, e.lp]), [['B', [B, O], 100], ['C', [C, A, O], 100]]);
  assert.equal(via(s, 'D'), 'B');
  assert.equal(s.ases.D.by, 'len');
  assert.deepEqual(logic.pathIds(logic.sceneOf(P({})), s, 'D'), ['D', 'B', 'O']);
});

test('pathIds: the AS sequence of a best path, a prepended ASN once', () => {
  const p = P({ prependOtoB: 1 });
  const s = last(p);
  assert.deepEqual(pathOf(s, 'D'), [B, O, O]);
  assert.deepEqual(logic.pathIds(logic.sceneOf(p), s, 'D'), ['D', 'B', 'O']);
});

test('rule 7: a failed link between two non-origin ASes: both ends forget what they heard over it', () => {
  // square O–X–Z, O–Y–Z; X–Z fails: Z forgets X's path, X forgets Z's (if stored)
  const sc = scene([['O', O, '1.0.0.1'], ['X', A, '1.0.0.2'], ['Y', B, '1.0.0.3'], ['Z', C, '1.0.0.4']],
    ['O-X', 'O-Y', 'X-Z', 'Y-Z'], {}, 'X-Z');
  const s = run(sc);
  const f = s.find((x) => x.phase === 'fail');
  assert.deepEqual(f.lost.map((e) => [e.at, e.from]).sort(), [['Z', 'X']], 'X held nothing from Z: Z\'s path via X looped');
  assert.ok(!f.ases.Z.rib.some((e) => e.from === 'X'));
  assert.equal(via(f, 'Z'), 'Y');
  const sc2 = scene([['O', O, '1.0.0.1'], ['X', A, '1.0.0.2'], ['Y', B, '1.0.0.3'], ['Z', C, '1.0.0.4']],
    ['O-X', 'O-Y', 'X-Z', 'Y-Z'], {}, 'Y-Z');
  const f2 = run(sc2).find((x) => x.phase === 'fail');
  assert.deepEqual(f2.lost.map((e) => [e.at, e.from]).sort(), [['Y', 'Z'], ['Z', 'Y']], 'both ends of Y–Z held something');
  assert.ok(!f2.ases.Y.rib.some((e) => e.from === 'Z') && !f2.ases.Z.rib.some((e) => e.from === 'Y'));
});

test('preset local-pref: D via C with LP 200; 5 steps', () => {
  const s = last({ dLocalPrefFromC: 200 });
  assert.equal(logic.steps(P({ dLocalPrefFromC: 200 })), 5);
  assert.deepEqual(pathOf(s, 'D'), [C, A, O]);
  assert.equal(via(s, 'B'), 'O');
});

test('preset link-failure: D falls back to [64499 64497 64496] via C; 7 steps', () => {
  const s = all({ failLink: 'O-B' });
  assert.equal(s.length - 1, 7);
  assert.equal(via(s[4], 'D'), 'B', 'D does not know yet');
  assert.deepEqual(pathOf(s[5], 'D'), [C, A, O]);
  assert.deepEqual(pathOf(s[7], 'B'), [C, A, O]);
  assert.deepEqual(s.map((x) => x.phase), ['origin', 'round', 'round', 'round', 'fail', 'round', 'round', 'converged']);
});

test('preset prepending: D via C (3 hops vs 4); B keeps O on router ID; the sweep 0–3', () => {
  const s = last({ prependOtoB: 2 });
  assert.equal(logic.steps(P({ prependOtoB: 2 })), 5);
  assert.deepEqual(pathOf(s, 'D'), [C, A, O]);
  assert.deepEqual(s.ases.D.rib.find((e) => e.from === 'B').path, [B, O, O, O]);
  assert.equal(via(s, 'B'), 'O');
  assert.equal(s.ases.B.by, 'rid', 'O 192.0.2.3 < C 192.0.2.4');
  const sweep = [0, 1, 2, 3].map((pr) => { const e = last({ prependOtoB: pr }); return [via(e, 'B'), via(e, 'D'), e.ases.D.by]; });
  assert.deepEqual(sweep, [['O', 'B', 'len'], ['O', 'B', 'rid'], ['O', 'C', 'len'], ['C', 'C', 'len']]);
});

test('steps: per preset, and never more than 20 for any params', () => {
  const steps = (o) => logic.steps(P(o));
  assert.deepEqual([steps({}), steps({ dLocalPrefFromC: 200 }), steps({ watch: 'C' }), steps({ failLink: 'O-B' }),
    steps({ prependOtoB: 2 }), steps({ failLink: 'O-A' })], [4, 5, 4, 7, 5, 8]);
  for (const lp of [100, 200]) for (const failLink of ['none', 'O-B', 'O-A']) for (const pr of [0, 1, 2, 3]) {
    const n = steps({ dLocalPrefFromC: lp, failLink, prependOtoB: pr });
    assert.ok(n > 0 && n <= 20, `${lp} ${failLink} ${pr}: ${n}`);
    assert.equal(at({ dLocalPrefFromC: lp, failLink, prependOtoB: pr }, n).phase, 'converged');
  }
});

test('at convergence every AS that has a path agrees with its neighbours (no stale path survives)', () => {
  for (const lp of [100, 200]) for (const failLink of ['none', 'O-B', 'O-A']) for (const pr of [0, 1, 2, 3]) {
    const p = P({ dLocalPrefFromC: lp, failLink, prependOtoB: pr });
    const s = last(p), sc = logic.sceneOf(p);
    for (const a of sc.ases) for (const e of s.ases[a.id].rib) {
      if (e.local) continue;
      const nb = sc.ases.find((x) => x.id === e.from);
      assert.ok(best(s, nb.id), `${a.id} holds a path from ${nb.id}, which has none (${lp} ${failLink} ${pr})`);
      const extra = (sc.prepend[nb.id] && sc.prepend[nb.id][a.id]) || 0;
      const sent = Array(1 + extra).fill(nb.asn).concat(best(s, nb.id).path);
      assert.deepEqual(e.path, sent, `${a.id} holds what ${nb.id} sends now (${lp} ${failLink} ${pr})`);
    }
    // and the converse: every neighbour's current announcement that passes rule 2 is stored
    for (const a of sc.ases) for (const nb of logic.neighbours(sc, s, a.id)) {
      const nbBest = best(s, nb.id);
      if (!nbBest) continue;
      const sent = logic.pathOut(sc, nb.id, a.id, nbBest);
      const held = s.ases[a.id].rib.find((e) => e.from === nb.id);
      if (sent.includes(a.asn)) assert.equal(held, undefined, `${a.id} holds a looped path from ${nb.id}`);
      else assert.deepEqual(held && held.path, sent, `${a.id} stores what ${nb.id} sends (${lp} ${failLink} ${pr})`);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { failLink: 'O-A' }, { dLocalPrefFromC: 200, prependOtoB: 3 }]) {
    for (const s of all(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ failLink: 'O-B', prependOtoB: 1 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  const p = P({ failLink: 'O-A' });
  let s = logic.initial(p);
  for (let i = 1; i <= logic.steps(p); i++) {
    const copy = structuredClone(s);
    const next = logic.step(s, i, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('the watched AS does not change the run', () => {
  assert.deepEqual(all({ watch: 'C' }), all({ watch: 'D' }));
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
