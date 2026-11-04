<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-tattooing: notes

New stepper (task `docs/tasks/w3/win-gpo-tattooing.md`, catalogue `win-gpo-tattooing`, §4.5.2, wave 3). What a
processing pass does with each item is drawn with kit view **K4, rule table** (`kit/ruletable.js`), first match, with
the marks set by the page (one deciding row per item); the GPO line, the event strip, the item cards, the registry
slots and the "what ana sees" boxes are the page's own. Rules, tie-break and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Top: the GPO card `Quillmoor Desktop` (solid while linked to `OU=Staff`, dashed once unlinked) and the
  event strip (done solid, now highlighted, next dashed). Left: two columns, the policy (padlock) and the preference
  (pencil): the GPO item (for the preference its action, Update or Replace, and the two Common-tab options as
  checkboxes), ↓, the registry key on PC07 with the value slot (empty and dashed when there is no value, an ink drop
  when the value is tattooed) and the outcome of the step, then what ana sees (Control Panel refused or opening; the
  proxy mode in the app, which the user can change). Right: the rule table "What a pass does with an item (first
  match)", seven rows; the mark column header names the pass (`t = 100 · refresh`) or says there is no pass.
- **K4 use.** The task said "uses K4 once it exists"; it exists. The two items are evaluated on disjoint rows (rows
  1–3 policy, 4–7 preference), so each item's first match is drawn as one `win` row with the outcome, the rows of its
  kind above it as "–" and below it as "not read" (hatched). The kind is the padlock or pencil in the `#` column
  (a separate "Item" column made the table scroll sideways at 1920×1080). `words.win` is empty: ▶ and the legend
  ("deciding row") say it.
- **Timeline from `win-gpo-processing`.** Logon at t = 0 (the user part is processed), the action at t = 30, the
  background refresh at t = 100: 90 min plus an offset, fixed here at 10 rather than drawn from a seed (the offset is
  not this sim's concept). The processing model is not in `models/` and nothing of it is needed beyond these numbers;
  no code was copied.
- **Added param `script`** (after the logon: unlink then refresh · unlink at a refresh · user edits then refresh ·
  user tries both). The task's presets need different event lists and its two toggles cannot produce them. The
  option "unlink at a refresh" makes the tie-break (rule 6) visible on the page (2 steps); no preset uses it.
- **Registry at the start is empty** (no `ProxyMode`, no `NoControlPanel`), so "deleted" with the Remove option means
  "the app uses its default". The captions say it is deleted, not set back to an earlier value (the Group Policy
  blog: the original value is not retained).
- **Remove needs history.** The model removes a preference only if this computer recorded it as applied (KB 3060859:
  a local history per machine). Reached only in a model test; on the page every run applies the item at the logon.
- **Rule 5 (old ADM)** is row 3 of the table and a model test; no preset or param reaches it. It shows that the
  location of the value, not the word "policy", decides.
- **Policy attempt (`try`).** ana's attempt to open Control Panel is refused while `NoControlPanel = 1`; the model
  also refuses a user write under a Policies key (cc779058, Sources). Rejected actions are shown in the outcome line and the
  "what ana sees" box gets the changed mark.
- **Names**: `Quillmoor Desktop`, `OU=Staff`, `ana`, `PC07` as in the neighbouring GPO sims; the preference key
  `HKCU\Software\Quillmoor\ProxyMode` is the task's (an in-house app, no product named).
- **English UI labels.** The setting and option names are translated in `strings.js` (Croatian wording is simdeck's,
  *(check)* against a Croatian Windows); the actions `Update` / `Replace` and registry paths are data.
- **Model is promotable**: `isPolicyKey`, `ROWS`, `ruleFor`, `actionOf`, `pass`, `userChange` are pure and
  string-free, should `win-gpo-targeting` (which extends this sim in the catalogue) want them.

## Deviations from the task

1. **Added param `script`** and the non-preset option "unlink at a refresh" (see Decisions).
2. **`unlink` preset: the unlink is its own step** (t = 30, nothing changes on PC07), then the refresh (t = 100). The
   task's "unlink + refresh → …, 3 steps" is read as logon, unlink, refresh; the same-minute case is the extra script
   option.
3. **Tattoo caption split in two**: "GPO je odspojen:" / "The GPO is unlinked:" is its own string so that the
   same-minute case (whose caption already says the GPO is unlinked) does not say it twice; joined, the Croatian text
   is the task's caption word for word.
4. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; the owner
   questions are here and in the report.

## Sources

- Microsoft Learn, "Group Policy preferences in Windows" (windows-server/identity/ad-ds/manage/group-policy/
  group-policy-preferences, 2025-06; read in full in this session): preferences don't prevent users from changing
  settings, are refreshed each time Group Policy updates, a user's change persists only until the next refresh; the
  Common options table: "Remove this item when it is no longer applied … automatically sets the action to Replace …
  If the item is out of scope, its settings are deleted and not reapplied"; "Apply once and do not reapply".
- Microsoft Learn archive, Group Policy team blog, "GP Policy vs. Preference vs. GP preferences" (J. Herman,
  2008-03-04; read in full): policy settings do not tattoo (removed when the GPO goes out of scope), the UI is
  unavailable; GP preferences tattoo by default, are reapplied at every refresh, the original value is not retained.
- Microsoft Learn, "Remove this item if it is no longer applied option" (KB 3060859; read in full): a local
  database per computer (`…\Group Policy\History`).
- Microsoft Learn, Policy CSP – ADMX_ControlPanel (seen in search results): `NoControlPanel` under
  `Software\Microsoft\Windows\CurrentVersion\Policies\Explorer`, User Configuration › Administrative Templates ›
  Control Panel, "Prohibit access to Control Panel and PC settings".
- Microsoft Learn, previous versions, "Administrative templates overview for GPMC" (cc779058; found and read by the
  fresh reviewer): the Policies trees "are secure and cannot be modified by a non-administrator", are cleaned and the
  policies rewritten at processing; ADM settings outside them "are known as preferences" and persist (rules 4, 5).
- `sims/win-gpo-processing` (90 min refresh interval plus a random offset).

## Unchecked *(check)*

- The restriction message wording ("restrictions in effect on this computer") is paraphrased, not quoted.
- Croatian UI wording of the setting and the Common-tab options.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| policy (Group Policy setting) | pravilo | task *(check)*; the glossary has policy — politika (Linux sense) |
| preference | preferenca | task *(check)* |
| tattooing | tetoviranje (zaostala postavka) | task *(check)* |
| registry | registar | task |
| refresh | osvježavanje | task |
| apply once | primijeni jednom | task |
| Administrative Templates | administrativni predlošci | `win-gpo-processing` *(check)* |
| Replace (action) | zamijeni | simdeck *(check)* |

## Checks

- Numbers: an independent Python hand model of SPEC.md (rule table and the four scripts) for all 16 combinations
  (script × Remove × Apply once), 40 steps, before the page was written: per item the outcome code, the registry
  value and the deciding row; the JS model agrees on every one.
- Mutations: 15 single mutations of `sim.js`, one or more per rule (tie-break with and without the pass, policy
  delete, the Policies-key prefix, Remove without the flag, Replace, Remove without history, reapply, Apply once
  without history, user write under Policies, ADM row, unlink taking effect at once, rows 4/5 swapped, last match
  instead of first, the overwrite code): all killed.
- Browser sweep: 224 pages (16 param sets × every step × both languages, at 1920×1080 and 375×812) from `file://`:
  no page scroll at 1920×1080, nothing outside the stage, the rule table never scrolls sideways at 1920×1080, no
  sideways scroll at 375×812, no overflowing element, no `undefined`/`NaN`/`null`/unfilled placeholder, no empty
  caption or double space, no console errors or warnings. Found and fixed on the way: the table's "Item" column and
  long condition texts pushed the mark column out of view (now the icon in `#`, short conditions); the Policies key
  broke mid-word (now breaks only after a backslash); the event "unlink and refresh" widened the mark header.

## Shared requests

- **Kit legend swatches** for a padlock, a pencil and an ink drop (`tt-lock`, `tt-pencil`, `tt-drop`, drawn in the
  page CSS); a dashed empty slot (`tt-empty`).
- **K4:** none (page marks with `at: 'all'` did everything; a second `win` row gets its own outcome).
- **Glossary:** the term pairs above. Note the clash: the glossary's `policy — politika` is the Linux sense; Group
  Policy settings are "pravilo" here and in the task.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`.

## Fresh review

A separate agent read the task, SPEC.md, the model, the tests, the strings and the page, re-implemented the model from
SPEC.md alone (all 16 combinations, 40 steps: codes, values, deciding rows and the full `hits` vectors agree) and made
32 single mutations of `sim.js`: 18 killed. Of the 14 survivors, 9 are equivalent in every reachable state (rows 2/3
are complementary; the `none`/`open` branches and a no-op refused write are unreachable from the page; Apply once is
read only while the GPO applies) and the rest were gaps, now tested: a step without a pass must have no `hits` (the
page would draw it as a pass), the same-minute script's time, the long and lower-case hive names of `isPolicyKey`,
and `log`/`userEdits` (the unread `s.t` was removed). It found no factual errors and closed rules 4 and 5 with
cc779058. Fixed from it: captions take their time from the event, not a typed 0/30/100; the overwrite caption says
"this refresh" (it is shown at the refresh); the mark header uses "t = … min"; "applied" rather than "written" at the
logon; Croatian wording in `capRemoved` and the explanation (*Common* (zajedničko), "upravljaju pravila grupe",
"Odspajanje djeluje"); "The GPO is unlinked" no longer said twice in the same-minute case.

## Time

Start 2026-11-04 13:41 (reading); sources, hand model and SPEC, model and tests, page, gate passing and sweep by
13:55; fresh review and its fixes, status ready by 14:02: about 21 min wall clock, one session.
