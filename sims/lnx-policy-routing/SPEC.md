<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-policy-routing: specification

One concept: **`ip rule` picks a table before the route lookup.** Task: `docs/tasks/w3/lnx-policy-routing.md`.
Sources: ip-rule(8) (RPDB, the default rules, selectors, actions, priority), ip-route(8) (`table`, `show table`,
`get`), URM = `~/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (*najdulji podudarajući prefiks*),
UL = `~/projects/uvod-u-linux/book/chapters/14-mreza-na-sustavu.md` (`ip route get`), RFC 5737 (addresses), RFC 2827 /
BCP 38 (source filtering). **Kernel** = checked on Linux 6.8 (iproute2 of Ubuntu 24.04) in an unprivileged network
namespace with three dummy interfaces, the scene's addresses and `ip_forward=1` (`unshare -rn`; the commands and
outputs are in NOTES.md). Unchecked items are marked *(check)*.

## The scene

| | Value | Source |
|---|---|---|
| `rt1` | `eth0` 203.0.113.10/24 (ISP-A, gateway 203.0.113.1), `eth1` 198.51.100.10/24 (ISP-B, gateway 198.51.100.1), `eth2` 192.168.10.1/24 (LAN) | task |
| LAN | `pc20` 192.168.10.20, `pc30` 192.168.10.30 | task |
| internet | a host 192.0.2.80 | task, RFC 5737 |
| `local` | `local 192.168.10.1 dev eth2`, `local 198.51.100.10 dev eth1`, `local 203.0.113.10 dev eth0` (the kernel also lists the broadcast addresses and `127.0.0.0/8`; left out) | kernel |
| `main` | `default via 203.0.113.1 dev eth0`; `192.168.10.0/24 dev eth2`; `198.51.100.0/24 dev eth1`; `203.0.113.0/24 dev eth0` (the last three `proto kernel scope link src …`), in this order | kernel |
| `100` | `default via 198.51.100.1 dev eth1`; with `lanInTable100` also `192.168.10.0/24 dev eth2` (after the default) | task, kernel |
| `200` | does not exist (`ip route show table 200`: `Error: ipv4: FIB table does not exist.`) | kernel |
| `default` | does not exist (empty) | ip-rule(8) |

Table 100 has no name in `rt_tables` in the model, so every output says `100` (the task's commands use `lookup 100`).

## State

`{ rules: [{ id, prio, from, to, iif, action, table }], tables: { local, main, 100, … }, item, ev, cmd, packet: { n,
src, dst, iif, from }, phase, ruleIdx, marks, lookup, chosen: { table, route }, outcome, get, log, event }`.

- `rules` in list order; `from`/`to` are prefixes (`'192.168.10.30/32'`) or `null` for all; `iif` a device or `null`.
- `tables`: name → routes `{ dst, prefix, via, dev, type: 'unicast' | 'local', proto, src }`; a missing name is a table
  that does not exist.
- `item`, `ev`: the script item and the event of its decision trace shown at this step.
- `marks`: per rule, what it did for this packet so far: `pending` (not read yet), `no` (selector fails), `hit` (matches,
  its table is next), `empty` (matched, the table had no route: go on, rule 4), `win` (decided), `skip` (below the
  deciding rule, never read). A new packet starts with every rule `pending`.
- `lookup`: `{ table, exists, matches, winner, order }` in the step that looks into a table.
- `outcome`: `{ kind: 'forward' | 'local' | 'blackhole' | 'unreachable' | 'prohibit' | 'noroute', fate: 'delivered' |
  'filtered' | 'lost' | 'dropped' | 'error', at }` once decided; `get` the `ip route get` line.
- `log`: one line per decided packet (number, source, destination, rule, table, outcome), so two packets can be compared.

## One step

One event of one packet's decision (task "One step"), or one command:

1. **a rule test**: the next rule in list order, its selector against the packet (rule 2). A match with action `lookup`
   leads to 2.; a match with `blackhole`, `unreachable` or `prohibit` ends the decision in this step (rule 5);
2. **the lookup** in the rule's table (rule 3). A route: the decision is made (a `local` route ends it here: the packet
   is for `rt1`); no route, or no such table: the next step is the next rule (rule 4); no rule left: `noroute`;
3. **forward**: the packet moves to the next hop, and what happens after it (rule 7).

A command (`ip route add …`, `ip rule add …`) is one step. Step 0 is the configuration from the toggles, nothing sent.

## Rules

1. **Order.** Rules are evaluated in ascending priority; the default list is `0: from all lookup local`, `32766: from
   all lookup main`, `32767: from all lookup default`. Every packet first matches rule 0; the `local` table has a route
   only for `rt1`'s own addresses, so a packet for anyone else finds none there and goes on (rule 4). (ip-rule(8);
   kernel: `ip rule` prints exactly these three; `ip route get 192.168.10.1 … iif eth2` → `local … table local`.)
2. **Selector.** A rule matches when every selector it has matches: `from` (the source address in the prefix), `to`
   (the destination in the prefix), `iif` (the incoming device; a packet `rt1` sends itself comes from `lo`). `from all`
   / no `to` / no `iif` match anything. (ip-rule(8)) `fwmark` exists and is out of scope.
3. **Lookup.** In the chosen table the longest matching prefix wins; equal prefix, the lower metric; equal metric, the
   first in table order (URM ch11; `lookup` copied from `lnx-routing-decision`). All routes here have metric 0 and
   different prefixes, so only the first rule is ever needed.
4. **A failed lookup goes on.** No route for the destination in the rule's table, or no such table, and evaluation
   continues with the next rule. (ip-rule(8): "the RPDB program continues with the next rule"; kernel: rule 900 →
   table 200 that does not exist → main; rule 1000 → table 100 with only `192.168.10.0/24` → main for 192.0.2.80.)
   When the last rule fails too: `RTNETLINK answers: Network is unreachable`, exit 2 (kernel, by the reviewer: main's
   default removed).
5. **Actions that end it.** `blackhole` drops silently, `unreachable` and `prohibit` drop with an error to the sender;
   no table is read. (ip-rule(8); kernel: `ip route get 192.0.2.80` → `RTNETLINK answers: Invalid argument` for
   blackhole, `Network is unreachable` for unreachable, `Permission denied` for prohibit.)
6. **Tie-breaks.** (a) Rules with the **same priority** are tried in the order they were added (kernel: two rules at
   700, the first added decides). (b) A rule added **without a priority** gets the priority of the second rule in the
   list (the first after rule 0) minus one, if that is not 0 (kernel: with rule 1000 present, `from 198.51.100.10 lookup
   100` gets 999; with only the default rules, 32765; kernel `fib_default_rule_pref`). (c) An identical rule (same
   selector and action) at the **same priority** is refused, `RTNETLINK answers: File exists`, exit 2 (kernel, by the
   reviewer: priority 2000, 1000, 600); without a priority it gets a new one by (b) and is accepted again (kernel: `ip rule
   add` twice, exit 0, 999 and 998 listed). (d) A route that
   exists already is refused: `RTNETLINK answers: File exists`, exit 2 (kernel).
7. **Inside the LAN.** A LAN host sending to another LAN address finds its own link route and sends it straight on the
   LAN: the packet never reaches `rt1`, whose rules do not apply (one step, `direct`). A packet to `rt1`'s own LAN
   address does reach it. (UL ch14: `ip route get` on the link has no `via`; kernel: `rt1` answers such a forward with
   `cache <redirect>`.)
8. **After the router (source filtering).** A packet that leaves through an ISP whose source is the **other** uplink's
   address is dropped by that ISP (BCP 38: an ISP accepts only sources it assigned; RFC 2827). LAN sources pass: `rt1`
   translates them on the way out (NAT, assumed and not drawn, out of scope). A LAN destination sent to an ISP is lost
   there (the ISP does not route a private address back). *(check: the ISPs' filtering is modelled, not observed.)*

The `ip route get` answer (kernel format): `192.0.2.80 from 192.168.10.30 via 198.51.100.1 dev eth1 table 100` for a
forwarded packet (`table main` is not printed), `… uid 0` for one `rt1` sends itself, `local 198.51.100.10 from 192.0.2.80
dev lo table local` for a packet to `rt1`, `192.168.10.20 from 192.168.10.30 dev eth2 table 100` on the link.

## Params

All `resets: true` (task): `script` (the preset's packet list, default `two-sources`; `one` sends one packet from
`source` to `dst`, which are shown only then), `source` `pc20` | `pc30` | `rt1` (198.51.100.10, from `lo`), default
`pc20`; `dst` `192.0.2.80` | `192.168.10.20`, default `192.0.2.80`; `ruleFrom30` (`ip rule add from 192.168.10.30 lookup
100 priority 1000`, on); `lanInTable100` (`ip route add 192.168.10.0/24 dev eth2 table 100`, off); `replyRule` (`ip rule
add from 198.51.100.10 lookup 100`, off). The scenarios `empty-table` and `blackhole` bring their own rule (`ip rule add
from 192.168.10.20 lookup 200 priority 900`; `ip rule add to 192.0.2.0/24 blackhole priority 500`). At step 0 the rules
are added in this order: rule 1000, the scenario's rule, then `replyRule` (rule 6b gives it 999, or 899 with rule 900,
499 with rule 500, 32765 alone).

## Presets and expected numbers

| Preset | Toggles | Script → result | Steps |
|---|---|---|---|
| `two-sources` | defaults | pc20 → 192.0.2.80: r0 ✓, local ✕, r1000 –, r32766 ✓, main → `default via 203.0.113.1` (ISP-A), forward; pc30 → 192.0.2.80: r0 ✓, local ✕, r1000 ✓, table 100 → `default via 198.51.100.1` (ISP-B), forward | 6 + 5 = **11** |
| `lan-leak` | + replyRule (999) | pc20 → 198.51.100.10 in on `eth2`: r0, local → `local 198.51.100.10` (for rt1); reply 198.51.100.10 → 192.168.10.20 from `lo`: r0, local, r999 ✓, table 100 → default via ISP-B, forward: lost at ISP-B; `ip route add 192.168.10.0/24 dev eth2 table 100`; again: r0, local, r999 ✓, table 100 → `192.168.10.0/24 dev eth2` (/24 beats /0), forward: pc20 | 2 + 5 + 1 + 5 = **13** |
| `empty-table` | defaults (+ rule 900) | pc20 → 192.0.2.80: r0, local, r900 ✓, table 200: does not exist, r1000 –, r32766 ✓, main → ISP-A, forward | **8** |
| `reply-path` | defaults | 192.0.2.80 → 198.51.100.10 in on `eth1`: r0 ✓, local → `local 198.51.100.10` (for rt1); reply 198.51.100.10 → 192.0.2.80 from `lo`: r0, local, r1000 –, r32766 ✓, main → ISP-A, forward: filtered at ISP-A; `ip rule add from 198.51.100.10 lookup 100` (→ 999); reply again: r0, local, r999 ✓, table 100 → ISP-B, forward: delivered | 2 + 6 + 1 + 5 = **14** |
| `blackhole` | defaults (+ rule 500) | pc20 → 192.0.2.80: r0, local, r500 ✓ blackhole: dropped, no table read | **3** |

Checked on the kernel: every route and table choice above (`ip route get <dst> from <src> iif eth2`, and without `iif`
for `rt1`), the 999 and 32765 priorities, the empty table 200 falling through to main, the blackhole error. Step counts
checked by the script in `sim.test.js` against this table. The default page (`two-sources`) has 11 steps.

## Out of scope

`fwmark` and marking packets with the packet filter (one sentence on the page), ECMP and multipath routes, VRFs,
`rp_filter` details, IPv6, NAT (assumed for LAN sources, rule 7), table names in `rt_tables`, the `default` table's use,
`suppress_prefixlength`, `rp_filter` (assumed 0 or 2, the namespace default here: with strict `rp_filter=1` the
reply-path request in on `eth1` fails with `Invalid cross-device link` until the reply rule exists, reviewer), ICMP errors the sender gets for `unreachable`/`prohibit` (named in the caption only).
