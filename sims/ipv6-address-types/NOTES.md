<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-address-types: notes

New explorer (task `docs/tasks/w3/ipv6-address-types.md`, catalogue `net-ipv6-address-types`, §4.1, wave 3). Rules,
tie-breaks and expected numbers: `SPEC.md`.

## Decisions

- **Text field is the page's own** (the kit has no text param), built as in `lnx-regex-match`: the stage is built
  once and updated in place so the caret stays; Enter or Escape leaves the field so the clicker keys work again;
  `addr` and `set` are model params set with `sim.set` and kept in the URL by the page when they differ from the
  preset. Only text that parses is stored (rule 7); while the field holds invalid text the page keeps the error in a
  page variable, marks the field (`aria-invalid`, dashed red border), shows the reason in place of the RFC 5952 line,
  and the caption names the address kept. A preset, a list button or reset clears it.
- **Preset address lists.** Four of the five presets name several addresses. A preset sets `set` (its list) and loads
  the first address; the list is a row of buttons under the field ("In this example:"), the address shown pressed.
  So one preset shows Primjer 2's four addresses one by one without typing.
- **Layout.** Left: the address box and the prefix table; right: the type card and the bit strip; across the bottom
  the topology. The table needs nine rows at 1920×1080: the field's hint ("Enter gives the keys back") went into the
  explanation, list buttons use the small mono size, and the topology's region titles sit on their borders.
- **Bit strip** in rows of 16 bits (one row for /3 … /10, two for /20 and /32; /128 shows the first and last group and
  summarises the 96 bits between). A 32-bit single row did not fit the right column. A hex digit sits over each nibble
  so "3 = 0011" is visible for rule 2. For an unassigned address the strip compares with the **nearest row** (SPEC
  rule 1) and marks the first differing bit with ✕: `4000::1` against `2000::/3` shows bit 1.
- **Reach on the topology:** nested regions (site ⊃ links), shaded in the type's series colour and its own stripe
  direction (GUA 45°, link-local vertical, ULA horizontal, multicast dots; special types have no shading, a slashed
  swatch). Every node also says ✓ gets it / – does not, and the node where the packet stops carries ⛔ and the
  reason (R1 does not forward, R2 filters, never leaves H, not sent). Colour is never alone; checked in grayscale.
- **"changed" (`hl`)** marks the matched prefix bits, the winning table row and the compared digits of the full form.
- **Neighbour N, host H2 and server S** are added to the task's H, L1, R1, L2, R2 and cloud, so "who gets it" has
  someone on each region (the `two-on-one` preset's neighbour and server).
- **Reach vs scope.** The table column and the card say *Domet* / *Reach* (where a packet travels); *Doseg* /
  *Scope* is kept for the multicast scope nibble, as the task's term list gives "scope — doseg".
- **Phone (375 px):** one column; the table drops its Reach column (the card and the topology carry it) and the mark
  words keep only their symbols (◀ ✓ ≈); the topology's wires are hidden and the regions stack.
- The address helpers (`parse`, `compress`, `full`, `bitsOf`, `classify`, `typed`) are pure functions over plain data,
  promotable to `models/` with `ipv6-slaac`'s and `ipv6-shorten`'s (see Shared requests).

## Deviations from the task

- **`3fff::/20` added as a second documentation row** (RFC 9637, 2024, *(check: from memory, no network this
  session)*). Without it `3fff::1` would show as a GUA reaching the internet. `3ffe::1` (the `bits-not-digits`
  preset) is outside it, so the task's numbers are unchanged. The explanation names it in one clause.
- **Reach values `admin` and the multicast scopes beyond the task's five.** The task lists 1, 2, 5, 8, e. A typed
  address can carry any nibble, so the model follows RFC 4291 §2.7 for all 16: 0 reserved → none (dropped), f
  reserved → global (the RFC says treat as global), 3 realm-local (RFC 7346), 4 admin-local and the unassigned ones →
  reach `admin`: no fixed region, drawn as a dashed "?" over the site, "set by the administrator".
- **Organisation scope (8) is drawn as the site** with a note that an organisation may span several sites; the
  task's reach enum has no `org`, and the picture has one site.
- **State fields** beyond the task's list: `full`, `groups`, `group` (legend series), `matches` (every matching row),
  `matchLen`, `scopeNibble`, `mcGroup`, `lBit`, `nearest`, `reachNodes`, `stopAt`, `input`, `error`, `set`, `list`,
  `inList`. `scope` is the multicast scope name (null for unicast), as the table shows reach for unicast.
- **Documentation and unassigned destinations stop at R1, not at H.** The task's reach is `none`; the first draft
  said "the packet does not leave H", which is right only for `::` (and multicast scope 0). H sends any other
  destination to its router; R1 drops it (filtered, no route). `stopWhy: 'unrouted'`, "R1 drops it". From the review.
- **Not modelled, by scope:** the 54 zero bits RFC 4291 §2.5.6 requires after `fe80::/10` (`fe80:1::1` shows as
  link-local without comment); the multicast flags' validity (`ff2e::1`, P = 1 with T = 0, RFC 3306); IPv4-mapped
  (`::ffff:0:0/96`) and NAT64 (`64:ff9b::/96`) addresses typed in hex show as "not assigned", because the task puts
  IPv4-mapped addresses out of scope (the dotted form is refused with a reason).
- **Notes beyond the task:** `fec0::/10` says it was the old site-local range (RFC 3879); unassigned addresses name
  their nearest prefix; well-known groups are named (all nodes, all routers, all DHCP servers, NTP, solicited node).
- **The `two-on-one` GUA is `2a02:c7f:5a3e:1:204:61ff:fe9d:f156`**: the task says "the GUA value is derived". It is
  Primjer 1's interface ID behind a /64 picked from RIPE's `2a00::/12` space. A documentation prefix (`2001:db8::/32`,
  `3fff::/20`) cannot be used here, since this page shows those as never routed; the book's own GUA in Pitanja 9
  (`2a02:1810:4f2b::a7`) is homework, so it is not reused. Any real-looking GUA belongs to someone; owner may prefer
  another (OPEN item).
- **Book erratum** (task's coordinator note): URM ch10 Primjer 2 and the figure `ch10-vrste-adresa-prefiksi.svg` call
  `2001:db8:85a3::8a2e:370:7334` "globalna unicast adresa, usmjeriva na cijelom internetu"; it is in the
  documentation prefix (RFC 3849). The page says so (`four` preset, explanation). The erratum itself is outside
  simdeck (report).

## Sources

- URM `book/chapters/10-ipv6.md`: "Vrste IPv6 adresa i podmreža veličine /64" (the prefixes, bits not digits, which
  address talks to whom), Primjer 1, Primjer 2, Pitanja 10; figure `assets/diagrams/ch10-vrste-adresa-prefiksi.svg`
  (the address/neighbour/server idea, not copied).
- RFC 4291 §2.2 (text forms), §2.5.2 (unspecified), §2.5.3 (loopback), §2.5.6 (link-local, routers must not forward),
  §2.7 (multicast, flags and scope nibbles, reserved 0 and F), §2.7.1 (solicited node); RFC 7346 (realm-local scope 3);
  RFC 4193 §3, §3.1 (L bit), §4.1 (routing inside the site), §4.3 (border filtering); RFC 3849 (2001:db8::/32); RFC 9637 (3fff::/20)
  *(check)*; RFC 3879 (site-local deprecated); RFC 5952 §4 (text form); IANA IPv6 Address Space and IPv6 Multicast
  Address Space *(check: group names from memory)*.
- `compress` and `full` are copied from `sims/ipv6-slaac/sim.js @ 06c1f7e` (marked in the code); `parse` is new
  (slaac's does not validate).
- Numbers checked with Python's `ipaddress` before coding (SPEC "Numbers checked").

## Unchecked *(check)*

- The fresh reviewer confirmed from memory RFC 9637 (`3fff::/20`), the RFC 3879 date, the scope values, `ff05::1:3`
  and `ff0X::101`, and placed the border filtering in RFC 4193 §4.3 (not §4.1, which is routing inside the site).
  Neither of us had network access: still unchecked against the documents themselves.
- Croatian terms marked below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| global unicast address (GUA) | globalna unicast adresa | URM ch10 |
| link-local address | link-local adresa | URM ch10 |
| unique local address (ULA) | jedinstvena lokalna adresa | URM ch10 |
| multicast address | multicast adresa | URM ch10 |
| loopback address | adresa povratne petlje | URM ch10 (glossary has *loopback*, used as `[[loopback]]`) |
| unspecified address | neodređena adresa | task *(check)* |
| documentation address | dokumentacijska adresa | simdeck *(check)* |
| scope (multicast) | doseg | task *(check)* |
| reach | domet | simdeck *(check)* |
| site | lokacija | simdeck *(check)* |
| prefix | prefiks | URM ch10 (glossary has *network prefix*, mrežni prefiks) |
| solicited-node | traženi čvor | as in `ipv6-slaac` *(check)* |

## Checks

- Tests: 28 (tie-breaks first: longest match for both documentation prefixes, the exact /128 rows, the nearest-row
  share and its tie; then rules 1–7, the presets' expected types and reach, the scene, the template's generic block).
  Mutation pass: 41 scripted mutations of `sim.js` (prefix lengths, reach per row, sort order, scope nibble position
  and each scope's reach, L bit, nearest share and tie, RFC 5952 tie and single-group rules, each parse refusal,
  trimming, invalid text keeping the address, node lists and stops, group names, notes): all 41 fail a test. The first
  pass found the `fec0::/10` note untested; a test was added.
- Browser: `npm run gate -- ipv6-address-types` passes (46 browser checks). Own sweep at 1920×1080 of 16 states in
  both languages (every preset, `4000::1`, `fec0::1`, `ff04::1`, `::1`, `3fff::1`, `zzz`, `1:2:3`, a dotted IPv4 part,
  `showBits` off): no box overflows, no page scroll. Phone 375×812 full-page screenshots reviewed: no sideways scroll.
- Scripted interaction: typing valid and invalid text (`fe80::1::`, `fe80::1g`, `zzz`), Enter/Escape, preset keys
  after an error, a list button, reload from the URL, a bad `addr` in the URL, reset: every state as SPEC rule 7 says;
  no console errors.
- Screenshots reviewed: light, dark, grayscale, phone, both languages.
- Fresh review (a separate agent, playbook §7.4): read SPEC, model, tests, page and strings; 25 more mutations and a
  browser probe. Fixed from it: a typed error survived a list button, preset or reset that loaded the same address
  (now any render not from the field resyncs it); the strip hid the first differing bit when it lay in the middle of
  a /128 (`::1:0`); documentation and unassigned destinations "did not leave H" (now R1 drops them); the ULA border
  citation (§4.3); four test gaps (`3fff::1`'s note, the solicited-node checks, `fbff::1`'s note, the page's built
  string keys); wording ("a packet to it", "duljem", the Enter hint).

## Shared requests

- **Kit: a text param** (`type: 'text'` with `validate`), as `ipv6-shorten`, `lnx-regex-match`, `hash-properties`,
  `sql-injection` and `password-storage` already ask. This page hand-rolls one (field, error, URL).
- **models/: an IPv6 address model** (`parse` with validation, `compress`, `full`, `bitsOf`, `classify`): this sim,
  `ipv6-slaac` and `ipv6-shorten` each hold a copy of the RFC 5952 form. Promote from this `sim.js` (the validating
  parser) and point the other two at it.
- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.

## Time

Start 17:48, done (gate, sweeps, mutation pass, fresh review and its fixes) 18:18: about 30 minutes, one session.
