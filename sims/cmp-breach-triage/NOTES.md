<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-breach-triage: notes

New stepper (task `docs/tasks/w3/cmp-breach-triage.md`, catalogue `cmp-breach-triage` §4.13; builds on the incident
clocks of `cmp-incident-clocks`, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **A transparent score, not the EDPB's full weighing.** The task asks to "toggle the factors (encrypted, which data,
  how many people, recovered in time)" and watch the decision move. The model turns that into one visible sum: the
  data's points (contact 1, financial 2, health 3) + 1 for 1000 people or more, counted only when a loss is left
  uncontained; 2 notifies, 3 informs. The points and thresholds are made up and the page says so; the explanation lists
  the factors the EDPB actually weighs. A full severity methodology was left out (one concept, size S).
- **Each control contains one kind of loss.** Encryption with a safe key contains confidentiality only; recovery in
  time contains integrity and availability only. That carries the lessons without extra rules: a backup does not undo a
  copy the attackers took (ransomware), a sent e-mail cannot be taken back, encryption does nothing for a failed
  restore. Encryption has three states (none, key safe, key lost) so the "key that was not lost" of the concept is a
  click away (preset 2).
- **The score ignores how many losses are left** (two count the same as one). Simpler, and it means the two summary
  counterfactuals ("without the controls" / "with them") never appear together (SPEC rule 8, tested).
- **Four fixed cases** (the catalogue's four) set which losses happen and when the firm became aware; data and people
  are params, so a case is not tied to one kind of data. The case card shows what each control means in that case.
- **Steps (7) are the triage questions**, the same for every case: the case, is it a breach (record ✓ at once: "every
  breach goes into the register whatever the outcome"), confidentiality, integrity and availability, risk, notify,
  inform, summary.
- **The contrast** is with and without the controls: the dashed cell on the meter from the risk step and the dashed tag
  on the ladder at the summary, plus the two caption sentences.
- **The clock is reused, not re-taught.** The notify box shows the GDPR deadline (awareness + 72 h) and the filing time
  from `clocks.js` (office hours, 3 hours of work); every case files in time. Deadlines are `cmp-incident-clocks`'
  subject; the explanation links it.
- **`clocks.js` is copied unchanged** from `sims/cmp-incident-clocks/clocks.js` @ b48f936 (only its header comment
  gained a provenance line), with its tie-break and rule tests copied into `sim.test.js` ("clocks rule …"), as
  COMMON.md §6 asks while `models/clocks.js` does not exist.
- **Firm unnamed** ("a small firm"), as the other compliance sims. Articles only in the explanation, never on the
  stage. The stage foot says once: simplified, not legal advice, made-up firm, cases, points and thresholds.
- **Legend** keeps three items (lost, contained, without the controls), each with its glyph so it survives grayscale;
  the outcome boxes say "required / not required" in words. Five items wrapped the Croatian title onto two lines.
- **No glossary terms** (`[[…]]`); pairs are written out in the explanation (Croatian bold, English in italics), as
  `cmp-incident-clocks` does. The page does not link `glossary.js`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-breach-triage/`; the open questions are here under "For the owner" and in the report.
- Title shortened for the 60-character limit: "Povreda osobnih podataka: evidencija, prijava, obavijest" (the catalogue's
  "…: evidentirati, prijaviti, obavijestiti" is 63 characters). The English title is the catalogue's.

## Sources

See `SPEC.md` "Sources": GDPR art. 4(12), 9, 33(1), 33(5), 34(1)–(3); EDPB Guidelines 9/2022 and 01/2021.
Unchecked in this session, marked *(check)* there:

- the Croatian wording of art. 33(5) and 34(3)(a) on EUR-Lex *(check)*;
- the EDPB paragraph and example numbers *(check)*.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters" (not verified, not on the page):

- The supervisory authority is the Agencija za zaštitu osobnih podataka (AZOP); the page says only "nadzorno tijelo".
- The Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) adds national rules (for example on fines for public
  bodies) *(check whether anything in it touches breach notification or the register)*.
- Whether AZOP publishes its own breach-notification form or guidance that should be linked from the explanation
  *(check)*; the page copies no official form.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *personal-data breach* (povreda osobnih podataka), *supervisory authority* (nadzorno tijelo), *data subject*
  (ispitanik), *controller* (voditelj obrade), *processor* (izvršitelj obrade): the Croatian GDPR text, as the task
  lists them.
- *confidentiality, integrity, availability* (povjerljivost, cjelovitost, dostupnost).
- *internal breach register* (interna evidencija povreda): art. 33(5) says the controller "dokumentira" every breach;
  "evidencija" is my choice for the record it keeps.
- *risk unlikely / likely / high* (rizik malo vjerojatan / vjerojatan / visok).
- *ransomware* (ucjenjivački program): chosen; "ucjenjivački softver" is also in use.
- *contained* (zaštićena, of a loss): chosen; literally "protected".
- *special category of data* (posebna kategorija podataka).

## Shared requests

- **Promote `clocks.js` to `models/clocks.js`** (already requested by `cmp-incident-clocks`); then point this page at
  `../../models/clocks.js`, drop the copy and the copied "clocks rule" tests here.

## Checks

- `node --test sims/cmp-breach-triage/sim.test.js`: tie-breaks first (thresholds, exactly 1000 people, one loss left,
  key lost = none, irrelevant controls), triage rules 1–9, the six presets, the copied clocks tests, strings, page,
  generic block.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 83 mutations of
  `sim.js`: 62 killed, 12 equivalent, 9 survived. All nine now have tests (the "without" counterfactual turning off
  each control, half-up step rounding, integrity contained at the availability step, the event time of every case, the
  people list). Its other points were applied: Croatian accusative after "za" ("za 1 osobu", new `peopleAcc`),
  "Prodavaču je … ukraden laptop", "kontaktni podaci", "obvezna"; the explanation no longer pins "only recorded" on
  art. 34(3)(a) (not notifying is art. 33(1) as the EDPB reads it, and needs the backup too; not informing is
  34(3)(a)); the reasons for not notifying attributed to the EDPB, not art. 33(5); the notify box and caption say
  "without undue delay, at most 72 h"; prepositions before times; "the key (password)" in `cConfLost` so it fits
  ransomware; the state's `n` is the clamped step.
- `npm run gate -- cmp-breach-triage`: pass. Screenshots reviewed at 1920×1080 light, dark and grayscale and at 375×812,
  both languages, plus extra shots of steps 4, 6 and 7 for several presets.

## Time

Start 18:38, done 19:00 (2026-11-07), one session (about 22 minutes).
