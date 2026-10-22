<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-exchange: notes

New stepper (task `docs/tasks/w2/http-exchange.md`, catalogue `inet-http-exchange`, §4.2, wave 2b). Rules,
tie-breaks and expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the message text and the server's tables are page panels beside it.

## Decisions

- **Layout.** Two columns. Left, the K1 chart with lanes Client (K) and Server (P). The client card says what kind of
  client it is, the request it will send next and what it got last; the server card shows how it decided the last
  response (`Host: www3.lab.example → www1.lab.example (default)`, `/ → 200`, or `no Host → 400`). Right, the current
  message as text in four labelled bands (start line, header fields, empty line, body; each band has its own left-edge
  pattern, every line ends in ↵ for CRLF), then "the client reads only the number" with the class badge and the
  ignored reason phrase. Under it the server's virtual hosts (name → document root, default marked) and the resource
  table of the virtual host that answered (path → class badge and status, content); the row looked up is outlined.
- **Two scenes, one per book.** `grafo` (URM: a browser, `www.grafo.hr`) and `lab` (UL: a command-line HTTP client,
  `192.168.180.1` with `www1`/`www2.lab.example`, the UL ch21 intro's names and pages). The preset picks the scene
  through a hidden param `script`; the composer shows the scene's paths and hosts only.
- **Two steps per exchange**, as the task says: the request, then the response. A 301's follow-up is the next
  exchange, so `redirect` is 4 steps and its caption at step 4 counts the two requests and two responses.
- **Status class** is never colour alone: each class badge has its text (`4xx`) and a border style (2xx/3xx solid,
  4xx dashed, 5xx double) on top of its colour; the response chip takes the class colour.
- **"Changed" marks** the new chart row, the header field that decided the outcome (`Location`, `Allow`), the
  follow-up request-line (it came from `Location`), the server card's decision line and the virtual host and resource
  rows used. The marks inside cards and text are a yellow fill with a thin outline, not the kit's halo, which covered
  the neighbouring lines.
- **"Empty Host" = Host left out.** UL ch21's example asks for an empty Host, which makes its client drop the line; the
  request then lacks Host, which is what RFC 9112 §3.2 answers with 400. The option is labelled "(left out)" and the
  page only says the request has no Host field (an empty Host value would be a different message).
- **Send (S).** The composed request is queued in the model param `sent` (one number, a digit per request), runs after
  the script, and shows at once as "next:" in the client card. S is refused (the client card and the last caption say
  so, without the reason) once the run would pass 20 steps or 8 queued requests. `sent` has no control: the kit keeps only controls in the
  URL, and a hidden range trips the page check's slider test, so queued requests are not kept across a reload or a
  language switch (`R` also clears them). See Shared requests.
- **POST** needed a target: `/obrazac` is a form program (GET shows it, POST is processed: 200). Other resources take
  only GET and HEAD, so POST gets 405 with `Allow` (RFC 9110 §15.5.6); a missing, hidden or unreadable resource
  answers 404/403 before the method is checked. After a 301 a POST is repeated as GET without the body.
- **5xx**: `/cjenik` is a program that fails (500), so all four classes the task's legend names appear in the tables.
- **Rule 8** is in the scene as `/skriveno` (a file the server hides: the same 404 as `/nema`); the
  `not-found-vs-forbidden` preset sets the composer to it, so S then → → shows it. The preset keeps the task's 4 steps.
- **Rule 3, two Host fields** is in the model (400 on any version; a missing Host only on HTTP/1.1) and tested, but
  not offered in the composer (no client builds it on purpose); its caption exists.
- **Captions** at the second `host-missing` response say what changed (the same request, one line more: a page instead
  of 400); other default-host answers say the code will not tell a wrong page. The 400 caption says the default virtual
  host exists and is not used: HTTP/1.1 requires Host.
- **Unknown codes (rule 5)**: the client's reading (`readAs`) is tested (451 → 400, 299 → 200); no resource sends one,
  the explanation states it.
- **Related:** `tls-handshake`, `tcp-handshake`, `dns-resolution` (existing sims only).

## Deviations from the task

- Composer params are split per scene (`pathG`/`pathL`, `hostG`/`hostL`) because a select's options are fixed; the
  preset's scene shows its own pair.
- The scene tables add `/obrazac`, `/cjenik` (grafo) and `/skriveno` (lab), and the host choice adds `www1`, `www2`,
  `www3.lab.example` beside `192.168.180.1`: needed for POST, 5xx, rule 8 and rule 4.
- `head-vs-get` sends GET first, then HEAD (the comparison reads better that way).
- 405 / `Allow` and POST → GET after 301 are not in the task's rules (needed for the method choice); SPEC.md says so.

## Sources

- URM `book/chapters/14-aplikacijski-sloj.md`: "HTTP i HTTPS: zahtjev, odgovor i siguran prijenos" (methods, five
  status codes), Primjer 3 (301 + Location → second request → 200). Figure `ch14-http-301-preusmjeravanje.png` not used
  (a capture tool screenshot).
- UL `book/chapters/21-web-posluzitelji.md`: Uvod (`www1`/`www2.lab.example`, `192.168.180.1`, the two pages), "Kako
  web-poslužitelj dolazi do odgovora" (definitions; the `Host:` 400/200 example; 200/403/404), "Šire o temi"
  (request-line, status-line, reason phrases, 403 vs 404), Primjer 3 (unknown name → first virtual host, 200).
- RFC 9110 §9.3.1–9.3.3, §15 (classes, x00, reason phrases), §15.4.2, §15.5.4–15.5.6; RFC 9112 §2.1, §3, §3.2, §4,
  §5: from memory, no network in this session.
- Numbers checked with a scratch script over all five presets before the page was written.

## Unchecked *(check)*

- RFC section numbers above are from memory.
- That a client repeats a POST as GET after 301 (RFC 9110 §15.4.2: "for historical reasons, a user agent MAY").

## Term pairs

All terms used are in `kit/glossary.js` (`request and response`, `request-line`, `status-line`, `header field`,
`status code`, `virtual host`, `origin server`, `resource`). None missing.

## Shared requests

- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as `cert-chain` does).
- **Kit: page state in the URL without a control.** A param type for state the page sets itself (here the queued
  requests), kept in the URL and across the language switch. A hidden `range` would do it, but
  `check-page.mjs` clicks the first range in the controls and fails when it is hidden; it could skip hidden ones.
- **K1: fields beside a short arrow.** A long field (`Host: www1.lab.example`) beside the request chip runs past the
  receiver's lifeline on a two-lane chart. An option to put fields under the chip would keep them inside the arrow
  (wifi-association asked for the same on left-running arrows).

## Checks

- Tests: 27 (three tie-breaks first, rules 1–8, POST/405, the fields the page reads (decision, shown, marks, server
  tables, composer choices), the redirect limit, the presets' step counts, a golden test of every message of every
  preset and their events, the step shape and `pending`, the send queue round trip and its limits, then the template's
  generic block). Mutation pass on a copy: 31 mutations (both vhost tie-breaks, case-sensitive names, no
  400 for two or for none, 400 for HTTP/1.0, hidden → 403, unreadable → 404, method before lookup, HEAD with body or
  without Content-Length, no Location, following by reason phrase, POST kept after 301, follow-up to another host,
  unknown codes kept, class by last digit, length in characters, request-line order, no empty line, POST everywhere,
  500 → 200, no redirect following, queue order and position, no step limit, pending kept, POST length, no Allow, a
  redirect body): all 31 fail a test; with the review's survivors added (decision host and path, shown, the Allow mark,
  `program`, the server tables, the redirect limit, hops, the start event, the SP before an empty reason, a 405 without
  Content-Type, two Host fields on HTTP/1.0), 47 mutations, all fail a test.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and RFC 9110/9112 (all rules
  confirmed, byte counts too), ran its own mutations on a copy and drove every preset headlessly in both languages,
  pressing S at the end (no console errors). Fixed from it: a Croatian plural ("21 bajtova"; now Content-Length is
  quoted), the 400 caption implying the server could not pick a virtual host (it has a default; HTTP/1.1 requires Host),
  a caption describing one client's handling of an empty Host, the POST request caption naming only Host, "finds under
  its root" for a program, the second `host-missing` caption, "20 steps at most" when the 8-request cap applied, two
  Host fields refused only on HTTP/1.1, dead state (`exchange`, `ev.k`, `ev.via`, `ev.last`, unused `shown` fields,
  302), Croatian "ne pozna" → "ne poznaje", "meta" → "cilj zahtjeva", doubled brackets after glossary terms, "the
  reason phrase means nothing" → "is for people; the client does not interpret it", and the summary's "200 is not
  always success" → "not always the page you wanted"; tests for the page-visible fields it found unpinned.
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages; plus my own of `redirect` 2 and 4,
  `wrong-vhost` 2, `head-vs-get` 4, `not-found-vs-forbidden` after S (6 steps) and `redirect` with S pressed until
  refused (20 steps, the chart dropping 9 earlier rows). Fixed on the way: hidden controls showing, the kit's halo
  covering card lines, a placeholder used twice in a caption (moved node), a receiver word clipped at the client lane,
  the English title wrapping to two lines, path cells breaking mid-word on the phone.

## Time

Start 10:20, done (gate, mutation pass, fresh review and its fixes) 10:46: about 26 minutes, one session.
