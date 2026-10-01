# packet-journey: The whole journey: from URL to page

| | |
|---|---|
| Task | `packet-journey` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-packet-journey` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/packet-journey/` |
| Class | stepper |
| Size | L |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `encapsulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `encapsulation` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **DNS, ARP, TCP, TLS, HTTP in order, across the real path**.

The student: step the capstone, open each part's own simulator.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/encapsulation/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/16-cjelina-klik-do-odgovora.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch16-*.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch16-put-podataka-detaljno → §5.9)
- Catalogue seed: URM card ch16-put-podataka-detaljno → §5.9
- URM ch16 sections "Adresa dobivena unaprijed: DHCP prije prvog klika", "Ime pretvoreno u adresu", "Lokalno ili udaljeno, i pronalazak susjeda", "Kroz usmjernike do poslužitelja", "Veza prije zahtjeva", "Zahtjev, odgovor i put unatrag" (with the summary table of filters), and Primjer 1–6
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch16-put-podataka-detaljno.svg` (addresses 192.168.1.23, 192.168.1.1, 203.0.113.10:443)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/03-put-podataka.md` "Put kroz mrežu: od klika do prikazane stranice" (the simplified nine-step chain ch16 expands)
- URM ch11 (TTL 64 → 63, NAT/NAPT), ch08 (ARP, local/remote), ch13 (handshake), ch14 (DORA, DNS, HTTP), ch18 "Šifriranje prometa: VPN, TLS i dvije vrste enkripcije"
- RFC 9112 §9.3 (persistent connections), RFC 8446 §2 (TLS 1.3 handshake), RFC 5737 (documentation addresses)
- Pattern: ossimulator's `journey` capstone (`/home/rjasmin/projects/ossimulator/dist-single/journey.html`)

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** the ch16 path from the book's figure `ch16-put-podataka-detaljno`, left to right: Računalo
  `192.168.1.23/24` (Wi-Fi) → *access point* → Preklopnik → Usmjernik `192.168.1.1` (default gateway, NAT, and
  the DNS resolver in this model) → "Internet" (collapsed hops) → Poslužitelj `example.com` `203.0.113.10`.
  Kit view K2 (topology with moving packets). Under it, a **chain strip** of the ch16 phases (DHCP, DNS,
  lokalno/udaljeno, ARP, preklopnik, usmjernik, NAT, TCP, TLS, HTTP, zatvaranje), each pending, done or
  "odsutan" (absent), each with a link to the part's own sim. On the right: the host's DNS cache, ARP table and
  open connections, the router's NAT table, and a **capture list** (what a packet capture on the client shows). The
  packet in flight carries its headers as a stacked label (MAC src/dst, IP src/dst + TTL, ports, payload).
- **State:** `{ phase, hasAddr, packet: {at, l2:{src,dst}, l3:{src,dst,ttl}, l4:{proto,sport,dport,flags},
  app} | null, dnsCache:{name: {ip, ttl}}, arp:{ip: mac}, conns:[{sport, dport, state}], nat:[{priv, pub}],
  chain:{phaseId: 'pending'|'done'|'absent'}, capture:[{n, filter, summary}] }`. MACs are short labels.
- **One step:** one message or one packet-less decision. Order inside a step: (1) the host or device decides
  (cache lookup, AND with the mask, NAT lookup); (2) if a packet is sent, it moves and its headers update;
  (3) tables that learn from it update; (4) chain strip and capture list update. A cache hit or the
  local/remote decision is its own step with nothing on the wire, so the absence is visible. The first packet
  of a connection shows the router hop (NAT + TTL + MACs) as its own step; later packets cross the whole path
  in one step.
- **Rules:**
  1. DHCP runs only when the host has no address (`joined` off): DORA as broadcast, UDP 68 ↔ 67; the ACK
     carries mask, gateway and DNS server. Otherwise DHCP is "absent". (URM ch16 "Adresa dobivena unaprijed";
     ch14 DORA)
  2. Name resolution always precedes the request. Host caches (browser, then OS) are checked first; a hit
     sends no DNS packet and DNS is "absent". (ch16 "Ime pretvoreno u adresu"; ch16 Primjer 1)
  3. On a miss the host sends one recursive query (UDP to port 53, type A) to the resolver and gets the answer
     with a TTL. The resolver's iterative walk is not drawn (`dns-resolution` shows it). (ch16; ch14)
  4. Before any IP packet leaves, the host ANDs its own and the destination address with its mask: same
     network → send to the destination, else → to the default gateway. No packet. (ch16 "Lokalno ili
     udaljeno"; ch08)
  5. The host needs the next hop's MAC: ARP table hit → no packet, ARP "absent"; miss → broadcast request,
     unicast reply, entry stored. The resolver is the gateway here, so ARP comes before the DNS query and the
     later SYN finds the entry stored. (ch16; order ARP → DNS → TCP in ch16 Primjer 1; ch08)
  6. The switch forwards by its MAC table, floods broadcasts and unknown destinations, creates no packets and
     never changes the frame. (ch16 "Lokalno ili udaljeno", Šire o temi; ch07)
  7. At each router: IP src/dst unchanged, TTL −1, both MACs replaced. (ch16 "Kroz usmjernike"; ch16 Primjer 4;
     ch11, TTL 64 → 63)
  8. At the edge router NAPT rewrites the source `192.168.1.23:<sport>` to the public address and port and
     stores the mapping; the reply must return through the same device, which reverses it. The client capture
     never shows the public address. (ch16 "Kroz usmjernike"; ch16 Primjer 5; ch11 NAT/NAPT)
  9. TCP three-way handshake SYN, SYN-ACK, ACK from an ephemeral port to 80 (http) or 443 (https); "absent" when
     a connection to the same server and port is already open (HTTP/1.1 persistent connections, RFC 9112 §9.3).
     (ch16 "Veza prije zahtjeva"; ch16 Primjer 3)
  10. https only: a TLS handshake follows TCP and precedes the request, drawn as TLS 1.3 1-RTT in two steps
      (ClientHello; ServerHello … Finished, RFC 8446 §2); afterwards the capture shows only encrypted
      application data, not GET/200. http: GET and `200 OK` readable. (ch16 "Zahtjev, odgovor i put unatrag";
      ch18 "Šifriranje prometa")
  11. The response returns the same way (server → routers → NAT reverse → switch → AP → host) and is
      decapsulated layer by layer. (ch16 "Zahtjev, odgovor i put unatrag"; ch04)
  12. The connection stays open after the response: no FIN/RST unless `close` is on (then FIN/ACK each way,
      2 steps). (ch16 Primjer 6)
  - Tie-break: when a host cache can answer, the cache wins and the phase is "absent"; never draw a packet for
    a hit. A warm *resolver* cache does not make DNS absent on the client wire (see the note below).
- **Params:** `scheme` choice `http` | `https` (default `http`); `joined` toggle (already has an address, default
  on); `dnsWarm` toggle (default off); `arpWarm` toggle (default off); `connOpen` toggle (default off);
  `close` toggle (default off). All `resets: true`.
- **Presets:**
  1. `prvi-student` — from URM ch16 Primjer 1 (first student), `http://example.com`, DNS and ARP cold: capture =
     ARP request/reply for `192.168.1.1`, DNS query/answer `example.com → 203.0.113.10`, SYN/SYN-ACK/ACK to
     port 80, GET, `200 OK`; DHCP absent. TTL 64 at the host, 63 after the first router.
  2. `drugi-student` — from ch16 Primjer 1 (second student): everything warm; capture = SYN/SYN-ACK/ACK and
     GET/200 only; DHCP, DNS and ARP "odsutan".
  3. `arp-istekao` — from ch16 Primjer 2: DNS warm, ARP cold, https to 443: capture = ARP, SYN/SYN-ACK/ACK,
     TLS, encrypted request and response; DHCP and DNS absent.
  4. `novo-spajanje` — derived, unchecked: `joined` off, everything cold, https: the whole chain, DHCP first.
  5. `otvorena-veza` — from ch16 Primjer 3: connection already open, caches warm: two GET/200 pairs on the same
     source port, no SYN.
  - Derived, unchecked values: public NAT address `198.51.100.7` (RFC 5737 documentation range), client port
    `51000` → public port `40001`, DNS answer TTL `300`.
- **Steps:** prvi-student 13 (click/cache miss, local/remote for the resolver, ARP ×2, DNS ×2, local/remote for
  the server, SYN, router hop, SYN-ACK, ACK, GET, 200); drugi-student 8; arp-istekao 12; novo-spajanje 17
  (DHCP 2 steps: DISCOVER/OFFER, REQUEST/ACK); otvorena-veza 6. `close` adds 2 (max 19).
- **Legend:** packet on the wire (filled), decision without a packet (hollow), phase absent / cache hit (dashed,
  "odsutan"), NAT-rewritten field (hatched). "Changed" marks the header fields changed in this step (new MACs,
  TTL, rewritten source) and the table row just written.
- **Captions:** hr: "Korak 9: *router* (usmjernik) prosljeđuje paket: IP adrese iste, TTL 64 → 63, obje MAC
  adrese nove, a NAT mijenja izvor u 198.51.100.7:40001." / "Korak 2: ARP tablica već zna pristupnika, pa ARP-a
  na žici nema. To nije kvar, nego zapamćen odgovor."
  en: "Step 9: the router forwards the packet: IP addresses unchanged, TTL 64 → 63, both MACs new, and NAT
  rewrites the source to 198.51.100.7:40001." / "Step 2: the ARP table already knows the gateway, so there is
  no ARP on the wire. Not a fault: a remembered answer."
- **Terms:** default gateway — zadani pristupnik; router — usmjernik; switch — preklopnik; cache — predmemorija;
  three-way handshake — trostruko rukovanje; encapsulation — enkapsulacija; packet capture — snimka prometa;
  address translation — prevođenje adrese (NAT).
- **Misconceptions:** a missing DHCP/DNS/ARP/SYN packet in a capture means something failed (ch16: absence is
  remembered state); IP addresses change at every router (only MACs and TTL do, plus the NAT rewrite once);
  the client can see its public address in its own capture.
- **Reuse from `encapsulation` (and §5.9 path pages):** the header-stack label, layer names and the topology
  vocabulary of `arp-local-remote` and `hop-rewrite`. New here: the sequencing of phases, the caches that make
  phases absent, and the capture list. Each phase links to `dhcp-dora`, `dns-resolution`, `arp-local-remote`,
  `mac-table`, `hop-rewrite`, `nat`/`pat`, `tcp-handshake`, `tls-handshake`, `http-exchange` and the teardown
  preset on `tcp-handshake`.
- **Out of scope:** the resolver's iterative walk, TLS key exchange, IPv6/AAAA, HTTP/2–3 and QUIC, asymmetric
  return paths (`asymmetric-path`), Wi-Fi association, switch learning, loss and retransmission.
- **Note for the coordinator:** ch16 ("Ime pretvoreno u adresu" and Primjer 2) counts the *resolver* cache
  among the three caches whose hit leaves no DNS packet in the client capture; the client still queries the
  resolver, only the resolver's upstream walk disappears. This spec makes only browser/OS hits "absent".
  Also ch16 Primjer 2 lists a readable "HTTP GET and 200 OK" on port 443; on the client wire that is TLS
  application data. Both are worth a fix in the book.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `packet-journey` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh packet-journey sims/packet-journey` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/packet-journey/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
