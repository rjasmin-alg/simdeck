# link-state-spf: Link state and Dijkstra

| | |
|---|---|
| Task | `link-state-spf` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-link-state-spf` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/link-state-spf/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **LSA flooding builds one map; SPF picks paths**.

The student: step Dijkstra on a weighted graph; change a cost.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (Uvod u računalne mreže): "Dinamičko usmjeravanje: kad tablicu gradi mreža sama" → "Što treba znati" (protokoli stanja veze: each router sends only its own links, everyone builds the same picture and computes shortest paths; OSPF, RFC 2328) and → "Šire o temi" (faster convergence, Dijkstra on the shared database); "Usmjeravanje: kako paket pronalazi put kroz mrežu" → "Što treba znati" (**metrika**). The chapter has no worked SPF example; the graph below is derived.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch11-*.svg` (none shows link state; use for style only)
- RFC 2328 "OSPF Version 2": §2 (link-state database, shortest-path tree), §13 (flooding; §13.1 newer LSA by sequence number), §16.1 (Dijkstra, equal-cost multipath next hops); Dijkstra, "A note on two problems in connexion with graphs" (1959)
- CARNET CERT, *Osnove mrežnog usmjeravanja*, §7.6 and §9.4 (quoted in the chapter)
- Catalogue seed: URM ch11 → §5.11

## Overlaps (catalogue §5)

- **§5.11 Routing protocols:** Separate pages on one graph view.

## Model and presets

- **Scene:** a weighted graph of five routers A–E (K2 topology view once it exists): links A–B 2, A–C 5, B–C 1, B–D 4, C–D 1, C–E 6, D–E 2. Beside each router a small LSDB box (which routers' LSAs it holds, with sequence numbers). For the SPF phase, a Dijkstra table for the source router (columns: router, distance, next hop, state tentative/final) and the shortest-path tree drawn thick on the graph. At the end, the source's routing table (destination, cost, next hop).
- **State:** `{ phase: 'originate'|'flood'|'spf'|'table', lsdb: {router: {origin: seq}}, inFlight: [{lsa, from, to}], dist: {r: n|null}, nextHop: {r: [r]}, final: [r], tree: [[a,b]], table: [{dest, cost, via}] }`.
- **One step:** flooding phase: one flood round (every router forwards the LSAs it received in the previous round to all neighbours except the one it came from). SPF phase: one router becomes final (the tentative router with the smallest distance), then its neighbours are relaxed. Order within an SPF step: pick → mark final → relax neighbours → update the tree → caption.
- **Rules:**
  1. Each router originates one LSA listing only its own links and their costs (URM ch11 "Dinamičko usmjeravanje", CARNET §7.6; RFC 2328 §12).
  2. Flooding: a router that receives an LSA newer than the copy it holds (higher sequence number, RFC 2328 §13.1) stores it and sends it on all other links; an LSA it already holds is dropped, not forwarded (RFC 2328 §13). Flooding ends when every LSDB holds all five LSAs; then all LSDBs are identical (URM ch11, RFC 2328 §2: "each router maintains an identical database").
  3. Each router runs SPF on its own copy; the page shows it for the selected `source` (URM ch11 "Šire o temi": Dijkstra).
  4. Dijkstra: start with source = 0; repeatedly make final the tentative router with the smallest distance; for each neighbour, if distance via it is smaller, replace distance and next hop (RFC 2328 §16.1).
  5. Tie-break when choosing the next router: equal distances → the lower router ID (alphabetical) first (simulation rule, derived; the outcome does not depend on it).
  6. Equal-cost paths: if a neighbour is reached at the **same** distance by another path, keep both next hops (ECMP; RFC 2328 §16.1). The routing table shows both.
  7. Next hop of a destination = the first router after the source on its shortest path; for a direct neighbour, itself.
  8. Cost change or link failure: the two routers at the ends of that link originate new LSAs with sequence + 1; they flood (rule 2) and every router reruns SPF (RFC 2328 §13, §16).
  9. Metric = configured link cost (URM ch11 "metrika"); costs are 1–10 in this sim; vendor default "reference bandwidth / interface bandwidth" is named in the explanation only *(check)*.
- **Params:** `source` choice A–E, default A; `costBC` range 1–10, default 1 (the cost the student changes); `fail` choice `none` | `C-D` | `B-D`, default `none`; `showFlood` toggle (skip straight to SPF when off), default on.
- **Presets:** (graph and numbers derived, computed by script; unchecked against a router)
  1. `spf-from-a` — originate, 2 flood rounds (the graph's hop diameter is 2), then Dijkstra from A: finals in order A 0, B 2, C 3 (via B, beats A–C 5), D 4 (via C, beats B–D 6), E 6 (via D, beats C–E 9). Every destination's next hop is **B**. Table: B 2, C 3, D 4, E 6, all via B.
  2. `cost-change` — B–C cost 1 → 5: B and C send new LSAs (seq 2), flood, rerun. Finals A 0, B 2, C 5 (direct, next hop C), D **6 by two paths** (A–B–D and A–C–D: ECMP, next hops B and C), E 8 via D (next hops B and C). Shows rule 6.
  3. `link-fails` — C–D fails: C and D send new LSAs; rerun from A: B 2, C 3 (via B), D 6 (via B–D), E 8 (A–B–D–E); next hop still B for all.
  4. `spf-from-e` — same map, source E: D 2, C 3 (via D), B 4, A 6; every next hop is **D**. Same LSDB, a different tree: each router computes its own.
- **Steps:** `spf-from-a` 1 originate + 2 flood + 5 SPF + 1 table = 9; `cost-change` and `link-fails` 1 change + 1 originate + 2 flood + 5 SPF + 1 table = 10; `spf-from-e` 9 (with `showFlood` off: 6).
- **Legend:** router (circle), link with cost label, LSA in flight (envelope in the colour of its originating router), LSDB entry (small square per origin, filled when held), tentative (hollow), final (filled), shortest-path tree (thick line), ECMP (double line). "Changed" marks the LSAs that arrived this round, or the router made final and the distances relaxed this step.
- **Captions:**
  - hr: "Korak 6: C postaje konačan s udaljenošću 3. Put A–B–C–D košta 4, manje od 6 preko B–D, pa D dobiva novu udaljenost i isti sljedeći skok: B."
  - en: "Round 2: every router now holds all five LSAs. The five link-state databases are identical; each router will run SPF on its own copy."
- **Terms:** link state — stanje veze; link-state protocol — protokol stanja veze; shortest path — najkraći put; metric / cost — metrika / cijena *(check: the book uses "metrika")*; routing table — tablica usmjeravanja; next hop — sljedeći skok; flooding — preplavljivanje *(check)*; convergence — konvergencija.
- **Misconceptions:** (1) "Routers exchange routing tables" (that is distance vector, `net-distance-vector`); here they exchange links. (2) "Fewest hops wins": A–C is one hop but cost 5 loses to A–B–C at 3. (3) "One router computes paths for everyone": each computes its own tree (preset 4).
- **Out of scope:** OSPF areas, DR/BDR, hello and dead timers, LSA types, aging; IS-IS; how the routing table is then used for forwarding (`routing-table`); distance vector (`net-distance-vector`).
- **Note for the coordinator:** catalogue §5.11 puts this on one graph view with `net-distance-vector` and `inet-bgp-path-selection`; the graph above can serve both routing pages (same costs make a good contrast). Flooding plus SPF is close to two concepts; keep `showFlood` so a lecturer can show only SPF.
<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `link-state-spf` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh link-state-spf sims/link-state-spf` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/link-state-spf/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
