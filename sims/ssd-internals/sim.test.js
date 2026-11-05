// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ssd-internals' model (rules: SPEC.md). Run: node --test sims/ssd-internals/
// Tie-breaks first, then one test per rule, then the preset numbers, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const all = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };

/** A drive from page rows: numbers are valid LBAs, 'X' invalid, null free. */
function drive(pages, erase, active, ptr) {
  const d = logic.emptyDrive();
  d.pages = pages;
  d.erase = erase || [0, 0, 0, 0];
  d.active = active === undefined ? 0 : active;
  d.ptr = ptr === undefined ? 4 : ptr;
  d.map = {};
  pages.forEach((row, b) => row.forEach((v, p) => { if (typeof v === 'number') d.map[v] = [b, p]; }));
  return d;
}
const F = [null, null, null, null];

// ── tie-breaks (rule 5) ──

test('GC victim tie on invalid pages: the lower erase count wins', () => {
  const d = drive([[0, 'X', 'X', 1], [2, 3, 4, 5], ['X', 6, 'X', 7], F], [1, 0, 0, 0], 2);
  assert.equal(logic.pickVictim(d), 2);
});

test('GC victim tie on invalid pages and erase count: the lower block number wins', () => {
  const d = drive([[2, 3, 4, 5], [0, 'X', 'X', 1], ['X', 6, 'X', 7], F], [0, 1, 1, 0], 2);
  assert.equal(logic.pickVictim(d), 1);
  const d2 = drive([F, [0, 'X', 'X', 1], [2, 3, 4, 5], ['X', 6, 'X', 7]], [0, 0, 0, 0], 3);
  assert.equal(logic.pickVictim(d2), 1);
});

test('GC victim: the most invalid pages beat a lower erase count and a lower number', () => {
  const d = drive([[0, 'X', 1, 2], [3, 4, 5, 6], ['X', 'X', 'X', 7], F], [0, 0, 5, 0], 2);
  assert.equal(logic.pickVictim(d), 2);
});

test('GC victim: only full blocks are candidates', () => {
  const d = drive([[0, 'X', 1, 2], [3, 4, 5, 6], F, ['X', 'X', 7, null]], [0, 0, 0, 0], 0);
  assert.equal(logic.pickVictim(d), 0);
});

test('GC event: invalid count, the erase count after the erase, and which tie-break decided', () => {
  // EB2 beats EB0 on the erase count; EB3 is not tied (fewer invalid pages); no reserve problem (EB1 free)
  const a = logic.gcRun(drive([[0, 'X', 'X', 1], F, ['X', 6, 'X', 7], [2, 3, 'X', 4]], [1, 0, 0, 0], 2)).ev;
  assert.deepEqual([a.victim, a.invalid, a.erase, a.tiedErase, a.tiedNumber], [2, 2, 1, [0], []]);
  // EB1 beats EB2 on the number (same erase count) and EB3 on the erase count: a mixed tie
  const b = logic.gcRun(drive([F, [0, 'X', 'X', 1], ['X', 6, 'X', 7], [2, 'X', 3, 'X']], [0, 1, 1, 2], 3)).ev;
  assert.deepEqual([b.victim, b.invalid, b.erase, b.tiedErase, b.tiedNumber], [1, 2, 2, [3], [2]]);
  // no tie
  const c = at({}, 4).ev;
  assert.deepEqual([c.victim, c.invalid, c.erase, c.tiedErase, c.tiedNumber], [0, 2, 1, [], []]);
});

// ── rules ──

test('rule 1: no page is ever programmed unless it was erased', () => {
  for (const pattern of logic.PATTERN_IDS) {
    const st = all({ pattern, extra: 'w3 w3 t0 w0 w9' });
    for (let n = 1; n < st.length; n++) {
      const a = st[n - 1], b = st[n];
      for (let k = 0; k < 4; k++) for (let p = 0; p < 4; p++) {
        const before = a.pages[k][p], after = b.pages[k][p];
        if (typeof after === 'number' && after !== before) assert.equal(before, null, `${pattern} step ${n}: EB${k}.${p} programmed over ${before}`);
      }
    }
  }
  assert.throws(() => logic.writeLba(drive([[0, 1, null, null], F, F, F], null, 0, 1), 5), /not erased/);
});

test('rule 2: a write goes to the next free page of the active block and invalidates the old page', () => {
  const a = at({}, 1);                          // hot: after the fill, EB2 is active with 2 pages
  assert.equal(a.active, 2);
  assert.equal(a.ptr, 2);
  const b = at({}, 2);                          // write 0
  assert.deepEqual(b.ev, { kind: 'write', lba: 0, to: [2, 2], from: [0, 0], opened: null });
  assert.equal(b.pages[2][2], 0);
  assert.equal(b.pages[0][0], 'X');
  assert.deepEqual(b.map['0'], [2, 2]);
  assert.equal(b.host, 1);
  assert.equal(b.nand, 1);
});

test('rule 3: erase is per whole block and adds one to that block\'s counter only', () => {
  for (const pattern of logic.PATTERN_IDS) {
    const st = all({ pattern });
    for (let n = 1; n < st.length; n++) {
      const a = st[n - 1], b = st[n];
      const diff = b.erase.map((e, k) => e - a.erase[k]);
      if (b.ev.kind === 'gc') {
        diff.forEach((x, k) => assert.equal(x, k === b.ev.victim ? 1 : 0, `${pattern} step ${n}`));
        assert.deepEqual(b.pages[b.ev.victim], [null, null, null, null]);
      } else {
        assert.deepEqual(diff, [0, 0, 0, 0], `${pattern} step ${n}: only GC erases`);
        // a page goes back to free only by an erase
        for (let k = 0; k < 4; k++) for (let p = 0; p < 4; p++) if (a.pages[k][p] !== null) assert.notEqual(b.pages[k][p], null);
      }
    }
  }
});

test('rule 4: a full active block opens the lowest-numbered free block while two are free', () => {
  const s = at({ pattern: 'fill' }, 5);         // write 4 on a drive with EB0 full
  assert.deepEqual(s.ev, { kind: 'write', lba: 4, to: [1, 0], from: null, opened: 1 });
  const d = drive([[0, 1, 2, 3], F, [4, 5, 6, 7], F], null, 0, 4);
  assert.equal(logic.needsGc(d), false);
  assert.deepEqual(logic.writeLba(d, 8).ev.to, [1, 0]);
  const d2 = drive([[0, 1, 2, 3], [4, 5, 6, 7], F, F], null, 1, 4);
  assert.deepEqual(logic.writeLba(d2, 8).ev.to, [2, 0]);
});

test('rule 4: with one free block left, GC runs as its own step and the write follows', () => {
  const s3 = at({}, 3);                         // hot: write 1 fills EB2
  assert.equal(s3.ptr, 4);
  assert.equal(logic.freeBlocks(s3).length, 1);
  assert.equal(logic.reserveOf(s3), 3);
  assert.equal(logic.needsGc(s3), true);
  const s4 = at({}, 4);
  assert.equal(s4.ev.kind, 'gc');
  assert.equal(s4.host, s3.host, 'GC is not a host write');
  const s5 = at({}, 5);
  assert.deepEqual(s5.ev, { kind: 'write', lba: 2, to: [3, 2], from: [3, 0], opened: null });
  // one block is always free after every step of every run
  for (const pattern of logic.PATTERN_IDS) for (const s of all({ pattern, extra: 'w1 w1 w1 w1' })) {
    const free = [0, 1, 2, 3].filter((b) => s.pages[b].every((v) => v === null));
    assert.ok(free.length >= 1, pattern);
  }
});

test('rule 5: GC copies the victim\'s valid pages in order into the reserve, erases it, and the reserve becomes active', () => {
  const s4 = at({}, 4);                         // hot GC 1: EB0 = X X 2 3
  assert.deepEqual(s4.ev.moves, [{ lba: 2, from: [0, 2], to: [3, 0] }, { lba: 3, from: [0, 3], to: [3, 1] }]);
  assert.equal(s4.ev.victim, 0);
  assert.equal(s4.ev.to, 3);
  assert.equal(s4.active, 3);
  assert.equal(s4.ptr, 2);
  assert.deepEqual(s4.pages[3], [2, 3, null, null]);
  assert.deepEqual(s4.map['2'], [3, 0]);
  assert.equal(s4.nand, at({}, 3).nand + 2);
  assert.equal(logic.reserveOf(s4), 0, 'the erased victim is the new reserve');
  assert.deepEqual(s4.gc, [{ victim: 0, to: 3, moved: 2 }]);
});

test('rule 6: TRIM invalidates without a NAND write, and GC no longer copies those pages', () => {
  const s1 = at({ pattern: 'trim' }, 1), s2 = at({ pattern: 'trim' }, 2);
  assert.equal(s2.ev.kind, 'trim');
  assert.equal(s2.nand, s1.nand);
  assert.equal(s2.host, s1.host);
  assert.deepEqual(s2.pages[1], [4, 5, 'X', 'X']);
  assert.deepEqual(s2.pages[2], ['X', 'X', null, null]);
  for (const l of [6, 7, 8, 9]) assert.equal(s2.map[String(l)], undefined);
  assert.deepEqual(s2.trimmed, [6, 7, 8, 9]);
  // the first GC of the trim run copies one page (LBA 5), not three
  const st = all({ pattern: 'trim' });
  const gc1 = st.find((s) => s.ev && s.ev.kind === 'gc');
  assert.deepEqual(gc1.ev.moves.map((m) => m.lba), [5]);
  // TRIM of an unmapped LBA does nothing
  const r = logic.trim(s2, [7]);
  assert.deepEqual(r.ev.misses, [7]);
  assert.deepEqual(r.d.pages, s2.pages);
  // writing a trimmed LBA has no old page to invalidate, and it is no longer in `trimmed`
  const w = logic.writeLba(s2, 7);
  assert.equal(w.ev.from, null);
  assert.deepEqual(w.d.trimmed, [6, 8, 9]);
  assert.equal(w.d.pages.flat().filter((v) => v === 'X').length, s2.pages.flat().filter((v) => v === 'X').length);
  // a missed TRIM does not add the LBA to `trimmed`
  assert.deepEqual(logic.trim(logic.emptyDrive(), [4]).d.trimmed, []);
});

test('rule 7: write amplification counts host writes and GC copies; the fill alone is 1.0', () => {
  assert.equal(logic.wa(logic.emptyDrive()), null);
  const f = at({}, 1);
  assert.deepEqual([f.ev.kind, f.ev.host, f.ev.nand], ['fill', 10, 10]);
  assert.deepEqual([f.host, f.nand], [0, 0], 'the counters start after the fill');
  const ff = last({ pattern: 'fill' });
  assert.deepEqual([ff.host, ff.nand, logic.wa(ff)], [10, 10, 1]);
  const s = at({}, 4);
  assert.equal(s.nand - s.host, 2, 'the GC copies are NAND writes the host never asked for');
});

// ── preset numbers (SPEC.md "Presets") ──

test('preset numbers: host, NAND, WA, GC runs, erase counts, steps', () => {
  const want = {
    hot: { steps: 12, host: 8, nand: 14, wa: 1.75, gc: [[0, 2], [3, 2], [2, 2]], erase: [1, 0, 1, 1] },
    spread: { steps: 15, host: 8, nand: 26, wa: 3.25, gc: [[0, 3], [1, 3], [2, 3], [3, 3], [0, 3], [1, 3]], erase: [2, 2, 1, 1] },
    trim: { steps: 13, host: 8, nand: 13, wa: 1.625, gc: [[1, 1], [0, 2], [2, 2]], erase: [1, 1, 1, 0] },
    fill: { steps: 10, host: 10, nand: 10, wa: 1, gc: [], erase: [0, 0, 0, 0] }
  };
  for (const pattern of Object.keys(want)) {
    const w = want[pattern];
    assert.equal(logic.steps(P({ pattern })), w.steps, pattern);
    const s = last({ pattern });
    assert.equal(s.host, w.host, pattern);
    assert.equal(s.nand, w.nand, pattern);
    assert.equal(logic.wa(s), w.wa, pattern);
    assert.deepEqual(s.gc.map((g) => [g.victim, g.moved]), w.gc, pattern);
    assert.deepEqual(s.erase, w.erase, pattern);
    assert.equal(s.ev.kind, 'write', `${pattern}: the last step is a write`);
  }
  assert.equal(logic.steps(P({})), logic.steps(P({ pattern: 'hot' })), 'the default is hot-data');
});

// ── the ops the student adds ──

test('added ops run after the pattern; junk is ignored; the run stops at MAX_STEPS', () => {
  assert.deepEqual(logic.parseExtra('w3 x t5 w10 w'), [{ op: 'w', lba: 3 }, { op: 't', lbas: [5] }]);
  const p = P({ pattern: 'fill', extra: 'w3 t5' });
  assert.equal(logic.steps(p), 12);
  const s = last({ pattern: 'fill', extra: 'w3 t5' });
  assert.equal(s.ev.kind, 'trim');
  assert.deepEqual(s.map['3'], [2, 2]);
  assert.equal(s.map['5'], undefined);
  const long = P({ pattern: 'spread', extra: Array(30).fill('w0').join(' ') });
  assert.ok(logic.steps(long) <= logic.MAX_STEPS);
  assert.equal(logic.canAdd(long, 'w0'), false);
  assert.equal(logic.MAX_STEPS, 20, 'the contract: a stepper has at most about 20 steps');
  // an op that does not fit is skipped; a later one that fits still runs (spread + w0 w0 = 19 steps: a write needs
  // GC + write, a TRIM one step)
  const tight = P({ pattern: 'spread', extra: 'w0 w0' });
  assert.equal(logic.steps(tight), 19);
  assert.equal(logic.canAdd(tight, 'w0'), false);
  assert.equal(logic.canAdd(tight, 't0'), true);
  assert.deepEqual(logic.scriptOf(P({ pattern: 'spread', extra: 'w0 w0 w0 t5' })).slice(-1), [{ op: 't', lbas: [5] }]);
  assert.equal(logic.steps(P({ pattern: 'spread', extra: 'w0 w0 w0 t5' })), 20);
  assert.equal(logic.canAdd(P({}), 'w0'), true);
  assert.equal(logic.addOp(P({ extra: '' }), 'w4'), 'w4');
  assert.equal(logic.addOp(P({ extra: 'w4' }), 't2'), 'w4 t2');
});

test('past the end of the script a step changes nothing', () => {
  const p = P({});
  const s = kit.stateAt(logic, p, logic.steps(p));
  const t = logic.step(s, logic.steps(p) + 1, p);
  assert.deepEqual(t.pages, s.pages);
  assert.equal(t.ev.kind, 'idle');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pattern of logic.PATTERN_IDS) for (const s of all({ pattern, extra: 'w1 t2' })) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ pattern: 'trim', extra: 'w7 t0' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  for (let n = 0; n < logic.steps(p); n++) {
    const s0 = kit.stateAt(logic, p, n);
    const copy = structuredClone(s0);
    logic.step(s0, n + 1, p);
    assert.deepEqual(s0, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const pats = [...html.matchAll(/pattern:\s*'([\w-]+)'/g)].map((m) => m[1]);
  for (const id of pats) assert.ok(logic.PATTERN_IDS.includes(id), `pattern ${id}`);
});
