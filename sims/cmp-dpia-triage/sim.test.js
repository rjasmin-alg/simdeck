// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-dpia-triage. Run: node --test sims/cmp-dpia-triage/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the scoring functions this sim uses (copied with
// scoring.js from cmp-risk-register), then the rules in order, the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const M = require('./scoring.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const OFF = Object.fromEntries(logic.KEYS.map((k) => [k, false]));
/** A plan with exactly the listed keys on. */
const plan = (...on) => Object.assign({}, OFF, Object.fromEntries(on.map((k) => [k, true])));
const S = (...on) => logic.compute(plan(...on));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const A = (s, id) => s.acts.find((x) => x.id === id);
const lit = (s) => s.crit.filter((c) => c.lit).map((c) => c.id);
const ALL = logic.MEASURES;

// ── tie-breaks ──

test('rule 6: 12 is on the line, not above; 15 is the first high score', () => {
  assert.equal(M.above(12, logic.HIGH), false);
  assert.equal(M.above(13, logic.HIGH), true);
  // face at the firm with every measure ends at 3 × 4 = 12: proceed; the group roll-out lifts it to 16: consult
  const firm = S('face', ...ALL);
  assert.deepEqual([A(firm, 'face').score1, A(firm, 'face').high1, firm.verdict], [12, false, 'proceed']);
  const grp = S('face', 'group', ...ALL);
  assert.deepEqual([A(grp, 'face').score1, A(grp, 'face').high1, grp.verdict], [16, true, 'consult']);
  // combine before measures is 3 × 4 = 12: two criteria but not high
  assert.deepEqual([A(S('badge', 'combine'), 'combine').high0, S('badge', 'combine').verdict], [false, 'proceed']);
});

test('rule 7: on equal scores the first activity in order is the highest', () => {
  // before and after are chosen separately: camera 16 before, face 12 after
  const cf = S('camera', 'face', 'minimise', 'retention', 'access');
  assert.deepEqual(cf.top0, { id: 'camera', score: 16, high: true });
  assert.deepEqual(cf.top1, { id: 'face', score: 12, high: false });
  assert.equal(A(S('camera', 'minimise', 'retention', 'access'), 'camera').high0, true);
  assert.equal(logic.top([16, 16]), 0);
  assert.equal(logic.top([9, 16, 16]), 1);
  assert.equal(logic.top([2, 12, 9]), 1);
  assert.equal(logic.top([]), null);
  const s = S('pcs', 'camera');                         // both 16; camera (3) comes before computers (4)
  assert.deepEqual(s.top0, { id: 'camera', score: 16, high: true });
  assert.equal(s.top1.id, 'camera');
  // computers drop to 2 × 2 with every measure, camera only to 2 × 3: camera stays highest after measures
  assert.deepEqual(S('pcs', 'camera', ...ALL).top1, { id: 'camera', score: 6, high: false });
});

test('rule 2: the report needs a source; alone it lights nothing and has no risk', () => {
  const alone = S('combine');
  assert.equal(A(alone, 'combine').active, false);
  assert.equal(A(alone, 'combine').on, true);
  assert.equal(A(alone, 'combine').score0, undefined);
  assert.deepEqual([alone.count, alone.verdict, alone.noSource, alone.top1], [0, 'empty', true, null]);
  for (const src of ['badge', 'cars', 'camera', 'pcs', 'face']) {
    const s = S('combine', src);
    assert.equal(A(s, 'combine').active, true, src);
    assert.equal(s.noSource, false, src);
    assert.ok(lit(s).includes('combined'), src);
  }
  assert.equal(S('badge').noSource, false);              // combine off: no note
});

test('rule 3: the group lights large scale only with an active activity, and adds 1 to likelihood up to 5', () => {
  assert.deepEqual([S('group').count, S('group').verdict], [0, 'empty']);
  assert.deepEqual(lit(S('group', 'combine')), []);    // a report with nothing to join is not active
  const b = S('badge', 'group');
  assert.deepEqual(lit(b), ['large', 'vulnerable']);
  assert.deepEqual(b.crit.find((c) => c.id === 'large').by, ['group']);
  assert.equal(b.verdict, 'proceed');                  // one harmless log for 2 400 people: two criteria
  assert.deepEqual([A(b, 'badge').l0, A(b, 'badge').s0], [3, 1]);
  assert.deepEqual([A(S('camera', 'group'), 'camera').l0, A(S('camera', 'group'), 'camera').score0], [5, 20]);
  assert.equal(A(S('pcs', 'group'), 'pcs').l0, 5);
  assert.equal(A(S('cars', 'group'), 'cars').s0, 3);   // severity unchanged
  assert.equal(S('badge').people, 140);
  assert.equal(b.people, 2400);
});

test('rule 5: floors at 1; a measure eaten by the floor still counts as acting (rule 9)', () => {
  // cars: L 3 − 3 (pseudo, retention, access) floors at 1, S 3 − 1 = 2
  const c = A(S('cars', ...ALL), 'cars');
  assert.deepEqual([c.l1, c.s1, c.score1], [1, 2, 2]);
  const f = M.treat({ l: 1, i: 1, t: 'reduce', dl: 3, di: 3, cost: 0 });
  assert.deepEqual([f.l1, f.i1], [1, 1]);
  // pcs with every measure: L 4 − 3 = 1, S 4 − 2 = 2
  assert.deepEqual([A(S('pcs', ...ALL), 'pcs').l1, A(S('pcs', ...ALL), 'pcs').s1], [1, 2]);
  // computers: S 4 − 2 = 2 from minimisation alone
  assert.deepEqual([A(S('pcs', 'minimise'), 'pcs').s1, A(S('pcs', 'minimise'), 'pcs').l1], [2, 4]);
  // badge at 1 × 1 after retention; retention, pseudo and access on: pseudo and access idle, retention not
  const b = S('badge', 'retention', 'pseudo', 'access');
  assert.deepEqual([A(b, 'badge').l1, A(b, 'badge').s1], [1, 1]);
  assert.deepEqual(b.idle, ['pseudo', 'access']);
  // cars with every measure: the floor ate one likelihood step, but no measure is idle
  assert.deepEqual(S('cars', ...ALL).idle, []);
});

// ── the copied scoring functions this sim uses ──

test('scoring: score is L × S; treat reduce subtracts and floors at 1; above is strict', () => {
  assert.equal(M.score(4, 4), 16);
  assert.equal(M.score(3, 5), 15);
  const r = M.treat({ l: 4, i: 4, t: 'reduce', dl: 2, di: 1, cost: 0, avoid: 0 });
  assert.deepEqual([r.l0, r.i0, r.s0, r.l1, r.i1, r.s1, r.noEffect], [4, 4, 16, 2, 3, 6, false]);
  const none = M.treat({ l: 4, i: 4, t: 'reduce', dl: 0, di: 0, cost: 0, avoid: 0 });
  assert.deepEqual([none.l1, none.i1, none.noEffect], [4, 4, true]);
  assert.equal(M.above(16, 12), true);
  assert.equal(M.above(12, 12), false);
});

// ── rules in order ──

test('rule 1: every activity at its place before measures, with its criteria', () => {
  const s = S('badge', 'cars', 'camera', 'pcs', 'combine', 'face');
  const pos = Object.fromEntries(s.acts.map((x) => [x.id, [x.l0, x.s0, x.score0]]));
  assert.deepEqual(pos, { badge: [2, 1, 2], cars: [3, 3, 9], camera: [4, 4, 16], pcs: [4, 4, 16], combine: [3, 4, 12], face: [3, 5, 15] });
  assert.deepEqual(s.acts.map((x) => x.n), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(lit(S('badge')), ['vulnerable']);
  assert.deepEqual(lit(S('cars')), ['monitor', 'sensitive', 'vulnerable']);
  assert.deepEqual(lit(S('camera')), ['monitor', 'vulnerable']);
  assert.deepEqual(lit(S('pcs')), ['monitor', 'sensitive', 'vulnerable']);
  assert.deepEqual(lit(S('face')), ['sensitive', 'vulnerable', 'newtech']);
  assert.deepEqual(lit(S('face', 'combine')), ['sensitive', 'combined', 'vulnerable', 'newtech']);
});

test('rule 1: what each measure lowers, one at a time (SPEC table)', () => {
  const eff = {};
  for (const id of logic.ACTIVITIES) {
    eff[id] = ALL.map((m) => {
      const x = A(S(id, 'badge', m), id);            // badge on too, so that combine has a source
      return [x.l0 - x.l1, x.s0 - x.s1];
    });
  }
  assert.deepEqual(eff, {
    badge: [[0, 0], [0, 0], [1, 0], [0, 0]],
    cars: [[0, 1], [1, 0], [1, 0], [1, 0]],
    camera: [[0, 1], [0, 0], [1, 0], [1, 0]],
    pcs: [[0, 2], [1, 0], [1, 0], [1, 0]],
    combine: [[0, 1], [1, 0], [0, 0], [1, 0]],
    face: [[0, 1], [0, 0], [0, 0], [0, 0]]
  });
  assert.deepEqual(A(S('camera', ...ALL), 'camera').by, ['minimise', 'retention', 'access']);
  assert.equal(A(S('camera', 'pseudo'), 'camera').moved, false);
  assert.equal(A(S('camera', 'access'), 'camera').moved, true);
});

test('rule 4: the criteria are a union in WP248 order, each naming what lit it; measures never change them', () => {
  const s = S('cars', 'camera', 'pcs', 'group');
  assert.deepEqual(lit(s), ['monitor', 'sensitive', 'large', 'vulnerable']);
  assert.deepEqual(s.crit.find((c) => c.id === 'monitor').by, ['cars', 'camera', 'pcs']);
  assert.deepEqual(s.crit.find((c) => c.id === 'vulnerable').by, ['cars', 'camera', 'pcs']);
  assert.deepEqual(s.crit.find((c) => c.id === 'newtech').by, []);
  assert.deepEqual(s.crit.map((c) => c.id), ['monitor', 'sensitive', 'large', 'combined', 'vulnerable', 'newtech']);
  assert.deepEqual(lit(S('badge', 'combine', 'group')), ['large', 'combined', 'vulnerable']);
  assert.deepEqual(S('badge', 'combine').crit.find((c) => c.id === 'vulnerable').by, ['badge', 'combine']);
  // every plan: the same criteria with and without every measure
  for (let bits = 0; bits < 128; bits++) {
    const on = logic.ACTIVITIES.concat(['group']).filter((k, j) => bits & (1 << j));
    assert.deepEqual(S(...on, ...ALL).crit, S(...on).crit, on.join(','));
  }
});

test('rule 8: the recommendation, first rule that applies', () => {
  assert.equal(S().verdict, 'empty');
  assert.equal(S('minimise').verdict, 'empty');
  assert.equal(S('badge').verdict, 'record');
  assert.equal(S('badge', ...ALL).verdict, 'record');                // measures do not matter with one criterion
  assert.equal(S('camera').verdict, 'consult');
  assert.equal(S('camera', 'minimise', 'retention', 'access').verdict, 'proceed');
  assert.equal(S('camera', 'minimise', 'retention').verdict, 'proceed');   // 3 × 3 = 9
  assert.equal(S('camera', 'retention').verdict, 'proceed');         // L 4 − 1 = 3: 3 × 4 = 12, on the line
  assert.equal(S('camera', 'minimise').verdict, 'proceed');          // S 4 − 1 = 3: 4 × 3 = 12
  assert.equal(S('camera', 'pseudo').verdict, 'consult');            // idle: still 16
});

test('rule 8: across all 128 plans, one criterion never comes with a high risk; the SPEC counts', () => {
  const count = (meas) => {
    const out = { empty: 0, record: 0, consult: 0, proceed: 0 };
    for (let bits = 0; bits < 128; bits++) {
      const on = logic.ACTIVITIES.concat(['group']).filter((k, j) => bits & (1 << j));
      const s = S(...on, ...meas);
      out[s.verdict]++;
      if (s.verdict === 'record') assert.equal(s.top0.high, false, on.join(','));
    }
    return out;
  };
  assert.deepEqual(count([]), { empty: 4, record: 1, consult: 115, proceed: 8 });
  assert.deepEqual(count(ALL), { empty: 4, record: 1, consult: 32, proceed: 91 });
});

test('rule 9: idle measures are judged by the table over the active activities', () => {
  assert.deepEqual(S('camera', 'pseudo').idle, ['pseudo']);
  assert.deepEqual(S('camera', 'pseudo', 'cars').idle, []);         // the cars use it
  assert.deepEqual(S('face', ...ALL).idle, ['pseudo', 'retention', 'access']);
  assert.deepEqual(S('minimise').idle, ['minimise']);                // nothing active: every measure is idle
  assert.deepEqual(S('combine', 'retention').idle, ['retention']);   // an inactive report does not count
  assert.deepEqual(S('badge', 'combine', 'retention').idle, []);     // the badge log uses it
});

test('rule 10: caption keys and at most two notes, in order', () => {
  const k = (...on) => logic.captionKey(S(...on));
  assert.deepEqual(k(), { key: 'capEmpty', notes: [] });
  assert.deepEqual(k('combine'), { key: 'capEmpty', notes: ['nNoSource'] });
  assert.deepEqual(k('combine', 'pseudo'), { key: 'capEmpty', notes: ['nNoSource', 'nIdle'] });
  assert.deepEqual(k('badge'), { key: 'capRecord', notes: [] });
  assert.deepEqual(k('badge', 'retention'), { key: 'capRecord', notes: [] });   // one criterion: no nSame
  assert.deepEqual(k('camera'), { key: 'capConsult0', notes: [] });
  assert.deepEqual(k('camera', 'pseudo'), { key: 'capConsult', notes: ['nIdle'] });   // nothing acts: no nSame
  assert.deepEqual(k('camera', 'pseudo', 'access'), { key: 'capProceed', notes: ['nIdle', 'nSame'] });   // 3 × 4 = 12
  assert.deepEqual(k('camera', 'minimise', 'retention', 'access'), { key: 'capProceed', notes: ['nSame'] });
  assert.deepEqual(k('badge', 'combine'), { key: 'capProceed0', notes: [] });
  // three candidates: the third is dropped
  const s = S('camera', 'pseudo', 'access');
  s.noSource = true;
  assert.deepEqual(logic.captionKey(s).notes, ['nNoSource', 'nIdle']);
});

test('rule 11: changed criteria and verdict between two states', () => {
  assert.deepEqual(logic.flipped(null, S('badge')), { crit: [], verdict: false });
  assert.deepEqual(logic.flipped(S('badge'), S('badge', 'combine')), { crit: ['combined'], verdict: true });
  assert.deepEqual(logic.flipped(S('camera'), S('camera', 'minimise', 'retention', 'access')), { crit: [], verdict: true });
  assert.deepEqual(logic.flipped(S('camera'), S('camera', 'pcs')), { crit: ['sensitive'], verdict: false });
  assert.deepEqual(logic.flipped(S('camera'), S()), { crit: ['monitor', 'vulnerable'], verdict: true });
});

test('rule 12: params are normalised', () => {
  const n = logic.normalise({ badge: 'true', cars: 1, camera: '1', pcs: 'yes', combine: 0, face: null, group: {}, minimise: 'false', pseudo: true, extra: 5 });
  assert.deepEqual(n, Object.assign({}, OFF, { badge: true, cars: true, camera: true, pseudo: true }));
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(Object.keys(logic.normalise({ extra: 1 })).sort(), logic.KEYS.slice().sort());
});

test('the matrix cells: high strictly above 12 and the staircase edges', () => {
  const c = logic.cells();
  assert.equal(c.length, 25);
  const at = (l, s) => c.find((x) => x.l === l && x.s === s);
  assert.deepEqual(c.filter((x) => x.high).map((x) => x.score).sort((a, b) => a - b), [15, 15, 16, 20, 20, 25]);
  assert.equal(at(3, 4).high, false);                  // 12
  assert.deepEqual([at(3, 5).edgeL, at(3, 5).edgeB], [true, true]);
  assert.deepEqual([at(4, 4).edgeL, at(4, 4).edgeB], [true, true]);
  assert.deepEqual([at(5, 4).edgeL, at(5, 4).edgeB], [false, false]);   // left of it 15, below it 16: both high
  assert.deepEqual([at(5, 3).edgeL, at(5, 3).edgeB], [true, true]);     // left 10, below 12: neither high
  assert.deepEqual([at(4, 5).edgeL, at(4, 5).edgeB], [false, false]);   // left 16, below 15: both high
  assert.deepEqual([at(1, 1).edgeL, at(1, 1).edgeB], [false, false]);   // not high: no edges
});

// ── presets ──

test('presets: the SPEC table', () => {
  const row = (id) => {
    const s = logic.compute(preset(id));
    return [lit(s).join(' '), s.count, s.top0.id, s.top0.score, s.top1.id, s.top1.score, s.verdict, logic.captionKey(s).notes.join(' '), s.idle.join(' ')];
  };
  assert.deepEqual(row('badge'), ['vulnerable', 1, 'badge', 2, 'badge', 2, 'record', '', '']);
  assert.deepEqual(row('camera'), ['monitor vulnerable', 2, 'camera', 16, 'camera', 16, 'consult', '', '']);
  assert.deepEqual(row('camera-measures'), ['monitor vulnerable', 2, 'camera', 16, 'camera', 6, 'proceed', 'nSame', '']);
  assert.deepEqual(row('join'), ['combined vulnerable', 2, 'combine', 12, 'combine', 12, 'proceed', '', '']);
  assert.deepEqual(row('package'), ['monitor sensitive combined vulnerable', 4, 'camera', 16, 'camera', 16, 'consult', '', '']);
  assert.deepEqual(row('face-group'), ['sensitive large vulnerable newtech', 4, 'face', 20, 'face', 16, 'consult', 'nIdle nSame', 'pseudo retention access']);
  const cm = A(logic.compute(preset('camera-measures')), 'camera');
  assert.deepEqual([cm.l0, cm.s0, cm.l1, cm.s1], [4, 4, 2, 3]);
  const fg = A(logic.compute(preset('face-group')), 'face');
  assert.deepEqual([fg.l0, fg.s0, fg.l1, fg.s1], [4, 5, 4, 4]);
  // package with every measure: proceed, camera 6 highest
  const pk = logic.compute(Object.assign({}, preset('package'), Object.fromEntries(ALL.map((m) => [m, true]))));
  assert.deepEqual([pk.verdict, pk.top1.id, pk.top1.score], ['proceed', 'camera', 6]);
});

test('the defaults are the first preset; presets carry every key', () => {
  assert.deepEqual(logic.defaults, logic.presets[0].params);
  for (const x of logic.presets) assert.deepEqual(Object.keys(x.params).sort(), logic.KEYS.slice().sort(), x.id);
  assert.equal(new Set(logic.presets.map((x) => x.id)).size, logic.presets.length);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.compute(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('face-group'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every activity, criterion, measure, verdict, caption and preset has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  const caps = ['capEmpty', 'capRecord', 'capConsult0', 'capConsult', 'capProceed0', 'capProceed', 'nNoSource', 'nIdle', 'nSame'];
  for (const lang of ['hr', 'en']) {
    for (const id of logic.ACTIVITIES) for (const k of ['a_', 'as_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    for (const id of logic.CRITERIA) for (const k of ['c_', 'cs_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    for (const id of logic.MEASURES) for (const k of ['m_', 'mh_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    for (const v of logic.VERDICTS) for (const k of ['v_', 'vd_']) assert.ok(strings[lang][k + v], `${lang} ${k}${v}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: camera-measures → pCameraMeasures. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
