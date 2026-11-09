<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ctcss: notes

Task `docs/tasks/w3/ctcss.md` (catalogue `ham-ctcss`, §4.10). Rules, tie-breaks and numbers: `SPEC.md`.

## Decisions

- **A real detector in miniature.** The model synthesises each received station's demodulated audio (tone + speech
  above 300 Hz + a little seeded noise, 8000 samples/s) and runs HamMonitor's method on it: Goertzel at the 49
  tones over 0.5 s, best ≥ 12 dB over the median. The margins on the page are measured, not typed in: about 40 dB
  for a clean tone, 6–11 dB for speech without a tone. The detector card draws all 49 powers as bars with the median
  and the +12 dB line, so the student sees why 91.5 Hz wins over 88.5 Hz and why speech alone stays under the line.
  A full replay of 14 slots takes about 35 ms in node.
- **Captions use the measured margin** ("39.9 dB above the median … (12 needed)") rather than the task's sample
  "12 dB above the rest": 12 dB is the threshold, a clean tone is far above it.
- **Timing of the loudspeaker (T1).** The strip shows what the listener heard *during* each slot. The decision made
  with slot 2's audio cannot open slot 2, so the speaker opens from slot 3 (0.5 s), as the task's preset 1 says.
- **Tone loss (rule 4b, derived).** The task only says the speaker closes when the carrier drops. In `hidden-user`,
  B (no tone) is still on the air after A releases at 3 s; holding the lock until the carrier drops would let the
  tone-squelch listener hear B, against the preset's point. So a lock is checked on every new 0.25 s and lost at
  once when the set tone is no longer the best ≥ 12 dB; the detector then collects again from that slot. The real
  drop-out delay belongs to the squelch tail (out of scope), as the instant carrier drop does.
- **A lock lost by the sliding decision mutes too (4c)**, and two different tones in a doubled slot may make the
  decision jump between them (6b, chatter, as real decoders do); the captions say so ("in the mix of two tones…").
- **Sliding window.** After its first decision the detector re-decides every slot over the last 0.5 s (two slots).
  That is what lets a tone that arrives on an already present carrier be found (e.g. schedule AB with A without a
  tone and B with 88.5 Hz).
- **Levels: strong or weak** (one param, `weak` = none / A / B / C, instead of a level per station, to keep the panel
  on one screen). A weak station is under R's threshold: not received, no carrier, no doubling. 50ohm `squelch`
  says squelch shuts out weak signals too; that a weak carrier does not double a strong one is FM capture,
  simplified *(check)*.
- **Doubling.** A doubled slot's audio is the sum of both stations; A's tone survives in it, so the speaker stays open
  and the listener hears garble ("×" in the speaker row). Carrier squelch shows the same doubling.
- **Schedule param.** Four fixed schedules (A, B, C, A and B) with a hint giving the times; each preset is a schedule
  plus the default tones (A 88.5, B none, C 91.5). Tone selects appear only for stations in the schedule.
- **Steps** depend on the schedule: 12, or 14 for A and B. `sim.json` `steps` is the default preset's 12.
- **Numbers in Croatian** use a decimal comma (88,5 Hz, 0,25 s), as in `am-modulation` and `attenuator`.
- **Station letters** are data (`translate="no"`); the time strip's labels are plain numbers.
- **Related:** `backup-ncs` (doubling on a shared channel). `ham-fft-waterfall`, `kk-directed-net` should be added once
  they exist.

## Deviations from the task

- **Rule 4b and the sliding window** are added (above); the task's model decides once.
- **Caption wording** uses the measured margin and "the loudspeaker opens from the next quarter second" (T1).
- **`level`** is one `weak` param, two levels, instead of a free level per station.
- **Tone list:** 49 tones as in HamMonitor `ctcss.py` (the task says 49). The commonly cited EIA/TIA list has 50,
  adding 69.3 Hz; HamMonitor's docstring also says 50. Kept at 49 per the task *(check)*.

## Sources

- `~/projects/HamMonitor/DESIGN.md`: "CTCSS Detection (`--scan` mode)" (0.5 s, ~4000 samples at 8 kHz, 67 Hz ≈ 33
  cycles, Goertzel at 49 tones, ≥ 12 dB over the median) and "Known Constraints" (CTCSS warm-up ≈ 0.5 s).
- `~/projects/HamMonitor/ctcss.py`: `CTCSS_TONES`, `_TARGET_AUDIO_RATE = 8000`, `_DETECT_WINDOW = 4000`,
  `_TONE_THRESHOLD_DB = 12.0`, `_goertzel` (normalisation N²/4), `detect_tone` (argmax, median). Own project, no
  licence: ideas and numbers only, the code is written anew in JS.
- `50ohm-contents-hr/contents/sections/squelch.md`, `squelch_2.md` (šumna brava, threshold, weak signals shut out),
  `relaisfunkstellen.md` (doubling: "Kod istovremenog govora dviju različitih postaja, odašiljanje repetitora ometa
  se do nečitljivosti … dupliranje"). CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; credited in
  `sim.json` and on the page (explanation).
- TIA-603 (CTCSS tone list, ≈ 300 Hz audio high-pass) not consulted *(check)*.

## Unchecked *(check)*

- The 49 vs 50 tone list (69.3 Hz).
- The ≈ 300 Hz high-pass in the receive audio path and the ≈ 15 % tone deviation used for the synthetic audio.
- Weak station not doubling a strong one (FM capture).
- Croatian terms marked (check) in the task: "tonska šumna brava", "podzvučni ton", "uključiti odašiljač".

## Term pairs

Not in `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

| en | hr |
|---|---|
| squelch | šumna brava (squelch) (50ohm) |
| carrier squelch | šumna brava po nositelju |
| CTCSS, tone squelch | CTCSS, tonska šumna brava *(check)* |
| sub-audible tone | podzvučni ton *(check)* |
| repeater | repetitor (50ohm) |
| carrier | nositelj |
| doubling | dupliranje (50ohm) |
| key up | uključiti odašiljač *(check)* |
| tone detector | detektor tona |
| median | medijan |

## Shared requests

None. No kit view fits (the scene is a time strip and a bar chart, drawn in the page).

## Checks

- `node --test sims/ctcss/sim.test.js`: 32 tests, tie-breaks T1–T6 first, then rules 1–6, presets, the SPEC numbers
  pinned, and the generic block.
- Fresh review (a separate agent: the diff against SPEC.md, mutations, the page's real `caption()` run in node over
  many param sets). Its findings:
  - **Model:** a lock lost by the sliding decision left the loudspeaker open for that slot. Fixed as rule 4c.
  - **SPEC gap:** two tones in one doubled slot. Now rule 6b.
  - **Captions:**
    - the end caption blamed the wrong station when nobody was heard;
    - "tone squelch would never open for B" was shown when B carried the set tone, and in carrier squelch;
    - the doubled branch hid locks, losses and openings;
    - "stays muted" was said in the slot it muted;
    - "mutes" was said when it was already muted;
    - the "tone filtered" note was missing in carrier squelch;
    - "waiting for the tone" was shown in the slot the tone was found.
  - **Wording:** English "a 88.5 Hz"; Croatian gender ("stanica … preslaba/nečitljiva"); calques.
  - **Unkilled mutations:** 11, mostly unpinned numbers.

  All fixed. The 15 mutations (the 11, plus the 4c fix, a second lock-check variant and the per-station speech shift)
  are each re-run and each fails a test now.
- Not changed: the `weak` choice still offers stations that are not in the schedule (no effect, harmless).
- Preset numbers checked with a script against SPEC.md (margins, slots, heard runs).
- `npm run gate -- ctcss`: pass. Screenshots reviewed: 1920×1080 light, dark and grayscale in hr and en, 375×812,
  plus own shots of the key slots (decision at 0.5 s, first open slot, wrong tone with spill, doubling, tone lost,
  the end of hidden-user, carrier squelch, weak station).

## Time

Start 2026-11-09 07:52, done 08:21 (CET), one session, including the fresh review and its fixes.
