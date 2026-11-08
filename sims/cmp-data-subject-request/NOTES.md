<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-data-subject-request: notes

New stepper (task `docs/tasks/w3/cmp-data-subject-request.md`, catalogue `cmp-data-subject-request` §4.13). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **The viewer sees the truth, the team sees its list.** Eight cards show every place that really holds the former
  customer's data; each carries "on the list" or a dashed "not on the list" for the chosen map. The team walks the
  places in order, one per step, so a missed place still gets its step and the class watches nobody look there. That
  keeps the step count fixed (11) for every map, as the kit's stepper requires.
- **Three maps, one contrast.** Complete (the record of processing activities plus a data map that names the copies
  and their owners), systems only (the record lists the systems, not the exports, test copies and personal mailboxes
  people made), none (the team searches what it remembers and asks around, four extra days per place). The
  systems-only map gives the fastest answer and the least complete one, so speed and completeness come apart.
- **The clock starts on receipt.** The `noticed` slider is the days the request sat in the support mailbox before
  anyone passed it on; it runs on the clock all the same (preset 4). A complete map with the same two-week wait still
  answers on the due day itself (tie-break, in the tests).
- **Erasure is not "everything goes".** The invoices stay (a legal obligation, art. 17(3)(b)), the processor erases on
  instruction, and the backups age out; with a map the erasure record says until when and that a restore must be
  followed by erasing again, without one nobody wrote it down. Missed places "still exist" afterwards.
- **The backup rule is copied as a rule, not as code.** `cmp-retention-hold` works in months (`now < del + backup`, its
  rule 7, `sims/cmp-retention-hold/sim.js @ 2b52a45`); this sim needs days for a one-month deadline, so `plan` applies
  the same rule at day granularity (`gone = addMonths(lastErase, backup)`, in the backups while day < gone,
  `inBackup`). No function was copied; nothing of §5.24's four shared models is used.
- **No extension parameter.** The two further months are only for complex or numerous requests, with a notice and
  reasons within the first month; a note under the clock strip gives that limit (1 June 2027) and
  the late caption says a request forgotten in the mailbox is neither, so it does not read as a workaround. Modelling
  the extension would add a decision that is not the concept.
- **Dates.** One fixed calendar, day 0 = Monday 1 March 2027, so "one month" is a real date (1 April) and month-end
  clamping is tested. Dates are shown as "1. 4. 2027." and "1 Apr 2027".
- **Words:** no glossary terms (`[[…]]`); the explanation writes the terms out, Croatian bold with the English in
  italics, as the other `cmp-` pages do. "Simplified, not legal advice; the firm, the data subject, the places and the
  durations are made up" is said once, in the stage's foot. No answer keys: nothing from `dr-lecture-estate/instructor/`.
- **Panel.** Six presets in two columns; controls: request kind, data map, days in the mailbox, and the backup period
  (in both kinds: an access answer states it too).

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-data-subject-request/`; open questions are here and in the report.

## Sources

- GDPR, Regulation (EU) 2016/679 (EUR-Lex): art. 12(3) one month from receipt, extendable by two further months for
  complex or numerous requests, the data subject informed within the first month with the reasons; art. 15(1) and
  15(3) what the answer contains (purposes, recipients, envisaged storage period; a copy of the data); art. 17 right to
  erasure, 17(3)(b) the exception for a legal obligation; art. 19 notifying recipients; art. 28(3)(e) the processor
  assists with requests; art. 30 the record of processing activities (30(1)(f) time limits for erasure). *(check: the
  official Croatian wording used on the page: "pravo na pristup", "pravo na brisanje", "evidencija aktivnosti obrade",
  "izvršitelj obrade", "bez nepotrebnog odgađanja", "u roku od mjesec dana od zaprimanja zahtjeva")*
- EDPB Guidelines 01/2022 on data subject rights – Right of access: how the month is counted (receipt to the same
  date next month, the last day of the month when there is none) and that the search covers all the controller's
  systems. *(check: paragraph numbers before citing; the page does not quote them)*
- That erased data may remain in backups until they are overwritten, provided a restore does not bring them back into
  use (re-applying the erasure), is the common supervisory reading; no EU text states it directly. *(check: whether the
  EDPB or AZOP has a statement to cite; same open item as `cmp-retention-hold`)*
- A deadline that falls on a weekend or holiday moves to the next working day (Regulation (EEC, Euratom) No 1182/71);
  the page's dates (1 April 2027 is a Thursday) never hit that case. *(check)*
- The Python re-implementation in `SPEC.md` checks every preset number and four hand-set cases.

## For the owner

- How long invoices must be kept comes from Croatian accounting and tax law *(open: not stated by the owner; the page gives no period and
  quotes none until one is stated with its law and article)*.
- Whether an access answer must itself search the backups, or may describe them as copies of the live data with
  their storage period (the page does the latter) *(check against EDPB 01/2022)*.
- The term choices below.

## Settled

- The supervisory authority in Croatia is the Agencija za zaštitu osobnih podataka (AZOP), and the Zakon o provedbi
  Opće uredbe o zaštiti podataka (NN 42/2018) adds national rules (catalogue §4.13): owner confirmed 2026-11-08. On the page: a short
  "U Hrvatskoj / In Croatia" paragraph in the explanation; captions still say only "nadzorno tijelo".

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *data subject* (ispitanik), *controller* (voditelj obrade), *processor* (izvršitelj obrade), *supervisory authority*
  (nadzorno tijelo): the official terms, as settled.
- *right of access* (pravo na pristup), *right to erasure* (pravo na brisanje), *record of processing activities*
  (evidencija aktivnosti obrade): the GDPR's Croatian text *(check)*.
- *data map* (karta podataka), *erasure record* (zapis o brisanju), *backups* (sigurnosne kopije), *kept by law*
  (zadržano po zakonu), *support mailbox* (pretinac podrške), *customer records* (evidencija kupaca), *test copy of the
  database* (testna kopija baze): chosen here.

## Shared requests

- For `models/`: none. If the coordinator promotes a backup-ageing helper from `cmp-retention-hold`, a day-granularity
  variant (or a unit parameter) would let this sim use it.

## Checks

- `node --test sims/cmp-data-subject-request/sim.test.js`: tie-breaks and boundaries first (the due day itself is on
  time, month-end clamping, the backup's last day, a missed place takes no time, the last erasure ignores the
  processor, param and step clamping), then rules 1–10, the presets against SPEC, the generic block.
- Mutation check (mine): 30 deliberate breaks of `sim.js`, 28 caught; of the two survivors one was a redundant guard
  (now removed), the other is equivalent with these places (`cAfterStill` keyed on `missed` instead of `still`: every
  map that misses the backups also misses a live place).
- Python re-implementation (`SPEC.md`), with Python's own calendar: identical numbers.
- Fresh reviewer (a separate agent, no part in the build): reproduced every SPEC number, ran 34 mutants of its own (8
  survived: 2 real gaps, now tested, the step clamp and the full backup list; 6 equivalent in the reachable range).
  Applied: "prije {n} dan" (wrong case) replaced by "{n} nakon roka"; the late caption and the strip's extension label
  no longer suggest an extension would have saved a forgotten request (only complex or numerous requests); the hr
  explanation "Voditelj obrade odgovara … od zaprimanja"; after an erasure that missed places the backups card no
  longer shows a green "aged out" (missed data are still backed up) and the captions say the erased data aged out;
  "today is the due day itself" instead of "0 days left"; access captions say the answer "covers" n places (the
  backups only by their period) and "did not receive" counts live places; "logged the next day" matches the clock;
  the unused `mNoticed` string removed; the backup period shown for access too; art. 28(3)(a) and (e); "usually
  cannot be erased" agrees with the explanation. Not applied: the strip's segments in the header legend (the header
  is full; the due and answer lines are labelled on the stage).
- `npm run gate -- cmp-data-subject-request`: pass; screenshots at 1920×1080 light, dark, grayscale and 375×812, both
  languages, reviewed.

## Time

Start 18:12, done 18:45 (2026-11-07), one session, including the fresh review.
