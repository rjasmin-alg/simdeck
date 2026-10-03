<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ripple: notes

Adopted from `50ohm-contents-hr/contents/html/applet_brumm.html` (file last changed in `57ef515`, repo at `5745d5e`;
task `docs/tasks/w1/ripple.md`, catalogue `50ohm-ripple`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_brumm.html` (repo at `48e18bf`, file last changed in `8fa5795`); the two differ
only in the language of the text. The simdeck copy is canonical from here on. The first commit on the branch holds
the original as-is, so `git log -p` shows the change.

## What the original is

Three buttons: "Reproduciraj 50 Hz", "Reproduciraj 100 Hz", "Zaustavi", and a status line. Each play button builds a
1 s Web Audio buffer of a fixed "ripple" shape (a smoothstep rise over 36 % of the period, a linear fall over the
rest), removes its mean, normalises it to ±1 and loops it at gain 0.2 with a 30 ms fade in and out. Its own comment
calls the shape "not an exact power-supply simulation, but an audible approximation of the ripple in the figure".
No picture, no plot. It sits in the section `restwelligkeit` (`contents/sections/restwelligkeit.md`), whose text
(ripple of the voltage on R_L, 100 Hz because the negative half-wave is turned up, an amplifier and speaker would hum,
an oscilloscope with AC coupling shows it) is the source of the captions and the explanation.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `sections/restwelligkeit.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC
  e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). The
  term "kondenzator za punjenje" is from `sections/gleichrichter_2.md`.
- **The applet has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **Changed**: adapted to the simdeck kit, translated into English (from the German original), extended with a
  rectifier model (half-wave / full-wave, reservoir capacitor), a plot of the voltage, AC coupling, presets and an
  explanation; the sound is now computed from the plotted voltage instead of a fixed shape. Stated on the page and in
  `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original is an HTML fragment that loads nothing; it uses only Bootstrap
  classes and MathJax from its host page, neither needed here.

## Decisions

- **Class `explorer`** (playbook §10.4): two choices and a slider, nothing to step through. Six presets are the
  3–5 minute demo: half-wave and full-wave without C (50 Hz vs 100 Hz: the concept), the same two with C (τ = 40 ms;
  these are the original's two buttons, "play 50 Hz" and "play 100 Hz"), a larger capacitor (τ = 160 ms: smaller
  ripple, same frequency, quieter hum), and the AC-coupled view (the section's oscilloscope paragraph).
- **The sound comes from the drawn voltage**, not from the original's fixed curve: one period of the AC part of the
  output (mean removed, as the original did), looped for 1 s of whole periods, 30 ms fades as the original. It is
  **not normalised**: the gain is fixed (0.3 × at most ±0.68 Û, so the loudest case peaks near the original's 0.2), so a
  smaller ripple is a quieter hum. That is the one thing a lecturer can hear change with C. The shape with C is the
  original's "fast rise, slow fall". The P button (also the key P) starts and stops it; changing the rectifier or τ
  while it plays changes the hum; it stops when the page is hidden. The readout says whether it plays (the
  original's status line).
- **Model** (`sim.js`, closed form, ideal diodes and source, as the 50ohm text): mains sin(ωt) in units of Û;
  rectified max(u, 0) or |u|; with τ = R_L·C_L the diode stops conducting at θ_off = π − atan(ωτ) (where the sine
  falls faster than C discharges) and the output decays as e^(−t/τ) until the next half-wave reaches it. Checked in
  the tests against a step-by-step ideal diode with RC discharge (within 2e-3). Results: without C the DC part is 1/π
  (32 %) half-wave and 2/π (64 %) full-wave, ripple 100 %; full-wave τ = 40 ms: 18 % ripple, half-wave 35 %; for a large
  τ the ripple tends to T/τ (the textbook ΔU ≈ I·T/C), from below.
- **Tie-breaks**: at θ_off exactly the diode still conducts (the sine's value, continuous both sides); τ = 0 is no
  capacitor, any τ > 0 is one; a negative time is the same point of the steady state; τ clamps to 0 … 200 ms and snaps
  to 10 (half step up), a non-number is the default; an unknown rectifier is the default (no case folding); `ac` is
  true only for true, "true", 1, "1". A rounded −0 in the traces is stored as 0 (JSON would change it).
- **Plot**: 0 … 60 ms (three mains periods): the mains (dashed), the rectified wave without C (dotted), the output
  (thick solid), its DC part (dash-dot) and, with C, the ripple band shaded. A bracket above the frame marks one
  ripple period T (10 or 20 ms), one below marks one mains period (20 ms): the doubling is visible as two brackets.
  AC coupling shows only the output minus its mean, scaled to fill the frame (as one turns up a scope's gain).
- **Colour**: output `--c1` thick solid, rectified `--c2` dotted, mains `--c3` dashed, DC part `--c4` dash-dot; each
  curve has its own dash pattern and a label on the plot or in the legend. Grayscale screenshot checked.
- **Tags**: `circuits` (task file; in `tags.json`, but its label reads "digital circuits", which fits an analogue
  power supply poorly, as `rectifier-1` and `rectifier-2` reported). Topic `radio`, level `core`. `related`:
  `rectifier-1`, `rectifier-2` (the circuits whose output this is). They could list `ripple` back; that is their
  folders, not mine.
- **No answer keys**: the section's exam questions (AD309, AD310) are not on the page, nor any calculation of a
  ripple's amplitude from given values. The page shows percentages of Û from its own model, not a question's numbers.

## Deviations from the task and from the original (and why)

- The fixed ripple curve is replaced by the circuit model, so the plot and the sound agree and C changes both.
- The sound's loudness follows the ripple (the original normalised every tone to the same level).
- Added: the plot, the capacitor, AC coupling, presets, readout and explanation; the 50 Hz case is labelled
  half-wave (the section only names 100 Hz full-wave; 50 Hz is the original's other button).
- The MathJax `\qty{50}{\hertz}` became plain text.

## Kit note (no request, worked around locally)

`t.parts` pushes the same node for each occurrence of a placeholder, so a node used twice (`{c}` … `{c}`) moved to its
second place and the first went empty. The page clones repeats (`parts()` in `index.html`). If the coordinator
wants it in the kit: clone a node that is already in the output (an additive fix, no old result changes).

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-contents-hr text. For the coordinator
to add with `"src": "simdeck"` (some are already listed by `rectifier-1`/`rectifier-2`):

| en | hr |
|---|---|
| ripple | preostala valovitost, valovitost |
| (mains) hum | brujanje |
| half-wave rectification | poluvalno ispravljanje |
| full-wave rectification | punovalno ispravljanje |
| reservoir capacitor | kondenzator za punjenje |
| smoothing | izglađivanje |
| load resistor | otpor opterećenja |
| peak voltage | vršni napon |
| DC part / AC part | istosmjerni dio / izmjenični dio |
| AC coupling | AC-vezanje |
| pulsating DC voltage | pulsirajući istosmjerni napon |

## Shared requests

None. No shared model used or offered.

## Checks

- `node --test sims/ripple/sim.test.js`: 20 tests. Thirteen mutants (τ floored, ripple frequency always 50 Hz,
  half-wave as |u|, θ_off at π/2, the switch-off moved by 0.01 rad, no decay before θ_off, one period for both, the
  hum's mean kept, `ac` as `!!`, rect case-folded, τ ≤ 5 as no C, −0 kept, a negative time's modulo) each make 1–6
  tests fail. Three survived the first round and got their own tests.
- `npm run gate -- ripple`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` every preset in hr and en at 1920×1080 and 375×812 (one in dark), and the hum playing (key P); no console
  errors or warnings. Fixed from them: the panel 8 px too tall (labels and hints shortened), C_L and Û missing at
  their first mention in the caption (the node reuse above), the phone's mains label on the time axis, the DC label
  on the curve.
- Not checked: hearing the hum (headless browser: the audio graph runs, nothing listens) *(check: on the lecture
  room's speakers; 50 Hz is weak on small speakers, which the explanation says)*; Firefox and Safari; a real
  projector; the Croatian wording of the added text with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 16:33–16:48 CEST), one session.
