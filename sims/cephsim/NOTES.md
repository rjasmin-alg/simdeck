<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cephsim: notes

Adopted from `~/projects/cephsim` at `4874f81` (2026-09-08; task `docs/tasks/w1/cephsim.md`, catalogue `app-cephsim`).
The first commit on the branch is the plain copy of `index.html`, `css/`, `js/` and `tests/`, so `git diff` from it
shows every simdeck change. The simdeck copy is canonical from here on.

## Layout

| File | |
|---|---|
| `js/*.js`, `js/engine/*.js` | the app's ES modules, the source (`js/i18n.js` and `js/engine-text.js` are new) |
| `bundle.mjs` | the one-off bundler: `js/` → `app.js` (no dependencies) |
| `app.js` | **generated**, one classic script; the page loads it after `strings.js` |
| `strings.js` | every visible string, `{ hr, en }` |
| `css/style.css` | the app's own chrome (simdeck additions at the end) |
| `tests/` | the app's own 148 checks: `node tests/run.mjs` (node), `tests/checks.html` (over http) |
| `sim.test.js` | simdeck's tests; runs the app's checks too, and the page in Chromium |

## Import

**Bundling (task step 2).** The build inlines only classic scripts and import-free modules
(`docs/site-structure.md` §5). After any change in `js/`:

```sh
node sims/cephsim/bundle.mjs           # writes app.js
node sims/cephsim/bundle.mjs --check   # exit 1 when app.js is stale
```

Adapted from topologydrafter's bundler. Each module becomes a function scope keyed by its path under `js/`
(`engine/crush`); its `import { a, b as c } from './x.js'` (or `'../x.js'`) reads from the modules bundled before it,
and it returns its exports. The three lazy `import('./x.js')` calls in the app become `Promise.resolve(<module>)`,
which is safe because they run only after boot. It refuses forms it does not handle (default exports, `import *`,
re-exports, bare specifiers) and import cycles. The entry (`main`) is skipped when `globalThis.CEPHSIM_NO_BOOT` is set,
so `sim.test.js` can load the bundle in a vm. A test checks that `app.js` equals what `bundle.mjs` makes of `js/`, so a
hand edit or a forgotten rebuild fails `npm test`. No new dependency.

**Markers (task step 3):** `data-sim`, the `#simdeck-meta` placeholder (`metaFor(sim.json)`), `#simdeck-exceptions`,
and the kit header's back link (`.sd-back`, `../../index.html`) at the left of the toolbar. Without the kit the back
link is a plain link (no history-back).

**Deep links (task step 4):** `?sample=hyperconverged|threeRacks|brokenRule|unbalanced` (the app's own sample keys,
as the task names them), plus `?lang=hr|en`, `?tab=physical|crush|osdmap|pools|console`, `?present=1`,
`?theme=light|dark` and `?motion=reduce`. `sim.json` `entries` lists the four samples with `query: "sample=<key>"`;
the preset ids are kebab-case as the manifest requires (`three-racks`, `broken-rule`), so a course file names
`cephsim#broken-rule`. The `SAMPLES` keys in `js/samples.js` are quoted so the manifest check finds each query's key.

## Decisions

- **Class `explorer`.** It is a planning and failure-injection tool with four samples, no fixed sequence of steps, and
  the courses (NLA, DR) open a sample and break things live. Not `tool`, which never goes on course pages.
- **Croatian (task step 5)** in the same page, chosen as the kit chooses (`?lang=`, else `localStorage`
  `simdeck.lang`, else `<html lang>`, which is `hr`). The **EN / HR** button stores the choice and reloads with
  `?lang=`. A sample nobody has edited comes back as the same sample in the other language; anything else comes back
  from the autosave as it is (the user's own names are not translated).
- **What stays as Ceph writes it.** Ceph is a course topic (NLA T26), and what a student reads on a real cluster
  is part of the lesson. So these are not translated: the Console tab (`ceph -s`, `ceph health detail` and the rest),
  health check names and their one-line summaries (`OSD_DOWN: 36 osds down`), PG state names (`active+clean`,
  `degraded`, `backfilling`), daemon codes (MON, MGR, MDS, RGW), CRUSH keywords (`host`, `rack`, `firstn`, `indep`,
  `take`), settings (`pg_num`, `min_size`, `max_mds`, reweight) and the generated `ceph` command script and `crushtool`
  text. They are marked `translate="no"` where they sit in a block of their own.
- **What the engine explains** (health detail lines, why a client is down) is translated without touching the engine:
  `js/engine-text.js` matches each English line against the `eng.*` templates of the English table and rewrites it
  with the Croatian ones, a nested `{why}` in turn. The engine and its 148 checks keep their English wording. A test
  drives the engine through 17 failures (split quorum, a rack down, full OSDs, a cut cluster network, …) and requires
  every line it produces to match a template and come out with no English left; all `eng.*` templates but one are
  reached (`eng.poolNotEvaluated`, which the engine says only for a pool it was never asked to evaluate).
- **Catalog and sample labels** are getters on `strings.js` (`cat.*`, `s.*`), so every module that reads `.label`
  follows the language unchanged.
- **Theme:** the original always started dark. Now `?theme=` wins, then a choice made with the Theme button (stored as
  `themeChosen` in the app's prefs), then the OS setting. The projector default is the light theme.
- **Concepts, not tools** (COMMON.md §1): Ceph is the topic, so Ceph's names stay (RBD, CephFS, RGW, `ceph`,
  `crushtool`; the exported script's comment names cephadm and ceph-volume, Ceph's own deployment tools). No other
  product is named.
- **Number keys** 1–5 switch tabs (the original allowed 6 for five tabs).

## Fixed in the copy (it had never been opened in a browser)

Each is marked `simdeck copy` in the code. `sim.test.js` checks the first four in Chromium.

1. **Tabs never switched panes.** `setTab` set `.hidden` on three `<svg>` panes, which have no such property, so the
   CRUSH tree and the OSD map never showed and the physical canvas stayed on every tab. Now `toggleAttribute`; and
   `#canvas[hidden]` is hidden in CSS (its `display: block` beat `[hidden]`).
2. **The CRUSH tree and OSD map were black** in both themes: `applyTheme` set the theme variables on the physical
   canvas only, so `fill: var(--paper)` was invalid on the other two. Now every `svg.pane` gets them.
3. **The inspector showed health one edit late** (HEALTH_OK beside a HEALTH_ERR status bar): it repainted on `change`,
   before the derivation that `change` schedules. Now it repaints after derivation too.
4. **The Samples picker was empty**: nothing filled it. Now boot fills it from `SAMPLES`.
5. **The active tab was unreadable in the light theme** (`button.active` gave it white text).
6. **The toolbar wrapped** to two rows at 1920 px: a `<select>` is as wide as its longest option. Both pickers are
   9.5em now.
7. **Stale hints:** "the pool editor arrives in phase 3" and "partition and quorum modelling lands in phase 4" were
   left from the build; both are rewritten for what the app does now.
8. **Added:** a phone layout (one column, no palette; the gate's 375×812 check), no transition under
   `?motion=reduce` or the OS setting, and the URL settings above.

## Exceptions (`#simdeck-exceptions`)

`kit` (own runtime) and `text-size` (the editor's 13 px body, 10–12 px rail labels, 7.5–12.5 px canvas labels that
scale with zoom; presentation mode, P, hides the chrome). The task asked for `one-screen` too; the gate found it unused
(the editor fills the window, the rails and panes scroll inside), so it is dropped (COMMON.md §12). `theme` and `phone`
are not needed: the theme now follows the OS, and the phone layout does not scroll sideways.

## Deviations from the task

- `one-screen` not declared (above).
- Preset ids are kebab-case (`three-racks`, `broken-rule`); the query keeps the task's `?sample=threeRacks`.
- Changes beyond the markers and `?sample=`: the fixes above, and three edits to the app's own checks
  (`tests/wiring-checks.mjs` reads the source, which now says `t('…')`, `loadSample(…)` and `get label()`;
  `tests/run.mjs` and `tests/checks.html` load `strings.js` first). The checks still number 148 and all pass.

## Sources

- The original app (`README.md`, `TODO.md`, `js/`, `tests/`).
- Croatian: *grozd* for cluster follows the NLA book's table of contents (`~/projects/napredna-linux-administracija`,
  T26) and the UL book's note that *grozd* is the server-cluster term; *domaćin* (host), *blokovni uređaj* (block
  device) from `kit/glossary.js` (UL); *preklopnik*, *usmjernik* as in the URM book.
- Not from the books, my choice *(check)*: bazen (pool), grupa smještaja (placement group, used only in aliases; the
  page says PG), domena kvara, kodiranje brisanjem (erasure coding), kvorum, oporavak, popunjavanje (backfill, with
  the Ceph word kept), ulomak (shard), tanko / debelo dodjeljivanje (thin / thick provisioning), objektni pristupnik
  (object gateway), poslužitelj metapodataka (metadata server), upravitelj (manager), uravnoteživač (balancer),
  ormar (rack), okosnica (spine), skupina ormara (pod), kanta (CRUSH bucket), spremnik (RGW bucket), sirovi kapacitet
  (raw capacity), uparivanje (peering).

## Term pairs (not in kit/glossary.js; the page uses no `[[terms]]`, it has no kit)

| en | hr |
|---|---|
| cluster (server) | grozd |
| pool (Ceph) | bazen |
| placement group | grupa smještaja |
| failure domain | domena kvara |
| erasure coding | kodiranje brisanjem |
| quorum | kvorum |
| recovery | oporavak |
| backfill | popunjavanje (backfill) |
| shard | ulomak |
| thin provisioning | tanko dodjeljivanje |
| object gateway | objektni pristupnik |
| metadata server | poslužitelj metapodataka |
| CRUSH bucket | kanta |
| rack | ormar |

The italic-English-at-first-mention term rule is not applied: the strings are labels, short hints and status lines.

## Shared requests

None.

## Checks not done here *(check)*

- Pointer gestures on the physical canvas (drag, marquee, drawing a cable, dragging a host onto a bucket in the CRUSH
  tree) were not exercised; the tests drive the model directly. The app's own wiring checks cover the handlers.
- Export (SVG, PNG, clipboard), Save / Open and the CRUSH-map import sheet were not exercised in a browser here.
- Parse errors from the CRUSH-map import (`js/crushtext.js`) and the internal "could not evaluate" message stay in
  English: they quote the pasted text and the engine.
- Presentation mode (P) only enlarges the tabs, the status bar and the console; the rails are hidden. Body text in the
  editor is 13 px (declared). A real projector *(check)*.
- Phone (375×812): no sideways scroll; the canvas, the inspector and the timeline stack. Editing needs a mouse.
- Freezing the original (`~/projects/cephsim`, `materijali.online/ceph/`) is outside simdeck.

## Time

Start 2026-10-02 05:38, done 06:05 (about 27 minutes, one session).
