<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-stand-tipping: spec

Task `docs/tasks/w3/set-stand-tipping.md` (catalogue §4.14). One concept: **a stand tips when the overturning moment
(the head's weight off-centre, and the wind's push on a frame or flag times its height) exceeds the restoring moment
(the weight of the stand and its sandbags times their distance from the tipping edge); raising the riser lifts both the
centre of gravity and the lever, and wind force grows with the square of the wind speed and with the frame's area, so a
large frame high up in a gust is the classic accident; a sandbag on the leg under the load, the widest base, the load
over a leg, a lower height and a person holding or lowering the frame in rising wind each move the balance back; above
a wind limit set for the day, frames come down.**

Class: explorer (no steps). The state follows from the params at once. Hub of the forces-and-moments model
(catalogue §5.25): the physics is in `statics.js` (pure, promotable to `models/set-statics.js`); the stand, its heads
and the presets are in `sim.js`.

## Scene (one fictional production, an outdoor location in the afternoon)

One three-legged stand on level ground. On top of its riser: a 2 kW lamp on a short arm, or a small flag, or a frame
of 1.2 m or 1.8 m. The wind blows from the left; the stand is seen from the side (the stage) and from above (an inset).
All masses, sizes and limits are illustrative.

| Thing | Mass | Wind area | Other |
|---|---|---|---|
| stand | 14 kg | (ignored) | its own centre of gravity at 0.4 × the riser height |
| 2 kW lamp | 10 kg | 0.12 m² | not a "frame": the day's limit is for flags and frames |
| small flag 0.45 × 0.6 m | 1.5 kg | 0.27 m² | |
| frame 1.2 × 1.2 m | 4 kg | 1.44 m² | |
| frame 1.8 × 1.8 m | 7 kg | 3.24 m² | |
| sandbag | 15 kg | — | hung on a leg a quarter of the way from the column to the foot, 0.25 m up |
| legs | — | — | leg reach (column to foot) 0.45–0.75 m |
| a grip holding the column | — | — | 120 N against the push, 1.2 m up: 144 N·m |

## State (from `derive(params)`)

```
{ params (cleaned), head: { id, m, area, sail, w, hgt }, r, feet: [{ leg, x, y }], bags: [{ leg, x, y, onLeg }],
  edge: { a, b, cross, nx, ny, e }, force, overturn, restoring,
  parts: { standHead, bags: [N·m], hold, wind, offset }, ratio, tips, vCrit, overLimit, critOverLimit, lean, cgZ, mass }
```

Coordinates: x along the wind (it blows toward +x), y across, z up; m, kg, N, N·m. The model holds no words.

## Rules

`statics.js` (the shared model, rules 1–6):

| # | Rule | Source |
|---|---|---|
| 1 | **Weight** W = m·g, g = 9.81 m/s². | standard |
| 2 | **Wind force** on a flat surface face-on: F = ½·ρ·Cd·A·v², ρ = 1.25 kg/m³ (the standard atmosphere's 1.225, rounded), Cd = 1.2 (a flat plate face-on, 1.1–1.3 in the literature *(check)*). Grows with the area and with the **square** of the speed: twice the speed, four times the push. | standard drag equation; EN 1991-1-4 uses the same ½·ρ·v² pressure *(check)* |
| 3 | **A three-legged stand** from above: feet A, B, C a third of a turn apart at the leg reach r from the column. "Load over a leg" (`leg`): foot A points the way the push goes; "load between two legs" (`gap`): foot A points against it, the push goes between B and C. The **tipping edges** are the lines between two feet, A–B, B–C, C–A, each at r/2 from the column. Measured along the push, the edge is r away when the load is over a leg (edges A–B and C–A meet the push's line at foot A) and r/2 when it is between two legs (edge B–C). | geometry |
| 4 | **Moments about the edge.** Restoring: each weight times its distance from the edge, measured along the push (rule 3's "per unit of the push's direction": w·(e − p·n)/nx, exact for any edge). Overturning: the wind's push times its height, plus the head's weight times its offset from the column (the head's weight counts once on the column in the restoring moment and once as the couple W·d: an exact split). Of the edges facing the push (nx > 0), the one with the **least** restoring moment governs. **Tie-break:** within 1e−9 counts as equal and the first edge in the order A–B, B–C, C–A wins. The stand **tips when overturning > restoring**; **tie-break:** equal stands (within 1e−9). A grip's hand adds its moment to the restoring side, whatever the edge. | statics (moments about the tipping edge) |
| 5 | **Critical wind speed:** the speed at which the wind's moment, added to the head's offset moment, reaches the restoring moment: v = √((R − W·d) / (½·ρ·Cd·A·h)); 0 when it tips without wind; infinite when the head has no area or no height. | rules 2 and 4 |
| 6 | **Lean angle:** how far the stand can lean over the governing edge before its centre of gravity passes over it and it falls by itself: atan(the centre of gravity's perpendicular distance from the edge / its height). The centre of gravity's height is the mass-weighted mean (stand at 0.4 h, head at h, hung bags at 0.25 m). Raising the riser does not change the restoring moment on level ground, but it lifts the centre of gravity, so a smaller lean (a bump, a gust that rocks it, soft ground under a foot) is enough. 0 when it is already over. | statics |

`sim.js` (the stand, rules 7–12):

| # | Rule | Source |
|---|---|---|
| 7 | **Heads, stand, bags, bases, the grip** as in the table above. | illustrative |
| 8 | **Where the bags go:** `load`: on the leg(s) on the load side (A when the load is over a leg; B, C, B in turn when it is between two legs); `back`: on the other side (B, C, B over a leg; A between two). On a leg a bag hangs a quarter of the way from the column to the foot. `ground`: the bag lies on the ground beside the foot of the first leg of the load side and carries **nothing** at the start of tipping (it holds only once the leg has already lifted). Bags are numbered in the order placed. | the concept; crew practice: a bag on a leg near the column, hanging free of the ground (search: a bag resting on the floor is not engaged until the stand has lifted) *(check)* |
| 9 | **Params are cleaned:** an unknown head, orientation or bag place falls back to the default; numbers are clamped to their ranges; `bags` rounded, `reach` snapped to 5 cm; `hold` true only for `true`. | robustness |
| 10 | **The balance:** overturning = F·h + W_head·d (wind on the head at the riser's height, the head's weight at the arm's offset); restoring = (stand + head)·lever + each bag on a leg·its lever + the grip's 144 N·m. `parts` gives each term on the governing edge. `ratio` = overturning / restoring. | rule 4 |
| 11 | **The day's wind limit** (`limit`, m/s) is for flags and frames: `overLimit` when a flag or frame is up and the wind is **above** the limit (**tie-break:** at the limit is not over). `critOverLimit`: the stand would hold beyond the limit (vCrit > limit); when it is false, the stand tips below the day's limit (the limit is not a promise that a stand holds). | the concept |
| 12 | **Lean angle** of the whole stand (rule 6) on the governing edge, without wind or hand. | rule 6 |

Simplifications (the explanation says so): level, firm ground; a steady wind at the head's height (a gust is a short
higher speed; the dynamic kick of a gust is not modelled); the stand's own wind area ignored; the frame face-on to the
wind; no sliding, no bending; the feet do not sink. A real stand's legs and riser have their own geometry; the page
draws a generic stand.

Out of scope: tying a frame off with lines (rigging, the grips' work), how a stand is built or locked, lifts and high
rolls (`set-weather-lightning`), working loads of hanging hardware (`set-working-load`), lifting the bags
(`set-manual-handling`).

## Params

| Key | Type | Range / options | Default |
|---|---|---|---|
| `head` | select | lamp, flag, frame, bigframe | lamp |
| `height` | range | 1.5–4 m, step 0.25 (the head's height: the riser) | 2.5 |
| `reach` | range | 0.45–0.75 m, step 0.05 (column to foot; shown in cm) | 0.6 |
| `orient` | choice | leg (load over a leg), gap (between two legs) | leg |
| `arm` | range | 0–0.8 m, step 0.1 (the head's offset from the column) | 0.3 |
| `bags` | range | 0–3 | 1 |
| `bagOn` | choice | load, back, ground | load |
| `wind` | range | 0–16 m/s, step 0.5 | 3 |
| `hold` | toggle | a grip holds the column | false |
| `limit` | range | 4–14 m/s, step 0.5 (the day's limit for frames) | 8 |

## Presets and expected numbers (checked independently, `NOTES.md` "Numbers check")

| # | Preset | Differs from defaults | Expected | Contrast to try |
|---|---|---|---|---|
| 1 | `arm` | arm 0.8, reach 0.45, gap, no bags, no wind | overturning 98.1 N × 0.8 m = 78.48 N·m > restoring 235.44 N × 0.225 m = 52.97 N·m: **tips** without wind (148 %); lean 0° | turn it so the load is over a leg: lever 0.45 m, restoring 105.95: holds (74 %), but it leans only 2.1° before it falls |
| 2 | `flag` | small flag, 3 m, arm 0, wind 7 | F = 9.92 N, 29.77 N·m against 157.45 N·m (stand and flag 91.23 + one bag on the load leg 66.22): holds (18.9 %); tips at 16.1 m/s | |
| 3 | `bigframe` | the same with the 1.8 m frame | F = 119.07 N, 357.21 N·m against 189.82: **tips** (188 %); it would have held to 5.10 m/s | lower it to 1.5 m: 178.6 against 189.8, holds (94 %) |
| 4 | `riser` | frame 1.2 m at 4 m, arm 0, wind 7 | F = 52.92 N, 211.68 against 172.17: **tips** (123 %); lean 11.8° | 2 m: 105.84, holds (61 %), lean 20.9°; tipping height 3.25 m |
| 5 | `ground` | frame 1.2 m at 2.5 m, arm 0, gap, two bags on the ground, wind 6 | F = 38.88 N, 97.20 against 52.97 (the bags carry nothing): **tips** (184 %) | the bags on the load-side legs: 119.19, holds (82 %); on the back leg: 185.41 (52 %) |
| 6 | `limit` | frame 1.8 m at 2 m, reach 0.75, arm 0, three bags, wind 9, grip holds | F = 196.83 N, 393.66 against 546.82 (154.51 + 3 × 82.77 + 144): holds (72 %), but 9 > 8 m/s: **over the day's limit**, frames come down; tips at 10.6 m/s | without the grip: 402.82, 98 %, tips at 9.10 m/s |

Other numbers (tested): the default (lamp at 2.5 m, arm 0.3, one bag, 3 m/s): 31.45 against 207.48 N·m; twice the wind
speed is four times the push (rule 2); with the load over a leg and one bag, a bag on the load leg and on a back leg
give the same restoring moment (the stand tips over the edge through the bagged back leg), with two bags the back legs
give more (304.60 against 238.38 for the 1.2 m frame at 6 m/s, reach 0.6 m).

## Legend and captions

Legend: the wind's push (arrows, length with the force), the tipping edge (▲ on the ground in the side view, a thick
dashed line from above), a sandbag on a leg (filled), a sandbag on the ground (hollow, dashed), overturning parts and
restoring parts in the balance bars (each part named beside its bar, so colour is not the only carrier), the day's
limit (a thick line on the wind scale), tipping (the stand drawn leaning over, dashed).

Caption (short, at most three sentences): when it tips, the two moments and the main cause (the wind's F × h or the
head's W × d), then the speed it would have held to or "even without wind"; when it holds, the two moments and the
share used, and the speed at which it would tip; then one of: the day's limit passed (frames come down, even while it
holds), the stand would tip below the day's limit, the bags on the ground hold nothing until a leg has lifted, the
grip's hand counts only while they hold on.

Foot line on the stage (both languages): the page simplifies, the numbers are illustrative, and the production's
safety briefing and the key grip have the final word.

## Misconceptions targeted

- "A bit more wind, a bit more push": the push grows with the square of the speed (7 → 14 m/s is four times).
- "A frame is light, so it can't pull a stand over": the 1.8 m frame weighs 7 kg but catches 119 N at 7 m/s.
- "Raising the riser only matters for the head": it lengthens the wind's lever and lifts the centre of gravity.
- "A sandbag is a sandbag": on the ground beside the leg it holds nothing until the stand has already lifted.
- "Which way the stand points does not matter": the load over a leg doubles the lever of the stand's own weight.
- "Under the limit is safe": a stand can tip below the day's limit (preset 3 tips at 5.1 m/s), and above it frames
  come down even when this stand still holds (preset 6).

## Sources

- The drag equation and flat-plate drag coefficients: any fluid mechanics text (e.g. Hoerner, *Fluid-Dynamic Drag*,
  1965, flat plate normal to the flow, Cd ≈ 1.17 for a square plate) *(check: from memory)*.
- EN 1991-1-4 (Eurocode 1, wind actions): the peak velocity pressure ½·ρ·v², ρ = 1.25 kg/m³ recommended *(check: from
  memory; the standard is paid)*.
- Moments about a tipping edge, the stability of a tripod: statics, any mechanics text.
- Crew practice for sandbags (a bag on a leg near the column, hanging free of the ground; the load over a leg):
  photography and film crew guides found by a web search (2026-11-13), e.g. diyphotography.net "Sandbags 101",
  nofilmschool.com "What you need to know about utilizing C-stands on set", savageuniversal.com "5 safety tips for
  C-stands", and a dvinfo.net forum thread where some crews bag the back legs *(check: secondary sources, not a
  regulator)*; no stand model or brand is named on the page.
- Directive 2009/104/EC (use of work equipment) and the framework directive 89/391/EEC: the employer's risk assessment
  covers equipment that can fall *(check: not quoted on the page)*.
- Zakon o zaštiti na radu (Narodne novine): not named on the page *(check, catalogue §4.14)*.
- Film and TV safety guidance on wind and frames (industry safety bulletins on wind and large frames, weather limits
  set before the shoot) *(check: not read in full)*.

No real case: catalogue §4.14 lists `set-stand-tipping` under "No fitting documented case known", so there is no
"Na temelju / Based on" line.
