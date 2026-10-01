# lnx-logrotate: logrotate

| | |
|---|---|
| Task | `lnx-logrotate` (wave 3, Linux) |
| Catalogue entry | `lnx-logrotate` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-logrotate/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `logging` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-log-path` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **rotation numbering, compress, copytruncate vs create**.

The student: run rotations while an app writes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-log-path/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/13-dnevnici-i-zapisi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-13/`
- Catalogue seed: UL ch13
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/13-dnevnici-i-zapisi.md`, section "`rsyslog`, `/var/log` i rotacija" (definition *rotacija dnevnika*, listings of `/etc/logrotate.conf` and `/etc/logrotate.d/rsyslog`, `compress`/`maxage`) and Primjer 4 ("koliko dnevnika ovaj stroj treba čuvati")
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/05-datoteke-staze-i-tekst.md`, Primjer 3 ("prostor koji se ne vraća": open descriptor keeps the content)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, "Poslovi koji se pokreću sami" (`logrotate.timer`: `OnCalendar=daily`, `Persistent=true`)
- logrotate(8): `rotate`, `daily`/`weekly`, `create`, `copytruncate`, `compress`, `delaycompress`, `dateext`, `postrotate` (the book cites only the first four; the rest are (check))

## Model and presets

- **Reuses from `lnx-log-path`:** the end of its path: the system logger writing the selected messages to `/var/log/messages`, and its message vocabulary (facility, priority, the file a selector names). New here: the file as a directory entry pointing at an inode, the writer's open file descriptor, and the logrotate run.
- **Scene:** left, the writer (the system logger, PID shown; generic label, the book's logger is only cited) with one arrow from its open file descriptor to an inode; centre, the `/var/log` listing (name → inode, size in lines, `.gz` badge); right, the logrotate run box with the active directives (`weekly`, `rotate 4`, `create`, `dateext`, `compress`, `postrotate … reload`); bottom, a day counter and a "lost lines" counter. The arrow is the point of the page: after a rename it still points at the old inode.
- **State:** `{ day, cycle, files: [{ name, inode, lines: [ids], gz }], writer: { inode }, nextInode, lost, log: [events] }`. Line ids are `d<day>-<k>` so every line can be traced to the file it ends up in.
- **One step:** a cycle is two steps. Step A, *write*: the writer appends `linesPerCycle` lines to the inode its descriptor points at. Step B, *rotate*: logrotate runs and, if due, applies the rules below in order: remove the oldest version, shift (or date-stamp), then `create` or `copytruncate`, then compress, then `postrotate`.
- **Rules:**
  1. Due: logrotate is a daily cron/timer job and changes a log at most once a day unless the criterion is size or `-f` is used; `weekly` rotates if at least 7 days passed since the last rotation (read from `/var/lib/logrotate/logrotate.status`). One step B = one due run. (ch13 "`rsyslog`, `/var/log` i rotacija"; logrotate(8) `daily`/`weekly`)
  2. `rotate N`: N old versions are kept; the version that would become N+1 is removed (or mailed) before the shift. (ch13; logrotate(8) `rotate`)
  3. Numbering without `dateext`: shift from the highest number down (`.3→.4`, `.2→.3`, `.1→.2`), then `messages → messages.1`. Tie-break: the removal of the oldest happens first, so there is never a moment with N+1 versions. (logrotate(8), check the exact order)
  4. `dateext` (on in the book's `/etc/logrotate.conf`): the rotated file is renamed `messages-YYYYMMDD`; no shifting; the oldest by date is removed beyond N. (ch13 listing of `/etc/logrotate.conf`)
  5. `create`: rename, then create a new empty file (new inode) with the old mode and owner. The writer's descriptor still points at the renamed inode, so it keeps writing there until it reopens; the book's `/etc/logrotate.d/` entry for the logger does this with a `postrotate` reload of the logger service. Without the reload, new lines land in `messages.1` (or `messages-DATE`) and `messages` stays empty. (ch13 `cat /etc/logrotate.d/rsyslog`: "program koji u nju piše mora doznati da datoteke više nema na starom mjestu"; ch05 Primjer 3 for the open-descriptor mechanism)
  6. `copytruncate`: copy the content to `messages.1`, then truncate the original in place. The writer never reopens and needs no signal; lines written between the copy and the truncate are lost (counted in `lost`). (logrotate(8) `copytruncate`, check)
  7. `compress`: old versions are gzipped (`.gz`); with `delaycompress` the newest old version (`.1`) stays uncompressed until the next cycle, because a writer without reload may still be writing into it. (ch13 `compress`; logrotate(8) `delaycompress`, check)
  8. Removing a version the writer still holds open frees no space until it lets go (the dangling arrow keeps a size). (ch05 Primjer 3)
- **Params:** `method` choice `create` | `create-reload` | `copytruncate`, default `create-reload`; `rotate` range 1–6, default 4; `dateext` toggle, default on; `compress` toggle, default off; `delaycompress` toggle, default off, disabled unless `compress`; `linesPerCycle` range 1–4, default 2; `writeDuringRotation` toggle, default off (one line arrives between copy and truncate; only matters for `copytruncate`). All `resets: true`.
- **Presets:**
  - `book-config` — the book's setup: `weekly`, `rotate 4`, `create`, `dateext`, reload in `postrotate`, 6 cycles. After cycle 5 there are four dated files; at cycle 6 the oldest is removed: about a month of history, as Primjer 4 computes. From ch13 (config listings, Primjer 4).
  - `numbers-compress` — `dateext` off, `rotate 3`, `compress`, 5 cycles: ends with `messages`, `messages.1.gz`, `.2.gz`, `.3.gz`; cycle 1's lines are gone after cycle 4. Derived, unchecked.
  - `forgot-reload` — `create` without reload, 3 cycles: after the first rotation every new line goes into `messages.1`, `messages` stays 0 lines; after the second rotation they go into `messages.2`. Derived from ch13 rule 5, unchecked.
  - `copytruncate-loss` — `copytruncate`, `writeDuringRotation` on, 3 cycles: the writer's inode never changes, no reload needed, `lost` = 3 (one per rotation). Derived, unchecked.
  - `delaycompress` — `create-reload`, `compress`, `delaycompress`, `rotate 3`, 4 cycles: `messages.1` plain, `.2.gz`, `.3.gz`. Derived, unchecked.
- **Steps:** 2 per cycle: `book-config` 12, `numbers-compress` 10, `forgot-reload` 6, `copytruncate-loss` 6, `delaycompress` 8.
- **Legend:** live log (solid), rotated version (outlined, number or date), compressed (`.gz` badge + hatch), removed (crossed, fades), writer's descriptor arrow, lost line (red cross mark + label). "Changed" highlight marks the files renamed, created, truncated or removed in this step and the arrow if it moved.
- **Captions:**
  - HR: „Rotacija: `messages` je preimenovan u `messages.1`, a novi prazan `messages` je stvoren. Zapisivač sustava i dalje piše u stari i-čvor dok ga `reload` ne natjera da datoteku ponovno otvori.“
  - EN: "Rotation: `messages` was renamed to `messages.1` and a new empty `messages` was created. The system logger keeps writing to the old inode until the reload makes it reopen the file."
- **Terms:** log rotation — rotacija dnevnika; log file — dnevnička datoteka; file descriptor — datotečni deskriptor; compression — kompresija (sažimanje); retention — čuvanje; truncate — skraćivanje (check); inode — i-čvor (check, ch05 avoids the word).
- **Misconceptions:** rotation is "just a rename" (the writer must be told; ch13 says so); `copytruncate` is free (it loses lines and works only because the writer never reopens); removing an old version frees space at once.
- **Out of scope:** size-based rotation (`size`, `maxsize`), `maxage`, `mail`, `olddir`, `sharedscripts` semantics, journald retention (`SystemMaxUse=`, covered by text in ch13), writers that don't use `O_APPEND` (sparse file after truncate).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-logrotate sims/lnx-logrotate` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-logrotate/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
