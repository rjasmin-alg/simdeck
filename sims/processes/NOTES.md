<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# processes: notes

Task `docs/tasks/w1/processes.md`, catalogue entry `ossim-processes` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` (COMMON §12).

## Import

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
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

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

- **Navigation links point outside the folder** (as in `sims/interrupts/`). "Natrag na kartu" links
  `./index.html?m=processes` (in simdeck that is the page itself); "Povezano" and the theory links go to
  `./scheduling.html`, `./threads.html`, `./syscalls.html`, `./interrupts.html`, `./memory-allocation.html`,
  `./journey.html` (missing in `sims/processes/`). A simdeck build target should link `../../index.html` and
  `../<id>/index.html?scenario=…`, or hide links to pages simdeck does not have.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms are all in
`kit/glossary.js` (*process state* from the UL book, the rest from ossimulator).

## Time

Start 04:30, done 04:50 (2026-10-02), about 20 minutes.
