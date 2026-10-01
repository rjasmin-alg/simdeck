# packet-aprs: Packet radio and APRS

| | |
|---|---|
| Task | `packet-aprs` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-packet-aprs` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/packet-aprs/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `radio-networks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **CSMA on a shared channel, digipeaters, path aliases**.

The student: send beacons through digipeaters.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/afsk.md` (APRS on 144.800 MHz, AFSK over FM, 1200 bit/s, digipeaters), `relaisfunkstellen.md` (digipeater definition: receives and resends data packets, may change fields) and `paketvermittelte_netzwerke.md` (packet switching, HAMNET replacing packet radio) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- `/home/rjasmin/projects/HamMonitor/aprs_logger.py` (header comment: a decoded frame `…>APWW11,WIDE1-1,WIDE2-1:@…`, the frame text form) and `/home/rjasmin/projects/HamMonitor/DESIGN.md` (channel table: APRS 144.800 MHz).
- `/home/rjasmin/projects/KAKA/KK2_Napredne_Krizne_Komunikacije.pptx`, slide "APRS u kriznim uvjetima" (tracking field teams; iGate or RF-only relay).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` Primjer 1 "skriveni čvor u velikoj učionici" and the URM page `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skriveni-cvor.html` (hidden node).
- APRS Protocol Reference 1.0.1 (TAPR/APRS Working Group) and the "New n-N paradigm" WIDEn-N recommendation; AX.25 Link Access Protocol v2.2 §3.12 (address field, has-been-repeated bit). Mark every rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a map-like topology of radio stations with range circles: one or two trackers (T1, T2), a fill-in
  digipeater D1, wide-area digipeaters D2, D3 (and more in a chain for preset 3), and an iGate/receiver
  station R at the far side. Links drawn only between stations in range of each other. A time strip below
  with one slot per step showing who transmits (several in one slot = collision). A packet card shows the
  frame in the text form `SRC>DEST,PATH:info` with each path element marked used (`*`) or unused.
- **State:** `{ slot, stations: [{id, kind: 'tracker'|'fill-in'|'wide'|'igate', x, y, range, aliases, queue:
  [{pkt, readyAt}], heard: [{pktId, slot}]}], packets: [{id, src, dest, path: [{call, used}], info}],
  air: [{station, pktId}], log: [{slot, event: 'tx'|'rx'|'collision'|'dupe'|'deliver', station, pktId}] }`.
- **One step:** one time slot; a packet's airtime is 2 slots (≈ 0.5 s at 1200 bit/s, illustrative). Phases in
  order: (1) every station with a queued packet and `readyAt ≤ slot` that is not already sending senses the
  channel: with CSMA on it waits while it hears any transmission, otherwise it starts; (2) each receiver
  checks every transmission it hears: a packet is received only if no other transmission it hears overlaps
  any of its 2 slots, otherwise both are lost (collision); (3) a digipeater that has just received a packet
  applies the path rules and queues its copy for the next slot; (4) the iGate records delivered packets.
- **Rules:**
  1. Frame: source, destination, then up to 8 path elements in order (AX.25 2.2 §3.12 address field
     *(check)*); a station digipeats only for the first unused element.
  2. Path alias `WIDEn-N` (New-n-N paradigm, APRS Protocol Reference 1.0.1 and the WIDEn-N update *(check)*): a
     wide digipeater responds to WIDE1-1 and WIDE2-N; a fill-in digipeater responds only to WIDE1-1.
  3. On digipeating: insert the digipeater's own call before the alias (traceable); decrement N; if N reaches 0,
     mark the alias used (`WIDEn*`). Example: `WIDE1-1,WIDE2-1` → after D1 `D1,WIDE1*,WIDE2-1` → after D2
     `D1,WIDE1*,D2,WIDE2*` *(check against the spec)*.
  4. Duplicate suppression: a digipeater never repeats a packet (same source, destination and info) it already
     sent or heard digipeated in the last 30 s (= the whole demo) *(check)*.
  5. CSMA: a station defers while it hears the channel busy; two stations that find it idle in the same slot
     both start and collide at every receiver that hears both (radio has no collision detection). Hidden
     stations (out of each other's range) cannot defer for each other (URM ch17 hidden node). Random
     persistence (AX.25 p-persistence) is out of scope; ties are resolved by the presets' ready times.
  6. Ties: stations act in id order only for drawing; transmissions in one slot are simultaneous.
- **Params:** `path` choice `WIDE1-1,WIDE2-1` / `WIDE2-2` / `WIDE7-7` / none (default `WIDE1-1,WIDE2-1`);
  `topology` select of the presets; `csma` toggle (default on); button "T1 sends a beacon" (queues at the next
  slot, `resets: false`).
- **Presets** (expected traces derived by hand from rules 1–6; callsigns fictional):
  1. `two-hops` (path as in the decoded frame quoted in HamMonitor's `aprs_logger.py`, `WIDE1-1,WIDE2-1`):
     T1 → D1 (fill-in) → D2 (wide) → R. 3 transmissions in slots 1–2, 3–4, 5–6; delivered at slot 6 with path
     `D1,WIDE1*,D2,WIDE2*`.
  2. `two-wides`: D2 and D3 both hear D1, cannot hear each other and both reach R → both send in slots 5–6
     and collide at R; nothing delivered. CSMA cannot help a hidden pair.
  3. `wide7` (chain D1…D5, wide digis): `WIDE2-2` → 2 digi transmissions, reaches D2's area, 6 slots;
     `WIDE7-7` → 5 digi transmissions, 12 slots of channel time: a long path floods the channel.
  4. `csma`: T1 and T2 hear each other; T1 ready at slot 1, T2 at slot 2. CSMA on: T2 hears T1 busy, starts at
     slot 3; both delivered by slot 4. CSMA off: T2 starts at slot 2, overlaps T1's second slot → both lost.
  5. `hidden`: T1 and T2 out of each other's range, both ready at slot 1, both in range of D1 → both send in
     slots 1–2, collision at D1; neither is digipeated.
- **Steps:** 6, 6, 12 (`WIDE7-7`), 4, 3 slots.
- **Legend:** tracker (triangle), fill-in digi (small square), wide digi (large square), iGate (diamond),
  transmitting (filled with radiating rings), collision (×), duplicate dropped (crossed copy), used path element
  (`*`, bold). "Changed" marks the path elements rewritten in this step.
- **Captions:**
  - hr: „D1 je *fill-in digipeater*: odgovara na WIDE1-1. Umeće svoj pozivni znak, a WIDE1-1 postaje WIDE1*.
    U sljedećem odsječku paket nastavlja s putem WIDE2-1.“
  - en: "D1 is a fill-in digipeater: it answers WIDE1-1. It inserts its call sign and WIDE1-1 becomes WIDE1*.
    In the next slot the packet goes on with WIDE2-1."
- **Terms:** digipeater — digipeater (50ohm); path / alias — put / zamjensko ime (check); beacon — beacon
  (svjetionik, check); collision — sudar (kolizija, URM ch07); hidden node — skriveni čvor (URM ch17); carrier
  sense — osluškivanje kanala (check); iGate — iGate.
- **Misconceptions:** a longer path is more reliable (preset 3); CSMA prevents collisions (presets 2, 5);
  digipeaters forward everything they hear (rule 4).
- **Out of scope:** AX.25 connected mode, the APRS-IS internet side, position and telemetry formats, HAMNET/IP
  routing (50ohm `paketvermittelte_netzwerke`), AFSK details (`fsk-psk-ask`).
- **Note for the coordinator:** the catalogue seed 50ohm `paketvermittelte_netzwerke` is about HAMNET and IP
  packet switching, not APRS; the APRS material in 50ohm is in `afsk.md` and `relaisfunkstellen.md`.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `packet-aprs` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh packet-aprs sims/packet-aprs` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/packet-aprs/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
