<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-slaac: specification

One concept: **RS/RA, prefix + interface ID, DAD**. The student steps a host H joining an IPv6 link. Task:
`docs/tasks/w2/ipv6-slaac.md`; catalogue `net-ipv6-slaac` (§4.1). Model: `sim.js`; tests: `sim.test.js`.

## Scene

One link with three nodes:

| Node | Addresses | Groups (multicast) |
|---|---|---|
| H, the joining host | none at step 0; MAC from the `mac` param (default `00:1a:2b:3c:4d:5e`) | joins `ff02::1` and the solicited-node group of each address it forms |
| R, the router | `fe80::1`, `2001:db8:1::1`; advertises `2001:db8:1::/64` (or `/56`) | `ff02::1`, `ff02::2`, `ff02::1:ff00:1` |
| N, a neighbour | `fe80::2`; with `duplicate`: H's link-local instead (a cloned interface), or `fe80::2` plus H's global (set by hand) | `ff02::1` and the solicited-node group of each of its addresses |

Every node sees every frame on the link; only the members of the destination group take a multicast packet.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Interface ID, modified EUI-64:** split the 48-bit MAC into two halves of 3 octets, insert `ff:fe` between them, invert the U/L bit (`0x02` of the first octet). `00:1a:2b:3c:4d:5e` → `021a:2bff:fe3c:4d5e`. The inversion goes both ways: `02:…` (locally administered) becomes `00…`. | RFC 4291 §2.5.1 and Appendix A; RFC 2464 §4; URM `10-ipv6.md` "Vrste IPv6 adresa i podmreža veličine /64" |
| 2 | **Link-local first**, without any router: `fe80::/64` + the interface ID. | RFC 4862 §5.3; URM ch10 (`fe80::/10`) |
| 3 | **Tentative until DAD finishes.** A tentative address is never a source: the DAD NS goes out from `::`, and the RS waits until the link-local is preferred (a host could also send its RS from `::`, RFC 4861 §6.3.7; this one waits, the usual order). | RFC 4862 §5.4 |
| 4 | **DAD:** before the NS the interface joins `ff02::1` and the solicited-node group of the tentative address; NS from `::` to `ff02::1:ff` + the low 24 bits of the address, target = the tentative address. Wait RetransTimer (1 s, DupAddrDetectTransmits = 1). No answer → **preferred**. | RFC 4862 §5.4.2; RFC 4861 §10; RFC 4291 §2.7.1 |
| 5 | **Duplicate:** an NA for the target, or a DAD probe (NS from `::`) for the same target from another node, makes the address **duplicate**; it is not assigned. **Tie-break:** two nodes probing the same address at once each hear the other's probe, so **both** lose. An NS for the target from a real source address is address resolution and is ignored. A duplicate hardware-derived link-local stops IPv6 on the interface (SHOULD). | RFC 4862 §5.4.3–5.4.5 |
| 6 | **The owner answers to all-nodes:** the probe came from `::`, so the NA goes to `ff02::1` with S = 0 (O = 1). Its source here is the address it defends (the RFC asks only for an address of the interface, §4.4). | RFC 4861 §7.2.4 |
| 7 | **RS/RA:** RS from the (preferred) link-local to `ff02::2`; R answers with an RA from `fe80::1` to `ff02::1` (multicast, the usual answer). A non-zero router lifetime makes `fe80::1` H's **default router**. | RFC 4861 §6.3.7, §6.2.6, §6.3.4 |
| 8 | **Prefix option, checked in this order** (the first that fails is the reason): (a) A = 0 → no address (DHCPv6 territory; M = 1 in the `a-off` RA); (b) a link-local prefix → ignored; (c) preferred > valid lifetime → ignored; (d) prefix length + 64 ≠ 128 → ignored. Otherwise address = the prefix's first 64 bits + the interface ID, tentative, then DAD as in rules 4–5. | RFC 4862 §5.5.3 |
| 9 | **Lifetimes** from the option: valid 2 592 000 s (30 days), preferred 604 800 s (7 days), the router defaults; the RA's router lifetime is 1 800 s. Shown, not run down. A link-local address has infinite lifetimes (∞). | RFC 4861 §6.2.1 (AdvValidLifetime, AdvPreferredLifetime, AdvDefaultLifetime = 3 × MaxRtrAdvInterval 600 s); RFC 4862 §5.3 |
| 10 | **Groups:** the solicited-node group depends only on the low 24 bits, so H's global joins the group its link-local already joined; and a node in the group whose own address differs in the upper bits takes the NS, sees the target is not its own and stays silent. | RFC 4291 §2.7.1 |
| 11 | **Written form:** addresses in the RFC 5952 short form: a single `0` group is not shortened to `::`. | RFC 5952 §4.2.2 |

## Steps

One phase per step. Time `t` counts from H's first NS; random start-up delays are left out (`NOTES.md`).

| Phase | What happens | t |
|---|---|---|
| `iid` | the interface ID from the MAC (rule 1) | 0 s |
| `ll` | link-local formed, tentative; H joins `ff02::1` and its solicited-node group | 0 s |
| `dadNs` | NS from `::` to the solicited-node group; the RetransTimer starts | 0 s |
| `dadOk` | 1 s with no answer: preferred | +1 s |
| `dadNa` | the owner (N) answers with an NA; the address is duplicate; the run ends | same t |
| `rs` | RS from the link-local to `ff02::2` | 1 s |
| `ra` | RA from `fe80::1` to `ff02::1`; default router `fe80::1` | 1 s |
| `gua` | global address formed, tentative (rule 8) | 1 s |
| `noAddr` | the prefix option gives no address (rule 8 a or d); the run ends | 1 s |
| `ready` | H is configured: link-local for the link, global for beyond it via `fe80::1` | 2 s |

## Presets and expected results

MAC `00:1a:2b:3c:4d:5e` unless noted. Checked with Python's `ipaddress` (scratch script in the session) and in
`sim.test.js`.

| Preset | Params | Steps | Result |
|---|---|---|---|
| 1 `join` | defaults | 10 | IID `021a:2bff:fe3c:4d5e`; link-local `fe80::21a:2bff:fe3c:4d5e` (NS to `ff02::1:ff3c:4d5e`, no answer); RS → RA `2001:db8:1::/64` A = 1; global `2001:db8:1:0:21a:2bff:fe3c:4d5e`; default router `fe80::1` |
| 2 `eui64` | `iidOnly: true` | 4 | split, insert `ff:fe`, flip U/L, then all three MACs: `00:1a:2b:3c:4d:5e` → `021a:2bff:fe3c:4d5e`; `02:00:00:00:00:01` → `0000:00ff:fe00:0001` (U/L 1 → 0); `00:00:5e:00:53:01` → `0200:5eff:fe00:5301` |
| 3 `dad-fail` | `duplicate: global` | 9 | N holds the global: the global NS reaches N, N answers with an NA to `ff02::1`; the global is duplicate, H keeps the link-local and the default router |
| 4 `prefix-56` | `prefixLen: 56` | 7 | 56 + 64 = 120 ≠ 128: no global address; link-local only (with a default router) |
| 5 `a-off` | `aFlag: false` | 7 | A = 0, M = 1: no SLAAC address; the caption points to DHCPv6 |

Other combinations: `duplicate: link-local` ends after 4 steps (NA, link-local duplicate, IPv6 off);
`mac: 02:00:00:00:00:01` gives `fe80::ff:fe00:1` and `2001:db8:1::ff:fe00:1`, whose solicited-node group
`ff02::1:ff00:1` is R's too (R takes the NS, the target is not its own, silent: rule 10); `00:00:5e:00:53:01` gives
`fe80::200:5eff:fe00:5301` and `ff02::1:ff00:5301`. With A = 0 and `/56` together the reason is A = 0 (rule 8 order).

## Messages

| Type | From | Source | Destination | Fields shown |
|---|---|---|---|---|
| NS | H | `::` | `ff02::1:ffXX:XXXX` (solicited-node) | target |
| NA | the owner | the defended address | `ff02::1` | target, S = 0, O = 1 |
| RS | H | H's link-local | `ff02::2` | |
| RA | R | `fe80::1` | `ff02::1` | M, O, router lifetime 1 800 s; prefix option: prefix/length, L = 1, A, valid, preferred |

## Out of scope

DHCPv6 and the M/O flags in depth; temporary (RFC 8981) and stable-privacy (RFC 7217) interface IDs, in the
explanation only; NS/NA for address resolution (`net-ipv6-ndp`); MLD reports; random delays, retransmitted RS,
optimistic DAD.
