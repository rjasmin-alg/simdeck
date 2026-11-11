<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# faultline: notes

Adopted from `~/projects/faultline` at `268db27` (task `docs/tasks/w1/faultline.md`, catalogue `app-faultline`).
The first commit on the branch is the plain copy of `index.html`, `css/`, `js/` and `tests/`, so `git diff` from it
shows every simdeck change. The simdeck copy is canonical from here on. faultline is a spike (phase 0b of 7): pick a
scenario, break things, read the answer; there is no editor yet. The roadmap is below, from the original `TODO.md`.

## Layout

| File | |
|---|---|
| `js/*.js`, `js/engine/*.js` | the app's ES modules, the source (`js/i18n.js` is new) |
| `bundle.mjs` | the one-off bundler: `js/` → `app.js` (no dependencies) |
| `app.js` | **generated**, one classic script; the page loads it after `strings.js` |
| `strings.js` | every visible string, `{ hr, en }` |
| `css/style.css` | the app's own chrome (simdeck additions at the end) |
| `tests/` | the app's own 47 checks: `node tests/run.mjs` (node), `tests/checks.html` (over http) |
| `sim.test.js` | simdeck's tests; runs the app's checks too, and the page in Chromium |

## Import

**Bundling (task step 2).** The build inlines only classic scripts and import-free modules
(`docs/site-structure.md` §5). After any change in `js/`:

```sh
node sims/faultline/bundle.mjs           # writes app.js
node sims/faultline/bundle.mjs --check   # exit 1 when app.js is stale
```

Copied from cephsim's bundler (which adapted topologydrafter's). Each module becomes a function scope keyed by its
path under `js/` (`engine/cutset`); its `import { a, b as c } from './x.js'` reads from the modules bundled before it,
and it returns its exports. It refuses forms it does not handle (default exports, `import *`, re-exports, bare
specifiers) and import cycles. The entry (`main`) is skipped when `globalThis.FAULTLINE_NO_BOOT` is set, so
`sim.test.js` can load the bundle in a vm. A test checks that `app.js` equals what `bundle.mjs` makes of `js/`, so a
hand edit or a forgotten rebuild fails `npm test`. No new dependency.

The original's house rule "no build step, ever" (its `CLAUDE.md`) holds for the source: `js/` still runs unbundled
over http (`tests/checks.html`), and `app.js` exists only because the simdeck build inlines classic scripts.

**Markers (task step 3):** `data-sim`, the `#simdeck-meta` placeholder (`metaFor(sim.json)`), `#simdeck-exceptions`,
and the kit header's back link (`.sd-back`, `../../index.html`) at the left of the toolbar. Without the kit the back
link is a plain link.

**Deep links (task step 4):** `?sample=threeZone|onePdu|sizeTwo|usEast1|frontDoor` (the app's own keys; `load(key)`
existed), plus `?lang=hr|en`, `?theme=light|dark` and `?motion=reduce`. `sim.json` `entries` lists the five samples
with `query: "sample=<key>"`; preset ids are kebab-case as the manifest requires (`three-zone`, `one-pdu`,
`size-two`, `us-east-1`, `front-door`), so a course file names `faultline#one-pdu`. The `SAMPLES` keys in
`js/samples.js` are quoted so the manifest check finds each query's key.

## Decisions

- **Class `explorer`.** No fixed sequence of steps: pick a scenario, break events or whole cuts, change the search
  size, hide the authorities. Not `tool`, which never goes on course pages.
- **Croatian (task step 5)** in the same page, chosen as the kit chooses (`?lang=`, else `localStorage`
  `simdeck.lang`, else `<html lang>`, which is `hr`). The **EN / HR** button stores the choice and reloads with
  `?lang=` and the current `?sample=` (the page keeps no other state worth carrying).
- **The engine is untouched** (`js/engine/`, its "pure, no imports from js/" rule enforced by the app's wiring check).
  It still names a lost domain "<name> lost" and the six authorities in English; the view rebuilds those two from the
  event id (`evName` in `main.js`; `compName`/`domName` in `render.js`). The English table repeats the engine's
  authority names and questions word for word (a test holds that), so the English page reads as the original.
- **Samples are built in the page's language** (`t()` in `js/samples.js`): same ids, gates and hits, so the same
  analysis in both languages (a test compares them). Names that are data stay as written: `us-east-1`, `use1-az1`,
  `osd-1`, `etcd-1`, `payments-api`, `checkout`, `IAM / STS`, `Entra ID`, `Front Door`, `West Europe`, and
  Ceph's `size=2, min_size=2` (Ceph is NLA T26).
- **Cut order across languages.** The engine's last tie-break among equal cuts is the event name, which differs
  between languages, so two equal cuts may swap places between hr and en. The set of cuts, the counts and the
  headline are the same (tested).
- **Vendor names in two samples** (COMMON.md §1, "concepts, not tools"). `usEast1` and `frontDoor` are the 2025 AWS
  and Azure outages, and the task names both. Their lesson (a control plane or edge homed in one place defeats
  geographic redundancy) is general, but the app's own doctrine (`PEDAGOGY.md` §6) is that scenarios are real and
  dated, and a real, dated outage cannot be told without its provider. So the names stay, in both languages, in the
  sample labels, component names and event notes. **Owner to decide** whether to keep them or make these two samples
  generic ("cloud provider A, region 1"); see the report. `etcd-1..3` in `threeZone` are component names (the
  Kubernetes control-plane store; Kubernetes is NLA T19).
- **Theme:** new. `?theme=` wins, else the OS setting, followed live; the canvas takes the original's own dark
  palette (`THEMES.dark` in `render.js`, which the original defined but never used). The chrome's few literal colours
  are now tokens on `:root`, redefined for dark.
- **Colour is not the only sign of "down":** a component that is down gets a ✕ before its name (the original only
  recoloured it). Cut sizes already carry a number, roles a word, authorities a dashed outline and "not drawn".
- **Phone (375 px):** one column: toolbar (wraps), canvas, the answer, the events, the status bar. No sideways scroll.

## Exceptions (`#simdeck-exceptions`)

`kit` (own runtime) and `text-size` (the app's 14 px body, 9–12.5 px rail labels and badges, and canvas labels in an
SVG that scales to the pane). The task asked for `one-screen` too; the gate found it unused (the page fits 1920×1080,
and the rails scroll inside), so it is not declared (COMMON.md §12). `theme`, `phone` and `motion` pass.

## Deviations from the task

- `one-screen` not declared (above).
- Preset ids are kebab-case; the query keeps the task's `?sample=threeZone` and so on.
- Changes beyond the markers and `?sample=`: the language layer, the theme, the ✕ marker and the phone layout above;
  three edits to the app's own checks: `tests/run.mjs` and `tests/checks.html` load `strings.js` first, and
  `tests/wiring-checks.mjs` lets `index.html` link `../../index.html` (the back link, outside this folder). The
  checks still number 47 and all pass.
- `TODO.md`, `README.md`, `CLAUDE.md`, `REVIEW.md`, `PEDAGOGY.md`, `serve.sh` and `scripts/` were not copied (the task
  copies `index.html`, `css/` and `js/`; `tests/` came along so the checks run). The roadmap is below; the rest stays
  in the original repo.

## Sources

- The original app (`README.md`, `CLAUDE.md`, `TODO.md`, `js/`, `tests/`).
- Croatian: *domena kvara* (failure domain) and *ormar* (rack) as in `sims/cephsim`; *domaćin* (host) from
  `kit/glossary.js` (UL); *grozd* (cluster) as cephsim (NLA book, T26).
- Not from the books, my choice *(check)*: rezni skup / minimalni rezni skup (cut set; the reliability literature
  also says *skup presjeka*), jedinstvena točka kvara (single point of failure), korelirani događaj / kvar
  (correlated event / failure), autoritet (authority), upravljačka ravnina (control plane), zalihost (redundancy, in
  the aliases), razdjelnica napajanja (power strip, PDU), globalni rub (global edge), pogođeno (hit, the blast radius
  count), the six authorities (Članstvo, Identitet, Imenovanje, Promjena, Vrijeme, Operater).

## Term pairs (not in kit/glossary.js; the page uses no `[[terms]]`, it has no kit)

| en | hr |
|---|---|
| cut set | rezni skup |
| minimal cut set | minimalni rezni skup |
| single point of failure | jedinstvena točka kvara |
| failure domain | domena kvara |
| correlated failure | korelirani kvar |
| blast radius | doseg kvara |
| control plane | upravljačka ravnina |
| redundancy | zalihost |
| quorum | kvorum |

The italic-English-at-first-mention term rule is not applied: the strings are labels, short hints and status lines.

## Shared requests

None.

## Checks not done here *(check)*

- Hovering a cut (it lights what the cut reaches) is not exercised in the browser test; clicking a cut and toggling
  events are.
- `tests/checks.html` (the in-browser run of the app's checks) needs http (ES modules) and was not opened here; the
  same checks pass in node.
- Long names: "AUTHORITY · NOT DRAWN" (and the Croatian "AUTORITET · NENACRTAN") and "Route 53 control plane" reach the
  right edge of their 138 px boxes, as in the original. A real projector *(check)*; the canvas text is small
  (declared `text-size`; the original's `REVIEW.md` finding 6, the canvas scales to width only).
- `threeZone` lists 17 drawn cuts, so the reveal sits low in the right rail at 1920×1080 (the original's `REVIEW.md`
  finding 7, planned for its phase 4).
- Freezing the original (`~/projects/faultline`, `materijali.online/faultline/`) is outside simdeck.

## Roadmap (from the original `TODO.md`, at 268db27)

Phases 0 and 0b are done. Each phase ends with checks passing and a commit.

Two items arrived after the review and have been placed, which reordered the middle of the plan: a
**dependency-graph view** and **editing** of both the diagram and the dependencies.

The reordering rests on one observation. The dependency DAG is what the whole analysis runs over —
every cut set comes from `deps` and gates — and **it is currently not drawn at all**; the canvas
shows only the containment tree. So the tool computes over a structure the user cannot see, which
also means dependency *editing* would be editing something invisible. Hence: **view before
editing**, and dependency editing before diagram editing, because it needs less machinery and it is
the half that changes the answer.

Old phase 1 (engine leftovers) is dissolved into its natural homes: `explain()` goes with the view,
richer gate authoring goes with dependency editing, `probe.js` goes with the reveal.

- [x] **0 — Spike.** `engine/{domain,graph,events,cutset,authorities}.js`, `compile.js`,
      `samples.js`, `render.js`, `main.js`, `index.html`, `css/style.css`, and the three check
      groups. No editor: pick a scenario, break things, read the answer. 44 checks.
- [x] **0b — The review items.** Findings 1, 2 and 3 from `REVIEW.md`, plus the deploy that was
      meant to be phase 7. 47 checks.
      - Finding 1: `cuts.sort` now puts drawn before not-drawn *before* radius is consulted, so the
        punchline no longer arrives behind six authorities. The UI already painted two panels, so
        that half of the "better" fix was shipped in phase 0 by accident; the flat list is what
        disagreed with it. Two new checks hold the group order and the within-group radius order.
      - Finding 2: `smallest`/`smallestDrawn` are descriptors now, not counts — `{size, blastRadius,
        scope, drawn, names}` — and the footer says the scope out loud ("smallest drawn failure: one
        region · 7 hit"). A check asserts the descriptor separates two samples the bare count
        conflates.
      - Finding 3: **xvfb installed and the page booted.** The old diagnosis was one layer off; the
        recipe and the trap are in `CLAUDE.md`, the tool is `scripts/shot.sh`. In-browser checks
        agree with node. The first render produced two findings of its own — see findings 6 and 7.
- [ ] **1 — The dependency view, in two modes.** The DAG becomes visible. Pure render work, so it is
      fully checkable headlessly today, and it is the prerequisite for editing it.
      - `js/layout-dag.js` — pure layering: longest-path layers, then a barycentre sweep or two to
        cut crossings. **Cycles are drawn, not hidden.** The model permits them and `graph.js`
        resolves them to down on purpose (CLAUDE.md: *do not "fix" it*), so DFS marks back edges and
        the view paints them distinctly. A cycle is a finding to show, not a layout problem to route
        around.
      - `js/render-deps.js` — string emitters only, same discipline as `render.js`. `paintEdges(doc,
        boxes)` for the overlay, `paintDag(doc)` for the layered view.
      - **Overlay is the default** — edges on the existing domain layout, because an edge *leaving
        its domain* is the correlated-failure lesson and only this view can show it.
        Boundary-crossing edges get their own class.
      - **Layered view is the toggle**, and it uses **fault-tree notation**: AND flat-bottom, OR
        curved, voting gate with `k/n` inscribed, one glyph per `dep.group`. Minimal cut sets over a
        gated dependency graph *are* fault tree analysis, so the standard glyphs cost nothing, make
        `quorum` legible in a way a label never will, and hand the student a term with a literature
        behind it.
      - `explain()` wired as the ordered blast-radius walk rather than a flat list. It is a view of
        the dependency graph, which is why it moved here.
      - **Fixes `REVIEW.md` finding 6** (canvas scales to width only, so `threeZone` uses ~16% of
        the pane height at ~65% scale). The layered view is unreadable without a real fit, and phase
        3's pan/zoom needs a correct initial fit to zoom *from*.
      - Checks, all pure-string: every dep yields an edge; no coordinate is `NaN`; every node gets
        exactly one layer; back edges are identified and classed differently; one gate glyph per
        group; boundary-crossing classification is correct; text escaped; no editor-only CSS in
        either view's export; layered nodes do not overlap. Plus a browser smoke shot per mode,
        which is now possible.
- [ ] **2 — Model, dependency editing, and the counterfactual.** **Do `REVIEW.md` finding 8 first**
      — the house rule *"the tick loop must never run the cut-set search, keyed by
      `structuralSignature`"* is documented but not implemented: `compile()` is memoised,
      `analyse()` is not, and `main.js` calls `invalidate()` on every render. Harmless at 1.25 ms,
      load-bearing the moment editing recomputes on every gesture. Memoise `analyse` by signature +
      `maxCutSize`, drop the blanket `invalidate()`, and **bring the phase-5 wiring guard forward**
      — a check that no animation path reaches `cutSets` is cheaper to add to an empty rule than to
      a violated one.
      - `js/model.js` — the document, snapshot undo/redo, autosave. PEDAGOGY §4.2: reset costs one
        key, so `Repair all` stays and gains a sibling that reverts *edits* rather than failures.
      - Dependency editing: drag from a source to a target to create an edge, select, retarget,
        delete. `js/inspector.js` authors `gate`, `n` and `group` — this is where "richer gate
        authoring" landed.
      - **The counterfactual, built in rather than deferred.** PEDAGOGY §4.3 says comparison *is*
        the lesson and must sit beside the current answer, not replace it. The undo snapshot already
        holds the previous document, so the previous analysis is nearly free: the footer reads `was:
        one region · 7 hit → now: two zones · 4 hit`, with a direction marker, built from
        `describeCut`. Every edit becomes the before/after the teaching argument asks for.
      - The entry point stays a **running cluster, never a blank canvas** (PEDAGOGY §4.1). Editing
        is layered onto a loaded scenario; the editor is advanced mode, not the front door.
      - Checks: undo/redo round-trips a document; the autosave *serialiser* round-trips (test the
        serialiser, not `localStorage`, to stay DOM-free); a dependency edit changes the signature
        and a position change does not; a gate edit changes the cut list; the counterfactual reads a
        snapshot instead of recomputing twice.
- [ ] **3 — Diagram editing.** `interact.js` (drag, marquee, pan/zoom on phase 1's fit),
      `palette.js`, `catalog.js`. Create, move and delete domains and components. **Fault-domain
      membership is set by the drop and never inferred from coordinates** — this is the
      `topologydrafter` trap named in CLAUDE.md, and it is the one rule in this phase that a check
      has to enforce rather than a comment: no code path may derive `component.domain` from a centre
      point.
- [ ] **4 — The reveal, properly.** `panel-cutset.js`, blast-radius propagation *in order* rather
      than all at once, the authorities panel with its questions and the outage behind each.
      `probe.js` lands here — a probe is what makes "is it serving" say something richer than a
      boolean. **Fixes `REVIEW.md` finding 7**: `threeZone` lists 17 drawn cuts before the reveal,
      putting the first authority below the fold on a lecture laptop. The fix is *not* hiding cuts —
      they are the correct answer — but grouping the repetitive ones (`any 2 of {etcd-1, etcd-2,
      etcd-3}`), which collapses 17 rows to about 5 and reads better besides. `spread()` already
      computes the domain-level facts such a grouping keys on.
- [ ] **5 — Partition + quorum lab.** `partition.js` (union-find lifted from cephsim's `net.js`,
      including the `'unmodelled'` sentinel), `quorum.js`. The repetition drill: kill 1 of 3, 2 of
      3, partition 2/1, add a fourth and find it made things worse, add a fifth. **Cut sets do not
      make this redundant** — they are analytical, the drill is experiential, and only the second
      builds the intuition to *predict* the answer. `PEDAGOGY.md` §2.
- [ ] **6 — Coherence.** `replication.js`, `oplog.js`, `latency.js`, `sim.js`, `render-timeline.js`.
      Six strategies; write on both sides of a partition, heal, see which write silently vanished.
      The tick loop must never run the cut-set search.
- [ ] **7 — Profiles.** *Check the search ceiling before authoring the inventory:* cut-set search is
      `C(n, maxSize)` with a graph evaluation per candidate, and a few hundred events puts `C(300,3)
      ≈ 4.5M` against a `budget` of 2M. Today's samples run 9–80 combinations in under 10 ms, so
      there is room — but multi-region is where it binds. `REVIEW.md` finding 4. `generic`,
      `onprem`, `aws`, `azure`, `ceph`. Curated dated inventory: real AZ counts including the 2-AZ
      regions, Azure regions with no zones at all, AZ-ID vs AZ-name scoping, FD/UD, and which
      control planes are single-homed where.
- [ ] **8 — Ship.** Presentation mode (`step` field per item), SVG/PNG export. *`scripts/deploy.sh`,
      the deploy and the repo all moved up to 0b* — the site is live at `materijali.online/faultline`
      behind the same basic auth as `/urm`, `/topologija` and `/ceph`, so what is published is the
      spike, and every later phase redeploys over it.

## Time

Start 2026-10-03 00:25, done 00:40 (about 15 minutes, one session).
