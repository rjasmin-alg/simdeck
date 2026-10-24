<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rpo-rto: notes

New explorer (task `docs/tasks/w2/rpo-rto.md`, catalogue `dr-rpo-rto` §4.6, wave 2b). No kit view fits (a timeline
with brackets and stacked phase bars is none of K1–K4), so the page draws its own SVG, measured in CSS pixels after
layout (1:1, no viewBox; every label is measured with `getComputedTextLength`), redrawn by a `ResizeObserver`.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **Minutes, not hours.** Every duration in the model is whole minutes from Monday 00:00 of a calendar week (`week`,
  a day number). The task writes the phase params in hours with 0.5 h steps; 5 h 40 min (S3) and 32 h 30 min (S12)
  need a 10-minute grid, so detection moves in 10 min and the other phases in 30 min. Targets stay in hours.
- **Real dates.** The presets come from scenarios in different weeks (S1 Thursday 26 Nov, the backup history's
  Sunday 1 Nov, S3 Monday 9 Nov, S15 Wednesday 2 Dec), and preset 2's point is a date ("from 13 September"). A hidden
  `week` param (a Monday's day number) set by each preset gives the stage its calendar; dates are computed without
  `Date` (`civil`, days-from-civil inverse, tested on 1970-01-01, a leap day and the presets). The incident slider
  shows weekday and time only (its label does not follow a preset's week change); the stage shows full dates.
- **A recovery point's time is its start** (the copy is a snapshot of the data at the start: the estate's job runs
  in snapshot mode, 01:40 → archive complete 01:52). It is usable only when it was **completed**: under an outage a
  copy still being written when the system stopped is `unfinished`; under damage the system runs on, so a copy started
  before the damage completes and is good. This is the "+ the time a point takes to complete" of the task's rule 2: worst case =
  interval + job time, mean = interval / 2 + job time (exact for a uniform incident time; the task's "≈ half").
  Preset 2's last good point is therefore 13 Sep **01:40** (the task: "01:52", the archive's file time); the 49 days
  hold either way.
- **`jobMin`, `failedRuns`, `replica`, `kind` are params the task does not list.** Preset 2 needs failing runs
  (49 nights, 14 Sep – 1 Nov), rule 2 needs the job time, preset 5 needs a replica, and "replication gives RPO 0 for
  a disk failure and no recovery point for this incident" needs the two kinds of incident: `loss` (the system stops)
  and `damage` (it runs on with the damage). Under `damage` copies keep being taken until detection ends and are all
  ✗ (rule 4 made visible); under `loss` none is taken after the incident.
- **Replica rule** (SPEC rule 5): under `loss` the replica stops with the system, at the incident, good when nothing
  was damaged before (RPO 0); under `damage` it follows the damage to the end of detection and is never good.
- **Caption choice lives in `sim.js`** (`captionKey`), pure and tested branch by branch, first that applies: replica
  damaged, failed copies skipped, detection alone over the RTO target, damaged copies, unfinished copy, replica good,
  else both numbers. The task's en caption is used for `failed` with the interval's wording ("Backups every night,
  but the last one that restores is from 13 September, 01:40: 49 days 12 h 25 min of data lost."); the hr caption for
  `detect` ("… Ovdje je samo otkrivanje trajalo 32 h 30 min, a cilj je 8 h." — the task: "32,5 sata").
- **Axis break.** When the last good point is far back (preset 2: 49 days; the 7-day interval), the axis shows a
  piece around the last good point and a piece from the RPO target to the service-back line at **one scale**, with a
  break between them labelled with the time left out and the number of bad points in it. Otherwise one piece.
- **Drag the incident** along the line (the red handle); the slider does the same. Pointer moves are tracked on
  `window` with the scale from the start of the drag, since every change redraws the SVG.
- **"Changed"** is the yellow highlighter on a bracket's verdict word when it flipped with the last change (task's
  legend).
- **Legend** has ten items (good point, bad point, replica, incident, the four phases, target, changed); it wraps to a
  second line in the header at 1920×1080, as the header's subtitle does.
- **Panel:** settings in two columns, the two choices with their label inline, short slider values (`5:40 h`), and
  the settings group's reset button hidden (CSS): an explorer's transport bar holds the same reset with the same `R`
  key, and without the copy the panel fits at 1920×1080 in both languages at every preset. At extreme values (all
  sliders near their maxima) two labels wrap and the panel scrolls by about 19 px.
- **Phone:** verdicts on two lines, labels kept inside the plot; the plot is 34 rem tall.
- **Concepts, not tools:** no product names on the page. The estate's job and log are only in Sources here. Hosts and
  shares are not named either; preset hints give the scenario facts (times, what happened).
- `related`: `backup-diff-incr` (merged). `restore-drill`, `retention-gfs`, `backup-window`, `site-failover` (named in
  the task) do not exist yet.
- Tags: `disaster-recovery`; topic `storage`; level `advanced` (the task's). All exist in `tags.json`.

## Deviations from the task

- **Ransomware preset (4):** the task says "the nightly copy taken after 02:10 is not good (rule 4); last good point
  is the previous night". The scenario gives no copy between 02:10 and 07:50 (the estate's nightly job is at 01:40), so
  the preset uses **a copy every hour**: the six copies 02:40 … 07:40 and the replica ("hq-fs01's Z: drive (the NAS
  mirror) shows the same", S3) carry the encryption, and the last good copy is the night's 01:40, before the logon:
  RPO 30 min. The hourly schedule is this page's, not the estate's. *(Owner: keep, or another schedule?)*
- **Presets 1 and 5 assume a good 01:40 copy** in late November and December, although the estate's backup history
  shows that job failing since 14 Sep (preset 2). Each preset is one lesson, not the estate's state.
- **What the incident is with earlier damage:** `damageBefore` moves only the damage's start (copies after it are bad);
  the incident stays when the service failed, and the time down and detection run from it (SPEC rule 3, the
  explanation says so).
- **Durations in minutes** and the 10/30-minute grids (see Decisions); "32,5 sata" written as "32 h 30 min".
- **Point time = start**, so preset 2's last good point reads 01:40, not 01:52.
- **Four extra params** (`jobMin`, `failedRuns`, `replica`, `kind`) and a hidden one (`week`).
- **Phase labels:** restore is "vraćanje" in Croatian (the task: "oporavak / vraćanje"), so it does not collide with
  "oporavak" in the RPO/RTO names.

## Sources

- DR estate, student side only: `student/scenarios/S1.md` (Thu 2026-11-26 14:05), `S3.md` (Mon 2026-11-09, logon
  02:10, found 07:50, the mirror shows the same), `S12.md` (UPS tripped Sat 23:40, found Mon 2026-11-30 08:10),
  `S15.md` (Wed 2026-12-02 16:40 → gone from all three DCs by 16:55); `student/logs/hqc/vzdump-2026-11-01.log` (job
  start 01:40, archive per guest a minute later; the 13 Sep archives are complete at 01:52 per
  `configs/hq/hq-nas02/shares-and-dumps.txt`); `student/logs/hqc/vzdump-history.txt` (OK to 2026-09-13, every job
  failed 2026-09-14 → 2026-11-01). `configs/hq/hqc/pve/jobs.cfg` says `schedule 01:00` while the log starts at 01:40;
  the task's 01:40 is used.
- `uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`: definicija „točka oporavka" (the explanation's wording),
  „proba oporavka", Primjer 6 (two questions: how much work you may lose → spacing of points; how long a fault may go
  unnoticed → how far back), used in the explanation's last paragraph.
- RPO / RTO: the standard BC/DR definitions (RPO: the point in time to which data must be recovered; RTO: the time
  within which a service must be resumed after an incident) as in ISO 22300 vocabulary *(check: not read here, no
  copy at hand)*. Rule 1 (actual RPO against the newest good point) and rule 3 (RTO from the incident, including
  detection) follow the task.
- Croatian terms: *recovery point objective* — ciljna točka oporavka, *recovery time objective* — ciljno vrijeme
  oporavka (the task; not in the course books) *(check)*.

## Term pairs

From the glossary: *recovery point* — točka oporavka, *restore test* — proba oporavka (UL ch23). Missing from
`kit/glossary.js`, written out in both tables:

| en | hr |
|---|---|
| recovery point objective (RPO) | ciljna točka oporavka *(check)* |
| recovery time objective (RTO) | ciljno vrijeme oporavka *(check)* |
| replica | replika |
| detection / decision / restore / verification | otkrivanje / odluka / vraćanje / provjera |
| ransomware | ucjenjivački softver *(check)* |

## Shared requests

- **Glossary:** add the RPO and RTO pairs above with `"src": "simdeck"` (then the explanation can use `[[…]]`).
- **Kit (optional):** a param's `format` is not re-run when another param changes, so a value label cannot depend on
  a second param (here: the incident's date on the week). Not blocking; the slider shows weekday and time.
- **Kit (optional):** an explorer has the reset button twice (settings group and transport bar); a def flag to drop
  the settings copy would replace this page's CSS hiding it.

## Questions for the owner (for `docs/tasks/OPEN.md`)

- Ransomware preset: an hourly copy (this page's, none in the estate) so that copies after 02:10 carry the
  encryption: keep, or another schedule?
- The Croatian terms for RPO and RTO (the task's, not in the course books).

## Checks

- Numbers printed from the model before the page was written and compared with the task's expected results (SPEC.md
  table): all equal (12 h 25 min / 6.5 h; 49 d 12 h 25 min; detection 32.5 h; 30 min with the replica ✗; 15 h with
  the replica ✗, RPO 0 for a loss).
- **Mutations** with a script, one at a time (38, before the fresh review's fixes): the good/unfinished/damaged tie-breaks and order, failed runs
  ignored or off by one or always after the incident, the damage start, the newest-run rounding, copies after the
  incident (none, until service back, strict at detection end), the replica (position, good under damage, ignoring
  the damage start, never preferred), strict targets, worst case and average, RTO without detection or from the damage
  start, loss from the damage start or to the copy's completion, no spacing point, skipped counts, caption order (4),
  weekday, day threshold, negative days, the anchor, the presets (4), a default. **37** fail a test; the 38th is a
  no-op control. Re-run after the fixes with the new `classify` (41: start vs damage tie, unfinished at the incident,
  for both kinds, against S, none; the replica-and-copies caption; preset 4 daily): all but the control fail a test. One redundant condition found this way was removed (`captionKey`'s `!rtoMet`: detection over the
  target implies it).
- Browser: every preset in hr and en at 1920×1080, dark, the 15-minute and 7-day intervals, damage before the
  incident with hourly copies, the phone at defaults, preset 2 and a missed RPO. No console errors. Fixed from the
  screenshots: the panel 247 px too tall, phase labels overlapping (now a staircase whose leaders cross no label), the
  service-back label over the bars, the highlighter mis-measured, day labels under the incident handle, target
  labels clipped at the edges, the phone's verdict labels off-screen, "≠" missing from the font.
- `npm test`, `npm run check` and `npm run gate -- rpo-rto` (51/51 browser checks) pass; gate screenshots at
  1920×1080 light, dark, grayscale and 375×812 in hr and en reviewed.
- **Fresh review** (a separate agent read the task, SPEC, model, tests, strings and page, rendered edge cases and ran
  its own mutations). Fixed from it: dragging the incident did not move the marker (the axis re-centred on every
  change; it is now frozen during a drag); the `unfinished` rule contradicted "data time = start" (a copy started
  before the damage was lost under damage and a finished copy was called unfinished; now `unfinished` is only a copy
  still being written when the system stopped, and a run at the moment of an outage is unfinished, not damaged); the
  preset 5 hint said "every copy" for the replicas; the replica caption said "the last copy" (now "the last good
  copy", and a caption naming the damaged copies too); preset 4 now shows rule 4 with copies (hourly); the meaning of
  the incident with earlier damage is in the SPEC and the explanation; the plural `unfinished` caption; preset names
  equal to the `sim.json` entries; "ishod se promijenio"; "sinkrona replika"; tests for the surviving mutations
  (`after` at the boundary, failures after the incident, `replicaGood` with failed runs, the replica's position with
  detection 0, worst case with a job longer than the interval, every preset's date, weekday and RTO). Noted, not
  changed: phase labels may cross the service-back and target lines; on the phone the incident label can cross the
  red line.
- Not checked: a real projector and a lecturer at the page; ISO 22300 wording.

## Time

Start 2026-10-24 08:02, done 08:35 (CEST), one session, including the fresh review and its fixes.
