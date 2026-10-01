# static-default-route: Static and default routes

| | |
|---|---|
| Task | `static-default-route` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-static-default-route` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/static-default-route/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `routing-table` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **how a default route catches everything, and routing loops**.

The student: add routes on three routers, send packets.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/routing-table/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` §"Usmjeravanje: kako paket pronalazi put kroz mrežu" (statički put, zadani put, najdulji prefiks; Šire o temi: TTL ends a loop), Primjer 2 (four matching routes), Primjer 3 (sastavljanje tablica za dva usmjernika, a–c), Pitanja 18; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch11-najdulji-prefiks.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-usmjeravanja.html` (table vocabulary)
- RFC 1812 §2.2.5.2, §4.3.2.7, §5.2.7.1, §5.3.1; RFC 792; CARNET CERT, *Osnove mrežnog usmjeravanja* (CCERT-PUBDOC-2007-02-183) §7.1; Cisco Networking Academy, *Routing and Switching Essentials*, "Routing Concepts"
- Catalogue seed: URM ch11

## Model and presets

- **Scene:** chain A — R1 — R2 — R3 — "internet" (ISP), B behind R2, with each router's routing table under it (table view, matching row lit). A packet moves hop by hop (K2 topology once it exists). Addresses: A 192.168.1.10/24, B 192.168.2.20/24, R1–R2 link 192.168.100.0/30 (book ch11 Primjer 3); R2–R3 192.168.100.4/30 and R3–ISP 203.0.113.0/30 derived.
- **State:** `{ tables:{R1:[],R2:[],R3:[]}, packet:{src,dst,ttl,kind:'echo'|'reply'|'icmp'}, at, path:[], outcome:null|'delivered'|'no-route'|'ttl-expired', icmp }`.
- **One step:** the packet is processed at one node: look up the destination (connected, static, default; longest prefix), decrement TTL, forward to the next hop or drop. A reply or ICMP message starts as a new packet in the next step.
- **Rules:**
  1. A router knows its directly connected networks without any entry (book ch11 "Usmjeravanje", Primjer 3a).
  2. A static route is entered by hand and changes only by hand (book ch11; CARNET *Osnove mrežnog usmjeravanja* §7.1).
  3. The default route `0.0.0.0/0` matches every address and is used only when nothing more specific matches (book ch11; RFC 1812 §2.2.5.2; Cisco *Routing and Switching Essentials*, "Routing Concepts").
  4. Several matches: the longest prefix wins, regardless of table order (book ch11 Primjer 2; RFC 1812 §2.2.5.2).
  5. No match and no default: drop, ICMP Destination Unreachable (type 3, code 0 net unreachable) to the packet's source (RFC 792; RFC 1812 §5.2.7.1; book ch11 Primjer 3b).
  6. Each router decrements TTL by 1 before forwarding; at 0 it drops and sends Time Exceeded to the source (RFC 1812 §5.3.1; book ch11 "Šire o temi": the loop dies on TTL).
  7. Routing works per direction: a reply needs its own route back (book ch11 Primjer 3b).
  8. An ICMP error is never sent about an ICMP error (RFC 1812 §4.3.2.7 (check)); if the source is unreachable the error is just dropped.
  9. Tie-break: two routes with the same prefix length: not allowed in this model (the add-route control refuses a duplicate prefix with a reason in the caption); metric and administrative distance are out of scope.
- **Params:** toggles for routes the student can add: `r1Static` (R1: 192.168.2.0/24 via 192.168.100.2), `r2Static` (R2: 192.168.1.0/24 via 192.168.100.1), `r1Default` (R1: 0/0 via R2), `r2Default` (R2: 0/0 via R3), `r3Default` (R3: 0/0 via ISP), `r3Back` (R3: 0/0 via R2, the mistake); `dst` choice `B | 8.8.8.8 | 198.51.100.7`, default B; `ttl` range 4–64, default 64 (presets lower it so a loop stays under 20 steps; real hosts start at 64 or 128 (check)).
- **Presets (5):**
  1. `both-ways` — Primjer 3a: r1Static + r2Static, ping A → B: request A→R1→R2→B, reply B→R2→R1→A, delivered. From book ch11 Primjer 3.
  2. `one-way` — Primjer 3b: only r1Static: the request reaches B; the reply dies at R2 (no route to 192.168.1.0/24), R2's unreachable goes to B, A sees silence. From book ch11 Primjer 3.
  3. `default` — Primjer 3c: r1Default instead of r1Static + r2Static: same result as 1; traffic to 192.168.1.0/24 still leaves on Gi0/0 because /24 beats /0. From book ch11 Primjer 3.
  4. `to-internet` — r1Default, r2Default, r3Default, dst 8.8.8.8: R1 → R2 → R3 → ISP, each by its default route. Derived.
  5. `loop` — r2Default and r3Back, dst 198.51.100.7, TTL 8: R1 (8→7), R2 (→6), R3 (→5), R2, R3, R2, R3, R2 (1→0) drops it and sends Time Exceeded to A. 8 routers handle it. Derived from RFC 1812 §5.3.1.
- **Steps:** both-ways 6, one-way 6, default 6, to-internet 5, loop 11 (8 forwards + 3 for the ICMP back).
- **Legend:** request (`--c1`), reply (`--c2`), ICMP error (`--danger`, dashed); route kinds in the table: connected (C), static (S), default (S*) as text tags, not colour only; "changed" = the matched row and the TTL on the packet.
- **Captions:**
  - hr: „R2 traži `192.168.1.10`: nema zapisa ni *default route* (zadanog puta), pa odgovor odbacuje. Zahtjev je do B stigao, ali A ne vidi ništa."
  - en: "R2 looks up `192.168.1.10`: no entry and no default route, so it drops the reply. The request reached B, but A sees nothing."
- **Terms:** static route — statički put; default route — zadani put; directly connected network — izravno spojena mreža; next hop — sljedeći skok; routing table — tablica usmjeravanja; longest prefix match — najdulji podudarajući prefiks; routing loop — petlja usmjeravanja; time to live — vrijeme života (TTL).
- **Misconceptions:** the default route is tried first; if the request arrives, the route is fine (the return path is separate); a routing loop makes a packet circle forever.
- **Reused from `routing-table`:** the table view and the LPM lookup with the same column names. New: three routers, hop-by-hop forwarding with TTL, ICMP errors, route toggles.
- **Out of scope:** dynamic routing (`distance-vector`, `link-state-spf`), metrics and administrative distance, recursive next-hop lookup, floating static routes, NAT at R3.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `static-default-route` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh static-default-route sims/static-default-route` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/static-default-route/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
