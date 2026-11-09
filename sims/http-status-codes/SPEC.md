<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-status-codes: HTTP status codes (spec)

Task: `docs/tasks/w3/http-status-codes.md` (catalogue `ref-http-status`, §4.11). Class **reference**: no steps. The
page is a poster of five columns, one per class, with a card per code that matters; a class filter and a core
toggle dim the other cards; clicking a card shows its example exchange underneath; five views as presets.

One concept: **the classes and the codes that matter.** The first digit says what kind of answer it is and whose
problem it is; the rest of the code refines it.

Sources: URM = *Uvod u računalne mreže*, ch. 14 "HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (the five
methods, the five codes 200, 301, 302, 404, 500), Primjer 3 "preusmjeravanje adrese kataloga", questions 14 and 15.
RFC 9110 *HTTP Semantics* §15, read in `~/projects/uvod-u-racunalne-mreze/references/chapter-03/rfc9110.txt`
(every section number below checked there on 2026-11-09). RFC 6585 §4 for 429: not available offline, marked
*(check)* here and in NOTES.md (not on the page).

## 1. Classes (RFC 9110 §15)

| class | name (RFC) | letter | whose problem | an unknown code of the class is read as |
|---|---|---|---|---|
| 1xx | Informational | I | nobody's yet: an interim answer, the final one follows | 100 |
| 2xx | Successful | S | nobody's: it worked | 200 |
| 3xx | Redirection | R | the client has to act (go elsewhere or use its copy) | 300 |
| 4xx | Client Error | C | the client's: the request is wrong | 400 |
| 5xx | Server Error | E | the server's: the request looked valid | 500 |

300 (Multiple Choices) is not on the poster (rule 6), but it is still what an unknown 3xx is read as.

## 2. Cards (the data)

22 cards in poster order (class, then code). `core` = the five of URM ch14. Example requests use the book's site,
`www.grafo.hr`, and its paths (Primjer 3: `/proizvodi` → `/katalog`). "no body" = the response has no content.

| code | phrase | RFC | core | request | response | follow-up (request → response) |
|---|---|---|---|---|---|---|
| 100 | Continue | 9110 §15.2.1 | | `POST /narudzbe` + `Expect: 100-continue` | `100 Continue`, no body | same request: the body → `201 Created` + `Location: /narudzbe/42` |
| 101 | Switching Protocols | §15.2.2 | | `GET /chat` + `Connection: Upgrade`, `Upgrade: websocket` | `101 Switching Protocols` + `Connection: Upgrade`, `Upgrade: websocket` (§7.8: a sender of Upgrade MUST also send the `upgrade` connection option), no body | — (the connection now speaks the other protocol) |
| 200 | OK | §15.3.1 | ★ | `GET /katalog` | `200 OK` | — |
| 201 | Created | §15.3.2 | | `POST /narudzbe` | `201 Created` + `Location: /narudzbe/42` | — |
| 204 | No Content | §15.3.5 | | `DELETE /kosarica/7` | `204 No Content`, no body | — |
| 206 | Partial Content | §15.3.7 | | `GET /katalog.pdf` + `Range: bytes=0-999` | `206 Partial Content` + `Content-Range: bytes 0-999/48000` | — |
| 301 | Moved Permanently | §15.4.2 | ★ | `GET /proizvodi` | `301 Moved Permanently` + `Location: /katalog` | `GET /katalog` → `200 OK` |
| 302 | Found | §15.4.3 | ★ | `GET /akcija` | `302 Found` + `Location: /akcija-studeni` | `GET /akcija-studeni` → `200 OK` |
| 304 | Not Modified | §15.4.5 | | `GET /katalog` + `If-None-Match: "v7"` | `304 Not Modified` + `ETag: "v7"`, no body | — (the client uses its stored copy) |
| 307 | Temporary Redirect | §15.4.8 | | `POST /narudzbe` | `307 Temporary Redirect` + `Location: /pricuva/narudzbe` | `POST /pricuva/narudzbe` → `201 Created` |
| 308 | Permanent Redirect | §15.4.9 | | `PUT /cjenik` | `308 Permanent Redirect` + `Location: /v2/cjenik` | `PUT /v2/cjenik` → `200 OK` |
| 400 | Bad Request | §15.5.1 | | `GET /trazi?q=%zz` | `400 Bad Request` | — |
| 401 | Unauthorized | §15.5.2 | | `GET /admin` | `401 Unauthorized` + `WWW-Authenticate: Basic realm="admin"` | `GET /admin` + `Authorization: Basic …` → `200 OK` |
| 403 | Forbidden | §15.5.4 | | `GET /admin` + `Authorization: Basic …` | `403 Forbidden` | — (the same credentials again will not help) |
| 404 | Not Found | §15.5.5 | ★ | `GET /katalog/stari` | `404 Not Found` | — |
| 405 | Method Not Allowed | §15.5.6 | | `DELETE /katalog` | `405 Method Not Allowed` + `Allow: GET, HEAD` | — |
| 409 | Conflict | §15.5.10 | | `PUT /cjenik` (changes to an older version) | `409 Conflict` | — |
| 429 | Too Many Requests | RFC 6585 §4 *(check)* | | `GET /trazi?q=papir` | `429 Too Many Requests` + `Retry-After: 60` | — |
| 500 | Internal Server Error | §15.6.1 | ★ | `GET /katalog` | `500 Internal Server Error` | — |
| 502 | Bad Gateway | §15.6.3 | | `GET /katalog` | `502 Bad Gateway` (from the gateway) | — |
| 503 | Service Unavailable | §15.6.4 | | `GET /katalog` | `503 Service Unavailable` + `Retry-After: 120` | — |
| 504 | Gateway Timeout | §15.6.5 | | `GET /katalog` | `504 Gateway Timeout` (from the gateway) | — |

Per class: 1xx 2, 2xx 4, 3xx 5, 4xx 7, 5xx 4 (22). Core: 5, one in 2xx, two in 3xx, one in 4xx, one in 5xx.

Requests and responses per card ("for one click"): a follow-up that is a new request adds one request and one
response (301, 302, 307, 308, 401: 2 requests, 2 responses); 100's follow-up is the rest of the same request (1
request, 2 responses: an interim and the final one, RFC 9110 §15 "zero or more interim … followed by exactly one
final"); every other card is 1 and 1.

## 3. Rules (data rules)

1. **The first digit is the class** (RFC 9110 §15): `classOf(code) = floor(code / 100)` for a valid code; every
   card's column is the class of its code.
2. **An unknown code is read as x00 of its class** (§15: "treat an unrecognized status code as being equivalent to
   the x00 status code of that class"; its example: 471 is read as 400). `readAs(code)` = the code itself if it is
   on the poster, else `class × 100`. A code outside 100–599 (or not an integer) is invalid and read as a server
   error, 500 (§15: "SHOULD process the response as if it had a 5xx (Server Error) status code"). Expected:
   `readAs(471) = 400`, `readAs(299) = 200`, `readAs(150) = 100`, `readAs(399) = 300`, `readAs(404) = 404`,
   `readAs(600) = 500` (invalid), `readAs(99) = 500` (invalid), `readAs(404.5) = 500` (invalid).
3. **Redirects carry the new URI in `Location`, not in the code** (§15.4; URM Primjer 3). Every 301, 302, 307 and
   308 response has a `Location` header, and its follow-up request asks for exactly that URI. 301 and 308 are
   permanent, 302 and 307 temporary; 307 and 308 keep the method (the follow-up uses the original method: `POST`,
   `PUT`), 301 and 302 may change `POST` to `GET` (§15.4.2–3 notes), so their examples are `GET`.
   `redirect(code)` = `{ permanent, keepsMethod }` for these four, else `null` (304 is a 3xx without `Location`).
4. **304 answers a conditional request and has no body** (§15.4.5): its request is `GET` or `HEAD` with a
   condition header (`If-None-Match` or `If-Modified-Since`); its response has no content. No body either: 1xx
   (§15.2 "cannot contain content"), 204 (§15.3.5).
5. **401 means "authenticate", 403 "authenticated or not, no"** (§15.5.2, §15.5.4). The 401 response carries
   `WWW-Authenticate` (MUST); its follow-up adds `Authorization` and gets 200. The 403 request already carries
   `Authorization` and has no follow-up (the client SHOULD NOT repeat it with the same credentials).
6. **Card set** as in §2; core set 200, 301, 302, 404, 500 (URM ch14).

Misconceptions the page answers: a 404 is an answer from the server (the server is up; it is a client-class code,
whose problem = the client's); a redirect is two exchanges (preset `redirect`); 401 and 403 differ (preset `auth`).

## 4. Params, filter and views

- `class`: `all` | `1xx` | `2xx` | `3xx` | `4xx` | `5xx` (default `all`).
- `core`: boolean (default `false`): only the five of the book.
- `view` (hidden, set by the presets): `none` | `book-five` | `redirect` | `whose-fault` | `cache` | `auth`.
- `sel` (hidden, set by clicking a card): a code on the poster as a string, or `''`.

A card is **active** when it is in the class filter (or the filter is `all`), is core (or `core` is off), and is
in the view's focus (when the view is on and has a focus). Inactive cards are dimmed, never hidden.

Views (a view is **on** while `class` and `core` are what its preset set them to):

| preset | params | focus (active) | detail strip |
|---|---|---|---|
| `book-five` | core on, view book-five | 200, 301, 302, 404, 500 (from `core`) | — |
| `redirect` | view redirect | 200, 301 | 301's exchange: `GET /proizvodi` → 301 + `Location: /katalog` → `GET /katalog` → 200 (2 requests) |
| `whose-fault` | view whose-fault | 404, 500, 503 | 404, 500 and 503 side by side |
| `cache` | view cache | 304 | 304's exchange |
| `auth` | view auth | 401, 403 | 401 and 403 side by side |

Expected active counts: default 22; `class 1xx` 2, `2xx` 4, `3xx` 5, `4xx` 7, `5xx` 4; `core` 5; `class 3xx` + `core`
2 (301, 302); `class 1xx` + `core` 0 (the caption says so).

**Changed** = the cards that became active with the last change of the active set (`appeared(before, after)`;
a click on a card or the first render changes no active set, so the marks stay or there are none): from
`class 4xx` to `class 5xx` the four 5xx cards; from `all` to `4xx` none (cards only dimmed); turning `core` off
from `core` on, the 17 non-core cards.

## 5. Tie-breaks

- **A filter ends a view.** Change `class` or `core` away from what the preset set and the view is off (`view:
  null`): its focus no longer dims and its detail goes; the filter alone decides. The page then clears the hidden
  `view` param, so setting the filter back does not bring the view back.
- **Selection beats the view's detail.** With `sel` set, the detail strip shows that card; clear it
  and the view's comparison comes back.
- **A dimmed card can still be selected**: dimming is a reading aid, not removal (the selection stays when a
  filter dims the card).
- **Unknown `class`, `view` or `sel`** (a stale or hand-edited URL, also `constructor`, `__proto__`) is `all`, no
  view and no selection; `core` is on only for `true`. Never an error.
- **Click on the selected card** deselects it (page).
- Cards and lists are always in poster order (class, then code).

## 6. Out of scope

Every registered code, WebDAV codes, HTTP/2 framing, how servers are configured to send them. Caching headers in
depth are `http-caching`; the request and response format is `http-exchange`.
