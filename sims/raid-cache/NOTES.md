<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# raid-cache: notes

Task `docs/tasks/w1/raid-cache.md`, catalogue entry `ossim-raid-cache` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and the other ossimulator
imports (COMMON §12); `sim.test.js` is `sims/deadlock/sim.test.js` with this sim's id, hash and scenarios.

## Import

- **Current import** (t-0094, 2026-10-03): `~/projects/ossimulator/dist-simdeck/raid-cache.html`, from ossimulator's
  `npm run build:simdeck` at `f41eda4` (links laid out for `sims/<folder>/`).
  sha256 `e6ce6808dc1fe50fa4c67b06122a895b9cc31cb8f31579037ad59e36bc56a9c1`. The entries below describe the first import,
  from `dist-single/`.
- Source: `~/projects/ossimulator/dist-single/raid-cache.html`, built 2026-09-30 10:09 from
  `src/modules/raid-cache/` (ossimulator HEAD `ce83949`; last change to the module `d63d007`, 2026-09-30 09:29; to
  the module or `src/shared` `be6fb14`, 2026-09-30 10:05). Nothing in `src/modules/raid-cache/` or `src/shared/`
  was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `7ca741b63dfb546242cd7ea232ff2d8d8e316e5032256d9bbe4c302a55a1bd6c`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="raid-cache"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title and concept come from ossimulator's `meta.ts` (`title`, `subtitle`) unchanged. The `meta.ts`
  summary is 187 characters, over the 160 limit, so it is shortened: "Gdje su podaci, a gdje paritet P i Q u
  razinama RAID 0–6" became "Paritet P i Q u RAID 0–6", and "te" became "i" (154 characters). The English is a
  translation (149).
- Class `explorer`, topic `os`, tags `raid` and `operating-systems`, level `core` (all in `tags.json`). Aliases
  are the `meta.ts` terms ("strip / stripe" split in two; "RAID" left out, since it is in the title).
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons, 13.3 px superscripts); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, the RAID array or disk cache view, event log, timeline, scenarios, theory) scrolls; page height 4861 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and `--viz-h`, set inline at runtime, which the gate cannot see defined |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `tokens` is not in the task file but the gate showed it failing, so it is declared, as
in the other imports. `phone` and `motion` pass, so they are not declared. The gate reports no unused exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with every
non-file request aborted (Playwright): the scenario menu shows the scenario, the status reads "Pauzirano · t=0",
no console errors, no network requests. Then "Do kraja" was run on each:

| Concept | Link | End state with "Do kraja" |
|---|---|---|
| RAID 5 layout, rotating parity | `?scenario=raid5-layout` | "Gotovo", t = 1 |
| XOR reconstruct after a disk failure, rebuild | `?scenario=raid5-reconstruct` | "Gotovo", t = 8 (3 operations + 5 rebuild ticks, as the scenario expects) |
| small-write penalty (read–modify–write) | `?scenario=raid5-small-write` | "Gotovo", t = 1 |
| RAID 6 double failure | `?scenario=raid6-double-failure` | "Gotovo", t = 17 |
| LRU vs LFU vs FBR (LFU keeps a dead block) | `?scenario=cache-dead-burst` | comparison at t = 16: hits LRU 9, LFU 3, FBR (2 parts) 9, FBR (3 parts) 9, as the scenario expects |

`cache-scan` (sequential scan, LRU 3, LFU 6, FBR 6 / 4) is a second LRU/LFU/FBR comparison where LFU wins; it
opens the same way and could be a sixth entry if the owner wants both sides of the comparison. An unknown id
opens the default state (RAID 5 tour, no scenario) without errors. Not listed (the page's own menu has them):
`raid0-no-redundancy`, `raid1-mirror`, `raid2-hamming`, `raid3-parallel`, `raid4-bottleneck`. `sim.json` has no
`entries` yet: the task says to list the links here, and OPEN.md still waits on the owner about how many preset
lines the home page shows. The manifest accepts them as
`{ "preset": "raid5-layout", "query": "scenario=raid5-layout", … }`.

## Checked

- `node --test sims/raid-cache/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the five deep-link scenario ids are in the build.
- `npm run gate -- raid-cache` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only checks
  waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed: dark follows the OS,
  grayscale keeps every state readable (hit/miss cells carry H/M letters and a hatch pattern, the selected disk
  count is inverted, statuses are words), the phone layout is one long column (10362 px) without sideways scroll.
- Not checked: English (there is none yet); the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (textbook results worked from Stallings ch. 11). These are not
  the estate's instructor answers, so the "no answer keys" rule does not apply; whether to hide them for class
  exercises is ossimulator's decision.
- Overlap §5.3: RAID levels live here. `lnx-mirror-not-backup` and `lnx-raid-rebuild` should link this sim
  (`raid5-reconstruct` for the rebuild) rather than build RAID again; that is for those tasks.

## Defects for ossimulator

- ~~Navigation links point outside the folder~~: fixed in ossimulator f41eda4 (simdeck build target,
  `dist-simdeck/`), re-imported in t-0094. Checked on the built site from `file://`: every in-page link opens an
  existing simdeck page, none points back at the page itself.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*strip / stripe*, *parity*,
*mirroring*, *small-write penalty*, *disk cache*, *frequency-based replacement*, *hit ratio*) are ossimulator's
own pairs.

## Time

Start 05:05, done 05:30 (2026-10-02), about 25 minutes.
