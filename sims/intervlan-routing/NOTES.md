<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# intervlan-routing: notes

New stepper (task `docs/tasks/w3/intervlan-routing.md`, catalogue `net-intervlan-routing`, §4.1, wave 3) on kit view
K2 (`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage, top to bottom.** The field strip ("Okvir na vezi …" / "Okvir u SW1, VLAN 10"): dst MAC, src MAC, 802.1Q
  tag, IP source, IP destination, TTL, size. Under it the K2 drawing (R1 above SW1, the three hosts below) beside a
  column: P1's mask decision, SW1's MAC table, R1's subinterfaces (or SW1's SVIs), crossings per link.
- **Changed fields** are highlighted (`--hl`, thick ink border) with the old value struck beside the label; the
  comparison is with the frame of the previous step (`changed` in the model). The link counter that went up is
  highlighted the same way.
- **The tag** is a flag in the VLAN's colour ("VID 10" solid c1, "VID 20" c2 hatched, VID 21 c8) or a hollow dashed
  "nema / none" box. VLAN 20 is hatched everywhere (host mark, chip, flag, table bar), so VLAN 10 and 20 differ in
  grayscale too; every one also says "VLAN 10/20" or "VID n" in text.
- **Tables.** The MAC table rows carry their VLAN as a coloured first cell; during a lookup the rows of the other
  VLAN are muted and the hit row is outlined and highlighted. R1's table marks the ingress match (step 4) and the
  route egress (step 5) and prints the route `192.168.1.66 → 192.168.1.64/27`. A wrong dot1q VID (21 on
  `Gi0/0.20`) is underlined with a wavy danger line. Drops add a dashed note: "bez oznake → nijedno podsučelje ✕",
  "VID 21 → SW1 nema VLAN 21 ✕".
- **Port labels.** Access ports (`Fa0/1`, `Fa0/5`, `Fa0/2`) are K2 end labels at SW1; the trunk has none (its labels
  collided with the packet chip in the short gap between R1 and SW1). Instead SW1's card says "Gi0/1 prema R1:
  trunk" (or "pristupni, VLAN 10" under the fault) and R1's card "Gi0/0 · MAC …:01".
- **MACs** are `02:00:00:00:00:xx` shown as `…:xx` with the owner (P1, R1, SW1) beside them.
- **Frame size**: a full-size frame (1500-byte packet), 1518 bytes untagged, 1522 tagged, so the task's "1518 →
  1522" is literally the frame's size, not only the maximum.
- **Params** `mode`, `dst`, `fault` all reset to step 0 (they change the path and the step count). `fault` is hidden
  in `l3` (`visible`), and the model ignores it there.
- **ARP is assumed resolved** (caption at step 0). With a fault, the tables are those learnt while the network
  worked, except that R1 is not in SW1's VLAN 20 (its VLAN 20 frames never reach SW1). Strictly, with the
  access-port fault P1's ARP for 192.168.1.1 would fail too; the preset shows the data frame's fate, as Primjer 6
  asks.
- **Model reuse.** `models/` has no VLAN model yet, so `parseLink`, `carries`, `tagOnLink`, `arrivalVlan` are copied
  from `sims/vlan/sim.js @ 14623bd` (COMMON §6) with their rules re-tested here. The rest (`hostDecision`,
  `switchIngress`, `macLookup`, `switchEgress`, `subifFor`, `routeLookup`, `rewrite`) are pure functions over plain
  data with no strings, ready for `models/`. `hop-rewrite`'s per-hop rewrite (checksums, FCS) was not copied: this
  sim needs only new MACs and TTL − 1.
- **No `encapsulation dot1q` command line on the page**: the tables say "dot1q VID", and the explanation says the
  number in the dot1q line decides the VLAN. Interface names (`Gi0/0.20`, `Fa0/1`) are the book's scene. "Cisco" is
  named only in Sources.

## Deviations from the task

- **P2 on `Fa0/5`, not `Fa0/3`**: in the book (ch12 table, Primjer 1) `Fa0/3` is VLAN 30, Uprava.
- **Trunk wording**: captions write *trunk* plainly (no italics) because captions are plain text, as
  `vlan` does; the explanation uses italics.
- **K2 used directly** (it exists since kit 0.3.0); nothing drawn by hand.

## Sources

- URM `book/chapters/07-podatkovni-sloj.md`: "VLAN-ovi: jedna žica, više logičkih mreža" (access port never tags;
  trunk inserts the tag after the source address, 1518 → 1522, TPID 0x8100, VID 12 bits; router on a stick with
  one subinterface per VLAN; native VLAN), Primjer 6 (switch side left as access); figures `ch07-8021q-oznaka.svg`,
  `ch07-vlan-trunk.svg`.
- URM `book/chapters/12-izgradnja-mreze.md`: "Od adresne sheme do fizičkog rasporeda" (the Grafo d.o.o. table:
  SW1 `Fa0/1`–`Fa0/4`, trunk `Gi0/1`, R1 subinterfaces 192.168.1.1/26 and 192.168.1.65/27), "Konfiguracija mrežnog
  sučelja" ("Broj iza dot1q mora se poklapati s VLAN ID-em … sam broj podsučelja … samo pomaže"), "Šire o temi"
  (R1's MAC learnt on the trunk in every VLAN), Primjer 1 (hosts 192.168.1.2 and 192.168.1.66 with their gateways).
- IEEE 802.1Q (tag format, 1522-byte maximum); RFC 1812 §5.3.1 (TTL decrement).
- Cisco "Configuring SVIs" / "Configuring Inter-VLAN Routing": rule 8 (SVIs route inside the switch) and rule 10
  (one MAC for all subinterfaces, one for the SVIs) are *(check)*: not verified offline.
- Every number in SPEC.md is the model's output (run over every preset on 2026-10-27) and was checked by hand
  against the book: /26 and /27 networks, AND results, 1518/1522, TTL 64 → 63.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| router on a stick | usmjernik na štapu |
| subinterface | podsučelje |
| trunk port | *trunk* priključak |
| access port | pristupni priključak |
| tag / 802.1Q tag | oznaka / 802.1Q oznaka |
| VLAN identifier (VID) | VLAN identifikator (VID) |
| default gateway | zadani pristupnik |
| switched virtual interface (SVI) | virtualno sučelje VLAN-a *(check: the book has no term)* |
| L3 switch | L3 preklopnik |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"` (overlaps `vlan`'s request).
- **kit:** `.sd-ctl[hidden]` should hide a control whose `visible()` is false; the page works around it with
  `[data-sim] .sd-ctl[hidden] { display: none; }` (same request as `amdahl`).
- **kit (optional):** `t.parts` with a placeholder used twice (the page's `parts()` clones; same as `mac-table`,
  `vlan`, `hop-rewrite`).
- **kit (optional), K2:** link end labels and a packet chip collide on a short link (under ~8rem); an option to
  place end labels beside the link, or a chip `at` that avoids them.
- **models/:** promote the VLAN port model (`parseLink`, `carries`, `tagOnLink`, `arrivalVlan`, from `vlan`) and this
  sim's `switchIngress`, `switchEgress`, `macLookup`, `subifFor`, `routeLookup` when `vlan-trunk` or another VLAN
  sim starts; then point this sim at it.

## Checks

- `npm run gate -- intervlan-routing`: pass (61/61 browser checks), screenshots at 1920×1080 light, dark, grayscale,
  and 375×812, both languages, reviewed; plus extra screenshots of every preset's key step (roas 3, 5, 8;
  access-port 4; vid-mismatch 6; l3-svi 3; same-vlan 3; dark English).
- **Fresh review** (a separate agent, 2026-10-27): read SPEC.md against `sim.js` and the task, then broke every rule
  and tie-break once in `sim.js` (25 mutations). It found no disagreement; two mutations went uncaught (P1 given the
  target's /27; a host accepting a tagged frame). Tests were added for both and seen failing once. Its points about
  ARP under the faults and the FCS in the size are now in SPEC.md.
- Not checked: a real projector and clicker; the Cisco *(check)* items above.

## Time

Start 2026-10-27 10:29, done 10:46 (one session).
