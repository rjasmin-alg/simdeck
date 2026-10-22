<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-mount-layers: notes

New stepper (task `docs/tasks/w2/lnx-mount-layers.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The task names no kit view; the page draws the scene itself in HTML (no SVG).

## Decisions

- **Scene:** left, the four layers of `cetiri-sloja-do-staze.svg` as rows (mount point, filesystem, partition, block
  device) with the three steps between them, one column per partition and the device row under both; a missing layer
  is a dashed box ("nema datotečnog sustava", "nije montiran"). Right, the root filesystem as a tray holding one box
  per mount-point directory, and each mounted filesystem as a lid over its directory, the newest on top
  (`tocka-montiranja-zaklanja.svg`). What a path leads to has a thick outline and a badge "`/mnt/vjezba` vodi ovdje";
  the badge is highlighted in the step its target changed. Below, `df -h` as it reads now (a changed cell highlighted,
  a new row marked) and `ls <dir>` per mount-point directory. Above, the command and what it printed; the strip keeps
  the height of the preset's longest output so the scene does not jump.
- **Covered is always hatched**, whether or not anything is under the lid, so `xray` off gives nothing away; `xray`
  on writes the hidden names greyed with "skriveno". Colour is never alone: layers carry their word in the left column,
  covered boxes are dashed and hatched, the path's target has an outline and a badge.
- **Layer colours:** mount point c1, partition c2, filesystem c3, device c4; the root tray c8.
- **Sizes in KiB**, not the task's `sizeMiB`/`usedMiB`, so `df -h` rounding is computed exactly (SPEC.md "Numbers").
  `df -h` rounds **up**, checked on this machine's GNU df 9.4. Under that rule the book's root line `19G 1.5G 17G 8%`
  needs used ≤ 1.478 GiB and avail ≤ 17 GiB, so root is size 18.8 GiB, used 1.47 GiB, avail 17 GiB, and about
  0.33 GiB counts in neither column. Consequence: a 10M `stara.txt` leaves Used at `1.5G` (only Use% moves to 9%);
  from about 20M Used shows `1.6G`. The trays and the caption carry the exact size.
- **`layers` step 2 is one command:** `parted -s /dev/vdb mklabel gpt mkpart vjezba ext4 1MiB 1GiB` (parted runs
  them in order). It keeps the task's 7 steps and still writes the table before the partition (rule 1); `mkpart`
  without a table fails with the book's `unrecognised disk label` (tested, not in a preset).
- **`fsType` is vdb1's type in `hide` and `layers`.** vdb2 is always XFS, as in the book. With `xfs`, `mkfs.xfs`
  prints three lines of the book's output, `df` shows `959M 51M 909M 6%`, `ls` after the mount is empty (no
  `lost+found`) and `du` is `0`. In `nopoint` and `stack` vdb1 stays ext4 and the switch is disabled with a reason:
  there the point is the contrast with XFS on vdb2 (rule 2's two `df -hT` lines; three layers that `ls` tells apart).
- **`stack`** starts where `hide` is after its mount (`stara.txt` of `fileMiB` under vdb1), so the three layers on
  `/mnt/vjezba` read differently: root `stara.txt`, vdb1 `lost+found`, vdb2 empty (fresh XFS).
- **`nopoint`** starts with vdb1 already on `/mnt/vjezba` so the last step prints the book's two `df -hT` lines.
- **`fileMiB`** is disabled with a reason in `layers` and `nopoint` (no such file there). When the copy does not move
  `df -h`'s Used (10M), the caption says so and points at Use%.
- **Commands use `sudo`** where the book does (parted, mkfs, mkdir, mount, umount) and for `cp` into the root-owned
  directory and `du` (reading `lost+found` needs it). The prompt `[student@demosrv1 ~]$` is the book's.
- **Captions** follow the task's text for the hiding mount; every other caption says what the command did to the layers
  or the path, and the start captions say where each preset begins.

## Deviations from the task

- **`df -h` with no arguments** (`layers` steps 4 and 7) prints only the root filesystem and vdb's. The real listing
  also has tmpfs, `/boot` and `/boot/efi`; leaving them out keeps the one concept. The live `df -h` table under the
  scene does the same.
- **mkfs output is shortened** to three lines each (ext4: blocks, UUID, journal; XFS: meta-data, data, log).
- **State shape:** sizes in KiB (above); `event` also carries `changed`, `hid`, `shown`, `from`, `to` for the page.
- **Title (hr):** "Od blokovnog uređaja do točke montiranja"; concept (hr) uses arrows to stay under 80 characters.

## Sources

- UL ch11: "Uvod" (three steps), "Blokovni uređaji i particije" (`lsblk`, `parted mklabel`/`mkpart`, the lsblk lines),
  "Datotečni sustavi: ext4 i XFS" (mkfs outputs, UUIDs), "Montiranje, `/etc/fstab` i UUID" (mount, `df -h` and
  `df -hT` lines, the hiding rule quoted from mount(8), `mount point does not exist`, `blkid` labels, `umount`) and its
  "Šire o temi" (`df -h /mnt/vjezba /` with `19G 1.5G 17G 8%`, df vs du, writing into an unmounted mount point).
  Diagrams `cetiri-sloja-do-staze.svg`, `tocka-montiranja-zaklanja.svg`. Read in full for this task.
- GNU df `-h` rounding up and column widths: checked against df 9.4 on this machine.
- Stacked mounts (the newest wins, umount removes the top one): mount(8), from memory *(check)*.
- df leaving out an over-mounted entry: GNU df's mount-list filtering, from memory *(check)*.
- `du` of a fresh ext4 root `20K` (root 4K, `lost+found` 16K) and of a fresh XFS root `0` *(check)*.
- util-linux messages other than the book's (`special device … does not exist`, `wrong fs type, bad option, bad
  superblock …`, `already mounted on`, `not mounted.`), the mke2fs messages for a missing or mounted device, and the cp
  ENOSPC line: from memory *(check)*. None of them appears in a preset except `not mounted` in no preset either.
- Made up: the UUIDs of XFS on vdb1 (`3c9e5a17-…`) and of ext4 on vdb2 (`b51f0c7e-…`), used only with `fsType: xfs` or
  in tests.

## Concepts, not tools

No product is named. Commands appear because they are the subject (`lsblk`, `parted`, `mkfs.ext4`/`mkfs.xfs`,
`mkdir -p`, `mount`, `umount`, `cp`, `ls`, `df`, `du`), all from the task or the book. The operating system is
named only as Linux device paths, which the concept depends on.

## Term pairs

From the glossary: *block device*, *partition*, *partition table*, *file system*, *mounting*, *mount point*. Missing
from `kit/glossary.js`, written out in both tables:

- *root filesystem* — **korijenski datotečni sustav** (UL ch11).

`[[path]]` is avoided: the glossary has "putanja" (ossimulator), the book "staza".

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (as in `lnx-links-inodes`); worked
  around in the page CSS.

## Checks

- `node --test sims/lnx-mount-layers/sim.test.js`: tie-breaks first (the newest mount wins, mount's check order, ls and
  df order, rounding up), one or more per rule, the presets' numbers, then the template's generic block.
- **Mutations:** 20 one-at-a-time mutations of `sim.js` (one per rule and per tie-break, plus mkdir -p, ENOSPC,
  busy, ls order, the stack start). 18 failed a test at once. "Round to nearest" survived until a test for 1.42G was
  added. "A failed command lists its changes" survived because the guard was redundant, so the guard was removed.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; checked every number
  against the book; read every caption in both languages with ext4, XFS and xray; ran 56 mutations of its own, 11
  survived). Fixed from it: the type in captions as "ext4"/"XFS" and "a filesystem of type …" (not "a xfs"); captions
  that said a path leads to a device now say "the root of the filesystem on …"; `fsType` fixed to ext4 in `nopoint` and
  `stack` (above); the 10M caption; "stara.txt je opet ovdje" after the last `ls` of `hide`; Croatian term placement
  (glosses in the nominative, no nested parentheses); en "filesystem" throughout; `du` captions say "ukupno"/"in all".
  Tests added for the survivors (avail after a write, the ENOSPC boundary, Use% as used/(used+avail), no `lost+found`
  on XFS, the `mount:` mark, `cp` into a missing directory, `df` of an unmounted mount point, `hiddenAt`, parted on an
  existing partition, mkfs over a used filesystem). Left: `kib >= 1024` vs `>` in `human` is an equivalent mutant (the
  rollover gives `1.0M` either way). Not changed: `lsblk` joins several mount points with a comma where the real tool
  prints one per line; no preset reaches it.
- `npm run gate -- lnx-mount-layers`: pass (manifest, tests, build, 64 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus each preset at its key step.

## Time

2026-10-22 17:49 to 18:10 (reading, design; stopped by the usage limit), then 18:11 to 18:31 (model, tests, page,
gate, a 6-minute fresh review, fixes): about 40 minutes of work.
