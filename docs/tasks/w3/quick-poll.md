# quick-poll: Quick poll

| | |
|---|---|
| Task | `quick-poll` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `tool-quick-poll` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/quick-poll/` |
| Class | tool |
| Size | M |
| Priority | P3 |
| Courses | all |
| Topic / tags / level | `classroom` / `classroom-tool` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **students answer A–D from phones, results on the projector**.

The student: ask, collect, reveal.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- No course material needed. Catalogue §4.11 note: needs a server or a shared-state capability; out of scope for static pages today. Kit constraints: `docs/sim-ui.md` §5 (pure, deterministic model; no `Date` or network in the model) and COMMON.md §3 (offline: nothing loaded from the network).

## Model and presets

- **Scene (projector view):** the question and answers A–D in large type, a join code or QR code for phones, a live
  count of answers received (not the split, until reveal), and after "reveal" a bar chart A–D with counts and
  percentages, the correct answer marked if the teacher set one. **Phone view:** four big buttons A–D and a
  confirmation "Odgovor zabilježen: B".
- **State (pure part, testable):** `{ pollId, question, options: ['A','B','C','D'], correct|null, phase: 'open'|
  'closed'|'revealed', votes: {[voterId]: {option, at}} }`; derived `tally(state) → {A, B, C, D, total}`.
- **One action (tool, not a stepper):** `vote(state, voterId, option)`, `close(state)`, `reveal(state)`,
  `reset(state, newQuestion)`: pure functions over the state, the transport supplies the votes.
- **Rules:**
  1. One vote per voter id per poll; a later vote from the same id replaces the earlier one while the poll is open
     (students may change their minds) *(decision, derived)*.
  2. Votes after `close` are rejected (the phone says so).
  3. Results stay hidden on the projector until `reveal`, so early answers do not steer later ones.
  4. Voter ids are random per browser, never names; nothing personal is stored.
  5. Tally ties are shown as ties; percentages rounded so they sum to 100 (largest remainder).
- **Transport (the blocker):** a static, offline page cannot collect answers from other devices. Options for the
  owner: (a) a shared-state capability of the hosting (if the site gets one), (b) a small local server on the
  classroom machine, (c) an offline fallback where the teacher types the counts from a show of hands (a different,
  much smaller tool). The pure model above is the same for all three.
- **Params:** `question` text and four option texts (needs a text field: see the note in `endianness`), `correct`
  choice none / A–D, buttons open / close / reveal / reset.
- **Presets:** `abcd-blank` (A–D with no text, for a question shown on a slide), `yes-no` (two options),
  `confidence` (A sure … D guessing).
- **Steps:** tool, none.
- **Legend:** bars A–D with letters on the bars (colour not alone), correct answer (✓ + outline).
- **Captions:**
  - hr: „Odgovora: 23. Rezultati su skriveni dok ih ne otkrijete.“
  - en: "Answers: 23. Results stay hidden until you reveal them."
- **Terms:** poll — anketa; vote — glas (odgovor); reveal — otkriti rezultate; join code — kod za pristup (check).
- **Misconceptions:** not a teaching sim; none.
- **Out of scope:** accounts, grading, free-text answers, storing results after the lecture.
- **Note for the coordinator:** blocked on a transport decision (catalogue §4.11: "needs a server or a shared-state
  capability; out of scope for static pages today"). Only the pure model and the projector/phone layouts can be
  built now; do not schedule it before the owner picks option (a), (b) or (c).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh quick-poll sims/quick-poll` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/quick-poll/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
