<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vlan: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vlan.html` (task
`docs/tasks/w1/vlan.md`, catalogue `urm-vlan`). The fragment used the book's `IA.gumbPrimjer` and `IA.Zadatak`
(`output/interaktivno/static/komponente.js`) and the book's CSS, with one `<select>` for the link mode and an SVG
drawn in a 560×200 viewBox; it had neither `IA.Klizac` nor `IA.Koraci`, although the task file names them. The
simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 6 steps: two frames, three steps each.** The original was an explorer (pick the link mode, read
  which VLAN passes). The catalogue's concept is "VLAN membership *and tagging*", and the tagging was only told in
  the "why" box, never shown; so one demo follows a frame per VLAN across the two switches, as the chapter's own
  walk-through does ("Pratimo što se s okvirom stvarno događa … gdje mu se točno na tom putu oznaka pojavi i
  nestane"). Each frame: **enter** (untagged, onto SW1's access port, which puts it in that port's VLAN), **link**
  (a trunk inserts the 802.1Q tag with the VID; an access port in the frame's VLAN carries it untagged; an access
  port in another VLAN means the frame never leaves SW1), **exit** (SW2 takes the VLAN from the tag or from its own
  port, removes the tag, delivers untagged to the host of that VLAN, or nothing arrives). The frame's fields are
  drawn above the network, with the tag box only while the frame wears it (highlighted when inserted, a dashed
  "tag removed" box when removed).
- **The select became the kit param `link`** (`choice`: trunk, access-10, access-20), one setting for both ends of
  the cable, as in the original. Changing it recomputes the same step.
- **Book's numbers first:** two switches, VLAN 10 (računovodstvo) and VLAN 20 (prodaja), host names Ra1, Ra2, Pr1,
  Pr2 from the fragment (ch. 7, Primjer 5, named in the fragment's top comment). The defaults and preset 1 (`book`,
  "Primjer iz knjige", the fragment's own button) are Primjer 5 (b): access port in VLAN 10, exactly what the
  fragment's button set. Result: Ra1 ↔ Ra2 works untagged, Pr1 ↔ Pr2 is cut off.
- **Exercises (`ia-zadatak`) became presets**, opened at step 0 with the question as the hint; the answers are what
  the steps show and are not on the page: exercise 1 → `trunk`; exercise 2 → `book` (it asked to click the book
  button); exercise 3 (Primjer 6, router on a stick with the switch side left as access) → `wrong` (access port in
  VLAN 20). **Deviation:** the router and its subinterfaces are not drawn: inter-VLAN routing is the second concept
  `net-intervlan-routing` (catalogue §5.9). The preset keeps Primjer 6's point on this topology (an access port
  where tags are expected carries one VLAN, untagged; the other VLAN never arrives), and its hint asks the router
  question in general words. The fragment's exercise named the vendor command `encapsulation dot1q`; the hint does
  not (COMMON §1, concepts not tools).
- **Rules and tie-breaks** (all in `sim.js`, tested, each test seen failing once by breaking the rule):
  - an access port carries exactly its own VLAN; a trunk carries every VLAN.
  - **tie-break: an access port tags nothing, even a frame of its own VLAN**; a trunk tags with the frame's VLAN.
  - the receiving switch takes the VLAN from the tag on a trunk, from its own port on an access link (an access
    port never looks for a tag).
  - a frame is delivered only to the host of its VLAN on the far switch; a host never sends or receives a tag.
  - the tag is added on the link step and removed on the delivery step, nowhere else.
  - Not modelled, by the one-concept rule: the native VLAN (untagged traffic on a trunk; `net-vlan-trunk`), access
    VLANs that differ on the two ends of a cable (VLAN leaking, also `net-vlan-trunk`), the 802.1Q field layout
    (TPID 0x8100, PCP, DEI; the frame shows only "802.1Q tag · VID"), broadcast domains, routing between VLANs.
- **The "what happened" box is the caption, the "why" box is the explanation** (with the chapter's 4-byte tag and
  "right after the source address" added). The `<details>` text version is gone: the stage is real HTML text and the
  caption is the kit's live region. Vendor commands from the chapter (`switchport …`) are left out.
- **Colour is not the only carrier:** VLAN 10 hosts have a square badge, VLAN 20 a round one, and every host and
  port says "VLAN 10 · računovodstvo" / "pristupni · VLAN 10" in words; the frame's path is thick lines and the
  thick-bordered box where it is; a held frame is a dashed link with "✕ VLAN 20 ne prolazi"; outcomes are "✓ … radi"
  and "✕ … ne radi" (the cut one also dashed).
- **Caption placeholders used twice** (`{v}`) need two nodes: the page's `parts()` wraps `t.parts` and copies a
  node at its second use, as in `mac-table` (its kit request covers this sim too).
- `parseLink`, `carries`, `tagOnLink`, `arrivalVlan`, `cross` are pure functions over plain data with no strings,
  ready for `models/` when `net-vlan-trunk` (catalogue §5.9, "extends `urm-vlan`") reuses them.

## Sources

- The fragment (scenario, host names, sentences, exercises, the "why" box) and `komponente.js` (what
  `gumbPrimjer` and `Zadatak` did).
- URM book ch. 7 (`book/chapters/07-podatkovni-sloj.md`): "VLAN-ovi: jedna žica, više logičkih mreža" (access
  port never tags; the trunk inserts the 802.1Q tag right after the source address, 4 bytes, 1518 → 1522; the far
  switch reads and removes it; hosts never see it), Primjer 5 (a–c), Primjer 6, and the figure
  `assets/diagrams/ch07-vlan-trunk.svg` (two switches, two VLANs each, one trunk). Every number in `sim.test.js` is
  checked against those passages.
- `scripts/check-web.py` (§7a order and locked button names): "Primjer iz knjige" kept as preset 1.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| VLAN (Virtual Local Area Network) | VLAN |
| access port | pristupni priključak |
| trunk port | *trunk* priključak |
| 802.1Q tag / VLAN tag | 802.1Q oznaka / VLAN oznaka |
| VLAN identifier (VID) | VLAN identifikator (VID) |
| to tag / to remove the tag | označiti / skinuti oznaku |
| switch, port | preklopnik, priključak (also listed by `mac-table`) |

The glossary's *frame* is the memory frame (okvir, ossimulator), so `[[frame]]` is not used; the URM book's
*frame* (okvir, Ethernet) is the same Croatian word. Captions and labels write *trunk* plainly (no italics) because
they are plain text.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **kit (optional):** `t.parts` with a placeholder used twice (same request as `mac-table`).
- **models/:** promote `parseLink`, `carries`, `tagOnLink`, `arrivalVlan`, `cross` when `net-vlan-trunk` starts.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No fresh reviewer read the diff (COMMON §8 asks it of new sims; this is an adoption).
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 03:09, done 03:17 (about 8 minutes, one session).
