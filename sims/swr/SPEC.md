<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# swr: specification

One concept: **mismatch reflects power; a standing wave forms on the line.** An explorer (no steps): the load, the
line's characteristic impedance and the line loss drive everything; the state is a pure function of the params.

Task: `docs/tasks/w3/swr.md`; catalogue `ham-swr` (§4.10). Sources: 50ohm.de, Croatian translation
(`50ohm-contents-hr/contents/sections/`): `swr.md` (N), `swr_2.md` (E), `swr_3.md` (A), `swr_meter_1.md`,
`swr_meter_2.md`; CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V. Every number below was checked with an
independent Python script (complex arithmetic for the envelope, the powers formula for the meter); the same numbers
are asserted in `sim.test.js`.

## Scene and units

A transmitter on the left, a feed line of **2.5 λ** and a load on the right. Position x runs from the transmitter
(x = 0) to the load (x = 2.5 λ); d = 2.5 − x is the distance from the load. Voltages are relative to the forward
wave's amplitude (1). The transmitter puts **P_V = 100 W** forward into the line at its end (the book's example,
`swr_2`); re-reflection at the transmitter is not modelled (the meter reads forward and reflected power separately).

## Params

| key | kind | values | default |
|---|---|---|---|
| `r` | range, index into `R_VALUES` (log steps) | 0…30 → 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5 Ω × 10⁰, 10¹, 10², and 1000 Ω | 17 (50 Ω) |
| `z0` | choice | 50, 75 Ω | 50 |
| `end` | choice | `load` (resistor R), `open`, `short` | `load` |
| `lossDb` | range | 0…10 dB, step 0.5, one way | 0 |
| `animate` | toggle | instantaneous voltage moving (page only; off under reduced motion) | on |

The task's "R range 1–1000 Ω, log steps" is the index `r`: ten values per decade, chosen so that on 50 Ω every row of
the book's table `e_swr_werte` is reachable (75 → 1.5, 100 → 2, 125 → 2.5, 150 → 3, 200 → 4, 300 → 6, 500 → 10,
1000 → 20) and on 75 Ω too (150 → 2, 25 → 3). The task's "open" and "short" buttons are the `end` choice; while it is
not `load` the R slider is disabled and says why.

## Rules

1. **Reflection factor and SWR of a resistive load** (`swr_3`): Γ = (R − Z0)/(R + Z0);
   SWR s = (1 + |Γ|)/(1 − |Γ|), equal to R/Z0 if R > Z0, 1 if R = Z0, Z0/R if R < Z0. The model computes the load's
   SWR as max(R, Z0)/min(R, Z0), which is exact (the |Γ| form gives 1.9999999999999998 for 100 Ω on 50 Ω).
2. **Reflected power** (`swr`, `swr_2`): the reflected fraction is |Γ|²; SWR from powers
   s = (√P_V + √P_R)/(√P_V − √P_R). P_V = 100 W, P_R = 25 W → s = 15/5 = 3 (`swr_2`).
3. **Envelope** on a lossless line (`swr_3`): |V(d)| = |1 + Γ·e^(−j2βd)| = √(1 + Γ² + 2Γ·cos 4πd) (d in λ).
   U_max = 1 + |Γ|, U_min = 1 − |Γ|, U_max/U_min = s; neighbouring maxima (and minima) are λ/2 apart; a maximum and
   the next minimum λ/4. **R > Z0** (Γ > 0): maximum at the load, maxima at d = 0, ½, 1, …; **R < Z0** (Γ < 0):
   minimum at the load, maxima at d = ¼, ¾, …; **R = Z0**: the envelope is flat at 1, no maxima or minima.
   The envelope is sampled at 201 points, every λ/80, so every maximum and minimum is a sample.
4. **Open or short end** (`swr`): |Γ| = 1 (open Γ = +1, short Γ = −1), SWR = ∞, all power reflected, U_min = 0.
   Open: voltage maximum at the end; short: voltage zero at the end.
5. **Line loss** L dB one way (`swr_3`, the "deceptive" cable loss): at the load P_V,load = P_V·10^(−L/10),
   P_R,load = |Γ|²·P_V,load; the reflected wave loses L dB again on the way back, so at the transmitter
   P_R/P_V = |Γ|²·10^(−2L/10). The meter at the transmitter therefore reads a better SWR than the load has.
   The meter at the load reads the load's SWR (rule 1). The envelope stays the lossless one (task: line loss changes
   only what the meter at the transmitter shows); the page says so when L > 0.
6. **Display:** an SWR above 99, or infinite, is shown as "∞" (the model's `shown()` returns null). R is clamped to
   1 Ω…10 kΩ in the model (the slider itself spans 1–1000 Ω). State is JSON-safe: an infinite SWR is `null`.
7. **SWR class** for "changed": 1 (s = 1), ≤ 2, ≤ 3, worse (∞ is worse). The meter values of a card get the
   highlighter when that card's class differs from the previous render's.

## Tie-breaks

- **R = Z0** is matched: Γ = 0 exactly, s = 1, flat envelope, `maxAtLoad` false, `minAtLoad` false.
- **Class boundaries are inclusive** and compared with a tolerance of 1e-9: s = 2 is "≤ 2", s = 3 is "≤ 3",
  s = 1 + 1e-12 is "1". (SWR from powers carries floating-point noise: R = 300 Ω gives 6.000000000000001.)
- **P_R ≥ P_V** (open or short end, no loss) gives SWR `null` (∞), never a division by zero or a negative SWR.
- **P_R = 0** (matched) gives SWR 1 from powers, at any loss.
- **Boundary of rule 6:** s = 99 is shown as 99; s = 99.01 and above as ∞ (R = 4950 Ω on 50 Ω: s = 99, shown;
  R = 5000 Ω: s = 100, ∞). Only reachable in the model; the slider stops at 1000 Ω (s = 20).
- **`end` other than `load` wins over `r`**: open or short ignores R.
- An `r` index outside 0…30 is clamped (and rounded); an unknown `z0` falls back to 50; `lossDb` is clamped to 0…10.

## State (derived from params)

`{ Z0, R (null for open/short), end, gamma, swrLoad (null = ∞), reflPct, lossDb, umax, umin, maxAtLoad, minAtLoad,
flat, envelope: [{ x, v }], maxima: [x], minima: [x], meter: { tx: { pv, pr, swr, reflPct }, load: { pv, pr, swr,
reflPct } }, prMeasured (= meter.tx.pr), swrMeter (= meter.tx.swr), classLoad, classTx }`.

`instant(gamma, phase)` (for the animation, not in the state): v(d, t) = cos(ωt + 2πd) + Γ·cos(ωt − 2πd), the forward
wave travelling toward the load plus the reflected wave travelling back; |v| never exceeds the envelope.

## Presets (expected numbers)

| id | params | Γ | SWR load | reflected | meter at transmitter | envelope |
|---|---|---|---|---|---|---|
| `matched` (`swr`) | R 50, Z0 50 | 0 | 1 | 0 % | SWR 1, P_R 0 W | flat at 1 |
| `book-100` (`swr_3`) | R 100, Z0 50 | +0.333 | 2 | 11.1 % (`e_swr_werte`) | SWR 2, P_R 11.1 W | max at load, 1.333 / 0.667 |
| `book-10` (`swr_3`) | R 10, Z0 50 | −0.667 | 5 | 44.4 % | SWR 5, P_R 44.4 W | min at load, 1.667 / 0.333 |
| `swr-3` (`swr_2`) | R 150, Z0 50 | +0.5 | 3 | 25 % | P_V 100 W, P_R 25 W → 3 | max at load |
| `folded-dipole` (`swr_3`, 240–300 Ω) | R 300, Z0 50 | +0.714 | 6 | 51.0 % | SWR 6 | max at load |
| `lossy-open` (`swr_3`, AG404) | open, loss 5 dB | +1 | ∞ | 100 % at the load | P_R 10 W = P_V/10, SWR 1.92 | max at the open end, U_min 0 |

Further checks: the half-and-half example of `swr_3` (half the power lost each way) is loss 3.0103 dB → meter SWR 3;
the slider's 3 dB gives 3.01. The open end at 0.5 / 1 / 3 / 10 dB reads 17.39 / 8.72 / 3.01 / 1.22. `book-100` with
3 dB loss reads 1.40 at the transmitter.

## Out of scope

Reactive loads and the Smith chart, matching networks and antenna tuners, impedance transformation along the line,
velocity factor, re-reflection at the transmitter, the envelope of a lossy line.
