<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-status-codes: notes

Task `docs/tasks/w3/http-status-codes.md` (catalogue `ref-http-status`, §4.11). Rules, data and expected numbers:
`SPEC.md`.

## What it is

A reference poster (class `reference`, no steps): five columns, 1xx … 5xx, each headed by its letter badge (I, S, R,
C, E), the class name, whose problem it is and what an unknown code of the class is read as (x00). Under each, the
codes that matter as cards: code, reason phrase, a star for the book's five, one line of meaning. A class filter and
a core toggle dim the other cards (dashed, muted, never hidden). Clicking a card opens its example exchange in the
strip under the poster: the request, the response, the follow-up the client makes (if any), what the client does
after, the longer meaning, a note on the rule or misconception, how many requests and responses one click costs and
the RFC section. Five presets are the task's five views.

## Decisions

- **Layout.** Five equal columns; the 4xx column (7 cards) sets the height. The detail strip has a fixed height
  (12.5rem) so the poster does not jump when a card is clicked; one card shows exchange and text side by side, two
  (auth) side by side with the text beside each exchange, three (whose-fault) stacked in three columns. The panel
  is narrowed to 16rem (`--panel-w`) to give the columns room. Every state was measured for overflow at 1920×1080
  in both languages (the columns and the strip report no clipped content).
- **The mini request/response pair is on the detail strip, not on each card.** The task puts a mini pair on every
  card; with seven cards in the 4xx column, four lines per card do not fit one screen at ≥ 16 px. Cards keep code,
  phrase, star and one line of meaning; the pair, the follow-up and the counts open on a click (the task's
  "selecting a card shows its example exchange"). Recorded as a deviation.
- **Changed.** "Appeared with the last filter": the page keeps the previous active set and marks the cards that
  became active (`appeared(before, after)` in the model, tested). Selecting a card or `R` within the same active set
  leaves the marks; the renders before `mount` returns (the kit's preset pass and URL pass) only set the starting
  point, so a page loaded from any URL marks nothing.
- **Active cards are tinted** with their class colour (13 % mix on the panel); dimmed cards are plain, dashed and
  muted, the class border greyed. In grayscale the difference is solid vs dashed.
- **Hidden params** `view` (set by the presets) and `sel` (set by a click) keep the page state in the URL. Same
  page rule as `linux-dirs` for `.sd-ctl[hidden]` (shared request below).
- **A filter ends a view** (SPEC §5): a view is on while `class` and `core` are what its preset set. Changing a
  filter by hand turns the view off, and the page then clears the hidden `view` param (a microtask after the render),
  so setting the filter back does not quietly bring the view back with no preset marked.
- **Params from a hand-edited URL** (`?class=constructor&sel=999&view=__proto__`) fall back to each param's
  `value` (`all`, `none`, `''`), so the URL the kit writes back stays clean.
- **A click keeps the active preset** (`sim.set(…, { preset: sim.preset })`), so `R` returns to it; clicking the
  selected card again clears the selection and brings back the view's comparison.
- **Caption precedence:** a selection → `code phrase · meaning`; else the view's caption; else the filter's (class name and whose problem, the
  count with the core toggle, a line when a class has none of the five); else the default.
- **Class filter is a drop-down** (`select`): six options, and the kit's `choice` takes at most five.
- **Examples** use the book's site and paths (Primjer 3: `/proizvodi` → `/katalog`; Grafo d.o.o.). Request lines
  omit `HTTP/1.1` to fit. `Basic` is shown as the authentication scheme because it is the RFC's own example and a
  protocol token, not a product; the credentials are elided (`Authorization: Basic …`). `Upgrade: websocket` for
  101 is the protocol token of RFC 9110 §7.8's example, and the 101 response repeats `Connection: Upgrade` (§7.8:
  a sender of Upgrade MUST also send the `upgrade` connection option). No product named anywhere.
- **304's request is a conditional GET with `If-None-Match`**, as the task asks. The book's question 14 asks which of
  the five methods checks for a change (the book's text points at HEAD); the page does not answer it (it shows the
  conditional GET mechanism and RFC 9110 §15.4.5's "conditional GET or HEAD" in the card text), so no answer key
  appears. The `cache` preset is built on Q14's scenario, though, and shows GET, not HEAD: **owner to decide**
  whether that confuses students answering Q14 (report).
- **Question 15** (301 vs 302) is close to the poster's own content: d301/d302 paraphrase the RFC and the book's
  text. The 302 note was first a direct 301-vs-302 contrast ("unlike 301, next time the old address is asked
  again"); it is now neutral ("temporary: the Location holds for this request").
- **`(check)` is not on the page.** 429's RFC 6585 section is marked *(check)* here and in SPEC.md only: a builder's
  to-do marker is not for students.
- **Accessibility:** card buttons take their accessible name from their content (code, phrase, meaning); reason
  phrases carry `lang="en"` on the Croatian page.
- **Reason phrases stay English** in both languages (protocol data, `translate="no"`); their meaning is translated.
- **100 Continue's follow-up** is the rest of the same request (the body), not a new request: one request, two
  responses (an interim and the final one). The model's `messages()` counts this, and the strip says "the same
  request goes on".
- **Rule 2 on the page:** each column header says what an unknown code of the class is read as (x00); the model's
  `readAs()` also covers invalid codes (outside 100–599 → read as a server error) and is tested, but the page has no
  free-text code input (a second interaction for a poster).
- `aliases` include the codes students search for. `related`: `http-exchange`, `http-caching`.

## Deviations from the task

- Mini request/response pair: on the detail strip on click, not on every card (fit; see above).
- The `whose-fault` and `auth` views show their cards side by side in the detail strip (the task says "side by
  side"; the poster columns already sit side by side, the strip adds the exchanges).
- The `redirect` and `cache` views show their card's exchange (301, 304) in the strip when the preset loads (the
  view's `compare` of one card; a click elsewhere replaces it, a second click brings it back).
- Legend: class letter, core star, request and response arrows, changed. The class colours are in the column
  headers (letter badge + top border), not repeated in the legend.

## Sources

- URM ch14 `14-aplikacijski-sloj.md`, "HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (five methods; the five
  codes with RFC 9110 quotes, footnote `rfc9110-statusi`), Primjer 3 "preusmjeravanje adrese kataloga", questions
  14 and 15.
- RFC 9110 *HTTP Semantics* §15 (classes, x00 rule, invalid codes as 5xx, interim and final responses), §15.2.1–2,
  §15.3.1, .2, .5, .7, §15.4 (Location; the POST→GET note on 301/302), §15.4.2, .3, .5, .8, .9, §15.5.1, .2, .4, .5,
  .6, .10, §15.6.1, .3, .4, .5. Read in `~/projects/uvod-u-racunalne-mreze/references/chapter-03/rfc9110.txt` on
  2026-11-09; every section number checked there.
- RFC 6585 §4 (429 Too Many Requests, `Retry-After`): not available offline; from memory *(check)*.

## Unchecked

- 429's section in RFC 6585 (§4) *(check)*.

## Term pairs (not in `kit/glossary.js`; written out at first mention in the Croatian explanation, *English* (Croatian))

- method — metoda (URM ch14)
- server — poslužitelj (URM ch14)
- client — klijent (URM ch14)

Used from the glossary: `status code`, `redirection`, `header`, `request and response`, `resource`, `cache`.
"request / response" is in the glossary only as the pair `request and response`.

## Shared requests

- **kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css` (the same request as `linux-dirs`; 122 sim pages
  now carry the same page rule).
- **kit:** `choice` with six options (or a documented reason for the cap of five): a class filter `all` + five
  classes reads better as segmented buttons than as a drop-down.

## Checks

- `node --test sims/http-status-codes/sim.test.js`: 26 tests. Each rule and tie-break broken once on purpose (19
  mutations of `sim.js`), each caught. Survivors are equivalent mutants: `own(VIEWS, p.view)` → `VIEWS[p.view]` in
  `viewOf` (masked by the class/core comparison that follows), dropping `typeof` in `valid()` (a string fails the
  integer check anyway), and an x00 shortcut in `readAs` (same number).
- **Fresh review** (a separate agent, no context from the build): read the code against SPEC.md, the task and
  RFC 9110, and broke a copy of `sim.js` about 30 times. Fixed from it: tests now pin the whole SPEC §2 card table
  (phrases, RFC sections, request and response lines and headers, follow-ups, `after` notes), the cards'
  `active`/`selected` flags, a view with an unknown class or a non-true core, every class's "whose", the
  determinism check on a view's `compare`, and `header()` matching whole names (each re-broken and caught); 101's
  missing `Connection: Upgrade`; `realm` on Basic; a stale `view` param reviving a view; spurious "changed" marks
  on load from a preset URL with params; `undefined` written into the URL for unknown params; "(check)" shown on
  the page; the caption explaining 301 with an empty strip (`redirect`/`cache` now carry their card as `compare`);
  "a: b: c" double colons; the cards' `aria-label` hiding the meaning; `lang="en"` on phrases; Croatian wording
  (`informativni odgovor`, `nepoznati kod`, `šaljem samo traženi dio`, `nije se mijenjao`, `pozadinski
  poslužitelj`, `(metodu)`, server/client italicised at their first mention); a duplicate note string; the x302
  note (above). Kept: m403 "authenticated or not, no" (the task's wording; d403 says new credentials may help), the
  hidden selects' labels (never shown), "evo/šaljem" style choices.
- Page behaviour checked in a browser script: class 4xx → 5xx marks the four 5xx cards changed; all → 4xx marks
  none; core off after core on marks 17; a click keeps the preset and the changed marks; a second click deselects;
  key `3` loads `whose-fault`; a click inside it shows that card instead of the comparison.
- `npm run gate -- http-status-codes`: passes (46/46 browser checks, no exceptions declared); screenshots reviewed at
  1920×1080 light, dark, grayscale, and 375×812, in hr and en, plus every preset and the selections 100, 101, 307,
401, 502; every preset and card measured for clipped content in both languages.

## Time

Start 01:49, done 02:17 (2026-11-09, by the system clock): about 30 minutes, including the fresh review.
