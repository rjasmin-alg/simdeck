# simdeck: site structure

The site frame is the container that holds every simulator. It covers four things: where each simulator
lives, how it declares itself (the manifest), the lecturer's index, and the course pages students get.
This document is the source of truth for the manifest format and the build; `lib/manifest.mjs` enforces it.

What it is for, in the owner's words: an index of everything, searchable, in the low hundreds; tags
for where in the curriculum or in CS a simulator belongs; and "playlists" for students, a small page
per course with only the simulators chosen for it. Example: *Linux Essentials* → DNS, DHCP, LVM and
disk partitioning, at a short link for the class. `courses/linux-essentials.json` is that example, built.

## 1. Layout

```
sims/<id>/                 one folder per native simulator (the folder name is the id)
  sim.json                 its manifest entry (required)
  index.html               the page (required)
  *.js, *.css              local files the page includes; the build inlines them
  thumb.svg|png|webp       optional thumbnail for the index (at most one)
  NOTES.md                 optional: decisions, deviations, timing (playbook §10.8)
linked/<collection>.json   arrays of linked entries, one file per source collection
linked/thumbs/             optional thumbnails for linked entries
courses/<course-id>.json   one file per course: the playlist (ordered sims, optional sections)
tags.json                  the controlled vocabulary: topics and tags
site.json                  site title, UI language, deploy URLs
site/                      the frame itself: index, handout and course-page templates, CSS, JS
  core.js                  search, grouping, links and the handout renderer, used by the build and the browser
lib/manifest.mjs           loads and validates every manifest source
scripts/build.mjs          builds dist/
scripts/check.mjs          validates without building
tests/                     node:test unit tests (one failing sample per rule)
kit/                       the shared in-sim kit (kit thread; inlined at build time, see §7)
dist/                      build output, not committed
```

Build output:

```
dist/index.html                    the lecturer's index
dist/handout.html                  ad-hoc handout from a selection in the index
dist/courses/<id>/index.html       one page per course
dist/sims/<id>/index.html          each native sim as one self-contained file (+ its thumbnail)
dist/manifest.json                 the merged, validated manifest, for other tools
```

Every page in `dist/` opens from `file://`: the index and handout carry their data inline, and
links name `index.html` explicitly. Opening `dist/index.html` from a USB stick in a lecture works.

## 2. The manifest

There is no single manifest file. Each native simulator carries its own `sim.json`, linked entries
sit in `linked/*.json`, and the build merges them all into `dist/manifest.json`.

**Departure from the design notes**, which sketch one manifest: one file per simulator means a page
agent edits only its own folder (playbook §7.1 ownership), parallel agents never conflict on a shared
list, and adding or removing a simulator is adding or removing a folder. With hundreds of entries, a single
file would be the most-conflicted file in the repo.

### 2.1 Fields

| Field | Required | Values | Used for |
|---|---|---|---|
| `id` | yes | kebab-case, unique across native and linked; for native = folder name | URLs, course files, `related` |
| `kind` | yes | `native` (under `sims/`) or `linked` (under `linked/`) | link building; contract applies to native only |
| `class` | yes | `stepper`, `explorer`, `reference`, `tool` (playbook §10.4) | contract part; filter; tools never reach course pages |
| `status` | yes | `ready`, `wip` | `wip` shows dashed in the index and is left off course pages |
| `title` | yes | ≤ 60 chars | card title, kit header, handout line |
| `concept` | yes | ≤ 80 chars: the one concept, as a phrase | second line on cards and handouts |
| `summary` | yes | ≤ 160 chars: what the student sees or does | card and handout description; searched |
| `topic` | yes | one key of `tags.json` `topics` | grouping by area ("which part of CS") |
| `tags` | yes | ≥ 1 keys of `tags.json` `tags` | filter chips; searched with their labels and aliases |
| `level` | yes | `intro`, `core`, `advanced` | filter, badge |
| `lang` | yes | `hr`, `en`; must equal the page's `<html lang>` | filter, badge on handouts when it differs from the course |
| `steps` | native steppers | positive integer | badge ("6 koraka"); makes a long demo visible |
| `aliases` | no | extra search words: synonyms, the other language, commands (`fdisk`) | search only |
| `related` | no | ids | reserved for "see also"; checked |
| `exceptions` | no | `[{ "rule": "...", "why": "..." }]` | declared contract exceptions; the check counts them |
| `origin` | no | where an import came from (`single-page-labs/x.html`) | provenance for imports |
| `asset_review` | no | `true` when assets need the GPL audit (playbook §10.7 step 6) | release audit |
| `url` | linked | site-absolute (`/ossim/...`, resolved against `site.json` `linkedBase`) or `https://` | the link |
| `scenario` | linked, optional | an ossimulator public scenario id | appended as `?scenario=` |
| `thumb` | linked, optional | file name in `linked/thumbs/` | card image |

Derived by the build, never written by hand:
- `path` (native): `sims/<id>/`;
- `thumb` (native): whichever `thumb.*` is in the folder;
- `courses`: the course files that list the entry.

Unknown fields are errors, so a typo never silently drops data.

**Departure from the design notes on `courses`:** the sketch puts `courses` on each entry, and a separate
course file holds the ordered list. Keeping both means two places to keep in sync. Here the **course
file is the only source**: it has the order and the sections, and each entry's `courses` is derived
from it, so the index can still filter and group by course.

Added to the sketch:
- `concept`, `level`, `topic`, `status` and `aliases`, for the index and search;
- `class`, `steps` and `scenario`, from playbook §10.6;
- `exceptions`, `origin` and `asset_review`, from playbook §10.2 and §10.7.

### 2.2 Example: a native entry (`sims/dhcp-dora/sim.json`)

```json
{
  "id": "dhcp-dora",
  "kind": "native",
  "class": "stepper",
  "status": "ready",
  "title": "DHCP: DORA",
  "concept": "Discover, Offer, Request, Acknowledge",
  "summary": "Četiri poruke kojima klijent bez adrese dobiva IP adresu, masku, gateway i DNS od DHCP poslužitelja.",
  "topic": "networks",
  "tags": ["dhcp"],
  "level": "intro",
  "lang": "hr",
  "steps": 4,
  "aliases": ["lease", "najam adrese"]
}
```

### 2.3 Example: linked entries (`linked/ossimulator.json`)

One entry per ossimulator page, not one for the app, as playbook §10.5 recommends. Several entries may
point at one page with different scenarios:

```json
[
  { "id": "os-scheduling-rr4", "kind": "linked", "class": "explorer", "status": "ready",
    "title": "Raspoređivanje: Round Robin (q = 4)", "concept": "...", "summary": "...",
    "topic": "os", "tags": ["scheduling"], "level": "core", "lang": "hr",
    "url": "/ossim/modules/scheduling/index.html", "scenario": "stallings-rr4" }
]
```

A `single-page-labs` page that is not imported yet can be listed as a linked entry pointing at
`/singles/...`, so it is in the index from day one (here: `lvm-topology-lab`). When it is imported,
delete the linked entry and add `sims/<id>/` with the same id. Course files keep working unchanged.

### 2.4 The vocabulary (`tags.json`)

```json
{
  "topics": { "networks": { "label": "Računalne mreže" }, "...": {} },
  "tags":   { "dns": { "label": "DNS", "aliases": ["name resolution", "resolver"] }, "...": {} }
}
```

Two levels, on purpose:
- **Topic:** exactly one per entry, the broad area (storage, OS, networks, security). It is what the index
  groups by. The order in `tags.json` is the group order.
- **Tags:** one or more per entry, the concepts (dns, lvm, deduplication). They drive the filter chips
  and search.
- Curriculum placement is the third axis, and it is the **courses** (§4), not a tag.

Tags are controlled: an entry may use only keys from `tags.json`. This stops drift like
backup/backups/sigurnosne kopije (playbook §10.6). A tag's `aliases` make it findable in both
languages and by command name. Adding a tag is a one-line change to `tags.json`, owned by the
coordinator.

## 3. The index (lecturer mode)

`dist/index.html`. It is built for opening a demo on the fly, from the lectern, in a few keystrokes.

- **Search:**
  - focused on load, and `/` focuses it again;
  - every word must match (AND), across title, id, concept, summary, tag labels and aliases, topic,
    and the entry's own aliases;
  - case and Croatian diacritics are ignored (`cvor` finds `čvor`);
  - ranking: title word prefix > title substring > id > tags/aliases > topic > text, then natural
    title order.
- **Keys:**
  - `↑`/`↓` move the highlight and `Enter` opens it (the first result if nothing is highlighted), so
    typing `dhcp` and pressing Enter opens the DHCP demo;
  - `Ctrl+Enter` opens in a new tab (linked entries always do);
  - `+` adds the highlighted entry to the handout;
  - `Esc` clears the search.
- **Filters:**
  - tag chips (AND); only the 14 most-used show, the rest are behind "više";
  - course, level, class, language.
- **Grouping:** by topic (default), by course (an entry on several courses appears under each, and
  the rest go under "Nije ni na jednom kolegiju"), or none.
- **View:** cards (with thumbnail, concept, summary and badges) or a one-line list for scanning
  hundreds.
- **State in the URL hash** (`#q=dns&tags=lvm&group=course&view=list`): a filtered view can be
  bookmarked, and a sim's back link (`#sim=<id>`) returns to the index with that entry highlighted.
- **Scale:** tested with 258 entries: a 107 KB page, about 80 ms to load and instant filtering. Data is
  inlined, with no fetch.
- **Thumbnails:** the index shows the optional `thumb.*`. Without one, it shows a coloured tile with
  initials, coloured by topic. Generating thumbnails from screenshots is a later script (Playwright),
  not part of this skeleton.

The index shows everything, including `tool` and `wip` entries; it is the lecturer's own page.

## 4. Course pages and quick handouts (student mode)

### 4.1 Course pages: the playlists

A course file is the playlist:

```json
{
  "id": "linux-essentials",
  "title": "Linux Essentials",
  "term": "Simulatori uz predavanja",
  "lang": "hr",
  "intro": "Kratki simulatori koje koristimo na predavanjima. …",
  "sections": [
    { "title": "Mreža", "sims": ["dns-resolution", "dhcp-dora"] },
    { "title": "Diskovi i pohrana", "sims": ["disk-partitioning", "lvm-topology-lab"] }
  ]
}
```

- `sections` keeps the order. Use one section without a title for a flat list, or one per lecture or
  week.
- Native and linked entries mix freely.

The build makes `dist/courses/<id>/index.html`, which is deployed as
`materijali.online/simdeck/courses/linux-essentials/`. The page:
- is static, with no script (only a print button), and readable on a phone;
- prints on one A4 sheet with each link's full URL under it, so a printed or PDF handout still works;
- numbers its items across sections;
- marks linked entries with ↗, and adds a footnote that they may ask for a separate login (§8);
- shows a language badge on an entry whose language differs from the course's.

The check refuses tools and unknown ids in course files. It warns about `wip` entries and leaves them
off the page, so a course file can list a simulator before it is finished.

**Short links** like `materijali.online/linux` are a one-line nginx `location`/`return 302` per course
on the VPS. That is a deploy decision, not a build one (§8).

### 4.2 Quick handouts: on the fly

In the index:
1. Press `+` on any entries.
2. A tray appears at the bottom. Give the handout a title, then:
   - **Otvori izroček** opens `handout.html#title=…&ids=a,b,c`: the same renderer and the same look as
     a course page. The link can be shared or printed straight away.
   - **Kopiraj kao kolegij (JSON)** copies a ready course file. Save it as `courses/<id>.json` to make
     the playlist permanent.

The selection is kept in `localStorage`, as a convenience only. The handout leaves out tools and
unfinished entries and names them on screen, not in print.

## 5. Build

`node scripts/build.mjs` (or `npm run build`). `npm run check` validates only, and `npm test` runs the
unit tests.

1. Load and validate every manifest source (§6). Any error stops the build before `dist/` is touched.
2. For each native sim, produce one self-contained file:
   - inline local `<script src>` and `<link rel=stylesheet>` (files must be inside the sim's
     folder);
   - replace the kit marker with the kit;
   - add the `#simdeck-meta` block;
   - refuse anything loaded from the network (scripts, styles, images, frames, CSS `url()`).
     Ordinary `<a href>` links are allowed.
3. Write the index and the handout (with data, `core.js` and their script inlined), the course pages
   and `manifest.json`.

**Tooling: Node ≥ 20 and its standard library, nothing else.** There is no `npm install` and no
`node_modules`, and the build takes well under a second.

**Departure from playbook §10.9**, which recommends Vite + vite-plugin-singlefile:
- The frame needs no bundler. The index and course pages are generated HTML from JSON, and native sims
  are HTML plus local files.
- Vite earns its place only if sims are written in TypeScript or as ES modules that import each other.
  That is the kit and template thread's decision. If it takes it, only `buildNative` in
  `scripts/build.mjs` changes: the input (`sims/<id>/index.html` and its folder) and the output
  (one file in `dist/sims/<id>/index.html` with `#simdeck-meta`) stay the same.
- Playwright (for the contract's 1920×1080 fit and text-size checks) is a dev dependency that the contract
  check will need. It is not needed by the frame.
- Current limitation: an ES module that `import`s a sibling file is not bundled. The import stays as
  written and fails from `file://`. Classic scripts and import-free modules are fine.

## 6. Checks

`lib/manifest.mjs` (run by check, build and tests):
- **Entries:**
  - required fields per kind and class;
  - no unknown fields;
  - linked-only fields only on linked entries;
  - kebab-case ids, unique across native and linked;
  - native id = folder name, and every folder under `sims/` has a `sim.json` and an `index.html`;
  - `<html lang>` = `lang`;
  - at most one thumbnail;
  - topic and tags exist in `tags.json`, with no duplicate tags;
  - length limits on title, concept and summary;
  - `steps` on native steppers, and only there;
  - `exceptions` well formed;
  - linked `url` is site-absolute or https, the scenario is not hidden in the URL, and a named `thumb`
    exists.
- **Courses:**
  - `related` ids exist;
  - course id = file name;
  - only known fields;
  - non-empty sections;
  - only existing ids, no tools, no duplicates;
  - `wip` gives a warning.

`scripts/build.mjs`:
- local includes exist and stay inside the sim's folder;
- one kit marker at most;
- the page does not define `#simdeck-meta` itself;
- nothing is loaded from the network.

Each rule has a test that feeds it a bad sample (`tests/manifest.test.js`, `tests/build.test.js`).
Two checks were broken on purpose, and the tests caught both.

Not checked here, and left to the contract check from the kit thread:
- fit at 1920×1080;
- text size;
- clicker keys;
- the page's real step count against `steps`;
- whether linked URLs are reachable (deploy time, playbook §10.5);
- whether ossimulator scenario ids exist in its `PUBLIC_SCENARIOS`.

## 7. Where the frame meets the kit (to reconcile with the kit/template thread)

These are the frame's choices. The kit thread may propose changes, and anything below can move as long as
both sides agree.

1. **Kit inlining.**
   - The source page puts `<!-- simdeck:kit -->` in its `<head>`, once.
   - The build replaces it with `kit/kit.css` (as `<style data-simdeck-kit>`) and `kit/kit.js` (as
     `<script data-simdeck-kit>`), whichever exist.
   - Until `kit/` exists, the marker is removed and the build warns.
   - The kit may rename or add files: tell the coordinator, and `loadKit()` changes in one place.
2. **`#simdeck-meta`.** The build adds this to every native page:
   ```html
   <script type="application/json" id="simdeck-meta">
     {"id":"dhcp-dora","title":"DHCP: DORA","concept":"…","class":"stepper","lang":"hr","steps":4,
      "index":"../../index.html#sim=dhcp-dora"}
   </script>
   ```
   The kit header reads `title` (and may show `concept`) from here, so the title is written once, in
   `sim.json`. A page must not define this block itself.
3. **Back to the index.**
   - The kit header's back link uses `meta.index`, so it returns to the index with this entry
     highlighted.
   - Recommendation: when `document.referrer` is a simdeck course page, use `history.back()`, so a
     student goes back to their course page rather than to the lecturer's index.
   - Opened standalone (a single file from Moodle), `meta.index` leads nowhere useful, and the kit may hide
     the link when `location.protocol === 'file:'` and the target is missing.
4. **What the template must fill.** A new sim folder from the template ships:
   - a `sim.json` with every required field (§2.1), with `status: "wip"` until it is done;
   - an `index.html` with `<html lang>` equal to `lang`, a `<title>` and the kit marker.
   Changing `status` to `ready` is the last step of the per-page DoD (playbook §8).
5. **Exceptions are declared in `sim.json` `exceptions`**, not in an in-page JSON block (playbook §10.2
   allows either). That keeps all declarations in one machine-read place, and the build counts them. The
   contract check reads them from the manifest.
6. **`steps`** in `sim.json` is what the index shows. The contract check should compare it with the
   step count the page's controller reports.
7. **Offline:** the build already refuses network loads in native pages. The kit must not load fonts or
   scripts from a CDN.
8. **Thumbnails:** `thumb.svg|png|webp` in the sim folder, displayed at about 84×84 px. A screenshot script
   can write `thumb.png` later.
9. **Look:** the index and course pages have their own small CSS (`site/index.css`, `site/handout.css`).
   Once the kit's colour tokens exist, these should use them, so the frame and the sims look like one
   product.

## 8. How to …

**Add a native simulator**
1. Create `sims/<id>/` with `sim.json` and `index.html`; later, copy the kit thread's template.
2. Run `npm run check`, fix what it says, then `npm run build` and open `dist/index.html`.
3. If it needs a new tag or topic, add it to `tags.json` (coordinator-owned).

**Add a linked entry:** append it to the right `linked/<collection>.json`, or create a new collection
file, then check.

**Make a course page:** write `courses/<id>.json` (or build the selection in the index and use "Kopiraj kao
kolegij"), then build. The page is at `dist/courses/<id>/index.html`.

**Import a `single-page-labs` page:**
1. Follow playbook §10.7.
2. If it was listed as a linked entry, remove that entry and keep the same id for the native folder.
3. Set `origin`.

## 9. Open questions

- **UI language.** The index and course pages are in Croatian, following playbook §10.9 and ossimulator.
  All strings are in `STR` in `site/core.js`, in `site/index.html` and in `site/handout.html`. A second
  language would need those moved into one dictionary.
- **Short course URLs.** `materijali.online/linux` needs one nginx rule per course, or one rule
  `/k/<id>` → `/simdeck/courses/<id>/`. Which form, and who adds them?
- **Logins.** `/ossim` uses its own realm, while `/singles` and `/ceph` share another. A course page
  that mixes them asks students for two logins; the page has a footnote for now. Decide before M4
  (playbook §10.5).
- **Student access to the full index.** Course pages do not link to the index, which also lists
  lecturer tools. Should students get a read-only index without tools?
- **Thumbnails.** Generate them from screenshots (Playwright, 1920×1080 → 168×168), or leave them hand-made?
- **Level scale.** `intro`/`core`/`advanced` is a guess. Does it match how courses are labelled?
- **Topics.** The nine topics in `tags.json` are a first cut for the placeholders and the first batch,
  and should be revisited once docs/catalogue.md exists.
