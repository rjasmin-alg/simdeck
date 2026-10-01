# multimaster-conflict: Multi-master replication with a conflict

| | |
|---|---|
| Task | `multimaster-conflict` (wave 2b, Replication and HA) |
| Catalogue entry | `ha-multimaster-conflict` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/multimaster-conflict/` |
| Class | stepper |
| Size | M |
| Priority | B1 |
| Courses | DR, NLA, WIN2 |
| Topic / tags / level | `distributed` / `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **concurrent writes on two masters; last-writer-wins, versions, what is lost**.

The student: write on both sides of a partition, heal it.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T55 (Napredna Linux administracija; chapters not written yet)
- `docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8
- Catalogue seed: proposal first batch; NLA T55 → §5.7
- `~/projects/faultline/js/engine/authorities.js` (the Time authority: "Whose clock decides which write was
  last?") for rule 4
- DR estate (student side): `student/configs/ad/quillmoor/forest.txt` (three DCs, multi-master; PDC time
  source) and `student/scenarios/S15.md` (a deletion replicated to all three DCs in 15 minutes)
- Standard references: M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 "Multi-Leader
  Replication" and "Detecting Concurrent Writes"; Microsoft Learn "How the Active Directory Replication Model
  Works" (conflict resolution: version, timestamp, GUID) *(check)*; D. S. Parker et al., "Detection of Mutual
  Inconsistency in Distributed Systems" (IEEE TSE 1983, version vectors)

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** the first sequence-over-time page (catalogue §3): two masters **M1** and **M2** as vertical
  lifelines, each with its own clock reading and its copy of the record (a row `x`, or a user object with
  attributes); clients writing to each; replication messages as diagonal arrows; a **partition** drawn as a
  wall between the lifelines. At heal, a **resolution box** shows both versions, the rule applied, the
  winner and what was **lost**.
- **State:** `{ t, clocks: {M1: {offset}, M2: {offset}}, partitioned, copies: {M1: Rec, M2: Rec}, pending:
  [{from, to, change}], events: [], strategy: 'lww'|'vv'|'ad', result: {winner, lost: []}|null }` with
  `Rec = {fields: {name: {value, stamp, version, origin, vv}}}`.
- **One step:** one event: a client write on one master, a replication message delivered, partition on/off,
  or the resolution at heal (shown as its own step).
- **Rules:**
  1. Each master accepts writes locally and replicates them asynchronously to the other (NLA T55;
     Kleppmann, *DDIA*, ch. 5 "Multi-Leader Replication") (check).
  2. While partitioned, messages queue and are delivered after the heal, in send order.
  3. Last-writer-wins (LWW): the version with the larger **timestamp from the writer's own clock** wins; tie
     on timestamp → the larger origin id. The loser is discarded silently.
  4. Clock skew decides LWW: a later write (in real time) on a slow clock loses (faultline
     `authorities.js`, Time: "the loser is chosen by skew rather than by order, and nothing reports it").
  5. Version vectors: each master counts its own updates; version A dominates B if every counter ≥; if
     neither dominates, the writes were **concurrent**: keep both (siblings) and ask the application or user
     (link `lamport-clocks`).
  6. AD-style attribute replication: conflicts are resolved **per attribute**: higher version number wins;
     equal → later originating timestamp; equal → higher originating DC GUID (Microsoft Learn "How the Active
     Directory Replication Model Works", conflict resolution) (check). Changes to different attributes of the
     same object both survive.
  7. A read-modify-write (increment) on both sides is a conflict even though both "agree" on the operation:
     under LWW one increment is lost.
- **Params:** `strategy` choice LWW / version vectors / AD attribute (LWW); `skewM2` choice 0 / −4 s / +4 s
  (−4 s); `partition` toggle; buttons "write on M1", "write on M2", "heal".
- **Presets** (record `x = 10` replicated, partition at t = 2 s; derived, checked by hand):
  1. `lww-skew` — M1 writes `x = 20` at real t = 5 s (stamp 5), M2 writes `x = 30` at real t = 7 s but its
     clock is 4 s slow (stamp 3). Heal: **20 wins**, M2's later write is lost and nothing says so.
  2. `lww-synced` — the same with no skew: 30 wins (stamp 7); M1's write is lost: LWW always loses one.
  3. `version-vectors` — the initial `x = 10` was written on M1 (`{M1: 1, M2: 0}`); after the two writes M1
     holds `{M1: 2, M2: 0}`, M2 holds `{M1: 1, M2: 1}`: neither dominates →
     **conflict kept**, both 20 and 30 shown as siblings.
  4. `ad-attribute` — user `ana`: DC1 sets `telephoneNumber`, DC2 sets the same attribute 3 s later, both
     version 2 → the later timestamp wins; in a second round DC1 sets `title` and DC2 sets `telephoneNumber`
     → both changes kept (catalogue §5.7: covers most of `win-ad-replication`).
  5. `lost-increment` — both masters read 10 and write 11 (counter +1 on each side): LWW result **11**, the
     intended result 12 (one increment lost).
- **Steps:** 1 (initial replication) + 1 (partition) + 2 (writes) + 1 (heal) + 2 (deliveries) + 1 (resolve)
  = 8 for presets 1–3 and 5; `ad-attribute` 12 (two rounds).
- **Legend:** lifeline (vertical line with clock), write (dot with value and stamp), replication message
  (arrow; queued = dashed), partition (wall), winner (solid frame), lost write (crossed, "izgubljeno"),
  siblings (two stacked frames, "sukob"). "Changed" marks the event and the copy it changed in this step.
- **Captions:**
  - hr: „Pobjeđuje zadnji upis (*last-writer-wins*) — ali „zadnji" po satu M2, koji kasni 4 sekunde. Upis
    `x = 30` stigao je kasnije i izgubljen je bez ikakve poruke."
  - en: "Version vectors {M1:2, M2:0} and {M1:1, M2:1}: neither saw the other's write. This is a conflict,
    and the system says so instead of guessing."
- **Terms:** multi-master replication — replikacija s više glavnih poslužitelja (check); conflict — sukob;
  last-writer-wins — pobjeđuje zadnji upis; clock skew — odstupanje satova (check); version vector — vektor
  inačica (check); partition — razdvajanje mreže (particija) (check); attribute — atribut.
- **Misconceptions:** "multi-master means no data is ever lost"; "the later write wins"; "conflicts are rare
  enough to ignore".
- **Out of scope:** CRDTs in depth (mention as the fix for preset 5), consensus (`raft`), single-leader lag
  (`db-replication`), AD USNs and up-to-dateness vectors (part of `win-ad-replication` if built).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `multimaster-conflict` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh multimaster-conflict sims/multimaster-conflict` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/multimaster-conflict/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
