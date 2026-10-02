<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# stratis-lab: notes

Adopted from `single-page-labs/stratis-topology-lab.html` (task `docs/tasks/w1/stratis-lab.md`, catalogue
`spl-stratis-lab`). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`** (catalogue: "import as `expl`"), on the pattern of `sims/lvm-topology` (same source family).
  The original was a free-form sandbox (present a device, create a pool, extend, create a filesystem, fail paths,
  snapshot, delete, one action at a time). In the kit an explorer draws `initial(params)`, so the whole stack is now
  a function of the params: device kind, number and size of data devices, paths per LUN, multipath, failed paths,
  pool encryption, cache tier size, the filesystem's logical size and data written, overprovisioning, a snapshot and
  the data rewritten after it. One pool, one filesystem.
- **Naming Stratis** is allowed: NLA T21 is "Stratis — što rješava i kako se odnosi prema LVM-u i XFS-u", so the
  product is the topic (COMMON.md §1). iSCSI, FC, NVMe/TCP, LUKS2, XFS, device-mapper and multipath are the
  mechanisms being taught. The transport *tools* (`iscsiadm`, `nvme connect`, the sysfs rescan, `multipath -ll`) and
  `wipefs` were dropped from the commands: the commands are `stratis …` and `mount`, the subject of the topic, and
  the transport set-up is a translated `#` note ("log in to the target, 2 paths → /dev/mapper/mpatha").
  Clevis and Tang are named only in the explanation and in the `stratis pool create --clevis tang` command line;
  the controls say "network key server" / "TPM2 chip".
- **Model kept** from the original: `kindInfo` (nine kinds; local, network and layered), `deviceOnline` (local always,
  network while one path is up), the eligibility rule (several paths without multipath = "duplicate path risk", not
  a pool member), `poolUsed` = 1 GiB metadata + data (capped at the pool), the overprovisioning check before the
  physical check in `createFS`, data written capped at the logical size, logical commitments that do not count
  snapshots, the eight presets with their numbers and names, the GiB/TiB format, and the layer order
  (source → network/fabric → kernel block devices → multipath → encryption → pool → inside the pool → filesystems →
  mount points).
- **Presets**: the original's eight (keys 1–8) plus `nompath` (key 9: one iSCSI LUN over two paths without
  multipath, so the pool is not created). That was a manual step in the original (untick "Aggregate paths") and is
  its main warning. No `sim.json` `entries` yet.
- **Failures are shown, not alerted:** a pool that cannot be created is a dashed "✕ not created" node with its
  `stratis pool create` struck through and "# fails" next to it, and the caption gives the reason. The same goes
  for a filesystem refused by overprovisioning or by physical space.
- **Colour follows the device:** each data device keeps its series colour (`--c1`…`--c4`) from source to multipath,
  so a LUN can be followed through the layers. The cache device is `--c5`, pool `--c6`, filesystems `--c7`, mounts
  `--c8`. Failed or not created = dashed red border plus "✕" in the text, so it survives grayscale.
- **One screen:** layers left, capacity bars and commands right, the original's five counters on top. The tabs are
  gone; all views are visible at once. The panel is wider (`--panel-w: 31rem`), with presets in three columns and
  controls in two, so 13 controls and 9 presets fit without the panel scrolling (every preset checked in hr and en).

## Deviations from the original (and why)

- **Sandbox actions dropped** (delete device/pool/filesystem, extend the data tier as a separate step, toggling
  multipath on a device, ±10 GiB buttons, several pools, "Export state", the event log): an explorer has no action
  history. The URL keeps any state (kit URL state), which replaces the export. "Extend data tier" is the device
  count; "Init cache" is the cache tier slider.
- **One kind for all data devices** (plus "mixed", which cycles SSD, iSCSI, FC, NVMe/TCP). The original mixed
  preset had different sizes per device (400/1000/2000 GiB); here all data devices have one size, so `mixed` is
  3 × 1000 GiB, 2 paths each, and `encrypted` is two iSCSI LUNs of 800 GiB (the original: one iSCSI 1000 GiB and
  one local SSD 500 GiB). The other presets keep the original's numbers (tested).
- **Network labels** ("storage-net / VLAN 220", "bond0.220 …") dropped: free text in a translated page; the path
  nodes say session/NIC, HBA/fabric or controller path.
- **One kernel block device per path.** The original showed one `/dev/sdX` per LUN whatever its path count; here each
  path is its own block device (that is why multipath exists), joined into `/dev/mapper/mpathX`. For NVMe/TCP
  with multipath the paths are hidden controller paths `nvmeXcYn1` of one namespace `nvmeXn1` (NVMe native
  multipath), without it one namespace device per controller; the original used DM Multipath for NVMe/TCP too.
  *(check)* that a lecturer wants NVMe native multipath shown rather than DM Multipath.
- **Failed paths** are a slider on the first network device (its last paths fail first) instead of a button per path.
  A pool exists even with all paths of a member down; it is then "✕ lost a member" and the filesystem "unavailable"
  (the original's "PATH FAILURE" state after failing paths of a pool member).
- **Snapshot model changed.** The original gave a new snapshot 10 % of the origin's data as its own use, then
  grew the origin by 80 GiB. Here a snapshot shares every block when taken, and only data rewritten in the origin
  afterwards is kept for the snapshot alone (new physical use), limited to the origin's data and the pool's free
  space. The snapshot preset shows 220 GiB written, 80 rewritten: 140 shared, 80 owned, 301 GiB used.
- **`stratis filesystem create --size <logical>GiB`** instead of the original's comment "optional teaching size
  limit". *(check)* the option name against the installed stratis-cli (it exists from stratis-cli 3.0, from memory).
- **Showing internals and mounts** is always on (the original's two toggles), for panel space.
- **Fonts:** the original asked for Inter or the system sans (nothing loaded from the network); now the kit's
  Atkinson Hyperlegible and the system monospace. No network loads existed.
- The "Core teaching idea" notice, the connectivity callouts (iSCSI, FC, NVMe/TCP, multipath, NFS/SMB) and the hint
  under the device form moved into the explanation.

## Sources

- The original page (model, presets, commands, connectivity lesson).
- NLA syllabus `~/projects/napredna-linux-administracija/meta/toc.md` T21 (Stratis as a topic; "tanko dodjeljivanje").
- UL book (`~/projects/uvod-u-linux`) via `kit/glossary.js` for *block device*, *file system*, *mount point*.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| pool (storage) | bazen (the glossary's *pool* is "skup adresa", the DHCP sense) |
| thin provisioning | tanko dodjeljivanje (NLA syllabus T20) |
| snapshot | snimka (`tags.json` uses "snimke stanja"; the glossary has only *snapshot file*) |
| multipath | višestruke putanje |
| cache tier | priručna razina |
| overprovisioning | prekomjerno obećavanje |
| data tier | podatkovna razina |

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown** (same as sims/amdahl and sims/lvm-topology): worked around in this
  page's CSS.
- **Glossary:** add the term pairs above with `"src": "simdeck"`; *pool* needs a second, storage sense.
- **Tags:** no tag for block/network storage (`iscsi`, `san`, `multipath`); the page uses `filesystems` and
  `snapshots`. A `san` or `block-storage` tag would suit this sim and `lnx-multipath`, `sto-nas-vs-san`.
- **Gate:** the panel-fit check opens only the default params; a page whose controls appear per preset can still
  overflow on another preset. This page was measured by hand for every preset.

## Checks not done here

- Real projector and a lecturer with a clicker (an explorer: `R` and 1–9 work).
- Extremes: four network LUNs with four paths each make the layers scroll inside their column; a network kind with
  the snapshot on makes the panel scroll by about 30 px in Croatian. Every preset fits without either.
- The explanation, opened, scrolls inside the panel at 1920×1080 (the gate checks the panel closed).
- Freezing the original (playbook §10.7 step 5) is outside simdeck: a note in `single-page-labs` is the
  coordinator's.

## Time

Start 2026-10-02 08:42, done 09:00 (about 20 minutes, one session).
