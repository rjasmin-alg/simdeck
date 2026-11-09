<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# near-field-coupling: spec

One concept (catalogue `ant-near-field-coupling`, §4.15): **inside the reactive near field two small loops couple
like the windings of a loose transformer: the coupled voltage falls as 1/r³, it follows the current with no travel
time, and the energy in the field swings out and back instead of leaving; past λ/2π the radiated part takes over and
falls as 1/r. The crossover moves with the frequency. Close in the coupling follows the near field's closed lines,
not the far-field pattern: on the loop's axis, where the far field has a null, the near coupling is the strongest.**

An explorer: frequency (100 kHz … 450 MHz) and distance (5 cm … 1 km) on log sliders, the receiver beside the
transmitting loop (in its plane) or on its axis, c finite or infinite, and time as the phase ωt (0 … 355°, play and
step keys) for the current and the voltage over one period. The field is `hertzian-dipole.js` (copied unchanged from
`sims/dipole-field` @ f87e209, catalogue §5.26 model 2), used by duality; the situation is `sim.js`; the tests are
`sim.test.js`. Every rule below has a test that fails when the rule is broken (NOTES.md "Checks").

## 1. The situation and the params

| Quantity | Value | Note |
|---|---|---|
| Loops | two equal flat loops, radius a = 5 mm (area A = π·a² = 78.5 mm²), axes parallel (+z) | one turn each |
| Current | I(t) = I0·cos ωt in the transmitting loop, I0 = 1 A | the receiving loop is open: it draws no current |
| Model | both loops are point magnetic dipoles, m = I·A (Balanis, *Antenna Theory*, 3rd ed., §5.2, "small loop") | valid for 2πa ≪ λ and r ≫ a; see the limits below |
| μ0, η0 | η0 = 376.730313668 Ω (CODATA 2018), μ0 = η0/c | |

- **Params.** `f` and `r` are indices into two tables of the ISO 3 **R20** preferred numbers (1.00, 1.12, 1.25, 1.40,
  1.60, 1.80, 2.00, 2.24, 2.50, 2.80, 3.15, 3.55, 4.00, 4.50, 5.00, 5.60, 6.30, 7.10, 8.00, 9.00, twenty a decade, a
  ratio of 1.122): frequency 100 kHz … 450 MHz (74 values; f = 3 is 140 kHz, 43 is 14.0 MHz, 73 is 450 MHz), distance
  5 cm … 1 km (87 values; r = 0 is 5 cm, 6 is 10 cm, 26 is 1 m, 37 is 3.55 m, 86 is 1 km). Log sliders with exact
  table values let a preset name 14.0 MHz (the 20 m band; a contactless card uses 13.56 MHz, 3 % away) and 140 kHz.
- `geom` = `side` (the receiving loop beside the transmitting one, in the same plane, θ = 90°) or `axis` (on its axis,
  θ = 0). Anything but `axis` is `side`; anything but `c = 'inf'` is finite c.
- **Tie-break: indices are rounded, then clamped** to the table (f = 43.4 is 43, f = 99 is 73, r = −3 is 0); anything
  but a number or a non-blank numeric string (null, '', true, 'x') gives the default. **Tie-break: t wraps into [0, 360)**: 360 is 0, −5 is 355, 725 is 5.
- Limits of the model: at r = 10·a (5 cm) the point dipoles' quasi-static mutual inductance is within 3 % of the
  exact one for two coplanar or coaxial loops (Neumann's double integral, computed in a separate script: the exact |M|
  is 2.3 % above the point value beside and 2.9 % below it on the axis; at 5·a it would be 10 %), which is why r starts at 5 cm. At 450 MHz the loop's
  circumference is 0.047 λ (the small-loop rule asks for less than about λ/10).

## 2. The coupling (duality with `hertzian-dipole.js`)

A small loop is a magnetic dipole; its H has the electric dipole's E form with p → m (Balanis eqs. 5-18a … 5-18c,
checked term by term in the script). With x = kr and u = k³·m/(4π):

- beside (θ = 90°): H_z = −H_θ = −u·e^{−jx}·(1/x³ + j/x² − 1/x) = −u·(the dipole module's broadside E_θ phasor)
- on the axis (θ = 0): H_z = H_r = 2u·e^{−jx}·(1/x³ + j/x²) (the module's E_r at θ = 0, its phasor read from the
  instantaneous field at ωt = 0 and 90°)
- **c infinite** (k → 0 at fixed ω, x kept as a ruler): H_z = −u/x³ and +2u/x³, the static field of the loop's
  moment: no 1/x² and no 1/x term, and no delay.

The receiving loop's voltage (open circuit, its sense the same as the transmitting loop's current) is
V = −jω·μ0·A·H_z (Faraday). So |V| = V_u·|g(x)| with V_u = ω·μ0·A²·I0·k³/(4π) and g the bracket above, and V's phase
against I is arg(g) − 90°, given in (−180°, 180°] (**tie-break: −180° is 180°**).

| Check | Book | Model |
|---|---|---|
| Near: V = ω·|M|·I0 with the mutual inductance of two small coplanar loops, M = −μ0·A²/(4π·r³) | 14 MHz, 5 cm: 0.4341 mV | 0.43404 mV (1e-3: kr = 0.015 is not 0); c infinite equal (1e-12) |
| On the axis close in: twice beside (M = +μ0·A²/(2π·r³)) and of the opposite sign | ratio 2.000, phases −90° and +90° | equal |
| 1/r³ close in: r doubled at kr = 0.001 | V × 1/8 | 0.1250 |
| 1/r far out beside: r doubled at kr = 300 | V × 1/2 | 0.5000 |
| 1/r² far out on the axis (no 1/r term: the pattern's null along the axis, sin θ) | r doubled at kr = 300: × 1/4 | 0.2500 |
| The three terms are equal at kr = 1, so the crossover is at r = λ/2π | 14 MHz: 3.408 m; 140 kHz: 340.8 m; 450 MHz: 10.60 cm | equal |
| Beside, |g| at kr = 1 equals both asymptotes (|1 + j − 1| = 1) | 1 | equal (1e-12) |
| Beside and on the axis are equal where x⁴ − 5x² − 3 = 0 | x = √((5 + √37)/2) = 2.3540, r = 0.3747 λ | equal (1e-9) |
| Near-field phase: V follows I with no delay (V ∝ dI/dt) | beside +90°, on the axis −90° at kr = 0.001 (±0.01°) | equal |
| Far-field phase: turns with the travel time | d(phase)/dr = −360° per λ at kr = 300 | within 0.1 % |
| c infinite | |g| = 1/x³ (beside), 2/x³ (axis) at every distance; phase ±90° | equal |

## 3. The slope

The local exponent n of |V| ∝ 1/rⁿ, n = −d ln|V| / d ln r, from |g|² = (1 − x² + x⁴)/x⁶ beside and 4(1 + x²)/x⁶ on the
axis:

- beside: n = 3 − (2x⁴ − x²)/(1 − x² + x⁴) = 1 + (2 − x²)/(x⁴ − x² + 1): 3 close in, **exactly 2 at kr = 1**, 1 far
  out. It overshoots both ends, because the 1/r term is in antiphase with the 1/r³ term and cancels part of it: a
  maximum of 3.155 at kr = √(2 − √3) = 0.518 and a minimum of 0.845 at kr = √(2 + √3) = 1.932 (so the default, 1 m at
  14 MHz, reads n = 3.08). |V| always falls (n > 0: the numerator of n is (x² − 1)² + 2 > 0).
- on the axis: n = 3 − x²/(1 + x²): 3 close in, 2.5 at kr = 1, 2 far out (never 1: no radiation along the axis).
- c infinite: 3 everywhere.

Tested against a numerical derivative of |V| at eight distances in both geometries, and at both extremes.

The caption's "twice as far, k times less" uses the real ratio k = |V(r)| / |V(2r)| (state `div`), not 2ⁿ of the local
slope, which differs where n changes (3.55 m at 14 MHz: k = 2.12, while 2ⁿ = 3.6).

## 4. Energy: what leaves and what swings back

Through a sphere of radius r round the transmitting loop (independent of where the receiver sits):

- **Radiated power** (leaves): P = η0·π/12·(ka)⁴·I0² (Balanis eq. 5-27; R_rad = 20π²(C/λ)⁴ with η0 = 120π, eq. 5-24).
  The same through every sphere. 14 MHz: 0.457 nW; 140 kHz: 4.57 aW; 450 MHz: 0.488 mW. c infinite: 0.
- **Reactive power** (swings out and back each period): Q = ½·|Im ∮ E×H*·dA| = ω·μ0·A²·I0²/(12π·r³) = P/(kr)³. It
  does not depend on c (the stored energy is the quasi-static one). 14 MHz at 5 cm: 0.145 mW.
- Both checked by integrating the complex Poynting vector of Balanis' fields over θ (4001 points) at 14 and 450 MHz
  and 5 cm, 1 m and 30 m: equal to 1e-9. Q = P at kr = 1.

The open receiving loop takes nothing, so close in the field's energy returns to the transmitting loop every half
period and only P leaves. A load on the receiving loop would draw real power out of that stored energy (the
reflected impedance of a transformer): the explanation says so; the model has no load (out of scope, below).

## 5. Zones

Reactive near field r < λ/2π, radiating near field λ/2π … λ, far field from λ (**tie-break: a boundary belongs to
the outer zone**), as in `dipole-field`. With c infinite everything is "near".

## 6. Presets

| # | id | Params | Expected (tested) |
|---|---|---|---|
| 1 | `card` | 14.0 MHz, 5 cm, beside | kr = 0.0147, near, n = 3.000, V = 0.4340 mV, +90.00°; λ/2π = 3.41 m |
| 2 | `charger` | 140 kHz, 5 cm, beside | λ/2π = 340.8 m: near field from 5 cm to 340 m, n = 3.00 out to 30 m; V = 4.341 µV |
| 3 | `cross` | 14.0 MHz, 3.55 m, beside | kr = 1.042 (just past λ/2π, mid), n = 1.838, V = 1.268 nV |
| 4 | `far` | 14.0 MHz, 1 km, beside | 46.7 λ, far, n = 1.000, V = 4.672 pV; P = 0.457 nW, Q = 18.1 aW |
| 5 | `axis` | 450 MHz, 10 cm, on the axis | λ/2π = 10.6 cm, near, n = 2.529, axis ÷ beside = 2.895; at 1 km, 0.000212 (−73.5 dB) |
| 6 | `inf` | 14.0 MHz, 1 km, beside, c infinite | n = 3, P = 0, V = 54.26 aV (the 1/r³ line carried to 1 km) |

Default: 14.0 MHz, 1 m, beside, c finite, t = 0.

## 7. Time

`t` is ωt in degrees, 5° steps, wrapping. The current is I0·cos ωt; the voltage |V|·cos(ωt + phase). The page plots
both over one period (each over its own amplitude) with a cursor at t, and animates the schematic's current arrow and
voltage bar. Play runs 5° every 70 ms (a period in 5 s); reduced motion jumps 45° once a second. → / PgDn, ← / PgUp step
15°, Home 0°, End 355°, P plays (Space stays the kit's).

## 8. Legend, captions, terms

- Plot: |V| beside (solid, `--c3`) and on the axis (dashed, `--c4`), the chosen one thick; its two asymptotes (thin
  dotted ink, labelled 1/r³ and 1/r or 1/r²); vertical marks at λ/2π and λ; the receiver as a diamond on its curve.
  Zone names over the plot. The y axis in volts, labelled every factor of 1000 (V, mV, µV, nV, pV, fV, aV).
- Caption: the reading (V, n, what doubling r does), then one zone sentence: near field with "no delay" for kr < 0.5 (phase
  within 5° of ±90°), near the boundary from kr = 0.5 (the phase moves from 95° to 122° beside, −92° to −102° on the axis), radiating near field (on the axis: the
  1/r² part, no 1/r), far field (on the axis: the pattern's null), c infinite; on the axis close in (axis ÷ beside > 1)
  the pattern-null sentence replaces the energy clause.
- Table with c infinite: no λ, no r/λ and no λ/2π (λ is only a ruler there).
- Terms: reaktivno blisko polje, zračeće blisko polje, daleko polje (50ohm-contents-hr); sprega / induktivna sprega
  *(check)*, međuinduktivitet *(check)*, petlja / petljasta antena (loop antenna; 50ohm "loop antena").

## 9. Misconceptions targeted

- "The near field ends at a few centimetres": at 14 MHz it reaches 3.4 m and at 140 kHz 341 m; the short reach of a
  card comes from the 1/r³ fall (60 dB a decade), not from the zone boundary.
- "Near-field coupling is weak radiation": with c infinite (no radiation at all) the near coupling is the same.
- "A strong reading close to an antenna means a strong far field in that direction": on the axis the near coupling is
  twice the side's, the far field zero.
- "The near field carries energy away": only P leaves; Q, often far larger, swings back.

## 10. Out of scope

A load on the receiving loop and the transfer of power (reflected impedance, resonance, coupling factor k and Q of
chargers), many turns, ferrite, loop size comparable to r or λ, orientations other than parallel axes, ground and
other objects, noise.
