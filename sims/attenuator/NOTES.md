<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# attenuator: notes

Adopted from `50ohm-contents-hr/contents/html/applet_daempfungsglied.html` (file last changed in `8f2329a`, repo at
`5745d5e`; task `docs/tasks/w1/attenuator.md`, catalogue `50ohm-attenuator`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_daempfungsglied.html` (repo at `48e18bf`, file last changed in `c6fd382`); its
script is the same as the Croatian one except the error message and one LaTeX subscript ("erreicht"/"postignuto"),
and the form labels are translated. The simdeck copy is canonical from here on. The first commit on the branch holds
the original as-is, so `git log -p` shows the change.

## What the original is

A Bootstrap form: attenuation in dB (number field, 0.1 … 100), a read-only "50 Ω" field, Pi or T (radio), and a
standard series (E12, E24, E48, E96). Below it, rendered with the host page's KaTeX: the ideal resistances, the nearest
values of the series, and the attenuation those standard values give (from the chain matrix of the pad between 50 Ω
source and load). No drawing; the 50ohm section shows the circuits as figures 341 (T) and 342 (Pi).

**Where it sits in 50ohm:** `sections/daempfungsglieder.md`. The explanation on the page follows that section's text
without its exam questions (AD801–AD806).

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `sections/daempfungsglieder.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC
  e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  text by the 50ohm-contents-hr team.
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **Changed**: adapted to the simdeck kit, translated into English, a circuit drawing, the input resistance and the
  power shares added, the slider limited to 40 dB, formulas as text instead of KaTeX (below). Stated on the page and
  in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The applet loads no script itself (task step 3 lists none here); it relied on the host
  page's KaTeX and Bootstrap CSS. The kit page writes the values as HTML text and draws the circuit as SVG, so neither
  is needed.

## Decisions

- **Class `explorer`** (playbook §10.4): three parameters with a live result, nothing to step through. The demo is
  the six presets (keys 1–6): 3 dB; 10 dB in E24 (misses by 0.37 dB); the same in E96 (0.07 dB); the same as a T pad;
  15 dB in E12 (0.92 dB off); 30 dB (a large series resistor, the ones across close to 50 Ω).
- **Default Pi, 10 dB, E24**, not the original's 6 dB: 6 dB and 20 dB are the 50ohm exam questions AD804 (power ratio
  at 6 dB), AD803 (at 20 dB) and AD806 (heat at 20 dB from 100 W). No preset sits on them (tested); the slider still
  reaches them, as it must.
- **Attenuation as a slider, 0.1 … 40 dB in 0.1 dB steps** (param `dt`, whole tenths, so URLs and presets are exact).
  The original's number field took up to 100 dB; on a linear slider that would squeeze the useful 1–30 dB into a
  third of the track, and 40 dB already needs a 2.5 kΩ / 1 Ω pad. *(check)* if the owner wants the full 100 dB.
- **The circuit**: generator with R<sub>g</sub> = 50 Ω, the pad in a dashed box between its ports, R<sub>L</sub> =
  50 Ω; the resistor names as in the applet and figures 341/342 (Pi: R1 = R3 across, R2 in series; T: R1 = R2 in
  series, R3 across), each labelled with its nearest standard value. Drawn in pixels with text at 1:1 and redrawn on
  resize (as `sims/lambda-f`). On a phone the values are left out of the drawing (they are in the table).
- **The table** sets the ideal values against the nearest standard ones, plus the attenuation and the input
  resistance (with a 50 Ω load) each gives. The input resistance is new: it shows the second half of the concept,
  that the pad keeps 50 Ω, and how far standard values move it (50.33 Ω at 10 dB E24, 46.2 Ω at 40 dB E12).
- **The caption** gives the power shares from the 50ohm section: P_out / P_in = 10^(−dB/10), the rest heat, and the
  ratio, then the standard-value results. Shares to three significant digits, the heat to the same decimals
  (0.01 % / 99.99 % at 40 dB).
- **Colour**: series resistors `--c1`, resistors across `--c2`, source and load `--c3` dashed and hollow. Series and
  across also differ by orientation (along the rail or between the rails) and by name, so grayscale keeps them apart.
- **Attribution in the footer bar** (task step 2: "page footer"), as in `sims/lambda-f`; on a phone the bar is static.

## Deviations from the original (and why)

- **Nearest value, ties**: the applet compares absolute differences with a strict `<` over an ascending list, so on
  a tie the lower value wins in principle, but float rounding decides real ties (1.1 − 1.0 ≠ 1.2 − 1.1 in the 17th
  digit). Now candidates are rounded to 12 significant digits (2.2 · 100 is 220, not 220.00000000000003) and a
  candidate replaces the best only when nearer by more than 1e-9 of the value, so a tie always goes to the lower
  value (110 Ω in E12 → 100 Ω; tested). Absolute (not logarithmic) distance is kept, as the applet.
- **No hang at 0 dB**: `nearest()` returns 0, negative, infinite or NaN values as they are (a 0 dB pad's branch across
  is infinite, and the decade loop would never end). The slider starts at 0.1 dB, so the page never asks; tested.
- **Resistances below 1 Ω show three decimals** (the applet: two), or an E96 0.287 Ω would read as its ideal 0.29 Ω.
- The read-only "50 Ω" field is gone; the system impedance is in the drawing, the legend and the table.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material) and without its
  20 dB / 100 W example (the answer to AD803 and AD806); it uses 10 dB and 3 dB instead.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from the applet, `sections/daempfungsglieder.md` and
the 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`, which records four Croatian names for *Dämpfungsglied*; the page uses
the applet's and the section's *prigušni član*, and lists *prigušno sklopilo*, *prigušnik* and *atenuator* as
aliases). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| attenuator pad, attenuator | prigušni član |
| attenuation | prigušenje |
| system impedance | sustavska impedancija |
| resistor in series / across the line | uzdužni / poprečni otpornik |
| standard (preferred) resistor series | standardni niz otpora |
| input resistance | ulazni otpor |
| load | teret |

## Shared requests

None.

## Checks

- `node --test sims/attenuator/sim.test.js`: 14 tests; each rule broken once (tie to the higher value, no tie
  tolerance, no candidate rounding, own decade only, no Infinity guard (hangs), Pi formulas swapped, T across wrong,
  chain order swapped, power with /20, no clamp, input resistance with D = 1, attenuation with 10 log) makes at least
  one fail. (D → A in the input resistance is an equivalent mutant: A = D in a symmetric pad.)
- `npm run gate -- attenuator`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus unbuilt from `file://`:
  T 0.1 dB E96, Pi 40 dB E12, preset T 10 dB (en), 0.1 dB on a phone; no console errors or warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 12:59–13:14 CEST), one session.
