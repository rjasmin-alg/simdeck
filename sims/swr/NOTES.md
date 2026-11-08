<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# swr: notes

New explorer (task `docs/tasks/w3/swr.md`, catalogue `ham-swr`, §4.10, wave 3). No kit view: the task names none, and
a feed line with waves over it is not one of K1–K4. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scene.** A CSS grid: the transmitter (a box with ∿, "P_V = 100 W") on the left, the line in the middle, the load on
  the right (a resistor zig-zag with "R = … Ω" and "Z₀ = … Ω", two open stubs, or a shorting bar). Over the line, from
  the top: the forward wave (a solid bar with a filled arrowhead, pointing to the load), the reflected wave (a hollow
  bar with a hollow arrowhead, pointing back, its thickness and head scaled by |Γ|, labelled "Γ = +0,33"; "no
  reflected wave" when Γ = 0), the plot, the two conductors, and the λ/2 dimension. Two meter cards below.
- **The plot** is one SVG stretched to the box (`preserveAspectRatio="none"`, strokes `non-scaling-stroke`): a centre
  axis, dotted guides at ±1 (the forward wave's amplitude), the envelope |V| as a thick curve and its mirror −|V|
  dashed and thinner, so the instantaneous voltage visibly moves inside both. Voltage is relative to the forward
  wave (1); the vertical scale fits ±2 (open or short). All text (U_max / U_min, λ/2, "voltage") is HTML placed in
  percent, so nothing is scaled by the `viewBox`.
- **Markers:** ▲ above every maximum and ▼ above every minimum of the upper envelope; one maximum and one minimum, the
  ones nearest the middle, get "U_max = 1,33" (above) and "U_min = 0,67" (below the curve). Flat line: one label
  "U_max = U_min = 1", no markers. The λ/2 dimension spans the two neighbouring maxima nearest the middle, with dashed
  guides from them down through the plot.
- **R slider in log steps:** the kit's range is linear, so the param `r` is an index into 31 values, ten per decade
  (1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5 × 10ⁿ, and 1000). Chosen so every row of the book's table `e_swr_werte` is
  reachable on 50 Ω (75 → 1.5, 100 → 2, 125 → 2.5, 150 → 3, 200 → 4, 300 → 6, 500 → 10, 1000 → 20) and the round
  values on 75 Ω (150 → 2, 25 → 3). The slider shows the value in Ω.
- **Open and short** are a three-way choice "End of the line: resistor R / open / short" (the kit's segmented
  buttons) instead of two separate buttons, so the state lives in the URL and is visible; while it is not "resistor
  R", the R slider is disabled and its hint says why.
- **Meters.** P_V = 100 W forward at the transmitter (the book's example). The transmitter card shows P_V, the
  reflected power after the loss twice, the SWR from powers and the % reflected; the load card shows P_V and P_R at
  the load (after one loss) and the load's own SWR. "Changed": the four values of a card get the highlighter when the
  card's SWR class (1, ≤ 2, ≤ 3, worse) differs from the previous render's; the first render marks nothing.
- **Animation:** the instantaneous voltage cos(ωt + 2πd) + Γ·cos(ωt − 2πd) is redrawn by `requestAnimationFrame`
  (one path, 161 points, 2.4 s per cycle) only while the toggle is on and reduced motion is off. Under reduced
  motion the toggle is disabled with the reason, and no curve is drawn (no frozen snapshot).
- **Line loss** draws a pill on the cable, "5 dB loss each way · envelope drawn without loss", because the task keeps
  the envelope lossless while the meter at the transmitter changes (see Deviations).
- **Captions** are built from the state: matched, R > Z0 (the task's caption pattern, "SWR = R / Z0"), R < Z0
  ("SWR = Z0 / R"), open, short; plus one sentence for the loss when it is above 0 and there is a reflection.
- **Number format:** decimal comma in Croatian, "−" for negative Γ; SWR to two decimals, percent and watts to one,
  trailing zeros dropped (2, 1,92, 11,1 %).
- **Presets:** two columns in the panel (as amdahl, cgnat), one on a phone; with one column the panel would scroll at
  1920×1080. Presets set every model param and leave the animation toggle at its default.
- **Attribution** (CC BY 4.0) at the end of the footer bar, as in `sims/attenuator`; `sim.json` `credits` lists the
  five 50ohm sections.

## Deviations from the task

- **`r` is an index, not R in Ω** (log steps, above). The model's `stateFor(end, R, Z0, loss)` takes R in Ω and
  clamps it to 1 Ω … 10 kΩ (rule 6); `derive(params)` maps the index to R.
- **Open/short as a choice** instead of two buttons (above).
- **State** carries `null` for an infinite SWR (JSON-safe), plus `R`, `end`, `umax`, `umin`, `minAtLoad`, `flat`,
  `maxima`, `minima`, `meter` and the two classes beside the task's fields.
- **Envelope without loss:** as the task says. A lossy envelope (the ripple shrinking toward the transmitter, which
  would show *why* the meter reads better) is physically truer and would teach preset 6 well; it is a possible
  follow-up, not built (the task keeps loss out of the drawing). The pill on the cable says the drawing has no loss.
- **Captions** use the computed percent with one decimal ("11,1 %"), where the task's caption says "11 %".
- **Re-reflection at the transmitter** is not modelled: P_V is fixed at 100 W (SPEC.md).

## Sources

- 50ohm.de, Croatian translation, `50ohm-contents-hr/contents/sections/`: `swr.md` (prilagodba, SWR 1 and ∞, SWR 2 →
  11 %, SWR 3 → 25 %, the powers formula, the long-cable effect), `swr_2.md` (P_V 100 W, P_R 25 W → 3; table
  `e_swr_werte`), `swr_3.md` (s = R_a/Z or Z/R_a, U_max/U_min, λ/2, 100 Ω → 2, 10 Ω → 5, folded dipole 240–300 Ω,
  the half-and-half and the 5 dB examples, AG404), `swr_meter_1.md` (where to insert the meter), `swr_meter_2.md`
  (directional couplers; not shown on the page). CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.
- Numbers checked with an independent Python script (complex envelope, powers formula) before coding; see SPEC.md.

## Term pairs

None of these are in `kit/glossary.js`; the explanation writes them out (English in italics, Croatian in
parentheses), the labels use the Croatian. Croatian from the 50ohm translation:

| en | hr |
|---|---|
| standing wave ratio (SWR) | omjer stojnog vala |
| standing wave | stojni val |
| characteristic impedance | valna impedancija |
| feed-point impedance | otpor napajanja (otpor u točki napajanja) |
| match | prilagodba |
| forward power | upadna snaga |
| reflected power | povratna snaga |
| feed line | napojni vod (prijenosni vod) |
| SWR meter | SWR-metar (mjerilo stojnog vala) |
| reflection factor | faktor refleksije *(check: not in the 50ohm text; the usual term)* |

## Shared requests

- **A log scale for `range`** (kit): `scale: 'log'` with `min`/`max` in the param's own unit, or a `values: [...]`
  list the slider steps through. This sim works around it with an index param and a `format`.

## Unchecked *(check)*

- **"faktor refleksije"** for Γ: the 50ohm sections do not name Γ; the term is the usual Croatian one.
- **"The transmitter largely re-reflects the reflected power"** (explanation, the misconception): the task states it;
  the 50ohm sections only say the final stage can be damaged and modern radios cut their power.
- **Mutation testing:** every rule was broken once in `sim.js` and a test failed, except removing the `P_R = 0 → 1`
  branch, which is an equivalent mutant (the formula gives 1 anyway); the branch stays as the stated tie-break.

## Review

A fresh reviewer (a separate agent, no access to this session's reasoning) read the diff against SPEC.md and ran
31 mutants on a copy. It found no defect in the model or the page. Three mutants survived and are now caught by new
tests: the direction of the travelling waves in `instant`, a tolerance on "flat" (R = 40 Ω and 60 Ω must not be
flat), and the load meter's P_R with loss. One more test pins the class-3 tolerance. Two survivors are equivalent
(the envelope with d = x, because 2·LEN is a whole number, so a direct test rebuilds the envelope from d now; the
P_R = 0 branch). The Croatian wording was fixed as the reviewer suggested ("prigušuje", not "guši"; the legend says
"SWR prešao u drugi raspon", since "razred" means the licence class in this course). Left as is: the legend lists
the instantaneous voltage even when it is off, and a change of the OS reduced-motion setting while the page is
open stops the animation but leaves the last frame drawn until the next change.

## Time

Start 19:14, done 19:55 (2026-11-08), one session.
