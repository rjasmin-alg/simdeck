<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lc-resonance: notes

Adopted from `50ohm-contents-hr/contents/html/applet_schwingkreis.html` (file last changed in `4a0b7d5`, repo at
`5745d5e`; task `docs/tasks/w1/lc-resonance.md`, catalogue `50ohm-lc-resonance`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_schwingkreis.html` (repo at `48e18bf`, file last changed in `da3d16b`); the two
files are byte-identical (the applet has no text). The simdeck copy is canonical from here on. The first commit on the
branch holds the original as-is, so `git log -p` shows the change.

## What the original is

No text and no controls: two `<img>` elements that cycle every 2 seconds through nine pictures each, for ever.

| Figures | Show |
|---|---|
| 891–899 | the loop (coil left, capacitor right): 891 uncharged; 892 capacitor charged, upper plate +, E arrows; 893–899 one eighth of a period each: E arrows and charges shrink and swap, H field lines around the coil grow and shrink, the current arrow `I` on the upper wire flips direction (`i={I}` / `i<={I}` in the `.tex`) |
| 1027–1035 | the current `I` over time (`t`, "Vrijeme"), drawn one eighth of a period further each frame, from an empty axis to one full sine period |

The pictures are in `50ohm-contents-hr/contents/drawings/` (`.tex` circuitikz sources, `.svg` renders, `.txt` alt
texts). The German `1027`–`1035` differ only in the axis word ("Zeit").

**Where it sits in 50ohm:** `sections/schwingkreis_1.md` (in the margin next to the paragraph on how a resonant circuit
oscillates once charged) and `sections/oszillatoren.md` (next to the LC oscillator and Thomson's formula). The
explanation on the page comes from those paragraphs, without exam question ED501 (answer material).

## Attribution and licence (CC BY 4.0)

- Source: the applet, figures 891–899 and 1027–1035, and the text of `sections/schwingkreis_1.md` and
  `oszillatoren.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian text by the
  50ohm-contents-hr team.
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: Prof. Dr. Matthias Jung, DL9MJ` (`% Year: 2024` for 891–899, `2026`
  for 1027–1035), in their `.tex` sources, but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam listed
  in the 50ohm-contents-hr `README.md`; read as team material under the repos' CC BY 4.0, as `sims/ring-modulator`,
  `sims/dsp-filter`, `sims/lambda-f` and others did. The credit names DL9MJ for the figures. *(check)* if the owner
  reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as SVG from a model, translated into English, the loop
  turned into 9 steps, the capacitor voltage, energy shares, L and C with Thomson's formula and presets added. Stated
  on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de but uses
  neither (plain `querySelector` and `setTimeout`); the page needs no library. The figures' SVGs were not copied: they
  are TeX renders with glyph-outline text and fixed colours, and would scale text far below 16 px.

## Decisions

- **Class `stepper`**, 9 steps (playbook §10.4): the original is already a sequence of frames, played on a timer.
  Step 0 is the circuit at rest (figure 891); step 1 the charged capacitor at t = 0 (892); steps 2–9 one eighth of a
  period each, so step 9 is t = T, the start state again, which closes the period the original's loop implies. Space
  plays it as the original did; reduced motion needs nothing extra (no animation).
- **Model** (`sim.js`): lossless loop, u = cos φ, i = sin φ, φ = 2π t / T (relative to their peaks); energy shares
  W_E = u², W_M = i², sum 1; f₀ = 1 / (2π √(L C)). Values at the eighths come from exact tables (cos² 45° is exactly ½,
  zeros are exactly 0), not from `Math.cos`. Signs as in the figures: upper plate + first, the current positive from
  the upper plate towards the coil (figure 893's arrow), reversed from half a period (899's `i<=`).
- **Drawing aids** taken from the figures' density: 6 / 4 / 0 E arrows (and + / − signs) at |u| = 1 / √½ / 0, and
  0 / 2 / 3 pairs of H field lines at |i| = 0 / √½ / 1 (the figures use 7 / 4 arrows and 1 / 2 pairs).
- **H direction**: field lines are drawn as loops through the coil's axis, with an arrow at each loop's outer point:
  up for positive current, down for negative, as in the figures' `.tex` (893: `inputarrow, rotate=+90`; 897:
  `rotate=-90`).
- **Added, same concept**: the capacitor voltage U next to I on the plot (a quarter period apart: shows where the
  energy is), two energy bars (electric / magnetic, always 100 % together), and L (1, 2.2, 4.7, 10, 22 µH) and C (22,
  47, 100, 220, 470 pF) as `choice` controls with f₀, T and t in the readout. The text next to the applet in
  `oszillatoren.md` introduces Thomson's formula and how f₀ moves with L and C; the stepper's fractions of T stay the
  same, only the times change. Default 10 µH, 100 pF: f₀ = 5.03 MHz, T = 199 ns.
- **Colour pairs by cause**: `--c2` for the capacitor (U, E, its energy bar), `--c1` for the coil (I, H, its energy
  bar). Never colour alone: U dashed with a hollow dot, I solid with a filled dot, the magnetic bar hatched, every
  field and curve named on the stage (grayscale screenshot checked).
- **Tie-breaks**: zero current has no direction (no arrow, the page shows `I = 0`), zero voltage no plate signs; the
  odd eighths split the energy exactly in half; step 9 equals step 1 except `k` and `full`; an L or C that is not an
  option (also a string) gives the default; shown values have three significant digits, half away from zero after
  cutting float noise, never −0.
- **Tags**: `circuits` (task file). Topic `radio`, level `core`. `related`: `sine-amplitude-period`, `lambda-f`
  (existing sims on period and frequency); `50ohm-lc-antenna` (the next catalogue entry) can link back once it exists.
- **No answer keys**: ED501 and the other questions of the two sections are not on the page or in a preset.

## Deviations from the original (and why)

- The 18 pictures on a 2-second timer became one model-drawn circuit and plot, stepped by the clicker (projector use);
  Space plays them.
- **The original's two picture rows are one frame out of step**: with the charged capacitor at t = 0 (892) the plot
  already shows the first eighth (1028), and the plot's full period (1035) appears with 899 (t = 7T/8). Here the plot
  is drawn up to the circuit's instant.
- Added: the voltage U, energy bars, L and C, the readout with Thomson's formula, presets (at rest; quarter period,
  all energy in the coil; larger C; smaller L), and step 9 (t = T).

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from `sections/schwingkreis_1.md`,
`oszillatoren.md` and the 50ohm-contents-hr text. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| resonant circuit | titrajni krug |
| coil (inductor) | zavojnica |
| capacitor | kondenzator |
| inductance | induktivitet |
| capacitance | kapacitet |
| electric field | električno polje |
| magnetic field | magnetsko polje |
| resonant frequency | rezonantna frekvencija |
| Thomson's formula | Thomsonova formula |
| period | perioda |
| reactance | reaktancija (otpor) |

## Shared requests

None. No shared model used or offered (a lookup table and one formula).

## Checks

- `node --test sims/lc-resonance/sim.test.js`: 20 tests. Each rule broken once on a copy (float cos² for the energy
  share, step offset k = n, `pick` coercing strings, no float-noise cut in `sig3`, `full` never set, `Math.ceil` for
  the H lines) makes 1 to 9 tests fail. Three mutants survived on dead code (a −0 guard where the tables hold no −0, a
  carry branch the arithmetic already covers, `floor(m + ½)` on a positive mantissa); that code was removed.
- `npm run gate -- lc-resonance`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` steps 0, 1, 2, 3, 4, 6, 7, 8 at 1920×1080 (light and dark, both languages) and steps 3 and 6 at 375×812;
  no console errors or warnings. Fixed from them: the caption's time sentence ran into the step's sentence, the `L`
  label sat on the field lines.
- Not checked: a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 10 minutes by the machine clock (2026-10-03 12:20–12:30 CEST), one session.
