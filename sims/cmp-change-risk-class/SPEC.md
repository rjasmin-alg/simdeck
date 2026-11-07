<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-change-risk-class: specification

Task `docs/tasks/w3/cmp-change-risk-class.md`, catalogue `cmp-change-risk-class` (§4.13; overlaps §5.24 and the
staged rollout of `lnx-deploy-strategies`). Class **explorer**: the state is a pure function of the params
(`sim.js` `compute`).

**One concept:** sending every change to a weekly change advisory board adds days of lead time and makes teams batch
changes, so each release is bigger and fails more often; classes by risk (standard: pre-approved and repeatable;
normal: peer-reviewed, the board only for high risk; emergency: approved fast, reviewed afterwards) cut lead time
without raising the failure rate; changes nobody recorded show up only as incidents.

**The contrast on the stage:** the same quarter of changes, with the same hidden defects, run three times side by
side: no process, everything to the board, risk classes. The lanes differ only by the process.

## Stage

- **Three lanes**, top to bottom: no process, everything to the board, risk classes. Each is a timeline of working
  days (13 weeks of 5 days, then the days after the quarter that rework or late meetings need, shaded). A week axis
  sits above the lanes.
- **Deployments:** each deployment is a bar on its day, one block per change in it, stacked from the baseline;
  several deployments on one day stack with a gap. A failed deployment is hatched and outlined in the danger colour,
  with ✗ above it; a deployment without a record has a dashed outline and no fill. From 3 changes up, the count
  stands above the bar ("✗20" for a failed release of 20). All lanes share one block height, so batch sizes compare
  across lanes; above 30 blocks in one column the separators are dropped.
- **Board meetings:** a small triangle under each meeting day in the two lanes with a board.
- **Beside each lane:** its name, what the board does there and how often it meets, then four numbers: days to
  production (mean lead time), changes per deployment, deployments failed (percent and failed/all), changes
  without a record; under them the deployments and the changes rolled back. The highest value of each number across
  the lanes, when one lane alone has it and it is above zero, is marked ▲ in the danger colour.
- **Foot:** once, that the page simplifies, is not legal advice, and the firm, changes and rates are made up.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `board` | choice | 1, 2, 5, 10 working days between meetings (5) | the board of both board lanes |
| `standard` | choice | `none`, `routine`, `medium` (`routine`) | which kinds count as standard changes under risk classes |
| `load` | range | 4–16 changes a week (8) | 13 × load changes in the quarter |
| `seed` | hidden; "New quarter" (`N`) adds 1, back to 1 after 999999 | 1–999999 (1501) | which changes, when, and their hidden defects |

## Rules

1. **The changes.** 13 × `load` changes. Each takes four draws of mulberry32 (the kit's `Simdeck.rng`, seeded with
   `seed`) in this order: the ready day ⌊u × 65⌋ (0–64), the kind, the defect, the review draw. **Kind:** routine
   (repeatable, low risk) when u < 0.50, medium when u < 0.80, high when u < 0.92, else urgent (shares 50 / 30 / 12 /
   8 %); a draw equal to a boundary belongs to the next kind. **Defect** when its draw is below the kind's chance:
   routine 3 %, medium 10 %, high 25 %, urgent 20 % (equal: no defect). The list is sorted by ready day; **tie-break:**
   same day keeps draw order; then numbered 1…n. A higher load keeps the first changes and adds more.
2. **The board** meets on day m when m mod I = I − 1 (I = `board`: weekly on days 4, 9, 14 …; daily every day). Its
   agenda closes the day before: a change ready on day d is decided at the first meeting on or after d + 1 (**a change
   ready on a meeting day waits for the next one**). Meetings in the quarter: ⌊65 / I⌋ (65, 32, 13, 6).
3. **Reviews.** A review finds a defect when the change's review draw is **strictly below** the route's catch rate:
   peer review 0.5, the board 0.5, a high-risk change under classes (peer review and the board) 0.75 = 1 − 0.5 × 0.5;
   no process, standard, emergency and bypass 0. A found defect sends the change back: fixed after FIX = 2 days
   (ready again on review day + 2, without the defect), then it takes its route again.
4. **Routes**, chosen each time a change becomes ready on day d:
   - *no process*: `none`, live on day d, no record.
   - *everything to the board*: `cab`, live at the meeting (rule 2). An **urgent** change goes in at once without a
     record (`bypass`, day d) **when the meeting is later than d + 1**; a meeting on d + 1 it waits for.
   - *risk classes*: urgent → `emergency` (day d, approved by one person, recorded, reviewed afterwards); high →
     `high` (peer review and the board, live at the meeting); routine → `standard` (day d, recorded) unless
     `standard` = `none`; medium → `standard` when `standard` = `medium`; everything else → `peer` (day d + 1).
5. **Deployments.** On each day, in change order: every change due that day is reviewed (rule 3); under everything
   to the board, all changes approved at the meeting go out together as **one release**; every other route deploys
   each change alone (also the high-risk changes approved at one meeting). A deployment **fails** when any change in it
   carries a defect: the defective changes are fixed (ready again on day + 2, without the defect); the others in a
   failed release were rolled back with it and are ready again the next day (day + 1), so they wait for the next
   meeting. Otherwise every change in it is live that day. A deployment on `none` or `bypass` has no record, and a
   change that ever went out that way counts as unrecorded.
6. **The run** goes on day by day past the quarter until every change is live; it always ends, since a change carries
   at most one defect and loses it when found. (The loop stops at day 1000 only as a guard; no run comes near it.)
7. **Numbers per lane:** lead time = live day − first ready day, the mean in tenths (halves up) and the maximum;
   changes per deployment = changes shipped (counted in every deployment, failed ones too) ÷ deployments, in tenths;
   **change failure rate** = failed deployments ÷ deployments, whole percent, halves up; unrecorded = changes that
   went out without a record; found only as an incident = failed deployments without a record; rolled back = the
   changes in failed deployments; meetings (rule 2) for the two lanes with a board, 0 with no process.
8. **Params (normalise):** `load`, `seed`: numeric strings are read as numbers, non-numbers (also empty or blank
   strings) → default, rounded and clamped (4–16, 1–999999); `board`: a number or numeric string, outside 1, 2, 5,
   10 → 5; `standard` outside the list (also prototype keys) →
   `routine`; unknown keys are dropped.
9. **Caption:** the main sentence compares the board lane with the risk-classes lane (lead time, changes per
   deployment, failed of all deployments and the rate; lead time and rate). Then the notes, in this order:
   `nWide` (standard = medium: how many medium-risk changes that went out as standard failed) or `nNoStd` (standard =
   none: routine changes wait a day too); `nBypass` (urgent changes that went in without a record under the board,
   and how many of their deployments failed: found only as an incident); `nDaily` (a daily board: the meetings in the
   quarter). Nothing bypasses a daily board (the meeting is always the next day), so there are at most two notes.

## Presets and expected outcomes

All at seed 1501 (104 changes at load 8: 54 routine, 36 medium, 7 high, 7 urgent; 8 carry a defect). Lead time in
days (mean, max); cfr = failed / deployments.

| # | id | params | no process | everything to the board | risk classes | notes |
|---|---|---|---|---|---|---|
| 1 | `weekly` (= defaults) | board 5, routine, 8 | 0.2 (2); 1.0; 7 % 8/112; unrecorded 104, as incident 8 | 4.7 (15); 6.0; **21 %** 5/24; unrecorded 7, as incident 2; rolled back 39 | 0.8 (10); 1.0; **5 %** 5/109; unrecorded 0 | `nBypass` |
| 2 | `fortnight` | board 10 | as 1 | 10.5 (30); 9.4; 24 % 4/17; 7, 2; rolled back 55 | 1.1 (15); 1.0; 5 % 5/109 | `nBypass` |
| 3 | `daily` | board 1 | as 1 | 1.3 (4); 1.9; 5 % 3/59; 0; rolled back 8; 65 meetings | 0.6 (4); 1.0; 5 % 5/109 | `nDaily` |
| 4 | `wide-standard` | standard medium | as 1 | as 1 | 0.4 (10); 1.0; 6 % 7/111; 4 medium standard changes failed | `nWide`, `nBypass` |
| 5 | `busy` | load 16 (208 changes, 26 defects) | 0.3 (2); 1.0; 11 % 26/234; 208, 26 | 7.7 (25); 11.1; 35 % 13/37; 17, 5; rolled back 201 | 0.9 (10); 1.0; 9 % 21/229 | `nBypass` |

Contrasts the presets carry: 1 the board adds four days and batches six changes a release, a fifth of them fail and
take 39 changes back with them, while classes match no process for speed and fail least; 2 a rarer board doubles the
wait and the batches; 3 a daily board nearly closes the gap, at 65 meetings a quarter; 4 a "standard" that takes in
medium-risk changes saves half a day and loses review: more failures; 5 twice the load doubles the batches and a third
of the releases fail.

Over many quarters (seeds 1–500, load 8, weekly board): no process 0.19 days, 8.2 % failed; the board 4.74 days,
6.5 changes per release, 21.1 % failed, 7.3 unrecorded; risk classes 0.96 days, 5.0 % failed, none unrecorded. A daily
board: 1.42 days, 2.2 per release, 8.2 %; every two weeks: 12.5 days, 11.1, 26.4 %. Standard none / routine / medium:
1.47 / 0.96 / 0.63 days and 4.3 / 5.0 / 6.3 % failed. The tests check the orderings over seeds 1–200.

Independent check (run 2026-11-07, `python3 -I`; prints the table's
numbers, and they match `sim.js`). It is a separate implementation of the rules above, not a translation of `sim.js`:

```python
M32 = 0xFFFFFFFF
def imul(a, b): return (a * b) & M32
def rng(seed):
    a = seed & M32
    def r():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = imul(a ^ (a >> 15), a | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r
DAYS, FIX = 65, 2
KINDS = [('routine', .50, .03), ('medium', .80, .10), ('high', .92, .25), ('urgent', 1.0, .20)]
CATCH = dict(none=0, bypass=0, standard=0, emergency=0, peer=.5, cab=.5, high=.75)
def gen(n, seed):
    r = rng(seed); raw = []
    for i in range(n):
        ready = int(r() * DAYS); u = r()
        kind, dp = next((k, d) for k, c, d in KINDS if u < c)
        raw.append((ready, i, kind, r() < dp, r()))
    raw.sort()
    return [dict(id=j + 1, ready=x[0], kind=x[2], defect=x[3], u=x[4]) for j, x in enumerate(raw)]
def meet(day, I):  # first meeting on or after day
    while day % I != I - 1: day += 1
    return day
def route(reg, kind, day, I, std):
    if reg == 'none': return 'none'
    if reg == 'cab': return 'bypass' if kind == 'urgent' and meet(day + 1, I) > day + 1 else 'cab'
    if kind == 'urgent': return 'emergency'
    if kind == 'high': return 'high'
    if kind == 'routine' and std != 'none': return 'standard'
    if kind == 'medium' and std == 'medium': return 'standard'
    return 'peer'
def at(rt, day, I): return day + 1 if rt == 'peer' else meet(day + 1, I) if rt in ('cab', 'high') else day
def run(chs, reg, I, std):
    st = {c['id']: dict(c, r0=c['ready'], at=None, done=None, unrec=False, fails=0) for c in chs}
    deps = []; day = 0
    while any(x['done'] is None for x in st.values()):
        for x in st.values():
            if x['done'] is None and x['at'] is None and x['ready'] == day:
                x['rt'] = route(reg, x['kind'], day, I, std); x['at'] = at(x['rt'], day, I)
        batch = []
        for i in sorted(st):
            x = st[i]
            if x['done'] is not None or x['at'] != day: continue
            if x['defect'] and x['u'] < CATCH[x['rt']]:
                x['defect'] = False; x['ready'] = day + FIX; x['at'] = None; continue
            if x['rt'] == 'cab': batch.append(x)
            else: deps.append((day, [x], x['rt']))
        if batch: deps.append((day, batch, 'cab'))
        for d in [d for d in deps if d[0] == day]:
            failed = any(x['defect'] for x in d[1]); un = d[2] in ('none', 'bypass')
            d += (failed, un)
            for x in d[1]:
                x['unrec'] |= un
                if not failed: x['done'] = day
                elif x['defect']: x['defect'] = False; x['fails'] += 1; x['ready'] = day + FIX; x['at'] = None
                else: x['ready'] = day + 1; x['at'] = None
            deps[deps.index(d[:3])] = d
        day += 1
    return deps, st
def hup10(a, b): return (20 * a + b) // (2 * b)
def hup100(a, b): return (200 * a + b) // (2 * b)
def lanes(load=8, board=5, std='routine', seed=1501):
    chs = gen(13 * load, seed); out = {}
    for reg in ('none', 'cab', 'classes'):
        deps, st = run(chs, reg, board, std)
        nd = len(deps); fl = sum(1 for d in deps if d[3]); sh = sum(len(d[1]) for d in deps)
        leads = [x['done'] - x['r0'] for x in st.values()]
        out[reg] = dict(lead10=hup10(sum(leads), len(leads)), maxLead=max(leads), batch10=hup10(sh, nd), cfr=hup100(fl, nd),
                        failed=fl, deploys=nd, unrec=sum(x['unrec'] for x in st.values()),
                        unrecFailed=sum(1 for d in deps if d[3] and d[4]), rolled=sum(len(d[1]) for d in deps if d[3]))
        if reg == 'classes' and std == 'medium':
            out['stdMediumFailed'] = sum(1 for x in st.values() if x['kind'] == 'medium' and x['fails'])
    kinds = {k: sum(c['kind'] == k for c in chs) for k, _, _ in KINDS}
    return len(chs), kinds, sum(c['defect'] for c in chs), out
P = dict(weekly={}, fortnight=dict(board=10), daily=dict(board=1), **{'wide-standard': dict(std='medium')}, busy=dict(load=16))
for name, over in P.items():
    n, kinds, defects, out = lanes(**over)
    print(name, n, kinds, 'defects', defects)
    for reg in ('none', 'cab', 'classes'): print('  ', reg, out[reg])
    if 'stdMediumFailed' in out: print('   stdMediumFailed', out['stdMediumFailed'])
```

## Legend

deployment (block = one change) · failed, rolled back (hatched, ✗) · without a record (dashed, no fill) · board
meeting (triangle) · after the quarter (shaded).

## Terms (hr / en)

upravljanje promjenama / change management · odbor za promjene / change advisory board (settled by the owner,
2026-11-07) · standardna promjena / standard change · normalna promjena / normal change · hitna promjena / emergency
change · vrijeme do produkcije / lead time · udio neuspjelih isporuka / change failure rate · isporuka / deployment ·
promjene po isporuci / batch size · bez zapisa / unrecorded · vraćeno / rolled back · pregled kolege / peer review ·
naknadni pregled / review afterwards · sjednica / meeting.

## Misconceptions targeted

- "More approval means fewer failures": the board catches defects as often as a peer review, but the batch it
  creates fails as one, and the whole release is rolled back (preset 1: 21 % of releases against 5 %).
- "A weekly board costs only a few days": the wait compounds, a failed release goes back to the next meeting with the
  good changes in it (max lead 15 days, 30 every two weeks).
- "Under the board everything is recorded": urgent fixes cannot wait and go in without a record; their failures are
  found only as incidents.
- "Pre-approval is a loophole": standard changes are the repeatable low-risk ones; widening the class (preset 4) is
  where the failure rate rises.
- "Just meet more often": a daily board nearly closes the gap, at 65 meetings a quarter (preset 3).

## Out of scope

Weekends and holidays, freeze periods, how long an incident lasts or what it costs, the time to find a cause (named
in the explanation only), interactions between changes in a release (a release fails only through its own changes'
defects), a review that gets thinner as the agenda grows (`cmp-four-eyes`), staged rollout and rings
(`lnx-deploy-strategies`), the post-implementation review's content, change records as audit evidence
(`cmp-policy-to-record`, `cmp-audit-sampling`).

## Sources

- ISO/IEC 27001:2022, Annex A control 8.32, change management (by number only, never quoted). *(check: control number
  from the 2022 edition's Annex A list)*
- DORA, Regulation (EU) 2022/2554, art. 9(4)(e): ICT change management policies, procedures and controls based on a
  risk assessment approach, so that all changes are recorded, tested, assessed, approved, implemented and verified in
  a controlled manner. EUR-Lex. *(check: the point letter (e) and the Croatian wording; the page paraphrases)*
- NIS2, Directive (EU) 2022/2555, art. 21(2), lists the cybersecurity risk-management measures (security in acquisition,
  development and maintenance, point (e)); not cited on the page. *(check)*
- N. Forsgren, J. Humble, G. Kim, *Accelerate* (IT Revolution, 2018), ch. 7: approval by an external body (a change
  advisory board) was negatively correlated with lead time, deployment frequency and restore time, and not correlated
  with change failure rate; lead time and change failure rate as delivery measures. *(check: chapter number)*
- The standard / normal / emergency change types are common service-management practice (the ITIL change
  enablement practice); named in Sources only, not on the page.
- All rates, shares, the fix time and the review catch rates are illustrative (the page says so once). Checked by the
  Python script above.
