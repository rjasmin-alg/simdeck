<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-admx-store: spec

One concept: **where the editor's templates come from, and why two editors show the same GPO differently.**
Task: `docs/tasks/w3/win-admx-store.md`; catalogue `win-admx-store` (§4.5.2). Class: explorer (no steps).

## Scene

- Two admin machines. `ADM-A` has the **newer** template set in its local `%SystemRoot%\PolicyDefinitions`;
  `ADM-B` has the **older** set. Each local folder has `en-US` and `hr-HR` ADML for its own set (each machine's
  language files come with its own system; see rule 5).
- SYSVOL on `quillmoor.example` with an optional **Central Store**
  `\\quillmoor.example\SYSVOL\quillmoor.example\Policies\PolicyDefinitions` (none, the older set or the newer set),
  with an `en-US` folder of the same set and an `hr-HR` folder that is absent, matching, or an older copy.
- One GPO (`Workstations`); its `Registry.pol` files (`Machine\` for HKLM, `User\` for HKCU) hold three configured values (the numbers 1–3 are used everywhere):

| # | id | Registry value (data) | Defined in | In the older set | In the newer set |
|---|---|---|---|---|---|
| 1 | `cmd` | `HKCU\Software\Policies\Microsoft\Windows\System` `DisableCMD` = 1 | `System.admx` | revision 1 | revision 2 (more policies) |
| 2 | `autoplay` | `HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer` `NoDriveTypeAutoRun` = 255 | `AutoPlay.admx` | revision 1 | revision 1 (unchanged) |
| 3 | `laps` | `HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\LAPS` `BackupDirectory` = 2 | `LAPS.admx` | absent | revision 1 |

A template **set** is `{ System, AutoPlay[, LAPS] }` with a revision per file; an ADML folder of a set holds one ADML
per ADMX of that set, at the same revision. Revisions are illustrative (derived): the newer `System.admx` adds
policies, so its strings are not all in the older `System.adml`. Registry paths and value names *(check)*.

## Params

| key | values | default | note |
|---|---|---|---|
| `store` | `none`, `old`, `new` | `none` | the Central Store's template set |
| `uiLang` | `en-US`, `hr-HR` | `en-US` | the editors' display language (both machines) |
| `hrAdml` | `none`, `match`, `old` | `none` | the Central Store's `hr-HR` folder: absent, the store's own set, or left over from the older set. Disabled (with its reason) while there is no store |
| `sel` | `''` or `<A|B>:<value id>` | `''` | hidden: the setting clicked in an editor (the card shows where its definition came from) |

Deviation: the task's `hrAdml` is a toggle (present / absent); here it has a third value, the older copy, which is
how the "resource … could not be found" error arises (rule 5b).

## Rules

1. **Settings live in the GPO** (`Registry.pol` in SYSVOL); ADMX/ADML only describe them to the editor. The client
   applies all three values whatever templates exist anywhere. *(Microsoft Learn, central store article: the
   templates are for the Group Policy tools; that clients do not read ADMX is standard textbook knowledge, check.)*
2. **No Central Store:** each editor reads its own local `PolicyDefinitions` (ADMX and ADML).
3. **Central Store present:** every editor of a domain GPO reads it **only** (the local-policy editor never uses it); its local folder is ignored, even when the local files
   are newer *(check: the article says the store is "checked by the Group Policy tools by default"; the
   exclusive use is the commonly documented behaviour since the Vista/Server 2008 tools)*. **Tie-break:** the store
   wins over a newer local folder.
4. **A value whose ADMX the source lacks** (file absent, or a revision older than the value needs) still applies on
   clients; the editor shows it only as **"Extra Registry Settings"** (in the settings report), with its key, and can't
   edit it by name *(check)*. **Tie-break:** a missing ADMX is decided first; ADML problems only matter for ADMX that
   are there.
5. **Language files.** For each ADMX the editor needs the ADML of the same revision:
   - a. in the editor's language folder → names in that language;
   - b. that folder has the ADML but of another revision → the ADMX **fails to load**: "Resource '$(string.…)'
     referenced in attribute displayName could not be found" (the article's known issue about an incompatible ADML);
     its values are not shown by name. **Tie-break:** a wrong-revision ADML is an error, not a reason to fall back;
   - c. no ADML for that file in the editor's language → **fall back to `en-US`** if it has the matching ADML (names
     in English) *(check: fallback of current editors)*; else the ADMX fails to load as in b;
   - d. `en-US` itself never falls back (it is the fallback).
   Local folders hold `en-US` and `hr-HR` of their own set, so without a store rule 5 never fires; the `hrAdml`
   param describes the store's folder only (once there is a store, its language folders are the admin's job).
6. **The store is a copy.** It is not created or updated automatically: an admin copies a template set into it
   (Microsoft Learn: "the sysvol folder isn't automatically updated"). The model has no "update": `ADM-A`'s newer
   local set never reaches the store. Files renamed or removed between versions *(check)*: explanation only.
7. **Old `.adm` templates** were copied into every GPO in SYSVOL; ADMX are not (Microsoft Learn: "The ADM folder is
   no longer created in a GPO … domain controllers don't store or replicate redundant copies of .adm files").
   Explanation only, not modelled.

Each editor row shows one of: **named** (✓, in the editor's language, or in English with an `en-US` tag when it fell
back), **extra** (?, "Extra Registry Settings" and the key), **error** (✕, the ADMX failed to load).

"Changed": the rows whose view (kind or language) differs from the view before the last param change (`sel` excluded).

## Presets and expected views

Checked by an independent script (`NOTES.md`, "Numbers checked"), not the JS model.

| # | preset | params | ADM-A (1, 2, 3) | ADM-B (1, 2, 3) |
|---|---|---|---|---|
| 1 | `no-store` | store none, en-US | ✓ ✓ ✓ (local, newer) | ✓ ✓ ? (local, older) |
| 2 | `store-new` | store new | ✓ ✓ ✓ (store) | ✓ ✓ ✓ (store) |
| 3 | `store-old` | store old, value 3 on ADM-A selected | ✓ ✓ ? (store; local newer ignored) | ✓ ✓ ? (store) |
| 4 | `language` | store new, hr-HR, hr ADML none | ✓en ✓en ✓en | ✓en ✓en ✓en |
| 5 | `stale-lang` | store new, hr-HR, hr ADML older copy, value 1 on ADM-A selected | ✕ ✓hr ✓en | ✕ ✓hr ✓en |

In every preset and every param combination the client applies 3 of 3 values (rule 1).
Preset 5 is a fifth preset beyond the task's four: the only way to show the error (rule 5b) without an extra param.

Captions (both languages; the first that applies):
1. an error row: "ADM-x can't load System.admx: …"
2. the editors disagree, one sees an extra registry setting (task's caption 2, generalised to which editor and which value);
3. a store with the older set and `ADM-A` too sees an extra setting: the store wins over its newer local files;
4. a fallback row: names in English because the store has no `hr-HR` ADML;
5. a store, both see all three by name (task's caption 1);
6. no store, both see the same (not reachable with the fixed sets; kept for completeness).
