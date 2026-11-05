<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ceph-down-out: notes

New stepper (task `docs/tasks/w3/ceph-down-out.md`, catalogue `sto-ceph-down-out`, wave 3). Kit view **K3**
(`Simdeck.blockGrid`) draws the three grids (OSDs by host, every PG, six of osd.0's PGs) and `blockGrid.meter` the
timer and movement bars. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Reusing ceph-min-size.** Its model is not in `models/` (nothing promoted yet). The grid layout, the "rich"
  caption helper and the PG grouping idea are taken from `sims/ceph-min-size/` @ 74e4819 (named in the code). The
  `group(live, size, minSize)` function is not copied: with one OSD of a 3/2 pool a PG can only be clean or degraded
  (never below min_size), and the new state this sim needs (misplaced) depends on CRUSH's target, not on live copies.
  The placement is regenerated, not copied: `tools/gen-placement.mjs` computes the in-set (checked equal to
  ceph-min-size's `hc`) and the set with osd.0 out, with the cephsim engine in `sims/cephsim/`.
- **Only osd.0 fails.** The task's params have no "which OSD"; every preset stops osd.0. The other eleven OSDs are
  always up and in.
- **One item at a time.** Rule 8 gives one fixed rate; the queue drains in order (recovery first, then PG number), so
  PGs turn clean one after another and the 25 / 50 / 100 % steps show 7 / 15 / 30 PGs done. Ceph (and cephsim) runs
  several in parallel; that only changes which PGs are done at a given moment, not the total time.
- **Catch-up size.** cephsim has no PG log, so "small catch-up" needs a number: an assumed 10 MB/s of client writes to
  the pool, spread evenly over the 128 PGs, for the time osd.0 was away (from the stop). Reboot: 0.65 GiB against
  2.7 TiB. It is stated in the explanation ("Model: …") *(assumption)*.
- **Back after out.** Ceph marks a booting OSD that the monitors had marked out automatically back in
  (`mon_osd_auto_mark_auto_out_in`, *check*), so the return puts osd.0 in again. PGs already rebuilt elsewhere are
  copied back in full (backfill): the "data moves twice" of the slow-reboot preset. Unfinished copies are thrown away.
  Whether Ceph can use the log instead for the copy back depends on how far behind osd.0 is; modelled as a full copy
  *(check)*.
- **The fourth zoom column** shows where osd.0's copy goes (dashed queued, hatched copying, solid done), so "CRUSH
  still maps it to osd.0" (down/in: osd.0's cell still in the row) and "CRUSH remaps it" (out: a new OSD in column 4)
  are visible side by side.
- **No Ceph state strings** (`active+undersized+degraded+remapped+backfilling` …) on the page. Ceph calls the copy to
  a brand-new OSD *backfilling* even for a degraded PG, while the task (and cephsim) call any work for a degraded PG
  *recovery*; printing both would contradict the bar. The page uses the task's words, the explanation defines them.
- **Changed marks** on osd.0's cell, the flag badges, the clock, the counts and the zoom's status words; not on PG cells
  (as in ceph-min-size: the kit's changed fill hides the hatch).
- **Every new place is on ceph-01.** With three hosts, size 3 and one copy per host, osd.0's copies can only go to
  osd.1–3; the out caption says so in one sentence (no more: placement rules are `crush-failure-domain`).
- **Legend** is short (8 entries) so the header keeps one row of tools; the dashed outline is one entry for both "OSD
  up but out" and "PG misplaced" (one pattern, two grids). The timer mark (a CSS clock: the page font has no glyph)
  is on the timer labels, not in the legend; recovery / backfill are named next to the bar.
- **The stop is a silent one.** The fresh review pointed out that a cleanly stopped OSD is marked down at once (it
  tells the monitors) and a crashed one on a live host nearly at once (refused connections), so the 20 s grace
  belongs to an OSD that just goes silent. The captions say "stops answering (its disk hangs, or its host loses
  power)", the legend "silent, still up", and the explanation names the other case *(check)*.
- **Concepts, not tools:** Ceph is named (NLA T26); `noout`, `osd_heartbeat_grace`, `mon_osd_down_out_interval` and the
  flag words appear as the subject being taught. No management UI is named.

## Deviations from the task

- **`maintenance-noout` has 5 steps, not 4**: stop, down, timer (600 s pass and nothing happens: the point of
  the preset), return, clean. Merging any two would hide either the held timer or the catch-up.
- **`returnAt` has a 30 min option** (the task's choice is never / 5 / 15 min), so `maintenance-noout` ("down for 30
  min") is a param setting.
- **`action` param added** (stop / drain): the `drain` preset needs a way to mark osd.0 out while up.
- **`slow-reboot`'s 7 steps** include a "moving" step at the midpoint between out and return (no progress mark falls
  in that window at 200 MB/s): stop, down, wait, out, moving, return, clean.
- **The "wait" step** is halfway through the interval (320 s for 600 s); the task names a wait without a time.
- **State shape**: see SPEC.md "State" (no `raw`/`down` from ceph-min-size; `timers`, `totals` and `zoom` added).
- **Legend**: "timer (clock icon)" and the recovery / backfill bar swatches are not legend entries (see Decisions).

## Sources

- cephsim `js/engine/recovery.js` (`planRecovery`, `Recovery`), `js/engine/pgmap.js` (`pgState`, `mapPool`),
  `js/compile.js`, `js/samples.js` `hyperconverged` (in `sims/cephsim/`, copied from `~/projects/cephsim`). Read and
  run (the generator).
- `sims/ceph-min-size/` (`sim.js`, `index.html`, `placement.js`, `NOTES.md`) @ 74e4819. Read.
- DR estate, student side: `configs/hq/hqc/ceph-df.txt` (37.88 % raw used), `ceph-osd-tree.txt` (osd.0 7.27739;
  osd.22 down with reweight 0, i.e. already out), `scenarios/S2.md`. Read. The instructor side was not opened.
- Ceph documentation "Configuring Monitor/OSD Interaction" (`osd_heartbeat_grace` 20 s, `mon_osd_down_out_interval`
  600 s, `mon_osd_auto_mark_auto_out_in`), "Placement Group States", "Operating a Cluster" (`noout`) *(check: from
  memory, no network in this session)*.

## Checks

- Numbers printed from the model before the page was written (all five presets, plus the 30 min return without
  noout and a partly finished recovery), asserted in `sim.test.js`. The CRUSH claim (30 PGs, one copy each, nothing
  else moves) is checked by a test over all 128 PGs.
- **Fresh review** (a separate agent: every SPEC number recomputed, the CRUSH claim re-checked against
  `placement.js`, all 432 parameter combinations swept for contradictions, new mutations). Fixed from it: the drain's
  stop now runs the heartbeat grace (marked down 20 s after the stop, as SPEC says; the code had both in one instant)
  and its down→out timer reads "not needed" to the end; durations no longer read "10 h 60 min"; the grace rule's
  realism (above); the Croatian explanation's grammar ("degradirani su, ali …", "sprječava") and the first plural
  of `osdMeta`; a return after every PG was rebuilt no longer says "0.00 GiB thrown away" (`capReturnOutNone`);
  stale comments. Thirteen mutations it found surviving (no cap on moved bytes, the timer's start, the drain's stop
  flags and timers, catch-up start, copy-back source, the log flag, changed marks, `fmtTime` rounding, the drain's
  times, the noout tie) now fail tests.
- **Mutations**: 18 one-at-a-time mutations of `sim.js` (grace value, down not degraded, the return/out tie, a
  progress mark at the return kept, no moving step, backfill before recovery, PG order reversed, drain as recovery,
  noout ignored, an item done one early, no wasted bytes, rebuilt PGs not copied back, catch-up counted from the down,
  the rate ignored, the wait time, the timer not cancelled, the wrong target OSD, drain leaving osd.0 in), plus the
  review's thirteen: all 31 fail a test.
- Every preset walked step by step in both languages at 1920×1080 with a local Playwright script: no stage overflow,
  no console errors; captions read for each step.
- `npm run gate -- ceph-down-out`, screenshots reviewed (light, dark, grayscale, 375×812, both languages).

## Term pairs

Not in `kit/glossary.js`; written out by hand (`*down*` → `<em lang="en">` in captions, the Croatian term in
parentheses at first mention). For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| down / up (OSD) | pao / radi | task *(check)* |
| out / in (OSD) | izbačen / unutra | task gives *uključen* for in *(check)*; the page says *unutra* ("still in"), which reads better in a sentence |
| recovery | oporavak | task |
| backfill | popunjavanje | task *(check)* |
| rebalancing | preraspodjela | task *(check)* |
| heartbeat | otkucaj (signal života) | task *(check)* |
| maintenance flag | zastavica za održavanje | task |
| misplaced (PG) | na krivom mjestu | this sim |
| drain (an OSD) | pražnjenje | this sim |
| placement group | grupa smještaja | as ceph-min-size |

## Shared requests

- **Models:** `ceph-min-size`'s placement and grouping and this sim's timeline / plan are candidates for one
  `models/ceph-pg.js` (the in-set is identical; this sim adds the out-set for osd.0). Nothing copied needs promoting
  today: the shared part is data (`placement.js`), generated by both sims' tools from the same engine.
- **K3 `blockGrid`** (same as ceph-min-size): a changed mark that does not hide a cell's pattern.
- **Kit controls:** a `choice` with three short options wraps in a half-width grid cell; the page sets
  `flex-wrap: nowrap` and smaller padding for its rate control. A compact choice variant would help.
- **Kit legend:** a timer / clock swatch.

## Time

Started 03:48, done 04:17 (about 30 minutes, one session, including the fresh review and its fixes).
