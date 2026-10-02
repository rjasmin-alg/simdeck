<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# quantisation: notes

Adopted from `50ohm-contents-hr/contents/html/quantisierung_und_sampling.html` (file last changed in `57ef515`,
repo at `5745d5e`; task `docs/tasks/w1/quantisation.md`, catalogue `50ohm-quantisation`, §2.5). German original:
`50ohm-contents-dl/contents/html/quantisierung_und_sampling.html` @ `48e18bf` (file last changed in `d730759`, a
refactor: same model, default 16 samples/s, `input` instead of `change` events). The simdeck copy is canonical from
here on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/sampling_quantisierung.md` (the explanation and the dimmer
  comparison), **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation by
  the 50ohm-contents-hr team.
- **The script carries an author line, `// Script by DL9MJ, 2024`, but no licence of its own.** DL9MJ is
  Prof. Dr.-Ing. Matthias Jung, listed in the 50ohm.de-Autorenteam in the 50ohm-contents-hr `README.md` (both
  author lists). So the applet is team material under the repos' CC BY 4.0, and the task went ahead (task step 2
  says stop on a *separate* author or licence; this is a team member's credit line, not a separate one). The
  credit names DL9MJ as well, to keep the author line the original carried. *(check)* if the owner reads step 2
  more strictly.
- **Changed**: adapted to the simdeck kit, translated into English, quantiser and drawing changed (below). Stated on
  the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC
  endorses simdeck or the Croatian translation.
- **No libraries vendored.** The original loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de (task step 3). The
  kit page draws the plot as SVG at 1:1 (as `sims/nyquist`), so neither is used and nothing is vendored: Chart.js
  draws canvas text below the 16 px floor and takes colour literals, and jQuery only bound two events.

## Decisions

- **Class `explorer`** (playbook §10.4): two sliders, no sequence to step through. The demo is the six presets
  (keys 1–6): fine, coarse in time, coarse in value, both, one bit, two samples per period.
- **Sliders as the original**: time quantisation 2^1 … 2^10 samples/s (param `rate` = the exponent), value
  quantisation 1 … 16 bits. A 1 Hz sine over 1 s, values in % of the amplitude, y axis ±120 %.
- **Default 16 samples/s, 16 bits**, as the German refactor (the Croatian copy starts at 1024 samples/s, where the
  steps cannot be seen).
- **Drawing**: the continuous-time signal `--c1` dashed, the samples `--c2` round dots at their *analogue* value (so
  the gap between dot and step is the quantisation error), the D/A output `--c3` thick stepped line. Dots up to
  64 samples/s (above, they merge into the line), level lines (dotted) up to 4 bits (16 levels). The legend labels
  say "dashed" and "steps", so grayscale keeps them apart.
- **The caption gives the numbers**: fs and 1/fs, bits, 2ⁿ levels, the step Δ and the error bound Δ/2. The
  explanation adds the 6.02 · n + 1.76 dB rule for a full-scale sine and the CD (44.1 kS/s, 16 bits).

## Deviations from the original (and why)

- **The quantiser rounds to the nearest of 2ⁿ levels.** The original computed
  `sign(v) · Δ · floor(|v|/Δ + 1)` with Δ = 200 % / 2ⁿ, clamped to ±100 %: it always rounds *away from zero* (error
  up to a whole Δ, all of it outward), has 2ⁿ + 1 output values (1 bit gave −100, 0 and +100 %, three values) and
  maps only exact zeros to 0. Now a b-bit mid-rise quantiser: 2ⁿ levels at −100 % + (k + ½)Δ, error at most Δ/2,
  1 bit gives ±50 %. Tie-breaks: a value on a decision boundary (0 among them) goes to the level above; ±100 % go
  to the top and bottom level. Tested.
- **Zero crossings are exact.** `Math.sin(π)` is 1.2e-16, which in the original sent the samples at 0.5 s to a
  different level than the one at 0 s. Samples are computed from n / fs (exact, fs is a power of two) and return
  exactly 0 and ±1 at the quarter periods. Tested.
- **Initial draw used the wrong step.** The original's first draw used a default Δ of 0.001 and its first time-slider
  change Δ = 100 / (2ⁿ − 1), not the 200 / 2ⁿ of the value slider. Gone with the rewrite: one Δ everywhere.
- **2 samples/s gets its own caption.** With two samples per period, both land on zero crossings and the output is a
  flat line; the caption says so and points at more than two samples per period (the sampling theorem itself is
  `sims/nyquist`, listed in `related`).
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/sampling_quantisierung.md` and the
applet). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| sampling | uzorkovanje |
| sample | uzorak |
| sampling rate | brzina uzorkovanja |
| quantisation | kvantizacija |
| time quantisation | vremenska kvantizacija |
| value quantisation | kvantizacija vrijednosti |
| continuous-time / discrete-time | vremenski kontinuiran / vremenski diskretan |
| continuous-value / discrete-value | vrijednosno kontinuiran / vrijednosno diskretan |
| A/D converter, D/A converter | A/D pretvarač, D/A pretvarač |
| quantisation level | razina kvantizacije |

## Shared requests

None.

## Checks

- `node --test sims/quantisation/sim.test.js`: 16 tests; each rule broken once (boundary rounding down, no top
  clamp, inexact quarter points, levels at kΔ, the original's away-from-zero rule, no hold, the limit flag off, the
  last sample dropped) makes at least one fail.
- `npm run gate -- quantisation`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus presets 3, 4, 6 and 1
  (dark) unbuilt from `file://`, no console errors.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 8 minutes by the machine clock (2026-10-03 00:53–01:00 CEST), one session.
