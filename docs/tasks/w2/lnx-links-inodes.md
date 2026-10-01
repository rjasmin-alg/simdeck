# lnx-links-inodes: Hard links, symlinks and inodes

| | |
|---|---|
| Task | `lnx-links-inodes` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-links-inodes` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-links-inodes/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `filesystems` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **names point to inodes; the link count; dangling symlinks**.

The student: create, link, delete, see what survives.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/05-datoteke-staze-i-tekst.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-05/`
- UL ch05 section "Rad s datotekama i direktorijima" → "Što treba znati" (`ln`, `ls -li` with inode 33616720, `rm`, definicije unos u direktoriju / brojač poveznica, the `~/p2` experiment) and "Šire o temi" (`unlink()` on a symlink, `stat -c "%h %n"`); "Primjer 3 — prostor koji se ne vraća"; diagram `assets/diagrams/chapter-05/unos-u-direktoriju-i-brojac-poveznica.svg`
- POSIX.1-2024 XSH `link()`, `unlink()`, `symlink()`, `rename()`; XCU `rm`, `ln`; Linux man-pages "link(2)", "path_resolution(7)", "symlink(7)"
- Catalogue seed: UL ch05 (unos-u-direktoriju-i-brojac-poveznica.svg)

## Model and presets

- **Scene:** left, one or two directory tables (`~/proba`, later `~/p2`), each row a directory entry `name → inode number` (symlink rows also show `→ path`). Right, the file table: one card per inode (number, type `-`/`d`/`l`, link count, open-by count, data: content or, for a symlink, the stored path text). Arrows from entries to cards. A block bar at the bottom shows the space the data uses and frees. A small shell strip shows the command of this step and its output (`ls -li`, `cat`), as in `unos-u-direktoriju-i-brojac-poveznica.svg`.
- **State:** `{ dirs: { path: [{ name, ino }] }, inodes: { ino: { type: "file"|"dir"|"symlink", nlink, openBy: [pids], data, target } }, freeBlocks, cmd, out: [lines], lastEvent }`. Inode numbers follow the book (`33616720`, `41962518`); new ones are derived (`33616721`, …).
- **One step:** one command runs, then its effects in order: (1) path resolution (following symlinks, rule 6); (2) the directory entry is added, removed or renamed; (3) link counts change; (4) the freeing check (rule 4); (5) the output line.
- **Rules:**
  1. A name is a directory entry pointing to an inode; `ls -i` shows the inode number, and the number after the mode bits is the link count. Two names with the same number are one file. Source: UL ch05 "Rad s datotekama i direktorijima" (definicije unos u direktoriju, brojač poveznica; digresija "Dva broja u istom retku").
  2. `ln target name` adds a second entry to the **same** inode and raises its link count by 1. It fails across filesystems (EXDEV) and for directories (EPERM on Linux). Source: UL ch05 (`ln`, `ls -li`); POSIX `link()` ERRORS [EXDEV]; Linux man-pages "link(2)" [EPERM] (check).
  3. `rm name` removes one entry and lowers the link count by 1; it does not remove content. Source: UL ch05 (`rm` "uklanja unos u direktoriju"; `unlink()` "smanjuje brojač poveznica").
  4. Space is freed only when the link count is 0 **and** no process has the file open; if one does, freeing is postponed until it closes. Source: UL ch05 (footnotes ch5-unlink-free, ch5-unlink-postponed) and Primjer 3.
  5. `ln -s target name` creates a **new inode** of type symlink whose data is the path text; the target's link count does not change and the target need not exist. Source: POSIX `symlink()` (check); UL ch14 uses `ls -l` letter `l` and the arrow for a symlink.
  6. A symlink is resolved at the moment of access, by its stored text; a relative path is resolved from the symlink's own directory. If nothing is there, the access fails with `No such file or directory` (a dangling symlink). Source: Linux man-pages "path_resolution(7)", "symlink(7)" (check).
  7. Removing a symlink removes only the link; the file it named is untouched. Source: UL ch05 "Šire o temi" (footnote ch5-unlink-symlink).
  8. `mv` inside one filesystem renames the entry and keeps the inode: hard links to it keep working, a symlink holding the old name dangles. Source: POSIX `rename()` (derived).
  9. Tie-break / edge: a new directory has link count 2 (its name and its own `.`), +1 for each subdirectory (`..`). Source: UL ch05 `ls -li` output (`podmapa` with 2) (check the +1 rule on XFS).
- **Params:** `preset` (select), `showBlocks` (toggle, the block bar, default on), `holdOpen` (toggle: a `tail -f` process holds the file open during the preset; default off; turns rule 4's second condition on).
- **Presets:**
  1. `primjer` — `ln ~/proba/datoteka.txt ~/proba/tvrda-veza`: both names on inode `33616720`, link count 2 (`podmapa` `41962518`, count 2); `rm ~/proba/datoteka.txt`: one entry, count 1, same inode. From UL ch05 "Rad s datotekama i direktorijima".
  2. `sadrzaj` — `printf 'prvi redak\n' > ~/p2/a.txt && ln a.txt b.txt && rm a.txt && cat b.txt` → `prvi redak`; content never moved. From UL ch05.
  3. `simbolicka` — `ln -s a.txt s.txt`: new inode, `a.txt` stays at count 1; `cat s.txt` works; `rm a.txt` → count 0, space freed; `cat s.txt` → `No such file or directory`; a new `a.txt` (new inode number) makes `s.txt` work again. Derived, unchecked.
  4. `preimenuj` — hard link `h.txt` and symlink `s.txt` to `a.txt`; `mv a.txt b.txt` → `h.txt` still reads the content, `s.txt` dangles. Derived, unchecked.
  5. `otvorena` — `holdOpen` on: `rm` the last name → count 0, the block bar does not shrink; the process ends → space freed. From UL ch05 Primjer 3 (deeper treatment in `lnx-disk-full-mysteries`).
- **Steps:** primjer 3 (start, ln, rm), sadrzaj 5, simbolicka 6, preimenuj 5, otvorena 4.
- **Legend:** entry row; inode card (file / directory / symlink by shape and the type letter); hard pointer (solid arrow) vs symlink path (dashed arrow drawn from the stored text, broken when it resolves to nothing); "changed" highlight = the entry and the counter that changed this step.
- **Captions:** hr: "`rm` je uklonio unos `datoteka.txt`; brojač poveznica inodea 33616720 pao je s 2 na 1 — sadržaj nije dotaknut." en: "`rm` removed the entry `datoteka.txt`; the link count of inode 33616720 fell from 2 to 1 — the content was not touched." hr: "Simbolička poveznica pamti samo stazu `a.txt`; ondje sada nema ničega, pa `cat` javlja `No such file or directory`." en: "A symbolic link stores only the path `a.txt`; there is nothing there now, so `cat` reports `No such file or directory`."
- **Terms:** directory entry — unos u direktoriju; link count — brojač poveznica; hard link — čvrsta poveznica (UL ch05 names the file `tvrda-veza`; ch15/ch23 say *čvrsta poveznica*); symbolic link — simbolička poveznica; inode — inode (zapis o datoteci, UL ch11 "mjesta za zapise o datotekama") (check); file descriptor — datotečni deskriptor; dangling link — viseća poveznica (check, not in the book).
- **Misconceptions:** "`rm` deletes the file" (it removes a name); "a hard link is a copy" / "a hard link is a pointer to the other name"; "a symlink keeps the file alive".
- **Out of scope:** inode exhaustion and `df`/`du` disagreement (→ `lnx-disk-full-mysteries`), permissions on links, `ln -f`/`-r`, bind mounts, reflinks.
- **Note for the coordinator:** the book has no Croatian term for *inode* and only a one-line treatment of symlinks (UL ch05 "Šire o temi"); rules 5, 6 and 8 rest on POSIX/man pages, not the book. Preset `otvorena` overlaps `lnx-disk-full-mysteries`; keep it here as one preset and link across.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-links-inodes sims/lnx-links-inodes` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-links-inodes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
