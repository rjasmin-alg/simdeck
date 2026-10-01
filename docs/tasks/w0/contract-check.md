# contract-check: one command that checks a sim, and the per-task gate

| | |
|---|---|
| Task | `contract-check` (wave 0) |
| Owner | coordinator |
| Size | M |
| Depends on | `kit-follow-ups`; `bilingual` for the language rules |
| Licence | AGPL-3.0-or-later |

## Goal

Turn the contract (COMMON.md §3) into checks, so that "done" is mechanical (playbook §6: a rule without a check
is a recommendation). One command: `npm run gate -- <id>`.

## What the gate runs

1. `sim.json` validation (`lib/manifest.mjs`).
2. `node --test sims/<id>/sim.test.js`.
3. Build the sim alone into a temp folder; refuse network loads (the build does this).
4. Browser checks on the **built** file from `file://` with every request blocked (`kit/tools/check-page.mjs`
   is the seed): one screen at 1920×1080 in light and dark, body text ≥ 20 px and nothing under 16 px, no
   horizontal scroll at 375×812, clicker keys move the step counter (steppers), the controller's step count
   equals `sim.json` `steps`, reduced motion, no console errors, both languages (task `bilingual`).
5. Undefined CSS tokens in the page (the kit test already does this for the kit).
6. **Scope:** `git diff --name-only --no-renames main...HEAD` touches only `sims/<id>/` (or the host folder of
   a preset task), as ossimulator's `check:scope`.
7. Declared exceptions in `sim.json` waive the matching check and are counted; print the count per class.
8. Screenshots into `--shots <dir>`: 1920×1080 light, dark, grayscale; 375×812.

Every check gets a test that feeds it a bad sample and expects a failure (playbook §6: the gate must be
impossible to pass falsely). Ports and temp folders derive from the worktree path, so parallel gates don't
collide.

## Done when

`npm run gate -- <template id>` passes; each rule has a failing-sample test; COMMON.md §7 points to the gate.
