<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ground-image: notes

Task `docs/tasks/w3/ground-image.md`, catalogue `ant-ground-image` (§4.15; shared model 3 of §5.26, "an element plus its
image"). A new native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and
numbers are in `SPEC.md`; the task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **Three antennas**: a horizontal half-wave dipole, a vertical half-wave dipole (both by the height of the centre), and
  a λ/4 ground plane standing on the ground (no height; the slider is hidden and keeps its value). The task asks to
  "raise and lower a horizontal and a vertical antenna"; a quarter-wave rod on the ground cannot be raised without
  changing what it is (an elevated ground plane is a different antenna), so the vertical that rises is the dipole. Its
  height starts at λ/4 (lower end on the ground): the slider's minimum depends on the antenna, and the model clamps too.
- **One drawn plane**: the elevation pattern across the horizontal wire (where it beams); the verticals are the same all
  round. The wave picture is that plane from the side, the wire seen end-on.
- **Grounds**: perfect, average (ε_r 13, σ 0.005 S/m), poor (ε_r 5, σ 0.001 S/m), at **7 MHz** (λ = 42.83 m). 7 MHz
  rather than 14 MHz because near-vertical incidence (the low dipole's short hop) is a 40 m and 80 m practice; at
  14 MHz a near-vertical wave usually passes through the ionosphere. The heights are also shown in metres at 7 MHz.
- **Real ground: the reflection-coefficient model** (far field only, plane-wave Fresnel coefficients relative to a
  perfect ground, TE and TM separately; no ground wave). Over a perfect ground it is image theory exactly.
- **Power bookkeeping** (SPEC §2): for the dipoles the feed delivers sky + what the ground absorbs from the downward
  wave; over a perfect ground that equals image theory's R₁₁ ∓ R₁₂(2h) (tested to 1e-4). For the ground plane the
  radials are a perfect mirror close to the rod, so the feed always sees R₁₁/2 = 36.54 Ω and whatever does not reach
  the sky is lost. Using the dipoles' rule for the ground plane would let its feed resistance fall to 15–19 Ω over a
  real ground (the reflection at grazing cancels the rod) and give +2 to +3 dBi over land, which no ground-plane user
  sees; with the radial rule it gives −0.05 dBi at 26° (average) and −1.8 dBi at 29° (poor), the usual handbook
  figures *(check)*. Using the ground plane's rule for the dipoles fails for a low horizontal dipole (more power reaches
  the sky than image theory's 5.8 Ω feed would deliver). The two rules are stated in the explanation.
- **The feed resistance is shown only where it is sound**: over a perfect ground (image theory) and for the ground plane
  (its radials). Over a real ground the dipoles' row shows —.
- **Gain** in dBi over the power fed in; the plot shows field over a free-space half-wave dipole fed the same power,
  fixed outer ring 2.5× (the largest in the ranges is 2.25×), so raising, lowering and changing the ground compare on
  one scale. The perfect-ground pattern is drawn dotted beside a real ground's: the filled nulls and the lost gain show.
- **Take-off angle** = the strongest lobe; equal lobes (every lobe of a horizontal dipole over a perfect ground is
  equally strong) go to the lowest, the one that reaches farthest (SPEC tie-break 3). The half-power span and the hop's
  landing range come from that lobe.
- **Lobe count**: found on the pattern, not by formula; over a perfect ground it is ⌈2h/λ⌉ for the horizontal dipole.
  The catalogue's "a lobe for every half wavelength of height" holds; the model also shows that each new lobe is born
  straight up, weaker, and moves down as the antenna rises (h = 0.55 λ: 27° and a small one at 90°). Over a poor ground
  a filled zenith null becomes a small lobe (preset 4 has 5 against 4).
- **The hop**: skip-distance's geometry (a mirror at 300 km, the F2 region's virtual height; copied from
  `sims/skip-distance/sim.js` @ 58ecd9b), shown as a 0 … 4000 km strip with the half-power span shaded. Whether the
  ionosphere turns the wave back at that angle and frequency is out of scope (said in SPEC §8).
- **Wave picture**: the direct wave plus the reflected one (the image's, times the reflection at the image ray's
  elevation), far-field terms with their element factors, brightness evened out with distance as in `antenna-array`;
  diverging colour, a null blank. Below the ground the earth is hatched, the image dashed. Two rays at the take-off
  angle (direct; reflected, dashed under the ground from the image) when it is between 2° and 88°. The region is at
  least 4 λ across and 2h + 3.2 λ tall, and any room left in the column goes to more sky.
- **Time on the stage**: Play (P), → / ← / PgDn / PgUp 15°, Home/End, a scrubber; reduced motion steps 45° a second;
  copied from `antenna-array`. The pattern and the readout do not depend on time (tested).
- **Presets**: low (NVIS) over average ground, λ/2, 2 λ, 2 λ over poor ground, the ground plane over a perfect and over
  a poor ground. The vertical dipole has no preset of its own (six is the limit); it is one click on the antenna choice.
- **Tags**: `antennas`, `propagation` (the task's; both in `tags.json`). Topic `radio`, level `core`. `related`:
  `skip-distance` (the task's link), `antenna-array` (the image as a second element), `dipole-length`,
  `gain-directivity`.
- **No idea-credit line**: the antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the needed terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. Additions the task did not name: the average ground between perfect and poor, the vertical
  half-wave dipole besides the ground plane, the half-power span and the hop's landing range.

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: §4.7 (vertical and horizontal dipole above a perfect conductor, image
  theory, the quarter-wave monopole's 36.5 Ω), §4.8 (ground effects, reflection coefficients for a real ground)
  *(check section and eq. numbers; the book was not at hand, every number was recomputed)*.
- J. D. Kraus, *Antennas*: the ground as a mirror, tables of mutual resistance of side-by-side and collinear half-wave
  dipoles (R₁₂ collinear 26.4 Ω with the ends touching) *(check chapter)*.
- Ground constants: the usual "average" and "very poor" grounds of amateur antenna handbooks; ITU-R P.527 for the
  ranges *(check)*.
- 50ohm-contents-hr: kut zračenja, groundplane antena, dijagram zračenja, dobitak, dBi (catalogue §4.15 "settled").
- `sims/skip-distance` (the hop), `sims/antenna-array` and `sims/dipole-length` (the copied models).

## Checks

- **Numbers**: an independent numpy script (scratch, not committed) computed the fields over the upper hemisphere on a
  1200 × 360 grid with a different quadrature, the mutual resistances by scipy `quad`, take-off angles on a 0.01° grid
  and the hop. The JS model matches to the printed digits; the tests use those values. Perfect-ground feed resistances
  by the hemisphere integral equal image theory to 1e-4 at every height tried.
- `node --test sims/ground-image/sim.test.js`: 24 tests pass, tie-breaks first.
- **Own mutation pass**: 35 mutations of `sim.js` and `ground.js`, one or more per rule and tie-break; 32 fail the
  tests. The three survivors are equivalent: the `alphaDeg >= 90` guard in `hopKm` (the formula already gives 0 there,
  as skip-distance notes), the 1e-9 in `⌊2h + 1e-9⌋` (2h is exact on the 0.05 grid) and `e <= 0 || e >= 90` in
  `halfPower` (both forms reach the same edge). The pass found two real gaps, now tested, and one defect, fixed: a
  plateau at the zenith counted as two lobes (now a flat top counts once, at its lower edge; SPEC tie-break 4).
- `npm run gate -- ground-image`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus every preset and odd cases (vertical at λ/4 and 1.2 λ over a real ground,
  3 λ over poor ground, the ground plane over a perfect ground) in hr and en. Fixes from that look: the λ bar under the
  map's title, then under the image's label; the map square instead of filling the column; the hop label over its
  marker; the ring label over the curves; the English legend wrapping the header; a 13 px `<sub>` in the explanation
  on the phone; a long plot title cut on the phone (now a second, muted line).
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in SPEC.md
  (closed-form Ci/Si resistances, Gauss–Legendre over the hemisphere, brentq edges, a 0.002° lobe grid) and found them
  all right, and found no physics defect. 85 mutations, 63 killed. Fixed from it:
  - the caption "one for every λ/2 of height" was said wherever two or more lobes showed, but it holds only for the
    horizontal dipole over a perfect ground (a real ground adds a small lobe straight up when 2h is whole; a vertical's
    count differs): now that case only, elsewhere "the higher the antenna, the more";
  - "a ground plane is a long-distance antenna" was said for a vertical dipole: now "a vertical antenna";
  - "the two are less than half a period apart" at h = λ/4, where they are exactly in step: now "less than half a
    period out of step";
  - test gaps now covered: time and height rounded to the nearest step (not down), the ground plane keeping a low h,
    the zero-lobe threshold (a real lobe of the vertical at 2.8 λ, 83.7°, sits at 3e-4 of the main one; vertical lobe
    counts against a fine scan), tie-break 3's 1e-9 tolerance from both sides, a half-power edge bisected short of an
    end that is itself below half, the plot ring 2.5.
  - equivalent survivors left as they are: the 0.05° grid against 0.1° (refinement reaches the same peaks), tie-break
    8's 1e-9 (the weakest non-null zenith in range is 0.038 of the main lobe), the kind thresholds, the φ points.

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **zrcalna slika** (image antenna; the catalogue's own *(check)*).
  - *(check)* **latica** (lobe), as in `gain-directivity` ("bočna latica").
  - *(check)* **zračenje gotovo okomito uvis (NVIS)** (near-vertical incidence skywave).
  - *(check)* **savršeno / prosječno / loše tlo** (perfect / average / poor ground).
  - *(check)* **koeficijent refleksije** (reflection coefficient), only in the explanation.
  - *(check)* **pseudo-Brewsterov kut** (pseudo-Brewster angle), only in the explanation.
  - *(check)* **ulazni otpor** (feed resistance) and **radijali** (radials).
  - **F2-regija**, **skok** as in `skip-distance`.
- Whether the ground plane's feed should stay at 36.5 Ω over a real ground (the radials' rule above) or follow the
  dipoles' rule. The radial rule matches handbook gains; the other is one rule for all three. For
  `docs/tasks/OPEN.md` (the gate's scope rule keeps this task inside its folder, so the coordinator adds it).

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| take-off angle (radiation angle) | kut zračenja | 50ohm-contents-hr |
| ground plane antenna | groundplane antena | 50ohm-contents-hr |
| radiation pattern | dijagram zračenja | 50ohm-contents-hr |
| image antenna | zrcalna slika | *(check)* |
| lobe | latica | *(check)* |
| near-vertical incidence skywave | zračenje gotovo okomito uvis (NVIS) | *(check)* |
| perfect / average / poor ground | savršeno / prosječno / loše tlo | *(check)* |
| reflection coefficient | koeficijent refleksije | *(check)* |
| pseudo-Brewster angle | pseudo-Brewsterov kut | *(check)* |
| feed resistance | ulazni otpor | *(check)* |
| radials | radijali | *(check)* |
| hop | skok | skip-distance |

## Shared requests

- **models/**: `ground.js` is "an element plus its image" for model 3 of catalogue §5.26: the Fresnel coefficients, the
  reflection relative to a perfect ground, the quarter-wave rod's far field, the direct and image fields split TE/TM,
  the hemisphere integrals with the power balance, the collinear mutual resistance and image theory's feed resistance.
  Pure, registers as `SimdeckModels.ground`, requires `current-pattern.js` and `array-factor.js`; ready to promote next
  to them. Its rules are rules 1, 2, 5, 7, 8 and 9 in `sim.test.js`. `collinearResistance` could also go into
  `array-factor.js` beside `mutualResistance`.
- **models/**: `current-pattern.js` (from `dipole-length` @ 3daf9c6) and `array-factor.js` (from `antenna-array` @
  5c90be9) are unchanged copies (only the header comment differs). When they are promoted, point this page at
  `../../models/` and drop the copies.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `dipole-length`, `gain-directivity` and
  `antenna-array`.
- **kit**: a fourth explorer with the same play button, time scrubber and time keys (copied from `antenna-array`); a kit
  "time transport" would remove four copies.

## Learn tree

Suggested leaves (catalogue §4.15): a new `radio › antennas › ground` "Antena iznad tla" / "Antennas over ground" with
this sim, and also `radio › propagation › ionosphere` next to `skip-distance`.

## Time

Start 14:44, done 15:30 on 2026-11-09 (spec and number check, model, tests, page, gate green, mutation pass, review and
its fixes).
