<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# reverse-proxy-lb: notes

New explorer (task `docs/tasks/w3/reverse-proxy-lb.md`, catalogue `inet-reverse-proxy-lb`, §4.2, wave 3). Rules,
tie-breaks and expected numbers: `SPEC.md`. No kit view fits a scene over a timeline (K2 has no time axis, K1 no
per-backend rows), so the page draws in HTML and CSS, with one SVG layer for the connecting lines.

## Decisions

- **Layout.** Above, the scene: client cards (each with its three requests as small chips, so affinity shows at a
  glance; the hash value or the cookie it holds), the proxy card (algorithm, its rule in one line, the 6 s wait, the
  check settings), backend cards (health badge with shape ▲/▼, service time, slow and fault tags, requests, errors,
  most connections open at once, a busy bar). Lines join clients to the proxy and the proxy to the backends, never a
  client to a backend (rule 1); a line to a backend marked down is dashed. Below, a 0–15 s timeline: the request row
  (`r5·c2` over a chip naming the backend, or a hatched `✕ 502` / cross-hatched `✕ 504`), then one row per backend
  with its requests as bars in stacked lanes, every health check (✓ / ✗, ▼ / ▲ in a box where it changed the
  state) and the marked-down time hatched with a red edge.
- **Lane height** grows into the height the scene leaves free (1.4–2.4 rem), so 4 backends with stacked lanes still
  fit one screen at 1920×1080.
- **Only b2 fails or is slow** (deviation). The task's params already said `slowB2` and `failB2At`; its sticky preset
  failed b1 instead. Keeping one "troubled" backend keeps the panel to nine controls; the sticky preset uses c2 and b2.
- **Two params added**: `failMode` (refuse → 502, hang → 504; rule 6 needs both, and UL ch21 Primjer 7 has both) and
  `failFor` (b2 works again after n s), without which `rise` would do nothing. Both show only when a failure time is
  set (`visible`), and the small controls sit two or three abreast, so the panel fits one screen.
- **Time origin**: rk at t = k s (r1 at 1 s), so `failAt` 1–9 lines up with r1–r9. The within-instant order (SPEC rule
  8: completions, failure, request, checks) gives the task's numbers: in `health-check` r8 at 8 s still meets b2,
  marked down at the 8 s check after it.
- **Proxy timeout 6 s**: longer than the slow b2's 5 s, so `least-conn-slow` has no 504s. The book's example waits
  3 s; this page says "waits at most 6 s".
- **Hash values** are fixed numbers (42, 37, 44) shown on the client cards, chosen so mod 3 gives b1, b2, b3, mod 4
  b3, b2, b1, and mod 2 over b1, b3 moves two of three clients (the task's "two of three").
- **`hash-remap`** removes b2 the way a balancer does, by failing its health check (fall 1, checks every 1 s), so the
  remap shows within one trace instead of between two param sets.
- **Sticky cookie** arrives with the successful response (a 502/504 sets none); a client whose cookie's backend is
  marked down goes by round robin and gets ↪ ("session lost"). The round-robin pointer moves only on round-robin
  picks.
- **Least connections, all fast**: b1 5, b2 4, b3 0. Two backends keep up with one request a second and ties go to
  the lower number, so b3 is never needed; the caption says why. This is the tie-break the task asked for, and it
  makes "a simplification" visible; the explanation says real balancers may break ties round robin.
- **"Changed"** (the kit's yellow halo with an ink outline) marks request chips and bars whose backend or status moved
  with the last param change. **↪** marks a request sent to a different backend than the client's previous one (hash)
  or than its cookie (sticky); not shown for round robin and least connections, where moving is the normal case.
- **Captions** (one or two parts per param set): a fault with errors is told in pieces: when b2 failed and when it
  was marked down ("only at d s, after k failed checks", "at d s, at the first failed check", "at once", "it works
  again at x s, before the checks mark it down", or "not before 15 s"), the requests *sent* to it before then, the
  requests that were *in flight* when it stopped, and "the fault is behind the proxy"; then the move sentence if
  clients moved. Otherwise a move alone, a fault no request met, or one per algorithm. `least-conn-slow` uses the
  task's caption with the model's numbers, only when least connections really gives b2 fewer than round robin would
  (with 4 backends both give 2: `capLCSlowEven`). Sticky with a slow b2 gets its own caption: c2's r5 leaves before
  r2's response and its cookie are back (`capStickyRace`).
- **Control labels**: "b2 otkaže / u 4 s · nikad", "Oporavak / za 2 s · nikad" (en "b2 fails / at 4 s · never",
  "b2 back / after 2 s · never"). The check interval stays "Provjera / 2 s" (en "Check"): "Provjera svakih" does not
  fit a third of the panel. "At most 0 connections" is not shown for an unused backend.
- **Sim.json entries:** `least-conn-slow` (balancing) and `health-check` (checks and 502), the two lessons.
- **Related:** `http-exchange`, `http-caching`, `cdn-anycast` (existing sims only; `cookies-sessions` does not exist
  yet).
- **Reuse from `http-exchange`:** nothing as code (`models/` is empty; its model is one exchange's message text). The
  status codes and the client/server role idea are restated in the explanation.

## Deviations from the task

- Only b2 can fail; the sticky preset pins c2 to b2 (task: c1, b1).
- Added params `failMode` and `failFor` (above). `failB2At` is called `failAt`.
- `hash-remap` takes b2 out by its health check (fall 1, checks every 1 s) rather than by changing the backend count.
- Labels: the term pairs are written out ("kružna raspodjela", "provjera ispravnosti", "vezana sjednica", "uravnotežitelj
  opterećenja") since the glossary lacks them.

## Sources

- UL `book/chapters/21-web-posluzitelji.md`, "nginx: drugi oblik konfiguracije…": definitions *posrednik*, *obrnuti
  proxy*, *pozadinski poslužitelj*; 502 vs 504 and Primjer 7 (stopped service → 502 "Connection refused"; a program
  that accepts and stays silent → 504 after the proxy's wait). Footnotes quote RFC 9110 §3.7, §15.6.3, §15.6.5.
- UL ch21 also uses "uravnotežitelj opterećenja" for *load balancer*.
- NLA `meta/toc.md` T54 (Raspodjela opterećenja; chapters not written).
- HAProxy Configuration Manual (`balance roundrobin|leastconn|source`, `cookie`, `check inter fall rise`, defaults
  2 s / 3 / 2) and nginx `ngx_http_upstream_module` (`least_conn`, `ip_hash`): from memory, no network in this session.
  No product name appears on the page.
- Numbers: every preset computed with the model before the page was written (a script over `initial()`), then pinned
  in `sim.test.js`.

## Unchecked *(check)*

- HAProxy's health-check defaults (`inter 2s`, `fall 3`, `rise 2`) and that least-connections ties are broken round
  robin there: from memory.
- "Removing a backend remaps most clients" holds for these three hash values; with plain modulo it holds in general
  only on average.
- Croatian terms not in the books: "provjera ispravnosti" (health check), "kružna raspodjela" (round robin),
  "vezana sjednica" (sticky session), "hash izvora" (source hash).

## Term pairs (missing from `kit/glossary.js`; written out in the explanation)

| English | Croatian | Source |
|---|---|---|
| load balancer | uravnotežitelj opterećenja | UL ch21 |
| health check | provjera ispravnosti | task Terms *(check)* |
| round robin | kružna raspodjela | task Terms *(check)* |
| sticky session | vezana sjednica | task Terms *(check)* |
| least connections | najmanje veza | simdeck |
| source hash | hash izvora | simdeck |
| cookie | kolačić | common usage; catalogue `cookies-sessions` |

`reverse proxy`, `intermediary`, `backend server` and `status code` are in the glossary and used as `[[terms]]`.

## Shared requests

- **Kit view: timeline with lanes** (bars on a shared time axis per row, stacked lanes, markers on a row, a hatched
  interval). `http-versions` and `delay-components` draw similar ones by hand; this is a third consumer.
- **Kit: `choice` that wraps** — four options with long words wrap onto a second row; the page shrinks the buttons'
  font with page CSS. A kit "compact" option for choices would do the same without page CSS.

## Checks

- Tests: 26 (seven tie-breaks first, rules 1–7, the fault window, the presets' numbers, caption keys, lanes, the
  params' ranges and defaults, preset values the controls can show, then the template's generic block). Mutation run
  on the model: 22 mutants, 17 killed at first; two real gaps found and pinned (hash modulus with 4 backends and one
  down, `maxOpen` at a completion instant), now killed. Three survivors are unreachable with these params: a cookie
  arriving at exactly the instant of the same client's next request (clients come back every 3 s, responses take 2,
  5 or 6 s), and "a pass resets the failure count" / "a failure resets the pass count" (b2 has a single failure
  window, so failures and passes never interleave). One equivalent (lane allocation seed).
- Gate: pass (48 browser checks, tokens, scope). Screenshots reviewed: the gate's light, dark, grayscale, 375×812 in
  both languages, plus my own of `sticky` (hr), `hash-remap` (en), `health-check` on the phone (hr), and 4 backends
  with a slow b2 that hangs at 3 s and recovers (en). Fixed on the way: the panel overflowing (1281 px → 862, by
  pairing small controls and showing b2's fault controls only when needed), a toggle's state text overflowing by 1 px
  on the phone, colliding axis numbers and clipped bar labels on the phone, the "✕ 502" mini chips, a recovered
  backend's badge reading "▲ down 4–10 s", the Croatian panel overflowing by 9 px with the recovery slider shown
  ("nakon 2 s" wrapped; now "za 2 s").
- Caption sweep in the browser: 1,752 param sets × hr/en (all algorithms, 2–4 backends, slow on/off, failAt 0–9,
  both modes, five check/recovery settings): no unfilled placeholder, no `undefined`/`null`, the page never scrolls,
  the panel and the caption always fit at 1920×1080.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md (no deviations), recomputed every
  preset by hand, ran 59 mutants (two real gaps: a 502/504 setting a cookie, least connections ignoring "marked down";
  both now pinned by tests; the rest killed or equivalent over all 489,000 param sets), and swept 104,832 param sets'
  captions in both languages. Fixed from it: `capSticky` false with a slow b2 (new `capStickyRace`); `capLCSlow`
  claiming "only 2, round robin would give 2" with 4 backends (new `capLCSlowEven`); fault captions saying "until then
  the proxy still sends it requests" about requests that were already in flight when b2 failed (now told apart), and
  "not marked down" when b2 had recovered first; "only at d s" when d was the failure time; Croatian plural verbs for
  lists, "dođe na red", "postavlja", "neuspjeli", "zauzeta najviše dva"; the term rule in the explanation (English in
  italics first, `[[hashing]]` for *hash*, no lowercase first word); "Oporavak za nikad"-style control values; the
  `capMovedHash` interval now names b2's return too; SPEC rule 6 says a hung request stays hung if b2 recovers.

## Time

Start 11:43, done (gate, fresh review and its fixes) 12:20: one session (about 40 minutes).
