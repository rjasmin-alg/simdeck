<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# asymmetric-path: specification

One concept: **replies taking another path break stateful devices.** Task `docs/tasks/w3/asymmetric-path.md`,
catalogue `net-asymmetric-path` (§4.1). The student toggles the return path and watches the connection die.

Sources: URM book ch. 15 (`book/chapters/15-analiza-prometa.md`), section "Paket je otišao, ali se ništa nije
vratilo: asimetričan put, NAT i vatrozid" (Što treba znati, Šire o temi, the digression on "vrući krumpir") and
Primjer 6 "paket izlazi, ništa se ne vraća"; the figure `ch15-asimetrican-put-nat-vatrozid.svg`; RFC 3022 (traditional
NAT builds sessions outbound only), RFC 3704 §2.2 (strict reverse-path checks are "only applicable in places where
routing is symmetrical"); the state model of `sims/stateful-firewall/` (a reply passes only if it matches a recorded
outbound connection).

## Scene

- An organization with **two exits** to the internet, a user inside, an internet cloud, and a server outside.
- The user is **192.0.2.10**, port **51000** (TEST-NET-1, the organization's own block, so no address translation
  is drawn: the state is what matters, not the translation). The server is **198.51.100.10**, TCP port **443**
  (TEST-NET-2, the same server as in `stateful-firewall`).
- Each exit has an edge device that keeps connection state (the book's "NAT/vatrozid — pamti stanje"), each with **its
  own state table**, empty at step 0. The organization's default route goes out through **exit 1**, so the request
  always leaves there (`outPath` = exit 1).
- The way back is chosen by the internet, not by the organization (hot potato, rule 4): param `returnPath`.

## State

`{ phase, outPath, inPath, tables: { exit1: [row], exit2: [row] }, packet, lookup, inserted, captures: { user: [ev],
server: [ev] }, reply: { sent, seenBy, matched, delivered }, verdict }`.
A row is `{ proto, a: { ip, port }, b: { ip, port }, state: 'ESTABLISHED', origin: 'exit1' }` (the connection a
opened to b, and the device that wrote it; the page shows the state as "zapisana / recorded", since only the
request has been seen). `lookup` is `{ device, row, result: 'hit' | 'miss' | 'none' }` (`none`:
the device keeps no state and checks nothing). Plain JSON.

## Steps (6, every preset)

Order within a step: the packet moves → the device on its way looks up or inserts → delivered or dropped → caption.

| n | phase | packet | what the model does |
|---|---|---|---|
| 0 | `start` | none | tables empty, captures empty |
| 1 | `out1` | request user → exit 1 | user's capture: "request sent" |
| 2 | `out2` | request exit 1 → internet | exit 1 looks up (miss: a new outbound connection), inserts a row; with `shared` the row is in both tables |
| 3 | `arrive` | request internet → server | server's capture: "request received" |
| 4 | `reply` | reply server → internet | server's capture: "reply sent"; `reply.sent` |
| 5 | `in` | reply internet → exit k (k = `inPath`) | device k looks up the reply in **its own** table: hit → accepted; miss → dropped (verdict `dropped`); no state kept → forwarded unchecked |
| 6 | `deliver` or `silence` | reply exit k → user, or nothing | accepted: user's capture "reply received", verdict `delivered`; dropped: no packet, user's capture "nothing back", the connection dies |

The task file proposed 5 steps for `symmetric-ok` and 6 for the others; one fixed count of 6 keeps `sim.json` `steps`
true for every preset and the delivery to the user its own step (see NOTES.md).

## Rules

1. **State from the outbound half only.** A stateful device writes a row only for a new connection leaving the
   organization (step 2), never for a packet coming in; a packet coming in passes only if it matches a row on that
   device (URM ch. 15: "Tradicionalni NAT sesije gradi jednosmjerno, uvijek iz privatne mreže prema van"; RFC 3022
   §2.3; `stateful-firewall`'s `judge`). `insertState`, `inspect`.
2. **Another exit, no match.** The reply via exit 2 is looked up in exit 2's table, which never saw the request, and is
   dropped, although the server really sent it (URM ch. 15 Što treba znati; the figure: "odgovor stiže Izlazom 2 —
   Izlaz 1 ga nikad ne vidi … nije prepoznat kao dio iste veze"). Exit 1's row is never consulted for it.
3. **Nothing deliberately blocks.** No rule names this connection; the default path through exit 2 alone kills it
   (URM ch. 15: "bez ijednog uređaja koji namjerno išta blokira, samo zbog puta"). With `stateful` off the same
   asymmetric reply is delivered: the device's state check, not the path, drops it.
4. **Hot potato.** Between providers each hands traffic on as early as it can, so request and reply routinely take
   different paths; the return path is the internet's choice (`returnPath`), not the organization's (URM ch. 15 and its
   digression; RFC 3704 §2.2). Default `exit2`.
5. **One capture is inconclusive.** After a drop the user's capture shows "request sent, nothing back", the server's
   shows "request received, reply sent". Read alone, the user's capture cannot tell "the server never replied" from
   "the reply was lost on the way"; only both together show the reply was sent and lost between, on a device neither
   capture sees (URM ch. 15 Šire o temi; Primjer 6 rješenje). `diagnose(captures, which)`:
   user alone → `inconclusive`; server alone → `inconclusive`; both → `lostBetween` when sent and not received,
   `complete` when received.
6. **Fixes.** `fix: 'symmetric'` makes the reply come back through exit 1 whatever the internet would choose (the
   organization makes the path symmetric); `fix: 'shared'` makes both exits share one state table (the row written at
   exit 1 is also in exit 2's table, origin `exit1`). Either way the reply matches and is delivered. Derived from rule 1;
   the exact mechanisms (policy routing, announcing addresses through one exit, state synchronisation between edge
   devices) are *(check)* and not named on the page.
7. **Tie-break / determinism.** The verdict at step 5 depends only on whether **that** device's table holds a matching
   row, never on timing or on the other device's table; a row matches the reply only on the exact protocol, addresses
   and ports, in either direction; replaying any step gives the same accept or drop.

## Expected numbers (checked by `sim.test.js`)

| preset | params | rows exit1 / exit2 after step 2 | step 5 lookup | verdict at 6 |
|---|---|---|---|---|
| `symmetric-ok` | returnPath exit1 | 1 / 0 | exit1 hit row 0 | delivered |
| `asymmetric-drop` | returnPath exit2 | 1 / 0 | exit2 miss | dropped |
| `two-captures` | returnPath exit2, captures on | 1 / 0 | exit2 miss | dropped; user [reqSent, nothing], server [reqRecv, repSent]; diagnose user alone `inconclusive`, both `lostBetween` |
| `make-symmetric` | returnPath exit2, fix symmetric | 1 / 0 | exit1 hit row 0 | delivered |
| `share-state` | returnPath exit2, fix shared | 1 / 1 | exit2 hit row 0 | delivered |
| `no-state` | returnPath exit2, stateful off | 0 / 0 | exit2 none | delivered |

## Out of scope

The stateless-vs-stateful contrast (`stateful-firewall`), NAT translation mechanics (`nat`), BGP path selection, TCP
flags and connection-tracking internals, ECMP hashing. Primjer 6's second explanation, a check that assumes a symmetric
path (strict reverse-path filtering, RFC 3704 §2.2), is not modelled on its own: here the state check stands for any
check that needs both halves on one device.
