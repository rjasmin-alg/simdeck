<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipsec-ike: specification

Task `docs/tasks/w3/ipsec-ike.md`, catalogue `sec-ipsec-ike` (§4.3). One concept: **IKE phases, transport vs tunnel
mode, ESP**. The student steps a site-to-site tunnel coming up, a packet crossing it, and a rekey.

Sources: RFC 7296 (IKEv2) §1.2, §1.3, §1.4.1, §2.8, §2.9; RFC 4301 (IPsec architecture) §3.2, §4.1, §4.4.1, §5.1,
§5.2; RFC 4303 (ESP) §2, §2.6, §3.1, §3.3.3, §3.4. Section numbers from memory of the RFCs, not re-fetched offline:
*(check)*. NLA T09 chapters are not written yet, so nothing is quoted from them.

## Scene

Four lanes, left to right: **Host A** (10.1.0.5, site A 10.1.0.0/24), **GW-A** (outside 198.51.100.1),
**GW-B** (outside 203.0.113.1), **Host B** (10.2.0.9, site B 10.2.0.0/24). Documentation ranges (RFC 5737) outside,
private ranges inside.

| mode | IPsec peers (A, B) | the two middle lanes | selectors negotiated (TSi ↔ TSr) |
|---|---|---|---|
| tunnel | GW-A, GW-B | gateways: the IPsec peers | 10.1.0.0/24 ↔ 10.2.0.0/24 |
| transport | Host A, Host B | routers 10.1.0.1 and 10.2.0.1: forward, no IPsec | 10.1.0.5/32 ↔ 10.2.0.9/32 |

Transport mode is host-to-host (RFC 4301 §4.1), so the sim does not draw a transport-mode SA between gateways: the
hosts become the peers and the gateways plain routers. In transport mode the path between the hosts is **one routed
private network** (two subnets of one organisation), so the hosts' private addresses can be the outer header; the
routers show private addresses (10.1.0.1, 10.2.0.1), not the gateways' public ones. The packet off the selectors goes to **10.2.1.9** (a second
subnet behind GW-B that the tunnel's selectors do not cover; in transport mode also not Host B).

## Rules

1. **IKE sets up, ESP carries.** IKE builds and authenticates a secure channel (the IKE SA) and then negotiates the
   ESP SAs; it never carries the user's data (RFC 7296 §1). In the model: Child SAs exist only after IKE_AUTH; IKE
   messages (UDP 500) never hold an inner packet; data crosses only as ESP with a Child SA's SPI.
2. **Two exchanges.** IKE_SA_INIT: crypto proposal, Diffie–Hellman (KE), nonces, in the clear; after it both sides
   hold the same keys but nobody is authenticated yet (IKE SA *keyed*). IKE_AUTH: encrypted with those keys
   (`SK {…}`), each side proves its identity (PSK: a MAC with the shared key; certificate: CERT and a signature)
   and the first Child SA pair is created with its traffic selectors (RFC 7296 §1.2). With certificates the
   INIT response carries CERTREQ and each AUTH message carries CERT.
3. **SAs are one-way.** An SA is identified by SPI + protocol (ESP) + destination; a two-way tunnel needs a pair
   (RFC 4301 §4.1; RFC 4303 §2.1). The receiver picks the SPI of its inbound SA (RFC 7296 §1.3: the SPI in SA
   payload is the sender's inbound SPI *(check)*), so the SA into B is `b2000001` (chosen by B) and the SA into A
   is `a1000001`. Inbound lookup by (SPI, ESP, own address); no SA → drop (RFC 4303 §3.4.2). The triple is the task's
   wording (and RFC 2401's); RFC 4301 §4.1 lets a receiver find a unicast SA by the SPI alone or SPI + protocol
   *(check)*. The sim's SPIs are unique, so every reading finds the same SA.
4. **Tunnel vs transport is about who is protected.** Tunnel: a new outer IP header (gateway → gateway) wraps the
   whole original packet; ESP trailer *next header* = 4 (IPv4). The gateways protect the hosts behind them; the
   LAN legs (Host A → GW-A, GW-B → Host B) are plain. Transport: the original IP header stays (protocol 50) and only
   its payload (TCP) is protected; next header = 6 (TCP); the hosts themselves are the peers (RFC 4301 §3.2, §4.1;
   RFC 4303 §2.6). Same cipher, same strength in both.
5. **ESP: confidentiality + integrity + authentication** of the protected part (RFC 4303 §2, §3.1): encrypted =
   the payload part and the ESP trailer; authenticated (ICV) = ESP header + encrypted part. The outer IP header
   is not encrypted (anyone on the path reads it). Inbound: find the SA by SPI, check the ICV, and only then decrypt
   (RFC 4303 §3.4); a bad ICV → drop. The anti-replay check of the sequence number (RFC 4303 §3.4.3) comes before
   the ICV and is not drawn *(check)*. ESP never covers the IP header in front of it; AH (integrity only, also over
   the unchanging fields of the outer IP header) is named in the explanation, not simulated.
6. **Traffic selectors decide which packets enter which SA** (RFC 7296 §2.9). Outbound, the sender's SPD
   (RFC 4301 §4.4.1) gives PROTECT (through the Child SA), DISCARD or BYPASS. Inbound, after decryption, the receiver
   checks the inner addresses against the SA's selectors and drops a packet outside them (RFC 4301 §5.2).

**Tie-break (outbound SPD).** Overlapping entries: the most specific destination prefix wins (task). RFC 4301
§4.4.1 orders the SPD and takes the first match; the sim lists the entries most specific first, so both readings
give the same answer *(check)*. A packet matching no entry takes the implicit last entry, **BYPASS** (the normal
route, in the clear).

| entry (sender A's SPD) | tunnel | transport | action |
|---|---|---|---|
| 1 | 10.1.0.0/24 → 10.2.0.0/24 | 10.1.0.5/32 → 10.2.0.9/32 | PROTECT (Child SA to B) |
| 2 | 10.1.0.0/24 → 10.0.0.0/8 | 10.1.0.5/32 → 10.0.0.0/8 | DISCARD (no private traffic in the clear) |
| implicit | any → any | any → any | BYPASS |

| destination | entries hit | wins |
|---|---|---|
| 10.2.0.9 | 1 (/24 or /32), 2 (/8), implicit | 1, PROTECT |
| 10.2.1.9 | 2 (/8), implicit | 2, DISCARD: not tunnelled, not sent in the clear (the sim shows DISCARD) |
| 192.0.2.80 (tests only) | implicit | BYPASS |

**Rekey** (RFC 7296 §1.3.3, §2.8): SA lifetimes are local policy, not negotiated *(check)*; the example is 1 h. Before
it runs out a CREATE_CHILD_SA exchange inside the IKE SA (`SK {N(REKEY_SA), SA, Ni, TSi, TSr}`) makes a new pair
(`a1000002`, `b2000002`); traffic moves to it with the ESP sequence number starting again at 1 (RFC 4303 §3.3.3);
then an INFORMATIONAL exchange with Delete payloads removes the old pair (each side names its inbound SPI,
RFC 7296 §1.4.1). The IKE SA is not touched.

## Numbers

| | value | check |
|---|---|---|
| DH group (toy, from `diffie-hellman`) | p = 23, g = 5 | real groups ≥ 2048 bits |
| A's secret, KEi | a = 6, 5⁶ mod 23 = **8** | script |
| B's secret, KEr | b = 15, 5¹⁵ mod 23 = **19** | script |
| shared secret | 19⁶ mod 23 = 8¹⁵ mod 23 = **2** | script |
| SPIs, pair 1 | A→B `b2000001`, B→A `a1000001` | fixed |
| SPIs, pair 2 (rekey) | A→B `b2000002`, B→A `a1000002` | fixed |
| ESP seq | first packet on an SA = 1; rekey's old SA at 5120 | fixed |
| IKE | UDP 500 (NAT traversal's 4500 out of scope) | RFC 7296 §2 |
| ESP | IP protocol 50 | RFC 4303 |

Checked with a scratch Python script (pow, ipaddress) before coding; pinned in `sim.test.js`.

## Params and steps

`mode` tunnel | transport (tunnel); `auth` psk | cert (psk); `action` bring-up | send | rekey (bring-up);
`selectorMatch` on | off (on; ignored by rekey).

| action | selectorMatch on | off |
|---|---|---|
| bring-up | 8: init, auth, send, match, wrap, receive, deliver, lifetime | 5: init, auth, send, match, policy |
| send (tunnel already up) | 5: send, match, wrap, receive, deliver | 3: send, match, policy |
| rekey (tunnel already up) | 6: traffic, soft, ccs, moved, delete, reply | 6 |

One step: init = both IKE_SA_INIT messages (DH → IKE SA keyed); auth = both IKE_AUTH messages (identity, IKE SA up,
Child SA pair and selectors); send = Host A sends (tunnel: arrow to GW-A in the clear; transport: the packet is born
at the peer); match = A's SPD lookup; wrap = ESP per mode, A → B; receive = B finds the SA by SPI, checks the ICV,
decrypts; deliver = B checks the inner addresses against the SA's selectors and delivers (tunnel: arrow to Host B);
lifetime = note that the Child SA has a lifetime and is rekeyed; policy = DISCARD at A, nothing sent; traffic = a
packet on the old pair; soft = lifetime soft limit at A; ccs = CREATE_CHILD_SA request + response, new pair;
moved = the next packet on the new SA, seq 1; delete = INFORMATIONAL Delete both ways, old pair gone; reply = Host B's
reply on the new B → A SA. In tunnel mode the rekey's traffic steps also draw the plain LAN legs (Host A → GW-A;
Host B → GW-B and GW-A → Host A for the reply).

## Presets (keys 1–4)

| id | params | steps | ends with |
|---|---|---|---|
| `site-to-site` | defaults | 8 | 10.1.0.5 → 10.2.0.9 delivered through `b2000001`, tunnel mode |
| `transport` | mode transport | 8 | delivered host to host, original header kept, next header 6 |
| `no-selector` | selectorMatch off | 5 | 10.1.0.5 → 10.2.1.9 discarded at GW-A, no ESP sent |
| `rekey` | action rekey | 6 | pair 2 carries both directions, pair 1 deleted, IKE SA unchanged |

## Misconceptions the page answers

- "IKE encrypts the data": the chart shows IKE messages (UDP 500) and ESP data packets as different rows; the IKE SA
  box and the ESP SA box are separate, and the explanation says it.
- "Tunnel mode is stronger": the packet view shows the same ESP in both; what differs is the header kept and who the
  peers are.
- "One SA is two-way": each card shows two SAs (→ out, ← in) with different SPIs, and the rekey's reply uses the other.
