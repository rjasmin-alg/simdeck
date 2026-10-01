# multicast-igmp: Multicast and IGMP

| | |
|---|---|
| Task | `multicast-igmp` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-multicast-igmp` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/multicast-igmp/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `multicast` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **joins, IGMP snooping keeps the stream off other ports**.

The student: hosts join and leave a group.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- No course text on IGMP. Related: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` Primjer 1 (multicast MAC 01-00-5E-00-00-01, group bit) and "Ethernet u preklopljenoj mreži" (flooding); `10-ipv6.md` (multicast replaces broadcast in IPv6) for the follow-up.
- RFC 1112 §6.4 (IPv4 group → Ethernet MAC mapping); RFC 2236 (IGMPv2: §3 protocol, §8 timer defaults: Query Interval 125 s, Max Response Time 10 s, Robustness 2, Group Membership Interval 260 s, Last Member Query Interval 1 s); RFC 3376 (IGMPv3, out of scope); RFC 4541 (IGMP/MLD snooping switch considerations)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** router R (IGMP querier, the stream arrives through it from a source upstream) on switch port 5 (the
  multicast router port), hosts H1…H4 on ports 1–4, all in one VLAN. Group 239.1.1.1, on the wire as MAC
  01-00-5E-01-01-01. Beside the switch: its snooping table `group | ports | timer`; under each host a "receives
  stream" meter (frames/step). Kit view K2 when it exists; until then own SVG.
- **State:** `{ snooping, clock (s), members: { host: [group] }, table: { group: { ports: [p], expires } },
  router: { groups: { group: expires }, pendingQuery }, inFlight: [{ type, from, to, group }], received:
  { host: count }, events: [code] }`.
- **One step:** one protocol event, then one tick of the stream. Phases: (1) the scripted event (join, leave,
  general query, time jump), (2) IGMP messages delivered and the switch/router tables updated, (3) one stream
  frame for 239.1.1.1 forwarded by the switch, (4) counters.
- **Rules:**
  1. Group → MAC: 01-00-5E followed by the low 23 bits of the IPv4 group address; 239.1.1.1 → 01-00-5E-01-01-01
     (RFC 1112 §6.4). The group bit is the lowest bit of the first octet (URM ch07 Primjer 1, address (c)
     01-00-5E-00-00-01).
  2. Without snooping a switch treats a multicast frame like a broadcast: it floods it to every port of the VLAN
     except the ingress port (RFC 4541 §1; IEEE 802.1D default) (check).
  3. Join (IGMPv2): a host sends an unsolicited Membership Report to the group address (RFC 2236 §3).
  4. Snooping: the switch reads reports and adds the report's ingress port to that group; the stream is forwarded
     only to member ports and the router port (RFC 4541 §2.1.2). Reports go only to the router port, not to other
     hosts (RFC 4541 §2.1.1).
  5. General Query: the querier sends to 224.0.0.1 every 125 s, Max Response Time 10 s; members answer; a port
     with no report for the Group Membership Interval 260 s (2 × 125 + 10) is removed (RFC 2236 §8).
  6. Leave (IGMPv2): the host sends Leave Group to 224.0.0.2; the querier sends a Group-Specific Query; with no
     report after Last Member Query Count 2 × Last Member Query Interval 1 s, the group is removed from that
     port (RFC 2236 §3, §8.8–8.9). Fast-leave/immediate-leave is a vendor option, off here (check).
  7. Tie-break: if two members on different ports exist and one leaves, the other port keeps the stream; if two
     members share one port (behind a hub), the remaining one answers the group-specific query and the port
     stays.
  8. Groups 224.0.0.x (link-local control) are always flooded, even with snooping (RFC 4541 §2.1.2).
  9. Edge: 32 IPv4 groups share one MAC (5 bits lost); e.g. 224.1.1.1 and 239.1.1.1 both map to
     01-00-5E-01-01-01 (RFC 1112 §6.4). A MAC-based snooping table cannot tell them apart (check: vendor).
- **Params:** `snooping` toggle default on; `script` choice of the preset scripts below; button `join-H*` and
  `leave-H*` actions are the steps in the presets, not live buttons (stepper).
- **Presets:**
  1. `flood` — snooping off; H1 joins: stream reaches H1, H2, H3, H4 (4 copies per frame). 3 steps. Derived from
     RFC 4541 §1.
  2. `snoop` — snooping on; H1 and H3 join: the stream reaches ports 1 and 3 only (2 copies); H2 and H4 count 0.
     4 steps. Derived from RFC 4541.
  3. `leave` — after preset 2, H3 leaves: Leave → group-specific query (t + 0 s, t + 1 s) → no report → port 3
     removed at t + 2 s; H1 still receives. 6 steps. From RFC 2236 timers.
  4. `silent` — H2 joins, then powers off without a Leave; general queries at 125 s and 250 s get no answer from
     port 2; port 2 removed at 260 s after its last report. 6 steps. From RFC 2236 §8.4.
  5. `mac-overlap` — H4 joins 224.1.1.1 while H1 is in 239.1.1.1: same MAC, so a MAC-based switch sends the
     239.1.1.1 stream to H4 too, whose IP stack then discards it. 4 steps. Derived, unchecked (check vendor).
- **Steps:** 3, 4, 6, 6, 4.
- **Legend:** stream frame (colour 1, filled circle), Membership Report (colour 2, arrow up), Leave (colour 3,
  hollow arrow), Query (colour 4, diamond); member port (solid), non-member port (dashed). "Changed" marks the
  snooping-table row and the ports whose forwarding changed in this step.
- **Captions:**
  - hr: "Korak 3: H3 šalje *Membership Report* (izvješće o članstvu) za 239.1.1.1. Preklopnik ga čita i dodaje
    priključak 3 u skupinu — tok sad ide na priključke 1 i 3."
  - en: "Step 5: no host on port 3 answered two group-specific queries 1 s apart, so the switch removes port 3 from
    239.1.1.1. H1 keeps the stream."
- **Terms:** multicast — skupno odašiljanje (*multicast*); multicast address — skupna adresa (URM ch07 Primjer
  1); group — skupina; join / leave — pridruživanje / napuštanje (check); IGMP snooping — prisluškivanje IGMP-a
  (check); querier — ispitivač (check); flooding — preplavljivanje (ch07).
- **Misconceptions:** a switch sends multicast only to receivers by itself (only with snooping); a host that
  stops watching stops the stream at once (only after Leave + queries, or 260 s if it just disappears); the
  router decides which switch ports get the stream (the switch does, from snooped reports).
- **Out of scope:** IGMPv3 source filtering (RFC 3376), PIM and multicast routing, MLD for IPv6, querier
  election, report suppression timers.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh multicast-igmp sims/multicast-igmp` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/multicast-igmp/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
