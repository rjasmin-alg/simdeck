<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-lvm-extend: spec

One concept: **PV → VG → LV → filesystem, in that order.** Task `docs/tasks/w2/lnx-lvm-extend.md`, catalogue
`lnx-lvm-extend` (§4.4). Stepper on kit view K3 (block grid). Main source: UL ch12 "LVM: fizički volumeni, grupe i
logički volumeni" (the worked sequence) and "Primjer 1 — račun koji zatvara grupu volumena".

## Model

```
peMiB                                   extent size (vgcreate -s; default 4)
disks: [{ name, sizeMiB, pv, vg, pes }] /dev/vdb 2048 MiB, /dev/vdc disk2GiB × 1024; pes: one entry per PE once the
                                        disk is in the VG, each null (free) or 'arhiva'
vg:    null | { name: 'podaci', pvs: [disk] }      pvs in the order they joined
lv:    null | { name: 'arhiva', les: [{ disk, pe }] }   logical extent i sits on that PE
fs:    null | { type, blocks, usedMiB, mounted, agsize }  blocks of 4 KiB; agsize = mkfs blocks / 4
cmd, out, exit, event, info, op         the step's command, the tool's output lines, exit status, what happened
changed, refused, asked                 layer ids ('fs', 'lv', 'vg', 'pv:<disk>') for the highlight
```

## One step

One command from the preset's script: validate (rules 3, 7, 9) → apply it to its own layer only → recompute what
every read-only command (`pvs`, `vgs`, `lvs`, `df -hT`) would print → set `out` (the real tool's text) and `exit`.
A layer is **changed** when its read-only line (and, for the filesystem, its block count and mount state) differs
from the step before; **refused** when it was asked and did not change (a failed `lvextend`/`lvcreate`, a failed
grow, or `df` while the filesystem is smaller than its LV); **asked** when a read-only command reads it.

## Rules

1. **Extents.** Default extent 4 MiB (`vgcreate`). Usable PEs on a PV = floor((device MiB − 1) / PE MiB): the first
   PE starts 1 MiB in and a partial last extent does not count. 2048 MiB → **511** PEs (not 512), `<2.00g`.
   Source: ch12 Primjer 1; pvcreate(8) `default_data_alignment` (via the book). The PEs are counted when the disk
   joins a VG (an orphan PV shows its device size, `2.00g` *(check)*).
2. **Sizes in MiB become extents, rounded up:** 1500M = 375, 1G = 256 (at 4 MiB). Not a multiple → rounded up, with
   `Rounding size to boundary between physical extents: <1.47 GiB.` (1500M at 8 MiB = 188 extents = 1504 MiB).
   Source: ch12; lvcreate(8) *(check: the exact rounding message for a relative size)*.
3. **Only the LV's own VG's free PEs.** If needed > free, nothing changes, exit status **5**:
   `Insufficient free space: 375 extents needed, but only 255 available` (lvextend, ch12);
   `Volume group "podaci" has insufficient free space (511 extents): 750 required.` (lvcreate *(check)*). A PV that
   is not in the VG does not count.
4. **`pvcreate` adds no space anywhere:** the disk is a PV, in no VG; `vgs` is unchanged. **`vgextend`** adds its PEs
   to the VG's free count and leaves the LV alone (`#LV` stays 1): `#PV 2`, `VSize 3.99g`, `VFree 2.99g`. Source:
   ch12. `vgcreate`/`vgextend` initialise a device that is not a PV yet (ch12 Šire o temi); no preset relies on it.
5. **Allocation order (tie-break):** free PEs of the first PV in VG order (the order the PVs joined), lowest PE
   number first, then the next PV. Gives the book's split: **255 from /dev/vdb, 120 from /dev/vdc**; LE 511 sits on
   vdc PE 0. Source: ch12 Primjer 1; lvm(8) allocation policy `normal` *(check: the general rule)*.
6. **Growing the LV does not grow the filesystem:** after `lvextend` (256 → 631 extents, 1.00 GiB → 2.46 GiB) `df`
   still says `960M`, to the digit. Source: ch12.
7. **`xfs_growfs` needs the filesystem mounted** and grows it to fill the LV: **262144 → 646144** blocks
   (= 631 × 4 MiB = 2524 MiB); `df -hT` then `2.5G 80M 2.4G 4%`. Unmounted: `xfs_growfs: /mnt/arhiva is not a mounted
   XFS filesystem`, exit 1 *(check wording)*; nothing to grow: `data size unchanged, skipping` *(check)*. The
   filesystem stays mounted through every step (files reachable). Source: ch12; xfs_growfs(8) (via the book).
   `df` numbers: Size = data blocks − the internal log (16384 blocks, 64 MiB), so 1024 MiB → 960M; Used is a line
   through the book's two points, 30.7 + MiB × 29 / 1500 (1024 → 50.5 → `51M`, 2524 → 79.5 → `80M`), Avail = Size −
   Used; `df -h` rounds up (2.402 GiB → `2.5G`), Use% = ⌈Used / (Used + Avail)⌉. *Derived; other sizes (other PE sizes,
   growMiB) are extrapolated (check).*
8. **ext4:** `resize2fs` grows a mounted ext4 online; `lvextend -r` runs the filesystem grow after the LV's in the same
   command. Source: ch12 Šire o temi; resize2fs(8), lvextend(8) (via the book) *(check: the `-r` output, shortened
   here)*. `df` numbers measured on a 1 GiB image file with mke2fs 1.47 and an offline resize2fs to 646144 blocks:
   overhead = 514 blocks per group of 32768 + 129 per backup group (0, 1, powers of 3, 5, 7) + an 8192-block journal;
   6 blocks used; 5 % reserved (13107 of 262144, scaled). 1 GiB → `974M 24K 923M 1%`; 646144 blocks →
   `2.4G 24K 2.3G 1%` *(check against a mounted ext4)*.
9. **No shrinking:** XFS only grows (`xfs_growfs` to fewer blocks fails, exit 1: ch11 "Datotečni sustavi…" Šire o
   temi); no preset step makes an LV or a filesystem smaller, and the page offers no shrink.

## Stage

One block-grid column = 128 MiB of disk (256 MiB when the disks hold more than 6 GiB), i.e. 32 extents at 4 MiB. The
disks sit side by side (vdb columns 0–15, vdc 16–31 by default), so every layer is drawn over the extents it holds.
A cell is filled when its layer holds at least half the extents in the column; the exact counts are the span labels
(`262144 × 4 KiB`, `vdb: 511 LE`, `1022 PE`) and the asides (the read-only command's line).

## Params

`scene` (hidden; the presets set it) · `peMiB` 4/8/16/32, default 4, resets · `disk2GiB` 2/4/8 (the size of
/dev/vdc), default 2, resets · `fsType` xfs/ext4, default xfs, resets · `growMiB` 100–6000 step 100, default 1500, the
`lvextend -L +…` request, live at the current step (shown for `book` and `ext4-r`; `forgot-fs` and `will-it-fit` start
from the book's +1500M and `will-it-fit` asks for fixed +1G and +2G).

## Presets and expected numbers (defaults)

Setup commands run silently before step 0. Checked with a node script over the model (NOTES.md, Checks).

| # | preset | steps | the steps and their numbers |
|---|---|---|---|
| 1 | `book` | **8** | start: vdb PV in `podaci`, `arhiva` 1G (256 LE), XFS mounted, `df` 960M → `lvextend -L +1500M` fails (375 > 255, exit 5) → `pvcreate /dev/vdc` (VG unchanged) → `vgextend` (`#PV 2`, `3.99g`, `2.99g`, 766 free) → `lvextend` (256 → 631, 2.46 GiB; 255 + 120) → `df` 960M (refused) → `xfs_growfs` 262144 → 646144 → `df` 2.5G 80M 2.4G 4% → `pvs` vdb `0`, vdc `<1.53g` |
| 2 | `forgot-fs` | **4** | start = book after step 4 → `vgs` (`<1.53g`) → `lvs` (2.46g) → `df` 960M (asks which layer df measures) → `xfs_growfs` |
| 3 | `build` | **6** | `pvcreate /dev/vdb` → `vgcreate podaci /dev/vdb` (511, `<2.00g`, all free) → `lvcreate -n arhiva -L 1G` (`PFree 1020.00m`) → `mkfs.xfs` (blocks=262144) → `mount` → `df -hT` 960M 51M 910M 6% |
| 4 | `will-it-fit` | **4** | start = end of book (391 free = 1564 MiB on vdc) → `pvs` → `lvextend -L +1G` (256 ≤ 391: 631 → 887) → back to the start, `vgs` (391) → `lvextend -L +2G` fails (512 > 391): a third disk is needed |
| 5 | `ext4-r` | **5** | book with ext4: `lvextend` fails → `pvcreate` → `vgextend` → `lvextend -r -L +1500M` (LV 256 → 631 and fs 262144 → 646144 in one step) → `df` 2.4G 24K 2.3G 1% |

Defaults = preset 1: `sim.json` `steps` 8. Preset order on the page: book, ext4-r, forgot-fs, will-it-fit, build
(NOTES.md, Deviations). `lvs` shows Attr `-wi-ao----` while the filesystem is mounted (open), `-wi-a-----` before
(the book's listing is from before the mount); "changed" for the LV compares its size and extents, not that flag.
