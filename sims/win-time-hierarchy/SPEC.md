<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-time-hierarchy: specification

One concept: **the PDC emulator is the source, members follow DCs, Kerberos fails past 5 minutes** (task
`docs/tasks/w3/win-time-hierarchy.md`, catalogue `win-time-hierarchy`, §4.5.1 and §5.21). The student drifts clocks,
stops a member's time service and moves the PDC role, and watches who follows whom and what Kerberos says.

## Scene

One domain, `quillmoor.example`, which is also the forest root (estate `forest.txt`):

| Node | Host (data) | Kind | Syncs from (default) | Own drift, s per round |
|---|---|---|---|---|
| `loom` | `10.40.1.5` | external time source, true time | (its own reference) | 0 |
| `DC01` | `qm-dc01` | DC, PDC emulator by default | `loom` (manual peer) | `pdcDrift` while it holds the PDC role, else +1 |
| `DC02` | `qm-dc02` | DC | the PDC emulator | `pdcDrift` while it holds the PDC role, else −2 |
| `DC03` | `brk-dc03` | DC | the PDC emulator | +3 |
| `PC-A` | — | domain member | `DC02` (its DC) | −5 |
| `PC-B` | — | domain member | `DC03` (its DC) | `pcbDrift` |

- **Offset** is a node's clock minus true time, in whole seconds; `loom` is true time (offset 0, never drifts).
- **The members' DCs are fixed** (PC-A → DC02, PC-B → DC03): a member syncs from the DC it authenticated against
  (the DC locator's choice), not from the PDC. Assumption; the task's tree says only "DC02, DC03 → members".
- The own drifts of DC01 (as non-PDC), DC02 (as non-PDC), DC03 and PC-A are fixed small numbers (made up) so that
  every card shows a drift and its correction; they never decide an outcome.
- All clocks start at offset 0 (the domain was in sync).

## Configuration (from the params)

Params: `pdcSource` choice {`external`, `none`} default `external`; `pdcDrift` −60…+60 s per round default 0;
`memberStopped` toggle default off; `pcbDrift` 0…120 s per round default 40; `pdcOn` choice {`DC01`, `DC02`} default
`DC01`; `rounds` 1…10 default 4 (added: the steps, see NOTES.md).

- `DC01.config` = `manual` (peer `loom`) when `pdcSource` = `external`, else `domhier`. `pdcSource` describes how
  DC01 was set up while it was the PDC; moving the role does not change it (rule 4).
- `DC02`, `DC03`, `PC-A`, `PC-B`: `domhier`. `loom`: `local` (its own reference clock).
- `pdc` is true for the node named by `pdcOn`.
- `syncs` is false for `PC-B` when `memberStopped` (its time service is off), else true.

## State

`{ round, nodes: { id: { offset, driftPerRound, source, syncs, pdc, config, drifted, corrected } }, krb: [ { a, b,
skew, ok } ], events: [ { round, node, code } ], order: [ ids ], changed: [ ids ] }`

- `source`: the node it syncs from this round (`null` = nobody: `loom`, a stopped node, a `domhier` PDC).
- `drifted`: the offset after (a) and before (b) in this round; `corrected` = `offset − drifted` (0 at step 0).
- `krb`: the Kerberos strip, four fixed pairs in this order: `PC-A ↔ DC02` (logon), `PC-B ↔ DC03` (logon),
  `DC02 ↔ DC01`, `DC03 ↔ DC01` (DC to DC, replication). `skew` = |offset a − offset b|.
- `events`: everything logged so far. Codes: `noSource` (rule 3, event 12; logged once, in the first round where the
  node is a PDC with nobody above it), `krbFail` (a pair's first round past 5 minutes), `krbOk` (a pair back within
  5 minutes; unreachable with fixed params, kept for completeness).
- `order`: the sync order of this round (rule 7); `changed`: nodes whose offset differs from the step before.

## One step = one sync round

(a) Every node's offset += its drift. (b) Every syncing node, in the order of rule 7, sets its offset to its source's
offset (instant sync; the NTP maths is `inet-ntp-sync`'s). (c) The Kerberos strip is re-evaluated. Steps: `rounds`
(at most 10).

## Rules (Microsoft Learn, "How the Windows Time service works"; "Windows Time service tools and settings";
"Maximum tolerance for computer clock synchronization")

1. **Members follow a DC.** A domain member (type NT5DS, `domhier`) syncs from a DC of its domain: here its fixed DC.
2. **DCs follow the PDC emulator.** A `domhier` DC that is not the PDC syncs from the PDC emulator of its domain,
   found by role, so when the role moves, the DCs follow the new holder. (A child domain's PDC would sync from a DC
   in the parent domain; not in this scene.)
3. **The forest root PDC is the top.** It should have an external source (`manual`, here `loom`). A `domhier` PDC of
   the forest root domain has nobody above it: it runs on its own clock and logs event 12 ("…it is the AD PDC
   emulator for the domain at the root of the forest, so there is no machine above it…").
4. **Moving the PDC role does not move the configuration.** With `pdcOn` = `DC02`, DC02 (still `domhier`) has nobody
   above it → event 12 (rule 3); DC01 keeps its manual peer `loom` and feeds nobody but itself; DC03 and the members
   follow DC02 (rule 2). *(check: DCs choose their source by the PDC role, so they follow the new PDC.)*
5. **Kerberos compares the parties, not true time.** A pair is refused when |a − b| > 300 s (Kerberos policy,
   maximum tolerance 5 minutes); exactly 300 s passes (the same comparison as `win-kerberos`, `skewOk`). A whole
   domain that is wrong together still works.
6. **A node that does not sync drifts away.** PC-B with its time service stopped keeps its own clock (the same for a
   VM that takes its time from the hypervisor instead, *(check)*: hypervisor time sync on a virtual DC; not drawn).
7. **Tie-break: sync order** within a round is top-down by depth in this round's sync tree (a node without a source
   is depth 0, a syncing node its source's depth + 1), then by name (string order: `DC01` < `DC02` < `DC03` <
   `PC-A` < `PC-B` < `loom`). So every node takes its source's time *after* the source has synced in the same round.
   Nodes that do not sync are listed too (depth 0), in the same order.

## Presets (5) and expected numbers (checked with `library/win-time-hierarchy-check.py` before coding)

| Preset | Params (others default) | Rounds | Expected |
|---|---|---|---|
| `healthy` | defaults | 4 | after every round all offsets 0 (within 1 s of true time); corrections in round 1: DC02 +2, DC03 −3, PC-A +5, PC-B −40; strip all ✓, skew 0 |
| `pdc-no-source` | `pdcSource` none, `pdcDrift` +60 | 10 | DC01 has no source, event 12 in round 1; every node except `loom` at +60·r; after round 10 all at +600 s (10 min ahead of true time), strip all ✓ with skew 0 (rule 5) |
| `member-stopped` | `memberStopped` on, `pcbDrift` 40 | 9 | PC-B at +40·r, everyone else 0; round 7: 280 s ✓; round 8: 320 s ✕ (`krbFail` PC-B ↔ DC03); round 9: 360 s ✕ |
| `move-pdc` | `pdcOn` DC02, `pdcDrift` +30 | 6 | DC02 has no source, event 12 in round 1; DC01 follows `loom` (0); DC02, DC03, PC-A, PC-B at +30·r; round 6: +180 s; DC02 ↔ DC01 and DC03 ↔ DC01 skew 180 s ✓ |
| `quillmoor` | `pdcDrift` +15 | 3 | the estate as configured: qm-dc01 holds the PDC with `loom` (10.40.1.5) as manual peer; DC01 drifts +15 and is set back to 0 each round; all 0, strip all ✓ |

The task's captions: `pdc-no-source` ends "The whole domain is 10 minutes **ahead of** real time, but everyone agrees
with each other — Kerberos works" (the task says "behind"; with +60 s per round the clocks run fast, so the page says
ahead, and behind for a negative drift). `member-stopped` round 8: "PC-B is 320 s ahead of its DC, more than 5
minutes: Kerberos refuses the logon."

## Limits

Instant sync, whole seconds, abstract rounds (no poll intervals in seconds), one domain, no stratum, no NTP maths
(`inet-ntp-sync`), no high-accuracy settings: all out of scope by the task.
