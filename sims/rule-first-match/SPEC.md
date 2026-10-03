# rule-first-match: First match wins

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w2/rule-first-match.md` (catalogue `net-rule-first-match`, §4.1; overlap §5.1). Class: stepper.
Pilot of kit view **K4: rule table with the matching row**.

**One concept:** a rule list is read top down, the first matching row decides, and what matches nothing meets the
implicit deny.

## Scene (K4)

The rule list as numbered rows (pg_hba.conf: file line; ACL: sequence number), one column per match field and an
action column, then a greyed last row: "(no entry: reject)" for pg_hba.conf, "(implicit deny)" for an ACL. Left of
it, the queue of test requests as cards with their fields; the current card is marked and its number sits in the
pointer column next to the row being tested. Each row carries a mark for the current request: tested, no match (–,
the failing fields struck through); **match** (▶ and the action, thick outline); not evaluated (greyed, hatched).
A row covered by an earlier one is flagged shadowed (⚠). Below: the tally, request → deciding row → outcome.

## State

```
{ scene, kind: 'pg'|'acl', implicit: 'reject'|'deny', mode: 'row'|'request',
  rules: [{ id, label, match: {…}, action, fixed, was }], shadow: [index of the covering row | -1],
  requests: [{ id, n, fields: {…}, dir }], cur, row, marks: ['no'|'match'|null per row],
  test: { row, fields: { key: bool }, match } | null, method: { method, ok, why } | null,
  phase: 'start'|'nomatch'|'match'|'decided', outcome, results: [{ req, row, label, outcome, reason, method }], done }
```

Match fields: pg_hba `type`, `db`, `user`, `addr` (request also has `osUser`, `password`); ACL `proto`, `src`,
`srcPort`, `dst`, `dstPort`. `rules` is a copy of the scene's rows with the fix applied when `fix` is on.

## One step (`row` mode)

Test the current request against one row, every field (so the page can mark each):

- **match, ACL:** the row's action (permit / deny) is the outcome; the request is decided.
- **match, pg_hba:** the row is chosen (`phase: 'match'`); the **next** step checks its method and decides
  (accept / reject).
- **no match:** the next step tests the next row; after the last row the next step applies the implicit rule
  (one step, decided).

After a decided request, the next step starts the next request at the top row. `request` mode: one step runs the
rows of one request until it is decided. The run is done when the last request is decided.

## Rules

1. **Top down.** Rows are tested in file / sequence order (UL ch22 "Postavljanje jedne baze", definicija „pravilo
   prvog pogotka"; Cisco "Configuring IP Access Lists": sequence numbers).
2. **Every field must match.** `all` / `any` match everything; an address matches when it lies in the row's prefix;
   `ip` matches every protocol; a port matches `any` or the same number. pg_hba: `local` vs `host` is the connection
   type; database `all` does **not** match `replication` (PostgreSQL docs "The pg_hba.conf File").
   IPv4 and IPv6 never match each other; an IPv6 row matches only its own address (/128 only in these scenes).
3. **The first match decides;** rows below it are never tested (UL ch22; URM ch18 "Vatrozid").
4. **pg_hba: no fall-through.** If the chosen row's method fails, the connection is rejected; a later row that would
   accept it is never reached (UL ch22 Primjer 3; PostgreSQL docs: "There is no fall-through or backup").
   Methods: `peer` and `ident` accept when the client's OS user name equals the database user name (no user-name map
   in these scenes); `scram-sha-256`
   asks for the password (the requests here know it); `reject` refuses, `trust` accepts.
5. **No match:** pg_hba rejects ("no pg_hba.conf entry"); an ACL drops with the implicit deny at the end (Cisco
   "Configuring IP Access Lists"; URM ch18 „odbij po zadanome", NIST SP 800-41r1 §4).
6. **Stateless:** each packet is judged alone; a reply needs its own rule (URM ch18 Primjer 5).
7. **Tie-break / shadowing.** Two rows that both match: only the upper one counts. A row whose every field is covered
   by the same field of one earlier row is *shadowed*: no request can reach it; it is flagged with the index of the
   first covering row, whatever its action.

## Params

| Key | Type | Values | Default |
|---|---|---|---|
| `scene` | select (resets) | `pg-hba`, `pg-hba-append`, `router-acl`, `stateless-reply`, `permit-any-top` | `pg-hba` |
| `request` | choice | `all`, 1, 2, 3 (every scene has three; a number past the list means all) | `all` |
| `fix` | toggle | apply the scene's fix | off |
| `mode` | choice | `row` (one step = one row), `request` (one step = one request) | `row` |

Default params: 12 steps (`sim.json` `steps: 12`). Longest: 12 (`pg-hba`). Request mode: 3 everywhere.

## Scenes and expected numbers (checked by script and `sim.test.js`)

### `pg-hba`: the six lines (UL ch22)

| # | type | database | user | address | method |
|---|---|---|---|---|---|
| 1 | local | all | all | | peer |
| 2 | host | all | all | 127.0.0.1/32 | ident |
| 3 | host | all | all | ::1/128 | ident |
| 4 | local | replication | all | | peer |
| 5 | host | replication | all | 127.0.0.1/32 | ident |
| 6 | host | replication | all | ::1/128 | ident |

Requests: (1) TCP from 127.0.0.1, user `studentdb`, database `vjezba`, OS user `student` (UL ch22): row 1 –, row 2
▶, ident fails (student ≠ studentdb) → **reject**, password never asked: 3 steps. (2) socket, `postgres` /
`postgres`, OS user `postgres`: row 1 ▶ peer → **accept**: 2 steps. (3) TCP from 192.168.1.20: rows 1–6 –, then
"no entry" → **reject**: 7 steps. Total **12**. Fix (row 2 → `scram-sha-256`, UL ch22): request 1 → accept; 12.

### `pg-hba-append`: the wrong fix (UL ch22 Primjer 3)

The six lines plus row 7 `host all all 127.0.0.1/32 scram-sha-256` at the end: **row 7 shadowed by row 2**.
Requests: (1) as above: row 2 ▶ ident → reject (3 steps); (2) as above (2); (3) TCP from `::1`: rows 1, 2 –, row 3 ▶
ident → reject (4). Total **9**. Fix (row 2 itself → `scram-sha-256`): request 1 → accept; request 3 still rejected
(row 3, the IPv6 line, unchanged: the book also changed only the 127.0.0.1 line); row 7 stays shadowed (now only
redundant); 9.

### `router-acl`: inbound ACL (derived, *check*)

10 `deny tcp any → 192.168.10.5 :22`; 20 `permit tcp any → 192.168.10.5 :443`; 30 `permit tcp 203.0.113.0/24 →
192.168.10.5 :22` (**shadowed by 10**). Requests: 198.51.100.7 → :443: 10 –, 20 ▶ permit (2); 203.0.113.9 → :22:
10 ▶ deny (1); 198.51.100.7 → :80: 10, 20, 30 –, implicit deny (4). Total **7**. Fix: row 30 moved above 10 as
sequence 5: :443: 5, 10 –, 20 ▶ (3); admin's :22: 5 ▶ permit (1); :80: 5, 10, 20 –, implicit (4). Total **8**.

### `stateless-reply` (URM ch18 Primjer 5; rule text derived)

10 `permit tcp 192.168.1.0/24 → any :443`. Requests: client 192.168.1.50:51000 → 203.0.113.10:443: 10 ▶ permit (1);
the reply 203.0.113.10:443 → 192.168.1.50:51000: 10 –, implicit deny (2); an unsolicited packet 203.0.113.66:443 →
192.168.1.50:22: 10 –, implicit deny (2). Total **5**. Fix: add 20 `permit tcp any :443 → 192.168.1.0/24`: the
reply: 10 –, 20 ▶ (2); and the unsolicited packet too: 10 –, 20 ▶ permit (2), which is how wide that rule is. Total
**5**.

### `permit-any-top` (derived)

10 `permit ip any any`; 20 `deny tcp any → any :23`; 30 `deny udp any any`; 40 `deny ip 10.0.0.0/8 → any` (20, 30,
40 **shadowed by 10**). Requests: 198.51.100.7 → :23, 10.1.2.3 → :443, 198.51.100.7 → :443: each 10 ▶ permit (1).
Total **3**. Fix: row 10 moved to the end as 50: :23: 20 ▶ deny (1); 10.1.2.3: 20, 30 –, 40 ▶ deny (3);
198.51.100.7 → :443: 20, 30, 40 –, 50 ▶ permit (4). Total **8**.

## Legend

Tested, no match (–); match (▶, thick outline); not evaluated (greyed, hatched); shadowed (⚠); permit/accept (✓,
`--ok`) / deny/reject (✕, `--danger`); changed (yellow + outline: the row just tested, the row changed by the fix).

## Out of scope

Stateful tracking (`stateful-firewall`), netfilter chains and hooks, PAM control flags, NTFS deny-wins, block-wins
host firewalls, longest-prefix routing; pg_hba options (`hostssl`, groups, `samehost`, user-name maps), reload after
editing; ACLs bound to an interface and direction (one list judges both directions here); matching on TCP flags
(an "established" check would narrow the reply rule of `stateless-reply` and drop its unsolicited request 3).
