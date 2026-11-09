<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dipole-field: spec

One concept (catalogue `ant-dipole-field`, §4.15): **the E field lines of a short oscillating dipole over one period,
from the exact Hertzian solution. Close to the wire the lines go out and come back into it every half period
(reactive near field: energy stored and returned, H 90° ahead of E); from kr = √2 (0.225 λ, "about a quarter
wavelength") closed loops pinch off and travel away, far out at c; the reactive near field reaches λ/2π; beyond it E and H
come into phase, both fall as 1/r and E/H settles to the wave impedance of free space, μ0·c ≈ 377 Ω. With c infinite
the same lines only grow and shrink and nothing pinches off.**

An explorer: time as the phase ωt (0 … 355°, 5° steps) with play (P) and step keys (→ ← PgDn PgUp, 15°), c finite or
infinite, the probe's distance r on the broadside line (0.04 … 1.5 λ), and a switch that marks the zones. The physics
is `hertzian-dipole.js` (pure, promotable: catalogue §5.26 model 2); the page's situation is `sim.js`; the tests are
`sim.test.js`. Every rule below has a test that fails when the rule is broken (NOTES.md "Checks").

## 1. The situation

| Quantity | Value | Note |
|---|---|---|
| Dipole moment | p(t) = p0·cos ωt along +z | the top end's charge is +q·cos ωt; the current I = dp/dt / l leads it by 90° |
| Frequency, wavelength, period | 10 MHz, λ = c/f = 29.98 m (shown "30 m"), T = 100 ns | |
| Dipole | l = λ/50 = 0.60 m, peak current I0 = 1 A (uniform: a Hertzian dipole) | I0·l = ω·p0 |
| Field units | E_u = I0·l·k²·η0/(4π) = 0.7896 V/m, H_u = I0·l·k²/(4π) = 2.096 mA/m, E_u/H_u = η0 | k = 2π/λ |
| η0 | μ0·c = 376.730313668 Ω (CODATA 2018) | |

- Time is the param `t`, the phase ωt in degrees. **Tie-break: it wraps into [0, 360)**: 360 is 0, −5 is 355, 725 is 5
  (`norm`). Anything but `c = 'inf'` is finite c. r is clamped to 0.04 … 1.5 λ (0.04 λ = 2 l: a point dipole's field
  is not the wire's closer in). `zones` is a boolean: false, "false", "0" and 0 are off.
- Distances are in wavelengths of the finite-c wave, also with c infinite (there λ is only a ruler).

## 2. The field (`hertzian-dipole.js`)

With x = kr, φ = ωt and a = φ − x (Griffiths, *Introduction to Electrodynamics*, 4th ed., §11.1.2 and problem 11.4;
Balanis, *Antenna Theory*, 3rd ed., eqs. 4-8a … 4-10c with I0·l = jω·p0 *(check eq. numbers)*), in E_u and H_u:

- E_θ = sin θ·[cos a / x³ − sin a / x² − cos a / x]
- E_r = 2 cos θ·[cos a / x³ − sin a / x²]
- H_φ = sin θ·[−sin a / x² − cos a / x]

The 1/x³ term is the static dipole field of p at the retarded time, 1/x² the field of ṗ (the current, Biot–Savart), 1/x
the radiation field of p̈. **c infinite** (k → 0 at fixed ω, x kept as the ruler): E_θ = sin θ·cos φ / x³,
E_r = 2 cos θ·cos φ / x³, H_φ = −sin θ·sin φ / x².

Phasors on the broadside line (θ = 90°), field(t) = Re(A·e^{jφ}): E_θ = e^{−jx}(1/x³ + j/x² − 1/x),
H_φ = e^{−jx}(j/x² − 1/x); c infinite: E_θ = 1/x³, H_φ = j/x².

**Stream function** Ψ = sin²θ·[cos a / x − sin a] (c infinite: sin²θ·cos φ / x), with E_r = ∂Ψ/∂θ / (x² sin θ) and
E_θ = −∂Ψ/∂x / (x sin θ): E is tangent to Ψ's contours, so the contours are the field lines (and, in 3-D, equal steps
of Ψ carry equal flux). Tested by numerical derivatives at ten points, c finite and infinite.

**Deviation from the catalogue's formula:** the catalogue writes the contours as sin²θ·[cos(kr−ωt)/(kr) − sin(kr−ωt)].
That is not a solution of Maxwell's equations (with u = kr − ωt the outgoing solution is cos u/(kr) **+** sin u); the
textbook form, used here, is sin²θ·[cos(ωt−kr)/(kr) − sin(ωt−kr)] (derivation in NOTES.md "Checks").

Expected (tested; "book" from the formulas above, computed in a separate script):

| Check | Book | Model |
|---|---|---|
| E/H at kr = 1 (r = λ/2π) | η0/√2 = 266.4 Ω, H 45° ahead | equal (1e-9) |
| E/H = η0 | at kr = 1/√2 (r = 0.113 λ); above it closer in | equal (1e-12) |
| Minimum of E/H | 256.65 Ω at kr = 1.169 (from (1 − y + y²)/(1 + y), y = 1/x², minimum at y = √3 − 1) | 256.65 at 1.169 |
| E/H at 0.08 λ, 0.5 λ, λ, 1.5 λ, 2 λ | 603.1, 342.2, 367.4, 372.5, 374.4 Ω | equal (0.1) |
| H ahead of E at 0.08 λ, 0.5 λ, 1.5 λ | 82.76°, 1.85°, 0.07° (far: ≈ 1/x³ rad) | equal |
| Near: r doubled at 0.005 λ | E × 1/8, H × 1/4 | 0.124, 0.251 |
| Far: r doubled at 10 λ | E and H × 1/2 | 0.500 |
| Far E at 40 λ | η0·k·I0·l / (4π·r) (Balanis 4-26a) | equal (1e-4) |
| Mean power through a sphere, P = 4πr²·⅔·½·Re(E_θ·H_φ*) | η0·π/3·(I0·l/λ)² = 0.1578 W at every r (Balanis 4-16) | equal (1e-9) at 0.04, 0.159, 0.5, 2 λ |
| Radiation resistance 2P/I0² | 80π²(l/λ)² = 0.3158 Ω (Balanis 4-19, with η0 = 120π) | 0.3156 (0.07 %) |
| c infinite | E/H = η0/(kr), H exactly 90° ahead, P = 0, E 1/r³, H 1/r² | equal |
| Cross-check with `ant-accelerated-charge`'s retarded field (copied as `retarded.js`): a charge oscillating against a fixed opposite charge at β = 0.001 | this model's E_θ and H_φ | within 1 % of the amplitude at 0.6, 1.5 and 6 m (λ = 6 m there) |

## 3. The probe

On the broadside line (θ = 90°, to the right) at r. It reads the amplitudes |E| (V/m) and |H| (mA/m), E/H = |E|/|H|
(Ω), how far H is ahead of E (degrees, arg H − arg E taken into [−180°, 180°); for this dipole always 0 … 90°, falling with r), the power through the sphere of radius r, and
the instantaneous E_θ and H_φ (drawn as an arrow, positive down, and a ring with a cross, into the page, or a dot,
out of it). E_r is zero there.

## 4. Field lines and the pinch-off

- Ψ is sampled on a grid of about 4.5 px cells over the picture; nodes closer than 0.05 λ to the dipole are NaN and
  no line is drawn there (the dipole is drawn in that disc). Contour levels ±(n − ½)·0.25, n = 1 … 24: never 0, so no
  line runs along the axis; the same levels at every moment, so lines appear out of the dipole and vanish into it.
- Marching squares, chained into polylines. **Tie-breaks:** a node equal to the level counts as above it; in a saddle
  cell (diagonal corners above, the other two below) the mean of the four corners decides, equal counting as above:
  above, the above corners connect through the cell; below, they are cut off. Cells with a NaN corner are skipped.
- Tested: every contour point is within 3 % of its level of Ψ; with c infinite the lines are the static dipole lines
  r = sin²θ·cos φ / (2π·Ψ) and none is closed (all end at the dipole); with c finite at ωt = 60° there are closed
  loops in the picture; Ψ is symmetric across the dipole and across the broadside line.
- Positive levels are drawn solid `--c2`, negative dashed `--c1`: the two senses of rotation. Where a line crosses the
  broadside line an arrowhead shows E's direction there (up where E_θ < 0), from 0.12 λ out, at least 0.75 rem apart.
- **Pinch-off (X points).** On the broadside line, an X point (saddle of Ψ) is where E_θ = 0 and Ψ has a minimum along
  x where Ψ > 0, or a maximum where Ψ < 0. Solving ∂Ψ/∂x = ∂²Ψ/∂x² = 0 gives the birth of the X point exactly at
  **kr = √2, r = √2·λ/2π = 0.2251 λ**, at ωt = √2 − atan(1/√2) = **45.76°** after p's maximum (tan(φ − x) = (1 − x²)/x
  and x² = 2). It then moves in (0.215 λ at 46°, 0.152 λ at 60°, 0.100 λ at 80°) and reaches the dipole at 90°, when
  p = 0. Half a period later the same with the opposite sign (225.76° … 270°). **With c infinite there is never one.**
  Tested at those phases and at every 5° with c infinite. The page draws the separatrix (the level through the X
  point, only its pieces through the X point) thick in ink, a × at the X point and its mirror image, and the words
  "a loop pinches off".
- Further out the loops' centres (O points) on the broadside line are half a wavelength apart and move out about
  half a wavelength per half period (the loop centred at 0.437 λ at 90° is at 0.973 λ at 270°). Not tested; the
  crossings test checks that the sense of E on the broadside line flips between 1 and 1.5 λ.

## 5. Zones

`zoneOf(r)`: 'near' for r < λ/2π (0.159 λ, kr < 1), 'mid' for λ/2π ≤ r < λ, 'far' from λ. **Tie-break: a boundary
belongs to the outer zone.** With c infinite everything is 'near'. Names from 50ohm-contents-hr: reaktivno blisko polje
(d < λ/2π), zračeće blisko polje, daleko polje. The page puts the far-field mark at λ, where E/H is within 2.5 % of
η0 and H within 0.25° of E; 50ohm-contents-hr (after the German regulator) takes the far field of wire antennas from
about 4 λ: the explanation says so, and that the boundary is not sharp. The zones are drawn as dashed circles at λ/2π
and λ, with their names, and as dashed lines in the distance plot; not with c infinite.

## 6. Presets (keys 1–5)

| # | id | Params | What the lecturer shows |
|---|---|---|---|
| 1 | `near` | t 0°, c finite, r 0.08 λ | probe in the reactive near field: E/H 603 Ω, H 82.8° ahead; charge at its peak, no current; H is zero now while E is at its peak |
| 2 | `pinch` | t 60°, r 0.25 λ | the X point at 0.152 λ and the separatrix: a loop closing off; probe at 0.25 λ (radiating near field), E/H 277 Ω, H 14° ahead |
| 3 | `edge` | t 90°, r 0.16 λ | just past λ/2π: E/H 265.7 Ω, H 44.5° ahead; no X point (it has just reached the dipole) |
| 4 | `far` | t 0°, r 1.5 λ | far field: E/H 372.5 Ω, in phase (0.07°); the plot's E and H curves lie on each other |
| 5 | `inf` | t 60°, c infinite, r 1.5 λ | the same moment as `pinch` with c infinite: a few lines round the dipole, no loop, E/H 40 Ω = η0/kr, H 90° ahead, no power |

All presets mark the zones.

## 7. Readout, plots, legend

- Table: distance r (λ and m), kr, zone, |E| (V/m), |H| (mA/m), E/H (Ω), H ahead of E (°), power through the sphere
  (mW). Under it a note with the dipole's data.
- Plot 1: E_θ and H_φ at the probe over one period, each over its own amplitude, with the time now: in the far field
  the curves lie on each other; in the near field H's peak comes a quarter period before E's.
- Plot 2: |E| and η0·|H| (both V/m) against r, log–log, 0.04 … 1.5 λ, with the zone lines and the probe; slope
  labels 1/r³ (E), 1/r² (H) at the left and 1/r at the right (c infinite: 1/r³ and 1/r² at both ends).
- Legend: field line (solid `--c2`), the opposite sense (dashed `--c1`), the pinch-off ×, the probe (diamond `--c3`).
  E in plots solid `--c3`, H dashed `--c4`. Colour is never alone: dashes, shapes and labels carry every distinction.

## 8. Captions

Three parts: the dipole now (charge at its peak and no current at 0° and 180°; no charge and peak current at 90° and
270°; otherwise both as a percentage of the peak); the lines (a pinch at r now, or "from about 0.23 λ loops break away";
with c infinite, "the lines only grow and shrink"); the probe by zone (near, mid, far, c infinite) with E/H and H's lead.

## 9. Misconceptions targeted

- "The near field is weak radiation" → near E/H ≫ 377 Ω and H 90° ahead: the energy goes out and comes back; the
  power through every sphere is the same, so the extra near-field E and H carry nothing away.
- "E/H is always 377 Ω" → it is over 1400 Ω at 0.04 λ, 600 Ω at 0.08 λ, 266 Ω at λ/2π, 257 Ω at its lowest, and only approaches 377 Ω.
- "The field lines all leave the antenna" → near it they go out and come back every half period; only the loops
  that pinch off leave.
- "With an instantaneous field the dipole would still radiate" → c infinite: no pinch-off, no power.

## 10. Out of scope

Real (half-wave) dipoles and their current distribution (`ant-dipole-length`), the radiation pattern in 3-D, H field
lines, ground, coupling between two antennas (`ant-near-field-coupling`).
