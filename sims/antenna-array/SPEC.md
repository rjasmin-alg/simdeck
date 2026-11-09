<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# antenna-array: specification

Task `docs/tasks/w3/antenna-array.md`, catalogue `ant-array-phasing` (§4.15; shared model 3 of §5.26, "the pattern of a
set of currents", the array part). Class: explorer. The task's "Model and presets" section was empty; this file fills
it.

**One concept.** Identical antennas fed together add their fields. In each direction two things set how they add: the
path difference d·cos φ and the feed phase step between neighbours. The array factor AF multiplies one element's
pattern. λ/2 apart in phase gives a broadside beam, λ/2 apart in antiphase an end-fire one, λ/4 apart fed 90° apart a
cardioid with a null at the back. Changing the phase steps steers the beam; a spacing over λ lets the path make up a
whole extra period, so extra full-size lobes (grating lobes) appear; more elements make the beam narrower.

## 1. The array and the conventions

- n identical **vertical half-wave dipoles** (thin wire, sinusoidal current, `current-pattern.js` from `dipole-length`)
  stand in a horizontal line along x, spacing d (in λ), centred on the origin. Element m = 0 … n−1 runs from −x to +x.
- All crest currents are equal in size; element m **lags element 0 by m·α** (α = `lag`, degrees): I_m = e^{−j·m·α}.
  The currents are imposed (a feed network forces them); mutual coupling changes the feed impedances, not the pattern
  of the given currents (out of scope, §8).
- Azimuth φ is measured in the horizontal plane from the line's +x end (0°), counter-clockwise; 90° is broadside. The
  pattern of a line is symmetric about the line (φ and −φ are alike), so beam directions are read in 0 … 180°.
- In a direction at angle γ from the line (cos γ = r̂·x̂; in the horizontal plane γ = φ) the neighbours' fields differ in
  phase by ψ = k·d·cos γ − α (k = 2π/λ; Balanis's ψ = kd cos γ + β with **β = −α**; the catalogue's δ is β).

## 2. Model (array-factor.js, pure, promotable next to current-pattern.js)

- **Array factor** (Balanis §6.3, eq. 6-10 *(check eq. number)*; Kraus, arrays of n isotropic sources):
  AF(ψ) = |Σ_{m=0}^{n−1} e^{jmψ}| = |sin(nψ/2)/sin(ψ/2)|, computed by the direct sum (no 0/0); n = 2: 2·|cos(ψ/2)|.
  Its largest value n is reached where ψ = 2πm.
- **Pattern multiplication:** the far field of the set (current-pattern.js `field`, positions and phases) is the element
  factor F(θ) times the array factor, with a common phase. In the horizontal plane a vertical dipole is all round
  (F = 1), so there the pattern is AF alone. Tested against `field` (rule 2).
- **Mutual resistance** of two parallel side-by-side λ/2 elements at spacing d, referred to crest currents:
  R₁₂(d) = η/(2π)·∫₀^π F(θ)²·J₀(k·d·sin θ)·sin θ dθ, the φ-average of the cross term of |E|² (Simpson, 2000 intervals;
  J₀ by the trapezoidal rule over its integral, exact to 1e-15). R₁₂(0) = R₁₁ = 73.08 Ω. Checked against the
  closed form with cosine integrals (Balanis eq. 8-68 *(check eq. number)*; Kraus's table of mutual resistance):

  | d/λ | 0 | 0.25 | 0.5 | 1 |
  |---|---|---|---|---|
  | R₁₂ (Ω) | 73.08 | 40.76 | −12.52 | 4.01 |

- **Radiated power** as a resistance referred to a unit crest current on each element:
  R_P = Σ_a Σ_b cos((a−b)α)·R₁₂(|a−b|·d) = n·R₁₁ + 2·Σ_{p=1}^{n−1} (n−p)·cos(pα)·R₁₂(p·d).
- **Directivity** D = 4π·U_max/P = η·AF_max²/(π·R_P) (the element's F is 1 on the horizon, its maximum, and AF reaches
  its largest value in the horizontal plane too). One element: 1.6409 = 2.15 dBi. Checked against a brute-force sum of
  |F·AF|² over the sphere (scipy, 3000 × 4000 points) and, in the tests, against current-pattern.js `sphereIntegral`.
  "Over a dipole" is D/1.6409 in dB: the array against one dipole fed the same total power.

## 3. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `n` | number of elements | 1 … 8, step 1 | 2 |
| `d` | spacing in wavelengths | 0.05 … 2.00, step 0.05 | 0.50 |
| `lag` | phase step α: each element lags the one before by α | −180 … 180°, step 5 | 0 |
| `t` | time as ωt (the wave map and the feed dials) | 0 … 355°, step 5, wraps | 0 |

Tie-breaks (tested first):

1. Every param is clamped and put on its grid (0.1 + 0.2 is 0.30 for `d`); a non-number gives the default. `lag` −180 is
   180 (the same feed).
2. Time wraps into [0, 360): 360 is 0, −5 is 355; a non-number gives 0.
3. **One element**: AF = 1 everywhere, `d` and `lag` change nothing (the page hides them); no main beam (`all round`),
   no grating or side lobes, no beamwidth, F/B not defined (—), D = the dipole's.
4. **A full-size lobe on the line counts**: where |cos φ| = 1 within 1e-9 (d = λ in phase: grating lobes at 0° and
   180°; λ/2 in antiphase: the main lobe at 0° and its twin at 180°).
5. **The main lobe** is the full-size lobe with m = 0, the direction the phase steers to:
   cos φ₀ = α/(360°·d/λ). When |α| > 360°·d/λ (**over-steered**) no direction has ψ = 0 (and no other full-size lobe is
   visible either, since then d < λ/2): the main lobe is the strongest direction on a 0.05° grid, refined by golden
   section; an end of the line (0° or 180°) is taken as it is. Equal strongest ones (relative 1e-9) go to the smaller
   φ (AF(ψ) = AF(2π − ψ), so equal maxima occur, also at unrelated angles: 7 × 0.35 λ with 170° has them at 40.4° and
   156.9°). Every local maximum is refined before the comparison. Its level below n is reported (`mainDb`).
6. **No half-power point**: when, walking either way from the main lobe, the pattern does not fall below half
   (with a 1e-12 margin, so touching half exactly does not count) within 180°, the beamwidth is `null` ("all round").
   The walk passes the ends of the line by the mirror symmetry, so a broad lobe on the line can be wider than 180°
   (two elements λ/4 apart with 45°: 240°).
7. **A side lobe** is a local maximum of AF in 0 … 180°, refined to its peak (an end counts when it is not below its
   neighbour: the pattern is mirrored there, and flat) that is below the main lobe (relative 1e-7). Refined, the main
   lobe itself, every full-size lobe and an over-steered twin are as strong as the main lobe, so none of them is a side
   lobe. Its level is relative to the main lobe.
8. **Back**: the level in the opposite direction, φ₀ + 180°. Below 1e-6 of the main lobe it is a null: `backDb` null,
   `backNull` true (F/B shown as ∞). For a broadside beam the opposite direction is the beam's mirror (0 dB, "both
   sides").

## 4. Rules (each with a test)

1. **The array factor** is |sin(nψ/2)/sin(ψ/2)|, equal to the direct sum; n = 2 gives 2·|cos(ψ/2)|; its maximum n is at
   ψ = 2πm and nowhere else.
2. **Pattern multiplication**: |current-pattern.js field| of the elements equals |F|·AF in every direction (random
   directions, 1e-12).
3. **Steering**: the main lobe is at cos φ₀ = α/(360·d), and AF there is n; the beam turns towards the lagging end
   (α > 0 → φ₀ < 90°).
4. **The three pairs**: λ/2 in phase: beam at 90°, nulls along the line (AF(0°) = 0), HPBW 60°; λ/2 in antiphase:
   beam along the line (0° and 180° alike), null at 90°, HPBW 120°; λ/4 with 90°: beam at 0°, null at 180°, HPBW 180°.
5. **Grating lobes**: the full-size lobes are ψ = 2πm in the visible region; their number in 0 … 180° is the number of
   integers m with |360m + α| ≤ 360·d (tie-break 4); none in phase below d = λ; at d = 1.5λ in phase two, at
   48.19° and 131.81° (cos φ = ±2/3); a steered beam gets its first one at d = λ/(1 + |cos φ₀|).
6. **More elements, narrower beam**: in phase at λ/2 the beamwidth falls strictly with n (2: 60°, 4: 26.3°,
   8: 12.80°) and the side lobe tends to −13.3 dB (4: −11.30 dB, 8: −12.80 dB).
7. **Mutual resistance** as in §2's table (to 0.01 Ω of the Ci form).
8. **Directivity** = the brute-force sphere integral (to 1e-4 relative); one element 1.6409.
9. **Over-steered** (|α| > 360·d): no full-size lobe, the strongest direction is below n (`mainDb` < 0), e.g. two
   elements λ/4 apart in antiphase: −3.01 dB at both ends alike, 5.69 dBi.
10. **Wave map** (page): the complex amplitude at a point is Σ_m w(r_m)·e^{−j(k·r_m + m·α)}, shown as its real part at
    ωt; time shifts every point's phase alike, so it never changes the pattern (the model's state does not depend on t
    except for t itself).

## 5. The page

- **Stage, left: the waves from above** (the horizontal plane, ±max(3, (n−1)d/2 + 2.5) λ), the instantaneous field
  Re{A·e^{jωt}} of the far-field term of each element (no near-field terms). Each element's amplitude is 1/√(r + λ/2)
  and the sum is multiplied by √(r_centre + λ/2)/n, so a beam keeps its brightness out to the frame (the 1/r spreading
  is evened out; said in the explanation). Diverging colour: + towards `--c1`, − towards `--c5`, zero (cancelled) the
  background, so a null is blank in every theme and in grayscale. The elements are dots (numbered when ≥ 1.5 rem
  apart), short marks at the frame's edge show the main beam (solid) and grating lobes (dotted), a bar shows λ. Under
  it one dial per element: the phasor of its current now (ωt − m·α) and its lag m·α, unwrapped.
- **Middle: the far field in the horizontal plane** as field strength over one dipole fed the same total power,
  AF(φ)/AF_max·√(D/D_dipole), the dipole a dashed circle. Scale top: the smallest of 1.5, 2, 2.5, 3, 3.5, 4.5 (field
  ratio) at least 3 % above the largest (the largest in the ranges is 4.06, n = 8, d = 0.9λ in phase). The line of
  elements drawn along 0°–180°; the main beam a solid spoke with its angle; half-power lines dashed; grating lobes
  marked with a diamond; the strongest side lobe labelled when it is clear of the centre.
- **Right: the readout** (main beam, beamwidth, grating lobes, side lobe, F/B, directivity in dBi and over a dipole),
  and **the vertical plane through the main beam** (azimuth φ₀; 90° for one element): the dipole's F (dashed), AF/n
  (dotted) and their product (solid), relative field: the multiplication itself.
- **Time**: Play (P) runs ωt round the period every 70 ms in 5° steps (1 s and 45° under reduced motion), → / PgDn and
  ← / PgUp step 15°, Home/End to 0° and 355°, a scrubber in the bar; as in `dipole-length`. A preset stops the clock.
- **Captions** (two to five sentences): how the waves come into step in the main direction (the path difference that
  makes up the phase step); for a beam off the line and off broadside, its mirror image at −φ₀ (a line cannot tell its
  sides apart); the back: both sides (broadside), a null (two elements: half a period; more: the n phases spread evenly
  round the circle), a full-size lobe (on the line: the end-fire twin, the first grating lobe; elsewhere a grating lobe
  at the back), as strong (over-steered), or the F/B; the other grating lobes, or a lobe of more than −6 dB growing at
  an end; the beamwidth and the directivity.

## 6. Presets (numbers from the model, checked by the scipy script)

| # | id | n | d | α | main | HPBW | D | over a dipole | what to see |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `broadside` | 2 | 0.5 | 0 | 90° | 60.0° | 3.961, 5.98 dBi | +3.83 dB | in step across the line, cancel along it |
| 2 | `endfire` | 2 | 0.5 | 180 | 0° (and 180°) | 120.0° | 2.802, 4.47 dBi | +2.32 dB | along the line both ways, null across |
| 3 | `cardioid` | 2 | 0.25 | 90 | 0° | 180.0° | 3.282, 5.16 dBi | +3.01 dB | a null at the back |
| 4 | `steer` | 4 | 0.5 | 90 | 60° | 30.9° | 6.945, 8.42 dBi | +6.27 dB | the phase alone turns the beam 30° off broadside; side lobe −11.3 dB |
| 5 | `grating` | 4 | 1.5 | 0 | 90° | 8.7° | 6.791, 8.32 dBi | +6.17 dB | two more full-size lobes at 48.2° and 131.8° |
| 6 | `eight` | 8 | 0.5 | 0 | 90° | 12.8° | 17.28, 12.37 dBi | +10.22 dB | a narrow beam, side lobes −12.8 dB |

Also checked (scipy): two elements λ/4 in antiphase (over-steered) 3.710, 5.69 dBi, −3.01 dB at both ends; two at
0.75λ in phase 4.740, 6.76 dBi with a −3.01 dB lobe growing at the ends; two at λ in phase 3.111, 4.93 dBi with grating
lobes on the line; eight at λ/4 with 90° (ordinary end-fire) 9.909, 9.96 dBi, HPBW 78.0°.

## 7. Misconceptions targeted

- "Two antennas give twice the power everywhere": the power is the same; it is moved into the beam and out of the nulls
  (+3 dB in the beam, nothing across a null).
- "To point the beam you must turn the antennas": the phase alone steers it (preset 4).
- "More spacing is always better": past λ the beam splits into several full-size lobes (preset 5).
- "A line array beams one way": a broadside line beams to both sides; one-way needs the end-fire phasing (presets 2, 3).

## 8. Out of scope

Mutual coupling and the feed network (the induced currents are `ant-yagi`); unequal amplitudes (binomial or tapered
arrays); the ground and its image (`ant-ground-image`); elements other than vertical half-wave dipoles; planar arrays;
the Hansen–Woodyard end-fire condition (an over-steer that raises D is visible but not named); bandwidth.
