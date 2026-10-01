# win-ntfs-inheritance: NTFS inheritance

| | |
|---|---|
| Task | `win-ntfs-inheritance` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-ntfs-inheritance` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-ntfs-inheritance/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ntfs-share-effective` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **inherited vs explicit ACEs, disabling inheritance, move vs copy**.

The student: build a folder tree, move files around.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/win-ntfs-share-effective/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Microsoft Win32 security docs: "Order of ACEs in a DACL", "ACE Inheritance Rules", "How DACLs Control Access to an Object".
- Microsoft support article "How permissions are handled when you copy and move files and folders" *(check: still published)*.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, „Kad tri skupine bitova nisu dovoljne" (ACL, zadana ACL that new objects inherit: the Linux counterpart and the terms *popis kontrole pristupa*, *nasljeđivanje*).

## Model and presets

- **Scene:** a folder tree on the left, `D:\Projekti` → `Grafika` → `Kampanja2026` → `logo.psd`, plus a second
  branch `D:\Projekti\Arhiva`. Right: the DACL of the selected object as a K4 rule table, one row per ACE: trustee,
  allow/deny, rights, "applies to" (this folder / subfolders / files), and **source**: explicit, or "inherited from
  <folder>". Inherited rows are greyed and locked, as in the Advanced Security Settings dialog.
- **State:** `{ tree: [{id, path, parent, inherit: true|false, aces: [{id, trustee, type: 'allow'|'deny',
  rights: [], appliesTo: 'this'|'this+sub+files'|'sub+files'|'files', explicit: true, from: null}]}], selected,
  op, event }`; inherited ACEs are computed, not stored (rule 1), except after "convert" or a move (rules 4–6).
- **One step:** one operation from the preset script, in order: validate → change the object's own ACEs or flags →
  recompute inherited ACEs down the subtree (parents before children, siblings by name) → re-sort each DACL
  (rule 3) → recompute the effective-access readout for the chosen user.
- **Rules:**
  1. An ACE with container/object inherit flags on a folder is propagated to children as an inherited ACE; the
     child shows where it came from (Microsoft "How inheritance affects file and folder permissions" *(check
     title)*; "ACE Inheritance Rules" in the Win32 security docs).
  2. "Applies to" decides what receives it: this folder only, subfolders, files, or combinations (inheritance
     flags OI, CI, IO) (Win32 "ACE Inheritance Rules").
  3. DACL order: explicit deny, explicit allow, inherited deny, inherited allow; the access check walks it in
     order, so an **explicit allow on the child beats an inherited deny from the parent** (Win32 "Order of ACEs
     in a DACL").
  4. Disabling inheritance asks: convert inherited ACEs into explicit ones (copy) or remove them all; after that,
     parent changes no longer reach the object (Advanced Security Settings dialog *(check wording on Server
     2022)*).
  5. Copy (any volume) and move to another volume: the new object gets the destination's inherited ACEs; its
     old inherited ACEs are gone; explicit ACEs are kept only by tools that copy security (Explorer copy does not)
     *(check)*.
  6. Move within the same volume: the object keeps its explicit ACEs and, in the classic behaviour, also its old
     inherited ones until permissions are re-propagated (Microsoft KB "How permissions are handled when you copy
     and move files and folders" *(check: current Explorer may re-inherit)*).
  7. Changing an ACE on a parent re-propagates to every child that still inherits (derived from rule 1).
  Tie-break: when two inherited ACEs come from different ancestors, the nearer ancestor's ACEs come first
  (Win32 "Order of ACEs in a DACL" *(check)*).
- **Params:** `user` choice ana/marko/vanjski (ana; for the effective-access line only); `showFlags` toggle (off:
  plain-language "applies to"; on: OI/CI/IO letters).
- **Presets:**
  - `basic` `Projekti` grants Grafičari Modify to this folder, subfolders and files: `logo.psd` shows it as
    inherited from `D:\Projekti`. Derived from rule 1.
  - `explicit-beats-inherited` `Projekti` denies Vanjski Write (inherited), `Kampanja2026` explicitly allows
    Vanjski Write: on `Kampanja2026` the explicit allow sorts before the inherited deny → write allowed; on
    `logo.psd` both are inherited, the nearer ancestor's allow comes first → write allowed. Derived from rule 3
    and the tie-break; verify in a VM *(check)*.
  - `disable-convert` disable inheritance on `Kampanja2026` with "convert": same rows, now explicit; then
    removing Grafičari on `Projekti` no longer reaches it. Derived from rule 4.
  - `copy-vs-move` `logo.psd` copied to `Arhiva` (gets Arhiva's ACEs) and moved within `D:` (keeps Grafika's).
    From the Microsoft KB on copy and move, outcome marked *(check)*.
  - `cross-volume` the same move to `E:\Arhiva`: behaves like a copy. From the same KB *(check)*.
- **Steps:** `basic` 3, `explicit-beats-inherited` 5, `disable-convert` 5, `copy-vs-move` 4, `cross-volume` 3.
- **Legend:** explicit ACE (solid row), inherited ACE (grey row with a chain-link icon and "from <folder>"), deny
  (cross shape), allow (check shape), inheritance off (broken chain on the folder), changed (kit highlight on rows
  added, removed or re-sorted this step).
- **Captions:** hr: "`logo.psd` nema vlastitih unosa: sve što vidite naslijedio je od `D:\Projekti`." / en:
  "`logo.psd` has no entries of its own: everything you see is inherited from `D:\Projekti`." — hr: "Isključeno
  nasljeđivanje s pretvaranjem: unosi su ostali, ali sad su izričiti i promjene roditelja više ne stižu." / en:
  "Inheritance disabled with convert: the entries stayed, but they are explicit now and parent changes no longer
  arrive."
- **Terms:** access control list — popis kontrole pristupa (ACL, UL ch7); access control entry — unos (ACE);
  inheritance — nasljeđivanje (UL ch7); explicit — izričit; inherited — naslijeđen; permission — dozvola (UL ch7);
  deny — zabrana; allow — dopuštenje.
- **Misconceptions:** deny always wins (explicit allow beats inherited deny); disabling inheritance removes
  permissions (it can keep them as explicit); a moved file always takes the new folder's permissions.
- **Out of scope:** share permissions and the combination (`win-ntfs-share-effective`), owner and CREATOR OWNER,
  special permissions in detail, `icacls` syntax beyond a caption line, Linux default ACLs (one line of
  comparison, UL ch7).
- **Builds on `win-ntfs-share-effective`:** reuses its ACE table, trustee and rights vocabulary and its access
  check for the effective-access line; new are the tree, propagation, the explicit/inherited source and the
  ordering rule.
- **Note for the coordinator:** rule 3 means "deny beats allow" in `win-ntfs-share-effective` holds only among
  ACEs of the same kind (both explicit or both inherited); that page's wording should say so.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ntfs-inheritance sims/win-ntfs-inheritance` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ntfs-inheritance/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
