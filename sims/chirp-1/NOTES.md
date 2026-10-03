<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# chirp-1: notes

Adopted from `50ohm-contents-hr/contents/html/applet_chirp_1.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/chirp-1.md`, catalogue `50ohm-chirp-1`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_chirp_1.html` (repo at `48e18bf`, file added in `2e14a17`); same markup,
script, transcript and MP3 (byte-identical audio line), only the three button labels differ. The simdeck copy is
canonical from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

An audio player, no simulation: a 37.6 s MP3 (mono, 44.1 kHz, 48 kbit/s, embedded as a `data:` URI, 230 KB) of a
real CW signal with chirp, a progress bar that seeks on click, play/pause and stop buttons, and a transcript that
grows as the audio plays (28 events `{ms, t, b, sp}`: **QTH RHEINHAUSEN RHEINHAUSEN HW?**). Bootstrap classes from
the 50ohm site, no library loaded.

**Where it sits in 50ohm:** `sections/oszillator_spannungsstabilitaet.md` (both languages), in the margin after the
paragraph on chirp ("at the start of every dit or dah the pitch is first a little higher or lower, then approaches
the true pitch"; exam question AD609 follows). `applet_chirp_2` (a QSO between RA1OW and OM3YCY) is the next include
and its own task (`w1/chirp-2.md`). The explanation on the page comes from this section, without the exam question.

## Attribution and licence (CC BY 4.0)

- Source: the applet with its recording and transcript, and the text of `sections/oszillator_spannungsstabilitaet.md`,
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  (`LICENSE` of both 50ohm repos). Croatian text by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), and **the MP3 carries no
  metadata but the encoder tag** (`LAME3.100`; no ID3 title, artist or copyright), so the task went ahead. Git names
  Matthias Jung (DL9MJ, in the 50ohm.de-Autorenteam) as the committer; that is not an author line, so the credit
  names the team only.
- *(check)* **Provenance of the recording.** It is an off-air recording of a station sending "QTH RHEINHAUSEN"; neither
  repo says who recorded it or which station it is (no call sign is heard in this clip). Read as team material under
  the repos' CC BY 4.0, like the figures in `sims/dsp-filter`. If the owner wants certainty, ask the 50ohm team who
  made the recording.
- **Changed**: adapted to the simdeck kit, translated into English, a pitch curve measured from the recording, a model
  transmitter with its own sound, and presets added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the applet loads none. The MP3 stays embedded, now in `recording.js` (the
  build inlines scripts, not audio files), byte for byte; `sim.test.js` checks its sha256.

## Decisions

- **Class `explorer`** (playbook §10.4): the original is a player, nothing to step through; the recording's position
  is a param (`t`, 0–37.5 s in 0.1 s), so a link can open it at any point.
- **Two sources, one concept.** The recording alone shows chirp only to those who already hear it, and its pitch
  (about 250 Hz) is set by the receiver. So the page keeps the recording (preset 1, the original's start) and adds:
  1. **its pitch curve**, measured for simdeck (below), drawn as pitch over time, a 4.7 s page at a time, with
     key-down bars, the whole recording as a strip under it (click to jump, as the original's progress bar), and the
     transcript growing with the play position (the original's rule: a character shows once its time is reached);
  2. **a model** of the cause, from the section's text: a VFO whose supply dips at key-down. Its frequency jumps by
     Δf and returns exponentially, f(t) = f₀ + Δf · e^(−t/τ), from the start of each element; a regulated supply
     (the section's cure) means Δf = 0. The model sends **CQ** at 12 WPM (dit 100 ms, PARIS timing: dah 3, gaps 1
     and 3), about the recording's speed, with f₀ = 600 Hz. "Play" synthesises it (Web Audio: the jump with
     `setValueAtTime`, the return with `setTargetAtTime`, which is exactly that exponential; 4 ms keying edges).
- **The exponential return is simdeck's simplification**, not 50ohm's: the section says only "first a little higher
  or lower, then approaches". A supply dip that recovers through an RC network gives this shape to first order. The
  explanation says why at key-down (the output stage starts to draw current from the shared supply); that sentence is
  simdeck's too *(check: wording with someone who builds CW transmitters)*.
- **Presets**: 1 the recording; 2 model like the recording (Δf −90 Hz, τ 300 ms: dits end 64 Hz low, dahs 33 Hz;
  fitted by eye to the measured dahs, which rise about 55 Hz in 270 ms without settling); 3 the same with a regulated
  supply; 4 fast settling (τ 100 ms: dahs end 4 Hz low, dits 33 Hz: "chirp is heard most in the dits"); 5 from above
  (+150 Hz, τ 60 ms: the "tweet" the section names).
- **Tie-breaks**: regulated supply wins over the jump slider (the slider keeps its value, greyed, with the reason);
  Δf = 0 is no chirp (neither direction); an end offset that rounds to 0 Hz is "ends on the true pitch" (never −0);
  sliders snap halves away from the bottom and clamp, junk gives the default; an unknown source is the recording; a
  page boundary of the recording belongs to the later page, its end to the last page; transcript characters show at
  ms ≤ t.
- **Playback is page state, not model state**: the cursor moves while sound plays (redrawn 10 times a second, twice
  under reduced motion; the sound still plays), and the position param `t` is written when the recording pauses or
  ends, so the URL and the caption do not churn. A param change that alters what is playing stops it; moving `t` (or
  clicking the strip) while the recording plays seeks. Nothing plays by itself: sound needs the button or `P`.
- **`P` for play/pause**, not Space: Space is reserved for the kit (a stepper's transport), even though an explorer
  does not bind it.
- **Colour**: pitch `--c1` line with a round dot at each element's start, true pitch dashed ink, key-down bars `--c2`,
  cursor `--c3` with a triangle head, the shown page an ink frame on the strip. Grayscale checked: line, dashed line,
  bars and the cursor differ by shape.
- **Tags**: `signals` (task file). Topic `radio`, level `core`. No `related`: `chirp-2` does not exist yet (the
  manifest refuses unknown ids); add it when it lands.
- **Title** "Chirp u CW odašiljaču" / "Chirp in a CW transmitter": the 50ohm glossary keeps *Chirp* as the loanword.

## Pitch track

`recording.js` `track` is simdeck's measurement of the MP3, not 50ohm's. Method (Python/numpy; the scripts went to the
thread's library as `chirp-1-track.py` and `chirp-1-gen.py`, not into the repo; reproducible from this description): decode to 8 kHz mono; STFT with a 256-sample Hann window (32 ms),
hop 5 ms, zero-padded to 8192; the strongest bin in 170–360 Hz with parabolic interpolation; SNR against the median
of 380–480 Hz; an element starts above 11 dB and ends below 7 dB; gaps under 20 ms merged, elements under 40 ms
dropped; samples every 10 ms. Samples whose peak sits on the band's edge, or that jump more than 30 Hz in 10 ms, are
trimmed from an element's ends (noise and key edges); elements with an edge sample inside are left out.

Result: 70 elements; all 18 dahs of QTH RHEINHAUSEN RHEINHAUSEN HW? are found, and 16 of them rise from start to end
(mean 226 → 281 Hz); some faint dits are missing (the text has 58), which the plot's title says ("where the tone stands
out of the noise"). The dip-then-rise shapes at some starts are in the signal (seen in a spectrogram), not artefacts.
The recording's start (ffprobe `start: 0.025`) is ignored: 25 ms is under one sample.

## Deviations from the original (and why)

- The player is now the kit: play/pause is a button with key `P` (the original's ▶/❚❚), "stop" is the position
  slider at 0 or a click at the strip's start, the progress bar is the strip under the plot.
- Added: the measured pitch curve, the model with its sound, the presets, the explanation (from the 50ohm section).
- The transcript's speech-bubble styling (`qso_own`) became one line of monospace text.

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from `sections/oszillator_spannungsstabilitaet.md`
and the 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| chirp | Chirp (cvrkutanje) |
| VFO | VFO |
| dit / dah | točka / crta |
| pitch | visina tona |
| supply voltage | radni napon / napon napajanja |
| voltage regulation | stabilizacija napona |
| fixed voltage regulator | regulator stalnog napona |
| keying, key down | tipkanje, tipka pritisnuta |
| decoupled | odvezan |

## Shared requests

- **kit**: `.sd-ctl { display: flex }` in `kit.css` wins over the `hidden` attribute, so a param's `visible: false`
  does not hide it. Smallest change: `.sd-ctl[hidden] { display: none; }` in `kit.css`. Worked around in this page's
  CSS (one line), as `sims/amdahl` already does; drop it once the kit has it.
- **kit** (wish): button params take no `visible` or `hint`. Here a "to the start" button would have been visible in
  model mode too, so it was left out.

## Checks

- `node --test sims/chirp-1/sim.test.js`: 17 tests. Twelve rules broken once on a copy (regulator ignored, jump 0
  counted as "below", −0 at a settled end, snapping down at halves, transcript at ms < t, page boundary to the earlier
  page, dah of 2 units, letter gap of 2 units, half the decay rate, unknown source as the model, the MP3 changed by one
  character, a track sample outside its element) each make 1 or 2 tests fail.
- `npm run gate -- chirp-1`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: gate 1920×1080 light, dark, grayscale, help, panel hidden, and 375×812, in hr and en; plus
  every preset in both languages, the recording at 9.4, 20 and 37.5 s, dark, and the phone, unbuilt from `file://`,
  with the panel measured to fit (926/926) in every preset. Fixed from them: the recording's controls showing in model
  mode (kit `hidden`), the panel overflowing in model mode (the text choice CQ/SSS/OOO was dropped), detector spikes at
  element ends, sub/superscripts under 16 px on the phone.
- Playback checked in Chromium (Playwright): the cursor and transcript follow the audio, pause writes the position,
  a strip click seeks while playing, switching to the model or loading a preset stops the sound, the model's sound
  runs to its end and clears the cursor, reduced motion still plays; no console errors or warnings.
- Not checked: hearing it (no speakers on the build machine) *(check: listen to the model presets and the recording
  on a lecture-room PA)*; Firefox and Safari audio; a real projector; the Croatian wording with the HRS translation
  team *(check)*.

## Time

Start to done: about 20 minutes by the machine clock (2026-10-03 11:46–12:06 CEST), one session.
