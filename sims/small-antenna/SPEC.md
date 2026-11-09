<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# small-antenna: specification

Task `docs/tasks/w3/small-antenna.md`, catalogue `ant-small-antenna` (§4.15; shared model 3 of §5.26, the last user).
Class: explorer. Builds on `dipole-length` (the sinusoidal current, its radiation resistance) and copies `yagi`'s
`mutual-impedance.js` for the self impedance (COMMON.md §6).

**One concept.** A dipole much shorter than λ/2 has a tiny radiation resistance and a large capacitive reactance. A
loading coil cancels the reactance but adds loss resistance, so the efficiency R_rad / (R_rad + R_loss) falls fast as
the antenna shrinks; and the energy stored near it rises against the energy radiated (a higher Q), so the band in
which the SWR stays low narrows. Small, efficient and broadband: pick two.

## 1. The situation

- One centre-fed dipole of **copper wire 2 mm thick** (radius a = 1 mm), length L, at **f₀ = 7.1 MHz** (λ = 42.22 m,
  the 40 m band, as in `dipole-length`). The thin-wire sinusoidal current I(s) = I_m·sin(k(L/2 − |s|)).
- **Centre loading**: a coil in series at the feed (drawn in the feed line next to the gap, so the antenna keeps its
  true scale), tuned so the reactance at the feed is zero at f₀.
- **Matching**: an ideal, frequency-independent transformer turns the tuned resistance R_in(f₀) into the line's 50 Ω.
  So the SWR is 1 at f₀ whenever the coil is on, and the SWR curve depends only on Z(f)/R_in(f₀).
- The transmitter offers **100 W** at f₀.

## 2. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `len` | whole length L in wavelengths at f₀ | 0.05 … 0.48, step 0.01 | 0.10 |
| `coil` | loading coil on | true / false | true |
| `qc` | the coil's quality factor | 50, 100, 200, 400 or `ideal` (lossless) | 200 |
| `t` | time as the phase ωt | 0 … 355°, step 5, wraps | 0 |

The slider stops at 0.48 λ because the 2 mm wire is resonant at 0.4872 λ (§4 rule 2): up to there the antenna is
capacitive and the coil is a positive inductance.

Tie-breaks (tested first):

1. `len` is clamped to 0.05 … 0.48 and rounded to the 0.01 grid (0.1 + 0.2 is 0.30, 0.105 is 0.11); a non-number gives
   0.10.
2. `qc` that is not one of the five choices (also `'200'` as a string is accepted as 200) gives 200. `coil` takes
   true, `'true'`, `'1'`, 1 as on; everything else is off; missing gives the default (on).
3. Time wraps into [0, 360) and snaps to the 5° grid; a non-number gives 0.
4. The coil reactance is X_L = max(0, −X_ant): never a negative coil. Over the whole slider X_ant < 0, so X_L > 0.
5. Without the coil (`coil` off) there is no coil loss and no tuning: R_coil = 0, X_L = 0; the transformer still turns
   R_in(f₀) = R_rad + R_wire into 50 Ω, so the reactance alone sets the SWR. Q, the bandwidth and the band edges are
   `null` (the antenna is not tuned; Q of an untuned antenna is not shown), the stored-energy split is not drawn.
6. An SWR whose |Γ| is within 1e-12 of 1 is `null` (shown as ∞); every finite SWR is kept (1.29 million without the
   coil at 0.1 λ).
7. The band edges are where SWR = 2, searched outward from f₀: the offset doubles from f₀·10⁻⁵ until SWR > 2 (the last
   offset tried is f₀/2 itself), then bisection to 10⁻⁹·f₀. An edge not found within f₀/2 is `null` and so is the bandwidth (never reached on
   the slider: the widest band is 413 kHz).
   (Fake impedances in the tests cover the null cases.)
8. Equal values do not occur in this model's choices; formatting rounds (η under 0.1 % shows two significant digits).

## 3. Model (`loaded-antenna.js`, pure, promotable; Si, Ci and the self impedance from `mutual-impedance.js`)

Units: lengths in wavelengths at the frequency in question, resistances in Ω, frequencies in Hz. η₀ = 376.730313668 Ω.

- `dipoleImpedance(len, a)`: the feed impedance of a thin centre-fed dipole, length `len` and radius `a` in λ:
  Z_crest / sin²(π·len), Z_crest by Balanis eq. 8-60a/b (the induced-EMF self impedance, `mutual-impedance.js`
  `selfImpedance`), checked against direct quad integration of the far field for R and against the short-dipole
  formula for X *(check eq. numbers; the book was not at hand, numbers recomputed with scipy)*.
- `wireLoss(len, a, Rs)`: the copper loss referred to the feed, R_s/(2π·a)·∫I²ds / I_feed²
  = R_s/(2π·a)·[L/2 − sin(2πL)/(4π)] / sin²(πL) (Balanis §2.14, the ohmic loss of a thin wire with a known current,
  *(check section)*). R_s = √(π·f·μ₀/σ), σ = 5.8·10⁷ S/m: R_s = 0.6952 mΩ at 7.1 MHz.
- `surfaceResistance(f, σ)`.
- `chuQ(ka) = 1/(ka)³ + 1/(ka)`: Chu's lower bound on the Q of any antenna inside a sphere of radius a (Chu 1948, in
  the corrected form of McLean 1996; "simplified": one mode, the bound only). Here the sphere holds the dipole, radius
  L/2, so ka = π·L/λ.
- `system(o)`: the tuned antenna as a function of frequency: o = { len, radiusM, f0, coil, qc } →
  { rRad, xAnt, rWire, xCoil, rCoil, rIn, z(f) }. At frequency f the electrical length is len·f/f₀ and the radius
  radiusM·f/c; the coil's reactance scales with f (X_L·f/f₀); **the two loss resistances are held at their f₀ values**
  (over the few per cent of band that matter this changes no printed digit).
- `swr(z, rIn)`: Γ = (z/rIn − 1)/(z/rIn + 1), SWR = (1 + |Γ|)/(1 − |Γ|); `gamma2` = |Γ|².
- `qOf(sys, f0)`: Q = f₀·|dZ/df|/(2·R_in) at f₀, with a central difference, h = 10⁻⁶·f₀ (Yaghjian & Best 2005, the Q of a
  tuned antenna from its impedance, Q_Z).
- `bandEdges(sys, f0, s)`: the frequencies where SWR = s on each side of f₀ (tie-break 7).

## 4. Rules

1. **Radiation resistance** (feed) R_rad = Re Z: the same numbers as `dipole-length` (a = 0 there, R does not depend on
   the radius). Short limit 20π²·(L/λ)² ≈ 197·(L/λ)² (Balanis eq. 4-37).

   | L/λ | R_rad (Ω) | 197·(L/λ)² | X_ant (Ω) | −120·(ln(L/2a) − 1)/tan(πL/λ) |
   |---|---|---|---|---|
   | 0.05 | 0.4948 | 0.493 | −4511.8 | −4517.0 |
   | 0.10 | 1.9989 | 1.974 | −2451.8 | −2457.8 |
   | 0.15 | 4.5736 | 4.441 | −1655.0 | −1662.8 |
   | 0.20 | 8.3281 | 7.896 | −1203.5 | −1213.7 |
   | 0.25 | 13.431 | 12.34 | −895.5 | −908.6 |
   | 0.30 | 20.131 | 17.77 | −659.5 | −676.0 |
   | 0.48 | 64.937 | 45.5 | −23.58 | — |

2. **Reactance** X_ant is capacitive (negative) over the whole slider, falls in size roughly as 1/L, and crosses zero at
   **L = 0.48716 λ** (R = 67.75 Ω): the resonant length of this wire. The last column (Balanis / Schelkunoff's
   short-dipole approximation *(check source and number)*) agrees within 0.5 % up to 0.15 λ and 1 % up to 0.2 λ.
3. **Wire loss** R_wire: 0.0781 Ω at 0.05 λ, 0.1578 Ω at 0.1 λ, 0.4244 Ω at 0.25 λ, 1.0789 Ω at 0.48 λ (scipy quad of
   ∫I² against the closed form).
4. **The coil** X_L = −X_ant (tie-break 4), inductance L_c = X_L/(2π·f₀): 54.96 µH at 0.1 λ, 101.14 µH at 0.05 λ,
   0.529 µH at 0.48 λ. Its loss R_coil = X_L/Q_c (0 for `ideal`): 12.26 Ω at 0.1 λ, Q_c 200.
5. **Efficiency** η = R_rad / R_in, R_in = R_rad + R_wire + R_coil. Without the coil the same η applies to the power
   that gets in (R_coil = 0), but almost none gets in (rule 9).
6. **Q** = f₀·|Z′(f₀)|/(2·R_in) (Yaghjian & Best). For a series-tuned circuit it is (stored energy)·ω / (power lost),
   so per cycle the antenna radiates 2π·η/Q and heats 2π·(1 − η)/Q of its stored energy. The **radiation Q**,
   Q_rad = Q/η, does not depend on the coil.
7. **Bandwidth** = f_hi − f_lo where SWR ≤ 2 (tie-break 7). For a tuned series circuit it is f₀·(s − 1)/(Q·√s) =
   0.7071·f₀/Q for s = 2 (Yaghjian & Best eq. 87 *(check eq. number)*); the model's two numbers agree within 0.2 %.
8. **No free lunch: η × bandwidth is fixed by the length.** Since R_rad, X and its slope do not depend on the coil's
   loss, η·BW = 0.7071·f₀/Q_rad for every coil (within 0.1 %): 0.546 kHz at 0.05 λ, 3.949 kHz at 0.1 λ, 57.67 kHz at
   0.25 λ, 403.4 kHz at 0.48 λ. A better coil moves the antenna along that line: more η, less bandwidth.
9. **Without the coil** the transformer still matches R_rad + R_wire, so z = 1 + jX/R and the SWR at f₀ is about (X/R)²: 1.29·10⁶ at 0.1 λ, 4179 at 0.25 λ, 1.43 at 0.48 λ (almost resonant); the power that gets
   in, 1 − |Γ|², is 3.1·10⁻⁶ of the 100 W at 0.1 λ (0.31 mW), 9.6·10⁻⁴ at 0.25 λ.
10. **Chu's limit**: Q_rad ≥ Q_chu over the whole slider (0.1 λ: 1271 against 35.4; 0.05 λ: 9199 against 264; 0.48 λ:
    12.5 against 0.95). The thin wire is far above the limit; the limit is a floor no antenna of that size gets under, and
    as η·BW ≤ 0.7071·f₀/Q_chu it is drawn as a line on the trade-off chart.
11. **Power** of the 100 W offered at f₀: in = 100·(1 − |Γ|²); radiated = in·η; coil = in·R_coil/R_in; wire =
    in·R_wire/R_in; reflected = 100 − in.
12. **Time**: the feed current is I·cos ωt; the charge at the tips ∝ sin ωt (+ at the top end when sin ωt > 0); the
    stored energy swings between the coil (magnetic, ∝ cos² ωt) and the electric field around the wire (∝ sin² ωt), the
    two summing to one. The coil's share of the magnetic energy is X_L/(Q·R_in): 96 % at 0.1 λ (Q_c 200), 77 % at
    0.25 λ, about 3 % at 0.48 λ; the bar names the coil only when the share is at least half. Nothing else depends
    on time.
13. **Lengths** in metres at 7.1 MHz: 0.1 λ = 4.22 m, 0.48 λ = 20.27 m.
14. **The SWR curve** across the 40 m band, 7.000 … 7.200 MHz: 401 evenly spaced points plus 121 points on
    f₀ ± 3·BW (so a 0.6 kHz notch is drawn), sorted.

   | L/λ | Q_c | R_coil | η | Q | BW (kHz) | SWR at 7.0 / 7.2 MHz |
   |---|---|---|---|---|---|---|
   | 0.05 | 200 | 22.56 | 2.139 % | 196.76 | 25.515 | 33.2 / 32.3 |
   | 0.05 | ideal | 0 | 86.36 % | 7944.8 | 0.632 | 52 067 / 48 209 |
   | 0.10 | 50 | 49.04 | 3.905 % | 49.63 | 101.15 | 3.72 / 3.65 |
   | 0.10 | 100 | 24.52 | 7.493 % | 95.26 | 52.705 | 9.21 / 8.97 |
   | 0.10 | 200 | 12.26 | 13.866 % | 176.26 | 28.483 | 27.07 / 26.18 |
   | 0.10 | 400 | 6.130 | 24.12 % | 306.65 | 16.372 | 78.2 / 75.1 |
   | 0.10 | ideal | 0 | 92.68 % | 1178.2 | 4.261 | 1149 / 1060 |
   | 0.25 | 200 | 4.478 | 73.26 % | 63.78 | 78.72 | 5.15 / 4.91 |
   | 0.48 | 200 | 0.118 | 98.19 % | 12.24 | 410.86 | 1.42 / 1.40 |

## 5. Page

- **Stage, left: the antenna** at a fixed scale (λ/2 fills the height), with the outline of a λ/2 dipole dotted
  behind it; the coil in the feed line (more turns for more inductance), the current I(s)·cos ωt as a filled shape
  beside the wire, + and − charges at the tips sized by |sin ωt|; under it two bars for the stored energy, magnetic
  (with the coil's share when it holds most of it) and electric (around the wire), that swap with time, and the share radiated and heated per cycle.
- **Middle, top: SWR across the 40 m band** (7.000 … 7.200 MHz, SWR 1 … 4, clipped), the SWR = 2 line, the band where
  SWR ≤ 2 shaded and bracketed with its width; without the coil the curve runs off the top ("off the scale").
- **Middle, bottom: small, efficient, broadband: pick two.** Efficiency (log, 0.5 … 100 %) against the bandwidth (log,
  0.5 … 1000 kHz). For this length a solid line η = K/BW, K = η·BW (rule 8), with a dot for each coil choice and the
  chosen one large; dotted grey lines for 0.05, 0.1, 0.25 and 0.48 λ (labelled); Chu's line for this length dashed;
  the path of the chosen coil over all lengths faint; the 200 kHz width of the band as a vertical line.
- **Right: readout** (length, R_rad, X_ant, coil, coil loss, wire loss, η, Q with the radiation Q against Chu's floor
  (the bound is on Q_rad = Q/η, not on a lossy antenna's Q), bandwidth, SWR at 7.1 MHz) and **where the 100 W go**: a stacked bar radiated / coil / wire / reflected with watts.
- **Time**: play (P), scrubber in the transport bar, → / PgDn and ← / PgUp ±15°, Home 0°, End 355°, reduced motion
  jumps 45° a second (as in `dipole-length`).

## 6. Presets (keys 1–6)

| id | len | coil | qc | What to see |
|---|---|---|---|---|
| `full` | 0.48 | on | 200 | almost resonant: 64.9 Ω, −j23.6 Ω, a 0.53 µH coil; η 98.2 %, Q 12, 411 kHz: the whole band under SWR 1.5 |
| `bare` | 0.10 | off | 200 | 2.00 Ω against −j2452 Ω: SWR 1.3 million, 0.3 mW of 100 W gets in |
| `coil` | 0.10 | on | 200 | 55 µH tunes it; 12.3 Ω of coil loss: η 13.9 %, Q 176, 28.5 kHz |
| `half` | 0.25 | on | 200 | half size: 13.4 Ω, η 73 %, 79 kHz |
| `lossy` | 0.10 | on | 50 | 49 Ω of coil loss: 3.9 %, but 101 kHz: the bandwidth is bought with heat |
| `ideal` | 0.10 | on | ideal | a lossless coil: 92.7 % (only the wire loses), Q 1178, 4.3 kHz |

## 7. Legend, captions, misconceptions

- Legend: current now (filled), loading coil (drawn), half-wave dipole outline (dotted), SWR ≤ 2 band (shaded), this
  length's trade-off line (solid), Chu's limit (dashed). The table shows η without the coil as "of the power that gets in".
- Caption, three parts: (1) R_rad and X_ant at this length ("only" while R_rad < 25 Ω; "almost resonant" when
  |X| < R_rad, 0.47 and 0.48 λ); (2) without the coil: the SWR and the power that gets in ("only" below 1 W), then
  whether any of the band (401 points) has SWR ≤ 2; with it: the coil, its loss, the watts radiated against heated
  (lossless: the wire alone); (3) Q and the bandwidth against the 200 kHz band (the whole band; at least 200 kHz but
  off centre; or less), then η × bandwidth for this length "whatever the coil" (rule 8), or "full size gets both"
  when almost resonant.
- Misconceptions: "a loading coil makes a short antenna as good as a full-size one" (it fixes the reactance, not the
  radiation resistance); "a broad SWR dip means a good antenna" (the lossy coil's broad dip is heat; a dummy load has
  SWR 1 everywhere); "a better coil only helps" (it narrows the band); "SWR 1 means all power is radiated" (SWR 1 and
  14 % efficiency at once); "a short antenna has a weak pattern" (its pattern is almost a λ/2 dipole's, see
  `dipole-length`; the loss is in resistance, not in the shape).

## 8. Out of scope

The coil's position along the wire (centre loading only), top loading and capacity hats, traps (`trap-antenna`),
monopoles over ground (half the resistances; `ground-image`), matching networks (the transformer is ideal), the
transmission line and its loss (`swr`), the pattern (`dipole-length`), the coil's own self-resonance and the
frequency dependence of the loss resistances, thicker radiators (lower X and Q; one sentence in the explanation).
