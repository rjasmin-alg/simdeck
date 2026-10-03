<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rectifier-2: notes

Adopted from `50ohm-contents-hr/contents/html/applet_gleichrichter_2.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/rectifier-2.md`, catalogue `50ohm-rectifier-2`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_gleichrichter_2.html` (repo at `48e18bf`, file last changed in `e56d0dc`); the
two differ only in the language of the text. The simdeck copy is canonical from here on. The first commit on the
branch holds the original as-is, so `git log -p` shows the change.

## What the original is

Three buttons swap one picture: "Bez radnje" (no action, figure 962), "1. poluperioda" (963), "2. poluperioda" (964),
under one line of text ("Sljedeći applet omogućuje odvojeni prikaz obiju poluperioda."). The figures
(`50ohm-contents-hr/contents/drawings/{962,963,964}.tex`, circuitikz) show a transformer whose secondary (Us) feeds
the two ~ corners of a four-diode bridge, + on the right corner, − on the left, R between + and the rail from −, and
below two plots Us = 0.9 sin θ and Ua = 0.9 |sin θ| for θ from 0 to 2.5π. Figure 963 shades 0 … π and draws the load
current in red from the top end through the top-right diode, R and the bottom-left diode back to the bottom end; 964
shades π … 2π with the current through the bottom-right and top-left diodes. The figures name no diodes. The applet
sits in the section `brueckengleichrichter` (`contents/sections/brueckengleichrichter.md`), whose text is the source
of the captions and the explanation.

The catalogue's "full-wave rectifier" is right but loose: this is the **bridge** rectifier, also full-wave.
`rectifier-1` is the centre-tap full-wave rectifier (catalogue line 271 calls it "half-wave", a mislabel reported in
its own notes). The page is titled "Bridge rectifier" so the two stay distinct, one concept each.

## Attribution and licence (CC BY 4.0)

- Source: the applet and figures 962, 963, 964, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos).
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: (Prof.) Dr. Matthias Jung, DL9MJ` (2024), in their `.tex` sources,
  but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam; read as team material under the repos' CC BY
  4.0, as `sims/rectifier-1`, `sims/trap-antenna` and others did. The credit names DL9MJ for the figures. *(check)*
  if the owner reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as SVG from the model, the text translated into English
  (from the German original), the buttons turned into steps and presets, a step with both half-periods, diode names
  D1–D4, a readout of the diodes' states and an explanation added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de but
  calls neither (plain `getElementById`/`querySelector`), so both were dropped. The figures' SVGs were not copied:
  they are TeX renders with fixed colours that would not follow the theme, and their text would scale below 16 px.

## Decisions

- **Class `stepper`**, 3 steps, 4 states (playbook §10.4): the original is three fixed states. Step 0 is "no action",
  steps 1 and 2 the two half-periods (the original's buttons in order), step 3 (added) both half-periods at once,
  each hump of Ua labelled with the pair that gave it. Presets 1–3 jump to steps 1–3. Same shape as `rectifier-1`, so
  the two can be shown side by side.
- **Diode names** (added; the figures have none): D1 top end → +, D2 − → bottom end, D3 bottom end → +, D4 − → top
  end. So D1 and D2 conduct in the 1st half-period, D3 and D4 in the 2nd, in the order the current meets them.
- **Model** (`sim.js`): `us`, `ua` (amplitude 0.9 and range 0 … 2.5π from the figures), `halfAt(θ)`,
  `conducting(θ)`, `pair(half)`, `windows(n)` and `at(n)` (half-period, each diode's state, the polarity of the
  secondary's ends, the current paths, the load current's direction, the shaded windows). Ideal diodes, as in the
  figures: no forward drop (so no 2 × 0.7 V loss, which a later sim could add), no smoothing capacitor (ripple is
  `50ohm-ripple`'s concept).
- **Tie-breaks**: at a zero crossing (|sin θ| ≤ 1e-9) neither half-period holds and no diode conducts (Ua = 0 there);
  step 0 has no diode state, path, polarity or window (`null`/empty, not "blocks"); a step outside 0 … 3 goes to the
  nearest end, a fraction to the nearest step; `pair()` of anything but 1 or 2 is empty, and pairs are returned as
  copies. The windows of step 3 tile 0 … 2.5π, the last one cut at 2.5π.
- **Colour**: `--c1` for half-period 1 (D1, D2), `--c2` for half-period 2 (D3, D4). Never colour alone: the 2nd
  half-period's path and curve are dashed, the 1st's solid; a conducting diode is filled and labelled "conducts", a
  blocking one hollow and labelled "blocks" (on a phone only the fill, the readout below says it in words); the
  windows are named, and at step 3 Ua's humps carry "D1, D2" / "D3, D4". Grayscale screenshot checked.
- **Drawing**: redrawn at 1:1 in pixels (text keeps its size), redrawn on resize. The wire from − down to the rail
  hops over the wire from the secondary's bottom end, as the figure's line crosses it without a junction. The
  polarity of each secondary end (+/−) is added at steps 1 and 2; arrows show the current's direction. On a narrow
  stage the bridge sits further right and slimmer, R's label goes above the resistor and the diodes' state words are
  left out (they would collide with R).
- **Tags**: `circuits` (task file; in `tags.json`, but its label reads "digital circuits", which fits an analogue
  rectifier poorly, see the report). Topic `radio`, level `core`. `related`: `rectifier-1` (the centre-tap
  full-wave rectifier, same model shape). `rectifier-1` could list `rectifier-2` back; that is its folder, not mine.
- **No answer keys**: the section's exam questions (AD305, AD306) are not on the page, nor the peak-voltage
  calculation that leads to them. The explanation keeps the section's own teaching text (the memory aid: the diodes'
  bars meet at the plus output; not to be confused with the diode ring mixer).
- **Added to the explanation**, beyond the section: one paragraph comparing with the centre-tap rectifier (the whole
  secondary works in both half-periods and no centre tap is needed; in return two diodes per half-period instead of
  one). Standard textbook fact.

## Deviations from the task and from the original (and why)

- Buttons became steps (clicker) and presets; step 3, the diode names, the readout, the polarity signs, the arrows
  and the explanation were added; English written.
- Title "Bridge rectifier" rather than the catalogue's "full-wave rectifier", to keep it apart from `rectifier-1`.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-contents-hr text. For the coordinator
to add with `"src": "simdeck"` (most are already listed by `rectifier-1`):

| en | hr |
|---|---|
| bridge rectifier | mosni ispravljač |
| rectifier | ispravljač |
| full-wave rectifier | punovalni ispravljač |
| half-period | poluperioda |
| (diode) conducts / blocks | provodi / zaporna |
| load current | struja opterećenja |
| load resistor | otpor opterećenja |
| pulsating DC voltage | pulsirajući istosmjerni napon |
| diode ring mixer | diodni prstenasti mješač |

## Shared requests

None. No shared model used or offered. `rectifier-1` and this sim share a model shape (half-periods, windows, curve)
but not code; if a third rectifier sim comes, a small `models/rectifier.js` could hold `halfAt`, `windows` and
`curve`.

## Checks

- `node --test sims/rectifier-2/sim.test.js`: 17 tests. Each rule broken once on a copy (EPS 0, the half-period's
  sign, the pairing, Ua without the flip, step 3's alternation, the last window's cut, `floor` for the step, the
  bottom end's polarity, the load's direction in the 2nd half, a path at step 0, the pairs not copied (twice), the
  `indexOf` test for "conducts") makes 1–7 tests fail. No mutant survived.
- `npm run gate -- rectifier-2`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` steps 0, 1, 2 in hr and en at 1920×1080 and 375×812 (step 2 en in dark); no console errors. Fixed from
  them: on the phone `~Us` touched the − corner and D3's label touched R; on the desktop D2's state word crossed the
  wire from − to the rail.
- Not checked: a real projector; the Croatian wording of the added text with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 16:20–16:35 CEST), one session.
