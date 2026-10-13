<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# processes: notes

Task `docs/tasks/w1/processes.md`, catalogue entry `ossim-processes` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/processes.html`, from ossimulator's
  `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is `?lang=hr|en`, else
  `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it, and links to other
  pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `2f69d4f0a2b3e264124235d6700b505c23ef71aecc099e75d7c37da8e446dfbb`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/processes.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `e25d09c2431abffcbfd28ab3e94b9c2e2ec5af0c62646dad77f644452b6109f6`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/processes.html`, built 2026-09-30 10:09 from
  `src/modules/processes/` (ossimulator HEAD `ce83949`, last change to the module or `src/shared` `be6fb14`).
  Nothing in `src/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `ed0794d4cda364c39de0d9136465334370226366e322df0bca9d8ed003c07d7c`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="processes"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`). The
  Croatian summary is shortened to fit 160 characters (Stallings' name and "naspram promjene načina rada"
  dropped); the English is a translation of the shortened one.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms.
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Concept
  now "Process states, PCB, fork/exec/wait", its `subtitle`.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, state diagram, event log, timeline, PCB and memory tabs, scenarios, theory) scrolls; page height ≈ 5080 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens, not the kit's |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` were probed in a first gate run and waived nothing, so they are
not declared.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted: the scenario menu shows the scenario, the status reads "Pauzirano · t=0", no
console errors, no network requests. An unknown id opens the default state without errors.

| Concept | Link |
|---|---|
| five-state trace | `?scenario=stallings-trace` |
| suspend (seven-state model, memory full) | `?scenario=suspend-memory` |
| zombie | `?scenario=fork-zombie` |
| orphan and init | `?scenario=orphan` |
| mini shell: fork + exec + wait | `?scenario=mini-shell` |

Not listed: `io-wait`, `two-state-scan` (the page's own scenario menu has them). `sim.json` has no `entries`
yet: the task says to list the links here, and OPEN.md still waits on the owner about how many preset lines
the home page shows. The manifest accepts them as `{ "preset": "orphan", "query": "scenario=orphan", … }`.

## Checked

- `node --test sims/processes/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the deep-link scenario ids are in the build.
- `npm run gate -- processes` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only
  checks waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: the state diagram
  pairs colour with labels and borders, and reads in grayscale.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms are all in
`kit/glossary.js` (*process state* from the UL book, the rest from ossimulator).

## Time

Start 04:30, done 04:50 (2026-10-02), about 20 minutes.
