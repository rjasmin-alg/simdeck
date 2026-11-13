// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-hearing's model (rules in SPEC.md). Run: node --test sims/set-hearing/
// The "day" tests cover day.js (the day as ordered blocks, catalogue §5.25); they move with it to models/.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const day = require('./day.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const KINDS = logic.KIND_IDS;
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const near = (a, b, eps = 0.01, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} ≈ ${b}`);
/** A day from [kind, len, ear] triples, the rest empty. */
const DAY = (...bs) => day.write(bs.map(([kind, len, flag]) => ({ kind, len, flag: !!flag })));

// ── tie-breaks first ──

test('tie-break (rule 9): 85 exactly is upper, 80 exactly is not over the lower value, 87 exactly is not over the limit', () => {
  assert.equal(logic.actionBand(85), 'upper');
  assert.equal(logic.actionBand(84.999), 'lower');
  assert.equal(logic.actionBand(80), 'below');
  assert.equal(logic.actionBand(80.001), 'lower');
  assert.equal(logic.actionBand(null), 'below');
  assert.equal(logic.limitBand(87), 'under');
  assert.equal(logic.limitBand(87.001), 'over');
  assert.equal(logic.limitBand(null), 'under');
});

test('tie-break (rule 9): a day of exactly 100 % is LEX 85, upper', () => {
  assert.equal(logic.lexOf(100), 85);
  assert.equal(logic.actionBand(logic.lexOf(100)), 'upper');
  assert.equal(logic.derive(P(DAY(['dialogue', 120]))).action, 'below', '70 dB(A): far below');
});

test('tie-break (rule 1): a gap or an unknown kind in the slots never makes a gap in the day', () => {
  const p = P(Object.assign(DAY(['wind', 30], ['dialogue', 60], ['wind', 45]), { k2: 'none', k3: 'dragon' }));
  // slots: wind 30, none, dragon, … → only slot 1; then put a block after the gap
  p.k4 = 'dialogue'; p.t4 = 90;
  const bs = day.blocks(p, KINDS);
  assert.deepEqual(bs.map((b) => [b.i, b.slot, b.kind, b.start, b.end]), [[0, 0, 'wind', 0, 30], [1, 3, 'dialogue', 30, 120]]);
});

test('tie-break (rule 11): the top block is the earliest of equals; −1 for an empty day', () => {
  const s = logic.derive(P(DAY(['dialogue', 60], ['wind', 30], ['wind', 30])));
  assert.equal(s.top, 1);
  assert.equal(logic.derive(P(DAY())).top, -1);
});

test('tie-break (rule 8): announced shots are cut in full whatever the lift; the lift reaches only the background', () => {
  const b0 = logic.derive(P(Object.assign(DAY(['blanks', 30, true]), { lift: 0 }))).blocks[0];
  const b15 = logic.derive(P(Object.assign(DAY(['blanks', 30, true]), { lift: 15 }))).blocks[0];
  assert.equal(b0.shotsEar, b15.shotsEar);
  near(b0.shotsEar, b0.shotsDose * 0.01, 1e-12);
  assert.ok(b15.doseEar > b0.doseEar, 'the lifted background counts more');
  near(b15.doseEar - b15.shotsEar, (b15.dose - b15.shotsDose) * logic.earFactor(true, 15), 1e-12);
});

test('tie-break (rule 3): edits at a bound or on a missing block give null', () => {
  const p = P(DAY(['wind', 15], ['dialogue', 240]));
  assert.equal(logic.bump(p, 0, -1), null);
  assert.equal(logic.bump(p, 1, 1), null);
  assert.equal(logic.bump(p, 2, 1), null);
  assert.equal(logic.remove(p, 2), null);
  assert.equal(logic.remove(p, -1), null);
  assert.equal(logic.toggleEar(p, 5), null);
  assert.equal(logic.toggleEar(p, 2), null, 'one past the last block');
  assert.equal(logic.toggleEar(p, -1), null);
  assert.equal(logic.bump(p, -1, 1), null);
  assert.equal(logic.add(p, 'dragon'), null);
  assert.equal(day.SLOTS, 6);
  let grown = P(DAY());
  for (let n = 0; n < 6; n++) grown = Object.assign({}, grown, logic.add(grown, 'dialogue'));
  assert.equal(logic.derive(grown).blocks.length, 6, 'a day holds six blocks');
  assert.equal(logic.add(grown, 'wind'), null);
  const full = P(DAY(...Array(6).fill(['dialogue', 60])));
  assert.equal(logic.add(full, 'wind'), null);
  assert.equal(logic.derive(full).full, true);
});

// ── day.js: rules 1–3 ──

test('rule 1: blocks run one after the other from the call', () => {
  const bs = day.blocks(P({}), KINDS);
  assert.deepEqual(bs.map((b) => [b.kind, b.start, b.end]), [
    ['dialogue', 0, 120], ['generator', 120, 360], ['wind', 360, 390], ['blanks', 390, 420], ['dialogue', 420, 600]]);
  assert.equal(day.CALL, 420);
});

test('rule 2: lengths round to 15 min and clamp to 15 … 240; not a number is 60', () => {
  assert.equal(day.clampLen(37), 30);
  assert.equal(day.clampLen(38), 45);
  assert.equal(day.clampLen(0), 15);
  assert.equal(day.clampLen(-90), 15);
  assert.equal(day.clampLen(1000), 240);
  assert.equal(day.clampLen(Infinity), 60);
  assert.equal(day.clampLen('x'), 60);
  assert.equal(day.clampLen(undefined), 60);
});

test('rule 3: add appends a 60-min block without defenders after the last one, packed', () => {
  const p = P(Object.assign(DAY(['wind', 30]), { k3: 'dialogue', t3: 45 }));   // a gap at slot 2
  const patch = logic.add(p, 'blanks');
  const bs = day.blocks(Object.assign({}, p, patch), KINDS);
  assert.deepEqual(bs.map((b) => [b.slot, b.kind, b.len, b.flag]), [[0, 'wind', 30, false], [1, 'dialogue', 45, false], [2, 'blanks', 60, false]]);
  assert.equal(patch.k4, 'none');
});

test('rule 3: remove moves the later blocks up and keeps their length and defenders', () => {
  const p = P(DAY(['dialogue', 60], ['wind', 30, true], ['generator', 90]));
  const bs = day.blocks(Object.assign({}, p, logic.remove(p, 0)), KINDS);
  assert.deepEqual(bs.map((b) => [b.kind, b.len, b.flag, b.start]), [['wind', 30, true, 0], ['generator', 90, false, 30]]);
});

test('rule 3: − / + change one block by 15 min; the defenders button switches one block', () => {
  const p = P(DAY(['dialogue', 60], ['wind', 30]));
  assert.equal(logic.bump(p, 1, 1).t2, 45);
  assert.equal(logic.bump(p, 1, -1).t2, 15);
  assert.equal(logic.bump(p, 1, 1).t1, 60);
  const q = logic.toggleEar(p, 1);
  assert.equal(q.e2, true);
  assert.equal(q.e1, false);
  assert.equal(logic.toggleEar(Object.assign({}, p, q), 1).e2, false);
});

// ── the noise: rules 4–10 ──

test('rule 4: 3 dB more doubles the dose and halves the time to a full dose', () => {
  near(logic.dosePct(85, 480), 100, 1e-9);
  near(logic.dosePct(88, 480) / logic.dosePct(85, 480), 2, 0.01);
  near(logic.dosePct(10 * Math.log10(2) + 85, 480), 200, 1e-9);
  for (const [L, min] of [[85, 480], [88, 240], [91, 120], [94, 60], [97, 30], [100, 15]]) near(logic.allowedMin(L), min, min * 0.02, `at ${L}`);
  near(logic.levelOf(logic.dosePct(91, 37), 37), 91, 1e-9);
  assert.equal(logic.levelOf(0, 60), null);
});

test('rule 5: the doses add up; LEX,8h is the day over a nominal 8 h; 10 h at 85 is over 100 %', () => {
  const s = D({});
  near(s.dose, s.blocks.reduce((a, b) => a + b.dose, 0), 1e-9);
  near(logic.lexOf(125), 85 + 10 * Math.log10(1.25), 1e-12);
  near(logic.dosePct(85, 600), 125, 1e-9);
  const empty = logic.derive(P(DAY()));
  assert.deepEqual([empty.dose, empty.lex, empty.lexEar, empty.action, empty.limit, empty.len], [0, null, null, 'below', 'under', 0]);
});

test('rule 6: the generator loses about 6 dB, a quarter of its energy, with each doubling of the distance', () => {
  near(logic.genLevel(5), 91, 1e-12);
  near(logic.genLevel(10), 84.98, 0.01);
  near(logic.genLevel(40), 72.94, 0.01);
  const g = (dist) => logic.derive(P(Object.assign(DAY(['generator', 240]), { dist }))).blocks[0].dose;
  near(g(10) / g(5), 0.25, 1e-9);
  near(g(40) / g(20), 0.25, 1e-9);
  assert.equal(logic.derive(P({ dist: 7 })).dist, 5, 'not a listed distance → 5 m');
  assert.deepEqual(logic.DISTANCES, [5, 10, 20, 40]);
  near(D({ dist: 20 }).blocks[1].base, 78.96, 0.01, 'base: the generator\'s level at its distance');
  near(D({ dist: 20 }).genLevel, 78.96, 0.01);
  // the other kinds do not move with the generator
  assert.equal(D({ dist: 40 }).blocks[2].dose, D({}).blocks[2].dose);
});

test('rule 7: defenders cut 20 dB only while worn; a lift of 5 or 15 min an hour leaves about 10 or 6 dB', () => {
  assert.equal(logic.earFactor(false, 15), 1);
  near(logic.cutOf(0), 20, 1e-9);
  near(logic.cutOf(5), 10.34, 0.01);
  near(logic.cutOf(15), 5.89, 0.01);
  const b = (e, lift) => logic.derive(P(Object.assign(DAY(['wind', 60, e]), { lift }))).blocks[0];
  near(b(true, 0).levelEar, 77, 1e-9);
  assert.equal(b(true, 0).ear, true);
  assert.equal(b(false, 0).ear, false);
  near(b(true, 0).allowed, logic.allowedMin(77), 1e-9, 'the time to a full dose is at the level at the ear');
  near(b(false, 0).allowed, logic.allowedMin(97), 1e-9);
  assert.equal(b(true, 0).base, 97);
  assert.equal(b(false, 15).doseEar, b(false, 15).dose, 'no defenders: the lift changes nothing');
  assert.equal(logic.derive(P({ lift: 7 })).lift, 0, 'not a listed lift → 0');
  assert.deepEqual(logic.LIFTS, [0, 5, 15]);
});

test('rule 8: a blank-firing block is its background plus 6 shots a take, each 1 s at 115 dB(A)', () => {
  const b = logic.derive(P(DAY(['blanks', 30]))).blocks[0];
  assert.equal(b.shots, 12);
  near(b.shotsDose, 12 * 100 * 1000 / 28800, 1e-9);
  near(b.dose - b.shotsDose, logic.dosePct(75, 30), 1e-12);
  near(b.level, 93.3, 0.01);
});

test('rule 9: the action values read the day without defenders; the limit reads it at the ear', () => {
  const s = D(preset('defenders'));
  assert.equal(s.action, 'upper');
  assert.equal(s.limit, 'under');
  assert.equal(D({}).limit, 'over');
});

test('rule 10: the curve climbs to the day\'s totals, a point at each block end and a jump in each take', () => {
  const s = D({});
  const last = s.curve[s.curve.length - 1];
  near(last.u, s.dose, 1e-9);
  near(last.e, s.doseEar, 1e-9);
  assert.equal(last.m, 600);
  for (let i = 1; i < s.curve.length; i++) {
    assert.ok(s.curve[i].m >= s.curve[i - 1].m && s.curve[i].u >= s.curve[i - 1].u && s.curve[i].e >= s.curve[i - 1].e);
  }
  // blanks 390–420: two takes, jumps at 397.5 and 412.5
  const jumps = s.curve.filter((pt, i) => i && pt.m === s.curve[i - 1].m).map((pt) => pt.m);
  assert.deepEqual(jumps, [397.5, 412.5]);
  const at = (m) => s.curve.filter((pt) => pt.m === m);
  near(at(397.5)[1].u - at(397.5)[0].u, s.blocks[3].shotsDose / 2, 1e-9);
  assert.equal(logic.curve([]).length, 1);
});

test('rule 10: with defenders the solid line (at the ear) climbs less than the dashed one, and its jumps are the cut shots', () => {
  const s = D(Object.assign({}, preset('lifted')));
  const last = s.curve[s.curve.length - 1];
  near(last.u, s.dose, 1e-9);
  near(last.e, s.doseEar, 1e-9);
  assert.ok(last.e < last.u / 5);
  const b = s.blocks[3];                       // blanks 390–420 with defenders, lift 5
  const at = (m) => s.curve.filter((pt) => pt.m === m);
  near(at(397.5)[1].e - at(397.5)[0].e, b.shotsEar / 2, 1e-12);
  near(at(397.5)[1].u - at(397.5)[0].u, b.shotsDose / 2, 1e-12);
  const before = s.curve.find((pt) => pt.m === 390), after = s.curve.find((pt) => pt.m === 420 && pt !== at(412.5)[1]);
  near(after.e - before.e, b.doseEar, 1e-9);
  near(after.u - before.u, b.dose, 1e-9);
  const g = s.curve.find((pt) => pt.m === 360), d0 = s.curve.find((pt) => pt.m === 120);
  near(g.e - d0.e, s.blocks[1].doseEar, 1e-9);
});

test('rule 11: the top block is the one with the most dose at the ear', () => {
  assert.equal(D({}).top, 1);
  assert.equal(D(preset('far')).top, 2);
  assert.equal(D(preset('practice')).top, 1);
  // the wind machine has the most energy, but with defenders on it the dialogue reaches the ear most
  assert.equal(logic.derive(P(DAY(['wind', 30, true], ['dialogue', 240]))).top, 1);
});

// ── presets (SPEC.md table) ──

const totals = (s) => [s.dose, s.lex, s.doseEar, s.lexEar];
function expectTotals(id, [d, l, de, le], action, limit) {
  const s = D(preset(id));
  const [a, b, c, e] = totals(s);
  near(a, d, 0.05, id + ' dose'); near(b, l, 0.005, id + ' lex'); near(c, de, 0.05, id + ' doseEar'); near(e, le, 0.005, id + ' lexEar');
  assert.equal(s.action, action, id);
  assert.equal(s.limit, limit, id);
  return s;
}

test('preset noisy: 342 % and 90.35 dB(A), over the limit; the generator is the top', () => {
  const s = expectTotals('noisy', [342.4, 90.35, 342.4, 90.35], 'upper', 'over');
  near(s.blocks[1].dose, 199.05, 0.01);
  near(s.blocks[2].dose, 99.06, 0.01);
  near(s.blocks[3].dose, 42.29, 0.01);
  near(s.blocks[2].allowed, 30.3, 0.1);
  assert.equal(s.len, 600);
});

test('preset blanks: 12 shots carry most of a quiet day\'s dose', () => {
  const s = expectTotals('blanks', [45.5, 81.58, 45.5, 81.58], 'lower', 'under');
  near(s.blocks[1].shotsDose / s.dose, 0.916, 0.002);
  assert.ok(s.blocks[1].shotsDose > 10 * (s.blocks[0].dose + s.blocks[2].dose));
});

test('preset defenders: upper without them, 5.4 % at the ear', () => {
  expectTotals('defenders', [342.4, 90.35, 5.4, 72.31], 'upper', 'under');
});

test('preset lifted: 5 min an hour off and the dose at the ear is 30 %', () => {
  const s = expectTotals('lifted', [342.4, 90.35, 30.0, 79.77], 'upper', 'under');
  near(s.blocks[1].doseEar, 18.41, 0.01);
  near(s.blocks[2].doseEar, 9.16, 0.01);
  near(s.blocks[3].doseEar, 0.47, 0.01);
});

test('preset far: the generator at 40 m falls to 3 %; the wind machine is now the top', () => {
  const s = expectTotals('far', [146.4, 86.66, 146.4, 86.66], 'upper', 'under');
  near(s.blocks[1].dose, 3.11, 0.01);
  near(s.genLevel, 72.94, 0.01);
});

test('preset practice: far and defenders for the wind machine and the shots', () => {
  expectTotals('practice', [146.4, 86.66, 6.5, 73.13], 'upper', 'under');
});

// ── generic checks every sim keeps ──

function* someParams() {
  for (const x of logic.presets) yield x.params;
  for (const dist of logic.DISTANCES) for (const lift of logic.LIFTS) {
    yield P(Object.assign(DAY(['blanks', 240, true], ['wind', 15], ['generator', 45, true]), { dist, lift }));
  }
  yield P(DAY());
  yield P({ k3: 'none', t1: 'x', e2: 'yes' });
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('lifted'));
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
    assert.ok(logic.DISTANCES.includes(x.params.dist));
    assert.ok(logic.LIFTS.includes(x.params.lift));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const k of KINDS) for (const pre of ['kind_', 'add_', 'letter_']) assert.ok(strings[lang][pre + k], `${lang} ${pre}${k}`);
    for (const b of ['below', 'lower', 'upper']) assert.ok(strings[lang]['act_' + b], `${lang} act_${b}`);
    for (const b of ['under', 'over']) assert.ok(strings[lang]['lim_' + b], `${lang} lim_${b}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="day.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'day.js before sim.js');
});
