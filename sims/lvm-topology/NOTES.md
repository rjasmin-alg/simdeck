<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lvm-topology: notes

Adopted from `single-page-labs/lvm-topology-lab-v2.html` (task `docs/tasks/w1/lvm-topology.md`, catalogue `spl-lvm-lab`;
v2 is canonical, v1 `lvm-topology-lab.html` is not adopted). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`** (catalogue: "import as `expl`"; playbook §10.4 names this page as an example). The original
  was a free-form sandbox (add disk, pvcreate, vgcreate, lvcreate, resize, delete, one action at a time). In the kit
  an explorer draws `initial(params)`, so the whole configuration is now a function of the params: layout, LUKS
  placement, number of disks, disk size, LV size, stripes/copies/members, a second LV (LUKS above) and the thin LVs'
  virtual size. Every disk is a PV in one VG.
- **Model kept** from the original: the four allocators (linear: free PEs in disk order; striped: LE k on lane
  k mod n, row ⌊k/n⌋, on the first n PVs with free space; RAID1: n whole copies on the first n PVs that each hold the
  LV; RAID5: n − 1 data and one parity extent per row, parity on member r mod n), RAID5 needs ≥ 3 members, a thin
  pool is a linear allocation and thin LVs take no PEs, the eight presets with their numbers and names (vg_demo/data,
  vg_span/archive, vg_fast/scratch, vg_safe/important, vg_raid/media, vg_secret/private, vg_host/public+secret,
  vg_cloud/thinpool+vm01+vm02), the command translation and the four counters.
- **Presets** are the original's eight teaching presets, keys 1–8 (`basic`, `span`, `striped`, `raid1`, `raid5`,
  `luks-below`, `luks-above`, `thin`). No `sim.json` `entries` yet; any of them can become one.
- **Failed allocations are shown, not alerted:** the LV is "not allocated" in the layers, its `lvcreate` is struck
  through with "# fails", the caption gives the original's reason (not enough free extents, too few PVs, …) and the
  map stays as it was (the original's rollback).
- **One screen:** PE map left (square size computed from the stage; the card columns chosen for the largest squares),
  layers top right, commands bottom right, counters on top. The original's tabs are gone; all views are visible.
- LV colours: first LV `--c1` solid, second LV `--c2` hatched (grayscale), parity a tint with a dashed ink border and
  "P", free PEs dashed and empty, thin LVs (no PEs) dashed in `--c5`.

## Deviations from the original (and why)

- **Sandbox actions dropped** (add/delete disk, pvremove, vgreduce, vgremove, lvremove, extend/shrink buttons,
  several VGs, "Export state"): an explorer has no action history. Growing and shrinking is the LV size slider; the
  URL keeps any state (kit URL state), which replaces the export.
- **Striped and RAID5 sizes round up to whole rows** instead of the original's "size must be divisible by …" error,
  and the caption says so ("Size rounded up: 10 → 12 LE"). A slider would hit the error on most values; `lvcreate`
  itself rounds a striped size up to the stripe boundary. *(check)* that it rounds RAID5 the same way.
- **RAID1 extents show their LE number** on every copy (the original labelled them M1/M2), so the same numbers on
  both disks show that each LE is stored twice; the copy is in the hover title.
- **Logical extents count what a filesystem sees:** thin LVs by virtual size, the thin pool not at all. The original
  summed the pool too (112 logical, ratio 0.29× for the thin preset); now 80 logical, 0.40×, which shows the
  overcommit.
- **PE size fixed at 4 MiB** (LVM's default; said in the explanation). The original's PE size select only changed
  the MiB figures, and the panel must fit at 1920×1080 with seven controls. The model keeps `peMiB` (tested), so it
  can come back as a control or a preset param.
- **"Show RAID member devices" is always on** for striped and RAID LVs (same reason: panel space); the "Show PE
  numbers" and "Show topology arrows" toggles dropped (numbers always shown; the layer labels carry ↓).
- **LUKS above with the thin layout** encrypts the first thin LV (vm01) only; there is no second plain LV there.
- **Commands use `-l <extents>`** for every `lvcreate` (the original's presets did; its form used `-L <MiB>M`), and
  every LV with a filesystem gets `mkfs.ext4` (the original's form did; most presets left it out).
- **Fonts:** the original asked for Inter or the system sans (nothing loaded from the network); now the kit's
  Atkinson Hyperlegible and the system monospace. No network loads existed.
- Header pills (PE size, object counts) dropped: the counters and the layers carry the same numbers.
- Lecture idea notice moved into the explanation ("Za predavanje / In the lecture").

## Sources

- The original page (model, presets, commands, concept guide, hints).
- UL book (`~/projects/uvod-u-linux`) ch. 12 for the Croatian terms: fizički volumen, grupa volumena, logički
  volumen, vrpčanje (*striping*), zrcaljenje.
- *(check)* RAID5 rounding in `lvcreate` (above). Rounding of striped LVs to the stripe boundary is from memory of
  `lvcreate`'s "Rounding size … up to stripe boundary size" message, not re-read in the man page here.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| striping | vrpčanje (UL book; the glossary has only "strip / stripe" = traka / pruga) |
| thin pool | tanki bazen |
| thin LV | tanki LV |
| physical extent | fizički ekstent |
| logical extent | logički ekstent |

**Glossary conflicts found:** *extent* = ekstent in the glossary (ossimulator), but the UL book's terminology lock
keeps *extent* in English, italic, declined (extent, extenta, extenata), and forbids translating it. *parity* =
paritet (glossary) vs parnost (UL book): already in `docs/tasks/OPEN.md`. This page follows the glossary
(`[[extent]]`, `[[parity]]`) until the owner decides.

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown** (same as sims/amdahl): worked around in this page's CSS.
- **Glossary:** add the term pairs above with `"src": "simdeck"`, and decide *extent* (see conflicts).

## Checks not done here

- Real projector and a lecturer with a clicker (an explorer: `R` and 1–8 work).
- The extremes: four disks of 48 PEs with LUKS below make the command list scroll inside its box (about 9 lines
  hidden); every preset fits without it.
- The explanation, opened, scrolls inside the panel at 1920×1080 (the gate checks the panel closed).
- Freezing the original (playbook §10.7 step 5) is outside simdeck: a note in `single-page-labs` is the
  coordinator's.

## Time

Start 2026-10-02 02:10, done 02:30 (about 20 minutes, one session).
