<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ground-image: specification

Task `docs/tasks/w3/ground-image.md`, catalogue `ant-ground-image` (§4.15; shared model 3 of §5.26, "an element plus its
image"). Class: explorer. The task's "Model and presets" section was empty; this file fills it.

**One concept.** The ground reflects like a mirror, so an antenna above it behaves like itself plus an image as deep below
the ground as it is above: in antiphase for a horizontal current, in phase for a vertical one. In each direction the
reflected wave travels 2h·sin Δ farther than the direct one; with the image's sign that sets whether they add or
cancel. A low horizontal dipole sends most of its power straight up (near-vertical incidence, a short hop); raised,
its lowest lobe comes down towards the horizon (a long hop), and its elevation pattern gains a lobe for every half
wavelength of height. A quarter-wave rod on a ground plane is half a dipole whose image supplies the other half: about
36.5 Ω, strongest on the horizon. A real ground reflects only part of the wave: the nulls fill in and some of the power
is lost in it.

## 1. The antennas and the conventions

- **Ground**: the plane z = 0, flat, uniform. Heights in wavelengths; Δ is the elevation above the horizon (0° along
  the ground, 90° straight up).
- **Antennas** (`ant`):
  - `horizontal`: a thin half-wave dipole along x, centre at height h, sinusoidal current (`current-pattern.js`).
  - `vertical`: the same dipole along z, centre at height h ≥ λ/4 (the lower end on or above the ground).
  - `groundplane`: a quarter-wave rod standing on the ground, current sin(k(λ/4 − z)), fed at its base against a ground
    plane of radials.
- **The drawn plane**: the elevation pattern is the vertical plane across the horizontal wire (φ = 90°, where it
  radiates best); the vertical antennas are the same in every vertical plane. The pattern is symmetric about the zenith,
  so elevations are read in 0 … 90°.
- **Grounds** (`ground`), at 7 MHz (λ = 42.83 m; the frequency matters only for the real grounds' permittivity and for
  the metres shown): `perfect` (a perfect conductor), `average` (ε_r = 13, σ = 0.005 S/m), `poor` (ε_r = 5,
  σ = 0.001 S/m) *(check: the usual "average" and "very poor" values of antenna handbooks; ITU-R P.527)*. Complex
  permittivity ε = ε_r − j·60·σ·λ = ε_r − j·18000·σ/f(MHz): average 13 − 12.86j, poor 5 − 2.57j.

## 2. Model (ground.js, pure, promotable next to current-pattern.js and array-factor.js)

- **Image theory** (Balanis §4.7, the vertical and horizontal electric dipole above a perfect conductor, eqs. 4-99 and
  4-116 *(check eq. numbers)*; Kraus, the ground as a mirror): over a perfect conductor the field above the ground is
  the antenna's plus that of its image at −h; a horizontal current's image flows the other way, a vertical one's the
  same way. In the drawn plane:
  horizontal |E| = 2·|sin(2πh·sin Δ)| (the element factor is 1 there), vertical |E| = F(Δ)·2·|cos(2πh·sin Δ)|,
  F = cos(π/2·sin Δ)/cos Δ. The horizontal dipole with its image is exactly a two-element side-by-side array in antiphase
  with spacing 2h along z (`array-factor.js`, lag 180°; rule 2).
- **The quarter-wave rod**: its far-field factor on θ̂ is A(u) = (e^{jπu/2} − j·u)/(2·sin θ), u = cos θ = sin Δ (from
  ∫cos s·e^{jus} ds); its image is A(−u) = conj A(u), and A + conj A = cos(πu/2)/sin θ, the half-wave dipole's F.
- **Real ground** (the reflection-coefficient model; Balanis §4.8 *(check section)*): the reflected wave is the image's
  field times the Fresnel coefficient relative to a perfect ground, separately for the part across the plane of
  incidence (TE: r_h = −Γh) and in it (TM: r_v = Γv):
  Γh = (sin Δ − √(ε − cos²Δ))/(sin Δ + √(ε − cos²Δ)), Γv = (ε·sin Δ − √(ε − cos²Δ))/(ε·sin Δ + √(ε − cos²Δ)),
  principal square root. Perfect: r = 1 for both. At normal incidence r_h = r_v (no plane of incidence). At grazing
  (Δ → 0) every real ground gives Γ = −1 for both, so r_v → −1: a vertical antenna's horizon goes quiet. |Γv| has a
  minimum (the pseudo-Brewster angle): average ground 13°, poor ground 23°. Far field only: no ground (surface) wave.
- **Power** (∫|E|² dΩ over the upper hemisphere; η/(4π²)·∫ is a resistance referred to the crest current):
  - sky: ∫|E_direct + r·E_image|²;
  - lost: ∫ (1 − |Γh|²)·|E_image,TE|² + (1 − |Γv|²)·|E_image,TM|², what the ground takes from the downward wave (its
    mirror image is the image's field upwards); 0 over a perfect ground;
  - fed, the dipoles: sky + lost. The reflected wave acts back on the feed as the image does over a perfect ground, where
    the sum is image theory's resistance (rule 5);
  - fed, the ground plane: always R₁₁/2 = 36.54 Ω. Its radials are a perfect mirror close to the rod, so the feed sees
    half a dipole; farther out the waves reflect off the real ground, and what does not reach the sky is lost
    (fed − sky).
  Simpson in Δ (480 intervals) and, for the horizontal dipole, a 18-point midpoint rule in φ over a quarter turn (the
  pattern is mirror-symmetric about both vertical planes); the verticals are the same all round.
- **Feed resistance over a perfect ground by image theory** (Balanis §4.7.4 for the monopole; Kraus's tables of mutual
  resistance *(check)*): horizontal R₁₁ − R₁₂,side(2h), vertical R₁₁ + R₁₂,collinear(2h), the ground plane R₁₁/2. The
  collinear mutual resistance is η/(2π)·∫₀^π F²·cos(k·d·cos θ)·sin θ dθ.

  | | R₁₁ | R₁₂,side(λ/2) | R₁₂,side(λ/4) | R₁₂,col(λ/2) | R₁₂,col(λ) |
  |---|---|---|---|---|---|
  | Ω | 73.08 | −12.52 | 40.76 | 26.40 | −4.12 |

  So the horizontal dipole at λ/4 sees 85.60 Ω, at λ/8 32.32 Ω, at 0.05 λ 5.79 Ω; the vertical with its lower end on
  the ground (h = λ/4) 99.47 Ω, at h = λ/2 68.96 Ω; the ground plane 36.54 Ω.
- **Gain** in the drawn plane: G(Δ) = 4π·|E_total(Δ)|²/fed (over isotropic). Shown in dBi and, on the plot, as field
  over a half-wave dipole in free space fed the same power: √(G/1.6409).
- **One hop** (from `skip-distance`, its geometry unchanged): a ray at take-off angle α turned back by a mirror at
  300 km (the F2 region's virtual height) lands 2·R·(arccos(R·cos α/(R + 300)) − α) away, R = 6371 km: 0° 3836 km,
  10° 2193 km, 30° 934 km, 60° 328 km, 90° 0.

## 3. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `ant` | the antenna | `horizontal`, `vertical`, `groundplane` | `horizontal` |
| `h` | the dipole's centre height in λ | 0.05 … 3.00, step 0.05 (vertical from 0.25) | 0.50 |
| `ground` | the ground | `perfect`, `average`, `poor` | `perfect` |
| `t` | time as ωt (the wave picture) | 0 … 355°, step 5, wraps | 0 |

Tie-breaks (tested first):

1. Every param is clamped and put on its grid (0.1 + 0.2 is 0.30); a non-number gives the default; a choice not in
   its list gives the default. The vertical's height is at least 0.25 (its lower end on the ground). The ground
   plane ignores `h` (the rod stands on the ground; the page hides the slider) and keeps it for a switch back.
2. Time wraps into [0, 360): 360 is 0, −5 is 355; a non-number gives 0.
3. **Equal lobes**: over a perfect ground every lobe of the horizontal dipole in the drawn plane is equally strong (2× the
   direct field). The main lobe is the strongest; equal ones (relative 1e-9) go to the **lowest** elevation, the
   take-off angle that reaches farthest (h = 0.75 λ: 19.47°, not its equal lobe at 90°).
4. **Lobes**: local maxima of G on a 0.05° grid in 0 … 90°, each refined by golden section. A flat top counts once, at
   its lower edge: the horizon (0°) is a lobe when not below its neighbour (the verticals over a perfect ground);
   inside, a sample strictly above the one below and not below the one above; the zenith (90°) when strictly above
   its neighbour, since the pattern is mirrored there (a low horizontal dipole; h = 0.25 λ, 0.75 λ, …: a lobe exactly
   at 90° counts once). A zero is never a lobe.
5. **Half-power span** of the main lobe: walk each way to the first sample below half (a 1e-12 margin; touching half is
   not below), then bisect. It stops at the horizon (0°) and at the zenith (90°: the lobe goes on over the top).
6. **The hop** at 90° is exactly 0; the span's ends give the nearest (upper end) and farthest (lower end) landing.
7. **The ground plane over a real ground**: fed stays R₁₁/2; the lost share is fed − sky (never negative).
8. **Straight up**: G(90°) below 1e-9 of the main lobe is a null (`zenithDbi` null).

## 4. Rules (each with a test)

1. **The mirror's signs**: over a perfect ground the horizontal dipole's field in the drawn plane is 2·|sin(2πh·sin Δ)|,
   the vertical's F·2·|cos(2πh·sin Δ)|; r_h = r_v = 1; the image of the rod is its conjugate and rod + image = the
   dipole's F.
2. **The image is a second element**: horizontal over a perfect ground = `array-factor.js` two elements in antiphase,
   spacing 2h, in the direction at cos γ = sin Δ from their line (and `current-pattern.js` field of the pair).
3. **Lobes by height** (horizontal, perfect): lobes at sin Δ = (2m + 1)/(4h), nulls at sin Δ = m/(2h) (m ≥ 1) and on
   the horizon; their number is ⌈2h⌉: one more for every λ/2 of height. Each new lobe is born straight up (a partial
   one, weaker, while 2h is just past a whole number: h = 0.55 λ has 27.0° and a smaller one at 90°), grows to full
   strength at 90° when 2h is a whole number plus ½ and moves down as the antenna rises. Up to h = λ/4 the only lobe is
   straight up. The take-off angle is arcsin(1/(4h)): λ/2 30°, λ 14.48°, 2λ 7.18°, 3λ 4.78°.
4. **Vertical antennas over a perfect ground** are strongest on the horizon (the paths are equal and the image in phase),
   with a null straight up.
5. **Feed resistance**: the hemisphere integral over a perfect ground equals image theory (to 1e-4 relative): §2's
   table; the ground plane 36.54 Ω and 5.16 dBi (twice the dipole's 1.6409), on the horizon.
6. **A raised horizontal dipole** gains towards 4 × 1.6409 = 6.56 (8.17 dBi; +6 dB: twice the field, the power into
   half the space): 2λ 8.19 dBi, 3λ 8.18 dBi.
7. **Fresnel**: |Γ| = 1 perfect, < 1 real; Γ = −1 at grazing on a real ground; r_h = r_v at normal incidence,
   (√ε − 1)/(√ε + 1); the pseudo-Brewster minimum of |Γv| at 13° (average) and 23° (poor).
8. **A real ground fills the nulls**: wherever the perfect-ground pattern has a null above the horizon, the real one does
   not (λ/2: straight up −5.83 dBi average, −2.04 dBi poor, against nothing).
9. **A real ground wastes power**: lost > 0 and sky < fed over a real ground, 0 over a perfect one; on a vertical the
   horizon is a null (r_v = −1) and the main lobe lifts off it.
10. **The hop** is skip-distance's (§2's numbers).
11. **The wave picture** (page): at a point (y, z) above the ground the complex field is the direct wave from the antenna
    plus r(Δ′)·the image's, Δ′ the elevation of the image ray there, each with its element factor towards that point;
    the time ωt turns every point's phase alike, so it never changes the pattern.

## 5. The page

- **Stage, left: the waves in the drawn plane**, side view: the antenna (a dot, the horizontal wire end-on; a bar for the
  verticals), the ground line and below it the earth with the image drawn dashed, as deep as the antenna is high.
  Above the ground the instantaneous field Re{A·e^{jωt}} of the direct wave plus the reflected one (far-field terms,
  each evened out with distance by 1/√(r + λ/2), the sum × √(r₀ + λ/2) from the antenna; said in the explanation).
  Diverging colour as in `antenna-array`: + towards `--c1`, − towards `--c5`, zero the background, so a null is blank.
  At the take-off angle two rays: the direct one from the antenna and the reflected one from the image through the
  ground (dashed under it), side by side, with the extra path 2h·sin Δ named in the caption. A bar shows λ.
- **Middle: the elevation pattern**, a half circle over the horizon, field over a free-space half-wave dipole fed the
  same power, fixed outer ring 2.5× (largest in the ranges 2.25×, horizontal at 0.6 λ over a perfect ground): over this
  ground (solid, filled), over a perfect ground (dotted, real grounds only), the same dipole alone in free space
  (dashed: a circle for the horizontal wire seen end-on, the dipole's figure-eight half for the verticals). The main
  lobe a solid spoke with its angle; the half-power edges dashed.
- **Right: the readout** (height in λ and metres at 7 MHz, take-off angle, lobes, half-power span, the gain there in dBi,
  straight up, lost in the ground, the feed resistance over a perfect ground or with the ground plane's radials, else —),
  and **where one hop lands**: a 0 … 4000 km strip with the half-power span shaded and the take-off angle's landing
  marked.
- **Time**: Play (P), → / PgDn and ← / PgUp 15°, Home/End, a scrubber in the bar; reduced motion steps 45° a second; a
  preset stops the clock (as in `antenna-array`).
- **Captions** (at most five sentences): the image and its sign; why the main lobe is where it is (the extra path at the
  take-off angle, with or without the flip; for a low dipole, straight up); the lobes ("one for every λ/2 of height"
  only for the horizontal dipole over a perfect ground, rule 3; elsewhere "the higher, the more") or the horizon; over a
  real ground the loss, and the null filling where the perfect ground had nulls; where one hop lands.

## 6. Presets (numbers from the model, checked by the numpy script)

| # | id | antenna | h | ground | take-off | lobes | gain | half-power | one hop | lost | R |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `nvis` | horizontal | 0.15 | average | 90° | 1 | 6.55 dBi | 34.8–90° | 0–790 km | 28.5 % | — |
| 2 | `half` | horizontal | 0.5 | perfect | 30.00° | 1 | 8.42 dBi | 14.5–48.6° | 934 km (497–1757) | 0 | 69.07 Ω |
| 3 | `high` | horizontal | 2 | perfect | 7.18° | 4 | 8.19 dBi | 3.6–10.8° | 2549 km (2104–3118) | 0 | 72.80 Ω |
| 4 | `highPoor` | horizontal | 2 | poor | 6.96° | 5 | 7.76 dBi | 3.4–10.6° | 2580 km | 31.2 % | — |
| 5 | `gp` | ground plane | — | perfect | 0° | 1 | 5.16 dBi | 0–39.0° | 3836 km (684–3836) | 0 | 36.54 Ω |
| 6 | `gpPoor` | ground plane | — | poor | 29.20° | 1 | −1.80 dBi | 11.1–55.2° | 961 km (393–2074) | 80.0 % | 36.54 Ω |

Preset 4 has a fifth, small lobe straight up where the perfect ground's null was (−2.29 dBi). Also checked: horizontal
λ/2 over average ground 27.81°, 7.66 dBi, lost 22.8 %, poor 26.53°, 6.88 dBi, 33.1 %; vertical at λ/2 over a perfect
ground 0°, 8.42 dBi, over poor ground 16.52°, 2.25 dBi, 52.3 % lost; ground plane over average ground 26.16°,
−0.05 dBi, 69.5 % lost; horizontal at 0.05 λ over a perfect ground 8.98 dBi straight up (5.79 Ω), over poor ground 3.16
dBi with 62 % lost.

## 7. Misconceptions targeted

- "Higher is always better": only for low angles; a low dipole is the right antenna for a short hop (preset 1).
- "The ground just absorbs": a perfect ground doubles the field in some directions and cancels it in others; it is a
  mirror, and the image is a second antenna (rule 2).
- "A vertical always radiates low": only over a good ground; over a poor one the horizon goes quiet (preset 6).
- "The take-off angle is set by the antenna's tilt": it is set by the height in wavelengths.

## 8. Out of scope

The ground (surface) wave and the near-field losses at the base of a monopole (radials of finite size, a vertical fed
against the earth itself); the dipoles' feed resistance over a real ground (the readout shows —); a sloping or uneven
ground and the ground beyond the first reflection point; the ionosphere itself (whether the region turns the wave back
at that angle and frequency is `skip-distance`'s and beyond); dipoles of other lengths; the pattern off the drawn plane.
