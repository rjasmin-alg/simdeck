# lnx-mount-layers: Block device to mount point

| | |
|---|---|
| Task | `lnx-mount-layers` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-mount-layers` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-mount-layers/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `filesystems` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **disk → partition → filesystem → mount; a mount hides what was there**.

The student: mount over a non-empty directory.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (Uvod u Linux): "Blokovni uređaji i particije", "Datotečni sustavi: ext4 i XFS" (df numbers), "Montiranje, `/etc/fstab` i UUID" → "Što treba znati" (definitions *montiranje*, *točka montiranja*; `mount point does not exist`) and "Šire o temi" (writing into an unmounted mount point, `df` vs `du`)
- Diagrams: `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-11/tocka-montiranja-zaklanja.svg` (the hiding) and `cetiri-sloja-do-staze.svg` (four layers, three steps, which label belongs to which layer)
- mount(8) and umount(8) man pages (the hiding rule as quoted in ch11; stacked mounts, (check))
- Catalogue seed: UL ch11 (tocka-montiranja-zaklanja.svg)

## Model and presets

- **Scene:** left, the four-layer column from `cetiri-sloja-do-staze.svg`: block device `/dev/vdb` (2 GiB) →
  partition `/dev/vdb1` (1023M, PARTUUID) → filesystem (ext4, UUID) → mount point `/mnt/vjezba`. Right, two
  stacked trays as in `tocka-montiranja-zaklanja.svg`: the root filesystem (`/dev/vda4`) with the directory
  `/mnt/vjezba` and whatever was written into it, and above it the mounted filesystem, drawn as a lid over that
  directory. Below, a `df -h` table (one row per mounted filesystem) and the line `ls /mnt/vjezba` as it reads now.
- **State:** `{ disk: { name, sizeMiB, table: null|'gpt' }, parts: [{ name, sizeMiB, fs: null|{ type, uuid, sizeMiB,
  usedKiB, files: [{ name, sizeMiB }] } }], rootFs: { sizeMiB, usedMiB, dirs: { '/mnt/vjezba': [{ name, sizeMiB }] } },
  mounts: [{ target, source }] (stack order = mount order), cmd, out, err, event }`.
- **One step:** one command from the preset's script runs, in the order: check preconditions → change state (or
  set `err` and change nothing) → recompute what each path resolves to → recompute `df`.
- **Rules:**
  1. A partition exists only after a partition table and `mkpart`; a filesystem only after `mkfs` on it; a path
     reaches it only after `mount`. Three steps, four layers (ch11 "Uvod", `cetiri-sloja-do-staze.svg`).
  2. `df` reports less than the partition: ext4 on 1023M shows `989M` size, `24K` used, `922M` avail; XFS on
     the same size shows `959M` size and `51M` used on an empty filesystem (ch11 "Montiranje…", "Datotečni sustavi").
  3. `mount` needs an existing directory: `mount: /mnt/druga: mount point does not exist.`; the command stops
     before changing anything (ch11 "Montiranje…").
  4. After `mount`, the path leads to the root of the mounted filesystem; the directory's previous contents,
     owner and permissions become invisible but are not deleted (mount(8) quoted in ch11 "Montiranje…").
  5. Hidden files keep their space: `df` for the root filesystem still counts them; `du` over the path no longer
     sees them (ch11 "Šire o temi", `tocka-montiranja-zaklanja.svg`).
  6. Writing into a mount-point directory while nothing is mounted writes to the filesystem below (root)
     (ch11 "Šire o temi").
  7. `umount` restores the view: the hidden files are reachable again, unchanged (follows from 4; ch11 shows
     `umount /mnt/vjezba`).
  8. Edge case, stacked mounts: mounting a second filesystem on the same target hides the first; the most
     recent mount is the one the path reaches, and `umount` removes the top one (check, mount(8)).
  9. Labels belong to layers: PARTUUID/PARTLABEL to the partition, UUID to the filesystem; the UUID goes in
     `/etc/fstab` (ch11 `cetiri-sloja-do-staze.svg` caption). Shown as tags only.
- **Params:** `fileMiB` range 10–500 step 10, default 100 (size of the file written into the empty mount point);
  `xray` toggle, default off (draws the hidden files greyed under the lid, labelled "skriveno"); `fsType`
  choice `ext4`/`xfs`, default `ext4`, `resets: true` (changes the rule-2 numbers).
- **Presets:**
  1. `hide` (from ch11 "Šire o temi" + `tocka-montiranja-zaklanja.svg`): `/dev/vdb1` has ext4. `ls /mnt/vjezba`
     empty → `cp` a 100M file `stara.txt` there (root Used +100M) → `mount /dev/vdb1 /mnt/vjezba` → `ls` shows
     only `lost+found` → `df -h /` still +100M → `du -sh /mnt/vjezba` small → `umount` → `stara.txt` is back. 8 steps.
  2. `layers` (from ch11 "Blokovni uređaji…" and "Montiranje…"): `lsblk` (vdb 2G, empty) → `mkpart` vdb1 1023M →
     `mkfs.ext4` → `df` has no row for it yet → `mkdir -p /mnt/vjezba` → `mount` → `df -h` `989M 24K 922M 1%`. 7 steps.
  3. `nopoint` (from ch11 "Montiranje…"): `mount /dev/vdb2 /mnt/druga` → error, state unchanged → `mkdir -p
     /mnt/druga` → `mount` → `df -hT` XFS `959M`, `51M` used. 4 steps.
  4. `stack` (derived, unchecked): vdb1 on `/mnt/vjezba` → mount vdb2 on the same path → `ls` shows vdb2 →
     `umount /mnt/vjezba` → vdb1 visible again → `umount` → root's directory. 6 steps.
- **Steps:** 8, 7, 4, 6.
- **Legend:** layer colours with a text tag per layer (uređaj, particija, datotečni sustav, točka montiranja);
  hidden files hatched; "changed" highlight marks the layer or `df` cell the last command altered, and the path
  arrow when its target changed.
- **Captions:** hr: "*mount* (montiranje) prikačio je `/dev/vdb1` na `/mnt/vjezba`. `stara.txt` nije obrisana —
  i dalje zauzima 100M na korijenskom datotečnom sustavu, ali do nje ta staza više ne vodi." en: "`mount` attached
  `/dev/vdb1` to `/mnt/vjezba`. `stara.txt` is not deleted: it still takes 100M on the root filesystem, but this
  path no longer leads to it."
- **Terms:** block device — blokovni uređaj; partition — particija; filesystem — datotečni sustav; mounting —
  montiranje; mount point — točka montiranja; partition table — tablica particija; root filesystem — korijenski
  datotečni sustav.
- **Misconceptions:** mounting over a directory deletes or overwrites its contents; the size of the partition is
  the size `df` reports; `df` and `du` must agree.
- **Out of scope:** `/etc/fstab` options and boot-time mounting, bind mounts, mount propagation and namespaces,
  `umount` on a busy target, LVM (see `lnx-lvm-extend`), resizing (ch11 Primjer 1–2).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-mount-layers` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-mount-layers sims/lnx-mount-layers` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-mount-layers/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
