# lamport-clocks: Logical clocks

| | |
|---|---|
| Task | `lamport-clocks` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-lamport-clocks` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/lamport-clocks/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `consensus` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **Lamport and vector clocks order events without a shared clock**.

The student: send messages between three processes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- L. Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System", *Communications of the
  ACM* 21(7), 1978 (happened-before, clock conditions IR1/IR2, total order); C. J. Fidge, "Timestamps in
  Message-Passing Systems That Preserve the Partial Ordering", 1988; F. Mattern, "Virtual Time and Global
  States of Distributed Systems", 1989; van Steen & Tanenbaum, *Distributed Systems*, ch. "Coordination",
  logical clocks *(check edition)*
## Model and presets

- **Scene:** a space-time diagram: three processes **P1, P2, P3** as horizontal lines, events as dots,
  messages as diagonal arrows. Each event carries two labels: its **Lamport timestamp** and its **vector
  timestamp** `[v1, v2, v3]`. Selecting two events shows the verdict: "a → b (happened before)", "b → a" or
  "concurrent", from the vectors, next to what the Lamport numbers alone suggest.
- **State:** `{ procs: [{id, L, V: [0,0,0]}], events: [{id, proc, kind: 'local'|'send'|'recv', msg, L, V}],
  msgs: [{id, from, to, sentL, sentV, delivered}], cursor, selected: [eid, eid]|null }`.
- **One step:** one event on one process (local, send or receive), labels computed and shown.
- **Rules:**
  1. Lamport: before each event a process increments its counter; a send carries it; on receive the
     process sets `L = max(L, msg) + 1` (L. Lamport, "Time, Clocks, and the Ordering of Events in a
     Distributed System", CACM 21(7), 1978, rules IR1, IR2) (check notation).
  2. If a → b then L(a) < L(b); the converse does not hold: L(a) < L(b) does not mean a → b.
  3. Total order (Lamport's ⇒): order by L, tie → by process id (P1 < P2 < P3).
  4. Vector clocks: on each event `V[i] += 1`; a send carries V; on receive `V = max(V, msg)` element-wise,
     then `V[i] += 1` (C. Fidge 1988; F. Mattern 1989).
  5. a → b iff V(a) ≤ V(b) element-wise and V(a) ≠ V(b); if neither ≤ the other, a and b are **concurrent**.
- **Params:** `show` choice Lamport / vector / both (both); `pick` two events to compare; button "add
  event" (local / send to / receive) for free play after a preset.
- **Presets** (computed by hand from rules 1 and 4):
  1. `three-processes` — P1: `a` local (L 1, [1,0,0]); P1 sends m1 to P2 (`s1`: L 2, [2,0,0]); P2: `b` local
     (L 1, [0,1,0]); P2 receives m1 (`r1`: max(1,2)+1 = **3**, [2,2,0]); P3: `c` local (L 1, [0,0,1]); P2
     sends m2 to P3 (`s2`: L 4, [2,3,0]); P3 receives m2 (`r2`: max(1,4)+1 = **5**, [2,3,2]).
  2. `lamport-lies` — on preset 1, compare `c` (L 1) and `s1` (L 2): Lamport suggests c before s1, vectors
     [0,0,1] vs [2,0,0] say **concurrent**.
  3. `true-order` — compare `a` and `r2`: [1,0,0] ≤ [2,3,2] → a → r2 (a chain a → s1 → r1 → s2 → r2).
  4. `tie` — `a`, `b`, `c` all have L 1: the total order breaks the tie by process id: a (P1), b (P2), c (P3);
     the vectors show all three are pairwise concurrent.
- **Steps:** `three-processes` 7 (+1 summary = 8); presets 2–4 start from the finished diagram: 2 steps
  each (select, verdict).
- **Legend:** event (dot; send = filled arrowhead start, receive = arrowhead end), message (arrow), Lamport
  label (number in a circle), vector label (bracketed), happened-before (bold path), concurrent (two dots with
  "‖"). "Changed" marks the event added and the counters updated in this step.
- **Captions:**
  - hr: „P2 prima poruku sa žigom 2, a sam je na 1: uzima veći i dodaje jedan — 3. Lamportov sat
    (*Lamport clock*) tako poštuje uzročnost."
  - en: "c has Lamport 1 and s1 has 2, yet neither could have influenced the other: [0,0,1] and [2,0,0] are
    concurrent."
- **Terms:** logical clock — logički sat; happened-before — dogodilo se prije (relacija uzročnosti) (check);
  concurrent events — istodobni (neovisni) događaji (check); vector clock — vektorski sat; timestamp —
  vremenski žig (check); total order — potpuni poredak (check).
- **Misconceptions:** "a smaller Lamport timestamp means it happened first"; "logical clocks tell real
  time"; "concurrent means at the same moment".
- **Out of scope:** physical clock sync (NTP: `inet-ntp-sync`), hybrid logical clocks, version vectors for
  replicas (`multimaster-conflict`), causal broadcast.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lamport-clocks` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lamport-clocks sims/lamport-clocks` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lamport-clocks/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
