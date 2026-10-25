<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# stp: spec

One concept: **root bridge election, port roles, and which port blocks the loop** (task `docs/tasks/w2/stp.md`,
catalogue `net-stp`, §4.1 and §5.10). Classic spanning tree (IEEE 802.1D-1998 clause 8), not RSTP. Every rule below
is marked *derived* where it rests on the standard rather than a course book: the URM book has no STP text (only the
broadcast-storm paragraph in ch07), and the NLA syllabus only names Linux bridges and `stp_state` (T06).

## Scene

- **triangle** (presets 1–4, 6): switches S1, S2, S3, MACs `02:00:00:00:00:01` … `:03`, every priority 32768
  unless a param changes it. Links, all 1 Gb/s (cost 4) unless noted:
  S1 p1 – S2 p1, S1 p2 – S3 p1 (`slowLink`: 100 Mb/s, cost 19), S2 p2 – S3 p2. Host H1 on S1 p3, host H3 on S3 p3.
- **pair** (preset 5): S1 and S2 joined twice, crossed: link L1 = S1 p1 – S2 p2, link L2 = S1 p2 – S2 p1. H1 on S1
  p3, H2 on S2 p3. The kit view K2 draws one line between two cards, so each of the two links runs through its own
  segment card (L1, L2); a BPDU on it is drawn on both halves.
- Host ports are switch ports like any other (designated, they go through listening and learning); hosts send no
  BPDUs and the page draws no BPDU towards a host.
- The page writes a BID as `32768.…:01` and, on BPDUs, the switch's name in place of its BID.

## Rules (IEEE 802.1D-1998 clause 8 / 802.1D-2004 clause 17 terms; derived)

1. **Bridge ID** = 16-bit priority (default 32768 = 0x8000, also the Linux bridge default) followed by the 48-bit
   MAC. Lower is better. Modelled as 16 hex digits compared as a string (`8000020000000001`). At power-on every
   switch claims to be root.
2. **BPDU compare** (priority vector): lowest root BID, then lowest root path cost, then lowest sender BID, then
   lowest sender port ID; the first difference decides. Port ID = priority 128, then the port number
   (128.1 = 0x8001).
3. **Root bridge** = the lowest BID in the network. All its ports are designated.
4. **Root port**, one per non-root switch: the port whose received BPDU gives the lowest (root BID, advertised cost
   + cost of the receiving link, sender BID, sender port ID, own port ID). So on equal cost the lower sender BID
   wins, then the lower **sender's** port ID (the neighbour's, not its own), and only then its own port ID.
5. **Designated port**, one per link: the port whose bridge's own offer (root, root cost, own BID, own port ID) beats
   what the port has received. Equal cost → lower BID; equal BID (a cable looped back into one switch) → lower port
   ID. A designated port then holds its own bridge's information (802.1D: designated port = own information).
6. Every port that is neither root nor designated is **blocked** (discarding): it still receives BPDUs, forwards
   no frames and learns no MACs.
7. **Path cost**, 802.1D-1998 short values, also the Linux bridge default: 10 Mb/s = 100, 100 Mb/s = 19,
   1 Gb/s = 4, 10 Gb/s = 2. The page uses these. 802.1D-2004 / 802.1Q long values for the same speeds are
   2 000 000, 200 000, 20 000, 2 000 *(check: from the task file, not verified against the standard offline)*; the
   long values give the same choices in every preset here (19 vs 4 + 4 becomes 200 000 vs 20 000 + 20 000).
8. **Timers**: hello 2 s, max age 20 s, forward delay 15 s *(check)*. A port selected root or designated leaves
   blocking for listening; after 15 s it goes to learning, after 15 s more to forwarding. A port that loses its role
   goes back to blocking at once. A forwarding port that changes between root and designated stays forwarding.
   **Receive:** a port stores a BPDU that is better than or equal to what it holds (802.1D-1998 8.6.2
   "supersedes"; equal = a refresh); a worse one is ignored, even from the same sender, until the stored one ages
   out: max age after it was last refreshed. **Relay:** the root sends on its designated ports every hello; a
   non-root switch sends on its designated ports when its root port heard a BPDU at the previous hello (802.1D-1998:
   a non-root bridge transmits on receiving from the root). A switch that has just become root sends at once.
   Indirect failure ≈ 20 + 15 + 15 = 50 s; direct failure (the switch's own root port goes down and it already holds
   an alternative) ≈ 15 + 15 = 30 s.
9. **STP off**: a switch floods a broadcast out of every port except the one it came in on, and an Ethernet frame
   has no TTL, so on a loop the broadcast never dies (URM ch07, "broadcast oluja" paragraph; catalogue §5.10). A
   router does not forward a broadcast (it ends the broadcast domain); on a loop-free topology the flood ends.

## One step

- **STP on.** Time runs in 1 s ticks; a step runs ticks until one changes something (a root, root port, role, port
  state, stored BPDU, a link), and also stops at the hello right after a change by BPDUs (it shows that the round
  after changes nothing: "stable"). Tick order: age out → recompute roles → BPDU round on even seconds (all sends
  taken from the state before any receive; receive and store if superior or equal) → the scheduled cut, then a
  switch that has just become root sends → recompute → port timers.
  - Step 1 (t = 0 s) is the **claims**: every switch sends on every port.
  - In this model a relayed BPDU moves one hop per hello (it is relayed at the hello after it arrived). In the
    triangle every switch is one hop from the root, so no number on the page depends on it.
  - Stored information ages from the second it arrived, not from the BPDU's message age (802.1D counts the message
    age carried in the BPDU, so a real port further from the root expires a little earlier). Same reason: in the
    triangle the stored BPDU on S3 p2 is fresh at the cut, so it expires 20 s later either way.
  - Receive is slightly stricter than the Linux bridge's supersedes check: a BPDU from the same bridge with equal
    root and cost but a higher sender port ID is ignored. No scene here sends one.
- When nothing can change any more (no port timer running, no cut to come, nothing ages out within max age +
  a hello), the **last step** sends one broadcast from H1 over the tree: a switch forwards a frame that came in on a
  forwarding port out of every other forwarding port; a frame that reaches a port that is not forwarding is
  discarded there.
- **STP off.** One step: every frame on the wire arrives; every switch that got one floods it on, all from the same
  snapshot (copies made in a step move in the next). A host counts the copies it receives.
- `cutLink` cuts the link at **t = 40 s**, right after that second's hello (10 s after the tree forwards).

## Presets and expected numbers (derived; each number is asserted in `sim.test.js`)

| # | id | params | expected |
|---|---|---|---|
| 1 | `no-stp` | STP off | in flight per step 1, 2, 3, 3, 4, 3; after 6 steps H3 has 3 copies, H1 2 (its own broadcast back); never 0 |
| 2 | `triangle` | defaults | root S1; S2 and S3 root port p1 (towards S1), cost 4; S2–S3 tie on cost 4 → S2 (lower BID) designated, **S3 p2 blocks** at t = 2 s |
| 3 | `priority` | S3 priority 4096 | root S3; S1 and S2 root port p2 (towards S3), cost 4; S1–S2 tie on cost 4 → S1 lower BID → **S2 p1 blocks** |
| 4 | `cost-wins` | S1–S3 at 100 Mb/s | root S1; S3 after the claims has root port p1 (cost 19); at t = 2 s via S2 4 + 4 = 8 → root port p2; S1 p2 designated (cost 0) → **S3 p1 blocks**: the slow link carries nothing |
| 5 | `port-id` | pair | S2 hears S1 on p2 (sender 128.1) and p1 (sender 128.2), both cost 4, same sender → **root port p2**, p1 blocks (its own offer, cost 4, loses to S1's cost 0) |
| 6 | `reconverge` | triangle, cut S1–S2 | t = 40 s cut: S2 loses its root port, claims root, its BPDU ⟨S2, 0, S2, 128.2⟩ is ignored on S3 p2 (holds ⟨S1, 4, S2, 128.2⟩); t = 42 s still ignored; **t = 60 s** (20 s after the cut) S3 p2 ages out → designated, listening; S3's BPDU ⟨S1, 4, S3, 128.2⟩ makes S2 p2 its root port, cost 8 (S2 p2 stays forwarding); t = 75 s (35 s) learning; **t = 90 s (50 s)** forwarding |

Other cuts (param): S1–S3 is a direct failure for S3: at 40 s its root port moves to p2 (it already holds S2's
BPDU), listening; learning at 55 s, forwarding at 70 s (**30 s**), no max age. S2–S3 removes the blocked link:
nothing changes.

**Steps:** `no-stp` 6; `triangle`, `priority`, `cost-wins` 6 (claims, round, stable, learning, forwarding,
broadcast); `port-id` 5 (claims already decide; stable, learning, forwarding, broadcast); `reconverge` 12 (5 + cut,
still ignored, aged, stable, learning, forwarding, broadcast). Every param combination stays ≤ 20 (tested).

## Broadcast storm presets (task `docs/tasks/w3/broadcast-storm.md`, catalogue `net-broadcast-storm`, §5.10)

One concept on this page's STP-off side: **one broadcast multiplies forever in a switched loop**. The storm presets
run with STP off; the STP-on contrast is the host's own `triangle` preset (task preset `stp-on`, §5.10 "STP is step
2"), so it is not added again.

### Scenes

- **mesh** (preset `storm`): the triangle (same ports, H1 on S1 p3, H3 on S3 p3) and S4 in its middle, linked to all
  three: S1 p4 – S4 p1, S2 p3 – S4 p2, S3 p4 – S4 p3 (a square with both diagonals). Every switch has three ports into
  the loop.
- **tree** (preset `no-loop`): the triangle without S2–S3; H1 on S1 p3, H2 on S2 p3, H3 on S3 p3.
- **routed** (preset `router-boundary`): the triangle with H1 on S1 p3; S3 p3 – router R – S4 p1; H4 on S4 p2.

### Rules (task numbering; sources in brackets)

1. A switch forwards a broadcast out of every port except the one it arrived on, always (URM ch07, broadcast-domain
   paragraph: "preplavljuje ga na sve priključke … uvijek").
2. An Ethernet frame has no TTL: nothing in the frame stops it (URM ch07, broadcast oluja paragraph; derived contrast
   with IP's TTL). The model's frame has no counter at all.
3. With a loop, copies multiply **only where a switch has three or more ports into the loop**: a copy arriving there
   leaves on two (or more) loop ports. On the triangle each switch has one other loop port, so the copies only circle
   (two of them, one each way) and the in-flight count stays flat; every lap still delivers a copy to every host.
   *Derived* (the URM book has no frame counts, and its storm paragraph describes one device sending broadcasts
   without end, not a loop). This corrects the task file's "triangle: 1 → 2 → 4 doubling", which a script showed is
   wrong (see Numbers).
4. A router does not forward a broadcast: each network behind a router is its own broadcast domain, and a storm in
   one never reaches the other (URM ch07: "Granicu tom širenju postavlja jedino usmjernik"). The router does not
   stop the loop in its own network: STP does. The model counts a copy sent to the router as discarded there.
5. With STP on, the blocked port discards the copy that reaches it, so each switch gets the broadcast once (IEEE
   802.1D *(check)*; rule 6 of the host and the host's `triangle` preset).
6. **Tie-break / determinism:** in a step every switch floods from the same snapshot: copies made in a step move in
   the next one, so the order of frames on the wire never changes a count, and step back replays exactly.
7. On a loop-free tree one broadcast reaches every host once and the flood ends (URM ch07, Primjer 2: flooding
   reaches hosts unrelated to the conversation, once).

### One step (STP off)

Every frame on the wire arrives; every switch that got one floods it on (rule 1, from one snapshot, rule 6); a frame
sent to a host or router counts as received there at the step it is sent. At step 1 H1 puts its broadcast on the
wire; the page's **N** (param `inject`, a list of steps "4,7") makes H1 send another at the next step (steps 2–18
only; one planned after the cap is never sent). `inFlight` counts every frame on a wire, `inLoop` those between two
switches, `total` all sent so far.

The run ends: when `inFlight` is **above the cap** (`cap` 16 | 32 | 64 | 128, default 64; `end: 'cap'`,
`cappedAt`; "and so on, without limit"), or after the last further broadcast when nothing is in flight (`'over'`), or
after the scene's steps on a loop whose copies only circle (triangle and routed: 6, or two past the last further
broadcast; `'limit'`). Never more than 20.

### Numbers (checked by script before coding, asserted in `sim.test.js`)

| preset | scene | in flight per step | between switches | end |
|---|---|---|---|---|
| `no-stp` (host) | triangle | 1, 2, 3, 3, 4, 3 | 0, 2, 2, 2, 2, 2 | 6 steps; H3 3 copies, H1 2 |
| `storm` | mesh, cap 64 | 1, 3, 7, 14, 32, 60, 116 | 0, 3, 6, 12, 24, 48, 96 (doubles) | step 7, 116 > 64; H1 18, H3 25 |
| `storm`, cap 16 / 32 / 128 | mesh | as above | as above | steps 5 / 6 / 8 |
| `no-loop` | tree | 1, 2, 2, 0 | 0, 2, 0, 0 | step 4; H2 1, H3 1 |
| `router-boundary` | routed | 1, 2, 3, 3, 4, 3 | 0, 2, 2, 2, 2, 2 | 6 steps; R discarded 3, H4 0 |
| `triangle` (host), STP on | triangle | broadcast waves 1, 2, 2 (one dropped at S3 p2) | | 4 segments carry it |

The task's step estimates were 8 (`storm`), 4, 6: `storm` has 7 at the default cap.

## Marks

- A port whose role or state changed this step: its row in the side table is highlighted (kit changed mark); a
  stored BPDU that changed or aged out: its cell. A switch that changed anything: thick border on its card and its
  block.
- An ignored BPDU ends in a cross at the receiver (K2 `drop`); a discarded broadcast copy likewise.
- Link: dashed and muted when one end blocks (K2 `off`), cross when cut (`down`), ink when both ends forward.
- Role badges: R solid, D outlined, ✕ hatched in the danger colour, – dashed (disabled); link ends say `p1 R`.

## Sources

- IEEE 802.1D-1998 clause 8 (STP: BID, priority vector, port roles, timers, short path costs, "supersedes"),
  IEEE 802.1D-2004 clause 17 (RSTP, long path costs), IEEE 802.1Q-2018 clause 13: from the task file; not read
  offline here, so rules 2, 4, 7 and 8 are *(check)* for a reviewer with the standard.
- URM `book/chapters/07-podatkovni-sloj.md`, "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra", the
  broadcast oluja paragraph (rule 9), the broadcast-domain paragraph (storm rules 1 and 4) and Primjer 2 (storm
  rule 7).
- NLA `meta/toc.md` T06 "VLAN-ovi, mostovi i udruživanje sučelja" (topic only).
