# lnx-bonding-modes: Bonding modes

| | |
|---|---|
| Task | `lnx-bonding-modes` (wave 3, Linux) |
| Catalogue entry | `lnx-bonding-modes` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-bonding-modes/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `link-aggregation` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `link-aggregation` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **active-backup vs balance vs 802.3ad**.

The student: fail links, send flows.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/link-aggregation/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T06 "VLAN-ovi, mostovi i udruživanje sučelja" (Napredna Linux administracija; chapters not written yet)
- Linux kernel `Documentation/networking/bonding.rst`: "Bonding Driver Options" (`mode`, `miimon`, `primary`, `xmit_hash_policy`, `lacp_rate`, `ad_select`) and "Switch Configuration"
- IEEE 802.1AX (Link Aggregation, LACP)
- `docs/tasks/w3/link-aggregation.md` "Model and presets" (the host model reused here)
- Catalogue seed: NLA T06 → net-link-aggregation

## Model and presets

- **Scene:** reuses `link-aggregation`'s stage: server S with `bond0` over 2–4 member links (eth0…eth3,
  1 Gbit/s each) to switch SW, flows as strands entering lanes, a load bar per lane and the summary line
  (offered, delivered, fastest single flow). New on this page: a mode selector drawn as the bond's label,
  the active-member marker (active-backup), a switch-config badge on SW (none / static / LACP), and a
  warning strip (reordering, MAC flapping, LACP without partner).
- **Reused from `link-aggregation`** (copy per COMMON.md §6): flow list, the hash → member function and its
  three policies, max-min sharing per member, re-hash on failure. **New:** the mode rules 1–5 below and the
  switch-config check.
- **State (derived live, explorer):** `{ mode, members: [{id, up}], active, switchCfg, policy, flows: […],
  assignment: {flowId: memberId | 'all'}, rate: {flowId}, memberLoad: {memberId}, warnings: [code] }`.
- **Explorer:** changing the mode, failing a member, the policy or the switch config recomputes assignment
  and rates at once; strands that moved and the active-member marker get the "changed" mark.
- **Rules** (Linux kernel `Documentation/networking/bonding.rst`, "Bonding Driver Options" and "Switch
  Configuration", unless stated):
  1. `active-backup` (mode 1): one member carries all traffic; total ≤ one link. No switch config needed.
     On failure of the active member (detected by `miimon`, recommended 100 ms) the next up member becomes
     active (`primary`, if set and up, wins; otherwise the lowest-numbered up member — tie-break (check)),
     and the bond sends gratuitous ARPs.
  2. `balance-rr` (mode 0): frames go to the members in turn, so one flow can exceed one link, but its frames
     arrive out of order (TCP sees reordering; warning shown, delivered rate = N × 1 Gbit/s × a fixed 0.8
     reordering penalty, a stage simplification (check)). Needs a static aggregate on the switch; with
     `switchCfg = none` the switch sees the bond's MAC on several ports (warning "MAC flapping", delivered
     shown as unreliable).
  3. `balance-xor` (mode 2): member = hash(policy) mod up members, the `link-aggregation` rule; needs a
     static aggregate on the switch.
  4. `802.3ad` (mode 4): same hashing as mode 2, members negotiated with LACP (`lacp_rate` slow = 30 s,
     fast = 1 s). Needs LACP on the switch; with `switchCfg ≠ LACP` the members do not join one aggregator
     and the bond uses one member only (check against bonding.rst "802.3ad" / `ad_select`).
  5. Failure in modes 0, 2, 4: the failed member is removed and flows re-hash over the rest (from
     `link-aggregation`, its rule 4).
  6. Only the transmit side is modelled; what the switch sends back is decided by the switch's own hash
     (named in the caption, not modelled).
- **Params:** `mode` choice `active-backup` | `balance-rr` | `balance-xor` | `802.3ad`, default `active-backup`;
  `members` range 2–4, default 2; `fail` choice none / eth0 / eth1, default none; `policy` choice `layer2` |
  `layer3+4`, default `layer2` (hidden in modes 0 and 1); `switchCfg` choice none / static / LACP, default
  none; `flows` range 1–8, default 4 (the host's seeded client list).
- **Presets:**
  1. `active-backup-fail` — 2 members, 4 flows, eth0 active: delivered 1 Gbit/s on eth0; fail eth0 → eth1
     active, still 1 Gbit/s; no switch config needed. Derived from rule 1.
  2. `rr-one-flow` — `balance-rr`, 2 members, 1 flow, switch static: the single flow gets 1.6 Gbit/s with a
     reordering warning (the only mode where one flow exceeds one link). Derived; penalty is a stage choice.
  3. `lacp-layer2-gateway` — `802.3ad`, LACP, `layer2`, 4 flows all to the gateway's MAC from S: one link
     carries all 4 (4 × 0.25 Gbit/s); switch to `layer3+4` → flows spread (exact split from the copied hash,
     computed in `SPEC.md`). Derived, unchecked.
  4. `lacp-no-partner` — `802.3ad` with `switchCfg = none`: one member used, 1 Gbit/s total, warning "no LACP
     partner". Derived (check).
  5. `xor-fail-rehash` — `balance-xor`, 3 members, 6 flows, `layer3+4`, fail eth1: flows on eth0/eth2 can move
     too (mod 3 → mod 2). Derived; exact moves from the model.
- **Steps:** none (explorer).
- **Legend:** solid lane = up member carrying traffic, dotted lane = up but idle (backup), crossed lane =
  failed; star = active member; zigzag strand = reordered flow; switch badge text = its config. "Changed"
  highlight: strands that moved lanes and the active-member star when it moves.
- **Captions:**
  - hr: „*active-backup*: promet ide samo kroz eth0; eth1 čeka. Kad eth0 padne, eth1 postaje aktivno sučelje i
    šalje besplatni ARP, a preklopnik ne treba nikakvu posebnu postavku."
  - en: "active-backup: traffic uses only eth0; eth1 waits. When eth0 fails, eth1 becomes active and sends a
    gratuitous ARP; the switch needs no special configuration."
- **Terms:** bonding — udruživanje sučelja (NLA toc T06); member link / slave — članska veza (check);
  active-backup — aktivno-pričuvni način (check); hash policy — politika raspršivanja (check); failover —
  preuzimanje (check); gratuitous ARP — besplatni ARP (check); switch — preklopnik.
- **Misconceptions:** a 2 × 1 Gbit/s bond gives one transfer 2 Gbit/s (only `balance-rr`, at a cost);
  active-backup "wastes" a link with no benefit (it needs no switch support and survives a switch port
  failure); 802.3ad works without configuring the switch.
- **Out of scope:** `balance-tlb`, `balance-alb`, `broadcast` (named in a note), ARP monitoring, teamd,
  receive-side hashing on the switch, MLAG across two switches.
- **Note for the coordinator:** this page and `link-aggregation` share one stage and one hash model; if
  `link-aggregation` gains a mode param later, this page could become its preset set. Keep separate for now:
  the host's concept is "one flow ≤ one link", this one's is "what each mode gives up".

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-bonding-modes sims/lnx-bonding-modes` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-bonding-modes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
