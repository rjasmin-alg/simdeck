<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-bonding-modes: notes

New explorer (task `docs/tasks/w3/lnx-bonding-modes.md`, catalogue `lnx-bonding-modes`, §4.4, wave 3). Rules and
expected numbers: `SPEC.md`. No kit view is named by the task; the stage is `link-aggregation`'s, copied and adapted
(HTML + one stretched SVG for the strands).

## Decisions

- **Direction.** S sends to the clients, so S's bond is the end that chooses (task rule 6: only the transmit side).
  The stage reads left to right: S's flow list (destination MAC, IP, port, hash, link), strands, lanes eth0…, SW.
  The host's seeded clients are reused with S as the source; the XOR hash is symmetric, so every hash equals the
  host's for the same pair.
- **Flows are bulk transfers** (demand 4000 Mbit/s, more than any bond here). The task's params have no demand; the
  presets' numbers (4 × 0,25 on one link, 1,6 for one rr flow) need greedy flows. So the summary line is capacity,
  delivered, fastest flow; "offered" is dropped (it would be a meaningless 4 × n Gbit/s).
- **Primary eth0 is set (fixed, shown on the stage).** With it the bond returns to eth0 when eth0 is back, so the
  state is a function of the params, as an explorer needs. Without a primary, a real bond would stay on eth1 after
  eth0 recovers; the explanation says the primary is set. Failover otherwise picks the lowest-numbered up member
  (the task's tie-break).
- **balance-rr drawing.** Every flow has a band in every up lane (height rate / n), its strand fans out to each lane
  as a zigzag, its bands carry a diagonal stripe (pattern, not just colour), and the table's link cell says "all"
  (double border). Each lane shows 0,8 / 1 Gbit/s: the 20 % reordering loss as idle (hatched) capacity.
- **Switch mismatch.** `macFlap` needs at least two members actually carrying traffic: with every flow on one link
  (e.g. balance-xor, layer2, all to the gateway) the MAC stays on one port. `switchCfg = LACP` with balance-rr or
  balance-xor counts as a mismatch (the bond sends no LACP, so the ports do not bundle) *(check: switch-dependent)*.
  Delivered and fastest are struck through and tagged "unreliable"; the numbers are still the model's.
- **active-backup and a switch aggregate.** No warning (the task lists only three); the badge says "not needed" and
  the caption adds that the aggregate is not needed. What a static aggregate on the switch does to return traffic
  (it may send it to a backup port, which drops it) is receive side, out of scope.
- **Switch badge** = the config, plus ✓ "correct", ⚠ "needs static / needs LACP" (dashed red), or "not needed".
  The warning strip always shows something ("no warnings" with ✓ when empty) so the layout does not jump.
- **Policy control** is hidden in modes 0 and 1 (`visible`); the page adds `.sd-ctl[hidden] { display: none }` because
  the kit's `.sd-ctl { display: flex }` outranks the `hidden` attribute (already worked around the same way in
  tcp-vs-udp-loss, win-group-scopes and others).
- **Changed marks** compare with the state before the last input (rows, bands, strands as on the host); the active
  star is marked when it moved. The failover caption (hash modes) compares with the same settings and no failure,
  as on the host.
- **Numbers.** Mbit/s inside the model; Gbit/s on the page with at most 3 decimals and a decimal comma in Croatian.
- **Captions** are the task's own for the default state (hr and en checked word for word in the browser).
- **No OS or product names** beyond the subject: the Linux bonding mode names, `miimon`, eth0… and LACP / IEEE
  802.1AX are what NLA T06 teaches (COMMON §1). The bonding document is in Sources only.

## Deviations from the task

- **`active-backup-fail` starts with eth0 already failed** (the task: "eth0 active … fail eth0 → eth1"): the
  preset shows the failover result; setting "Failed link" back to none shows eth0 active again.
- **Added param `gateway`** (toggle, default off): preset 3 needs "4 flows all to the gateway's MAC", which the
  task's params cannot express. With it on, every frame carries the gateway's MAC (…:01) and the clients are in
  10.20.30.0/24 (same last octets).
- **No "offered" in the summary line** (flows are greedy, see Decisions).
- **`lacp-layer2-gateway` uses 2 members** (the task names none): layer2 → all 4 on eth1 (hash 17); layer3+4 →
  F1 on eth1, F2 F3 F4 on eth0, 2 Gbit/s delivered (a 3 + 1 split, not an even one: the hash does not balance).
- **`lacp-no-partner` uses 2 members and 4 flows** (task names neither).
- **Preset names** shortened to fit one line in the panel: "Preuzimanje / Failover", "Bez para / No partner".
- **Policy `layer2+3`** from the host is not offered (the task lists layer2 | layer3+4); the copied `hashOf` keeps it.

## Sources

- Napredna Linux administracija, `meta/toc.md`, T06 "VLAN-ovi, mostovi i udruživanje sučelja" (title only; chapter
  not written).
- Linux kernel `Documentation/networking/bonding.rst`, "Bonding Driver Options" (`mode`, `miimon`, `primary`,
  `xmit_hash_policy`, `lacp_rate`, `ad_select`) and "Switch Configuration" *(check: not read offline here; the rules
  follow the task file)*.
- IEEE 802.1AX (Link Aggregation, LACP) *(check)*.
- `sims/link-aggregation` (SPEC.md, sim.js @ ce4cc97): seeded clients, hash, max-min share, re-hash on failure.
- Numbers checked with a python3 script (standard library) before coding, 2026-11-13, equal to the model's:

  ```python
  S = dict(mac=0x10, ip=10, port=5000); GW = 0x01
  macs = [0x3a,0x5c,0x71,0x8e,0x24,0x9b,0x46,0xd2]; ips = [21,22,23,24,25,26,27,28]
  ports = [50612,51088,49733,52310,50944,53217,49906,51475]
  def flows(n, gw): return [dict(mac=GW if gw else macs[k], ip=ips[k], port=ports[k]) for k in range(n)]
  def h(f, pol): return f['mac'] ^ S['mac'] if pol == 'layer2' else f['port'] ^ S['port'] ^ f['ip'] ^ S['ip']
  def assign(n, gw, pol, members, fail):
      up = [m for m in range(members) if m != fail]
      return [(h(f, pol), up[h(f, pol) % len(up)]) for f in flows(n, gw)]
  print(assign(4, True, 'layer2', 2, None))     # all (17, 1): eth1
  print(assign(4, True, 'layer3+4', 2, None))   # (54819,1) (54276,0) (53712,0) (57292,0)
  print(assign(6, False, 'layer3+4', 3, None))  # eth 0 0 0 1 1 2
  print(assign(6, False, 'layer3+4', 3, 1))     # eth 2 0 0 0 2 2: F1 F4 F5 moved, F1 from eth0
  # active-backup 4 flows: 4 × 1000/4 = 250; rr 1 flow, 2 members: 2 × 1000 × 0.8 = 1600
  ```

## Unchecked *(check)*

- Failover order without a primary: the task's "lowest-numbered up member" (the kernel walks its slave list).
- 802.3ad without a partner: "one member only", and which one (`ad_select`; here the lowest-numbered up member).
- The 0,8 reordering penalty for balance-rr (a stage choice, said on the page: "80 % kept here").
- A switch with LACP configured facing a bond in balance-rr/xor: treated as a mismatch (ports stay individual).
- The kernel's exact `xmit_hash_policy` formulas (simplified as on the host; the page says "simplified").
- Croatian terms marked *(check)* below.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| bonding | udruživanje sučelja (NLA T06) |
| member link / slave | članska veza *(check)* |
| active-backup | aktivno-pričuvni način *(check)* |
| hash policy | politika raspršivanja *(check)*; the host says "pravilo sažetka" — the owner may want one term |
| failover | preuzimanje *(check)* |
| gratuitous ARP | besplatni ARP *(check)* |
| switch | preklopnik |
| static aggregate | statička skupina *(mine, check)* |
| MAC flapping | MAC adresa skače (između priključaka) *(mine, check)* |

`hashing` (raspršivanje) is in the glossary and used as `[[hashing]]` in the explanation.

## Shared requests

- **Model promotion:** `hashOf`, `share`, `flowKey`, `lastByte`, `lastOctet` are copied from
  `sims/link-aggregation/sim.js @ ce4cc97` (not in `models/` yet). Once promoted (e.g. `models/link-hash.js`), this
  sim can load them from there and drop the copy.
- **Kit:** `.sd-ctl[hidden]` should hide the control in `kit.css` (`.sd-ctl[hidden] { display: none; }`), so a
  `visible` param works without a page rule. Worked around locally.
- **Coordinator note from the task:** this page and `link-aggregation` share one stage and one hash model; kept
  separate as the task asks.

## Tags

Topic `linux-admin`, tag `link-aggregation` (both in `tags.json`), level `advanced`. Suggested `learn.json` leaf:
next to `link-aggregation` in `networks/local/aggregation` and `resilience/redundancy/links`.

## Review

A fresh reviewer read the files against SPEC.md and the task (2026-11-13): no disagreement between model and SPEC;
every preset number recomputed independently in python3 and confirmed; 64 mutations of `sim.js`, 50 killed, 14
survived. Of the survivors, 6 were missing tests and are now killed (star not marked when there was no active
member before; no `active` in 802.3ad's single mode, no `single` in active-backup; preset params pinned to SPEC;
`MODE_NO` pinned; the gateway's address; the copied `share` with unequal demands). The rest are equivalent on
reachable states (every demand is equal; primary eth0 is also the lowest id; no flow is ever on a failed member;
an assignment is never null since at most one of ≥ 2 members fails). Page fixes from the review: "every working
link" in the 802.3ad caption after a failure; "→ C1" for one flow; a dead caption (`capABLast`) removed; the head
line says the hash picks a position in the up list ("counted from 0 in eth0 and eth2"); a leftover "(preklopnik)"
in the hr explanation; hr/en wording of `capABSwitch`, `capRRFail`, `moved`.
- **Open (owner):** "priključak" stands for both the TCP port and the switch port, as on `link-aggregation`.

## Time

2026-11-13, 03:03 → 03:21, one session (the fresh review included).
