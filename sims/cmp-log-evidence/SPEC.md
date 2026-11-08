<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-log-evidence: specification

Task `docs/tasks/w3/cmp-log-evidence.md`, catalogue `cmp-log-evidence` (§4.13; seed: `lnx-log-path`, `win-ipam-audit`
(correlating logs), `ntp-sync`; evidence on top of the trail model, §5.24). Class **stepper**, 7 steps. The state at
step *n* is a pure function of *n* and the params (`sim.js`); the log-evidence rules are `logs.js` (pure, wordless,
promotable to `models/`).

**One concept:** logs answer "who did what, when" only if they are complete (the action is recorded at all), their
clocks agree, they are out of reach of the administrators they record (sent off the host at once, append-only) and
kept long enough to cover how late incidents are found; a log holding personal data needs its own retention and access
rules.

**The contrast on the stage:** the same night replayed with the logs on the hosts against a central append-only store
(what survives the cover-up), with clocks in sync against one clock running slow (the order the timestamps give), and
with retention shorter or longer than the time to discovery (what is still held on the day the incident is found).
The five questions of the investigation are answered or not at the end.

## Stage

1. **Four cards:** VPN gateway, identity server, file server (each with a badge, "adm07 is / is not an admin here",
   its clock) and the central log store ("append-only, off the hosts", or hatched and dashed: "none: logs stay on the
   hosts"). Host cards list their local records (time, text); the store lists the copies (time, host badge, short
   action) and the wipe records. Record states: held (solid, thick left edge), deleted (red hatch, struck through, ✗),
   aged out (dashed, muted, struck through, ⌛), not logged (dashed, italic), "log begins at hh:mm" after a wipe
   (dashed, italic). What changes in the step is outlined in ink; held, "not logged" and "log begins" rows are also highlighted.
2. **Retention strip** (from the found step): a day axis from day 0 to max(found, keep) × 1.04; the window
   [max(0, found − keep), found] tinted (series 2) and outlined; a red mark and "▲ the night, day 0" at the left, an
   ink mark and "● found, day F" at the found day; the label column gives the retention and "still held: day a–b".
3. **Order strip** (from the timeline step): the available action records as chips sorted by timestamp, each with
   its true position (① ② ③), time, host badge and action; "→" between chips, "= same minute" on a tie; the copy chip
   hatched red when it is out of order; "too few records" with fewer than two.
4. **Questions table:** who / what / which data / order / evidence deleted, and a last row for the log itself
   (personal data: retention and who reads it). "?" until the last step, then ✓ yes, ~ partly, ✗ no (or ✓ in order,
   ✗ open), each with what the logs say.
5. A foot: simplified, not legal advice, made-up firm, accounts, addresses and numbers.

## Fixed data (illustrative)

- **The firm:** a small firm, unnamed. Hosts: VPN gateway (`gw`), identity server (`idm`), file server (`fs`).
  The account adm07 is an admin on `idm` and `fs`, not on `gw`.
- **The night** (minutes from day 0, 00:00): 23:10 adm07 logs in through the gateway from 203.0.113.45 (an address
  from the documentation range, RFC 5737); 23:14 it makes a new account, svc-bkp2, an admin (identity server); 23:20 it
  copies the Customers folder, 4,812 files of customers' personal data (file server; recorded only if file reads are
  logged); 23:31 it deletes the local logs on `idm` and `fs`.
- **The investigation** starts at 10:00 on the found day (customers report fake messages in the firm's name).
- Only the file server's clock can drift (slow); the store keeps each host's own timestamp; a copy reaches the store
  in the same minute.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `store` | choice | `local`, `central` (`local`) | logs only on the hosts, or also copied at once to a central append-only store |
| `drift` | range | 0–30 min (0) | how many minutes the file server's clock runs slow |
| `keep` | choice | 30, 90, 180, 365 days (180) | retention, the same on the hosts and in the store |
| `found` | range | 1–365 days (45) | days from the night to the day the incident is found |
| `fileReads` | toggle | (on) | file reads on the file server are logged |
| `readers` | choice | `admins`, `named` (`admins`) | who may read the central store; shown only with a central store |

## Rules

### The log-evidence model (`logs.js`, promotable)

1. **Stamps.** A host writes true time minus its clock's lag (`drift[host]`, minutes; a missing or non-number lag is
   0).
2. **Copies.** An action has no copy before its time. An action that needs a log source (`needs`) which is off is
   `unlogged` (one local entry, no central copy). Otherwise it has a local copy on its host and, with a central store,
   a central copy. **The wipe** deletes the local copies on the wiped hosts from the wipe's minute on; **tie-break:** a
   record written in the wipe's own minute goes with it. Central copies are never deleted by the wipe.
3. **Retention.** A copy written at true time *a* has aged out at time *now* when day(*now*) − day(*a*) > `keep`
   (whole days; the stamp does not matter). **Tie-break:** exactly `keep` days later it is still held.
4. **Status and the best copy.** Statuses from shortest- to longest-lived: unlogged < wiped < aged < kept. A copy's
   status is its earliest cause (**tie-break:** deleted before aged, never logged before both). A question about an
   action takes the best (longest-lived) copy: so a deleted local copy with a central copy that later aged out reads
   "aged out".
5. **Wipe records.** With a central store, from the wipe on, one record per wiped host, at the wipe's time, stamped
   by that host's clock; they age like any record.
6. **Order.** The actions whose best copy is kept, sorted by stamp (**tie-break** for display: the scenario's host
   order, then the true order). Fewer than two: **no** (gaps). Any two equal stamps: **no** (tie; which came first is
   unknown). A later action stamped before an earlier one: **no** (wrong). Some action missing: **partly** (gaps;
   **tie-break:** gaps before drift). All present but a stamp differs from true time: **partly** (drift; right by luck,
   unprovable). All present, all stamps true: **yes**.
7. **Evidence of the wipe.** Before the wipe: none. Aged out (rule 3 on the wipe's time): **no**. Central store:
   **yes** (the store has the wipe records and the copies). No store: **partly** (the logs on the wiped hosts visibly
   begin at the wipe; what and who are unknown).
8. **Who reads the log.** No store: `host` (every admin of a host reads and deletes it). Central: `admins` or `named`.
   Only `named` is in order.

### The sim (`sim.js`)

9. **Params (normalise).** `store` and `readers` not one of their values take the default. `drift` and `found`:
   non-numbers (`null`, `''`, `true`, `NaN`, `Infinity`) take the default, numbers are rounded and clamped. `keep` not one
   of 30, 90, 180, 365 (as a number or a numeric string) takes the default. The toggle accepts booleans,
   `'true'`/`'false'`, `'1'`/`'0'`, 1/0. Key order as in the defaults.
10. **Steps (7).** Stages: 0 start (now −1), 1 login (23:10), 2 change (23:14), 3 copy (23:20), 4 cover-up (23:31), 5
    found (day F, 10:00), 6 timeline (same now), 7 answers (same now). A step outside 0…7 is clamped, a fractional one
    rounded. The cards show the copies at now; the strips and the answers use the found day at every step.
11. **Questions.** who ← login, what ← change, data ← copy: **yes** when the best copy is kept, else **no** with its
    status as the reason; order (rule 6); tamper (rule 7). `yes` and `partly` count them; the access rule (rule 8) is
    not counted.
12. **Caption.** Start (+ local or central); login (+ the record stays, or a copy goes to the store); change; copy
    (unlogged; or + the stamp when the clock is slow); cover-up (local or central); found (+ still held, or aged out on
    day `keep` + 1); timeline (yes; partly gaps; partly drift "lucky"; no tie with the action on the same minute; no
    wrong with the action it seems to precede; too few); answers (all 5; none, when neither yes nor partly; some, with
    a partly count when there is one) + the access sentence (host, every admin, named).

## Presets and expected outcomes

| # | id | store | drift | keep / found | file reads | readers | who | what | data | order | tamper | log itself |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `local` (= defaults) | local | 0 | 180 / 45 | on | – | ✓ | ✗ deleted | ✗ deleted | ✗ too few | ~ gap | ✗ host admins |
| 2 | `central` | central | 0 | 180 / 45 | on | named | ✓ | ✓ | ✓ | ✓ 23:10, 23:14, 23:20 | ✓ | ✓ |
| 3 | `drift` (entry) | central | 12 | 180 / 45 | on | named | ✓ | ✓ | ✓ | ✗ wrong: copy 23:08 before login 23:10 | ✓ | ✓ |
| 4 | `short-keep` | central | 0 | 30 / 45 | on | named | ✗ aged | ✗ aged | ✗ aged | ✗ none | ✗ aged | ✓ |
| 5 | `not-logged` | central | 0 | 180 / 45 | off | named | ✓ | ✓ | ✗ not logged | ~ 2 of 3 | ✓ | ✓ |
| 6 | `open-store` | central | 0 | 180 / 45 | on | admins | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ every admin |

Contrasts the presets carry: 1 vs 2 out of reach (the gateway's record survives in 1 because adm07 is no admin there);
2 vs 3 the clocks; 4 vs 2 retention against discovery (90 or 180 days answer everything); 5 completeness and the
breach notification's scope; 6 the log as personal data. Drift sweep (central, all logged, found within retention):
0 yes; 1–5 partly (right by luck); 6 tie with the change (23:14); 7–9 wrong (the copy before the change); 10 tie with
the login (23:10); 11–30 wrong (the copy before the login).

Independent check (run 2026-11-07; a separate re-implementation in Python):

```python
ACTS = [('login', 'gw', 23*60+10), ('change', 'idm', 23*60+14), ('export', 'fs', 23*60+20)]
WIPE, WIPED = 23*60+31, ('idm', 'fs')
RANK = {'unlogged': 0, 'wiped': 1, 'aged': 2, 'kept': 3}
def hm(m): return '%02d:%02d' % divmod(m % 1440, 60)
def run(store, drift, keep, found, audit, readers):
    aged = found > keep
    best = {}
    for a, host, t in ACTS:
        if a == 'export' and not audit: best[a] = 'unlogged'; continue
        local = 'wiped' if host in WIPED else ('aged' if aged else 'kept')
        central = ('aged' if aged else 'kept') if store == 'central' else None
        best[a] = max([local] + ([central] if central else []), key=RANK.get)
    q = {'who': best['login'], 'what': best['change'], 'data': best['export']}
    avail = [(t - (drift if h == 'fs' else 0), i, a) for i, (a, h, t) in enumerate(ACTS) if best[a] == 'kept']
    rec = sorted(avail)
    ties = len({r[0] for r in rec}) < len(rec)
    wrong = ties or [r[1] for r in rec] != sorted(r[1] for r in rec)
    if len(avail) < 2: order = 'no(gaps)'
    elif wrong: order = 'no(%s)' % ('tie' if ties else 'wrong')
    elif len(avail) == 3 and drift == 0: order = 'yes'
    elif len(avail) < 3: order = 'partly(gaps)'
    else: order = 'partly(drift)'
    if store == 'central': tamper = 'no(aged)' if aged else 'yes'
    else: tamper = 'no(aged)' if aged else 'partly(gap)'
    access = 'ok' if store == 'central' and readers == 'named' else 'open'
    shown = ' '.join('%s@%s' % (a, hm(t)) for t, i, a in rec)
    return q, order, tamper, access, shown
```

Output (matches the table and the tests):

```
local | {'who': 'kept', 'what': 'wiped', 'data': 'wiped'} no(gaps) partly(gap) open login@23:10
central | {'who': 'kept', 'what': 'kept', 'data': 'kept'} yes yes ok login@23:10 change@23:14 export@23:20
drift | {'who': 'kept', 'what': 'kept', 'data': 'kept'} no(wrong) yes ok export@23:08 login@23:10 change@23:14
short-keep | {'who': 'aged', 'what': 'aged', 'data': 'aged'} no(gaps) no(aged) ok
not-logged | {'who': 'kept', 'what': 'kept', 'data': 'unlogged'} partly(gaps) yes ok login@23:10 change@23:14
open-store | {'who': 'kept', 'what': 'kept', 'data': 'kept'} yes yes open login@23:10 change@23:14 export@23:20
short-keep at 180 | {'who': 'kept', 'what': 'kept', 'data': 'kept'} yes yes ok login@23:10 change@23:14 export@23:20
local found 200 | {'who': 'aged', 'what': 'wiped', 'data': 'wiped'} no(gaps) no(aged) open
```

## Legend

record held (solid, thick left edge) · deleted (red hatch) · aged out (dashed) · retention window (series 2 tint).
Shapes and words carry the rest: ✗ and ⌛ on rows (with the word as a tooltip), struck-through text, the answer
symbols ✓ ~ ✗ with words, ▲ ● on the retention strip, ①②③ on the order chips, "= same minute".

## Terms (hr / en)

zapisnik / log · zapis / log record · vremenska oznaka / timestamp · središnja pohrana zapisa / central log store ·
samo dodavanje / append-only · razdoblje čuvanja / retention period · isteklo / aged out · usklađivanje satova / clock
synchronisation · istraga / investigation · povreda osobnih podataka / personal-data breach · ispitanik / data subject ·
smanjenje količine podataka / data minimisation · ograničenje pohrane / storage limitation.

## Misconceptions targeted

- "We have logs, so we can prove it": preset 1, the admin deletes the only copies.
- "Central logging is enough": preset 3 (the clocks), preset 4 (retention), preset 5 (completeness).
- "The order looked right, so it was right": drift 1–5, "partly": unprovable without synchronised clocks.
- "Deleting the logs leaves no trace": in the store, the deletion itself is a record (preset 2's tamper answer).
- "Keep logs forever, just in case" / "logs are not personal data": the last row, preset 6, and the explanation.

## Out of scope

Forwarding delay and loss (a copy might not leave before the wipe); the store's own receive timestamp; log integrity
by signatures or hash chains; noisy logs and finding the needle (`win-ipam-audit` correlates logs); log rotation by
size; the identity of whoever was behind adm07 (a stolen credential or the admin; `cmp-privileged-access`); the breach
notification itself (`cmp-incident-clocks`); more than one drifting host or a fast clock; national retention rules.

## Sources

- ISO/IEC 27001:2022, Annex A controls 8.15 (logging), 8.16 (monitoring activities), 8.17 (clock synchronization);
  clause numbers only, the text is not quoted.
- GDPR, Regulation (EU) 2016/679 (EUR-Lex): art. 5(1)(c) data minimisation and (e) storage limitation; art. 32
  security of processing; art. 33(3)(a) the notification describes the categories and approximate number of data
  subjects and records concerned (why "which data was copied" matters). Croatian terms from the official Croatian
  version: smanjenje količine podataka, ograničenje pohrane, ispitanik. *(check: the Croatian wording of art. 5(1)(c),
  (e) was not read on EUR-Lex directly)*
- NIS2, Directive (EU) 2022/2555, art. 21 (cybersecurity risk-management measures, incident handling, art. 21(2)(b));
  the implementing regulation for some digital-infrastructure entities, Implementing Regulation (EU) 2024/2690, has a
  section on logging *(check: section number and whether it names clock synchronisation and retention)*. Croatian
  law: Zakon o kibernetičkoj sigurnosti (NN 14/2024), named only (owner confirmed 2026-11-08); which article or
  regulation sets logging measures: open, not stated by the owner.
- Address 203.0.113.45: RFC 5737 documentation range.
- Seed sims: `lnx-log-path` (where a log record goes on one host), `win-ipam-audit` (correlating logs), `ntp-sync`
  (clock synchronisation); no answer from the DR instructor material is used.
