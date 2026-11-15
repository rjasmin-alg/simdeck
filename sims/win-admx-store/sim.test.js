// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-admx-store: the rules of SPEC.md (tie-breaks first), then the presets' views, then the generic block.
// Run: node --test sims/win-admx-store/sim.test.js
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
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const ed = (s, id) => s.editors.find((e) => e.admin === id);
// a row as one short code: ✓ + language (+ "fb" when it fell back), ? extra, ✕ error
const code = (r) => r.show === 'extra' ? '?' : r.show === 'error' ? 'X' : (r.adml.fallback ? 'fb' : r.adml.lang.slice(0, 2));
const view = (s, id) => ed(s, id).rows.map(code);

const ALL = [];
for (const store of logic.STORES) for (const uiLang of logic.LANGS) for (const hrAdml of logic.HR_ADML) ALL.push(P({ store, uiLang, hrAdml }));

// ── tie-breaks first ──

test('tie-break rule 3: the Central Store wins over a newer local folder', () => {
  const s = at({ store: 'old' });
  assert.equal(ed(s, 'A').localSet, 'new');
  assert.equal(ed(s, 'A').from, 'store');
  assert.equal(ed(s, 'A').set, 'old');
  assert.deepEqual(view(s, 'A'), ['en', 'en', '?'], 'LAPS.admx is in ADM-A\'s local folder, but the editor reads the store');
});

test('tie-break rule 4: a missing ADMX is decided before any language question', () => {
  // older store, hr-HR editor, no hr-HR folder: value 3 is extra (no LAPS.admx), not an ADML error or a fallback
  const s = at({ store: 'old', uiLang: 'hr-HR', hrAdml: 'none' });
  const r = ed(s, 'A').rows[2];
  assert.equal(r.show, 'extra');
  assert.equal(r.adml, null);
  assert.equal(r.admxRev, null);
});

test('tie-break rule 4: an ADMX older than the value needs counts as missing', () => {
  const loc = { kind: 'local', set: 'old', langs: { 'en-US': 'old' } };
  const r = logic.row(loc, { id: 'x', admx: 'System', needs: 2 }, 'en-US');
  assert.equal(r.show, 'extra');
  assert.equal(r.admxRev, 1);
  assert.equal(logic.row(loc, { id: 'x', admx: 'System', needs: 1 }, 'en-US').show, 'named');
  // even when the ADML would fail (a newer hr-HR ADML), an ADMX too old for the value is decided first
  assert.equal(logic.row({ set: 'old', langs: { 'en-US': 'old', 'hr-HR': 'new' } }, { id: 'x', admx: 'System', needs: 2 }, 'hr-HR').show, 'extra');
  assert.equal(logic.adml({ set: 'old', langs: { 'en-US': 'old' } }, 'LAPS', 'en-US').reason, 'no-admx');
});

test('tie-break rule 5b: an ADML of the wrong revision is an error, not a reason to fall back', () => {
  const s = at({ store: 'new', uiLang: 'hr-HR', hrAdml: 'old' });
  const r = ed(s, 'A').rows[0];
  assert.equal(r.show, 'error');
  assert.deepEqual(r.adml, { ok: false, lang: 'hr-HR', set: 'old', reason: 'revision', has: 1, wants: 2 },
    'en-US has the matching System.adml, but the hr-HR one is found first');
});

test('tie-break rule 5d: an en-US editor never falls back', () => {
  const loc = { kind: 'store', set: 'new', langs: { 'hr-HR': 'new' } };
  const a = logic.adml(loc, 'System', 'en-US');
  assert.equal(a.ok, false);
  assert.equal(a.reason, 'missing');
});

test('tie-break rule 5c: the fallback ADML must match too, else the file fails to load', () => {
  const loc = { kind: 'store', set: 'new', langs: { 'en-US': 'old' } };
  assert.deepEqual(logic.adml(loc, 'System', 'hr-HR'), { ok: false, lang: 'en-US', set: 'old', reason: 'revision', has: 1, wants: 2 });
  assert.deepEqual(logic.adml(loc, 'LAPS', 'hr-HR'), { ok: false, lang: 'hr-HR', set: null, reason: 'missing', wants: 1 });
  assert.equal(logic.adml(loc, 'AutoPlay', 'hr-HR').fallback, true, 'AutoPlay is the same revision in both sets');
});

// ── rules ──

test('rule 1: the client applies all three values in every combination of params', () => {
  for (const p of ALL) assert.deepEqual(at(p).client, ['cmd', 'autoplay', 'laps']);
  assert.deepEqual(logic.VALUES.map((v) => v.id), ['cmd', 'autoplay', 'laps']);
});

test('rule 2: without a Central Store each editor reads its own local folder', () => {
  const s = at({ store: 'none' });
  for (const id of ['A', 'B']) {
    assert.equal(ed(s, id).from, 'local');
    assert.equal(ed(s, id).set, ed(s, id).localSet);
    assert.equal(ed(s, id).localIgnored, false);
    assert.equal(ed(s, id).path, logic.LOCAL_PATH);
  }
  assert.deepEqual(view(s, 'A'), ['en', 'en', 'en']);
  assert.deepEqual(view(s, 'B'), ['en', 'en', '?']);
  assert.equal(s.store, null);
});

test('rule 3: with a Central Store both editors read it only, and see the same', () => {
  for (const p of ALL.filter((q) => q.store !== 'none')) {
    const s = at(p);
    for (const id of ['A', 'B']) {
      assert.equal(ed(s, id).from, 'store');
      assert.equal(ed(s, id).set, p.store);
      assert.equal(ed(s, id).localIgnored, true);
      assert.equal(ed(s, id).path, logic.STORE_PATH);
    }
    assert.deepEqual(view(s, 'A'), view(s, 'B'), JSON.stringify(p));
  }
  assert.equal(logic.STORE_PATH, '\\\\quillmoor.example\\SYSVOL\\quillmoor.example\\Policies\\PolicyDefinitions');
});

test('rule 4: a value whose ADMX the source lacks is an extra registry setting; only LAPS is missing from the older set', () => {
  const s = at({ store: 'none' });
  const r = ed(s, 'B').rows[2];
  assert.equal(r.show, 'extra');
  assert.equal(r.admx, 'LAPS');
  assert.deepEqual(ed(s, 'B').count, { named: 2, extra: 1, error: 0, fallback: 0 });
  assert.deepEqual(Object.keys(logic.SETS.old), ['System', 'AutoPlay']);
  assert.deepEqual(Object.keys(logic.SETS.new), ['System', 'AutoPlay', 'LAPS']);
});

test('rule 5a: the editor\'s language folder with the matching ADML gives names in that language', () => {
  assert.deepEqual(view(at({ store: 'new', uiLang: 'hr-HR', hrAdml: 'match' }), 'A'), ['hr', 'hr', 'hr']);
  assert.deepEqual(view(at({ store: 'none', uiLang: 'hr-HR' }), 'B'), ['hr', 'hr', '?'], 'local folders hold their own hr-HR ADML');
});

test('rule 5c: no ADML in the editor\'s language falls back to en-US', () => {
  const s = at({ store: 'new', uiLang: 'hr-HR', hrAdml: 'none' });
  assert.deepEqual(view(s, 'A'), ['fb', 'fb', 'fb']);
  assert.deepEqual(ed(s, 'A').rows[0].adml, { ok: true, lang: 'en-US', set: 'new', fallback: true });
  assert.equal(ed(s, 'B').count.fallback, 3);
  // an older hr-HR copy has no LAPS.adml at all: that file falls back, the unchanged AutoPlay matches
  assert.deepEqual(view(at({ store: 'new', uiLang: 'hr-HR', hrAdml: 'old' }), 'B'), ['X', 'hr', 'fb']);
});

test('rule 5: the hr-HR folder of the store does not matter to an en-US editor', () => {
  for (const hrAdml of logic.HR_ADML) assert.deepEqual(view(at({ store: 'new', hrAdml }), 'A'), ['en', 'en', 'en']);
});

test('rule 5: without a store the hr-HR ADML param changes nothing', () => {
  for (const uiLang of logic.LANGS) {
    const base = at({ uiLang, hrAdml: 'none' });
    for (const hrAdml of logic.HR_ADML) assert.deepEqual(at({ uiLang, hrAdml }).editors, base.editors);
  }
});

test('rule 5: an older hr-HR copy in an older store is simply the matching one', () => {
  assert.deepEqual(at({ store: 'old', uiLang: 'hr-HR', hrAdml: 'old' }).editors, at({ store: 'old', uiLang: 'hr-HR', hrAdml: 'match' }).editors);
});

test('rule 5b: an error names the file that fails to load, once', () => {
  const s = at({ store: 'new', uiLang: 'hr-HR', hrAdml: 'old' });
  assert.deepEqual(ed(s, 'A').errors, ['System']);
  assert.deepEqual(ed(s, 'A').count, { named: 2, extra: 0, error: 1, fallback: 1 });
  const R = (show, admx) => ({ show, admx });
  assert.deepEqual(logic.errorFiles([R('error', 'System'), R('named', 'AutoPlay'), R('error', 'System'), R('error', 'LAPS')]), ['System', 'LAPS']);
});

test('rule 6: the store holds what was copied; ADM-A\'s newer local set never reaches it', () => {
  const s = at({ store: 'old' });
  assert.equal(s.store.set, 'old');
  assert.deepEqual(s.store.langs, { 'en-US': 'old' });
  assert.equal(logic.ADMINS.find((a) => a.id === 'A').set, 'new');
});

// ── the page's helpers ──

test('changedRows: the rows whose kind or language changed; none on load; selection does not count', () => {
  const a = at(preset('no-store')), b = at(preset('store-new'));
  assert.deepEqual(logic.changedRows(null, a), []);
  assert.deepEqual(logic.changedRows(a, b), ['B:laps']);
  assert.deepEqual(logic.changedRows(b, at({ store: 'new', sel: 'A:cmd' })), []);
  assert.deepEqual(logic.changedRows(b, at(preset('language'))), ['A:cmd', 'A:autoplay', 'A:laps', 'B:cmd', 'B:autoplay', 'B:laps']);
  assert.deepEqual(logic.changedRows(at(preset('language')), at(preset('stale-lang'))), ['A:cmd', 'A:autoplay', 'B:cmd', 'B:autoplay']);
});

test('situation: the first caption that applies (SPEC.md order)', () => {
  assert.deepEqual(at(preset('no-store')).situation, { kind: 'disagree', admin: 'B', value: 'laps', admx: 'LAPS' });
  assert.deepEqual(at(preset('store-new')).situation, { kind: 'storeSame' });
  assert.deepEqual(at(preset('store-old')).situation, { kind: 'storeOld', admin: 'A', value: 'laps', admx: 'LAPS' });
  assert.deepEqual(at(preset('language')).situation, { kind: 'fallback' });
  assert.deepEqual(at(preset('stale-lang')).situation, { kind: 'error', admin: 'A', file: 'System', both: true });
  assert.equal(at({ store: 'none', uiLang: 'hr-HR' }).situation.kind, 'disagree', 'no store, hr-HR: the local folders still differ');
  assert.equal(at({ store: 'old', uiLang: 'hr-HR' }).situation.kind, 'storeOld', 'an extra setting outranks a fallback');
  assert.equal(logic.situation({ store: null, editors: [ed(at({ store: 'new' }), 'A'), ed(at({ store: 'new' }), 'B')] }).kind, 'localSame');
});

test('norm and selection: unknown values fall back; a selection must name a row', () => {
  assert.deepEqual(logic.norm({ store: 'x', uiLang: 'de-DE', hrAdml: 1, sel: 'C:cmd' }), logic.defaults);
  assert.equal(logic.norm({ sel: 'A:nope' }).sel, '');
  assert.equal(logic.norm({ sel: 'B:laps' }).sel, 'B:laps');
  const s = at({ store: 'old', sel: 'A:laps' });
  const r = logic.selectedRow(s);
  assert.equal(r.editor.admin, 'A');
  assert.equal(r.row.show, 'extra');
  assert.equal(r.value.name, 'BackupDirectory');
  assert.equal(logic.selectedRow(at({})), null);
  assert.deepEqual(logic.selIds(), ['', 'A:cmd', 'A:autoplay', 'A:laps', 'B:cmd', 'B:autoplay', 'B:laps']);
});

// ── presets (SPEC.md table, checked by an independent script) ──

test('presets: the editors\' views of SPEC.md', () => {
  const want = {
    'no-store': [['en', 'en', 'en'], ['en', 'en', '?']],
    'store-new': [['en', 'en', 'en'], ['en', 'en', 'en']],
    'store-old': [['en', 'en', '?'], ['en', 'en', '?']],
    language: [['fb', 'fb', 'fb'], ['fb', 'fb', 'fb']],
    'stale-lang': [['X', 'hr', 'fb'], ['X', 'hr', 'fb']]
  };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const [id, [a, b]] of Object.entries(want)) {
    const s = at(preset(id));
    assert.deepEqual(view(s, 'A'), a, id + ' A');
    assert.deepEqual(view(s, 'B'), b, id + ' B');
  }
  assert.equal(at(preset('store-old')).selected, 'A:laps');
  assert.equal(at(preset('stale-lang')).selected, 'A:cmd');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of ALL) for (const sel of logic.selIds()) {
    const s = at(Object.assign({}, p, { sel }));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('stale-lang'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, value and situation is named in both tables; the page is an explorer', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const v of logic.VALUES) {
      assert.ok(strings[lang]['name_' + v.id + '_en'], `${lang} English name of ${v.id}`);
      assert.ok(strings[lang]['name_' + v.id + '_hr'], `${lang} Croatian name of ${v.id}`);
    }
    for (const k of ['error', 'disagree', 'storeOld', 'fallback', 'storeSame', 'localSame']) assert.ok(strings[lang]['cap_' + k], `${lang} cap_${k}`);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
