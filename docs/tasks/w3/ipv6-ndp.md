# ipv6-ndp: NDP instead of ARP

| | |
|---|---|
| Task | `ipv6-ndp` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-ipv6-ndp` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/ipv6-ndp/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `ipv6` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ipv6-slaac` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **neighbour solicitation to the solicited-node multicast**.

The student: step an IPv6 neighbour lookup next to ARP.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/ipv6-slaac/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` §"Vrste IPv6 adresa…", Šire o temi (NDP = ARP + RDISC + Redirect, RFC 4861 quote), Primjer 1 (address `fe80::204:61ff:fe9d:f156`)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` §"ARP: od IP adrese do MAC adrese", Primjer 5 (A, B, C on 192.168.1.0/24); diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch08-arp-zahtjev-odgovor.svg`
- RFC 4861 §1, §4.3, §4.4, §7.1.1–7.1.2, §7.2.1–7.2.5, §7.3.2, §10 (constants); RFC 4291 §2.7.1 (solicited-node); RFC 2464 §7 (33:33 multicast MAC); RFC 826 (ARP)
- Catalogue seed: URM ch10; pairs with net-arp-local-remote

## Model and presets

- **Scene:** two lanes on the same screen, one link each: top IPv4 (A, B, C on 192.168.1.0/24, book ch08 Primjer 5), bottom IPv6 (A, B, C with link-local addresses). Per host: its NIC filter (which destination MACs it accepts) and its ARP table / neighbour cache. Frames move on the link (K2 topology once it exists); a counter per lane: "hosts whose CPU had to look at the request".
- **State:** `{ v4: {frames:[], arp:{host:{ip:mac}}, inspected:[hosts]}, v6: {frames:[], cache:{host:{ip:{mac,state}}}, groups:{host:[mcast]}, inspected:[hosts]}, phase }`.
- **One step:** one event, IPv4 and IPv6 events alternate so the two lookups line up: lookup miss → request sent → who accepts it → who answers → reply → cache entry.
- **Rules:**
  1. ARP request goes to `ff:ff:ff:ff:ff:ff`; every host on the segment accepts and inspects it; only the owner of the target IP replies, unicast; the requester (and the target) cache the sender (book ch08 "ARP"; RFC 826).
  2. Every IPv6 address a host has makes it join that address's solicited-node group `ff02::1:ff` + low 24 bits of the address (RFC 4291 §2.7.1; RFC 4861 §7.2.1).
  3. A multicast IPv6 packet goes to MAC `33:33` + low 32 bits of the destination address (RFC 2464 §7). A NIC accepts only multicast MACs of groups it joined; others drop it in hardware.
  4. Neighbour solicitation (ICMPv6 type 135) to the target's solicited-node address, hop limit 255, with the sender's link-layer address option; the entry is created INCOMPLETE (RFC 4861 §4.3, §7.2.2, §7.3.2).
  5. A host that accepts an NS answers only if the target address is its own (RFC 4861 §7.2.3). Tie-break: two hosts sharing the low 24 bits both accept the NS; only the target answers.
  6. Neighbour advertisement (type 136) is unicast to the solicitor, S = 1, O = 1, R = 0 for a host, with the target link-layer address; the entry becomes REACHABLE (RFC 4861 §4.4, §7.2.4, §7.2.5).
  7. Receivers drop NDP messages with hop limit ≠ 255 (RFC 4861 §7.1.1, §7.1.2): an off-link sender cannot forge them.
  8. No answer: NS retransmitted every RetransTimer 1000 ms up to MAX_MULTICAST_SOLICIT = 3, then the entry is deleted and the sender gets "address unreachable" (RFC 4861 §7.2.2, §10).
  9. NDP replaces ARP, ICMP router discovery and redirect in one protocol (book ch10 Šire o temi; RFC 4861 §1); only address resolution is shown here.
- **Params:** `target` choice `B | C | absent`, default `B`; `collide` toggle (C shares B's low 24 bits), default off; `lanes` choice `both | v6`, default `both`.
- **Presets (4):**
  1. `side-by-side` — A resolves B: ARP broadcast inspected by B and C (2 hosts), reply from B; NS to `ff02::1:ff9d:f156`, MAC `33:33:ff:9d:f1:56`, inspected by B only (1 host), NA from B, A's cache `fe80::204:61ff:fe9d:f156 → 00:04:61:9d:f1:56 REACHABLE`. IPv4 numbers from book ch08 Primjer 5; B's IPv6 address from book ch10 Primjer 1; MAC (EUI-64 reversed, U/L bit flipped) and group derived.
  2. `same-group` — C = `fe80::1234:56ff:fe9d:f156` joins the same group; both B and C accept the NS, C checks the target and stays silent (rule 5). Derived, unchecked.
  3. `absent` — target `fe80::99` not on the link: 3 NS 1 s apart, no NA, entry deleted, "address unreachable". Derived from RFC 4861 constants.
  4. `forged` — an NA arriving with hop limit 64 is dropped (rule 7). Derived.
- **Steps:** side-by-side 12, same-group 8, absent 8, forged 5.
- **Legend:** broadcast frame (`--c1`, dashed to all), multicast frame (`--c2`, to group members), unicast frame (`--c3`, solid); host shape filled = inspected the request, hollow = NIC filtered it; "changed" = cache rows and the counter changed in this step.
- **Captions:**
  - hr: „IPv4: ARP zahtjev ide *broadcast*om, pa ga moraju pogledati i B i C. IPv6: *neighbour solicitation* (traženje susjeda) ide na `ff02::1:ff9d:f156`, i C ga odbacuje već na mrežnoj kartici."
  - en: "IPv4: the ARP request is a broadcast, so B and C both have to look at it. IPv6: the neighbour solicitation goes to `ff02::1:ff9d:f156`, and C's network card drops it."
- **Terms:** Neighbor Discovery Protocol — otkrivanje susjeda (NDP); neighbour solicitation — traženje susjeda (check); neighbour advertisement — objava susjeda (check); solicited-node multicast address — multicast adresa traženog čvora (check); neighbour cache — tablica susjeda (check); ARP request / reply — ARP zahtjev / ARP odgovor; ARP table — ARP tablica; link-local address — link-local adresa.
- **Misconceptions:** IPv6 uses ARP; NDP still broadcasts (IPv6 has no broadcast); every host on the link processes every NS.
- **Reused from `ipv6-slaac`:** link, hosts, interface IDs, multicast-group joining and the NS/NA message objects (DAD uses the same NS with source `::`). New: neighbour cache states, the NIC filter, the IPv4 lane (copy from `arp-local-remote` if merged, per COMMON §6).
- **Out of scope:** DAD (in `ipv6-slaac`), router solicitation/advertisement, redirect, NUD timers after REACHABLE (STALE/DELAY/PROBE named but not stepped), MLD joins on the wire, SEND.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ipv6-ndp` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ipv6-ndp sims/ipv6-ndp` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipv6-ndp/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
