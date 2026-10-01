# arp-local-remote: Local or remote, then ARP

| | |
|---|---|
| Task | `arp-local-remote` (wave 2a, Network fundamentals) |
| Catalogue entry | `net-arp-local-remote` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/arp-local-remote/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM |
| Topic / tags / level | `networks` / `arp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; pilot: its view becomes kit view **K2 topology with moving packets** (wave 2a) |

## Goal

One concept: **the host ANDs the mask, picks the target or the gateway, resolves its MAC**.

The student: step a ping to a local and a remote host.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` (Uvod u računalne mreže): "ARP: od IP adrese do MAC adrese" (request broadcast, unicast reply, ARP table, local/remote decision with the mask), Primjer 2 (ista mreža ili druga?), Primjer 5 (kome ARP zahtjev stiže), Primjer 6 (/28 mask)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch08-lokalno-udaljeno-odrediste.svg` and `ch08-arp-zahtjev-odgovor.svg`
- RFC 826 (An Ethernet Address Resolution Protocol: broadcast request, "swap" and unicast reply, merge rule); RFC 1122 §3.3.1 and §3.3.1.1 (Local/Remote Decision)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 1 "Adresa i granica", card "Maska i granica" (one flow: mask → local or remote → ARP)
- Catalogue seed: URM cards ch08-lokalno-udaljeno-odrediste, ch08-arp-zahtjev-odgovor → §5.9

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** K2 topology (this sim is its pilot): one Ethernet segment with hosts A (192.168.1.10), B
  (192.168.1.20), C (192.168.1.30), all /24, and the default gateway R (192.168.1.1) whose other side leads
  to a cloud labelled "Internet" holding 8.8.8.8. Over A: a **decision box** with the two AND results in
  binary and dotted decimal. Under each host: its ARP table. A frame being sent is drawn with its MAC
  header (dst, src) and the IP packet inside (src, dst IP).
- **State:** `{ phase, src, dstIp, mask, nextHop, decision: 'local'|'remote'|null, arp: {host: [{ip, mac,
  state}]}, frame: {dstMac, srcMac, srcIp, dstIp, kind: 'arp-req'|'arp-rep'|'ip'}|null, heardBy: [] }`.
- **One step:** one phase of sending one packet: (1) AND own address with the mask, (2) AND destination with
  the mask, (3) compare → choose next hop (destination or gateway), (4) look up the next hop in the ARP
  table, (5) ARP request broadcast, (6) everyone hears, only the owner answers and both learn, (7) ARP reply
  unicast, (8) frame sent with the learned MAC. Steps 5–7 are skipped on a cache hit.
- **Rules:**
  1. The host ANDs the destination and its own address with the mask of the outgoing interface; equal
     results → destination on the connected network, sent directly (RFC 1122 §3.3.1.1 "Local/Remote
     Decision"; URM `08-mrezni-sloj.md` "ARP: od IP adrese do MAC adrese", Primjer 2).
  2. Different results → the next hop is the default gateway; the IP destination stays the remote address
     (RFC 1122 §3.3.1; URM ch08 Primjer 5b).
  3. ARP is asked only for the **next hop**, never for a remote destination: ARP does not leave the segment
     (RFC 826; URM ch08 Primjer 5b).
  4. If the next hop is in the ARP table, no ARP request is sent (URM ch08 "ARP tablica").
  5. The request is a broadcast (dst MAC ff:ff:ff:ff:ff:ff): every station on the segment hears it, only the
     owner of the target IP answers, with a unicast reply to the asker (RFC 826; URM ch08 Primjer 5a).
  6. The owner adds the asker's <IP, MAC> to its own table on receiving the request (RFC 826 "add the
     triplet"); the asker adds the target's on the reply. C hears the request but does not answer (and, per
     RFC 826, updates an entry for A only if it already had one).
  7. In the frame, dst MAC = next hop's MAC; dst IP = the final destination (URM ch08 Primjer 5b).
- **Params:** `dst` select of destinations (192.168.1.20, 192.168.1.30, 192.168.2.50, 8.8.8.8, own gateway)
  (default per preset; the kit has no free-text param); `mask` choice /24, /25, /28 (default /24); `cache` toggle "A's ARP table already has the next hop" (off).
- **Presets:**
  1. `local` — A → B, cache empty: 192.168.1.10 AND /24 = 192.168.1.0 = 192.168.1.20 AND /24 → local; ARP for
     192.168.1.20, B and C and R hear it, only B replies; frame dst MAC = B's. From URM ch08 Primjer 5a.
  2. `remote` — A → 8.8.8.8: 8.8.8.0 ≠ 192.168.1.0 → remote; ARP for 192.168.1.1 (not 8.8.8.8); frame dst MAC
     = R's, dst IP 8.8.8.8. From URM ch08 Primjer 5b.
  3. `looks-close` — A → 192.168.2.50: 192.168.2.0 ≠ 192.168.1.0 → remote, goes via R although it "looks"
     like a neighbour. From URM ch08 Primjer 2b.
  4. `cache-hit` — `remote` again with R already in A's table: steps 5–7 are skipped, the frame goes at once.
     Derived.
  5. `mask-28` — host 192.168.5.77/28 (gateway 192.168.5.65): to 192.168.5.70 → 77 AND 240 = 64 = 70 AND 240
     → local; to 192.168.5.90 → 80 ≠ 64 → remote. From URM ch08 Primjer 6 (network 192.168.5.64/28);
     destinations derived.
- **Steps:** `local` 8, `remote` 8, `looks-close` 8, `cache-hit` 5, `mask-28` 8 + 8 = 16 (two packets).
- **Legend:** broadcast frame (dashed arrows to all), unicast frame (solid arrow), ARP entry (row), the
  decision result (local ✓ / remote →R); "changed" marks the new ARP entry, the bits that differ after the
  AND, and the next-hop choice.
- **Captions:**
  - hr: "192.168.2.50 AND 255.255.255.0 = 192.168.2.0, a A je u 192.168.1.0. Odredište je udaljeno: A ARP-om
    traži MAC adresu *default gateway* (zadani pristupnik) 192.168.1.1, ne odredišta."
  - en: "B and C both hear the broadcast, but only B owns 192.168.1.20, so only B answers, straight to A. B
    has also stored A's address on the way."
- **Terms:** subnet mask — podmrežna maska; bitwise AND — bitovno I; default gateway — zadani pristupnik;
  ARP request / reply — ARP zahtjev / odgovor; ARP table (cache) — ARP tablica (ARP predmemorija);
  broadcast / unicast — emitirano (*broadcast*) / jednoodredišno (unicast); next hop — sljedeći skok (check).
- **Misconceptions:** a host ARPs for a remote IP address; the gateway's IP goes into the packet as the
  destination; everyone who hears an ARP request answers it.
- **Out of scope:** what the router does next (`net-hop-rewrite`); ARP spoofing (`net-arp-spoofing`); IPv6
  NDP (`net-ipv6-ndp`); entry aging timers; gratuitous ARP.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `arp-local-remote` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh arp-local-remote sims/arp-local-remote` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/arp-local-remote/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
