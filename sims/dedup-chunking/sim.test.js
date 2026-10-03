// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dedup-chunking's model (rules: SPEC.md). Run: node --test sims/dedup-chunking/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const texts = (s, cs) => cs.map((c) => s.slice(c.start, c.start + c.len));
const O8 = { D: 8, w: 4, min: 4, max: 16 };
const T = logic.TEXT;

// ── tie-breaks first ──

test('tie-break: a hash hit on a chunk shorter than min is ignored (min wins)', () => {
  // window 2, D 10: bytes '\x05' sum to 10 at every offset from 1 on, so every byte is a hit
  const s = '\x05'.repeat(9);
  const cs = logic.cdcChunks(s, { D: 10, w: 2, min: 3, max: 8 });
  assert.deepEqual(cs.map((c) => [c.start, c.len, c.cut]), [[0, 3, 'hash'], [3, 3, 'hash'], [6, 3, 'hash']]);
  assert.deepEqual(cs[0].ignored, [1]);            // the hit at offset 1 came when the chunk had 2 bytes
  assert.deepEqual(logic.cdcChunks(s, { D: 10, w: 2, min: 4, max: 8 })[0].ignored, [1, 2]);
  // hits after the last cut are recorded on the final chunk too (8/3 prepend: the hit after byte 66)
  assert.deepEqual(logic.cdcChunks('X' + T, { D: 8, w: 3, min: 4, max: 16 }).at(-1).ignored, [66]);
  // with min 1 the same hits cut at once
  assert.equal(logic.cdcChunks(s, { D: 10, w: 2, min: 1, max: 8 })[0].len, 2);
});

test('tie-break: at max the chunk is cut even without a hit; hash and max on one byte count as a hash cut', () => {
  const s = 'a'.repeat(20);                         // sum of 4 × 97 = 388, never a multiple of 8
  const cs = logic.cdcChunks(s, O8);
  assert.deepEqual(cs.map((c) => [c.len, c.cut]), [[16, 'max'], [4, 'end']]);
  // a hit exactly at max: '\x02' × 16, w 4: the sum is 8 from offset 3 on; min 16 suppresses every hit before byte 16
  const t = '\x02'.repeat(16);
  assert.deepEqual(logic.cdcChunks(t, { D: 8, w: 4, min: 16, max: 16 }).map((c) => c.cut), ['hash']);
  // the presets' file reaches max nowhere at size 8, but at size 16 / window 3 it does
  const maxCuts = logic.cdcChunks(T, { D: 16, w: 3, min: 8, max: 32 }).filter((c) => c.cut === 'max');
  assert.ok(maxCuts.length > 0);
  for (const c of maxCuts) {                         // a max cut still records its window and sum (the page shows both)
    const e = c.start + c.len - 1;
    assert.deepEqual(c.win, [e - 2, e]);
    assert.equal(typeof c.sum, 'number');
    assert.notEqual(c.sum % 16, 0);
  }
});

test('tie-break: identical chunks in one version are stored once', () => {
  const d = logic.dedup(logic.fixedChunks('abcdabcdabcd', 4), []);
  assert.deepEqual(d.chunks.map((c) => c.status), ['new', 'same', 'same']);
  assert.equal(d.store.length, 1);
  assert.equal(d.newBytes, 4);
  // the presets' file at size 4, window 3: 15 CDC chunks, two with the same bytes
  const s = at({ size: 4, window: 3 }, 1);
  assert.equal(s.cdc.orig.length, 15);
  assert.equal(s.cdc.store.length, 14);
  assert.equal(s.cdc.orig.filter((c) => c.status === 'same').length, 1);
  assert.deepEqual([s.cdc.origBytes, s.fixed.origBytes], [64, 66]);
});

// ── rules ──

test('rule 1: fixed chunks at 0, S, 2S, …; the last one shorter', () => {
  const cs = logic.fixedChunks(T, 8);
  assert.deepEqual(cs.map((c) => c.start), [0, 8, 16, 24, 32, 40, 48, 56, 64]);
  assert.deepEqual(cs.map((c) => c.len), [8, 8, 8, 8, 8, 8, 8, 8, 2]);
  assert.equal(logic.fixedChunks('X' + T, 4).length, 17);
  assert.equal(logic.fixedChunks('X' + T, 4)[16].len, 3);
});

test('rule 2: the rolling sum adds the entering byte and drops the leaving one; nothing until the window is full', () => {
  const sums = logic.rollingSums('abcde', 3);
  assert.deepEqual(sums, [null, null, 97 + 98 + 99, 98 + 99 + 100, 99 + 100 + 101]);
  // the first w - 1 bytes never cut on the hash: '\x08' is a hit with any window, but there is no value before 3
  assert.equal(logic.cdcChunks('\x08'.repeat(6), { D: 8, w: 4, min: 1, max: 99 })[0].len, 4);
  // the window crosses chunk boundaries: it is the last w bytes of the file, not of the chunk
  const cs = logic.cdcChunks(T, O8);
  const second = cs[1];
  assert.deepEqual(second.win, [second.start + second.len - 4, second.start + second.len - 1]);
  assert.equal(second.sum % 8, 0);
  // a chunk shorter than the window: its window reaches back into the chunk before (4/3: 'ja')
  const small = logic.cdcChunks(T, { D: 4, w: 3, min: 2, max: 8 });
  const ja = small.find((c) => T.slice(c.start, c.start + c.len) === 'ja');
  assert.ok(ja.win[0] < ja.start);
  assert.deepEqual(ja.win, [ja.start - 1, ja.start + 1]);
});

test('rule 2: the presets\' file cuts into the seven CDC chunks of SPEC.md', () => {
  const cs = logic.cdcChunks(T, O8);
  assert.deepEqual(texts(T, cs), ['kopija se ', 'radi', ' svaku noc', ' i sve je ured', 'no, a ni', 'tko je ne', ' provjerava']);
  assert.deepEqual(cs.map((c) => c.cut), ['hash', 'hash', 'hash', 'hash', 'hash', 'hash', 'end']);
  cs.slice(0, -1).forEach((c) => assert.equal(c.sum % 8, 0));
  assert.equal(cs[6].sum, null);
  // CDC chunks are not all the same size
  assert.deepEqual(cs.map((c) => c.len), [10, 4, 10, 14, 8, 9, 11]);
});

test('rule 4: same when the hash is in the store; only new chunks add bytes', () => {
  const store = logic.dedup(logic.fixedChunks('aaaabbbb', 4), []).store;
  const d = logic.dedup(logic.fixedChunks('bbbbcccc', 4), store);
  assert.deepEqual(d.chunks.map((c) => c.status), ['same', 'new']);
  assert.equal(d.newBytes, 4);
  assert.equal(d.store.length, 3);
  assert.equal(store.length, 2, 'the input store is not changed');
});

test('rule 5: prepend: every fixed chunk is new, CDC resynchronises after the first chunk', () => {
  const s = end({ edit: 'prepend' });
  assert.deepEqual(logic.totals(s.fixed), { same: 0, n: 9, newBytes: 67 });
  assert.deepEqual(logic.totals(s.cdc), { same: 6, n: 7, newBytes: 11 });
  assert.deepEqual(texts(s.edited, s.cdc.edited.filter((c) => c.status === 'new')), ['Xkopija se ']);
  // the boundaries after the first chunk are the old ones, moved by one byte
  assert.deepEqual(s.cdc.edited.slice(1).map((c) => c.start), s.cdc.orig.slice(1).map((c) => c.start + 1));
});

test('rule 5: insert in the middle: fixed chunks before the edit stay, CDC loses two', () => {
  const s = end({ edit: 'insert' });
  assert.deepEqual(logic.totals(s.fixed), { same: 3, n: 9, newBytes: 43 });
  assert.deepEqual(s.fixed.edited.map((c) => c.status), ['same', 'same', 'same', 'new', 'new', 'new', 'new', 'new', 'new']);
  assert.deepEqual(logic.totals(s.cdc), { same: 6, n: 8, newBytes: 15 });
  assert.deepEqual(texts(s.edited, s.cdc.edited.filter((c) => c.status === 'new')), [' i sve! j', 'e ured']);
});

test('rule 5: delete in the middle: 2 fixed reused, CDC 5 of 7', () => {
  const s = end({ edit: 'delete' });
  assert.equal(s.edited.length, 65);
  assert.equal(s.edit.text, ' ');
  assert.deepEqual(logic.totals(s.fixed), { same: 2, n: 9, newBytes: 49 });
  assert.deepEqual(logic.totals(s.cdc), { same: 5, n: 7, newBytes: 23 });
  assert.deepEqual(texts(s.edited, s.cdc.edited.filter((c) => c.status === 'new')), [' svakunoc ', 'i sve je ured']);
});

test('rule 5: no edit: both methods reuse every chunk', () => {
  const s = end({ edit: 'none' });
  assert.deepEqual(logic.totals(s.fixed), { same: 9, n: 9, newBytes: 0 });
  assert.deepEqual(logic.totals(s.cdc), { same: 7, n: 7, newBytes: 0 });
});

test('rule 5: small chunks (size 4): fixed 0 of 17, CDC 15 of 16', () => {
  const s = end({ edit: 'prepend', size: 4 });
  assert.deepEqual([s.min, s.max], [2, 8]);
  assert.deepEqual(logic.totals(s.fixed), { same: 0, n: 17, newBytes: 67 });
  assert.deepEqual(logic.totals(s.cdc), { same: 15, n: 16, newBytes: 7 });
});

// ── steps ──

test('steps: one per phase, one step per chunk (four at size 4), totals last', () => {
  const want = { prepend: 19, insert: 20, delete: 19, none: 19 };
  for (const [edit, n] of Object.entries(want)) assert.equal(logic.steps(P({ edit })), n, edit);
  assert.equal(logic.steps(P({ size: 4 })), 12);
  assert.equal(logic.steps(P({ size: 16 })), 12);
  assert.equal(logic.plan(P({ size: 16 })).gf, 1);
  const phases = [];
  for (let n = 0; n <= 19; n++) phases.push(at({}, n).phase);
  assert.deepEqual(phases, ['start', 'original', 'edit'].concat(Array(9).fill('fixed'), Array(7).fill('cdc'), ['totals']));
  // four per step at size 4
  assert.deepEqual(at({ size: 4 }, 3).last, [0, 1, 2, 3]);
  assert.deepEqual(at({ size: 4 }, 7).last, [16]);
  assert.deepEqual(at({}, 3).last, [0]);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
});

test('steps: a run that would pass 20 groups the fixed chunks two per step; no run passes 20', () => {
  const g = logic.plan(P({ size: 8, window: 5 }));
  assert.deepEqual([g.nf, g.nc, g.gf, g.gc, g.steps], [9, 9, 2, 1, 17]);
  assert.deepEqual(at({ size: 8, window: 5 }, 3).last, [0, 1]);
  for (const size of [4, 8, 16]) for (const window of [3, 4, 5]) for (const edit of logic.EDIT_IDS) {
    const p = P({ size, window, edit });
    const n = logic.steps(p);
    assert.ok(n <= 20, `${size}/${window}/${edit}: ${n}`);
    assert.equal(kit.stateAt(logic, p, n).phase, 'totals');
    assert.equal(kit.stateAt(logic, p, n - 1).phase, 'cdc');
  }
});

test('step 1 stores the original; step 2 edits; edited chunks appear only in their phase', () => {
  const s1 = at({}, 1), s2 = at({}, 2), s3 = at({}, 3);
  assert.equal(s1.fixed.orig.length, 9);
  assert.equal(s1.fixed.store.length, 9);
  assert.equal(s1.fixed.origBytes, 66);
  assert.equal(s1.cdc.store.length, 7);
  assert.equal(s1.edited, null);
  assert.equal(s2.edited, 'X' + T);
  assert.deepEqual(s2.fixed.edited, []);
  assert.equal(s3.fixed.edited.length, 1);
  assert.deepEqual(s3.cdc.edited, []);
  assert.equal(at({}, 12).cdc.edited.length, 1);
});

test('rule 5: a max cut carries the shift on; at 16/3 CDC never resynchronises before the end of the file', () => {
  const ins = end({ size: 16, window: 3, edit: 'insert' });
  assert.equal(ins.cdc.edited.at(-1).status, 'new');
  assert.deepEqual(logic.totals(end({ size: 16, window: 3, edit: 'delete' }).cdc), { same: 0, n: 3, newBytes: 65 });
  // 8/3 insert: a max cut moved with the edit, so the chunk after it is new too
  const late = end({ size: 8, window: 3, edit: 'insert' });
  const i = late.cdc.edited.findIndex((c) => c.cut === 'max' && c.status === 'new');
  assert.ok(i >= 0);
  assert.equal(late.cdc.edited[i + 1].status, 'new');
  assert.equal(late.cdc.edited.at(-1).status, 'same');
});

test('state: stores grow with the new chunks; cursor counts the chunks decided', () => {
  assert.equal(end({}).fixed.store.length, 18);
  assert.equal(end({}).cdc.store.length, 8);
  assert.equal(at({}, 3).cursor, 1);
  assert.equal(at({}, 13).cursor, 2);
  assert.equal(at({ size: 4 }, 4).cursor, 8);
});

test('finalChunks: the whole run of the edited file, against the original\'s store', () => {
  assert.deepEqual(logic.finalChunks(at({}, 2), 'cdc').map((c) => c.status), ['new'].concat(Array(6).fill('same')));
  assert.equal(logic.finalChunks(at({ edit: 'insert' }, 2), 'cdc').length, 8);
  assert.equal(logic.finalChunks(at({ edit: 'insert' }, 2), 'fixed').filter((c) => c.status === 'same').length, 3);
});

test('hash: 8 hex digits, differs for a one-byte shift; short hashes never collide on the page', () => {
  assert.match(logic.hash('radi'), /^[0-9a-f]{8}$/);
  assert.equal(logic.hash(''), '811c9dc5');          // FNV-1a offset basis
  assert.equal(logic.hash('a'), 'e40c292c');         // published FNV-1a 32-bit test vector
  assert.notEqual(logic.hash('kopija s'), logic.hash('Xkopija '));
  for (const size of [4, 8, 16]) for (const window of [3, 4, 5]) for (const edit of logic.EDIT_IDS) {
    const s = end({ size, window, edit });
    const seen = new Map();
    for (const m of [s.fixed, s.cdc]) for (const [txt, cs] of [[s.original, m.orig], [s.edited, m.edited]]) {
      for (const c of cs) {
        const short = c.hash.slice(0, 4), body = txt.slice(c.start, c.start + c.len);
        if (seen.has(short)) assert.equal(seen.get(short), body, `${size}/${window}/${edit} ${short}`);
        seen.set(short, body);
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { size: 4, edit: 'delete' }, { size: 16, window: 3, edit: 'insert' }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{}, { size: 4 }, { size: 8, window: 5, edit: 'delete' }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input; no step after totals', () => {
  const p = P({ edit: 'insert' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
  assert.throws(() => logic.step(s, logic.steps(p) + 1, p));
});

test('unknown params fall back to the defaults', () => {
  assert.equal(logic.steps(P({ size: 7, window: 9, edit: 'nope' })), 19);
  assert.equal(logic.settings({ size: 7, window: 9 }).w, 4);
  assert.equal(logic.settings({ size: 7, window: 9 }).S, 8);
  assert.equal(at({ edit: 'nope' }, 2).edited, 'X' + T);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.ok(presets.length >= 5, 'found the presets');
  for (const m of presets) {
    for (const k of [...m[1].matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const edit = m[1].match(/edit:\s*'([^']+)'/);
    if (edit) assert.ok(logic.EDIT_IDS.includes(edit[1]), edit[1]);
  }
});
