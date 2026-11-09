<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# gain-directivity: notes

Task `docs/tasks/w3/gain-directivity.md`, catalogue `ant-gain-directivity` (§4.15; shared models 3 and 5 of §5.26). A new
native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in
`SPEC.md`; the task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **The pattern is shaped by hand, not made from currents.** The concept is the measure (directivity as the peak over
  the sphere's average, the total unchanged), so the student squeezes the pattern directly: horizontal and vertical
  half-power beamwidth, a back lobe, side lobes. Building the beam from currents (an end-fire array, a Yagi) would have
  brought in the next pages' concept (`ant-array-phasing`, `ant-yagi`) and coupled the back lobe and side lobes to the
  beamwidth in ways that jump (odd and even element counts). The explanation says so and names those pages.
- **The shape** (SPEC.md §2): separable U = A(φ)·E(ε) (Kraus's two principal planes). Horizontal lobes are von Mises
  shapes exp(κ(cos φ − 1)) (smooth everywhere, κ = 0 is a circle, half-power width exact); the main, back and two side
  lobes are combined by their **maximum**, so the front stays 1, F/B equals the back-lobe setting and the side lobes
  read back exactly whenever they stick out. A sum would lift the front above 1 for broad beams; a cos^n(φ/2) lobe has a
  cusp at the back. Vertical factor cos^m ε: null overhead for any squeeze (like a vertical or a stack), m = 2 is the
  short dipole's sin²θ exactly (D = 1.5).
- **Directivity by integration** over the sphere (Simpson, 0.05°), checked against the closed forms 2π·I₀(κ)e^{−κ} and
  √π·Γ((m+2)/2)/Γ((m+3)/2), against scipy `quad`, and in the tests against a brute-force midpoint sum over the sphere.
- **The dBd reference is the real half-wave dipole** from `current-pattern.js` (copied from `dipole-length`): D = 1.6409,
  2.1509 dBi; drawn dashed in both planes. No preset pretends to be a half-wave dipole with the hand-shaped law (it
  would read 2.18 dBi at 78°, confusing next to "2.15").
- **What is plotted:** the gain in each direction, η·D·U, over an isotropic radiator fed the same power; with losses a
  thin dashed outline shows the directivity (no losses), so η visibly shrinks the shape. Scales: linear field, linear
  power, dB (40 dB deep). The linear top steps through 2, 3, 5, 10, 20, 50, 100, 200 so the isotropic circle stays put
  while a squeeze lengthens the lobe; efficiency never rescales.
- **The power ladder** (dBW): transmitter, cable, antenna losses, radiated ("the same for any shape"), + D, EIRP,
  − 2.15 dB, ERP; levels as bars from the axis, changes as floating bars (up solid, down hatched). On a phone each row is
  a text line with the bar under it.
- **Gain chain in its own module**, `link-budget.js` (model 5): dB helpers, G = η·D, dBd, and `transmit()` from P_tx
  through the cable to EIRP and ERP. Pure, registers as `SimdeckModels['link-budget']`, for `ant-link-budget` to extend
  with the path loss and the receiver.
- **No time axis.** Nothing changes in time here, so the antenna notes' "time on the stage" does not apply: an explorer
  with only the kit's reset in the bar.
- **Panel layout:** eight controls did not fit at 1920×1080 (1264 px against 862). As in `rpo-rto`: presets and settings
  in two columns, the settings group's duplicate reset hidden (the bar has it, same R key), the back-lobe and side-lobe
  sliders hidden (`visible`) for an omni pattern, where they change nothing (tie-break 2). With the `.sd-ctl[hidden]`
  workaround the other sims use. Croatian slider labels wrap above their value in the narrow columns; the sliders stay
  aligned.
- **Ranges:** hbw 20 … 360° (360 = all round), vbw 10 … 180° (180 = not squeezed), back lobe 0 … 40 dB, side lobes
  −40 … −10 dB, η 5 … 100 %, cable 0 … 10 dB, P_tx 1/10/100/1000 W (0/10/20/30 dBW, clean dB numbers). From 360° to 355°
  the F/B jumps from 0 to 3 dB: a von Mises lobe broad enough to have its −3 dB points at ±177.5° is already 3 dB down
  at the back (SPEC rule 5; the caption says "the main lobe reaches round the back").
- **Kinds** (caption): iso, omni, broad (a front but no half-power point), bidirectional (fb 0 on a real lobe), beam.
- **Presets:** isotropic; squeezed vertically (40°, 4.53 dBi, 2.38 dBd); a small beam in dB (65° × 100°, F/B 15,
  side lobes −15, 1 dB cable: 8.35 dBi); short and lossy (η 10 %: D 1.76 dBi, G −8.24 dBi); a large beam with 10 W
  (20° × 20°, 19.6 dBi, 2 dB cable: EIRP 579 W, about the small beam's with 100 W).
- **Tags**: `antennas` (the task's; in `tags.json`). Topic `radio`, level `core`. `related`: `dipole-length`,
  `lc-antenna`, `swr` (existing sims; the other antenna pages of the wave are not merged yet).
- **No idea-credit line**: the antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. "Squeeze and stretch a pattern" is done with two beamwidth sliders rather than by dragging the plot.

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: ch. 2 (§2.6 directivity D = 4πU_max/P_rad, eq. 2-16; the cos^n examples;
  §2.8–2.9 efficiency and gain, G = e·D, eq. 2-49), §4.6 (half-wave dipole: 1.643, 2.156 dB with his rounding)
  *(check eq. numbers; the book was not at hand, the numbers were recomputed)*.
- J. D. Kraus, *Antennas*, the chapter on directivity and beam area: D ≈ 41 253 / (θ_H·θ_V) *(check chapter)*; named
  in the explanation as "about 41 000".
- 50ohm-contents-hr: izotropni zračitelj, dobitak, dBi, dBd, EIRP, ERP, dijagram zračenja, širina snopa na polovici
  snage, omjer naprijed-natrag (catalogue §4.15 "settled" list).

## Checks

- **Numbers**: a scipy script (scratch, not committed) computed every number in SPEC.md §2 and §5 with `quad` of the same
  shape and the closed forms (`i0e`, `gamma`), the dipole by `quad` of F² sin θ, beamwidths by `brentq`, side lobes on a
  0.05° grid. The JS model matches to the printed digits (tests use those values).
- `node --test sims/gain-directivity/sim.test.js`: 25 tests pass (with the review's added assertions).
- `npm run gate -- gain-directivity`: all rules pass (46 browser checks); screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus all five presets in both languages at 1920×1080 (panel
  scrollHeight 862 = clientHeight in each, no console errors). Fixes from that look: the panel (above), the ring labels
  moved off the side lobes, the F/B label off the centre, the ladder's value column, the phone ladder and the clipped
  "front" label, `<sub>` in the explanation at 13.3 px on the phone (now 1em).
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in SPEC.md
  §2 and §5 with its own scipy script and found them right; 53 mutations of `sim.js` and `link-budget.js`, 21 survived.
  Seven were real gaps, now tested: `fbLimited` for an omni pattern at the default fb, fb 1 as bidirectional, `lossy` at
  95 %, `belowIso` for the isotropic radiator (the integral gives D = 1 − 1e-15: now `g < 1 − 1e-9`), the plot-top
  margins, efficiency rescaling a narrow beam's plot, `pRadDbw`. The rest are equivalent (dead guards, measure-zero
  boundaries, the single side-lobe peak on an integer grid point). Fixed from its reading of the page: watts under 1 W
  (now mW, "0.00 W" before); "the back lobe and side lobes show" in dB when losses had pushed them below the plot's
  floor (now its own sentence); "the main lobe reaches round the back" for a narrow beam whose tail capped a 40 dB back
  lobe at 38.4 dB (now only when it costs ≥ 3 dB, `fbTail`); fb 0 on a beam ≥ 180° called bidirectional (now `broad`,
  "front and back together cover all round"); "all round vertical" for a fan beam (now "not squeezed"); "a side lobe
  −20 dB down"; Croatian in the EIRP explanation and "U linearnom polju"; SPEC's Kraus remark (it overestimates narrow
  beams, not broad) and the whip row's units. Unused `belowDipole` dropped. Found while checking those: a caption value
  node used in two sentences left the first one empty; each sentence now gets fresh nodes.
- `npm test` (8971 pass), `npm run check` (0 errors): pass.

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **usmjerenost** (directivity; catalogue lists it as unsettled).
  - *(check)* **učinkovitost (antene)** η (radiation efficiency).
  - *(check)* **gubitak u kabelu** (cable loss).
  - *(check)* **glavna / stražnja / bočne latice** (main / back / side lobes).
  - *(check)* **vodoravna / okomita ravnina**, **vodoravni / okomiti snop** (horizontal / vertical plane, beam).
  - *(check)* **izračena snaga** (radiated power).
- The page's "Usmjerena" and "Velika, 10 W" preset names are short to fit two columns; longer names wrap to three lines.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| isotropic radiator | izotropni zračitelj | 50ohm-contents-hr |
| gain | dobitak | 50ohm-contents-hr |
| radiation pattern | dijagram zračenja | 50ohm-contents-hr |
| half-power beamwidth | širina snopa na polovici snage | 50ohm-contents-hr |
| front-to-back ratio | omjer naprijed-natrag | 50ohm-contents-hr |
| EIRP, ERP | EIRP, ERP | 50ohm-contents-hr |
| directivity | usmjerenost | *(check)* |
| radiation efficiency | učinkovitost antene | *(check)* |
| cable loss | gubitak u kabelu | *(check)* |
| main / back / side lobe | glavna / stražnja / bočna latica | *(check)* |
| radiated power | izračena snaga | *(check)* |

## Shared requests

- **models/**: `link-budget.js` is model 5 of catalogue §5.26, ready to promote as `models/link-budget.js` (registration
  `SimdeckModels['link-budget']`); its rule tests are "module link-budget" and rules 7–9 in `sim.test.js`.
  `ant-link-budget` would add the path loss 20·log(4πd/λ), the receiving antenna and the margin as new functions.
- **models/**: `current-pattern.js` is an unchanged copy of `sims/dipole-length/current-pattern.js` @ 3daf9c6 (model 3).
  When it is promoted, point this page at `../../models/current-pattern.js` and drop the copy.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `dipole-length`, `rpo-rto` and others;
  worked around in this page's CSS. A kit option for a two-column settings group would replace the copied
  `rpo-rto` CSS.

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › directivity` "Dobitak i usmjerenost" / "Gain and directivity":
this sim first, later `ant-array-phasing` and `ant-yagi`.

## Time

Start 12:43, done 13:10 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes).
