# oauth-flow: OAuth 2.0 / OIDC authorization code flow

| | |
|---|---|
| Task | `oauth-flow` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-oauth-flow` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/oauth-flow/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `internet` / `authentication` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **who sees what: browser, app, identity provider**.

The student: step a login with a third-party IdP.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers OAuth or OpenID Connect. Related: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` Primjer 3 (redirect with `Location`) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Tko je to, i smije li: autentikacija, nadzor pristupa i revizija"
- RFC 6749 "The OAuth 2.0 Authorization Framework" §1.2, §3.1.2, §4.1, §10.12; RFC 6750 (Bearer tokens) §2.1; RFC 7636 (PKCE) §4; RFC 9700 "Best Current Practice for OAuth 2.0 Security" §2.1 (check number and section)
- OpenID Foundation, "OpenID Connect Core 1.0" §2 (ID token), §3.1 (authorization code flow)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view K1 message sequence chart with four lanes: the user's browser, the client application ("Fotoalbum", `app.example`), the identity provider / authorization server (`idp.example`), and the resource server (API, `api.example`). Front-channel messages (through the browser, as redirects) are drawn differently from back-channel ones (server to server). An "attacker sees" overlay can be switched to "what the browser sees", "what the app sees", "what the IdP sees".
- **State:** `{ i, msgs: [{ from, to, channel: 'front'|'back', fields }], app: { state, codeVerifier, tokens|null }, idp: { session, codes: { code: { clientId, redirectUri, challenge, used } } }, browser: { url, history[] }, outcome|null }`.
- **One step:** one message, in order: (1) user clicks "log in"; (2) app redirects the browser to the IdP's authorization endpoint with `response_type=code`, `client_id`, `redirect_uri`, `scope` (incl. `openid` for OIDC), `state`, `code_challenge`; (3) user authenticates **at the IdP** and consents; (4) IdP redirects the browser back to `redirect_uri` with `code` and `state`; (5) app checks `state`; (6) app sends the code and `code_verifier` to the token endpoint over the back channel; (7) IdP returns an access token (and an ID token for OIDC); (8) app calls the API with the bearer token; (9) API answers.
- **Rules:**
  1. The user's password goes only to the IdP; the app never sees it (RFC 6749 §1.2, §4.1).
  2. The authorization code travels through the browser (front channel); tokens travel only on the back channel between app and IdP (RFC 6749 §4.1.2, §4.1.3–4.1.4).
  3. `state` returned with the code must equal the value the app sent, otherwise the app rejects the response (CSRF protection) (RFC 6749 §10.12).
  4. PKCE: the app sends `code_challenge` = BASE64URL(SHA-256(`code_verifier`)) at step 2 and the verifier at step 6; the IdP issues tokens only if they match, so an intercepted code alone is useless (RFC 7636 §4).
  5. The IdP redirects only to a pre-registered `redirect_uri` exactly matching the request (RFC 6749 §3.1.2; RFC 9700 §2.1, check).
  6. A code is single-use and short-lived; a second use is refused (RFC 6749 §4.1.2).
  7. The access token is presented to the API as `Authorization: Bearer …`; the API trusts the IdP, not the app (RFC 6750 §2.1). The ID token tells the app who the user is (OpenID Connect Core 1.0 §2, §3.1).
- **Params:** toggle `pkce`, default on; buttons `tamper-state` (key T), `steal-code` (key X, a third party presents the code without the verifier), `wrong-redirect` (key W), each queued for the next run (`resets: true`); choice `view` browser/app/IdP for the overlay.
- **Presets** (derived from the RFCs, unchecked):
  1. `normal` — full flow: 9 messages; the browser history shows the code once and never a token; the app gets access + ID tokens; API returns the album list.
  2. `state-mismatch` — the `state` coming back differs: the app stops at step 5 with an error; no token request is made.
  3. `stolen-code-pkce` — a third party presents the code without the verifier: the IdP answers `invalid_grant`; the legitimate app's request still works.
  4. `stolen-code-no-pkce` — same with PKCE off and a public client: the IdP cannot tell the difference (shows why PKCE is now recommended for all clients, RFC 9700 §2.1.1, check).
  5. `wrong-redirect` — request with an unregistered `redirect_uri`: the IdP refuses at step 2 and does not redirect.
- **Steps:** `normal` 9; `state-mismatch` 5; `stolen-code-pkce` 8; `stolen-code-no-pkce` 8; `wrong-redirect` 2.
- **Legend:** front-channel arrows dashed through the browser lane, back-channel arrows solid, token chips (code / access token / ID token, each with a distinct shape), eye icon for the selected viewer; "changed" marks the message drawn and the value checked this step.
- **Captions:** hr: "Preglednik vraća aplikaciji samo kod. Žetone aplikacija dobiva izravno od davatelja identiteta, mimo preglednika, i to tek kad pokaže code_verifier." en: "The browser brings the app only the code. The app gets the tokens directly from the identity provider, outside the browser, and only after showing the code_verifier."
- **Terms:** *authorization server / identity provider* — poslužitelj za autorizaciju / davatelj identiteta (check); *authorization code* — autorizacijski kod (check); *access token* — pristupni žeton (check); *ID token* — žeton identiteta (check); *redirect URI* — adresa za preusmjeravanje; *scope* — opseg ovlasti (check); *consent* — pristanak.
- **Misconceptions:** "OAuth is a login protocol" (OAuth authorises access; OpenID Connect adds identity); "the app sees my password at the provider"; "the code in the URL is the token".
- **Reuse from `http-exchange`:** redirects (302/303 with `Location`) and request/response display; new here are the four parties, channels and token handling.
- **Out of scope:** implicit and password grants (deprecated), refresh-token rotation, token formats (JWT internals), client authentication methods, specific providers by name.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `oauth-flow` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh oauth-flow sims/oauth-flow` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/oauth-flow/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
