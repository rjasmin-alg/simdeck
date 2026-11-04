<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-backup-restore: specification

One concept: **non-authoritative vs authoritative restore; reverting a DC snapshot silently breaks replication** (task
`docs/tasks/w3/win-ad-backup-restore.md`, catalogue `win-ad-backup-restore`, §4.5.1). The student restores a DC each
way and reverts a VM snapshot, on one timeline, and sees whether the two DCs end up holding the same changes.

Builds on `win-ad-replication` (USN counter, high-watermark, up-to-dateness vector, pull, dampening). New here: the
invocationID, a backup or snapshot of the DC, the restore or revert, the partner's watermark reset, the authoritative
version raise, and USN rollback with its detection.

## Scene

Two domain controllers of `quillmoor.example`: **qm-dc01** (`DC01`, the one that is backed up and restored) and
**qm-dc02** (`DC02`, its partner), drawn with kit view **K2** (two cards, one link, the pull as a packet on it).
Each card: host name, invocationID, USN, Netlogon state and the role of this step; its UTD (one row per invocationID
it knows, including its own and retired ones), its HWM for the partner and the partner invocationID that HWM belongs
to; and the state of **`OU=Brackenridge`** (an OU with 99 objects in it: exists or deleted, version).
Under qm-dc01 the **shelf**: the system-state backup (disk icon) or the VM snapshot (camera icon), with its day, USN
and invocationID.

Under the cards a **K3 block grid of qm-dc01's originating USNs**: one cell = 100 USNs (5001–5100 … 5901–6000),
two rows: row 1 the changes qm-dc01 made before the restore/revert, row 2 those it made after (under the new
invocationID, or under the *same* one again after a plain revert). A cell's kind says who holds those changes:

| Cell | Means |
|---|---|
| filled | on qm-dc01, not yet pulled by qm-dc02 |
| filled + ✓ | on both DCs |
| hatched | on qm-dc01 only, and qm-dc02's UTD already covers those USNs: it will **never** pull them |
| dashed + ✓ | on qm-dc02 only: qm-dc01 lost them when it went back |
| grey, struck | overwritten on every DC (the OU deletion beaten by the authoritative restore) |

A bracket over each row shows qm-dc02's UTD entry for that row's invocationID (what qm-dc02 believes it has).
`OU` under a cell marks the block that carries the OU change.

Beside the grid: the **replication health lamp** (what the DCs report: green "no errors" unless a pull was refused)
and the **actual state** (computed by the page's god's-eye view: in step, or how many changes only one DC holds,
whether they can still arrive, and whether the OU differs).

## State

`{ day, dcs: { DC01|DC02: { usn, inv, netlogon: 'running'|'paused', writable, dsrm, utd: { inv: usn }, hwm: { partner:
usn }, knows: { partner: inv }, held: { blockId: { local, live } }, ou: { exists, ver, by, inv, day } } }, blocks: [{ id, inv, gen,
col, usn, ou: null|'del'|'auth', ver, day }], shelf: [{ dc, kind: 'systemstate'|'vm-snapshot', day, usn, inv, image }],
health: 'ok'|'error', events: [{ dc, code: 2095, day }], last }`.

- A **block** is 100 originating changes of qm-dc01, USNs `usn − 99 … usn`; `gen` 1 before the restore, 2 after;
  `col` its column (`usn` / 100 − 51). One block may carry the OU change (`ou`, with the version `ver` it gives).
- `held[id]`: the DC holds the block, stored under its local USN `local`; `live: false` when a later OU change
  overwrote it there (it is not sent any more).
- `utd` excludes the DC's own current invocationID: that entry is implicit, the DC's USN.
- `knows[partner]`: the partner invocationID the HWM was taken against.
- `image`: the copy of qm-dc01's state the backup or snapshot holds.
- `ou`: the OU subtree's current change on this DC: exists or deleted, version, the block that made it (`by`, 0 = the
  initial one) and that block's invocationID and day (the conflict tie-breaks, rule 6).
- `last`: this step's event (`backup`, `snapshot`, `write`, `pull`, `restore`, `revert`, `auth`), with what a pull
  sent and why.

## Start (step 0)

Day 0, both DCs in step. qm-dc01: USN **5000**, invocationID `a1f3…`, UTD `e52b…` 8200, HWM[qm-dc02] 8200.
qm-dc02: USN **8200**, invocationID `e52b…`, UTD `a1f3…` 5000, HWM[qm-dc01] 5000, knows qm-dc01 as `a1f3…`. The OU
exists on both, version 1. The numbers are the task's (5000) or made up (8200, the invocationIDs, 99 objects).

## Timeline (7 steps, every mode)

1. **Backup** (`nonauth`, `auth`: system-state backup) or **snapshot** (`revert`: VM snapshot) of qm-dc01, day 0.
2. qm-dc01 makes `writesAfter` changes (days 1–3); the **last 100 delete `OU=Brackenridge`** and its 99 objects (OU
   version 2).
3. qm-dc02 pulls from qm-dc01.
4. Day 3: `nonauth`/`auth`: **non-authoritative restore** of the backup in DSRM; `revert`: the VM is **reverted** to
   the snapshot (with `vmGenId`: the hypervisor's generation ID changed).
5. `auth`: **authoritative restore** of the OU (still in DSRM); otherwise qm-dc01 makes `writesAfterRevert` changes.
6. qm-dc02 pulls from qm-dc01.
7. qm-dc01 pulls from qm-dc02.

## Rules

Sources: Microsoft Learn, "How to detect and recover from a USN rollback in a Windows Server-based domain controller"
(KB 875495, read 2026-11-04); "Virtualized domain controller architecture"; "Performing an authoritative restore of
Active Directory objects"; "Performing a nonauthoritative restore of AD DS"; `win-ad-replication` SPEC rules 2–4.

1. **Write.** An originating change takes the DC's next USN under its current invocationID (one block = 100 USNs).
2. **Pull** (`win-ad-replication` rules 2–4). The destination asks for changes above its HWM for the source; the
   source sends the live blocks it holds with a local USN above it; a block is left out when it originated under the
   destination's own current invocationID (`own`, at any USN: the destination counts every change of that
   invocationID as its own) or the destination's UTD entry for its invocationID covers its USN (`utd`).
   Each applied block takes 100 new local USNs of the destination. After the pull: HWM = the source's USN; `knows` =
   the source's invocationID; the destination takes over the source's UTD (max per entry) and its entry for the source's
   invocationID = the source's USN.
3. **Watermark reset.** When the source's invocationID is not the one the destination's HWM was taken against, the
   HWM counts for nothing: the pull starts from USN 0 (KB 875495: partners "receive notification of the invocation reset
   … they adjust their high watermark values accordingly"; [MS-DRSR] `uuidInvocIdSrc` *(check: the exact mechanism)*).
   The UTD still leaves out everything the destination has.
4. **Non-authoritative restore** (supported system-state restore, in DSRM): qm-dc01 gets the backup's state (USN,
   UTD, HWM, objects) and a **new invocationID**; its UTD gets an entry for the **old** invocationID at the backup's
   USN *(check: the retired entry)*. So partners see a new source (rule 3) and it pulls back everything newer than the
   backup (its own old changes included, under the old invocationID); the OU comes back only until the deletion
   arrives again — deleted objects stay deleted.
5. **Authoritative restore** of a subtree (after rule 4, still in DSRM): every object in it gets an originating write
   whose version is raised by **100,000 per day since the backup** — here
   1 + 3 × 100,000 = **300,001** (Ntdsutil reference: without `verinc`, the age of the backup in days ×
   100,000) — so it beats the deletion (version 2) on every DC.
6. **Conflict** (OU blocks only; `win-ad-replication` rule 5): higher version wins; tie: later day; tie: higher
   invocationID. The losing block is dropped on arrival; an overwritten held block stops being live there. (The params
   never offer a losing OU change: an overwritten block is no longer sent. The test builds the case by hand.)
7. **Revert without safeguards** (`revert`, `vmGenId` off): qm-dc01 gets the snapshot's state **with the same
   invocationID**. Its next changes reuse USNs the partner has already seen under that invocationID.
8. **Detection** (KB 875495; Windows Server 2003 SP1 and later): when a destination's request carries a UTD entry for
   the source's current invocationID **greater than** the source's USN, the source logs **event 2095**, pauses
   **Netlogon** and sets **Dsa Not Writable**: it refuses inbound and outbound replication from then on, and the
   health lamp turns red. **Tie-break: equal is not detected** (5600 vs 5600). If the reverted DC has already passed
   the partner's entry, nothing is detected: the partner pulls only the changes above its HWM, the ones below it are
   never pulled (hatched), and the partner's copies of the lost changes are left out on the way back as the DC's own —
   **silent, permanent divergence with a green lamp**.
9. **VM-Generation ID** (`vmGenId` on; Windows Server 2012 and later on a hypervisor that exposes it): at boot the DC
   sees the changed generation ID and acts as after rule 4: new invocationID, retired entry, RID pool discarded.
10. **Recovery from a USN rollback**: forced demotion of the DC and metadata cleanup on a healthy DC (then promote it
    again), or a restore from a good system state backup taken before the rollback; not forcing replication (caption
    only, KB 875495).

## Params

| Key | Kind | Default | Meaning |
|---|---|---|---|
| `mode` | choice | `nonauth` | `nonauth` restore / `auth` restore / `revert` snapshot |
| `vmGenId` | toggle | off | the DC sees the VM-Generation ID (shown in `revert`) |
| `writesAfter` | range 100–1000, step 100 | 600 | changes between backup/snapshot and restore/revert (the last 100 delete the OU) |
| `writesAfterRevert` | range 0–1000, step 100 | 400 | changes after the restore/revert (hidden in `auth`) |

## Presets and expected numbers (checked by hand and by `sim.test.js`)

1. `non-authoritative` (`nonauth`, 600, 400): step 3 qm-dc02 USN **8800**, UTD a1f3 **5600**, OU deleted. Step 4
   qm-dc01 USN **5000**, invocationID **b82e…**, UTD a1f3 5000, OU exists v1. Step 5 qm-dc01 USN **5400**. Step 6:
   qm-dc02 knows a1f3 ≠ b82e → from **0**; 400 changes applied, qm-dc02 USN **9200**, UTD b82e 5400. Step 7: from 8200,
   600 a1f3 changes applied (UTD a1f3 on qm-dc01 was 5000), the b82e ones left out as its own; qm-dc01 USN **6000**,
   OU **deleted** on both. Converged.
2. `authoritative` (`auth`, 600): as 1 to step 4; step 5 the OU block at b82e **5100**, version **300,001**. Step 6:
   from 0, the OU block beats the deletion on qm-dc02 (USN **8900**). Step 7: 500 changes applied (the deletion block is
   no longer live on qm-dc02), qm-dc01 USN **5600**. OU **exists v300,001** on both. Converged.
3. `usn-rollback` (`revert`, off, 600, 400): step 4 qm-dc01 USN 5000, invocationID **a1f3…** (unchanged), OU
   exists. Step 5 USN **5400** (second row, the same USNs 5001–5400 as the first). Step 6: qm-dc02's UTD a1f3 **5600 >
   5400** → **event 2095** on qm-dc01, Netlogon paused, refused; lamp red. Step 7 refused. 400 changes only on qm-dc01,
   600 only on qm-dc02, OU differs.
4. `vm-genid` (`revert`, on, 600, 400): as 1 from step 4 (new invocationID b82e…, RID pool discarded). Converged, OU
   deleted on both.
5. `silent-rollback` (`revert`, off, 600, **1000**): step 5 qm-dc01 USN **6000**. Step 6: 5600 < 6000, no
   detection; from **5600**: 400 changes (5601–6000) applied, qm-dc02 USN 9200; the 600 at 5001–5600 hatched, never.
   Step 7: everything qm-dc02 sends originated under a1f3 = qm-dc01's own → **nothing applied**. Lamp **green**; 600
   only on qm-dc01, 600 only on qm-dc02, OU exists on qm-dc01 and is deleted on qm-dc02.

Tie-break reached by the params: `revert`, off, `writesAfterRevert` = `writesAfter` (e.g. 600/600): not detected,
nothing above the HWM, silent.

## Simplifications

- Two DCs, one direction per pull, no schedule, sites or KCC; changes in blocks of 100 (one cell).
- One object subtree (the OU and its 99 objects) stands for every object; its 100 changes travel as one block.
- The detection check uses the UTD entry the request carries; the event and Netlogon are shown, not the RID pool or
  SYSVOL.
- The partner's HWM reset is shown as "from 0"; older changes it would then be offered are all covered by its UTD
  and are not drawn.
- Out of scope (task): the Recycle Bin, the snapshot's own backing chain, DFSR SYSVOL restore, forest recovery.
