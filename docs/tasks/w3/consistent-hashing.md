# consistent-hashing: Consistent hashing

| | |
|---|---|
| Task | `consistent-hashing` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-consistent-hashing` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/consistent-hashing/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **adding a node moves 1/n of keys, mod-n moves almost all**.

The student: add and remove nodes in both schemes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- Catalogue seed: relates to CRUSH in link-cephsim
- cephsim `js/engine/hash.js` (rjenkins-style hashing, `stableMod`) and `js/engine/pgmap.js` (`pgToPps`: why
  raising `pgp_num` moves data and `pg_num` alone does not) as the contrast case
- D. Karger, E. Lehman, T. Leighton, R. Panigrahy, M. Levine, D. Lewin, "Consistent Hashing and Random Trees:
  Distributed Caching Protocols for Relieving Hot Spots on the World Wide Web", STOC 1997; G. DeCandia et
  al., "Dynamo: Amazon's Highly Available Key-value Store", SOSP 2007 (virtual nodes) *(check)*

## Model and presets

- **Scene:** two panels over the same 1000 keys. **Left, mod-n:** a bar per node with its key count; a key
  goes to node `hash(key) mod n`. **Right, ring:** a circle of hash space with node points (and their
  virtual points) and keys as small ticks, each key owned by the next node point clockwise. Under both, the
  big number: **keys moved** by the last change, as a count and a percentage, next to the ideal 1/n.
- **State:** pure function of params → `{ nodes: id[], vnodes, owner: {mod: node[], ring: node[]},
  movedLast: {mod, ring}, load: {mod: {node: n}, ring: {node: n}} }`; the previous owner arrays are kept to
  count moves.
- **Live:** adding or removing a node recomputes both panels and highlights the keys that moved.
- **Rules:**
  1. Keys and node points are hashed with one fixed 32-bit hash (the sim picks one, e.g. FNV-1a, and keeps
     it; numbers below were computed with SHA-1 and must be regenerated) (derived).
  2. mod-n: `owner = hash(key) mod n`; going from n to n + 1 nodes moves a key unless both residues agree:
     about n/(n+1) of all keys move (≈ 80 % for 4 → 5) (derived; standard result).
  3. Ring: a key belongs to the first node point at or after its hash, clockwise; wrap past the top to the
     first point (D. Karger et al., "Consistent Hashing and Random Trees", STOC 1997) (check).
  4. Adding a node moves only the keys in the arcs it takes over, ≈ 1/(n+1) of all keys; removing a node
     moves only its keys, to its successors.
  5. With one point per node the arcs are uneven; **virtual nodes** (many points per node) even out the
     load.
  6. Tie-break: a key hashing exactly onto a node point belongs to that node; two node points on the same
     hash → the lower node id first (derived).
- **Params:** `nodes` range 2–10 (4); `vnodes` choice 1 / 10 / 100 (1); buttons "add node", "remove node";
  `keys` fixed 1000.
- **Presets** (example values from a SHA-1 script; regenerate with the sim's hash, expected values within a
  few percent):
  1. `mod-n-add` — 4 → 5 nodes with mod-n: **797 of 1000 keys move** (ideal for the ring: 200).
  2. `ring-add-1vnode` — 4 → 5 on the ring with 1 point per node: **80 keys move**, but the loads are uneven
     (before: 352 / 311 / 232 / 105).
  3. `ring-add-100vnodes` — the same with 100 points per node: **221 keys move** (≈ 1/5), loads 263 / 257 /
     250 / 230 before, 168–223 after.
  4. `remove-node` — 5 → 4 on the ring: only the removed node's keys move; with mod-n again ≈ 80 %.
- **Steps:** explorer, no steps.
- **Legend:** node point (large dot, node colour **and** letter), virtual point (small dot, same letter),
  key (tick), moved key (highlighted tick / bar segment), arc owned (coloured band with letter). "Changed"
  marks keys that moved after the last change.
- **Captions:**
  - hr: „S ostatkom dijeljenja (*mod n*) peti čvor premješta 797 od 1000 ključeva. Na prstenu (*consistent
    hashing*) premješta samo one koje preuzima — oko petine."
  - en: "One point per node: the new node took 80 keys, but node C was already carrying only 105. Virtual
    nodes even this out."
- **Terms:** consistent hashing — dosljedno raspršivanje (check); hash function — funkcija raspršivanja
  (sažetak); ring — prsten; virtual node — virtualni čvor; key — ključ; rebalancing — preraspodjela.
- **Misconceptions:** "adding a server moves 1/n of the data with any hashing"; "one point per node is
  balanced"; "consistent hashing means no data moves".
- **Out of scope:** replication on the ring (successor lists), rendezvous hashing, CRUSH (link `link-cephsim`
  / `crush-failure-domain`: a hierarchical relative), hot keys.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh consistent-hashing sims/consistent-hashing` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/consistent-hashing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
