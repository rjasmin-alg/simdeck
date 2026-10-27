<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-ndp: notes

New stepper (task `docs/tasks/w3/ipv6-ndp.md`, catalogue `net-ipv6-ndp`, §4.1, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. Drawn with kit view **K2, topology with moving packets** (`kit/topology.js`), one
topology per lane.

## Decisions

- **Layout.** One lane per protocol, IPv4 on top, IPv6 below (rows 48 : 52, the IPv6 cards and tables are taller).
  Each lane: a head line (name, "sada" on the lane of this step, the counter with the hosts whose CPU looked, `t`,
  the RetransTimer), the K2 topology (A, B, C on a bus; a card filter in each card; the ARP table or neighbour cache
  under each host) and the frame card ("Na žici") on the right with the kit's nested headers. The forged run has
  one lane with A, B, R and the off-link X, so the frame card goes under the topology (`nd-stack`).
- **Same three hosts in both lanes**, one NIC each, so one MAC each: the comparison is the protocol, not the
  hosts. With `collide`, C's MAC changes in both lanes (its interface ID is EUI-64 from that MAC).
- **MACs.** B's comes from the book's `fe80::204:61ff:fe9d:f156` (EUI-64 reversed); A's and C's from the RFC 7042
  documentation block, as in `ipv6-slaac`; C's collide MAC from the task's `fe80::1234:56ff:fe9d:f156`.
- **The card filter** ("Kartica prima") lists the MACs a card passes up; its first entry is the host's own MAC, so
  the card shows no separate MAC line (room). In the step the frame reaches the cards, the matching MAC is
  highlighted; a card with no match gets the badge "kartica odbacuje" and its host mark goes hollow (dashed).
- **Events.** One event per step: `miss`, `req`, `filter` (which cards take it; the counter goes up here), `check`
  (who answers; the owner caches the asker), `reply`, `cache`. With both lanes the events alternate, IPv4 first.
  An absent target has no `check` step (no IPv6 card takes the NS; in IPv4 "not mine" is shown in `filter`), so
  both lanes have 8 events and stay aligned in time (0, 1, 2, 3 s).
- **The NS's frame stays on the wire** (arrows without chips) through `filter` and `check`, as `arp-local-remote`
  keeps the ARP request while everyone hears it; the reply's through `cache`.
- **The owner caches the asker as STALE** (RFC 4861 §7.2.3) and the ARP target adds the asker (RFC 826): both are
  shown, so the lanes match.
- **Chips on the wire**: colour 1 dashed border = broadcast, 2 dotted = multicast, 3 solid = unicast; the legend has
  the same chips. Host marks use colours 4–6, 8. The kit draws every arrow in ink (broadcast dashed); the bus lane is
  3.7rem so the arrow sits clear of the bus line.
- **Counter**: how many times a CPU had to look at a request, summed over the run (absent with both lanes: IPv4 6,
  IPv6 0).
- **Preset entries** in `sim.json`: `absent` and `forged`, so a course can list "nobody answers" or "hop limit 255"
  on their own.
- **Model copied, not shared**: `models/` has no IPv6 address model yet, so `parse`, `compress`, `eui64` (trimmed:
  groups only), `withIid` (simplified) and `solicitedNode` are copied from `sims/ipv6-slaac/sim.js @ 06c1f7e`
  (COMMON.md §6). `multicastMac` (RFC 2464 §7), `hosts`, `nicAccepts`, `nsVerdicts` and `ndpValid` are new; all
  pure, over plain data, no strings: promotable as they are.

## Deviations from the task

- **`same-group` is 6 steps, not 8**: it runs the IPv6 lane only (`lanes: v6`, which is what the `lanes` param is
  for), and a found target is six events per lane like every other run. The comparison with ARP is the default
  preset.
- **`forged` is 4 steps, not 5, and the hop limit is 255 → 254, not 64.** The forger X sits behind a router R and
  sets 255 itself; R lowers it to 254 on the way, and A drops it. That shows *why* the check stops off-link senders
  (a message that crossed a router can never carry 255), where "64" would only show that 64 ≠ 255. Steps: X sends,
  R forwards (254), A's card takes it (own MAC), A drops it (B's entry kept). A starts with B REACHABLE from an
  earlier lookup, so the forged NA (O = 1) is a real override attempt; it is addressed to A's global address
  `2001:db8:1:0:200:5eff:fe00:530a` because a router does not forward link-local destinations (RFC 4291 §2.5.6). C
  is left out of this run (it plays no part, and four columns need the room).
- **Added param `forged`** (toggle), needed to reach the `forged` preset; with it on, `target`, `collide` and `lanes`
  are disabled with the reason.
- **"oglas susjeda" for neighbour advertisement, not "objava susjeda"** as the task's term list says: the merged
  sibling `ipv6-slaac` uses "oglas susjeda" (and "oglas usmjernika" for RA); two names in one deck would confuse.
  Both are *(check)*; the owner should pick one for the glossary (report).
- **ARP with no answer** (both lanes, `target: absent`) retries three times 1 s apart like NDP: ARP itself defines
  no retries, RFC 1122 §2.3.2.1 only caps the rate at one per second. *Model choice, check.*
- **The task's Croatian caption** is used for the IPv6 `filter` step of the default run (`capVs`), with the hosts as
  placeholders; the English one likewise.

## Sources

- URM `book/chapters/10-ipv6.md`: "Šire o temi" (NDP = ARP + RDISC + Redirect, the RFC 4861 quote), Primjer 1
  (`fe80::204:61ff:fe9d:f156`).
- URM `book/chapters/08-mrezni-sloj.md`: "ARP: od IP adrese do MAC adrese", Primjer 5 (A, B, C on 192.168.1.0/24);
  diagram `ch08-arp-zahtjev-odgovor.svg` (dashed to all, solid back: the same convention).
- RFC 4861 §1, §4.3, §4.4, §7.1.1–7.1.2, §7.2.1–7.2.5, §7.3.2, §10; RFC 4291 §2.5.1, §2.5.6, §2.7.1; RFC 2464 §4,
  §7; RFC 826; RFC 1122 §2.3.2.1; RFC 8200 §3 (hop limit decremented by each node that forwards); RFC 7042 §2.1.1.
- Numbers checked with Python's `ipaddress` before coding: every link-local, solicited-node group and multicast
  MAC in SPEC.md, the MACs read back from B's and C's interface IDs, A's global address.

## Unchecked *(check)*

- RFC section numbers from memory of the RFC texts (no network in this session); the URM chapters' quotes agree.
- ARP retry count (above). "address unreachable" is ICMPv6 type 1 code 3 (RFC 4443 §3.1), from memory.
- Croatian terms marked *(check)* below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| Neighbor Discovery Protocol (NDP) | otkrivanje susjeda | URM ch10 |
| neighbour solicitation | traženje susjeda | task, `ipv6-slaac` *(check)* |
| neighbour advertisement | oglas susjeda | `ipv6-slaac`; task says "objava susjeda" *(check)* |
| solicited-node multicast address | multicast adresa traženog čvora | task *(check)* |
| neighbour cache | tablica susjeda | task *(check)* |
| ARP request / reply | ARP zahtjev / ARP odgovor | URM ch08 |
| ARP table | ARP tablica | URM ch08 |
| link-local address | link-local adresa | URM ch10 |
| network card (NIC) | mrežna kartica | simdeck |
| hop limit | hop limit (untranslated) | simdeck *(check)* |

## Checks

- Tests: 21 (three tie-breaks first, rules 1–8, the hop-limit check at the asker and the refresh-not-duplicate
  branches on crafted states, ARP with no owner, lane order, step counts and counters, then the generic block over
  eight param sets). A scripted mutation pass broke 23 things once each (broadcast filter,
  solicited-node bits, multicast MAC bits, the card filter's groups, NS hop limit, INCOMPLETE, "any member answers",
  STALE, ARP non-target learning, S flag, NA unicast, hop-limit check, router decrement, 3 solicits, delete at give
  up, retransmit times, timer stop, counter, lane order, collide, U/L flip, forged override, global's group): every
  one failed a test.
- Browser sweep of every step of 9 runs (the four presets, `target: C`, `target: absent` with both lanes, `collide`,
  `target: C` with `collide` in one and two lanes) in both languages, at 1920×1080 and 375×812: 194 states each, no
  page scroll and nothing cut off in a lane or the frame card at 1920×1080, no sideways scroll on the phone, no
  `undefined`/`NaN`/`null`, no console errors.
- `npm run gate -- ipv6-ndp`: pass (63/63 browser checks). Screenshots looked at: light, dark, grayscale, phone,
  both languages, plus extra states (NS on the wire, filter, check, NA, cache, collide, absent, forged).

## Review

A fresh reviewer (separate agent, playbook §7.4) read the model and tests against SPEC.md and the RFCs (no wrong
fact or number), ran 38 mutations on a copy and read the page and strings. Fixed from it: the hollow host mark now
stays on every host whose CPU never looked, from the first time a request reached the cards (it showed only in
two steps); the legend's "CPU looked" swatch is ink, not B's colour; the explanation says the owner's entry for the
asker starts STALE; "X's MAC" is "the MAC X put in the advertisement"; "before any other check" is "whatever the
other fields say" (RFC 4861 §7.1.2 sets no order); the filter caption says "of multicast frames"; the forged run's
counter says "message"; captions take 1 s, 3 and 255 from the model (`L.C`); eleven surviving mutations (the forged
NA's fields, R's MAC, the forged counter, the kept mark, the NA source, the ARP reply's fields, the unreachable
branches) are now caught by new assertions and two tests on crafted states (`stepLane` exported). It agreed with the
three deviations above.

## Shared requests

- **kit/topology.js: a multicast arrow style.** Arrows are dashed (broadcast) or solid; multicast and unicast look
  the same. This page tells them apart by the chip (colour and a dotted border, page CSS keyed on `data-c`). A
  `cast: 'multicast'` (dotted) would let the arrow carry it too.
- **kit/topology.js: the arrow on a short bus lane** sits at a fixed 2.45rem from the lane top, so on a lane under
  ~3.5rem it lies on the bus line. Either place it relative to the bus, or document the minimum lane height.
- **kit/topology.js `table`: `li span { display: block }`** also hits spans nested in a cell; this page resets
  nested spans to inline to put the state on the MAC's line.
- **models/: an IPv6 address model** (`parse`, `compress`, `eui64`, `solicitedNode`, `multicastMac`) is now copied
  in two sims (`ipv6-slaac`, this one): ready to promote.
- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.

## Time

Start 10:51, done (model, page, sweeps, gate, mutation passes, fresh review and its fixes) 11:40: about 50 minutes,
one session.
