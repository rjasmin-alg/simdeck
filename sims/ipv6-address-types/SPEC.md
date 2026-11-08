<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-address-types: spec

Explorer (task `docs/tasks/w3/ipv6-address-types.md`, catalogue `net-ipv6-address-types`, §4.1). One concept:
**link-local, GUA, ULA, multicast and their reach**. The student classifies an address by its prefix and sees how
far a packet to it travels. No steps: the typed address, the example's address list and one toggle drive it live.

## Scene

- **Address box** (top left): a text field (the page's own: the kit has no text param), the RFC 5952 form, and the
  example's address list as buttons (the address shown is pressed, ▶).
- **Type card** (top right): the type, the matched prefix, the reach; for multicast the scope nibble with its name
  and the well-known group; one note sentence (L bit, documentation, bits 001, nearest prefix, …).
- **Prefix table** (left): type, prefix, reach, one row per prefix in the order of rule 1 plus "everything else".
  The winning row is lit (◀ longest); a row that also matches is dashed (✓ shorter); for an unassigned address the
  nearest row is dotted (≈ nearest).
- **Bit strip** (right, toggle `showBits`): the full 32-digit form with the compared digits marked; under it rows of
  16 bits, a hex digit over each nibble, the address's bits over the prefix's bits. Bits inside the prefix that agree
  are lit; the first differing bit (unassigned address against its nearest row) is dashed with ✕; bits outside the
  prefix are dotted. Multicast: the flags and scope nibbles are tagged; ULA: bit 7, L, is tagged. Rows drawn: the
  16-bit groups that hold the prefix (one for /3, /7, /8, /10; two for /20, /32); for /128 the first and the last group,
  with the bits between summarised ("all zero" when they are), and when the first differing bit lies between
  them, its group replaces the first one (`::1:0` against `::/128`: bits 96–111, ✕ at 111; "bits 0–95: all zero").
- **Topology** (bottom): host H (source) and neighbour N on link L1; router R1; host H2 on link L2; router R2 at the
  site border; server S on the internet. The site is a dashed box around L1, R1, L2 and R2. The reach is shaded in the
  type's colour and stripe pattern; every node says ✓ gets it or – does not; the node where the packet stops carries
  ⛔ and why.

## Params

| key | control | values | default | notes |
|---|---|---|---|---|
| `addr` | page text field | any text; only text that parses is stored | `2001:db8:85a3::8a2e:370:7334` | in the URL when it differs from the preset (as `lnx-regex-match`) |
| `set` | (presets) | `four`, `two-on-one`, `bits-not-digits`, `multicast-scopes`, `special` | `four` | the address list shown; in the URL like `addr` |
| `showBits` | toggle | on / off | on | the bit strip |

## Rules

1. **Classify by the longest matching prefix.** The table, in display order:

   | type | prefix | reach | source |
   |---|---|---|---|
   | unspecified | `::/128` | none | RFC 4291 §2.5.2 |
   | loopback | `::1/128` | host | RFC 4291 §2.5.3 |
   | link-local | `fe80::/10` | link | RFC 4291 §2.5.6; URM ch10 |
   | unique local (ULA) | `fc00::/7` | site | RFC 4193 §3; URM ch10 |
   | multicast | `ff00::/8` | by scope (rule 4) | RFC 4291 §2.7; URM ch10 |
   | documentation | `2001:db8::/32` | none | RFC 3849 |
   | documentation | `3fff::/20` | none | RFC 9637 *(check; added, see NOTES)* |
   | global unicast (GUA) | `2000::/3` | global | IANA IPv6 Address Space; URM ch10 |
   | everything else: not assigned for unicast | — | none | IANA IPv6 Address Space |

   **Tie-break:** the longest prefix wins, so `2001:db8::/32` and `3fff::/20` beat `2000::/3`. Equal lengths never
   compete (the only equal pair, the two /128 rows, are disjoint). `matches` lists every row that contains the
   address, longest first.
   An address no row matches gets a **nearest row**: the row whose prefix it matches for the largest share of the
   prefix's bits before the first difference (`same / len`); ties go to the earlier row. Checked numbers: `4000::1`
   → `2000::/3` (1 of 3 bits, bit 1 differs; ::/128 is 1 of 128); `fec0::1` → `fe80::/10` (9 of 10, bit 9);
   `::2` → `::/128` (126 of 128, tied with `::1/128`, table order); `e000::` → `fc00::/7` (3 of 7 beats ff00::/8's
   3 of 8). `fec0::/10` gets the note "the old site-local range, deprecated in 2004" (RFC 3879).
2. **Prefix length counts bits.** `/3` is the first three bits, `001`: hex `2` = `0010` and `3` = `0011` are inside,
   `4000::1` (`0100`) and `1fff::1` (`0001`) are not (URM ch10 "Vrste IPv6 adresa", Primjer 2 closing note, Pitanja
   10). `fe80::/10` covers `fe80` to `febf`; `fec0` differs in bit 9. The strip shows the compared bits.
3. **Reach of unicast** (where a packet *to* the address can travel from H):

   | reach | nodes that get it | stops at | source |
   |---|---|---|---|
   | host | H | H (never leaves it) | RFC 4291 §2.5.3 |
   | link | H, N, R1 | R1 (does not forward) | RFC 4291 §2.5.6: "Routers must not forward any packets with Link-Local source or destination addresses to other links." |
   | site | H, N, R1, H2, R2 | R2 (filters at the border) | RFC 4193 §4.1 (routed inside the site), §4.3 (site border routers and firewalls should not forward ULA outside the site) |
   | global | all six | — | URM ch10 |
   | none | — (no node is its destination) | `::` and multicast scope 0: H, not sent (rule 5, RFC 4291 §2.7); documentation and not assigned: R1, which drops it (H sends it to its router; RFC 3849 asks operators to filter the documentation prefix, and nobody routes unassigned space) | RFC 3849, RFC 4291 §2.5.2, IANA |
   | admin | — (a dashed "?" over the site: the border is set by the administrator) | — | RFC 4291 §2.7 (multicast only) |

   Reach lists are prefixes of the node order H, N, R1, H2, R2, S (tested). `stopWhy` names the reason shown at the
   stop: `host`, `link`, `site`, `none` (not sent) or `unrouted` (R1 drops it).
4. **Multicast reach follows the scope nibble** (the 4th hex digit, bits 12–15; the 3rd digit holds the flags, which
   do not change the scope), RFC 4291 §2.7, RFC 7346 for 3:

   | nibble | scope | reach |
   |---|---|---|
   | 0 | reserved | none (a packet to it must not be sent, and is dropped) |
   | 1 | interface-local | host |
   | 2 | link-local | link |
   | 3 | realm-local | admin |
   | 4 | admin-local | admin |
   | 5 | site-local | site |
   | 8 | organization-local | site (an organisation may span several sites; the picture has one: note) |
   | e | global | global |
   | f | reserved | global (RFC 4291: treated as global) |
   | 6, 7, 9–d | unassigned | admin |

   Well-known groups named on the card (IANA IPv6 Multicast Address Space *(check: from memory, no network)*):
   `ff02::1` all nodes, `ff02::2` all routers, `ff05::1:3` all DHCP servers, `ff0e::101` NTP (ff0X::101), and any
   `ff02::1:ffXX:XXXX` solicited node (RFC 4291 §2.7.1).
5. **`::` is never a destination**; a host puts it as the source only before it has an address (RFC 4291 §2.5.2).
   Reach none, stops at H, note `never-destination`.
6. **ULA's L bit** is bit 7, right after the /7: `fd00::/8` has L = 1 (locally assigned, the half in use), `fc00::/8`
   has L = 0 (inside `fc00::/7`, assignment not defined) (RFC 4193 §3.1). Both are ULA; the note says which.
7. **Input and form.** Accepted: one to eight groups of 1–4 hex digits, any case, with at most one `::` standing for
   one or more zero groups (RFC 4291 §2.2). Refused with a reason: empty, a `/length`, a `%zone`, a dotted IPv4 part
   (out of scope), other characters, two `::`, an empty group, a group over 4 digits, the wrong number of groups.
   Display is RFC 5952 §4: lower case, no leading zeros, the longest run of two or more zero groups as `::`, the
   first run on a tie, never a single group. **Invalid text keeps the previous address** (`typed(current, text)`
   returns the current address and the error); the field is marked, the RFC 5952 line gives way to the reason, and
   the caption names the address kept. An invalid `addr` in a hand-made URL shows the default address with the error.

## Presets

| id | addresses (the first loads) | expected | source |
|---|---|---|---|
| `four` | `2001:db8:85a3::8a2e:370:7334`, `fe80::1`, `fc00::1`, `ff02::1` | documentation (none; GUA format, tie-break), link-local (link), ULA L = 0 (site), multicast scope 2 (link) | URM ch10 Primjer 2; documentation from RFC 3849 |
| `two-on-one` | `fe80::204:61ff:fe9d:f156`, `2a02:c7f:5a3e:1:204:61ff:fe9d:f156` | link-local (N yes, S no), GUA (S yes); the same interface ID | URM ch10 Primjer 1 and "Koju će od tih adresa…"; the GUA prefix is chosen (NOTES) |
| `bits-not-digits` | `3ffe::1`, `4000::1` | GUA (global); not assigned (none, nearest 2000::/3, bit 1) | URM ch10 Pitanja 10 |
| `multicast-scopes` | `ff02::1`, `ff02::2`, `ff05::1:3`, `ff0e::101` | link, link, site, global | RFC 4291 §2.7; IANA multicast registry *(check)* |
| `special` | `::1`, `::` | host; none (never a destination) | URM ch10; RFC 4291 §2.5.2, §2.5.3 |

All the preset addresses are already in RFC 5952 form (tested). Default = `four`'s first address.

## Numbers checked

With Python's `ipaddress` before coding: the type of every preset address by membership in each prefix, the longest
match, the RFC 5952 form and the exploded form; `fd00` bit 7 = 1, `fc00` bit 7 = 0; `3ffe` = `0011…`, `4000` =
`0100…`, `fe80` = `1111111010…`, `fec0` = `1111111011…`. Fourteen random addresses' short forms from `ipaddress`
are a test.
