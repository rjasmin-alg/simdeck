# broadcast-storm: A loop without spanning tree

| | |
|---|---|
| Task | `broadcast-storm` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-broadcast-storm` in `docs/catalogue.md` §4.1 |
| Kind | **add a preset to `sims/stp/`** (no page of its own) |
| Folder | `sims/stp/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `switching` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `stp` merged; only one preset task per host folder at a time; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **one broadcast multiplies forever in a switched loop**.

The student: send one broadcast, count frames per step.

This is a **preset on `stp`** (Spanning tree), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/stp/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` "Ethernet u preklopljenoj mreži" (broadcast domain; a switch floods a broadcast/unknown frame out of every other port; the *broadcast* oluja paragraph: switches faithfully forward every such frame and the network can stop working; only a router stops it)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` Primjer 2 "preplavljivanje pogađa i onoga tko nema veze s razgovorom" (flooding reaches hosts unrelated to the conversation)
- IEEE Std 802.1D (spanning tree exists precisely to prevent L2 loops; a loop with no STP has no TTL to stop a frame) *(check: no local copy)*
- Catalogue seed: pairs with net-stp → §5.10 (same page as `net-stp`)

## Overlaps (catalogue §5)

- **§5.10 Switching loops:** One page: the storm is step 1 (STP off), STP is step 2.

## Model and presets

- **Scene:** a small switched topology with a **loop** — three switches S1, S2, S3 in a triangle (or two
  switches with two parallel links) and one host H on S1. Each switch shows its ports; a running **counter**
  of frames currently in flight and a cumulative total. Uses the kit's topology-with-moving-packets view (K2)
  if it exists; otherwise its own (say so in NOTES.md).
- **State:** `{ step, stpOn: bool, frames: [{ id, atSwitch, inPort, kind: 'broadcast' }], inFlight,
  total, blockedPorts: [switch,port], cappedAt }`. The host injects exactly one broadcast frame at step 1.
- **One step:** every switch takes each frame currently at it and floods a copy out of **every other** port
  (not the one it arrived on). With the loop and no STP the in-flight count multiplies each step; with STP on,
  blocked ports drop their copies so exactly one path remains. Order within a step: each switch floods →
  copies travel one hop → recount in-flight → caption. Cap the count (`cappedAt`, e.g. 64) so the view and
  the step budget stay bounded; say "and so on, without limit".
- **Rules:**
  1. A switch forwards a broadcast frame (destination all-ones) out of every port except the one it arrived
     on, always, whether or not it knows the sender (URM ch07, broadcast-domain paragraph).
  2. An Ethernet frame has no TTL/hop count, so nothing in the frame ever stops it looping (URM ch07, oluja
     paragraph: "svi preklopnici na putu vjerno prosljeđuju svaki takav okvir dalje"; contrast IP's TTL).
  3. With a physical loop and rule 1, one broadcast becomes many: on a triangle each switch that receives a
     copy makes (ports − 1) more, so the in-flight count grows every step until the network is saturated
     (URM ch07: "jedan uređaj … može zagušiti cijelu logičku mrežu").
  4. Only a router bounds the flood: it does not forward L2 broadcasts, so each router-bounded network is one
     broadcast domain (URM ch07). STP, not a router, is what makes a **looped switched** network usable.
  5. With STP on, one port per loop is Blocking and silently discards the frame, breaking the cycle so exactly
     one copy reaches each segment (IEEE 802.1D *(check)*; detail is `net-stp`).
  6. Tie-break / determinism: within a step all switches flood from the same snapshot (copies made this step
     are forwarded next step), so the growth is deterministic and step-back replays exactly.
  7. Edge case: a single broadcast on a loop-free tree reaches every host exactly once and then stops — no
     storm (contrast preset).
- **Params:** `stp` toggle (default off); `switches` choice 3 (triangle) | 4 (square) (default 3); `cap`
  range 16–128 (default 64); button `inject` (key `N`) sends one more broadcast.
- **Presets:**
  1. `storm` — triangle, STP off: H sends 1 broadcast; in-flight 1 → 2 → 4 → … doubling each step until the
     cap, total climbing without bound. From URM ch07 (qualitative); the exact doubling is derived, unchecked.
  2. `stp-on` — same triangle, STP on: one port on S3 is Blocking; the broadcast reaches each switch exactly
     once (in-flight peaks at 2, then 0), total = number of segments. This is step/preset 2 of the merged page
     (§5.10). Derived from `net-stp`, unchecked.
  3. `no-loop` — a loop-free tree (remove one link): one broadcast reaches all hosts once and dies; no storm,
     no STP needed. Rule 7. From URM ch07 broadcast-domain.
  4. `router-boundary` — two switched networks joined by a router: a storm in one network never crosses into
     the other. Rule 4. From URM ch07 (router bounds the broadcast domain).
- **Steps:** about 8 (`storm`, until the cap), 5 (`stp-on`), 4 (`no-loop`), 6 (`router-boundary`). Derived.
- **Legend:** switch (square), host (round), router (hexagon); broadcast copy (c1 arrow); Blocking port (red
  bar + "X"); link (line); a big in-flight number. "changed" marks the frames created this step and any newly
  blocked port.
- **Captions:**
  - hr: "Svaki preklopnik prosljeđuje *broadcast* na sve ostale priključke, a okvir nema TTL — pa se broj
    kopija u letu udvostručuje sa svakim korakom: 1, 2, 4, 8…"
  - en: "With spanning tree on, S3's port is Blocking: the loop is cut, so the broadcast reaches each switch
    once and then stops. No storm."
- **Terms:** broadcast storm — *broadcast* oluja; broadcast domain — *broadcast* domena; switching loop —
  petlja u preklapanju *(check)*; flooding — preplavljivanje; spanning tree — razapinjuće stablo *(check)*;
  blocking port — blokirani priključak *(check)*; frame — okvir; broadcast frame — okvir upućen svima.
- **Misconceptions:** a frame eventually times out like an IP packet (it has no TTL, rule 2); a router inside
  the loop would stop it (it only bounds the domain; STP is what fixes a switched loop); the storm needs a
  faulty device (one ordinary broadcast on a loop is enough).
- **Out of scope:** STP election and port roles themselves (`net-stp`), RSTP timers, storm-control rate
  limiting on switches, unicast flooding of unknown destinations (mention only).

<!-- model: filled -->

**Note for the coordinator:** per catalogue §5.10 this is **one page with `net-stp`**: the storm is the
"STP off" step/preset and STP is the next. This task is marked "adds a preset to `sims/stp/`" and depends
hard on `stp`, so build it as presets `storm`/`no-loop`/`router-boundary` on the `stp` host rather than a
separate sim; `stp-on` is already the host's own content. The URM book has no frame-count numbers; the
doubling is derived and should be checked.

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/stp/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
