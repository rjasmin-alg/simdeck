<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ring-modulator: notes

Adopted from `50ohm-contents-hr/contents/html/applet_ringmodulator.html` (file last changed in `8f2329a`, repo at
`5745d5e`; task `docs/tasks/w1/ring-modulator.md`, catalogue `50ohm-ring-modulator`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_ringmodulator.html` (repo at `48e18bf`); its script is identical, only the
visible text differs. The simdeck copy is canonical from here on. The first commit on the branch holds the original
as-is, so `git log -p` shows the change.

**What the original is:** an intro paragraph, three buttons ("no action", "case 1: U₂ > 0, U₃ = U₁", "case 2:
U₂ < 0, U₃ = −U₁") and an `<img>` that swaps between three figures, `/pictures/1122.svg` … `1124.svg`, with the case's
formula below it. The figures are not in 50ohm-contents-hr; they are `50ohm-contents-dl/contents/drawings/1122` …
`1124` (`.tex` sources, `.svg` renders, `.txt` alt texts in German): the circuit (T1, four diodes in a ring, T2, the
oscillator U₂ between the centre taps), the node voltages and conducting diodes of each case, and three plots (U₂ a
square wave, U₁ a sine, U₃ = U₁ switched in polarity).

**Where the applet sits in 50ohm:** `sections/mischer_2.md` (German repo) includes it in the in-depth box on how a
ring mixer works, after the paragraphs on the oscillator switching two opposite diodes per half period and the ring
acting as a polarity switch. The Croatian repo has the applet but does not yet include it in a section (its
`TRANSLATION_TRACKER.md` says so). The explanation comes from that box and the tip after it (diode ring vs bridge
rectifier), without exam questions AF212–AF214.

## Attribution and licence (CC BY 4.0)

- Source: the applet, figures 1122–1124 and the text of `sections/mischer_2.md`, **50ohm.de-Autorenteam,
  AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both
  50ohm repos). Croatian applet text by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: Prof. Dr. Matthias Jung, DL9MJ` / `% Year: 2026`, in their `.tex`
  sources, but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam listed in the 50ohm-contents-hr
  `README.md`, and 823 of the 911 drawings in the German repo carry such a line: it is how the team signs its figures,
  under the repos' CC BY 4.0. Read as team material, as `sims/lambda-f`, `sims/quantisation` and
  `sims/sine-amplitude-period` did with DL9MJ's script line; the credit names DL9MJ for the figures. *(check)* if the
  owner reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as one SVG, translated into English, the three buttons
  turned into 12 steps, diode names, coloured paths, readout, sliders and presets added (below). Stated on the page and
  in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The applet loads none (three buttons and an `<img>` swap); the page needs none either.
  The figures' SVGs were not copied: they are TeX renders with glyph-outline text that would scale far below 16 px.

## Decisions

- **Class `stepper`**, 12 steps (playbook §10.4). The original's three states are "no action" and the two switching
  states; real use alternates between the two at the oscillator's rate. So step 0 is "no action" and each further step
  is one half period of U₂: odd steps case 1, even steps case 2. A clicker walks through the alternation while U₃ builds
  up on the plot, which is the point the original makes in its third plot. Space plays it; reduced motion needs nothing
  extra (no animation).
- **Model as the original states it**: ideal diodes (no threshold), 1:1 transformers, U₂ a square wave of ±1 V. Node
  voltages for U₂ = s · 1 V: N = s + U₁/2, S = s − U₁/2 (T1's upper and lower end), T2's centre tap 0 V; the T1 end that
  reaches T2's lower end A2 gives U₃ = A2 − A1 = s · U₁. Both formulas of the original come out of this (tested).
- **Time**: each step is read in the middle of its half period, t = n − ½ (so U₁ is never exactly at a zero crossing
  and the case is never ambiguous). U₁ = Û₁ · sin(π t / r) with r = f₂ / f₁. Default r = 6: one period of U₁ fills the
  12 half periods. The figures use f₂ = 10 · f₁ over 1¼ periods; that needs 25 half periods, over the 20-step limit.
- **Sliders added**: Û₁ from 0 to 1 V in 0.1 V (the original fixes neither; its figures draw U₁ at 0.9 of U₂), and
  f₂ / f₁ from 2 to 6. Û₁ stops at 1 V, as large as U₂, so the two-state model stays valid (|U₁| / 2 < U₂); the hint says
  U₁ must stay well below U₂, as the 50ohm text does.
- **Diode names D1–D4** (the original has none): D1 from N to E, D2 from E to S, D3 from S to W, D4 from W to N, named
  anode to cathode around the ring. Case 1 uses D1 and D3, case 2 D2 and D4, as in figures 1123 and 1124 ("upper right
  and lower left" / "upper left and lower right").
- **Colour**: the path from T1's upper end `--c1` solid and thick, the path from its lower end `--c3` dashed and thick;
  conducting diodes filled in their path's colour, blocked diodes grey, dashed and crossed out; node voltages in their
  path's colour. The crossing of the two paths between case 1 and case 2 is the polarity switch. Waves: U₂ `--c6`, U₁
  `--c5`, U₃ `--c2`, each with its name at the axis; U₁ dotted behind U₃. The current half period is a `--hl` band with
  a dashed outline and its number. Colour is never the only carrier (grayscale screenshot checked).
- **Tie-breaks**: Û₁ = 0 gives U₃ = +0 in both cases while the diodes still switch, and the caption says U₂ does not
  reach the output; a switching instant belongs to the half period it starts (U₂ = +1 V on [0, 1)); U₁ is exactly 0 at
  multiples of r; shown voltages round half away from zero to hundredths after cutting float noise, and never show −0;
  slider input clamps, snaps half a step up even where float noise puts the half step just below (0.35 → 0.4), a non-number gives the default.
- **Node voltage labels** show only where they fit next to the wires (circuit scale ≥ 3.5 rem per unit: the projector
  layout, not the phone); the readout box under the circuit always shows the case's formula and the numbers.
- **No answer keys**: the 50ohm section carries exam questions AF212–AF214; none is on the page or in a preset.

## Deviations from the original (and why)

- The three figures became one SVG drawn at 1:1, so its labels keep the 16 px floor; the waveforms are drawn from the
  model instead of fixed pictures.
- Three buttons became 12 steps (above); the formulas became the readout box; the intro paragraph's assumptions moved
  into the step-0 caption and the explanation.
- f₂ / f₁ = 6 by default instead of the figures' 10 (step limit, above); sliders, presets and diode names added.
- The original's stray `\]` after the second formula is gone.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from the applet, the 50ohm-contents-hr
`TRANSLATION_GLOSSARY.md` and its slides `mischer_2.md`, `modulatoren.md`). For the coordinator to add with
`"src": "simdeck"`:

| en | hr |
|---|---|
| ring modulator | prstenasti modulator |
| ring mixer | prstenasti mješač |
| balanced mixer | balansni mješač |
| mixer | mješač |
| local oscillator | lokalni oscilator |
| centre tap | srednji izvod |
| mixing product | produkt miješanja |
| switching state | sklopno stanje |
| bridge rectifier | mosni ispravljač |

## Shared requests

None. (`roundV` and `snap` repeat the iq sims' helpers with hundredths instead of percent; nothing worth a shared
model.)

## Checks

- `node --test sims/ring-modulator/sim.test.js`: 20 tests. Each rule broken once on a copy (case 2 using D1/D3, U₃ not
  negated in case 2, A2 and A1 swapped, `u2Sign` with `Math.ceil`, plain `Math.round` in `roundV`, `snap` without either
  noise cut, `u1At` without the exact zero, Û₁ = 0 giving −0) makes 1 to 4 tests fail. The half-step test passed
  against plain `Math.round` at first (0.25 / 0.1 is exactly 2.5); 0.35 now catches it.
- `npm run gate -- ring-modulator`: pass (manifest, tests, build, browser 62/62, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus unbuilt from `file://`
  step 1 (case 1), step 4 in English (case 2), preset Û₁ = 0 at step 12, preset Û₁ = 1 V at step 7, phone at step 4,
  no console errors or warnings. Fixed from them: the node voltage labels did not fit at first (ring widened, circuit
  column wider), the "1 V" scale label sat in the band at step 1, U₃'s bold part ran down the next edge, and the diode
  labels sat on the diodes on the phone (now along each diode's normal; on the phone D3 and D4 still touch a wire,
  readable through their halo).
- Not checked: a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 16 minutes by the machine clock (2026-10-03 10:44–11:00 CEST), one session.
