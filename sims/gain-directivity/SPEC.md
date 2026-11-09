<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# gain-directivity: specification

Task `docs/tasks/w3/gain-directivity.md`, catalogue `ant-gain-directivity` (§4.15; uses shared model 3 of §5.26 for the
half-wave dipole and starts shared model 5, the link budget in dB). Class: explorer. The task's "Model and presets"
section was empty; this file fills it.

**One concept.** An antenna adds no power; it only sends it in some directions more than others. Directivity D is the
intensity in the strongest direction over the average over the whole sphere (an isotropic radiator of the same power).
Squeeze the pattern and D rises while the total radiated power stays the same. Gain G = η·D also counts the losses
in the antenna. dBi counts from the isotropic radiator, dBd from a half-wave dipole: dBd = dBi − 2.15. EIRP and ERP are
the transmitter power minus the cable loss plus the gain in dBi or dBd. A pattern is read by its main lobe, the
half-power beamwidth, the front-to-back ratio and the side lobes, on a linear or a dB scale.

**What the page shapes and what it computes.** The pattern is **shaped by hand** (beamwidths, a back lobe, side lobes),
not made from currents: how currents make such a beam is `ant-array-phasing` and `ant-yagi`. Everything else is computed
from the shape: D by integrating it over the sphere, then G, dBd, EIRP and ERP. The half-wave dipole, the dBd reference,
is the real one from the current model (`current-pattern.js`, copied from `dipole-length`).

## 1. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `hbw` | horizontal half-power beamwidth θ_H of the main lobe | 20 … 360°, step 5; 360 = all round | 360 |
| `vbw` | vertical half-power beamwidth θ_V | 10 … 180°, step 5; 180 = not squeezed | 180 |
| `fb` | back lobe, dB below the main lobe | 0 … 40 dB, step 1 | 20 |
| `sll` | side lobes, dB relative to the main lobe | −40 … −10 dB, step 1 | −20 |
| `eff` | radiation efficiency η | 5 … 100 %, step 5 | 100 |
| `cable` | cable loss | 0 … 10 dB, step 0.5 | 0 |
| `ptx` | transmitter power | 1, 10, 100 or 1000 W | 100 |
| `scale` | the polar plots' scale | `field` (linear field), `power` (linear power), `db` | `field` |

Tie-breaks (tested first):

1. Every range param is clamped to its range and rounded to its grid (5° for the beamwidths, 1 dB, 5 %, 0.5 dB); a
   non-number gives the default. `ptx` not one of the four values gives 100; `scale` not one of the three gives `field`.
2. **Omni.** At `hbw` = 360 the horizontal pattern is a circle (κ = 0 exactly): the back lobe and side lobes have
   nothing to stick out of, so `fb` and `sll` change nothing (the page disables them), the F/B ratio is 0 dB and there are
   no side lobes (`null`). At `vbw` = 180 the vertical factor is 1 everywhere (m = 0 exactly).
3. **The main lobe is at the front (φ = 0) and it is 1.** The lobes are combined by their maximum, so the back lobe
   (≤ 1) and the side lobes (≤ −10 dB) never lift the front. With `fb` = 0 the back lobe equals the main one: the
   pattern is bidirectional, and the main lobe is reported at the front (the tie goes to φ = 0).
4. **No half-power point.** When the pattern never falls to half (an omni pattern, or a back lobe that fills the main
   lobe's flanks), the beamwidth is `null` (shown as "all round"; vertically, for a beam with vbw 180, "not squeezed"),
   not 360. A pattern with a front but no half-power point (e.g. hbw ≥ 180 with fb 0) is `broad`, not bidirectional:
   front and back together fill all round.
5. **A side lobe is a local maximum** of the horizontal pattern strictly between 0 and 180°, not the main or the back
   lobe; where the main lobe's flank is above it there is none (`null`, the side lobes are hidden in the main lobe).
6. Zero power has no dB value: dB of 0 is `null` (−∞ is not JSON). Every power here is above 0 (η ≥ 5 %, cable ≤ 10 dB).

## 2. The pattern (sim.js)

Directions: azimuth φ from the front (the main lobe's direction), elevation ε from the horizon. The radiation intensity,
relative to the main lobe's, is **separable** (Kraus's approximation for a beam with two principal planes):

  U(φ, ε) = A(φ) · E(ε),  U(0, 0) = 1.

**Horizontal factor** A(φ): a smooth periodic lobe g(φ; κ) = exp(κ(cos φ − 1)) (a von Mises shape: 1 at its centre, no
cusp anywhere, κ = 0 is a circle). Its half-power width is θ when κ = ln 2 / (1 − cos(θ/2)) (for θ < 360°).

  A(φ) = max( g(φ; κ_H),  b·g(φ − 180°; κ_H),  s·g(φ − φ_s; κ_S),  s·g(φ + φ_s; κ_S) )

- the main lobe, κ_H from `hbw` (κ_H = 0 at 360°);
- the back lobe, as wide as the main one, at level b = 10^(−fb/10);
- two side lobes at ±φ_s, φ_s = min(2·hbw, 135°), half as wide as the main one (κ_S from hbw/2), at level s = 10^(sll/10).

**Vertical factor** E(ε) = cos^m ε, m = ln 2 / (−ln cos(vbw/2)) (m = 0 at 180°): null overhead and underfoot whenever
it is squeezed at all, as for a vertical antenna or a stack. With m = 0 and a beam (a fan beam, not squeezed
vertically) the separable U has many values at the zenith: the vertical cut jumps there from the front's level to the
back's. A set of measure zero, so D is unaffected; the drawing shows the jump.

**Directivity** (Balanis §2.6, eq. 2-16 *(check eq. number)*: D = 4π·U_max / P_rad):

  D = 4π / (I_A · I_E),  I_A = ∫_{−π}^{π} A(φ) dφ,  I_E = ∫_{−π/2}^{π/2} cos^m ε · cos ε dε,

by Simpson's rule (I_A: 7200 intervals, 0.05°; I_E: 3600, 0.05°). Closed forms used as checks (tests and the scipy
script):

- one von Mises lobe: I_A = 2π·I₀(κ)·e^{−κ} (I₀ the modified Bessel function);
- I_E = √π · Γ((m+2)/2) / Γ((m+3)/2): m = 0 → 2, m = 1 → π/2, m = 2 → 4/3.

So the isotropic radiator has D = 4π/(2π·2) = 1, and an omni pattern squeezed only vertically has D = 2/I_E: at
vbw = 90° (m = 2) that is 1.5, the short dipole's sin²θ (Balanis eq. 4-31 *(check)*), 1.76 dBi.

**Kraus's rule of thumb** D ≈ 41 253 / (θ_H·θ_V) (degrees; Kraus, *Antennas*, the chapter on directivity *(check)*) is
named in the explanation as a check, not used: it assumes no side or back lobes, overestimates narrow beams (a
Gaussian-like beam has Ω_A ≈ 1.13·θ_H·θ_V: 103 against 92 at 20° × 20°) and is only rough for broad ones (7.37 against
7.65 at 70° × 80°).

**The half-wave dipole** (the dBd reference): `current-pattern.js` `directivity(0.5)`: D = 1.6409, 2.1509 dBi (Balanis
§4.6: 1.643, 2.156 dB, with his rounding *(check)*; the page shows 2.15). Its pattern for the dashed outline, vertical:
U ∝ F(θ)², F = cos(π/2·cos θ)/sin θ, all round in the horizontal plane.

## 3. Gain, dBd, EIRP and ERP (link-budget.js, pure, promotable: catalogue §5.26 model 5)

- G = η·D (Balanis eq. 2-49 *(check)*); G_dBi = 10·log G; G_dBd = G_dBi − 10·log D_dipole = G_dBi − 2.15.
- P_antenna = P_tx · 10^(−L_cable/10); P_rad = η·P_antenna (what the pattern carries over the whole sphere).
- EIRP = P_tx · 10^(−L_cable/10) · G = P_rad · D; in dB: EIRP_dBW = P_tx,dBW − L_cable + G_dBi.
- ERP = EIRP / D_dipole; in dB: ERP_dBW = P_tx,dBW − L_cable + G_dBd = EIRP_dBW − 2.15.
- dBW = 10·log(P / 1 W), dBm = dBW + 30.

## 4. Rules (each with a test)

1. **The total stays the same.** For any shape, the intensity integrated over the sphere is P_rad: U_avg = P_rad/4π and
   U_max = D·U_avg. Squeezing changes D, never P_rad (P_rad depends only on ptx, cable and eff).
2. **Squeezing raises D.** D rises strictly as hbw or vbw narrows (the other params held), and D = 1 for the isotropic
   radiator (360°, 180°) exactly.
3. **The closed forms hold:** with no back or side lobes, I_A = 2π·I₀(κ)e^{−κ}; I_E as above; the omni pattern at
   vbw = 90° has D = 1.5.
4. **The half-power beamwidths read back** what was set: the horizontal from A(φ) by interpolation on a 0.05° grid, the
   vertical from E(ε), within 0.05°, when a half-power point exists (tie-break 4).
5. **Front-to-back ratio** F/B = 10·log(A(0)/A(180°)) = `fb` whenever the main lobe's own back, e^{−2κ}, is below b; for
   a broad main lobe it is less than `fb` (−10·log e^{−2κ_H}, `fbLimited`); 0 dB for an omni pattern. The caption names
   the main lobe's tail only when it costs 3 dB or more (`fbTail`).
6. **Side lobes** read back `sll` when they stick out of the main lobe (narrow beams); `null` when hidden.
7. **Gain = efficiency × directivity**; dBd = dBi − 2.15 (to 0.01 dB) for every shape.
8. **EIRP and ERP** by the two routes (watts and dB) agree; ERP = EIRP − 2.15 dB.
9. **A lossy antenna has gain below its directivity**, and below 0 dBi when η·D < 1 (the whip preset).

## 5. Presets (checked by the scipy script; numbers to 0.01 dB)

| # | id | hbw | vbw | fb | sll | η | cable | P_tx | scale | D | G | EIRP | ERP | what to see |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `iso` | 360 | 180 | 20 | −20 | 100 % | 0 | 100 W | field | 1.000, 0 dBi | −2.15 dBd | 100 W | 60.9 W | the reference: a sphere; the dipole (dashed) pokes out sideways and dips above |
| 2 | `collinear` | 360 | 40 | 20 | −20 | 100 % | 0 | 100 W | field | 2.838, 4.53 dBi | 2.38 dBd | 284 W | 173 W | squeezed only from above and below: all round the horizon above the dipole |
| 3 | `beam` | 65 | 100 | 15 | −15 | 100 % | 1 dB | 100 W | dB | 6.844, 8.35 dBi | 6.20 dBd | 544 W | 331 W | a small beam read in dB: main lobe, 65°, F/B 15 dB, side lobes −15 dB at 130° |
| 4 | `whip` | 360 | 90 | 20 | −20 | 10 % | 0 | 100 W | field | 1.500, 1.76 dBi | −10.39 dBd (−8.24 dBi) | 15 W | 9.1 W | a short lossy antenna (a short dipole in free space, η 10 %): directivity above 1, gain far below |
| 5 | `dish` | 20 | 20 | 30 | −25 | 100 % | 2 dB | 10 W | dB | 91.79, 19.63 dBi | 17.48 dBd | 579 W | 353 W | 10 W into a large beam: the same EIRP as 100 W into the small one |

Other checked shapes: 90° × 180° (a fan) → 3.584; 120° × 90° with `fb` 0 (bidirectional) → 2.284, 3.59 dBi;
300° × 180° → 1.401, F/B only 3.23 dB although `fb` is 20 (rule 5).

Pure lobes for comparison (no back or side lobes, scipy): 70°×80° → 7.65; 60°×60° → 11.15; 20°×20° → 92.14 (Kraus's
41 253/(θ_H·θ_V): 7.37, 11.46, 103.1).

## 6. The page

- **Stage:** the horizontal cut (seen from above, the front to the right) and the vertical cut (from the side, the
  front to the right, up at the top), each a polar plot of the gain in each direction over an isotropic radiator fed the
  same power, η·D·U(φ, ε). Dotted circle: the isotropic radiator. Dashed: the half-wave dipole (vertical) fed the same
  power. When η < 1 a thin outline shows the directivity pattern (no losses), so the losses visibly shrink the shape.
  Half-power lines (dashed) on both cuts; the F/B and the strongest side lobe labelled on the horizontal one. Below: a
  readout table (D, G in dBi and dBd, beamwidths, F/B, side lobes) and a dB ladder of the power from the transmitter to
  EIRP and ERP, with the radiated power ("the same whatever the shape").
- **Scale:** linear field (radius ∝ √G), linear power (∝ G) or dB (rings every 10 dB, 40 dB deep below the top ring).
  The linear scales use the smallest of 2, 3, 5, 10, 20, 50, 100, 200 (power over isotropic) at least 2 % above the
  largest of D and the dipole's 1.64; the dB top is the next multiple of 5 dBi at least 0.5 dB above them (so a lobe
  never touches the outer ring). The efficiency never rescales: a lossy pattern can drop lobes below the dB plot's
  floor, and the caption then says so instead of "they show". So the isotropic circle stays put while a
  squeeze lengthens the lobe, until the scale steps.
- **No time axis.** Nothing on the page changes in time (the antenna notes' "time on the stage" is for fields); an
  explorer with no transport play.
- **Captions** (two to four sentences): the shape (sphere, omni squeezed vertically, beam, bidirectional), what D means
  here (the strongest direction against the average, the same P_rad), losses when η < 1, the cable when > 0, the scale
  (what the side lobes look like in it), EIRP and ERP.

## 7. Misconceptions targeted

- "A high-gain antenna amplifies": the radiated power stays the same; only its direction changes (rule 1).
- "Gain and directivity are the same": a short whip (preset 4).
- "dBd and dBi are interchangeable": 2.15 dB apart; an advertised dBd figure looks smaller.
- "The linear plot shows everything": side lobes at −20 dB are 10 % of the field and 1 % of the power.
- "EIRP is power the antenna sends": it is what an isotropic radiator would need to send for the same intensity in the
  main direction.

## 8. Out of scope

How currents make the beam (`ant-array-phasing`, `ant-yagi`); ground reflections and the take-off angle
(`ant-ground-image`); the path loss and the receiver (`ant-link-budget`); mismatch (SWR) loss (`swr`); polarization
(`ant-polarization`); the legal power limits of a licence class.
