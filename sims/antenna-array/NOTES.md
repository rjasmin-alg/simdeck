<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# antenna-array: notes

Task `docs/tasks/w3/antenna-array.md`, catalogue `ant-array-phasing` (§4.15; shared model 3 of §5.26). A new native
explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`; the
task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **Elements: vertical half-wave dipoles in a horizontal line.** In the horizontal plane each is all round, so the
  pattern there is the array factor alone (the classic phased verticals); the vertical plane through the beam shows the
  multiplication by the element pattern (dipole × array factor = array). The element is the real thin-wire dipole from
  `current-pattern.js` (copied from `dipole-length`).
- **The phase step is a lag** (`lag` = α, each element lags the one before), so a positive step steers to the right
  (+x) and the caption can say "the beam turns towards the element that lags". The catalogue's 2·cos((kd cos φ + δ)/2)
  holds with δ = −α (SPEC.md §1). Range −180 … 180°; −180 is stored as 180.
- **Directivity from mutual resistances**: D = η·AF_max²/(π·R_P), R_P = Σ cos((a−b)α)·R₁₂(|a−b|d), with R₁₂ the
  side-by-side mutual resistance as a one-dimensional integral with J₀ (exact for the sinusoidal current). Exact,
  fast (≈ 5–10 ms, memoised by spacing) and accurate for narrow lobes where a coarse sphere grid is not. Checked against
  the cosine-integral form, a brute-force scipy sphere sum and `current-pattern.js` `sphereIntegral` in the tests.
- **Currents imposed equal**, mutual coupling ignored for the pattern (it changes the feed impedances; a feed network
  must force the currents). Said in the explanation; induced currents are `ant-yagi`'s concept.
- **Over-steered** (|α| > 360°·d/λ): no direction has ψ = 0; the page names the strongest direction and how far below
  full strength it is. Close-spaced antiphase pairs show the (lossless, ideal-current) super-directive rise in D;
  Hansen–Woodyard is not named.
- **Grating lobes** counted as the full-size lobes ψ = 2πm, m ≠ 0, in 0 … 180°. So λ/2 in antiphase has one (its back
  twin on the line, which Balanis treats as the onset of a grating lobe for end-fire); the caption says "the first
  grating lobe, on the line itself" there, and "a full-size beam at the back, a grating lobe" when a steered beam's
  back is one, instead of listing it again with the others.
- **Beamwidth past 180°**: the half-power walk passes the line's ends by the mirror, so a broad lobe on the line can
  read more than 180° (two elements λ/4 apart, 45°: 240°). Kept, and stated in SPEC tie-break 6.
- **Time on the stage**: the wave map (the far-field term of each element, summed, its real part at ωt) and one feed
  dial per element animate with Play (P), stepped with → / ← / PgDn / PgUp (15°), Home/End, and a scrubber in the bar,
  copied from `dipole-length`'s transport. `prefers-reduced-motion` and `?motion=reduce` step 45° a second; a link opens
  still. The far-field plots do not depend on time.
- **Wave map**: diverging colour, + towards `--c1`, − towards `--c5`, zero = the background, so a null is blank in both
  themes and in grayscale (both crests darken). Amplitudes evened out with distance (1/√(r + λ/2) per element, the sum
  × √(r_centre + λ/2)/n) so a beam keeps its brightness to the frame; the explanation says so. Close to the array (the
  map spans ±max(3, (n−1)d/2 + 2.5) λ) long arrays have not formed their far-field beams yet; the title says "near the
  array". Beam directions are short marks at the frame's edge, not lines through the picture (a line hid the beam).
- **Horizontal plot**: field over one dipole fed the same total power (the dipole a dashed circle), scale top on a
  ladder 1.5 … 4.5 so the dipole circle stays put while the beam grows, until the scale steps.
- **Layout**: three columns (map with the feed dials, horizontal plot, readout with the vertical plot), the readout
  column 19 rem with short row labels; the units line explains the angle convention, −3 dB and the side-lobe reference.
  The panel fits at 1920×1080 (862 = 862) with presets in two columns; the spacing and phase sliders are hidden for one
  element (`.sd-ctl[hidden]` workaround as in the other antenna sims).
- **Presets**: broadside, end-fire, cardioid (the catalogue's three pairs), steering (4 × λ/2, 90° → 60°), grating
  lobes (4 × 1.5 λ), eight elements.
- **Tags**: `antennas` (the task's; in `tags.json`). Topic `radio`, level `core`. `related`: `dipole-length`,
  `gain-directivity`, `multipath-interference` (the same "two paths add or cancel" idea for a receiver).
- **No idea-credit line**: the antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the needed terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. The pattern is shown as field strength on a linear scale only (no dB toggle): side and grating lobes
  are visible on it, and the readout gives their level in dB.

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: ch. 6 (two-element array, pattern multiplication, n-element uniform array,
  the array factor sin(nψ/2)/sin(ψ/2), eq. 6-10; broadside, ordinary end-fire, phased scanning, grating lobes,
  d < λ/(1 + |cos θ₀|)), §8.6 (mutual impedance of side-by-side dipoles, eq. 8-68 with Ci) *(check eq. numbers; the
  book was not at hand, every number was recomputed)*.
- J. D. Kraus, *Antennas*: arrays of point sources (two sources in phase and antiphase, the λ/4, 90° cardioid; n
  sources), the table of mutual resistance of parallel side-by-side λ/2 dipoles (−12.5 Ω at λ/2) *(check chapter)*.
- 50ohm-contents-hr: dijagram zračenja, dobitak, dBi, fazni pomak, širina snopa na polovici snage, omjer naprijed-natrag,
  izotropni zračitelj (catalogue §4.15 "settled" list).

## Checks

- **Numbers**: a scipy script (scratch, not committed) computed the mutual resistances by the Ci form, the directivity
  of every preset and of the extra shapes by a brute-force sum of |F·AF|² over the sphere (3000 × 4000) and by the
  mutual-resistance sum, and the beamwidths on a 0.001° grid. The JS model matches to the printed digits; the tests use
  those values.
- `node --test sims/antenna-array/sim.test.js`: 25 tests pass, tie-breaks first.
- **Own mutation pass**: 20 mutations of `sim.js` and `array-factor.js`, one or more per rule and tie-break; 18 failed
  the tests. The two survivors are redundant guards: the end-of-line shortcut in `strongest()` (golden section reaches
  the same end within 1e-14) and the "not within 0.1° of a full-size lobe" exclusion in `sideLobe()` (the "not as strong
  as the main lobe" exclusion catches the same samples). One survivor showed a tie-break that could never decide (ties
  "closer to broadside" come in mirror pairs equally far from it): dropped, the tie goes to the smaller angle.
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in
  SPEC.md §2, §4 and §6 with its own scipy script and found them right (one comment in `array-factor.js` said −12.53
  and 40.79 Ω; fixed to −12.52 and 40.76). 48 mutations, 25 survived; the real gaps are now tested and fixed:
  - over-steered ties: AF(ψ) = AF(2π − ψ) gives equal maxima at unrelated angles (7 × 0.35 λ, 170°: 40.4° and
    156.9°), picked by grid noise; now every local maximum is refined first and ties go to the smaller angle (the
    SPEC's "mirror pairs only" was wrong);
  - an exact twin reported as a −0.00001 dB side lobe (peaks were not refined); a real side lobe at the line's end
    missed (3-element end-fire's −9.54 dB back lobe: the end is flat, a strict comparison failed);
  - halfPower's one-sided null, the over-steered end exactly at 180°, end-fire to the left typed `endfire`, a
    half-power ratio touching 0.5 exactly (now a 1e-12 margin), one element's F/B now null;
  - captions: "the first grating lobe, on the line itself" said for a steered twin at 131.8° (now a separate
    sentence); "half a period" for the back null of three or more elements (now "the n phases spread evenly round the
    circle"); a steered beam's mirror image at −φ₀ never named while F/B said ∞ (now one sentence: a line cannot tell
    its sides apart); "both sides" twice for broadside; "0.0 dB" for near-full lobes (now two decimals); "2 beams more"
    (now "2 more beams"); mixed decimals in angle lists and spacings; Croatian agreement ("jednako jako", "polje …
    slabije", "ispod pune jakosti").
  - equivalent or harmless survivors: the −0 guards, the post-grid clamp, the TOL in `fullLobes` (grid spacings are
    exact in binary), Simpson weights swapped (still a consistent quadrature), the unused `steer` field (dropped).
  After the fixes the side-lobe search has one exclusion (below the main lobe by 1e-7), which covers the main lobe,
  full-size lobes and twins once peaks are refined; the two separate exclusions it replaced were redundant (a second
  mutation run confirmed it).
- `npm run gate -- antenna-array`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark, grayscale
  and 375×812 in both languages reviewed, plus every preset and odd cases (one element, over-steered, 8 × 2 λ steered,
  a growing end lobe) in hr and en. Fixes from that look: the table squeezed (short labels, D split into two rows), the
  beam line hiding the beam on the map, the wave colours (a single ramp made nulls mid-tone; now blank), the "90°"
  label under the main-beam label, the λ bar clashing with a grating mark, an unwrapped lag on the dials, a double
  minus ("−3,0 dB slabiji").

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **antenski niz** (antenna array; the catalogue's own *(check)*).
  - *(check)* **faktor niza** (array factor).
  - *(check)* **bočno zračenje / uzdužno zračenje** (broadside / end-fire).
  - *(check)* **rešetkasti snop** (grating lobe).
  - *(check)* **zakretanje snopa** (beam steering).
  - *(check)* **kardioida** (cardioid).
  - *(check)* **međusobni otpor** (mutual resistance), only in the explanation.
  - *(check)* **glavni snop / bočna latica** (main beam / side lobe), as in `gain-directivity`.
- The slider label "Fazni pomak (svaka kasni za prethodnom)" wraps to two lines in Croatian; it fits.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| radiation pattern | dijagram zračenja | 50ohm-contents-hr |
| phase shift | fazni pomak | 50ohm-contents-hr |
| half-power beamwidth | širina snopa na polovici snage | 50ohm-contents-hr |
| front-to-back ratio | omjer naprijed-natrag | 50ohm-contents-hr |
| antenna array | antenski niz | *(check)* |
| array factor | faktor niza | *(check)* |
| broadside / end-fire | bočno / uzdužno zračenje | *(check)* |
| grating lobe | rešetkasti snop | *(check)* |
| beam steering | zakretanje snopa | *(check)* |
| cardioid | kardioida | *(check)* |
| mutual resistance | međusobni otpor | *(check)* |
| main beam / side lobe | glavni snop / bočna latica | *(check)* |

## Shared requests

- **models/**: `array-factor.js` is the array part of model 3 of catalogue §5.26 (array factor, the line of elements
  for `current-pattern.js`, J₀, the mutual resistance of parallel side-by-side elements, the power sum and the
  directivity). Pure, registers as `SimdeckModels['array-factor']`, requires `current-pattern.js`; ready to promote
  next to it. Its rules are rules 1, 2, 7 and 8 in `sim.test.js`. `ant-ground-image` (an element plus its image) and
  `ant-yagi` (mutual impedances) can build on it; the Yagi needs the mutual reactance too (a new function).
- **models/**: `current-pattern.js` is an unchanged copy of `sims/dipole-length/current-pattern.js` @ 3daf9c6 (only
  the header comment differs). When it is promoted, point this page at `../../models/current-pattern.js` and drop the
  copy.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `dipole-length` and `gain-directivity`.
- **kit**: the play button, time scrubber and time keys are copied from `dipole-length` (third explorer with a time
  axis would make a kit "time transport" worthwhile).

## Learn tree

Suggested leaf (catalogue §4.15): the existing `radio › antennas › directivity` "Dobitak i usmjerenost" / "Gain and
directivity" in `learn.json`, after `gain-directivity`.

## Time

Start 13:20, done 14:10 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes).
