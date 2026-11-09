<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# accelerated-charge: notes

Task `docs/tasks/w3/accelerated-charge.md`, catalogue `ant-accelerated-charge` (§4.15, shared model 1 of §5.26). A new
native explorer; nothing copied from anywhere, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`.

## Decisions

- **Exact field, not the slow-charge approximation.** The model computes the full Liénard–Wiechert field (Griffiths
  eq. 10.72) at the retarded time, so the coasting charge's lines point from its *present* position (Purcell & Morin's
  construction for a charge that stops) without a special case. In the slow limit it reduces to Thomson's kink
  (tested at β = 0.01 against E_θ/E_r = a·r·sin θ/c²) and, for the oscillation, to the Hertzian dipole (tested at
  β = 0.001 to 1 %).
- **Real units.** Metres and nanoseconds with c = 0.2998 m/ns, so the kink takes 13.3 ns to reach the probe at 4 m.
  Fields are in E1, the charge's own field at 1 m, so the radial field reads 1/r² directly (0.0625 at 4 m).
- **Speeds raised** to 0.1 … 0.4 c so that one charge's kink is visible; the explanation says that in a wire a great
  many slow charges give the same picture.
- **The motions.** `start` (a kick), `stop`, `move` (kick, coast 12 ns, stop) and `osc` (steady, T = 20 ns, λ = 6.0 m).
  The task's "jerk" is the short push itself: the push length τ (1 … 6 ns) sets the acceleration βc/τ and the shell's
  thickness cτ. The oscillation runs for all time, so its picture is the steady state (starting it would need a
  velocity jump, an infinite acceleration and a gap in every line).
- **Probes on the broadside line** (θ = 90°) at 4 m and 8 m, so doubling r gives the ratios 0.5 (1/r), 0.25 (1/r²)
  and 0.125 (1/r³). A probe angle was left out: at 8 m off the broadside it would leave the picture, and sin θ is shown
  by the picture itself (the lines straight up and down the wire never kink) and tested in the model.
- **Readout**: a table (E_r, E_θ, c·B, the peak |E_θ| with the P2/P1 ratios) and two time plots over 0 … 45 ns with
  the time now marked. The peak ratio appears only once both probes have seen the whole first push, so scrubbing
  never shows a ratio from the future. After a `start` the charge keeps moving, so later the radial field about the
  wire's centre is no longer 1/r² from the probes' point of view; the caption that sums up the push names only the
  transverse ratio for that reason, and the table shows the radial ratio as measured.
- **c infinite and B.** With c infinite the page reads c·B = 0 and says "c·B is negligible beside E", never "no
  magnetic field": B = v × E/c² → 0, but H = ε0·v × E (the moving charge's Biot–Savart field) stays finite, and the
  Poynting flux E × H averages to zero over a period. The reactive near field of an antenna has a strong H.
- **Explorer with a time control.** The time `t` is a param (it goes into the link), scrubbed from the transport bar
  with a slider like a stepper's scrubber; play is P (and the button), and → / PgDn and ← / PgUp move time by 0.5 ns,
  Home and End to its ends (an explorer gets no step keys from the kit, so the page adds them with the same meaning).
  Play runs 5 ns per second (45 ns in 9 s) and stops at the end; under reduced motion it jumps 2 ns once a second, the
  pattern of `greyline`. → and ← stay with a focused slider; PgDn and PgUp always step, as on a clicker.
- **Drawing.** SVG at 1:1 pixels (text never scaled), redrawn on resize. 24 field lines in `--c2` (E, as in
  `lc-antenna`), the shell hatched `--c5` with a dashed outer front and its radius, P1 a `--c3` diamond and solid plot
  line, P2 a `--c4` square and dashed plot line, the direction of E at each probe an ink arrow. Grayscale checked:
  shapes and dashes carry every distinction.
- **Croatian and English** in one page; no glossary terms (`[[…]]`): none of the physics terms are in `kit/glossary.js`
  and they are plain Croatian words (term pairs below).
- **Idea credit** (owner, 2026-11-09): the exact wording from the task, in the transport bar, both languages; not in
  `sim.json` `credits` (no material copied) and no person named.
- **Tags**: `em-waves` (task) and `antennas` (both in `tags.json`). Topic `radio`, level `core`. `related`:
  `lc-antenna` (the antenna notes ask for it; `lc-antenna` is not changed) and `lambda-f`.

## Deviations from the task

- No probe angle control (above). sin θ is in the model, the tests and the explanation.
- The time slider is in the transport bar, not the panel (the panel did not fit 1920×1080 otherwise, and a scrubber
  under the stage is where a lecturer looks for time).

## Sources

- E. M. Purcell, D. J. Morin, *Electricity and Magnetism*, 3rd ed., Cambridge 2013: §5.6 or §5.7 (the field of a charge
  that starts or stops) and appendix H (radiation by an accelerated charge, E_θ = q·a·sin θ/(4πε0·c²·r)). *(check section
  and equation numbers: from memory, the book was not at hand)*
- D. J. Griffiths, *Introduction to Electrodynamics*, 4th ed.: §10.3 (retarded time, Liénard–Wiechert potentials),
  eq. 10.72 (E of a moving point charge), 10.73 (B = 𝓇̂ × E / c), 10.75 (uniform motion); §11.1.2 (the oscillating
  electric dipole, far zone only, eq. 11.18), §11.2.1 (the Larmor field). *(check equation numbers)*
- C. A. Balanis, *Antenna Theory*, 3rd ed., ch. 4 (the infinitesimal dipole's E_θ with its 1/kr, 1/(kr)², 1/(kr)³
  terms, eq. 4-10). *(check equation number)*
- J. D. Kraus, *Antennas*: not used for a number here.
- 50ohm-contents-hr (`contents/`): the Croatian terms marked settled below (grep counts: blisko polje 39, daleko polje 42,
  brzina svjetlosti 26, električno polje 74, silnice in several chapters).

## Checks

- Numbers: a separate script compared `sim.js` with the book formulas (all in SPEC.md, "book" against "model"):
  Coulomb, uniform motion (Griffiths 10.75) to 1e-5, Thomson's ratio at β = 0.01 to 0.6 %, the Larmor field at 50 m to
  0.5 %, the Hertzian dipole at β = 0.001 to 4 digits, 1/r at 30 and 60 m, 1/r³ with c infinite.
- Mutation pass: 50 deliberate breaks of `sim.js`, one at a time (each tie-break including both pushes of `move`, the
  acceleration and velocity terms, retarded vs present position, B from the retarded 𝓇̂, B with c infinite, the fronts'
  radii and centre, `arrivals`, `pushes`, the stage words, the motions including `stop`'s coasting, the seed point and
  radius, the line count, step, length, margin and box stop, RK4 → Euler, the peak window, sample step and the sample
  at t, the ratio rule, θ̂'s sign, the clamps, the presets' params, the state's distance and amplitude, the series,
  T_END and TIME_STEP). Every one fails at least one test (38 tests).
- Fresh review (a separate agent with no part in the build read the code against SPEC.md and broke rules in a copy,
  87 mutations). It found: a caption claiming the transverse field "beats" the radial at the probe, false for slow
  pushes (β/τ < 0.075), now neutral; "no magnetic field" with c infinite, wrong (only c·B → 0; H = ε0·v × E stays and
  the flux averages to zero), reworded on the page and in SPEC; two SPEC numbers (the kink's arrival at P1 and P2 is
  17.34 and 30.69 ns, not 18.34 and 31.69; A·k² = 0.3144); the Croatian motion buttons "Pokreni"/"Zaustavi" also named
  play and pause, now "Polazak / Kočenje / Pomak / Titranje"; captions during a push (now "the push is still on, the
  whole disc is the shell"), for `move`'s first kink, and a "close to a half" that read 0.41 at slow pushes (now "1/r
  alone gives 0.50; a 1/r² part adds near the charge"); a peak ratio of 0.15 for a kick with c infinite that matched no
  power law (now not shown); and rules no test caught (field lines, B's direction, `arrivals`, `stop`'s coasting,
  the first push of `move`, the ratio rule while a probe is inside, sampling, presets): tests added for each. My first
  mutation pass had claimed RK4 → Euler was caught; it was not (that mutant also changed a step length). The new
  test compares a trace with one ten times finer.
- `npm run gate -- accelerated-charge`: all rules pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in
  both languages reviewed, plus every preset at 1920×1080. Render about 17 ms per frame (24 lines traced live).

## For the owner

Terms used as listed in catalogue §4.15, not settled:

- *(check)* **lom silnica** (kinked field lines): used in the title, legend ("ljuska loma") and captions.
- *(check)* **kašnjenje** for retardation (the explanation adds the English word once).
- *(check)* **poprečno polje / poprečna komponenta** (transverse field) and **radijalno polje** (radial field):
  "poprečn-" appears in 50ohm-contents-hr only for drawing descriptions, not for fields.
- *(check)* **ubrzani naboj** (accelerated charge): one hit in 50ohm-contents-hr.
- *(check)* **guranje** (a push) and the motion buttons "Polazak / Kočenje / Pomak / Titranje" (nouns, so they do not
  clash with the play button's "Pokreni / Zaustavi").

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| field line | silnica (električnog polja) | 50ohm-contents-hr |
| near field | blisko polje | 50ohm-contents-hr |
| far field | daleko polje | 50ohm-contents-hr |
| speed of light | brzina svjetlosti | 50ohm-contents-hr |
| electromagnetic wave | elektromagnetski val | 50ohm-contents-hr |
| kinked field lines | lom silnica | *(check)* |
| retardation | kašnjenje | *(check)* |
| transverse field | poprečno polje | *(check)* |
| radial field | radijalno polje | *(check)* |
| accelerated charge | ubrzani naboj | *(check)* |

## Shared requests

- **kit (`kit.css`)**: `.sd-ctl { display: flex }` beats the `hidden` attribute, so a control spec's `visible: () =>
  false` never hides the control (the kit sets `wrap.hidden`). Smallest change: `.sd-ctl[hidden] { display: none; }`
  in `kit.css`. Worked around in this page's CSS (`[data-sim="accelerated-charge"] .sd-ctl[hidden]`); drop it when the
  kit has the rule. Other pages using `visible` (`arp-local-remote`, `backup-window`) may show controls they mean to
  hide.
- **kit (`kit.js`)**: an explorer with a time axis wants the transport's play, scrubber and step keys without becoming
  a stepper. This page builds them itself (as `greyline` builds play); a kit option such as `def.time = { key: 't',
  min, max, step, rate }` would let explorers share one implementation, and the help overlay would list → ← PgDn PgUp
  Home End without the page's display-only `keys` entries.
- **models/**: model 1 of catalogue §5.26 (the retarded field of a charge on a line and the field-line tracer) is in
  `sim.js`, pure and promotable: `motionAt`, `retardedTime`, `fieldAt`, `components`, `traceLine`, `fieldLines`.
  `ant-dipole-field` reuses it for its probe. The motion profiles (`start`, `stop`, `move`, `osc`) are this page's; a
  promoted model would take the motion as a function or a list of constant-acceleration segments.

## Learn tree

Suggested leaf (catalogue §4.15): a new subject `radio › antennas` "Antene i zračenje" / "Antennas and radiation",
leaf `why` "Zašto antena zrači" / "Why an antenna radiates": `ant-accelerated-charge` (this sim, id
`accelerated-charge`), then `ant-dipole-field`, `lc-antenna`.

## Time

Start 09:08, done 09:40 on 2026-11-09 (model, tests, page, gate green, fresh review and its fixes): one session,
about 32 minutes.
