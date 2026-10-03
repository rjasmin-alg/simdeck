<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# iq-phasor: notes

Adopted from `50ohm-contents-hr/contents/html/applet_iq_zeiger.html` (file last changed in `4802915`, repo at
`5745d5e`; task `docs/tasks/w1/iq-phasor.md`, catalogue `50ohm-iq-phasor`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_iq_zeiger.html`; its script is identical to the Croatian one, only the visible
labels and two comments differ. The Croatian copy still had one German sentence (the note under the plot before the
first click, "Bei t = 0 ist die waagerechte Projektion…"); the script replaced it with Croatian on the first toggle.
The simdeck copy is canonical from here on. The first commit on the branch holds the original as-is, so `git log -p`
shows the change.

**Where the applet sits in 50ohm:** `sections/iq_verfahren.md` (both repos) includes it after the paragraph on the
turning phasor and its two projections, before the constellation diagram. The Croatian terms and the explanation
come from that section (hr), without its exam question (AF633) and without the in-depth box on the complex phasor.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `sections/iq_verfahren.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**,
  licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  translation by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so it is team material under
  the repos' CC BY 4.0 and the task went ahead.
- **Changed**: adapted to the simdeck kit, drawn as SVG instead of on a canvas, translated into English, the turn in
  12 steps of 30° instead of a free-running animation, the I and Q parts on the axes, the start position, the readout
  and presets added (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The applet loads none (plain canvas and a `requestAnimationFrame` loop); the page needs
  none either.

## Decisions

- **Class `stepper`**, 12 steps (playbook §10.4). The original is a canvas with a toggle "let the phasor turn" that
  runs a free animation at 0.4 turns per second. A stepper keeps that motion and makes it a lecture tool: Space plays
  it through the kit's transport (at ½× to 4×), a clicker's → turns the phasor 30° at a time, every position can be
  stopped on and linked, and reduced motion needs nothing extra. Step 0 is the original's "start state at t = 0"
  (with the angle φ), step 12 is one full turn, back at the start.
- **30° per step**: the phasor lands on the axes at every step when φ is a multiple of 30°, and on the 45° diagonals'
  neighbours otherwise; 12 steps stay well under the 20-step limit and a full turn is a 1-minute demo at 1×.
- **Start at A = 80 %, φ = 30°** instead of the original's 0.75 and 0°, where Q = 0 and half the picture is flat;
  30° gives two parts that are both non-zero and clearly different (69 % and 40 %).
- **Slider steps**: A in 5 % (0 … 100, the original 0.01 of 1), φ in 15° (−180 … 180, the original 1°), so the arrow
  keys and a clicker get somewhere; every preset lies on the grid. A is shown in percent instead of 0 … 1, as in
  `iq-signals`.
- **Kept from the original**: the layout (I/Q plane top left, the sine to the right on the plane's height, the cosine
  downwards on the plane's width, both on the plane's scale so the projection lines are straight), each strip one
  carrier period long starting at t = 0, a cursor dot on each wave with a dashed line from the tip, the angle φ as an
  arc, the full-scale circle, counter-clockwise rotation, I = A · cos, Q = A · sin.
- **Added**: the I and Q parts drawn along the axes (the "horizontal and vertical part" of the 50ohm text), the circle
  the tip runs on, the part of each wave already run drawn bold and the rest faint, the start position (dotted line and
  ring) kept while the phasor turns, the arc φ kept too (the original shows it only before the toggle), a readout of
  the current I, Q, ωt and of the symbol's A, φ, I, Q at t = 0, captions per step, a note when the phasor lies on an
  axis, six presets.
- **Tie-breaks**: A = 0 is no signal: both projections stay 0, no axis note, the caption says the phase means
  nothing; the angle is folded into (−180°, 180°], so φ = −180° is the same phasor as 180° (the slider keeps showing
  −180°); cos and sin are exact on the axes, so a projection there is 0 or ±A and never −0; shown values round half
  away from zero after cutting float noise, so +2.5 % and −2.5 % both show as 3 % in size (5 · cos 120° is
  −2.4999999999999996 in floating point and would otherwise show as −2 %); slider input clamps, snaps half a step up,
  −0 becomes 0, a non-number gives the default.
- **Colour**: phasor `--c2` thick with a head; I `--c1` solid, Q `--c3` dashed, in the parts, the waves and the
  projection lines (I's projection dashed long, Q's dotted); start position `--c8` dotted with a ring. Every wave has its
  own text title next to it and its own line pattern, so colour is never the only carrier (grayscale screenshot
  checked).
- **No answer keys**: the 50ohm section carries exam question AF633; it is not on the page or in a preset.

## Deviations from the original (and why)

- The canvas became SVG drawn at 1:1, so its labels keep the 16 px floor (the original draws 10–13 px text).
- The free-running animation became 12 steps (above). Nothing animates on its own; the kit's Play steps through.
- The original's untranslated German note and its `de-DE` number format are gone: numbers are whole percent with a
  real minus sign, the words come from `strings.js`.
- New start values, slider grids, readout, presets and the drawing additions (above).

## Term pairs

Not in `kit/glossary.js` (it has `kazaljka` only as "clock hand"); written out in both tables (Croatian from
`sections/iq_verfahren.md` and the applet). For the coordinator to add with `"src": "simdeck"` (the same list as
`iq-signals`, plus the first and the last two):

| en | hr |
|---|---|
| phasor | kazaljka |
| in-phase component (I) | komponenta u fazi |
| quadrature component (Q) | kvadraturna komponenta |
| I/Q plane | I/Q ravnina |
| constellation diagram | konstelacijski dijagram |
| phase (phase position) | faza (fazni položaj) |
| projection | projekcija |
| I/Q representation | I/Q prikaz |

## Shared requests

None. (`iq-signals` and this sim share only `fold`, a one-liner; nothing worth a shared model.)

## Checks

- `node --test sims/iq-phasor/sim.test.js`: 17 tests. Each rule broken once on a copy (fold to −180°, plain
  `Math.cos`/`Math.sin` off the axes' exact values, plain `Math.round`, clockwise turning, the sine 90° the wrong way,
  "full" a step early, A = 0 not "none", floor instead of round in the slider snap) makes 1 to 6 tests fail. The
  ±2.5 % rounding test failed on the first run, before the float-noise cut existed: that is how the tie-break was
  found.
- `npm run gate -- iq-phasor`: pass (manifest, tests, build, browser 62/62, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus unbuilt from `file://`
  step 2 (on the Q axis), preset −45° at step 4, preset 180° at step 12 (full turn), A = 0 and φ = −180° at step 1,
  no console errors or warnings. Fixed from them: the caption lost its first ωt (one DOM node used for two
  placeholders), the readout's heading sat on the "I: cosine" title, and the φ label touched the phasor on the phone.
- Not checked: a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 10:32–10:47 CEST), one session.
