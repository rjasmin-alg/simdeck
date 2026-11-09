<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# priority-traffic: spec

Task `docs/tasks/w3/priority-traffic.md` (catalogue `kk-priority-traffic`, §4.10). One concept: **routine / priority /
emergency preemption, acknowledgement and retry.** The student injects traffic of each priority into a running
directed net and watches who is served, who is cut off, and when a message counts as delivered.

## Scene

The directed net of `directed-net`: an NCS, field stations A–F with fictional call signs (`9A1QAA` … `9A1QFF`), one
simplex channel drawn as a strip of slots (one slot ≈ one short transmission ≈ 15 s, illustrative). Beside it the NCS's
queue, sorted as the NCS serves it, each row with its priority's prefix and shape (HIT ◆, PRI ▲, RUT ●, INF ○), and
every message's ACK state: waiting, called, sent (awaiting ACK, try k of 3), cut, via relay, delivered (✓).

## State

```
{ slot, priorities: bool,
  ncs: { queue: [{ msgId, from, prio, registeredAt }],          // in serving order (rules 1, 2)
         current: null | { msgId, phase },                      // the exchange that holds the channel
         restricted: bool, announce: null | 'on' | 'off',       // rule 4: requested, not yet aired
         ackOwed: [msgId],                                      // ACKs a break-in cut off (rule 3)
         log: [{ slot, kind, who, to?, msgId?, acks?, call?, announce?, cut?, heard?, via?, tries?, next? }] },  // slot n = the strip
  messages: [{ id, from, prio, tries, delivered, deliveredAt, interrupted, via, offChannel, registeredAt }],
  stations: [{ id, call, reachesNcs, relay }] }
```

`phase` is `send` (the sender transmits), `ack` (the NCS answers), `wait` (no ACK came), `goahead` (the NCS answers a
break-in), `relay` (the sender passes the message to its relay), `relayAck` (the relay ACKs the sender). The model
holds no text: log entries carry codes and the page words them.

## One step = one slot, in order

1. **Register** every message injected for this slot (rule 1 order; a HITNO breaks in at once, rule 3).
2. **The NCS picks** what this slot carries: the next phase of the current exchange; otherwise a pending restriction
   announcement; otherwise a call of the first eligible queue entry; otherwise nothing (idle).
3. **Resolve** the transmission: heard by the NCS or not (a station that does not reach the NCS is not heard).
4. **ACK bookkeeping and retries:** an ACK delivers; a slot with no ACK counts a failed try; after the third, the relay.

Before slot 1 the net is already running: messages registered at slot ≤ 0 form the queue, and the NCS's last
transmission (slot 0) called the first of them, so it sends in slot 1.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Order of service:** HITNO > PRIORITET > RUTINSKO > INFORMATIVNO. Within a priority, first registered first served *(derived from "Redosljed prema NCS odluci")*. **Tie-break:** messages registered in the same slot are taken in order of call sign (then id) *(derived)*. With `priorities` off the queue is plain FIFO (same tie-break) and nothing breaks in. | KK2 "Upravljanje redovima čekanja (Queue)"; handbook §3 |
| 2 | **INFORMATIVNO only when nothing else waits:** an INF message is called only when no other message waits; one registered first still goes last. | KK1 "Prioriteti poruka"; handbook §3 |
| 3 | **HITNO preempts.** In the slot it arises the sender says "HITNO HITNO HITNO, [call]" (*break-in*), cutting what the slot would have carried: a message being sent (or passed to a relay) is not delivered, is marked *interrupted* and goes back to the **front of its priority** (tries kept); in a no-ACK slot nothing is on the air, the exchange is only suspended and goes back the same way; a relay's ACK being sent is cut, but the relay keeps the message and sends it "via" itself when called; an NCS ACK being sent is *owed* and rides on the NCS's next ACK (not in the go-ahead); a call or announcement simply happens later. Next slot the NCS answers "[call], primljeno, predajte hitnu poruku"; then the message; then the NCS ACKs it and passes it on, and only then calls anyone else. **A HITNO waits instead** (at the end of the HITNO group, FIFO, tie by call sign) when another HITNO holds the channel or waits, or when the NCS cannot hear its sender (it was registered before contact was lost; it then retries and relays like any message). A waiting HITNO is called before a pending restriction announcement. Wait for HITNO: 0 slots. | KK1 "Hitna poruka — postupak"; handbook §3, §4.3; KK2 "Upravljanje redovima čekanja" ("Maksimalno čekanje za HITNO: 0 sekundi") |
| 4 | **Restriction:** the NCS announces "PROMET SAMO PRIORITET I HITNO" in its next transmission (an ACK slot carries it instead of the next call, or a slot of its own when the NCS is idle; never the go-ahead, and after any waiting HITNO): 1 slot. While it holds, RUTINSKO and INFORMATIVNO are not called (they stay in the queue), with `priorities` on or off; a second announcement lifts it. A second request before the first is aired cancels it. | KK2 "Prioritizacija prometa pod opterećenjem"; KK1 "Prioriteti poruka"; handbook §5.2 |
| 5 | **ACK:** a message is delivered only when the NCS's ACK is on the air (the NCS repeats the key information). One exchange = the station sends in one slot, the NCS's next transmission carries the ACK and the next call (2 slots per message, as in `directed-net`). A sender that gets no ACK repeats in the next slot; after **3** tries without an ACK it uses its relay (or another channel if the relay cannot reach the NCS either). The exchange keeps the channel while the sender retries. | KK1 "Potvrda primitka (ACK)" ("Bez ACK-a — poruka se ne smatra dostavljenom", "Nakon tri bezuspješna pokušaja — koristiti alternativni kanal ili relay"); handbook §4.4 |
| 6 | **Relay:** the sender passes the message to its relay (1 slot); the relay ACKs it (1 slot) and sends it to the NCS as "[sender] via [relay]" at the same priority (it keeps the sender's turn, so it sends in the next slot); the NCS's ACK to the relay delivers it. Relays: A↔B, C↔D, E↔F *(derived)*. | KK2 "Međumrežna veza — Gateway operater" (the "via" format, reused for a relay *(derived)*); KK1 "Uloge u mreži" (relay stations) |

## Params

- `priorities` (toggle, default on): off = plain FIFO, no break-in, for comparison.
- `cutoff` (select: none, A … F; default none): the station that does not reach the NCS (the task's per-station
  `reachable` toggle, one station at a time; NOTES.md).
- `from` (select A … F) and four inject buttons (HITNO, PRIORITET, RUTINSKO, INFORMATIVNO; keys E, P, U, I): register a
  message from `from` at the next slot (`resets: false`). At most 12 messages; none after slot 19.
- `restrict` button (key S): the NCS announces (or lifts) the restriction from the next slot on.
- Hidden params (no control, set by presets and buttons): `inject` = dot-separated tokens `<slot><station><H|P|R|I>`
  (e.g. `0AR.0BR.0CR.3DH`; slot ≤ 0 = already queued at the start); `restrict` = dot-separated slots at which a
  restriction announcement (on, off, on, …) is requested.

## Steps

The slot in which nothing is left to do (every message delivered or moved to another channel, no exchange on, no
injection or announcement still to come), at most 20. `sim.json` `steps` = steps(defaults) = 10 (defaults = preset 1).

## Presets and expected numbers (checked by `sim.test.js`)

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `emergency` | `0AR.0BR.0CR.3DH` | 10 | 1 A; 2 ACK A + call B; 3 D breaks in, B cut (back to the front of RUT); 4 NCS "predajte"; 5 D; **6 ACK D** + call B; 7 B; 8 ACK B + call C; 9 C; 10 ACK C |
| `fifo` | same, `priorities` off | 8 | D queues behind C: A 1–2, B 3–4, C 5–6, **D 7–8** (2 slots later than with priorities; with 10 routine messages ahead, 20 slots + its own 2) |
| `four-priority` | `-2AI.-1BR.0CP.0DP.0EP.0FP` | 12 | served C, D, E, F (call-sign order), then B, then A: delivered 2, 4, 6, 8, 10, **12** |
| `no-ack` | `0ER`, `cutoff` E | 10 | E sends 1, 3, 5, no ACK in 2, 4, 6; 7 E → F; 8 F ACKs E; 9 F sends "E via F"; **10 NCS ACKs**: delivered in 10 |

Other numbers (tests): `0AP.0BR.0CI.3DP` with a restriction requested in slot 1: 1 A, 2 ACK A + announcement (no call),
3 D registers and is called, 4 D, 5 ACK D, then idle to 20 while B (RUT) and C (INF) are held; with a lift requested in
slot 5 of `0AP.0BR`: 5 lift, 6 call B, 7 B, 8 ACK B. Two HITNO in one slot: the first by call sign breaks in, the other
is called with its ACK. `0AR.3DH.4CH.7BH` with a restriction in slot 5: D, C, B delivered in 6, 8, 10, the announcement
in 10. A HITNO from a cut-off D (defaults, `cutoff` D): no break-in, D sends 5, 7, 9 unheard and is delivered via C in 14.

## Misconceptions the presets answer

- "An emergency just goes first in the queue": `emergency` vs `fifo`: it interrupts the message on the air (rule 3).
- "A message that was heard is delivered": only the ACK delivers it (rule 5); the strip marks the delivery in the ACK slot.
- "Repeating louder works": `no-ack`: after 3 tries, use a relay.

## Out of scope

Losing the NCS (`backup-ncs`), crossing net tiers (`gateway-tiers`), message serial numbers, digital modes, doubling
(`directed-net`), the 15-minute repetition of the restriction status (a demo lasts minutes).
