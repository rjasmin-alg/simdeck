<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fft-waterfall: specification

One concept: **the sample rate sets the span, the FFT size sets the resolution** (and the resolution in frequency is
paid for with resolution in time). Task: `docs/tasks/w3/fft-waterfall.md`; catalogue `ham-fft-waterfall` (§4.10).
Class: explorer (no steps). Every number below was checked with a script (`NOTES.md`, "Numbers checked").

## Scene

Top: the amplitude spectrum of the newest FFT block, dBFS against frequency, the tuned (centre) frequency in the
middle, the span −fs/2 … +fs/2 (or a zoomed part of it). Below it, sharing the frequency axis: the waterfall, one row
per FFT block, newest at the top, 40 rows, brightness = power. Beside them a card: span, bin width Δf, block
duration, rows per second, the 40-row history in seconds, bins per 12.5 kHz channel, the two-carrier test, and the
strongest signal found (DC guard excluded).

## Params

| key | values | default | meaning |
|---|---|---|---|
| `fs` | 0.25, 2.5, 12.5 (MSPS) | 2.5 | complex (I/Q) sample rate |
| `N` | 1024, 4096, 32768, 65536 | 32768 | FFT size (points = bins) |
| `band` | `2m`, `70cm` | `2m` | tuned to 145.000 MHz or 435.000 MHz (HamMonitor: centre of 144–146 and 430–440 MHz) |
| `filter` | on/off | on | the analogue (anti-aliasing) filter in front of the sampler |
| `zoom` | 0 … 13 | 13 | the view width, index into 1, 2, 5, 10, 20, 50, 100, 200, 500 kHz, 1, 2, 5, 10, 20 MHz; a width ≥ fs shows the whole span |
| `focus` | `dc`, `pair`, `burst`, `strong` | `dc` | what a zoomed view is centred on |

The task names `centre` (select) for the band; it is `band` here, a two-way choice (the kit's `select` is for
more than five options). `focus` is added: a zoom needs a centre (see NOTES, deviations).

## Signals (fixed per band, derived from the band param)

Offsets are from the tuned frequency. FM signals are flat over ±5.5 kHz (Carson: 2·(2.5 kHz deviation + 3 kHz
audio) = 11 kHz, the 12.5 kHz NFM channel); CW is one line. Level = the CW tone's power, or the FM signal's total power.

| id | kind | 2 m | 70 cm | level | on |
|---|---|---|---|---|---|
| `pair` (two) | cw | 144.0300 and 144.0302 MHz | 432.0500 and 432.0502 MHz | −85 dBFS each | always |
| `burst` | fm | 144.8000 MHz | 433.0250 MHz | −60 dBFS | 15 … 55 ms ago (40 ms) |
| `strong` | fm | 145.2000 MHz | 433.4500 MHz | −30 dBFS | always |
| `repeater` | fm | 145.6000 MHz | 439.1500 MHz | −65 dBFS | always |

The positions are chosen so that no folded copy (rule 5) lands on DC or on another one at 0.25 or 2.5 MSPS
(checked by a search script). The 2 m `strong` signal at 145.200 MHz is the task's alias example.

## Rules

1. **Span.** Complex sampling at fs shows −fs/2 … +fs/2 around the tuned frequency: span = fs. A signal is inside
   when −fs/2 ≤ offset < +fs/2 (**tie-break**: exactly +fs/2 is outside and folds to −fs/2, the FFT's bin −N/2 after
   fftshift; exactly −fs/2 is inside). Source: HamMonitor `DESIGN.md` "Frequency Coverage" (2 m 2.5 MSPS for 2 MHz,
   70 cm 12.5 MSPS for 10 MHz).
2. **Bins.** An N-point FFT gives N bins k = −N/2 … N/2 − 1 of width Δf = fs/N, bin k centred on k·Δf. HamMonitor
   `config.yaml`: `fft_size: 32768 # larger = better freq resolution, fewer blocks/sec`.
3. **Time.** One block is N samples: N/fs seconds; the waterfall gets fs/N rows per second; the 40-row history
   covers 40·N/fs. Doubling N halves Δf and halves the rows per second.
4. **Window and resolution.** Hann window (HamMonitor: Hann → FFT → fftshift → dBFS). A tone x bins from a bin's
   centre adds amplitude W(x) = sinc(x)/(1 − x²) to it (W(0) = 1, W(±1) = ½, zeros at ±2, ±3 …). Two equal
   carriers are **resolved when they are at least 2 bins apart** (the Hann 6 dB bandwidth, 2.00 bins, Harris 1978
   Table 1; **tie-break**: exactly 2 bins counts as resolved). The model adds the two carriers in amplitude, in
   phase. The noise-free curve W(x) + W(x − d) first dips in the middle at d ≈ 1.88 bins (where d/2 passes W's
   inflection, 0.942), so the 2-bin rule is slightly conservative; no setting gives 1.88 … 2 bins (the pair is
   0.016 … 1.05 or 2.62 … 52.4 bins apart).
   Derived and checked: scalloping loss W(½) = −1.42 dB, 3 dB bandwidth 1.44 bins, equivalent noise bandwidth
   ∫W² = 1.50 bins (Harris: 1.42 dB, 1.44, 1.50).
5. **Aliasing.** A signal outside the span folds to offset − k·fs, k = floor((offset + fs/2)/fs), unless the filter
   removes it. Filter on: an ideal filter removes every signal whose centre is outside the span (listed as
   `filtered`). Filter off: the folded copy is drawn with an "alias" label (state `aliases: [{id, f, foldedTo}]`).
6. **DC.** The centre bin carries a DC artefact (a spike, −80 dBFS, spread by the window like a tone). Bins
   −4 … +4 are excluded from the measurement (HamMonitor `dc_guard_bins: 4`, "Known Constraints: HackRF DC spike").
7. **Deterministic spectrum.** Per bin, power = (Σ CW amplitudes · W)² (in phase) + Σ FM power + DC + noise.
   FM power in a bin = density · Δf · ∫ W² over the signal's band (the window's power response integrated).
   Noise: mean N0 · 1.5 · Δf per bin (N0 = −131 dBFS/Hz, so −110.4 dBFS at Δf 76.3 Hz), times an exponential
   draw from a seeded integer hash of (bin, row): no `Math.random`. So the noise floor falls 3 dB per doubling
   of N while a CW line stays where it is.
8. **Waterfall rows.** Row r (0 = newest) is the block from (r + 1)·N/fs to r·N/fs seconds ago. A signal on for
   only part of a block enters with the share of the window's energy (∫ w² over the on part / ∫ w²) that falls in
   its on time.
9. **Measurement.** The strongest bin of the newest block outside the DC guard, if it is at least 10 dB above the
   mean noise per bin (HamMonitor `threshold_db: 10.0`), is reported with its frequency; **tie-break**: equal
   power, the lower bin wins. Otherwise "none".
10. **Display.** At most 480 columns: when the view holds more bins, consecutive bins are grouped (a column shows
   the strongest signal power among its bins plus the noise of its first bin); otherwise one column per bin, and
   bin edges are drawn when the view holds at most 120 bins. A zoomed view of width w is centred on the focus
   (the pair's midpoint, the burst, the strong signal, or DC; where it is drawn: folded if aliased) and shifted
   to stay inside the span; a focus not in the span (filtered out) centres on DC.

## Expected numbers (presets)

| preset | fs, N, band | span | Δf | block | rows/s | 40 rows | bins/channel | pair |
|---|---|---|---|---|---|---|---|---|
| `2m-monitor` | 2.5, 32768, 2 m | 2.5 MHz (143.750–146.250) | 76.29 Hz | 13.11 ms | 76.3 | 0.524 s | 163.8 | 2.62 bins, resolved |
| `70cm-monitor` | 12.5, 32768, 70 cm | 12.5 MHz (428.75–441.25) | 381.47 Hz | 2.621 ms | 381.5 | 0.105 s | 32.8 | 0.52 bins, one bump |
| `two-carriers` | 2.5, 4096, 2 m, view 2 kHz on the pair | | 610.35 Hz | 1.638 ms | 610.4 | 0.066 s | 20.5 | 0.33 bins, one bump |
| (then N 65536) | | | 38.15 Hz | 26.21 ms | 38.1 | 1.049 s | 327.7 | 5.24 bins, two peaks |
| `fm-burst` | 2.5, 4096, 2 m, view 50 kHz on the burst | | | 1.638 ms | | | | burst in rows 9–33 (sharp: 25 rows) |
| (then N 65536) | | | | 26.21 ms | | | | rows 0–2: one full row, two partial (smeared) |
| `alias` | 0.25, 32768, 2 m, filter off | 250 kHz (144.875–145.125) | 7.63 Hz | 131.1 ms | 7.6 | 5.24 s | 1638.4 | |

`alias`: 145.200 MHz (offset +200 kHz, outside ±125 kHz) folds to 200 − 250 = −50 kHz: **144.950 MHz**, labelled
alias; the other three fold too (pair → 145.030, burst → 145.050, repeater → 145.100 MHz). With the filter on the
span shows only noise and the DC spike, and the measurement finds nothing (the guard hides the spike).

## Out of scope

Averaging and overlap, window comparison, real-valued sampling, receiver gain, the NFM demodulator; the spectral
widening of a burst shorter than a block; the relative phase of the two carriers drifting from block to block.
