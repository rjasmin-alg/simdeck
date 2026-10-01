# Playbook: building a family of consistent simulators

How the OS simulator was built (16 pages plus a map in two days, 71 commits, about 3,900 tests, six parallel
waves). This is the method to reuse for a project that is **diverse** (each simulator models something different)
yet **consistent** (each looks, behaves, tests and ships the same way).

Written from `~/projects/ossimulator` (GitLab `rjasmin/ossimulator`) as input for simdeck; this copy is the
working one. File names such as `ARCHITECTURE.md`, `DOD.md` or `src/shared/` refer to that repository (its
`docs/` are in Croatian); the section numbers show where to look.

---

## 0. The core idea in five lines

1. **One contract, many simulators.** Every simulator implements the same small interface (pure `sim/` and
   thin `ui/`) and reuses one shared runtime. Diversity lives inside the contract, never around it.
2. **Rules are tests, not prose.** Anything that must be consistent (layout, CSS scope, font size, purity,
   determinism, links, encoding) is checked by a test or a gate. A rule that is only written down drifts.
3. **One template for every spec**, and every spec states its expected numbers up front, already checked.
4. **Hard ownership boundaries.** Each simulator's agent may edit only its own folder. One owner holds
   shared code, which changes only additively after a freeze, and every change goes into a changelog.
5. **Same finish line for everyone.** Every page passes the same Definition of Done gate and gets a review
   from a fresh agent, and the coordinator merges it.

---

## 1. Phases

| Phase | What happens | Output |
|---|---|---|
| **Plan** | Design reports per domain, a reconciliation document, independent recomputation of every number | `docs/design/` (archive), `HANDOFF.md`, `verify_fixtures.py` |
| **Write the rulebook** | Turn the design into short operative docs (in the project's language) before any code | PLAN, ARCHITECTURE, WORKFLOW, DOD, glossary, one spec per page |
| **Wave 0: foundation** | Shared runtime, page skeleton, index/map page, architecture tests, e2e suite, build, gate, deploy script | tag `foundation` |
| **Wave 1: first real page** | One simulator built *while the shared API is still allowed to change*; it is the API's first real user | tag `shared-v1` (API frozen, changes additive only) |
| **Waves 2…N** | Up to four page agents in parallel, one per git worktree, grouped by dependency | tag `wave-N` after each |
| **Capstone** | A page that ties all the others together (here: `journey`) checks that cross-page numbers and links agree | final tag |

The freeze at `shared-v1` is the most important single decision. Before it, the API is shaped by a real
simulator. After it, 15 agents built on a stable base. The changelog (ARCHITECTURE §8) has 16 entries, all additive; there was
no breaking change.

---

## 2. Plan before code, and verify the numbers

- **Write each domain's design report separately**, then a **HANDOFF** that lists:
  - the decisions taken with the owner ("do not re-open without asking");
  - the corrections to the raw reports;
  - the deliverables;
  - the wave plan;
  - the open questions.
- **`verify_fixtures.py`:** a standard-library script with reference implementations of every rule in the
  specs. It recomputes and asserts every number the specs promise: textbook tables, and our own scenarios
  marked "derived, unchecked".
  - A FAIL means either the rule or the number is wrong.
  - Run it before writing the specs.
  - This caught wrong closed forms in the plan before any agent started.
- **Owner decisions come first and become rules**, for example terminology (English term in italics, local
  translation in parentheses at first mention), which reference wins on conflicts, and hosting.
  - Put them in `CLAUDE.md` and the glossary at once, so that no agent invents its own.

---

## 3. The documents (one job each)

| Document | Job |
|---|---|
| `CLAUDE.md` | Short project rules every agent reads first: what, who it is for, language, stack, mandatory architecture split, layout order, quality bar, plan and waves, ownership, dev environment, a table of the other docs |
| `PLAN.md` | Pages, waves, hard dependencies, short DoD, status line |
| `ARCHITECTURE.md` | Repo structure, import rules, the full shared API with signatures, engine semantics, page skeleton, theme, build, pitfalls, **§8 changelog of shared API changes** |
| `WORKFLOW.md` | Roles, waves, worktrees, ownership, how to request a shared change, branch → main, prompts, risks |
| `DOD.md` | The Definition of Done as checkable items (automatic / screenshots and content / review / formalities) |
| `POJMOVNIK.md` (glossary) | Every term: English original, translation, terms left untranslated, terms awaiting confirmation |
| `specs/NN-<id>.md` | One per page, same template (§5 below) |
| `LINUX-DEV.md` | Tools, git remote, local gate, dev ports and SSH tunnels, hosting, LMS upload |
| `OTVORENA-PITANJA.md` | Open questions for the owner, grouped into terms, content decisions and reference checks |
| `src/modules/<id>/NOTES.md` | Per page: decisions, deviations from spec, corrected numbers, **shared requests** |

**Keep the spec as the source of truth for content, and ARCHITECTURE as the source of truth for code.**
When the design archive and the docs disagree, the docs win.

---

## 4. The architecture contract

### 4.1 Two layers per simulator, never mixed
```
src/modules/<id>/
  index.html  main.ts  meta.ts  NOTES.md
  sim/   pure logic: <id>.ts, scenarios.ts, *.test.ts      (no DOM, compiled by a separate tsconfig without DOM libs)
  ui/    views, settings, lanes, css                        (reads state, drives the engine)
```

### 4.2 The simulation contract (`SimDefinition`)
`defaults`, `resetOn` (config keys that force a reset), `createState(config)`, `step(state): SimEvent[]`,
optional `apply(state, action)` (returns `null` to reject), `onConfig`, `onReset`, `halted`, `sample`.

### 4.3 Rules that made 16 different models behave identically
- **The engine owns time.** It runs `tick++`, then applies the scenario actions due at that tick, then calls
  `step`. `step` never writes `tick`.
- **The state is JSON-safe:** plain objects and arrays, sets stored as sorted arrays, no `Map`, `Set`,
  classes or `Date`. This gives free snapshots (`structuredClone`), **step back**, and determinism checks.
- **Determinism:**
  - All randomness comes from `state.rng` (mulberry32), drawn in a fixed, documented order.
  - Sort comparators are total, with ties broken by id.
  - Time is kept in integers, and ratios are compared by cross-multiplication.
  - No `Math.random`, `Date`, timers, `Intl` or DOM in `sim/`. A purity test enforces this.
- **Events have stable codes** `<area>.<kebab>`. Tests assert on code and data, never on display text, so
  wording can change freely.
- **Snapshot before every mutating operation** (step, dispatch, live config change). Step back undoes
  exactly one operation. The log equals the reset events plus the events of every operation still in
  history; this is tested in shared.
- **`sample()` describes the tick that just ran**, not the state after it. Keep a small `last` field in the
  state for this. The timeline trace lives outside the state, or memory grows quadratically.
- **Comparisons:** never put several algorithms in one state. Create one headless runner per variant and
  step them in lockstep with the main engine.
- **Pages with several models:** one `SimDefinition` per page, with a discriminant config key (`mode`) that
  resets the page when it changes.
- **Halting:** `halted()` returns `{kind, label}`. While halted, the user can still step back and reset,
  and every page has a hard tick cap.

### 4.4 Shared runtime (each simulator writes none of this)
- **Engine:** play, pause, step, step back, reset, speed, a requestAnimationFrame accumulator and frozen
  hidden tabs.
- **Page shell:** `mountModule`, which provides the header, back-to-index link, related links, theme and
  projector toggles, help, footer, log, stats, scenario list, shortcuts and `?scenario=` deep links.
- **Building blocks:** settings controls from a spec, a canvas timeline (lanes and tracks, DPR-aware, theme
  tokens, fill patterns), dialogs, link helpers, theme tokens, shortcuts (Space, S, ←, R, digits, ?, Esc).
- **Test helpers:**
  - `expectScenarios`, which the compiler makes complete: it checks that every scenario id is covered,
    that runs are deterministic per seed, that step back equals a repeated step, and that state is JSON-safe;
  - `run`, `replay`, `codes`, `ticksOf`.

The public surface for page agents is about 20 names, listed at the top of ARCHITECTURE §3. Keep it that
small.

### 4.5 One page skeleton, fixed order
Settings → transport → visualisation → log and stats → timeline → ready-made scenarios → short theory with a
chapter reference. A test checks the section ids and their order, `data-page`, `lang`, that no page
hard-codes links to other pages, and that there is no inline font size.

### 4.6 The index (map) is data-driven
- A registry (`MODULE_IDS`, `meta.ts` per page) drives the map. Each page's status (`ready` or `wip`)
  controls whether it shows as unfinished.
- `PUBLIC_SCENARIOS` is a typed registry of every deep link that one page may make into another.
  - An architecture test fails any outgoing link to an id that is not in the registry.
  - Adding a public scenario counts as a shared change.

### 4.7 Builds and runtime
- Two builds from one source: a static multi-page site, and one self-contained HTML file per page for
  upload to the LMS.
- No network at runtime. Fonts are packed locally.
- `check-dist` fails the build on any network reference, and e2e opens the single files from `file://`
  with every request blocked.

---

## 5. The spec template (every page, same sections)

1. Purpose, learning outcomes, in scope / out of scope
2. References (book §, alternative book §; unverified items marked *(check)*)
3. Simulation model: config, state, actions, event codes, **what one tick means, the order of phases within a
   tick, tie-breaks, halting**, measures, `sample`, comparison mode
4. Visualisation, stats, timeline (lanes, tracks, fills)
5. Settings and keys (digits 1–9 are page actions)
6. Scenarios with **expected outcomes as numbers**
7. Tests: textbook examples first (mandatory), then seeded property tests (for example 200 random cases)
8. Theory: 3–6 short paragraphs, terms per the glossary
9. Related pages and deep links (only ids from the registry), plus this page's public scenarios
10. Open questions
11. **The kickoff prompt for the page agent**, ready to paste (working dir, read-first list, rules, task,
    scenarios, mandatory tests, links, dev port, finish procedure)

Section 3 decides whether the page is right. Spell out tie-breaks and phase order explicitly: reviewers
found that the most common untested defect was a tie-break rule.

---

## 6. Enforce consistency with tests and gates

These are architecture tests that run in `npm test`, so every agent hits them on every run:

| Test | Catches |
|---|---|
| import rules | `sim/` importing `ui/`, pages importing other pages, anything importing outside the public API |
| purity | forbidden identifiers in sim code (`Math.random`, `Date`, `Intl`, DOM, timers, `console`, …) |
| page skeleton | section order and ids, `data-page`, `lang`, hard-coded cross-page links, inline font sizes |
| CSS scope | every selector starts with `[data-page="<id>"]` or the page's class prefix (`MODULE_PREFIX`) |
| font size | no CSS or canvas font below 14 px (projector readability) |
| glyphs | only allowed characters (no emoji; specific symbols such as ⊕ Δ ≠ allowed on request) |
| encoding | UTF-8 without BOM, LF, no U+FFFD |
| links | outgoing deep links exist in `PUBLIC_SCENARIOS`; `meta.related` ids are valid |
| naming | lowercase kebab-case file names |

**Gate** (`npm run gate -- <id>`), run locally because there is no server CI:
- `verify`: three typechecks, all tests, the site build, the single-file build and `check-dist`;
- `check:scope`: the branch touched only `src/modules/<id>/**`;
- Playwright e2e for the page:
  - loads without console errors;
  - every `?scenario=` loads paused at tick 0;
  - no horizontal scroll at 375 px;
  - no text node under 14 px in the main areas;
  - light, dark and reduced-motion modes work;
  - keyboard shortcuts work;
  - the single file works offline from `file://`;
  - screenshots at 375×812 and 1280×720 in both themes, plus grayscale and focus shots.

The gate must be **impossible to pass falsely**. The foundation review found several checks that were
green without really checking:
- e2e reused a dev server from another worktree, so it tested the wrong code;
- the digit-key check read a stale live region;
- the deep-link check did not notice autoplay;
- the purity and font checkers missed template interpolations, the `font` shorthand and `style.fontSize`;
- the scope check missed renamed files.

Give every check a test that shows it can fail. Here `tests/rules.test.ts` feeds bad samples to each
checker, and the scope check uses `git diff --no-renames`.

---

## 7. The multi-agent workflow

### 7.1 Roles
| Role | Works in | May change |
|---|---|---|
| Coordinator (the main session) | main checkout, always on `main` | merges, tags, pushes, deploys, shared code |
| Shared-code owner (usually the coordinator) | branch `shared/<topic>` | everything outside `src/modules/` |
| Page agent (one fresh session per page) | worktree `~/<proj>-wt/<id>`, branch `module/<id>` | **only** `src/modules/<id>/**` |
| Reviewer (one fresh session per page, no prior context) | same worktree, read-only | nothing; scratch files only |
| Owner (the teacher) | browser, SSH tunnel, screenshots | approves, answers questions |

### 7.2 Mechanics that kept parallel work collision-free
- **One git worktree per page.** Each has its own `node_modules` and `dist`, so builds never collide.
- **Fixed dev ports** (index 5200, page NN on 5200+NN, bound to 127.0.0.1). e2e ports are derived from the
  worktree path, so parallel gates do not fight over ports.
- **A scratch folder per agent** (`scratchpad/agent-<id>/`, `review-<id>/`). Agents running at the same
  time overwrite each other's probe files otherwise.
- **No package installs by page agents** (`npm ci` only). Tool upgrades happen between waves.
- **Shared requests:** the page agent works around the problem locally and writes the request in
  `NOTES.md` ("Shared requests"). The owner implements it additively on `shared/<topic>` with a test and a
  changelog row, and merges it. The page then rebases and removes its workaround.
- **Merging:** the coordinator rebases the branch, reruns the gate, runs `merge --ff-only`, reruns the full
  gate on `main`, and removes the worktree and branch. Every merged page goes on a straight line of history.
- **Hard dependencies only.** A wave is a priority group, not a barrier. When a slot frees up, start the
  next page whose dependencies are merged. Use at most four page agents at a time.

### 7.3 The brief addendum: lessons fed forward
Keep a short **agent addendum** next to the kickoff prompts, and update it after every wave with what the
reviews found. Every later agent starts with the lessons of all earlier waves. The ones worth carrying to any
simulator project are in §9.

### 7.4 Review by a fresh agent, with mutation testing
The reviewer brief makes the reviewer:
1. run the gate once;
2. view every screenshot, and capture extra states with Playwright (comparison view, dialogs, halt,
   projector mode, mid-page scroll at 1280×720);
3. read the diff against the spec section by section;
4. **break the code on purpose** in a scratch copy, to check that the tests would fail;
5. check NOTES for justified deviations.

The output is findings split into **blocking** and **recommendations**, each with file:line and repro steps,
followed by a verdict on every DoD item. Mutation probes found rules that no test caught, mostly tie-breaks
and "don't try lower candidates" rules.

---

## 8. Definition of done (summary of `DOD.md`)

- **A. Automatic:**
  - the gate is green;
  - every scenario is covered by `expectScenarios`;
  - the textbook examples are tested with the book's numbers;
  - `meta.ts` is complete (status `ready`, summary, 4–8 terms, chapter references, related pages);
  - the architecture tests pass;
  - the gate is green again after the rebase.
- **B. Screenshots and content (agent, then reviewer):**
  - at projector size (1280×720 and projector mode), the visualisation and log fit side by side;
  - at phone size, nothing is cut off;
  - both themes are legible;
  - the grayscale shot still reads (colour is never the only carrier of meaning);
  - focus is visible;
  - the theory follows the glossary;
  - the page shows correctly on the index;
  - links resolve.
- **C. Review:** a fresh reviewer, and the owner's approval.
- **D. Formalities:** NOTES complete, English commit messages, rebased.

Set the page's status to `ready` only at the end; until then the e2e suite skips it. Then rerun the gate.

---

## 9. Defect classes that recurred, and the rule that prevents each

| What went wrong (found in review) | Rule to give every agent from day one |
|---|---|
| Comparison runners stopped when the main engine halted, so the table showed half-finished variants | Once the main engine halts, run every comparison runner to its own end, and show each one's final tick and outcome (or "running, t=…"). Write a test where the main variant finishes first. |
| A user action added late reached a comparison runner at an earlier tick than it was issued | Replay user actions at the tick they were issued. If a runner has already run past that tick, rebuild it and replay, or mark the shift visibly. |
| User-added operations took effect at the end of the planned sequence | User actions take effect in the next tick. The state stays valid with repeated or duplicate ids (reject them with a stated reason). |
| Rejected actions lost keyboard focus | Use `aria-disabled` (not `disabled`), have `dispatch` return false, and announce the reason. e2e checks that every digit either logs something or announces why not. |
| SVG text looked fine in code but was smaller than 14 px on screen | `viewBox` scales text. Draw at 1:1 or put labels in HTML, and measure the rendered size. |
| Layouts broke at projector size (1280×720 and projector mode) | The main view must fit its card without horizontal scroll at 1280×720 in projector mode. Use minimum widths in px, not rem, and shorter labels. Check a projector screenshot in every review. |
| A sticky log overlapped the timeline | Shared layout rules are tested at both target sizes; module CSS cannot override the shell (CSS scope test). |
| Timeline lost its first column (rounding) | Make view-window math a pure function with tests. |
| Tests passed with deliberately wrong code | Write a test for every rule in spec §3 (especially tie-breaks), and confirm it fails by breaking the code temporarily. |
| Step badges covered names on the index at projector size | Check long labels; target browsers forbid `:has()`, so use plain class selectors. |
| A cross-page link pointed to a scenario whose numbers disagreed with the page making the link | The capstone page's reviewer checks every number against the target page. Add a dedicated public scenario rather than reusing a near match. |

Process and infrastructure lessons:
- **Under parallel load, tests time out.** Give the test runner a generous `testTimeout` (60 s here).
- **Agents die on rate limits.** Resume them with a message instead of starting over; relaunch reviewers
  fresh.
- **The git remote may be down.** Commit and merge locally, and push with `timeout 30 git push` so a hung
  remote never blocks work. Push everything once it is back.
- **Deploying:**
  - Use `rsync --chown=root:root --chmod=D755,F644`; plain `-a` copied the local uid and mode 700, and the
    site returned 404.
  - Have the deploy script verify the result itself: 401 without login, 200 with it, for both the site and
    the LMS folder.
- **Collect questions rather than blocking on them.** Keep one running list for the owner (terms, content
  decisions, reference checks). Wherever a decision was needed, the page does something sensible, and the
  question says exactly what it currently does.

---

## 10. Applying this to a simulator index (diverse but consistent)

**Keep identical across all simulators.** These are copied from the foundation and never forked:
- the `sim/` + `ui/` split and the `SimDefinition` contract;
- the engine, history, step back, determinism rules and the JSON-safe state;
- the page skeleton and section order, the shell (`mountModule`), theme tokens, shortcuts and accessibility
  rules;
- event-code format, log kinds, scenario format, the deep-link registry;
- the architecture tests, the gate, the DoD, the spec template, the review brief;
- the two builds, no network at runtime, and the deploy script.

**Free per simulator.** This is where the diversity lives:
- the model, its config, state, actions, and what one tick means;
- the visualisation inside `#viz` (SVG, canvas or HTML), and the page's own CSS behind its prefix;
- its timeline lanes and tracks, comparison variants, and scenarios;
- its theory and references.

**If one simulator does not fit the contract** (a continuous-time model, say, or no natural tick), extend
the contract additively on a `shared/` branch with a test and a changelog row. Do not let that page bypass
the engine. Make the first such page the "wave 1" for that extension, and freeze the extension afterwards.

**Template repo.** For a new family, start from a copy of the foundation: `src/shared`, the map, `tests/`,
`e2e/`, `scripts/`, configs, and the docs skeleton with the domain content removed. Then do only the
planning phase anew: design reports, `verify_fixtures.py`, glossary, specs.

---

## 11. Start-up checklist

1. Write `CLAUDE.md`: purpose and audience, language and terminology rule, which reference wins, stack,
   mandatory split, layout order, quality bar, ownership, dev environment, docs table.
2. Write the design reports and HANDOFF. Get the owner's decisions written down.
3. Write `verify_fixtures.py` and make it pass.
4. Write PLAN (pages, waves, dependencies), ARCHITECTURE, WORKFLOW, DOD, the glossary, and every spec
   from the template, including its kickoff prompt.
5. Set up git and the remote (ask before the first push), the dev ports, and the scratch-folder
   convention.
6. Wave 0: the foundation with architecture tests, e2e, gate and deploy script (dry run). Tag `foundation`.
7. Wave 1: one real simulator, with the API still open. Tag `shared-v1` and freeze the API.
8. Waves 2…N: up to four page agents in parallel, each with its own fresh reviewer. Rebase, gate,
   `--ff-only`, tag. Update the agent addendum after every wave.
9. Capstone page, then check every link and number across pages.
10. Deploy behind the agreed access, verify 401/200, write the open-questions doc, update the status in
    PLAN, CLAUDE.md and the project register, push.
