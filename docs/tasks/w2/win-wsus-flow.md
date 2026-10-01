# win-wsus-flow: How an update reaches a client

| | |
|---|---|
| Task | `win-wsus-flow` (wave 2b, WSUS) |
| Catalogue entry | `win-wsus-flow` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-flow/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `updates` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **Microsoft Update → upstream WSUS → downstream (replica or autonomous) → client; sync, approval, download**.

The student: step an update through a two-site hierarchy.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Windows Server Update Services (WSUS) overview"; "Plan your WSUS deployment" (upstream/downstream, replica vs autonomous); "Configure WSUS" (products and classifications, sync schedule, "Download update files to this server only when updates are approved"); "Configure Group Policy settings for Automatic Updates" ("Specify intranet Microsoft update service location", "Automatic Updates detection frequency")

## Model and presets

- **Scene:** a left-to-right chain: Microsoft Update (cloud) → WSUS-HQ (upstream) → WAN link → WSUS-BR (downstream at the branch, replica or autonomous) → clients PC-HQ1 (HQ) and PC-BR1 (branch). Each server shows three things for the update KB-A: metadata ✓/—, approval (for which group), content ✓/—. Each client shows: scanned, detected, downloaded, installed. A clock (day and time) runs along the top.
- **State:** `t` (hours from Tuesday 19:00), `update: { id, released, sizeMB }`, `upstream: { products: [], syncAt, meta, approvals: { [group]: bool }, content, storeLocally: bool }`, `downstream: { mode: replica|autonomous, syncAt, meta, approvals, content }`, `clients: [{ id, server, group, nextScan, state: idle|detected|downloaded|installed|reported }]`, `log`.
- **One step:** advance to the next scheduled or admin event and apply it, in this order within the same hour: (1) syncs; (2) approvals; (3) content downloads; (4) client scans; (5) client downloads; (6) installs; (7) status reports.
- **Rules:**
  1. The upstream server syncs metadata from Microsoft Update on its schedule, only for the products and classifications it is set to sync (Microsoft, "Configure WSUS: products and classifications" (check)).
  2. With "download update files only when updates are approved" (default (check)), content is downloaded when an update is approved, not at sync.
  3. A downstream server syncs from its upstream, not from Microsoft Update; it gets only what the upstream has.
  4. Replica: approvals, groups and settings come from the upstream at each downstream sync; the downstream admin can't approve. Autonomous: metadata comes from upstream, approvals are made locally (Microsoft, "WSUS deployment options: replica and autonomous" (check)).
  5. The downstream downloads content from its upstream after the update is approved for it (replica: by the upstream's approval); the upstream must have the content or fetch it first (check).
  6. A client scans its own WSUS (the one its Group Policy names) about every 22 h minus a random 0–20 % (default detection frequency (check)); it detects only updates that are approved for its group **and** applicable.
  7. The client downloads content from its WSUS, installs per its Automatic Updates setting (model: scheduled install at 03:00), then reports status at its next contact.
  8. Replica downstream servers can roll up client status to the upstream (option (check)).
  9. Tie-break: events at the same hour run in the phase order above, so a scan in the same hour as an approval sees it.
- **Params:** `mode` choice replica / autonomous (default replica); `upstreamProducts` toggle (product of KB-A selected, default on); `branchPointsToHQ` toggle (branch client's policy names WSUS-HQ, default off); `approveAt` choice Wed 09:00 / Wed 05:00 (default Wed 09:00); button `approve at branch` (only meaningful when autonomous).
- **Presets:**
  1. `replica-two-sites` — derived, unchecked: release Tue 19:00; HQ sync Wed 03:00; approved for All Computers Wed 09:00; HQ content Wed 09:30; PC-HQ1 scan Wed 14:00, install Thu 03:00; WSUS-BR sync Thu 04:00 (approval + metadata), content over the WAN Thu 04:30; PC-BR1 scan Thu 11:00, install Fri 03:00. Branch is a day behind HQ.
  2. `autonomous-waits` — derived, unchecked: same with WSUS-BR autonomous: HQ approval doesn't reach the branch; PC-BR1 stays "not approved" until the branch admin approves.
  3. `replica-cant-approve` — derived, unchecked: replica branch admin tries to approve → rejected; approvals are inherited only.
  4. `not-synced` — derived, unchecked: KB-A's product not selected upstream → never in metadata anywhere; clients report nothing missing.
  5. `client-points-to-hq` — derived, unchecked: PC-BR1's policy names WSUS-HQ → downloads over the WAN from HQ; the branch server is bypassed.
- **Steps:** replica-two-sites 13; autonomous-waits 12; replica-cant-approve 6; not-synced 5; client-points-to-hq 10.
- **Legend:** per server three slots M (metadata), A (approval), C (content) with ✓/—; per client a 5-stage strip scanned → detected → downloaded → installed → reported; WAN transfers drawn as a thick arrow with size. "Changed" marks the slot or stage that changed in this step.
- **Captions:**
  - hr: "WSUS-BR je *replica* (replika): odobrenje stiže iz središnjice pri sinkronizaciji u 04:00 — lokalni administrator ne odobrava ništa."
  - en: "WSUS-BR is a replica: the approval arrives from HQ at the 04:00 sync, and the local admin approves nothing."
  - hr: "Proizvod nije odabran na glavnom poslužitelju, pa zakrpa ne postoji ni za podružnicu ni za klijente — i nitko ne javlja da nedostaje."
  - en: "The product isn't selected on the upstream server, so the patch doesn't exist for the branch or the clients, and nobody reports it missing."
- **Terms:** update — ažuriranje (zakrpa); upstream / downstream server — nadređeni / podređeni poslužitelj; replica — replika; autonomous — samostalni; synchronization — sinkronizacija; approval — odobrenje; metadata — metapodaci; content — sadržaj (datoteke ažuriranja).
- **Misconceptions:** "approving an update installs it" (the client still has to scan, download and install); "the branch gets it at the same time"; "WSUS sends updates to clients" (clients pull on their own schedule).
- **Out of scope:** computer groups and deadlines (`win-wsus-groups`), the client cycle in detail (`win-wsus-client-cycle`), express files and peer caching (`win-wsus-delivery`), cleanup (`win-wsus-supersedence`), cloud update services.
- **Note for the coordinator:** later WSUS tasks reuse this model; ask its builder to keep the server/client/update objects separable (COMMON.md §6).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-wsus-flow` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-wsus-flow sims/win-wsus-flow` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-flow/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
