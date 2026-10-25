<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# domains: spec

Task `docs/tasks/w3/domains.md`, catalogue `net-domains` (§4.1). One concept: **hubs, switches and routers split
different domains**. An explorer: the student swaps the devices in fixed slots and sees the collision and broadcast
domains redrawn and counted.

Sources: URM = `uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`, section "Ethernet u preklopljenoj
mreži: kako preklopnik radi iznutra" (footnotes kr-collision, kr-broadcastdomain, algebra-broadcastdomain), the
ten-computer office paragraph at its end, "VLAN-ovi: jedna žica, više logičkih mreža", Primjer 3 and (b), Primjer 4.

## Scenes

**Two networks** (`layout: "two"`, URM Primjer 3). Fixed slots, left to right:

| Device | Kind | Links (in this order) | Network |
|---|---|---|---|
| `S1` | slot `net1Core`: hub or switch (default switch) | `S1–a1` … `S1–a4` (four computers), `S1–R` | 1 |
| `R` | slot `router`: router or switch (default router) | `R–S2` | 2 |
| `S2` | switch, fixed | `S2–b1`, `S2–b2` (two computers), `S2–X` | 2 |
| `X` | slot `net2Edge`: hub or switch (default hub) | `X–c1`, `X–c2`, `X–c3` (three computers) | 2 |

The router connects to `S2`, not to `X`: Primjer 3 says the second switch "jednim je svojim priključkom spojen i na
usmjernik", and the hub "samo jednim kabelom spojen na jedan priključak drugog preklopnika". A link belongs to the
network named in the table; the link `S1–R` counts in network 1 (Primjer 3: "četiri računala plus veza prema
usmjerniku daju pet"), `R–S2` in network 2.

**Office** (`layout: "office"`, URM ten-computer office paragraph): one device in slot `net1Core` (hub or switch) with
ten computers `o1` … `o10`, links in that order. No router, so `router`, `net2Edge` and `vlans` do not apply there.

## Rules

1. **Hub: one collision domain with everything on it.** A hub repeats the signal to all its ports, so all its links
   are one collision domain, which contains the hub, every computer on those links and the far end of each link (a
   switch or router port). (URM "Ethernet u preklopljenoj mreži", kr-collision: "Koncentrator radi suprotno: sve što
   je na njega spojeno dijeli jedan te isti signal, pa je cijela ta skupina uređaja jedna kolizijska domena".)
2. **Switch: one collision domain per port.** A switch never joins two of its links. A port's domain includes what
   shares the medium on the far side (a whole hub) but nothing on the switch's other ports. (Same section; Primjer 3:
   "preklopnik taj jedan svoj priključak doduše izolira od ostalih svojih priključaka, ali ne i od onoga što dijeli
   medij na drugoj strani te veze".)
3. **Router: one collision domain per interface**, same as a switch port. (Primjer 3: "i veza prema usmjerniku je,
   kao i u prvoj mreži, zasebna kolizijska domena".)
4. **Only a router stops broadcasts.** Hubs and switches pass them, so all links joined through hubs and switches
   are one broadcast domain; a router joins none of its links, so each router interface bounds one. (Same section,
   algebra-broadcastdomain, kr-broadcastdomain: "svaka mreža koju usmjernik povezuje čini svoju vlastitu, zasebnu
   *broadcast* domenu".)
5. **VLANs split one switch into several broadcast domains.** With `vlans` on, `S1` puts `a1`, `a2` in VLAN 10 and
   `a3`, `a4` in VLAN 20, and `S1–R` becomes a trunk carrying both, with one router subinterface per VLAN. The switch
   joins links only within one VLAN; a frame between VLANs needs the router (URM "VLAN-ovi: jedna žica, više logičkih
   mreža": "uređaji u različitim VLAN-ovima to više ne mogu bez L3 uređaja"). VLANs change no collision domain: the
   trunk is still one link, one collision domain.
6. **The two counts are independent.** The collision walk looks only at hubs; the broadcast walk only at routers and
   VLANs. Swapping a hub for a switch changes only the first; swapping a router for a switch only the second. (URM
   "Kolizijska i *broadcast* domena pritom ne rastu i ne padaju zajedno"; the office paragraph; Primjer 3 (b).)
7. **Edge: a full-duplex switch port is still a collision domain**, counted like any other, although no collision
   can happen on it: CSMA/CD only runs on half duplex (URM CSMA/CD paragraph, Primjer 4 (b)). The explanation says so,
   and the office caption with a switch says so.

## The walk (model)

- A **scene** is `{ devices: { id: { kind, net, vlan } }, links: [{ id, a, b, net, trunk }] }`, kinds `host`, `hub`,
  `switch`, `router`. `scene(params)` builds it from the layout and the slots.
- **Collision domains:** union-find over links. Every hub unions all its links. One class is one domain:
  `{ links, devices (hosts and hubs on its links), ports ([device, link] for each switch or router end) }`.
- **Broadcast domains:** union-find over items `(link, vlan)`. A link carries `[null]`, or one VLAN on a VLAN switch's
  access link, or every VLAN of the switch on a trunk. A hub, or a switch without VLANs, unions all items on its links;
  a VLAN switch unions items with the same VLAN; a router and a host union nothing. One class is one domain:
  `{ items, links, devices (hosts, hubs, switches on its links; a VLAN switch is in each of its VLANs' domains),
  edges ([router, link, vlan] where the domain ends at a router (sub)interface), vlan }`.
- **Effective VLANs (tie-break):** VLANs apply only when `layout` is `two`, `net1Core` is a switch (a hub has no
  VLANs) and `router` is a router (the trunk ends in router subinterfaces). Otherwise `vlans` is ignored and the page
  disables the toggle with the reason (a hub in network 1 is named first when the
  router is a switch too).

### Tie-breaks

- **Order and numbering.** Collision domains are numbered 1, 2, … in the order of their first link in the scene's link
  list; broadcast domains are lettered A, B, … in the order of their first item (links in list order, VLANs ascending
  within a link). So network 1 keeps numbers 1–5 whatever happens in network 2.
- **Per-network count.** A collision domain counts in the network of its first link. (No scene here has a domain that
  spans both networks, so this only matters if the scenes grow.)
- **Changed.** A domain is *changed* when no domain of the "before" params has exactly the same members (links for
  collision domains, items for broadcast domains): it appeared, merged or split. Without "before" (first load, or a
  layout change) nothing is changed.
- **Before.** A preset brings its own "before" params (table below); a hand change makes the params just before it
  the "before"; a re-render with unchanged params keeps the old "before".

## Expected numbers

Collision / broadcast, network 1 + network 2. Checked by `sim.test.js` (the first five are the presets).

| Preset | Params | Collision | Broadcast | Source |
|---|---|---|---|---|
| `primjer-3` | defaults | 5 + 4 = **9** | **2** | URM Primjer 3 |
| `primjer-3b` | `net2Edge: switch` (before: `primjer-3`) | 5 + 7 = **12** (3 + 1 + 2 + 1) | **2** | URM Primjer 3 (b) |
| `office-hub` | `layout: office, net1Core: hub` | **1** | **1** | URM office paragraph |
| — | `layout: office, net1Core: switch` | **10** | **1** | URM office paragraph |
| `no-router` | `router: switch` (before: `primjer-3`) | **9** | **1** | derived, *(check)* |
| `vlans` | `net2Edge: switch, vlans: on` (before: `primjer-3b`) | **12** | **3** (VLAN 10, VLAN 20, network 2) | derived, *(check)* |
| — | `net1Core: hub` | 1 + 4 = **5** | **2** | rule 1 |
| — | `net1Core: hub, net2Edge: switch, router: switch` | **8** | **1** | rules 1, 2, 4 |
| — | `vlans: on, net1Core: hub` | **5** | **2** (VLANs ignored) | tie-break |
| — | `vlans: on, router: switch` | **9** | **1** (VLANs ignored) | tie-break |

Changed marks: `primjer-3` → `primjer-3b`: collision domains 9–12 changed (the hub's one split into four), none of 1–8;
no broadcast domain changed. `primjer-3` → `no-router`: no collision domain changed; the one broadcast domain changed.
`primjer-3b` → `vlans`: no collision domain changed; broadcast A (VLAN 10) and B (VLAN 20) changed, C (network 2) not.

## Page

- Stage: the scene as a drawing (devices in fixed places, links behind), each collision domain as a coloured,
  numbered, hatched outline around its links and the hosts and hubs it contains, stopping at switch and router ports;
  each broadcast domain as a large shaded region behind, lettered A, B, …, stopping at router interfaces. Counters at
  the top: collision domains (with the per-network split in the two-network scene) and broadcast domains, each with
  the count before the last change when that count changed. Clicking a device in a slot swaps it.
- Params: `layout` (two networks / office), `net1Core` hub / switch, `net2Edge` hub / switch, `router` router /
  switch, `vlans` toggle. `net2Edge`, `router`, `vlans` hidden in the office; `vlans` disabled with a reason when the
  tie-break above switches it off.
- Legend: collision domain (numbered outline), broadcast domain (lettered region), hub (round), switch (rectangle),
  router (circle with arrows), trunk (double line), changed.
- Caption: what the last swap did to each count (`captionKey`), or the counts and why when there is no "before".
- Not modelled (task "Out of scope"): CSMA/CD itself, loops and broadcast storms, MAC learning, Wi-Fi.
