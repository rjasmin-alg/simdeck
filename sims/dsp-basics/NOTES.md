<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dsp-basics: notes

Adopted from `50ohm-contents-hr/contents/html/applet_dsp.html` (file last changed in `cb00536`, repo at `5745d5e`;
task `docs/tasks/w1/dsp-basics.md`, catalogue `50ohm-dsp`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_dsp.html` @ `48e18bf` (file last changed in `6a0afae`); it differs from the
Croatian one only in the iframe's `title`. The host text is `contents/sections/modulatoren.md` (the balanced
modulator, "carrier balance", the in-depth formula). The simdeck copy is canonical from here on. The first commit on
the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

**Not "DSP basics" (digital signal processing).** The catalogue title reads the file name that way, but "DSP" here
is 50ohm's name for the **DSB** (double sideband, suppressed carrier) signal of a balanced modulator: the circuit's
output label is "DSB-Ausgang", and the section includes the applet after the paragraph on carrier balance ("when
the control on the right is moved, the carrier suddenly appears in the spectrum"). The page is therefore titled
*Balanced modulator (DSB)*; the id stays `dsp-basics` as the task names it. *(check)* whether the owner wants the id
renamed (e.g. `balanced-modulator`); that touches the catalogue and task files, outside this task.

Like `am-modulation`, it is an `<iframe>` of an in-browser circuit simulator (50ohm's copy under `/assets/circuitjs/`,
GPL-2.0-or-later) with the circuit packed into the URL (`ctz=`, LZ-string). Unpacked:

| Part | Value |
|---|---|
| AF source | 1 kHz sine, 0.5 V peak, into the ring's left corner through 10 µF |
| Diode ring | four diodes in one direction round the ring (the simulator's default diode: Is = 10⁻¹⁴ A, n = 1); right corner to ground |
| Balance pot ("Trägerabgleich") | 1 kΩ between the ring's top and bottom corners, wiper at 50 % |
| Oscillator | 10 kHz **square** wave, ±5 V, into the wiper |
| Transformer | primary between the top and bottom corners, 10 mH, 1 : 1, coupling 0.999 |
| Load | 1 kΩ across the secondary; the output ("DSB-Ausgang") |
| Scopes | the output over time, and its spectrum |

## Attribution and licence (CC BY 4.0)

- Source: the circuit (topology and values) and the text of `contents/sections/modulatoren.md` (the balanced
  modulator, carrier suppression, carrier balance, the formula), **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**,
  licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  translation by the 50ohm-contents-hr team.
- **The HTML file carries no author line and no licence of its own** (task step 2, checked in both repos), so the
  task went ahead. The circuit simulator it embeds has its own licence (GPL-2.0-or-later), but it is **not** copied
  (below), so nothing of it is in simdeck.
- **Changed**: the circuit is solved on the page instead of in the outside simulator, adapted to the kit, translated
  into English, a marked spectrum, sliders and presets added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.

## Decisions

- **The circuit simulator is not vendored** (task step 3 lists libraries loaded from 50ohm.de; this one is not a
  library but a 12 MB GWT app that loads files at run time, with its own sub-16 px UI). Same decision as
  `sims/am-modulation`: the page draws SVG from a tested model. *(check)* if the owner wants the free-editing circuit
  simulator itself in simdeck; that would be a separate task with a `kit` exception and GPL-2.0+ vendoring.
- **The model solves the same circuit** (`sim.js`): modified nodal analysis on four unknown nodes, trapezoidal
  companions for the capacitor and the coupled coils (the simulator's default method), Newton iterations for the four
  diodes with the usual junction step limit and a 10⁻¹² S gmin. Step 1 µs (the original's `ts`); 30 ms run-in, then
  10 ms recorded every 2 µs; the spectrum is a DFT over those 10 ms (whole periods of every 100 Hz multiple, no
  window, 100 Hz bins). About 130 ms per setting in node.
- **Convergence**: four times the run-in moves no line by 0.1 % (tested). A quarter of the step moves the lines by
  about 1.5 % (tested under 2.5 %): the square wave's edges fall on a step, which the trapezoid smears by half a
  step. Kept at the original's 1 µs; the shape and the cancellation do not depend on it.
- **Square-wave tie-break**: exactly at an edge the new half holds; the phase is counted in half periods with a
  10⁻⁹ tolerance so that k · 1 µs lands on the edge, not on either side by rounding (tested for 400 steps).
- **Source signs as the original wires them**: both sources have their first terminal at the node, so the node gets
  −v (the simulator's convention). It only flips the output's sign and phase.
- **Carrier suppression** = 20 log10(stronger sideband / carrier). Tie-breaks: no sideband (no AF) gives no number;
  a carrier under 1 mV counts as 1 mV and the number is a lower bound ("more than"). Exactly centred, the circuit is
  symmetric and the carrier cancels to numerical zero; 49 % and 51 % give the same residual (tested).
- **Class `explorer`** (playbook §10.4): settings, nothing to step through. Presets: balanced (the original), 48 %
  (carrier 0.14 V, about 7 dB under the sidebands), 30 % (carrier above the sidebands), no AF balanced (empty
  output), no AF at 30 % (carrier alone).
- **Controls**: carrier balance 5–95 % in 1 % (0 and 100 % would short half the pot), AF frequency 500–3000 Hz in
  100 Hz (multiples of the bin, at least one period in the 2 ms view), AF amplitude 0–1 V in 0.1 V (param `am` in
  tenths). The oscillator stays at 10 kHz, ±5 V.
- **Results with the original values**: sidebands 0.309 V at 9 and 11 kHz, a second pair at 29/31 kHz (0.10 V,
  the square wave's 3rd harmonic), no carrier; residual carrier about 0.072 V per 1 % off centre. A small 20 kHz line
  (13 mV) stays even when balanced and without AF: the ring's left corner sits behind the coupling capacitor while
  the right is grounded, so the two halves are not perfectly alike. Not compared with the outside simulator's
  numbers *(check)*; the diode model of the simulator's "default" diode is taken as Is = 10⁻¹⁴ A, n = 1 *(check)*.
- **Stage**: blocks (AF, oscillator → potentiometer with its wiper bar and both part resistances, diode ring,
  transformer, output), the output over 2 ms with the AF input dashed, the spectrum 0–40 kHz with the sidebands as
  round heads and the carrier's place always marked (dashed guide, square head on the axis when suppressed).
  Grayscale keeps them apart by shape and dash.
- **NF/VF in Croatian, AF/RF in English**, as in `am-modulation`.
- **Tags**: `signals` (task file) and `modulation` (exists in `tags.json`; added because the page is about a
  modulator and `am-modulation` uses it). Topic `radio`, level `core`. `related`: `ring-modulator` (how the ring
  switches) and `am-modulation` (AM, carrier kept); this page is the third concept between them, carrier suppression
  by balance.
- No exam questions (AF309 follows the applet in the section; answer material).

## Deviations from the original (and why)

- The original is a full circuit editor; the page offers the pot (the one control the section asks to move) plus
  the AF frequency and amplitude. Free editing is out of scope for one concept.
- Title: *Balanced modulator (DSB)* instead of the catalogue's "DSP basics" (above).
- The original's spectrum scope had no labels; the page names the sidebands, the carrier and the suppression in dB.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from `sections/modulatoren.md` and the
50ohm-contents-hr `TRANSLATION_GLOSSARY.md`. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| balanced modulator | balansni modulator |
| carrier | nositelj |
| sideband | bočni pojas |
| carrier suppression | potiskivanje nositelja |
| carrier balance | podešavanje nositelja |
| diode ring | prsten dioda |
| DSB (double sideband, suppressed carrier) | dvobočnopojasni signal s potisnutim nositeljem (DSB) |
| AF / RF | NF / VF |

## Shared requests

None. No shared model used or offered (the circuit solver is specific to this circuit).

## Checks

- `node --test sims/dsp-basics/sim.test.js`: 19 tests. Each rule broken once (edge tie-break, floor tie-break,
  no-sideband null, pot split, coupling, diode n, oscillator amplitude, capacitor history sign, primary stamp, short
  run-in, slider clamp, sideband position, one-sided spectrum factor) makes 3–13 fail.
- `npm run gate -- dsp-basics`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en.
- Not checked: a real projector; the numbers against the outside circuit simulator; the Croatian terms with the HRS
  translation team.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 11:20–11:35 CEST), one session.
