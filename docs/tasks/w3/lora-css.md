# lora-css: LoRa chirp spread spectrum

| | |
|---|---|
| Task | `lora-css` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-lora-css` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/lora-css/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `radio-networks`, `modulation` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **chirps, spreading factor vs airtime vs range**.

The student: change SF and bandwidth.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- No local course material on the modulation itself. Use Semtech, *LoRa Modem Designer's Guide* (AN1200.13) and the "Time on air" section and sensitivity table of Semtech's LoRa transceiver data sheets; ETSI EN 300 220 (868 MHz duty cycle) *(check)*. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, "Bežične tehnologije jedna uz drugu: domet, propusnost, potrošnja, vlasništvo" (LPWAN, LoRaWAN) and Primjer 4 "biramo bežičnu tehnologiju za udaljeni senzor"; `/home/rjasmin/projects/single-page-labs/lora-mesh-usporedba-v3.html` ("LoRa ≠ LoRaWAN") for the link.
- Catalogue seed: idea only (Lora-Wideband-Decoder is PolyForm Noncommercial: no code or text reuse).

## Model and presets

- **Scene:** left, a time–frequency plot of chirps: a preamble of up-chirps (frequency rising linearly across
  the bandwidth BW, wrapping at the top), then data symbols, each a chirp that starts at one of 2^SF cyclic
  offsets (the symbol value); the symbol duration is drawn to scale for the current SF and BW. Right, a card
  and three bars: time on air for the packet, relative range, and the wait imposed by a 1 % duty cycle; a
  small table SF7…SF12 with the current row highlighted.
- **State (explorer, derived from params):** `{ SF, BW, CR, payload, Ts, symbols, toaMs, bitRate, snrLimit,
  sensitivityDbm, rangeFactor, dutyWaitS, chirps: [{start, offset}] }`.
- **Params drive live:** SF and BW redraw the chirps and every bar; payload and coding rate change only the
  time on air.
- **Rules** (Semtech, *LoRa Modem Designer's Guide* AN1200.13 and the LoRa transceiver data sheets'
  "Time on air" formula; vendor-specific because LoRa is one vendor's modulation):
  1. Symbol duration T_s = 2^SF / BW; one symbol carries SF bits (2^SF possible chirp offsets).
  2. Raw bit rate R_b = SF · (BW / 2^SF) · 4/(4 + CR) (CR 1…4 for 4/5…4/8).
  3. Time on air = (n_preamble + 4.25)·T_s + n_payload·T_s, with n_payload = 8 + max(⌈(8·PL − 4·SF + 28 + 16·CRC
     − 20·H)/(4·(SF − 2·DE))⌉·(CR + 4), 0); explicit header (H = 0), CRC on, low-data-rate optimisation DE = 1
     for SF11 and SF12 at 125 kHz; preamble 8.
  4. Demodulation works below the noise: SNR limit −7.5 dB at SF7, 2.5 dB lower per SF step, −20 dB at SF12
     (data sheet table) *(check)*. Sensitivity = −174 + 10·log₁₀(BW) + NF + SNR_limit, NF = 6 dB *(derived)*.
  5. Range factor relative to SF7 = 10^(Δsensitivity / (10·n)), n = 2 free space, 3.5 built-up *(illustrative)*.
  6. Duty cycle 1 % (EU 868 MHz sub-band, ETSI EN 300 220 *(check)*): after a packet the device must stay
     silent 99 × time on air.
- **Params:** `SF` range 7–12 (default 7); `BW` choice 125 / 250 / 500 kHz (default 125); `CR` choice 4/5 …
  4/8 (default 4/5); `payload` range 1–50 bytes (default 20); `n` choice free space / built-up.
- **Presets** (computed with rules 1–6, payload 20 B, 125 kHz, CR 4/5):
  1. `sf7`: T_s 1.024 ms, 43 symbols, ≈ 56.6 ms on air, ≈ 5.5 kbit/s raw, sensitivity ≈ −124.5 dBm, wait 5.6 s.
  2. `sf12`: T_s 32.8 ms, ≈ 1319 ms on air (23× SF7), ≈ 293 bit/s, −137 dBm, range × 4.2 (free space) or × 2.3
     (built-up), wait ≈ 131 s.
  3. `sf9-bw`: SF9 at 125 / 250 / 500 kHz → 185 / 93 / 46 ms on air; doubling BW halves airtime and costs 3 dB.
  4. `sf-step`: SF10 → SF11: airtime 371 → 741 ms (× 2) for 2.5 dB more link budget.
- **Steps:** explorer, none.
- **Legend:** up-chirp (rising line), symbol chirp with its offset marked (dot at the start + value), preamble
  (bracket), wrap (dashed jump). "Changed" marks the bars that changed by more than 10 %.
- **Captions:**
  - hr: „SF12: svaki simbol traje 32.8 ms i nosi 12 bitova. Paket od 20 bajtova traje 1.3 s, 23 puta dulje
    nego na SF7, a domet raste tek oko 4 puta (u slobodnom prostoru).“
  - en: "SF12: each symbol lasts 32.8 ms and carries 12 bits. A 20-byte packet takes 1.3 s, 23 times longer than
    at SF7, while range grows only about 4 times (free space)."
- **Terms:** chirp — cvrkut (chirp) (check); spread spectrum — prošireni spektar (50ohm `vielfachzugriff`);
  spreading factor — faktor širenja (check); bandwidth — širina pojasa; time on air — vrijeme u eteru (check);
  sensitivity — osjetljivost; duty cycle — radni ciklus (check); link budget — bilanca veze (check).
- **Misconceptions:** SF12 is "better" (it costs 23× airtime and duty-cycle wait); LoRa = LoRaWAN (one is the
  modulation, the other the network protocol; URM ch17); a signal below the noise cannot be received (rule 4).
- **Out of scope:** LoRaWAN classes and the network server, mesh routing (`lora-mesh-usporedba-v3` in
  single-page-labs), regional channel plans, dechirp/FFT receiver internals.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lora-css` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lora-css sims/lora-css` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lora-css/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
