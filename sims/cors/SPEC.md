<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cors: specification

One concept: **the browser, not the server, enforces it; preflight**. The student makes cross-origin calls with
different methods, bodies and response headers and sees who decides. Task: `docs/tasks/w3/cors.md`; catalogue
`inet-cors` (§4.2). Model: `sim.js`; tests: `sim.test.js`.

## Scene

Four lanes, left to right: the **page script** (runs in the browser at the page origin), the **browser** (the
gatekeeper between script and network), the **API server**, and a **client that is not a browser** (used only when
the toggle `outside` is on). A panel compares the origin triples of page and target.

| `targetOrigin` | Page origin | Target URL | Origins differ in |
|---|---|---|---|
| `same` | `https://app.example` | `https://app.example/api/data` | nothing |
| `host` (default) | `https://app.example` | `https://api.example/data` | host |
| `port` | `https://app.example` | `https://app.example:8443/data` | port (443 vs 8443) |
| `scheme` | `http://app.example` | `https://app.example/api/data` | scheme and port (80 vs 443) |

`scheme` moves the **page** to http and keeps the API on https: an https page calling an http URL is stopped as mixed
content before CORS is looked at (out of scope), so the other direction would teach the wrong thing.

The request: `method` GET, POST or PUT. GET has no body. POST and PUT carry `x=1` as `Content-Type: text/plain`, or
`{"x":1}` as `Content-Type: application/json` with `jsonBody`. With `credentials` the script asks for cookies
(`credentials: 'include'`) and the browser adds `Cookie: session=7f3a`.

The server is set by the params and sends the same headers to everyone (it never looks at `Origin`):

| Param | Header it sends |
|---|---|
| `acao` none / `star` / `exact` | no `Access-Control-Allow-Origin` / `*` / the page origin |
| `acac` | `Access-Control-Allow-Credentials: true` |
| `allowPut` off / on | preflight answer: `Access-Control-Allow-Methods: GET, POST` / `GET, POST, PUT` and `Access-Control-Allow-Headers: Content-Type` |

OPTIONS gets `204 No Content` (CORS headers, Allow-Methods, Allow-Headers when non-empty); any other method gets
`200 OK`, `Content-Type: application/json`, the CORS headers and `{"items":3}` (GET) or `{"saved":true}` (POST, PUT:
the write is done). Every request it receives goes into its log (method, path, Origin, code).

## Rules

1. **Origin** = scheme + host + port; two URLs are same-origin only if all three match. The port is the effective
   port (443 for https, 80 for http); the serialised origin leaves a default port out (RFC 6454 §4, §5, §6.2).
2. **Same-origin requests are not subject to CORS** (Fetch, "CORS protocol"): no preflight, no check; the body goes
   to the script. Tie-break: a same-origin PUT with JSON is still `same`, not `preflight`.
3. **Simple request**: cross-origin, method GET, HEAD or POST, and only CORS-safelisted headers: `Content-Type` only
   with an essence of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded` (Fetch,
   "CORS-safelisted method", "CORS-safelisted request-header"). Sent at once. Headers the browser sets itself
   (`Origin`, `Cookie`, `Host`) never count: credentials do not cause a preflight.
4. **Preflight**: anything else first sends `OPTIONS` with `Origin`, `Access-Control-Request-Method: <method>` and,
   when there are unsafe headers, `Access-Control-Request-Headers` (names lowercase, sorted, comma-separated); never
   cookies. The browser reads the answer in this order, the first failure decides: the CORS check (rules 5, 6, with
   the actual request's credentials), a 2xx status, the method (in `Access-Control-Allow-Methods`, or safelisted), each
   unsafe header name (in `Access-Control-Allow-Headers`, case-insensitive). On failure the actual request is
   **never sent** (Fetch, "CORS-preflight fetch").
5. **CORS check**: the script may read a cross-origin response only if `Access-Control-Allow-Origin` is `*` or equals
   the page's serialised origin (Fetch, "CORS check").
6. **With credentials** `*` is not enough: ACAO must be the exact origin and `Access-Control-Allow-Credentials` must
   be `true` (Fetch, "CORS check"). The check order (tie-break): ACAO missing → `acao-missing`; `*` without
   credentials → ok; ACAO ≠ page origin → `acao-star` (it was `*`) or `acao-other`; no credentials → ok; ACAC ≠
   `true` → `acac-missing`. So credentials + `*` + no ACAC fails on `*`.
7. **The browser enforces, the server only declares.** A blocked simple request **did reach the server** (its log
   has it, a POST was written); only the script is denied the body. A client that is not a browser has no page
   origin, sends no `Origin` and no user's cookies, makes no checks and prints the body.

**Origin header.** A browser sends `Origin` on every cross-origin request and on a same-origin request whose method is
not GET or HEAD (Fetch, "append a request Origin header").

## Steps

One phase per step: (1) **classify** (the other client: "no browser, nothing to check"), (2) **preflight**
OPTIONS and its answer, read at once (only for `preflight`), (3) **request**: the actual request and the server's
answer (`same` and the other client: the body goes on in this step), (4) **check** (only `simple` and `preflight`).
A failed preflight ends the run at step 2 with the error to the script.

| Preset | Params (over the defaults) | Steps | Outcome |
|---|---|---|---|
| `same-origin` | `targetOrigin: 'same'` | 2 | no CORS; the script reads `{"items":3}` |
| `simple-blocked` | (the defaults) | 3 | server log has `GET /data` → 200; ACAO missing: blocked |
| `simple-allowed` | `acao: 'exact'` | 3 | ACAO = `https://app.example`: read |
| `preflight` | `method: 'PUT', jsonBody: true, acao: 'exact', allowPut: true` | 4 | OPTIONS → 204 allows PUT and Content-Type → PUT → read |
| `credentials-star` | `credentials: true, acao: 'star', acac: true` | 3 | blocked on `*` (rule 6), though ACAC is true |
| `non-browser` | `outside: true` | 2 | no Origin; 200 without ACAO; the client prints the body |

With `allowPut` off, the `preflight` preset is 2 steps: the answer lacks PUT in Allow-Methods (`method`), the PUT is
never sent and the server log has only OPTIONS. POST with JSON and `allowPut` off fails on the header
(`content-type`). The defaults are `simple-blocked` (3 steps = `sim.json` `steps`).

## Simplifications

- Cookies are sent only when `credentials` is on, also to the same origin (a real browser's default mode
  `same-origin` sends them there anyway; it changes no outcome here). Cookie rules (SameSite, third-party blocking)
  are out of scope.
- No wildcard `*` in Allow-Methods/Allow-Headers, no custom request header in the controls (the model handles any
  header list and is tested with one), no `Access-Control-Expose-Headers`.
- Out of scope (task): CSP, CSRF tokens, `Access-Control-Max-Age`, private network access, opaque responses and
  `no-cors` mode, mixed content.

Numbers checked with a scratch script over every preset and the variants above before the page was written.
