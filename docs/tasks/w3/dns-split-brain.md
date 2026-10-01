# dns-split-brain: Two primaries are two zones

| | |
|---|---|
| Task | `dns-split-brain` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-dns-split-brain` in `docs/catalogue.md` §4.2 |
| Kind | **add a preset to `sims/dns-secondary-expiry/`** (no page of its own) |
| Folder | `sims/dns-secondary-expiry/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `internet` / `dns` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `dns-secondary-expiry` merged; only one preset task per host folder at a time |

## Goal

One concept: **split-brain primaries answer differently**.

The student: edit one primary, query both.

This is a **preset on `dns-secondary-expiry`** (A secondary is a cache with a timer), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/dns-secondary-expiry/` (the host page) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux): "Vlastiti poslužitelj imena": definitions *primarni poslužitelj*, *sekundarni poslužitelj*, *prijenos zone*, *vrh zone*; the closing paragraph on the `aa` flag ("tko tvrdi da je mjerodavan, ali ne i je li tvrdnja istinita")
- RFC 9499 §6 ("Primary server", "Secondary server"); RFC 1034 §4.3.1 (recursive and non-recursive queries)
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-01 (instructor only: never quote it on a student page)
- Catalogue seed: DR caveat CV-01

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.

## Model and presets

- **Kind:** a preset on `sims/dns-secondary-expiry/` (§5.4 "zone servers over time"). No new page.
- **What the preset shows:** two servers that are **both primary** for the same zone `corp.example`, with no transfer in either direction. Each has its own serial and its own records, including a different apex A record. Clients are split: group H asks resolver P1 (a stand-alone name server), group D asks resolver P2 (a directory-integrated name server). One edit on P2 is visible only to group D.
- **What the host model must support** (request it in the host's NOTES.md "Shared requests" if missing):
  1. More than one server with `role: 'primary'` for one zone, each with an independent zone copy (the host has one primary and one secondary).
  2. A per-client "which server do I ask" mapping, and a per-server **non-recursive query** view that shows each server's own answer and its `aa` flag (UL ch19: the `aa` flag says who claims authority, not whether the claim is true).
  3. An "edit on server X" action. Timers are not needed: no refresh, retry or expire applies between two primaries.
- **Rules (on top of the host's):**
  1. A primary answers from its own copy only; nothing compares or merges two primaries (UL ch19 "Vlastiti poslužitelj imena": the primary is the source of zone transfers, the secondary gets the zone by transfer; with two primaries and no transfer there are two zones).
  2. Both answers carry `aa`, and both are "correct" for the server that gives them (check against RFC 1034 §4.3.1 / RFC 9499 "Primary server").
  3. The answer a client sees depends only on the resolver it was given (DHCP option 6), not on which server "is right".
- **Preset `split-brain`** (derived, unchecked): P1 serial 2017010101, apex `corp.example A 192.0.2.10`; P2 serial 2026110101, apex `A 192.0.2.20`, plus a new `app.corp.example A 192.0.2.30` added at step 3. Expected: H clients get 192.0.2.10 and NXDOMAIN for `app`; D clients get 192.0.2.20 and 192.0.2.30; non-recursive queries to each server show both answers with `aa`. Steps: 6 (show both copies; H asks; D asks; edit on P2; H asks again → still NXDOMAIN; per-server non-recursive comparison).
- **Second preset `split-brain-retire`** (derived): the fix in the right order, P1's zone turned into a secondary of P2 (or removed) and the serial compared; H clients converge after P1's next refresh. Steps: 5. Optional: needs the host's refresh timer.
- **Legend additions:** two primaries drawn with the same "primary" shape and different series colours; a "two zones" bracket over them.
- **Captions:** hr: "Oba poslužitelja odgovaraju sa zastavicom aa i oba su u pravu za svoju kopiju. Zona s dva primarna dvije su zone." en: "Both servers answer with the aa flag and each is right about its own copy. A zone with two primaries is two zones."
- **Terms:** *primary server* — primarni poslužitelj; *non-recursive query* — nerekurzivni upit; *authoritative answer (aa)* — mjerodavan odgovor; *zone apex* — vrh zone; *split-brain* — razdvojeni mozak (*split-brain*).
- **Misconceptions:** "what my laptop resolves is what the zone says"; "two primaries are redundancy".
- **Out of scope:** intentional split-horizon DNS (views), AD replication between DCs, the estate's specific names (instructor caveat CV-01 is never quoted on the page).
- **Note for the coordinator:** this preset uses none of the host's timers; it fits `dns-secondary-expiry` only if that host adds multi-primary support (point 1). If the host author declines, a preset of `dns-resolution` (two resolvers, two authorities) is the fallback.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-secondary-expiry/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
