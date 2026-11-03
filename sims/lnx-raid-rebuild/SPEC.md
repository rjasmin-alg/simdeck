<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-raid-rebuild: SPEC

One concept: **a long rebuild, an unreadable sector, a lost array.** RAID 5 survives a failed disk, but not always
the rebuild: the rebuild reads every surviving disk in full, takes hours (more under load), and an unrecoverable read
error (URE) or a second failure in that window has nothing left to be rebuilt from.

Task: `docs/tasks/w3/lnx-raid-rebuild.md`. Catalogue §4.4, overlap §5.3 (RAID levels and parity live in `raid-cache`;
they are taken as given here and linked from the explanation).

## Sources

- **UL ch12** `~/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Redundantno polje
  diskova" and "Šire o temi": RAID 4/5 keep working when one device fails; RAID 6 survives any two; `/proc/mdstat`
  layout (`resync … speed=201344K/sec`); citing md(4) and mdadm(8).
- **md(4)**: RAID 5 degraded has no redundancy; RAID 6 survives two failed devices; recovery onto a spare; the bad block
  list ("BAD BLOCK LIST") lets md record an unreadable block instead of failing the device *(check)*.
- **Kernel `Documentation/admin-guide/md.rst`**: `/proc/sys/dev/raid/speed_limit_min` (default 1000 KiB/s) and
  `speed_limit_max` (default 200000 KiB/s); a rebuild is throttled toward the minimum while other I/O runs *(check)*.
- **md driver `status_resync`** (`drivers/md/md.c`): the bar `x = per_milli / 50` `=`, `>`, `20 − x` dots; per mille
  printed `%3u.%u`; `finish` = remaining blocks / speed in whole seconds, printed `rt / 60` `.` `(rt % 60) / 6` min. Same
  code as in `lnx-mirror-not-backup`, where it reproduces the book's line exactly.
- **Vendor datasheets**: non-recoverable read errors "1 per 10¹⁴ bits read" (desktop), "1 per 10¹⁵" (enterprise),
  stated as a maximum *(check)*.
- **DR S13** `~/projects/dr-lecture-estate/student/scenarios/S13.md` (pfx-fs1's RAID6 marks a second and then a third
  disk failed during a rebuild; the volume goes offline) and `student/inventory/hosts.csv` (pfx-fs1: 16× 6 TB RAID6,
  ≈ 76 TB usable, 58 TB used). Student material only; nothing from `instructor/`.
- **ossimulator `docs/specs/12-raid-cache.md` §3.5**: rebuild one row at a time (here a band); status words disk ok /
  failed / rebuilding, array optimal / degraded / rebuilding / failed.

## Model

`n` disks `sda…` (4–16) of `sizeTB` each, and one spare (`sd` + the next letter). Each disk is drawn as 10 bands of 10 %
of its capacity. State (`sim.js`):

`{ level, n, disks: [{ name, status: 'ok'|'failed', why: null|'fail'|'ure' }], spare: { name, status:
'spare'|'rebuilding'|'in'|'stopped', bands: [null|'ok'|'lost'] × 10 }, band, progress, hours, bitsRead, nextUre,
ures: [{ disk, band, result: 'fixed'|'lost'|'abort' }], lostStripes, aborted, failedAt, array, parityLeft, mdstat,
pSoFar, i, ev }`

**Step 1** fails disk `sdc` (index 2) and md starts recovery onto the spare at hour 0. **Steps 2–11** rebuild band
1–10: (a) scripted later failures that fall in the band, (b) the read of the band from every surviving disk and any URE
in it, (c) the write to the spare, the clock to the end of the band. Steps stop when the array fails.

### Numbers

| Quantity | Formula |
|---|---|
| band bits | `sizeTB × 10¹² / 10 × 8` |
| band hours | `sizeTB × 10¹² / 10 / (speed × 10⁶) / 3600` |
| rebuild hours | `10 × band hours` = size / speed |
| planned bits | `(n − 1) × sizeTB × 10¹² × 8` |
| P(≥ 1 URE) | `1 − e^(−planned bits / rate)` |
| parity left | `(level − 4) − failed disks + (spare in ? 1 : 0)` |
| md speed | `floor(speed × 10⁶ / 1024)` K/sec; device size `sizeTB × 10¹² / 1024` KiB |

### Where UREs fall (seed)

The number of bits read until the next URE is exponential with mean `rate`: `X₁ = −ln(1 − u₁) · rate`, `X₂ = X₁ −
ln(1 − u₂) · rate`, …, with `u` from mulberry32(`seed`) (the generator of `Simdeck.rng`), two draws per URE: the gap,
then `v`, which picks the disk among those alive when it is reached (`alive[floor(v · alive.length)]`). A URE falls in
the band whose cumulative bits read pass it. This makes P(≥ 1 URE in B bits) exactly rule 3's `1 − e^(−B/rate)`, and the
same seed with a ten times better rate puts the URE ten times further away (so `raid5-ure` and `raid5-enterprise` share
seed 18).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Rebuilding one disk reads all of every surviving disk: bits read = (n − 1) × size × 8. Each band reads its 10 % from every disk alive in that band (after a second failure in RAID 6, one disk fewer). | ossim-raid-cache §3.5; md(4) recovery |
| 2 | Rebuild time = size / rebuild speed; each band advances the clock by a tenth. md keeps the speed between `speed_limit_min` 1000 KiB/s and `speed_limit_max` 200000 KiB/s; under load it is throttled toward the minimum (here 50 MB/s as "under load", 200 MB/s idle = 195312 K/sec ≤ 200000). | md.rst *(check)*; ch12 `speed=201344K/sec` |
| 3 | P(≥ 1 URE) = 1 − (1 − 1/r)^bits ≈ 1 − e^(−bits/r), r from the datasheet (10¹⁴ desktop, 10¹⁵ enterprise). These are worst-case specifications, not measured rates: the page says so (card note, explanation). | datasheets *(check)* |
| 4 | With no parity left (RAID 5 degraded, RAID 6 with two failed) a URE cannot be corrected. `onUre = abort`: the rebuild stops, the disk with the read error is marked failed, the array is failed. `onUre = badblock`: the band is marked bad on the new disk (`lost`), `lostStripes + 1`, the rebuild goes on. | md(4) bad block list *(check)*; controller behaviour *(check)* |
| 5 | RAID 6 with one disk failed still has one parity: a URE is corrected (`fixed`) and the rebuild goes on. | ch12 "Šire o temi"; md(4) |
| 6 | A failure beyond the parity fails the array: a second failure in a RAID 5 rebuild, a third in a RAID 6 rebuild. A second failure in RAID 6 leaves parity 0: the rebuild goes on, a URE after that falls under rule 4. | md(4) levels, as cited in ch12 |
| 7 | **Tie-break:** a failure and a URE in the same band: the failure is applied first (so the URE meets the reduced parity; in RAID 5 the array is already failed and the band is not read). | task file |

### Further tie-breaks

- A failure at exactly the end of a band (hour = b × band hours) belongs to band b.
- Later failures (`later`) hit disk `n − 1`, then disk 0; one that falls after the rebuild has ended is not applied (the
  last caption says the array would survive it).
- A URE falls on a disk alive when it is reached, never on a failed disk or the spare.
- When the rebuild stops mid-band (failure or abort), the clock and progress stop at that point
  (`hours = band start + fraction × band hours`), and the band is not written.
- After the array fails, a further step changes nothing (`steps()` stops there).
- `/proc/mdstat`: the slot being recovered shows `_` until the last band is written; the first failed disk stays listed
  with `(F)` (it was not removed); the spare shows `(S)` until recovery starts; the recovery line exists only while
  rebuilding. A failed array is still printed `active` with its `[n/m]` *(check: md's exact text for a failed array)*.
- All presets, steps and outcomes come from the model; nothing is scripted per step.

## Presets (expected numbers; derived, the task's "unchecked" values reproduced)

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `raid5-ure` (default) | RAID 5, 4 × 4 TB, 200 MB/s, 1e14, abort, seed 18 | 7 | 9.6 × 10¹³ bits, P = 61.7 % (62 %), 5.56 h; URE on sdb in band 6 (50–60 %) at 2.94 h, progress 52.9 % → abort, `[4/2] [U__U]`, failed |
| `raid5-enterprise` | same, 1e15 | 11 | P = 9.15 % (9 %); the seed's URE would be at 10× the bits: none; done at 5.56 h, `[4/4] [UUUU]` |
| `raid6-ure` | RAID 6, else as default | 11 | URE on sdb in band 6, `fixed`; done at 5.56 h; array blocks 2 × 3906250000 |
| `under-load` | RAID 5, 50 MB/s, later h15, seed 4 | 8 | 22.2 h window; seed 4 places no URE within 9.6 × 10¹³ bits; sdd fails at hour 15 (band 7: 13.3–15.6 h) → failed at 15 h. Same params at 200 MB/s: done at 5.56 h, the failure comes after |
| `pfx-fs1` | RAID 6, 16 × 6 TB, 1e15, 50 MB/s, later h18-32, seed 7 | 11 | 7.2 × 10¹⁴ bits, P = 51.3 % (51 %), 33.3 h; URE on sda in band 1 `fixed`; sdp fails at 18 h (band 6), parity 0, the rebuild goes on reading 14 disks; sda fails at 32 h (band 10) → failed. 14 × 6 TB = 84 TB ≈ 76.4 TiB, the inventory's "≈ 76 TB usable" |

Task deviations: default seed 18, not 7 (see NOTES.md); the rebuild speed for `pfx-fs1` and the failure hours 18 / 32
are chosen (S13 gives no times).

## Params

`level` 5 | 6 (5); `n` 4–16 (4); `sizeTB` 4 | 6 | 12 (4); `speed` 200 | 50 MB/s (200); `ureRate` `1e14` | `1e15`
(`1e14`); `onUre` `abort` | `badblock` (`abort`); `later` `none` | `h15` | `h18-32` (`none`): scripted later failures,
added to the task's list so the presets' second and third failures are parameters, not hidden script; `seed` 1–99 (18).
All `resets: true`. Out-of-range values fall back to the default or the bound (`norm`).

## Out of scope

RAID levels and XOR (`raid-cache`), declustered or distributed spares, scrubbing before a failure
(`lnx-zfs-self-heal`), SSD failure modes, a URE on the disk that is being replaced (it is gone).
