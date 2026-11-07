<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-risk-register: specification

Task `docs/tasks/w3/cmp-risk-register.md`, catalogue `cmp-risk-register` (§4.13; hub of the risk-scoring model,
§5.24; the money view is `fin-ale-risk`'s expected loss, §4.12). Class **explorer**: the state is a pure function of
the params (`sim.js` `compute`); the scoring, the treatments, the appetite test and the rankings are `scoring.js`
(pure, wordless, promotable to `models/scoring.js`).

**One concept:** a risk is scored likelihood × impact on a 5 × 5 matrix; a treatment (reduce, transfer, avoid,
accept) moves it from inherent to residual risk at a cost; the risk appetite line decides what must be treated and
who signs an acceptance; multiplying ordinal scores misleads (5 × 1 and 1 × 5 tie, 3 × 3 outranks both), which a view
in money exposes; ISO/IEC 27001 asks for this loop (assess, treat, accept the residual, review).

**The contrast on the stage:** the same register ranked by score and ranked by money. The matrix and the line are the
same picture in both views; switching the view re-ranks the list (rows whose rank or signer changes are highlighted),
moves the appetite line to a different staircase and changes who signs.

## Stage

- **Matrix** (left): 5 × 5, likelihood 1–5 upwards, impact 1–5 to the right. Each cell shows its value in the current
  view (score L × I, or the expected loss per year in money, compact: "€30k" / "30 tis. €"). Cells above the appetite
  are hatched; a thick line runs along the staircase between within and above. The axes name each level and its anchor
  (likelihood: how often; impact: € per event).
- **Markers:** every risk is a numbered disc (1–12, register order). Its inherent position is a hollow dashed ring,
  its residual position a filled disc, and an arrow runs from one to the other. Accepted (or a treatment without
  effect): one filled disc with a solid ring, no arrow. Avoided: the hollow ring with a ✕ and no residual. The selected
  risk's markers and arrow are outlined in the focus colour; the other arrows are thin.
- **Clicking a cell** places the selected risk's inherent position there (sets its L and I). Clicking a marker selects
  that risk. Both are buttons with labels (keyboard).
- **Register** (right): the twelve risks in rank order of the current view (inherent value, rule 6), one row each:
  rank (shared on a tie, with "=" before it), the disc, the name, the treatment, inherent → residual value, and who
  signs the residual (rule 5). Beside the rank, how the rank moves against the other view (▲3, ▼2). A row is a button
  that selects the risk.
- **Selected risk** (under the register): its four treatment buttons (full words), what the treatment is and costs,
  inherent → residual in both units, the verdict in money (worth it / break-even / not worth it, as `fin-ale-risk`)
  and who signs.
- **Totals** (under it): above the appetite inherent → residual; treatments cost per year; in money also the expected
  loss inherent → residual and the expected yearly cost (residual + treatments).
- **Foot:** once, that the page simplifies, is not legal advice, and uses a made-up firm, risks and numbers.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `view` | choice | `score`, `money` (`score`) | the unit for ranking, the appetite and the cells |
| `appS` | range 1–24 | (8) | score appetite: a residual score above it is outside (shown in the score view) |
| `appM` | choice | 5 000, 10 000, 25 000, 50 000, 100 000 € a year (25 000) | money appetite (shown in the money view) |
| `risk` | select (also the stage's rows and markers) | the 12 ids (`phish`) | the selected risk |
| `<id>L`, `<id>I` | choice 1–5, only for the selected risk (also a click on a cell) | per risk, table below | inherent likelihood and impact |
| `<id>T` | choice, only for the selected risk (also the stage's buttons) | `accept`, `reduce`, `transfer`, `avoid` (`accept`) | the treatment |

## Rules

### Scoring (`scoring.js`, promotable)

1. **Score** = L × I, both integers 1–5 (1–25). **Scales** (illustrative anchors): likelihood 1–5 = 0.05, 0.2, 0.5, 1,
   3 events a year (once in 20 years, once in 5, once in 2, once a year, three times a year), held in hundredths
   (5, 20, 50, 100, 300); impact 1–5 = €2 000, €10 000, €40 000, €150 000, €600 000 per event.
2. **Expected loss** (the money view) = impact anchor × likelihood anchor, whole euros, halves up:
   `ale(sle, f100) = hup(sle × f100, 100)`, copied from `sims/fin-ale-risk/risk.js` @ ad5f4b8 (`fin-ale-risk` rule 2,
   ALE = SLE × ARO). Every cell is a whole number here:

   | L \ I | 1 | 2 | 3 | 4 | 5 |
   |---|---|---|---|---|---|
   | 5 | 6 000 | 30 000 | 120 000 | 450 000 | 1 800 000 |
   | 4 | 2 000 | 10 000 | 40 000 | 150 000 | 600 000 |
   | 3 | 1 000 | 5 000 | 20 000 | 75 000 | 300 000 |
   | 2 | 400 | 2 000 | 8 000 | 30 000 | 120 000 |
   | 1 | 100 | 500 | 2 000 | 7 500 | 30 000 |

   **The ordinal trap:** 5 × 1 and 1 × 5 both score 5, but cost €6 000 and €30 000 a year; 3 × 3 scores 9 and outranks
   both, but costs €20 000, less than 1 × 5.
3. **Treatments** (residual L′, I′ and the yearly cost):
   - *accept*: L′ = L, I′ = I, cost 0.
   - *reduce*: a control per risk that lowers likelihood by dL or impact by dI levels, never below 1:
     L′ = max(1, L − dL), I′ = max(1, I − dI); cost = the control's fixed yearly cost (paid even when the floor leaves
     nothing to lower: `noEffect`).
   - *transfer* (insurance or a contract): the firm keeps the deductible, impact level 2 (€10 000) per event:
     I′ = min(I, 2), L′ = L; premium = hup(f100(L) × (eur(I) − eur(I′)) × 150, 10 000), the expected payout plus a 50 %
     load (`fin-ale-risk` rule 4). I ≤ 2: nothing to transfer, premium 0, `noEffect`.
   - *avoid*: stop the activity; no residual (score 0, expected loss 0); cost = the yearly benefit given up.
   Then removed = inherent loss − residual loss, net = removed − cost, verdict (not for accept): `worth` when net > 0,
   `even` when net = 0, `not` when net < 0 (`fin-ale-risk` rule 1a).
4. **Appetite.** A value is **above** the appetite when it is strictly greater (equal is within). The score view
   compares scores with `appS`; the money view compares expected losses with `appM`.
5. **Who signs** the residual, per view: *avoided* when the treatment is avoid; *board* (the management board signs
   the acceptance, or the risk needs more treatment) when the residual is above the appetite; otherwise *owner* (the
   risk owner signs). A risk **needs treatment** when its inherent value is above the appetite.
6. **Ranking** by the inherent value of the view, descending; **tie-break:** equal values share the rank (competition
   ranking 1, 1, 3); rows with the same rank keep register order. The default register by score: phish 1, patch 1,
   ransom 3, saas 4, change 5, share 5, leaver 7, invoice 7, laptop 9, fire 9, flood 11, power 11; by money: ransom 1,
   patch 2, phish 3, fire 4, share 4, saas 6, change 7, invoice 8, laptop 9, leaver 10, flood 11, power 11.

### The sim (`sim.js`)

7. **The register** (illustrative; a made-up firm of about 60 people):

   | # | id | inherent L × I | score / € a year | reduce: control, effect, € a year | avoid: benefit given up, € a year |
   |---|---|---|---|---|---|
   | 1 | `phish` stolen password | 4 × 3 | 12 / 40 000 | second sign-in factor, −2 L, 6 000 | no outside email, 300 000 |
   | 2 | `ransom` ransomware | 2 × 5 | 10 / 120 000 | offline copy and restore tests, −2 I, 15 000 | no networked file servers, 400 000 |
   | 3 | `laptop` lost laptop | 5 × 1 | 5 / 6 000 | device check-out and locks, −1 L, 3 000 | desktops only, 40 000 |
   | 4 | `fire` fire or flood in the server room | 1 × 5 | 5 / 30 000 | fire suppression and an off-site copy, −2 I, 12 000 | no servers on site, 35 000 |
   | 5 | `saas` hosted service outage | 3 × 3 | 9 / 20 000 | exit plan and a second provider, −1 I, 18 000 | stop using the service, 30 000 |
   | 6 | `patch` unpatched internet-facing server | 3 × 4 | 12 / 75 000 | patch deadlines and weekly scans, −2 L, 12 000 | take it off the internet, 60 000 |
   | 7 | `leaver` account left active after leaving | 3 × 2 | 6 / 5 000 | leaver checklist with account review, −2 L, 2 000 | no accounts for temporary staff, 15 000 |
   | 8 | `change` failed change stops the business system | 4 × 2 | 8 / 10 000 | change review and a rollback plan, −1 L, 4 000 | freeze changes, 25 000 |
   | 9 | `flood` traffic flood on the web shop | 2 × 2 | 4 / 2 000 | traffic filtering, −1 L, 5 000 | no web shop, 80 000 |
   | 10 | `share` personal data on an open file share | 2 × 4 | 8 / 30 000 | quarterly access review, −1 L, 5 000 | no personal data on shares, 20 000 |
   | 11 | `invoice` fake invoice, changed bank details | 2 × 3 | 6 / 8 000 | call back before paying new details, −1 L, 1 000 | pay known suppliers only, 30 000 |
   | 12 | `power` power cut in the office | 4 × 1 | 4 / 2 000 | uninterruptible power for the network, −2 L, 2 500 | close the office, 50 000 |

   Total inherent expected loss 348 000 € a year.
8. **Params (normalise):** unknown `view`, `risk`, `<id>T` (also prototype keys) → default; `appS`, `<id>L`, `<id>I`:
   numeric strings are read as numbers, non-numbers → default, rounded and clamped (1–24, 1–5); `appM` outside its list →
   default; unknown keys are dropped.
9. **Changed marks** (`flipped`): between two states, the ids whose current rank or current signer changed are
   highlighted on their rows; switching the view lights the rows that move.
10. **Caption** (main sentence, then at most two notes in this order):
    - score view: `capScoreBoard` when some residual is above (how many, the appetite, the board signs), else
      `capScoreOk` (all within; owners sign; the treatments' cost). Points agree with the number in Croatian (1 bod,
      2–4 boda, 5 and more bodova; "više od 1 boda"). Note `nTie`: the pair of risks with equal inherent
      scores whose expected losses differ the most (ratio of the larger to the smaller, ≥ 2; on equal ratios the first
      pair in register order): "they tie, but one costs €a and the other €b a year". Default: laptop and fire (5;
      €6 000 and €30 000).
    - money view: `capMoneyBoard` (how many above, the appetite, the top risk by money before treatment and its inherent loss) or `capMoneyOk`
      (all within; expected loss inherent → residual; the treatments' cost). Notes: `nUp` (residual above in money but
      within by score: "by score these looked fine"), `nDown` (above by score, within in money), `nNotWorth` (reduce or
      transfer with net < 0).
    - Any view, after the main sentence when it applies: `nNoEffect` (a treatment that changes nothing: the floor, or
      nothing above the deductible) takes the first note slot.

## Presets and expected outcomes

Checked by the tests and by the independent Python script below. Totals in € a year.

| # | id | view, treatments (others accept) | need (inherent above) | board (residual above) | treatments | expected loss in → res | notes |
|---|---|---|---|---|---|---|---|
| 1 | `register` (= defaults) | score, none | phish, ransom, saas, patch | the same 4 | 0 | 348 000 → 348 000 | `nTie` laptop / fire |
| 2 | `treated` | score; reduce phish, ransom, saas, patch | the same 4 | none | 51 000 | 348 000 → 121 500 | `nTie` |
| 3 | `money` | money; the same four reduced | phish, ransom, fire, patch, share | fire, share | 51 000 | 348 000 → 121 500 | `nUp` fire, share; `nNotWorth` saas (−3 000) |
| 4 | `by-money` | money; reduce phish, ransom, fire, patch, share | the same 5 | none | 50 000 | 348 000 → 86 000 | `nDown` saas |
| 5 | `insure` | money; reduce phish, patch, share; transfer ransom, fire | the same 5 | none | 244 250 | 348 000 → 78 500 | `nDown` saas; `nNotWorth` ransom (−59 000), fire (−14 750) |

Per treated risk (score in → res, € in → res, cost, net): phish 12 → 6, 40 000 → 8 000, 6 000, +26 000; ransom
(reduce) 10 → 6, 120 000 → 8 000, 15 000, +97 000; saas 9 → 6, 20 000 → 5 000, 18 000, −3 000; patch 12 → 4,
75 000 → 7 500, 12 000, +55 500; fire (reduce) 5 → 3, 30 000 → 2 000, 12 000, +16 000; share 8 → 4, 30 000 → 7 500,
5 000, +17 500; ransom (transfer) 10 → 4, 120 000 → 2 000, premium 177 000, −59 000; fire (transfer) 5 → 2,
30 000 → 500, premium 44 250, −14 750.

Contrasts the presets carry: 1 four risks above the line by score; 2 treating exactly those brings everything within
appetite by score, for 51 000 €; 3 the same choices in money: two risks the score called fine are above the money
appetite, and one treatment the score demanded costs more than it removes; 4 choosing in money: 1 000 € a year less spent,
nobody above the line, and 35 500 € a year less expected loss than preset 3; 5 insurance also brings the two big
risks under the line, but costs far more than it removes on average (it buys a capped worst event, which the expected
loss does not show; `fin-ale-risk` has the simulated years).

Independent check (run 2026-11-07, `python3`; prints the rows above):

```python
F100 = [5, 20, 50, 100, 300]; EUR = [2000, 10000, 40000, 150000, 600000]; TL, LOAD = 2, 150
def hup(n, d): return (2 * n + d) // (2 * d)
def el(l, i): return hup(EUR[i - 1] * F100[l - 1], 100)
R = [('phish',4,3,2,0,6000,300000),('ransom',2,5,0,2,15000,400000),('laptop',5,1,1,0,3000,40000),('fire',1,5,0,2,12000,35000),
     ('saas',3,3,0,1,18000,30000),('patch',3,4,2,0,12000,60000),('leaver',3,2,2,0,2000,15000),('change',4,2,1,0,4000,25000),
     ('flood',2,2,1,0,5000,80000),('share',2,4,1,0,5000,20000),('invoice',2,3,1,0,1000,30000),('power',4,1,2,0,2500,50000)]
def treat(l, i, t, dl, di, cost, avoid):
    if t == 'reduce': l1, i1, c = max(1, l - dl), max(1, i - di), cost
    elif t == 'transfer': l1, i1 = l, min(i, TL); c = hup(F100[l - 1] * (EUR[i - 1] - EUR[i1 - 1]) * LOAD, 10000)
    elif t == 'avoid': return (None, None, 0, 0, avoid)
    else: l1, i1, c = l, i, 0
    return (l1, i1, l1 * i1, el(l1, i1), c)
def ranks(v): return [1 + sum(1 for y in v if y > x) for x in v]
def run(name, tr, view, appS=8, appM=25000):
    rows = []
    for (id_, l, i, dl, di, c, a) in R:
        t = tr.get(id_, 'accept'); l1, i1, s1, e1, cost = treat(l, i, t, dl, di, c, a)
        rows.append(dict(id=id_, s0=l*i, e0=el(l, i), s1=s1, e1=e1, cost=cost, t=t))
    for r in rows:
        r['net'] = r['e0'] - r['e1'] - r['cost']
        for v, k0, k1, ap in (('score', 's0', 's1', appS), ('money', 'e0', 'e1', appM)):
            r['st_' + v] = 'avoided' if r['t'] == 'avoid' else ('board' if r[k1] > ap else 'owner')
            r['need_' + v] = r[k0] > ap
    board = [r['id'] for r in rows if r['st_' + view] == 'board']; need = [r['id'] for r in rows if r['need_' + view]]
    cost = sum(r['cost'] for r in rows); e0 = sum(r['e0'] for r in rows); e1 = sum(r['e1'] for r in rows)
    up = [r['id'] for r in rows if r['st_money'] == 'board' and r['st_score'] == 'owner']
    down = [r['id'] for r in rows if r['st_score'] == 'board' and r['st_money'] == 'owner']
    notw = [r['id'] for r in rows if r['t'] in ('reduce', 'transfer') and r['net'] < 0]
    print(name, need, board, cost, e0, e1, up, down, notw)
    return rows
rows = run('register', {}, 'score')
print(ranks([r['s0'] for r in rows]), ranks([r['e0'] for r in rows]))
T = dict(phish='reduce', patch='reduce', ransom='reduce', saas='reduce')
run('treated', T, 'score'); run('money', T, 'money')
run('by-money', dict(ransom='reduce', patch='reduce', phish='reduce', fire='reduce', share='reduce'), 'money')
run('insure', dict(phish='reduce', patch='reduce', share='reduce', ransom='transfer', fire='transfer'), 'money')
```

## Legend

inherent (hollow dashed ring) · residual (filled disc) · inherent → residual (arrow) · avoided (ring with ✕) · above
the appetite (hatched cell, thick line) · changed (highlight).

## Terms (hr / en)

registar rizika / risk register · vjerojatnost / likelihood · učinak / impact · inherentni rizik / inherent risk ·
preostali rizik / residual risk · apetit za rizik / risk appetite · postupanje s rizikom / risk treatment · smanjiti /
reduce (modify) · prenijeti / transfer (share) · izbjeći / avoid · prihvatiti / accept (retain) · vlasnik rizika / risk
owner · uprava / management board · očekivani godišnji gubitak / expected annual loss.

## Misconceptions targeted

- "Score 5 is score 5": laptop (5 × 1) and fire (5 × 1 the other way) tie by score, €6 000 and €30 000 a year in money
  (the `nTie` note, preset 1).
- "The highest score is the biggest risk": 3 × 3 (saas, 9) ranks 4th by score and 6th by money, below fire (1 × 5).
- "Within the appetite means nothing to sign": the risk owner still signs the residual (ISO/IEC 27001 6.1.3 f);
  above it the board signs.
- "Treating every red cell is the safe choice": preset 3, the score-driven choice spends 18 000 € to remove 15 000 €
  and leaves two risks above the money appetite.
- "Insurance makes the risk go away": preset 5, the premium is the expected payout plus the insurer's load; the firm
  keeps the deductible.

## Out of scope

Risk identification itself (threats, vulnerabilities, assets), the Statement of Applicability and the Annex A
controls, correlated risks, the distribution of losses and the worst year (`fin-ale-risk`), more than one control per
risk, controls that cost more the stronger they are, qualitative scales other than 5 × 5, and the review cycle over
time (named in the explanation only; `cmp-exceptions` shows acceptances that expire).

## Sources

- ISO/IEC 27001:2022, by clause number only, never quoted: 6.1.2 (risk assessment: acceptance criteria, risk owners,
  likelihood and consequences, prioritising), 6.1.3 (risk treatment: options, the plan, the risk owners' approval of
  the plan and acceptance of the residual risks), 8.2 and 8.3 (performing them at planned intervals), 9.3 (management
  review). *(check: the clause numbers are from the edition's contents; the letter of 6.1.3 f not checked against a
  copy)*
- ISO 31000:2018 and ISO/IEC 27005:2022 for the four treatment options and risk appetite. *(check: clause numbers not
  used on the page)*
- GDPR, Regulation (EU) 2016/679, art. 32(1) (security appropriate to the risk, of varying likelihood and severity) and
  art. 24(1), EUR-Lex, in English and the official Croatian version (Opća uredba o zaštiti podataka). *(check: the
  Croatian wording "vjerojatnosti i ozbiljnosti" against EUR-Lex)*
- NIS2, Directive (EU) 2022/2555, art. 20(1) (management bodies approve the cybersecurity risk-management measures and
  oversee them) and art. 21(1) (appropriate and proportionate measures). *(check: the Croatian Zakon o kibernetičkoj
  sigurnosti's article numbers are not used on the page)*
- L. A. Cox Jr., "What's wrong with risk matrices?", Risk Analysis 28(2), 2008, 497–512: ties and reversals from
  multiplying ordinal scores.
- The expected loss: `fin-ale-risk` (SPEC rules 1a, 2, 4), copied, not linked.
- All numbers on the page are illustrative (the page says so once): the firm, the twelve risks, the scale anchors, the
  control costs, the deductible and the 50 % load.
