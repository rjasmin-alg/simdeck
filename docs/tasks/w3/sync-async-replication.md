# sync-async-replication: Synchronous vs asynchronous replication

| | |
|---|---|
| Task | `sync-async-replication` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-sync-async-replication` in `docs/catalogue.md` §4.6 |
| Kind | **add a preset to `sims/db-replication/`** (no page of its own) |
| Folder | `sims/db-replication/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA |
| Topic / tags / level | `storage` / `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `db-replication` merged; only one preset task per host folder at a time; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **RPO 0 at the cost of latency vs lag and data loss on failover**.

The student: write, fail the primary at different moments.

This is a **preset on `db-replication`** (Replication lag and failover), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/db-replication/` (the host page) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.7 (with ha-db-replication)
- `~/projects/napredna-linux-administracija/meta/toc.md` T55 (Replikacija baze) — chapter not written yet
- `~/projects/dr-lecture-estate/student/handbook/sites.md`, "WAN links" table (latencies 0.8–14 ms) for
  realistic RTT values
- Standard references: M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 "Synchronous Versus
  Asynchronous Replication"; PostgreSQL documentation "Synchronous Replication" *(check)*
- Host task: `docs/tasks/w2/db-replication.md`

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

**Preset task on `db-replication`.** Same scene and model; adds a commit mode per replica and the cost it
puts on every write.

- **What the host model must support** (request under "Shared requests" in the host's `NOTES.md` if
  missing): (a) per-replica `mode: 'sync'|'async'`; (b) a commit's acknowledgement time separate from its
  arrival time (`ackAt`), so latency can be shown; (c) a round-trip time per replica (`rttMs`); (d) a
  "replica down" event independent of the primary failing; (e) an `onSyncReplicaLost` policy
  `block | degrade-to-async`.
- **State added:** `{ mode, rttMs, ackLatency: [{lsn, ms}], blocked: lsn[] }`.
- **One step:** as in the host (one 100 ms tick); a synchronous commit is acknowledged in the tick where the
  replica's confirmation arrives.
- **Rules:**
  1. Synchronous: the primary acknowledges a commit only after the synchronous replica confirms it has the
     record durably; commit latency = local commit + one round trip to the replica (standard; database
     documentation in Sources) (check).
  2. With a synchronous replica, every acknowledged commit exists on two servers: failover to that replica
     loses **nothing** (RPO 0).
  3. Asynchronous (the host's rule 1): acknowledgement after the local commit; failover loses the lag.
  4. If the only synchronous replica is down, commits **wait** (policy `block`) or the primary switches to
     asynchronous and keeps going (policy `degrade-to-async`), which silently brings back data-loss risk
     (both policies exist; which is the default depends on the database) (check).
  5. Tie-break: a commit whose confirmation arrives in the same tick as a primary failure counts as
     acknowledged only if the confirmation was processed first (order of phases: apply, then fail)
     (derived).
- **Params added:** `mode` choice sync / async (sync); `rttMs` choice 1 / 10 / 40 (1: same room; 40: another
  site over a WAN, e.g. the DR estate's hq–brk IPsec link has 9 ms latency one way, `handbook/sites.md`);
  `onSyncLost` choice block / degrade (block).
- **Presets** (writes every 100 ms as in the host; derived, checked by hand):
  1. `sync-failover` — sync, RTT 1 ms, primary fails at 1000 ms: replica has all 10 records, **0 lost**;
     each commit took ≈ 1 ms longer.
  2. `async-failover` — the host's `failover-tail` beside it: 3 records lost (lag 250 ms).
  3. `sync-over-wan` — sync, RTT 40 ms: every commit ≥ 40 ms; a client doing commits one after another
     manages at most **25 commits/s** (1000 / 40) instead of hundreds (derived).
  4. `sync-replica-down` — sync, the replica fails at 500 ms, policy `block`: writes 6–10 wait, nothing is
     acknowledged until it returns or the policy changes.
  5. `degrade-silently` — the same with `degrade-to-async`: writes continue, and a primary failure at 1000 ms
     now loses records 6–10 (no replica had them).
- **Steps:** as the host: 10–12 per preset (`sync-failover` 12, `async-failover` 12, `sync-over-wan` 10,
  `sync-replica-down` 11, `degrade-silently` 12).
- **Legend (adds to the host's):** waiting for confirmation (hourglass on the record), confirmation packet
  (return arrow), blocked commit (crossed hourglass + "čeka"). "Changed" as in the host.
- **Captions:**
  - hr: „Sinkrono (*synchronous*): zapis 7 potvrđen je tek kad ga je replika spremila. Pad primarnog sada ne
    gubi ništa — ali svaki upis čeka povratni put do replike."
  - en: "The synchronous replica is down: commits 6 to 10 are waiting. Nothing is lost, and nothing is being
    written."
- **Terms:** synchronous / asynchronous replication — sinkrona / asinkrona replikacija; round-trip time —
  vrijeme povratnog puta (URM, check); commit — potvrda transakcije (check); RPO — RPO (ciljna točka
  oporavka, link `rpo-rto`); acknowledgement — potvrda.
- **Misconceptions:** "synchronous replication is free"; "synchronous means the replica can never be
  behind" (it can, with degrade-to-async); "RPO 0 protects against a bad delete" (it replicates the delete;
  link `restore-drill`).
- **Out of scope:** quorum commit over several replicas, consensus (`raft`), storage-level replication
  (`ceph-min-size`).

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/db-replication/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
