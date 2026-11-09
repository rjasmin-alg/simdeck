<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# xss: notes

New stepper (task `docs/tasks/w3/xss.md`, catalogue `sec-xss`, §4.3, wave 3). Rules, tie-breaks and expected
numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart** (`kit/sequence.js`), as in
`http-exchange`; the form, the response text, the page tree and the log are page panels.

## Decisions

- **Layout.** Two columns. Left, the K1 chart with lanes Attacker (A, `evil.example`), Server (S) and the Victim's
  browser (V); the lane cards say what the attacker holds, the server's output mode and comment count, and the
  victim's cookie and what a script reads of it. Under the chart, the victim's browser log (what ran, what was refused
  or waits for a click, what was sent). Right, the comment form (or the blog search) with the saved comments (or the
  attacker's link) and who gets the input, then the response as text, then the page tree.
- **A real (small) parser, not canned trees.** `sim.js` tokenizes the response the way the browser decides code vs text
  (rule 1) and marks every node whose first character came from the input. The student's own text (param `comment`)
  gets an honest answer: `<b>` becomes a node with nothing to run, `<a href="javascript:…">` and `onmouseover` are armed,
  `</li>` alone makes no node.
- **The comment text is a page-level field** (the task's note), as in `sql-injection`: a text input on the stage
  writes param `comment` and sets `payload` to `own`. It is not in the URL (the kit keeps only control params), so it
  survives the language switch through `sessionStorage`, restored once and only into the same address. The stage is
  built once and refilled, so the field keeps focus and caret while typing.
- **"Runs" is a flag and a log line** (task): nothing is evaluated. A run reads the cookie when its code mentions
  `steal(` or `document.cookie`, and sends it only through `steal(`: own code such as `alert(1)` "does not read the
  cookie", `alert(document.cookie)` "reads it and sends nothing" (the caption then names `steal()` and HttpOnly).
- **Step counts.** 7 when the output is raw and the input makes an element in its place, else 5 (task: `encoded` 5,
  others 7). Step 7 is the fix: the same input HTML-encoded, shown in the two panes with the label "the same input,
  HTML-encoded", while the chart and log keep what happened. The default kind is stored, so `sim.json` `steps` is 7.
- **One message per step**: stored = post, save (a note on the server), open, response; reflected = link, the
  victim's request with q, the server reflects (a note), response. Step 3 of reflected is the server's note, so the
  "nothing is saved; a page without the link is clean" point has its own step.
- **textContent** sends empty slots (`<li id="c3"></li>`) and the values as data lines under the HTML
  (`c3.textContent = "…"`, JSON-quoted); the tree has the input as one text node. All comments go through it, not
  only #3, as a page that uses textContent would.
- **CSP** is a toggle on the server's response (`CSP: script-src 'self'` on the 200 row). It refuses the injected
  `<script>` and inline handlers; the node stays in the tree (marked ⛔) and steps stay 7, since the encoding is still
  missing (task: "secondary").
- **HttpOnly** marks the cookie in the victim's lane card; at step 6 `document.cookie` is empty for the script, and
  the caption says the script still acts as the victim.
- **Marking.** Input: a purple tint with a dashed underline (grayscale keeps the dashes). A node from the input: a
  thick ink outline and bold. Literal text: in quotes, plain. Code that ran: ▶ (refused ⛔, armed ◇). The cookie leaving:
  a pill with a double danger border. "Changed": the kit's yellow fill on the lines, nodes, comment and log line of
  this step (a thin outline instead of the halo, which covered neighbouring lines), and the kit's changed chart row.
- **Names are data.** Paths, HTML, cookie and host names are in `translate="no"` elements; the seed comments are
  `+1` and `:)` so they read in both languages. The plain payload is `+1`, the same as comment #1, which shows the
  tie-break (identical comments in post order, only markup marked).
- **Phone.** The kit stacks the lane cards; notes on the victim's lane (the rightmost lifeline) grow to its left on
  one line (`:has(> .xs-nv)`), otherwise they wrapped below the row and the chart dropped rows.
- **Related:** `sql-injection` (the same "input becomes code" idea), `http-exchange` (the request/response),
  `cors` (same-origin rules). The task links session-cookie theft to `mfa-phishing`, which is not in `sims/` yet: add
  it to `related` when it lands.

## Deviations from the task

- `payload` has a fourth option, `own` (the page-level field); the task names three choices plus the field.
- The task's scene says "DOM-as-text and DOM-as-tree"; the text pane shows the **response** as text (what the browser
  receives and parses); the tree pane is the DOM. For textContent the response has empty slots and the values come
  as data, so the text pane alone would not show where the input went.
- Steps: the task's step 2 for reflected is "the server reflects it", step 3 "the victim opens the page". Here the
  victim's request (with the input in the URL) comes first, then the server's reflection: a server can only reflect
  what a request brought. Seven steps either way.
- Rule 1's "the injected node becomes part of the DOM and its script runs" is step 5; with CSP on it is "refused", with
  an armed handler "waits for a click". The task's presets do not reach those two; they are reachable by the toggles
  and the own field.

## Model reuse

`http-exchange`'s model is not in `models/`, and nothing of it is needed as code: this sim reuses its *view* (K1
lanes for the parties, one message per step, request line and status chip) and its request/response framing, not
its functions. No code copied; no promotion needed. If `models/` gets an HTTP message model later, the four messages
here could be built with it.

## Sources

- OWASP, *Cross Site Scripting (XSS)* (attack page): stored and reflected XSS, the browser cannot tell the injected
  script from the page's own; consequences (session cookie theft). From memory, no network in this session.
- OWASP *Cross Site Scripting Prevention Cheat Sheet*: output encoding for the HTML body (`& < > " '` →
  `&amp; &lt; &gt; &quot; &#x27;`), different encodings for attribute, URL and JavaScript contexts, safe sinks
  (`textContent` instead of `innerHTML`), HttpOnly and CSP as defence in depth. From memory.
- OWASP Top 10 2021, A03:2021 Injection (XSS is in it). From memory.
- WHATWG HTML Standard: tokenization (script data is raw text up to `</script>`; void elements; character
  references); scripts inserted with `innerHTML` do not run, but event handler content attributes do. From memory.
- CSP Level 3 (W3C): `script-src` without `'unsafe-inline'` blocks inline `<script>` and inline event handlers. From
  memory.
- URM ch14 „HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (`uvod-u-racunalne-mreze/book/chapters/14-…`): the
  request/response the page is built on; the book has no XSS, cookie or session terms (checked with grep).
- Numbers checked with a scratch script over the five presets, CSP with both payloads, textContent and plain, before
  the page was written; then 19 mutations of `sim.js`, each failing at least one test (the fresh review below ran a
  wider set).

## Unchecked *(check)*

- Section names of the OWASP pages and the cheat sheet's exact character list are from memory.
- The event model (which handlers fire without user action) is a teaching subset: `onerror` with a failing `src`,
  `onload` with a `src` or on `svg`/`body`/`iframe`; everything else is "armed".
- CSP is modelled as one toggle (`script-src 'self'`) that refuses every injected inline run, also `javascript:` URLs.
- Croatian terms marked *(check)* in the task: *skriptiranje među stranicama* (cross-site scripting), *reflektirani
  XSS* (reflected XSS), *kolačić sesije* (session cookie; the glossary's `session` is *sjednica*, from the Linux book —
  for the web, *sesija* is what the other web sims use), *teret* (payload; not used on the page: "unos" instead),
  *čišćenje unosa* (sanitization).

## Term pairs

Missing from `kit/glossary.js`, written out in `strings.js` (hr: the English term in italics, the Croatian in
parentheses, in the explanation):

| en | hr |
|---|---|
| cross-site scripting (XSS) | skriptiranje među stranicama |
| stored XSS | pohranjeni XSS |
| reflected XSS | reflektirani XSS |
| output encoding | kodiranje izlaza |
| session cookie | kolačić sesije |
| DOM | DOM (stablo stranice) |
| sanitization | čišćenje unosa |

## Shared requests

- **Kit (K1):** a note row could carry its lane as a data attribute (`data-lane`) so a page can style notes per lane
  without wrapping the text in a marker span and using `:has()`. Optional; the workaround is in the page CSS.

## Fresh review

A fresh reviewer read the code against SPEC.md and the task, recomputed every preset (all correct), fuzzed 120,000
random inputs (no crash, state always JSON-safe, `steps()` always agreeing with step 5) and ran 64 mutations; 25
survived. Fixed after the review:

- **Reading the cookie was counted as sending it**: `alert(document.cookie)` ended in "stolen". Now only `steal(`
  sends; `document.cookie` alone gives step 6 `read` (new caption, log line and chart note).
- **`onload` fired on a failing `src`** (`<img src=x onload=…>`); now only on `svg`, `body`, `iframe`.
- **An unclosed `<script>` ran**; now it is unterminated and does not run.
- **Comments and raw text elements** were parsed as markup (`<!--<script>…-->` ran, `<textarea><script>…` ran);
  comments and bogus comments are dropped, `style`/`xmp`/`textarea`/`title` hold text.
- **The store's ⚠ mark** judged the comment alone while the step count judged it in its place (`<b`); both now judge
  it inside its `li`.
- Minor parser points: a repeated attribute keeps the first, `javascript:` with tabs and in `formaction`, CSP allows a
  same-origin `<script src>`.
- Page: run markers attach to the element (by document order), not to every element with the same tag name; the
  "onerror on an image" caption only for `onerror` (another handler names its event); armed code under CSP is
  "refused", not "waits for a click"; reflected mode says "the search term", not "the comment".
- Wording: the URL context is fixed by allowing only http/https, not by an encoding (explanation, SPEC rule 3);
  `reachLink` points at "a search for anything else", not `/blog/42`; no double colon in the step-7 caption; hr
  *rukovatelj događajem*, "Ni sama provjera ulaza", no comma before "i svaki sljedeći"; an overstatement here about
  the text pane equalling the serialised DOM.

Tests were added for every surviving mutant that was a real gap (ten new tests); a second run of 36 mutants aimed at
the new code and the old survivors: every one fails a test. Not changed (listed in SPEC as not modelled): implied end
tags, foreign content, a tag cut off by the end of input.

## Time

Start 05:03, done 05:34 (model, page, gate, screenshots of every preset in both languages, dark, grayscale and phone, fresh review with 64 mutations and a 120,000-input fuzz, its fixes and ten new tests): about 31 minutes by the wall clock, one session.
