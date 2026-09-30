# simdeck: design notes

Decisions and working assumptions from the proposal review (2026-09-30). These are not part of the proposal's argument; they are a head start for building it. Anything here can change without changing the proposal.

## Framework vs individual pages

- **Framework at build time, standalone at run time.** One shared kit (colour tokens / projector-safe palette, header + legend component, step/reset keyboard controller) lives in the source. The build inlines it into every native simulator, so each output is one self-contained HTML file that runs from `file://`.
- Precedent: `ossimulator` already builds a static multi-page site *and* one self-contained HTML per page for Moodle.
- A check script refuses pages that break the contract, like `single-page-labs/deploy.sh` refusing undefined CSS variables.

## Simulator contract (draft numbers, to be tuned)

- One concept per simulator; fits one screen at 1920×1080 with no scrolling.
- Readable from the back of the room: body text ≥ ~20 px; contrast checked against a washed-out projector palette.
- Driven from the lectern: step forward/back on ←/→ and PgUp/PgDn (what presentation clickers send), reset on one key.
- A demo runs in under 3–5 minutes.
- Works offline as a single file.
- Exceptions are allowed but must be declared per page and are counted.

## Entries

- **Native:** single-file, in the repo, must pass the contract. The `single-page-labs` pages are copied in and adapted; all new simulators are native.
- **Linked:** stay in their own projects, appear through a manifest entry only, exempt from the contract: ossimulator's subsimulators (one entry per subsimulator, not the whole app), `cephsim`, `faultline`, `topologydrafter`.
- **Copies are canonical.** Once a page is imported, the simdeck copy is the one that gets fixed; the original collection is frozen with a note pointing here.

## Manifest (sketch)

One entry per simulator: `id`, `title`, `summary`, `tags`, `courses`, `kind` (native | linked), `url` (for linked) or `path` (for native), `lang`.

## Two modes, one manifest

- **Lecturer mode:** the index, with search and tag filters, opening whatever is needed on the fly (online).
- **Course list:** a small per-course file (course name + ordered list of simulator ids) generates one page to hand to students. It links into the same deployed system; offline bundling is a later version.

## Open, not decided

- Repo layout, build tool (plain script vs Vite as in ossimulator), language of the UI (Croatian with English terms, as in ossimulator?).
- Deploy location (`materijali.online/simdeck`?) and which auth realm course pages use.
- GPL version (GPL-3.0-or-later assumed) and the asset audit before the first public release.
