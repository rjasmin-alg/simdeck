<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-permissions-rwx: notes

New explorer (task `docs/tasks/w2/lnx-permissions-rwx.md`, catalogue `lnx-permissions-rwx`, wave 2b). No kit view fits
(the task's "bit / field strip" view does not exist; K1–K4 are sequence, topology, rule table, block grid), so the page
draws its own strips in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two panels side by side.** Left, an existing file (or directory) and `chmod`: the start strip, the command, the
  result strip (large, with group names and each digit as its sum `4+2+0 = 6`), and the result in three notations
  (`ls -l`, octal, symbolic). Right, a new one: `umask` and `touch`/`mkdir` as command lines, the base strip (666 or
  777), the mask strip, the result strip with the cleared bits hatched, the three notations, and two arithmetic lines:
  `666 & ~077 = 600` ✓ and `666 − 077 = 567`, struck out with ✗ when it differs, "happens to agree here" when it does
  not (022, 002, every directory case on the list). That second line is the misconception, shown next to the rule.
- **`kind` drives both panels** (type character, x meaning, base 666/777). One choice keeps the page to five controls.
- **Clicks and the hidden `toggled` param.** The kit's selects accept only their options (in the URL too), so a click
  cannot write an arbitrary mode into `before`. A hidden range `toggled` (0 … 511) is a XOR mask over `before`; a click
  that lands on a listed mode writes `before` instead and clears `toggled`. Picking another `before` in the select
  clears `toggled` (the page does it in a microtask after render). The URL keeps any start (`?toggled=68`).
- **A click on the result strip** makes the result the new start and flips that bit, so the clicked cell flips and the
  others stay put; a click on the start strip flips the start. Both set the command to "—", as the task says.
- **Written bits** of the command are marked by a bar under the result cell (▬, named in the command's note): all
  nine for octal, only the named ones for symbolic. This is rules 3 and 4 made visible, beyond the task's highlight of
  changed bits.
- **Mask bits with no effect** (x on a file) are drawn dotted and struck through, with a note "x in the mask does
  nothing: 666 has no x" and a sentence in the caption (rule 8).
- **Caption focus:** the panel whose params changed last speaks (a preset speaks for its own panel; `kind` and `umask`
  for create; `before`, `cmd` and clicks for chmod). With no history: create when there is no command, else chmod.
  The task's two captions are used verbatim through placeholders: `cOctalLost` with "izvršni bit vlasnika" / "the
  owner's execute bit", and `cMask` with 077, 666, 600.
- **"Nobody named it" only where true.** The task's caption is used for bits an octal command clears in a group whose
  digit is not 0 (`lostUnasked`: owner x in 700 → 640). Bits cleared by a 0 digit (`chmod 640` on 644, the others' r)
  get "a 0 digit cleared n bits, as asked" (from the fresh review).
- **Caption choice lives in `sim.js`** (`nextFocus`, `clearsToggled`, `captionKey`), pure and tested branch by branch;
  the page only fills the strings.
- **Preset 6 `dir-umask`** starts the chmod panel at 755 too, so a directory is not shown as `drw-r--r--`. The task's
  second half of preset 6 ("umask 027 file → 640") is a pinned test, not a seventh preset.
- **Preset entries** in `sim.json` for `octal-erases` and `umask-077`: the two misconceptions, linkable from a course
  file as `lnx-permissions-rwx#<preset>`.
- **No `related`:** the natural neighbours `lnx-special-bits` and `lnx-access-decision` are not built yet.
- **Commands are the subject** (`chmod`, `umask`, `touch`, `mkdir`, `ls -l`), as in UL ch07; they appear in code and
  in `translate="no"` data only. File names are in the tables (`proba`/`test`, `projekt`/`project`, `nova`/`new`).
- Tags: `permissions`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **`before` is a select plus a hidden `toggled` param** (see Decisions), not a select alone.
- **The task's "bit / field strip" kit view** does not exist; the page draws its own (not requested as a kit view: one
  consumer so far).
- **`chmod` without `who`** (`+x`), `X`, `s`, `t` and permission copies (`g=u`) are rejected by the model rather than
  modelled; no option on the page uses them (SPEC.md, rule 4).
- **POSIX edition:** the task names POSIX.1-2017, UL ch07's footnotes cite POSIX.1-2024; the sections used are the same.
  *(check: neither edition re-read for this task)*

## Sources

- `uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, "Što smijete s datotekom": "Što treba znati" (the nine
  bits, `S_IRUSR` …, `touch proba`, `chmod 640`, octal absolute, symbolic `+ - =`, `chmod u+x,g-r`, the consequence
  paragraph, `umask` 0022, `umask 077; touch tajna`, the mask in the shell's environment) and "Šire o temi" (symbolic
  `umask`, explanation only); its footnotes ch7-posix-perm-bits, ch7-sys-stat, ch7-path-resolution, ch7-posix-chmod*,
  ch7-gnu-numeric, ch7-gnu-symbolic, ch7-posix-umask*.
- `uvod-u-linux/assets/diagrams/chapter-07/devet-bitova-dozvola.svg`: the strip's layout (type, three groups, a digit
  per group as 4 + 2 + 1). Nothing copied.
- **Real run** (2026-10-15, this machine, GNU bash 5.2.21, GNU coreutils 9.4): `umask` 000/002/022/027/077/033 with
  `touch` and `mkdir`, and every start × command of the page with `chmod`. All 35 + 12 results equal the model; the
  table is pinned in `sim.test.js` (`RUN`, `RUN_UMASK`). *(check on the course's lab VM: not done; the semantics are
  POSIX, not the machine's.)*

## Term pairs

From the glossary: *file permission* — dozvola, *octal mode* — oktalni zapis dozvola (`[[…]]` in the explanation).
Missing from `kit/glossary.js`, written out in both tables (Croatian from UL ch07 and the task):

| en | hr |
|---|---|
| file mode creation mask (umask) | maska stvaranja (umask) |
| symbolic mode | simbolički način |
| search permission (on a directory) | dozvola pretraživanja |
| owner / others | vlasnik / ostali |

## Shared requests

- **Kit: `[hidden]` on a control.** `kit.css` sets `.sd-ctl { display: flex }`, which beats the `hidden` attribute, so
  a param with `visible: () => false` is still shown. The page works around it with
  `[data-sim="lnx-permissions-rwx"] .sd-ctl[hidden] { display: none; }`. Smallest kit change: add
  `.sd-ctl[hidden] { display: none; }` to `kit.css` (then this page's line can go).
- **Glossary:** add the term pairs above with `"src": "simdeck"`.

## Checks

- Numbers printed from the model before the page was written and compared with the real run (above): all equal.
- **Rule tests broken on purpose** with a script, one mutation at a time (octal writing nothing, octal OR-ing the old
  mode, `=` not clearing, `+` toggling, `-` setting, the mask subtracting, both bases, x meaning swapped, the type
  character, letter order, digit order and weights, symbolic notation order, `noEffect`, `cleared`, the agreement
  flag, a negative difference, `toggled` unmasked, before = start OR toggled, a clause without who, clauses applied
  right to left, `changedBits` one way, `lost` swapped, the click ignoring the list, the click keeping the command,
  special bits allowed, `a` ignored, symbolic `written` losing `+`, the mask ignored for directories, two presets
  changed): all **32** fail a test.
- Browser (Playwright, the built-in `file://` page): every preset in hr and en at 1920×1080, umask 027, the phone at
  umask 077; clicks on the result strip (640 → 740 via `toggled`), the select clearing `toggled`, a click on the start
  strip, and a reload keeping the clicked start (`?toggled=…`). No console errors. Fixed from the screenshots: the
  hidden control showing (kit defect above), the written-bit bars running into the digit sums, the mask strip's type
  character filled, the no-effect mask cells drawn as ordinary set cells, the arithmetic line overlapping its verdict
  on the phone, the digit sums at 12 px on the phone.
- `npm run gate -- lnx-permissions-rwx`: pass (manifest, tests, build, 48 browser checks, tokens, scope).
  Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL ch07, re-ran
  umask/chmod on the machine, and tried its own mutations; no model defect). Fixed from it: the "nobody named it"
  caption on a bit a 0 digit asked for; the caption choice untested in the page (moved to `sim.js`, 15 more
  mutations, all caught); 14 px digit sums on the phone (now 16 px, tighter spacing); SPEC.md's preset 6 missing
  `before: 755`; tests for a multi-action clause, a command on a clicked start, `written` for `=` and for `+` of a set
  bit, a directory's `cleared`, `lost`/`gained` over every case, a difference of 0, a click landing on 000, five
  octal digits; wording: the explanation's first sentence (one *file permission* written in nine bits), "The octal
  mode…", "drugi su bitovi ostali kakvi su bili" (not "ostali", which reads as the class), „pokrenuti“, "covered in
  other simulators" / "obrađeni su", "simbolički način" in the command note. **47** mutations in all, all caught.
- Not checked: a real projector and a lecturer at the page.

## Time

Start 2026-10-15 10:14, done 10:37 (CEST), about 23 minutes, one session, including the fresh review.
