<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# polarization-mismatch: notes

Task `docs/tasks/w3/polarization-mismatch.md`, catalogue `ant-tx-rx-polarization` (§4.15, shared model 4 of §5.26). A
new native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in
`SPEC.md`.

## Decisions

- **Antennas from a list, each turned about the path.** Vertical, horizontal and 45° slant dipoles, right- and left-hand
  circular (two crossed dipoles fed 90° apart), and a small loop, at each end; "Tx turned" and "Rx turned" add to the
  antenna's base tilt. A circular receiver has no angle (turning it changes only its phase), so its slider is hidden.
- **Feed errors on the Tx only.** When the Tx is circular, two sliders set the second dipole's amplitude and the phase
  between the dipoles (90 % and 80° in the `rl` preset: AR 1.78 dB, −19.9 dB into the opposite sense: "almost
  everything"). The receiving circular antenna stays ideal, so one ellipse is on the stage at a time.
- **One view for every angle.** Both small views, and every angle on the page, are from behind the wave, looking from
  Tx towards Rx (IEEE: right-hand turns clockwise there). The receiving antenna is drawn as **the wave it takes in full**
  in that view, so a right-hand Rx looks the same as a right-hand Tx. The explanation adds one sentence that the Rx's
  owner, facing Tx, sees a slant mirrored.
- **PLF convention.** The page shows the catalogue's |ê·ê*|², with ê_rx the wave the Rx takes in full. The copied module
  keeps `sims/polarization`'s bilinear form (each antenna's vector = the field it would send); the Rx's sending vector is
  the conjugate of the wave it takes, so V = ê_w·conj(ê_rx) and the two agree (SPEC §2). Checked against the Poincaré
  sphere and the signed-axial-ratio formula on 2000 random pairs.
- **The path is one choice of three**, not two switches: direct (free space), a bounce off a flat perfect conductor, or
  through the ionosphere with Faraday rotation Ω. Faraday and a bounce together depend on the direction of the Earth's
  field on each leg (they can add or cancel); one stage contrast at a time keeps the page to one concept.
- **The bounce** is modelled in 3-D (the mirror of the field off z = 0, read in each leg's view), with a 30° grazing angle
  for the drawing; a test shows the 2-D rule (e_h, e_v) → (−e_h, e_v) holds for any angle. Only a perfect conductor:
  real ground (Brewster's angle) is out of scope.
- **Faraday rotation** is a rotation of ê about the path (quasi-longitudinal: exactly the phases e^{∓jΩ} on the two
  circular parts). The page gives no number for Ω itself (it depends on f⁻², the electron content and the field: SPEC §3
  rule 7 has the formula, marked *(check)*). While playing on the ionospheric path, Ω drifts 1° a frame (a turn in about
  25 s), so a linear receiver fades and the plot's dashed right-hand circular receiver stays flat.
- **Classification from the Stokes s3**, not the ellipse's minor axis: √(mean − dev) lost half its digits near a line (a
  65° line came out "elliptical" with q = 7·10⁻⁹). s3 is exactly 0 for a real vector. Recorded in SPEC §1.4.
- **Relative numbers only** (PLF, dB, voltage as a share of the matched case). Absolute fields and voltages are
  `polarization`'s; here the PLF is the point.
- **Layout**: the path picture (oblique view, as in `polarization`) above the two views on the left; the table and the
  plot (PLF in dB, floor −30 with −∞ below) on the right. Six presets in two columns and the paired sliders side by side
  keep the panel on one screen in the fullest state (circular Tx with both error sliders, a linear Rx, the ionosphere).
- **Presets: six** (the task's 3–6). "Vertical against 45° slant" (−3 dB) is not a preset: it is one pick in the Rx list
  from the default; the catalogue's other claims each have a key.
- **Tags**: `antennas`, `em-waves` (the task's; both in `tags.json`). Topic `radio`, level `core`. `related`:
  `polarization` (this page builds on it), `dipole-field`, `accelerated-charge`.
- **Idea credit** (owner, 2026-11-09): the exact wording from the task, in the transport bar, both languages; not in
  `sim.json` `credits`, no person named.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- **"A dipole and a small loop in the same plane are crossed"** (catalogue, task Goal) is not what the page shows,
  because it is not what the standard field gives. A small loop is a magnetic dipole along its axis; its far field is
  E_φ about that axis (Balanis §5.2), so **E lies in the loop's plane**, across the direction of travel. A dipole lying
  in the loop's plane, across the path, is therefore matched with it; the crossed pair is **a dipole along the loop's
  axis**, e.g. a vertical dipole and a flat (horizontal) loop. The `loop` preset shows exactly that, and the caption and
  the explanation say it. See "For the owner": the 50ohm text states the opposite.
- The loop is always placed with the path in its plane (its maximum). A loop facing the path (its axis along the path)
  sends nothing that way; that is `polarization`'s end-on null, out of scope here.
- Reflection and Faraday rotation are alternatives (a three-way path choice), not two switches that combine (Decisions).
- Six presets instead of seven; the 45° slant is in the Rx list (Decisions).

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: §2.12 (polarization: linear, circular, elliptical, the axial ratio, the sense
  seen from behind the wave), §2.12.2 (polarization loss factor |ρ̂_w·ρ̂_a*|²), §2.15 (V_oc = l_e·E^i), §5.2 (small
  loop: E_φ, the magnetic-dipole dual) *(check § and equation numbers; the book was not at hand; every number was
  recomputed from the formulas)*.
- J. D. Kraus, *Antennas*, ch. 2: the Poincaré sphere and the polarization-matching factor cos²(γ/2) *(check)*.
- W. L. Stutzman, *Polarization in Electromagnetic Systems*: the PLF of two ellipses from their signed axial ratios and
  tilt difference *(check)*.
- D. J. Griffiths, *Introduction to Electrodynamics*, ch. 9 (polarization of plane waves; reflection at a conductor).
- ITU-R P.531: Faraday rotation Ω = 2.36·10⁴ B_av N_T / f² *(check the constant and units)*. Used in SPEC.md only.
- 50ohm-contents-hr: `sections/polarisation.md` ("lijevo/desno cirkularno polarizirani"), `sections/polarisation_2.md`
  (crossed dipoles fed 90° apart give circular polarization; horizontal/vertical refer to E), satellite slides
  ("Faradayeva rotacija").

## Checks

- **Numbers**: a separate Python script (scratch, not committed; below) recomputed every number in SPEC.md §3 and §5 by
  another route (2-D Jones vectors, the Poincaré sphere, the signed-axial-ratio formula): v/h, v/s, linear/circular at
  12 angles, R/L with errors (AR and PLF for five amplitude/phase pairs), the bounce (R → L, 45° → 135°), Faraday
  (cos²Ω; circles unchanged), and 2000 random pairs where the three routes agree to 1e-15. The model matches to the
  printed digits; the tests repeat the Poincaré and Stutzman checks in JavaScript.
- **Tests**: 33, tie-breaks first; every rule and tie-break has its test.
- **Fresh review and mutation pass** (a separate agent with no part in the build re-derived the physics and broke rules in
  a copy, 56 mutations). It confirmed the view convention, the PLF form (Hermitian, with ê_rx the wave the Rx takes),
  the small loop (and that the 50ohm sentence is wrong), the bounce, Faraday rotation and every number in SPEC.md §3 and
  §5. 15 mutations survived: 6 equivalent (cos is even; class order of disjoint ranges; `flipped` by inequality; Ω = 0;
  `line180` on an angle already in range; the bounce angle, now pinned), 9 real, now killed by added tests (the voltage
  readout √PLF; the voltage's phase with a complex V; both PLF-class thresholds; the line/ellipse threshold; the bounce
  leg frames; `rotate`'s axial term; the comparison receiver unturned; `sense` near a line). Four were re-broken by hand
  and fail. Fixes from the review: kind and sense could disagree a hair off a line (the sense now comes from the sign of
  s3); `om` and `t` took `true` as 1; the loop caption appeared in states where it was false (now only a flat loop
  against a vertical dipole, off the ionosphere) and now also when the loop sends; the explanation said an antenna
  takes "the wave it would send" (it takes the wave of the same sense seen from behind its own wave; in one view that is
  the conjugate); "at right angles to the wave" → "to the wave's E"; "rejects reflected waves" → "a once-reflected wave";
  dB with two decimals below 100 (−19.86 dB, as in SPEC); the plot's marker at 0 for a circular Rx; four Croatian fixes
  (the elliptical caption, "jedan period", "dulje", "obrće", the quotes „…“).
- `npm run gate -- polarization-mismatch`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus every preset, the fullest panel (circular Tx with errors,
  linear Rx, ionosphere, in both languages) and the phone with the bounce.
- Play checked in a browser: time runs, Ω drifts on the ionospheric path, PgDn steps 15°, a preset stops the clock, no
  console errors.

```python
# the check script, condensed: 2-D Jones vectors (h right, v up, from behind the wave), e^{+jωt}
import cmath, math
d = math.radians
lin = lambda t: (math.cos(d(t)), math.sin(d(t)))
def cross(rho, a, ph, s):   # dipole 1 at rho, dipole 2 at rho + 90 with amplitude a and phase s·ph
    u1, u2, c = lin(rho), lin(rho + 90), a * cmath.exp(1j * s * d(ph))
    return (u1[0] + c * u2[0], u1[1] + c * u2[1])
def norm(e): n = math.hypot(abs(e[0]), abs(e[1])); return (e[0] / n, e[1] / n)
def stokes(e):
    x, y = norm(e); return (abs(x)**2 - abs(y)**2, 2 * (x.conjugate() * y).real, 2 * (x.conjugate() * y).imag)
plf = lambda w, m: abs(sum(a * b.conjugate() for a, b in zip(norm(w), norm(m))))**2
poincare = lambda w, m: (1 + sum(a * b for a, b in zip(stokes(w), stokes(m)))) / 2
R, L = (1, 1j), (1, -1j)
print(plf(lin(90), lin(0)), plf(lin(90), lin(45)), plf(lin(90), R), plf(cross(0, .9, 80, 1), L))  # 0 0.5 0.5 0.0103
print(plf((-R[0], R[1]), R), plf((-lin(45)[0], lin(45)[1]), lin(45)))                              # bounce: 0 0
```

## For the owner

- **The small loop's polarization** (needs a decision on the course text, not on this page). 50ohm-contents-hr,
  `sections/polarisation_2.md` (the "indepth" box), says: "vodoravno postavljena Magnetic-Loop antena ima vertikalnu
  polarizaciju, a vertikalno postavljena … horizontalnu". The textbook field of a small loop (Balanis §5.2: E_φ about the
  axis) gives the opposite in the loop's plane, where it radiates most: a flat loop is horizontally polarized, an upright
  loop is vertically polarized towards the horizon in its plane (and horizontally straight up). The catalogue's "a dipole
  and a small loop in the same plane are crossed" seems to follow the 50ohm sentence. The page follows the textbook and
  says "a dipole along the loop's axis is crossed with it".
- Terms not settled (used as below, each *(check)*):
  - *(check)* **faktor gubitka polarizacije** (polarization loss factor; the table says "faktor gubitka |ê·ê*|²").
  - *(check)* **omjer osi** (axial ratio).
  - *(check)* **eliptična polarizacija** (elliptical polarization; 50ohm has only "eliptične putanje" for orbits).
  - *(check)* **križni dipoli** (crossed dipoles; 50ohm: "dva međusobno okomita dipola").
  - *(check)* **vodljiva ploha** (conducting surface), **odbijanje** (a bounce / reflection).
  - *(check)* **mala loop antena** (small loop; 50ohm: "loop antena", "Magnetic-Loop antena") and **petlja** in the
    preset name.
  - *(check)* **Faradayev kut Ω** (Faraday angle; 50ohm has "Faradayeva rotacija").
  - *(check)* **križna polarizacija** (cross-polarization), carried over from `polarization`.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| right-hand / left-hand circular polarization | desnokretna / lijevokretna cirkularna polarizacija | catalogue §4.15, from 50ohm-contents-hr |
| small loop | (mala) loop antena | 50ohm-contents-hr "loop antena" |
| Faraday rotation | Faradayeva rotacija | 50ohm-contents-hr |
| phase shift | fazni pomak | 50ohm-contents-hr |
| polarization loss factor | faktor gubitka polarizacije | *(check)* |
| axial ratio | omjer osi | *(check)* |
| elliptical polarization | eliptična polarizacija | *(check)* |
| crossed dipoles | križni dipoli | *(check)* |
| cross-polarization | križna polarizacija | *(check)* |

## Shared requests

- **models/**: `polarization.js` here is `sims/polarization/polarization.js @ f39d4ae` with every function unchanged and
  five pure functions added at the end (`conj`, `sense`, `stokes`, `rotate`, `mirror`), each with a test ("module
  (added)" in `sim.test.js`). It can be promoted as `models/polarization.js` in place of the original (a superset, same
  registration name `SimdeckModels['polarization']`), with a `models/CHANGELOG.md` line for the five additions; both pages
  then include it from `models/`. The convention stays the bilinear one; this page conjugates the receiver's vector
  itself (`sim.js` `voltage`).
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `polarization`, `accelerated-charge` and
  `dipole-field`; worked around in this page's CSS.
- **kit (`kit.js`)**: the same request for an explorer time axis (play, scrubber, step keys); built here as in
  `polarization`.
- **kit**: a way to lay paired range controls side by side (this page grids `[data-sd-controls] .sd-group` by
  `data-key` in its own CSS).

## Learn tree

Suggested leaf: `radio › antennas › polarization` "Polarizacija" / "Polarization", after `polarization` (catalogue
§4.15; the subject and leaf were added with t-0369's merge).

## Time

Start 11:13, done 11:37 on 2026-11-09 (model, tests, page, gate green, fresh review and its fixes): one session.
