# ipv6-slaac: IPv6 SLAAC

| | |
|---|---|
| Task | `ipv6-slaac` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-ipv6-slaac` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/ipv6-slaac/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `ipv6` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **RS/RA, prefix + interface ID, DAD**.

The student: step a host joining a link.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` (Uvod u računalne mreže): "Vrste IPv6 adresa i podmreža veličine /64" (64-bit interface ID, SLAAC, fe80::/10) and its "Šire o temi" (SLAAC, NDP, temporary addresses)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch10-vrste-adresa-prefiksi.svg` (link-local vs global)
- RFC 4862 (IPv6 Stateless Address Autoconfiguration) §5.3, §5.4 (DAD), §5.5.3 (prefix option processing); RFC 4861 (Neighbor Discovery) §6.2.1, §6.3.4, §6.3.7, §10 (constants); RFC 4291 §2.5.1, §2.7.1, Appendix A (modified EUI-64, solicited-node); RFC 2464 §4 (Ethernet IID)
- RFC 8981 (temporary addresses), RFC 7217 (stable opaque IIDs): explanation only
- Catalogue seed: URM ch10

## Model and presets

- **Scene:** one IPv6 link: the joining host H (MAC 00:1a:2b:3c:4d:5e), router R (link-local fe80::1,
  advertising 2001:db8:1::/64) and a neighbour N. Left: H's **address list**, each address with its state
  (tentative, preferred, duplicate) and lifetimes. Centre: the link with messages drawn as envelopes
  labelled type, source and destination address (multicast groups by name: all-nodes ff02::1, all-routers
  ff02::2, solicited-node ff02::1:ffXX:XXXX). Right: a **bit strip** building the address: 64-bit prefix +
  64-bit interface ID, with the EUI-64 construction (split the MAC, insert ff:fe, flip the U/L bit).
- **State:** `{ t, phase, iid, addrs: [{addr, scope, state, valid, preferred}], groups: [], defaultRouter,
  msgs: [{type, src, dst, target, prefix, flags}], dupOf: null }`.
- **One step:** one phase in this order: (1) build the interface ID, (2) form the link-local address
  (tentative) and join its solicited-node group, (3) DAD: send NS, (4) wait RetransTimer, no answer →
  preferred, (5) send RS, (6) receive RA, (7) build the global address from the prefix (tentative),
  (8) DAD for it, (9) wait → preferred, default route via fe80::1.
- **Rules:**
  1. Interface ID (modified EUI-64): split the 48-bit MAC, insert ff:fe in the middle, invert the U/L bit
     (0x02) of the first octet → 021a:2bff:fe3c:4d5e (RFC 4291 §2.5.1 and Appendix A; RFC 2464 §4; URM
     `10-ipv6.md` "Vrste IPv6 adresa i podmreža veličine /64").
  2. Link-local = fe80::/64 + IID, formed first, without any router (RFC 4862 §5.3; URM ch10, fe80::/10).
  3. Every new unicast address is **tentative** until DAD finishes; a tentative address is not used as a
     source (RFC 4862 §5.4).
  4. DAD: NS with source :: (unspecified), destination the solicited-node multicast ff02::1:ff + the last
     24 bits of the address (ff02::1:ff3c:4d5e), target = the tentative address; wait RetransTimer (1 s,
     DupAddrDetectTransmits = 1) (RFC 4862 §5.4.2; RFC 4861 §10 constants; RFC 4291 §2.7.1).
  5. If an NA for the target arrives, or an NS for the same tentative address from another node, the
     address is **duplicate** and is not assigned; for a hardware-derived link-local the interface SHOULD
     stop IPv6 (RFC 4862 §5.4.3–5.4.5). Tie: two nodes probing at once both lose.
  6. RS from the link-local address to ff02::2; the router answers with an RA to ff02::1 (or unicast)
     from its link-local address (RFC 4861 §6.3.7, §6.2.6). The router's link-local becomes the default
     router (RFC 4861 §6.3.4).
  7. Prefix Information option with the A (autonomous) flag set and prefix length 64 → address = prefix +
     IID. If prefix length + IID length ≠ 128, the option is ignored for SLAAC (RFC 4862 §5.5.3 (d)). With
     A = 0 no address is formed (DHCPv6 territory, M flag).
  8. Lifetimes from the option: valid 2 592 000 s (30 days), preferred 604 800 s (7 days) as the router
     defaults (RFC 4861 §6.2.1 AdvValidLifetime / AdvPreferredLifetime); shown, not run down.
- **Params:** `mac` select of three MACs (default 00:1a:2b:3c:4d:5e); `prefixLen` choice 64 | 56 (default
  64); `aFlag` toggle (default on); `duplicate` choice none / link-local / global (N already holds it).
- **Presets:**
  1. `join` — H joins: IID 021a:2bff:fe3c:4d5e, link-local fe80::21a:2bff:fe3c:4d5e (DAD to
     ff02::1:ff3c:4d5e, no answer), RS → RA 2001:db8:1::/64 A = 1 → global 2001:db8:1::21a:2bff:fe3c:4d5e,
     default router fe80::1. Derived from RFC 4862/4291, unchecked by tool.
  2. `eui64` — only the bit strip: three MACs and their IIDs (00:1a:2b:3c:4d:5e → 021a:2bff:fe3c:4d5e;
     02:00:00:00:00:01 → 0000:00ff:fe00:0001, the U/L bit flips the other way). Derived.
  3. `dad-fail` — N already uses the global address: N answers the DAD NS with an NA; H marks the global
     address duplicate and keeps only its link-local. Derived from RFC 4862 §5.4.5.
  4. `prefix-56` — RA advertises 2001:db8:1::/56: 56 + 64 ≠ 128, so H forms no global address and keeps
     link-local only. From RFC 4862 §5.5.3 (d).
  5. `a-off` — RA with A = 0 (M = 1): no SLAAC address; the caption points to DHCPv6. Derived.
- **Steps:** `join` 10; `eui64` 4; `dad-fail` 9; `prefix-56` 7; `a-off` 7.
- **Legend:** tentative address (hollow), preferred (solid), duplicate (✕, hatched); multicast message
  (dashed, to a group), unicast (solid); prefix bits (c3), interface ID bits (c5), flipped U/L bit
  (highlight); "changed" marks the address whose state changed and the bits just written.
- **Captions:**
  - hr: "H šalje *Neighbor Solicitation* (traženje susjeda) s adrese :: na ff02::1:ff3c:4d5e: pita je li
    itko već vlasnik fe80::21a:2bff:fe3c:4d5e. Dok nema odgovora, adresa je privremena (*tentative*)."
  - en: "The RA carries 2001:db8:1::/64 with the A flag set. H appends its 64-bit interface ID and gets
    2001:db8:1::21a:2bff:fe3c:4d5e, still tentative until DAD finishes."
- **Terms:** stateless address autoconfiguration (SLAAC) — bezstanjska samododjela adrese (SLAAC);
  Neighbor Discovery — otkrivanje susjeda (NDP); interface identifier — identifikator sučelja; link-local
  address — link-local adresa; prefix — prefiks; duplicate address detection — otkrivanje dvostruke adrese
  (check: not in URM); router advertisement / solicitation — oglas / traženje usmjernika (check).
- **Misconceptions:** SLAAC needs a DHCP server; the router assigns the host's address (it only sends the
  prefix); an address is usable the moment it is formed (DAD first).
- **Out of scope:** DHCPv6 and the M/O flags in depth; temporary (RFC 8981) and stable-privacy (RFC 7217)
  IIDs, mentioned in the explanation only (many OSes, including Windows and current Linux defaults, do not
  use EUI-64 IIDs: check); NS/NA for address resolution (`net-ipv6-ndp`); MLD reports.
- **Note for the coordinator:** URM ch10 covers SLAAC only in outline ("Šire o temi": EUI-64, NDP, privacy
  addresses) with no RS/RA/DAD message flow and no worked example; rules here come from RFC 4861/4862.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ipv6-slaac sims/ipv6-slaac` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipv6-slaac/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
