# cors: Same origin and CORS

| | |
|---|---|
| Task | `cors` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-cors` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/cors/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `internet` / `http` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the browser, not the server, enforces it; preflight**.

The student: make cross-origin calls with different headers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers CORS. Related: `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` "Kako web-poslužitelj dolazi do odgovora" (header fields)
- RFC 6454 "The Web Origin Concept" §4, §5
- WHATWG Fetch Standard, sections "CORS protocol", "CORS-safelisted method", "CORS-safelisted request-header", "CORS-preflight fetch", "CORS check" (vendor/standards documentation)
- MDN Web Docs "Cross-Origin Resource Sharing (CORS)"
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** three lanes: page script running in the browser at origin `https://app.example`, the browser itself (drawn as a gatekeeper between script and network), and the API server `https://api.example`. A fourth optional lane, a non-browser HTTP client, shows the same request sent from outside a browser. A panel shows the origin triple (scheme, host, port) of page and target and whether they match.
- **State:** `{ pageOrigin, target: { origin, method, headers[], contentType, credentials }, server: { acao: null|'*'|origin, acac: bool, allowMethods[], allowHeaders[] }, phase, preflight: { sent, ok } | null, serverSaw: bool, scriptCanRead: bool }`.
- **One step:** one phase, in order: (1) the browser classifies the request (same-origin / simple cross-origin / needs preflight); (2) if needed, preflight `OPTIONS` and its response; (3) the actual request reaches the server and the server answers; (4) the browser checks the response headers and either hands the body to the script or blocks it with a console error.
- **Rules:**
  1. Origin = scheme + host + port; two URLs are same-origin only if all three match (RFC 6454 §4, §5).
  2. Same-origin requests are not subject to CORS checks (WHATWG Fetch Standard, "CORS protocol").
  3. A cross-origin "simple" request (GET, HEAD or POST, only CORS-safelisted headers, `Content-Type` one of `text/plain`, `multipart/form-data`, `application/x-www-form-urlencoded`) is sent without a preflight (Fetch Standard, "CORS-safelisted method/request-header").
  4. Anything else (e.g. PUT, a custom header, `application/json`) first sends `OPTIONS` with `Access-Control-Request-Method`/`-Headers`; the actual request is sent only if the preflight response allows that method and those headers (Fetch Standard, "CORS-preflight fetch").
  5. The browser lets the script read a cross-origin response only if `Access-Control-Allow-Origin` is `*` or equals the page origin (Fetch Standard, "CORS check").
  6. With credentials (cookies), `Access-Control-Allow-Origin` must be the exact origin, not `*`, and `Access-Control-Allow-Credentials: true` must be present (Fetch Standard, "CORS check").
  7. The browser enforces all of this; the server only declares. A blocked simple request **did reach the server** and may have had effects; a client that is not a browser ignores CORS entirely.
- **Params:** choice `targetOrigin` same / other host / other port / http-vs-https, default other host; choice `method` GET/POST/PUT, default GET; toggle `jsonBody`, default off; toggle `credentials`, default off; choice `acao` none / `*` / exact origin, default none; toggle `allowPut` in preflight response, default off.
- **Presets** (derived from the Fetch Standard, unchecked):
  1. `same-origin` — `app.example` → `app.example/api`: no CORS involved, script reads the body. 2 steps.
  2. `simple-blocked` — GET to `api.example`, server sends no ACAO: server answers 200 (server log shows the request), browser blocks the script. 3 steps.
  3. `simple-allowed` — same with `Access-Control-Allow-Origin: https://app.example`: script reads the body. 3 steps.
  4. `preflight` — PUT with JSON: preflight `OPTIONS` → server allows PUT and `Content-Type` → actual PUT → read. With `allowPut` off the PUT is never sent. 4 steps.
  5. `credentials-star` — credentials on, ACAO `*`: blocked although `*` "allows everyone" (rule 6). 3 steps.
  6. `non-browser` — the blocked request of preset 2 from a non-browser client: the body is shown. 2 steps.
- **Steps:** as listed per preset.
- **Legend:** origin badges (scheme/host/port, a mismatching part outlined), gate icon open/closed, dashed arrow = preflight, solid = actual request; "changed" marks the header that decided this phase.
- **Captions:** hr: "Poslužitelj je zahtjev primio i odgovorio 200, ali u odgovoru nema Access-Control-Allow-Origin. Preglednik skripti ne predaje tijelo: politiku provodi preglednik, ne poslužitelj." en: "The server received the request and answered 200, but the response has no Access-Control-Allow-Origin. The browser does not hand the body to the script: the browser enforces the policy, not the server."
- **Terms:** *origin* — ishodište (check); *same-origin policy* — pravilo istog ishodišta (check); *cross-origin request* — zahtjev prema drugom ishodištu; *preflight request* — prethodni zahtjev (check); *credentials* — vjerodajnice; *header field* — polje zaglavlja.
- **Misconceptions:** "CORS protects the server" (it protects the user's data in the browser; the request still arrives); "`*` allows everything"; "it works from the command line, so the server is fine".
- **Reuse from `http-exchange`:** messages and header display; new here are origins, the browser gate and preflight.
- **Out of scope:** CSP, CSRF tokens, `Access-Control-Max-Age` caching of preflights, private network access, opaque responses and `no-cors` mode.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh cors sims/cors` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cors/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
