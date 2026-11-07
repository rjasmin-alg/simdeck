<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-dpia-triage: specification

Task `docs/tasks/w3/cmp-dpia-triage.md`, catalogue `cmp-dpia-triage` (§4.13; risk scoring from `cmp-risk-register`,
§5.24). Class **explorer**: the state is a pure function of the params (`sim.js` `compute`). The scoring (likelihood ×
severity, a reduction with floors, "strictly above the line") is `scoring.js`, copied unchanged from
`sims/cmp-risk-register/scoring.js` @ d88138f (COMMON.md §6), with no code change (one header comment line added); this sim uses `score`, `above` and `treat` (reduce).

**One concept:** processing likely to result in a high risk to people needs a data protection impact assessment
before it starts (GDPR art. 35(1)); screening criteria add up (systematic monitoring, sensitive or highly personal
data, large scale, combined datasets, vulnerable people such as employees, new technology), and meeting two usually
means an assessment (EDPB-endorsed guidelines WP248 rev.01); measures (minimisation, pseudonymisation, shorter
retention, narrower access) lower the risk that remains; if it stays high, the supervisory authority is consulted
before the processing starts (art. 36(1)).

**The contrast on the stage:** the same plan before and after measures. The screening (criteria and the
recommendation) is read from the plan and does not move when measures are switched on; the risk markers on the matrix
do. Switching an activity on lights criteria and can tip the recommendation (one harmless log + a join with HR
records = two criteria).

## Stage

Three columns, one screen at 1920×1080.

- **The plan** (left): six activity buttons, numbered 1–6 in the order below, each pressed (✓, filled) or not; under
  them a seventh button, "roll out across the whole group (2 400 people)" instead of the firm's 140. Each activity
  button shows the short tags of the criteria it lights. Every button is `aria-pressed`.
- **Screening** (middle): the six criteria as lamps in WP248 order; a lit lamp is filled with ✓ and names what lit it
  (the activity numbers, or "group"); unlit lamps are hollow and muted. Under them the count on a 0–6 track with a
  thick mark at 2 ("usually an assessment from here"). Under that the **recommendation** box: its verdict word in bold
  with an icon (· / ○ / ! / ✓) and one line of what follows. Criteria and the verdict that changed with the last
  click are highlighted (`.sd-changed`).
- **Risk to people** (right): the 5 × 5 matrix, likelihood 1–5 upwards, severity 1–5 to the right, each cell its score;
  cells above the high-risk line hatched, with a thick staircase edge. Every active activity is a numbered marker: a
  hollow dashed ring before measures, a filled disc after them, an arrow between (one disc with a solid ring when the
  measures do not move it). Under the matrix the four **measure** buttons (`aria-pressed`) and the highest remaining
  risk and the highest before them, each with its activity ("highest after measures: 6 (desk camera); before: 16 (desk camera)"): the two can be different activities.
- **Foot:** once: simplified, not legal advice, a made-up firm, numbers illustrative.

The panel holds the presets and the explanation; the eleven params are hidden in it (kept for the URL and the reset),
because their buttons are on the stage.

## Params

| key | type | default | meaning |
|---|---|---|---|
| `badge`, `cars`, `camera`, `pcs`, `combine`, `face` | toggle | preset 1: `badge` only | the activities (rule 1) |
| `group` | toggle | false | rolled out across the group (2 400 people) instead of the firm (140) |
| `minimise`, `pseudo`, `retention`, `access` | toggle | false | the measures (rule 5) |

## Rules

1. **The activities**, in order, with the criteria each lights, its likelihood L and severity S before measures
   (illustrative, 1–5), and what each measure lowers (ΔL, ΔS):

   | n | id | activity | criteria | L | S | minimise | pseudo | retention | access |
   |---|---|---|---|---|---|---|---|---|---|
   | 1 | `badge` | badge access logs at the doors | vulnerable | 2 | 1 | – | – | L −1 | – |
   | 2 | `cars` | location tracking of company cars | monitor, sensitive, vulnerable | 3 | 3 | S −1 | L −1 | L −1 | L −1 |
   | 3 | `camera` | a camera over the desks | monitor, vulnerable | 4 | 4 | S −1 | – | L −1 | L −1 |
   | 4 | `pcs` | monitoring staff computers | monitor, sensitive, vulnerable | 4 | 4 | S −2 | L −1 | L −1 | L −1 |
   | 5 | `combine` | joining the logs with HR records into a monthly report per person | combined, vulnerable | 3 | 4 | S −1 | L −1 | – | L −1 |
   | 6 | `face` | face recognition at the entrance | sensitive, newtech, vulnerable | 3 | 5 | S −1 | – | – | – |

   Why: every activity concerns employees (WP248 criterion 7: the power imbalance with the employer). Monitoring
   (criterion 3): cars, camera, computers. Highly personal data (criterion 4): location (cars), communications and
   browsing (computers); biometric data for identification is a special category (art. 9(1)) (face). Combining
   datasets (criterion 6): the report. New technology (criterion 8): face recognition. Minimisation per activity: no
   location outside working hours; screens masked and no sound; security events only, no content or screenshots; only
   the fields the report needs; the template kept on the badge card, not in a central database. Pseudonymisation: a
   vehicle, device or staff code instead of the name, the name looked up only on a recorded need. Shorter retention:
   30 days instead of a year. Narrower access: the security officer, not every line manager.
2. **The report needs a source.** `combine` is *active* only when at least one other activity (1–4 or 6) is on. Switched
   on alone it lights nothing, has no marker, and the caption says it has nothing to join (`noSource`).
3. **Scale.** `group` lights `large` (WP248 criterion 5) only when at least one activity is active, and adds 1 to the
   likelihood of every active activity, capped at 5 (more people, more chances that one is harmed). The GDPR sets no
   number for large scale; the page's 2 400 against 140 is illustrative.
4. **Screening.** The criteria lit are the union of the active activities' criteria (and `large`, rule 3), listed in the
   order `monitor`, `sensitive`, `large`, `combined`, `vulnerable`, `newtech` (WP248 criteria 3–8). Each lit criterion
   names what lit it, in activity order, `group` last. **Measures never change the screening** (the screening is of
   the plan; measures come out of the assessment).
5. **Risk before and after measures.** For each active activity: L0 = min(5, L + 1 if `group`), S0 = S; ΔL and ΔS are
   the sums of the switched-on measures' entries in rule 1; L1 = max(1, L0 − ΔL), S1 = max(1, S0 − ΔS) (this is
   `scoring.treat` with `t: 'reduce'`, `cost: 0`); score0 = L0 × S0, score1 = L1 × S1 (`scoring.score`).
6. **The high-risk line.** A score is high when it is strictly above 12 (`scoring.above(score, 12)`): 15, 16, 20 and 25
   are high, 12 is not. The cells above the line form a staircase (edges as in `cmp-risk-register`).
7. **Highest risk.** The highest score0 and the highest score1 over the active activities; **on a tie, the first in
   activity order** (camera before computers at 16).
8. **The recommendation**, first rule that applies:
   1. no active activity → `empty` (nothing to screen);
   2. fewer than two criteria → `record`: an assessment is not usually needed; record the screening and the reason
      (WP248: a controller that decides against an assessment documents why; one criterion may still be enough in a
      particular case: explanation only);
   3. two or more criteria, highest score1 high → `consult`: assess before starting; the remaining risk stays high, so
      lower it (further), change the design, or consult the supervisory authority before the processing starts
      (art. 36(1));
   4. two or more criteria, otherwise → `proceed`: assess before starting; with the measures the remaining risk is not
      high; keep the assessment and review it when the processing changes (art. 35(11)).
9. **Idle measures.** A switched-on measure is *idle* when its entry in rule 1 is "–" for every active activity (it
   is judged by the table, not by the floors: a measure whose lowering is eaten by the floor of 1 is not idle).
10. **Caption.** The main sentence by verdict: `capEmpty`, `capRecord`, and for `consult` and `proceed` one key
    without measures switched on (`capConsult0`, `capProceed0`) and one with (`capConsult`, `capProceed`); then at most
    two notes, in this order: `nNoSource` (rule 2), `nIdle` (rule 9), `nSame` (at least one switched-on measure is not
    idle, and two or more criteria: the count did not move).
11. **Changed marks.** Between two states, the criteria whose lit state changed and the verdict, if it changed, are
    highlighted (`flipped(prev, next)` → `{ crit: [ids], verdict: bool }`).
12. **Params are normalised:** a toggle is on only for `true`, `'true'`, `1` or `'1'`; anything else is off.

## Presets and expected outcomes

| # | id | plan | criteria (count) | before → after (highest) | verdict | notes |
|---|---|---|---|---|---|---|
| 1 | `badge` | badge | vulnerable (1) | badge 2 → 2 | record | – |
| 2 | `camera` | camera | monitor, vulnerable (2) | camera 16 → 16 | consult | – |
| 3 | `camera-measures` | camera; minimise, retention, access | monitor, vulnerable (2) | camera 16 → 6 (L 4→2, S 4→3) | proceed | nSame |
| 4 | `join` | badge, combine | combined, vulnerable (2) | combine 12 → 12 | proceed | – |
| 5 | `package` | badge, cars, camera, pcs, combine | monitor, sensitive, combined, vulnerable (4) | camera 16 → 16 (tie with pcs) | consult | – |
| 6 | `face-group` | face, group; all four measures | sensitive, large, vulnerable, newtech (4) | face 20 → 16 (L 4, S 5→4) | consult | nIdle (pseudo, retention, access), nSame |

Also checked: `package` with all four measures → proceed, highest camera 6; `face` at the firm with all four measures
→ proceed, face 12 (exactly on the line, not above: the group roll-out tips it). Over all 128 plans without
measures: 4 empty, 1 record, 8 proceed, 115 consult; with every measure: 4 empty, 1 record, 91 proceed, 32 consult.
No plan with one criterion has a high score before measures.

Independent check (run 2026-11-07, `python3 -I check.py`; prints the rows above):

```python
from itertools import product
CRIT = ['monitor', 'sensitive', 'large', 'combined', 'vulnerable', 'newtech']
MEAS = ['minimise', 'pseudo', 'retention', 'access']
ACT = {  # criteria, L, S, (dL, dS) per measure
  'badge':   (['vulnerable'], 2, 1, [(0,0),(0,0),(1,0),(0,0)]),
  'cars':    (['monitor','sensitive','vulnerable'], 3, 3, [(0,1),(1,0),(1,0),(1,0)]),
  'camera':  (['monitor','vulnerable'], 4, 4, [(0,1),(0,0),(1,0),(1,0)]),
  'pcs':     (['monitor','sensitive','vulnerable'], 4, 4, [(0,2),(1,0),(1,0),(1,0)]),
  'combine': (['combined','vulnerable'], 3, 4, [(0,1),(1,0),(0,0),(1,0)]),
  'face':    (['sensitive','newtech','vulnerable'], 3, 5, [(0,1),(0,0),(0,0),(0,0)]),
}
ORDER = list(ACT); HIGH = 12
def run(on, group, meas):
    src = any(on.get(a) for a in ORDER if a != 'combine')
    act = [a for a in ORDER if on.get(a) and (a != 'combine' or src)]
    lit = set()
    for a in act: lit |= set(ACT[a][0])
    if act and group: lit.add('large')
    rows = []
    for a in act:
        c, l, i, eff = ACT[a]
        l0 = min(5, l + (1 if group else 0)); i0 = i
        dl = sum(eff[k][0] for k, m in enumerate(MEAS) if m in meas)
        di = sum(eff[k][1] for k, m in enumerate(MEAS) if m in meas)
        l1, i1 = max(1, l0 - dl), max(1, i0 - di)
        rows.append((a, l0, i0, l0*i0, l1, i1, l1*i1))
    n = len(lit)
    top0 = max(rows, key=lambda r: r[3], default=None)  # max() keeps the first on ties
    top1 = max(rows, key=lambda r: r[6], default=None)
    if not act: v = 'empty'
    elif n < 2: v = 'record'
    elif top1[6] > HIGH: v = 'consult'
    else: v = 'proceed'
    idle = [m for k, m in enumerate(MEAS) if m in meas and all(ACT[a][3][k] == (0,0) for a in act)]
    return dict(n=n, lit=[c for c in CRIT if c in lit], v=v, rows=rows, top0=top0 and (top0[0], top0[3]),
                top1=top1 and (top1[0], top1[6]), idle=idle)

ALLM = set(MEAS)
P = {
 'badge': ({'badge':1}, 0, set()),
 'camera': ({'camera':1}, 0, set()),
 'camera-measures': ({'camera':1}, 0, {'minimise','retention','access'}),
 'join': ({'badge':1,'combine':1}, 0, set()),
 'package': ({'badge':1,'cars':1,'camera':1,'pcs':1,'combine':1}, 0, set()),
 'face-group': ({'face':1}, 1, ALLM),
}
for k, (on, g, m) in P.items():
    r = run(on, g, m); print(k, r['n'], r['lit'], r['v'], 'top0', r['top0'], 'top1', r['top1'], 'idle', r['idle'])
print('package + all measures:', run(P['package'][0], 0, ALLM)['v'], run(P['package'][0], 0, ALLM)['top1'])
print('face firm + all measures:', run({'face':1}, 0, ALLM)['v'], run({'face':1}, 0, ALLM)['top1'])
bad = 0; counts = {}
for bits in product([0,1], repeat=7):
    on = dict(zip(ORDER, bits[:6])); r = run(on, bits[6], set()); counts[r['v']] = counts.get(r['v'], 0) + 1
    if r['v'] == 'record' and r['top0'][1] > HIGH: bad += 1
print('record with high inherent risk:', bad, ' verdicts over 128 plans (no measures):', counts)
fin = {}
for bits in product([0,1], repeat=7):
    on = dict(zip(ORDER, bits[:6])); r = run(on, bits[6], ALLM); fin[r['v']] = fin.get(r['v'], 0) + 1
print('with every measure:', fin)
```

Output (abridged): `badge 1 ['vulnerable'] record top0 ('badge', 2) top1 ('badge', 2)` · `camera 2 … consult
('camera', 16) ('camera', 16)` · `camera-measures 2 … proceed ('camera', 16) ('camera', 6)` · `join 2 ['combined',
'vulnerable'] proceed ('combine', 12) ('combine', 12)` · `package 4 ['monitor', 'sensitive', 'combined', 'vulnerable']
consult ('camera', 16) ('camera', 16)` · `face-group 4 ['sensitive', 'large', 'vulnerable', 'newtech'] consult
('face', 20) ('face', 16) idle ['pseudo', 'retention', 'access']` · `package + all measures: proceed ('camera', 6)` ·
`face firm + all measures: proceed ('face', 12)` · `record with high inherent risk: 0 … {'empty': 4, 'consult': 115,
'proceed': 8, 'record': 1}` · `with every measure: {'empty': 4, 'proceed': 91, 'consult': 32, 'record': 1}`.

## Legend

Hollow dashed ring: before measures · filled disc: after measures · arrow: what the measures moved · hatched cell with a
thick edge: high risk · filled lamp with ✓: criterion met.

## Terms (hr / en)

procjena učinka na zaštitu podataka / data protection impact assessment · voditelj obrade / controller · ispitanik /
data subject · nadzorno tijelo / supervisory authority · prethodno savjetovanje / prior consultation · sustavno praćenje
/ systematic monitoring · osjetljivi ili vrlo osobni podaci / sensitive or highly personal data · velik opseg / large
scale · kombiniranje skupova podataka / combining datasets · ranjivi ispitanici / vulnerable data subjects · nova
tehnologija / new technology · smanjenje količine podataka / data minimisation · pseudonimizacija / pseudonymisation ·
kraće čuvanje / shorter retention · uži pristup / narrower access · vjerojatnost / likelihood · ozbiljnost / severity ·
preostali rizik / remaining (residual) risk · visok rizik / high risk. Choices without a settled form are listed in
`NOTES.md`.

## Misconceptions targeted

- "We will pseudonymise, so we do not need an assessment." Measures lower the remaining risk; the screening is of the
  plan and its count does not move (rule 4, note `nSame`).
- "Each log is harmless, so the project is." A badge log alone meets one criterion; joined with HR records it meets two
  (preset `join`).
- "Any measure helps." A measure has to fit the risk: pseudonymisation does nothing for a camera picture, and none of
  the access or retention measures touch a biometric template (note `nIdle`, preset `face-group`).
- "An assessment is a form you file and then start." When the remaining risk stays high, the processing waits for the
  supervisory authority or a different design (verdict `consult`).
- "Large scale means millions." The regulation sets no number; the same face recognition is acceptable for 140 people
  with its measures and stays high for 2 400 (presets `face-group` and the face-at-the-firm check).

## Out of scope

The full nine WP248 criteria (evaluation or scoring, automated decisions with legal effect and processing that
prevents people from exercising a right or using a service are named in the explanation only); art. 35(3)'s three
listed cases; the national lists of processing that always or never needs an assessment (art. 35(4)–(5)); the
contents of an assessment (art. 35(7)); the data protection officer's advice; lawful basis and consent; the workers'
council; the authority's answer to a prior consultation.

## Sources

- GDPR, Regulation (EU) 2016/679, art. 35(1), (11), art. 36(1), art. 9(1), art. 5(1)(c) and (e), art. 4(5), recitals
  75–76, 84, 89–91 (EUR-Lex, English and Croatian versions). *(check: the Croatian wording of the terms in the table
  above against the official Croatian text)*
- Article 29 Working Party, *Guidelines on Data Protection Impact Assessment (DPIA) and determining whether processing
  is "likely to result in a high risk"*, WP248 rev.01 (4 October 2017), endorsed by the EDPB on 25 May 2018: the nine
  criteria, "in most cases … two criteria would require a DPIA", employees as vulnerable data subjects, location data
  as highly personal, documenting a decision not to carry out an assessment. *(check: the Croatian terms for the
  criteria; no official Croatian version was consulted)*
- `cmp-risk-register` SPEC rules 1, 3 and 4 (score, reduce with floors, strictly above the line).
- All activities, levels and effects are illustrative (the page says so once). Checked by the script above.
