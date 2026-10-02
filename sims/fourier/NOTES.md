<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fourier: notes

Adopted from `50ohm-contents-hr/contents/html/fourier.html` (file last changed in `57ef515`, repo at `5745d5e`;
task `docs/tasks/w1/fourier.md`, catalogue `50ohm-fourier`, §2.5). German original:
`50ohm-contents-dl/contents/html/fourier.html` (file last changed in `e56d0dc`, repo at `48e18bf`); its script is
the same as the Croatian one except the labels. The simdeck copy is canonical from here on. The first commit on the
branch holds the original as-is, so `git log -p` shows the change.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/fourier_transformation.md` (the explanation: time and
  frequency domain, the square, sawtooth and triangle spectra, the low-pass filter before the antenna),
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation
  by the 50ohm-contents-hr team.
- The applet carries **no author or licence of its own** (checked: no notice, credit line or comment in either
  copy). So the repo licence covers it and the task could go ahead.
- **Changed**: adapted to the simdeck kit, redrawn without three.js, translated into English, presets added and
  the spectrum changed (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC
  endorses simdeck or the Croatian translation.
- **No libraries vendored.** The original loaded three.js from `50ohm.de/assets/three/three.js` (task step 3). Its
  scene is only lines and two translucent planes, so the page draws it as SVG with a ~40-line perspective
  projection in `sim.js` (`camera`, `project`, tested). That keeps every label as kit-sized text from `strings.js`
  (WebGL has no text; the original had no labels in the scene), keeps colours to kit tokens, avoids a ~1 MB inline
  library and a WebGL context in the gate's headless browser.

## Decisions

- **Class `explorer`** (playbook §10.4): sliders, no sequence. The 3–5 minute demo is the eight presets (keys 1–8)
  and the three views: sine → square → 30 frequencies (steeper edge, overshoot stays) → other phases (same
  spectrum, other signal) → sawtooth → triangle → all equal → empty (build one by hand).
- **The original's model kept**: up to 30 harmonics at 1 … 30 Hz over one period of 1 s, amplitude 0 … 1 and phase
  per harmonic, component a · sin(2π n t − φ); default 9 harmonics; its presets Minimum (now "Empty"), Maximum
  ("All equal") and square (odd n at 1/n, no 4/π factor).
- **The original's 3D layout and views kept**: the harmonics side by side along the frequency axis, harmonic 1 at
  the front; the sum on a plane in front (time domain), the spectrum on a plane at the side (frequency domain);
  views 3D, time and frequency from the original's camera presets (theta 90/20/160, phi 48, in its half degrees:
  yaw 45°/10°/80°, pitch 24°), distance 3, field of view 25°; drag to turn (0.4°/px, pitch −25° … 60°). The camera
  orbits the scene centre (the original orbited the origin and looked at a point beside it). The drawing is fitted
  to the stage at every angle. Painter's order: lanes and planes sorted by depth, labels on top with a halo.
- **The camera is the page's, not a kit param.** Kit presets apply on top of the defaults, so a camera param would
  jump back to 3D on every preset and R; a lecturer who chose the time view keeps it. It is kept in
  `sessionStorage` (try/catch, a convenience), so `L` (which reloads) keeps it too. It is not in the URL.
- **Controls**: count (1–30), the selected harmonic (1–count), and that harmonic's amplitude and phase. The 60
  amplitude and phase sliders are kit params `a1…a30`, `p1…p30`, each `visible` only when its harmonic is
  selected, so the URL holds every changed value and the panel fits at 1920×1080. Harmonics beyond count keep
  their values (moving count back restores them), as the original's `amplitudes[]` did.
- **Amplitude step 0.001** (the original's 0.01 would round 1/n² to 0 from n = 15 and 1/7 to 0.14); **phase in
  degrees, 0–355 in 5° steps** (the original's 0 … 1 of a period, step 0.01 = 3.6°; 90° and 180° are needed exactly).
- **Plot scales**: a lane is ±0.15 per unit amplitude, the sum ±0.2 divided by max(1, peak) so it always fits its
  plane (the page writes the scale, ±1 or e.g. ±1,787, at the plane's corner); the spectrum is a stem per harmonic
  from the plane's bottom, height ∝ amplitude.
- **Colour**: harmonics `--c1` thin, the selected harmonic `--c4` thick, the sum `--c3` thicker, the spectrum `--c2`
  stems with round dots (the selected one `--c4`). Legend words say thin/thick/dots, so it survives grayscale
  (checked).
- **Caption**: what the spectrum is (none / a single line / only odd multiples / the list), the frequencies, the
  sum's peak, and the selected harmonic's numbers. Tie-break: one line is "single" even when it is odd (3 Hz alone
  is a sine, not a square).
- **Phone**: the stage is 24rem high and the two plane titles go in an HTML line above the scene (in the SVG they
  would run into each other); the presets go back to one column.

## Deviations from the original (and why)

- **The spectrum shows the amplitudes.** The original drew, at the side, a vertical red line per harmonic from the
  minimum to the maximum of its own wave (±a around the middle), and a connecting line `freqline` that it never
  updated (all its points stayed at the origin). Now each harmonic has one stem from zero up to a, the usual
  one-sided amplitude spectrum, as the 50ohm text describes it.
- **Presets added**: sine, square with 30 frequencies, the square's spectrum with every phase moved by 90°
  ("other phases": the section's note "ne zaboraviti fazu"), sawtooth (all n at 1/n, even ones at 180°) and
  triangle (odd n at 1/n², every second at 180°), the last two from the section text's list of waveforms.
  *(check)* that six presets beyond the original's three are wanted; they are the section's own examples.
- **Phase kept when count changes.** The original rebuilt the sliders on every count change and set each phase
  slider back to 0 (`range2El.value = 0` after setting it), then read that 0 back into `phases[]`, so changing
  count silently zeroed every phase. Here every value is kept.
- **Event handlers bound once.** The original added its mousedown/mousemove/mouseup listeners again on every
  count change; harmless (each set the same variables) but they piled up.
- **Pointer events** instead of mouse events, so a drag also works with touch and pen. On a phone the stage takes
  horizontal drags (`touch-action: pan-y`), so the page still scrolls vertically.
- The sum is drawn on its own scale (max(1, peak)) instead of the original's fixed 1/20, where the "Maximum" preset
  ran off its plane.
- The English text is written for simdeck from the Croatian and the German; the explanation follows the 50ohm
  section, without its exam questions (DL-DE-BY 2.0, a separate licence, and answer material) and without its
  exam hint ("odd multiples are always a square wave in the exam questions"). The overshoot of about 9 % (Gibbs)
  is added: the "30 frequencies" preset shows it, and the tests check it (8–10 % with 30, 7–11 % with 9).

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`,
rows "Zeitbereich / Frequenzbereich / Frequenzspektrum", "Grundschwingung / Oberschwingung(en)", "Sinusschwingung /
Rechteckschwingung / …"). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| time domain | vremensko područje |
| frequency domain | frekvencijsko područje |
| spectrum (frequency spectrum) | frekvencijski spektar |
| fundamental | osnovni harmonik |
| harmonics | (viši) harmonici |
| amplitude | amplituda |
| phase | faza |
| square / sawtooth / triangle wave | pravokutni / pilasti / trokutasti signal (titraj) |
| sine wave | sinusni titraj |

## Shared requests

- **`kit/kit.css`: a hidden control still shows.** `.sd-ctl { display: flex }` beats the browser's `[hidden]`
  rule, so a param whose `visible(params)` is false is not hidden (the kit sets `wrap.hidden`). The smallest change:
  add `.sd-ctl[hidden] { display: none; }` to `kit.css`. This page works around it with the same rule under
  `[data-sim="fourier"]`; drop it once the kit has it. `sims/amdahl` and `sims/lora-mesh` carry the same
  workaround, so it is a kit defect, not a page one.
- *(minor)* Button params have no label of their own in the settings group; this page inserts a "Pogled / View"
  label over its three view buttons after mount, and lays the group out as a grid to put them in one row. A kit
  `choice`-like row of action buttons would do it without page CSS.

## Checks

- `node --test sims/fourier/sim.test.js`: 19 tests. Rules broken once each (single tie-break, even-only counted as
  odd, harmonics beyond count added, sel not clamped, phase sign, sawtooth and triangle phases, plot scale, lane
  order, the camera's right vector, the pitch clamp, amplitudes off the slider grid): every one fails a test.
- `npm run gate -- fourier`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions declared.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, help, panel hidden and 375×812, in hr and en; plus the
  time and frequency views, 30 frequencies, other phases, sawtooth, triangle, a selected 17 Hz, and a dragged
  view (unbuilt page from `file://`, no console errors).
- Not checked: a real projector; dragging on a real touch screen; whether a lecturer misses the original's
  free orbit around the origin (here it orbits the scene centre).

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 01:03–01:18 CEST), one session.
