<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nyquist: notes

Adopted from `50ohm-contents-hr/contents/html/applet_nyquist.html` @ `57ef515` (task `docs/tasks/w1/nyquist.md`,
catalogue `50ohm-nyquist`, §2.5). German original: `50ohm-contents-dl/contents/html/applet_nyquist.html` @
`453ee9a`; its script is the same as the Croatian one except the four info-box strings. The simdeck copy is
canonical from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/abtasttheorem.md` (the explanation and the CD example),
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation
  by the 50ohm-contents-hr team (9A1ZG, 9A6NVI).
- **Changed**: adapted to the simdeck kit, translated into English, the boundary case and the reconstruction
  changed (below). Stated on the page and in `sim.json` `credits`.
- The applet carries **no author or licence of its own** (checked: no notice in either copy; the repos' README
  says the general content is CC BY 4.0). So the repo licence covers it and the task could go ahead.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links
  to 50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. The attribution does not
  imply that DARC endorses simdeck or the Croatian translation (the 50ohm-contents-hr README asks for that).
- No libraries: the applet draws on plain canvas and loads nothing from 50ohm.de, so nothing is vendored.
  Its only outside dependency was the host page's MathJax for `$f_\text{s}$`; the kit page writes fₛ in HTML.

## Decisions

- **Class `explorer`** (playbook §10.4): one slider, no sequence to step through. The 3–5 minute demo is the seven
  presets (keys 1–7), from 8 kHz down to 1 kHz: smooth, enough, just enough, exactly at the limit (fails), two
  aliases, and fs = f (a constant).
- **`fs` in whole hertz** (1000–8000, step 25, as the original's 1.0–8.0 kHz in 0.025 steps), so the URL, the
  presets and the Nyquist comparison are exact; the page shows kHz with two decimals, three where the 25 Hz grid
  needs them.
- **Model kept**: a 1 kHz sine at zero phase, samples at n / fs from t = 0, a 3 ms window (three periods), the
  normalised sinc and Whittaker–Shannon reconstruction, the three panels (original, sampled with stems, and
  reconstructed over the dashed original).
- **Drawn as SVG at 1:1, not canvas**, so axis labels are kit-sized text (≥ 16 px) from `strings.js`; redrawn when
  the stage resizes (as `sims/amdahl`). Time is labelled in ms instead of the original's 0T…3T (T = 1 ms here).
- **Colour**: original `--c1` line, samples `--c2` stems with round dots, reconstruction `--c3` thick line; the
  original under the samples is faint, under the reconstruction dashed. The verdict above the reconstruction is a
  symbol and words (✓ / = / ⚠) with a solid, dashed or thick border, so it survives grayscale. The original turned
  the reconstruction red when aliasing; here it keeps its legend colour and the verdict carries the state.
- **The info box became the caption**, with the numbers: fs, the limit and, below it, the alias frequency.
- **Attribution in the footer bar** (task step 2: "page footer"): the kit's footer is the transport, which for an
  explorer holds only the reset button, so the credit sits after it. On a phone the kit makes that bar sticky;
  this page makes it static there, or the three-line credit would cover a third of the screen.

## Deviations from the original (and why)

- **fs = 2f exactly is not "condition met".** The original's test was `fs >= 2 * F_SIG`, so at 2.00 kHz it said
  "✓ Nyquist condition met… the reconstructed signal matches the original" while drawing a flat line: every
  sample of this sine lands on a zero crossing. The theorem needs fs > 2f, and the 50ohm section text itself says
  that exactly 2 kHz does not reconstruct reliably. Now three states: met (> 2f), at the limit (= 2f, explained),
  aliasing (< 2f). Tested as the tie-break.
- **Alias frequency folded properly**: |f − k·fs| for the nearest whole k, instead of the original's |fs − f|.
  Both agree on the slider's range (1–2 kHz), so no number on the page changes; the general fold is what the
  explanation states and is tested beyond the range (fs = 0.3 kHz → 0.1 kHz).
- **Reconstruction without edge truncation**: the original summed sinc only over samples inside the 3 ms window,
  so the curve bent away from the signal near both ends even at high fs. Now the sum also takes samples 100 ms
  either side (still the same infinite sine); the error is about 0.001 at 3–8 kHz and at most 0.04 anywhere on
  the slider (worst near 1.95 and 2.05 kHz, where sinc converges slowly), tested at every slider value. A render
  at 8 kHz takes about 15 ms. *(check)* if a lecturer wants the truncation effect shown
  on purpose, it would be a second concept.
- `-0` from `Math.ceil(-1e-9)` is turned into `0`, so the state survives a JSON round trip (the kit's URL state).
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from the 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`
and common Croatian DSP usage). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| sampling | uzorkovanje |
| sampling rate | brzina uzorkovanja (also frekvencija uzorkovanja) |
| sampling theorem | teorem uzorkovanja |
| Nyquist condition | Nyquistov uvjet |
| aliasing | preklapanje spektra *(check: 50ohm-hr keeps the loanword "aliasing"; the page uses both)* |
| reconstruction | rekonstrukcija |

## Shared requests

None.

## Checks

- `node --test sims/nyquist/sim.test.js`: 15 tests; each rule broken once (fs ≥ 2f counted as met, alias as
  |fs − f|, no margin, sinc(0) wrong, no clamp, −0 left) makes at least one fail.
- `npm run gate -- nyquist`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions declared.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, help and panel hidden, and 375×812, in hr and en; plus
  the presets at the limit, aliasing, fs = f and 1.975 kHz.
- Not checked: a real projector; the Croatian term choice for *aliasing* with the HRS translation team.

## Time

Start to done: about 10 minutes by the machine clock (2026-10-03 00:40–00:50 CEST), one session.
