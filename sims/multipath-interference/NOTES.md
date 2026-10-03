<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multipath-interference: notes

Adopted from `50ohm-contents-hr/contents/html/applet_interferenz.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/multipath-interference.md`, catalogue `50ohm-interference`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_interferenz.html` @ `48e18bf` (file last changed in `e56d0dc`); it differs
from the Croatian one only in its five visible strings. The host text is `contents/sections/mehrwegeausbreitung.md`
(the applet sits in its web margin); `sections/yagi_uda_2.md` includes it too, for the antenna's directivity. The
simdeck copy is canonical from here on. The first commit on the branch holds the original as-is, so `git log -p`
shows the change.

## What the original is

One slider, "Faza" (phase), 0 … 360°, default 90°, and two Chart.js line charts over −π … 4π (2.5 periods): the
signal `100·sin x` with a copy `amplitude·sin(x + φ)` ("Superpozicija") at ±100 %, and their sum ("Zbrojni signal")
at ±200 %. `amplitude` is fixed at 100; the script binds a handler to an `#amplitude` slider that the page does not
have. The charts redraw on `change` only (when the slider is released).

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/mehrwegeausbreitung.md` (multipath, its causes, the receiver
  adding the signals, the moving-reflector paragraph), **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation by
  the 50ohm-contents-hr team.
- The HTML file carries no author line and no licence of its own (task step 2 checked): team material under the
  repos' CC BY 4.0.
- **Changed**: adapted to the kit, translated into English, a slider for the reflected signal's strength, the
  phase-difference marker, the sum's amplitude and level added (below). Stated on the page and in `sim.json`
  `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The original loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de (task step 3). The
  kit page draws both plots as SVG at 1:1 (as `sims/lambda-f`, `sims/nyquist`), so neither is used: Chart.js draws
  canvas text below the 16 px floor and takes colour literals, and jQuery only bound two events.

## Decisions

- **Class `explorer`** (playbook §10.4): two sliders, nothing to step through. The demo is the seven presets
  (keys 1–7): 0° (twice as strong), 90° (the original's start), 120° (as strong as the direct signal), 180°
  (cancelled), 180° with a 50 % reflection (weakened, not cancelled), 90° at 50 %, 360° (same as 0°).
- **Default 90°, 100 %**, as the original.
- **Reflected-strength slider added** (0 … 100 %, default 100 %). The original's script already reads an
  `amplitude` slider; with it the page shows why real multipath rarely cancels completely. Still one concept
  (two signals adding with a phase difference).
- **The copy lags**: drawn as `sin(ωt − φ)`, a later arrival over the longer path, where the original drew
  `sin(x + φ)` (a lead). The sum's strength is the same for both (it depends on cos φ only); the lag matches the
  story and the φ marker.
- **The φ marker**: an arrow from a crest of the direct signal (filled dot) to the next crest of the copy (hollow
  dot), labelled "φ = …" (only "φ" on a narrow plot). Left out when there is no copy (0 %) or no lag (0°).
- **The sum's amplitude** A = √((1 − a)² + 2a(1 + cos φ)) is shown as dashed lines at ±A and as "A = … %" in the
  plot's title row, and the caption gives it with its level against the direct signal, 20·log10 A dB, to 0.1 dB.
  Written in that form, A is exactly 0 at a = 1, φ = 180° (cos π = −1 exactly).
- **Effects and tie-breaks** (tested, in this order): a = 0 is "no interference", whatever φ; A < 1e-9 is complete
  cancellation (only 180° at 100 %); |A − 1| < 1e-9 is "gain and loss balance" (e.g. 120° and 240° at 100 %, where
  cos 120° is not exactly −0.5 in floating point); otherwise constructive (A > 1) or destructive (A < 1).
- **Path difference**: the caption says the phase difference comes from a path longer by φ/360 λ (360° → 0 λ), or
  by that plus whole wavelengths. The explanation adds that the reflection itself can shift the phase (the 50ohm
  figure caption says so), so the caption does not claim the path is the only cause.
- **Colour**: direct `--c1` solid, reflected `--c2` dashed (and "dashed" in its legend label), sum `--c3` thick in
  its own plot, so grayscale keeps the three apart.
- **Attribution in the footer bar** (task step 2: "page footer"), as in `sims/lambda-f`; on a phone the bar is
  static, or the credit would cover a third of the screen.

## Deviations from the original (and why)

- Labels: "Superpozicija" / "Überlagerung" named the shifted copy, not a superposition; now "reflected signal". The
  x axis "Vrijeme" (time) stays, as "vrijeme →"; the y ticks stay in % of the direct signal.
- The plots redraw on every input, not on release.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam question AH222 (DL-DE-BY 2.0, a separate licence, and answer material).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/mehrwegeausbreitung.md` and
`sections/yagi_uda_2.md`). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| multipath (propagation) | višestazno širenje |
| interference (constructive / destructive) | interferencija (konstruktivna / destruktivna) |
| phase difference | fazna razlika |
| fading | feding *(check: the 50ohm text keeps *fading* in italics; "feding" is the usual Croatian spelling)* |
| reflection | refleksija |
| crest / trough (of a wave) | brijeg / dol (vala) (`lambda-f` used "dolina"; the yagi section uses "dol") *(check)* |

## Shared requests

None.

## Checks

- `node --test sims/multipath-interference/sim.test.js`: 15 tests; each rule broken once (no tie tolerance, copy
  leads, no cancelled, no same, no none, wrong amplitude formula, unrounded dB, −0 dB, path fraction without mod
  360, no clamp) makes at least one fail.
- `npm run gate -- multipath-interference`: pass (manifest, tests, build, browser 46/46, tokens, scope), no
  exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus 180°, 360°, 0°, 0 %
  reflection (desktop) and 350° at 60 % (phone), unbuilt from `file://`, no console errors or warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 8 minutes by the machine clock (2026-10-03 08:24–08:32 CEST), one session.
