# fec-hamming: Hamming code

| | |
|---|---|
| Task | `fec-hamming` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-fec-hamming` in `docs/catalogue.md` §4.10 |
| Kind | **add a preset to `sims/crc-error-detection/`** (no page of its own) |
| Folder | `sims/crc-error-detection/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | HAM, URM |
| Topic / tags / level | `radio` / `error-detection` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `crc-error-detection` merged; only one preset task per host folder at a time |

## Goal

One concept: **correcting one bit error with parity bits**.

The student: flip bits, decode.

This is a **preset on `crc-error-detection`** (Error detection with CRC), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/crc-error-detection/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/fehlerkorrektur.md` (FEC; the 11-bit Hamming example in the in-depth box: positions a–k, four parity bits p1–p4 in "crossword" areas, errors in k, a and p1; more than one error not correctable) and `fehlererkennung.md` (even/odd parity, its limits, CRC) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.). The figures (`hamming1`…`hamming6`) are not in the repo, so the 11 data bits used in the book are unknown; the presets choose their own.
- R. W. Hamming, "Error Detecting and Error Correcting Codes", *Bell System Technical Journal* 29(2), 1950.
- Catalogue seed: 50ohm fehlerkorrektur → §5.13.
- **§5.13 Error detection and correction:** One page, parity → CRC → Hamming as steps.

## Overlaps (catalogue §5)

- **§5.13 Error detection and correction:** One page, parity → CRC → Hamming as steps.

## Model and presets

- **Kind:** a preset (or preset group) on the host `sims/crc-error-detection/` (catalogue §5.13: one page,
  parity → CRC → Hamming as steps). This task adds the Hamming part; the host owns the bit strip and the
  "flip a bit" interaction.
- **Scene (what the host must show for this preset):** the 15 positions of a Hamming(15,11) code word in a
  row, positions 1…15 labelled in binary; parity bits p1, p2, p3, p4 at positions 1, 2, 4, 8, data bits a…k
  at 3, 5, 6, 7, 9 … 15 (the 50ohm layout); four coverage rows (p1 covers positions with bit 0 of the index
  set, p2 bit 1, p3 bit 2, p4 bit 3) drawn as the 50ohm "crossword" bands; a check panel with pass/fail per
  parity and the syndrome (failed checks read as a binary number) pointing at a position.
- **State (preset-specific part):** `{ code: 'hamming15', data: '10110011101', word: [15 bits], flipped:
  [positions], checks: [pass|fail ×4], syndrome, corrected: position|null, decoded }`.
- **One step (preset steps):** 1 place the 11 data bits; 2–5 compute p1…p4 (even parity over the covered
  positions); 6 transmit; 7 flip the bit(s) of the preset (or the student's); 8–11 re-check p1…p4; 12 read
  the syndrome and correct; 13 compare decoded data with the original.
- **Rules** (50ohm `fehlerkorrektur`, R. W. Hamming, "Error Detecting and Error Correcting Codes", *Bell
  System Technical Journal* 29(2), 1950):
  1. Even parity per check (50ohm `fehlererkennung`): p_j makes the number of 1s over its covered positions even.
  2. p_j (j = 1, 2, 3, 4) covers every position whose binary index has bit j−1 set (itself included).
  3. Syndrome = Σ 2^(j−1) over failed checks; 0 = no error; otherwise it is the position of the single
     flipped bit, data or parity (50ohm: k fails all four, a fails p1 and p2, p1 fails only p1).
  4. Correction flips that position back.
  5. Two errors give a non-zero syndrome that points at a third, correct bit: the decoder "corrects" it and
     now has three wrong bits (50ohm: more than one error cannot be corrected).
- **Params (host must support):** a `code` choice including `hamming15` next to parity and CRC; bit flips
  as clickable positions (the host's flip interaction, `resets: false`); `data` select of 11-bit words.
- **Presets** (data 10110011101, chosen here; code word 111101100011101 with p1 = 1, p2 = 1, p3 = 1,
  p4 = 0; checked with a script):
  1. `hamming-k` (50ohm example): flip k (position 15) → all four checks fail, syndrome 1111 = 15, corrected.
  2. `hamming-a` (50ohm example): flip a (position 3) → p1 and p2 fail, syndrome 3, corrected.
  3. `hamming-p1` (50ohm example): flip p1 → only p1 fails, syndrome 1: a parity bit is corrected too.
  4. `hamming-two` (derived): flip a and b (positions 3 and 5) → p2 and p3 fail, syndrome 6 → the decoder
     flips c, which was correct: three bit errors after "correction".
- **Steps:** 13 per preset.
- **Legend:** parity bit (square, "p"), data bit (circle, letter), flipped bit (red + "⚡"), failed check (×),
  passed (✓), syndrome arrow. "Changed" marks the bits computed or flipped in this step.
- **Captions:**
  - hr: „Ne prolaze provjere p1 i p2: sindrom je 0011 = 3. Pogreška je u bitu a na položaju 3; ispravljamo ga.“
  - en: "Checks p1 and p2 fail: the syndrome is 0011 = 3. The error is in bit a at position 3; we flip it back."
- **Terms** (50ohm hr): forward error correction (FEC) — unaprijedna korekcija pogrešaka; parity bit —
  paritetni (kontrolni) bit; even parity — parni paritet; Hamming code — Hammingov kod; syndrome — sindrom
  (check); redundancy — redundancija; retransmission — ponovni prijenos.
- **Misconceptions:** parity bits are never wrong (preset 3); a code that corrects one error detects two
  (preset 4: plain Hamming miscorrects; the extended code with an overall parity bit detects it, one line);
  FEC replaces retransmission (it only reduces it).
- **Out of scope:** extended Hamming (SECDED), Reed–Solomon, convolutional codes, interleaving.
- **Note for the coordinator:** the host's model (`crc-error-detection`) is not specified yet. It must allow a
  code choice and a decode/correct step; a CRC model alone cannot express correction. If the host cannot, this
  is better a second mode of the same page than a preset. Tag `radio`/`error-detection` matches; URM course
  link (§5.13) belongs on the host.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/crc-error-detection/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
