<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-records — notes

Task `docs/tasks/w2/dns-records.md` (thread t-0128, 2026-10-15). Explorer on kit view K4 (rule table,
`kit/ruletable.js`, `'deny'` mode with `at: 'all'` and page-set marks). Rules and numbers: `SPEC.md`.

## Decisions

- **K4 is used, not drawn by hand.** The task's Depends on line says K4 "once it exists"; it exists (kit 0.5.0). The
  zone file is a K4 table: one row per record (owner, TTL, type, data as written in the file), the mark column says
  what the row does for this query. Rows in the answer section are winners (`hit: true` in `'deny'` mode, where every
  matching row wins, so a whole RRset is outlined); rows in the authority or additional section are marked `hit`
  ("uz odgovor" / "sent along"); rows at a visited name with another type have their type struck (`miss: ['type']`),
  which shows NODATA; the implicit row ("no record of that name and type") wins with the status chip when the answer
  is empty (NODATA, NXDOMAIN, referral). The apex CNAME row, when the zone does not load, is `skip` (hatched) with a
  "not loaded" note (no legend swatch: a sixth legend item wrapped the header and squeezed the stage, and the row
  says "not loaded" in words). On a referral the implicit row reads "the name is below a zone
  cut: a referral" (it said "no record of that name and type", which was false for the glue name). When an alias ends
  in NODATA or NXDOMAIN, the status chip goes on the CNAME row instead.
- **Zone rows.** The UL ch19 zone plus two rows the book's file lacks, so that every query type has a record:
  `klijent AAAA 2001:db8:180::100` (RFC 3849 documentation prefix) and `@ TXT "v=spf1 mx -all"` (a mail policy
  string, language-neutral, related to the MX rows). AAAA is on `klijent`, not `posluzitelj`, so the `nodata` preset
  holds. The MX toggle adds `mail`/`mail2` A records `192.168.180.25`/`.26` (the task gives `.25`; `.26` is chosen
  here). The delegation's glue is `ns.sub A 192.168.180.53` (chosen here).
- **"Editable table" = the four toggles.** The zone is built by `addWww`, `mx`, `delegate`, `apexCname` (the task's
  params), not by typing rows: an explorer's state is its params (URL, presets, reset), and free text would need
  validation UI the page does not need for one concept. The model's functions take any zone, so rules the toggles
  cannot reach (loops, 9 CNAMEs, bad A/AAAA/TXT data, different TTLs in an RRset, an MX to an alias, a CNAME to
  another zone, a forgotten trailing dot) are tested in `sim.test.js` and have strings on the page.
- **Last valid zone.** A zone with an error does not load; the answer comes from "the last valid zone", which the
  model defines as the same params with `apexCname` off (the only toggle that can make an error). The shown table
  keeps the bad row, hatched.
- **Query names.** `qname` offers every owner the toggles can create, plus `www.sub.lab.example` (below the
  delegation, to show a referral for a name this zone knows nothing about) and `nepostojece.lab.example`.
- **Status badges.** ✓ NOERROR, ∅ NODATA, ✕ NXDOMAIN and ↷ NOERROR for a referral are on the answer's badge with
  their words; the task's ⚠ zone error is in the zone check strip (dashed red box, ✕ per error, ⚠ "the zone does not
  load"), because the badge shows the answer of the last valid zone. The header legend lists the K4 marks and
  "changed".
- **Loops.** The model returns `SERVFAIL` for a CNAME loop or a chain longer than 8 (what a resolver reports); an
  authoritative server may instead return the partial chain. Not reachable with the toggles.
- **"Changed"** marks the zone rows the last param change added (highlight and an ink bar on the number; a tag under
  the number made rows taller and overflowed the 15-row zone) and the rows of each answer section (answer, authority,
  additional) that are new since the previous answer. A row a toggle removes is gone from the table, so it cannot be
  marked; the answer rows show what the removal changed. Nothing is marked on the renders while the page loads.
- **Negative answers** carry the SOA with TTL 900 (min of the SOA's TTL and MINIMUM, RFC 2308 §3), which is what the
  SOA caption's "900" refers to.
- **Layout.** Seven presets in two columns (as `amdahl`) so the panel fits at 1920×1080; the zone check sits in the
  right column under the answer so the 15-row zone fits on the left. Names in the answer table may break after a dot;
  zone data wraps only between fields. On a phone the TTL column (always 3600) is hidden. Every combination of
  name × type × toggles (1232) was rendered in both languages at 1920×1080: no box overflows, no console errors.

## Deviations from the task

- **Seventh preset `delegation`** (`www.sub.lab.example` A with `delegate` on → referral without `aa`): the task's
  `delegate` toggle had no preset, and rule 6 is the one most easily missed.
- **Non-existent name** is `nepostojece.lab.example` (the book's, UL ch19) in the select instead of the task's
  `nema.lab.example`; the `nxdomain` preset already used the book's name, and one name is clearer than two.
- **`qname` list** is fixed (11 names) rather than "the zone's owners": names the toggles remove stay in the list and
  answer NXDOMAIN, which is itself the lesson (turn `addWww` off and `www` stops existing).
- Presets 1 and 2 turn `addWww` and `mx` off, so the zone is the book's (plus the AAAA and TXT rows).
- **State shape**: `answer: { rcode, kind, aa, answer, authority, additional, chain }` and check levels
  `ok | warn | error`, where the task sketched `answer: { status, aa, rrs, chain }` and `ok | error` (SPEC §4).
- Preset short labels ("Nadimak", "Nema vrste", …) instead of longer ones, for the two-column panel; the hints carry
  the query.

## Sources

- UL ch19 "Tko odgovara kad se pita za ime" (zapis zone, vrsta zapisa, RRset and TTL, field formats of A, NS, CNAME,
  SOA, MX; "Šire o temi": delegiranje, vrh zone, AAAA) and "Vlastiti poslužitelj imena" (the zone file, `@`, `$TTL`,
  SOA fields, the `aa` flag, `NXDOMAIN` for `nepostojece.lab.example`, `lab.example SOA`/`NS` answers).
- URM ch14 "Imenski prostor DNS-a: hijerarhija, zone i vrste zapisa" (A, AAAA, CNAME, MX with lower number first, NS).
- RFC 1034 §3.6.2, §4.2.1, §4.3.2; RFC 1035 §3.3.9, §3.3.14, §3.4.1, §4.1.1 (AA bit and aliases); RFC 2181 §5.2,
  §10.1, §10.3; RFC 2308 §1–2; RFC 3596 §2; RFC 3849; RFC 4291 §2.2; RFC 5321 §5.1; RFC 8020 §2. Cited from memory
  in this session (no network); the ones the task file names are as it gives them.

## Numbers

Every preset was run through the model before the page was written (`node -e` over `logic.presets`); the results are
the expected values in SPEC.md §3 and the preset tests.

## Unchecked *(check)*

- Presets 3–7 against a running authoritative server (derived from the rules, as the task file says).
- That an authoritative server adds the in-zone A records of MX exchanges and NS hosts to the additional section
  (common practice; not required by the RFCs).
- The aa flag when a CNAME in the zone leads under a delegation (model: kept, RFC 1035 §4.1.1 reading).
- SERVFAIL for a CNAME loop at the authoritative server (implementations differ).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| canonical name | kanonsko ime (UL ch19) |
| alias (DNS) | nadimak (UL ch19). The glossary's *alias* = "nadomjesno ime" is the mail sense (UL ch20), so the DNS sense needs its own entry or a note |
| mail exchanger | izmjenjivač pošte (UL ch19) / poštanski izmjenjivač (URM ch14) |
| owner (of a record) | vlasnik (UL ch19) |
| preference (MX) | prednost (UL ch19) |
| referral | uputa (URM ch14) |
| RRset | RRset (UL ch19, not translated) |

Used from the glossary: *resource record*, *record type*, *zone apex*, *delegation*.

## Shared requests

- **K4:** a row class or attribute in the row spec (e.g. `rows[i].className`), so a page can mark a whole row (here
  "added by the last toggle") without a tag that makes the row taller. Worked around by adding a class to the
  returned table's rows after `Simdeck.ruleTable()`.
- **K4:** `words.skip` is used both for skipped rows and for a skipped implicit row; a page that marks one row `skip`
  for its own reason ("not loaded") gets the same word on the implicit row. Worked around with a note on the row and
  no `skip` word. Smallest change: an optional `words.skipImplicit`.

## Review

A fresh reviewer read the diff against SPEC.md and ran 72 mutants of sim.js (58 killed, 13 survived, 1 a duplicate).
Fixed from it (its "no legend swatch for the not-loaded row" was tried and dropped, see Decisions):
- the negative-answer SOA TTL (was 3600, now 900);
- the implicit row's false "no record" on referrals;
- the missing status on an alias that ends in NODATA or NXDOMAIN;
- TXT length counted in characters instead of octets;
- IPv4-embedded IPv6 rejected;
- "changed" limited to the answer section;
- the MX caption naming only A;
- a caption crash on an empty chain (unreachable);
- Croatian case and word order in the explanation, "Nadležnost" for the authority section, and "Poddomena … je
  delegirana";
- the unreachable "no valid zone" branch, now removed.

Of the 13 survivors, 10 were real gaps and now have tests; each was re-run and fails. The other 3 are equivalent:
the CNAME-query guard that cannot be reached, `cn[0]` against `cn[last]` in zones that do not load, and an extra
`length > 1` in the TTL check.

## Tags

Topic `internet`, tag `dns` (both in `tags.json`).

## Time

Start to done in one session on 2026-10-15, 20:26–21:00, about 35 min by the clock:
- reading the task, the kit, K4 and the two books, about 8 min;
- the model, SPEC and tests, about 7 min;
- the page, the strings and the layout fits (panel, 15-row zone, the sweep of 1232 states), about 10 min;
- the fresh review (5 min, in parallel) and its fixes, about 10 min.
