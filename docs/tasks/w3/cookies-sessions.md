# cookies-sessions: Cookies and sessions

| | |
|---|---|
| Task | `cookies-sessions` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-cookies-sessions` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/cookies-sessions/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM, SEC |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a stateless protocol remembers you; SameSite**.

The student: log in, browse, switch sites.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers cookies. Related: `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` "Kako web-poslužitelj dolazi do odgovora" (request/response, header fields) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` "HTTP i HTTPS"
- RFC 6265 "HTTP State Management Mechanism" §1, §3, §4.1.2, §5.3, §5.4; RFC 6265bis (IETF draft "Cookies: HTTP State Management Mechanism", SameSite; check current status and number)
- MDN Web Docs "Set-Cookie" and "SameSite cookies" (vendor documentation for current browser defaults)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a browser with its cookie jar (table: name, value, domain, path, flags `Secure`/`HttpOnly`/`SameSite`, expiry), two sites `trgovina.example` (shop, with a server-side session table `sid → user, cart`) and `drugi.example` (an unrelated site with a link and a form that point at the shop). Request/response arrows between them show the `Cookie` and `Set-Cookie` header lines.
- **State:** `{ now, jar: [{ name, value, domain, path, secure, httpOnly, sameSite, expires|null }], sessions: { sid: { user, cart[] } }, page: { site, loggedInAs|null }, lastRequest: { from, to, method, kind: 'navigation'|'subresource'|'form', cookieSent[] } }`.
- **One step:** one user action (log in, browse, add to cart, follow a link from the other site, submit the other site's form, close the browser, log out), in order: (1) the browser builds the request and decides which cookies to attach (rules 2–5); (2) the server looks up the session (rule 6) and answers, possibly with `Set-Cookie`; (3) the jar updates.
- **Rules:**
  1. HTTP is stateless; the server recognises a returning browser only by what the browser sends, here the session ID in a cookie (RFC 6265 §1, §3; RFC 9110 §3.3 statelessness, check).
  2. The browser attaches a cookie to a request whose host domain-matches and whose path path-matches the cookie, and that is not expired (RFC 6265 §5.4).
  3. `Secure` cookies are sent only over HTTPS; `HttpOnly` cookies are not visible to page scripts (RFC 6265 §4.1.2.5, §4.1.2.6).
  4. A cookie without `Expires`/`Max-Age` is a session cookie and is dropped when the browser closes (RFC 6265 §4.1.2.1–2, §5.3 step 3).
  5. `SameSite` (RFC 6265bis, draft; check current number): `Strict` → never sent on cross-site requests; `Lax` → sent on cross-site top-level GET navigations, not on cross-site POSTs or subresources; `None` → always sent and requires `Secure`. A cookie with no `SameSite` is treated as `Lax` by current major browsers (vendor behaviour, check).
  6. The session lives on the server: logging out deletes the row in the session table, so the old `sid`, even if still in the jar, no longer logs anyone in.
- **Params:** choice `sameSite` Strict / Lax / None, default Lax; toggle `persistent` (Max-Age=3600 vs session cookie), default off; buttons for the actions (keys L, B, X, F, Q, O), each taking effect at the next step.
- **Presets** (derived from RFC 6265 / 6265bis, unchecked):
  1. `login-browse` — log in → `Set-Cookie: sid=a1b2; HttpOnly; Secure; SameSite=Lax`; three page views each carry `Cookie: sid=a1b2`; cart has 2 items. 5 steps.
  2. `lax-link-vs-form` — from `drugi.example`: following a link (top-level GET) sends `sid` and the user arrives logged in; the other site's auto-submitted POST form does **not** send it, so the shop sees an anonymous POST. 4 steps.
  3. `strict` — same link with `SameSite=Strict`: the user arrives logged out, a reload from the shop itself shows them logged in. 4 steps.
  4. `browser-closed` — session cookie vs `Max-Age=3600`: after "close browser" the first is gone, the second still sent. 4 steps.
  5. `logout` — logout deletes session `a1b2` on the server; a request still carrying the old cookie is anonymous. 4 steps.
- **Steps:** as listed per preset.
- **Legend:** cookie chips (filled = sent with this request, hollow = in the jar but not sent, crossed = expired/deleted), lock badge for `Secure`, eye-crossed badge for `HttpOnly`; "changed" marks the jar row or session row touched this step.
- **Captions:** hr: "Obrazac s drugi.example šalje POST trgovini. Kolačić sid ima SameSite=Lax, pa ga preglednik ovom zahtjevu ne prilaže: trgovina vidi neprijavljenog korisnika." en: "A form on drugi.example POSTs to the shop. The sid cookie is SameSite=Lax, so the browser does not attach it: the shop sees an anonymous user."
- **Terms:** *cookie* — kolačić; *session* — sjednica; *session ID* — oznaka sjednice; *stateless* — bez stanja; *cross-site request* — zahtjev s drugog sjedišta (check); *cookie jar* — spremnik kolačića (check).
- **Misconceptions:** "the cookie holds my login" (it holds an ID; the session is on the server); "deleting the cookie logs me out on the server"; "SameSite blocks all requests from other sites" (it only decides whether the cookie is attached).
- **Reuse from `http-exchange`:** messages and header display; new here are the jar and the session table.
- **Out of scope:** CSRF tokens (mention as the server-side defence), third-party cookie blocking, `Domain` attribute subtleties, JWT-in-cookie designs, tracking.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `cookies-sessions` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh cookies-sessions sims/cookies-sessions` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cookies-sessions/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
