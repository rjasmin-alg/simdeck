# win-registry: The registry

| | |
|---|---|
| Task | `win-registry` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-registry` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-registry/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `windows-internals` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **hives, HKLM vs HKCU, where policy writes**.

The student: browse hives, apply a policy, find the key.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.

## Sources

- No Windows course book yet. Use Microsoft documentation (below); mark every rule and path you could not confirm with *(check)* and list it in `NOTES.md`.
- Microsoft documentation: *Structure of the Registry*, *Registry Hives*, *Predefined Keys* (HKLM, HKCU, HKEY_USERS, HKCR merged view), *Registry Value Types*; *Group Policy* registry-based policy / ADMX policy keys (the Policies branches and precedence).

## Model and presets

- **Scene:** a two-pane browser like a file tree: left, the root keys (HKLM, HKCU, and the note that HKCU is a view
  of the per-user hive, HKCR a merged view); right, the values in the selected key (name, type, data). A small
  "where it lives on disk" strip maps each root to its backing hive file. A policy panel applies one setting and
  the view highlights the key it wrote. Explorer (reference sim).
- **State:** `{ selected: path, tree: {…nested keys→{values:[{name,type,data}]}}, hives: [{root, file,
  scope:'machine'|'user'}], lastPolicy: {name, root, key, value} | null, effective: {setting, from} }`.
- **Params drive live:** selecting a key shows its values and its backing hive; applying a policy writes under the
  Policies branch and the view jumps to and highlights that key; switching the acting user changes which HKCU
  (per-user hive) is shown.
- **Rules:**
  1. The registry is a tree of keys and values; a value has a name, a type (REG_SZ, REG_DWORD, REG_BINARY, …) and
     data (Microsoft *Registry Hives*, *Structure of the Registry*).
  2. HKLM holds machine-wide settings; HKCU holds the current user's settings and is a link to that user's hive
     under HKEY_USERS; the same setting may exist in both, and the scope decides who it affects (Microsoft
     *Predefined keys*).
  3. Each root is backed by a hive file on disk (SYSTEM, SOFTWARE, SAM, SECURITY under the machine; NTUSER.DAT per
     user) (Microsoft *Registry Hives*) *(check exact file list)*.
  4. Group Policy writes to reserved Policies branches (…\Policies\…); a policy value there takes precedence over
     the matching non-policy value an application would otherwise read (Microsoft *Group Policy registry keys* /
     ADMX policy keys) *(check: which exact keys per setting)*.
  5. Tie-break for "what wins": a machine policy (HKLM Policies) overrides a user policy for the same setting where
     both exist *(check)*; absent policy, the application reads the plain key.
  6. HKCR is a merged view of HKLM\Software\Classes and HKCU\Software\Classes, user entries winning (Microsoft
     *Merged view of HKEY_CLASSES_ROOT*).
  Edge case: a REG_DWORD shown in both hex and decimal; the view labels which.
- **Params:** `user` choice Ana/Admin (Ana); `policyScope` choice none/user/machine (none); `setting` select of a
  few sample policies (e.g. "hide a Control Panel item", "screen-lock timeout"); `showDisk` toggle (on).
- **Presets:**
  - `tour` HKLM vs HKCU side by side with the same setting present in both; selecting each shows its scope and
    backing hive. From Microsoft *Predefined keys* / *Registry Hives*.
  - `machine-policy` apply a machine policy: the view jumps to HKLM\…\Policies\… and marks it as the effective
    source over the plain key. From Microsoft ADMX/Group Policy registry keys *(check exact path)*.
  - `user-policy` the same setting as a user policy under HKCU\…\Policies\…: affects only that user. Derived.
  - `both` user and machine policy for one setting: machine wins. Derived *(check)*.
- **Steps:** explorer, 0.
- **Legend:** key (folder shape), value (leaf with its type badge), machine hive vs user hive (two patterns),
  policy branch (distinct outline), effective source (kit highlight), changed (highlight on the key a policy wrote).
- **Captions:** hr: "Ista postavka postoji i u HKLM i u HKCU: HKLM vrijedi za stroj, HKCU za trenutnog korisnika."
  / en: "The same setting exists in both HKLM and HKCU: HKLM is machine-wide, HKCU is the current user." — hr:
  "Pravilo je zapisano pod granom Policies i ima prednost pred običnim ključem." / en: "The policy is written under
  the Policies branch and takes precedence over the plain key."
- **Terms:** registry — registar; hive — košnica *(check)*; key — ključ; value — vrijednost; machine-wide — na
  razini stroja; per-user — po korisniku; policy — pravilo (Group Policy = grupno pravilo); backing file —
  datoteka košnice *(check)*.
- **Misconceptions:** the registry is one flat file; HKCU is a separate database from HKEY_USERS (it is a view);
  editing the plain key beats a policy (the policy branch wins).
- **Out of scope:** registry permissions/ACLs, transactions, how ADMX templates render in the GPO editor
  (`win-admx-store`), performance, editing from a shell.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-registry` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-registry sims/win-registry` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-registry/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
