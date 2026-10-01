# dhcp-dora: DHCP DORA and the lease

| | |
|---|---|
| Task | `dhcp-dora` (wave 2a, DHCP) |
| Catalogue entry | `net-dhcp-dora` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/dhcp-dora/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM, UL, WIN1 |
| Topic / tags / level | `networks` / `dhcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; pilot: its view becomes kit view **K1 message sequence chart** (wave 2a) |

## Goal

One concept: **discover/offer/request/ack, T1/T2 renewal, expiry**.

The student: step a client, let time run, unplug the server.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (Uvod u Linux), section "Tko dijeli adrese": "Četiri poruke", "Portovi 67 i 68, i zašto su dva", "Što poslužitelj pamti" (Kea lease file, `valid_lifetime=600`); "Šire o temi": "Koliko dodjela traje, i zašto to nije proizvoljno" (T1/T2, 600 → 300/525), "Što se uz adresu još dijeli" (options 1, 3, 6, 51); "Primjer 3 — koliko traje dodjela u učionici"
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-18/dhcp-cetiri-poruke.svg` (two servers, four messages)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže), section "DHCP: DORA slijed, zakup adrese i razlog za *broadcast*" and diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch14-dhcp-dora-broadcast.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch14 (DORA), UL ch18)
- RFC 2131 §3.1 (allocation exchange), §4.1 (broadcast flag, ports), §4.3.2, §4.4.5 (T1/T2, RENEWING/REBINDING, retransmission), §4.4.6 (RELEASE); RFC 2132 options 1, 3, 6, 51, 54, 58, 59
- Windows default lease of 8 days: Microsoft, "DHCP Server" / "Dynamic Host Configuration Protocol (DHCP)" in the Windows Server documentation (check the exact title)
- Catalogue seed: URM card ch14 (DORA), UL ch18

## Model and presets

- **Scene:** kit view K1 message sequence chart. Lanes: Klijent (MAC `52:54:00:37:ea:d6`, name `democli1`), Poslužitelj A, optionally Poslužitelj B. Under the chart a lease bar for the client: start, T1, T2, expiry, with a "now" marker. Each server shows its lease table (address, MAC, expiry) and an up/down badge.
- **State:** `t` (seconds since start), `client: { state: INIT|SELECTING|REQUESTING|BOUND|RENEWING|REBINDING, addr, serverId, leaseStart, lease, t1, t2 }`, `servers: [{ id, ip, up, pool: [addr…], leases: [{ addr, mac, expires }], offered: { addr, mac } | null }]`, `msgs: [{ n, from, to, type, bcast, fields }]`, `events` (preset script: `{ at, serverId, up }`).
- **One step:** exactly one protocol event, in this order of checks: (1) apply scripted events due at the current `t` (server up/down); (2) if a message is in flight, deliver it and let the receiver react (server offers/acks/naks, client selects); (3) otherwise advance `t` to the next timer (T1, T2, expiry, retry) and let the client act. The changed lane, message and lease-bar segment are highlighted.
- **Rules:**
  1. A client without an address broadcasts DHCPDISCOVER from `0.0.0.0:68` to `255.255.255.255:67` (RFC 2131 §4.1, §4.4.1; UL ch18 "Četiri poruke", "Portovi 67 i 68").
  2. Every server that is up and has a free address answers DHCPOFFER with `yiaddr`, lease time (option 51) and server identifier (option 54); it need not reserve the address (RFC 2131 §3.1 step 2; UL ch18).
  3. The client takes **the first offer it receives**; tie-break in the model: the server listed first answers first. It then **broadcasts** DHCPREQUEST naming the chosen server in option 54 (RFC 2131 §3.1 steps 3; UL ch18 "Treće, klijent bira i to kaže svima").
  4. The chosen server records the binding and sends DHCPACK; a server that sees a REQUEST naming another server frees its offered address (RFC 2131 §3.1 step 4; UL ch18 "Četvrto").
  5. OFFER and ACK are drawn as broadcast while the client has no address (the BROADCAST flag is set, the URM ch14 picture); the field panel says that without the flag the server may unicast to `yiaddr`/`chaddr` (RFC 2131 §4.1). See the coordinator note.
  6. T1 = 0.5 × lease, T2 = 0.875 × lease unless options 58/59 say otherwise (RFC 2131 §4.4.5; UL ch18 "Koliko dodjela traje": lease 600 s → 300 s and 525 s). The model uses exact values, no random fuzz (RFC says SHOULD fuzz; say so in the explanation).
  7. At T1 the client enters RENEWING and **unicasts** DHCPREQUEST to the server that gave the lease; an ACK restarts the lease from now (RFC 2131 §4.4.5).
  8. At T2 the client enters REBINDING and **broadcasts** DHCPREQUEST to any server; only a server that knows this lease ACKs it, a server that does not stays silent (RFC 2131 §4.3.2 "REBINDING" (check)).
  9. While RENEWING/REBINDING without an answer the client retries; the model retries once, after half the time left to the next timer but at least 60 s (RFC 2131 §4.4.5); if that is past the next timer, no retry.
  10. At expiry the client stops using the address, returns to INIT and starts over with DISCOVER (RFC 2131 §4.4.5). No offers → the client stays INIT (on Windows it would fall back to APIPA `169.254.0.0/16`, shown only as a caption (check)).
  11. A DHCPNAK sends the client to INIT; DHCPRELEASE frees the binding early (RFC 2131 §3.1, §4.4.6; UL ch18).
- **Params:** `lease` choice 600 s / 2 h / 8 days (default 600 s); `serverB` toggle (default off); `failAt` choice none / at T1 / at T2 (which server goes down; default none); `bcastFlag` toggle (default on).
- **Presets:**
  1. `lease-600` — from UL ch18 "Koliko dodjela traje": one server, lease 600 s, client gets `192.168.180.100`; RENEWING at 300 s, ACK, new T1 at 600 s, T2 at 825 s. Outcome: client stays BOUND.
  2. `two-servers` — from UL ch18 figure `dhcp-cetiri-poruke.svg`: A and B both offer (`.100` and `.150`), client takes A (first), B frees `.150` on seeing the REQUEST. Outcome: one lease, on A.
  3. `server-dies` — derived, unchecked: lease 600 s, A goes down at 290 s. RENEW at 300 s and retry at 412.5 s fail (half of 225 s), REBIND at 525 s fails, the retry would be at 562.5 s but the 60 s minimum moves it to 585 s, and it fails, expiry at 600 s → INIT, DISCOVER gets no offer.
  4. `rebind-to-b` — derived, unchecked: as 3 but B is a failover partner that knows the lease: RENEW to A fails, REBIND at 525 s is ACKed by B. Outcome: BOUND on B, lease restarted at 525 s.
  5. `classroom-2h` — from UL ch18 Primjer 3: lease 2 h → T1 1 h, T2 1 h 45 min; machine switched off after 50 min (RELEASE not sent), lease still held on the server until 2 h. Outcome: the server's table shows the address booked for 70 min after the machine left.
  6. `windows-8d` — Windows Server DHCP default lease 8 days (check) → T1 4 days, T2 7 days. Outcome: an option change on the server reaches this client only at its T1, 4 days later.
- **Steps:** lease-600 8; two-servers 7; server-dies 11; rebind-to-b 9; classroom-2h 7; windows-8d 7.
- **Legend:** solid arrow = unicast, dashed arrow with a fan = broadcast, ✕ on an arrow = lost (server down); lease bar segments BOUND / RENEWING / REBINDING with patterns, not only colour; server badge up ▲ / down ▼. "Changed" marks the newest message, the client state box and the lease-bar segment that moved.
- **Captions:**
  - hr: "T1 = 300 s: klijent ulazi u stanje obnavljanja (*renewing*) i šalje DHCPREQUEST izravno poslužitelju A — samo njemu."
  - en: "T1 = 300 s: the client enters RENEWING and unicasts DHCPREQUEST to server A, and to nobody else."
  - hr: "Istekao je *lease* (zakup adrese): klijent prestaje koristiti 192.168.180.100 i kreće ispočetka s DHCPDISCOVER."
  - en: "The lease has expired: the client stops using 192.168.180.100 and starts again with DHCPDISCOVER."
- **Terms:** lease — zakup (URM) / dodjela (UL); broadcast — *broadcast* (emitiranje, UL "emitira"); renewing — obnavljanje; rebinding — ponovno vezanje; lease time — trajanje dodjele; server identifier — oznaka poslužitelja; address pool — skup adresa; relay agent — posrednik.
- **Misconceptions:** "the client keeps its address until it expires and only then asks" (it renews at half time); "the second server is a backup that takes over the lease" (a plain second server does not know the lease; only a failover partner can rebind it); "OFFER means the address is mine".
- **Out of scope:** relay and `giaddr` (`net-dhcp-relay`), rogue servers (`net-dhcp-rogue`), DHCPDECLINE/ARP probe, INIT-REBOOT after a reboot, IPv6/DHCPv6, option contents beyond 1/3/6/51/54.
- **Note for the coordinator:** URM ch14 "DHCP: DORA slijed" says all four messages are broadcast; RFC 2131 §4.1 makes OFFER/ACK broadcast only when the client sets the BROADCAST flag. The spec follows the RFC with the flag on by default, so the default picture matches the book; consider a footnote in URM.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dhcp-dora sims/dhcp-dora` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dhcp-dora/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
