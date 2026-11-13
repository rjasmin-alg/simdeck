<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-working-load: notes

Task `docs/tasks/w3/set-working-load.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer on the forces-and-moments model (catalogue §5.25).

## Decisions

- **The shared model is its own file**, `rigging.js`, registering `SimdeckModels['set-rigging']`: line tension for one
  or two lines at an angle, the catch stiffness, the jolt of a drop, the catch distance, a line as a chain of pieces
  and a line's state. Pure, no strings, tested in its own block of `sim.test.js`. `set-statics` is not in `models/`
  yet (set-stand-tipping's request is still open), so per COMMON.md §6 `rigging.js` **copies** the three things it
  needs from `sims/set-stand-tipping/statics.js @ a3f3f1a` (`G`, `EPS`, `weight`) with a comment, instead of copying
  the whole statics file (tripods, wind, tipping edges: none of it used here).
- **Forces shown as kilograms of pull**, with newtons beside: hardware is marked in kg, and "the line pulls 223 kg"
  is what a trainee can picture. The model works in newtons.
- **One safety factor, 5, for every rated piece.** Real hardware uses different factors by type and standard (and
  entertainment rigging over people often a higher one); the explanation says so and names no standard or figure as a
  rule. The concept's point is the gap between the marking and the breaking strength, which one factor shows.
- **The drop** is the energy balance of a mass on a linear spring, no damping: factor 1 + √(1 + 2d/δ). A drop of 0 is
  a lamp lowered gently onto the line (factor 1, the tie-break), not one let go on a just-taut line (factor 2). The
  line's stiffness, 100 kN/m (1 mm per 100 N), is soft for steel on purpose: a realistic steel stiffness gives factors
  of 25–30 for a few centimetres, which would make every drop break everything and hide the other contrasts; the
  explanation says a stiffer line jolts harder.
- **Two lines catch a little softer than one** (the pair stretches more vertically, K = n·k·cos²(θ/2)): at 120° each
  line at rest carries the whole lamp, yet a 10 cm drop pulls 164 kg on each against 223 kg on one line. This is what
  the physics says, so the model keeps it; the page does not make a point of it (it is not the concept), and the
  captions never compare the two.
- **The weaker link goes into line A only** (the only line, or the left one), so with two lines B is the "same lines,
  all rated" comparison next to it (COMMON.md §11, "comparisons").
- **The worn sling keeps its marking** (100 kg) and breaks at 40 % of new: wear changes the strength, not the label.
  The hook with no rating has no WLL; the page shows "WLL: none" and the caption says nothing is hung on it. Its
  breaking strength (100 kg) is the page's guess and the caption says "an unknown load (here 100 kg)".
- **When a line breaks the lamp falls** into the zone below; what the other line of a pair then takes (the swing, a
  second jolt) is not modelled and the page does not claim it.
- **"Uneven loading"** (concept: wear, a sudden stop and uneven loading eat into the margin) is named in the
  explanation as one of the reasons for the margin; the page does not model lines of different length (a statically
  indeterminate share that would be a second mechanism). The angle covers "loading the marking does not assume".
- **"Riggers and grips only; everyone else walks around it, never under it"** is in the picture, not as a rule: the
  zone below the lamp is drawn in every state, a crew member walks around it, and a broken line drops the lamp into
  it. The foot line and the explanation name who sets and checks rigging. No rigging method, hardware choice or
  inspection step appears (task file: specialist work from outside).
- **No real case.** Catalogue §4.14 lists `set-working-load` under "No fitting documented case known"; no "Na temelju
  / Based on" line.
- **Controls**: the angle shows only with two lines (`visible`), with the page's `.sd-ctl[hidden] { display: none; }`
  as other sims do (the kit's control layout overrides `[hidden]`).
- **Not added to `docs/tasks/OPEN.md`**: the gate's scope rule allows only this folder; the owner's questions are
  below and in the report.

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list: *grip* (plural *gripovi*), *key grip*, *brifing* in the foot line. *(check)* with the
colleague who trains crews:

- *radno opterećenje (WLL)* for the working load limit, as the catalogue's title has it *(check: "radno opterećenje"; a
  Croatian lifting text may say "dopušteno radno opterećenje" or "nosivost")*
- *prekidna sila* for the breaking strength, *faktor sigurnosti* for the safety factor
- *rigger* as a loanword (*riggeri*, *riggera*), not on the owner's list; *rigging* in the title, from the catalogue
- *uže* for a line (uže A, uže B; "na jednom užetu ili dva") *(check: crews may say "sling" or "linija")*
- *stega* for a clamp, *čelična omča* for a steel sling, *škopac* for a shackle, *kuka* for a hook *(check: crews may
  say "clamp", "sling", "shackle")*
- *najslabija karika* for the weakest link
- *cijev rešetke* for the grid pipe
- *reflektor 2 / 5 / 10 kW* for the lamps (as in set-circuit-load and set-stand-tipping)
- *pad prije hvatanja* / *trzaj* for the drop and the jolt
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- The safety factor 5 and the idea that hardware types use different factors (wire rope slings, chain, textiles,
  shackles; EN 13414-1, EN 818, EN 13889) and that overhead rigging over people uses higher ones: from memory, none
  quoted or named on the page.
- Sling-angle tables (the 120° rule) in lifting guidance (HSE L113 for LOLER): from memory; the formula itself is
  statics.
- The fall factor and shock-load guidance from rope access and fall arrest: from memory.
- Directive 2009/104/EC (lifting equipment, loads not over people), 89/391/EEC and the Zakon o zaštiti na radu: not
  named on the page.
- Film and TV safety guidance on rigging (qualified riggers and grips, nobody under suspended loads): not read in full;
  the page frames these as practice with its reason, not as a rule.
- Every mass, rating and stiffness is illustrative (the page says so in the foot line and the explanation): lamps 10,
  20 and 35 kg; clamp 150 kg, sling 100 kg, shackle 250 kg; small shackle 25 kg; the worn sling at 40 %; the unrated
  hook breaking at 100 kg; 100 kN/m per line.

## Numbers check

An independent script (Python, written apart from `rigging.js`/`sim.js`: the drop solved by bisection on the energy
balance W·(d + x) = ½·K_v·x² rather than the closed form, tensions from the hook's equilibrium) gave the same pulls,
factors and stretches for all six presets and the variants in SPEC.md: single 20.00 kg; angle 120° 20.00 kg, 60°
11.55, 150° 38.64, 160° 57.59; drop 10 cm 222.92 kg (factor 11.146, stopped in 21.87 mm), 5 cm 164.18, 20 cm 306.27;
small shackle with 5 cm 164.18 (> 125); worn sling with 10 cm 222.92 (> 200); wide 150° with 35 kg 67.61 kg, 160°
100.78 (> 100); the 2 kW lamp with 10 cm 153.13 (factor 15.31); two lines at 120° with 10 cm 164.18; two lines at 0°
10.00 kg.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: working load limit / radno
opterećenje; breaking strength / prekidna sila; safety factor / faktor sigurnosti; shock load / trzaj.

## Shared requests

- **Promote `rigging.js`** to `models/` (as `models/set-rigging.js`, or merged additively into `models/set-statics.js`
  once that exists, dropping the copied `G`, `EPS`, `weight`), with the "rigging" block of `sim.test.js`; then point
  this sim at it.
- **Kit**: `.sd-ctl[hidden]` does not hide a control whose `visible()` is false, because the control layout sets
  `display`; this page adds `[data-sim] .sd-ctl[hidden] { display: none; }` like several others. A one-line rule in
  `kit.css` would let pages drop it.

## Learn tree

Suggested leaf (catalogue §4.14 outline): `film-set` → `loads` "Stativi, tereti i visina" / "Stands, loads and
height" → `rigging`.

## Review

A fresh reviewer (a separate agent, given the task, SPEC.md and the code, not this file) recomputed every number in
SPEC.md with its own script (all agree within 0.01) and ran 76 deliberate breaks. Fixed after the review:

- SPEC.md and a test comment said two lines at 120° stretch "four times" as far as one; it is twice (K_v = 2k·cos²60°).
- Test gaps, each now killed: the chain tie-break's EPS (the later piece now a hair *less*), `stretch` computed from a
  line's pull instead of the weight (new case: two lines at 60° with 10 cm, 154.80 kg), a NaN angle falling back to the
  minimum instead of the default, `lamp.m` replaced by the weight.
- `clean()` let inherited keys through (`lamp: 'toString'` gave NaN); it now checks `LAMP_IDS`, with a test.
- Captions: "this jolt used it up" no longer appears without a drop (a separate "this pull already eats into it"); the
  angle note says "at rest" and is skipped when a drop follows; the unrated hook's caption says it has no place in
  hanging (it hangs on the page to show what would happen) and adds the drop's jolt; with one of two lines broken,
  the other line's pull tag leaves the picture and the explanation says what the other line then takes is not shown.
- The stage cuts a broken line at its weakest piece (the shackle or hook at the lamp end), not always mid-sling.
- "A fifth" is marked as this page's figure: "here" in the concept and in the formula strip.
- Unused strings removed.

Equivalent survivors (no input tells them apart): the literal 9.81, restated tension and peak, the chain's limit taken
from the label piece or a plain min, `falls` checking line A only (line B is all rated and cannot break first).

## Time

Started 2026-11-13 08:10, done 2026-11-13 08:42, including a fresh review (about 32 minutes).
