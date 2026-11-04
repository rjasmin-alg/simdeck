<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-backup-restore: notes

New stepper (task `docs/tasks/w3/win-ad-backup-restore.md`, catalogue `win-ad-backup-restore`, §4.5.1, wave 3).
Drawn with kit view **K2** (two DC cards, the pull on the link, the shelf and the health box under the cards) and kit
view **K3** (qm-dc01's originating USNs, 100 per cell, two rows: before and after the restore or revert; qm-dc02's
UTD entry for each row's invocationID as a bracket). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One timeline, three modes.** Every run has the same 7 steps (backup or snapshot, writes, qm-dc02 pulls,
  restore or revert, writes or the authoritative mark, qm-dc02 pulls, qm-dc01 pulls), and a `mode` choice
  (`nonauth`, `auth`, `revert`) decides step 1, 4 and 5. Changing the mode keeps the step, so the same point of the
  demo can be compared across modes ("what if it had been a supported restore?").
- **The OU deletion is part of every run.** The last 100 of the changes after the backup delete
  `OU=Brackenridge` and its 99 objects. That one timeline carries both lessons: after a non-authoritative restore the
  deletion comes back (deleted objects stay deleted); after the authoritative mark the OU wins; after a plain revert the
  OU lingers on qm-dc01 only.
- **Blocks of 100 changes.** A cell, a pull's unit and the OU subtree (OU + 99 objects = 100 changes) are all one
  block, so every number is a multiple of 100 and the strip stays at 10 cells.
- **Detection where the vendor puts it** (rule 8). KB 875495: event 2095 is logged by the rolled-back DC when a
  partner's request shows it has already acknowledged USNs from the same invocationID; Netlogon is paused and Dsa
  Not Writable set. So with the task's numbers (revert, 600 then 400 writes) the reverted DC is caught at step 6 and
  the lamp turns red. The "green lamp while broken" lesson is the fifth preset, `silent-rollback` (1000 writes after
  the revert: past the partner's 5600, nothing is detected, divergence is permanent).
- **Watermark reset** (rule 3): shown as "from 0" with the HWM row on qm-dc02 marking the stale invocationID (`≠`).
- **Cell kinds.** filled = on qm-dc01 not yet pulled; filled ✓ = on both; hatched (`soft`) = on qm-dc01 only and
  covered by qm-dc02's UTD: never pulled; dashed ✓ (`ghost`) = on qm-dc02 only; grey struck (`dead`) = overwritten on
  every DC. The task's legend had three (committed, replicated, never); the other two are needed once qm-dc01 loses
  changes by going back. Colour by invocationID (a1f3 = series 1, b82e = series 3), so after a plain revert row 2
  has the *same* colour as row 1: same identity, same numbers, other changes.
- **The god's-eye box** ("Actual state") is computed by the page from both DCs: changes only one holds, whether they
  can still arrive, whether the OU differs. The lamp only shows what the DCs report.
- **Shelf only under qm-dc01** (the task says under each DC): qm-dc02 is never backed up in any run, an empty shelf
  only took room.
- **Numbers.** qm-dc01 at 5000 (task); qm-dc02 at 8200, invocationIDs `a1f3…`, `b82e…`, `e52b…`, the 99 objects:
  made up. The backup is 3 days old (task), so the authoritative version is 1 + 3 × 100,000 = 300,001.
- **Model copied, not shared:** `models/` has no replication model. The pull, dampening and UTD merge follow
  `sims/win-ad-replication/sim.js @ 2797397` (rules 2–4 there), rewritten for blocks and invocationIDs; no function
  is copied verbatim.

## Deviations from the task

- **`quillmoor-image` preset dropped.** The task describes it as "the 2026-09-13 whole-VM image of qm-dc01 brought
  onto the network → rule 4 (USN rollback)". The cited instructor source (DR S15, model answer) says the opposite: the
  hypervisor gives a restored VM a new generation ID, so the image is only a non-authoritative restore that replicates
  the deletions straight back in. Building it either way puts the scenario's model answer (one of its traps) into a
  preset, which COMMON.md §1 forbids. Replaced by `silent-rollback` (generic, no estate dates). Owner decision listed
  in the report.
- **7 steps in every preset** (task: 5 / 6 / 6 / 5 / 5, max 6): one uniform timeline, and the last pull (qm-dc01 ←
  qm-dc02) is the step that shows the deletion returning, the OU winning, or the quarantine holding.
- **Lamp in `usn-rollback`** turns red at step 6 (vendor detection, above); the task said it stays green.
- **`mode` param added** (choice); `vmGenId` is shown only in `revert`, `writesAfterRevert` hidden in `auth`.
- **`writesAfter` range 100–1000** (task 0–1000): the last 100 are the OU deletion; with 0 there is nothing to
  restore and no rollback.
- **Kit views K2 and K3 exist**, so no own drawing.

## Sources

- Microsoft Learn, "How to detect and recover from a USN rollback in a Windows Server-based domain controller"
  (KB 875495, read 2026-11-04): event 2095 text and conditions, Netlogon paused, Dsa Not Writable = 4, invocationID
  reset by supported restores and partners adjusting their watermarks, the silent case (repadmin reports no errors;
  changes above the old UTD replicate, those below never do), recovery by forced demotion and metadata cleanup,
  Windows Server 2012 GenID → new invocationID.
- Microsoft Learn, "Virtualized domain controller architecture" (VM-GenID safeguards; RID pool discarded) — from
  memory, not re-read.
- Microsoft Learn (archived), "Ntdsutil: Active Directory", Authoritative restore (read 2026-11-04): "`verinc %d`: a
  numeric value that overrides the default value of 100,000. The version number … will be increased by this value
  times the number of days since backup." So 1 + 3 × 100,000 = 300,001.
- `sims/win-ad-replication/SPEC.md` (pull, HWM, UTD, dampening, conflict order).
- DR estate, instructor side: `instructor/scenarios/S15.md` and `instructor/caveats.md` CV-66 read only to check the
  `quillmoor-image` preset (see Deviations); nothing from them is on the page. Host names qm-dc01/qm-dc02 and the OU
  name from the task.

## Checks

- Numbers: computed by hand in `SPEC.md` before the page, then printed step by step for all five presets with a
  scratch script; `sim.test.js` "presets" pins every USN of every step.
- `sim.test.js`: 23 tests, tie-breaks first (rule 8 equal is not detected; UTD equal covers; conflict order), one per
  rule, a sweep of every param combination (3 modes × GenID × 10 × 11).
- Page sweep: every step of 39 param combinations × 2 languages at 1920×1080 (624 states): no console errors, no
  empty caption or leftover placeholder, no stage overflow, no page scroll.
- `npm run gate -- win-ad-backup-restore`: passes (62 browser checks). Screenshots reviewed: 1920×1080 light, dark,
  grayscale, 375×812, both languages, plus the key steps of every preset.

## Unchecked *(check)*

- The watermark reset mechanism ([MS-DRSR] `uuidInvocIdSrc` in the request; the source answers from USN 0). KB
  875495 only says partners "adjust their high watermark values accordingly".
- The retired invocationID kept in the restored DC's UTD at the backup's USN.
- Detection on the UTD entry (not the HWM), strictly greater; and that the reverted DC refuses inbound replication
  too once Dsa Not Writable is set.
- VM-GenID discards the RID pool (caption only).
- Croatian terms (task marks them *(check)*): nemjerodavna obnova, mjerodavna obnova, snimka, sigurnosna kopija stanja
  sustava, način obnove usluga imenika (DSRM); "vraćanje USN-a" for *USN rollback* is in the task but the page keeps
  the English term (it is the name of the event and the KB).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| non-authoritative restore | nemjerodavna obnova | task *(check)* |
| authoritative restore | mjerodavna obnova | task *(check)* |
| snapshot | snimka | task *(check)* |
| system state backup | sigurnosna kopija stanja sustava | task *(check)* |
| directory services restore mode (DSRM) | način obnove usluga imenika | task *(check)* |
| up-to-dateness vector | vektor ažurnosti | `win-ad-replication` *(check)* |
| high-watermark | gornja oznaka | `win-ad-replication` *(check)* |
| USN rollback | vraćanje USN-a | task *(check)*; not used on the page |

## Shared requests

- **Promote a replication model** (`models/ad-replication`?): `win-ad-replication` and this page both implement pull
  above the HWM, UTD dampening and the UTD merge. This page needs two additions over the first: the source's
  invocationID (watermark reset when it changed) and blocks of changes instead of attributes.
- **K3: a cell state "on the other replica only"**: `ghost` with a ✓ text stands in for it here.
- **K2: `name` as a node** (as `win-ad-replication` asked): used again here for the host line with badges.

## Fresh review

A separate agent read the code against `SPEC.md`, ran 49 mutations of `sim.js` (33 killed; of the 16 survivors 9 are
equivalent over every reachable param combination and step) and checked the captions for every mode and param.
Fixed from it:
- **Tests:** the block at the HWM is not offered (`>=` in the offer), `knows` and the UTD merge (max, not
  overwrite) after the watermark reset, the `never()` boundaries, the DSRM flag at steps 4–6 in every mode, and a
  hand-built losing OU change (the params never reach it; now said in SPEC rule 6). Re-run: only the 9 equivalent
  mutants survive.
- **Model:** `never()` for changes only on qm-dc02 now matches `dampened()` ("own at any USN").
- **Page:** "{k} of them will never arrive" when only part of the count is lost. `capWriteSame` names the overlapping
  range and says which numbers are new. There is a snapshot caption for the VM-GenID case. Param labels say
  "backup or snapshot" and "restore or revert". The recovery caption names which DC is demoted and which is cleaned
  up, and adds the second cure (a restore from a good system-state backup). Versions are grouped (300,001 /
  300 001). Croatian grammar fixed: "Zadnjih 100 briše", "Izostavlja se / UTD izostavlja", "neće vratiti na
  qm-dc01", "na oba DC-a".
- **SPEC:** the `ou` fields and the `snapshot` event.
- **Fact the reviewer doubted:** a flat 100,000 since Server 2003. The Ntdsutil reference says per day, so the
  increment stands.

## Time

Start 2026-11-04 02:07, gate passing 02:20, review fixed and committed 02:33: about 26 minutes of wall clock.
