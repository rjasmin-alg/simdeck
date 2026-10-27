<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-ndp: specification

One concept: **neighbour solicitation to the solicited-node multicast**. The student steps an IPv6 neighbour
lookup next to an ARP lookup on the same three hosts. Task: `docs/tasks/w3/ipv6-ndp.md`; catalogue `net-ipv6-ndp`
(§4.1). Model: `sim.js`; tests: `sim.test.js`.

## Scene

Two lanes, one link each, the same three hosts (one NIC each, so one MAC each in both lanes). Top lane IPv4 (book
ch08 Primjer 5), bottom lane IPv6 with link-local addresses (interface ID by modified EUI-64 from the MAC, as in
`ipv6-slaac`).

| Host | MAC | IPv4 | IPv6 link-local | Solicited-node group | Its multicast MAC |
|---|---|---|---|---|---|
| A (asks) | `00:00:5e:00:53:0a` | 192.168.1.10 | `fe80::200:5eff:fe00:530a` | `ff02::1:ff00:530a` | `33:33:ff:00:53:0a` |
| B | `00:04:61:9d:f1:56` | 192.168.1.20 | `fe80::204:61ff:fe9d:f156` (book ch10 Primjer 1) | `ff02::1:ff9d:f156` | `33:33:ff:9d:f1:56` |
| C | `00:00:5e:00:53:0c` | 192.168.1.30 | `fe80::200:5eff:fe00:530c` | `ff02::1:ff00:530c` | `33:33:ff:00:53:0c` |
| C, `collide` on | `10:34:56:9d:f1:56` | 192.168.1.30 | `fe80::1234:56ff:fe9d:f156` (task) | `ff02::1:ff9d:f156` (B's) | `33:33:ff:9d:f1:56` |

- B's MAC is its link-local's interface ID read back: `0204:61ff:fe9d:f156` → drop `ff:fe`, flip the U/L bit
  (`02` → `00`). C's collide MAC the same way (`12` → `10`). A's and C's MACs are from the documentation block
  (RFC 7042 §2.1.1), as in `ipv6-slaac`.
- Every host is in the all-nodes group `ff02::1` (MAC `33:33:00:00:00:01`) too.
- **NIC filter** (which destination MACs a NIC passes up to the CPU): IPv4 lane: its own MAC and
  `ff:ff:ff:ff:ff:ff`; IPv6 lane: its own MAC and the multicast MAC of every group it joined.
- Absent target: 192.168.1.99 and `fe80::99` (group `ff02::1:ff00:99`, MAC `33:33:ff:00:00:99`): nobody has them.
- `forged` adds a router R (MAC `00:00:5e:00:53:01`) at the end of the IPv6 link and, behind it, an off-link sender
  X (`2001:db8:ff::66`); C, which plays no part, is not drawn. A has a global address too, `2001:db8:1:0:200:5eff:fe00:530a` (same interface ID, so the
  same solicited-node group).

Numbers checked with Python's `ipaddress` before coding (scratch script in the session): every link-local, group and
multicast MAC above, and the MACs read back from B's and C's interface IDs.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **ARP request is a broadcast** to `ff:ff:ff:ff:ff:ff`; every host on the segment but the sender accepts it and its CPU looks at it; only the owner of the target IP replies, unicast to the asker. The target adds the asker (new entry); a host that already has the asker refreshes it; others add nothing. The asker adds the target from the reply. | URM ch08 "ARP: od IP adrese do MAC adrese", Primjer 5; RFC 826 |
| 2 | **Solicited-node group:** each IPv6 address a host has makes it join `ff02::1:ff` + the low 24 bits of the address. | RFC 4291 §2.7.1; RFC 4861 §7.2.1 |
| 3 | **Multicast MAC:** an IPv6 multicast packet goes to `33:33` + the low 32 bits of the destination address. A NIC passes up only multicast MACs of groups it joined; others are dropped in hardware, and the CPU never sees them. | RFC 2464 §7 |
| 4 | **Neighbour solicitation** (ICMPv6 type 135): from the asker's link-local to the target's solicited-node address, hop limit 255, target address, source link-layer address option (the asker's MAC). The asker's entry is created **INCOMPLETE** and the RetransTimer (1 s) starts. | RFC 4861 §4.3, §7.2.2, §7.3.2, §10 |
| 5 | **Only the owner answers:** a host that accepted the NS answers only if the target is its own address; any other silently discards it. The owner also creates an entry for the asker from the source link-layer option, state **STALE**. **Tie-break:** with `collide`, B and C share the low 24 bits, so both NICs accept the NS and both CPUs look; only the target answers. | RFC 4861 §7.2.3 |
| 6 | **Neighbour advertisement** (type 136): unicast to the asker's address and MAC, hop limit 255, S = 1 (solicited), O = 1 (override), R = 0 (a host), target link-layer address option. The asker's entry becomes **REACHABLE** with that MAC; the RetransTimer stops. | RFC 4861 §4.4, §7.2.4, §7.2.5 |
| 7 | **Hop limit 255:** a receiver drops any NDP message whose hop limit is not 255, whatever its other fields say (one of the validity checks of §7.1). A router decrements the hop limit, so a message that crossed one arrives with at most 254: an off-link sender cannot get one accepted. | RFC 4861 §7.1.1, §7.1.2; RFC 8200 §3 (hop limit) |
| 8 | **No answer:** the NS is sent again every RetransTimer (1 000 ms), MAX_MULTICAST_SOLICIT = 3 in all; 1 s after the third with no NA the entry is deleted and the queued packet gets ICMPv6 Destination Unreachable, code 3, address unreachable. | RFC 4861 §7.2.2, §10 |
| 9 | **NDP replaces three IPv4 protocols:** ARP, ICMP router discovery and ICMP redirect. Only address resolution is stepped here. | URM ch10 Šire o temi (RFC 4861 §1 quote) |

**ARP with no answer** (the IPv4 lane of `target: absent`): ARP itself has no retry rule. RFC 1122 §2.3.2.1 says
a host must limit ARP requests for one address, at most one per second recommended. This model does the same as
NDP, three requests 1 s apart and then gives up, so the lanes line up. *Model choice, marked in NOTES.md.*

## Steps

One event per step. With `lanes: both`, IPv4 and IPv6 events alternate (IPv4 first), so the two lookups line up;
both lanes have the same number of events in every run. Time `t` counts from the first request.

| Event | IPv4 lane | IPv6 lane | t |
|---|---|---|---|
| `miss` | A looks for the target in its ARP table: missing | in its neighbour cache: missing | 0 |
| `req` k | ARP request k, broadcast | NS k to the solicited-node group; k = 1 adds the INCOMPLETE entry; RetransTimer starts | k − 1 s |
| `filter` k | every NIC but A's accepts; CPUs looking: B, C | only NICs whose filter has the multicast MAC accept | k − 1 s |
| `check` | the owner: mine, adds A; others: not mine | the owner: mine, adds A STALE; others in the group: not mine | 0 |
| `reply` | ARP reply, unicast owner → A | NA, unicast owner → A, S = 1, O = 1, R = 0 | 0 |
| `cache` | A adds the target's MAC | A's NIC takes it (own MAC), hop limit 255 OK; entry REACHABLE | 0 |
| `giveup` | no reply after 3 requests: A gives up | entry deleted; address unreachable | 3 s |

- A found target: `miss`, `req`, `filter`, `check`, `reply`, `cache` (6 per lane).
- An absent target: `miss`, then `req` k and `filter` k for k = 1, 2, 3, then `giveup` (8 per lane). There is no
  `check` step when nobody owns the target: in IPv4 the CPUs of B and C find "not mine" in the `filter` step; in
  IPv6 no NIC accepts at all.
- `forged` (IPv6 lane only; A's cache starts with B REACHABLE from an earlier lookup): `forge` (X sends an NA:
  target B's address, target link-layer address `00:00:5e:00:53:66`, O = 1, S = 0, to A's global address, hop
  limit 255), `forward` (R puts it on the link to A's MAC, hop limit 254), `accept` (A's NIC takes it: its own MAC),
  `drop` (hop limit 254 ≠ 255: dropped; B's entry unchanged).

The counter of a lane is the number of times a host's CPU had to look at a request (an ARP request or an NS; in
`forged`, the forged NA), summed over the run.

## Params

| Param | Values | Default |
|---|---|---|
| `target` | `B`, `C`, `absent` | `B` |
| `collide` | toggle: C gets `fe80::1234:56ff:fe9d:f156` (B's low 24 bits) | off |
| `lanes` | `both`, `v6` | `both` |
| `forged` | toggle: the forged-NA run (IPv6 lane only; `target`, `collide` and `lanes` do not apply) | off |

## Presets and expected results

| Preset | Params | Steps | Result |
|---|---|---|---|
| 1 `side-by-side` | defaults | 12 | ARP broadcast, CPUs looking: B and C (2); reply from B; A: 192.168.1.20 → `00:04:61:9d:f1:56`. NS to `ff02::1:ff9d:f156`, MAC `33:33:ff:9d:f1:56`, CPUs looking: B (1), C's NIC drops it; NA from B; A's cache `fe80::204:61ff:fe9d:f156 → 00:04:61:9d:f1:56 REACHABLE`; B's cache A STALE |
| 2 `same-group` | `collide`, `lanes: v6` | 6 | B and C both accept the NS (2); C: not mine, silent; B answers |
| 3 `absent` | `target: absent`, `lanes: v6` | 8 | 3 NS at 0, 1, 2 s to `ff02::1:ff00:99` (`33:33:ff:00:00:99`), no NIC accepts any (0); at 3 s the entry is deleted, address unreachable |
| 4 `forged` | `forged` | 4 | the NA arrives with hop limit 254 and is dropped; A's entry for B stays `00:04:61:9d:f1:56` REACHABLE |

Other combinations: `target: C` (IPv6: only C accepts; B's NIC drops it), `target: C` with `collide` (B and C
accept, B silent), `target: absent` with both lanes (16 steps; IPv4 counter 6, three requests looked at by B and C; IPv6 counter 0).

## Messages

| Message | Ethernet dst | IP src → dst | Fields shown |
|---|---|---|---|
| ARP request | `ff:ff:ff:ff:ff:ff` | (ARP) sender A's IP and MAC | target IP |
| ARP reply | A's MAC | (ARP) sender owner's IP and MAC | target A |
| NS | `33:33:ff:xx:xx:xx` | A's link-local → solicited-node group | hop limit 255, type 135, target, source link-layer address |
| NA | A's MAC | owner's link-local → A's link-local | hop limit 255, type 136, S, O, R, target, target link-layer address |
| forged NA | A's MAC (R's MAC as source) | X → A's global | hop limit 255 at X, 254 on the link, S = 0, O = 1, target B's link-local, target link-layer `00:00:5e:00:53:66` |

## Out of scope

DAD (`ipv6-slaac`), router solicitation and advertisement, redirect, NUD after REACHABLE (STALE, DELAY, PROBE
named only), MLD reports on the wire, SEND, random delays.
