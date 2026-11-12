<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cookies-sessions: specification

One concept: **a stateless protocol remembers you; SameSite**. The student logs in, browses, follows a link and a
form from another site, closes the browser and logs out, and watches which cookies the browser attaches and what the
shop finds for them. Task: `docs/tasks/w3/cookies-sessions.md`; catalogue `inet-cookies-sessions` (§4.2).
Model: `sim.js`; tests: `sim.test.js`. Builds on `sims/http-exchange` (message lines); new here are the jar and the
session table.

## Scene

- **Browser** with a cookie jar. Every request is `https` (rule 3 is in the model and tested, not in a preset).
- **`trgovina.example`** (the shop). Session table `sid → { user, cart[] }`. Resources:
  `GET /katalog` (a page view), `POST /prijava` (log in as `ana`), `POST /kosarica` (add an item to the cart),
  `POST /odjava` (log out). Every answer is `200 OK`; what changes is whom the shop answers as.
- **`drugi.example`** (an unrelated site). `GET /` gives a page with a link to `https://trgovina.example/katalog` and
  a form that auto-submits `POST https://trgovina.example/kosarica` (it adds item `x-1`). On the first visit it sets
  its own cookie `tema=tamna` (no attributes: a session cookie, host-only, no SameSite).
- **Session IDs** are handed out in order: `a1b2`, `c3d4`, `e5f6`, `g7h8`, then `s5`, `s6`, … (fixed, not random:
  the model is deterministic). The shop's own items are `k-1`, `k-2`, … in the order added.
- **Clock** starts at 10:00:00 (`now = 0`, seconds). Every action that sends requests advances it by 60 s before
  sending; closing the browser advances it by 300 s (closed and opened again five minutes later).

## The shop's cookie

On log in the shop answers `Set-Cookie: sid=<id>; Path=/; Secure; HttpOnly; SameSite=<param>`, plus
`; Max-Age=3600` when the param `persistent` is on. The shop never clears the cookie: log out deletes only the
session row (rule 6; the `logout` preset shows why that is enough on the server side and why deleting a cookie alone
is not a log out).

## State

`{ n, now, open, jar: [{ name, value, domain, path, secure, httpOnly, sameSite, expires|null, created }],
sessions: { sid: { user, cart[] } }, nextSid, page: { site, path, view, user, cart }|null, lastRequest: { from, to,
method, path, kind, initiator, crossSite, cookieSent[], decisions[] }|null, verdicts, log[], ev }`.
`decisions` says for each jar cookie whether it was attached and, if not, why (`expired`, `domain`, `path`, `secure`,
`samesite`). `verdicts` is, for the step's request to the shop, whether `sid` would be attached under each SameSite
value (`Strict`, `Lax`, `None`). `log` is every message so far (the chart); `ev` what this step did (the caption).

## One step

One user action (the run is the param `acts`, one letter per action; a preset sets it, a key press replaces the
rest of the run from the next step). In order: (0) the browser drops expired cookies (§5.3); (1) it builds the
request and decides which cookies to attach (rules 2–5); (2) the server looks up the session (rule 6) and answers,
possibly with `Set-Cookie`; (3) the jar takes the `Set-Cookie` (§5.3).

| Key | Action | Requests |
|---|---|---|
| P | log in | `POST /prijava` to the shop, initiator the shop (same-site form; the forms P, K and Q are always on a shop page) |
| G | browse | `GET /katalog`, initiator the shop (same-site navigation) |
| K | add to cart | `POST /kosarica`, initiator the shop |
| D | follow drugi.example's link | `GET drugi.example/` (typed, no initiator), then `GET /katalog` to the shop, initiator drugi.example (cross-site navigation) |
| O | drugi.example's form | `GET drugi.example/`, then `POST /kosarica` to the shop, initiator drugi.example (cross-site form) |
| X | close the browser | no request: session cookies dropped, clock +300 s, the browser reopens blank |
| Q | log out | `POST /odjava`, initiator the shop |

At step 0 the jar and the session table are empty. With no page open (step 0, after X) a browse is typed into the address bar: no initiator,
same-site.

**Tie-breaks.**
- Why a cookie is not attached, first reason that applies: `expired`, then `domain`, then `path`, then `secure`, then
  `samesite`. (drugi.example's cookie on a request to the shop is "another host", never "SameSite".)
- Cookie header order: longer path first, then earlier creation time (RFC 6265 §5.4 step 2), then name.
- A `Set-Cookie` with the same name, domain and path replaces the old cookie and keeps its creation time
  (RFC 6265 §5.3 step 11).
- Log in while the request already carries a live session: the shop answers "already logged in" and sets no cookie.
  With a dead or no `sid` it creates a new session and a new `sid` that replaces the old cookie.
- Request without an initiator (typed, reopened browser): same-site (6265bis, *(check)*).
- Several `sid` values: the shop reads the first one sent.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | HTTP is stateless: the server recognises a returning browser only by what the browser sends, here the session ID in the `sid` cookie. No `sid`, or one with no row: anonymous. | RFC 6265 §1, §3, §8.4; RFC 9110 §3.3 *(check)* |
| 2 | The browser attaches a cookie when the request host domain-matches it (host-only cookies: the same host, case-insensitive), the request path path-matches its path, and it has not expired. | RFC 6265 §5.1.3, §5.1.4, §5.4 |
| 3 | `Secure` cookies only over `https`; `HttpOnly` cookies are not visible to page scripts (the browser card lists what scripts on the current page see). | RFC 6265 §4.1.2.5, §4.1.2.6, §5.4 |
| 4 | A cookie without `Expires`/`Max-Age` is a session cookie, dropped when the browser closes; `Max-Age=3600` keeps it until `now + 3600`; an expired cookie is removed from the jar. | RFC 6265 §4.1.2.1–2, §5.3 steps 3 and 11 |
| 5 | SameSite on a cross-site request (initiator's site ≠ target's site; site = the last two labels of the host here): `Strict` never; `Lax` only on a top-level navigation (a link, or a form that navigates the tab) with a safe method (`GET`/`HEAD`), not on a POST or a subresource; `None` always, and a `None` cookie without `Secure` is refused at storage. No `SameSite` is treated as `Lax` here (as some browsers do; others still treat it as `None`). Same-site requests: always. | RFC 6265bis (draft-ietf-httpbis-rfc6265bis-22, in the RFC Editor queue, *(check)*) §5.6.7, §5.8.3 *(check)*; Lax-by-default: MDN "SameSite cookies" (vendor behaviour, *(check)*) |
| 6 | The session lives on the server: log out deletes the row; the old `sid`, even still in the jar and sent, logs no one in. | RFC 6265 §8.4 (the server keeps the state, the cookie carries a nonce); task |

## Params

`sameSite` Strict / Lax / None (default Lax); `persistent` (Max-Age=3600 vs a session cookie, default off): the
attributes the shop puts on `sid`; changing them recomputes the run at the same step. `acts` (no control; set by the
presets and the action keys). Steps = number of actions, at most 20; a key press past step 20 is refused.

## Presets and expected numbers

Checked with a scratch script before the page, and in `sim.test.js` (golden test per preset).

| Preset | Params | Steps | Run (expected) |
|---|---|---|---|
| 1 `login-browse` | `acts=GPKKG` | 5 | 1 anonymous `GET /katalog`, no Cookie line; 2 `POST /prijava` → `Set-Cookie: sid=a1b2; Path=/; Secure; HttpOnly; SameSite=Lax`; 3–5 each carry `Cookie: sid=a1b2`, cart 1, then 2; step 5 shows ana with 2 items. Clock 10:05. |
| 2 `lax-link-vs-form` | `acts=PDOG` | 4 | 2 the link (cross-site GET navigation) carries `sid=a1b2`: ana; `tema=tamna` stored from drugi.example, not sent to the shop (domain); 3 the form (cross-site POST) carries no `sid`: anonymous, nothing added (verdicts Strict ✗ Lax ✗ None ✓); 4 ana, cart 0. |
| 3 `strict` | `acts=PGDG`, `sameSite=Strict` | 4 | 3 the link carries no `sid`: arrives anonymous while session `a1b2` still exists; 4 browse from the shop itself carries it: ana. |
| 4 `browser-closed` | `acts=PGXG` | 4 | 3 close: `sid` (no Max-Age) dropped, session `a1b2` still on the server; 4 no Cookie line, anonymous. With `persistent` on: `sid` expires 11:01 (`now` 60 + 3600), survives, step 4 carries it: ana. |
| 5 `logout` | `acts=PGQG` | 4 | 3 `POST /odjava` with `sid=a1b2` deletes row `a1b2`, no `Set-Cookie`; 4 `GET /katalog` still carries `Cookie: sid=a1b2`, no row: anonymous. |

## Out of scope

CSRF tokens (named in the explanation and the `None` form caption as the server-side defence), third-party cookie
blocking, the `Domain` attribute, `__Host-`/`__Secure-` prefixes, the browsers' two-minute "Lax+POST" allowance,
JWT-in-cookie designs, tracking, server-side session expiry.
