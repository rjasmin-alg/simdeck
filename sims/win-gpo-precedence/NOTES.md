<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-precedence: notes

Thread t-0112, 2026-10-04. Task `docs/tasks/w2/win-gpo-precedence.md`.

## Decisions

- **Kit view K4** (`kit/ruletable.js`) draws the processing table in `specific` mode with `rank` = processing
  position, so at the last step the view itself picks the last GPO that applied a value (rule 2) and marks the other
  applied rows beaten. Before the last step the page sets each row's `mark`: the value standing now is `hit`
  ("stands"), earlier values `beaten` ("overwritten"), skipped rows `skip` with the reason as a note. A row that does
  not configure the setting is `hit: false` ("–", "not configured"). The implicit row is "not configured: the system
  default applies"; it wins when no GPO sets the value. No shared request: K4 had everything.
- **The path** on the left is the page's own drawing (HTML boxes indented by depth, container letter L/S/D/OU, GPO
  links as pills with a link-order chip, a CSS padlock for Enforced, a thick left wall and a CSS brick icon for Block
  Inheritance). Kit view K2 (topology) does not fit a container hierarchy.
- **Blocked GPOs share one step** (at the place of the first), because the block drops them together; this is what
  makes the task's step counts work (`block` 5, `enforced-vs-block` 6). Each blocked GPO keeps its own row.
- **Rows** are the final processing order, all visible from step 0 with pending marks; the pointer (the computer's
  chip) moves down. Enforced rows are at the end, blocked rows at their LSDOU place.
- **Model is promotable** (`processingList(scene, setting)`, `eventsOf`, `winnerOf` take any scene; no strings), for
  `win-gpo-loopback`, which the catalogue says extends this sim.

## Deviations from the task

1. **Setting.** The task's default setting "Screen saver timeout" is a *user* setting (User Configuration), so for
   computer `PC07` it would not come from `OU=Workstations` at all without loopback (out of scope). The sim uses the
   computer setting with the same meaning, "Interactive logon: Machine inactivity limit", labelled "Lock after
   inactivity" / "Zaključavanje nakon neaktivnosti", with the task's numbers (20 / 15 / 10 / 5 min; the policy stores
   seconds). The explanation says why. **Owner may prefer** a user `ana` in a users OU with the screen saver setting
   instead.
2. **A second setting**, "Removable storage: deny access" (set only in Domain Lockdown), as a `setting` select: the
   task's `block` preset says "for a setting only in Domain Lockdown, it's gone", which needs a second setting.
3. **`target` is a toggle `cn`** ("PC19 in CN=Computers"), not a two-way choice: with six presets and five params the
   panel did not fit 1920×1080 with a select. Same meaning, default off (PC07).
4. **Rule 5 (disabled link, half disabled) and rule 8 (one GPO linked twice)** are in the model and tested on model
   scenes, but have no control on the page: a "disable the WS Standard link" toggle was built and dropped because
   the panel did not fit (one-screen check). The page still draws the "link disabled" skip if the model produces it.
5. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; the owner
   questions are here and in the report.

## Sources

- Microsoft Learn, "Group Policy processing and precedence" *(check title)*: LSDOU, link order, last applied wins.
- GPMC help, "Block inheritance" and "Enforce a GPO link" *(check titles)*: block drops above, enforced passes and wins.
- [MS-GPOL] Group Policy: Core Protocol §3.2.5.1 *(check section)*: GPO list order, enforced GPOs last.
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/gpos.txt`: domain-root GPOs incl. one Enforced,
  OU-linked GPOs under `OU=Workstations,OU=Quillmoor` (names in the sim are new; values invented).

## Unchecked *(check)*

- The documentation titles and the [MS-GPOL] section number above (no network in this thread).
- Rule 4 detail: an enforced **site** link comes after an enforced domain link (site above domain). Not on the scene.
- Two enforced links in **one container** keep link order (link 1 last). Not on the scene.
- Rule 8: a GPO linked at two levels is processed at each link, the later counts. Not on the scene.
- Croatian terms (below), especially *site* = lokacija.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| Group Policy object (GPO) | objekt pravila grupe (GPO) |
| precedence | prednost |
| link order | redoslijed povezivanja |
| Enforced | prisilno |
| Block Inheritance | blokiranje nasljeđivanja |
| inheritance | nasljeđivanje (UL ch07) |
| organizational unit | organizacijska jedinica |
| site (AD) | lokacija *(check)* |
| container (CN=…) | spremnik |

## Shared requests

None.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `intro`.

## Time

Start 13:08, done 13:25 (about 20 min wall clock, one session).

## Review

A fresh reviewer read the diff against SPEC.md and broke the model 27 ways: 24 caught at once; the two real gaps (blocks on both a parent and a child OU, a GPO with both halves off) now have tests; the third (two links with the same order number) cannot happen in AD. Its caption fixes are in (link order 1 with an enforced sibling, the shared blocked step, CN=Computers wording, two Croatian phrasings, Enforced in CN=Computers).
