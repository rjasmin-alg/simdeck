<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dsp-filter: notes

Adopted from `50ohm-contents-hr/contents/html/applet_dsp_filter.html` (file last changed in `cb00536`, repo at
`5745d5e`; task `docs/tasks/w1/dsp-filter.md`, catalogue `50ohm-dsp-filter`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_dsp_filter.html` (repo at `48e18bf`, file last changed in `6a0afae`); same
markup and script, only the visible text differs. The simdeck copy is canonical from here on. The first commit on the
branch holds the original as-is, so `git log -p` shows the change.

## What the original is

**Not a "digital filter".** The catalogue title reads the file name that way (as with `dsp-basics`, "DSP" is 50ohm's
spelling of DSB). The applet is the **filter method for SSB**: an intro sentence, two buttons (LSB, USB) and two
pictures per button, `pictures/831.svg` + `940.svg` (LSB) and `832.svg` + `941.svg` (USB). The page is titled
*SSB filter method* (*Filtarska metoda za SSB*); the id stays `dsp-filter` as the task names it. *(check)* whether the
owner wants the id renamed (e.g. `ssb-filter-method`); that touches the catalogue and task files, outside this task.

The pictures are in `50ohm-contents-hr/contents/drawings/` (`.tex` circuitikz sources, `.svg` renders, `.txt`
Croatian alt texts):

| Figure | Shows |
|---|---|
| 831 / 832 | microphone → amplifier → mixer (DSB) → bandpass filter 9000 kHz ± 1.5 kHz → SSB; oscillator G under the mixer, fed by a switch between two crystals, 9001.5 kHz (LSB) and 8998.5 kHz (USB); the DSB bands a) and b) and the SSB band written out |
| 940 / 941 | left: speech power from 300 Hz to 3 kHz, falling; right: the filter's passband (red), the sideband it passes (blue), the other one and the oscillator's line (grey) |

**Where it sits in 50ohm:** `contents/sections/modulatoren.md`, after the paragraphs on the fixed filter and the two
crystal oscillators ("the filter stays, the DSB signal moves"). The explanation on the page comes from those
paragraphs, without exam questions AF303–AF307 (answer material).

## Attribution and licence (CC BY 4.0)

- Source: the applet, figures 831, 832, 940, 941 and the text of `sections/modulatoren.md`, **50ohm.de-Autorenteam,
  AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both
  50ohm repos). Croatian text by the 50ohm-contents-hr team.
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: Prof. Dr. Matthias Jung, DL9MJ` / `% Year: 2024`, in their `.tex`
  sources, but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam listed in the 50ohm-contents-hr
  `README.md`; read as team material under the repos' CC BY 4.0, as `sims/ring-modulator`, `sims/lambda-f`,
  `sims/quantisation` and `sims/sine-amplitude-period` did. The credit names DL9MJ for the figures. *(check)* if the
  owner reads task step 2 ("no separate author") more strictly.
- **Changed**: adapted to the simdeck kit, the four figures redrawn as one HTML block diagram and two SVG spectra
  computed from a model, translated into English, a test tone, the gap to the filter edge and presets added. Stated on
  the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the applet loads none (two buttons and image swaps; its `btn` classes come
  from the 50ohm site's stylesheet). The figures' SVGs were not copied: they are TeX renders with glyph-outline text
  that would scale below 16 px.

## Decisions

- **Class `explorer`** (playbook §10.4): the original is a switch, nothing to step through. Controls: the sideband
  (`choice`, LSB/USB, the crystal switch) and a test tone 300 Hz – 3 kHz in 100 Hz (added).
- **Model** (`sim.js`), all frequencies in whole hertz so that the filter edges compare exactly: speech band
  300–3000 Hz; mixer output fo − f (lower, mirrored) and fo + f (upper); filter [8998.5, 9001.5] kHz; crystals 9001.5
  (LSB) and 8998.5 kHz (USB). The kept band is found from the frequencies (a band wholly inside the passband), not from
  the switch's name. Values from figures 831/832 and `modulatoren.md`; the DSB, SSB ranges of both figures come out
  (tested).
- **Speech spectrum shape**: power falling in a straight line from 1 at 300 Hz to 0.6 at 3 kHz (the figures' 1.25 and
  0.75). Only a drawing aid, as in the figures.
- **Tie-breaks**: the passband is a closed interval (an ideal filter with sharp edges): the 3 kHz tone lands exactly
  on the edge in both settings and passes; the caption says a real filter would already attenuate it. The carrier
  (fo) sits exactly on a filter edge in both settings; the page and the explanation say the balanced mixer suppresses
  it, not the filter. An unknown sideband value is LSB (the original's start). The tone snaps half a step up and clamps
  to the speech band; a non-number gives 1 kHz. A band touching the passband has no gap.
- **Gap**: the suppressed sideband starts 300 Hz beyond the filter edge (600 Hz between the bands), drawn as a
  dimension line with its value and named in the caption. That is why the filter must be steep; the original shows it
  only implicitly.
- **Stage**: block diagram (HTML, so text keeps the 16 px floor) with the DSB bands (kept one bold blue, suppressed one
  struck through), the filter, the SSB band, and the oscillator with both crystal chips (selected one solid with `--hl`
  fill, the other dashed); spectra as SVG at 1:1, redrawn on resize. Kept band filled `--c1`, suppressed band dashed
  outline, passband `--c2` outline with a light fill, carrier dotted and named, tone `--c3` with round head (its
  suppressed image hollow and dashed). Grayscale checked: fill vs dashed outline carries the meaning.
- **Phone**: the diagram stacks with turned arrows; the RF plot drops the corner AF labels and the gap's value and
  moves the axis unit to the top corner (they overlapped at 330 px).
- **Tags**: `signals` (task file) and `modulation` (exists in `tags.json`; added as for `dsp-basics`). Topic `radio`,
  level `core`. `related`: `dsp-basics` (the balanced modulator, first stage), `speech-spectrum`, `am-modulation`.
- **NF/VF in Croatian, AF/RF in English**, as in `am-modulation` and `dsp-basics`.

## Deviations from the original (and why)

- Four fixed pictures became one live diagram and two spectra; LSB/USB stays the one switch, as a kit `choice`.
- Added: the test tone (shows the mirroring of LSB, which the figures show only by the wedge's slope), the gap line,
  the AF ends labelled on the kept band, presets (LSB, USB, LSB 3 kHz tone on the edge, USB 300 Hz tone).
- The figure's filter outline has rounded top corners (a real filter's slopes); the model's filter is ideal, said in
  the explanation.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from `sections/modulatoren.md` and the
50ohm-contents-hr `TRANSLATION_GLOSSARY.md`. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| SSB (single sideband) | jednobočnopojasni signal (SSB) |
| filter method | filtarska metoda |
| sideband | bočni pojas |
| lower / upper sideband (LSB / USB) | donji / gornji bočni pojas |
| carrier | nositelj |
| bandpass filter | pojasni filtar |
| passband | propusno područje |
| balanced mixer | balansni mješač |
| crystal oscillator | kvarcni oscilator |
| AF / RF | NF / VF |

## Shared requests

None. No shared model used or offered (four lines of arithmetic).

## Checks

- `node --test sims/dsp-filter/sim.test.js`: 19 tests. Each rule broken once on a copy (open filter interval, snap
  rounding down, unknown sideband → USB, gap off by one at a touching band, crystals swapped, mirroring on the wrong
  band, carrier edge on one side only, power outside the band) makes 1 to 8 tests fail.
- `npm run gate -- dsp-filter`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus unbuilt from `file://`
  LSB 1 kHz, LSB 3 kHz (edge) in English, USB 300 Hz, phone in both settings; no console errors or warnings. Fixed from
  them: halo blob behind the band name, AF corner labels on the tone's head, `f_OSC` subscript, phone overlaps.
- Not checked: a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 11:33–11:48 CEST), one session.
