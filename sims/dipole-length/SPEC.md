<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dipole-length: specification

Task `docs/tasks/w3/dipole-length.md`, catalogue `ant-dipole-length` (§4.15; shared model 3 of §5.26, "the pattern of a
set of currents", first user). Class: explorer.

**One concept.** The current on a centre-fed thin dipole is a standing wave, zero at the open ends. At λ/2 the feed
sits at a current maximum, the pattern is a slightly flattened figure eight (2.15 dBi) and the radiation resistance is
about 73 Ω. Shorter, the current is small everywhere, the pattern barely changes, but the radiation resistance falls with
the square of the length (≈ 197·(L/λ)² Ω, see §6), so the same feed current radiates little. At a full wavelength the
feed sits at a current minimum (a very high feed impedance) and the halves' currents still add broadside. At 3λ/2 a
reversed segment splits the pattern into lobes.

## 1. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `len` | the dipole's whole length L in wavelengths | 0.10 … 2.00, step 0.01 | 0.50 |
| `t` | time as the phase ωt of the current | 0 … 355°, step 5, wraps | 0 |

Tie-breaks (tested first):

1. `len` is clamped to 0.10 … 2.00 and rounded to the 0.01 grid (so 0.1 + 0.2 is 0.30 and 0.505 is 0.51); a non-number
   gives the default 0.50.
2. Time wraps into [0, 360): 360 is 0, −5 is 355; a non-number gives 0.
3. Along the wire's axis (sin θ = 0) the element factor is exactly 0 (its limit), never NaN.
4. At L = λ and 2λ the feed current sin(πL) is rounding residue (1.2·10⁻¹⁶); below 1e-12 it is exactly 0, the feed
   resistance is `null` (shown as ∞) and the feed is flagged `feedOpen`.
5. Feed resistance above 2 kΩ is flagged `feedHigh` (the caption adds the thin-wire caveat); above 10 kΩ `feedHuge` and shown as "> 10 kΩ": near λ and 2λ the thin-wire sinusoidal
   current is no longer exact (a real wire there gives some kΩ), so the page does not print a model artefact like 2 MΩ.
6. A point exactly at the feed (s = 0) or at an end is not a reversal: a segment is "reversed" only where the current
   has the opposite sign to the end segments, strictly inside the wire. At exactly L = λ there is none.
7. The main lobe is reported as the angle from the wire in 0 … 90° (the pattern is symmetric about broadside). When two
   lobes are equally strong (within a relative 1e-9) the one closer to broadside wins.
8. Zero power has no dB value: dB of 0 is `null` (−∞ is not JSON).

## 2. Model (`current-pattern.js`, pure, promotable: catalogue §5.26 model 3)

Units: lengths in wavelengths, k = 2π. An element is `{ len, pos: [x,y,z], dir: [x,y,z] unit, amp, phase (degrees) }`,
centre-fed, with the sinusoidal current of a thin wire (Balanis §4.5, eq. 4-56 *(check eq. number)*):

  I(s) = amp·e^{j·phase}·sin(k(L/2 − |s|)),  −L/2 ≤ s ≤ L/2.

`amp` is the crest of the standing wave (I_m), not the feed current. The feed current is I_m·sin(kL/2) = I_m·sin(πL).

- `current(len, s)`: sin(2π(L/2 − |s|)); 0 outside the wire.
- `elementFactor(len, cosψ)`: the far-field factor at angle ψ from the element's axis (Balanis eq. 4-58a *(check)*):
  F(ψ) = [cos(πL·cos ψ) − cos(πL)] / sin ψ, with E_θ = jη·I_m·e^{−jkr}/(2πr)·F. 0 when sin ψ < 1e-12 (tie-break 3).
- `field(elements, r̂)`: the complex far-field vector Σ I_m·e^{j·phase}·F(ψ)·(−t/|t|)·e^{jk·pos·r̂}, t = â − (â·r̂)r̂ the
  element's transverse part (θ̂ for an element along z is −t/|t|). Used here for one element; the sum and the position
  phase are for `ant-array-phasing`, `ant-ground-image` and `ant-yagi`.
- `axialIntegral(len, n)`: ∫₀^π F(θ)² sin θ dθ by Simpson's rule (n even, default 2000). For λ/2 this is Cin(2π)/2 =
  1.2188.
- `sphereIntegral(elements, nθ, nφ)`: ∫|E|² dΩ over the sphere (Simpson in θ, midpoint in φ), for any set.
- `resistanceAtCrest(len) = η/(2π)·axialIntegral(len)` (= 2P/I_m²; Balanis eq. 4-70a closed form, checked against it);
  `resistanceOf(elements) = η/(4π²)·sphereIntegral(elements)`, the same thing for any set (one element: equal).
- `directivity(len) = 2·F_max² / axialIntegral(len)`, F_max over a 0.05° grid (Balanis eq. 4-75 *(check)*).

η = 376.730313668 Ω (μ0·c, CODATA 2018).

## 3. Rules

1. **Standing wave, zero at the ends.** I(±L/2) = 0 for every L; symmetric, I(−s) = I(s). The crest (|I| = 1) lies λ/4
   from each end; it is on the wire only when L ≥ λ/2.
2. **Feed current** I_feed = sin(πL) (signed, over the crest): 0.10λ → 0.309, 0.25λ → 0.707, 0.5λ → 1 (the feed sits at
   the crest: a current maximum), λ → 0 (a current minimum, tie-break 4), 1.5λ → −1 (the feed is in the reversed
   segment), 2λ → 0.
3. **The largest current on the wire** I_max = |sin(πL)| for L ≤ λ/2, else 1 (the crest is on the wire).
4. **Reversed segments.** Where sin(2π(L/2 − |s|)) < 0 the current flows against the end segments. They exist only for
   L > λ; at 1.5λ the reversed segment is the middle λ/2 (|s| < λ/4); at 2λ it is |s| < λ/2, between zeros at ±λ/2.
5. **Pattern.** F(θ) in the plane through the wire, null along the wire (θ = 0, 180°). Drawn as field strength over an
   isotropic radiator of the same power, √(D(θ)) with D(θ) = 2F(θ)²/∫F² sin θ dθ.
6. **Directivity and beamwidth** (each checked with a scipy script: quad integration, a 0.05° grid; Balanis Table 4.2
   and §4.6 for 0.5λ, 1λ, 1.25λ, 1.5λ):

   | L/λ | D | dBi | main lobe from the wire | half-power beamwidth |
   |---|---|---|---|---|
   | 0.10 | 1.505 | 1.78 | 90° | 89.5° |
   | 0.50 | 1.641 | 2.15 | 90° | 78.1° |
   | 1.00 | 2.411 | 3.82 | 90° | 47.8° |
   | 1.25 | 3.283 | 5.16 | 90° | 32.6° |
   | 1.50 | 2.226 | 3.48 | 42.6° | 32.8° |
   | 2.00 | 2.529 | 4.03 | 57.4° | 26.7° |

   The short dipole's limit is D = 1.5 (1.76 dBi), sin θ, 90° beamwidth. Half-power beamwidth: the width of the main
   lobe between the angles where F² falls to half its peak (found on the 0.05° grid).
7. **Radiation resistance**, referred to the largest current on the wire: R_rad = R_crest / I_max². **Feed resistance**
   R_feed = R_crest / sin²(πL) (Balanis eq. 4-79 *(check)*): equal to R_rad for L ≤ λ/2, larger beyond, ∞ at λ and 2λ.

   | L/λ | R_crest (Ω) | R_rad (Ω) | R_feed (Ω) |
   |---|---|---|---|
   | 0.10 | 0.191 | 1.999 | 1.999 |
   | 0.25 | 6.716 | 13.43 | 13.43 |
   | 0.50 | 73.08 | 73.08 | 73.08 |
   | 0.75 | 185.7 | 185.7 | 371.4 |
   | 1.00 | 198.9 | 198.9 | ∞ |
   | 1.25 | 106.5 | 106.5 | 212.9 |
   | 1.50 | 105.4 | 105.4 | 105.4 |
   | 2.00 | 259.5 | 259.5 | ∞ |

8. **Short dipole, R ∝ L².** For small L, F ≈ (πL)²/2·sin θ and R_feed → η·π/6·(L/λ)² ≈ 197.3·(L/λ)² Ω (20π² = 197.4 with η rounded to 120π)
   (Balanis eq. 4-37, the triangular current). 0.10λ: 1.97 Ω by the formula, 2.00 Ω from the full model.
   Halving the length about quarters it (0.2λ → 0.1λ: 8.33 → 2.00 Ω). With the same feed current the radiated power ½I²R
   falls with R: a 0.10λ dipole radiates 2.7 % of a half-wave dipole's.
9. **The half-wave reference.** For L ≤ λ/2 the page compares R_feed with the half-wave value: `pctHalf` = R_feed / 73.08.
10. **Real lengths.** At 7.1 MHz λ = 42.22 m; L in metres = L/λ·λ (0.5λ → 21.11 m).
11. **Time.** The current at phase ωt is I(s)·cos ωt (one standing wave: every point swings in step, the reversed
    segments in antiphase). The pattern does not change with time.

## 4. Page

- **Stage, left: the wire and its current.** A vertical wire at a fixed scale (2λ fills the height), the feed in the
  middle; beside it the current now, I(s)·cos ωt, as a filled curve to the right for the end segments' direction and to
  the left for reversed segments (also hatched differently and with arrows down the wire), the standing-wave envelope
  ±|I(s)| dotted, and its continuation λ/4 past each end, faint, to show the ends sit on zeros. Labels: "I = 0" at the
  ends, the feed current in per cent of the crest, a λ/2 scale bar.
- **Stage, middle: the pattern in the plane through the wire.** Polar, the wire vertical: √D(θ) solid, the isotropic
  radiator of the same power as a dotted circle (radius 1), the short dipole √1.5·sin θ dashed; the main lobe's angle
  and its half-power lines.
- **Right: readout** (length in λ and in metres at 7.1 MHz, feed current, R_rad, R_feed, directivity D and dBi, main
  lobe, beamwidth) and **a plot** of R_rad and R_feed against L, log scale 1 Ω … 10 kΩ, with 197·(L/λ)² dotted and a
  marker at the current L.
- **Time**: play (P), scrubber in the transport bar, → / PgDn and ← / PgUp ±15°, Home 0°, End 355°; reduced motion
  jumps 45° a second (as in `dipole-field` and `polarization`).
- **Contrast on the stage**: short against half-wave (the pattern barely changes, R falls by 37×), half-wave against
  full-wave (the feed moves from a crest to a zero), full against 3λ/2 (a reversed segment, lobes).

## 5. Presets (keys 1–6)

| id | len | What to see |
|---|---|---|
| `short` | 0.10 | a small triangle of current (31 % of the crest at the feed); pattern ≈ sin θ, 1.78 dBi; R ≈ 2.0 Ω (197·0.01 = 1.97) |
| `half` | 0.50 | the feed at the crest; 73.1 Ω; 2.15 dBi; beamwidth 78° against the short dipole's 90° |
| `full` | 1.00 | the feed at a zero: feed resistance ∞ (very high); halves in phase; 3.82 dBi; 48° |
| `ext` | 1.25 | near the highest directivity (the peak is 3.296, 5.18 dBi, at about 1.27 λ): 5.16 dBi, 32.6°, small side lobes (−10.3 dB); a reversed bit by the feed. The broadside lobe stays the main one up to 1.44 λ |
| `three` | 1.50 | the reversed middle λ/2: main lobes at 42.6° from the wire, broadside 2.9 dB down; 105 Ω at the feed |
| `two` | 2.00 | a broadside null, F(90°) = 0: two lobes on each side of the wire, at 57.4° from it; 4.03 dBi; the feed at a zero |

## 6. Legend, captions, misconceptions

- Legend: current now (filled), reversed current (hatched), standing wave envelope (dotted), pattern (solid), isotropic
  (dotted ring), short dipole (dashed).
- Caption, three sentences: the current (by range: L < λ/2, = λ/2, between, = λ, > λ with reversed segments); the
  pattern (one broadside lobe with D and beamwidth, or split lobes with the main lobe's angle); the resistance (short:
  R against 197·(L/λ)² and the share of a half-wave's power for the same feed current; λ/2: 73 Ω; longer: R_rad and the
  feed resistance, ∞ or "> 10 kΩ" at a zero).
- Misconceptions targeted: "a shorter dipole has a much weaker, rounder pattern" (the pattern barely changes: 1.78 against
  2.15 dBi; what falls is R); "the current is the same all along the wire" (zero at the ends); "a full-wave dipole is two
  half-waves, so 73 Ω at the feed" (the feed is at a zero); "longer is always more gain" (5.2 dBi at 1.25λ, then it falls
  as lobes split); "the 790·(L/λ)² short-dipole rule" (that is a uniform current, e.g. with end loading; open ends make a
  triangle and a quarter of that, §8).

## 7. Out of scope

Reactance, resonance and the end-effect shortening (a real half-wave dipole is cut about 5 % short *(check)*), loading
coils, losses and efficiency (`ant-small-antenna`); feed lines and SWR (`swr`); gain against dBd, ERP, EIRP
(`ant-gain-directivity`); ground (`ant-ground-image`); two elements (`ant-array-phasing`); the near field (`dipole-field`).
