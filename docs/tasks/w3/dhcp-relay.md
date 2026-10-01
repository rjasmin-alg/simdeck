# dhcp-relay: DHCP relay and giaddr

| | |
|---|---|
| Task | `dhcp-relay` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-dhcp-relay` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/dhcp-relay/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, WIN1 |
| Topic / tags / level | `networks` / `dhcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dhcp-dora` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a relay forwards broadcasts as unicast and tags the subnet**.

The student: step a client on a remote subnet.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/dhcp-dora/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "DHCP: DORA slijed, zakup adrese i razlog za broadcast", "DHCP preko granica podmreža: opcije i posrednik" (footnotes rfc2131-relay, rfc2131-giaddr), Primjer 2 "DHCP dodjela preko posrednika u podružnici", Pitanja 11
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch14-dhcp-relay-giaddr.svg` (the book's figure for Primjer 2) and `ch14-dhcp-dora-broadcast.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/12-izgradnja-mreze.md` Primjer 1 "puna konfiguracija Grafo d.o.o." (address table: Prodaja /26, Uprava /28, Podružnica /28)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", page 8 "Aplikacijski slijedovi" (DHCP relay)
- RFC 2131 §1.5, §4.1 (relay agent, giaddr, BROADCAST bit, ports 67/68); RFC 1542 §4.1 (relay agent behaviour, hops); RFC 2132 §3.3, §3.5, §3.8 (options 1, 3, 6); RFC 3927 (169.254/16)
- Catalogue seed: URM card ch14 (relay)

## Model and presets

- **Scene:** the Grafo d.o.o. topology of URM ch14 Primjer 2, drawn as a small topology above a
  message-sequence chart (kit K1 when it exists). Nodes: new computer on SW2 (Podružnica, 192.168.1.112/28),
  R2 with LAN interface 192.168.1.113 acting as relay agent, the R2–R1 link, R1, and the DHCP server
  192.168.1.99 in Uprava (192.168.1.96/28). A dashed **subnet boundary** at R2. Next to the server, its two
  scopes (Podružnica 192.168.1.112/28, Prodaja 192.168.1.0/26) with the matching row highlighted. Under the
  chart a field strip of the current message: src/dst IP and port, `giaddr`, `hops`, `yiaddr`.
- **State:** `{ phase, msgs: [{type, from, to, srcIp, dstIp, srcPort, dstPort, giaddr, hops, yiaddr, cast}],
  client: {ip, mask, gw, dns} | null, relayOn, serverUp, attempts }`.
- **One step:** one message crosses one segment. Order inside a step: the message appears on the segment →
  the device it reaches applies its rule (relay rewrites, server picks a scope, client stores) → field strip
  and caption.
- **Rules:**
  1. The client sends DHCPDISCOVER and DHCPREQUEST as broadcast, from 0.0.0.0:68 to 255.255.255.255:67,
     because it has no address yet (URM `14-aplikacijski-sloj.md` "DHCP: DORA slijed, zakup adrese i razlog
     za broadcast"; RFC 2131 §4.1; ports in URM ch15 footnote rfc2131-ports).
  2. A router does not forward broadcasts; without a relay the DISCOVER ends at R2 (ch14 "DHCP preko
     granica podmreža", first paragraph).
  3. The relay receives the broadcast on its interface, writes that interface's address into `giaddr`
     (only if `giaddr` is 0), increments `hops`, and sends the message as unicast to the configured server
     address, port 67 (ch14 same section; RFC 2131 §1.5 and §4.1; RFC 1542 §4.1.1 for `hops` (check)).
  4. The server picks the scope that contains `giaddr`, not its own subnet: 192.168.1.113 → 192.168.1.112/28
     (ch14 Primjer 2; RFC 2131 §4.3.1 (check section)).
  5. If `giaddr` ≠ 0 the server sends OFFER and ACK to the relay at `giaddr`, port 67, never as broadcast
     (ch14, footnote rfc2131-giaddr: RFC 2131 §4.1).
  6. The relay delivers OFFER/ACK on the client's segment to port 68; the book draws it as broadcast
     (ch14 Primjer 2; RFC 2131 §4.1: broadcast when the client set the BROADCAST bit, else unicast to
     `yiaddr`/`chaddr` — show broadcast, mention the bit in the explanation).
  7. REQUEST and ACK take the same path as DISCOVER and OFFER (ch14 Primjer 2).
  8. The ACK carries option 1 (mask), option 3 (router) and option 6 (DNS); option 6 may point to another
     subnet (ch14 "DHCP preko granica podmreža"; RFC 2132 §3.3, §3.5, §3.8).
  9. Tie-break / edge: if the server is down or unreachable, the relay still forwards and nothing comes
     back; the client retransmits DISCOVER (RFC 2131 §4.1, about 4 s, 8 s, 16 s… (check)) and, on Windows,
     falls back to 169.254.x.x (URM ch08 "Javne i privatne adrese", RFC 3927).
- **Params:** `relay` toggle (default on); `server` toggle up/down (default up); `client` choice
  Podružnica / Prodaja / Uprava (default Podružnica).
- **Presets:**
  1. `branch` — ch14 Primjer 2: giaddr = 192.168.1.113, scope 192.168.1.112/28, offered 192.168.1.116;
     client ends with 192.168.1.116, 255.255.255.240, gw 192.168.1.113, DNS 192.168.1.99. From URM ch14
     Primjer 2.
  2. `sales-vlan` — ch14 question 11: relay is R1's subinterface 192.168.1.1, giaddr = 192.168.1.1,
     scope 192.168.1.0/26, mask 255.255.255.192, gw 192.168.1.1; offered 192.168.1.20 (address derived).
     From URM ch14 Pitanja 11 and ch12 Primjer 1 table.
  3. `same-subnet` — client in Uprava next to the server: no relay involved, `giaddr` stays 0.0.0.0, all
     four messages are local broadcasts, offered address from 192.168.1.96/28 (e.g. 192.168.1.100, derived).
     Contrast with preset 1.
  4. `no-relay` — relay off: DISCOVER stops at R2 (rule 2), three retransmissions, then 169.254.x.x.
     Derived, timings (check).
  5. `server-down` — relay on, server down: unicast DISCOVER reaches R1's side and is lost, no OFFER, same
     ending as preset 4; shows the single-server trade-off of ch14 "Šire o temi". Derived.
- **Steps:** presets 1–2: 9 (start, 8 segment crossings, configured); preset 3: 5; presets 4–5: 6.
- **Legend:** broadcast message (c1, wide arrow fanning out), unicast message (c2, thin arrow), relay
  rewrite (c3 badge on R2), dropped (danger, ✕); "changed" marks the field that the last device wrote
  (`giaddr`, `hops`, `yiaddr`) and the scope row the server picked.
- **Captions:**
  - hr: "R2 kao *relay agent* (posrednik) upisuje svoju adresu 192.168.1.113 u `giaddr` i šalje DHCPDISCOVER
    kao *unicast* poslužitelju 192.168.1.99."
  - en: "The server sees giaddr 192.168.1.113 and offers an address from the branch block 192.168.1.112/28,
    not from its own subnet."
- **Terms:** relay agent — posrednik; lease — zakup; broadcast — *broadcast* (promet upućen svima); unicast —
  *unicast*; default gateway — zadani pristupnik; subnet mask — podmrežna maska; option — opcija; offer —
  ponuda.
- **Misconceptions:** the server must sit on every subnet; the server hands out addresses from its own
  subnet; the relay is a special box rather than the router already there.
- **Out of scope:** option 82, DHCP failover, lease renewal T1/T2 (`dhcp-dora`), Windows scope options
  (`win-dhcp-scope-options`), IPv6 DHCPv6 relay.
- **Reuse:** from `dhcp-dora` reuse the message records, the DORA order and the client's configured state;
  new here are the relay rewrite (rules 3, 5, 6), scope choice by `giaddr` (rule 4) and the multi-segment
  topology.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dhcp-relay sims/dhcp-relay` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dhcp-relay/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
