<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# domains: notes

New explorer (task `docs/tasks/w3/domains.md`, catalogue `net-domains`). Rules, tie-breaks and numbers: `SPEC.md`.

## Decisions

- **A `layout` param (two networks / office) was added.** The task's params (`net1Core`, `net2Edge`, `router`,
  `vlans`) cannot reach its own preset `office-hub` (ten computers on one hub, no router). The office reuses `net1Core`
  for its one device, so swapping hub ↔ switch there is the same control; `net2Edge`, `router` and `vlans` are hidden
  in the office. The task's `hosts: {net1, net2a, net2b}` are fixed by the layout (4, 3, 2, or 10), not params.
- **VLANs apply only with a switch in network 1 and a router in the middle** (SPEC tie-break). A hub has no VLANs, and
  the task's rule 5 makes the router link a trunk with one subinterface per VLAN, which needs the router. Otherwise the
  toggle is disabled with the reason in its hint, and the model ignores it (the value stays in the URL).
- **The router connects to the second switch, not to the hub**: Primjer 3's text, and the only wiring that gives its 4
  collision domains in network 2.
- **"Before" and "changed"** follow `delay-components`: a preset carries its own "before" (`primjer-3b`, `no-router`
  compare with `primjer-3`, `vlans` with `primjer-3b`), a hand swap compares with the params just before it. A domain
  is changed when no domain before had exactly its members: its tube turns highlighter yellow with a thick ink outline,
  its number badge too; a changed broadcast region gets an ink outline and a yellow letter; a counter whose number moved
  is yellow and says "prije: n". So the class sees at once that 3 (b) changed four collision domains and no broadcast
  domain, and `no-router` the reverse.
- **Captions** come from `captionKey` (language-neutral: what was swapped, which count moved, in which network). The
  Croatian captions write *collision domain* (kolizijska domena) in full each time, as the task's own caption does,
  since a caption is read on its own; *broadcast* stays in italics inside "*broadcast* domena", as in the book.
- **Swapping by clicking the device**: the label over each slot device is a button (⇄) that swaps it; the params do the
  same. The fixed second switch has a plain label.
- **Preset hints describe the setup, not the counts**, so the class can predict before looking at the counters.
- **Drawing (own, not K2).** Kit view K2 places cards in a grid and draws links, but has nothing to outline a group of
  links and devices, which is the whole picture here. The page draws its own: SVG shapes in a fixed 1600 × 600 viewBox
  (no text in the SVG) and every label in HTML placed over it in % of the same box, so text stays at its rem size.
  Collision domains are tubes along their links (outline, base, hatch: the union of a domain's links and devices gets
  one outline), stopping just outside a switch or router port, taking in hosts and hubs. Broadcast regions are wider
  tubes behind them, taking in switches and hubs, stopping short of the router. Where VLANs share a switch and a trunk,
  the later VLAN's region is narrower, so both stay visible around S1 and the trunk.
- **Reuse from `mac-table`:** the task asked for its device and link drawing. Its devices are HTML boxes in a
  three-column grid with no geometry to hang outlines on, so no code was reused; the look follows it (switch as a
  rectangle with port marks along its edge, hosts as small boxes). The domain walk is new, as the task says.
- **Colour is never alone:** collision domains have numbers (and a hatch whose angle changes every five domains, colours
  c1–c5 cycling); broadcast domains have letters (colours c6–c8, plain tint, VLAN named on the letter badge); devices
  have shapes (host box, hub circle with a dot, switch rectangle, router circle with two arrows) and their kind written
  above them; the trunk is a double line labelled "trunk (10, 20)"; hosts show their VLAN number.
- **Phone:** the drawing keeps a readable width (62rem) and scrolls sideways inside its own box; the page itself does not.
- Rule 7 (full duplex) is in the explanation and in the office caption whenever the office device is a switch.
- The walks (`collisionDomains`, `broadcastDomains`, `changedDomains`) are pure over a plain scene and hold no strings:
  ready for `models/` if `net-vlan-trunk` or `net-intervlan-routing` want them.

## Sources

- URM book ch. 7 (`uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`): "Ethernet u preklopljenoj mreži: kako
  preklopnik radi iznutra" (collision and broadcast domain, footnotes kr-collision, kr-broadcastdomain,
  algebra-broadcastdomain; CSMA/CD only in half duplex; the ten-computer office paragraph), "VLAN-ovi: jedna žica, više
  logičkih mreža", Primjer 3 and (b), Primjer 4. Every number in `sim.test.js` is checked against them or derived by
  the rules (SPEC "Expected numbers").
- `uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 3 "Preklopnik".
- `sims/mac-table/` (look of the devices), `sims/delay-components/` (the "before" pattern for an explorer).

## Unchecked *(check)*

- `no-router` (9 collision, 1 broadcast) and `vlans` (12 collision, 3 broadcast) are derived by the rules; the book does
  not count these two cases.
- A real projector, and a lecturer clicking the device labels.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| collision domain | kolizijska domena |
| broadcast domain | *broadcast* domena |
| collision | kolizija |
| hub | koncentrator |
| switch | preklopnik |
| router | usmjernik |
| port (of a switch) | priključak |
| VLAN | VLAN (virtualna lokalna mreža) |
| trunk | *trunk* (priključak) |
| subinterface | podsučelje |
| full duplex / half duplex | puni dupleks / poludupleks |

## Shared requests

- **kit, defect:** a param's `visible()` hides nothing: `kit.js` sets `hidden` on the control's `.sd-ctl` wrapper, but
  `kit.css` gives `.sd-ctl` `display: flex`, which beats the `hidden` attribute. Smallest change: add
  `.sd-ctl[hidden] { display: none; }` to `kit.css`. Worked around here with the same rule scoped to this page.
  `arp-local-remote` (`dst`) and `amdahl` (`profile`) declare `visible` too and are affected.
- **kit, K2:** groups drawn around nodes and links (collision and broadcast domains, VLANs, subnets, failure domains):
  e.g. `groups: [{ id, nodes, links, label, c, pattern, kind: 'outline' | 'region' }]`, an outline or a shaded region
  following the links, stopping at named ports. This page's tube technique (outline pass, base pass, fill pass per
  group, segments cut short at excluded devices) is a starting point.
- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **models/:** promote `collisionDomains`, `broadcastDomains`, `changedDomains` when a VLAN sim reuses them.

## Review

A fresh reviewer (a separate agent with no part in writing it) read the code against `SPEC.md` and the book, ran the
model over all 32 × 32 param pairs and 55 mutations of `sim.js`, and loaded every preset in both languages. No wrong
number or rule. Eleven mutations survived with a real effect (the "before" counts in `compare`, the presets' own
"before", `why` from the raw toggle, "VLANs off", a change in both networks, the order of the VLAN reasons); tests were
added for each, and all eleven now fail. Two wordings were fixed from the same review: a change in both networks now
says "cijela slika" / "the whole drawing", and the office switch caption no longer says "i dalje" before any change.
The surviving equivalent mutations hold in every scene here (e.g. the network of a domain's last link).

## Time

Start 2026-10-25 13:50, done 14:20 (about 30 minutes, one session).
