// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for digital-signature's model (SPEC.md). Run: node --test sims/digital-signature/
// Rules first, tie-breaks first of all; then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps);
const A = logic.KEYS.alice, M = logic.KEYS.mallory;

// ── tie-breaks (SPEC.md, Tie-break): a valid verdict the keys do not explain is a toy-size accident ──

test('tie-break: same toy hash for an edited message is a collision, never "authentic"', () => {
  // Plati 5529 EUR hashes to 2363 mod 3233, like Plati 100 EUR (Python, checked)
  assert.equal(logic.toyHash('Plati 5529 EUR', A.n), 2363);
  const s = end({ attack: 'edit', forged: 'Plati 5529 EUR' });
  assert.equal(s.valid, true, 'Bob only compares v with h\'');
  assert.equal(s.recvMsg, 'Plati 5529 EUR');
  assert.equal(s.conclusion, 'collision');
});

test('tie-break: another key giving v = h\' by chance is "chance", never "authentic"', () => {
  // Mallory re-signs Plati 246 EUR with her key; with Alice's key v = h' (Python, checked)
  const s = end({ attack: 'resign', forged: 'Plati 246 EUR' });
  assert.equal(s.valid, true);
  assert.equal(s.sigFrom, 'mallory');
  assert.equal(s.conclusion, 'chance');
});

test('tie-break: no preset and no param combination hits a toy accident', () => {
  for (const msg of logic.MESSAGES) for (const attack of logic.ATTACKS) {
    const c = end({ msg, attack }).conclusion;
    assert.ok(c !== 'collision' && c !== 'chance', `${msg} / ${attack}: ${c}`);
  }
  assert.notEqual(logic.toyHash('Plati 100 EUR', A.n), logic.toyHash('Plati 900 EUR', A.n));
  assert.notEqual(logic.toyHash('Plati 100 EUR', M.n), logic.toyHash('Plati 900 EUR', M.n));
});

// ── the keys and the hash ──

test('keys: e·d = 1 mod φ(n) for both toy keys', () => {
  for (const k of [A, M]) {
    assert.equal(k.p * k.q, k.n);
    assert.equal((k.e * k.d) % ((k.p - 1) * (k.q - 1)), 1);
  }
});

test('hash: SHA-256 of the message, mod n of the key in use', () => {
  assert.equal(logic.sha256('Plati 100 EUR'), '82ea917f130eee29be7ab81e423d22811e6d8f598004819d1e148fda86b7fb8b');
  assert.equal(logic.sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); // FIPS 180-4 test value
  assert.equal(logic.toyHash('Plati 100 EUR', A.n), 2363);
  assert.equal(logic.toyHash('Plati 900 EUR', A.n), 233);
  assert.equal(logic.toyHash('Plati 100 EUR', M.n), 741);
  assert.equal(logic.toyHash('Plati 900 EUR', M.n), 144);
  assert.equal(logic.digestMod('0100', 7), 256 % 7);
});

// ── rule 1: sign with the private key, verify with the public key, over the hash ──

test('rule 1: honest: s = h^d mod n = 1834, v = s^e mod n = 2363 = h\' → valid', () => {
  assert.equal(at({}, 2).hashSent, 2363);
  assert.equal(at({}, 3).sig, 1834);
  assert.equal(logic.powMod(2363, A.d, A.n), 1834);
  const s = end({});
  assert.equal(s.recvMsg, 'Plati 100 EUR');
  assert.equal(s.hashRecv, 2363);
  assert.equal(s.recovered, 2363);
  assert.equal(s.valid, true);
  assert.equal(s.conclusion, 'authentic');
});

test('rule 1: the signature is over the hash: verifying with the private exponent, or without hashing, fails', () => {
  // v comes from the public exponent e: s^d is not h
  assert.notEqual(logic.powMod(1834, A.d, A.n), 2363);
  assert.equal(logic.recover(1834, A), 2363);
  // the other message signs to a different s
  assert.equal(end({ msg: 'Plati 900 EUR' }).recvSig, 3161);
  assert.equal(end({ msg: 'Plati 900 EUR' }).valid, true);
});

// ── rule 2: any change to the message changes h', so v ≠ h' ──

test('rule 2: tamper: Bob gets Plati 900 EUR with s = 1834: h\' = 233, v = 2363 → invalid', () => {
  const s = end({ attack: 'edit' });
  assert.equal(s.recvMsg, 'Plati 900 EUR');
  assert.equal(s.recvSig, 1834);
  assert.equal(s.sigFrom, 'alice');
  assert.equal(s.hashRecv, 233);
  assert.equal(s.recovered, 2363);
  assert.equal(s.valid, false);
  assert.equal(s.conclusion, 'reject');
  assert.equal(end({ msg: 'Plati 900 EUR', attack: 'edit' }).valid, false);
});

// ── rule 3: a signature made with another private key does not verify with Alice's public key ──

test('rule 3: resign: Mallory signs with her key, s = 1945; with Alice\'s key v = 2145 ≠ 233 → invalid', () => {
  const s = end({ attack: 'resign' });
  assert.equal(s.recvSig, 1945);
  assert.equal(s.sigFrom, 'mallory');
  assert.equal(s.bobTrusts, 'alice');
  assert.equal(s.hashRecv, 233);
  assert.equal(s.recovered, 2145);
  assert.equal(s.valid, false);
  assert.equal(s.conclusion, 'reject');
  const t = end({ msg: 'Plati 900 EUR', attack: 'resign' });
  assert.deepEqual([t.recvSig, t.hashRecv, t.recovered, t.valid], [2, 2363, 1752, false]);
});

// ── rule 4: with the wrong public key the forgery verifies ──

test('rule 4: swapkey: Bob holds Mallory\'s key; her forgery verifies (h\' = v = 144) and is flagged wrongKey', () => {
  assert.equal(at({ attack: 'swapkey' }, 4).bobTrusts, 'alice', 'the key is swapped in step 5');
  const s5 = at({ attack: 'swapkey' }, 5);
  assert.equal(s5.bobTrusts, 'mallory');
  assert.ok(s5.changed.includes('bob-key'));
  const s = end({ attack: 'swapkey' });
  assert.equal(s.recvMsg, 'Plati 900 EUR');
  assert.equal(s.hashRecv, 144, 'Bob hashes mod the n of the key he trusts');
  assert.equal(s.recovered, 144);
  assert.equal(s.valid, true);
  assert.equal(s.conclusion, 'wrongKey');
  const t = end({ msg: 'Plati 900 EUR', attack: 'swapkey' });
  assert.deepEqual([t.recvSig, t.hashRecv, t.recovered, t.conclusion], [2, 741, 741, 'wrongKey']);
});

// ── rule 5: a signature does not hide the message ──

test('rule 5: Mallory reads the message in step 4, whatever she does next', () => {
  for (const attack of logic.ATTACKS) {
    const s = at({ attack }, 4);
    assert.equal(s.mallorySaw, 'Plati 100 EUR');
    assert.equal(s.wire.msg, 'Plati 100 EUR');
  }
  assert.equal(at({}, 3).mallorySaw, null);
});

// ── the steps ──

test('nine steps for every preset, in the order of SPEC.md', () => {
  assert.equal(logic.steps, 9);
  const order = ['write', 'hash', 'sign', 'send', 'mallory', 'bobHash', 'recover', 'compare', 'conclude'];
  for (const attack of logic.ATTACKS) {
    const phases = [];
    for (let n = 1; n <= logic.steps; n++) phases.push(at({ attack }, n).phase);
    assert.deepEqual(phases, order);
  }
});

test('each value appears at its own step, not earlier (the page shows whatever is set)', () => {
  // field → the first step where it is set (SPEC.md, Steps)
  const first = { msg: 1, hashSent: 2, sig: 3, mallorySaw: 4, malloryDid: 5, recvMsg: 5, recvSig: 5,
    hashRecv: 6, recovered: 7, valid: 8, conclusion: 9 };
  for (const attack of logic.ATTACKS) for (const [k, n] of Object.entries(first)) {
    assert.equal(at({ attack }, n - 1)[k], null, `${attack}: ${k} still null at step ${n - 1}`);
    assert.notEqual(at({ attack }, n)[k], null, `${attack}: ${k} set at step ${n}`);
  }
});

test('the changed marks: exactly what this step produced', () => {
  const marks = { 1: ['alice-msg'], 2: ['alice-hash'], 3: ['alice-sig'], 4: ['mallory-saw'], 5: ['mallory-act', 'bob-recv'],
    6: ['bob-hash'], 7: ['bob-recover'], 8: ['bob-compare'], 9: ['conclusion'] };
  for (const [n, m] of Object.entries(marks)) assert.deepEqual(at({}, +n).changed, m, `step ${n}`);
  assert.deepEqual(at({ attack: 'swapkey' }, 5).changed, ['bob-key', 'mallory-act', 'bob-recv']);
  assert.deepEqual(at({}, 0).changed, []);
});

test('Mallory\'s action is recorded as the attack', () => {
  for (const attack of logic.ATTACKS) assert.equal(at({ attack }, 5).malloryDid, attack);
});

test('the wire at step 5 carries what Bob gets', () => {
  for (const attack of logic.ATTACKS) {
    const s = at({ attack }, 5);
    assert.equal(s.wire.msg, s.recvMsg);
    assert.equal(s.wire.sig, s.recvSig);
  }
  assert.equal(at({ attack: 'edit' }, 5).wire.msg, 'Plati 900 EUR');
  assert.equal(at({ attack: 'resign' }, 5).wire.sig, 1945);
});

test('defaults: Plati 100 EUR, no attack, numbers shown', () => {
  assert.deepEqual(logic.defaults, { msg: 'Plati 100 EUR', attack: 'none', showNumbers: true });
});

test('the wire: Alice → Mallory in step 4, Mallory → Bob in step 5, empty otherwise', () => {
  assert.deepEqual([at({}, 4).wire.from, at({}, 4).wire.to], ['alice', 'mallory']);
  const w = at({ attack: 'edit' }, 5).wire;
  assert.deepEqual([w.from, w.to, w.edited, w.resigned], ['mallory', 'bob', true, false]);
  assert.equal(at({ attack: 'resign' }, 5).wire.resigned, true);
  assert.equal(at({}, 5).wire.edited, false);
  for (const n of [0, 1, 2, 3, 6, 7, 8, 9]) assert.equal(at({}, n).wire, null);
});

test('unknown params fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ msg: 'x', attack: 'y' }), { msg: 'Plati 100 EUR', forged: 'Plati 900 EUR', attack: 'none' });
  assert.equal(logic.norm({ msg: 'Plati 900 EUR' }).forged, 'Plati 100 EUR');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const attack of logic.ATTACKS) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ attack }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const attack of logic.ATTACKS) {
    const p = P({ attack, msg: 'Plati 900 EUR' });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ attack: 'swapkey' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
