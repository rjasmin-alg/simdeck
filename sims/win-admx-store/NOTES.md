<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-admx-store: notes

New explorer (task `docs/tasks/w3/win-admx-store.md`, catalogue `win-admx-store`, §4.5.2, wave 3). Rules and expected
views: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (three columns of boxes and a card).

## Decisions

- **Class: explorer**, steps 0. The task offers "reference with toggles" or explorer; a reference page has no params,
  and this one needs three.
- **Three values from three ADMX files.** `DisableCMD` (`System.admx`), `NoDriveTypeAutoRun` (`AutoPlay.admx`) and
  `BackupDirectory` (`LAPS.admx`, newer set only). They give the task's "ADM-B sees two and an Extra Registry
  Settings entry" and, through the revised `System.admx`, the language error. Revisions are illustrative: the newer
  `System.admx` is revision 2 (it adds policies), `AutoPlay.admx` is unchanged.
- **No file counts.** The task's "412 files (derived)" is not shown: the number is unchecked and the concept does not
  need it. Each folder shows the three ADMX that matter and its language folders.
- **No OS versions named.** "Newer templates" and "older templates"; the concept does not depend on which release.
- **`hrAdml` is a three-way choice** (none / matching / older copy) instead of the task's toggle. The older copy is
  the only way to reach the "resource … could not be found" error with these params (SPEC rule 5b; the Microsoft
  article's known issue is exactly an ADML that does not match its ADMX). It describes the **store's** `hr-HR`
  folder only and is disabled, with its reason, while there is no store: each local folder holds the ADML of its own
  system.
- **Fallback to en-US** when the editor's language has no ADML for a file (rule 5c, *check*). An ADML of the wrong
  revision in the editor's language is an error, not a fallback (tie-break, rule 5b).
- **Fifth preset `stale-lang`** beyond the task's four: it shows the error (✕), a Croatian name and an en-US fallback
  side by side. `store-old` selects value 3 on ADM-A, so the card says at once that `LAPS.admx` is in ADM-A's local
  folder but not read; `stale-lang` selects value 1 on ADM-A (the stale `hr-HR\System.adml`).
- **Selection** is a hidden `select` param (`sel`, kept in the URL), as in `win-ad-structure`. Clicking a row selects
  it; clicking it again clears it. "Changed" ignores selection changes.
- **"Changed"** marks the editor rows whose kind, language or fallback differs from the view before the last
  param change (as `poe-budget` tracks it in the page).
- **Client.** A client box under the GPO applies 3 of 3 values in every state (rule 1, and the misconceptions "clients
  need the ADMX" and "a missing template removes the setting").
- **Rule 7 (.adm in GPOs) and "files renamed or removed between versions"** are in the explanation only, not modelled.
- **Setting names** come from the ADML: the editor's language, not the page's. They are data (`translate="no"`), in
  `strings.js` under `name_<value>_en` / `name_<value>_hr`, identical in both tables.
- **Captions** in both languages from the start; the task's two captions are used (caption 2 generalised to which
  editor and which value). Order: error, editors disagree, older store, fallback, store same, no store same.
- **Stage fit.** With a selection, the card under the columns needs about 150 px. To fit every combination at
  1920 × 1080, the "reads the Central Store" arrow sits in the editor's head, the error is the ✕ row (no separate
  banner; the card and caption quote the message), the store's `hr-HR` state is written inside its chip ("none",
  "from the older set"), the client is a line inside the GPO box, and the middle column is 1.2 × the side ones.
  Tightest combination: 7 px clear.
- **Panel fit.** The hidden `sel` control showed because `kit.css` gives `.sd-ctl` `display: flex`, which beats
  `[hidden]`; the page adds `.sd-ctl[hidden] { display: none }` as `win-ad-structure` does (see Shared requests).

## Deviations from the task

- `hrAdml` toggle → three-way choice (above).
- Five presets instead of four (`stale-lang` added).
- No "412 files" figure.

## Numbers checked

An independent Python script (its own resolution loop, not the JS model) computed every preset's two editor views:

```
no-store    A ['oken', 'oken', 'oken'] B ['oken', 'oken', '?']
store-new   A ['oken', 'oken', 'oken'] B ['oken', 'oken', 'oken']
store-old   A ['oken', 'oken', '?']    B ['oken', 'oken', '?']
language    A ['okfb', 'okfb', 'okfb'] B ['okfb', 'okfb', 'okfb']
stale-lang  A ['X', 'okhr', 'okfb']    B ['X', 'okhr', 'okfb']
```

All match SPEC.md and the tests. 18 mutations of `sim.js` (store wins, local set, needs revision, missing ADMX first,
wrong revision → fallback, no fallback, fallback must match, hr folder match / old, LAPS in the older set, System
revision, client, changed with fallback, caption order, local ignored, error dedupe, selection check): 17 fail a test;
the 18th (taking the fallback branch for an en-US editor) is equivalent, since the fallback folder is the same one.

A browser script loaded all 216 combinations (2 page languages × 3 stores × 2 editor languages × 3 hr ADML × 6
selections) at 1920 × 1080: no console errors, the columns never reach the card (at least 7 px clear), the card stays
inside the stage.

## Sources

- Microsoft Learn, "How to create and manage the Central Store for Group Policy Administrative Templates in Windows"
  (read 2026-11-15): the store path `\\contoso.com\SYSVOL\contoso.com\policies\PolicyDefinitions` with language
  folders under it; "the sysvol folder isn't automatically updated"; the store is "checked by the Group Policy tools by
  default"; "The ADM folder is no longer created in a GPO … domain controllers don't store or replicate redundant
  copies of .adm files"; a known issue where an incompatible ADML gives "Resource '$(string ID=…)' referenced in
  attribute displayName could not be found".
- "Managing Group Policy ADMX files step-by-step guide": not opened.

## Unchecked *(check)*

- Exclusive use of the store (the local folder ignored, even when newer): the article says only "checked by default".
- Fallback to `en-US` ADML when the editor's language has none (and from which editor version on).
- "Extra Registry Settings" is how the settings report shows a value without its ADMX, and the editor can't edit it.
- Clients need no ADMX to apply Administrative Templates settings (standard, not in the article).
- Registry paths and value names: `HKCU\Software\Policies\Microsoft\Windows\System\DisableCMD`,
  `HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\NoDriveTypeAutoRun` (255),
  `HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\LAPS\BackupDirectory` (2 = Active Directory).
- That `LAPS.admx` is absent from the older set (it came with a later template release).
- Croatian setting names (`Spriječi pristup naredbenom retku`, `Isključi automatsku reprodukciju`, `Konfiguriraj
  direktorij za sigurnosnu kopiju lozinke`): written for the sim, not taken from a hr-HR ADML.
- Files renamed or removed between template versions (explanation only).

## Term pairs

Not in `kit/glossary.js`; written out by hand (explanation) and as `{cs}` / `{ers}` in captions:

- administrative template: administrativni predložak
- central store: središnje spremište
- policy definition: definicija pravila
- language file: jezična datoteka
- editor: uređivač
- registry: registar

## Shared requests

- **kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css`, so a param with `visible: () => false` hides without page
  CSS (this page and `win-ad-structure` both work around it).

## Model reuse

`win-gpo-precedence` was the soft dependency; nothing from its model is needed (the task's note says so too). This
model is not promotable as is and no later task names it.

## Review

A fresh reviewer read the diff against SPEC.md and broke rules on purpose (30 mutations, 26 caught). Fixed from it:
the one real gap (an ADMX too old for the value must be decided before a failing ADML: new assertion in the rule 4
tie-break test); the Croatian explanation put the stale ADML in `en-US` (now "in the editor's language folder");
"no hr-HR" and "hr-HR from the older set" in the store differed only by colour (now also written next to the chips);
`DisableCMD` is a user value, so the GPO box says `Registry.pol (Machine, User)` and the card names
`User\Registry.pol` or `Machine\Registry.pol`; "every editor" narrowed to "every editor of a domain GPO";
`adml()` returns early for a file the set lacks; the term constants and the ADMX/ADML labels moved to `strings.js`.
Equivalent survivors with the fixed sets: `situation.both` forced true, `storeOld` without the store check, and the
error marker in `changedRows`. `cap_error` (one editor failing) is unreachable with these params, since both editors
read the same store; kept so the caption logic does not assume it.

## Time

Start 12:53, done 13:40 (about 47 minutes, including the review).
