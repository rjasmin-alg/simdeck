<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-caching: notes

New stepper (task `docs/tasks/w3/http-caching.md`, catalogue `inet-http-caching`, §4.2, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. The stage is kit view **K1, message sequence chart** (`kit/sequence.js`): lanes browser
(one or two), CDN edge, origin; each lane card shows what that cache holds, and the rows are the messages.

## Decisions

- **K1 for the task's "three boxes left to right".** The boxes are the lane cards; each card's body is the stored
  entry (ETag, `Cache-Control`, written at, the Age it arrived with, age vs lifetime with a bar, a fresh / stale badge).
  Filled (tinted, solid border) = fresh, hatched = stale, dashed and empty = nothing stored, each with its word, so
  grayscale keeps it. "Arrow length shows how far the request went": a browser hit has no arrow at all, only a note on
  its lane ("from cache, no request · Age: 30"); an edge hit stops at the edge lane; the rest reach the origin.
- **Responses:** 200 solid with the chip in c3 and `ETag · size`; 304 dashed and thin with the chip in c4 and "no
  body". The `Age` value is in the fields whenever a cache answered from its store. Requests carry `If-None-Match` in
  their fields when conditional.
- **The file has a size, not a body.** `/katalog` on `www.grafo.hr` (http-exchange's grafo scene) is 48 213 B at v1,
  48 977 B at v2, 49 302 B at v3, then +400 B per version (made up). A real page's size makes "304 sends no body" visible
  in bytes; the page's HTML would add nothing.
- **Age counts across caches** (SPEC rule 3). B's first copy comes from the edge with `Age: 120` while `max-age=60`, so
  it is stale the moment it arrives, and B keeps revalidating with the edge (the edge answers `304` with its own Age)
  until the edge itself revalidates. This is RFC 9111 §4.2.3 and is the honest consequence of the task's
  `max-age=60, s-maxage=300` preset; the captions say it plainly.
- **After a 304 from the edge's own store** the browser takes the 304's `Age` as its copy's new initial age (RFC 9111
  §3.2: the stored header fields are replaced by the 304's; §4.2.3). See *(check)* below.
- **No `Age` after a validation with the origin.** When the edge revalidated with the origin for this request and then
  answers the browser from its refreshed copy, it sends no `Age` (RFC 9111 §5.1: Age implies not validated by the origin
  for this request), so the browser's copy starts at age 0.
- **`no-cache` without `max-age`** has no explicit lifetime; heuristic freshness is out of scope, so the lifetime is 0
  and the copy shows "stale" with "no-cache: check before every use". It is stored (a 200 is heuristically cacheable,
  RFC 9110 §15.3.1, so RFC 9111 §3 allows storing it).
- **Schedule.** One browser: 4 requests, one `interval` apart. Two browsers: A 0, A 1, B 4, B 5, A 10, B 11 intervals
  (0, 30, 120, 150, 300, 330 s at 30 s): B's first request at 120 s is the task's; 300 s puts the edge exactly at its
  `s-maxage` (the tie again, on the shared cache); 330 s shows B's copy finally fresh after the edge revalidated.
- **Origin changes are steps of their own**, a third of the gap before the next request (20 s before the request at
  30 s, the task's changed-file time). The button **O** (key O) sets one before the next request; it is refused (said in
  the caption) at step 0, on a change step, twice for one gap, and past 20 steps. At the last request it brings one more
  request (two steps). The changes live in a hidden `changes` param (a bit per request), kept in the URL the way
  `distance-vector` keeps its events, so a link, a reload or L keeps a run the button made.
- **Changing `Cache-Control` or the interval keeps the step** (the kit recomputes the same point of the demo with the
  other header): "change headers" from the task. `browsers` resets.
- **The edge with no copy forwards the browser's `If-None-Match` unchanged** (RFC 9111 §4.3.2 forbids evaluating a
  precondition for a resource it does not hold) and passes the origin's 304 back (RFC 9110 §15.4.5). With a copy it may
  not use, it validates its own tag (the §4.3.2 union of tag lists is not used), then answers from its refreshed copy:
  304 if the browser's tag matches, else 200 with its body.
- **Captions** are composed per hop: the browser's decision, the edge's, the origin's, then what was stored or
  refreshed. They name the directive that decided (`max-age=60`, `s-maxage=300`) and the ages. The English caption for
  `max-age` step 3 follows the task's text.
- **The `edge-vs-browser` preset's "then private"** is the hint ("then try private"): switching `Cache-Control` to
  `private, max-age=60` at any step replays the same six requests with an edge that stores nothing.
- **Related:** `http-exchange`, `dns-ttl-cache` (the DNS analogue the task names), `cdn-anycast`.

- **The freshness tie.** RFC 9111 disagrees with itself at age = lifetime: the §4.2 formula
  (`freshness_lifetime > current_age`) makes it stale, the §4.2 prose ("has not yet exceeded") and §5.2.2.1 ("stale
  after its age is greater than") make it fresh. The task fixes the formula's reading and its `max-age` preset (a 304 at
  60 s) depends on it; SPEC rule 1 says so. Real caches differ by a second at most.

## Deviations from the task

- State shape: `caches` is keyed by lane id (`A`, `B`, `edge`) rather than `browser`/`edge`, because of the second
  browser; `lastPath`/`lastStatus` are `path` and `got.status` (`'hit'`, 200 or 304); `log` keeps every step's
  messages for the chart.
- The `interval` scales the two-browser schedule too (it is not otherwise used there).
- The `Cache-Control` hint under the control was dropped: the five options wrap to three rows and the panel did not
  fit at 1920×1080 with it.

## Reuse from `http-exchange`

`http-exchange`'s model is not in `models/`. Copied, with the comment `// from sims/http-exchange/sim.js @ 2281269`:
the start-line format (`startLine`) and the reason phrases (`REASON`, the two used here). The scene (`www.grafo.hr`,
`/katalog`) is the same. Nothing else was worth promoting; if the coordinator promotes an `http-message` model later,
this sim can take `startLine` and `REASON` from it.

## Sources

- UL `book/chapters/21-web-posluzitelji.md`: "Šire o temi" (STD 97 semantics, STD 99 HTTP/1.1, STD 98 caching) and
  the reverse-proxy paragraph (intermediaries used "da bi se posluživanje ubrzalo predmemoriranjem", RFC 9110). The book
  gives no caching rules.
- RFC 9111 (HTTP Caching, STD 98): §3 (storing; no-store, private, the "at least one of" list incl. heuristically
  cacheable codes), §3.2 (updating stored header fields from a 304), §4 (reuse; MUST generate Age), §4.2 (fresh iff
  freshness_lifetime > current_age), §4.2.1 (s-maxage for shared, else max-age), §4.2.3 (age = corrected initial age +
  resident time), §4.3.1–§4.3.4 (validation; If-None-Match; a cache evaluating preconditions; freshening), §5.1 (Age),
  §5.2.2.4 (no-cache), §5.2.2.5 (no-store), §5.2.2.7 (private), §5.2.2.10 (s-maxage). Read from the RFC text in this
  session (rfc-editor.org).
- RFC 9110: §8.8.3 (ETag), §13.1.2 (If-None-Match evaluation, 304 for GET), §15.3.1 (200 heuristically cacheable),
  §15.4.5 (304: no content; a proxy SHOULD forward the 304). Read from the RFC text in this session.
- Numbers checked with an independent Python hand model over all five presets (and `private` / `s-maxage` with one and
  two browsers) before the JS model was written; the JS model gave the same rows.

## Unchecked *(check)*

- **The browser's age after a 304 from the edge's store.** SPEC rule 3/5 takes the 304's `Age` as the copy's new
  initial age (RFC 9111 §3.2 replaces the stored header fields with the 304's, and §4.2.3 counts from the response
  time). Whether a given browser updates `Age` from a 304 is implementation behaviour; the RFC reading is what is shown.
  It matters at `edge-vs-browser` step 6 (B fresh with Age 30). The reviewer read §3.2, §4.2.3 and §4.3.4 the same
  way.
- The tie at age = lifetime (Decisions): the RFC's formula and prose disagree; the task's reading is used.
- The file sizes (48 213 B …) are made up *(derived)*.
- Croatian *fresh / stale* → svjež / zastario and *entity tag* → oznaka inačice come from the task's Terms, marked
  (check) there; not found in the course books.

## Term pairs (missing from `kit/glossary.js`; written out in the explanation)

| English | Croatian | Source |
|---|---|---|
| fresh | svjež | task Terms *(check)*; URM ch03 uses "još je valjan" for a cached answer |
| stale | zastario | task Terms *(check)* |
| revalidation | ponovna provjera | task Terms |
| conditional request | uvjetni zahtjev | task Terms |
| entity tag (ETag) | oznaka inačice | task Terms *(check)* |
| shared cache | zajednička predmemorija | task Terms |
| private cache | privatna predmemorija | by analogy with *shared cache* (this sim) |

Used from the glossary: `cache` (predmemorija), `origin server` (ishodišni poslužitelj), `header field` (polje
zaglavlja). The CDN edge is "rubni poslužitelj CDN-a", as `cdn-anycast` calls an *edge server*.

## Shared requests

- **K1: fields under the chip.** With four lanes a request's `If-None-Match: "v1"` beside its chip runs across the next
  lifeline (B → edge at 150 s); the line passes through the text. An option to put `fields` under the chip (asked
  already by `http-exchange` and `wifi-association`) would fix it.
- **Kit: hidden controls.** As in `http-exchange`, `visible: () => false` sets `[hidden]` but `.sd-ctl`'s display wins;
  the page adds `.sd-panel [hidden] { display: none }`.
- **Kit: page state in the URL without a control.** The `changes` param is a hidden choice whose options include the
  value read from the URL (the `distance-vector` way); a param type for page-set state would be cleaner.

## Checks

- Tests: 32 (three tie-breaks first: the private and the shared freshness tie and the change time; rules 2–8 one or
  more each; the schedule; the O button's refusals and its step growth; each preset's rows as a golden list; the log;
  the start lines; then the template's generic block). Mutation pass on the model (35 mutations: the tie, s-maxage
  ignored or applied to private caches, a lifetime without max-age, Age ignored on arrival, after a 304 and on edge
  hits, no-store, private and no-cache ignored, the edge's INM handling with and without a copy, the origin's tag
  comparison, a 304 with body bytes, refresh times, the edge not storing, the browser not sending INM or not using a
  fresh copy, the change not bumping the version or at another time, the two-browser schedule, the base request count,
  every O refusal, the 20-step cap, the path, case-sensitive directive names): all 35 fail a test. With the review's
  survivors added (a change step keeping the request fields, `decisions` and `got.by` wrong, the log version and size
  not following a change, the change time rounded, the size step, the O limit off by one and its two-step growth, an
  edge answering 200 to a browser that already holds the origin's version, a second browser cache, the origin's
  `Cache-Control` not from the param, `written` on a pass-through, the URL, a trailing change kept): 56 mutations, all
  fail a test.
- Fresh review (a separate agent, playbook §7.4): read SPEC against the task and RFC 9111/9110 (no wrong rule, every
  preset number confirmed, the Age-after-304 reading confirmed), ran its own mutations on a copy, and drove every step of
  the five presets in both languages plus `private`, two browsers, intervals 10–120 and O (no console errors; Croatian
  agreement correct). Fixed from it: no caption when a fresh edge answers 200 to a browser holding an older tag (now
  "fresh, but tagged "v2", not "v1"" and "B now holds "v2""), the tie's RFC conflict unstated, "i ETag" (case) →
  "i oznakom ETag", clitic order ("mijenja se", "potvrđen je"), lower-case change captions, "at exactly that age" in the
  explanation (now "from that age on"), a hand-made URL ending on a change cut off from its request, "written at" on a
  revalidated copy (now "written or revalidated at"), the changed outline touching B's tag; and the test gaps above.
  Left as is: fields crossing a lifeline on four lanes (Shared requests).
- Gate (`npm run gate -- http-caching`): passes; screenshots reviewed at 1920×1080 light, dark, grayscale and 375×812,
  both languages; plus my own of `max-age` 3 and 4, `changed-file` 4, `no-cache` 2–3 (one and two browsers),
  `no-store` 2, `edge-vs-browser` 3–6 and with `private`, O refused at step 0, O at the last step, and O pressed until
  the run was full (19 steps, the chart dropping 25 earlier rows, the refusal in the caption). No console errors.
  Fixed on the way: the panel 12 px too tall (hint dropped), `max-age=60` breaking at its hyphen on four lanes, the age
  bar squeezing its label, "fresh again" said under no-cache, the edge sentence naming `private` under `no-store`, the
  end caption offering O when O would be refused.

## Time

Start 10:51, done (gate, mutation pass, fresh review and its fixes, commit) about 11:20: about 30 minutes, one session.
