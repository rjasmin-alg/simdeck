<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# oauth-flow: specification

One concept: **who sees what: browser, app, identity provider**. The student steps a log-in with a third-party
identity provider (OAuth 2.0 authorization code flow with PKCE, plus the OpenID Connect ID token) and watches which
party ever holds the password, the code and the tokens. Task: `docs/tasks/w3/oauth-flow.md`; catalogue
`inet-oauth-flow` (§4.2). Model: `sim.js`; tests: `sim.test.js`. Builds on `sims/http-exchange` (redirects as
`302` + `Location`, request lines); new here are the four parties, the two channels and the tokens.

## Scene

| Lane | Party | Host | Colour |
|---|---|---|---|
| B | the user's browser (user `ana`) | | c1, square |
| A | the client application "Fotoalbum" (`client_id=fotoalbum`, a **public client**: no client secret) | `app.example` | c2 |
| I | the identity provider / authorization server | `idp.example` | c6 |
| R | the resource server (the album API) | `api.example` | c4 |
| X | a third party, drawn only when an attack is chosen | `drugi.example` | c8 |

The IdP has one registered client: `fotoalbum` with the redirect URI `https://app.example/cb`. Every exchange is
HTTPS (named in the explanation, not drawn). Fixed values (the model is deterministic; real ones are random):

| Value | Here | Note |
|---|---|---|
| `state` | `x7f2` | the third party's forged one: `zz91` |
| `code_verifier` | `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` (43 chars) | RFC 7636 Appendix B |
| `code_challenge` | `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`, method `S256` | computed by the model's own SHA-256; equals RFC 7636 Appendix B and node's `crypto` (checked) |
| codes | `Q3p9`, `M8k1`, … in issue order | `M8k1` is the third party's own code (state attack) |
| access tokens | `at-5Kd2`, `at-9Wq4`, … in issue order | opaque |
| ID tokens | `eyJ…1`, `eyJ…2`, … in issue order | claims shown: `iss=https://idp.example`, `sub=ana`, `aud=fotoalbum` |
| scope | `openid albums` | `openid` makes it OpenID Connect |
| API answer | 3 albums | |

## State

`{ n, log[], app: { state, verifier, tokens|null, user|null, error|null }, idp: { session, codes: { code: { clientId,
redirectUri, challenge|null, user, used, tokens[] } }, tokens: { token: { kind, user, scope, code, revoked } } },
api: { last|null }, thief: { code|null, tokens|null }, browser: { url|null, history[] }, outcome|null, ev }`.

`log` is every chart row so far: messages `{ k: 'msg', n, from, to, channel: 'front'|'back', label, carries[] }`
(`carries`: `{ item, value }` with item one of `password`, `state`, `challenge`, `verifier`, `code`, `access`, `id`)
and notes `{ k: 'note', n, lane, what }`. `ev` says what this step did (the caption).

## One step

One message (or one check), in this order for `attack: none`:

| n | Rows (channel) | What |
|---|---|---|
| 1 | B→A `GET /login` (front) | the user clicks "log in" |
| 2 | A→B `302` `Location: https://idp.example/authorize?…` (front); B→I `GET /authorize?…` (front) | the app stores `state` and the verifier and sends the browser to the IdP with `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256`; the IdP checks client and redirect URI (rule 5) and shows its log-in and consent page |
| 3 | B→I `POST /login` (front): user, password, consent | the user authenticates at the IdP; the IdP issues code `Q3p9` bound to client, redirect URI, challenge and user |
| 4 | I→B `302` `Location: https://app.example/cb?code=Q3p9&state=x7f2` (front); B→A `GET /cb?code=…&state=…` (front) | the code comes back through the browser |
| 5 | note on A | the app compares `state` (rule 3) |
| 6 | A→I `POST /token` (back): `grant_type=authorization_code`, code, `redirect_uri`, `client_id`, `code_verifier` | |
| 7 | I→A `200` (back): `access_token`, `id_token` | rules 4, 6; the app now knows the user from the ID token |
| 8 | A→R `GET /albums`, `Authorization: Bearer at-5Kd2` (back) | |
| 9 | R→A `200` (back): 3 albums | rule 7 |

With `pkce` off, step 2 has no `code_challenge` and step 6 no `code_verifier`.

**Attacks** (param `attack`, keys T X W; each sends the demo back to step 0):

- `state` (T): steps 1–3 as above; at step 4 a page of the third party sends the browser to the app instead
  (X→B `302 Location: https://app.example/cb?code=M8k1&state=zz91`, then B→A `GET /cb?…`): its own code and a state
  the app never issued (login CSRF, RFC 6749 §10.12). Step 5 the app rejects it. **5 steps**, no token request.
- `steal` (X): steps 1–5 as above; at step 4 the third party also gets the code (note on X; how it leaks is not
  shown: concepts, not tools). Step 6 X→I `POST /token` with the code and no verifier; step 7 the IdP answers X;
  step 8 the app's own token request; step 9 the IdP answers the app. **9 steps**.
- `redirect` (W): step 1 a page of the third party sends the browser to the IdP with
  `redirect_uri=https://drugi.example/cb` (X→B `302`); step 2 B→I `GET /authorize?…`, I→B `400` error page: the IdP
  refuses and does not redirect. **2 steps**, no code issued.

**Tie-breaks.**
- Authorization request: unknown `client_id` is checked before the redirect URI; both refuse without a redirect.
- Redirect URI: exact string comparison (a trailing `/`, an added query or another letter case all fail).
- `state`: exact, case-sensitive comparison; a missing `state` is a mismatch.
- Token request, first failing check wins (all answer `400 invalid_grant`): unknown code, code already used, client
  differs, `redirect_uri` differs, PKCE (challenge stored and verifier missing or wrong; or a verifier with no
  challenge stored).
- A failed token request does **not** use up the code (*(check)*: the RFCs do not say; the task's
  `stolen-code-pkce` needs the app's later request to work).
- A second use of a used code is refused **and** the IdP revokes the tokens issued for that code (RFC 6749 §4.1.2
  "SHOULD revoke").
- The thief's request comes before the app's (steps 6–7 before 8–9).
- An ID token is issued only when the code's scope has `openid`; the app's user is the ID token's `sub`, never
  taken from the access token (no ID token: the user stays unknown).
- Who sees a message: its sender and its receivers; a note: its own lane. A party **holds** an item once it has
  sent or received a message carrying it, or made it (A: `state`, verifier and challenge; I: codes and tokens; B: the
  password, typed by the user).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | The user's password goes only to the IdP; the app never sees it. | RFC 6749 §1.2, §4.1 (resource owner authenticates with the authorization server) |
| 2 | The authorization code travels through the browser (front channel); tokens travel only on the back channel between app and IdP, never through the browser. | RFC 6749 §4.1.2, §4.1.3–4.1.4 |
| 3 | The `state` that comes back with the code must equal the one the app sent, else the app rejects the response and makes no token request (CSRF protection). | RFC 6749 §10.12 |
| 4 | PKCE: `code_challenge = BASE64URL(SHA-256(ASCII(code_verifier)))` sent at step 2, the verifier at step 6; the IdP issues tokens only if they match, so an intercepted code alone is useless. A verifier with no challenge stored is refused (downgrade). | RFC 7636 §4.1–4.2, §4.6; RFC 9700 §2.1.1 *(check)* |
| 5 | The IdP redirects only to a pre-registered `redirect_uri` that exactly matches the request; otherwise it informs the user and does not redirect. | RFC 6749 §3.1.2, §4.1.2.1; RFC 9700 §2.1 *(check)* |
| 6 | A code is single-use and short-lived (at most 10 minutes recommended; said in the caption, not modelled as a clock); a second use is refused and the tokens issued for it revoked (only that code's). | RFC 6749 §4.1.2 |
| 7 | The access token is presented to the API as `Authorization: Bearer …`; the API accepts a token the IdP issued and has not revoked, for a scope that covers it (it asks the IdP, not the app). An ID token is not an access token: the API refuses it. The ID token tells the app who the user is (`iss`, `sub`, `aud`). | RFC 6750 §2.1; OpenID Connect Core 1.0 §2, §3.1 |

PKCE is required for public clients and recommended for confidential ones (RFC 9700 §2.1.1 *(check)*). Fotoalbum is a public
client (no secret), so without PKCE nothing at the token endpoint tells the thief from the app.

## Params

`pkce` toggle (default on). `attack` choice none / state / steal / redirect (default none, `resets: true`; keys T,
X, W toggle their attack). `view` choice browser / app / idp (default browser): the K1 "eavesdropper" column shows
what the chosen party sees of each row. Steps: none 9, state 5, steal 9, redirect 2.

## Presets and expected numbers

Checked with a scratch script before the page, and in `sim.test.js` (one golden test per preset).

| Preset | Params | Steps | Expected |
|---|---|---|---|
| 1 `normal` | — | 9 | 11 chart rows; browser history 4 URLs, the code in exactly 1, a token in none; the app holds `at-5Kd2` and `eyJ…1`, user `ana`; the API answers `200`, 3 albums; password held by B and I only; access token by A, I, R only. |
| 2 `state-mismatch` | `attack=state` | 5 | step 5: `state` `zz91` ≠ `x7f2`, the app stops (`error: 'state'`); no row to `/token`; ana's code `Q3p9` unused; outcome `state-mismatch`. |
| 3 `stolen-code-pkce` | `attack=steal` | 9 | step 7 `400 invalid_grant` to X (no verifier), `Q3p9` still unused; step 9 `200` to the app with `at-5Kd2`; X holds no token; outcome `ok`. |
| 4 `stolen-code-no-pkce` | `attack=steal`, `pkce=false` | 9 | step 7 `200` to X with `at-5Kd2`; step 9 `400 invalid_grant` to the app (code used) and `at-5Kd2` revoked; X held the token from step 7; outcome `stolen`. |
| 5 `wrong-redirect` | `attack=redirect` | 2 | step 2 `400` from the IdP, no redirect, no code issued; nobody holds a code; outcome `refused`. |

The task said 8 steps for both stolen-code presets; here both are 9, so the two runs line up row by row (NOTES.md).

## Out of scope

Implicit and password grants, refresh tokens, JWT internals and signatures, client authentication methods
(client secrets), token introspection details, consent screens, specific providers, how a code leaks.
