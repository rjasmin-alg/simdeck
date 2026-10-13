<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# syscalls: notes

Task `docs/tasks/w1/syscalls.md`, catalogue entry `ossim-syscalls` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12); `sim.test.js` is `sims/raid-cache/sim.test.js` with this sim's id, hash and scenarios.

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/syscalls.html`, from ossimulator's
  `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is `?lang=hr|en`, else
  `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it, and links to other
  pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `ae2a3c55284ed592d4f2994a4427ed2c9a8706f310292af94b9075ad57434c98`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/syscalls.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `42ae7428243b17c52c2e79a81b642af500bb90a9f080362ecb5fde1e11de886f`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/syscalls.html`, built 2026-09-30 10:09 from
  `src/modules/syscalls/` (ossimulator HEAD `ce83949`; last change to the module `d3cc7ee`, 2026-09-30 09:36; to
  the module or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/syscalls/` or `src/shared/`
  was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `931ede153ff734a7a31d32ebbc99efb3c301bed83cf78b25f4ab5f77c07c8033`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="syscalls"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept come from ossimulator's `meta.ts` (`title`, `subtitle`) unchanged; the English is
  a translation. The `meta.ts` summary is 247 characters, over the 160 limit, so it is shortened: "korak po korak
  na Tanenbaumovih 11 koraka poziva read()" became "u 11 koraka poziva read()", and the last sentence
  ("Blokirajući read pokazuje razliku između promjene načina rada i promjene konteksta.") became "blokirajući
  read" (150 characters). English 148.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`; `tags.json` has no
  narrower system-call tag, and the `operating-systems` tag already has "system call" / "sistemski poziv" as
  aliases). Aliases are the `meta.ts` terms, split where `meta.ts` pairs two in one ("user mode / kernel mode",
  "system call (Stallings: supervisor call)").
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Unchanged,
  except where `meta.ts` runs past the limits (then the earlier, shorter English stays).

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, the call path, CPU, stack and system call table, event log, timeline, scenarios, theory) scrolls; page height 5208 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and `--viz-h`, set inline at runtime, which the gate cannot see defined |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file but the gate showed it failing, so it is declared, as
in the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with every
non-file request aborted (Playwright): the scenario menu shows the scenario, the status reads "Pauzirano · t=0",
no console errors, no network requests. The page has no "run to end" button, so each was then stepped with S
until it stopped:

| Concept | Link | End state, stepped with S |
|---|---|---|
| the 11 steps of read() (data in cache) | `?scenario=read-11-steps` | step 11 at t = 14; U/K steps 7 / 7, 2 mode switches, 0 process switches, return value 64 |
| blocking read (mode switch vs process switch) | `?scenario=read-blocking` | step 11 at t = 23; U/K steps 10 / 13, 4 mode switches, 2 process switches, return value 64 |
| privileged instruction instead of a call (trap, the process ends) | `?scenario=privileged` | t = 3: the kernel ends process P (pid 100), Running → Exit; 1 mode switch, no system call |

An unknown id opens the default state (read, no scenario) without errors. Not listed (the page's own menu has
them): `getpid`, `write-hello`, `bad-fd`, `bad-pointer`. `sim.json` has no `entries` yet: the task says to list
the links here, and OPEN.md still waits on the owner about how many preset lines the home page shows. The manifest
accepts them as `{ "preset": "read-11-steps", "query": "scenario=read-11-steps", … }`.

## Checked

- `node --test sims/syscalls/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the three deep-link scenario ids are in the build.
- `npm run gate -- syscalls` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: dark follows the OS,
  grayscale keeps every state readable (the selected call and presets are inverted, numbered key badges, mode
  and status are words), the phone layout is one long column (10507 px) without sideways scroll.
- Not checked: a read-through of the English; the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- The page names `read`, `write`, `getpid`, `open`, `close`, `stdin`/`stdout`/`stderr` and a file path. These are
  the subject being taught (Tanenbaum's read() example), so the "concepts, not tools" rule allows them.
- Overlap: `interrupts` (the trap vs interrupt), `processes` and the `os-call-journey` task (`journey` in
  ossimulator) link here; one concept each, so nothing to merge.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*system call*, *user / kernel
mode*, *privileged instruction*, *trap instruction*, *system call table*, *handler*, *mode switch*, *process
switch*) are ossimulator's own pairs.

## Time

Start 05:11, done 05:16 (2026-10-02), about 5 minutes (following the raid-cache import).
