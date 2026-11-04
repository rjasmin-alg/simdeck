<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-client-order: notes

New stepper (task `docs/tasks/w3/win-dns-client-order.md`, catalogue `win-dns-client-order`, §4.5.3, wave 3).
Page-drawn (no kit view fits a vertical pipeline). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step = one try**: one stage, one candidate name, or one DNS server asked. The step count is whatever the run
  takes (`steps(p)` runs the model to its end); at most 11 with the page's params, 3 at the defaults (`sim.json`).
- **Stage (left):** the client card (PC-07, `corp.example`, `10.0.0.57`, the typed name, lookup number and `t`), then
  the five stages as rows joined by a line, each with a mark (○ not tried, ▶ next, ✓ answer, ✕ no answer, ⊘
  negative entry, ⏱ between two servers, – will not run) and its outcome: the hosts file contents, the cache hit or
  negative entries, every DNS query of this lookup (name @ server → address / NXDOMAIN / no answer, n s), the link
  answer. The DNS row carries the server chips (preferred / alternate, public, up / down). A result banner closes a
  finished lookup; during the repeat a small line keeps lookup 1's result. "Changed" is the kit's `sd-changed` on
  the row tried in this step.
- **Right column:** the candidate names with their source (as typed, primary suffix, devolution, connection suffix,
  search list) and per-name mark; with a search list and a short name, the name the list displaces
  (`fs1.corp.example`) is shown struck through ("not asked"). Below, the cache table (name, answer or "does not
  exist", seconds left or "always" for hosts rows, source hosts / DNS); rows new in this step are highlighted.
- **The repeat and the flush are params** (`repeat`: the same name again at 60 s with the preferred server back up;
  `flush`: flush the cache before the repeat, disabled without the repeat). The task's `flushCache` button cannot be
  a button in a stepper that replays from its params; the toggle shows its state and lives in the URL.
- **Hosts rows live in the cache table** (rule 1: hosts entries are loaded into the cache) and survive a flush (rule
  7), which is what `stale-hosts` shows in its second step.
- **The servers do not answer link-local queries.** They sit on PC-07's address range (the task's addresses), so with
  LLMNR on they would answer for `fs1` and `search-list` would succeed by LLMNR; the scene assumes LLMNR and NetBIOS
  are off on the servers (a common hardening). Only the laptop `10.0.0.77` answers, for `printer`, by both protocols,
  so turning LLMNR off alone still lets NetBIOS resolve `printer` to the laptop.
- **Time:** answers take 0 s; a timed-out preferred server costs 1 s before the alternate is asked; a candidate no
  server answers costs 10 s in all (KB 2834226). LLMNR and NetBIOS waits are not counted.
- **"The preferred server is back"** is said at the repeat only when it was down in the first lookup.
- **Link = segment** in Croatian ("na segmentu"): "veza" already means the connection in "sufiks veze".
- **Captions** are built from the try: the task's two captions are used where they apply (the primary suffix at the
  first DNS query of a short name; "NXDOMAIN is an answer" when the preferred answers NXDOMAIN and an alternate is
  configured). The public resolver's NXDOMAIN for `corp.example` says why ("does not know the internal zone"). A
  lookup that ends without an answer says why: the search list displaced the real name, a negative entry still
  stands (with its seconds left), or plainly "not resolved".
- **Toggles share rows** two by two in the panel, with the kit's on/off word hidden (the switch shows it and carries
  it for screen readers; same as `lnx-thin-overcommit` and `rf-bandplan`), so the panel fits at 1920×1080. Labels
  are short ("10.0.0.10 up", "Hosts line", "Repeat +60 s", "Flush first"): the reviewer's longer labels pushed the panel
  past one screen in Croatian; the stage shows what each one changes.
- **Preset order** short-name, search-list, fqdn-dot, stale-hosts, public-alternate, llmnr-answer. The gate's
  deep-link check opens the second preset at `min(3, steps at the defaults)`; `stale-hosts` (2 steps) in second
  place failed it (see Shared requests), and the order also reads well: names first, then servers and cache, then
  the link.
- **Names on the page:** Windows features and protocols are the topic (hosts file, DNS client cache, suffix search
  list, GPO, LLMNR, NetBIOS). No command appears (`ipconfig /flushdns`, `/displaydns` stay out: "flush the cache").
  LLMNR poisoning is said as a mechanism ("anyone on the segment could have answered; nobody checks"), no tool named.
- **Tags:** `dns` (task) and `caches`, both in `tags.json`. Topic `windows-admin`, level `intro`. Related:
  `dns-resolution`, `dns-ttl-cache`.

## Deviations from the task

- **Negative entries end DNS, not the lookup.** The task's rule 2 says a negative entry "ends the lookup until it
  expires". Here it rules that name out for DNS (no server is asked), and LLMNR/NetBIOS still run for a short name.
  Reason: the fallbacks are what makes repeated LLMNR answers for the same mistyped name possible, and "fs1 still
  fails until the cache is flushed" holds either way. `public-alternate` is therefore 10 steps, not 8.
- **Step counts:** short-name 3 (task 4), stale-hosts 2, llmnr-answer 4 (task 6), public-alternate 10 (task 8),
  search-list 5, fqdn-dot 3. With one try per step the task's own outcomes give these numbers; the task's were marked
  "derived, unchecked". `stale-hosts` reaches 2 by repeating with a flush (rule 7: the hosts line comes back).
- **`typed` has five options**: the task's four plus `fs1.corp.example.`, which its `fqdn-dot` preset needs.
- **`repeat` and `flush` params** instead of the `flushCache` button (above); `netbios` is a model param (default
  on) without a control.
- **Timeouts** from KB 2834226 ("DNS client resolution timeouts"), not the task's "1, 1, 2, 4 s": with two servers the
  alternate is asked at 1 s and the client stops at 10 s.

## Reuse

- `dns-resolution` (soft dependency): `models/` has no DNS model. The cache idea (TTL, negative entries, an entry
  with 0 s left is expired) is reused; the code is written here because the client cache is a list of names, not
  RRsets with glue, and nothing of the iterative walk is needed. `sim.js` names the source
  (`sims/dns-resolution/sim.js @ 3debb2f`).
- The model is pure and promotable: `scene(p)` builds plain data; `candidates`, `suffixes` and `run(scene)` work on
  any scene (tests use other suffixes, devolution, two link answers, two hosts lines).

## Sources

- Microsoft Learn, "DNS client resolution timeouts" (KB 2834226, checked online 2026-11-04): one server 0/1/2/4/8 s,
  stop at 10 s; two servers: second server at 1 s; "Any Name Error response … will cause the process to stop —
  client doesn't retry with the next server if the response was negative".
- Microsoft, "Microsoft TCP/IP Host Name Resolution Order" (KB 172218) *(check: title and number from the task, not
  opened)*: hosts before DNS, then NetBIOS.
- Microsoft, "DNS Devolution" (TechNet) and Policy CSP ADMX_DnsClient: a suffix search list disables devolution and
  is used instead; `AppendToMultiLabelName` appends suffixes to a multi-label name after the original query fails.
- MaxNegativeCacheTtl 900 s (Windows XP and later; 300 s on Windows 2000) and MaxCacheTtl 1 day: itprotoday,
  "Controlling Positive and Negative Caching", and the TechNet negative-caching pages *(check for current Windows)*.
- RFC 4795 (LLMNR) §3: by default LLMNR only for single-label names; 224.0.0.252 / FF02::1:3, UDP 5355.
  RFC 1001, RFC 1002 (NetBIOS over TCP/IP). RFC 2308 (negative caching).
- UL ch19 (`uvod-u-linux`), "Vlastiti poslužitelj imena" (negativno predmemoriranje) and "Uvod" (`search lab.local`
  in `/etc/resolv.conf`, the Linux counterpart): terms.
- Task file (scene, params, presets, captions, terms, misconceptions).

## Unchecked *(check)*

- Hosts: two lines for one name → the first wins; a hosts entry matches a candidate FQDN; `fs1.` matches a hosts line
  `fs1`.
- A flush reloads the hosts entries (believed: the cache shows them again at once).
- LLMNR and NetBIOS for multi-label names on current Windows (model: never); whether their answers are cached (model:
  no); a negative cache hit still lets LLMNR/NetBIOS run (model: yes; task: no).
- `AppendToMultiLabelName` default (model: off, as the task says).
- The record TTL 1200 s (Windows registers its A record with 20 min).
- After a timeout, the client may lower the failed server's priority for a while (model: every name starts at the
  preferred server).
- MaxCacheTtl 86400 and MaxNegativeCacheTtl 900 on current Windows.

## Term pairs (not in `kit/glossary.js`)

- hosts file — datoteka hosts
- DNS client cache — predmemorija DNS klijenta (`cache` is in the glossary)
- DNS suffix — DNS sufiks; primary DNS suffix — primarni DNS sufiks
- suffix search list — popis sufiksa za pretraživanje
- devolution — devolucija
- connection-specific suffix — sufiks veze
- single-label name — ime od jedne oznake (kratko ime)
- preferred / alternate DNS server — preferirani / zamjenski DNS poslužitelj
- multicast — višeodredišno slanje
- broadcast — razašiljanje

## Shared requests

- **check-page deep link** (`kit/tools/check-page.mjs` ~line 280): the deep-link check opens `presets[1]` at
  `min(3, steps at the defaults)`, but a preset can have fewer steps than the defaults, so the step is clamped and the
  check fails although the page is right. Smallest fix: clamp to the preset's own step count
  (`window.simdeck.steps` after loading the preset). Worked around here by the preset order.

## Checks

- Numbers: an independent Python hand model (`library/win-dns-client-order-check.py` in the thread folder) gave every
  preset's tries, outcome and cache times before the model was run; `sim.test.js` asserts the same.
- Model: every combination of the page's params (5 × 2 × 3 × 2⁵) ends, with 1 to 11 steps.
- Rule tests broken on purpose, 25 mutations one at a time (last link answer wins, last hosts line wins, hosts ignores
  candidates, valid at 0 s left, no dedupe, negative ignored, negative TTL 300, negative ends the lookup, search list
  ignored, final dot ignored, devolution to one label, connection suffix dropped, suffixes on a multi-label name,
  NXDOMAIN asks the alternate, first wait 2 s, give up at 8 s, timeouts cached, alternate first, LLMNR for a dotted
  name, link answers cached, NetBIOS before LLMNR, no TTL cap, flush drops hosts, flush ignored, preferred still down
  in the repeat): every one fails a test.
- Fresh review (a separate agent read the code against SPEC.md, broke rules and rendered every step of every preset
  in both languages, and every page param combination in English, 4223 states, no errors): no logic bug. Of its 29
  mutations, 10 survived; each now has a test (hosts case, each candidate restarts at the preferred server, a
  give-up moves to the next candidate, link host flags, an empty search list, the DNS stage never left "trying", an
  alternate's answer cached, the numbers as literals, LLMNR with NetBIOS off, hosts rows in the cache at step 0).
  Four stay equivalent in every reachable scene (`put` not replacing, cache matching hosts rows, the two prunes).
  Fixed from it: "the preferred server is back" and "not even the preferred one" only when it was down; "DNS would
  have said …" taken from the names DNS would really be asked (none with a search list or `fs1.`); `capMulti` no
  longer implies a second try; `capStart` no longer ends on a name with a final dot (".."); "the name … is not
  resolved"; Croatian "veza" → "segment", "imena za koja se pita DNS", and other phrasing; "kept for up to 900 s";
  "turn them off: LLMNR by GPO, NetBIOS in the adapter settings or by DHCP".
- `npm run gate -- win-dns-client-order`: pass. Screenshots at 1920×1080 (light, dark, grayscale) and 375×812 in both
  languages reviewed, plus every preset at its key steps in both languages (no overflow, no console errors).

## Time

Start 2026-11-04 14:06, done 14:47 (about 41 minutes, one session).
