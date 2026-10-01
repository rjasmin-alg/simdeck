# simdeck: design notes

Decisions and working assumptions from the proposal review (2026-09-30). These are not part of the proposal's argument; they are a head start for building it. Anything here can change without changing the proposal.

## Framework vs individual pages

- **Framework at build time, standalone at run time.** One shared kit (colour tokens / projector-safe palette, header + legend component, step/reset keyboard controller) lives in the source. The build inlines it into every native simulator, so each output is one self-contained HTML file that runs from `file://`.
- Precedent: `ossimulator` already builds a static multi-page site *and* one self-contained HTML per page for Moodle.
- A check script refuses pages that break the contract, like `single-page-labs/deploy.sh` refusing undefined CSS variables.

*Decided (docs/sim-ui.md):* the kit is `kit/`: `kit.css` (tokens, layout, controls), `kit.js` (step controller, controls, transport, shortcuts) and the bundled Atkinson Hyperlegible font, plus the proto-simulator `kit/template/` that `kit/new-sim.sh` copies. `kit.js` is a classic script, so a page runs unbuilt from `file://`; the build inlines the kit and fonts into each sim (docs/site-structure.md §5). The undefined-token check is in `kit/kit.test.js`, and `kit/tools/check-page.mjs` checks a page in the browser (Playwright, the repo's only dev dependency).

## Simulator contract (draft numbers, to be tuned)

- One concept per simulator; fits one screen at 1920×1080 with no scrolling.
- Readable from the back of the room: body text ≥ ~20 px; contrast checked against a washed-out projector palette.
- Driven from the lectern: step forward/back on ←/→ and PgUp/PgDn (what presentation clickers send), reset on one key.
- A demo runs in under 3–5 minutes.
- Works offline as a single file.
- Exceptions are allowed but must be declared per page and are counted.

*Decided (docs/sim-ui.md §2–§3, owner 2026-10-01):*
- 1920×1080 is the only projector target. Smaller projector sizes are not checked; phones stack and scroll.
- Body text: 1 rem = `clamp(16px, min(1.05vw, 1.86vh), 32px)`, i.e. 20 px at 1920×1080. Legends, hints and key badges have a 16 px floor.
- Contrast: every token pair is checked in both themes, also after a simulated 25 % projector washout (`kit/tools/contrast.mjs`). Colour is never the only carrier: "changed in this step" is yellow plus a thick outline.
- The theme always follows the OS. There is no theme switch and no stored choice.
- Keys: → / PgDn next, ← / PgUp back, **Space play/pause** (not "next": next is the clicker's), Home / End first / last, **R reset** (step 0 and the active preset's settings), 1–9 presets, F full screen, C hide the panel, B or `.` blank the screen, ? help.
- Exceptions are declared in the page as `#simdeck-exceptions` `[{"rule", "why"}]`; the frame's check counts them.

## Entries

- **Native:** single-file, in the repo, must pass the contract. The `single-page-labs` pages are copied in and adapted; all new simulators are native.
- ~~**Linked:**~~ *Superseded 2026-10-01 (owner): simdeck copies and adopts, it never links out.* ossimulator's subsimulators, `cephsim`, `faultline` and `topologydrafter` are copied in like the `single-page-labs` pages (from their existing builds) and appear only once copied. No linked entries, so a published folder is complete and works offline. See docs/site-structure.md §0.
- **Copies are canonical.** Once a page is imported, the simdeck copy is the one that gets fixed; the original collection is frozen with a note pointing here.

## Manifest (sketch)

One entry per simulator: `id`, `title`, `summary`, `tags`, `courses`, `kind` (native | linked), `url` (for linked) or `path` (for native), `lang`.

*Decided (docs/site-structure.md §2):* one `sim.json` per simulator in `sims/<id>/`, not one file. `kind`, `url` and `path` are gone (every sim is in the repo, and the folder is the path). `courses` is derived from the course files. Added: `concept`, `topic` (one per sim, for grouping), `level`, `status` (`wip` is not published), `class`, `steps`, `aliases`, `origin`, `asset_review`.

## Two modes, one manifest

- **Lecturer mode:** the index, with search and tag filters, opening whatever is needed on the fly (online).
- **Course list:** a small per-course file (course name + ordered list of simulator ids) generates one page to hand to students. It links into the same deployed system; offline bundling is a later version.

*Decided (docs/site-structure.md):* two sides instead. A local **admin** (`npm run admin`) edits simulators, tags and courses, previews and publishes. The published **site** stays plain and read-only: a home page with course links and one search box, one standalone page per course (optional short address such as `materijali.online/linux`, one nginx rule per course), and each simulator as one self-contained file. Being all in the repo, a published folder works offline from a USB stick.

## Open, not decided

- ~~Repo layout, build tool~~ *decided:* `sims/<id>/` per simulator; a plain Node build with no dependencies (docs/site-structure.md §1, §5). Language of the UI (Croatian with English terms, as in ossimulator?): the frame uses Croatian for now.
- Deploy location (`materijali.online/simdeck`?) and which auth realm course pages use.
- GPL version (GPL-3.0-or-later assumed) and the asset audit before the first public release.
