<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-policy-to-record: specification

Task `docs/tasks/w3/cmp-policy-to-record.md`, catalogue `cmp-policy-to-record` (§4.13; seed: DR S9, pass the client
audit; hub of the evidence-trail model, §5.24). Class **stepper**, 16 steps. The state at step *n* is a pure
function of *n* and the params (`sim.js`); the evidence-trail model is `trail.js` (pure, promotable to `models/`).

**One concept:** a policy states intent, a standard makes it measurable, a procedure says how, a record proves it
happened; the auditor walks down from the requirement to the records for the whole period, and the first missing
layer breaks the trail. A break above the records is a **design** finding (the rules are missing or cannot be
tested); a complete chain with missing records is an **operating** finding (written, not done: paper compliance when
no record exists at all, gaps in the dates when the procedure stopped being followed).

**The contrast on the stage:** three requirements side by side, each a chain of four layers walked top to bottom,
so a broken design and a broken operation stand next to each other and end in different findings, while records
that exist below a break still do not count.

## Stage

Three columns, one per requirement. Each column, top to bottom:

1. the requirement's name (the clause it comes from is cited in the explanation, not on the stage);
2. **policy** card (the statement, or "no policy");
3. **standard** card (the measurable statement, a vague one, or "no standard");
4. **procedure** card (the steps in one line, or "no procedure");
5. **records** strip for the 12-month audit period: one cell per period (12 monthly cells labelled 1–12, or four
   quarterly cells labelled 1–3, 4–6, 7–9, 10–12), a record ✓ (filled) or no record (hollow, dashed; ✗ once the
   auditor has looked), and the count;
6. **finding**: "?" until revealed, then *no finding*, *design* or *operation* with its reason.

Between the layers a connector: solid while the trail holds, a ✗ at the break, dotted below it. Layers below a break
are hatched, "outside the trail". The layer the auditor is at is highlighted; visited layers carry their verdict tag
(✓, ✗ missing, ≈ not measurable). The stage foot says once that the page simplifies, is not legal advice and uses a
made-up firm and made-up numbers.

## Fixed data (illustrative)

Audit period: months 1–12 of one year. Three requirements of a small made-up firm (ISO/IEC 27001:2022 Annex A
controls, by number only, cited in the explanation):

| id | requirement (A.) | policy | measurable standard | vague standard | procedure | frequency |
|---|---|---|---|---|---|---|
| `backup` | backups (A.8.13) | backups are tested | every critical system restored once a quarter | backups are tested regularly | restore to an isolated host, check the data, note the time, the owner signs | quarterly (4 periods) |
| `access` | access rights (A.5.18) | access by need, reviewed | the system owner reviews admin rights every month | rights are reviewed from time to time | export the admin list, the owner marks keep/remove, IT removes, both sign | monthly (12) |
| `patch` | technical vulnerabilities (A.8.8) | known vulnerabilities fixed in time | critical updates within 14 days, a report every month | updates are installed promptly | list missing updates, install by severity, report what is open and why | monthly (12) |

The 14 days and the frequencies are illustrative *(the page says so once)*.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `r1`, `r2`, `r3` | select | `complete`, `no-policy`, `vague`, `no-standard`, `no-procedure` (`complete`, `no-policy`, `complete`) | the chain of requirement 1–3: whole, or one layer deleted or weakened |
| `g1` | range 0–4 | (4) | backup: the last *g* quarters have no record |
| `g2`, `g3` | range 0–12 | (0, 3) | access, patch: the last *g* months have no record |

## Rules

### The evidence trail (`trail.js`, promotable)

1. **Periods.** A frequency is a number of months per period: monthly 1, quarterly 3, yearly 12. The audit period
   of *M* months splits into ⌈*M* ÷ *f*⌉ periods; period *k* (from 0) runs from month *k·f* + 1 to min((*k*+1)·*f*,
   *M*). An unknown frequency is an error (thrown).
2. **Coverage.** A record dated in month *m* covers the period containing *m*. **Tie-break:** months 3 and 4 fall in
   different quarters (a record at a period's last month covers that period, not the next). Records outside 1…*M*
   are ignored. **Two records in one period count once**: an extra record never fills another period. A period is
   covered when it holds at least one record.
3. **The walk** goes policy → standard → procedure → records. The **trail breaks at the first layer that fails**:
   policy missing; standard missing or vague (a vague standard names no frequency, so nothing can be counted);
   procedure missing. Every layer below the break is *outside the trail*: the auditor still notes what is there, but
   it cannot be tied to the requirement.
4. **Records status.** With a measurable standard: covered periods of all periods; `ok` when all are covered,
   `none` when none is, `gaps` otherwise. With a vague or missing standard there is no expected number: `found`
   when there is at least one record in the period, `none` otherwise.
5. **Finding**, from the first break (**tie-break: the highest failing layer names the finding, and design comes
   before operation**):
   - break at policy → *design*, `no-policy` (with records below: "records without a policy have no mandate");
   - break at standard → *design*, `no-standard` or `vague-standard`;
   - break at procedure → *design*, `no-procedure`;
   - no break, no period covered → *operation*, `not-operating` (paper compliance: designed, not operating);
   - no break, some periods uncovered → *operation*, `gaps`;
   - no break, all covered → *none*.
   A finding carries `expected` (periods, or null without a measurable standard), `found` (covered periods, or
   record count without a measurable standard), `missing` (indices of uncovered periods) and `last` (the month of
   the last record, or null).

### The sim (`sim.js`)

6. **Params (normalise).** `r1`…`r3` not one of the five → their default. `g1`…`g3`: non-numbers (`null`, `''`,
   `true`, `NaN`, `Infinity`) take the default; numbers are rounded (half away from zero) and clamped to 0…periods
   of their requirement (`g1` 0–4, `g2`/`g3` 0–12).
7. **Records.** A requirement's records are one per period, dated at the period's last month (monthly 1…12,
   quarterly 3, 6, 9, 12), except the last *g* periods, which have none (the procedure stopped being followed). The
   choice changes only the documents, never the records: a vague, missing or orphaned layer keeps the records the
   firm actually made.
8. **Chain.** `complete`: policy, measurable standard, procedure. `no-policy`: no policy. `vague`: the standard is
   vague. `no-standard`: no standard. `no-procedure`: no procedure. One choice changes one layer.
9. **Steps (16).** Step 0: the three chains as built, nothing walked. Steps 1–15: requirement *i* = ⌊(*n* − 1) ÷ 5⌋,
   stage (*n* − 1) mod 5 = policy, standard, procedure, records, finding. The finding stage reveals the finding (the
   records stage leaves it "?" so the class can call it first). Step 16: the report, every finding shown and counted.
   Back is replay (the kit), so going back hides what was not yet walked.
10. **Report counts:** design, operation and no-finding requirements; they sum to 3.

## Presets and expected outcomes

Checked with an independent script (`python3`, below) and by the tests.

| # | id | r1 / g1 | r2 / g2 | r3 / g3 | findings (backup, access, patch) | design / operation / none |
|---|---|---|---|---|---|---|
| 1 | `audit-day` (= defaults) | complete / 4 | no-policy / 0 | complete / 3 | operation not-operating 0/4 · design no-policy (12 records outside) · operation gaps 9/12, last record month 9 | 1 / 2 / 0 |
| 2 | `whole-trail` | complete / 0 | complete / 0 | complete / 0 | none 4/4 · none 12/12 · none 12/12 | 0 / 0 / 3 |
| 3 | `paper` | complete / 4 | complete / 0 | complete / 12 | operation not-operating 0/4 · none 12/12 · operation not-operating 0/12 | 0 / 2 / 1 |
| 4 | `no-mandate` | no-policy / 0 | complete / 0 | no-policy / 12 | design no-policy (4/4 outside) · none · design no-policy (0/12 outside) | 2 / 0 / 1 |
| 5 | `weak` | vague / 2 | no-procedure / 0 | complete / 0 | design vague-standard (2 records: months 3, 6; expected null) · design no-procedure (12/12 outside) · none | 2 / 0 / 1 |
| 6 | `gaps` | complete / 1 | complete / 5 | complete / 0 | operation gaps 3/4, last month 9 · operation gaps 7/12, last month 7 · none | 0 / 2 / 1 |

Contrasts the presets carry: 1 every kind of break in one walk; 2 the trail holding; 3 the same documents with and
without records; 4 records do not rescue a missing policy (12 records or none, the same design finding); 5 a
weakened layer is a design finding even when the work is done every month; 6 gaps in the dates.

Independent check (run 2026-11-07, prints the table's last two columns):

```python
P = {'backup': 3, 'access': 1, 'patch': 1}
def find(choice, f, g):
    n = 12 // f; recs = [(k + 1) * f for k in range(n - g)]
    if choice == 'no-policy': return 'design no-policy', len(recs)
    if choice in ('vague', 'no-standard'): return 'design ' + choice, len(recs)
    if choice == 'no-procedure': return 'design no-procedure', len(recs)
    c = len(set((m - 1) // f for m in recs))
    return ('none' if c == n else 'operation not-operating' if c == 0 else 'operation gaps'), (c, n, recs[-1] if recs else None)
for r1, g1, r2, g2, r3, g3 in [('complete',4,'no-policy',0,'complete',3), ('complete',0,'complete',0,'complete',0),
        ('complete',4,'complete',0,'complete',12), ('no-policy',0,'complete',0,'no-policy',12),
        ('vague',2,'no-procedure',0,'complete',0), ('complete',1,'complete',5,'complete',0)]:
    print([find(r1, 3, g1), find(r2, 1, g2), find(r3, 1, g3)])
```

Output matches the table (e.g. preset 1: `('operation not-operating', (0, 4, None))`, `('design no-policy', 12)`,
`('operation gaps', (9, 12, 9))`).

## Legend

record (filled ✓) · no record (hollow, dashed) · outside the trail (hatched) · the auditor is here (highlight).
Finding badges carry their kind in words; design is dashed, operation solid, no finding has ✓.

## Terms (hr / en)

politika / policy · standard / standard · procedura / procedure · zapis / record · revizor / auditor · razdoblje
revizije / audit period · revizijski trag / audit trail · nalaz / finding · nalaz o oblikovanju / design
finding · nalaz o provedbi / operating finding · usklađenost na papiru / paper compliance · uporište
(mandat) / mandate · nemjerljiv standard / vague standard.

## Misconceptions targeted

- "We have the policy, so we are compliant": preset 3, the same documents with and without records.
- "We do it every month, so the auditor will be happy": presets 4 and 5, records outside the trail.
- "The last record is what counts": the auditor reads the whole period (presets 1 and 6).
- "Missing records can be written now": the explanation: a record made later for a past month is not evidence, so an
  operating finding takes months to close, a design finding days.

## Out of scope

Sampling (`cmp-audit-sampling` draws from this model), restore-test content (`cmp-restore-evidence`), log quality
(`cmp-log-evidence`), severity grading (major / minor nonconformity), exceptions and compensating controls, record
quality (a record that exists but proves nothing), scope (which systems a record covers).

## Sources

- ISO/IEC 27001:2022, by clause number only (the text is paid, never quoted): 5.2 information security policy, 7.5
  documented information, 9.2 internal audit, 10.2 nonconformity and corrective action; Annex A 5.1 policies for
  information security, 5.18 access rights, 5.37 documented operating procedures, 8.8 management of technical
  vulnerabilities, 8.13 information backup. *(check: numbers from the 2022 edition's clause list, not checked against
  a copy)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(a) policies on risk analysis and information system security, and
  art. 21(2)(f) policies and procedures to assess the effectiveness of cybersecurity risk-management measures
  (EUR-Lex). The Croatian law's matching article (Zakon o kibernetičkoj sigurnosti, NN 14/2024): open, not stated by
  the owner. ISO/IEC 27001 certification is voluntary and the law's measures cover similar ground (owner confirmed
  2026-11-08; one sentence in the explanation).
- Design vs operating effectiveness: the standard distinction in control audits (tests of design at a point in time
  vs tests of operating effectiveness over a period), e.g. ISA 330 (tests of controls' operating effectiveness).
  *(check: paragraph numbers not checked)*
- DR estate S9 (`dr-lecture-estate/student/scenarios/S9.md`) and `student/handbook/constraints.md`: an audit date and
  what failing it costs (the seed; no answer from the instructor material is used).
