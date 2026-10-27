# link-state-spf: Link state and Dijkstra

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w3/link-state-spf.md` (catalogue `net-link-state-spf`, §4.1). Class: stepper. Kit view **K2:
topology** (`kit/topology.js`): the routers as cards with their LSDB strip inside, the LSA copies of a flood round as
chips on the links, the shortest-path tree as thick links. The cost on each link and the ECMP double line are drawn by
the page over the view (shared request, NOTES.md).

**One concept:** LSA flooding builds one map; SPF picks paths.

Sources, short names used below: **URM11** = Uvod u računalne mreže `book/chapters/11-usmjeravanje.md`, section
"Dinamičko usmjeravanje: kad tablicu gradi mreža sama" ("Što treba znati", footnotes carnet-dv-ls, rfc2328-ospf, and
"Šire o temi", footnote carnet-ospf) and the **metrika** paragraph of "Usmjeravanje: kako paket pronalazi put kroz
mrežu"; **RFC** = RFC 2328 (OSPF version 2); **Dijkstra** = E. W. Dijkstra, "A note on two problems in connexion with
graphs" (1959); **check** = the check script below, written before the model and independent of it. The chapter has
no worked SPF example: the graph and every number here are derived.

## Scene

Five routers A–E, seven links (task file):

| Link | A–B | A–C | B–C | B–D | C–D | C–E | D–E |
|---|---|---|---|---|---|---|---|
| Cost | 2 | 5 | 1 *(param `costBC`)* | 4 | 1 | 6 | 2 |

Drawn as a zigzag of three triangles (A-B-C, B-C-D, C-D-E): B and D on top, A, C and E below; no two links cross. The
graph's hop diameter is 2.

## State

```
{ kind: 'start' | 'change' | 'originate' | 'flood' | 'spf' | 'table', round, change, links: [{ id, a, b, cost, up }],
  lsas: { 'B#2': { origin, seq, links: [[neighbour, cost]] } }, lsdb: { router: { origin: seq } },
  pending: [{ at, o, from }], inFlight: [{ o, seq, from, to, fate: 'new' | 'dup', held }], originated: [r],
  spf: null | { dist: { r: n | null }, nextHop: { r: [r] }, parents: { r: [r] }, final: [r], picked, relaxed: [...] },
  tree: [{ a, b, ecmp }], table: [{ dest, cost, via: [r] }], oldTable, end }
```

The task's state names map so: `phase` is `kind`; `dist`, `nextHop` and `final` live in `spf`; `tree` and `table`
as named. `lsas` is the catalogue of every LSA written so far (an LSDB holds a sequence number per origin and looks
the body up there). `links` is the real network; a router's picture of it is its LSDB. `pending` are the LSAs each
router stored in the last round and will send on in the next. `relaxed` lists every neighbour examined in this SPF
step: `{ r, how: 'new' | 'better' | 'equal' | 'worse', offer, via, old: { dist, nextHop, parents } }`. `oldTable` is
the routing table before a change (null on a cold start). `change` is `{ cost: { from, to } | null, fail: id | null,
ends: [r] }` or null.

## Params

| Param | Values | Default | Shown |
|---|---|---|---|
| `source` | A–E | A | choice; changing it keeps the step (same flooding, another SPF) |
| `costBC` | 1–10 | 1 | range, `resets`: the cost of B–C after the change (1 = no change) |
| `fail` | `none`, `C-D`, `B-D` | `none` | choice, `resets` |
| `showFlood` | on / off | on | toggle, `resets`: off skips originate and flood |

**No change** (`costBC` 1, `fail` none): a cold start. **A change** (`costBC` ≠ 1 or `fail` set): step 0 is the
converged network before it (cost 1, every link up, every LSDB holding every LSA at sequence 1, the source's routing
table computed on it) and step 1 applies the change. Both changes at once are allowed (`ends` is the union).

## One step

The run, in order (each line one step):

1. **change** (only with a change): the links change; `ends` = the routers at the ends of the changed links.
   With `showFlood` off, the new LSAs of `ends` (sequence + 1) are written into every LSDB in this same step.
2. **originate** (only with `showFlood` on): cold, every router writes its LSA with sequence 1 and stores it in its own
   LSDB; after a change, each router in `ends` writes a new LSA with sequence + 1. `pending` = each originator's own LSA.
3. **flood**, one round per step, while some LSDB lacks the newest LSA of some origin (rule 2).
4. **spf**, one router made final per step, until no tentative router is left: pick → mark final → relax the neighbours
   (name order) → update the tree → caption.
5. **table**: the source's routing table from the finished SPF. The run ends here.

### Rules

| # | Rule | Source |
|---|---|---|
| 1 | Each router originates one LSA listing only its own links that are up, with their costs. | URM11 "Dinamičko usmjeravanje" ("svaki usmjernik svim ostalima šalje samo podatke o vlastitim vezama"; footnote carnet-dv-ls, CARNET §7.6); RFC §12 |
| 2 | Flooding, one synchronous round per step: every router sends each LSA it stored in the previous round (or originated) to every neighbour except the one it came from. All copies arrive at once and are processed in the order receiver, sender, origin. A copy with a higher sequence number than the one held (or the first one) is stored and sent on next round; a copy already held (same or lower number) is dropped, not sent on. Flooding ends when every LSDB holds the newest LSA of every origin: then all LSDBs are identical, and anything still to send would be a copy already held. | RFC §13 (step 5: install and flood a newer instance; step 7: the same instance is not flooded), §13.1 (a higher sequence number is newer); a lower number is never in flight here (RFC §13 step 8 would send the newer copy back: out of scope); URM11 (footnote rfc2328-ospf: "each router maintains an identical database"); round structure and order derived |
| 3 | Each router runs SPF on its own copy; the page shows the run of `source`. The graph is read from the source's LSDB only, and a link counts only when both ends' LSAs list it (two-way check). | URM11 "Šire o temi" (footnote carnet-ospf: "Rute proračunava Dijkstra algoritmom"); RFC §16.1 (the link back must be present) |
| 4 | Dijkstra: the source has distance 0, every other router is unknown (∞). Repeatedly make final the tentative router with the smallest distance; for each neighbour that is not final, a smaller distance through it replaces distance, next hop and parent. A final router is never examined again. | Dijkstra; RFC §16.1 |
| 5 | Tie-break: equal distances when picking → the lower router name (alphabetical) first. The result (distances, next hops) does not depend on it, only the order of the steps. | derived (simulation rule, determinism) |
| 6 | Equal-cost paths: a neighbour reached at the **same** distance through another router keeps both next hops (the union, in name order) and both parents. The tree draws both parent links of such a router as double lines; the routing table shows both next hops. | RFC §16.1 (equal-cost multipath: "the next hop … is the set of next hops") |
| 7 | Next hop: through the source it is the neighbour itself; through any other router it is that router's next hops (so: the first router after the source on the shortest path). The source has none. | RFC §16.1 (next hop calculation) |
| 8 | Cost change or link failure: the two routers at the ends of that link originate new LSAs with sequence + 1, they flood (rule 2), and every router reruns SPF (the source's run is shown). | RFC §13 ("whenever a new instance of an LSA is originated … flooding"), §16 (recalculation on a changed LSA); task rule 8 |
| 9 | Metric = the configured link cost, 1–10 here; a path's cost is the sum of its links' costs, not the number of hops. Vendor default "reference bandwidth / interface bandwidth" is named in the explanation only *(check)*. | URM11 ("**metrika** … mjera kojom algoritam usmjeravanja utvrđuje koji je od ponuđenih puteva bolji"; footnote carnet-metrika) |

Out of scope (task file): OSPF areas, DR/BDR, hello and dead timers, LSA types, aging and acknowledgements, IS-IS,
forwarding with the table (`routing-table`), distance vector (`distance-vector`).

## Expected numbers (check)

All from `check.py` (written in the thread's scratchpad before `sim.js`; its source and output are in NOTES.md): Python,
independent of the model, a plain Dijkstra with ECMP next-hop sets and flooding as sets of held origins. `sim.test.js`
then asserts the same numbers on the model.

| Preset | Params | Steps | Flood rounds (copies / dropped) | Finals in order | Routing table of the source |
|---|---|---|---|---|---|
| 1 `spf-from-a` | default | 9 = 1 originate + 2 flood + 5 SPF + 1 table | 14 / 0, 28 / 22 | A 0, B 2, C 3, D 4, E 6 | B 2 via B, C 3 via B, D 4 via B, E 6 via B |
| 2 `cost-change` | `costBC` 5 | 10 = 1 change + 1 originate + 2 flood + 5 SPF + 1 table | 7 / 0, 12 / 11 | A 0, B 2, C 5, D 6, E 8 | B 2 via B, C 5 via C, **D 6 via B and C**, **E 8 via B and C** |
| 3 `link-fails` | `fail` C-D | 10 | 5 / 0, 7 / 4 | A 0, B 2, C 3, D 6, E 8 | B 2, C 3, D 6, E 8, all via B |
| 4 `spf-from-e` | `source` E | 9 (`showFlood` off: 6) | 14 / 0, 28 / 22 | E 0, D 2, C 3, B 4, A 6 | A 6, B 4, C 3, D 2, all via D |

How each comes about:

- **spf-from-a:** A 0 → B 2, C 5. B 2 → C 3 via B (A–B–C 3 beats A–C 5: fewest hops loses), D 6. C 3 → D 4 (A–B–C–D
  beats 6 via B–D, same next hop B), E 9. D 4 → E 6 (beats 9 via C–E). E 6: nothing left. Step 6's caption is the task's
  hr example.
- **cost-change:** B and C write LSAs with sequence 2. A 0 → B 2, C 5. B 2 → C 7 is worse than 5 (C stays direct,
  next hop C), D 6 via B. C 5 → D 6 via C **equals** 6 via B: next hops {B, C} (rule 6), E 11. D 6 → E 8 via D, next
  hops {B, C}. Rows that change against the old table: C, D, E.
- **link-fails:** C and D write LSAs with sequence 2; C's lists no D and D's no C. A 0 → B 2, C 5. B 2 → C 3, D 6. C 3 →
  E 9. D 6 → E 8. Rows that change against the old table: D and E (next hop still B).
- **spf-from-e:** the same LSDB, another tree: E 0 → C 6, D 2. D 2 → B 6, C 3. C 3 → A 8, B 4. B 4 → A 6. Every next hop
  is D. Each router computes its own tree (misconception 3).
- **Tie-break (rule 5)**, source C on the default graph: B and D are both at 1 when C is final; B is picked first; then
  A and E are both at 3, A first. Table: A 3 via B, B 1, D 1, E 3 via D.
- **B–D fails:** B and D write new LSAs (flood rounds 4 / 0, 8 / 4); from A nothing changes (B–D is on no shortest
  path): `capTableSame`.
- **costBC 3:** C is reached at 5 directly and at 5 through B: next hops {B, C} for C (rule 6 on a direct neighbour),
  and D 6, E 8 via {B, C}.

The task's step counts follow: 9, 10, 10, 9 (6 without flooding); a change without flooding is 1 + 5 + 1 = 7.

## Presets

| # | id | Params | Shows |
|---|---|---|---|
| 1 | `spf-from-a` | default | flooding in 2 rounds, then Dijkstra from A; every next hop B |
| 2 | `cost-change` | `costBC` 5 | new LSAs with sequence 2, ECMP to D and E (rule 6) |
| 3 | `link-fails` | `fail` C-D | a failed link, new LSAs, a new tree; next hop still B |
| 4 | `spf-from-e` | `source` E | the same LSDB, a different tree |

## Legend and marks

Router (rounded square with its letter; the source has a thick border during SPF); link with its cost in a box (a
failed link dashed with a cross, its cost struck); LSA copy on a link: a letter in its origin's colour (filled: new to
the receiver; hollow dashed: already held, dropped); LSDB cell per origin under each router (filled with the sequence
number when it holds the newest; outlined with the old number struck while a newer one exists; dashed with a dot when
it holds none); tentative (hollow mark), final (filled mark), unknown (dashed); shortest-path tree (thick line); ECMP
(double line). "Changed" (yellow with an ink outline): the LSDB cells that got an LSA this step, the B–C or failed
link's cost at the change step, the Dijkstra rows relaxed this step (the picked row is outlined), the routing table
rows that differ from before.

## Captions

Written for each kind of step in both languages (strings.js). Examples (data in bold on the page):

- hr, `spf-from-a` step 6: "Korak 6: C postaje konačan s udaljenošću 3. Put A–B–C–D košta 4, manje od 6 preko B–D,
  pa D dobiva novu udaljenost i isti sljedeći skok: B. E dobiva udaljenost 9 preko C, sljedeći skok B."
- en, `spf-from-a` step 3: "Round 2: 28 LSA copies on the links. A router stores a copy that is new to it and sends it
  on all its other links (6); a copy it already holds is dropped, not sent on (22). Every router now holds all five
  LSAs. The five link-state databases are identical; each router will run SPF on its own copy."
