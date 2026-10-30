<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wireguard: specification

One concept: **the handshake, cryptokey routing and roaming** of a WireGuard tunnel between two peers.
The student steps a handshake, sends a packet through the tunnel, and moves a peer.

Task: `docs/tasks/w3/wireguard.md`. Catalogue: `sec-wireguard` (`docs/catalogue.md` §4.3, overlap §5.9).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[WG]** J. A. Donenfeld, *WireGuard: Next Generation Kernel Network Tunnel* (the whitepaper, NDSS 2017).
  §2 "Cryptokey Routing" and §2.1 "Endpoints and Roaming"; §5 "Protocol & Cryptography" (Noise_IK, 1-RTT,
  message types: handshake initiation 1, response 2, cookie reply 3, transport data 4); "Silence is a Virtue".
  Read from memory, not re-fetched offline: section numbers and the silence section's number are *(check)* (the task
  says §5.3; my memory puts "Silence is a Virtue" at §5.1 and cookies at §5.3).
- **[URM18]** `uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`, „Šifriranje prometa: VPN, TLS i
  dvije vrste enkripcije": a VPN gives confidentiality, authentication and integrity; gateway-to-gateway and
  host-to-gateway (here: B is a gateway with a LAN behind it, A a host).
- **[NLA]** `napredna-linux-administracija/meta/toc.md` T09 "VPN — WireGuard i IPsec" (Core). Chapters are not
  written yet, so specifics derived from [WG] alone are marked *(check)*.
- **[T]** The task file's "Model and presets" (steps, presets, captions, terms).
- **[DH]** `sims/diffie-hellman/` (key chips, the shared-secret idea): reused as a visual idea only. Its model
  (`powMod`, paint mixing) is not needed here: the handshake's cryptography is out of scope [T], so no code is
  copied and no model is promoted.

## Scene

- **K1 message sequence chart** (`kit/sequence.js`), two lanes: **A** (the initiator, a host) and **B** (the
  responder, a gateway with a LAN behind it). Each lane card holds: the peer's own outer address (IP:port, a pin),
  its static key pair (private hatched with a lock, public as a key chip), the peer it talks to (that peer's public
  key and the endpoint it knows for it) and its session keys. Table rows name the peer and its public key
  (`B · fZ0fPf…`): the table maps prefix → peer key, hence "cryptokey" routing.
- **Cryptokey routing, one table per peer** (kit view K4, `kit/ruletable.js`, mode *most specific*, rank = prefix
  length): A's table (AllowedIPs of B and of a third peer C, which is only a table row, not a lane), B's table
  (AllowedIPs of A). The implicit row is "no peer: not sent" on A and "no match: dropped" on B.
- **Packet card**: the packet of the latest step, as an outer envelope (outer IP and UDP) around the WireGuard
  message; for transport data the inner IP packet inside it, hatched and locked while encrypted. Before encryption
  (at A) and after decryption (at B) the inner packet is shown alone.

## Scene data (fixed)

| | A | B | C (table row only) |
|---|---|---|---|
| tunnel address | 10.0.0.1 | 10.0.0.2 | — |
| LAN | 192.168.1.0/24 | 192.168.2.0/24 | — |
| outer address | 198.51.100.10:41414, after roaming 203.0.113.77:53001 | 192.0.2.1:51820 | 203.0.113.5:51820 |
| public key (shown as the first 6 characters) | `JHP7ur…` | `fZ0fPf…` | `ZNWC2n…` |

All outer addresses are from the documentation ranges (RFC 5737: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24).
The keys are 44-character base64 strings like real ones (the base64 of SHA-256 of "simdeck-wireguard-A"/B/C), not
real Curve25519 keys; no key is computed. UDP port 51820 is the port the whitepaper's examples use *(check)*; A's
41414 and 53001 are arbitrary source ports.

**Config.** A: peer B with AllowedIPs `10.0.0.2/32, 192.168.2.0/24` and endpoint 192.0.2.1:51820 (only with
`endpointKnown` on); peer C with AllowedIPs `10.0.0.0/24` (another peer, the rest of the tunnel net). B: peer A with
AllowedIPs `10.0.0.1/32` and **no endpoint**: B learns it (rule 4), as a gateway does for roaming hosts.

**Inner packet.** Source 10.0.0.1 (`allowedOk` on) or 192.168.1.20 (off: a host on A's LAN that B's AllowedIPs for
A do not include). Destination: the `innerDst` param, one of 10.0.0.2, 192.168.2.10, 10.0.0.3, 198.51.100.7.

## State

```
{ phase,
  a: { id, staticPub, tunnelIP, endpoint, configured, peers: [{ peer, pub, allowedIPs, endpoint }], session },
  b: { … same; peers: [{ peer: 'A', pub, allowedIPs: ['10.0.0.1/32'], endpoint: null }] },
  handshake: { init, resp, established, sessionKeys, ephemeral: { A, B } },
  routing: [{ prefix, peer, len }],            // A's cryptokey routing table (the task's `routing`)
  routingB: [{ prefix, peer, len }],
  lookup: null | { ip, hits: [bool], win },    // A's outbound lookup (win −1: no peer)
  check: null | { ip, hits: [bool], win, ok }, // B's inbound check
  packet: null | { kind: 'init'|'resp'|'data', where: 'wire'|'atA'|'atB', innerSrc, innerDst, outerSrc, outerDst,
                   peer, counter, delivered, dropReason },
  roamed, lastSeenEndpoint,                    // B's stored endpoint for A
  rows: [{ step, kind: 'msg'|'note', … }],     // chart rows
  changed: ['a.peers', 'b.endpointA', 'tableA', 'packet', …] }
```

`session` is `{ send, recv }` with the key names `k1` (A→B) and `k2` (B→A): A sends with k1 and receives with k2, B
the other way round. `dropReason`: `noEndpoint`, `noPeer`, `otherPeer`, `allowedIPs`, or null.

## Rules

1. **A peer is its static public key** [WG §2]: there are no certificates and no user names. B identifies the
   initiator by the static public key inside the Initiation and looks it up among its configured peers. A key that is
   not configured gets no response (rule 5). The state has no certificate or user field.
2. **The handshake is 1-RTT** [WG §5, Noise_IK] *(check round names)*: Initiation (A→B: A's ephemeral public key in
   clear, A's static public key encrypted to B's static public key, an encrypted timestamp) and Response (B→A: B's
   ephemeral public key, an empty encrypted payload). After these two messages both sides hold the same pair of
   symmetric session keys (k1 for A→B, k2 for B→A). No third handshake message.
3. **Cryptokey routing** [WG §2]. Outbound, the inner destination is matched against the AllowedIPs of all peers:
   the matching peer's session key encrypts the packet and it goes to that peer's endpoint. No match: not sent.
   Inbound, after decryption the inner **source** must fall in the AllowedIPs of the peer whose key decrypted it,
   or the packet is dropped. AllowedIPs is routing table and access list in one.
   **Tie-break: the most specific prefix wins** (longest prefix match) *(check)*: 10.0.0.2 matches B's
   10.0.0.2/32 and C's 10.0.0.0/24 → B. **Second tie-break:** the same prefix is never in two peers: assigning it
   to a second peer moves it there (the later assignment wins) *(check)*; the scene has no duplicate.
4. **Roaming** [WG §2.1]: a peer's endpoint is set from the outer source address of the most recent
   **authenticated** packet from that peer (a handshake message or transport data that decrypts with that peer's
   key). A peer can change address without reconfiguration; a packet that does not authenticate (a spoofed source)
   changes nothing. The endpoint is updated on authentication, before the inner-source check of rule 3, so a packet
   dropped by AllowedIPs still updates it *(check: order taken from the reference implementation's receive path,
   from memory)*.
5. **Silence** [WG "Silence is a Virtue"]: with nothing to send, nothing is sent (step 1 sends nothing); a packet
   that is unsolicited, does not authenticate, or is dropped by the AllowedIPs check gets no reply. No chart row is
   ever a reply to a dropped or unauthenticated packet.
6. **Over UDP** [WG]: the outer packet is IP + UDP (B listens on port 51820); the inner packet is the original IP
   packet, unchanged: its source and destination after decryption are those A sent.

Out of scope [T]: the Noise cryptography in detail, cookies, key rotation timers, keepalives, config syntax,
comparisons with other VPNs.

## Steps

| n | phase | does | chart row |
|---|---|---|---|
| 1 | `configure` | each peer gets the other's public key and AllowedIPs; the tables fill. Nothing is sent (rule 5) | — |
| 2 | `initiation` | A sends the Initiation to B's endpoint; B recognises A's key (rule 1) and stores A's endpoint (rule 4). Without `endpointKnown`: A has nowhere to send it, nothing is sent | msg A→B (or a note on A) |
| 3 | `response` | B answers to A's stored endpoint (rule 2); only if it recognised A's key (rules 1, 5) | msg B→A |
| 4 | `keys` | both derive the session keys k1, k2 (rule 2) | a note on each lane |
| 5 | `lookup` | A looks the inner destination up in its table (rule 3) | a note on A |
| 6 | `send` | encrypted with B's session key, sent to B's endpoint (rule 6); or not sent (`noPeer`, `otherPeer`, `noEndpoint`) | msg A→B (lock), or a note on A |
| 7 | `check` | B decrypts and checks the inner source against A's AllowedIPs: delivered, or dropped silently | a note on B, if anything arrived |
| 8 | `roam` | A's outer address becomes 203.0.113.77:53001; B still has the old one | a note on A |
| 9 | `learn` | A's next packet (same inner packet, counter 1) from the new address; B authenticates it and stores the new endpoint (rule 4), then checks it as in step 7 | msg A→B (lock) and a note on B (delivered or dropped); or, when not sent, a note on A |

Steps per action: `handshake` 4, `send` 7, `roam` 9 [T]. `sim.json` `steps` is 4 (the default action).

## Expected numbers (checked with a scratch Python script, `ipaddress`)

| inner destination | hits in A's table (B /32, B /24, C /24) | winner | outcome at step 7 (allowedOk on) |
|---|---|---|---|
| 10.0.0.2 | yes, no, yes | row 1, B (/32 beats /24) | delivered |
| 192.168.2.10 | no, yes, no | row 2, B | delivered (B forwards into its LAN) |
| 10.0.0.3 | no, no, yes | row 3, C | nothing reaches B (`otherPeer`) |
| 198.51.100.7 | no, no, no | none | not sent (`noPeer`) |

| inner source | hit in B's table (A /32) | outcome |
|---|---|---|
| 10.0.0.1 | yes | delivered |
| 192.168.1.20 | no | dropped (`allowedIPs`), no reply |

Endpoints: B's stored endpoint for A is null at steps 0–1, 198.51.100.10:41414 from step 2, and
203.0.113.77:53001 from step 9 when A's step-9 packet reaches B and authenticates (any `innerDst` that picks B,
`allowedOk` either way); otherwise it stays 198.51.100.10:41414.

## Params and presets

- `action` handshake / send / roam (default handshake; resets to step 0). `innerDst` (default 10.0.0.2),
  `allowedOk` (default on): only with send and roam. `endpointKnown` (default on): A has B's endpoint in its config.
- Presets [T]: `handshake` (action handshake, 4 steps), `routing` (send to 10.0.0.2, 7), `allowedips-drop` (send,
  allowedOk off, 7), `roaming` (roam, 9).

## Captions [T]

- Step 6, delivered to B by 10.0.0.2: hr "Odredišna adresa 10.0.0.2 poklapa se s AllowedIPs sudionika B — paket se
  šifrira njegovim ključem." / en "Destination 10.0.0.2 matches peer B's AllowedIPs — the packet is encrypted to B's
  key." (the task's sentence; in the page it closes step 5's lookup and opens step 6).
- Step 9: hr "Sudionik A promijenio je adresu; B ju je naučio iz sljedećeg provjerenog paketa." / en "Peer A changed
  its address; B learned it from the next authenticated packet."
