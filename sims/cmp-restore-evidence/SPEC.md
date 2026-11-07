<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-restore-evidence: specification

Explorer (task `docs/tasks/w3/cmp-restore-evidence.md`, catalogue `cmp-restore-evidence` §4.13). One concept: a backup
policy is proven by restore tests, not by job reports; with a few test slots a quarter, the order decides which
systems are never tested; each test record (date, scope, time taken against the promised RTO, result, sign-off) is the
evidence, and a restore slower than the RTO is a finding even when it succeeds. This file fills the task's empty
"Model and presets" section.

Code: `sim.js` (every rule, pure and wordless), `trail.js` (the evidence-trail model, copied unchanged from
`cmp-policy-to-record`), the page `index.html`, words in `strings.js`. Tests: `sim.test.js`. Everything here is
illustrative: one made-up firm, twelve made-up systems, made-up RTOs and restore times; the page says so once, and that
it simplifies and is not legal advice.

**The contrast on the stage:** a column of backup job reports, green every day for every system, beside the restore
tests that are the only thing able to show two of those backups would not restore and two systems come back slower
than their RTO. The same number of tests in a different order leaves different systems untested.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`): `{ p, recs, years, perQ, m, shown }`:
the normalised params; the year's tests as records in date order; per system its year (status, quarter of a failure
found, the trail's finding); tests per quarter; the numbers and findings `m`; the index of the record the stage shows.
Every control (the panel's, and a click on a cell of the plan) sets params, and the state is recomputed.

## Fixed data (rule 1)

Twelve systems in inventory order (the asset list's order, the last tie-break everywhere). Tier 1 critical, 2
important, 3 other. RTO and restore time in hours (all made up; the RTOs stand for what `cmp-bia` derives).

| # | id | system (en) | tier | RTO | restore time | backup |
|---|---|---|---|---|---|---|
| 0 | `files` | File server | 2 | 24 | 10 | works |
| 1 | `mail` | E-mail | 2 | 24 | 16 | works |
| 2 | `wiki` | Intranet | 3 | 72 | 2 | works |
| 3 | `shop` | Web shop | 1 | 4 | 3 | works |
| 4 | `print` | Printing | 3 | 72 | 1 | works |
| 5 | `pay` | Payroll | 2 | 24 | **30** (slower than the RTO) | works |
| 6 | `wms` | Warehouse | 1 | 8 | 6 | works |
| 7 | `crm` | Customer data | 2 | 24 | 12 | **fails** |
| 8 | `dev` | Development | 3 | 72 | 8 | works |
| 9 | `erp` | ERP | 1 | 8 | **14** (slower than the RTO) | works |
| 10 | `idm` | Directory | 1 | 4 | 4 (equal to the RTO: in time) | **fails** |
| 11 | `arch` | Archive | 3 | 168 | 20 | works |

Four systems per tier; no two restore times are equal. The two failing backups and the two slow systems are placed so
that the inventory order reaches the critical ones last (ERP and the directory are 10th and 11th).

## Rules

1. **The systems** (table above). The year has four quarters and 365 days.
2. **The orders** (`before`). *Critical first*: tier ascending, then RTO ascending, then inventory order. *As listed*:
   inventory order. *Quickest first*: restore time ascending, then inventory order. *Own plan*: inventory order (the
   slot order inside a quarter). Every order ends on the inventory index, so it is total (tie-break).
3. **The plan.** `slots` (0…6) tests per quarter. An automatic order fills each quarter with the `slots` systems tested
   **least often so far this year**, ties by the order (tie-break): it rotates through the estate before testing
   anything twice, so with up to three slots no system is tested twice and with four to six the second round starts
   from the top of the order. *Own plan* is a 48-bit mask, one bit per system × quarter (`bit = system · 4 + quarter`);
   each quarter's set bits are taken in inventory order, and a quarter holding more than `slots` keeps the first
   `slots` (tie-break). A click on a cell (`toggle`) removes the test there, or adds one when the quarter has a free
   slot; either way the plan becomes *own*, starting from the tests on the stage. A click on a full quarter is refused
   (`full`), and with no slots at all (`noSlots`); the caption says so, nothing changes.
4. **Dates.** Slot *k* of quarter *q* runs on day 3 + 4*k* of the quarter's middle month (February, May, August,
   November): 3, 7, 11, 15, 19, 23.
5. **A test.** A failing backup fails its first test (the restore does not come back) and is repaired after it; any
   later test of it succeeds. Otherwise the restore succeeds and takes the system's restore time; **slower than the
   RTO** when time > RTO, **in time when equal** (tie-break; the directory, 4 h against 4 h). The record is *full*
   (date, scope "whole system, onto an isolated host", time against the RTO, result, the system owner's sign-off) or a
   *ticket* (date, system, done / failed; no scope, time or sign-off). The record never changes the truth.
6. **The year per system, through the evidence trail.** Each system is one requirement, "restored at least once a
   year", walked in `trail.js` (`walk` with policy, measurable standard and procedure present, frequency yearly, the
   tests' months as records, a 12-month period). No record is the trail's operating finding (`not-operating`): the
   system is *never tested*. Otherwise its status comes from its **last** test: *fail*, else on a full record *slow* or
   *ok*, on a ticket *done* (no time on it, so slow cannot show). The backup **job reports** are 12 × 365 = 4 380, all
   successful, whatever the truth (a job report says the copy ran, not that it restores).
7. **The numbers and the findings.** Tested = systems with a test; never = the rest, in critical-first order, and how
   many of them are tier 1; failures found = failed tests in date order, against the two failing backups; slow shown =
   systems a full record shows slower than the RTO, in date order, against the two really slow ones; failing and slow
   systems never tested. **The auditor's findings**, in this order, each listing its systems in critical-first order: *never tested*; *restore failed, no retest* (last test failed); *restored, but slower
   than the RTO* (last test slow, full records); *records without time or sign-off* (its systems: those whose last test is a successful ticket; its count: every
   ticket of a successful test). None
   of these: "no findings".
8. **The record shown** (one, as the auditor receives it): the first test that is really slower than the RTO (on a
   ticket too: it shows the time is missing), else the first failed one, else the last test; none without tests.
9. **Params** (a URL may carry anything): `slots` rounded and clamped to 0…6; `order` crit / list / easy / own (else
   list); `record` full / ticket (else full); `plan` rounded and clamped to 0…2⁴⁸ − 1 (hidden; set by the cells).
10. **Caption.** The main line: no test at all (*capNone*: the job reports' count against nothing proven); every system
    tested (*capAll*); otherwise tested, never, and none critical (*capSome*) or how many critical (*capSomeCrit*). Then
    at most **two** notes, the first that apply in this order: tickets without time (*nTicket*, only with tests); a
    failing backup nobody tested (*nHidden*, the first in critical-first order); the first failure found, with its
    quarter (*nFound*); the first restore a full record shows slower than the RTO (*nSlow*); a slow system nobody
    tested (*nSlowHidden*, full records only). A refused click replaces the caption until the params change.

## Presets

Defaults = preset 2. "Never" lists systems in critical-first order.

| # | id | params | plan (Q1 / Q2 / Q3 / Q4) | tested | never (critical) | failures found | slow shown | record shown | caption |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `jobs` | 0 slots | — | 0 / 12 | all 12 (4) | 0 of 2 | 0 of 2 | none | capNone, nHidden (directory), nSlowHidden (ERP) |
| 2 | `list` | 2 slots, as listed | files, mail / wiki, shop / print, pay / wms, crm | 8 | directory, ERP, dev, archive (2) | crm Q4 | payroll | payroll | capSomeCrit, nHidden (directory), nFound (crm) |
| 3 | `crit` | 2 slots, critical first | shop, idm / wms, erp / files, mail / pay, crm | 8 | wiki, print, dev, archive (0) | idm Q1, crm Q4 | ERP, payroll | ERP | capSome, nFound (directory), nSlow (ERP) |
| 4 | `easy` | 2 slots, quickest first | print, wiki / shop, idm / wms, dev / files, crm | 8 | ERP, mail, payroll, archive (1) | idm Q2, crm Q4 | none | directory (failed) | capSomeCrit, nFound, nSlowHidden (ERP) |
| 5 | `all` | 3 slots, critical first | shop, idm, wms / erp, files, mail / pay, crm, wiki / print, dev, arch | 12 | none | idm Q1, crm Q3 | ERP, payroll | ERP | capAll, nFound, nSlow |
| 6 | `ticket` | as 5, tickets | as 5 | 12 | none | idm Q1, crm Q3 | not measured (10 tickets without time) | ERP, fields missing | capAll, nTicket, nFound |

What each shows: 1, everything is green and nothing is proven; 2, eight tests in the asset list's order leave two
critical systems untested, one of them with a backup that would fail; 3, the same eight tests critical first find both
failures (the directory in February) and both slow restores, and leave only tier 3 untested, a gap that is chosen and
visible; 4, quickest first finds the failures and never touches the slow systems, so no test shows an RTO problem; 5,
three slots a quarter are the least that covers the estate in a year; 6, the same tests with records that only say
"done" prove no RTO.

## Expected numbers, checked

The table is checked by `sim.test.js` and by this independent Python re-implementation (sorting with Python's own
`sorted` on key tuples, not the model's comparator), which prints the same plans and counts:

```python
# Independent check of cmp-restore-evidence's preset numbers (SPEC.md). Python 3, no dependencies.
SYS = [  # id, tier, rto h, restore h, fails
    ('files', 2, 24, 10, False), ('mail', 2, 24, 16, False), ('wiki', 3, 72, 2, False), ('shop', 1, 4, 3, False),
    ('print', 3, 72, 1, False), ('pay', 2, 24, 30, False), ('wms', 1, 8, 6, False), ('crm', 2, 24, 12, True),
    ('dev', 3, 72, 8, False), ('erp', 1, 8, 14, False), ('idm', 1, 4, 4, True), ('arch', 3, 168, 20, False)]
MONTH = [2, 5, 8, 11]

def key(order, i):
    _, tier, rto, est, _ = SYS[i]
    return {'crit': (tier, rto, i), 'list': (i,), 'easy': (est, i)}[order]

def plan(order, slots, mask=0):
    out, n = [], [0] * 12
    for q in range(4):
        if order == 'own':
            pick = [i for i in range(12) if (mask >> (i * 4 + q)) & 1][:slots]
        else:
            pick = sorted(range(12), key=lambda i: (n[i],) + key(order, i))[:slots]
        for k, i in enumerate(pick):
            n[i] += 1
            out.append((q, k, i))
    return out

def run(order, slots, record, mask=0):
    repaired, tests = set(), []
    for q, k, i in plan(order, slots, mask):
        sid, tier, rto, t, fails = SYS[i]
        if fails and i not in repaired:
            res = 'fail'; repaired.add(i)
        else:
            res = 'slow' if t > rto else 'ok'
        tests.append(dict(q=q, slot=k, sys=sid, month=MONTH[q], day=3 + 4 * k, res=res, time=t, rto=rto))
    tested = {x['sys'] for x in tests}
    never = [s[0] for s in SYS if s[0] not in tested]
    neverCrit = [s[0] for s in SYS if s[0] in never and s[1] == 1]
    found = [(x['sys'], 'Q%d' % (x['q'] + 1)) for x in tests if x['res'] == 'fail']
    hidden = [s[0] for s in SYS if s[4] and s[0] in never]
    slow = sorted({x['sys'] for x in tests if x['res'] == 'slow'}) if record == 'full' else []
    slowAll = sorted({x['sys'] for x in tests if x['res'] == 'slow'})
    return dict(tests=len(tests), tested=len(tested), never=never, neverCrit=len(neverCrit), found=found,
                hidden=hidden, slow=slow, slowAll=slowAll,
                schedule=['Q%d:' % (q + 1) + ','.join(x['sys'] for x in tests if x['q'] == q) for q in range(4)])

presets = [('jobs', 'list', 0, 'full'), ('list', 'list', 2, 'full'), ('crit', 'crit', 2, 'full'),
           ('easy', 'easy', 2, 'full'), ('all', 'crit', 3, 'full'), ('ticket', 'crit', 3, 'ticket')]
for name, o, s, r in presets:
    print(name, run(o, s, r))
print('crit 6', run('crit', 6, 'full'))
```

Output (2026-11-07):

```
jobs {'tests': 0, 'tested': 0, 'never': ['files', 'mail', 'wiki', 'shop', 'print', 'pay', 'wms', 'crm', 'dev', 'erp', 'idm', 'arch'], 'neverCrit': 4, 'found': [], 'hidden': ['crm', 'idm'], 'slow': [], 'slowAll': [], 'schedule': ['Q1:', 'Q2:', 'Q3:', 'Q4:']}
list {'tests': 8, 'tested': 8, 'never': ['dev', 'erp', 'idm', 'arch'], 'neverCrit': 2, 'found': [('crm', 'Q4')], 'hidden': ['idm'], 'slow': ['pay'], 'slowAll': ['pay'], 'schedule': ['Q1:files,mail', 'Q2:wiki,shop', 'Q3:print,pay', 'Q4:wms,crm']}
crit {'tests': 8, 'tested': 8, 'never': ['wiki', 'print', 'dev', 'arch'], 'neverCrit': 0, 'found': [('idm', 'Q1'), ('crm', 'Q4')], 'hidden': [], 'slow': ['erp', 'pay'], 'slowAll': ['erp', 'pay'], 'schedule': ['Q1:shop,idm', 'Q2:wms,erp', 'Q3:files,mail', 'Q4:pay,crm']}
easy {'tests': 8, 'tested': 8, 'never': ['mail', 'pay', 'erp', 'arch'], 'neverCrit': 1, 'found': [('idm', 'Q2'), ('crm', 'Q4')], 'hidden': [], 'slow': [], 'slowAll': [], 'schedule': ['Q1:print,wiki', 'Q2:shop,idm', 'Q3:wms,dev', 'Q4:files,crm']}
all {'tests': 12, 'tested': 12, 'never': [], 'neverCrit': 0, 'found': [('idm', 'Q1'), ('crm', 'Q3')], 'hidden': [], 'slow': ['erp', 'pay'], 'slowAll': ['erp', 'pay'], 'schedule': ['Q1:shop,idm,wms', 'Q2:erp,files,mail', 'Q3:pay,crm,wiki', 'Q4:print,dev,arch']}
ticket {'tests': 12, 'tested': 12, 'never': [], 'neverCrit': 0, 'found': [('idm', 'Q1'), ('crm', 'Q3')], 'hidden': [], 'slow': [], 'slowAll': ['erp', 'pay'], 'schedule': ['Q1:shop,idm,wms', 'Q2:erp,files,mail', 'Q3:pay,crm,wiki', 'Q4:print,dev,arch']}
crit 6 {'tests': 24, 'tested': 12, 'never': [], 'neverCrit': 0, 'found': [('idm', 'Q1'), ('crm', 'Q2')], 'hidden': [], 'slow': ['erp', 'pay'], 'slowAll': ['erp', 'pay'], 'schedule': ['Q1:shop,idm,wms,erp,files,mail', 'Q2:pay,crm,wiki,print,dev,arch', 'Q3:shop,idm,wms,erp,files,mail', 'Q4:pay,crm,wiki,print,dev,arch']}
```

## Legend, words, out of scope

- Plan cells: in time, solid green outline with ✓ and the hours; slower than the RTO, dashed amber with ⏱ and the
  hours; failed, thick red with ✗; a ticket, dashed with ✓ ?; an empty slot, dotted. The year column: never tested is
  hatched with the hidden truth in italics ("really: ✗", "really: 14 h"); the other statuses carry their symbol and a
  word. Tier: a number in a circle, filled (1), solid (2), dotted (3). Every state has a symbol or pattern as well as
  a colour (grayscale checked).
- Tiles: the job reports outlined green with a tick (the report looks good); tested, failures found and slow shown
  dashed red while something stays unknown.
- Terms (both languages) and choices: `NOTES.md`.
- Misconceptions targeted: "the backup jobs are green, so we can restore"; "we test some systems, so we test"; "test
  what is quick so the quarterly box is ticked"; "the restore worked, so the test passed"; "a ticket saying done is a
  record".
- Out of scope: why a backup fails (`restore-drill`, the restore that lies), how RPO and RTO are set (`rpo-rto`,
  `cmp-bia`), partial or file-level restore tests (every test here restores the whole system), retesting after a
  repair as an automatic rule (a retest is a slot the student plans), a stricter standard such as "critical systems
  every quarter" (`cmp-policy-to-record` uses that one; here the requirement is once a year per system), sampling the
  records (`cmp-audit-sampling`).

## Sources

- ISO/IEC 27001:2022 by number only, never quoted: Annex A 8.13 (information backup), clause 7.5 (documented
  information). *(check: numbers from the 2022 edition's clause list, not checked against a copy)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(c): business continuity, such as backup management and disaster recovery
  (EUR-Lex). *(check: paraphrased from memory, not checked against the text)*
- GDPR, Regulation (EU) 2016/679, art. 32(1)(c) (restoring availability and access in a timely manner) and (d)
  (regularly testing, assessing and evaluating the measures) (EUR-Lex; Croatian: Opća uredba o zaštiti podataka).
  *(check: paraphrased from memory; the Croatian wording was not checked)*
- The failure itself and the RTOs: `restore-drill`, `rpo-rto`, `cmp-bia` (catalogue §5.24). All numbers illustrative.
