# wireguard: WireGuard

| | |
|---|---|
| Task | `wireguard` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-wireguard` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/wireguard/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA, SEC |
| Topic / tags / level | `security` / `vpn` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `diffie-hellman` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **handshake, cryptokey routing, roaming**.

The student: step a handshake; move a peer.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/diffie-hellman/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T09 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T09 → §5.9
- J. A. Donenfeld, *WireGuard: Next Generation Kernel Network Tunnel* (the whitepaper): §2 cryptokey routing and roaming, §5 the Noise_IK handshake and 1-RTT, §5.3 silence. NLA chapters for T09 are not written yet; mark derived specifics *(check)*.
- URM ch18 „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije" (what a VPN is: gateway-to-gateway and host-to-gateway; confidentiality + authentication + integrity), `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`.

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** K1 message sequence chart with two peers (A initiator, B responder), each showing its static key pair
  and the peer config: the other's public key and `AllowedIPs`. Below the chart, a cryptokey-routing table per
  peer (destination prefix → peer public key) and a tunnel outer/inner packet view. A roaming lane lets peer A's
  public IP:port change. Stepper.
- **State:** `{ phase, a: {staticPub, endpoint, allowedIPs}, b: {...}, handshake: {init, resp, established,
  sessionKeys}, routing: [{prefix, peer}], packet: {innerSrc, innerDst, outerSrc, outerDst, peer, delivered,
  dropReason}, roamed, lastSeenEndpoint }`.
- **One step:** 1 peers are configured (static keys, AllowedIPs); 2 A sends Handshake Initiation (ephemeral +
  identity, encrypted to B's static public key); 3 B replies Handshake Response; 4 both derive symmetric session
  keys (1-RTT); 5 an inner packet to 10.0.0.2 is looked up in cryptokey routing → peer B; 6 it is encrypted and
  sent to B's current endpoint; 7 B decrypts and checks the inner source against B's AllowedIPs for A (drop if it
  does not match); 8 roaming: A's outer source IP:port changes; 9 B's next authenticated packet from A updates the
  stored endpoint automatically.
- **Rules:**
  1. Each peer is identified solely by its static public key; there are no certificates or usernames (WireGuard
     whitepaper, Donenfeld, §2).
  2. Handshake is 1-RTT (Initiation, Response) using Noise_IK; after it both sides hold symmetric session keys
     (whitepaper §5 „Noise") *(check round names)*.
  3. Cryptokey routing: outbound, the inner destination is matched against peers' `AllowedIPs` to pick the peer and
     its key; inbound, a decrypted packet's inner source must fall in that peer's `AllowedIPs` or it is dropped —
     `AllowedIPs` is both routing table and ACL (whitepaper §2).
  4. Roaming: the peer endpoint is learned from the source of the most recent *authenticated* packet, so a peer can
     move IP without reconfiguration and a spoofed source cannot hijack it (whitepaper §2, §5).
  5. Silence by design: with no traffic WireGuard sends nothing; an unsolicited or badly-keyed packet gets no
     reply (whitepaper §5.3) — makes the tunnel hard to probe.
  6. It runs over UDP on one port; the outer packet is UDP, the inner is the original IP packet (whitepaper).
  Tie-break: if two peers' `AllowedIPs` overlap for a destination, the most specific prefix wins (routing longest
  match) *(check)*.
- **Params:** `action` choice handshake/send/roam (handshake); `innerDst` select of inner addresses; `allowedOk`
  toggle (on: inner source matches AllowedIPs); `endpointKnown` toggle (on).
- **Presets:**
  - `handshake` the 1-RTT exchange, then session established. From the WireGuard whitepaper §5.
  - `routing` send to 10.0.0.2: picked peer B by AllowedIPs, encrypted to B's key, delivered. From whitepaper §2.
  - `allowedips-drop` a packet whose inner source is outside A's AllowedIPs arrives at B → dropped. From
    whitepaper §2.
  - `roaming` A moves to a new IP:port; B updates A's endpoint from the next authenticated packet; the tunnel
    continues. From whitepaper §2.
- **Steps:** `handshake` 4, `routing` 7, `allowedips-drop` 7, `roaming` 9.
- **Legend:** static public key (key chip), ephemeral (dashed key), session key (lock), tunnel packet (outer
  envelope around an inner one), AllowedIPs match (check) / mismatch (cross), endpoint (pin), changed (kit
  highlight on the message or table row touched this step).
- **Captions:** hr: "Odredišna adresa 10.0.0.2 poklapa se s AllowedIPs sudionika B — paket se šifrira njegovim
  ključem." / en: "Destination 10.0.0.2 matches peer B's AllowedIPs — the packet is encrypted to B's key." — hr:
  "Sudionik A promijenio je adresu; B ju je naučio iz sljedećeg provjerenog paketa." / en: "Peer A changed its
  address; B learned it from the next authenticated packet."
- **Terms:** peer — sudionik *(check)*; public key — javni ključ; private key — privatni ključ; handshake —
  rukovanje; tunnel — tunel; cryptokey routing — usmjeravanje po ključu *(check)*; endpoint — krajnja točka
  *(check)*; roaming — roaming / promjena mreže *(check)*.
- **Misconceptions:** WireGuard uses certificates like TLS; the handshake is many round trips; AllowedIPs is only
  a route (it is also an inbound filter).
- **Out of scope:** the Noise handshake cryptography in detail, key rotation timers, DNS/`wg-quick` config syntax,
  comparison tables with OpenVPN.
- **Builds on `diffie-hellman`:** reuses its public/private key chips and shared-secret idea; new are Noise_IK,
  cryptokey routing, the tunnel packet and roaming.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh wireguard sims/wireguard` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/wireguard/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
