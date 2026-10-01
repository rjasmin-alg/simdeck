# cap-under-partition: CAP under partition

| | |
|---|---|
| Task | `cap-under-partition` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-cap` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/cap-under-partition/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `distributed` / `consensus` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `db-replication` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a partitioned system picks consistency or availability**.

The student: partition, issue reads and writes in CP and AP modes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.
5. `sims/db-replication/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- E. Brewer, "Towards Robust Distributed Systems", PODC 2000 keynote; S. Gilbert and N. Lynch, "Brewer's
  Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services", SIGACT News
  33(2), 2002; E. Brewer, "CAP Twelve Years Later: How the 'Rules' Have Changed", *Computer* 45(2), 2012;
  M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 (quorums) and ch. 9 ("The CAP theorem")
- Reused model: `docs/tasks/w2/db-replication.md`
## Model and presets

- **Scene:** three replicas **A, B, C** of one key `x`, two clients (**K1** near A/B, **K2** near C), the
  network between them; a partition wall that separates {A, B} from {C}. A mode switch **CP / AP**. Each
  request is drawn as a message with its outcome: ✓ value, ✓ stale value, ✗ error/timeout. Reuses
  `db-replication`'s replica and log drawing (copied per COMMON §6).
- **State:** reuses `db-replication`'s `{servers, writes}`; new: `{ mode: 'cp'|'ap', partition: [['A','B'],
  ['C']]|null, quorum: {w: 2, r: 2, n: 3}, requests: [{client, op, at, server, result}], divergence }`.
- **One step:** one client request and its outcome; partition and heal are their own steps.
- **Rules:**
  1. Without a partition both modes behave the same: writes reach all three, reads are current (the choice
     only matters under partition; Brewer 2000; Gilbert & Lynch 2002) (check).
  2. CP: a write succeeds only if acknowledged by W = 2 of 3; a read consults R = 2 of 3 (R + W > N, so every
     read overlaps the latest write) (Kleppmann, *DDIA*, ch. 5 "Quorums for reading and writing") (check).
  3. CP under partition: the side with 2 of 3 serves; the minority side (C) answers **error/timeout** to
     reads and writes — consistent, not available for K2.
  4. AP: any replica answers alone (W = 1, R = 1): C accepts K2's write and serves reads, possibly **stale**;
     the two sides diverge.
  5. AP after heal: divergent writes are a conflict, resolved by a rule (LWW by default here) and one write is
     lost (link `multimaster-conflict`).
  6. Tie-break: requests in the same step are processed in client id order (K1 before K2).
- **Params:** `mode` choice CP / AP (CP); `partition` toggle; buttons "K1 write", "K1 read", "K2 write", "K2
  read", "heal".
- **Presets** (x = 1 everywhere at start; derived, checked by hand):
  1. `no-partition` — K1 writes x = 2, K2 reads at C: 2 in both modes.
  2. `cp-majority` — CP, partition; K1 writes x = 2 on {A, B}: ✓ (2 of 3); K2 reads at C: **✗ timeout**;
     K2 writes x = 3: **✗**. Heal: C catches up to 2, no conflict.
  3. `ap-both` — AP, partition; K1 writes x = 2 on A; K2 reads at C: **1 (stale)**; K2 writes x = 3 at C: ✓.
     Heal: conflict 2 vs 3; LWW keeps the later stamp, the other write is lost.
  4. `cp-client-view` — CP, partition, K2 only: from K2's side the system is simply down, although C is up.
- **Steps:** `no-partition` 3; `cp-majority` 6 (partition, write, read, write, heal, summary); `ap-both` 6;
  `cp-client-view` 4.
- **Legend:** replica (cylinder), partition (wall), request ✓ (solid arrow), stale answer (hatched bubble +
  "zastarjelo"), error/timeout (crossed arrow + "✗"), conflict at heal (two stacked values + "!").
  "Changed" marks the replica or request whose state changed in this step.
- **Captions:**
  - hr: „CP: replika C je ispravna, ali je sama — ne može skupiti 2 od 3 potvrde, pa odbija čitanje. Sustav je
    dosljedan (*consistent*), ali za klijenta K2 nedostupan."
  - en: "AP: C answers at once with x = 1. It is available, and the answer is out of date."
- **Terms:** consistency — dosljednost; availability — dostupnost; partition tolerance — otpornost na
  razdvajanje mreže (check); quorum (read/write) — kvorum čitanja/pisanja; stale read — zastarjelo čitanje;
  replica — replika.
- **Misconceptions:** "pick any two of C, A and P" (P is not optional: the choice is C or A *during* a
  partition); "CP systems are never available"; "AP systems never return correct data".
- **Out of scope:** PACELC and latency trade-offs without partitions, consensus (`raft`), linearizability
  definitions in depth, tunable consistency levels beyond R/W counts.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh cap-under-partition sims/cap-under-partition` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cap-under-partition/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
