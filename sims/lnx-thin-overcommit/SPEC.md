<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-thin-overcommit: spec

One concept: **promised vs real space: thin volumes promise more than the thin pool holds, and when the pool fills,
it fills under every volume.** Task: `docs/tasks/w3/lnx-thin-overcommit.md`; catalogue `lnx-thin-overcommit` §4.4,
overlap §5.2.

## Scene

- One thin pool in a volume group (VG). The pool is a grid of 1-GiB cells (`pool` cells, default 100), each free or
  owned by the thin volume that first wrote into it. Each autoextension is an added group of rows labelled with its
  percentage. The VG's free space (`vgFree`) is the only place autoextension can take space from.
- `n` thin volumes `thin1` … `thin4`, each with the same virtual size `virt` GiB. Each has a filesystem.
- Below the pool: a Data% meter of the pool (threshold tick when autoextend is on), a meter of what is promised against
  the pool (overcommitted: a dashed danger end), and one bar per thin volume over its virtual size: what its
  filesystem uses, what it deleted but the pool still holds, the writes that were refused, and the promised but
  unbacked rest.

State (derived, `compute(p)`): `{ pool: { size, size0, used, pct, cells }, vgFree, lvs: [{ name, virt, want, written,
refused, deletedInFs, discarded, allocated, fsUsed, fsFree, dataPct, kept }], extended: [{ from, to, by, at }], short,
promised, overcommit, warned, full, refused, firstRefused: { lv, at, free }, mode: 'queue'|'error', autoextend,
threshold, extPercent }`; `pool.kept` lists the cells behind thin1's deleted, undiscarded blocks.

The task's `pool.meta` (metadata usage) is left out: pool metadata is out of scope (task "Out of scope").

## Rules

1. **A thin volume's size is virtual; a pool cell is allocated only when a block is first written.** Creating the
   volumes allocates nothing; each first write of a 1-GiB virtual block takes the lowest free pool cell; writing a
   block the volume already holds takes nothing (rule 5). (lvmthin(7) "Thin Provisioning".)
2. **The sum of virtual sizes may exceed the pool (overcommit); LVM warns but allows it.** `overcommit = n · virt /
   pool × 100`, against the pool as created; `warned` when `n · virt > pool`. The page shows a translated warning line,
   not the tool's text. (lvcreate warning "Sum of all thin volume sizes … exceeds the size of thin pool …"
   *(check)*: from memory, not in lvmthin(7).)
3. **Pool Data% = allocated / pool size × 100; a volume's Data% = its allocated cells / its virtual size × 100.**
   (lvs(8) `Data%` *(check)*.)
4. **Deleting files does not return pool cells unless the filesystem discards them.** Right after thin1's writes its
   filesystem deletes `deleted1` GiB (its oldest blocks, at most what it wrote). Its filesystem now shows them free.
   With `discard` off the pool still holds them (`kept`); with `discard` on (`fstrim`, or the `discard` mount option)
   the cells are freed, and later volumes reuse them (lowest free cell first). (lvmthin(7) "Discard".)
5. **Pool full: a write that needs a new cell fails for every thin volume**, including one whose filesystem shows
   plenty of free space; a write to a block the volume already holds still works (`write()` → `'rewrite'`). Default
   (`errorwhenfull n`): the write is queued for up to 60 s, waiting for the pool to grow, then fails; with
   `--errorwhenfull y` it fails at once. Reading goes on. The picture shows the same refused amount in both modes; the
   badge (clock or ✕) and the caption say which. The caption quotes the refused volume's filesystem free space at
   the moment of the first refusal (`firstRefused.free`). Rewrites working is block-level (dm-thin); a filesystem that
   gets write errors usually goes read-only, which the caption and explanation add. (lvmthin(7) "Data space
   exhaustion": "queue writes for up to 60 seconds (the default)", corruption warning; dm-thin `no_space_timeout`,
   kernel thin-provisioning.rst *(check)*.)
6. **Autoextend:** after each block, when autoextend is on and Data% **exceeds** `threshold` (strictly: at exactly
   the threshold nothing grows; compared as `used · 100 > threshold · size`), the pool grows by `ceil(size · percent /
   100)` GiB (lvextend rounds up to whole extents; here an extent is drawn as 1 GiB) if the VG has that many free;
   otherwise it does not grow at all (all or nothing, as `lnx-lvm-extend` and `lnx-lvm-snapshot`). The first failed
   attempt is recorded (`short`) for the caption. (lvmthin(7) "Automatic extend settings": "whenever a pool exceeds
   70% usage, it will be extended by another 20%"; lvm.conf(5) `thin_pool_autoextend_threshold` "when its usage
   exceeds this percent", `thin_pool_autoextend_percent` "in percent of its current size", minimum threshold 50, 100 =
   off; needs dmeventd monitoring, which polls *(check)*. Newer lvm2 may grow by more, enough to get under the
   threshold, and may extend partially: *(check)*, not modelled.)
7. **Tie-break: writes are applied in volume order** (all of thin1's, then thin2's, …), one 1-GiB block at a time;
   so the last volume in the list is the one that hits the full pool. A simplification of concurrent writers: real
   writers interleave and any of them can be the one refused. thin1's deletion (rule 4) comes right after thin1's
   writes, before thin2 writes. The autoextend check runs after each block (and after the discard).

Also: `threshold` and `percent` are clamped (50–100, 1–100) so a bad URL value never gives NaN; a volume's request is clamped to its virtual size (`w_i ≤ virt`; the page's slider max is `virt`): a filesystem
cannot hold more than its volume. `deleted1 ≤` what thin1 wrote.

## Params

`pool` 50–200 step 10 GiB (100); `n` 1–4 (3); `virt` 10–100 step 10 GiB (50, same for each); `w1`…`w4` 0–`virt`
GiB (20 each); `autoextend` (off); `threshold` 50–95 step 5 (70); `percent` 10–50 step 10 (20); `vgFree` 0–100 step
10 GiB (0); `deleted1` 0–min(50, `w1`) GiB (0); `discard` (off); `errorWhenFull` (off).

## Presets (numbers from `compute`, checked by a script and by the tests)

| Preset | Params | Expected |
|---|---|---|
| `overcommit-ok` | pool 100, 3 × 50, writes 20/20/20 | promised 150 (150 %), pool 60 %, each volume 40 %, nothing refused |
| `one-tenant-fills` | pool 100, 3 × 50, writes **50/40**/20 | promised 150 %; pool 100 % after 10 of thin3's 20 GiB; thin3 refused 10, its filesystem shows 40 GiB free; queued 60 s, then error |
| `autoextend` | pool 100, 3 × 50, writes 40/40/50, autoextend 70 % / +20 %, VG free 50 | 100 → 120 at **71** GiB (VG 30) → 144 at **85** GiB (VG 6); at 101 GiB Data% 70.1 % > 70 again, needs 29 GiB, VG has 6: no growth; all 130 GiB fit (pool 90.3 %) |
| `deleted-not-returned` | pool 100, 3 × 50, writes **50/40**/0, thin1 deletes 30 | pool 90 % (thin1 still holds 50, Data% 100 %, its filesystem uses 20); with discard: 60 % (thin1 40 %) |
| `error-at-once` | `one-tenant-fills` + errorWhenFull | as `one-tenant-fills`, the refused writes fail at once |

Deviations from the task's numbers: the task's writes 70/20/20 and 70/20/0 do not fit 50-GiB volumes (a filesystem
cannot hold more than its volume), so three presets write **50/40** instead: the same totals, the same pool numbers,
and the task's caption ("thin3 believes it has 40 GiB free") word for word. `autoextend` grows at 71 and 85 GiB, not 70
and 84 (rule 6: "exceeds"), and needs 29 GiB, not 28.8 (whole GiB). Every caption number comes from the model.

## Captions

One main sentence (`captionKey`): `cFullQueue` / `cFullError` (refused writes and the pool full now: the first volume
refused, its filesystem's free space then, the wait), `cWasFullQueue` / `cWasFullError` (writes were refused, but
thin1's discard gave space back since), `cFullExact` (full, but promised = pool and every volume is at its size),
`cFullNow` (pool exactly full, nothing refused yet), `cNoOvercommit` (promised ≤ pool: it can never fill), `cFits`
(overcommitted, everything fits). Notes after it: `nAlsoRefused` (other volumes refused too), `nRewrite` (rewrites
still work, the filesystem goes read-only; left out when other notes follow), `nKept` / `nDiscarded` (rule 4),
`nGrew`, `nGrewShort`, `nShort` (rule 6).

The banner and the promised meter compare the promise with the pool as it is now (grown); `overcommit` and `warned`
use the pool as created, when LVM warned (rule 2).
