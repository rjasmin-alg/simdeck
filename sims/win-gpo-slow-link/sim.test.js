// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-slow-link: the rules of SPEC.md (tie-breaks first), then the presets, then the generic block.
// Run: node --test sims/win-gpo-slow-link/sim.test.js
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
const idx = (kbps) => { const i = logic.SPEEDS.indexOf(kbps); assert.ok(i >= 0, `${kbps} is on the ladder`); return i; };
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const now = (s) => Object.fromEntries(s.rows.map((r) => [r.id, r.now]));
const ids = (s, k) => s.rows.filter((r) => r.now === k).map((r) => r.id);

const ALL = [];
for (let speed = 0; speed < logic.SPEEDS.length; speed++) {
  for (let th = 0; th <= logic.MAX_THRESHOLD; th += logic.THRESHOLD_STEP) {
    for (const allowScripts of [false, true]) for (const pass of logic.PASSES) ALL.push(P({ speed, thresholdKbps: th, allowScripts, pass }));
  }
}

// ── tie-breaks first ──

test('T1: a speed equal to the threshold is fast', () => {
  assert.equal(logic.isSlow(500, 500), false);
  assert.equal(logic.isSlow(499, 500), true);
  const s = at({ speed: idx(500), thresholdKbps: 500 });
  assert.equal(s.slow, false);
  assert.equal(s.equal, true);
  assert.equal(s.count.ran, 9);
  // and one notch slower is slow
  assert.equal(at({ speed: idx(384), thresholdKbps: 500 }).slow, true);
  // equal at a higher threshold too
  assert.equal(at({ speed: idx(2000), thresholdKbps: 2000 }).slow, false);
  assert.equal(at({ speed: idx(2000), thresholdKbps: 2100 }).slow, true);
});

test('T2: threshold 0 is never slow, even at the slowest notch', () => {
  assert.equal(logic.isSlow(0, 0), false);
  const s = at({ speed: 0, thresholdKbps: 0 });
  assert.equal(s.speedKbps, 56);
  assert.equal(s.slow, false);
  assert.equal(s.detection, false);
  assert.equal(s.equal, false);
  assert.equal(s.count.ran, 9);
});

test('T3: not in this pass wins over skipped for a slow link', () => {
  const s = at({ speed: idx(384), pass: 'background' });
  assert.equal(s.slow, true);
  assert.equal(now(s).folders, 'notInPass');
  assert.equal(now(s).software, 'notInPass');
  assert.deepEqual(ids(s, 'skipped'), ['scripts', 'quotas']);
  assert.equal(logic.outcome(logic.cse('folders'), true, 'background', {}), 'notInPass');
});

// ── rules ──

test('rule 1: slower than the threshold is slow; the default threshold is 500', () => {
  assert.equal(logic.defaults.thresholdKbps, 500);
  assert.equal(logic.DEFAULT_THRESHOLD, 500);
  assert.equal(at({ speed: idx(384) }).slow, true);
  assert.equal(at({ speed: idx(768) }).slow, false);
  assert.equal(at({ speed: idx(2000), thresholdKbps: 5000 }).slow, true);
  assert.equal(at({ speed: idx(200000), thresholdKbps: 5000 }).slow, false);
  for (const p of ALL) {
    const s = logic.initial(p);
    assert.equal(s.slow, p.thresholdKbps > 0 && logic.SPEEDS[p.speed] < p.thresholdKbps);
  }
});

test('rule 1: a fast link runs every extension in a foreground pass', () => {
  for (const p of ALL.filter((x) => x.pass === 'foreground')) {
    const s = logic.initial(p);
    if (!s.slow) assert.equal(s.count.ran, 9, JSON.stringify(p));
  }
});

test('rule 2: Administrative Templates and Security always run, and cannot be turned off', () => {
  for (const p of ALL) {
    const n = now(logic.initial(p));
    assert.equal(n.registry, 'ran');
    assert.equal(n.security, 'ran');
  }
  const off = { registry: false, security: false };
  assert.equal(logic.outcome(logic.cse('registry'), true, 'foreground', off), 'ran');
  assert.equal(logic.outcome(logic.cse('security'), true, 'foreground', off), 'ran');
  const s = at({});
  assert.equal(s.rows[0].setting, 'always');
  assert.equal(s.rows[1].setting, 'always');
  assert.ok(!('registry' in s.allowSlow) && !('security' in s.allowSlow));
});

test('rule 3: EFS recovery, IP security and Drive Maps run on a slow link by default, and can be turned off', () => {
  const s = at({ speed: idx(384) });
  for (const id of ['efs', 'ipsec', 'drivemaps']) {
    assert.equal(now(s)[id], 'ran', id);
    assert.equal(logic.outcome(logic.cse(id), true, 'foreground', { [id]: false }), 'skipped', id);
  }
});

test('rule 4: Scripts, Folder Redirection, Software Installation and Disk Quotas are skipped on a slow link by default', () => {
  const s = at(preset('vpn-384k'));
  assert.deepEqual(ids(s, 'skipped'), ['scripts', 'folders', 'software', 'quotas']);
  assert.deepEqual(ids(s, 'ran'), ['registry', 'security', 'efs', 'ipsec', 'drivemaps']);
  assert.equal(logic.outcome(logic.cse('quotas'), true, 'foreground', {}), 'skipped');
});

test('rule 5: allow across a slow link turns rule 4 off for that extension only', () => {
  const s = at({ speed: idx(384), allowScripts: true });
  assert.equal(now(s).scripts, 'ran');
  assert.deepEqual(ids(s, 'skipped'), ['folders', 'software', 'quotas']);
  assert.equal(s.rows.find((r) => r.id === 'scripts').setting, 'allowed');
  assert.equal(at({}).rows.find((r) => r.id === 'scripts').setting, 'notAllowed');
  for (const id of ['folders', 'software', 'quotas']) {
    assert.equal(logic.outcome(logic.cse(id), true, 'foreground', { [id]: true }), 'ran', id);
  }
  // on a fast link it changes nothing
  assert.deepEqual(now(at({ allowScripts: true })), now(at({ allowScripts: false })));
});

test('rule 6: Software Installation and Folder Redirection are not in a background refresh, whatever the speed', () => {
  for (const p of ALL.filter((x) => x.pass === 'background')) {
    const s = logic.initial(p);
    assert.equal(now(s).folders, 'notInPass');
    assert.equal(now(s).software, 'notInPass');
    assert.equal(s.count.notInPass, 2);
  }
  for (const p of ALL.filter((x) => x.pass === 'foreground')) assert.equal(logic.initial(p).count.notInPass, 0);
  const fast = at({ pass: 'background' });
  assert.deepEqual(ids(fast, 'ran'), ['registry', 'security', 'efs', 'ipsec', 'scripts', 'quotas', 'drivemaps']);
});

test('each row has its fast and slow column, and now is the column of the current link', () => {
  for (const p of ALL) {
    const s = logic.initial(p);
    for (const r of s.rows) assert.equal(r.now, s.slow ? r.slow : r.fast);
    assert.equal(s.count.ran + s.count.skipped + s.count.notInPass, 9);
  }
});

// ── presets (SPEC.md, "Expected numbers") ──

test('presets give the expected numbers', () => {
  const want = {
    'branch-200mb': [200000, 500, false, 9, 0],
    'vpn-384k': [384, 500, true, 5, 4],
    'threshold-0': [384, 0, false, 9, 0],
    'allow-scripts': [384, 500, true, 6, 3]
  };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const [id, [kbps, th, slow, ran, skipped]] of Object.entries(want)) {
    const s = at(preset(id));
    assert.equal(s.speedKbps, kbps, id);
    assert.equal(s.thresholdKbps, th, id);
    assert.equal(s.slow, slow, id);
    assert.equal(s.count.ran, ran, id);
    assert.equal(s.count.skipped, skipped, id);
  }
});

test('flipped names the rows whose outcome changed', () => {
  assert.deepEqual(logic.flipped(at(preset('branch-200mb')), at(preset('vpn-384k'))), ['scripts', 'folders', 'software', 'quotas']);
  assert.deepEqual(logic.flipped(at(preset('vpn-384k')), at(preset('allow-scripts'))), ['scripts']);
  assert.deepEqual(logic.flipped(at(preset('vpn-384k')), at(preset('threshold-0'))), ['scripts', 'folders', 'software', 'quotas']);
  assert.deepEqual(logic.flipped(null, at({})), []);
  assert.deepEqual(logic.flipped(at({}), at({ speed: idx(500000) })), []);
});

test('params are normalised: out of range and unknown values fall back', () => {
  assert.deepEqual(logic.norm({ speed: 99, thresholdKbps: -5, allowScripts: 'yes', pass: 'nope' }),
    { speed: logic.SPEEDS.length - 1, thresholdKbps: 0, allowScripts: false, pass: 'foreground' });
  assert.equal(logic.norm({ speed: 'x' }).speed, logic.defaults.speed);
  assert.equal(logic.norm({ thresholdKbps: 9000 }).thresholdKbps, logic.MAX_THRESHOLD);
  assert.equal(logic.SPEEDS[logic.defaults.speed], 200000);
});

test('params: bad, fractional and empty values fall back to the defaults or round', () => {
  assert.equal(logic.initial({}).thresholdKbps, 500);
  assert.equal(logic.initial({}).speedKbps, 200000);
  assert.equal(logic.norm({ thresholdKbps: 'x' }).thresholdKbps, 500);
  assert.equal(logic.norm({ thresholdKbps: null }).thresholdKbps, 500, 'null does not turn detection off');
  assert.equal(logic.norm({ thresholdKbps: '' }).thresholdKbps, 500);
  assert.equal(logic.norm({ speed: null }).speed, logic.defaults.speed);
  assert.equal(logic.norm({ speed: 3.4 }).speed, 3);
  assert.equal(logic.norm({ thresholdKbps: 449.6 }).thresholdKbps, 450);
  assert.equal(logic.initial({ speed: 3.4 }).speedKbps, 384);
});

test('the threshold slider: 0 to 5000 in steps of 100; passes in page order', () => {
  assert.equal(logic.MAX_THRESHOLD, 5000);
  assert.equal(logic.THRESHOLD_STEP, 100);
  assert.deepEqual(logic.PASSES, ['foreground', 'background']);
});

test('the slow-link defaults also hold with no allow settings at all', () => {
  for (const id of ['efs', 'ipsec', 'drivemaps']) assert.equal(logic.outcome(logic.cse(id), true, 'foreground', {}), 'ran', id);
  for (const id of ['scripts', 'folders', 'software', 'quotas']) assert.equal(logic.outcome(logic.cse(id), true, 'foreground', {}), 'skipped', id);
  assert.equal(logic.outcome(logic.cse('scripts'), true, 'foreground', undefined), 'skipped');
});

test('flipped ignores a setting change that does not change the outcome', () => {
  assert.deepEqual(logic.flipped(at({}), at({ allowScripts: true })), [], 'on a fast link allowing Scripts changes nothing');
});

test('the speed ladder is increasing, holds the preset values and spans 56 kbit/s to 1 Gbit/s', () => {
  for (let i = 1; i < logic.SPEEDS.length; i++) assert.ok(logic.SPEEDS[i] > logic.SPEEDS[i - 1]);
  for (const v of [384, 500, 200000]) assert.ok(logic.SPEEDS.includes(v));
  assert.equal(logic.SPEEDS[0], 56);
  assert.equal(logic.SPEEDS.at(-1), 1000000);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of ALL) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('allow-scripts'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset and extension is named in both tables; the page is an explorer', () => {
  for (const lang of ['hr', 'en']) {
    for (const p of logic.presets) {
      for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
    for (const c of logic.CSES) assert.ok(strings[lang]['cse_' + c.id], `${lang} cse_${c.id}`);
    for (const k of ['ran', 'skipped', 'notInPass']) assert.ok(strings[lang]['res_' + k], `${lang} res_${k}`);
    for (const k of ['always', 'allowed', 'notAllowed']) assert.ok(strings[lang]['set_' + k], `${lang} set_${k}`);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
