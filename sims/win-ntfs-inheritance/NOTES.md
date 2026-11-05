<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntfs-inheritance — notes

Task `docs/tasks/w3/win-ntfs-inheritance.md` (thread t-0258, 2026-11-04/05). Stepper; the DACL is kit view K4
(`kit/ruletable.js`, `at: 'all'`, every row's `mark` set by the page: "a rule of the page's own", `docs/sim-ui.md` §12),
so the task's "until K4 exists, draw your own" does not apply. Rules and expected results: `SPEC.md`.

## Decisions

- **Layout.** Left, the tree on D: and E: (one button per object: icon, name, explicit-count badge, inherited-count
  badge with a chain icon, a broken chain where inheritance is off, a dashed "old" tag where a moved file kept its old
  inherited entries, and the chosen user's access as letters R X W M F). Right, the shown object's inheritance status,
  its DACL as K4 (inherited rows grey with a chain icon and "from <folder>", locked by construction since nothing on the
  page edits them), and the user's effective access as chips with the deciding row numbers (as in
  `win-ntfs-share-effective`).
- **Click a tree object** to show its DACL instead of the step's object (hidden param `pick`, not in the URL; "back to
  the step's object" clears it; a preset or reset clears it). The caption stays about the step. This is the "build a
  folder tree, move files around" interaction within a stepper; the scripts themselves are fixed.
- **One script per preset** (hidden param `script`, `resets: true`); `steps(p)` is the script's length, so `sim.json`
  `steps` = 3 is the default script (`basic`). Each preset also sets `user`.
- **Setup before step 0.** The presets need different starting ACEs (Grafičari on Projekti, on Grafika, or Vanjski
  read); a script has a `setup` applied silently in `initial()`.
- **DACL order = Microsoft's**, level by level (SPEC rule 3 "Resolution"): the task lists "inherited deny, inherited
  allow" plus a nearer-ancestor tie-break; its own preset `explicit-beats-inherited` needs the level as the primary key.
- **Type column shows ✓ / ✕ only** (the legend names them; the word is the aria-label and tooltip): with words the
  table was wider than its box at 1920×1080 and the sticky mark column covered it. The source column shows the
  folder's name (full path in the tooltip) for the same reason.
- **"Changed"** marks new rows and re-sorted rows; a row only pushed down by a new row above it is not marked (marking
  every shifted row hid what changed). In the tree, every object whose DACL changed.
- **Rights** as five atoms and the access check "the first ACE that mentions a right decides it" are copied from
  `sims/win-ntfs-share-effective/sim.js @ 03cc601` (`models/` has no NTFS model yet), with "applies to this object"
  added: an inherit-only ACE is listed but skipped (mark "not here").
- **Users** ana (Zaposlenici, Grafičari), marko (Zaposlenici, Arhivari), vanjski (Vanjski); no well-known groups,
  since no ACE here names them. The tops `D:\Projekti` and `E:\Arhiva` have no parent in the model.
- **Terms** follow the task (unos, izričit, naslijeđen, zabrana, dopuštenje). `win-ntfs-share-effective` uses
  "izravno" for explicit and "dozvola" for allow; the two pages differ there (see the report).

## Deviations from the task

- **Added `plakat.psd`** (with an explicit "ana Full Control") next to `logo.psd` in Kampanja2026: a copy and a move of
  the same file to the same folder would collide on the name, and the explicit ACE shows that a copy and a
  cross-volume move drop explicit entries while a same-volume move keeps them.
- **`copy-vs-move` copies `plakat.psd` and moves `logo.psd`** to `D:\Projekti\Arhiva`; step 3 adds an ACE on Arhiva
  (re-propagation replaces the kept set, rule 7), step 4 shows `logo.psd` again. 4 steps, as the task says.
- **`cross-volume`** moves `logo.psd` (step 1) and `plakat.psd` (step 2, its explicit entry is gone too) to `E:\Arhiva`;
  step 3 adds Grafičari Modify on `E:\Arhiva` and both files pick it up like ordinary children. 3 steps.
- **`explicit-beats-inherited`** has a setup "Vanjski Read & execute on Projekti" so vanjski reads and only Write is in
  question; step 4 shows Grafika (the allow on Kampanja2026 does not travel up), step 5 `logo.psd` (nearer ancestor).
- **`disable-convert`** step 1 disables inheritance on Kampanja2026, step 2 removes Grafičari on Projekti, steps 3–5
  look at Grafika, Kampanja2026, logo.psd.
- **Added param `disable`** (convert / remove), used only by `disable-convert` (disabled with a reason elsewhere): the
  task's rule 4 has both answers and the misconception "disabling inheritance removes permissions" needs the contrast.
- **Copy and move are for files only** here (a folder is rejected with a reason); no preset needs a folder.
- **A change on an object itself also drops its kept set** (re-reads the parent) *(check)*.

## Sources

Cited from memory; no network access to Microsoft's documentation in this session.

- Microsoft Win32 security: "Order of ACEs in a DACL" (explicit before inherited; inherited in the order inherited,
  parent first; deny before allow within each level), "ACE Inheritance Rules" (OI, CI, IO, propagation to child
  containers and objects), "How DACLs Control Access to an Object" (first ACE that decides a right).
- Microsoft support, "How permissions are handled when you copy and move files and folders".
- Advanced Security Settings dialog: "Disable inheritance" → "Convert inherited permissions into explicit permissions
  on this object" / "Remove all inherited permissions from this object".
- `uvod-u-linux` ch. 7 „Kad tri skupine bitova nisu dovoljne" (ACL, default ACL): the one-line Linux comparison in the
  explanation.

## Unchecked *(check)*

- Every Microsoft title above, and that the copy/move KB is still published.
- Inherited order: level first, deny before allow within a level (as implemented); the task's wording put deny/allow
  first. Verify `explicit-beats-inherited` step 5 (logo.psd: inherited allow from Kampanja2026 beats the inherited deny
  from Projekti) in a VM.
- Disable-inheritance wording on Server 2022.
- Explorer copy (any volume) and cross-volume move: new object, destination's inherited ACEs, explicit ACEs dropped.
- Same-volume move keeps the old inherited ACEs until re-propagation (current Explorer may re-inherit).
- Re-propagation replaces a kept set below a changed folder, and editing the object's own ACL re-reads its parent.
- "Files only" (OI IO) reaches a subfolder as inherit-only and its files as effective.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| access control entry (ACE) | unos |
| inheritance | nasljeđivanje |
| explicit | izričit |
| inherited | naslijeđen |
| deny / allow | zabrana / dopuštenje |
| disable inheritance | isključiti nasljeđivanje |
| convert / remove (inherited permissions) | pretvoriti / ukloniti |
| applies to | odnosi se na |

(`access control list` — popis kontrole pristupa is in the glossary and used as `[[access control list]]`.)

## Shared requests

- **models/:** promote the NTFS rights and access check (`ATOMS`, `LEVELS`, `NTFS_MASK`, `levelsOf`, `nameOf`, an
  access check with an optional "applies to this object" predicate) from `win-ntfs-share-effective` into a model
  (e.g. `models/ntfs-acl.js`); this sim copies them. The tree, `passDown`, `sortDacl` and `dacls` here are pure and
  string-free should a later sim need inheritance.
- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (same workaround as
  `win-ntfs-share-effective`, `.sd-ctl[hidden] { display: none; }`).
- **K4:** no row class; the page adds `ni-inh` (inherited, grey) and `ni-chg` (changed) to the rows after rendering.
  Smallest fix: an optional `className` per row. Same as share-effective's request for a `changed: [rows]` option.
- **Legend:** a swatch cannot hold an icon; the page appends its chain / broken-chain SVG into the two swatches after
  mount. Smallest fix: an optional `icon` (node) on a legend item.

## Tags

Topic `windows-admin`, tag `permissions` (both in `tags.json`).

## Time

Start 2026-11-04 23:57, done 2026-11-05 about 01:15 (clock read at both ends): about 1 h 20 min in one session,
including a break in the session caused by an API error. Roughly: reading 15 min, spec and model 15 min, strings and
page 15 min, tests and mutations 10 min, gate and layout fixes from the screenshots 10 min, the fresh review (run in
parallel) and its fixes 15 min.

## Review

A fresh reviewer read the diff against SPEC.md, checked the Windows semantics (order, OI/CI/IO propagation,
convert/remove, copy vs move: no errors in the model) and ran 36 mutations of its own on top of my 26. Fixed from it:

- **Visible bug:** the rows had `hit: null`, so K4 marked the implicit row "no access" in every state; now `hit` is the
  row's match.
- **Explanation, two factual errors:** an inherited ACE does not record its folder (only the INHERITED flag; the dialog
  works the source out); "deny wins" holds among entries of the same *level*, not the same kind.
- **Convert re-sorts** the converted rows as explicit ones, which can change the result when a nearer inherited allow
  sat above a farther deny: SPEC rule 4 and the explanation now say so, with a test *(check whether the dialog re-sorts)*.
- **Re-propagation stops at a folder with inheritance disabled** (SPEC rule 7, test) *(check)*.
- Caption for a protected object with an empty list; "removed" rows counted by rights, not source (a convert removes
  nothing), shown in the status line; separators and the "picked" note moved to `strings.js`; Croatian: "ponovno",
  clitic order, one form of address (ti) throughout, no gendered "odabrao si" / "naslijedio"; English "inherits only
  through its new folder", "the owner can still change the permissions".
- Twelve tests for its surviving mutants (sort levels never overlap, inherit-only rows do not decide, deciders and row
  levels, node counts, changes after convert, convert keeps "applies to", volumes after copy and cross-volume move,
  event fields the captions read, remove on an object with entries, default user). Its runner on the final code:
  every mutant it rated as mattering is killed; the survivors are unused or equivalent guards.
- Deviation from the task's caption wording: "sve što vidite naslijedio je" became "sve što vidiš naslijeđeno je"
  (one form of address on the page; "naslijedio" did not fit folders).
