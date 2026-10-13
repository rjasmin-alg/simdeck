<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# os-map: notes

Task `docs/tasks/w1/os-map.md`, catalogue entry `ossim-map` (§2.3). Adopted as a built single file from
ossimulator's map page (`src/index.html`, `src/map/main.ts`, `src/shared/map/`), which stays the source of truth
(`docs/site-structure.md` §0): **never fix this copy**. A defect goes into ossimulator, and the build is
re-imported. Done the same way as `sims/interrupts/` and the other ossimulator imports (COMMON §12).

## Import

- **Current import** (t-0118, 2026-10-13): `~/projects/ossimulator/dist-simdeck/os-map.html`, from ossimulator's `npm
  run build` at `93da8f8` (tag `i18n`): one file with Croatian and English. The language is `?lang=hr|en`, else
  `localStorage['simdeck.lang']` (the kit's key), else Croatian; the toolbar button switches it, and links to other
  pages carry `?lang=`. Links unchanged from `f41eda4`. sha256
  `a9fdfc5e0c7e10b9d777af4fc74f82859342f2aae473c1209537d7e10eca7a64`.
- Previous import (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/os-map.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `0b3f393edf8c70414bdc8ca4ee8b037093de21e64795d1862e292192c9f1bb3c`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/index.html`, built 2026-09-30 10:09 (ossimulator HEAD `ce83949`;
  last change to `src/map`, `src/index.html` or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/` was
  newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `88d18ac73f82130bc87da05d1fab701698edb775ee23decdf0746ed9511671f2`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="os-map"` on `<html>`, the `#simdeck-meta` placeholder (from
  `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- `origin` is `ossimulator/index` (the task's choice: the build file is `index.html`; the page itself calls
  itself `map`, `PageId` `'map'`).
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- The task says to take title, concept and summary from `src/modules/index/meta.ts`. **That file does not exist**:
  the map is not a module and has no `meta.ts`. They come from the page itself (`src/shared/map/map-page.ts`):
  title is its h1 "Karta operacijskog sustava"; concept "operacijski sustav u slojevima" is the catalogue's
  "layered OS overview" in the page's words; the Croatian summary (152 characters) is the page lead's second and
  third sentence and the panel intro joined ("Sustav u slojevima, od korisničkog prostora preko sistemskih poziva i
  jezgre do hardvera; odaberite modul za sažetak, ključne pojmove i povezane module."). The lead's first sentence
  (course, Stallings 9th ed.) is left out to fit.
- English title "Operating system map", concept "the operating system in layers", summary a translation (152).
  The map has no `meta.ts`; its own heading in English is "Operating system map" too (`src/shared/map/map-page.ts`).
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`). Aliases: map, the
  layer names (user space, kernel) and "operating system layers".
- No `languages` field (since t-0118): the build carries Croatian and English, so the single-language exception
  (COMMON §4) is gone. The English title, concept and summary were checked against ossimulator's `meta.ts`. Unchanged,
  except where `meta.ts` runs past the limits (then the earlier, shorter English stays).

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons and column titles); body text 16 px at 1920×1080 |
| `one-screen` | header, four layer bands and the side panel; page height 1262 px at 1920×1080 |
| `tokens` | ossimulator's own design tokens (`--bg`, `--panel`, …) and two set at runtime (`--viz-h`, `--c`) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared. `tokens` is not in the task file's list,
but the gate fails without it, as on the other imports. `phone` and `motion` pass. The gate reports no unused
exceptions.

## Deep links

The map has no scenarios: the task's "each opens paused with `?scenario=<id>`" is the generic import text and does
not apply. The page's only deep link is `?m=<id>` (also `#m=<id>`), which selects that module, opens its panel
(summary, key terms, chapters, related modules, "Otvori simulator") and focuses its node. Checked for all 16 ids
from `file://` with every non-file request aborted (Playwright, 1920×1080): the right node is selected and
focused, the panel shows its title, no console errors or warnings, no network requests. An unknown id opens the
plain map without errors.

`?m=` takes ossimulator's module ids; for an index entry the module the link focuses is what matters, so the
simdeck sim is listed alongside:

| `?m=` | Focuses | simdeck sim |
|---|---|---|
| `interrupts` | Prekidi | `interrupts` |
| `processes` | Procesi | `processes` |
| `scheduling` | Raspoređivanje procesora | `scheduling` |
| `memory-allocation` | Dodjela memorije | `memory-allocation` |
| `address-translation` | Prevođenje adresa | `address-translation` |
| `page-replacement` | Zamjena stranica | `page-replacement` |
| `threads` | Dretve | `threads` |
| `sync` | Međusobno isključivanje i sinkronizacija | `synchronization` |
| `deadlock` | Potpuni zastoj | `deadlock` |
| `io-techniques` | Tehnike U/I i međuspremnici | `io-techniques` |
| `disk-scheduling` | Raspoređivanje diska | `disk-scheduling` |
| `raid-cache` | RAID i priručna memorija diska | `raid-cache` |
| `drivers` | Upravljački programi | none yet (`w1/drivers.md`) |
| `filesystem` | Datotečni sustav | `filesystem` |
| `syscalls` | Sistemski pozivi | `syscalls` |
| `journey` | Put jednog poziva | `os-call-journey` |

`sim.json` has no `entries`: the task says to list the links here, and OPEN.md still waits on the owner about
preset lines on the home page. A map focus is not really a preset of this sim; probably no entries are wanted
at all (the module sims have their own lines).

## Checked

- `node --test sims/os-map/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the build's module id list equals the 16 deep-link ids
  and the page reads `?m=`.
- `npm run gate -- os-map` passes: the kit-free browser checks on the built file (no network, no console errors,
  no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks waived
  under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: readable in grayscale (layers
  are labelled bands, the system-call band is dashed, wip modules have a dashed "u izradi" badge), the phone
  layout is one column (≈ 2620 px) with each node labelled with its column, no sideways scroll.
- Not checked: a read-through of the English; the panel as a bottom sheet on the phone *(check)*; the page on the
  projector *(check)*.

## Defects for ossimulator

- ~~"Otvori simulator" points outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Each of the 16 module panels (`?m=<module>`) links its simdeck
  folder, and the header's "simdeck" link opens the simdeck home (`../../index.html`); all clicked on the built site.
- ~~"u izradi" badges~~: with f41eda4 all 16 modules are `ready` in ossimulator, and no panel shows the badge. If
  simdeck drops a page, map it to `null` in ossimulator's `src/shared/simdeck.json` and re-import.
- **The header's "simdeck" link drops `?lang=`** (found in t-0118, build `93da8f8`): it is the bare
  `SIMDECK_HOME` (`../../index.html`, `src/shared/map/map-page.ts`), while every link to a module carries `?lang=`.
  Opened as `os-map/index.html?lang=en` with nothing stored (a course page's English link, the visitor never pressed
  a switch), the link lands on the home page in Croatian. With a stored choice (`simdeck.lang`) it lands in that
  language, so the round trip from the home page's switch works. Fix in ossimulator: append `?lang=` there as the
  module links do, then re-import. Status stays `ready`: the link works, only the language falls back.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here.

## Time

Start 00:17, done 00:27 (2026-10-03, by the clock on `nuc`), about 10 minutes.
