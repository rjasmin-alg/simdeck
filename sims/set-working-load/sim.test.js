// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-working-load's model (rules in SPEC.md). Run: node --test sims/set-working-load/
// The "rigging" block covers rigging.js (line tension, the jolt of a drop, the chain) and moves with it to models/.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const rg = require('./rigging.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < (eps || 1e-9), `${msg || ''} ${a} ≈ ${b}`);
const kg = (n) => n / rg.G;
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const DP = (id, over) => logic.derive(Object.assign({}, preset(id), over || {}));

// ── tie-breaks first ──

test('tie-break (rule 3): a drop of 0 is lowered gently, factor exactly 1, not 2', () => {
  assert.equal(rg.dropFactor(0, 0.002), 1);
  assert.equal(rg.dropFactor(-0.01, 0.002), 1, 'no negative drop');
  assert.ok(rg.dropFactor(1e-6, 0.002) > 2, 'the smallest drop already doubles it');
  assert.equal(D({ drop: 0 }).factor, 1);
  near(D({ drop: 0 }).tPeak, D({ drop: 0 }).tStatic);
  near(rg.catchDistance(0, 0.002), 0.002, 1e-12, 'at rest: the static stretch');
});

test('tie-break (rule 5): exactly at the WLL is within it; exactly at the breaking strength holds', () => {
  assert.equal(rg.lineState(100, 100, 500), 'ok');
  assert.equal(rg.lineState(100 + 1e-12, 100, 500), 'ok', 'within EPS counts as equal');
  assert.equal(rg.lineState(100.001, 100, 500), 'over');
  assert.equal(rg.lineState(500, 100, 500), 'over');
  assert.equal(rg.lineState(500 + 1e-12, 100, 500), 'over', 'within EPS holds');
  assert.equal(rg.lineState(500.001, 100, 500), 'breaks');
  assert.equal(rg.lineState(100, null, 100), 'unrated', 'at its breaking strength an unrated piece holds');
  assert.equal(rg.lineState(100.001, null, 100), 'breaks', 'breaking comes before unrated');
});

test('tie-break (rule 4): equal pieces, the first from the top is the weakest', () => {
  const c = rg.chain([{ wll: 100, breaking: 500 }, { wll: 100, breaking: 500 }, { wll: 100, breaking: 500 }]);
  assert.equal(c.weakest, 0);
  assert.equal(c.weakestLabel, 0);
  const c2 = rg.chain([{ wll: 200, breaking: 900 }, { wll: 100, breaking: 500 }, { wll: 100 - 1e-12, breaking: 500 - 1e-12 }]);
  assert.equal(c2.weakest, 1, 'within EPS counts as equal');
  assert.equal(c2.weakestLabel, 1);
  const c3 = rg.chain([{ wll: 50, breaking: 900 }, { wll: null, breaking: 300 }, { wll: null, breaking: 300 }]);
  assert.equal(c3.weakestLabel, 1, 'the first unrated piece, ahead of any rated one');
  assert.equal(c3.weakest, 1);
});

// ── rules of the shared model (rigging.js) ──

test('rule 1: weight is m·g with g = 9.81', () => {
  assert.equal(rg.G, 9.81);
  near(rg.weight(20), 196.2);
});

test('rule 2: line tension: one line the weight; two lines W/(2·cos(θ/2)), the whole weight each at 120°', () => {
  near(rg.lineTension(100, 1, 120), 100, 1e-12, 'one line ignores the angle');
  near(rg.lineTension(100, 2, 0), 50, 1e-12);
  near(rg.lineTension(100, 2, 60), 100 / Math.sqrt(3), 1e-9);
  near(rg.lineTension(100, 2, 120), 100, 1e-9);
  near(rg.lineTension(100, 2, 150), 193.185, 1e-3);
  near(rg.lineTension(100, 2, 160), 287.939, 1e-3);
  // more than half whenever the lines spread, rising with the angle
  let last = 50;
  for (let a = 5; a <= 160; a += 5) {
    const t = rg.lineTension(100, 2, a);
    assert.ok(t > last, `${a}° pulls more than ${a - 5}°`);
    last = t;
  }
});

test('rule 3: catch stiffness n·k·cos²(θ/2); the drop factor from the energy balance', () => {
  near(rg.catchStiffness(1000, 1, 90), 1000, 1e-9, 'one line ignores the angle');
  near(rg.catchStiffness(1000, 2, 0), 2000, 1e-9);
  near(rg.catchStiffness(1000, 2, 120), 500, 1e-9);
  // energy: W·(d + x) = ½·K·x² at the bottom of the catch, with x = δ·factor and K = W/δ
  for (const [d, s] of [[0.1, 0.002], [0.05, 0.01], [0.2, 0.0005]]) {
    const f = rg.dropFactor(d, s), x = s * f, W = 1, Kv = W / s;
    near(W * (d + x), 0.5 * Kv * x * x, 1e-9, `energy d=${d}`);
    near(rg.catchDistance(d, s), x, 1e-12);
  }
  assert.ok(rg.dropFactor(0.1, 0.001) > rg.dropFactor(0.1, 0.004), 'a stiffer catch jolts harder');
  assert.ok(rg.dropFactor(0.2, 0.002) > rg.dropFactor(0.1, 0.002), 'a longer drop jolts harder');
});

test('rule 4: a chain: the least WLL, the least breaking strength; none if any piece has none', () => {
  const c = rg.chain([{ wll: 150, breaking: 750 }, { wll: 100, breaking: 200 }, { wll: 250, breaking: 1250 }]);
  assert.equal(c.wll, 100);
  assert.equal(c.breaking, 200);
  assert.equal(c.weakest, 1);
  const d = rg.chain([{ wll: 150, breaking: 750 }, { wll: 100, breaking: 500 }, { wll: 25, breaking: 125 }]);
  assert.equal(d.wll, 25);
  assert.equal(d.weakest, 2);
  assert.equal(d.weakestLabel, 2);
  // the marking and the strength can point at different pieces
  const e = rg.chain([{ wll: 50, breaking: 900 }, { wll: 100, breaking: 200 }]);
  assert.equal(e.weakestLabel, 0);
  assert.equal(e.weakest, 1);
  const f = rg.chain([{ wll: null, breaking: 100 }, { wll: 100, breaking: 500 }]);
  assert.equal(f.wll, null, 'first piece unrated');
  const g = rg.chain([{ wll: 100, breaking: 500 }, { wll: null, breaking: 100 }]);
  assert.equal(g.wll, null, 'a later piece unrated');
});

test('rule 5: states in order: breaks, unrated, over, ok', () => {
  assert.equal(rg.lineState(50, 100, 500), 'ok');
  assert.equal(rg.lineState(150, 100, 500), 'over');
  assert.equal(rg.lineState(600, 100, 500), 'breaks');
  assert.equal(rg.lineState(50, null, 100), 'unrated');
  assert.equal(rg.lineState(150, null, 100), 'breaks');
});

// ── rules of the lamp and its lines (sim.js) ──

test('rule 6: lamps, pieces, safety factor 5, stiffness 100 kN/m', () => {
  assert.deepEqual(logic.LAMP_IDS.map((x) => logic.LAMPS[x].m), [10, 20, 35]);
  assert.equal(logic.SF, 5);
  assert.equal(logic.K, 100000);
  const pcs = logic.piecesOf('rated', true);
  assert.deepEqual(pcs.map((x) => x.id), ['clamp', 'sling', 'shackle']);
  assert.deepEqual(pcs.map((x) => Math.round(kg(x.wll))), [150, 100, 250]);
  assert.deepEqual(pcs.map((x) => Math.round(kg(x.breaking))), [750, 500, 1250]);
  pcs.forEach((x) => near(x.breaking, 5 * x.wll, 1e-9));
});

test('rule 7: the weaker link goes into line A only; the worn sling keeps its marking', () => {
  const small = logic.piecesOf('small', true);
  assert.equal(small[2].id, 'smallShackle');
  assert.equal(small[2].swapped, true);
  near(kg(small[2].wll), 25, 1e-9);
  near(kg(small[2].breaking), 125, 1e-9);
  const worn = logic.piecesOf('worn', true);
  assert.equal(worn[1].id, 'wornSling');
  near(kg(worn[1].wll), 100, 1e-9, 'still marked 100 kg');
  near(kg(worn[1].breaking), 200, 1e-9, '40 % of a new one');
  const hook = logic.piecesOf('unrated', true);
  assert.equal(hook[2].id, 'hook');
  assert.equal(hook[2].wll, null);
  for (const link of logic.LINK_IDS) {
    assert.deepEqual(logic.piecesOf(link, false), logic.piecesOf('rated', true), `${link}: line B is all rated`);
  }
  const two = D({ lines: 'two', link: 'worn' });
  assert.equal(two.lines[0].pieces[1].id, 'wornSling');
  assert.equal(two.lines[1].pieces[1].id, 'sling');
  assert.equal(two.lines[0].pieces.filter((x) => x.swapped).length, 1);
});

test('rule 8: params are cleaned', () => {
  const q = logic.clean({ lamp: 'x', lines: 3, angle: 999, drop: -4, link: 'nope' });
  assert.deepEqual(q, Object.assign({}, logic.defaults, { angle: 160, drop: 0 }));
  assert.equal(logic.clean({ angle: 62 }).angle, 60);
  assert.equal(logic.clean({ angle: 63 }).angle, 65);
  assert.equal(logic.clean({ drop: 7.4 }).drop, 7);
  assert.equal(logic.clean({ drop: 'x' }).drop, 0);
  assert.equal(logic.clean({ angle: 'x' }).angle, 60, 'not a number: the default, not the minimum');
  for (const k of ['toString', 'constructor', '__proto__']) {
    assert.equal(logic.clean({ lamp: k }).lamp, 'l5', `inherited key ${k}`);
    assert.equal(logic.clean({ link: k }).link, 'rated');
  }
  assert.ok(isFinite(D({ lamp: 'toString' }).tPeak));
  assert.equal(logic.clean({ lines: 'two' }).lines, 'two');
});

test('rule 9: the pull: at rest by the angle, times the drop factor; one line ignores the angle', () => {
  near(kg(D({}).tPeak), 20, 1e-9);
  near(D({ angle: 150 }).tPeak, D({ angle: 0 }).tPeak, 1e-9, 'one line: the angle does not apply');
  assert.equal(D({ angle: 150 }).angle, 0);
  near(kg(D({ lines: 'two', angle: 0 }).tPeak), 10, 1e-9);
  near(kg(D({ lines: 'two', angle: 60 }).tPeak), 11.547, 1e-3);
  const s = D({ drop: 10 });
  near(s.stretch * 1000, 1.962, 1e-9);
  near(s.factor, 1 + Math.sqrt(1 + 200 / 1.962), 1e-9);
  near(s.tPeak, s.tStatic * s.factor, 1e-9);
  near(s.stopIn * 1000, 21.87, 0.005);
  // two lines catch softer: each at rest carries the whole lamp at 120°, but the pair stretches twice as far
  const t = D({ lines: 'two', angle: 120, drop: 10 });
  near(t.stiff, 50000, 1e-6);
  near(kg(t.tPeak), 164.18, 0.005);
  near(t.lines[0].force, t.lines[1].force, 1e-12, 'both lines of a pair pull the same');
  // the stretch is the lamp's weight over the vertical stiffness, not a line's pull over it (60°: T ≠ W)
  const u = D({ lines: 'two', angle: 60, drop: 10 });
  near(u.stretch * 1000, 1.308, 0.0005);
  near(u.factor, 13.406, 0.0005);
  near(kg(u.tPeak), 154.80, 0.005);
  assert.equal(D({}).lamp.m, 20);
  assert.equal(D({ lamp: 'l10' }).lamp.m, 35);
});

test('rule 10: each line: share of the WLL, margin to breaking, state; the lamp falls when a line breaks', () => {
  const s = D({});
  assert.equal(s.lines.length, 1);
  near(s.lines[0].share, 0.2, 1e-9);
  near(s.lines[0].margin, 25, 1e-9);
  assert.equal(s.lines[0].state, 'ok');
  assert.equal(s.falls, false);
  const u = D({ link: 'unrated' });
  assert.equal(u.lines[0].share, null);
  assert.equal(u.lines[0].state, 'unrated');
  assert.equal(u.falls, false);
  const b = D({ lines: 'two', angle: 120, link: 'unrated', drop: 3 });
  assert.equal(b.lines[0].state, 'breaks');
  assert.equal(b.lines[1].state, 'over');
  assert.equal(b.falls, true, 'one broken line is enough');
});

// ── presets: SPEC.md's table ──

test('preset single: 20 of 100 kg, breaks at 500, margin ×25', () => {
  const s = DP('single'), l = s.lines[0];
  near(kg(l.force), 20, 1e-9);
  near(kg(l.wll), 100, 1e-9);
  near(kg(l.breaking), 500, 1e-9);
  assert.equal(l.weakest, 1, 'the sling');
  assert.equal(l.state, 'ok');
  assert.deepEqual(preset('single'), logic.defaults);
});

test('preset angle: two lines at 120°, the whole lamp on each; 60° and 150° around it', () => {
  const s = DP('angle');
  assert.equal(s.lines.length, 2);
  s.lines.forEach((l) => { near(kg(l.force), 20, 1e-9); assert.equal(l.state, 'ok'); });
  near(kg(DP('angle', { angle: 60 }).tPeak), 11.55, 0.005);
  near(kg(DP('angle', { angle: 150 }).tPeak), 38.64, 0.005);
});

test('preset drop: 10 cm: factor 11.15, 222.92 kg, over the WLL but holding', () => {
  const s = DP('drop'), l = s.lines[0];
  near(s.factor, 11.146, 0.0005);
  near(kg(l.force), 222.92, 0.005);
  near(l.share, 2.229, 0.0005);
  near(l.margin, 2.243, 0.0005);
  assert.equal(l.state, 'over');
  assert.equal(s.falls, false);
  near(kg(DP('drop', { drop: 5 }).tPeak), 164.18, 0.005);
  near(kg(DP('drop', { drop: 20 }).tPeak), 306.27, 0.005);
});

test('preset small: line A breaks at the small shackle; without the drop it holds', () => {
  const s = DP('small'), l = s.lines[0];
  near(kg(l.force), 164.18, 0.005);
  near(kg(l.breaking), 125, 1e-9);
  assert.equal(l.weakest, 2);
  assert.equal(l.weakestLabel, 2);
  assert.equal(l.state, 'breaks');
  assert.equal(s.falls, true);
  const q = DP('small', { drop: 0 }).lines[0];
  near(q.share, 0.8, 1e-9);
  assert.equal(q.state, 'ok');
});

test('preset worn: line A breaks at the worn sling, still marked 100 kg; a new one holds', () => {
  const s = DP('worn'), l = s.lines[0];
  near(kg(l.force), 222.92, 0.005);
  near(kg(l.breaking), 200, 1e-9);
  near(kg(l.wll), 100, 1e-9);
  assert.equal(l.pieces[l.weakest].id, 'wornSling');
  assert.equal(l.state, 'breaks');
  assert.equal(DP('worn', { link: 'rated' }).lines[0].state, 'over');
});

test('preset wide: the 10 kW lamp on two lines at 150°: 67.61 kg each; 160° goes over on both', () => {
  const s = DP('wide');
  near(kg(s.tPeak), 67.61, 0.005);
  near(s.lines[0].margin, 7.395, 0.001);
  s.lines.forEach((l) => assert.equal(l.state, 'ok'));
  const w = DP('wide', { angle: 160 });
  near(kg(w.tPeak), 100.78, 0.005);
  w.lines.forEach((l) => assert.equal(l.state, 'over'));
});

test('other numbers: the 2 kW lamp dropping 10 cm jolts by 15.31; the hook with 3 cm breaks', () => {
  const s = D({ lamp: 'l2', drop: 10 });
  near(s.factor, 15.313, 0.0005);
  near(kg(s.tPeak), 153.13, 0.005);
  const h = D({ link: 'unrated', drop: 3 });
  near(kg(h.tPeak), 132.39, 0.005);
  assert.equal(h.lines[0].state, 'breaks');
});

test('presets match SPEC.md: their params, in order', () => {
  assert.deepEqual(logic.presets.map((x) => x.id), ['single', 'angle', 'drop', 'small', 'worn', 'wide']);
  const want = {
    single: {}, angle: { lines: 'two', angle: 120 }, drop: { drop: 10 }, small: { link: 'small', drop: 5 },
    worn: { link: 'worn', drop: 10 }, wide: { lamp: 'l10', lines: 'two', angle: 150 }
  };
  for (const x of logic.presets) assert.deepEqual(x.params, P(want[x.id]), x.id);
});

// ── generic checks every sim keeps ──

/** A spread of params: every choice, and every preset. */
function* someParams() {
  for (const lamp of logic.LAMP_IDS) for (const lines of ['one', 'two']) for (const link of logic.LINK_IDS)
    for (const angle of [0, 60, 120, 160]) for (const drop of [0, 1, 10, 20]) yield P({ lamp, lines, link, angle, drop });
  for (const x of logic.presets) yield x.params;
}

test('state is JSON-safe, and finite over the whole spread', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.ok(isFinite(s.tPeak) && s.tPeak > 0 && s.factor >= 1);
    assert.equal(s.lines.length, p.lines === 'two' ? 2 : 1);
    s.lines.forEach((l) => assert.ok(['ok', 'over', 'unrated', 'breaks'].includes(l.state)));
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ lines: 'two', link: 'worn', drop: 7 });
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
    assert.deepEqual(logic.clean(x.params), x.params, x.id + ' is already clean');
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const id of logic.LAMP_IDS) assert.ok(strings[lang]['lamp_' + id], `${lang} lamp_${id}`);
    for (const id of logic.LINK_IDS) assert.ok(strings[lang]['link_' + id], `${lang} link_${id}`);
    for (const x of ['clamp', 'sling', 'shackle', 'smallShackle', 'wornSling', 'hook']) {
      assert.ok(strings[lang]['piece_' + x], `${lang} piece_${x}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.ok(html.indexOf('<script src="rigging.js"></script>') < html.indexOf('<script src="sim.js"></script>'), 'rigging.js before sim.js');
});
