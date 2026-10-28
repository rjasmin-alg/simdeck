<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# static-default-route: notes

New stepper (task `docs/tasks/w3/static-default-route.md`, catalogue `net-static-default-route`, §4.1, wave 3) on kit
view K2 (`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage.** K2 on nine columns: A, R1, R2, R3 and the ISP cloud in row 1 with an empty column between neighbours
  for the packet chips, B in row 0 above R2. Under it five boxes sized 1.5 : 2 : 2 : 2 : 1.5, so each router's table
  stands under its router: the packet (kind, source → destination, TTL with its change, fate) on the left, the
  three routing tables, and on the right the packet's path (node and TTL on leaving) and "what A sees".
- **Tables are the page's own HTML**, not `Simdeck.topology.table` (its column under a card is one ninth of the stage,
  too narrow for `192.168.100.0/30`) and not K4 (three K4 tables do not fit at 1920×1080). Columns as in the book's
  Primjer 3 and routing-table's: kind tag, destination network/prefix, next hop / interface. Marks: winner thick
  frame + highlight + "▶ pobjeđuje" (or "jedini se podudara"), another match dashed "▽ podudara se, kraći", no match
  a "✕ nema zapisa ni zadanog puta" line. Only the table of the router acting in the step carries marks.
- **One step = one node handles one packet** (send, forward, drop, the ISP takes it). Arrival at a host is folded
  into the step that brings the packet there; a reply or an ICMP error is a new packet in the next step. This gives
  the task's counts exactly (6, 6, 6, 5, 11). `sim.js` computes the run as a list of events (`plan(p)`), as
  `icmp-messages` does; `steps(p)` is its length.
- **Initial TTL is every sender's.** The `ttl` param sets A's request, B's reply and a router's ICMP error alike, so a
  loop of an error (free play, loop without `r2Static`) also ends within the TTL. The task only said "ttl range 4–64".
- **Route lookup before TTL** inside a router (RFC 1812 §5.2.1, the forwarding walk-through *(check: icmp-messages cites
  §5.2.1.2, which the review thinks is the local delivery decision)*), tested on `decide()`: the
  page's minimum TTL 4 cannot reach a router with TTL 1 and no route.
- **ICMP error source** = the router's interface the error leaves on (RFC 1812 §4.3.2.4, as `icmp-messages` and
  `hop-rewrite`): R1 192.168.1.1, R2 192.168.2.1 towards B and 192.168.100.2 towards A (192.168.100.5 when its default
  route sends it to R3).
- **The ISP is the edge of the scene.** A public destination is handed on into the internet (outcome `left`; the
  reply would need NAT at R3, out of scope, and the caption says so). A packet for A or B that reaches the ISP (a
  reply routed by default routes) is lost there: nothing on the internet routes back to a private network *(check:
  RFC 1918 §3; a real ISP may also answer with an error)*. The task's outcome list gains `left`.
- **Duplicate prefix (rule 9).** Only `r3Default` and `r3Back` clash; see Deviations.
- **Switch labels use the table's notation** ("R1: S 192.168.2.0/24 → R2", "R3: S* 0.0.0.0/0 → R2"): one line each,
  so the panel fits at 1920×1080 with five presets, six switches, the destination and the TTL; the legend explains
  C / S / S*. The panel's gaps are tightened and the destination's label sits beside its buttons for the same reason
  (the gate's panel-fit check; with a blocked switch's hint the panel is exactly 898 px).
- **Colours.** Request c1, reply c2 (chip text "echo" / "odgovor" carries it in grayscale), ICMP error a dashed
  `--danger` frame on the chip and a dashed arrow (the view's `cast: 'broadcast'` dash, used for its look). Nodes:
  A c3, R1 c4, R2 c6, R3 c5, B c7. A drop ends in the view's ✕; a dropped packet's chip shows the TTL it arrived with.
- **Phone:** the node list follows the path (A, R1, R2, B, R3, ISP), the boxes stack.

## Deviations from the task

- **Preset routes.** `default` is r1Default **+ r2Static** (the task: "r1Default instead of r1Static + r2Static"):
  without r2Static B's reply dies at R2 and the "same result as 1" cannot hold; Primjer 3c replaces only R1's entry.
  `loop` is **r1Default + r2Static** + r2Default + r3Back (the task: "r2Default and r3Back"): R1 needs a route for
  198.51.100.7 to start the loop, and R2 needs r2Static for the Time Exceeded to reach A in the task's 3 steps
  (without it the error loops too and dies: 18 steps, tested). Every preset sets all six switches.
- **Rule 9's reason is under the switch, not in the caption.** The task says the add-route control refuses a
  duplicate prefix "with a reason in the caption". The kit's `disabled` blocks switching one R3 default route on while
  the other is on, and shows the reason under the switch (`blockedBy`); a switch that cannot move has no step whose
  caption could say it. If both come on through a URL, `r3Default` is installed and `r3Back` refused: struck in R3's
  table ("odbijen: isti prefiks") and named in the caption at every step (`capRefused`, first at step 0), since its
  switch still reads "uključeno".
- **Outcome `left`** added for the ISP edge (above).
- **`steps` depends on the params**: the longest free play is 130 steps (the request loops, then its 11/0 loops too,
  TTL 64); every preset is ≤ 11. The gate
  checks the defaults (6).
- **Kit view K2 exists**, so no own drawing; the tables are the page's (above).

## Reuse

`routing-table`'s model is not in `models/`. `parse`, `format`, `mask`, `match` and `lookup` are copied from
`sims/routing-table/sim.js @ 7bd975d` (marked in `sim.js`; routing-table copied the first four from subnet-mask).
What is new here (`tablesOf`, `addRoute`, `decide`, `plan`) is pure over plain data and could move to `models/`
with them.

## Sources

- URM `book/chapters/11-usmjeravanje.md`: "Usmjeravanje" (static route, default route `0.0.0.0/0` matches everything,
  longest prefix, footnotes carnet-staticko, cisco-zadani-put, rfc1812-lpm), "Šire o temi" (the loop dies on TTL),
  Primjer 2, Primjer 3 (a–c: addresses, tables, "Ako R2 o odbacivanju uopće javi, poruka ide B-u"), Pitanja 18.
- RFC 1812 §2.2.5.2 (longest match), §4.3.2.4 (ICMP source address), §5.2.1.2 (forwarding order), §5.2.7.1 (3/0),
  §5.3.1 (TTL); RFC 792 (types 3, 11); RFC 5737 (203.0.113.0/24, 198.51.100.0/24 for documentation).
- `sims/icmp-messages/` (order inside a router, ICMP source rule, page pattern), `sims/routing-table/` (lookup,
  column names).

### Unchecked *(check)*

- RFC 1812 §4.3.2.7 as the source for "no ICMP error about an ICMP error" (the task marks it; RFC 1122 §3.2.2 says
  the same).
- What the ISP does with a packet for a private address (lost, silently).
- Gi0/2 on R2 and the R2–R3 / R3–ISP addresses are derived, not from the book.

## Term pairs

Missing from `kit/glossary.js` (or, for *default route*, different: the glossary has the UL book's "zadana ruta");
written out as *English* (Croatian) in the Croatian strings, following the URM book:

| English | Croatian |
|---|---|
| static route | statički put |
| default route | zadani put |
| directly connected network | izravno spojena mreža |
| routing table | tablica usmjeravanja |
| longest prefix match | najdulji podudarajući prefiks |
| routing loop | petlja usmjeravanja |
| next hop | sljedeći skok |
| echo request / echo reply | echo zahtjev / echo odgovor |

## Shared requests

- **models/**: promote routing-table's lookup (with subnet-mask's IPv4 helpers) as routing-table's NOTES already
  asks; this sim would then load it instead of its copy.
- **Glossary**: the pairs above with `"src": "simdeck"`, and the *default route* conflict (zadani put vs. zadana
  ruta) that routing-table raised.
- **K2 (optional)**: a chip style for an error message (`--danger` dashed) instead of the page's `.sr-icmp` rule and
  `cast: 'broadcast'` for the dash.

## Checks

- `node --test sims/static-default-route/sim.test.js`: 29 tests. Each rule broken once on purpose (duplicate allowed,
  blockedBy off, no connected rows, first match instead of longest, ties to the later, /0 mask, TTL before route, no
  decrement, no error, wrong error source, error about an error, error without a route back, no reply, reply at 64,
  the ISP never losing a private packet): every mutation fails at least one test.
- Fresh review (a separate agent, 2026-10-28): model against SPEC and the task correct (rules, 6/6/6/5/11, TTLs, ICMP
  sources, both preset deviations confirmed from Primjer 3c); every preset × step × hr/en in a browser, plus 8
  free-play combinations, without console errors or missing strings. Fixed from it: the ICMP send caption now names
  the entry that carries the error (why `loop` needs r2Static); SPEC's step arithmetic, marks and free-play maximum
  (130); rule 9 moved to Deviations; tests for blockedBy's same-router check, `seen`/`done` only at the end, the
  error's lookup, `ttlIn`/`from`/`at`/`icmp`/`sent`; the refusal caption first at step 0; drops marked ✕ in the path
  box; "falls" in English. The §5.2.1.2 citation is marked *(check)*. Left as is: "ping" as a word (the concept is
  the echo exchange; icmp-messages, hop-rewrite and arp-local-remote use it), A's "šalje" badge on steps 0 and 1.
- Every box checked for clipping at every step of every preset in both languages at 1920×1080.
- `npm run gate -- static-default-route`: pass; screenshots at 1920×1080 (light, dark, grayscale) and 375×812 in hr
  and en reviewed, plus each preset's decisive steps at 1920×1080 (one-way 5–6, default 6, to-internet 5, loop 8–11).

## Time

Start 2026-10-28 12:23, done 12:56 (about 33 minutes, the fresh review included).
