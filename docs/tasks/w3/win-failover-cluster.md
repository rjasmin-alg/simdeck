# win-failover-cluster: Failover cluster quorum

| | |
|---|---|
| Task | `win-failover-cluster` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-failover-cluster` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/quorum-split-brain/`** (no page of its own) |
| Folder | `sims/quorum-split-brain/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `quorum-split-brain` merged; only one preset task per host folder at a time |

## Goal

One concept: **node majority, disk and file-share witness**.

The student: fail nodes and the witness.

This is a **preset on `quorum-split-brain`** (Quorum and split-brain), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/quorum-split-brain/` (the host page) and its `NOTES.md`.

## Sources

- No local course material on Windows clustering (NLA T52–T53 cover the Linux counterpart; chapters not written yet). Use the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.7 (ha-quorum-split-brain preset)
- `docs/tasks/w2/quorum-split-brain.md` (host task; model still to be specified, so these needs go to its author).
- Microsoft Learn, *Configure and manage quorum* (Windows Server failover clustering: witness types, dynamic quorum, dynamic witness); *Deploy a cloud witness for a failover cluster*; *Deploy a file share witness*; *Understanding cluster and pool quorum* (check titles). Rules 1–2, 4–5 come from these; rule 6's property is `LowerQuorumPriorityNodeID` (check).
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md` T52–T53 (grozd, ograđivanje; Pacemaker counterpart and Croatian terms).

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Kind:** preset(s) on `quorum-split-brain` (`docs/tasks/w2/quorum-split-brain.md`, model not yet specified).
  This spec says what the Windows presets need, so the host spec can include it.
- **Scene (host's, Windows labels):** cluster nodes N1…N4 as boxes with a vote badge, network links that can be
  cut into partitions, and one witness (disk witness on shared storage, file share witness on a third server,
  or cloud witness) with its own vote badge. Each partition shows its vote count against the majority needed and
  whether it keeps the cluster roles (online / stopped).
- **State the host must carry:** `{ nodes: [{id, up, vote, partition}], witness: {kind: 'none'|'disk'|'fileshare'|
  'cloud', up, vote, reachableFrom: [partition]}, dynamicQuorum, dynamicWitness, partitions: [{id, votes,
  hasQuorum}], rolesOn: partition|null }`.
- **One step (host):** one event (node fails, link cut, witness lost), then recount votes per partition, then
  roles move to the partition with quorum or stop.
- **Rules (Windows):**
  1. A partition keeps running only with more than half of the total configured votes; nodes and the witness
     each have one vote (Sources).
  2. The witness vote belongs to the partition that can reach the witness (disk: owns the disk; file share or
     cloud: can lock the witness file).
  3. Even node counts without a witness can split 50/50: neither side has a majority (derived from rule 1).
  4. Dynamic quorum (Windows Server 2012 and later): when nodes fail one at a time and the cluster still has
     quorum, it removes the failed node's vote, so the cluster can run down to one node ("last man standing") (check).
  5. Dynamic witness (2012 R2 and later): the witness vote counts only when the number of node votes is even
     (check).
  6. 50/50 split with dynamic quorum: the cluster removes one node's vote in advance so one side wins; which one is
     configurable by a cluster property (check, Sources).
  Tie-break in the model: rule 6 picks the node with the highest id to lose its vote unless set.
- **Presets:**
  - `win-2node-fsw` 2 nodes + file share witness, N2 fails: N1 + witness = 2 of 3 → N1 runs. From rule 1, derived.
  - `win-2node-none` 2 nodes, no witness, link cut, static votes: 1 of 2 each → both stop. Derived.
  - `win-4node-split` 4 nodes split 2/2: no witness → both stop; disk witness reachable from N1–N2 → that side
    has 3 of 5 and runs. Derived.
  - `win-dynamic` 3 nodes + file share witness, N3 fails, later N2 fails: static votes (4 total) leave N1 +
    witness with 2 of 4 → stop; with dynamic quorum and dynamic witness the votes are adjusted after each
    failure and N1 keeps running. Derived from rules 1, 4–5, unchecked.
  - `win-witness-lost` 2 nodes + witness, witness share goes away: 2 of 3 → still running; then N2 fails → with
    dynamic witness off, 1 of 3 → stop. Derived, unchecked.
- **Steps:** 2–5 per preset (one event per step plus a recount step).
- **Captions:** hr: "Particija N1 + svjedok ima 2 od 3 glasa: većina, usluge ostaju na N1." / en: "Partition N1 +
  witness has 2 of 3 votes: a majority, the roles stay on N1." — hr: "Podjela 2 : 2 bez svjedoka: nitko nema
  više od pola, grozd staje na obje strane." / en: "A 2 : 2 split with no witness: nobody has more than half, the
  cluster stops on both sides."
- **Terms:** quorum — kvorum; vote — glas; witness — svjedok (disk, dijeljena mapa, oblak) *(check)*; failover
  cluster — grozd s prebacivanjem *(check; NLA T52 uses „grozd")*; partition — particija mreže *(check)*;
  split-brain — razdvojeni mozak (*split-brain*) *(check)*; node — čvor.
- **Misconceptions:** a 2-node cluster survives any single failure without a witness; the witness stores data;
  more nodes always means more safety (even counts tie).
- **Host must support:** per-member votes (0/1), a witness member with a reachability rule (rule 2), and the
  optional dynamic-vote adjustment (rules 4–6) as a toggle; the Pacemaker and Ceph monitor presets do not use it.
- **Out of scope:** fencing (host's second step), Cluster Shared Volumes, node weight PowerShell details,
  stretched clusters across sites.

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
- Only files under `sims/quorum-split-brain/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
