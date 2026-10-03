<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# speech-spectrum: notes

Adopted from `50ohm-contents-hr/contents/html/spektrum_sprachsignale.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/speech-spectrum.md`, catalogue `50ohm-speech-spectrum`, §2.5). German original:
`50ohm-contents-dl/contents/html/spektrum_sprachsignale.html` (repo at `48e18bf`); its script is identical to the
Croatian one, only the intro sentence, the button, the "strongest amplitude" line, the axis title and the alert
text differ. The simdeck copy is
canonical from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

**What the original is:** a button that opens the browser's microphone and a Chart.js plot of the live spectrum
(Web Audio analyser, FFT 2048, byte levels as 0–100 %, log axis up to 24 kHz), with "strongest amplitude at f = … Hz"
under it. **Where it sits in 50ohm:** `sections/sprachsignale.md` (both languages) includes it after the amplitude
spectrum figure; the section's points are that speech is many low and high, soft and loud tones, that it does not
contain arbitrarily high frequencies, and that radio uses 300–2700 Hz (bandwidth 2400 Hz).

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `sections/sprachsignale.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**,
  licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian
  translation of the applet and of the section by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so it is team material under
  the repos' CC BY 4.0 and the task went ahead.
- **Changed**: adapted to the simdeck kit, drawn as SVG instead of Chart.js, translated into English, extended with a
  model voice (vowels a, i, u and the unvoiced "s"), the envelope with the formants F1–F3, the 300–2700 Hz band and
  presets (below). Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored.** The original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de; the page needs neither
  (the kit does the controls, SVG does the plot), so nothing is copied and nothing is loaded from the network.

## Decisions

- **Class `explorer`** (playbook §10.4): a sound, a pitch and a band toggle, nothing to step through.
- **A model voice next to the microphone.** The original only shows the live microphone. In a lecture hall that
  depends on the room's microphone, browser permission and the lecturer's voice; the gate (and a projector without a
  microphone) sees an empty chart. So the page opens on a deterministic model (`sim.js`) and keeps the original's live
  microphone behind a button (**M**, "Mikrofon uključi / isključi"). The 3–5 minute demo is the six presets:
  vowel a (start), i, u at f0 = 120 Hz; a at 240 Hz (lines move apart, formants stay); unvoiced s (noise, high up);
  a with the radio band (91 % of the power left, the fundamental cut but the pitch still heard).
- **The model** (source–filter, standard phonetics): voiced lines at k · f0, source 1/k (−12 dB/octave glottal pulse,
  +6 dB/octave lip radiation), times a cascade of second-order resonances: F1–F3 of the vowel (Peterson & Barney 1952,
  men's averages: a 730/1090/2440, i 270/2290/3010, u 300/870/2240 Hz) and five fixed ones at 3.5–7.5 kHz, 1 kHz apart
  (a 17 cm tube). "s": a continuous spectrum every 50 Hz, one resonance at 6.5 kHz (bandwidth 3 kHz) and a second-order
  high-pass at 3.5 kHz applied twice. *(check: the "s" shape and the bandwidths are set to look like textbook spectra,
  not fitted to a recording)*
- **Levels in dB relative to the strongest component**, 0 to −60 dB, with 10 dB headroom for a formant that peaks
  between two lines. The original showed the analyser's byte levels (already a dB scale, −100 … −30 dBFS) as "%"; a
  dB axis says what it is and shows the weak high harmonics a linear % axis would hide.
- **Frequency axis 50 Hz – 20 kHz** (log), as the section's figure (0–20 kHz) rather than the original's 0–24 kHz.
- **Strongest component**, as in the original, with the original's tie-break (the first, lowest bin wins; only a
  strictly larger value moves it). Shown as a triangle above the plot with its frequency, in the readout and the
  caption (with the harmonic number for a vowel).
- **Band share**: the share of the power (sum of a²) inside 300–2700 Hz. Tie-breaks: a line exactly on an edge is
  inside; a share above 0 that rounds to 0 % shows "< 1 %", one below 100 % that rounds to 100 % shows "> 99 %".
- **Live microphone**: `getFloatFrequencyData` (dBFS) instead of the bytes, FFT 2048 as in the original, levels
  relative to the frame's strongest bin; bins below 50 Hz (0 Hz, rumble, hum) are dropped before the strongest is
  found (the original searched from 0 Hz; Chromium's fake device then reported 23 Hz). A frame whose strongest bin is
  below −80 dBFS counts as quiet and shows a "speak into the microphone" caption instead of a normalised noise floor.
  Updates ten times a second, twice a second under reduced motion. While it runs, sound and pitch are disabled with a
  reason; a preset switches it off; a refused permission or a missing API is said in the caption (the original used
  `alert`), and the model stays on screen.
- **Colour**: lines `--c1` solid, envelope `--c3` dashed, noise `--c4` filled area, strongest `--c5` triangle, band
  `--c2` shaded with dashed edges and their labels; lines outside the band turn grey and dotted. Each carrier has its
  own shape (grayscale screenshot checked).
- **No answer keys**: the 50ohm section has no exam question on this; nothing from `dr-lecture-estate/instructor/`.

## Deviations from the original (and why)

- Chart.js and jQuery replaced by the kit and SVG drawn at 1:1, so the labels keep the 16 px floor and nothing is
  loaded from the network.
- The model voice, the presets, the envelope with formant labels, the band and its share are new (above). The live
  microphone stays, behind a button instead of being the whole applet.
- dB axis instead of %, 50 Hz – 20 kHz instead of 0–24 kHz, bins under 50 Hz ignored, float dB instead of bytes.
- The MathJax `$f$`/`\unit{\hertz}` became plain text (no MathJax on simdeck pages).
- The English text is written for simdeck from the Croatian and the German; the explanation follows
  `sections/sprachsignale.md` and adds the voiced/unvoiced and formant paragraphs for the model.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian as used in 50ohm-contents-hr `sections/`). For the
coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| speech signal | govorni signal |
| amplitude spectrum | amplitudni spektar |
| harmonic | harmonik |
| fundamental frequency | osnovna frekvencija |
| formant | formant |
| envelope | ovojnica |
| noise | šum |
| bandwidth | širina pojasa |
| modulating signal | modulacijski signal |
| voiced / unvoiced sound | zvučni / bezvučni glas |

## Shared requests

None.

## Checks

- `node --test sims/speech-spectrum/sim.test.js`: 21 tests. Fourteen rules broken once by hand (strongest tie to the
  last, band edge outside, no "< 1 %", no "> 99 %", pitch floored, band "yes" accepted, source 1/k², last harmonic at
  20 kHz dropped, the 50 Hz bin dropped, silence as 0 dB, resonance bandwidth halved, sound case-folded, F2 of i moved,
  top cut at −65 dB) each make 1 to 4 tests fail.
- `npm run gate -- speech-spectrum`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: 1920×1080 light, dark, grayscale, and 375×812, in hr and en; plus every sound with and without
  the band, f0 = 300 Hz, and "s" in dark, unbuilt from `file://`, no console errors or warnings. Fixed from them:
  tick labels colliding on the phone, F1/F2 labels on top of each other, the axis titles over the data, a formant label
  above the frame at f0 = 300 Hz, "100 %" shown while lines lay outside the band.
- Live microphone checked in Chromium with a fake audio device (lines of the test tone, readout, band share, controls
  disabled, preset and M switch it off) and with the permission refused (caption, model stays, no console errors).
  *(check: a real microphone and voice in a lecture room; Firefox and Safari)*
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: see the report (machine clock, 2026-10-03, from 11:02 CEST), one session.
