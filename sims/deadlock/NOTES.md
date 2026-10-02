<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# deadlock: notes

Task `docs/tasks/w1/deadlock.md`, catalogue entry `ossim-deadlock` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12); `sim.test.js` is `sims/synchronization/sim.test.js` with this sim's id, hash and scenarios.

## Import

- Source: `~/projects/ossimulator/dist-single/deadlock.html`, built 2026-09-30 10:09 from `src/modules/deadlock/`
  (ossimulator HEAD `ce83949`; last change to the module `3de35fd`, 2026-09-30 07:45; to the module or
  `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/deadlock/` or `src/shared/` was newer than
  the build, so it was not rebuilt.
- sha256 of the build as imported: `0fb9d77c1dab8ffee326e3cf370079a51655ec6d2fcde2d2e2ab525e350a7d8b`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="deadlock"` on `<html>`, the `#simdeck-meta` placeholder (from
  `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`)
  unchanged; the summary is 158 characters, within the limit. The English is a translation (summary 159).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`). Aliases are the
  `meta.ts` terms, plus deadlock detection.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, the simulation with RAG, banker, detection and philosophers tabs, event log, timeline, scenarios, theory) scrolls; page height 5162 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and `--viz-h`, set inline at runtime, which the gate cannot see defined |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file but the gate showed it failing, so it is declared, as
in the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded and its tab selected (`?scenario=<id>`). Checked
from `file://` with every non-file request aborted (Playwright): the scenario menu shows the scenario, the status
reads "Pauzirano · t=0", no console errors, no network requests. Then "Do kraja" was run on each:

| Concept | Link | Opens on tab | End state with "Do kraja" |
|---|---|---|---|
| RAG cycle, classic two-process deadlock | `?scenario=rag-classic` | RAG | "Potpuni zastoj: P1, P2", t = 2 |
| banker, safe state (Stallings fig. 6.7) | `?scenario=banker-safe` | Bankar | "Sigurno stanje: P2, P1, P3, P4", t = 6 |
| banker, unsafe request (fig. 6.8) | `?scenario=banker-unsafe` | Bankar | "Zahtjev odbijen: P1", t = 8 |
| detection (fig. 6.10) | `?scenario=detect-fig610` | Otkrivanje | "Potpuni zastoj: P1, P2", t = 8 |
| dining philosophers, naive | `?scenario=dining-naive` | Filozofi | "Potpuni zastoj u taktu 3", t = 3 |

An unknown id opens the default state (RAG tab, no scenario) without errors. Not listed (the page's own menu has
them): `rag-hold-and-wait`, `rag-no-preemption`, `rag-ordering`, `rag-multi`, `banker-initiation`,
`banker-claim-exceeded`, `detect-recover`, `detect-tanenbaum`, `dining-ordered`, `dining-room`, `dining-random`,
`dining-monitor`. `sim.json` has no `entries` yet: the task says to list the links here, and OPEN.md still waits
on the owner about how many preset lines the home page shows. The manifest accepts them as
`{ "preset": "rag-classic", "query": "scenario=rag-classic", … }`.

## Checked

- `node --test sims/deadlock/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the five deep-link scenario ids are in the build.
- `npm run gate -- deadlock` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: dark follows the OS,
  grayscale keeps every state readable (selected buttons are inverted, statuses are words, P1/P2 are labelled),
  the phone layout is one long column (12410 px) without sideways scroll.
- Not checked: English (there is none yet); the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (textbook results from Stallings / Tanenbaum). These are not the
  estate's instructor answers, so the "no answer keys" rule does not apply; whether to hide them for class
  exercises is ossimulator's decision.

## Defects for ossimulator

- **Navigation links point outside the folder** (as in the other ossimulator imports). "Natrag na kartu" links
  `./index.html?m=deadlock` (in simdeck that is the page itself); "Povezano" and the theory links go to
  `./sync.html` (also `?scenario=pc-bounded-deadlock`), `./processes.html`, `./scheduling.html?scenario=starvation`
  and `./threads.html`, all missing in `sims/deadlock/`. A simdeck build target should link `../../index.html`
  and `../<id>/index.html?scenario=…` (simdeck folders: `synchronization`, `processes`, `scheduling`), or hide
  links to pages simdeck does not have.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*deadlock*, *resource
allocation graph*, *circular wait*, *deadlock avoidance*, *banker's algorithm*, *safe state*, *dining
philosophers problem*) are ossimulator's own pairs.

## Time

Start 04:59, done 05:20 (2026-10-02), about 21 minutes.
