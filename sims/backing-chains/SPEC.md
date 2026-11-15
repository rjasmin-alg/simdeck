<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backing-chains: spec

One concept: **reads fall through the chain; commit/merge; a broken link kills children.** Task
`docs/tasks/w2/backing-chains.md`, catalogue `sto-backing-chains` (§4.6, overlap §5.2; covers `win-hyperv-checkpoints`).
Stepper on kit view K3 (block grid).

## Model

A virtual disk of 8 blocks `0..7` (one block = one cluster) as a chain of image files:

```
layers: [{ id, file, backing: id | null, blocks: { idx: label }, readOnly, missing? }]
active: id            the layer the VM writes to (top of the chain)
probe:  { block, path: id[], result: 'hit' | 'zero' | 'fail' | null, value, at } | null
broken: id[]          layers above a deleted file
format: 'qcow2' | 'vhdx' | 'vmdk'     names and verbs only
log:    []            the operations so far
```

Ids: `base`, `s1` (the overlay the first snapshot created), `s2` (the second). Files per format:

| id | qcow2 | VHDX | VMDK |
|---|---|---|---|
| base | `base.qcow2` | `disk.vhdx` | `disk.vmdk` |
| s1 | `s1.qcow2` | `disk_9c1e.avhdx` | `disk-000001.vmdk` |
| s2 | `s2.qcow2` | `disk_4b7d.avhdx` | `disk-000002.vmdk` |

(VHDX names carry a GUID; shortened to four hex digits so the label column stays narrow.)

## Rules

1. **Read falls through.** A read of block b starts at the active layer and goes down the backing links; the first
   layer with b allocated gives the content. If none has it, the block reads as zeros. Source: QEMU "QCOW2 Image
   Format" (backing file: unallocated clusters are read from the backing file; with none, zeros) *(check)*.
2. **Writes go to the active layer only.** A write allocates b in the active layer; lower layers are never changed
   by the guest. Copy-on-write is per cluster (a partial write copies the cluster up first); the model's block is one
   cluster, so every write is a whole block. Source: QCOW2 format spec *(check)*.
3. **Snapshot (external).** The active layer becomes read-only; a new empty overlay backing on it becomes active.
   It holds 0 blocks: a snapshot is not a copy. Source: `qemu-img create -b`, QEMU "Disk Images" *(check)*.
4. **Commit (merge down) of L into its backing P**, three steps: *copy* every block of L into P (overwriting),
   *re-point* L's child to P, *remove* L. Invariant: the view from the active layer is the same after each phase.
   qcow2 calls it commit; deleting a VHDX checkpoint or a VMDK snapshot merges (consolidate is the separate repair of
   leftover delta files, not shown). Source: `qemu-img commit`, QEMU "Live Block Operations"
   (block-commit) *(check)*.
5. **Stream (pull up) of L into its child C**, three steps: *copy* the blocks of L that C lacks into C, *re-point* C
   to L's backing, *remove* L. Same invariant; P is not touched. Source: QEMU "Live Block Operations" (block-stream),
   `qemu-img rebase` *(check)*.
6. **Tie-breaks.** In commit, L's block wins over P's (base block 1 `B` → `B1`). In stream, C's own block wins over
   L's (s2 keeps `B2`, s1's `B1` is not copied).
7. **Commit into a layer with another child is refused** (`commitRefused` → `'branch'`): the other child would see
   P change under it. Committing the base (no backing) is refused too (`'base'`). Derived. A real qcow2 backing file
   does not record who backs on it, so the format itself refuses nothing: the commit would silently change the other
   child. The page therefore says the commit *must not be done*, not that it is refused. No preset branches the
   chain; the rule is in the model and its tests only.
8. **Deleting a backing file without a merge breaks every layer above it** (`broken` = all descendants). A read that
   falls through to the missing file fails; the image does not open at all (`opens` false), so the VM does not start.
   Base alone still reads `A B C D`. Derived.
9. **VHDX / VMDK:** deleting a checkpoint (Hyper-V) or a snapshot (vSphere) is a merge: the differencing file written
   after it is merged into its parent, as rule 4. Deleting snapshot k = merging file k (`s1`) into its parent. Source:
   Microsoft Learn "Using checkpoints to revert virtual machines to a previous state"; VMware vSphere "Delete a
   Snapshot" / "Consolidate Snapshots" *(check titles and the file ↔ checkpoint mapping)*.

### Apply and branches (win-hyperv-checkpoints presets, task `docs/tasks/w3/win-hyperv-checkpoints.md`)

A snapshot / checkpoint k is the state of the chain below the overlay it created (`s_k`): checkpoint C1 is `base`
alone, C2 is `base` + `s1`, C3 (take and apply) is `base` + `s1` + `s2`. The overlay `s_k` holds the changes made after
checkpoint k (Hyper-V rule 1 of the task, derived from rule 3).

10. **Apply (revert) to a checkpoint** (`apply(layers, active, target, id, file)`): a new empty overlay `id` backing on
    the checkpoint's top layer `target` becomes active; the VM then sees exactly the checkpoint's state. **Tie-break:**
    the active layer is discarded only when it is writable (no checkpoint holds it); every read-only layer stays,
    because a checkpoint needs it (`s1` stays for C2). The model always applies C1 (`target` = `base`, new overlay
    `s3`). Source: Microsoft Learn "Using checkpoints to revert virtual machines to a previous state" (apply creates a
    new differencing disk; the current state is lost unless saved first) *(check)*.
11. **Take and apply** (`keepState`, then `apply`): first the active layer becomes read-only (a new checkpoint, C3,
    holds it; no overlay is added, since the apply follows at once); then rule 10 discards nothing. Source: as rule 10,
    the "Take Checkpoint and Apply" choice *(check)*.
12. **A branch:** after an apply, `target` has two children (`s1` and `s3`). Rule 7 then refuses committing `s1` into
    `base`. How Hyper-V merges when a checkpoint with two children is deleted is not modelled *(check)*.
13. **Hyper-V names** (rule 9): `Disk.vhdx` → `disk.vhdx`, each `Disk_<guid>.avhdx` shortened to four hex digits;
    deleting a checkpoint = rule 4; deleting an `.avhdx` by hand in the file manager = rule 8, the VM does not start.
    Production checkpoints (default since Windows Server 2016 *(check)*) bring the guest's disk to a consistent state
    and save no memory; standard ones also save memory. No block changes: a sentence in the explanation only.

## One step

| op | steps | what changes |
|---|---|---|
| `build` (compact) | 1 | the six build ops below at once |
| `snapshot` | 1 | rule 3 |
| `write b` | 1 | rule 2; the written cell is "changed" |
| `commit` | 3 | copy, re-point, remove (rule 4) |
| `stream` | 3 | copy, re-point, remove (rule 5) |
| `delete` | 1 | s1's file is gone, s2 broken (rule 8) |
| `keep` | 1 | rule 11: the active layer becomes read-only (C3) |
| `apply` | 1 | rule 10: the active layer is discarded (unless kept), new `s3` on `base`, active |
| `read b` | 1 per layer the probe visits (1–3) | the last one gives hit / zeros / fail |

The script comes from the params: the build (six steps, or one when `compact`), the ending applied to the middle layer
`s1`, then the reads of that ending (`READS`): none 0, 1, 4, 5; commit and stream 4, 1; delete 4; apply and keep 1, 4. The number of probe
steps of each read is counted on the chain after the ending.

## Params

`format` qcow2 / VHDX / VMDK (names and verbs only; keeps the step); `ending` none / commit / stream / delete /
apply / keep (take and apply) (resets; a select, six options); `compact` build in one step (resets); `showView` the merged view row (default on, drawing only).

## Presets and expected numbers (8 blocks; base `0..3 = A B C D`)

Build: snapshot; s1 writes `1=B1`, `4=E1`; snapshot; s2 writes `1=B2`, `2=C2`. View from s2: `A B2 C2 D E1 0 0 0`.
Allocated: base 4, s1 2, s2 2.

| preset | params | steps | end state |
|---|---|---|---|
| 1 `read-through` | defaults | 6 + 3 + 1 + 2 + 3 = **15** | read 0 → `A` (3 layers), 1 → `B2` (1), 4 → `E1` (2), 5 → zeros (3) |
| 2 `commit-middle` | commit, compact | 1 + 3 + 2 + 1 = **7** | base `A B1 C D E1` (5), s2 → base, s1 gone; view unchanged; read 4 → `E1` from base (2), 1 → `B2` (1) |
| 3 `stream-middle` | stream, compact | 1 + 3 + 1 + 1 = **6** | s2 `B2 C2 E1` (3; kept `B2`), → base; base untouched (4); read 4 → `E1` from s2 (1) |
| 4 `broken-link` | delete, compact | 1 + 1 + 2 = **4** | s1 missing (its 2 blocks lost), s2 broken, image does not open; read 4: s2 miss, s1 ✕ fail |
| 5 `vhdx-checkpoints` | vhdx, commit | 6 + 3 + 2 + 1 = **12** | as 2 with `disk.vhdx`, `disk_4b7d.avhdx` |
| 6 `vmdk-delta` | vmdk, commit | **12** | as 2 with `disk.vmdk`, `disk-000002.vmdk` |
| 7 `hv-apply` | vhdx, apply, compact | 1 + 1 + 2 + 2 = **6** | `disk_4b7d` (s2, B2 C2) discarded; `disk_e27a` (s3, 0 blocks) → `disk.vhdx`; `disk_9c1e` (s1) stays → `disk.vhdx`: base has 2 children; view `A B C D 0 0 0 0`; 6 blocks allocated; read 1 → `B` from base (2), 4 → zeros (2) |
| 8 `hv-take-and-apply` | vhdx, keep, compact | 1 + 1 + 1 + 2 + 2 = **7** | as 7, but s2 stays read-only (C3) → s1; nothing discarded; 8 blocks; view from s2 still `A B2 C2 D E1 0 0 0` |
| 9 `hv-avhdx-deleted` | vhdx, delete, compact | **4** | as 4 with `disk_9c1e.avhdx` deleted by hand: the VM does not start; blocks 1 and 4 of it lost |

The task's `hv-delete-middle` is preset 5 `vhdx-checkpoints` (deleting checkpoint C1 merges `disk_9c1e.avhdx`, the
middle file, into `disk.vhdx`: base `A B1 C D E1`, view `A B2 C2 D E1 0 0 0` unchanged); see NOTES.md for why it is
C1 and not C2. Non-compact apply / keep: 6 + 1 + 4 = 11 and 12.

Defaults = preset 1: `sim.json` `steps` 15. Every param combination stays ≤ 15 steps.

Numbers checked with a node script over the model before the page was written (`node -e` in NOTES.md, Checks).

## Deviations from the task's step counts

The task's counts for presets 2–6 ("5 (build, shown as one step) + 3 = 8 (+ 2 verifying reads = 10)", "VHDX 7")
do not add up consistently; the counts above follow the task's own rule "one step per layer the probe visits" and
"build shown as one step" for presets 2–4. Presets 5 and 6 build step by step (checkpoint, write, write, …) so the
Hyper-V and vSphere words appear on every op.
