<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# shannon-hartley: specification

One concept: **channel capacity from bandwidth and signal-to-noise ratio**. Task file
`docs/tasks/w3/shannon-hartley.md`, catalogue `ham-shannon` (§4.10). Class: explorer (no steps; the params drive the
picture live).

Sources: [50ohm] `50ohm-contents-hr/contents/sections/shannon_hartley_gesetzt.md` (CC BY 4.0, 50ohm.de-Autorenteam,
AJW-Referat des DARC e.V.); [URM] `uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`, "Kako signal nosi
bitove" (nominal throughput as the ceiling, achieved rate below it; RFC 5136); [Sh49] C. E. Shannon, "Communication
in the Presence of Noise", *Proc. IRE* 37(1), 1949; [FT8] K. Taylor et al., "The FT4 and FT8 Communication
Protocols", *QEX*, 2020 *(check)*.

## Params

| key | meaning | range | default |
|---|---|---|---|
| `b` | bandwidth B, an index into the log grid | grid 10 Hz … 20 MHz | 2.4 kHz |
| `snr` | S/N in dB | −30 … +40, step 1 | 10 |
| `target` | show a target rate | on / off | off |
| `rate` | target rate R, an index into the log grid (shown only with `target`) | grid 1 bit/s … 1 Gbit/s | 9.6 kbit/s |

**Log grid.** 13 values per decade, mantissas 1, 1.2, 1.5, 2, 2.4, 2.5, 3, 4, 4.8, 5, 6, 8, 9.6, stored in tenths so
every value is exact (no 2400.0000001). 2.4 and 2.5 are the two reference bandwidths of rule 5, 4.8 and 9.6 are
twice and four times 2.4 (the caption's numbers). The grid runs 1 … 10⁹; B uses 10 Hz … 20 MHz (index 13 … 94), R
uses all of it. Out-of-range or non-integer params are rounded and clamped.

## Rules

1. **Capacity** [50ohm; Sh49]: C = B · log₂(1 + S/N) bit/s, S/N linear, N the noise inside B only.
2. **dB to linear** [50ohm]: S/N = 10^(dB/10). At 0 dB, S/N = 1, log₂ 2 = 1 and C = B (the book's memory rule).
3. **Inverse** [50ohm]: the S/N needed for a target rate R in bandwidth B is 2^(R/B) − 1, so required dB =
   10·log₁₀(2^(R/B) − 1). It grows about 3.01 dB per extra bit/s per Hz: R ≫ B makes it explode ("potrebni omjer
   signal-šum naglo raste"). Computed with `expm1` (small R/B) and, above R/B = 60, as
   10·(R/B)·log₁₀ 2 + 10·log₁₀(1 − 2^−(R/B)), so it never overflows (1 Gbit/s in 10 Hz: 3.01·10⁸ dB).
4. **Upper bound** [50ohm; URM]: C is a ceiling. A target R is *below* (R < C: reachable in principle, real systems
   need good error correction to get close), at the *limit* (R = C) or *above* (R > C: no modulation reaches it).
5. **Reference bandwidth** [50ohm in-depth note]: an SNR that software measures in a 2.4 kHz (or 2.5 kHz) reference
   bandwidth is a different quantity and cannot go into the formula directly when the signal is narrower. The FT8
   marker uses the reference-band value and says so.

## Tie-breaks

- **R = C** (to a relative 10⁻⁹) is `limit`, not `below`: the bound is approached, never beaten. Happens on the grid
  exactly at 0 dB with R = B (required S/N = 0 dB).
- **C exactly a power of ten** counts as that decade reached: `decade(1000) = 3`, and the rounding of
  B·log₂(…) is absorbed (`decade(999.9999999999) = 3`). The page marks C "changed" when the decade differs from
  the one drawn before.
- **Width axis**: the smallest of 1, 2, 5, 10 × 10^k that holds B; B itself when B is one of them (10 MHz → 10 MHz,
  20 MHz → 20 MHz, 2.4 kHz → 5 kHz, 4.8 kHz → 5 kHz, so doubling 2.4 → 4.8 kHz doubles the drawn width).

## State (derived from params)

`{ B, snrDb, snrLin, bitsPerHz, C, decade, axis, target, rateRatio, requiredSnrDb, verdict, examples: [{ id, B,
snrDb, bitsPerHz, C, ref }] }`; `target`, `rateRatio`, `requiredSnrDb` and `verdict` are null with the target off.

## Example systems (fixed markers on the C/B curve and in the table)

| id | B | SNR | C (rule 1) | source |
|---|---|---|---|---|
| `ft8` (FT8/WSPR) | 2.5 kHz (reference) | −20 dB | 35.9 bit/s | 50ohm (WSPR/FT8 work at very poor SNR); reference-band SNR, rule 5. FT8's real payload: 77 bits per 12.64 s transmission ≈ 6.1 bit/s [FT8] *(check)*; the signal is about 50 Hz wide *(check)* |
| `ssb` | 2.4 kHz | 10 dB | 8.30 kbit/s | task file preset `ssb-10` |
| `hamnet` | 10 MHz | 20 dB | 66.6 Mbit/s | 50ohm (HAMNET in upper UHF/SHF for wide bandwidth) |
| `wlan` | 20 MHz | 30 dB | 199 Mbit/s | task file preset `hamnet` |

## Presets (keys 1–6), numbers checked with a script (NOTES.md)

1. `zero-db`: 2.4 kHz, 0 dB → C = 2400 bit/s = B. Twice the rate in the same band needs 4.77 dB (2² − 1 = 3), four
   times 11.76 dB (2⁴ − 1 = 15).
2. `ssb-10`: 2.4 kHz, 10 dB → 8.30 kbit/s (8302.6); at 30 dB → 23.9 kbit/s (23 921): 20 dB more for not even 3×.
3. `double-b`: 4.8 kHz, 10 dB → 16.6 kbit/s (16 605): doubling B doubles C; doubling S/N instead (2.4 kHz at 13 dB)
   gives only 10.5 kbit/s (10 534) *(derived)*.
4. `weak-signal`: 2.5 kHz, −20 dB → 35.9 bit/s (35.89) ceiling; FT8 carries about 6 bit/s.
5. `hamnet`: 10 MHz, 20 dB → 66.6 Mbit/s (66 582 115); WLAN at 20 MHz and 30 dB → 199 Mbit/s (199 344 525).
6. `rate-above-b` *(added, rule 3)*: 2.4 kHz, 10 dB, target 48 kbit/s = 20·B → needs 60.2 dB (2²⁰ − 1); `above`.

## Page

- Stage: a rectangle with width B (on a 0…axis scale) and height log₂(1 + S/N) (0…14 bit/s per Hz), area C written
  inside; a dashed line at height 1 (0 dB: C = B); with a target, a dashed line at R/B (an arrow off the top when
  R/B > 14). Beside it the formula with the current numbers, the curve C/B against SNR (−30…40 dB) with the current
  point, the target's required SNR and the four example markers, and a table of the examples (a click loads B and
  SNR).
- Legend: width = bandwidth, height = log₂(1 + S/N), area = capacity (filled), example system (labelled dot), target
  rate (dashed), changed (C crossed a power of ten).
- Caption: at 0 dB the task file's caption (C = B, 4.8 dB and 11.8 dB for twice and four times); otherwise the
  numbers, and the target's required SNR and verdict when the target is on.
- Out of scope: Nyquist's noiseless limit (`nyquist`), coding theory, MIMO.
