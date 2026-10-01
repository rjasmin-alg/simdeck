# db-replication: Replication lag and failover

| | |
|---|---|
| Task | `db-replication` (wave 2b, Replication and HA) |
| Catalogue entry | `ha-db-replication` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/db-replication/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `distributed` / `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **async replicas lag; failover loses the tail; reading your own writes**.

The student: write, read from a replica, fail the primary.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T55 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T55 → §5.7
- `~/projects/uvod-u-linux/book/chapters/22-baze-podataka.md` (the database as a service; `replication`
  lines in `pg_hba.conf` only, no replication model)
- Standard references (no local copy): M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5
  "Replication" (leaders and followers, replication lag, read-your-writes); PostgreSQL documentation
  "High Availability, Load Balancing, and Replication"; MySQL documentation "Replication" *(check)*
- Catalogue §5.7: `ha-db-replication` and `sto-sync-async-replication` are one page (the latter is a preset
  here)

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K2 topology (own drawing until it exists): a client, a **primary** and one or two
  **replicas**. Each server shows its write-ahead log as a numbered strip (LSN 1, 2, 3, …) with the last
  applied position marked; log records travel as packets primary → replica. A time axis (ms) below; a lag
  gauge per replica ("behind by n records / t ms"). The client's reads are drawn to the server they hit.
- **State:** `{ t, writes: [{lsn, at, key, value, acked}], servers: {P: {up, applied, role}, R1: {up,
  applied, lagMs}, R2?: {...}}, reads: [{at, from, key, got, fresh}], failedAt: null|t, promoted: id|null,
  lost: lsn[] }`. Every state is JSON-safe; time is an integer in ms.
- **One step:** one tick of 100 ms: (1) the client's write for this tick reaches the primary and is
  acknowledged (asynchronous replication), (2) log records whose `at + lagMs ≤ t` are applied on each
  replica, (3) a scheduled read is served, (4) a scheduled failure, promotion or rejoin happens.
- **Rules** (NLA T55; standard textbook behaviour, e.g. Kleppmann, *Designing Data-Intensive Applications*,
  ch. 5 "Replication") (check):
  1. Asynchronous: the primary acknowledges a commit as soon as its own log has it; replicas apply the
     same records in LSN order, later by their lag.
  2. A replica's state is the primary's state at its applied LSN: a read from a replica may return an
     older value (stale read).
  3. Read-your-writes: a client that wrote LSN n gets its own write only from a server with applied ≥ n
     (primary, or a replica that has caught up; "wait for LSN n" or "read from primary after write").
  4. Failover promotes the reachable replica with the **highest applied LSN**; tie → the configured
     priority, then the lower id (derived).
  5. Acknowledged writes above the promoted replica's LSN are **lost**: the client was told "committed".
     Lost tail = primary LSN − promoted LSN.
  6. Other replicas follow the new primary; one ahead of it (it had records the new primary lacks) must be
     rewound or rebuilt, not simply re-attached (check).
  7. The old primary returning must not accept writes or rejoin as it is: its extra records conflict with
     the new history (link `quorum-split-brain`, `fencing`).
- **Params:** `lagMs` range 0–1000 for R1 (250) and R2 (600, when `replicas` = 2); `replicas` choice 1 / 2 (1);
  `readFrom` choice primary / replica (replica); `failAt` choice none / 600 / 1000 ms (none); `rywWait` toggle
  "wait for my LSN" (off).
- **Presets** (one write per 100 ms, LSN k written at k × 100 ms; derived, checked by hand):
  1. `steady-lag` — lag 250 ms: at t = 1000 the primary has LSN 10, R1 has **LSN 7** (record k applied at
     k × 100 + 250 ≤ t).
  2. `read-own-write` — the client writes LSN 5 (`x = 5`) at 500 ms and reads `x` from R1 at 600 ms: R1 has
     LSN 3, the read returns the old `x` (**stale**). With `rywWait` the read waits until 750 ms and gets 5.
  3. `failover-tail` — primary fails at 1000 ms; R1 promoted with LSN 7: **writes 8, 9, 10 lost** although
     acknowledged (≈ 250 ms of data).
  4. `two-replicas` — R1 lag 250, R2 lag 600, fail at 1000: R1 (LSN 7) beats R2 (LSN 4); R2 follows R1 and
     receives 5–7.
  5. `old-primary-returns` — after preset 3, the old primary comes back with LSN 10 > 7: it is refused and
     must be rebuilt from the new primary (rule 7).
- **Steps:** `steady-lag` 10; `read-own-write` 8; `failover-tail` 12 (10 ticks + fail + promote);
  `two-replicas` 13; `old-primary-returns` 14.
- **Legend:** log record (numbered square), applied (solid), in flight (outlined, moving), acknowledged to
  client (tick), lost (crossed, "izgubljeno"), stale read (hatched answer bubble). "Changed" marks records
  applied, reads served and roles changed in this step.
- **Captions:**
  - hr: „Primarni poslužitelj (*primary*) potvrdio je zapise 8, 9 i 10, ali replika ih još nije
    primijenila. Nakon preuzimanja (*failover*) ti su zapisi izgubljeni."
  - en: "Read from the replica at 600 ms: it has applied up to record 3, so the value you wrote at 500 ms is
    not there yet."
- **Terms:** primary — primarni poslužitelj; replica — replika; replication lag — zaostatak replikacije;
  write-ahead log — dnevnik unaprijednog pisanja (check); failover — preuzimanje (check); promotion —
  promaknuće (check); stale read — zastarjelo čitanje; read-your-writes — čitanje vlastitih upisa (check).
- **Misconceptions:** "a replica is a live copy, always identical"; "failover never loses committed data";
  "the old primary can just rejoin".
- **Out of scope:** synchronous commit (the preset `sync-async-replication` adds it), multi-master conflicts
  (`multimaster-conflict`), consensus-based election (`raft`), logical vs physical replication, specific
  database products.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `db-replication` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh db-replication sims/db-replication` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/db-replication/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
