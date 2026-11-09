<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# yagi: notes

Task `docs/tasks/w3/yagi.md`, catalogue `ant-yagi` (§4.15; shared model 3 of §5.26, with induced currents from mutual
impedances). A new native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and
numbers are in `SPEC.md`; the task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **Induced-EMF method** (the catalogue's "mutual impedances, Balanis ch. 8 and 10"): sinusoidal currents on thin
  wires, self impedance by Balanis 8-60 (Ci, Si), mutual impedance by integrating the exact near field E_z of one
  element's sinusoidal current along the other (any two lengths, side by side), the network solved with only the driven
  element fed. Exact for the far-field power of those currents (checked: Re Z_in = the sphere integral), fast
  (≈ 3 ms per layout, memoised). It overestimates the gain somewhat against a moment-method solution *(check)*; said
  in the explanation.
- **Horizontal elements, boom along x, forward to the right**: the top view is the fishbone everyone knows, and the
  horizontal plane is the E-plane (with the element's nulls along the wires); the vertical plane through the boom is
  the H-plane. Both planes are plotted, in dBi on a fixed scale (outer ring 10, 15 or 20 dBi, centre 30 dB below), each
  with a λ/2 dipole dashed. dB, unlike `antenna-array`'s linear field, so the back lobe and the F/B are readable.
- **The driven element is fixed at 0.475 λ** (resonance is 0.4725 λ for the 0.005 λ wire): with a slider for it the
  panel was 930 px at 1920×1080 against 862. The explanation says its length tunes out the reactance. **Deviation**
  from "change the lengths": the reflector and director lengths stay adjustable.
- **All directors alike** (one length, one spacing). Real long Yagis taper; the default's bars dip after four directors,
  which the caption reports ("the last one took … away") and the explanation explains. The `long` preset uses directors
  tuned for a long boom (0.43 λ at 0.3 λ), whose bars rise monotonically with diminishing returns.
- **Currents shown as centre currents relative to the driven element** (amplitude and phase in (−180°, 180°]), on a dial
  per element whose hand turns with ωt. Displayed this way the reflector leads and the directors lag, as in the
  textbooks; SPEC rule 5 states the beam follows the sign (a lagging element pulls the beam towards itself, as in
  `antenna-array`), checked over spacings 0.05 … 0.3 λ and lengths 0.40 … 0.55 λ.
- **F/B against the main lobe**, so a beam flipped backwards (`toolong`) has a positive F/B and the main-lobe row says
  "backward (180°)".
- **Gain against the number of directors**: horizontal bars for 0 … 8 with the present layout's other values; the
  diminishing returns (concept) are seen there and named in the caption (first vs last director).
- **Wave map** as in `antenna-array` (far-field term per element with its element factor, brightness evened out with
  distance, diverging colours with blank nulls); the map's half width steps by 0.5 λ with the boom length.
- **Time**: play/pause, scrubber and time keys copied from `antenna-array`.
- **Presets**: dipole alone, reflector, director, three elements (the default, tuned for F/B: 26 dB, 24.9 − j1.0 Ω),
  eight elements, and the same director made too long (beam backwards).
- **Tags**: `antennas` (in `tags.json`); topic `radio`, level `core`. `related`: `antenna-array`, `gain-directivity`,
  `dipole-length`, `swr`.
- **No glossary terms** (`[[…]]`): none of the needed terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- The driven element's length is fixed (above). Everything else in scope.

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: §4.5–4.6 (finite dipole, sinusoidal current), §8.5–8.6 (induced-EMF
  method, self impedance eq. 8-60, mutual impedance of side-by-side dipoles eq. 8-68), ch. 10 (Yagi-Uda)
  *(check eq. numbers; the book was not at hand, every number was recomputed with scipy)*.
- J. D. Kraus, *Antennas*: parasitic elements, mutual impedance tables *(check chapter)*.
- M. Abramowitz and I. Stegun, *Handbook of Mathematical Functions*, 5.2.14 and 5.2.16 (series for Si and Ci).
- 50ohm-contents-hr, sections `yagi_uda_1` … `yagi_uda_3`: Yagi-Uda antena, zračitelj, reflektor, direktor, parazitni
  elementi, glavni / bočni / stražnji režanj, otpor (impedancija) napajanja, nosač (boom), kut otvora, omjer
  naprijed-natrag.

## Checks

- **Numbers**: a scipy script (scratch, not committed) computed the self impedance by the closed form, the mutual
  impedances by the Ci/Si closed form (λ/2) and by `quad` of the induced-EMF integral (any lengths), solved every
  preset, and computed the directivity by a brute-force sum over the sphere (721 × 1440) and the beamwidths on a 0.01°
  grid. The JS model matches to the printed digits (SPEC §2, §6); the tests use those values.
- `node --test sims/yagi/sim.test.js`: 27 tests, tie-breaks first.
- `npm run gate -- yagi`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus all six presets in hr and en and odd cases (eight directors 0.45 λ apart, a
  short reflector and long directors 0.05 λ apart, a long director 0.05 λ in front). Fixes from that look: the panel
  overflow (driven slider dropped, shorter labels), the dials wrapping into a broken second row with ten elements, a
  six-line caption (sentences shortened), overlapping element names (every other one below when tight), the `<sub>`
  in the explanation rendering under 16 px on a phone.
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in
  SPEC.md §2 and §6 with its own scipy script (own integral of −E_z, Ci/Si closed form, sphere sum 721 × 1440) and
  found them right, the sign conventions, crest/centre currents, the sin² feed referral and the E/H geometry correct.
  46 mutations, 26 killed. Fixed after it:
  - captions: "the first director added −2.3 dB" (now signed changes when the first one lowers the gain); "a wave
    slower than light" said for backward beams and for directors whose currents lead (now only for a forward beam
    whose every director step is a lag, the step wrapped into (−180°, 180°], else "the currents do not fall behind
    step by step"); a side beam's angle called "off the boom" though measured from forward (now "from forward, at a
    slant"); "the currents in the others" with one other element (now names the reflector or the director);
  - SPEC: the largest gain in the ranges is 15.19 dBi, not 14.1 (the plots step to 20 dBi there); two stale numbers;
  - `plotTop` compared dBi with the linear dipole directivity (harmless; fixed);
  - test gaps now closed, each mutation seen failing: the side-beam test never ran (now a real side beam at
    159.96°, off the grid), the bars' memo key, the self-reactance sign, half power reached in the last step, the
    director-step wrap; `integrate` now refuses a zero panel width instead of looping (two elements at one place);
  - strings: hr "okomiti na nosač", "u odnosu na zračitelj", "svukrug"; en "Too-long director" to match the hr.
  Equivalent survivors (not gaps): the panel-layout variants of the integral stay within 5e-8 Ω (d ≥ 0.05 λ keeps the
  integrand smooth), D from Re Z_in instead of the power resistance, the norm grid's epsilon, the φ snap.

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **inducirana struja** (induced current; the catalogue's own *(check)*).
  - *(check)* **međusobna impedancija** (mutual impedance), **metoda inducirane elektromotorne sile** (induced-EMF
    method), only in the explanation.
  - *(check)* **rezonantna duljina** / "dulji (kraći) od rezonantnog" (longer/shorter than resonant).
  - *(check)* **sprega** (coupling; the catalogue's *(check)*).
  - **parazitni element**, **zračitelj** are from 50ohm-contents-hr (the catalogue listed "parazitni element" as
    unchecked; the 50ohm text uses it).
- The explanation's "a boom twice as long gives roughly 2 dB more" is read off this model's `long` series
  (1.1 λ → 2.0 λ: +2.1 dB), not from a book *(check)*.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| Yagi-Uda antenna | Yagi-Uda antena | 50ohm-contents-hr |
| driven element | zračitelj | 50ohm-contents-hr |
| reflector / director | reflektor / direktor | 50ohm-contents-hr |
| parasitic element | parazitni element | 50ohm-contents-hr |
| main lobe / back lobe | glavni režanj / stražnji režanj | 50ohm-contents-hr |
| boom | nosač | 50ohm-contents-hr |
| beamwidth | kut otvora | 50ohm-contents-hr |
| feed impedance | impedancija napajanja | 50ohm-contents-hr |
| front-to-back ratio | omjer naprijed-natrag | 50ohm-contents-hr |
| induced current | inducirana struja | *(check)* |
| mutual impedance | međusobna impedancija | *(check)* |
| induced-EMF method | metoda inducirane elektromotorne sile | *(check)* |
| coupling | sprega | *(check)* |

## Shared requests

- **models/**: `mutual-impedance.js` extends model 3 of catalogue §5.26 with the induced currents: Si/Ci, the self
  impedance (Balanis 8-60), the mutual impedance of two parallel side-by-side elements of any lengths (induced EMF),
  the impedance matrix, a complex solver, `induced()` (only one element fed: currents and feed impedance) and the
  power resistance. Pure, registers as `SimdeckModels['mutual-impedance']`, needs nothing else; ready to promote next
  to `current-pattern.js`. `antenna-array`'s `array-factor.js` `mutualResistance` is its real part for two λ/2
  elements (a test here checks the same closed form). Collinear or staggered elements are not covered.
- **models/**: `current-pattern.js` is an unchanged copy of `sims/antenna-array/current-pattern.js` @ 1dae792 (itself
  from `dipole-length` @ 3daf9c6; only the header comment differs). When it is promoted, point this page at
  `../../models/current-pattern.js` and drop the copy.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `dipole-length`, `gain-directivity` and
  `antenna-array`.
- **kit**: the play button, time scrubber and time keys are copied again from `antenna-array` (a fourth explorer
  with a time axis; a kit "time transport" would remove the copies).

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › directivity` "Dobitak i usmjerenost" / "Gain and directivity",
after `antenna-array`.

## Time

Start 15:32, done 16:10 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes).
