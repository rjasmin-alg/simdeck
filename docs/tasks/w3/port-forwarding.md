# port-forwarding: Port forwarding (DNAT)

| | |
|---|---|
| Task | `port-forwarding` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-port-forwarding` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/port-forwarding/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `nat` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `pat` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **inbound connections to a NAT'd server**.

The student: add a forward, open from outside.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/pat/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md`, section "NAT: kad više uređaja
  dijeli jednu adresu" (prosljeđivanje *portova*, sessions outbound only, RFC 4864 "NAT is not security") and
  "Primjer 4: tablica PAT-a — zašto odlazna sesija radi sama, a dolazna ne" (203.0.113.5, A/B on 51000,
  61000/61001, inbound to 61050 dropped); diagram `assets/diagrams/ch11-pat-tablica.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/pat.html` (the host model's
  original; `nat.html` is the same page)
- RFC 3022 (Traditional NAT), §2 (static address maps for inbound sessions); RFC 2663 (NAT terminology);
  RFC 4787 §6 REQ-9 (hairpinning); RFC 5737 (documentation addresses)
- iptables-extensions(8), `DNAT` target; netfilter packet flow (conntrack before `nat` PREROUTING; rule 7 order) (check)
- Catalogue seed: extends urm-pat → §5.12

## Overlaps (catalogue §5)

- **§5.12 NAT and port publishing:** urm-nat and urm-pat are near-duplicates (8,253 bytes each, same layout); merge them into one page with two modes on port. Port forwarding and container port publishing are both DNAT: one page with a "container" preset.

## Model and presets

- **Scene:** the PAT page's picture extended: inside LAN (A `192.168.1.10`, B `192.168.1.11`, server S
  `192.168.1.20`) — usmjernik R (inside `192.168.1.1`, outside `203.0.113.5`) — internet with an outside
  client K `198.51.100.77` and the book's server `198.51.100.10:443`. Under R two tables in the K4 table view:
  **tablica prijevoda** (dynamic PAT rows, as in `pat`) and **prosljeđivanje *portova*** (static rows: proto,
  outside port → inside ip:port). One packet moves per step with its four address fields shown (src ip:port,
  dst ip:port), the rewritten ones highlighted.
- **State:** `{ pat: [{inside, outside, remote, proto}], forwards: [{proto, extPort, to}], conn: [{…}],
  packet: {where, src, dst, proto}, chart: [...], nextPort }` (`nextPort` starts at 61000, as in `pat`).
- **One step:** the packet moves one hop (host → R, R → outside, or the reverse) and R, when it is the hop,
  applies its rules in this order: (1) match an existing translation (reply of a known connection); (2) for a
  new inbound packet, match a static forward; (3) otherwise drop; (4) for a new outbound packet, allocate a
  dynamic PAT row. The table row that decided is highlighted.
- **Rules:**
  1. Outbound, new connection: R rewrites the **source** to `203.0.113.5:nextPort` and adds a PAT row; ports
     61000, 61001, … (book ch11 Primjer 4; `pat`'s model, reused as is).
  2. Inbound packet matching a PAT row (outside port + remote endpoint): rewrite the destination back to the
     inside address (ch11 Primjer 4 (a)).
  3. Inbound packet matching a static forward (same protocol and outside port): rewrite the **destination**
     to the forward's inside ip:port; the **source stays the outside client's address**, so S sees
     198.51.100.77; R records the connection so S's replies are translated back (RFC 3022 §2: static address
     maps for sessions in the opposite direction; book ch11 "NAT: kad više uređaja dijeli jednu adresu").
  4. Inbound packet with no row and no forward: dropped silently (ch11 Primjer 4 (b): `203.0.113.5:61050`).
  5. Reply from S: its source `192.168.1.20:80` is rewritten to `203.0.113.5:<extPort>`; the destination
     (K) is untouched.
  6. A forward matches one protocol: a TCP forward does not let UDP to the same port in (check against the
     router UI used in class).
  7. Tie-break: the order is "existing connection first, then forward, then drop" (connection
     tracking runs before the prerouting DNAT for packets of a known connection) (check, Sources). Dynamic allocation
     skips any outside port that has a forward, so the two never collide (derived, check against Linux NAT port selection).
  8. Two forwards on one outside port are refused when added (one outside port names one inside socket),
     with a caption; the same inside server may have several forwards.
  9. Hairpin (inside client to the outside address): without NAT loopback the reply goes straight from S to
     A, not via R, and A drops it (RFC 4787 §6 REQ-9, hairpinning); `hairpin` param on → R also rewrites
     the source to 203.0.113.5 and the connection works.
- **Params:** `forward` toggle (adds TCP 8080 → 192.168.1.20:80, default off); `proto` choice TCP/UDP for the
  outside client's packet (default TCP); `extPort` select 8080 / 61050 / 61000 (default 8080); `hairpin`
  toggle (default off).
- **Presets:**
  1. `book-no-forward` — ch11 Primjer 4: A and B open 198.51.100.10:443 from 51000 → rows 61000 and 61001;
     then K sends to `203.0.113.5:61050`: no row, no forward → dropped. From the book.
  2. `add-forward` — forward TCP 8080 → 192.168.1.20:80; K `198.51.100.77:40000` → `203.0.113.5:8080`
     becomes `198.51.100.77:40000` → `192.168.1.20:80`; S replies, R rewrites the source back to
     `203.0.113.5:8080`; K sees an answer from the address it called. Derived, unchecked.
  3. `reply-vs-forward` — preset 1's rows, then the server's reply to A arrives at `203.0.113.5:61000` (rule 2)
     while K's packet to 8080 uses the forward (rule 3): both inbound, two different reasons. Derived.
  4. `wrong-proto` — the same forward, K sends UDP to 8080 → dropped. Derived (check).
  5. `hairpin` — A opens `203.0.113.5:8080` from inside: with `hairpin` off S answers A directly from
     192.168.1.20:80, A expected 203.0.113.5:8080 and drops it; with `hairpin` on it works. RFC 4787 REQ-9;
     derived.
- **Steps:** 1 → 5 (A out 2, B out 2, K in 1 dropped at R); 2 → 4 (K→R, R→S, S→R, R→K); 3 → 4 (starts with preset 1's rows filled:
  reply in 2, K's packet in 2); 4 → 1; 5 → 3 with `hairpin` off (A→R, R→S, S→A dropped), 4 on. All under 20.
- **Legend:** inside host (circle), router (square), outside host (diamond); packet with address fields;
  rewritten field (`.sd-changed`); dropped (✕); PAT row vs forward row (solid vs hatched row marker).
  "Changed" marks the rewritten fields and the table row used in this step.
- **Captions:** hr: "Korak 2: R nalazi zapis prosljeđivanja TCP 8080 → 192.168.1.20:80 i mijenja odredište.
  Izvor ostaje 198.51.100.77:40000 — poslužitelj vidi pravu adresu klijenta." en: "Step 2: R finds the
  forward TCP 8080 → 192.168.1.20:80 and rewrites the destination. The source stays 198.51.100.77:40000: the
  server sees the client's real address."; hr: "Korak 5: na 203.0.113.5:61050 nema ni zapisa u tablici ni
  prosljeđivanja, pa R paket odbacuje." en: "Step 5: there is neither a table row nor a forward for
  203.0.113.5:61050, so R drops the packet."
- **Terms:** port forwarding — prosljeđivanje *portova*; destination NAT (DNAT) — prevođenje odredišne
  adrese (check); translation table — tablica prijevoda; outside / inside address — vanjska / unutarnja
  adresa; router — usmjernik; hairpinning — *hairpinning* (petlja kroz usmjernik) (check).
- **Misconceptions:** (1) NAT is a firewall and that is why inbound fails (book ch11, RFC 4864: it is not a
  security mechanism; inbound fails because there is no row); (2) forwarding also changes the source, so the
  server sees the router; (3) a forward that works from outside must work from inside.
- **Out of scope:** UPnP/PCP automatic forwards, CGNAT (→ `cgnat`), firewall rules on top of the forward
  (→ `stateful-firewall`), timeouts of PAT rows, asymmetric return paths (→ `asymmetric-path`), container port
  publishing (→ preset task `lnx-container-ports` on this folder).
- **Builds on:** `pat`'s model (addresses, `nextPort` 61000, table rows and the drop of an unmatched inbound
  packet) and its table view; new are the static forward table, destination rewrite, reply translation and
  the hairpin toggle.
- **Note for the coordinator:** the Depends line names `nat`, but the model this extends is `pat` (book ch11
  Primjer 4); with §5.12 merging `nat`/`pat`, depend on the merged page. `lnx-container-ports` is a preset
  task on this folder, so the model must allow a host-side "container" as the inside address (10.88.0.5
  in that task) and the forward added by publishing host port 8080 to container port 80.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `port-forwarding` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh port-forwarding sims/port-forwarding` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/port-forwarding/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
