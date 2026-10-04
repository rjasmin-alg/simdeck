<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multimaster-conflict: notes

New stepper (task `docs/tasks/w2/multimaster-conflict.md`, catalogue `ha-multimaster-conflict`, wave 2b). Drawn with
kit view **K1, message sequence chart** (`kit/sequence.js`): the task's "sequence-over-time page" is exactly K1's
shape (lifelines, one row per event, arrows between lanes). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two lanes, M1 and M2** (DC1 and DC2 with the AD rule). Client writes are notes on the writer's lane (a dot, the
  value and the stamp), not client lanes: two more lanes would leave no room for the resolution box, and the client
  carries no state. The lane cards hold the clock (reading and skew, dashed when skewed) and the copy of the record.
- **The partition wall** is drawn by the page: a hatched band at K1's own midpoint between the two lifelines
  (`Simdeck.sequence.css(midway(laneAt(0,2), laneAt(1,2)))`), appended to each row's lane while partitioned. The
  partition, heal and resolution notes are K1 notes moved onto the same midpoint. A **queued message** is K1's dropped
  message (`drop: true`, which ends at the midpoint, i.e. at the wall) with its ✕ hidden by page CSS and the receiver
  word "čeka u redu / queued": held, not lost. See "Shared requests".
- **Messages in flight without a partition** (partition off, AD round 2) get no row of their own at the send; the
  delivery row shows them. Queued messages do get a row at the write, because the queue against the wall is the point.
- **The page shows what the active rule reads**: the stamp (LWW), the vector (VV), version · stamp (AD), in the lane
  cards, on the chips and in the box. The model keeps all of it on every version, so changing the strategy only
  changes what is shown and how conflicts are resolved.
- **LWW is applied at the writer too** (SPEC rule 3): with the partition off and M2's clock 4 s slow, M2's later write
  `30@03` is discarded at M2 itself against the stored `20@05`, and the caption says the client was told OK. This is
  rule 4 without any partition. I chose this over "the writer always overwrites locally" because a store that
  compares stamps does so on every apply; otherwise the two copies would diverge.
- **Lost vs overwritten.** A write replaced by a write that had already seen it (its vector dominates; tracked in
  every strategy, shown only under VV) is "overwritten in order", not lost. So with the partition off and synced
  clocks nothing is lost, and the summary says so.
- **`skewM2` does not reset** the run: changing it at the resolution step replays the same steps with the new stamps,
  so the class can flip −4 s → 0 s and watch the winner change. The other params reset to step 0.
- **AD values:** phone numbers are data; the `title` values are words from the string table (`@title1`,
  `@title2` in the model: asistentica/docentica, teaching assistant/assistant professor), so the English page shows no
  Croatian word.
- **AD round 2** (different attributes) has no resolve step of its own: the round-2 summary appears with the last
  delivery (step 12), which matches the task's 12 steps. `writers` applies to both rounds (M1 only: 8 steps).
- Clocks read `10:00:00 + t + skew` (hh:mm:ss), so the task's "stamp 5" and "stamp 3" are 10:00:05 and 10:00:03;
  the chart's time column is real time in seconds.

## Deviations from the task

- **Buttons → params.** The task lists buttons "write on M1", "write on M2", "heal" and a `partition` toggle. A
  stepper replays from its params, so writes are a param `writers` (both / M1 only / M2 only) and the partition stays
  a toggle; "Spoji mrežu / Heal the network" is a button that jumps to the heal step. Two toggles for the writers did
  not fit the panel at 1920×1080 in Croatian (`one-screen`), so it is one choice.
- **`op` is a toggle `inc`** ("Obje strane: x + 1"), for the same panel height; disabled under the AD rule with a reason.
- **Partition off** is a scene of its own (each write delivered before the next), 6 steps; the task names the toggle
  but not its run.
- The `version-vectors` preset uses **skew 0** (the task's default −4 s would print a skewed stamp that vectors never
  read); its write captions leave the stamp out.
- The AD preset uses **skew 0** so its numbers are the task's ("DC2 3 s later → the later timestamp wins"); with the
  default −4 s DC1 would win.

## Sources

- Task file, rules 1–7 and the five presets.
- M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5, "Multi-Leader Replication", "Detecting Concurrent
  Writes" (LWW, siblings, version vectors).
- D. S. Parker et al., "Detection of Mutual Inconsistency in Distributed Systems", IEEE TSE SE-9(3), 1983 (version
  vectors).
- Microsoft Learn, "How the Active Directory Replication Model Works", conflict resolution: attribute version, then
  originating time stamp, then originating DSA GUID *(check: which GUID wins on the last tie; the model takes the
  higher, as the task says)*.
- `~/projects/faultline/js/engine/authorities.js`, the Time authority ("Whose clock decides which write was last? …
  the loser is chosen by skew rather than by order, and nothing reports it").
- DR estate, student side: `student/configs/ad/quillmoor/forest.txt` (three DCs, multi-master, PDC as time source),
  consistent with the AD preset; no answer-key material used.
- NLA `meta/toc.md` T55 (replication; the chapter is not written yet) *(check)*.

## Checks

- Numbers: an independent Python hand model (tuple comparisons for LWW and AD, element-wise ≥ for vectors) gave the
  five presets' outcomes before the page was written: 20 (stamp 5 vs 3), 30 (7 vs 5), vectors {M1:2,M2:0} /
  {M1:1,M2:1} neither ≥, 555-0303 then 555-0404 and the title both kept, 11 vs intended 12. The model agrees
  (`sim.test.js`, "presets" and the rule tests).
- Rule tests broken on purpose, one mutation at a time (19 mutations: LWW tie flipped, smaller stamp wins, GUID
  flipped, AD stamp before version, earlier AD stamp wins, `>` for `≥` in vectors, concurrent writes not kept, vector
  not incremented, stamp from real time, deliveries last-in-first, no LWW check at the writer, no partition, AD version
  fixed, increment not reading, intended wrong, `laterLost` inverted, overwritten counted as lost, AD round 2 on one
  attribute, DC2 not 3 s later): every one fails a test. After the review, 8 more (below): 27 in all, none survive.
- Page sweep: every step of every param combination (lww/vv/ad × 3 skews × partition × writers × inc) in both
  languages, 1344 page loads, no console errors and no empty or broken caption.
- `npm run gate -- multimaster-conflict`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus each preset at its key step (lww-skew 4, 7, 8; version-vectors 8; ad-attribute 4, 8, 12;
  lost-increment 8; lww-synced 6) and dark at lww-skew 6.

## Unchecked *(check)*

- Croatian terms: "replikacija s više glavnih poslužitelja" (*multi-master replication*), "odstupanje satova"
  (*clock skew*), "vektor inačica" (*version vector*), "razdvajanje mreže" (*partition*) — the task marks all four
  *(check)*; not in the course books yet.
- The AD GUID tie-break direction (above).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

`partition` is in the glossary but as a disk partition (particija), so the network sense is written out.

| English | Croatian | Source |
|---|---|---|
| multi-master replication | replikacija s više glavnih poslužitelja | task *(check)* |
| conflict | sukob | task |
| last-writer-wins | pobjeđuje zadnji upis | task |
| clock skew | odstupanje satova | task *(check)* |
| version vector | vektor inačica | task *(check)* |
| (network) partition | razdvajanje mreže | task *(check)* |
| attribute | atribut | task |
| CRDT | (no Croatian term; the English kept) | — |

## Shared requests

- **K1: a wall between two lanes over a range of rows** (`walls: [{ between: ['M1', 'M2'], from, to, label }]`, drawn
  like a timer but centred between the lifelines). The page appends its own `.mm-wall` span to each row's
  `.sd-seq-lane` at `css(midway(…))`; it depends on K1's row markup.
- **K1: a held message** (`hold: true`: the arrow stops at the midpoint like `drop`, without the ✕) for queued or
  buffered messages. The page uses `drop: true` and hides `.sd-seq-x` in rows it marks `data-queued`.
- **K1: a note between two lanes** (`lane: ['M1', 'M2']` centres the note between them). The page moves the note's
  `left` after the chart is built.

- **Fresh review** (a separate agent read the code against SPEC.md, ran 57 mutations and swept the page in both
  languages). Model and presets confirmed. Fixed from it: the lost-increment caption when the reads differ (partition
  off, slow M2: M2 read 11, wrote 12, lost on the stamp; new caption), the vector preset's unexplained skewed stamp
  (skew 0, no stamp in vector write captions), `writers` now applies to AD round 2, the rejected-but-still-sent write
  stated in SPEC and the caption, the box's rule line for an ordered overwrite, Croatian wording ("oznaka (ID)
  izvora", „…“ quotes, "odstupanje sata" throughout, "šalje korisnika ana", "odbaci", no "braća" for siblings, CRDT
  term order). New tests for the 8 surviving mutations: a write over siblings (vector merge), a version arriving at a
  sibling pair, AD not rejecting on the stamp, intended with different reads, the initial title version, the real
  times of the default run, no winner among siblings. Left as is (equivalent or unreachable): `>=` inside the stamp
  branch, `kept` with `||` on converged copies, `got` from M2, equal real times.

## Time

Start 2026-10-04 10:52, gate passing 11:05, review fixed 11:16: about 30 min of build and review.
