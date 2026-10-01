# win-admx-store: ADMX and the central store

| | |
|---|---|
| Task | `win-admx-store` (wave 3, Group Policy) |
| Catalogue entry | `win-admx-store` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-admx-store/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-precedence` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **where templates come from and why editors disagree**.

The student: edit from two admin machines with and without a central store.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-precedence/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "How to create and manage the Central Store for Group Policy Administrative Templates in Windows" (central store path, editor behaviour); "Managing Group Policy ADMX files step-by-step guide" (check title)

## Model and presets

- **Scene:** two admin machines, `ADM-A` (newer OS, newer templates: 412 files (derived)) and `ADM-B` (older OS, older templates), each with its local `%SystemRoot%\PolicyDefinitions` folder (ADMX + `en-US`, `hr-HR` ADML). In the middle, SYSVOL with an optional Central Store `\\quillmoor.example\SYSVOL\quillmoor.example\Policies\PolicyDefinitions`. One GPO with its `Registry.pol` holding three configured values; each editor's view of that GPO: setting shown with its name / shown as "Extra Registry Settings" / not shown.
- **State:** `{ centralStore: null|{ version, langs }, admins: { A: { local: { version, langs } }, B: {...} }, gpo: { registryPol: [{ key, value, needsVersion }] }, uiLang, selected }`.
- **Interaction (reference):** toggle the Central Store, pick which template set it holds, pick the editor's UI language; each editor's view updates; click a setting to see where its definition came from.
- **Rules (Microsoft: "How to create and manage the Central Store for Group Policy Administrative Templates in Windows"):**
  1. The settings live in the GPO (`Registry.pol` in SYSVOL); ADMX/ADML files only describe them for the editor. Clients don't need ADMX files to apply policy.
  2. Without a Central Store each editor reads its own local `PolicyDefinitions`.
  3. With a Central Store, every editor uses it exclusively and ignores its local folder (check: GPMC from Windows Vista/Server 2008 on).
  4. A configured value whose ADMX the editor lacks still applies on clients; the editor shows it only in reports as "Extra Registry Settings" and can't edit it by name.
  5. Each ADMX needs its ADML in the editor's language folder (fallback `en-US` (check)); a missing ADML gives a "resource … could not be found" error when opening the editor.
  6. The Central Store isn't created or updated automatically: an admin copies a template set into it; a newer set mostly supersedes older ones but files can be renamed or removed between versions (check).
  7. Old `.adm` templates are stored inside each GPO in SYSVOL (bloat); ADMX are not.
- **Params:** `centralStore` choice {none, older set, newer set} default none; `uiLang` choice {en-US, hr-HR} default en-US; `hrAdml` toggle (hr-HR ADML present) default off. A reference page normally has no params (see note).
- **Presets (lenses, 4):**
  - `no-store` — ADM-A sees all three settings, ADM-B sees two and an "Extra Registry Settings" entry. From rules 2, 4; counts derived.
  - `store-new` — Central Store with the newer set → both editors see all three. Rule 3.
  - `store-old` — Central Store with the older set → ADM-A, too, now sees only two (the store wins over its newer local files). Rule 3.
  - `language` — editor in hr-HR with no hr-HR ADML → error / fallback (rule 5, check).
- **Steps:** 0 (reference).
- **Legend:** ADMX file (gear doc), ADML (speech doc), Central Store (SYSVOL cylinder), setting shown by name (✓), as extra registry setting (?), editor error (✕); "changed" highlight marks the editor views changed by the last toggle.
- **Captions:** hr: "Postoji *Central Store* (središnje spremište): oba urednika koriste predloške iz SYSVOL-a i vide iste postavke." en: "A Central Store exists: both editors use the templates in SYSVOL and see the same settings."
  hr: "ADM-B nema ADMX za treću vrijednost: ona se i dalje primjenjuje na klijentima, ali je vidljiva samo kao „Extra Registry Settings”." en: "ADM-B lacks the ADMX for the third value: it still applies on clients, but shows only as \"Extra Registry Settings\"."
- **Terms (check):** administrative template — administrativni predložak; central store — središnje spremište; policy definition — definicija pravila; language file — jezična datoteka; editor — uređivač; registry — registar.
- **Misconceptions:** clients need the ADMX files; installing new templates on one admin PC updates the domain; a missing template removes the setting.
- **Out of scope:** writing ADMX, third-party templates, GPO precedence.
- **Note for the coordinator:** reference class with toggles (like `win-ad-structure`); reclassify as explorer (steps 0) if reference pages must have no params. The "soft: reuse `win-gpo-precedence`" dependency is weak: nothing from its model is needed.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-admx-store` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-admx-store sims/win-admx-store` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-admx-store/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
