<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-restore-evidence: notes

New explorer (task `docs/tasks/w3/cmp-restore-evidence.md`, catalogue `cmp-restore-evidence` §4.13; fills the
evidence-trail model of `cmp-policy-to-record`, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** a "Backup" column of job reports, ✓ 365 on every row, beside the restore tests, which
  alone can show that two of those backups would not restore (customer data, the directory) and two systems come back
  slower than their RTO (payroll, ERP). The tiles repeat it: job reports 100 % against tested, failures found and
  slow shown, each "found / really".
- **The hidden truth is on the page,** muted and in italics in the year column of untested systems ("really: ✗",
  "really: 14 h") and as "found / really" on the tiles. The auditor would not see it; the class needs to, to compare
  orders. No instructor material is involved (the firm and its systems are made up here).
- **Scheduling:** the panel's order fills the plan automatically (critical first, as listed, quickest first) with a
  rotation (fewest tests so far first, the order breaks ties), so the same number of tests leaves different systems
  untested. The task's "schedule restore tests" is also a hand-made plan: a click on a cell adds or removes a test and
  switches the order to *own plan*; a click on a full quarter is refused with the reason in the caption (the cell keeps
  focus, `aria-pressed` on cells). The plan travels in the URL as one hidden 48-bit number.
- **"Quickest first"** was added as a third order: it is the realistic way the quarterly box gets ticked, and it shows
  the concept from the other side (every test passes, the slow systems are never tested).
- **The requirement is "every system restored once a year"**, one yearly requirement per system walked through
  `trail.js`. `cmp-policy-to-record`'s backup standard is stricter ("every critical system once a quarter"); a second
  standard would be a second slider and, at 4 × 4 + 8 = 24 tests a year, needs six slots, which drowns the order
  contrast. Left out of scope (SPEC.md).
- **A failed test repairs the backup** (the failure is found, so it gets fixed); a retest is a slot the student plans,
  not automatic. A failed system without a later successful test stays a finding ("restore failed, no retest").
- **The directory restores in exactly its RTO (4 h against 4 h)** once repaired: this keeps "really slow" at two and
  gives the in-time-when-equal tie-break a real case.
- **The record shown** is the first really slow test, so the default and the critical-first presets show a record that
  says "restored" next to a time over the RTO; on tickets the same test shows the time and sign-off missing.
- **Short system names** ("ERP", "Directory" / "Imenik i prijava") so the grid fits at 1920×1080 in both languages
  with a 21rem side column.
- **Panel:** six presets in two columns (as `cmp-policy-to-record` does) so the panel fits without its own scroll.
- **Phone:** the grid drops the RTO and Backup columns and the words in cells (symbols stay), quarter headers become
  1–4, the side stacks below.
- **Evidence-trail model copied, not linked:** `models/trail.js` does not exist yet, so `trail.js` is a byte-for-byte
  copy of `sims/cmp-policy-to-record/trail.js @ 2e6ee25` with one header line naming its source (COMMON.md §6). Its
  rule tests for what this sim uses (yearly periods, `walk` findings) are in `sim.test.js`.
- **The firm is unnamed** ("the firm"), as in `cmp-policy-to-record`.
- **Clause and article numbers only in the explanation**, never on the stage. The stage foot says once: simplified, not
  legal advice, made-up firm, systems and numbers.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-restore-evidence/`; the open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022 by number only (never quoted): Annex A 8.13, clause 7.5. *(check: numbers from the 2022 edition's
  clause list, not checked against a copy)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(c) (EUR-Lex). *(check: paraphrased from memory)*
- GDPR, Regulation (EU) 2016/679, art. 32(1)(c) and (d) (EUR-Lex). *(check: paraphrased from memory; the Croatian
  official wording, "pravodobna ponovna uspostava dostupnosti", was not checked)*
- Catalogue seeds: `restore-drill` (the backup that lies), `rpo-rto`, `cmp-bia` (where RTOs come from).
- All numbers are illustrative (the page says so once): tiers, RTOs, restore times, which backups fail, the slot dates.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters": nothing there is specific to this entry. Related and
unverified, not on the page:

- How the regulation under the Zakon o kibernetičkoj sigurnosti (NN 14/2024) words the backup and recovery measure that
  matches NIS2 art. 21(2)(c), and whether it sets a testing frequency *(check)*.
- DORA (Regulation (EU) 2022/2554) has its own rules on backup policies and restoration testing for financial entities
  *(check the article, art. 12, before a DORA preset is considered)*.

## Term pairs

- *restore test*: the page uses **test obnove** (the catalogue's Croatian title), but `kit/glossary.js` has
  "restore test" = **proba oporavka** (from uvod-u-linux). The page writes the pair out instead of `[[restore test]]`
  so the two do not clash on one page. *(owner: which one should the compliance pages use?)*
- *recovery time objective* (ciljno vrijeme oporavka, RTO): as `rpo-rto` and `cmp-bia` write it.
- *backup job report* (izvještaj o kopiranju), *test slot* (termin za test), *quarter* (tromjesečje, "1. tromj."
  in the grid), *tier* (razina: kritičan, važan, ostali), *ticket* (zahtjev; "zatvoren zahtjev: test obnove
  obavljen"), *sign-off* (potpis vlasnika sustava), *scope* (opseg), *finding* (nalaz, as in `cmp-policy-to-record`),
  *isolated host* (izolirano računalo). Chosen here.
- `[[backup]]` (sigurnosna kopija) is the only glossary term used.

## Shared requests

- **Promote `trail.js` to `models/trail.js`** (already requested by `cmp-policy-to-record`); then this page includes
  `../../models/trail.js` instead of its copy, and the trail block of `sim.test.js` can go.
- **Optional: record quality in the trail model.** `walk` counts a record by its month only; this sim adds "complete or
  ticket" on top (rules 5–6). If `cmp-log-evidence` or `cmp-audit-sampling` needs the same, the smallest change is an
  optional `complete` flag per record and a `findings.incomplete` count, keeping every old result.

## Checks

- `node --test sims/cmp-restore-evidence/sim.test.js`: 24 tests (tie-breaks first, rules 1–10, the six presets, the
  copied trail model, strings, page, generic block).
- Mutation run by the builder: 25 mutations of `sim.js` (one per rule and tie-break), all killed after one added test
  (the plan mask's rounding).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 48 more mutations:
  31 killed, 7 equivalent or on unused fields (two unused fields were then removed), 10 real survivors. All ten now
  have tests and are killed on re-run (36/36 in the combined list): adding to a later quarter, a full quarter counted
  wrongly, the slow finding's order against nSlow's date order, a single slow restore still noted, the mask's bit
  layout as a literal, a click on an over-full own plan working on the stage's tests, twelve repeated tests not being
  "all tested", own plan with no slots refused as noSlots, a junk plan value. The reviewer also found the ticket count
  counted systems instead of records (now every ticket of a successful test: 22 with six slots), a Croatian agreement
  error in nSlow ("Plaće vraćen je"; now "Plaće: obnova je trajala…"), tier 3 in the plural (now "manje važan" / "less
  important"), and that the page did not say "once a year" is the made-up firm's own standard (now in capAll, the
  preset hint and the explanation).
- Browser: `npm run check:page` 47/47; clicks on cells checked in a browser (add, remove, a full quarter refused by
  mouse and by keyboard, focus kept on the cell).

## Time

Start 20:00, done 20:25 (2026-11-07), one session.
