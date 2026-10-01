# dns-secondary-expiry: A secondary is a cache with a timer

| | |
|---|---|
| Task | `dns-secondary-expiry` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-dns-secondary-expiry` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dns-secondary-expiry/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL, DR |
| Topic / tags / level | `internet` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-records` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **SOA serial, refresh, retry, expire; a dead primary takes the zone down later**.

The student: kill the primary, run time.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/dns-records/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux): "Vlastiti poslužitelj imena": the SOA record of `/var/named/lab.example.zone` (serial 2026090301, refresh 3600, retry 900, expire 604800, minimum 900), the definitions *primarni poslužitelj*, *sekundarni poslužitelj*, *prijenos zone*, and the paragraph on SERIAL/REFRESH/RETRY/EXPIRE
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/20-elektronicka-posta.md` Primjer 3 (the forgotten serial bump)
- RFC 1035 §3.3.13 (SOA RDATA fields); RFC 1982 (serial number arithmetic); RFC 1996 (NOTIFY, out of scope); RFC 5936 (AXFR)
- `/home/rjasmin/projects/dr-lecture-estate/student/configs/hq/loom/var/lib/bind/db.qm.internal` and `/home/rjasmin/projects/dr-lecture-estate/student/configs/colo/qm-dc02/dns-zones.txt` (student-visible SOA values and the secondary's last transfer)
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S6.md` (the student brief whose 14-day timeline this reproduces)
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-02 (instructor only: never quote it on a student page)
- Catalogue seed: DR caveat CV-02 → §5.4

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.

## Model and presets

- **Scene:** "zone servers over time" on the kit time axis: a primary P (`ns1`) and a secondary S, each with its copy of the zone (SOA serial, a few records), and a resolver/client that asks S. Under S, three timers drawn as bars: next refresh, next retry, expire deadline (counted from the last successful refresh). A status badge on S: *authoritative* / *retrying* / *expired (SERVFAIL)*.
- **State:** `{ t (s), primary: { up, serial, records }, secondary: { serial, records, lastOk, nextRefresh, nextRetry|null, expired }, soa: { refresh, retry, expire }, clientAnswer, log[] }`. Times in seconds, shown as days/hours.
- **One step:** jump to the next interesting event (zone edit, primary death, refresh, the first and last retry of a run, expiry, a client query) and process it. Long runs of identical retries are one step with a count ("retry ×671"), so a 7- or 14-day expire fits in ~10 steps.
- **Rules:**
  1. Every `REFRESH` seconds after the last check, S asks P for the SOA serial (RFC 1035 §3.3.13 `REFRESH`; UL ch19 "Vlastiti poslužitelj imena", the paragraph on SERIAL/REFRESH/RETRY/EXPIRE).
  2. If P's serial is greater than S's, S transfers the zone (AXFR/IXFR) and takes the new data; if not, S keeps its copy even when P's records differ (UL ch19: "onaj tko zonu preuzima uspoređuje brojeve, a ne sadržaj"; serial comparison per RFC 1982, check). A successful check with an equal serial still counts as a successful refresh.
  3. If P does not answer, S tries again every `RETRY` seconds (RFC 1035 §3.3.13 `RETRY`).
  4. If no refresh has succeeded for `EXPIRE` seconds since `lastOk`, S stops being authoritative and answers SERVFAIL (RFC 1035 §3.3.13 `EXPIRE`; UL ch19: "koliko dugo sekundarni smije odgovarati kad primarnog nema"). Tie-break: at exactly `lastOk + EXPIRE` the zone is expired (check).
  5. Until expiry S answers normally with its last copy: a dead primary is invisible to clients for up to `EXPIRE` (DR teaching point, phrased for students: "a secondary is a cache with a timer").
  6. If P comes back before expiry, the next retry succeeds, `lastOk` resets and the expire timer starts over.
  7. NOTIFY (RFC 1996) is off in this model, so changes arrive only on refresh (check whether to add it as a toggle).
- **Params:** `refresh` range 900–86400 s, default 3600; `retry` 300–7200 s, default 900; `expire` choice 604800 / 1209600, default 604800; `bumpSerial` toggle (used by the edit action), default on; button `kill-primary` (key K) and `revive-primary` (key V), taking effect at the next step.
- **Presets:**
  1. `book-edit` — UL ch19 zone (`2026090301`, refresh 3600, retry 900, expire 604800): P edits `klijent` and bumps the serial to `2026090302` at t = 600 s; S picks it up at the refresh at 3600 s. From UL ch19 (edit and times derived).
  2. `no-serial-bump` — same edit, serial not raised: S keeps the old record forever, with no error anywhere. From UL ch19 (SERIAL paragraph) and UL ch20 Primjer 3 (the forgotten serial bump).
  3. `primary-dies` — P dies right after a successful refresh at t = 0: S retries every 900 s; clients see no difference for 7 days; at t = 604800 s (day 7) S answers SERVFAIL. Derived from the UL ch19 zone, unchecked.
  4. `estate-14-days` — values from the student-visible estate configs (`db.qm.internal`: refresh 10800, retry 3600, expire 1209600): the primary is switched off on Tue 2026-11-10 in the evening; the secondary keeps answering and starts SERVFAIL about 14 days after its last successful refresh, around Tue 2026-11-24. From the estate's student-visible zone file and the secondary's zone listing (paths in Sources), matching the S6 brief; times derived. Do not quote the instructor caveat text on the page.
  5. `revived-in-time` — as 3, but P comes back on day 5: the next retry succeeds and the expire clock restarts. Derived, unchecked.
- **Steps:** `book-edit` 4; `no-serial-bump` 4; `primary-dies` 8; `estate-14-days` 8; `revived-in-time` 7.
- **Legend:** P and S as labelled boxes; solid bar = refresh timer, dashed = retry, red-outlined bar with a clock icon = expire deadline; hatched zone = expired copy; "changed" marks the server or timer that changed this step.
- **Captions:** hr: "Dan 7, 00:00: od zadnjeg uspješnog osvježavanja prošlo je EXPIRE = 604 800 s. Sekundarni prestaje biti mjerodavan i na svaki upit vraća SERVFAIL." en: "Day 7, 00:00: EXPIRE = 604,800 s have passed since the last successful refresh. The secondary stops being authoritative and answers SERVFAIL to every query."
- **Terms:** *primary server* — primarni poslužitelj; *secondary server* — sekundarni poslužitelj; *zone transfer* — prijenos zone; *serial* — serijski broj (`SERIAL`); *refresh / retry / expire* — osvježavanje / ponovni pokušaj / istek (`REFRESH`, `RETRY`, `EXPIRE`); *authoritative* — mjerodavan.
- **Misconceptions:** "the secondary is a backup copy that survives the primary"; "the secondary compares the records"; "if nothing broke the day the primary died, nothing will".
- **Reuse from `dns-records`:** the zone/record structure and the SOA record; new here are the timers and the primary's up/down state. This page is also the host for the `dns-split-brain` preset (§5.4).
- **Out of scope:** NOTIFY and IXFR details, TSIG, multiple secondaries, AD-integrated replication.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dns-secondary-expiry sims/dns-secondary-expiry` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-secondary-expiry/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
