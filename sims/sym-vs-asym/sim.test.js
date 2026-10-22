// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for sym-vs-asym's model (SPEC.md). Run: node --test sims/sym-vs-asym/
// Tie-breaks first, then one test per rule, the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const phaseStep = (over, phase) => logic.phasesOf(P(over)).indexOf(phase) + 1;
const atPhase = (over, phase) => at(over, phaseStep(over, phase));
const last = (over) => at(over, stepsOf(over));
const keysOf = (s, kind) => s.keys.filter((k) => k.kind === kind);
const SCHEMES = ['both', 'symmetric', 'asymmetric'];

// ── tie-breaks ──

test('tie-break: at n = 5 both schemes need 10 keys and the comparison says equal; 4 → asym, 6 → sym', () => {
  assert.equal(logic.symKeys(5), 10);
  assert.equal(logic.asymKeys(5), 10);
  assert.equal(logic.moreKeys(5), 'equal');
  assert.equal(logic.moreKeys(4), 'asym');
  assert.equal(logic.moreKeys(6), 'sym');
  assert.equal(logic.moreKeys(2), 'asym', 'n = 2: 1 shared key against 2 pairs (4 keys)');
  assert.equal(at({ n: 5 }, 0).more, 'equal');
  assert.equal(atPhase({ n: 4 }, 'join').more, 'equal', 'office4 grows to 5 at the join');
});

test('tie-break: a shared key has one id whichever side names it, and keys keep one order after a join', () => {
  assert.equal(logic.sharedId(1, 0), logic.sharedId(0, 1));
  assert.equal(logic.sharedId(3, 1), 's-1-3');
  for (const n of [2, 4, 10]) {
    const s = atPhase({ n }, 'join');
    assert.deepEqual(s.keys.map((k) => k.id), logic.groupKeys(n + 1).map((k) => k.id), `n = ${n}`);
    assert.equal(new Set(s.keys.map((k) => k.id)).size, s.keys.length, 'no duplicate key');
  }
});

// ── rule 1: symmetric, the same key both ways, carried first ──

test('rule 1: the shared key is carried secretly before Alice encrypts, and Bob decrypts with the same key', () => {
  const carry = phaseStep({}, 'carry'), enc = phaseStep({}, 'symEnc');
  assert.ok(carry < enc);
  assert.equal(logic.find(at({}, carry - 1).keys, 's-0-1').made, false, 'no key before the transfer');
  const k = logic.find(at({}, carry).keys, 's-0-1');
  assert.equal(k.made, true);
  assert.equal(k.travelled, 'secret');
  const m = atPhase({}, 'symDec').lanes.sym.msgs[0];
  assert.equal(m.keyUsed, 's-0-1');
  assert.equal(m.decryptedWith, 's-0-1');
  assert.equal(m.stage, 'read');
});

test('rule 1: every shared key in the bill is one secret transfer', () => {
  for (const n of [2, 4, 7, 30]) {
    const c = at({ n }, 0).counts.sym;
    assert.equal(c.secretTransfers, c.total, `n = ${n}`);
  }
});

test('rule 1: the reply uses the same shared key in the other direction', () => {
  const m = last({ scheme: 'symmetric' }).lanes.sym.msgs[1];
  assert.deepEqual([m.from, m.to], [logic.BOB, logic.ALICE]);
  assert.equal(m.keyUsed, 's-0-1');
  assert.equal(m.decryptedWith, 's-0-1');
});

// ── rule 2: asymmetric, encrypt with the public key, decrypt with the private one ──

test('rule 2: Alice encrypts with Bob\'s public key and only his private key decrypts', () => {
  const m = atPhase({}, 'asymDec').lanes.asym.msgs[0];
  assert.equal(m.keyUsed, 'pub-1');
  assert.equal(m.decryptedWith, 'priv-1');
  assert.equal(logic.decryptingKey(logic.groupKeys(2), 'pub-0'), 'priv-0');
});

test('rule 2: private keys are never transmitted, public keys travel openly, nothing asymmetric travels secretly', () => {
  for (const scheme of SCHEMES) for (const n of [2, 4]) {
    for (let i = 0; i <= stepsOf({ scheme, n }); i++) {
      const s = at({ scheme, n }, i);
      for (const k of keysOf(s, 'private')) assert.equal(k.travelled, 'none', `${scheme} n=${n} step ${i} ${k.id}`);
      for (const k of keysOf(s, 'public')) assert.equal(k.travelled, k.made ? 'open' : 'none');
      assert.equal(s.counts.asym.secretTransfers, 0);
      assert.ok(!s.eve.keys.some((id) => id.startsWith('priv-')), 'Eve never holds a private key');
    }
  }
});

test('rule 2: the reply needs Alice\'s public key: she publishes hers and Bob encrypts with it', () => {
  const s = last({ scheme: 'asymmetric' });
  assert.equal(logic.find(s.keys, 'pub-0').made, true);
  const m = s.lanes.asym.msgs[1];
  assert.equal(m.keyUsed, 'pub-0');
  assert.equal(m.decryptedWith, 'priv-0');
  assert.equal(m.eveCanRead, false);
});

// ── rule 3: counting ──

test('rule 3: n(n−1)/2 shared keys against n pairs = 2n keys, for every n', () => {
  for (let n = logic.nMin; n <= logic.nMax; n++) {
    const s = at({ n }, 0);
    assert.equal(s.counts.sym.total, n * (n - 1) / 2, `sym n=${n}`);
    assert.equal(keysOf(s, 'shared').length, n * (n - 1) / 2);
    assert.equal(s.counts.asym.pairs, n);
    assert.equal(s.counts.asym.total, 2 * n);
    assert.equal(logic.symKeys(n), s.counts.sym.total);
    assert.equal(logic.asymKeys(n), s.counts.asym.total);
  }
});

test('rule 3: the bill does not change while the two of them talk, only at the join', () => {
  const s0 = at({ n: 4 }, 0), before = at({ n: 4 }, phaseStep({}, 'join') - 1);
  assert.deepEqual(before.counts, s0.counts);
});

// ── rule 4: a newcomer ──

test('rule 4: a newcomer adds n shared keys (one per member) but one key pair', () => {
  for (const n of [2, 4, 10, 30]) {
    const before = at({ n }, phaseStep({}, 'join') - 1), s = atPhase({ n }, 'join');
    assert.equal(s.n, n + 1);
    assert.equal(s.counts.sym.total - before.counts.sym.total, n, `sym +n at n=${n}`);
    assert.equal(s.counts.asym.pairs - before.counts.asym.pairs, 1);
    assert.deepEqual(s.joined, { who: n, sym: n, asym: 1 });
    const added = keysOf(s, 'shared').filter((k) => k.pair[1] === n);
    assert.equal(added.length, n);
    assert.ok(added.every((k) => s.changed.includes(k.id)), 'the new keys are marked changed');
  }
});

// ── rule 5: hybrid ──

test('rule 5: hybrid (TLS order): one public-key operation for a fresh key, then all data with it, nothing secret travels', () => {
  const s = atPhase({}, 'hybrid');
  const [wrap, ...data] = s.lanes.hybrid.msgs;
  assert.equal(wrap.carries, 'session');
  assert.equal(wrap.keyUsed, 'pub-1');
  assert.equal(wrap.decryptedWith, 'priv-1');
  assert.equal(data.length, logic.HYBRID_DATA);
  assert.ok(data.every((m) => m.keyUsed === 'session' && m.decryptedWith === 'session'));
  assert.deepEqual(s.hybrid, { publicOps: 1, symmetricMsgs: logic.HYBRID_DATA, secretTransfers: 0 });
  assert.equal(phaseStep({}, 'hybrid'), stepsOf({}), 'hybrid is the last step');
  assert.ok(phaseStep({}, 'publish') < phaseStep({}, 'hybrid'), 'Bob\'s public key exists before the hybrid uses it');
});

// ── rule 6: what Eve can read ──

test('rule 6: Eve with only public keys and ciphertexts reads nothing', () => {
  const s = last({});
  assert.deepEqual(s.eve.keys, ['pub-1']);
  for (const lane of Object.values(s.lanes)) for (const m of lane.msgs) {
    assert.equal(m.eveCopy, true, m.id);
    assert.equal(m.eveCanRead, false, m.id);
  }
});

test('rule 6: Eve holding a copy of the shared key reads the first message and every later one', () => {
  const p = { scheme: 'symmetric', eveHasSharedKey: true };
  assert.ok(atPhase(p, 'carry').eve.keys.includes('s-0-1'));
  assert.equal(atPhase(p, 'symEve').lanes.sym.msgs[0].eveCanRead, true);
  const s = last(p);
  assert.deepEqual(s.lanes.sym.msgs.map((m) => m.eveCanRead), [true, true]);
});

test('rule 6: the stolen shared key does not open the asymmetric or the hybrid messages', () => {
  const s = last({ eveHasSharedKey: true });
  assert.equal(s.lanes.sym.msgs[0].eveCanRead, true);
  assert.equal(s.lanes.asym.msgs[0].eveCanRead, false);
  assert.ok(s.lanes.hybrid.msgs.every((m) => !m.eveCanRead));
  assert.equal(logic.canRead(s.keys, ['pub-1', 's-0-1'], 'pub-1'), false);
  assert.equal(logic.canRead(s.keys, ['priv-1'], 'pub-1'), true);
});

test('rule 6: without the toggle Eve copies the symmetric ciphertext but cannot read it', () => {
  const m = atPhase({}, 'symEve').lanes.sym.msgs[0];
  assert.equal(m.stage, 'wire');
  assert.equal(m.eveCopy, true);
  assert.equal(m.eveCanRead, false);
});

// ── invariants over every run, step and message ──

const ALL_RUNS = [];
for (const scheme of SCHEMES) for (const n of [2, 4, 13]) for (const eveHasSharedKey of [false, true]) ALL_RUNS.push({ scheme, n, eveHasSharedKey });

test('every message is encrypted with a key the receiver can open, made before it is used (rules 1, 2, 5)', () => {
  for (const over of ALL_RUNS) {
    for (let i = 1; i <= stepsOf(over); i++) {
      const s = at(over, i);
      for (const [sc, lane] of Object.entries(s.lanes)) for (const m of lane.msgs) {
        const where = `${JSON.stringify(over)} step ${i} ${sc} ${m.id}`;
        assert.notEqual(m.from, m.to, where);
        if (!m.keyUsed) continue;
        if (m.keyUsed === 'session') {
          const wrap = lane.msgs[0]; // the session key reached the receiver first, wrapped for them
          assert.equal(wrap.carries, 'session', where);
          assert.deepEqual([wrap.from, wrap.to], [m.from, m.to], where);
          continue;
        }
        const k = logic.find(s.keys, m.keyUsed);
        assert.ok(k && k.made, `key made: ${where}`);
        if (k.kind === 'public') assert.equal(k.owner, m.to, `the receiver's public key: ${where}`);
        else assert.ok(k.pair.includes(m.from) && k.pair.includes(m.to), `the pair's shared key: ${where}`);
        if (m.decryptedWith) {
          const d = logic.find(s.keys, m.decryptedWith);
          assert.ok(d.made, where);
          if (d.kind === 'private') assert.equal(d.owner, m.to, `only the receiver's private key: ${where}`);
          else assert.equal(d.id, k.id, where);
        }
      }
    }
  }
});

test('whole messages (replies, hybrid) are read by the receiver and keep their ciphertext on the wire', () => {
  for (const over of [{ scheme: 'symmetric' }, { scheme: 'asymmetric' }, {}]) {
    const s = last(over);
    const whole = Object.values(s.lanes).flatMap((l) => l.msgs).filter((m) => m.whole);
    assert.ok(whole.length > 0);
    for (const m of whole) { assert.equal(m.stage, 'read', m.id); assert.equal(m.eveCopy, true, m.id); }
  }
  for (const m of last({}).lanes.sym.msgs.concat(last({}).lanes.asym.msgs)) assert.equal(m.whole, false, 'step-by-step messages are not whole');
});

test('the asymmetric reply makes Alice\'s pair (private stays home) and Eve takes her public key', () => {
  const s = last({ scheme: 'asymmetric' });
  assert.deepEqual([logic.find(s.keys, 'priv-0').made, logic.find(s.keys, 'priv-0').travelled], [true, 'none']);
  assert.deepEqual(s.eve.keys, ['pub-1', 'pub-0']);
});

test('the newcomer\'s keys join the bill as not made yet', () => {
  const s = atPhase({ n: 4 }, 'join');
  const mine = s.keys.filter((k) => k.owner === 4 || (k.pair && k.pair.includes(4)));
  assert.equal(mine.length, 4 + 2);
  assert.ok(mine.every((k) => !k.made && k.travelled === 'none'));
});

test('changed: the ids the page highlights at each step of the default run', () => {
  const expected = [
    ['m-sym1', 'm-asym1'],
    ['s-0-1'],
    ['m-sym1'],
    ['m-sym1', 'eve-sym1'],
    ['m-sym1'],
    ['pub-1', 'priv-1', 'eve-pub-1'],
    ['m-asym1'],
    ['m-asym1', 'eve-asym1'],
    ['m-asym1'],
    ['p-4', 's-0-4', 's-1-4', 's-2-4', 's-3-4', 'pub-4', 'priv-4', 'count-sym', 'count-asym'],
    ['eve-hk', 'm-hk', 'eve-hd1', 'm-hd1', 'eve-hd2', 'm-hd2', 'eve-hd3', 'm-hd3']
  ];
  assert.deepEqual(at({}, 0).changed, []);
  for (let i = 1; i <= 11; i++) assert.deepEqual(at({}, i).changed, expected[i - 1], `step ${i}`);
  assert.deepEqual(atPhase({ eveHasSharedKey: true }, 'carry').changed, ['s-0-1', 'eve-s-0-1']);
  assert.deepEqual(last({ scheme: 'asymmetric' }).changed, ['pub-0', 'priv-0', 'eve-pub-0', 'eve-asym2', 'm-asym2']);
});

// ── steps, presets and params ──

test('each message moves plaintext at Alice → ciphertext at Alice → on the wire → read by Bob', () => {
  const want = { sym: ['want', 'symEnc', 'symEve', 'symDec'], asym: ['want', 'asymEnc', 'asymEve', 'asymDec'] };
  for (const sc of ['sym', 'asym']) {
    const stages = want[sc].map((ph) => atPhase({}, ph).lanes[sc].msgs[0].stage);
    assert.deepEqual(stages, ['plain', 'enc', 'wire', 'read'], sc);
    assert.deepEqual(at({}, 0).lanes[sc].msgs, [], 'no message before step 1');
  }
});

test('steps: 11 with both schemes, 6 with one; the sequence follows the task', () => {
  assert.equal(stepsOf({}), 11);
  assert.equal(stepsOf({ scheme: 'symmetric' }), 6);
  assert.equal(stepsOf({ scheme: 'asymmetric' }), 6);
  assert.deepEqual(logic.phasesOf(P({})), ['want', 'carry', 'symEnc', 'symEve', 'symDec', 'publish', 'asymEnc', 'asymEve', 'asymDec', 'join', 'hybrid']);
  // pinned explicitly: a key is made before it is used, and Eve copies before Bob reads
  assert.deepEqual(logic.phasesOf(P({ scheme: 'symmetric' })), ['want', 'carry', 'symEnc', 'symEve', 'symDec', 'symReply']);
  assert.deepEqual(logic.phasesOf(P({ scheme: 'asymmetric' })), ['want', 'publish', 'asymEnc', 'asymEve', 'asymDec', 'asymReply']);
  for (const scheme of SCHEMES) {
    const phases = [];
    for (let i = 1; i <= stepsOf({ scheme }); i++) phases.push(at({ scheme }, i).phase);
    assert.deepEqual(phases, logic.phasesOf(P({ scheme })));
  }
  assert.equal(at({}, 0).phase, 'start');
});

test('presets: the task\'s numbers', () => {
  // book: n = 2, symmetric needs 1 secret transfer, asymmetric 0
  let s = at({ n: 2 }, 0);
  assert.equal(s.counts.sym.total, 1);
  assert.equal(s.counts.sym.secretTransfers, 1);
  assert.equal(s.counts.asym.pairs, 2);
  assert.equal(s.counts.asym.secretTransfers, 0);
  assert.equal(last({ n: 2 }).keys.filter((k) => k.travelled === 'secret').length, 1, 'one key carried secretly in the demo');
  // office4: 6 shared keys against 4 pairs (8 keys)
  s = at({ n: 4 }, 0);
  assert.deepEqual([s.counts.sym.total, s.counts.asym.pairs, s.counts.asym.total], [6, 4, 8]);
  // class30: 435 against 30 pairs
  s = at({ n: 30 }, 0);
  assert.deepEqual([s.counts.sym.total, s.counts.asym.pairs], [435, 30]);
  // newcomer: 10 → 11, symmetric 45 → 55, asymmetric 10 → 11 pairs
  const b = at({ n: 10 }, 9), j = at({ n: 10 }, 10);
  assert.deepEqual([b.counts.sym.total, j.counts.sym.total, b.counts.asym.pairs, j.counts.asym.pairs], [45, 55, 10, 11]);
  // stolen: 6 steps, the symmetric half only
  assert.equal(stepsOf({ n: 2, scheme: 'symmetric', eveHasSharedKey: true }), 6);
  assert.deepEqual(last({ n: 2, scheme: 'symmetric' }).schemes, ['sym']);
});

test('n is clamped to the range 2…30 and rounded', () => {
  assert.deepEqual([logic.nMin, logic.nMax], [2, 30]);
  assert.equal(at({ n: 4.4 }, 0).n, 4);
  assert.equal(at({ n: 4.4 }, 0).counts.sym.total, 6);
  assert.equal(at({ n: 1 }, 0).n, logic.nMin);
  assert.equal(at({ n: 99 }, 0).n, logic.nMax);
});

test('only the schemes in play have a lane', () => {
  assert.deepEqual(Object.keys(at({ scheme: 'asymmetric' }, 0).lanes), ['asym']);
  assert.deepEqual(Object.keys(at({}, 0).lanes), ['sym', 'asym']);
  assert.ok(last({}).lanes.hybrid);
});

// ── generic checks every sim keeps ──

const RUNS = [{}, { n: 2 }, { n: 30 }, { scheme: 'symmetric', eveHasSharedKey: true }, { scheme: 'asymmetric', n: 7 }];

test('state is JSON-safe at every step', () => {
  for (const over of RUNS) {
    for (let n = 0; n <= stepsOf(over); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of RUNS) {
    const p = P(over), N = stepsOf(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
  let s = logic.initial(p);
  for (let n = 1; n <= stepsOf({}); n++) {
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
  assert.equal(meta.steps, stepsOf({}), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
