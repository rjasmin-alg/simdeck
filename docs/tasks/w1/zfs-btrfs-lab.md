# zfs-btrfs-lab: ZFS & Btrfs topology lab (en)

| | |
|---|---|
| Task | `zfs-btrfs-lab` (wave 1, single-page-labs) |
| Catalogue entry | `spl-zfs-btrfs-lab` in `docs/catalogue.md` §2.1 |
| Kind | adopt an existing simulator |
| Folder | `sims/zfs-btrfs-lab/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | see catalogue |
| Topic / tags / level | `storage` / `filesystems` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/zfs-btrfs-lab/`: **vdevs/RAIDZ2/special/SLOG/dRAID vs Btrfs profiles, failure and rebuild**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.1.

## Sources

- `/home/rjasmin/projects/single-page-labs/zfs-btrfs-topology-lab.html` (the original)

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Steps

1. Copy the page: `cp /home/rjasmin/projects/single-page-labs/zfs-btrfs-topology-lab.html sims/zfs-btrfs-lab/index.html`. Set `origin` to `single-page-labs/zfs-btrfs-topology-lab.html`.
2. Classify it as `the right class` and write `sims/zfs-btrfs-lab/sim.json` (all required fields, `status: "wip"`).
3. Adapt it to the kit (`docs/sim-ui.md`): kit tokens instead of the page's own palette, the kit header with
   back link and legend, the kit transport for its class, kit fonts instead of Google Fonts. Keep the page's
   model and wording; where it is a stepper, move the step logic into a DOM-free `sim.js` with `sim.test.js`.
4. Make it bilingual (COMMON.md §4). Today it is in English; write the other language.
5. Remove every network load (fonts, CDN scripts): vendor or drop them. The build refuses network loads.
6. Record exceptions in the page's `#simdeck-exceptions` block instead of working around a rule silently.
7. Run the checks (COMMON.md §7) and look at the screenshots.

## Known state and issues

- State: polished, 65 KB
- Licence and assets: own; no deps

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/zfs-btrfs-lab/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
