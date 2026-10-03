<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# drivers: notes

Task `docs/tasks/w1/drivers.md`, catalogue entry `ossim-drivers` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12).

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/drivers.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `dd96ed28fd9671bd20f18d14cf27e40eefde03040aa60d4c664374c4bb2d00de`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/drivers.html`, built 2026-09-30 10:09 from `src/modules/drivers/`
  (ossimulator HEAD `ce83949`; last change to the module `12efe85`, 2026-09-30 09:14). Nothing in `src/` was newer
  than the build, so it was not rebuilt.
- sha256 of the build as imported: `fb14fbcd140a4c75db868b1b405718879864e47721660a8a41bd727ea5311b21`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="drivers"` on `<html>`, the `#simdeck-meta` placeholder (from
  `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept are `meta.ts` `title` and `subtitle`; the summary comes from `meta.ts` `summary`.
  The Croatian summary (172 characters) is shortened to 160 by dropping "korisničkog" ("od korisničkog procesa"
  becomes "od procesa"). The English is a translation (147 characters).
- English title "Device drivers", concept "I/O layers, top and bottom half" (the module has no English yet;
  `w0/ossimulator-english` may choose other wording, then update `sim.json` and the meta placeholder).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms, with the "top / bottom half" and "blocking / non-blocking" pairs split into separate aliases.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, I/O layers, event log, timeline, scenarios, theory) scrolls; page height 4197 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and `--viz-h` is set at runtime where the gate cannot see it defined |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list, but the gate fails without it, as on the other
imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): settings as in the scenario, the status reads "Pauzirano · t=0", no
console errors or warnings, no network requests. Each was run to its end ("Do kraja") and matches the `expected`
line in ossimulator's `sim/scenarios.ts`. An unknown id opens the default state (three blocking readers, service
5 ticks) without errors.

| Concept | Link | End state checked |
|---|---|---|
| top / bottom half | `?scenario=top-bottom-half` | service 2, bottom half 3 ticks; P1 done at 15, P2 at 16, P3 at 21 |
| blocking vs non-blocking | `?scenario=blocking-vs-nonblocking` | comparison on; blocking ends t = 13 with 6 idle ticks; non-blocking ends t = 15, 0 idle, 6 ticks of side work, 3 × EAGAIN |

Not listed: `journey-read`, `request-queue`, `blocking-frees-cpu`, `nonblocking-competes` (the page's own scenario
menu has them). `sim.json` has no `entries` yet: the task says to list the links here, and OPEN.md still waits on
the owner about how many preset lines the home page shows. The manifest accepts them as
`{ "preset": "top-bottom-half", "query": "scenario=top-bottom-half", … }`.

## Checked

- `node --test sims/drivers/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, both deep-link scenario ids are in the build.
- `npm run gate -- drivers` passes: the kit-free browser checks on the built file (no network, no console errors,
  no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks are
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale
  (processes are named P1–P3 with a state word, the layers are labelled), and the phone layout is one long
  column (≈ 9 000 px) with no sideways scroll.
- Not checked: English (there is none yet); the other four scenarios' end states *(check)*; the page on the
  projector in a real lecture *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. Of the `meta.ts` terms, *request queue* (red
zahtjeva) and *top half / bottom half* (gornja / donja polovica) are not in `kit/glossary.js`; *blocking /
non-blocking I/O* is there only as the triple with asynchronous I/O. Listed for the coordinator in case a native
sim needs them.

## Time

Start 09:45, done 09:50 (2026-10-03, by the clock on `nuc`), about 5 minutes.
