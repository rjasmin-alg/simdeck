<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sine-amplitude-period: notes

Adopted from `50ohm-contents-hr/contents/html/applet_sinus_amplitude_und_periode.html` (file last changed in
`57ef515`, repo at `5745d5e`; task `docs/tasks/w1/sine-amplitude-period.md`, catalogue `50ohm-sine`, §2.5). German
original: `50ohm-contents-dl/contents/html/applet_sinus_amplitude_und_periode.html` @ `48e18bf`; its script is the
same as the Croatian one except the intro sentence, the two slider labels, "und"/"i" and the x-axis title. The
simdeck copy is canonical from here on. The first commit on the branch holds the original as-is, so `git log -p`
shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/amplitude_periode.md` (the amplitude, half-wave and period
  definitions, the oscilloscope tip, "1 period = 1 oscillation, 1 per second = 1 Hz"), **50ohm.de-Autorenteam,
  AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both
  50ohm repos). Croatian translation by the 50ohm-contents-hr team.
- **The script carries an author line, `// Script by DL9MJ, 2024`, but no licence of its own.** DL9MJ is a member of
  the 50ohm.de-Autorenteam (50ohm-contents-hr `README.md`), so the applet is team material under the repos' CC BY 4.0
  and the task went ahead, as `sims/lambda-f` and `sims/quantisation` did with the same line. The credit names DL9MJ
  as well. *(check)* if the owner reads task step 2 more strictly.
- **Changed**: adapted to the simdeck kit, drawn without libraries, translated into English, amplitude, period and
  half-waves marked, presets added (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The original loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de (and the KaTeX CSS of
  the host page for `$a$`, `$T$`, `$f$`). The kit page draws the plot as SVG at 1:1, as `lambda-f` and `nyquist` do:
  Chart.js draws canvas text below the 16 px floor and takes colour literals, and jQuery only bound two events. The
  symbols are plain text.

## Decisions

- **Class `explorer`** (playbook §10.4): two sliders, nothing to step through. The 3–5 minute demo is the seven presets
  (keys 1–7): T = 1 → 2 → 4 → 8 s at a = 50 % (the period doubles, the frequency halves), then a = 100, 25 and 0 % at
  T = 4 s (the height changes, the period does not).
- **Sliders as the original**: a from 0 to 100 % in 1 % steps, T from 1 to 10 s in 1 s steps; defaults a = 50 %,
  T = 1 s (the original's start, preset 1). The window is the original's 0 … 24 s.
- **Marked on the plot**: the first period as a dimension line "T = …" above the plot (0 to T, two upward zero
  crossings); the amplitude as a dot on the first crest (t = T/4), a dotted level line from it to the right edge that
  every crest touches, and an arrowed line "a = …" from the zero line up to it in the right margin (on a phone the
  label sits in the top right corner); the two half-waves of the first period shaded and signed + and −. These are
  the three figures of the 50ohm section (726–728) drawn into the applet.
- **Tie-break a = 0**: a flat line; no crest, half-wave or period is marked, and the caption says the period is set
  but cannot be seen (preset 7).
- **Tie-break on the input**: a non-number gives the default; a fraction rounds to the nearest whole number, a half up
  (as the kit snaps a URL value to the slider grid); values clamp to the sliders.
- **The caption gives the numbers**: a, T, f = 1/T and the number of periods in 24 s; at T = 1 s it says "one
  oscillation per second, exactly 1 Hz" (the section's point).
- **Colour**: wave `--c1` thick line; amplitude `--c2` with a round dot and dotted guide; period `--c3` arrowed
  dimension line with dashed extension lines; half-waves `--c4` fill at two strengths with + and − labels. Each also
  differs by shape or label, so the grayscale screenshot keeps them apart.
- **No answer keys**: the section asks NB404 (what is marked 1: amplitude), NB405 (marked 2: period) and NA213
  (145 000 000 periods per second). The page labels amplitude and period, which is the concept itself, and gives no
  preset or example near 145 MHz. The example in the explanation is 4 s → 0.25 Hz.

## Deviations from the original (and why)

- **Redraw on every input**, not only on `change` (release of the slider).
- **f was shown with two decimals** (`(1/p).toFixed(2)`, so 0.13 Hz at T = 8 s); now up to three, trailing zeros
  dropped (0.125 Hz, 0.333 Hz), with the page's decimal separator.
- **y axis −100 … 100 % with a little headroom** (±112 %), so a crest at 100 % does not sit on the frame.
- **Units in the caption and markers** use a space ("1 s", "50 %"), not "1s", "50%".
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm section
  without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/amplitude_periode.md`). For the
coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| amplitude | amplituda |
| period (period duration) | perioda (vrijeme periode) |
| frequency | frekvencija |
| oscillation | titraj |
| sine wave | sinusni titraj |
| half-wave (positive / negative) | poluval (pozitivni / negativni) |
| oscilloscope | osciloskop |
| oscillogram | oscilogram |
| full scale (of a screen) | puni otklon *(check)* |

## Shared requests

None.

## Checks

- `node --test sims/sine-amplitude-period/sim.test.js`: 13 tests; each rule broken once (flat tie-break off,
  truncating instead of rounding, a non-number to the minimum, cosine phase, crest at T/2, f = T, periods = 24 · T,
  half-wave signs swapped, no clamp, period 2T) makes at least one fail.
- `npm run gate -- sine-amplitude-period`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus a = 100 %/T = 4 s,
  a = 25 %/T = 10 s, a = 0, a = 3 %/T = 1 s at 1920×1080 and 375×812 unbuilt from `file://`, no console errors or
  warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 8 minutes by the machine clock (2026-10-03 10:01–10:09 CEST), one session.
