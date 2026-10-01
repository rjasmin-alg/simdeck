# shannon-hartley: Shannon–Hartley

| | |
|---|---|
| Task | `shannon-hartley` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-shannon` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/shannon-hartley/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | HAM, URM |
| Topic / tags / level | `radio` / `modulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **capacity from bandwidth and SNR**.

The student: sliders for B and SNR.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/shannon_hartley_gesetzt.md` (C = B·log₂(1 + P_S/P_N); 0 dB → C = B; FT8/WSPR; HAMNET needs bandwidth; noise only inside the used band, the 2.4 kHz reference caveat; upper bound) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" (širina pojasa as the theoretical ceiling on throughput vs measured rate; RFC 5136 capacity).
- C. E. Shannon, "Communication in the Presence of Noise", *Proc. IRE* 37(1), 1949. FT8 payload (77 bits, 15 s cycle): K. Taylor et al., "The FT4 and FT8 Communication Protocols", *QEX*, 2020 *(check)*.
- Catalogue seed: 50ohm shannon_hartley_gesetzt

## Model and presets

- **Scene:** two sliders' worth of picture: a rectangle whose width is the bandwidth B and whose height is
  log₂(1 + S/N), with its area = capacity C written inside; beside it the formula with the current numbers
  substituted, a small curve of C/B (bits per hertz) against SNR in dB with the current point, and markers for
  example systems (FT8/WSPR, SSB voice channel, HAMNET, WLAN) placed where their B and SNR put them.
- **State (explorer, derived from params):** `{ B, snrDb, snrLin, bitsPerHz, C, requiredSnrDb (for a target
  rate), examples: [{name, B, snrDb, C}] }`.
- **Params drive live:** B and SNR recompute C at once; the "target rate" field gives the SNR needed for it at
  this B.
- **Rules:**
  1. C = B · log₂(1 + S/N) bit/s, with S/N linear and N the noise inside B only (50ohm
     `shannon_hartley_gesetzt`; C. E. Shannon, 1948/1949).
  2. dB → linear: S/N = 10^(dB/10). At 0 dB, S/N = 1 and C = B (the book's memory rule).
  3. Inverse: required S/N = 2^(R/B) − 1 for a target rate R; asking R ≫ B makes the needed SNR explode
     (50ohm: "potrebni omjer signal-šum snažno raste").
  4. C is an upper bound; real systems are below it; only good error correction approaches it (50ohm).
  5. A software SNR measured in a 2.4 kHz (or 2.5 kHz) reference bandwidth is a different quantity and cannot be
     used directly when the signal is narrower (50ohm in-depth note); the FT8 marker says so.
- **Params:** `B` range 10 Hz–20 MHz, log steps (default 2.4 kHz); `snr` range −30…+40 dB step 1 (default 10);
  `target` range (bit/s, optional).
- **Presets** (computed with rule 1):
  1. `zero-db` (from 50ohm): B = 2.4 kHz, 0 dB → C = 2400 bit/s = B.
  2. `ssb-10`: 2.4 kHz, 10 dB → 8.30 kbit/s; at 30 dB → 23.9 kbit/s (30 dB more for not even 3× the rate).
  3. `double-b`: 4.8 kHz at 10 dB → 16.6 kbit/s: doubling B doubles C, doubling SNR does not (2.4 kHz at 13 dB
     → 10.5 kbit/s *(derived)*).
  4. `weak-signal` (50ohm: WSPR/FT8 work at very poor SNR): 2.5 kHz at −20 dB → 35.9 bit/s ceiling; FT8's real
     payload rate is only a few bit/s (77 bits per 12.6 s ≈ 6 bit/s *(check)*).
  5. `hamnet` (50ohm: HAMNET in upper UHF/SHF for wide bandwidth): 10 MHz at 20 dB → 66.6 Mbit/s; WLAN 20 MHz at
     30 dB → 199 Mbit/s.
- **Steps:** explorer, none.
- **Legend:** bandwidth (width), log₂(1 + S/N) (height), capacity (area, filled), example system (labelled dot).
  "Changed" marks C when it crosses a power of ten.
- **Captions:**
  - hr: „Uz omjer signal-šum od 0 dB kapacitet je jednak širini pojasa: 2.4 kHz daje najviše 2400 bit/s. Za
    dvostruko veću brzinu na istom pojasu treba 4.8 dB, za četverostruku već 11.8 dB.“
  - en: "At 0 dB signal-to-noise ratio the capacity equals the bandwidth: 2.4 kHz gives at most 2400 bit/s. Twice
    the rate in the same band needs 4.8 dB, four times already 11.8 dB."
- **Terms** (50ohm hr, URM ch06): channel capacity — kapacitet kanala; bandwidth — širina pojasa;
  signal-to-noise ratio — omjer signal-šum; data rate — brzina prijenosa podataka; upper bound — gornja
  granica; noise — šum; decibel — decibel.
- **Misconceptions:** more power solves everything (capacity grows only logarithmically with SNR); a modem can
  beat the limit with clever modulation (no; it can only approach it); bandwidth in Hz and rate in bit/s are
  the same thing (only at 0 dB, URM ch06 distinguishes širina pojasa and propusnost).
- **Out of scope:** Nyquist's noiseless limit (`nyquist` applet), coding theory, MIMO.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh shannon-hartley sims/shannon-hartley` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/shannon-hartley/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
