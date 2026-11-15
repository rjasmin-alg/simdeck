<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-loopback: notes

Thread t-0458, 2026-11-15. Task `docs/tasks/w3/win-gpo-loopback.md`.

## Decisions

- **Model reuse.** `models/` has no GPO model yet, so `processingList` is copied unchanged from
  `sims/win-gpo-precedence/sim.js @ 8f95399` (COMMON.md §6) and used once per list: the user's path and the
  computer's path, each seen through its user half (`halfOf`). The loopback mode itself is read from the computer
  path's computer half with the same function (rule 2). What this sim adds, `loopbackMode`, `entriesOf`, `rowsOf`,
  `resultOf`, is pure and promotable with it.
- **Kit view K4** (`kit/ruletable.js`) draws the user-settings list: one row per user setting per GPO, in processing
  order (user list first, then the computer list). There are several settings, each with its own winner, which none
  of K4's three modes models, so the page sets every row's `mark` itself (the "rule of the page's own" path in
  `docs/sim-ui.md` §12): `hit` "stands", `beaten` "overwritten", `skip` "dropped" with the reason as a note, and at
  the last step `win` on every value still standing. The implicit row is "a setting no GPO sets: the default"; it wins
  (with the list of defaulted settings) when some setting is left at its default, and is skipped otherwise. No shared
  request: K4 had everything.
- **The scene** on the left is the page's own drawing: the domain with `OU=Staff` (user `ana`, person icon, GPO Staff
  User) and `OU=Kiosks` (computer `KIOSK1`, monitor icon, GPO Kiosk Lockdown with both halves: the user settings and,
  in the computer half, the loopback mode and whether users have Read and Apply). A dropped GPO is hatched, dashed and
  struck through with the reason; the GPO of this step has the kit's changed outline.
- **Changed highlight**: the value cells added in this step and the value they overwrote are highlighted, as are the
  result lines they changed; the mark cell at the pointer has the kit's own changed mark.
- **Icons** (person, monitor) are CSS shapes, so the user/computer path is told by shape, not colour; the legend uses
  the same shapes. Grayscale screenshot checked.
- **Drive P:** is a Group Policy preference (drive map) in practice; the sim treats it like the other user settings,
  which is how loopback treats it too. Preference targeting is out of scope.
- **`computersCanRead`** (Kiosk Lockdown applies to the computer) is a model parameter only, default on, tested for
  rule 2; the page has the task's two params. The explanation states rule 2 in words.

## Deviations from the task

1. **`replace` has 3 steps, not 2.** The task defines a step as "add one GPO's user settings to the list (or drop it
   with the reason)" and gives `filtered` (replace without Read) 3 steps, which only works if Staff User's drop under
   replace is a step. Applied to `replace` the same rule gives 3 (Staff User dropped: replace; Kiosk Lockdown added;
   the result). Every preset and every param combination has 3 steps; `sim.json` `steps` is 3. The alternative (the
   user list shown dropped from step 0 in replace) would make `filtered` 2 steps instead.
2. **Domain `quillmoor.example`** above the two OUs, as in `win-gpo-precedence`; the task names only the two OUs. No
   GPO is linked at the domain.
3. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; the owner
   question (deviation 1) is here and in the report.

## Sources

- Microsoft Learn, "Loopback processing of Group Policy" *(check title)*: merge vs replace; in merge the computer's
  GPO list is appended to the user's and wins conflicts; users need Read and Apply on the computer-path GPOs.
- Administrative Templates policy reference, "Configure user Group Policy loopback processing mode", Computer
  Configuration › Administrative Templates › System › Group Policy *(check path)*.
- [MS-GPOL] Group Policy: Core Protocol §3.2.5.1 *(check section)*: GPO list order (via `win-gpo-precedence`).
- Names: `quillmoor.example` from `~/projects/dr-lecture-estate/student/` (as in `win-gpo-precedence`); OUs, users,
  GPOs and values from the task.

## Unchecked *(check)*

- The documentation titles and the policy path above (no network in this thread).
- Rule 2 detail: the loopback mode follows the normal precedence when several computer-path GPOs set it (tested on a
  model scene; standard Administrative Templates behaviour, not checked against a source).
- Tie-break: a GPO linked to both the user's and the computer's OU is listed in both lists and, in merge, processed
  twice (model scene only).
- Croatian terms (below).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

`kit/glossary.js` has `loopback` → `povratna petlja` (from uvod-u-linux, the network interface); the Group Policy
term is a different one, so the sim does not use `[[loopback]]`.

| en | hr |
|---|---|
| loopback processing | obrada povratne petlje *(check)* |
| merge (mode) | spajanje *(check)* |
| replace (mode) | zamjena *(check)* |
| User Configuration | korisnička konfiguracija |
| Computer Configuration | konfiguracija računala |
| kiosk | kiosk |
| security filtering | sigurnosno filtriranje (as in `win-gpo-security-filtering`) |
| Read, Apply Group Policy | čitanje, primjena (as in `win-gpo-security-filtering`) |

## Shared requests

- **Promote the GPO processing list to `models/`** (`processingList` from `win-gpo-precedence`, copied here
  unchanged). Then this sim requires it from there and drops its copy.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`.

## Time

Start 13:22, done 13:37 (about 15 min wall clock, one session, including a fresh-review round).

## Review

A fresh reviewer read the diff against SPEC.md, checked the copied `processingList` byte for byte against
`win-gpo-precedence @ 8f95399`, and ran 45 mutations of the model: 33 caught at first. Added since: tests on the
`seen` marks of presets with drops, the state's effective mode under rule 2, `resultOf` after each step, a computer
list with two enforced links at different depths and Block Inheritance, a GPO with both halves off, and a GPO without
user settings. Now 5 survive, all harmless on this scene: the null-setting row's mark (no such GPO here), `cursor` on
the result step (the page does not read it), `canRead` defaulting to deny (every GPO here states its readers), a
loopback value written for "off", and `entriesOf` ignoring its `mode` argument (always called with the same mode).
Wording fixed from the review: "loopback or not" (filtering is reached only with loopback), Read **and Apply**
wherever the toggle, note and captions said "read", the Croatian term rule for *loopback*, gender agreement
(*računalo … primijenilo*, *prepisana / odbačena* for a setting), replace "typical for kiosks and classrooms" with
RDS hosts moved to merge, and the test header's run command.

Not on the page, for the owner: since the June 2016 security update (MS16-072) the **computer** account also needs Read
on a GPO with user settings. The scene gives computers Read on both GPOs, so nothing shown is wrong; a preset for it
would be a second concept (security filtering), so it is left to `win-gpo-security-filtering` *(check)*.
