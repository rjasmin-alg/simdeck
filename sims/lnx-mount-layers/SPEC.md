<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-mount-layers: specification

One concept: **disk → partition → filesystem → mount; a mount hides what was there.** Task:
`docs/tasks/w2/lnx-mount-layers.md`. Sources: UL = `~/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md`;
diagrams `cetiri-sloja-do-staze.svg`, `tocka-montiranja-zaklanja.svg` (UL `assets/diagrams/chapter-11/`).

## State

`{ scene, fsType, disk: { name, sizeMiB, table: null|'gpt' }, parts: [{ name, sizeMiB, label, partuuid, fs: null|{ type,
uuid, sizeKiB, usedKiB, availKiB, rootKiB, files: [{ name, kib, dir? }] } }], rootFs: { dev, type, sizeKiB, usedKiB,
availKiB, dirs: { '/mnt/vjezba': [{ name, kib }] } }, mounts: [{ target, source }], cmd, out, err, event }`.
Sizes are KiB (the task's `sizeMiB`/`usedMiB`, kept exact so `df -h` rounding can be computed). `mounts` is in mount
order. `event` is `{ op, changed, hid, shown, from, to, … }` for the page.

## One step

One command from the preset's script: check every precondition → change the state, or set `err`/`out` and change
nothing → recompute where each path leads → `df` is computed from the state when asked. `event.changed` lists what
the command altered: `table`, `part:<p>`, `fs:<p>`, `mount:<p>`, `dir:<d>`, `used:root`, `used:<p>`, `path:<d>`
(the path now leads elsewhere); a failed command changes nothing and lists nothing.

## Rules

1. **Three steps, four layers.** A partition exists only after a table (`parted … mklabel gpt mkpart …`; without a
   table `Error: /dev/vdb: unrecognised disk label`); a filesystem only after `mkfs` on that partition; a path leads to
   it only after `mount`. (UL "Uvod", "Blokovni uređaji…", `cetiri-sloja-do-staze.svg`.)
2. **df reports less than the partition.** On the 1023M partition: ext4 `989M 24K 922M 1%`, XFS `959M 51M 909M 6%`
   (UL "Montiranje…", `df -hT`). Modelled as ext4 size 989 MiB, used 24 KiB, avail 922 MiB (5 % reserve is in neither);
   XFS size 959 MiB, used 51712 KiB (50.5 MiB), avail = size − used.
3. **mount needs an existing directory.** `mount: /mnt/druga: mount point does not exist.` and the `dmesg(1)` line;
   nothing changes (UL "Montiranje…"). Checks run in a fixed order, first failure wins: no such partition
   (`special device … does not exist`) → no directory → no filesystem (`wrong fs type, bad option, bad superblock …`)
   → the same device already on top of that target (`already mounted on`). Messages other than the first: util-linux
   wording from memory *(check)*.
4. **After mount the path leads to the mounted filesystem's root;** the directory's previous contents become
   invisible but are not deleted (mount(8) as quoted in UL "Montiranje…").
5. **Hidden files keep their space.** `df` for `/` still counts them; `du -s` over the path counts only what the path
   leads to (UL "Šire o temi", `tocka-montiranja-zaklanja.svg`). `du` of a fresh ext4 root is `20K` (root 4K +
   `lost+found` 16K) *(check)*; of a fresh XFS root `0` (small directories are inline) *(check)*.
6. **Writing into an unmounted mount point writes to root** (the filesystem below), and while something is mounted, to
   that filesystem (UL "Šire o temi"). A write larger than `avail` fails with ENOSPC.
7. **umount restores the view:** the hidden files are reachable again, unchanged (follows from 4; UL shows
   `umount /mnt/vjezba`). `umount` of a target with nothing mounted: `umount: /mnt/vjezba: not mounted.`
8. **Stacked mounts** *(check, mount(8))*: a second mount on the same target hides the first; the path reaches the most
   recent; `umount` removes the top one. Tie-break: "most recent" is the last entry in `mounts` with that target.
   `lsblk` lists the hidden one still mounted; `df` with no arguments leaves an over-mounted entry out *(check)*.
9. **Labels belong to layers:** PARTUUID and PARTLABEL to the partition, UUID to the filesystem; the UUID is what goes
   in `/etc/fstab` (UL `cetiri-sloja-do-staze.svg` caption). Tags only.

## Numbers

- **`df -h` rounding:** powers of 1024, one decimal under 10, always rounded **up**; Use% = used / (used + avail),
  rounded up. Checked on GNU df 9.4 here: 959786032 K → `916G` (915.33), 267002364 K → `255G` (254.63).
- **Columns:** GNU df minimum widths source 14, type 4, size/used/avail 5, Use% 4; reproduces the book's lines
  character for character.
- **Root `/dev/vda4`** (XFS): size 19712819 KiB (18.8 GiB, lsblk's `18.8G`), used 1541407 KiB (1.47 GiB), avail
  17 GiB → `19G 1.5G 17G 8%`, the book's line (UL "Šire o temi"). Rounding up forces used ≤ 1.478 GiB and avail ≤
  17 GiB for this line; the rest (≈ 0.33 GiB) is in neither column, as a reserve. With `stara.txt`: 10M → `1.5G … 9%`,
  100M → `1.6G … 9%`, 500M → `2.0G 17G 11%`.
- **lsblk** lines as UL: `vdb 252:16 2G disk`, `vdb1 252:17 1023M part`, `vdb2 252:18 1023M part`.
- **UUIDs:** ext4 on vdb1 `77b8714b-1cf6-4d6b-bce3-57d9763fb1e6`, XFS on vdb2 `2611f264-8657-4a15-9a35-df3939c304a2`,
  PARTUUIDs `44505477-…`, `674556e9-…`, PARTLABELs `vjezba`, `druga` (UL `blkid`). XFS on vdb1 and ext4 on vdb2 (only
  with `fsType: xfs` or in tests) get made-up UUIDs.
- **mkfs output** shortened to three lines each (UL's ext4 and XFS outputs, the lines about blocks, UUID, journal/log).

## Params

`fileMiB` 10–500 step 10, default 100 (the file copied into the empty mount point; in `stack` it is already there);
`xray` default off (the page draws hidden files greyed under the lid, "skriveno"; view only); `fsType` `ext4`/`xfs`,
default `ext4`, `resets` — the type of vdb1's filesystem in `hide` and `layers` (vdb2 is always XFS, as in UL; in
`nopoint` and `stack` vdb1 stays ext4, the contrast those presets show); hidden `scene` set by the presets.

## Presets (step counts 8, 7, 4, 6)

1. `hide`: vdb1 has ext4, `/mnt/vjezba` empty. `ls` (empty) → `sudo cp ~/stara.txt /mnt/vjezba/` (root +100M) →
   `sudo mount /dev/vdb1 /mnt/vjezba` → `ls` (`lost+found`) → `df -h /` (`1.6G`) → `sudo du -sh /mnt/vjezba` (`20K`) →
   `sudo umount /mnt/vjezba` → `ls` (`stara.txt`).
2. `layers`: empty vdb. `lsblk /dev/vdb` → `sudo parted -s /dev/vdb mklabel gpt mkpart vjezba ext4 1MiB 1GiB` →
   `sudo mkfs.ext4 /dev/vdb1` → `df -h` (no vdb1 row) → `sudo mkdir -p /mnt/vjezba` → `sudo mount …` → `df -h`
   (`989M 24K 922M 1%`).
3. `nopoint`: vdb1 on `/mnt/vjezba`, vdb2 XFS. `sudo mount /dev/vdb2 /mnt/druga` (error, no change) →
   `sudo mkdir -p /mnt/druga` → `sudo mount …` → `df -hT /mnt/vjezba /mnt/druga` (`959M`, `51M`).
4. `stack` (derived, unchecked): `hide` after its mount (stara.txt under vdb1). `sudo mount /dev/vdb2 /mnt/vjezba` →
   `ls` (vdb2: empty) → `umount` → `ls` (`lost+found`) → `umount` → `ls` (`stara.txt`).

`df -h` with no arguments lists only the root filesystem and vdb's: the real list also has tmpfs, `/boot` and
`/boot/efi` (NOTES.md, deviation).
