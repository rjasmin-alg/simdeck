// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-patch-sla. Run: node --test sims/cmp-patch-sla/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order, the presets (checked against the
// Python re-implementation in SPEC.md), and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.compute(P(over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const DL = [15, 30, 90, 180];
/** A hand-made item. */
const it = (id, day, score, kev, over) => Object.assign({ id, day, sys: 0, sev: score >= 90 ? 0 : score >= 70 ? 1 : score >= 40 ? 2 : 3, score, kev }, over);
/** Run hand-made items with the given policy. */
const runP = (items, over) => L.run(items, Object.assign({ order: 'score', cap: 1, unowned: 0, exc: 'none', deadlines: DL }, over));

// ── tie-breaks first ──

test('rule 4: by score, equal scores go by earlier arrival, then by lower id', () => {
  const a = it(5, 3, 75, false), b = it(2, 4, 75, false), c = it(1, 3, 75, false);
  assert.deepEqual([a, b, c].sort((x, y) => L.before('score', x, y)).map((x) => x.id), [1, 5, 2]);
  // by score, the known-exploited flag does not count
  assert.ok(L.before('score', it(1, 1, 80, false), it(2, 1, 79, true)) < 0);
});

test('rule 4: exploited first, then by score, then arrival and id; a total order', () => {
  const list = [it(0, 1, 95, false), it(1, 2, 45, true), it(2, 1, 45, true), it(3, 1, 50, true), it(4, 1, 95, false)];
  assert.deepEqual(list.slice().sort((x, y) => L.before('exploited', x, y)).map((x) => x.id), [3, 2, 1, 0, 4]);
  for (const x of list) assert.equal(L.before('exploited', x, x), 0);
});

test('rule 2: the stream depends only on the seed; every item takes exactly four draws after the day\'s count', () => {
  assert.deepEqual(L.stream(7), L.stream(7));
  assert.notDeepEqual(L.stream(7), L.stream(8));
  const r = L.rng(7), k = 2 + Math.floor(r() * 5);
  const sys = Math.floor(r() * 20); r(); r(); r();
  const s = L.stream(7);
  assert.equal(s.filter((x) => x.day === 1).length, k);
  assert.equal(s[0].sys, sys);
  const sys2 = Math.floor(r() * 20);
  assert.equal(s[1].day === 1 ? s[1].sys : sys2, sys2);
  // no param changes it: the same items under every preset
  for (const x of L.presets) assert.equal(L.compute(x.params).arrivals, L.compute(L.presets[0].params).arrivals);
});

test('rule 3: fixes a day add up to ⌊cap · d⌋; half fixes alternate', () => {
  assert.deepEqual([1, 2, 3, 4].map((d) => L.fixesOn(2.5, d)), [2, 3, 2, 3]);
  assert.deepEqual([1, 2, 3].map((d) => L.fixesOn(1, d)), [1, 1, 1]);
  let sum = 0;
  for (let d = 1; d <= L.DAYS; d++) sum += L.fixesOn(3.5, d);
  assert.equal(sum, Math.floor(3.5 * L.DAYS));
});

test('rule 3: an item is fixed at the earliest the day after it arrives', () => {
  const r = runP([it(0, 1, 95, false)], { cap: 6 });
  assert.equal(r[0].fixed, 2);
});

test('rule 6: fixed on the deadline day is in time, a day later is late; open on the deadline is not yet due', () => {
  const x = { day: 10, due: 25, fixed: 25, exc: null, owned: true };
  assert.equal(L.status(x), 'inTime');
  assert.equal(L.status(Object.assign({}, x, { fixed: 26 })), 'late');
  assert.equal(L.status(Object.assign({}, x, { fixed: null, due: L.DAYS })), 'notDue');
  assert.equal(L.status(Object.assign({}, x, { fixed: null, due: L.DAYS - 1 })), 'overdue');
  // a dated exception that ends on the last day still runs; one that ended the day before is overdue
  assert.equal(L.status(Object.assign({}, x, { fixed: null, exc: L.DAYS })), 'excepted');
  assert.equal(L.status(Object.assign({}, x, { fixed: null, exc: L.DAYS - 1 })), 'overdue');
  assert.equal(L.status(Object.assign({}, x, { fixed: 40, exc: 40 })), 'inTime');
  assert.equal(L.status(Object.assign({}, x, { fixed: 41, exc: 40 })), 'late');
});

test('rule 5: the exception comes the day after the deadline, before that day\'s fixes; dated ones end 30 days later', () => {
  const items = [it(0, 1, 95, false, { sys: 19 })];
  const open = runP(items, { unowned: 1, exc: 'open' });
  assert.equal(open[0].exc, 'open');
  assert.equal(open[0].fixed, null);
  const dated = runP(items, { unowned: 1, exc: 'dated' });
  assert.equal(dated[0].due, 16);
  assert.equal(dated[0].exc, 17 + L.EXC_DAYS);
  assert.equal(dated[0].fixed, 17, 'the owner puts it in the queue; fixed the same day');
  assert.equal(L.status(dated[0]), 'inTime');
  const none = runP(items, { unowned: 1, exc: 'none' });
  assert.equal(none[0].exc, null);
  assert.equal(none[0].fixed, null);
  assert.equal(L.status(none[0]), 'overdue');
});

// ── the rules ──

test('rule 1: the year, the systems; the last `unowned` systems have no owner, and nobody fixes their items', () => {
  assert.equal(L.DAYS, 365);
  assert.equal(L.SYSTEMS, 20);
  const r = runP([it(0, 1, 95, false, { sys: 17 }), it(1, 1, 20, false, { sys: 16 })], { unowned: 3, cap: 6 });
  assert.equal(r[0].owned, false);
  assert.equal(r[0].fixed, null);
  assert.equal(r[1].owned, true);
  assert.equal(r[1].fixed, 2);
});

test('rule 2: severities and their score bands; the shares of arrivals and of known exploitation', () => {
  const s = L.stream(7);
  for (const x of s) {
    assert.ok(x.score >= L.SEV_LO[x.sev] && x.score <= L.SEV_HI[x.sev], `${x.id}`);
    assert.ok(x.day >= 1 && x.day <= L.DAYS && x.sys >= 0 && x.sys < 20);
  }
  assert.equal(s.length, 1483);
  for (let d = 1; d <= L.DAYS; d++) {
    const k = s.filter((x) => x.day === d).length;
    assert.ok(k >= 2 && k <= 6);
  }
  // many seeds: the shares come close to the parameters
  let n = 0; const sev = [0, 0, 0, 0], kev = [0, 0, 0, 0];
  for (let seed = 1; seed <= 20; seed++) for (const x of L.stream(seed)) { n++; sev[x.sev]++; if (x.kev) kev[x.sev]++; }
  for (let i = 0; i < 4; i++) {
    assert.ok(Math.abs(sev[i] / n - L.SEV_P[i]) < 0.01, `sev ${i}`);
    assert.ok(Math.abs(kev[i] / sev[i] - L.EXPLOIT_P[i]) < 0.02, `kev ${i}`);
  }
});

test('rule 3: the team fixes from the queue in order, at most cap a day', () => {
  const items = [it(0, 1, 50, false), it(1, 1, 95, false), it(2, 1, 60, true), it(3, 1, 80, false)];
  const byScore = runP(items, { cap: 1 });
  assert.deepEqual(byScore.map((x) => x.fixed), [5, 2, 4, 3]);
  const byKev = runP(items, { cap: 1, order: 'exploited' });
  assert.deepEqual(byKev.map((x) => x.fixed), [5, 3, 2, 4]);
  const two = runP(items, { cap: 2 });
  assert.deepEqual(two.map((x) => x.fixed), [3, 2, 3, 2]);
});

test('rule 3: the number open each day does not depend on the order (same work), so neither does the exposure', () => {
  for (const over of [{ cap: 3, unowned: 0 }, { cap: 2.5, unowned: 4 }, { cap: 3.5, unowned: 3, exc: 'open' }]) {
    const a = S(Object.assign({ order: 'score' }, over)), b = S(Object.assign({ order: 'exploited' }, over));
    assert.equal(a.m.exposure, b.m.exposure);
    assert.equal(a.m.open, b.m.open);
    assert.ok(a.m.exposureKev >= b.m.exposureKev);
  }
});

test('rule 5: open-ended exceptions never end and never get fixed; dated ones that run out unfixed are overdue again', () => {
  const s = S({ exc: 'open' });
  const recs = L.run(L.stream(7), { order: 'score', cap: 3.5, unowned: 3, exc: 'open', deadlines: DL });
  assert.ok(recs.filter((x) => x.exc === 'open').every((x) => x.fixed === null && !x.owned));
  assert.equal(s.m.counts.excepted, recs.filter((x) => x.exc === 'open').length);
  const dated = L.run(L.stream(7), { order: 'score', cap: 3.5, unowned: 3, exc: 'dated', deadlines: DL });
  const ran = dated.filter((x) => typeof x.exc === 'number' && x.fixed === null && x.exc < L.DAYS);
  assert.ok(ran.length > 0);
  assert.ok(ran.every((x) => L.status(x) === 'overdue'));
  const late = dated.filter((x) => typeof x.exc === 'number' && x.fixed !== null && x.fixed > x.exc);
  assert.ok(late.every((x) => L.status(x) === 'late'));
  // exceptions only for items on systems nobody owns
  assert.ok(dated.filter((x) => x.exc !== null).every((x) => !x.owned));
});

test('rule 6: the share in time counts fixed and overdue items; excepted and not yet due are left out', () => {
  const m = S({}).m, c = m.counts;
  assert.equal(m.counted, c.inTime + c.late + c.overdue);
  assert.equal(m.inTime, c.inTime / m.counted);
  assert.equal(c.inTime + c.late + c.overdue + c.excepted + c.notDue, m.items);
  assert.equal(L.measure([]).inTime, 1);
  assert.equal(L.measure([]).meanFix, 0);
  assert.equal(L.measure([{ id: 0, day: 1, fixed: null, owned: false, kev: false, exc: 'open', due: 2, sev: 0 }]).overdueUnowned, 0);
});

test('rule 6: exposure is open item-days; the average is over fixed items; the oldest is the earliest open arrival', () => {
  const recs = [
    { id: 0, day: 5, fixed: 9, owned: true, kev: true, exc: null, due: 20, sev: 0 },
    { id: 1, day: 3, fixed: null, owned: false, kev: false, exc: null, due: 18, sev: 2 },
    { id: 2, day: 3, fixed: null, owned: true, kev: false, exc: null, due: 400, sev: 3 },
    { id: 3, day: 10, fixed: 12, owned: true, kev: false, exc: null, due: 40, sev: 1 }
  ];
  const m = L.measure(recs);
  assert.equal(m.exposure, 4 + (L.DAYS - 3) * 2 + 2);
  assert.equal(m.exposureUnowned, L.DAYS - 3);
  assert.equal(m.exposureKev, 4);
  assert.equal(m.meanFix, 3);
  assert.deepEqual(m.oldest, { id: 1, age: L.DAYS - 3, owned: false, sev: 2 }, 'equal day: lower id');
  assert.equal(m.open, 2);
  assert.equal(m.overdueUnowned, 1);
});

test('rule 7: deadlines change the share in time, never the queue or the exposure (unless an exception is dated)', () => {
  for (const exc of ['none', 'open']) {
    const a = S({ exc, dCrit: 3, dHigh: 7, dMed: 14, dLow: 30 }), b = S({ exc });
    assert.equal(a.m.exposure, b.m.exposure);
    assert.equal(a.m.meanFix, b.m.meanFix);
    assert.ok(a.m.inTime < b.m.inTime);
  }
  const t = S(preset('tight'));
  assert.equal(t.exposureStd, t.m.exposure);
  assert.equal(t.inTimeStd, S(Object.assign({}, preset('tight'), { dCrit: 15, dHigh: 30, dMed: 90, dLow: 180 })).m.inTime);
  assert.equal(S({}).inTimeStd, null);
  // the comparison keeps every other param, the exception rule too
  for (const exc of ['open', 'dated']) {
    const x = S({ exc, dCrit: 7 }), y = S({ exc });
    assert.equal(x.inTimeStd, y.m.inTime, exc);
    assert.equal(x.exposureStd, y.m.exposure, exc);
  }
});

test('rule 8: the open items for the chart: age, 10-day bin, mark; sorted by bin, severity, exploited, id', () => {
  for (const exc of ['open', 'dated']) {
    const d = S({ exc }), stream = L.stream(7);
    assert.equal(d.open.filter((x) => x.mark === 'exc').length, d.m.counts.excepted, exc);
    assert.equal(d.open.filter((x) => x.mark === 'over').length, d.m.counts.overdue, exc);
    for (const x of d.open) assert.equal(x.age, L.DAYS - stream[x.id].day);
  }
  assert.ok(S({ exc: 'dated' }).m.counts.excepted > 0, 'a dated exception still running at year end');
  const s = S({ exc: 'open' });
  assert.equal(s.open.length, s.m.open);
  for (const x of s.open) {
    assert.equal(x.bin, Math.floor(x.age / 10));
    assert.ok(['ok', 'over', 'exc'].includes(x.mark));
  }
  assert.equal(s.open.filter((x) => x.mark === 'exc').length, s.m.counts.excepted);
  assert.equal(s.open.filter((x) => x.mark === 'over').length, s.m.counts.overdue);
  for (let i = 1; i < s.open.length; i++) {
    const a = s.open[i - 1], b = s.open[i];
    assert.ok(a.bin < b.bin || (a.bin === b.bin && (a.sev < b.sev || (a.sev === b.sev && (a.kev > b.kev || (a.kev === b.kev && a.id < b.id))))), `${i}`);
  }
});

test('rule 9: params made safe; deadline steppers move along the offered values', () => {
  const n = L.normalise({ order: 'x', cap: '2.7', unowned: 99, exc: 'maybe', dCrit: -4, dHigh: 'abc', dMed: 1000, dLow: 100.4, seed: 0 });
  assert.deepEqual(n, { order: 'score', cap: 2.5, unowned: 6, exc: 'open', dCrit: 1, dHigh: 30, dMed: 180, dLow: 100, seed: 1 });
  assert.equal(L.normalise({ cap: 0 }).cap, 1);
  const r = L.normalise({ cap: '2.8', unowned: 2.6, dLow: 100.6, dCrit: 4.5, seed: 1500 });
  assert.deepEqual([r.cap, r.unowned, r.dLow, r.dCrit, r.seed], [3, 3, 101, 5, 999]);
  assert.equal(L.normalise({ seed: 998.6 }).seed, 999);
  assert.equal(L.normalise({ cap: ' ' }).cap, 3.5);
  assert.equal(L.normalise({ cap: 2.75 }).cap, 3);
  assert.equal(L.normalise({ cap: '' }).cap, 3.5);
  assert.equal(L.normalise({ cap: 9 }).cap, 6);
  assert.equal(L.stepDeadline(0, 15, 1), 20);
  assert.equal(L.stepDeadline(0, 15, -1), 10);
  assert.equal(L.stepDeadline(0, 12, 1), 15, 'from a URL value between two steps');
  assert.equal(L.stepDeadline(0, 12, -1), 10);
  assert.equal(L.stepDeadline(0, 30, 1), 30);
  assert.equal(L.stepDeadline(0, 1, -1), 1);
  assert.equal(L.stepDeadline(3, 180, 1), 270);
  for (let s = 0; s < 4; s++) {
    assert.equal(L.DL_MIN[s], L.DL_STEPS[s][0]);
    assert.ok(L.DL_STEPS[s].includes(L.defaults[L.DKEYS[s]]));
  }
  assert.equal(L.nextSeed(7), 8);
  assert.equal(L.nextSeed(999), 1);
});

test('rule 10: the caption: base key, then one note in order', () => {
  const k = (id, over) => L.captionKey(S(Object.assign({}, preset(id), over)));
  assert.deepEqual(k('report'), { key: 'capTail', notes: ['nOpenExc'] });
  assert.deepEqual(k('no-exc'), { key: 'capTail', notes: ['nUnowned'] });
  assert.deepEqual(k('dated'), { key: 'capTail', notes: ['nDated'] });
  assert.deepEqual(k('short'), { key: 'capTailOwned', notes: ['nByScore'] });
  assert.deepEqual(k('kev'), { key: 'capTailOwned', notes: ['nByKev'] });
  assert.deepEqual(k('tight'), { key: 'capTailOwned', notes: ['nDeadlines'] });
  // open-ended exceptions before shorter deadlines; dated before deadlines (the exposure moves under dated)
  assert.deepEqual(k('report', { dCrit: 7 }).notes, ['nOpenExc']);
  assert.deepEqual(k('dated', { dCrit: 7 }).notes, ['nDated']);
  // any single deadline other than the policy's
  for (const over of [{ dCrit: 10 }, { dHigh: 45 }, { dMed: 60 }, { dLow: 90 }]) {
    assert.deepEqual(k('no-exc', over).notes, ['nDeadlines'], JSON.stringify(over));
    assert.notEqual(S(Object.assign({}, preset('no-exc'), over)).inTimeStd, null);
  }
  // the order before overdue unowned items, when both apply
  assert.deepEqual(k('no-exc', { cap: 2 }).notes, ['nByScore']);
  // exception notes need something to say: none excepted, or no unowned systems
  assert.deepEqual(k('short', { exc: 'open' }).notes, ['nByScore']);
  assert.deepEqual(k('short', { exc: 'dated' }).notes, ['nByScore']);
  assert.equal(k('report', { unowned: 1 }).key, 'capTail');
  // a fast team and no unowned systems: nothing open longer than 30 days
  const fast = S({ cap: 6, unowned: 0, exc: 'none' });
  assert.ok(fast.m.open > 0 && fast.m.oldest.age <= L.CLEAN_AGE);
  assert.equal(L.captionKey(fast).key, 'capClean');
  assert.equal(L.captionKey(S({ cap: 3, unowned: 0, exc: 'none' })).key, 'capTailOwned');
  // nothing open at all (a fast team, no unowned systems; the last day's arrivals are open, so look at a small case)
  const clean = { m: { open: 0, oldest: null, counts: { excepted: 0 }, overdueUnowned: 0 }, p: { unowned: 0, exc: 'none', order: 'score' },
    kevBy: { score: 0, exploited: 0 }, inTimeStd: null };
  assert.deepEqual(L.captionKey(clean), { key: 'capClean', notes: [] });
  // the order note only when it matters by a quarter or more
  const small = Object.assign({}, clean, { m: Object.assign({}, clean.m, { open: 3, oldest: { age: 31 } }), kevBy: { score: 100, exploited: 76 } });
  assert.equal(L.captionKey(small).key, 'capTailOwned');
  assert.deepEqual(L.captionKey(small).notes, []);
  small.kevBy = { score: 100, exploited: 75 };
  assert.deepEqual(L.captionKey(small).notes, ['nByScore']);
});

test('presets: the numbers in SPEC.md (checked by the Python re-implementation there)', () => {
  const want = {
    report: [99.1, 1277, 149, 9, 4.2, 215, 362, 42715, 3334],
    'no-exc': [88.8, 1426, 0, 158, 4.2, 215, 362, 42715, 3334],
    dated: [93.7, 1339, 3, 67, 11.2, 211, 360, 41617, 1374],
    short: [81.6, 1335, 0, 244, 3.8, 392, 363, 74378, 2442],
    kev: [81.2, 1335, 0, 244, 4.1, 392, 363, 74378, 126],
    tight: [76.6, 1404, 0, 313, 4.1, 392, 363, 74378, 126]
  };
  for (const x of L.presets) {
    const m = L.compute(x.params).m;
    const got = [Math.round(m.inTime * 1000) / 10, m.counted, m.counts.excepted, m.counts.overdue,
      Math.round(m.meanFix * 10) / 10, m.open, m.oldest.age, m.exposure, m.exposureKev];
    assert.deepEqual(got, want[x.id], x.id);
  }
  const kv = S(preset('kev')).inTimeBy, sc = S(preset('short')).inTimeBy;
  assert.deepEqual([kv.score, kv.exploited].map((v) => Math.round(v * 1000) / 10), [81.6, 81.2]);
  assert.deepEqual(sc, kv);
  const r = S(preset('report')).m;
  assert.equal(Math.round(r.exposureUnowned / r.exposure * 1000) / 10, 80.2);
  assert.equal(r.unownedItems, 188);
});

test('the defaults are preset 1 with the policy 15/30/90/180 (the nDeadlines words name it); every preset is normal', () => {
  assert.deepEqual(L.defaults, preset('report'));
  assert.deepEqual([L.defaults.dCrit, L.defaults.dHigh, L.defaults.dMed, L.defaults.dLow], DL);
  assert.match(strings.hr.nDeadlines, /15\/30\/90\/180/);
  assert.match(strings.en.nDeadlines, /15\/30\/90\/180/);
  for (const x of L.presets) assert.deepEqual(L.normalise(x.params), x.params, x.id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('dated'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every severity, preset, caption and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capTail', 'capTailOwned', 'capClean', 'nOpenExc', 'nDated', 'nDeadlines', 'nByScore', 'nByKev', 'nUnowned'];
  for (const lang of ['hr', 'en']) {
    for (let s = 0; s < 4; s++) assert.ok(strings[lang]['sev_' + s], `${lang} sev_${s}`);
    for (const k of keys.concat(L.DKEYS)) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: no-exc → pNoExc. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
