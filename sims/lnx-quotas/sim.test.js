// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-quotas. Run: node --test sims/lnx-quotas/sim.test.js
// Rules and numbers: SPEC.md. Tie-breaks first, then one test per rule, then the presets' numbers, then the generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ana = (s, fsId) => logic.userOf(logic.fsOf(s, fsId || 'polje'), 'ana');
const row = (s) => logic.repquotaRow(logic.repquotaCells(ana(s), s.day));
/** A quota record with limits (KiB and files), no clock. */
const q = (o) => Object.assign({ usedKB: 0, files: 0, soft: 0, hard: 0, isoft: 0, ihard: 0, graceUntil: null, igraceUntil: null }, o);

// ── tie-breaks ──

test('tie-break (rule 5): usage equal to the soft limit is not over: no clock, flag "-"', () => {
  const r = q({ usedKB: 40000, soft: 40960, hard: 51200 });
  logic.allocBlocks(r, 960, 0, 7, true);
  assert.equal(r.usedKB, 40960);
  assert.equal(r.graceUntil, null);
  assert.equal(logic.flags(r), '--');
  logic.allocBlocks(r, 4, 0, 7, true);
  assert.equal(r.graceUntil, 7, 'one block more starts it');
  assert.equal(logic.flags(r), '+-');
  // files: the file-limit preset reaches 3 = soft on its 4th step
  const s = at({ script: 'file-limit', fileLimits: true }, 4);
  assert.equal(ana(s).files, 3);
  assert.equal(ana(s).igraceUntil, null);
  assert.equal(logic.flags(ana(s)), '--');
  assert.equal(logic.repquotaCells(ana(s), s.day).igrace, '');
});

test('tie-break (rule 4): usage may equal the hard limit, not pass it', () => {
  const r = q({ usedKB: 46084, soft: 40960, hard: 51200, graceUntil: 7 });
  assert.deepEqual(logic.allocBlocks(r, 5116, 0, 7, true), { writtenKB: 5116, refused: null });
  assert.equal(r.usedKB, 51200);
  assert.deepEqual(logic.allocBlocks(r, 4, 0, 7, true), { writtenKB: 0, refused: 'hard' });
  // files: 5 = hard is allowed, the 6th is refused
  const f = q({ files: 4, isoft: 3, ihard: 5, igraceUntil: 7 });
  assert.equal(logic.allocInode(f, 0, 7, true), null);
  assert.equal(f.files, 5);
  assert.equal(logic.allocInode(f, 0, 7, true), 'hard');
  assert.equal(f.files, 5);
});

test('tie-break (rule 6): on the deadline day itself the grace period has expired', () => {
  const r = q({ usedKB: 46084, soft: 40960, hard: 51200, graceUntil: 7 });
  assert.equal(logic.allocBlocks(Object.assign({}, r), 4, 6, 7, true).refused, null, 'day 6: still in grace');
  assert.equal(logic.allocBlocks(Object.assign({}, r), 4, 7, 7, true).refused, 'expired', 'day 7: expired');
  assert.equal(logic.graceText(7, 6), '24:00');
  assert.equal(logic.graceText(7, 7), 'none');
});

test('tie-break (rule 7): freeing down to exactly the soft limit clears the clock', () => {
  const r = q({ usedKB: 40964, files: 2, soft: 40960, hard: 51200, graceUntil: 7 });
  logic.freeSpace(r, 4, 0);
  assert.equal(r.usedKB, 40960);
  assert.equal(r.graceUntil, null);
  const f = q({ files: 4, isoft: 3, ihard: 5, igraceUntil: 7 });
  logic.freeSpace(f, 0, 1);
  assert.equal(f.igraceUntil, null);
});

// ── rules ──

test('rule 1: limits are per filesystem: /home has none, the same user writes there freely', () => {
  const s3 = at({ script: 'other-fs' }, 3);
  assert.equal(ana(s3).usedKB, 51200, '/mnt/polje is full for ana');
  const s4 = at({ script: 'other-fs' }, 4);
  assert.equal(s4.last.status, 0);
  assert.equal(s4.last.writtenKB, 61440);
  assert.equal(ana(s4, 'home').usedKB, 36 + 61440);
  assert.equal(ana(s4, 'home').soft, 0);
  assert.equal(ana(s4, 'home').graceUntil, null);
  assert.equal(ana(s4).usedKB, 51200, '/mnt/polje unchanged');
  assert.equal(logic.fsOf(s4, 'home').quotas, false);
  // /home appears only in this preset
  assert.equal(at({ script: 'book-ana' }, 0).fs.length, 1);
});

test('rule 2: setquota -u ana 40M 50M 0 0 sets 40960 / 51200 one-KiB blocks and no file limits', () => {
  const s = at({}, 1);
  assert.equal(s.last.cmd, 'sudo setquota -u ana 40M 50M 0 0 /mnt/polje');
  assert.deepEqual([ana(s).soft, ana(s).hard, ana(s).isoft, ana(s).ihard], [40960, 51200, 0, 0]);
  const f = at({ fileLimits: true }, 1);
  assert.equal(f.last.cmd, 'sudo setquota -u ana 40M 50M 3 5 /mnt/polje');
  assert.deepEqual([ana(f).isoft, ana(f).ihard], [3, 5]);
  // limits of 0 are none: never '+', never refused
  const r = q({ usedKB: 1e9, files: 1e6 });
  assert.equal(logic.flags(r), '--');
  assert.deepEqual(logic.allocBlocks(r, 1024, 0, 7, true), { writtenKB: 1024, refused: null });
});

test('rule 2: new limits re-evaluate the clock', () => {
  const r = q({ usedKB: 46084 });
  logic.setLimits(r, { soft: 40960, hard: 51200, isoft: 0, ihard: 0 }, 2, 7, true);
  assert.equal(r.graceUntil, 9);
  logic.setLimits(r, { soft: 50000, hard: 51200, isoft: 0, ihard: 0 }, 3, 7, true);
  assert.equal(r.graceUntil, null);
});

test('rule 3: before quotaon nothing is refused and no clock starts; usage is still counted', () => {
  const r = q({ usedKB: 4, soft: 40960, hard: 51200 });
  assert.deepEqual(logic.allocBlocks(r, 61440, 0, 7, false), { writtenKB: 61440, refused: null });
  assert.equal(r.usedKB, 61444);
  assert.equal(r.graceUntil, null);
  const f = q({ files: 5, isoft: 3, ihard: 5 });
  assert.equal(logic.allocInode(f, 0, 7, false), null);
  assert.equal(f.files, 6);
  assert.equal(f.igraceUntil, null);
  // the book's two writes run before quotaon (state after setquota + repquota): both pass, no clock
  const p = P();
  let s = logic.step(at({}, 2), 4, p);
  s = logic.step(s, 5, p);
  assert.equal(s.last.status, 0);
  assert.equal(ana(s).usedKB, 4 + 46080 + 20480);
  assert.equal(ana(s).graceUntil, null);
  assert.equal(logic.repquotaCells(ana(s), 0).bgrace, '');
  // in the book: quotaon is step 3; the limits exist from step 1
  assert.equal(at({}, 2).quotaOn, false);
  assert.equal(at({}, 3).quotaOn, true);
  assert.deepEqual(at({}, 3).last.out, ['/dev/md0 [/mnt/polje]: group quotas turned on', '/dev/md0 [/mnt/polje]: user quotas turned on']);
});

test('rule 4: a write past the hard limit stops exactly at it; Disk quota exceeded, status 1, the file stays', () => {
  const s = at({}, 5);
  assert.equal(s.last.wantKB, 20480);
  assert.equal(s.last.writtenKB, 5116);
  assert.equal(ana(s).usedKB, 51200);
  assert.equal(s.last.status, 1);
  assert.equal(s.last.why, 'block-hard');
  assert.deepEqual(s.last.out, ["dd: error writing '/mnt/polje/ana/prevelika': Disk quota exceeded", 'status=1']);
  assert.equal(ana(s).files, 3);
  assert.deepEqual(ana(s).list.map((f) => [f.name, f.kb]), [['ana/', 4], ['velika', 46080], ['prevelika', 5116]]);
  // writes stop on a 4-KiB allocation boundary
  const r = q({ usedKB: 6, hard: 15 });
  assert.equal(logic.allocBlocks(r, 100, 0, 7, true).writtenKB, 8);
});

test('rule 5: crossing the soft limit lets the write through and starts the grace clock', () => {
  const s = at({}, 4);
  assert.equal(s.last.status, 0);
  assert.equal(ana(s).usedKB, 46084);
  assert.equal(ana(s).graceUntil, 7);
  assert.equal(ana(s).graceFrom, 0);
  assert.equal(logic.flags(ana(s)), '+-');
  assert.equal(logic.repquotaCells(ana(s), 0).bgrace, '7days');
  // the clock starts at today + graceDays, and a later write within grace does not restart it
  const g = at({ graceDays: 3 }, 4);
  assert.equal(ana(g).graceUntil, 3);
  const r = q({ usedKB: 46084, soft: 40960, hard: 51200, graceUntil: 7 });
  logic.allocBlocks(r, 1024, 5, 7, true);
  assert.equal(r.graceUntil, 7);
});

test('rule 6: after the grace period the soft limit is a wall, even far below hard', () => {
  const s = at({ script: 'grace-expires' }, 5);
  assert.equal(s.day, 8);
  assert.equal(s.last.status, 1);
  assert.equal(s.last.writtenKB, 0);
  assert.equal(s.last.why, 'block-expired');
  assert.equal(ana(s).usedKB, 46084);
  assert.ok(ana(s).usedKB < ana(s).hard);
  assert.equal(logic.repquotaCells(ana(s), s.day).bgrace, 'none');
  assert.equal(ana(s).files, 3, 'dd created mala before the first block was refused');
  // after expiry, blocks up to the soft limit may still be written; the first one past it is refused
  const t = q({ usedKB: 40000, soft: 40960, hard: 51200, graceUntil: 1 });
  assert.deepEqual(logic.allocBlocks(t, 2000, 9, 7, true), { writtenKB: 960, refused: 'expired' });
  // with a 14-day grace time the same write goes through
  const long = at({ script: 'grace-expires', graceDays: 14 }, 5);
  assert.equal(long.last.status, 0);
  assert.equal(logic.repquotaCells(ana(long), long.day).bgrace, '6days');
});

test('rule 7: deleting back under soft clears the clock; the next crossing starts a fresh period', () => {
  const s4 = at({ script: 'delete-resets' }, 4);
  assert.equal(logic.repquotaCells(ana(s4), s4.day).bgrace, '4days');
  const s5 = at({ script: 'delete-resets' }, 5);
  assert.equal(s5.last.freedKB, 46080);
  assert.equal(ana(s5).usedKB, 4);
  assert.equal(ana(s5).graceUntil, null);
  assert.equal(logic.flags(ana(s5)), '--');
  const s6 = at({ script: 'delete-resets' }, 6);
  assert.equal(ana(s6).graceUntil, 10);
  assert.equal(ana(s6).graceFrom, 3);
  const s7 = at({ script: 'delete-resets' }, 7);
  assert.equal(s7.day, 8);
  assert.equal(logic.repquotaCells(ana(s7), s7.day).bgrace, '2days');
  // freeing that leaves usage above soft keeps the old deadline
  const r = q({ usedKB: 51200, soft: 40960, hard: 51200, graceUntil: 7 });
  logic.freeSpace(r, 5116, 1);
  assert.equal(r.graceUntil, 7);
  // grace-expires ends the same way: rm takes ana back to 4 and clears 'none'
  const e = at({ script: 'grace-expires' }, 6);
  assert.equal(ana(e).usedKB, 4);
  assert.equal(logic.repquotaCells(ana(e), e.day).bgrace, '');
});

test('rule 8: files have their own limits, flag, clock and column; a refused file is not created', () => {
  const p = { script: 'file-limit', fileLimits: true };
  const s5 = at(p, 5);
  assert.equal(ana(s5).files, 4);
  assert.equal(logic.flags(ana(s5)), '-+');
  assert.equal(ana(s5).igraceUntil, 7);
  assert.equal(ana(s5).graceUntil, null, 'the block clock does not run');
  assert.equal(logic.repquotaCells(ana(s5), 0).igrace, '7days');
  assert.equal(logic.repquotaCells(ana(s5), 0).bgrace, '');
  const s6 = at(p, 6);
  assert.equal(s6.last.status, 0);
  assert.equal(ana(s6).files, 5);
  const s7 = at(p, 7);
  assert.equal(s7.last.status, 1);
  assert.equal(s7.last.why, 'inode-hard');
  assert.equal(ana(s7).files, 5);
  assert.ok(!ana(s7).list.some((f) => f.name === 'dat5'));
  assert.deepEqual(s7.last.out, ["touch: cannot touch '/mnt/polje/ana/dat5': Disk quota exceeded", 'status=1']);
  // an expired file clock refuses a new file below the file hard limit
  const f = q({ files: 4, isoft: 3, ihard: 9, igraceUntil: 2 });
  assert.equal(logic.allocInode(f, 2, 7, true), 'expired');
  // touch makes an empty file: no blocks
  assert.equal(ana(s6).usedKB, 4);
});

test('repquota: the book\'s lines, character for character', () => {
  assert.deepEqual(logic.repquotaHead('/dev/md0', 7), [
    '*** Report for user quotas on device /dev/md0',
    'Block grace time: 7days; Inode grace time: 7days',
    '                        Block limits                File limits',
    'User            used    soft    hard  grace    used  soft  hard  grace',
    '----------------------------------------------------------------------'
  ]);
  const s0 = at({}, 0);
  assert.equal(logic.repquotaRow(logic.repquotaCells(logic.userOf(logic.fsOf(s0, 'polje'), 'root'), 0)),
    'root      --      28       0       0              3     0     0       ');
  assert.equal(row(at({}, 2)), 'ana       --       4   40960   51200              1     0     0       ');
  assert.equal(row(at({}, 4)), 'ana       +-   46084   40960   51200  7days       2     0     0       ');
  assert.equal(row(at({}, 5)), 'ana       +-   51200   40960   51200  7days       3     0     0       ');
  // time2str(TF_ROUND): 'Ndays' only from 2 days, one day is 24:00
  assert.equal(logic.daysText(1), '24:00');
  assert.equal(logic.daysText(2), '2days');
  assert.equal(logic.repquotaHead('/dev/md0', 1)[1], 'Block grace time: 24:00; Inode grace time: 24:00');
  assert.equal(logic.graceText(null, 3), '');
});

test('commands are the book\'s', () => {
  assert.equal(at({}, 2).last.cmd, 'sudo repquota /mnt/polje');
  assert.equal(at({}, 3).last.cmd, 'sudo quotaon -v /mnt/polje');
  assert.equal(at({}, 4).last.cmd, 'sudo -u ana dd if=/dev/zero of=/mnt/polje/ana/velika bs=1M count=45 status=none; echo "status=$?"');
  assert.deepEqual(at({}, 4).last.out, ['status=0']);
  assert.equal(at({ script: 'other-fs' }, 4).last.cmd, 'sudo -u ana dd if=/dev/zero of=/home/ana/velika bs=1M count=60 status=none; echo "status=$?"');
  assert.equal(at({ script: 'grace-expires' }, 4).last.cmd, null, 'time passing is not a command');
  assert.equal(at({ script: 'grace-expires' }, 4).last.n, 8);
});

test('preset step counts are the task\'s', () => {
  const want = { 'book-ana': 5, 'grace-expires': 6, 'delete-resets': 7, 'file-limit': 7, 'other-fs': 4 };
  for (const pr of logic.PRESETS) assert.equal(logic.steps(P(pr.params)), want[pr.id], pr.id);
  for (const pr of logic.PRESETS) assert.ok(logic.steps(P(pr.params)) <= 20);
});

test('params are normalised: unknown script falls back, graceDays is clamped to 1–14', () => {
  assert.deepEqual(logic.norm({ script: 'nope' }), { script: 'book-ana', graceDays: 7, fileLimits: false });
  assert.equal(logic.norm({ graceDays: 0 }).graceDays, 1);
  assert.equal(logic.norm({ graceDays: 99 }).graceDays, 14);
  assert.equal(logic.norm({ graceDays: 'x' }).graceDays, 7);
  assert.equal(logic.steps({}), 5);
});

test('changed keys mark what the step touched', () => {
  assert.deepEqual(at({}, 1).changed, ['limits:polje:ana']);
  assert.deepEqual(at({}, 5).changed, ['file:polje:ana:prevelika', 'refused:polje:ana:blocks']);
  assert.deepEqual(at({ script: 'grace-expires' }, 4).changed, ['day']);
  assert.deepEqual(at({ script: 'file-limit', fileLimits: true }, 7).changed, ['refused:polje:ana:files']);
});

test('review: rm frees one inode; clocks per kind are independent; dd refused at open', () => {
  assert.equal(ana(at({ script: 'delete-resets' }, 5)).files, 1);
  assert.equal(ana(at({ script: 'grace-expires' }, 6)).files, 2);
  // a running block clock does not stop the file clock from starting, and the reverse
  const r = q({ usedKB: 46084, files: 3, soft: 40960, hard: 51200, isoft: 3, ihard: 5, graceUntil: 7 });
  logic.allocInode(r, 2, 7, true);
  assert.equal(r.igraceUntil, 9);
  assert.equal(r.graceUntil, 7);
  const r2 = q({ usedKB: 40960, files: 4, soft: 40960, hard: 51200, isoft: 3, ihard: 5, igraceUntil: 7 });
  logic.allocBlocks(r2, 4, 2, 7, true);
  assert.equal(r2.graceUntil, 9);
  // dd as the 6th inode (file-limit state, then the book's dd): the file is not even opened
  const p = P({ script: 'book-ana', fileLimits: true });
  const s = logic.step(at({ script: 'file-limit', fileLimits: true }, 6), 4, p);
  assert.equal(s.last.status, 1);
  assert.equal(s.last.why, 'inode-hard');
  assert.equal(s.last.writtenKB, 0);
  assert.deepEqual(s.last.out, ["dd: failed to open '/mnt/polje/ana/velika': Disk quota exceeded", 'status=1']);
});

test('review: hard and an expired soft limit on the same block: the reason is hard (kernel order)', () => {
  const r = q({ usedKB: 51200, soft: 40960, hard: 51200, graceUntil: 7 });
  assert.deepEqual(logic.allocBlocks(r, 4, 9, 7, true), { writtenKB: 0, refused: 'hard' });
  const e = q({ usedKB: 46084, soft: 40960, hard: 51200, graceUntil: 7 });
  assert.deepEqual(logic.allocBlocks(e, 4, 9, 7, true), { writtenKB: 0, refused: 'expired' });
  // after expiry the soft wall too stops on a 4-KiB boundary
  const f = q({ usedKB: 40000, soft: 40962, hard: 51200, graceUntil: 1 });
  assert.equal(logic.allocBlocks(f, 2000, 9, 7, true).writtenKB, 960);
});

test('review: setquota re-evaluation: equal clears, inode clock too, nothing starts while not enforced', () => {
  const r = q({ usedKB: 40960, files: 3, graceUntil: 4, igraceUntil: 4 });
  logic.setLimits(r, { soft: 40960, hard: 51200, isoft: 3, ihard: 5 }, 2, 7, true);
  assert.equal(r.graceUntil, null);
  assert.equal(r.igraceUntil, null);
  const f = q({ files: 4 });
  logic.setLimits(f, { soft: 0, hard: 0, isoft: 3, ihard: 5 }, 2, 7, true);
  assert.equal(f.igraceUntil, 9);
  const off = q({ usedKB: 46084, files: 4 });
  logic.setLimits(off, { soft: 40960, hard: 51200, isoft: 3, ihard: 5 }, 2, 7, false);
  assert.equal(off.graceUntil, null);
  assert.equal(off.igraceUntil, null);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.PRESETS) {
    for (const g of [1, 7, 14]) {
      const p = P(Object.assign({}, pr.params, { graceDays: g }));
      const forward = [];
      let s = logic.initial(p);
      forward.push(s);
      for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
      for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
    }
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'delete-resets' });
  const s = kit.stateAt(logic, p, 4);
  const copy = structuredClone(s);
  logic.step(s, 5, p);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset has its words', () => {
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) { assert.ok(tb['preset_' + pr.id], lang + pr.id); assert.ok(tb['preset_' + pr.id + '_hint'], lang + pr.id); }
  }
});

test('the page: meta steps match the default script; presets come from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  assert.match(html, /L\.PRESETS\.map/);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
