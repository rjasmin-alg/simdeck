<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-working-at-height: notes

Task `docs/tasks/w3/set-working-at-height.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer.

## Decisions

- **No floor plan to reuse.** The task's soft dependency, `set-cable-runs-exits` (the hub of the floor-plan model,
  catalogue §5.25), is not built yet and nothing is in `models/`. The page needs very little of a floor plan: one
  route under the work spot, a circle where things land and a round zone. That stays in the page's drawing (`planView`)
  and in three pure functions of `sim.js` (`landR`, `inZone`, `zoneFactor`); when the floor-plan model exists, the
  route and the zone can move onto it. Nothing copied.
- **Explorer with a seeded week.** The task says "drop something at random moments and count the hits" and the class
  is explorer. The model draws a week of candidate drops from the seed alone (three kinds, each a Poisson process at
  its highest rate), and every control decides what happens to the **same** drops (thinning for the access, then the
  tether, the toe board, the zone). So switching a control compares the same week with and without it, and the
  counts are not noise. "Another week" (key N) moves the seed on; "on average" (the expected hits, rule 11) is shown
  beside the week's count so a lucky or unlucky week does not mislead.
- **"Someone under it" is a chance, not walking figures.** Simulating walkers explicitly gives hits too rare to show in
  a demo (a few seconds of each crossing inside a 0.6 m strike circle). The model uses the share of the time someone is
  under the work spot (5 / 20 / 40 %), which is what the concept needs (more people below, more hits), and draws the
  people in the side view as decoration that follows the traffic and the zone.
- **Three kinds of drop, so each control has its own job.** From the hand (the tether catches it), knocked off where it
  was put down (the toe board of a platform or a lift stops it; from a ladder it falls) and while handed up or down
  (nothing on the item stops it, only the zone). Without the third kind, a platform and a tether would leave nothing to
  fall and the zone would look unnecessary; with it, preset 5 shows that the controls are layered.
- **The zone's size matters.** Things land in a circle of radius 0.5 + 0.3·h (illustrative) around the point below. A
  closed zone smaller than that circle leaves the hits outside its tape, where people walk right up to it (preset 3).
  Tape alone halves the share inside (people still cut through, preset 4).
- **Training is a gate, not a number.** "Ladders and lifts used only by those trained for them": with the toggle off the
  worker does not go up and the page says why, instead of inventing an accident rate for untrained people. Applied to
  all three accesses (a platform tower is built and used by trained people too).
- **The worker's own fall** is shown as energy (80 kg·g·h: 1570 J at 2 m) and what stops it (nothing on a ladder, rails
  on a platform, rails and a harness in a lift), not as a probability. Preset 6 and the caption at ≤ 3 m carry "even
  2 m is not low"; the explanation says "rails and harnesses come before speed".
- **Energy bands (10 J, 100 J) are made up** and labelled so on the stage ("made-up bands") and in the explanation.
  They anchor the concept's "enough to injure badly without a hard hat" (59 J falls in the middle band) and add
  "dangerous even with a hard hat" above 100 J (the lamp from 6 m, 147 J), so no band reads as safe. A hard hat is not a
  param (PPE, the last layer; the concept lists the other controls).
- **Controls**: two columns where they fit; the three-way choices, the toggles and the zone take the whole width. The
  "another week" button sits on the stage (week card), the kit's settings reset is hidden (the transport bar's R does
  the same); both keep their keys. Masses are in the "Holding" label, the options are the names only, to fit 1920×1080.
- **Lift = "košara" on the page** (the basket of a lift; Croatian crews and the public say "autokošara"), "podizna
  platforma" in the explanation; platform = "skela" on the page, "skela s ogradom" in the explanation. *(check)*
- **No real case.** Catalogue §4.14 lists `set-working-at-height` under "No fitting documented case known"; no
  "Na temelju / Based on" line.
- **Not added to `docs/tasks/OPEN.md`**: the gate's scope rule allows only this folder; the owner's questions are below
  and in the report.

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list: *key grip*, *gaffer* (foot line), *video village* (plan note: "video villagea"),
*brifing*. Not on the list, so *(check)* with the colleague who trains crews:

- *ljestve* (ladder), *skela* / *skela s ogradom* (platform with rails), *košara* / *podizna platforma* (lift)
- *rubna letva* (toe board), *alat na uzici* / *uzica* (tether), *ograda* (guard rail), *pojas* (harness, "pojas
  zakvačen u košari")
- *stega* (clamp: crews may say "klema" or "clamp"), *ključ* (spanner), *reflektor* (lamp)
- *zona ispod*, *zatvorena zona*, *samo traka* (exclusion zone, closed, tape only)
- *osposobljen* / *osposobljavanje za rad na siguran način* (training for safe work, named in the explanation without
  an article number)
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- Directive 2009/104/EC Annex II §4 (work at height: collective protection before personal; ladders only for low-risk,
  short use) and Directive 89/391/EEC (general principles of prevention): cited from memory, not read on EUR-Lex for
  this page; no figure from them is on the page.
- The Croatian rules for ladders, platforms and lifts and the training to operate a lift (catalogue §4.14): the
  Zakon o zaštiti na radu (Narodne novine) and its rulebooks on work at height and on work equipment; names, numbers and
  current amendments not checked. The page names only the law and "training for safe work", without articles.
- Film and TV safety guidance on work at height and dropped objects (regulators' and industry committees'): not read;
  nothing from it on the page.
- Every rate, share, mass and radius is illustrative (the page says so in the foot line and the explanation): drops
  1.5 / 1.0 / 0.5 / 0.25 per hour, 20 hours of work above in the week, the shares 5 / 20 / 40 %, tape halving the share,
  R(h) = 0.5 + 0.3·h, the worker 80 kg, the items 0.5 / 1 / 2.5 kg, the bands 10 J and 100 J.

## Numbers check

An independent script (Python, written from SPEC.md apart from `sim.js`, with its own mulberry32) gave the same
energies, falls, expected hits and seed-1 counts for all six presets (ladder 58.86 J, 9.0, 49/49/6; zone 0, 49/49/0;
small 5.172, 49/49/3; taped 4.5, 49/49/3; layers 1.0, 41 dropped / 20 caught / 12 stopped / 9 landed / 3 hits; low
19.62 J, the worker's fall 1569.6 J). v at 6 m 10.85 m/s (39 km/h); a spanner from 10 m 49.05 J, the lamp 245.25 J.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: toe board / rubna letva;
tether / uzica; exclusion zone / zona ispod; harness / pojas.

## Shared requests

- None for `models/`. When `set-cable-runs-exits` builds the floor-plan model, this page's route and round zone could
  move onto it (the zone is a circle around one point; the route a straight band).

## Learn tree

Suggested leaf (catalogue §4.14 outline): `film-set` → `loads` "Stativi, tereti i visina" / "Stands, loads and
height" → `height`.

## Review

A fresh reviewer (a separate agent, given the task, SPEC.md and the code, not this file) found the model matching every
rule and tie-break, recomputed every preset number with its own script from SPEC.md (all agree), and ran 73 deliberate
breaks (58 caught). What changed:

- SPEC.md: the seed-1 counts were only in the tests; now in the presets table. The day of a drop and how booleans and
  non-numbers are cleaned are now rules 11 and 12.
- Real test gaps, now tested (each break re-run and caught): the five days and the last-day cap (`dayOf`), the
  landing direction (x, y from 2π·a), the exact traffic shares, a non-number height or radius, the presets' full params.
  The rule-10 tie-break test asserted on a constant; the hit is now its own function (`isHit`) and its tie is tested,
  including inside the tape (0.4 × 0.5 = 0.2).
- Unused outputs removed (`hitsOutside`, `hitsTape`, `counts.inside`, `hitsBy`; the per-drop `inside` stays and is
  tested); unused strings removed (`kind_*`).
- Equivalent survivors (no input tells them apart): `band` with `>` instead of `>=` (differs only at exactly
  boundary − EPS), `t > HOURS` instead of `>=`, the sort's tie-breaks (times never tie across kinds and rise strictly
  within one; the test is now named as a property), `hitsTape` counted in a closed zone (no hits there).
- Page: "twice the mass, likewise" (not "the same"); hr "tjedan ispuštenih predmeta"; the small-zone caption no
  longer says "outside the tape" for a closed zone and says "can hit" (it shows in weeks with no hits); tape gives
  "fewer hits, not none" (halving holds only when the tape covers the whole circle); the fall stops read "rails
  against the fall" (not "the rails stop it"); a closed zone's caption says "which nobody entered while it was kept
  closed".

## Time

Started 2026-11-13 07:53, done 2026-11-13 08:15, including a fresh review (about 22 minutes).
