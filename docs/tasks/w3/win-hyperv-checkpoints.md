# win-hyperv-checkpoints: Hyper-V checkpoints

| | |
|---|---|
| Task | `win-hyperv-checkpoints` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-hyperv-checkpoints` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/backing-chains/`** (no page of its own) |
| Folder | `sims/backing-chains/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `virtualization` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `backing-chains` merged; only one preset task per host folder at a time; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **AVHDX chain, merge on delete**.

The student: take checkpoints, delete the middle one.

This is a **preset on `backing-chains`** (Backing chains (qcow2, VHDX, VMware delta)), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/backing-chains/` (the host page) and its `NOTES.md`.

## Sources

- No local course material (the books do not cover Hyper-V). Use the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.2 (sto-backing-chains preset)
- `docs/tasks/w2/backing-chains.md` (host model: rules 1–9, presets `commit-middle`, `broken-link`, `hyperv-checkpoints`).
- Microsoft Learn, *Hyper-V: Using checkpoints to revert virtual machines to a previous state*; *Choose between standard or production checkpoints in Hyper-V*; *Enable or disable checkpoints in Hyper-V* (check titles).

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Kind:** preset(s) on `backing-chains` (`docs/tasks/w2/backing-chains.md`), format `vhdx`. The host spec
  already lists a `hyperv-checkpoints` preset (its preset 5); this task builds it with concrete values and adds
  the Hyper-V-only cases below. Host scene, block grid (8 blocks, base `A B C D`), legend and rules 1–9 apply.
- **Hyper-V vocabulary on the host's labels:** base `Disk.vhdx`; each checkpoint makes the current disk read-only
  and the VM writes to a new `Disk_<guid>.avhdx` (shortened on screen to `_1`, `_2`); "Delete checkpoint" =
  host rule 4 commit into the parent, done automatically by Hyper-V (Microsoft Learn, *Using checkpoints to revert
  virtual machines to a previous state* (check title)).
- **Rules specific to Hyper-V** (in addition to the host's):
  1. A checkpoint is the state *before* the AVHDX that follows it: the AVHDX holds changes made after the
     checkpoint (derived from host rule 3).
  2. Deleting a checkpoint merges its differencing disk so that the VM's current view does not change
     (host rule 4 invariant); the merge may run while the VM is running (check).
  3. "Apply" (revert) to a checkpoint: Hyper-V creates a new AVHDX whose parent is that checkpoint's disk; the
     current state is discarded unless "Take Checkpoint and Apply" is chosen (check).
  4. Deleting an `.avhdx` by hand in Explorer is not a checkpoint delete: it is host rule 8, the VM fails to start
     (Microsoft Learn, *Hyper-V checkpoints* guidance: do not delete .avhdx files directly (check)).
  5. Production checkpoints (default since Windows Server 2016 (check)) use VSS inside the guest and hold no memory
     state; standard checkpoints also save memory. This changes no block in the model: a caption-level note.
- **Presets:**
  - `hv-delete-middle` (the host's preset 5): checkpoint C1, write `1=B1`, `4=E1`; checkpoint C2, write `1=B2`,
    `2=C2`; delete checkpoint C2, whose disk is the middle `_1.avhdx` → `_1` is merged and removed. The model
    merges into the parent (host rule 4): base `A B1 C D E1`, view `A B2 C2 D E1 0 0 0` unchanged. Whether
    Hyper-V merges into parent or child is (check); the view is the same either way. Derived from host
    `commit-middle`, checked by hand.
  - `hv-apply` from `hv-delete-middle`'s chain before the delete: apply C1 → new AVHDX on `Disk.vhdx`, view
    `A B C D 0 0 0 0`; the B2/C2 state is discarded (no "take and apply"). Derived, unchecked.
  - `hv-take-and-apply` same, with "Take Checkpoint and Apply": the old state survives as checkpoint C3 on a
    second branch. Derived, unchecked.
  - `hv-avhdx-deleted` the middle `.avhdx` deleted in Explorer: VM start fails, blocks 1 and 4 unreachable.
    From host `broken-link`.
- **Steps:** `hv-delete-middle` 7 (as the host), `hv-apply` 6, `hv-take-and-apply` 7, `hv-avhdx-deleted` 4.
- **Captions:** hr: "Brisanje kontrolne točke ne briše podatke: AVHDX se spaja u roditelja, a ono što VM vidi ostaje
  isto." / en: "Deleting a checkpoint does not delete data: the AVHDX merges into its parent and what the VM sees
  stays the same." — hr: "Primjena točke C1: novi AVHDX nad Disk.vhdx; trenutno stanje je odbačeno." / en:
  "Applying C1: a new AVHDX on Disk.vhdx; the current state is discarded."
- **Terms:** checkpoint — kontrolna točka (host); differencing disk — diferencijalni disk *(check)*; merge —
  spajanje (host); apply (revert) — primjena / vraćanje na točku *(check)*; production checkpoint — produkcijska
  kontrolna točka *(check)*; parent disk — roditeljski disk *(check)*.
- **Misconceptions:** a checkpoint is a backup; deleting a checkpoint loses the changes made after it; an
  orphaned `.avhdx` can simply be deleted to save space.
- **Host must support:** `vhdx` labels (has them); the existing commit-middle op; **new**: an `apply` op (new
  overlay on a chosen read-only layer, old active layer dropped or kept as a branch) and branches (one layer with
  two children). Host rule 7 refuses commit into a layer with two children; Hyper-V's behaviour there is
  (check).
- **Note for the coordinator:** the host already owns the basic Hyper-V preset; this task adds only apply/branch
  cases, which need the host's `apply` op and branching. File the request in `sims/backing-chains/NOTES.md`.
- **Out of scope:** checkpoint memory files (`.vmrs`), export/import, Hyper-V Replica.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backing-chains/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
