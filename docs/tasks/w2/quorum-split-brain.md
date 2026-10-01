# quorum-split-brain: Quorum and split-brain

| | |
|---|---|
| Task | `quorum-split-brain` (wave 2b, Replication and HA) |
| Catalogue entry | `ha-quorum-split-brain` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/quorum-split-brain/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | NLA, DR, WIN2 |
| Topic / tags / level | `distributed` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **majority keeps one side alive; even counts and witnesses; fencing**.

The student: partition a cluster of 2–5 nodes, add a witness.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T52–53 (Napredna Linux administracija; chapters not written yet)
- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- Catalogue seed: NLA T52–53; cephsim MON quorum → §5.7
- cephsim specifics: `js/engine/net.js` section "quorum" (`needed = floor(monHosts/2) + 1`, largest
  mutually reachable group of configured MONs), `js/engine/health.js` (quorum-loss messages)
- faultline `js/engine/graph.js` (`GATES.quorum`: "a majority of"), `PEDAGOGY.md` §1 (kill one of three;
  partition 2/1; a fourth node makes it worse; five)
- NLA toc T52 ("Grozd — Pacemaker i Corosync, resursi, ograničenja") and T53 ("Ograđivanje")
- Vendor docs: Corosync `votequorum(5)`; ClusterLabs "Pacemaker Explained" (no-quorum-policy); Microsoft
  Learn "Understanding cluster and pool quorum" (witness) *(check titles)*

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K2 topology (own drawing until it exists): 2–5 cluster nodes in a ring of links, an optional
  **witness** (a small vote-only node in a third place), and one **resource** (a service with a virtual IP
  and a shared disk) running on one node. A partition is drawn by cutting links; each side gets a badge
  "votes k of n — quorum / no quorum". Below each side: what it does with the resource (keeps it / starts it /
  stops it).
- **State:** `{ nodes: [{id, up, votes: 1}], witness: {up, votes: 1}|null, links: [{a, b, up}], sides:
  nodeId[][] (derived), resource: {owner, runningOn: nodeId[]}, policy: 'stop'|'ignore', writes: [{side,
  value}] }`.
- **One step:** (1) apply the partition (or node failure), (2) each side counts its votes, (3) each side acts
  on the resource by the rules, (4) if two sides run it, a client write lands on each (split-brain made
  visible), (5) heal and show the divergence.
- **Rules:**
  1. Quorum = more than half of the **configured** votes: ⌊n/2⌋ + 1 (cephsim `js/engine/net.js`: "A majority
     of configured mons must be mutually reachable"; faultline `GATES.quorum`; cluster vendor docs in
     Sources) (check).
  2. A side with quorum keeps or takes over the resource; a side without quorum stops it (policy `stop`).
  3. Even counts split evenly leave **no** side with quorum: 2/2 of 4 → both stop; 1/1 of 2 → both stop.
  4. A witness adds one vote reachable from only one side at a time; the side that reaches it wins (Microsoft
     Learn "Understanding cluster and pool quorum", witness types) (check).
  5. Splits into three or more sides: quorum only if one side alone has the majority (5 nodes 2/2/1 → none).
  6. Policy `ignore` (quorum disabled): every side starts the resource → two writers → **split-brain**; after
     heal the copies differ and one side's writes must be thrown away (link `multimaster-conflict`).
  7. Quorum decides who *may* run; it does not stop a node that cannot hear the decision — that is fencing
     (preset task `fencing`).
  8. Tie-break: a node failure (down) counts as a side of one with zero votes reachable.
- **Params:** `nodes` range 2–5 (3); `witness` toggle (off); `split` select (preset-defined partitions, e.g.
  2|1, 2|2, 3|1, 1|1, 2|2|1); `policy` choice stop / ignore (stop).
- **Presets** (rules applied by hand; MON preset matches cephsim's rule):
  1. `three-nodes` — 3 nodes split 2|1: the pair has 2 of 3 (quorum) and keeps the resource; the single node
     stops it.
  2. `four-nodes` — 4 nodes split 2|2: quorum needs 3, **neither side has it**, the service stops
     everywhere; a fourth node made this worse than three.
  3. `two-plus-witness` — 2 nodes + witness, split 1|1 with the witness reachable from node A: A has 2 of 3,
     keeps running; without the witness both would stop (preset "Windows failover cluster with witness",
     catalogue §5.7).
  4. `five-three-way` — 5 nodes split 2|2|1: no side has 3 → all stop.
  5. `split-brain` — 2 nodes, policy `ignore`, split 1|1: both run the resource, a client writes `x = 1` on A
     and `x = 2` on B; heal: the copies differ.
  6. `ceph-mons` — 3 MONs, one host isolated: 2 of 3 in quorum, the cluster serves; isolate two: no quorum,
     the whole cluster stops serving although every disk is fine (cephsim `net.js`; catalogue §5.7).
- **Steps:** presets 1–4 and 6: 4 (partition, count, act, summary); `split-brain` 6 (partition, count, both
  start, two writes, heal).
- **Legend:** node (circle), witness (small diamond), vote count badge, quorum side (solid frame + "kvorum"),
  no-quorum side (hatched frame + "bez kvoruma"), resource (key icon), two running copies (two keys + "!").
  "Changed" marks sides whose quorum status or resource state changed in this step.
- **Captions:**
  - hr: „Četiri čvora, razdvojena 2 i 2: kvorum (*quorum*) traži 3 glasa i nijedna ga strana nema. Usluga
    staje posvuda — četvrti čvor je pogoršao stvar."
  - en: "Quorum ignored: both halves started the service, and each accepted a different write. Nobody can
    merge them without losing one."
- **Terms:** quorum — kvorum; split-brain — rascjep mozga (split-brain) (check); vote — glas; witness —
  svjedok; partition — razdvajanje mreže; cluster — grozd (NLA T52 „Grozd"); resource — resurs; fencing —
  ograđivanje (NLA T53).
- **Misconceptions:** "more nodes always means more availability"; "a two-node cluster survives losing
  either node"; "if both halves are healthy, running both is fine".
- **Out of scope:** consensus internals (`raft`), dynamic quorum and vote adjustment, fencing mechanics
  (`fencing`, a preset here), resource constraints and placement.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh quorum-split-brain sims/quorum-split-brain` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/quorum-split-brain/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
