<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# small-antenna: notes

Task `docs/tasks/w3/small-antenna.md`, catalogue `ant-small-antenna` (§4.15, shared model 3 of §5.26). A new native
explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`;
the task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **One centre-fed dipole of 2 mm copper wire at 7.1 MHz**, 0.05 … 0.48 λ (2.1 … 20.3 m), as `dipole-length` (same
  frequency, same sinusoidal current, the same radiation resistance numbers). The slider stops at 0.48 λ because this
  wire is resonant at 0.4872 λ: up to there the antenna is capacitive and the coil is a positive inductance.
- **Impedance by the induced-EMF self impedance** (Balanis 8-60, Ci and Si), referred to the feed by sin²(πL).
  `mutual-impedance.js` is copied **unchanged** from `sims/yagi/` @ 917467e (COMMON.md §6: the model is not in
  `models/` yet); only `Si`, `Ci` and `selfImpedance` are used. The short-dipole formula −120·(ln(L/2a) − 1)/tan(πL/λ)
  agrees within 0.5 % up to 0.15 λ (tested).
- **Centre loading only**: the coil is in series at the feed, drawn on the feed line next to the gap so the antenna stays
  at a true scale against the dotted λ/2 outline (a coil drawn on the wire would not fit a 0.05 λ dipole). More turns are
  drawn for more inductance. Top loading and capacity hats (closer to Chu's limit) and a coil further out along the wire (a
  higher radiation resistance) are named in the explanation and are out of scope.
- **Wire loss is included** (copper, skin effect, the sinusoidal current): without it a lossless coil would give
  exactly 100 %, which no real short antenna does; with it the lossless coil gives 86 % at 0.05 λ and 93 % at 0.1 λ.
- **Coil Q as five choices** (50, 100, 200, 400, lossless), not a slider: the lecturer compares a few coils, and the
  trade-off chart marks every choice on the current length's line.
- **An ideal transformer matches R_in(f₀) to 50 Ω**, so the SWR is 1 at 7.1 MHz whenever the coil is on and the SWR curve
  depends only on Z(f)/R_in. Without the coil the same rule applies (the transformer matches the resistance alone), so the
  reactance alone sets the SWR. Loss resistances are held at their 7.1 MHz values over frequency (stated in SPEC).
- **The SWR plot has a fixed scale, 7.000 … 7.200 MHz** (the 40 m band in region 1): at 0.05 λ with a lossless coil the
  0.6 kHz notch is a thin spike, at full size the whole band is shaded. The model adds 121 points around f₀ so the
  narrowest notch is drawn.
- **"Pick two" as a chart**: efficiency against bandwidth, both log. Since η·BW does not depend on the coil (SPEC rule 8,
  0.1 % in the model), every length is a straight line of slope −1 and a better coil only slides along it; reference
  lines for 0.05, 0.1, 0.25 and 0.48 λ, Chu's line for this size, the 200 kHz width of the band, and the chosen coil's
  path over every length (it falls almost straight down: with a fixed coil the coil sets Q, and η falls).
- **Q and Chu**: Q = f₀·|Z′|/(2R) (Yaghjian & Best), checked against the bandwidth 0.7071·f₀/Q within 0.2 %. Chu's limit is
  the simplified one-mode bound 1/(ka)³ + 1/(ka), a = L/2, shown next to Q and as a line on the chart.
- **Time**: the current spindle around the wire (|I|·cos ωt with arrows for its direction), the tip charges (∝ sin ωt)
  and two bars for the stored energy in the coil (magnetic, cos²) and around the wire (electric, sin²). Play, scrubber
  and keys copied from `dipole-length`. Without the coil the bars are replaced by one sentence (nothing balances the
  electric energy).
- **η without the coil** is shown as "92.7 % of 0.31 mW" so the table never suggests a bare short dipole is efficient
  in practice.
- **Presets**: full size, short without a coil, short with a Q 200 coil (the default), half size, a Q 50 coil, a lossless
  coil. Keys 1–6.
- **Tags**: `antennas` (the task's; in `tags.json`). Topic `radio`, level `core`. `related`: `dipole-length`,
  `trap-antenna`, `swr` (the catalogue's), `lc-antenna`.
- **No idea-credit line**: the task's antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the needed terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. The catalogue says "Chu's limit (simplified)"; it is shown as a number and a line, not modelled as an
  antenna (no spherical-mode antenna reaches it).

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed.: §4.3 eq. 4-37 (short dipole, 20π²(L/λ)²), §4.5 (sinusoidal current),
  §8.5 eq. 8-60a/b (self impedance by induced EMF), §2.14 (ohmic loss of a wire) *(check eq. and section numbers; the book
  was not at hand, every number was recomputed with scipy)*.
- J. D. Kraus, *Antennas*: short dipole reactance −120·(ln(L/2a) − 1)/tan(πL/λ) *(check: the formula is usually credited
  to Schelkunoff; it agrees with the induced-EMF reactance within 0.5 % up to 0.15 λ)*.
- A. D. Yaghjian and S. R. Best, "Impedance, bandwidth, and Q of antennas", IEEE Trans. AP 53(4), 2005: Q_Z from the
  impedance's slope, bandwidth (s − 1)/(Q·√s) *(check eq. number)*.
- L. J. Chu, "Physical limitations of omni-directional antennas", J. Appl. Phys. 19, 1948; J. S. McLean, "A re-examination
  of the fundamental limits on the radiation Q of electrically small antennas", IEEE Trans. AP 44(5), 1996.
- 50ohm-contents-hr: `slides/elektrische_verlaengerung_verkuerzung.md` (produljna zavojnica, električno produljivanje,
  antena prekratka djeluje kapacitivno), `sections/traps.md`, `TRANSLATION_GLOSSARY.md` (stupanj djelovanja, faktor
  dobrote / dobrota, širina pojasa, reaktancija, omjer stojnog vala / SWR, prilagodba).

## Checks

- **Numbers**: a scipy script (scratch, not committed) computed the feed impedance with scipy's Si and Ci, R also by quad
  of the far field (equal to 6 digits), the wire loss by quad of ∫I², the band edges by brentq on the SWR, Q by a central
  difference, for 0.05 … 0.48 λ and every coil. The JS model matches to the printed digits; the tests use those values.
- `node --test sims/small-antenna/sim.test.js`: 40 tests, tie-breaks first.
- `npm run gate -- small-antenna`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark, grayscale and
  375×812 in both languages reviewed, plus every preset and 0.05 λ lossless. Fixes from that look: a false vertical edge
  where the SWR curve starts inside the plot, the length label over the coil label, the chart title over its top labels,
  dot labels on the axis, "1,0 %" and "1,00 kHz" ticks, η without the coil, and on a phone the chart title cut off
  (two lines now) and crowded tick labels.
- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in
  SPEC.md §4 and §6 with its own scipy script (far-field quad, and the induced EMF with the exact near field at ρ = a,
  which also checks Balanis 8-60b: −2452.11 against −2451.84 Ω at 0.1 λ) and found them all right. 70 mutations, 50
  killed at first; 11 survivors equivalent (guards that never fire, `toFixed` digits, a sort order). Fixed after it:
  - the readout put the total Q next to Chu's bound, which applies to the radiation Q: at 0.05 λ with a lossy coil it
    showed "197 (264)", below its own "at least". The row now reads "Q (radiation Q ≥ Chu)": 176 (1271 ≥ 35);
  - the energy bar said "in the coil" at every length, but the coil's share of the magnetic energy, X_L/(Q·R_in), is 96 %
    at 0.1 λ and 3 % at 0.48 λ: the bar now gives the share when it is at least half, else just "magnetic";
  - the explanation said a coil further from the feed comes closer to Chu's limit (it mainly raises R_rad): reworded;
  - captions: "nowhere in the band is the SWR under 2" at 0.47 λ without a coil (1.72 at 7.2 MHz: now from the lowest
    SWR over the band), "only 83 W gets in" (now "only" below 1 W), "only 202 kHz of the 200 kHz band" when the band is
    wider but off centre (own sentence), "full size gets both" whenever the whole band was covered, e.g. 0.34 λ with a
    Q 50 coil at 72 % (now only when |X| < R_rad, 0.47 and 0.48 λ), "only 58 Ω" near full size (now "only" below 25 Ω);
  - the band-edge search stopped at 0.33·f₀ though the spec said f₀/2 (it now tries f₀/2 itself);
  - SPEC said two coils of L_c/2; the page draws one in the feed line (SPEC now says so).
  The nine real gaps got the reviewer's tests (a null SWR counted as over, the 1e-12 margin, the first offset, the f₀/2
  limit, the dense SWR points ±3·BW and none without the coil, the Q step, the off-centre wide band); re-run, all ten
  targeted mutants fail a test. 40 tests now.
- Layout fixes after the review: the chart title wraps only when it does not fit (measured), the length label moves
  beside the wire near the bottom edge, the bandwidth label goes left of or inside its bracket when there is no room on
  the right, the "40 m band" label runs up the line.

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **otpor zračenja** (radiation resistance; catalogue: one hit in 50ohm).
  - *(check)* **otpor gubitaka** / **gubici zavojnice**, **gubici žice** (loss resistance; coil and wire loss).
  - *(check)* **Chuova granica** (Chu's limit).
  - *(check)* **pohranjena energija** (stored energy).
  - *(check)* **dobrota zavojnice Q** (coil Q; 50ohm has "dobrota / Q-faktor" and "faktor dobrote").
  - *(check)* **kratki dipol** / **skraćeni dipol** (short dipole; 50ohm has "skraćene antene").

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| loading coil | produljna zavojnica | 50ohm-contents-hr |
| electrical lengthening | električno produljivanje | 50ohm-contents-hr |
| efficiency | stupanj djelovanja | 50ohm-contents-hr |
| quality factor, Q | faktor dobrote, dobrota | 50ohm-contents-hr |
| bandwidth | širina pojasa | 50ohm-contents-hr |
| reactance | reaktancija (jalovi otpor) | 50ohm-contents-hr |
| standing wave ratio, SWR | omjer stojnog vala, SWR | 50ohm-contents-hr |
| short antennas | skraćene antene | 50ohm-contents-hr |
| radiation resistance | otpor zračenja | *(check)* |
| loss resistance | otpor gubitaka | *(check)* |
| Chu's limit | Chuova granica | *(check)* |
| stored energy | pohranjena energija | *(check)* |

## Shared requests

- **models/**: `loaded-antenna.js` (feed impedance of a thin dipole, wire loss, a tuned loading coil, Q, SWR band edges,
  Chu's Q) is promotable as `models/loaded-antenna.js`; it needs `mutual-impedance.js`, the identical copy of yagi's, which
  would be promoted with it (then both sims point at `models/`). Its rule tests are the "module:" tests in `sim.test.js`
  plus tie-breaks 6–7 and rules 1–3, 6–7.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `dipole-length` and others; worked around in
  this page's CSS.
- **kit (`kit.js`)**: the same request for an explorer time axis (play, scrubber, step keys); this page builds them as
  `dipole-length` does.

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › dipole` "Dipol" / "The dipole", after `dipole-length`.

## Time

Start 15:58, done 16:45 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes):
one session.
