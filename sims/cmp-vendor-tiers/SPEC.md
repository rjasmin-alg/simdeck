<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-vendor-tiers: specification

Task `docs/tasks/w3/cmp-vendor-tiers.md`, catalogue `cmp-vendor-tiers` (§4.13). Explorer: the page is a pure function
of its params (`compute` in `sim.js`). This file fills the task's empty "Model and presets" section.

## Concept

Suppliers are tiered by what they reach (personal data, production access, a critical service) and how hard they are
to replace; the tier sets the depth of checking (a short questionnaire, certification evidence, contract clauses with
audit rights). Assessment hours are limited, so one questionnaire for everyone spreads them thin, while the risk sits
in a few suppliers. A supplier's subcontractor and many services on one provider (concentration) are risks too.
NIS2 art. 21(2)(d) lists supply chain security among the required measures.

**Contrast on the stage:** the same thirty suppliers and the same hours, checked two ways side by side: *one
questionnaire for all* against *tiered checking*: hours, risk covered (% of all) and risk covered per hour.

## State (plain JSON)

`{ p, rows[], base, total, extra, tier1, tiered, same }`: the normalised params; one row per supplier in the
tiered priority order (rule 5) `{ id, pd, acc, crit, hard, spend, shared, i, l, risk, tier, reach, bySpend,
tiered: { depth, covered }, same: { depth, covered } }`; the suppliers' risk, the total (with what is behind them when
revealed); `extra = null | { sub: { parent, risk, tiered, same }, shared: { ids, risk, tiered, same } }`; tier 1's risk
and share of `total`; per strategy `{ hours, covered, pct, perHour, unchecked[], uncheckedPct }`.

## Rules (in order; numbers as in `sim.js`)

1. **Risk.** Thirty suppliers in register order (the table below). Impact level I = min(5, 1 + 2·data + 2·access +
   critical + (critical ∧ hard to replace)). Risk = the risk register's expected yearly loss at (likelihood level,
   I): `scoring.loss(l, I)` = impact anchor × frequency anchor (anchors €2k, 10k, 40k, 150k, 600k; 0.05, 0.2, 0.5, 1,
   3 a year), copied unchanged in `scoring.js` from `cmp-risk-register`. Total €593 600 a year.
2. **Tier by reach:** 1 = production access, or a critical service that is hard to replace; 2 = personal data, or a
   critical service that is easy to replace; 3 = the rest. Sizes 9 / 13 / 8.
3. **Tier by spend:** the same sizes, filled from the largest yearly spend down; **tie: register order** (office,
   payroll and offsite backup all spend 10 k€ at places 21–23, so the 2/3 boundary falls inside the tie: backup goes
   to tier 3).
4. **Depth by tier:** 1 → contract clauses with audit rights, 10 h, covers 80 % of the supplier's risk; 2 →
   certification evidence, 4 h, 50 %; 3 → a short questionnaire, 2 h, 20 %. All made up.
5. **Tiered checking** walks the priority order: by reach, tier ascending, then impact descending, then **register
   order**; by spend, the spend order of rule 3. A supplier gets its tier's depth when its hours ≤ the hours left
   (**equal fits**); otherwise it stays unchecked and **the walk goes on** (a cheaper check further down may fit).
6. **One questionnaire for all:** register order, a questionnaire (2 h) each while the hours left ≥ 2; never more
   than 60 h.
7. **Coverage.** Covered = risk × share / 100, **halves up** (`hup`). Per strategy: covered = the sum (plus the
   subcontractor's, rule 8); pct = covered × 100 / total, halves up; per hour = covered / hours, halves up, 0 with no
   hours; unchecked = rows without a depth, in priority order, and their share of the total, halves up. Tier 1's
   share is of the total too (67 %, 55 % with what is behind revealed).
8. **Behind the suppliers** (`reveal`). The subcontractor of the IT support contractor (`msp`): a night-shift
   administrator, likelihood 1, impact 5, risk €30 000; the parent's contract with audit rights (its subcontractor
   clauses) covers 50 % of it, any other depth or none 0. The shared provider: five suppliers run on it (host, news,
   mail, backup, wms, in register order); a joint outage = `ale(Σ their impact anchors, provider frequency 0.05)` = 0.05 × (3 × 600 000 +
   2 × 40 000) = €94 000 a year; no strategy covers it. Both join the total.
9. **Params.** `view` same | tiered (which strategy the tiles show); `rule` reach | spend; `budget` 10–160 h in steps
   of 10 (rounded to the step, halves up, then clamped; anything `Number()` cannot read, such as "90x", → 60; "-50" →
   10); `reveal` true or the string "true" (case matters), else false.
10. **Caption.** Main line by the view (the strategy shown, then the other at the same hours). Then at most two notes,
    the first that apply in this order: reveal → nSubOn (the shown strategy covers part of the subcontractor) or
    nSubOff, then nShared; rule spend and view tiered → nSpend (the riskiest supplier spend puts in a lower tier than
    reach, ties register order; and the one spend lifts most tiers, then the highest spend, ties register order; the
    note names their tiers and the tiers' depths, not what the hours reached);
    suppliers unchecked in the shown view → nOut; always → nTopSame or nTopTiered (tier 1's share of the risk).

## The register (made up)

| id | supplier | data | access | critical | hard | spend k€ | L | I | risk € | reach tier | spend tier |
|---|---|---|---|---|---|---|---|---|---|---|---|
| erp | ERP maintenance | ● | ● | ● | ● | 60 | 2 | 5 | 120 000 | 1 | 1 |
| clean | cleaning | | | | | 28 | 2 | 1 | 400 | 3 | 1 |
| courier | parcel delivery | ● | | ● | | 120 | 3 | 4 | 75 000 | 2 | 1 |
| msp | IT support contractor | ● | ● | | | 18 | 2 | 5 | 120 000 | 1 | 2 |
| office | office supplies | | | | | 10 | 1 | 1 | 100 | 3 | 2 |
| host | web shop hosting (shared) | ● | ● | ● | ● | 40 | 1 | 5 | 30 000 | 1 | 1 |
| acct | bookkeeping firm | ● | | | | 22 | 2 | 3 | 8 000 | 2 | 2 |
| goods | goods wholesaler | | | ● | ● | 400 | 2 | 3 | 8 000 | 1 | 1 |
| news | newsletter sending (shared) | ● | | | | 4 | 3 | 3 | 20 000 | 2 | 3 |
| isp | internet connection | | | ● | | 14 | 4 | 2 | 10 000 | 2 | 2 |
| telco | mobile phones | | | | | 18 | 3 | 1 | 1 000 | 3 | 2 |
| pay | payroll service | ● | | ● | | 10 | 2 | 4 | 30 000 | 2 | 2 |
| mail | cloud e-mail (shared) | ● | | ● | ● | 12 | 1 | 5 | 30 000 | 1 | 2 |
| alarm | alarm and guards | | | | | 16 | 2 | 1 | 400 | 3 | 2 |
| web | web agency | | ● | | | 20 | 3 | 3 | 20 000 | 1 | 2 |
| callc | call centre | ● | | | | 45 | 3 | 3 | 20 000 | 2 | 1 |
| pack | packaging | | | ● | | 90 | 2 | 2 | 2 000 | 2 | 1 |
| recruit | job portal | ● | | | | 6 | 2 | 3 | 8 000 | 2 | 3 |
| backup | offsite backup (shared) | ● | ● | | | 10 | 1 | 5 | 30 000 | 1 | 3 |
| insur | insurance | | | | | 25 | 1 | 1 | 100 | 3 | 2 |
| pspay | card payments | ● | | ● | ● | 30 | 1 | 5 | 30 000 | 1 | 1 |
| legal | law firm | ● | | | | 15 | 1 | 3 | 2 000 | 2 | 2 |
| print | printer rental | | | | | 8 | 3 | 1 | 1 000 | 3 | 3 |
| wms | warehouse system (shared) | | | ● | ● | 24 | 2 | 3 | 8 000 | 1 | 2 |
| audit | external auditor | ● | | | | 12 | 1 | 3 | 2 000 | 2 | 2 |
| hw | computer supplier | | | | | 35 | 3 | 1 | 1 000 | 3 | 1 |
| train | online training | ● | | | | 5 | 2 | 3 | 8 000 | 2 | 3 |
| travel | travel agency | ● | | | | 8 | 2 | 3 | 8 000 | 2 | 3 |
| coffee | coffee machines | | | | | 3 | 1 | 1 | 100 | 3 | 3 |
| domain | domain registrar | | | ● | | 1 | 1 | 2 | 500 | 2 | 3 |

By reach: tier 1 €396 000 (67 %), tier 2 €193 500, tier 3 €4 100. By spend: tier 1 €286 400 (48 %).

## Defaults and presets

Defaults = preset 1 (view same, rule reach, 60 h, reveal off).

| # | id | change | tiered: h / covered / % / €/h | one questionnaire: h / covered / % / €/h | notes |
|---|---|---|---|---|---|
| 1 | `same` | — | 60 / 288 000 / 49 / 4 800 | 60 / 118 720 / 20 / 1 979 | nTopSame |
| 2 | `tiered` | view tiered | 60 / 288 000 / 49 / 4 800 (24 unchecked, 39 % of the risk) | same as 1 | nOut, nTopTiered |
| 3 | `enough` | tiered, 160 h | 158 / 414 370 / 70 / 2 623 | 60 / 118 720 / 20 / 1 979 | nTopTiered |
| 4 | `spend` | tiered, 160 h, rule spend | 158 / 360 040 / 61 / 2 279 | 60 / 118 720 / 20 / 1 979 | nSpend (IT support contractor gets certification evidence; computer supplier the audit), nTopTiered |
| 5 | `reveal` | tiered, 160 h, reveal | 158 / 429 370 / 60 / 2 718 (subcontractor 15 000 of 30 000) | 60 / 118 720 / 17 / 1 979 | nSubOn, nShared |

At equal hours (60) tiered checking covers 2.4× the risk of one questionnaire for all; with every tier checked
(158 h) it still covers more per hour (€2 623 against €1 979), because most of the risk sits in tier 1. Per hour
falls overall as the budget grows (€4 800 at 60 h, €2 623 at 158 h), not at every step: the skip-and-go-on walk lets
two tier-2 checks in at 100 h (€3 520 at 90 h, €3 694 at 100 h). One questionnaire for all is capped at 60 h; even
certification evidence for all (120 h) would cover 50 %, still below tiered checking at the same hours (67 %). The
priority uses impact, not risk, so tier 1 includes €8k suppliers before tier 2's €75k courier: tiering by reach is a
rule a firm can apply before it knows the numbers, not an optimum.

## Legend and words

Flags: ● personal data, ■ production access, ★ critical service, ▲ hard to replace (each also coloured and named in
the tile's label). Badge: the check (R/A filled: contract with audit rights; C thick outline: certification; U/Q:
questionnaire; – dashed: not checked; the tier headers show each tier's badge, the legend "not checked"). Bar: length = the supplier's risk on one scale for the page, solid = covered,
hatched = not covered. ⧉ on the shared provider; ↳ has a subcontractor.

## Misconceptions targeted

- "Treat every supplier the same way, it is fair": one questionnaire for all covers 20 % of the risk.
- "The biggest contracts are the riskiest": by spend the cleaning firm and the computer supplier get audits, while
  the IT support contractor with administrator access gets less (preset 4).
- "A certificate covers the supplier's whole chain": the subcontractor is reached only by the contract's
  subcontractor clauses (preset 5, and preset 5 by spend).
- "Each supplier checked = the supply chain checked": the shared provider's joint outage is in no single check.

## Out of scope

Which controls a provider runs for the customer in the cloud (`cmp-shared-responsibility`); scoring a supplier's
answers; contract negotiation; exit plans and moving providers; continuous monitoring after onboarding; DORA's
register of information (named in the explanation's sources only).

## Sources

- NIS2, Directive (EU) 2022/2555, art. 21(2)(d) (supply chain security, including security aspects of the
  relationships with direct suppliers or service providers) and art. 21(3) (take into account each direct supplier's
  vulnerabilities, the overall quality of its products and its secure development practices), EUR-Lex. *(check the
  official Croatian wording: "sigurnost lanca opskrbe")*
- GDPR, Regulation (EU) 2016/679, art. 28(1) (processors providing sufficient guarantees), 28(2) and 28(4) (another
  processor only with authorisation, same obligations flowed down), 28(3)(h) (audits, including inspections), EUR-Lex.
- ISO/IEC 27001:2022, Annex A controls 5.19–5.22 (supplier relationships, agreements, the ICT supply chain,
  monitoring and change of supplier services), by number only. *(check against a copy)*
- DORA, Regulation (EU) 2022/2554, art. 28 (ICT third-party risk, register of information), 29 (concentration risk)
  and 30 (key contractual provisions, including access, inspection and audit rights). *(check the paragraphs)*
- `cmp-risk-register` SPEC rules 1–2 (the anchors and the expected loss).

## Check

`tiers.py` below re-implements rules 1–8 and 10's note choice from this file alone. A node script fed it the five
presets and every combination of view × rule × budget (10–160) × reveal (128 cases) plus 2 000 random param sets
(including off-step budgets) and compared hours, covered, pct, per hour, unchecked, the tiers, every depth, the extras,
the misfits and the notes with `compute`: **2 133 cases, 0 mismatches** (2026-11-07). The preset table is its output.

```python
# cmp-vendor-tiers, re-implemented from SPEC.md alone (not from sim.js).
import json, sys
F = [5, 20, 50, 100, 300]; E = [2000, 10000, 40000, 150000, 600000]
def hup(n, d): return (2 * n + d) // (2 * d)
def loss(l, i): return hup(E[i - 1] * F[l - 1], 100)
REG = [('erp',1,1,1,1,60,2,0),('clean',0,0,0,0,28,2,0),('courier',1,0,1,0,120,3,0),('msp',1,1,0,0,18,2,0),
 ('office',0,0,0,0,10,1,0),('host',1,1,1,1,40,1,1),('acct',1,0,0,0,22,2,0),('goods',0,0,1,1,400,2,0),
 ('news',1,0,0,0,4,3,1),('isp',0,0,1,0,14,4,0),('telco',0,0,0,0,18,3,0),('pay',1,0,1,0,10,2,0),
 ('mail',1,0,1,1,12,1,1),('alarm',0,0,0,0,16,2,0),('web',0,1,0,0,20,3,0),('callc',1,0,0,0,45,3,0),
 ('pack',0,0,1,0,90,2,0),('recruit',1,0,0,0,6,2,0),('backup',1,1,0,0,10,1,1),('insur',0,0,0,0,25,1,0),
 ('pspay',1,0,1,1,30,1,0),('legal',1,0,0,0,15,1,0),('print',0,0,0,0,8,3,0),('wms',0,0,1,1,24,2,1),
 ('audit',1,0,0,0,12,1,0),('hw',0,0,0,0,35,3,0),('train',1,0,0,0,5,2,0),('travel',1,0,0,0,8,2,0),
 ('coffee',0,0,0,0,3,1,0),('domain',0,0,1,0,1,1,0)]
H = {'audit': 10, 'cert': 4, 'quest': 2}; C = {'audit': 80, 'cert': 50, 'quest': 20}; D = {1: 'audit', 2: 'cert', 3: 'quest'}

def run(p):
    rows = []
    for k, (i, pd, acc, crit, hard, sp, l, sh) in enumerate(REG):
        I = min(5, 1 + 2*pd + 2*acc + crit + (1 if crit and hard else 0))
        reach = 1 if acc or (crit and hard) else 2 if pd or crit else 3
        rows.append(dict(id=i, I=I, risk=loss(l, I), reach=reach, sp=sp, k=k, sh=sh))
    n1 = sum(r['reach'] == 1 for r in rows); n2 = sum(r['reach'] == 2 for r in rows)
    sorder = sorted(rows, key=lambda r: (-r['sp'], r['k']))
    for j, r in enumerate(sorder): r['bySpend'] = 1 if j < n1 else 2 if j < n1 + n2 else 3
    for r in rows: r['tier'] = r['bySpend'] if p['rule'] == 'spend' else r['reach']
    order = sorder if p['rule'] == 'spend' else sorted(rows, key=lambda r: (r['tier'], -r['I'], r['k']))
    def alloc(seq, want):
        left = p['budget']; dep = {}
        for r in seq:
            d = want(r)
            if H[d] <= left: dep[r['id']] = d; left -= H[d]
            else: dep[r['id']] = None
        return dep, p['budget'] - left
    dT, hT = alloc(order, lambda r: D[r['tier']])
    dS, hS = alloc(rows, lambda r: 'quest')
    cov = lambda r, d: hup(r['risk'] * C[d], 100) if d else 0
    base = sum(r['risk'] for r in rows); total = base; xT = xS = 0; extra = None
    if p['reveal']:
        sub = loss(1, 5); joint = hup(sum(E[r['I'] - 1] for r in rows if r['sh']) * F[0], 100)
        sc = lambda d: hup(sub * 50, 100) if d == 'audit' else 0
        xT, xS = sc(dT['msp']), sc(dS['msp']); total += sub + joint
        extra = dict(sub=sub, subT=xT, subS=xS, joint=joint, ids=[r['id'] for r in rows if r['sh']])
    def tot(dep, hours, x):
        c = sum(cov(r, dep[r['id']]) for r in rows) + x
        un = [r for r in order if not dep[r['id']]]
        return dict(hours=hours, covered=c, pct=hup(c * 100, total), perHour=hup(c, hours) if hours else 0,
                    unchecked=[r['id'] for r in un], uncheckedPct=hup(sum(r['risk'] for r in un) * 100, total))
    T, S = tot(dT, hT, xT), tot(dS, hS, xS)
    down = up = None
    for r in rows:
        if r['bySpend'] > r['reach'] and (down is None or r['risk'] > down['risk']): down = r
        j = r['reach'] - r['bySpend']
        if j > 0 and (up is None or j > up['reach'] - up['bySpend'] or (j == up['reach'] - up['bySpend'] and r['sp'] > up['sp'])): up = r
    v = T if p['view'] == 'tiered' else S
    notes = []
    if extra: notes += ['nSubOn' if (xT if p['view'] == 'tiered' else xS) > 0 else 'nSubOff', 'nShared']
    if p['rule'] == 'spend' and p['view'] == 'tiered': notes.append('nSpend')
    if v['unchecked']: notes.append('nOut')
    notes.append('nTopSame' if p['view'] == 'same' else 'nTopTiered')
    return dict(order=[r['id'] for r in order], tiers={r['id']: r['tier'] for r in rows}, dT=dT, dS=dS, T=T, S=S,
                total=total, extra=extra, down=down['id'], up=up['id'], notes=notes[:2])

if __name__ == '__main__':
    for line in sys.stdin:
        print(json.dumps(run(json.loads(line))))
```
