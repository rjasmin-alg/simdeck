<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-failover: specification

One concept: **load balance vs hot standby, MCLT, partner down; the old 80/20 split scope** (task
`docs/tasks/w3/win-dhcp-failover.md`, catalogue §4.5.4). The student fails DHCP1, declares PARTNER DOWN and watches
the clients renew: who answers, for how long, and from which addresses.

Every rule below carries its source. *(check)* marks a number or rule that could not be confirmed in this session
(no network access); NOTES.md lists them.

## Scene

- **One scope** `10.0.10.10–.209`, 200 addresses (subnet `10.0.10.0/24` as in `win-dhcp-scope-options`), served by
  **DHCP1** and **DHCP2**.
- **Left:** the clock (elapsed time since the clients switch on, the MCLT, and after PARTNER DOWN a ring counting down
  MCLT); the two servers with their **state badge** (● NORMAL, ◐ COMM-INT, ○ PARTNER DOWN, ✕ down, or "on its own" in
  a split scope), a **pool bar** over the 200 addresses (its own free addresses filled; the partner's free addresses
  hatched, locked or open), what it **may hand out**, its **lease database** (own / from the partner, frozen when it is
  down) and the **binding updates not sent**; the **link** between them (solid up, dashed with ✕ down, dotted "not
  partners"); the **clients table**: six named clients PC-01…PC-06 (hash bucket under load balance, address, server,
  lease end, state) and one line each for the other clients and the new clients (counts per server, waiting).
- **Right, kit view K1** (`kit/sequence.js`): lanes Clients, DHCP1, DHCP2. Broadcasts (DISCOVER, the rebinding
  REQUEST) dashed to both servers, unicast renewals solid; ✕ at a server that is down; BNDUPD / BNDACK between the
  servers; notes for failures and states; the MCLT after PARTNER DOWN as a timer on DHCP2's lane; folded moments
  as one "↻ renewals" note.

## State

```
t, mode: loadBalance|hotStandby|splitScope, share (LB %), reserve (HS %), mclt (s), switchover (s, 0 = off),
newClients, tNew (MCLT/2; 30 min in a split scope), ranges: { A: [lo, hi], B: [lo, hi] }, pools: { A: [octets], B: [...] }
servers: [{ id, up, state: normal|commInt|partnerDown|down|solo, since, pdAt, switchAt, takeoverAt, whole, frozen }]
cohorts: [{ key, kind: named|others|new, name?, n, buckets: [0–255], octets, server, granted, len, expires,
            phase: bound|renewing|rebinding|waiting, acked, known: { DHCP1?: { by, expires }, DHCP2?: … } }]
pending: [{ from, key }]   (binding updates owed to the partner)
arrived, seq, anchor (last arrival or action), failedAt (step), msgs (one event per step)
```

A **cohort** is a group of clients with the same lease: each named client alone, the unnamed ones by batch, server and
timers. Pool A belongs to DHCP1, pool B to DHCP2.

## Steps

One step is **everything at the next moment**, in phases: (1) state changes (automatic PARTNER DOWN, MCLT passed
after PARTNER DOWN); (2) client messages and their answers; (3) **binding updates**, drawn as a step of their own
at the same clock time, right after the moment they belong to, when the partner is reachable. An **admin action**
(fail DHCP1, declare PARTNER DOWN) is a step of its own, in the step after the one it was pressed at.

Moments, in time order: the clients switch on (0:00), the new clients arrive (tNew), each cohort's next timer (T1
while bound, T2 after a lost renewal, the lease end after a lost rebind), and the state changes still to come.

## Rules

1. **One relationship, one database.** Both servers hold the whole lease database; each lease a server gives or
   renews is sent to the partner as a binding update (BNDUPD) and acknowledged (BNDACK). While the partner is
   unreachable the updates wait (counted as "not sent"). A server that is down keeps the database it had.
   Source: Microsoft, "DHCP failover overview" *(check)*; draft-ietf-dhc-failover-12 §§ 5, 7.
2. **Load balance.** Each client's MAC hashes to a bucket 0–255 (RFC 3074); DHCP1 owns the buckets below
   round(256 × share %), DHCP2 the rest. In NORMAL only the bucket's owner answers a DISCOVER. The free addresses are
   split in the same ratio: DHCP1 gets the first round(200 × share %) of the range. Both servers renew their own
   clients (T1, unicast). The buckets here are illustrative values, not RFC 3074's table (PC-01 23, PC-02 201, PC-03 77,
   PC-04 164, PC-05 112, PC-06 239; a batch of n clients spread evenly, ⌊(i + ½) · 256 / n⌋), so 50/50 gives PC-01,
   03, 05 to DHCP1. Sources: RFC 3074 §§ 4, 6; Microsoft, "Add-DhcpServerv4Failover" `-LoadBalancePercent` *(check)*.
3. **Hot standby.** DHCP1 is active and answers every client in NORMAL; DHCP2 is the standby and keeps a **reserve
   of round(200 × reserve %)** of the free addresses (5 % → 10, the last ten, `.200–.209`), and answers only when the
   active is unreachable. Whether the reserve is a share of the free addresses or of all addresses: the PowerShell help
   says free *(check)*; here the scope is empty when the relationship is set up, so both read 10.
   Source: Microsoft, "DHCP failover overview", `-ReservePercent` (default 5 %) *(check)*.
4. **MCLT** (maximum client lead time, default 1 h): a server may give or extend a lease only up to MCLT beyond what
   its partner knows. Here: a **new lease lasts MCLT** (the partner knows nothing yet); a **renewal in NORMAL of a lease
   the partner has acknowledged gets the scope's full lease** (8 days); every lease given while the partner is
   unreachable lasts MCLT. Simplification of the draft's rule (expiry ≤ the partner's acknowledged potential
   expiration + MCLT), as Microsoft documents it *(check)*. Sources: draft-ietf-dhc-failover-12 § 5.2; Microsoft,
   "DHCP failover overview" *(check)*.
5. **COMMUNICATION INTERRUPTED.** When DHCP1 fails, DHCP2 loses contact and enters COMMUNICATION INTERRUPTED (at once
   here; *(check)* the detection delay). It cannot tell a dead partner from a broken link, so it answers **every**
   client (renewals, rebinding broadcasts, DISCOVERs), renews for **MCLT only**, and gives new addresses **from its own
   pool only** (load balance: its share; hot standby: the reserve). Source: draft-ietf-dhc-failover-12 § 9.6;
   Microsoft *(check)*.
6. **PARTNER DOWN** is entered by the admin (button) or automatically after the **state switchover interval** (off by
   default; 60 min when on *(check)*). The survivor may use the partner's free addresses only after **MCLT has passed
   since entering PARTNER DOWN**; leases stay MCLT long. Sources: draft § 9.7 *(check)*; Microsoft,
   `-StateSwitchInterval` *(check)*.
7. **No usable address, no offer.** When the pools a server may use are empty, the client gets no offer and waits.
   A waiting client keeps sending DISCOVER every few minutes; the model shows one retry in each later step that is not
   only binding updates or an action (the ones in between change nothing). RFC 2131 § 4.1 (retransmission) *(check
   the interval)*.
8. **Split scope (80/20).** Two independent servers on one subnet, ranges made non-overlapping by exclusions: DHCP1
   `.10–.169` (160), DHCP2 `.170–.209` (40). No relationship, no shared database, no MCLT; every lease is the scope's 8
   days. DHCP2 delays its offer (the split-scope wizard's offer delay *(check)*), so DHCP1 answers every DISCOVER while
   it is up. A client of DHCP1 renews at T1 by unicast to DHCP1 (lost if down); at T2 its broadcast reaches DHCP2,
   which has **no record of it and stays silent** (RFC 2131 § 4.3.2 for a client it has no binding for; whether a
   Windows server NAKs instead *(check)*); at the lease end the client starts again with DISCOVER and DHCP2 offers from
   its 40. A down server's scope stays as it was (its expired addresses do not return to its pool). Source:
   Microsoft, "DHCP Best Practices" (80/20 rule) *(check)*.
9. **Tie-break, rebinding with both servers up:** the bucket's owner (load balance) or the active server (hot standby)
   answers. Source: RFC 3074 § 6, draft § 5.3 *(check)*.
10. **Timers:** T1 = ½ of the lease, T2 = ⅞ (RFC 2131 § 4.4.5); the scope's lease 8 days (Windows Server default
    *(check)*, as in `win-dhcp-scope-options`).

## Tie-breaks

- **T1, order within a moment:** state changes, then T1 renewals (DHCP1's clients, then DHCP2's), T2 rebinds,
  retries of waiting clients, DISCOVERs of expired leases, arrivals. In a batch the named clients come first (by name),
  then the others; a server takes its own pool first, then (after PARTNER DOWN + MCLT) the partner's, lowest
  address first.
- **T2:** the binding updates of a moment go before an admin action pressed at that moment (pressing "fail" at the
  0:00 step fails DHCP1 after its updates; DHCP2 knows all leases).
- **T3, actions:** fail DHCP1 lands in the step after step `failAt`; PARTNER DOWN in the step after `pdAt`, but only
  after the failure's own step (pressed together: one step later) and only from COMMUNICATION INTERRUPTED (so never in
  a split scope or without a failure). An action lands **5 min after the moment it was pressed at**, or at the next
  moment if that comes sooner (and then before that moment's events).
- **T4, folding:** a **routine moment** (only renewals by the server that gave the lease, for the same length as
  before, plus retries that again get no offer) is not a step: it is folded into the next step, which lists the
  folded times ("↻ renewals ×3 · 1 h"); routine moments at the end are dropped.
- **T5, horizon:** client timers are followed until the **anchor + MCLT** (split scope: + 8 days), where the anchor is
  the last arrival, failure or PARTNER DOWN; and always up to a state change still to come (the moments in between
  are routine and fold).
- **T6:** at most 20 steps (in the test sweep of 2430 combinations the longest run has 11: DHCP1 failed after the last moment, its clients followed to T2 days later).

## Params and presets

`mode` load balance / hot standby / 80/20 (default load balance); `share` 10–90 % (LB, default 50); `reserve` 1–20 %
(HS, default 5); `mclt` 15 min / 1 h / 4 h (default 1 h); `switchover` by hand / after 60 min (default by hand);
`newClients` 0–60 (default 6, they arrive at MCLT/2); buttons **Fail DHCP1** (`D`) and **Declare PARTNER DOWN**
(`P`), which set the hidden `failAt` / `pdAt` to the current step.

| Preset | Params | Steps | Expected (checked by the tests) |
|---|---|---|---|
| `lb-normal` | defaults | 6 | 0:00: 100 clients, 50/50 by hash (PC-01, 03, 05 → DHCP1 `.10–.12`; PC-02, 04, 06 → DHCP2 `.110–.112`), leases 1 h; binding updates: both databases 100. 0:30: the 100 renew for 8 d; 6 new: 3/3, 1 h; updates. 1:00: the 6 renew for 8 d; updates. End: 53 + 53 leases, 47 free each. |
| `lb-interrupted` | failAt 2 | 5 | DHCP1 fails at 0:05 → DHCP2 COMM-INT. 0:30: DHCP1's 50 renew at DHCP1, lost; DHCP2's 50 renewed for 1 h; 6 new all from DHCP2's share (50 → 44). 0:52:30: T2, DHCP1's 50 rebind; DHCP2 renews them for 1 h (MCLT). |
| `lb-partner-down` | failAt 2, pdAt 4, newClients 60 | 7 | As above to 0:30, but 60 new: 50 from DHCP2's share, 10 get none. 0:35: PARTNER DOWN (admin), MCLT until 1:35. 0:52:30: rebind (1 h), the 10 retry, none. 1:35 (renewals at 1:00, 1:22:30, 1:30 folded): DHCP2 may use the whole pool; the 10 get `.60–.69` from DHCP1's share. |
| `hs-reserve-runs-out` | hotStandby, failAt 2, newClients 12 | 5 | 0:00: DHCP1 gives all 100 (1 h); the reserve is 10. Fail at 0:05. 0:30: the 100 renew at DHCP1, lost; 12 new: 10 from the reserve, 2 none (the active's 90 are locked until PARTNER DOWN + MCLT). 0:52:30: rebind, DHCP2 renews the 100 for 1 h; the 2 retry, none. |
| `split-80-20` | splitScope, failAt 1, newClients 0 | 5 | 0:00: 60 clients (6 named + 54), DHCP1 answers, 8 d. DHCP1 fails at 0:05. 4 d: T1 lost. 7 d: T2, DHCP2 silent. 8 d: leases end; DISCOVER: 40 get `.170–.209` from DHCP2, 20 none. |

The task's step counts (6, 9, 6, 9, 8) and its preset numbers were "derived, unchecked"; the counts above follow from
one step per moment with folding, and NOTES.md lists where the numbers differ from the task.

## Captions (task, used with the model's numbers)

- At the rebind in COMM-INT (lb-interrupted step 5): hr "… DHCP1 ne odgovara. DHCP2 ne zna je li partner mrtav ili je
  pukla veza, pa obnavlja tuđe zakupe samo na MCLT — 1 h." / en "… DHCP1 doesn't answer. DHCP2 can't tell a dead
  partner from a broken link, so it renews the partner's leases for MCLT only: 1 h."
- At the takeover (lb-partner-down step 7): hr "*Partner down* proglašen je u 0:35; nakon MCLT-a, u 1:35, DHCP2 smije
  dijeliti i adrese iz partnerova dijela." / en "Partner down was declared at 0:35; after MCLT, at 1:35, DHCP2 may also
  hand out addresses from the partner's share."
