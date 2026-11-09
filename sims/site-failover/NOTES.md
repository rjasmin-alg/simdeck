<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# site-failover: notes

New stepper (task `docs/tasks/w3/site-failover.md`, catalogue `dr-site-failover` §4.6, wave 3). Built by thread
t-0362 on 2026-11-09. Rules and expected numbers: `SPEC.md`. No kit view fits (two sites, six users with caches, a
record, a timeline), so the page draws its own stage in HTML (the arrows and icons are small inline SVGs at 1:1).

## Decisions

- **One step = the next event**, and the cache expiries after the change are **four window steps**, each a quarter of
  the TTL: the k-th ends at Tc + k · TTL / 4. So every run has the task's "4 cache-expiry groups", the last window
  ends exactly at the worst case (change + TTL), and rule 8 ("users whose caches expire in the same step are
  switched in id order") has its meaning. A window can be empty (long TTL: for 30 minutes after the change nobody
  moves), which the caption says.
- **Users' caches** come from fixed ages (`AGE = [525, 120, 120, 1490, 525, 3570]` s since the last lookup at t = 0),
  remaining = TTL − (age mod TTL). Each user asks again the moment its answer expires (users keep using the service).
  The ages are chosen so that user 6 asks again at 30 s with every TTL (60, 300, 3600), i.e. exactly at the default
  change, which gives the task's "all on B by 330 s" and the long-TTL "1 h after the change"; users 1 = 5 and 2 = 3
  share a time, so the id-order tie-break shows. Remaining fractions of the TTL would have lost the worst case for
  other TTLs.
- **Tie-break at the change second**: a lookup in the same second as the change gets the old answer (worst case).
  Without it the worst case could never be reached in whole seconds.
- **Lookups before the change** are applied in the step that covers them (marked "asked again: old address"). In the
  manual preset every user asks again several times during the 30-minute decision.
- **Health checks with `auto` off** still fail (shown 3/3, "only alerts"); there are no check steps then, so the manual
  run is fail → change → 4 windows → summary (7 steps, the task's count).
- **Phases**: detection [0, interval × threshold], decision [that, Tc] (zero width when automatic), caches expire
  [Tc, Tc + TTL]; failback: copy B → A, caches expire. The task's fourth phase "switch" (the record change itself) is
  instant here and shown as the dashed "record changed" mark, not a bar.
- **The service** is `chat.quillmoor.example` (the DR public zone's `chat` record, `203.0.113.19`, TTL 300). Site B's
  address `198.51.100.36` is in the colo's public range (handbook) and chosen here. The licence is generic: "a licence
  bound to a machine at A"; the licensed work at B stops (the licence server's copy at B does not start: other
  machine). The estate's host name and product are only in Sources (concepts, not tools).
- **Data**: B serves A's data as of the replication lag (hidden param `lagS`, 5 s, derived); the lag is shown as "writes
  of the last 5 s lost". Database details are `db-replication`'s.
- **Failback** (preset 5) starts with everyone on B, A down, the record on B. Steps: A returns with its old data → copy
  B → A (60 s, derived; B turns read-only when A returns, before the copy, so nothing written during or after the
  copy is left behind) → the record moves back →
  4 windows → summary. With `copyBack` off the copy step stays ("no copy") so the two runs line up step by step; then
  every user lands on A's old data ("its writes at B are missing") and B keeps taking writes. Sessions are lost again
  in this direction, and the licence works again at A. With the copy off, the bar's first phase is "no copy".
- **Preset hints name no scenario.** The manual and licence presets keep S1's clock (14:05) and the estate's facts
  (zone hosted at the registrar and changed by hand; a licence bound to a machine's host ID), but the hints do not say
  "S1" or what happens in S1 (the fresh review matched the licence wording to an instructor caveat): students work
  that scenario themselves (COMMON.md §1, no answer keys).
- **Croatian "upis" for writes**, "zapis" only for the DNS record (the review found "zapis" used for both).
- **Change-step caption** names the user holding the old address longest (ties: lowest id): in preset 1 that is user 6
  with 300 s (it asked at 30 s, the change second), not the task's example "user 4, 280 s" (user 4 is at 280 s in the
  same step, visible on its card). The task's en caption ("The service is up at site B, but the licence it needs is
  bound to a machine at site A.") is the summary's licence sentence.
- **Time display**: seconds from t = 0, below 600 s as seconds ("330 s"), above as h/min/s; presets 2 and 4 set a
  hidden `clockMin` (14:05, S1) and the page shows the clock with "+35 min".
- **Users' cards** show the number badge (the word "User n" is the badge's title and the card's label; with it the
  cards were too narrow for the address), TTL left, address pill (double border = B), reach (✓ / ✗ / read-only),
  session (key, crossed when lost or unreachable), and notes (asked again, licensed work stops, writes missing).
- **Timeline labels** (→ user ids at the second they moved) are placed on up to four rows so neighbours do not
  overlap (preset 2: 14:35:10, 14:35:30, 14:36:15 are close); labels near the ends are anchored inside the bar.
- **Preset names are short** ("Automatski DNS" / "Auto failover", "Ručni DNS" / "Manual DNS", "Fail back") so the panel
  fits at 1920×1080 with the decision slider shown; the `sim.json` entries use the same names. The two toggles have no
  hint lines for the same reason.
- `related`: `rpo-rto`, `dns-ttl-cache`, `db-replication`, `vrrp-failover`, `reverse-proxy-lb` (all exist).
- Tags `disaster-recovery`, `fault-tolerance`; topic `storage`; level `advanced` (the task's). All exist in `tags.json`.

## Deviations from the task

- **Step counts**: auto-failover 10 and manual-dns 7 as the task; long-ttl **10** (task 8), licence-stays **8**
  (task 5), failback **8** (task 6). The four window steps are in every run (see Decisions); the task's smaller
  counts would need a different step rule per preset.
- **licence-stays** is a failover with S1's clock, TTL 60 s and one check, so the users are on B within 70 s and the
  point is what still does not work there. In S1 the render nodes are already at the colo and stop when the licence
  server at HQ goes; here the licence server's copy at B does not start because the licence names A's machine. Same
  rule (rule 6), the scene's shape.
- **Preset 2's last user moves at 14:38**, not 14:40: 14:40 is the worst case (shown as "worst case: 14:40"); with
  the fixed cache ages nobody asked in the change second at 14:35.
- **licence-stays and manual-dns hints** carry no "S1" and no S1 consequence (see Decisions); the task's preset notes
  cite S1.
- **Session term**: the glossary's (UL) *session* — sjednica, not the task's "sesija". *cache* — predmemorija (UL ch19),
  not "priručna memorija".
- **Change-step caption** names user 6 (300 s), not user 4 (280 s); see Decisions.
- **Model reuse**: `models/` has no rpo-rto model; the only shared piece is the phase stacking (two lines), copied with
  a `from sims/rpo-rto/sim.js @ 6183a2e` comment. Nothing to promote from rpo-rto for this sim.

## Sources

- DR estate, student side only: `student/scenarios/S1.md` (Thu 2026-11-26 14:05, HQ power; Tomasz on parental leave;
  colo has power); `S12.md`, `S14.md` (other site losses, read for context); `student/configs/public-dns/
  quillmoor.example.zone` (hosted at the registrar's DNS service, `$TTL 300`, `chat IN A 203.0.113.19`);
  `student/inventory/licences.csv` (floating licences on one server, `hostid ether=…` of its eth0, "vendor rehost 5
  working days"); `student/handbook/sites.md` (HQ 203.0.113.16/29, colo 198.51.100.32/28).
- `~/projects/uvod-u-linux/book/chapters/19-dns.md`: definitions „TTL zapisa" (*record TTL*) and „predmemorija"
  (*cache*), RFC 8767 §4 on the TTL's current definition; lowering the TTL before a move (the explanation's last
  thought is not on the page).
- RFC 1034 §3.6 (resource records, TTL) and RFC 1035 §3.2.1, §7.3 (TTL, caching resolvers) *(check sections: not
  read here)*. Rule 2 (interval × threshold) and rule 7 (copy before failback) are derived.

## Term pairs

From the glossary: *resolver* — rezolver, *cache* — predmemorija, *health check* — provjera ispravnosti, *session* —
sjednica, *licence* — licencija. Missing from `kit/glossary.js`, written out in both tables:

| en | hr |
|---|---|
| failover | prebacivanje na pričuvnu lokaciju *(check)* |
| failback | povratak na primarnu lokaciju |
| record TTL | TTL zapisa (vrijeme valjanosti zapisa), UL ch19 |
| host ID | identifikator stroja |
| global load balancing | globalno uravnoteženje opterećenja *(check)* |
| standby site | pričuvna lokacija |

## Shared requests

- **Glossary**: add *failover*, *failback*, *record TTL* ("TTL zapisa", UL ch19), *host ID* with `"src": "simdeck"`.
- **Kit (optional)**: the legend has no icon swatches; the page fills its `sf-key`, `sf-lock` and `sf-repl` swatches
  with SVG after `mount`. A legend item `icon` (a node) would replace that.

## Questions for the owner (for `docs/tasks/OPEN.md`; not edited here, outside the task's scope)

- Window steps (four quarters of the TTL) instead of one step per cache expiry: keep? It changes the task's step
  counts for long-ttl, licence-stays and failback.
- licence-stays: a failover with the licence bound to A's machine (this page) or S1's own shape (render nodes at B
  losing a licence server at A, no DNS change)?
- The Croatian for *failover* (prebacivanje na pričuvnu lokaciju / preuzimanje).

## Checks

- Numbers: an independent Python replay (written before `sim.js`, in the thread's scratchpad) printed every preset's
  change time, move times, windows and the worst case; `sim.js` gives the same (SPEC table; `sim.test.js`).
- **Mutations** (23, one at a time, scripted): the change-second tie, id order, window end inclusive, remainder 0, the
  change moving users at once, Tc off by one check, `decideMin` ignored, thirds instead of quarters, sessions
  following, lag not lost, B's data current before the change, licence movable, licence ignoring the bound site, copy
  ignored / always, lost data never set, checks not capped, A not returning, the phase cap, the stale-caption tie, the
  copy time, and a no-op control. All but the control and two (the phase cap, the caption tie) failed a test; tests for
  those two were added (29 tests).
- Browser: every step of every preset plus four variants (no copy, licence not bound, manual 120 min with TTL 3600,
  one 30 s check with TTL 60), hr and en, at 1920×1080: no stage or page overflow, the panel without its own scroll,
  no clipped address or TTL, no timeline label outside the bar, no console message. Screenshots reviewed (light,
  dark, grayscale, phone, both languages). Fixed from them: the address pill truncated, "User n" wrapping, the phone
  stage clipped (now grows), timeline labels overlapping each other and the site cards, the DNS record on two lines,
  the panel 8–35 px too tall with the decision slider (shorter preset names, no toggle hints), 0/3 checks shown in
  the manual run.
- **Fresh review** (a separate agent: SPEC vs model, 28 own mutations, captions in both languages, screenshots). Fixed
  from it: the manual change caption said "the record has not changed yet" in the step where it changed (now "before
  the change, users … got the old address"); "zapis" for both record and writes in Croatian ("upis" for writes);
  the hints tying S1 to its outcome; the term rule for *failover*, *failback*, *global load balancing* (written out in
  italics with the Croatian, not in the glossary); the bar showing a copy with `copyBack` off ("no copy"); B turning
  read-only only after the copy (now at A's return, before it); Croatian "u 30 s" (now "30 s: …"); "licencirani rad ne
  radi" ("licencirani posao stoji"); "asked again: old address" in failback (now "same address"); glossary terms after
  prepositions in the hr explanation; tests for the six surviving mutations (check times with a 30 s interval, the
  count at the failure and the first check, failback phases, reading from a read-only B, the change time, A's data at
  the failback start); unused `stats` fields removed. Noted, not changed: "1 of 1 in a row" with threshold 1; the
  manual change caption without a clock repeats the time ("at 30 min, 30 min after the failure").
- `npm test`, `npm run check`, `npm run gate -- site-failover` pass.
- Not checked: a real projector; RFC section numbers.

## Time

Start 2026-11-09 06:53, done 07:19 (CET), one session, including the fresh review and its fixes.
