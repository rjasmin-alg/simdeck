<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-recycle-bin: notes

New stepper (task `docs/tasks/w3/win-ad-recycle-bin.md`, catalogue `win-ad-recycle-bin`, §4.5.1, wave 3). Own drawing
(no kit view fits a lifecycle lane with field cards): the lane is HTML boxes positioned in percent, so text is never
scaled. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Rule 6 corrected against the vendor.** The task says that after a late enable the deleted accounts "stay
  tombstones". Microsoft's Recycle Bin page ("Important" box) says the opposite: every tombstone that exists when the
  Recycle Bin is turned on becomes a recycled object, leaves `CN=Deleted Objects`, and can no longer be restored from
  the Recycle Bin or reanimated; only an authoritative restore from an earlier backup brings it back. The model and the
  captions follow the vendor. The task's second caption ("…the 65 accounts are still tombstones") is changed to "none
  of the 65 accounts is in it", followed by "worse: all 67 tombstones are now recycled objects".
- **Presets are generic, not the S15 answer.** COMMON.md §1 and the task's own Sources line forbid turning a model answer
  into a preset. The task's `quillmoor-s15` ("from DR S15, instructor model answer") is renamed `no-recycle-bin`, and no
  preset, label or caption names the scenario, the estate's dates, which backups the estate has, or the DSRM password.
  Kept from the estate: the domain name, the two OUs and their counts (21 + 44), Recycle Bin off and 180 days, all from
  `student/` material. `enable-after` stays as a mechanism preset (the task's rule 6 and its misconception "enabling the
  Recycle Bin is retroactive"), though the instructor file also lists it as a trap. Owner decision, see the report.
- **The backup choice 80** is the task's number. The page calls it "80 days before the deletion" and never ties it to an
  estate image.
- **One choice instead of two toggles.** `recycleBin`: no / before the deletion / after the deletion (the task's toggle
  plus the `enable-after` trap). This saves a panel row, and the panel did not fit at 1920×1080 with both toggles. The
  "one-way" note is in the forest box ("turning it on is one-way"), not a hint.
- **Plan built from the params** (`steps` is a function): delete; wait (if `daysSince` > 0); enable (if `after`); the
  online restore (OUs, users; a failed users step first with `usersFirst`) or a failed attempt plus the authoritative
  restore if there is a backup; outcome. The online way is always tried first; the backup is used only when the online
  way fails (the panel shows when both are possible).
- **The outcome step** adds three verdicts per stack (logs on / own files by SID / group access), which carries the
  misconceptions "a reanimated tombstone is a full restore" and "re-creating accounts is the same".
- **A tombstone keeps its name**, not only SID and GUID as the task says. `name` and `sAMAccountName` are among the
  attributes preserved on tombstones (Microsoft, "Reanimating Active Directory Tombstone Objects", from memory).
- **Reanimation needs the parent too.** Rule 8's tie-break applies to both restore methods (the object returns under
  `lastKnownParent`).
- **Backup lifetime** (KB 216993): a backup older than the tombstone lifetime cannot be restored. With the task's 80 days
  that makes `too-late` with a backup refused (280 days), which matches "only a backup helps" only for a backup younger
  than 180 days. The tie-break is exactly 180 days: usable.
- **Recycled objects after a late enable keep the tombstone clock** (gone after day 180). With the Recycle Bin on from
  the start, the recycled phase lasts `tombstoneLifetime` from the recycling (gone after day 360). Both are *(check)*.
- **Example users** (`j.ashby`, `t.mercer`), SIDs, GUIDs and group names are made up. One card stands for each OU's
  users, because all of them share their state in every reachable run.
- **The model is not shared:** `models/` has no AD model, and this one has nothing in common with
  `win-ad-replication`'s pull. Rule 7 (the version raise) is a caption that points to `win-ad-backup-restore`.

## Deviations from the task

- Rule 6 and its caption (above).
- `quillmoor-s15` → `no-recycle-bin` (above).
- Step counts: `no-recycle-bin` 4 (task 5), `with-recycle-bin` 4 (task 5), `enable-after` 4, `too-late` 4,
  `wrong-order` 5. Over every param combination 4–6 (task: max 5); 6 needs `daysSince` > 0 with `usersFirst`, or
  `after` with a usable backup and `daysSince` > 0.
- `recycleBin` is a three-way choice; there is no separate `enableAfter`; `usersFirst` is an added param (the task's
  `wrong-order` preset needs it).
- Legend: tombstone and recycled object are two entries (dashed, and dashed with hatching), plus "field lost" (struck).
- "Protect from accidental deletion" is only in the explanation, as the task says.

## Sources

- Microsoft Learn (archived), "What's New in AD DS: Active Directory Recycle Bin" (Windows Server 2008 R2), read
  2026-11-04: tombstone contents, deleted vs recycled objects, `msDS-deletedObjectLifetime` null = `tombstoneLifetime`,
  default 180, irreversible, the "Important" box on existing tombstones becoming recycled objects.
- Microsoft KB 216993 and "AD DS: The resultant backup lifetime in this forest should be equal to or greater than 180
  days" (search summary, 2026-11-04): the backup's useful life = the tombstone lifetime, or the smaller of the two
  lifetimes with the Recycle Bin.
- "Active Directory Recycle Bin Step-by-Step Guide", "Reanimating Active Directory Tombstone Objects", "Performing an
  authoritative restore of Active Directory objects": from memory, not re-read (parents first, the attributes a
  tombstone keeps, the LDIF files for memberships in other domains).
- Estate, student side: `student/scenarios/S15.md`, `student/configs/ad/quillmoor/forest.txt`, `ou-tree.txt`.
- Estate, instructor side: `instructor/scenarios/S15.md` was read only to check the model. Its trap on a late enable
  confirmed the rule 6 correction. Nothing from it is on the page.

## Checks

- Numbers: printed per step for the five presets and seven edge combinations with a scratch script before the page
  existed. `sim.test.js` pins them.
- `sim.test.js`: tie-breaks first (restore order for both methods; one OU live and one not; day 180/190; 180/190/360/370
  with the Recycle Bin; backup 180/190 days), one test per rule, the restore panel options, the lane, the presets, a
  sweep of every param combination (3 × 2 × 2 × 41), and the template's generic block.
- Page sweep: every step of the five presets in both languages at 1920×1080. No console errors, no empty caption or
  leftover placeholder, nothing overflowing the stage, no page scroll.
- `npm run gate -- win-ad-recycle-bin` passes. Screenshots reviewed: 1920×1080 light, dark and grayscale, 375×812, both
  languages, plus every preset step.

## Unchecked *(check)*

- The recycled object's lifetime when the Recycle Bin was on at the deletion (from the recycling vs from the deletion),
  and the end of a recycled object made by a late enable (the tombstone's clock).
- The exact list of attributes a tombstone keeps (name kept, from memory).
- That reanimation, like the Recycle Bin restore, refuses a child whose parent is not live.
- Croatian terms (the task marks them *(check)*): nadgrobni zapis, životni vijek nadgrobnog zapisa, koš za smeće AD-a,
  oživljavanje, mjerodavna obnova, čišćenje, obrisani objekt; and "reciklirani objekt" (mine).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| tombstone | nadgrobni zapis | task *(check)* |
| tombstone lifetime | životni vijek nadgrobnog zapisa | task *(check)* |
| Recycle Bin (AD) | koš za smeće AD-a | task *(check)* |
| reanimation | oživljavanje | task *(check)* |
| authoritative restore | mjerodavna obnova | task *(check)*, as in `win-ad-backup-restore` |
| garbage collection | čišćenje | task *(check)* |
| deleted object | obrisani objekt | task *(check)* |
| recycled object | reciklirani objekt | simdeck *(check)* |

## Shared requests

- None for the kit. A K-view for "lifecycle lane on a time axis" would serve this page, and the lifetime pages in
  storage and DNS, if more sims need one.

## Fresh review

A separate agent read the code against `SPEC.md`, ran 69 mutations of `sim.js` (47 killed; of the 22 survivors 12 are
equivalent over every reachable param combination, mostly because tombstoneLifetime = deletedObjectLifetime = 180)
and checked the captions for odd combinations. Fixed from it:
- **Tests** for the 10 real gaps: `plan` and `advance` agree (the sweep checks that an attempt only comes when nothing
  is restorable, and that no restore but `usersFirst`'s first one fails), the attempt's method and recycled count, the
  delete event's state, the verdicts on recycled users, a late enable keeping the tombstone clock, the panel during a
  partial restore, and `until` cleared on restore. The four sampled again are killed now.
- **Captions:** "Only a backup is left. There is no backup." now reads "Only a backup could bring them back."; a
  tombstone collected without a recycled phase has its own caption (`capWaitGoneTomb`, not "the last lifetime …
  too"); hr "poveznice na GPO-ove".
- **SPEC:** the three-way `recycleBin`, the step range 4–6, `restoredOn`.
- Left as is: `usersFirst` does nothing when nothing can be restored online (no restore steps to reorder).

## Time

Start 2026-11-04 02:37, gate passing 02:50, review fixed 03:00: about 25 minutes of wall clock.
