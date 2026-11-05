// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for backup-window's model (rules: SPEC.md). Run: node --test sims/backup-window/
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
const fromPreset = (id, over) => run(Object.assign({}, preset(id).params, over));
const H = 3600;
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} ≉ ${b}`);

// ── tie-breaks first ──

test('rule 6 tie-break: equal seeding times prefer the link', () => {
  // 1 TB at 1000 Mbit/s × 1.0 = 8000 s; by truck at 250 MB/s: 4000 s out + 0 drive + 4000 s in = 8000 s
  const s = run({ sizeTB: 1, linkMbit: 1000, efficiency: 1, localMBs: 250, driveH: 0 });
  assert.equal(s.linkS, 8000);
  assert.equal(s.truckS, 8000);
  assert.equal(s.best, 'link');
  assert.equal(logic.faster(100, 100), 'link');
  assert.equal(logic.faster(101, 100), 'truck');
  assert.equal(logic.faster(99, 100), 'link');
  // half an hour of driving more: the link wins outright
  assert.equal(run({ sizeTB: 1, linkMbit: 1000, efficiency: 1, localMBs: 250, driveH: 0.5 }).best, 'link');
});

test('rule 3 tie-break: a transfer exactly as long as the window fits', () => {
  // 90 TB × 2 % = 1.8 TB at 1 Gbit/s = 14 400 s = the 4 h window
  const s = run({ sizeTB: 90, changePct: 2, linkMbit: 1000, efficiency: 1, windowH: 4 });
  assert.equal(s.incrS, 4 * H);
  assert.equal(s.fitsNightly, true);
  assert.equal(s.overflowS, 0);
  const over = run({ sizeTB: 90, changePct: 2.1, linkMbit: 1000, efficiency: 1, windowH: 4 });
  assert.equal(over.fitsNightly, false);
  assert.equal(over.overflowS, over.incrS - 4 * H);
  // the nightly full the same way: 3.6 TB at 1 Gbit/s = 28 800 s = an 8 h window
  assert.equal(run({ sizeTB: 3.6, linkMbit: 1000, efficiency: 1, windowH: 8 }).fullFits, true);
  assert.equal(run({ sizeTB: 3.7, linkMbit: 1000, efficiency: 1, windowH: 8 }).fullFits, false);
});

test('rule 4 tie-break: a nightly change that takes the whole window never drains the queue', () => {
  const s = run({ sizeTB: 90, changePct: 2, linkMbit: 1000, efficiency: 1, windowH: 4 });
  assert.equal(s.fitsNightly, true);                // it fits (rule 3) …
  assert.equal(s.catchUpNights, null);              // … but nothing is left over for the queue
  assert.equal(s.growS, 0);
  assert.deepEqual(logic.catchUp(3, 100, 100), { backlogS: 300, nights: null, growS: 0 });
  assert.deepEqual(logic.catchUp(3, 99, 100), { backlogS: 297, nights: 297, growS: 0 });
});

test('rule 4 tie-break: a full copy of exactly k windows takes k nights, not k + 1', () => {
  assert.equal(logic.seedNights(2 * 14400, 14400), 2);
  assert.equal(logic.seedNights(2 * 14400 + 1, 14400), 3);
  assert.equal(logic.seedNights(1, 14400), 1);
  const s = run({ sizeTB: 3.6, linkMbit: 1000, efficiency: 1, windowH: 4 });   // 28 800 s
  assert.equal(s.nightsToSeed, 2);
});

test('the truck lane appears past three nights, not at three; choosing the truck always shows it', () => {
  // 1 Gbit/s × 1.0, 12 h window: 3 windows = 129 600 s = 16.2 TB
  assert.equal(run({ sizeTB: 16.2, linkMbit: 1000, efficiency: 1 }).nightsToSeed, 3);
  assert.equal(run({ sizeTB: 16.2, linkMbit: 1000, efficiency: 1 }).showTruck, false);
  assert.equal(run({ sizeTB: 16.3, linkMbit: 1000, efficiency: 1 }).showTruck, true);
  assert.equal(run({ sizeTB: 1, seedBy: 'truck' }).showTruck, true);
  assert.equal(logic.compute(P({ sizeTB: 16.2, linkMbit: 1000, efficiency: 1 }), { seedNightsMax: 2 }).showTruck, true);
});

// ── rules ──

test('rule 1: transfer time = bytes × 8 / (bit/s × efficiency), decimal units', () => {
  assert.equal(logic.transferS(1e12, 1000, 1), 8000);                 // 1 TB at 1 Gbit/s: 2.2 h, not seconds
  near(logic.transferS(1e12, 1000, 1) / H, 2.22, 0.01);
  assert.equal(logic.transferS(1e12, 1000, 0.8), 10000);              // efficiency stretches it
  assert.equal(logic.transferS(1e12, 10000, 1), 800);
  const s = fromPreset('hq-to-cloud');
  near(s.fullS / H, 47.6, 0.05, 'hq full');
  assert.equal(s.nightsToSeed, 4);                                    // ≈ 4 twelve-hour windows
  near(s.incrS / H, 0.48, 0.005, 'hq nightly');
  assert.equal(s.fitsNightly, true);
  // the default efficiency 0.8 is used when the preset does not set it
  assert.equal(run({ sizeTB: 1, linkMbit: 1000 }).fullS, 10000);
});

test('rule 2: the nightly incremental is size × change rate', () => {
  assert.equal(logic.changedBytes(21.4, 1), 214e9);
  const s = fromPreset('brk-uplink');
  assert.equal(s.incrBytes, 214e9);
  near(s.fullS / 86400, 39.6, 0.05, 'brk full in days');
  near(s.incrS / H, 9.5, 0.05, 'brk nightly');
  assert.equal(s.fitsNightly, true);                                  // barely inside 12 h
  const two = fromPreset('brk-uplink', { changePct: 2 });
  near(two.incrS / H, 19.0, 0.05);
  assert.equal(two.fitsNightly, false);                               // at 2 % it no longer fits
  near(two.overflowS / H, 7.0, 0.05);
});

test('rule 3: a nightly full of the VM dumps fits no window', () => {
  const s = fromPreset('vm-dumps-to-nas');
  near(s.fullS / H, 23.1, 0.05);
  assert.equal(s.fullFits, false);
  for (let w = 4; w <= 14; w++) assert.equal(fromPreset('vm-dumps-to-nas', { windowH: w }).fullFits, false, `window ${w}`);
  assert.equal(s.fitsNightly, true);                                  // the incremental does
  assert.equal(s.showTruck, false);                                   // two nights: no truck lane
});

test('rule 4: seeding nights, link time from the first night, and the queue it leaves', () => {
  const s = fromPreset('hq-to-cloud');
  // 4 nights: three full windows of 12 h, then the rest; three days between the first and the last start
  assert.equal(s.linkS, 3 * 86400 + (s.fullS - 3 * 12 * H));
  assert.equal(s.seedDays, 4);
  assert.equal(s.backlogS, 4 * s.incrS);
  assert.equal(s.catchUpNights, Math.ceil(4 * s.incrS / (12 * H - s.incrS)));
  assert.equal(s.catchUpNights, 1);
  const b = fromPreset('brk-uplink');
  assert.equal(b.nightsToSeed, 80);
  assert.equal(b.seedDays, 80);
  assert.equal(b.catchUpNights, Math.ceil(80 * b.incrS / (12 * H - b.incrS)));
  assert.ok(b.catchUpNights > 300);                                   // a year before the offsite copy is current
});

test('rule 4: when the nightly change does not fit, the queue never drains and grows each night', () => {
  const s = fromPreset('never-catches-up');
  assert.equal(s.p.linkMbit, 20);
  assert.equal(s.incrBytes, 100e9);
  near(s.incrS / H, 11.1, 0.05);
  assert.equal(s.fitsNightly, false);
  assert.equal(s.catchUpNights, null);
  assert.equal(s.growS, s.incrS - 8 * H);
  assert.equal(s.overflowS, s.incrS - 8 * H);
});

test('rule 5: truck = copy out + drive + copy in at the local rate', () => {
  const s = fromPreset('truck');
  near(s.truck.out / H, 29.7, 0.05);
  assert.equal(s.truck.in, s.truck.out);
  assert.equal(s.truck.drive, 2 * H);
  near(s.truckS / 86400, 2.6, 0.05);
  assert.ok(s.truckS < 3 * 86400);                                    // under three days …
  near(s.fullS / 86400, 39.6, 0.05);                                  // … instead of 39.6 days of transfer
  assert.equal(s.best, 'truck');
  assert.equal(s.seedS, s.truckS);
  assert.equal(s.seedDays, 3);                                        // three days of changes then go over the link
  assert.equal(s.catchUpNights, Math.ceil(3 * s.incrS / (12 * H - s.incrS)));
  // drive time counts once; the local rate counts twice
  assert.equal(fromPreset('truck', { driveH: 5 }).truckS - s.truckS, 3 * H);
  assert.equal(logic.truckParts(1, 500, 0).out, 2000);
});

test('the chosen plan feeds the queue: link seeding vs truck seeding', () => {
  const link = fromPreset('brk-uplink');
  const truck = fromPreset('truck');
  assert.equal(link.seedS, link.linkS);
  assert.ok(truck.catchUpNights < link.catchUpNights);
});

test('changed: the verdicts that flip between two states', () => {
  const a = fromPreset('brk-uplink');
  const b = fromPreset('brk-uplink', { changePct: 2 });
  assert.deepEqual(logic.flipped(a, b), ['fitsNightly', 'catchesUp']);
  assert.deepEqual(logic.flipped(a, a), []);
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(fromPreset('vm-dumps-to-nas'), fromPreset('hq-to-cloud')), ['showTruck', 'best']);
  assert.deepEqual(logic.flipped(fromPreset('brk-uplink'), fromPreset('truck')), []);       // same verdicts, other plan
  assert.deepEqual(logic.flipped(run({ sizeTB: 3.6, linkMbit: 1000, efficiency: 1, windowH: 8 }),
    run({ sizeTB: 3.7, linkMbit: 1000, efficiency: 1, windowH: 8 })), ['fullFits']);   // the truck is faster, but its lane is hidden
});

test('captions: one key per situation, with its notes', () => {
  assert.deepEqual(logic.captionKey(fromPreset('hq-to-cloud')), { key: 'cLongSeed', notes: ['nCatchUp'] });
  assert.deepEqual(logic.captionKey(fromPreset('brk-uplink')), { key: 'cLongSeed', notes: ['nCatchUp'] });
  assert.deepEqual(logic.captionKey(fromPreset('truck')), { key: 'cTruck', notes: ['nCatchUp'] });
  assert.deepEqual(logic.captionKey(fromPreset('vm-dumps-to-nas')), { key: 'cFewNights', notes: ['nCatchUp'] });
  assert.deepEqual(logic.captionKey(fromPreset('never-catches-up')), { key: 'cIncrOver', notes: [] });
  assert.deepEqual(logic.captionKey(run({ sizeTB: 1, linkMbit: 10000 })), { key: 'cAllFit', notes: [] });
  // the truck chosen where the link is as fast
  assert.deepEqual(logic.captionKey(run({ sizeTB: 1, linkMbit: 1000, efficiency: 1, localMBs: 250, driveH: 0, seedBy: 'truck' })),
    { key: 'cTruck', notes: ['nLinkFaster'] });                       // one night: no catch-up note
  // the nightly change takes the whole window: it fits, but the queue never drains
  assert.deepEqual(logic.captionKey(run({ sizeTB: 90, changePct: 2, linkMbit: 1000, efficiency: 1, windowH: 4 })),
    { key: 'cLongSeed', notes: ['nNeverDrains'] });
  // seeding past three nights where the link is still as fast as the truck
  assert.deepEqual(logic.captionKey(run({ sizeTB: 100, linkMbit: 10000, efficiency: 1, windowH: 4, changePct: 0.1 })),
    { key: 'cLongSeed', notes: ['nLinkStill', 'nCatchUp'] });
});

test('params from a URL are cleaned: unknown link speeds, out-of-range and non-numbers', () => {
  const s = logic.compute({ sizeTB: 'x', changePct: 50, linkMbit: 123, efficiency: 0, windowH: 99, localMBs: -5, driveH: 'y', seedBy: 'boat' });
  assert.deepEqual(s.p, { sizeTB: 21.4, changePct: 10, linkMbit: 1000, efficiency: 0.5, windowH: 14, localMBs: 100, driveH: 2, seedBy: 'link' });
  assert.ok(Number.isFinite(s.fullS) && Number.isFinite(s.truckS));
  assert.equal(logic.compute({ linkMbit: '50' }).p.linkMbit, 50);
});

// ── tests added after the review (mutants that survived) ──

test('rule 4: a truck time of whole days queues exactly that many days', () => {
  const s = run({ sizeTB: 21.6, localMBs: 250, driveH: 0, seedBy: 'truck', linkMbit: 50, efficiency: 1, changePct: 1 });
  assert.equal(s.truckS, 2 * 86400);
  assert.equal(s.seedDays, 2);
});

test('rule 1: transfers round to the nearest second, not up or down', () => {
  // 16.7 TB × 9.7 % at 1000 Mbit/s × 0.9 = 14 399.1 s: rounds to 14 399, inside the 4 h window
  const s = run({ sizeTB: 16.7, changePct: 9.7, linkMbit: 1000, efficiency: 0.9, windowH: 4 });
  assert.equal(s.incrS, 14399);
  assert.equal(s.fitsNightly, true);
  assert.notEqual(s.catchUpNights, null);
  assert.equal(logic.transferS(1e9, 1000, 0.9), 9);                  // 8.89 s
  assert.equal(logic.transferS(0.5e9, 1000, 0.9), 4);                // 4.44 s
  assert.equal(logic.truckParts(1, 300, 0).out, 3333);               // 3333.3 s
  assert.equal(logic.truckParts(1, 150, 0).out, 6667);               // 6666.7 s
});

test('rule 4: a nightly change that rounds to 0 s queues nothing and catches up at once', () => {
  const s = run({ sizeTB: 0.5, changePct: 0.1, linkMbit: 10000, efficiency: 1, seedBy: 'truck' });
  assert.equal(s.incrS, 0);
  assert.equal(s.backlogS, 0);
  assert.equal(s.catchUpNights, 0);
  assert.equal(logic.verdicts(s).catchesUp, true);
});

test('captions: the nightly overflow wins over the truck; an overflow past the rest of the day has its own key', () => {
  assert.equal(logic.captionKey(fromPreset('truck', { changePct: 2 })).key, 'cIncrOver');
  assert.deepEqual(logic.captionKey(fromPreset('truck', { changePct: 2 })).notes, []);
  // 21.4 TB × 10 % over 50 Mbit/s: 95 h; the overflow (83 h) is longer than the 12 h outside the window
  assert.equal(logic.captionKey(fromPreset('brk-uplink', { changePct: 10 })).key, 'cIncrNoDay');
  // an overflow of exactly the 12 h outside the window is still cIncrOver: 9.72 TB at 900 Mbit/s = 86 400 s
  const day = run({ sizeTB: 97.2, changePct: 10, linkMbit: 1000, efficiency: 0.9, windowH: 12 });
  assert.equal(day.incrS, 86400);
  assert.equal(logic.captionKey(day).key, 'cIncrOver');
});

test('captions: exactly three nights is cFewNights, four is cLongSeed', () => {
  assert.equal(logic.captionKey(run({ sizeTB: 16.2, linkMbit: 1000, efficiency: 1 })).key, 'cFewNights');
  assert.equal(logic.captionKey(run({ sizeTB: 16.3, linkMbit: 1000, efficiency: 1 })).key, 'cLongSeed');
});

test('the window is centred on 01:00; 1 TB time counts the efficiency', () => {
  assert.equal(run({ windowH: 12 }).windowFrom, 7);                   // 7 h after noon = 19:00
  assert.equal(run({ windowH: 8 }).windowFrom, 9);                    // 21:00
  assert.equal(run({ windowH: 13 }).windowFrom, 6.5);                 // 18:30
  assert.equal(run({ linkMbit: 1000, efficiency: 0.8 }).perTBS, 10000);
  assert.equal(run({ linkMbit: 1000, efficiency: 1 }).perTBS, 8000);
});

test('slower: strictly slower than the other plan; a tie is not slower either way', () => {
  const tie = { sizeTB: 1, linkMbit: 1000, efficiency: 1, localMBs: 250, driveH: 0 };
  assert.equal(run(tie).slower, false);
  assert.equal(run(Object.assign({ seedBy: 'truck' }, tie)).slower, false);
  assert.equal(fromPreset('brk-uplink').slower, true);
  assert.equal(fromPreset('truck').slower, false);
  assert.equal(fromPreset('truck', { linkMbit: 10000 }).slower, true);
});

test('changed: the faster plan counts only while the truck lane shows it', () => {
  const a = run({ sizeTB: 3.6, linkMbit: 1000, efficiency: 1, windowH: 8 });
  const b = run({ sizeTB: 3.7, linkMbit: 1000, efficiency: 1, windowH: 8 });
  assert.equal(a.best, 'link');
  assert.equal(b.best, 'truck');
  assert.equal(b.showTruck, false);
  assert.deepEqual(logic.flipped(a, b), ['fullFits']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ sizeTB: 33.3, changePct: 3.3, linkMbit: 80, seedBy: 'truck' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['cIncrOver', 'cAllFit', 'cFewNights', 'cLongSeed', 'cTruck', 'nLinkFaster', 'nLinkStill', 'nCatchUp', 'nNeverDrains'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries) assert.ok(preset(e.preset), e.preset);
  for (const pr of logic.presets) assert.ok(html.includes(`'${pr.id}'`), `page labels preset ${pr.id}`);
});
