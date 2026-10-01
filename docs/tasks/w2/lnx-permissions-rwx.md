# lnx-permissions-rwx: Permission bits, octal, umask

| | |
|---|---|
| Task | `lnx-permissions-rwx` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-permissions-rwx` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-permissions-rwx/` |
| Class | explorer |
| Size | S |
| Priority | P1 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **nine bits, octal notation, umask clearing bits from the defaults (666 with umask 077 gives 600)**.

The student: toggle bits, set umask, create files.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-07/`
- Catalogue seed: UL ch07 (devet-bitova-dozvola.svg)
- UL ch07, section "Što smijete s datotekom" (Što treba znati: `touch proba`, `chmod 640`, `chmod u+x,g-r`,
  `umask 077; touch tajna`) and "Šire o temi" (symbolic umask); figure
  `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-07/devet-bitova-dozvola.svg`
- POSIX.1-2017: `chmod` utility, `umask` utility, `<sys/stat.h>` (as cited in UL ch07)

## Model and presets

- **Scene:** a bit strip (kit "bit / field strip" view if it exists, else own) of nine cells in three groups
  (vlasnik / grupa / ostali, each r w x), with the type character in front; under it three rows that are the
  same value written three ways: `ls -l` string (`-rw-r-----`), octal (`640`), symbolic (`u=rw,g=r,o=`).
  Right of it a "create" panel: base mode (666 file / 777 directory) → umask strip → result strip.
- **State (explorer, computed live from params):** `{ kind: 'file'|'dir', before: 0..0o777, cmd, after,
  umask: 0..0o777, base, created, changedBits: [0..8] }`.
- **What the params drive:** the start mode and the command give `after` (chmod panel); umask and kind give
  `created` (create panel). Bits that differ between before and after (or base and created) are highlighted.
- **Rules:**
  1. Nine bits in three groups of three, order owner, group, other; inside a group r, w, x; letter = set,
     dash = clear. First character is the type (`-` file, `d` directory), not a permission (UL ch07 "Što
     smijete s datotekom", fig. `devet-bitova-dozvola.svg`).
  2. Octal digit per group = sum of r 4, w 2, x 1; digits written owner, group, other (`S_IRUSR` 0400,
     `S_IWUSR` 0200, `S_IXUSR` 0100; same section, `<sys/stat.h>`).
  3. Octal chmod is absolute: all nine bits are written, the old value plays no part (`chmod 640` on
     `rwx------` drops the x) (same section, POSIX chmod).
  4. Symbolic chmod is relative: `+` sets, `-` clears only the named bits; `=` clears the named class first
     and then sets (same section).
  5. New file mode = base AND NOT umask; base is 0666 for `touch`/regular files and 0777 for `mkdir`
     (POSIX `open()`/`mkdir()` mode argument as used by `touch`/`mkdir` (check)). It is bit clearing, not
     subtraction: 666 with umask 077 gives 600, not the octal difference 567; 666 with 033 gives 644, not 633.
  6. x on a directory means search (pass through), not execute (same section, POSIX path resolution).
  7. umask belongs to the shell's execution environment and affects only files created after it is set,
     in that shell (same section).
  8. Edge: umask bits for x on a file have no effect, because base 0666 has no x (umask 0022 vs 0033 give
     the same file 644) (derived from rule 5).
- **Params:** `kind` choice file/dir, default file; `before` select of octal modes (000, 600, 640, 644, 700,
  755, 777), default 644; `cmd` select (`—`, `chmod 640`, `chmod u+x,g-r`, `chmod g-w`, `chmod 755`,
  `chmod o=`), default `—`; `umask` select (000, 002, 022, 027, 077), default 022. Bit cells are also
  clickable: a click toggles that bit of `before` (sets `cmd` to `—`).
- **Presets:**
  1. `touch-default` — umask 0022, file → `-rw-r--r--` 644 (from UL ch07, `touch proba`).
  2. `chmod-640` — before 644, `chmod 640` → `-rw-r-----` (from UL ch07).
  3. `symbolic` — before 640, `chmod u+x,g-r` → `-rwx------` 700; owner rw untouched (from UL ch07).
  4. `octal-erases` — before 700, `chmod 640` → 640, the owner's x is gone though nobody named it (from UL
     ch07, consequence paragraph).
  5. `umask-077` — umask 077, file → `-rw-------` 600 (from UL ch07, `umask 077; touch tajna`).
  6. `dir-umask` — umask 022, dir → `drwxr-xr-x` 755; umask 027 file → 640 (derived, unchecked).
- **Steps:** explorer, no steps.
- **Legend:** filled cell = bit set, hollow = clear; outlined (hl) = changed by this command or by the mask;
  hatched = bit removed by the umask.
- **Captions:**
  - hr: "`chmod 640` piše svih devet bitova: izvršni bit vlasnika nestao je, iako ga nitko nije spomenuo."
  - en: "`chmod 640` writes all nine bits: the owner's execute bit is gone though nobody named it."
  - hr: "Maska 077 ne oduzima broj od 666: briše bitove, pa nova datoteka ima 600."
  - en: "Umask 077 doesn't subtract from 666: it clears bits, so the new file gets 600."
- **Terms:** file permission — dozvola; octal mode — oktalni zapis dozvola; file mode creation mask (umask)
  — maska stvaranja (umask); owner / group / others — vlasnik / grupa / ostali; search permission (on a
  directory) — dozvola pretraživanja; symbolic mode — simbolički način.
- **Misconceptions:** umask is subtracted arithmetically; octal chmod only "adds" what is named; x on a
  directory means "run".
- **Out of scope:** setuid/setgid/sticky (the fourth digit, `lnx-special-bits`), the access check itself
  (`lnx-access-decision`), ACLs, the inverted `+`/`-` in symbolic `umask` (mention in the explanation only).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-permissions-rwx sims/lnx-permissions-rwx` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-permissions-rwx/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
