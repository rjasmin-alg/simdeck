<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# memory-allocation: notes

Task `docs/tasks/w1/memory-allocation.md`, catalogue entry `ossim-memory-allocation` (§2.3). Adopted as a built
single file from ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this
copy**. A defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and
the other ossimulator imports (COMMON §12).

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/memory-allocation.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `62dda21c500b15f4dba574a561ba1f8a79d616f55baae5257f0e21ed55a5590e`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/memory-allocation.html`, built 2026-09-30 10:09 from
  `src/modules/memory-allocation/` (ossimulator HEAD `ce83949`; last change to the module `175db7e`, to the module
  or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `a5f2c19408007bb556ddf1ef4ecd1dfe414bdc6c488b88f38061896d19de158a`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="memory-allocation"` on `<html>`, the `#simdeck-meta`
  placeholder (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in
  `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`). The
  Croatian summary (206 characters) is shortened to fit 160 (158): "glavnu", "algoritmi smještanja" and "sustav"
  are dropped and "first-fit, best-fit i next-fit" becomes "first/best/next-fit". The English is a translation
  (152 characters; "internal and external fragmentation" shortened to "fragmentation" to fit).
- Class `explorer`, topic `os`, tags `memory` and `operating-systems`, level `core` (all in `tags.json`); aliases
  from the `meta.ts` terms.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons, a 13.3 px `<sup>` on the phone); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, main memory, event log, history, scenarios, theory) scrolls; page height ≈ 4013 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two set at runtime that the gate cannot see defined (`--c`, `--viz-h`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` pass, so they are not declared. The gate reports no unused
exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the operations field holds the scenario's list, the status reads
"Pauzirano · t=0", no console errors or warnings, no network requests. An unknown id opens the default state
(dynamic partitioning, the textbook list) without errors.

| Concept | Link |
|---|---|
| internal fragmentation (fixed equal partitions, 17M lost) | `?scenario=fixed-equal` |
| first/best/next fit pick three different holes (compare all three) | `?scenario=placement-differs` |
| compaction (Stallings: 16M free, largest hole 6M, P5 waits until compaction) | `?scenario=dynamic-stallings` |
| buddy system (Stallings: splits and merges, 1M free at the end) | `?scenario=buddy-stallings` |

Not listed: `fixed-unequal`, `fixed-queue-per-partition`, `random-workload` (the page's own scenario menu has
them). `sim.json` has no `entries` yet: the task says to list the links here, and OPEN.md still waits on the owner
about how many preset lines the home page shows. The manifest accepts them as
`{ "preset": "buddy-stallings", "query": "scenario=buddy-stallings", … }`.

## Checked

- `node --test sims/memory-allocation/sim.test.js`: the copy equals the build but for the markers, the markers
  are well formed, the meta placeholder equals `metaFor(sim.json)`, the four deep-link scenario ids are in the
  build.
- `npm run gate -- memory-allocation` passes: the kit-free browser checks on the built file (no network, no
  console errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the
  kit-only checks waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed.
- Two scenarios run to the end ("Do kraja") and checked in grayscale against their expected lines:
  `placement-differs` (first-fit P8@8, P9 waits at t=12 with 26M free and largest hole 8M; compaction moves 24M
  first-fit (P9@38), 16M best-fit, 26M next-fit; all three end with one hole 16M@48) and `buddy-stallings` (B 240K
  in 256K with 16K internal fragmentation, E 75K with 53K, merges down to one free 1M block at t=10). Holes are
  hatched, internal fragmentation cross-hatched, every block labelled, so colour is never the only carrier.
- The phone layout is one long column (≈ 8600 px), no sideways scroll.
- Not checked: English (there is none yet); `fixed-equal` and `dynamic-stallings` run to the end *(check)*; the
  page in a real lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. For later, from `meta.ts`, not in
`kit/glossary.js`: *fixed partitioning* = fiksno particioniranje, *dynamic partitioning* = dinamičko
particioniranje, *internal fragmentation* = unutarnja fragmentacija, *external fragmentation* = vanjska
fragmentacija, *placement algorithm* = algoritam smještanja. (*hole*, *compaction* and *buddy system* are there.)

## Time

Start 23:42, done 23:46 (2026-10-02, by the clock on `nuc`), under 10 minutes.
