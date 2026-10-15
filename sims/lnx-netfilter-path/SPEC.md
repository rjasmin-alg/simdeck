<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-netfilter-path: specification

One concept: **prerouting, input, forward, output, postrouting; where NAT and filter happen.** A packet walks the
hook diagram of a Linux router one box per step. At each hook, every base chain attached to it runs in priority
order; at the routing decision the output interface is chosen. The student sends an inbound, a forwarded and a
locally generated packet, and watches where the address is rewritten and which filter sees which address.

Task: `docs/tasks/w2/lnx-netfilter-path.md`. Catalogue: `lnx-netfilter-path` (`docs/catalogue.md` §4.4). Class:
stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[nft8]** nft(8), nftables v1.0.9, read on this machine (`man nft`):
  "IPV4/IPV6/INET ADDRESS FAMILIES", Table 1 (the five hooks: prerouting "invoked before the routing process",
  input "delivered to the local system", forward "forwarded to a different host", output "sent by local processes",
  postrouting "all packets leaving the system");
  "CHAINS", Table 5 (`nat` type: "Only the first packet of a connection actually traverses this chain"; `route` type:
  "a new route lookup is performed if relevant parts of the IP header have changed", i.e. the route of a local packet
  is looked up before `output`), Table 6 (standard priorities: raw −300, mangle −150, dstnat −100, filter 0,
  security 50, srcnat 100; "lower priority values have precedence"), base chain policy ("accept (which is the
  default) or drop");
  "VERDICT STATEMENT" (`accept`: "The packet can still be dropped later by another hook, for instance accept in the
  forward hook still allows one to drop the packet later in the postrouting hook, or another forward base chain that
  has a higher priority number"; `drop`: "no further chains or hooks are evaluated");
  "NAT STATEMENTS" (`snat` "only valid in the postrouting and input chains", `masquerade` "only in postrouting",
  `dnat` "only valid in the prerouting and output chains"; "All future packets in this connection will also be
  mangled, and rules should cease being examined"; masquerade "uses the outgoing interface's IP address").
- **[wiki]** nftables wiki, "Netfilter hooks" (the hook diagram), "Configuring chains", "Performing Network Address
  Translation (NAT)". *(check: not reachable offline; the man page above covers every rule that cites them)*
- **[sysctl]** Linux kernel documentation, "IP Sysctl", `ip_forward` ("Forward Packets between interfaces"); with it
  off, the input route lookup of a non-local destination fails before the `forward` hook (`ip_route_input_slow`,
  `IN_DEV_FORWARD`). *(check: from memory of the kernel source, not re-read)*
- **[rfc5737]** documentation addresses: `198.51.100.0/24` (TEST-NET-2) and `203.0.113.0/24` (TEST-NET-3).
- **[ct]** conntrack's NAT on later packets: the translation stored with the first packet is applied at the
  destination-NAT points (prerouting, output) and the source-NAT points (postrouting, input), in both directions;
  a reply is translated back. A connection whose first packet is dropped is never recorded (an unconfirmed entry is
  destroyed). *(check: from memory of `nf_nat_core.c`/`nf_conntrack_core.c`, not re-read; consistent with [nft8]
  "All future packets in this connection will also be mangled")*
- No course text: NLA T08 has no chapter yet; every preset is derived.

## Scene

- **The hook diagram** (catalogue §7.2 "decision path"), the router's inside:
  `in` (wire, the input interface) → `prerouting` → `route` → `input` → `local` (the local process) and
  `route` → `forward` → `postrouting` → `out` (wire, the output interface); `local` → `route-out` (the local routing
  decision) → `output` → `postrouting`. A `dropped` bin.
- **Hook boxes** list their base chains in priority order (name, type, priority) and, once visited, each chain's
  verdict: ✓ accept, ✕ drop, ↷ NAT rewrite, – skipped. Lit = visited by this packet, dark = not on its path.
- **The packet card**: src, sport, dst, dport, proto, iif, oif; a rewritten field shows the new value and the
  original struck; the field rewritten in this step is highlighted. Its conntrack state (new / established).
- **The conntrack table**: original tuple, reply tuple, NAT kind, status.
- **The chains of this hook** (kit view K4, first match per chain, the policy as the implicit row), or the route
  table at a routing decision, or the whole trace at the end.
- **Network**: router `rtr` with `eth0` (WAN `198.51.100.10`) and `eth1` (LAN `10.0.0.1/24`); inside server
  `10.0.0.5`; outside client `203.0.113.7`.

## Ruleset (one `ip` table)

| Chain | Hook | Type | Priority | Policy | Rules |
|---|---|---|---|---|---|
| `nat_pre` | prerouting | nat | −100 (dstnat) | accept | 1 `iif eth0 tcp dport 8080 dnat to 10.0.0.5:80` |
| `filter_in` | input | filter | 0 (filter) | param `inputPolicy` (drop) | 1 `ct state established,related accept`; 2 `tcp dport 22 accept` |
| `extra` | input | filter | param `extra`: 10 or 0; absent by default | drop | 1 `ip saddr 10.0.0.0/24 accept` |
| `filter_fwd` | forward | filter | 0 | drop | 1 `ct state established,related accept`; 2 `iif eth1 oif eth0 accept`; 3 `tcp dport 80` / `8080 accept` (param `fwdRule`; none = no row 3) |
| `nat_post` | postrouting | nat | 100 (srcnat) | accept | 1 `ip saddr 10.0.0.0/24 oif eth0 masquerade` |

`output` has no base chain (the packet passes it unchanged). Local addresses: `198.51.100.10`, `10.0.0.1`. Routes:
`10.0.0.0/24 → eth1`, `default → eth0`.

## Packets (param `packet`)

| Id | Sent by | Packet | Arrives on |
|---|---|---|---|
| `ssh-in` | client | `203.0.113.7:51000 → 198.51.100.10:22` tcp | eth0 |
| `port-fwd` | client | `203.0.113.7:51000 → 198.51.100.10:8080` tcp | eth0 |
| `lan-out` | server | `10.0.0.5:50000 → 203.0.113.7:443` tcp | eth1 |
| `local-out` | rtr's own process | `198.51.100.10:40000 → 203.0.113.7:443` tcp | (local) |

With `reply` on, when the packet reaches `local` or `out`, its reply (addresses and ports swapped, as the other
end sends it) walks the diagram next.

## State

```
{ packetId, dir: 'orig' | 'reply', packet: { src, sport, dst, dport, proto, iif, oif }, orig: (the packet as sent),
  at: 'in' | 'prerouting' | 'route' | 'input' | 'local' | 'route-out' | 'output' | 'forward' | 'postrouting' | 'out'
      | 'dropped', dropAt (box name or null), visited: [box names], next: box name | null,
  ct: { idx, state: 'new' | 'established', dir } | null, conntrack: [{ orig, reply, nat: ['dnat' | 'snat'], status }],
  chains: [the ruleset], ipForward, trace: [{ hook, chain, rule, verdict }] (this packet), event, changed: [marks] }
```

`event` is the caption's code; `changed` lists the marks for this step (`pkt:<field>`, `ct:<i>`, `rule:<chain>:<i>`).

## Steps

Step 0: the packet at its sender (`in` for client/server, `local` for `local-out`). Each next step moves it by one
box and does that box's work:

- **hook**: (a) at the first hook (`prerouting`, `output`) conntrack looks the packet up: a match of a recorded
  tuple → established (rule 7), else a new entry; (b) the base chains run in ascending priority (rule 4); in each,
  rules top-down, first `accept`/`drop`/NAT ends the chain, no match → policy (rule 5); `accept` lets the packet go on
  to the next chain (rule 6); `drop` ends everything (rule 6); a nat chain is skipped for an established packet,
  and conntrack applies the recorded translation in its place (rule 7); (c) NAT is applied to the card (rule 3);
  (d) move.
- **route**: local destination → `input`; else `ip_forward` off → drop (rule 8); else the route's interface →
  `forward`. **route-out**: the route's interface → `output` (no `ip_forward` check: it applies to forwarding).
- **local**, **out**: the packet is delivered / leaves; a new conntrack entry stays (`new`). Hosts are named by side
  (outside / inside host), not by role: in `lan-out` the inside host is the client. With `reply` on, the
  reply starts at its first hook in the next step and its conntrack entry becomes `established`.
- **dropped**: the packet is gone; a conntrack entry created for it is removed (never recorded, [ct]). A dropped
  reply (e.g. `local-out` + reply + extra) leaves its established entry in place: only that packet is lost.

## Rules

| # | Rule | Source | Test |
|---|---|---|---|
| 1 | Paths: to a local address `prerouting → route → input`; through `prerouting → route → forward → postrouting`; local `route-out → output → postrouting`. | nft8 Table 1 | `rule 1` ×3 |
| 2 | The routing decision uses the destination **after** prerouting's DNAT: `198.51.100.10:8080` DNATed to `10.0.0.5:80` goes through `forward`, not `input`. | nft8 Table 1, NAT STATEMENTS | `rule 2` |
| 3 | DNAT in prerouting (and output); SNAT/masquerade in postrouting. So the `forward` filter sees the new destination and the old source. | nft8 NAT STATEMENTS | `rule 3` ×2 |
| 4 | Within a hook, base chains run in ascending priority. **Tie-break:** equal priority → nft(8) does not fix the order (the kernel keeps registration order, from memory of `nf_hook_entries_grow`, *(check)*); the model runs them by chain name and the page warns. | nft8 Table 6; tie: *(check)* | tie-break `rule 4` ×2 |
| 5 | Within a chain, first match top-down; no match → the chain's policy (default accept). First match per chain, not for the whole path. | nft8 CHAINS | `rule 5` ×2 |
| 6 | `accept` ends only the current base chain (later chains at the same hook and later hooks still run); `drop` is final. | nft8 VERDICT STATEMENT | tie-break `rule 6` ×2 |
| 7 | NAT chains see only the first packet of a connection; conntrack applies the same translation to later packets and reverses it for replies. No preset sends a second packet in the original direction, so on the page rule 7 shows on replies (the tests also call `ctTranslate` for one). | nft8 Table 5, NAT STATEMENTS; ct | `rule 7` ×2 |
| 8 | `ip_forward` = 0: a packet whose route is not local is dropped at the routing decision and never reaches `forward`; local delivery and locally generated packets are not affected. | sysctl *(check)* | tie-break `rule 8` ×2 |

Tie-breaks first in the tests: rule 4 (equal priority), rule 6 (accept not final), rule 8 (local traffic with
forwarding off).

## Params

| Key | Values | Default | Note |
|---|---|---|---|
| `packet` | `ssh-in`, `port-fwd`, `lan-out`, `local-out` | `ssh-in` | resets |
| `reply` | toggle | off | the reply follows |
| `ipForward` | toggle | on | `net.ipv4.ip_forward` |
| `inputPolicy` | `accept`, `drop` | `drop` | `filter_in`'s policy |
| `fwdRule` | `80`, `8080`, `none` | `80` | `filter_fwd` row 3 |
| `extra` | `none`, `10`, `0` | `none` | a second input chain and its priority |

## Presets and expected numbers

| Preset | Params | Steps | Path | End | Source |
|---|---|---|---|---|---|
| `inbound-ssh` | `ssh-in` | 4 | prerouting, route, input, local | delivered; `nat_pre` no match, `filter_in` rule 2 accept | derived |
| `port-forward` | `port-fwd` | 5 | prerouting, route, forward, postrouting, out | dst `10.0.0.5:80`, out `eth1`; `nat_pre` rule 1 dnat, `filter_fwd` rule 3 accept | derived |
| `masquerade` | `lan-out`, reply on | 10 | 5 + reply: prerouting, route, forward, postrouting, out | out `eth0` src `198.51.100.10:50000`; reply: `nat_pre` skipped, dst back to `10.0.0.5:50000`, `filter_fwd` rule 1 | derived |
| `local-out` | `local-out` | 4 | route-out, output, postrouting, out | input and forward dark; `nat_post` no match | derived |
| `accept-not-final` | `ssh-in`, extra 10 | 4 | prerouting, route, input, dropped | `filter_in` rule 2 accept, `extra` policy drop | derived |
| `no-forwarding` | `lan-out`, ipForward off | 3 | prerouting, route, dropped | dropped at route; no conntrack entry left | derived |

Defaults: `ssh-in`, 4 steps (`sim.json` `steps`). Other numbers: `port-fwd` with `fwdRule` 8080 or none: 4 steps,
dropped in forward (policy); with `inputPolicy` accept it is still dropped (input never sees it). `port-fwd` with
reply: 10 steps, the reply's source rewritten back to `198.51.100.10:8080` in postrouting. `ssh-in` + extra 0: tie,
`extra` first by name, 4 steps, dropped. `ssh-in` with ipForward off: 4 steps, delivered. `local-out` with reply:
8 steps, the reply accepted by `filter_in` rule 1. Maximum: 10 steps.

The numbers were printed by a script from the model before the page was written, and are asserted in `sim.test.js`.

## Simplifications

- One packet per direction; no TCP handshake. The reply is the first packet back, which conntrack already counts as
  established.
- The conntrack status shows `new` until a reply passes, then `established`; the kernel's "confirmed" step (when the
  first packet leaves) is folded into "kept when the packet leaves, removed when it is dropped".
- The route table has two routes; no policy routing, no reverse-path filter, no second route lookup after an
  `output` DNAT (no preset does one).
- The `raw`, `mangle`, `security` and `route` chain types, `ingress`/`egress`, the bridge and netdev families,
  conntrack helpers, sets and maps are out of scope (task). The explanation lists the standard priorities only.
