<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# synchronization: notes

Task `docs/tasks/w1/synchronization.md`, catalogue entry `ossim-sync` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/`, `sims/processes/`,
`sims/scheduling/`, `sims/address-translation/` and `sims/page-replacement/` (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/synchronization.html`, from
  ossimulator's `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is
  `?lang=hr|en`, else `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it,
  and links to other pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `0ece74c340ea960ad1382e7c71434207513451c865275fa7090f97b5fc826911`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/synchronization.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `3190e334492c8b2de9e21153526e187afe0fe8bb98172458c7c3abaa19e1ad7d`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/sync.html`, built 2026-09-30 10:09 from `src/modules/sync/`
  (ossimulator HEAD `ce83949`; last change to the module `6b51b81`, 2026-09-30 07:59; to the module or
  `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/sync/` or `src/shared/` was newer than the
  build, so it was not rebuilt.
- sha256 of the build as imported: `90c40084a53d7b31d744d0a06baf071374473232c3fa6ea60dd5ab23ea7bfac9`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests
  (checked: one changed word fails it).
- The only edits are the import markers: `data-sim="synchronization"` on `<html>`, the `#simdeck-meta`
  placeholder (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in
  `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.
- The folder is `synchronization` (the task's id); ossimulator's module id is `sync`, so `origin` is
  `ossimulator/sync`, and the test checks that instead of `ossimulator/<folder>`.

## Metadata

- `sim.json` title and concept come from ossimulator's `meta.ts` (`title`, `subtitle`) unchanged. Its `summary`
  is 263 characters, over the 160 limit, so it is shortened: "Konkurentni pseudokod korak po korak: utrka,
  Stallingsovi pokušaji, Peterson, semafori, monitori, proizvođač–potrošač i čitatelji–pisači." (137). Dropped:
  Dekker, atomic instructions and the checker sentence; Peterson kept because the task's goal names it. The
  English is a translation.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`). Aliases from the
  `meta.ts` terms, plus readers–writers, Peterson and Dekker.
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Concept
  now "race conditions, semaphores, monitors", its `subtitle`.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, code panes, shared memory and objects, checker, event log, timeline, scenarios, theory) scrolls; page height ≈ 4044 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two it uses without a fallback the gate cannot see defined (`--viz-h`, `--sync-cols`, set inline at runtime) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` pass, so they are not declared. The gate reports no unused
exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the program and scenario menus show the scenario, the status reads
"Pauzirano · t=0", no console errors, no network requests. Then "Do kraja" was run on each, and each stopped as its
card's "Očekivano" line says. An unknown id opens the default state (Brojač x++, no scenario) without errors.

| Concept | Link | End state with "Do kraja" |
|---|---|---|
| lost update (x = x + 1, two threads) | `?scenario=race-counter-lost-update` | all threads finished at t = 6, x = 1 |
| attempt 2 violates mutual exclusion | `?scenario=attempt2-violation` | stops on the violation |
| attempt 3: no way out (both flags set) | `?scenario=attempt3-trap` | step limit; livelock warning |
| attempt 4: livelock | `?scenario=attempt4-livelock` | step limit; livelock warning |
| producer–consumer deadlock (swapped semWait) | `?scenario=pc-bounded-deadlock` | deadlock, all threads blocked |
| readers–writers, writer priority, reader first (Stallings table 5.6) | `?scenario=rw-writers-read-first` | script finished |
| readers–writers, writer priority, writer first (table 5.6) | `?scenario=rw-writers-write-first` | script finished |

The catalogue's "attempts 2–4" are the three `attempt*` scenarios; its "readers–writers" is the two table 5.6
scenarios (the build has no readers-priority scenario; the program `rw-readers` is in the program menu).
Not listed: `echo-stallings` and `pc-table-5-4` (the page's own menu has them). Peterson, Dekker, the atomic
instructions and monitors are programs, not scenarios, so they have no deep link. `sim.json` has no `entries`
yet: the task says to list the links here, and OPEN.md still waits on the owner about how many preset lines the
home page shows. The manifest accepts them as
`{ "preset": "pc-bounded-deadlock", "query": "scenario=pc-bounded-deadlock", … }`.

## Checked

- `node --test sims/synchronization/sim.test.js`: the copy equals the build but for the markers, the markers are
  well formed, the meta placeholder equals `metaFor(sim.json)`, the seven deep-link scenario ids are in the build.
- `npm run gate -- synchronization` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: dark follows the OS,
  grayscale keeps every state readable (selected buttons are inverted, statuses are words), the phone layout is
  one long column (≈ 8851 px) without sideways scroll.
- Not checked: a read-through of the English; the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (textbook results from Stallings). These are not the estate's
  instructor answers, so the "no answer keys" rule does not apply; whether to hide them for class exercises is
  ossimulator's decision.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*race condition*,
*critical section*, *mutual exclusion*, *busy waiting*, *semaphore*, *monitor*, *livelock*,
*producer–consumer*) are ossimulator's own pairs.

## Time

Start 04:53, done 05:15 (2026-10-02), about 22 minutes.
