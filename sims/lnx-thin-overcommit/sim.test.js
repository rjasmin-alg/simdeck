// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the thin provisioning model. Run: node --test sims/lnx-thin-overcommit/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the captions, then the
// generic block.
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
const run = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id, over) => logic.compute(P(Object.assign({}, preset(id).params, over)));
const FREE = logic.FREE;

// ── tie-breaks ──

test('tie-break (rule 7): writes go in volume order, so the last volume hits the full pool', () => {
  // the same total either way round: 70 + 20 + 20 in a pool of 100
  const s = run({ virt: 80, w1: 70, w2: 20, w3: 20 });
  assert.deepEqual(s.lvs.map((x) => x.refused), [0, 0, 10]);
  assert.deepEqual(s.firstRefused, { lv: 2, at: 10, free: 70 });
  // swap the big writer to the end: thin3 still is the one refused, now 50 of its 70
  const t = run({ virt: 80, w1: 20, w2: 20, w3: 70 });
  assert.deepEqual(t.lvs.map((x) => x.refused), [0, 0, 10]);
  assert.equal(t.lvs[2].written, 60);
  // the pool cells are taken in volume order: thin1's first, then thin2's
  assert.equal(s.pool.cells[0], 0);
  assert.equal(s.pool.cells[69], 0);
  assert.equal(s.pool.cells[70], 1);
  assert.equal(s.pool.cells[90], 2);
});

test('tie-break (rule 6): at exactly the threshold nothing grows; one GiB over, it grows', () => {
  // pool 100, threshold 70: 70 GiB used is 70 %, not over it
  const at = run({ n: 1, virt: 70, w1: 70, autoextend: true, threshold: 70, percent: 20, vgFree: 50 });
  assert.equal(at.pool.size, 100);
  assert.deepEqual(at.extended, []);
  const over = run({ n: 1, virt: 80, w1: 71, autoextend: true, threshold: 70, percent: 20, vgFree: 50 });
  assert.equal(over.pool.size, 120);
  assert.deepEqual(over.extended, [{ from: 100, to: 120, by: 20, at: 71 }]);
  // the comparison is in whole numbers: 85 of 120 = 70.83 % grows; 84 of 120 = 70 % does not
  const st = logic.createPool(120, 1, 200, 50);
  for (let i = 0; i < 84; i++) logic.write(st, 0, i);
  assert.equal(logic.autoextend(st, { on: true, threshold: 70, percent: 20 }), null);
  logic.write(st, 0, 84);
  assert.equal(logic.autoextend(st, { on: true, threshold: 70, percent: 20 }), 'grew');
  assert.equal(st.cells.length, 144);
});

test('tie-break (rule 4): thin1 deletes right after its own writes, before thin2 writes, and discard lets later volumes reuse the cells', () => {
  const s = run({ virt: 80, w1: 70, w2: 20, w3: 20, deleted1: 30, discard: true });
  assert.equal(s.refused, 0);                     // the 30 GiB came back before thin3 needed them
  assert.equal(s.pool.used, 80);
  for (let i = 0; i < 30; i++) assert.equal(s.pool.cells[i], 1 + (i >= 20 ? 1 : 0), `cell ${i}`);   // thin2 then thin3 in thin1's old cells
  const kept = run({ virt: 80, w1: 70, w2: 20, w3: 20, deleted1: 30, discard: false });
  assert.equal(kept.refused, 10);
});

// ── rule 1: virtual size; allocation on first write ──

test('rule 1: creating thin volumes allocates nothing; a first write takes the lowest free cell, a second write of the same block none', () => {
  const st = logic.createPool(10, 2, 50, 0);
  assert.equal(logic.used(st), 0);
  assert.deepEqual(st.lvs.map((x) => x.name), ['thin1', 'thin2']);
  assert.equal(logic.write(st, 1, 7), 'alloc');
  assert.equal(st.cells[0], 1);
  assert.equal(logic.write(st, 0, 0), 'alloc');
  assert.equal(st.cells[1], 0);
  assert.equal(logic.write(st, 1, 7), 'rewrite');
  assert.equal(logic.used(st), 2);
  const s = run({ w1: 0, w2: 0, w3: 0 });
  assert.equal(s.pool.used, 0);
  assert.ok(s.pool.cells.every((c) => c === FREE));
  assert.equal(run({ w1: 13, w2: 0, w3: 0 }).pool.used, 13);
});

// ── rule 2: overcommit allowed, warned ──

test('rule 2: the sum of virtual sizes may exceed the pool; it is allowed and warned about', () => {
  const s = run({ n: 3, virt: 50, pool: 100 });
  assert.equal(s.promised, 150);
  assert.equal(s.overcommit, 150);
  assert.equal(s.warned, true);
  const ok = run({ n: 2, virt: 50, pool: 100 });
  assert.equal(ok.promised, 100);
  assert.equal(ok.warned, false);       // exactly the pool is not over it
  assert.equal(run({ n: 4, virt: 100, pool: 50 }).overcommit, 800);
});

// ── rule 3: Data% ──

test('rule 3: pool Data% = allocated / pool size; a volume Data% = its allocated / its virtual size', () => {
  const s = run({ pool: 80, n: 2, virt: 40, w1: 30, w2: 10 });
  assert.equal(s.pool.pct, 50);
  assert.equal(s.lvs[0].dataPct, 75);
  assert.equal(s.lvs[1].dataPct, 25);
  const st = logic.createPool(4, 1, 10, 0);
  logic.write(st, 0, 0);
  assert.equal(logic.dataPct(st), 25);
  // after an autoextension the pool Data% is against the new size
  const a = fromPreset('autoextend');
  assert.ok(Math.abs(a.pool.pct - 130 * 100 / 144) < 1e-9);
});

// ── rule 4: deleting does not return cells without discard ──

test('rule 4: deleted files stay allocated in the pool unless discarded; the filesystem shows them free either way', () => {
  const kept = run({ virt: 80, w1: 70, w2: 20, w3: 0, deleted1: 30, discard: false });
  assert.equal(kept.pool.used, 90);
  assert.equal(kept.lvs[0].allocated, 70);
  assert.equal(kept.lvs[0].fsUsed, 40);
  assert.equal(kept.lvs[0].kept, 30);
  assert.equal(kept.lvs[0].fsFree, 40);
  assert.deepEqual(kept.pool.kept, Array.from({ length: 30 }, (_, i) => i));   // thin1's oldest 30 cells, still held
  const freed = run({ virt: 80, w1: 70, w2: 20, w3: 0, deleted1: 30, discard: true });
  assert.equal(freed.pool.used, 60);
  assert.equal(freed.lvs[0].allocated, 40);
  assert.equal(freed.lvs[0].kept, 0);
  assert.equal(freed.lvs[0].fsFree, 40);
  assert.equal(freed.lvs[0].discarded, 30);
  assert.deepEqual(freed.pool.kept, []);
  // only what was written can be deleted
  assert.equal(run({ w1: 10, deleted1: 50 }).lvs[0].deletedInFs, 10);
  // discard primitive: unmapped blocks free nothing
  const st = logic.createPool(5, 1, 10, 0);
  logic.write(st, 0, 0);
  assert.equal(logic.discard(st, 0, [0, 3]), 1);
  assert.equal(logic.used(st), 0);
});

// ── rule 5: pool full refuses new blocks for every volume; rewrites work ──

test('rule 5: when the pool is full a new block is refused for every volume, even an empty one; rewrites still work', () => {
  const st = logic.createPool(3, 3, 50, 0);
  logic.write(st, 0, 0);
  logic.write(st, 0, 1);
  logic.write(st, 1, 0);
  assert.equal(logic.used(st), 3);
  assert.equal(logic.write(st, 2, 0), 'refused');   // thin3 holds nothing, its filesystem is empty
  assert.equal(logic.write(st, 0, 2), 'refused');
  assert.equal(logic.write(st, 0, 1), 'rewrite');   // a block thin1 already holds
  assert.equal(logic.write(st, 1, 0), 'rewrite');
  assert.equal(logic.used(st), 3);
  // in the explorer: the refused volume's filesystem still shows its free space, and the mode follows errorWhenFull
  const s = fromPreset('one-tenant-fills');
  assert.equal(s.full, true);
  assert.equal(s.lvs[2].fsFree, 40);
  assert.equal(s.firstRefused.free, 40);
  assert.equal(s.mode, 'queue');
  assert.equal(fromPreset('error-at-once').mode, 'error');
  assert.deepEqual(fromPreset('error-at-once').lvs, s.lvs);   // the same writes are refused either way
});

// ── rule 6: autoextend ──

test('rule 6: autoextend grows by percent of the current size (whole GiB) from VG free; all or nothing', () => {
  const s = fromPreset('autoextend');
  assert.deepEqual(s.extended, [{ from: 100, to: 120, by: 20, at: 71 }, { from: 120, to: 144, by: 24, at: 85 }]);
  assert.deepEqual(s.short, { at: 101, size: 144, want: 29, vgFree: 6 });   // 28.8 rounded up; only 6 free: no growth
  assert.equal(s.vgFree, 6);
  assert.equal(s.pool.size, 144);
  assert.equal(s.refused, 0);
  // off: never grows; VG free 0: never grows
  assert.equal(run({ w1: 50, w2: 50, w3: 50, autoextend: false, vgFree: 100 }).pool.size, 100);
  const none = run({ w1: 50, w2: 50, w3: 50, autoextend: true, vgFree: 0 });
  assert.equal(none.pool.size, 100);
  assert.deepEqual(none.short, { at: 71, size: 100, want: 20, vgFree: 0 });
  // exactly enough in the VG is enough
  const exact = run({ w1: 50, w2: 30, w3: 0, autoextend: true, threshold: 70, percent: 20, vgFree: 20 });
  assert.equal(exact.pool.size, 120);
  assert.equal(exact.vgFree, 0);
  // the primitive leaves the pool alone when off
  const st = logic.createPool(2, 1, 10, 10);
  logic.write(st, 0, 0); logic.write(st, 0, 1);
  assert.equal(logic.autoextend(st, { on: false, threshold: 50, percent: 50 }), null);
  assert.equal(logic.autoextend(st, { on: true, threshold: 50, percent: 50 }), 'grew');
  assert.equal(st.cells.length, 3);
});

test('rule 6: autoextension in time keeps every write from being refused', () => {
  const off = run({ w1: 50, w2: 50, w3: 50 });
  assert.equal(off.refused, 50);
  const on = run({ w1: 50, w2: 50, w3: 50, autoextend: true, threshold: 70, percent: 20, vgFree: 100 });
  assert.equal(on.refused, 0);
  assert.equal(on.pool.used, 150);
});

// ── clamps ──

test('a volume cannot be written past its virtual size; n is 1–4', () => {
  const s = run({ virt: 30, w1: 100 });
  assert.equal(s.lvs[0].want, 30);
  assert.equal(s.lvs[0].written, 30);
  assert.equal(run({ n: 9 }).lvs.length, 4);
  assert.equal(run({ n: 0 }).lvs.length, 1);
});

// ── presets ──

test('presets: the numbers of SPEC.md', () => {
  const ok = fromPreset('overcommit-ok');
  assert.equal(ok.overcommit, 150);
  assert.equal(ok.pool.pct, 60);
  assert.deepEqual(ok.lvs.map((x) => x.dataPct), [40, 40, 40]);
  assert.equal(ok.refused, 0);

  const fills = fromPreset('one-tenant-fills');
  assert.equal(fills.overcommit, 150);
  assert.equal(fills.pool.pct, 100);
  assert.deepEqual(fills.firstRefused, { lv: 2, at: 10, free: 40 });
  assert.equal(fills.lvs[2].refused, 10);
  assert.equal(fills.lvs[2].fsFree, 40);

  const del = fromPreset('deleted-not-returned');
  assert.equal(del.pool.pct, 90);
  assert.equal(fromPreset('deleted-not-returned', { discard: true }).pool.pct, 60);

  const err = fromPreset('error-at-once');
  assert.equal(err.mode, 'error');
  assert.equal(err.lvs[2].refused, 10);

  assert.deepEqual(logic.presets.map((x) => x.id), ['overcommit-ok', 'one-tenant-fills', 'autoextend', 'deleted-not-returned', 'error-at-once']);
});

// ── captions and changed cells ──

test('captions: each case has its key and notes', () => {
  assert.equal(logic.captionKey(fromPreset('overcommit-ok')).key, 'cFits');
  const f = logic.captionKey(fromPreset('one-tenant-fills'));
  assert.equal(f.key, 'cFullQueue');
  assert.deepEqual(f.notes.map((x) => x.key), ['nRewrite']);
  assert.equal(logic.captionKey(fromPreset('error-at-once')).key, 'cFullError');
  assert.deepEqual(logic.captionKey(fromPreset('autoextend')).notes.map((x) => x.key), ['nGrewShort']);
  assert.deepEqual(logic.captionKey(run({ w1: 50, w2: 30, w3: 0, autoextend: true, vgFree: 20 })).notes.map((x) => x.key), ['nGrew']);
  assert.deepEqual(logic.captionKey(run({ w1: 50, w2: 30, w3: 0, autoextend: true, vgFree: 0 })).notes.map((x) => x.key), ['nShort']);
  assert.deepEqual(logic.captionKey(fromPreset('deleted-not-returned')).notes, [{ key: 'nKept', d: 30 }]);
  assert.deepEqual(logic.captionKey(fromPreset('deleted-not-returned', { discard: true })).notes, [{ key: 'nDiscarded', d: 30 }]);
  assert.equal(logic.captionKey(run({ n: 2, virt: 50 })).key, 'cNoOvercommit');
  assert.equal(logic.captionKey(run({ w1: 50, w2: 50, w3: 0 })).key, 'cFullNow');
  const two = logic.captionKey(run({ pool: 50, w1: 50, w2: 10, w3: 10 }));
  assert.equal(two.key, 'cFullQueue');
  assert.deepEqual(two.notes[0], { key: 'nAlsoRefused', lvs: ['thin3'] });
});

test('changed cells: allocated, freed, taken over, and new rows', () => {
  const a = run({ w1: 20 });
  const b = run({ w1: 22 });
  assert.deepEqual(logic.changedCells(a, b), [20, 21, 40, 41, 60, 61]);   // thin1 took two more cells; thin2 and thin3 moved along by two
  assert.deepEqual(logic.changedCells(a, a), []);
  const g = run({ w1: 50, w2: 30, w3: 0, autoextend: true, vgFree: 20 });
  const h = run({ w1: 50, w2: 30, w3: 0, autoextend: false, vgFree: 20 });
  assert.equal(logic.changedCells(h, g).length, 20);              // the added row
  assert.deepEqual(logic.changedCells(null, g), []);
});

// ── tests added after the review (mutants that survived) ──

test('rule 3/4: a volume Data% counts what it holds in the pool, not what its filesystem uses', () => {
  const s = fromPreset('deleted-not-returned');
  assert.equal(s.pool.pct, 90);
  assert.equal(s.lvs[0].allocated, 50);
  assert.equal(s.lvs[0].fsUsed, 20);
  assert.equal(s.lvs[0].dataPct, 100);                     // all 50 GiB still held, though the filesystem uses 20
  assert.equal(fromPreset('deleted-not-returned', { discard: true }).lvs[0].dataPct, 40);
});

test('rule 6: threshold and percent are the params, not 70 and 20', () => {
  // pool 100, threshold 50, +50 %: grows at 51 GiB to 150; then 76 of 150 > 50 % wants 75, VG has 100 − 50 = 50: short
  const s = run({ n: 1, virt: 100, w1: 100, autoextend: true, threshold: 50, percent: 50, vgFree: 100 });
  assert.deepEqual(s.extended, [{ from: 100, to: 150, by: 50, at: 51 }]);
  assert.deepEqual(s.short, { at: 76, size: 150, want: 75, vgFree: 50 });
  // threshold 90, +10 %: grows at 91 GiB to 110, then 100 of 110 = 90.9 % > 90 grows by 11 to 121
  const t = run({ n: 1, virt: 100, w1: 100, autoextend: true, threshold: 90, percent: 10, vgFree: 100 });
  assert.deepEqual(t.extended.map((e) => [e.at, e.to]), [[91, 110], [100, 121]]);
  // out-of-range threshold and percent from a URL are clamped, never NaN
  const u = run({ w1: 50, w2: 50, w3: 50, autoextend: true, threshold: 'abc', percent: 'x', vgFree: 50 });
  assert.ok(Number.isFinite(u.pool.size) && Number.isFinite(u.vgFree));
});

test('rule 2: overcommit and the warning are against the pool as created, even after it grew', () => {
  const s = fromPreset('autoextend');
  assert.equal(s.pool.size, 144);
  assert.equal(s.overcommit, 150);
  assert.equal(s.warned, true);
  const g = run({ n: 2, virt: 55, w1: 55, w2: 20, autoextend: true, vgFree: 50 });   // 110 promised, pool grows to 120 at 71 GiB
  assert.equal(g.pool.size, 120);
  assert.equal(g.warned, true);
});

test('full means exactly full', () => {
  assert.equal(run({ w1: 50, w2: 49, w3: 0 }).full, false);
  assert.equal(run({ w1: 50, w2: 50, w3: 0 }).full, true);
});

test('captions: a pool that filled and then got space back says so; promised = pool and full is not a warning', () => {
  const was = run({ pool: 50, n: 1, virt: 100, w1: 70, deleted1: 30, discard: true });
  assert.equal(was.full, false);
  assert.equal(was.refused, 20);
  assert.deepEqual(was.firstRefused, { lv: 0, at: 50, free: 50 });
  assert.equal(logic.captionKey(was).key, 'cWasFullQueue');
  assert.deepEqual(logic.captionKey(was).notes, [{ key: 'nDiscardedOnly', d: 30 }]);   // one volume: nobody to reuse it
  assert.equal(logic.captionKey(run({ pool: 50, n: 1, virt: 100, w1: 70, deleted1: 30, discard: true, errorWhenFull: true })).key, 'cWasFullError');
  assert.equal(logic.captionKey(run({ n: 2, virt: 50, w1: 50, w2: 50 })).key, 'cFullExact');
  // the rewrite note goes when other notes follow it
  const many = logic.captionKey(run({ virt: 50, w1: 50, w2: 50, w3: 20, deleted1: 10 }));
  assert.deepEqual(many.notes.map((x) => x.key), ['nKept']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ autoextend: true, vgFree: 40, w1: 60, deleted1: 20, discard: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['cFits', 'cNoOvercommit', 'cFullNow', 'cFullExact', 'cFullQueue', 'cFullError', 'cWasFullQueue', 'cWasFullError', 'nAlsoRefused', 'nRewrite', 'nKept', 'nDiscarded', 'nDiscardedOnly', 'nGrew', 'nShort', 'nGrewShort'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries) assert.ok(preset(e.preset), e.preset);
});
