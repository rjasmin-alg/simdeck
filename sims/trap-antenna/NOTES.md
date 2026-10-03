<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# trap-antenna: notes

Adopted from `50ohm-contents-hr/contents/html/applet_traps.html` (file last changed in `f98d102`, repo at `5745d5e`; task
`docs/tasks/w1/trap-antenna.md`, catalogue `50ohm-traps`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_traps.html` (repo at `48e18bf`, file last changed in `425ee94`); the two differ
only in the language of the text. The simdeck copy is canonical from here on. The first commit on the branch holds the
original as-is, so `git log -p` shows the change.

## What the original is

Four buttons (no excitation, 3.5, 7.05, 14 MHz) swap one picture and one sentence:

| Button | Figure | Sentence (hr original) |
|---|---|---|
| no excitation | 235, every wire black | *Bez pobude:* Nijedan dio antene nije aktivan. |
| 3.5 MHz | 1136, the whole wire red | *3,5 MHz < 7,05 MHz:* Prevladava induktivno djelovanje – trapovi električki produljuju zračitelj. |
| 7.05 MHz | 1135, only the inner part red | *7,05 MHz = f_res:* Trapovi blokiraju. Djelotvorna duljina: 2 × 10,07 m = 20,14 m. |
| 14 MHz | 1136, the whole wire red | *14 MHz > 7,05 MHz:* Prevladava kapacitivno djelovanje trapova – zračitelj se električki skraćuje. |

The figures (`50ohm-contents-hr/contents/drawings/{235,1135,1136}.tex`, circuitikz) show a dipole fed in the middle
(two terminals X X), in each half 10.07 m of wire, a trap (coil above, capacitor below, in parallel, labelled
f_res = 7.05 MHz), 6.71 m of wire, an insulator and a dashed rope. The applet sits in the section `traps`
(`contents/sections/traps.md`), whose three rules (f = f_res blocks, f < f_res inductive and lengthens, f > f_res
capacitive and shortens) are the captions' and explanation's source.

## Attribution and licence (CC BY 4.0)

- Source: the applet and figures 235, 1135, 1136, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos).
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: (Prof.) Dr. Matthias Jung, DL9MJ` (2021 and 2026), in their `.tex`
  sources, but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam; read as team material under the repos'
  CC BY 4.0, as `sims/lc-antenna` and `sims/lc-resonance` did. The credit names DL9MJ for the figures. *(check)* if the
  owner reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as SVG from the model, the text translated into English
  (from the German original), the buttons turned into steps and presets, a chart of the trap's reactance, a "what
  changed" readout and an explanation added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original loads none (plain `querySelector`). The figures' SVGs were not
  copied: they are TeX renders with fixed colours and would not follow the theme.

## Decisions

- **Class `stepper`**, 3 steps, 4 states (playbook §10.4): the original is four fixed states. Step 0 is no
  excitation, steps 1–3 the original's frequencies in its button order (3.5, 7.05, 14 MHz). The three frequencies are
  also presets 1–3, the original's buttons.
- **Model** (`sim.js`): `trapAt(f, f_res)` gives the trap's action, `at(n)` the state (active part, wire length,
  effect on the radiator, x = f / f_res, the normalised reactance, λ/2 at f). Dimensions from the figures.
- **Added, same concept: the trap's reactance** X / Z₀ = x / (1 − x²) (a parallel LC, Z₀ = √(L/C)) against
  x = f / f_res, with the three frequencies marked. The figures give no L or C, so the chart is normalised and shows
  no ohms; its sign is what the original's sentences say (inductive below, blocking at, capacitive above resonance).
  It stands in for the section's own figure 1036 (frequency response of the blocking circuit), not copied.
- **λ/2 in free space** (c / 2f) in the readout, so the class sees that 20.14 m is about half a wavelength at 7.05 MHz
  (95 %, the usual shortening of a wire dipole). The page claims no resonance for 3.5 and 14 MHz beyond the original's
  "lengthens" and "shortens": the whole wire is labelled "active wire: 33.56 m" (physical), not an effective length.
- **Colour**: `--c1` for the active wire, `--c2` for the reactance curve. Never colour alone: the active wire is three
  times as thick and has a span with its length under it; the current frequency is a large dot on the curve and bold
  on the axis (grayscale screenshot checked).
- **Tie-breaks**: |f − f_res| ≤ 1e-9 counts as resonance (7.05 never turns slightly inductive by rounding); no
  excitation (`null`) is no trap action, not 0 MHz; the reactance at resonance is `null` (no finite value; the chart
  puts the dot at the top edge with ∞); a step outside 0 … 3 goes to the nearest end, a fraction to the nearest step.
- **f_res**: written `{fres}` in the strings and put in by the page as f with a full-size subscript `res` (a smaller
  subscript falls under the 16 px floor). Preset hints are plain text, so they say "the trap's resonance" instead.
- **Tags**: `antennas` (task file; in `tags.json`). Topic `radio`, level `core`. `related`: `lc-antenna`,
  `lc-resonance` (the parallel resonant circuit the trap is).
- **No answer keys**: the section's exam questions (AG109–AG116) are not on the page.

## Deviations from the original (and why)

- Buttons became steps (clicker) and presets 1–3; the picture is drawn from the model at 1:1 so text keeps its size.
- Added: the reactance chart, the readout, the explanation, English (see Decisions).
- The original's 14 MHz alt text says current passes through the traps and the whole wire carries current; the
  caption says the same.

## Term pairs

Not in `kit/glossary.js` (its "trap" entries are the operating-system sense); written out in both tables, Croatian from
the 50ohm-contents-hr text. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| trap (antenna) | trap |
| trap dipole | trap-dipol (blokirni dipol) |
| blocking circuit | blokirni krug |
| parallel resonant circuit | paralelni titrajni krug |
| loading coil | produljna zavojnica |
| radiator | zračitelj |
| effective length | djelotvorna duljina |
| feed point | napojna točka |
| excitation | pobuda |

## Shared requests

None. No shared model used or offered.

## Checks

- `node --test sims/trap-antenna/sim.test.js`: 16 tests. Each rule broken once on a copy (EPS 0, `<` swapped, the
  active part, INNER, the reactance's sign, the resonance null, the frequency order, `floor` for the step, `null`
  versus `undefined`, the capacitive effect, c) makes 3–15 tests fail. One mutant survives and is equivalent: `x <= 1`
  for the curve's branch split, since x = 1 is dropped before (no finite value).
- `npm run gate -- trap-antenna`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` step 2 hr light, step 1 en dark, step 2 en at 375×812, step 0 en; no console errors or warnings. Fixed from
  them: the active-wire span sat on the f_res labels.
- Not checked: a real projector; the Croatian wording of the added text with the HRS translation team *(check)*.

## Time

Start to done: about 10 minutes by the machine clock (2026-10-03 12:48–12:58 CEST), one session.
