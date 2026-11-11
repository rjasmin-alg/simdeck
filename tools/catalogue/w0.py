#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Write the hand-specified wave-0, kit and course tasks (docs/tasks/w0, w4). Rerun after tasks.py."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import tasks as T, ranker

OUT = T.OUT
HDR = lambda tid, what, wave, size, deps, owner="coordinator": "\n".join([
    f"# {tid}: {what}", "", "| | |", "|---|---|",
    f"| Task | `{tid}` (wave {wave}) |", f"| Owner | {owner} |", f"| Size | {size} |",
    f"| Depends on | {deps} |", f"| Licence | AGPL-3.0-or-later |", ""])

W0 = {}
W0["kit-follow-ups"] = HDR("kit-follow-ups", "the kit changes the frame left open (done)", "0", "—", "—", "—") + """
## Done on main

Carried out by thread t-0003 in `cd893d4` and `7f640c7`: the template's `#simdeck-meta` keeps only `id`,
`class` and `steps`; `kit/new-sim.sh` writes a `status: "wip"` `sim.json` stub that passes `npm run check`; the
back link returns to the index or a course page; `docs/sim-ui.md` §7–§8 record the settlement; the placeholder
sims (`dhcp-dora`, `dns-resolution`, `disk-partitioning`, `lvm-topology`) are `wip`, so their tasks start from
the template. Nothing left to do; kept so links to this task resolve.
"""

W0["bilingual"] = HDR("bilingual", "Croatian and English in every sim, the index and course pages", "0", "M–L", "main at cd893d4", "coordinator (touches kit and frame)") + """
## Goal

Owner decision (2026-10-01): **all simulators and the entire site support English and Croatian.** Design and
build the mechanism once, in the kit and the frame, so that every task only writes strings.

## Requirements (catalogue §7.2)

- **One page, both languages:** a single self-contained file per sim carries both string tables and switches at
  runtime (no second page per language, so the offline folder and the URLs stay simple).
- A **language switch** in the kit header (and a key, if one is free in `docs/sim-ui.md` §3), remembered across
  simdeck pages, and `?lang=hr|en` in the URL. Course pages link their sims with the course's language.
- **String tables** per sim (`STRINGS = { hr, en }`, see COMMON.md §4), looked up through one kit function;
  the kit's own strings already exist in both languages.
- **Manifest:** `title`, `concept`, `summary` and `aliases` become `{ "hr": …, "en": … }`; `lang` goes away (or
  becomes the original language, for provenance). Update `lib/manifest.mjs`, the admin forms, the build and
  `docs/site-structure.md`. Pages adopted in one language only declare a `languages` exception until translated.
- **Index and course pages** in both languages: the home page switches; a course file's `lang` picks its default.
- **Glossary component:** a shared term list (English term, Croatian term) the kit can render in the
  "first mention" style (*lease* (najam adrese)); seeded from ossimulator's `docs/POJMOVNIK.md` and the books.
- **Contract check:** a page fails if a key exists in one table and not the other, or if any visible text node
  at 1920×1080 is not from the tables (render once per language).
- **Layout:** the one-screen check runs in both languages (Croatian labels are longer).
- Update the template, `kit/new-sim.sh`, `docs/sim-ui.md` and `docs/tasks/COMMON.md` §4–§5.

## Done when

The template runs in both languages with the switch, the manifest and admin take both, the index and a course
page switch, the check fails a page with a missing string (with a test), and COMMON.md describes the final
pattern so that adoption tasks can start.
"""

W0["contract-check"] = HDR("contract-check", "one command that checks a sim, and the per-task gate", "0", "M", "`bilingual` for the language rules") + """
## Goal

Turn the contract (COMMON.md §3) into checks, so that "done" is mechanical (playbook §6: a rule without a check
is a recommendation). One command: `npm run gate -- <id>`.

## What the gate runs

1. `sim.json` validation (`lib/manifest.mjs`).
2. `node --test sims/<id>/sim.test.js`.
3. Build the sim alone into a temp folder; refuse network loads (the build does this).
4. Browser checks on the **built** file from `file://` with every request blocked (`kit/tools/check-page.mjs`
   is the seed): one screen at 1920×1080 in light and dark, body text ≥ 20 px and nothing under 16 px, no
   horizontal scroll at 375×812, clicker keys move the step counter (steppers), the controller's step count
   equals `sim.json` `steps`, reduced motion, no console errors, both languages (task `bilingual`).
5. Undefined CSS tokens in the page (the kit test already does this for the kit).
6. **Scope:** `git diff --name-only --no-renames main...HEAD` touches only `sims/<id>/` (or the host folder of
   a preset task), as ossimulator's `check:scope`.
7. Declared exceptions in `sim.json` waive the matching check and are counted; print the count per class.
8. Screenshots into `--shots <dir>`: 1920×1080 light, dark, grayscale; 375×812.

Every check gets a test that feeds it a bad sample and expects a failure (playbook §6: the gate must be
impossible to pass falsely). Ports and temp folders derive from the worktree path, so parallel gates don't
collide.

## Done when

`npm run gate -- <template id>` passes; each rule has a failing-sample test; COMMON.md §7 points to the gate.
"""

W0["vocabulary"] = HDR("vocabulary", "topics and tags every task needs, in both languages", "0", "S", "`bilingual` (labels in both languages)") + """
## Goal

Tasks may only use tags that exist in `tags.json`, and they are not allowed to edit it (COMMON.md §9). Add
everything they need up front, so parallel tasks never wait on the vocabulary.

## Do

- Topics: add `windows-admin` (Administracija Windowsa / Windows administration), `internet`
  (Internet i aplikacijski protokoli / Internet and application protocols) and `theory` (Teorija računarstva /
  Theory of computation) to the existing nine; keep `classroom` last.
- Tags: add every tag listed in `docs/tasks/README.md` → "Tags used by the tasks", with Croatian and English
  labels and useful aliases (command names, the other language, abbreviations). Reuse the existing keys
  (`deduplication`, `backup`, `snapshots`, `lvm`, `filesystems`, `dhcp`, `dns`, …) rather than near-duplicates.
- Courses: the course codes the catalogue uses are not tags (courses are the third axis, `docs/site-structure.md`
  §2.3).

## Done when

`npm run check` passes with a test sim that uses every new tag; README's tag list and `tags.json` agree.
"""

W0["licence"] = HDR("licence", "AGPL-3.0-or-later for simdeck", "0", "S", "main at cd893d4") + """
## Goal

Owner decision (2026-10-01): simdeck is **AGPL-3.0-or-later**, to keep it open as long as possible.

## Do

- `LICENSE`: the full AGPL-3.0 text (from the FSF, `https://www.gnu.org/licenses/agpl-3.0.txt`).
- `package.json` `"license": "AGPL-3.0-or-later"`.
- SPDX headers in `kit/`, `site/`, `lib/`, `scripts/`, `admin/` and the template.
- **Source link** (AGPL §13: users of a served page must be offered the source): the kit help overlay or
  header, the home page footer and course pages show "Izvorni kod / Source code" and the licence name, pointing
  to the source: a source archive next to it
  (`/simdeck/source.tar.gz`, built by the deploy script from the same `main` commit).
- `kit/fonts/OFL.txt` stays; the home page credits third-party licences (fonts, vendored libraries, CC BY
  material) on a small "Licences" page generated from the sims' `NOTES.md` or `sim.json`.
- The proposal, design notes, playbook and README already say AGPL-3.0-or-later (thread t-0002); rebuild
  `docs/proposal-simdeck.pdf` with the project-proposal skill's `build.sh` so the PDF matches.

## Done when

`LICENSE` exists, every page and the index link the source and licence, and the deploy publishes the source
archive.
"""

W0["shared-models"] = HDR("shared-models", "where model code shared by several sims lives", "0", "S", "main at cd893d4") + """
## Goal

About 140 wave-3 tasks reuse a core sim's model (task files: "soft: … reuse its model"), and catalogue §5
groups many sims on one model (a small Windows domain, DNS records over time, TCP, a packet's path). Copying
model code into every folder (COMMON.md §6, the interim rule) works but drifts.

## Decide and build

- A `models/` folder of pure, DOM-free model modules (classic scripts that register on one global, like
  `kit.js`), each with its own tests, inlined by the build when a page includes it (the same exception as the
  kit), and runnable under `node --test`.
- Ownership: a model is promoted from a sim into `models/` by the coordinator (additive change, changelog
  entry), never edited by page tasks; requests go through "Shared requests" in `NOTES.md`.
- Update COMMON.md §6.

## Done when

One model (from the first pilot that has a soft dependent) lives in `models/`, its sim uses it from there,
the build inlines it, and COMMON.md §6 says how to use it.
"""

W0["presets-in-index"] = HDR("presets-in-index", "index and course entries that open a sim at a preset", "0", "S", "main at cd893d4") + """
## Goal

The catalogue relies on opening one page at a preset: about 60 ossimulator scenario entries (`?scenario=`),
and the preset tasks of catalogue §5 (e.g. `update-rings` on `wsus-groups`, `broadcast-storm` on `stp`). The
frame has one entry per sim folder only.

## Do

- Let `sim.json` declare **entries**: `[{ "preset": "<id>", "title", "concept" }]` (both languages), each
  listed and searchable on the home page as its own line and linkable from course files as `"<sim>#<preset>"`.
- The link opens `sims/<id>/index.html?preset=<preset>` (kit) or `?scenario=<id>` (ossimulator pages: let an
  entry give the query string explicitly).
- Validation: the preset id exists in the page (the contract check can read the kit's preset list).

## Done when

A course page lists a preset entry, the link opens the sim paused at that preset, and preset tasks can add
their entry to the host's `sim.json` without touching anything else.
"""

W0["ossimulator-english"] = HDR("ossimulator-english", "English UI for ossimulator", "0 (runs in parallel with waves 1–2)", "L", "owner approval: this changes `~/projects/ossimulator`, outside simdeck", "an ossimulator thread") + """
## Goal

ossimulator's 16 pages are imported into simdeck as built single files (wave 1). They are Croatian only, and
English cannot be added to a built bundle. Add English in ossimulator's source, then re-import.

## Do (in `~/projects/ossimulator`)

- Externalise UI strings and the theory text per module into `hr`/`en` tables; add a language switch and
  `?lang=` to the shared shell (`src/shared/`), following simdeck's `bilingual` pattern so the behaviour matches.
- English terms come from `docs/POJMOVNIK.md` (it already pairs every term).
- Keep event codes and tests language-neutral (they already are, playbook §4.3).
- Rebuild `dist-single/`, run ossimulator's gate, then re-run step 1 of each simdeck `w1` ossimulator task.

## Decided (owner, 2026-10-02)

ossimulator stays the source of truth for its pages (`docs/site-structure.md` §0): simdeck holds the builds,
and this work happens in ossimulator, never in the simdeck copies.
"""

W0["licence-source-repos"] = HDR("licence-source-repos", "AGPL-3.0-or-later in the source repos", "0", "S", "owner decision 2026-10-02 (\"AGPL everything\"); one thread per repo or one thread visiting each", "a thread per repo (outside simdeck)") + """
## Goal

Owner decision (2026-10-02): **AGPL everything**, so the originals stay open, not only the copies in simdeck.

## Repos

`~/projects/ossimulator`, `~/projects/cephsim`, `~/projects/faultline`, `~/projects/topologydrafter`,
`~/projects/single-page-labs` (not a git repo), `~/projects/uvod-u-racunalne-mreze`,
`~/projects/urm-sveucilisni-udzbenik`.

## Do, in each

- Add `LICENSE` with the full AGPL-3.0 text, and `"license": "AGPL-3.0-or-later"` where there is a
  `package.json` (ossimulator: also drop nothing else; `"private": true` may stay, it only stops npm publishing).
- A one-line licence note in the README.
- Keep third-party licences as they are (ossimulator's OFL fonts; 50ohm material stays CC BY 4.0).
- The two books: their `meta/project.yaml` image policy (CC BY / CC0 / PD) is compatible; state in the README
  that the book's own text and code are AGPL-3.0-or-later, as decided.
- Follow each repo's own workflow (its `CLAUDE.md`, branch and merge rules); commit there, push when the remote
  is reachable, or note it in `~/projects/PENDING_PUSH.md`.

## Done when

Each repo has `LICENSE`, the README line and, where present, the package.json field.
"""

W0["freeze-originals"] = HDR("freeze-originals", "notes in the original projects pointing to the simdeck copies", "0 (after wave 1)", "S", "wave 1 merged; owner approval per repo (outside simdeck)") + """
## Goal

Proposal risk "copies drift from their originals": once a page is imported, the original collection is frozen
with a note pointing to its simdeck home (playbook §10.7 step 5).

## Do, per repo, after asking the owner

- `~/projects/single-page-labs` (not a git repo): a note at the top of each imported page and in `index.html`.
- `~/projects/uvod-u-racunalne-mreze` and `urm-sveucilisni-udzbenik`: the 14 interactive pages now live in
  simdeck; decide with the owner whether the book embeds or links the simdeck copies (catalogue §5.19–5.20).
- `~/projects/cephsim`, `faultline`, `topologydrafter`: README note.
- ossimulator: per the decision in `ossimulator-english`.
- 50ohm: nothing to freeze (upstream content); simdeck's copies carry the attribution.
- Old URLs (`/singles`, `/ceph`, `/faultline`, `/topologija`): keep, or redirect to simdeck (owner decides;
  the nginx change is the deploy's job).
"""

W0["publish"] = HDR("publish", "build and deploy after every merge", "0 (recurring)", "S each time", "owner approval for each deploy") + """
## Goal

"Adopt it and publish it": every merged sim reaches `https://materijali.online/simdeck/` (public,
`docs/deploy.md`).

## Each time

1. On `main` after a merge: `npm test && npm run check && npm run build`.
2. `npm run deploy:dry`, read the diff, then `npm run deploy` (asks nothing; the owner approves the step).
3. The script checks 200 without a login, and `/simdeck/VERSION` = `main`'s commit.
4. Course short addresses: paste new nginx rules from the admin's Objava tab (owner, on the server).
5. Nothing runs automatically (no background jobs on these machines, by design).

Recommended cadence: after every wave-1 batch of merges, then after each wave-2 and wave-3 merge.
"""

KIT = {
    "kit-sequence-chart": ("K1", "message sequence chart", "dhcp-dora",
        "lanes per party, one arrow per step with a label and the fields that matter, the current arrow "
        "highlighted, an optional \"what an eavesdropper sees\" overlay, lost/dropped messages, timers on a lane"),
    "kit-topology": ("K2", "topology with moving packets", "arp-local-remote",
        "nodes (host, switch, router, server, AP) and links in HTML/SVG at 1:1, a packet moving per step with its "
        "headers shown, link and node failure, per-node tables beside the node"),
    "kit-block-grid": ("K3", "block grid", "dedup-chunking",
        "rows of cells for blocks, chunks or extents, with state shown by colour **and** pattern (`.sd-hatch`), "
        "references between cells (chains, pointers), shared vs owned blocks, a counter of space used"),
    "kit-rule-table": ("K4", "rule table with the matching row", "rule-first-match",
        "an ordered rule list, the packet or request being evaluated, the row being compared highlighted per "
        "step, the matching row marked, implicit default shown, and evaluation modes (first match, most specific, "
        "deny wins) so the contrast in catalogue §5.1 can be shown"),
}


def kit_task(tid, k, name, pilot, what, consumers):
    return HDR(tid, f"kit view {k}: {name}", "2a", "M", f"pilot `{pilot}` merged", "coordinator (kit owner)") + f"""
## Goal

Extract the **{name}** from the pilot sim `sims/{pilot}/` into the kit, so the {len(consumers)} sims that need it
draw it the same way: {what}.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

{", ".join(f"`{c}`" for c in consumers)}

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
"""


def course_tasks(tasks_list, by_id, sids):
    names = {
        "URM": ("uvod-u-racunalne-mreze", "Uvod u računalne mreže"), "UL": ("uvod-u-linux", "Uvod u Linux (Linux Essentials?)"),
        "NLA": ("napredna-linux-administracija", "Napredna Linux administracija"), "OS": ("operacijski-sustavi", "Operacijski sustavi"),
        "DR": ("optimizacija-i-oporavak", "Optimisation and disaster recovery"), "WIN1": ("windows-osnove", "Windows administration, basic (working name)"),
        "WIN2": ("windows-napredno", "Windows administration, advanced (working name)"), "HAM": ("radioamateri", "Ham radio licence course"),
        "KK": ("krizne-komunikacije", "Crisis communications KK1/KK2"), "ARH": ("arhitektura-racunala", "Computer architecture"),
        "AUT": ("automati", "Automata and computability"),
    }
    out = {}
    for code, (cid_file, name) in names.items():
        items = []
        for cid, r, wave, group in tasks_list:
            courses = ranker.plain(r.get("Courses", "")) or T.ADOPT_COURSES.get(cid, "") or {"urm": "URM", "ossim": "OS", "50ohm": "HAM"}.get(cid.split("-")[0], "")
            if re.search(rf"\b{code}\b", courses):
                items.append((wave, r["_sec"], cid, r))
        items.sort(key=lambda x: ({"1": 0, "2a": 1, "2b": 1, "3": 2}[x[0]], x[1], x[2]))
        body = HDR(f"course-{cid_file}", f"course page: {name}", "4", "S", "wave 0; add each sim when it is `ready`",
                   "coordinator or owner (admin → Kolegiji)") + f"""
## Goal

A course file `courses/{cid_file}.json` and its generated page: the playlist for **{name}**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Use the working title above; the owner gives official course names later (not needed now). Ask for
  sections (lectures or weeks) and a short address only when the page is published.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims ({len(items)}, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
""" + "\n".join(f"| `{sids[c]}` | {T.esc(ranker.plain(r.get('Title') or r.get('Item') or r.get('Page') or ''))} | {w} | {s} |"
                for w, s, c, r in items) + "\n"
        out[f"course-{cid_file}"] = body
    return out


def main():
    rows, clusters = T.load()
    by_id = {ranker.plain(r["ID"]): r for r in rows}
    sids = {cid: T.sim_id(cid) for cid in by_id}
    tasks_list = []
    for cid, r in by_id.items():
        sec = r["_sec"]
        if cid in ("app-dc-sim", "app-dr-estate", "50ohm-maidenhead", "50ohm-aprs-map", "50ohm-hamnet-map"):
            continue
        wave = "1" if sec.startswith("2") else ("2a" if cid in T.PILOTS else "2b" if cid in T.CORE_GROUP else "3")
        tasks_list.append((cid, r, wave, ""))
    (OUT / "w0").mkdir(exist_ok=True)
    (OUT / "w4").mkdir(exist_ok=True)
    for tid, body in W0.items():
        (OUT / "w0" / f"{tid}.md").write_text(body)
    for tid, (k, name, pilot, what) in KIT.items():
        consumers = sorted(sids[c] for c, r, w, g in tasks_list if w != "1" and T.view_for(c) and T.view_for(c).startswith(k) and sids[c] != pilot)
        (OUT / "w0" / f"{tid}.md").write_text(kit_task(tid, k, name, pilot, what, consumers))
    for tid, body in course_tasks(tasks_list, by_id, sids).items():
        (OUT / "w4" / f"{tid}.md").write_text(body)
    print("w0:", len(W0) + len(KIT), "w4:", len(list((OUT / "w4").glob("*.md"))))


if __name__ == "__main__":
    main()
