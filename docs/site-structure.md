# simdeck: site structure

simdeck has two sides, built from the same files:

| | **Admin** (editorial) | **Site** (published) |
|---|---|---|
| What | a local web app: edit simulators, topics and tags, and courses; preview; publish | plain static pages: a home page, course pages, the simulators |
| Who | the lecturer, on their own machine | students, and the lecturer in class |
| Where | `npm run admin` → `http://127.0.0.1:5300/`, never deployed | any web server at any path (`materijali.online/simdeck/`), or a USB stick |
| Changes things | yes: it writes `sim.json`, `courses/*.json` and `tags.json` | no: nothing on it can edit anything, and it has one small search script |

The split keeps the published site simple. Search options, editing, selection and validation live in
the admin. Students and the projector get a folder of HTML pages with relative links, which can be
copied anywhere and opened from `file://`.

The files are the source of truth, and the admin is a convenience over them. Hand edits and admin edits
are interchangeable, and git keeps the history. "Publishing" means building the site folder; deploying
it (rsync to the VPS, copying to USB) is a separate step.

What it is for, in the owner's words:
- an index of everything, searchable, in the low hundreds;
- tags for where in the curriculum or in CS a simulator belongs;
- "playlists" for students: a small page per course with only the simulators chosen for it.

Example: *Linux Essentials* → DNS, DHCP, LVM and disk partitioning, at `materijali.online/linux`.
`courses/linux-essentials.json` is that example.

## 0. Owner decisions (2026-10-01)

- **Copy and adopt; never link out.** Everything simdeck lists lives in `sims/<id>/`. A simulator
  from `single-page-labs`, `ossimulator` or any other project is copied in and adopted, and from then on
  the simdeck copy is the one that gets fixed (proposal: copies are canonical). simdeck pages never link
  to other projects' sites.
  - **Exception (owner, 2026-10-02): ossimulator stays the source of truth** for its pages. simdeck imports
    its built single files (`dist-single/<page>.html`); fixes and translations go into ossimulator, and the
    builds are re-imported. Never edit those copies in simdeck beyond the import markers.
  - So there are no linked entries, no per-project logins on course pages, and no external
    dependencies on a USB stick: a published folder is complete.
  - This **supersedes** the proposal's and design notes' "linked entries" for ossimulator, cephsim,
    faultline and topologydrafter, and playbook §10.5. Each must be imported as a copy to appear here.
- **Short course addresses** (`materijali.online/linux`): one nginx rule per course. The address is set
  per course in the admin, when wanted, and the admin generates the rules (§4).
- **Course pages stand on their own.** They list only their simulators, and their one outward link is
  to the simdeck home page.
- **Croatian and English everywhere** (owner, 2026-10-01): every sim, the home page and the course pages, each in
  one file that carries both languages and switches (docs/sim-ui.md §9; §2.1, §3 here).

## 1. Layout

```
sims/<id>/                 one folder per simulator (the folder name is the id)
  sim.json                 its manifest entry (required)
  index.html               the page (required), started from kit/template; runs unbuilt from file://
  strings.js               every visible string, { hr, en } (docs/sim-ui.md §9)
  sim.js, sim.test.js      the model and its rule tests (kit template; npm test runs every sims/**/*.test.js)
  *.js, *.css              other local files the page includes; the build inlines them
  NOTES.md                 optional: decisions, deviations, timing (playbook §10.8)
courses/<course-id>.json   one file per course: the playlist (ordered sims, optional sections)
tags.json                  the controlled vocabulary: topics and tags
site.json                  site title, UI language, public URL, source link, server paths short addresses must avoid
LICENSE                    AGPL-3.0-or-later, the whole of simdeck (docs/tasks/w0/licence.md)
site/                      templates for the published pages (home, course page, licences) and core.mjs
  core.mjs                 search, grouping, links, renderers (both languages), nginx rules; build and admin
  lang.js                  the published pages' language switch (inlined into home and course pages)
admin/                     the admin app's page, script and styles
lib/manifest.mjs           loads and validates every manifest source (read side)
lib/store.mjs              validated writes for the admin (write side)
scripts/build.mjs          builds the published site
scripts/admin.mjs          the admin's local server
scripts/check.mjs          validates without building
scripts/short-links.mjs    prints the nginx rules for short course addresses (used by deploy.sh)
scripts/deploy.sh          publishes main to materijali.online/simdeck (docs/deploy.md)
scripts/server-setup.sh    one-time nginx and login setup (docs/deploy.md)
tests/                     node:test unit tests (one failing sample per rule), *.test.mjs
kit/                       the sim UI kit, template and page check (kit thread, docs/sim-ui.md; inlined at build, §7)
models/                    model code shared by several sims (models/README.md; inlined at build when a page includes it)
lib/models.mjs             checks the shared models and finds the ones a page includes
dist/                      default build output, not committed
```

The published folder:

```
index.html                 home: course links, then every finished simulator by topic, one search box
courses/<id>/index.html    one page per course
licences/index.html        simdeck's licence and source, the kit's third-party parts, every sim's "credits"
licences/AGPL-3.0.txt      LICENSE; licences/OFL-1.1.txt, the kit fonts' licence
source.tar.gz              the source of the same main commit (written by the deploy, not by the build)
sims/<id>/index.html       each finished simulator as one self-contained file
.simdeck-site              stamp: marks the folder as safe for the next build to replace
```

## 2. The manifest

There is no single manifest file. Each simulator carries its own `sim.json`, and the build and the
admin read them all together.

**Departure from the design notes**, which sketch one manifest:
- A page agent edits only its own folder (playbook §7.1 ownership).
- Parallel agents never conflict on a shared list.
- Adding or removing a simulator means adding or removing a folder.

### 2.1 Fields (`sims/<id>/sim.json`)

| Field | Required | Values | Used for |
|---|---|---|---|
| `id` | yes | kebab-case, equal to the folder name | URLs, course files, `related` |
| `class` | yes | `stepper`, `explorer`, `reference`, `tool` (playbook §10.4) | contract part; tools never go on course pages |
| `status` | yes | `ready`, `wip` | `wip` is not published (admin and its preview only) |
| `title` | yes | `{ "hr", "en" }`, each ≤ 60 chars | home and course pages, kit header |
| `concept` | yes | `{ "hr", "en" }`, each ≤ 80 chars: the one concept, as a phrase | second line on home and course pages, kit subtitle |
| `summary` | yes | `{ "hr", "en" }`, each ≤ 160 chars: what the student sees or does | course-page description; searched |
| `topic` | yes | one key of `tags.json` `topics` | grouping on the home page ("which part of CS") |
| `tags` | yes | ≥ 1 keys of `tags.json` `tags` | searched with their labels and aliases |
| `level` | yes | `intro`, `core`, `advanced` | metadata (admin); not shown on the site yet |
| `languages` | no | the **single-language exception**: `["hr"]` or `["en"]` for a page not translated yet; left out when the page has both (the rule). `<html lang>` must be one of the page's languages | counted as an exception; a language badge on home and course pages in the other language's view |
| `steps` | steppers | positive integer | demo length; the contract check compares it with the page (§7) |
| `aliases` | no | `{ "hr": [...], "en": [...] }`, either list optional: extra search words, synonyms, commands (`fdisk`) | search only (both languages are searched) |
| `related` | no | ids | reserved for "see also"; checked |
| `origin` | no | where a copy came from (`single-page-labs/x.html`, `ossimulator/scheduling`) | provenance |
| `asset_review` | no | `true` when assets need the GPL audit (playbook §10.7 step 6) | release audit |
| `credits` | no | third-party material in the sim (vendored library, CC BY text or figure, a font of its own): `[{ "what": { "hr", "en" }, "by": "…", "licence": "CC BY 4.0", "url"?: "https://…", "changes"?: { "hr", "en" } }]`; `licence` an SPDX id where one exists | the licences page (§3.4); the attribution on the page itself stays the sim's job |

Derived by the build, never written by hand:
- `path`: `sims/<id>/`;
- `courses`: the course files that list the sim.

Unknown fields are errors, so a typo never silently drops data.

Every text field is `{ "hr": …, "en": … }`, both non-empty: the site shows every sim in both languages, even a
single-language page (its title and summary are translated; the page itself carries the badge). A name that is the
same in both is written twice. `lang` is gone (bilingual, 2026-10-02): provenance stays in `origin`.

**Departure from the design notes:**
- `courses` is not written on each sim. The course file is the only source of order and membership.
- `kind`, `url`, `scenario` and `thumb` are gone, because every sim is in the repo (§0).
- Added: `concept`, `level`, `topic`, `status`, `aliases`, `class`, `steps`, `origin` and `asset_review`.
- Contract exceptions are not a `sim.json` field: they stay in the page, as the kit declares them (§7).

### 2.2 Example (`sims/dhcp-dora/sim.json`)

```json
{
  "id": "dhcp-dora",
  "class": "stepper",
  "status": "ready",
  "title": { "hr": "DHCP: DORA", "en": "DHCP: DORA" },
  "concept": { "hr": "Discover, Offer, Request, Acknowledge", "en": "Discover, Offer, Request, Acknowledge" },
  "summary": {
    "hr": "Četiri poruke kojima klijent bez adrese dobiva IP adresu, masku, gateway i DNS od DHCP poslužitelja.",
    "en": "The four messages in which a client without an address gets an IP address, mask, gateway and DNS from a DHCP server."
  },
  "topic": "networks",
  "tags": ["dhcp"],
  "level": "intro",
  "steps": 4,
  "aliases": { "hr": ["najam adrese"], "en": ["lease"] }
}
```

### 2.3 The vocabulary (`tags.json`)

```json
{
  "topics": { "networks": { "label": { "hr": "Računalne mreže", "en": "Computer networks" } }, "...": {} },
  "tags":   { "dns": { "label": { "hr": "DNS", "en": "DNS" }, "aliases": ["name resolution", "resolver"] }, "...": {} }
}
```

Labels are `{ "hr", "en" }`; tag `aliases` stay one list of search words in any language.

- **Topic:** exactly one per sim, the broad area (storage, OS, networks, security). It is what the
  home page groups by, and its order in `tags.json` is the group order.
- **Tags:** one or more per sim, the concepts (dns, lvm, deduplication). They drive search. A tag's
  `aliases` make it findable in both languages and by command name.
- **Courses:** curriculum placement is the third axis (§3.2), not a tag.

Tags are controlled: a sim may use only keys from `tags.json`, which stops drift like
backup/backups/sigurnosne kopije (playbook §10.6). Topics and tags are edited in the admin.

### 2.4 `site.json`

```json
{
  "title": "simdeck",
  "lang": "hr",
  "siteUrl": "https://materijali.online/simdeck/",
  "source": "source.tar.gz",
  "reservedPaths": ["simdeck", "singles", "ossim", "ceph", "faultline", "urm", "topologija"]
}
```

- `lang` is the language the home page opens in (a visitor's own choice wins, §3).
- `siteUrl` is where the site is deployed. It is used for printed URLs on course pages and for the
  nginx rules.
- `reservedPaths` are top-level paths already used on the server, so a course's short address can
  never take one of them.
- `source` is where every page's "Izvorni kod / Source code" link points (AGPL-3.0 §13): a path relative to the
  site root, by default `source.tar.gz`, the archive `scripts/deploy.sh` writes from the published `main` commit
  while the site sits behind basic auth; or an absolute URL, a public repo once there is one.

## 3. The published site

The published pages (home, course, licences) carry every text in both languages, as one `<span data-l="hr|en">` per language; their CSS
shows the spans of `html[lang]`. `site/lang.js` (inlined) picks the language the way the kit does in a sim
(docs/sim-ui.md §9.1): `?lang=`, else the visitor's last choice on any simdeck page, else the page's default. The
language button switches without a reload and remembers the choice; links to sims and to the home page carry
`?lang=`. Without script a page reads in its default language.

### 3.1 Home page (`index.html`)

- **Title** and the **language button**, then **links to every course page**.
- **One search box:**
  - focused on load, and `/` focuses it again;
  - every word must match, and case and Croatian diacritics are ignored;
  - it searches title, id, concept, summary, tag labels and aliases, topic, and the sim's aliases, **in both
    languages**, whichever the page shows.
    The build writes these words into each item, so the page's script only shows and hides list items.
  - `Enter` opens the first match and `Esc` clears the search. In class: `/`, `dhcp`, Enter.
- **Every finished simulator, grouped by topic:** one line each, with title and concept.
- **Tools** are listed under their topic (e.g. "Alati za nastavu"), because the lecturer opens them in
  class. They never appear on course pages.
- **`wip` sims are not published at all:** no list item and no page.
- **Nothing finished yet:** the home page says "Još nema objavljenih simulatora." / "No simulators published yet."
  instead of an empty list.
- Opens in `site.json` `lang`.
- No filters, toggles, stored state or data blobs. Those are admin features.

### 3.2 Course pages: the playlists (`courses/<id>/index.html`)

```json
{
  "id": "linux-essentials",
  "title": { "hr": "Linux Essentials", "en": "Linux Essentials" },
  "term": { "hr": "Simulatori uz predavanja", "en": "Simulators for the lectures" },
  "lang": "hr",
  "intro": { "hr": "Kratki simulatori koje koristimo na predavanjima. …", "en": "Short simulators we use in the lectures. …" },
  "short": "linux",
  "sections": [
    { "title": { "hr": "Mreža", "en": "Networking" }, "sims": ["dns-resolution", "dhcp-dora"] },
    { "title": { "hr": "Diskovi i pohrana", "en": "Disks and storage" }, "sims": ["disk-partitioning", "lvm-topology"] }
  ]
}
```

- `sections` keeps the order. Use one section without a title for a flat list, or one per lecture
  or week.
- The `id` is the page's address: `materijali.online/simdeck/courses/linux-essentials/`.
- `short` (optional) adds `materijali.online/linux` through an nginx rule (§4).
- `title`, `term`, `intro` and section titles are `{ "hr", "en" }`. `lang` is the language the page opens in for a
  new visitor (a visitor's own choice wins); its sims are linked with `?lang=` in that language, and the links
  follow the language button.

The page:
- is standalone: its simulators, plus one link back to the simdeck home page;
- has no script except a print button and the language switch (`site/lang.js`);
- is readable on a phone;
- prints on one A4 sheet, in the language shown, with the short address under the title and each simulator's full
  URL (with `?lang=` when that is not the site's default language), so a printed or PDF copy still works;
- numbers its items across sections;
- shows a language badge on a single-language sim (§2.1 `languages`) in the other language's view.

Tools and unknown ids in a course file are errors. Unfinished sims give a warning and are left off the
page until they are `ready`, so a course can list a simulator before it is done. A course with nothing ready yet
still gets its page, saying "Simulatori za ovaj kolegij su u pripremi.", so its address works from day one. The admin's
preview builds with drafts and shows everything.

### 3.3 Licence and source on every page

simdeck is AGPL-3.0-or-later (`LICENSE`). Every published page offers its source and names the licence:
- the home page's footer and each course page's footer: `simdeck · AGPL-3.0-or-later · Izvorni kod / Source code ·
  Licence / Licences` (licence text, `site.json` `source`, the licences page);
- each sim: the same line at the foot of the kit's shortcuts dialog (`?`), from a `#simdeck-site` block the build
  writes (`{ licence, source, licences }`, as seen from `sims/<id>/`; unbuilt, the kit falls back to the same
  paths).

### 3.4 Licences page (`licences/index.html`)

Generated by the build, in both languages: simdeck's own licence and source; the kit's third-party parts
(`KIT_CREDITS` in `site/core.mjs`: the Atkinson Hyperlegible fonts, OFL-1.1, `kit/fonts/OFL.txt`); then, per
published sim, its `sim.json` `credits` (§2.1). The licence texts are copied next to it.

## 4. The admin

`npm run admin`, then open `http://127.0.0.1:5300/`. Options: `--port`, `--root <repo>` (edit another
checkout or a scratch copy), and `--host` (default 127.0.0.1). The admin has no login; to reach it
from another machine, use an SSH tunnel.

- **Simulatori:**
  - a searchable list with a status filter;
  - a form per sim: title, concept and summary (an HR and an EN field each), status, class, steps, topic, tags
    (checkboxes), level, the page's languages (both, or the single-language exception), aliases per language,
    origin, asset review;
  - **+ Novi simulator** creates `sims/<id>/`: it runs `kit/new-sim.sh` to copy the kit's template
    (`index.html`, `sim.js`, `sim.test.js`), fits the page to the form (`<html lang>`, title, subtitle from
    the concept, `#simdeck-meta`), and writes `sim.json` (status `wip` by default);
  - each sim shows which courses list it;
  - deleting or renaming a sim means changing its folder by hand; git keeps it.
- **Kolegiji:**
  - create a course, then edit its id (= address), **short address**, title, subtitle and intro (HR and EN),
    and the language it opens in;
  - sections: add, rename, reorder and remove;
  - add simulators by typing in a section's search box (Enter adds the first match; tools are never
    offered), and reorder or remove them;
  - unfinished and invalid items are flagged in place;
  - **Pregled** previews the course page, including unfinished sims.
- **Teme i oznake:** edit topic and tag labels (HR and EN) and tag aliases, see how many sims use each, and add or
  remove. Removing one in use is refused.
- **Objava:**
  - **Pregled (s nedovršenima)** previews the whole site;
  - **Objavi** builds the site into a folder: by default `dist/`, or any path, such as a USB stick
    (`/media/usb/simdeck`);
  - **Kratke adrese (nginx)** lists one rule per course with a short address, ready to paste into
    the materijali.online server block:
    ```nginx
    location ~ ^/linux/?$ { return 302 /simdeck/courses/linux-essentials/; }  # Linux Essentials
    ```
  - all validation errors and warnings are listed, and the header shows their count on every tab.

Every save is validated before it is written. The change is applied to an in-memory copy of all the
manifest files, and it is written only if it adds no new error (`lib/store.mjs`). A refused save shows
the reasons and changes nothing on disk.

Saves write the same JSON as hand edits, with a stable field order. Writes are accepted only as
same-origin JSON from the admin's own page.

## 5. Build

`node scripts/build.mjs [--out <dir>] [--drafts]` (or `npm run build`; the admin's Objavi does the
same). `npm run check` validates only, and `npm test` runs the unit tests.

1. Load and validate every manifest source (§6) and the shared models (`lib/models.mjs`). Any error stops the
   build before the output folder is touched.
2. **Output folder safety:** the build replaces a folder only if it is empty, new, or carries the
   `.simdeck-site` stamp from an earlier build. It never empties a folder of someone else's files (a
   USB stick's root, say).
3. For each finished sim, produce one self-contained file:
   - inline local `<script src>` and `<link rel=stylesheet>`: files in the sim's folder, and the kit
     (`../../kit/kit.css`, `../../kit/kit.js`, as kit/template links them), and the shared models the page
     includes (`../../models/<name>.js`, `models/README.md`); nothing else outside the folder;
   - turn relative `url(...)` in inlined CSS into `data:` URIs (the kit's fonts, about 70 KB);
   - replace the page's `#simdeck-meta` placeholder with one generated from `sim.json` (or add one);
   - refuse anything loaded from the network (scripts, styles, images, frames, CSS `url()`).
     Ordinary `<a href>` links are allowed.
4. Write the home page and the course pages, the licences page and the licence texts (§3.4). Each built sim
   also gets the `#simdeck-site` block with its licence and source links (§3.3).

`--drafts` (used by the admin's preview) also includes `wip` sims.

All links are relative and name `index.html` explicitly, so the folder works at any URL path and from
`file://`. Because every simulator is copied in (§0), a published folder on a USB stick works
completely offline.

A built sim is about 130 KB (kit CSS and JS, fonts, the page and its model). The kit's own browser check,
`npm run check:page -- dist/sims/<id>/index.html`, passes on the built file as on the source.

**Tooling: Node ≥ 22.12 (the kit's floor) and its standard library.** The build, the check and the admin need no
packages. The only dev dependency is the kit's Playwright, for page checks. The build takes well under a
second, and the admin server is about a hundred lines on `node:http`.

**Departure from playbook §10.9**, which recommends Vite + vite-plugin-singlefile:
- The frame needs no bundler.
- Vite earns its place only if sims are written in TypeScript or as ES modules that import each other.
  That is the kit and template thread's decision. If it takes it, only `buildNative` in
  `scripts/build.mjs` changes: the input (`sims/<id>/` with its `index.html`) and the output (one file
  with `#simdeck-meta`) stay the same.
- Playwright (for the contract's 1920×1080 checks) is the contract check's dev dependency, not the
  frame's.

**Importing from other projects (§0).** Copying a page in is the import step, and the build's inliner
sets the limits:
- **`single-page-labs`:** pages are already single files.
- **`ossimulator`:** pages have a single-file build per page (made for Moodle); that output is what
  gets copied.
- **Multi-file apps (cephsim, faultline, topologydrafter):** these work if their scripts are classic
  scripts or import-free modules, kept in subfolders of `sims/<id>/`.
- **ES modules that `import` each other** are not bundled yet. Such an app needs a bundling step,
  run once at import time or added to `buildNative`.

## 6. Checks

`lib/manifest.mjs` (run by check, build, admin saves and tests):
- **Sims:**
  - required fields per class;
  - no unknown fields;
  - kebab-case ids equal to the folder name;
  - every folder under `sims/` has a `sim.json` and an `index.html`;
  - `title`, `concept`, `summary` in both languages (each within its length), `aliases` per language;
  - `languages` only as the single-language exception (counted, as a warning); `<html lang>` is one of the
    page's languages;
  - topic and tags exist in `tags.json`, with no duplicate tags;
  - length limits on title, concept and summary;
  - `steps` on steppers, and only there;
  - `related` ids exist;
  - in the page: `data-sim` on `<html>` equals the id; `#simdeck-exceptions` is `[{rule, why}]` (counted, as
    a warning); a stale `#simdeck-meta` placeholder (id, class, steps, title, concept differ from `sim.json`) gives
    a warning.
- **`tags.json`:** every topic and tag label in both languages.
- **Courses:**
  - id = file name;
  - only known fields;
  - `title` (and `term`, `intro`, section titles when given) in both languages; `lang` is `hr` or `en`;
  - non-empty sections;
  - only existing ids, no tools, no duplicates;
  - `short` is kebab-case, unique across courses, and not in `site.json` `reservedPaths`;
  - `wip` gives a warning.

`lib/models.mjs` (run by check, build and the gate; `models/README.md`):
- every `models/<name>.js` has the licence header, its `models/<name>.test.js` and a `models/CHANGELOG.md` line;
- it is pure (no DOM, storage, clock, timers or `Math.random`) and loads both as a page script
  (`SimdeckModels[<name>]`) and under node (`module.exports`), to the same object;
- every model a sim page includes exists.

`scripts/build.mjs`:
- local includes exist and stay inside the sim's folder, the kit or `models/`;
- nothing is loaded from the network;
- the output folder is safe to replace.

Each rule has a test that feeds it a bad sample (`tests/`). The admin's write side has its own tests:
valid saves land in the hand-edit format, and invalid ones leave the disk unchanged.

Left to the kit's page check (`kit/tools/check-page.mjs`, which the gate `npm run gate -- <id>` runs on the
built file, docs/tasks/COMMON.md §7): fit at 1920×1080, text size, clicker keys, themes,
and the step count the page mounts against `#simdeck-meta` `steps`; per language, the string tables and that every
visible word comes from them (docs/sim-ui.md §9.6). `tests/site-lang.test.mjs` switches a built home and course
page in the browser.

## 7. Where the frame meets the kit (reconciled with docs/sim-ui.md, kit 0.1.0)

The kit (`kit/`, docs/sim-ui.md §7) and the frame agree on the following. Items the frame cannot fix alone are
listed at the end for the kit.

1. **The page loads the kit itself.** A sim page links `../../kit/kit.css` and `../../kit/kit.js` (kit/template
   does, and `new-sim.sh` computes the paths), so it runs unbuilt from `file://`. The build inlines exactly
   those two files and the fonts `kit.css` refers to; there is no build-only marker.
2. **`#simdeck-meta`: sim.json is the source, the page holds a placeholder.** The template's in-page block stays
   (unbuilt, the kit takes the title and concept from it and reads `id`, `class` and `steps` to warn on a
   mismatch). The build replaces it with
   one generated from `sim.json`:
   ```json
   {"id":"dhcp-dora","title":{"hr":"DHCP: DORA","en":"DHCP: DORA"},"concept":{"hr":"…","en":"…"},"summary":{"hr":"…","en":"…"},"tags":["dhcp"],"class":"stepper","steps":4}
   ```
   (plus `languages` for a single-language page). The kit shows `title` and `concept` in the page's language.
   The admin and `new-sim.sh` write the same block when they create a sim. The check warns when the
   placeholder's `id`, `class`, `steps`, `title` or `concept` drift from `sim.json`. `kind`, `path` and `courses` from the template's placeholder are not
   frame fields (§2.1); the build drops them.
3. **`data-sim` on `<html>` equals the id.** The check enforces it; `new-sim.sh` sets it.
4. **Exceptions stay in the page**, in `#simdeck-exceptions` as `[{"rule", "why"}]` (the kit's choice, playbook
   §10.2). The frame dropped its `sim.json` field, validates the block and counts the exceptions.
5. **The index is `<site root>/index.html`**, which matches the template's back link (`../../index.html` from
   `sims/<id>/`) and `INDEX` in `new-sim.sh`, both unbuilt (repo root) and built (`dist/`).
6. **Back link.** The kit goes back in history when the visitor came from the index, and otherwise follows the link to
   the home page.
7. **Deep links.** The kit opens `?preset=<id>&step=<n>`. Course pages link plain sim pages for now; a course
   item could name a preset later without changing the kit.
8. **Steps.** `sim.json` `steps` is what the frame records; the kit compares it with what the page mounts.
9. **Offline.** The build refuses network loads; the kit bundles its fonts, so built sims are complete files.
10. **Look.** The home and course pages keep their own small CSS (`site/index.css`, `site/course.css`). They
    could take the kit's tokens and font later; not needed for the frame to work.

**For the kit to change (not edited from the frame):**
- **Template `#simdeck-meta` placeholder:** replace `courses`, `kind`, `path` and `"tags": ["template"]` with the
  frame's fields (§2.1), or keep only `id`, `class` and `steps`; `new-sim.sh` can then drop its `path` and `tags`
  rewrites.
- **`new-sim.sh` does not write `sim.json`:** a sim made with it alone fails `npm run check` until one is
  added. Either write a `status: "wip"` stub, or print "now create sim.json (or use `npm run admin`)".
- **Back link from a course page:** go back in history also when the referrer is a simdeck course page
  (`…/courses/<id>/`), so a student returns to their course page instead of the home page.
- **docs/sim-ui.md §7 table:** record the resolutions above (meta generated from `sim.json` at build,
  exceptions stay in the page, index at the site root confirmed), and §8: the single-file build now exists.

## 8. How to …

Everything below can be done in the admin, or by editing the files and running `npm run check`.

- **Add a simulator:**
  1. Simulatori → **+ Novi simulator**.
  2. Replace the template's model (`sim.js`), rule tests (`sim.test.js`) and page content (docs/sim-ui.md §6), then
     `npm run gate -- <id>`.
  3. Set its status to `ready` when it passes its DoD.
- **Adopt one from another project:**
  1. Create it as above, then copy the page (and its local files) into `sims/<id>/`.
  2. Set `origin`.
  3. Follow playbook §10.7: classify, adapt to the kit, record exceptions, freeze the original, check
     assets.
- **Make a course page:**
  1. Kolegiji → **+ Novi kolegij**, choose the id and optionally a short address, and add simulators.
  2. Check it with **Pregled**.
  3. Objava → **Objavi**.
- **Give a course a short address:** set **kratka adresa** on the course and merge to main; `npm run deploy`
  installs the nginx rule (docs/deploy.md). The Objava tab shows the rules for review.
- **Publish:**
  - to materijali.online: merge to main, then `npm run deploy` (it builds main, not the working copy);
  - to a USB stick or any folder: Objava → **Objavi** (builds the working copy).

## 9. Open questions

- **UI language.** The published site and every sim are in Croatian and English (§0). The admin stays in
  Croatian: it is the lecturer's own tool and is never published (docs/tasks/OPEN.md).
- **Level scale.** `intro`/`core`/`advanced` is a guess, and the site does not show it yet.
- **Topics.** The 9 topics in `tags.json` are a first cut, and should be revisited against
  docs/catalogue.md.
- **Multi-file imports.** cephsim, faultline and topologydrafter may need a one-time bundling step to
  become simdeck sims (§5).
