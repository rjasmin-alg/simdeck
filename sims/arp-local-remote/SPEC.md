# arp-local-remote: Local or remote, then ARP

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w2/arp-local-remote.md` (catalogue `net-arp-local-remote`, §4.1; overlap §5.9). Class: stepper.
Pilot of kit view **K2: topology with moving packets**.

**One concept:** the host ANDs the mask, picks the target or the gateway, resolves its MAC.

## Scene

One Ethernet segment, stations in wire order left to right, then the router's other side (a cloud, "Internet").

| Net (`net`) | A | B | C | R (default gateway) | A's mask | Packets |
|---|---|---|---|---|---|---|
| `lan` | 192.168.1.10 | 192.168.1.20 | 192.168.1.30 | 192.168.1.1 | param `mask` (/24, /25, /28) | one, to param `dst` |
| `lan28` | 192.168.5.77 | 192.168.5.70 | 192.168.5.74 | 192.168.5.65 | /28 (fixed) | two: 192.168.5.70, then 192.168.5.90 |

MAC addresses (locally administered, chosen so the letter shows): A `02:00:00:aa:aa:aa`, B `02:00:00:bb:bb:bb`,
C `02:00:00:cc:cc:cc`, R `02:00:00:00:00:01`. Every remote destination sits in the cloud behind R.

Sources: URM `08-mrezni-sloj.md` Primjer 5 (A, B, C, gateway 192.168.1.1, all /24), Primjer 2 (192.168.2.50),
Primjer 6 (192.168.5.77/28, network 192.168.5.64, usable .65–.78). The `lan28` B, C and destinations, and every MAC,
are derived (*check*: the book gives no MACs).

Only A's mask is a param: the decision is A's (RFC 1122 §3.3.1.1 uses "the address mask" of the source's
interface). B, C and R keep /24 in `lan`; their masks never enter the model.

## State

```
{ pkt, packets, phase, src: 'A', dstIp, mask, netSrc, netDst, decision: 'local'|'remote'|null, nextHop, hit,
  arp: { A: [{ip, mac, state}], B: […], C: […], R: […] }, frame: {kind: 'arp-req'|'arp-rep'|'ip', dstMac, srcMac,
  srcIp, dstIp | targetIp, from, to} | null, heardBy: [ids], answeredBy, deliveredTo, done }
```

ARP entry `state`: `new` (added in this step), `refreshed` (existing entry overwritten in this step), `old`.

## One step

One phase of sending one packet:

| # | Phase | What changes |
|---|---|---|
| 1 | `andSrc` | `netSrc = A AND mask` |
| 2 | `andDst` | `netDst = dst AND mask` |
| 3 | `decide` | `decision`, `nextHop` (rules 1–2) |
| 4 | `lookup` | `hit` = next hop in A's table (rule 4) |
| 5 | `arpReq` | frame `arp-req`, dst MAC broadcast, target IP = next hop (rules 3, 5) |
| 6 | `arpHear` | `heardBy` = every station but A; owner adds A; others refresh only (rule 6) |
| 7 | `arpRep` | frame `arp-rep`, unicast owner → A; A adds the owner (rule 6) |
| 8 | `send` | frame `ip`, dst MAC = next hop's MAC, dst IP = destination (rule 7); `deliveredTo` |

On a hit, step 5 is `send` (steps 5–7 skipped): a packet takes 8 steps, or 5 on a hit. After `send` the next packet
(if any) starts at `andSrc` with the ARP tables as they are. Steps for a run = sum over its packets; the kit's
`steps(params)` replays to `done`.

## Rules

1. **Local.** A ANDs the destination and its own address with the mask of the outgoing interface; equal results →
   destination on the connected network, next hop = destination (RFC 1122 §3.3.1.1 (b); URM ch08 "ARP: od IP adrese
   do MAC adrese", Primjer 2a).
2. **Remote.** Different results → next hop = default gateway; the IP destination stays the remote address
   (RFC 1122 §3.3.1.1 (c), §3.3.1; URM ch08 Primjer 5b).
   *Tie-break:* the destination equal to the gateway itself is local (its AND matches); next hop = the gateway as the
   destination, not "via the gateway".
3. **ARP asks for the next hop only**, never for a remote destination: the request's target IP = `nextHop`
   (RFC 826 broadcast stays on the cable; URM ch08 Primjer 5b).
4. **Cache hit:** next hop already in A's table → no ARP request; `send` follows `lookup` (URM ch08 "ARP tablica").
5. **Request is broadcast** (dst MAC `ff:ff:ff:ff:ff:ff`): every station on the segment except the sender hears it
   (`heardBy` in wire order); only the owner of the target IP answers, unicast to the asker (RFC 826; URM ch08 Primjer 5a).
6. **Learning (RFC 826 merge):** every station that hears the request and already has an entry for the sender's IP
   overwrites its MAC (`refreshed`); the target adds the sender if it had no entry (`new`); a non-target with no entry
   adds nothing. The asker adds (or refreshes) the target's entry on the reply.
   *Tie-break:* C hears and stays empty; in `lan28` packet 2, B hears the request for R and refreshes its A entry
   (learned on packet 1) but does not answer.
7. **The frame:** dst MAC = the next hop's MAC, src MAC = A's; src IP = A's, dst IP = the final destination
   (URM ch08 Primjer 5b, 7b).

## Params

| Key | Type | Values | Default |
|---|---|---|---|
| `net` | choice | `lan`, `lan28` | `lan` |
| `dst` | select (visible in `lan`) | 192.168.1.20, 192.168.1.30, 192.168.2.50, 8.8.8.8, 192.168.1.1 | 192.168.1.20 |
| `mask` | choice (disabled in `lan28`: fixed /28) | 24, 25, 28 | 24 |
| `cache` | toggle | A's table already holds every next hop of the run | off |

Default params: 8 steps (`sim.json` `steps: 8`). The longest run is `lan28` without cache: 16 (≤ 20).

## Presets and expected numbers (checked by script and `sim.test.js`)

| # | Id | Params | Steps | netSrc / netDst | Decision | ARP target | Frame dst MAC / dst IP |
|---|---|---|---|---|---|---|---|
| 1 | `local` | dst .1.20 | 8 | 192.168.1.0 / 192.168.1.0 | local | 192.168.1.20; B, C, R hear, B answers | B's / 192.168.1.20 |
| 2 | `remote` | dst 8.8.8.8 | 8 | 192.168.1.0 / 8.8.8.0 | remote | 192.168.1.1 (not 8.8.8.8); R answers | R's / 8.8.8.8 |
| 3 | `looks-close` | dst 192.168.2.50 | 8 | 192.168.1.0 / 192.168.2.0 | remote | 192.168.1.1 | R's / 192.168.2.50 |
| 4 | `cache-hit` | dst 8.8.8.8, cache | 5 | 192.168.1.0 / 8.8.8.0 | remote | none (hit) | R's / 8.8.8.8 |
| 5 | `mask-28` | net lan28 | 8 + 8 = 16 | 192.168.5.64 / 192.168.5.64, then 192.168.5.64 / 192.168.5.80 | local, then remote | 192.168.5.70 (B answers), then 192.168.5.65 (R answers; B refreshes A) | B's / .70, then R's / .90 |

Arithmetic: 77 AND 240 = 64, 70 AND 240 = 64, 90 AND 240 = 80 (URM ch08 Primjer 6: 77 = 01001101, 240 = 11110000).

Other combinations, derived and shown by the params: `lan` with /28 sends to B (192.168.1.20 AND /28 = 192.168.1.16 ≠
192.168.1.0) via R although B is on the same wire (A's mask is wrong for the segment); /25 changes nothing for these
addresses (all below 128). What R does with the packet next is out of scope (`net-hop-rewrite`).

## Legend

Broadcast frame (dashed arrows to all), unicast frame (solid arrow), ARP entry (row), decision (local ✓ / remote → R),
changed (yellow + ink outline: the new ARP entry, the bits that differ after the AND, the next-hop choice).

## Out of scope

What the router does next; ARP spoofing; IPv6 NDP; entry aging; gratuitous ARP; ICMP redirect in the /28-on-/24 case.
