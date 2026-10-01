# lnx-multipath: Multipath I/O

| | |
|---|---|
| Task | `lnx-multipath` (wave 3, Linux) |
| Catalogue entry | `lnx-multipath` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-multipath/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `storage-basics` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **path failover for iSCSI/FC**.

The student: fail paths during I/O.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T25 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T25; spl-stratis-lab
- NLA T25 row: "Mrežno spremište — iSCSI, NVMe-oF, NFS u pogonu" (no chapter yet; every rule above is (check))
- multipath.conf(5): `path_grouping_policy`, `path_selector`, `failback`, `no_path_retry`, `polling_interval`; multipath(8) `-ll` output
- Red Hat Enterprise Linux 9 documentation, "Configuring device mapper multipath" (overview, default `service-time 0`, ALUA with `group_by_prio`)
- RFC 7143 (iSCSI) for the initiator/target vocabulary
- Related lab: `/home/rjasmin/projects/single-page-labs/stratis-topology-lab.html` (has a multipath device view)

## Model and presets

- **Scene:** left, the host `demosrv1` with two initiator ports (HBA/NIC `h0`, `h1`); middle, two fabrics (switch A, switch B); right, the storage array with two controllers (`ctrl-A` owning the LUN, `ctrl-B`), one LUN. Four paths drawn as lines, each labelled with the SCSI disk it appears as (`sda` h0→A, `sdb` h1→A, `sdc` h0→B, `sdd` h1→B) and grouped into path groups; above the host, `/dev/mapper/mpatha` and the filesystem on it. Right panel: a `multipath -ll`-style listing (`policy='…' prio=50 status=active` / `enabled`, each path `active ready running` or `failed faulty`), counters: I/Os done, retried, queued, errors returned to the filesystem.
- **State:** `{ t, paths: [{ dev, port, ctrl, group, prio, state: 'active'|'failed' }], groups: [{ id, prio }], activeGroup, rr, queued, done, retried, errors, retryLeft, fsState: 'rw'|'ro', events }`.
- **One step:** one tick (5 s, the default polling interval (check)). Phases: (a) apply the scripted event (a path or port or controller fails / returns); (b) path checker updates path states; (c) issue 4 I/Os through the path selector in the active group; an I/O sent to a dead path fails at SCSI level, the path is marked failed and the I/O is retried on another path; (d) if the active group has no usable path, switch to the next group by priority; if no group has one, apply `no_path_retry`; (e) failback check.
- **Rules:**
  1. Without multipath the one LUN appears as four independent disks; using `sdb` directly gives no failover. (device-mapper multipath documentation, overview, check)
  2. `path_grouping_policy`: `failover` = one path per group; `multibus` = all paths in one group; `group_by_prio` = groups by priority (ALUA: paths to the owning controller are active/optimized, prio 50; the others non-optimized, prio 10). (multipath.conf(5); SPC-4 ALUA, check)
  3. Path selector inside the active group: `round-robin 0` here (the common distribution default is `service-time 0`, which on equal load behaves like round-robin; say so). Tie-break: the next path after the last used one in list order, skipping failed paths.
  4. An I/O that fails on a path because the path died is retried on another usable path; the filesystem sees no error. (multipath.conf(5), dm-multipath; check)
  5. Group switch: when the active group has no usable path, the next group by priority (then list order) becomes active. (multipath.conf(5), check)
  6. `failback immediate`: when a higher-priority group has a usable path again, I/O returns to it at once; `manual`: it stays. (multipath.conf(5) `failback`)
  7. All paths down: `no_path_retry queue` queues I/O until a path returns (applications hang, nothing is lost); `fail` returns errors at once (ext4/XFS may go read-only, check); a number N queues for N checker intervals and then fails. (multipath.conf(5) `no_path_retry`)
- **Params:** `grouping` choice `failover` | `multibus` | `group_by_prio`, default `group_by_prio`; `failback` choice `immediate` | `manual`, default `immediate`; `noPathRetry` choice `queue` | `fail` | `3`, default `queue`; `useMultipath` toggle, default on (off = the filesystem sits on `sdb`). All `resets: true`.
- **Presets:**
  - `multibus-rr` — multibus, fail `sdb` at tick 2: I/O spreads over 4, then 3 paths; 0 errors, 1 retried I/O; restore at tick 5 → back to 4. Derived, unchecked.
  - `alua-failover` — group_by_prio: I/O only on `sda`/`sdb` (ctrl-A); ctrl-A fails at tick 2 → both paths fail, group switches to ctrl-B (`sdc`/`sdd`), no errors; ctrl-A returns at tick 5 → failback immediate. Derived, unchecked.
  - `all-down-queue` — all four paths down ticks 2–5 with `queue`: queued grows 4, 8, 12, 16, errors 0; paths back at tick 6 → queue drains. Derived, unchecked.
  - `all-down-fail` — same with `fail`: 4 errors per tick, filesystem goes read-only. Derived, unchecked.
  - `no-multipath` — `useMultipath` off, the filesystem on `sdb`; `sdb`'s path fails: errors at once although three healthy paths exist. Derived, unchecked.
- **Steps:** one tick each: `multibus-rr` 6, `alua-failover` 7, `all-down-queue` 8, `all-down-fail` 6, `no-multipath` 5.
- **Legend:** active path (solid line, moving I/O dots), enabled standby path (dashed), failed path (red with a cross mark), active group (frame), queued I/O (stacked squares at the host), error (×). "Changed" marks paths whose state changed and the group switch.
- **Captions:**
  - HR: „Kontroler A je pao: oba puta u aktivnoj grupi su `failed`. Multipath prelazi na grupu kontrolera B; zahtjev koji je pao ponovljen je, a datotečni sustav nije vidio grešku.“
  - EN: "Controller A has failed: both paths in the active group are `failed`. Multipath switches to controller B's group; the failed I/O was retried and the filesystem saw no error."
- **Terms:** path — put; path group — grupa putova; failover — preuzimanje (check); failback — povratak na prvotni put (check); network storage — mrežno spremište (NLA toc T25); initiator / target — inicijator / cilj (check); I/O request — U/I zahtjev.
- **Misconceptions:** four disks in `lsblk` are four disks; multipath means load balancing (with ALUA it is mostly failover); `queue` is always safe (applications hang until a path returns).
- **Out of scope:** iSCSI login and discovery, NVMe native multipath, `queue_if_no_path` tuning, `user_friendly_names`, blacklists, path priority checkers in detail.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-multipath` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-multipath sims/lnx-multipath` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-multipath/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
