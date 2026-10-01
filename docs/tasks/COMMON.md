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
sims/<id>/        your folder: sim.json, index.html, sim.js, sim.test.js, SPEC.md, NOTES.md, local assets
kit/              the shared in-sim kit (docs/sim-ui.md): kit.css, kit.js, fonts, template, new-sim.sh, tools
models/           shared model code, if wave 0 task shared-models creates it (§6)
site/, lib/, scripts/, admin/   the site frame (docs/site-structure.md): build, checks, admin
tags.json, courses/, site.json  vocabulary, course playlists, site settings
docs/catalogue.md the catalogue every task comes from; docs/tasks/ these tasks
```

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
  (`[{ "rule", "why" }]`), never worked around silently. The check validates and counts them.
- **Page skeleton** (`docs/site-structure.md` §7): `<html lang="…" data-sim="<id>">` with `data-sim` equal to
  the folder name; the page links `../../kit/kit.css` and `../../kit/kit.js` itself (so it runs unbuilt from
  `file://`); a `#simdeck-meta` placeholder with `id`, `class` and `steps`, which the build replaces with one
  generated from `sim.json`.

## 4. Croatian and English

Every visible string exists in both languages: title, concept, summary, labels, legend, captions, explanation,
preset names, hints, attribution.

- Until wave 0 task `bilingual` lands its mechanism, keep all page strings in one object
  `const STRINGS = { hr: {…}, en: {…} }` in `sim.js` or `index.html`, look strings up through one function,
  and pick the language from `<html lang>`. That task converts this pattern mechanically; anything else
  will need rework.
- Croatian text follows ossimulator's term rule: the English term in italics with the Croatian in parentheses
  at first mention, e.g. *lease* (najam adrese). Use the Croatian terms from the course books where they exist
  (`~/projects/uvod-u-linux`, `~/projects/uvod-u-racunalne-mreze`) and list the term pairs you used in
  `NOTES.md` (the shared glossary is collected from them).
- Captions are written in both languages from the start, not translated at the end.
- Model code, event codes and test names are English and language-neutral; tests never assert on wording.

## 5. `sim.json`

Fields and rules: `docs/site-structure.md` §2.1. Required: `id` (= folder name), `class`, `status`, `title`
(≤ 60 chars), `concept` (≤ 80), `summary` (≤ 160), `topic`, `tags`, `level`, `lang`, and `steps` for steppers.
Optional: `aliases`, `related`, `origin` (set it for adopted pages), `asset_review`. Unknown fields are errors.
The admin's + Novi simulator creates the folder from the template and writes `sim.json`; `kit/new-sim.sh` alone
does not write `sim.json` yet (wave 0 `kit-follow-ups`). Use the topic and tags your task file names; if `tags.json` lacks one, the wave-0 `vocabulary` task adds
it. Never edit `tags.json` yourself: list missing tags in your report. Keep `status: "wip"` until §8 holds.
The bilingual task will change `title`, `concept` and `summary` to `{ "hr", "en" }`; until then write the
Croatian there and the English in `NOTES.md` under "English metadata".

## 6. Reusing another sim's model

A task file may say "soft: start after X is merged and reuse its model".

- The build inlines only files inside the sim's folder. Never `<script src="../other-sim/sim.js">`.
- Until `models/` exists (wave 0 `shared-models`), **copy** the functions you need into your `sim.js` with a
  comment `// from sims/<x>/sim.js @ <commit>`, and keep their tests.
- If the source model needs a change, don't edit it. Write the request under "Shared requests" in your
  `NOTES.md` (what, why, the smallest change), work around it locally, and say so in your report.
- A **preset task** adds a preset to the host folder named in its task file: presets, their strings and tests
  only. One preset task per host at a time.

## 7. Checks

Run from the repo root:

```sh
node --test sims/<id>/sim.test.js                         # your model's rules (npm test runs every sim's tests)
npm run check                                             # manifest: sim.json, tags, courses, meta and exceptions blocks
npm run check:page -- sims/<id>/index.html --shots /tmp/<id>-shots   # 1920×1080 fit, text size, keys, screenshots
npm run build -- --out /tmp/<id>-site --drafts            # your page as one self-contained file
```

Wave 0 task `contract-check` replaces these with `npm run gate -- <id>`; use it once it exists. Look at every
screenshot, including grayscale and the phone size. Open the built single file from `file://` with the network
off.

Tests: the model's rules first, **tie-breaks first of all** (the most common untested defect, playbook §9), then
the template's generic block (determinism, JSON-safe state, step back = replay). Break the code once per rule to
see the test fail.

## 8. Definition of done

- [ ] `SPEC.md` (new sims) states every rule, tie-break and expected number with its source; numbers checked.
- [ ] Model tests pass; every rule and tie-break has a test that fails when the rule is broken.
- [ ] Checks in §7 pass; screenshots at 1920×1080 (light, dark, grayscale) and 375×812 reviewed.
- [ ] Both languages complete (§4); no string left in one language only.
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
- No new dependencies. Install tools with this repo's own `npm ci` (Playwright for `check:page`); never borrow
  another project's `node_modules`.
- Commit on your thread branch with English messages; the coordinator rebases, runs the gate and merges.
- Licence: every new source file starts with `SPDX-License-Identifier: AGPL-3.0-or-later` in a comment.
  Vendored libraries keep their own header. Adopted CC BY 4.0 material (50ohm) keeps its attribution visible
  on the page in both languages.

## 10. Report

At the end, report: what you built, what you could not check, deviations from the task, shared requests,
tags and topic used (and any missing from `tags.json`), the English metadata, screenshots path, and the time
from start to done.

## 11. Lessons carried from ossimulator (playbook §9)

- Write a test for every rule, especially tie-breaks, and see it fail once.
- Rejected actions keep keyboard focus: use `aria-disabled`, not `disabled`, and say why in the caption.
- User actions take effect in the next step; the state stays valid with repeated or duplicate ids.
- Long labels break the projector layout: check them at 1920×1080 in both languages (Croatian runs longer).
- Comparisons: when one variant finishes, run the others to their own end and show each outcome.
- Collect questions instead of blocking: do something sensible, and write down exactly what you did.
