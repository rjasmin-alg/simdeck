<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# amdahl: notes

Adopted from `single-page-labs/amdahl-simulator.html` (task `docs/tasks/w1/amdahl.md`, catalogue `spl-amdahl`).
The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`** (playbook §10.4 names this page as the example): the params drive the drawing live; there are
  no steps. `sim.js` computes everything in `initial(params)`; the kit's transport is the reset button only.
- **Model kept** from the original: generalised Amdahl `S = 1 / Σ fᵢ/sᵢ`; the serial fraction is the share of the
  parts at 1×; the ceiling is `1 / serial`; the chart draws classic Amdahl `1 / (s + (1 − s)/n)` with that `s`, the
  ideal line `S = n`, and the current point at the equivalent `n`. Thresholds kept: a part counts as sped up above
  1.0001×. Slider ranges kept: fraction 1–99 %, speedup 1–100× in steps of 0.5.
- **Two sliders** (catalogue: "2 sliders"): a "Dio programa / Program part" choice (1–5, or click a row on the stage)
  picks the part, and only that part's fraction and speedup sliders show. Ten sliders at once do not fit the panel.
- **Profiles as presets.** The original's six scenario buttons are presets 1, 4, 5, 7, 8, 9 (desktop, web, hpc,
  mobile, db, custom). The profile is a hidden param (`profile`, set only by presets) that names the parts.
- **Three presets added** that the original's theory text describes but its buttons did not set: `cpu-4x`
  (CPU 40 % at 4× → 1.43×), `memory-4x` (memory 25 % at 4× → 1.23×): the bottleneck comparison, and `hpc-16x`
  (computation 70 % at 16× → 2.91× under a 3.33× ceiling). Nine presets, keys 1–9, in two columns so the panel fits.
- **Bottleneck** marked on the stage and named in the caption: the part with the most *new* time (ties: lowest
  number). The original only explained it in text.
- **Gustafson on the chart** as a toggle (off by default), with the same `s`; the original had it in the theory text only.
  Same concept (how the serial fraction limits scaling), so no second sim.
- **Theory tabs → one "Ideja" explanation** with five headings (law, bottleneck, limits, Gustafson, real-world).
- Number format follows the language (decimal comma and "40 %" in Croatian).

## Deviations from the original (and why)

- **Fractions that do not add up to 100 are scaled to 100** (`share = weight / Σ weights`), so the baseline is always
  1×. The original computed `1 / Σ fᵢ/sᵢ` on raw fractions, which gave e.g. 0.71× with nothing sped up when the sum
  was 140 %, and showed a red warning. The stage still says when the sum is off ("… preračunato na 100 %").
- **Custom has five parts at 20 %** (the original: four at 25 %), so every profile has five parts and five sliders.
- **Number inputs dropped** (the original had a text box next to each slider, speedup up to 1000×): the kit has no
  number input; the slider plus arrow keys cover 1–100×.
- **Emoji icons dropped**; parts are numbered 1–5 (number badges, also the choice's labels).
- **Theory text corrected:**
  - The bottleneck example contradicted itself (called memory the bottleneck while CPU was the larger part, with
    fractions that did not match the Desktop preset). Rewritten with the preset's own numbers: CPU 4× → 1.43×,
    memory 4× → 1.23×.
  - "Makr D. Hill's formulation: make the common case fast" removed: wrong attribution (and a typo). The rule stays,
    unattributed.
  - Real-world examples made generic (concepts, not tools, COMMON.md §1): a named CPU generation, a named
    company's framework and a named game console became "a processor", "a job spread over nodes", "loading a game".
    "MPI Comms" became "Node communication". Numbers recomputed: map/reduce-like job with 20 % serial: 10 nodes 3.6×,
    20 nodes 4.2× (the original's "< 10 % gain beyond ~10 nodes" dropped); game loading with 100× faster storage
    1.42× (the original rounded I/O to 0 for 1.43×). The original's claim that this "proves Amdahl understates the
    subjective impact" dropped.
  - Cache example: "2× improvement = 7.5 % gain" reworded as "cuts the time by 7.5 %" (the speedup is 1.08×).
- **Fonts:** Share Tech Mono and Barlow from Google Fonts dropped; the kit's Atkinson Hyperlegible and the system
  monospace instead. No other network loads existed.
- **Canvas → SVG** drawn at 1:1 in pixels (text ≥ 16 px), redrawn when the stage changes size.

## Sources

- The original page (model, presets, theory text).
- Amdahl, G. M. (1967), "Validity of the single processor approach to achieving large scale computing capabilities",
  AFIPS. Gustafson, J. L. (1988), "Reevaluating Amdahl's law", CACM 31(5). The formulas and every number in the
  explanation are checked in `sim.test.js`.
- *(check)* The memory-wall paragraph is qualitative on purpose; the original's figures ("CPU doubled every 18 months,
  memory latency ~10 % per year") were dropped rather than verified.
- *(check)* Branch prediction ~1 % and cache ~15 % of cycles are the original's illustrative figures, not measured.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| Amdahl's law | Amdahlov zakon |
| Gustafson's law | Gustafsonov zakon |
| speedup | ubrzanje |
| serial fraction | serijski udio |
| bottleneck | usko grlo |

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown.** `.sd-ctl { display: flex }` beats the `hidden` attribute the kit sets
  from a param's `visible()`, so a hidden control stays on screen. Smallest change: `.sd-ctl[hidden] { display: none; }`
  in kit.css (or `[hidden] { display: none !important; }`). Worked around in this page's CSS; drop the workaround once
  the kit has it.
- **kit.js: param labels as functions of params** (`label: (params) => string`, like `min`/`max`). This page renames the
  part sliders ("Udio vremena: Procesor") after each render by writing the label's text node, because the part names
  depend on the profile. Additive: a string label keeps working.
- **Glossary:** add the five term pairs above with `"src": "simdeck"`; then strings.js can use `[[…]]` again.
- **Later preset:** `webserver-amdahl` is to become a preset of this sim (catalogue §5.18). The `web` profile is the
  original's generic web server; a web-request profile (network / app / DB) would be a new entry in `PROFILES`, its five
  part names in strings.js and one line in `presets`.

## Checks not done here

- Real projector, and a lecturer driving it with a clicker (an explorer has no step keys; `R` and 1–9 work).
- The explanation, opened, scrolls inside the panel at 1920×1080 (the gate checks the panel closed, as for every sim).

## Time

Start 2026-10-02 01:54, done 02:15 (about 25 minutes, one session).
