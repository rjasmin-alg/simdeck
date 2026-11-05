<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-window: specification

Task `docs/tasks/w3/backup-window.md`, catalogue `sto-backup-window` (§4.6). Class **explorer**: the state is a pure
function of the params (`sim.js` `compute`), no steps.

**One concept:** data size vs bandwidth vs backup window; why the first offsite copy goes by truck.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `sizeTB` | range, step 0.1 | 0.5–100 (21.4) | data to copy, decimal TB (10¹² B) |
| `changePct` | range, step 0.1 | 0.1–10 % (1) | share of the data changed per day |
| `linkMbit` | select | 20 / 50 / 80 / 300 / 500 / 1000 / 10000 (1000) | towards the target: the upload of an asymmetric link |
| `efficiency` | range, step 0.05 | 0.5–1.0 (0.8) | share of the nominal speed the copy gets (derived; *(check)* against a measured run) |
| `windowH` | range, step 1 | 4–14 h (12) | the backup window, centred on 01:00 (12 h = 19:00–07:00) |
| `seedBy` | choice | link / truck (link) | how the first full copy travels (deviation: not in the task's list, see NOTES.md) |
| `localMBs` | range, step 50 | 100–1000 MB/s (200) | copy to and from the disks; shown only with the truck lane |
| `driveH` | range, step 0.5 | 0–12 h (2) | the drive; shown only with the truck lane |

`SEED_NIGHTS_MAX` = 3 is a model constant (`compute(p, { seedNightsMax })` overrides it in tests). Out-of-range or
non-numeric params (a URL) are clamped, an unknown link speed or `seedBy` falls back to the default.

## Rules

All times are whole seconds: each transfer is rounded once (`Math.round`), so equal times compare equal.

1. **Transfer time** = bytes × 8 / (link bit/s × efficiency); 1 TB = 10¹² B, 1 Mbit/s = 10⁶ bit/s (task rule 1).
   1 TB at 1 Gbit/s × 1.0 = 8000 s = 2.2 h.
2. **Nightly incremental** = `sizeTB × changePct` bytes (task rule 2; `backup-diff-incr`: the incremental stores
   only what changed).
3. **Fits** when transfer time ≤ window length (task rule 3). The nightly change's overflow = `incrS − windowS` runs
   into working hours (hatched, "!"). The same test on the full copy (`fullFits`) says whether a *nightly full*
   could run.
4. **Seeding over the link** takes ⌈fullS / windowS⌉ nights (at least 1), only inside windows (task rule 4).
   Elapsed link time from the first night's start: (n − 1) × 24 h + the last night's part.
   **Queue:** every day the seeding takes (⌈elapsed / 24 h⌉, by the chosen plan) adds one day's change to a queue.
   After seeding, each night drains `windowS − incrS`: catch-up = ⌈days × incrS / (windowS − incrS)⌉ nights.
   When `incrS ≥ windowS` the queue never drains ("never catches up"); it grows `incrS − windowS` a night.
5. **Truck** = copy out (sizeTB × 10¹² / (localMBs × 10⁶) s) + `driveH` + the same copy in (task rule 5). With
   `seedBy: truck` the first full goes by truck and the queue counts the truck's days; the nightly increments go
   over the link.
6. **Faster plan:** link elapsed ≤ truck → the link (task rule 6: equal → link, no disks to handle). The seeding
   tile's ✗ ("faster by …") needs the chosen plan to be *strictly* slower (`slower`); a tie is ✓ either way. The tile
   gives this verdict only while the truck lane is shown.
7. **Truck lane** appears when seeding over the link needs more than `SEED_NIGHTS_MAX` (3) nights, or when the truck
   is chosen.
8. **Changed** (legend): the page marks a tile when one of these flips after a param change: `fullFits` (full tile),
   `fitsNightly` (nightly tile), `showTruck` or `best` (seeding tile; `best` counts only while the lane is shown),
   catches up ↔ never (queue tile).
9. **Caption:** a nightly change that does not fit wins over every seeding plan (`cIncrOver`; `cIncrNoDay` when its
   overflow is longer than the 24 h − window outside the window); then the truck chosen (`cTruck`); then a full copy
   that fits one window (`cAllFit`), up to three nights (`cFewNights`), more (`cLongSeed`). Catch-up notes only when
   the nightly change fits and the full copy does not.

### Tie-breaks (each has its test)

- Rule 6: equal link and truck time → link (1 TB, 1 Gbit/s × 1.0, 250 MB/s, 0 h drive: 8000 s each).
- Rule 3: a transfer exactly as long as the window fits (90 TB × 2 % at 1 Gbit/s = 14 400 s = 4 h window; 2.1 %
  does not). Same for a full copy (3.6 TB at 1 Gbit/s = 8 h window).
- Rule 4: a full copy of exactly k windows takes k nights, not k + 1.
- Rule 4 (own): `incrS = windowS` fits (rule 3) but leaves nothing for the queue: never catches up, grows 0 a night.
- Rule 7: exactly 3 nights → no truck lane; 4 → lane (16.2 TB vs 16.3 TB at 1 Gbit/s × 1.0, 12 h).
- Rounding: to the nearest second (14 399.1 s → 14 399, fits a 4 h window); a nightly change that rounds to 0 s
  queues nothing (catch-up 0 nights). A truck time of whole days queues that many days (172 800 s → 2).
- Rule 9: an overflow of exactly 24 h − window is still `cIncrOver`.

## Presets and expected numbers (efficiency 1.0)

Sources: DR estate, student side: `handbook/sites.md` (HQ 1000/1000, Brackenridge 300/50, Harrow Street 80/20
Mbit/s), `configs/hq/hq-nas02/shares-and-dumps.txt` (fs-mirror 21.4 TB, vzdump 10.4 TB).

| id | params | expected (checked by `sim.test.js`) |
|---|---|---|
| `hq-to-cloud` | 21.4 TB, 1 %, 1000 Mbit/s, 12 h | full **47.6 h**, 4 nights; nightly 214 GB in **0.48 h**, fits; truck lane shown (4 > 3), catch-up 1 night |
| `brk-uplink` | 21.4 TB, 1 %, 50 Mbit/s, 12 h | full **39.6 days** (951 h), 80 nights; nightly **9.5 h**, fits; at 2 %: 19.0 h, does not fit (+7.0 h); catch-up 306 nights |
| `truck` | as `brk-uplink`, 200 MB/s, 2 h, by truck | copy out **29.7 h**, drive 2 h, copy in 29.7 h = 61.4 h ≈ **2.6 days** (< 3 days); 3 days of changes, catch-up 12 nights |
| `vm-dumps-to-nas` | 10.4 TB, 1 %, 1000 Mbit/s, 12 h | full **23.1 h**: fits no window from 4 to 14 h; nightly 0.23 h fits; 2 nights, no truck lane |
| `never-catches-up` | 5 TB, 2 %, 20 Mbit/s, 8 h | nightly 100 GB = **11.1 h** > 8 h: overflow 3.1 h, never catches up, the queue grows 3.1 h a night |

Numbers checked with a script before the page (`node -e` over `compute`, NOTES.md) and in `sim.test.js`.

## Scene

- Four tiles: first full copy (time, 1 TB at this link, fits one window ✓/✗), nightly change (time, GB, fits ✓/✗
  with the overflow), seeding (nights by link or the truck's time; ✓ when the chosen plan is no slower, ✗ with the
  other plan's time), queued changes (+n nights, or "never" with the growth a night).
- One night from noon to noon: the window band with its clock times; the nightly change (solid) and its overflow
  (hatched, "! +x h", "→" when cut at noon); the first full copy wrapped over its nights (all up to three; past three:
  night 1, "… n more", the last night with its hours). Dimmed when the truck is chosen.
- Link vs truck in days (when rule 7 shows it): the link's seeding bar and the truck lane (dashed; copy out, drive
  dashed, copy in, a van), each followed by its catch-up tail (soft, hatched) or a "→ ∞" tail when it never catches
  up. The chosen plan is tagged.

## Out of scope

Dedup and compression ratios (`dedup-chunking`), WAN acceleration, restore time (RTO, `rpo-rto`), costs.
