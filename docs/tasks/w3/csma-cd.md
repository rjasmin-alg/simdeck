# csma-cd: CSMA/CD and binary exponential backoff

| | |
|---|---|
| Task | `csma-cd` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-csma-cd` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/csma-cd/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `ethernet` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **collisions on a shared bus and how backoff resolves them**.

The student: step stations transmitting at once.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra" (kolizija, kolizijska domena, CSMA/CD only in half duplex, why the 64-octet minimum), Primjer 3 (counting collision domains), Primjer 4 (je li CSMA/CD uopće u pogonu: full duplex)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` "Što treba znati" (opening paragraph: CSMA/CD listens to its own signal; contrast with CSMA/CA)
- IEEE Std 802.3, clause 4 (MAC: half duplex), 4.2.3.2 (deference, collision handling, jam, truncated binary exponential backoff, attemptLimit 16, backoffLimit 10) and 4.4.2 (slotTime 512 bit times, interFrameGap 96 bit times, jamSize 32 bits) *(check: no local copy; numbers from standard textbooks, e.g. Kurose & Ross, Computer Networking, §6.3 "Multiple Access Links and Protocols")*
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 3 "Preklopnik" (card "kolizijska i broadcast domena, CSMA/CD")
- Catalogue seed: URM card ch07

## Model and presets

- **Scene:** a shared half-duplex bus (or a hub drawn as a bus) with 2–4 stations A–D, each with a small
  status badge (idle, sensing, sending, jamming, backoff k/slots left, done, gave up) and an attempt counter
  n. Above the bus a **slot timeline**: one column per slot time, one row per station, showing what each
  station did in that slot (send, collide, jam, wait). The medium itself is drawn idle / busy / collision.
  Uses the kit's time axis if it exists; otherwise its own grid (say so in NOTES.md).
- **State:** `{ slot, medium: 'idle'|'busy'|'collision', stations: [{ id, queued, phase, attempt,
  backoffLeft, sentSlots, delivered, gaveUp }], log: [] }`. Random backoff draws come from a preset's
  scripted list `draws[station][attempt]` or, if absent, a seeded PRNG (`seed` param), so every run replays.
- **One step:** one slot time. Phases within a step, in this order: (1) stations with `backoffLeft = 0`
  and a frame ready sense the medium; (2) all stations that decided to send start in the same slot;
  (3) the medium resolves: 0 senders idle, 1 sender busy, ≥ 2 collision; (4) on collision every sender
  jams, increments n and draws k; (5) waiting stations count `backoffLeft` down by one; (6) caption.
  A successful frame occupies `frameSlots` slots (default 2; abstract, not 64 B-exact).
- **Rules:**
  1. Carrier sense: a station sends only when it senses the medium idle; if busy, it defers and sends as soon
     as the medium goes idle (1-persistent) (URM ch07 "CSMA/CD … osluškuje je li medij zauzet prije nego
     pošalje"; IEEE 802.3 4.2.3.2.1 deference; 1-persistence *(check)*).
  2. Two stations that both sense idle in the same slot both send → collision; neither frame is readable
     (URM ch07 "kolizija").
  3. Collision detection: a sender notices the collision while still sending (it compares what it sends with
     what it hears), stops and sends a 32-bit jam so every station sees the collision (URM ch17 opening
     paragraph; jam size IEEE 802.3 4.4.2 *(check)*).
  4. Truncated binary exponential backoff: after the n-th collision of a frame, wait k slot times, k drawn
     uniformly from 0 … 2^min(n,10) − 1 (IEEE 802.3 4.2.3.2.5 *(check)*). So n=1 → {0,1}, n=2 → {0..3},
     n=3 → {0..7}.
  5. After 16 attempts the frame is dropped ("excessive collisions") and reported to the layer above (IEEE
     802.3 attemptLimit 16 *(check)*).
  6. The attempt counter n resets to 0 after a successful frame; a station's next frame starts fresh.
  7. Tie-break: if two colliding stations draw the same k, they collide again in that slot (rule 2); this is
     the expected path, not an error. Lower station id does **not** win; nothing breaks ties but the draw.
  8. Edge case: in full duplex there is no contention, so CSMA/CD never acts and no collision is possible
     (URM ch07 Primjer 4; IEEE 802.3 clause 4 half duplex only).
  9. Slot time = 512 bit times (51.2 µs at 10 Mb/s), which is why a frame must be at least 64 octets: the
     sender must still be sending when the collision news returns (URM ch07, paragraph on 64 octets;
     IEEE 802.3 4.4.2 *(check)*). Shown in the explanation, not modelled in time.
- **Params:** `stations` range 2–4 (default from preset); `duplex` choice `half`|`full` (default `half`);
  `seed` range 1–99 (default 7, used only when the preset has no scripted draws); `frameSlots` range 1–4
  (default 2); button `newDraw` (key `N`) re-seeds.
- **Presets:**
  1. `two-collide` — A and B both ready in slot 0 → collision; n=1, draws A=0, B=1 → A sends in slot 1–2,
     B defers (medium busy in slot 1) and sends in slot 3–4. 2 frames delivered, 1 collision. Rules 2–4;
     derived, unchecked.
  2. `same-draw` — as 1 but draws A=1, B=1 → second collision in slot 2; n=2, draws A=3, B=0 → B sends,
     A waits 3 and sends after. 2 collisions, shows the range doubling to 0…3 (rule 4, tie-break rule 7).
     Derived, unchecked.
  3. `wait-then-crash` — C is sending; A and B become ready while the medium is busy, both defer, both send
     the moment it goes idle → collision, then backoff resolves it (rule 1, 1-persistent). Derived, unchecked.
  4. `three-stations` — A, B, C collide; n=1 draws 0,1,1 → A sends, B and C collide again; n=2 draws 2,0 →
     B and C wait 1, find A's frame on the medium, defer and both send when it ends (rule 1) → second collision; n=2 draws B=2, C=0 → C then B. 3 frames, 2 collisions. Derived, unchecked.
  5. `full-duplex` — URM ch07 Primjer 4: one computer on its own switch port, full duplex; A and the switch
     both send in slot 0, both arrive, no collision, CSMA/CD idle. From URM ch07 Primjer 4.
- **Steps:** one per slot plus the start, with `frameSlots` = 2: 6 (`two-collide`, slots 0–4), 9
  (`same-draw`, slots 0–7), 8 (`wait-then-crash`, slots 0–6), 9 (`three-stations`, slots 0–7; second
  collision in slot 3, C sends 4–5, B 6–7), 3 (`full-duplex`). Derived; check with a script.
- **Legend:** station colours c1–c4 with letter labels; medium idle (hollow), busy (solid), collision
  (hatched, zig-zag icon); backoff slots (dotted); "changed" marks the station(s) whose phase changed this
  slot and the new timeline column.
- **Captions:**
  - hr: "Kolizija u odsječku 2: A i B su izvukli isti k = 1. Ovo je druga kolizija (n = 2), pa sada biraju k
    između 0 i 3."
  - en: "The medium is busy with C's frame, so A and B defer. Both are 1-persistent: the moment it goes idle,
    both send, and they collide."
- **Terms:** collision — kolizija; collision domain — kolizijska domena; carrier sense — osluškivanje medija;
  half duplex / full duplex — polu-dupleks / puni dupleks; binary exponential backoff — binarno eksponencijalno
  odustajanje *(check: not in the book; propose)*; slot time — vremenski odsječak *(check)*; jam signal —
  signal ometanja *(check)*; shared medium — dijeljeni medij.
- **Misconceptions:** CSMA/CD prevents collisions (it only detects and recovers; carrier sense cannot stop
  two stations that sense idle together); "CSMA/CD was replaced by something better" (URM ch07 question 11: in
  full duplex it simply has nothing to do); the backoff range is fixed.
- **Out of scope:** exact bit-time propagation along the cable, the capture effect, frame format (`net-ethernet-frame`),
  collision-domain counting (`net-domains`), Wi-Fi (`net-csma-ca-rts-cts`).

**Note for the coordinator:** the URM book has no backoff numbers (slot time, 2^n range, 16 attempts); all
come from IEEE 802.3 via textbooks and are marked *(check)*. Croatian terms for backoff, slot time and jam
are proposals, not book terms.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh csma-cd sims/csma-cd` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/csma-cd/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
