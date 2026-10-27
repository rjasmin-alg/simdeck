<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# link-aggregation: why one flow never exceeds one member link

One concept: **a bond of N member links sends every frame of one flow over the same member, chosen by a hash of the
frame's headers, so one flow never gets more than one member's speed; the bond balances by hash, not by load.** An
explorer: the params drive the drawing live.

Task: `docs/tasks/w3/link-aggregation.md`. Catalogue: `net-link-aggregation` (§4.1).

## Scene

Left to right: up to 8 clients C1…C8 (each with MAC, IP and a source port), switch SW, N member links of 1 Gbit/s
(N = 2…4) drawn as numbered lanes, server S (the far end of the bond). Each flow is a coloured strand from its
client into SW and on into exactly one lane. A lane is drawn as a pipe whose height is 1 Gbit/s: the strands on it
are stacked bands whose height is their rate, the rest is hatched (idle capacity). Over each lane: its number, its
load (Gbit/s of 1) and the flows on it. A failed lane is dashed, crossed (✕) and empty.

Traffic goes from the clients to S, so SW is the end that picks the member for every frame (S does the same for
what it sends; it is not shown). The left table is the hash calculator: per flow the header fields, the hash, the
hash mod (number of up members), and the member it gives. Fields the policy does not read are struck through.

Under the drawing: offered load (sum of demands), delivered (sum of rates), the fastest single flow, and the bond's
capacity (up members × 1 Gbit/s).

Seeded values (chosen so the presets show the task's cases; any values would obey the same rules):

| | MAC | IP | source port |
|---|---|---|---|
| S (destination) | 02:00:00:0b:00:**10** | 192.168.10.**10** | (destination port 5000) |
| C1 | 02:00:00:0a:00:**3a** | 192.168.10.**21** | 50612 |
| C2 | …:**5c** | .**22** | 51088 |
| C3 | …:**71** | .**23** | 49733 |
| C4 | …:**8e** | .**24** | 52310 |
| C5 | …:**24** | .**25** | 50944 |
| C6 | …:**9b** | .**26** | 53217 |
| C7 | …:**46** | .**27** | 49906 |
| C8 | …:**d2** | .**28** | 51475 |

With `sameClient` on, flow k (k = 1…8) is from C1 with source port 50611 + k (50612…50619); F1 is the same flow
either way.

## State (explorer)

Params `{ members, policy, flows, fail, sameClient, demand }` → derived
`{ members: [{ id, up }], up, flows: [{ id, client, srcMac, dstMac, srcIp, dstIp, srcPort, dstPort, demand }],
policy, hash, index, assignment: { flowId: memberId | null }, rate: { flowId: Mbit/s }, memberLoad: { memberId:
Mbit/s }, perMember, offered, delivered, fastest, capacity, bondDown, samePair, failover }`.

Rates are in Mbit/s inside the model (1 Gbit/s = 1000) and shown in Gbit/s; `demand` is the param in Mbit/s (100…1000,
step 100), shown as 0,1…1 Gbit/s.

## Rules

1. **One flow, one member.** Every frame of a flow carries the same headers, so it hashes to the same member and its
   order is kept; therefore one flow's rate never exceeds one member's 1 Gbit/s (IEEE 802.1AX: all frames of one
   "conversation" go over one link *(check)*; Linux `Documentation/networking/bonding.rst`, `xmit_hash_policy`
   *(check)*). Test: for every params combination, every flow has one member and rate ≤ 1000.
2. **Member = up[hash mod (number of up members)]**, the up members in id order. Hash, simplified for the stage
   (labelled "simplified" on the page; the kernel's formula folds more bits *(check)*):
   - `layer2`: last byte of src MAC ⊕ last byte of dst MAC.
   - `layer2+3`: the above ⊕ last octet of src IP ⊕ last octet of dst IP.
   - `layer3+4`: src port ⊕ dst port ⊕ last octet of src IP ⊕ last octet of dst IP.

   Worked: C1 → S, `layer2`: 0x3a ⊕ 0x10 = 0x2a = 42; 42 mod 2 = 0 → link 1. `layer2+3`: 42 ⊕ 21 ⊕ 10 = 53;
   53 mod 2 = 1 → link 2. `layer3+4`: 50612 ⊕ 5000 ⊕ 21 ⊕ 10 = 54819; 54819 mod 2 = 1 → link 2.
   **Tie-break:** two flows with the same inputs for the policy always share a member (C1's four ports under
   `layer2` and `layer2+3`).
3. **Sharing.** Flows on one member share its 1000 Mbit/s max-min fair, each capped by its own demand
   (water-filling: the smallest demands are met first, the rest split what is left equally). A member's spare
   capacity is never lent to flows hashed elsewhere (derived; idealised TCP sharing). **Tie-break:** equal demands
   get equal shares; the order of the flows does not change the result.
4. **Failure.** A failed member is removed and *every* flow is re-hashed over the remaining members (mod N − 1), so
   flows on healthy links can move too (bonding doc; LACP or link monitoring detects the failure, 802.1AX)
   *(check)*. No flow is dropped while one member is up. The page compares with the same settings and no failure:
   e.g. 3 members, 8 clients, `layer2`, link 2 failed: 7 of 8 flows move, 3 of them (F4, F7, F8) from healthy
   link 3.
5. **Tie-break (changed marks):** a flow is marked "changed" when its member differs from the state before the last
   input, matched by its headers (a new flow, or a different flow at the same position, is not "moved"; a flow
   with no link before or after, the bond down, did not move). If a new
   policy gives the same assignment, nothing moves and nothing is highlighted; the caption says so. Example: 4 flows
   from C1, `layer2` (all on link 1) → `layer2+3` (all on link 2) marks all four; 1 flow `layer2+3` → `layer3+4`
   (link 2 → link 2) marks nothing.
6. **Edge: every member down** (`fail = all`, added, see NOTES.md): no member, delivered 0, every flow unassigned;
   the caption says the bond is down.

## Presets (numbers from the model, checked with the python3 script in NOTES.md)

1. `one-flow`: 1 flow C1 → S, 2 members, `layer2`, demand 1: F1 on link 1 at 1 Gbit/s, link 2 idle; offered 1,
   delivered 1, capacity 2. "A 2 Gbit/s bond" ≠ 2 Gbit/s per transfer (rule 1).
2. `same-pair`: 4 flows from C1 (ports 50612…50615), `layer2`, demand 1: all on link 1, 4 × 0,25 Gbit/s, link 2
   idle, delivered 1 of offered 4. Switching to `layer3+4`: F1, F3 on link 2, F2, F4 on link 1 (hashes 54819,
   54818, 54817, 54816), 2 × 0,5 + 2 × 0,5, delivered 2; `layer2+3` moves all four to link 2 together (53 mod 2).
3. `many-clients`: 8 clients, 2 members, `layer2`, demand 0,2: link 1 has F1 F2 F4 F5 F7 F8 (6 flows, 1,2 Gbit/s
   wanted → 6 × 0,167, full), link 2 has F3 F6 (2 × 0,2 = 0,4, 0,6 spare); offered 1,6 < capacity 2, delivered 1,4.
   **Deviation:** the task's example is 5 + 3; the seeded MACs give 6 + 2, and demand 0,2 (not 1) makes the point
   that the bond had room for everything (with demand 1 both links would simply be full).
   Under `layer2+3` the same flows split 4 + 4 and all 1,6 is delivered.
4. `fail`: preset 3 with link 2 failed: all 8 on link 1, 8 × 0,125 Gbit/s, delivered 1; F3 and F6 moved from the
   failed link, nobody disconnected.
5. `four-links`: 3 flows (C1…C3), 4 members, `layer2`: F1 → link 3, F2 → link 1, F3 → link 2 (hashes 42, 76, 97
   mod 4 = 2, 0, 1); link 4 idle; delivered 3 of capacity 4. With 3 flows on 4 links at least one link is idle under
   any hash.

## Captions (language-neutral codes; the page writes them)

A caption is a change sentence (when there is one) plus a situation sentence:

- `down`: every member down → "all member links down: the bond is down, 0 delivered, n flows wait".
- `failover` (fail ≠ none, a member up): "link k failed: the flows were re-hashed onto the remaining links; m are on
  another link than without the failure (j of them from working links); no transfer was cut" — or, with one link
  left, "all n flows were re-hashed onto link k and now share its 1 Gbit/s (n × r)". Then the totals. The count is
  against the same settings with no failure (rule 4), so it does not depend on what was on screen before; the
  highlights still compare with the last input (rule 5), so after e.g. `fail` → link 1 the two can differ.
- `moved` (history): "m flows changed link" after a param change.
- `same` (rule 5): the policy alone changed and nothing moved → "same assignment: nothing moved". When other params
  changed in the same input (a preset, reset), this sentence is not shown.
- Situation, first that applies: one flow (`oneFlow`: one link, others idle, "N × 1 Gbit/s is not N Gbit/s per
  transfer"); all flows read the same inputs (`samePair`); fewer flows than up links (`fewer`); an idle link
  (`idle`); a full link with spare elsewhere (`uneven`); otherwise totals (`even`).
