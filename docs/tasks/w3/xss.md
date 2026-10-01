# xss: Cross-site scripting

| | |
|---|---|
| Task | `xss` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-xss` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/xss/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `security` / `attacks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **stored vs reflected; output encoding**.

The student: post a comment with a script.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use OWASP guidance; the request/response model comes from URM ch14 (below). Mark every rule you could not check with *(check)* and list it in `NOTES.md`.
- OWASP: *Cross Site Scripting (XSS)* (stored vs reflected) and *Cross Site Scripting Prevention Cheat Sheet* (context-correct output encoding, HttpOnly, CSP); OWASP Top 10 A03:2021 Injection.
- URM ch14 „HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (the request/response the page is built on; `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`).

## Model and presets

- **Scene:** a comment page: a text box where a visitor posts a comment, a server store (a list of saved
  comments), and a "what another visitor's browser renders" pane split into DOM-as-text and DOM-as-tree. The
  injected markup is tinted. A toggle selects output handling: none (raw), HTML-encoded, or textContent. A second
  mode shows reflected XSS (the input comes back in the URL / search results, not stored). Stepper.
- **State:** `{ kind: 'stored'|'reflected', encoding: 'none'|'htmlEncode'|'textContent', input, stored: [],
  rendered: {asText, nodes}, scriptRuns, cookieStolen, note }`; "runs the script" is simulated by a flag and a
  log line, never by evaluating anything.
- **One step:** 1 attacker posts a comment containing `<script>…</script>` or an `onerror` attribute; 2 server
  stores it (stored) or reflects it into the response (reflected); 3 victim opens the page; 4 the browser parses
  the response; 5 with no encoding the injected node becomes part of the DOM and its script "runs"; 6 the script
  reads `document.cookie` and sends the session cookie to the attacker; 7 switch encoding on: the same input is
  shown as visible text, no node, no script.
- **Rules:**
  1. The browser decides code vs text by HTML structure at parse time; unencoded input that contains markup
     becomes markup (OWASP *Cross Site Scripting (XSS)*).
  2. Stored XSS: the payload is saved and runs for every later viewer; reflected XSS: it runs only for a victim
     who follows a crafted link (OWASP; same categories as the catalogue entry).
  3. Context-correct output encoding is the fix: HTML-encode `< > & " '` for HTML body context; attribute, URL and
     JavaScript contexts each need their own encoding (OWASP *XSS Prevention Cheat Sheet*).
  4. `textContent` / treating input as data (not `innerHTML`) removes the category for the body case (OWASP).
  5. An HttpOnly cookie cannot be read by `document.cookie`, which blunts step 6 (OWASP; links to `mfa-phishing`
     session-cookie theft).
  6. A Content-Security-Policy that forbids inline scripts stops the injected `<script>` even if encoding is
     missed (defense in depth, OWASP) *(check: model as a toggle, note it is secondary)*.
  Tie-break: identical stored comments render in post order; the malicious one is marked in the list.
- **Params:** `kind` choice stored/reflected (stored); `encoding` choice none/htmlEncode/textContent (none);
  `payload` choice `<script>steal()</script>` / `<img src=x onerror=steal()>` / plain comment (script);
  `httpOnly` toggle (off); `csp` toggle (off). The comment text is a page-level field (note in NOTES.md).
- **Presets:**
  - `stored-raw` stored, no encoding, `<script>` payload: the script runs for the next viewer and the cookie is
    sent. OWASP canonical stored example, outcome derived.
  - `reflected` reflected via a crafted URL, no encoding: runs only for the victim who clicks the link. OWASP.
  - `img-onerror` `<img src=x onerror=…>`: shows that removing `<script>` is not enough; event handlers run too.
    Derived.
  - `encoded` same payload, htmlEncode on: rendered as literal text `&lt;script&gt;…`, nothing runs. From OWASP
    prevention guidance.
  - `httponly` stored-raw but HttpOnly on: the script runs but `document.cookie` is empty for it. Derived.
- **Steps:** `stored-raw` 7, `reflected` 7, `img-onerror` 7, `encoded` 5, `httponly` 7.
- **Legend:** user input (tinted), rendered as live node (bold outline), rendered as literal text (plain), script
  "ran" (marker + log), cookie exfiltrated (token leaving), changed (kit highlight on nodes/log lines added this
  step).
- **Captions:** hr: "Bez kodiranja izlaza komentar postaje čvor u stablu stranice, a ne tekst." / en: "Without
  output encoding the comment becomes a node in the page tree, not text." — hr: "HTML-kodiranje: isti unos sada se
  prikazuje kao doslovan tekst, skripta se ne izvodi." / en: "HTML encoding: the same input is now shown as literal
  text and the script does not run."
- **Terms:** cross-site scripting — *cross-site scripting* (XSS) / skriptiranje među stranicama *(check)*; stored
  XSS — pohranjeni XSS; reflected XSS — reflektirani XSS *(check)*; output encoding — kodiranje izlaza; session
  cookie — kolačić sesije *(check)*; DOM — DOM (stablo dokumenta); payload — teret *(check)*; sanitization —
  čišćenje unosa *(check)*.
- **Misconceptions:** removing `<script>` is enough (event handlers, `javascript:` URLs); input validation alone
  fixes XSS (output encoding is the fix); XSS only defaces the page (it runs as the victim).
- **Out of scope:** DOM-based XSS taint flow in detail, framework auto-escaping internals, CSRF, clickjacking.
- **Builds on `http-exchange`:** reuses its request/response and page-render view; new are the comment store,
  output encoding and the DOM text/tree panes.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh xss sims/xss` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/xss/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
