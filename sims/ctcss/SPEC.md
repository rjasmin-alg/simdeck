<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ctcss: specification

Task `docs/tasks/w3/ctcss.md` (catalogue `ham-ctcss`, §4.10). One concept: **a sub-audible tone opens the receiver**.
Decisions and deviations: `NOTES.md`.

## Scene

A receiver or repeater R with its squelch mode (tone squelch at a set tone, default 88.5 Hz, or carrier squelch),
three stations A, B, C with a tone each (default A 88.5 Hz, B none, C 91.5 Hz), and a time strip in 0.25 s slots: a
row per station (keyed, tone sent), the detector row and R's loudspeaker row. The detector card shows the audio
collected (of 0.5 s), the power at all 49 tones as bars in dB over their median with the +12 dB line, the strongest
tone and its margin, and the decision.

## State

`{ t, squelch, rxTone, stations: [{ id, tone, level, keyed: [t0, t1] | null, on }], carrier,
detector: { collected (slots), bestTone, marginDb, decided, powers[49], locked, check }, speaker, heard: [{ id, from,
to }], doubled: [slots], slots: [{ n, keyed, received, carrier, det, tone, marginDb, collected, speaker, doubled }],
events }`. Plain JSON; `-0` is normalised to `0`.

## One step = one 0.25 s slot (slot n covers [(n − 1)·0.25 s, n·0.25 s))

1. Stations key up or release per the schedule (`key.up:X`, `key.down:X`).
2. R measures the carrier: present when at least one keyed station is above the threshold (`carrier.on/off`).
3. Tone squelch only: the detector adds the slot's audio (rule 3, rule 4b), and decides once it holds 0.5 s.
4. R opens or mutes the loudspeaker **for this slot** (rule 4).
5. Two received carriers at once: the slot is doubled (rule 6).

## Rules

1. **Carrier squelch** opens while the received level is above the threshold, for anyone, at once; noise alone stays
   muted, and so does a signal weaker than the threshold (50ohm `squelch`: "squelch isključuje i šum i slabe
   signale kada je amplituda ispod namještene vrijednosti"; `squelch_2`). Levels are two: *strong* (above) and
   *weak* (below). Simplification: a weak station is not received at all, so it neither opens R nor doubles a strong
   one *(check: the real effect of a much weaker co-channel carrier is FM capture, out of scope)*.
2. **Tone squelch (CTCSS)** also needs the set sub-audible tone; tones are the 49 values 67.0 … 254.1 Hz of
   HamMonitor `ctcss.py` `CTCSS_TONES` (EIA/TIA-603 *(check)*: the usual 50-tone list adds 69.3 Hz). Ascending; the
   closest pair is 2.4 Hz apart (159.8/162.2, 165.5/167.9).
3. **Detection** (HamMonitor `DESIGN.md` "CTCSS Detection", `ctcss.py`): R's demodulated audio is collected at 8000
   samples/s until it holds 0.5 s (4000 samples; 67 Hz completes ≈ 33 cycles). A Goertzel filter gives the power at
   all 49 tones (normalised by N²/4, as `_goertzel`); the strongest is accepted only if it is **≥ 12 dB** above the
   **median** of the 49 (`_TONE_THRESHOLD_DB`). The window resolves ≈ 2 Hz.
   - **Tie-break T3:** on equal power the lower tone is best (the first in the list, like `np.argmax`).
   - **Tie-break T4:** a margin of exactly 12 dB is accepted (`>=`).
   - After the first decision the window slides: each new slot is decided over the last 0.5 s (two slots).
4. **Loudspeaker.** Carrier squelch: open in every slot with a carrier. Tone squelch: open in slot n only when there
   is a carrier, the detector **locked** the set tone at the end of slot n − 1 (decided = set tone), and the lock
   still holds at the end of slot n (4b). It mutes when the carrier drops; the detector then empties (collected 0,
   no decision, no powers).
   - **Tie-break T1:** a new lock opens the loudspeaker from the **next** slot; the slot the decision is made in is
     still muted (the decision needs that slot's audio). So with A keyed at 0 s the speaker opens at 0.5 s and the
     first 0.5 s of speech is lost (task preset 1).
   - **4b, tone loss (derived):** while locked, each new 0.25 s slot is checked on its own; if the set tone is no
     longer the strongest at ≥ 12 dB, the lock is lost **in that slot**: R mutes at once and collects again from
     that slot (collected = 0.25 s). A real decoder takes a little time to notice (that delay is part of the squelch
     tail, out of scope), just as the task treats a carrier drop as instant. The 0.25 s check resolves only ≈ 4 Hz,
     coarser than the 2.4 Hz tone spacing; it only has to confirm a tone already found over 0.5 s, and a clean set
     tone passes it by ≥ 31 dB.
   - **4c:** the lock is also lost when the sliding 0.5 s decision of slot n is no longer the set tone (e.g. another
     tone takes over in a doubled slot); that mutes slot n too. `holds(r, rxTone)` = `r.decided === rxTone` for both.
   - **Tie-break T2:** losing the tone and starting again happen in the same slot; the next decision comes one slot
     later, over the fresh 0.5 s.
5. **The tone is filtered out** of the audio the listener hears (high-pass ≈ 300 Hz *(check)*). In the model every
   tone is below `HPF_HZ` = 300 and every speech component above it; the page says so whenever the speaker is open.
6. **The channel is still shared** (50ohm `relaisfunkstellen`: simultaneous speech garbles the repeater, "dupliranje").
   A station without the tone is not heard on a tone-squelch receiver, but its carrier still collides: two received
   carriers in a slot = doubled, whatever the loudspeaker shows. The doubled slot's audio is the sum of both
   stations' audio (simplification), so a lock on A's tone survives the doubling and the listener hears garble.
   - **6b, two tones in a doubled slot:** both tones are in the mix at the same strength, so which one is strongest
     depends on leakage and the speech; the decision can jump between them from slot to slot and the loudspeaker
     opens and mutes with it (a real decoder chatters too). Either way the audio is garble; nothing in a doubled slot
     counts as heard.
   - **Tie-break T5:** doubling is marked even while the loudspeaker is muted.
   - **Tie-break T6:** a weak station neither opens R nor doubles (rule 1).

## Audio (synthetic, deterministic)

Per received station and slot, in units of the peak deviation: the tone at 0.15 (CTCSS deviation ≈ 15 % of the peak
*(check)*), speech as four components at 520, 870, 1330 and 2150 Hz (amplitudes 0.35, 0.25, 0.18, 0.10, shifted 40 Hz
for the second station of a doubled slot) under a 3.1 Hz syllable envelope (0.2 … 1), and uniform noise ±0.05 from a
mulberry32 generator seeded by slot and station (seed = 131·n + 7919·index + 17). Each station has its own phase
ph = 0.7·(index + 1), applied to the tone, the envelope and (×(j + 1)) the speech components. Doubled slots add both
stations.

## Params

`squelch` tone / carrier (default tone); `rxTone` the 49 tones (default 88.5); `schedule` A / B / C / AB (default A);
`toneA`, `toneB`, `toneC`: none or a tone (defaults 88.5, none, 91.5; shown only for stations in the schedule);
`weak`: none / A / B / C (default none).

Schedules (slots, inclusive): A, B, C: that station keys 1–12 (0–3 s); AB: A 1–12, B 7–14 (1.5–3.5 s).
Steps: 12, AB: 14.

## Presets and expected numbers (checked with a script and in `sim.test.js`)

| Preset | Params | Expected |
|---|---|---|
| `right-tone` | default | slot 1 listening (0.25 s); slot 2 decides 88.5 Hz, margin 39.9 dB; speaker muted in 1–2, open 3–12; A heard 2.5 s of 3 s |
| `no-tone` | schedule B | every decision "no tone", margins 6.4 … 10.6 dB (< 12); muted 1–12; with carrier squelch: open 1–12 |
| `wrong-tone` | schedule C | decides 91.5 Hz in 2–12 (margins 38.4 … 43.0 dB) ≠ 88.5: muted 1–12; the 88.5 bar is 30.1 dB over the median (spill from 3 Hz away) but 91.5 is best |
| `hidden-user` | schedule AB | A locked at slot 2, open 3–12; doubled 7–12 (A unreadable from 1.5 s); slot 13: tone lost, muted, collected 0.25 s; slot 14: no tone (6.6 dB), muted. Heard: A 3–6 only, B never. With carrier squelch: A 1–6, doubled 7–12, B 13–14 |

Every one of the 49 tones sent alone is found as itself with a margin ≥ 37.1 dB.

## Out of scope

DCS (digital-coded squelch), 1750 Hz tone-burst access, the squelch tail and reverse burst, the FM demodulator, FM
capture.
