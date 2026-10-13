<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# interrupts: notes

Task `docs/tasks/w1/interrupts.md`, catalogue entry `ossim-interrupts` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported.

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/interrupts.html`, from ossimulator's
  `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is `?lang=hr|en`, else
  `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it, and links to other
  pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `a896865ada11a4ff9c28b72e55e0c2d7153e61ab73ede08fdaedbe45836ba24f`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/interrupts.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `3d78e6bb22db8d6bae46ba3a55660bfface00dbb01c1f4060762229244696808`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/interrupts.html`, built 2026-09-30 10:09 from
  `src/modules/interrupts/` (ossimulator HEAD `ce83949`, last change to the module `9cdf062`). Nothing in `src/`
  was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `03af0e9d619ff4ac56feec45081287a89043bd8f8598774384ba58e4e7cec1ca`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="interrupts"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`). The
  Croatian summary is shortened to fit 160 characters; the English is a translation.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core`; aliases from the `meta.ts` terms.
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Unchanged,
  except where `meta.ts` runs past the limits (then the earlier, shorter English stays).

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px; body text is 16 px at 1920×1080 |
| `one-screen` | the six-section layout scrolls (page height ≈ 4650 px at 1920×1080) |
| `tokens` | ossimulator has its own design tokens, not the kit's |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

`kit` can be waived on adopted pages (`origin` set) since task t-0022; the gate then runs
`scripts/check-adopted.mjs`, the browser checks that need no kit, in each language (hr and en since t-0118). The
page's `languages` exception was dropped then, as it waived nothing (the kit-only language checks are under `kit`).

## Deep links

Each opens the page paused with the scenario loaded (`?scenario=<id>`; ossimulator's `layout.ts` loads it with
`autoplay: false`). Checked from `file://` (screenshots in the thread's library).

| Concept | Link | Note |
|---|---|---|
| sequential handling | `?scenario=stallings-sequential` | Stallings' example, nesting off |
| nested handling | `?scenario=stallings` | the same requests, nesting on |
| stack overflow | `?scenario=cascade` | overflows only with a limited stack of 3 frames and "write anyway" (the default settings); the scenario keeps the user's current settings (`base: 'current'`) |
| re-entrant ISR | `?scenario=burst` | the re-entrant option must be switched on by hand; the scenario keeps current settings |
| interrupt vs exception vs syscall | `?scenario=sync` | |

Not listed: `reverse`, `storm`, `timer`, `disk-irq` (the page's own scenario menu has them).
`sim.json` has no `entries` yet: the task says to list the links here, and OPEN.md still waits on the owner about
how many preset lines the home page shows. The manifest already accepts them as
`{ "preset": "stallings", "query": "scenario=stallings", … }`.

## Checked

- `node --test sims/interrupts/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the deep-link scenario ids are in the build.
- From `file://` with every non-file request aborted (Playwright, light, dark, reduced motion, 375×812 and each
  deep link): no network requests, no console errors or warnings, the theme follows the OS, nothing scrolls
  sideways on a phone, `?motion=reduce` is read by the page's boot script.
- The gate (since t-0022) runs the kit-free browser checks on the built file: no network, no console errors, no
  sideways scroll at 375×812, the theme follows the OS, reduced motion, `<html lang>`; the kit-only checks are
  waived under `kit`.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

- ~~Gate support for ossimulator imports~~: done in t-0022 (`kit` waivable on adopted pages,
  `scripts/check-adopted.mjs`).

## Term pairs

The page does not use the kit glossary, so none are needed here. For later: *interrupt service routine (ISR)* =
prekidna rutina, *interrupt priority level (IPL)* = razina prioriteta prekida, *nested interrupts* = ugniježđeni
prekidi, *interrupt vector table (IVT)* = tablica vektora prekida, *exception (trap)* = iznimka (ossimulator
`meta.ts`) are not in `kit/glossary.js`.

## Time

Start 04:11, done 04:25 (2026-10-02), about 15 minutes.
