# http-exchange: One HTTP exchange

| | |
|---|---|
| Task | `http-exchange` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-http-exchange` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/http-exchange/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, UL |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **request line, headers, status codes, body**.

The student: send requests, read responses.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (methods, five status codes, URL parts) and **Primjer 3: preusmjeravanje adrese kataloga** (301 + Location → second request → 200); figure `ch14-http-301-preusmjeravanje.png` in `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/images/`
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "Kako web-poslužitelj dolazi do odgovora" (definitions *zahtjev i odgovor*, *polje zaglavlja*, *statusni kod*, *virtualni poslužitelj*; the `Host:` 400/200 example), its "Šire o temi" (*redak zahtjeva*, *statusni redak*, reason phrases, 421, 403 vs 404) and **Primjer 3 — „postavio sam novu stranicu, a i dalje se vidi stara"**
- RFC 9110 (HTTP Semantics, STD 97) §9.3, §15; RFC 9112 (HTTP/1.1, STD 99) §2.1, §3, §3.2, §4, §5
- Catalogue seed: URM ch14

## Model and presets

- **Scene:** kit view K1 message sequence chart with two lanes, client (a browser or a command-line HTTP client) and server `www.grafo.hr` (URM) / `192.168.180.1` (UL). Beside the chart, the current message as text, split into its parts with labels: request-line or status-line, header fields, the empty line, body. The server side shows its virtual hosts (name → document root) and a small resource table (path → status, content).
- **State:** `{ messages: [{ dir, startLine, headers: [[name, value]], body }], server: { vhosts: [{ name, root, default }], resources: { path: { status, location?, body } } }, pending: request|null, phase }`.
- **One step:** (1) the client sends the next request (drawn as an arrow, text panel shows it); (2) the server parses it, picks the virtual host by `Host`, looks up the path and answers (arrow back, text panel shows the response); (3) if the response is a redirect, the client builds the follow-up request (next step). Two steps per exchange.
- **Rules:**
  1. Request-line = method SP request-target SP HTTP-version; status-line = HTTP-version SP status-code SP [reason-phrase] (RFC 9112 §3, §4; UL ch21 "Šire o temi", definitions *redak zahtjeva*, *statusni redak*).
  2. A message = start line, CRLF, zero or more header lines, an empty line, optional body (RFC 9112 §2.1). Header names are case-insensitive (RFC 9112 §5).
  3. An HTTP/1.1 request without `Host`, or with two, gets 400 (RFC 9112 §3.2; UL ch21 "Kako web-poslužitelj dolazi do odgovora", the empty-`Host` example).
  4. The server picks the virtual host by the name in `Host`; a name that matches none goes to the default (first) virtual host and gets **200 with the wrong content** (UL ch21 Primjer 3).
  5. The first digit of the status code is its class: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error; an unknown code is treated as x00 of its class (RFC 9110 §15; UL ch21 definition *statusni kod*). The reason phrase carries no meaning (RFC 9110 §15, UL ch21).
  6. 301 carries the new URI in `Location`; the client sends a new request there (RFC 9110 §15.4.2; URM ch14 Primjer 3).
  7. HEAD returns the same headers as GET and no body (RFC 9110 §9.3.2; URM ch14 "HTTP i HTTPS").
  8. 404 may also hide a resource the server will not reveal (it may answer 404 instead of 403) (RFC 9110 §15.5.4–15.5.5; UL ch21 "Šire o temi").
- **Params:** choice `method` GET/HEAD/POST, default GET; select `path` (from the preset's resource table); choice `host` (preset's names plus "empty"), default the first; button `send` (key S) queues the request for the next step.
- **Presets:**
  1. `redirect` — URM ch14 Primjer 3: `GET /proizvodi HTTP/1.1`, `Host: www.grafo.hr` → `301 Moved Permanently`, `Location: /katalog` → `GET /katalog` → `200 OK`. Outcome: two full exchanges, four messages, one page for the user. From URM ch14 Primjer 3.
  2. `host-missing` — UL ch21: an HTTP/1.1 request to `http://192.168.180.1/` with an empty `Host` → 400; the same with `Host` → 200. From UL ch21 "Kako web-poslužitelj dolazi do odgovora".
  3. `wrong-vhost` — UL ch21 Primjer 3: a new name that no virtual host is configured for → the first (default) virtual host answers 200 with the old site. From UL ch21 Primjer 3.
  4. `head-vs-get` — HEAD and GET on `/katalog`: same status and headers, HEAD has no body. Derived from URM ch14.
  5. `not-found-vs-forbidden` — `/nema` → 404; `/privatno` (file present, not readable) → 403. From UL ch21 (codes 403 and 404 paragraph).
- **Steps:** `redirect` 4; `host-missing` 4; `wrong-vhost` 2; `head-vs-get` 4; `not-found-vs-forbidden` 4.
- **Legend:** request arrow (solid, rightwards), response arrow (solid, leftwards, outlined by status class with a class badge 2xx/3xx/4xx/5xx), text-panel parts in four labelled bands; "changed" marks the message and the header field that decided the outcome (e.g. `Host`, `Location`).
- **Captions:** hr: "Poslužitelj vraća 301 i zaglavlje Location: /katalog. Sam broj kaže samo da se resurs trajno preselio; kamo, kaže zaglavlje." en: "The server returns 301 and the header Location: /katalog. The number only says the resource moved permanently; where to is in the header."
- **Terms:** *request / response* — zahtjev / odgovor; *request-line* — redak zahtjeva; *status-line* — statusni redak; *header field* — polje zaglavlja; *status code* — statusni kod; *virtual host* — virtualni poslužitelj; *origin server* — ishodišni poslužitelj; *resource* — resurs.
- **Misconceptions:** "404 means the file is not there"; "the reason phrase (OK, Not Found) matters"; "200 means it worked".
- **Out of scope:** TLS (that is `tls-handshake`), HTTP/2 and /3 framing (`http-versions`), caching (`http-caching`), cookies, chunked encoding, persistent connections.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh http-exchange sims/http-exchange` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/http-exchange/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
