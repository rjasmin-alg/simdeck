// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the live-migration (pre-copy) model. Run: node --test sims/lnx-live-migration/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the grid, the captions,
// then the generic block.
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
const run = (over) => logic.migrate(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id, over) => logic.initial(P(Object.assign({}, preset(id).params, over)));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≉ ${b}`);

// ── tie-breaks (rule 7, and rule 3 before rule 5) ──

test('tie-break: remaining exactly at the limit stops (≤)', () => {
  // D ≥ B, so round 0 dirties the whole working set W = 300 MiB; 300 MiB / 1000 MiB/s = 300 ms = the limit.
  const m = run({ bwMiBs: 1000, dirtyMiBs: 1500, wssMiB: 300, downtimeMs: 300 });
  assert.equal(m.outcome, 'converged');
  assert.equal(m.rounds.length, 1);
  near(m.downtimeMs, 300, 1e-9);
  // one MiB more and it does not fit: every round resends 301 MiB until forced
  const over = run({ bwMiBs: 1000, dirtyMiBs: 1500, wssMiB: 301, downtimeMs: 300 });
  assert.equal(over.outcome, 'forced');
  assert.equal(over.rounds.length, 30);
  assert.ok(logic.fits(300, 1000, 300));
  assert.ok(!logic.fits(300.001, 1000, 300));
});

test('tie-break: round 0 never stops early, however fast the link', () => {
  const m = run({ memGiB: 1, bwMiBs: 2000, dirtyMiBs: 0, downtimeMs: 2000 });   // 1024 / 2000 = 0.51 s < 2 s
  assert.equal(m.rounds.length, 1);
  assert.equal(m.rounds[0].sentMiB, 1024);
  near(m.rounds[0].seconds, 0.512, 1e-12);
  assert.equal(m.downtimeMs, 0);
  assert.equal(m.outcome, 'converged');
});

test('tie-break: if the rest fits after the last allowed round, the outcome is converged, not forced', () => {
  // 1gbe-quiet needs rounds 0–5 (6 rounds); with R = 5 round 5 is not allowed → forced with 43.7 MiB
  const m = run({ maxRounds: 5, bwMiBs: 110, dirtyMiBs: 50 });
  assert.equal(m.outcome, 'forced');
  assert.equal(m.rounds.length, 5);
  near(m.remainingMiB, 43.71, 0.01);
  const ok = run({ maxRounds: 6, bwMiBs: 110, dirtyMiBs: 50 });
  assert.equal(ok.outcome, 'converged');
  assert.equal(ok.rounds.length, 6);
  // R = 2 (below the slider's range, the model allows it): after rounds 0 and 1 both tests apply; rule 3 wins
  const two = run({ maxRounds: 2, bwMiBs: 1000, dirtyMiBs: 100 });
  assert.equal(two.outcome, 'converged');
  assert.equal(two.rounds.length, 2);
});

// ── rule 1: round 0 sends all of M in M / B ──

test('rule 1: round 0 copies all guest memory while the guest runs; time M / B', () => {
  const m = run({ memGiB: 8, bwMiBs: 500 });
  assert.equal(m.rounds[0].i, 0);
  assert.equal(m.rounds[0].sentMiB, 8192);
  near(m.rounds[0].seconds, 16.384, 1e-12);
  assert.equal(m.rounds[0].throttlePct, 0);
});

// ── rule 2: dirtying D·T, capped at W; the next round resends it ──

test('rule 2: a round of T s dirties D·T MiB, capped at the working set; the next round sends exactly that', () => {
  const m = run({ bwMiBs: 1000, dirtyMiBs: 100 });
  near(m.rounds[0].dirtiedMiB, 409.6, 1e-9);   // 100 · 4.096, under W
  assert.equal(m.rounds[1].sentMiB, m.rounds[0].dirtiedMiB);
  near(m.rounds[1].seconds, 0.4096, 1e-12);
  const capped = run({ bwMiBs: 110, dirtyMiBs: 100 });
  assert.equal(capped.rounds[0].dirtiedMiB, 1024);   // 100 · 37.2 s = 3724, capped at W = 1024
  for (let i = 1; i < capped.rounds.length; i++) assert.equal(capped.rounds[i].sentMiB, capped.rounds[i - 1].dirtiedMiB);
});

test('rule 2: the working set is clamped to the guest memory', () => {
  const m = run({ memGiB: 1, wssMiB: 8192, bwMiBs: 100, dirtyMiBs: 1000 });
  assert.equal(m.wssMiB, 1024);
  assert.equal(m.rounds[0].dirtiedMiB, 1024);
});

// ── rule 3: stop-and-copy when remaining / B ≤ L ──

test('rule 3: before a round after round 0, a remainder within the limit pauses the guest; downtime = remaining / B', () => {
  const m = run({ bwMiBs: 1000, dirtyMiBs: 100 });
  assert.equal(m.outcome, 'converged');
  assert.equal(m.rounds.length, 2);
  near(m.remainingMiB, 40.96, 1e-9);
  near(m.downtimeMs, 40.96, 1e-9);
  // a larger limit stops one round earlier: 409.6 MiB / 1000 = 410 ms
  const lax = run({ bwMiBs: 1000, dirtyMiBs: 100, downtimeMs: 410 });
  assert.equal(lax.rounds.length, 1);
  near(lax.downtimeMs, 409.6, 1e-9);
  near(lax.limitMiB, 410, 1e-12);
});

// ── rule 4: shrinking needs D < B ──

test('rule 4: with D < B every round after the cap is D/B of the one before; with D ≥ B every round resends W', () => {
  const m = run({ bwMiBs: 110, dirtyMiBs: 100 });
  for (let i = 2; i < m.rounds.length; i++) near(m.rounds[i].sentMiB / m.rounds[i - 1].sentMiB, 100 / 110, 1e-9, `round ${i}`);
  for (const d of [110, 150, 1500]) {
    const f = run({ bwMiBs: 110, dirtyMiBs: d });
    assert.equal(f.outcome, 'forced', `D ${d}`);
    for (let i = 1; i < f.rounds.length; i++) assert.equal(f.rounds[i].sentMiB, 1024, `D ${d} round ${i}`);
  }
  assert.equal(run({ bwMiBs: 110, dirtyMiBs: 109 }).rounds[2].sentMiB < 1024, true);
});

// ── rule 5: forced after maxRounds ──

test('rule 5: after maxRounds rounds the guest is paused whatever the downtime', () => {
  for (const R of [5, 12, 50]) {
    const m = run({ bwMiBs: 110, dirtyMiBs: 150, maxRounds: R });
    assert.equal(m.outcome, 'forced');
    assert.equal(m.rounds.length, R);
    near(m.downtimeMs, 1024 / 110 * 1000, 1e-6);
  }
});

// ── rule 6: auto-converge ──

test('rule 6: auto-converge throttles 20 % from round 2, then +10 % per round, at most 99 %', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9, 10, 11, 12, 40].map((i) => logic.throttleAt(i, true)), [0, 0, 20, 30, 40, 90, 99, 99, 99, 99]);
  assert.deepEqual([0, 2, 9].map((i) => logic.throttleAt(i, false)), [0, 0, 0]);
  const m = run({ bwMiBs: 110, dirtyMiBs: 150, autoConverge: true });
  assert.deepEqual(m.rounds.map((r) => r.throttlePct), [0, 0, 20, 30, 40, 50, 60, 70, 80, 90]);
  // round 3 runs 1024 MiB / 110 s at 70 % of 150 MiB/s: 105 · 9.309 = 977.5 MiB
  near(m.rounds[3].dirtiedMiB, 105 * 1024 / 110, 1e-9);
  assert.equal(m.throttlePct, 90);
});

// ── presets (SPEC.md table) ──

test('presets: rounds, outcome, downtime and total time as in SPEC.md', () => {
  const want = {
    '10gbe-converges': ['converged', 2, 41.0, 4.55, 0],
    '1gbe-busy': ['forced', 30, 586.8, 133.77, 0],
    'dirty-faster': ['forced', 30, 9309.1, 316.51, 0],
    'auto-converge': ['converged', 10, 41.1, 90.43, 90],
    '1gbe-quiet': ['converged', 6, 180.6, 54.15, 0]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [outcome, n, dt, total, thr]] of Object.entries(want)) {
    const s = fromPreset(id);
    assert.equal(s.outcome, outcome, id);
    assert.equal(s.rounds.length, n, id);
    near(s.downtimeMs, dt, 0.05, id);
    near(s.totalS, total, 0.005, id);
    assert.equal(s.throttlePct, thr, id);
  }
});

// ── the grid and the round slider ──

test('grid: view 0 is all not yet copied; a round view marks the dirtied cells in the working set; the last is the pause', () => {
  const s0 = logic.initial(P({ round: 0 }));
  assert.equal(s0.grid.cells.length, logic.CELLS);
  assert.ok(s0.grid.cells.every((c) => c === 'todo'));
  assert.equal(s0.grid.cellMiB, 32);
  assert.equal(s0.grid.wsCells, 32);
  const s1 = logic.initial(P({ round: 1 }));   // 409.6 MiB dirty = 12.8 → 13 cells
  assert.equal(s1.grid.cells.filter((c) => c === 'dirty').length, 13);
  assert.ok(s1.grid.cells.every((c, i) => c !== 'dirty' || i < s1.grid.wsCells));
  assert.ok(!s1.paused);
  const s2 = logic.initial(P({ round: 2 }));   // the pause: 40.96 MiB → 2 cells
  assert.ok(s2.paused);
  assert.equal(s2.grid.cells.filter((c) => c === 'paused').length, 2);
  assert.equal(s2.grid.cells.filter((c) => c === 'clean').length, logic.CELLS - 2);
});

test('grid: the round slider is clamped to the number of rounds; dirty cells never leave the working set', () => {
  assert.equal(logic.lastView(P()), 2);
  const s = logic.initial(P({ round: 40 }));
  assert.equal(s.view, 2);
  const big = logic.initial(P({ memGiB: 64, wssMiB: 64, bwMiBs: 10, dirtyMiBs: 1500, round: 3 }));
  assert.equal(big.grid.wsCells, 1);   // a cell is 512 MiB; 64 MiB of working set is one (partly used) cell
  assert.deepEqual(big.grid.cells.map((c, i) => c === 'dirty' ? i : -1).filter((i) => i >= 0), [0]);
  assert.deepEqual(logic.pickCells(10, 4, 3), logic.pickCells(10, 4, 3));
  assert.equal(new Set(logic.pickCells(32, 32, 7)).size, 32);
});

// ── captions and the changed marks ──

test('captions: each outcome has its key', () => {
  const k = (over) => logic.captionKey(logic.initial(P(over))).key;
  assert.equal(logic.captionKey(fromPreset('10gbe-converges')).key, 'cConverged');
  assert.equal(logic.captionKey(fromPreset('1gbe-busy')).key, 'cForcedSlow');
  assert.equal(logic.captionKey(fromPreset('dirty-faster')).key, 'cForcedWss');
  assert.equal(logic.captionKey(fromPreset('auto-converge')).key, 'cThrottled');
  assert.equal(logic.captionKey(fromPreset('1gbe-quiet')).key, 'cConverged');
  assert.equal(k({ dirtyMiBs: 0 }), 'cIdle');
  assert.equal(k({ bwMiBs: 1000, dirtyMiBs: 1500, wssMiB: 256 }), 'cSmallWss');
  // throttled but still dirtying faster than the link: every round still resends W → cForcedWss, not "too slowly"
  assert.equal(k({ bwMiBs: 110, dirtyMiBs: 1500, autoConverge: true, maxRounds: 5 }), 'cForcedWss');
  assert.equal(k({ bwMiBs: 10, dirtyMiBs: 1500, autoConverge: true, maxRounds: 50 }), 'cForcedWss');
  // throttled, the rounds do shrink, but R runs out first
  assert.equal(k({ bwMiBs: 110, dirtyMiBs: 150, autoConverge: true, maxRounds: 6 }), 'cForcedSlow');
  const c = logic.captionKey(fromPreset('dirty-faster'));
  assert.equal(c.n, 30);
  assert.equal(c.w, 1024);
  near(c.dt, 9309.09, 0.01);
});

test('changed: the result-card values that differ', () => {
  const a = fromPreset('10gbe-converges');
  assert.deepEqual(logic.changed(a, a), []);
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, fromPreset('dirty-faster')), ['outcome', 'rounds', 'total', 'downtime', 'ratio']);
  assert.deepEqual(logic.changed(fromPreset('dirty-faster'), fromPreset('auto-converge')), ['outcome', 'rounds', 'total', 'downtime', 'throttle']);
  assert.deepEqual(logic.changed(a, fromPreset('10gbe-converges', { round: 0 })), []);   // the slider changes no result
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ autoConverge: true, bwMiBs: 300, dirtyMiBs: 700, round: 4 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer', () => {
  const keys = ['cIdle', 'cConverged', 'cSmallWss', 'cThrottled', 'cForcedWss', 'cForcedSlow'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
});
