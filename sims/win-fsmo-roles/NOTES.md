<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-fsmo-roles: notes

Thread t-0239, 2026-11-04. Task `docs/tasks/w3/win-fsmo-roles.md`. Stepper, no kit view. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **One action per step, scripted per preset.** A hidden `scenario` param (select, `visible: false`, as in
  `win-ad-structure`) picks the script; the presets set it. `steps` is a function of the scenario (6, 4, 3, 6, 2);
  `sim.json` `steps` is 6, the default `quillmoor`. The two ranges (`ridLeft`, `usersToCreate`) change the numbers
  at the same step.
- **The operations panel is live.** Every row is evaluated against the step's state (after the action and
  replication), on its own copy, so a row's pool request never changes the state (task rule 8 → SPEC rule 12). The
  row the step ran shows that run's result (outlined, "ran"); the others show what would happen now.
- **Two operations added** to the task's five: *a user logs on* (needs no role: the misconception "without the FSMO
  holder nobody can log on", and task caption 1 "users still log on") and *update references to other domains*
  (the Infrastructure master's job, so `infra-single-domain` has an operation to run).
- **Each DC keeps its own copy** of who holds each role (with a version) and of the next free RID; the roles a card
  shows are the ones that DC believes it holds. Online DCs that reach each other merge at once after every action
  (no replication delay). That is what lets a cut-off or returning DC hold an old view.
- **Role placement per preset.** `rid-only` and `infra-single-domain` put that one role on brk-dc03 at step 0 (the
  rest on qm-dc01), so turning one DC off removes only that role, as the task asks ("RID master off, everything
  else fine"; "Infrastructure master off").
- **RID pool model:** current pool plus at most one prefetched next pool; the request is made at an allocation
  that leaves ≤ 250 (so a pool that starts at exactly 250, as `ridLeft` 250 does, asks at the first new user). The
  initial pools (3101–3600, 3601–4100, 4101–4600, next free 4601) are invented.
- **Time:** only qm-dc01 has an external source (estate `forest.txt`: `w32tm /manualpeerlist` on qm-dc01). A
  transferred PDC on qm-dc02 runs on its own clock (`win-time-hierarchy` rule 3/4, event 12), shown as △.
- **Kerberos 5 minutes** appears in the time-drift caption (the default maximum clock skew, also
  `win-time-hierarchy` rule 5).
- **Badges:** five shapes with letters (S circle, N square, R diamond, P hexagon, I triangle) in series colours
  c1–c5; hollow when the DC does not act (off, or on but not yet replicated); a clamp (ink bracket over the badge)
  plus "seized from …" when seized; "two holders" in red under a role with two acting holders. The role names
  live in the panel's "Needs" column (with forest/domain scope), which is the key for the badges, so the header
  legend only explains the marks.
- **Status marks:** ✓ in a filled disc (works), ! in a triangle (degraded), ✕ in a hollow square (fails), each
  with its word. Survives grayscale (checked).

## Deviations from the task

- **`seize-and-return` has 6 steps, not 5, and a network split.** Microsoft's "Transfer or seize Operation Master
  roles" (fetched 2026-11-04) says a role holder that starts again "waits until it receives inbound replication"
  and relinquishes the role when the replicated information names another holder; and that a RID master seizure
  raises the next free RID by 10,000 (ntdsutil; 30,000 by the PowerShell cmdlet) "to avoid the risk of duplicate
  SIDs". With those two safeguards, the task's straight "restore qm-dc01 and power it on → two RID masters,
  duplicate pools" would be wrong: qm-dc01 would replicate from qm-dc02 and give the role up. Two holders are real
  in a **replication island** (the same page's islands table: schema, naming and RID "Yes", PDC and infrastructure
  "No"). So the preset is: qm-dc01 off · qm-dc02 cut off from the others · seize R on qm-dc02 (next free RID
  4601 → 14601) · qm-dc01 restored from an old image and powered on; it replicates from brk-dc03, which never heard
  of the seizure, and acts as RID master again (two RID masters) · brk-dc03 creates 300 users and gets
  4601–5100 from qm-dc01 · the network comes back, the seizure (v2) beats the old record (v1) and qm-dc01 gives R
  up. The page shows "two RID masters hand out pools from one RID space" and the 9,500-RID distance instead of a
  duplicate pool; the duplicate-pool warning exists (`duplicatePools`, tested) but no preset reaches it, because
  the seize skip keeps the pools apart within 6 steps. The caption at the end says that without the skip they
  would overlap.
- **A restore discards the DC's local RID pool** (Microsoft, "Managing RID Issuance", event 16654). Not in the task;
  shown as qm-dc01's empty pool after step 4.
- **The seize of a reachable holder is done as a transfer** (a seize first tries a graceful transfer). No preset
  uses it; tested.
- **Task caption 1 in Croatian** is used with the task's own term list instead of its wording: "svih pet uloga
  *FSMO* (uloga nositelja operacija)" rather than "svih pet *FSMO* uloga (uloga operacijskog nositelja)", so the page
  uses one Croatian term throughout. Caption 2 is used as given ("qm-dc02 ima još 250 RID-ova: kreirano je 250
  korisnika, a 50 nije."), with the numbers from the model.
- Owner questions were not added to `docs/tasks/OPEN.md`: the gate's scope rule allows changes only under
  `sims/win-fsmo-roles/`. They are in the thread report instead.

## Sources

- Microsoft Learn, "Transfer or seize Operation Master roles" (support article, KB 255504, dated 2025-04-07,
  fetched 2026-11-04): role table and scope; restarted holder waits for inbound replication and relinquishes;
  transfer vs seize; RID seizure raises the next RID pool by 10,000 (ntdsutil) / 30,000 (PowerShell); rebuild
  instead of restore; islands table; the Infrastructure master is not needed when every DC is a GC or the Recycle
  Bin is on.
- Microsoft Learn, "Managing RID Issuance" (dated 2025-05-12, fetched 2026-11-04): "a domain controller requests
  RID allocations in blocks of 500 RIDs"; event 16654 (pool invalidated after a restore or snapshot revert); DCs
  "continue to consume any outstanding RID pools already issued to them".
- Microsoft Learn, "FSMO roles in Active Directory" (task's title, *check*): not fetched in this session; the roles'
  jobs (schema changes; adding and removing domains and application partitions; RID pools; PDC: password changes,
  lockout, time, GPO editing; infrastructure: cross-domain references) are as the task states them.
- Estate `student/configs/ad/quillmoor/forest.txt`: three DCs, all five roles on qm-dc01, qm-dc01's time source.
- `docs/tasks/w3/win-time-hierarchy.md` rules 3–5 for the time caveat after a PDC transfer.
- Instructor `caveats.md` CV-23 was read for context only; nothing from it is on the page.

## Unchecked *(check)*

- The pool request threshold "at half used" (250 of 500): not stated on "Managing RID Issuance"; the task marks it
  *(check)* too.
- The exact behaviour at the threshold (≤ 250 after an allocation) and the single prefetched pool are this model's
  simplification.
- The 10,000 skip is ntdsutil's figure; the PowerShell cmdlet uses 30,000. The page says "jumps from 4601 to
  14601" without naming a tool.
- Replication is instant within an island; real intra-site replication takes seconds, inter-site minutes.
- "A seize first tries a graceful transfer when the holder is reachable" (known ntdsutil behaviour; not quoted from
  the pages fetched).
- The password caption (a logon with a just-changed password fails at a DC that has not received it, lockout counted
  per DC): the PDC's role in rechecking bad passwords is from the task, not a fetched page.
- Croatian terms below.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| operations master role (FSMO) | uloga nositelja operacija (task) |
| schema master | nositelj sheme (task) |
| domain naming master | nositelj imenovanja domena |
| RID master | nositelj RID-ova (task) |
| PDC emulator | emulator PDC-a (task) |
| infrastructure master | nositelj infrastrukture |
| transfer | prijenos (task) |
| seize | preuzimanje (silom) (task) |
| RID pool | skup RID-ova (task) |
| replication island | otok replikacije |
| inbound replication | dolazna replikacija |

## Shared requests

- None for the kit. The same `.sd-ctl[hidden]` workaround as `win-ad-structure` is in the page CSS.

## Tags

Topic `windows-admin`, tag `active-directory` (both in `tags.json`), level `advanced`.

## Time

Start to done in one session on 2026-11-04, 04:05 to 04:26 by the machine clock (reading and sources 6 min,
spec, model and tests 5, page and screenshots 4, review and fixes 6).

## Review

A fresh reviewer read the code against SPEC.md and ran 44 mutations of sim.js: 37 caught, 7 survived. Fixed from
the review: the caption at the seizure said brk-dc03 was "cut off" (it is qm-dc02 that is cut off); an empty pool
with the RID master online failed without asking for a pool (it now asks first); "holds a role" for four roles;
Croatian case and word order ("ulogu ({role})", "pet uloga *FSMO*", "kojima je potrebno"); "that role writes no
data" was wrong for the PDC (now "two holders of this role do no lasting harm"); a dead `relinquished` branch
removed; a panel test that took its snapshot too late. New tests for a holder that is on but cut off, the `on`
action leaving a DC unsynced, `acting()` requiring a synced DC, the pool-overlap boundary, a transfer refused for
`cut` and `waiting`, and the failed request not repeated in one run. Re-running five of the survivors against the
new tests: all caught. The other two: the dead branch (removed) and the repeated request (now tested).
