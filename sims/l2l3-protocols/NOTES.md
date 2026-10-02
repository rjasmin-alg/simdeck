<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# l2l3-protocols: notes

Adopted from `single-page-labs/l2l3-protocols.html` (task `docs/tasks/w1/l2l3-protocols.md`, catalogue
`spl-l2l3-protocols`). The first commit on the branch is the original copied as-is (sha256 `15ae6f97b5ef…`); the
simdeck copy is canonical from here on.

## Decisions

- **One concept: encapsulation and its byte cost.** The original was a nine-tab, 102 KB reference (frame dissections,
  a fragmentation calculator, a 20-row comparison matrix, coexistence frames, nesting rules). It could not fit one
  screen at 1920×1080 with 20 px text, and as nine topics it broke "one concept per simulator". Its dissections share
  one idea: every header takes bytes, and either the frame grows (tags in the Ethernet header) or the packet inside
  must shrink (everything inside the link MTU). The page is rebuilt around that.
- **Class `explorer`, not `reference`.** The catalogue says "import as `ref`"; the task says "decide on import". A
  reference page has no params and no presets (`docs/sim-ui.md` §6), but this page has a working model (the MTU budget,
  the label count, the GENEVE options) and the original's tabs map onto presets 1–9. *(owner may prefer `reference`;
  nothing else changes if so.)*
- **Params:** view (one frame / compare), frame (14, a drop-down), link MTU (576–9000 in steps of 4, the original's
  slider), MPLS labels (1–4, shown for MPLS only), GENEVE options (0–252 B in steps of 4, shown for GENEVE only).
- **Presets (keys 1–9):** Ethernet II, QinQ, IPv4 header, IPv6 header, MPLS L3 VPN (2 labels), VXLAN, GENEVE with 8 B
  of options, IPsec ESP, compare all. 802.1Q, MACsec, IP in IP, GRE, VXLAN with an inner VLAN and GRE over IPsec are in
  the drop-down.
- **Field inspection:** the original's click-for-tooltip became a fixed detail card under the frame (projector-sized
  text, no hover). Which field is selected is page state, not a param: it resets to the frame's own default field when
  the frame changes, and is not in the URL.
- **Model** (`sim.js`, pure): a frame is a list of header groups, each a list of fields with bytes and a zone:
  `phy` (preamble, on the wire only, not counted), `l2` (the outer frame's header and trailer, outside the MTU),
  `over` (added by the encapsulation inside the MTU), `inner` (what the frame carries). The payload fills what is left.
  ESP pads its encrypted part to 4 B; bytes the alignment cannot use count as overhead (`waste`).
- Field labels and descriptions are strings (both languages); values (`0x8100`, `VNI 5001`) and byte counts are data
  (`translate="no"`).

## Deviations from the original

1. **Numbers recomputed, several changed** *(check)*:
   - 802.1Q and QinQ: the original's MTU table gave 1496 / 1492 B. Here the packet MTU stays 1500 and the frame grows to
     1522 / 1526 B (IEEE 802.3 allows 1522 for a tagged frame; QinQ needs the switches to accept 1526). The caption
     says the MTU drops by the tag bytes only if a switch does not accept the longer frame.
   - IPsec ESP tunnel mode: the original said "+59 B, ~1418 B". With AES-GCM (RFC 4106: 8 B IV, 16 B ICV), outer IPv4
     20 + ESP 8 + IV 8 + trailer 2 + ICV 16 = 54 B, so 1446 B at MTU 1500 (no padding needed). GRE over IPsec: 78 B,
     1422 B (the original: ~1394 B). The original's numbers fit a CBC cipher with a larger IV and NAT-T, which it did not
     show.
   - The coexistence frames: "VXLAN + inner 802.1Q" overhead is 54 B (1446 B inner packet), not the original's 108 B,
     which counted the outer Ethernet header (outside the MTU) and the inner IP and TCP headers (part of the inner
     packet). Its two app-payload figures (1392 and 1396 B) disagreed with each other.
   - MACsec: 32 B more per frame (SecTAG 16 with SCI + ICV 16), as the original's matrix said; the packet MTU stays.
2. **Dropped** (out of the one concept, or against "concepts, not tools"):
   - the fragmentation calculator: it seeds `net-fragmentation-pmtud` (catalogue, `w3/fragmentation-pmtud.md`); here
     fragmentation and PMTUD are the caption's consequence and a paragraph of the explanation;
   - PVLAN (port isolation, no header), NSH, LISP, NVGRE, TRILL, SPB, PBB, MPLS-TP, EFM OAM, SRv6 (cards only), the
     20-row comparison matrix (replaced by the compare view: overhead, inner MTU, frame length per encapsulation), the
     nesting-rules grid, and the "MPLS L3VPN over QinQ" and "IPsec over VXLAN" frames (the latter had no inner Ethernet
     header, which VXLAN requires);
   - the capture-header section (a capture tool's metadata, never on the wire), the switch configuration listing, the
     interface and packet-filter commands, named vendors and products (switch OS, a hypervisor, data-centre networking
     projects), OS default TTLs, and the named fragmentation attacks; the explanation keeps the concept (later fragments
     carry no port numbers, so a port filter cannot match them);
   - Google Fonts (JetBrains Mono, Syne), now the kit fonts; the scan-line background. No other network loads existed.
3. **Kept wording:** the field descriptions are the original's, shortened and with the product names taken out.

## Colour and shape

Kind of header: Ethernet `--c1`, tag/label `--c2`, IP `--c3`, tunnel/UDP/TCP `--c4`, security `--c5`; payload hollow
dashed; encrypted hatched; 0-byte optional fields dotted. Each box carries its field name and every group its header
name and bytes, so colour is never the only carrier (checked in the grayscale screenshots). The selected field has a
thick outline and ▲; in the compare view the selected frame row is highlighted with ▶.

## Sources

- The original page (field order, sizes, descriptions, frames).
- RFC 791 (IPv4), 8200 (IPv6), 3032 (MPLS), 2784 (GRE), 7348 (VXLAN), 8926 (GENEVE), 4303 (ESP), 4106 (AES-GCM in ESP),
  1191 and 8201 (PMTUD); IEEE 802.1Q, 802.1ad, 802.1AE. *(check)* the RFC field layouts were taken from the original
  and from memory; they were not re-read against the RFC texts in this session.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| encapsulation | enkapsulacija |
| payload | sadržaj |
| tag (VLAN) | oznaka |
| label (MPLS) | labela |
| tunnel | tunel |
| MTU (maximum transmission unit) | najveća prijenosna jedinica |
| path MTU discovery | otkrivanje MTU-a putanje |
| fragmentation needed (ICMP) | potrebna fragmentacija |
| packet too big (ICMPv6) | paket prevelik |
| overlay | preklopljena mreža |

`header` (zaglavlje), `trailer` (podnožje) and `frame` (okvir) come from the glossary. "Enkapsulacija", "tunel",
"fragmentacija" and "VLAN oznaka" are the URM book's words; "sadržaj", "labela" and "preklopljena mreža" are not from a
book *(check)*.

## Shared requests

- **Kit:** `.sd-ctl[hidden]` has no `display: none`, so a param with `visible: () => false` still shows (`.sd-ctl`'s
  display wins over the `hidden` attribute). Worked around in the page CSS, like `sims/amdahl`. Smallest fix: one rule
  in `kit/kit.css`; then drop the page rule here and in amdahl.
- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Related:** once they exist, `net-fragmentation-pmtud`, `protocol-headers` and `net-encapsulation` (catalogue §5.9)
  should list `l2l3-protocols` in `related` and the reverse.

## Checks not done here

- A real projector and a lecturer at the page.
- Every model rule was broken once (ESP alignment, the S bit position, a tag counted inside the MTU, the preamble
  counted, the fit guard, the ICV size, GENEVE options ignored and unaligned, compare listing header views, encryption
  marks) and each made a test fail; the fit-guard test was tightened after its first break did not fail.

## Time

Start 2026-10-02 08:06, done 08:23 (about 20 minutes, one session).
