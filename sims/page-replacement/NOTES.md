<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# page-replacement: notes

Task `docs/tasks/w1/page-replacement.md`, catalogue entry `ossim-page-replacement` (§2.3). Adopted as a built
single file from ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this
copy**. A defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/`,
`sims/processes/`, `sims/scheduling/` and `sims/address-translation/` (COMMON §12).

## Import

- Source: `~/projects/ossimulator/dist-single/page-replacement.html`, built 2026-09-30 10:09 from
  `src/modules/page-replacement/` (ossimulator HEAD `ce83949`; last change to the module `650a064`, to the module
  or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/page-replacement/` or `src/shared/` was
  newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `4c3d2d5f0ba1db0ad7704b8086ce94c44a6fafdfba806788779d7de398ae0d3e`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="page-replacement"` on `<html>`, the `#simdeck-meta`
  placeholder (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in
  `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`); the
  Croatian fits the limits unchanged (summary 107 characters). The English is a translation.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, reference string, frames, working set, four-algorithm comparison, miss curve, event log, timeline, scenarios, theory) scrolls; page height ≈ 4197 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and one it uses without a fallback the gate cannot see defined (`--viz-h`, set inline at runtime) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` pass, so they are not declared. The gate reports no unused
exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the scenario menu shows the scenario, the reference string is the
scenario's, the status reads "Pauzirano · t=0", no console errors, no network requests. An unknown id opens the
default state (the Stallings string, LRU, 3 frames) without errors.

| Concept | Link |
|---|---|
| four algorithms (Stallings string, 3 frames) | `?scenario=stallings-four-algorithms` |
| Clock step by step (use bits and the hand) | `?scenario=clock-walkthrough` |
| Belady's anomaly (FIFO, 3 vs 4 frames) | `?scenario=belady-anomaly` |
| working set and the window Δ | `?scenario=working-set-window` |
| thrashing (CPU use vs number of processes) | `?scenario=thrashing` |

The catalogue's "working set" is the build's `working-set-window`. Not listed: `journey-page-fault` (the "Put
jednog poziva" scenario; the page's own menu has it). `sim.json` has no `entries` yet: the task says to list the
links here, and OPEN.md still waits on the owner about how many preset lines the home page shows. The manifest
accepts them as `{ "preset": "belady-anomaly", "query": "scenario=belady-anomaly", … }`.

## Checked

- `node --test sims/page-replacement/sim.test.js`: the copy equals the build but for the markers, the markers are
  well formed, the meta placeholder equals `metaFor(sim.json)`, the five deep-link scenario ids are in the build.
- `npm run gate -- page-replacement` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed, plus a grayscale shot of
  the finished `stallings-four-algorithms` run with "Do kraja": misses after fill OPT 3, LRU 4, FIFO 6, Clock 5
  (totals 6, 7, 9, 8), matching the scenario's expected line. Colour is never the only carrier: reference cells
  carry H / P / F letters and a hatch for misses, each algorithm has its own marker shape in the comparison and
  the miss curve, and the frames carry "pogodak", "izbačena 4", "kazaljka" labels. The phone layout is one long
  column (≈ 8240 px), no sideways scroll.
- Not checked: English (there is none yet); the page in a real lecture on the projector *(check)*. In the miss
  curve the four end labels (OPT, LRU, FIFO, Clock) stack where the lines meet at 5+ frames; readable, but which
  label belongs to which line is told by the marker shapes, not the label position *(check on the projector)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (textbook results, e.g. Stallings' OPT 3, LRU 4, FIFO 6, Clock 5).
  These are textbook numbers, not the estate's instructor answers, so the "no answer keys" rule does not apply;
  whether the cards should hide them for class exercises is ossimulator's decision.

## Defects for ossimulator

- **Navigation links point outside the folder** (as in the other ossimulator imports). "Natrag na kartu" links
  `./index.html?m=page-replacement` (in simdeck that is the page itself); "Povezano" and the theory links go to
  `./address-translation.html` (also `?scenario=journey-page-fault`), `./memory-allocation.html`,
  `./interrupts.html`, `./processes.html`, `./scheduling.html`, `./journey.html?scenario=page-fault`, all missing
  in `sims/page-replacement/`. A simdeck build target should link `../../index.html` and
  `../<id>/index.html?scenario=…`, or hide links to pages simdeck does not have.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*page replacement*,
*reference string*, *frame*, *page fault*, *Belady's anomaly*, *working set*, *thrashing*) are ossimulator's own
pairs.

## Time

Start 04:48, done 05:05 (2026-10-02), about 17 minutes.
