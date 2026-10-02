<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lambda-f: notes

Adopted from `50ohm-contents-hr/contents/html/applet_lambda_und_f.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/lambda-f.md`, catalogue `50ohm-lambda-f`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_lambda_und_f.html` @ `48e18bf` (file last changed in `e56d0dc`); its script
is the same as the Croatian one except four UI strings. The simdeck copy is canonical from here on. The first commit
on the branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/wellenlaenge.md` (the definition, the 1 Hz / 1 kHz / 1 MHz
  comparison, the 300 / λ formulas and the 145.3 MHz example), **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**,
  licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  translation by the 50ohm-contents-hr team.
- **The script carries an author line, `// Script by DL9MJ, 2024`, but no licence of its own.** DL9MJ is
  Prof. Dr.-Ing. Matthias Jung, listed in the 50ohm.de-Autorenteam in the 50ohm-contents-hr `README.md` (both author
  lists). So the applet is team material under the repos' CC BY 4.0, and the task went ahead, as `sims/quantisation`
  did with the same line (task step 2 says stop on a *separate* author or licence; this is a team member's credit
  line). The credit names DL9MJ as well. *(check)* if the owner reads step 2 more strictly.
- **Changed**: adapted to the simdeck kit, translated into English, the slider renamed, one wavelength marked
  (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC
  endorses simdeck or the Croatian translation.
- **No libraries vendored.** The original loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de (task step 3). The
  kit page draws the plot as SVG at 1:1 (as `sims/nyquist` and `sims/quantisation`), so neither is used: Chart.js
  draws canvas text below the 16 px floor and takes colour literals, and jQuery only bound two events. Its only other
  outside dependency was the host page's MathJax for `$\lambda$`; the kit page writes λ as text.

## Decisions

- **Class `explorer`** (playbook §10.4): one slider, nothing to step through. The demo is the seven presets
  (keys 1–7): 8 → 4 → 2 → 1 m → 50 cm, halving λ each time so f doubles, then 3 m (about 100 MHz) and 10 m (one
  wavelength fills the view).
- **Slider as the original**: λ from 0.50 to 10.00 m in 1 cm steps, as param `cm` (whole centimetres, so the URL
  and presets are exact). The view is the original's 0 … 10 m of distance.
- **Default 2 m**, not the original's 0.69 m: 0.69 m is the answer to exam question NB303 (433.5 MHz), which the
  50ohm section asks right after the applet. For the same reason no preset sits on 0.69 m or 2.08 m (NB302).
- **c = 299.792458 m·MHz, as the original**, and the caption adds the rule of thumb 300 / λ that the section and the
  exam formula sheet use, so the 0.07 % difference is visible (74.95 against 75.00 MHz at 4 m).
- **One wavelength marked**: a dimension line labelled "λ = …" from crest to crest, with the crests as round dots.
  When the second crest falls outside the view (λ > 8 m), the marker runs from 0 to λ, two upward zero crossings.
  Tie-break: at λ = 8 m the second crest is exactly on the 10 m edge and counts (tested). The dots are left out when
  crests are less than about 1.2 rem apart (50 cm on a phone); the marker stays.
- **The caption gives the numbers**: λ, f = c / λ with the division written out, the 300 / λ value, and how many
  wavelengths the 10 m hold.
- **Colour**: wave `--c1` thick line, crests `--c2` round dots, marker `--c3` arrowed line with its own text label,
  so grayscale keeps the three apart.
- **Attribution in the footer bar** (task step 2: "page footer"), as in `sims/quantisation`; on a phone the bar is
  static, or the credit would cover a third of the screen.

## Deviations from the original (and why)

- **The slider was labelled "Perioda" / "Periode" (period) but set the wavelength**; the y axis said % of an
  amplitude the page never explains. Now the slider is "Valna duljina λ" / "Wavelength λ", and the y axis has no
  numbers (the amplitude is not part of the concept).
- **The plot updated only on `change`** (on release of the slider); the kit redraws on every input.
- **λ was shown unrounded** (`lambda + "m"`, e.g. "0.69m") and f with two decimals in a different style; now both
  with two decimals and the page's decimal separator.
- **f is computed from whole centimetres** (c · 100 / cm), so no λ = cm / 100 rounding enters it. Tested: f · λ = c.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material). The section's
  reverse example ("300 / 2.06 ≈ 145.3 MHz", in fact 145.6 MHz) is left out; only the forward one is kept.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/wellenlaenge.md` and the 50ohm-contents-hr
`TRANSLATION_GLOSSARY.md`). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| wavelength | valna duljina |
| frequency | frekvencija |
| crest (of a wave) / trough | brijeg vala / dolina vala |
| frequency band, band | frekvencijski pojas, pojas |
| speed of light | brzina svjetlosti |

## Shared requests

None.

## Checks

- `node --test sims/lambda-f/sim.test.js`: 12 tests; each rule broken once (crest at the edge not counted, marker
  always 0 … λ, crests at λ/2, c = 300, rule = c, no clamp, no rounding, f = c · λ, cosine phase) makes at least one
  fail.
- `npm run gate -- lambda-f`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus presets 10 m, 50 cm
  (desktop and phone) and λ = 8.01 m unbuilt from `file://`, no console errors or warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 9 minutes by the machine clock (2026-10-03 01:20–01:29 CEST), one session.
