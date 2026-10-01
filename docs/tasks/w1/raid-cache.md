# raid-cache: RAID and disk cache (S ch. 11)

| | |
|---|---|
| Task | `raid-cache` (wave 1, ossimulator) |
| Catalogue entry | `ossim-raid-cache` in `docs/catalogue.md` §2.3 |
| Kind | adopt an existing simulator |
| Folder | `sims/raid-cache/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P1 |
| Courses | OS |
| Topic / tags / level | `os` / `raid`, `operating-systems` / `core` |
| Languages | Croatian now; English comes from ossimulator's source (task `ossimulator-english`) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; none beyond wave 0 |

## Goal

Bring the existing simulator into simdeck as `sims/raid-cache/`: **RAID 0–6, XOR, small write, cache policies**.

Notes from the catalogue: RAID 5 layout, XOR reconstruct (raid5-reconstruct), small write, RAID 6 double failure, LRU vs LFU vs FBR.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.3.

## Sources

- `/home/rjasmin/projects/ossimulator/dist-single/raid-cache.html (built from /home/rjasmin/projects/ossimulator/src/modules/raid-cache/)` (the original)

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Steps

1. Copy the built single file `/home/rjasmin/projects/ossimulator/dist-single/raid-cache.html` to `sims/raid-cache/index.html`
   (rebuild it first with `npm run verify` in `/home/rjasmin/projects/ossimulator` if `src/` is newer than `dist-single/`).
   Set `origin` to `ossimulator/raid-cache`.
2. Do not adapt it to the kit: it has its own shared runtime and a full test suite. Add `data-sim="raid-cache"` to
   its `<html>`, a `#simdeck-meta` placeholder and a `#simdeck-exceptions` block declaring `kit`, `text-size`
   (ossimulator's floor is 14 px), `one-screen` (its six-section layout scrolls) and `languages` (until it has
   English). These are the only edits to the built file.
3. Write `sim.json`: title, concept and summary from the page's `meta.ts`
   (`/home/rjasmin/projects/ossimulator/src/modules/raid-cache/meta.ts`), class `explorer`, topic `os`.
4. List the scenario deep links that index entries should use: RAID 5 layout, XOR reconstruct (raid5-reconstruct), small write, RAID 6 double failure, LRU vs LFU vs FBR. Each opens paused with
   `?scenario=<id>` (put them in `NOTES.md`; the frame does not have per-preset entries yet: see the
   foundation task about presets in the index).
5. **English** cannot be added to a built bundle. It belongs in ossimulator's source (foundation task
   `ossimulator-english`); this task only imports the Croatian build.
6. Check that the single file runs from `file://` with the network blocked (ossimulator's own e2e does this).

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/raid-cache/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
