# directed-net: Directed net vs free-for-all

| | |
|---|---|
| Task | `directed-net` (wave 3, Radio and crisis communications) |
| Catalogue entry | `kk-directed-net` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/directed-net/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | KK |
| Topic / tags / level | `radio` / `emergency-comms` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **an NCS turns contention into a queue**.

The student: let stations call with and without an NCS.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx` (text extracted from `ppt/slides/*.xml`): slides "Problem: kaos u eteru", "Uzroci kaosa", "Rješenje: strukturirana mreža", "Mrežna kontrolna stanica (NCS)", "Uloge u mreži", "Aktivacija mreže" (stations called in alphabetical order of call signs), "Disciplina pri javljanju" (repeat after 30 s), "Potvrda primitka (ACK)".
- `/home/rjasmin/projects/KAKA/KK_Operativni_Prirucnik.docx` §1.1 "Osnovna pravila" (listen ≥ 5 s, speak only when the NCS allows), §4.1 "Javljanje na mrežu", §4.2 "Slanje rutinske poruke", §5.2 "Upravljanje prometom".
- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/relaisfunkstellen.md` (doubling when two stations talk at once; orderly handover) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- Catalogue seed: KK1 slides

## Model and presets

- **Scene:** one simplex channel drawn as a horizontal time strip of slots (one slot ≈ one short
  transmission, ≈ 15 s, illustrative); above it the stations: an NCS (when present) and five field stations A–E
  (fictional call signs, e.g. 9A1ABC) each with a message card (priority RUTINSKO for this page). Each slot cell
  shows who transmitted: one name = heard, several = doubling (both lost), empty = idle. A side panel: messages
  delivered, slots used, doubled slots, idle slots, and (directed mode) the NCS's list: checked in, waiting,
  done.
- **State:** `{ slot, mode: 'free'|'directed', stations: [{id, call, pending, nextTry, backoff, deliveredAt}],
  ncs: {queue: [ids], calling: id|null, log: [{slot, from, to, text}]}, channel: [{slot, tx: [ids], outcome:
  'heard'|'doubled'|'idle'}], counts: {delivered, doubled, idle} }`.
- **One step:** one slot, phases in order: (1) decide who transmits (rules below for the mode); (2) resolve the
  slot: exactly one transmitter → heard; two or more → doubling, all lost; (3) update stations (delivered, or new
  `nextTry`) and the NCS log.
- **Rules:**
  1. Free-for-all: every station with a pending message transmits when `slot ≥ nextTry` (all start at slot 1:
     the incident happens, everyone keys up). After a doubled slot it waits its own `backoff` slots: `nextTry =
     slot + 1 + backoff` (KK1 "Problem: kaos u eteru": several stations transmit at once, messages repeated).
  2. Listening first (handbook §1.1, ≥ 5 s) does not help when stations start in the same slot; the model has no
     random backoff, the presets fix each station's backoff.
  3. Directed: only the NCS speaks unasked; stations transmit only when called (KK1 "Mrežna kontrolna stanica",
     "Govori se samo kada NCS pozove ili odobri").
  4. Directed sequence: slot 1 NCS opens the net; then for each station in alphabetical order of call signs
     (KK1 "Aktivacija mreže"): one slot NCS calls ("9A1ABC, predajte"), one slot the station sends; the NCS's next
     call begins with the ACK of the previous message ("primljeno …"); a last slot ACKs the final message. Total
     = 1 + 2·n + 1.
  5. A message without ACK is not delivered (KK1 "Potvrda primitka"); in free mode the recipient (NCS or HQ) ACKs
     in the slot after a heard message only if that slot is free, otherwise the sender repeats *(simplification:
     the presets keep ACKs implicit in free mode, say so on screen)*.
  6. Ties: none in directed mode; in free mode simultaneous transmitters are listed in id order.
- **Params:** `mode` choice free / directed (default free); `stations` range 3–8 (default 5); `backoff` select of
  the presets' patterns; `ncs` toggle (same as mode, for the side-by-side preset).
- **Presets** (traces derived by hand from rules 1–4):
  1. `everyone-waits-2` (KK1 "Problem: kaos u eteru"): 5 stations, all backoff 2 → slots 1, 4, 7, … all doubled;
     0 delivered in 20 slots: politeness that is identical for everyone repeats the collision forever.
  2. `mixed-backoff`: backoffs 1, 1, 2, 2, 3 → still 0 delivered in 20 slots (pairs keep colliding).
  3. `lucky`: backoffs 1, 2, 3, 4, 5 → one doubled slot, then A…E heard in slots 3–7; all 5 in 7 slots (but no
     ACKs and no order of importance).
  4. `directed` (KK1 "Rješenje: strukturirana mreža"): NCS present, 5 stations → 12 slots, 0 doubled, every message
     ACKed, order A…E. Slower than the lucky case, but guaranteed and the same every time.
  5. `side-by-side`: presets 1 and 4 run in lockstep (two strips): after 12 slots, 0 vs 5 delivered.
- **Steps:** 20, 20, 7, 12, 12.
- **Legend:** heard slot (filled with the call sign), doubled (× and both names), idle (hollow), NCS transmission
  (bold outline, "NCS"), ACK (✓). "Changed" marks the slot just resolved and the station whose message was
  delivered.
- **Captions:**
  - hr: „Odsječak 4: A, B, C, D i E opet odašilju istodobno – svi su pristojno čekali po dva odsječka. Dupliranje:
    nitko nije čuo nikoga.“
  - en: "Slot 4: A, B, C, D and E transmit together again – each politely waited two slots. Doubling: nobody
    heard anybody."
- **Terms** (KK1/KK2 slides): net control station (NCS) — mrežna kontrolna stanica (NCS); directed net —
  usmjerena (strukturirana) mreža (check); field operator — terenski operater; acknowledgement — potvrda primitka
  (ACK); doubling — dupliranje (50ohm); check-in — javljanje; call sign — pozivni znak.
- **Misconceptions:** an NCS makes the net faster (preset 3 vs 4: it makes it predictable); waiting a moment
  before repeating fixes collisions (preset 1); listening before talking prevents doubling (rule 2).
- **Out of scope:** priorities and preemption (`priority-traffic`), losing the NCS (`backup-ncs`), relays and
  gateways (`gateway-tiers`), radio propagation.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh directed-net sims/directed-net` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/directed-net/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
