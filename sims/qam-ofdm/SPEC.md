<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# qam-ofdm: QAM and OFDM

One concept: **constellation size against noise; subcarriers.** More points in the constellation carry more bits per
symbol, but at the same energy they sit closer together, so the same noise pushes more received points across a
decision boundary. OFDM spreads the same symbols over many slow subcarriers that overlap without disturbing each other,
so a narrow-band interferer spoils only the carrier under it. Class: explorer (the state is derived from the params).
Task: `docs/tasks/w3/qam-ofdm.md`; catalogue `ham-qam-ofdm` (§4.10). Builds on `sims/qpsk` (§ Reuse).

Sources: 50ohm-contents-hr `contents/sections/qam.md`, `ofdm.md`, `psk.md` and `contents/html/applet_qpsk.html`
(CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.), cited as *50ohm*; J. G. Proakis, M. Salehi, *Digital
Communications*, 5th ed., §4.3, cited as *Proakis* (not available offline: rule 4 is the task file's statement of it,
checked against a Monte Carlo run instead, see Checks). Every number in this file is checked by `sim.test.js` and was
first computed with a script.

## Units and constants

| Name | Value | Why |
|---|---|---|
| `ORDERS` | M = 4, 16, 64, 256 | task |
| `SYMBOLS` | 400 symbols per QAM cloud | task |
| `OFDM_SYMBOLS` | 384 = the largest multiple of 32 up to 400 (48, 24 or 12 per carrier for N = 8, 16, 32) | so every carrier carries the same number of symbols *(choice)* |
| SNR | 0 … 35 dB, Es/N0, integer dB | task |
| seed | 1 … 99 | task |
| `NS` | N = 8, 16, 32 subcarriers | task |
| `RATE_KBD` | 16 kBd total symbol rate, the same for every N | rule 6 *(illustrative)* |
| `ECHO_MS` | 0.1 ms multipath echo, compared with the symbol length | rule 5 *(illustrative)* |
| `JAM` | interferer power on its carrier = 1 × the signal (0 dB) | *(illustrative)*: strong enough to spoil the carrier |

Defaults: mode QAM, M = 16, SNR 20 dB, seed 21, N = 16, interferer off.

## Rules

1. **Square M-QAM** (50ohm `qam`, `psk`): √M levels per axis at a·(2k − (√M − 1)), k = 0 … √M − 1, with
   a = √(3 / (2(M − 1))), so the average symbol energy over all M points is 1. d_min = 2a = √(6 / (M − 1)):
   1.414 (4), 0.632 (16), 0.309 (64), 0.153 (256). Each step up roughly halves d_min (×0.447, ×0.488, ×0.497), ≈ 6 dB
   more SNR for the same error rate. Bits per symbol = log₂M: 2, 4, 6, 8. QPSK's points are 1.414 / 0.309 = 4.58 ≈ 4.6
   times further apart than 64-QAM's (the caption).
2. **Noise:** I and Q each get Gaussian noise of variance (1/SNR)/2 (SNR = Es/N0 linear, Es = 1), so σ = √(1/(2·SNR)):
   0.0707 at 20 dB. The draws are unit normals (Box–Muller, from `qpsk`) scaled by σ, fixed per seed (the generator
   is mulberry32 = `Simdeck.rng`, started at `seed·7919 + 13` as in `qpsk`, not at `seed` as the task file writes;
   the preset counts below depend on it): per symbol one
   uniform u (the symbol sent is ⌊u·M⌋) and two normals (I, Q). Changing M or the SNR keeps the draws. Received points
   are rounded to 4 decimals, then decided.
3. **Decision:** per axis the nearest level, with thresholds midway at a·(2k + 2 − √M). **Tie-break:** a value exactly
   on a threshold goes to the upper level (for QPSK: a point on an axis counts to the positive side, as `qpsk`).
   Symbol index = kI·√M + kQ; its bits are the Gray code of kI then of kQ (log₂√M bits each), so horizontal and
   vertical neighbours differ in one bit (50ohm `psk`). For M = 4 this is `qpsk`'s mapping: 11 at 45°, 01 at 135°,
   00 at 225°, 10 at 315°.
4. **Theory** (Proakis §4.3): SER = 1 − (1 − p)² with p = 2(1 − 1/√M)·Q(√(3·SNR/(M − 1))), computed as 2p − p² so a
   tiny p is not lost. Q(x) = ½·erfc(x/√2), erfc to a fractional error < 1.2·10⁻⁷ (Chebyshev fit, Numerical Recipes).
5. **OFDM** (50ohm `ofdm`): N subcarriers spaced Δf = 1/T (T = symbol length per carrier), carrier c = 1 … N at
   (c − (N + 1)/2)·Δf from the centre. Each carrier's spectrum is sinc((f − f_c)·T); at every other carrier's centre it
   is 0 (orthogonal: they overlap without guard bands). Longer symbols suffer less inter-symbol interference: the echo
   of 0.1 ms is 20 % (N = 8), 10 % (16), 5 % (32) of a symbol, and 160 % of the 0.0625 ms symbol of one carrier at
   16 kBd. A narrow-band interferer on carrier j adds noise of power `JAM` to carrier j only (it sits on the other
   carriers' nulls).
6. **Same total rate** (50ohm `ofdm`): rate per carrier = 16 kBd / N, T = N / 16 kBd, Δf = 16 kHz / N:
   N = 8 → 2 kBd, 0.5 ms, 2 kHz; N = 16 → 1 kBd, 1 ms, 1 kHz; N = 32 → 0.5 kBd, 2 ms, 0.5 kHz. N × rate = 16 kBd always.
   OFDM symbol k (0 … 383) rides on carrier (k mod N) + 1, with the same draws as the QAM cloud's first 384 symbols
   and the order M and SNR of the QAM params.

Error class (the "changed" mark): `none` for 0 errors, `low` under 1 % of the symbols sent, `high` at 1 % or more.
**Tie-break:** exactly 1 % is `high` (4 of 400).

## Expected numbers (seed 21)

| Preset | Params | Theory SER | Counted |
|---|---|---|---|
| 1 `qpsk-20` | QAM, M 4, 20 dB | 1.5·10⁻²³ | 0 / 400 |
| 2 `16qam-20` | QAM, M 16, 20 dB | 1.16·10⁻⁵ | 0 / 400 |
| 3 `64qam-20` | QAM, M 64, 20 dB | 5.03 % | 20 / 400, 20 bit errors (one bit each: Gray) |
| 4 `64qam-25` | QAM, M 64, 25 dB | 1.82·10⁻⁴ | 0 / 400 |
| 5 `ofdm-interferer` | OFDM, N 16, carrier 5, M 16, 20 dB | 74.2 % on carrier 5 (effective SNR 1/(0.01 + 1) ≈ −0.04 dB) | 18 / 24 on carrier 5, 0 on the 15 others |

Theory at the other points (for the table on the page): M = 256 at 20 dB 45.3 %, at 30 dB 0.113 %; M = 16 at 15 dB
1.78 %; M = 4 at 10 dB 0.156 %.

## Reuse

From `sims/qpsk/sim.js` @ `2136a30` (not in `models/`): `rng` (mulberry32), `gaussian` (Box–Muller with the zero
guard), `round4`, the mapping and the axis tie-break. New: square M-QAM, SNR in dB, SER counts and theory, OFDM.

## Out of scope

Channel coding (with FEC the interfered carrier's data survive: one line on the page), adaptive modulation, the cyclic
prefix and the FFT, phase noise, non-square QAM (50ohm's 8-QAM figure: one line).
