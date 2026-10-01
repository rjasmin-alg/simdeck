# kit-block-grid: kit view K3: block grid

| | |
|---|---|
| Task | `kit-block-grid` (wave 2a) |
| Owner | coordinator (kit owner) |
| Size | M |
| Depends on | pilot `dedup-chunking` merged |
| Licence | AGPL-3.0-or-later |

## Goal

Extract the **block grid** from the pilot sim `sims/dedup-chunking/` into the kit, so the 25 sims that need it
draw it the same way: rows of cells for blocks, chunks or extents, with state shown by colour **and** pattern (`.sd-hatch`), references between cells (chains, pointers), shared vs owned blocks, a counter of space used.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

`backing-chains`, `backup-diff-incr`, `backup-window`, `ceph-down-out`, `ceph-min-size`, `cow-vs-row`, `crush-failure-domain`, `dedup-file-funnel`, `ec-vs-replication`, `lnx-cow-filesystem`, `lnx-lvm-extend`, `lnx-lvm-snapshot`, `lnx-mirror-not-backup`, `lnx-overlayfs-layers`, `lnx-raid-rebuild`, `lnx-send-receive`, `lnx-thin-overcommit`, `multiple-access`, `retention-gfs`, `ssd-internals`, `win-hyperv-checkpoints`, `win-ipam-address-plan`, `win-ntfs-mft`, `win-storage-spaces`, `win-vss`

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
