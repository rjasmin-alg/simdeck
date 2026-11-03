// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the load-average model. Run: node --test sims/lnx-load-average/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the captions, then the
// generic block.
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
const at = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id, over) => at(Object.assign({}, preset(id).params, over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≉ ${b}`);

// ── tie-breaks (rule 5) ──

test('tie-break: the sample at exactly runFor still counts the tasks; the stop takes effect after it', () => {
  const p = P({ cores: 2, cpuTasks: 2, runFor: 65 });
  assert.equal(logic.activeAt(p, 65), 2);
  assert.equal(logic.activeAt(p, 70), 0);
  // 13 samples of 2 (5 … 65 s): 2 · (1 − e1^13)
  const e1 = 1884 / 2048;
  near(logic.loadAt(p, 65)[0], 2 * (1 - Math.pow(e1, 13)), 1e-12);
  // one sample less would be 12 samples: the boundary sample is in
  near(logic.loadAt(P({ cpuTasks: 2, runFor: 60 }), 65)[0], 2 * (1 - Math.pow(e1, 12)) * e1, 1e-12);
});

test('tie-break: at t = runFor the scene still shows the tasks; one step later they are gone', () => {
  const s = at({ cores: 2, cpuTasks: 2, ioTasks: 1, runFor: 65, t: 65 });
  assert.equal(s.on, true);
  assert.deepEqual(s.running, [1, 2]);
  assert.deepEqual(s.dstate, [3]);
  assert.equal(s.cpuPct, 100);
  const after = at({ cores: 2, cpuTasks: 2, ioTasks: 1, runFor: 65, t: 70 });
  assert.equal(after.on, false);
  assert.deepEqual(after.running, []);
  assert.deepEqual(after.queued, []);
  assert.deepEqual(after.dstate, []);
  assert.equal(after.cpuPct, 0);
  assert.equal(after.n, 0);
});

test('tie-break: cores = cpuTasks leaves the run queue empty; one task more queues exactly one', () => {
  assert.deepEqual(at({ cores: 3, cpuTasks: 3 }).queued, []);
  assert.deepEqual(at({ cores: 3, cpuTasks: 4 }).queued, [4]);
  assert.deepEqual(at({ cores: 3, cpuTasks: 4 }).coreTask, [1, 2, 3]);
});

test('tie-break: no sample at t = 0, and t off the 5 s grid uses the last sample before it', () => {
  assert.deepEqual(logic.loadAt(P({ cpuTasks: 8 }), 0), [0, 0, 0]);
  assert.deepEqual(logic.loadAt(P({ cpuTasks: 8 }), 4.9), [0, 0, 0]);
  assert.deepEqual(logic.loadAt(P({ cpuTasks: 2 }), 7), logic.loadAt(P({ cpuTasks: 2 }), 5));
  assert.equal(logic.lastSample(65), 65);
  assert.equal(logic.lastSample(69), 65);
  // at t = 0 the tasks are already running: 100 % CPU, load 0.00 (the averages lag)
  const s = at({ t: 0 });
  assert.equal(s.cpuPct, 100);
  assert.deepEqual(s.printed, [0, 0, 0]);
});

test('tie-break: no tasks keeps all three at 0.00 at every t', () => {
  for (const t of [0, 5, 65, 600, 1800]) {
    const s = at({ cpuTasks: 0, ioTasks: 0, t, runFor: 1800 });
    assert.deepEqual(s.load, [0, 0, 0]);
    assert.equal(s.cpuPct, 0);
    assert.equal(s.waPct, 0);
  }
});

// ── rule 1: R plus D ──

test('rule 1: a sample counts CPU tasks (R) plus I/O tasks (D); both weigh the same', () => {
  const p = P({ cpuTasks: 2, ioTasks: 3, runFor: 600 });
  assert.equal(logic.activeAt(p, 5), 5);
  const r = logic.loadAt(P({ cpuTasks: 5, ioTasks: 0, runFor: 600 }), 300);
  const d = logic.loadAt(P({ cpuTasks: 0, ioTasks: 5, runFor: 600 }), 300);
  const mix = logic.loadAt(p, 300);
  assert.deepEqual(r, d);
  assert.deepEqual(mix, r);
  assert.ok(d[0] > 4.9);
});

// ── rule 2: not normalised to the CPUs ──

test('rule 2: changing cores changes %CPU and the run queue, never the load numbers', () => {
  const base = { cpuTasks: 4, ioTasks: 1, runFor: 600, t: 300 };
  const loads = [];
  for (let cores = 1; cores <= 8; cores++) {
    const s = at(Object.assign({ cores }, base));
    loads.push(s.load);
    assert.equal(s.queued.length, Math.max(0, 4 - cores));
    near(s.cpuPct, Math.min(4, cores) / cores * 100, 1e-9);
  }
  for (const l of loads) assert.deepEqual(l, loads[0]);
  // load 1 on 1 core = busy all the time; on 4 cores = idle 75 %
  const one = at({ cores: 1, cpuTasks: 1, runFor: 1800, t: 1800 });
  const four = at({ cores: 4, cpuTasks: 1, runFor: 1800, t: 1800 });
  assert.equal(one.printed[0], 1);
  assert.equal(four.printed[0], 1);
  assert.equal(one.cpuPct, 100);
  assert.equal(four.idlePct, 75);
  near(four.perCore, 0.25, 1e-4);
});

// ── rule 3: the kernel's sample ──

test('rule 3: load = load·e + n·(1 − e) with EXP_1/5/15 = 1884, 2014, 2037 over 2048', () => {
  assert.deepEqual(logic.EXP, [1884, 2014, 2037]);
  assert.equal(logic.FIXED_1, 2048);
  assert.equal(logic.LOAD_FREQ, 5);
  const l = logic.sampleLoad([1, 1, 1], 3);
  near(l[0], 1 * 1884 / 2048 + 3 * (1 - 1884 / 2048), 1e-15);
  near(l[1], 1 * 2014 / 2048 + 3 * (1 - 2014 / 2048), 1e-15);
  near(l[2], 1 * 2037 / 2048 + 3 * (1 - 2037 / 2048), 1e-15);
  // ≈ exp(−5/60), exp(−5/300), exp(−5/900)
  near(1884 / 2048, Math.exp(-5 / 60), 0.001);
  near(2014 / 2048, Math.exp(-5 / 300), 0.001);
  near(2037 / 2048, Math.exp(-5 / 900), 0.001);
  // the 1-minute average moves first: after one sample of 1 from 0
  const one = logic.sampleLoad([0, 0, 0], 1);
  assert.ok(one[0] > one[1] && one[1] > one[2]);
  // floating point, no rounding inside: two decimals only for display
  const s = fromPreset('book-yes');
  assert.notEqual(s.load[0], s.printed[0]);
  assert.equal(s.printed[0], 1.32);
});

test('rule 3: the series replays the same samples the cursor reads', () => {
  const p = P({ cpuTasks: 3, ioTasks: 2, runFor: 400 });
  const ser = logic.seriesOf(p, 1800);
  assert.equal(ser.length, 361);
  assert.deepEqual(ser[0], [0, 0, 0, 0]);
  for (const t of [5, 400, 405, 1800]) {
    const row = ser[t / 5];
    assert.equal(row[0], t);
    assert.deepEqual(row.slice(1), logic.loadAt(p, t));
  }
  // the chart span: 5 min while t and runFor fit, else 30
  assert.equal(logic.spanOf(P({ t: 300, runFor: 300 })), 300);
  assert.equal(logic.spanOf(P({ t: 305, runFor: 60 })), 1800);
  assert.equal(logic.spanOf(P({ t: 60, runFor: 305 })), 1800);
  assert.equal(at({ t: 65 }).series.length, 61);
});

// ── rule 4: %CPU ──

test('rule 4: %CPU = min(cpu, cores)/cores; D tasks add 0 %CPU and show as iowait on idle cores', () => {
  const s = at({ cores: 4, cpuTasks: 2, ioTasks: 1, runFor: 600, t: 100 });
  assert.equal(s.cpuPct, 50);
  assert.equal(s.waPct, 25);
  assert.equal(s.idlePct, 25);
  const io = fromPreset('io-bound');
  assert.equal(io.cpuPct, 0);
  assert.equal(io.waPct, 100);
  assert.equal(io.idlePct, 0);
  // no idle core: the D tasks show no iowait, and still no %CPU of their own
  const full = at({ cores: 2, cpuTasks: 2, ioTasks: 3, runFor: 600, t: 100 });
  assert.equal(full.cpuPct, 100);
  assert.equal(full.waPct, 0);
  // CPU tasks above cores wait and still count in the load
  const q = fromPreset('one-core-queue');
  assert.deepEqual(q.running, [1]);
  assert.deepEqual(q.queued, [2]);
  assert.equal(q.n, 2);
  assert.ok(q.load[0] > 1.99);
});

// ── rule 6: reading the series ──

test('rule 6: falling left to right = just started; rising = easing; compared as printed', () => {
  assert.equal(logic.trendOf([1.33, 0.40, 0.14]), 'falling');
  assert.equal(logic.trendOf([0.14, 0.40, 1.33]), 'rising');
  assert.equal(logic.trendOf([2, 2, 2]), 'flat');
  assert.equal(logic.trendOf([2.001, 1.999, 2]), 'flat');
  assert.equal(logic.trendOf([1, 2, 1]), 'mixed');
  assert.equal(logic.trendOf([2, 1, 1.5]), 'mixed');   // l1 > l5 but l5 < l15: not falling
  assert.equal(logic.trendOf([1.5, 1, 2]), 'mixed');   // l5 < l15 but l1 > l5: not rising
  assert.equal(logic.trendOf([1, 1.5, 1.5]), 'mixed');
  assert.equal(fromPreset('book-yes').trend, 'falling');
  assert.equal(fromPreset('easing').trend, 'rising');
});

// ── presets (SPEC.md table) ──

test('presets: the five expected numbers', () => {
  const want = {
    'book-yes': [1.32, 0.39, 0.14],
    'book-top-later': [1.03, 0.37, 0.13],
    'one-core-queue': [2.00, 1.73, 0.95],
    'io-bound': [4.00, 3.46, 1.90],
    easing: [0.03, 1.27, 1.38]
  };
  for (const id of Object.keys(want)) assert.deepEqual(fromPreset(id).printed, want[id], id);
  assert.equal(fromPreset('book-yes').cpuPct, 100);
  assert.equal(fromPreset('one-core-queue').cpuPct, 100);
  assert.equal(fromPreset('io-bound').cpuPct, 0);
  // the book's 1.33 · 0.40 · 0.14 and 1.04 · 0.38 · 0.13 are within 0.01
  fromPreset('book-yes').load.forEach((l, k) => near(l, [1.33, 0.40, 0.14][k], 0.01));
  fromPreset('book-top-later').load.forEach((l, k) => near(l, [1.04, 0.38, 0.13][k], 0.011));
});

test('presets: every value sits on its slider grid and in range', () => {
  for (const x of logic.presets) {
    const p = P(x.params);
    assert.ok(p.cores >= 1 && p.cores <= 8);
    assert.ok(p.cpuTasks >= 0 && p.cpuTasks <= 8 && p.ioTasks >= 0 && p.ioTasks <= 8);
    assert.ok(p.runFor >= 5 && p.runFor <= 1800 && p.runFor % 5 === 0);
    assert.ok(p.t >= 0 && p.t <= 1800 && p.t % 5 === 0);
  }
});

// ── changed marks and captions ──

test('changed: printed load values that moved and cores whose busy/idle state flipped', () => {
  const a = at({ cores: 2, cpuTasks: 2, t: 65 });
  const b = at({ cores: 4, cpuTasks: 2, t: 65 });
  assert.deepEqual(logic.changed(a, b), { load: [], cores: [2, 3] });
  const c = at({ cores: 2, cpuTasks: 1, t: 65 });
  assert.deepEqual(logic.changed(a, c), { load: [0, 1, 2], cores: [1] });
  assert.deepEqual(logic.changed(null, a), { load: [], cores: [] });
  // cores 4 → 2: nothing left to flip among the two that remain, even when the removed cores were busy
  assert.deepEqual(logic.changed(b, a).cores, []);
  assert.deepEqual(logic.changed(at({ cores: 4, cpuTasks: 4 }), at({ cores: 2, cpuTasks: 4 })).cores, []);
  // compared as printed: 1795 s and 1800 s differ in the raw value, not in what uptime prints
  const p1 = at({ cores: 2, cpuTasks: 2, runFor: 1800, t: 1795 });
  const p2 = at({ cores: 2, cpuTasks: 2, runFor: 1800, t: 1800 });
  assert.notEqual(p1.load[0], p2.load[0]);
  assert.deepEqual(logic.changed(p1, p2).load, []);
});

test('captions: the reading against the cores, then what happens at the cursor', () => {
  assert.deepEqual(logic.captionKey(fromPreset('book-yes')), { a: 'cUnderOne', b: 'bFalling' });
  assert.deepEqual(logic.captionKey(fromPreset('book-top-later')), { a: 'cUnderOne', b: 'bStopped' });
  assert.deepEqual(logic.captionKey(fromPreset('one-core-queue')), { a: 'cOver', b: 'bQueue' });
  assert.deepEqual(logic.captionKey(fromPreset('io-bound')), { a: 'cDisk', b: null });
  assert.deepEqual(logic.captionKey(fromPreset('easing')), { a: 'cUnder', b: 'bRising' });
  assert.deepEqual(logic.captionKey(at({ cores: 2, cpuTasks: 2, runFor: 1800, t: 1800 })), { a: 'cUnderOne', b: 'bSteady' });
  // exactly at the cores: still within capacity (≤)
  assert.equal(logic.captionKey(at({ cores: 1, cpuTasks: 1, runFor: 1800, t: 1800 })).a, 'cUnder');
});

test('captions: all zero — no workload, not sampled yet, or faded after the stop', () => {
  assert.deepEqual(logic.captionKey(at({ cpuTasks: 0, ioTasks: 0 })), { a: 'cZero', b: null });
  assert.deepEqual(logic.captionKey(at({ cpuTasks: 0, ioTasks: 0, runFor: 5, t: 100 })), { a: 'cZero', b: null });
  // t = 0 with tasks running: no sample yet, not "no task"
  assert.deepEqual(logic.captionKey(at({ t: 0 })), { a: 'cFirst', b: null });
  assert.equal(logic.captionKey(at({ t: 5 })).a, 'cUnder');   // one sample: 0.16, and n = cores: no lag reading
  // a task that stopped long ago: the averages faded, the task existed
  assert.deepEqual(logic.captionKey(at({ cores: 1, cpuTasks: 1, runFor: 5, t: 600 })), { a: 'cFaded', b: null });
  // only l1 prints 0.00: not zero
  const e = fromPreset('easing', { t: 1200 });
  assert.deepEqual(e.printed.slice(0, 1), [0]);
  assert.deepEqual(logic.captionKey(e), { a: 'cUnder', b: 'bRising' });
});

test('captions: a visible queue is never read as "within capacity" (the average lags)', () => {
  assert.deepEqual(logic.captionKey(at({ cores: 2, cpuTasks: 8, runFor: 600, t: 10 })), { a: 'cLag', b: 'bQueue' });
  assert.deepEqual(logic.captionKey(at({ cores: 2, cpuTasks: 8, runFor: 600, t: 5 })), { a: 'cLag', b: 'bQueue' });
  // once the average passes the cores, the ordinary reading
  assert.deepEqual(logic.captionKey(at({ cores: 2, cpuTasks: 8, runFor: 600, t: 600 })), { a: 'cOver', b: 'bQueue' });
});

test('captions: D-only load is read as disk waits, not as a CPU queue', () => {
  assert.deepEqual(logic.captionKey(at({ cores: 1, cpuTasks: 0, ioTasks: 4, runFor: 600, t: 600 })), { a: 'cDisk', b: null });
  // D beside running CPU tasks: the ordinary reading plus bDisk
  assert.deepEqual(logic.captionKey(at({ cores: 4, cpuTasks: 2, ioTasks: 2, runFor: 1800, t: 1800 })), { a: 'cUnderOne', b: 'bDisk' });
  // queued CPU tasks and D tasks together: the queue sentence wins
  assert.equal(logic.captionKey(at({ cores: 1, cpuTasks: 3, ioTasks: 2, runFor: 1800, t: 1800 })).b, 'bQueue');
  // an I/O-only workload after its stop still gets the stop reading
  assert.deepEqual(logic.captionKey(at({ cores: 4, cpuTasks: 0, ioTasks: 4, runFor: 60, t: 90 })), { a: 'cUnderOne', b: 'bStopped' });
  assert.equal(at({ cpuTasks: 0, ioTasks: 4 }).peak, 4);
});

test('captions: thresholds use the printed value (raw 1.002 prints 1.00 → cUnder)', () => {
  const s = at({ cores: 2, cpuTasks: 2, runFor: 105, t: 135 });
  assert.ok(s.load[0] > 1 && s.printed[0] === 1);
  assert.equal(logic.captionKey(s).a, 'cUnder');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const x of [{ params: {} }].concat(logic.presets)) {
    const s = at(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ cores: 3, cpuTasks: 5, ioTasks: 2, runFor: 300, t: 450 });
  const copy = structuredClone(p);
  const a = logic.initial(p);
  const b = logic.initial(p);
  assert.deepEqual(a, b);
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the page names every preset', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(html.includes(`'${x.id}'`), `the page labels preset ${x.id}`);
  }
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), `entry ${e.preset} is a preset`);
});
