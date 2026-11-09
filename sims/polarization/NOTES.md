<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# polarization: notes

Task `docs/tasks/w3/polarization.md`, catalogue `ant-polarization` (§4.15, shared model 4 of §5.26). A new native
explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`.

## Decisions

- **Two identical short dipoles, A and B, 1 km apart**, both λ/50 (0.60 m) at 10 MHz with uniform current (Hertzian, as
  in `dipole-field`), the sender carrying 1 A. The readout is then real: 3.767 mV/m broadside and 2.259 mV open circuit
  for a matched receiver. Everything else (sin θ, cos ψ, dB) does not depend on this choice.
- **Geometry kept to three angles and a switch**, so it stays "the simple, linear page": A turns about the horizontal
  axis towards B (vertical → across the path); B moves on an arc in the vertical plane through A and B (level →
  straight above); B turns about the line of sight; "Sends: A | B". With these, "rotate the transmitter", "move the
  receiver from broadside to end-on" and "rotate the receiving dipole" (the task's student actions) are each one slider.
  B is always across the line of sight, so B's own pattern factor is 1 and the only direction factor is A's sin θ.
- **Reciprocity is a switch, not a second scene.** With B sending, its field reaches A in full and A takes only its
  transverse part (drawn foreshortened, "sin θ", in B's view); with A sending, the field is sin θ and B takes all of it.
  The voltage is the same to the last digit (a test checks every angle combination). A's pattern is labelled "sending
  and receiving".
- **Polarization off broadside is the wire's projection.** A 45° wire seen from 60° up gives 63.4° in B's view (SPEC §3
  rule 3); this falls out of the vector model and is shown, not hidden. The page names angles "in B's view" for that
  reason.
- **Signed voltage.** B turned past 90° from E gets the same power in antiphase; the table says "in antiphase" and the
  plot shows the voltage curve going negative while the power curve stays positive. Mismatch is the acute angle 0 … 90.
- **The vector model is its own module**, `polarization.js`: pure, complex 3-vectors, registers as
  `SimdeckModels['polarization']` in the page and is `module.exports` under node, so the coordinator can move it to
  `models/` unchanged. It already has `ellipse` and complex `projection`/`plf` (tested with circular cases) for
  `ant-tx-rx-polarization`, which is not drawn here.
- **PLF convention.** The module uses the bilinear form |ê_w·ê_a|² (Balanis' V_oc = l_e·E), each antenna's vector being
  the field it would send, in one frame; the catalogue writes |ê_tx·ê_rx*|². For real (linear) vectors, the only kind on
  this page, they agree. For circular ones the bilinear form makes right-hand into right-hand (facing) matched, which is
  the physics; `ant-tx-rx-polarization` must keep the convention consistent (see Shared requests).
- **Time**: the wave travels from the sender to the receiver; play (P), the scrubber in the transport bar, → / PgDn and
  ← / PgUp ±15°, Home / End, reduced motion jumps 45° a second; all as in `dipole-field`. The time is a param, so a link
  opens at that moment. The instantaneous voltage `u` is shown at the receiver and as the purple projection in B's view.
- **The drawing**: an oblique (cabinet) projection, x right, z up, y receding up-right at 35°, half length; the vertical
  plane through A and B shaded; A's pattern in that plane dashed. Not to scale (1 km = 33 λ; 3 λ drawn), said on the stage.
- **Tags**: `em-waves`, `antennas` (the task's; both in `tags.json`). Topic `radio`, level `intro` (the task's).
  `related`: `dipole-field`, `accelerated-charge` (the kink picture the explanation starts from), `lc-antenna`.
- **Idea credit** (owner, 2026-11-09): the exact wording from the task, in the transport bar, both languages; not in
  `sim.json` `credits`, no person named.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. The catalogue's "|ê_tx·ê_rx*|²" is implemented as the bilinear form (equal for this page's linear
  vectors; see Decisions).

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: §4.2, eq. 4-26a (far-field E_θ of the infinitesimal dipole,
  η·k·I0·l·sin θ/(4πr)); §2.12.2, eq. 2-71 (polarization loss factor |ρ̂_w·ρ̂_a|² = cos²ψ_p); §2.15, eq. 2-92 (V_oc =
  l_e·E^i) *(check eq. numbers; the book was not at hand, the numbers were recomputed from the formulas)*.
- D. J. Griffiths, *Introduction to Electrodynamics*, 4th ed., §11.1.2 (oscillating electric dipole, E ∝ sin θ θ̂)
  *(check eq. 11.18)*.
- E. M. Purcell, D. J. Morin, *Electricity and Magnetism*, 3rd ed., appendix H (the kink: its transverse part is the
  radiation; the explanation's first paragraph).
- Kraus, *Antennas*: not used for a number.
- 50ohm-contents-hr, `contents/sections/polarisation.md`, `polarisation_2.md`, `polarisation_3.md` (vertikalna /
  horizontalna polarizacija, smjer polarizacije, "za određivanje polarizacije mjerodavno je usmjerenje električnog
  polja", "bez gubitaka zbog polarizacije"); "napon praznog hoda" from its circuit sections.

## Checks

- **Numbers**: a separate script (scratch, not committed) recomputed every number in SPEC.md §3 and §5 by a different
  route (rotation matrices, spherical-trig cos θ = cos a·sin el, the book formula for |E|): λ, l, kr, E_MAX, V_MAX, the
  cos² table, sin θ at 0/30/60/90°, and the six presets plus (45°, 60°, 0°). The model matches to the printed digits.
- **Mutation pass and fresh review** (a separate agent with no part in the build re-derived the physics and broke rules
  in a copy, 88 mutations). It confirmed the frame (+y on the right looking back from B), the model, the reciprocity,
  the circular-polarization conventions in `polarization.js` and every number in SPEC.md, the hints and the summary.
  34 mutations survived at first: of these about 15 were equivalent (no behaviour change: the 90° branch of `between`,
  unreachable guards, snaps on values already exact); the rest are now killed by added tests (antiphase not set when
  crossed; θ kept acute for a > 90; the sweep's power; every preset's params; "crossed" only at exactly 90°; the sign of
  the imaginary part in `projection`; the e^{+jωt} sense in `instant`; a complex tilted ellipse; `unit` on the imaginary
  part; EPS in `unit`; the zero-vector ellipse; the page's step constants and default sample steps). Re-run: all 13
  targeted mutations fail a test. Page and text fixes from the review: the reciprocity sentence was attached to the
  wrong case (now only when B sends: "with A sending, B would get the same voltage"); with B sending the caption said
  "takes cos ψ" while the voltage is sin θ·cos ψ (now a sentence that names A's foreshortening); "the full voltage" was
  said off broadside at less than 100 % (now "takes all of the field: v of the best"); the projection in B's view now
  includes A's foreshortening; the row "direction of E" read A's wire when B sends (now "A's wire (B's view)"); an
  angle a hair under 90° no longer shows as "90°"; "a horizontal dipole sends sideways" (it sends nothing along its own
  axis; now "towards B, in every direction at right angles to it"); "B takes all of it" (now "is not foreshortened");
  "motion" → "acceleration" for the kink; four Croatian fixes (genitive after negation, "kad bi odašiljao", "dipol
  okrenut za 180°", "u odnosu na najbolju"). SPEC §3 rule 4 now writes the signed form with A's arrow angle.
- `npm run gate -- polarization`: all rules pass (46 browser checks); screenshots at 1920×1080 light, dark, grayscale
  and 375×812 in both languages reviewed, plus every preset and a few off-axis states at 1920×1080.
- `npm test`, `npm run check`: pass.

## For the owner

Terms not settled (used as below, each *(check)*):

- *(check)* **križna polarizacija** (cross-polarization; not in 50ohm, which says only "različite polarizacije").
- *(check)* **faktor polarizacije** (polarization factor, the cos² row) and **gubitak zbog polarizacije** (50ohm has
  "bez gubitaka zbog polarizacije" once).
- *(check)* **recipročnost** (reciprocity; 50ohm uses "recipročna vrijednost" only in the arithmetic sense).
- *(check)* **spojnica** (the line of sight between the two antennas) and **prijamna žica** (receiving wire).
- *(check)* **protufazno** (in antiphase).
- *(check)* **elevacija antene B** for B's elevation angle seen from A.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| polarization | polarizacija | 50ohm-contents-hr |
| vertical / horizontal polarization | vertikalna / horizontalna polarizacija | 50ohm-contents-hr |
| direction of polarization | smjer polarizacije | 50ohm-contents-hr |
| radiation pattern | dijagram zračenja | 50ohm-contents-hr |
| open-circuit voltage | napon praznog hoda | 50ohm-contents-hr (circuits) |
| cross-polarization | križna polarizacija | *(check)* |
| polarization loss factor | faktor gubitka zbog polarizacije | *(check)* |
| reciprocity | recipročnost | *(check)* |
| line of sight (between antennas) | spojnica | *(check)* |
| in antiphase | protufazno | *(check)* |

## Shared requests

- **models/**: `polarization.js` is model 4 of catalogue §5.26, ready to promote as `models/polarization.js` (its
  registration line already uses `SimdeckModels['polarization']`). Its rule tests are the "module: …" tests in
  `sim.test.js` plus rules 1, 4 and 6. When `ant-tx-rx-polarization` builds on it, keep the bilinear convention (each
  antenna's vector = the field it would send, in one frame) or add a conjugate variant under a new name.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `accelerated-charge` and
  `dipole-field` (the hidden time control); worked around in this page's CSS.
- **kit (`kit.js`)**: the same request for an explorer time axis (play, scrubber, step keys); this page builds them as
  `dipole-field` does.

## Learn tree

Suggested leaf (catalogue §4.15): new subject `radio › antennas` "Antene i zračenje" / "Antennas and radiation", leaf
`polarization` "Polarizacija" / "Polarization": this sim, later `ant-tx-rx-polarization`.

## Time

Start 10:20, done 10:47 on 2026-11-09 (model, tests, page, gate green, review and its fixes): one session.
