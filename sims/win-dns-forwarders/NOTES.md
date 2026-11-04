<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-forwarders: notes

New stepper (task `docs/tasks/w3/win-dns-forwarders.md`, catalogue `win-dns-forwarders`, §4.5.3, wave 3). Drawn with
kit views **K1** (message sequence chart, `kit/sequence.js`) and **K4** (rule table, `kit/ruletable.js`) for DC1's
decision panel. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step = one message.** A timed-out forward is one message with ✕ at the receiver; the forwarding timeout
  runs as a K1 timer on DC1's lifeline (⏱ 3 s) and the next message carries the later time. The timeout is not a
  step of its own.
- **Lanes by name** (K1 has at most six): `www.example.org` → PC-07, DC1, forwarder, root, `.org`, `example.org`;
  `fs1` and `crm` → PC-07, DC1, partner, forwarder, root. No run of those names reaches a lane that is left out (a
  test checks every message of all 96 param combinations against the lanes).
- **Decision panel = K4 in first-match mode.** Rows: cache, zone `corp.example`, conditional forwarder
  `partner.example → 10.20.0.53`, forwarder 1 `198.51.100.53`, root hints, implicit SERVFAIL. The model gives every
  row hit/false and a note (off, no recursion, a longer domain wins, ⏱ no answer); a timed-out forwarder row is
  marked `beaten` ("silent") and the next row decides. Rows configured off stay in the table with a tag, so the
  student sees what is missing. The table is evaluated when the query arrives and again after each timeout; the
  deciding row's mark says "waiting…" until the answer reaches DC1, then ✓ address / ✕ NXDOMAIN / ✕ SERVFAIL.
- **Table shape:** the check's name with what it applies to under it in the `#` column, one column "sends to", the
  K4 action column left empty. With a separate "applies to" column the table did not fit beside six lanes at
  1920×1080 (the mark column scrolled out of view).
- **"Rule that matched" badge** on DC1's card (zone / conditional / forwarder / root hints / cache / fail), marked
  changed when it changes; "down" badge and dashed card on the forwarder when it is down.
- **`repeat` param** (default off): the same name again 60 s after the first lookup ends, cache kept. The task's
  "internet 4 (+2 warm)" is the `internet` preset with repeat on (6 steps).
- **`no-recursion` preset added** (task rule 6 had a param but no preset): `crm` with recursion off → SERVFAIL at once
  although the conditional forwarder is set.
- **Recursion off → SERVFAIL** (Windows Server 2016 and later; older versions sent an upward referral to the root),
  conditional forwarders disabled too, `ra` clear.
- **Negative answers capped at 900 s** (`MaxNegativeCacheTtl`): the forwarder's NXDOMAIN for `crm.partner.example`
  carries the root's SOA (86400 / 86400), DC1 keeps it 900 s. The caption says both numbers.
- **Messages take 0 s**; only the timeouts add time. The client's own retries while DC1 waits are not shown (they
  belong to `win-dns-client-order`; the explanation says so).
- **Addresses** match `win-dns-client-order` (PC-07 10.0.0.57, DC1 10.0.0.10, fs1 10.0.0.21). The forwarder
  198.51.100.53 and the partner 10.20.0.53 / 10.20.5.8 are the task's; `.org` and `example.org` servers and
  `www.example.org` 203.0.113.80 are invented (documentation ranges).
- **Croatian terms:** "autoritativni" (task file, glossary `authoritative server`), not URM's "mjerodavni" that
  `dns-resolution` uses.
- **Names on the page:** Windows Server DNS features are the topic (forwarders, conditional forwarders, root hints,
  recursion); no command or cmdlet appears. The ISP's resolver is "the ISP's resolver", unnamed.
- **Tags:** `dns` (task); topic `windows-admin`, level `intro`, both in `tags.json`. Related: `dns-resolution`,
  `win-dns-client-order`, `win-dns-zone-types`.

## Deviations from the task

- **Lanes:** the task's seven lanes do not fit K1 (2–6); the lane set depends on the name (above).
- **Step counts:** `forwarder-down` is **9**, not 10 (one message per step, the timeout is not a step);
  `no-fallback` 3 as in the task. All other counts as in the task.
- **Presets:** seven, the task's six plus `no-recursion`. `internet` turns `repeat` on.
- **Param `repeat`** added (the warm repeat must be part of the run in a stepper).
- **Rule 6 rcode:** SERVFAIL (checked: Windows Server 2016+ default), the task left SERVFAIL/REFUSED open.
- **Rule 8 added:** a conditional forwarder whose targets all time out → SERVFAIL after 5 s (not reachable from the
  page; tested).
- **Rule 3 detail:** conditional forwarder targets get 5 s (`ForwarderTimeout`), server forwarders 3 s; KB 2834250's
  extra +1 s per later forwarder and 0.5 s overhead, and the 8 s `RecursionTimeout`, are left out (one forwarder).

## Reuse

- `dns-resolution` (soft dependency): `models/` has no DNS model yet. Copied into `sim.js` with the comment
  `// from sims/dns-resolution/sim.js @ a66760c`: `ancestors`, `valid`, `left`, `keyOf`, `find`, `put`, `hints`,
  `cachedAnswer`, `deepestNS`, `serve` (the hierarchy's TTL field renamed `ttlA` → `ttl`; the zone-cut match now uses
  `inDomain`). Their behaviour is covered by this sim's tests (expiry at 0 s left, root hints never expire, referral
  caching, the walk root → `.org` → `example.org`).
- New and promotable (pure, plain data, no strings): `inDomain`, `negTtl`, `resolvePublic`, `tableRows`,
  `evaluate(dc, cache, name, t0, failed)`, `sceneOf`, `initialFrom(scene)` + `step`, `run(scene)`. Tests build their
  own scenes (two forwarders, two conditional domains, two targets, no forwarders).

## Sources

- Microsoft Learn, "Forwarders resolution timeouts" (KB 2834250, checked online 2026-11-04): `ForwardingTimeout`
  3 s, conditional `ForwarderTimeout` 5 s, `RecursionTimeout` 8 s; after every forwarder fails, root hints unless
  recursion is disabled; SERVFAIL when time runs out.
- Microsoft Learn, "DNS: The forwarding timeout value should be 2 to 10 seconds" (default 3 s) and "DNS: The DNS
  server must have root hints or forwarders configured" (root hints off → SERVFAIL when forwarders do not respond).
- Microsoft, "Upward Referral Responses from Authoritative DNS Servers" (teamdhcp blog archive): recursion disabled →
  SERVFAIL by default from Windows Server 2016, upward referral before.
- Microsoft, "Disable recursion on the DNS server" / "Configure a DNS server to use forwarders": "Disable recursion
  (also disables forwarders)".
- Microsoft Learn, "Set-DnsServerCache": `MaxNegativeTtl` default 900 s; `MaxTtl` default 1 day.
- RFC 1034 §4.3.2, §5.3.3; RFC 1035 §7.4; RFC 2308 §5 (negative TTL = min(SOA TTL, MINIMUM)); RFC 9499 (forwarder).
- UL ch19 "Tko odgovara kad se pita za ime" (prosljeđivač, korijenski poslužitelji) through the glossary; the
  `dns-resolution` NOTES for the walk.

## Checks

- Numbers: an independent Python hand model (message count and end time per preset, the 900 s cap) gave internal
  2/0 s, partner 4, internet 4 (+2, 3540 s left), forwarder-down 9/3 s, no-cond-fwd 4 NXDOMAIN 900 s, no-fallback
  3/3 s, no-recursion 2, crm with cond off and forwarder down 5/3 s, before the model ran; the model agrees
  (`sim.test.js` "presets").
- Rule tests broken on purpose, 28 mutations one at a time (shortest conditional domain wins, last of two equal wins,
  domain match without the dot, 5 s / 3 s timeouts swapped, valid at 0 s left, zone skipped, cache skipped, the root
  hints box ignored, the box required without forwarders, root hints matching before the forwarders fail, NXDOMAIN
  falling through to root hints, recursion ignored for conditional and server forwarders, `ra` always set, negative
  cap 86400, negative TTL from the larger SOA value, zone answers cached, forwards without `rd`, iterative with `rd`,
  `aa` on every reply, the forwarder's answer with `aa`, a failed conditional forwarder falling to the forwarders,
  SERVFAIL cached, no time passing on a timeout, the repeat at +0 s, forwarders in reverse order, a conditional
  forwarder that is off still used): every one fails a test (one survived the first run and got an assertion).
- Fresh review (a separate agent read the code against SPEC.md, tried 36 further mutations and swept the captions in
  both languages): no logic bug; numbers and flags confirmed. Fixed from it: the Croatian plural in the comparison
  caption ("9 poruka", not "9 poruke"), "not in DC1's zone" instead of "its zone", "čekao odgovor prosljeđivača",
  *root hints* in italics in every Croatian caption, "autoritativni" (the task's and the glossary's term) instead of
  "mjerodavni", a note of its own for an equal conditional domain listed later, and a caption for a conditional
  forwarder's NXDOMAIN (unreachable from the page; it would have thrown). Its surviving mutations that change
  something visible now have tests (first NS asked, referral TTLs and expiry, `ra` on SERVFAIL and on the partner's
  answer, `aa` on the forwarder's NXDOMAIN, zone TTLs, outcome counts, the cache with recursion off, rule 8's
  unread rows, the 5 s wait label, the cache highlight): 64 mutations in all; the six that survive are equivalent in
  this scene (negative/positive lookup order, labels counted as characters, the positive cap, query time, the walk
  always from the root, NX TTL from the SOA TTL where TTL = MINIMUM).
- Page sweep: every step of all 96 combinations of `name` × the five toggles in both languages (934 states) at
  1920×1080: no console errors, no empty caption or placeholder left, no page scroll.
- `npm run gate -- win-dns-forwarders`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus `forwarder-down` steps 3 and 9, `no-fallback` 3, `internet` 6, `no-recursion` 2,
  `partner` 2 and 4, `no-cond-fwd` 3.

## Unchecked *(check)*

- The rcode with recursion off: SERVFAIL comes from Microsoft's teamdhcp blog (Windows Server 2016 default), not
  from a capture; the reviewer half-remembered REFUSED.
- Conditional forwarders are also disabled when recursion is off (rule 6).
- A conditional forwarder whose targets all time out ends in SERVFAIL, no root-hint fallback (rule 8; from KB
  2834250's timeline, not stated outright). The per-zone setting that decides it is the conditional forwarder zone's
  `UseRecursion` ("Do not use recursion for this domain" in older consoles); its default is not checked.
- With no forwarders configured, root hints are used whatever the fallback box says (rule 4; the page always has a
  forwarder).
- The longest-domain tie-break for conditional forwarders (rule 2; standard DNS server behaviour, Microsoft's
  page not re-read).
- The b-root address 170.247.170.2 (carried over from `dns-resolution`).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| conditional forwarder | uvjetni prosljeđivač | task file |
| root hints | popis korijenskih poslužitelja (*root hints*) | task file, UL ch19 |
| recursion (on a DNS server) | rekurzija | task file |
| timeout | istek vremena čekanja | task file |
| stub zone | zona-zametak (*stub zone*) | simdeck *(check)*; `win-dns-zone-types` should settle it |

`forwarder` (prosljeđivač) is in the glossary and used as `[[forwarder]]`.

## Shared requests

- **K1: a bold arrow weight** (`weight: 'bold'`) for final answers — the same request as `dns-resolution`; the page
  sets `data-weight="bold"` on its answer rows' arrows and styles it.
- **Kit legend swatches** `dot` (dotted line), `bold` (thick line) and a timeout swatch (dashed box with ✕): defined
  in the page CSS.
- **K1: seven lanes**, or a narrower lane mode: the task wanted seven lanes; the page picks five or six by name and
  sets lane names to 0.88rem so "Prosljeđivač" and "example.org" fit beside the decision table.
- **K4: no action column** (or a "merge action into the match columns" option): the page leaves the action column
  empty and zero-padded to fit at 1920×1080.

## Time

Start 2026-11-04 15:02 (desk check-in), review fixed, gate passing and status ready 15:45: about 45 min of build
and review.
