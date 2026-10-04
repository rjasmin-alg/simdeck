<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multimaster-conflict: specification

One concept: **concurrent writes on two masters; last-writer-wins, versions, what is lost** (task
`docs/tasks/w2/multimaster-conflict.md`, catalogue `ha-multimaster-conflict`, §4.7 and §5.7). The student writes on
both sides of a partition and heals it.

## Scene

Two masters **M1** and **M2** (**DC1** and **DC2** with the AD rule) as the lanes of kit view K1. Each lane card holds
the master's clock reading (with its skew) and its copy of the record: row `x`, or the user object `ana` with the
attributes `telephoneNumber` and `title`. Client writes are notes on a lane (a dot, the value, the stamp);
replication messages are arrows; a message sent while partitioned is a dashed arrow that stops at the partition
wall drawn between the two lifelines; the heal and the resolution are notes centred on the wall. Beside the chart the
**resolution box** shows, after the heal, every write of the round with its real time and what the rule reads, the
rule applied, the winner (solid frame), what was lost (crossed, "izgubljeno") or both kept (stacked frames, "sukob").

## State

`{ t, clocks: {M1: {offset}, M2: {offset}}, partitioned, copies: {M1: Rec, M2: Rec}, pending: [{from, to, change,
sent, wid}], events: [], strategy, round, writes: [], result, last }`, with `Rec = {fields: {name: Version |
{siblings: [Version…]}}}` and `Version = {value, stamp, version, origin, vv, wid, t}`. Every version carries all
metadata (stamp, attribute version, origin, version vector); the page shows only what the active rule reads.
`writes[]` records each client write (real time, stamp, the version it made, `accepted`). `result` is the resolution
summary (below). One step = one event (`events[n].step === n`).

## Timeline (real time t in seconds; clocks read 10:00:00 + t + offset)

| Step | Event | t |
|---|---|---|
| 0 | `x = 10` already written on M1 (`stamp 0, version 1, vv {M1:1, M2:0}`) | 0 |
| 1 | initial replication M1 → M2 (sent and applied in this step) | 1 |
| 2 | partition | 2 |
| 3 | client write on M1 (message queued) | 5 |
| 4 | client write on M2 (message queued) | 7 (AD: 8, "3 s later") |
| 5 | heal (delivers nothing itself) | 9 |
| 6, 7 | the queued messages delivered, in send order | 10, 11 |
| 8 | resolution | 12 |

AD adds a second round without a partition: 9 DC1 sets `title` (t 14), 10 DC2 sets `telephoneNumber` (t 15), 11 and
12 the two deliveries (16, 17); step 12 also carries the round-2 resolution. With the partition off, each write is
followed by its own delivery (`repl, w1, deliver, w2, deliver, resolve` = 6 steps); with one writer, only its write
and delivery (in both AD rounds). Any step without a fixed time comes 1 s after the one before.

## Rules

1. **Local accept, asynchronous replication.** A master applies a client write to its own copy at once, stamps it
   with *its own* clock (`stamp = t + offset`), and sends the change to the other master as a message (NLA T55;
   Kleppmann, *DDIA*, ch. 5 "Multi-Leader Replication") *(check: T55 chapter not written yet)*.
2. **Partition queues.** While partitioned no message is delivered; after the heal the queue is delivered in send
   order, one message per step (task rule 2).
3. **Last-writer-wins (LWW).** Of two versions the larger stamp wins; **tie: equal stamps → the larger origin id**
   (`M2` > `M1`). The loser is discarded silently. The same comparison runs at the writer itself: a local write whose
   stamp is smaller than the stored version's is discarded at once (the client was told OK); the change is still sent
   on with its stamp and loses again at the receiver. (Task rule 3.)
4. **Clock skew decides LWW.** Because the stamp comes from the writer's clock, a write that happened later in real
   time on a slow clock loses (faultline `js/engine/authorities.js`, Time: "the loser is chosen by skew rather than by
   order, and nothing reports it"). `result.laterLost` marks it.
5. **Version vectors.** Each master counts its own updates: a write's vector is the merge (element-wise max) of the
   vectors it overwrote, with its own counter +1. A dominates B when every counter of A ≥ B's. At a receiver: an
   incoming version dominated by (or equal to) one held is dropped (**tie: equal vectors are the same version, not a
   conflict**); one that dominates everything held replaces it; otherwise the writes were **concurrent** and both are
   kept as siblings (Parker et al., IEEE TSE 1983; Kleppmann, *DDIA*, ch. 5 "Detecting Concurrent Writes").
6. **AD-style per attribute.** Each attribute carries its own version; a write sets version = held version + 1.
   Conflicts are resolved per attribute: **higher version → tie: later originating stamp → tie: higher originating
   DC GUID** (Microsoft Learn, "How the Active Directory Replication Model Works", conflict resolution)
   *(check: wording of the GUID tie-break)*. A change to one attribute does not touch another, so changes to
   different attributes of the same object both survive. DC2's GUID (`9c71…`) is the higher one.
7. **Read-modify-write.** With `inc`, each master reads its current `x` and writes `x + 1`. Both read 10 and both write
   11: under LWW one increment is lost; the intended result is `read + number of increments`. Under version vectors
   the two 11s are kept as siblings and nothing is chosen.

**Resolution summary** (`result`, rule numbers above): for every attribute written in the round, its writes, which are
held on *both* copies (`kept`), which were replaced by a kept write that had already seen them (`overwritten`: its
vector dominates; an ordered overwrite, not a loss), and the rest (`lost`). `rule` names what decided between the two
writes: `stamp` / `origin` (LWW), `version` / `stamp` / `guid` (AD), `dominates` / `concurrent` (VV), or `single`
when only one write touched the attribute. `siblings`, `laterLost`, and for `inc` `intended` and `got`.

## Params

`strategy` lww / vv / ad (lww), `skewM2` 0 / −4 / +4 s (−4), `partition` on/off (on), `writers` both / M1 / M2
(both), `inc` off/on (off; disabled with AD). The button "Spoji mrežu / Heal the network" jumps to the heal step (or,
with the partition off, to the first delivery).

## Presets and expected numbers (checked by hand and by `check.py`, NOTES.md)

1. `lww-skew` (lww, −4 s): M1 writes 20 at t 5 (stamp 10:00:05), M2 writes 30 at t 7 with its clock 4 s slow
   (stamp 10:00:03). Step 6: M2 receives 20@05 > 30@03, applies it. Step 7: M1 receives 30@03 < 20@05, keeps 20.
   **20 wins on both; 30, the later write, is lost; nothing reports it.** 8 steps.
2. `lww-synced` (lww, 0 s): 30@07 beats 20@05: **30 wins; M1's write is lost** (LWW always loses one). 8 steps.
3. `version-vectors` (vv, 0 s; vectors ignore the clock): M1 `{M1:2, M2:0}`, M2 `{M1:1, M2:1}`: neither dominates → **both 20 and 30 kept as
   siblings** on both copies, nothing lost. 8 steps.
4. `ad-attribute` (ad, 0 s): `telephoneNumber` 555-0101 v1 → DC1 sets 555-0202 (v2, 10:00:05), DC2 sets 555-0303
   (v2, 10:00:08): same version, **the later stamp wins: 555-0303; 555-0202 lost**. Round 2: DC1 sets `title`
   (v2, 10:00:14), DC2 sets `telephoneNumber` 555-0404 (v3, 10:00:15): **both kept**. 12 steps.
5. `lost-increment` (lww, 0 s, inc): both read 10 and write 11; **result 11, intended 12** (M2's 11@07 wins, M1's
   increment is lost). 8 steps.

Other values the page reaches: skew +4 s gives M2 stamp 10:00:11 (30 wins, the earlier write lost, no `laterLost`);
partition off with −4 s: M2's 30@03 is discarded at M2 itself (stamp below the stored 20@05), lost without a
partition; partition off with 0 s: 30 overwrites 20 in order, nothing lost; AD with −4 s: DC2's stamp 10:00:04 <
10:00:05, DC1's 555-0202 wins and the later change is lost to skew. The tie-breaks need skews the page does not
offer (LWW origin: M2 −2 s; AD GUID: DC2 −3 s); the tests reach them through the model.

## Simplifications

- Two masters only; the AD rule without USNs, up-to-dateness vectors or originating-update metadata beyond version,
  stamp and GUID (out of scope, `win-ad-replication`).
- Version vectors per record (one field), not dotted version vectors; siblings are not merged by the model.
- CRDTs only named, as the fix for rule 7.
