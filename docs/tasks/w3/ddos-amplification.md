# ddos-amplification: DRDoS amplification

| | |
|---|---|
| Task | `ddos-amplification` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-ddos-amplification` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/ddos-amplification/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM, SEC |
| Topic / tags / level | `internet` / `attacks` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **spoofed small requests become large replies at the victim**.

The student: pick protocols, see the amplification factor.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` (Uvod u računalne mreže): "Prijetnje i napadi: od zloćudnog koda do čovjeka u sredini" (DoS, DDoS, amplification through public UDP services, BAF = reply bytes / request bytes; footnote `cisa-drdos`), its "Šire o temi" (why filtering one address does not help) and Pitanja 6; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch18-drdos-pojacavanje.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", card 11 "Sigurnost" (DRDoS i faktor pojačanja)
- US-CERT/CISA Alert TA14-017A "UDP-Based Amplification Attacks" (2014, updated 2018), the BAF table (as cited in URM ch18)
- RFC 2827 / BCP 38 "Network Ingress Filtering"
- Catalogue seed: URM card ch18 (DRDoS)

## Model and presets

- **Scene:** the URM ch18 diagram as a live picture: a sender on the left whose small requests carry the victim's address as their source, a row of public UDP services ("reflectors") in the middle, the victim on the right with its access link drawn as a pipe of fixed capacity. Arrow widths are proportional to bit rate: thin requests in, thick replies out. A gauge on the victim's link shows load against capacity. A defence panel lists what would stop each part (source-address filtering at the sender's network, closing or rate-limiting the reflectors).
- **State (explorer):** derived from params: `{ baf, sentMbps, reflectedMbps, victimCapacity, load, saturated, defences: { ingressFiltering, reflectorsClosed, rateLimit } , effectiveMbps }`.
- **What the params drive live:** the service class (and with it the amplification factor), the sender's rate, the victim's link capacity and the defences; arrow widths, the gauge and the caption update at once.
- **Rules:**
  1. A reflected, amplified attack uses publicly reachable UDP services: a request whose source address is forged to be the victim's makes the service send its reply to the victim, not to the sender (URM ch18 "Prijetnje i napadi"; CISA alert TA14-017A as cited there).
  2. The bandwidth amplification factor (BAF) = UDP payload bytes of the reply / UDP payload bytes of the request (URM ch18, footnote `cisa-drdos`).
  3. Traffic at the victim = traffic sent × BAF (summed over reflectors; header overhead ignored, stated on the page).
  4. The victim's link is saturated when that traffic ≥ its capacity; legitimate traffic then competes for what is left (model: shown as "saturated", no queueing detail).
  5. UDP is used because it has no handshake: the service cannot tell that the source address is forged (URM ch13 UDP vs TCP; URM ch18).
  6. Defences act on different factors: filtering forged source addresses at the sender's network removes the forged requests entirely (BCP 38 / RFC 2827); closing or rate-limiting public services lowers the reflected rate; filtering at the victim does not help once its own link is full (URM ch18: "filtriranje jedne adrese ne pomaže kad ih napada tisuće odjednom").
- **Params:** choice `service` with BAF values taken from the CISA alert table (e.g. "DNS (open resolver)", "NTP", "SNMPv2", each with the alert's figure, check every value against TA14-017A), default DNS; range `sentMbps` 1–100, default 10; range `victimMbps` 100–10000, default 1000; toggles `ingressFiltering`, `reflectorsClosed`, `rateLimit` (halves the reflected rate, an illustrative value), default off.
- **Presets** (arithmetic from rule 3; BAF values to be checked against the alert):
  1. `book-dns` — URM ch18 Pitanja 6 setting: a DNS service with BAF "several tens" (use the alert's value, e.g. ~50): 10 Mbit/s sent → ~500 Mbit/s at the victim; a 1 Gbit/s link is at ~50 %.
  2. `saturation` — same service, victim link 100 Mbit/s: ~500 Mbit/s offered, link saturated five times over.
  3. `larger-factor` — a service with a BAF in the hundreds (from the alert): the same 10 Mbit/s exceeds a 1 Gbit/s link.
  4. `ingress-filtering` — preset 2 with source-address filtering at the sender's network: forged requests never leave, victim traffic 0.
  5. `victim-side-filter` — preset 2 with a filter at the victim's edge only: the link is still full (rule 6).
- **Steps:** none (explorer).
- **Legend:** request arrows thin and dashed (forged source shown as a mask icon on the packet), reply arrows solid with width ∝ rate, gauge with a threshold mark, defence switches with labels; "changed" marks the arrows and gauge that changed with the last param change.
- **Captions:** hr: "Faktor pojačanja propusnosti je 50: svaki bajt upita postaje 50 bajtova odgovora. 10 Mbit/s lažiranih upita stiže žrtvi kao oko 500 Mbit/s odgovora." en: "The bandwidth amplification factor is 50: every byte of request becomes 50 bytes of reply. 10 Mbit/s of forged requests reach the victim as about 500 Mbit/s of replies."
- **Terms:** *denial of service (DoS)* — uskraćivanje usluge; *distributed DoS (DDoS)* — distribuirano uskraćivanje usluge; *amplification* — pojačavanje; *bandwidth amplification factor* — faktor pojačanja propusnosti; *spoofed source address* — lažirana izvorišna adresa; *reflector* — reflektor (check); *ingress filtering* — filtriranje na ulazu (check).
- **Misconceptions:** "the attacker needs as much bandwidth as the victim"; "blocking the attacker's address stops it" (the packets come from thousands of legitimate servers); "the reflectors are the attackers".
- **Out of scope:** how to find or use reflectors, attack tooling, botnets, real incidents, scrubbing services by name; the page shows the arithmetic and the defences only.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ddos-amplification sims/ddos-amplification` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ddos-amplification/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
