<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-systemd-ordering: notes

New explorer (task `docs/tasks/w2/lnx-systemd-ordering.md`, catalogue `lnx-systemd-ordering`, wave 2b). No kit view
fits (K2 topology has undirected links without edge kinds or arrows with labels; K1, K3, K4 are other shapes), so the
page draws its own graph: HTML cards on a grid and an SVG layer measured in CSS pixels after layout (1:1, no viewBox
scaling; every label is HTML), redrawn by a `ResizeObserver`, as K2 does. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Data-driven model.** `compute(graph)` works on any `{ root, units, edges }`; `graph(params)` builds the page's
  four-unit scene. Edge kinds `wants`, `requires`, `after`, `before` and `depends` (requirement + `after` in one
  relation, for `win-services`' Windows dependencies; the task's "Out of scope" asks the host to allow it). Nothing in
  `compute` is lnx-specific or holds strings: promotable to `models/` unchanged.
- **The target's automatic `After=`** (systemd.target(5), Default Dependencies) is modelled (SPEC rule 9) and drawn as
  a dotted grey arrow labelled "automatski"/"automatic". The task's rules do not name it; without it
  `multi-user.target` would be "reached" in slot 1 before the units it pulls in. It makes the timeline 2–3 slots, as
  the task expects ("3–4 slots").
- **`multi-user.target` is the default target** (UL10: `systemctl get-default` → `multi-user.target`); the card says
  "zadani cilj"/"default target". No separate `default.target` card (it is an alias of it).
- **`app.service` is always enabled** and its card shows its unit file as the params write it (`[Unit]` lines,
  `[Install] WantedBy=multi-user.target`): the relations the student edits are visible as the text they would type.
  On the phone the file moves under the graph.
- **Requirement vs ordering drawing.** Requirement: a line with a chevron at the pulled-in unit, `Wants=` thin dashed,
  `Requires=` thick solid. Ordering: a blue arrow from the earlier to the later unit with a clock glyph. A pair's two
  lines sit side by side on fixed sides; labels are staggered along the line and pushed clear of it after layout. An
  edge to a unit outside the transaction is drawn grey and dotted (rule 5 made visible).
- **Lane order** follows rule 6's tie-break (by slot, then id; outside the transaction last), so the timeline reads
  as a staircase and a lane's place carries meaning.
- **"Changed"** marks units whose result **or slot** changed with the last param change (the task says result). The
  slot is included so that toggling `After=` (which moves `app` without changing its result) is outlined too.
- **Boot replay** is page-only animation (`shown`), 1.1 s per slot; the cards show "čeka…"/"waiting…" for units whose
  slot has not come; the caption names the units starting in the slot. Off under reduced motion; any param change
  stops it. Key `P`.
- **Caption choice lives in `sim.js`** (`nextFocus`, `captionKey`), pure and tested branch by branch. The task's two
  captions are used verbatim (`cReqNoAfter`, `cAfterOnly`). `cReqNoAfter` ("both start at once") is used only when db
  and app really share a slot; otherwise `cReqNoAfterApart`.
- **Presets 2–5 switch the network relation off**, so the db relation alone sets app's slot and the task's numbers hold
  ("db and app in slot 1 together").
- **Legend** has all eight items in the header (three edge kinds, four states, changed); it fits on one line at
  1920×1080 in both languages. States always pair colour with a symbol (● ✗ ⊘ ○), a border style and a word.
- **Phone:** the cards drop the state word and the sub-lines (symbol only; the legend names them), the timeline drops
  the state word, unit names break after dots and dashes (`<wbr>`), and the "automatic" label is hidden.
- **Commands and directives are the subject** (UL ch10): `Wants=`, `Requires=`, `After=`, `Before=`, `WantedBy=`,
  `systemctl enable`, unit names. They appear in `code`/`translate="no"`; the tables mark them with backticks, which
  the page turns into `<code>`.
- **`related`: `lnx-boot-chain`** (merged; the other half of catalogue §5.15).
- Tags: `services`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **Rule 9 added** (target's automatic `After=`), see Decisions.
- **"Changed" includes slot changes**, see Decisions.
- **The `dbEnabled` hint** was dropped from the panel (the panel was 14 px too tall at 1920×1080); the db card shows
  `WantedBy=multi-user.target` and "uključen/isključen" instead.
- **Presets 2–5 set `appToNet: none`, `appAfterNet: off`** (not stated in the task) so their expected numbers hold.

## Sources

- `uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, "Jedinice: čime `systemd` upravlja": "Što treba znati"
  (`systemctl cat crond.service`, targets in `Wants=`/`Requires=` and `Before=`/`After=`, `get-default`, `Wants=`,
  `Requires=`, requirement ≠ ordering, "samo `After=` … ništa neće povući", "dva retka, ne jedan", `[Install]`,
  `WantedBy=`, `.wants/`) and "Šire o temi" (`list-dependencies`); "Primjer 1" (enabled vs started). Diagrams in
  `assets/diagrams/chapter-10/` (boot chain; not used here, nothing copied).
- Local man pages, systemd 255 (Ubuntu 24.04), read 2026-10-22: systemd.unit(5) `Requires=`, `Before=, After=`
  (rules 3, 4, 6, 7 checked word for word); systemd.target(5) Default Dependencies (rule 9); systemd(1) transaction
  cycle fix-up (rule 8); systemd.special(7) `network-online.target`. UL10 cites systemd 257 on Rocky Linux 10.2; the
  passages used read the same. *(check: not re-read in the 257 man pages.)*
- The task's "(check wording)" on rule 3 and "(check)" on rule 8: both checked against the man pages above.
- **Not run on a real system:** the expected slots are a model of job ordering, not measured boot times. *(check on
  the course's lab VM with `systemd-analyze critical-chain` if wanted.)*

## Term pairs

From the glossary (`[[…]]` in the explanation): *unit* — jedinica, *target* — cilj, *dependency* — ovisnost,
*transaction* — transakcija. Missing from `kit/glossary.js`, written out in both tables (Croatian from UL ch10 and the
task):

| en | hr |
|---|---|
| service | usluga |
| ordering | redoslijed |
| enable / start | uključiti / pokrenuti |
| dependency failed (unit state) | ovisnost nije uspjela |

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Kit (optional, not blocking):** a directed-graph view (cards, labelled edges of several styles, arrowheads, a pair
  of parallel edges) would serve this page and `win-services`; one consumer so far, so not requested as a view.

## For `win-services` (the preset task on this host)

- `compute(graph)` already takes any units and a `depends` edge kind (requirement + `after`); a preset would need
  `graph()` to return the preset's own graph instead of the lnx scene (a `scene` param or a preset-level graph), and
  the page to place cards for other unit ids (it has fixed grid areas for the four lnx units today). Start types
  (Manual ≈ pulled only by a dependent, Disabled), delayed start and recovery counters are not modelled.

## Questions for the owner and the book

- **UL ch10 says** "Tko napiše samo `Requires=`, dobio je jamstvo da će druga jedinica biti aktivna"; systemd.unit(5)
  says `Requires=` without `After=` does not stop the requiring unit when the other fails, and the task (and this
  page) show exactly that. Worth a look in the book (`uvod-u-linux`, not changed here).

## Checks

- Numbers printed from the model before the page was written and compared with the task's expected results (SPEC.md
  table): all equal.
- **Mutations** with a script, one at a time (31): `after` pulling units in, `wants` strong, `Requires=` blocking
  without `After=`, dependency failure not propagated, `fails` before `blocked`, slot as a sum, slot without +1,
  ordering ignoring the transaction, `Before=` swapped, `depends` without order, install ignoring `enabled`, no target
  `After=`, target `After=` despite an explicit ordering, automatic `After=` on services, lane tie-break reversed, lanes
  by id only, `txn` unsorted, `waits` unsorted (missed at first; test added), no cycle check, `changed` ignoring slots,
  focus on a preset, focus on net keys, the same-slot caption condition, the net caption, the after-only caption, the
  graph's net `After=` pointing at db, `dbEnabled` ignored, app not enabled, the default `appAfterDb`, a preset's
  `dbFails`, the default unit type. All **31** fail a test. After the fresh review, 9 more (caption slot numbers
  swapped or hard-coded, `rel` always `Wants=`, rule 9's skip in one direction only, rule 9 for `Wants=` only, the
  network caption for a dependency-failed app): 8 fail a test; the ninth (`cAfterFailed` with app's slot hard-coded
  to 2) is equivalent for every state the page can reach (app is always in slot 2 there).
- Browser: every preset in hr and en at 1920×1080, dark, db enabled + failing, the replay mid-way (slot 2 of 3), the
  phone at defaults and at `requires-after`. No console errors. Fixed from the screenshots: the panel 14 px too tall,
  app and db cards too close (edge labels on the cards), the "changed" highlighter filling whole timeline rows, the
  cards showing final states during the replay, the phone's cards overlapping and unit names breaking mid-word, two
  diagonal labels colliding when db is enabled.

- **Fresh review** (a separate agent read the task, SPEC, model, tests, strings and page against UL ch10 and the
  man pages, enumerated all 96 param combinations × 2 caption focuses, and tried its own mutations; rules 1–9 agreed
  with the sources). Fixed from it: network captions naming a slot for a dependency-failed app (now the db caption
  speaks); "both start at once" / "start in the same slot" in the explanation (true only when nothing else orders
  them; now "neither waits for the other"); `[[=dependency]]` at its first mention (now `[[dependency]]`); a Croatian
  sentence starting with a lower-case term; tests for every caption's numbers, `rel`, rule 9 on `Requires=` and in
  both ordering directions; the hr plural form of `cReplay` for 5+; "by itself" placement in en; the db card's
  gender (uključen); ○ in the legend's "not in transaction" swatch; a `depends` edge drawn as requirement + ordering
  (was a requirement only, with a made-up label); a duplicate CSS declaration. Noted, not changed: SPEC rule 3's
  "runs" half and the dependency-failed slot (both marked in SPEC.md).
- `npm test` (3031 + this sim's), `npm run check` (0 errors) and `npm run gate -- lnx-systemd-ordering` (48/48 browser
  checks) pass; gate screenshots at 1920×1080 light, dark, grayscale and 375×812 in hr and en reviewed.
- Not checked: a real projector and a lecturer at the page; the slots against a real boot.

## Time

Start 2026-10-22 17:22, done 17:47 (CEST), about 25 minutes, one session, including the fresh review.
