<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cors: notes

New stepper (task `docs/tasks/w3/cors.md`, catalogue `inet-cors`, §4.2, wave 3). Rules, tie-breaks and expected
numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart** (`kit/sequence.js`); the
origins, the exchange as text and the server's log are page panels beside it.

## Decisions

- **Layout.** Two columns. Left, the K1 chart with four lanes: page script (JS), browser (the gate), server (API) and
  a program outside a browser (`>_`). The lane that is not in the run is dashed ("not in this run"). Right, three
  panels: the origin triples of page and target (a differing part has a dashed outline and `≠`, never colour alone),
  the current exchange as text (the request the script asks for at steps 0–1, then the preflight pair or the actual
  pair, with the response header that decided marked), and the server: what it will send (until the first answer is
  on screen, after which the exchange shows it) and its log (method, path, code, Origin, a "written" tag on
  POST/PUT).
- **One step = one phase** as the task says: classify, preflight (OPTIONS and its answer, read at once), request (the
  actual request and its answer), check. Same-origin and the outside client get the body in the request step (no
  check), so both are 2 steps; a failed preflight ends the run at step 2 with the error to the script.
- **The outside client's first step** is its "classification": a note "not a browser", no arrow. It keeps the run's
  shape (2 steps, as the task says) and lets the caption say it has no origin and checks nothing.
- **Gate** is a badge in the browser card and beside the verdict: "open ✓" (solid border), "closed ✕" (double
  border), "no check" (dotted), "—" before the check. The legend shows the closed one.
- **Chart chips:** `fetch()` + the method from script to browser, `OPTIONS /data` and `204 No Content` dashed,
  the actual request and response solid, the body (`{"items":3}`) or "error" with "no body" at the script.
- **The script's card** on a block says "network error" and "console: CORS error": that is what a page script
  sees; the reason is only on the console.
- **`scheme` moves the page to http** (`http://app.example` → `https://app.example/api/data`): an https page calling
  http is stopped as mixed content before CORS, which is out of scope and would teach the wrong reason.
- **Panel fit.** Six presets and up to seven controls do not fit one screen in one column: the presets are in two
  columns (as `amdahl`, `backup-window`), `jsonBody` shows only for POST/PUT, `credentials` only in the browser,
  `acac` only with credentials, `allowPut` only when the request needs a preflight (PUT, or a JSON body). Hidden
  controls keep their value; the server sends what they say either way.
- **Related:** `http-exchange`, `http-caching`, `tls-handshake`.

## Deviations from the task

- **`client` param → toggle `outside`** ("program outside a browser"), off by default. The task names the fourth lane
  but no param to reach it; a toggle costs half the height of a choice.
- **Added toggle `acac`** (the server sends `Access-Control-Allow-Credentials: true`), off by default; shown only with
  credentials. Without it rule 6's second half (ACAC missing) could not be shown. The `credentials-star` preset turns
  it on, so the only reason it fails is the `*` (switch to "page origin" and it passes; then turn `acac` off).
- **`allowPut`** means "the OPTIONS answer allows PUT and Content-Type" (Allow-Methods `GET, POST, PUT`,
  Allow-Headers `Content-Type`); off, it answers `GET, POST` and no Allow-Headers. So POST with JSON fails on the header
  with it off.
- **Cookies** are sent only when `credentials` is on, also to the same origin (a real browser's default mode sends
  them there anyway; no outcome changes). The outside client never sends cookies: it has no user's session.
- **Message helpers** `startLine` and `fieldValues` are copied from `sims/http-exchange/sim.js @ ac86af3`: the
  `http-exchange` model is not in `models/` yet (COMMON.md §6). The rest of its model (virtual hosts, redirects,
  the send queue) is not used; the reuse is the message shape and the text display.
- No custom request header in the controls; the model takes any header list and is tested with `X-Token`.

## Sources

- RFC 6454 "The Web Origin Concept" §4 (origin of a URI, effective port), §5 (comparing origins), §6.2 (ASCII
  serialisation: default port left out). From memory.
- WHATWG Fetch Standard: "CORS protocol", "CORS-safelisted method", "CORS-safelisted request-header" (Content-Type
  essence), "CORS-unsafe request-header names" (lowercase, sorted), "CORS-preflight fetch" (credentials omitted on
  OPTIONS, the order of checks), "CORS check" (ACAO, `*` without credentials, ACAC `true`), "append a request Origin
  header" (cross-origin, or a method other than GET/HEAD). From memory, no network in this session.
- MDN "Cross-Origin Resource Sharing (CORS)" for the shape of the examples (from memory).
- UL `book/chapters/21-web-posluzitelji.md` "Kako web-poslužitelj dolazi do odgovora" for header-field wording; the
  books have no CORS text. Croatian terms: *ishodište* and *vjerodajnice* occur in the books; *prethodni zahtjev* and
  *pravilo istog ishodišta* do not.
- Numbers checked with a scratch script over every preset and the variants in SPEC.md before the page was written.

## Unchecked *(check)*

- Section names and numbers above (RFC 6454 §4–§6.2, the Fetch Standard section titles) are from memory.
- That a same-origin POST/PUT carries `Origin` (Fetch "append a request Origin header"; the referrer policy can turn
  its value into `null` in some cases, ignored here).
- That `text/plain` with a parameter (`;charset=UTF-8`) is still safelisted (the essence is compared).
- Croatian terms: *ishodište* for origin, *pravilo istog ishodišta* for same-origin policy, *prethodni zahtjev* for
  preflight request (the task marks all three *(check)*).

## Term pairs

Missing from `kit/glossary.js`, written out in `strings.js` (hr: the English term in italics, the Croatian in
parentheses, in the explanation):

| en | hr |
|---|---|
| origin | ishodište |
| same-origin policy | pravilo istog ishodišta |
| cross-origin request | zahtjev prema drugom ishodištu |
| preflight request | prethodni zahtjev |
| credentials | vjerodajnice |

`header field` (polje zaglavlja) is in the glossary.

## Shared requests

- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as `http-exchange` and `cert-chain` do).
- **K1: a note on the outermost lane** is centred on its lifeline and is clipped at the chart's edge when longer than
  half a lane; the page keeps that note short ("not a browser"). An option to anchor a note inside the chart would
  help.
- **Models:** promote `startLine`/`fieldValues` (http-exchange) to `models/` so this sim can drop its copy.

## Fresh review

A fresh reviewer read the diff against SPEC.md, ran all 768 param combinations against the SPEC table and made 43
mutations of `sim.js`; 39 failed a test. Fixed after the review: the four survivors (ACAO compared with case folding,
`Access-Control-Request-Headers` joined with ", ", the outside client's `target.credentials`, a body handed over on a
block) now each fail a test; the preflight captions for `*` and missing ACAC no longer say cookies were sent (no cookie
leaves on a preflight); two wording fixes.

## Time

Start 22:18, done 22:40 (model, page, gate, screenshots of every preset, fresh review and its fixes): about 22 minutes
by the wall clock, one session.
