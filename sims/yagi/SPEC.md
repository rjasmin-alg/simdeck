<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# yagi: specification

Task `docs/tasks/w3/yagi.md`, catalogue `ant-yagi` (§4.15; shared model 3 of §5.26, "the pattern of a set of currents",
with the currents now induced through mutual impedances). Class: explorer. The task's "Model and presets" section was
empty; this file fills it.

**One concept.** Only the driven element is fed. The others (parasitic elements) are plain wires that carry currents
induced by its field; the size and phase of each induced current is set by the spacing and by the element's own length
(longer than resonant: inductive; shorter: capacitive). A slightly longer element behind (the reflector) and slightly
shorter ones in front (the directors) take phases that make all the fields add forwards and cancel backwards. More
directors narrow the beam and raise the gain, each one less than the one before. The front-to-back ratio and the feed
impedance (well below the 63–73 Ω of the dipole alone) depend on the spacings and lengths.

## 1. The antenna and the conventions

- Elements are thin straight wires of radius a = 0.0025 λ (diameter 0.005 λ), parallel to y, centred on the boom
  (the x axis), side by side (no stagger), in the horizontal plane z = 0. In boom order: the reflector (optional) at
  x = −s_r, the driven element at x = 0, director k (k = 1 … n) at x = k·s_d. All directors have the same length.
- Forward is +x (towards the directors). Azimuth φ in the horizontal plane from +x, counter-clockwise. The horizontal
  plane is the E-plane (it contains the elements), the vertical plane through the boom the H-plane.
- Each element carries the sinusoidal current I(z) = I_m·sin(k(l/2 − |z|)) (Balanis §4.5, §8.5). The centre current is
  I_m·sin(π·l/λ); every current shown is the centre current relative to the driven element's (amplitude ratio and
  phase in (−180°, 180°], + ahead, − behind).

## 2. Model (mutual-impedance.js, pure, promotable next to current-pattern.js)

- **Self impedance** referred to the crest current (Balanis eq. 8-60a, 8-60b *(check eq. numbers)*; Ci and Si by their
  power series, A&S 5.2.14 and 5.2.16):
  R = η/(2π)·{γ + ln kl − Ci kl + ½ sin kl [Si 2kl − 2 Si kl] + ½ cos kl [γ + ln(kl/2) + Ci 2kl − 2 Ci kl]},
  X = η/(4π)·{2 Si kl + cos kl [2 Si kl − Si 2kl] − sin kl [2 Ci kl − Ci 2kl − Ci(2ka²/l)]}.
  At the feed divide by sin²(kl/2). λ/2: 73.08 + j42.51 Ω (any radius). With a = 0.0025 λ the reactance is zero near
  l = 0.4725 λ (the resonant length): 0.47 λ gives 61.19 − j3.56 Ω, 0.475 λ 63.04 + j3.98 Ω.
- **Mutual impedance** of two parallel side-by-side elements, lengths l₁ and l₂, spacing d (induced EMF; Balanis §8.6,
  eq. 8-54 to 8-57 *(check eq. numbers)*), referred to the crest currents:
  Z₂₁ = jη/(2π)·∫₀^{l₂/2} sin(k(l₂/2 − z))·[e^{−jkR₁}/R₁ + e^{−jkR₂}/R₂ − 2 cos(kl₁/2)·e^{−jkr}/r] dz,
  R₁,₂ = √(d² + (z ∓ l₁/2)²), r = √(d² + z²): the exact near field E_z of element 1's sinusoidal current, integrated
  against element 2's current. 10-point Gauss–Legendre in panels no wider than min(0.025 λ, d/2), a panel edge
  opposite element 1's end. Checked: equal λ/2 elements against the closed form with Ci and Si (Balanis eq. 8-68), and
  any lengths against scipy `quad` of the same integral, to 1e-6 Ω; reciprocal (Z₁₂ = Z₂₁ for unequal lengths).

  | d/λ (two λ/2) | 0.05 | 0.1 | 0.15 | 0.2 | 0.25 | 0.5 | 1 |
  |---|---|---|---|---|---|---|---|
  | Z₁₂ (Ω) | 71.61 + j24.25 | 67.29 + j7.53 | 60.39 − j7.09 | 51.36 − j19.16 | 40.76 − j28.33 | −12.52 − j29.91 | 4.01 + j17.73 |

- **Induced currents**: the network equations V_i = Σ_j Z_ij·I_j in crest currents, with V = 0 on every parasitic
  element (a continuous wire) and V·sin(kl/2) on the driven one (the same power V·I_centre); solved by Gaussian
  elimination with partial pivoting. Feed impedance Z_in = V / I_centre of the driven element.
- **Far field** (current-pattern.js `elementFactor`): E(û) = Σ_i I_m,i·F_i(û_y)·e^{jk·x_i·û_x},
  F(ψ) = [cos(πl cos ψ) − cos πl]/sin ψ with cos ψ = û_y (the element along y).
- **Directivity** D = 4πU_max/P = η·|E_max|²/(π·Re(Iᴴ Z I)) (all elements lossless, so the gain is D). The real part
  of the mutual impedance is exactly the cross term of the radiated power for these currents, so Re(Z_in)·|I_feed|² =
  2P: checked against a brute-force sum of |E|² over the sphere (scipy, 721 × 1440 points; in the tests
  current-pattern.js `sphereIntegral`). The strongest direction lies in the horizontal plane (by the mirror symmetry
  z → −z and the elements' all-round H-plane; checked over the sphere for every preset). dBd = dBi − 2.15 (a λ/2
  dipole, D = 1.6409).

## 3. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `refl` | a reflector | on/off | on |
| `lr` | reflector length (λ) | 0.40 … 0.60, step 0.005 | 0.500 |
| `sr` | reflector spacing behind the driven element (λ) | 0.05 … 0.40, step 0.01 | 0.20 |
| `dirs` | number of directors | 0 … 8 | 1 |
| `ld` | director length, all alike (λ) | 0.38 … 0.55, step 0.005 | 0.445 |
| `sd` | director spacing, each from the one before (λ) | 0.05 … 0.45, step 0.01 | 0.15 |
| `t` | time as ωt (the wave map and the dials) | 0 … 355°, step 5, wraps | 0 |

The driven element is fixed at 0.475 λ, just above resonance (a slider for it would not fit the panel at 1920×1080;
the explanation says that its length tunes out the reactance).

Tie-breaks (tested first):

1. Every number is clamped and put on its grid (0.1 + 0.2 is 0.30); a non-number gives the default. `refl` is true for
   true, 'true', '1' and 1, false for anything else given, the default when missing.
2. Time wraps into [0, 360): 360 is 0, −5 is 355.
3. **The driven element alone** (no reflector, no directors): its own pattern, front and back alike; the main lobe is
   0° (tie-break 4), F/B is not defined (—), the vertical beamwidth is all round (null), the impedance is its own.
   The sliders of absent elements are hidden and change nothing.
4. **Main lobe**: the strongest direction in the horizontal plane on a 0.25° grid over 0 … 180° (the pattern is
   mirrored about the boom), refined by golden section; 0° and 180° are taken as they are. Equal strongest ones
   (relative 1e-9) go to the smaller angle, forward first. Its kind: forward (0°), backward (180°) or to the side.
5. **Beamwidth**: walk out from the main lobe in 0.25° steps to the first direction below half power (a 1e-12 margin),
   then bisect; horizontal both ways in φ, vertical up over the zenith (twice one side, the pattern is the same
   below). null when it never falls to half within 180° ("all round").
6. **Front-to-back** is the main lobe against the opposite direction (φ₀ + 180°), so a beam flipped backwards still
   has a positive F/B and the main-lobe row says "backwards". Below 1e-6 of the main lobe's field the back is a null
   (∞).
7. **Director step**: with two or more directors, each next director's lag behind the one before, wrapped into
   (−180°, 180°], and their mean; the step is *steady* only when every lag is positive. The caption calls it a wave
   running forwards along the boom only for a forward beam with a steady step (a small lead stays a small lead: a
   (0°, 360°) wrap would turn it into a lag of nearly a period).

## 4. Rules (each with a test)

1. **The self impedance** is Balanis 8-60 (λ/2: 73.08 + j42.51 Ω; the table in §2 for 0.47 and 0.475 λ); its reactance
   rises with the length through zero near 0.4725 λ.
2. **The mutual impedance** is the closed form for two λ/2 elements (§2's table, to 1e-3 Ω) and reciprocal for unequal
   lengths; it tends to the self value as d → 0 for R (71.61 at 0.05 λ).
3. **Only the driven element is fed**: Σ_j Z_ij I_j = 0 on every parasitic element (residual < 1e-9).
4. **Power balance**: Re(Z_in)·|I_feed|² = Re(Iᴴ Z I) = the sphere integral of the far field (to 1e-4 relative).
5. **The phase is set by the length**: one parasitic element with the driven one (spacing 0.05 … 0.3 λ): lengthening it
   moves its current's phase steadily back (more lag, −108° … −209° at 0.05 λ for 0.40 … 0.55 λ). Shown in
   (−180°, 180°], it lags while short and leads once past about −180°, and the beam follows the sign: a lagging
   element pulls the beam towards itself (a director), a leading one pushes it away (a reflector); the same rule as
   `antenna-array`'s "the beam turns towards the element that lags". The switch comes at a length that falls with the
   spacing: 0.485 λ at 0.05 λ, 0.475 at 0.1, 0.465 at 0.15, 0.455 at 0.2, 0.445 at 0.25, 0.435 at 0.3 (0.01 λ grid).
   Reflector 0.5 λ at 0.15 λ: 0.669∠+142.3°; director 0.45 λ at 0.1 λ: 0.846∠−147.0°; the same director made 0.52 λ:
   0.601∠+144.2°, the beam backwards.
6. **Forward**: a reflector behind and a director in front each give a forward beam (the presets in §6).
7. **More directors**: with directors tuned for a long boom (0.43 λ at 0.3 λ), the gain rises with every director and
   each adds less than the first: 6.13, 8.61, 9.66, 10.33, 11.59, 12.07, 12.44, 13.35, 13.51 dBi for 0 … 8, and the
   horizontal beam narrows (three elements 63.5°, eight 38.8°).
8. **The feed impedance falls**: every preset with parasitic elements has Re(Z_in) below the driven element alone
   (63.04 Ω), the three-element one 24.90 − j1.03 Ω.
9. **The driven element alone** is a dipole: 0.5 λ gives 73.08 + j42.51 Ω and 2.15 dBi; its pattern has nulls along
   the wire (φ = ±90°).
10. **Wave map** (page): the complex amplitude at a point is Σ_i I_i·F_i·e^{−jk·r_i}·w(r_i), shown as its real part at
    ωt; time shifts every point's phase alike and never changes the model's numbers.

## 5. The page

- **Stage, left: the waves from above** (the horizontal plane, a square of ±max(2.5, boom/2 + 1.8) λ in 0.5 λ steps,
  centred on the middle of the boom). The far-field term of each element, Re{Σ I_i F_i e^{j(ωt − k r_i)} w(r_i)}, with
  w = 1/√(r + λ/2) and the sum times √(r_c + λ/2)/|E_max|, as in `antenna-array` (the 1/r spreading evened out). The
  elements drawn as bars of their true length on the boom (the fishbone seen from above), labelled R, Z/DE, D1 …
  Under it one dial per element: the phasor of its centre current now (hand length ∝ amplitude, angle ωt + phase),
  its name, amplitude and phase.
- **Middle: the far field** in dBi on a fixed scale (outer ring the smallest of 10, 15, 20 dBi at least 0.5 dB
  above the gain; centre 30 dB below), horizontal plane (E-plane) above, vertical plane through the boom (H-plane) below,
  each with a λ/2 dipole dashed for comparison, the main-lobe spoke and the half-power lines.
- **Right: the readout** (main lobe, gain dBi and dBd, F/B, both beamwidths, the feed impedance and the driven element
  alone, the boom length) and **the gain for 0 … 8 directors** (bars, the present one marked): the diminishing
  returns.
- **Time**: Play (P), → / PgDn and ← / PgUp 15°, Home/End, a scrubber in the bar, as in `antenna-array`. A preset
  stops the clock.
- **Captions** (two to five sentences): where the waves add (forward, backward, to the side), the reflector's and the
  director's (or directors') induced current with its length against resonance, the step along several directors
  against the free-space phase over the spacing (only for a forward beam with a steady step, tie-break 7; otherwise
  that the currents do not fall behind step by step), the back (F/B or null), the gain and the feed impedance against the
  driven element alone; with two or more directors what the first and the last one added (signed changes when the first one lowers the
  gain). A beam to the side is given as its angle from forward.

## 6. Presets (numbers from the model, checked by the scipy script)

| # | id | layout | gain | F/B | Z_in (Ω) | HPBW h / v | currents (R, DE, D…) |
|---|---|---|---|---|---|---|---|
| 1 | `dipole` | DE 0.475 alone | 2.11 dBi | — | 63.04 + j3.98 | 79.2° / all round | 1 |
| 2 | `reflector` | R 0.5 at 0.15 | 6.45 dBi | 10.67 dB | 36.35 + j30.85 | 69.0° / 133.0° | 0.669∠142.3°, 1 |
| 3 | `director` | D 0.45 at 0.1 | 6.27 dBi | 13.26 dB | 25.47 − j21.90 | 69.7° / 137.6° | 1, 0.846∠−147.0° |
| 4 | `three` | R 0.5 at 0.2, D 0.445 at 0.15 | 8.13 dBi | 26.10 dB | 24.90 − j1.03 | 63.5° / 100.8° | 0.286∠134.3°, 1, 0.770∠−140.8° |
| 5 | `long` | R 0.5 at 0.2, 6 × D 0.43 at 0.3 | 12.44 dBi | 12.12 dB | 44.98 + j33.22 | 38.8° / 43.0° | director step 122.5° (free space 108°) |
| 6 | `toolong` | D 0.52 at 0.1 | 5.81 dBi, **backwards** | 10.43 dB | 28.12 + j23.65 | 70.0° / 146.0° | 1, 0.601∠144.2° |

The driven element is 0.475 λ (near resonance). Also checked: the default (`three`) trades gain for
F/B: R 0.5 at 0.2 with D 0.45 at 0.2 gives 9.13 dBi but only 12.55 dB F/B; a 0.44 λ reflector at 0.1 λ turns the
beam backwards (5.46 dBi). The largest gain found in the ranges is 15.19 dBi (R 0.485 at 0.17, 8 × D 0.43 at 0.42;
found by the reviewer, confirmed by scipy), so the plots' outer ring steps to 20 dBi there; the presets use 10 and 15.

## 7. Misconceptions targeted

- "The parasitic elements are fed through the boom" / "they do nothing without a cable": they carry currents of the
  same order as the driven one, induced by its field (the dials).
- "A reflector reflects like a mirror because it is behind": it is the length (and so the phase) that makes it a
  reflector; the same wire in front, made longer, sends the beam backwards (preset 6).
- "More directors, always more gain, in proportion": each adds less (preset 5, the bars), and with untuned equal
  directors the gain even dips (the default's bars).
- "A Yagi is a 73 Ω antenna like a dipole": the coupling pulls the feed resistance down to 20–45 Ω.
- "Best gain and best F/B come together": the three-element layouts trade one for the other (§6).

## 8. Out of scope

Moment-method currents (the induced-EMF method assumes the sinusoidal shape; it overestimates gain by roughly half a
dB to a dB against a moment-method solution *(check)*); tapered directors; a folded dipole or a matching network;
element staggering, boom effects and losses; the ground (`ground-image`); bandwidth and frequency sweeps; stacking.
