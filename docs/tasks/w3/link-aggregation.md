# link-aggregation: Link aggregation and flow hashing

| | |
|---|---|
| Task | `link-aggregation` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-link-aggregation` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/link-aggregation/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `link-aggregation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **why one flow never exceeds one member link**.

The student: add flows, change the hash, fail a link.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T06 "VLAN-ovi, mostovi i udruživanje sučelja" (Napredna Linux administracija; chapter not written yet, no worked example)
- No URM text: grep of `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/` finds no link aggregation, LACP or bonding.
- Linux kernel documentation `Documentation/networking/bonding.rst` (modes, `xmit_hash_policy` layer2 / layer2+3 / layer3+4) (check)
- IEEE 802.1AX (Link Aggregation, LACP; formerly 802.3ad) (check)
- Catalogue seed: NLA T06

## Model and presets

- **Scene:** a server S (Linux bond `bond0`, or a switch port-channel) joined to switch SW by N parallel member
  links of 1 Gbit/s each, drawn as N lanes. Left: up to 8 clients (C1…C8, each with MAC and IP) and their flows;
  each flow is a coloured strand that enters exactly one lane. Under each lane: its load bar (Gbit/s, 0–1) and
  the list of flows on it. A summary line: aggregate offered load, aggregate delivered, and the fastest single
  flow.
- **State (derived live, explorer):** `{ members: [{ id, up }], flows: [{ id, srcMac, dstMac, srcIp, dstIp,
  srcPort, dstPort, demand }], policy, assignment: { flowId: memberId }, rate: { flowId: Gbit/s },
  memberLoad: { memberId: Gbit/s } }`.
- **What the params drive:** adding flows, changing the hash policy, the member count, or failing a member
  recomputes the assignment and the rates at once; the strands that moved lanes get the "changed" mark.
- **Rules:**
  1. Every frame of one flow hashes to the same member link, so its order is kept; therefore one flow can never
     use more than one member's speed (IEEE 802.1AX "conversation" to one link; Linux kernel
     `Documentation/networking/bonding.rst`, `xmit_hash_policy`).
  2. Member index = hash mod (number of up members). Hash inputs by policy (Linux bonding doc, simplified for the
     stage (check)):
     - `layer2`: last byte of src MAC XOR last byte of dst MAC.
     - `layer2+3`: the above XOR last octet of src IP XOR last octet of dst IP.
     - `layer3+4`: src port XOR dst port XOR last octet of src IP XOR last octet of dst IP (teaching
       simplification of the kernel's formula (check)).
  3. Sharing: flows on the same member share its 1 Gbit/s equally (max-min fair, each capped by its own demand);
     a member's spare capacity is never lent to flows hashed elsewhere (derived; idealised TCP sharing).
  4. Failure: a failed member is removed and all flows are re-hashed over the remaining members (mod N−1), so
     flows that were on healthy links can move too (bonding doc; LACP detects the failure, 802.1AX) (check).
  5. Tie-break: if two policies give the same assignment, nothing moves and nothing is highlighted.
  6. Edge: with every member down, delivered = 0 and the caption says the bond is down.
- **Params:** `members` range 2–4 default 2; `policy` choice `layer2` | `layer2+3` | `layer3+4` default `layer2`;
  `flows` range 1–8 default 1 (flows added in a fixed order from a seeded list of clients/ports); `fail` choice
  `none` | `link1` | `link2` default `none`; `sameClient` toggle default off (all flows from C1, different
  source ports); `demand` range 0.1–1 Gbit/s step 0.1 default 1.
- **Presets:**
  1. `one-flow` — one backup flow C1 → S on 2 × 1 Gbit/s: 1 Gbit/s delivered, link 2 idle; "2 Gbit/s bond" ≠
     2 Gbit/s per transfer. Derived from rule 1.
  2. `same-pair` — 4 flows, all from C1 (different ports), `layer2`: same MAC pair → all on one link, 4 × 0.25
     Gbit/s, total 1 Gbit/s. Switch to `layer3+4`: spread 2 + 2 (or as the hash gives), total 2 Gbit/s.
     Derived, unchecked: give the exact assignment from the model's hash in `SPEC.md`.
  3. `many-clients` — 8 clients, `layer2`, 2 members: flows split by client MAC; with the seeded MACs the split is
     uneven (e.g. 5 + 3), so one link is full and the total stays below 2 Gbit/s. Derived; numbers from the model.
  4. `fail` — preset 3 with `fail = link2`: all 8 flows on link 1, 8 × 0.125 Gbit/s; total 1 Gbit/s; nobody
     disconnected. Derived.
  5. `four-links` — 3 flows on 4 members: at least one member idle whatever the hash; adding links does not help
     fewer flows than links. Derived.
- **Steps:** none (explorer).
- **Legend:** member link (lane, numbered), flow strand (series colour + flow label), idle capacity (hatched),
  failed link (danger ✕, dashed). "Changed" marks flows whose member changed since the last param change.
- **Captions:**
  - hr: "Veza 1 nosi 4 toka po 0,25 Gbit/s, veza 2 miruje: s pravilom `layer2` svi tokovi istog para MAC adresa
    idu istom vezom."
  - en: "Link 2 failed: all 8 flows were re-hashed onto link 1 and now share 1 Gbit/s; no connection dropped."
- **Terms:** link aggregation — udruživanje sučelja (NLA T06 title); member link — članska veza (check); bond —
  *bond* (udruženo sučelje) (check); flow — tok; hash — sažetak (*hash*) (check); load balancing — raspodjela
  opterećenja (check); LACP — LACP (protokol za udruživanje veza) (check).
- **Misconceptions:** two 1 Gbit/s links make one 2 Gbit/s pipe for every transfer; the bond balances by load
  (it balances by hash, blindly); a failed member breaks the flows on it (they move).
- **Out of scope:** LACP PDU exchange and timers, `balance-rr` and `balance-alb` modes, MLAG across two switches,
  receive-side balancing on the switch, packet reordering.
- **Note for the coordinator:** the NLA chapter (T06) is not written, so no worked numbers exist yet; the hash formulas are simplified and must be labelled as
  such on the page.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `link-aggregation` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh link-aggregation sims/link-aggregation` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/link-aggregation/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
