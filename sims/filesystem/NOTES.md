<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# filesystem: notes

Task `docs/tasks/w1/filesystem.md`, catalogue entry `ossim-filesystem` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/filesystem.html`, from ossimulator's
  `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is `?lang=hr|en`, else
  `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it, and links to other
  pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `875f05c98f44fa7271baf592924ee48585e5d69e38c79b4eb4351f632ada99a2`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/filesystem.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `dc7c2112dde933a7fe69017b7c5d0da70d9133cdd1d9262623f5f6a2b954d27b`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/filesystem.html`, built 2026-09-30 10:09 from
  `src/modules/filesystem/` (ossimulator HEAD `ce83949`; last change to the module `a8a8ef8`, 2026-09-30 08:55; to
  the module or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/filesystem/` or `src/shared/`
  was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `4cef97103b14b92396550b2b65c74a38d14cf7a7084de3ff7c75ce99617b57f3`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="filesystem"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept are `meta.ts` `title` and `subtitle` ("alokacija, slobodni prostor, inode"); the
  task file's "allocation methods, inodes" is the catalogue's shorthand, not the page's subtitle.
- The Croatian summary from `meta.ts` (205 characters) is shortened to fit 160 (158): "alokacija datoteka"
  becomes "alokacija", "upravljanja slobodnim prostorom" becomes "vođenja slobodnog prostora", "direktoriji i
  cijena razrješenja putanje" becomes "razrješenje putanje", and "s izravnim i neizravnim blokovima" becomes "s
  neizravnim blokovima". The English is a translation (153 characters).
- English title "File system"; concept "allocation, free space, inode", ossimulator's `subtitle` (t-0118; it was
  "inodes" before ossimulator had English).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases are the eight
  `meta.ts` terms plus defragmentation and the free list, which the scenarios use. The `meta.ts` Croatian for
  *inode* is a gloss ("zapis o datoteci s pokazivačima na blokove (bez prijevoda)"), so the Croatian alias is
  plain "inode".
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Concept
  now its `subtitle`.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, block grid, directory tree, event log, scenarios, theory) scrolls; page height 5430 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two set at runtime that the gate cannot see defined (`--c`, `--viz-h`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list but the gate fails it without the exception, as on
the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the status reads "Pauzirano · t=0", no console errors or warnings, no
network requests. An unknown id opens the default state (contiguous, bit table, the comparison's twelve
operations) without errors. Each was run to its end ("Do kraja") and matches the `expected` line in ossimulator's
`sim/scenarios.ts`.

| Concept | Link | End state checked |
|---|---|---|
| Contiguous, chained and indexed allocation on the same operations (bit table) | `?scenario=allocation-compare` | contiguous: A moved 1–3 → 21–25, H fails (17 free in runs of 3, 4, 10); chained: 6 free, reading block 5 of E takes 7 disk reads (directory + 6 data); indexed: disk full, 3 reads (directory, index, data) |
| External fragmentation and defragmentation | `?scenario=contiguous-defrag` | 22 blocks moved, free space one run from 23, H in 23–33, 6 free |
| Inode with direct, single and double indirect blocks | `?scenario=inode-levels` | /velika.dat in 1–18 (indirect 5, double indirect 10 with children 11 and 16); block 13 is [1, 1], read via 10, 16, 18: 5 reads |

The task file names the second link `defrag`; the scenario id in the build is `contiguous-defrag`, so that is the
link. Not listed: `free-list-stack`, `journey-read` (the page's own scenario menu has them). `sim.json` has no
`entries` yet: the task says to list the links here, and OPEN.md still waits on the owner about how many preset
lines the home page shows. The manifest accepts them as
`{ "preset": "inode-levels", "query": "scenario=inode-levels", … }`.

## Checked

- `node --test sims/filesystem/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, all three deep-link scenario ids are in the build.
- `npm run gate -- filesystem` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale (the
  selected method and options are shown inverted, operations are labelled with their key numbers), the phone layout
  is one long column (≈ 10 560 px) with no sideways scroll.
- Not checked: a read-through of the English; the other two scenarios' end states *(check)*; the block grid in
  grayscale after a run (files told apart by letter, not only colour) beyond the default screenshot *(check)*; the
  page in a real lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here.

## Time

Start 00:07, done 00:11 (2026-10-03, by the clock on `nuc`), about 4 minutes.
