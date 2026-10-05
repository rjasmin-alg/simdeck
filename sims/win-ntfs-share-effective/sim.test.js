// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ntfs-share-effective. Run: node --test sims/win-ntfs-share-effective/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected results (§3), then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const RT = require('../../kit/ruletable.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id, over) => at(Object.assign({}, logic.presets.find((x) => x.id === id).params, over));
const chips = (levels) => logic.LEVELS.filter((l) => levels[l]);
const rowOf = (s, principal, type) => s.ntfs.findIndex((a) => a.principal === principal && (!type || a.type === type));
const ALL = ['read', 'readExecute', 'write', 'modify', 'full'];

// ── tie-breaks first ──

test('tie-break: same canonical group keeps written order; the first decides, the later one is too late', () => {
  // ivan's explicit Modify is written before Prodaja's explicit Modify: ivan's row decides, Prodaja's is beaten.
  const s = at({ who: 'ivan', explicitAllowIvan: true });
  const iv = rowOf(s, 'ivan'), pr = rowOf(s, 'Prodaja');
  assert.ok(iv < pr);
  assert.equal(s.ntfsEff.rows[iv].mark, 'win');
  assert.equal(s.ntfsEff.rows[pr].mark, 'beaten');
  assert.deepEqual(chips(s.ntfsEff.levels), ['read', 'readExecute', 'write', 'modify']);
  // swapping the written order swaps the marks, not the result
  const acl = logic.canonical([
    { principal: 'Prodaja', rights: 'modify', type: 'allow', inherited: false },
    { principal: 'ivan', rights: 'modify', type: 'allow', inherited: false }
  ]);
  const e = logic.evalNtfs(acl, ['ivan', 'Prodaja']);
  assert.deepEqual(e.rows.map((r) => r.decided.length > 0), [true, false]);
  assert.deepEqual(e.atoms, ['r', 'x', 'w', 'd']);
});

test('tie-break: a group reached twice is in the token once, with its first path', () => {
  const tok = logic.tokenOf({ name: 'ana', groups: ['Domain Users', 'Users', 'Domain Users'] }, 'network');
  const names = tok.map((t) => t.name);
  assert.equal(names.filter((n) => n === 'Users').length, 1);
  assert.equal(names.filter((n) => n === 'Domain Users').length, 1);
  assert.equal(tok.find((t) => t.name === 'Users').kind, 'group');   // direct membership listed first
  const nested = logic.tokenOf({ name: 'ana', groups: ['Domain Users'] }, 'network');
  assert.deepEqual(nested.find((t) => t.name === 'Users'), { name: 'Users', sid: 'S-1-5-32-545', kind: 'nested', via: 'Domain Users' });
});

test('tie-break: share and NTFS equal → "same", neither is called stricter', () => {
  const s = at({ shareEveryone: 'change' });   // Change ≈ Modify, NTFS Modify
  assert.deepEqual(chips(s.shareEff.levels), chips(s.ntfsEff.levels));
  assert.equal(s.decidedBy, 'same');
  for (const l of ALL) assert.equal(s.effective.by[l], s.effective.levels[l] ? 'both' : 'neither');
});

test('tie-break: each side takes something away → "both"', () => {
  // share Read (R X) vs NTFS Prodaja Read + Voditelji Write (R W): effective R only
  const s = at({ shareEveryone: 'read', ntfsProdaja: 'read', voditelji: true });
  assert.deepEqual(chips(s.effective.levels), ['read']);
  assert.equal(s.decidedBy, 'both');
  assert.equal(s.effective.by.readExecute, 'ntfs');
  assert.equal(s.effective.by.write, 'share');
});

test('tie-break: a leftover atom changes no level, so "decided by" compares levels', () => {
  // Everyone Full minus Deny Change leaves r x p on the share; the chips are R X, same as the effective chips.
  const s = preset('deny-everyone-share');
  assert.deepEqual(s.shareEff.atoms, ['r', 'x', 'p']);
  assert.deepEqual(chips(s.shareEff.levels), ['read', 'readExecute']);
  assert.equal(s.decidedBy, 'share');
});

// ── rule 1: token ──

test('rule 1: the token holds the user, groups, nested groups and well-known groups by path', () => {
  const net = at({}).sids.map((x) => x.name);
  assert.deepEqual(net, ['ana', 'Domain Users', 'Prodaja', 'Users', 'Everyone', 'Authenticated Users', 'NETWORK']);
  const loc = at({ path: 'local' }).sids.map((x) => x.name);
  assert.ok(loc.includes('INTERACTIVE') && !loc.includes('NETWORK'));
  assert.deepEqual(at({ who: 'ivan' }).sids.map((x) => x.name).slice(0, 5), ['ivan', 'Domain Users', 'Prodaja', 'Pripravnici', 'Users']);
  assert.ok(at({ voditelji: true }).sids.some((x) => x.name === 'Voditelji'));
  assert.ok(!at({ voditelji: false }).sids.some((x) => x.name === 'Voditelji'));
  assert.ok(!at({ who: 'marko' }).sids.some((x) => x.name === 'Prodaja'));
  assert.equal(at({}).sids.find((x) => x.name === 'Everyone').sid, 'S-1-1-0');
});

// ── rule 2: canonical order, first mention decides, allows add up ──

test('rule 2: the ACL is sorted explicit deny, explicit allow, inherited deny, inherited allow', () => {
  const acl = logic.canonical([
    { principal: 'A', rights: 'read', type: 'allow', inherited: true },
    { principal: 'B', rights: 'read', type: 'deny', inherited: true },
    { principal: 'C', rights: 'read', type: 'allow', inherited: false },
    { principal: 'D', rights: 'read', type: 'deny', inherited: false }
  ]);
  assert.deepEqual(acl.map((a) => a.principal), ['D', 'C', 'B', 'A']);
  assert.deepEqual(acl.map((a) => a.canon), logic.CANON);
  const s = at({ denyPripravnici: 'inherited', explicitAllowIvan: true });
  const order = s.ntfs.map((a) => logic.CANON.indexOf(a.canon));
  assert.deepEqual(order, order.slice().sort((a, b) => a - b));
});

test('rule 2: an explicit deny refuses the right even though an allow follows', () => {
  const s = preset('deny-wins');
  const d = rowOf(s, 'Pripravnici', 'deny'), pr = rowOf(s, 'Prodaja');
  assert.equal(d, 0);
  assert.deepEqual(s.ntfsEff.rows[d].decided, ['w']);
  assert.equal(s.ntfsEff.rows[d].mark, 'win');
  assert.deepEqual(s.ntfsEff.rows[pr].decided, ['r', 'x', 'd']);
  assert.ok(!s.ntfsEff.atoms.includes('w'));
  assert.deepEqual(s.ntfsEff.deciders.write, [d]);
  assert.deepEqual(s.ntfsEff.deciders.modify, [d]);
});

test('rule 2: rights from different ACEs add up', () => {
  const s = preset('groups-add-up');
  assert.deepEqual(s.ntfsEff.atoms, ['r', 'w']);
  assert.deepEqual(chips(s.ntfsEff.levels), ['read', 'write']);
  assert.deepEqual(s.effective.name, ['read', 'write']);
  assert.equal(s.ntfsEff.rows[rowOf(s, 'Prodaja')].mark, 'win');
  assert.equal(s.ntfsEff.rows[rowOf(s, 'Voditelji')].mark, 'win');
  assert.deepEqual(s.ntfsEff.rows[rowOf(s, 'Voditelji')].levels, ['write']);
});

// ── rule 3: explicit allow before inherited deny ──

test('rule 3: an explicit allow beats a deny inherited from D:\\ (and loses to an explicit one)', () => {
  const s = preset('explicit-beats-inherited');
  const d = rowOf(s, 'Pripravnici', 'deny');
  assert.equal(s.ntfs[d].inherited, true);
  assert.equal(s.ntfsEff.rows[d].mark, 'beaten');
  assert.equal(s.ntfsEff.rows[rowOf(s, 'ivan')].mark, 'win');
  assert.ok(s.ntfsEff.levels.write && s.ntfsEff.levels.modify);
  // without ivan's explicit allow, the inherited deny decides Write (Prodaja only reads)
  const off = preset('explicit-beats-inherited', { explicitAllowIvan: false });
  assert.equal(off.ntfsEff.rows[rowOf(off, 'Pripravnici', 'deny')].mark, 'win');
  assert.ok(!off.ntfsEff.levels.write);
  // the same deny set explicitly beats ivan's explicit allow
  const ex = preset('explicit-beats-inherited', { denyPripravnici: 'explicit' });
  assert.ok(!ex.ntfsEff.levels.write);
  assert.deepEqual(ex.ntfsEff.deciders.write, [rowOf(ex, 'Pripravnici', 'deny')]);
});

// ── rule 4: implicit deny ──

test('rule 4: no matching ACE → no access, the implicit row decides; a right no ACE mentions is refused', () => {
  const s = at({ who: 'marko' });
  assert.deepEqual(s.ntfsEff.atoms, []);
  assert.equal(s.ntfsEff.implicit, true);
  assert.ok(s.ntfsEff.rows.every((r) => r.mark === 'no'));
  assert.deepEqual(s.effective.atoms, []);
  const ana = at({});
  assert.equal(ana.ntfsEff.implicit, false);
  assert.equal(ana.ntfsEff.levels.full, false);
  assert.deepEqual(ana.ntfsEff.deciders.full, []);        // nothing refused p: implicit deny
  // the kit view's implicit row agrees: it wins only when no row matches
  for (const s2 of [s, ana]) {
    const ev = RT.evaluate('deny', s2.ntfsEff.rows.map((r) => ({ hit: r.match, mark: r.mark })), 'all', true);
    assert.equal(ev.implicit, s2.ntfsEff.implicit ? 'win' : 'skip');
  }
});

// ── rule 5: share ──

test('rule 5: share allows add up; a deny for any SID removes its level wherever it is', () => {
  const acl = [
    { principal: 'Everyone', level: 'read', type: 'allow' },
    { principal: 'Prodaja', level: 'change', type: 'allow' }
  ];
  assert.deepEqual(logic.evalShare(acl, ['Everyone', 'Prodaja']).atoms, ['r', 'x', 'w', 'd']);
  // deny first or last makes no difference
  const deny = { principal: 'Prodaja', level: 'change', type: 'deny' };
  assert.deepEqual(logic.evalShare([deny].concat(acl), ['Everyone', 'Prodaja']).atoms, ['r', 'x']);
  assert.deepEqual(logic.evalShare(acl.concat([deny]), ['Everyone', 'Prodaja']).atoms, ['r', 'x']);
  // Deny Read removes read; Deny Full Control removes everything
  assert.deepEqual(logic.evalShare(acl.concat([{ principal: 'Everyone', level: 'read', type: 'deny' }]), ['Everyone', 'Prodaja']).atoms, ['w', 'd']);
  assert.deepEqual(logic.evalShare(acl.concat([{ principal: 'Everyone', level: 'full', type: 'deny' }]), ['Everyone', 'Prodaja']).atoms, []);
  // nothing matches → nothing
  assert.deepEqual(logic.evalShare(acl, ['marko']).atoms, []);
  // in the scene: the deny row decides, both matching allows... Administrators does not match ana
  const s = preset('deny-everyone-share');
  assert.deepEqual(s.shareEff.rows.map((r) => r.mark), ['no', 'win', 'win']);
  assert.deepEqual(s.shareEff.deciders.write, [2]);
});

// ── rule 6: effective ──

test('rule 6: over the network the stricter of the two, right by right; locally NTFS alone', () => {
  const s = preset('default-share');
  assert.deepEqual(chips(s.shareEff.levels), ['read', 'readExecute']);
  assert.deepEqual(chips(s.ntfsEff.levels), ['read', 'readExecute', 'write', 'modify']);
  assert.deepEqual(chips(s.effective.levels), ['read', 'readExecute']);
  assert.equal(s.decidedBy, 'share');
  assert.equal(s.effective.by.write, 'share');
  const loc = preset('default-share', { path: 'local' });
  assert.equal(loc.shareEff, null);
  assert.deepEqual(chips(loc.effective.levels), ['read', 'readExecute', 'write', 'modify']);
  assert.equal(loc.decidedBy, 'local');
  const c = preset('classic');
  assert.equal(c.decidedBy, 'ntfs');
  assert.equal(c.effective.by.full, 'ntfs');
});

// ── rule 7: level equivalence ──

test('rule 7: share Read ≈ NTFS Read & execute, Change ≈ Modify, Full Control ≈ Full Control', () => {
  assert.deepEqual(logic.SHARE_ALLOW.read, logic.NTFS_MASK.readExecute);
  assert.deepEqual(logic.SHARE_ALLOW.change, logic.NTFS_MASK.modify);
  assert.deepEqual(logic.SHARE_ALLOW.full, logic.NTFS_MASK.full);
  assert.equal(logic.shareNameOf(['r', 'x']), 'read');
  assert.equal(logic.shareNameOf(['r', 'x', 'w', 'd']), 'change');
  assert.equal(logic.shareNameOf(['r']), null);
  assert.deepEqual(logic.nameOf(['r', 'x', 'w', 'd']), ['modify']);
  assert.deepEqual(logic.nameOf(['r', 'x', 'd']), ['readExecute']);
  assert.deepEqual(logic.nameOf([]), []);
});

// ── rule 8: default share permission ──

test('rule 8: Everyone Read on the share limits ana to reading over the network', () => {
  const s = preset('default-share');
  assert.equal(s.share.find((a) => a.principal === 'Everyone').level, 'read');
  assert.equal(s.shareEff.shareName, 'read');
  assert.deepEqual(s.effective.name, ['readExecute']);
});

// ── presets (SPEC §3) ──

test('presets: expected effective results', () => {
  const eff = (s) => chips(s.effective.levels);
  assert.deepEqual(eff(preset('classic')), ['read', 'readExecute', 'write', 'modify']);
  assert.deepEqual(eff(preset('classic', { who: 'marko' })), []);
  assert.equal(preset('classic', { who: 'marko' }).decidedBy, 'ntfs');
  assert.deepEqual(eff(preset('default-share')), ['read', 'readExecute']);
  assert.deepEqual(eff(preset('groups-add-up')), ['read', 'write']);
  assert.deepEqual(eff(preset('deny-wins')), ['read', 'readExecute']);
  assert.deepEqual(eff(preset('explicit-beats-inherited')), ['read', 'readExecute', 'write', 'modify']);
  assert.deepEqual(eff(preset('deny-everyone-share')), ['read', 'readExecute']);
  assert.deepEqual(eff(preset('deny-everyone-share', { path: 'local' })), ['read', 'readExecute', 'write', 'modify']);
  // nobody writes over the network with the share deny on
  for (const who of ['ana', 'ivan', 'marko']) assert.equal(preset('deny-everyone-share', { who }).effective.levels.write, false);
  assert.deepEqual(logic.presets.map((x) => x.id), ['classic', 'default-share', 'groups-add-up', 'deny-wins', 'explicit-beats-inherited', 'deny-everyone-share']);
});

test('changes() marks the rows and chips that changed with a param', () => {
  const a = at({}), b = at({ shareEveryone: 'read' });
  const c = logic.changes(a, b);
  assert.deepEqual(c.ntfs, []);
  assert.deepEqual(c.share, [1]);
  assert.deepEqual(c.chips.share, ['write', 'modify', 'full']);
  assert.deepEqual(c.chips.effective, ['write', 'modify']);
  assert.deepEqual(logic.changes(a, a), { ntfs: [], share: [], chips: { share: [], ntfs: [], effective: [] } });
});

test('changes(): an added row marks that row only, not the rows it pushed down', () => {
  const a = at({}), b = at({ denyPripravnici: 'explicit' });
  assert.equal(b.ntfs[0].principal, 'Pripravnici');
  assert.deepEqual(logic.changes(a, b).ntfs, [0]);
  assert.deepEqual(logic.changes(b, a).ntfs, []);   // a removed row leaves nothing to mark
  assert.deepEqual(logic.changes(a, at({ explicitAllowIvan: true })).ntfs, [0]);
});

test('changes(): content alone and verdict alone each count', () => {
  // locally the share is not evaluated: only the ACE content differs
  assert.deepEqual(logic.changes(at({ who: 'marko', path: 'local' }), at({ who: 'marko', path: 'local', shareEveryone: 'read' })).share, [1]);
  // same ACEs, another user: Prodaja's row goes from "decides" to "no"
  const c = logic.changes(at({}), at({ who: 'marko' }));
  assert.ok(c.ntfs.includes(0));
});

// ── generic checks every sim keeps ──

test('explorer: no steps; state is JSON-safe for every preset and path', () => {
  assert.equal(logic.steps, undefined);
  for (const x of logic.presets) for (const p of ['network', 'local']) {
    const s = preset(x.id, { path: p });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic: the same params give the same state; initial does not mutate params', () => {
  const p = P({ who: 'ivan', denyPripravnici: 'inherited' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has its strings', () => {
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
