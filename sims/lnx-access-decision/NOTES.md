<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-access-decision: notes

New stepper (task `docs/tasks/w3/lnx-access-decision.md`, catalogue `lnx-access-decision` §4.4, wave 3). One
concept: owner → group → other, first match decides; the ACL mask. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Kit view K4** draws the file's entries, with the page's own `mark` on every row (the rule-of-its-own case in
  `docs/sim-ui.md` §12): the rows are classes in a fixed order, a class can span several rows (the groups), and the
  mask row is never "compared". Marks: – no match (the "describes" cell struck), ▷ matches, ▶ decides, ▽ "lacks the
  bit" (a matching group entry without the bit while another one grants it), hatched "not read". The pointer chip sits
  on the first row of the class being compared, or on the mask row at the mask step. An extra column "applies" shows
  what the matching entries give after the mask, with the removed bits struck and boxed (getfacl's `#effective`).
- **One step per class**, not per row: the groups class (owning group and named groups) is compared in one step,
  because its entries are OR-ed (task rule 4). Empty classes (no named users) get no step, so preset 1 has the task's
  5 steps.
- **The order strip** above the table (owner → named users → groups → other, with "no entries" on an empty class) says
  the contrast note of catalogue §5.1 on the stage itself: the order is fixed, not a list someone orders. The
  explanation says it again next to the link to `rule-first-match`.
- **Privilege first.** The page asks EUID 0 before the classes (task rule 1; UL ch07 "Povlašteni proces zaobilazi sve
  provjere dozvola"). The kernel actually runs the class check first and asks the capability only after a refusal;
  the verdict is the same in every case (SPEC.md rule 1). Root's x rule follows `generic_permission()`: an x bit in
  the **mode** (the group triplet is the mask), not "an ACL x": `druga.txt` with `group::rwx` but `mask::rw-` →
  root x denied. This answers the task's *(check wording)*.
- **Users are one list for every scene** (student, ana, marko, nobody, root), so `who` is a fixed five-option choice
  and every scene can be tried with every user (the real run covers all 165 cases). marko is derived (in `projekt`,
  not the owner of `druga.txt`), as the task says.
- **Choices, not selects:** the kit's `select` is for more than five options; `who` (5), `mask` (4) and the scene (5)
  are `choice`. `scene`, `who` and `want` reset to step 0 (task); `mask` does not, so at the verdict of preset 4 a
  click on `rwx` turns ✕ into ✓ with the same steps (the mask never changes the path, only what applies).
- **The mask param** shows only on the two files with a mask; its default `rw-` is both files' own mask in UL ch07.
- **`ls -l` line** over the table, with the group triplet underlined double when it is the mask, lit at the mask step
  (rule 6). The book's trailing `.` (SELinux context) is left out; it is another concept (`lnx-selinux-decision`).
- **`/srv/projekt` keeps the book's `drwxrws---`**: the `s` is setgid (special bits are out of scope; the explanation
  says in one clause that the `s` includes x).
- **Captions are chosen in `sim.js`** (`captionOf`, pure, tested branch by branch); the page only fills the strings.
  The verdict answers the misconception the case shows, in this priority: the mask took the bit; other would have
  allowed it (no fall-through); another class would have allowed it after the mask (the owner's no is final); else the plain
  sentence; when other decides, the plain sentence leaves out "a later row" (there is none). The task's two captions are used verbatim: `cOtherEmpty` at the step where other is compared (no ACL,
  `---`), `cMaskClips` at the mask step when it removes a bit.
- **Preset entries** in `sim.json` for `owner-locked` and `mask-clips`: the two misconceptions, linkable from a course
  file. `related`: `lnx-permissions-rwx`, `rule-first-match`, `lnx-selinux-decision`.
- File and user names, entries and bit strings are data (`translate="no"`); the names are also in the tables so the
  controls can show them. Commands appear only as the subject (`ls -l`, `getfacl` in the explanation).
- Tags: `permissions`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **`who` and `mask` are `choice` controls**, not selects (kit rule: select is for more than five options).
- **Root before the classes** is the task's order, not the kernel's (same verdict; see Decisions).
- **"(or ACL x)" in task rule 1 is not modelled:** only the mode's x bits count (real run).
- **Path traversal** (UL ch07 Primjer 3) is mentioned in the explanation with a link to `lnx-permissions-rwx`
  (x = search on a directory); there is no simdeck sim for traversal itself to link to.

## Reused model

`models/` has no shared permissions model yet, so `permString`/`permBits`, `octal` and `lsString` are copied and
extended in `sim.js` with the comment `// from sims/lnx-permissions-rwx/sim.js @ eb0ae27` (COMMON.md §6). The
reusable part of this sim (`lsString`, `modeOf`, `classesOf`, `masked`, `check`) is pure over plain data and can be
promoted unchanged.

## Sources

- `uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`: "Kad tri skupine bitova nisu dovoljne" (`/srv/projekt`
  2770, `ls -ld`, student's `Permission denied`; `getfacl proba` before and after `setfacl -m u:nobody:rw`,
  `-rwxrw----+`; `getfacl /srv/projekt/druga.txt` with `#effective:rw-`), Primjer 3; footnotes ch7-acl-* [24] and
  ch7-capabilities [9]. Figure `dozvola-na-krivom-mjestu.svg` read, not used (traversal is out of scope).
- acl(5) "ACCESS CHECK ALGORITHM" and capabilities(7) `CAP_DAC_OVERRIDE`, read on this machine; the kernel's
  `generic_permission()` for root's x rule.
- **Real run** (2026-10-30): a throwaway `debian:trixie-slim` container (`--network none`, tmpfs, kernel 6.8.0,
  util-linux `setpriv` 2.41.5, the host's `setfacl`/`getfacl` mounted read-only), every scene × mask × user × want,
  asked with `access()` (coreutils `test`) and with the real operation (`cat`, append, execute; `ls`, `cd`). All 165
  equal the model; pinned in `sim.test.js` (`RUN`). Scripts in the thread's library (`acl-run.sh`, `op.sh`). One trap
  found on the way: in a sticky world-writable directory `fs.protected_regular` refuses `O_CREAT` opens of others'
  files, even for root, so the files live in a 755 directory. *(check on the course's lab VM: not done; the rule is
  the kernel's, not the distribution's.)*

## Term pairs

From the glossary: *file permission* — dozvola, *access control list* — popis kontrole pristupa, *capability* —
sposobnost. Missing from `kit/glossary.js`, written out in both tables (Croatian from the task and UL ch07):

| en | hr |
|---|---|
| mask (ACL) | maska |
| effective rights | efektivna prava |
| effective UID | efektivni korisnički identifikator |
| owner / owning group / others | vlasnik / grupa datoteke / ostali |

## Shared requests

- **Kit: `[hidden]` on a control** (same as `lnx-permissions-rwx`, `lnx-selinux-decision`): `.sd-ctl { display: flex }`
  beats `hidden`; the page adds `.sd-ctl[hidden] { display: none; }`.
- **K4: a class spanning rows.** This page draws a class of several rows with the page's own marks and the pointer on
  its first row. If a second consumer needs it, a `group` field on rows (one pointer bracket over the rows of a
  class) would replace that.
- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **models/:** promote the permissions helpers (with `lnx-permissions-rwx`) and this sim's `check`.

## Checks

- Model numbers printed before the page was written; equal to the real run in all 165 cases.
- **Rule tests broken on purpose** with a script, one mutation at a time (root ignored, root x always, root x needing a
  bit on a directory, root x counting ACL x, fall-through after a matching class, first group entry only, groups
  AND-ed, the mask on owner, on other, not on groups, not on named users, two class orders, `ls -l` showing `group::`,
  no `+`, no setgid letter, the owning group and named groups by primary gid only, named user matched as owner, a
  step for an empty class, no mask step, no identify step, the mask param ignored or added to files without a mask,
  four caption branches, effective = the entry): all **30** fail a test.
- `npm run gate -- lnx-access-decision`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed, plus every preset at its interesting step.
  Fixed from the screenshots: half the stage empty (now process and table on top, request / what applies / verdict
  below, larger type); class names drawn as monospace data (a bare string in a K4 cell is data); the "applies"
  column pushed under the sticky mark column by a long "describes" text on the mask row.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL ch07, acl(5),
  capabilities(7) and `generic_permission()`, enumerated every caption, ran its own mutations and looked at the page
  in a browser; no model defect). Fixed from it: "denied, although group and other may" chosen for `druga.txt`, ana,
  x at mask `rw-`, where nobody else may either (the condition now uses the bits after the mask, and the sentence says
  "others would be allowed"); the Croatian "ostali se više ne čitaju" after "jedan od njih" reading as "the remaining
  entries" (now "klasa ostali"); "a later row cannot change that" when other decided (new `cDeniedOther`); the mask
  hint's "the verdict changes" (now "can change"); "three triplets, each a file permission" and a sentence starting
  with a lowercase glossary term; the table rows unmarked at root's override step. Tests added for the five
  mutations that survived (root x from the other triplet alone, the owner-locked condition, the mask clipping a bit
  that is not the wanted one, the mask-same placeholders, root's `changed`): **37** mutations in all, all caught.
  Left as is: the pointer chip lights only the first row of a class (NOTES, Shared requests); `matchedRows` taken
  from the class instead of its hits survives, but no scene has a groups class with a matching and a non-matching
  row, so the page cannot show the difference.
- Not checked: a real projector and a lecturer at the page.

## Time

Start 2026-10-30 16:05, done 16:28 (CET), one session, including the real run in a container and the fresh review.
