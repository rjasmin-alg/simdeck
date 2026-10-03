<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rectifier-1: notes

Adopted from `50ohm-contents-hr/contents/html/applet_gleichrichter_1.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/rectifier-1.md`, catalogue `50ohm-rectifier-1`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_gleichrichter_1.html` (repo at `48e18bf`, file last changed in `e56d0dc`); the
two differ only in the language of the text. The simdeck copy is canonical from here on. The first commit on the
branch holds the original as-is, so `git log -p` shows the change.

## What the original is

Three buttons swap one picture: "Bez radnje" (no action, figure 959), "1. poluperioda" (960), "2. poluperioda" (961),
under one line of text ("Sljedeći applet omogućuje odvojeni prikaz obiju poluperioda."). The figures
(`50ohm-contents-hr/contents/drawings/{959,960,961}.tex`, circuitikz) show a transformer with a centre-tapped
secondary, D1 on the top end and D2 on the bottom end, both cathodes joined at +, R between + and the centre tap
(−), and below three plots U1 = 0.9 sin θ, U2 = −0.9 sin θ and Ua = 0.9 |sin θ| for θ from 0 to 2.5π. Figure 960
shades 0 … π and draws the current through D1 in red; 961 shades π … 2π with the current through D2. The applet sits
in the section `vollweggleichrichter` (`contents/sections/vollweggleichrichter.md`), whose text is the source of the
captions and the explanation.

**The catalogue and the task file call this a "half-wave rectifier"; it is not.** The applet is the full-wave
rectifier with two diodes and a centre-tapped transformer; what it shows "separately" is its two half-periods. The
page is titled and tagged for what it shows. `rectifier-2` (`applet_gleichrichter_2.html`, figures 962–964, section
`brueckengleichrichter`) is the bridge rectifier, so the two stay one concept each. A half-wave (one-diode) rectifier
has no 50ohm applet. Reported for the owner (catalogue line 271).

## Attribution and licence (CC BY 4.0)

- Source: the applet and figures 959, 960, 961, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos).
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: Dr. Matthias Jung, DL9MJ` (2024), in their `.tex` sources, but no
  licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam; read as team material under the repos' CC BY 4.0, as
  `sims/trap-antenna`, `sims/lc-antenna` and `sims/lc-resonance` did. The credit names DL9MJ for the figures.
  *(check)* if the owner reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as SVG from the model, the text translated into English
  (from the German original), the buttons turned into steps and presets, a step with both half-periods, a readout of
  the diodes' states and an explanation added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de but
  calls neither (plain `getElementById`/`querySelector`), so both were dropped. The figures' SVGs were not copied:
  they are TeX renders with fixed colours that would not follow the theme, and their text would scale below 16 px.

## Decisions

- **Class `stepper`**, 3 steps, 4 states (playbook §10.4): the original is three fixed states. Step 0 is "no action",
  steps 1 and 2 the two half-periods (the original's buttons in order), step 3 (added) both half-periods at once,
  each hump of Ua labelled with the diode that gave it. Presets 1–3 jump to steps 1–3.
- **Model** (`sim.js`): `u1`, `u2`, `ua` (amplitude 0.9 and range 0 … 2.5π from the figures), `halfAt(θ)`,
  `conducting(θ)`, `windows(n)` and `at(n)` (half-period, each diode's state, the polarity of the secondary's ends,
  the current paths, the load current's direction, the shaded windows). Ideal diodes, as in the figures: no forward
  drop, no smoothing capacitor (ripple is `50ohm-ripple`'s concept).
- **Tie-breaks**: at a zero crossing (|sin θ| ≤ 1e-9) neither half-period holds and no diode conducts (Ua = 0 there);
  step 0 has no diode state, path, polarity or window (`null`/empty, not "blocks"); a step outside 0 … 3 goes to the
  nearest end, a fraction to the nearest step. The windows of step 3 tile 0 … 2.5π, the last one cut at 2.5π.
- **Colour**: `--c1` for half-period 1 (D1), `--c2` for half-period 2 (D2). Never colour alone: the D2 path and curve
  are dashed, the D1 ones solid; the conducting diode is filled and labelled "conducts", the other hollow and labelled
  "blocks"; the windows are named, and at step 3 Ua's humps carry D1/D2. Grayscale screenshot checked.
- **Drawing**: redrawn at 1:1 in pixels (text keeps its size), redrawn on resize. The centre-tap line hops over the
  wire from D2 to the cathodes, as the figure's line crosses it without a junction. The polarity of each secondary end
  against the centre tap (+/−) is added at steps 1 and 2; arrows show the current's direction.
- **Tags**: `circuits` (task file; in `tags.json`, but its label reads "digital circuits", which fits an analogue
  rectifier poorly, see the report). Topic `radio`, level `core`. No `related`: `rectifier-2` and `50ohm-ripple`
  are not in `sims/` yet; add them once they are.
- **No answer keys**: the section's exam questions (AD307, AD308) are not on the page. The explanation keeps the
  section's own teaching text (the memory aid: both cathodes at the plus pole).
- **Added to the explanation**, beyond the section: one sentence comparing with the one-diode half-wave rectifier (two
  humps per period instead of one, easier to smooth). Standard textbook fact.

## Deviations from the task and from the original (and why)

- The task's "half-wave rectifier" is the catalogue's mislabel (above); the page shows the full-wave centre-tap
  rectifier the applet is.
- Buttons became steps (clicker) and presets; step 3, the readout, the polarity signs, the arrows and the
  explanation were added; English written.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-contents-hr text and its
`TRANSLATION_GLOSSARY.md`. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| rectifier | ispravljač |
| full-wave rectifier | punovalni ispravljač |
| half-wave rectifier | poluvalni ispravljač |
| bridge rectifier | mosni ispravljač |
| centre tap | srednji odcjep |
| half-period | poluperioda |
| (diode) conducts / blocks | provodi / zaporna |
| pulsating DC voltage | pulsirajući istosmjerni napon |

## Shared requests

None. No shared model used or offered.

## Checks

- `node --test sims/rectifier-1/sim.test.js`: 17 tests. Each rule broken once on a copy (EPS 0, the half-period's
  sign, U2's sign, Ua without U2, step 3's alternation, the last window's cut, the diode per half, the paths at step 0,
  `floor` for the step, the load's direction, the top end's polarity) makes 1–7 tests fail. One mutant survives and
  is equivalent: `s >= 0` for the half-period, since s = 0 returns `null` before.
- `npm run gate -- rectifier-1`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` step 0 en, step 1 hr, step 2 hr light and en dark, step 1 en at 375×812; no console errors. Fixed from
  them: the coils overlapped the core; the "2nd half-period" label sat on U1's curve.
- Not checked: a real projector; the Croatian wording of the added text with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 16:07–16:22 CEST), one session.
