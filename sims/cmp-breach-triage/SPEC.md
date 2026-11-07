<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-breach-triage: specification

Task `docs/tasks/w3/cmp-breach-triage.md`, catalogue `cmp-breach-triage` (§4.13; seed: the clocks from
`cmp-incident-clocks`, §5.24, which this sim extends with the decision). Class **stepper**, 7 steps. The state at step
*n* is a pure function of *n* and the params (`sim.js`); the 72-hour clock is `clocks.js`, copied unchanged from
`sims/cmp-incident-clocks/clocks.js` @ b48f936 (`models/clocks.js` does not exist yet; COMMON.md §6).

**One concept:** a breach of the confidentiality, integrity or availability of personal data is notified to the
supervisory authority unless it is unlikely to result in a risk to people (GDPR art. 33(1)), and the people are told
when the risk is high (art. 34(1)); strong encryption with a key that was not lost turns a lost laptop into a breach
that is only recorded (art. 34(3)(a) and the EDPB's reading of art. 33); every breach goes into the internal register
whatever the outcome (art. 33(5)).

**The contrast on the stage:** the same breach with and without the controls. Each loss is drawn as lost or contained;
the score meter carries a dashed "without the controls" cell, and at the summary the outcome ladder carries a dashed
"without the controls" tag on the outcome the breach would need without them (preset 1: record only, against record,
notify and inform). The presets put the decision on each of the three rungs.

## Stage

- **Case card** (left): the case's name and what happened, the data (kind and example fields), the number of people,
  the moment of awareness; the three losses (confidentiality, integrity, availability), each `?` before step 1, then
  ✗ lost (red frame), ✓ contained (green frame) once its question is answered, or "not hit" (dashed, muted).
- **Questions** (right), numbered, the step's row highlighted: 1 a personal-data breach? (yes, and which losses);
  2 encrypted, key safe? 3 recovered in time? 4 risk to people? with the **score meter**: cells 0–4 in three zones
  (0–1 record, 2 notify, 3–4 inform), the score's cell filled, the score without the controls outlined dashed, the
  sum written beside it.
- **Outcome ladder** (bottom): record → notify → inform. Each box is `?` until its step, then ✓ (solid, tinted) or
  "– not required" (dashed, title struck). Notify shows its deadline and filing time. At the summary the decision's box
  gets a thick frame and the "▽ without the controls" tag sits on the box of the decision without them.
- **Foot:** simplified, not legal advice; the firm, the cases, the points and the thresholds are made up.

## Fixed data (illustrative)

| case | losses | event (attack) | detect / triage | awareness | what the controls mean in this case |
|---|---|---|---|---|---|
| `laptop` | C, A | Thu 4 Mar 19:00 (stolen) | 13 / 2 h | Fri 5 Mar 10:00 | enc: disk encrypted, password not with the laptop; recovered: the list restored from a backup |
| `email` | C | Tue 2 Mar 10:00 (sent) | 1 / 1 h | Tue 2 Mar 12:00 | enc: attachment encrypted, password sent another way; nothing to recover |
| `ransomware` | C, A | Sat 6 Mar 02:00 | 5 / 6 h | Sat 6 Mar 13:00 | enc: the copied files were encrypted, key not taken; recovered: server restored from a backup |
| `restore` | I, A | Wed 3 Mar 14:00 (failure) | 0 / 2 h | Wed 3 Mar 16:00 | no confidentiality loss; recovered: the two days re-entered from e-mails and forms |

The reference week is `cmp-incident-clocks`' (Monday 1 March 2027). Data points: contact details 1, financial data 2,
health data (special category, GDPR art. 9) 3. Large scale: 1000 people or more, +1. Thresholds: 2 (risk, notify),
3 (high risk, inform). The notification is prepared in office hours (3 hours of work, `clocks.js` defaults).

## Params

| key | control | values (default) |
|---|---|---|
| `case` | select | `laptop`, `email`, `ransomware`, `restore` (`laptop`) |
| `enc` | choice | `none`, `safe` (strong encryption, key not lost), `lost` (encrypted, key lost with the data) (`safe`) |
| `recovered` | toggle | (on) the data that went missing or wrong was recovered in time |
| `data` | select | `contact`, `financial`, `special` (`financial`) |
| `people` | select | 1, 10, 100, 1000, 10000 (1000) |

## Rules

1. **Params (normalise).** `case`, `enc`, `data` not in their lists take the default; `recovered` accepts booleans,
   `'true'`/`'false'`, `'1'`/`'0'`, 1/0, anything else the default; `people` accepts a listed number or a string that
   `Number()` reads as one (`'10'`, `'1e3'`, `'0x3e8'`), anything else the default.
2. **Losses.** Each case hits a fixed set of confidentiality (C), integrity (I), availability (A), table above; listed
   in C, I, A order.
3. **Containment.** C is contained when `enc` is `safe`; I and A are contained when `recovered`. **Tie-breaks:**
   `lost` counts as `none` (encryption without a safe key does nothing); a control for a loss the case does not have
   changes nothing (encryption for the restore, recovery for the e-mail: a sent e-mail cannot be taken back).
4. **Score.** If every hit loss is contained, 0. Otherwise the data's points (1, 2, 3) + 1 when people ≥ 1000.
   **Tie-breaks:** exactly 1000 is large; one loss left is enough for the full score (two losses left score the same
   as one: the score is about what the data can do to people, not how many ways it was lost).
5. **Level.** score ≥ 3 high; score ≥ 2 a risk (likely); else unlikely. **Tie-break:** a score exactly at a threshold
   takes the higher level.
6. **Outcomes.** Record always; notify the supervisory authority when the level is risk or high; inform the people when
   it is high (so whoever informs also notifies). The decision is the furthest outcome required. When notified, the
   GDPR clock of `clocks.js` runs: due awareness + 72 h; filed after 3 hours of work in office hours (weekdays 8–16);
   with these cases every notification is in time.
7. **Steps (7).** Stages: 0 the case, 1 breach (losses shown as lost; record ✓), 2 confidentiality (C turns
   contained if so), 3 integrity and availability (I, A turn contained if so), 4 risk (level and meter), 5 notify,
   6 inform, 7 summary. An outcome is `null` before its step, then true or false. A step outside 0…7 is clamped, a
   fractional one rounded (half up), a non-number is 0; the state's `n` is the clamped step.
8. **Counterfactuals.** *without*: the same params with `enc: none, recovered: false`; *with both*: `enc: safe,
   recovered: true`. With both every case is only recorded; without is never better than the chosen params. Because of
   rule 4, *without* differs from the chosen decision only when every loss is contained, and then *with both* equals it:
   the two never differ together.
9. **Caption.** Keys by stage: case (`cCase<Case>`); breach; confidentiality (`cConfNone` when the case has no C, else
   `cConfSafe` / `cConfLost` / `cConfPlain`); availability (`cAvailNone` when no I or A, else `cAvailBack` /
   `cAvailGone`); risk (`cRiskContained` at 0 with nothing left, else `cRiskScore` + `cRiskUnlikely` / `cRiskRisk` /
   `cRiskHigh`); notify (yes / no); inform (yes / no but notified / no); summary (`cSumRecord` / `cSumNotify` /
   `cSumInform`, + `cSumWithout` when *without* needs more, + `cSumWith` when *with both* needs less).

## Presets and expected outcomes

| # | id | case | enc / recovered | data · people | left | score | decision | GDPR clock | without / with both |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `laptop-encrypted` (= defaults, entry) | laptop | safe / on | financial · 1000 | – | 0 | record | – | inform / record |
| 2 | `laptop-key-lost` | laptop | lost / on | financial · 1000 | C | 3 | inform | due Mon 8 Mar 10:00, filed Fri 5 Mar 13:00 | inform / record |
| 3 | `wrong-email` | email | none / off | financial · 10 | C | 2 | notify | due Fri 5 Mar 12:00, filed Tue 2 Mar 15:00 | notify / record |
| 4 | `sick-note` | email | none / off | special · 1 | C | 3 | inform | due Fri 5 Mar 12:00, filed Tue 2 Mar 15:00 | inform / record |
| 5 | `ransomware` | ransomware | none / on | contact · 10000 | C | 2 | notify | due Tue 9 Mar 13:00, filed Mon 8 Mar 11:00 | notify / record |
| 6 | `restore` | restore | none / off | contact · 100 | I, A | 1 | record | – | record / record |

Contrasts: 1 vs 2, a safe key against a lost one (record only against notify and inform); 3 vs 4, ten people's
salaries notify, one person's health data informs; 5, the backup contains availability but the copied data still
needs a notification; 6, an availability and integrity breach is still a breach, recorded.

Independent check (run 2026-11-07, a separate re-implementation in Python):

```python
import datetime as dt
W0 = dt.datetime(2027, 3, 1)            # Monday
CASES = {'laptop': ('CA', 3*24+19, 13, 2), 'email': ('C', 24+10, 1, 1),
         'ransomware': ('CA', 5*24+2, 5, 6), 'restore': ('IA', 2*24+14, 0, 2)}
DATA = {'contact': 1, 'financial': 2, 'special': 3}
def office(h):
    t = W0 + dt.timedelta(hours=h); return t.weekday() < 5 and 8 <= t.hour < 16
def finish(t, need):
    while need:
        if office(t): need -= 1
        t += 1
    return t
fmt = lambda h: (W0 + dt.timedelta(hours=h)).strftime('%a %d.%m %H:%M')
def decide(case, enc, rec, data, people):
    losses, *_ = CASES[case]
    left = [k for k in losses if not (enc == 'safe' if k == 'C' else rec)]
    score = (DATA[data] + (people >= 1000)) if left else 0
    return ''.join(left), score, 'inform' if score >= 3 else 'notify' if score >= 2 else 'record'
for name, case, enc, rec, data, people in [
        ('laptop-encrypted', 'laptop', 'safe', True, 'financial', 1000),
        ('laptop-key-lost', 'laptop', 'lost', True, 'financial', 1000),
        ('wrong-email', 'email', 'none', False, 'financial', 10),
        ('sick-note', 'email', 'none', False, 'special', 1),
        ('ransomware', 'ransomware', 'none', True, 'contact', 10000),
        ('restore', 'restore', 'none', False, 'contact', 100)]:
    left, score, dec = decide(case, enc, rec, data, people)
    _, a, d, t = CASES[case]; aw = a + d + t
    clock = f"due {fmt(aw+72)} filed {fmt(finish(aw, 3))}" if dec != 'record' else 'no clock'
    wo = decide(case, 'none', False, data, people); wb = decide(case, 'safe', True, data, people)
    print(f"{name} | left {left or '-'} score {score} {dec} | aware {fmt(aw)} {clock} | without {wo[1]} {wo[2]} | with both {wb[1]} {wb[2]}")
```

Output (matches the table):

```
laptop-encrypted | left - score 0 record | aware Fri 05.03 10:00 no clock | without 3 inform | with both 0 record
laptop-key-lost | left C score 3 inform | aware Fri 05.03 10:00 due Mon 08.03 10:00 filed Fri 05.03 13:00 | without 3 inform | with both 0 record
wrong-email | left C score 2 notify | aware Tue 02.03 12:00 due Fri 05.03 12:00 filed Tue 02.03 15:00 | without 2 notify | with both 0 record
sick-note | left C score 3 inform | aware Tue 02.03 12:00 due Fri 05.03 12:00 filed Tue 02.03 15:00 | without 3 inform | with both 0 record
ransomware | left C score 2 notify | aware Sat 06.03 13:00 due Tue 09.03 13:00 filed Mon 08.03 11:00 | without 2 notify | with both 0 record
restore | left IA score 1 record | aware Wed 03.03 16:00 no clock | without 1 record | with both 0 record
```

## Legend

✗ lost (red frame) · ✓ contained (green frame) · ▽ without the controls (dashed). The outcome boxes say "✓ required"
or "– not required" in words (solid tinted against dashed with the title struck); the score cell is filled, the
step's question row and outcome box are highlighted.

## Terms (hr / en)

povreda osobnih podataka / personal-data breach · povjerljivost, cjelovitost, dostupnost / confidentiality,
integrity, availability · nadzorno tijelo / supervisory authority · ispitanik / data subject · voditelj obrade /
controller · izvršitelj obrade / processor · interna evidencija povreda / internal breach register · rizik za prava i
slobode pojedinaca / risk to the rights and freedoms of natural persons · visok rizik / high risk · bez nepotrebnog
odgađanja / without undue delay · ucjenjivački program / ransomware · šifriranje / encryption.

## Misconceptions targeted

- "Only a leak is a breach": the restore (availability and integrity) is a breach and is recorded (preset 6).
- "Every breach must be reported to the authority": presets 1 and 6 are recorded only; the register keeps the reasons.
- "Encrypted means safe": only with the key safe (preset 2, the password in the bag).
- "We restored from backup, so nothing happened": the backup contains availability, not the copy the attackers took
  (preset 5); a sent e-mail cannot be taken back.
- "One person is too few to matter": one person's health data is a high risk (preset 4).

## Out of scope

The deadline mechanics (`cmp-incident-clocks`); a processor's duty to tell the controller (art. 33(2)); the content of
the notification (art. 33(3)) and phased notification (art. 33(4)); the other art. 34(3) exceptions (measures taken
afterwards, a public communication instead of disproportionate effort); the supervisory authority ordering
communication (art. 34(4)); NIS2 reporting of the same incident; national rules; a full severity methodology.

## Sources

- GDPR, Regulation (EU) 2016/679 (EUR-Lex), art. 4(12) (definition of a personal-data breach), art. 9 (special
  categories, health data), art. 33(1) (notify within 72 hours "unless the personal data breach is unlikely to result
  in a risk to the rights and freedoms of natural persons"), art. 33(5) (document any breach: facts, effects, remedial
  action), art. 34(1) (communicate to the data subject when "likely to result in a high risk"), art. 34(2) (clear and
  plain language), art. 34(3)(a) (not required when the data is unintelligible to unauthorised persons, such as by
  encryption). Croatian terms from the official Croatian version: povreda osobnih podataka, nadzorno tijelo,
  ispitanik, voditelj obrade, "bez nepotrebnog odgađanja". *(check: the Croatian wording of art. 33(5) and 34(3)(a)
  was not re-read on EUR-Lex in this session)*
- EDPB, Guidelines 9/2022 on personal data breach notification under GDPR (v2.0, 28 March 2023): the
  confidentiality / integrity / availability categories; a loss of availability is a breach; encrypted data with a
  secure, uncompromised key and a backup makes a lost device unlikely to result in a risk; the factors for assessing
  risk (type, sensitivity and volume of data, ease of identification, severity of consequences, special
  characteristics of individuals, number of individuals). *(check: paragraph numbers)*
- EDPB, Guidelines 01/2021 on examples regarding personal data breach notification: ransomware with and without
  exfiltration, stolen encrypted devices, mis-sent e-mails. *(check: example numbers)*
- Illustrative (the page says so once): the points per kind of data, the +1 for 1000 people, the thresholds 2 and 3,
  the cases, their times and the firm.
- Clock: `sims/cmp-incident-clocks/clocks.js` and its SPEC.md, rules 1-8.
