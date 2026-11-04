<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-fgpp: notes

Thread t-0238, 2026-11-04. Task `docs/tasks/w3/win-fgpp.md`.

## Decisions

- **Kit view K4** (`kit/ruletable.js`) draws the candidate policies in `specific` mode with **marks the page sets**
  (docs/sim-ui.md §12, "a rule of the page's own"): the selection rule (direct tier first, then the lowest precedence
  number, then the smallest GUID) is not "highest rank wins", so the model decides and the page maps its marks:
  kept → `hit` ("in the running"), beaten in its tier → `beaten` ("loses", min. length struck), dropped → `skip`
  ("dropped", hatched), winner → `win`. The reason goes in the mark's note (higher number, larger GUID, direct
  comes first, a PSO replaces it, OU: not for the domain).
- **One step per tier, not per row.** The task says "evaluate one candidate row" with max 4 steps and 3 steps for
  every named preset; one row per step would give 4–5 steps for `two-groups` and `direct-beats-group`. A step looks
  at one tier (direct, group, domain) and keeps its best row; once a tier keeps a row, everything below it is dropped
  in one step; then the winner. Every task preset is 3 steps (the task's numbers); with no PSO it is 2. This follows
  `win-gpo-precedence`, which drops all blocked GPOs in one step for the same reason.
- **Several rows change in one step**, so the page adds the kit's `sd-changed` class to every mark cell of the step,
  not only the pointer's row (see Shared requests).
- **Left column** (page drawing): ana's groups and direct PSO, the PSOs in the domain with their precedence and
  targets (dashed and "(not hers)" when they don't reach her), and where the password GPOs are linked (domain root,
  `OU=Staff`, ana in `OU=HQ`). The PSO list makes the `samePrecedence` toggle visible on its own.
- **GUID** is shown under the precedence number (it is the tie-break key), first 8 hex digits.
- **Names in the stage** are data (`translate="no"`) in the sans font, so the table fits 1920×1080 with the panel
  open; captions keep them monospace.
- **`msDS-ResultantPSO`** is shown as `CN=<PSO>,CN=Password Settings Container,…`; empty when the domain policy
  applies. The attribute name is kept on the page: the task names it and it is what the concept produces.
- **Model is promotable**: `candidatesOf(scene)`, `eventsOf(rows)`, `winnerOf(rows)`, `resultantOf(rows)` take any
  scene, no strings.
- **Builds on `win-gpo-precedence`** for the page only (the K4 table, the winner box, the caption helpers `rich`,
  `sentence`, `list`); no model code copied: the selection rule is different. `models/` has nothing to reuse.

## Deviations from the task

1. **A fifth param `ouGpo`** (preset `ou-gpo` needs a switch) and **a sixth, `noStaff`** ("ana out of All Staff"):
   without it the page could never show rule 7 (no PSO → the domain policy, `msDS-ResultantPSO` empty). Not a preset;
   the task fixes five presets.
2. **Preset `tie`** sets `group2` and `samePrecedence` (the Finance PSO moves from 5 to 10); `samePrecedence` alone
   changes only the PSO list on the left, since ana is not in Finance.
3. **Tie winner**: the task does not say which PSO has the smaller GUID. `Default-Staff` has it, so the weaker PSO
   wins the tie: a reminder that the GUID is arbitrary and two PSOs should not share a precedence.
4. **Step grouping** (above): one step per tier, not per row.
5. **Domain policy values**: the estate gives only min length 7. Complexity on is the Windows default *(check)*;
   lockout threshold 10 is invented so the "replaced as a whole" contrast shows (Default-Staff's 0 beats it).
6. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses changes outside `sims/win-fgpp/`; owner questions
   are here and in the report.

## Sources

- Microsoft Learn, "AD DS fine-grained password and account lockout policy step-by-step guide" *(check title)*.
- Microsoft Learn, "Configuring fine-grained password policies for AD DS" *(check title)*: precedence, direct before
  group, GUID tie-break, `msDS-ResultantPSO`.
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/pso.txt` (PSO `Default-Staff`, precedence 10, applies
  to All Staff, min length 4, complexity off, lockout threshold 0), `gpos.txt` (Default Domain Policy at the domain
  root, comment "min length 7"), `forest.txt` (domain mode 2012 R2), `ou-tree.txt` (`OU=HQ,OU=Staff,OU=Quillmoor`).
  Student material only; nothing from `instructor/`.
- No network in this thread: no title or rule above was checked against the live documentation.

## Unchecked *(check)*

- Both documentation titles above.
- Rule 5: PSOs reach a user through **nested** global groups (modelled and tested; not on the page's scene).
- Rule 6: "smallest objectGUID" — compared how (bytes or string form)? The scene's GUIDs repeat one byte in the
  first group, so both orders agree; the model compares lowercase hex text.
- Rule 3: PSOs on universal or domain-local groups are ignored (the docs say global security groups) — modelled.
- A PSO applied both directly and through a group counts as direct (modelled).
- Default Domain Policy's complexity default (on); the lockout threshold 10 is invented.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| fine-grained password policy | detaljno pravilo lozinki |
| password settings object (PSO) | objekt postavki lozinke (PSO) |
| precedence | prednost |
| resultant policy | rezultantno pravilo |
| complexity | složenost |
| account lockout | zaključavanje računa |
| global security group | globalna sigurnosna grupa |
| shadow group | grupa sjena *(check)* |

## Shared requests

- **K4 (`kit/ruletable.js`): several changed rows.** A step that decides several rows at once (a tier, or a block of
  dropped rows) wants each one marked "changed", not only the pointer's row. Smallest change: an optional
  `changedRows: [indices]` in the spec. Workaround here: the page adds `sd-changed` to those mark cells after the
  view is built, and a page rule gives a changed mark cell `--on-hl` text, because the kit's `skip` and `beaten`
  greys are hard to read on the highlight in the dark theme.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`. A tag `active-directory` exists
too; the task names `group-policy` only.

## Review

A fresh reviewer read the code against SPEC.md, rendered all 32 param combinations × every step × both languages
(no page or console error, no false caption) and ran 45 mutations of the model: 42 were caught. Of the three
survivors, two now have tests (the drop step must name the kept row, which the page reads; the GUIDs' first group
must repeat one byte); the third (nesting through a non-global group) cannot happen in AD. Also from the review: a
PSO on a global *distribution* group no longer applies (security groups only, with a test), the exact step count
(3 with a PSO, 2 without) is tested for every combination, the model supports one domain-root GPO only (SPEC.md
rule 1), the "replaced as a whole" caption says "never" instead of a bare 0, and four Croatian phrasings were fixed.

## Time

Start 03:38, done 04:05 (about 27 min wall clock, one session).
