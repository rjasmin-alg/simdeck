# fsk-psk-ask: ASK, FSK and PSK

| | |
|---|---|
| Task | `fsk-psk-ask` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-fsk-psk-ask` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/fsk-psk-ask/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | HAM, URM |
| Topic / tags / level | `radio` / `modulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **three ways to put bits on a carrier**.

The student: type bits, switch modulation.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/ask_fsk_afsk.md` (ASK, OOK/CW, FSK, "simboli"), `psk.md` (PSK, BPSK 0°/180°, constellation), `afsk.md` (AFSK at audio frequencies, APRS 1200 bit/s on 144.800 MHz), `modulationsarten.md` (overview) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- Bell 202 tones (1200/2200 Hz) for APRS AFSK: APRS Protocol Reference 1.0.1 *(check)*. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: SigDigger (ideas only; its LICENSE is LGPL-3 text, nothing copied).

## Model and presets

- **Scene:** the bit sequence on top (one cell per bit), below it three carrier traces aligned to the bit cells:
  ASK, FSK, PSK (or one at a time, chosen by the switch), each with the symbol boundaries marked; next to each a
  small constellation/symbol view (ASK: points on the positive I axis, PSK: points on the circle, FSK: two
  frequency markers). A noise slider adds the same seeded noise to all three; each trace shows the receiver's
  decisions and the bit errors.
- **State (explorer, derived from params):** `{ bits: '10110010', scheme, carrierCycles, f0, f1, a0, a1,
  noise, seed, samples: {ask: [..], fsk: [..], psk: [..]}, decided: {ask, fsk, psk}, errors: {ask, fsk, psk} }`.
- **Params drive live:** clicking a bit cell flips it (stage control); the scheme switch and the noise redraw.
- **Rules** (50ohm `ask_fsk_afsk`, `psk`, `afsk`):
  1. ASK: 1 → amplitude A1, 0 → A0; OOK when A0 = 0 (CW is OOK). The mapping may be reversed (50ohm).
  2. FSK: 1 → f1 (mark), 0 → f0 (space); amplitude constant. AFSK = FSK at audio frequencies sent through a
     voice transmitter; APRS uses 1200 bit/s AFSK with 1200 Hz mark and 2200 Hz space (Bell 202 *(check)*).
  3. BPSK: 0 → 0°, 1 → 180° (50ohm mapping); amplitude and frequency constant; the phase jumps at symbol
     boundaries.
  4. Symbols: each scheme here has 2 symbols, 1 bit per symbol (more levels: `qam-ofdm`).
  5. Receiver (model, derived): ASK decides by envelope against the midpoint (A0 + A1)/2; FSK by which of the
     two frequencies has more energy in the bit; PSK by the sign of the correlation with the reference carrier.
     With equal noise, ASK fails first (its symbols are closest in the constellation: distance A1 − A0 vs 2A for
     BPSK).
  6. Noise is seeded (`Simdeck.rng`), so the same seed gives the same errors in every scheme.
- **Params:** `bits` select of patterns (default 1011 0010) plus click-to-flip; `scheme` choice ASK / FSK / PSK /
  all (default all); `ook` toggle (default on: A0 = 0); `noise` range 0–100 % (default 0); `seed` range 1–99;
  `afsk` toggle (FSK at 1200/2200 Hz, 1200 bit/s).
- **Presets:**
  1. `three-ways` (from 50ohm `ask_fsk_afsk`/`psk` figures): 1011 0010, no noise: the same bits as amplitude,
     frequency and phase changes.
  2. `cw-ook`: ASK with A0 = 0 on 1110 1000 — a keyed carrier.
  3. `aprs-afsk` (from 50ohm `afsk`): FSK at 1200 Hz / 2200 Hz, 1200 bit/s: a mark bit is one cycle of 1200 Hz,
     a space bit ≈ 1.83 cycles of 2200 Hz.
  4. `bpsk-phase`: PSK on 0101: visible 180° jumps at each boundary; constellation points opposite on the circle.
  5. `noise-race` (derived): noise 40 %, seed 7: ASK makes errors first, then FSK, PSK last (exact counts fixed
     by the seed: compute and record in SPEC.md).
- **Steps:** explorer, none.
- **Legend:** bit 1 / 0 (filled / hollow cell), symbol boundary (dotted line), decision error (× under the bit),
  phase jump (small arc). "Changed" marks bit cells flipped since the last state.
- **Captions:**
  - hr: „Isti bitovi, tri načina: ASK mijenja amplitudu, FSK frekvenciju, a PSK fazu nositelja. Kod PSK-a se na
    granici simbola titraj nastavlja pomaknut za 180°.“
  - en: "Same bits, three ways: ASK changes the carrier's amplitude, FSK its frequency and PSK its phase. With PSK
    the oscillation continues shifted by 180° at the symbol boundary."
- **Terms** (50ohm hr): amplitude shift keying — amplitudska manipulacija; frequency shift keying — frekvencijska
  manipulacija; phase shift keying — fazna manipulacija; on-off keying — OOK (uključen/isključen nositelj);
  carrier — nositelj; symbol — simbol; AFSK — audiofrekvencijska manipulacija (AFSK) (check).
- **Misconceptions:** PSK changes the frequency (it changes the phase; the frequency is constant); AFSK means
  amplitude (50ohm: the A is audio); all three are equally robust (preset 5).
- **Out of scope:** QPSK and higher orders (`qpsk`, `qam-ofdm`), NRZI and bit stuffing in AX.25, demodulator
  circuits, spectra of the keyed signals.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `fsk-psk-ask` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh fsk-psk-ask sims/fsk-psk-ask` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/fsk-psk-ask/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
