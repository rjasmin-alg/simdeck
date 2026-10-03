<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# threads: notes

Task `docs/tasks/w1/threads.md`, catalogue entry `ossim-threads` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12).

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/threads.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `448bca0dd63e8e7e9aa5bb1f9beefe5bff53305d5f25be59c27dc50f80ab9c10`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/threads.html`, built 2026-09-30 10:09 from `src/modules/threads/`
  (ossimulator HEAD `ce83949`; last change to the module `650a064`, to the module or `src/shared` `be6fb14`,
  2026-09-30 10:05). Nothing in `src/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `feb9976fdfdc90819add257a9532e4a1f0f0aeefeca52d33c015e6b59577c06b`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="threads"` on `<html>`, the `#simdeck-meta` placeholder (from
  `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`). The
  Croatian summary (226 characters) is shortened to fit 160 (154): "Jedan proces" becomes "Proces", "što je
  zajedničko, a što ima svaka dretva" becomes "što dijele, a što ima svaka", "kombinirani pristup s lakim procesima
  (LWP)" becomes "laki procesi (LWP)", and "jedne korisničke dretve" becomes "ULT-a". The English is a translation
  (158 characters).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms, with the abbreviations (ULT, KLT, LWP, TCB) as separate English aliases.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, process and threads, event log, timeline, scenarios, theory) scrolls; page height ≈ 4610 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two set at runtime that the gate cannot see defined (`--c`, `--viz-h`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file's list but the gate fails it without the exception, as on
the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): model, jacketing and thread programs as in the scenario, the status
reads "Pauzirano · t=0", no console errors or warnings, no network requests. An unknown id opens the default
state (ULT, the blocking-call threads) without errors. Each was stepped to its end (key S) and matches the
`expected` line in ossimulator's `scenarios.ts`.

| Concept | Link | End state checked |
|---|---|---|
| blocking call, ULT: one call blocks the whole process | `?scenario=ult-blocking` | t = 14, processor idle 5 cycles |
| blocking call, KLT: the other thread keeps running | `?scenario=klt-blocking` | t = 9, idle 0 |
| jacketing: the library switches threads instead of blocking | `?scenario=ult-jacketing` | t = 9, idle 0 |
| multicore: ULT leaves the second CPU idle (press 2 for KLT) | `?scenario=multicore` | t = 14, idle 14 (CPU 1 all the time), parallelism 1 |

The task names the jacketing scenario `jacketing`; its id in the build is `ult-jacketing`. Not listed:
`ult-timeslice`, `ult-lock`, `combined`, `costs` (the page's own scenario menu has them). `sim.json` has no
`entries` yet: the task says to list the links here, and OPEN.md still waits on the owner about how many preset
lines the home page shows. The manifest accepts them as
`{ "preset": "ult-blocking", "query": "scenario=ult-blocking", … }`.

## Checked

- `node --test sims/threads/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the four deep-link scenario ids are in the build.
- `npm run gate -- threads` passes: the kit-free browser checks on the built file (no network, no console errors,
  no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks waived
  under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale (thread
  cards carry names and state labels, the blocked thread is hatched), the phone layout is one long column
  (≈ 10 800 px) with no sideways scroll.
- Not checked: English (there is none yet); the KLT half of `multicore` (press 2 after loading) *(check)*; the
  page in a real lecture on the projector *(check)*.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms are all in `kit/glossary.js`
(*user-level thread* and *kernel-level thread* as one entry, "user-level / kernel-level threads (ULT / KLT)").

## Time

Start 23:48, done 23:53 (2026-10-02, by the clock on `nuc`), about 5 minutes.
