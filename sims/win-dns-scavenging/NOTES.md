<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-scavenging: notes

New stepper (task `docs/tasks/w3/win-dns-scavenging.md`, catalogue `win-dns-scavenging`, §4.5.3 and §5.21, wave 3).
Drawn by the page: no kit view has a time axis (the layout follows `dns-ttl-cache`, cards left, tracks right).
Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step = one moment of interest**, a (time, phase) pair: phase (1) clients, phase (2) the run (T1). A clients
  phase counts when a record is created or comes back, a timestamp moves, or a client leaves; ignored refreshes
  are counted into the log of the next moment. Every run is a moment, also one that deletes nothing or skips the
  zone: each of the defaults' three runs shows a different safety valve (day 7: the zone may not be scavenged
  yet; day 14: pc2 exactly at its stale point, kept; day 21: deleted). The task says "phases inside a step"; with
  refresh and run as separate steps the defaults get the task's 8 steps and the order is visible.
- **"The zone can be scavenged after" is strict** (Microsoft: "greater than the value of the start scavenging
  time"), so with aging enabled at day 0 and refresh 7 the run at exactly day 7 00:00 skips the zone (T4). The
  task's presets did not depend on that run deleting anything; the caption says why it skips.
- **Time in hours**, everything at 00:00 of its day, so a 1-day lease (refresh every 12 h) works. The page shows
  "day 3" or "day 3, 12:00".
- **Static records have `timestamp: null`** and `static: true`, not 0: records created on day 0 have timestamp 0.
  The record shape is `win-dns-dynamic-update`'s `{ name, type, data, owner, timestamp, static }` plus `source`;
  `owner` stays null (ownership is that page's concept).
- **Two params the task does not list.** `scenario` (`leaver`, `printer`, `static`, `move`): the presets need
  different records, and the student should be able to vary the intervals on each set. `until` (7–60 days): how far
  the demo runs, which is also the axis (the task's scene is a fixed 0–60 axis; three weeks of the defaults on a
  60-day axis would leave two thirds empty). Presets set both.
- **`fs1` (10.0.0.20, static) is in every scenario**, as the record that never ages. Added names: `prn4`
  10.0.0.40, `old-nas` 10.0.0.30; PC1's new address 10.0.1.23 is `win-dns-dynamic-update`'s "move".
- **Forecast on the card.** For a record nobody refreshes any more (its client left, or the admin's record) the
  card says which run will delete it (`deletionAt`: the first run strictly after both its stale point and the
  zone's "can be scavenged after"). Live clients get no forecast: they will refresh.
- **The future is drawn faint**: a veil from "now" to the end of the axis; the current timestamp's bands are drawn
  to the end, which is what happens if nothing refreshes the record. Runs still to come are faint dashed lines.
  A run that skipped the zone is a thin dotted line and a hollow ▽ on the axis.
- **No emoji** (the task's 🔒 and broom): the page runs offline with the kit's fonts, and emoji depend on the
  system's. Static is a solid "static" badge and a solid bar; runs are dashed lines with ▼ on the axis.
- **Panel fit.** Eight params and five presets did not fit at 1920×1080 (967 px of 926). The two zone intervals
  sit side by side, the lease choice (printer only) shares a row with its label, and the scenario labels are short
  ("PC2 leaves", "Printer", "Static", "New IP"). Checked for every preset and step in both languages.
- **Reusable model.** `refresh`, `update`, `staleAfter`, `isStale`, `stateOf`, `zoneBlocks`, `scavenge` and
  `deletionAt` are pure and string-free over the record shape above, ready for `models/` next to
  `win-dns-dynamic-update`'s `zoneAccepts`/`mayWrite`/`applyUpdate` (catalogue §5.21).

## Deviations from the task

- **Step counts:** defaults 8 (as the task); too-aggressive **11** (task 8), static-survives **7** (task 6),
  aging-only **11** (task 6), ip-change **5** (task 6). They follow from one rule (moments, above) applied to every
  preset; the task's numbers came from no single rule (8 for too-aggressive would end before the second deletion
  on day 7, which the task names). All are within 20.
- **Rule 9 "at least", not "longer than":** clients refresh before the run (T1), so a refresh interval equal to
  the client's period keeps the record in this model (a daily client survives 1/1/1). Microsoft gives no formula:
  "large enough to allow all clients to refresh their records", and room for several attempts *(check)*.
- **Rule 5 runs start one period after enabling** (days 7, 14, 21) as the task says; no source found for when the
  first automatic run after enabling happens *(check)*.
- **Aging off on the zone** (rule 11): timestamps follow rule 2 as with aging on; only the runs skip the zone. The
  task does not say what aging off does to refreshes.
- **Param `scavenging`** for the task's `serverScavenging` (the label says "Server scavenging"); the task's 🔒 is a
  "static" badge (no emoji, above).
- **Title** "DNS: aging and scavenging" (task: "Aging and scavenging"), so it lists next to the other DNS pages.

## Sources

- Microsoft Learn (archived), "Understanding Aging and Scavenging", Windows Server 2008 (cc771677, title
  confirmed): no-refresh and refresh defaults 7 days; scavenging period default 7 days (minimum 1 hour); manual
  records timestamp 0; refresh vs update; "The Windows DNS Client service renews DNS registration of client
  resource records every 24 hours"; DHCP servers make refresh attempts when renewing leases; updates accepted and
  timestamp reset in the no-refresh interval; "Upon expiration of the no-refresh period, the server begins to
  accept attempts to refresh"; start scavenging time = current server time + refresh interval, scavenging when the
  current time "is greater than" it; delete when timestamp + no-refresh + refresh is less than the current time.
- Microsoft Learn troubleshooting, "Don't be afraid of DNS scavenging, just be patient" (dns-scavenging-setup;
  the task's "Ask the Directory Services Team" blog post, now on Microsoft Learn; its author is from the
  networking team): the three places to enable it; "Delete this record when it becomes stale" sets the current
  time rounded down to the hour; static timestamp 0; "Windows clients dynamically update DNS every 24 hours";
  "The zone can be scavenged after" = time + refresh, reset when the zone loads or dynamic updates are enabled;
  "If the current date and time is greater than the timestamp plus No-refresh and Refresh intervals, the record is
  deleted"; the next run = last Event 2501/2502 + the scavenging period.
- RFC 2131 §4.4.5: T1 = 0.5 × lease (the renewal).
- Not checked: the PowerShell pages "Set-DnsServerZoneAging" and "Set-DnsServerScavenging" (the defaults they
  state were confirmed from the two pages above instead).

## Checks

- Numbers: an independent Python hand model of the five presets (and the 1-day-lease printer) before the model was
  written; the model agrees on every moment and deletion (`sim.test.js` "presets").
- Mutations: 38 rule-breaking edits, one at a time (30 of mine, 8 from the review). 36 fail a test. 2 survive,
  both equivalent in every reachable state: runs listed from time 0 (`isRun` excludes it anyway), and the "back
  again" flag looking at any deletion (every scenario's records are first created on day 0, so no record is
  created after another is deleted). Tests added on the way: an address change with no separate refresh, an
  accepted refresh after the boundary takes its own time, a static record is not in a run's kept list, records
  sorted (the field tests now catch it), rule 2 with no-refresh ≠ refresh, and every log field a
  caption reads.
- Browser: every preset and every step in both languages at 1920×1080: no panel, stage or card overflow, no page
  scroll, no `undefined`/`NaN`/placeholders, no console errors. Gate screenshots reviewed: light, dark, grayscale
  (the three bands stay apart by pattern), 375×812.

## Unchecked *(check)*

- When the first automatic scavenging run happens after scavenging is enabled on the server (rule 5).
- That the DHCP server refreshes the record at every lease renewal (rule 8).
- What a server does with refreshes in a zone that has aging off (rule 11).
- Rule 9's exact boundary (above).
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| scavenging | brisanje zastarjelih zapisa | task *(check)* |
| timestamp | vremenska oznaka | task |
| no-refresh interval | interval bez osvježavanja | task |
| refresh interval | interval osvježavanja | task |
| stale record | zastarjeli zapis | task |
| static record | statički zapis | task |
| scavenging run | prolaz brisanja | simdeck *(check)* |
| scavenging period | razmak prolaza brisanja | simdeck *(check)* |
| (DHCP) lease | zakup | simdeck *(check)* |

`aging` is used from the glossary (`starenje`, from ossimulator's page aging); the same word fits records.

## Shared requests

- **models/:** promote this sim's aging functions together with `win-dns-dynamic-update`'s record functions as one
  record-lifecycle model (catalogue §5.21), for `win-dhcp-dns-update`. Nothing was in `models/` when this started,
  so `rec`, `key`, `find` and `byName` are copied from `sims/win-dns-dynamic-update/sim.js @ 7a49e71`.
- **Kit: a time-axis view.** `dns-ttl-cache` and this page both draw cards beside tracks over time by hand (axis,
  ticks, bands, vertical event lines, a "now" line and a veil over the future).
- **Kit legend swatches** for patterns (hatched, dotted, cross-hatched) and a dashed vertical line: the page
  defines `ts`, `nr`, `rf`, `st` and `run` in its CSS.
- **Kit:** `.sd-ctl { display: flex }` beats `[hidden]`, so a param's `visible: () => false` does not hide it; the
  page adds `.sd-ctl[hidden] { display: none }` (as `dns-ttl-cache` does).

## Fresh review

A separate agent read the task, SPEC.md, the model, the tests and the page, fetched both Microsoft documents, ran
its own mutations in a copy and drove the page (80 states per language, 12 param combinations). It confirmed the
rules, the tie-breaks, all five presets' numbers and that "at least" (rule 9) never deletes a record marked safe.
Fixed from it:
- the start caption with aging off said "aging on … aging is off" (now one sentence for each case);
- the ⚠ line said a live record "will" vanish; in 38 of 42 unsafe printer settings it never does (refreshes land
  on the timestamp's grid), so it says "can", and SPEC rule 9 gives the exact condition;
- rule 2 was only tested with no-refresh = refresh (a mutation using the refresh interval survived), and the log
  fields the captions read had no tests: both added;
- Croatian: "svakih 1 dan" → "svaki dan" / "svaka 4 dana" / "svakih 7 dana" (plural forms); "2 osvježavanja
  odbačena" (the participle is in the plural forms); "nakon 7. dana", "do 10. dana" (a genitive day formatter)
  instead of "nakon: dan 7"; "a ne poslije toga"; the explanation's "do zbroja", "barem jednako dug",
  "računala koje je otišlo";
- the explanation said timestamps exist only with aging on (Microsoft: dynamic records are time-stamped anyway)
  and that clients never delete their records ("often do not");
- the term's first mention ("*timestamp* (vremenska oznaka)") appeared twice in one caption;
- a stale record's card said "only a run deletes it" when no run ever will (aging or scavenging off);
- the end caption put several stale records under one singular verb (one sentence per record now);
- the axis's first and last labels sat under the "now" line and the ✕ ran past the stage edge;
- SPEC said runs are labelled "run" (they carry ▼/▽ on the axis); the param grid test now has aging and
  scavenging both off.
Its "NOTES.md is missing" was written before this file existed.

## Time

Start 2026-10-25 about 09:55 (reading; first clock reading 10:04, SPEC and hand model done by then); model, tests
and page passing the gate 10:20; review fixed, gate passing and status ready 10:33: about 40 min.
