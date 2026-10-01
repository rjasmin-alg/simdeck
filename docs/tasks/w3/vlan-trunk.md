# vlan-trunk: Access and trunk ports, native VLAN

| | |
|---|---|
| Task | `vlan-trunk` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-vlan-trunk` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/vlan-trunk/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `vlan` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `vlan` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **802.1Q tags added and removed at trunk edges**.

The student: send frames across two switches.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/vlan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Šire o temi" → "VLAN-ovi: jedna žica, više logičkih mreža" (access/trunk, 802.1Q fields, 1518 → 1522, VID 1–4094, nativni VLAN), Primjer 5 (kad VLAN-ovi trebaju *trunk*, a kad ne); diagrams `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch07-vlan-trunk.svg`, `ch07-8021q-oznaka.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/12-izgradnja-mreze.md`: "Konfiguracija mrežnog sučelja" (`switchport mode trunk`, `encapsulation dot1q`), "Provjera povezanosti" (VLAN not in the allowed list)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vlan.html` (the page this extends: Ra1/Pr1/Ra2/Pr2, VLAN 10 računovodstvo / 20 prodaja)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T06 (VLAN-ovi, mostovi i udruživanje sučelja; chapter not written yet)
- IEEE 802.1Q (tag format, PVID, native/untagged VLAN); Cisco "Configuring VLAN Trunks" for native-VLAN mismatch and tagged-on-access behaviour (check)
- Catalogue seed: extends urm-vlan

## Model and presets

- **Scene:** two switches SW1 and SW2 joined by one link `Gi0/1–Gi0/1` (the trunk). SW1: Ra1 (računovodstvo,
  VLAN 10) on `Fa0/1`, Pr1 (prodaja, VLAN 20) on `Fa0/2`; SW2: Ra2 (VLAN 10) on `Fa0/1`, Pr2 (VLAN 20) on `Fa0/2`
  (names and VLANs from URM ch07 Primjer 5 and `ugradbeno/vlan.html`). Optional host M1/M2 in VLAN 1 (the
  default/native VLAN) on `Fa0/3`. Kit view K2 when it exists. Beside each link: the frame as a field strip
  (dst MAC, src MAC, [TPID 0x8100 | PCP | DEI | VID], type, length in bytes). Per-port config table under each
  switch (mode, access VLAN or allowed list + native VLAN).
- **State:** `{ ports: { 'SW1:Gi0/1': { mode: 'trunk'|'access', vlan, allowed: [vid], native } , … },
  frames: [{ id, srcHost, dst: host|'broadcast', at, vid, tagged, len }], delivered: [{ frame, host }],
  dropped: [{ frame, where, reason }], events: [code] }`.
- **One step:** every frame in flight advances one hop. Phases: (1) ingress classification (which VLAN),
  (2) forwarding decision inside that VLAN (unicast to the known port, broadcast/unknown flooded to all ports of
  that VLAN except the ingress port), (3) egress encoding per port (tag, untag, or drop), (4) onto the link.
  MAC tables are pre-learned for unicast (learning is `mac-table`'s concept).
- **Rules:**
  1. Hosts send untagged frames and never see a tag (ch07 "pristupni priključak"; Primjer 5c).
  2. Access port ingress: the frame belongs to the port's VLAN. Access port egress: only frames of that VLAN
     leave, untagged (ch07 VLAN section).
  3. Trunk egress: a frame of VLAN v is tagged with VID v, unless v is the trunk's native VLAN, which leaves
     untagged (ch07 "nativni VLAN"; IEEE 802.1Q).
  4. Trunk ingress: a tagged frame belongs to its VID; an untagged frame belongs to the receiving port's native
     VLAN (IEEE 802.1Q PVID; ch07 "nativni VLAN").
  5. Allowed list: a frame whose VLAN is not in the trunk's allowed list is not sent (egress) / is dropped
     (ingress). Default: all VLANs allowed (ch12 "Provjera povezanosti", list item "VLAN koji nije propušten kroz
     *trunk*").
  6. Tag size: the tag is 4 bytes inserted after the source MAC; a 1518-byte frame becomes 1522 on the trunk and
     is 1518 again after the tag is removed (ch07, figure ch07-8021q-oznaka). VID range 1–4094 (0 and 4095
     reserved) (ch07).
  7. Broadcast stays in its VLAN: a broadcast from Pr1 reaches Pr2 and no VLAN 10 host (ch07: each VLAN its own
     broadcast domain).
  8. Inter-switch link set to access VLAN 10 (ch07 Primjer 5b): VLAN 10 crosses untagged; VLAN 20 frames find no
     egress port toward SW2 and stop at SW1.
  9. Native VLAN mismatch (SW1 native 1, SW2 native 99): an untagged frame from VLAN 1 on SW1 is classified as
     VLAN 99 on SW2 by rule 4: the frame leaks into the other VLAN; no tag records the error. Cisco reports
     it via CDP "Native VLAN mismatch" (derived from rules 3–4; vendor message (check)).
  10. Edge: a tagged frame arriving on an access port is dropped (Cisco default) (check).
- **Params:** `link` choice `trunk` | `access-10` | `access-20` (default `trunk`); `native1` range 1–99 step 1
  default 1 (SW1 trunk native); `native2` same for SW2; `allow20` toggle default on (VLAN 20 in both allowed
  lists); `send` choice `ra1-ra2` | `pr1-pr2` | `pr1-bcast` | `m1-m2` | `both` (default `both`).
- **Presets:**
  1. `trunk` — Ra1 → Ra2 and Pr1 → Pr2 together: both tagged on the trunk (VID 10, VID 20, 1522 bytes), both
     delivered untagged; 5 steps. From URM ch07 Primjer 5a.
  2. `access-link` — the link is access VLAN 10: Ra1 → Ra2 delivered (untagged on the link), Pr1 → Pr2 stops at
     SW1 (rule 8); 5 steps. From URM ch07 Primjer 5b.
  3. `broadcast` — Pr1 sends a broadcast: on SW1 it goes to the trunk only (no other VLAN 20 port there), tagged
     VID 20; on SW2 only to Pr2; Ra1/Ra2 never see it; 5 steps. Derived from ch07 broadcast domain.
  4. `native` — M1 → M2 in VLAN 1 (native on both ends): crosses the trunk untagged (1518 bytes) while a VLAN 10
     frame next to it is tagged; 5 steps. From URM ch07 "nativni VLAN".
  5. `native-mismatch` — `native2 = 99`, host M2 in VLAN 99: M1's VLAN 1 frame arrives untagged and is delivered
     to the VLAN 99 host on SW2 (rule 9); 5 steps. Derived, unchecked.
  6. `not-allowed` — `allow20` off: Pr1 → Pr2 dropped at the SW1 trunk egress, Ra1 → Ra2 fine; 5 steps. From
     URM ch12 "Provjera povezanosti" (third check passes inside the VLAN, fails across the trunk).
- **Steps:** 5 each (host → SW1 ingress → SW1 trunk egress → SW2 ingress → SW2 access egress / host).
- **Legend:** VLAN 10 (colour 1, solid), VLAN 20 (colour 2, hatched), VLAN 1/99 (colour 3, dotted); tagged
  frame = box with a "VID n" flag, untagged = plain box; dropped = danger ✕ with reason. "Changed" marks the tag
  being added or removed and the byte count that changed.
- **Captions:**
  - hr: "Korak 3: SW1 šalje Pr1-ov okvir na *trunk* i umeće oznaku VID 20 — 1518 → 1522 okteta. Ra-ov okvir dobiva
    VID 10 na istoj žici."
  - en: "Step 4: SW2 receives an untagged frame on the trunk, so it puts it in its native VLAN 99 — the frame from
    SW1's VLAN 1 has leaked into another VLAN."
- **Terms:** access port — pristupni priključak; trunk port — *trunk* priključak (tagirano sučelje); tag —
  oznaka; tagging — označavanje; VLAN identifier (VID) — VLAN identifikator; native VLAN — nativni VLAN;
  broadcast domain — *broadcast* domena; allowed VLAN list — popis dopuštenih VLAN-ova (check).
- **Misconceptions:** hosts tag their own frames; every frame on a trunk is tagged (the native VLAN is not);
  connecting two switches with one cable automatically carries all VLANs.
- **Out of scope:** DTP negotiation, VLAN double-tagging attack (could be a later SEC preset on this model),
  802.1ad Q-in-Q, inter-VLAN routing (`intervlan-routing`), MAC learning (`mac-table`), STP per VLAN.
- **Builds on `vlan`:** reuses its VLAN colours, host names and the access/trunk port classification; new are
  the second switch, the tag field strip, native VLAN, allowed lists and frame length.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `vlan-trunk` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh vlan-trunk sims/vlan-trunk` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/vlan-trunk/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
