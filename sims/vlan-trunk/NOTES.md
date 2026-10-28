<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vlan-trunk: notes

New stepper (task `docs/tasks/w3/vlan-trunk.md`, catalogue `net-vlan-trunk`, §4.1, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage, top to bottom.** One field strip per frame (its name and where it is, then dst MAC, src MAC, the 802.1Q
  tag as TPID | PCP | DEI | VID or a dashed "nema oznake / no tag", type `0x0800`, length); the K2 drawing (SW1 and
  SW2 on top joined by the cable `Gi0/1–Gi0/1`, three hosts under each); the two port tables (port, mode with the
  host, VLAN or "nativni n", allowed list). The tables mark the ports used in this step (thick ink border,
  highlight).
- **The change** (tag added or removed, length 1518 ↔ 1522) is highlighted in the strip with the old value struck
  (`VID 10`, `1522`), as `intervlan-routing` does.
- **VLAN colours and patterns**: VLAN 10 c1 solid, VLAN 20 c2 hatched, VLAN 1 c3 dotted, any other VLAN (99) c5
  dotted, with its own legend entry (the task's "VLAN 1/99 colour 3": 99 got its own colour so the leak in
  `native-mismatch` is visible as a colour change too). Every VLAN is also written as
  "VLAN n" on hosts, badges, strips and tables.
- **Chips**: on the cable the chip says "VID n" or "bez oznake / untagged". On host links every frame is untagged
  (rule 1), and the links are short, so the chip there is a plain box in the VLAN's colour (the task's legend:
  "untagged = plain box"); a text chip collided with the port labels.
- **M1 and M2 are in their switch's native VLAN** (the task names M in VLAN 1 by default and M2 in VLAN 99 in
  `native-mismatch`). The param labels say so: "Nativni VLAN na SW1 (i M1)". On an access cable M's card drops the
  words "nativni VLAN" and shows only its VLAN.
- **MAC tables are pre-learnt by the model's own rules** (`macTable`): a host is known where its frames arrive, in
  the VLAN they arrive in. So in `not-allowed` SW1 does not know Pr2 in VLAN 20 and floods VLAN 20 (to `Gi0/1` only),
  and the frame is stopped at the trunk egress, as the task says. The tables are not drawn (learning is
  `mac-table`'s concept); the caption says "the destination is on Gi0/1" or "does not know Pr2 in VLAN 20, floods".
- **Leaks** are marked when a switch puts a frame in a VLAN other than the one it had (rule 9). With `native1 = 10`
  and `send: ra1-ra2` Ra1's frame lands in SW2's VLAN 1, is flooded to M2, and M2 discards it (not its MAC): the
  model and caption handle it ("M2 ga odbacuje").
- **Flood copies** get ids `f1.<port>` and a strip each (e.g. `native1 = 20` with a broadcast from Pr1: M1 gets it
  untagged on SW1, the copy crosses the trunk untagged and lands in SW2's VLAN 1 at M2).
- **The egress drop** (`not-allowed`) shows "✕ odbacuje" on SW1, the dashed red strip and the caption; no packet is
  drawn on the cable (K2 draws a drop as a cross at the receiver or half way, which would say "lost on the wire").
- **Port model reuse**: `models/` has no VLAN model, so `parseLink` is copied from `sims/vlan/sim.js @ 14623bd`;
  `ingress` and `egress` generalise `vlan`'s `carries`, `tagOnLink` and `arrivalVlan` with the native VLAN and the
  allowed list (with no native VLAN and every VLAN allowed they give the same results). They are pure, string-free
  functions ready for `models/`.
- **No vendor command lines on the page.** "802.1Q" is the standard's name; the explanation mentions that switches
  exchanging a neighbour discovery protocol can warn about a native VLAN mismatch, without naming one.

## Deviations from the task

- **`native1`/`native2` are choices 1, 10, 20, 99, not 1–99 sliders.** Two sliders did not fit the panel at
  1920×1080 with six presets, and 99 is fiddly to hit with a clicker; the four values cover every preset and the
  interesting combinations (native = a VLAN in use). The model still takes 1–99 (`norm` clamps).
- **`send: m1-m2` sends M1 → M2 and Ra1 → Ra2**, so `native` shows the untagged VLAN 1 frame "next to" a tagged
  VLAN 10 frame, as the preset asks; option label "M i Ra / M and Ra".
- **The `send` and `link` option labels are short** ("Ra i Pr", "pristupni 10") to fit the panel; the step 0 caption
  lists the frames in full.
- **Presets in two columns** (as `amdahl`, `dns-records`, `dhcp-dora`) so the panel fits without scrolling.
- **Native sliders stay visible on an access cable**: they still set M1/M2's VLAN. Only `allow20` hides.
- K2 used directly (it exists since kit 0.3.0); nothing drawn by hand.

## Sources

- URM `book/chapters/07-podatkovni-sloj.md`: "VLAN-ovi: jedna žica, više logičkih mreža" (access port never tags;
  trunk inserts the tag right after the source address, 4 bytes, 1518 → 1522; TPID 0x8100, PCP 3 bits, DEI 1 bit,
  VID 12 bits, 0 and 4095 reserved, 1–4094; the far switch reads and removes the tag; native VLAN untagged),
  Primjer 5 (a–c), figures `ch07-8021q-oznaka.svg`, `ch07-vlan-trunk.svg`.
- URM `book/chapters/12-izgradnja-mreze.md`: "Provjera povezanosti" ("VLAN koji nije propušten kroz *trunk*": a
  trunk carries every VLAN by default; a VLAN missing from the allowed list does not cross).
- `ugradbeno/vlan.html` via `sims/vlan/` (host names Ra1/Pr1/Ra2/Pr2, VLAN 10 računovodstvo / 20 prodaja).
- IEEE 802.1Q (PVID for untagged ingress, native/untagged VLAN).
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md` T06: chapter not written; nothing taken.

## Checks

- Preset outcomes (SPEC.md table) produced by running the model for each preset before writing the tests, and
  pinned in `sim.test.js`.
- Mutation run: each rule and tie-break broken once in `sim.js` (16 mutations); 15 caught by a test. The one that
  survived was a second leak flag at delivery, which can never fire (ingress already flags every VLAN change, and
  forwarding only reaches hosts in the frame's VLAN); it was removed.
- **Fresh reviewer** (a separate agent, read-only, given the code and SPEC, not my conclusions): no factual errors;
  32 mutations. It found untested events (captions are built from them), the broadcast branch, the SW2 ingress drop
  (`native2: 20, allow20: off`), a misleading caption for that drop, the VLAN 99 legend colour and SPEC wording.
  All fixed: event tests, a scene test for the ingress drop, `cDropInNative`, `cIgnoreUntag`, a VLAN 99 legend
  entry, SPEC rules 9 and 10 reworded. Its mutation script re-run: only two equivalent mutants survive.
- Screenshots reviewed: 1920×1080 light, dark, grayscale in hr and en; 375×812; plus every preset at its key step
  (trunk 3, access-link 2, broadcast 4, native-mismatch 4 and 5, not-allowed 3) and the flood edge case.

## Unchecked *(check)*

- Rule 9's vendor behaviour: the neighbour discovery protocol's native VLAN mismatch warning (Cisco CDP) is from
  general knowledge, not a source in the book.
- Rule 10: a tagged frame arriving on an access port is dropped by default on common switches (vendor behaviour
  varies; many accept a frame tagged with the access VLAN or a priority tag). It cannot occur in the scene; only
  `ingress` tests it.
- Rule 9: some spanning tree variants block a port with a native VLAN mismatch; the explanation says "some block
  such a port" without naming one.
- `native-mismatch` is derived from rules 3 and 4, not from a book example.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| access port | pristupni priključak |
| trunk port | *trunk* priključak (tagirano sučelje) |
| tag / tagging | oznaka / označavanje |
| VLAN identifier (VID) | VLAN identifikator (VID) |
| native VLAN | nativni VLAN |
| allowed VLAN list | popis dopuštenih VLAN-ova *(check: the book says "dopušteni popis")* |
| broadcast domain | *broadcast* domena |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"` (same request as `vlan`).
- **models/:** promote the VLAN port model (`validVid`, `inAllowed`, `without`, `ingress`, `egress`, `frameLen`,
  `portsInVlan`, `macTable`, `forward`) as `models/vlan-port.js`; `vlan` and `intervlan-routing` use a subset.
- **kit (optional):** K2 has no way to draw a frame stopped at the sender's egress port (a cross at the start of a
  link); `drop` puts it at the receiver.
- **kit (optional):** `t.parts` with a placeholder used twice (same request as `mac-table`, `vlan`).

## Time

Start 2026-10-28 14:37, done 14:59 (one session; the fresh review and its fixes included).
