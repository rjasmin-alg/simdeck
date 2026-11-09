<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# accelerated-charge: spec

One concept (catalogue `ant-accelerated-charge`, §4.15): **a charge's field lines start radial, but each piece of a
line at distance r shows where the charge was at t − r/c; when the charge is pushed, the news travels out at c and
the lines kink where it has reached; the kinked (transverse) part falls as 1/r, the radial part as 1/r², so far away
only the transverse part is left: radiation. With c infinite the lines stay radial from where the charge is now,
swing rigidly with it, and nothing travels out.**

An explorer: a time slider (0 … 45 ns, 0.5 ns steps) with play (P) and step keys (→ ← PgDn PgUp), the motion, c
finite or infinite, the top speed and the length of a push. The model is `sim.js`; the tests are `sim.test.js`. Every
rule below has a test that fails when the rule is broken (checked by breaking each once, NOTES.md "Checks").

Units: metres, nanoseconds, c = 0.299792458 m/ns. Fields are in **E1**, the charge's own field at 1 m (k·q / 1 m²),
so the Coulomb field at r metres is 1/r². The numbers below were computed with `sim.js` and compared with the book
formulas in a separate script (NOTES.md "Checks"); "book" is the formula, "model" what `sim.js` gives.

## 1. The charge's motion (along the wire, the z axis)

| Motion | Rule | Numbers at β = 0.3, τ = 2 ns |
|---|---|---|
| `start` (a kick) | at rest at z = 0 until T0 = 4 ns; constant acceleration a = v/τ for τ; then coasts at v = β·c | a = 0.04497 m/ns²; at 45 ns z = 3.6 m |
| `stop` | has coasted up the wire at v from long ago; decelerates over τ from T0 and rests at z = 0 | |
| `move` (kick and stop) | at rest at −D/2; pushed (τ), coasts 12 ns, pushed back to rest (τ) at +D/2; D = v·(τ + 12 ns) | D = 1.259 m |
| `osc` | z = A·sin(2πt/T), T = 20 ns, for all time (steady state); A·ω = β·c | A = 0.2863 m, λ = c·T = 5.996 m |

- Speed β = v/c from 0.10 to 0.40 on the page (the model accepts 0.001 … 0.6; |v| < c is what makes the retarded time
  unique). Real charges in a wire drift far slower; the speed is raised so that one charge's kink is visible. Many
  slow charges add up to the same picture (said in the explanation).
- **Tie-break: pushes are half-open intervals [begin, end).** At t = begin the push's acceleration already applies;
  at t = end it no longer does (`motionAt`). Position and velocity are continuous at every boundary.
- Normalising: an unknown motion is `start`; any c but `inf` is finite; β and τ are clamped (τ 0.5 … 8 ns).

## 2. The field: retarded time and the Liénard–Wiechert field

- **Retarded time** t_r: the one t_r ≤ t with c·(t − t_r) = |P − w(t_r)| (Griffiths, *Introduction to
  Electrodynamics*, 4th ed., §10.3.1, eq. 10.47 *(check eq. number)*). It is unique because f(t_r) = c(t − t_r) −
  |P − w(t_r)| has df/dt_r = −c + n̂·v < 0. Solved by Newton's method from t − |P − w(t)|/c, at most 60 steps, to
  1e-12 ns. With c infinite, t_r = t.
- **Finite c**: the exact field of a point charge (Griffiths eq. 10.72, 4th ed. *(check eq. number)*):
  E = 𝓇/(𝓇·u)³ · [(c² − v²)·u + 𝓇 × (u × a)], u = c·𝓇̂ − v, 𝓇 = P − w(t_r), with k·q = 1.
  The first term (the velocity field) falls as 1/r²; the second (the acceleration field) as 1/r. B = 𝓇̂ × E / c
  (eq. 10.73); the model returns c·B along +y.
- **Infinite c**: E = (P − w(t)) / |P − w(t)|³ (Coulomb, from where the charge is now), and c·B = 0 (c·B = (v/c)·E → 0;
  the magnetic field of the moving charge, H = ε0·v × E, is not drawn or read).

Expected (tested):

| Check | Book | Model |
|---|---|---|
| A charge at rest: E_r at 4 m and 8 m | 1/16 = 0.0625, 1/64 = 0.015625 | equal (to 1e-9) |
| Uniform motion β = 0.3, P 1 m out and 0.5 m ahead of the charge's *present* position: E = (1 − β²)/(1 − β² sin²θ)^{3/2} · R̂/R² from the present position (Griffiths eq. 10.75; Purcell & Morin §5.5 *(check section)*) | (0.72837, 0.36419) | (0.72837, 0.36419) |
| Thomson's kink, β = 0.01, r = 50 m, mid-push: E_θ / E_r = a·r·sin θ / c² (Purcell & Morin, 3rd ed., §5.6 or §5.7 and appendix H, E_θ = q·a·sin θ / (4πε0·c²·r) *(check eq. numbers)*; Griffiths eq. 11.69 *(check)*) | 0.834 | 0.839 (0.6 %; the rest is the velocity field's β/r² part) |
| Same, β = 0.3: E_θ at 50 m vs the Larmor field a/(c²r) | 0.01001 | 0.01006 |
| E_θ ∝ sin θ: on the wire's axis (θ = 0) during a push | 0 | 0 (to 1e-12) |

## 3. The news travels at c (fronts and shells)

- Each push (begin … end) sends a **shell** outward: centred where the charge was at `begin`, outer radius
  c·(t − begin), inner radius c·(t − end) (≥ 0). Inside the inner front the lines point from where the charge is now
  (or, while it coasts, from where it is now, extrapolated: Purcell & Morin's construction); outside the outer front
  from where it would have been without the push; in the shell they run across: the kink.
- **Tie-break:** a front exists from the instant of its event on: at t = begin the shell has outer radius 0 and is
  listed; at t < begin it is not. With c infinite there are no fronts (the news is everywhere at once).
- At a probe at distance r the transverse field of a push rises at begin + r/c and peaks by end + r/c. At β = 0.3,
  τ = 2: P1 (4 m) 17.34 … 19.34 ns, P2 (8 m) 30.69 … 32.69 ns (`arrivals`); the model's sampled peaks are at 19.25 and 32.5 ns
  (the velocity field adds to the transverse part as the charge speeds up, so the peak is at the end of the push).
- Words for the caption (`stage`): `before` (news not arrived), `inside` (in a shell now), `between` (between the two
  shells of `move`), `after` (all passed), `none` (osc or c infinite). For this word only the shells are taken about
  the wire's centre (the charge moves less than 2 m before the shells reach the probes).

## 4. Field lines

- 24 lines, evenly spaced in angle at the charge's present position (every 15°, the first straight up the wire),
  starting 0.12 m out. Each is traced along E/|E| with fourth-order Runge–Kutta steps of 0.05 m until it leaves the
  drawn box (plus 0.5 m) or reaches 60 m.
- In the plane through the wire the field has no component out of the plane (symmetry about the wire), so the traced
  lines are exact field lines of the 3-D field, cut by the plane. Their spacing in the picture does not show the field
  strength (it would in 3-D, by lines per solid angle); the page says so in the explanation.
- Tested: with c infinite every line is a straight ray from the present position; with c finite, after a `start`
  push, the line's points beyond the outer front are on rays from where the charge was (the origin), and the points
  inside the inner front on rays from where it is now (to 0.02 m); lines at φ and −φ are mirror images.

## 5. The probes

- P1 at 4 m and P2 at 8 m on the broadside line (θ = 90°, to the right). Each reads E_r (along r̂, away from the
  wire's centre), E_θ (the transverse part, along θ̂: downwards there) and c·B.
- **Tie-break:** on the wire's axis (x = 0) θ̂ is taken towards +x.
- Peak |E_θ|: over 0 … t for the pushes (what the probes have seen so far), over the last period (t − 20 … t) for
  the oscillation; sampled every 0.25 ns and at t. **Tie-break: the first of equal maxima wins** (a constant field
  gives its value at the window's start).
- The ratio P2/P1 of the peaks is shown once both probes have seen the whole first push (stage `between` or
  `after`; not while one is `before` or `inside`), at once for the oscillation (c finite or infinite), and never for a
  push with c infinite (the charge moves away from both probes; no single power law to show). E_r P2/P1 is shown
  always.

Expected ratios (P2/P1, r doubled):

| Case | Book | Model |
|---|---|---|
| E_r, static | 1/r²: 0.25 | 0.250 |
| E_θ peak of a push (`start`, β = 0.3, τ = 2, t = 45) | 1/r: 0.50 | 0.0661 / 0.1401 = 0.472 (the 1/r² velocity part adds more at 4 m) |
| E_θ amplitude, `osc`, c finite | Hertzian dipole, \|E_θ\| = p0·k³·√((1/kr − 1/(kr)³)² + 1/(kr)⁴) with p0 = A (Balanis, *Antenna Theory*, 3rd ed., eq. 4-10, all three terms; Griffiths eq. 11.18 has only the far-zone 1/r term *(check eq. numbers)*): 0.07646 and 0.03902, ratio 0.510 | 0.07718 and 0.03911, ratio 0.507 (β = 0.3; at β = 0.001 equal to 4 digits) |
| E_θ amplitude, `osc`, c infinite | the near field of the dipole, p0·sin θ / r³: A/64 and A/512, ratio 1/8 = 0.125 | 0.004439 and 0.000558, ratio 0.126 |
| Far field, `osc`, r·E_θ at 30 m and 60 m | constant (1/r): A·k² = 0.3144 | 0.3143 and 0.3144 |
| c infinite, `osc`, r³·E_θ at 8 m and 30 m | constant (1/r³): A = 0.2863 | 0.2857, 0.2862 |
| c·B / E_θ in the far field (`osc`, 60 m) | 1 (a plane wave: E ⟂ B, E = c·B) | 1.000 |
| c infinite | c·B = (v/c)·E → 0 (B = v × E/c²; H = ε0·v × E, the Biot–Savart field, stays finite and E × H averages to zero over a period): no 1/r part, nothing radiates | c·B = 0 |

## 6. Presets (keys 1–6)

| # | id | Params | What the lecturer shows |
|---|---|---|---|
| 1 | `start` | start, c finite, β 0.3, τ 2, t 22 ns | the kink shell at 4.8 … 5.4 m, past P1, not yet at P2; inside, lines from where the charge is now; outside, from the origin. Play to see it reach P2 at about 32 ns, half as tall |
| 2 | `stop` | stop, c finite, t 22 | the reverse: inside, lines from where the charge stopped; outside, from where it would have been had it kept going |
| 3 | `move` | move, c finite, t 34 | two shells (kink out, kink back) 3.6 m apart; between them the lines of a moving charge; both probes passed by the first, ratio 0.48 |
| 4 | `osc` | osc, c finite, t 30 | a ripple along every line, one wavelength (6 m) apart, travelling out; P2/P1 of E_θ ≈ 0.51 (1/r), of E_r 0.24 (1/r²) |
| 5 | `oscInf` | osc, c infinite, t 30 | the same charge with c infinite: straight lines swinging rigidly, no ripple; E_θ ratio 0.126 (1/r³), c·B = 0 (H finite, flux averaging to zero) |
| 6 | `startInf` | start, c infinite, t 22 | the kick with c infinite: no shell; both probes change at the same instant; no peak ratio |

## 7. Legend and colours

Field lines `--c2` (as E in `lc-antenna`), the charge `--c1` with a "+", the shell hatched `--c5` with a dashed outer
front, probe P1 `--c3` diamond and solid plot line, P2 `--c4` square and dashed plot line, the E direction at each
probe an ink arrow. Colour is never alone: shapes, dashes, labels P1/P2.

## 8. Captions

One per situation: before the push, a push in progress (the whole disc is the shell), the news on its way (with its
radius and which probes it has passed; for `move` the first kink is named), all passed (with the peak ratio and that
1/r alone gives 0.50; a 1/r² part adds near the charge), oscillation (finite c), and c infinite (pushes or
oscillation). The probe sentence gives E_θ and E_r without saying which is larger (that depends on β/τ). Numbers in the caption come from the
state; the readout table under the plots holds E_r, E_θ, c·B and the peak at both probes with the P2/P1 ratio.

## 9. Misconceptions targeted

- "The field moves with the charge at once" → c infinite against finite, same motion.
- "Radiation is the charge's field spreading out" → the radial part falls as 1/r² and is left behind; only the kink,
  1/r, carries far.
- "Any moving charge radiates" → the coasting charge (`stop` before T0, `move` between pushes) has no kink: only
  acceleration makes one.
- "The near field is weak radiation" → with c infinite the oscillating field is all near field, 1/r³, with c·B ≪ E
  and no net flux outward; the energy goes out and comes back every period.

## 10. Out of scope

The field's 3-D line density, radiated power (Larmor formula) and resistance (ant-dipole-length), the oscillating
dipole's closed loops (ant-dipole-field), polarization (ant-polarization), relativistic speeds beyond 0.4 c on the page.
