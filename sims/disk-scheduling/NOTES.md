<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# disk-scheduling: notes

Task `docs/tasks/w1/disk-scheduling.md`, catalogue entry `ossim-disk-scheduling` (§2.3). Adopted as a built single
file from ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A
defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other
ossimulator imports (COMMON §12).

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/disk-scheduling.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `2ef26b6c361f4b32b90c527e464b12aa2fa1d2dc9cbd730ab25926c1a046e382`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/disk-scheduling.html`, built 2026-09-30 10:09 from
  `src/modules/disk-scheduling/` (ossimulator HEAD `ce83949`; last change to the module `1f623cb`, 2026-09-30 08:48;
  to the module or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/` was newer than the build, so it was
  not rebuilt.
- sha256 of the build as imported: `afd0228659ca7588baf020655c8f7adef0c5abd2075c506a38a4baa643a56c6d`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="disk-scheduling"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept are `meta.ts` `title` and `subtitle` ("SSTF, SCAN, C-SCAN, FSCAN", the same in both
  languages; the task file's "FIFO…FSCAN, HDD vs SSD" is the catalogue's shorthand, not the page's subtitle).
- The Croatian summary from `meta.ts` (200 characters) is shortened to fit 160 (158): "ukupna i prosječna duljina
  traženja" becomes "duljina traženja", and "vrijeme pristupa (slijedno i nasumično)" loses the parenthesis. The
  English is a translation (139 characters).
- English title "Disk scheduling" (the module has no English yet; `w0/ossimulator-english` may choose another, then
  update `sim.json` and the meta placeholder).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases are the seven
  `meta.ts` terms plus the policy names FIFO, N-step-SCAN and LOOK, which are not in the concept line.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, head-path chart, event log, results tables, scenarios, theory) scrolls; page height 4941 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two set at runtime that the gate cannot see defined (`--c`, `--viz-h`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list but the gate fails it without the exception, as on
the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the status reads "Pauzirano · t=0", no console errors or warnings, no
network requests. An unknown id opens the default state (FIFO, head at 100, Stallings' nine requests) without
errors. Each was run to its end ("Do kraja") and matches the `expected` line in ossimulator's `sim/scenarios.ts`.

| Concept | Link | End state checked |
|---|---|---|
| Stallings' Table 11.2: all eight policies on the book's queue | `?scenario=stallings-table-11-2` | FIFO 498 (55,33), SSTF 248 (27,56), SCAN 250 (27,78), C-SCAN 322 (35,78; return 166), LIFO 537, PRI = FIFO, N-step-SCAN 394, FSCAN = SCAN |
| SCAN vs C-SCAN, sweeping to the edge of the disk | `?scenario=scan-to-edge` | SCAN 280, C-SCAN 388 of which the return is 199 (232* step = 15 + 199 + 18) |
| HDD vs SSD access time for the same orders | `?scenario=hdd-vs-ssd` | SSD 0,9 ms for every policy; HDD FIFO 55,104, SSTF 50,104, SCAN 50,144, C-SCAN 51,584 ms |

`stallings-table-11-2` and the default page load the same queue; the scenario also turns on the eight-policy
comparison. Not listed: `priority-requests`, `arm-stickiness`, `n-step-book`, `timing-sequential-random`,
`journey-read` (the page's own scenario menu has them). `sim.json` has no `entries` yet: the task says to list the
links here, and OPEN.md still waits on the owner about how many preset lines the home page shows. The manifest
accepts them as `{ "preset": "hdd-vs-ssd", "query": "scenario=hdd-vs-ssd", … }`.

## Checked

- `node --test sims/disk-scheduling/sim.test.js`: the copy equals the build but for the markers, the markers are
  well formed, the meta placeholder equals `metaFor(sim.json)`, all three deep-link scenario ids are in the build.
- `npm run gate -- disk-scheduling` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale (the
  selected policy and device are shown inverted and named in the chart header, requests are numbered tracks), the
  phone layout is one long column (≈ 9 800 px) with no sideways scroll.
- Not checked: English (there is none yet); the other five scenarios' end states *(check)*; the page in a real
  lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. All seven `meta.ts` terms are already in
`kit/glossary.js`.

## Time

Start 00:00, done 00:10 (2026-10-03, by the clock on `nuc`), about 10 minutes.
