# distance-vector: Distance vector and count to infinity

| | |
|---|---|
| Task | `distance-vector` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-distance-vector` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/distance-vector/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `routing-table` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **RIP-style updates, slow convergence, split horizon**.

The student: step update rounds; cut a link.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/routing-table/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (Uvod u računalne mreže): "Dinamičko usmjeravanje: kad tablicu gradi mreža sama" (distance vector vs link state, RIP hop count, 15-hop limit; footnotes carnet-dv-ls, rfc2453-rip, carnet-rip) and its "Šire o temi" (convergence, loops). The book has no worked count-to-infinity example; presets come from RFC 2453 and a check script.
- RFC 2453 (RIP version 2): §3.4 "Distance Vector Algorithms", §3.4.1–3.4.3 (topology changes, preventing instability / counting to infinity, split horizon and poisoned reverse), §3.8 (timers), §3.9.2 (response processing: accept from same next hop even if worse)
- CARNET CERT, *Osnove mrežnog usmjeravanja* §7.6 and §9.7 (as cited in URM ch11)
- Catalogue seed: URM ch11

## Overlaps (catalogue §5)

- **§5.11 Routing protocols:** Separate pages on one graph view.

## Model and presets

- **Scene:** a small router graph (kit graph view shared with `link-state-spf`, catalogue §5.11), routers as
  boxes, links as lines with cost 1, attached networks as small clouds. Beside each router its **routing
  table** (destination, metric, next hop), the row that changed highlighted. During an update round, arrows
  on each link carry the advertised vector (destination:metric); with split horizon the suppressed entries
  are shown struck out on the arrow.
- **State:** `{ round, tables: {R: {dest: {metric, via}}}, links: [{a, b, up}], mode, events: [...] }`.
  Metric 16 = unreachable.
- **One step = one synchronous update round:** every router builds its vector from its table at the start
  of the round (snapshot), all vectors are delivered at once, then every router updates. A topology change
  (cut a link, take a network down) is its own step and only changes the routers that see it directly.
- **Rules:**
  1. Each router periodically sends its whole table to its neighbours (URM `11-usmjeravanje.md`
     "Dinamičko usmjeravanje", footnote carnet-dv-ls; RFC 2453 §3.4).
  2. Metric is the hop count; a directly connected network has metric 1; a received metric m becomes
     min(m + 1, 16) (URM ch11, footnote rfc2453-rip; RFC 2453 §3.4 and §3.9.2). Cisco shows a learned
     route one lower than this convention (check), say so in the explanation.
  3. 16 means unreachable, so no path may be longer than 15 hops (URM ch11, footnotes rfc2453-rip and
     carnet-rip; RFC 2453 §3.4.2).
  4. Accept a new route if the router has none, or if its metric is strictly lower than the current one
     (RFC 2453 §3.9.2).
  5. An update from the **current next hop** is always believed, even if worse — this is what lets bad news
     travel, and what lets count to infinity happen (RFC 2453 §3.9.2, §3.4.2).
  6. Tie-break: equal metric from a different neighbour does not replace the current route; two equal new
     offers in the same round → the neighbour first in name order wins (derived, for determinism).
  7. A directly connected network that goes down gets metric 16 on its router; a cut link sets 16 on every
     route whose next hop was across it, on both ends.
  8. Split horizon: do not advertise a route back to the neighbour it was learned from. Poisoned reverse:
     advertise it back with metric 16 (RFC 2453 §3.4.3). Both are a `mode` param.
  9. Edge: in this synchronous model split horizon stops the two-router loop of preset 2; loops through
     three or more routers can still count to infinity with real, unsynchronised timers (RFC 2453 §3.4.3),
     which this model does not show — say so in the explanation.
- **Params:** `mode` choice plain / split horizon / poisoned reverse (default plain); button "cut link"
  (picks the highlighted link); button "network down".
- **Presets:**
  1. `cold-start` — line A–B–C, network N on C. Round 1: B learns N = 2 via C; round 2: A learns N = 3 via
     B; round 3: no change (converged). From RFC 2453 §3.4 (method); numbers from a check script.
  2. `count-to-infinity` — from preset 1 converged, N goes down on C, mode plain. Round 1: C believes B's
     old 2 → C = 3 via B, B = 16; then B and A/C alternate 4, 5, 6 … until all three reach 16 at round 14.
     From RFC 2453 §3.4.2 (mechanism); round count from the check script (synchronous rounds).
  3. `split-horizon` — the same failure with split horizon: round 1 B = 16, round 2 A = 16, converged in
     2 rounds. Poisoned reverse gives the same 2 rounds here. From RFC 2453 §3.4.3; numbers checked.
  4. `ring-reroute` — ring A–B–C–D–A, N on C, split horizon; converged: A = 3 via B, B = 2, D = 2. Cut
     B–C: round 1 A = 3 via D (B's route went 16), round 2 B = 4 via A. Shows good news and bad news
     together. Derived; numbers checked.
  5. `triangle-plain` — triangle A, B, C with D behind C (N on D); cut C–D, mode plain: A and B go to 16,
     C believes A (A < B by name, rule 6) → C = 4 via A, then 5, 6 … all 16 by round 13. Derived; checked.
- **Steps:** preset 1: 3; preset 2: 15 (1 failure + 14 rounds); preset 3: 3; preset 4: 6 (2 + cut + 2 + end);
  preset 5: 14. All ≤ 20.
- **Legend:** route via a neighbour (c1), directly connected (c2, solid square), unreachable 16 (danger,
  struck-out), suppressed by split horizon (hollow, dashed); "changed" marks every table row that changed
  this round and the arrows that carried the change.
- **Captions:**
  - hr: "Krug 3: C još vjeruje B-u, koji javlja 4 skoka do mreže N, pa C upisuje 5 — a mreža N više ne
    postoji. To je *count to infinity* (brojanje do beskonačnosti)."
  - en: "With split horizon, B no longer tells C about the route it learned from C, so the false 2-hop path
    never comes back; all routers mark N unreachable in two rounds."
- **Terms:** distance vector protocol — protokol vektora udaljenosti; routing table — tablica usmjeravanja;
  metric / hop count — metrika / broj skokova; next hop — sljedeći skok; convergence — konvergencija; count
  to infinity — brojanje do beskonačnosti (check term); split horizon — podijeljeni horizont (check term);
  routing loop — petlja usmjeravanja.
- **Misconceptions:** every router knows the whole map (only the neighbours' distances); a router drops a
  route as soon as it fails anywhere; a worse update is ignored if it comes from the current next hop.
- **Out of scope:** RIP timers in seconds (30 s updates, 180 s timeout, 120 s garbage collection, RFC 2453
  §3.8, mentioned only), triggered updates and hold-down, RIP message format, link state (`link-state-spf`).
- **Reuse:** from `routing-table` reuse the table rendering and longest-match lookup only for the optional
  final "send a packet" check; the update rule set is new.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh distance-vector sims/distance-vector` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/distance-vector/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
