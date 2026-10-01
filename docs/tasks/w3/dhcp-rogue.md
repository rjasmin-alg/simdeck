# dhcp-rogue: Rogue DHCP and snooping

| | |
|---|---|
| Task | `dhcp-rogue` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-dhcp-rogue` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/dhcp-rogue/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM, SEC, WIN1 |
| Topic / tags / level | `networks` / `dhcp`, `attacks` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dhcp-dora` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the first offer wins, so a rogue server takes over**.

The student: add a rogue server, then trust ports.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/dhcp-dora/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (Uvod u Linux): "Tko dijeli adrese" → "Četiri poruke" (two servers on one segment, the client chooses, why a second server is not added "da se vidi radi li") and "Segment na kojem se to smije pokazati"
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "DHCP: DORA slijed, zakup adrese i razlog za broadcast" and its "Šire o temi" (several offers, the broadcast REQUEST tells the others); figure `assets/diagrams/ch14-dhcp-dora-broadcast.svg` (two servers S1, S2)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`: the chapter does not cover rogue DHCP or snooping; use it only for the attack/defence framing
- RFC 2131 §4.3.1, §4.3.2, §4.4.1 (offers, server identifier, client choice); RFC 2132 §3.5, §3.8, §9.7 (options 3, 6, 54)
- Cisco, Catalyst switch software configuration guide, "Configuring DHCP Features" (DHCP snooping, trusted/untrusted ports, binding database) (check exact title)
- Catalogue seed: URM ch18

## Model and presets

- **Scene:** one switched segment (one VLAN, 192.168.10.0/24): switch SW1 in the middle with numbered
  ports; the client on port 3, the legitimate DHCP server S1 (192.168.10.5) behind the uplink on port 1,
  and a second server R (the rogue) on port 7. Below, a message-sequence chart with lanes client / SW1 /
  S1 / R (kit K1 when it exists). With snooping on, each port shows a **trusted / untrusted** badge and a
  binding-table panel appears under the switch.
- **State:** `{ msgs: [...], offers: [{server, yiaddr, gw, dns, arrivesAt}], chosen, client: {ip, mask, gw,
  dns} | null, snooping, trusted: [ports], bindings: [{mac, ip, vlan, port}] }`.
- **One step:** one DHCP message (or, after configuration, one test packet) moves. Order in a step: message
  leaves its sender → the switch applies snooping (if on) → receivers act → caption.
- **Rules:**
  1. DISCOVER is a broadcast, so every server on the segment hears it, the rogue included (URM
     `14-aplikacijski-sloj.md` "DHCP: DORA slijed…"; UL `18-mrezne-usluge.md` "Četiri poruke").
  2. Every server that hears it may answer with an OFFER (UL ch18 "Četiri poruke", RFC 2131 §4.3.1).
  3. The client chooses; the model's client takes the **first OFFER to arrive** (common client behaviour;
     RFC 2131 §4.4.1 lets the client wait and choose (check)). Tie-break: offers arriving in the same step →
     the lower switch port wins (derived; keeps the model deterministic).
  4. The client's REQUEST is broadcast and names the chosen server (option 54); the other server reads it
     as a refusal and frees its offer (URM ch14 "Šire o temi"; UL ch18 "Četiri poruke"; RFC 2131 §4.3.2).
  5. Arrival order is set by each server's reply delay: on the same switch the rogue typically answers
     before a central server behind a relay (derived, unchecked).
  6. Whatever the chosen server put in options 3 and 6 becomes the client's gateway and DNS, so a rogue
     server can steer all off-subnet traffic and every name lookup through itself (RFC 2132 §3.5, §3.8;
     consequence derived).
  7. DHCP snooping: switch ports are untrusted by default; server messages (OFFER, ACK, NAK) arriving on an
     untrusted port are dropped; client messages pass. The uplink to the real server is configured trusted
     (Cisco Catalyst configuration guide, "Configuring DHCP Features" / "DHCP Snooping" (check title)).
  8. With snooping on, the switch records each ACK it lets through as a binding (MAC, IP, VLAN, port); the
     table is what dynamic ARP inspection later uses (same guide; link to `arp-spoofing`).
  9. Edge: snooping on but the uplink left untrusted → the legitimate OFFER is dropped too and nobody gets an
     address (derived; a common lab mistake).
- **Params:** `rogue` toggle (default on); `rogueKind` choice accidental (home router) / malicious (default
  per preset); `rogueDelay` range 1–20 ms (default 1); `serverDelay` range 1–20 ms (default 5);
  `snooping` toggle (default off); `trustUplink` toggle (default on).
- **Presets:**
  1. `one-server` — no rogue: client gets 192.168.10.100/24, gw 192.168.10.1, DNS 192.168.10.5. Baseline,
     derived.
  2. `home-router` — someone plugs a home router into port 7; it answers in 1 ms vs S1's 5 ms and wins:
     client gets 192.168.0.10/24, gw 192.168.0.1, cannot reach anything on 192.168.10.0/24. Derived,
     unchecked.
  3. `attacker` — malicious rogue, same subnet: offers 192.168.10.200, gw 192.168.10.66 and DNS
     192.168.10.66 (itself). Last step: the client's first packet to the internet goes to the attacker.
     Derived.
  4. `slow-rogue` — rogueDelay 10 ms > serverDelay 5 ms: S1's OFFER arrives first, the client picks S1 and
     R withdraws. Shows that the result is a race, not a rule (UL ch18 "Četiri poruke", last paragraph).
  5. `snooping` — snooping on, port 1 trusted: R's OFFER is dropped at port 7, client gets S1's address,
     binding (client MAC, 192.168.10.100, VLAN 10, port 3) recorded. From the Cisco guide; numbers derived.
  6. `snooping-misconfig` — snooping on, uplink untrusted: both OFFERs dropped, no address (rule 9).
- **Steps:** presets 1, 4, 5: 6 (start, DISCOVER, OFFER(s), REQUEST, ACK, configured); presets 2–3: 7 (plus
  the test packet); preset 6: 4.
- **Legend:** legitimate server and its messages (c1, solid), rogue and its messages (c5, hatched), client
  messages (c2), dropped at the switch (danger, ✕ on the port), trusted port (shield shape); "changed" marks
  the message just sent and the client field it set.
- **Captions:**
  - hr: "Lažni poslužitelj odgovorio je za 1 ms, pravi za 5 ms. Klijent uzima prvu *offer* (ponudu) i kao
    pristupnik dobiva 192.168.10.66."
  - en: "With DHCP snooping on, the switch drops the OFFER on untrusted port 7; only the server behind the
    trusted uplink is heard."
- **Terms:** rogue DHCP server — lažni (neovlašteni) DHCP poslužitelj; DHCP snooping — *DHCP snooping*
  (nadzor DHCP prometa) (check term); trusted port — pouzdani priključak; lease — zakup; offer — ponuda;
  default gateway — zadani pristupnik; man in the middle — napadač u sredini (check term).
- **Misconceptions:** the "official" server always wins; a rogue server is always an attacker (it is often a
  home router); snooping blocks clients from asking (it blocks only server replies on untrusted ports).
- **Out of scope:** DHCP starvation (exhausting the pool), option 82, Windows server authorization
  (`win-dhcp-authorization`), ARP inspection itself (`arp-spoofing`), IPv6 RA guard.
- **Reuse:** the DORA messages and client state from `dhcp-dora`; new here are several servers, arrival
  order, the switch filter and the binding table.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `dhcp-rogue` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh dhcp-rogue sims/dhcp-rogue` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dhcp-rogue/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
