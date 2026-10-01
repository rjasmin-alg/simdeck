# ctcss: CTCSS tone squelch

| | |
|---|---|
| Task | `ctcss` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-ctcss` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/ctcss/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `receivers` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a sub-audible tone opens the receiver**.

The student: key up with and without the tone.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/HamMonitor/DESIGN.md`, "CTCSS Detection (`--scan` mode)" (0.5 s window, 67 Hz ≈ 33 cycles, Goertzel at 49 EIA tones 67.0–254.1 Hz, best ≥ 12 dB over the median) and "Known Constraints" (CTCSS warm-up: transmissions shorter than 0.5 s are missed); `/home/rjasmin/projects/HamMonitor/ctcss.py` (`CTCSS_TONES`, `_TONE_THRESHOLD_DB = 12.0`). Own project, no licence; ideas and numbers only.
- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/squelch.md`, `squelch_2.md` (šumna brava, threshold), `relaisfunkstellen.md` (repeaters, doubling, orderly handover) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.). 50ohm has no CTCSS section.
- TIA-603 (land mobile FM equipment; CTCSS tone list) *(check)*.
- Catalogue seed: HamMonitor ctcss.py

## Model and presets

- **Scene:** a repeater (or receiver) R in the middle with its squelch mode shown (carrier squelch or tone
  squelch with the set tone, e.g. 88.5 Hz), three stations around it (A, B, C) each with a "tone" setting, and a
  time strip below in 0.25 s slots with a row per station (keyed / not keyed, tone sent) and a row for R's
  loudspeaker (muted / open) and detector (listening / tone found / no tone). A detector card: audio collected
  so far (of 0.5 s), best tone and its margin over the median of all 49 tone powers.
- **State:** `{ t (slot), squelch: 'carrier'|'tone', rxTone, stations: [{id, keyed: [t0, t1], tone|null, level}],
  detector: {collected, bestTone, marginDb, decided: tone|null}, speaker: 'muted'|'open', heard: [{id, from,
  to}], doubled: [slots] }`.
- **One step:** one 0.25 s slot, phases in order: (1) stations key up or release per the preset's schedule;
  (2) R measures the carrier; (3) if tone squelch: the detector adds 0.25 s of audio and, once it has 0.5 s,
  decides; (4) R opens or mutes the loudspeaker; (5) if two stations are keyed at once, mark doubling.
- **Rules:**
  1. Carrier squelch: open while the received level is above the threshold; noise alone stays muted (50ohm
     `squelch`, `squelch_2`).
  2. Tone squelch (CTCSS): the receiver also needs the set sub-audible tone; tones are the 49 standard values
     67.0 … 254.1 Hz (HamMonitor `ctcss.py`, EIA/TIA-603 *(check)*).
  3. Detection (HamMonitor `DESIGN.md` "CTCSS Detection"): collect 0.5 s of demodulated audio (67 Hz completes
     ≈ 33 cycles), evaluate all 49 tones, accept the best one only if it is ≥ 12 dB above the median of all tone
     powers; the window gives ≈ 2 Hz resolution, enough for the closest standard tones (2.4 Hz apart).
  4. The loudspeaker opens only when carrier present and decided tone = set tone; it closes when the carrier
     drops (squelch tail out of scope).
  5. The tone is filtered out of the audio the listener hears (high-pass below ≈ 300 Hz *(check)*).
  6. The channel is still shared: a station without the tone is not heard on a tone-squelch receiver, but its
     carrier still collides with others (doubling, 50ohm `relaisfunkstellen`).
- **Params:** `squelch` choice carrier / tone (default tone); `rxTone` select of the 49 tones (default 88.5);
  per-station `tone` select (none / tone list) and `level`; `schedule` select of the presets.
- **Presets** (timings derived from the HamMonitor detector; 88.5 Hz appears in its example log):
  1. `right-tone`: A keys up at t = 0 with 88.5 Hz for 3 s → detector decides at 0.5 s (after slot 2); the
     loudspeaker opens from 0.5 s; the first half second of speech is clipped.
  2. `no-tone`: B keys up without a tone → tone squelch stays muted for all 3 s; switch the receiver to carrier
     squelch → it opens at once.
  3. `wrong-tone`: C sends 91.5 Hz (3 Hz from 88.5) → detected as 91.5 (margin ≥ 12 dB), ≠ 88.5 → stays muted.
  4. `hidden-user`: A (88.5 Hz) talks 0–3 s; B (no tone) keys up at 1.5 s → the tone-squelch listener never
     heard B, yet B's carrier doubles A from 1.5 s: A becomes unreadable at the repeater.
- **Steps:** 12 slots (3 s) each; preset 4: 14.
- **Legend:** keyed (bar), tone sent (bar with "~" pattern and the tone value), detector listening (hollow),
  tone found (✓ + value), loudspeaker open (speaker icon with waves) / muted (crossed), doubling (×). "Changed"
  marks the loudspeaker row when it opens or mutes.
- **Captions:**
  - hr: „Prijamnik je skupio 0.5 s zvuka: najjači ton je 88.5 Hz, 12 dB iznad ostalih. To je postavljeni ton,
    pa se zvučnik otvara. Prvih pola sekunde govora je izgubljeno.“
  - en: "The receiver has collected 0.5 s of audio: the strongest tone is 88.5 Hz, 12 dB above the rest. It is the
    set tone, so the speaker opens. The first half second of speech is lost."
- **Terms:** squelch — šumna brava (squelch) (50ohm); CTCSS (tone squelch) — CTCSS, tonska šumna brava (check);
  sub-audible tone — podzvučni ton (check); repeater — repetitor (50ohm); carrier — nositelj; doubling —
  dupliranje (50ohm `relaisfunkstellen`); key up — uključiti odašiljač (check).
- **Misconceptions:** CTCSS makes a channel private (preset 4: it only hides others from you); the tone is heard
  in the audio (it is filtered out); tone squelch opens instantly (preset 1).
- **Out of scope:** DCS (digital-coded squelch), 1750 Hz tone-burst access, the squelch tail and reverse burst,
  the FM demodulator.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ctcss` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ctcss sims/ctcss` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ctcss/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
