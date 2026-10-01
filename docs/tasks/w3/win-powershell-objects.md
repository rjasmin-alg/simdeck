# win-powershell-objects: PowerShell pipes objects, bash pipes text

| | |
|---|---|
| Task | `win-powershell-objects` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-powershell-objects` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-powershell-objects/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1, UL |
| Topic / tags / level | `windows-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-pipes-redirection` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the same task in both pipelines**.

The student: step each stage, inspect what flows.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-pipes-redirection/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Catalogue seed: → §5.14
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`, „Tokovi, preusmjeravanje i cjevovodi" (definicije *cjevovod*, *standardni izlaz*) and „Obrada teksta" (`sort`, `awk`-style field work); Primjer 1 (poredak po nečemu što nije na početku retka).
- Microsoft Learn: "about_Pipelines", "about_Numeric_Literals", "Where-Object", "Sort-Object", "Using Format commands to change output view" *(check titles)*.

## Overlaps (catalogue §5)

- **§5.14 Pipelines:** Separate pages; the PowerShell page is built as a comparison against the bash one.

## Model and presets

- **Scene:** two lanes, one task. Top lane bash: process boxes joined by pipes, each pipe carrying **lines of
  text** (bytes). Bottom lane PowerShell: cmdlet boxes joined by pipes carrying **object cards** (type name and
  properties, e.g. `FileInfo {Name, Length, LastWriteTime}`). The stage being stepped is lit in both lanes; an
  inspector shows exactly what is in the pipe after it.
- **State:** `{ task, data: [{name, size, mtime}], bash: {stages: [{cmd, out: [lines]}]}, ps: {stages: [{cmd,
  out: [{type, props}]}]}, at, broken: null|{lane, stage, why} }`; both lanes are computed from the same `data`
  (a fixed directory listing), so the outcomes can be compared.
- **One step:** advance both lanes by one stage, in order: run the stage on its input → show its output in the
  pipe → compare the two lanes' outputs in one caption. The last step is the terminal: bash prints lines as
  they are; PowerShell formats the objects (implicit `Out-Default`).
- **Rules:**
  1. A bash pipe carries a byte stream from one process's standard output to the next one's standard input;
     what the text means is up to each program (UL ch6 „Tokovi, preusmjeravanje i cjevovodi", definicija
     *cjevovod*).
  2. A PowerShell pipe passes .NET objects, one at a time, to the next command in the same process
     (Microsoft "about_Pipelines").
  3. Filtering in bash means parsing text (fields by whitespace for `awk`, columns by position); a name with a
     space shifts the fields (derived; `awk` field splitting, POSIX).
  4. Filtering in PowerShell reads a property (`Where-Object Length -gt 1MB`); spaces in names do not matter
     (about_Pipelines, `Where-Object` docs). `1MB` = 1 048 576 (about_Numeric_Literals *(check title)*).
  5. Sorting a number: bash needs `sort -n` on the right column, else it sorts as text ("10" < "9");
     `Sort-Object Length` sorts the number property (derived; sort(1), `Sort-Object` docs).
  6. Formatting comes last: `Format-Table` emits formatting objects, so anything after it no longer has the
     original properties (Microsoft "Using Format commands to change output view" *(check)*).
  7. Both `sort` and `Sort-Object` must read all input before emitting the first item; other stages stream (UL
     ch6 Šire o temi for `sort`; about_Pipelines "one at a time") *(check wording)*.
  Tie-break: equal sizes sort by name in both lanes, so the two outputs are comparable (decision, stated on the
  page; `Sort-Object` is stable *(check)*).
- **Params:** `task` choice big-files/top-processes/count-by-extension (big-files); `nameWithSpace` toggle (on:
  the listing contains `godišnji izvještaj.pdf`); `formatEarly` toggle (off: on inserts `Format-Table` before
  `Sort-Object` to show rule 6).
- **Presets:**
  - `big-files` `ls -l | awk '$5 > 1048576 {print $9}'` vs `Get-ChildItem | Where-Object Length -gt 1MB |
    Select-Object Name`, 6 files of which 3 are > 1 MiB: both list 3 names. Derived, unchecked listing.
  - `space-in-name` same with `godišnji izvještaj.pdf` (2.4 MB): bash prints `godišnji` (field 9 only), PowerShell
    the full name. Derived from rule 3.
  - `sort-text` `ls -l | sort -k5` (no `-n`): text order puts a 1 048 577-byte file before a 980-byte one;
    `sort -k5 -n` fixes it; `Sort-Object Length` is right first time. Derived from rule 5.
  - `format-early` `Get-ChildItem | Format-Table | Sort-Object Length`: the output is not sorted by size (the
    objects are format records). Derived from rule 6 *(check exact behaviour/error)*.
- **Steps:** one per stage plus the terminal: `big-files` 4, `space-in-name` 4, `sort-text` 4, `format-early` 4.
- **Legend:** text line (monospace strip), object card (box with property rows), pipe (wire), field split marker
  (vertical ticks over a line), broken result (cross), changed (kit highlight on the pipe contents produced this
  step).
- **Captions:** hr: "Kroz bash cijev teku retci teksta: `awk` mora sam pronaći peti stupac." / en: "Lines of text
  flow through the bash pipe: `awk` has to find the fifth column itself." — hr: "Kroz PowerShell cijev teku
  objekti: `Where-Object` čita svojstvo `Length`, razmaci u imenu ne smetaju." / en: "Objects flow through the
  PowerShell pipe: `Where-Object` reads the `Length` property; spaces in the name don't matter."
- **Terms:** pipeline — cjevovod (UL ch6); pipe — cijev (UL ch6); standard output — standardni izlaz (UL ch6);
  object — objekt; property — svojstvo; cmdlet — *cmdlet* (naredba PowerShella); formatting — oblikovanje ispisa
  *(check)*.
- **Misconceptions:** PowerShell pipes "nicer text"; what you see on screen is what flows down the pipe; text
  pipelines are always simpler.
- **Out of scope:** redirection and stderr (`lnx-pipes-redirection`), parameter binding ByPropertyName in detail,
  PowerShell on Linux, `jq`/JSON text tools, performance.
- **Builds on `lnx-pipes-redirection`:** reuses its process boxes, pipe wires and terminal; drops the fd ports;
  new are the object cards, the second lane and the comparison captions.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-powershell-objects` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-powershell-objects sims/win-powershell-objects` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-powershell-objects/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
