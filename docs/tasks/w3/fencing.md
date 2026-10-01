# fencing: Fencing (STONITH)

| | |
|---|---|
| Task | `fencing` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-fencing` in `docs/catalogue.md` §4.7 |
| Kind | **add a preset to `sims/quorum-split-brain/`** (no page of its own) |
| Folder | `sims/quorum-split-brain/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `quorum-split-brain` merged; only one preset task per host folder at a time |

## Goal

One concept: **why a node must be killed before its resources move**.

The student: hang a node with and without fencing.

This is a **preset on `quorum-split-brain`** (Quorum and split-brain), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.
5. `sims/quorum-split-brain/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T53 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T53 → §5.7
- Vendor docs (no local copy): ClusterLabs "Pacemaker Explained", chapter on fencing (STONITH, fencing
  delays, two-node clusters); Corosync `votequorum(5)` (`two_node`) *(check titles and options)*
- Host task: `docs/tasks/w2/quorum-split-brain.md`

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

**Preset task on `quorum-split-brain`** (catalogue §5.7: "fencing is its second step"). Same scene; adds a
node that is **hung, not dead**, a fence device per node, and a shared disk that records who wrote what.

- **What the host model must support** (request under "Shared requests" if missing): (a) a node state
  `hung` (alive, holds the resource, sends no heartbeats, may wake up and continue writing); (b) a shared
  disk with a write log `[{node, value, t}]`; (c) a `fence(node)` action with result `ok | failed`
  (out-of-band power control, shown as a separate "power switch" box per node); (d) the rule "start the
  resource only after the old owner is confirmed fenced".
- **State added:** `{ fencing: bool, fenceDevice: {node: 'ok'|'unreachable'}, fenced: nodeId[], disk:
  [{node, value, t}], delayMs: {node: ms} }`.
- **One step:** (1) node A hangs; (2) the others miss its heartbeats and have quorum; (3) with fencing: fence
  A, wait for confirmation; without: skip; (4) start the resource on B; (5) A wakes up and tries to write;
  (6) result on the shared disk.
- **Rules:**
  1. A node that stops answering may still be running and holding the resource; silence is not death
     (NLA T53: "zašto grozd bez njega nije grozd").
  2. With fencing, the quorum side first cuts the silent node off (power off / reset via its management
     controller, or cuts its storage access) and moves the resource **only after** the fence is confirmed
     (cluster vendor docs in Sources; "STONITH") (check).
  3. If fencing fails, the resource is **not** started anywhere: down is better than two writers (check
     default behaviour).
  4. Without fencing, a hung owner that wakes up keeps writing: two nodes write the shared disk → corruption
     (both values interleaved in the write log).
  5. Two-node clusters can fence each other at the same moment ("fence race"); a fixed delay on one node
     decides who shoots first (tie-break) (cluster vendor docs, fencing delay) (check).
  6. Quorum (host rules) still applies: only a side with quorum may fence.
- **Params added:** `fencing` toggle (on); `fenceDevice` choice ok / unreachable (ok); `delayA` choice 0 /
  5 s (0); button "A wakes up".
- **Presets** (derived, checked by hand):
  1. `no-fencing` — 3 nodes, A (resource owner) hangs; B and C have quorum and start the resource on B; A
     wakes up and writes `x = 1` while B writes `x = 2`: **two writers**, the disk log interleaves both.
  2. `fence-then-move` — the same with fencing: A is powered off (confirmed), then the resource starts on B;
     A's late write never happens. **One writer.**
  3. `fence-fails` — the fence device is unreachable: the resource stays stopped on all nodes until an
     operator confirms A is off (service down, data safe).
  4. `two-node-race` — 2 nodes (two-node mode), the link between them breaks: both try to fence the other;
     with `delayA` 5 s, B fences first and A is off; with no delay both may be powered off (derived)
     (check).
- **Steps:** `no-fencing` 6, `fence-then-move` 6, `fence-fails` 5, `two-node-race` 5.
- **Legend (adds to the host's):** hung node (frozen clock icon, outline only), fence device (plug icon),
  fenced node (powered-off, crossed), shared disk log (list, each entry tagged by node). "Changed" as in the
  host.
- **Captions:**
  - hr: „Čvor A ne odgovara, ali nije mrtav. Bez ograđivanja (*fencing*) B preuzima uslugu, A se budi i
    nastavlja pisati: dva pisca na istom disku."
  - en: "Fence first, move second: A is powered off and confirmed off before B starts the service."
- **Terms:** fencing — ograđivanje (NLA T53); STONITH — STONITH („pucaj u glavu drugom čvoru"); hung node —
  zaglavljeni čvor (check); shared storage — zajedničko spremište; management controller — upravljački
  kontroler (check); two-node cluster — grozd od dva čvora.
- **Misconceptions:** "a node that does not answer is dead"; "quorum alone prevents split-brain"; "if
  fencing fails, start the service anyway to stay available".
- **Out of scope:** fence device protocols and configuration, storage-based fencing in detail (SCSI
  reservations: `nas-vs-san` preset 4), watchdog-based self-fencing (mention only).

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
