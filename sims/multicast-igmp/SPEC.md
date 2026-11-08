<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multicast-igmp: specification

One concept: **hosts join and leave a group; IGMP snooping keeps the stream off the other ports.** Task:
`docs/tasks/w3/multicast-igmp.md` (catalogue `net-multicast-igmp`, §4.1). Stepper, 3–6 steps per preset.

## Scene

- Router **R** on switch port **5** (the multicast router port). R is the IGMPv2 querier; the stream for
  **239.1.1.1** arrives at R from a source upstream.
- Hosts **H1–H4** on ports **1–4**, one VLAN. Group 239.1.1.1 is MAC **01-00-5E-01-01-01** on the wire.
- The switch's snooping table is keyed by group address (default) or by MAC address (param `keyBy`); each entry
  holds its ports, each with its own expiry time.

## State

`{ clock (s), members: { host: [group] }, down: [host], table: { key: { groups, ports: { port: expires }, leaving } },
router: { groups: { group: expires }, pendingQuery: { group, left } | null }, inFlight: [{ type, from, port, group, dst,
to }], fwd: [ports that got this step's stream frame], received / used: { host: n }, history: { host: [how per step] },
events: [{ code, … }], changed: [table keys changed] }`. Plain JSON.

## One step

1. The scripted event (join, leave, silent, general query, group-specific query, wait, tick); `clock` jumps to the
   event's time.
2. Its IGMP messages are delivered and the switch and router tables updated.
3. Timers: every port and every router group whose time is `≤ clock` is removed.
4. One frame of the 239.1.1.1 stream: R forwards it into port 5 only while it has the group; the switch forwards it.
5. Counters: per host, `received` (the frame reached the host's link) and `used` (a member took it).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Group → MAC: 01-00-5E, a 0 bit, then the low 23 bits of the group address. 239.1.1.1 → 01-00-5E-01-01-01. The group bit is the lowest bit of the first MAC octet (01 = 0000 0001). | RFC 1112 §6.4; URM ch07 Primjer 1 (c) |
| 2 | Without snooping a multicast frame (data and IGMP alike) is flooded to every port of the VLAN except the ingress port. | RFC 4541 §1 |
| 3 | Join: the host sends an unsolicited Membership Report to the group address. | RFC 2236 §3, §9 |
| 4 | Snooping: the switch reads reports, adds the report's ingress port to the group (expiry `clock + 260`), and sends the report only to the router port. The stream goes to member ports and router ports only; a group with no entry (unregistered) goes to router ports only. | RFC 4541 §2.1.1 item 1, §2.1.2 items 1 and 3 |
| 4a | R forwards the stream onto the LAN only while it knows a member there (its group timer has not run out). | RFC 2236 §3 (router keeps a membership list per network) |
| 5 | General Query: R sends to 224.0.0.1, every 125 s; the switch sends it to every host port; each member answers with a report per group it is in (within Max Response Time 10 s; here in the same step). A port with no report for the Group Membership Interval 260 s = 2 × 125 + 10 is removed; R drops the group after the same time. | RFC 2236 §3, §8.1–8.4 |
| 6 | Leave: the host sends Leave Group to 224.0.0.2; the switch passes it to the router port *(check)* and does **not** drop the port at once (fast leave off *(check)*): the port's time becomes `min(expiry, clock + LMQC × LMQI)` = clock + 2 s. R sets its group timer the same way and sends LMQC = 2 group-specific queries to the group, LMQI = 1 s apart. The switch sends a group-specific query to the group's member ports *(check)*. A report on a port puts it back to `clock + 260`. With no report, the port goes at leave + 2 s. Both queries are sent even after a member answered the first (§3; §7's state diagram would stop after a report *(check)*). | RFC 2236 §3, §7, §8.8–8.9 |
| 7a | **Tie-break:** two members on different ports, one leaves: the other answers the group-specific queries on its own port, so its port and R's group stay; only the leaver's port goes. | derived from 5 and 6 |
| 7b | **Tie-break:** two members behind one port (a hub), one leaves: the other answers the group-specific query on the same port, so the port stays. | derived from 6 |
| 7c | **Tie-break:** a port is removed in the step whose time equals its expiry (`≤`), not one step later. | RFC 2236 §8.4 "the amount of time that must pass" |
| 7d | **Tie-break:** a host that joins a group it is already in stays one member; the report refreshes its port. | — |
| 8 | Groups 224.0.0.x (link-local control) are flooded even with snooping. | RFC 4541 §2.1.2 item 2 |
| 9 | 32 groups share one MAC (5 bits are lost): 224.1.1.1 and 239.1.1.1 are both 01-00-5E-01-01-01. A MAC-keyed table cannot tell them apart and sends the 239.1.1.1 stream to a 224.1.1.1 member too; that host's card accepts the MAC and its IP layer drops the packet. An IP-keyed table keeps them apart (RFC 4541 says IP-based is preferred). | RFC 1112 §6.4; RFC 4541 §2.1.2 item 5 |

How a host takes a stream frame (`history`): `use` (member of 239.1.1.1), `nic` (not listening to that MAC: the card
drops it), `ip` (member of another group with the same MAC: the IP layer drops it), `down` (hung host), `none` (no
frame on its link).

## Presets (scripts) and expected numbers

| Preset | Params | Steps | Events (t in s) | Expected |
|---|---|---|---|---|
| 1 `flood` | snooping off, script `h1` | 3 | 0 tick · 1 H1 joins · 2 tick | step 1: R forwards nothing. Steps 2–3: stream to ports 1–4, **4 copies**; report flooded to 2, 3, 4, 5. End: received 2/2/2/2, used 2/0/0/0. |
| 2 `snoop` | snooping on, `h1h3` | 4 | 0 tick · 1 H1 joins · 2 H3 joins · 3 tick | step 2: port 1, 1 copy; step 3: ports 1 and 3, **2 copies**; H2, H4 receive **0**. Table: 1 → 261 s, 3 → 262 s. |
| 3 `leave` | snooping on, `leave` (starts at the end of `h1h3`) | 6 | 4 tick · 5 H3 Leave · 5 GSQ 1 · 6 GSQ 2 · 7 wait · 8 tick | Leave: port 3 until 7 s (= 5 + 2). GSQ 1 and 2: H1 answers (port 1 → 265, 266 s), port 3 silent. Step 5 (t = 7): port 3 removed; stream to port 1 only; H1 uses all 6 frames, H3 received 4 (3 after it left, dropped by its card). |
| 4 `silent` | snooping on, `silent` | 6 | 0 H2 joins · 5 H2 hangs · 125 GQ · 250 GQ · 260 wait · 261 tick | GQs at 125 and 250 s: no answer from ports 1–4; port 2 stays (expiry 260). Step 5 (t = 260 = 0 + 260): port 2 removed, R drops the group, no stream. End: H2 received 4, used 1. |
| 5 `mac-overlap` | snooping on, table by MAC, `overlap` (starts with H1 in 239.1.1.1 at 0 s) | 4 | 1 tick · 2 H4 joins 224.1.1.1 · 125 GQ · 126 tick | Join: one table row 01-00-5E-01-01-01 with groups 239.1.1.1 and 224.1.1.1, ports 1 and 4; stream to **1 and 4**; H4 `ip`-drops 3 frames. With `keyBy: ip`: stream to port 1 only. |

`sim.json` `steps` = 4 (the defaults: snooping on, by group, `h1h3`). Numbers checked by the model tests and a node
run of every script × snooping × key (NOTES.md).

## Out of scope

IGMPv3 source filtering (RFC 3376), PIM and multicast routing, MLD for IPv6, querier election, report suppression
and the random response delay (answers come in the step of the query), repeated unsolicited reports (Robustness).
