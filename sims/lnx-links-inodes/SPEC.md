<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-links-inodes: specification

One concept: **a name is a directory entry that points to an inode; the link count says how many names point to it;
a symbolic link stores only a path, which may lead nowhere.** The student creates, links, renames and removes names
and watches which inodes, which data and which blocks survive. Task: `docs/tasks/w2/lnx-links-inodes.md`; catalogue
§4.4. Model: `sim.js`; tests: `sim.test.js`.

## Scene

- **Directory tables** (left): one per directory the preset uses (`~/proba`, or `~/p2`), each row one directory entry
  `name → inode number`; a symlink row also shows `→ path text`. When a symlink in the table names a path that has no
  entry, a dashed "no entry" row stands where that name would be (the place the symlink points to).
- **File table** (right): one card per inode: number, type letter (`-` file, `d` directory, `l` symlink), link count,
  open by (process ids), data (the text, the size for a big file, or for a symlink the stored path text).
- **Arrows:** solid from each entry to its inode card; dashed from a symlink's stored text to the entry it resolves to,
  broken (✕) when it resolves to nothing.
- **Block bar** (bottom, `showBlocks`): 16 blocks of 4 KiB; a block is free, used by an inode (its colour and its
  number), or used by an inode with no name left that a process still holds open (hatched).
- **Shell strip** (top): the command of this step and what it printed (`ls -li`, `cat`, an error).

## State

`{ scene, dirs: { path: [{ name, ino }] }, inodes: { ino: { type, nlink, openBy, size, data, blocks } }, procs:
[{ pid, path, ino }], blocks: [ino | null] × 16, nextIno, nextDirIno, cmd, out: [lines], ev, changed, gone }`.
Inode numbers follow the book: `33616720` (`datoteka.txt`), `41962518` (`podmapa`); new files and symlinks take
`33616721`, `33616722`, … and new directories `41962519`, … A freed number is not reused within a run (simplification,
so a re-created name visibly gets a new inode; real filesystems may reuse a freed number *(check)*).

## One step

One command (sometimes followed by `; ls -li <dir>`, as in the book), then its effects in order, recorded in `ev`:

1. **path resolution** (`ev.resolve`: each hop, following symlinks where the command follows them, rule 6);
2. the **directory entry** is added, removed or renamed (`ev.add`, `ev.del`, `ev.ren`);
3. **link counts** change (`ev.counts`: `{ ino, from, to }`);
4. the **freeing check** (rule 4: `ev.free`: `freed`, `postponed` or `kept`);
5. the **output** lines (`out`).

## Rules

1. A name is a directory entry pointing to an inode; `ls -i` shows the inode number first, and the number after the
   mode bits is the link count. Two names with the same number are one file. *Source: UL ch05 "Rad s datotekama i
   direktorijima" (definitions "unos u direktoriju", "brojač poveznica"; digression "Dva broja u istom retku").*
2. `ln target name` adds a second entry to the **same** inode and raises its link count by 1. It fails across
   filesystems (`Invalid cross-device link`, EXDEV) and for a directory (`hard link not allowed for directory`, EPERM
   on Linux), and when the name exists (`File exists`). *Source: UL ch05 (`ln`, `ls -li`); POSIX `link()` ERRORS
   [EXDEV], [EEXIST]; Linux link(2) [EPERM] (check).*
3. `rm name` removes one entry and lowers the link count by 1; it does not touch the content. `rm` of a directory fails
   (`Is a directory`; `rm -r`/`rmdir` are out of scope). *Source: UL ch05 (`rm` "uklanja unos u direktoriju";
   `unlink()` "smanjuje brojač poveznica").*
4. The space is freed only when the link count is 0 **and** no process has the file open; if one does, the name is
   gone at once but the freeing is postponed until the last process closes it. *Source: UL ch05 footnotes
   ch5-unlink-free, ch5-unlink-postponed; Primjer 3.*
5. `ln -s text name` creates a **new inode** of type symlink whose data is the path text (size = its length, no data
   blocks: the text is kept in the inode); the target's link count does not change and the target need not exist.
   *Source: POSIX `symlink()` (check); UL ch14 (`ls -l` letter `l` and the arrow). The "no data blocks" detail is the
   short-symlink case on common Linux filesystems (check).*
6. A symlink is resolved at the moment of access, from its stored text; a relative text is resolved from the symlink's
   own directory. If no entry is there, the access fails with `No such file or directory` (a dangling symlink). A
   chain of more than 40 symlinks fails with `Too many levels of symbolic links`. *Source: Linux path_resolution(7),
   symlink(7) (check).* Which commands follow: `cat`, writing (`printf … >`) and `tail -f` follow; `ls -li`, `stat`
   (no `-L`), `rm`, `mv` and `ln` (Linux link(2) does not dereference, check) act on the link itself. Writing through a
   dangling symlink creates the file it names.
7. Removing a symlink removes only the link; the file it named is untouched. *Source: UL ch05 "Šire o temi" (footnote
   ch5-unlink-symlink).*
8. `mv` inside one filesystem renames the entry and keeps the inode: hard links to it keep working, a symlink holding
   the old name dangles. If the new name exists, its entry is replaced (that inode loses one link, rule 3 and 4).
   *Source: POSIX `rename()` (derived).* `mv` across filesystems (a copy) is out of scope.
9. Tie-break / edge: a new directory has link count 2 (its name in the parent and its own `.`), and the parent's count
   rises by 1 (the new `..`), when the parent's inode is drawn. *Source: UL ch05 `ls -li` (`podmapa` with 2); the +1
   rule on the parent (check on XFS).*
10. Tie-breaks of the drawing: `ls -li` lists entries by name (plain code-point order: the presets' names have no case
    or punctuation that a locale would sort differently); blocks are allocated first-fit from block 0; several
    effects in one step are recorded in the order above.

## Output formats

- `ls -li <dir>`: `total <n>` (n = data blocks of the listed entries × 4, in KiB) then one line per entry:
  `<ino> <mode>. <nlink> student student <size> Aug 30 10:08 <name>` (+ ` -> <text>` for a symlink), the link count
  and size columns padded to equal width. Modes: `-rw-r--r--`, `drwxr-xr-x` (size 6), `lrwxrwxrwx`.
- `cat`: the data lines; errors `cat: /home/student/p2/s.txt: No such file or directory` (the shell expands `~`).
- `stat -c "%h %n" <path>`: `<nlink> /home/student/…`.
- `tail -f <path> &`: `[1] 4242`; `kill 4242`: `[1]+  Terminated              tail -f <path>`, or `bash: kill:
  (4242) - No such process`.

## Params

- `scene` (hidden select, set by the presets: the kit reserves `?preset=` for the preset id).
- `showBlocks` (toggle, default on): the block bar.
- `holdOpen` (toggle, default off): process 4242 (`tail -f`) has the preset's main file open from step 0 to the end
  (in `otvorena` until it is ended in step 4). Disabled in `sadrzaj`, where the file appears only in step 2.

## Presets and expected numbers

1. `primjer` (3 steps; `~/proba` with `datoteka.txt → 33616720` (0 B, count 1), `podmapa → 41962518` (dir, count 2)).
   1. `ls -li ~/proba` → `total 0`, `33616720 -rw-r--r--. 1 … 0 … datoteka.txt`, `41962518 drwxr-xr-x. 2 … 6 …
      podmapa`.
   2. `ln ~/proba/datoteka.txt ~/proba/tvrda-veza; ls -li ~/proba` → both names on 33616720, count 2; podmapa 2.
   3. `rm ~/proba/datoteka.txt; ls -li ~/proba` → one entry, count 1, same inode; free check `kept`.
2. `sadrzaj` (5 steps; nothing at the start).
   1. `mkdir -p ~/p2` → the table `~/p2` (empty).
   2. `printf 'prvi redak\n' > ~/p2/a.txt` → new inode 33616721, 11 B, 1 block (block 0).
   3. `ln ~/p2/a.txt ~/p2/b.txt` → count 1 → 2.
   4. `rm ~/p2/a.txt` → count 2 → 1, `kept`, still 1 block used.
   5. `cat ~/p2/b.txt` → `prvi redak`.
3. `simbolicka` (6 steps; `~/p2` with `a.txt → 33616721`, `prvi redak`, 1 block).
   1. `ln -s a.txt ~/p2/s.txt; ls -li ~/p2` → new inode 33616722 (`l`, count 1, size 5, 0 blocks); a.txt count 1.
   2. `cat ~/p2/s.txt` → resolution s.txt → 33616722 → `a.txt` → `~/p2/a.txt` → 33616721; `prvi redak`.
   3. `rm ~/p2/a.txt` → count 1 → 0, `freed`, 1 block freed (0 used).
   4. `cat ~/p2/s.txt` → `cat: /home/student/p2/s.txt: No such file or directory` (dangling).
   5. `printf 'novi redak\n' > ~/p2/a.txt` → new inode 33616723, 1 block.
   6. `cat ~/p2/s.txt` → `novi redak`.
   With `holdOpen`: step 3 is `postponed` (33616721 stays, count 0, open by 4242, its block hatched); step 4 still
   fails; step 5 takes block 1; 2 blocks used at the end.
4. `preimenuj` (5 steps; as `simbolicka`'s start).
   1. `ln ~/p2/a.txt ~/p2/h.txt` → count 2.
   2. `ln -s a.txt ~/p2/s.txt` → 33616722.
   3. `mv ~/p2/a.txt ~/p2/b.txt; ls -li ~/p2` → `b.txt` and `h.txt` on 33616721 (count 2), `s.txt -> a.txt`.
   4. `cat ~/p2/h.txt` → `prvi redak`.
   5. `cat ~/p2/s.txt` → `No such file or directory`.
5. `otvorena` (4 steps, `holdOpen` on; `~/p2` with `velika.log → 33616721`, 24576 B, 6 blocks (0–5), open by 4242).
   1. `ls -li ~/p2` → `total 24`, count 1.
   2. `rm ~/p2/velika.log` → count 0, `postponed`, 6 blocks still used.
   3. `ls -li ~/p2` → `total 0`, no entry; 6 blocks still used.
   4. `kill 4242` → the process ends, `freed`, 0 blocks used.
   With `holdOpen` off: step 2 is `freed` (0 blocks used) and step 4 prints `bash: kill: (4242) - No such process`.

## Out of scope

Inode exhaustion and `df`/`du` disagreement (`lnx-disk-full-mysteries`), permissions on links, `ln -f`/`-r`, bind
mounts, reflinks, `rm -r`, `mv` across filesystems, directory trees deeper than the drawn tables.
