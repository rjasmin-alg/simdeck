// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the bgp-hijack model: tie-breaks first, then each rule (SPEC.md), then the presets' expected numbers, then
// the template's generic block. Run: node --test sims/bgp-hijack/
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
const fwd = (s, id) => s.ases[id].fwd;
const dest = (s, id) => (fwd(s, id) ? fwd(s, id).dest : null);
const to = (s, d) => Object.keys(s.ases).filter((id) => dest(s, id) === d).sort().join('');
const O = 64496, A = 64497, B = 64498, E = 64501, F = 64502, X = 64511;
const LEGIT = '203.0.113.0/24', MORE = '203.0.113.0/25';
const ROA = [{ prefix: LEGIT, maxLength: 24, origin: O }];
const PRESETS = {
  normal: {},
  'same-prefix': { conflict: 'same-prefix' },
  'more-specific': { conflict: 'more-specific' },
  'rov-all': { conflict: 'more-specific', roa: true, rovDeployment: 'all' },
  'rov-half': { conflict: 'more-specific', roa: true, rovDeployment: 'half' }
};
function combos() {
  const out = [];
  for (const conflict of ['none', 'same-prefix', 'more-specific']) for (const roa of [false, true]) {
    for (const rovDeployment of ['none', 'half', 'all']) out.push({ conflict, roa, rovDeployment });
  }
  return out;
}
const route = (prefix, from, path) => ({ prefix, from, path, lp: 100 });

// ── tie-breaks first ──

test('rule 1 tie: X hears two /24 paths of three ASNs, from E and F → E, the lower router ID', () => {
  const s = at({}, 3);
  const rib = s.ases.X.rib.filter((e) => e.prefix === LEGIT);
  assert.deepEqual(rib.map((e) => [e.from, e.path]), [['E', [E, A, O]], ['F', [F, B, O]]]);
  assert.equal(s.ases.X.best[LEGIT].from, 'E', '192.0.2.5 < 192.0.2.6');
  assert.equal(s.ases.X.by[LEGIT], 'rid');
});

test('rule 1 tie: C hears [64497 64496] from A and [64498 64496] from B → A, the lower router ID', () => {
  const s = at({}, 2);
  assert.deepEqual(s.ases.C.rib.map((e) => [e.from, e.path]), [['A', [A, O]], ['B', [B, O]]]);
  assert.equal(s.ases.C.best[LEGIT].from, 'A', '192.0.2.1 < 192.0.2.2');
  assert.equal(s.ases.C.by[LEGIT], 'rid');
});

test('rule 1 tie: router IDs decide, not ASNs or scene order (E and F swapped → X picks F)', () => {
  const sc = logic.sceneOf(P({}));
  sc.ases.find((a) => a.id === 'E').routerId = '192.0.2.6';
  sc.ases.find((a) => a.id === 'F').routerId = '192.0.2.5';
  let st = logic.initialOf(sc);
  while (!st.done) st = logic.stepOf(sc, st);
  assert.equal(st.ases.X.best[LEGIT].from, 'F');
  assert.equal(st.ases.X.by[LEGIT], 'rid');
});

test('rule 1 tie: the origin hears the /25 from A and B, equally long → A, the lower router ID', () => {
  const s = at({ conflict: 'more-specific' }, 3);
  assert.equal(s.ases.O.best[MORE].from, 'A');
  assert.equal(s.ases.O.by[MORE], 'rid');
});

test('a local route beats any learned one for the same prefix (X starts its own /24)', () => {
  const s = at({ conflict: 'same-prefix' }, 1);
  assert.equal(s.ases.X.best[LEGIT].local, true);
  assert.equal(s.ases.X.by[LEGIT], 'local');
  assert.equal(fwd(s, 'X').via, null);
  // even against a learned route with a higher LOCAL_PREF (the decision copied from bgp-path-selection)
  const sc = logic.sceneOf(P({}));
  const d = logic.decide(sc, [Object.assign(route(LEGIT, 'E', [E, A, O]), { lp: 200 }), { prefix: LEGIT, from: null, path: [], lp: 100, local: true }]);
  assert.equal(d.best.local, true);
  assert.equal(d.by, 'local');
});

test('rule 4 tie: two ROAs cover a route, one matches → Valid (any match wins)', () => {
  const roas = [{ prefix: '203.0.113.0/24', maxLength: 24, origin: O }, { prefix: '203.0.113.0/24', maxLength: 25, origin: X }];
  assert.equal(logic.validate(roas, MORE, X), 'valid');
  assert.equal(logic.validate(roas, MORE, O), 'invalid', 'the only ROA with the origin allows /24 at most');
  assert.equal(logic.validate(roas, LEGIT, O), 'valid');
});

test('the home AS delivers the test address itself, even when it holds the longer /25', () => {
  const s = last({ conflict: 'more-specific' });
  assert.ok(s.ases.O.best[MORE], 'O stores the /25');
  assert.deepEqual(fwd(s, 'O'), { prefix: null, via: null, origin: O, dest: 'O', hops: ['O'] });
});

// ── rules ──

test('rule 1: the shorter AS path wins for the same prefix (E: [64511] beats [64497 64496])', () => {
  const s = at({ conflict: 'same-prefix' }, 1);
  const rib = s.ases.E.rib.filter((e) => e.prefix === LEGIT);
  assert.deepEqual(rib.map((e) => e.path).sort(), [[A, O], [X]].sort());
  assert.equal(s.ases.E.best[LEGIT].from, 'X');
  assert.equal(s.ases.E.by[LEGIT], 'len');
  // and an AS closer to O keeps O: A hears [64501 64511] (2) against [64496] (1)
  const s2 = at({ conflict: 'same-prefix' }, 2);
  assert.equal(s2.ases.A.best[LEGIT].from, 'O');
});

test('rule 2: forwarding takes the longest matching prefix, however long its AS path', () => {
  const s = at({ conflict: 'more-specific' }, 2);
  assert.deepEqual(s.ases.A.best[LEGIT].path, [O], 'the /24 is one ASN away');
  assert.deepEqual(s.ases.A.best[MORE].path, [E, X], 'the /25 is two');
  assert.equal(fwd(s, 'A').prefix, MORE);
  assert.equal(fwd(s, 'A').via, 'E');
  assert.equal(dest(s, 'A'), 'X');
});

test('rule 2: lookup and prefix arithmetic', () => {
  assert.ok(logic.covers(LEGIT, '203.0.113.10'));
  assert.ok(logic.covers(MORE, '203.0.113.10'));
  assert.ok(!logic.covers('203.0.113.128/25', '203.0.113.10'));
  assert.ok(logic.prefixCovers(LEGIT, MORE));
  assert.ok(!logic.prefixCovers(MORE, LEGIT), 'a shorter prefix is not covered by a longer ROA prefix');
  assert.ok(!logic.prefixCovers(LEGIT, '198.51.100.0/24'));
  assert.ok(logic.prefixCovers(LEGIT, '203.0.113.128/25'), 'the upper half is covered too');
  assert.ok(!logic.prefixCovers('203.0.113.128/25', MORE));
  const sc = logic.sceneOf(P({}));
  const st = { ases: { A: { best: { [LEGIT]: route(LEGIT, 'O', [O]), [MORE]: route(MORE, 'E', [E, X]), '203.0.113.128/25': route('203.0.113.128/25', 'C', [64499, O]) } } } };
  assert.equal(logic.lookup(sc, st, 'A').prefix, MORE, 'the /25 that covers .10, not the other half');
});

test('rule 2: a forwarding AS can be drawn in by its next hop before it hears the /25 itself', () => {
  const s = at({ conflict: 'more-specific' }, 2);
  assert.equal(s.ases.C.best[MORE], undefined, 'C has not heard the /25 yet');
  assert.equal(fwd(s, 'C').prefix, LEGIT);
  assert.deepEqual(fwd(s, 'C').hops, ['C', 'A', 'E', 'X']);
  assert.equal(dest(s, 'C'), 'X');
  assert.ok(s.changed.includes('C'), 'its forwarding changed');
});

test('rule 3: the same prefix captures only the ASes closer to X; a more-specific captures everyone who accepts it', () => {
  assert.equal(to(last({ conflict: 'same-prefix' }), 'X'), 'EFX');
  assert.equal(to(last({ conflict: 'same-prefix' }), 'O'), 'ABCDO');
  assert.equal(to(last({ conflict: 'more-specific' }), 'X'), 'ABCDEFX');
  assert.equal(to(last({ conflict: 'more-specific' }), 'O'), 'O');
});

test('rule 4: Valid, Invalid (wrong origin, too long), NotFound', () => {
  assert.equal(logic.validate(ROA, LEGIT, O), 'valid');
  assert.equal(logic.validate(ROA, LEGIT, X), 'invalid', 'wrong origin');
  assert.equal(logic.validate(ROA, MORE, O), 'invalid', 'right origin, longer than maxLength');
  assert.equal(logic.validate(ROA, MORE, X), 'invalid', 'both');
  assert.equal(logic.validate(ROA, '198.51.100.0/24', X), 'notfound', 'no ROA covers it');
  assert.equal(logic.validate(ROA, '203.0.112.0/23', X), 'notfound', 'a shorter prefix is not covered');
  assert.equal(logic.validate([], LEGIT, O), 'notfound');
  assert.equal(logic.validate(ROA, '203.0.113.128/25', X), 'invalid', 'the upper half is covered by the /24 ROA');
  assert.equal(logic.validate([{ prefix: LEGIT, maxLength: 25, origin: O }], MORE, O), 'valid', 'maxLength 25 allows the /25');
});

test('rule 5: a validating AS drops an Invalid route; a non-validating one keeps it', () => {
  const s = at({ conflict: 'more-specific', roa: true, rovDeployment: 'half' }, 1);
  const xf = s.msgs.find((m) => m.from === 'X' && m.to === 'F');
  assert.equal(xf.result, 'invalid');
  assert.equal(xf.valid, 'invalid');
  assert.equal(s.ases.F.rib.find((e) => e.prefix === MORE), undefined);
  const xe = s.msgs.find((m) => m.from === 'X' && m.to === 'E');
  assert.equal(xe.result, 'stored');
  assert.equal(xe.valid, null, 'E does not validate, so it labels nothing');
  assert.equal(s.ases.E.best[MORE].from, 'X');
});

test('rule 5: a validating AS labels what it keeps (Valid /24, NotFound without a ROA)', () => {
  const s = last({ conflict: 'more-specific', roa: true, rovDeployment: 'all' });
  for (const id of 'ABCDEF') assert.equal(s.ases[id].best[LEGIT].valid, 'valid', id);
  assert.equal(s.ases.A.best[MORE], undefined);
  const nf = last({ conflict: 'more-specific', roa: false, rovDeployment: 'all' });
  assert.equal(nf.ases.A.best[MORE].valid, 'notfound');
  assert.equal(nf.ases.A.best[LEGIT].valid, 'notfound');
  assert.equal(to(nf, 'X'), 'ABCDEFX', 'validation without a ROA changes nothing');
});

test('rule 5: an Invalid announcement still replaces what that neighbour sent before (RFC 4271 §9)', () => {
  const sc = logic.sceneOf(P({ conflict: 'same-prefix', roa: true, rovDeployment: 'all' }));
  const st = logic.initialOf(sc);
  // F holds the /24 [64498 64496] from B; now B sends an Invalid /24 [64498 64499 64511]
  st.ases.B.best[LEGIT] = route(LEGIT, 'C', [64499, X]);
  const r = logic.round(sc, st, [{ id: 'B', prefix: LEGIT }]);
  const bf = r.msgs.find((m) => m.to === 'F');
  assert.deepEqual(bf.path, [B, 64499, X]);
  assert.equal(bf.result, 'invalid');
  assert.deepEqual(bf.removed, [B, O]);
  assert.equal(st.ases.F.rib.find((e) => e.from === 'B' && e.prefix === LEGIT), undefined);
  assert.deepEqual(st.ases.F.best[LEGIT].path, [X, E, A, O], 'F reruns the decision and falls back to X’s path');
  assert.deepEqual(r.send, [{ id: 'F', prefix: LEGIT }]);
});

test('rule 5: traffic from a validating AS still ends at X through a non-validating neighbour (rov-half)', () => {
  const s = last(PRESETS['rov-half']);
  assert.ok(s.ases.C.rov);
  assert.equal(s.ases.C.best[MORE], undefined, 'C dropped the /25');
  assert.equal(fwd(s, 'C').prefix, LEGIT);
  assert.equal(fwd(s, 'C').origin, O, 'by its own table C sends towards AS64496');
  assert.deepEqual(fwd(s, 'C').hops, ['C', 'A', 'E', 'X']);
  assert.equal(dest(s, 'C'), 'X');
});

test('rule 7: validation reads the prefix and the origin AS only, not the rest of the path', () => {
  assert.equal(logic.validate.length, 3, 'validate(roas, prefix, originAsn): no path argument');
  const sc = logic.sceneOf(P({ roa: true }));
  assert.equal(logic.originOf(sc, 'A', route(LEGIT, 'E', [E, X, O])), O, 'the last ASN is the origin');
  assert.equal(logic.originOf(sc, 'X', { local: true, path: [] }), X, 'a local route has the AS itself as origin');
});

test('withdrawal: an AS left with no route for a prefix withdraws it', () => {
  const sc = logic.sceneOf(P({}));
  const st = logic.initialOf(sc);
  st.ases.A.rib = []; st.ases.A.best = {}; st.ases.A.by = {};
  st.ases.C.rib = [{ prefix: LEGIT, from: 'A', path: [A, O], lp: 100, valid: null }];
  st.ases.C.best[LEGIT] = st.ases.C.rib[0];
  const r = logic.round(sc, st, [{ id: 'A', prefix: LEGIT }]);
  assert.ok(r.msgs.every((m) => m.kind === 'withdraw'));
  assert.equal(st.ases.C.best[LEGIT], undefined);
  assert.deepEqual(r.send, [{ id: 'C', prefix: LEGIT }]);
});

test('scene: the ROA, the deployment sets and the labels of local routes', () => {
  assert.deepEqual(logic.sceneOf(P({ roa: true })).roas, ROA);
  assert.deepEqual(logic.sceneOf(P({})).roas, []);
  assert.deepEqual(logic.sceneOf(P({ rovDeployment: 'all' })).rov, ['O', 'A', 'B', 'C', 'D', 'E', 'F', 'X']);
  assert.deepEqual(logic.sceneOf(P({ rovDeployment: 'none' })).rov, []);
  const s = last(PRESETS['rov-all']);
  assert.equal(s.ases.O.best[LEGIT].valid, 'valid', 'O labels its own route');
  assert.equal(s.ases.X.best[MORE].valid, 'invalid', 'X labels its own route, but keeps it (rule 5)');
  assert.equal(last(PRESETS['more-specific']).ases.X.best[MORE].valid, null, 'no label without validation');
});

// ── presets: expected numbers (SPEC.md) ──

test('preset normal: 5 steps; O → A, B → C, E, F → D, X; all eight forward to AS64496', () => {
  const p = PRESETS.normal;
  assert.equal(logic.steps(P(p)), 5);
  const s0 = at(p, 0);
  assert.equal(s0.phase, 'origin');
  assert.equal(to(s0, 'O'), 'O', 'only O knows the prefix');
  assert.deepEqual(at(p, 1).changed, ['A', 'B']);
  assert.deepEqual(at(p, 2).changed, ['C', 'E', 'F']);
  assert.deepEqual(at(p, 3).changed, ['D', 'X']);
  assert.deepEqual(at(p, 4).changed, []);
  assert.equal(at(p, 4).send.length, 0);
  const end = last(p);
  assert.equal(end.phase, 'converged');
  assert.equal(to(end, 'O'), 'ABCDEFOX');
});

test('preset same-prefix: starts converged, 3 steps; E, F and X to AS64511, five to AS64496', () => {
  const p = PRESETS['same-prefix'];
  assert.equal(logic.steps(P(p)), 3);
  const s0 = at(p, 0);
  assert.equal(s0.phase, 'ready');
  assert.equal(to(s0, 'O'), 'ABCDEFOX', 'step 0: the legitimate /24 has converged');
  assert.deepEqual(s0.pending, { as: 'X', prefix: LEGIT });
  const s1 = at(p, 1);
  assert.equal(s1.started, 'X');
  assert.deepEqual(s1.msgs.map((m) => [m.from, m.to, m.path]), [['X', 'E', [X]], ['X', 'F', [X]]]);
  assert.deepEqual(s1.changed, ['E', 'F', 'X']);
  assert.deepEqual(at(p, 2).changed, []);
  const end = last(p);
  assert.equal(to(end, 'X'), 'EFX');
  assert.equal(to(end, 'O'), 'ABCDO');
});

test('preset more-specific: 6 steps; the /25 reaches every AS; seven of eight to AS64511', () => {
  const p = PRESETS['more-specific'];
  assert.equal(logic.steps(P(p)), 6);
  assert.deepEqual(at(p, 1).changed, ['E', 'F', 'X']);
  assert.deepEqual(at(p, 2).changed, ['A', 'B', 'C', 'D'], 'C and D are drawn in by their next hop');
  assert.deepEqual(at(p, 3).changed, ['C'], 'C now uses the /25 itself (same destination)');
  assert.deepEqual(at(p, 4).changed, ['D']);
  assert.deepEqual(at(p, 5).changed, []);
  const end = last(p);
  for (const id of 'ABCDEF') assert.equal(fwd(end, id).prefix, MORE, id);
  assert.deepEqual(end.ases.D.best[MORE].path, [64499, A, E, X]);
  assert.deepEqual(end.ases.C.best[MORE].path, [A, E, X], 'C: A and B tie at three ASNs, A has the lower router ID');
  assert.equal(to(end, 'X'), 'ABCDEFX');
});

test('preset rov-all: 2 steps; E and F drop the Invalid /25; everyone but X forwards to AS64496', () => {
  const p = PRESETS['rov-all'];
  assert.equal(logic.steps(P(p)), 2);
  const s1 = at(p, 1);
  assert.deepEqual(s1.msgs.map((m) => [m.to, m.result, m.valid]), [['E', 'invalid', 'invalid'], ['F', 'invalid', 'invalid']]);
  assert.deepEqual(s1.changed, ['X']);
  const end = last(p);
  assert.equal(to(end, 'O'), 'ABCDEFO');
  assert.equal(to(end, 'X'), 'X', 'X keeps its own traffic');
});

test('preset rov-half: 4 steps; O, B, C, F validate; C still ends at AS64511 through A', () => {
  const p = PRESETS['rov-half'];
  assert.equal(logic.steps(P(p)), 4);
  assert.deepEqual(logic.sceneOf(P(p)).rov, ['O', 'B', 'C', 'F']);
  const s1 = at(p, 1);
  assert.deepEqual(s1.changed, ['E', 'X']);
  assert.deepEqual(s1.msgs.filter((m) => m.result === 'invalid').map((m) => m.to), ['F']);
  const s2 = at(p, 2);
  assert.deepEqual(s2.changed, ['A', 'C', 'D'], 'A takes the /25; C and D are drawn in through A');
  const s3 = at(p, 3);
  assert.deepEqual(s3.msgs.filter((m) => m.result === 'invalid').map((m) => m.to), ['O', 'C']);
  assert.deepEqual(s3.changed, []);
  const end = last(p);
  assert.equal(to(end, 'X'), 'ACDEX');
  assert.equal(to(end, 'O'), 'BFO');
});

test('every combination of params converges within 20 steps (at most 6)', () => {
  let max = 0;
  for (const c of combos()) {
    const n = logic.steps(P(c));
    assert.ok(n <= 20, JSON.stringify(c));
    assert.equal(last(c).done, true);
    max = Math.max(max, n);
  }
  assert.equal(max, 6);
});

test('at convergence every AS holds exactly what each neighbour now sends it, unless it is a loop or Invalid', () => {
  for (const c of combos()) {
    const sc = logic.sceneOf(P(c)), s = last(c);
    for (const a of sc.ases) for (const nb of logic.neighbours(sc, a.id)) {
      for (const prefix of Object.keys(s.ases[nb.id].best)) {
        const sent = logic.pathOut(sc, nb.id, a.id, s.ases[nb.id].best[prefix]);
        const held = s.ases[a.id].rib.find((e) => e.from === nb.id && e.prefix === prefix);
        const invalid = s.ases[a.id].rov && logic.validate(sc.roas, prefix, sent.at(-1)) === 'invalid';
        if (sent.includes(a.asn) || invalid) assert.equal(held, undefined, `${a.id} holds a dropped path from ${nb.id} ${JSON.stringify(c)}`);
        else assert.deepEqual(held && held.path, sent, `${a.id} stores what ${nb.id} sends ${JSON.stringify(c)}`);
      }
    }
  }
});

test('traffic always ends at O or X, never in a loop or a black hole, once anyone knows the prefix', () => {
  for (const c of combos()) {
    for (const s of all(c).slice(c.conflict === 'none' ? 3 : 0)) {
      for (const id of Object.keys(s.ases)) assert.ok(['O', 'X'].includes(dest(s, id)), `${id} ${JSON.stringify(c)} round ${s.round}`);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const c of combos()) for (const s of all(c)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['rov-half']);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  for (const c of [PRESETS.normal, PRESETS['more-specific'], PRESETS['rov-half']]) {
    const p = P(c);
    let s = logic.initial(p);
    for (let i = 1; i <= logic.steps(p); i++) {
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
  for (const [id, over] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[^\\n]*params: \\{([^}]*)\\}`));
    assert.ok(m, `preset ${id} in the page`);
    const got = Function(`return {${m[1]}}`)();
    assert.deepEqual(P(got), P(over), `preset ${id} params`);
  }
});
