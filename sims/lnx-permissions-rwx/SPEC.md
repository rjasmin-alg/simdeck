<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-permissions-rwx: specification

One concept: **nine bits, octal notation, umask clearing bits from the defaults (666 with umask 077 gives 600).**
The student toggles bits, picks a `chmod` command and a umask, and creates a file or a directory.

Task: `docs/tasks/w2/lnx-permissions-rwx.md`. Catalogue: `lnx-permissions-rwx` (`docs/catalogue.md` §4.4).
Class: explorer. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL07]** `uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, "Što smijete s datotekom", "Što treba
  znati": the nine bits and the type character (`touch proba` → `-rw-r--r--`); r, w, x and x as *search* on a
  directory; `S_IRWXU` 0700 = `S_IRUSR` 0400 + `S_IWUSR` 0200 + `S_IXUSR` 0100; `chmod 640` → `-rw-r-----`;
  octal is absolute; symbolic `+`/`-` change only the named bits, `=` clears the named class first;
  `chmod u+x,g-r` on 640 → `-rwx------`; `chmod 640` on `-rwx------` would erase the x; `umask` → `0022`;
  `umask 077; touch tajna` → `-rw-------`; the mask lives in the shell's execution environment and acts on files
  created after it. "Šire o temi": the symbolic `umask` and its inverted `+`/`-` (explanation only).
- **[UL07-fig]** `uvod-u-linux/assets/diagrams/chapter-07/devet-bitova-dozvola.svg`: type character, three groups of
  three, one octal digit per group as the sum 4 + 2 + 1. Used for the strip's layout; nothing copied.
- **[POSIX]** POSIX `chmod` (EXTENDED DESCRIPTION: octal absolute, `symbolic_mode` grammar, the `=` operator),
  `umask` (DESCRIPTION, OPERANDS), `<sys/stat.h>` (`S_IRUSR` … `S_IXOTH`), §3 File Permission Bits. The task
  names POSIX.1-2017; UL07's footnotes cite the same sections in POSIX.1-2024. The parts used here are the same in
  both. *(check: not re-read in either edition for this task; taken from UL07's text and footnotes.)*
- **[GNU]** GNU coreutils manual, "Numeric Modes" and "Symbolic Modes", as cited in UL07.
- **[RUN]** Every expected number below was run on a Linux machine with GNU bash 5.2.21 and GNU coreutils 9.4
  (`umask m; touch f; mkdir d; stat -c %a`, and `chmod b x; chmod c x` for every start × command of the page):
  all agree with the model. `sim.test.js` pins the whole 7 × 5 table from that run.

## Scene

- **Left, the chmod panel.** The command line (`chmod 640 proba`, or none), the start strip ("prije"), and the
  result strip ("poslije"), large. A strip is the type character (`-` or `d`) and nine cells in three groups
  (vlasnik / grupa / ostali), each r, w, x; a set cell is filled and shows its letter, a clear cell is hollow and
  shows `-`. Under the result, the same value three ways: `ls -l` string, octal (each digit as its sum,
  `4+2+0 = 6`), symbolic (`u=rw,g=r,o=`). Cells that differ between start and result are outlined (hl). A line under
  the result says what x means for this kind (execute or search).
- **Right, the create panel.** The command line (`umask 022` then `touch nova` / `mkdir nova`), the base strip (666 or
  777), the umask strip (its set cells are what is cleared), the result strip: bits the mask removed are hatched and
  outlined. Under it the three notations, the bitwise rule (`666 & ~077 = 600`) and the arithmetic difference
  struck out when it differs (`666 − 077 = 567`), or marked "here it happens to agree" when it does not. Umask bits
  the base does not have (x on a file) are drawn dotted: they have no effect.
- **Clicks.** Every cell of the start strip and of the result strip is a button. A click on the start strip toggles
  that bit of the start; a click on the result strip takes the result as the new start and toggles that bit. Either
  way the command becomes "—" (none), so the result equals the new start.

## Params

| key | type | values | default |
|---|---|---|---|
| `kind` | choice | `file`, `dir` | `file` |
| `before` | select | `000`, `600`, `640`, `644`, `700`, `755`, `777` | `644` |
| `cmd` | select | `none` (—), `640`, `u+x,g-r`, `g-w`, `755`, `o=` (shown as `chmod …`) | `none` |
| `umask` | choice | `000`, `002`, `022`, `027`, `077` | `022` |
| `toggled` | range, hidden | 0 … 511: a XOR mask over `before`, written by cell clicks | 0 |

`toggled` is how a click reaches a start that is not in the `before` list (the kit's selects take only their
options, and the URL keeps it). Picking another `before` in the select clears `toggled` (the page does it).

## State

```
{ kind, xMeaning: 'execute' | 'search',
  start, toggled, before,                // before = start XOR toggled, 0 … 0o777
  cmd, form: 'none' | 'octal' | 'symbolic', written: [bit indices the command writes],
  after, changedBits: [indices where before ≠ after], lost: [set before, clear after], gained: [the reverse],
  lostUnasked: [lost bits whose group's octal digit is not 0; octal only, else []],
  umask, base, created, cleared: [set in base and in umask], noEffect: [set in umask, clear in base],
  difference: base − umask as numbers (or null below 0), differenceAgrees: difference === created,
  views: { before, after, base, umask, created }: { mode, bits[9], ls, octal, symbolic, digits[3] } }
```

Bit index i = 0 … 8 from the left (owner r = 0, other x = 8); its value is `1 << (8 − i)`.

## Rules

1. **Nine bits, three groups, the type in front.** Order owner, group, other; inside a group r, w, x; a letter is a
   set bit, a dash a clear one. The first character is the type, `-` file, `d` directory, not a permission. [UL07,
   UL07-fig]
2. **Octal digit = r 4 + w 2 + x 1 per group,** written owner, group, other: `rw-r-----` = 640, `S_IRUSR` 0400,
   `S_IWUSR` 0200, `S_IXUSR` 0100. [UL07, `<sys/stat.h>`]
3. **Octal chmod is absolute:** all nine bits are written (`written` = 0 … 8), the start plays no part. `chmod 640`
   on `rwx------` drops the x. Operands of 1 to 4 octal digits; a value above 0777 (the special bits) is out of
   scope and rejected. [UL07, POSIX chmod]
4. **Symbolic chmod is relative:** `+` sets and `-` clears only the named bits; `=` clears the named classes first,
   then sets the listed bits (`o=` clears the others' three). Clauses are applied left to right, each on the result
   of the previous one; one clause may hold several actions (`u+x-w`). `a` is u, g and o. Bits outside `written`
   never change. A clause without `who` (`+x`, which POSIX filters through the umask), `X`, `s`, `t` and permission
   copies (`g=u`) are out of scope and rejected. [UL07, POSIX chmod]
5. **New mode = base AND NOT umask;** base 0666 for a regular file (`touch`), 0777 for a directory (`mkdir`). It is
   clearing bits, not subtracting: 666 with 077 gives 600, not the octal difference 567; 666 with 033 gives 644, not
   633. [UL07, POSIX umask; the bases checked in RUN]
6. **x on a directory means search** (pass through), not execute: `xMeaning` is `search` for `dir`. [UL07]
7. **The umask belongs to the shell** and acts only on files created after it is set: the umask changes only the
   create panel, never the chmod panel's file; `before` and `cmd` never change the create panel. [UL07, POSIX umask]
8. **Edge: umask x bits do nothing to a file,** because 0666 has no x: 022 and 033 give the same file 644; such bits
   are `noEffect`. On a directory they do clear (027 → 750). [derived from rule 5; RUN]

### Tie-breaks and edge cases

- `=` with an empty list (`o=`) clears the class and sets nothing.
- `+` of a bit already set and `-` of a bit already clear change nothing (`g-w` on 644: `changedBits` empty).
- A later clause wins over an earlier one on the same bit (`u+x,u-x` → x clear).
- `toggled` outside 0 … 511 is masked to nine bits; `before` = `start` XOR `toggled`.
- The difference is reported only when base ≥ umask as numbers; otherwise `null`. With the page's options it is
  never negative.
- A cell click on the result strip makes the result the new start. If the new start is one of the `before` options,
  the click sets `before` to it and `toggled` to 0 (the select then shows it); otherwise `toggled` = new start XOR
  `start`. Either way `cmd` becomes `none`.

## Expected numbers

| case | result |
|---|---|
| umask 000 / 002 / 022 / 027 / 077, file | 666 / 664 / 644 / 640 / 600 |
| umask 000 / 002 / 022 / 027 / 077, dir | 777 / 775 / 755 / 750 / 700 |
| umask 033 file / dir (model only) | 644 / 744 |
| 666 − 077 / 666 − 033 / 666 − 027 (arithmetic) | 567 / 633 / 637 (all ≠ the result) |
| 666 − 022, 666 − 002, 777 − anything on the list | equal to the result |
| 644 + `chmod 640` | 640 `-rw-r-----`, changed [6] (other r) |
| 640 + `chmod u+x,g-r` | 700 `-rwx------`, changed [2, 3], owner rw untouched |
| 700 + `chmod 640` | 640, lost [2] (owner x), gained [3] (group r) |
| 644 + `chmod g-w` | 644, nothing changed |
| 777 + `chmod o=` / `g-w` / `u+x,g-r` | 770 / 757 / 737 |
| 755 + `chmod u+x,g-r` / `o=` | 715 / 750 |

Full start × command table: `sim.test.js` (`RUN` constant), 35 rows from the real run.

Symbolic notation: `u=rw,g=r,o=` for 640, `u=,g=,o=` for 000, `u=rwx,g=rwx,o=rwx` for 777. Applying a mode's
symbolic notation with chmod gives that mode from any start (a test runs all 512 × a few starts).

## Presets

| # | id | params | shows |
|---|---|---|---|
| 1 | `touch-default` | kind file, umask 022 | new file `-rw-r--r--` 644 |
| 2 | `chmod-640` | before 644, cmd 640 | `-rw-r-----`, other r outlined |
| 3 | `symbolic` | before 640, cmd `u+x,g-r` | `-rwx------` 700; owner rw untouched |
| 4 | `octal-erases` | before 700, cmd 640 | 640: owner x gone though nobody named it |
| 5 | `umask-077` | kind file, umask 077 | `-rw-------` 600; 567 struck out |
| 6 | `dir-umask` | kind dir, umask 022, before 755 | `drwxr-xr-x` 755; x = search |

The task's second half of preset 6 (umask 027, file → 640) is a pinned number in the tests, not a seventh preset.

## Captions

The page keeps a focus, `nextFocus()` in `sim.js`: a newly loaded preset's own panel (`focus` in the preset list);
else the panel whose params changed (`kind`, `umask` → create; `before`, `cmd`, `toggled` → chmod); else the focus it
had; at first, create when `cmd` is none, else chmod. `captionKey(state, focus)` picks the string; tests cover every
branch.

- chmod, none: the file's mode in the three notations; "click a bit or pick a command".
- chmod, octal, one bit lost that the operand did not ask for (`lostUnasked`, its group's digit is not 0): task caption (hr "`chmod 640` piše svih devet bitova: izvršni bit vlasnika nestao je, iako
  ga nitko nije spomenuo.", en "`chmod 640` writes all nine bits: the owner's execute bit is gone though nobody named
  it."); with several such bits, their count.
- chmod, octal, bits lost only in groups whose digit is 0 (`chmod 640` on 644): "a 0 digit cleared n bits, as asked".
  The reviewer's point: "nobody named it" is false there, the 0 asked for it.
- chmod, octal, nothing lost: all nine written, whatever was there.
- chmod, symbolic: only the named bits; how many changed, the rest untouched; or nothing changed.
- create, difference differs: task caption (hr "Maska 077 ne oduzima broj od 666: briše bitove, pa nova datoteka ima
  600.", en "Umask 077 doesn't subtract from 666: it clears bits, so the new file gets 600.").
- create, difference agrees: what the mask clears; subtraction happens to agree here.
- create, nothing cleared (umask 000; or only no-effect bits, e.g. 001 on a file, off the page's list).
- plus, when `noEffect` is not empty: the x bits of the mask do nothing to a file.

## Out of scope

setuid, setgid, sticky (`lnx-special-bits`), the access check (`lnx-access-decision`), ACLs, the symbolic `umask`
and its inverted `+`/`-` (one paragraph in the explanation), `chmod` without `who`, `X`, `s`, `t`, permission copies.
