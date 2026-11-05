<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-powershell-objects: notes

Task `docs/tasks/w3/win-powershell-objects.md` (thread t-0259, 2026-11-05). Stepper; no kit view fits (K1–K4 are
sequence, topology, rule table, block grid), so the page draws its own stage in HTML. Rules and expected results:
`SPEC.md`.

## Decisions

- **Layout.** Two lanes, bash on top, PowerShell below. Each lane: its name and one line on how it pipes; the pipeline
  row (command boxes, a pipe chip between them with the number of lines or objects in it, the last command's arrow,
  the terminal); and the inspector, which shows exactly what is in the pipe after this step's command. bash boxes say
  "process 1, 2, …"; the PowerShell boxes and the implicit `Out-Default` sit in one dashed frame "one process".
- **Lines and cards.** bash pipes show monospace strips (lines of text). PowerShell pipes show object cards: the type
  name and the properties the task uses (FileInfo: Name, Length, LastWriteTime, or Name, Extension, Length for the
  type task). The property the current cmdlet reads is highlighted. Formatting records are dashed cards with the table
  row they hold, or what they are.
- **Field markers.** On lines that the next command splits into fields (and on `sort -k5`'s output) every field gets a
  bracket and the fields that are used are numbered (`$5`, `$9`, `$NF`); a tenth field is numbered in red, dashed.
- **Broken.** The stage whose output is wrong gets a double red border and a ✕; the lines or objects that show why
  (the half name, the two lines in text order) are outlined with ✕; at the terminal each lane gets ✓ correct or
  ✕ wrong, checked against the answer computed from the data.
- **Pipe chips show the number only** (the full "7 lines" is the chip's label and tooltip, and the inspector's title):
  with the words, PowerShell's row did not fit in one line at 1920×1080.
- **Step 0 shows the folder** in both inspectors (name, bytes, modified): the same data for both sides. On the phone
  the time column is hidden.
- **The model computes both lanes once** (memoised on the four params) and `stateAt(p, n)` reveals stages 1..n; an
  unrun stage has no output and no issue. Pure and deterministic, JSON state.
- **Strings.** Commands, file names, type and property names are data (`translate="no"`), never translated. Lane names
  `bash` and `PowerShell` are the subject of the page (COMMON.md §1: a Windows course teaching PowerShell, a Linux one
  teaching bash).

## Deviations from the task

- **`task` options.** The task lists big-files / top-processes / count-by-extension, but its own presets `sort-text`
  and `format-early` need a sort task, and its model has one fixed directory listing (no process table). Built:
  `big-files`, `by-size` (new, for those two presets) and `by-extension` (count-by-extension). `top-processes` is left
  out. → OPEN.md is not edited (out of scope); listed in the report for the owner.
- **`by-size` PowerShell pipeline ends with `Format-Table`** (`Get-ChildItem | Sort-Object Length | Format-Table`), so
  `formatEarly` moves it in front of `Sort-Object` and the preset's line is exactly the task's
  (`Get-ChildItem | Format-Table | Sort-Object Length`). Both are 3 stages, 4 steps, as the task says.
- **Added param `numeric`** (bash `sort -k5 -n`): the task's `sort-text` says "`sort -k5 -n` fixes it"; a toggle lets
  the class see it. `formatEarly` and `numeric` are disabled with a reason outside `by-size`.
- **`format-early` sets `numeric` on**, so bash is right and only PowerShell is wrong in that preset (one point per
  preset).
- **Added preset `by-extension`** (key 5) for the third task. 4 + 1 presets.
- **The bash lane is shorter** than PowerShell's in two tasks (awk filters and prints in one command; bash has no
  formatting step). One step runs stage n of each lane that has one; the shorter lane says "no more commands" (the
  task's "advance both lanes by one stage"). `by-extension` is 5 steps (bash has four commands).
- **`ls -l` prints its `total` line**, as it does; awk's `$5 > 1048576` skips it and sort puts it first.
- **The task's two captions are used** at step 2 of `big-files` (`bAwk`, `pWhere`), each followed by one more
  sentence.
- **Entries in `sim.json`:** `space-in-name` and `format-early`.

## Sources

Cited from memory or the course book; no network access to Microsoft's documentation in this session.

- `uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`: definition *cjevovod* (the pipe joins standard output to
  standard input); „Obrada teksta" (`sort` compares by keys or the whole line, in the locale's collating sequence;
  `uniq` only sees adjacent repeats, hence `sort | uniq -c`); Šire o temi (the order depends on the locale); Primjer 1
  (sorting on a key that is not at the start of the line, `-k3 -n`).
- POSIX awk (default field splitting; strnum comparison), sort(1) (`-k`, `-n`, last-resort comparison), uniq(1)
  *(check: cited as the book cites them)*.
- Microsoft Learn: "about_Pipelines" (objects, one at a time, in one process), "about_Numeric_Literals" (KB/MB/GB
  multipliers) *(check title)*, "Where-Object", "Sort-Object" (`-Stable` exists in 7; default stability *(check)*),
  "Group-Object" (group order *(check)*), "Using Format commands to change output view" *(check)*.

## Checks

- **Real bash on this machine** (`node` script feeding the model's `ls -l`/`ls` text through the real later commands):
  every preset and `nameWithSpace` on all three tasks give exactly the model's terminal lines in `en_US.UTF-8`. In
  `C` and `C.UTF-8`, `ls -l | sort -k5` comes out in size order by accident (the right-aligning blanks count and
  shorter numbers have more of them); `sort -k5 -n` is right in all. The page's explanation says so. *(check: hr_HR.UTF-8
  is not installed here; expected to behave as en_US.UTF-8.)*
- **PowerShell not run** (no PowerShell here). *(check on the lab VM:)* `Get-ChildItem | Format-Table | Sort-Object
  Length` prints the table unsorted without an error; `Format-Table` emits the five record types; `Group-Object` lists
  groups in order of first appearance; the default view's columns, `Mode` string and date format.
- **Mutations:** 26 rule-breaks in `sim.js` (awk splitting, numeric vs text compare of `$5`, `$9` vs last field, field
  shift not flagged, sort key with blanks, `-n` ignored, both tie-breaks, `1MB` = 10⁶, `-gt` as `-ge`, missing
  property passing, Format-Table keeping properties, no-property not flagged, Sort-Object streaming, PowerShell stages
  as processes, uniq counting non-adjacent, outputs before run, no terminal step, issue before run, text order not
  flagged, listing order, total units, group order, both params ignored, space file missing): all 26 fail a test (one
  survived at first, an issue visible before its stage ran; a test was added).
- `npm run gate -- win-powershell-objects`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and
  en, reviewed; plus every preset at every step with a local Playwright script (checking nothing overflows the stage or
  is clipped in the inspectors). Fixed from them: the PowerShell row wrapping, a clipped fourth card, a clipped
  12-line terminal, a property list printed as `[object HTMLElement]`, the folder table breaking words on the phone.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| pipe | cijev (UL ch06) |
| object | objekt |
| property | svojstvo |
| cmdlet | *cmdlet* (naredba PowerShella) |
| formatting | oblikovanje ispisa *(check)* |
| formatting record | zapis za oblikovanje |

(`pipeline` — cjevovod, `standard output` — standardni izlaz and `process` — proces are in the glossary and used as
`[[…]]`.)

## Shared requests

- **models/:** none needed. `lnx-pipes-redirection` has no model in `models/` and its descriptor model is not what this
  page needs (no fd tables here; the task says "drops the fd ports"), so nothing was copied from it. The text tools
  here (`fields`, `sortLines`, `uniqCount`, `lsLong`) are pure and string-free should a later sim want them.

## Tags

Topic `windows-admin`, tag `shell` (both in `tags.json`).

## Time

Start 2026-11-05 01:17 (clock at `desk status`), done about 01:58: about 40 min in one session. Roughly: reading and
design 10 min, model, real-bash check and tests 8 min, strings and page 7 min, gate and layout fixes from the
screenshots 7 min, mutations 2 min, the fresh review (run in parallel with NOTES) and its fixes 8 min.

## Review

A fresh reviewer read the task, SPEC.md and the code, ran the real tools (mawk, GNU sort) against the model in
en_US.UTF-8 and C (every bash terminal matches), rendered every task × param combination at every step in both
languages (no console errors, no logic bugs in the captions or the page), and ran 37 mutations of its own (10 survived:
8 equivalent or unreachable, 2 untested). Fixed from it:

- **Locale:** the sort-text caption now says the text order holds in a language locale such as en_US.UTF-8 and that in
  the C locale it comes out right by accident (the task's `sort -k5` is kept; `sort -b -k5` would be locale-proof but
  adds a flag the task does not have; see the report).
- **Stability:** the page no longer states `Sort-Object` stability as fact: "here … (only -Stable guarantees it)", and
  the explanation names `-Stable` and `Sort-Object Length, Name`. Test renamed.
- **Clipping** in two non-preset combinations (by-size with the space name, with and without formatEarly): the
  inspector text is now at the 16 px floor with a tighter line height, the verdict sits in the inspector title, and
  the bash lane's name sits beside its row. All 144 task × param × step × language combinations were then measured:
  nothing clipped or outside the stage.
- **Wording:** "rest of the line" → "the whole line, which here differs only in the name" (`sort -n`'s last resort);
  English "In bash" said twice; Croatian "bez naredbe sort ispred nje"; the explanation's first sentence ("Kad je
  redak [[pipeline]], …") and the term rule order ("*cmdlet* (naredba PowerShella)").
- **Tests** for its two surviving mutants that mattered: awk's `$5 > 1048576` is strict on a 1048576 line, and
  `awk -F.` prints `$NF` (`a.tar.gz` → `gz`, `README` → `README`).
- **SPEC simplifications:** `Group-Object`'s order (5.1: first appearance; 7 may sort *(check)*) and its `Group` column
  (PowerShell 7 shows full paths).
