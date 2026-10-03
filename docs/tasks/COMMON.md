# Rules for every simdeck task

Every task file in `docs/tasks/` says what to build or adopt. This file says how, once, for all of them.
Read it before you start. If a wave-0 task changes one of these rules, it changes this file; task files do not
repeat them.

## 1. What simdeck is

A library of short browser simulators for lectures, one concept each, gathered in one searchable index, with
one-page course lists for students (`docs/proposal-simdeck.md`). Owner decisions that bind every task:

- **Copy and adopt, never link out.** Everything simdeck lists lives in `sims/<id>/` and works offline from one
  folder (`docs/site-structure.md` §0). The simdeck copy is canonical once imported.
- **Croatian and English** in every simulator and on every site page (§4).
- **AGPL-3.0-or-later** for simdeck and for everything copied into it (§9).
- **One concept per simulator.** If yours grows a second concept, stop and report; it is a second task.
- **No answer keys on pages.** `~/projects/dr-lecture-estate/instructor/` (model answers, caveats, the estate
  map) may inform a model, but its answers never appear on a page or in a preset: students work those
  scenarios. The estate's `student/` material may be used freely.
- **Concepts, not tools** (owner, 2026-10-01). Show the mechanism, never a specific tool: no attack or
  capture tools, scanners, crackers or products by name, and no step that works as a how-to. Name a specific
  operating system or vendor only when the concept depends on it (a Windows GPO, a Linux namespace); otherwise
  keep it generic ("a host", "the firewall"). Commands and configuration files appear only where they are the
  subject being taught (`umask`, `pg_hba.conf`), not as decoration.
  A product may be named on the page only when the course teaches that product as the topic: the NLA syllabus
  names KVM and libvirt (T01), Kubernetes (T19), Ceph (T26), Ansible (T30), Terraform (T31), Prometheus
  (T36), Pacemaker and Corosync (T52), and
  the Windows courses teach Windows Server features (AD, GPO, WSUS, IPAM, Hyper-V checkpoints). Container
  engines, web servers, hypervisor apps and packet-filter front ends are not topics: say "the container
  engine", "a web server", "a desktop hypervisor", "the packet filter". Documentation titles and man pages
  belong in Sources, for the builder, not in captions, presets or labels.

## 2. Where things live

```
sims/<id>/        your folder: sim.json, index.html, strings.js, sim.js, sim.test.js, SPEC.md, NOTES.md, local assets
kit/              the shared in-sim kit (docs/sim-ui.md): kit.css, kit.js, fonts, template, new-sim.sh, tools
models/           shared model code, promoted from sims by the coordinator (§6, models/README.md)
site/, lib/, scripts/, admin/   the site frame (docs/site-structure.md): build, checks, admin
tags.json, courses/, site.json  vocabulary, course playlists, site settings
docs/catalogue.md the catalogue every task comes from; docs/tasks/ these tasks
```

**Kit views.** A task file that names a kit view draws with it instead of its own drawing: **K1, message sequence
chart** (lanes per party, one arrow per message with its label and fields, the current one highlighted, lost or
dropped messages, notes, timers on a lane, an "eavesdropper sees" column) is `kit/sequence.js`,
`Simdeck.sequence(spec)` (`docs/sim-ui.md` §11; pilot `sims/dhcp-dora/`). **K2, topology with
moving packets** (nodes, links, a bus, packets per step with their headers, link and node failure, a table beside
each node) is `kit/topology.js`, `Simdeck.topology(spec)` (`docs/sim-ui.md` §10; pilot `sims/arp-local-remote/`).
**K4, rule table with the matching row** (an ordered rule list, the request's chip at the row compared, failing fields
struck, the deciding row outlined, unread rows hatched, an implicit default row; modes first match, most specific and
deny wins, or marks the page sets for a rule of its own) is `kit/ruletable.js`, `Simdeck.ruleTable(spec)`
(`docs/sim-ui.md` §12; pilot `sims/rule-first-match/`).
**K3, block grid** (rows of cells for blocks, chunks, pages or extents, state by colour and pattern: owned, shared and
hatched with a reference count, invalid, lost, reserved; spans with their numbers, a bracket above a range, arrows
between cells or rows, holes, a meter and the counter of space used) is `kit/blockgrid.js`, `Simdeck.blockGrid(spec)`
(`docs/sim-ui.md` §13; pilot `sims/dedup-chunking/`).
The page links the view's script (`../../kit/sequence.js`, `../../kit/topology.js`, `../../kit/ruletable.js`, `../../kit/blockgrid.js`) after `kit.js`. If the view lacks something your sim needs, draw that part
in the page and write the request in `NOTES.md` under "Shared requests"; the kit owner adds it.

## 3. The contract (every page)

From `docs/design-notes-simdeck.md`, playbook §10.2 and `docs/sim-ui.md`:

- **One screen at 1920×1080**, no page scroll, in the light (projector) theme. Phone layout must not scroll
  sideways at 375×812.
- **Text:** body ≥ 20 px at 1920×1080, legends and hints ≥ 16 px. Sizes in rem (or `cq*` on the stage), never
  px below 16. SVG with a `viewBox` scales text down: draw at 1:1 or put labels in HTML.
- **Clicker keys** for steppers: → / PgDn next, ← / PgUp back, Home/End, R reset, 1–9 presets (the kit does
  this; don't override reserved keys, `docs/sim-ui.md` §3).
- **Kit tokens only** for colour; every `var(--x)` must be defined. Colour is never the only carrier of
  meaning: pair it with a shape, pattern, label or position. Check the grayscale screenshot.
- **Offline:** nothing loaded from the network (fonts, scripts, images, frames, CSS `url()`). The build refuses
  it. Vendor what you need, with its licence header.
- **Reduced motion:** `?motion=reduce` and the OS setting turn off every animation.
- **A demo takes 3–5 minutes.** A stepper has at most about 20 steps; more needs a declared exception or a
  second preset.
- **Exceptions** are declared in the page's `<script type="application/json" id="simdeck-exceptions">` block
  (`[{ "rule", "why" }]`), never worked around silently. `rule` is one of the gate's rule ids (`lib/contract.mjs`):
  `one-screen`, `text-size`, `phone`, `keys`, `steps`, `max-steps`, `motion`, `console`, `languages`, `theme`,
  `tokens`, and `kit` on adopted pages only (`sim.json` `origin` set; §12). A declared rule waives that rule's
  failing checks; the gate counts them, per class over the repo too. `manifest`, `tests`, `offline`, `scope` and
  `entries` cannot be waived, nor `kit` on a native sim. The single-language exception is `sim.json` `languages` (§4).
- **Page skeleton** (`docs/site-structure.md` §7): `<html lang="…" data-sim="<id>">` with `data-sim` equal to
  the folder name; the page links `../../kit/kit.css` and `../../kit/kit.js` itself (so it runs unbuilt from
  `file://`), and `../../kit/glossary.js` when its strings use `[[terms]]`; a `#simdeck-meta` placeholder written
  from `sim.json` (`new-sim.sh` and the admin do it), which the build replaces with one generated from `sim.json`.

## 4. Croatian and English

Every visible string exists in both languages, in **one page** that switches at runtime: title, concept, summary,
labels, legend, captions, explanation, preset names, hints, stage text, attribution. The mechanism is the kit's
(`docs/sim-ui.md` §9); a task only writes strings.

- **`sims/<id>/strings.js`** holds every visible string as `{ hr: {…}, en: {…} }`, same keys in both (the template
  shows the shape). Values are strings or plural forms (Croatian 3: 1 / 2–4 / 5+; English 2), `{name}`
  placeholders, `[[term]]` glossary terms. Nothing visible is typed into `index.html` or `sim.js`.
- In the page: `var t = Simdeck.useStrings(window.SimStrings);` before `Simdeck.mount`, then `t('key')`,
  `t.n('key', n)` for plurals, `t.parts('key', { now: node })` for captions with markup, `t.html('key')` for
  the explanation; static elements take `data-t="key"`, `data-t-html="key"` or `data-t-label="key"`. Data that is
  not language (host names, addresses, bit strings in text) goes in an element with `translate="no"`.
- The title and subtitle come from `sim.json` (`title`, `concept`), not from the table.
- **Term rule** (ossimulator): on Croatian pages the English term is in italics with the Croatian in parentheses
  at first mention, e.g. *page fault* (promašaj stranice), and alone in italics after that. Write `[[page fault]]`
  for the first mention and `[[=page fault]]` later; the kit renders both languages. Terms come from
  `kit/glossary.js` (seeded from ossimulator's `docs/POJMOVNIK.md` and the course books, `~/projects/uvod-u-linux`,
  `~/projects/uvod-u-racunalne-mreze`). A term you need that is missing: use the books' Croatian term, list the
  pair in `NOTES.md` under "Term pairs", and say so in your report; the coordinator adds it to the glossary with
  `"src": "simdeck"` (never edit `kit/` yourself, §9). Until then write the pair out in both tables.
- Captions are written in both languages from the start, not translated at the end. Croatian runs longer: check
  the layout in both (§7).
- **Adopted pages** move their text into `strings.js` and use the kit. A page that cannot be translated in its task
  declares the single-language exception in `sim.json` (`"languages": ["en"]`) and says so in the report; its
  metadata is still in both languages. ossimulator imports are translated in ossimulator (`w0/ossimulator-english`)
  and read `?lang=` the same way.
- Model code, event codes and test names are English and language-neutral; tests never assert on wording. Keep the
  template's test that both tables match (`Simdeck.checkStrings`).

## 5. `sim.json`

Fields and rules: `docs/site-structure.md` §2.1. Required: `id` (= folder name), `class`, `status`, `title`
(≤ 60 chars), `concept` (≤ 80), `summary` (≤ 160), `topic`, `tags`, `level`, and `steps` for steppers.
`title`, `concept` and `summary` are `{ "hr": "…", "en": "…" }`, both non-empty and each within the limit.
Optional: `aliases` (`{ "hr": [...], "en": [...] }`), `entries` (preset entries, §6), `languages` (only the single-language exception, §4),
`related`, `origin` (set it for adopted pages), `asset_review`, `credits` (third-party material, §9). `lang` no longer exists. Unknown fields are errors.
`kit/new-sim.sh <id> sims/<id>` copies the template and writes a `wip` `sim.json` stub that passes the check; the
admin's + Novi simulator does the same. Fill in the real title, concept, summary, topic and tags. Use the topic
and tags your task file names; if `tags.json` lacks one, the wave-0 `vocabulary` task adds it. Never edit
`tags.json` yourself: list missing tags in your report. Keep `status: "wip"` until §8 holds. When you change the
title or concept, update the page's `#simdeck-meta` placeholder too (`npm run check` warns until you do).

## 6. Reusing another sim's model

A task file may say "soft: start after X is merged and reuse its model". Shared model code lives in `models/`
(`models/README.md`): pure, DOM-free classic scripts, one per model, each with its own tests, that register on
`globalThis.SimdeckModels` like the kit registers `Simdeck`.

- **If the model is in `models/`, use it from there.** The page includes it before `sim.js`, the way it includes
  the kit: `<script src="../../models/<name>.js"></script>`. `sim.js` takes it from
  `root.SimdeckModels['<name>']` in the page and from `require('../../models/<name>.js')` in node tests (the
  pattern is in `models/README.md`). The build inlines it into the sim's single file; the gate checks it and runs
  its tests with yours. Your tests cover what you build on top, not the model's own rules again.
- **If it is not there yet,** the coordinator promotes it from X before your task starts (`models/README.md`,
  "Promotion"). If it is still missing when you start, **copy** the functions you need into your `sim.js` with a
  comment `// from sims/<x>/sim.js @ <commit>`, keep their tests, and say so in your report so the coordinator
  can promote it and point your sim at it.
- The build inlines only files inside the sim's folder, the kit and `models/`. Never
  `<script src="../other-sim/sim.js">`.
- **Never edit `models/`** (or the source sim). If the model needs a change, write the request under "Shared
  requests" in your `NOTES.md` (what, why, the smallest change), work around it locally, and say so in your
  report. The coordinator lands it additively (a new function or an optional parameter that keeps every old
  result, with a test and a `models/CHANGELOG.md` line); you then drop the workaround.
- **If other sims will reuse your model** (task files of later sims name yours as their soft dependency), keep the
  reusable part promotable: pure functions over plain data, no strings and no page code, so the coordinator can
  move it to `models/` unchanged.
- A **preset task** adds a preset to the host folder named in its task file: presets, their strings and tests
  only, plus the preset's line in the host's `sim.json` `entries`:
  `{ "preset": "<id>", "title": { "hr", "en" }, "concept": { "hr", "en" } }` (`docs/site-structure.md` §2.1). That
  lists it on the home page and lets a course file name it as `"<host>#<id>"`; the gate opens it (rule `entries`).
  Adding the preset to a course file is the coordinator's. One preset task per host at a time.

## 7. Checks

Run from the repo root:

```sh
npm run gate -- <id>                    # every contract rule on sims/<id>/; exits 0 only when all pass
npm run gate -- <id> --shots /tmp/<id>-shots   # screenshots somewhere you choose (default: the gate's temp folder)
```

The gate (`scripts/gate.mjs`, rules in `lib/contract.mjs`) runs, in order:

1. **manifest**: `sim.json` and the page's blocks (`lib/manifest.mjs`); a stepper has at most 20 steps.
2. **tests**: `node --test sims/<id>/sim.test.js`, and `models/<name>.test.js` for every shared model the page
   includes (§6); the manifest step checks those models too.
3. **build**: the sim alone as one self-contained file in a temp folder (its folder, the kit and the shared models
   it includes); a network load fails it.
4. **browser**: `kit/tools/check-page.mjs` on the built file from `file://`, every request blocked: one screen at
   1920×1080 light and dark, body ≥ 20 px and nothing under 16 px, no sideways scroll at 375×812, clicker keys
   (steppers), the controller's step count equals `sim.json` `steps`, reduced motion (URL and OS), no console
   errors, theme follows the OS, both languages (tables, words, the L switch).
   An adopted page that waives `kit` gets `scripts/check-adopted.mjs` instead: the same checks where they need no
   kit (no network requests, console, fit and text at 1920×1080, phone, `<html lang>`, theme, reduced motion, each
   entry opens), and the kit-only ones reported as waived under `kit` (§12).
5. **tokens**: every `var(--x)` defined; no colour literals in the page's own CSS.
6. **scope**: `git diff --name-only --no-renames main...HEAD`, uncommitted and untracked files, all under
   `sims/<id>/` (a preset task gates its host id). `--base <ref>` compares with another branch.
7. **exceptions**: declared ones (§3) waive their rule's checks; the count is printed per rule and per class.
8. **screenshots**: 1920×1080 light, dark and grayscale, and 375×812, in both languages.

Look at every screenshot, including grayscale and the phone size. The single steps are still there when you want
one alone: `node --test sims/<id>/sim.test.js`, `npm run check`, `npm run check:page -- sims/<id>/index.html`
(unbuilt), `npm run build -- --out /tmp/<id>-site --drafts`. `npm run gate -- proto` gates the kit's template.

Tests: the model's rules first, **tie-breaks first of all** (the most common untested defect, playbook §9), then
the template's generic block (determinism, JSON-safe state, step back = replay). Break the code once per rule to
see the test fail.

## 8. Definition of done

- [ ] `SPEC.md` (new sims) states every rule, tie-break and expected number with its source; numbers checked.
- [ ] Model tests pass; every rule and tie-break has a test that fails when the rule is broken.
- [ ] `npm run gate -- <id>` passes (§7); screenshots at 1920×1080 (light, dark, grayscale) and 375×812 reviewed.
- [ ] Both languages complete (§4): `strings.js` tables match, the gate's browser checks pass in hr and en (every visible word
      from the tables), and the screenshots of both languages are reviewed.
- [ ] `sim.json` valid; `status` set to `"ready"` last.
- [ ] Offline single file works from `file://`.
- [ ] `NOTES.md`: decisions, deviations from the task, sources, unchecked items marked *(check)*, term pairs,
      shared requests, and **time from start to done** (the proposal's "one session per sim" measure).
- [ ] Only your folder changed (§9).
- [ ] New sims: a fresh reviewer read the diff against `SPEC.md` and broke rules on purpose (playbook §7.4).

## 9. Ownership, git and licence

- Change only `sims/<id>/` (or the host folder for a preset task). Never edit `kit/`, `site/`, `lib/`,
  `scripts/`, `tags.json`, `courses/`, `docs/` outside your task's own notes, or another sim. Needs there go
  in your report.
- No new dependencies. Install tools with this repo's own `npm ci` (Playwright for the gate's browser checks); never borrow
  another project's `node_modules`.
- Commit on your thread branch with English messages; the coordinator rebases, runs the gate and merges.
- Licence: every new source file starts with `SPDX-License-Identifier: AGPL-3.0-or-later` in a comment.
  Vendored libraries keep their own header. Adopted CC BY 4.0 material (50ohm) keeps its attribution visible
  on the page in both languages. List every third-party part (vendored library, CC BY text or figure) in `sim.json`
  `credits` (`docs/site-structure.md` §2.1); the site's licences page is generated from it.

## 10. Report

At the end, report: what you built, what you could not check, deviations from the task, shared requests,
tags and topic used (and any missing from `tags.json`), glossary terms you needed that were missing, screenshots
path, and the time from start to done.

## 11. Lessons carried from ossimulator (playbook §9)

- Write a test for every rule, especially tie-breaks, and see it fail once.
- Rejected actions keep keyboard focus: use `aria-disabled`, not `disabled`, and say why in the caption.
- User actions take effect in the next step; the state stays valid with repeated or duplicate ids.
- Long labels break the projector layout: check them at 1920×1080 in both languages (Croatian runs longer).
- Comparisons: when one variant finishes, run the others to their own end and show each outcome.
- Collect questions instead of blocking: do something sensible, and write down exactly what you did.

## 12. Importing a built page without the kit (ossimulator)

ossimulator pages (and any other adopted page with its own runtime) are imported as built single files and never
adapted to the kit (`docs/site-structure.md` §0). The gate handles them so (since t-0022); where a task file's
steps say otherwise, these rules win.

- **Markers, the only edits to the build:** `data-sim="<id>"` on `<html>`, then first in `<head>` the
  `#simdeck-meta` placeholder (one line, `metaFor(sim.json)` from `lib/manifest.mjs`) and the `#simdeck-exceptions`
  block (one line). `sims/interrupts/` is the worked example, its `sim.test.js` the test to copy: it takes the
  markers out and checks the build's sha256, so a hand edit of the copy fails.
- **`sim.json`:** `origin` is `ossimulator/<module>`. Without `origin`, `kit` cannot be waived and `npm run check`
  fails. Croatian-only builds take the single-language exception, `"languages": ["hr"]` (§4).
- **Declare** `kit` (its own runtime), and each of these that its gate run shows failing: `text-size`
  (ossimulator's floor is 14 px), `one-screen` (the layouts scroll), `tokens` (its own design tokens), `phone`,
  `motion`. Give each a `why` naming the ossimulator cause.
- **Do not declare `languages`**, even where the task file says to: the single-language exception is `sim.json`
  `languages`, and the language checks a page without the kit could fail are kit-only, waived under `kit`. Nor
  `keys` or `steps`: they are kit-only too.
- **The gate's browser step** for such a page is `scripts/check-adopted.mjs` (§7); it says so in its output. Its
  `unused` line names exceptions that waived nothing: drop them. A page that mounts the kit (`window.simdeck`) may
  not declare `kit`, and fails on it.
- **Defects** (a check that fails and is not one of the exceptions above, broken in-page links) go into
  ossimulator, in `NOTES.md` under "Defects for ossimulator", and the build is re-imported; keep `status: "wip"`
  while one stands.
