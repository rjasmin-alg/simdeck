<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fft-waterfall: notes

Task `docs/tasks/w3/fft-waterfall.md` (catalogue `ham-fft-waterfall`, §4.10). Explorer, topic `radio`, tag
`signals`, level `core`. Rules and numbers: `SPEC.md`.

## Decisions

- **Fixed scenes per band.** The state is derived from the params, so the signals are a fixed scene per band
  (`SPEC.md`, "Signals"): two CW carriers 200 Hz apart, a short FM burst, a strong FM signal, an FM repeater. The
  2 m positions follow HamMonitor's band plan where it has one (144.800 APRS for the burst, 145.200 for the strong
  signal, the task's alias example; 145.600 repeater; the carriers in the CW segment). The 70 cm positions were
  picked by a search so that no folded copy lands on DC or on another one at 0.25 or 2.5 MSPS (a test keeps it so).
- **Display columns, not every bin, in the state.** 65 536 bins × 40 rows would be 2.6 M numbers per param change.
  The state holds at most 480 columns per row: one per bin when zoomed in, otherwise groups of bins, each showing
  the strongest signal power among its bins plus the noise of its first bin (rule 10). So a grouped view keeps every
  carrier's peak and the noise keeps its per-bin statistics. The measurement (rule 9) still scans every bin.
- **Noise from an integer hash of (bin, row)**, not a sequential generator, so any bin's noise can be read alone
  (the measurement, the grouped columns). Exponential draw (one FFT, no averaging), clipped to −20 … +8.4 dB.
- **The noise floor follows Δf** (N0 · 1.5 · Δf): a doubling of N lowers it by 3 dB while a CW line stays. This is
  what a real FFT does and it is why a bigger FFT finds weak carriers; it belongs to "FFT size sets the
  resolution", so it is shown (the dashed line moves) but not made a separate lesson.
- **The two carriers add in amplitude, in phase**, as Harris's 6 dB criterion assumes. The drawn curve dips from
  d ≈ 1.88 bins, so the "≥ 2 bins" rule is slightly conservative; no setting falls between (found by the
  reviewer). Other signals add in power.
- **The waterfall colours** run from `--bg` through `--c1` to `--ink` (as `aurora` does), fixed at −125 … −45 dBFS,
  so wider bins visibly lift the background. In the light theme strong is dark; in the dark theme strong is bright;
  the scale bar in the card shows the mapping in both. Grayscale is monotone.
- **The band switch sits on the stage** (beside the spectrum title, as a receiver's tuning), not in the panel: with
  five presets and five params the panel was 70 px too tall at 1920×1080. It is still a param (`band`, in the URL),
  hidden from the panel with `visible: false`.
- **"Changed" marks**: the card rows whose value changed with the last param change are yellow with an ink bar at the
  left (shape as well as colour). The page compares the card's text with the previous params' text; a redraw
  without a param change (resize, theme) keeps the marks.
- **Bin counts in Croatian** take the genitive singular (decimal numbers: „0,33 stupca“, „5,24 stupca“), so those
  strings have no plural forms.

## Deviations from the task

- **The burst lasts 40 ms, not 2 s** (`fm-burst`). With one row per block and 40 rows, the history at N 4096
  (1.64 ms rows) is 66 ms: a 2 s transmission fills it and neither edge can be seen. 40 ms, 15–55 ms ago, fills
  rows 9–33 at N 4096 (sharp start and end) and falls into rows 0–2 at N 65 536 (one full row, two partial:
  smeared), which is the comparison the task asks for. Like a data packet (the 2 m burst sits on 144.800).
- **`centre` is `band`**, a two-way choice on the stage (the kit's `select` is for more than five options; the
  panel had no room, see above).
- **`focus` added** (DC, the pair, the burst, the strong signal): a zoom needs a centre. Disabled while the whole span
  is shown. A focus that is not in the span (filtered out) centres on DC and the plot says so.
- **`zoom`** is an index into a fixed 1-2-5 ladder of widths, 1 kHz … 20 MHz, so a chosen width survives a change
  of fs; any width ≥ fs shows the whole span (the slider's right end at 0.25 MSPS is then "all" for a few steps).
- **State `spectrum` and `waterfall` hold display columns** (above), not every bin; `cols` gives each column's bins.
- **The filter is ideal** and judged by a signal's centre: an FM signal straddling ±fs/2 is kept or removed whole.

## Numbers checked

A node script (`/tmp` scratch, not kept) computed: Δf, block, rows/s, 40-row history and bins per 12.5 kHz channel
for every fs × N; the pair's separation in bins; Hann W(½) = −1.424 dB, 3 dB width 1.440 bins, ∫W² = 1.500 bins
(Harris 1978 Table 1: 1.42 dB, 1.44, 1.50); the alias folds of every scene signal at 0.25, 2.5 and 12.5 MSPS. The
task's preset numbers all hold: 76.3 Hz, 13.1 ms, 76 rows/s, ≈ 164 bins (2 m); 381.5 Hz, 2.62 ms, 381 rows/s,
≈ 33 bins (70 cm); 610 Hz and 38 Hz, 26.2 ms (two carriers); 1.6 ms (burst); 145.200 − 0.250 = 144.950 MHz (alias).

## Sources

- `~/projects/HamMonitor/DESIGN.md` (own project, no licence; numbers and ideas only): "Frequency Coverage"
  (2 m 2.5 MSPS, 70 cm 12.5 MSPS), "Architecture" (Hann → FFT → fftshift → dBFS, DC guard), configuration
  (`fft_size: 32768`, `channel_bw_hz: 12500`, `threshold_db: 10.0`, `dc_guard_bins: 4`), "Known Constraints"
  (DC spike), the 2 m and 70 cm channel tables.
- `~/projects/50ohm-contents-hr/contents/sections/wasserfall.md` (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des
  DARC e.V.): amplitude spectrum and waterfall, frequency across, time downwards, not an oscillogram. Summarised in
  the explanation, nothing verbatim; credited in `sim.json` and on the page. `TRANSLATION_GLOSSARY.md` there for
  *brzina uzorkovanja*, *razlučivost*, *aliasing*.
- F. J. Harris, "On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform", Proc. IEEE
  66(1), 1978, Table 1 (Hann: 6 dB bandwidth 2.00 bins, 3 dB 1.44, ENBW 1.50, scalloping 1.42 dB).
- Carson's rule for the NFM occupied bandwidth: 2 · (2.5 kHz + 3 kHz) = 11 kHz.

## Unchecked *(check)*

- Harris Table 1 values are from memory of the paper, not re-read; the model's own numbers (derived from the
  closed-form Hann response) agree with them. *(check)*
- The resolution criterion "≥ 2 bins" (the 6 dB bandwidth) holds for equal, in-phase carriers; for carriers in
  quadrature or added in power the limit is nearer the 3 dB width (1.44 bins). *(check)*
- Croatian terms not in the glossary or the books: *prikazani raspon* (span), *frekvencijski stupac* (bin),
  *preklapanje spektra* (aliasing) are the task's suggestions, marked (check) there. *(check)*
- The DC spike level (−80 dBFS), the noise density (−131 dBFS/Hz) and the signal levels are illustrative, not
  measured on a HackRF. *(check)*

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| amplitude spectrum | amplitudni spektar |
| waterfall diagram | vodopadni dijagram |
| sample rate | brzina uzorkovanja |
| span | prikazani raspon |
| FFT bin | frekvencijski stupac (bin) |
| resolution | razlučivost |
| aliasing | preklapanje spektra (aliasing) |

## Shared requests

None. (The waterfall colour ramp from three tokens and the canvas drawing are page code, as in `aurora`; if a
third sim needs a token ramp, a `Simdeck.ramp(tokens)` helper in the kit would remove the copies.)

## Review (playbook §7.4)

A fresh reviewer (a separate agent with no part in the build) read the diff against `SPEC.md`, re-derived the Hann
numbers, folds, energy shares and preset numbers (all correct, no model bug), and ran 57 mutations of `sim.js`.
Fixed after the review:
- two captions: the burst cut off by a short history (N 1024) no longer says "smeared", and a focus filtered out of
  the span no longer gets the pair or burst sentence; the card's pair row says "not in the span" then;
- SPEC rule 4: the in-phase sum first dips at ≈ 1.88 bins, not exactly 2 (the rule stays the 6 dB width);
- the KERNEL comment (W² at 48 bins is ≈ −111 dB);
- new tests for the survivors: FM share in the row power, the sin⁴ shares pinned, grouped columns (max plus the
  first bin's noise, per row), the peak's level and frequency, the inclusive guard and the 10 dB threshold
  (`detected`), the DC spike's spread, the noise clip, the FM skirt, sidelobe signs, the view's edge bins, `at` of
  filtered signals; the last bin edge is drawn too.
Surviving mutants are equivalent: time-reversed `onShare` (the window is symmetric), `spectrum` from
`waterfall[0]` (the same row), `>` for `>=` on ties no setting reaches (view full, edges, threshold), the CW share
in amplitude (CW is always on), `cum` argument order and interpolation (W² is even; under 0.01 dB), and the
measurement's noise draw (changes `peak.db` by < 0.01 dB in every reachable case: a reported peak is ≥ 10 dB above
the noise).

## Timing

Start 16:44, first gate pass 17:00, review and fixes, done 17:20 (one session, about 36 minutes).
