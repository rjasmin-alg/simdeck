# intervlan-routing: Inter-VLAN routing

| | |
|---|---|
| Task | `intervlan-routing` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-intervlan-routing` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/intervlan-routing/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `vlan` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **router on a stick vs L3 switch SVIs**.

The student: send a frame VLAN 10 → 20, follow the tag.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/vlan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Šire o temi" → "VLAN-ovi: jedna žica, više logičkih mreža" (802.1Q tag, router-on-a-stick, native VLAN), Primjer 6 (usmjernik na štapu — što ako je preklopnik krivo postavljen); diagrams `ch07-8021q-oznaka.svg`, `ch07-vlan-trunk.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/12-izgradnja-mreze.md`: "Od adresne sheme do fizičkog rasporeda" (Grafo d.o.o. table), "Konfiguracija mrežnog sučelja" (`encapsulation dot1q`), Primjer 1 (puna konfiguracija, host addresses); diagram `ch12-topologija-grafo-doo.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vlan.html` (vocabulary, VLAN colours)
- IEEE 802.1Q (tag format); RFC 1812 §5.3.1 (TTL decrement); Cisco "Configuring Inter-VLAN Routing" / "Configuring SVIs" for the L3-switch mode (check)
- Catalogue seed: URM ch07/11 (the book's actual worked material is ch07 + ch12, not ch11)

## Model and presets

- **Scene:** Grafo d.o.o. head office (URM ch12): host P1 (Prodaja, VLAN 10, 192.168.1.2/26, gateway
  192.168.1.1) on SW1 `Fa0/1`, host Q1 (Proizvodnja, VLAN 20, 192.168.1.66/27, gateway 192.168.1.65) on SW1
  `Fa0/2`, optional P2 (Prodaja, 192.168.1.3/26) on `Fa0/3`. Mode `roas`: SW1 `Gi0/1` trunk to R1 `Gi0/0` with
  subinterfaces `Gi0/0.10` (192.168.1.1) and `Gi0/0.20` (192.168.1.65). Mode `l3`: no R1 on the stage; SW1 is an
  L3 switch with SVIs `interface vlan 10` / `vlan 20` holding the same gateway addresses. Kit view K2 when it
  exists. Under the topology: the frame on the wire as a field strip (dst MAC, src MAC, 802.1Q tag or none,
  IP src/dst, TTL) and a per-link counter of how many times the frame crossed it.
- **State:** `{ mode, at: nodeId, frame: { dstMac, srcMac, vid|null, srcIp, dstIp, ttl }, hops: [{ link, vid }],
  linkUses: { linkId: n }, outcome: null|'delivered'|'dropped', dropReason, events: [code] }`.
- **One step:** the frame moves across one device or one link. Phases inside a step: (1) ingress at the device
  (assign or read the VLAN), (2) the device's decision (switch: MAC table in that VLAN; router/SVI: routing
  table), (3) egress rewrite (tag/untag, new MACs, TTL), (4) put on the outgoing link. ARP is assumed already
  resolved (caption says so; ARP is `arp-local-remote`).
- **Rules:**
  1. The sending host ANDs its mask: 192.168.1.66 is outside 192.168.1.0/26, so the frame goes to the gateway's
     MAC; a same-subnet destination (P2) is sent directly and never reaches the router (ch08 local/remote; ch12
     Primjer 1 addresses).
  2. Hosts send and receive untagged frames; an access port assigns its VLAN on ingress and strips the tag on
     egress (ch07 "VLAN-ovi: jedna žica, više logičkih mreža").
  3. A switch forwards only within the frame's VLAN; it looks the dst MAC up in that VLAN's MAC table (ch07; ch12
     "Šire o temi" `show mac address-table`: R1's MAC is learned on the trunk in every VLAN).
  4. Trunk egress inserts the 802.1Q tag (TPID 0x8100, VID 12 bits) after the source MAC; the frame grows by 4
     bytes (1518 → 1522) (ch07, figure ch07-8021q-oznaka; IEEE 802.1Q).
  5. R1 maps the tag's VID to the subinterface whose `encapsulation dot1q <VID>` matches; no match → frame
     dropped. The subinterface number (`.10`) is only a label; the VID decides (ch12 "Konfiguracija mrežnog
     sučelja").
  6. Routing: R1 (or the SVI) strips the L2 header, decrements TTL by 1 (64 → 63), looks up 192.168.1.64/27
     (connected on `.20` / `vlan 20`), and builds a new frame: src MAC = router, dst MAC = Q1, VID 20 (ch11 per-hop
     rewrite; RFC 1812 §5.3.1 TTL).
  7. Router on a stick sends the frame back over the same trunk: the link counter for `Gi0/1–Gi0/0` reaches 2 per
     in total, i.e. inter-VLAN traffic crosses the trunk twice (ch12 "Šire o temi": one link instead of four
     physical interfaces is the trade-off).
  8. L3 switch: the frame to the SVI's MAC is routed inside SW1; no tag ever appears on a wire, and no trunk is
     used (derived, unchecked against a vendor doc: Cisco "Configuring SVIs" (check)).
  9. Switch port toward R1 left in access mode (ch07 Primjer 6): R1 receives untagged frames, which match no
     `dot1q` subinterface (no native subinterface configured) → dropped; the reverse direction never starts.
  10. Edge case: all subinterfaces of R1 share one physical MAC; the model shows one MAC for R1 (Cisco behaviour,
      (check)).
- **Params:** `mode` choice `roas` | `l3` (default `roas`); `dst` choice `q1` | `p2` (default `q1`); `fault`
  choice `none` | `access-port` | `vid-mismatch` (default `none`; only in `roas`; `visible` hides it in `l3`).
- **Presets:**
  1. `roas` — P1 → Q1 through R1: tag 10 on the way in, tag 20 on the way out, TTL 64 → 63, trunk crossed twice,
     delivered in 8 steps. From URM ch12 Primjer 1 (addresses) + ch07 router-on-a-stick text.
  2. `l3-svi` — same pair through SW1's SVIs: no tag on any wire, TTL 64 → 63, delivered in 5 steps. Derived,
     unchecked.
  3. `same-vlan` — P1 → P2 (192.168.1.3): rule 1 sends it directly; SW1 forwards in VLAN 10; R1 never sees it;
     4 steps. Derived from ch08 local/remote.
  4. `access-port` — SW1 `Gi0/1` left as access VLAN 10: the untagged frame reaches R1 and is dropped at rule 9
     (step 4). From URM ch07 Primjer 6.
  5. `vid-mismatch` — R1 `Gi0/0.20` configured `encapsulation dot1q 21`: R1 routes, tags VID 21; SW1 has no VLAN 21
     on the trunk → dropped at SW1 ingress (step 6). Derived from ch12 "broj iza dot1q mora se poklapati".
- **Steps:** 8, 5, 4, 4, 6 (`steps` is a function of params).
- **Legend:** VLAN 10 (series colour 1 + solid edge), VLAN 20 (colour 2 + hatched), untagged frame (hollow box),
  tagged frame (box with a tag flag "VID n"), dropped (danger + ✕); "changed" highlights the fields rewritten in
  this step (tag added/removed, MACs, TTL) and the link counter that changed.
- **Captions:**
  - hr: "Korak 3: SW1 šalje okvir na *trunk* priključak Gi0/1 i umeće 802.1Q oznaku VID 10 — okvir naraste s 1518
    na 1522 okteta."
  - en: "Step 5: R1 routes the packet out of Gi0/0.20: new MAC addresses, TTL 64 → 63, tag VID 20 — back over the
    same trunk it came in on."
- **Terms:** router on a stick — usmjernik na štapu; subinterface — podsučelje; trunk port — *trunk* priključak;
  access port — pristupni priključak; tag — oznaka; VLAN identifier (VID) — VLAN identifikator; default gateway —
  zadani pristupnik; switched virtual interface (SVI) — virtualno sučelje VLAN-a (check: the book has no term).
- **Misconceptions:** VLANs talk to each other through the switch by themselves (they need an L3 device); the
  router "passes the tag through" (it removes VID 10 and adds VID 20); the subinterface number, not the
  `dot1q` VID, picks the VLAN.
- **Out of scope:** ARP resolution, inter-VLAN ACLs/firewall (ch18), native VLAN details (`vlan-trunk`), DHCP
  relay, trunk bandwidth contention.
- **Builds on `vlan`:** reuses its port model (access/trunk, VID per port, tagging rules 2–4) and VLAN colours;
  new are the router/SVI node, the routing step and the per-hop rewrite (copy from `hop-rewrite` if merged).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `intervlan-routing` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh intervlan-routing sims/intervlan-routing` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/intervlan-routing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
