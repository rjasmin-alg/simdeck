<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# intervlan-routing: specification

Task `docs/tasks/w3/intervlan-routing.md` (catalogue `net-intervlan-routing`, §4.1). One concept: **router on a
stick vs L3 switch SVIs**: how a frame from VLAN 10 reaches VLAN 20, and what happens to its tag on the way.
Model: `sim.js`; tests: `sim.test.js`.

## Scene

Grafo d.o.o. head office, URM ch12 ("Od adresne sheme do fizičkog rasporeda", the table; Primjer 1, host
addresses and the full configuration). Only VLAN 10 (Prodaja) and VLAN 20 (Proizvodnja) are drawn.

| Node | Port / interface | Address | MAC (shown as `…:xx`) |
|---|---|---|---|
| P1 (Prodaja, VLAN 10) | SW1 `Fa0/1`, access VLAN 10 | 192.168.1.2/26, gateway 192.168.1.1 | `02:00:00:00:00:0a` |
| Q1 (Proizvodnja, VLAN 20) | SW1 `Fa0/2`, access VLAN 20 | 192.168.1.66/27, gateway 192.168.1.65 | `02:00:00:00:00:0c` |
| P2 (Prodaja, VLAN 10) | SW1 `Fa0/5`, access VLAN 10 | 192.168.1.3/26, gateway 192.168.1.1 | `02:00:00:00:00:0b` |
| R1 (mode `roas`) | `Gi0/0`, trunk from SW1 `Gi0/1`; `Gi0/0.10` dot1q 10 192.168.1.1/26, `Gi0/0.20` dot1q 20 192.168.1.65/27 | | `02:00:00:00:00:01` (one MAC for the interface and both subinterfaces, rule 10) |
| SW1 (mode `l3`) | SVIs `vlan 10` 192.168.1.1/26, `vlan 20` 192.168.1.65/27; no R1, no `Gi0/1` link | | `02:00:00:00:00:fe` (one MAC for both SVIs) |

SW1 has VLANs 10 and 20 and no other. P2 sits on `Fa0/5`, not the task's `Fa0/3`: in the book `Fa0/3` is VLAN 30
(Uprava) (NOTES.md, deviations).

**The frame** carries a full-size packet (1500 bytes): 1518 bytes untagged, 1522 tagged (URM ch07, figure
`ch07-8021q-oznaka`: the maximum grows by exactly the 4-byte tag; IEEE 802.1Q). TTL starts at 64. Fields shown:
dst MAC, src MAC, 802.1Q tag (VID or none), size, IP src, IP dst, TTL.

**Tables** (ARP is assumed resolved; the tables are those the working network learnt before any fault):

- SW1 MAC table, by VLAN: VLAN 10: P1 `Fa0/1`, P2 `Fa0/5`, R1 `Gi0/1` (`roas`) or SW1's own MAC → `vlan 10`
  (`l3`); VLAN 20: Q1 `Fa0/2`, R1 `Gi0/1` (`roas`, no fault only) or SW1's own MAC → `vlan 20` (`l3`). R1 is learnt
  on the trunk in every VLAN it carries (URM ch12 "Šire o temi", `show mac address-table` figure). With a fault,
  R1's VLAN 20 frames never reach SW1, so it is not in VLAN 20.
- **The faults and ARP.** Strictly, with either fault the ARP needed before the data frame would fail first
  (`access-port`: P1's ARP request for 192.168.1.1 reaches R1 untagged and is dropped; `vid-mismatch`: R1's ARP
  request for 192.168.1.66 leaves tagged VID 21 and is dropped at SW1). The presets show the data frame's fate as if
  the addresses had been learnt before someone changed the configuration (Primjer 6's "netko … zaboravi"); the
  ARP frame would meet the same drop at the same device, for the same reason.
- R1: its subinterfaces are its routing table (both networks connected).

## Params

| Param | Values | Default |
|---|---|---|
| `mode` | `roas` (router on a stick) / `l3` (L3 switch with SVIs) | `roas` |
| `dst` | `q1` (192.168.1.66, VLAN 20) / `p2` (192.168.1.3, VLAN 10) | `q1` |
| `fault` | `none` / `access-port` (SW1 `Gi0/1` left as access VLAN 10) / `vid-mismatch` (`Gi0/0.20` configured with dot1q 21); only in `roas`, hidden and ignored in `l3` | `none` |

Unknown values fall back to the defaults. `mode` and `dst` reset to step 0 (they change the path); `fault` too.

## One step

The frame crosses one link, or one device takes it in and decides. Inside a device step: (1) ingress (assign or
read the VLAN), (2) decision (switch: MAC table of that VLAN; router/SVI: routing table), (3) egress rewrite
(tag/untag, new MACs, TTL), (4) onto the outgoing link. A switch does (1)+(2) in one step and (3)+(4) in the next;
R1 does (1) in one step and (2)–(4) in the next (rule 6 is one decision); the sending host does (2)+(4) in step 1;
the receiving host does (1) in the last step. In `l3` the routing inside SW1 is a step of its own.

## Rules (each has a test in `sim.test.js`)

1. **The sender ANDs its own mask** (URM ch08 local/remote; ch12 Primjer 1 addresses). P1: 192.168.1.66 AND
   255.255.255.192 = 192.168.1.64 ≠ 192.168.1.0 → remote → the frame goes to the gateway 192.168.1.1's MAC (R1's
   in `roas`, SW1's in `l3`). 192.168.1.3 AND 255.255.255.192 = 192.168.1.0 → local → P2's own MAC; the router
   never sees it. *Tie-break:* the sender's mask decides, not the destination's (P1 uses /26 for 192.168.1.66,
   whose own network is a /27).
2. **Hosts send and receive untagged frames.** An access port assigns its VLAN on ingress and never looks for a tag;
   on egress it sends untagged (URM ch07 "VLAN-ovi: jedna žica, više logičkih mreža"). *Tie-break:* an access port
   tags nothing, even a frame of its own VLAN (from `vlan`).
3. **A switch forwards only within the frame's VLAN**: it looks the dst MAC up in that VLAN's table only (ch07; ch12
   `show mac address-table`). R1's MAC is in both VLANs (on `Gi0/1`); the hit row in VLAN 10 is not the one in
   VLAN 20.
4. **Trunk egress inserts the 802.1Q tag** (TPID 0x8100, 12-bit VID) after the source MAC; 1518 → 1522 bytes. A
   trunk ingress reads the VID; a VID the switch does not have is dropped (vid-mismatch).
5. **R1 maps the tag's VID to the subinterface whose dot1q VID matches**; no match → dropped. The subinterface
   number (`.10`, `.20`) is only a label (ch12 "Konfiguracija mrežnog sučelja": "Broj iza `dot1q` mora se
   poklapati s VLAN ID-em … sam broj podsučelja iza točke … samo pomaže").
6. **Routing** (R1 or SW1's SVI): strip the L2 header, TTL − 1 (64 → 63; RFC 1812 §5.3.1), longest-prefix match:
   192.168.1.66 is in 192.168.1.64/27, connected on `Gi0/0.20` / `vlan 20`; new frame: src MAC = the router's, dst
   MAC = Q1's, VID = the egress subinterface's dot1q VID (`roas`) or none (`l3`) (ch11 per-hop rewrite).
   *Tie-break:* the longest prefix wins; equal prefixes go to the first interface listed (no such case in the
   scene, tested on its own).
7. **Router on a stick uses the trunk twice**: up in VLAN 10, down in VLAN 20; the counter of `Gi0/1–Gi0/0` ends at
   2, every other used link at 1 (ch12 "Šire o temi": one link instead of a physical interface per VLAN is the
   trade-off).
8. **L3 switch**: the frame to the SVI's MAC is routed inside SW1; no tag appears on any wire and no trunk exists
   (derived; Cisco "Configuring SVIs" *(check)*).
9. **Switch port towards R1 left in access mode** (ch07 Primjer 6): SW1 sends VLAN 10 out of `Gi0/1` untagged;
   R1 has no subinterface without dot1q (no native one), so the frame matches none → dropped. *Tie-break:* the
   untagged frame does not fall to `Gi0/0.10` because the frame "is" VLAN 10 — R1 cannot know that. The reverse
   direction never starts.
10. **One MAC for R1**: all subinterfaces share the physical interface's MAC (Cisco behaviour *(check)*); likewise
    one MAC for SW1's SVIs *(check)*.

## Presets and expected numbers

| # | Preset | Params | Steps | Outcome |
|---|---|---|---|---|
| 1 | `roas` | defaults | **8** | delivered; tag 10 up (step 3), tag 20 down (step 5), TTL 64 → 63, trunk ×2 |
| 2 | `l3-svi` | `mode: l3` | **5** | delivered; no tag on any wire, TTL 64 → 63 (step 3) |
| 3 | `same-vlan` | `dst: p2` | **4** | delivered to P2 in VLAN 10; trunk ×0, TTL 64 |
| 4 | `access-port` | `fault: access-port` | **4** | dropped at R1 (untagged), trunk ×1 |
| 5 | `vid-mismatch` | `fault: vid-mismatch` | **6** | R1 routes and tags VID 21; dropped at SW1 ingress (no VLAN 21), trunk ×2 |

`dst: p2` gives 4 steps in either mode and with any fault. `steps` is a function of the params; `sim.json` `steps`
is the default's, 8.

### The `roas` run

| Step | Where | What | Frame after (dst, src, tag, size, TTL) | Links |
|---|---|---|---|---|
| 1 | link P1–SW1 | P1: remote → R1's MAC | `…:01`, `…:0a`, none, 1518, 64 | p1 1 |
| 2 | SW1 | `Fa0/1` → VLAN 10; VLAN 10 table: `…:01` → `Gi0/1` | same | |
| 3 | trunk | `Gi0/1` is a trunk: tag VID 10, 1522 | `…:01`, `…:0a`, **10**, **1522**, 64 | trunk 1 |
| 4 | R1 | VID 10 → `Gi0/0.10` | same | |
| 5 | trunk | route: 192.168.1.64/27 on `Gi0/0.20`; new MACs, TTL 63, tag 20 | **`…:0c`**, **`…:01`**, **20**, 1522, **63** | trunk **2** |
| 6 | SW1 | trunk: VID 20 → VLAN 20; VLAN 20 table: `…:0c` → `Fa0/2` | same | |
| 7 | link SW1–Q1 | `Fa0/2` is access: strip the tag, 1518 | `…:0c`, `…:01`, **none**, **1518**, 63 | q1 1 |
| 8 | Q1 | its MAC, untagged, its IP: delivered | same | |

### The `l3-svi` run

1 P1 → SW1's MAC (`…:fe`), untagged; 2 SW1: `Fa0/1` → VLAN 10; VLAN 10 table: `…:fe` is SW1's own (`vlan 10`);
3 SW1 routes: 192.168.1.64/27 on `vlan 20`, new frame `…:0c` / `…:fe`, TTL 63, VLAN 20 table: `…:0c` → `Fa0/2`;
4 `Fa0/2`, untagged, onto the link to Q1; 5 Q1 delivers.

Checked by running the model (`node -e` over every preset, 2026-10-27): the step counts, the fields and the link
counters above are its output.

## Marks

`changed` lists the frame fields that differ from the previous step's frame (none at step 1, when the frame is
built). `linkChanged` is the link whose counter went up this step.

## Out of scope

ARP resolution (`arp-local-remote`), inter-VLAN ACLs, native VLAN details (`vlan-trunk`), DHCP relay, trunk
bandwidth contention, TTL expiry (`hop-rewrite`), the values of the header checksum and FCS (`hop-rewrite`; the
FCS's 4 bytes are counted in the 1518/1522), the TPID field as data (0x8100 is in the explanation only).
