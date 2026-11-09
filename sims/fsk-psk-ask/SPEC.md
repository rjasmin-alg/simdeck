<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fsk-psk-ask: ASK, FSK and PSK

One concept: **three ways to put bits on a carrier.** The same bits change the carrier's amplitude (ASK), its
frequency (FSK) or its phase (BPSK). Class: explorer (the state is derived from the params). Task:
`docs/tasks/w3/fsk-psk-ask.md`; catalogue `ham-fsk-psk-ask` (§4.10).

Sources: 50ohm.de, sections `ask_fsk_afsk`, `psk`, `afsk`, `modulationsarten` (Croatian translation in
`50ohm-contents-hr`; CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.), cited below as *50ohm*. The
receiver and the noise are this model's (derived), not 50ohm's. Numbers in this file are checked by `sim.test.js`
and were first computed with a script (NOTES.md).

## Units and constants

| Name | Value | Why |
|---|---|---|
| time | in bits (symbol periods); bit k runs from t = k to k + 1 | one symbol per bit (rule 4) |
| `SPB` | 48 samples per bit | smooth traces; 12 samples per cycle at the highest frequency, 4 cycles/bit |
| `CARRIER` | 3 cycles per bit (ASK and PSK) | an integer, so every bit starts at the same carrier phase |
| `FSK_F0`, `FSK_F1` | 2 and 4 cycles per bit (space 0, mark 1) | 2 cycles apart: the two tones are orthogonal over one bit |
| AFSK | mark 1200 Hz, space 2200 Hz, 1200 bit/s → 1 and 11/6 ≈ 1.8333 cycles per bit; a bit lasts 833.3 µs | APRS, Bell 202 *(check)*; 50ohm `afsk`: APRS 1200 bit/s on 144.800 MHz |
| `A1` | 1 | ASK amplitude of a 1; amplitude of PSK and FSK |
| `A0` | 0 with OOK on, 0.5 with OOK off | 50ohm: "mala amplituda" for 0; OOK = carrier off |
| `MAX_BITS` | 8 | the bit row has 1 to 8 cells |
| `SIGMA_MAX` | 2 | rms noise per sample at 100 %, in units of A1 |
| `BAND` | 0.5 … 5.5 cycles per bit | the noise band (the receiver's input filter) |
| patterns | `10110010` (default), `11101000`, `0101`, `10101010`, `11110000`, `00110101` | the `bits` select |

## Rules

1. **ASK** (50ohm `ask_fsk_afsk`). A 1 is sent as A1·sin(2π·3·t), a 0 as A0·sin(2π·3·t). OOK is the case A0 = 0
   (the carrier is switched off; CW is OOK). The mapping may be the other way round (50ohm); here 1 is the large
   amplitude.
2. **FSK** (50ohm `ask_fsk_afsk`, `afsk`). A 1 (mark) is sent at f1, a 0 (space) at f0; the amplitude is constant.
   The phase runs on across bit boundaries (continuous phase, as an AFSK modem does), so the trace has no jumps.
   With `afsk` on: f1 = 1200 Hz, f0 = 2200 Hz at 1200 bit/s, so a mark bit is exactly one cycle and a space bit
   1.83 cycles. AFSK is FSK at audio frequencies, sent through a voice transmitter; the A is audio, not amplitude.
3. **BPSK** (50ohm `psk`). A 0 is sin(2π·3·t + 0°), a 1 is sin(2π·3·t + 180°); amplitude and frequency stay the
   same. Because a bit is a whole number of cycles, the phase jumps exactly where two neighbouring bits differ:
   `jumps` lists the boundaries k (between bit k − 1 and k) with bits[k] ≠ bits[k − 1].
4. **Symbols** (50ohm `ask_fsk_afsk`: "Utvrđene amplitude i frekvencije … nazivaju se simboli"). Each scheme here has
   two symbols, one bit per symbol. More levels are out of scope (`qpsk`, `qam-ofdm`).
5. **Receiver** (derived). For bit k it correlates the received samples r of that bit with a reference:
   (2/N)·Σ r·sin and (2/N)·Σ r·cos, N = SPB, which gives 1 for a clean unit carrier of that frequency.
   - ASK and PSK use the carrier (3 cycles/bit) with a reference running on from t = 0 (coherent): I = the sin
     part, Q = the cos part. The point (I, Q) is drawn in the symbol view.
   - **ASK** decides by the envelope √(I² + Q²) against the midpoint (A0 + A1)/2: above it is 1.
   - **PSK** decides by the sign of I: I < 0 is 1 (180°).
   - **FSK** correlates with f0 and with f1 (reference restarted in each bit), takes the magnitudes m0 and m1, and
     decides 1 when m1 > m0. The point (m0, m1) is drawn in its symbol view.
   - **Tie-break: a tie decides 0 in every scheme** (envelope exactly at the midpoint, m1 = m0, I = 0).
   - Ideal points (no noise): ASK (A0, 0) and (A1, 0), on the positive I axis; PSK (+1, 0) and (−1, 0), opposite on
     the circle; FSK (1, 0) and (0, 1). Distances between the two symbols: **ASK 1** (A1 − A0 with OOK), **FSK
     √2 ≈ 1.4142**, **PSK 2** (2A). With AFSK the tones are not orthogonal over a bit: FSK ideal points
     (1.0238, 0.1835) and (0.1353, 1), distance 1.2068 (from the unrounded points). The ideal points are a bit that
     starts at phase 0; with AFSK the phase runs on and each bit starts at another phase, so even without noise the
     clean FSK points lie near, not on, the crosses (for 10110010 the marks at (0.135, 1) and (0.230, 1)). With OOK
     off, ASK's distance is 0.5.
   - With equal noise, the scheme whose symbols are closest fails first: ASK, then FSK, PSK last.
6. **Noise** (derived). One seeded noise sequence (mulberry32, as `Simdeck.rng`, seeded with seed·7919 + 13) is
   added, the same sample for sample, to all three traces, scaled by σ = SIGMA_MAX · noise/100. It is band-limited
   Gaussian noise: a sum of sinusoids at m/8 cycles per bit for m = 4 … 44 (the band 0.5 … 5.5 cycles/bit), each
   with independent standard normal sine and cosine weights of variance 1/41, so its variance per sample is 1
   (rms over the 384 samples of seed 7: 0.992). Out-of-band noise would not reach the decision anyway; leaving it
   out keeps the traces readable. A shorter bit string uses the first samples; the noise slider only scales them.

**Explorer state** (from the params): `bits, scheme, ook, afsk, noise, seed, sigma, spb, carrierCycles, f0, f1, a0,
a1, afskHz, samples {ask, fsk, psk}, clean {…}, points {…: [{x, y, sent, got}]}, ideal {…: [{bit, x, y}]},
decided {…}, errors {…}, errorAt {…}, distance {…}, jumps`. All three schemes are computed whatever `scheme` shows.
A `bits` value that is not 1–8 characters of 0/1 falls back to the default pattern.

## Params

`bits` select of the patterns plus click-to-flip on a cell (any 1–8-bit string); `scheme` choice all / ASK / FSK /
PSK (default all); `ook` toggle (default on); `noise` 0–100 % (default 0); `seed` 1–99 (default 1); `afsk` toggle
(default off).

## Presets and expected numbers

| Preset | Params | Expected |
|---|---|---|
| `three-ways` | 10110010, all, noise 0 | every decision right; PSK jumps at boundaries 1, 2, 4, 6, 7 |
| `cw-ook` | 11101000, ASK, OOK | A0 = 0: the carrier is off in bits 3, 5, 6, 7; no errors |
| `aprs-afsk` | 10110010, FSK, AFSK | f1 = 1 cycle, f0 = 1.8333 cycles per bit; bit 833.3 µs; no errors |
| `bpsk-phase` | 0101, PSK | jumps at 1, 2, 3; ideal points (+1, 0) and (−1, 0) |
| `noise-race` | 10110010, all, noise 40 %, seed 7 | **ASK 3 errors** (bits 1, 5, 7: decided 11110111), **FSK 1** (bit 1: 11110010), **PSK 0** |

Seed 7, rising noise: the first error appears at 27 % in ASK, 34 % in FSK and 93 % in PSK. Over seeds 1–99 at
40 % the mean error count per 8 bits is ASK 1.71, FSK 0.44, PSK 0.01. Seed 7 at 40 % with OOK off: ASK 2 errors;
with AFSK on: FSK 0 errors.

## Out of scope

QPSK and higher orders (`qpsk`, `qam-ofdm`), NRZI and bit stuffing in AX.25, demodulator circuits, spectra of the
keyed signals.
