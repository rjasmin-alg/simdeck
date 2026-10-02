<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# interrupts: notes

Task `docs/tasks/w1/interrupts.md`, catalogue entry `ossim-interrupts` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported.

## Import

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
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4).

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px; body text is 16 px at 1920×1080 |
| `one-screen` | the six-section layout scrolls (page height ≈ 4650 px at 1920×1080) |
| `languages` | Croatian only until `ossimulator-english` lands |
| `tokens` | ossimulator has its own design tokens, not the kit's |

The task also asked for `kit`, but `kit` cannot be waived (`lib/contract.mjs`): declaring it makes
`npm run check` fail. It is left out, and the gate fails on it (see "Shared requests").

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
- Not checked by the gate: its browser step waits for `window.simdeck` (the kit), which this page never sets,
  so none of its browser checks run *(check)* once the gate can handle imports.

## Defects for ossimulator

- **Navigation links point outside the folder.** The single-file build links "Natrag na kartu" to `./index.html`
  (in simdeck that is the page itself) and "Povezano" to `./scheduling.html`, `./io-techniques.html`, … (missing
  in `sims/interrupts/`). A simdeck build target should link `../../index.html` and `../<id>/index.html`, or hide
  links to pages simdeck does not have.

## Shared requests

- **Gate support for ossimulator imports** (frame: `lib/contract.mjs`, `kit/tools/check-page.mjs`,
  `scripts/gate.mjs`). An imported build has no kit, and `kit` cannot be waived, so `npm run gate -- interrupts`
  cannot pass; the browser step stops at the kit and runs none of its other checks. Smallest change: let a page
  with `origin: "ossimulator/*"` skip the `kit` check (or make `kit` waivable for that origin) and run the page
  checks without `window.simdeck`.

## Term pairs

The page does not use the kit glossary, so none are needed here. For later: *interrupt service routine (ISR)* =
prekidna rutina, *interrupt priority level (IPL)* = razina prioriteta prekida, *nested interrupts* = ugniježđeni
prekidi, *interrupt vector table (IVT)* = tablica vektora prekida, *exception (trap)* = iznimka (ossimulator
`meta.ts`) are not in `kit/glossary.js`.

## Time

Start 04:11, done 04:25 (2026-10-02), about 15 minutes.
