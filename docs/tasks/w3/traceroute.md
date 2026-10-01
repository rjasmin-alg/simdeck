# traceroute: Traceroute and TTL

| | |
|---|---|
| Task | `traceroute` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-traceroute` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/traceroute/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hop-rewrite` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **TTL-exceeded replies map the path, and stars are not failures**.

The student: step increasing TTLs; drop ICMP on one router.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/hop-rewrite/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` §"ICMP i dijagnostika puta: `ping` i `traceroute`" (Što treba znati, Šire o temi), Primjer 5 (zvjezdice u ispisu `tracert`-a), Primjer 6 (`tracert` naspram `traceroute`); diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch11-tracert-ttl.svg`; screenshot `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/images/ch11-traceroute-ispis.png`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, group 4 "Usmjeravanje": "TTL i traceroute"
- RFC 792 (Time Exceeded, Destination Unreachable, Echo); RFC 1812 §5.3.1; Microsoft Learn, *tracert*; FreeBSD System Manager's Manual, *traceroute(8)*
- Catalogue seed: URM card ch11-tracert-ttl

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** topology A — R1 — R2 — … — Rn — S (K2 topology once it exists), each router labelled with the address it answers from. Under it the growing `tracert` / `traceroute` output, one line per TTL, as in `ch11-tracert-ttl.svg`.
- **State:** `{ ttl, probes:[{ttl, diedAt, reply:'time-exceeded'|'echo-reply'|'port-unreachable'|null, rtt}], lines:[{ttl, addr|'* * *', rtts:[3]}], done, silent:[routerIds], filteredAtDest }`.
- **One step:** one TTL round: send the probe(s) with TTL = k; each router on the path decrements; the probe dies where TTL reaches 0; that router replies (or stays silent); the line for hop k is printed. Phase order inside the step: out, die, reply, print.
- **Rules:**
  1. Every router decrements TTL by at least 1; when it reaches 0 the packet is discarded and an ICMP Time Exceeded (type 11, code 0) goes to the source unless the router is configured silent (RFC 1812 §5.3.1; RFC 792 "Time Exceeded Message"; book ch11 "ICMP i dijagnostika puta").
  2. Probe k dies at hop k; the reply's source address names hop k (book ch11; Microsoft *tracert* doc).
  3. Windows `tracert` sends ICMP echo requests; the destination answers with echo reply (type 0) (Microsoft *tracert*; book ch11 Primjer 6).
  4. Unix/BSD `traceroute` sends UDP probes; the destination answers with ICMP port unreachable (type 3, code 3) (FreeBSD *traceroute(8)*; book ch11 Primjer 6). Base port 33434, +1 per probe (traceroute(8) (check)).
  5. Three probes per TTL, start TTL 1, +1 per round, stop at the destination's reply or at max hops (Microsoft *tracert*: default 30; traceroute(8)).
  6. A silent router prints `* * *` for its hop, but probes with a larger TTL still pass it (book ch11 Šire o temi, Primjer 5). Tie-break: silence at hop k never changes lines k+1… .
  7. A destination that filters the probes (firewall) prints `* * *` from its hop until max hops; the trace never "completes" though the path works (derived from rules 5–6).
  8. RTT of a line = sum of link delays out and back; ICMP generation adds a per-router delay, so RTTs need not grow monotonically (book ch11 traceroute screenshot caption: 5th hop 84.108 ms > 6th; per-router delay values derived).
- **Params:** `tool` choice `tracert | traceroute`, default `tracert`; `silent` select (none, R1…Rn), default none; `destFilter` toggle, default off; `maxHops` range 4–30, default 30 (presets lower it so a demo stays short).
- **Presets (4):**
  1. `basic` — 5 routers, all answer; lines 1–5 show R1…R5, line 6 the server's echo reply, done in 6 rounds. Derived topology; mechanism from book ch11 and `ch11-tracert-ttl.svg`.
  2. `stars` — Primjer 5: 12 lines, hop 9 silent, lines 10–12 normal down to the server's reply. From book ch11 Primjer 5.
  3. `tools` — the basic path with `traceroute`: same 6 lines, the last answered by port unreachable instead of echo reply. From book ch11 Primjer 6.
  4. `filtered` — the server's firewall drops probes, `maxHops` 8: lines 6–8 `* * *`, trace ends at max hops with no reply. Derived, unchecked.
- **Steps:** basic 6, stars 12, tools 6, filtered 8 (one per TTL round).
- **Legend:** probe (`--c1`, label "TTL k"), Time Exceeded (`--c2`, dashed back), final reply (`--ok`), silent router (hatched, "šuti"); "changed" = the TTL value on the packet and the newly printed line.
- **Captions:**
  - hr: „Sonda s *TTL*-om 3 umire na R3: TTL pada na 0, R3 je odbacuje i šalje *Time Exceeded* (vrijeme isteklo). Redak 3 ispisa: R3."
  - en: "The probe with TTL 3 dies at R3: TTL drops to 0, R3 discards it and sends Time Exceeded. Line 3 of the output: R3."
- **Terms:** time to live — vrijeme života (TTL); hop — skok; probe — probni paket (sonda); ICMP Time Exceeded — poruka o isteku vremena; destination unreachable — odredište nije dostupno; port unreachable — *port* nije dostupan; maximum hops — najveći broj skokova.
- **Misconceptions:** `* * *` means the link is broken there; traceroute shows the return path; tracert and traceroute send the same packets.
- **Reused from `hop-rewrite`:** the topology-with-headers model, the packet object and the per-hop TTL rule. New: ICMP Time Exceeded generation, silent routers, the printed output.
- **Out of scope:** asymmetric return paths, load balancing (Paris traceroute), MPLS, ICMP rate limiting numbers, IPv6 hop limit (same rule; a later preset).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh traceroute sims/traceroute` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/traceroute/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
