<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# os-call-journey: notes

Task `docs/tasks/w1/os-call-journey.md`, catalogue entry `ossim-journey` (§2.3). Adopted as a built single file
from ossimulator's `journey` module, which stays the source of truth (`docs/site-structure.md` §0): **never fix
this copy**. A defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/`
and the other ossimulator imports (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/os-call-journey.html`, from
  ossimulator's `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is
  `?lang=hr|en`, else `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it,
  and links to other pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `e768d0fc6f1def4e10afb833907965cb39b4d3e5d23cbe2880d5c94ae61d8fb3`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/os-call-journey.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `dec9b694516e79b29711c9dc3e3476f1475e476f5b7c8674b25a34985f2d086e`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/journey.html`, built 2026-09-30 10:09 from `src/modules/journey/`
  (ossimulator HEAD `ce83949`; last change to the module or `src/shared` `e59e014`, 2026-09-30 10:06). Nothing in
  `src/modules/journey/` or `src/shared/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `51531567861cee9f6b6e36d7f024244aad54870087eed089076db53fcb41c8be`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="os-call-journey"` on `<html>`, the `#simdeck-meta`
  placeholder (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in
  `<head>`.
- The folder is `os-call-journey`, the ossimulator module `journey`: `origin` is `ossimulator/journey`, and the
  test checks that rather than `ossimulator/<folder>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept are `meta.ts` `title` ("Put jednog poziva") and `subtitle` ("read() kroz cijeli
  sustav"); the task file's "read() and page fault through every layer" is the catalogue's shorthand.
- The Croatian summary from `meta.ts` (≈ 250 characters) is shortened to fit 160 (157): "Praćenje jednog
  blokirajućeg read()" becomes "Jedan blokirajući read()", "reda diska" becomes "disk", the map-highlighting
  clause is dropped, and "drugi put je promašaj stranice, od MMU-a do ponavljanja instrukcije" becomes "drugi put:
  promašaj stranice". The English is a translation (148 characters).
- English title "Journey of a call" (ossimulator's `title`, t-0118; "Journey of one call" from the task file
  before) and concept "read() through the whole system" (ossimulator's `subtitle`).
- Class `explorer`, topic `os`, tags `operating-systems` and `encapsulation`, level `core` (all in `tags.json`);
  aliases are the eight `meta.ts` terms.
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Title now
  its `title`.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the six-section layout (settings, controls, module map, sequence, state, theory) scrolls; page height 4351 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and four set at runtime that the gate cannot see defined (`--c`, `--viz-h`, `--lanes`, `--span`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list, but the gate fails it without the exception, as on
the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the status reads "Pauzirano · t=0", no console errors or warnings, no
network requests. An unknown id opens the default state (read() with a cache miss, 21 steps) without errors. Each
was run to its end ("Do kraja") and matches the `expected` line in ossimulator's `sim/scenarios.ts`.

| Concept | Link | End state checked |
|---|---|---|
| A blocking read() with a disk-cache miss, through every layer | `?scenario=read-miss` | 21 steps; mode switches 6, process switches 2, interrupts 2, P1 blocked 8 steps |
| A page fault, from the MMU to the instruction restart | `?scenario=page-fault` | 19 steps; mode switches 6, process switches 2, interrupts 2, exception 1, P1 blocked 5 steps; physical address 5 · 1024 + 478 = 5598 |

Not listed: `read-hit`, `read-preempt`, `page-fault-dirty` (the page's own path buttons 2, 4, 5 and its scenario
menu have them; ossimulator's `PUBLIC_SCENARIOS.journey` is the two above). `sim.json` has no `entries` yet: the
task says to list the links here, and OPEN.md still waits on the owner about how many preset lines the home page
shows. The manifest accepts them as `{ "preset": "page-fault", "query": "scenario=page-fault", … }`.

## Checked

- `node --test sims/os-call-journey/sim.test.js`: the copy equals the build but for the markers, the markers are
  well formed, the meta placeholder equals `metaFor(sim.json)`, both deep-link scenario ids are in the build.
- `npm run gate -- os-call-journey` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale (P1
  solid, P2 hatched, the process state is shown inverted and labelled, the counters are numbers), the phone layout
  is one long column (≈ 9050 px) with no sideways scroll.
- Not checked: a read-through of the English; the module map and sequence lanes mid-run in grayscale beyond the
  default screenshot *(check)*; the "6 Otvori modul" button's target, which leaves the folder like the links below
  *(check)*; the page in a real lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here.

## Time

Start 00:13, done 00:24 (2026-10-03, by the clock on `nuc`), about 11 minutes.
