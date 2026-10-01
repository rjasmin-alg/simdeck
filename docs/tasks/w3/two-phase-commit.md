# two-phase-commit: Two-phase commit

| | |
|---|---|
| Task | `two-phase-commit` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-two-phase-commit` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/two-phase-commit/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `consensus` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **prepare/commit, and the coordinator crash that blocks everyone**.

The student: crash participants and the coordinator.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- J. Gray, "Notes on Data Base Operating Systems", in *Operating Systems: An Advanced Course*, LNCS 60,
  1978; P. A. Bernstein, V. Hadzilacos, N. Goodman, *Concurrency Control and Recovery in Database Systems*,
  1987, ch. 7 "Distributed Recovery" (2PC, blocking, presumed abort); M. Kleppmann, *DDIA*, ch. 9 "Atomic
  Commit and Two-Phase Commit" *(check)*
## Model and presets

- **Scene:** sequence diagram: a **coordinator C** and three **participants P1–P3** as lifelines, each
  with a durable log (a short list of records: `prepared`, `commit`, `abort`) and a state badge (working /
  prepared / committed / aborted / **blocked**), plus a lock icon on the data a prepared participant holds.
  Messages: PREPARE, YES/NO votes, COMMIT/ABORT, ACK. Crash = greyed lifeline; recovery brings it back with
  its log.
- **State:** `{ t, coord: {up, state, log: []}, parts: [{id, up, state, log: [], vote, locks: bool}], msgs:
  [{from, to, type, deliverAt}], timeoutMs, cursor }`.
- **One step:** one phase action: send PREPARE, deliver a vote, write a log record, send the decision,
  deliver an ACK, a crash, a timeout, a recovery.
- **Rules** (J. Gray, "Notes on Data Base Operating Systems", 1978; Bernstein, Hadzilacos & Goodman,
  *Concurrency Control and Recovery in Database Systems*, 1987, ch. 7) (check):
  1. Phase 1: C sends PREPARE; a participant that can commit writes `prepared` to its log **before** voting
     YES, and from then on holds its locks; otherwise it votes NO and aborts locally.
  2. Phase 2: C decides COMMIT only if **all** voted YES; any NO or a missing vote by the timeout → ABORT.
     C writes the decision to its log **before** sending it.
  3. A participant that voted YES may not decide alone: it must wait for C's decision (it is **blocked**,
     locks held).
  4. A participant that crashes after voting YES recovers from its log, finds `prepared`, and asks C for
     the outcome.
  5. A coordinator that crashes after the votes and before sending the decision leaves every YES voter
     blocked until it recovers; on recovery: decision in its log → resend it; no decision logged → ABORT
     (presumed abort) (check variant).
  6. Tie-break: votes arriving at the same time are processed in participant id order; a vote arriving
     after the timeout is ignored (the decision is already ABORT).
- **Params:** `voteP2` choice YES / NO (YES); `crash` select none / P3 before voting / P2 after voting /
  coordinator after votes (none); `timeoutMs` choice 100 / 500 (500).
- **Presets** (derived, checked by hand):
  1. `all-yes` — all vote YES: C logs COMMIT, sends it, all commit and ACK. **Committed.**
  2. `one-no` — P2 votes NO: C logs ABORT; P1 and P3 (prepared) release their locks on ABORT. **Aborted.**
  3. `participant-silent` — P3 crashes before voting: timeout at 500 ms → ABORT; P3 on recovery has no
     `prepared` record and aborts locally.
  4. `coordinator-crash` — all YES, C crashes before sending the decision: P1–P3 are **blocked**, locks held,
     for as long as C is down; nothing the participants exchange among themselves lets them decide safely.
  5. `coordinator-recovers` — preset 4, C recovers: decision COMMIT was logged → resent, all commit; variant
     with C crashing before logging the decision → ABORT on recovery.
- **Steps:** `all-yes` 9 (PREPARE, 3 votes, log, COMMIT, ACKs, done); `one-no` 8; `participant-silent` 7;
  `coordinator-crash` 7 (ends blocked); `coordinator-recovers` 10.
- **Legend:** lifeline (vertical line), message (arrow, labelled), log record (small box on the lifeline),
  prepared (hourglass + lock), blocked (lock + "blokiran"), crashed (crossed lifeline). "Changed" marks the
  message delivered and the log/state changed in this step.
- **Captions:**
  - hr: „Svi su glasali DA i zapisali `prepared`. Koordinator (*coordinator*) pada prije nego što javi
    odluku: sudionici ne smiju ni potvrditi ni odustati, i drže zaključane podatke."
  - en: "P2 voted NO, so the decision is ABORT; P1 and P3 release the locks they held while prepared."
- **Terms:** two-phase commit — dvofazna potvrda (check); coordinator — koordinator; participant —
  sudionik; prepare / vote — priprema / glas; commit / abort — potvrda / poništenje (check); blocking —
  blokiranje; lock — zaključavanje (ključ).
- **Misconceptions:** "2PC tolerates any single failure" (the coordinator is a blocking point); "a
  prepared participant can time out and abort"; "2PC is consensus" (it needs every participant, not a
  majority; link `raft`).
- **Out of scope:** three-phase commit, Paxos Commit, sagas, XA specifics, distributed deadlock.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `two-phase-commit` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh two-phase-commit sims/two-phase-commit` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/two-phase-commit/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
