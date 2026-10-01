# wifi-association: 802.11 association step by step

| | |
|---|---|
| Task | `wifi-association` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-wifi-association` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/wifi-association/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `wifi` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **scan, authenticate, associate, then the 4-way handshake**.

The student: step a station joining an AP.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` (Uvod u računalne mreže): "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje" (BSS, distribution system, passive/active scanning, authentication then association), "Sigurnost bežične mreže: od otvorenog pristupa do WPA3" (Open System authentication), Primjer 2 (redoslijed pridruživanja iz zabilježenog prometa)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch17-pridruzivanje-koraci.svg` (the solution of Primjer 2) and `ch17-bss-distribucijski-sustav.svg`
- IEEE 802.11-2020 (management frames, §9.4.1.9 status codes, §12.4 SAE); Diepstraten and Belanger, IEEE P802.11-96/49C (scanning and association sequence, cited by URM ch17)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 10 "Bežične mreže", card "pridruživanje, korak po korak"
- Catalogue seed: URM card ch17-pridruzivanje-koraci; feeds net-wpa-handshake

## Model and presets

- **Scene:** a station STA and two access points with the same SSID `Grafo`: AP1 on channel 6 (−45 dBm)
  and AP2 on channel 11 (−70 dBm), plus AP3 `Kafic` on channel 1. Each AP shows BSSID, SSID, channel and
  security (Open / WPA2-Personal / WPA3-Personal). Below: a K1-style sequence of management frames (lanes
  STA, AP1, AP2) and a **state ladder** on STA: not authenticated → authenticated → associated → keys
  (WPA only) → data. A scan list on STA fills as Beacons and Probe Responses arrive.
- **State:** `{ phase, scanMode: 'active'|'passive', heard: [{bssid, ssid, ch, rssi, sec}], chosen,
  staState, frames: [{type, from, to, ch}], aid, status }`.
- **One step:** one frame exchange or decision, in this order: scan (Probe Request, or wait for Beacons)
  → responses heard → choose an AP → Authentication → Association Request → Association Response → (WPA:
  the 4-way handshake as one collapsed step that links to `wpa-handshake`) → data allowed.
- **Rules:**
  1. Scanning is passive (listen for the Beacons an AP sends periodically) or active (send a Probe Request
     on each channel, wait for Probe Responses); both give the same information, including the SSID (URM
     `17-bezicne-mreze.md` "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje").
  2. Every AP that hears the probe answers; the station then chooses one. The choice (usually the strongest
     signal) is the client's, not fixed by the standard (URM ch17 "Station selects best AP"; check).
  3. Authentication always comes before association, never the reverse (URM ch17 Primjer 2).
  4. With WPA2-Personal the Authentication exchange is Open System: it lets any client in and is not the
     security step (URM ch17 "Sigurnost bežične mreže", Vanhoef §2.2). With WPA3-Personal, SAE runs in the
     Authentication frames instead (Commit and Confirm each way) (IEEE 802.11-2020 §12.4; check).
  5. Association Request → Association Response; status 0 = success and the AP assigns an association ID
     (AID); the AP informs the distribution system (URM ch17; IEEE 802.11-2020 §9.4.1.9 status codes, check).
  6. On a WPA network no data frames pass until the 4-way handshake has installed keys; on an Open network
     data flows right after association, unencrypted (URM ch17 "Sigurnost bežične mreže").
- **Params:** `scan` choice active | passive (default active); `security` choice open | wpa2 | wpa3
  (default wpa2); `reject` toggle (the AP refuses the association; default off).
- **Presets:**
  1. `book-order` — URM ch17 Primjer 2: Probe Request → Probe Response (AP1, AP2) → Authentication →
     Association Request → Association Response → (handshake) → data. From URM ch17 Primjer 2.
  2. `passive` — STA listens; Beacons from AP3, AP1, AP2 fill the list; then as preset 1. Derived.
  3. `choose-best` — both `Grafo` APs answer; STA picks AP1 (−45 dBm over −70 dBm). Derived (check rule 2).
  4. `open-network` — Open security: association then data at once, no handshake step; the caption says
     anyone in range can read the traffic (URM ch17). Derived.
  5. `wpa3` — the Authentication step carries SAE Commit/Confirm instead of Open System. Derived (check).
  6. `rejected` — Association Response with a non-zero status: STA stays authenticated, not associated,
     and tries AP2. Derived (check status code).
- **Steps:** `book-order` 8, `passive` 9, `choose-best` 8, `open-network` 7, `wpa3` 9, `rejected` 11.
- **Legend:** management frame (solid arrow, labelled), broadcast probe (dashed to all), state ladder rung
  (filled when reached); security badge per AP; "changed" marks the newest frame and the rung it reached.
- **Captions:**
  - hr: "Stanica šalje *Association Request* (zahtjev za pridruživanje) AP1 tek nakon uspješne
    autentikacije. Autentikacija uvijek prethodi pridruživanju."
  - en: "Both APs named Grafo answered the probe. The station, not the network, decides which to join; it
    picks AP1, the stronger signal."
- **Terms:** association — pridruživanje (mreži); beacon — signalni okvir (*beacon*); probe request /
  response — sonda / odgovor na sondu; authentication — autentikacija; access point — *access point*;
  basic service set (BSS) — osnovni skup usluga (BSS); distribution system — distribucijski sustav; SSID —
  SSID (mrežno ime).
- **Misconceptions:** association comes first and then authentication; the Open System "authentication"
  step protects the network; the AP chooses which client to serve.
- **Out of scope:** the 4-way handshake and key derivation (`wpa-handshake`); 802.1X/EAP; roaming and
  reassociation (`net-wifi-roaming`); channel planning (`net-wifi-channels`); CSMA/CA.
- **Note for the coordinator:** the catalogue concept ends with "then the 4-way handshake", which is
  `wpa-handshake`'s concept; this spec collapses it to one linked step to keep one concept per page.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh wifi-association sims/wifi-association` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/wifi-association/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
