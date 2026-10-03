<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# am-modulation: notes

Adopted from `50ohm-contents-hr/contents/html/applet_am_modulator.html` (file last changed in `cb00536`, repo at
`5745d5e`; task `docs/tasks/w1/am-modulation.md`, catalogue `50ohm-am`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_am_modulator.html` @ `48e18bf` (file last changed in `6a0afae`); it differs
from the Croatian one only in the iframe's `title`. The host text is `contents/sections/modulatoren.md`. The simdeck
copy is canonical from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the
change.

## What the original is

Not a script applet like the other 50ohm imports: an `<iframe>` of an in-browser circuit simulator (50ohm's own copy
under `/assets/circuitjs/`, a GWT build of about 12 MB, GPL-2.0-or-later) with the circuit packed into the URL
(`ctz=`, LZ-string). Unpacked, the circuit is:

| Part | Value |
|---|---|
| NF source | 500 Hz sine, 0.5 V peak, through 1 kΩ |
| VF source (carrier) | 10 kHz sine, 2 V peak, through 1 kΩ, into the same node |
| Diode | 1N4004 model of the simulator: Is = 18.8 nA, n = 2 (series resistance 28.6 mΩ, left out) |
| High-pass | 47 nF in series, 330 mH to ground |
| Tank | 12 nF ∥ 22 mH ∥ 6.8 kΩ to ground: f₀ = 9795 Hz, Q = 5.02 |
| Scopes | the output voltage over time, and its spectrum |

## Attribution and licence (CC BY 4.0)

- Source: the circuit (topology and values) and the text of `contents/sections/modulatoren.md` (the diode modulator,
  the tank, "remove the tank", "change NF to 1 kHz", the formula for the three components),
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  (`LICENSE` of both 50ohm repos). Croatian translation by the 50ohm-contents-hr team.
- The HTML file carries no author line and no licence of its own (task step 2): team material under the repos'
  CC BY 4.0. The circuit simulator it embeds has its own licence (GPL-2.0-or-later), but it is **not** copied
  (below), so nothing of it is in simdeck.
- **Changed**: the circuit is solved on the page instead of in the outside simulator, adapted to the kit, translated
  into English, a marked spectrum, sliders and a tank switch added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.

## Decisions

- **The circuit simulator is not vendored** (task step 3 lists libraries loaded from 50ohm.de). It is 12 MB of GWT
  output that loads its permutation files at run time (the single-file build cannot inline that), has its own UI
  that the kit cannot adapt (text under 16 px, its own colours, a menu-driven editor), and is a tool rather than the
  concept. As `sims/fourier` dropped three.js and `sims/lambda-f` Chart.js, the page draws SVG from a tested model.
  *(check)* if the owner wants the free-editing circuit simulator itself in simdeck; that would be a separate task
  with a `kit` exception and a GPL-2.0+ vendoring.
- **The model solves the same circuit** (`sim.js`): trapezoidal integration (the simulator's default) of the linear
  part at 1 µs, and the diode's Shockley equation solved exactly at every step: the linear network seen by the
  diode is one Thévenin voltage and resistance, so the diode current is the unique root of a monotonic scalar
  equation (safeguarded Newton). 20 ms of run-in, then 20 ms recorded every 5 µs; the spectrum is a DFT over those
  20 ms (whole periods of every 50 Hz multiple, so no window is needed; 50 Hz bins). About 50 ms per setting in the
  browser. Converged: ¼ of the step or 4× the run-in moves no line by 0.1 % (tested).
- **Class `explorer`** (playbook §10.4): settings, nothing to step through. The demo is the five presets: 500 Hz
  (the original), 1 kHz (the section's "change NF to 1 kHz": the sidebands move), no tank (the section's "remove the
  tank": mixing products appear), no NF (carrier only), strong NF (m ≈ 0.96).
- **Controls**: NF frequency 250–2500 Hz in 50 Hz steps (multiples of the 50 Hz bin, at least one period in the 4 ms
  view), NF amplitude 0–1.5 V in 0.1 V (param `am` in tenths, so presets and URL are exact), tank on/off. The carrier
  stays at 10 kHz, 2 V: the tank is tuned to it. Removing the tank leaves the 6.8 kΩ load, as deleting L and C in the
  original would.
- **Results with the original values**: carrier 0.425 V, sidebands 0.107 V and 0.104 V, m ≈ 0.48 (each sideband
  ≈ m/2 of the carrier, within the diode's distortion). Without the tank: 20 kHz at 0.15 V and the 29.5/30.5 kHz
  sidebands, the NF itself still held back by the high-pass. Not compared with the outside simulator's numbers
  *(check)*; the waveform and spectrum shapes match the section's description.
- **Modulation depth** m = (Umax − Umin) / (Umax + Umin) from the largest and smallest positive carrier peak of the
  output. Tie-break: a flat top is one peak, and only if it falls afterwards (tested). Not shown without the tank:
  the distorted output has no clean envelope.
- **Stage**: the circuit as a row of blocks (the tank struck through and dashed when removed), the output over 4 ms
  with the NF input dashed on the same volt axis, the spectrum 0–40 kHz as lines, the carrier a square head, the
  sidebands round heads with their frequencies, the tank's −3 dB band (f₀ ± f₀/2Q) shaded. Grayscale keeps them
  apart by shape and dash.
- **NF/VF in Croatian, AF/RF in English**: Croatian (and German) radio texts say NF/VF; English says AF (audio
  frequency) and RF. The carrier symbol is f_N in Croatian (nositelj), f_C in English.
- No exam questions (AD507 follows the applet in the section; DL-DE-BY 2.0 and answer material).

## Deviations from the original (and why)

- The original is a full circuit editor (any part can be changed, scopes reconfigured); the simdeck page offers
  the three changes the section asks for (NF frequency, tank) plus the NF amplitude. Free editing is out of scope
  for one concept.
- The original's spectrum scope had no frequency labels on the lines; the page names carrier and sidebands and
  their amplitudes in the caption.

## Term pairs

Not in `kit/glossary.js` (its *envelope* is "omotnica poruke", the e-mail sense, so it is not used here); written
out in both tables, Croatian from the 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`. For the coordinator to add
with `"src": "simdeck"`:

| en | hr |
|---|---|
| carrier | nositelj |
| sideband (lower / upper) | bočni pojas (donji / gornji) |
| tank circuit (parallel) | (paralelni) titrajni krug |
| high-pass filter | visokopropusni filtar |
| envelope (of a modulated signal) | omotnica |
| modulation depth | stupanj modulacije |
| mixing product | produkt miješanja |
| AF / RF | NF / VF |

## Shared requests

None. Tag `modulation` and topic `radio` exist in `tags.json`.

## Checks

- `node --test sims/am-modulation/sim.test.js`: 18 tests. Each rule broken once (plateau tie-break, −0 in the
  state, sideband position, tank never removed, diode n, one-sided spectrum factor, no clamp, f₀ and Q formulas,
  high-pass coil removed, trapezoid history sign, Newton bracket swapped, too short run-in) makes at least one fail.
- `npm run gate -- am-modulation`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus the no-tank and strong
  presets (desktop) and no-tank on the phone, no console errors or warnings.
- Not checked: a real projector; the numbers against the outside circuit simulator; the Croatian terms with the
  HRS translation team.

## Time

Start to done: about 13 minutes by the machine clock (2026-10-03 07:57–08:10 CEST), one session.
