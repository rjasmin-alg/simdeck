<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fading: notes

Adopted from `50ohm-contents-hr/contents/html/fading_applet.html` (file last changed in `57ef515`, repo at `5745d5e`;
task `docs/tasks/w1/fading.md`, catalogue `50ohm-fading`, §2.5). German original:
`50ohm-contents-dl/contents/html/fading_applet.html` (repo at `48e18bf`, file last changed in `5c68bdc`); the two differ
only in their seven visible strings. The host text is `contents/sections/fading.md` (the applet sits in its in-depth
box) and `contents/slides/fading.md`. The simdeck copy is canonical from here on. The first commit on the branch holds
the original as-is, so `git log -p` shows the change.

## What the original is

Two sliders, "Amplituda" (0 … 100 %, default 80 %) and "Faza" (0 … 360°, default 180°), and two Chart.js line
charts over −π … 4π (2.5 periods) at ±200 %: "Prostorni val" (sky wave) `100·sin x` with "Prizemni val" (ground wave)
`amplitude·sin(x + φ)`, and below them "Zbrojni signal" (their sum). It loads jQuery 3.7.1 and Chart.js 4.4.1 from
50ohm.de. It is the same applet as `applet_interferenz.html` (`sims/multipath-interference`) with the amplitude
slider wired up and the curves named sky and ground wave.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/fading.md` and `contents/slides/fading.md`,
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  (`LICENSE` of both 50ohm repos). Croatian translation by the 50ohm-contents-hr team. The terms "prizemni val" and
  "prostorni val" are also in `sections/bodenwelle.md`.
- **The applet has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **Changed**: adapted to the simdeck kit and drawn as SVG, translated into English, the signal strength over the
  last minute, a moving ionosphere (D), the fade's range and depth, presets and an explanation added. Stated on the
  page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3). The original loaded jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de. The kit
  page draws the plots as SVG at 1:1 (as `sims/multipath-interference`, `sims/iq-signals`), so neither is used:
  Chart.js draws canvas text below the 16 px floor and takes colour literals, and jQuery only bound two events.

## Decisions

- **One concept, distinct from `multipath-interference`.** The original applet is a static sum of two waves, which
  `multipath-interference` already shows. What the fading section adds is time: the ionosphere moves, the phase
  difference keeps changing, so the field strength keeps swinging (QSB). The page keeps the original's two plots and
  adds a third, the sum's strength over the last 60 s, plus a button that lets the phase drift. Still one concept
  (fading of ground wave + sky wave); multipath of the sky wave alone is the other sim's.
- **Class `explorer`** (playbook §10.4): two sliders and a drift button, nothing to step through. Six presets
  (keys 1–6) are the demo: the original's start (80 %, 180°, the bottom of a 19.1 dB fade), in phase (100 %, 0°,
  strongest), halfway into a fade (100 %, 90°), complete dropout (100 %, 180°), a weak ground wave (30 %, 180°,
  a shallow 5.4 dB fade) and the sky wave only (0 %, no fading of this kind). Then D shows the fading live.
- **Defaults and roles as the original**: the sky wave is the reference (100 %), the ground wave has the amplitude
  slider and the +φ shift (`a·sin(ωt + φ)`). The slider reads "strength of the ground wave", which matches the
  physics: the ground wave weakens with distance, and fading is deepest where it is as strong as the sky wave.
- **The drift** (key D, button "Move the ionosphere" / "Stop the ionosphere"): φ grows by 18 °/s (one fade every
  20 s), wrapping at 360°. It is page state, not model state: a link or reload opens still, as the kit's links open
  paused. It stops when the page is hidden. Under reduced motion it moves in 1 s jumps (18°) instead of 10 updates a
  second. Moving the phase slider while it drifts carries on from there. The explanation says real QSB is irregular;
  the even rate is a model choice.
- **Model** (`sim.js`): A = √((1 − a)² + 2a(1 + cos φ)) (exactly 0 at a = 1, φ = 180°); the strength swings between
  |1 − a| and 1 + a; fade depth 20·log10((1 + a)/(1 − a)) dB to 0.1 dB, null (∞) at a = 1. The strength plot is
  A(φ + 18·t) for t = −60 … 0 s, ending at the current value (dot).
- **Tie-breaks** (tested, in order): a = 0 is `steady` whatever φ; φ ≡ 0° (mod 360) is `peak`; φ ≡ 180° is `trough`,
  or `dropout` when a = 1; otherwise `fading` for 0° < φ < 180° and `rising` for 180° < φ < 360° (d(A²)/dφ = −2a sin φ,
  with the drift's direction). φ and a are whole numbers, so the ties are exact. Only an exact 0 for the weakest
  value gives an infinite depth.
- **Captions**: four forms (normal, infinite depth at 100 %, dropout, steady), each naming the current sum, the trend
  and the range.
- **Colour**: sky wave `--c1` solid, ground wave `--c2` dashed (drawn on top, so it shows when the two coincide), sum
  `--c3` thick in its own plot, strength `--c4` with a shaded area in its own plot; the swing band's edges are dashed
  grey lines, named in the title row. Grayscale checked.
- **Tags**: `propagation` (task file; in `tags.json`). Topic `radio`, level `core`. `related`:
  `multipath-interference` (it could list `fading` back; that is its folder, not mine).
- **No answer keys**: the section's exam questions (EH202, EH203) are not on the page.

## Deviations from the task and from the original (and why)

- Added: the strength-over-time plot, the drift, the range and depth, presets, the explanation (above).
- Labels: "Amplituda" → "strength of the ground wave", "Faza" → "phase difference φ"; the time axis "Vrijeme"
  stays as "vrijeme →"; the y ticks stay in % of the sky wave. The waves plot is ±120 % (both waves ≤ 100 %) instead
  of the original's ±200 %; the sum keeps ±200 %.
- The slides' first point (sky wave arriving within the ground wave's range) is in the explanation and the
  ground-wave hint; the section's "schwund" is left out of the Croatian text (a German word).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/fading.md` and `sections/bodenwelle.md`).
For the coordinator to add with `"src": "simdeck"` (some already listed by `multipath-interference`):

| en | hr |
|---|---|
| fading | feding |
| ground wave | prizemni val |
| sky wave | prostorni val |
| interference | interferencija |
| phase difference | fazna razlika |
| field strength | jakost polja |

The 50ohm-hr text writes *fading* in italics as the term; the page uses "feding" in running Croatian text and
*fading* (feding) at first mention in the explanation *(check: which spelling the HAM course prefers)*.

## Shared requests

None. No shared model used or offered. (The sum-amplitude formula is the same as `multipath-interference`'s
`sumAmplitude`; if the coordinator promotes it to `models/`, both sims could use it.)

## Checks

- `node --test sims/fading/sim.test.js`: 17 tests. Fourteen mutants (no steady tie-break, no peak tie-break, no
  dropout, fading/rising swapped, no negative-phase wrap, infinity threshold 1e-3, depth floored, ground wave −φ,
  drift 20 °/s, history drifting backwards, drift without wrap, amp clamped to 99, `m <= 180`, `min = 1 − a`): all but
  the last two make 1–6 tests fail; those two are equivalent (unreachable: 180° is caught by the trough tie-break
  first, and a never exceeds 1). The 1e-3 mutant survived the first round and got its own assertion.
- `npm run gate -- fading`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` presets 1, 3, 5, 6 and the drift running, in hr and en; reduced motion (drift in jumps); no console
  errors or warnings. Fixed from them: the dashed ground wave hidden under the sky wave at 0°, the band's labels
  sitting on the strength curve (moved to the title row), a missing-string warning for the steady and dropout cases.
- Not checked: Firefox and Safari; a real projector; the Croatian wording of the added text with the HRS translation
  team *(check)*.

## Time

Start to done: about 12 minutes by the machine clock (2026-10-03 16:48–17:00 CEST), one session.
