// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-bitlocker-tpm's model. Rules: SPEC.md. Run: node --test sims/win-bitlocker-tpm/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps);
const short = (hex) => hex.slice(0, 8);
const nodeExtend = (old, label) => crypto.createHash('sha256')
  .update(Buffer.concat([Buffer.from(old, 'hex'), crypto.createHash('sha256').update(label, 'utf8').digest()])).digest('hex');

/** A further boot with the seal a finished boot left behind (rule 6: the next boot after a reseal). */
function nextBoot(prev, over) {
  const p = P(Object.assign({}, over, { suspend: false }));
  let s = logic.initial(p);
  s.sealed = structuredClone(prev.sealed);
  for (let n = 1; n <= logic.steps; n++) s = logic.step(s, n, p);
  return s;
}

// ── tie-breaks first ──

test('tie-break rule 7: another TPM fails the unseal even when every profile PCR matches', () => {
  const s = at({ otherMachine: true }, 5);
  assert.equal(s.compare.pcr[7].match, true);
  assert.equal(s.compare.pcr[11].match, true);
  assert.equal(s.compare.sameTpm, false);
  assert.equal(s.unlocked, false);
  assert.equal(end({ otherMachine: true }).recovery, true);
});

test('tie-break rule 6: with suspend on, the clear key wins over a mismatch and over another TPM', () => {
  const a = at({ suspend: true, secureBoot: false }, 5);
  assert.equal(a.compare.ok, false);
  assert.equal(a.unlocked, true);
  assert.equal(a.how, 'clearKey');
  const b = at({ suspend: true, otherMachine: true }, 5);
  assert.equal(b.compare.sameTpm, false);
  assert.equal(b.unlocked, true);
});

test('tie-break rule 2: within a stage the extends run in ascending PCR order', () => {
  const s = at({}, 2);
  assert.deepEqual(s.extended, [0, 2]);
  assert.deepEqual(s.log.map((e) => e.pcr), [0, 2]);
});

test('tie-break rule 4: one mismatching PCR among matching ones is enough for recovery', () => {
  const s = at({ profile: '0,2,4,11', bootManager: 'changed' }, 5);
  assert.deepEqual([0, 2, 4, 11].map((i) => s.compare.pcr[i].match), [true, true, false, true]);
  assert.equal(s.unlocked, false);
});

// ── rule 1: reset to zero, change only by extend ──

test('rule 1: PCRs are unset before power on, zero after reset, and extend is SHA-256(old ‖ SHA-256(m))', () => {
  assert.deepEqual(at({}, 0).pcr, { 0: null, 2: null, 4: null, 7: null, 11: null });
  const s1 = at({}, 1);
  for (const i of logic.PCRS) assert.equal(s1.pcr[i], logic.ZERO);
  assert.deepEqual(s1.extended, [0, 2, 4, 7, 11]);
  for (const label of ['SecureBoot=on', 'firmware=A v1.07', 'bootmgr=v2', 'BitLocker=unlocked', 'é→ü']) {
    assert.equal(logic.extend(logic.ZERO, label), nodeExtend(logic.ZERO, label));
    assert.equal(logic.extend(nodeExtend(logic.ZERO, 'x'), label), nodeExtend(nodeExtend(logic.ZERO, 'x'), label));
  }
  assert.equal(logic.toHex(logic.sha256(logic.utf8('abc'))), crypto.createHash('sha256').update('abc').digest('hex'));
  const long = 'a'.repeat(200);   // more than one block
  assert.equal(logic.toHex(logic.sha256(logic.utf8(long))), crypto.createHash('sha256').update(long).digest('hex'));
});

test('rule 1: a PCR changes only in the step whose stage extends it', () => {
  for (let n = 2; n <= logic.steps; n++) {
    const a = at({}, n - 1), b = at({}, n);
    for (const i of logic.PCRS) {
      if (b.extended.includes(i)) assert.notEqual(b.pcr[i], a.pcr[i], `PCR ${i} at step ${n}`);
      else assert.equal(b.pcr[i], a.pcr[i], `PCR ${i} at step ${n}`);
    }
  }
});

test('rule 1: the expected toy values (SPEC.md table)', () => {
  const s = at({}, 4);
  assert.equal(short(s.pcr[0]), '2e30ba63');
  assert.equal(short(s.pcr[2]), 'c90de95b');
  assert.equal(short(s.pcr[4]), '792970f9');
  assert.equal(short(s.pcr[7]), '8e0194f0');
  assert.equal(short(s.pcr[11]), '00000000');
  assert.equal(short(at({ secureBoot: false }, 3).pcr[7]), 'c421304f');
  assert.equal(short(at({ firmwareUpdate: true }, 2).pcr[0]), '74907f7c');
  assert.equal(short(at({ otherMachine: true }, 2).pcr[0]), '53333798');
  assert.equal(short(at({ otherMachine: true, firmwareUpdate: true }, 2).pcr[0]), '1279baad');
  assert.equal(short(at({ otherMachine: true }, 2).pcr[2]), 'd8ce3b26');
  assert.equal(short(at({ bootManager: 'changed' }, 4).pcr[4]), 'bce8fbb7');
  assert.equal(short(at({}, 5).pcr[11]), '062dacc9');
});

// ── rule 2: measured before it runs ──

test('rule 2: each stage extends its PCRs in its own step, in boot order', () => {
  assert.deepEqual(at({}, 0).stages, ['firmware', 'secureboot', 'bootmgr', 'bitlocker', 'winload']);
  const want = { 2: ['firmware', [0, 2]], 3: ['secureboot', [7]], 4: ['bootmgr', [4]], 5: ['bitlocker', [11]], 6: ['winload', []] };
  for (const [n, [id, pcrs]] of Object.entries(want)) {
    const s = at({}, Number(n));
    assert.equal(s.changed, id);
    assert.deepEqual(s.extended, pcrs);
    assert.equal(s.done[s.done.length - 1], id);
  }
});

// ── rule 3: the profile ──

test('rule 3: the seal holds the profile PCRs of a seal-time boot; PCR 11 sealed at zero', () => {
  const a = at({}, 0).sealed;
  assert.deepEqual(a.profile, [7, 11]);
  assert.deepEqual(Object.keys(a.values).map(Number), [7, 11]);
  assert.equal(short(a.values[7]), '8e0194f0');
  assert.equal(a.values[11], logic.ZERO);
  const b = at({ profile: '0,2,4,11' }, 0).sealed;
  assert.deepEqual(b.profile, [0, 2, 4, 11]);
  assert.deepEqual([0, 2, 4, 11].map((i) => short(b.values[i])), ['2e30ba63', 'c90de95b', '792970f9', '00000000']);
});

// ── rule 4: unseal only if all match ──

test('rule 4: nothing changed → released by the TPM, Windows starts', () => {
  const s5 = at({}, 5);
  assert.equal(s5.compare.ok, true);
  assert.equal(s5.unlocked, true);
  assert.equal(s5.how, 'tpm');
  const s = end({});
  assert.equal(s.recovery, false);
  assert.deepEqual(s.done, ['firmware', 'secureboot', 'bootmgr', 'bitlocker', 'winload']);
});

test('rule 4: Secure Boot off → PCR 7 c421304f ≠ 8e0194f0 → held, recovery screen, winload never runs', () => {
  const s5 = at({ secureBoot: false }, 5);
  assert.equal(short(s5.compare.pcr[7].now), 'c421304f');
  assert.equal(short(s5.compare.pcr[7].sealed), '8e0194f0');
  assert.equal(s5.compare.pcr[7].match, false);
  assert.equal(s5.unlocked, false);
  const s = end({ secureBoot: false });
  assert.equal(s.recovery, true);
  assert.ok(!s.done.includes('winload'));
});

// ── rule 5: outside the profile ──

test('rule 5: a firmware update changes PCR 0; profile 7,11 unlocks, profile 0,2,4,11 does not', () => {
  assert.equal(end({ firmwareUpdate: true }).unlocked, true);
  assert.equal(end({ firmwareUpdate: true }).recovery, false);
  assert.equal(end({ firmwareUpdate: true, profile: '0,2,4,11' }).recovery, true);
  assert.equal(end({ bootManager: 'changed' }).recovery, false);
  assert.equal(end({ secureBoot: false, profile: '0,2,4,11' }).recovery, false);
});

// ── rule 6: suspend and reseal ──

test('rule 6: suspended boot unlocks by the clear key, reseals to this boot, and the next boot is normal', () => {
  const over = { firmwareUpdate: true, suspend: true, profile: '0,2,4,11' };
  const s5 = at(over, 5);
  assert.equal(s5.compare.pcr[0].match, false);
  assert.equal(s5.how, 'clearKey');
  assert.equal(s5.suspended, true);
  const s = end(over);
  assert.equal(s.recovery, false);
  assert.equal(s.resealed, true);
  assert.equal(s.suspended, false);
  assert.equal(short(s.sealed.values[0]), '74907f7c');
  assert.equal(s.sealed.values[11], logic.ZERO, 'reseal uses the value before the cap');
  const next = nextBoot(s, { firmwareUpdate: true, profile: '0,2,4,11' });
  assert.equal(next.how, 'tpm');
  assert.equal(next.recovery, false);
  // without the reseal the same next boot would need the recovery key
  assert.equal(end({ firmwareUpdate: true, profile: '0,2,4,11' }).recovery, true);
});

test('rule 6: the seal changes only at the end of a suspended boot', () => {
  for (let n = 0; n < logic.steps; n++) assert.deepEqual(at({ suspend: true, firmwareUpdate: true, profile: '0,2,4,11' }, n).sealed, at({ profile: '0,2,4,11' }, 0).sealed);
  assert.equal(end({}).resealed, false);
});

test('rule 6: a suspended boot in another machine reseals to that machine\'s TPM', () => {
  const s = end({ suspend: true, otherMachine: true });
  assert.equal(s.sealed.tpm, 'B');
  assert.equal(nextBoot(s, { otherMachine: true }).how, 'tpm');
  assert.equal(nextBoot(s, { otherMachine: false }).recovery, true);
});

test('rule 6: the reseal takes every profile PCR of this boot, not only the one that changed', () => {
  const over = { firmwareUpdate: true, bootManager: 'changed', suspend: true, profile: '0,2,4,11' };
  const s = end(over);
  assert.equal(short(s.sealed.values[0]), '74907f7c');
  assert.equal(short(s.sealed.values[2]), 'c90de95b');
  assert.equal(short(s.sealed.values[4]), 'bce8fbb7');
  assert.equal(s.sealed.values[11], logic.ZERO);
});

test('rule 4: the recovery screen comes at step 6, not at the compare', () => {
  assert.equal(at({ secureBoot: false }, 5).recovery, false);
  assert.equal(at({ secureBoot: false }, 6).recovery, true);
});

test('rules 1, 2, 8: the measurement log in order, with the stage that measured', () => {
  assert.deepEqual(end({}).log, [
    { pcr: 0, label: 'firmware=A v1.07', stage: 'firmware' }, { pcr: 2, label: 'optionROM=A gpu 3.1', stage: 'firmware' },
    { pcr: 7, label: 'SecureBoot=on', stage: 'secureboot' }, { pcr: 4, label: 'bootmgr=v1', stage: 'bootmgr' },
    { pcr: 11, label: 'BitLocker=unlocked', stage: 'bitlocker' }]);
});

// ── rule 8: the cap ──

test('rule 8: after release PCR 11 is capped, so the same compare would now fail; no cap on a failed unseal', () => {
  const s = at({}, 5);
  assert.equal(s.capped, true);
  assert.equal(logic.compare(s.pcr, s.sealed, 'A').ok, false);
  assert.equal(s.atUnlock[11], logic.ZERO);
  const f = at({ secureBoot: false }, 5);
  assert.equal(f.capped, false);
  assert.equal(f.pcr[11], logic.ZERO);
});

// ── presets (SPEC.md table) ──

test('presets: outcomes', () => {
  const want = { normal: false, 'secure-boot-off': true, 'firmware-update': false, suspended: false, 'disk-moved': true };
  for (const pr of logic.presets) assert.equal(end(pr.params).recovery, want[pr.id], pr.id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) for (let n = 0; n <= logic.steps; n++) {
    const s = at(pr.params, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.presets) {
    const p = P(pr.params);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input; stepping past the end changes nothing', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const e = end({ secureBoot: false });
  const after = logic.step(e, 7, P({ secureBoot: false }));
  assert.deepEqual(after.pcr, e.pcr);
  assert.equal(after.recovery, true);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page lists the model presets and its meta steps match', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
});
