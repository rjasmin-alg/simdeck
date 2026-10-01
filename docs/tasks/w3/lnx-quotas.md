# lnx-quotas: Disk quotas

| | |
|---|---|
| Task | `lnx-quotas` (wave 3, Linux) |
| Catalogue entry | `lnx-quotas` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-quotas/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `filesystems` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **soft vs hard limit, grace period**.

The student: users write files, time passes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-12/`
- Catalogue seed: UL ch12
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Zauzeće, kvote i odlagalište memorije" (definitions *kvota*, *meko ograničenje*, *tvrdo ograničenje*, *razdoblje odgode*; the `setquota -u ana 40M 50M 0 0` / `quotaon -v` / two `dd` / `repquota` sequence with 46084 and 51200) and Primjer 2 ("dva broja o istom direktoriju") for `du` vs `df`
- quotactl(2), edquota(8), setquota(8), repquota(8), quotaon(8), as cited in ch12 (the reset rule 7 is (check))

## Model and presets

- **Scene:** the filesystem `/mnt/polje` (ext4 on `/dev/md0`) with each user's files as blocks in a usage bar per user, marked with the soft and hard limits; a live `repquota /mnt/polje` table exactly in the book's layout (`Block grace time: 7days; Inode grace time: 7days`, columns `used soft hard grace` twice, flags `--`/`+-`); a calendar strip with the grace clock; the last command and its result (`status=0` or `dd: error writing …: Disk quota exceeded`, `status=1`).
- **State:** `{ day, quotaOn, users: [{ name, usedKB, files, soft, hard, isoft, ihard, graceUntil: null|day, igraceUntil }], graceDays: 7, last: { cmd, status, written } }`.
- **One step:** one command from the script: `setquota`, `quotaon`, `dd` (write N MiB as a user), `rm`, `touch` (one more file), or "time passes N days"; then `repquota` is recomputed.
- **Rules:**
  1. Limits are per user (or group, project) and per filesystem; the same user on another filesystem has other or no limits. (ch12 definition *kvota*)
  2. `setquota -u ana 40M 50M 0 0` sets soft 40960 and hard 51200 one-KiB blocks; no inode limits. (ch12 listing)
  3. Limits are enforced once `quotaon` has run. (ch12 `quotaon -v` listing; quotaon(8), check)
  4. Hard limit: never exceeded; a write that would pass it stops exactly at it (partial file), `Disk quota exceeded`, exit status 1. (ch12: second `dd`, `used` 51200)
  5. Soft limit: may be exceeded, with warnings, for at most the grace period (default 7 days); the grace clock starts when usage first goes above soft; `repquota` shows `+` in the first flag and the time left. Tie-break: usage equal to the soft limit is not "over". (ch12 definitions *meko ograničenje*, *razdoblje odgode*; quotactl(2); check the equality case)
  6. Grace expired: the soft limit is enforced like the hard one: further allocations fail even below hard; `repquota` shows `none` in `grace`. (ch12; edquota(8))
  7. Usage back at or below soft clears the grace clock. (quotactl(2), check)
  8. Blocks and files (inodes) are limited separately; the second flag and the second `grace` column belong to files. (ch12 `repquota` columns)
- **Params:** `graceDays` range 1–14, default 7; `fileLimits` toggle (adds `0 0 → 3 5` inode limits for `ana`), default off. Commands come from presets.
- **Presets:**
  - `book-ana` — `setquota -u ana 40M 50M 0 0` → `repquota` (ana 4 / 40960 / 51200) → `quotaon -v` → `dd … count=45` (status 0; ana `+-`, used 46084, grace `7days`) → `dd … count=20` (`Disk quota exceeded`, status 1; used 51200). From ch12.
  - `grace-expires` — after the 45 MiB write, 8 days pass; `dd … count=1` fails although 46084 < 51200; grace `none`. Derived, unchecked.
  - `delete-resets` — after the 45 MiB write and 3 days, `rm velika`: used 4, flags `--`, grace cleared; a new 45 MiB write starts a fresh 7 days. Derived, unchecked.
  - `file-limit` — `fileLimits` on: `touch` five small files; at the 4th the second flag turns `+`, the 6th fails. Derived, unchecked.
  - `other-fs` — ana writes 60 MiB to `/home` (no quota there) while `/mnt/polje` is full for her. Derived from ch12 definition, unchecked.
- **Steps:** one per command: `book-ana` 5, `grace-expires` 6, `delete-resets` 7, `file-limit` 7, `other-fs` 4.
- **Legend:** used blocks (solid), soft limit (dashed line), hard limit (solid wall), over soft (hatched part above the dashed line), grace clock (badge with days left), refused write (× at the wall). "Changed" marks the `repquota` cells and the bar segment that changed in this step.
- **Captions:**
  - HR: „`ana` je s 46084 bloka iznad mekog ograničenja (40960), a ispod tvrdog (51200). Pisanje je prošlo, ali od sada teče razdoblje odgode od 7 dana.“
  - EN: "At 46084 blocks `ana` is above the soft limit (40960) and below the hard one (51200). The write went through, but the 7-day grace period has started."
- **Terms:** quota — kvota; soft limit — meko ograničenje; hard limit — tvrdo ograničenje; grace period — razdoblje odgode; block — blok; inode (file) limit — ograničenje broja datoteka (check); exit status — izlazni status.
- **Misconceptions:** the soft limit is only a warning (after the grace period it is a wall); the hard limit is checked after the write (the write stops at it); a quota is per user for the whole machine.
- **Out of scope:** group and project quotas (named only), XFS quota tools (`xfs_quota`), quota warnings via `warnquota`, root/`CAP_SYS_RESOURCE` exemption.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-quotas` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-quotas sims/lnx-quotas` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-quotas/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
