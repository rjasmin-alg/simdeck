# fft-waterfall: FFT and the waterfall

| | |
|---|---|
| Task | `fft-waterfall` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-fft-waterfall` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/fft-waterfall/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `signals` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **sample rate sets the span, FFT size sets the resolution**.

The student: change sample rate and FFT size.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/HamMonitor/DESIGN.md`: "Frequency Coverage" (sample rate per band: 2 m 2.5 MSPS, 70 cm 12.5 MSPS), "Architecture" (Hann window → FFT → fftshift → power in dBFS, DC guard), "Configuration (`config.yaml`)" (`fft_size: 32768` "larger = better freq resolution, fewer blocks/sec", `channel_bw_hz: 12500`, `dc_guard_bins: 4`), "Known Constraints" (DC spike). Own project, no licence; ideas and numbers only.
- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/wasserfall.md` (amplitudni spektar, vodopadni dijagram, time runs downwards, not an oscillogram) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.); sampling and aliasing: the `nyquist` and `quantisation` 50ohm applets (`contents/html/applet_nyquist.html`, `quantisierung_und_sampling.html`).
- F. J. Harris, "On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform", *Proc. IEEE* 66(1), 1978 (Hann main-lobe width). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: HamMonitor DESIGN.md

## Model and presets

- **Scene:** top, the amplitude spectrum (dB against frequency, centre frequency in the middle, span
  −fs/2…+fs/2) of the current FFT block; below it the waterfall: one row per FFT block, newest at the top,
  brightness = power, scrolling down as steps of time pass (explorer: a fixed history of 40 rows recomputed from
  the params). Bin edges are drawn when zoomed so the student can count bins across a signal. A card: span,
  bin width Δf, block duration, rows per second, bins per channel.
- **State (explorer, derived from params):** `{ fs, N, window, span, binHz, blockMs, rowsPerSec, signals: [{f,
  level, kind: 'cw'|'fm', on: [t0, t1]}], spectrum: [dB per bin], waterfall: [[dB per bin] × rows], aliases:
  [{f, foldedTo}] }`.
- **Params drive live:** sample rate and FFT size redraw the spectrum and the waterfall's time scale at once;
  the zoom shows which signals merge into one bin.
- **Rules:**
  1. Complex (I/Q) sampling at fs shows a span of fs centred on the tuned frequency (−fs/2 … +fs/2).
  2. An N-point FFT gives N bins of width Δf = fs/N (HamMonitor `DESIGN.md`: larger fft_size = finer
     resolution, fewer blocks per second).
  3. One block takes N/fs seconds, so the waterfall gets fs/N rows per second: resolution in frequency is paid
     for with resolution in time.
  4. Window: Hann (as HamMonitor's FFT stage); two equal carriers are resolved if they are at least ≈ 2 bins
     apart *(check: Harris 1978, Hann main lobe 4 bins wide at the nulls)*.
  5. A signal outside ±fs/2 folds into the span at f − k·fs (aliasing) unless the analogue filter in front
     removes it; the model shows the folded copy with an "alias" label when the filter toggle is off.
  6. The centre bin carries a DC artefact on direct-conversion receivers; ±4 bins are excluded from measurements
     (HamMonitor `dc_guard_bins: 4`).
  7. Spectrum values are deterministic: signal power spread by the window's main lobe, plus a seeded noise floor.
- **Params:** `fs` choice 0.25 / 2.5 / 12.5 MSPS (default 2.5); `N` choice 1024 / 4096 / 32768 / 65536 (default
  32768); `centre` select 2 m (145.000 MHz) / 70 cm (435.000 MHz); `filter` toggle (default on); `zoom` range
  span … 1 kHz.
- **Presets:**
  1. `2m-monitor` (from HamMonitor `DESIGN.md`): fs 2.5 MSPS, N 32768 → span 2.5 MHz (the 2 MHz 2 m band fits),
     Δf = 76.3 Hz, block 13.1 ms, 76 rows/s; a 12.5 kHz channel covers ≈ 164 bins.
  2. `70cm-monitor` (from HamMonitor `DESIGN.md`): fs 12.5 MSPS, N 32768 → span 12.5 MHz (10 MHz band), Δf =
     381.5 Hz, block 2.62 ms, 381 rows/s; a channel covers ≈ 33 bins.
  3. `two-carriers` (derived): two CW carriers 200 Hz apart at fs 2.5 MSPS: N 4096 (Δf 610 Hz) → one bump;
     N 65536 (Δf 38 Hz) → two peaks, but one waterfall row every 26.2 ms.
  4. `fm-burst` (derived): an FM transmission switched on for 2 s: in the waterfall its start and end are sharp at
     N 4096 (1.6 ms rows) and smeared at N 65536.
  5. `alias` (derived): fs 0.25 MSPS centred on 145.000 MHz, a strong signal at 145.200 MHz (outside ±125 kHz)
     with the filter off → appears at 145.200 − 0.250 = 144.950 MHz, labelled "alias".
- **Steps:** explorer, none.
- **Legend:** spectrum trace (line), noise floor (dashed), bins (ticks when zoomed), DC guard (hatched), alias
  (dashed outline + "alias"); waterfall brightness scale with dB labels. "Changed" marks the card values that
  changed with the last parameter.
- **Captions:**
  - hr: „2.5 MSPS i FFT od 32 768 točaka: svaki stupac (*bin*) širok je 76.3 Hz, a novi redak vodopada dolazi
    svakih 13.1 ms. Udvostručite FFT: stupci su upola uži, a redci dolaze upola rjeđe.“
  - en: "2.5 MSPS and a 32 768-point FFT: each bin is 76.3 Hz wide and a new waterfall row arrives every
    13.1 ms. Double the FFT: bins are half as wide and rows come half as often."
- **Terms** (50ohm `wasserfall`): amplitude spectrum — amplitudni spektar; waterfall diagram — vodopadni
  dijagram; sample rate — brzina uzorkovanja (check); span — prikazani raspon (check); FFT bin — frekvencijski
  stupac (bin) (check); resolution — razlučivost; aliasing — preklapanje spektra (aliasing) (check).
- **Misconceptions:** a bigger FFT is simply better (rule 3, preset 4); the waterfall shows time on the
  horizontal axis (50ohm: frequency across, time down; do not confuse with an oscillogram); the span is set by
  the screen (it is set by the sample rate).
- **Out of scope:** averaging and overlap, window comparison, real-valued sampling, receiver gain, the NFM
  demodulator.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh fft-waterfall sims/fft-waterfall` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/fft-waterfall/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
