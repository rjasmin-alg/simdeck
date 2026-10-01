# lnx-special-bits: setuid, setgid and sticky

| | |
|---|---|
| Task | `lnx-special-bits` (wave 3, Linux) |
| Catalogue entry | `lnx-special-bits` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-special-bits/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-permissions-rwx` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **who the process runs as; who may delete in /tmp**.

The student: run a setuid binary, delete in a sticky dir.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-permissions-rwx/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-07/`
- Catalogue seed: UL ch07
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`: section "Kad tri skupine bitova nisu dovoljne" (`ls -l /usr/bin/passwd /usr/bin/sudo`, definitions *setuid*/*setgid*/*sticky bit*, `S_ISUID` 04000 / `S_ISGID` 02000 / `S_ISVTX` 01000, `ls -ld /tmp`, `chmod 2770 /srv/projekt`, chmod(2) and chown clearing the bits) and its "Šire o temi" (`t` on `/tmp`, capabilities)
- POSIX (Base Specifications Issue 8): exec family (set-user-ID on exec), `<sys/stat.h>`, directory protection rule, `chown()`, as cited in ch07; execve(2) (scripts ignore set-user-ID, check)

## Model and presets

- **Reuses from `lnx-permissions-rwx`:** the nine bits, their octal digits and the owner → group → others check, now done with the process's **effective** IDs. New here: the fourth octal digit (4 setuid, 2 setgid, 1 sticky), real vs effective IDs on a process, and the sticky rule for deletion.
- **Scene:** left, a process card with `RUID`, `EUID`, `RGID`, `EGID` (the point of the page: which of them changed); middle, the file or directory acted on with its `ls -l` line, the special bit's letter enlarged (`s`, `S`, `t`, `T`); right, the target of the action (e.g. `/etc/shadow`, a file in `/tmp`) and the decision with the rule that made it. Users: `student` (1000), `ana` (1001), `root` (0); group `projekt`.
- **State:** `{ users, files: [{ path, owner, group, mode }], proc: null|{ cmd, ruid, euid, rgid, egid }, action: { kind: 'exec'|'open'|'unlink'|'create', who, path }, result, rule }`.
- **One step:** one action: a user runs a program (exec: compute the new process's IDs), the process opens a file (permission check with EUID/EGID), a user deletes or renames a file in a directory (sticky check), or creates a file in a directory (group inheritance).
- **Rules:**
  1. exec of a file with set-user-ID: the new process's EUID becomes the file's owner; RUID stays the caller. Not "run as root" but "run as the owner". (ch07 "Kad tri skupine bitova nisu dovoljne"; POSIX exec)
  2. set-group-ID on an executable: EGID becomes the file's group. (ch07)
  3. Permission checks use EUID/EGID; EUID 0 bypasses them. (ch07; capabilities(7) as cited)
  4. Sticky bit on a writable directory: a process may delete or rename a file there only if its EUID owns the file, or owns the directory, or it is privileged; writing the directory is not enough. (ch07; POSIX directory protection)
  5. setgid on a directory: files created in it get the directory's group, not the process's EGID. (ch07 definition *setgid*; `/srv/projekt` with 2770)
  6. Octal: the fourth digit in front, 4 + 2 + 1 (`chmod 2770`, `/tmp` 1777, `passwd` 4755). In `ls -l` the letter replaces the `x`: lowercase if `x` is also set, uppercase (`S`, `T`) if not. (ch07; chmod(1), check the uppercase case)
  7. Writing to a set-user-ID file, or an unprivileged `chown` of it, can clear the bits. (ch07: chmod(2), POSIX chown)
  8. Linux ignores set-user-ID and set-group-ID on interpreted scripts (`#!`). (execve(2), check)
  9. Tie-break for the sticky rule: file owner is tested first, then directory owner, then privilege; the caption names the first test that allowed it.
- **Params:** `sticky` toggle on the shared directory, default on; `actor` choice `student` | `ana` | `root`, default `student`. Actions come from presets.
- **Presets:**
  - `passwd` — `ls -l /usr/bin/passwd` (`-rwsr-xr-x root root`); `student` runs it → process RUID 1000, EUID 0 → may update `/etc/shadow`; the same `student` with `cat /etc/shadow` → "Permission denied". From ch07 (listing), shadow mode on the lab machine (check).
  - `owner-not-root` — the same bit on a program owned by `ana`: the process runs with EUID 1001, not 0. From ch07 ("Da je vlasnik … netko treći"), example derived.
  - `sticky-tmp` — `/tmp` is `drwxrwxrwt root root`; `ana` creates `/tmp/ana.txt` with mode 666; `student` tries `rm` → "Operation not permitted" although he may write the file; `ana` deletes it. Then `sticky` off: `student` can delete it. From ch07 (rule and `/tmp` listing), example derived.
  - `setgid-dir` — `/srv/projekt` `drwxrws--- root projekt` (`chmod 2770`): `ana` creates `ana.txt` → group `projekt`; `student` (not in the group) `ls` → "Permission denied". From ch07.
  - `script-ignored` — a setuid-root shell script run by `student`: EUID stays 1000. Derived from execve(2), unchecked.
- **Steps:** one per action: `passwd` 3, `owner-not-root` 2, `sticky-tmp` 5, `setgid-dir` 3, `script-ignored` 2.
- **Legend:** real ID (plain), effective ID (bold, highlighted when it differs from real), special-bit letter (enlarged, coloured + shape), allowed (check) / refused (×), the rule badge (1–8). "Changed" marks the process IDs set by exec and the directory entry added or removed.
- **Captions:**
  - HR: „`passwd` ima bit setuid i vlasnik mu je `root`: proces koji je pokrenuo `student` ima stvarni UID 1000, ali efektivni 0. Dozvole se provjeravaju po efektivnom.“
  - EN: "`passwd` has the setuid bit and is owned by `root`: the process `student` started has real UID 1000 but effective UID 0. Permissions are checked against the effective one."
- **Terms:** setuid — setuid (*set-user-ID on execution*); setgid — setgid; sticky bit — zastavica ograničenog brisanja (*restricted deletion flag*); effective user ID — efektivni korisnički identifikator; real user ID — stvarni korisnički identifikator; permission — dozvola; privilege — ovlast.
- **Misconceptions:** setuid means "run as root"; whoever may write a directory may delete anything in it (not with the sticky bit); `s` and `S` mean the same.
- **Out of scope:** capabilities as the narrower alternative (one sentence, as in ch07), `sudo` policy, `nosuid` mounts, ACLs, the historical sticky bit on files.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-special-bits` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-special-bits sims/lnx-special-bits` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-special-bits/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
