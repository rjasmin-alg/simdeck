<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# address-translation: notes

Task `docs/tasks/w1/address-translation.md`, catalogue entry `ossim-address-translation` (§2.3). Adopted as a built
single file from ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this
copy**. A defect goes into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/`,
`sims/processes/` and `sims/scheduling/` (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/address-translation.html`, from
  ossimulator's `npm run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is
  `?lang=hr|en`, else `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it,
  and links to other pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `201c522a6dc4a84b88ebccab158510ec11b67492e14b3b0b1d26c18c95f6531e`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/address-translation.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `c4067e53023b7fb251635c034f0ba2f0c2c896734522264995b9b4369ad5df39`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/address-translation.html`, built 2026-09-30 10:09 from
  `src/modules/address-translation/` (ossimulator HEAD `ce83949`; last change to the module `650a064`, to the module
  or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/address-translation/` or `src/shared/` was
  newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `c093ecfd79aed24f47bdac26b612204b6cff49acf9ab584d3bca60b628de79c4`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="address-translation"` on `<html>`, the `#simdeck-meta`
  placeholder (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in
  `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`); the
  Croatian fits the limits unchanged (summary 147 characters). The English is a translation.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms (English *translation lookaside buffer (TLB)* without the parenthesis, since `TLB` is the
  Croatian alias too).
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Summary
  now its `summary` (152 characters), which fits.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, the five translation stages with the kernel fault handler, event log, timeline, scenarios, theory) scrolls; page height ≈ 4727 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and one it uses without a fallback the gate cannot see defined (`--viz-h`, set inline at runtime) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` pass, so they are not declared. The gate reports no unused
exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the scenario menu shows the scenario, the access list is the
scenario's, the status reads "Pauzirano · t=0", no console errors, no network requests. An unknown id opens the
default state (paging, the default access list) without errors.

| Concept | Link |
|---|---|
| paging split (Stallings, 1502 → 6622) | `?scenario=stallings-paging` |
| TLB locality (2-entry TLB, LRU then FIFO) | `?scenario=tlb-locality` |
| two-level walk (3 + 3 + 10 bits) | `?scenario=two-level-walk` |
| inverted table and its hash chain | `?scenario=inverted-chain` |
| protection fault (unmapped page 9) | `?scenario=protection-fault` |

Not listed: `stallings-segmentation`, `two-level-32bit`, `journey-page-fault` (the page's own scenario menu has
them). `sim.json` has no `entries` yet: the task says to list the links here, and OPEN.md still waits on the owner
about how many preset lines the home page shows. The manifest accepts them as
`{ "preset": "tlb-locality", "query": "scenario=tlb-locality", … }`.

## Checked

- `node --test sims/address-translation/sim.test.js`: the copy equals the build but for the markers, the markers
  are well formed, the meta placeholder equals `metaFor(sim.json)`, the five deep-link scenario ids are in the
  build.
- `npm run gate -- address-translation` passes: the kit-free browser checks on the built file (no network, no
  console errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the
  kit-only checks waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed, plus a
  grayscale shot of the finished `tlb-locality` run: its physical addresses (6622, 6244, 25605, 6844, 5120,
  26623, 5184), 3 TLB hits and 25 ticks match the scenario's expected line; on the timeline TLB misses are
  hatched and every bar carries a label (SPL, PA, HIT, MISS, PTE, D), so colour is never the only carrier. The
  phone layout is one long column (≈ 10 600 px), no sideways scroll.
- Not checked: a read-through of the English; the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (textbook results, e.g. Stallings' 1502 → 6622). These are
  textbook numbers, not the estate's instructor answers, so the "no answer keys" rule does not apply; whether the
  cards should hide them for class exercises is ossimulator's decision.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*paging*, *segmentation*,
*logical address*, *physical address*, *page table*, *translation lookaside buffer (TLB)*, *page fault*) are
ossimulator's own pairs.

## Time

Start 04:42, done 05:00 (2026-10-02), about 20 minutes.
