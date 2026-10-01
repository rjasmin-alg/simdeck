# win-gpo-tattooing: Policies vs preferences

| | |
|---|---|
| Task | `win-gpo-tattooing` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-tattooing` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-tattooing/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-processing` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a policy reverts when the GPO goes away; a preference stays (tattooing)**.

The student: apply both kinds, unlink the GPO.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-processing/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Group Policy preferences" overview (preferences vs policies, tattooing); "Configure a registry item" with the Common tab options "Remove this item when it is no longer applied" and "Apply once and do not reapply" (check titles)

## Model and presets

- **Scene:** a GPO with two items side by side: a policy (Administrative Templates: "Prohibit access to Control Panel") and a preference (Registry item: `HKCU\Software\Quillmoor\ProxyMode = 1`, action Update). Under each, the PC's registry branch where it lands: `HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer` vs `HKCU\Software\Quillmoor`. A time strip of refreshes; buttons: user changes the value, unlink the GPO.
- **State:** `{ linked, refreshes, registry: { path: value|null }, itemFlags: { removeWhenNotApplied, applyOnce }, userEdits: [], log: [] }`.
- **One step:** one event (refresh, user edit, unlink) and what each item's registry value is afterwards.
- **Rules (Microsoft: "Group Policy preferences" overview; "Common tab" / "Remove this item when it is no longer applied" (check titles)):**
  1. Administrative Template policies write under the Policies keys (`…\Software\Policies`, `…\CurrentVersion\Policies`); Group Policy owns those keys and removes the values when the GPO no longer applies → the setting reverts to the default (not tattooed).
  2. Preferences write to ordinary registry locations, files or drive maps; when the GPO no longer applies they stay (tattooing), unless "Remove this item when it is no longer applied" is set (which forces the Replace action).
  3. Preferences are reapplied at each refresh: a user's change is overwritten at the next refresh, unless "Apply once and do not reapply" is set.
  4. Users can change preference values between refreshes (preferences are not locked in the UI); policies are enforced (UI greyed).
  5. Old ADM templates that write outside the Policies keys tattoo too (check).
  6. Tie-break: if unlink and refresh happen together, the refresh runs without the GPO (removal of policy values happens in that refresh).
- **Params:** `removeWhenNotApplied` toggle default off; `applyOnce` toggle default off.
- **Presets (5):**
  - `unlink` — both applied; unlink + refresh → Control Panel back (policy removed), ProxyMode = 1 still there (tattooed). 3 steps. Derived, unchecked.
  - `remove-flag` — same with "Remove when no longer applied" → ProxyMode deleted too. 3 steps.
  - `user-edit` — user sets ProxyMode = 0; next refresh → back to 1. 3 steps.
  - `apply-once` — apply once: user sets 0, refresh → stays 0. 3 steps.
  - `policy-locked` — user tries to change the Control Panel policy → greyed out; preference value editable. 2 steps.
- **Steps:** max 3.
- **Legend:** policy item (padlock, Policies key), preference item (pencil, ordinary key), tattooed value (tattoo mark / ink drop), removed (empty slot); "changed" highlight marks registry values changed in the step.
- **Captions:** hr: "GPO je odspojen: vrijednost pravila u ključu Policies je obrisana, ali *preference* (preferenca) `ProxyMode = 1` ostaje — tetovaža." en: "The GPO is unlinked: the policy value under Policies is removed, but the preference `ProxyMode = 1` stays — a tattoo."
  hr: "Korisnik je postavio 0, a sljedeće osvježavanje vraća 1." en: "The user set 0; the next refresh puts 1 back."
- **Terms (check):** policy — pravilo; preference — preferenca; tattooing — tetoviranje (zaostala postavka); registry — registar; refresh — osvježavanje; apply once — primijeni jednom.
- **Misconceptions:** removing the GPO undoes everything it set; preferences are enforced like policies; a preference can't be changed by users.
- **Out of scope:** item-level targeting (`win-gpo-targeting`), security-template tattooing, ADMX authoring.
- **Builds on `win-gpo-processing`:** reuses its refresh timeline; new is the policy/preference split and removal behaviour.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-gpo-tattooing sims/win-gpo-tattooing` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-tattooing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
