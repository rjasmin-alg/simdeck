# kit-follow-ups: the kit changes the frame left open, and the placeholder sims

| | |
|---|---|
| Task | `kit-follow-ups` (wave 0) |
| Owner | coordinator (kit owner) |
| Size | S |
| Depends on | main at 85b4a66 (frame and kit merged) |
| Licence | AGPL-3.0-or-later |

## Goal

The frame and the kit are merged and reconciled on `main` (`docs/site-structure.md` §7). §7 ends with a list
of changes only the kit can make; make them, so that every task starts from a template that passes
`npm run check` as soon as it is copied.

## Do

1. **Template `#simdeck-meta` placeholder:** keep only `id`, `class` and `steps` (the build generates the rest
   from `sim.json`); drop `courses`, `kind`, `path`, `tags`, and the matching rewrites in `kit/new-sim.sh`.
2. **`kit/new-sim.sh` writes a `sim.json` stub** with every required field (`docs/site-structure.md` §2.1),
   `status: "wip"`, so a sim made with it passes `npm run check` (the admin's + Novi simulator already does).
3. **Back link from a course page:** go back in history also when the referrer is a simdeck course page
   (`…/courses/<id>/`).
4. **`docs/sim-ui.md` §7–§8:** record the resolutions (meta generated from `sim.json`, exceptions stay in the
   page, index at the site root, the single-file build exists).
5. **Placeholder sims.** `sims/dhcp-dora`, `dns-resolution`, `disk-partitioning` and `lvm-topology` are the
   frame's placeholders, and each id is now a real task (`docs/tasks/`). Set them to `status: "wip"` (or remove
   them) so the tasks start from the template; keep `courses/linux-essentials.json` working (unfinished sims
   only warn).
6. Update `docs/tasks/COMMON.md` §2, §5 and §7 if any command or path changed.

## Done when

`kit/new-sim.sh x /tmp/x` gives a folder that passes `npm run check` and `npm run check:page`; `npm test` passes.
