<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# scheduling: notes

Task `docs/tasks/w1/scheduling.md`, catalogue entry `ossim-scheduling` (§2.3). Adopted as a built single file from
ossimulator, which stays the source of truth (`docs/site-structure.md` §0): **never fix this copy**. A defect goes
into ossimulator, and the build is re-imported. Done the same way as `sims/interrupts/` and `sims/processes/`
(COMMON §12).

## Import

- Source: `~/projects/ossimulator/dist-single/scheduling.html`, built 2026-09-30 10:09 from
  `src/modules/scheduling/` (ossimulator HEAD `ce83949`, last change to the module or `src/shared` `be6fb14`,
  2026-09-30 10:05). Nothing in `src/` was newer than the build, so it was not rebuilt.
- sha256 of the build as imported: `6607c9acb5b6a76d099b54698cf78754df5a34be5717bc2f479b79f21d360a09`.
  `sim.test.js` takes the markers out again and checks this hash, so a hand edit of the copy fails the tests.
- The only edits are the import markers: `data-sim="scheduling"` on `<html>`, the `#simdeck-meta` placeholder
  (from `sim.json`, `lib/manifest.mjs` `metaFor`) and the `#simdeck-exceptions` block, both first in `<head>`.
- Re-import: copy the new build to `index.html`, re-add the three markers, put its sha256 in `sim.test.js`.

## Metadata

- `sim.json` title, concept and summary come from ossimulator's `meta.ts` (`title`, `subtitle`, `summary`). The
  Croatian summary is shortened to fit 160 characters ("Stallingsove" and the repeated "vrijeme obrtanja"
  dropped); the English is a translation of the shortened one. The concept (`subtitle`) is the list of policy
  names, the same in both languages.
- Class `explorer`, topic `os`, tag `operating-systems`, level `core` (all in `tags.json`); aliases from the
  `meta.ts` terms.
- `languages: ["hr"]`: the build is Croatian only (single-language exception, COMMON §4). English comes from
  ossimulator's source (task `w0/ossimulator-english`), then a re-import.

## Declared exceptions

| Rule | Why |
|---|---|
| `text-size` | ossimulator's text floor is 14 px (15 px header buttons); body text is 16 px at 1920×1080 |
| `one-screen` | the layout (settings, controls, CPU and ready queue, event log, Gantt chart, results, scenarios, theory) scrolls; page height ≈ 4724 px at 1920×1080 |
| `tokens` | ossimulator has its own design tokens (`--bg`, `--panel`, …), and two it uses without a fallback the gate cannot see defined (`--c`, `--viz-h`, set inline at runtime) |
| `kit` | an adopted page with its own runtime; it never mounts the kit |

The task file also names `languages`; per COMMON §12 it is not declared (the single-language exception is
`sim.json` `languages`). `phone` and `motion` pass, so they are not declared. The gate reports no unused
exceptions.

## Deep links

Each opens the page paused at t = 0 with the scenario loaded (`?scenario=<id>`). Checked from `file://` with
every non-file request aborted (Playwright): the scenario menu shows the scenario, the algorithm menu the right
policy, the status reads "Pauzirano · t=0", no console errors, no network requests. An unknown id opens the
default state (FCFS on Stallings' set) without errors.

| Concept | Link |
|---|---|
| FCFS vs RR vs SRT (comparison) | `?scenario=compare-fcfs-rr4-srt` |
| quantum size: RR q = 1, RR q = 4, FCFS | `?scenario=rr-quantum` |
| SPN | `?scenario=stallings-spn` |
| SRT | `?scenario=stallings-srt` |
| HRRN | `?scenario=stallings-hrrn` |
| MLFQ (Feedback, q = 1) | `?scenario=stallings-fb1` |
| starvation (priorities) | `?scenario=starvation` |
| aging (k = 2) | `?scenario=aging` |

Not listed: `stallings-fcfs`, `stallings-rr1`, `stallings-rr4`, `stallings-fb2i`, `prio-nonpreempt`,
`prio-preempt`, `aging-preemptive` (the page's own scenario menu has them). `sim.json` has no `entries` yet: the
task says to list the links here, and OPEN.md still waits on the owner about how many preset lines the home
page shows. The manifest accepts them as `{ "preset": "aging", "query": "scenario=aging", … }`.

## Checked

- `node --test sims/scheduling/sim.test.js`: the copy equals the build but for the markers, the markers are well
  formed, the meta placeholder equals `metaFor(sim.json)`, the eight deep-link scenario ids are in the build.
- `npm run gate -- scheduling` passes: the kit-free browser checks on the built file (no network, no console
  errors, no sideways scroll at 375×812, theme follows the OS, reduced motion, `<html lang>`); the kit-only
  checks waived under `kit`. Screenshots (1920×1080 light, dark, grayscale; 375×812) reviewed, plus a grayscale
  shot of the finished FCFS/RR/SRT comparison: Gantt bars carry the process letter, waiting is hatched and idle
  is outlined, so colour is never the only carrier. The phone layout is one long column (≈ 10 770 px), no
  sideways scroll.
- Not checked: English (there is none yet); the page in a real lecture on the projector *(check)*.

## Observations (not defects)

- Each scenario card shows an "Očekivano:" line (Stallings' finish times and mean Tr, Tr/Ts from table 9.5). These
  are textbook numbers, not the estate's instructor answers, so the "no answer keys" rule does not apply; whether
  the cards should hide them for class exercises is ossimulator's decision.

## Defects for ossimulator

- **Navigation links point outside the folder** (as in `sims/interrupts/` and `sims/processes/`). "Natrag na
  kartu" links `./index.html?m=scheduling` (in simdeck that is the page itself); "Povezano" and the theory links
  go to `./processes.html`, `./interrupts.html`, `./threads.html`, `./sync.html`, `./journey.html` (with
  `?scenario=timer`, `?scenario=stallings-trace`, `?scenario=read-miss`), all missing in `sims/scheduling/`. A
  simdeck build target should link `../../index.html` and `../<id>/index.html?scenario=…`, or hide links to
  pages simdeck does not have.

## Shared requests

None.

## Term pairs

The page does not use the kit glossary, so none are needed here. The `meta.ts` terms (*scheduling*,
*preemption*, *time quantum*, *turnaround time*, *normalized turnaround time*, *starvation*, *aging*) are
ossimulator's own pairs. All but *scheduling* = raspoređivanje are in `kit/glossary.js`
(it has *scheduler*, *short- / medium- / long-term scheduling*); the page does not need it, but a native sim on
the topic would: *scheduling* = raspoređivanje (ossimulator `meta.ts`).

## Time

Start 04:36, done 04:55 (2026-10-02), about 20 minutes.
