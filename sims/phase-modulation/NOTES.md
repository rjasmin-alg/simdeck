<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# phase-modulation: notes

Adopted from `50ohm-contents-hr/contents/html/applet_pm.html` (file last changed in `57ef515`, repo at `5745d5e`;
task `docs/tasks/w1/phase-modulation.md`, catalogue `50ohm-pm`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_pm.html` (added in `73d0fc5`); its script is identical to the Croatian one,
only the four row titles, the select label and three option names differ. The simdeck copy is canonical from here
on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/pm.md` (PM changes the phase in proportion to the signal,
  the amplitude stays; sliding the sine along the time axis; FM and PM as angle modulation; the square-wave contrast;
  s(t) = A cos(2π f_c t + φ(t)) and f_i = (1/2π) dφ/dt), **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**,
  licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  translation by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so it is team material under
  the repos' CC BY 4.0 and the task went ahead.
- **Changed**: adapted to the simdeck kit, drawn as SVG, translated into English, a Δφ slider, phase-jump marks and
  presets added (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The original loads none (plain canvas, Bootstrap classes from the host page).

## Decisions

- **Class `explorer`** (playbook §10.4): a shape and a slider, nothing to step through. The 3–5 minute demo is the six
  presets (keys 1–6): sine at 90° (the start), square at 90° (phase reversal: every edge jumps 180°), sawtooth (the
  phase slides, then jumps at the drop), ramp at 180° (a steadily rising phase = 9 periods instead of 8, a higher
  frequency), no modulation, and square at 180° (each edge is a whole turn, so PM looks like the carrier).
- **One concept, with FM kept beside it.** The original shows FM and PM together and the 50ohm section explains PM
  by contrast with FM; the page keeps both rows. FM is the comparison, not a second concept (a separate FM sim would
  be its own task).
- **New slider Δφ (0 … 180° in steps of 15°, default 90°).** The original had a fixed strength `DEPTH = 1.5` used
  for both waves (PM: 1.5 rad; FM: ±1.5 carrier periods per window). The page keeps that coupling — k = Δφ in
  radians sets both — and starts at 90° (k = 1.571, ≈ the original's 1.5) because 90° makes a square give exactly
  phase reversal, the section's figure 907 ("fazna modulacija s obrtanjem faze"). The section's "the larger the
  signal, the further the phase shifts" is now something to try.
- **Kept from the original**: carrier 8 periods per window, signal 1.2 periods, the four shapes in the same order,
  1200 samples, the carrier's upward zero crossings as dots and as reference lines through the FM and PM rows (the
  original drew those lines fully transparent; here they are visible dotted lines so a PM wave that leads or lags
  can be seen).
- **FM phase computed exactly** (closed-form integral of each shape) instead of the original's running sum, which
  started one sample late.
- **Marked on the PM row**: each edge of the square or sawtooth as a dashed line through the signal and PM rows, with
  a tag giving the phase jump Δφ · (after − before), folded into (−180°, 180°].
- **Tie-breaks**: at an edge the signal already has its new value, so the square starts at +1 (the original's
  `Math.sign(sin 0)` gave 0 for the first sample); Δφ = 0 → no modulation, no edges marked; a jump that folds to 0°
  (square at 180°) is still marked "Δφ 0°" and the caption says it is a whole turn and cannot be seen; Δφ input
  clamps to 0 … 180°, snaps to 15° (half step up), a non-number gives the default; an unknown shape gives the sine.
- **Colour**: signal `--c1` thick, carrier `--c8`, FM `--c3`, PM `--c2` thicker, edges `--c5` dashed with a framed
  tag. Every row has its own text title, so colour is never the only carrier (grayscale screenshot checked).
- **No answer keys**: the section ends with exam question AE313; it is not on the page or in a preset.

## Deviations from the original (and why)

- Bootstrap/canvas layout replaced by the kit; rows are SVG drawn at 1:1 so the tags keep the 16 px floor.
- Shape is a segmented button group (kit `choice`, 4 options) instead of a drop-down.
- The Δφ slider (above) is new; the original had no strength control.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm section
  without its exam question.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/pm.md` and the applet). For the
coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| phase modulation (PM) | fazna modulacija |
| frequency modulation (FM) | frekventna modulacija |
| angle modulation | kutna modulacija |
| carrier | nositelj (nositeljni signal, nositeljni val) |
| modulating signal | modulacijski signal |
| phase | faza |
| phase shift | pomak faze (fazni pomak) |
| phase jump | skok faze |
| phase reversal | obrtanje faze |
| square wave / sawtooth | pravokutni / pilasti signal |

## Shared requests

None.

## Checks

- `node --test sims/phase-modulation/sim.test.js`: 16 tests. Each rule broken once by hand (square starting at 0, no
  fold, FM using m instead of ∫m, PM using ∫m, an edge past the window, the ramp's extra periods ignored, Δφ not
  snapped, Δφ = 0 not flagged, edges marked at Δφ = 0, the whole-turn check wrong) makes 1 to 4 tests fail.
- `npm run gate -- phase-modulation`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus presets 3, 4 and 6 at
  1920×1080 unbuilt from `file://`, no console errors or warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 9 minutes by the machine clock (2026-10-03 10:11–10:20 CEST), one session.
