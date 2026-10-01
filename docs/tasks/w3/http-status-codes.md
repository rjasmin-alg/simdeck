# http-status-codes: HTTP status codes

| | |
|---|---|
| Task | `http-status-codes` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `ref-http-status` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/http-status-codes/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the classes and the codes that matter**.

The student: filter by class.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, "HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (five methods; the five status codes 200, 301, 302, 404, 500 with RFC 9110 quotes), **Primjer 3** "preusmjeravanje adrese kataloga" (301 + Location → 200), questions 14 and 15 (conditional request; 301 vs 302).
- RFC 9110 *HTTP Semantics* §15 (status codes, classes, unknown codes as x00), RFC 6585 (429). Mark every code you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a reference poster in five columns, one per class 1xx … 5xx, each headed by the class meaning and
  "whose problem" (informational, success, redirection, client error, server error); under each the codes that
  matter as cards: number, reason phrase, one line of meaning, and a mini request/response pair (e.g. `GET /proizvodi`
  → `301` + `Location: /katalog`). The five codes URM teaches are marked as the core set. A filter dims other classes;
  clicking a card shows the follow-up the client makes (e.g. 301 → new GET → 200).
- **State (reference, derived from params):** `{ filter: {class, core}, cards: [{code, phrase, cls, meaning,
  example: {request, response, followUp|null}, rfc, core}], selected: code|null }`.
- **Params drive live:** class and core filters dim cards; selecting a card shows its example exchange.
- **Rules (data rules, RFC 9110 §15 unless noted):**
  1. The first digit is the class: 1xx informational, 2xx successful, 3xx redirection, 4xx client error, 5xx server
     error (RFC 9110 §15).
  2. A client that does not know a code treats it as x00 of its class (RFC 9110 §15).
  3. Redirects carry the new URI in the `Location` header, not in the code; 301 permanent, 302/307 temporary, 308
     permanent keeping the method (RFC 9110 §15.4; URM ch14 Primjer 3).
  4. 304 Not Modified answers a conditional request; no body (RFC 9110 §15.4.5).
  5. 401 means "authenticate", 403 "authenticated or not, no" (RFC 9110 §15.5.2–15.5.4).
  6. Card set: 100, 101; 200, 201, 204, 206; 301, 302, 304, 307, 308; 400, 401, 403, 404, 405, 409, 429 (RFC 6585);
     500, 502, 503, 504. Core set (URM ch14): 200, 301, 302, 404, 500.
- **Params:** `class` choice all / 1xx / 2xx / 3xx / 4xx / 5xx (default all); `core` toggle (default off).
- **Presets (views):**
  1. `book-five` (URM ch14 "HTTP i HTTPS"): core only: 200, 301, 302, 404, 500.
  2. `redirect` (URM ch14 Primjer 3): `GET /proizvodi` → 301 + `Location: /katalog` → `GET /katalog` → 200: two
     requests for one click.
  3. `whose-fault`: 4xx vs 5xx side by side: 404 (the client asked for something that is not there) vs 500/503
     (the server failed).
  4. `cache` (URM ch14 question 14): a conditional GET → 304 (nothing re-downloaded).
  5. `auth`: 401 vs 403.
- **Steps:** reference, none.
- **Legend:** class by column and a letter badge (I, S, R, C, E) so colour is not alone; core code (star); example
  request (arrow right) and response (arrow left). "Changed" marks the cards that appeared with the last filter.
- **Captions** (footer line per view):
  - hr: „301 kaže samo da se resurs trajno preselio; kamo, kaže zaglavlje `Location`. Preglednik šalje novi zahtjev
    i tek na njega dobiva 200.“
  - en: "301 only says the resource has moved for good; where to is in the `Location` header. The browser sends a
    new request and only gets 200 for that one."
- **Terms** (URM ch14): status code — statusni kod; request / response — zahtjev / odgovor; method — metoda;
  resource — resurs; redirect — preusmjeravanje; header — zaglavlje; server / client — poslužitelj / klijent.
- **Misconceptions:** 404 means the server is down (it answered); a redirect is one exchange (two, preset 2); 401
  and 403 are the same (preset 5).
- **Out of scope:** every registered code, WebDAV codes, HTTP/2 framing, how servers are configured to send them.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `http-status-codes` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh http-status-codes sims/http-status-codes` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/http-status-codes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
