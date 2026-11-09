<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# directed-net: notes

Task `docs/tasks/w3/directed-net.md` (catalogue `kk-directed-net`, §4.10). Rules, tie-breaks and numbers: `SPEC.md`.

## Decisions

- **One `mode` choice with three values** (free / with an NCS / side by side) instead of the task's `mode` choice plus
  a separate `ncs` toggle "same as mode, for the side-by-side preset": two controls for one setting would contradict
  each other. `side-by-side` is `mode: 'both'`.
- **State has lanes.** `{ slot, mode, lanes: [lane] }`, each lane in the task's shape (`stations`, `ncs`, `channel`,
  `counts`); `both` holds a free and a directed lane that step in lockstep with the same stations and backoffs.
- **Log entries carry codes** (`kind: 'open'|'call'|'msg'|'close'`, `ack`) instead of the task's `text`, so the model
  stays language-free; the page words them.
- **Delivered:** directed = ACKed (the NCS's next call or the closing slot); free = heard (implicit ACK, said on screen
  in the lane head: "the ACK is assumed here"). These give the task's numbers: 0, 0, 5, 5, and 0 vs 5.
- **Steps depend on the params:** directed 2n + 2; free until all delivered, else 20; both = the directed length, or
  the free lane's end if later (within 20). A free lane that never finishes is shown up to the directed net's end, as
  the task's `side-by-side` (12 steps) asks; its last caption gives each lane's outcome and that the collision repeats
  (COMMON.md §11, "show each outcome").
- **Call signs:** fictional `9A1QAA` … `9A1QHH`. The task's example `9A1ABC` could be a real licensee; a suffix starting
  with Q is not issued (Q codes) *(check)*. They sort in id order, so "alphabetical order of call signs" calls A…E as
  the task's preset expects; `order()` sorts by call sign and is tested with call signs out of id order.
- **Backoff patterns** for 3–8 stations: same = all 2; mixed = 1, 1, 2, 2, 3, 3, 4, 4; spread = 1…8 (the task gives
  only the five-station values).
- **Kit view:** none. The scene is a slot strip with station cards, drawn in the page like `backup-ncs`.
- **Dense strip:** more than 14 slots drop the sub-labels ("message", "opens") and shrink the NCS name; with two lanes
  and more than six stations the cards drop the call sign (it stays in the single-lane view and in captions).
- **Model reuse:** `freeStep`, `directedStep`, `order`, `resolve` are pure functions over plain lane data, promotable to
  `models/`. `backup-ncs` wrote its own directed-net part (its NOTES say so); the coordinator may want one shared model.
- **Related:** `backup-ncs`, `csma-cd` (collisions on a shared medium), `hidden-node`.

## Deviations from the task

- The `ncs` toggle is folded into `mode` (above).
- State reshaped into `lanes` (above); each station gets `sentAt`, the NCS `open`, `calling` and `ackDue`, so the page
  can show "sent, awaits ACK" separately from delivered.
- The NCS list reads waiting / called / awaits ACK / done instead of "checked in, waiting, done": in this net each
  station checks in with its message when called, so "checked in" splits into called (now sending) and sent
  (awaiting the ACK).
- A finished free lane in the side-by-side view stops counting idle slots and shows its own end as "slots", so the
  lucky backoffs read "5 in 7 slots, 1 idle" there too.
- Log entries have `kind` codes, not text (above).
- Call signs use a Q suffix instead of the task's `9A1ABC` example.

## Sources

- `KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx` (text read from `ppt/slides/*.xml`): slide 24 "Problem: kaos u eteru"
  (several stations at once, messages repeated without ACK), slide 27 "Rješenje: strukturirana mreža" ("Govori se
  samo kada NCS pozove ili odobri", every message ACKed), slide 29 "Mrežna kontrolna stanica (NCS)" (opens and closes
  the net, calls stations by name, keeps the log), slide 32 "Aktivacija mreže" ("javljaju se stanice po abecednom redu
  pozivnih znakova"), slide 33 "Disciplina pri javljanju" (repeat after 30 s without an answer), slide 35 (priority
  RUTINSKO), slide 41 "Potvrda primitka (ACK)" ("Bez ACK-a — poruka se ne smatra dostavljenom").
- `KAKA/KK_Operativni_Prirucnik.docx` §1.1 "Osnovna pravila" (listen ≥ 5 s; speak only when the NCS allows or with an
  urgent message), §4.1 "Javljanje na mrežu (Check-in)", §4.2 "Slanje rutinske poruke", §5.2 "Upravljanje prometom".
- 50ohm.de `relaisfunkstellen.md` (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.): only the idea and the
  term "doubling"; no text or figure copied, so no `credits` entry.

## Term pairs

Not in `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

| en | hr |
|---|---|
| net control station (NCS) | mrežna kontrolna stanica (NCS) |
| directed net | usmjerena mreža *(check: the KK1 slide says "strukturirana mreža")* |
| doubling | dupliranje |
| acknowledgement (ACK) | potvrda primitka (ACK) |
| call sign | pozivni znak |
| check-in | javljanje |
| backoff | odgoda *(check)* |
| slot | odsječak |

## Shared requests

None.

## Timing

Started 2026-11-09 08:27 CET; done (gate, review fixes, status ready) at 08:41 CET.
