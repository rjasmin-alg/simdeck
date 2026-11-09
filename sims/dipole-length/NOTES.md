<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dipole-length: notes

Task `docs/tasks/w3/dipole-length.md`, catalogue `ant-dipole-length` (§4.15, shared model 3 of §5.26, first user). A new
native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in
`SPEC.md`. The task's "Model and presets" section was empty; SPEC.md fills it.

## Decisions

- **One thin centre-fed wire, L from 0.1 λ to 2 λ in steps of 0.01 λ**, with the textbook sinusoidal current
  I(s) = I_m·sin(k(L/2 − |s|)) (Balanis §4.5). Every number follows from that one assumption; it is exact for a very thin
  wire and is what Balanis' and Kraus' tables use.
- **What is held fixed: the crest of the standing wave (I_m = 1).** The picture is "the same standing wave, cut to
  length": a short dipole holds only the part near the zeros, so its current is small everywhere (the task's words); at λ
  the feed is at a zero; nothing is singular anywhere on the slider. Holding the feed current fixed would blow up at λ,
  and holding the power fixed would make the short dipole's current large, the opposite of the task's sentence.
- **Two resistances, as Balanis §4.5 plots them against l/λ** *(check figure number)*: the **radiation resistance** referred to the
  largest current on the wire (the feed current up to λ/2, the crest beyond: 2.00 Ω, 73.1 Ω, 199 Ω at λ, 105 Ω at 3λ/2),
  and the **feed resistance** R_crest / sin²(πL), equal up to λ/2, larger beyond, ∞ at λ and 2λ. The task's "radiation
  resistance and feed impedance" are these two. The pair makes the full-wave contrast visible: the antenna radiates well
  (199 Ω) while the feed sees a very high resistance.
- **Feed reactance is left out.** It needs a wire radius and the induced-EMF method, is the core of `ant-small-antenna`
  (a large capacitive reactance, the loading coil) and would be a second concept here. The explanation says a real
  half-wave dipole is cut a few per cent short to make its reactance zero.
- **Feed resistance above 10 kΩ is shown as "> 10 kΩ"** and the caption says "some kΩ on a real wire": near λ the thin-wire
  sinusoidal current is no longer exact and the model would print artefacts like 2 MΩ (SPEC tie-break 5).
- **The pattern is drawn as field strength over an isotropic radiator of the same power**, √D(θ), with the isotropic
  circle (dotted) and the short dipole's √1.5·sin θ (dashed) as references, so "the pattern barely changes" (short against
  λ/2) and "the beam narrows" (λ, 1.25 λ) are both visible on one fixed scale. The main lobe's direction and its
  half-power lines are drawn.
- **Current drawing at a fixed scale** (2 λ plus λ/4 past each end fills the height), so the length is honest; the
  standing wave's envelope continues faintly past each end to show that the open ends sit on zeros. The current now,
  I(s)·cos ωt, is drawn to the right for the end segments' direction and to the left when it flows the other way; the
  reversed segment is also hatched and its arrows are purple, so colour is never alone.
- **Time**: the current swings; play (P), the scrubber in the transport bar, → / PgDn and ← / PgUp ±15°, Home / End,
  reduced motion jumps 45° a second; all as in `dipole-field` and `polarization`. The pattern and the resistances do not
  depend on time.
- **Lengths in metres at 7.1 MHz** (λ = 42.22 m), a concrete number for the HAM course.
- **The shared model** is its own module, `current-pattern.js` (pure, no strings): elements with length, position,
  orientation, amplitude and phase; the sinusoidal current; the element factor; the complex far-field sum with the
  position phase; Simpson integrals on the axis (one element) and over the sphere (any set); resistance referred to the
  crest; directivity with the main lobe, the half-power beamwidth and the side-lobe level. It registers as
  `SimdeckModels['current-pattern']` in the page and is `module.exports` under node. The page uses one element; the sum,
  positions and phases are tested (two elements in antiphase cancel, two λ/2 apart cancel end-on and add broadside, the
  sphere integral equals the axial one in any orientation) so `ant-array-phasing`, `ant-ground-image`, `ant-yagi` and
  `ant-gain-directivity` can build on it.
- **Tags**: `antennas` (the task's; in `tags.json`). Topic `radio`, level `core`. `related`: `lambda-f`, `lc-antenna`,
  `swr` (the catalogue's), `dipole-field`.
- **No idea-credit line**: the task's antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- **The short-dipole formula.** The task and the catalogue say "a short dipole: about 790·(L/λ)² Ω". That is the
  uniform-current (Hertzian) dipole, Balanis eq. 4-19: 80π²(l/λ)². A centre-fed dipole with open ends, the task's own
  premise, carries a triangular current, and its radiation resistance is a quarter of that, 20π²(L/λ)² ≈ 197·(L/λ)²
  (Balanis eq. 4-37), because the triangle's mean is half its peak. The full model agrees: 2.00 Ω at 0.1 λ, against
  1.97 Ω by the 197 formula and 7.9 Ω by the 790 one. The page uses 197·(L/λ)² and the explanation names the 790 figure
  as the uniform-current case (four times as much). The catalogue line §4.15 should read 197; see "For the owner".

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed., ch. 4: §4.2 eq. 4-19 (Hertzian dipole, 80π²(l/λ)²), §4.3 eq. 4-37 (small
  dipole, triangular current, 20π²(l/λ)²), §4.5 eq. 4-56 (sinusoidal current), eq. 4-58a (far field), eq. 4-70a (R_r by
  Si and Ci), eq. 4-79 (R_in = R_r/sin²(kl/2)), §4.6 (half-wave: 73 Ω, 2.15 dBi, 78°), Table 4.2 *(check eq. and table
  numbers; the book was not at hand, the numbers were recomputed from the formulas)*.
- J. D. Kraus, *Antennas*, the chapter on thin linear antennas (the patterns of 1.25 λ and 1.5 λ dipoles, 5.2 dBi at
  1.25 λ) *(check chapter)*.
- 50ohm-contents-hr: dijagram zračenja, izotropni zračitelj, dobitak, dBi, širina snopa na polovici snage, skraćene antene
  (catalogue §4.15 "settled" list).
- Real half-wave dipoles cut about 5 % short (end effect, wire thickness) *(check)*: a common ham-radio figure (143/f
  against 150/f), named in the explanation without a number.

## Checks

- **Numbers**: `check.py` (scratch, not committed) computed every number in SPEC.md §3 and §5 by two other routes:
  scipy `quad` of F² sin θ, and Balanis' closed form 4-70a with scipy's Si and Ci (both agree to 6 digits); directivity,
  main lobe (by `minimize_scalar`) and beamwidth on a 0.05° grid; 0.2 λ for the "halving" figure; Cin(2π)/2. The JS model
  matches to the printed digits (tests use those values).
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in SPEC.md
  §3 and §5 with scipy (quad and the Si/Ci closed form) and found them right, and ran 72 mutations, 30 of which survived
  at first. Fixed from it: "1.25 λ is the narrowest broadside beam / the longest with one lobe" was wrong (directivity
  peaks at 3.296, 5.18 dBi, near 1.27 λ; the broadside lobe narrows on and stays the main one up to 1.44 λ): the preset
  hint, the explanation and SPEC §5 now say "near the highest directivity"; the "only … short-dipole formula" sentence
  ran up to 0.49 λ (now up to 0.3 λ, a neutral sentence for 0.3–0.5 λ); feed resistances of 2–9 kΩ had no thin-wire
  caveat (now a `feedHigh` flag above 2 kΩ and its own sentence); the plot's feed curve left a gap where it came down from
  the top edge; Croatian "jedan period", "Tri poluvala". New tests kill every behaviour-changing survivor (off-grid slider
  values, `atCrest` tolerance, "reversed" at a zero, the mirrored short-dipole curve, the sweep against the state, side
  lobes from just above λ and the mirror peak, an `amp: 0` element, the main-lobe tie-break now tested on hand-built
  ties through `pickMain`); re-run, 12 of 13 targeted mutations fail a test. The one survivor, dropping the fold of the
  main lobe into 0 … 90°, is equivalent for one element (its pattern is symmetric and ties already go to the angle
  nearer 90°); the fold stays for asymmetric sets. The other first-round survivors were equivalent (dead guards, sampling
  details within tolerance).
- `npm run gate -- dipole-length`: all rules pass (46 browser checks); screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus every preset and 0.35 λ, 0.75 λ, 0.97 λ (> 10 kΩ) and 3λ/2 at ωt = 120° at
  1920×1080. Fixes from that look: the main-lobe label ran back over the centre (now ends at the lobe's outer end, inside
  the panel); the feed circle hid the 0.1 λ wire (smaller); three caption sentences (λ is not "a little flattened"; at 2 λ
  the broadside null comes from the reversed middle cancelling the outer segments, not "the two halves"; the
  loss-resistance clause only up to 0.25 λ).
- `npm test`, `npm run check`: pass.

## For the owner

- **Catalogue §4.15 and the task file say "790·(L/λ)²" for a short dipole**; the right figure for a centre-fed dipole
  with open ends is 197·(L/λ)² (see Deviations). The page uses 197 and explains the 790.
- Terms not settled (used as below, each *(check)*):
  - *(check)* **otpor zračenja** (radiation resistance; catalogue: one hit in 50ohm).
  - *(check)* **usmjerenost** (directivity; catalogue lists it as unsettled).
  - *(check)* **otpor na napajanju** (feed resistance) and **napajanje** for the feed point.
  - *(check)* **stojni val struje**, **trbuh** (crest / antinode) and **čvor** (node) of the current.
  - *(check)* **poluvalni / punovalni dipol** (half-wave / full-wave dipole), **produženi dipol** (extended dipole).
  - *(check)* **glavna latica**, **bočne latice** (main lobe, side lobes).
  - *(check)* **obrnuta struja** (reversed current).

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| radiation pattern | dijagram zračenja | 50ohm-contents-hr |
| isotropic radiator | izotropni zračitelj | 50ohm-contents-hr |
| half-power beamwidth | širina snopa na polovici snage | 50ohm-contents-hr |
| short antennas | skraćene antene | 50ohm-contents-hr |
| radiation resistance | otpor zračenja | *(check)* |
| directivity | usmjerenost | *(check)* |
| feed resistance | otpor na napajanju | *(check)* |
| standing wave (of current) | stojni val (struje) | *(check)* |
| current antinode, crest | trbuh struje | *(check)* |
| current node | čvor struje | *(check)* |
| half-wave dipole | poluvalni dipol | *(check)* |
| full-wave dipole | punovalni dipol | *(check)* |
| main lobe / side lobe | glavna latica / bočna latica | *(check)* |

## Shared requests

- **models/**: `current-pattern.js` is model 3 of catalogue §5.26, ready to promote as `models/current-pattern.js` (its
  registration line already uses `SimdeckModels['current-pattern']`). Its rule tests are the "module: …" tests in
  `sim.test.js` plus rules 1, 5, 6 and 7. Mutual impedances (for `ant-yagi`) and a reactance (for `ant-small-antenna`)
  are not in it yet; they would be added as new functions.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `accelerated-charge`, `dipole-field` and
  `polarization` (the hidden time control); worked around in this page's CSS.
- **kit (`kit.js`)**: the same request for an explorer time axis (play, scrubber, step keys); this page builds them as
  `dipole-field` does.

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › dipole` "Dipol" / "The dipole": this sim, later
`ant-small-antenna`.

## Time

Start 11:41, done 12:40 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes): one session.
