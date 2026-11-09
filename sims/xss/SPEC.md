<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# xss: specification

One concept: **stored vs reflected XSS; output encoding**. The student posts a comment with a script (or sends a link
with one) and follows it into another visitor's browser. Task: `docs/tasks/w3/xss.md`; catalogue `sec-xss` (§4.3).
Model: `sim.js`; tests: `sim.test.js`. Sources and unchecked items: `NOTES.md`.

## Scene

A blog post `/blog/42` with two comments (`#1 ana: +1`, `#2 ivo: :)`), a comment form and a search (`/blog?q=`). Three
parties: the attacker (`mallory`, server `evil.example`), the blog's server, and the victim's browser, logged in with
the session cookie `sid=7f3a9c21`. All names are illustrative.

**The input** is the `payload` choice — `<script>steal()</script>`, `<img src=x onerror=steal()>`, `+1` (plain, the
same text as comment #1) — or `own`: the page's text field (param `comment`, ≤ 60 characters). `steal()` stands for
the attacker's function: read `document.cookie`, send it to `evil.example`. The model never evaluates code: a run is a
flag and a log line; it reads the cookie when its code mentions `steal(` or `document.cookie`, and sends it only when
it calls `steal(` (`alert(document.cookie)` reads it and keeps it).

**The response.** Stored, the post page:

```
<ul id="comments">
<li id="c1">+1</li>
<li id="c2">:)</li>
<li id="c3">{input}</li>
</ul>
```

Reflected, the results page: `<h2 id="q">{input}</h2>` and `<ol id="results"></ol>`. `{input}` is pasted in as is
(`none`), HTML-encoded (`htmlEncode`), or left out (`textContent`: each slot is empty, the values come as data and the
page's own script sets `slot.textContent = value`). The browser's tree comes from a small HTML tokenizer: start and end
tags (an end tag closes the nearest open element of its name), quoted and bare attributes (a repeated name keeps the
first), void elements, comments `<!-- … -->` and bogus comments `<!…>`, `<?…>` (dropped), raw text elements up to their
end tag, any case (`script`, `style`, `xmp`; `textarea` and `title` also decode references), character references in
text and attribute values. An element still open at the end of the response is unterminated; an unterminated script
does not run. Every node records whether it starts in a character that came from the input. Not modelled: implied end
tags (`<li>` inside an open `li` nests), foreign content (`svg` children), dropping a tag cut off by the end of input
(here it is text).

## Steps

`steps = 7` when the output is `none` and the input makes at least one element in its place in the page; otherwise 5.
Defaults (stored, none, `<script>`): 7, the `sim.json` value.

| n | stored | reflected |
|---|---|---|
| 0 | start: two comments, the form holds the input | start: the search, the attacker's term |
| 1 | `post`: A → S `POST /blog/42` with the input | `link`: A → V a link `/blog?q={input}` |
| 2 | `store`: the server saves comment #3 as it arrived | `click`: V → S `GET /blog?q=` with the input |
| 3 | `open`: V → S `GET /blog/42` (with the cookie) | `reflect`: the server copies q into the page, saves nothing |
| 4 | `response`: S → V `200 OK` (with the CSP header when on); the browser parses: text and tree | same |
| 5 | `run`: the input's nodes are in the tree; what runs, is refused or waits — or `text`: nothing became a node (the last step of a 5-step run) | same |
| 6 | `exfil`: `steal()` reads `document.cookie` and sends `sid=7f3a9c21` to `evil.example` (V → A); or HttpOnly (empty); or the code reads the cookie and sends nothing (`read`); or nothing ran / the code does not read it | same |
| 7 | `fix`: the same input, HTML-encoded: text and tree again; the log keeps what happened | same |

## Rules

1. **Code vs text by structure.** The browser decides at parse time from the HTML's structure: unencoded input that
   contains markup becomes elements in the tree (OWASP *Cross Site Scripting (XSS)*). A parser-inserted `<script>`
   runs (unless unterminated). An element with a `src` and an `onerror` handler fires it: an injected `src` is taken
   not to load (`src=x` is not an image), so `onload` on it never fires; `onload` fires on `svg`, `body`, `iframe`,
   which load by themselves. Every other `on*` handler and a `javascript:` URL in `href`, `src`, `action` or
   `formaction` (any case, leading spaces and control characters, tabs and newlines inside ignored) are **armed**: they
   run only when the victim clicks or hovers, which the model does not do *(check: the event list is a teaching
   subset)*.
2. **Stored vs reflected.** Stored: the input is saved (comment #3) and is in the page for every later visitor of
   `/blog/42`. Reflected: nothing is saved; only a victim who opens the crafted link gets it; the same page without the
   link, or with another term, is clean (OWASP).
3. **Output encoding for the context.** For the HTML body, `& < > " '` become `&amp; &lt; &gt; &quot; &#x27;`, `&`
   first so nothing is encoded twice; the browser decodes them back to the literal characters in one text node, so
   nothing becomes a node and nothing runs. Attribute, URL and JavaScript contexts each need their own encoding:
   HTML encoding leaves `javascript:steal()` unchanged, and so does any encoding: for a URL the fix is to allow only
   `http`/`https` (OWASP *XSS Prevention Cheat Sheet*). The page shows only the body context; the URL case is in the
   explanation and a test.
4. **textContent.** The value is set as data; the browser never parses it, so any input — even one that would close
   the `li` — is one text node (OWASP).
5. **HttpOnly.** A script cannot read an HttpOnly cookie: `document.cookie` is empty for it, nothing is sent, but the
   script still ran as the victim (OWASP, the session-cookie theft step).
6. **CSP.** A policy without inline code (`script-src 'self'`) refuses the injected inline `<script>`, inline handlers
   and `javascript:` URLs (armed ones too: a click would be refused), and scripts from another origin; a `<script src>`
   from the page's own origin (`/x.js`) is allowed. The node is still in the tree and the flaw is still there (defence
   in depth, OWASP) *(check: modelled as a toggle; the real policy has more sources and directives)*. `blockedBy` is set
   only when something was refused; a refused run outranks an armed one in the step-5 note.

**Tie-breaks.**
- Identical comments render in post order (ids ascending, a new comment gets max id + 1); the store marks the comment
  that makes an element in its place, inside its `li` (⚠), never an identical plain one (`+1` twice: neither marked).
  The mark and the step count use the same judgement: `<b` is marked and gives 7 steps (the page's `</li>` closes the
  tag, as a browser would read it); `a < b` and `<i title="` are not and give 5.
- The step count follows the input in its place: `</ul>` alone or `a < b` makes no element → 5 steps; `<b>hi</b>`
  (markup, no code) → 7, step 5 "the input became markup", step 6 "nothing ran".
- Several runs are listed in document order, and within an element in attribute order.

## Presets (every number derived by the model; `sim.test.js` "presets")

| id | params | steps | outcome |
|---|---|---|---|
| `stored-raw` | stored, none, `<script>` | 7 | runs for the next viewer, cookie sent |
| `reflected` | reflected, none, `<script>` | 7 | runs for the victim who opened the link; an ordinary visitor's page is clean |
| `img-onerror` | stored, none, `<img onerror>` | 7 | no `<script>`, the handler runs, cookie sent |
| `encoded` | stored, htmlEncode, `<script>` | 5 | literal text `&lt;script&gt;…` in the response, one text node, nothing runs |
| `httponly` | stored-raw + HttpOnly | 7 | the script runs, `document.cookie` empty, nothing stolen |

Also checked: CSP on with either payload → 7 steps, node in the tree, `blockedBy: 'csp'`, nothing stolen;
textContent → 5 steps for any input.

## Misconceptions addressed

- Removing `<script>` is enough: `img-onerror`; the explanation adds `javascript:` URLs (armed in the model).
- Input validation alone fixes XSS: the explanation; the fix shown is output encoding at the output.
- XSS only defaces the page: step 6 (the session leaves) and the HttpOnly caption (the script still acts as the victim).

## Out of scope

DOM-based XSS taint flow, framework auto-escaping, sanitizer internals, CSRF, clickjacking, real exploit code.
