// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-raid-rebuild's model (SPEC.md). Run: node --test sims/lnx-raid-rebuild/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'raid5-ure': {},
  'raid5-enterprise': { ureRate: '1e15' },
  'raid6-ure': { level: 6 },
  'under-load': { speed: 50, later: 'h15', seed: 4 },
  'pfx-fs1': { level: 6, n: 16, sizeTB: 6, ureRate: '1e15', speed: 50, later: 'h18-32', seed: 7 }
};
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const box = (s) => `[${s.mdstat.n}/${s.mdstat.active}] [${s.mdstat.map}]`;
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} vs ${b}`);

// ── tie-breaks first ──

test('rule 7 tie-break: a failure and a URE in the same band: the failure is applied first', () => {
  // RAID 6 at 50 MB/s, a second disk fails after 15 h (band 7). A URE in band 7 then meets zero parity: not corrected.
  const p = { level: 6, speed: 50, later: 'h15' };
  let found = 0;
  for (let seed = 1; seed <= 99; seed++) {
    const over = Object.assign({}, p, { seed });
    const s = at(over, 8);
    if (s.ev.band !== 7 || !s.ev.ures.length) continue;
    found++;
    assert.deepEqual(s.ev.fails.map((f) => f.hours), [15], `seed ${seed}`);
    assert.equal(s.ev.ures[0].result, 'abort', `seed ${seed}: the URE came after the failure`);
    assert.equal(s.array, 'failed');
    // with bad blocks instead, the same URE loses a stripe and the rebuild goes on
    const bb = at(Object.assign({}, over, { onUre: 'badblock' }), 8);
    assert.equal(bb.ev.ures[0].result, 'lost');
    assert.equal(bb.array, 'rebuilding');
  }
  assert.ok(found > 0, 'some seed puts a URE in band 7');
  // RAID 5: the failure in band 7 ends the array before the band is read; its URE is never reached
  const per = 3 * logic.norm(P()).bandBits;
  let hidden = 0;
  for (let seed = 1; seed <= 99; seed++) {
    const s = at({ speed: 50, later: 'h15', seed }, 8);
    if (s.ev.kind !== 'band' || s.ev.band !== 7) continue;              // an earlier URE ended it first
    assert.equal(s.ev.cause, 'fail');
    assert.deepEqual(s.ev.ures, []);
    if (logic.ureList(logic.norm(P({ seed }))).some((u) => u.at > 6 * per && u.at <= 7 * per)) hidden++;
  }
  assert.ok(hidden > 0, 'some seed had a URE waiting in band 7');
});

test('tie-break: a failure exactly at the end of a band belongs to that band', () => {
  const o = logic.norm(P({ speed: 50 }));
  logic.LATER.edge = [3 * o.bandHours];
  try {
    assert.equal(logic.steps(P({ speed: 50, later: 'edge', seed: 4 })), 4, 'fails in band 3 = step 4');
    const s = at({ speed: 50, later: 'edge', seed: 4 }, 4);
    assert.equal(s.ev.band, 3);
    assert.equal(s.ev.cause, 'fail');
  } finally { delete logic.LATER.edge; }
});

test('tie-break: a URE falls on a surviving disk, never on a failed disk or the spare', () => {
  for (let seed = 1; seed <= 99; seed++) {
    for (const over of [{ seed, level: 6, onUre: 'badblock', later: 'h18-32', speed: 50, sizeTB: 12, n: 8 }, { seed, onUre: 'badblock' }]) {
      const p = P(over);
      let s = logic.initial(p);
      for (let n = 1; n <= logic.steps(p); n++) {
        const before = s;
        s = logic.step(s, n, p);
        for (const u of s.ev.ures) {
          assert.notEqual(u.disk, s.spare.name);
          const d = before.disks.find((x) => x.name === u.disk);
          assert.equal(d.status, 'ok', `seed ${seed} step ${n}: ${u.disk} was alive`);
          assert.ok(!s.ev.fails.some((f) => f.disk === u.disk), 'not the disk that failed in this band');
        }
      }
    }
  }
});

test('tie-break: after the array fails, further steps change nothing', () => {
  const p = P(), last = logic.steps(p), s = kit.stateAt(logic, p, last);
  assert.equal(s.array, 'failed');
  const after = logic.step(s, last + 1, p);
  assert.deepEqual(Object.assign({}, after, { i: 0 }), Object.assign({}, s, { i: 0 }));
});

test('tie-break: the slot being recovered stays _ until the last band; the failed disk stays listed (F)', () => {
  const p = P({ ureRate: '1e15' });
  assert.equal(box(at({ ureRate: '1e15' }, 10)), '[4/3] [UU_U]');
  const s = at({ ureRate: '1e15' }, 11);
  assert.equal(box(s), '[4/4] [UUUU]');
  assert.match(logic.mdstatLines(s.mdstat)[1], / sdc\[2\]\(F\) /);
  assert.equal(logic.steps(p), 11);
});

// ── rules ──

test('rule 1: a rebuild reads every surviving disk in full: (n − 1) × size × 8 bits', () => {
  const s = end({ ureRate: '1e15' });
  assert.equal(s.bitsRead, 3 * 4e12 * 8);
  assert.equal(s.bitsRead, 9.6e13);
  assert.equal(logic.norm(P(PRESETS['pfx-fs1'])).plannedBits, 7.2e14);
  // one band = 10 % of every surviving disk
  assert.equal(at({}, 2).bitsRead, 9.6e12);
  // after a second failure (RAID 6) only the disks left are read
  const pfx = PRESETS['pfx-fs1'];
  assert.equal(at(pfx, 7).bitsRead - at(pfx, 6).bitsRead, 14 * 6e11 * 8);
  assert.equal(at(pfx, 6).bitsRead - at(pfx, 5).bitsRead, 15 * 6e11 * 8);
});

test('rule 2: rebuild time = size / speed; each band advances the clock by a tenth; md limits', () => {
  close(logic.norm(P()).totalHours, 5.5556, 1e-3, 'idle 4 TB');
  close(logic.norm(P({ speed: 50 })).totalHours, 22.222, 1e-3, 'under load 4 TB');
  close(logic.norm(P(PRESETS['pfx-fs1'])).totalHours, 33.333, 1e-3, 'pfx-fs1');
  for (let n = 1; n <= 11; n++) close(at({ ureRate: '1e15' }, n).hours, (n - 1) * 0.5556, 1e-3, `step ${n}`);
  const o = logic.norm(P()), u = logic.norm(P({ speed: 50 }));
  assert.equal(o.speedK, 195312);
  assert.equal(u.speedK, 48828);
  assert.ok(o.speedK <= logic.SPEED_LIMIT_MAX && u.speedK >= logic.SPEED_LIMIT_MIN);
});

test('rule 3: P(≥ 1 URE) = 1 − e^(−bits/rate), ≈ 1 − (1 − 1/rate)^bits; the seed places UREs by that law', () => {
  close(logic.norm(P()).pUre, 0.617, 1e-3, 'raid5 1e14');
  close(logic.norm(P({ ureRate: '1e15' })).pUre, 0.0915, 1e-4, 'raid5 1e15');
  close(logic.norm(P(PRESETS['pfx-fs1'])).pUre, 0.513, 1e-3, 'pfx-fs1');
  close(logic.norm(P()).pUre, 1 - Math.exp(9.6e13 * Math.log1p(-1e-14)), 1e-6, 'exact form (1 − 1/rate)^bits');
  // mulberry32 is Simdeck.rng
  const a = logic.rng(7), b = kit.rng(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  // the first URE sits at −ln(1 − u) · rate bits for the seed's first draw
  const o = logic.norm(P({ seed: 7 })), u = kit.rng(7)();
  close(logic.ureList(o)[0].at, -Math.log(1 - u) * 1e14, 1);
  // over seeds 1..99, the share of RAID 5 1e14 runs with a URE is near 62 %
  let hit = 0;
  for (let seed = 1; seed <= 99; seed++) if (logic.ureList(logic.norm(P({ seed }))).length) hit++;
  close(hit / 99, 0.617, 0.12, 'share of seeds with a URE');
  // the same seed with a rate ten times better puts the URE ten times further away
  close(logic.ureList(logic.norm(P({ ureRate: '1e15', n: 16, sizeTB: 12 })))[0].at, 10 * logic.ureList(logic.norm(P()))[0].at, 1e3);
  // the probability so far follows the bits read
  close(at({}, 4).pSoFar, 1 - Math.exp(-3 * 9.6e12 / 1e14), 1e-12);
});

test('rule 4: degraded RAID 5 cannot correct a URE: abort fails the array; badblock loses one stripe and goes on', () => {
  const s = end({});
  assert.equal(logic.steps(P()), 7);
  assert.equal(s.array, 'failed');
  assert.equal(s.aborted, true);
  assert.deepEqual(s.ev.ures, [{ disk: 'sdb', result: 'abort' }]);
  assert.equal(s.spare.status, 'stopped');
  close(s.progress, 0.529, 1e-3, 'the rebuild stopped in the 50–60 % band');
  close(s.hours, 2.938, 1e-3, 'the clock stops at the URE, not at the band end');
  close(s.bitsRead, 5.078e13, 1e10, 'bits read up to the URE');
  assert.deepEqual(s.ures, [{ disk: 'sdb', band: 6, result: 'abort' }]);
  assert.equal(s.spare.bands[5], null, 'the band is not written');
  assert.equal(s.band, 5);
  assert.equal(s.ev.failed, true);
  assert.equal(s.ev.cause, 'ure');
  assert.equal(s.ev.done, false);
  assert.equal(box(s), '[4/2] [U__U]', 'the disk with the read error is failed too');
  const bb = end({ onUre: 'badblock' });
  assert.equal(logic.steps(P({ onUre: 'badblock' })), 11);
  assert.equal(bb.array, 'optimal');
  assert.equal(bb.lostStripes, 1);
  assert.deepEqual(bb.spare.bands, ['ok', 'ok', 'ok', 'ok', 'ok', 'lost', 'ok', 'ok', 'ok', 'ok']);
  assert.equal(bb.bitsRead, 9.6e13);
});

test('rule 5: RAID 6 with one disk failed corrects a URE and the rebuild completes', () => {
  const s = end({ level: 6 });
  assert.equal(logic.steps(P({ level: 6 })), 11);
  assert.deepEqual(s.ures, [{ disk: 'sdb', band: 6, result: 'fixed' }]);
  assert.equal(s.array, 'optimal');
  assert.equal(s.lostStripes, 0);
  assert.equal(at({ level: 6 }, 7).parityLeft, 1);
});

test('rule 6: a second failure fails RAID 5; RAID 6 goes on with no parity; a third fails RAID 6', () => {
  const r5 = end(PRESETS['under-load']);
  assert.equal(logic.steps(P(PRESETS['under-load'])), 8);
  assert.equal(r5.array, 'failed');
  assert.equal(r5.hours, 15);
  assert.deepEqual(r5.ev.fails, [{ disk: 'sdd', hours: 15, nth: 2 }]);
  assert.equal(box(r5), '[4/2] [UU__]');
  close(r5.progress, 0.675, 1e-9, 'stopped at hour 15 of 22.2');
  assert.equal(r5.parityLeft, 0, 'clamped at 0 on a failed array');
  assert.equal(r5.spare.status, 'stopped');
  assert.equal(r5.spare.bands[6], null, 'band 7 not written');
  assert.equal(r5.band, 6);
  assert.equal(r5.ev.failed, true);
  assert.equal(r5.ev.cause, 'fail');
  assert.equal(r5.ev.done, false);
  assert.ok(!logic.mdstatLines(r5.mdstat).some((l) => /recovery/.test(l)), 'no recovery line on a failed array');
  // the same failure hour, idle: the rebuild is done after 5.6 h, the failure comes after it
  const idle = end({ later: 'h15', seed: 4 });
  assert.equal(idle.array, 'optimal');
  assert.deepEqual(idle.ev.after, [15]);
  assert.equal(idle.ev.done, true);
  assert.equal(idle.spare.status, 'in');
  // RAID 6: second failure in band 6 (18 h), third in band 10 (32 h)
  const pfx = PRESETS['pfx-fs1'];
  const s6 = at(pfx, 7);
  assert.deepEqual(s6.ev.fails, [{ disk: 'sdp', hours: 18, nth: 2 }]);
  assert.equal(s6.array, 'rebuilding');
  assert.equal(s6.parityLeft, 0);
  const s11 = end(pfx);
  assert.equal(logic.steps(P(pfx)), 11);
  assert.deepEqual(s11.ev.fails, [{ disk: 'sda', hours: 32, nth: 3 }]);
  assert.equal(s11.array, 'failed');
  // a URE after the second failure of RAID 6 loses a stripe (badblock)
  let lost = null;
  for (let seed = 1; seed <= 99 && !lost; seed++) {
    const e = end({ level: 6, speed: 50, later: 'h15', onUre: 'badblock', seed });
    if (e.ures.some((u) => u.band >= 7 && u.result === 'lost')) lost = e;
  }
  assert.ok(lost, 'some seed has a URE after the second failure');
  assert.ok(lost.ures.filter((u) => u.band < 7).every((u) => u.result === 'fixed'), 'before it, UREs were corrected');
  assert.equal(lost.array, 'degraded', 'done, but the second failed disk is not replaced');
});

test('mdstat: md\'s layout, the recovery line as md draws it', () => {
  assert.deepEqual(logic.mdstatLines(at({}, 0).mdstat), [
    'Personalities : [raid6] [raid5] [raid4]',
    'md0 : active raid5 sde[4](S) sdd[3] sdc[2] sdb[1] sda[0]',
    '      11718750000 blocks super 1.2 level 5, 512k chunk, algorithm 2 [4/4] [UUUU]',
    'unused devices: <none>']);
  assert.equal(logic.mdstatLines(at({}, 1).mdstat)[3],
    '      [>....................]  recovery =  0.0% (0/3906250000) finish=333.3min speed=195312K/sec');
  assert.equal(logic.mdstatLines(at({}, 3).mdstat)[3],
    '      [====>................]  recovery = 20.0% (781250000/3906250000) finish=266.6min speed=195312K/sec');
  assert.ok(!/\(S\)/.test(logic.mdstatLines(at({}, 1).mdstat)[1]), 'no (S) once recovery runs');
  // a progress that is not a multiple of 5 % (5 of 12 TB at 200 MB/s ... band 7 = 70 %; 33.3 % via a fraction)
  assert.equal(logic.mdstatLines({ level: 5, members: [], n: 4, active: 3, map: 'UU_U', blocks: 1, recovery: { done: 333, total: 1000, speedK: 1 } })[3],
    '      [======>..............]  recovery = 33.3% (333/1000) finish=11.1min speed=1K/sec');
  assert.equal(at({ level: 6 }, 0).mdstat.blocks, 2 * 3906250000);
  assert.equal(at(PRESETS['pfx-fs1'], 0).mdstat.blocks, 14 * 5859375000);
});

test('preset step counts and outcomes (task file)', () => {
  const want = { 'raid5-ure': [7, 'failed'], 'raid5-enterprise': [11, 'optimal'], 'raid6-ure': [11, 'optimal'],
    'under-load': [8, 'failed'], 'pfx-fs1': [11, 'failed'] };
  for (const [id, [n, state]] of Object.entries(want)) {
    assert.equal(logic.steps(P(PRESETS[id])), n, id);
    assert.equal(end(PRESETS[id]).array, state, id);
  }
  assert.equal(logic.steps(logic.defaults), 7);
  assert.deepEqual(end(PRESETS['raid5-enterprise']).ures, []);
  assert.deepEqual(end(PRESETS['pfx-fs1']).ures, [{ disk: 'sda', band: 1, result: 'fixed' }]);
});

// ── generic checks every sim keeps ──

const ALL = Object.values(PRESETS).concat([{ onUre: 'badblock' }, { level: 6, n: 9, sizeTB: 12, speed: 50, later: 'h18-32', onUre: 'badblock', seed: 33 }]);

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of ALL) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('every parameter is cleaned: odd values fall back to defaults or bounds', () => {
  const o = logic.norm({ level: 7, n: 40, sizeTB: 5, speed: 99, ureRate: 'x', onUre: 'y', later: 'z', seed: 0 });
  assert.deepEqual([o.level, o.n, o.sizeTB, o.speed, o.ureRate, o.onUre, o.later, o.seed], [5, 16, 4, 200, '1e14', 'abort', 'none', 1]);
  assert.equal(logic.norm({ level: '6', sizeTB: '12', speed: '50' }).level, 6);
  assert.equal(logic.norm({ seed: 'x' }).seed, 18);
  assert.equal(logic.norm({ n: 'x' }).n, 4);
  assert.ok(logic.steps({ n: 16, sizeTB: 12 }) >= 1);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches the tested presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default preset');
  const presets = Object.fromEntries([...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)]
    .map((m) => [m[1], Function('return ' + m[2])()]));
  assert.deepEqual(presets, PRESETS);
  for (const params of Object.values(presets)) for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k}`);
});
