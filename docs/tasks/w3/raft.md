# raft: Raft leader election and log replication

| | |
|---|---|
| Task | `raft` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-raft` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/raft/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `consensus` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `quorum-split-brain` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **terms, votes, majority commit**.

The student: kill leaders, partition, step messages.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.
5. `sims/quorum-split-brain/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.7
- D. Ongaro and J. Ousterhout, "In Search of an Understandable Consensus Algorithm (Extended Version)",
  USENIX ATC 2014: §5.1 terms, §5.2 leader election (150–300 ms randomized timeouts), §5.3 log replication,
  §5.4.1 election restriction, §5.4.2 committing entries from previous terms, Figure 2 *(check)*
- Reused model: `docs/tasks/w2/quorum-split-brain.md` (majority count, partitions)

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K2 topology (own drawing until it exists): five servers **S1–S5** in a ring, each showing its
  **role** (follower / candidate / leader), **current term**, **voted for**, an election-timer ring, and its
  log as a row of entries `index:term:command` with the commit index marked. Messages (RequestVote,
  vote replies, AppendEntries, acks) move along the links. Partition = cut links; crash = greyed server.
  Reuses `quorum-split-brain`'s majority badge ("3 of 5").
- **State:** `{ t, servers: [{id, up, role, term, votedFor, log: [{term, cmd}], commitIndex, timerAt}],
  msgs: [{from, to, type, term, payload, deliverAt}], partition: id[][]|null, client: [{at, cmd}] }`.
  Deterministic: fixed timeouts per server per preset, 10 ms message delay, messages delivered in
  `(deliverAt, from, to)` order.
- **One step:** advance to the next event time and process all events at that time in the order above:
  timer expiries, message deliveries, client commands.
- **Rules** (D. Ongaro and J. Ousterhout, "In Search of an Understandable Consensus Algorithm", USENIX ATC
  2014, §5; figure 2 summary) (check):
  1. Time is divided into **terms**; a server that sees a higher term updates its term and becomes a
     follower (§5.1).
  2. A follower whose election timer expires (randomized, 150–300 ms in the paper) increments its term,
     votes for itself and asks the others (§5.2).
  3. Each server grants at most **one vote per term**, first come first served, and only to a candidate
     whose log is at least as up-to-date (last term higher, or equal and last index ≥) (§5.2, §5.4.1).
  4. A candidate with votes from a majority (3 of 5) becomes leader and sends heartbeats (empty
     AppendEntries, every 50 ms here) that reset the followers' timers.
  5. Split vote: no majority → the timer expires again and a new term starts.
  6. The leader appends a client command to its log and replicates it; an entry from the current term is
     **committed** once stored on a majority; earlier entries are committed with it (§5.3, §5.4.2).
  7. A follower whose log conflicts with the leader's (same index, different term) deletes the conflicting
     entry and everything after it, then takes the leader's (§5.3).
  8. A leader cut off in a minority cannot commit anything; when it sees a higher term it steps down.
- **Params:** `timeouts` fixed per preset (shown on each server); `heartbeatMs` 50; buttons "crash leader",
  "partition {S1,S2} | {S3,S4,S5}", "heal", "client command".
- **Presets** (derived by hand from rules 1–8 with the fixed timeouts; check against a reference
  implementation's trace before coding):
  1. `first-election` — timeouts S1 150, S2 200, S3 250, S4 280, S5 300 ms: S1 becomes candidate in term 1 at
     150 ms, votes arrive at 160 ms, **S1 leader of term 1** with 5 votes (majority reached on the second
     reply).
  2. `replicate-commit` — client `x←1` at 200 ms: entry 1:1 on S1, AppendEntries arrive at 210, acks at
     220 → **committed at 220 ms** (S1 + 2 acks = 3 of 5); followers learn the commit index with the next
     heartbeat.
  3. `leader-crash` — S1 crashes at 300 ms; S2's timer (200 ms after the last heartbeat at 260) expires at
     **460 ms** → term 2; S3–S5 grant (S2's log has 1:1) → **S2 leader of term 2**; committed `x←1` survives.
  4. `minority-leader` — partition {S1, S2} | {S3, S4, S5} with S1 leader: S1 appends `x←2`, reaches only
     S2 (2 of 5), **not committed**; S3 times out → term 2, leader with S4, S5, commits `x←3` at index 2;
     heal: S1 sees term 2, steps down, its `2:1:x←2` is replaced by `2:2:x←3` (rule 7).
  5. `split-vote` — S1 and S2 both time out at 150 ms, S5 is down; S3 votes S1, S4 votes S2: 2 and 2, no
     majority; new timeouts S1 +170, S2 +230 → **S1 leader of term 2**.
- **Steps:** `first-election` 4; `replicate-commit` 6; `leader-crash` 7; `minority-leader` 12; `split-vote` 8.
- **Legend:** follower (circle), candidate (circle with "?"), leader (filled circle with crown), term badge,
  vote (check mark on the arrow), log entry (square `index:term`), committed (solid), uncommitted
  (outline), crashed (crossed). "Changed" marks servers whose role/term/log changed in this step.
- **Captions:**
  - hr: „S1 je odsječen s manjinom: ima zapis `x←2`, ali samo na dva od pet poslužitelja, pa ga ne može
    potvrditi (*commit*). Većina je u međuvremenu izabrala novog vođu (*leader*) u mandatu 2."
  - en: "S2 asks for votes in term 2. S3, S4 and S5 have not voted in term 2 and S2's log is as up to date
    as theirs: three votes, a majority."
- **Terms:** consensus — konsenzus; leader / follower / candidate — vođa / sljedbenik / kandidat (check);
  term — mandat (check); election timeout — istek izbornog vremena (check); log entry — zapis u dnevniku;
  commit — potvrda (zapisa) (check); majority — većina.
- **Misconceptions:** "the old leader's writes are kept"; "a leader in a minority keeps working"; "any server
  can win any election" (the up-to-date check).
- **Out of scope:** membership changes, log compaction and snapshots, pre-vote, client retries and
  linearizable reads, Paxos.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `raft` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh raft sims/raft` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/raft/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
