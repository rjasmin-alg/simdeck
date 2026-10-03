<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# iq-signals: notes

Adopted from `50ohm-contents-hr/contents/html/applet_iq.html` (file last changed in `898e7c1`, repo at `5745d5e`;
task `docs/tasks/w1/iq-signals.md`, catalogue `50ohm-iq`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_iq.html`; its script is identical to the Croatian one, only the dataset
labels, the axis title, the "i/und" between A and φ and the sentence before the constellation chart differ. The simdeck
copy is canonical from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the
change.

**Where the applet sits in 50ohm:** the German `sections/qam.md` includes it in a web-only in-depth box after the
I/Q modulator (two carriers 90° apart, weighted by I and Q, added; the formula with A and atan2). The Croatian
`sections/qam.md` does not have that part yet (the hr repo is behind upstream there), so no Croatian section includes
the applet. The Croatian terms come from `sections/iq_verfahren.md` (komponenta u fazi, kvadraturna komponenta, I/Q
ravnina, konstelacijski dijagram); the Croatian explanation is translated from the German `qam.md` for simdeck.
*(check: the Croatian wording of the I/Q modulator paragraph, once the hr repo translates it)*

## Attribution and licence (CC BY 4.0)

- Source: the applet, the I/Q modulator text of the German `sections/qam.md` and the I/Q text of
  `sections/iq_verfahren.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation of
  the applet and of `iq_verfahren.md` by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so it is team material under
  the repos' CC BY 4.0 and the task went ahead.
- **Changed**: adapted to the simdeck kit, drawn as SVG instead of Chart.js, translated into English, an arrow and the
  angle φ in the constellation diagram, peak marks and presets added (below). Stated on the page and in `sim.json`
  `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de; the page needs neither
  (the kit does the controls, SVG does the three time rows and the constellation), so nothing is copied and nothing
  is loaded from the network.

## Decisions

- **Class `explorer`** (playbook §10.4): two sliders, nothing to step through. The 3–5 minute demo is the seven presets
  (keys 1–7): I = 60 %, Q = 80 % (the start: A = 100 % exactly, φ ≈ 53°), only I (φ = 0°), only Q (φ = 90°, the sum
  leads by a quarter period), I = Q = 70 % (45°, A ≈ 99 %), negative I (180°, the carrier upside down),
  I = Q = 100 % (A ≈ 141 %, more than either part), and I = Q = 0 (no signal, phase undefined).
- **Start at I = 60 %, Q = 80 %** instead of the original's 0 / 0, which shows three flat lines; 60/80 gives a round
  A = 100 % and a phase that is clearly not a multiple of 45°.
- **Slider step 5 %** instead of 1 %: 41 positions instead of 201, so the arrow keys and a clicker get somewhere; the
  presets and the formulas need no finer grid.
- **Kept from the original**: I and Q from −100 % to 100 %, Q's carrier as cos(ωt + 90°) (= −sin ωt, the sign of the
  German formula), the window ωt = −π … 4π (2.5 carrier periods), A and φ shown rounded to whole numbers, the
  constellation point at (I, Q).
- **Three time rows on one scale (±160 %)** instead of one chart for I and Q (±100 %) and one for the sum (±150 %):
  each wave has its own titled row, and a sum larger than its parts (the corner preset) can be seen as such.
- **Added**: dotted reference marks at the I carrier's peaks (ωt = 0, 2π, 4π) through all three rows, and on the sum
  row a dashed line with a triangle at each of the sum's peaks (ωt = −φ + k · 360°), so lead and lag can be read off;
  in the constellation diagram the 100 % circle, dashed projections onto both axes, an arrow from the origin and the
  angle φ as an arc. The caption gives A = √(I² + Q²), φ = atan2(Q, I) with the numbers and says lead or lag.
- **Tie-breaks**: I = Q = 0 → no signal, φ shown as "not defined" (the original showed atan2(0, 0) = 0°); φ is in
  (−180°, 180°], so negative I with Q = 0 (also −0) is +180°, and a φ that rounds to −180° is shown as 180°; φ = 0° and
  180° neither lead nor lag; I and Q input clamps to −100 … 100, snaps to 5 (half step up), −0 becomes 0, a non-number
  gives the default.
- **Colour**: I `--c1` solid, Q `--c3` dashed, sum `--c2` thicker, reference marks `--c8` dotted, sum peaks `--c5`
  dashed with a triangle. Every row has its own text title and every line its own dash pattern, so colour is never the
  only carrier (grayscale screenshot checked).
- **No answer keys**: the 50ohm sections carry exam questions (AF632, AE404, AF633); none is on the page or in a preset.

## Deviations from the original (and why)

- Chart.js and jQuery replaced by the kit and SVG drawn at 1:1, so the labels keep the 16 px floor and nothing is
  loaded from the network.
- The original's MathJax-style `$I(t)=$` labels became plain text (no MathJax on simdeck pages).
- New start values, slider step, rows on one scale, the marks and the arrow (above).
- The English text is written for simdeck from the Croatian and the German; the explanation follows the German
  `qam.md` in-depth box and `iq_verfahren.md` without their exam questions.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/iq_verfahren.md` and the applet). For the
coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| in-phase component (I) | komponenta u fazi |
| quadrature component (Q) | kvadraturna komponenta |
| I/Q plane | I/Q ravnina |
| constellation diagram | konstelacijski dijagram |
| I/Q modulator | I/Q modulator |
| carrier | nositelj |
| phase (phase position) | faza (fazni položaj) |
| phasor | kazaljka |

## Shared requests

None.

## Checks

- `node --test sims/iq-signals/sim.test.js`: 14 tests. Each rule broken once by hand (φ at the origin not null, fold
  to −180°, −0 kept, floor instead of round, no clamp, Q shifted by −90°, peaks with the wrong sign, reversal counted
  as lead, "over" at exactly 100 %, rounded φ not folded, the window starting at 0) makes 1 to 3 tests fail.
- `npm run gate -- iq-signals`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus presets 1, 5, 6 and 7 at
  1920×1080 and 6 at 375×812 unbuilt from `file://`, and the explanation open, no console errors or warnings. Fixed
  from them: the peak triangles hid under the wave at A = 141 % (now drawn last, from the frame's top edge, rows
  ±160 %), the φ label sat on the Q axis at 180°, the "100 %" scale label crossed a peak mark on the phone (halo).
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 9 minutes by the machine clock (2026-10-03 10:21–10:30 CEST), one session.
