<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vlan-trunk: specification

Task `docs/tasks/w3/vlan-trunk.md` (catalogue `net-vlan-trunk`, §4.1). One concept: **802.1Q tags added and removed
at trunk edges**: where a frame gets its tag, where it loses it, which VLAN travels untagged (native) and which does
not travel at all (allowed list). Model: `sim.js`; tests: `sim.test.js`.

## Scene

URM ch07 Primjer 5 and `ugradbeno/vlan.html` (the page `vlan` adopted): two switches, VLAN 10 (računovodstvo) and
VLAN 20 (prodaja), one cable between them.

| Switch | Port | Mode | Host | MAC (shown `…:xx`) |
|---|---|---|---|---|
| SW1 | `Fa0/1` | access VLAN 10 | Ra1 | `02:00:00:00:00:11` |
| SW1 | `Fa0/2` | access VLAN 20 | Pr1 | `02:00:00:00:00:21` |
| SW1 | `Fa0/3` | access, SW1's native VLAN (`native1`) | M1 | `02:00:00:00:00:31` |
| SW1 | `Gi0/1` | the cable to SW2: trunk (native `native1`, allowed list) or access VLAN 10/20 | — | |
| SW2 | `Fa0/1` | access VLAN 10 | Ra2 | `02:00:00:00:00:12` |
| SW2 | `Fa0/2` | access VLAN 20 | Pr2 | `02:00:00:00:00:22` |
| SW2 | `Fa0/3` | access, SW2's native VLAN (`native2`) | M2 | `02:00:00:00:00:32` |
| SW2 | `Gi0/1` | as SW1's `Gi0/1`, native `native2` | — | |

- **M1 and M2 are in their own switch's native VLAN** (task: "M1/M2 in VLAN 1 (the default/native VLAN)", and in
  `native-mismatch` "host M2 in VLAN 99"). So with `native2 = 99`, M2 is in VLAN 99. *(assumption, NOTES.md)*
- **The frame** carries a full-size payload: 1518 bytes untagged, 1522 with the tag (URM ch07, figure
  `ch07-8021q-oznaka`: the tag is 4 bytes, inserted right after the source MAC, before the type field; the maximum
  grows from 1518 to 1522). Fields shown: dst MAC, src MAC, [TPID `0x8100` | PCP `0` | DEI `0` | VID], type
  `0x0800`, length. A broadcast's dst MAC is `ff:ff:ff:ff:ff:ff`.
- **MAC tables are pre-learnt** (learning is `mac-table`'s concept): each switch knows every host whose frames can
  reach it, in the VLAN those frames arrive in, on the port they arrive on, derived by the same ingress and egress
  rules below. A host whose frames cannot reach the switch is unknown there.

## Params

| Param | Values | Default |
|---|---|---|
| `link` | `trunk` / `access-10` / `access-20` (both ends of the cable the same) | `trunk` |
| `native1` | SW1's trunk native VLAN and M1's VLAN; the page offers 1, 10, 20, 99, the model takes 1–99 | 1 |
| `native2` | the same for SW2 and M2 | 1 |
| `allow20` | on: both trunks allow 1–4094; off: 1–19, 21–4094 | on |
| `send` | `ra1-ra2`, `pr1-pr2`, `pr1-bcast`, `m1-m2` (M1 → M2 and Ra1 → Ra2 beside it), `both` (Ra1 → Ra2 and Pr1 → Pr2) | `both` |

On an access cable `native1` and `native2` still set M1's and M2's VLAN (so they stay visible); `allow20` only
matters on a trunk (hidden otherwise). Unknown values fall back to the defaults. Every param resets to step 0.

## One step

Every frame in flight moves one hop. A switch does (1) ingress classification and (2) the forwarding decision in
the step the frame arrives, and (3) egress encoding and (4) onto the link in the next. A host's link is the last
hop: the host takes the frame in the step it is put on that link. With one switch hop each side this is always
**5 steps**: host → SW1 (in) → cable (SW1 out) → SW2 (in) → host link (SW2 out, delivered). A frame dropped earlier
stays dropped for the remaining steps. A flood makes one copy per port; copies are `<id>.<port>`.

## Rules (each has a test in `sim.test.js`)

1. **Hosts send untagged** and never see a tag: every frame leaves its host untagged, 1518 bytes; every delivered
   frame is untagged (ch07 "pristupni priključak"; Primjer 5c).
2. **Access port.** Ingress: an untagged frame belongs to the port's VLAN. Egress: only frames of that VLAN leave,
   untagged (ch07).
3. **Trunk egress.** A frame of VLAN v leaves tagged with VID v, unless v is the port's native VLAN: then untagged
   (ch07 "nativni VLAN"; IEEE 802.1Q).
4. **Trunk ingress.** Tagged → the VID's VLAN; untagged → the receiving port's native VLAN (IEEE 802.1Q PVID; ch07).
5. **Allowed list.** A VLAN outside the trunk's list is not sent (egress) and is dropped (ingress). Default 1–4094
   (ch12 "Provjera povezanosti": "*Trunk* po zadanome nosi sve VLAN-ove").
6. **Tag size and VID range.** The tag adds 4 bytes after the source MAC: 1518 → 1522 on the trunk, 1518 again
   once removed. VID is 12 bits (0–4095); 0 and 4095 are reserved, so 1–4094 are assignable (ch07).
7. **Forwarding stays in the VLAN.** A broadcast or an unknown destination goes to every port of that VLAN except
   the ingress port; a known destination to its port. A broadcast from Pr1 reaches only Pr2 (ch07: each VLAN its
   own broadcast domain).
8. **Cable as access VLAN 10** (ch07 Primjer 5b): VLAN 10 crosses untagged; a VLAN 20 frame finds no VLAN 20 port
   on SW1 but its own and stops there (reason `no-port`).
9. **Native VLAN mismatch** (derived from 3 and 4): SW1 native 1, SW2 native 99: M1's VLAN 1 frame leaves SW1
   untagged and SW2 puts it in VLAN 99; it is delivered to M2 (VLAN 99). Nothing in the frame records the error
   (the model flags it `leak`). Switches that exchange a neighbour discovery protocol can warn about the mismatch,
   and some spanning tree variants put such a port in an inconsistent (blocking) state, so in practice the leak is
   often blocked; the frame itself cannot show it *(vendor behaviour, check)*.
10. **Tagged frame on an access port** is dropped (reason `tagged-on-access`). Strictly this holds for a frame
    tagged with another VLAN; many switches accept one tagged with the access VLAN itself or a priority tag (VID 0)
    *(vendor behaviour, check)*; the model drops every tagged frame. It cannot happen in the scene (both cable ends share one mode); tested on `ingress` directly.

**Tie-breaks**

- **Native wins over tagging**: on a trunk the native VLAN is never tagged, even VLAN 10 when `native1 = 10`.
- **The allowed list beats the native VLAN**: a native VLAN outside the allowed list is not sent either (egress
  check first).
- **A known port equal to the ingress port** is filtered: no copy back where it came from (the frame then stops
  with reason `no-port`; unreachable in the scene).
- **One frame per port**: a flood to two ports makes two copies; a single port keeps the frame's id.
- **Leaking is marked when the VLAN changes at an ingress**, not only at delivery (a leaked unicast that ends at
  the wrong host and is ignored is still a leak).

## Presets (5 steps each)

| # | id | Params | Expected |
|---|---|---|---|
| 1 | `trunk` | defaults | step 3: Ra1's frame VID 10, Pr1's VID 20, both 1522 B, tag `added`; step 5: delivered to Ra2 and Pr2, 1518 B, tag `removed`. Primjer 5a. |
| 2 | `access-link` | `link: access-10` | Ra1 → Ra2 untagged 1518 B on the cable, delivered at step 5; Pr1 → Pr2 dropped at SW1 at step 2, `no-port`. Primjer 5b. |
| 3 | `broadcast` | `send: pr1-bcast` | step 2: SW1 floods VLAN 20 → `Gi0/1` only; step 3: VID 20, 1522 B; step 4: SW2 → `Fa0/2` only; step 5: delivered to Pr2; Ra1, Ra2, M1, M2 never. |
| 4 | `native` | `send: m1-m2` | step 3: M1's frame untagged 1518 B on the cable next to Ra1's VID 10 1522 B; step 4: SW2 puts it in VLAN 1 (native); step 5: delivered to M2. |
| 5 | `native-mismatch` | `send: m1-m2`, `native2: 99` | step 3: untagged; step 4: SW2 → VLAN 99 (`leak`); step 5: delivered to M2 in VLAN 99. Ra1's frame unaffected (VID 10). Derived, unchecked. |
| 6 | `not-allowed` | `allow20: false` | Pr1 → Pr2 dropped at SW1 `Gi0/1` at step 3 (`not-allowed`); Ra1 → Ra2 VID 10, delivered at step 5. ch12 "Provjera povezanosti". |

## Numbers checked

The table above was produced by running the model for every preset (script output in NOTES.md "Checks"); the tag
size (4 B), sizes (1518, 1522), TPID (`0x8100`) and VID range (1–4094) are from ch07 and its figure.
