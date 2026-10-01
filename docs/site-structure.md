# simdeck: site structure

simdeck has two sides, built from the same files:

| | **Admin** (editorial) | **Site** (published) |
|---|---|---|
| What | a local web app: edit simulators, topics and tags, and courses; preview; publish | plain static pages: a home page, course pages, the simulators |
| Who | the lecturer, on their own machine | students and the lecturer in class |
| Where | `npm run admin` → `http://127.0.0.1:5300/`, never deployed | any web server at any path (`materijali.online/simdeck/`), or a USB stick |
| Changes things | yes: it writes `sim.json`, `linked/*.json`, `courses/*.json` and `tags.json` | no: nothing on it can edit anything, and it has one small search script |

The point of the split is to keep the published site simple. Search options, editing, selection and
validation all live in the admin. What students and the projector get is a folder of HTML pages with
relative links, so it can be copied anywhere and opened from `file://`.

The files are the source of truth. The admin is a convenience over them: hand edits and admin edits
are interchangeable, and git keeps the history. "Publishing" means building the site folder; deploying
it (rsync to the VPS, copying to USB) is a separate step.

What it is for, in the owner's words:
- an index of everything, searchable, in the low hundreds;
- tags for where in the curriculum or in CS a simulator belongs;
- "playlists" for students: a small page per course with only the simulators chosen for it.

Example: *Linux Essentials* → DNS, DHCP, LVM and disk partitioning. `courses/linux-essentials.json` is
that example, built.

## 1. Layout

```
sims/<id>/                 one folder per native simulator (the folder name is the id)
  sim.json                 its manifest entry (required)
  index.html               the page (required)
  *.js, *.css              local files the page includes; the build inlines them
  thumb.svg|png|webp       optional thumbnail (at most one; reserved, not shown on the plain site yet)
  NOTES.md                 optional: decisions, deviations, timing (playbook §10.8)
linked/<collection>.json   arrays of linked entries, one file per source collection
linked/thumbs/             optional thumbnails for linked entries
courses/<course-id>.json   one file per course: the playlist (ordered sims, optional sections)
tags.json                  the controlled vocabulary: topics and tags
site.json                  site title, UI language, deploy URLs
site/                      templates for the published pages (home, course page) and core.js
  core.js                  search, grouping, links and renderers, used by the build and the admin
admin/                     the admin app's page, script and styles
lib/manifest.mjs           loads and validates every manifest source (read side)
lib/store.mjs              validated writes for the admin (write side)
scripts/build.mjs          builds the published site
scripts/admin.mjs          the admin's local server
scripts/check.mjs          validates without building
tests/                     node:test unit tests (one failing sample per rule)
kit/                       the shared in-sim kit (kit thread; inlined at build time, see §7)
dist/                      default build output, not committed
```

The published folder:

```
index.html                 home: course links, then every finished simulator by topic, one search box
courses/<id>/index.html    one page per course
sims/<id>/index.html       each finished native sim as one self-contained file
.simdeck-site              stamp: marks the folder as safe for the next build to replace
```

## 2. The manifest

There is no single manifest file. Each native simulator carries its own `sim.json`, and linked
entries sit in `linked/*.json`. The build and the admin read them all together.

**Departure from the design notes**, which sketch one manifest: one file per simulator means a page
agent edits only its own folder (playbook §7.1 ownership), parallel agents never conflict on a shared
list, and adding or removing a simulator is adding or removing a folder. With hundreds of entries, a single
file would be the most-conflicted file in the repo.

### 2.1 Fields

| Field | Required | Values | Used for |
|---|---|---|---|
| `id` | yes | kebab-case, unique across native and linked; for native = folder name | URLs, course files, `related` |
| `kind` | yes | `native` (under `sims/`) or `linked` (under `linked/`) | link building; contract applies to native only |
| `class` | yes | `stepper`, `explorer`, `reference`, `tool` (playbook §10.4) | contract part; tools never reach course pages |
| `status` | yes | `ready`, `wip` | `wip` is not published (admin only, and its preview) |
| `title` | yes | ≤ 60 chars | home and course pages, kit header |
| `concept` | yes | ≤ 80 chars: the one concept, as a phrase | second line on home and course pages |
| `summary` | yes | ≤ 160 chars: what the student sees or does | course-page description; searched |
| `topic` | yes | one key of `tags.json` `topics` | grouping by area ("which part of CS") |
| `tags` | yes | ≥ 1 keys of `tags.json` `tags` | searched with their labels and aliases; admin checkboxes |
| `level` | yes | `intro`, `core`, `advanced` | metadata (admin); not shown on the site yet |
| `lang` | yes | `hr`, `en`; must equal the page's `<html lang>` | badge on course pages when it differs from the course; admin filter |
| `steps` | native steppers | positive integer | metadata; the contract check compares it with the page (§7) |
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
from it, so the admin can show which courses list an entry.

Added to the sketch:
- `concept`, `level`, `topic`, `status` and `aliases`, for the site, search and publishing;
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
`/singles/...`, so it is on the site from day one (here: `lvm-topology-lab`). When it is imported,
delete the linked entry and add `sims/<id>/` with the same id. Course files keep working unchanged.

### 2.4 The vocabulary (`tags.json`)

```json
{
  "topics": { "networks": { "label": "Računalne mreže" }, "...": {} },
  "tags":   { "dns": { "label": "DNS", "aliases": ["name resolution", "resolver"] }, "...": {} }
}
```

Two levels, on purpose:
- **Topic:** exactly one per entry, the broad area (storage, OS, networks, security). It is what the home
  page groups by. The order in `tags.json` is the group order.
- **Tags:** one or more per entry, the concepts (dns, lvm, deduplication). They drive search.
- Curriculum placement is the third axis, and it is the **courses** (§4), not a tag.

Tags are controlled: an entry may use only keys from `tags.json`. This stops drift like
backup/backups/sigurnosne kopije (playbook §10.6). A tag's `aliases` make it findable in both
languages and by command name. Adding a tag is a one-line change to `tags.json`, owned by the
coordinator.

## 3. The published site

### 3.1 Home page (`index.html`)

- **Title**, then **links to every course page**.
- **One search box:**
  - focused on load, and `/` focuses it again;
  - every word must match, and case and Croatian diacritics are ignored;
  - it searches title, id, concept, summary, tag labels and aliases, topic, and the entry's aliases.
    The build writes these words into each item, so the page's script only shows and hides list items.
  - `Enter` opens the first match and `Esc` clears the search. In class: `/`, `dhcp`, Enter.
- **Every finished simulator, grouped by topic:** one line each, with title, concept, and ↗ for
  linked entries. Topic order is the order in `tags.json`.
- **Tools** are listed (under their topic, e.g. "Alati za nastavu"), because the lecturer opens them
  in class. They never appear on course pages.
- **Entries with `status: "wip"` are not published at all:** no list item and no page.
- No filters, toggles, thumbnails, stored state or data blobs. Those are admin features.

At a few hundred entries, the home page is a few hundred lines of HTML. That is fine for search and
for scrolling one topic.

### 3.2 Course pages: the playlists (`courses/<id>/index.html`)

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

- `sections` keeps the order. Use one section without a title for a flat list, or one per lecture
  or week.
- Native and linked entries mix freely.
- The `id` is the address: `materijali.online/simdeck/courses/linux-essentials/`. A new course file
  is a new link, as soon as the site is published.

The page:
- is static: no script except a print button;
- has a link back to the home page;
- is readable on a phone;
- prints on one A4 sheet, with each link's full URL under it (from `site.json` `siteUrl`), so a
  printed or PDF copy still works;
- numbers its items across sections;
- marks linked entries with ↗, and adds a footnote that they may ask for a separate login (§9);
- shows a language badge on an entry whose language differs from the course's.

Tools and unknown ids in a course file are errors. Unfinished entries give a warning and are left off
the page until they are `ready`, so a course can list a simulator before it is done.

**Short links** like `materijali.online/linux` are a one-line nginx `location`/`return 302` per
course on the VPS. That is a deploy decision, not a build one (§9).

## 4. The admin

`npm run admin`, then open `http://127.0.0.1:5300/`. Options: `--port`, `--root <repo>` (edit another
checkout or a scratch copy), and `--host` (default 127.0.0.1). The admin has no login; to reach it
from another machine, use an SSH tunnel.

- **Simulatori:**
  - a searchable list with a status filter;
  - a form per entry: title, concept, summary, status, class, steps, topic, tags (checkboxes), level,
    language, aliases; for linked entries also URL, scenario and collection file; origin, asset
    review;
  - **+ Novi simulator** creates `sims/<id>/` with a `sim.json` and a bare `index.html` (later: the
    template's), status `wip`;
  - **+ Vanjska poveznica** adds a linked entry to a collection file;
  - each entry shows which courses list it;
  - linked entries can be deleted here. Native sims are deleted by removing their folder (git keeps
    it), and a native id is its folder name, so renaming is done by hand too.
- **Kolegiji:**
  - create a course, then edit its id (= address), title, subtitle, language and intro;
  - sections: add, rename, reorder and remove;
  - add simulators by typing in a section's search box (Enter adds the first match; tools are never
    offered), and reorder or remove them;
  - unfinished and invalid items are flagged in place;
  - **Pregled** builds a preview, including unfinished entries, and opens the course page.
- **Teme i oznake:** edit topic and tag labels and tag aliases, see how many simulators use each, and
  add or remove. Removing one that is in use is refused.
- **Objava:**
  - **Pregled (s nedovršenima)** previews the whole site;
  - **Objavi** builds the published site into a folder: by default `dist/`, or any path, such as a
    USB stick (`/media/usb/simdeck`);
  - all validation errors and warnings are listed here, and the header shows their count on every tab.

Every save is validated before it is written. The change is applied to an in-memory copy of all the
manifest files, and it is written only if it adds no new error (`lib/store.mjs`). A refused save shows
the reasons and changes nothing on disk. Saves write the same JSON format as hand edits, with stable
field order, so git diffs stay small. Writes are accepted only as same-origin JSON from the admin's
own page.

## 5. Build

`node scripts/build.mjs [--out <dir>] [--drafts]` (or `npm run build`; the admin's Objavi does the
same). `npm run check` validates only, and `npm test` runs the unit tests.

1. Load and validate every manifest source (§6). Any error stops the build before the output folder
   is touched.
2. **Output folder safety:** the build replaces a folder only if it is empty, new, or carries the
   `.simdeck-site` stamp from an earlier build. It never empties a folder of someone else's files (a
   USB stick's root, say).
3. For each finished native sim, produce one self-contained file:
   - inline local `<script src>` and `<link rel=stylesheet>` (files must be inside the sim's
     folder);
   - replace the kit marker with the kit;
   - add the `#simdeck-meta` block;
   - refuse anything loaded from the network (scripts, styles, images, frames, CSS `url()`).
     Ordinary `<a href>` links are allowed.
4. Write the home page and the course pages.

`--drafts` (used by the admin's preview) also includes `wip` entries.

All links between published pages are relative and name `index.html` explicitly, so the folder works
at any URL path and from `file://`. Linked entries point to `site.json` `linkedBase`
(`https://materijali.online/`), so they need the network and their own login. On a USB stick
without network, only native sims work.

**Tooling: Node ≥ 20 and its standard library, nothing else.** There is no `npm install` and no
`node_modules`. The build takes well under a second, and the admin server is about a hundred lines on
`node:http`.

**Departure from playbook §10.9**, which recommends Vite + vite-plugin-singlefile:
- The frame needs no bundler.
- Vite earns its place only if sims are written in TypeScript or as ES modules that import each other.
  That is the kit and template thread's decision. If it takes it, only `buildNative` in
  `scripts/build.mjs` changes: the input (`sims/<id>/index.html` and its folder) and the output (one
  file with `#simdeck-meta`) stay the same.
- Playwright (for the contract's 1920×1080 checks) is the contract check's dev dependency, not the
  frame's.
- Current limitation: an ES module that `import`s a sibling file is not bundled. Classic scripts and
  import-free modules are fine.

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
      "index":"../../index.html"}
   </script>
   ```
   The kit header reads `title` (and may show `concept`) from here, so the title is written once, in
   `sim.json`. A page must not define this block itself.
3. **Back to the home page.**
   - The kit header's back link uses `meta.index`, the published home page.
   - Recommendation: when `document.referrer` is a simdeck course page, use `history.back()`, so a
     student goes back to their course page rather than to the home page.
   - Opened standalone (a single file from Moodle), `meta.index` leads nowhere useful, and the kit may hide
     the link when `location.protocol === 'file:'` and the target is missing.
4. **What the template must fill.** A new sim folder from the template ships:
   - a `sim.json` with every required field (§2.1), with `status: "wip"` until it is done;
   - an `index.html` with `<html lang>` equal to `lang`, a `<title>` and the kit marker.
   Changing `status` to `ready` is the last step of the per-page DoD (playbook §8).
5. **Exceptions are declared in `sim.json` `exceptions`**, not in an in-page JSON block (playbook §10.2
   allows either). That keeps all declarations in one machine-read place, and the build counts them. The
   contract check reads them from the manifest.
6. **`steps`** in `sim.json` declares the demo length. The contract check should compare it with the
   step count the page's controller reports.
7. **Offline:** the build already refuses network loads in native pages. The kit must not load fonts or
   scripts from a CDN.
8. **Thumbnails:** `thumb.svg|png|webp` in the sim folder is validated and reserved. The plain home page
   does not show it yet; the admin or a later card view may.
9. **Look:** the home and course pages have their own small CSS (`site/index.css`, `site/course.css`).
   Once the kit's colour tokens exist, these should use them, so the frame and the sims look like one
   product.

## 8. How to …

Everything below can be done in the admin, or by editing the files and running `npm run check`.

**Add a native simulator:**
1. In the admin, use Simulatori → **+ Novi simulator** (or create `sims/<id>/` with `sim.json` and
   `index.html` by hand).
2. Build the page, using the kit thread's template once it exists.
3. Set its status to `ready` when it passes its DoD.

**Add a linked entry:** Simulatori → **+ Vanjska poveznica**, or append it to `linked/<collection>.json`.

**Make a course page:**
1. Kolegiji → **+ Novi kolegij**, choose the id (it becomes the address), and add simulators.
2. Use **Pregled** to check it, then Objava → **Objavi**.

**Publish:**
1. Objava → **Objavi**, to `dist/` or a USB folder.
2. Deploy `dist/` with rsync (playbook §9 deploy notes; a `scripts/deploy.sh` is still to be written).

**Import a `single-page-labs` page:**
1. Follow playbook §10.7.
2. If it was listed as a linked entry, delete that entry and create the native folder with the same
   id. Course files keep working.
3. Set `origin`.

## 9. Open questions

- **UI language.** The site and the admin are in Croatian, following playbook §10.9 and ossimulator.
  Strings are in `STR` in `site/core.js`, in the `site/` templates, and in `admin/`.
- **Short course URLs.** `materijali.online/linux` needs one nginx rule per course, or one rule
  `/k/<id>` → `/simdeck/courses/<id>/`. Which form, and who adds them?
- **Logins.** `/ossim` uses its own realm, while `/singles` and `/ceph` share another. A course page
  that mixes them asks students for two logins; the page has a footnote for now. Decide before M4
  (playbook §10.5).
- **Home page for students.** Course pages link back to the home page, which lists everything that is
  finished, tools included. Is that what students should see, or should course pages stand alone?
- **Thumbnails.** The plain site does not show them. Keep the field for later, or drop it?
- **Deploy script.** `scripts/deploy.sh` (rsync `dist/` with `--chown`/`--chmod`, then a 401/200
  check, playbook §9) is not written yet.
- **Level scale.** `intro`/`core`/`advanced` is a guess. Does it match how courses are labelled?
- **Topics.** The nine topics in `tags.json` are a first cut for the placeholders and the first batch,
  and should be revisited once docs/catalogue.md exists.
