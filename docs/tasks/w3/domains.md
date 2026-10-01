# domains: Collision and broadcast domains

| | |
|---|---|
| Task | `domains` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-domains` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/domains/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `switching` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `mac-table` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **hubs, switches and routers split different domains**.

The student: place devices, see the domains coloured.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/mac-table/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra" (collision and broadcast domain, footnotes kr-collision, kr-broadcastdomain, algebra-broadcastdomain; the ten-computer office paragraph), "VLAN-ovi: jedna žica, više logičkih mreža", Primjer 3 "brojanje kolizijskih i broadcast domena" (9 and 2; (b) 12 and 2), Primjer 4 (CSMA/CD only on half duplex)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", page 3 "Preklopnik" (kolizijska i broadcast domena, CSMA/CD)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-mac-adresa.html` (the book's switch page, for style)
- Catalogue seed: URM card ch07

## Model and presets

- **Scene:** the two-network topology of URM ch07 Primjer 3, drawn with fixed device slots: network 1 (a
  switch with four computers), the router in the middle, network 2 (a slot "X" with three computers, linked
  to a second switch with two computers). Each slot holds a device the student can swap. Every **collision
  domain** is drawn as a coloured, numbered outline around the links and devices it contains (number +
  pattern, not colour alone); every **broadcast domain** as a large shaded region behind them, lettered
  A, B…. Two counters at the top: collision domains, broadcast domains.
- **State (explorer):** `{ slots: {net1Core, router, net2Edge}, vlans: bool, hosts: {net1, net2a, net2b} }`
  → derived `{ collision: [[members]], broadcast: [[members]] }` by a small graph walk.
- **What the params drive live:** swapping a device re-runs the walk; outlines and counters redraw; the
  domains that changed get the highlight.
- **Rules:**
  1. A hub repeats the signal to all its ports, so everything attached to it, and the far end of each of its
     links, is one collision domain (URM `07-podatkovni-sloj.md` "Ethernet u preklopljenoj mreži", footnote
     kr-collision).
  2. Each switch port is its own collision domain; it includes whatever shares the medium on the far side of
     that link (a whole hub), but nothing on the switch's other ports (same section; Primjer 3).
  3. Each router interface is its own collision domain too (Primjer 3: "veza prema usmjerniku je … zasebna
     kolizijska domena").
  4. Hubs and switches pass broadcasts; only a router stops them, so each router interface bounds one
     broadcast domain (same section, footnotes algebra-broadcastdomain, kr-broadcastdomain).
  5. VLANs split one switch into several broadcast domains; frames between VLANs need an L3 device (ch07
     "VLAN-ovi: jedna žica, više logičkih mreža"). With `vlans` on, network 1's switch puts two computers in
     VLAN 10 and two in VLAN 20 and the router link becomes a trunk with one subinterface per VLAN.
  6. Collision and broadcast domains are counted independently; swapping a hub for a switch changes only the
     first (ch07, the ten-computer office paragraph; Primjer 3 (b)).
  7. Edge: a full-duplex switch port is still counted as a collision domain even though no collision can
     happen there (ch07 CSMA/CD paragraph and Primjer 4); the explanation says so.
- **Params:** `net1Core` choice hub / switch (default switch); `net2Edge` choice hub / switch (default
  hub); `router` choice router / switch (default router); `vlans` toggle (default off).
- **Presets:**
  1. `primjer-3` — ch07 Primjer 3: network 1 has 5 collision domains, network 2 has 4 (hub with its three
     computers and the link to switch 2 = 1, two computers = 2, router link = 1); total 9 collision, 2
     broadcast. From URM ch07 Primjer 3.
  2. `primjer-3b` — the hub replaced by a switch: network 2 has 3 + 1 + 2 + 1 = 7, total 12 collision; still
     2 broadcast. From URM ch07 Primjer 3 (b).
  3. `office-hub` — ten computers on one hub: 1 collision, 1 broadcast; swap to a switch: 10 collision,
     1 broadcast. From ch07 (ten-computer office paragraph).
  4. `no-router` — Primjer 3 with the router replaced by a switch: collision count stays 9 (the two router
     links become two switch-port links), broadcast drops to 1. Derived, unchecked.
  5. `vlans` — Primjer 3 (b) with VLANs on in network 1: network 1 splits into VLAN 10 and VLAN 20, so 3
     broadcast domains; collision count stays 12. Derived, unchecked.
- **Steps:** none (explorer).
- **Legend:** collision domain (numbered outline, pattern per number), broadcast domain (lettered shaded
  region), hub (round), switch (square), router (circle with arrows), trunk link (double line); "changed"
  marks domains that appeared, merged or split on the last swap.
- **Captions:**
  - hr: "Koncentrator zamijenjen preklopnikom: druga mreža sada ima 7 *collision domain* (kolizijskih domena)
    umjesto 4, a *broadcast* domena i dalje su 2."
  - en: "Replacing the router with a switch merges the two broadcast domains into one; the collision count
    stays 9."
- **Terms:** collision domain — kolizijska domena; broadcast domain — *broadcast* domena; hub —
  koncentrator; switch — preklopnik; router — usmjernik; port — priključak; collision — kolizija; VLAN —
  VLAN (virtualna lokalna mreža).
- **Misconceptions:** a switch splits broadcast domains; the two counts rise and fall together; a switch
  port linked to a hub isolates the hub's computers from each other.
- **Out of scope:** CSMA/CD itself (`csma-cd`), broadcast storms and loops (`stp`, `broadcast-storm`), MAC
  learning (`mac-table`, reused only for drawing), Wi-Fi as a shared medium.
- **Reuse:** from `mac-table` reuse the device and link drawing; the domain walk is new.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh domains sims/domains` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/domains/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
