// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the faultline import. Run: node --test sims/faultline/sim.test.js
// The app is ES modules in js/, bundled once into app.js (bundle.mjs). These tests check the bundler and the bundle,
// the two languages (tables, keys, plurals, the names the engine writes in English), the samples and the import
// markers; run the app's own 47 checks (node tests/run.mjs); and open the page in Chromium from file://, every sample
// in both languages, breaking an event and a cut, with no console error and no missing string.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const kit = require('../../kit/kit.js');
const strings = require('./strings.js');

const ID = 'faultline';
const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
const html = read('index.html');
const entry = JSON.parse(read('sim.json'));
// The task's sample keys (the app's own ids, used in ?sample=) and the kebab-case preset ids of sim.json.
const SAMPLES = { threeZone: 'three-zone', onePdu: 'one-pdu', sizeTwo: 'size-two', usEast1: 'us-east-1', frontDoor: 'front-door' };

/** Every .js file under js/, as paths relative to js/. */
function jsFiles(dir = path.join(DIR, 'js'), base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory()
    ? jsFiles(path.join(dir, d.name), `${base}${d.name}/`)
    : d.name.endsWith('.js') ? [`${base}${d.name}`] : []));
}

/** A fresh copy of the bundle in a vm, not booted; `env` sets location, localStorage and <html lang>. */
function loadApp(env = {}) {
  const errors = [];
  const store = new Map(Object.entries(env.stored || {}));
  const sandbox = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
    SimStrings: strings,
    FAULTLINE_NO_BOOT: true,
    URLSearchParams,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    document: { documentElement: { lang: env.htmlLang ?? 'hr', dataset: {} } },
  };
  if (env.search !== undefined) sandbox.location = { search: env.search };
  vm.createContext(sandbox);
  vm.runInContext(read('app.js'), sandbox, { filename: 'app.js' });
  return { M: sandbox.Faultline.modules, errors };
}

// ── the bundle ──

test('app.js is what bundle.mjs makes of js/ (no hand edits, not stale)', async () => {
  const { bundle } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(read('app.js'), bundle());
});

test('bundler: subfolder paths, named imports with `as`, the export forms, dependency order', async () => {
  const { transform, order, resolve } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(resolve('engine/cutset', './graph.js'), 'engine/graph');
  assert.equal(resolve('main', './engine/authorities.js'), 'engine/authorities');
  assert.equal(resolve('engine/x', '../i18n.js'), 'i18n');
  assert.throws(() => resolve('main', '../outside.js'), /leaves js/);
  const m = transform('engine/x', "import {\n  a, b as c,\n} from './y.js';\nimport { d } from '../z.js';\n"
    + 'export const K = 1;\nexport class C {}\nexport function f() {}\nfunction g() {}\nexport { g };\n');
  assert.deepEqual(m.deps, ['engine/y', 'z']);
  assert.match(m.body, /const \{ a, b: c \} = __mods\["engine\/y"\];/);
  assert.deepEqual(m.exports.sort(), ['C', 'K', 'f', 'g']);
  assert.doesNotMatch(m.body, /^\s*(import|export)\b/m);
  const mods = new Map([['main', { deps: ['b', 'a'] }], ['a', { deps: [] }], ['b', { deps: ['a'] }]]);
  assert.deepEqual(order(mods, 'main'), ['a', 'b', 'main']);
});

test('bundler refuses what it cannot bundle: default exports, namespace imports, bare specifiers, cycles, missing modules', async () => {
  const { transform, order } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.throws(() => transform('x', 'export default 1;\n'), /cannot bundle/);
  assert.throws(() => transform('x', "import * as y from './y.js';\n"), /cannot bundle/);
  assert.throws(() => transform('x', "import { y } from 'y';\n"), /cannot bundle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }], ['a', { deps: ['main'] }]]), 'main'), /cycle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }]]), 'main'), /missing module a\.js/);
});

test('the page loads strings.js, then app.js, as classic scripts (the build inlines no modules)', () => {
  assert.doesNotMatch(html, /type="module"/);
  const s = html.indexOf('<script src="strings.js"></script>');
  const a = html.indexOf('<script src="app.js"></script>');
  assert.ok(s > 0 && a > s);
});

test('the bundle loads in a bare context and boots nothing without a page', () => {
  const { M, errors } = loadApp({ search: '?lang=en' });
  assert.ok(M.main === undefined, 'main must not run under FAULTLINE_NO_BOOT');
  assert.ok(M['engine/cutset'] && M.compile && M.samples && M.i18n && M.render);
  assert.deepEqual(errors, []);
});

test('the engine stays as imported: js/engine/ does not know about languages', () => {
  for (const f of jsFiles().filter((x) => x.startsWith('engine/'))) {
    assert.doesNotMatch(read(`js/${f}`), /i18n|\bt\(|simdeck/, f);
  }
});

// ── languages ──

test('both string tables have the same keys, plural shapes and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('language: ?lang= wins, then the stored simdeck choice, then <html lang>; unknown values are skipped', () => {
  const lang = (env) => loadApp(env).M.i18n.lang();
  assert.equal(lang({ search: '?lang=en', stored: { 'simdeck.lang': 'hr' } }), 'en');
  assert.equal(lang({ search: '?lang=hr', stored: { 'simdeck.lang': 'en' } }), 'hr');
  assert.equal(lang({ search: '', stored: { 'simdeck.lang': 'en' } }), 'en');
  assert.equal(lang({ search: '?lang=de', stored: { 'simdeck.lang': 'xx' }, htmlLang: 'en' }), 'en');
  assert.equal(lang({ search: '', htmlLang: 'hr' }), 'hr');
});

test('Croatian plurals: 1 / 2–4 / 5+, and 11–14 take the third form', () => {
  const { M } = loadApp({ search: '?lang=hr' });
  const forms = strings.hr['st.cuts'];
  const n = (k) => M.i18n.t('st.cuts', { n: k });
  const want = (i, k) => forms[i].replace('{n}', k);
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101].map(n),
    [want(0, 1), want(1, 2), want(1, 4), want(2, 5), want(2, 11), want(2, 12), want(2, 14), want(0, 21),
      want(1, 22), want(2, 25), want(0, 101)]);
  M.i18n.useLang('en');
  assert.deepEqual([1, 2, 11].map(n), ['1 cut', '2 cuts', '11 cuts']);
});

test('every literal t() key and data-t* key in the page and js/ is in the table, and every table key is used', () => {
  const sources = [html, ...jsFiles().map((f) => read(`js/${f}`))].join('\n');
  const keys = new Set();
  for (const m of sources.matchAll(/\bt\('([\w.-]+)'/g)) keys.add(m[1]);
  for (const m of sources.matchAll(/data-t(?:-title|-label|-placeholder)?="([\w.-]+)"/g)) keys.add(m[1]);
  assert.ok(keys.size > 50, `found ${keys.size} keys`);
  for (const k of keys) for (const l of ['hr', 'en']) assert.ok(k in strings[l], `${l}: ${k}`);
  // Built keys: role.<role>, kind.<kind>, scope1|scopeN.<scope>, auth|authq.<kind>, the two-word picks in main.js.
  // walk.onePdu.cap<i> and .feed are looked up through the walk's `strings` prefix (main.js renderWalk, paintOpts).
  const built = (k) => /^(role|kind|scope1|scopeN|auth|authq)\./.test(k) || /^(cut\.reveal(More|Zero)|st\.(up|down))$/.test(k)
    || /^walk\.onePdu\.(cap\d|feed)$/.test(k);
  const unused = Object.keys(strings.en).filter((k) => !keys.has(k) && !built(k));
  assert.deepEqual(unused, []);
});

test('every role, domain kind and cut scope the samples produce has a word in both tables', () => {
  const { M, errors } = loadApp();
  const { analyse, invalidate } = M.compile;
  for (const key of Object.keys(SAMPLES)) {
    invalidate();
    const a = analyse(M.samples.makeSample(key));
    for (const c of a.doc.components) for (const l of ['hr', 'en']) assert.ok(`role.${c.role}` in strings[l], `${key}: role ${c.role}`);
    for (const d of a.doc.domains) for (const l of ['hr', 'en']) assert.ok(`kind.${d.kind}` in strings[l], `${key}: kind ${d.kind}`);
    for (const cut of a.services[0].cuts) {
      for (const l of ['hr', 'en']) {
        assert.ok(`scope1.${cut.scope}` in strings[l] && `scopeN.${cut.scope}` in strings[l], `${key}: scope ${cut.scope}`);
      }
    }
  }
  for (const a of M['engine/authorities'].IMPLICIT_AUTHORITIES) {
    for (const l of ['hr', 'en']) assert.ok(`auth.${a.kind}` in strings[l] && `authq.${a.kind}` in strings[l], a.kind);
    // The English table says what the engine says, so the English page reads as the original did.
    assert.equal(strings.en[`auth.${a.kind}`], a.name);
    assert.equal(strings.en[`authq.${a.kind}`], a.question);
  }
  assert.deepEqual(errors, []);
});

// ── samples (the preset entries) ──

test('sim.json entries are the five samples, by the app\'s own ?sample= keys', () => {
  const { M } = loadApp();
  assert.deepEqual(Object.keys(M.samples.SAMPLES), Object.keys(SAMPLES));
  assert.deepEqual(entry.entries.map((x) => [x.preset, x.query]),
    Object.entries(SAMPLES).map(([key, preset]) => [preset, `sample=${key}`]));
  assert.equal(M.samples.makeSample('no-such-sample'), null);
});

test('a sample is the same model in both languages, and so gives the same answer; only words change', () => {
  const { M } = loadApp();
  const { analyse, invalidate } = M.compile;
  const shape = (doc) => JSON.stringify({
    domains: doc.domains.map((d) => [d.id, d.kind, d.parent]),
    components: doc.components.map((c) => [c.id, c.role, c.domain, c.authorityKind]),
    deps: doc.deps, events: doc.events.map((e) => [e.id, e.hits]), settings: doc.settings,
  });
  // Cuts by event id; the order is compared as a set where the sort's last tie-break (the name) decides.
  const answer = (doc) => {
    invalidate();
    const s = analyse(doc).services[0];
    return { cuts: s.cuts.map((c) => c.events.map((e) => e.id).join('+')).sort(), searched: s.searched,
      drawn: s.drawnCuts.length, smallest: s.smallestDrawn && [s.smallestDrawn.size, s.smallestDrawn.scope, s.smallestDrawn.blastRadius] };
  };
  for (const key of Object.keys(SAMPLES)) {
    M.i18n.useLang('hr');
    const hr = M.samples.makeSample(key);
    const hrLabel = M.samples.SAMPLES[key].label;
    M.i18n.useLang('en');
    const en = M.samples.makeSample(key);
    assert.equal(shape(hr), shape(en), key);
    assert.deepEqual(answer(hr), answer(en), key);
    if (key !== 'sizeTwo') assert.notEqual(hrLabel, M.samples.SAMPLES[key].label, key);
  }
});

test('in English the samples read as the original: the names the app\'s checks look for are there', () => {
  const { M } = loadApp({ search: '?lang=en' });
  const names = (key) => {
    const d = M.samples.makeSample(key);
    return [...d.domains.map((x) => x.name), ...d.components.map((x) => x.name), ...d.events.map((x) => x.name)];
  };
  assert.ok(names('onePdu').includes('PDU A trips'));
  assert.ok(names('usEast1').includes('Route 53 control plane'));
  assert.ok(names('onePdu').includes('Server room'));
  M.i18n.useLang('hr');
  assert.ok(!names('onePdu').includes('Server room'));
});

// ── the one-pdu walk (preset correlated-failure: SPEC.md, docs/tasks/w3/correlated-failure.md) ──
// Tie-breaks first: the k-of-n boundary (exactly k up is up), the order of the two size-1 cuts (radius), and which step
// a state shows when the feed is hidden but its trip is still in the broken set. Then one test per rule, the preset's
// numbers per step, the walk's state helpers, the outline, and the page.

/** A value from the vm, as plain JSON in this realm (deepStrictEqual compares prototypes). */
const plain = (x) => JSON.parse(JSON.stringify(x));

/** onePdu at a walk step, analysed: { a, s (the service's result), cuts (by event id), down, walk, M }. */
function atStep(i, env = {}) {
  const { M, errors } = loadApp(env);
  const walk = M.walk.walkFor('onePdu');
  const st = M.walk.stepState(walk, i);
  M.compile.invalidate();
  const a = M.compile.analyse(M.walk.withFeed(M.samples.makeSample('onePdu'), walk, st.feed));
  const down = new Set();
  for (const e of a.universe) if (st.failed.has(e.id)) for (const h of e.hits) down.add(h);
  const s = a.services[0];
  const cuts = plain(s.cuts.map((c) => [c.size, c.events.map((e) => e.id).join('+'), c.blastRadius, c.drawn]));
  return { M, a, s, cuts, down, walk, st, errors };
}
const CUTS_DRAWING = [
  [1, 'ev:dom:dc', 4, true],
  [2, 'ev:comp:osd1+ev:comp:osd2', 2, true],
  [2, 'ev:comp:osd1+ev:comp:osd3', 2, true],
  [2, 'ev:comp:osd2+ev:comp:osd3', 2, true],
];

test('tie-break: k of n is up at exactly k (2 of 3 up serves), down at k - 1 (graph.js GATES.kofn, need = k)', () => {
  const { M, a } = atStep(0);
  const { evaluator } = M['engine/graph'];
  const up = (ids) => evaluator(a.graph, new Set(ids)).isUp('svc');
  assert.equal(up(['osd1']), true);
  assert.equal(up(['osd3']), true);
  assert.equal(up(['osd1', 'osd2']), false);
  assert.equal(up(['osd2', 'osd3']), false);
  assert.deepEqual({ ...M.walk.voteCount(a.graph, new Set(['osd2']), 'svc') }, { live: 2, of: 3, need: 2 });
  assert.deepEqual({ ...M.walk.voteCount(a.graph, new Set(['osd1', 'osd2']), 'svc') }, { live: 1, of: 3, need: 2 });
});

test('tie-break: of the two size-1 cuts, PDU A (radius 2) lists before the server room (radius 4)', () => {
  const { s } = atStep(1);
  const ones = s.cuts.filter((c) => c.size === 1);
  assert.deepEqual(plain(ones.map((c) => [c.events[0].id, c.blastRadius])), [['ev:evt:pdu-a', 2], ['ev:dom:dc', 4]]);
  assert.equal(s.smallestDrawn.blastRadius, 2);
  assert.equal(s.smallestDrawn.scope, 'correlated');
});

test('tie-break: a trip without the feed drawn is no trip; stepOf ignores what else the user broke', () => {
  const { M, walk } = atStep(0);
  const { stepOf, tripId } = M.walk;
  assert.equal(stepOf(walk, { feed: false, failed: new Set([tripId(walk)]) }), 0);
  assert.equal(stepOf(walk, { feed: true, failed: new Set() }), 1);
  assert.equal(stepOf(walk, { feed: true, failed: new Set([tripId(walk)]) }), 2);
  assert.equal(stepOf(walk, { feed: true, failed: new Set(['ev:comp:osd3']) }), 1);
  assert.equal(stepOf(walk, { feed: false, failed: new Set(['ev:comp:osd1', 'ev:comp:osd2']) }), 0);
});

test('rule 2: PDU A takes down every component in the domains it hits (Rack 1, Rack 2: osd-1, osd-2), not Rack 3', () => {
  const { a } = atStep(1);
  const pdu = a.universe.find((e) => e.id === 'ev:evt:pdu-a');
  assert.deepEqual([...pdu.hits].sort(), ['osd1', 'osd2']);
  assert.deepEqual(plain(a.doc.events.find((e) => e.id === 'pdu-a').hits), ['r1', 'r2']);
});

test('rule 3: every cut is minimal: it takes the service down, and without any one of its events the service serves', () => {
  for (const i of [0, 1]) {
    const { M, a, s } = atStep(i);
    const { evaluator } = M['engine/graph'];
    const byId = new Map(a.universe.map((e) => [e.id, e]));
    const downBy = (ids) => { const d = new Set(); for (const id of ids) for (const h of byId.get(id).hits) d.add(h); return d; };
    for (const c of s.cuts) {
      const ids = c.events.map((e) => e.id);
      assert.equal(evaluator(a.graph, downBy(ids)).isUp('svc'), false, ids.join('+'));
      for (const drop of ids) assert.equal(evaluator(a.graph, downBy(ids.filter((x) => x !== drop))).isUp('svc'), true, `${ids} - ${drop}`);
    }
  }
});

test('rule 4, step 1 (the drawing): no feed event; the room is the only size-1 cut, then the three replica pairs', () => {
  const { a, cuts, s, down } = atStep(0);
  assert.ok(!a.universe.some((e) => e.kind === 'correlated'));
  assert.deepEqual(cuts, CUTS_DRAWING);
  assert.equal(s.searched, 7);
  assert.equal(down.size, 0);
  // A rack holds one replica, so "Rack n lost" and "osd-n fails" are one failure told twice (events.js dedupe): the
  // pair cuts are named by the replica.
  assert.ok(!a.universe.some((e) => e.id === 'ev:dom:r1'));
});

test('rule 4, step 2 (the feed drawn): PDU A joins at size 1, ahead of everything; the rest is unchanged', () => {
  const { cuts, s, down } = atStep(1);
  assert.deepEqual(cuts, [[1, 'ev:evt:pdu-a', 2, true], ...CUTS_DRAWING]);
  assert.equal(s.searched, 8);
  assert.equal(down.size, 0);
});

test('step 3 (PDU A trips): racks 1 and 2 down, 1 of 3 replicas up, 2 needed, the service down', () => {
  const { M, a, down } = atStep(2);
  assert.deepEqual([...down].sort(), ['osd1', 'osd2']);
  assert.deepEqual({ ...M.walk.voteCount(a.graph, down, 'svc') }, { live: 1, of: 3, need: 2 });
  assert.equal(M['engine/graph'].evaluator(a.graph, down).isUp('svc'), false);
});

test('the preset runs with the authorities off; with them on, six more size-1 cuts, none drawn, and the drawn ones stay', () => {
  const { M } = loadApp();
  const walk = M.walk.walkFor('onePdu');
  const doc = M.samples.makeSample('onePdu');
  assert.equal(doc.settings.authorities, false);
  M.compile.invalidate();
  const on = M.compile.analyse({ ...doc, settings: { ...doc.settings, authorities: true } }).services[0];
  assert.equal(on.implicitCuts.length, 6);
  assert.ok(on.implicitCuts.every((c) => c.size === 1 && !c.drawn));
  assert.deepEqual(plain(on.drawnCuts.map((c) => c.events.map((e) => e.id).join('+'))),
    plain(atStep(1).s.cuts.map((c) => c.events.map((e) => e.id).join('+'))));
  assert.ok(walk);
});

test('the walk: three steps, each a state the next one builds on; stepState and stepOf agree; steps clamp', () => {
  const { M, walk } = atStep(0);
  const { stepState, stepOf, clampStep, walkFor } = M.walk;
  assert.equal(walk.steps.length, 3);
  for (let i = 0; i < 3; i++) assert.equal(stepOf(walk, stepState(walk, i)), i);
  assert.deepEqual([-1, 0, 2, 3, 99, NaN, 1.7].map((i) => clampStep(walk, i)), [0, 0, 2, 2, 2, 0, 1]);
  assert.equal(walkFor('threeZone'), null);
  assert.equal(walkFor('nope'), null);
  // Every walk is on a sample, its feed is one of the sample's events, and its captions exist in both tables.
  for (const [key, w] of Object.entries(M.walk.WALKS)) {
    const doc = M.samples.makeSample(key);
    assert.ok(doc, key);
    assert.ok(doc.events.some((e) => e.id === w.feed), `${key}: ${w.feed}`);
    assert.ok(doc.components.some((c) => c.id === w.service && c.role === 'service'), key);
    for (const l of ['hr', 'en']) {
      for (let i = 1; i <= w.steps.length; i++) assert.ok(`${w.strings}.cap${i}` in strings[l], `${l} cap${i}`);
      for (const k of ['feed', 'toggle']) assert.ok(`${w.strings}.${k}` in strings[l], `${l} ${k}`);
    }
  }
});

test('withFeed leaves the sample alone: hidden means a copy without the event; feedHits only while drawn', () => {
  const { M, walk } = atStep(0);
  const doc = M.samples.makeSample('onePdu');
  const before = JSON.stringify(doc);
  const hidden = M.walk.withFeed(doc, walk, false);
  assert.equal(hidden.events.length, 0);
  assert.equal(M.walk.withFeed(doc, walk, true), doc);
  assert.equal(JSON.stringify(doc), before);
  assert.deepEqual(plain(M.walk.feedHits(doc, walk, true)), ['r1', 'r2']);
  assert.equal(M.walk.feedHits(doc, walk, false), null);
});

test('the same walk gives the same answer in both languages, step by step', () => {
  for (let i = 0; i < 3; i++) {
    const hr = atStep(i, { search: '?lang=hr' });
    const en = atStep(i, { search: '?lang=en' });
    assert.deepEqual(hr.cuts.map((c) => c.slice().sort()), en.cuts.map((c) => c.slice().sort()), `step ${i + 1}`);
    assert.deepEqual([...hr.down].sort(), [...en.down].sort());
    assert.deepEqual(plain(hr.errors), []);
  }
});

test('the feed outline: one dotted frame around Rack 1 and Rack 2 (not Rack 3), labelled; nothing without a feed', () => {
  const { M, a } = atStep(1, { search: '?lang=en' });
  const { paintAll, paintFeed, layoutDoc } = M.render;
  const { boxes } = layoutDoc(a.doc);
  const plain = paintAll(a.doc).markup;
  assert.doesNotMatch(plain, /class="feed/);
  const svg = paintAll(a.doc, { feeds: [{ hits: ['r1', 'r2'], label: 'PDU A · not drawn' }] }).markup;
  assert.equal((svg.match(/<rect class="feed"/g) || []).length, 1);
  assert.match(svg, />PDU A · not drawn<\/text>/);
  const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((k) => Number(new RegExp(`<rect class="feed" [^>]*\\b${k}="([\\d.]+)"`).exec(svg)[1]));
  const inside = (b) => b.x >= x && b.y >= y && b.x + b.w <= x + w && b.y + b.h <= y + h;
  assert.ok(inside(boxes.get('r1')) && inside(boxes.get('r2')));
  assert.ok(!inside(boxes.get('r3')) && boxes.get('r3').x > x + w, 'Rack 3 is outside the frame');
  assert.equal(paintFeed({ hits: ['nope'], label: 'x' }, boxes), '');
  assert.match(M.render.CANVAS_CSS, /\.feed \{[^}]*stroke-dasharray/);
  for (const th of Object.values(M.render.THEMES)) assert.ok(th['--feed'], 'every theme defines --feed');
});

// ── import markers ──

test('the markers: data-sim is the folder name, meta matches sim.json, exceptions parse, the back link', async () => {
  const { metaFor } = await import('../../lib/manifest.mjs');
  assert.match(html, new RegExp(`<html lang="hr" data-sim="${ID}">`));
  assert.equal(entry.id, ID);
  assert.equal(entry.origin, ID);
  const meta = /id="simdeck-meta">(.*)<\/script>/.exec(html);
  assert.deepEqual(JSON.parse(meta[1]), metaFor(entry));
  const exc = JSON.parse(/id="simdeck-exceptions">(.*)<\/script>/.exec(html)[1]);
  assert.ok(exc.some((x) => x.rule === 'kit'));
  assert.ok(!('languages' in entry), 'both languages: no single-language exception');
  assert.match(html, /<a class="sd-back" data-sd-back href="\.\.\/\.\.\/index\.html"/);
});

// ── the app's own checks ──

test('the app\'s own checks pass: node tests/run.mjs (47)', () => {
  const r = spawnSync(process.execPath, [path.join(DIR, 'tests', 'run.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n'));
  const m = /(\d+)\/(\d+) passed/.exec(r.stdout);
  assert.ok(m && m[1] === m[2] && Number(m[1]) >= 47, r.stdout.slice(-200));
});

// ── in a browser ──

test('every sample opens in Chromium from file:// in hr and en; events and cuts break; no error or missing string', async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const url = pathToFileURL(path.join(DIR, 'index.html')).href;
  try {
    for (const lang of ['hr', 'en']) {
      for (const key of Object.keys(SAMPLES)) {
        const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
        await page.goto(`${url}?lang=${lang}&sample=${key}`);
        await page.waitForFunction(() => document.querySelector('#verdict')?.className === 'up');
        assert.equal(await page.evaluate(() => document.documentElement.lang), lang);
        assert.equal(await page.inputValue('#sample-picker'), key, `${lang} ${key}: picker`);
        assert.equal(await page.evaluate(() => document.title), strings[lang]['ui.pageTitle']);
        // Breaking the first cut takes the service down, and the canvas marks what is down in words too.
        await page.click('#cutset-panel [data-cut]');
        await page.waitForFunction(() => document.querySelector('#verdict').className === 'down');
        assert.ok((await page.evaluate(() => document.querySelector('#canvas').textContent)).includes('✕ '), `${lang} ${key}: no ✕ on what is down`);
        await page.click('#reset');
        await page.waitForFunction(() => document.querySelector('#verdict').className === 'up');
        // Every event on the rail toggles on and off.
        const n = await page.locator('#event-list [data-ev]').count();
        assert.ok(n > 2, `${lang} ${key}: ${n} events`);
        await page.locator('#event-list [data-ev]').last().click();
        assert.equal(await page.locator('#event-list .ev.on').count(), 1);
        await page.locator('#event-list [data-ev]').last().click();
        assert.equal(await page.locator('#event-list .ev.on').count(), 0);
        // Search sizes and hiding the authorities re-run the analysis.
        await page.selectOption('#max-size', '1');
        await page.uncheck('#toggle-auth');
        await page.check('#toggle-auth');
        const text = await page.evaluate(() => document.body.innerText + document.querySelector('#canvas').textContent);
        assert.doesNotMatch(text, /\b(ui|ev|cut|hl|st|scope1|scopeN|role|kind|cv|auth|authq|s)\.[a-zA-Z]+\b(?!\.)/, `${lang} ${key}: a raw key on the page`);
        if (lang === 'hr') {
          // The words the original wrote in English, and the engine still does, are gone from the Croatian page.
          for (const w of [' lost', 'Membership', 'Not drawn', 'not drawn', 'Single points', ' hit', 'searched', 'Server room']) {
            assert.ok(!text.includes(w), `${key}: "${w}" on the Croatian page`);
          }
        }
        assert.deepEqual(errors, [], `${lang} ${key}`);
        await ctx.close();
      }
    }
    // The language button keeps the sample; ?theme= and the OS pick the theme.
    const page = await browser.newPage();
    await page.goto(`${url}?lang=hr&sample=onePdu`);
    await page.click('#btn-lang');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(page.url(), /sample=onePdu/);
    assert.equal(await page.inputValue('#sample-picker'), 'onePdu');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${url}?lang=en`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.equal(await page.evaluate(() => document.querySelector('#canvas').style.getPropertyValue('--paper')), '#0f172a');
    await page.goto(`${url}?lang=en&theme=light`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${url}?lang=en&theme=dark`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  } finally {
    await browser.close();
  }
});

test('the one-pdu walk in Chromium, hr and en: keys and buttons, the feed toggle, ?step=, fit, phone, the language switch', async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const url = pathToFileURL(path.join(DIR, 'index.html')).href;
  const state = (page) => page.evaluate(() => ({
    step: window.FL.step,
    label: document.querySelector('#walk-step').textContent,
    caption: document.querySelector('#walk-caption').textContent,
    verdict: document.querySelector('#verdict').className,
    count: document.querySelector('#walk-count').textContent,
    countClass: document.querySelector('#walk-count').className,
    feed: document.querySelector('#walk-feed').checked,
    auth: document.querySelector('#toggle-auth').checked,
    firstCut: document.querySelector('#cutset-panel [data-cut] .cut-names')?.textContent,
    firstSize: document.querySelector('#cutset-panel [data-cut] .cut-size')?.textContent,
    rail: document.querySelector('#event-list').textContent,
    outline: document.querySelectorAll('#canvas rect.feed').length,
    canvas: document.querySelector('#canvas').textContent,
    prevOff: document.querySelector('#walk-prev').getAttribute('aria-disabled'),
    nextOff: document.querySelector('#walk-next').getAttribute('aria-disabled'),
    fits: document.scrollingElement.scrollHeight <= innerHeight && document.scrollingElement.scrollWidth <= innerWidth,
  }));
  try {
    for (const lang of ['hr', 'en']) {
      const T = strings[lang];
      const fill = (k, v) => T[k].replace(/\{(\w+)\}/g, (_, x) => v[x]);
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
      await page.goto(`${url}?lang=${lang}&sample=onePdu`);
      await page.waitForFunction(() => document.querySelector('#verdict')?.className === 'up');
      // Step 1: the drawing. No feed on the rail or the canvas; the room is the one size-1 cut; authorities off.
      let s = await state(page);
      assert.equal(await page.isVisible('#walk'), true);
      assert.equal(s.step, 0);
      assert.equal(s.label, fill('walk.step', { i: 1, n: 3 }));
      assert.equal(s.caption, T['walk.onePdu.cap1']);
      assert.equal(s.feed, false);
      assert.equal(s.auth, false, 'the preset runs with the authorities off');
      assert.equal(s.outline, 0);
      assert.ok(!s.rail.includes(T['s.onePdu.event']));
      assert.equal(s.firstCut, fill('ev.domainLost', { name: T['s.serverRoom'] }));
      assert.equal(s.count, fill('walk.count', { live: 3, of: 3, need: 2 }));
      assert.equal(s.prevOff, 'true');
      assert.equal(s.fits, true, `${lang} step 1: page scrolls at 1920x1080`);
      // ← at step 1 does nothing (aria-disabled); → draws the feed.
      await page.keyboard.press('ArrowLeft');
      assert.equal((await state(page)).step, 0);
      await page.keyboard.press('ArrowRight');
      s = await state(page);
      assert.equal(s.step, 1);
      assert.equal(s.caption, T['walk.onePdu.cap2']);
      assert.equal(s.feed, true);
      assert.equal(s.outline, 1);
      assert.ok(s.canvas.includes(T['walk.onePdu.feed']));
      assert.equal(s.firstCut, T['s.onePdu.event']);
      assert.equal(s.firstSize, '1');
      assert.ok(s.rail.includes(T['s.onePdu.event']));
      assert.equal(s.verdict, 'up');
      // PgDn: PDU A trips.
      await page.keyboard.press('PageDown');
      s = await state(page);
      assert.equal(s.step, 2);
      assert.equal(s.caption, T['walk.onePdu.cap3']);
      assert.equal(s.verdict, 'down');
      assert.equal(s.count, fill('walk.count', { live: 1, of: 3, need: 2 }));
      assert.equal(s.countClass, 'down');
      assert.equal(s.nextOff, 'true');
      assert.equal((s.canvas.match(/✕ /g) || []).length, 2, 'two replicas marked down');
      assert.equal(s.fits, true, `${lang} step 3: page scrolls at 1920x1080`);
      await page.click('#walk-next', { force: true }); // aria-disabled: it keeps the focus and does nothing
      assert.equal((await state(page)).step, 2);
      // Home, End, the buttons.
      await page.keyboard.press('Home');
      assert.equal((await state(page)).step, 0);
      await page.keyboard.press('End');
      assert.equal((await state(page)).step, 2);
      await page.click('#walk-prev');
      s = await state(page);
      assert.equal(s.step, 1);
      assert.equal(s.verdict, 'up');
      // The step follows the state: break PDU A from the cut list (step 3); hide the feed by hand (step 1, repaired);
      // draw it again (step 2, still whole).
      await page.click('#cutset-panel [data-cut]');
      assert.equal((await state(page)).step, 2);
      await page.uncheck('#walk-feed');
      s = await state(page);
      assert.deepEqual([s.step, s.verdict, s.outline], [0, 'up', 0]);
      await page.check('#walk-feed');
      s = await state(page);
      assert.deepEqual([s.step, s.verdict, s.outline], [1, 'up', 1]);
      // A select keeps its arrows.
      await page.focus('#max-size');
      await page.keyboard.press('ArrowRight');
      assert.equal((await state(page)).step, 1);
      // ?step= opens at a step; nonsense opens at 1.
      await page.goto(`${url}?lang=${lang}&sample=onePdu&step=3`);
      s = await state(page);
      assert.deepEqual([s.step, s.verdict], [2, 'down']);
      await page.goto(`${url}?lang=${lang}&sample=onePdu&step=x`);
      assert.equal((await state(page)).step, 0);
      // Another sample: no walk, the authorities box back on, the keys leave the page alone.
      await page.selectOption('#sample-picker', 'threeZone');
      assert.equal(await page.isVisible('#walk'), false);
      assert.equal((await state(page)).auth, true);
      await page.locator('#event-list [data-ev]').first().focus();
      await page.keyboard.press('End');
      assert.equal(await page.locator('#event-list .ev.on').count(), 0);
      // Phone: no sideways scroll with the walk bar.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${url}?lang=${lang}&sample=onePdu&step=2`);
      assert.ok(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), `${lang}: phone scrolls sideways`);
      assert.deepEqual(errors, [], lang);
      await ctx.close();
    }
    // The language button keeps the sample and the step.
    const page = await browser.newPage();
    await page.goto(`${url}?lang=hr&sample=onePdu&step=2`);
    await page.click('#btn-lang');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(page.url(), /step=2/);
    assert.equal(await page.evaluate(() => window.FL.step), 1);
  } finally {
    await browser.close();
  }
});
