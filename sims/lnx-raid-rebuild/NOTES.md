<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-raid-rebuild: notes

New stepper (task `docs/tasks/w3/lnx-raid-rebuild.md`, catalogue `lnx-raid-rebuild` §4.4, overlap §5.3), drawn on kit
view **K3: block grid** (`kit/blockgrid.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Everything from the model.** No per-step script: each preset is a set of params, and the outcome (where the URE
  falls, when the array fails, how many steps) comes from `sim.js`. Steps: 1 (the failure) + one per band, fewer when the
  array fails; `steps()` runs the model to find out.
- **UREs from the seed by the exponential law.** The bits read until the next URE are exponential with mean `rate`
  (two mulberry32 draws per URE: the gap and the disk). This gives rule 3's probability exactly, lets several UREs happen
  (badblock, large arrays), and keeps one seed meaningful across rates: the same seed at 10¹⁵ puts its URE ten times
  further away, so `raid5-ure` and `raid5-enterprise` differ only in the rate, as the task says.
- **Later failures are a parameter** (`later`: none / after 15 h / after 18 h and 32 h; disk n − 1, then disk 0), not
  in the task's param list. It makes `under-load` a real comparison: the same failure hour at 200 MB/s comes after the
  rebuild is done, and the caption says so.
- **Scene.** Top left: the `md0` lines of `/proc/mdstat` (the "Personalities" and "unused devices" lines left out for
  height), changed tokens highlighted. Below: one block grid, columns = disks, a hole, the spare; first a state row
  (`U`, `F`, the spare `S` → `↻` → `U`, `✕` when stopped; one character so 16 disks fit) whose aside is the array state
  and the recovery percentage; then the 10 bands. The count box is `[n/m] [map]`. Right: a card with the clock (hours
  since the failure), the window of vulnerability (a meter over the rebuild time, the speed and its load, the parity
  left) and the read errors (bits read of planned, P over the whole rebuild, P so far, UREs so far, and the note that a
  datasheet rate is an upper bound, rule 3).
- **Cell kinds.** Healthy band: `fill` c1. Failed disk: `dead` (crossed) for the whole column, `F` in the state row.
  Spare: `ghost` until written, `soft` c2 (striped) in the step it is written, then `fill` c2 (the task's "striped, then
  solid"); a lost stripe `bad`. URE: ⚡ on the source disk's cell, `fill` when corrected, `bad` when not. The band of
  this step: a span (outline) over the disk columns. Array failed: the grid at 45 % opacity and "✕ The array is lost" in
  the grid header (the task's "whole grid greyed"; in its own line it pushed the stage past one screen).
- **"Changed" marks** go on the spare's band written this step, the URE cell of this step, a disk's state cell when its
  status changed, the spare's state cell while it rebuilds, the array state word when it changed, and the count box and
  mdstat tokens that changed. A failed column's cells are not marked (a whole yellow column hid the cross).
- **Abort marks the disk with the read error failed** (`[4/2] [U__U]`): md without a bad-block log fails a member on a
  read error it cannot repair, and that is why the array is failed. Hardware controllers vary *(check)*.
- **A band with a lost stripe** is drawn `bad` on the spare as a whole cell. The cell is 10 % of the disk and only one
  stripe (a few hundred KiB) is lost; the caption says "only that stripe is lost".
- **Settings in two columns** (page CSS on the kit's control group). Eight params, five presets and the explanation did
  not fit the panel at 1920×1080 (1178 px for 828). Paired controls use compact selects with short option labels
  (`200 MB/s`, `10¹⁴`, `prekini`); "idle / under load" and "desktop / enterprise disk" appear on the card instead.
- **Captions** are kept to two lines at 1920×1080 in Croatian: the URE odds are in step 0's caption, several UREs in
  one band are one counted sentence, and the last step's "done" sentence replaces the band sentence. Checked by walking
  every step of every preset (and a 16 × 12 TB badblock run) in both languages: stage, panel and page never scroll.
- **Names on the page:** md, `/proc/mdstat` and `speed_limit_min` / `speed_limit_max` are the subject (NLA T24, UL
  ch12). "Many controllers" stays generic. `pfx-fs1` is the estate's host name from student material (S13, hosts.csv);
  its OS and monitoring product are not named.

## Deviations from the task

- **Default seed 18, not 7.** With the exponential placement, seed 7's first draw puts the URE in band 1, not at 60 %.
  Seed 18 puts it in band 6 (50–60 %); seed 7 serves `pfx-fs1` (a corrected URE early, none after the second failure).
  `under-load` uses seed 4 (no URE at all at 10¹⁴, so the idle comparison completes).
- **`raid5-ure` stops at 53 %, not 60 %:** the URE is in the 50–60 % band, at 2.94 h. The caption gives the real
  percentage ("Obnova je na 53 %…"); otherwise it is the task's caption.
- **`pfx-fs1` speed and times are mine:** 50 MB/s (a delivery week, under load), second failure after 18 h, third after
  32 h (S13 gives neither). Step count 11 as the task says.
- **New param `later`** (above). **Task legend "array failed (whole grid greyed)"** is drawn but has no swatch: the
  header says it in words.
- **State words:** "degradirano" (task), where `lnx-mirror-not-backup` uses the book's "oslabjelo".

## Unchecked *(check)*

- md.rst: `speed_limit_min` 1000 and `speed_limit_max` 200000 KiB/s defaults, and throttling toward the minimum under
  load. 50 MB/s "under load" is illustrative.
- Datasheet rates 10¹⁴ / 10¹⁵ and that they are stated as maxima.
- md(4) bad block list: md records the block and continues the recovery; without it, the member with the read error is
  failed. Hardware controllers that abort: "many", not measured.
- `/proc/mdstat` text for a failed RAID 5/6 (`active` with `[4/2]` is what the model prints) and the device numbers
  after recovery (`sde[4]` stays 4 while taking slot 2).
- *window of vulnerability* — razdoblje ranjivosti; *unrecoverable read error* — nepopravljiva greška čitanja (task: check).

## Term pairs (missing from `kit/glossary.js`)

- unrecoverable read error (URE) — nepopravljiva greška čitanja *(check)*, written out in step 0's caption
- window of vulnerability — razdoblje ranjivosti *(check)*, the card's heading
- stripe — pruga: the glossary has it only as "strip / stripe — traka / pruga", so the page writes `*stripe* (pruga)`
- spare disk — rezervni disk (the glossary has *hot spare* — vruća rezerva; the page says "rezervni disk")
- degraded — degradirano (the glossary has *degraded mode* — degradirani rad)

Used from the glossary: rebuild, parity.

## Shared requests

- **K3 block grid:** a way to grey a whole grid (failed array) and a per-column state (a failed disk) would replace the
  page's opacity rule and the hand-made state row. Small: an optional `state: 'failed'` on the spec and `colState[]`.
- **Kit panel:** a two-column layout for controls (`layout: 'pairs'` or a `half: true` per param). The page does it
  with its own CSS on `[data-sd-controls] > .sd-group`, which depends on the kit's markup.

## Sources

See SPEC.md "Sources": UL ch12, md(4), mdadm(8), kernel md.rst, md driver `status_resync`, vendor datasheets, DR S13 and
inventory (student material only), ossimulator spec 12 §3.5.

## Review

A fresh reviewer (a subagent given only the files) swept 57,024 param combinations (levels, n 4/5/8/16, all sizes,
speeds, rates, onUre, later, seeds 1–99): no crash, no impossible state (progress in 0..1, the clock never runs back or
past the total, bits read never exceed the plan, no recovery line on a failed array). It made 79 deliberate breaks of
the rules, tie-breaks, preset numbers and mdstat text: 60 were caught, 4 were equivalent. The 15 real misses (abort and
failure stopping mid-band: clock, bits, band not written, spare stopped, event flags; `(S)` and the recovery line in
mdstat; the bar off a 5 % mark; the seed fallback; the parity clamp) now have tests, and each was broken again and seen
to fail. It also found, all fixed:
- `pfx-fs1` (and any RAID 6 with abort): "the next URE loses a stripe" after the second failure is false under abort;
  now two variants
- "runs with no parity left" after a RAID 6 rebuild that still misses one disk (parity is 1): now "one parity short"
- "idle, the rebuild would have been done before this failure" when the idle run would itself hit a URE: now shown only
  when the same params at 200 MB/s end alive
- RAID 5 with failures after 18 h and 32 h, both after the rebuild: the caption now says the second would end it
- P between 99.5 % and 100 % printed as "100 %"
- the abort URE cell drawn as "lost stripe"; now ⚡ on a plain band (the lost stripe is on the spare)
- the explanation named raid-cache without linking it; Croatian "jedan kvar više", the term pattern in step 0's
  caption, the `raid5-ure` hint, an unused string
Not taken: a legend entry for the state-row marks (`S`, `↻`, `F`): it wrapped the Croatian legend to a second line and
pushed the panel past one screen. The state row's aside says the state in words.

## Timing

Started 2026-11-03 21:48 CET, done 22:20 CET: about 32 minutes (plus the reviewer's 7 minutes in parallel).
