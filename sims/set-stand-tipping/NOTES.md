<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-stand-tipping: notes

Task `docs/tasks/w3/set-stand-tipping.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer, the hub of the forces-and-moments model (catalogue §5.25).

## Decisions

- **The statics model is its own file**, `statics.js`, registering `SimdeckModels['set-statics']`: weight, the wind's
  push (½·ρ·Cd·A·v²), a tripod's feet and tipping edges, the restoring moment of a weight about an edge, the balance,
  the critical wind speed, the lean angle and a centre of gravity's height. Pure, no strings, tested on its own block in
  `sim.test.js`, so the coordinator can promote it to `models/set-statics.js` unchanged. `set-working-load` and
  `set-manual-handling` can reuse `weight` and the moments, `set-weather-lightning` `windForce`.
- **A real tripod, not a 2D lever.** The model computes the moment about each of the three edges between two feet and
  takes the weakest edge facing the push; the side view is its projection and the inset from above shows which edge.
  That is what makes "the load over a leg" come out right: the edge is then r from the column along the push, against
  r/2 with the load between two legs, so the stand's own weight holds twice as much (preset 1). A 2D lever would have
  had to assume it.
- **"A sandbag on the leg under the load": what the physics says, and what the page says.** The concept lists a bag on
  the leg under the load among the things that move the balance back. It does, but statics does not single that leg
  out: a weight holds by its distance from the tipping edge, and the leg under the load lies on (or next to) the edge.
  With the load over a leg, one bag holds the same on any leg (the stand then tips over the edge through the bagged
  leg); with two or more bags, or with the load between two legs, bags on the legs away from the load hold more
  (preset 5, then "back leg"). Crew guides say to bag the leg under the load, close to the column, so that the bag hangs
  from the leg instead of resting on the floor, where it holds nothing until the stand has already lifted; some crews
  bag the back legs (web search, 2026-11-13, see SPEC.md Sources). The page shows the true statics and frames the crew
  rule by its reason: the "wrong" bag in its main contrast is a bag **on the ground** (preset 5), and the explanation
  says crews put it on the leg under the load, close to the column, hanging free. **For the owner**: if the colleague
  teaches "the leg under the load" as the only right leg, the page will disagree in the "back leg" case; I kept the
  physics.
- **The riser and the centre of gravity.** On level ground the height of the centre of gravity does not change the
  restoring moment (weights act straight down). The concept says raising the riser "lifts both the centre of gravity and
  the lever": the lever is the wind's (F × h, presets 3 and 4); the centre of gravity shows as the lean angle, how far
  the stand can lean before it falls by itself (11.8° at 4 m against 20.9° at 2 m for preset 4). Said so in the
  explanation.
- **The head's weight off-centre is split exactly**: the head's weight counts once on the column (restoring, with the
  stand's) and its offset as a couple W·d (overturning), as the concept frames it. The net moment equals the moment of
  the head at its real position (checked by the independent script).
- **The grip holding the column** is a fixed 120 N at 1.2 m (144 N·m), named in the panel and the parts, and the
  caption says it counts only while they hold on and the frame comes down. No "hold it and it's safe".
- **The day's wind limit** is a param (default 8 m/s) and applies to flags and frames only. Two misconceptions in the
  captions: above the limit frames come down even while this stand holds (preset 6), and a stand can tip below the
  limit (presets 3 and 4: "the limit does not promise that a stand holds").
- **Gusts**: the wind slider is labelled "Gust", a speed; the page models it as a steady speed (no dynamic kick) and
  says so.
- **Controls in two columns** (as `ceph-min-size`), no hints, the leg reach as a slider in cm (0.45–0.75 m): ten
  controls had to fit the 1920×1080 panel in both languages. The kit's settings reset button is hidden (the transport
  bar's R does the same).
- **No real case.** Catalogue §4.14 lists `set-stand-tipping` under "No fitting documented case known"; no "Na temelju
  / Based on" line.
- **Not added to `docs/tasks/OPEN.md`**: the gate's scope rule allows only this folder; the owner's questions are
  below and in the report.

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list: *grip*, *key grip* (declined: "gripa"), *brifing* in the foot line. Not on the list,
so *(check)* with the colleague who trains crews:

- *stativ* for a stand, *vreća s pijeskom* for a sandbag (the catalogue's title asks "check whether crews say stand
  and sandbag")
- *zastavica* for a flag, *okvir* for a frame *(check: crews may say "flag" and "frame")*
- *izvlačenje stativa* / *visina glave* for the riser *(check: "riser"?)*
- *glava* for what sits on top (lamp, flag, frame), *stup* for the column, *noga* for a leg
- *rub prevrtanja* (tipping edge), *moment prevrtanja* (overturning moment), *moment stabilnosti* (restoring moment),
  *težište* (centre of gravity) *(check the engineering terms with a Croatian mechanics text)*
- *udar vjetra* for a gust, *granica dana* for the day's wind limit
- *reflektor 2 kW* for the lamp (as in set-circuit-load)
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- Cd = 1.2 for a flat plate face-on (Hoerner gives about 1.17 for a square plate; 1.1–1.3 for others), from memory.
- ρ = 1.25 kg/m³ and EN 1991-1-4's ½·ρ·v² pressure, from memory (the standard is paid).
- Crew practice for sandbags (the leg under the load, close to the column, hanging free; some crews bag the back legs):
  secondary web sources only, listed in SPEC.md.
- Film and TV safety guidance on wind limits for frames: not read; the page gives no figure as a rule (the 8 m/s
  default is a slider value, illustrative).
- Directive 2009/104/EC, 89/391/EEC and the Zakon o zaštiti na radu: not named on the page.
- Every mass, area, reach, height and limit is illustrative (the page says so in the foot line and the explanation):
  stand 14 kg, lamp 10 kg, flag 1.5 kg, frames 4 and 7 kg, bag 15 kg, the grip's 120 N at 1.2 m, the stand's centre of
  gravity at 0.4 × the riser, a bag a quarter of the way out on a leg.

## Numbers check

An independent script (Python, written apart from `statics.js`/`sim.js`: 3D moments r × F about each edge axis through
two feet, the head as a weight at its real offset plus a compensating pair, bags at their plan positions) gave the same
overturning and restoring moments, ratio and verdict for all six presets and the variants in SPEC.md (arm 78.48 /
52.97; flag 29.77 / 157.45; big frame 357.21 / 189.82; riser 211.68 / 172.17; ground 97.20 / 52.97, with the bags on
the load-side legs 119.19 and on the back leg 185.41; limit 393.66 / 546.82; two bags over a leg on the load leg 238.38,
on the back legs 304.60).

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: overturning moment / moment
prevrtanja; restoring moment / moment stabilnosti; centre of gravity / težište; tipping edge / rub prevrtanja.

## Shared requests

- **Promote `statics.js` to `models/set-statics.js`**, with the "statics" block of `sim.test.js`; then point this sim
  at it. Later sims (`set-working-load`, `set-manual-handling`, `set-weather-lightning`) take it from there.

## Learn tree

Suggested leaf (catalogue §4.14 outline): `film-set` → `loads` "Stativi, tereti i visina" / "Stands, loads and
height" → `stands`. The `loads` node does not exist yet in `learn.json`; this is its first sim.

## Review

A fresh reviewer (a separate agent, given the task, SPEC.md and the code, not this file) recomputed every preset number
with its own script from SPEC.md (all agree within 0.01; one rounding slip in preset 6's breakdown, fixed: 154.51 +
3 × 82.77) and ran 80 deliberate breaks. Survivors and what changed:

- `critOverLimit` with `>=`: the limit tie went untested. Now one helper, `above(v, limit)`, for both limit
  comparisons, with an exact tie test.
- `tips` computed without EPS (`>=`): now killed by a tie through `derive` (a lamp 98.1 N at 0.6 m against 235.44 N
  × 0.25 m, both 58.86 N·m). A plain `>` still survives: it is equivalent for every input the page can reach (an
  exhaustive search over the params' grid at no wind found no case with 0 < overturning − restoring < 1e−9).
- The hand added to the lean angle, ground bags counted in the centre of gravity, preset params drifting (limit, the
  bags' place, their number): new tests for each; the presets are now compared with SPEC.md's table.
- Equivalent survivors (no input tells them apart): `v·v` → `v·|v|`, the orientation ternary rewritten, the snap of
  tiny normals to 0, `nx > 0` → `≥ 0`, `dist > 0` → `≥ 0`, dropping the `onLeg` filter in the restoring sum (a ground
  bag carries no weight).

Page fixes from the review: the explanation now says plainly that a bag farther from the edge holds more (the back
leg, with the load toward a gap) and presents the crews' practice as going with the load turned over a leg; the
grip's line no longer shows for a lamp and reads "it buys time to lower the frame"; "it would tip … below the day's
limit" no longer clashes with "it stands"; "the centre of gravity's height" (not the centre of gravity) leaves the
restoring moment unchanged; hr "Može se nagnuti" (not "Smije", which reads as permission); "twice as far, measured in
the wind's direction"; the legend lists the overturning and restoring parts and the tipping drawing; "frames and flags
should already be down".

## Time

Started 2026-11-13 06:31, done 2026-11-13 06:58, including a fresh review (about 27 minutes).
