<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cap-under-partition: specification

Task `docs/tasks/w3/cap-under-partition.md`, catalogue `ha-cap` (§4.7). One concept: **a partitioned system picks
consistency or availability**. The student partitions the network and sends reads and writes in CP and AP mode.
PACELC, consensus (`raft`), linearizability in depth and tunable consistency beyond R/W counts are out of scope.

## Scene

- Three **replicas** `A`, `B`, `C` of one key `x` (`x = 1` everywhere at the start).
- Two **clients**: `K1` near A and B (it sends every request to **A**), `K2` near C (it sends every request to **C**).
  The replica a client sends to is the request's **coordinator**.
- The **partition** separates `{A, B}` (with K1) from `{C}` (with K2): `partition = [['A','B'], ['C']]`. A client
  always reaches its own coordinator; the partition cuts only the links between replicas on different sides.
- A **mode** `cp` / `ap` for the whole system.

## Params

| Param | Values | Default |
|---|---|---|
| `mode` | `cp` / `ap` | `cp` |
| `ops` | the run: up to 19 actions joined by `.`: `p` partition, `h` heal, `w1` K1 writes, `r1` K1 reads, `w2` K2 writes, `r2` K2 reads; requests in one step joined by `+` (`w1+r2`) | `w1.r2` (preset `no-partition`) |

The page's buttons ("K1 piše", "K1 čita", "K2 piše", "K2 čita", "Razdvoji", "Spoji") add an action at the next
step and drop the actions after it (the task's `partition` toggle is the pair Razdvoji / Spoji). Changing `mode`
keeps the step, so the same run can be watched in the other mode at the same point. Unknown tokens are dropped; a
client's second request in one step is dropped (one request per client per step).

## Rules

Sources: E. Brewer, "Towards Robust Distributed Systems", PODC 2000 keynote; S. Gilbert and N. Lynch, "Brewer's
Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services", *SIGACT News* 33(2), 2002;
E. Brewer, "CAP Twelve Years Later: How the 'Rules' Have Changed", *Computer* 45(2), 2012; M. Kleppmann, *Designing
Data-Intensive Applications*, ch. 5 "Quorums for reading and writing" and ch. 9 "The CAP theorem". All *(check: from
memory, no local copy)*.

1. **No partition: both modes behave the same.** A write reaches all three replicas in its step; a read returns the
   newest value (Brewer 2000; Gilbert & Lynch 2002) *(check)*. The coordinator sends the request to every replica it
   can reach and acts on the answers of this step.
2. **CP quorums: W = 2, R = 2, N = 3.** A write succeeds only when W = 2 of 3 replicas (the coordinator counts)
   acknowledge it, and is then applied on every replica that acknowledged; a read consults R = 2 of 3 and returns the
   newest of the versions it got. R + W > N, so every read overlaps the latest successful write: **a CP read is never
   stale** (Kleppmann, *DDIA*, ch. 5) *(check)*.
3. **CP under partition.** The side with 2 of 3 replicas ({A, B}) serves reads and writes. The minority side ({C})
   reaches only itself (1 < 2): it answers **✗ timeout** to reads and writes, and a refused write is applied nowhere
   (not left on C) *(derived: the minority cannot commit)*. Consistent, not available for K2, although C is up.
4. **AP: any replica answers alone (W = 1, R = 1).** The coordinator applies a write at once and sends it to every
   replica it can reach; it answers a read from its own copy. Under partition C accepts K2's writes and serves reads
   that may be **stale**: a read is stale when the value it returns is older than the newest acknowledged value
   anywhere in the system. The two sides **diverge** when both have accepted a write since the partition began.
5. **AP heal: conflict, last write wins.** When both sides accepted writes during the partition, the heal finds two
   versions of `x`. The rule here is **LWW**: the version with the later stamp is kept everywhere; every write the
   losing side acknowledged during the partition is **lost** (link `multimaster-conflict`) (Kleppmann, *DDIA*, ch. 5
   "Last write wins") *(check)*. Without a conflict (only one side wrote, always so in CP) the heal is a **catch-up**:
   the replicas that are behind receive the newest version.
6. **Tie-break: requests in one step are processed in client id order** (K1 before K2), each seeing the effect of
   those before it (task rule 6).

### Stamps, values and order

- **Value of a write:** `x = 1 +` the number of write requests so far, failed ones included (K1's first write is
  `x = 2`, K2's after it `x = 3`) *(derived: every attempted value is distinct, so the captions can name it)*.
- **Stamp of a write:** `(at, client)`, `at` the step number. LWW compares `at`, then the client id: on equal `at`
  the **larger client id wins** (K2 over K1), the order rule 6 processes them in, so the later-processed write wins
  *(derived; the same tie as `multimaster-conflict`, larger origin id)*. The initial `x = 1` has stamp `(0, —)`.
- **T1** (rule 6): within a step, K1's request before K2's.
- **T2** (rule 5): equal `at` → larger client id; LWW never sees two writes from one client in one step.
- **T3** (rule 2): a CP read returns the version with the latest stamp among the replicas it consulted.
- **T4**: a partition step while partitioned, or a heal while not partitioned, changes nothing (`phase: 'noop'`); the
  page shows only the one that applies (Razdvoji or Spoji), so only a hand-made URL reaches it.
- **Lost** (rule 5) is every write the losing side acknowledged during this partition, not only its last.
- Catch-up and LWW send the **newest version only** (one key: the versions in between are overwritten anyway).

## Steps

One step per action in `ops` (a request, `p` or `h`), then one **summary** step: `steps = actions + 1`, at most 20.

## Presets (x = 1 everywhere at the start; checked by script and in `sim.test.js`)

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `no-partition` | `cp`, `w1.r2` | 3 | K1 writes `x = 2` on A, B, C ✓; K2 reads at C: **2** ✓. Same in `ap` |
| `cp-majority` | `cp`, `p.w1.r2.w2.h` | 6 | K1's `x = 2` ✓ on {A, B} (2 of 3); K2 reads at C: **✗ timeout**; K2's `x = 3`: **✗**; heal: C catches up to **2**, no conflict |
| `ap-both` | `ap`, `p.w1.r2.w2.h` | 6 | K1's `x = 2` ✓ on {A, B}; K2 reads at C: **1 (stale)**; K2's `x = 3` ✓ on C; heal: conflict **2 vs 3**, LWW keeps **3** (step 4 > 2), K1's `x = 2` **lost** |
| `cp-client-view` | `cp`, `p.r2.w2` | 4 | K2's read **✗**, K2's write `x = 2` **✗**; C is up; for K2 the system is down |

Other numbers: `ap`, `p.w1.r2.h` → heal is a catch-up (C to 2), nothing lost. `cp`, `p.w1.r1` → K1 reads 2 from
{A, B}. `ap`, `p.w2.w1.h` → K2's `x = 2` at step 2, K1's `x = 3` at step 3: LWW keeps K1's 3, K2's 2 is lost.
`cp`, `p.r2.w2` → K2's read and write ✗, K1 untouched. `ap`, `p.w1+w2.h` → both at step 2: K1's `x = 2`, K2's `x = 3`; tie on
`at`, K2 wins (T2), K1's 2 lost. No partition, `w1+r2` → K2 reads the 2 K1 wrote in the same step (T1).

## State

`{ n, phase, mode, quorum: { n: 3, w, r }, partition, partitionedAt, servers: { A|B|C: { id, value, at, client, seq,
got: [seq] } }, writes: [{ seq, client, value, at, server, result, on: [id], lost }], requests: [{ client, op, at,
server, result, value, seq, consulted: [id], newest }], divergence, heal, tally, changed: { servers: [id], requests:
[index] }, noop }`. JSON-safe. `seq` 0 is the initial `x = 1`; writes count from 1. `result` is `ok`, `stale` (reads
only) or `err`. `divergence` is `null` or one `{ side, value, at, client, seq }` per side. `heal` (only at a heal step)
is `{ kind: 'catchup' | 'conflict', versions, winner, lost: [seq], caughtUp: [id] }`. `tally` (only at the summary)
counts `{ ok, stale, err }` per client and the lost writes. The task's `mode`, `partition`, `quorum`, `requests`,
`divergence` and db-replication's `servers` and `writes` are kept.

## Legend

Replica (the kit's server card); partition (a hatched wall between the sides, and the cut links); request ✓ (solid
arrow, ✓ chip); stale answer (hatched bubble + „zastarjelo"); error / timeout (an arrow that ends in a cross + „✗");
conflict at the heal (two stacked values + „!"); lost write (the version strips' `bad` cell); changed (the kit's mark).
