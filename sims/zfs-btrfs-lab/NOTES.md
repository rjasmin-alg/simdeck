<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# zfs-btrfs-lab: notes

Adopted from `single-page-labs/zfs-btrfs-topology-lab.html` (task `docs/tasks/w1/zfs-btrfs-lab.md`, catalogue
`spl-zfs-btrfs-lab`). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`** (catalogue: "import as `expl`"), on the pattern of `sims/stratis-lab` and `sims/lvm-topology`.
  The original was a free-form sandbox (add disks, build vdevs one by one, create datasets, toggle disks, snapshot,
  clone, destroy). In the kit an explorer draws `initial(params)`, so both stacks are now a function of the params:
  the data vdev type, its width and count, disk size, a mixed-in 2-disk mirror, the four allocation classes, an
  encrypted dataset, a snapshot, the number of failed disks and whether they are spread over the vdevs; for Btrfs the
  device count and size, both profiles, failed devices and a snapshot. A `mode` param (ZFS / Btrfs / Compare)
  replaces the original's mode tabs.
- **Naming ZFS and Btrfs** is allowed: NLA T22 (Btrfs) and T23 (ZFS) teach them as topics (COMMON.md §1), and the
  `zpool`/`zfs`/`mkfs.btrfs`/`btrfs` commands are the subject of those topics, so they stay. The device-source
  drop-down (SATA/SAS, NVMe, iSCSI, FC, NVMe/TCP, LUKS, MD RAID) was dropped: how a block device arrives is the
  Stratis lab's concept, not this one (one concept per sim). Data disks are SCSI names, special/log/cache NVMe.
- **Model kept** from the original: `zVdevCapacity` (mirror = smallest disk, RAIDZ/dRAID = (n − parity) × smallest,
  tolerance n − 1 / parity / 0, log/cache/spare no capacity), `zPoolStats` (FAULTED as soon as one top-level data
  vdev is, else DEGRADED, only data vdevs count), the minimum widths (RAIDZ parity + 2, dRAID 6), `profileMinDevices`,
  `bProfileEfficiency`, `bProfileTolerates` (dup survives no lost device), `bStats` (unavailable > degraded > the
  RAID5/6 warning > online, tolerance = the weaker profile), the record placement (round-robin over the data vdevs,
  parity rotating one disk per record), the chunk placement (`bChunkBlocks`, every fourth chunk metadata), the
  preset names and numbers, the snapshot sizes (8 % of a dataset, 5 % of a subvolume) and the command order.
- **Presets** (nine keys): five of the original's six ZFS presets (mirror, RAIDZ2, special + SLOG, dRAID, bad mix),
  three of its six Btrfs presets (RAID1, data single / metadata RAID1, RAID5 warning) and the comparison. Dropped as
  presets but reachable by params: "Native encryption" (the *Encrypted dataset* toggle; the original's pool was
  `secure`, here the dataset `research` joins the current pool), "Single disk laptop" (1 device, single/dup),
  "RAID10 chunks" and "RAID1C3 metadata" (the profile drop-downs). No `sim.json` `entries` yet.
- **Placement is a grid, one column per disk**, instead of the original's list of blocks per record: it shows at
  once that records rotate over the vdevs and which disk each piece is on. Six rows instead of twelve, for space.
  Each row gets a state: ZFS records take their vdev's state; a Btrfs chunk is lost when more of its devices failed
  than its profile survives (derived from `bProfileTolerates`, so a lost chunk always means an unavailable
  filesystem). D/C/P letters, hatching for parity and a dashed ✕ for failed carry the meaning in grayscale.
- **Failures** are a count instead of per-disk buttons: ZFS fails data disks vdev by vdev (or, with *Spread
  failures*, the first disk of every vdev first), Btrfs the first devices first. Failures hit only data vdevs, as in
  the original's health model.
- **ZFS states** (ONLINE, DEGRADED, FAULTED) are shown as data, untranslated: they are what `zpool status` prints.
  The Btrfs states are the original's own words, translated.
- **Disk names**: SCSI letters run sdb … sdz, sdaa (the original wrapped to sdb after sdz, and numbered NVMe by the
  global disk index, e.g. `nvme6n1`); NVMe counts from nvme0n1.
- Data disks are capped at 24 (vdev count limited by width), so the placement grid fits at 1920×1080.

## Deviations from the original (and why)

- Sandbox actions dropped (add/delete disks, per-disk online/offline, destroy dataset, clone, Btrfs device
  add/remove, balance convert, scrub, Export state, the event log): an explorer has no action history; the URL keeps
  the state. Balance and scrub are named in the explanation.
- Datasets, quotas and compression are fixed per layout (the original's preset datasets), not editable; Btrfs
  subvolume sizes were random in the original's manual form and are fixed here.
- A hot spare is shown but does not take over a failed disk (the original did not model it either; the explanation
  says it waits to replace a disk). *(check)* whether a lecturer wants automatic spare replacement and resilver.
- A failed special vdev is not modelled (failures hit data vdevs only); the explanation says losing it loses the pool.
- `mount /dev/sdb /mnt` and `btrfs device stats /mnt` were added to the Btrfs commands, `zpool status` to the ZFS
  ones; the original's `# simulate … failing` comment is a translated note. Compression mount-option notes dropped.
- Topology, commands and placement are shown at once (the original's four tabs and the separate capacity table are
  gone); the capacity numbers are the counters and node captions.
- Fonts: the original asked for Inter or the system sans (no network loads existed); now the kit's fonts.

## Sources

- The original page (model, presets, commands, mode texts, failure lessons).
- NLA syllabus `~/projects/napredna-linux-administracija/meta/toc.md` T22, T23 (Btrfs, ZFS as topics; "podvolumeni").
- `kit/glossary.js` for *file system*, *block device*, *mirroring*, *parity*, *hot spare*.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| vdev (virtual device) | vdev (virtualni uređaj) |
| pool (storage) | bazen (the glossary's *pool* is the DHCP sense) |
| dataset | skup podataka |
| snapshot | snimka |
| subvolume | podvolumen (NLA T22) |
| chunk | komad |
| profile (Btrfs) | profil |
| metadata | metapodaci |
| record (ZFS) | zapis |
| allocation class | klasa dodjele |
| copy-on-write | kopiranje pri pisanju |

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown** (as in amdahl, lvm-topology, stratis-lab): worked around in page CSS.
- **Glossary:** the term pairs above with `"src": "simdeck"`; *pool* needs a storage sense.
- **Tags:** the page uses `filesystems` (the task's tag). `raid` and `snapshots` exist in `tags.json` and fit; the
  coordinator may add them.
- **Gate:** the panel-fit check opens only the default params; this page's controls change per mode and with
  failures. Measured by hand: every preset, and the extremes, fit the panel in hr and en.

## Checks not done here

- Real projector and a lecturer with a clicker (an explorer: `R` and 1–9 work).
- Extremes: four data vdevs with every allocation class on make the layers and the commands scroll inside their
  columns; every preset fits without it.
- The explanation, opened, scrolls inside the panel (the gate checks it closed).
- Freezing the original in `single-page-labs` is outside simdeck (coordinator).

## Time

Start 2026-10-02 09:01, done 09:16 (one session).
