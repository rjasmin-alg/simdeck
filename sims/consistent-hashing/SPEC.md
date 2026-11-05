<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# consistent-hashing: specification

Task `docs/tasks/w3/consistent-hashing.md`, catalogue `ha-consistent-hashing` (§4.7). Class **explorer**: the state is
a pure function of the params (`sim.js` `initial`), no steps.

**One concept:** adding a node moves about 1/n of the keys on a hash ring; `hash mod n` moves almost all of them.

## Scene

Two panels over the same 1000 keys. **Left, mod n:** a bar per node with its key count; the keys that arrived with the
last change are the bar's top segment (highlighted, hatched, outlined) and a `+k` label. **Right, ring:** a circle of
hash space (0 at the top, clockwise); the arc each node owns as a coloured band (a letter on arcs long enough), the
node point as a large lettered dot, virtual points as small dots (letters beside them where there is room), each key as
a tick; moved keys as longer highlighted, outlined ticks. Beside the ring, the ring's keys per node as horizontal bars
with the same marks. A removed node stays as a dashed, muted ghost (bar, row and node point; no strike-through, which would turn D into the
Croatian letter Đ). Under both, the
**keys moved** by the last change: mod n | ideal | ring, each as a count and a percentage of 1000.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `vnodes` | choice | 1 / 10 / 100 (1) | points per node on the ring |
| `from` | range | 2–10 (4) | node count before the last change |
| `nodes` | range | 2–10 (4) | node count now |
| "add node" (`+`) | button | | `from ← nodes`, `nodes ← nodes + 1`; refused at 10 with the reason in the caption |
| "remove node" (`−`) | button | | `from ← nodes`, `nodes ← nodes − 1`; refused at 2 |

Keys: fixed 1000. Nodes are always the first `n` of A … J (ids 0 … 9), so adding appends the next letter and removing
takes away the last one. `from = nodes` means no change yet (nothing moved). Dragging only `nodes` compares `from`
with the new count, so 4 → 7 is three nodes added at once.

## State

`{ nodes: id[], from, vnodes, points: [{h, node, j}] (sorted), before: {points, load}, owner: {mod: node[], ring: node[]},
load: {mod, ring}, arrived: {mod, ring}, gave: {mod, ring}, moved: {mod: key[], ring: key[]}, movedLast: {mod, ring},
ideal: {num, den, keys}, keyHashes }`. `before` is the same computation for `from` nodes; `moved` lists the keys whose
owner differs, `arrived[i]` counts the moved keys now on node i, `gave[i]` the moved keys node i had before.

## Rules

1. **One fixed 32-bit hash** for keys and node points: `hash(s) = fmix32(FNV-1a-32(utf8(s)))`. FNV-1a: offset basis
   `0x811c9dc5`, prime `0x01000193` (Fowler, Noll, Vo; reference values `"" → 0x811c9dc5`, `"a" → 0xe40c292c`,
   `"foobar" → 0xbf9cf968`). `fmix32` is MurmurHash3's finaliser (`^>>16, ×0x85ebca6b, ^>>13, ×0xc2b2ae35, ^>>16`).
   Keys are named `key-0` … `key-999`, points `A-0` … `A-99` (node letter, point index; point 0 is the node point).
   *(derived: the task says "the sim picks one, e.g. FNV-1a"; plain FNV-1a on these sequential names clusters badly,
   e.g. 785 of 1000 keys on one node with 4 nodes and one point each, and only 121 keys moving with 100 points, so the
   finaliser is added. Checked with a script, NOTES.md.)*
2. **mod n:** owner = node `hash(key) mod n`. From n to n + 1 a key moves unless `hash mod n = hash mod n+1`: about
   n/(n+1) of all keys move (standard result; derived).
3. **Ring:** a key belongs to the first node point at or after its hash, clockwise; past the last point it wraps to the
   first one (Karger et al. 1997 *(check)*).
4. Adding a node moves only the keys on the arcs it takes over (each moved key's new owner is a new node), ≈ 1/(n+1)
   of all keys; removing a node moves only its keys, each to the next surviving point clockwise (follows from 3).
5. With one point per node the arcs are uneven; **virtual nodes** (many points per node) even out the load (DeCandia et
   al. 2007 *(check)*). The points of 10 are a prefix of the points of 100 (same names), so 10 → 100 only adds points.
6. **Tie-breaks:** a key hashing exactly onto a node point belongs to that point's node; points on the same hash sort by
   node id, then point index, so the lower node id comes first and takes the key (derived). The extremes of the load
   (caption) name the lower node id on equal loads.
7. **Ideal** for a change from a to b nodes: `|b − a| / max(a, b)` of all keys (1/5 = 200 for 4 → 5 and for 5 → 4).
   Before any change the box shows the ideal for the next "add node" (or "remove node" at 10).

## Presets (numbers with this hash; checked by `sim.test.js`)

The task's numbers came from a SHA-1 script and had to be regenerated (rule 1).

| # | id | params | mod n moved | ring moved | ring loads |
|---|---|---|---|---|---|
| 1 | `mod-n-add` | 4 → 5, 1 point | **805** (80.5 %; task 797) | 234 | ideal 200 |
| 2 | `ring-add-1vnode` | 4 → 5, 1 point | 805 | **234** (task 80) | before 108 / 279 / 92 / 521 (task 352 / 311 / 232 / 105); after 108 / 45 / 92 / 521 / 234; all 234 from B |
| 3 | `ring-add-100vnodes` | 4 → 5, 100 points | 805 | **225** (task 221) | before 292 / 256 / 248 / 204 (task 263 / 257 / 250 / 230); after 165–225 (task 168–223); taken from all 4 |
| 4 | `remove-node` | 5 → 4, 100 points | 805 | **225**, only E's | E's keys go 73 / 72 / 41 / 39 to A / B / C / D |

mod n for n → n + 1 (1000 keys): 2→3 670, 3→4 783, 4→5 805, 5→6 837, 6→7 859, 7→8 877, 8→9 899, 9→10 894
(n/(n+1): 667, 750, 800, 833, 857, 875, 889, 900).

With one point per node the ring's 4 → 5 is 234 here and 80 in the task: with one point it depends entirely on where
the new point lands (other names gave 68–750 in the check script), which is the preset's lesson. Presets 1 and 2 have
the same params; their captions differ (1 explains the residues, 2 the uneven arcs).

## Captions

- No change: the node and point count, "add or remove a node (+ / −)", then the load note.
- One node added: "Node E joined. With *mod n* 805 of 1000 keys move (80.5%); on the ring only the keys on the arcs E
  takes over: 234 (23.4%)." Several: the same for a list. Preset 1 instead: "With *mod n* the fifth node moves 805 of
  1000 keys: a key stays only if hash mod 4 equals hash mod 5. On the ring (*consistent hashing*) it moves only the keys
  it takes over: 234." (the task's hr caption, regenerated).
- Removed: "Node E left. With *mod n* 805 of 1000 keys move (80.5%); on the ring only the 225 keys E held, each to the
  next point clockwise."
- Load note: one point per node: "the arcs are uneven, D carries 521 keys and B only 45. Virtual nodes even this out."
  (the task's en caption, regenerated); more points: from how many nodes the keys came (or to how many they went) and
  the load range.
- A refused button press: "At most 10 nodes." / "At least 2 nodes." before the caption, until the params change (it
  does not come back when they return to the same values).
- Numbers with a noun use plural forms (hr: 521 ključ / 522 ključa / 525 ključeva).

## Out of scope

Replication on the ring (successor lists), rendezvous hashing, CRUSH (related: `crush-failure-domain`, `cephsim`), hot
keys, weighted nodes.
