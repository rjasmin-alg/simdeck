<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-powershell-objects: specification

One concept: **the same task in two pipelines.** bash passes lines of text from process to process; PowerShell passes
objects with properties inside one process. The student steps both pipelines stage by stage and inspects what is in
each pipe. Task: `docs/tasks/w3/win-powershell-objects.md`; catalogue §4.5.7, overlap §5.14 (built as a comparison
against `lnx-pipes-redirection`).

Unverified items are marked *(check)*; see also `NOTES.md`.

## Data (one fixed listing, both lanes)

Folder `~/dokumenti` (bash) and `C:\Users\ana\Dokumenti` (PowerShell), the same six files, in name order:

| name | bytes | modified |
|---|---:|---|
| arhiva.zip | 7 340 032 | 2026-10-28 16:02 |
| bilješke.txt | 980 | 2026-11-04 08:30 |
| predavanje.mp4 | 1 048 577 | 2026-11-03 09:10 |
| prezentacija.pptx | 3 145 728 | 2026-11-03 09:05 |
| raspored.csv | 4 096 | 2026-11-03 10:15 |
| tablica.csv | 4 096 | 2026-11-03 10:15 |

Three files are over 1 MiB (1 048 576); `predavanje.mp4` is over by one byte. `raspored.csv` and `tablica.csv` tie on
size and time, so only the name tells them apart (the tie-break below). The `nameWithSpace` param adds
`godišnji izvještaj.pdf`, 2 516 582 bytes (2.4 MiB), modified 2026-11-02 12:00 (derived).

`ls -l` writes `total N` first, then `-rw-r--r-- 1 ana ana <size> <Mon DD HH:MM> <name>` with the size right-aligned
to the widest size. `N` counts 1 KiB units of allocated 4 KiB blocks: 11 280 for the six files, 13 740 with the
seventh *(check: assumes 4 KiB blocks and no sparse files; the number plays no part in any rule)*.

## Rules

1. **A bash pipe carries a byte stream** from one process's standard output to the next one's standard input; what
   the text means is up to each program (UL ch06 „Tokovi, preusmjeravanje i cjevovodi", definicija *cjevovod*). Model:
   every bash stage writes strings; each bash command is its own process; the terminal shows the last stage's lines
   unchanged.
2. **A PowerShell pipe passes .NET objects, one at a time, to the next command in the same process** (Microsoft
   "about_Pipelines"). Model: every PowerShell stage passes `{ type, props }`; all stages are process 0; only the
   implicit `Out-Default` at the end turns them into text.
3. **Filtering in bash means parsing text.** `awk` splits a line into fields at runs of blanks, ignoring leading ones
   (POSIX awk, default FS). A name with a space adds a field: `godišnji izvještaj.pdf` gives NF = 10 and `$9` =
   `godišnji` (derived). A field that looks like a number compares as a number, else as text, so the `total` line
   (no field 5) never passes `$5 > 1048576`.
4. **Filtering in PowerShell reads a property:** `Where-Object Length -gt 1MB` compares the number `Length`; spaces in
   names do not matter (about_Pipelines, Where-Object). `1MB` = 1 048 576; KB, MB, GB are powers of 1024
   (about_Numeric_Literals *(check title)*). `-gt` is strict. An object without the property does not pass.
5. **Sorting a number:** `sort -k5` compares from field 5 to the end of the line as text, so `1048577` sorts before
   `980` (1 < 9); `sort -k5 -n` compares field 5 as a number. Equal keys fall back to the whole line (sort's last-resort
   comparison). `Sort-Object Length` compares the number property (sort(1), Sort-Object). **Locale:** the model is
   the course machines' language locale (`en_US.UTF-8`), in which the blanks that right-align ls's size column do not
   count. In the C locale (and C.UTF-8) they do count, and shorter numbers then come first by accident; `sort -n` is
   right in both (checked on this machine, NOTES.md).
6. **Formatting comes last:** `Format-Table` emits formatting records (FormatStartData, GroupStartData, one
   FormatEntryData per object, GroupEndData, FormatEndData) that carry the table's text, not the objects'
   properties; a command after it finds no `Length` or `Name` (Microsoft "Using Format commands to change output
   view" *(check)*). `Sort-Object Length` after it finds no key on any record and keeps the order, so the table
   prints unsorted *(check: exact behaviour; no error assumed)*.
7. **`sort`, `Sort-Object` and `Group-Object` read all input before their first output;** the other stages stream
   (UL ch06 Šire o temi for `sort`; about_Pipelines "one at a time" *(check wording)*). Model: `collects: true` on
   exactly those three; shown as a badge, not as timing.

**Tie-break** (decision, stated on the page): equal sizes sort by name in both lanes. bash: the rest of the line
(same time, so the name) decides, whatever the input order. PowerShell: `Sort-Object` keeps the arrival order of equal keys
here, and the objects arrive in name order. That is not guaranteed: `-Stable` (PowerShell 7) or `Sort-Object Length,
Name` would guarantee it; with this few objects .NET's sort behaves stably *(check)*. The page says "here" and names
`-Stable`. Both listings are in name order.

## Stepping

`steps = max(bash stages, PowerShell stages) + 1`. Step 0: nothing has run; the inspectors show the folder. Step
n (1..S): stage n of each lane runs, if the lane has one; its output is in the pipe after it. A lane with fewer
stages says "no more commands" and keeps showing its last output. Step S + 1: the terminal; bash prints its lines,
PowerShell's `Out-Default` formats the objects (or prints the formatting records it got). `broken` is the first stage,
by position (bash first), whose output is wrong for the task, from the step it runs: `field-shift`, `text-order`
or `no-property`. At the terminal each lane is checked against the answer computed straight from the data.

## Tasks, presets and expected results

| task | bash | PowerShell | steps |
|---|---|---|---|
| `big-files` | `ls -l \| awk '$5 > 1048576 {print $9}'` | `Get-ChildItem \| Where-Object Length -gt 1MB \| Select-Object Name` | 4 |
| `by-size` | `ls -l \| sort -k5` (`-n` with `numeric`) | `Get-ChildItem \| Sort-Object Length \| Format-Table`; with `formatEarly`: `Get-ChildItem \| Format-Table \| Sort-Object Length` | 4 |
| `by-extension` | `ls \| awk -F. '{print $NF}' \| sort \| uniq -c` | `Get-ChildItem \| Group-Object Extension` | 5 |

| preset | params | expected |
|---|---|---|
| `big-files` | task big-files | both: `arhiva.zip`, `predavanje.mp4`, `prezentacija.pptx` (awk keeps 3 of 7 lines, Where-Object 3 of 6 objects) |
| `space-in-name` | + nameWithSpace | bash prints `godišnji` (field 9 of 10), PowerShell `godišnji izvještaj.pdf`; bash wrong at awk (`field-shift`) |
| `sort-text` | task by-size | bash: total, 1048577, 3145728, 4096 raspored, 4096 tablica, 7340032, 980 (wrong at sort, `text-order`, pair 1048577 / 980); PowerShell: 980, 4096 raspored, 4096 tablica, 1048577, 3145728, 7340032 |
| `format-early` | by-size, formatEarly, numeric | bash with `-n` is right; PowerShell's table stays in name order, wrong at Sort-Object (`no-property`, 10 records) |
| `by-extension` | task by-extension | bash `2 csv, 1 mp4, 1 pptx, 1 txt, 1 zip`; PowerShell groups `.zip .txt .mp4 .pptx .csv` (first appearance, as Windows PowerShell 5.1; PowerShell 7 may sort the groups *(check)*; the check compares counts only, and no caption states the order) with counts 1 1 1 1 2; both right |

## Simplifications

- One directory, no subfolders; the `ls -l` owner, mode and link count are fixed; dates in ls's recent-file form.
- PowerShell's default views are simplified: `Directory:` line, `Mode` `-a---`, `LastWriteTime` in en-US short form,
  column widths from the content *(check: layout differs in detail between PowerShell 5.1 and 7)*.
- `Group-Object`'s `Group` column shows file names; PowerShell 7 prints each FileInfo by its full path there.
- The sort-text caption names the locale: in the C locale `ls -l | sort -k5` comes out in size order by accident.
- No timing: streaming and collecting are shown as a badge and a caption, not as interleaved steps.
- Out of scope (task): redirection and stderr, parameter binding by property name, PowerShell on Linux, JSON text
  tools, performance.
