# stp: Spanning tree

| | |
|---|---|
| Task | `stp` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-stp` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/stp/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `switching` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **root bridge election, port roles, which port blocks the loop**.

The student: step BPDUs; break a link and watch reconvergence.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže), "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra": only the *broadcast* oluja paragraph (STP is not in the book; no ch07 diagram covers it)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md` T06 "VLAN-ovi, mostovi i udruživanje sučelja" (Linux bridge, `stp_state`; topic named, no text yet)
- IEEE 802.1D-2004, *Media Access Control (MAC) Bridges*, clause 17 (RSTP) and the 802.1D-1998 clause 8 STP it replaced (BID, priority vector, port roles, timers, path costs)
- IEEE 802.1Q-2018 clause 13 (current home of spanning tree), for the long path-cost table
- Catalogue seed: URM ch07 → §5.10 (wrong for STP itself, see the note in Model and presets)

## Overlaps (catalogue §5)

- **§5.10 Switching loops:** One page: the storm is step 1 (STP off), STP is step 2.

## Model and presets

- **Scene:** K2 topology: three switches S1, S2, S3 in a triangle (preset 5: two switches with two parallel
  links), one host on S1 and one on S3. Each switch shows its bridge ID (priority.MAC) and, per port, a role
  badge (R root, D designated, ✕ blocked) and a state (blocking, listening, learning, forwarding). BPDUs
  travel as small envelopes labelled {root BID, cost, sender BID, sender port}. A side panel lists each
  switch's best BPDU so far; a timer shows seconds since the change for the reconvergence preset.
- **State:** `{ t, round, stpOn, bridges: [{id, prio, mac, rootId, rootCost, rootPort}], links: [{a, pa, b,
  pb, cost, up}], ports: [{bridge, port, role, state, stored}], inFlight: [bpdu], event }`.
- **One step:** one BPDU round (every designated port, or at start every port, sends; then every receiver
  compares), or, once roles are stable, one port-state timer stage (+15 s). Order within a round: send →
  receive and store if superior → recompute root, root port, designated ports → update badges → caption.
- **Rules** (IEEE 802.1D-2004 clause 8/17 terms; classic STP, not RSTP):
  1. Bridge ID = 16-bit priority (default 32768) followed by the 48-bit MAC; a lower BID is better. Every
     switch starts by claiming to be root (IEEE 802.1D; Linux bridge default priority 0x8000).
  2. BPDUs are compared in order: lowest root BID, then lowest root path cost, then lowest sender BID,
     then lowest sender port ID (priority 128 + port number). The first difference decides. (IEEE 802.1D
     "priority vector".)
  3. Root bridge = the lowest BID in the network. All its ports are designated.
  4. Each non-root switch picks one **root port**: the port with the lowest root path cost (cost advertised
     + cost of the receiving link). Tie → lowest sender BID → lowest sender port ID (the *neighbour's*
     port, not its own) → lowest own port ID.
  5. On each segment, the port with the best BPDU for that segment is **designated**: lowest root path
     cost, tie → lowest BID of its bridge → lowest port ID.
  6. Every port that is neither root nor designated is **blocked** (discarding): it still receives BPDUs
     but forwards no frames and learns no MACs.
  7. Port costs (802.1D-1998 short values, also the Linux bridge default): 10 Mb/s = 100, 100 Mb/s = 19,
     1 Gb/s = 4, 10 Gb/s = 2 (check against 802.1D-2004 long values 2 000 000 / 200 000 / 20 000 / 2 000;
     state which the page uses).
  8. Timers: hello 2 s, max age 20 s, forward delay 15 s. A port moving to forwarding passes listening
     (15 s) and learning (15 s). An inferior BPDU on a blocked port is ignored until the stored BPDU ages
     out (max age). Indirect failure total ≈ 20 + 15 + 15 = 50 s; a direct link failure skips max age
     (≈ 30 s). (IEEE 802.1D-1998 timers; check.)
  9. STP off: frames are flooded on all ports including the loop, and Ethernet has no TTL, so a broadcast
     never dies (URM ch07 "broadcast oluja"; §5.10).
- **Params:** `stp` toggle (default on); `prioS1`/`prioS2`/`prioS3` choice 4096…61440 in steps of 4096
  (default 32768); `cutLink` choice none / S1–S2 / S1–S3 / S2–S3 (default none, applies next step);
  `slowLink` choice none / S1–S3 at 100 Mb/s.
- **Presets** (MACs S1 …:01, S2 …:02, S3 …:03; all links 1 Gb/s, cost 4 unless noted):
  1. `no-stp` — STP off; host on S1 sends one broadcast: two copies circle the triangle in opposite
     directions forever and the host on S3 receives a new copy every round (§5.10 step 1). Derived.
  2. `triangle` — all priorities 32768. Root S1 (lowest MAC). S2 and S3 root ports face S1 (cost 4). On
     S2–S3 both offer cost 4; tie → S2 has the lower BID → S2's port designated, **S3's port toward S2
     blocks**. Derived, unchecked.
  3. `priority` — S3 priority 4096: S3 becomes root; on S1–S2 both offer cost 4, S1's BID is lower → **S2's
     port toward S1 blocks**. Derived, unchecked.
  4. `cost-wins` — S1–S3 at 100 Mb/s (cost 19). Root S1. S3: direct 19 vs via S2 4 + 4 = 8 → root port
     toward S2; on S1–S3 S1 is designated (cost 0) → **S3's port toward S1 blocks**, the slow link carries
     no traffic. Derived, unchecked.
  5. `port-id` — S1 and S2 joined by two links crossed: S1 p1–S2 p2 and S1 p2–S2 p1. Both cost 4, same
     sender BID, so the sender port ID decides: S1 p1 (128.1) wins → **S2's root port is p2**, S2 p1
     blocks. Derived from rule 4, unchecked.
  6. `reconverge` — start from `triangle`, cut S1–S2 at step 6. S2 loses its root port and claims root;
     S3 ignores S2's inferior BPDU on its blocked port until max age (t = 20 s), then that port goes
     listening (35 s), learning (50 s), forwarding; S2's new root port faces S3 (cost 8). Derived from rule
     8, (check) timers.
- **Steps:** `no-stp` 6; `triangle`/`priority`/`cost-wins` 7 (claims, 2 BPDU rounds, roles, listening,
  learning, forwarding); `port-id` 6; `reconverge` 7 + 6 = 13.
- **Legend:** root bridge (crown/★), root port (R, solid), designated port (D, outlined), blocked port (✕,
  hatched), BPDU envelope; "changed" marks the port whose role or state changed and the BPDU that caused it.
- **Captions:**
  - hr: "S3 na priključku prema S2 prima *BPDU* s istim troškom do korijena (4). Odlučuje niži ID mosta:
    S2 pobjeđuje, priključak na S3 prelazi u blokiranje."
  - en: "No BPDU from S1 for 20 s: the stored information ages out, so S3's blocked port starts listening.
    It forwards again only after 15 s listening and 15 s learning."
- **Terms:** spanning tree protocol — protokol razapinjućeg stabla (check: URM has no term); root bridge —
  korijenski most; bridge ID — identifikator mosta; root port — korijenski priključak; designated port —
  određeni priključak; blocking — blokiranje; path cost — trošak puta; broadcast storm — *broadcast* oluja
  (URM ch07).
- **Misconceptions:** the switch with the highest or lowest *number* of ports or the "best" hardware becomes
  root (it is the lowest BID); the port with the highest cost always blocks (preset 2 blocks on a tie);
  STP chooses by the receiving switch's own port ID (preset 5).
- **Host for `broadcast-storm`:** that task adds presets `storm`, `no-loop` and `router-boundary` here, so the
  model must support from the start: STP off with frame copies tracked per step and a running count, a
  loop-free topology, a router node that does not forward broadcasts, and a topology with more than two
  inter-switch ports per switch (so copies multiply, not just circulate). Preset 1 `no-stp` is the minimal
  case; if `broadcast-storm`'s `storm` preset lands, it replaces preset 1.
- **Out of scope:** RSTP/MSTP, PortFast, BPDU guard, root guard, per-VLAN STP, TCN and MAC aging after a
  topology change.
- **Note for the coordinator:** the URM book does not cover STP at all (ch07 has only the broadcast storm,
  one paragraph), and NLA only names Linux bridges in T06. The catalogue seed "URM ch07" is wrong: every
  rule here rests on IEEE 802.1D and is marked derived; a reviewer with the standard should check rules
  2, 4, 7 and 8. `broadcast-storm` should be preset 1 of this page (§5.10), not a separate sim.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `stp` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh stp sims/stp` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/stp/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
