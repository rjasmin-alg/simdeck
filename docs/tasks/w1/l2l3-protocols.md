# l2l3-protocols: L2/L3 protocol deep dive (en)

| | |
|---|---|
| Task | `l2l3-protocols` (wave 1, single-page-labs) |
| Catalogue entry | `spl-l2l3-protocols` in `docs/catalogue.md` §2.1 |
| Kind | adopt an existing simulator |
| Folder | `sims/l2l3-protocols/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | see catalogue |
| Topic / tags / level | `networks` / `encapsulation` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/l2l3-protocols/`: **Ethernet, VLAN/QinQ, IPv4/6, VXLAN/GENEVE, GRE/MPLS/IPsec, MACsec, PMTUD**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.1.

## Sources

- `/home/rjasmin/projects/single-page-labs/l2l3-protocols.html` (the original)

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Steps

1. Copy the page: `cp /home/rjasmin/projects/single-page-labs/l2l3-protocols.html sims/l2l3-protocols/index.html`. Set `origin` to `single-page-labs/l2l3-protocols.html`.
2. Classify it as `the right class` and write `sims/l2l3-protocols/sim.json` (all required fields, `status: "wip"`).
3. Adapt it to the kit (`docs/sim-ui.md`): kit tokens instead of the page's own palette, the kit header with
   back link and legend, the kit transport for its class, kit fonts instead of Google Fonts. Keep the page's
   model and wording; where it is a stepper, move the step logic into a DOM-free `sim.js` with `sim.test.js`.
4. Make it bilingual (COMMON.md §4). Today it is in English; write the other language.
5. Remove every network load (fonts, CDN scripts): vendor or drop them. The build refuses network loads.
6. Record exceptions in the page's `#simdeck-exceptions` block instead of working around a rule silently.
7. Run the checks (COMMON.md §7) and look at the screenshots.

## Known state and issues

- State: polished, 102 KB, mostly reading
- Licence and assets: own; Google Fonts; cites RFCs

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/l2l3-protocols/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
