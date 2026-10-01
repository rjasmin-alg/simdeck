# lnx-send-receive: Btrfs/ZFS send and receive

| | |
|---|---|
| Task | `lnx-send-receive` (wave 3, Linux) |
| Catalogue entry | `lnx-send-receive` in `docs/catalogue.md` §4.4 |
| Kind | **add a preset to `sims/backup-diff-incr/`** (no page of its own) |
| Folder | `sims/backup-diff-incr/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA, DR |
| Topic / tags / level | `linux-admin` / `snapshots` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `backup-diff-incr` merged; only one preset task per host folder at a time; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **incremental replication from snapshot pairs**.

The student: snapshot, send, change, send incremental.

This is a **preset on `backup-diff-incr`** (Differential vs incremental), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/backup-diff-incr/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T22 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T22 → §5.3
- NLA rows T22 ("Btrfs — podvolumeni, snimke, `send`/`receive`…") and T23 ("ZFS na Linuxu…") (no chapters yet; rules above are (check))
- zfs-send(8) (`-i`, `-I`), zfs-receive(8) (`-F`), btrfs-send(8) (`-p`, read-only snapshots), btrfs-receive(8)
- Host spec: `docs/tasks/w2/backup-diff-incr.md` and, once merged, `sims/backup-diff-incr/SPEC.md`
- Related lab: `/home/rjasmin/projects/single-page-labs/zfs-btrfs-topology-lab.html`

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **What this task is:** presets on `sims/backup-diff-incr/` (host model: blocks changed over a week; full, differential and incremental backups; what a restore needs). No page of its own.
- **Preset scene (on the host's K3 block grid):** two machines instead of one backup store: the source filesystem with a row of 8 blocks per day and its snapshots (`@mon`, `@tue`, `@wed`), and the target with its received snapshots. Each send shows the stream as the set of blocks it carries.
- **What the host model must support (check against its SPEC once merged):**
  1. A named snapshot per day on the source (read-only), and the same names on a target.
  2. A send of type full (all blocks of one snapshot) or incremental from a parent snapshot (only blocks that differ between parent and child) — the host's "incremental" with an explicit parent.
  3. On receive, the increment is **applied**: the target then holds a complete snapshot, so restoring Wednesday needs only `@wed` on the target, not a replay of the chain. This differs from the host's incremental-backup restore, which needs the chain.
  4. A precondition: an incremental send needs the parent snapshot on **both** sides; if the target lacks it (or, for ZFS, the target was modified since, unless forced to roll back), the receive is refused and only a full send works.
  5. A "delete snapshot" action on either side.
- **Rules:**
  1. An incremental stream between two snapshots contains only the blocks changed between them. (zfs-send(8) `-i`; btrfs-send(8) `-p`, check)
  2. Snapshots sent must be read-only. (btrfs-send(8), check)
  3. The parent must exist on the receiving side; ZFS also refuses if the target filesystem changed after its most recent snapshot unless `receive -F` rolls it back. (zfs-receive(8), check)
  4. Received snapshots are full filesystems that share unchanged blocks on the target; deleting an older one does not break later ones, but the next incremental needs a common snapshot that both sides still have. (zfs-send(8), check)
  5. Tie-break: if several common snapshots exist, the preset uses the newest one as parent (what an operator would choose; the tools take the one named).
- **Presets (added to the host):**
  - `send-chain` — Mon: full send of `@mon` (8 blocks); Tue: 2 blocks change, `send -i @mon @tue` carries 2; Wed: 1 block, carries 1; restore Wednesday on the target from `@wed` alone. Derived, unchecked.
  - `missing-parent` — `@mon` deleted on the target before Tuesday's incremental: receive refused; a full send of `@tue` (8 blocks) instead. Derived, unchecked.
  - `common-kept` — `@mon` deleted on the source after Tuesday: Wednesday's `send -i @tue @wed` still works because `@tue` is common. Derived, unchecked.
  - `target-touched` — a file written on the target between sends: ZFS receive refused (or rolled back with `-F`, losing that write). Derived, unchecked.
- **Steps:** one per day or action: `send-chain` 4, `missing-parent` 4, `common-kept` 4, `target-touched` 3.
- **Legend additions:** snapshot tag (flag icon with name), stream (bracket of carried blocks), refused receive (× with reason), common snapshot (linked flags on both sides). "Changed" marks blocks carried by this step's stream.
- **Captions:**
  - HR: „Inkrementalno slanje od `@tue` do `@wed` nosi samo jedan blok. Na odredištu je `@wed` time cijeli datotečni sustav: za oporavak srijede ne treba lanac.“
  - EN: "The incremental send from `@tue` to `@wed` carries a single block. On the target `@wed` is then a whole filesystem: restoring Wednesday needs no chain."
- **Terms:** snapshot — snimka (NLA toc T20/T22); incremental send — inkrementalno slanje (check); replication — replikacija; parent snapshot — roditeljska snimka (check); stream — tok (check); receive — primanje.
- **Misconceptions:** an incremental replica needs the whole chain to restore (it doesn't, unlike incremental backups); any old snapshot can be the parent (it must exist on both sides); replication is a backup (a deletion replicates too, unless snapshots are kept).
- **Out of scope:** resumable sends, encryption and raw sends, compression in the stream, scheduling and retention (`sto-retention-gfs`).
- **If the host cannot express rule 3 (applied receive) or the both-sides precondition:** write the request under "Shared requests" in `sims/backup-diff-incr/NOTES.md` (smallest change: a `target` store with materialised snapshots and a `parentRequired` check) and stop, as the task says.
- **Note for coordinator:** the Kind line says both "build a new simulator" and "adds a preset"; it is a preset task. It covers NLA T22 (Btrfs) and T23 (ZFS) with one generic model; the two differ only in rule 3's "target modified" case.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backup-diff-incr/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
