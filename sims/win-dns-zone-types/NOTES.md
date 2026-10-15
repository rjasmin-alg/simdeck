<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-zone-types — notes

Task `docs/tasks/w2/win-dns-zone-types.md` (thread t-0129, 2026-10-15). Explorer on kit view K4 (rule table,
`kit/ruletable.js`, `'deny'` mode with `at: 'all'`, `done`, and page-set marks). Rules and numbers: `SPEC.md`.

## Decisions

- **K4 is used, not drawn by hand.** The task's Depends on line says K4 "once it exists"; it exists (kit 0.6.0). The
  rule the table shows is the replication scope: one row per server, the match columns are what a scope looks at
  (domain, role, DNS), the action column is the zone being defined, the other three zones follow as `extra` columns,
  and the mark column says whether this server gets the zone: ▶ holds (deny mode: every matching row wins), ▷ stores
  only (page-set `hit`), – with the failing column struck (`miss`), or a dashed note for a refused transfer or a
  rejection. This gives the task's "one row per server, one column per zone" and still reads as a rule table.
- **A `host` param** (create on DC1, DC3, RODC1, DC4 or MS1) is added to the task's params. Preset 6 ("try
  AD-integrated on MS1") needs a way to put a zone on MS1, and the domain scope depends on the creating DC's domain.
  DC2 is left out (it behaves as DC1).
- **Baseline.** Before the student defines anything the forest holds what DC promotion leaves: corp.example and
  branch.corp.example as AD-integrated primaries with domain scope (on DC1's and DC4's domains), and
  `_msdcs.corp.example` with forest scope as a fixed fourth column (task preset 2's note). partner.example is held by
  nobody. "The previous valid holding" of rule 9 is this baseline, so the explorer state stays a pure function of the
  params (no memory of the previous param set).
- **Primary vs copy.** A primary made on a server that already holds the zone converts it (new type or scope); a
  file primary elsewhere is a second, separate zone of the same name; an AD primary elsewhere is rejected while the
  zone is in AD (`exists-ad`). A secondary or stub is a further copy from the zone's primary. (The first version
  replaced the zone on any primary; the review showed that a file primary on MS1 then wiped the AD copies, which is
  not what Windows does.)
- **Masters and `allowXfr`.** `allowXfr` is the zone-transfer setting of our own masters (DC1, DC4, or a server
  holding a file primary). The partner's server `10.20.0.53` allows transfers to us (fixed: the partner's setting).
  Stubs need the transfer too *(check)*.
- **Scope param for file types.** The scope param stays visible but only AD types use it ("(AD zones only)" in its
  label); the model drops it for file types, so "a secondary with a scope" (rule 2) is rejected only when the model is
  called directly (tested).
- **Glyphs.** ✎ writable, ⊙ read-only, ◔ stub, ▣ stored, ⊘ transfer refused, — nothing, ✕ rejected. Every cell has the
  word too (except "nothing", whose word is in the title) and a border pattern (solid, dashed, dotted, hatched,
  dashed red). The glyphs are drawn in the mono font: the sans fallback draws ◔ without its ring.
- **Detail and check.** Under the table: the cell key as one strip, the zone on the server it was created on (where
  it is stored, its records, the answer to `www.<zone>`, dynamic updates), the stub's records in zone-file form
  (relative names, the SOA with its first and serial fields) in a box of their own, and the check (created or
  rejected, reasons grouped, MS1's copy, the transfer setting).
- **Mark-column notes are short** ("from 10.20.0.53", "refers updates", "✕ not a DC"); the full sentence is in the
  check box and the caption. An AD stub's source is not repeated on every row (the detail box names it). A rejected
  row shows only its rejection.
- **"Changed"** outlines (ink outline, highlight) the cells whose holding, serial or rejection changed with the last
  param; nothing is marked on the renders while the page loads.
- **Layout.** Presets in two columns and the zone, type, scope and server params as drop-downs so the panel fits at
  1920×1080. Every combination of params (3 × 5 × 4 × 5 × 8 = 2400) was rendered in both languages at 1920×1080: no
  box overflows, no page scroll, no console errors, no "undefined"/"null" text. On a phone the table scrolls inside its box;
  the domain column is hidden and the mark column is not sticky there (it covered the zone cells).

## Deviations from the task

- `host` param added (above). The task's `zone` × `type` × `scope` apply to "the zone you create on `host`".
- Read-only glyph ⊙ instead of 👁: the eye is an emoji (colour, not a kit token, and missing in some fonts).
- Rule 5's "the zone's domain" is modelled as the domain of the DC the zone is created on (that is what the scope
  means; the same for every task preset).
- State shape: `errors` are objects `{ code, server, zone, by, part }`, not bare codes, so the page can mark the
  server; `customPartition` is the constant `CUSTOM.members` (DC1, DC4), not per zone; the state also carries `def`,
  `partition`, `accepted`, `ms1` (SPEC §4).
- `ms1Secondary` is evaluated even when the student's definition is rejected (from the zone in force).
- Preset `stub-partner` keeps `scope: 'domain'` (every preset sets every param; the scope is unused for a file stub).
- The coordinator note in the task (catalogue §5.4 lists `win-ad-dns`, probably the old name of this entry) is
  outside this folder; it is in the report.

## Sources

- Microsoft, "Understanding DNS Zone Replication in Active Directory Domain Services" (ForestDnsZones,
  DomainDnsZones, the domain partition, application partitions), "Understanding Active Directory Domain Services
  Integration", "Understanding Zone Types", "Understanding Stub Zones", "Add-DnsServerPrimaryZone" /
  "Add-DnsServerStubZone" (`-ReplicationScope Forest|Domain|Legacy|Custom`), "Secure dynamic update": titles as the
  task gives them, cited from memory, no network in this session *(check)*.
- RFC 1034 §4.3.5 (zone transfer), RFC 1995 (IXFR), RFC 5936 (AXFR).
- UL ch19 (`uvod-u-linux/book/chapters/19-dns.md`): "Vlastiti poslužitelj imena" (zone types `primary`, `secondary`,
  `stub`; primarni and sekundarni poslužitelj; prijenos zone, AXFR and IXFR; SERIAL), and the *stub* term left in
  English in Croatian text.

## Numbers

Every preset was run through the model before the page was written (a scratch script printing the server × zone
table); the results are SPEC §3 and the preset tests. Serials (128, 45, 2026101401, 77), record counts, addresses
other than `10.20.0.53`, and the custom partition's name and members are chosen here.

## Unchecked *(check)*

- Every Microsoft title above and the rules taken from it.
- `_msdcs.corp.example` is forest-scoped by default; domain scope is the default for a new AD zone.
- AD-integrated zones default to no zone transfers (so `allowXfr` defaults off).
- A stub zone's refresh needs the master to allow zone transfers.
- An RODC cannot create an AD-integrated zone; an RODC may hold file-backed zones (the model allows a file primary on
  RODC1).
- The DNS console refuses a second AD-integrated zone of a name already in another partition (`exists-ad`).
- A secondary or stub that never loaded answers SERVFAIL for its names.
- RODCs do not replicate custom application partitions (irrelevant here: RODC1 is not enlisted).
- The presets against a running server (derived, as the task says).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| primary zone | primarna zona |
| secondary zone | sekundarna zona |
| stub zone | *stub* zona (the task suggests "zona zaglavlja" *(check term)*; UL ch19 leaves *stub* in English, as in *stub* rezolver) |
| AD-integrated zone | zona integrirana u AD |
| replication scope | opseg replikacije |
| domain controller | kontroler domene |
| read-only domain controller | kontroler domene samo za čitanje (RODC) |
| application directory partition | aplikacijska particija direktorija |
| dynamic update | dinamičko ažuriranje |
| forest (AD) | šuma |

Used from the glossary: *primary server*, *zone transfer*.

## Shared requests

- **K4:** a way to keep a row's notes on one line with the mark word. Worked around with page CSS
  (`.sd-rt-tag { display: inline-block }` in the mark cell).

## Review

A fresh reviewer read the diff against SPEC.md and ran 80 mutants of sim.js (58 killed, 22 survived, 9 of the
survivors equivalent). Fixed from it:
- a primary created elsewhere wiped the zone (now: convert on a holder, a second zone for a file, `exists-ad` for AD);
- the domain-scope caption listed MS1 among the DCs (holders now filtered by AD);
- DC3 without DNS showed "no transfer" for a refused AD stub (stored now comes first);
- "not in the zone" for a stub (now "not in the stub"); a refused copy now answers SERVFAIL;
- the domain captions gave DC3's missing DNS role as a reason when host was DC4 and lost the domain reason with DC3's
  DNS on (now computed from the servers); the AD stub caption listed DC3, which only stores it;
- Croatian: quoted scope names, „…” quotes, "njezinim", "kontroleri domene (*domain controller*)";
- SPEC: MS1's secondary when the definition is rejected; a misleading test comment.
The 13 real survivors now have tests. A second batch of 29 mutants over the changed code (including those 13) was
killed in full.

## Tags

Topic `windows-admin`, tag `dns` (both in `tags.json`).

## Time

Start to done in one session on 2026-10-15, 21:00–21:31, about 31 min by the clock (the step times below are rough
and overlap with the review running in parallel):
- reading the task, the kit, K4, dns-records and UL ch19, about 8 min;
- the model and the preset numbers, about 6 min;
- strings, page and layout (the panel, the overflow sweep of 2400 states), about 12 min;
- tests and SPEC, about 5 min; the fresh review (in parallel) and its fixes, about 10 min.
