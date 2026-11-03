// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the page-cache model. Run: node --test sims/lnx-page-cache/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the grid invariants, the presets,
// the captions, "changed", then the generic block.
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
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id, over) => logic.initial(Object.assign({}, preset(id).params, over));
const TH = logic.thresholds(1324, '10/20');
const freeM = (s) => [s.total, s.used, s.free, s.cache, s.available];
/** Every MiB is somewhere, and every MiB of b.dat is in one place. */
function conserved(s) {
  const segs = logic.segments(s).reduce((a, x) => a + x.size, 0);
  assert.equal(segs, s.total, 'the bar adds up');
  assert.equal(s.procMem + s.cacheFixed + s.clean + s.dirty + s.writeback + s.free, s.total, 'RAM adds up');
  assert.equal(s.cache, s.cacheFixed + s.clean + s.dirty + s.writeback, 'buff/cache');
  assert.equal(s.diskWritten + s.dirty + s.writeback + s.pending, s.writeSize, 'b.dat is on disk, in RAM or not written yet');
  assert.ok(s.free >= 0 && s.cleanOld >= 0 && s.dirty >= 0 && s.writeback >= 0 && s.pending >= 0);
  assert.ok(s.dirty + s.writeback <= s.th.limit, 'never above the limit');
}
/** The whole page grid (the slider steps), or a coarser one. */
function* grid(step) {
  const k = step || 1;
  for (const ratios of ['10/20', '5/10'])
    for (let readMiB = 0; readMiB <= 800; readMiB += 50 * 4 * k)
      for (let writeMiB = 0; writeMiB <= 500; writeMiB += 25 * k)
        for (let seconds = 0; seconds <= 60; seconds += 5)
          for (const flags of [0, 1, 2, 3, 4, 7])
            yield P({ ratios, readMiB, writeMiB, seconds, reread: !!(flags & 1), sync: !!(flags & 2), dropCaches: !!(flags & 4), powerLoss: flags === 7 || flags === 4 });
}

// ── tie-breaks first ──

test('rule 4 tie: a page that turns 30 s old exactly on a tick is written on that tick', () => {
  assert.equal(logic.expiryTick(0), 30, 'dirtied at 0: 30 s old on the 30 s tick → written then, not at 35');
  assert.equal(logic.expiryTick(1), 35, 'dirtied at 1: 29 s old at 30 → waits for 35');
  assert.equal(logic.expiryTick(5), 35);
  assert.equal(logic.expiryTick(4.999), 35);
  const w = (t) => logic.writeback(100, t, TH);
  assert.deepEqual([w(25).dirty, w(25).writeback], [100, 0], 'one tick before: still dirty');
  assert.deepEqual([w(30).dirty, w(30).writeback], [0, 100], 'on the tick: handed to the disk');
  assert.equal(w(29.999).dirty, 100);
});

test('rule 5 tie: exactly at the background mark starts no writeback', () => {
  const at132 = logic.writeback(132, 0, TH);
  assert.deepEqual([at132.dirty, at132.writeback, at132.phase], [132, 0, 'waiting']);
  assert.equal(at132.bgFrom, null);
  const at133 = logic.writeback(133, 0, TH);
  assert.deepEqual([at133.dirty, at133.writeback, at133.phase], [132, 1, 'background']);
  assert.equal(at133.bgFrom, 0);
});

test('rule 5 tie: exactly at the limit is not throttled', () => {
  const a = logic.writeback(265, 0, TH);
  assert.equal(a.throttled, false);
  assert.equal(a.returnedAt, 0);
  assert.deepEqual([a.dirty, a.writeback], [132, 133]);
  const b = logic.writeback(266, 0, TH);
  assert.equal(b.throttled, true);
  assert.equal(b.pending, 1);
  assert.equal(b.returnedAt, 1 / 25);
});

// ── rule 1: the book's free -h ──

test('rule 1: nothing done is the book line 1741 417 598 885 1324', () => {
  const s = at({});
  assert.deepEqual(freeM(s), [1741, 417, 598, 885, 1324]);
  assert.deepEqual([s.procMem, s.cacheFixed, s.cleanOld, s.dirty, s.writeback], [258, 159, 726, 0, 0]);
  assert.equal(s.available, s.free + s.clean + s.dirty + s.writeback, 'available = free + cache that can be given back');
  assert.equal(s.used, s.total - s.available);
  assert.deepEqual([s.diskRead, s.diskWritten, s.lost], [0, 0, 0]);
  assert.deepEqual(s.events, []);
});

// ── rule 2: reads fill the cache; a re-read is a hit ──

test('rule 2: a read takes free memory, available does not move; a re-read reads nothing from disk', () => {
  const s = at({ readMiB: 400 });
  assert.deepEqual(freeM(s), [1741, 417, 198, 1285, 1324]);
  assert.equal(s.diskRead, 400);
  assert.equal(at({ readMiB: 400, reread: true }).diskRead, 400, 'not 800');
  assert.deepEqual(freeM(at({ readMiB: 400, reread: true })), freeM(s));
  // past free: the oldest clean cache is evicted, buff/cache stops growing
  const big = at({ readMiB: 800 });
  assert.deepEqual([big.free, big.cleanOld, big.cleanRead, big.cache, big.available], [0, 524, 800, 1483, 1324]);
  assert.deepEqual(big.events[0], { kind: 'read', size: 800, fromFree: 598, evicted: 202 });
  assert.deepEqual(logic.readFile({ free: 10, old: 5 }, 30), { fromFree: 10, evicted: 5 }, 'never evicts more than there is');
});

// ── rule 3: a buffered write returns before the disk is touched ──

test('rule 3: write 100 → 100 MiB dirty at once, nothing on disk, write() returned at 0', () => {
  const s = at({ writeMiB: 100 });
  assert.deepEqual([s.dirty, s.writeback, s.diskWritten, s.pending], [100, 0, 0, 0]);
  assert.equal(s.returnedAt, 0);
  assert.equal(s.throttled, false);
  assert.deepEqual([s.free, s.available, s.cache], [498, 1324, 985], 'dirty pages are cache and count as available');
  assert.equal(s.age, 0);
  // the pages come from free first, then the oldest clean cache, like a read
  const both = at({ readMiB: 800, writeMiB: 500, seconds: 60 });
  assert.deepEqual([both.free, both.cleanOld, both.cleanRead, both.cleanWritten], [0, 24, 800, 500]);
});

// ── rule 4: writeback by age ──

test('rule 4: small write waits for the 30 s tick, then the disk writes it at 25 MiB/s', () => {
  const w = (seconds) => at({ writeMiB: 100, seconds });
  for (const t of [0, 5, 10, 15, 20, 25]) assert.deepEqual([w(t).dirty, w(t).diskWritten], [100, 0], `${t} s`);
  assert.deepEqual([w(30).dirty, w(30).writeback, w(30).diskWritten], [0, 100, 0]);
  assert.deepEqual([w(35).dirty, w(35).writeback, w(35).diskWritten, w(35).cleanWritten], [0, 0, 100, 100]);
  assert.equal(w(30).phase, 'expired');
  assert.equal(w(35).phase, 'clean');
  assert.deepEqual(w(30).events.find((e) => e.kind === 'expire'), { kind: 'expire', tick: 30, size: 100 });
  assert.equal(logic.writeback(100, 34, TH).written, 100, 'done after 4 s at 25 MiB/s');
  assert.equal(logic.writeback(100, 32, TH).writeback, 50);
});

// ── rule 5: the marks ──

test('rule 5: marks are 10 % and 20 % of dirtyable memory (132, 265), or 5 % and 10 % (66, 132)', () => {
  assert.deepEqual(TH, { bgRatio: 10, ratio: 20, bg: 132, limit: 265 });
  assert.deepEqual(logic.thresholds(1324, '5/10'), { bgRatio: 5, ratio: 10, bg: 66, limit: 132 });
  assert.deepEqual(at({ readMiB: 800, writeMiB: 100 }).th, TH, 'available does not move, so neither do the marks');
});

test('rule 5: big write: background writeback from 132, throttled at 265, then down to the mark, then expiry', () => {
  const w = (seconds) => at({ writeMiB: 500, seconds });
  const row = (s) => [s.dirty, s.writeback, s.diskWritten, s.pending, s.throttled];
  assert.deepEqual(row(w(0)), [132, 133, 0, 235, true]);
  assert.deepEqual(row(w(5)), [132, 133, 125, 110, true]);
  assert.deepEqual(row(w(10)), [132, 118, 250, 0, false]);
  assert.deepEqual(row(w(15)), [132, 0, 368, 0, false]);
  assert.deepEqual(row(w(25)), [132, 0, 368, 0, false]);
  assert.deepEqual(row(w(30)), [0, 132, 368, 0, false]);
  assert.deepEqual(row(w(35)), [0, 7, 493, 0, false]);
  assert.deepEqual(row(w(40)), [0, 0, 500, 0, false]);
  assert.equal(w(0).returnedAt, 9.4);
  assert.equal(w(0).phase, 'throttled');
  assert.equal(w(10).phase, 'background');
  assert.equal(w(15).phase, 'waiting');
  // lower ratios: background writeback starts already for 100 MiB
  const low = at({ writeMiB: 100, ratios: '5/10' });
  assert.deepEqual([low.dirty, low.writeback, low.phase], [66, 34, 'background']);
  assert.deepEqual([at({ writeMiB: 100, ratios: '5/10', seconds: 5 }).dirty, at({ writeMiB: 100, ratios: '5/10', seconds: 5 }).diskWritten], [66, 34]);
});

// ── rule 6: sync ──

test('rule 6: sync writes everything not on disk and returns when the disk has it', () => {
  const s = at({ writeMiB: 100, seconds: 10, sync: true });
  assert.deepEqual([s.dirty, s.writeback, s.diskWritten, s.cleanWritten], [0, 0, 100, 100]);
  assert.equal(s.syncTook, 4);
  // during throttling: the writer's unwritten rest goes too
  const t = at({ writeMiB: 500, seconds: 5, sync: true });
  assert.deepEqual([t.dirty, t.writeback, t.pending, t.diskWritten, t.throttled], [0, 0, 0, 500, false]);
  assert.equal(t.syncTook, 15, '375 MiB left at 25 MiB/s');
  assert.equal(at({ writeMiB: 100, seconds: 40, sync: true }).syncTook, 0, 'already on disk');
  assert.equal(at({ sync: true }).events[0].size, 0, 'nothing to sync');
});

// ── rule 7: drop_caches ──

test('rule 7: drop_caches frees clean cache only; free rises, available stays', () => {
  const s = at({ dropCaches: true });
  assert.deepEqual(freeM(s), [1741, 417, 1324, 159, 1324]);
  assert.equal(s.dropped, 726);
  const d = at({ readMiB: 400, writeMiB: 100, dropCaches: true });
  assert.deepEqual([d.dirty, d.clean, d.dropped, d.cache, d.available, d.free], [100, 0, 1126, 259, 1324, 1224]);
  assert.deepEqual(d.events.find((e) => e.kind === 'drop'), { kind: 'drop', size: 1126, kept: 100 });
  const w = at({ writeMiB: 500, seconds: 30, dropCaches: true });
  assert.deepEqual([w.writeback, w.cleanWritten], [132, 0], 'pages under writeback are not dropped either');
  const synced = at({ writeMiB: 100, sync: true, dropCaches: true });
  assert.deepEqual([synced.dropped, synced.dirty, synced.free], [826, 0, 1324], 'after sync, b.dat is clean and goes too');
});

// ── rule 8: power loss ──

test('rule 8: power loss loses what is not on disk; clean cache loses nothing', () => {
  assert.equal(at({ writeMiB: 100, seconds: 10, powerLoss: true }).lost, 100);
  assert.equal(at({ writeMiB: 100, seconds: 10, powerLoss: true, sync: true }).lost, 0);
  assert.equal(at({ writeMiB: 100, seconds: 30, powerLoss: true }).lost, 100, 'on the tick it is under writeback, not on disk');
  assert.equal(at({ writeMiB: 100, seconds: 35, powerLoss: true }).lost, 0);
  assert.equal(at({ readMiB: 800, powerLoss: true }).lost, 0, 'a read file is on disk');
  const thr = at({ writeMiB: 500, seconds: 5, powerLoss: true });
  assert.equal(thr.lost, 375);
  assert.deepEqual(thr.events.find((e) => e.kind === 'power'), { kind: 'power', lost: 375, inRam: 265, unwritten: 110 });
});

test('order: sync, then drop, then power loss', () => {
  const s = at({ writeMiB: 200, seconds: 5, sync: true, dropCaches: true, powerLoss: true });
  assert.deepEqual(s.events.map((e) => e.kind), ['write', 'background', 'sync', 'drop', 'power']);
  assert.equal(s.lost, 0);
  assert.equal(s.dropped, 726 + 200);
});

// ── over the whole grid ──

test('grid: memory and b.dat add up, available never moves, the writer is done before the expiry tick', () => {
  let n = 0;
  for (const p of grid()) {
    const s = logic.initial(p);
    conserved(s);
    assert.equal(s.available, 1324);
    assert.equal(s.cleanRead, p.dropCaches ? 0 : p.readMiB, 'b.dat never evicts a.dat');
    assert.ok(s.returnedAt < logic.expiryTick(0));
    for (const k of ['free', 'dirty', 'writeback', 'diskWritten', 'cache']) assert.ok(Number.isInteger(s[k]), `${k} is whole MiB`);
    n++;
  }
  assert.ok(n > 10000);
});

// ── presets ──

test('presets give the task\'s numbers', () => {
  assert.deepEqual(freeM(fromPreset('book-free')), [1741, 417, 598, 885, 1324]);
  const r = fromPreset('read-twice');
  assert.deepEqual([r.diskRead, r.free, r.cache, r.available], [400, 198, 1285, 1324]);
  const sm = fromPreset('small-write');
  assert.equal(sm.dirty, 100);
  assert.ok(sm.dirty < sm.th.bg, 'below 132: nobody writes yet');
  assert.deepEqual([fromPreset('small-write', { seconds: 30 }).dirty, fromPreset('small-write', { seconds: 35 }).diskWritten], [0, 100]);
  const b = fromPreset('big-write');
  assert.equal(b.dirty + b.writeback, 265);
  assert.equal(b.throttled, true);
  const d = fromPreset('drop-caches');
  assert.deepEqual([d.cache, d.free, d.available, d.dropped], [159, 1324, 1324, 726]);
  assert.equal(fromPreset('power-loss').lost, 100);
  assert.equal(fromPreset('power-loss', { sync: true }).lost, 0);
});

test('events: every preset\'s trace, with its values', () => {
  const ev = (id, over) => fromPreset(id, over).events;
  assert.deepEqual(ev('book-free'), []);
  assert.deepEqual(ev('read-twice'), [
    { kind: 'read', size: 400, fromFree: 400, evicted: 0 }, { kind: 'reread', size: 400, fromDisk: 0 }]);
  assert.deepEqual(ev('small-write'), [{ kind: 'write', size: 100, fromFree: 100, evicted: 0, returnedAt: 0 }]);
  const big = [
    { kind: 'write', size: 500, fromFree: 265, evicted: 0, returnedAt: 9.4 },
    { kind: 'background', mark: 132 },
    { kind: 'throttle', limit: 265, until: 9.4, now: true }];
  assert.deepEqual(ev('big-write'), big);
  // once write() has returned, the trace still says it was throttled, and until when
  const later = ev('big-write', { seconds: 35 });
  assert.deepEqual(later.slice(1, 3), [big[1], { kind: 'throttle', limit: 265, until: 9.4, now: false }]);
  assert.deepEqual(later[0], Object.assign({}, big[0], { fromFree: 500 }));
  assert.deepEqual(later[3], { kind: 'expire', tick: 30, size: 132 });
  assert.deepEqual(ev('drop-caches'), [{ kind: 'drop', size: 726, kept: 0 }]);
  assert.deepEqual(ev('power-loss'), [
    { kind: 'write', size: 100, fromFree: 100, evicted: 0, returnedAt: 0 }, { kind: 'power', lost: 100, inRam: 100, unwritten: 0 }]);
  assert.deepEqual(ev('power-loss', { sync: true }).map((e) => e.kind), ['write', 'sync', 'power']);
  assert.equal(ev('power-loss', { sync: true })[1].took, 4);
  assert.deepEqual(at({ readMiB: 800, writeMiB: 500, seconds: 60 }).events[1].evicted, 500, 'the write evicts old cache');
  assert.deepEqual(at({ writeMiB: 150, ratios: '5/10' }).events.map((e) => e.kind), ['write', 'background', 'throttle']);
});

test('power time: the power goes after sync has returned', () => {
  assert.equal(fromPreset('power-loss').powerAt, 10);
  assert.equal(fromPreset('power-loss', { sync: true }).powerAt, 14);
  assert.equal(at({ writeMiB: 500, seconds: 5, sync: true, powerLoss: true }).powerAt, 20);
});

// ── captions ──

test('captions: first that applies', () => {
  const k = (o) => logic.captionKey(at(o));
  assert.equal(logic.captionKey(fromPreset('book-free')), 'cBook');
  assert.equal(logic.captionKey(fromPreset('read-twice')), 'cReread');
  assert.equal(k({ readMiB: 400 }), 'cRead');
  assert.equal(logic.captionKey(fromPreset('small-write')), 'cDirty');
  assert.equal(logic.captionKey(fromPreset('big-write')), 'cThrottled');
  assert.equal(k({ writeMiB: 500, seconds: 10 }), 'cBackground');
  assert.equal(k({ writeMiB: 100, seconds: 30 }), 'cExpired');
  assert.equal(k({ writeMiB: 100, seconds: 35 }), 'cWritten');
  assert.equal(k({ writeMiB: 100, sync: true }), 'cSync');
  assert.equal(k({ sync: true }), 'cBook', 'sync with nothing written falls through');
  assert.equal(logic.captionKey(fromPreset('drop-caches')), 'cDrop');
  assert.equal(logic.captionKey(fromPreset('power-loss')), 'cLost');
  assert.equal(logic.captionKey(fromPreset('power-loss', { sync: true })), 'cSafe');
  assert.equal(k({ powerLoss: true }), 'cSafeNone', 'nothing written');
  assert.equal(k({ writeMiB: 100, seconds: 40, powerLoss: true }), 'cSafe');
  // power loss outranks drop_caches, which outranks sync
  assert.equal(k({ writeMiB: 100, dropCaches: true, powerLoss: true }), 'cLost');
  assert.equal(k({ writeMiB: 100, sync: true, dropCaches: true, powerLoss: true }), 'cSafe');
  assert.equal(k({ writeMiB: 100, sync: true, dropCaches: true }), 'cDrop');
  assert.equal(k({ writeMiB: 100, seconds: 40, sync: true }), 'cWritten', 'a sync with nothing left to write falls through');
  assert.equal(k({ writeMiB: 500, powerLoss: true }), 'cLostMid', 'the writer was still throttled');
  assert.equal(k({ writeMiB: 500, seconds: 10, powerLoss: true }), 'cLost', 'write() had returned at 9.4 s');
});

// ── changed ──

test('changed: marks the cells, lines, segments and counters that moved', () => {
  const c = logic.changed(fromPreset('book-free'), fromPreset('drop-caches'));
  assert.deepEqual(c.mem, ['free', 'cache']);
  assert.deepEqual(c.info, ['MemFree', 'Cached']);
  assert.deepEqual(c.seg, ['free'], 'old cache vanished: nothing left to mark');
  assert.deepEqual(c.disk, []);
  const w = logic.changed(at({ writeMiB: 100 }), at({ writeMiB: 100, seconds: 30 }));
  assert.deepEqual(w.info, ['Dirty', 'Writeback']);
  assert.deepEqual(w.seg, ['wb']);
  assert.deepEqual(logic.changed(at({ writeMiB: 100, seconds: 30 }), at({ writeMiB: 100, seconds: 35 })).disk, ['diskWritten']);
  assert.deepEqual(logic.changed(null, at({})), { mem: [], info: [], seg: [], disk: [] });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const x of [{ params: {} }].concat(logic.presets)) {
    const s = at(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ readMiB: 600, reread: true, writeMiB: 400, seconds: 5, sync: true, dropCaches: true, powerLoss: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the page names every preset', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(html.includes(`'${x.id}'`), `the page labels preset ${x.id}`);
  }
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), `entry ${e.preset} is a preset`);
});
