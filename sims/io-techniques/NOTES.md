<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# io-techniques: notes

Task `docs/tasks/w1/io-techniques.md`, catalogue entry `ossim-io-techniques` (§2.3). Adopted as a built single
file from ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A
defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other
ossimulator imports (COMMON §12).

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/io-techniques.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `a18f9adc7a2cfe21a8072675513122421da98ee006b5986ef514ba1f66572803`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/io-techniques.html`, built 2026-09-30 10:09 from
  `src/modules/io-techniques/` (ossimulator HEAD `ce83949`; last change to the module `769ab74`, to the module or
  `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `cb9ab98767b34225c8ac61d183565a6560b64ae2cefdebd3adceec5e570d141b`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="io-techniques"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept are `meta.ts` `title` and `subtitle`; the summary comes from `meta.ts` `summary`.
  The Croatian summary (217 characters) is shortened to fit 160 (155): "U/I upravljan prekidima" becomes
  "prekidi", "jedan pored drugog" becomes "jedan uz drugi", and the second sentence ("Drugi način rada uspoređuje
  rad bez međuspremnika te s jednostrukim, dvostrukim i kružnim međuspremnikom.") becomes "drugi način uspoređuje
  rad bez i s međuspremnicima". The English is a translation (145 characters), "buffering schemes" for the list.
- English title "I/O techniques and buffering" (the module has no English yet; `w0/ossimulator-english` may
  choose another, then update `sim.json` and the meta placeholder).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms, with PIO and DMA as separate English aliases.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, the three technique columns or the buffering lanes, results, scenarios, theory) scrolls; page height 3632 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two set at runtime that the gate cannot see defined (`--c`, `--viz-h`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list but the gate fails it without the exception, as on
the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): mode and settings as in the scenario, the status reads
"Pauzirano · t=0", no console errors or warnings, no network requests. An unknown id opens the default state
(Tehnike U/I, N = 4, D = 6) without errors. Each was run to its end ("Do kraja") and matches the `expected` line in
ossimulator's `sim/scenarios.ts`.

| Concept | Link | End state checked |
|---|---|---|
| three techniques: PIO, interrupt-driven and DMA move the same block | `?scenario=three-techniques` | PIO t = 32 (CPU 100 % on I/O, 0 useful), INT t = 37 (43,2 %, 21 useful), DMA t = 29 (21 useful) |
| buffering: none, single, double, circular | `?scenario=buffering-compare` | totals 42, 33, 28, 28 cycles (double is the main view) |

`three-techniques` loads the same settings as the default page. Not listed: `slow-device`, `fast-device`,
`circular-burst`, `journey-dma` (the page's own scenario menu has them). `sim.json` has no `entries` yet: the task
says to list the links here, and OPEN.md still waits on the owner about how many preset lines the home page shows.
The manifest accepts them as `{ "preset": "three-techniques", "query": "scenario=three-techniques", … }`.

## Checked

- `node --test sims/io-techniques/sim.test.js`: the copy equals the build but for the markers, the markers are
  well formed, the meta placeholder equals `metaFor(sim.json)`, both deep-link scenario ids are in the build.
- `npm run gate -- io-techniques` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale
  (each column is named and tagged PIO / INT / DMA, every box has a text label and state), the phone layout is one
  long column (≈ 8 500 px) with no sideways scroll.
- Not checked: English (there is none yet); the other four scenarios' end states *(check)*; the page in a real
  lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. Of the `meta.ts` terms, *double buffer*
(dvostruki međuspremnik) and *circular buffer* (kružni međuspremnik) are not in `kit/glossary.js` (the other six
are); listed for the coordinator in case a native sim needs them.

## Time

Start 23:55, done 23:58 (2026-10-02, by the clock on `nuc`), about 5 minutes.
