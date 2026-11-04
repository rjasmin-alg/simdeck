<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-recycle-bin: specification

One concept: **tombstone lifetime, the Recycle Bin, authoritative restore**: what a deleted directory object keeps in
each state of its life, and which restore brings back what (task `docs/tasks/w3/win-ad-recycle-bin.md`, catalogue
`win-ad-recycle-bin`, §4.5.1). The student mass-deletes two OUs, then recovers.

## Scene

The domain `quillmoor.example`. Two OUs under `OU=Staff` are deleted with everything in them: **`OU=HQ`** (21 users)
and **`OU=Brackenridge`** (44 users), 2 + 65 = **67 objects** (estate student material: `student/scenarios/S15.md`,
`student/configs/ad/quillmoor/ou-tree.txt`).

- **Lifecycle lane** on a time axis in days (−100 … 400, deletion on day 0): the states the deleted objects pass
  through with this forest's settings (live, deleted object, tombstone, recycled object, gone), the day marker, the
  backup's day (if any), the day the Recycle Bin was turned on (if during the recovery), and the lifetimes' ends.
- **Two stacks**, one per OU: the OU's own card and a stack card for its users (×21, ×44), with an example user's
  fields: SID, objectGUID, name, attributes, group memberships, password. Every field shows whether it survives in the
  current state (kept, struck = lost, empty = gone).
- **Forest box**: Recycle Bin on/off (with "one-way"), `tombstoneLifetime` 180, `msDS-deletedObjectLifetime` (not set,
  so = 180), the backup.
- **Restore panel**: reanimate a tombstone, restore from the Recycle Bin, authoritative restore from a backup: each
  available or not (with why), and what it brings back. The action of this step is marked.
- At the **outcome** step each stack gets three verdicts: logs on (or needs a new password), its own files (ACLs by
  SID), group access.

## State

`{ day, recycleBin, enabledOn: null|day, tsl: 180, dol: 180, backup: null|{ day }, objects: [{ id, kind: 'ou'|'user',
parent, ou, state, deletedOn, until, keeps: { sid, guid, name, attrs, groups, password }, by, asOf, restoredOn }], log: [], last }`.

- `state`: `live`, `deleted` (deleted object, Recycle Bin on), `tombstone`, `recycled`, `gone`.
- `until`: the last day of the current lifetime (null while live). The object moves on at the first garbage
  collection after it.
- `keeps`: which of the six fields the object still holds. A live object that was reanimated is `live` with
  `attrs`, `groups` and `password` false.
- `by`: how a live object came back (`reanimate`, `bin`, `auth`), `asOf`: the backup's day for `auth`, `restoredOn`:
  the day it came back (the lane).
- `log`: one entry per step (the event codes); `last`: this step's event with its outcome.

## Start (step 0)

Day 0 before the deletion. All 67 objects live with every field. `recycleBin` from the param, `enabledOn` null,
`tsl` = `dol` = 180 (estate `forest.txt`: tombstoneLifetime 180; `msDS-deletedObjectLifetime` not set, so it takes
`tombstoneLifetime`). `backup`: none, or `{ day: −backupAgeDays }`. `recycleBin` (state) is true only for the param
value `before`.

## Steps (event plan)

The plan is built from the params (`plan(p)`):

1. **delete** (day 0): every object of both OUs.
2. **wait** to day `daysSince` (only if `daysSince` > 0): garbage collection runs every 12 h on the way.
3. **enable** the Recycle Bin on day `daysSince` (only with `recycleBin` = `after`).
4. Recovery:
   - If the objects are still restorable online (deleted objects with the Recycle Bin, tombstones without):
     `usersFirst` adds a failed **restore-users** first; then **restore-ous**, then **restore-users**, each with
     method `bin` (Recycle Bin) or `reanimate` (tombstone).
   - Otherwise one **attempt** that fails (why: `recycled`, `gone`), then, if a backup exists, **auth** (the
     authoritative restore), which succeeds or is refused (`too-old`).
5. **outcome**: nothing changes; the stacks get their verdicts.

Step counts (presets): `no-recycle-bin` 4, `with-recycle-bin` 4, `enable-after` 4, `too-late` 4, `wrong-order` 5.
Over every param combination: 4 … 6 (6 = `daysSince` > 0 with `usersFirst` and an online restore, or `after` with
`daysSince` > 0 and a backup, used or refused). `sim.json` `steps` = the defaults' count, 4.

## Rules

Sources: Microsoft Learn, "What's New in AD DS: Active Directory Recycle Bin" (Windows Server 2008 R2, read
2026-11-04); "Active Directory Recycle Bin Step-by-Step Guide"; "Reanimating Active Directory Tombstone Objects";
"Performing an authoritative restore of Active Directory objects"; KB 216993 "Useful shelf life of a system-state
backup of Active Directory" (via search, 2026-11-04).

1. **Tombstone** (Recycle Bin off). A deleted object becomes a tombstone: `isDeleted`, moved to `CN=Deleted
   Objects`, DN mangled, most non-link attributes cleared, link-valued attributes (group memberships) removed. It
   keeps `objectSid`, `objectGUID` and its name (`name`, `sAMAccountName` are among the attributes kept by default);
   attributes, memberships and the password are gone. *(Task: "only SID and GUID"; the vendor's list keeps the name
   too, so the card keeps the name.)*
2. **Tombstone lifetime.** A tombstone lives `tombstoneLifetime` days (180 in forests created on Windows Server 2003
   SP1 or later; estate: 180). Garbage collection (every 12 h) removes it at its first run after that.
   **Tie-break:** on day 180 exactly it is still there; on day 190 (the next value of the range) it is gone.
3. **Reanimation** brings a tombstone back live with its SID and objectGUID (ACLs and profiles match again) and its
   name, but without the cleared attributes and the removed memberships; the account has no password and must be
   given a new one.
4. **Recycle Bin** (forest level 2008 R2 or later, an optional feature, irreversible). A deletion makes a **deleted
   object** that keeps every attribute and link for `msDS-deletedObjectLifetime` (not set = `tombstoneLifetime`);
   then it becomes a **recycled object** (attributes stripped like a tombstone) for `tombstoneLifetime` more *(check:
   the vendor text says the recycled object stays "until its recycled object lifetime expires"; the clock is taken
   from the recycling)*, then garbage collection removes it. Deleted on day 0: deleted object to day 180, recycled
   to day 360, gone from day 370 (range step). A recycled object cannot be restored from the Recycle Bin nor
   reanimated. **Tie-breaks:** day 180 still a deleted object, day 360 still recycled.
5. **Restore from the Recycle Bin** brings a deleted object back with every attribute and membership (and its
   password). **Parents first:** an OU must be live before its users can be restored. The same holds for
   reanimation (the object goes back under its last known parent).
6. **Enabling the Recycle Bin after the deletion** brings nothing back, and worse: every tombstone that exists then
   becomes a recycled object, no longer in `CN=Deleted Objects`, not restorable from the Recycle Bin and no longer
   reanimatable. The only way back is an authoritative restore from a backup taken before. *(Vendor, "Important" box.
   The task file says "they stay tombstones"; it is corrected here, see NOTES.md.)* The recycled objects keep their
   tombstone clock: gone after day 180 *(check)*.
7. **Authoritative restore** (a DC restored from a system-state backup in DSRM, the subtree marked authoritative):
   the objects come back as of the backup, with every attribute and membership (changes after the backup are lost);
   their version numbers are raised so they win over the deletion on every DC (the mechanism is
   `win-ad-backup-restore`'s rule 5). Memberships in other domains need the generated LDIF files (caption only).
   **Backup lifetime:** a backup older than `tombstoneLifetime` (with the Recycle Bin: the smaller of the two
   lifetimes) cannot be restored (KB 216993). **Tie-break:** a backup exactly 180 days old at the restore is usable;
   older is refused.
8. **Restore order tie-break.** Restoring users while their OU is not live fails, every one of them, with "the parent
   does not exist"; nothing changes. After the OU is restored, the same users restore.
9. **Outcome** (the page's verdicts, from the model's `verdict`): logs on = live with a password; a live account
   without one needs a new password. Own files (ACLs by SID) = live with its SID. Group access = live with its
   memberships. An account re-created by hand gets a new SID, so none of the three hold for the old ACLs and groups
   (caption, misconception).

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `recycleBin` | choice `off`, `before`, `after` | `off` | on before the deletion, or turned on during the recovery (on day `daysSince`); one-way (said in the forest box) |
| `daysSince` | 0–400 step 10 | 0 | days from the deletion to the recovery |
| `backupAgeDays` | none, 80 | none | a system-state backup taken that many days before the deletion |
| `usersFirst` | toggle | off | restore the users before their OU |

The task's `recycleBin` toggle and the trap "enable it after" are one three-way choice (`after` = the task's
`enable-after`), so the panel fits. The task's `backupAgeDays` choice {none, 80} is kept (0 = none); 80 is not tied
to any estate image on the page.

## Presets

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `no-recycle-bin` | defaults | 4 | 67 tombstones; reanimate 2 OUs, 65 users: SID, GUID, name back; attributes, memberships, passwords lost; 65 need a new password |
| `with-recycle-bin` | `recycleBin` `before` | 4 | 67 deleted objects; restore 2 OUs, then 65 users with everything; 65 log on |
| `enable-after` | `recycleBin` `after` | 4 | 67 tombstones become 67 recycled objects; the attempt finds nothing (`recycled`); no backup; 65 lost |
| `too-late` | `daysSince` 200 | 4 | day 200: 67 gone (collected after day 180); the attempt finds nothing (`gone`); 65 lost |
| `wrong-order` | `recycleBin` `before`, `usersFirst` | 5 | 65 users fail (parent), 2 OUs restored, 65 users restored |

More numbers checked by the tests: `too-late` with the backup (80): refused, 280 days old. `no-recycle-bin` with the
backup and `daysSince` 100: reanimation (online first), the panel shows auth as available (180 days, the tie-break).
`before` + `daysSince` 200: recycled, attempt fails; `daysSince` 370: gone. `after` + backup + `daysSince` 100: the
backup is exactly 180 days old, used; `daysSince` 110: 190 days, refused.

## Out of scope

USN rollback and the restore's replication mechanics (`win-ad-backup-restore`), DSRM details, "Protect from
accidental deletion" (mentioned in the explanation), cloud directory soft delete.
