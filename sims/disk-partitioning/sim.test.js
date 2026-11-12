// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the MBR vs GPT model. Run: node --test sims/disk-partitioning/
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
const types = (s) => s.mbr.slots.map((x) => x.type);
const names = (list) => list.map((x) => x.name);
const TWO32 = 4294967296;

// ── tie-breaks ──

test('tie-break (rule 8): at five partitions slot 4 becomes the extended one before a fourth primary is made', () => {
  // four fit as four primaries
  const four = run({ parts: 4 });
  assert.deepEqual(types(four), ['primary', 'primary', 'primary', 'primary']);
  assert.equal(four.mbr.extended, null);
  assert.deepEqual(names(four.mbr.parts), ['vdb1', 'vdb2', 'vdb3', 'vdb4']);
  // five: never four primaries and then a refusal; the 4th requested partition is the first logical one, vdb5
  const five = run({ parts: 5 });
  assert.deepEqual(types(five), ['primary', 'primary', 'primary', 'extended']);
  assert.deepEqual(names(five.mbr.parts), ['vdb1', 'vdb2', 'vdb3', 'vdb5', 'vdb6']);
  assert.deepEqual(five.mbr.parts.map((x) => x.req), [1, 2, 3, 4, 5]);
  assert.equal(five.mbr.extended.name, 'vdb4');
  assert.deepEqual(logic.planMbr(4), ['primary', 'primary', 'primary', 'primary']);
  assert.deepEqual(logic.planMbr(5), ['primary', 'primary', 'primary', 'extended']);
  assert.deepEqual(logic.planMbr(8), ['primary', 'primary', 'primary', 'extended']);
});

test('tie-break (rule 5): "100%" ends on the last whole MiB before GPT\'s backup, but on the very last sector for MBR', () => {
  const s = run({ disk: '2GiB', parts: 2 });
  assert.equal(s.gpt.lastUsable, 4194270);
  assert.equal(s.gpt.entries[1].end, 4192255);            // 2047 MiB − 1 sector: 4194270 is not a MiB boundary
  assert.equal(s.mbr.parts[1].end, 4194303);              // the disk's last sector ends a whole MiB
  // the same rule on the 1 TB disk, where neither table ends on a MiB boundary of its own
  const t = run({ disk: '1TB', parts: 1 });
  assert.equal(t.gpt.entries[0].end, 1953523711);
  assert.equal(t.mbr.parts[0].end, 1953523711);
  assert.equal(logic.alignEnd(4194270, 2048), 4192255);
  assert.equal(logic.alignEnd(4194303, 2048), 4194303);
  assert.equal(logic.alignEnd(2047, 2048), 2047);         // sector 2047 ends the first MiB
  assert.equal(logic.alignEnd(2046, 2048), -1);           // nothing whole before it
});

test('tie-break (rule 3): a partition that starts past 2^32 sectors is not made; an explicit end past it is cut at 2^32 − 1', () => {
  // "100%" on MBR means as far as the table reaches: it ends at 2^32 − 1 silently, not marked as cut
  const two = run({ disk: '4TB', parts: 2 });
  assert.deepEqual(two.mbr.missing, []);
  assert.deepEqual(two.mbr.clipped, []);
  assert.equal(two.mbr.parts[1].end, TWO32 - 1);
  const three = run({ disk: '4TB', parts: 3 });
  assert.deepEqual(three.mbr.clipped, [2]);
  assert.deepEqual(three.mbr.missing, [3]);
  assert.equal(three.mbr.parts[1].end, TWO32 - 1);       // cut at the line, not where it was asked to end
  assert.deepEqual(names(three.mbr.parts), ['vdb1', 'vdb2']);
  assert.equal(three.gpt.entries.length, 3);              // GPT makes all three
  // the last describable sector is 2^32 − 1, the first undescribable one 2^32
  assert.equal(three.mbr.lastUsable, TWO32 - 1);
  assert.equal(three.mbr.unreachable.start, TWO32);
  // exactly at the line: a start at 2^32 − 2048 is made, a start at 2^32 is not
  const d = { sectors: TWO32 + 1048576, bytes: (TWO32 + 1048576) * 512, perMiB: 2048, sectorSize: 512 };
  const at = logic.mbrLayout(d, [{ req: 1, start: 2048, end: TWO32 - 2049 }, { req: 2, start: TWO32 - 2048, end: null }]);
  assert.deepEqual(at.missing, []);
  assert.equal(at.parts[1].end, TWO32 - 1);
  const past = logic.mbrLayout(d, [{ req: 1, start: 2048, end: TWO32 - 1 }, { req: 2, start: TWO32, end: null }]);
  assert.deepEqual(past.missing, [2]);
  assert.deepEqual(past.clipped, []);
});

// ── rule 1: four slots in sector 0 ──

test('rule 1: MBR has exactly four slots; a fifth primary is refused', () => {
  const t = logic.createMbr();
  for (let i = 1; i <= 4; i++) assert.equal(logic.addPrimary(t, { req: i, start: i * 10, end: i * 10 + 5 }), 'ok');
  assert.equal(logic.addPrimary(t, { req: 5, start: 60, end: 65 }), 'full');
  assert.equal(logic.addExtended(t, 70, 90), 'full');
  assert.equal(t.slots.length, 4);
  assert.deepEqual(t.slots.map((x) => x.num), [1, 2, 3, 4]);
  for (let n = 1; n <= 8; n++) {
    const s = run({ parts: n });
    assert.equal(s.mbr.slots.length, 4, `n = ${n}`);
    assert.ok(s.mbr.slots.filter((x) => x.type === 'primary').length <= 4);
  }
  // fewer than four: the rest of the slots stay empty
  assert.deepEqual(types(run({ parts: 2 })), ['primary', 'primary', 'empty', 'empty']);
});

// ── rule 2: extended and logical ──

test('rule 2: logical partitions live inside the one extended partition, each behind its own EBR, numbered from 5', () => {
  const s = run({ parts: 8 });
  assert.deepEqual(names(s.mbr.parts), ['vdb1', 'vdb2', 'vdb3', 'vdb5', 'vdb6', 'vdb7', 'vdb8', 'vdb9']);
  const ext = s.mbr.extended;
  s.mbr.logical.forEach((l) => {
    assert.ok(l.ebr >= ext.start && l.end <= ext.end, l.name);
    assert.equal(l.start, l.ebr + s.perMiB);              // EBR, then the 1 MiB alignment gap
  });
  assert.equal(ext.start, s.mbr.logical[0].ebr);
  assert.equal(ext.end, s.mbr.logical[s.mbr.logical.length - 1].end);
  // primitives: one extended only; no logical without it
  const t = logic.createMbr();
  assert.equal(logic.addLogical(t, { req: 1, start: 100, end: 200 }, 8), 'no-extended');
  assert.equal(logic.addExtended(t, 100, 900), 'ok');
  assert.equal(logic.addExtended(t, 100, 900), 'exists');
  assert.equal(logic.addLogical(t, { req: 1, start: 100, end: 200 }, 8), 'ok');
  assert.equal(logic.addLogical(t, { req: 2, start: 201, end: 300 }, 8), 'ok');
  assert.deepEqual(t.logical.map((x) => x.num), [5, 6]);
  assert.equal(t.slots[0].type, 'extended');              // the first free slot, but logical still count from 5
});

// ── rule 3: the 32-bit limit ──

test('rule 3: with 512-byte sectors MBR reaches 2^32 × 512 B = 2 TiB; past that the 4 TB disk is unreachable', () => {
  const s = fromPreset('four-tb');
  assert.equal(s.sectors, 7814037168);
  assert.equal(s.mbrLimitBytes, 2 * 2 ** 40);
  assert.deepEqual(s.mbr.unreachable, { start: TWO32, end: 7814037167, bytes: 1801763774464 });
  assert.equal(s.mbr.parts[0].end, TWO32 - 1);
  assert.equal(logic.compact(s.mbr.unreachable.bytes), '1802GB');   // ≈ 1.8 TB
  assert.equal(s.gpt.entries[0].end, 7814035455);                  // GPT: the whole disk
  assert.equal(run({ disk: '1TB' }).mbr.unreachable, null);
  assert.equal(run({ disk: '2GiB' }).mbr.unreachable, null);
});

test('rule 3: with 4096-byte sectors the same 32 bits reach 16 TiB, so the 4 TB disk fits', () => {
  const s = run({ disk: '4TB', parts: 1, sector: 4096 });
  assert.equal(s.mbrLimitBytes, 16 * 2 ** 40);
  assert.equal(s.sectors, 976754646);
  assert.equal(s.mbr.unreachable, null);
  assert.deepEqual(s.mbr.clipped, []);
  assert.equal(s.mbr.parts[0].start, 256);                         // 1 MiB of 4096-byte sectors
  assert.equal(s.bytes, run({ disk: '4TB' }).bytes);              // the same disk
});

// ── rule 4: GPT 128 entries, 64-bit ──

test('rule 4: GPT has 128 entries; every requested partition gets one, numbered in order', () => {
  for (let n = 1; n <= 8; n++) {
    const s = run({ parts: n });
    assert.equal(s.gpt.entryCount, 128);
    assert.equal(s.gpt.entries.length, n);
    assert.deepEqual(s.gpt.entries.map((x) => x.num), Array.from({ length: n }, (_, i) => i + 1));
  }
  // 64-bit: no limit within these disks; nothing is cut or missing on GPT
  const s = run({ disk: '4TB', parts: 8 });
  assert.equal(s.gpt.entries[7].end, 7814035455);
  assert.deepEqual(s.gpt.entries.map((x) => x.label), logic.NAMES);
});

// ── rule 5: the backup at the end ──

test('rule 5: the book\'s disk prints 2147MB, and "1GiB 100%" ends at 2146MB because the backup takes the end', () => {
  const s = fromPreset('book-vdb');
  const end = (p) => logic.compact((p.end + 1) * s.sectorSize - 1);
  const start = (p) => logic.compact(p.start * s.sectorSize);
  const size = (p) => logic.compact((p.end - p.start + 1) * s.sectorSize);
  assert.equal(logic.compact(s.bytes), '2147MB');
  const [v, d] = s.gpt.entries;
  assert.deepEqual([v.name, v.label, start(v), end(v), size(v)], ['vdb1', 'vjezba', '1049kB', '1074MB', '1073MB']);
  assert.deepEqual([d.name, d.label, start(d), end(d), size(d)], ['vdb2', 'druga', '1074MB', '2146MB', '1073MB']);
  assert.equal(logic.human((v.end - v.start + 1) * 512), '1023M');
  assert.equal(logic.human((d.end - d.start + 1) * 512), '1023M');
  // MBR, same request: the second one runs to the disk's last sector
  assert.equal(end(s.mbr.parts[1]), '2147MB');
  assert.equal(logic.human((s.mbr.parts[1].end - s.mbr.parts[1].start + 1) * 512), '1G');
});

test('rule 5: a damaged primary header is read from the backup and can be rewritten; MBR has no copy', () => {
  const s = fromPreset('damaged-header');
  assert.equal(s.gpt.primaryOk, false);
  assert.equal(s.gpt.readFrom, 'backup');
  assert.equal(s.gpt.restorable, true);
  assert.equal(s.gpt.entries.length, 2);                  // every partition is still found
  assert.equal(s.mbr.damaged, true);
  assert.equal(s.mbr.readable, false);
  assert.ok(s.warnings.includes('gpt-from-backup') && s.warnings.includes('mbr-lost'));
  const ok = fromPreset('book-vdb');
  assert.equal(ok.gpt.readFrom, 'primary');
  assert.equal(ok.mbr.readable, true);
});

// ── rule 6: the protective MBR ──

test('rule 6: sector 0 of a GPT disk holds one entry of type ee from sector 1 over the disk, up to 2^32 − 1', () => {
  assert.deepEqual(logic.protectiveEntry(4194304), { type: 'ee', start: 1, end: 4194303, sectors: 4194303 });
  const big = logic.protectiveEntry(7814037168);
  assert.equal(big.end, TWO32 - 1);
  const s = fromPreset('old-tool');
  assert.equal(s.gpt.oldTool, true);
  assert.equal(s.gpt.protectiveShort, false);
  assert.ok(s.warnings.includes('old-tool-sees-ee'));
  const t = run({ disk: '4TB', oldTool: true });
  assert.equal(t.gpt.protectiveShort, true);
  assert.ok(t.warnings.includes('protective-short'));
  assert.equal(run({ disk: '4TB', oldTool: true, sector: 4096 }).gpt.protectiveShort, false);
  // the old tool's view changes nothing on the disk
  const a = fromPreset('book-vdb'), b = fromPreset('old-tool');
  assert.deepEqual(b.gpt.entries, a.gpt.entries);
  assert.deepEqual(b.mbr, a.mbr);
});

// ── rule 7: layout numbers ──

test('rule 7: the entry array is 32 sectors of 512 B, first usable LBA 34, last usable = last − 33; partitions from 2048', () => {
  assert.deepEqual(logic.gptLayout(4194304, 512), {
    protectiveAt: 0, headerAt: 1, entriesAt: 2, entrySectors: 32, firstUsable: 34,
    lastUsable: 4194270, backupEntriesAt: 4194271, backupAt: 4194303
  });
  const g = logic.gptLayout(524288, 4096);
  assert.equal(g.entrySectors, 4);
  assert.equal(g.firstUsable, 6);
  assert.equal(g.lastUsable, 524287 - 5);
  const s = run({ parts: 3 });
  assert.equal(s.gpt.entries[0].start, 2048);
  assert.equal(s.mbr.parts[0].start, 2048);
  for (const e of s.gpt.entries) assert.equal(e.start % 2048, 0);
  assert.equal(s.gpt.backupAt, s.sectors - 1);
  assert.equal(s.gpt.backupEntriesAt, s.sectors - 33);
});

// ── how sizes are printed ──

test('sizes print as the tools print them: decimal with 2/1/0 decimals, and binary with one rounded decimal', () => {
  assert.equal(logic.compact(512), '512B');
  assert.equal(logic.compact(17408), '17.4kB');               // GPT's first usable sector, 34 × 512 B
  assert.equal(logic.compact(15e9), '15.0GB');
  assert.equal(logic.compact(1048576), '1049kB');
  assert.equal(logic.compact(4000787030016), '4001GB');
  assert.equal(logic.human(19739631 * 1024), '18.8G');         // the book's vda4 (/proc/partitions: 19739631 blocks)
  assert.equal(logic.human(Math.round(1.96 * 2 ** 30)), '2G'); // 1.96 rounds up to the next whole
  assert.equal(logic.human(Math.round(1.94 * 2 ** 30)), '1.9G');
  assert.equal(logic.human(1024), '1K');
  assert.equal(logic.compact(99960), '100kB');                 // the precision follows the rounded value
  assert.equal(logic.human(2 ** 30 + 161061274), '1.2G');      // 1.150…: half rounds up
  assert.equal(logic.human(2 ** 30 + 160631194), '1.1G');      // 1.1496: three decimals truncated first, then rounded
});

// ── the request ──

test('the request: each new partition takes the second half of the last one; the first from 1 MiB, the last to 100%', () => {
  const d = { bytes: 2147483648, perMiB: 2048 };
  assert.deepEqual(logic.request(d, 1), [{ req: 1, start: 2048, end: null }]);
  assert.deepEqual(logic.request(d, 2), [{ req: 1, start: 2048, end: 2097151 }, { req: 2, start: 2097152, end: null }]);
  const five = logic.request(d, 5);
  assert.deepEqual(five.map((r) => r.start / 2048), [1, 1024, 1536, 1792, 1920]);
  // adding a partition leaves the ones before it where they were; only the last one is split
  for (let n = 2; n <= 8; n++) {
    const a = logic.request(d, n - 1), b = logic.request(d, n);
    assert.deepEqual(b.slice(0, n - 2), a.slice(0, n - 2), `n = ${n}`);
    assert.equal(b[n - 2].start, a[n - 2].start);
  }
  assert.equal(run({ parts: 0 }).n, 1);
  assert.equal(run({ parts: 99 }).n, 8);
  assert.equal(run({ disk: 'nope' }).disk, '2GiB');
  assert.equal(run({ sector: '4096' }).sectorSize, 4096);  // a URL param arrives as a string
});

// ── presets ──

test('presets: the numbers of SPEC.md', () => {
  const five = fromPreset('five-parts');
  assert.deepEqual(names(five.mbr.parts), ['vdb1', 'vdb2', 'vdb3', 'vdb5', 'vdb6']);
  assert.deepEqual(names(five.gpt.entries), ['vdb1', 'vdb2', 'vdb3', 'vdb4', 'vdb5']);
  assert.deepEqual(five.mbr.extended, { name: 'vdb4', num: 4, start: 3670016, end: 4194303 });
  assert.deepEqual(five.mbr.logical.map((l) => [l.ebr, l.start, l.end]), [[3670016, 3672064, 3932159], [3932160, 3934208, 4194303]]);
  assert.deepEqual(five.gpt.entries.map((e) => logic.human((e.end - e.start + 1) * 512)), ['1023M', '512M', '256M', '128M', '127M']);
  const four = fromPreset('four-tb');
  assert.equal(logic.compact(four.bytes), '4001GB');
  assert.equal(logic.compact((four.mbr.parts[0].end + 1) * 512 - 1), '2199GB');
  assert.equal(logic.human((four.gpt.entries[0].end - 2048 + 1) * 512), '3.6T');
  assert.deepEqual(logic.presets.map((x) => x.id), ['book-vdb', 'four-tb', 'five-parts', 'old-tool', 'damaged-header']);
  assert.deepEqual(fromPreset('book-vdb'), logic.compute(logic.defaults));   // the defaults are the book's disk
});

// ── captions and changed regions ──

test('captions: each case has its key and notes', () => {
  assert.equal(logic.captionKey(fromPreset('book-vdb')).key, 'cEnds');
  assert.equal(logic.captionKey(fromPreset('four-tb')).key, 'cUnreachable');
  assert.equal(logic.captionKey(fromPreset('five-parts')).key, 'cLogical');
  assert.equal(logic.captionKey(fromPreset('old-tool')).key, 'cOldTool');
  assert.equal(logic.captionKey(fromPreset('damaged-header')).key, 'cDamaged');
  assert.equal(logic.captionKey(run({ parts: 4 })).key, 'cFour');
  assert.equal(logic.captionKey(run({ disk: '4TB', oldTool: true })).key, 'cOldToolShort');
  assert.deepEqual(logic.captionKey(run({ disk: '4TB', parts: 3 })).notes, [{ key: 'nMissing', n: 1 }]);
  assert.deepEqual(logic.captionKey(run({ disk: '4TB', parts: 5 })).key, 'cUnreachable');
  assert.deepEqual(logic.captionKey(run({ disk: '4TB', damageHeader: true })).notes, [{ key: 'nUnreachable' }]);
  assert.deepEqual(logic.captionKey(run({ disk: '4TB', sector: 4096 })).notes, [{ key: 'n4k' }]);
  assert.deepEqual(logic.captionKey(run({ disk: '1TB', sector: 4096 })).notes, []);
});

test('changed regions: new, moved, renamed and re-typed regions per strip', () => {
  const a = run({ parts: 4 }), b = run({ parts: 5 });
  const c = logic.changedRegions(a, b);
  assert.ok(c.mbr.includes('slot-4') && c.mbr.includes('ext') && c.mbr.includes('part-5') && c.mbr.includes('ebr-5'));
  assert.ok(c.mbr.includes('part-4'));                     // vdb4 became vdb5, inside the extended one
  assert.ok(!c.mbr.includes('slot-1') && !c.mbr.includes('mbr-0'));
  assert.ok(!c.mbr.includes('part-1') && !c.mbr.includes('part-3') && !c.gpt.includes('part-3'));   // made before: unmoved
  assert.ok(c.gpt.includes('ent') && c.gpt.includes('part-5'));
  assert.ok(!c.gpt.includes('bhdr'));
  assert.deepEqual(logic.changedRegions(a, a), { mbr: [], gpt: [] });
  const d = logic.changedRegions(fromPreset('book-vdb'), fromPreset('damaged-header'));
  assert.ok(d.gpt.includes('hdr') && d.gpt.includes('bhdr') && d.mbr.includes('mbr-0'));
  const e = logic.changedRegions(fromPreset('book-vdb'), fromPreset('old-tool'));
  assert.deepEqual(e, { mbr: [], gpt: ['ee'] });
  assert.deepEqual(logic.changedRegions(null, a), { mbr: [], gpt: [] });
});

// ── tests added after the review (mutants that survived) ──

test('other disks: the extended partition ends with its last logical one; 4096-byte sectors reach 16 TiB in sectors', () => {
  const t = run({ disk: '1TB', parts: 5 });
  assert.equal(t.mbr.extended.end, 1953523711);           // the last logical's end, not the disk's last sector
  assert.equal(t.mbr.extended.end, t.mbr.logical[1].end);
  assert.equal(t.mbr.extended.name, 'vdb4');
  const k = run({ disk: '4TB', parts: 1, sector: 4096 });
  assert.equal(k.mbr.reach, 976754646);
  assert.equal(k.mbr.parts[0].end, 976754431);
});

test('the request on 1 TB: boundaries are floored to whole MiB', () => {
  const d = { bytes: 1000204886016, perMiB: 2048 };   // 953869.xx MiB → 953869
  assert.deepEqual(logic.request(d, 3).map((r) => r.start / 2048), [1, 476934, 715401]);
  assert.equal(logic.request(d, 3)[1].end, 715401 * 2048 - 1);
});

test('captions: damage leads over the old tool (with a note); MBR\'s loss is noted under the old tool on 4 TB; same ends', () => {
  const both = logic.captionKey(run({ oldTool: true, damageHeader: true }));
  assert.equal(both.key, 'cDamaged');
  assert.deepEqual(both.notes, [{ key: 'nOldToo' }]);
  assert.deepEqual(logic.captionKey(run({ disk: '4TB', oldTool: true })).notes, [{ key: 'nUnreachable' }]);
  assert.equal(logic.captionKey(run({ disk: '1TB', parts: 2 })).key, 'cEndsSame');
  assert.equal(logic.captionKey(run({ disk: '4TB', sector: 4096 })).key, 'cEndsSame');
  assert.equal(logic.captionKey(run({ disk: '2GiB', sector: 4096 })).key, 'cEnds');
});

test('regions: the hatched unreachable area, the ee entry, EBRs and the metadata extents the bar draws', () => {
  const f = fromPreset('four-tb');
  const mr = logic.regions(f, 'mbr');
  assert.deepEqual(mr.find((r) => r.key === 'unreach'), { key: 'unreach', kind: 'unreachable', start: TWO32, end: 7814037167 });
  const o = logic.regions(fromPreset('old-tool'), 'gpt');
  assert.deepEqual(o.find((r) => r.key === 'ee'), { key: 'ee', kind: 'protective', start: 1, end: 4194303 });
  assert.equal(logic.regions(fromPreset('book-vdb'), 'gpt').find((r) => r.key === 'ee'), undefined);
  const g = logic.regions(fromPreset('book-vdb'), 'gpt');
  const at = (k) => g.find((r) => r.key === k);
  assert.deepEqual([at('ent').start, at('ent').end], [2, 33]);
  assert.deepEqual([at('bent').start, at('bent').end], [4194271, 4194302]);
  assert.deepEqual([at('bhdr').start, at('bhdr').end, at('bhdr').kind], [4194303, 4194303, 'meta']);
  assert.equal(logic.regions(fromPreset('damaged-header'), 'gpt').find((r) => r.key === 'bhdr').kind, 'read');
  const five = logic.regions(fromPreset('five-parts'), 'mbr');
  assert.deepEqual(five.filter((r) => r.kind === 'ebr').map((r) => [r.key, r.start, r.end]), [['ebr-5', 3670016, 3670016], ['ebr-6', 3932160, 3932160]]);
  assert.ok(logic.regions(fromPreset('damaged-header'), 'mbr').filter((r) => r.key.startsWith('part-')).every((r) => r.kind === 'lost'));
});

test('changed regions: adding a partition marks the last one (it shrank) and the new one, not those before', () => {
  const c = logic.changedRegions(run({ parts: 2 }), run({ parts: 3 }));
  for (const w of ['mbr', 'gpt']) {
    assert.ok(c[w].includes('part-2') && c[w].includes('part-3'), w);
    assert.ok(!c[w].includes('part-1'), w);
  }
});

test('restorable and the warnings follow the state', () => {
  assert.equal(fromPreset('book-vdb').gpt.restorable, false);
  assert.deepEqual(fromPreset('book-vdb').warnings, []);
  assert.deepEqual(fromPreset('five-parts').warnings, ['mbr-extended']);
  assert.deepEqual(run({ disk: '4TB', parts: 3 }).warnings, ['mbr-unreachable', 'mbr-clipped', 'mbr-missing']);
  assert.deepEqual(run({ disk: '4TB', oldTool: true }).warnings, ['mbr-unreachable', 'old-tool-sees-ee', 'protective-short']);
  assert.ok(!run({ disk: '4TB' }).warnings.includes('protective-short'));   // only in the old tool's view
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  const s = run({ disk: '4TB', parts: 8, oldTool: true, damageHeader: true });
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ disk: '4TB', parts: 7, oldTool: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['cEnds', 'cEndsSame', 'nOldToo', 'cFour', 'cLogical', 'cUnreachable', 'cOldTool', 'cOldToolShort', 'cDamaged', 'nUnreachable', 'nMissing', 'n4k'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries) assert.ok(preset(e.preset), e.preset);
});
