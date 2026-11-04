<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-fsmo-roles: spec

One concept: **the single-master jobs, what breaks when a holder is gone, and transfer vs seize.** Stepper, five
presets, one action per step. Task: `docs/tasks/w3/win-fsmo-roles.md`. Numbers marked *(check)* are not confirmed
by a source read in this session; `NOTES.md` lists them.

## Scene

- One forest with one domain, `quillmoor.example`; three DCs `qm-dc01`, `qm-dc02`, `brk-dc03` (estate
  `forest.txt`). Each card: power (on / off), network (connected / cut off), the role badges the DC **itself
  believes** it holds, and its RID pool gauge (left of 500, the range, a prefetched next pool).
- Five role badges, five shapes and letters: Schema master **S** (circle), Domain naming master **N** (square),
  RID master **R** (diamond), PDC emulator **P** (hexagon), Infrastructure master **I** (triangle). S and N are
  forest-wide, R, P and I per domain (Microsoft, "Transfer or seize Operation Master roles", table).
- Operations panel, run on one DC (the "desk", qm-dc02 unless the step says otherwise), in this order:
  log on, create users, change a password, sync time, extend the schema, add a domain, update references to other
  domains. Each row shows ✓ (works), △ (degraded) or ✕ (fails), the role it needs and why, **evaluated live
  against the state of this step** (rule 12). The row of an operation the step ran is highlighted with its result.

## State

```
{ desk, cut: null | dcId,
  dcs: { id: { on, synced, restored, external, ridPool: { from, to, left, next: null | { from, to } },
               copy: { owner: { role: dcId }, ver: { role: n }, at: { role: step }, avail } } },
  pools: [ { dc, from, to, by } ], seized: { role: fromDc }, last }
```

A DC's roles are derived: the roles its own `copy.owner` names it for. `copy` is that DC's replica of the
directory facts the sim needs: who holds each role (with the version of that fact) and the next free RID
(`rIDAvailablePool`, `avail`).

## Rules

1. **Schema master** (one per forest): schema changes only. Holder unreachable → *extend the schema* ✕; nothing else
   is affected. (Microsoft, "FSMO roles"; task.)
2. **Domain naming master** (one per forest): adds and removes domains (and application partitions). Holder
   unreachable → *add a domain* ✕. (Same.)
3. **RID master** (one per domain): hands out RID pools of **500** (Microsoft, "Managing RID Issuance": "a domain
   controller requests RID allocations in blocks of 500 RIDs"). Each new user takes one RID from the DC's pool; when
   the pool is used up the DC moves to its prefetched next pool. After an allocation that leaves **≤ 250** (half
   used) and no next pool, the DC asks the RID master for one *(check: threshold)*, and an empty pool with no next
   pool asks before it fails; a request that failed is not repeated within the same run; the master grants `avail …
   avail+499` and raises `avail` by 500. Master unreachable → the request fails, creation goes on from what is left,
   and only then fails. *Create users* ✓ when all were created, △ when some were, ✕ when none were.
4. **PDC emulator** (one per domain): takes password changes first and has the final word on a wrong password and
   lockout; time source of the domain (forest root PDC: of the forest). Holder unreachable → *change a password* △
   (the change is kept on the desk DC and replicates as usual, but no DC can check a just-changed password against
   the PDC: a logon at a DC that has not received it yet fails, and lockout counts are per DC) and *sync time* △
   (no time source: the clocks drift). PDC reachable but without an external source configured → *sync time* △: it
   runs on its own clock (`win-time-hierarchy` rule 3, event 12). Only qm-dc01 has an external source (estate:
   `w32tm /manualpeerlist` on qm-dc01).
5. **Infrastructure master** (one per domain): updates references to objects in other domains. In a one-domain
   forest there are none, so *update references* is ✓ whatever the holder's state (also not needed when every DC is
   a GC or the Recycle Bin is on: Microsoft, "Transfer or seize", Caution box).
6. **Log on** needs no role: any online DC of the domain authenticates. ✓ while the desk DC is on.
7. **Transfer** (rule 6 of the task): the target asks the holder, which must be on and reachable and synced; the
   owner fact gets version + 1 and replicates. Holder unreachable → refused ("seize instead"), nothing changes.
8. **Seize** (task rule 7): the target writes itself as owner with version + 1 without asking. If the holder is
   reachable, the seize is done as a transfer (a seize first tries a graceful transfer). Seizing the RID master
   raises `avail` by **10,000** so pools the old master gave out but never replicated are not given twice
   (Microsoft, "Transfer or seize": "When you use the Ntdsutil.exe utility … it increases the next Rid pool by
   10,000"; 30,000 by the PowerShell cmdlet). `seized[role] = from`.
9. **Replication** (a simplification): after every action, the online DCs that can reach each other merge their
   copies at once: per role the owner fact with the higher version wins (tie: the later step, then the larger DC
   id), and `avail` takes the maximum. A DC that is off or cut off keeps its copy.
10. **A returning holder waits** (Microsoft, "Transfer or seize": a restarted role holder "waits until it receives
    inbound replication" and "relinquishes its role ownership" when the replicated information names another
    holder). A DC that powers on is `synced: false` and does not act as a holder until rule 9 merges it with at
    least one partner. A DC restored from an image also discards its local RID pool (Microsoft, "Managing RID
    Issuance", event 16654).
11. **Two holders.** A role has two acting holders when two online, synced DCs each name themselves in their own
    copy. That can only happen across a network split (a replication island). For S, N and R it is a conflict
    (each island can write conflicting schema, domains or RID pools); for P and I it is not (Microsoft, "Transfer or
    seize", islands table: PDC "No", infrastructure "No"). Two pools that overlap are **duplicate pools**: the same
    RIDs, so the same SIDs, on two DCs.
12. **Tie-break (rule 8 of the task):** every panel row is evaluated against the state after this step's action and
    replication, in panel order, each on its own copy: one row's evaluation (e.g. a pool request) never changes the
    state or another row. Only the operation the step runs changes the state.

## Params

- `scenario` (hidden; the presets choose it): `quillmoor` default.
- `ridLeft` 0–500, step 10, default 250: RIDs left on qm-dc02 at step 0.
- `usersToCreate` 0–600, step 10, default 300: users each *create users* step tries.

Step 0: pools qm-dc01 3101–3600 (480 left), qm-dc02 3601–4100 (`ridLeft` left), brk-dc03 4101–4600 (400 left), no
next pools; `avail` 4601 in every copy; all DCs on, connected and synced; every role owner fact at version 1.

## Presets (steps)

| id | placement at step 0 | steps | expected |
|---|---|---|---|
| `quillmoor` | all five on qm-dc01 (estate) | qm-dc01 off · log on · change password · create users · extend schema · sync time (6) | ✓ · △ · 250 created, 50 fail (△) · ✕ · △ drift |
| `rid-only` (`usersToCreate` 150) | R on brk-dc03, the rest on qm-dc01 | brk-dc03 off · create · change password · create (4) | 150 ✓ (100 left, request failed) · ✓ · 100 created, 50 fail |
| `transfer` | all on qm-dc01 | transfer P to qm-dc02 · sync time · qm-dc01 off (3) | clean · △ own clock (no external source on qm-dc02) · password ✓, schema ✕ |
| `seize-and-return` | all on qm-dc01 | qm-dc01 off · qm-dc02 cut off · seize R on qm-dc02 · qm-dc01 restored and on · create users on brk-dc03 · network back (6) | avail 14601 on qm-dc02 · two RID masters (qm-dc01 with brk-dc03, qm-dc02 alone) · brk-dc03 gets 4601–5100 from qm-dc01 · qm-dc01 gives R up; pools 10,000 apart, no duplicate |
| `infra-single-domain` | I on brk-dc03, the rest on qm-dc01 | brk-dc03 off · update references (2) | ✓ not needed |

Derived numbers: `quillmoor` step 4: the first new user leaves 249 ≤ 250 → request → RID master off → fails;
249 + 1 = 250 created, 300 − 250 = 50 fail. `rid-only` step 2: 150 created, 250 − 150 = 100 left; step 4: 100
created, 50 fail. `seize-and-return`: seize raises 4601 → 14601 on qm-dc02 only (cut off); qm-dc01 comes back
with its old copy (avail 4601), merges with brk-dc03 (avail 4601, owner R = qm-dc01 v1) → synced, acting; brk-dc03
creating 300 from 400 left crosses 250 at the 150th user → qm-dc01 grants 4601–5100, avail 5101; network back →
R owner: qm-dc02 v2 beats qm-dc01 v1; avail max(14601, 5101) = 14601.
