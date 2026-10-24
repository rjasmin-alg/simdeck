<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# db-replication: specification

Task `docs/tasks/w2/db-replication.md`, catalogue `ha-db-replication` (§4.7, overlap §5.7: `sto-sync-async-replication`
becomes a preset of this page later). One concept: **asynchronous replicas lag; failover loses the acknowledged tail;
reading your own writes needs a server that has your LSN**. Synchronous commit, multi-master, consensus, logical
replication and named products are out of scope.

## Scene

- A **client**, a **primary** `P` and one or two **replicas** `R1`, `R2` (kit view K2).
- Every server keeps a **write-ahead log**: records LSN 1, 2, 3, … Every record sets the one key `x` to its LSN
  (`x = k` after record k; `x = 0` before any record). Kit view K3 draws one strip of records per server.
- A replica's **lag** `lagMs` is the time from the primary acknowledging a record to the replica having applied it
  (shipping plus replay, one number).

## Params

| Param | Values | Default |
|---|---|---|
| `replicas` | 1 / 2 | 1 |
| `lag1`, `lag2` | 0–1000 ms (step 50) for R1, R2 (`lag2` only with 2 replicas) | 250, 600 |
| `read` | the client reads `x` back after its fifth write (on / off) | off |
| `readFrom` | `primary` / `replica` (= R1) | `replica` |
| `rywWait` | "wait for my LSN" (only when reading from the replica) | off |
| `failAt` | `0` (none) / `600` / `1000` ms (not with `read`) | 0 |
| `prefer` | the failover priority on a tie: `none` / `R1` / `R2` (only with 2 replicas; the page shows it only when the two replicas have the same LSN at the failure) | `none` |
| `oldBack` | the old primary comes back after the failover (only with `failAt`) | off |

`read` and `failAt` are two scenarios: with `read` on, `failAt` is ignored (the model's `eff`). The task's `failAt`
"none" is `0`.

## Rules

Source for all: NLA T55 (`meta/toc.md`, „Replikacija baze", chapter not written); M. Kleppmann, *Designing
Data-Intensive Applications*, ch. 5 "Replication" (leaders and followers, asynchronous replication, replication lag,
reading your own writes, failover) *(check: from memory, no local copy)*; PostgreSQL documentation "High
Availability, Load Balancing, and Replication" (streaming replication is asynchronous by default) *(check: from
memory)*.

1. **Asynchronous commit.** The primary acknowledges a write as soon as its own log has it (in the same tick).
   A replica applies the same records **in LSN order**; record k is applied once `at_k + lagMs ≤ t`.
2. **A replica is the primary at an older LSN.** Its `x` is the value after its applied LSN, so a read from it can
   return an older value: a **stale read**.
3. **Read-your-writes.** The client's own last write is LSN n. A read sees it only on a server with `applied ≥ n`: the
   primary, or a replica that has caught up. With `rywWait` the replica holds the read until it has applied n and
   answers at the moment it does (`at_n + lagMs`, never before the read was asked).
4. **Failover** promotes the reachable replica with the **highest applied LSN**.
5. **Lost tail.** Acknowledged records above the promoted replica's LSN are lost, although the client was told
   "committed": `lost = promoted LSN + 1 … primary LSN`, `primary LSN − promoted LSN` records.
6. **Other replicas follow the new primary**: one behind it receives the records it lacks; one **ahead** of it (it
   holds records the new primary lacks) is **rewound** (those records discarded), never re-attached as it is *(check:
   the textbook says "rewound or rebuilt"; the model rewinds)*. With rule 4 among reachable replicas the promoted one
   always has the highest LSN, so no run reaches the rewind: `followPlan` implements it and is tested directly; the
   returning old primary (rule 7) is the case the page shows.
7. **The old primary returning** must not accept writes or rejoin as it is: its records above the new primary's LSN
   conflict with the new history (the next write on the new primary takes the same LSN). It is **refused**, then
   **rebuilt** from the new primary: the extra records are discarded and it follows as a replica (links:
   `quorum-split-brain`, `fencing`). Without extra records (lag 0) it is not refused and simply attaches.

### Tie-breaks and order

- **T1** (rule 4): equal applied LSN → the replica named by `prefer`, then the **lower id** (`R1` before `R2`)
  *(derived)*.
- **T2** (order within a tick): (1) the write, (2) the replicas apply, (3) the read is asked or a waiting read is
  answered. So a record written in this tick with lag 0 is on the replica before this tick's read.
- **T3**: records still in flight when the primary fails never arrive (the lag includes shipping); the replicas
  stop at their applied LSN at `failAt`.
- **T4**: a replica's applied LSN only grows while it follows a primary; rewinding (rules 6, 7) is the only way down.

## Steps

One clock tick per step (100 ms) while the clock runs; the failover events are steps without time.

- No read, no failure: **10** ticks (writes 1–10).
- Read: writes 1–5 at 100–500 ms, the read at 600 ms, no writes after it. Ticks: **8**, or more from the replica
  until record 5 is applied there: `max(8, ⌈(500 + lag1) / 100⌉)` (rounded up, so the answer is always on screen: 15 at lag 950 and 1000).
- Failure at F: `F / 100` ticks, then **fail**, **promote**, **follow** (2 replicas), **return** and **rebuild**
  (`oldBack`). At most 10 + 5 = 15 steps.

## Presets (expected numbers, checked by script and in `sim.test.js`)

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `steady-lag` | defaults | 10 | at 1000 ms P has LSN 10, R1 **LSN 7** (k × 100 + 250 ≤ 1000); behind by 3 |
| `read-own-write` | `read` | 8 | at 600 ms R1 has LSN 3: the read returns `x = 3`, **stale** (own write 5). With `rywWait`: asked at 600, answered at **750** with `x = 5` (shown at step 8, 800 ms) |
| `failover-tail` | `failAt 1000` | 12 | R1 promoted with LSN 7; **8, 9, 10 lost** although acknowledged (≈ 250 ms of writes) |
| `two-replicas` | `replicas 2`, `failAt 1000` | 13 | R1 (LSN 7) beats R2 (LSN 4: k × 100 + 600 ≤ 1000); R2 follows R1 and receives **5–7** |
| `old-primary-returns` | `failAt 1000`, `oldBack` | 14 | the old primary returns with LSN 10 > 7: **refused**; rebuilt: 8–10 discarded, replica of R1 at LSN 7 |

Other numbers: read from the primary → `x = 5`, fresh, at 600 ms. Fail at 600 with lag 250 → R1 LSN 3, lost 4–6.
Two replicas with equal lag 250 fail at 1000 → tie at 7 → R1 (lower id), or R2 with `prefer R2`. `lag1 = 600`,
`lag2 = 250`, `prefer R1` → R2 promoted (LSN 7 beats 4; priority only breaks ties). Lag 0 → nothing lost, the old
primary is not refused. Lag 1000, read with `rywWait` → answered at 1500 ms, 15 steps.

## State

`{ t, phase, ids, writes: [{ lsn, at, key, value, acked, lost? }], servers: { P|R1|R2: { id, up, applied, role,
lagMs, follows, extra, discarded } }, reads: [{ at, from, key, own, wait, got, gotLsn, fresh, servedAt }], primary,
failedAt, promoted, lost: [lsn], refused, changed: { applied: { id: [lsn] }, wrote?, asked?, served?, roles: [id],
received: { id: [lsn] }, discarded: { id: [lsn] } } }`. JSON-safe; time in integer ms. `role` is `primary`,
`replica`, `old` (failed, replaced) or `returned` (back after the failover; refused when `refused`, i.e. it has extra records). `phase` is `start`, `tick`, `fail`, `promote`,
`follow`, `return` or `rebuild`. The task's `failedAt`, `promoted`, `lost` are kept; `lagMs` sits on each server.

## Legend

Log record (numbered square, K3 cell); applied (solid fill); not yet applied, in flight (dashed outline, K3 `ghost`;
moving chip on the link in K2); acknowledged to the client (✓ chip); lost (K3 `bad`: red frame, ✕, "izgubljeno");
discarded on rebuild (K3 `dead`: crossed); stale read (hatched answer bubble); changed (the kit's mark: records
applied, the read asked or answered, roles changed in this step).
