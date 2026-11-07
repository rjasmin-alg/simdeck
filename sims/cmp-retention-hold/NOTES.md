<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-retention-hold: notes

New explorer (task `docs/tasks/w3/cmp-retention-hold.md`, catalogue `cmp-retention-hold` §4.13). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The contrast is the stage.** A timeline 2020–2031 with one bar per record: in use, within retention (counted from
  its trigger), then either deleted (a mark) or kept too long (striped). Four numbers above it: kept too long (with
  the months over), deleted on time, deleted during the dispute, erased but still in the backups. The control's
  written form against its operating form: periods with no deletion routine (preset 1) against a routine that runs
  (preset 2); a hold announced by e-mail that the routine never hears of (3) against one in the routine (4), one
  never lifted (5) and one on everything (by hand).
- **Thirteen fixed records, no randomness.** Three classes (job applications of candidates not hired, customer
  contracts, personnel files of people who left), four or five records each, so every row has a name and the
  stage can be read aloud. The customer dispute touches one contract (Lipa), the employee dispute one personnel file
  (Marko). Months are the unit; the read point is the end of a chosen year ("run the years" is the year stepper).
- **Needed and skipped are separate.** The model keeps what makes keeping lawful (before the due month, or while a
  dispute that touches the record runs) apart from what the routine does (it skips what a hold tells it to). That
  one split gives all four outcomes: kept too long (not needed, not deleted), deleted on time, deleted during the
  dispute (deleted while needed), and a hold that keeps too much (skipped, not needed).
- **Yearly deletion counts as late.** A routine once a year deletes everything between 1 and 11 months after its date;
  the page counts those months as kept too long. Many organisations write periods as "until the end of the year
  after…"; the page's periods are counted to the month to make the lag visible (see "For the owner").
- **Backups age by a single rule.** One backup at the end of each month, each kept `backup` months, so an erased
  record stays in the backup set for exactly `backup` months after its deletion. GFS rotations (weekly, monthly,
  yearly copies) are `retention-gfs`'s subject; here the longest-kept copy is what matters, and the stepper sets it.
- **Panel and stage.** The panel holds the three choices (deletion routine, dispute, hold). The year, the dispute's
  start and length, the backup period and the three retention periods are − / + steppers on the stage next to what
  they move: with them in the panel it was 950 px against 864. Hold labels are short ("najava / u rutini /
  neukinuta / na sve") so the four fit one row at 1920×1080; the preset names say them in full.
- **One model file.** None of §5.24's four shared models is used. `life`, `needed`, `skipped`, `readRecord` and
  `measure` are pure over plain data; `cmp-data-subject-request` (catalogue: "the backup ageing from
  cmp-retention-hold") can copy the backup rule (rule 7: in the backups while now < deletion + backup).
- **Words:** no glossary terms (`[[…]]`); the explanation writes the terms out, Croatian bold with the English in
  italics, as the other `cmp-` pages do. Dates are numeric (`02/2028`), the same in both languages. "Simplified, not
  legal advice; the firm, records and periods are made up; statutory periods differ" is said once, in the stage's
  foot. No answer keys: nothing from `dr-lecture-estate/instructor/`; the DR S8 student scenario only motivated the
  retention-plan framing.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Most controls are stage steppers, not panel controls (panel height, above).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-retention-hold/`; open questions are here and in the report.

## Sources

- GDPR, Regulation (EU) 2016/679 (EUR-Lex): art. 5(1)(e) storage limitation (kept no longer than necessary);
  art. 17 right to erasure, 17(3)(e) the exception for the establishment, exercise or defence of legal claims (the
  basis for keeping what a dispute needs); art. 30(1)(f) the envisaged time limits for erasure in the record of
  processing activities; art. 13(2)(a) the storage period told to the data subject (not on the page). *(check: the
  official Croatian wording used on the page, "ograničenje pohrane", "pravo na brisanje", "pravni zahtjevi",
  "evidencija aktivnosti obrade")*
- ISO/IEC 27001:2022 Annex A, by number only: 5.33 protection of records, 8.10 information deletion, 8.13 information
  backup. *(check: numbers and titles against the 2022 edition)*
- That erased data may remain in backups until they are overwritten, provided it is not restored into use, is the
  common supervisory reading (several authorities' guidance on erasure and backups); no EU text states it directly.
  The page says only "a restore must not bring erased data back into use". *(check: whether the EDPB or AZOP has a
  statement to cite)*
- Legal hold as a practice (suspending deletion for a dispute or investigation) comes from litigation practice, not
  from an EU text; the page ties it to art. 17(3)(e).
- Every period on the page (applications 1 year, contracts 5, personnel files 6, backups 1 year by default) is
  illustrative; the page says so.
- The Python re-implementation in `SPEC.md` checks every preset number and four hand-set cases.

## For the owner

- Statutory retention periods for accounting, payroll and personnel records come from several Croatian laws (Zakon o
  računovodstvu, Zakon o radu, Zakon o arhivskom gradivu i arhivima, and the tax rules) *(check every period before
  one is quoted anywhere; source: Narodne novine, the consolidated texts)*. None is on the page; the foot says
  statutory periods differ. Some personnel data may have to be kept permanently *(check)*, which would make a
  6-year default for personnel files misleading if anyone took it as the rule.
- Whether to count a once-a-year deletion as "late" (the page: yes, the months after the due date are over) or to
  define periods as "to the end of the year" so a January run is on time.
- Whether a hold should also cover the backups that hold a touched record (out of scope now; it would add a second
  concept).
- The settled term *obustava brisanja zbog spora* is used; for an investigation rather than a dispute the page says
  only "spor ili istraga" in the explanation.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *retention period* (rok čuvanja), *storage limitation* (ograničenje pohrane), *right to erasure* (pravo na
  brisanje), *legal hold* (obustava brisanja zbog spora; settled 2026-11-07), *deletion routine* (rutina brisanja),
  *trigger* (written out: "rok od kraja ugovora", "rok od odluke o odabiru"), *kept too long* (predugo čuvano),
  *deleted on time / late / during the dispute* (obrisano na vrijeme / kasno / tijekom spora), *backup set* (skup
  sigurnosnih kopija), *backups* (sigurnosne kopije), *personnel file* (dosje radnika), *job application* (prijava na
  natječaj), *held for the dispute* (potreban zbog spora; legend "za spor").

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in the other `cmp-` sims).
- For the kit: the small stage button and − value + stepper (`.rh-b` here, `.ps-b` in `cmp-patch-sla`, `.pa-b`,
  `.sx-b`): four sims draw the same control; a param type "stepper over a list of values" would let some of them
  stay in the panel.

## Checks

- `node --test sims/cmp-retention-hold/sim.test.js`: boundaries and tie-breaks first (deleted in the due month is on
  time, the dispute's [from, to) and the lift month, the backup's last month, nearest-value ties, January-only
  yearly runs, trigger and due boundaries, one month late is late), then rules 1–10, the presets against SPEC, the
  generic block.
- Mutation check (mine): 55 deliberate breaks of `sim.js`; 52 make a test fail. The three survivors are equivalent
  with these records and whole-year disputes: nHeld's "due inside the dispute" guard (a due month before the dispute
  under a monthly routine is always deleted before it, so nGone fires first); nAll counting the touched record (it is
  needed through the dispute and deleted on time at the lift); a zero-width segment guard (no record has from =
  trigger or a zero period).
- Python re-implementation (`SPEC.md`), month by month: identical numbers. It caught one page defect while writing:
  the caption's "kept for a reason" left out records still in use.
- Fresh reviewer (a separate agent, no part in the build): reproduced the table, ran a 30 000-case differential check
  of `compute` against the Python (no mismatch) and 76 mutants of its own. Applied: nAll counted records the hold had
  not delayed (no routine, or the hold not yet lifted) and broke agreement at n = 1, now it counts only records
  deleted late in the lift month and the sentence takes the count after a colon; nHeld fired without a monthly
  routine and for a hold on everything, now it needs both; nYearly's wait included a hold's months, now the routine's
  own wait (`wait`, months in [due, deletion) the routine did not skip); nForgotten's months now count from the
  dispute's end; "povreda / breach" (a defined GDPR term for something else) replaced by "krši načelo ograničenja
  pohrane / infringes the storage limitation principle"; a one-year dispute reads "spor 2027." not "2027–2027"; the
  band label on a phone no longer flips off screen; nGone says the data may be in the backups only when it still was
  at the dispute's start (else nGoneAged); nBackup no longer agrees with its count; "spor je završen"; tests for every
  real gap it listed (the dispute's first month, a deletion in the window's last month, zero-width segments, the
  touched flag per dispute, the start clamp, each caption guard).
- `npm run gate -- cmp-retention-hold`: pass; screenshots at 1920×1080 light, dark, grayscale and 375×812, both
  languages, reviewed. The phone layout first overlapped lane headers with rows; each lane now has its own header row
  on a phone. The deletion swatches carry the stage's glyphs (✓ ! ✕) so they read in grayscale.

## Time

Start 17:45, done 18:10 (2026-11-07), one session, including the fresh review.
