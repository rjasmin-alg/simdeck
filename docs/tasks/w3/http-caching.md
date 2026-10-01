# http-caching: HTTP caching

| | |
|---|---|
| Task | `http-caching` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-http-caching` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/http-caching/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, UL |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **Cache-Control, ETag, 304, what a CDN edge keeps**.

The student: request repeatedly, change headers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "Kako web-poslužitelj dolazi do odgovora" → "Šire o temi" (the three HTTP standards: STD 97 semantics, STD 99 HTTP/1.1, STD 98 caching), and the reverse-proxy paragraph citing RFC 9110 on intermediaries used "da bi se posluživanje ubrzalo predmemoriranjem". The book gives no caching rules; they come from RFC 9111.
- RFC 9111 (HTTP Caching, STD 98) §4.2, §4.2.1, §4.3, §5.1, §5.2.2.4, §5.2.2.5, §5.2.2.7, §5.2.2.10; RFC 9110 §8.8.3 (ETag), §13.1.2 (If-None-Match), §15.4.5 (304)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** three boxes left to right: browser (private cache), CDN edge (shared cache), origin server. Each cache shows its stored entry: URL, ETag, `Cache-Control`, stored-at time, age, fresh/stale badge. A request arrow travels as far as it needs to; the response returns with its status (200 / 304 / from cache).
- **State:** `{ now (s), origin: { body, etag, cacheControl }, caches: { browser: entry|null, edge: entry|null }, lastPath: ['browser','edge','origin'], lastStatus, log[] }`.
- **One step:** advance `now` to the next scheduled request (or origin change); the browser asks; each cache in turn decides: serve fresh, revalidate, or forward; responses fill caches on the way back.
- **Rules:**
  1. A stored response is **fresh** while its age < freshness lifetime; at age = lifetime it is stale (tie-break) (RFC 9111 §4.2: "fresh if its age has not yet exceeded its freshness lifetime").
  2. Freshness lifetime: for a shared cache `s-maxage` if present, else `max-age`; for a private cache `max-age` (RFC 9111 §4.2.1, §5.2.2.10).
  3. A fresh entry is served without contacting the next hop; the response carries `Age` (RFC 9111 §4, §5.1).
  4. A stale entry with an `ETag` is revalidated with `If-None-Match`; if the origin's ETag is unchanged it answers `304 Not Modified` without a body and the entry becomes fresh again; otherwise `200` with the new body and ETag (RFC 9111 §4.3; RFC 9110 §13.1.2, §15.4.5).
  5. `no-store`: no cache stores the response (RFC 9111 §5.2.2.5). `no-cache`: it may be stored but must be revalidated before every use (RFC 9111 §5.2.2.4). `private`: only the browser may store it, never the edge (RFC 9111 §5.2.2.7).
  6. A changed file at the origin is **not** seen by anyone holding a fresh copy until it goes stale (the HTTP analogue of DNS TTL, see `dns-ttl-cache`).
- **Params:** choice `cacheControl` "max-age=60" / "no-cache" / "no-store" / "private, max-age=60" / "max-age=60, s-maxage=300", default "max-age=60"; range `interval` 10–120 s, default 30; button `change-origin` (key O), takes effect at the next step.
- **Presets** (derived from RFC 9111, unchecked):
  1. `max-age` — `max-age=60`, ETag `"v1"`, requests at 0, 30, 60, 90 s. Outcome: 0 → 200 from origin (both caches fill); 30 → served by browser cache, Age 30; 60 → stale (rule 1 tie), revalidated, 304; 90 → browser hit, Age 30.
  2. `changed-file` — as 1, origin changes to `"v2"` at 20 s. Outcome: the request at 30 s still gets v1 from the browser cache; at 60 s revalidation returns 200 with v2 and ETag `"v2"`.
  3. `no-cache` — every request reaches the origin; 304 each time while unchanged, so no body is re-sent.
  4. `no-store` — every request is a full 200 from the origin; both caches stay empty.
  5. `edge-vs-browser` — `max-age=60, s-maxage=300` with two browsers A and B: B's first request at 120 s is served by the edge (fresh for 300 s) without reaching the origin; then `private` shows the edge storing nothing.
- **Steps:** `max-age` 4; `changed-file` 5; `no-cache` 4; `no-store` 4; `edge-vs-browser` 6.
- **Legend:** filled entry = fresh, hatched entry = stale, empty box = nothing stored; arrow length shows how far the request went; "changed" marks the cache entry written or revalidated this step.
- **Captions:** hr: "Zapis u pregledniku star je 60 s, a max-age=60: više nije svjež. Preglednik šalje If-None-Match: \"v1\", poslužitelj odgovara 304 bez tijela." en: "The browser's copy is 60 s old and max-age=60: it is no longer fresh. The browser sends If-None-Match: \"v1\" and the server answers 304 with no body."
- **Terms:** *cache* — predmemorija; *fresh / stale* — svjež / zastario (check); *revalidation* — ponovna provjera; *conditional request* — uvjetni zahtjev; *entity tag (ETag)* — oznaka inačice (check); *shared cache* — zajednička predmemorija.
- **Misconceptions:** "`no-cache` means do not cache" (it means revalidate every time; `no-store` means do not store); "304 sends the page again"; "reloading always fetches the new version".
- **Reuse from `http-exchange`:** request/response messages and header display; new here are caches, ages and conditional requests.
- **Out of scope:** heuristic freshness, `Vary`, `Last-Modified`/`If-Modified-Since` (mention only), purge APIs, service workers.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh http-caching sims/http-caching` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/http-caching/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
