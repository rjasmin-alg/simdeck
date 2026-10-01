# lnx-lvm-extend: Extending an LV and its filesystem

| | |
|---|---|
| Task | `lnx-lvm-extend` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-lvm-extend` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-lvm-extend/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `lvm` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **PV → VG → LV → filesystem, in that order**.

The student: add a disk, extend each layer.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` (Uvod u Linux): "LVM: fizički volumeni, grupe i logički volumeni" → "Što treba znati" (the whole worked sequence: `pvcreate`, `vgcreate`, `lvcreate`, failed and successful `lvextend`, `xfs_growfs`) and "Primjeri" → "Primjer 1 — račun koji zatvara grupu volumena" (4 MiB extents, 511 PEs per 2 GiB disk, 255/120 split, 646144 blocks)
- Diagram: `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-12/lvm-slojevi-i-naredbe.svg` (layers and the command for each)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` "Datotečni sustavi: ext4 i XFS" → "Šire o temi" (`resize2fs` vs `xfs_growfs`, XFS does not shrink)
- Man pages lvcreate(8), lvextend(8) (`-r`, rounding to extents), lvm(8) allocation policy, resize2fs(8), xfs_growfs(8) (check)
- Existing model: `/home/rjasmin/projects/single-page-labs/lvm-topology-lab-v2.html` (`allocateLinear`, `resizeLV`, PE grid per disk; no filesystem layer)
- Catalogue seed: UL ch12; stepper companion to spl-lvm-lab

## Model and presets

- **Scene:** the layer stack from `lvm-slojevi-i-naredbe.svg`, bottom to top: physical volumes (one block-grid
  row of physical extents per disk) → volume group (a total and a free counter) → logical volume (its logical
  extents, coloured by the PV they sit on) → filesystem (an XFS bar sized in 4 KiB blocks, mounted on
  `/mnt/arhiva`). Next to each layer, the command that changes it and the read-only command that shows it
  (`pvs`, `vgs`, `lvs`, `df -hT`). Uses kit view K3 block grid once it exists. A command line and its output
  above the stage.
- **State:** `{ peMiB, disks: [{ name, sizeMiB, pv: bool, vg: null|name, pes: [lvName|null] }], vg: null|{ name,
  pvs: [disk] }, lv: null|{ name, les: [{ disk, pe }] }, fs: null|{ type, blocks, usedMiB, mounted }, cmd, out,
  exit, event }`.
- **One step:** one command from the preset's script: validate (rules 3, 9) → apply to its own layer only →
  recompute the counters every read-only command would print → set `out` (the real tool's line) and `exit`.
- **Rules:**
  1. Extent size 4 MiB (`vgcreate` default); usable PEs on a PV = floor((device MiB − 1) / PE MiB), because the
     first PE starts 1 MiB in and a partial last extent is not counted: 2048 MiB → 511 PEs, `<2.00g`
     (ch12 Primjer 1).
  2. Sizes given in MiB are converted to extents: 1500M = 375, 1G = 256. A size that is not a multiple is
     rounded up to whole extents (check, lvcreate(8)).
  3. `lvcreate`/`lvextend` take extents only from free PEs of the LV's own VG. If needed > free, nothing changes:
     `Insufficient free space: 375 extents needed, but only 255 available`, exit status 5 (ch12 "LVM…").
  4. `pvcreate` makes a disk a PV but adds no space anywhere; `vgextend` adds its PEs to the VG's free count and
     leaves the LV untouched (`#LV` stays 1) (ch12 "LVM…").
  5. Allocation order (tie-break): free PEs of the first PV in VG order, lowest PE number first, then the next
     PV. Gives the book's split: 255 from `/dev/vdb`, 120 from `/dev/vdc` (ch12 Primjer 1; general rule (check),
     lvm(8) allocation policy `normal`).
  6. Growing the LV does not grow the filesystem: after `lvextend`, `df` still says `960M` to the digit
     (ch12 "LVM…").
  7. `xfs_growfs` needs the filesystem mounted and grows it to fill the LV: data blocks 262144 → 646144
     (4 KiB each = 2524 MiB); `df -hT` then `2.5G 80M 2.4G 4%` (ch12 "LVM…", Primjer 1). Files stay reachable
     throughout.
  8. ext4 variant: `resize2fs` grows a mounted ext4 (online grow) (check, resize2fs(8)); `lvextend -r` runs the
     filesystem resize for you (check, lvextend(8)).
  9. Shrinking is refused for XFS (`xfs_growfs` only grows; ch11 "Datotečni sustavi…" Šire o temi); the page
     offers no LV shrink.
- **Params:** `peMiB` choice 4/8/16/32, default 4, `resets: true`; `disk2GiB` choice 2/4/8, default 2, `resets:
  true`; `fsType` choice `xfs`/`ext4`, default `xfs`, `resets: true`; `growMiB` range 100–6000 step 100, default
  1500 (the `lvextend -L +…` request, recomputed live at the current step).
- **Presets:**
  1. `book` (from ch12 "LVM…" and Primjer 1): start = vdb PV in VG `podaci`, LV `arhiva` 1G (256 LE), XFS mounted,
     `df` 960M → `lvextend -L +1500M` fails (375 needed, 255 free) → `pvcreate /dev/vdc` → `vgextend` (`#PV 2`,
     `VSize 3.99g`, `VFree 2.99g`) → `lvextend` succeeds (256 → 631 extents, 2.46 GiB) → `df` still 960M →
     `xfs_growfs` (262144 → 646144) → `df` 2.5G → `pvs` (vdb free 0, vdc `<1.53g`). 8 steps.
  2. `build` (from ch12 "LVM…"): `pvcreate /dev/vdb` → `vgcreate podaci` (`<2.00g`, free all) → `lvcreate -n arhiva
     -L 1G` (`PFree 1020.00m`) → `mkfs.xfs` (blocks=262144) → `mount` → `df -hT` `960M 51M 910M 6%`. 6 steps.
  3. `forgot-fs` (from ch12 "LVM…"): book preset stopped after `lvextend`; `lvs` says 2.46g, `df` says 960M; the
     caption asks which layer `df` measures; last step runs `xfs_growfs`. 4 steps.
  4. `will-it-fit` (from ch12 Primjer 1, "Odluka…"): after preset 1, vdc has 1564 MiB = 391 free PEs →
     `lvextend -L +1G` (256) succeeds; reset → `-L +2G` (512 > 391) fails; a third disk is needed. 4 steps.
  5. `ext4-r` (derived, unchecked): same as `book` with ext4 and `lvextend -r -L +1500M` in one step. 5 steps.
- **Steps:** 8, 6, 4, 4, 5.
- **Legend:** free PE (hollow), PE of `arhiva` (filled, pattern per disk), filesystem blocks (bar); "changed"
  highlight marks the layer whose numbers the last command changed, and a red frame on a layer that was asked
  but did not change (rule 3, rule 6).
- **Captions:** hr: "*lvextend* je narastao logički volumen na 631 *extent*, ali `df` i dalje kaže 960M:
  datotečni sustav zna samo za blokove koje mu je upisao `mkfs.xfs`." en: "`lvextend` grew the logical volume to
  631 extents, but `df` still says 960M: the filesystem only knows the blocks `mkfs.xfs` gave it."
- **Terms:** physical volume — fizički volumen; volume group — grupa volumena; logical volume — logički volumen;
  extent — *extent*; Logical Volume Manager — upravljanje logičkim volumenima; filesystem — datotečni sustav;
  free space — slobodan prostor.
- **Misconceptions:** `lvextend` makes more room for files; adding a disk to the machine (or `pvcreate`) grows
  the VG; an extension needs the filesystem unmounted.
- **Out of scope:** striping, RAID LVs, thin pools and snapshots (`lnx-thin-overcommit`, `lnx-lvm-snapshot`),
  `pvmove`/`vgreduce`, shrinking, LUKS layers. The free-form topology belongs to `spl-lvm-lab`
  (`lvm-topology-lab-v2.html`), which models PEs, linear/striped/RAID allocation and the command log but has no
  filesystem layer; reuse its linear allocator idea (`allocateLinear`: free PEs of the VG in PV order), not its code.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-lvm-extend sims/lnx-lvm-extend` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-lvm-extend/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
