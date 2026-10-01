# simdeck: sim UI, control kit and template

How every native simdeck simulator looks and behaves, the API of the shared kit, and how to start a new sim from
the template. Kit version **0.2.0** (0.2.0 adds the languages, §9), not frozen: it becomes `kit-v1` after the first real sim (playbook §10.8).

```
kit/
  kit.css          tokens, layout, controls (one file, ~17 KB)
  kit.js           step controller, controls, transport, header tools, shortcuts, languages (one classic script, ~47 KB)
  glossary.js      the shared term list, English term and Croatian term (§9.4; ~40 KB, seeded by tools/glossary/seed.py)
  fonts/           Atkinson Hyperlegible 400/700, latin + latin-ext woff2 (53 KB), SIL OFL 1.1
  template/        the proto-simulator: index.html, strings.js (hr and en), sim.js (model), sim.test.js
  new-sim.sh       copies the template into a new sim folder
  kit.test.js      tests for the kit's pure core and stylesheet rules
  tools/contrast.mjs    palette contrast report (normal and washed-out projector)
  tools/check-page.mjs  browser check of one page from file:// (fit, text size, words, keys, languages, screenshots)
```

Run the checks:

```sh
npm install                                    # once: Playwright, the only dev dependency
npm test                                       # kit + template model, incl. contrast and undefined tokens
npm run check:template -- --shots /tmp/shots   # browser check of the template
npm run check:page -- sims/<id>/index.html     # browser check of any page
npm run gate -- <id>                           # the whole contract on one sim (docs/tasks/COMMON.md §7)
```

If the browser is missing, run `npx playwright install chromium` once. simdeck depends on no other project.

No framework and no build step are needed to work on a sim: `kit.js` is a classic script (not an ES module), so a
page opens straight from `file://` and runs. The build that inlines the kit into one self-contained file per sim
(`npm run build`, docs/site-structure.md §5) works on the same page unchanged.

---

## 1. Page layout

One screen, three rows, no page scroll at projector sizes:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Popis]  Title                           legend: ■ a  ▢ b  ▣ changed  [EN][▯][⛶][?] │  header
│            one-line subtitle                                                              │
├───────────────────────────────────────────────────────────────┬──────────────────────────┤
│                                                               │ PRIMJERI (presets) 1…9   │
│                         STAGE                                 │ POSTAVKE (params)        │
│         (the model; fills all space left over)                │   sliders, toggles,      │  main
│                                                               │   choices, buttons, R    │
│                                                               │ ▸ IDEJA (explanation)    │
├───────────────────────────────────────────────────────────────┤                          │
│ ▌ Caption: what this step did, in one or two lines            │                          │
├───────────────────────────────────────────────────────────────┴──────────────────────────┤
│ [⏮ Home] [◀ ←] [▶ Pokreni Space] [▶| →] [⏭ End]   Korak 3/16 ━━●━━━━━━   Brzina ½× 1× 2× 4× │  transport
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Stage** (`.sd-stage`, `data-sd-stage`): the model, as large as possible. It is a CSS size container, so a sim
  sizes its drawing with `cqw`/`cqh` and fills whatever is left at any resolution.
- **Caption** (`.sd-caption`, `aria-live="polite"`): what the last step did, in words. It is the narration a
  student reads after the lecturer has moved on, and what a screen reader announces.
- **Panel** (`.sd-panel`): presets first (the lecturer's quickest way to a known state), then parameters, then
  the explanation, collapsed by default. `C` hides the panel so the stage gets the full width.
- **Transport** (`.sd-bar`): step controls, a scrubber that doubles as the progress bar, and speed. An *explorer*
  (no steps) gets only the reset button.
- **Header**: back to the index, title and subtitle, legend, tools (language, panel, full screen, help).

The fixed order and the `data-sd-*` hooks are what the contract check can test, as ossimulator tested its section
ids (playbook §4.5).

## 2. Visual design

### Palette

Light is the projector theme: near-black ink on warm white, dark saturated series colours, 2 px lines. A projector
lifts blacks and washes out pastels, so nothing important is light grey or pastel. Dark is for screens and dim
rooms; it uses the same token names.

| Token | Use |
|---|---|
| `--bg`, `--panel`, `--ink`, `--muted`, `--line` | surfaces, text, borders |
| `--accent`, `--on-accent`, `--focus` | **UI only**: primary button, selected states, values, focus ring |
| `--c1` … `--c8` with `--on-series` | **things in the model**: categories, actors, series. Labels on a fill use `--on-series` |
| `--hl`, `--on-hl` | "changed in this step" (yellow highlighter); text on it is always dark |
| `--ok`, `--warn`, `--danger` | outcome colours |

Every pair is checked by `kit/tools/contrast.mjs` (and in `node --test`): text ≥ 4.5:1, body text ≥ 7:1, lines and
focus ≥ 3:1, each also reported after a simulated 25 % washout. All pairs pass in both themes; the weakest are
`--c2`/`--c6` on white at 4.96/5.13 (3.7 washed).

Rules:
- Use only kit tokens for colour in page CSS. `kit.test.js` fails on any `var(--x)` that is not defined; the
  contract check should run the same test on every page.
- **Colour is never the only carrier.** Pair each series colour with a shape, a pattern (`.sd-hatch`), a label or
  a position. "Changed" is yellow **plus** a thick ink outline (`.sd-changed`), so it survives grayscale and
  colour blindness. The legend swatches have shapes (`round`, `hollow`, `hl`).
- Helpers: `data-c="1..8"` picks a series colour; `.sd-fill` (solid, `--on-series` text), `.sd-soft` (16 % tint,
  ink text), `.sd-ink` (coloured text/line), `.sd-changed`, `.sd-hl` (inline highlighter), `.sd-anim-in` (a short
  pop, off under reduced motion).

### Typography

- **Atkinson Hyperlegible** (designed for low-vision legibility; distinct 0/O, 1/l/I), bundled, falling back to
  the system sans. Monospace for values and bit strings is the system `ui-monospace`.
- **1 rem = the body size, set from the screen**: `clamp(16px, min(1.05vw, 1.86vh), 32px)`. That is 20 px at
  1920×1080, 26 px at 2560×1440 and 16 px on a phone, so text takes the same share of a projected image at any
  resolution.
- Scale: `--fs-sm` (legends, hints, key badges; never under 16 px), `--fs-md` 1 rem body and controls, `--fs-lg`
  1.25 rem caption, `--fs-xl` 1.6 rem title, `--fs-stage` 1.5 rem default stage labels. Stage drawings may go
  much larger with `cqw`/`cqh`, never smaller than 16 px.
- Size in rem (or `cq*` on the stage), never in px below 16. SVG with a `viewBox` scales text down: draw at 1:1 or
  put labels in HTML (playbook §9).

### Sizes

| Size | Behaviour | Checked by `check-page.mjs` |
|---|---|---|
| 1920×1080 (contract) | one screen, no page scroll, panel fits without its own scroll, body ≥ 20 px | yes |
| below 1920×1080 on a projector | not a target. The layout still holds (outer transport buttons drop their words under 1500 px, the panel may scroll internally) but nothing is checked | no |
| ≤ 900 px wide or portrait (phone, tablet) | stacked: stage, caption, panel; page scrolls; transport sticks to the bottom and shows icons only; speed hidden under 520 px | no horizontal scroll at 375×812, text ≥ 14 px |

### Light and dark

The theme **always follows the OS** (`prefers-color-scheme`), and changes live when the OS setting changes. There
is no theme button, no key and no stored choice. `?theme=light|dark` overrides it only for checks and
screenshots. `kit.js` loads in `<head>` and sets `data-theme` before first paint, so there is no flash.

## 3. Keyboard and live use

Keys are handled by the kit; a page may add its own letters through `def.keys` or a button param's `key`.

| Key | Action | Notes |
|---|---|---|
| `→` `PgDn` | next step | what presentation clickers send. `PgDn` always steps, even on a focused slider |
| `←` `PgUp` | previous step | |
| `Space` | play / pause | deliberately not "next": Space stays play/pause, the clicker's next is `→`/`PgDn` |
| `Home` / `End` | first / last step | |
| `R` | reset: step 0 with the active preset's params (or the defaults) | restores settings too; `Home` keeps them |
| `1` … `9` | load preset 1…9 | |
| `F` | full screen | |
| `C` | hide / show the panel | |
| `B` `.` | blank the screen (what a clicker's "black screen" button sends) | any other key is ignored while blank; `B`, `.` or `Esc` brings it back |
| `?` `H` | shortcuts overlay | lists the page's presets and own keys too |
| `L` | switch language (Croatian ↔ English) | same as the header's language button; the page reloads at the same step (§9) |

Reserved for the kit: the keys above. Free for pages: other letters (the template uses `N` for a random start).

Two traps from ossimulator, handled by the kit and covered by `check-page.mjs`:
- **Buttons never take focus on click** (`mousedown` is cancelled), so after clicking a preset, `Space` plays
  instead of clicking the preset again.
- **Sliders and selects give focus back after a mouse drag or pick**, so a clicker's `→` steps the sim instead of
  moving the slider. Keyboard users who tab onto a slider keep it, and the arrows stay with the slider.

Shortcuts are ignored with Ctrl/Alt/Meta held, while typing in a text field, and while a dialog is open.

### URL state and deep links

The kit keeps `?preset=<id>&step=<n>&<param>=<value>` in the address bar (only values that differ from the preset
or defaults), so a reload keeps the state and any state can be linked. A link opens paused. Also: `?lang=hr|en`
(§9; written when it differs from the page's default), `?theme=`, `?motion=reduce`, `?panel=hidden`.

## 4. Accessibility basics

- Real controls: `<button>`, `<input type="range">`, `<input type="checkbox" role="switch">`, `<select>`; every
  control has a visible label; toggles also write their state ("uključeno"/"isključeno").
- Focus is always visible: a 4 px `--focus` ring (orange in light, amber in dark, ≥ 3:1).
- Targets are at least 44 px high (`--hit`).
- Unavailable transport buttons use `aria-disabled`, not `disabled`, so focus is not lost (playbook §9).
  A param can be disabled with a reason, which replaces its hint.
- The caption is a polite live region; the scrubber has `aria-valuetext` ("Korak 3 / 16"); buttons carry
  `aria-keyshortcuts`.
- `prefers-reduced-motion` and `?motion=reduce` turn off every animation and transition. Stepping still works.
- `lang` on `<html>` is the page's language: the kit sets it (§9), and its own strings follow it. Glossary terms
  in Croatian text carry `lang="en"`, so a screen reader switches voice for them.

## 5. Control kit API

Load the kit in `<head>`, the model and the page script at the end of `<body>`:

```html
<html lang="hr" data-sim="<id>">
<head>
  <link rel="stylesheet" href="<kit>/kit.css">
  <script src="<kit>/kit.js"></script>
  <script src="<kit>/glossary.js"></script>        <!-- only if the strings use [[terms]] -->
  ...
</head>
<body>
  <div class="sd-page">
    <header class="sd-header">
      <a class="sd-back" data-sd-back href="<index>">Popis</a>
      <div class="sd-titles"><h1 class="sd-title">…</h1><p class="sd-subtitle"></p></div>
      <ul class="sd-legend" data-sd-legend></ul>
      <div class="sd-tools" data-sd-tools></div>
    </header>
    <main class="sd-main">
      <div class="sd-stagecol">
        <section class="sd-stage" data-sd-stage data-t-label="stage"></section>
        <p class="sd-caption" data-sd-caption aria-live="polite"></p>
      </div>
      <aside class="sd-panel">
        <div data-sd-presets></div>
        <div data-sd-controls></div>
        <details class="sd-explain"><summary></summary><div data-t-html="explain"></div></details>
      </aside>
    </main>
    <footer class="sd-bar" data-sd-transport></footer>
  </div>
  <script src="strings.js"></script>
  <script src="sim.js"></script>
  <script> var t = Simdeck.useStrings(window.SimStrings); Simdeck.mount({ … labels from t('…') … }) </script>
</body>
```

The kit fills the title and subtitle (from `#simdeck-meta`), the back link's text, the explanation's summary
("Ideja") and the labels of its own containers, in the page's language.

Any `data-sd-*` container may be left out; the kit then skips that part.

### `Simdeck.mount(def)` → controller

```js
Simdeck.mount({
  // model (usually from sim.js)
  steps: 16,                         // number, or (params) => number. 0 or absent = explorer
  defaults: { bits: 4, ... },        // param values (a spec's `value` works too; defaults win)
  initial: (params) => state,        // state at step 0
  step: (state, n, params) => state, // state after step n (n = 1..steps), from state n - 1. Pure, returns new state

  params: [ /* control specs, below */ ],
  presets: [ { id: 'carry', label: 'Prijenos', params: { start: 6 }, step: 0, hint: 'tooltip' } ],
  legend: [ { c: 1, label: 'bit 1' }, { shape: 'hollow', label: 'bit 0' }, { shape: 'hl', label: 'promijenjen' } ],
  keys: [ { key: 'x', label: 'What X does', run: (sim) => {} } ],   // extra page shortcuts

  render: (ctx) => {},               // draw ctx.state into ctx.stage. Called after every change
  caption: (ctx) => 'text' | Node | [strings and Nodes],
  url: true                          // keep state in the query string (false to switch off)
});
```

`ctx` passed to `render` and `caption`: `{ state, prev (state at n - 1, or null), n, steps, params, stage, dir
('forward' | 'back' | 'jump'), preset (id or null), first, last, t (kit strings) }`. Use `dir === 'forward'` to
animate only real forward steps. The page's own strings come from the `t` that `Simdeck.useStrings` returned (§9).

**Step model** (playbook §10.3): the kit computes the state at step n by replaying `step` from `initial(params)`,
caching the states. Step back is exact by construction and there is no snapshot history. Changing a param keeps
the current step and recomputes it, so "what if this block changes?" is answered at the same point of the demo.
A param with `resets: true` sends the demo back to step 0 instead.

The model must be pure and deterministic: no DOM, `Math.random`, `Date` or timers; JSON-safe state (plain
objects, arrays, numbers, strings, booleans); total sort orders with id tie-breaks. Randomness goes through
`Simdeck.rng(seed)`, with the seed as a param.

### Control specs (`params`)

Common fields: `key`, `label`, `hint`, `value` (default), `resets` (bool), `disabled: (params) => reason | false`,
`visible: (params) => bool`.

| `type` | Extra fields | Value | Renders as |
|---|---|---|---|
| `range` | `min`, `max` (number or `(params) => number`), `step`, `unit`, `format: (v) => string`, `live` (default true: updates while dragging) | number | slider with the value shown at the right of the label |
| `toggle` | | boolean | switch with its state written out |
| `choice` | `options: [[value, label], …]` (2–5) | option value | segmented buttons |
| `select` | `options: [[value, label], …]` (more than 5) | option value | drop-down |
| `button` | `run: (sim) => {}`, `key` (optional shortcut) | none | action button in the settings group |

Ranges are clamped to their (possibly param-dependent) bounds and snapped to `step` on every change. The kit always
adds a "Vrati postavke" (reset, `R`) button to the settings group.

Presets: `{ id, label, params, step, hint }`. `params` are applied on top of the defaults; keys `1`…`9` follow the
list order. Changing a param by hand deselects the active preset.

### Controller (returned by `mount`, also `window.simdeck`)

Read: `n`, `steps`, `params` (copy), `state`, `playing`, `preset`.
Act: `go(n)`, `next()`, `prev()`, `first()`, `last()`, `play()`, `pause()`, `toggle()`, `reset()`,
`set(patch)`, `loadPreset(id)`, `setSpeed(0.5 | 1 | 2 | 4)`, `render()`, `help()`, `on(fn)` (called with `ctx`
after every render; returns an unsubscribe function).

### Helpers

| Name | Does |
|---|---|
| `Simdeck.h(tag, attrs, ...children)` | DOM builder: `class`, `dataset`, `style` (object, custom properties allowed), `on<event>`, any attribute; children may be strings, nodes, arrays or null |
| `Simdeck.rng(seed)` | mulberry32: `r()` → [0, 1), `r.int(n)` → 0…n − 1 |
| `Simdeck.stateAt(def, params, n)` | the replay the controller uses; for tests |
| `Simdeck.defaultsOf(def)`, `Simdeck.stepsOf(def, params)` | for tests |
| `Simdeck.cssVar('--c1')` | current token value, for canvas drawing |
| `Simdeck.onTheme(fn)` | called when the OS theme changes (the controller re-renders by itself) |
| `Simdeck.reducedMotion()` | true under the OS setting or `?motion=reduce` |
| `Simdeck.icon(name)` | the kit's SVG icons |
| `Simdeck.useStrings(table)` → `t` | registers the page's `{ hr, en }` table and fixes the language (§9) |
| `Simdeck.term(key, { later })` | a glossary term as a node, in the first-mention style (§9.4) |
| `Simdeck.lang`, `Simdeck.languages`, `Simdeck.switchLang(l)` | the page language, the languages it has, switch (reload) |
| `Simdeck.checkStrings(table, opts)`, `Simdeck.pluralIndex(lang, n)`, `Simdeck.format(s, vars)` | pure; for tests |

`kit.js` also works under node (`require('kit/kit.js')` returns the pure part), which is how `sim.test.js` uses
the same replay as the page.

## 6. The proto-simulator (template)

`kit/template/` is a working sim on a trivial concept, **counting in binary**, and uses every common element:

| Element | In the template |
|---|---|
| stepper with `steps`, pure `initial`/`step` in a DOM-free file | `sim.js`, 16 steps |
| every visible string in both languages, plural forms, glossary terms | `strings.js`; Croatian plurals (`bita`/`bitova`), `[[carry]]` in the explanation |
| range with a param-dependent bound, and one that resets | `bits` (3–8), `start` (0…2^bits − 1, `resets`) |
| choice | `inc`: +1 / +2 / +3 |
| toggles: one changes the reading, one only the view | `signed` (two's complement), `places` (place values) |
| action button with its own key, using the seeded rng | "Nasumični početak" (`N`) |
| five presets, keys 1–5 | count from 0, carry ripple, overflow, two's complement, 8 bits +3 |
| legend with shapes | bit 1 (fill), bit 0 (dashed), changed (highlight) |
| changed marking, forward-only animation | `.sd-changed`, `.sd-anim-in` |
| caption with numbers and a highlighted word | "Korak 2: 0111 + 1 = **1000** = 8. Promijenila su se 4 bita…" |
| collapsed explanation with English terms in italics | "Ideja" |
| metadata placeholder (`id`, `class`, `steps`) and exceptions block | `#simdeck-meta`, `#simdeck-exceptions` |
| back to index | `data-sd-back` |
| tests: the model's rules, then the generic block every sim keeps (incl. both string tables match) | `sim.test.js` |

Screenshots of the template at 1920×1080 (light, dark, grayscale, help, panel hidden) and 375×812, in each
language, are produced by `check-page.mjs --shots` (`<name>-<lang>-<size>-<variant>.png`).

### Starting a new sim

1. `kit/new-sim.sh <id> sims/<id>` (or the admin's **+ Novi simulator**, which runs it). It copies the four
   files, rewrites the id and the paths to the kit and the index, and writes a `status: "wip"` `sim.json` stub
   and the page's `#simdeck-meta` placeholder from it (§7). It refuses to overwrite and rejects non-kebab-case ids.
2. **`sim.js`**: replace the model. Keep the shape (`defaults`, `steps`, `initial`, `step`) and the purity rules.
   **`strings.js`**: replace the strings, both languages at once (§9).
3. **`sim.test.js`**: replace the rule tests at the top with your model's rules (tie-breaks first; break the code
   once to see each test fail). Keep the generic block at the bottom. Run `node --test <dest>/sim.test.js`.
4. **`index.html`**: legend, params, presets, `render`, `caption` and explanation, every word through `t`; keep the
   `#simdeck-meta` placeholder equal to `sim.json` (the admin and `new-sim.sh` write it). Keep page CSS scoped to
   `[data-sim="<id>"]` and on kit tokens only.
5. **`sim.json`**: title, concept, summary, topic, tags, level (docs/site-structure.md §2.1); `npm run check`.
6. Run `npm run gate -- <id> --shots <dir>` and look at the screenshots, including grayscale.
   Set `status` to `ready` when the sim passes its DoD.
7. An explorer: drop `step` and `steps` (or set `steps: 0`), and set `"class": "explorer"` without `steps` in `sim.json` and the placeholder; the transport becomes a reset button, and the
   params drive `render` live. A reference page: no params, no presets; it keeps the header, legend and stage.

## 7. The kit and the site frame (settled 2026-10-01)

These were the template's assumptions; the site frame (`docs/site-structure.md`, its §7 from the frame's side)
settled each one as follows.

| Question | Settled as | Where |
|---|---|---|
| Where is the index? | `<site root>/index.html`, both unbuilt (repo root) and built (`dist/`). The back link (`../../index.html` from `sims/<id>/`) and `INDEX` in `new-sim.sh` match | page, `new-sim.sh` |
| Where do sims live? | `sims/<id>/`, the folder name equal to the id; `index.html`, `sim.js`, `sim.test.js` and `sim.json` | frame |
| Where is the metadata? | **`sims/<id>/sim.json` is the source** (frame format, `lib/manifest.mjs`). There is no central manifest. The page keeps a `#simdeck-meta` placeholder written from `sim.json` (by `new-sim.sh` and the admin), from which the kit takes the title and concept unbuilt and warns on a mismatch of `id`, `class` or `steps`. The build replaces it with one generated from `sim.json`, and the frame's check warns when the placeholder drifts (bilingual, 2026-10-02) | `sim.json`; page placeholder |
| Does `new-sim.sh` write `sim.json`? | yes: a `status: "wip"` stub that passes `npm run check` at once (title = id in both languages, placeholder concept and summary in both, the first topic and tag of `tags.json`, `class` and `steps` as the template; the page placeholder is written from it). Replace its content before setting `ready`. The admin's **+ Novi simulator** runs `new-sim.sh` and writes its own `sim.json` over the stub | `new-sim.sh` |
| `data-sim` | equals the id; `new-sim.sh` sets it, the frame's check enforces it | page |
| Exceptions | stay in the page, `#simdeck-exceptions` as `[{"rule", "why"}]`; the frame validates and counts them | page |
| Back link | goes back in history when the referrer is this site's index (as `…/index.html` or its folder) **or one of its course pages** (`…/courses/<id>/`, which is also where short addresses redirect), so a student returns to their course page and the index keeps its search. Otherwise it follows the link home | kit (`Simdeck.cameFromSite`, tested in `kit.test.js`) |
| Deep links | `?preset=<id>&step=<n>`; course pages link plain sim pages for now and can name a preset later without a kit change | kit |
| Steps | `sim.json` `steps` is recorded; the kit warns if the page mounts a different count | kit, frame |

## 8. Not yet covered

- **The single-file build exists** (frame, `npm run build`, docs/site-structure.md §5). It inlines `kit.css`,
  `kit.js` and the page's own scripts, turns the fonts into `data:` URIs, and refuses network loads. A built sim
  is about 130 KB and passes `npm run check:page` like its source.
- The full contract check exists: `npm run gate -- <id>` (`scripts/gate.mjs`, wave-0 `contract-check`) runs the
  manifest, the model tests, the build, `check-page.mjs` on the built file, the token check and the scope check,
  and applies the page's declared exceptions (docs/tasks/COMMON.md §7).
- Canvas/SVG drawing helpers (lanes, arrows, chunks). Add them additively once two real sims need the same thing.
- The build inlines the whole glossary (~40 KB) into every page that links it; it could keep only the terms the
  page uses.

## 9. Languages (Croatian and English)

Every simulator exists in Croatian and English, in **one page** that carries both string tables and switches at
runtime: no second page per language, so the offline folder and the URLs stay as they are (owner, 2026-10-01).

### 9.1 Which language a page shows

1. `?lang=hr|en` in the URL (course pages link their sims this way, in the course's language);
2. else the visitor's last choice on any simdeck page (`localStorage` key `simdeck.lang`, shared with the home and
   course pages; it can be unavailable, so links also carry `?lang=`);
3. else the page's own `<html lang>`.

A page that has only one language (§9.5) always shows that one. The kit sets `<html lang>` to the result.

**Switching:** the header's language button (it shows the other language's code, `EN` on a Croatian page) or `L`.
It stores the choice and reloads the same file with `?lang=`; the kit's URL state brings back the preset, the step,
the params and a hidden panel, so the lecturer stays where they were. Playback pauses. The back link and the URL
carry the language, so the index the visitor returns to is in the same language.

### 9.2 The string table (`strings.js`)

```js
(function (root) {
  var strings = {
    hr: { bits: 'Broj bitova', captionStep: 'Korak {n}: {sum} = {now}.', flipped: ['Promijenio se {n} bit.', 'Promijenila su se {n} bita.', 'Promijenilo se {n} bitova.'], explain: '<p>… [[carry]] …</p>' },
    en: { bits: 'Number of bits', captionStep: 'Step {n}: {sum} = {now}.', flipped: ['{n} bit changed.', '{n} bits changed.'], explain: '<p>… [[carry]] …</p>' }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings; else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

- **Every visible string** is in the table: labels, legend, presets, hints, captions, stage text, the explanation.
  The title and subtitle are not: they come from `sim.json` (`title`, `concept`) through `#simdeck-meta`.
- Values are strings, or **plural forms** as an array: Croatian 3 (1, 2–4, 5+; 11–14 take the third), English 2.
- `{name}` is a placeholder; both languages use the same placeholders.
- `[[term]]` is a glossary term (§9.4).
- `strings.js` is a classic script like `sim.js`, so node tests `require()` it and the build inlines it.

### 9.3 Looking strings up

`var t = Simdeck.useStrings(window.SimStrings)` before `mount`. It picks the language (§9.1), fills the static
page (`[data-t]` text, `[data-t-html]` markup, `[data-t-label]` aria-label), reports table problems on the console,
and returns `t`:

| Call | Returns |
|---|---|
| `t(key, vars)` | text, placeholders filled, `[[terms]]` as text |
| `t.n(key, n, vars)` | the plural form for `n` (`{n}` filled) |
| `t.parts(key, vars)` | `[strings and nodes]`: a placeholder may be a node (`{ now: h('b', null, '1000') }`); for captions |
| `t.html(key, vars)` | trusted markup from the table, terms in italics; for explanations |

A missing key logs `[simdeck] missing string "<key>" (<lang>)` and shows the key, so the page check fails on it.

### 9.4 Glossary terms

`kit/glossary.js` is the shared term list, `{ en, hr, src }` per term, about 500 of them, seeded by
`tools/glossary/seed.py` from ossimulator's `docs/POJMOVNIK.md` and the two course books' term lists (book terms
the books say are not translations are left out). Terms a sim adds (from its `NOTES.md`) go in with
`"src": "simdeck"`; a re-seed keeps them.

The term rule (ossimulator, COMMON.md §4): on a Croatian page the English term is in italics with the Croatian in
parentheses at first mention, *carry* (prijenos), and in italics alone after that. In a table: `[[carry]]` is a
first mention, `[[=carry]]` a later one. English pages show the term alone. In code: `Simdeck.term('carry')`.
A page that uses terms links `glossary.js` after `kit.js`; a term not in the glossary is a table problem.

### 9.5 Pages in one language

An adopted page that is not translated yet declares the exception in `sim.json`: `"languages": ["en"]`. The frame
counts it, its `<html lang>` must be that language, the home and course pages mark it with a language badge in the
other language's view, and the kit shows no switch (its table has one language).

### 9.6 Checks

- `Simdeck.checkStrings(table)` (pure): every key in both languages, non-empty, same placeholders, plural counts,
  known terms. The template's `sim.test.js` runs it on `strings.js`.
- `check-page.mjs` runs the one-screen fit, text sizes and console checks **once per language** (Croatian labels
  run longer), checks the tables at runtime, and fails **any visible word that is not in the page's tables** for
  that language (the page strings, the kit's strings, the title and concept), at the start, mid-demo, at the end
  and with the explanation open. Key caps, `<code>` and anything inside `translate="no"` (data such as host names
  or addresses) are exempt. It also checks that `L` keeps the step and that the choice is remembered.
- `tests/check-page.test.mjs` proves both checks fail on a broken copy of the template.
