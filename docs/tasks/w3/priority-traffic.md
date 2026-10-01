# priority-traffic: Priority traffic and ACK

| | |
|---|---|
| Task | `priority-traffic` (wave 3, Radio and crisis communications) |
| Catalogue entry | `kk-priority-traffic` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/priority-traffic/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | KK |
| Topic / tags / level | `radio` / `emergency-comms` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `directed-net` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **routine/priority/emergency preemption, acknowledgement and retry**.

The student: inject traffic of each priority.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/directed-net/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx` (text from `ppt/slides/*.xml`): "Format poruke — osnova", "Prioriteti poruka", "Hitna poruka — postupak", "Potvrda primitka (ACK)" (three unsuccessful tries → alternative channel or relay).
- `/home/rjasmin/projects/KAKA/KK2_Napredne_Krizne_Komunikacije.pptx`: "Prioritizacija prometa pod opterećenjem" ("PROMET SAMO PRIORITET I HITNO", repeat every 15 min), "Upravljanje redovima čekanja (Queue)" (HITNO > PRIORITET > RUTINSKO; HITNO waits 0 s), "Međumrežna veza — Gateway operater" (the "via" prefix).
- `/home/rjasmin/projects/KAKA/KK_Operativni_Prirucnik.docx` §3 "Prioritetne razine" (prefixes HIT/PRI/RUT/INF, preemption column), §4.3 "Slanje HITNE poruke", §4.4 "Potvrda primitka (ACK)", §5.2 "Upravljanje prometom", §8.1 Vježba 1 and §8.2 Vježba 2 (simulated problems used as presets 1 and 3).
- Catalogue seed: KK1/KK2, KK_Operativni_Prirucnik.docx

## Model and presets

- **Scene:** the directed net of `directed-net` (NCS, field stations A–F, one channel as a strip of slots) plus
  the NCS queue drawn as a list sorted by priority (HITNO, PRIORITET, RUTINSKO, INFORMATIVNO, each with its
  prefix HIT/PRI/RUT/INF and a distinct shape) and each message's ACK state (sent, waiting for ACK, tries 1–3,
  delivered). Buttons inject a message of a chosen priority from a chosen station at the next slot.
- **State:** `{ slot, ncs: {queue: [{msgId, from, prio, registeredAt}], current: {msgId, phase: 'send'|'ack'}|null,
  restricted: bool, log: [..]}, messages: [{id, from, to, prio, text, tries, delivered, deliveredAt, interrupted}],
  stations: [{id, reachesNcs: bool, relay: id|null}] }`.
- **One step:** one slot (≈ 15 s, illustrative), phases in order: (1) injected messages register (HITNO breaks in
  at once, rule 3); (2) the NCS picks what happens in this slot: continue the current exchange, or call the head of
  the queue; (3) the transmission is resolved (heard, not heard by the NCS, interrupted); (4) ACK bookkeeping and
  retries.
- **Reused from `directed-net`:** the slot model, the NCS calling rule, one exchange = the station sends in one slot
  and the NCS's next transmission carries the ACK (2 slots per message). **New:** priorities, preemption,
  restriction, ACK retries and relay.
- **Rules:**
  1. Order of service: HITNO > PRIORITET > RUTINSKO > INFORMATIVNO (KK2 "Upravljanje redovima čekanja", handbook §3);
     within a priority, first registered first served (handbook: "Redosljed prema NCS odluci" → FIFO here
     *(derived)*); simultaneous registrations ordered by call sign *(derived)*.
  2. INFORMATIVNO is sent only when nothing else waits (KK1 "Prioriteti poruka", handbook §3).
  3. HITNO preempts: the sender says "HITNO HITNO HITNO, [call]" in the slot it arises, cutting the current
     transmission (that message is not delivered and goes back to the front of its priority); the NCS answers
     "primljeno, predajte hitnu poruku" in the next slot; all other traffic waits until the NCS has ACKed and
     passed it on (KK1 "Hitna poruka — postupak", handbook §4.3; wait for HITNO: 0 s, KK2).
  4. Restriction: the NCS may declare "PROMET SAMO PRIORITET I HITNO" (1 slot); while it holds, RUTINSKO and
     INFORMATIVNO are not called; it is lifted with another announcement (KK2 "Prioritizacija prometa pod
     opterećenjem", handbook §5.2).
  5. ACK: the receiver repeats the key information; without ACK the message is not delivered (KK1 "Potvrda primitka").
     A sender that gets no ACK repeats; after 3 unsuccessful attempts it uses a relay or another channel (KK1).
  6. A relay that hears the sender ACKs it, then registers the message with the NCS as "[sender] via [relay]" at the
     same priority (KK2 "Međumrežna veza" format, reused for a relay *(derived)*).
- **Params:** `priorities` toggle (default on; off = plain FIFO, no break-in, for comparison); inject buttons
  (station × priority, `resets: false`); `restrict` button; `reachable` toggle per station (to cut a station off the
  NCS).
- **Presets** (traces derived by hand from rules 1–6):
  1. `emergency` (handbook Vježba 1, problem 3 "SIMULACIJA HITNO — nestala osoba"): queue RUT A, RUT B, RUT C; HITNO
     from D at slot 3 while B is sending → B cut; D's HITNO ACKed at slot 6; B resent 7–8, C 9–10. 10 slots.
  2. `fifo` (same as 1 with `priorities` off): D waits its turn → delivered at slot 8. Here only 2 slots later; with
     10 routine messages ahead it would be 20 slots.
  3. `four-priority` (handbook Vježba 2, problem 3): queue INF A (registered first), RUT B, then PRI C, D, E, F
     registered together → served C, D, E, F (call-sign order), then B, then A last: A delivered at slot 12.
  4. `no-ack` (KK1: three tries, then a relay): E cannot reach the NCS; E sends in slots 1, 3, 5 with no ACK; slot 7
     E calls relay F, slot 8 F ACKs E, slot 9 F sends "E via F", slot 10 NCS ACKs: delivered at slot 10.
- **Steps:** 10, 8, 12, 10.
- **Legend:** priority by shape and prefix (HIT ◆, PRI ▲, RUT ●, INF ○), cut transmission (scissors / "prekinuto"),
  waiting for ACK (hourglass), delivered (✓), relay path (dashed). "Changed" marks the queue rows that moved and the
  slot just resolved.
- **Captions:**
  - hr: „Odsječak 3: D javlja „HITNO HITNO HITNO“ i prekida B-ovu rutinsku poruku. NCS u sljedećem odsječku traži
    hitnu poruku; B će svoju ponoviti tek kad NCS potvrdi HITNO.“
  - en: "Slot 3: D calls "HITNO HITNO HITNO" and cuts off B's routine message. In the next slot the NCS asks for the
    emergency message; B repeats its own only after the NCS has acknowledged the HITNO."
- **Terms** (KK1/KK2, handbook): emergency / priority / routine / informational — HITNO / PRIORITET / RUTINSKO /
  INFORMATIVNO; preemption — prekidanje (prednost) (check); queue — red čekanja; acknowledgement — potvrda primitka
  (ACK); relay — relej (relejna stanica); net control station — mrežna kontrolna stanica (NCS).
- **Misconceptions:** an emergency just goes first in the queue (it interrupts, rule 3); a message that was heard is
  delivered (only an ACK delivers it); repeating louder works (after 3 tries use a relay).
- **Out of scope:** losing the NCS (`backup-ncs`), crossing net tiers (`gateway-tiers`), message serial numbers,
  digital modes.
- **Note for the coordinator:** KK1 slide "Format poruke — osnova" lists three priorities (HITNO / RUTINSKO /
  INFORMATIVNO) while KK1 "Prioriteti poruka", KK2 and the handbook use four (with PRIORITET); the spec uses four.
  KK2 says routine traffic is suspended under overload, the handbook says INFORMATIVNO is: rule 4 follows KK2's
  explicit "samo PRIORITET i HITNO" (both suspended).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `priority-traffic` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh priority-traffic sims/priority-traffic` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/priority-traffic/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
