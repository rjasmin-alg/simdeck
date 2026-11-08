# cmp-bia: Business impact analysis: what must come back first

| | |
|---|---|
| Task | `cmp-bia` (wave 3, Compliance and procedures for IT managers) |
| Catalogue entry | `cmp-bia` in `docs/catalogue.md` §4.13 |
| Kind | build a new simulator |
| Folder | `sims/cmp-bia/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | CMP, DR |
| Topic / tags / level | `compliance` / `disaster-recovery`, `risk` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the analysis sets each business process's maximum tolerable downtime; a supporting system inherits the shortest one of every process that depends on it (identity, name resolution and the network end up most urgent); its recovery time objective must be below that, and the gap between required and achievable recovery is the work list**.

The student: set tolerable downtime for a handful of processes, draw what they depend on, watch required RTOs propagate down the graph, enter what recovery can achieve today and read the gaps and the recovery order.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.13.

## Sources

- `/home/rjasmin/projects/faultline/js/engine/`, `/home/rjasmin/projects/faultline/js/samples.js`, `/home/rjasmin/projects/faultline/PEDAGOGY.md`
- The primary texts under "Compliance notes" below (EUR-Lex, Narodne novine, the EDPB's guidelines); mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: rpo-rto; the hidden dependencies of faultline and ha-never-zero-spof; the price of the hours in fin-downtime-cost → §5.24

## Compliance notes (all `cmp-` tasks)

- **Who it is for:** IT managers, and IT staff stepping into management, in Croatia; they know the systems, not the law or the audit. Each page puts a procedure or a control in motion and shows one contrast (with and without the control, written vs operating, the average vs the tail, the clock started at awareness vs at the attack); make that contrast the stage, not the rule text.
- **Not legal advice.** Name a law or standard only where the concept comes from it (GDPR / Opća uredba o zaštiti podataka, NIS2 and the Croatian Zakon o kibernetičkoj sigurnosti, ISO/IEC 27001, DORA) and cite the article or clause in the explanation, not on the stage. General principles only; no product, vendor or tool names; no step that reads as "do this and you are compliant". The page says once that it simplifies and is not legal advice.
- **Primary sources:** the EU texts on EUR-Lex (GDPR is Regulation (EU) 2016/679, NIS2 Directive (EU) 2022/2555, DORA Regulation (EU) 2022/2554; use the official Croatian versions for the Croatian strings), the Croatian law in Narodne novine, the European Data Protection Board's guidelines (breach notification, impact assessment criteria), and ISO/IEC 27001 by clause number only (the text is paid; never quote it). Cite them in SPEC.md.
- **Deadlines, thresholds and fines:** use the EU text's values where the entry needs them (GDPR's 72 hours and one month, NIS2's 24 hours / 72 hours / one month) with the article. The Croatian details in §4.13 ("Where Croatian and EU practice matters": bodies, the regulation, who categorises entities, AZOP, the workers' council, HNB and HANFA) were confirmed by the owner on 2026-11-08 and may go on the page, each with its law. A Croatian detail not listed there (a national threshold, a retention period, a fine amount) still gets *(check)*: keep it off the page and copy it into `NOTES.md` under "For the owner" with the source you would check.
- **Numbers are illustrative.** Failure rates, team sizes, ticket counts and costs are made-up but plausible, and the page says so once; formulas (sampling probability, likelihood × impact, a fine ceiling as the higher of two values) are standard and checked in SPEC.md with a small script.
- **One fictional organisation:** a small made-up firm with made-up people and systems; never a real company, a real authority's logo or a copy of an official form. Authorities appear by role (nadzorno tijelo / supervisory authority, nadležni CSIRT / competent CSIRT).
- **Croatian terms:** the terms of the official Croatian texts (voditelj obrade, izvršitelj obrade, ispitanik, povreda osobnih podataka, procjena učinka na zaštitu podataka, nadzorno tijelo; ključni i važni subjekti, značajan incident). The owner settled these on 2026-11-07, use them as they are: obustava brisanja zbog spora (legal hold), odbor za promjene (change advisory board), račun za hitne slučajeve (break-glass account), dolazak, premještaj, odlazak (joiner, mover, leaver), načelo četiri oka, razdvajanje dužnosti, razine zrelosti. For any other term without a settled Croatian form, choose one, give the English in brackets once, and list your choices in `NOTES.md` so the owner can check them in one place.
- **Shared models (catalogue §5.24):** keep people × roles × rights, the risk scoring, the incident clocks or the evidence trail in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.13 has the proposed `compliance` area).

## Overlaps (catalogue §5)

- **§5.24 Compliance: four shared models, and evidence on top of existing sims:** Four shared models, each built first in its hub sim and copied by the others, like §5.23's ledger: people × roles × rights over time (cmp-jml-drift; cmp-sod-toxic and cmp-privileged-access read the same assignments, cmp-four-eyes adds an approval queue); risk scoring (cmp-risk-register; the impact assessment, supplier tiers and exceptions score the same way, and its money view is fin-ale-risk's expected loss, which cmp-cost-of-noncompliance reuses too); the incident timeline with clocks (cmp-incident-clocks; cmp-breach-triage adds the decision); the evidence trail, a requirement and its records over a period (cmp-policy-to-record; cmp-audit-sampling draws from it, cmp-restore-evidence and cmp-log-evidence fill it). The compliance pages link the technical ones instead of repeating them: cmp-restore-evidence ↔ restore-drill (the restore that lies) and rpo-rto; cmp-bia ↔ rpo-rto, faultline, ha-never-zero-spof, fin-downtime-cost; cmp-retention-hold and cmp-data-subject-request ↔ retention-gfs (erased data ageing out of backups); cmp-privileged-access ↔ lateral-movement, win-laps; cmp-jml-drift ↔ win-group-scopes, win-access-token; cmp-change-risk-class ↔ lnx-deploy-strategies and §5.22's rings; cmp-patch-sla ↔ win-wsus-flow; cmp-log-evidence ↔ lnx-log-path, win-ipam-audit, ntp-sync; cmp-shared-responsibility ↔ fin-cloud-commitment.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh cmp-bia sims/cmp-bia` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cmp-bia/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
