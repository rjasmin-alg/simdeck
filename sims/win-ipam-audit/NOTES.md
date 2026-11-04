<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-audit: notes

New stepper (task `docs/tasks/w3/win-ipam-audit.md`, catalogue `win-ipam-audit`, §4.5.5, wave 3). Rules and expected
numbers: `SPEC.md`. Drawn with kit view **K4** (rule table, `kit/ruletable.js`) for the two evidence tables; the
question card, the time axis and the chain are drawn in the page with kit tokens.

## What it shows

"Who had `10.0.40.57` on Monday 28 Sep at 14:32?" One step is one link of the chain: the lease at T (lease events read
back from T, first match), the device (MAC and the name the client sent), the logons from the address inside the lease
(TGT requests), the users still logged on, and the answer or why there is none. Above the tables: the sources with how
long each keeps its events and whether it still has them, the DNS record as it is now (marked "not evidence"), and the
day 08:00–18:00 as one time axis with the leases as bars and the logons as markers, the question time as a red line.

## Decisions

- **Lease table = K4 first match, newest first.** Rule 1 read as a scan back from T: events after T are "–" with
  "after 14:32", the first event at or before T wins (✓ lease, or ✕ free for a release/expiry), rows below are "not
  read", the implicit row is "no event at or before T" (or "DhcpSrvLog-Mon.log overwritten Mon 5 Oct" when the source
  is gone). Time is the `#` column; the K4 action column is left empty and zero-width.
- **Logon table = K4 mode `deny` with no deny rows**, i.e. "every row is read, matching rows add up": logons inside
  the lease are ▷ "in the lease" at step 3 and ▶ ✓ candidate at step 5; logons outside are "–" with "before the lease
  (12:30)" or "after 14:32"; dropped users would be ▽ "logged off" (rule 4); the implicit row wins when nobody is left.
- **The lease start** (the window for logons) walks back from the covering event over renews of the same MAC to the new
  lease (SPEC rule 1). Not in the task's text, but needed for "logons after the lease start" when T is covered by a
  renew (one-user at 14:32: the 13:05 renew, the lease began 08:12).
- **Logoffs (rule 4).** A DC does not record a workstation's logoff, so no evidence set has a logoff; step 4 says "the
  trail has no logoff before T … a DC records the ticket request, not the logoff". The model handles logoff events
  (`kind: 'logoff'`) and the tests cover them, so a later preset with the workstation's own records can use them.
- **Retention per source (rule 5).** The task names the DHCP server (about a week) and IPAM. The DCs' Security logs
  were added as a third source with a scenario value of about 3 days (a size-limited log that overwrites the oldest
  events), so "logs are always there" shows in two stages: 3–6 days without IPAM gives the machine but not the user,
  7+ days gives nothing. IPAM keeps until purged. The question is taken as asked after 18:00, so IPAM's collection
  interval does not matter (out of scope).
- **`address-reused` asks twice:** T (default 14:32), then 09:10 (or 14:32 when T is 09:10). The second answer is
  compared with the first in the caption ("the same address, another device").
- **Evidence beyond the task's data:** one-user has a 17:40 release (so 17:55 → "nobody"); address-reused a 16:30
  renew; two-users renews at 12:12 and 16:12; dns-trap has PC-LAB07 released 16:40 and PC-LAB12 leased 16:45 with petra
  at 16:48, so at 17:55 the answer and DNS agree because both are about the later holder. MACs other than PC-LAB07's,
  DC names and user petra are invented.
- **`dns-trap` is asked 2 days later** so "DNS now" is visibly a later day.
- **`evidence` is a hidden param** (set by the presets, kept in the URL), as in `win-ipam-address-plan`.
- **The answer for several users** is written "PC-LAB07 · ana / marko" (either, not both).
- **Names on the page:** Windows Server features are the topic (IPAM, DHCP server audit log, Security log, event 4768);
  the audit log's file name `DhcpSrvLog-Mon.log` appears because the weekly overwrite is the point. No tool or cmdlet.
- **Tags:** `ip-addressing`, `dhcp` (both in `tags.json`); topic `windows-admin`, level `advanced` (task). The task's
  `authentication` tag was not used (the task's coordinator note agrees). Related: `win-ipam-address-plan`, `dhcp-dora`,
  `win-domain-logon`, `win-dhcp-dns-update`.

## Deviations from the task

- **Third source (DC Security logs, ~3 days)** added to rule 5 (above).
- **No logoff in any preset** (above); the model and tests keep rule 4.
- **Evidence events added** beyond the task's sketch (above); all task answers hold: one-user PC-LAB07/ana;
  address-reused 14:32 LAPTOP-IVAN/ivan and 09:10 PC-LAB07/ana; two-users two candidates; too-old none / IPAM has it;
  dns-trap PC-LAB07 although DNS says pc-lab12.
- **Captions:** the task's two captions are used with "Korak n:" in front and the count as a digit ("2 korisnika
  prijavila su se …"); the address-reused one says "Jutarnja dodjela" when the earlier lease ended before noon, "Ranija"
  otherwise.

## Reuse

- `win-ipam-address-plan` (soft dependency): nothing in `models/`, and nothing of its model applies (it allocates
  ranges; this sim correlates events). No code copied; the IPAM framing is shared only in words.
- Promotable (pure, plain data, no strings): `chronological`, `coveringLease`, `leaseStart`, `logonsInLease`,
  `stillOn`, `availability`, `solve`. A later `win-ipam-*` or DHCP-lease sim could share them as a `lease-trail` model.

## Sources

- Microsoft, "IP Address Tracking" (Windows Server 2012 R2, archived, read online 2026-11-04): correlation of DHCP lease
  events with user and computer authentication events on DCs and NPS servers; search by IP address, client ID, host name
  or user name; user names are not in lease events.
- Microsoft, "Analyze DHCP Server Log Files" and NXLog's DHCP page (search summaries, 2026-11-04): IDs 10 new, 11 renew,
  12 release, 16 deleted, 17 expired; `DhcpSrvLog-<day>.log`.
- ITProToday, "Configuring DHCP Server Logs"; "All about DHCP Auditing" (Microsoft blog archive) (search summaries):
  week-old files overwritten; the 24-hour rule.
- Security event 4768, "A Kerberos authentication ticket (TGT) was requested" (from memory).
- UL ch. 18 "Tko dijeli adrese" → "Što poslužitelj pamti" (lease record fields), through the task file.

## Unchecked *(check)*

- Event ID 17 for "expired" on the page (17 = expired, DNS records not deleted; 18 = expired and deleted).
- The weekly overwrite rule of the DHCP audit log (the 24-hour check) on current Windows Server; the size cap
  (`DhcpLogFilesMaxSize`) that can stop logging earlier is left out.
- 4768's title and its "Client Address" field; that the DCs record no workstation logoff (4634/4647 are on the
  workstation).
- IPAM keeps collected events until they are purged (no automatic retention).
- The DCs' ~3-day Security log retention is a scenario value, not a default.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| lease | dodjela | task file (UL ch. 18) |
| audit log | revizijski zapisnik | task file |
| client identifier | oznaka klijenta | task file |
| logon event | događaj prijave | task file |
| retention | razdoblje čuvanja | task file (the glossary has `retention` → "retencija", from uvod-u-linux; the task's term was used) |
| correlation | povezivanje (korelacija) zapisa | task file |
| evidence | dokaz | task file |

## Shared requests

- **K4: an "add up" mode by name.** The logon table uses mode `deny` with no deny rows to get "every matching row
  wins"; a mode `'all'` (or `'sum'`) would say what it means.
- **K4: no action column** (same request as `win-dns-forwarders`): the page zero-pads an empty action column.
- **K4: a changed mark on several rows** when `at` is `'all'`: the page adds `sd-changed` to the mark cells itself.
- **A small time-axis view** (tracks of bars and markers over hours, a "now" line): this page's `renderTimeline` is a
  start; `win-dhcp-failover` and the lease sims could use it.

## Checks

- Numbers: the model's answers for every evidence set × T × {0, 4, 9 days} × IPAM on/off printed and checked by hand
  against the task before the page was written (SPEC.md table).
- Rule tests: 29 tests; 29 mutations one at a time (tie-breaks at T for leases, logons and logoffs, the lease-start
  boundary, same-minute order, renew covering, first lease of the day, other addresses, lease-start walk ignoring the
  MAC or walking past a new lease, logoff counted as logon, logoff before the latest logon, retention off by one for
  DHCP and DC, IPAM ignored, several users collapsed, empty host filled with the MAC, the second question, the date
  arithmetic, links per question, ambiguous link, window from the covering event): all killed.
- Rule tests after the review: 33 tests; 36 mutations (the 29 above plus the reviewer's 7 survivors: the order of
  `gone` and `no-lease`, the lease link's evidence, the logoff link's reason, the device-only answer's mark, `via`, the
  IPAM flag, the host read from the lease start): all killed.
- Fresh review (a separate agent read the code against SPEC.md, mutated a copy and rendered 2087 captions in both
  languages): no logic bug; technical claims (audit-log IDs, the weekly overwrite, 4768, no logoff on the DC, IPAM
  correlation) confirmed. Fixed from it: step 4's caption named "no logons" when the logons were overwritten or there
  was no lease (own captions now); step 3 with both sources gone now says "overwritten" instead of "no time window";
  "razdoblja čuvanja" (genitive after "od"); "expiry" and "the first event is at {t} ({ev})"; "released" only for a
  release; "belongs to an earlier lease" (not "device"); "at or before" in the no-event answer; two English wordings;
  tests for September's 30 days, `via`, the IPAM flag, the chain's reasons and evidence, the host from the covering
  event. Noted, not changed: 4768 also fires for computer accounts and run-as, so "logged on" is an inference; in
  `one-user` DNS still shows pc-lab07 after the 17:40 release (a stale record); randomised Wi-Fi hardware addresses
  weaken "the MAC identifies the device" (out of scope).
- Page sweep: every step of 4 evidence sets × 3 times × {0, 2, 4, 9} days × IPAM on/off in both languages (1392
  states) at 1920×1080: no console errors, no blank placeholder in a caption, no page scroll, nothing overflowing its
  box.
- `npm run gate -- win-ipam-audit`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus address-reused 2, 5, 8, 10, two-users 5, too-old 5, dns-trap 5, one-user at 17:55.

## Time

Start 2026-11-04 17:18 (desk check-in); model, page and gate passing 17:36; review fixed, status ready, gate passing 17:51: about 35 min.
