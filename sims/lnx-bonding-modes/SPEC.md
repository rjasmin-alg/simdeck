<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-bonding-modes: what each bonding mode gives up

One concept: **active-backup vs balance vs 802.3ad**. The same bond of 2–4 member links behaves differently per
mode: active-backup uses one link and needs nothing from the switch; balance-rr gives one flow more than one link but
reorders its frames; balance-xor and 802.3ad hash each flow to one link and need the switch configured (a static
aggregate, or LACP). An explorer: the params drive the drawing live. The student fails links and sends flows.

Task: `docs/tasks/w3/lnx-bonding-modes.md`. Catalogue: `lnx-bonding-modes` (§4.4). Host model:
`sims/link-aggregation` (copied, COMMON.md §6; it is not in `models/` yet).

## Scene

Left to right: server S with its flow list (one row per flow F1…Fn to client C1…Cn: destination MAC, IP and port, the
hash and the member it gives), the strands from each row into the lanes, the member links eth0…eth(N−1) of 1 Gbit/s
(N = 2…4) drawn as the host's lanes (a pipe 1 Gbit/s high, a band per flow whose height is its rate, the rest
hatched), and switch SW with its config badge. Above: the bond's label `bond0` with the mode (name and number), the
rule that picks the member, and for active-backup the primary. Below: a warning strip and the summary line.

Traffic goes from S to the clients: S's bond is the end that picks the member (rule 6). Seeded values are the host's
(sims/link-aggregation SPEC.md "Scene"), with S as the source:

| | MAC | IP | port |
|---|---|---|---|
| S (source) | 02:00:00:0b:00:**10** | 192.168.10.**10** | 5000 |
| C1…C8 (destination) | …:**3a** **5c** **71** **8e** **24** **9b** **46** **d2** | 192.168.10.**21**…**28** | 50612 51088 49733 52310 50944 53217 49906 51475 |
| gateway | 02:00:00:0a:00:**01** | 192.168.10.1 | |

With `gateway` on (added param, see NOTES.md), the clients are in another network (10.20.30.21…28, the same last
octets) and every frame from S carries the gateway's MAC as its destination.

Flows are bulk transfers: each wants more than any bond here can carry (demand 4000 Mbit/s), so the links decide the
rates. There is no "offered" figure; the summary line is capacity (up members × 1 Gbit/s), delivered, fastest flow.

## State (explorer)

Params `{ mode, members, fail, policy, switchCfg, flows, gateway }` → derived `{ mode, members: [{ id, up }], up, how,
active, single, switchCfg, switchNeeds, switchOk, policy, gateway, flows, hash, index, assignment: { flowId: memberId |
'all' | null }, rate, memberLoad, perMember, used, delivered, fastest, capacity, warnings: [code], unreliable,
failover }`. Members are numbered 0…N−1 and shown as eth0…eth(N−1). Rates in Mbit/s, shown in Gbit/s.

## Rules

Source, unless stated: Linux kernel `Documentation/networking/bonding.rst`, "Bonding Driver Options" (`mode`,
`miimon`, `primary`, `xmit_hash_policy`, `lacp_rate`, `ad_select`) and "Switch Configuration" *(check: not read
offline here; the rules follow the task file)*.

1. **active-backup (mode 1).** One member, the active one, carries every flow; the others are up and idle (backup).
   Total ≤ 1 Gbit/s; flows share it equally (4 flows → 4 × 0,25). No switch config is needed (`switchNeeds = null`,
   every `switchCfg` is "ok"). Active member: the primary (eth0, fixed on this page) when it is up; otherwise the
   **lowest-numbered up member** (tie-break, task file *(check)*). On failure (detected by `miimon`, 100 ms) the new
   active member sends a gratuitous ARP. Because the primary is set, the bond returns to eth0 when eth0 is back, so the
   state can be derived from the params alone. Failing a backup member changes nothing that carries traffic.
2. **balance-rr (mode 0).** Frames go to the up members in turn: every flow is on every up member (`assignment =
   'all'`). With n ≥ 2 up members its frames arrive out of order (warning `reorder`) and the bond delivers
   n × 1 Gbit/s × 0,8 (the reordering penalty, a fixed stage choice *(check)*), shared equally among the flows; each
   member carries delivered / n. With one member up there is no reordering and no penalty (1 Gbit/s). One flow on
   2 members: 1,6 Gbit/s, the only mode where one flow exceeds one link. Needs a static aggregate on the switch.
3. **balance-xor (mode 2).** Member = up[hash mod (number of up members)], up members in id order: the host's rule
   2, with `layer2` (last byte of src MAC ⊕ dst MAC) and `layer3+4` (src port ⊕ dst port ⊕ last octet of src IP ⊕
   dst IP), simplified as on the host. Flows on one member share its 1 Gbit/s equally (the host's max-min share; all
   demands equal). Needs a static aggregate on the switch.
   **Switch mismatch (rules 2, 3):** balance-rr or balance-xor with `switchCfg ≠ static` while at least two members
   carry traffic: the switch sees S's MAC on several ports (warning `macFlap`), and the delivered figure is shown as
   unreliable (`unreliable = true`; the numbers are still computed). `switchCfg = lacp` counts as a mismatch too: the
   bond sends no LACP, so the switch's ports do not bundle *(check: switch-dependent, some suspend the ports)*. With
   only one member carrying, the MAC stays on one port: no warning.
4. **802.3ad (mode 4).** With `switchCfg = lacp`: LACP (`lacp_rate` slow 30 s, fast 1 s) puts every up member into
   one aggregator, and flows are hashed as in rule 3. With `switchCfg ≠ lacp`: no partner answers, the members do not
   join one aggregator, and the bond uses one member only (`how = 'single'`, warning `noPartner`), 1 Gbit/s in total.
   That member is the lowest-numbered up member (tie-break, `ad_select` picks one aggregator *(check)*). No `macFlap`
   here: only one member carries.
5. **Failure in modes 0, 2, 4.** The failed member is removed and flows re-hash over the rest (mod N − 1), so flows
   on healthy members can move too (the host's rule 4). The page compares with the same settings and no failure
   (`failover.moved`, `fromFailed`, `fromHealthy`). Balance-rr has no per-flow member, so nothing "moves": it just
   loses one member's share.
6. **Transmit side only.** What the switch sends back is decided by the switch's own hash; named in the explanation,
   not modelled.

**Tie-breaks.** Active member: primary, then lowest-numbered up (rules 1, 4). Hash: two flows with the same hash
inputs share a member (all flows to the gateway under `layer2`). Equal shares on a member, whatever the order.

**Changed.** A flow is marked when its member differs from the state before the last input, matched by its headers
(`flowKey`); `'all'` ↔ a member counts as a move; a new flow is not "moved". The active-member star is marked when it
moved (both states have an active member). The same assignment marks nothing.

## Presets (numbers from the model; checked with the python3 script in NOTES.md)

1. `active-backup-fail`: active-backup, 2 members, 4 flows, switch none, **eth0 failed**: eth1 active, 4 × 0,25 =
   1 Gbit/s on eth1; no warning. With eth0 back (fail none): eth0 active, again 1 Gbit/s. The star moves eth0 → eth1.
2. `rr-one-flow`: balance-rr, 2 members, 1 flow, switch static: F1 on both members, 2 × 1 × 0,8 = 1,6 Gbit/s,
   each member 0,8; warning `reorder`. Switch none → `macFlap` too, delivered unreliable.
3. `lacp-layer2-gateway`: 802.3ad, LACP, `layer2`, 4 flows behind the gateway, 2 members: every hash is 0x10 ⊕ 0x01
   = 17, 17 mod 2 = 1 → all four on eth1, 4 × 0,25; eth0 idle; delivered 1. Switching to `layer3+4`: hashes 54819,
   54276, 53712, 57292 → F1 on eth1 (1 Gbit/s), F2 F3 F4 on eth0 (3 × 0,333); delivered 2.
4. `lacp-no-partner`: 802.3ad, switch none, 2 members, 4 flows: eth0 carries all, 4 × 0,25 = 1 Gbit/s, eth1 idle;
   warning `noPartner`.
5. `xor-fail-rehash`: balance-xor, 3 members, 6 flows, `layer3+4`, switch static, **eth1 failed**. Without the
   failure (mod 3): F1 F2 F3 → eth0, F4 F5 → eth1, F6 → eth2. With it (mod 2 over eth0, eth2): F2 F3 F4 → eth0,
   F1 F5 F6 → eth2 (each 0,333); moved F1, F4, F5 — F1 from healthy eth0; delivered 2.

Default (no preset): active-backup, 2 members, 4 flows, nothing failed: eth0 active, 4 × 0,25, eth1 idle (the
task's caption).
