<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-working-load: spec

Task `docs/tasks/w3/set-working-load.md` (catalogue §4.14). One concept: **hanging hardware is rated with a working
load limit well below its breaking strength (the safety factor), because wear, a sudden stop and uneven loading eat
into the margin; a load that drops a short way before the line catches it pulls many times its own weight; two lines
holding one load at an angle each carry more than half of it, more as the angle opens, and the whole weight each at
120 degrees; the chain is as strong as its weakest piece; rigging is set and checked by riggers and grips only, and
everyone else walks around it, never under it.**

Class: explorer (no steps). The state follows from the params at once. Builds on the forces-and-moments model of
`set-stand-tipping` (catalogue §5.25): `rigging.js` copies its `G`, `EPS` and `weight()` (from
`sims/set-stand-tipping/statics.js @ a3f3f1a`, not yet in `models/`) and adds line tension, the jolt of a drop and a
line as a chain of pieces, pure and promotable; the lamps, the pieces and the presets are in `sim.js`.

## Scene (one fictional production, a studio with a pipe grid)

A lamp hangs below a pipe of the grid, on one line or on two lines that meet at the lamp. Each line is three pieces,
from the top: a clamp on the pipe, a steel sling, a shackle at the lamp. Below the lamp, a zone on the floor that
nobody walks through; a crew member walks around it. All masses, ratings and stiffnesses are illustrative.

| Thing | Value | Note |
|---|---|---|
| 2 kW lamp | 10 kg | the same lamp as in `set-stand-tipping` |
| 5 kW lamp | 20 kg | default |
| 10 kW lamp | 35 kg | |
| clamp | WLL 150 kg, breaks at 750 kg | |
| steel sling | WLL 100 kg, breaks at 500 kg | the weakest rated piece |
| shackle | WLL 250 kg, breaks at 1250 kg | |
| safety factor | 5 for every rated piece | real hardware uses different factors by type and standard *(check)* |
| a line's stiffness | 100 kN/m (1 mm per 100 N) | soft for steel; a stiffer line catches harder |
| weaker link: small shackle | WLL 25 kg, breaks at 125 kg | rated, marked for less |
| weaker link: worn sling | still marked WLL 100 kg, breaks at 200 kg | wear took 60 % of its strength |
| weaker link: hook with no rating | no WLL, breaks at 100 kg | nobody knows: 100 kg is the page's guess |

## State (from `derive(params)`)

```
{ params (cleaned), lamp: { id, m }, w, n, angle, tStatic, stiff, stretch, factor, stopIn, tPeak,
  lines: [{ id, pieces: [{ id, wll, breaking, swapped }], wll, breaking, weakest, weakestLabel, force, share, margin,
            state }],
  falls }
```

Newtons, metres, N/m; the page shows forces as kilograms of pull (N ÷ 9.81) with the newtons beside. The model holds
no words.

## Rules

`rigging.js` (the shared model, rules 1–5):

| # | Rule | Source |
|---|---|---|
| 1 | **Weight** W = m·g, g = 9.81 m/s² (copied from `set-statics`). | standard |
| 2 | **Line tension at rest.** n equal lines, symmetric, angle θ between the two: each line's vertical part carries W/n, so each pulls T = W / (n·cos(θ/2)). One line: T = W (the angle does not apply). Two lines: θ = 0° → W/2 each; 60° → 0.577 W; **120° → W each**; 150° → 1.93 W; 160° → 2.88 W. | statics: equilibrium of the hook point; standard sling-angle tables *(check)* |
| 3 | **The jolt of a drop.** The hanging catches vertically with stiffness K_v = n·k·cos²(θ/2) (small stretch); at rest it stretches δ = W / K_v. A load that falls d before the line goes taut is stopped at the bottom of the catch with the pull **T_peak = T · (1 + √(1 + 2d/δ))** (energy: W·(d + x) = ½·K_v·x², no damping), after stretching x = δ·factor. **Tie-break:** d = 0 is a lamp lowered gently onto the line, factor exactly 1 (not the 2 of a load let go on a line that is just taut). | energy balance of a mass on a linear spring (any mechanics text); fall factor in rope access and fall arrest *(check)* |
| 4 | **A line is a chain** of pieces from the top. Its working load limit is the **least** of its pieces' (none if any piece has none); its breaking strength is the least of its pieces' real breaking strengths. `weakest`: the piece that breaks first; `weakestLabel`: the piece with the least marking (a piece with none first). **Tie-break:** within 1e−9 counts as equal and the first piece from the top wins. | "a chain is as strong as its weakest link" |
| 5 | **A line's state** under its pull: `breaks` above its breaking strength; else `unrated` if it has no WLL; else `over` above the WLL; else `ok`. **Tie-breaks:** exactly at the WLL is within it (`ok`); exactly at the breaking strength holds (both within 1e−9). | the definitions |

`sim.js` (the lamp and the lines, rules 6–10):

| # | Rule | Source |
|---|---|---|
| 6 | **Lamps, pieces, the safety factor, the stiffness** as in the table above. A rated piece breaks at SF × its WLL. | illustrative |
| 7 | **The weaker link** goes into **line A** only (the only line, or the left one of two): a small shackle or a hook replaces the shackle; a worn sling replaces the sling and keeps its marking (100 kg) while it breaks at 200 kg. Line B is always the three rated pieces. | the concept |
| 8 | **Params are cleaned:** an unknown lamp, line count or link falls back to the default; `angle` and `drop` are clamped and rounded to their steps. | robustness |
| 9 | **The pull** in each line: rule 2 at rest, times rule 3's factor for the drop. With one line the angle is 0. Both lines of a pair pull the same (symmetric). | rules 2–3 |
| 10 | **Each line** against its chain (rule 4): `share` = pull / WLL (none when unrated), `margin` = breaking / pull, `state` (rule 5). The lamp **falls** when any line breaks (what the other line then takes, the swing and the second jolt, is not modelled). | rules 4–5 |

Simplifications (the explanation says so): the lamp hangs still and the lines are weightless and straight; a drop is
caught by the lines' stretch alone (no damping, no give in the pipe or the lamp; a real catch is a little softer or
much harder); two lines are symmetric and equally long; a worn piece is a fixed 40 % of new; a line breaks at its
weakest piece exactly at its breaking strength.

Out of scope: how to rig, sling, choose or inspect hardware (the riggers' and grips' work; no method appears); what a
falling lamp does below (`set-working-at-height`); stands and sandbags (`set-stand-tipping`); uneven sharing between
lines of different length.

## Params

| Key | Type | Range / options | Default |
|---|---|---|---|
| `lamp` | select | l2 (2 kW, 10 kg), l5 (5 kW, 20 kg), l10 (10 kW, 35 kg) | l5 |
| `lines` | choice | one, two | one |
| `angle` | range | 0–160°, step 5 (shown only with two lines) | 60 |
| `drop` | range | 0–20 cm, step 1 | 0 |
| `link` | select | rated, small, worn, unrated (into line A) | rated |

## Presets and expected numbers (checked independently, `NOTES.md` "Numbers check")

| # | Preset | Differs from defaults | Expected | Contrast to try |
|---|---|---|---|---|
| 1 | `single` | (none) | 20 kg on a line rated 100 kg: 20 %, breaks at 500 kg, margin ×25 | |
| 2 | `angle` | two lines, 120° | **20 kg each**: the whole lamp on each line | 60°: 11.55 kg each; 150°: 38.64 kg |
| 3 | `drop` | drop 10 cm | stretch at rest 1.96 mm; factor 11.15; stopped in 21.87 mm; **222.92 kg: over the WLL** (223 %), holds (margin ×2.24) | drop 5 cm: 164.18 kg; 20 cm: 306.27 kg |
| 4 | `small` | small shackle, drop 5 cm | 164.18 kg > 125 kg: **line A breaks** at the small shackle (margin ×0.76) | drop 0: 20 kg, 80 % of its 25 kg, holds |
| 5 | `worn` | worn sling, drop 10 cm | 222.92 kg > 200 kg: **line A breaks** at the worn sling, still marked 100 kg | a new sling (preset 3) holds the same jolt |
| 6 | `wide` | 10 kW lamp (35 kg), two lines, 150° | 67.61 kg each (68 % of 100 kg), margin ×7.39 | 160°: 100.78 kg each, **over the WLL** on both lines |

Other numbers (tested): the 2 kW lamp dropping 10 cm: factor 15.31, 153.13 kg (a lighter lamp jolts by a larger
factor); two lines at 120° with a 10 cm drop: 164.18 kg each (each line at rest carries the whole lamp, but the pair
stretches twice as far as one line and catches softer); two lines at 60° with a 10 cm drop: stretch 1.308 mm, factor
13.406, 154.80 kg each; the hook with a 3 cm drop: 132.39 kg > 100 kg, breaks; two lines at 0°: 10 kg each.

## Legend and captions

Legend: a line (the thick line from the pipe to the lamp, its pull beside it), the weakest piece (outlined, ◀), the
working load limit (a thick line on each line's bar), the breaking strength (▼ on the bar), over the limit (the bar
hatched), broken (the line cut and dashed, the lamp on the floor), the drop (the lamp's outline above, dashed, with an
arrow), the zone below (a dashed area on the floor; a person walks around it).

Caption (at most three sentences): when a line breaks: the pull against the breaking strength of its weakest piece and
"the lamp falls into the zone below", then the cause (the jolt: "falls d, stopped in x: factor × its weight"; the worn
sling still marked 100 kg; the small shackle; the hook with no rating). When over the WLL and holding: the pull against
the WLL and "it held only on the margin, which was there for wear and jolts", then "this jolt used it up" after a drop
or "this pull already eats into it" without one (with two lines and no drop, the angle note first). When within: the
pull, the share of the WLL, the breaking strength and the margin; then the drop, or with two lines and no drop the
angle note at rest (more than half each; the whole lamp each at 120°; more than the lamp above 120°). Unrated: nobody
can say what the hook holds, so it has no place in hanging; after a drop, the jolt too. When one of two lines breaks,
the other line's pull label leaves the picture (what it then takes is not modelled, and the explanation says so); a
broken line is cut at its weakest piece.

Foot line on the stage (both languages): the page simplifies, the numbers are illustrative; rigging is set and checked
by riggers and grips, everyone else walks around it, never under it; the production's safety briefing and the key
grip have the final word.

## Misconceptions targeted

- "Rated for 100 kg means it breaks at 101 kg" / "it holds 500, so 400 is fine": the WLL is a fifth of the breaking
  strength, and the four fifths above it are kept for wear and jolts (presets 1, 3).
- "A short drop is nothing": 10 cm on a 20 kg lamp pulls 223 kg (preset 3); a lighter lamp jolts by a larger factor.
- "Two lines halve the load": only when they hang straight; at 120° each carries the whole lamp (preset 2), at 160°
  almost three times (preset 6).
- "The line is as strong as its sling": as strong as its weakest piece (preset 4).
- "The label still says 100 kg": wear changes the strength, not the marking (preset 5).
- "Walking under it is fine while it holds": the page puts the zone below in every picture.

## Sources

- Statics of a two-leg hanging (T = W / (2·cos(θ/2))): any statics text; sling-angle tables in lifting-equipment
  guidance (e.g. the UK HSE's guidance on lifting operations and lifting equipment, LOLER, L113) *(check: not read in
  full; not quoted on the page)*.
- The jolt of a drop on an elastic line (energy balance, a mass falling onto a linear spring): any mechanics text;
  the fall factor of rope access and fall arrest *(check)*.
- Safety factors of lifting hardware (different by type: chain, wire rope, textile slings, shackles; EN 13414-1 for
  wire rope slings, EN 13889 for shackles, EN 818 for chain slings) and the higher factors used in entertainment
  rigging over people (e.g. guidance from industry safety committees and the ABTT / ESTA codes) *(check: from memory;
  the page uses one illustrative factor, 5, and names no standard)*.
- Directive 2009/104/EC (use of work equipment), its annex on lifting equipment and loads not hung over people
  *(check: not quoted on the page)*; the framework directive 89/391/EEC.
- Zakon o zaštiti na radu and the Croatian rules on work equipment (Narodne novine): not named on the page *(check,
  catalogue §4.14)*.
- Film and TV safety guidance on rigging and overhead loads (industry safety bulletins: rigging by qualified riggers
  and grips, nobody under suspended loads) *(check: not read in full)*.

No real case: catalogue §4.14 lists `set-working-load` under "No fitting documented case known", so there is no
"Na temelju / Based on" line.
