// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the memory, swap and OOM model. Run: node --test sims/lnx-memory-swap-oom/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the captions, "changed",
// then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

// Tests speak the task's params (db and build toggles, dbSize default 900, buildSize default 600); the page folds each
// toggle into its size (0 = not started), and P maps one onto the other.
const P = (over) => {
  const o = Object.assign({ db: false, dbSize: 900, build: false, buildSize: 600 }, over);
  return Object.assign({}, logic.defaults, {
    swap: o.swap || 0, backup: !!o.backup, dbAdj: o.dbAdj || 0, dbSize: o.db ? o.dbSize : 0, buildSize: o.build ? o.buildSize : 0
  });
};
const at = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id) => logic.initial(preset(id).params);
const proc = (s, key) => s.procs.find((x) => x.key === key);
const row = (key, rss, swap, adj, killed) => ({ key, pid: 0, ask: rss + swap, rss, swap, adj: adj || 0, killed: !!killed });
/** Every MiB is somewhere: other + live RSS + cache + free = total; swap used = live swap. */
function conserved(s) {
  const live = s.procs.filter((x) => !x.killed);
  assert.equal(s.other + live.reduce((a, x) => a + x.rss, 0) + s.cache + s.free, s.total, 'RAM adds up');
  assert.equal(live.reduce((a, x) => a + x.swap, 0), s.swapUsed, 'swap adds up');
  assert.ok(s.free >= 0 && s.cache >= s.cacheFixed && s.swapUsed >= 0 && s.swapUsed <= s.swapTotal);
}

// ── tie-breaks first ──

test('rule 6: equal badness → the later-started process is picked (the choice is replaced on ≥)', () => {
  assert.equal(logic.pickVictim([row('db', 500, 0), row('build', 500, 0)], 0), 1);
  assert.equal(logic.pickVictim([row('backup', 0, 0), row('db', 300, 200), row('build', 500, 0)], 0), 2, 'RSS + swap ties RSS');
  assert.equal(logic.pickVictim([row('backup', 0, 0), row('db', 0, 0)], 0), 1, 'a tie at zero too');
  // and not on >: a later, smaller one does not take it
  assert.equal(logic.pickVictim([row('db', 501, 0), row('build', 500, 0)], 0), 0);
});

test('rule 6 through the model: a tie between db and build (swap 512, db 918, build 600) kills build', () => {
  // off the 100-step grid, so not reachable from the page; the model takes any size
  const s = at({ swap: 512, db: true, dbSize: 918, build: true, buildSize: 1200 });
  const o = s.events[1].oom[0];
  assert.deepEqual(o.scores.map((x) => x.score), [918, 918]);
  assert.equal(o.victim, 'build');
  assert.equal(o.self, true);
});

test('rule 5 edge: −1000 is never picked, even when it is the only process with memory', () => {
  assert.equal(logic.pickVictim([row('db', 1200, 0, -1000), row('build', 1, 0)], 0), 1);
  assert.equal(logic.pickVictim([row('db', 1200, 0, -1000)], 0), -1);
  assert.equal(logic.badness(row('db', 900, 0, -1000), 0), null);
  assert.equal(logic.badness(row('db', 900, 0, 0, true), 0), null, 'a killed process is no candidate');
});

// ── rule 1: the book's free -h ──

test('rule 1: nothing started is the book line: 1741 417 598 885 1324, swap 0 0 0', () => {
  const s = at({});
  assert.deepEqual([s.total, s.used, s.free, s.cache, s.available], [1741, 417, 598, 885, 1324]);
  assert.deepEqual([s.swapTotal, s.swapUsed], [0, 0]);
  assert.equal(s.other, 258);
  assert.equal(s.cacheFixed, 159);
  assert.equal(s.available, s.free + s.cache - s.cacheFixed, 'available = free + reclaimable cache');
  assert.equal(s.used, s.total - s.available, 'used = total − available (procps-ng 4)');
  assert.deepEqual(s.procs, []);
  assert.equal(at({ swap: 512 }).swapTotal, 512, 'swap only adds the Swap row');
  assert.equal(at({ swap: 512 }).available, 1324);
});

// ── rule 2: reading files fills the page cache ──

test('rule 2: the backup reads 800 MiB: free 0, buff/cache 1483, available unchanged', () => {
  const s = at({ backup: true });
  assert.deepEqual([s.free, s.cache, s.available, s.used], [0, 1483, 1324, 417]);
  assert.deepEqual(s.events[0], { kind: 'read', key: 'backup', size: 800, fromFree: 598, replaced: 202 });
  assert.equal(proc(s, 'backup').rss, 0, 'file pages are cache, not the reader\'s RSS');
  conserved(s);
});

test('rule 2: the backup changes no later allocation (its cache is reclaimable)', () => {
  for (const over of [{ db: true }, { db: true, build: true }, { swap: 512, db: true, build: true }, { build: true, buildSize: 1200 }]) {
    const a = at(over), b = at(Object.assign({ backup: true }, over));
    assert.deepEqual([b.available, b.used, b.swapUsed, b.oomVictim], [a.available, a.used, a.swapUsed, a.oomVictim], JSON.stringify(over));
  }
});

// ── rule 3: free first, then clean page cache ──

test('rule 3: an allocation takes free first, then reclaimable cache, never the 159 MiB', () => {
  const s = at({ build: true, buildSize: 400 });
  assert.deepEqual([s.events[0].fromFree, s.events[0].fromCache], [400, 0]);
  assert.deepEqual([s.free, s.cache], [198, 885]);
  const t = at({ build: true, buildSize: 900 });
  assert.deepEqual([t.events[0].fromFree, t.events[0].fromCache], [598, 302]);
  assert.deepEqual([t.free, t.cache, t.available, t.used], [0, 583, 424, 1317]);
  const u = at({ db: true, dbSize: 1200, build: true, buildSize: 200, swap: 1024 });
  assert.equal(u.cache, 159, 'reclaim stops at the unreclaimable part');
  conserved(s); conserved(t); conserved(u);
});

// ── rule 4: swap the earliest-started process's pages ──

test('rule 4: with cache exhausted and swap free, db\'s pages go to swap and nobody dies', () => {
  const s = at({ swap: 512, db: true, build: true });
  assert.deepEqual(s.events[1].swapped, [{ key: 'db', n: 176 }]);
  assert.deepEqual([proc(s, 'db').rss, proc(s, 'db').swap, proc(s, 'build').rss], [724, 176, 600]);
  assert.equal(s.swapUsed, 176);
  assert.equal(s.oomVictim, null);
  assert.equal(s.events[1].short, 0);
  conserved(s);
});

test('rule 4: swap is used only after the cache is gone, and never for the asker\'s own pages', () => {
  const s = at({ swap: 1024, db: true, build: true, buildSize: 400 });
  assert.equal(s.swapUsed, 0, 'db 900 + build 400 fit in 1324 available');
  const t = at({ swap: 512, build: true, buildSize: 1200 });
  assert.equal(t.swapUsed, 0, 'build alone: nothing older to swap');
  // swap fills up, then the OOM killer still runs
  const u = at({ swap: 512, db: true, dbSize: 1200, build: true, buildSize: 1200 });
  assert.deepEqual(u.events[1].swapped, [{ key: 'db', n: 512 }]);
  assert.equal(u.events[1].short, 564);
  assert.equal(u.oomVictim, 'db');
  assert.equal(u.swapUsed, 0, 'the victim\'s swap is freed too');
  conserved(u);
});

test('rule 4: the earliest-started process first; a process with no anonymous memory gives nothing', () => {
  const procs = [row('backup', 0, 0), row('db', 100, 0), row('mid', 300, 0)];
  const mem = { free: 0, cache: logic.CACHE_FIXED, swapTotal: 1024, swapUsed: 0 };
  const ev = logic.allocate(mem, procs, row('new', 0, 0), 250);
  assert.deepEqual(ev.swapped, [{ key: 'db', n: 100 }, { key: 'mid', n: 150 }]);
  assert.deepEqual([procs[1].rss, procs[2].rss, procs[3].rss], [0, 150, 250]);
});

test('rule 4: the asker\'s own pages never go to swap (it would only move the shortage)', () => {
  // not reachable from the page's grid (db would have to be swapped out whole first), so tested on allocate directly
  const mem = { free: 0, cache: logic.CACHE_FIXED, swapTotal: 1024, swapUsed: 0 };
  const procs = [row('db', 50, 0)];
  const ev = logic.allocate(mem, procs, row('new', 0, 0), 300);
  assert.deepEqual(ev.swapped, [{ key: 'db', n: 50 }]);
  assert.equal(ev.short, 250);
  assert.equal(procs[1].swap, 0, 'the asker has nothing in swap');
  assert.deepEqual(ev.oom.map((o) => o.victim), ['new'], 'db 0 + 50 ties new 50: the later one dies');
  assert.equal(mem.swapUsed, 50, 'db\'s pages stay in swap');
});

// ── rule 5: the OOM killer ──

test('rule 5: no swap, build 176 short: db (900) outscores build (424) and is killed; build completes', () => {
  const s = at({ db: true, build: true });
  const ev = s.events[1];
  assert.deepEqual([ev.fromFree, ev.fromCache, ev.short], [0, 424, 176]);
  assert.deepEqual(ev.oom, [{ victim: 'db', score: 900, scores: [{ key: 'db', score: 900 }, { key: 'build', score: 424 }], self: false }]);
  assert.equal(s.oomVictim, 'db');
  assert.deepEqual([proc(s, 'db').killed, proc(s, 'build').killed, proc(s, 'build').rss], [true, false, 600]);
  assert.equal(s.free, 724);
  assert.equal(proc(s, 'db').score, 900, 'a killed row keeps the score it was killed with');
  conserved(s);
});

test('rule 5: the victim can be the asker: build 1200 after db 200 kills build itself', () => {
  const s = at({ db: true, dbSize: 200, build: true, buildSize: 1200 });
  const o = s.events[1].oom[0];
  assert.deepEqual(o.scores, [{ key: 'db', score: 200 }, { key: 'build', score: 1124 }]);
  assert.equal(o.victim, 'build');
  assert.equal(o.self, true);
  assert.equal(proc(s, 'db').killed, false);
  assert.equal(s.free, 1124);
  conserved(s);
});

test('rule 5: oom_score_adj −1000 protects db: build is killed with its 424 MiB', () => {
  const s = at({ db: true, dbAdj: -1000, build: true });
  const o = s.events[1].oom[0];
  assert.deepEqual(o.scores, [{ key: 'build', score: 424 }]);
  assert.equal(o.victim, 'build');
  assert.deepEqual([proc(s, 'db').killed, proc(s, 'db').rss, proc(s, 'db').score], [false, 900, null]);
  assert.deepEqual([proc(s, 'build').killed, proc(s, 'build').rss], [true, 424]);
  assert.equal(s.free, 424);
  conserved(s);
});

test('rule 5: badness = RSS + swap + adj × (RAM + swap) / 1000', () => {
  assert.equal(logic.badness(row('db', 724, 176), 512), 900);
  assert.equal(logic.badness(row('db', 100, 0, 500), 0), 100 + 500 * 1741 / 1000);
  assert.equal(logic.badness(row('db', 100, 0, 500), 259), 100 + 500 * 2000 / 1000);
  assert.equal(logic.badness(row('db', 900, 0, -999), 0), 900 - 999 * 1.741);
});

test('rule 4: a −1000 process still goes to swap (protection is about the OOM killer only)', () => {
  const s = at({ swap: 512, db: true, dbAdj: -1000, build: true });
  assert.deepEqual(s.events[1].swapped, [{ key: 'db', n: 176 }]);
  assert.equal(s.oomVictim, null);
  assert.equal(logic.captionKey(s), 'cSwap');
});

test('rule 5: the OOM killer repeats while still short (two kills, tie first to the later one)', () => {
  const mem = { free: 0, cache: logic.CACHE_FIXED, swapTotal: 0, swapUsed: 0 };
  const procs = [row('a', 50, 0, 1000), row('b', 50, 0, 1000)];
  const ev = logic.allocate(mem, procs, row('new', 0, 0), 100);
  assert.deepEqual(ev.oom.map((o) => o.victim), ['b', 'a']);
  assert.deepEqual([procs[2].rss, procs[2].killed, mem.free], [100, false, 0]);
});

test('PIDs are fixed: backup 2101, db 2102, build 2103 (the kernel log line prints them)', () => {
  assert.deepEqual(logic.PROCS.map((d) => [d.key, d.pid]), [['backup', 2101], ['db', 2102], ['build', 2103]]);
  const s = at({ backup: true, db: true, build: true });
  assert.deepEqual(s.procs.map((x) => x.pid), [2101, 2102, 2103]);
});

// ── presets: the task's numbers ──

test('presets give the task\'s numbers', () => {
  let s = fromPreset('book-free');
  assert.deepEqual([s.used, s.free, s.cache, s.available, s.swapTotal, s.swapUsed], [417, 598, 885, 1324, 0, 0]);
  s = fromPreset('backup-reads');
  assert.deepEqual([s.free, s.cache, s.available], [0, 1483, 1324]);
  s = fromPreset('cache-gives-way');
  assert.deepEqual([s.free, s.cache, s.available, s.used, s.swapUsed, s.oomVictim], [0, 583, 424, 1317, 0, null]);
  s = fromPreset('oom-kills-db');
  assert.deepEqual([s.events[1].short, s.oomVictim, s.free], [176, 'db', 724]);
  s = fromPreset('swap-saves');
  assert.deepEqual([proc(s, 'db').rss, proc(s, 'db').swap, s.oomVictim], [724, 176, null]);
  s = fromPreset('protect-db');
  assert.deepEqual([s.oomVictim, proc(s, 'build').rss, proc(s, 'db').killed], ['build', 424, false]);
  assert.deepEqual(logic.presets.map((x) => x.id), ['book-free', 'backup-reads', 'cache-gives-way', 'oom-kills-db', 'swap-saves', 'protect-db']);
});

test('every param combination on the page\'s grid conserves memory and kills at most one process', () => {
  for (const swap of [0, 512, 1024]) for (const backup of [false, true]) for (const db of [false, true])
    for (const build of [false, true]) for (const dbAdj of [0, -1000])
      for (let dbSize = 200; dbSize <= 1200; dbSize += 100) for (let buildSize = 200; buildSize <= 1200; buildSize += 100) {
        const s = at({ swap, backup, db, build, dbAdj, dbSize, buildSize });
        conserved(s);
        assert.ok(s.procs.filter((x) => x.killed).length <= 1);
        if (s.oomVictim) assert.notEqual(s.oomVictim, 'backup');
        if (dbAdj === -1000 && db) assert.equal(proc(s, 'db').killed, false);
      }
});

// ── segments, captions, changed ──

test('segments: the RAM bar adds up to total, in the page\'s order, without empty or killed blocks', () => {
  const s = fromPreset('oom-kills-db');
  const seg = logic.segments(s);
  assert.deepEqual(seg.map((x) => x.id), ['other', 'p-build', 'fixed', 'free']);
  assert.equal(seg.reduce((a, x) => a + x.size, 0), 1741);
  assert.deepEqual(logic.segments(fromPreset('swap-saves')).map((x) => x.id), ['other', 'p-db', 'p-build', 'fixed']);
  assert.deepEqual(logic.segments(at({})).map((x) => x.id), ['other', 'fixed', 'cache', 'free']);
});

test('captions: one key per situation, OOM first', () => {
  assert.equal(logic.captionKey(fromPreset('book-free')), 'cBook');
  assert.equal(logic.captionKey(fromPreset('backup-reads')), 'cRead');
  assert.equal(logic.captionKey(fromPreset('cache-gives-way')), 'cReclaim');
  assert.equal(logic.captionKey(fromPreset('oom-kills-db')), 'cOomDb');
  assert.equal(logic.captionKey(fromPreset('swap-saves')), 'cSwap');
  assert.equal(logic.captionKey(fromPreset('protect-db')), 'cOomProtected');
  assert.equal(logic.captionKey(at({ db: true, dbSize: 200, build: true, buildSize: 1200 })), 'cOomSelf');
  // a −1000 db that would have lost anyway (200 < build 1124): the build dies for its own score, not for the protection
  assert.equal(logic.captionKey(at({ db: true, dbSize: 200, dbAdj: -1000, build: true, buildSize: 1200 })), 'cOomSelf');
  assert.equal(logic.captionKey(at({ db: true, dbSize: 400 })), 'cFits');
  assert.equal(logic.captionKey(at({ backup: true, db: true, dbSize: 200 })), 'cReclaim', 'after the backup, db reclaims cache');
  // swap and an OOM in one run: the OOM wins
  assert.equal(logic.captionKey(at({ swap: 512, db: true, dbSize: 1200, build: true, buildSize: 1200 })), 'cOomDb');
  // with swap full too, a −1000 db still makes it the protected case
  assert.equal(logic.captionKey(at({ swap: 512, db: true, dbAdj: -1000, dbSize: 1200, build: true, buildSize: 1200 })), 'cOomProtected');
});

test('changed: marks the cells and segments that moved, and new rows', () => {
  const a = fromPreset('oom-kills-db'), b = fromPreset('swap-saves');
  const c = logic.changed(a, b);
  assert.deepEqual(c.mem, ['used', 'free', 'available']);
  assert.deepEqual(c.swap, ['total', 'used', 'free']);
  assert.deepEqual(c.seg, ['p-db', 'swap'], 'a segment that vanished (free 724 → 0) has nothing left to mark');
  assert.deepEqual(c.procs.db, ['rss', 'swap', 'killed']);
  assert.equal(c.procs.build, undefined);
  assert.deepEqual(logic.changed(at({}), at({ db: true })).procs, { db: ['row'] });
  const d = logic.changed(fromPreset('oom-kills-db'), fromPreset('protect-db')).procs;
  assert.deepEqual(d.db, ['adj', 'score', 'killed']);
  assert.deepEqual(d.build, ['rss', 'score', 'killed']);
  assert.deepEqual(logic.changed(at({}), at({ build: true, buildSize: 900 })).mem, ['used', 'free', 'cache', 'available']);
  assert.deepEqual(logic.changed(at({ db: true }), at({ db: true, dbSize: 1000 })).procs.db, ['ask', 'rss', 'score']);
  assert.deepEqual(logic.changed(null, a), { mem: [], swap: [], seg: [], procs: {} });
  assert.deepEqual(logic.changed(a, a), { mem: [], swap: [], seg: [], procs: {} });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const x of [{ params: {} }].concat(logic.presets)) {
    const s = at(x.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ swap: 512, backup: true, db: true, build: true, buildSize: 1200 });
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
