# dns-ttl-cache: TTL caching and the cutover

| | |
|---|---|
| Task | `dns-ttl-cache` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-dns-ttl-cache` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dns-ttl-cache/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | UL, DR |
| Topic / tags / level | `internet` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **old answers live until TTL expires; lower the TTL before migrating**.

The student: change a record, run time, see who still gets the old IP.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux): "Tko odgovara kad se pita za ime" (definitions *TTL zapisa*, *predmemorija*), "Vlastiti poslužitelj imena" (SOA fields, `MINIMUM` as negative-cache TTL, *negativno predmemoriranje*), and **Primjer 2 — selidba poslužitelja u utorak** (the worked example: `$TTL 3600`, lower to 300 s one full TTL before, `MINIMUM` 900 s)
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-19/` (diagrams for the chapter)
- RFC 1035 §3.2.1 and §4.1.3 (TTL field); RFC 2181 §8 (TTL range); RFC 2308 §5 (negative-cache TTL); RFC 8767 §4 (TTL definition as revised, serve-stale)
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S6.md` (DR estate scenario; its timeline fits secondary expiry better than TTL, see the coordinator note in the report)
- Catalogue seed: UL ch19 Example 2, DR S6 → §5.4

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.

## Model and presets

- **Scene:** a time axis (kit view "time axis") across the top in minutes relative to the change (t = 0, "utorak 09:00"); below it the authoritative server for `lab.example` with the current `posluzitelj.lab.example A` record and the zone's TTL, and three caching resolvers R1–R3 (three offices), each with its cache row: cached address, TTL received, expiry time as a shrinking bar. Each resolver has a client icon that asks every step and shows which address it got (old / new).
- **State:** `{ t, zone: { addr, ttl, negTtl, names[] }, resolvers: [{ id, cache: { name, addr|null (NXDOMAIN), fetchedAt, ttl } | null, lastAnswer, lastSource: 'cache'|'auth' }], events[] (scheduled zone edits), log[] }`.
- **One step:** advance `t` by the preset's step (5 or 10 min); then, in this order: (1) apply zone edits scheduled at or before `t`; (2) for each resolver in id order, its client asks; (3) the resolver answers from cache or asks the authoritative server (rules 1–4); (4) record old/new per client.
- **Rules:**
  1. A cached record may be used while `t < fetchedAt + ttl`; at `t = fetchedAt + ttl` it is expired and the resolver asks again (tie-break: equality counts as expired) (check; UL ch19 "Tko odgovara kad se pita za ime", definition *TTL zapisa*, RFC 8767 §4 as cited there).
  2. On a miss the resolver gets the zone's **current** address and the zone's **current** TTL; the TTL is fixed at fetch time and a later TTL change in the zone does not shorten entries already cached (UL ch19 Primjer 2: "sniženje vrijedi samo za ono što se dijeli odsad nadalje").
  3. There is no way to recall a cached record; only expiry removes it (UL ch19 Primjer 2).
  4. A "no such name" answer is cached too (negative caching), for min(SOA `MINIMUM`, TTL of the SOA record) = min(900, 3600) = 900 s here (RFC 2308 §5; UL ch19 Primjer 2 and definition *negativno predmemoriranje*).
  5. The answer a resolver gives its client shows the remaining TTL, `fetchedAt + ttl − t` (RFC 1035 §4.1.3, check).
  6. Serving stale data when the authoritative server is unreachable (RFC 8767) is out of scope: the authoritative server is always up.
- **Params:** `oldTtl` choice 3600/1800/300, default 3600; `newTtl` choice 300/60, default 300; `lowerAt` range −120…0 min step 10, default per preset; `changeAt` fixed 0; `stepMin` choice 5/10, default per preset (`resets: true`).
- **Presets:**
  1. `book-naive` — UL ch19 Primjer 2 without the fix: `$TTL 3600`, address 192.168.180.1 → 192.168.180.2 at t = 0; R1, R2, R3 last fetched at −50, −20, −5 min. Outcome: R1 switches at +10, R2 at +40, R3 at +55 min; old answers for up to 60 min after the change. From UL ch19 Primjer 2 (times and new address derived, unchecked).
  2. `book-lowered` — the book's fix: TTL lowered to 300 s at −70 min (more than one old TTL before), change at 0. Initial entries (3600 s, fetched at −110, −80, −75) expire at −50, −20, −15 and are refetched with 300 s. Outcome: after t = 0 every resolver switches within 5 min. From UL ch19 Primjer 2 (times derived).
  3. `lowered-too-late` — TTL lowered at −10 min ("na dan selidbe"). R2 fetched at −20 with 3600 s and keeps the old address until +40. Outcome: window still ~60 min; rule 2 wins. From UL ch19 Primjer 2 ("Sniziti ga na dan selidbe ne pomaže ništa").
  4. `negative` — a client of R1 asks for `novi.lab.example` at −5 min, before it is added at 0. R1 caches NXDOMAIN for 900 s and keeps saying "no such name" until +10 min; R2, which never asked, sees the new name at once. From UL ch19 Primjer 2 (second half).
- **Steps:** `book-naive` 12 (−60…+60 by 10); `book-lowered` 16 (−70…+10 by 5); `lowered-too-late` 8 (−20…+60 by 10); `negative` 4 (−5…+15 by 5).
- **Legend:** filled circle = new address, hollow circle = old address, hatched = NXDOMAIN cached, bar = remaining TTL; "changed" marks a resolver whose cached value changed this step (refetch or expiry).
- **Captions:** hr: "t = +40 min: R2-u je istekao zapis dohvaćen u −20 min (TTL 3600 s), pa je pitao mjerodavni poslužitelj i sad daje novu adresu 192.168.180.2." en: "t = +40 min: R2's record fetched at −20 min (TTL 3600 s) expired, so it asked the authoritative server and now answers with the new address 192.168.180.2."
- **Terms:** *record TTL* — TTL zapisa; *cache* — predmemorija; *negative caching* — negativno predmemoriranje; *authoritative server* — mjerodavni poslužitelj; *resolver* — *resolver* (rezolver); *zone* — zona.
- **Misconceptions:** "changing the record takes effect when I save the zone"; "lowering the TTL on the day of the move helps"; "a name I just added must resolve at once".
- **Reuse from `dns-resolution`:** the resolver/cache data structure and the authoritative-answer function; new here are the time axis, scheduled zone edits and the negative cache.
- **Out of scope:** the iterative walk from the root (that is `dns-resolution`), serve-stale, DNS prefetching, client-side OS caches, browser caches.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dns-ttl-cache sims/dns-ttl-cache` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-ttl-cache/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
