<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multicast-igmp: notes

New stepper (task `docs/tasks/w3/multicast-igmp.md`, catalogue `net-multicast-igmp`, §4.1, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage.** Left: the K2 drawing (stream source cloud → R on top, the switch in the middle, H1–H4 below, port
  numbers at the switch end of each link). Right: three boxes, the clock with R's group list (and its pending
  group-specific queries), the switch's snooping table (`group | port | expires`, one row per port so the row that
  changed can be marked; a port removed in this step stays one step, struck through), and the group address → MAC
  mapping bit by bit (the 4 class-D bits, the 5 lost bits dashed, the 23 copied bits boxed, the 01-00-5E prefix, the
  group bit of 01). In `mac-overlap` the box shows 224.1.1.1 under 239.1.1.1: same 23 bits, different lost bits.
- **The "receives stream" meter** is a row of round cells in each host card, one per step of the preset: filled =
  the host used the frame, dashed with ✕ = the frame reached its link and was dropped (card, IP layer or a hung host),
  empty = no frame, dotted = steps to come; under it "stiglo r, korišteno u / stream: r in, u used". With one stream
  frame per step this is the task's "frames/step".
- **Chips are symbols only** (● stream c1, ▲ report c2, △ leave c3, ◆ query c4): the links to the hosts are short
  and text chips covered the port labels; the legend names each symbol with its colour, and the caption says what
  the step sends in words. Shape plus colour, so grayscale keeps them apart.
- **Links**: solid = the switch would send the stream to that port now, dashed (K2 `off`) = it would not; ink = a
  frame went there in this step. With snooping off every host port is solid (it floods). The task's legend says
  "member port / non-member port"; with snooping off there are no member ports, so the legend says "port gets the
  stream / port without the stream".
- **Changed** marks the host card whose port changed forwarding in this step, the snooping-table row(s) touched by
  the step (added, refreshed, shortened by a Leave, removed) and the clock.
- **R forwards the stream onto the LAN only while it knows a member** (SPEC rule 4a). So step 1 of `flood` and
  `snoop` shows the stream arriving at R and stopping there, and `silent` ends with R dropping the group at 260 s, at
  the same time as the switch drops port 2. This is how a multicast router behaves (RFC 2236 §3) and keeps the
  "unregistered" case (RFC 4541 §2.1.2 item 3) out of the presets.
- **One step = one event**, and every message of the event is delivered in that step (answers to a query come at
  once, not after a random delay up to 10 s). Event times are absolute seconds on the clock (`t = 125 s`).
- **`leave` starts where `snoop` ends** (the model replays `h1h3` for its initial state), as the task says "after
  preset 2"; `mac-overlap` starts with H1 already in 239.1.1.1. The counters start from zero at step 0.
- **The switch table key is a param** (`keyBy`: group address, the default, or MAC address). RFC 4541 §2.1.2 item 5
  says both exist and that IP-based forwarding should be the default where a switch supports both; `mac-overlap`
  sets MAC so the overlap shows, and switching it to IP in the same preset shows the fix. Hidden when snooping is off.
- **`script` is a select**, not segmented buttons: five long option names did not fit the panel at 1920×1080.
- **Model shape**: `apply(state, event, scene, params)` is pure over plain data and takes the scene (hosts → ports,
  router port) as data, so the tests run a hub scene (two hosts on port 3) for tie-break 7b. No strings in `sim.js`.

## Deviations from the task

- **"H2 powers off"** became "H2 hangs (zamrzne se) and sends no Leave; the link stays up". A host that really
  powers off takes its link down, and many switches flush snooped entries on a port that goes down *(check: vendor;
  RFC 4541 does not say)*, which would remove port 2 at once and hide the 260 s timeout the preset is about.
- **Legend** "member port / non-member port" → "port gets the stream / port without the stream" (see Decisions).
- **Step 1 of `leave`** is a plain tick (both members receive), so that the Leave is step 2 and the removal step 5,
  matching the task's English caption "Step 5: no host on port 3 answered two group-specific queries 1 s apart…".
- The task's Croatian caption example ("Korak 3: H3 šalje *Membership Report* …") is in the page as "Korak 3 (t = 2 s):
  H3 se pridružuje skupini 239.1.1.1 i šalje *Membership Report* (izvješće o članstvu). Preklopnik ga čita i šalje
  samo usmjerniku, na priključak 5. Preklopnik dodaje priključak 3 u skupinu 239.1.1.1. Tok sad ide na priključke
  1 i 3." (the step number and the clock come first on every caption).

## Sources

- RFC 1112 §6.4: "placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet
  multicast address 01-00-5E-00-00-00"; "more than one host group address may map to the same Ethernet multicast
  address".
- RFC 2236 §3: unsolicited report to the group on join; Leave Group to all-routers 224.0.0.2; General Query to
  all-systems 224.0.0.1; the querier sends [Last Member Query Count] group-specific queries every [Last Member Query
  Interval] to the group being left. §7: the group-specific query goes to the group; on a Leave the timer is set to
  LMQI × LMQC. §8: Robustness 2 (§8.1), Query Interval 125 s (§8.2), Query Response Interval 10 s (§8.3), Group
  Membership Interval = RV × QI + QRI = 260 s (§8.4, the RFC gives the formula, 260 is our arithmetic), Last Member
  Query Interval 1 s (§8.8), Last Member Query Count = RV = 2 (§8.9). §9: destination table.
- RFC 4541 §1 (flooding without snooping), §2.1.1 item 1 (reports only to router ports), item 6 (do not rely on
  Leave alone; membership timeout), §2.1.2 items 1–3 and 5 (member and router ports; 224.0.0.X flooded; unregistered
  to router ports; MAC- or IP-based tables, IP preferred, 1:32 multiplicity).
- URM `book/chapters/07-podatkovni-sloj.md`: Primjer 1 (c) 01-00-5E-00-00-01, the I/G bit; "Ethernet u preklopljenoj
  mreži" (preplavljivanje / flooding); the book's term "skupna adresa".
- The RFC facts were read from rfc-editor.org on 2026-11-08 for this task (section numbers and quotes above).

## Unchecked *(check)*

- **Leave forwarded to the router port only** with snooping: RFC 4541 gives no forwarding rule for Leave messages.
- **Group-specific query sent to the group's member ports, general query to every host port**: RFC 4541 has no rule
  for forwarding queries; switches differ (some flood every query).
- **Fast leave / immediate leave off**: not in RFC 4541 (the phrase does not appear); a vendor option. The switch
  here keeps the port for LMQC × LMQI = 2 s after a Leave, the router's last-member time.
- **The switch removes the port at leave + 2 s** using the router's timers; a real switch may use its own
  last-member time.
- **Flushing on link down**: not in RFC 4541; see the `silent` deviation.
- **The second group-specific query is sent even after a member answered the first.** RFC 2236 §3 says the querier
  "sends [Last Member Query Count] Group-Specific Queries every [Last Member Query Interval]"; the §7 state diagram
  moves the group to "Members Present" on a report, where a strict router would not send the second one. The sim
  follows §3 and the task (queries at t + 0 s and t + 1 s); implementations differ.
- **MAC-based snooping tables**: allowed by RFC 4541 §2.1.2 item 5; which switches key by MAC is vendor-specific.
- **Croatian terms** not in the course books: *join* / *leave* = pridruživanje / napuštanje, *IGMP snooping* =
  prisluškivanje IGMP-a, *querier* = ispitivač, *Membership Report* = izvješće o članstvu, *group* = skupina.

## Term pairs (missing from `kit/glossary.js`)

Written out in both tables (the page uses `[[flooding]]` from the glossary only):

| en | hr | source |
|---|---|---|
| multicast | skupno odašiljanje | URM ch07 ("skupna (multicast) adresa") |
| multicast address | skupna adresa | URM ch07 Primjer 1 |
| group | skupina | task file *(check)*; the glossary's "group → grupa" is the Linux user group |
| join / leave | pridruživanje / napuštanje | task file *(check)* |
| IGMP snooping | prisluškivanje IGMP-a | task file *(check)* |
| querier | ispitivač | task file *(check)* |
| Membership Report | izvješće o članstvu | simdeck *(check)* |

## Shared requests

- **K2 (`kit/topology.js`)**: nothing blocking. Two small wishes: (1) a way to give two packets on the same link and
  direction a fixed lane offset (here a flooded report and the stream share the switch → host links; `at` 0.35 and
  0.75 keep their chips apart); (2) an optional legend swatch per packet symbol, so pages that use symbol chips need no
  own `.sd-swatch` CSS.
- **Glossary**: add the term pairs above with `"src": "simdeck"`.

## Checks

- `node --test sims/multicast-igmp/sim.test.js`: 31 tests; each rule and tie-break broken once on purpose (mask,
  flooding, report destination, report to the router port only, member-port filtering, GMI 250, fast leave, query
  count 3, hub answer, group-specific answer filter, link-local, MAC key, IP drop, `≤` expiry, double join): every
  mutation fails at least one test.
- **Fresh review** (a separate agent, playbook §7.4): read the code against SPEC.md, checked every expected number
  and the RFC citations, and ran about 30 more mutations on a copy. No defects. Twelve mutations survived at first
  (answers to a general query not refreshing R or the port, R ignoring the Leave timer, IGMP with snooping off, a
  member of two groups, R forwarding for any group, the 224.0.0.0/24 boundary, the `min` on a Leave, the leave mark,
  the refresh event, unregistered traffic dropped); eight tests were added and each of those now fails a test. The
  reviewer's note on the second group-specific query is under *(check)*.
- A node run of every script × snooping × key printed the forwarding sets per step; they match SPEC.md.
- `npm run gate -- multicast-igmp`: pass. Screenshots reviewed: 1920×1080 light, dark, grayscale (hr and en), 375×812
  (hr and en), and each preset at its key step in hr and en.

## Time

Start 2026-11-08 18:48 CET; done 19:12 CET (gate pass, fresh review and its tests, notes): about 25 minutes of wall
clock in one session (the RFC check and the fresh review ran as parallel agents).
