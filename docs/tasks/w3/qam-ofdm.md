# qam-ofdm: QAM and OFDM

| | |
|---|---|
| Task | `qam-ofdm` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-qam-ofdm` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/qam-ofdm/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | HAM, URM |
| Topic / tags / level | `radio` / `modulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `qpsk` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **constellation size vs noise; subcarriers**.

The student: change order and SNR, watch errors.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/qpsk/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/qam.md` (amplitude and phase per symbol, 8-QAM figure), `ofdm.md` (subcarrier spacing, lower symbol rate per carrier, narrow-band interference hits few carriers, multipath), `psk.md` (BPSK/QPSK/8-PSK, constellation, decision regions, Gray code, QPSK mapping) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- `/home/rjasmin/projects/50ohm-contents-hr/contents/html/applet_qpsk.html` (the `qpsk` sim's original: Gaussian noise 0–60 %, nearest-symbol decision).
- J. G. Proakis, M. Salehi, *Digital Communications*, 5th ed., §4.3 (M-QAM symbol error probability). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: 50ohm qam, ofdm; extends 50ohm-qpsk

## Model and presets

- **Scene:** mode 1 "QAM": a constellation diagram (I/Q axes) with the ideal points for the chosen order
  (4/16/64/256), their Gray-coded bit labels (16-QAM and up: labels on hover or for one quadrant), the decision
  regions as a grid, and a cloud of received points (seeded noise) coloured by correct / wrong decision; a card
  with bits per symbol, d_min, symbol errors counted / sent, and the theoretical SER. Mode 2 "OFDM": a spectrum
  of N subcarriers (sinc-shaped, each null on its neighbours' peaks), a narrow-band interferer that can be
  placed on one subcarrier, and a per-subcarrier error count.
- **State (explorer, derived from params):** `{ mode, M, bitsPerSymbol, snrDb, points: [{i, q, sent, decided,
  ok}], ser, serTheory, dmin, ofdm: {n, spacingKHz, symbolMs, interfererAt, errorsPerCarrier: [..]} }`.
- **Params drive live:** order, SNR and seed regenerate the cloud (N = 400 symbols, `Simdeck.rng(seed)`, Box–
  Muller noise); OFDM params redraw the comb and the hit carrier.
- **Reused from `qpsk`** (50ohm `applet_qpsk.html`: four ideal points, Gaussian noise on I and Q, nearest-symbol
  decision regions, Gray mapping 11 → 45°, 01 → 135°, 00 → 225°, 10 → 315° from 50ohm `psk`). **New:** square
  M-QAM, SNR in dB instead of a noise percentage, SER counts and theory, the OFDM mode.
- **Rules:**
  1. Square M-QAM: √M levels per axis, unit average symbol energy, so d_min = √(6/(M − 1)): 1.414 (4), 0.632
     (16), 0.309 (64), 0.153 (256); each step up halves d_min, ≈ 6 dB more SNR for the same error rate.
     Bits per symbol = log₂M (50ohm `qam`, `psk`).
  2. Noise: I and Q each get Gaussian noise with variance (1/SNR)/2 (Es/N0 = SNR).
  3. Decision: nearest ideal point (axis-wise thresholds midway); Gray coding so neighbours differ in one bit
     (50ohm `psk`).
  4. Theory line: SER = 1 − (1 − 2(1 − 1/√M)·Q(√(3·SNR/(M − 1))))² (Proakis, *Digital Communications*, §4.3).
  5. OFDM: subcarriers spaced Δf = 1/T_symbol, so each sits on its neighbours' nulls (orthogonal); lower symbol
     rate per carrier → longer symbols → less inter-symbol interference; a narrow-band interferer hits only the
     carrier(s) under it (50ohm `ofdm`).
  6. Same total rate: N carriers × (rate per carrier) stays constant when N changes (50ohm `ofdm`).
- **Params:** `mode` choice QAM / OFDM (default QAM); `M` choice 4 / 16 / 64 / 256 (default 16); `snr` range
  0–35 dB (default 20); `seed` range 1–99; `n` choice 8 / 16 / 32 subcarriers (OFDM); `interferer` range off /
  carrier index.
- **Presets** (theory values from rule 4, checked with a script; counts depend on the seed):
  1. `qpsk-20` (links `qpsk`): M = 4 at 20 dB → SER ≈ 0, clean clusters.
  2. `16qam-20`: M = 16 at 20 dB → SER ≈ 1.2·10⁻⁵ (none of 400 wrong expected).
  3. `64qam-20`: M = 64 at 20 dB → SER ≈ 5 %, about 20 of 400 wrong: same noise, more bits, more errors.
  4. `64qam-25`: M = 64 at 25 dB → SER ≈ 1.8·10⁻⁴: 5 dB buys it back.
  5. `ofdm-interferer` (from 50ohm `ofdm`): 16 carriers, interferer on carrier 5 → errors only on carrier 5;
     with FEC (out of scope, one line) the data survive.
- **Steps:** explorer, none.
- **Legend:** ideal point (cross), received ok (dot), received wrong (ring + "×"), decision boundary (line);
  OFDM: subcarrier (outline), hit carrier (hatched). "Changed" marks the error count when it changes class
  (0, < 1 %, ≥ 1 %).
- **Captions:**
  - hr: „64-QAM nosi 6 bitova po simbolu, ali su točke 4.6 puta bliže nego kod QPSK-a. Uz isti šum (20 dB) oko 5 %
    simbola pada u susjedno područje odluke.“
  - en: "64-QAM carries 6 bits per symbol, but its points are 4.6 times closer than QPSK's. With the same noise
    (20 dB) about 5 % of symbols land in a neighbour's decision region."
- **Terms** (50ohm hr): quadrature amplitude modulation — kvadraturna amplitudna modulacija; constellation diagram —
  konstelacijski dijagram; symbol — simbol; decision region — područje odluke; Gray code — Grayev kod; OFDM —
  ortogonalno frekvencijsko multipleksiranje; subcarrier — nositelj (podnositelj); inter-symbol interference —
  intersimbolna interferencija; signal-to-noise ratio — omjer signal-šum.
- **Misconceptions:** more points are free speed (preset 3); OFDM carriers need guard bands between them (they
  overlap, orthogonality separates them); noise moves points only in amplitude (it moves them in I and Q).
- **Out of scope:** channel coding, adaptive modulation, cyclic prefix and FFT implementation, phase noise,
  non-square QAM (8-QAM from 50ohm's figure: one line).
- **Note for the coordinator:** this entry holds two concepts (QAM order vs noise; OFDM subcarriers). Built
  as two modes it stays one page, but the OFDM mode is a separate 3–5 minute demo; consider splitting it into
  its own task.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh qam-ofdm sims/qam-ofdm` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/qam-ofdm/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
