<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# aurora: notes

Adopted from `50ohm-contents-hr/contents/html/applet_aurora.html` (file last changed in `57ef515`, repo at `5745d5e`;
task `docs/tasks/w1/aurora.md`, catalogue `50ohm-aurora`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_aurora.html` (repo at `48e18bf`, file added in `de9cb18`, "feature: aurora
applet"); the two have the same recording and transcript and differ only in the button words (Reproduciraj / Zaustavi
/ Pauza against Play / Stop / Pause). The host text is `contents/sections/aurora_1.md` and `aurora_2.md` (the applet
sits in their margin) and `contents/slides/aurora_1.md`, `aurora_2.md`. The simdeck copy is canonical from here on.
The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

An audio player, no simulation: a 36.74 s WAV (mono, 8 kHz, 16-bit PCM, embedded as a `data:` URI, 784 KB: the
"790 KB, embedded data" of the catalogue) of the end of a real CW contact on 2 m, a progress bar that seeks on click,
play/pause and stop buttons, and a transcript in three speech bubbles that grows as the audio plays (57 events
`{ms, t, b, sp}`):

| bubble | text | who (from the text and the audio) |
|---|---|---|
| 0 | `R R R R "73" 73 ES TU TU OK/DF7TR/P DE GM4YXI TU EE` | GM4YXI, received via the aurora |
| 1 | `R R R R R 73 73 EE` | OK/DF7TR/P, the recording station's own signal |
| 2 | `EE TU DE GM4YXI` | GM4YXI again |

Bootstrap classes from the 50ohm site; no library loaded. The host text: "the end of a CW aurora QSO between GM4YXI
and OK/DF7TR/P can be heard here".

## Attribution and licence (CC BY 4.0)

- Source: the applet with its recording and transcript, and the text of `sections/aurora_1.md`, `aurora_2.md` and
  `slides/aurora_1.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian text by the
  50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The WAV's own metadata** (a RIFF `LIST/INFO` chunk) names no author or licence either: a comment of level-meter
  characters, the date 2026-03-22, a title from the transceiver's voice recorder with 144.065 MHz, CW and "TX", and
  the encoder (`Lavf62.3.100`). The title names the radio's model; it is not shown anywhere on the page, and the
  bytes stay unchanged (pinned by sha256), so it was left in.
- *(check)* **Provenance of the recording.** It is the recording station's own (OK/DF7TR/P's voice recorder, by its
  metadata), added to the German repo by a 50ohm author in March 2026, four days after it was made. Read as team
  material under the repos' CC BY 4.0, as for `chirp-1` and `chirp-2`. The call signs GM4YXI and OK/DF7TR/P are the
  real stations'; they are named on the page because the source names them and the transcript sends them.
- **Changed**: adapted to the simdeck kit, translated into English, a spectrogram of the recording and spectra
  measured from it added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page.
- **No libraries vendored** (task step 3): the applet loads none. The WAV stays embedded, now in `recording.js`, byte
  for byte; `sim.test.js` checks its sha256.

## Decisions

- **Class `explorer`** (playbook §10.4): the original is a player, nothing to step through. The play position is the
  one param (`t`, 0–36.7 s in 0.1 s), so a link can open it at any point. Same pattern as `chirp-2`.
- **One concept: Doppler spread of a signal via the aurora, heard and measured.** The recording holds its own
  comparison: OK/DF7TR/P's over is that station's own signal (a clean tone with dead silence between elements, no
  receiver noise: it was recorded while sending), and GM4YXI's overs came via the aurora. The page shows both at the
  same pitch: a single line next to a patch hundreds of hertz wide. The aurora's physics (solar wind, E region, poles)
  is in the explanation, not modelled.
- **Stage**: the three-over transcript (the original's three bubbles as three labelled lines, the over sounding now
  underlined); a spectrogram of the whole recording with the overs bracketed above it and the cursor (click to jump,
  as the original's progress bar); and each path's spectrum with its width at −10 dB, the path sounding now drawn
  bold.
- **Computed in the page, not stored.** `sim.js` decodes the WAV from the `data:` URI and computes the spectrogram
  (frames of 256 samples, 32 ms, Hann, every 20 ms; 0–2000 Hz) and the spectra, well under 0.1 s in all. No measured data
  is kept beside the recording; the tests pin the numbers.
- **A path's spectrum** (frames of 1024 samples, 128 ms, Hann, half overlapping; 7.8 Hz bins): frames with an RMS at
  or above 0.5 × the path's 90th-percentile RMS are key-down, at or below 0.4 × it key-up, the rest left out. The
  spectrum is the mean of the key-down frames minus the mean of the key-up frames (the receiver's noise), never below
  0. **Width**: the strongest bin at or above 100 Hz, then the run of neighbouring bins at or above 10 dB below it;
  width = bins × 7.8125 Hz. Via the aurora: **734 Hz** (320–1047 Hz, peak 563 Hz; shown as ≈ 730 Hz). Own signal:
  **31 Hz** (4 bins, peak 547 Hz), which is the Hann window's main lobe at this frame length, so the page says
  "narrower than 40 Hz (the analysis's limit)" and the explanation says so. With frames of 2048 samples it reads 20 Hz,
  with 512 it reads 47 Hz; the aurora's width stays 680–780 Hz.
- **Why the noise is taken out.** Without it the aurora's spectrum fills the receiver's whole audio passband (about
  200–1600 Hz, the receiver's filter) and the width would be the filter's. With it, the signal alone is about 730 Hz
  wide, which is what a 2 m aurora reflection does (several hundred hertz to about 1 kHz).
- **The spectrogram's floor is −32 dB** below its loudest cell (the own signal's line): the receiver's noise sits just
  below it, so the aurora's elements stand out as smeared vertical strokes. At −50 dB the noise filled the passband
  and the keying was hard to see.
- **Overs by time**: GM4YXI before 21.9 s, OK/DF7TR/P from 21.9 s, GM4YXI from 29.5 s. Found in the audio: GM4YXI's
  last element ends at 21.5 s, the own signal's first starts at 21.95 s; the own signal's last ends at 29.05 s and the
  receiver's noise is back from 29.5 s. Every transcript character falls in its own bubble's over (tested).
- **Tie-breaks** (tested): a boundary belongs to the later over, before 0 is the first over and past the end the
  last; transcript characters show at ms ≤ t (the first R is complete at 0 ms, as in the original) and a bubble's
  first character never takes a space; the position snaps halves up and clamps, junk is 0; equal peak bins go to the
  lowest frequency; a bin exactly 10 dB below the peak is inside the width; the width is the joined run around the
  peak, not every bin above the limit; an all-zero spectrum has no width (`null`); the quantile is the value at
  floor(q·(n − 1)).
- **Playback is page state, not model state** (as `chirp-2`): the cursor and transcript move while sound plays
  (redrawn 10 times a second, twice under reduced motion; the sound still plays), `t` is written on pause or at the
  end, and moving `t` or clicking the spectrogram while playing seeks. `P` plays and pauses (Space is the kit's).
  Nothing plays by itself. The original's stop button is the position slider at 0 or a click at the spectrogram's
  start.
- **Presets** (keys 1–3): GM4YXI via the aurora (0 s), own signal (21.9 s), last over (29.5 s).
- **Colour**: via the aurora `--c1`, solid line, round markers; own signal `--c4`, dashed line, square markers; both
  named in the spectrum's title row and the transcript; cursor `--c3` with a triangle; the spectrogram ramps `--bg` →
  `--c1` → `--ink` (read from the tokens, so it follows the theme), with a weak/strong scale in its title row.
  Grayscale checked: paths differ by line style, marker shape, label and position.
- **Tags**: `propagation` (task file; in `tags.json`). Topic `radio`, level `core`. `related`: `fading` and
  `skip-distance` (the other propagation sims).
- **No answer keys**: the sections' exam questions (EH305, AH302–AH308) are not on the page; the explanation keeps
  the section's text (E region, VHF, CW best, "A" for the tone in the RST report).
- **Title** "Aurora: grub ton CW signala" / "Aurora: the rough tone of a CW signal". "Prolaz" (over) as in
  `chirp-2`.

## Deviations from the task and from the original (and why)

- The player is now the kit: play/pause is a button with key `P`, the progress bar is the spectrogram.
- The three speech bubbles became three labelled lines of monospace text, one per over.
- Added: the spectrogram, the spectra with their widths, the presets and the explanation (from the 50ohm sections).
- The original's `"73"` (with the quotes) in GM4YXI's first over is kept as the original has it.
- Task step 4 (kit fonts, tokens, header, transport for its class): done; nothing was waived.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-hr sections and `chirp-2`:

| en | hr |
|---|---|
| Doppler spread | Dopplerovo širenje (50ohm-hr: "frekventno širenje signala, takozvani Doppler-spread") |
| aurora, polar lights | aurora, polarna svjetlost |
| over (one station's turn in a QSO) | prolaz |
| own signal (heard while sending) | vlastiti signal |
| spectrogram | spektrogram |

*(check: whether the HAM course prefers "Dopplerovo širenje" or the section's "frekventno širenje".)*

## Shared requests

None. The WAV decoder, FFT and spectrum helpers in `sim.js` are pure and could be promoted to `models/` if another
recording sim wants a spectrogram (the coordinator decides).

## Checks

- `node --test sims/aurora/sim.test.js`: 19 tests. Fourteen rules were broken once on a copy, and each time one to
  three tests failed: snapping halves down, the over boundary to the earlier over, the transcript at ms < t, a space
  before a bubble's first character, the peak tie to the higher bin, −10 dB exactly left out (low and high side), no
  100 Hz floor for the peak, the width without its last bin, the noise not taken out, WAV chunks unpadded, the
  quantile rounded, and the key-down threshold moved. (`<` for `≤` in the transcript alone is equivalent under the
  1 µs tolerance; removing the tolerance fails.) The WAV is pinned by sha256.
- `npm run gate -- aurora`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale, help, panel hidden, and 375×812, in hr and en.
  Also unbuilt from `file://`: t = 25 s (en, light) and t = 33.2 s (hr, dark). Fixed from them: the spectrogram's
  floor (−50 → −32 dB), the spectrum's labels colliding with the −10 dB line (moved to the title row), a missing space
  after "·", the dB label sitting on the frequency axis.
- Playback checked in Chromium (Playwright): `P` plays from the position and the transcript follows (from 9 s, after
  2.5 s: "… OK/DF"), a pause writes `t` (11.4 s), preset 3 loads, a spectrogram click jumps to 25 s. No console
  errors or warnings.
- Not checked: hearing it (no speakers on the build machine) *(check: the recording on a lecture-room PA)*; Firefox
  and Safari audio; a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 14 minutes by the machine clock (2026-10-03 17:18–17:32 CEST), one session.
