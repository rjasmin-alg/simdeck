<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-dns-update: notes

New stepper (task `docs/tasks/w3/win-dhcp-dns-update.md`, catalogue `win-dhcp-dns-update`, §4.5.4 and §5.21,
wave 3). Drawn with kit view **K1, message sequence chart** (`kit/sequence.js`) beside the two zones' record tables.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Left: the zones on DC1 (`corp.example` and `10.0.10.in-addr.arpa`, both AD-integrated and Secure
  only) as record tables with an owner chip per row; under them the DHCP server's DNS settings with its credentials
  and leases, and the message card (what this step carries, or DC1's check, line by line). Right: K1 with lanes for the
  client, DHCP1, DHCP2 (failover event only) and DC1. The task's "three columns" (clients, DHCP, zones) became the
  chart's lanes plus the left column: three columns of tables do not fit beside a chart at 1920×1080.
- **One step = a DHCP exchange (DISCOVER/OFFER, REQUEST/ACK, two rows each), one DNS UPDATE, its answer, or an
  event.** As in `win-dns-dynamic-update`, the DNS answer is a step of its own because it is the point.
- **Two zones**, not the task's one `zone.records`: A and PTR live in different zones and each needs its own UPDATE.
- **Owner = account name** (`DHCP1$`, `svc-dhcpdns`, `WIN10-07$`), not a SID: here the concept is which account,
  and `win-dns-dynamic-update` already teaches "the SID, not the name".
- **Owner chips** pair a shape with the account: a small server mark for the DHCP servers' accounts (and the shared
  user), a computer mark for computers, a dotted chip with an open lock and "nobody" for records with no owner
  (DnsUpdateProxy). Table marks pair a symbol and a word with the highlight (`+ new`, `✓ changed`, `− deleted`,
  `✕ refused`, `→ in the message`), as in `win-dns-dynamic-update`.
- **The DNS updates of the server and of the client are drawn signed (K1 `lock`)** without the unsigned try and the
  TKEY exchange of `win-dns-dynamic-update` (out of scope here: "the client's own secure update in detail"). The
  workgroup laptop's update is the one unsigned arrow.
- **Scenes start from history.** For the failover and expiry events (and FS1's own lease in the clash scene) the
  model runs the earlier lease silently with the same settings, so the records at step 0 are what those settings
  would have produced (one record-lifecycle model, catalogue §5.21).
- **DHCID data** is shown as "digest of …0A-20" (the MAC's last bytes); the real record is a SHA-256 digest of the
  client identifier and the FQDN (RFC 4701 §3.3).
- **Names and addresses** from the task (`WIN10-07` 10.0.10.57, `PRN-3`, `HOST-12`, `fs1`, `10.0.10.88`,
  `svc-dhcpdns`, `corp.example`, `10.0.10.in-addr.arpa`); added: PRN-3 10.0.10.53, HOST-12 10.0.10.62, the laptop
  10.0.10.66, FS1 10.0.10.20 (a reservation), DC1 .10, DHCP1 .11, DHCP2 .12, and the MACs (SPEC.md).
- **Reusable model.** `rec`, `key`, `find`, `byName`, `zoneAccepts`, `mayWrite` and the extended `applyUpdate` are pure
  and string-free, ready for `models/` together with `win-dns-dynamic-update`'s (see "Shared requests").

## Deviations from the task

- **Params.** The `failover` toggle is a choice `event`: `lease`, `failover`, `expiry` (the three stories exclude each
  other, and the lease-expiry preset needs an event of its own). The `proxy` toggle is a third value of `creds`
  (`computer`, `proxy`, `dedicated`): DnsUpdateProxy holds computer accounts, so it means nothing with the dedicated
  user, and eight controls plus five presets did not fit the panel at 1920×1080. Added: `discard` (the task's
  `discardOnDelete`, needed for "off → records stay") and a fourth client, `clash`, the laptop named FS1 (the
  name-protection preset needs it).
- **Failover as two servers with their own parts of the scope.** The task has DHCP2 renew PRN-3 "with a new address
  10.0.10.88". A failover partner proper would keep 10.0.10.53 (`win-dhcp-failover`), so here DHCP1 is down, PRN-3
  restarts and asks from scratch, and DHCP2 offers from its own range. The refusal is the same either way.
- **Step counts:** windows-default 6, failover-refused 7, lease-expiry 5 and name-protection 6 as the task says;
  **printer-none 2, and 6 with legacy** (task "5 + 3"). With one step per DHCP exchange the printer without records has
  nothing after the ACK; with legacy it has two UPDATEs and two answers.
- **Preset order:** windows-default, failover-refused, printer-none, lease-expiry, name-protection. The task's order
  puts the 2-step printer second, and the gate opens the second preset at step 3 (its `s(3)` is clamped to the
  default's 6 steps, not the preset's); see "Shared requests".
- **Captions:** the task's two captions are used word for word (the option-81 one at the ACK of windows-default, the
  DHCP2 one at the refusal of failover-refused, both languages).
- **Title** "DHCP registering clients in DNS" / "DHCP upisuje klijente u DNS".

## Sources

- Task file, model and presets; `sims/win-dns-dynamic-update/` (the record table, ownership rule and its SPEC).
- RFC 4702 (option 81, S/O/N flags), RFC 4701 (DHCID), RFC 4703 (the two-step update with prerequisites: "name not
  in use", then "DHCID matches"; YXDOMAIN and NXRRSET), RFC 2136 (prerequisites before permissions, all or nothing).
- Microsoft documents named in the task, from memory; no network access was used in this session, so none of the
  titles or defaults was confirmed online *(check)*.
- UL book ch19 ("Šire o temi", PTR zones): the reverse-zone naming and "obrnuto razrješavanje".

## Checks

- Numbers: an independent Python hand model (17 cases: the five presets and their neighbours, steps and final records)
  before `sim.js` was written; the model agrees on every one. All 864 param combinations end, the largest in 9 steps.
- Rule tests broken on purpose, 31 mutations one at a time (27 before the review, 4 from it) (atomicity, check order, ownership with and without
  DnsUpdateProxy, Name Protection with updates off, server-first order, case, option 81 per client, each DNS-tab
  setting, credentials, Secure only, the workgroup client giving up, both Name Protection tries, the stop after a
  conflict, lease length, the failover's lost DISCOVER, the times): every one fails a test.
- Browser sweep: 500 pages (both languages × 20 param sets × every step, at 1920×1080 and 375×812): no page scroll at
  1920×1080, no sideways scroll, no overflow of the left column, no empty caption or `undefined`/`NaN`/placeholder, no
  console errors or warnings. Found and fixed on the way: the left column overflowed in the failover scenes (compact
  DHCP card), a check-list row wrapped its ✓ away from its text, UPDATE fields ran over DC1's lifeline with four lanes
  (the chart now carries only the record types, the names are in the message card), the panel was 200 px too tall.
- `npm run gate -- win-dhcp-dns-update`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed.

## Unchecked *(check)*

- The DNS tab defaults: "only if requested" on, "Discard A and PTR records when lease is deleted" on, "for DHCP
  clients that do not request updates" off; Name Protection off and available from Windows Server 2008 R2.
- A Windows client's option 81 with S = 0 by default; under "always" the server answers S = 1, O = 1; with updates off
  the ACK carries no option 81 and the client registers A and PTR itself.
- Name Protection: the server registers A and PTR for every option-81 client, as under "always"; legacy clients get the
  same treatment when that setting is on; after an NXRRSET conflict it writes no PTR either.
- DnsUpdateProxy: "objects created by members have no security", and the next writer outside the group becomes the
  owner; a member writing an open name leaves it open.
- After a refused A update the server still sends its PTR update (failover-refused depends on it).
- The registration credentials make the user the owner of the records (`Set-DhcpServerDnsCredential`, the
  "DNS dynamic update registration credentials" dialog).
- An expired lease is deleted at once here; Windows keeps it for a grace period first.
- The 8-day default lease.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| option 81 (Client FQDN) | opcija 81 (puno ime klijenta) | task |
| PTR record | PTR zapis | task, UL ch19 |
| registration credentials | vjerodajnice za registraciju | task |
| Name Protection | zaštita imena | task |
| record owner | vlasnik zapisa (u ACL-u) | task, `win-dns-dynamic-update` |
| lease expiry | istek zakupa | task ("istek dodjele"); "zakup" as in `win-dns-scavenging` and `win-dhcp-scope-options` |
| forward / reverse lookup zone | zona pretraživanja unaprijed / obrnutog pretraživanja (headings: "pretraživanje unaprijed", "obrnuto pretraživanje") | simdeck, after the review *(check)* |

The task's "istek dodjele" was replaced by "istek zakupa" to match the other DHCP pages; *lease* is an open glossary
question (docs/tasks/OPEN.md, "Glossary conflicts"). `access control list` is used from the glossary.

## Known limits

- At 375×812 the K1 chips of the four-lane failover chart are wider than their lanes and are clipped by the kit (no
  sideways scroll); the message card has the whole message.
- The "Discard" toggle stays enabled outside the expiry event (it has no effect there, SPEC T4): a disabled toggle's
  hint line did not fit the panel.
- At 1920×1080 the panel fits with a slightly tighter spacing than the kit's default (page CSS on `.sd-panel`,
  `.sd-group`, `.sd-ctl`, as `ddos-amplification` does).

## Shared requests

- **models/:** promote the record-lifecycle functions of `win-dns-dynamic-update` (`rec`, `key`, `find`, `byName`,
  `zoneAccepts`, `mayWrite`, `applyUpdate`) with this page's additive extension of `applyUpdate`: record `type`
  (A, DHCID, PTR; `find(records, name, type)`), `prereq` (`{ nxdomain }`, `{ dhcid }` → YXDOMAIN / NXRRSET),
  `deletes` as `{ name, type }`, the owner kept per name, and `sender.proxy` (a writer whose records get no owner). This
  page's copy is marked `from sims/win-dns-dynamic-update/sim.js @ 7a49e71`; `win-dns-scavenging` copied the same
  part.
- **Gate (`kit/tools/check-page.mjs`):** the deep-link check opens the second preset at `min(3, steps)` with the
  default params' step count, so a second preset shorter than 3 steps fails. Use the preset's own step count.
- **K1:** an open-lock mark for "no owner" and legend swatches `signed`, `server`, `client`, `open`, `ok`, `no`: the
  page defines them in its CSS.

## Fresh review

A separate agent read the task, SPEC.md, sim.js, the page and the strings, probed the model, broke rules in a copy
(16 mutations) and drove the page. It confirmed the model against SPEC.md and the preset numbers, and found no
technical claim it held wrong with confidence (DNS-tab defaults, S/O flags, DnsUpdateProxy, credentials, RFC 4703's
two tries). Fixed from it:
- the hijack caption claimed `fs1` belonged to DHCP1$ when it had no owner (DnsUpdateProxy), and fired in the
  clash failover where `fs1` already led to the laptop (now only while `fs1` led to the file server);
- the delete caption named the sender as owner of records with no owner (new `capOkDelOpen`);
- the stale-PTR tail printed "53 PTR PTR", and blamed DHCP1's outage for a PTR the client owned (updates off);
- four surviving mutations got tests: "always" for clients without option 81, Name Protection for legacy clients, a
  refused update remembered in the lease, the second try re-adding the DHCID;
- captions now quote the controls' own labels; Croatian "1. dana", "kakvima", the term *failover* in italics,
  "sljedeći koji ga upiše, a nije član grupe", the zone headings; unused strings removed; the DHCP card says that Name
  Protection acts as "always"; the client lane keeps its address until DHCP2 gives it another; the expiry note takes
  the lease length from the model; the DHCP card shows only this client's leases (it overflowed in the clash failover).
- Not changed: "Discard" stays enabled (Known limits).

## Time

Start 2026-11-04 15:44; model, tests, page and gate passing by about 16:10; review fixed, gate passing and status ready at
16:20: about 36 min.
