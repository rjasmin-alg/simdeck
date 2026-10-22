<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-links-inodes: notes

New stepper (task `docs/tasks/w2/lnx-links-inodes.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The task names no kit view; the scene is drawn by the page, and the block bar is kit view **K3** (`kit/blockgrid.js`,
one row of 16 cells).

## Decisions

- **Scene:** left, the directory's entries (one row each: name, `⇢ text` for a symlink, `→ inode number`, a bar in the
  inode's colour); right, one card per inode (number, type letter in a box, the type in words, link count, the process
  that has it open, data); between them an SVG lane of arrows drawn after layout in CSS pixels, from the layout boxes
  (`offsetLeft`/`offsetTop`), so the pop animation's transform does not move them. Above, the shell strip (prompt,
  command, output lines; the strip keeps the height of the preset's longest output so the scene does not jump; the
  process holding a file at the right). Below, the block bar.
- **Shapes, not only colour:** a file card has square corners, a directory a folder tab, a symlink round corners; each
  also carries `-`, `d` or `l` and the word. Hard pointers are solid, symlink paths dashed, a broken path grey with a red
  ✕. A row removed in this step stays one step, struck, with "uklonjen"/"preimenovan"; a freed card stays one step,
  dashed and struck, "oslobođen". An inode with no name that a process holds is hatched with a "bez imena" badge, and its
  blocks are K3 `soft` (hatched). Freed blocks show one step as K3 `dead`.
- **"No entry" rows:** when a symlink in the table names a path with no entry, a dashed row with that name and "nema
  unosa" stands where the name would sort; the symlink's dashed arrow ends there, broken. It shows *where* the link
  points even though nothing is there, which is the point of a dangling link.
- **Lookup of this step:** the entries and cards the resolution passed get a thick ink outline (`li-hop`), and their
  arrows are drawn thick with the highlight halo. "Changed" (kit yellow + outline) marks new or renamed entries, new or
  rewritten cards, and the link count that changed (inline highlight), as the task's legend asks.
- **Commands with a listing:** `ln …; ls -li ~/proba` and `rm …; ls -li ~/proba` are one step each, as in the book; the
  step's `then` runs `ls -li` after the command (not after a failed one).
- **Step counts** follow the task (3, 5, 6, 5, 4), read as kit steps (commands), so step 0 is the scene before the
  first command. `primjer`'s three are `ls -li` (count 1), `ln; ls -li` (2), `rm; ls -li` (1), matching the book's
  "u prethodnom ispisu stajala jedinica". `simbolicka` adds `; ls -li ~/p2` to `ln -s` so `l` and `->` are seen.
  `otvorena` is `ls -li`, `rm`, `ls -li`, `kill 4242` (the task: "rm the last name → count 0, the block bar does not
  shrink; the process ends → space freed").
- **`holdOpen`:** process 4242 (`tail -f <the preset's main file>`) has the file open from step 0 to the end; in
  `otvorena` it ends at step 4 (`kill 4242`). It is disabled with a reason in `sadrzaj`, where the file appears only
  in step 2. With it off, `otvorena` frees the space at `rm` and step 4 prints `bash: kill: (4242) - No such
  process`; the caption says why. With it on in `simbolicka`, `rm a.txt` is postponed and `cat s.txt` still fails: the
  data exists but no name leads to it — the sharpest form of "a symlink names a path, not a file".
- **`preset` param → hidden `scene`:** the kit reserves `?preset=` for the preset id, so the select is `scene`, hidden
  (`visible: false`) like `lnx-overlayfs-layers`; the presets set it.
- **Numbers:** inode numbers from the book (`33616720`, `41962518`); new files and symlinks count up from `33616721`,
  new directories from `41962519`; a freed number is not reused in a run (so the re-created `a.txt` visibly gets a new
  inode). Blocks: 16 × 4 KiB, first fit; an empty file, a directory and a short symlink take none (the book's
  `total 0` with `podmapa` at size 6). `ls -li` pads the count and size columns; `total` is blocks × 4.
- **Paths in messages** are what the shell passes (`~` expanded): `cat: /home/student/p2/s.txt: No such file or
  directory`, `stat` prints `/home/student/…` as in the book.
- **Model is pure and promotable** (a later `lnx-disk-full-mysteries` may want it): `resolve`, `apply`, `open`,
  `lsLines` work on plain `{ dirs, inodes, blocks, procs }` with no words.
- **General helpers beyond the presets** (tested, not in a preset): `ln` errors EXDEV (`/mnt/usb` is a second
  filesystem), EPERM (directory), EEXIST, ENOENT; `rm` of a directory; `mv` onto an existing name (replace, count and
  free check); `mkdir` in a drawn directory (count 2, parent +1); ELOOP after 40 symlinks; writing through a dangling
  symlink creates the file it names; `stat` does not follow.

## Deviations from the task

- **Rule 2's failures** (EXDEV, EPERM) are in the model and tests but in no preset: the five presets and their step
  counts are the task's, and none of them links across filesystems or a directory.
- **Directory inodes:** only `podmapa` is drawn as a card; `~/proba` and `~/p2` themselves are tables, not cards (their
  own entries live in `~`, which is not drawn), so `mkdir -p ~/p2` adds a table but no card.
- **Two directory tables:** the scene supports several, but each preset uses one (`~/proba` or `~/p2`), as the
  task's presets do.
- **Title (hr):** "Imena, inodei i poveznice" rather than a word-for-word "Čvrste i simboličke poveznice i inodei",
  which wraps the header at 1920×1080; the owner may prefer the literal one.

## Sources

- UL ch05 "Rad s datotekama i direktorijima" (`ln`, `ls -li` with 33616720/41962518, `rm`, the definitions, the `~/p2`
  experiment), "Šire o temi" (`unlink()` on a symlink, `stat -c "%h %n"`), "Primjer 3", digression "Dva broja u istom
  retku"; diagram `assets/diagrams/chapter-05/unos-u-direktoriju-i-brojac-poveznica.svg`. Read in full for this task.
- POSIX.1-2024 `unlink()` (quoted in the book's footnotes ch5-unlink-*), `link()` [EXDEV] [EEXIST], `symlink()`,
  `rename()`: from memory *(check)*.
- Linux link(2) [EPERM] for directories and not dereferencing a symlink, path_resolution(7) (relative symlink text
  from the link's directory; 40-link limit, ELOOP), symlink(7): from memory *(check)*.
- Short symlinks stored in the inode with no data block; XFS small directories inline (size 6): from memory and the
  book's `total 0` *(check)*.
- Message texts (`ln: failed to create hard link … Invalid cross-device link`, `hard link not allowed for directory`,
  `stat: cannot statx`, `[1]+  Terminated`): GNU coreutils and bash wording from memory *(check)*.
- Numbers: printed by a script from the model before the page was written, and asserted in `sim.test.js`.

## Concepts, not tools

No product is named. Commands appear where they are the subject (`ln`, `ln -s`, `ls -li`, `rm`, `mv`, `cat`,
`printf >`, `stat`, `mkdir -p`, `tail -f`, `kill`), all from the task or the book. The prompt
`[student@demosrv1 ~]$` is the book's.

## Term pairs

From the glossary: *directory entry* (unos u direktoriju), *link count* (brojač poveznica), *process* (proces), in the
explanation. Missing from `kit/glossary.js`, written out in both tables (`<em lang="en">` in the explanation):

- *inode* — **inode** (the book has no Croatian term; declined as a loanword: "inodea", "inodeu"; UL ch11 says
  "mjesta za zapise o datotekama") *(check)*.
- *hard link* — **čvrsta poveznica** (UL ch15/ch23; ch05 names the file `tvrda-veza`).
- *symbolic link* — **simbolička poveznica** (UL ch05 "Šire o temi").
- *dangling link* — **viseća poveznica** (not in the book) *(check)*.

*file descriptor* is avoided: the glossary's "opisnik datoteke" differs from the book's "datotečni deskriptor" (an
open item in `docs/tasks/OPEN.md`); the page says "a process holds the file open" instead.

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (the same request as
  `lnx-overlayfs-layers`); worked around in the page CSS.
- **Kit (optional):** a small "pointer lane" helper (arrows between two HTML columns, measured from layout boxes, redrawn
  on resize) would serve this page and other entry → object drawings; the page draws its own.

## Checks

- `node --test sims/lnx-links-inodes/sim.test.js`: 46 tests, tie-breaks first (ls order, first fit, no number reuse,
  column padding, the order of effects), one or more per rule, the less common branches, the page-facing marks
  (`changed`, `gone`), the presets' numbers, then the template's generic block.
- **Mutations:** my 29 one-at-a-time mutations of `sim.js` (ls unsorted, last fit, number reuse, no padding, `ln`
  copying or not counting, no EXDEV/EPERM/EEXIST, `ln` following a symlink, `rm` not counting / removing every name /
  always freeing / ignoring open processes / removing a directory / following a symlink, a symlink raising its target's
  count / taking a block / resolving from a fixed directory / bound to an inode, no 40-link limit, `mv` making a new
  inode / not counting a replaced one, a directory with count 1 / the parent not +1, `stat` following, writing through a
  dangling link failing, `kill` not closing, a directory taking a block): all 29 fail a test (the 40-link limit only
  after a boundary test was added). The reviewer's 40: all fail a test after the fixes below (one survivor was
  redundant code, removed).
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; checked every number
  against the book; read every caption in both languages with `holdOpen` on and off; ran 40 mutations of its own, 24
  survived; no console errors in any preset × step × holdOpen × language at 1920×1080 or 375×812). Fixed from it:
  plural agreement of whole clauses ("pa je 1 blok opet slobodan", "1 block stays in use"); the term rule in captions
  (*directory entry*, *link count* from the glossary, *inode*, *symbolic link*, *hard link*, *dangling* written out at
  first mention); `capHeld` names the file it holds; a dedicated caption for `cat h.txt` after `mv`; `mv` onto another
  name of the same inode is a no-op (rename()); a `/home/student/…` symlink text resolves; a freed card no longer shows
  its data; the lookup-path outline is in the legend; Croatian wording ("uklanjanje imena", "u direktoriju same
  poveznice", "jer ga proces drži otvorenim", the switch named in `capKillNone`); tests for the 24 survivors. Left as
  it is: in the step that removes or renames a name, the broken dashed arrow ends at the struck row, and the "nema
  unosa" row appears from the next step (the struck row is where the name was).
- `npm run gate -- lnx-links-inodes`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus every preset at its key step.

## Time

2026-10-22 16:17 to 16:50, about 35 minutes (including a 9-minute fresh review).
