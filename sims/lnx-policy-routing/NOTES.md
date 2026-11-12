<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-policy-routing: notes

New stepper (task `docs/tasks/w3/lnx-policy-routing.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The network is kit view K2 (`kit/topology.js`), the rule list and the routing tables main and 100 kit view K4
(`kit/ruletable.js`); `local`, a table that does not exist, the packet and the log are HTML.

## Decisions

- **Scene.** On top the network (K2): `pc20` and `pc30` on the LAN bus with `rt1`, `rt1` to ISP-A (`eth0 .10`) and
  ISP-B (`eth1 .10`), both ISPs to the internet host 192.0.2.80; empty columns between linked cards leave room for the
  packet chip. Below, three columns: the rule list (K4) with the packet box under it (source, destination, incoming
  device, the `ip route get … from … iif …` question and the kernel's answer once decided); the tables (`local` as
  rt1's three addresses, `main` and `100` as K4 tables, a table a rule names that does not exist as a one-line box with
  the kernel's `FIB table does not exist`); the log of packets sent (rule, table, ISP, fate), so two packets can be
  compared (COMMON.md §11).
- **The rule list in K4** uses the page's own rule ("a rule of the page's own", sim-ui §12): every row gets its mark
  from the model, because a matching rule whose table has no route does not decide (rule 4), which first-match mode
  cannot express. Marks: ▷ matches (its table is next), ▽ matches but the table had no route (the kit's "beaten", with
  the word "no route"), ▶ decides with the table or "drops", – no match (the selector struck), hatched "not read" below
  the decision. The pointer chip is the packet number. One selector column (`from …`, `to …`, as `ip rule` writes it)
  instead of separate from/to columns: it fits at 1920×1080 in both languages; a failed selector strikes the whole
  cell.
- **The route tables in K4**, mode `specific` with rank = prefix length: every row is read at once, the longest prefix
  wins, the others are "beaten"; the implicit row "no row → next" wins when nothing matches. The next-hop column
  shows `via` or, for a route without one, `dev …`. The table being looked up has the thick border; during the forward
  step the chosen table keeps its winner without the border.
- **Steps.** Rule 0 and the `local` lookup are two steps for every packet (rule 1 is the task's first rule and the
  misconception "routing looks only at the destination" needs the source visible at every rule). The decision is shown
  at the lookup (the `ip route get` answer appears there); the log gets the packet at the forward step, when its fate
  is known.
- **Scripts.** A `script` param (select, resets) holds each preset's packet list and commands, as in
  `lnx-routing-decision`. `lan-leak` and `reply-path` contain their fix as a command step (`ip route add … table 100`,
  `ip rule add from 198.51.100.10 lookup 100`), so "before and after the fix" is one run; with the toggle already on, the
  command shows the kernel's answer (`File exists` for the route; for `ip rule add` without a priority a second
  identical rule at a new priority, rule 6c). `one` sends one packet from `source` to `dst`; those two controls are shown
  only then (`visible`). A LAN host to a LAN address is one `direct` step: the packet crosses the LAN and rt1 is not
  asked (rule 7).
- **reply-path starts with the request** (192.0.2.80 → 198.51.100.10 in on `eth1`: rule 0, `local` has the address,
  delivered to rt1): it shows the `local` table answering, the other half of rule 1, and where the reply's source
  comes from.
- **NAT is assumed** for LAN sources (rule 7): without it every LAN packet would be dropped by an ISP; the explanation
  says so in one sentence. Only a source that is the other uplink's address is filtered.
- **Table 100 has no name** in `rt_tables`, so every output says `100` (the task's commands say `lookup 100`; with
  `ispb` in `rt_tables`, `ip rule` would print `lookup ispb`).
- **Captions** stay within two lines at 1920×1080 in both languages for every preset × step and every `one`
  combination (a Playwright scan). The task's caption (pc30, rule 1000, table 100) is split over its two steps: the
  rule step says the first sentence ("… looked up in table 100, not in main"), the lookup step the second ("Its only
  route is the default, towards ISP-B").

## Deviations from the task

- **lan-leak is told differently** (fresh review): the task has `pc30` send to `pc20`, but both are in 192.168.10.0/24,
  so `pc30` delivers on its own link and rt1 never sees the packet (rt1 would answer a forward with `cache <redirect>`,
  kernel). The preset now shows the same misconception on a path that does cross rt1: `pc20` asks rt1 at its ISP-B
  address 198.51.100.10, rt1's reply (from 198.51.100.10, with `replyRule` on, rule 999) matches the source rule, table
  100 has only the default and the reply leaves to ISP-B; `ip route add 192.168.10.0/24 dev eth2 table 100` fixes it (kernel,
  checked by the reviewer). 13 steps. The owner may prefer another shape (a second LAN segment for `pc20`); see the report.

- **Params:** `rule900` and the blackhole rule are not toggles; the scenarios `empty-table` and `blackhole` bring them
  (the task lists them only in the presets). Two more toggles made the panel scroll at 1920×1080. Added `script`.
- **Step counts:** two-sources 11 (task 8), lan-leak 13 (10), empty-table 8 (6), reply-path 14 (10), blackhole 3 (3).
  The task's counts are marked "derived, unchecked" and do not follow its own step definition (one rule per step, then
  the lookup, then forward): with rule 0 and `local` as their own steps, two-sources is 6 + 5. lan-leak and reply-path
  add one step for the fix command and the request to rt1 (2 steps).
- **State:** the task's fields are there (`rules`, `tables`, `packet`, `phase`, `ruleIdx`, `chosen`, `outcome`, `log`);
  added `item`, `ev`, `cmd`, `marks`, `miss`, `lookup`, `get`, `getCmd`, `forward`, `end`, `run`, `packets`, `event`.
- **Destination choice** keeps the task's two; a packet to rt1's own address (rule 0 deciding through `local`) is in
  the model and tested, and shown by reply-path's request, not offered as a choice.
- **Legend:** the task's "packet (dot)" is K2's chip with the packet number, "dropped (×)" K2's cross at the receiver
  and dashed ✕ badges; the rule being tested is K4's pointer chip and the changed mark.

## Sources

- ip-rule(8), ip-route(8) (iproute2 6.1), read for this task: the RPDB, the three default rules, "the RPDB program
  continues with the next rule", the actions, `priority`.
- **Kernel checks**, Linux 6.8.0 (Ubuntu 24.04), iproute2 6.1, in `unshare -rn` with dummy `eth0`/`eth1`/`eth2`, the
  scene's addresses and `ip_forward=1` (2026-11-12):
  - `ip rule` at start: `0: from all lookup local`, `32766: from all lookup main`, `32767: from all lookup default`.
  - `ip route get 192.0.2.80 from 192.168.10.20 iif eth2` → `192.0.2.80 from 192.168.10.20 via 203.0.113.1 dev eth0`;
    from `.30` → `… via 198.51.100.1 dev eth1 table 100`.
  - `ip route get 192.168.10.20 from 192.168.10.30 iif eth2` → `via 198.51.100.1 dev eth1 table 100`; after `ip route
    add 192.168.10.0/24 dev eth2 table 100` → `192.168.10.20 from 192.168.10.30 dev eth2 table 100`; adding it again →
    `RTNETLINK answers: File exists`, exit 2; `ip route show table 100` lists the default first.
  - Rule 900 → table 200 (never created): `ip route show table 200` → `Error: ipv4: FIB table does not exist.`; the
    packet goes on to main (`via 203.0.113.1 dev eth0`). Table 100 holding only the LAN route: 192.0.2.80 from .30 goes
    on to main.
  - `ip route get 192.0.2.80 from 198.51.100.10` → `… via 203.0.113.1 dev eth0 uid 0`; after `ip rule add from
    198.51.100.10 lookup 100` (it became 999) → `… via 198.51.100.1 dev eth1 table 100 uid 0`. With only the default
    rules the same add gets 32765; adding it twice gives two identical rules (exit 0).
  - Two rules at priority 700 (`lookup 100` added first, then `lookup main`): listed in that order, table 100 decides.
  - `ip rule add to 192.0.2.0/24 blackhole priority 500` → `ip route get 192.0.2.80` → `RTNETLINK answers: Invalid
    argument`; `unreachable` → `Network is unreachable`; `prohibit` → `Permission denied`.
  - `ip route get 192.168.10.1 from 192.168.10.30 iif eth2` → `local 192.168.10.1 from 192.168.10.30 dev lo table local`.
- `sims/lnx-routing-decision/sim.js` @ 104fc2f: `parse`, `format`, `mask`, `match`, `lookup` copied into `sim.js`
  (models/ has no IPv4 model yet; see Shared requests).
- URM ch11 (*tablica usmjeravanja*, *najdulji podudarajući prefiks*), UL ch14 (`ip route get`), NLA toc T05 (*usmjeravanje
  po pravilu*), RFC 5737 (addresses), RFC 2827 / BCP 38 (an ISP accepts only the sources it assigned).
- **Fresh review on the kernel** (same setup): `Network is unreachable`, exit 2, when no rule gives a route (main's
  default removed); an identical rule at the same explicit priority refused with `File exists`, exit 2; `ip route get
  192.168.10.20 from 198.51.100.10` → `via 198.51.100.1 dev eth1 table 100` with the reply rule, `dev eth2 table 100` after
  the LAN route; with `rp_filter=1` the reply-path request fails (`Invalid cross-device link`) until the reply rule
  exists, so `rp_filter` 0 or 2 is assumed (SPEC.md "Out of scope").
- *(check)*: the ISPs' source filtering and their dropping a private destination are modelled, not observed; NAT for
  the LAN is assumed.

## Concepts, not tools

The subject is Linux policy routing, which NLA T05 teaches with `ip rule` and `ip route … table`; those commands, the
kernel's answers and the `local`/`main`/`default` tables are what is taught. The packet filter is named generically
(fwmark, one sentence). No product is named.

## Term pairs

From the glossary: *default route* (zadana ruta). Missing from `kit/glossary.js`, written out in both tables:

- *policy routing* — **usmjeravanje po pravilu** (NLA toc T05)
- *routing table* — **tablica usmjeravanja** (URM ch11; `lnx-routing-decision` uses UL's *usmjerivačka tablica*)
- *rule* — **pravilo**; *source address* — **izvorišna adresa** (URM ch11); *longest prefix match* — **najdulji
  prefiks** (URM ch11: *najdulji podudarajući prefiks*); *uplink* — **vanjska veza** *(check)*

## Shared requests

- **Kit:** `.sd-ctl { display: flex }` wins over the `hidden` attribute the kit sets for `visible: false`; the page adds
  `.sd-ctl[hidden] { display: none }` like several other pages do. One line in `kit.css` would serve them all.
- **Kit (K4):** a mode for "a match that may still go on" (RPDB, and the same shape as PAM's `sufficient`): the page
  sets every mark itself and reuses "beaten" for "matched, table had no route".
- **Models:** the IPv4 helpers and the LPM lookup are copied for the fourth time (`subnet-mask` → `routing-table` →
  `lnx-routing-decision` → here); an `ipv4` model in `models/` (parse, format, mask, match, lookup with the metric
  tie-break) would serve all four.

## Checks

- `node --test sims/lnx-policy-routing/sim.test.js`: 36 tests, tie-breaks first (same priority, auto priority, duplicate
  rule refused or re-added, duplicate route, LPM order), then one or more per rule, every preset's numbers and marks, the
  log and view fields, kernel listing order, then the template's generic block (JSON-safe, replay, no mutation, strings,
  page presets).
- **Fresh review** (a separate agent: task, SPEC.md, model, tests, strings and page against ip-rule(8) and the kernel; 77
  mutations on a copy). All decision rules and tie-breaks were killed. Fixed from it: the page file had been cut short by
  an edit of mine (restored from the gate's last build); lan-leak sent on a path that never crosses rt1 (above); an
  identical rule at the same priority is refused (rule 6c, model, SPEC and caption); Croatian `cMany` read backwards;
  `rp_filter` assumption; "first rule after zero" → "second rule in the list"; the ISP filtering stated as universal;
  "won't return LAN". Tests added for the surviving mutants (log of blackhole and local outcomes, packet numbers,
  `chosen`, `forward`, `miss`, `event.changed`, `ruleLine` with `to`, kernel listing order, `default` and 200 not
  existing, `routeAdd` prefix check and new table). Not taken: printing `from all to …` for a `to` rule (it does not fit
  the selector column; the page writes it as `ip rule add` takes it), `prior.` as the column label (fit).
- Fit: every preset × step and every `one` combination in both languages at 1920×1080 (Playwright scan): nothing
  overflows the stage, no table scrolls sideways, captions within two lines, the panel without its own scroll.
- `npm run gate -- lnx-policy-routing`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed.

## Time

2026-11-12 21:52 to 22:36, one session: reading and kernel checks (~10 min), model, SPEC and tests (~10), page and fit
(~15), fresh review (run while NOTES.md was written) and its fixes (~10), final checks: about 44 minutes.
