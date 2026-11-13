// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-functional-levels: one per SPEC.md rule, the tie-break first, then the template's generic block.
// Run: node --test sims/win-functional-levels/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
/** Run actions one after the other on params; returns the final params. */
function run(over, actions) {
  let p = P(over);
  for (const a of actions) p = Object.assign({}, p, logic.act(p, a));
  return p;
}
const set = (ladder, target) => ({ action: 'set', ladder, target });

// ── rule 6: tie-break first ──

test('rule 6: a forest raise blocked by both rules lists the DCs first, then the domains', () => {
  const c = logic.check(S({}), 'forest', '2016');
  assert.equal(c.ok, false);
  assert.deepEqual(c.dcs, ['qm-dc01', 'qm-dc02', 'brk-dc03', 'thf-dc01']);
  assert.deepEqual(c.domains, ['q', 'thf']);
});

test('rule 6: a new DC refused by both its domain and the forest names the domain', () => {
  // a 2025 DC at domain 2012 R2 and forest 2012 R2: the domain is checked first
  const s = S({ extraDc: '2025' });
  assert.equal(s.extra.joined, false);
  assert.equal(s.extra.refused, 'domain');
});

// ── rule 1: DCs bound the domain level ──

test('rule 1: the estate cannot raise quillmoor to 2016; all three DCs block it', () => {
  const c = logic.check(S(preset('quillmoor')), 'q', '2016');
  assert.equal(c.kind, 'raise');
  assert.equal(c.ok, false);
  assert.deepEqual(c.dcs, ['qm-dc01', 'qm-dc02', 'brk-dc03']);
  assert.deepEqual(c.domains, []);
});

test('rule 1: one DC left behind on 2012 R2 blocks the raise alone', () => {
  const c = logic.check(S(preset('old-dc-present')), 'q', '2016');
  assert.equal(c.ok, false);
  assert.deepEqual(c.dcs, ['brk-dc03']);
});

test('rule 1: DCs on 2022 allow 2016 but not 2025', () => {
  const s = S(preset('upgraded-dcs'));
  assert.equal(logic.check(s, 'q', '2016').ok, true);
  assert.deepEqual(logic.check(s, 'q', '2025').dcs, ['qm-dc01', 'qm-dc02', 'brk-dc03']);
});

test('rule 1: only the DCs of that domain count', () => {
  // thf-dc01 on 2012 R2 does not block quillmoor
  const c = logic.check(S({ o1: '2022', o2: '2022', o3: '2022' }), 'q', '2016');
  assert.equal(c.ok, true);
  assert.deepEqual(logic.check(S({ o1: '2022', o2: '2022', o3: '2022' }), 'thf', '2016').dcs, ['thf-dc01']);
});

test('rule 1: the support matrix (2019 and 2022 top out at 2016; 2025 runs only at 2016 and 2025)', () => {
  assert.deepEqual(logic.osesAt('2012R2'), ['2012R2', '2016', '2019', '2022']);
  assert.deepEqual(logic.osesAt('2016'), ['2016', '2019', '2022', '2025']);
  assert.deepEqual(logic.osesAt('2025'), ['2025']);
  assert.deepEqual(logic.osesAt('2003'), ['2003', '2008', '2008R2', '2012', '2012R2', '2016']);
  assert.equal(logic.LEVELS.indexOf('2019'), -1);
  assert.equal(logic.LEVELS.indexOf('2022'), -1);
});

// ── rule 2: forest at most the lowest domain ──

test('rule 2: the forest waits for the last domain', () => {
  const p = run(preset('upgraded-dcs'), [set('q', '2016')]);
  assert.equal(p.dq, '2016');
  const c = logic.check(logic.initial(p), 'forest', '2016');
  assert.equal(c.ok, false);
  assert.deepEqual(c.dcs, []);
  assert.deepEqual(c.domains, ['thf']);
  const p2 = run(p, [set('thf', '2016'), set('forest', '2016')]);
  assert.equal(p2.fl, '2016');
  assert.equal(p2.last, 'set:forest:2016:up');
});

test('rule 2: a domain cannot be lowered below the forest', () => {
  const c = logic.check(S({}), 'q', '2012');
  assert.equal(c.kind, 'lower');
  assert.equal(c.forest, true);
  assert.equal(c.rollback, null);
  assert.equal(c.ok, false);
  // after lowering the forest first, it can
  const p = run({}, [set('forest', '2012'), set('q', '2012')]);
  assert.equal(p.fl, '2012');
  assert.equal(p.dq, '2012');
  assert.equal(p.last, 'set:q:2012:down');
  assert.deepEqual(logic.initial(p).last, { action: 'set', ladder: 'q', target: '2012', ok: true, up: false });
});

test('rule 2: params with a domain below the forest are repaired by lowering the forest', () => {
  const s = S({ dq: '2008', fl: '2012R2' });
  assert.equal(s.forest, '2008');
});

// ── rule 3: one-way, with a little lowering ──

test('rule 3: forest lowering without the Recycle Bin: down to 2008, not 2003', () => {
  const s = S({});
  for (const l of ['2012', '2008R2', '2008']) assert.equal(logic.check(s, 'forest', l).ok, true, l);
  assert.equal(logic.check(s, 'forest', '2003').rollback, 'one-way');
  // both reasons apply below 2008 with the Recycle Bin on: one-way wins
  assert.equal(logic.check(S({ rb: 'on' }), 'forest', '2003').rollback, 'one-way');
});

test('rule 3: with the Recycle Bin on, the forest never goes below 2008 R2', () => {
  const s = S({ rb: 'on' });
  assert.equal(logic.check(s, 'forest', '2008R2').ok, true);
  assert.equal(logic.check(s, 'forest', '2008').rollback, 'recycle-bin');
  assert.equal(logic.check(S({ rb: 'on', fl: '2008R2', dq: '2008R2', dt: '2008R2' }), 'forest', '2008').rollback, 'recycle-bin');
  // the Recycle Bin rule is the forest's: a domain still goes to 2008
  assert.equal(logic.rollback('domain', '2012R2', '2008', true).ok, true);
});

test('rule 3: nothing documented from 2016 or 2025, and nothing below 2008 R2', () => {
  assert.equal(logic.rollback('domain', '2016', '2012R2', false).reason, 'undocumented');
  assert.equal(logic.rollback('forest', '2025', '2016', false).reason, 'undocumented');
  assert.equal(logic.rollback('domain', '2008', '2003', false).reason, 'one-way');
  assert.equal(logic.rollback('domain', '2008R2', '2008', false).ok, true);
  assert.equal(logic.floorOf('forest', '2012R2', false), '2008');
  assert.equal(logic.floorOf('forest', '2012R2', true), '2008R2');
  assert.equal(logic.floorOf('domain', '2016', false), '2016');
});

// ── rule 4: unlocks ──

test('rule 4: unlocks per level, domain and forest apart', () => {
  assert.deepEqual(logic.rung('forest', '2008R2').unlocks, ['recycleBin']);
  assert.deepEqual(logic.rung('q', '2008R2').unlocks, ['authAssurance', 'msaSpn']);
  assert.deepEqual(logic.rung('q', '2008').unlocks, ['dfsrSysvol', 'fgpp', 'aesKerberos']);
  assert.deepEqual(logic.rung('forest', '2016').unlocks, ['pam']);
  assert.deepEqual(logic.rung('q', '2016').unlocks, ['ntlmRolling', 'ntlmDevices', 'pkinitFreshness']);
  assert.deepEqual(logic.rung('q', '2012R2').unlocks, ['protectedUsers', 'authPolicies']);
  assert.deepEqual(logic.rung('q', '2012').unlocks, ['claimsArmoring']);
  assert.deepEqual(logic.rung('q', '2025').unlocks, ['page32k']);
  assert.deepEqual(logic.rung('thf', '2003').unlocks, ['lastLogon', 'constrainedDelegation', 'dcRename']);
  assert.deepEqual(logic.rung('forest', '2003').unlocks, ['forestTrust', 'domainRename']);
  for (const l of ['2008', '2012', '2012R2', '2025']) assert.deepEqual(logic.rung('forest', l).unlocks, [], l);
  for (const l of logic.LEVELS) assert.ok(logic.rung('q', l).unlocks.length > 0, l);
});

// ── rule 5: rules out ──

test('rule 5: a level rules out older and newer DC operating systems', () => {
  assert.deepEqual(logic.osesRuledOut('2012R2'), { below: ['2003', '2008', '2008R2', '2012'], above: ['2025'] });
  assert.deepEqual(logic.osesRuledOut('2016').above, []);
  assert.deepEqual(logic.osesRuledOut('2003').above, ['2019', '2022', '2025']);
  assert.deepEqual(logic.rung('q', '2016').rulesOut, ['frsSysvol']);
  assert.deepEqual(logic.rung('forest', '2016').rulesOut, ['frsSysvol']);
  assert.equal(S({ o1: '2025' }).dcs[0].fits, false);
  assert.equal(S({}).dcs[0].fits, true);
});

test('rule 5: a new DC is promoted only when its OS supports the levels', () => {
  assert.equal(S({ extraDc: '2012R2' }).extra.joined, true);
  assert.equal(S({ extraDc: '2016' }).extra.joined, true);
  const s = S({ extraDc: '2025' });
  assert.equal(s.extra.joined, false);
  assert.equal(s.extra.refusedAt, '2012R2');
  assert.equal(S({ extraDc: 'none' }).extra, null);
  // a promoted old DC blocks the raise as the fourth DC
  assert.deepEqual(logic.check(S({ extraDc: '2012R2' }), 'q', '2016').dcs, ['qm-dc01', 'qm-dc02', 'brk-dc03', 'qm-dc04']);
  // a refused one blocks nothing
  const up = run(preset('upgraded-dcs'), [set('q', '2016')]);
  const s2 = logic.initial(Object.assign({}, up, { extraDc: '2012R2' }));
  assert.equal(s2.extra.joined, false);
  assert.equal(s2.extra.refused, 'domain');
  assert.equal(logic.check(s2, 'q', '2025').dcs.indexOf('qm-dc04'), -1);
});

test('rule 5: a 2025 DC waits for the forest too', () => {
  const p = run(preset('upgraded-dcs'), [set('q', '2016'), set('thf', '2016')]);
  const s = logic.initial(Object.assign({}, p, { extraDc: '2025' }));
  assert.equal(s.extra.joined, false);
  assert.equal(s.extra.refused, 'forest');
  const p2 = run(p, [{ action: 'os', dc: 'qm-dc01', target: '2025' }]);
  assert.equal(p2.o1, '2022');
  assert.equal(p2.last, 'os:qm-dc01:2025:no');
  const p3 = run(p2, [set('forest', '2016'), { action: 'os', dc: 'qm-dc01', target: '2025' }]);
  assert.equal(p3.o1, '2025');
  assert.equal(p3.last, 'os:qm-dc01:2025:ok');
});

test('rule 5: replacing a DC with 2022 unblocks the raise', () => {
  const p = run(preset('old-dc-present'), [{ action: 'os', dc: 'brk-dc03', target: '2022' }, set('q', '2016')]);
  assert.equal(p.o3, '2022');
  assert.equal(p.dq, '2016');
});

// ── rule 7: Recycle Bin ──

test('rule 7: the Recycle Bin needs forest 2008 R2 and stays on', () => {
  assert.equal(logic.recycleBin(S({})).ok, true);
  assert.equal(logic.recycleBin(S({ fl: '2008', dq: '2008', dt: '2008' })).reason, 'forest-level');
  const p = run({}, [{ action: 'rb' }]);
  assert.equal(p.rb, 'on');
  assert.deepEqual(logic.act(p, { action: 'rb' }), {});
  const q = run({ fl: '2008', dq: '2008', dt: '2008' }, [{ action: 'rb' }]);
  assert.equal(q.rb, 'off');
  assert.equal(q.last, 'rb:on:no');
  assert.equal(logic.recycleBin(S({ fl: '2008R2', dq: '2012R2', dt: '2012R2' })).ok, true);
  assert.deepEqual(logic.initial(run({}, [{ action: 'rb' }])).last, { action: 'rb', ok: true });
  assert.deepEqual(logic.initial(q).last, { action: 'rb', ok: false });
  assert.equal(S({ last: 'rb:on:ok' }).last, null);
  assert.equal(S({ last: 'rb:on:no' }).last, null);
  // a stray rb=on below 2008 R2 is dropped
  assert.equal(S({ rb: 'on', fl: '2008', dq: '2008', dt: '2008' }).rb, false);
});

// ── rule 8: the last action ──

test('rule 8: a refused action changes only last and sel', () => {
  const before = P({});
  const patch = logic.act(before, set('q', '2016'));
  assert.deepEqual(patch, { last: 'set:q:2016:no', sel: 'q:2016' });
  assert.deepEqual(logic.initial(Object.assign({}, before, patch)).last, { action: 'set', ladder: 'q', target: '2016', ok: false, up: false });
});

test('rule 8: a stale last action is dropped', () => {
  // the success no longer matches (the level was changed by hand)
  assert.equal(S({ last: 'set:q:2016:up' }).last, null);
  assert.equal(S({ last: 'set:q:2016:ok' }).last, null);
  // the refusal no longer holds (the DCs were upgraded)
  assert.equal(S(Object.assign({}, preset('upgraded-dcs'), { last: 'set:q:2016:no' })).last, null);
  assert.notEqual(S({ last: 'set:q:2016:no' }).last, null);
  assert.equal(S({ last: 'nonsense' }).last, null);
  assert.equal(S({ last: 'os:qm-dc01:2022:ok' }).last, null);
  const up = { o1: '2022', o2: '2022', o3: '2022', o4: '2022', dq: '2016', dt: '2016' };
  assert.notEqual(S(Object.assign({}, up, { last: 'os:qm-dc01:2025:no' })).last, null);
  assert.equal(S(Object.assign({}, up, { fl: '2016', last: 'os:qm-dc01:2025:no' })).last, null);
  assert.deepEqual(logic.act(P({}), { action: 'os', dc: 'qm-dc01', target: '2025' }), { last: 'os:qm-dc01:2025:no', sel: 'dc:qm-dc01' });
});

test('rule 8: the current rung is no action', () => {
  assert.deepEqual(logic.act(P({}), set('q', '2012R2')), { sel: 'q:2012R2' });
});

test('rung states', () => {
  const s = S({});
  assert.equal(logic.rungState(s, 'q', '2012R2'), 'current');
  assert.equal(logic.rungState(s, 'q', '2008'), 'below');
  assert.equal(logic.rungState(s, 'q', '2016'), 'raise-no');
  assert.equal(logic.rungState(S(preset('upgraded-dcs')), 'q', '2016'), 'raise-ok');
});

test('every action result is a value of the hidden last param, every selection of sel', () => {
  const lv = logic.lastValues(), sv = logic.selValues();
  const p0 = P({});
  for (const l of logic.LADDERS) for (const v of logic.LEVELS) {
    const patch = logic.act(p0, set(l, v));
    if (patch.last) assert.ok(lv.includes(patch.last), patch.last);
    assert.ok(sv.includes(patch.sel), patch.sel);
  }
  for (const pr of logic.presets) if (pr.params.sel) assert.ok(sv.includes(pr.params.sel));
  for (const x of logic.DCS) for (const o of logic.REPLACE_WITH) {
    const pt = logic.act(P({}), { action: 'os', dc: x.id, target: o });
    assert.ok(lv.includes(pt.last), pt.last);
    assert.ok(sv.includes(pt.sel), pt.sel);
  }
  assert.ok(lv.includes(logic.act(P({}), { action: 'rb' }).last));
  assert.ok(sv.includes('dc:' + logic.EXTRA.id));
});

test('a selected DC that no longer exists is no selection', () => {
  assert.equal(S({ sel: 'dc:qm-dc04' }).selected, null);
  assert.deepEqual(S({ extraDc: '2016', sel: 'dc:qm-dc04' }).selected, { dc: 'qm-dc04' });
});

// ── generic checks every sim keeps ──

test('explorer: no steps; state is JSON-safe and deterministic for every preset', () => {
  assert.equal(logic.steps, undefined);
  for (const pr of logic.presets) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(S(pr.params), s);
  }
});

test('act and initial do not mutate their input', () => {
  const p = P(preset('old-dc-present'));
  const copy = structuredClone(p);
  logic.act(p, set('q', '2016'));
  logic.initial(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every feature and rule-out id has words in both languages', () => {
  for (const lang of ['hr', 'en']) {
    for (const k of ['domain', 'forest']) for (const l of logic.LEVELS) {
      for (const f of logic.UNLOCKS[k][l]) assert.ok(strings[lang]['f_' + f], `${lang} f_${f}`);
      for (const f of (logic.RULES_OUT[k][l] || [])) assert.ok(strings[lang]['x_' + f], `${lang} x_${f}`);
    }
  }
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
});
