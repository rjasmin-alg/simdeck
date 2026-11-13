// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-risk-controls' model (rules in SPEC.md). Run: node --test sims/set-risk-controls/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const SC = (id) => logic.SCENES.find((s) => s.id === id);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} ≈ ${b}`);
/** Params with the given levels on in one scene. */
const ON = (scene, ...levels) => Object.fromEntries(levels.map((l) => [logic.key(scene, l), true]));
const sceneOf = (s, id) => s.scenes.find((x) => x.id === id);

// ── tie-breaks first ──

test('tie-break (rule 3): levels never go below 1; stacked controls past the floor stay at 1 × 1', () => {
  const r = logic.levelsWith(SC('lamp'), ['replace', 'separate', 'organise', 'protect']);
  assert.deepEqual(r, { l: 1, i: 1, s: 1 }, 'lamp: L 3−2−1 = 0 → 1, I 4−2−1 = 1');
  const st = logic.levelsWith(SC('stairs'), ['replace', 'separate', 'organise', 'protect']);
  assert.deepEqual(st, { l: 1, i: 2, s: 2 }, 'stairs: L 4−2−1−1 = 0 → 1, I 4−1−1 = 2');
});

test('tie-break (rule 3): remove wins over everything else chosen with it, on paper and on every run', () => {
  const s = sceneOf(D(ON('stairs', 'remove', 'organise', 'protect')), 'stairs');
  assert.equal(s.removed, true);
  assert.equal(s.s1, 0);
  assert.equal(s.day, 0);
  assert.equal(s.hurt, 0);
  assert.equal(logic.levelsWith(SC('car'), ['protect', 'remove']), null);
});

test('tie-break (rule 3): a control with no effect (dL = dI = 0) leaves the levels as they are', () => {
  assert.deepEqual(logic.levelsWith(SC('car'), ['protect']), { l: 3, i: 5, s: 15 });
  assert.deepEqual(logic.levelsWith(SC('door'), ['protect']), { l: 4, i: 4, s: 16 });
  const s = sceneOf(D(ON('car', 'protect')), 'car');
  assert.equal(s.day, 15, 'forgetting a control without effect changes nothing');
});

test('tie-break (rule 4): severity 4 is serious, 3 is not', () => {
  assert.equal(logic.SERIOUS, 4);
  // lamp with protect only: I 3 on runs where it is worn, 4 where forgotten
  const s = sceneOf(D(ON('lamp', 'protect')), 'lamp');
  for (const r of s.runs) if (r.sev) assert.equal(r.sev >= 4, r.miss.includes('protect'), 'serious exactly when the hard hat was forgotten');
  assert.equal(s.serious, s.runs.filter((r) => r.sev >= 4).length);
  near(s.eSerious, 200 * 0.04 * 0.3, 1e-9, 'expected serious = runs × p(L3) × fail(protect)');
});

test('tie-break (rule 5): a run draws whether to forget with u < fail (strict): fail 0 never forgets', () => {
  // replace has fail 0: never in miss, over many seeds
  const all = Object.assign({}, ...logic.SCENE_IDS.map((id) => ON(id, 'replace', 'separate', 'organise', 'protect')));
  for (let seed = 1; seed <= 99; seed++) for (const sc of D(Object.assign({ seed }, all)).scenes) {
    for (const r of sc.runs) assert.ok(!r.miss.includes('replace'), `seed ${seed} ${sc.id}`);
  }
  for (const pr of logic.presets) for (const sc of logic.derive(pr.params).scenes) {
    for (const r of sc.runs) {
      assert.ok(!r.miss.includes('replace') && !r.miss.includes('remove'), `${pr.id} ${sc.id}`);
    }
  }
});

test('tie-break (params): unknown scene falls back to the first; a seed out of range or not a number is 1', () => {
  assert.equal(D({ scene: 'dragon' }).scene, 0);
  assert.equal(D({ scene: 'car' }).scene, 2);
  for (const bad of [0, 100, -3, 'x', null, 2.4]) {
    const s = D({ seed: bad });
    assert.equal(s.seed, bad === 2.4 ? 2 : 1, String(bad));
  }
  assert.equal(D({ seed: 99 }).seed, 99);
  assert.equal(D({ seed: 2.6 }).seed, 3, 'rounds, not floors');
  assert.equal(D({ seed: 98.5 }).seed, 99);
  assert.equal(D({}).scene, 0, 'the page opens on the stairs');
  assert.equal(logic.defaults.scene, 'stairs');
});

test('tie-break (params): a control param that is not exactly true is off', () => {
  const s = D({ stairs_replace: 'true', stairs_organise: 1, stairs_protect: true });
  assert.deepEqual(sceneOf(s, 'stairs').chosen, ['protect']);
});

test('tie-break (rule 7): the strongest chosen level is the first in the order, whatever order they were set in', () => {
  assert.equal(logic.strongest(logic.chosenOf(P({ car_protect: true, car_separate: true }), 'car')), 'separate');
  assert.equal(logic.strongest([]), null);
  assert.equal(logic.strongest(logic.chosenOf(P({ car_protect: true, car_replace: true }), 'car')), 'replace');
  assert.equal(logic.strongest(logic.chosenOf(P({ lamp_organise: true, lamp_remove: true }), 'lamp')), 'remove');
  assert.equal(sceneOf(D(ON('door', 'protect', 'organise')), 'door').top, 'organise');
});

// ── rules ──

test('rule 1: the four scenes and their inherent levels and scores', () => {
  assert.deepEqual(logic.SCENES.map((s) => [s.id, s.l, s.i, logic.score(s.l, s.i)]),
    [['stairs', 4, 4, 16], ['lamp', 3, 4, 12], ['car', 3, 5, 15], ['door', 4, 4, 16]]);
  const s = D({});
  for (const x of s.scenes) {
    assert.equal(x.s1, x.s0, 'no controls: paper = inherent');
    assert.equal(x.day, x.s0, 'no controls: day = inherent');
    assert.equal(x.kept, 1);
  }
});

test('rule 2: five levels, strongest first; the fail chances rise down the order', () => {
  assert.deepEqual(logic.LEVEL_IDS, ['remove', 'replace', 'separate', 'organise', 'protect']);
  assert.deepEqual(logic.LEVELS.map((l) => l.fail), [0, 0, 0.02, 0.2, 0.3]);
});

test('rule 3: each control takes off its levels; they add up', () => {
  const st = SC('stairs');
  assert.deepEqual(logic.levelsWith(st, ['replace']), { l: 2, i: 4, s: 8 });
  assert.deepEqual(logic.levelsWith(st, ['separate']), { l: 3, i: 3, s: 9 });
  assert.deepEqual(logic.levelsWith(st, ['organise']), { l: 3, i: 4, s: 12 });
  assert.deepEqual(logic.levelsWith(st, ['protect']), { l: 4, i: 3, s: 12 });
  assert.deepEqual(logic.levelsWith(st, ['organise', 'protect']), { l: 3, i: 3, s: 9 });
  assert.deepEqual(logic.levelsWith(SC('lamp'), ['replace']), { l: 3, i: 2, s: 6 });
  assert.deepEqual(logic.levelsWith(SC('lamp'), ['separate']), { l: 1, i: 4, s: 4 });
  assert.deepEqual(logic.levelsWith(SC('car'), ['replace']), { l: 3, i: 3, s: 9 });
  assert.deepEqual(logic.levelsWith(SC('car'), ['separate']), { l: 1, i: 5, s: 5 });
  assert.deepEqual(logic.levelsWith(SC('door'), ['replace']), { l: 4, i: 2, s: 8 });
  assert.deepEqual(logic.levelsWith(SC('door'), ['separate', 'organise']), { l: 1, i: 4, s: 4 });
});

test('rule 4: the chance of an injury per run doubles with each likelihood level', () => {
  assert.deepEqual(logic.P_RUN, [0, 0.01, 0.02, 0.04, 0.08, 0.16]);
  const s = D({});
  assert.deepEqual(s.scenes.map((x) => x.eHurt0), [16, 8, 8, 16]);
  assert.deepEqual(s.scenes.map((x) => x.eSerious0), [16, 8, 8, 16]);
});

test('rule 6: the expected score on the day sums every combination of forgotten controls', () => {
  // stairs, organise + protect: 0.56·9 + 0.24·12 + 0.14·12 + 0.06·16
  const e = logic.expected(SC('stairs'), ['organise', 'protect']);
  near(e.s, 10.56);
  near(e.p * 200, 9.6);
  near(e.ps * 200, 2.88);
  // a control that never fails gives the paper value
  near(logic.expected(SC('lamp'), ['replace']).s, 6);
  // separate fails 1 in 50: door 0.98·8 + 0.02·16 with separate alone
  near(logic.expected(SC('door'), ['separate']).s, 0.98 * 8 + 0.02 * 16);
  near(logic.expected(SC('car'), ['remove', 'organise']).s, 0);
});

test('rule 6: the day is never below paper; equal when nothing chosen can be forgotten or matters', () => {
  const lv = logic.LEVEL_IDS;
  for (const sc of logic.SCENES) {
    for (let m = 0; m < 32; m++) {
      const chosen = lv.filter((_, j) => m & (1 << j));
      const paper = logic.levelsWith(sc, chosen);
      const e = logic.expected(sc, chosen);
      const ps = paper ? paper.s : 0;
      assert.ok(e.s >= ps - 1e-12, `${sc.id} ${chosen}`);
    }
  }
  assert.ok(logic.expected(SC('stairs'), ['organise']).s > 12, 'organise alone: the day is worse than paper');
  near(logic.expected(SC('stairs'), ['replace']).s, 8, 1e-12, 'replace never fails: day = paper');
  near(logic.expected(SC('car'), ['protect']).s, 15, 1e-12, 'a control that moves no level: day = paper');
});

test('rule 5: a series has 200 runs; the counts add up from the runs', () => {
  for (const pr of logic.presets) for (const sc of logic.derive(pr.params).scenes) {
    assert.equal(sc.runs.length, 200);
    assert.equal(sc.hurt, sc.runs.filter((r) => r.sev > 0).length);
    assert.equal(sc.serious, sc.runs.filter((r) => r.sev >= 4).length);
    assert.equal(sc.forgot, sc.runs.filter((r) => r.miss.length > 0).length);
    for (const r of sc.runs) for (const m of r.miss) assert.ok(sc.chosen.includes(m), 'only a chosen control can be forgotten');
  }
});

test('rule 5: the same seed replays the same runs; adding a control never adds an injury (same draws)', () => {
  const lv = logic.LEVEL_IDS;
  for (const sc of logic.SCENE_IDS) {
    let prev = null;
    for (const add of [[], ['protect'], ['organise', 'protect'], ['separate', 'organise', 'protect'], ['replace', 'separate', 'organise', 'protect']]) {
      const s = sceneOf(D(Object.assign(ON(sc, ...add), { seed: 7 })), sc);
      if (prev) {
        s.runs.forEach((r, k) => {
          if (r.sev) assert.ok(prev.runs[k].sev, `${sc} run ${k}: hurt with more controls but not with fewer`);
          if (r.sev && prev.runs[k].sev) assert.ok(r.sev <= prev.runs[k].sev);
        });
      }
      prev = s;
    }
    void lv;
  }
  assert.deepEqual(D({ seed: 5 }).scenes[0].runs, D({ seed: 5 }).scenes[0].runs);
  assert.notDeepEqual(D({ seed: 5 }).scenes[0].runs, D({ seed: 6 }).scenes[0].runs);
});

test('rule 5: the forgetting draws follow each level\'s chance (over many seeds)', () => {
  let n = 0, org = 0, prot = 0, sep = 0;
  for (let seed = 1; seed <= 99; seed++) {
    const sc = sceneOf(D(Object.assign(ON('stairs', 'separate', 'organise', 'protect'), { seed })), 'stairs');
    for (const r of sc.runs) { n++; if (r.miss.includes('organise')) org++; if (r.miss.includes('protect')) prot++; if (r.miss.includes('separate')) sep++; }
  }
  near(org / n, 0.2, 0.01, 'organise');
  near(prot / n, 0.3, 0.01, 'protect');
  near(sep / n, 0.02, 0.005, 'separate');
});

test('rule 5: injuries over many seeds match the expected count', () => {
  let hurt = 0, serious = 0;
  for (let seed = 1; seed <= 99; seed++) {
    const sc = sceneOf(D(Object.assign(ON('stairs', 'organise', 'protect'), { seed })), 'stairs');
    hurt += sc.hurt; serious += sc.serious;
  }
  near(hurt / 99, 9.6, 0.8, 'hurt');
  near(serious / 99, 2.88, 0.5, 'serious');
});

test('rule 5: the rng is mulberry32, the kit\'s', () => {
  const a = logic.rng(42), b = kit.rng(42);
  for (let k = 0; k < 10; k++) assert.equal(a(), b());
});

test('toggle and nextSeed: the patches', () => {
  assert.deepEqual(logic.toggle(P({}), 'car', 'separate'), { car_separate: true });
  assert.deepEqual(logic.toggle(P({ car_separate: true }), 'car', 'separate'), { car_separate: false });
  assert.equal(logic.toggle(P({}), 'boat', 'separate'), null);
  assert.equal(logic.toggle(P({}), 'car', 'pray'), null);
  assert.deepEqual(logic.nextSeed(P({ seed: 1 })), { seed: 2 });
  assert.deepEqual(logic.nextSeed(P({ seed: 99 })), { seed: 1 });
  assert.deepEqual(logic.nextSeed(P({ seed: 'x' })), { seed: 2 });
  assert.deepEqual(logic.nextSeed(P({ seed: 98 })), { seed: 99 }, '99 is not skipped');
  assert.deepEqual(logic.nextSeed(P({ seed: 2.4 })), { seed: 3 }, 'from the seed as read');
  assert.deepEqual(logic.nextSeed(P({ seed: 150 })), { seed: 2 }, 'out of range reads as 1');
  assert.deepEqual(logic.toggle(P({ car_separate: 'true' }), 'car', 'separate'), { car_separate: true }, 'a param that reads as off switches on');
});

// ── presets (SPEC.md "Presets") ──

const DAY = (pr) => logic.derive(preset(pr)).scenes.map((x) => [x.id, x.s1, Math.round(x.day * 1e4) / 1e4, Math.round(x.kept * 1000) / 1000]);

test('preset none: inherent everywhere', () => {
  assert.deepEqual(DAY('none'), [['stairs', 16, 16, 1], ['lamp', 12, 12, 1], ['car', 15, 15, 1], ['door', 16, 16, 1]]);
  assert.deepEqual(logic.derive(preset('none')).scenes.map((x) => x.hurt), [18, 6, 8, 12]);
});

test('preset lower: only organise and protect keep 60–80 % of the risk on the day', () => {
  assert.deepEqual(DAY('lower'), [['stairs', 9, 10.56, 0.66], ['lamp', 6, 7.26, 0.605], ['car', 10, 11, 0.733], ['door', 12, 12.8, 0.8]]);
  for (const x of logic.derive(preset('lower')).scenes) assert.ok(x.kept > 0.5, `${x.id} keeps most of its risk`);
});

test('preset operator and guard: the door with the operator alone keeps 80 %, with the sensor 31 %', () => {
  const op = sceneOf(logic.derive(preset('operator')), 'door');
  const gd = sceneOf(logic.derive(preset('guard')), 'door');
  assert.equal(logic.derive(preset('operator')).scene, 3);
  assert.equal(op.s1, 12); near(op.day, 12.8); near(op.eHurt, 9.6);
  assert.equal(gd.s1, 4); near(gd.day, 4.96); near(gd.eHurt, 2.544);
  assert.deepEqual([op.hurt, op.serious, gd.hurt, gd.serious], [11, 11, 1, 1]);
});

test('preset upper: everything but removal leaves a little on every scene', () => {
  assert.deepEqual(DAY('upper'), [['stairs', 2, 2.3332, 0.146], ['lamp', 1, 1.3312, 0.111], ['car', 3, 3.072, 0.205], ['door', 2, 2.48, 0.155]]);
  assert.deepEqual(logic.derive(preset('upper')).scenes.map((x) => x.serious), [0, 0, 0, 0]);
});

test('preset remove: nothing stays anywhere', () => {
  for (const x of logic.derive(preset('remove')).scenes) {
    assert.equal(x.removed, true);
    assert.equal(x.day, 0);
    assert.equal(x.hurt, 0);
    assert.equal(x.forgot, 0);
  }
});

test('presets: each sets exactly the controls and the scene SPEC lists', () => {
  const want = {
    none: ['stairs', {}],
    lower: ['stairs', { stairs: ['organise', 'protect'], lamp: ['organise', 'protect'], car: ['organise', 'protect'], door: ['organise', 'protect'] }],
    operator: ['door', { door: ['organise'] }],
    guard: ['door', { door: ['separate', 'organise'] }],
    upper: ['lamp', Object.fromEntries(logic.SCENE_IDS.map((id) => [id, ['replace', 'separate', 'organise', 'protect']]))],
    remove: ['car', Object.fromEntries(logic.SCENE_IDS.map((id) => [id, ['remove']]))]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    assert.equal(x.params.scene, want[x.id][0], x.id);
    for (const id of logic.SCENE_IDS) assert.deepEqual(logic.chosenOf(x.params, id), want[x.id][1][id] || [], `${x.id} ${id}`);
  }
});

// ── generic ──

function* someParams() {
  for (const x of logic.presets) yield x.params;
  for (let seed = 1; seed <= 5; seed++) yield P(Object.assign(ON('car', 'separate', 'protect'), ON('door', 'organise'), { seed }));
  yield P({ scene: 'none', seed: 'x', lamp_remove: 'yes' });
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('lower'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; the page is an explorer', () => {
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    assert.ok(logic.SCENE_IDS.includes(x.params.scene));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const s of logic.SCENE_IDS) {
      for (const pre of ['scene_', 'long_']) assert.ok(strings[lang][pre + s], `${lang} ${pre}${s}`);
      for (const l of logic.LEVEL_IDS) assert.ok(strings[lang]['c_' + s + '_' + l], `${lang} c_${s}_${l}`);
    }
    for (const l of logic.LEVEL_IDS) for (const pre of ['level_', 'fail_']) assert.ok(strings[lang][pre + l], `${lang} ${pre}${l}`);
    for (let i = 1; i <= 5; i++) assert.ok(strings[lang]['sev_' + i], `${lang} sev_${i}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
