<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-targeting: notes

New stepper (task `docs/tasks/w3/win-gpo-targeting.md`, catalogue `win-gpo-targeting`, §4.5.2, wave 3). The GPO's
four drive-map items are drawn with kit view **K4, rule table** (`kit/ruletable.js`), with the marks set by the page:
every item is evaluated (there is no first match), a match is drawn as a deciding row with its outcome, a no-match
as "–" with the failing targeting terms struck and its outcome under the mark (skipped, stays: a tattoo, removed).
The GPO card, the event strip, the client card and the Explorer-like drive column are the page's own. Rules,
tie-break and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Top: the GPO card `Drive Maps` (linked at the domain root, Authenticated Users: applies to the user,
  Drive Maps, the action Update or Replace) and the event strip (done solid, now highlighted, next dashed; the logon
  walk is one box that says "item 2 of 4"). Middle, full width: the item table. Rows are the items (pencil and
  letter); the match columns are the three targeting terms (group, IP range, OS, each with a funnel); K4's action
  column is the share the item maps ("→ maps"), so each row reads "if these terms hold → map this share"; the mark
  column is the user and the event. Bottom: the client (groups in the directory, groups in the token, IP and site,
  OS) and "This PC: network drives" (letter tiles; new ones highlighted with "+ new", stale ones with an ink drop,
  removed ones dashed and struck for the step they go).
- **Stepping (hybrid, the task's own numbers).** With targeting on, the logon is walked one item per step (the
  task's "one step: evaluate one item's targeting expression"; the K4 pointer chip is the user); without targeting
  the logon is one step (nothing to evaluate). Every later event is one whole pass: "laptop to the other site +
  refresh", "user to the other group + refresh", "log off and on". This gives exactly the task's step counts: 1, 4,
  5, 6, 6.
- **One user at a time** (the task's `user` param): the stage shows the chosen user on their laptop; the
  `targeted` preset is ana (P:, H:), and its hint says eyardley gets K:, H: (switch the user).
- **Added params** `script` (nothing · laptop to the other site · user to the other group) and `targeting` (off = the
  estate's GPO as it is): the five presets need different event lists and the `quillmoor-as-is` preset needs no
  targeting. The moves go "to the other one", so `location: branch` + `script: move` shows X: going stale (or
  removed) when the laptop comes back to HQ, and eyardley moves from Cinematics to Projects.
- **Paths from the estate.** `gpos.txt` has `H: \\weft\home$\%USERNAME%` and `X: \\LOOM\builds`; the task's scene
  said "home" and `\\nas01\builds`. The estate's real paths are used (the task says "the estate's real one"). The
  drive column shows H: resolved (`\\weft\home$\ana`).
- **IP range as GPP writes it**: a start and end address, `10.20.0.0 – 10.20.255.255` (= the task's 10.20.0.0/16).
  HQ `10.10.20.57`, Branch `10.20.0.57`, the task's values.
- **Second laptop.** The task names two PCs; ana has `LT07`, eyardley `LT12` (invented, both workstations; the OS
  is shown as its computer role, not a Windows version, since only "not a server" matters). The
  location param moves whichever laptop is on stage.
- **OS term is shown, never false on the page.** Both laptops are workstations, so "AND is not a server" always holds;
  the server case is a model test (rule 2). Making it reachable needs a third machine (a server at Branch), which
  the task does not have; noted as an owner question.
- **Rule 1 (GPO must apply) and rule 6 (same letter, later item wins)** are model tests only: the scene's GPO always
  applies and its letters differ. Both are in the explanation.
- **Remove needs history** (from `win-gpo-tattooing`, KB 3060859): an item removes its drive only if this computer
  recorded it as applied; a non-matching item never touches a drive another item mapped.
- **Times**: logon `t = 0`, the admin's move at `t = 30`, the refresh at `t = 100` (90 min + an offset fixed at 10, as
  in `win-gpo-tattooing`), the new logon "next day".
- **Model is promotable**: `ipToNumber`, `termHolds`, `evalTarget`, `applyItem`, `pass` are pure and string-free.
  Nothing was copied from `win-gpo-tattooing` (its registry rule table does not fit drive maps; `models/` has no
  GPO model); the behaviour it established (Remove → Replace, removal needs history, tattoo) is reimplemented.

## Deviations from the task

1. **Params added**: `script`, `targeting` (see Decisions). `user` and `location` kept; `removeFlag` kept.
2. **`targeted` preset shows ana only** (4 steps); eyardley's K:, H: is the same preset with the user switched.
3. **Paths** `\\weft\home$\%USERNAME%` and `\\LOOM\builds` from the estate instead of "home" and `\\nas01\builds`.
4. **The move and the next refresh are one step** (`branch-laptop`, `group-change`), so the counts stay at the task's 5
   and 6; the caption says both.
5. **The share is in K4's action column** (no separate "action" column; Update/Replace is on the GPO card, since the
   Remove option sets it for all four items).
6. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses changes outside `sims/<id>/`; owner questions are
   in the report.

## Sources

- Microsoft Learn, "Group Policy preferences in Windows" (windows-server/identity/ad-ds/manage/group-policy/
  group-policy-preferences): preference items, the Common tab (item-level targeting is set there; "Remove this item
  when it is no longer applied" removes the item when out of scope and sets the action to Replace).
- Microsoft Learn (previous versions), "Preference Item-Level Targeting" (cc733022, title confirmed by the
  reviewer): AND/OR joins "each targeting item with the preceding one"; collections make parenthetical expressions.
  "IP Address Range targeting" (cc732310): the processing computer's address, bounds inclusive. "Operating System
  targeting" (cc753566): product, release, edition or computer role (Workstation, Member Server, Domain Controller),
  supports "is not".
- Microsoft Learn archive, AskDS, "Target Group Policy Preferences by Container, not by Group" (2011): GPP "determines
  group membership from the user's authentication token" (rule 3); computer group targeting queries a DC instead.
  AskDS, "Using Group Policy Preferences to Map Drives Based on Group Membership" (2009): Drive Maps use the drive
  letter to decide whether a drive exists; Update only modifies it.
- Rule 4, disputed: the ADMX "Configure Drive Maps preference extension policy processing" (its "Do not apply during
  periodic background processing" option implies background processing by default; `win-gpo-slow-link` uses it) vs
  Microsoft Learn archive, TechNet Wiki 12221 (Windows 7 era): Drive Maps "only during foreground processing, never
  during background processing". The model follows the policy text.
- `sims/win-gpo-tattooing` (SPEC.md, NOTES.md): tattooing, Remove → Replace, removal needs this computer's history
  (KB 3060859); `sims/win-access-token` (groups fixed in the token at logon); `sims/win-gpo-processing` (90 min
  refresh plus an offset).
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/gpos.txt` (GPO "Drive Maps", linked at the domain
  root: P:, K:, H:, X:) and `users.csv` (`eyardley`, OU=HQ).

## Unchecked *(check)*

- Evaluation order: left to right with no AND-before-OR precedence (the docs say "with the preceding one" and
  collections for grouping; no explicit precedence statement found).
- Drive maps are processed at a background refresh (rule 4's "X: at the next refresh"; also step 5 of
  `group-change`): Microsoft sources disagree, see Sources. Owner question.
- Two drive-map items for one letter: the later one wins (items are processed top to bottom, Learn 2025; with Update
  an existing mapping might not be changed, AskDS 2009).
- The Croatian wording of the GPP UI strings ("Ukloni kad se više ne primjenjuje", "Mapiranja pogona") and the terms
  below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| item-level targeting | ciljanje na razini stavke | task *(check)* |
| preference | preferenca | task *(check)*, as in `win-gpo-tattooing` |
| drive map | mapiranje pogona | task *(check)* |
| IP address range | raspon IP adresa | task (URM ch09) |
| security group | sigurnosna grupa | task *(check)* |
| targeting item | uvjet ciljanja | task *(check)* |
| tattooing | tetoviranje (zaostala postavka) | `win-gpo-tattooing` *(check)* |
| Replace (action) | zamijeni | `win-gpo-tattooing` *(check)* |

## Checks

- Numbers: an independent Python hand model of SPEC.md for all 48 combinations (user × location × script × targeting
  × Remove), 168 steps, before the page was written: per evaluated item the outcome code and the drives with their
  stale marks; the JS model agrees on every one.
- Mutations: 22 single mutations of `sim.js`, one or more per rule (tie-break: earlier keeps the letter, same/map
  code; GPO not applying; OR as AND; AND-before-OR precedence; "is not" ignored; empty target; IP bounds exclusive;
  directory groups instead of the token; relogon keeps the token; IP not updated; Remove without the flag, without
  history; stale not marked; a non-matching item touching another item's drive; stale not cleared on a re-match;
  Replace; token at the wrong walk step; OS inverted; group move a no-op; walk order): all killed (the stale re-match
  one only after a test was added).
- Browser sweep: 864 pages (48 param sets × every step × both languages, at 1920×1080 and 375×812) from `file://`:
  no page scroll at 1920×1080, nothing overflowing the stage, the K4 table never scrolls sideways at 1920×1080, the
  caption never clipped, no sideways scroll at 375×812, no `undefined`/`NaN`/`null`/`[object`/unfilled placeholder, no
  empty caption or double space, no console errors or warnings. Found and fixed on the way: the table beside the
  client column hid the OS and action columns (now full width); the stage overflowed with four drives (share in the
  action column, tighter tiles, shorter event words); the mark header showed `[object HTMLSpanElement]` (nested
  parts); "X::" and "u podružnica" in captions; the panel overflowed by 24 px in Croatian (the Remove hint dropped).

## Shared requests

- **Kit legend swatches** for a pencil, a funnel, a drive tile and a stale tile (`tg-pencil`, `tg-funnel`,
  `tg-tile`, `tg-stale`, drawn in the page CSS). The pencil and ink drop repeat `win-gpo-tattooing`'s `tt-pencil` and
  `tt-drop`: two GPO sims now draw them, a kit shape would serve both.
- **K4:** none needed. A note for the kit owner: a "no" row has no outcome slot (only "–"), so the outcome of a
  non-matching row goes in `note`; an `outcome` for "no" rows (or for every row in a page-marked table) would be the
  general form.
- **Glossary:** the term pairs above.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`.

## Fresh review

A separate agent read the task, SPEC.md, the model, tests, strings and page, re-implemented the model from SPEC.md
alone (48 combinations: codes, failed terms, drives with stale marks: 0 disagreements) and made 44 single mutations
of `sim.js`: 41 killed, 2 equivalent survivors, 1 real gap (the relogon time, now tested). It checked the *(check)*
facts against Microsoft documentation (results in Sources and Unchecked) and found rule 4 disputed. Fixed from it:
the Croatian summary said X: comes "odmah" (now "pri osvježavanju"); the token was drawn struck through in red when
the directory differs (now neutral, "valid until the next logon"); with Remove, the group-refresh caption now adds that
Replace maps the drives again (the table says so); the relogon time is in SPEC and a test; "Windows 11" dropped for the
computer role; stale layout comments; "prijenosnik" → "prijenosno računalo" throughout.

## Time

Start 2026-11-15 14:31 (reading); hand model, SPEC, model and tests by 14:40; page, gate passing and sweep by 14:52;
mutations 14:55; fresh review and its fixes, status ready by 14:58: about 27 min wall clock, one session.
