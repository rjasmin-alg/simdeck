# win-ad-recycle-bin: Deleted objects: tombstone and recycle bin

| | |
|---|---|
| Task | `win-ad-recycle-bin` (wave 3, Active Directory) |
| Catalogue entry | `win-ad-recycle-bin` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ad-recycle-bin/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2, DR |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-replication` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **tombstone lifetime, recycle bin, authoritative restore**.

The student: mass-delete an OU, then recover.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-replication/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S15.md` (DR estate scenario)
- Catalogue seed: DR S15
- `~/projects/dr-lecture-estate/instructor/scenarios/S15.md` (model answer: 65 users, Recycle Bin off, 180-day tombstones, traps)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (Recycle Bin disabled, tombstoneLifetime 180 days, DSRM password not recorded) and `ou-tree.txt` (HQ 21 + Brackenridge 44 users)
- Microsoft Learn: "Active Directory Recycle Bin step-by-step guide"; "Performing an authoritative restore of Active Directory objects"

## Model and presets

- **Scene:** a lifecycle lane per object (time axis in days): live → deleted object → recycled object/tombstone → gone. The estate's deleted OUs `OU=HQ` (21 users) and `OU=Brackenridge` (44 users) as two stacks of user cards; each card shows what survives in that state: SID, objectGUID, name, attributes, group memberships, password. A switch "Recycle Bin enabled" with a note that turning it on is one-way. A restore panel: reanimate tombstone, restore from the Recycle Bin, authoritative restore from backup.
- **State:** `{ day, recycleBin: bool, enabledOn: null|day, objects: [{ id, parent, state, deletedOn, keeps: {...} }], tsl: 180, dol: 180, backup: null|{ day }, log: [] }`.
- **One step:** one event (delete, a day jump, enable the Recycle Bin, garbage collection, a restore action) and its effect on every card.
- **Rules (Microsoft: "Active Directory Recycle Bin step-by-step guide"; "Performing an authoritative restore of Active Directory objects"):**
  1. Without the Recycle Bin a deleted object becomes a tombstone: `isDeleted`, moved to `CN=Deleted Objects`, most attributes stripped; it keeps SID and objectGUID; group memberships (linked attributes) and password are gone.
  2. A tombstone lives for `tombstoneLifetime` (180 days in forests created on Windows Server 2003 SP1 or later; estate `forest.txt`: 180), then garbage collection (every 12 h) removes it.
  3. Reanimating a tombstone brings back the object with its SID (ACLs and profiles match again) but without the lost attributes and memberships; the account needs a new password.
  4. With the Recycle Bin (forest level 2008 R2+, enabled as an optional feature, irreversible) a deletion first makes a deleted object that keeps all attributes and links for `msDS-deletedObjectLifetime` (default = tombstoneLifetime); then it becomes a recycled object (like a tombstone) for another tombstoneLifetime (check).
  5. Restoring a deleted object from the Recycle Bin brings it back with attributes and memberships; parents first: an OU must be restored before its users.
  6. Enabling the Recycle Bin does nothing for objects already deleted: they stay tombstones.
  7. Authoritative restore (DSRM on a DC restored from a system-state backup, authoritative restore of the subtree) brings back the objects as of the backup and raises their version numbers so they win over the deletion everywhere (`win-ad-backup-restore`); memberships in other domains need the generated LDIF files.
  8. Tie-break for restore order: if users are restored before their OU, the restore fails with "parent does not exist" and the caption says so.
- **Params:** `recycleBin` toggle default off; `daysSince` range 0–400 step 10 default 0; `backupAgeDays` choice {none, 80} default none (estate: last DC image 2026-09-13, 80 days before the 12-02 deletion).
- **Presets (5):**
  - `quillmoor-s15` — estate S15: 65 users deleted (21 + 44), Recycle Bin off, no system-state backup → reanimate 65 tombstones: SIDs back, memberships and attributes lost, passwords to reset. 5 steps. From DR S15 (instructor model answer).
  - `with-recycle-bin` — same deletion with the Recycle Bin on → restore from the Recycle Bin, OU first, then 65 users with memberships ✓. 5 steps.
  - `enable-after` — the trap: enable the Recycle Bin after the deletion → nothing to restore from it (rule 6). 4 steps. From DR S15 "Traps".
  - `too-late` — 200 days later without Recycle Bin → tombstones collected, nothing to reanimate; only a backup helps. 4 steps.
  - `wrong-order` — Recycle Bin on, users restored before the OU → fails, then OU, then users ✓. 5 steps.
- **Steps:** max 5.
- **Legend:** live (solid card), deleted object (card with bin icon, all fields), tombstone/recycled (hollow card, only SID and GUID), gone (empty slot), field lost (struck through); "changed" highlight marks the cards whose state changed.
- **Captions:** hr: "Bez *Recycle Bin* (koša za smeće AD-a) obrisani korisnik postaje *tombstone* (nadgrobni zapis): SID ostaje, članstva u grupama nestaju." en: "Without the Recycle Bin a deleted user becomes a tombstone: the SID stays, group memberships are gone."
  hr: "Uključivanje koša nakon brisanja ne vraća ništa: 65 računa i dalje su nadgrobni zapisi." en: "Turning the Recycle Bin on after the deletion brings nothing back: the 65 accounts are still tombstones."
- **Terms (check):** tombstone — nadgrobni zapis; tombstone lifetime — životni vijek nadgrobnog zapisa; Recycle Bin — koš za smeće AD-a; reanimation — oživljavanje; authoritative restore — mjerodavna obnova; garbage collection — čišćenje; deleted object — obrisani objekt.
- **Misconceptions:** a reanimated tombstone is a full restore; re-creating the accounts with the same names is the same; enabling the Recycle Bin is retroactive.
- **Out of scope:** USN rollback (`win-ad-backup-restore`), DSRM details, "Protect from accidental deletion" (mention only), cloud directory soft delete.
- **Builds on `win-ad-replication`:** a deletion is a replicated change (metadata version) — only used to explain rule 7; mostly new model.
- **Note for the coordinator:** authoritative restore appears here (rule 7) and in `win-ad-backup-restore`; keep the mechanism there and only reference it here.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ad-recycle-bin sims/win-ad-recycle-bin` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ad-recycle-bin/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
