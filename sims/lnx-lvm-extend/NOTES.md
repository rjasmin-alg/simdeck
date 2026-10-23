<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-lvm-extend: notes

New stepper (task `docs/tasks/w2/lnx-lvm-extend.md`, catalogue `lnx-lvm-extend` §4.4), drawn on kit view **K3: block
grid** (`kit/blockgrid.js`, kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scripts, not free-form commands.** Each preset is a fixed script, one command per step, so the step count is fixed
  and the kit's replay holds (as `lnx-cow-filesystem`). The script is a hidden `scene` select set by the presets. A
  preset that starts mid-story (`book`, `forgot-fs`, `will-it-fit`, `ext4-r`) runs its setup commands silently through
  the same model before step 0, so its start numbers are the model's, not typed in.
- **The terminal on top** shows the step's command after the book's prompt (`[student@demosrv1 ~]$`), the real tool's
  output (shortened, below) and the exit status as a chip. It keeps the height of the scene's longest output, so the
  stage does not jump.
- **One grid, disks side by side.** Rows top to bottom: filesystem, logical volume, volume group, then a row per disk.
  /dev/vdb takes the left columns and /dev/vdc the right ones, so each layer is drawn over the extents it holds and
  the LV visibly crosses the disk boundary (the book's `lvm-slojevi-i-naredbe.svg`). A column is 128 MiB (256 MiB when
  the disks hold more than 6 GiB, so 2 + 8 GiB stays at 40 columns), i.e. 32 extents at 4 MiB: 511 cells per disk
  would not fit a projector row. A cell is filled when its layer holds at least half of the column; the exact counts
  are in the span labels (`262144 × 4 KiB`, `vdb: 511 LE`, `vdc: 120 LE`, `1022 PE`) and in each row's aside.
- **Next to each layer** (aside): the commands that change it (`mijenja:`) and what its read-only command prints now
  (`čita: lvs LSize 2.46g (631 LE)`), in the tool's own column names. These are the "counters every read-only
  command would print", recomputed every step.
- **Highlights.** A layer is "changed" when its read-only line differs from the step before (so `lvextend` lights the
  LV, the VG and the PVs it took from, and not the filesystem: rule 6 is visible without a word); "refused" (a red
  double frame and ✕) when it was asked and did not change (failed `lvextend`, and `df` while the filesystem is smaller
  than its LV); "asked" (a dashed ink outline) for the layer a read-only command reads. Changed cells keep their disk
  colour under the kit's ink outline with a thinner halo (page CSS), so a new extent still shows which disk it is on.
- **Cell kinds.** Extents of `arhiva`: `fill` in the disk's colour (vdb c1, vdc c2) in the PV, VG and LV rows; free
  extents: plain; filesystem blocks: `fill` c3; `ghost` (dashed) for space a layer does not use: a disk that is not a
  PV yet, and the part of the LV the filesystem does not know about (the visual of rule 6).
- **`growMiB` is live** (no reset): it is the `lvextend -L +…` request of `book` and `ext4-r`. `forgot-fs` and
  `will-it-fit` start from the book's +1500M (a large request would make forgot-fs's setup fail and its story false),
  `will-it-fit` asks for the book's +1G and +2G, and `build` has no lvextend; the slider is hidden there. Every caption
  is worded from the step's outcome, so +100M (lvextend succeeds at step 1) and +6000M (fails at step 4 too) read true.
- **`will-it-fit` step 3** goes back to the scene's start ("back to where the first example stopped") and runs `vgs`;
  it is the task's "reset". The highlight marks the layers that changed back.
- **Shortened tool output** (marked `…` where lines were left out): `mkfs.xfs` and `xfs_growfs` show the `meta-data`,
  `data` and `log` lines; `mkfs.ext4` two of its lines; `lvs` only the LV, VG, Attr and LSize columns (the rest are empty
  here); `lvextend -r` drops the "File system ext4 found…" line and resize2fs's banner; `pvcreate` drops "Creating
  devices file…". Every number shown is the model's.
- **Croatian terms.** The explanation uses `[[Logical Volume Manager]]`, `[[physical volume]]`, `[[volume group]]`,
  `[[logical volume]]`, `[[extent]]` (first mentions). Labels, legend and captions use the book's Croatian words
  (fizički volumen, grupa volumena, logički volumen) and *extent* in italics, inflected as the book does (*extenta*,
  *extenata*; the page's `rich()` sets `*…*` as `<em lang="en">`). The glossary's Croatian for extent is "ekstent"
  (ossimulator), which would render "*extent* (ekstent)"; the book and the task's term list write only *extent*, so
  the explanation writes `<em lang="en">extent</em>` without the glossary marker. Legend and control labels are plain
  strings, so "extent" there is not in italics.
- **Names:** XFS, ext4 and the LVM commands are the subject of UL ch12 (the commands being taught); no other product.

## Deviations from the task

- **Preset order** book, ext4-r, forgot-fs, will-it-fit, build (task: book, build, forgot-fs, will-it-fit, ext4-r).
  The gate's slider check presses `2` and then clicks the first range slider; a preset that hides the slider crashed
  the check on a null bounding box. Only `book` and `ext4-r` show the slider, so `ext4-r` (the book's run with `-r`)
  is second. See Shared requests.
- **Task caption** "*lvextend* je narastao logički volumen…": "narasti" is intransitive, so the caption says "lvextend
  je povećao logički volumen na 631 *extent*, ali df i dalje kaže 960M: datotečni sustav zna samo za blokove koje mu je
  upisao mkfs.xfs." English as in the task. Commands are set as data (monospace), not italics.
- **`disk2GiB`** is read as the size of the second disk, /dev/vdc; /dev/vdb stays the book's 2 GiB.
- **forgot-fs** steps are `vgs`, `lvs`, `df -hT`, `xfs_growfs` (the task fixes only "lvs 2.46g, df 960M, last step
  xfs_growfs"): the layers read bottom up. **will-it-fit** steps: `pvs`, `lvextend -L +1G`, back + `vgs`,
  `lvextend -L +2G`.
- **Legend:** "free PE (hollow)" is the kit's plain free cell; "pattern per disk" is colour plus place (the disks sit
  in their own columns and rows, and the LV spans name the disk), since K3's `soft` pattern means shared.
- **ext4 numbers** are not in the task or the book: measured on an image file (SPEC.md rule 8) *(check)*.

## Sources

- UL ch12 "LVM: fizički volumeni, grupe i logički volumeni" (Što treba znati, Šire o temi) and Primjer 1: every
  command, output line and number of the `book`, `build` and `will-it-fit` presets.
- UL ch12 diagram `lvm-slojevi-i-naredbe.svg`: the layer stack and the command beside each layer.
- UL ch11 "Datotečni sustavi: ext4 i XFS" → Šire o temi: XFS grows only; resize2fs.
- Man pages lvcreate(8), lvextend(8) (`-r`), lvm(8) allocation, resize2fs(8), xfs_growfs(8): through the book's
  footnotes; not re-read here *(check)*: the rounding message, lvcreate's insufficient-space wording, xfs_growfs's
  unmounted, shrink and unchanged messages, the shortened `-r` output.
- `single-page-labs/lvm-topology-lab-v2.html` (adopted as `lvm-topology`): its linear allocator idea only (free PEs in
  PV order); no code copied.
- XFS df "Used" for sizes other than the book's two is a line through those two points *(check)*.
- ext4 overhead, reserved and used blocks: `mkfs.ext4` (1.47.0) on a 1 GiB image file, `dumpe2fs -h`, offline
  `resize2fs` to 2524 MiB; the model's formula reproduces both (12949 and 19246 overhead blocks).

## Term pairs

None missing: physical volume, volume group, logical volume, Logical Volume Manager and extent are in
`kit/glossary.js`. Open question for the glossary owner: extent's hr is "ekstent" (ossimulator), while UL ch12 writes
*extent* (the task's term list too).

## Shared requests

- **check-page.mjs, slider click:** after pressing `2` it clicks the first `input[type=range]` in the controls without
  checking it is visible; when the second preset hides its slider (`visible()`), `boundingBox()` is null and the whole
  browser check crashes. Smallest change: pick the first *visible* slider (`:visible`), or skip when the box is null.
  Worked around here by the preset order.
- **kit.js `h()`:** `dataset: { x: null }` writes `data-x="null"` (it is `Object.assign`), so `[data-x]` selectors match.
  Smallest change: skip null and false values in `dataset` as for attributes. Worked around with a local `ds()`.
- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (already filed by `lnx-overlayfs-layers`);
  worked around in the page the same way.
- **K3 changed cell:** `.sd-bg-cell.sd-changed` replaces a `fill` cell's colour with the highlight and its 0.45 rem halo
  covers the span numbers under the row. A variant that keeps the series colour (outline and halo only), with the span
  band above the halo, would help every grid whose colour carries the owner. Done in page CSS here.

## Checks

- Numbers before the page: a node script printed every preset's command, output, `vgs`/`lvs`/`df` and block counts
  per step (defaults and peMiB 8/32, disk2GiB 8, growMiB 100/6000); the defaults match the book line for line
  (`Insufficient free space: 375 extents needed, but only 255 available`; `3.99g 2.99g`; `1.00 GiB (256 extents) to
  2.46 GiB (631 extents)`; `960M 51M 910M 6%`; `data blocks changed from 262144 to 646144`; `2.5G 80M 2.4G 4%`;
  `/dev/vdb … 0`, `/dev/vdc … <1.53g`; the `df` and `pvs` tables to the column).
- `node --test sims/lnx-lvm-extend/sim.test.js`: 28 tests. Mutations (each broken once in `sim.js`): no 1 MiB offset,
  round down, partial allocation, exit 1 instead of 5, pvcreate joining the VG, highest PE first, last PV first, VG
  order sorted, lvextend growing the filesystem, growing an unmounted XFS, the log counted in df, XFS shrinking, df
  rounding to nearest, no `<` in LVM sizes, no refused df, restore ignored: all caught; and the reviewer's survivors
  (below) after the review tests were added.
- Fit: a Playwright sweep over every step of every preset × hr/en × six param sets (384 states) at 1920×1080: no
  overflow of the stage, the grid box, the caption or the page; the tightest (hr, ext4-r, peMiB 32) has 30 px to spare.
  No console errors.
- `npm run gate -- lnx-lvm-extend`: pass (62/62 browser checks). Screenshots looked at: the gate's 1920×1080 light,
  dark, grayscale, panel hidden, help and 375×812 in both languages, and scripted states book 1, 2, 3, 4, 5, 6, 8;
  build 0, 2, 3, 4, 6; forgot-fs 3, 4; will-it-fit 1–4; ext4-r 4, 5; en book 0, 3, 4, 5; peMiB 32, disk2GiB 8,
  growMiB 100.

## Review

A fresh reviewer read the sim against the task, `SPEC.md` and the book, ran every caption and render over 5 scenes × 4
PE sizes × 3 disk sizes × 2 filesystems × 7 growMiB values (nothing threw, no `undefined`/`NaN`), and mutated a copy of
the model. Every book number matched. Fixed from the review:

- forgot-fs with growMiB ≥ 3100: its silent setup lvextend failed, so "lvextend reported success" was false and the
  preset lost its point. Its setup now uses the book's +1500M and the slider is hidden there.
- will-it-fit step 3 (back to the start, then `vgs`) marked three layers "changed by this step": now compared with the
  restored start, so nothing is changed and the VG shows as read.
- hr explanation: the glossary terms expanded into an English object and sentence-initial lower case; reworded
  ("Prvi je *physical volume* (fizički volumen): disk koji je LVM, …"), and *extent* written without the glossary.
- `lvs` Attr is `-wi-ao----` while mounted (it was always `-wi-a-----`).
- The lvextend order sentence took its order from the disks, not the VG: `split()` now follows VG order.
- hr "Prostora nije nigdje više" → "Nigdje nije dodan prostor"; "{need}, uzetih" (wrong with 2–4) → "{need}, s …".
- Surviving mutants now tested: ceil → round, `#LV` always 1, "asked" empty, agsize, the 6 GiB column threshold, the
  filesystem's signature (mkfs highlight), forgot-fs/will-it-fit setup sizes, the restore highlight, the split order.

## Time

Start 2026-10-23 17:35 CEST, done 18:10 CEST.
