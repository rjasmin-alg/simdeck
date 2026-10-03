<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rect-pulse-spectrum: notes

Adopted from `50ohm-contents-hr/contents/html/applet_rectangle.html` @ `5745d5e` (task
`docs/tasks/w1/rect-pulse-spectrum.md`, catalogue `50ohm-rectangle`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_rectangle.html` @ `48e18bf`; its script is the same as the Croatian one
except the intro sentence, the N label and the two legend labels. The simdeck copy is canonical from here on. The
first commit on the branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/nicht_sinus_signale.md` (harmonics and overtones, odd
  harmonics of a clipped signal, the Gibbs sentence under the applet), **50ohm.de-Autorenteam, AJW-Referat des
  DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos).
  Croatian translation by the 50ohm-contents-hr team.
- **Changed**: adapted to the simdeck kit, drawn without libraries, translated into English, a spectrum panel,
  presets and the overshoot number added (below). Stated on the page and in `sim.json` `credits`.
- The applet carries **no author or licence of its own** (checked: no notice in either copy), so the repo licence
  covers it and the task could go ahead.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links
  to 50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. The attribution does not imply
  that DARC endorses simdeck or the Croatian translation.
- **Nothing vendored.** The applet loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de, but used jQuery not at all
  and Chart.js only for two line plots. The page draws both plots itself as SVG (as `nyquist` and `fourier` do), so
  no library is needed and none is listed in `credits`. Its MathJax `$N$` is plain text now.

## Decisions

- **Class `explorer`** (playbook §10.4): one slider, no sequence. The 3–5 minute demo is the seven presets (keys
  1–7): N = 1, 3, 5, 9, 25, 99, 499, from the fundamental alone to the slider's end.
- **Slider kept as the original**: odd N from 1 to 499 in steps of 2 (the arrow keys move one harmonic). The small
  N that matter most sit at the left end of a long slider; the presets cover them.
- **Title "The spectrum of a square wave"**, not "of a rectangular pulse" (the catalogue's words): the applet
  draws a periodic symmetric square wave, not a single pulse, whose spectrum would be continuous (sinc). The id
  stays `rect-pulse-spectrum` as the task file names it; "rectangular pulse" is an alias for search.
- **A spectrum panel added** under the time plot, because the catalogue entry and the 50ohm section are about the
  spectrum: one bar per odd harmonic at 4/(kπ), labelled when there is room, the 1/k envelope dotted, and the odd
  harmonics not yet in the sum as dashed outlines up to k = 15 (so N = 1 already shows where the next ones go).
- **The overshoot made visible**: the first peak after the jump (at x = π/(N+1)) is ringed, a dotted level line
  runs from it, its height is written next to it, and a badge above the plot gives the overshoot as a percentage
  of the jump. The 50ohm text names the Gibbs phenomenon but no number; the badge shows it falling from 13.7 %
  (N = 1) towards 8.95 %, which is the point of the demo.
- **Drawn as SVG at 1:1, not canvas**, so axis labels are kit-sized text (≥ 16 px); redrawn when the stage resizes.
  The x axis keeps the original's −3π/2 … 3π/2 in multiples of π/2 (only −π, 0, π on a phone); those labels are
  symbols and carry `translate="no"`.
- **Colour**: ideal square wave `--c2` dashed (the original's red, dashed), Fourier sum `--c1` solid (the
  original's blue), spectrum bars `--c3`. Dashed against solid, and bars in their own panel, so grayscale reads.
- **Captions** in four cases: N = 1 (the fundamental alone), N = 3, N up to 47, and N from 49 (the Gibbs limit).

## Deviations from the original (and why)

- **Intro text "values from 1 to 500"** in the original; the slider ends at 499 (odd only). The hint says 499.
- **Sample count capped at 8000** points (the original's max(1200, 40N) gives 19 960 at N = 499): about five
  points per ripple at N = 499 is enough to draw it, and a render stays quick. Tested.
- **Even N**: the model keeps the original's tie-break (an even number goes down: 4 → 3; a fraction is truncated
  first, as `parseInt` did). On the page the kit snaps a URL value to the slider grid before the model sees it,
  and the kit rounds half up (`?n=4` → 5). Only a hand-typed URL can hit this; the model's rule is tested.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material).

## Overlap with `fourier` *(check)*

`sims/fourier` (Fourier synthesis) has a square-wave preset and lists "Gibbs phenomenon" as an alias. This sim's
concept is narrower: only the square wave, its odd-harmonic 1/k spectrum and the overshoot that does not go away,
up to N = 499 (fourier stops at 30 harmonics). They are linked with `related`. Whether both belong in the HAM
course list is the coordinator's call.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from the 50ohm-contents-hr section text). For the
coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| harmonic | harmonik |
| fundamental | osnovni val (also 1. harmonik) |
| overtone | viši val |
| square wave | pravokutni signal |
| Fourier approximation | Fourierova aproksimacija |
| spectrum | spektar |
| overshoot | prebačaj *(check: 50ohm-hr says "prebacivanje i podbacivanje" for overshoot and undershoot)* |
| Gibbs phenomenon | Gibbsov fenomen |
| time domain / frequency domain | vremensko / frekvencijsko područje |

## Shared requests

None.

## Checks

- `node --test sims/rect-pulse-spectrum/sim.test.js`: 15 tests; each rule broken once (even N rounded up, NaN not
  to 1, rounding instead of truncating, even harmonics given an amplitude, the jump not at 0, every harmonic summed,
  the peak at π/N, too few points) makes at least one fail.
- `npm run gate -- rect-pulse-spectrum`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus N = 3, 25, 99 and 499 at
  1920×1080 and N = 3 on the phone.
- Not checked: a real projector; the Croatian term *prebačaj* with the HRS translation team.

## Time

Start to done: about 10 minutes by the machine clock (2026-10-03 09:50–10:00 CEST), one session.
