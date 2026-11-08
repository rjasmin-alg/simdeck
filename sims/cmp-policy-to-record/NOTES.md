<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-policy-to-record: notes

New stepper (task `docs/tasks/w3/cmp-policy-to-record.md`, catalogue `cmp-policy-to-record` §4.13; seed: DR S9, pass
the client audit; hub of the evidence-trail model, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** three requirements side by side (backups quarterly, access reviews and security
  updates monthly), each a column of policy → standard → procedure → 12-month records → finding, laid on one shared row
  grid so the layers line up. A design break and an operating gap stand next to each other in the default preset
  (`audit-day`: paper compliance, records without a policy, records that stop in September) and end in different
  findings.
- **The walk:** 5 steps per requirement (policy, standard, procedure, records, finding) + the report = 16 steps. The
  records step leaves the finding as "?" so the class can call design or operation before → reveals it. The trail
  line thickens as the auditor walks; the first failing layer gets a ✗ on the connector below it, and every layer
  below is hatched and tagged "outside the trail" when the auditor reaches it (it is still read and counted, as in a
  real audit).
- **First break wins** (SPEC rule 5): the highest failing layer names the finding, design before operation. A break
  above the records is always a design finding, whatever the records show; this is what makes "records without a
  policy have no mandate" (preset 4: 12 records or none, the same finding) and "a weakened layer is a design finding
  while the work is done" (preset 5) visible.
- **A missing procedure breaks the trail.** ISO/IEC 27001 asks for documented procedures "as needed" (A.5.37), so in
  practice a missing procedure is sometimes judged leniently; the catalogue's concept ("a missing layer breaks the
  trail") is followed, and the caption gives the reason (nothing says what a record must contain; it depends on one
  person).
- **Gaps are the last *g* periods** (the procedure stopped being followed), one control per requirement; the caption
  names the month of the last record ("the last one is from September"). Scattered gaps were left out to keep one
  slider per requirement.
- **Records are one per period at the period's last month**; the chain choice changes only the documents, never the
  records (rule 7), so switching a layer off shows the same records falling outside the trail.
- **A vague standard** keeps its records on the stage (the firm's real practice), but the count reads "2 records ·
  how many are due?" and the walk stops there.
- **Evidence-trail model in `trail.js`**, pure and wordless, registered as `SimdeckModels.trail`, ready for
  `models/trail.js` (catalogue §5.24: `cmp-audit-sampling` draws from it, `cmp-restore-evidence` and
  `cmp-log-evidence` fill it). It takes records as month numbers and any frequency (monthly, quarterly, yearly) and
  audit-period length, ignores records outside the period and counts two records in one period once.
- **The firm is unnamed** ("a small firm"): no name appears on the stage. A shared fictional organisation for all
  `cmp-` sims is the coordinator's or the owner's choice; when there is one, only `cStart` and the explanation change.
- **Clause numbers only in the explanation** (ISO/IEC 27001 by number, NIS2 art. 21(2)(a) and (f)), never on the stage.
  The stage foot says once: simplified, not legal advice, made-up firm and numbers.
- **Marks:** record filled series 1 with ✓; no record hollow dashed, ✗ once read; outside the trail hatched with a
  dotted border and a tag; the auditor's position highlighted (kit highlight + outline); a missing layer dashed with
  "no …" in italics; vague dashed with "≈ not measurable"; findings in words, design dashed (warn tint), operation solid
  (danger tint), no finding ✓ (ok tint). Grayscale checked.
- **Panel:** six presets in two columns (as `amdahl` does) and short requirement names on the controls ("Kopije:
  lanac", "Kopije: bez zapisa") so the panel fits at 1920×1080 without its own scroll.
- **Phone:** the columns stack; the stage container switches to `inline-size` so it grows with its content.
- **No glossary terms** (`[[…]]`); pairs are written out in the explanation (Croatian bold, English in italics in
  brackets, as `fin-sunk-cost` does). The page does not link `glossary.js`.

## Deviations from the task

- **English title shortened** to "Policy, standard, procedure, record: the auditor's trail" (56 characters): the
  catalogue's "…: the trail an auditor walks" is 63, over `sim.json`'s 60-character limit. The Croatian title is the
  catalogue's (60).
- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-policy-to-record/`; the open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022 by clause number only (never quoted): 5.2, 7.5, 9.2, 10.2; Annex A 5.1, 5.18, 5.37, 8.8, 8.13.
  *(check: numbers from the 2022 edition's clause list, not checked against a copy)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(a) and (f) (EUR-Lex). *(check: wording of (f) from memory; the
  explanation paraphrases it)*
- Design vs operating effectiveness of controls: standard audit practice (e.g. ISA 330 on tests of controls).
  *(check: paragraph numbers not checked)*
- DR estate `student/scenarios/S9.md`, `student/handbook/constraints.md` (an audit date and what failing it costs);
  no instructor material used.
- All numbers are illustrative (the page says so once): the frequencies (quarterly restore tests, monthly access
  reviews and update reports) and the 14-day update deadline.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters":

- How the regulation under the Zakon o kibernetičkoj sigurnosti refers to ISO/IEC 27001, and the article of the
  Croatian law that matches NIS2 art. 21 *(open: not stated by the owner)*. Not on the page.
- The Croatian clause titles of HRN EN ISO/IEC 27001 (e.g. "interni audit" vs "unutarnji audit" for 9.2,
  "nesukladnost" for 10.2) *(check against the HZN edition; the explanation uses "interni audit" and "nesukladnost")*.

## Settled

- ISO/IEC 27001 (2022 edition) certification is voluntary; the measures the Zakon o kibernetičkoj sigurnosti
  (NN 14/2024) requires cover similar ground: owner confirmed 2026-11-08. On the page: one sentence at the end of the explanation's
  sources paragraph.

## Term pairs

Not in `kit/glossary.js` (except *policy* = politika, which is there from uvod-u-linux); chosen here, for the owner to
check in one place:

- *policy* (politika), *standard* (standard), *procedure* (procedura), *record* (zapis): as in the catalogue's
  Croatian title.
- *auditor* (revizor), *audit trail* (revizijski trag), *audit period* (razdoblje revizije), *finding* (nalaz).
- *design finding* (nalaz o oblikovanju) and *operating finding* (nalaz o provedbi); auditors also say design and
  operating deficiency. *(check: Croatian ISA translations may use "operativna učinkovitost";
  "provedba" was chosen as plainer for IT managers)*
- *paper compliance* (usklađenost na papiru), *mandate* (uporište), *vague standard* (nejasan / nemjerljiv standard).

## Shared requests

- **Promote `trail.js` to `models/trail.js`** (catalogue §5.24) before `cmp-audit-sampling`, `cmp-restore-evidence` or
  `cmp-log-evidence` starts. Its rule tests are the "trail model" block of `sim.test.js` (tie-breaks and rules 1-5).

## Checks

- `node --test sims/cmp-policy-to-record/sim.test.js`: 38 tests (tie-breaks first, then trail rules 1-5, sim rules
  6-10, every caption key, the six presets, strings, page, generic block).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 36 mutations of
  `trail.js` and `sim.js`: 21 killed, 9 equivalent, 6 survived. All six now have tests and each was re-run and is
  killed (a single record under a vague standard, records outside the period without a standard, a fractional month,
  `''` and `Infinity` for `g3`). The reviewer's string points were applied too: a zero-record variant of the
  no-procedure finding, "the design part is written" instead of "closed by writing" (writing a policy does not
  close missing records), "no record shows it is done" instead of "nothing is done", "no longer followed".
- `npm run gate -- cmp-policy-to-record`: pass (63/63 browser checks); screenshots 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus steps 3, 5, 7, 9, 10, 14, 15, 16 of `audit-day`, the
  vague and missing-procedure steps of `weak`, `no-mandate`, `gaps`, `paper` at 1920×1080, dark at the report, and
  375×812 at the report and mid-walk.

## Time

Start 11:03, done 11:28 (2026-11-07), one session.
