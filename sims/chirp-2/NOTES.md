<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# chirp-2: notes

Adopted from `50ohm-contents-hr/contents/html/applet_chirp_2.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/chirp-2.md`, catalogue `50ohm-chirp-2`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_chirp_2.html` (repo at `48e18bf`): same markup, script, transcript and MP3
(byte-identical audio line); only the button labels differ. The simdeck copy is canonical from here on. The first
commit on the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

An audio player, no simulation: a 36.75 s MP3 (44.1 kHz stereo, 93 kbit/s, embedded as a `data:` URI, 432 KB) of a
real CW contact, a progress bar that seeks on click, play/pause and stop buttons, and a transcript in two speech
bubbles that grows as the audio plays (26 events `{ms, t, b, sp}`; bubble 0 **OM3YCY?**, bubble 1 **DA DA OK RA1OW DE
OM3YCY**). Bootstrap classes from the 50ohm site, no library loaded.

**Where it sits in 50ohm:** `sections/oszillator_spannungsstabilitaet.md` (both languages), in the margin after
`applet_chirp_1`: "another example, a QSO between RA1OW and OM3YCY, in which the chirp is clearly heard in the second
pass". The explanation on the page comes from this section, without the exam questions.

## Attribution and licence (CC BY 4.0)

- Source: the applet with its recording and transcript, and the text of `sections/oszillator_spannungsstabilitaet.md`,
  **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  (`LICENSE` of both 50ohm repos). Croatian text by the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos), and **the MP3 carries no
  metadata but the encoder tag** (`LAME3.100`; no ID3 title, artist or copyright), so the task went ahead.
- *(check)* **Provenance of the recording.** An off-air recording of a real contact; neither repo says who recorded
  it. Read as team material under the repos' CC BY 4.0, as for `chirp-1`. The call signs RA1OW and OM3YCY are the real
  stations' (50ohm-contents-hr's `TRANSLATION_GLOSSARY.md` keeps them on purpose: a real recorded QSO, not a
  placeholder); they are named on the page because the source names them and the transcript sends them.
- **Changed**: adapted to the simdeck kit, translated into English, pitch curves measured from the recording and a
  comparison of both passes' dahs added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page.
- **No libraries vendored** (task step 3): the applet loads none. The MP3 stays embedded, now in `recording.js`, byte
  for byte; `sim.test.js` checks its sha256.

## Decisions

- **Class `explorer`** (playbook §10.4): the original is a player, nothing to step through; the play position is the
  one param (`t`, 0–36.7 s in 0.1 s), so a link can open it at any point.
- **One concept, distinct from `chirp-1`:** chirp heard and measured in a real contact, one station clean next to one
  that chirps. `chirp-1` already has the cause (a model of the supply dip, a regulated supply); this page does not
  repeat the model, names `chirp-1` in the explanation and in `related`. *(owner may prefer the two merged as presets
  of one sim; listed in the report, not in OPEN.md, since both tasks exist in the catalogue.)*
- **Stage**: the two-pass transcript (the original's two bubbles, now two labelled lines, the one sending underlined);
  pitch over time, a 4.6 s page at a time, with key-down bars and the whole recording as a strip under it (click to
  jump, as the original's progress bar); and **every dah heard so far laid from its key-down** as the change of pitch
  since it began: flat for the first pass, rising for the second. The latest dah is bold.
- **Caption numbers are the whole recording's**, not "so far", so they don't change while playing: first pass
  **0 Hz** (17 dahs, every one within ±1 Hz), second pass **+32 Hz** on average (36 dahs, 22 to 46 Hz each).
- **Rise of a dah** = median of its last five samples (50 ms) minus the median of its first five. One stray sample
  at either end doesn't move it. An element with fewer than 10 samples (100 ms) is not a dah. The first pass's dits
  are about 70 ms and its dahs about 205 ms. In the second pass dits are 50–100 ms and dahs 225–425 ms.
- **Which pass an element belongs to**: by time, before 8.0 s is the first (it ends at 7.21 s, the second starts at
  8.86 s).
- **Tie-breaks**: transcript characters show at ms ≤ t, and a pass's first character never takes a space. Before the
  first character nobody is sending (`sender` −1). A dah counts in "heard" stats once its key-up is reached. A mean
  over no dahs is `null`, and a mean that rounds to 0 is +0. The position snaps halves up and clamps, and junk gives 0.
  A page boundary belongs to the later page, and the end to the last page.
- **Playback is page state, not model state** (as `chirp-1`): the cursor and transcript move while sound plays
  (redrawn 10 times a second, twice under reduced motion; the sound still plays), `t` is written on pause or at the
  end, and moving `t` or clicking the strip while playing seeks. `P` plays and pauses (Space is the kit's). Nothing
  plays by itself.
- **Colour**: first pass `--c1` with round markers, second pass `--c4` with square markers, both labelled on the plot;
  key-down bars `--c2`, cursor `--c3` with a triangle head, zero change dashed ink. Grayscale checked: the passes
  differ by marker shape, label and position.
- **The pitch difference between the stations** (about 263 vs 400 Hz) is the receiver's tuning. The caption says so,
  and the comparison plot removes it.
- **Tags**: `signals` (task file). Topic `radio`, level `core`. `related: ["chirp-1"]`.
- **Title** "Chirp u QSO-u" / "Chirp in a QSO". The section's Croatian says "dita ili daha"; the page uses točka /
  crta, as `chirp-1` and the 50ohm-contents-hr glossary do. "Prolaz" (pass) is the section's word.

## Pitch track

`recording.js` `track` is simdeck's measurement of the MP3, not 50ohm's. Method (Python/numpy; the scripts went to the
thread's library as `chirp-2-track.py` and `chirp-2-gen.py`, not into the repo): decode to 8 kHz mono; frames of 256
samples (32 ms, Hann) every 5 ms, FFT zero-padded to 8192; the strongest bin in 200–520 Hz with parabolic
interpolation. An element starts when the frame's RMS goes above −34 dBFS and ends below −37 dBFS (the noise sits at
−40 to −45 dBFS, the signal at −7 to −30). Gaps under 20 ms are merged and elements under 40 ms dropped; samples every
10 ms. Samples within 20 ms of key-down and key-up are left out (the window straddles the key edge). So are samples on
the band's edge, and end samples that jump more than 30 Hz in 10 ms. 87 elements were found; 4 with an edge sample
inside were dropped, leaving 83 (29 in the first pass, 54 in the second).

The second pass's dahs often show a short dip in their first 30 ms (about 380 → 360 Hz) before the steady rise. It is
left in: it is in the measurement, and the median of five samples keeps it out of the numbers. *(check: whether it
is the transmitter or the key click's edge in the 32 ms window; a spectrogram at a finer hop would tell.)*

## Deviations from the original (and why)

- The player is now the kit: play/pause is a button with key `P`, "stop" is the position slider at 0 or a click at the
  strip's start, the progress bar is the strip under the plot.
- The two speech bubbles became two labelled lines of monospace text, one per pass.
- Added: the measured pitch curves, the dah comparison, the presets (first pass, second pass, whole contact) and the
  explanation (from the 50ohm section).

## Term pairs

Not in `kit/glossary.js`. They are written out in both tables, with the Croatian from the 50ohm section and its
`TRANSLATION_GLOSSARY.md`. The same pairs as `chirp-1`, plus:

| en | hr |
|---|---|
| pass (one station's turn in a QSO) | prolaz |
| QSO, contact | QSO, veza |
| key-down / key-up | pritisak / otpuštanje tipke |

## Shared requests

None. (`chirp-1`'s `.sd-ctl[hidden]` workaround isn't needed: this page hides no control.)

## Checks

- `node --test sims/chirp-2/sim.test.js`: 15 tests. Ten rules were broken once on a copy. In each case one to three
  tests failed: snapping halves down, transcript at ms < t, a space before a pass's first character, page boundary to
  the earlier page, a 10-sample element not counted as a dah, −0 kept, a dah counted before its key-up, the other
  pass's dahs counted, the first and last sample in place of the medians, and the dah threshold at 5 samples. The MP3
  is pinned by sha256.
- `npm run gate -- chirp-2`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale, help, panel hidden, and 375×812, in hr and en.
  Also unbuilt from `file://`: t = 5, 12.9, 20 and 31.4 s, dark, and the phone. Every one fits 1920×1080 with no
  sideways scroll at 375. Fixed from them: the time axis label overlapping the last tick.
- Playback checked in Chromium (Playwright): `P` plays from the position, the transcript follows (at 11.4 s: DA), a
  pause writes `t`, preset 3 loads, and a strip click seeks while playing. No console errors or warnings.
- Not checked: hearing it (no speakers on the build machine) *(check: the recording on a lecture-room PA)*; Firefox and
  Safari audio; a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 10 minutes by the machine clock (2026-10-03 12:08–12:18 CEST), one session.
