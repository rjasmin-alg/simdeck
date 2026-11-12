<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# oauth-flow: notes

New stepper (task `docs/tasks/w3/oauth-flow.md`, catalogue `inet-oauth-flow`, §4.2, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart** (`kit/sequence.js`),
with its eavesdropper column used as the "what X sees" overlay; "who holds what" and this step's messages written out
are page panels beside it.

## Decisions

- **Layout.** Left: the K1 chart with lanes browser (c1, square), app (c2), identity provider (c6), album API (c4)
  and, only when an attack is chosen, the third party (c8, `drugi.example`) on the right; the eavesdropper column
  titled "What the browser / app / identity provider sees". Right: "Who holds what" (password, state, code_challenge,
  code_verifier, code, access token, ID token × the lanes: ✓, — or struck when revoked; the viewer's column outlined,
  new holdings highlighted) and "Messages in this step" (sender → receiver, channel, then the HTTP lines: status or
  request line, `Host`, `Location` with its query one parameter per line, form or token fields).
- **One step = one message, but a redirect is two rows.** A front-channel redirect is a `302` to the browser and the
  browser's `GET` to the target; both are drawn (both dashed, both highlighted) in the same step, so the step numbers
  stay the task's 1–9 and the chart shows that a redirect really passes through the browser. Steps 2 and 4 have two
  rows; normal has 11 rows in 9 steps.
- **Front vs back channel** is a property of the row: front exactly when the browser is sender or receiver. Front
  arrows are dashed, back arrows solid (legend). Lane order is the task's (browser, app, IdP, API): the browser↔IdP
  arrows cross the app's lifeline without a tip there, and the eavesdropper column (view "app") says "does not see".
- **The overlay** (`view`: browser / app / IdP) fills the K1 eavesdropper column: the items a row carries (chips) when
  the viewer is sender or receiver, the bare message name for rows without secrets, "does not see" otherwise. The
  chosen lane's card is outlined (`state: 'active'`) and gets the eye icon; its column in "Who holds what" is
  outlined too.
- **Token chips** with distinct shapes, the value always written on them: code = square with a thick left bar (c7),
  access token = filled pill (c3), ID token = double border (c5), password = dotted `••••••`. Checked in grayscale.
  `state`, `code_challenge` and `code_verifier` are parameter names in mono, not chips (they are not credentials the
  task asks to trace by shape).
- **The third party.** All three attacks use one lane X (`drugi.example`): the forged callback (state), the stolen
  code (steal), the forged log-in link (wrong redirect). How the code leaks is deliberately not shown (concepts, not
  tools): a note on X "has the code" at step 4, and the caption says an address is not a secret.
- **state attack** = login CSRF (RFC 6749 §10.12): at step 4 a page of the third party sends the browser to the
  app's `redirect_uri` with its own code `M8k1` and state `zz91`, before the IdP's answer. The task said only "the
  state coming back differs"; drawing it from X shows why it would differ (the IdP never changes it).
- **wrong-redirect** = a forged log-in link from X with Fotoalbum's `client_id` and `redirect_uri=https://drugi.example/cb`;
  the IdP answers `400` with an error page and does not redirect (RFC 6749 §4.1.2.1). No OAuth error code is shown
  for it (the spec defines none for this case: the user is told, the client is not).
- **Attack control.** The task asked for three buttons; the page has a choice `attack` (none / forged state / stolen
  code / wrong redirect, `resets: true`) so the chosen attack is visible and kept in the URL, plus the keys T, X and W
  (`keys`), each toggling its attack and going back to step 0.
- **PKCE values** are RFC 7636 Appendix B's verifier and challenge; the model computes the challenge with its own
  pure SHA-256 + BASE64URL (tested against node's `crypto` over several lengths, including the 55/56/64-byte padding
  edges).
- **Revocation on reuse** (RFC 6749 §4.1.2 SHOULD) is modelled: in `stolen-code-no-pkce` the app's request at step
  8 revokes the thief's tokens; chips and the table show them struck, and the caption says it came too late.
- **A failed token request does not use up the code** (tie-break, *(check)*): needed for `stolen-code-pkce`
  (the app's later request works). The RFCs leave it open; servers differ.
- **API check** asks the IdP's token table (rule 7: the API trusts the IdP, not the app). An ID token presented as a
  bearer token is refused (`not-access`), a revoked one too; tested, not in a preset.
- **No clock.** The code's lifetime (at most 10 minutes recommended, RFC 6749 §4.1.2) is said in the step 3 caption;
  expiry is not modelled. A K1 timer on the IdP lane was tried and dropped: at five lanes it covered the arrowheads
  and chips arriving at the IdP.
- **"Who holds what"** shows ✓ / — per party (values are too wide for five columns at 1920×1080; they are in the
  chart, the overlay and the cell's tooltip). In the forged-state run the third party's own code and state are not
  Ana's: those cells are dashed and a line under the table names the values.
- **Comparison (lesson: run each variant).** The last step of either stolen-code run says what the other PKCE
  setting gives at step 7 and 9.
- **Phone:** the columns stack under the chart (the kit stacks the lanes); no sideways scroll at 375×812.
- **Related:** `http-exchange`, `cookies-sessions`, `tls-handshake`.

## Deviations from the task

- **Stolen-code presets have 9 steps, not 8**: steps 1–5 as normal, 6–7 the third party's token request and the
  answer, 8–9 the app's. Both runs line up row by row, and each ends with the app's outcome (tokens with PKCE,
  `invalid_grant` without).
- **wrong-redirect's step 1** is the third party's forged link (X→B `302`), not the user clicking "log in" in the app:
  the app itself would never send an unregistered `redirect_uri`.
- **Attack buttons** are a choice control plus keys T X W (above).
- State adds `log`, `holds`, `changed`, `pending`, `ev`, `app.got`, `app.user`, `app.error`, `idp.request`,
  `idp.tokens`, `idp.next`, `idp.issued`, `api` and `thief` to the task's state; `msgs` is `log` (messages and
  notes), `i` is `n`.
- **Reuse from `http-exchange`:** its model is not in `models/` and nothing in it fits (a virtual-host/resource
  table); only the display of redirects (`302` + `Location`) and message lines (request line, `Host`) is reused as
  page code. No model functions copied.
- **K1 view used as is**; no own drawing.

## Sources

- RFC 6749 "The OAuth 2.0 Authorization Framework": §1.2 (protocol flow), §3.1.2 (redirection endpoint, registration),
  §4.1 (authorization code grant: §4.1.1 request, §4.1.2 response, code lifetime ≤ 10 min recommended, single use and
  "SHOULD revoke", §4.1.2.1 error: do not redirect to an invalid redirect URI, §4.1.3 token request, §4.1.4 response),
  §10.12 (CSRF, `state`). From memory.
- RFC 6750 "Bearer Token Usage" §2.1 (`Authorization: Bearer`). From memory.
- RFC 7636 "Proof Key for Code Exchange": §4.1 (verifier 43–128 chars), §4.2 (S256), §4.6 (server verifies),
  Appendix B (the example values, reproduced exactly by the model and by node `crypto`).
- RFC 9700 "Best Current Practice for OAuth 2.0 Security" (January 2025): §2.1 (exact redirect URI matching),
  §2.1.1 (PKCE for all clients; PKCE downgrade: a `code_verifier` without a `code_challenge` must be refused). From
  memory *(check section numbers)*.
- OpenID Foundation, "OpenID Connect Core 1.0": §2 (ID token: `iss`, `sub`, `aud`, …), §3.1 (authorization code flow,
  `scope` with `openid`). From memory.
- Course books: no chapter covers OAuth or OpenID Connect. URM ch14 Primjer 3 (redirect with `Location`) for the
  302 display; URM ch18 "Tko je to, i smije li" for authentication vs authorization. Croatian terms below come from
  the task file, not the books.
- Numbers checked with a scratch script over all five presets (steps, rows, history, holders, outcome) before the
  page, and the challenge against node `crypto`.

## Unchecked *(check)*

- RFC 9700 section numbers (§2.1, §2.1.1) and the downgrade rule's exact wording.
- That a failed PKCE redemption leaves the code usable (implementation-dependent; tie-break above).
- Term pairs below marked *(check)*.

## Term pairs

Missing from `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

| en | hr |
|---|---|
| identity provider | davatelj identiteta *(check)* |
| authorization server | poslužitelj za autorizaciju *(check)* |
| authorization code | autorizacijski kod *(check)* |
| access token | pristupni žeton *(check)* |
| ID token | žeton identiteta *(check)* |
| redirect URI | adresa za preusmjeravanje |
| scope | opseg ovlasti *(check)* |
| consent | pristanak |
| front channel | prednji kanal *(check)* |
| back channel | stražnji kanal *(check)* |
| public client | javni klijent *(check)* |

`redirection` (preusmjeravanje) is in the glossary but not used as a `[[term]]`: the page needs "redirect URI" as a
unit.

## Shared requests

- **Kit: page state in the URL without a control** (as `http-exchange` and `cookies-sessions` asked): not needed here
  after making `attack` a choice, but the keys T X W would otherwise have lost it on reload.
- **K1: a way to say "passes through" a lane.** A front-channel redirect is drawn as two rows (`302` to the browser,
  then the browser's request). A row option drawing one arrow with a waypoint on the browser lane would halve the rows
  of redirect-heavy sims (OAuth, SAML, OIDC logout).
- **K1: lane cards at five lanes plus the eavesdropper column** are about 130 px wide at 1920×1080 with the panel open;
  host names wrap after the first label (the page inserts `<wbr>`). A compact card option (name and tags only) would
  help five-lane pages.

## Checks

- Tests: 40 (tie-breaks first: client before redirect URI, exact redirect matching, exact state, token check order,
  failed request keeps the code, reuse revokes, thief before app, who sees a row; then rules 1–7 in the model
  functions and over every attack × PKCE run, the five presets' expected numbers, the page's fields, then the
  template's generic block over all eight attack × PKCE runs).
- Gate: `npm run gate -- oauth-flow` passes (manifest, tests, build, browser 61/61, tokens, scope).
- Screenshots reviewed: gate's light, dark, grayscale and phone in both languages; my own of every preset's key step
  in both languages and the three views; the phone layout full length. Fixed on the way: message lines printed as "[object HTMLSpanElement]"
  (an array passed to `append`), the lanes too narrow (right column 23 → 18.5 rem, eavesdropper column 12 → 10 rem),
  table values truncated (now ✓), host names overflowing the card, the changed address box unreadable in dark mode.

- Fresh review (a separate agent, playbook §7.4): read the model, captions and explanation against SPEC.md and the
  RFCs, ran 55 mutations on a copy, and drove every preset × step × language × view headlessly (264 loads) plus the
  keys T X W: no console errors or stray text. Fixed from it: the forged-state caption claimed the app would log Ana
  into the third party's account, which PKCE would also stop (now "without this check, and without PKCE, …; with PKCE
  the foreign code fails only at code_verifier"); the misconception answer "without code_verifier the code is worth
  nothing" contradicted the no-PKCE preset; "PKCE recommended for every client" (required for public clients);
  "who holds what" mixing the third party's values with Ana's; the step 7 caption putting the PKCE check after the
  issue; the message box clipping the last line at step 2 (the duplicate-query line dropped); the code timer covering
  arrowheads (dropped); code chips wrapping per character on the phone; Croatian "nema ništa Anina",
  "izravno između poslužitelja", „…“ quotes, "kod u 1 adresi" plurals; English articles and "through the browser";
  four unused strings. Tests added for its six surviving mutations (ID token only with `openid`, user from the ID
  token, reuse revokes only that code's tokens, the third party's holdings and note, the app untouched by the
  thief's answer); rerun of all its mutations: every one killed except two equivalent ones (the code's stored
  `redirect_uri` is the only one possible; a `verifier !== undefined` guard that is always true).

## Time

Start 01:53, done (gate, fresh review and its fixes, mutation rerun) 02:30: about 37 minutes, one session (the fresh
review ran about 8 of them, in parallel with writing these notes).
