<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# directed-net: spec

Task `docs/tasks/w3/directed-net.md` (catalogue `kk-directed-net`, §4.10). One concept: **an NCS turns contention
into a queue.** The student lets five stations call with and without a net control station (NCS).

## Scene

One simplex channel drawn as a strip of slots; one slot ≈ one short transmission ≈ 15 s (illustrative). Above it
the stations: an NCS (directed mode) and field stations A–E (3–8 with the slider), each with a fictional call sign
(`9A1QAA` … `9A1QHH`; a suffix starting with Q is not issued) and one routine message (RUTINSKO). A slot cell shows
who transmitted: one name = heard, several = doubling (all lost), empty = idle. Beside the stations: messages
delivered, slots used, doubled slots, idle slots, and in directed mode the NCS's list (waiting, called, sent and
waiting for its ACK, done; the task's "checked in" is the called and awaits-ACK rows, NOTES.md).

## State

```
{ slot, mode: 'free'|'directed'|'both',
  lanes: [ { mode: 'free'|'directed',
             stations: [{ id, call, pending, nextTry, backoff, sentAt, deliveredAt }],
             ncs: null | { open, queue: [ids], calling: id|null, ackDue: id|null,
                           log: [{ slot, from, to, kind: 'open'|'call'|'msg'|'close', ack }] },
             channel: [{ slot, tx: [ids], outcome: 'heard'|'doubled'|'idle', acts: [{ who, kind, target?, ack? }] }],
             counts: { delivered, doubled, idle },
             done: slot|null } ] }
```

One lane per mode; `both` (the side-by-side preset) holds a free lane and a directed lane that step in lockstep.
The task's `ncs.log` entries carry `kind` codes instead of text (no language in the model).

## One step = one slot, in order

1. Decide who transmits (rules 1 and 3–4).
2. Resolve: exactly one transmitter → heard; two or more → doubled, all lost; none → idle.
3. Update the stations (delivered, or a new `nextTry`) and the NCS's queue and log.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Free-for-all:** every station with a pending message transmits when `slot ≥ nextTry`; all start with `nextTry = 1` (the incident happens, everyone keys up). After a doubled slot each transmitter waits its own backoff: `nextTry = slot + 1 + backoff`. | KK1 "Problem: kaos u eteru", "Uzroci kaosa" (several stations at once, messages repeated) |
| 2 | **No random backoff:** each station's backoff is fixed by the pattern (same: all 2; mixed: 1,1,2,2,3,3,4,4; spread: 1…8). Listening first (≥ 5 s) does not help: stations that start in the same slot hear nothing before they start. | handbook §1.1; KK1 "Disciplina pri javljanju" (repeat after a wait) |
| 3 | **Directed:** only the NCS speaks unasked; a station transmits only in the slot after the NCS called it. | KK1 "Mrežna kontrolna stanica (NCS)": "Govori se samo kada NCS pozove ili odobri"; handbook §1.1 |
| 4 | **Directed sequence:** slot 1 the NCS opens the net; then for each station in alphabetical order of call signs: one slot the NCS calls ("9A1QAA, predajte"), one slot the station sends. The NCS's next call begins with the ACK of the previous message ("primljeno …"); a last slot ACKs the final message. Total = 1 + 2·n + 1. | KK1 "Aktivacija mreže" (alphabetical order), "Potvrda primitka (ACK)"; handbook §4.1, §4.2, §5.2 |
| 5 | **Delivered = ACKed.** Directed: a message counts when the NCS ACKs it, one slot or more after it was sent. Free: the ACK is implicit (simplification, said on screen): a heard message counts as delivered in its own slot. | KK1 "Potvrda primitka (ACK)"; task rule 5 |
| 6 | **Ties:** none in directed mode (one transmitter per slot). In free mode simultaneous transmitters are listed in id order. The calling order is by call sign; equal call signs (never with the fixed set) fall back to the id. | task rule 6 |

Doubling: two stations transmitting at once on one channel, neither is heard (50ohm, "Relaisfunkstellen", CC BY 4.0).

## Params

- `mode`: free / directed / both (side by side). Default free. The task's separate `ncs` toggle "same as mode, for the
  side-by-side preset" is folded into this choice as its third value (NOTES.md, Deviations).
- `stations`: 3–8, default 5.
- `backoff`: same / mixed / spread, default same. Free lanes only. The task gives five stations' values (2×5;
  1, 1, 2, 2, 3; 1…5); the values for F–H (3, 4, 4 and 6…8) extend each pattern and are illustrative.

## Steps

- directed: 1 + 2·n + 1 (n = 5 → 12; n = 8 → 18).
- free: the slot in which the last message is delivered, else 20.
- both: the directed length, or the free lane's end if it finishes later within 20 (each lane runs to its own end,
  COMMON.md §11). With these patterns a free lane finishes in n + 2 slots (< 2n + 2) or never, so the max is only a
  guard. A free lane that never finishes is shown up to the directed net's end; a lane that has finished keeps its
  strip but stops counting (its counts and "slots used" are those of its own end).
- `sim.json` `steps` = steps(defaults) = 20.

## Presets and expected numbers (checked by a script before coding and by `sim.test.js`)

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `everyone-waits-2` | free, 5, same | 20 | doubled in slots 1, 4, 7, 10, 13, 16, 19 (all five each time); idle 13; 0 delivered |
| `mixed-backoff` | free, 5, mixed | 20 | doubled 13, idle 7, 0 delivered (pairs keep colliding: 1 ABCDE, 3 AB, 4 CD, 5 ABE, 7 ABCD, 9 ABE, 10 CD, 11 AB, 13 ABCDE, …) |
| `lucky` | free, 5, spread | 7 | slot 1 doubled, 2 idle, A…E heard in 3–7: 5 in 7 slots (no ACKs, no order of importance) |
| `directed` | directed, 5 | 12 | 1 open; 2 call A; 3 A; 4 ACK A + call B; … 10 call E + ACK D; 11 E; 12 ACK E. 0 doubled, 0 idle, 5 ACKed in order A…E (delivered in 4, 6, 8, 10, 12) |
| `side-by-side` | both, 5, same | 12 | free lane: doubled 1, 4, 7, 10, 0 delivered; directed lane as above: 0 vs 5 |

Other numbers: mixed with 3 stations delivers 1 (C, slot 4); spread with n stations finishes in n + 2 slots.

## Misconceptions the presets answer

- "An NCS makes the net faster": `lucky` (7 slots) vs `directed` (12): the NCS makes it predictable, not faster.
- "Waiting a moment before repeating fixes collisions": `everyone-waits-2`: identical politeness repeats the collision.
- "Listening before talking prevents doubling": rule 2; stations that start together hear nothing first.

## Out of scope

Priorities and preemption (`priority-traffic`), losing the NCS (`backup-ncs`), relays and gateways
(`gateway-tiers`), radio propagation.
