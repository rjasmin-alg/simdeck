<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-failover: notes

New stepper (task `docs/tasks/w3/win-dhcp-failover.md`, catalogue `win-dhcp-failover`, §4.5.4, wave 3). Drawn with
kit view **K1, message sequence chart** (`kit/sequence.js`) beside the servers and the clients. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Layout.** Left: the clock (with the MCLT ring after PARTNER DOWN), the two servers side by side with the link
  between them (state badge, pool bar own / partner's, what each may hand out, its lease database, updates not
  sent), and the clients table (six named clients plus one line each for the others and the new clients). Right: K1
  with three lanes, Clients, DHCP1, DHCP2. The task's "column of 6 named clients" became the table: six client cards
  do not fit in one K1 lane card.
- **Time model.** One step = everything at the next moment (the task's phases 1–2), with the **binding updates as a
  step of their own** at the same clock time (phase 3): the moment "the partner learns of it" is what makes the
  first lease MCLT long, so it gets its own caption. Admin actions are steps of their own and land in the next step
  (COMMON.md §11), 5 min later.
- **Leases run on their own timers** (T1 ½, T2 ⅞, RFC 2131) rather than scripted renewal batches, so "fail a server,
  renew leases" works from any step. Two consequences, both in SPEC.md: a **horizon** (MCLT after the last arrival or
  action, and after a failure at least the failed server's clients' T2, so a failure pressed after the last moment
  still shows them lose T1 and rebind days later) ends a run, and **routine moments fold** (renewals by the same server for the same length, retries that
  again get nothing) into the next step as one "↻ renewals" note. Without folding, MCLT 15 min with the automatic
  switchover ran past 20 steps of identical renewals.
- **Clients are cohorts:** each named client alone, the unnamed ones by batch and server, so 100–160 clients cost a
  handful of objects and a row per message in the chart ("REQUEST ×50"). The scene: 6 named + 94 others switch on at
  0:00 (54 others in the split scope, so DHCP1 holds the task's 60 clients), a batch of `newClients` at MCLT/2.
- **Hash buckets** are illustrative values (PC-01 23 … PC-06 239; a batch spread evenly), not RFC 3074's Pearson
  table, which I could not check here. The page shows the bucket and its owner, which is the point.
- **Pools:** split once, when the relationship is configured on the empty scope: load balance in the share ratio
  (DHCP1 the low part), hot standby the reserve at the top (`.200–.209`). No rebalancing: a real pair rebalances its
  free addresses (the draft's pool requests; Windows periodically *(check)*), so the reserve would shrink as the
  active leases addresses. Out of scope here; it is why the reserve is 10, not the task's 5.
- **The lease rule (rule 4)** is the simplified one Microsoft documents: new lease or unacknowledged → MCLT;
  acknowledged renewal in NORMAL → 8 days; anything while the partner is unreachable → MCLT. The draft's exact rule
  (≤ acknowledged potential expiration + MCLT) would let DHCP2 extend its own clients' 8-day leases by an hour in
  COMM-INT; here they drop to MCLT, as the task's caption says. Marked *(check)*.
- **A down server's database is frozen** (shown "stale"), and in the split scope its expired addresses do not return
  to its pool: the counters show what that server would believe if it came back.
- **Waiting clients** retry once per later step (they retry every few minutes in reality; the ones in between change
  nothing). The step that unlocks the pool (MCLT after PARTNER DOWN) is where they get addresses.
- **State names** NORMAL, COMM-INT (COMMUNICATION INTERRUPTED in captions), PARTNER DOWN are data, as Windows shows
  them; Croatian captions explain them at first use. Badges pair a symbol with the name (● ◐ ○ ✕), the pool bar a
  fill with hatching, the link a solid / dashed-✕ / dotted line: all readable in grayscale.
- **Changed marks:** the state badge, the pool bar, the database line, the clients' rows and lines; the clock's MCLT
  line when the pool opens.

## Deviations from the task

- **Step counts:** lb-normal **6** (task 6), lb-interrupted **5** (task 9), lb-partner-down **7** (task 6),
  hs-reserve-runs-out **5** (task 9), split-80-20 **5** (task 8). The task's counts were "derived, unchecked"; the
  repeated renewal rounds after the interesting moment are folded or past the horizon.
- **lb-interrupted:** DHCP1 fails at **0:05**, after the 0:00 leases and their binding updates (task: t = 0), so
  DHCP1's clients exist and DHCP2 knows them. Their renewal is a lost unicast at T1 (0:30) and a rebind at T2
  (0:52:30) that DHCP2 answers for 1 h; the task's "at their T1 … renew at DHCP2 (rebind broadcast)" folded the two.
  The 6 new clients get DHCP2's addresses (50 → 44).
- **lb-partner-down:** PARTNER DOWN at **0:35**, the whole pool at **1:35** (task 0:30 / 1:30: an action lands 5 min
  after the step it was pressed at). With **60 new clients** DHCP2's share runs out (50 get, 10 wait), so the takeover
  visibly serves the 10 from DHCP1's share.
- **hs-reserve-runs-out:** the reserve is **10** (5 % of the 200 free when the relationship is set up on the empty
  scope; task 5 % of 100 free = 5), so the preset has **12 new clients**: 10 get the reserve, 2 wait.
- **split-80-20:** as the task (60 clients, 40 get `.170–.209`, 20 none), with T1 at 4 d (lost), T2 at 7 d (DHCP2
  silent), the end at 8 d. `newClients` 0 in the preset.
- **Params:** `share` is two sliders, `share` (load balance, 10–90 %) and `reserve` (hot standby, 1–20 %), each shown
  only in its mode (one slider with a mode-dependent meaning would jump from 50 to 20). `mclt`, `switchover` and
  `share` are disabled with a reason in the split scope, the PARTNER DOWN button until DHCP1 has failed. Every param
  resets to step 0 (they change the whole history). The buttons set hidden `failAt` / `pdAt` (as `win-wsus-flow`'s
  `brAt`); keys `D` and `P`. The `newClients` label says "later" rather than the task-implied "at T1": they arrive
  at MCLT/2 in a failover scope and at 0:30 in a split scope.
- **Link failure** (both servers up, the link down, both in COMM-INT) is not a scenario: the task's buttons fail a
  server. The explanation and captions say the survivor cannot tell the two apart.
- **Croatian "lease":** "zakup" (as `win-dhcp-scope-options`, `win-dhcp-dns-update`), not the task caption's
  "dodjela"; the task's two captions are used otherwise word for word, with the model's numbers.

## Sources

- Task file; `sims/win-dhcp-scope-options/` (the scope, `ip()`, the 8-day lease: `sim.js @ e66fda5`, copied, the model
  is not in `models/`); `sims/win-dhcp-dns-update/` (layout and K1 use).
- RFC 2131 (T1, T2, rebinding, § 4.3.2, § 4.4.5), RFC 3074 (load-balancing hash buckets), draft-ietf-dhc-failover-12
  (MCLT, COMMUNICATION-INTERRUPTED, PARTNER-DOWN, binding updates).
- Microsoft documents named in the task, from memory: "DHCP failover overview", "Step-by-Step: Configure DHCP for
  Failover", "Add-DhcpServerv4Failover" (`-LoadBalancePercent`, `-ReservePercent`, `-MaxClientLeadTime`,
  `-StateSwitchInterval`), "DHCP Best Practices" (80/20). No network access was used; none of the titles or defaults
  was confirmed online *(check)*.

## Unchecked *(check)*

- MCLT default 1 h; the reserve default 5 % and that it is a share of the **free** addresses; load-balance default
  50 %; the state switchover interval off by default and 60 min when enabled in the wizard.
- That Windows splits the free addresses between the partners in the load-balance ratio, and how (and how often) it
  rebalances them.
- Moments at half seconds with MCLT 15 min (T2 = 787.5 s) are shown rounded down (0:13:07).
- A new lease lasts MCLT and the first renewal gets the full lease; in COMMUNICATION INTERRUPTED and PARTNER DOWN
  every lease lasts MCLT (rule 4's simplification of the draft).
- COMMUNICATION INTERRUPTED is entered at once when the partner goes down (the real detection takes the keep-alive
  timeout).
- The survivor in PARTNER DOWN uses the partner's free addresses only after MCLT; leases stay MCLT long there.
- Split scope: DHCP2's offer delay; DHCP2 silent (rather than NAK) to a rebinding client it has no record of.
- The 8-day default lease; Windows failover is IPv4 only.
- RFC 3074's hash values (illustrative here).
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| failover | preuzimanje u slučaju kvara (*failover*) | task |
| load balance | raspodjela opterećenja | task |
| hot standby | vruća pričuva (*hot standby*) | task |
| MCLT (maximum client lead time) | najdulje vrijeme vođstva pred partnerom (MCLT) | task ("najdulje vrijeme vođstva klijenta", marked check); reworded *(check)* |
| partner down | partner ne radi | task |
| binding update | ažuriranje dodjele | task |
| split scope | podijeljeni opseg | task |
| lease | zakup | `win-dhcp-scope-options`, `win-dhcp-dns-update`; open glossary question in docs/tasks/OPEN.md |
| reserve (standby) | pričuva | simdeck |

## Shared requests

- **Kit (`kit/kit.css`):** a control whose `visible(params)` is false gets `hidden`, but `.sd-ctl { display: flex }`
  overrides the attribute, so the control stays on screen. Add `.sd-ctl[hidden] { display: none; }`. This page has
  the rule in its own CSS (`share` and `reserve` share one place).
- **models/:** the scope helpers copied from `win-dhcp-scope-options` (`ip`, the subnet, the lease) are three lines;
  promoting a `dhcp-scope` model is not worth it for this page alone. This page's own model (cohorts, failover states,
  MCLT, pools) is pure and string-free if a later sim needs it.

## Checks

- Numbers: each preset's run printed with a scratch script before the page (the table in SPEC.md); the tests assert
  them.
- Rule tests: 25 tests, tie-breaks first. Rules broken on purpose, 41 mutations one at a time: 39 caught; 2
  equivalent (guards that another condition already enforces), both simplified away. One early survivor found a gap:
  the folded moments' times were not checked, so a horizon that cut a pending state change ran time backwards unseen;
  `monotonic()` now checks inside folds too. The reviewer's survivors (below) became tests and are in the 39.
- Sweep of 2430 param combinations (mode, MCLT, switchover, new clients, failAt, pdAt, share): all end, time never runs
  backwards, longest 11 steps (a failure pressed after the last moment).
- Browser sweep: 300 pages (10 param sets, both languages, every step, 1920×1080 and 375×812, buttons pressed in the
  non-preset sets): no page scroll at 1920×1080, no sideways scroll, no overflow of the left column, no
  `undefined`/`NaN`/placeholder/stray `*`, no console errors. Found and fixed on the way: the hidden-control bug above;
  the panel 95 px too tall (shorter preset name, tighter spacing); two receiver words overlapping on a broadcast (the
  down lane now has only its ✕ and dotted lifeline); the partner hatch erased by a `background` shorthand; the MCLT
  timer label clipped at the right edge; a down server's database counted live.
- `npm run gate -- win-dhcp-failover`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed.

## Fresh review

A separate agent read the task, SPEC.md, sim.js, the tests, the page and the strings, printed every preset's run,
captured every caption in both languages in a headless browser and broke the model in a copy (24 mutations). It
confirmed the preset table, rules 1–10 and T1–T6, the technical content (MCLT on new leases, full lease on the
acknowledged renewal, COMM-INT renewing for MCLT from its own pool, PARTNER DOWN + MCLT, the reserve, RFC 3074 bucket
ownership, the 80/20 without shared state) and the scope. Fixed from it:
- the one-sided binding-update caption always named DHCP1 (with `newClients` 1 only DHCP2 sends): now `{from}`/`{to}`,
  with plural forms;
- "Fail DHCP1" pressed at the end of lb-normal ended the run at once (8-day leases, next T1 past the horizon): the
  horizon now follows the failed server's clients to T2; the unreachable "next renewal is days away" hint removed;
- tests added for the gaps its surviving mutations showed: leases after the takeover still MCLT, PARTNER DOWN moving
  the horizon, the split scope's new clients at 0:30, the order renewals → rebinds → retries → expired leases;
- Croatian agreement ("Zakupi … istječu", "šalju … čekaju"), the `newClients` label, "no free address a server may
  hand out", a stale test comment, the unreachable rebind-with-both-up caption removed (rule 9 is tested on
  `answerer()`);
- a *(check)* line on pool rebalancing.
- Not changed: half-second moments with MCLT 15 min are rounded down in the display (Unchecked).

## Time

Start 2026-11-04 16:28; model, tests, page and gate passing by 16:58; review in by 17:05, fixes, gate passing and
status ready at 17:15: about 47 min.
