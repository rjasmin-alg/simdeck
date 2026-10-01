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

## 10. Applying this to simdeck

Sources: `docs/proposal-simdeck.md` and `docs/design-notes-simdeck.md`. Where those leave a question open,
this section makes a recommendation and says so; nothing here overrides a decision already taken there.

### 10.1 What is different from ossimulator

| | ossimulator | simdeck |
|---|---|---|
| Collection | closed: 16 pages designed together, then built | open-ended: 23 imported labs plus ossimulator, three apps, 14 book pages and 29 applets, 5 new in the first batch, about 20 more planned, ≥ 25 native by the end of the semester |
| One page is | a full simulator with six sections (settings, viz, log, timeline, scenarios, theory) | one concept on one screen, a 3–5 minute demo |
| Main use | lecture and self-study | the lecturer at the lectern with a presentation clicker; course pages for students |
| Time model | ticks, a play loop, history with step back | discrete steps (or live parameters, see §10.4) |
| Readability | ≥ 14 px, 375 px to projector | ≥ ~20 px body text, fits 1920×1080 without scrolling, washed-out projector palette |
| Index | a fixed layered map built from a module registry | a searchable index and generated course pages, both from one manifest |
| Entries | all built to one contract | *native* (built to the contract) and *linked* (exempt, manifest only) |
| Contract enforced by | architecture tests and an e2e gate | a contract check script on every native page, plus a manifest check |

The consequence: **simdeck keeps the method** (one contract, rules as checks, one template, a freeze after
the first real page, the same finish line) **and drops most of the machinery**: the six-section skeleton,
ticks, the log, the timeline, comparison runners, the layered map.

### 10.2 Identical on every native page (the contract)

Each rule needs a check in the contract script; a rule without a check is a recommendation, not a rule.

| Rule | How it is checked |
|---|---|
| The kit is inlined: colour tokens, header with legend, step controller | the build inlines `kit/`; the check finds the kit's marker and version in the output |
| Only kit tokens for colour; every `var(--x)` used is defined | carry over the undefined-token check from `single-page-labs/deploy.sh` |
| Fits one 1920×1080 screen, no scrolling | Playwright: `scrollHeight <= innerHeight` and `scrollWidth <= innerWidth` at 1920×1080, in projector mode |
| Body text ≥ ~20 px (number to tune) | the ossimulator text-size probe, with a 20 px threshold over the whole page |
| Clicker keys: → / PgDn step forward, ← / PgUp step back, one reset key (Home or R) | e2e presses each key and expects the step counter to change (or a declared exception) |
| Step back equals replay from the start | `stateAt(n)` from a pure step function (§10.3), compared after forward and back moves |
| Works offline as one file | open from `file://` with all requests blocked, as in ossimulator's e2e |
| Colour never the only carrier of meaning | grayscale screenshot, reviewed |
| Respects `prefers-reduced-motion` | `?motion=reduce` disables animation, as in ossimulator |
| Has a valid manifest entry | the manifest check (§10.6) |
| Exceptions are declared, not silent | a `<script type="application/json" id="simdeck-exceptions">` block (or a manifest field) naming each rule waived and why; the check counts them |

### 10.3 The step model (recommendation)

ossimulator's engine (snapshots before every operation, a history limit, a play loop) is more than a 3–5
minute demo needs. A smaller contract fits:

- A page defines `initial(seed)` and a pure `step(state, n)`.
  - The kit's controller computes `stateAt(n)` by replaying from the start. This is cheap for a short demo,
    and step back is correct by construction, with no snapshot history.
- The page declares `steps`, its number of steps. This makes "a demo runs in 3–5 minutes" visible: the index
  can show the count, and a page with 60 steps stands out.
- Keep from ossimulator:
  - all randomness through a seeded rng;
  - JSON-safe state;
  - total sort orders with id tie-breaks;
  - one test per rule, especially tie-breaks (the most common untested defect, §9).
- Logic stays in a DOM-free file next to the page, so it can be unit-tested. The page stays one file after
  the build.

### 10.4 Page classes: not every imported page is a stepper

Only 1 of the 23 `single-page-labs` pages handles arrow keys today. Many are parameter explorers
(`amdahl-simulator.html`), reference posters (`rf-spektar-eu-hr-bandplan.html`) or classroom tools
(`random-student-picker.html`). Forcing a step controller onto them would produce exceptions on most
imports and trip the proposal's "rethink if more than a quarter need exceptions" alarm for the wrong reason.

So the manifest gets a `class` field, and the contract has a common part plus a part per class:

| Class | Example | Contract on top of the common part |
|---|---|---|
| `stepper` | dedup, backing chains, WPA handshake | clicker keys, `steps`, `stateAt(n)`, reset |
| `explorer` | Amdahl, LVM topology lab | parameters through kit controls, one reset key, live update; no step keys required |
| `reference` | bandplan, protocol posters | no controls; must fit the screen and follow the palette and text-size rules |
| `tool` | student picker | listed in the index for the lecturer only, never on course pages |

Count exceptions within a class. The rethink signal is a rising exception count *within* a class, not the
fact that a reference page has no step keys.

### 10.5 Linked entries

> **Superseded (owner decision, 2026-10-01):** simdeck copies and adopts; it never links out. ossimulator's pages,
> cephsim, faultline and topologydrafter are copied into `sims/<id>/` like any import (§10.7), from their existing
> builds, so the login-realm question below no longer arises. Kept for the record. Current design:
> docs/site-structure.md §0.

Linked entries are exempt from the contract. The manifest still makes them consistent in the index:
- **ossimulator:**
  - one entry per page (`modules/<id>/index.html`), not one for the whole app;
  - an entry may name a public scenario (`?scenario=<id>`, only ids from ossimulator's `PUBLIC_SCENARIOS`), so
    a lecture can open a specific demo, already paused at step 0;
  - several entries may point to one page with different scenarios.
- **cephsim, faultline, topologydrafter:** one entry each, unless they grow deep links.
- **The check:**
  - the URL is relative to `materijali.online`, or absolute to a known host;
  - for ossimulator, the page id and scenario id exist (read `src/shared/deeplinks.ts`, or a small JSON
    export of it).
  - Reachability is checked at deploy time, not in the build.
- **Open: login realms.** `/ossim` uses its own realm (sim/os), while `/singles`, `/ceph` and `/faultline`
  share another one. A course page that mixes them asks students for two logins. Decide this before M4: one
  realm for everything students see, or a course-page note naming the logins.

### 10.6 The manifest is the registry

In ossimulator, `MODULE_IDS`, the `meta.ts` files and `PUBLIC_SCENARIOS` together held the registry. In
simdeck the manifest is that registry.

- **Fields:**
  - from the design notes: `id`, `title`, `summary`, `tags`, `courses`, `kind`, `url` | `path`, `lang`;
  - added here: `class`, `steps` (steppers only), `scenario` (linked ossimulator entries only).
  - *As built (docs/site-structure.md §2):* one `sim.json` per `sims/<id>/`, with `id`, `class`, `status`, `title`,
    `concept`, `summary`, `topic`, `tags`, `level`, `lang`, `steps`, `aliases`, `related`, `origin`,
    `asset_review`. `kind`, `url`, `path` and `scenario` are gone (§10.5), and `courses` is derived from the
    course files. Exceptions stay in the page (`#simdeck-exceptions`, the kit's block).
- **The manifest check:**
  - unique kebab-case ids;
  - the required fields for each `kind` and `class`;
  - every native file has exactly one entry, and every entry's `path` exists, like the `PROJECTS.md` hook;
  - tags come from a controlled `tags.json`, which stops "backup"/"backups"/"sigurnosne kopije" drift;
  - every course file lists only existing ids, and no `tool`.
- **Course pages** are generated from the course file and the manifest, never edited by hand.

### 10.7 Importing `single-page-labs`

One page per commit, the same steps each time:
1. **Pick the canonical version** where there are variants (`lvm-topology-lab` vs `-v2`,
   `ham-radio-modes-reference` vs `-v2`). Record the choice in the commit message.
2. **Classify the page** (§10.4) and write its manifest entry.
3. **Adapt it to the kit:** tokens, header and legend, the controller for its class. Then run the check.
4. **Record exceptions** in the page's exception block, never as silent workarounds.
5. **Freeze the original:** add a note in `single-page-labs` pointing to the simdeck copy (proposal: the
   copy is canonical).
6. **Check assets** for the GPL audit (generated images, textbook-derived figures), and mark anything
   unclear in the manifest (`asset_review: true`).

The import is mechanical and parallelises well: up to four agents, each taking a disjoint list of files,
one worktree each. The kit and the check must be frozen first.

### 10.8 Process, scaled to simdeck

- **M1 is wave 0 plus wave 1.** Build the kit, the contract check and the template. Then build **one new
  first-batch simulator** (dedup is a good candidate: it is a stepper with a clear rule set) while the kit
  can still change. Then freeze it as `kit-v1`. After that, the kit and contract change additively only,
  with a changelog row, and every page agent builds on it.
- **Per-page DoD** (a short version of ossimulator's):
  - the contract check passes;
  - screenshots at 1920×1080 in the projector palette, plus grayscale;
  - the manifest entry is valid;
  - unit tests for the step rules (steppers and explorers with logic);
  - one fresh-reviewer pass for **new** simulators (content correctness, mutation probes on the rules);
    imports need only the check and a screenshot review.
- **Ownership:** a page agent edits only its own page files and the logic file next to them. The kit, the
  check, the manifest schema, `tags.json` and the build belong to the coordinator. Page agents propose
  manifest entries in their report, and the coordinator adds them, as with `PUBLIC_SCENARIOS`.
- **Measure the proposal's riskiest assumption.** Log idea-to-deployed time for each first-batch simulator
  in its commit or NOTES. That is the M3 criterion ("one working session each").

### 10.9 Open decisions this section depends on

| Decision (design notes) | Recommendation | Why |
|---|---|---|
| Build tool: plain script or Vite | **Vite + vite-plugin-singlefile + Vitest**, reusing ossimulator's `build-single.mjs`, `check-dist.mjs` and the e2e helpers | the single-file build, the offline check and the text-size probe already exist and are tested; a plain script would rebuild them. *Decided otherwise:* a plain Node build with no dependencies (docs/site-structure.md §5). Sims are HTML with classic scripts (the kit is one), so nothing needs bundling; node:test replaces Vitest, and the kit's `check-page.mjs` (Playwright) does the browser checks. |
| UI language | ossimulator's rule: Croatian UI, English term in italics with the Croatian in parentheses at first mention; `lang` in the manifest for pages in English | 13 of the 24 imported pages declare `lang="hr"` and 10 `lang="en"`, so both must be first-class; students meet the English terms in the literature *Decided (owner, 2026-10-01):* both languages on every page, switched at runtime, from string tables the contract check verifies (docs/tasks/w0/bilingual.md). |
| Deploy location and realm | `materijali.online/simdeck`, with `scripts/deploy.sh` modelled on ossimulator's (rsync with `--chown`/`--chmod`, then a 401/200 check) | the same VPS pattern as `/ossim` and `/ceph`; the realm question is in §10.5 |
| Minimum text size | start at 20 px for body text and 16 px for legends, then tune after one lecture | the design notes give "~20 px"; legends need a separate, lower floor or every legend becomes an exception |
| GPL version | GPL-3.0-or-later, as assumed | no reason found to change it; the asset audit is §10.7 step 6. *Decided otherwise (owner, 2026-10-01):* AGPL-3.0-or-later. |

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
