<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cookies-sessions: notes

New stepper (task `docs/tasks/w3/cookies-sessions.md`, catalogue `inet-cookies-sessions`, §4.2, wave 3). Rules,
tie-breaks and expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the request text, the jar and the session table are page panels beside and under it.

## Decisions

- **Layout.** Left: the K1 chart with three lanes, drugi.example (D, c4), the browser (c1) and trgovina.example (T, c6),
  and under it the cookie jar (name=value chip, domain, path, flags, expiry, and whether it went with this step's
  request and if not, why). Right: this step's request to the shop as text (who started it, same-site or cross-site,
  navigation or form; request line, Host, Cookie; status line, Set-Cookie), the SameSite comparison for `sid` on this
  request (Strict / Lax / None, each ✓ or ✗ with the word, the current setting outlined), and the shop's session table.
- **One step = one user action**, as the task says. The two actions from drugi.example (D link, O form) are two
  exchanges in one step: the browser loads drugi.example's page, then the cross-site request goes to the shop. That
  gives drugi.example's lane real messages and its own cookie `tema=tamna` (rule 2: each site gets only its own; the
  default-Lax case of rule 5 is in the jar as "(Lax)").
- **Action keys** P G K D O X Q instead of the task's L B X F Q O: L, B, F and C are kit keys (language, blank, full
  screen, panel). P log in (prijava), G browse (catalogue), K add to cart (košarica), D link from drugi.example,
  O drugi.example's form (obrazac), X close the browser, Q log out.
- **"Taking effect at the next step".** The run is the param `acts` (one letter per action; a preset sets it). A key
  pressed at step n makes that action step n + 1 and drops the rest of the run (pressing two keys at one step: the
  last wins). The browser card shows it as "Next" with the changed mark. Past 20 steps a key does nothing and the
  card and caption say so. The preset stays selected, so R restores its run.
- **Chips.** Filled = sent with the request, dashed = in the jar and not sent (on the chart: held back by SameSite,
  path or Secure; another host's cookies are not listed on an arrow), dotted and struck = expired or dropped this
  step. Each has its word in the jar's last column too (sent / SameSite=Lax / other host / closed / expired), so colour
  never carries it alone (grayscale checked).
- **Every shop answer is 200 OK.** What changes is whom the shop answers as; an anonymous add to cart gets the login
  page, not an error status (status codes are `http-exchange`'s concept).
- **Logout does not clear the cookie** (no `Set-Cookie: sid=; Max-Age=0`): the task's `logout` preset needs the old
  cookie still sent at step 4 to show rule 6. The caption says so ("It sends no Set-Cookie, so the old cookie stays in
  the jar"), and the explanation says logout must end the session on the server.
- **Session IDs** are fixed (`a1b2`, `c3d4`, …) so the model stays deterministic; real IDs are long and random. Not
  stated on the page (noise for the concept).
- **Forms are always on a shop page.** P, K and Q with no page open (step 0, after X) start from the shop (same-site);
  only a browse (G) with no page open is typed into the address bar (no initiator).
- **Lax and forms.** A form that navigates the tab is a top-level navigation; Lax refuses the drugi.example form only
  because it is a POST. A GET form would carry the cookie (tested; no action sends one).
- **Default Lax** (no SameSite attribute) is what some browsers do; others still treat it as None. The jar models the
  Lax default and shows it as "(Lax)"; the explanation says both, without naming browsers.
- **A cookie set in this step** shows "new (Set-Cookie)" in the jar, not "sent" or "no request": it was not in the
  jar when the request left. The SameSite comparison line appears only when the jar held the shop's `sid` before the
  request.
- **Expiry vs close.** A close step says which session cookies were dropped and, separately, which cookies expired;
  a request step that evicts an expired cookie says so too.
- **Log in while logged in** sets no new cookie ("already"); with a dead `sid` (after log out) it makes a new session
  and the new `sid` replaces the old cookie.
- **Comparison (lesson: run each variant).** The SameSite line shows all three values for the current request. For
  `persistent`, the caption at a close step and at any request whose outcome would differ says what the other setting
  gives (the page replays the run with `persistent` flipped, `Simdeck.stateAt`).
- **HttpOnly** shows in the browser card as "page scripts see: …" for the current page (the shop's `sid` is
  HttpOnly, so: nothing) and as the eye-crossed badge in the jar. `Secure` (rule 3) is in the model and tested; every
  request here is HTTPS, so no preset shows a refusal.
- **Subresource requests** (rule 5, Lax not sent) are in the model and tested; no action makes one (a third-party
  image would bring in tracking, out of scope).
- **The clock** starts at 10:00, +1 min per request action, +5 min per close ("closed and reopened five minutes
  later"); `Max-Age=3600` set at 10:01 expires at 11:01.
- **Phone:** the columns stack; the jar table keeps its rows on one line and scrolls inside its own box.
- **Related:** `http-exchange`, `tls-handshake`.

## Deviations from the task

- Action keys P G K D O X Q (see above); the task's L, B and F are reserved by the kit.
- `login-browse` starts with an anonymous page view (step 1), then log in, two adds to cart and a view: the task's
  "log in, three page views each carrying sid, cart 2 items, 5 steps" with the stateless first request in front.
- `lax-link-vs-form` is log in, link, form, browse (4 steps); `strict` log in, browse, link, browse; both as the task
  describes, with a log-in step first.
- State adds `open`, `nextSid`, `log`, `ev`, `verdicts`, `changed`, `gone` and per-cookie `created` to the task's
  state (the chart, the captions and the marks read them); `lastRequest` adds `path`, `initiator`, `crossSite`,
  `header` and `decisions`.
- **Reuse from `http-exchange`:** its model is not in `models/` and nothing in it fits as is (its server is a
  virtual-host/resource table); only the message-line display (`Name: value`, request line / status line bands) is
  reused as page code, no model functions were copied.

## Sources

- RFC 6265 §1, §3 (overview, a session ID in a cookie), §4.1.2.1–2 (Expires, Max-Age), §4.1.2.5–6 (Secure,
  HttpOnly), §5.1.3–4 (domain and path match), §5.3 (storage: session cookie, replace keeps creation time, expired
  eviction), §5.4 (Cookie header: which cookies, order). From memory; the rules match the RFC text as I know it.
- draft-ietf-httpbis-rfc6265bis (Cookies: HTTP State Management Mechanism): -22, December 2025, in the RFC Editor
  queue, no RFC number yet (datatracker, checked 2026-11-12 by web search). SameSite Strict/Lax/None, Lax on top-level
  safe-method navigations, None requires Secure.
- MDN "Set-Cookie", "SameSite cookies" (default Lax in current major browsers): from memory.
- Course books: UL ch21 "Kako web-poslužitelj dolazi do odgovora" (request/response, header fields), URM ch14 "HTTP i
  HTTPS"; UL ch22 uses *kolačić* for cookie. No course book covers cookies.
- Numbers checked with a scratch script over all five presets (and `browser-closed` with `persistent`) before the page.

## Unchecked *(check)*

- RFC 6265 section numbers above (from memory) and RFC 9110 §3.3 for statelessness.
- 6265bis section numbers for SameSite (§5.6.7 / §5.8.3 in recent drafts) and that a request with no initiator
  (typed into the address bar) counts as same-site.
- Default Lax for cookies without SameSite: Chromium-based browsers do it; other engines' current default *(check)*.
  The two-minute "Lax+POST" allowance of some browsers is out of scope and not modelled.
- Term pairs below marked *(check)*.

## Term pairs

Missing from `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

| en | hr |
|---|---|
| cookie | kolačić (UL ch22) |
| session ID | oznaka sjednice |
| stateless | bez stanja |
| cross-site request | zahtjev s drugog sjedišta *(check)* |
| cookie jar | spremnik kolačića *(check)* |

`session` (sjednica) is in the glossary and used as `[[session]]`.

## Shared requests

- **Kit: page state in the URL without a control** (as `http-exchange` asked): `acts` changed by the action keys is
  not kept across a reload or the language switch (the preset's run comes back). A param type for page-set state kept
  in the URL would fix both sims.
- **Kit: button groups.** Seven action buttons overflow the panel at 1920×1080; the page lays the settings group out
  in two columns with its own CSS. A kit option (`columns: 2` on the controls, or a button row) would make it shared.
- **K1: fields under the chip.** Cookie chips beside a long request chip (`POST /kosarica` + `sid=a1b2`) reach the
  receiver's lifeline on a three-lane chart (same request as `http-exchange` and `wifi-association`).

## Checks

- Tests: 41 (five tie-breaks first, rules 1–6 with the model functions and in runs, the five presets' expected
  numbers, the hollow chips, the typed initiator, the fields the page reads (ev, page, chart rows, close vs expiry),
  item numbering, the key press, the session IDs, then the template's generic block over three runs). Mutation pass on
  a copy: 35 mutations (reason order, expiry boundary, header order by path and by
  creation, replace keeps creation, already logged in, no initiator, first sid, domain case, path match, Secure,
  HttpOnly, close keeps session cookies, Max-Age, Strict, Lax POST, Lax method, None, default Lax, None needs Secure,
  logout, stale sid, anonymous cart, eviction on request steps, clock, persistent and SameSite params ignored, tema
  every time, held chips, key press keeps the rest, no step limit, typed initiator, SID order, site of): all fail a
  test (two survived the first pass, Lax without the method check and request-step eviction; tests added). After the review, 45 mutations (adding the review's survivors: ev.sid, ev.cart,
  ev.deleted, logout leaving the user, cross flag, status, item numbering, close/expiry split, form initiator, Lax for
  GET forms, ev.expired): all fail a test.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and RFC 6265 / 6265bis, ran its own
  mutations on a copy and drove every preset headlessly in both languages, toggling both params and pressing every
  action key (no console errors). Fixed from it: the Set-Cookie line printing "[object HTMLSpanElement]" on every log
  in, the jar calling a freshly set sid "sent" (re-login) or "no request" (first log in), the SameSite line saying
  "sent" with no sid in the jar, the close caption calling an expired persistent sid a session cookie, forms "typed"
  into the address bar, Lax refusing a GET form, RFC 6265 §8.6 → §8.4 for rules 1 and 6, "browsers today read no
  SameSite as Lax" (only some do), a logout clause that real shops also clear the cookie, 15 page-read fields without
  a test, dead state fields (`summary.from`, `resRow.view`, `reqRow.stale`, `reqRow.site`), and wording: "u zaglavlju"
  for "redom", "postavlja … koji preglednik šalje samo njemu", "ide / ne ide", "druga domena", "nestao zatvaranjem",
  "odgovara korisniku", "no cookie for the shop", "Other site's link/form", the Strict hint, clitic order in
  capAltPersist, and the CSRF sentence.
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages; plus my own of every preset's key step in
  both languages, a key press after the end, and the phone stack. Fixed on the way: the panel overflowing (two-column
  action buttons, shorter button names), the request field and the shop's word overlapping on the arrow (the word
  dropped; the shop card says it), the Set-Cookie chip using the "not sent" style, the jar breaking words on the phone.

## Time

Start 01:12, done (gate, mutation pass, fresh review and its fixes) 01:45: about 33 minutes, one session (the fresh
review ran about 9 of them, in parallel with writing these notes).
