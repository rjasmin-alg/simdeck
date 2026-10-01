# win-dns-forwarders: Forwarders, conditional forwarders, root hints

| | |
|---|---|
| Task | `win-dns-forwarders` (wave 3, DNS on Windows Server) |
| Catalogue entry | `win-dns-forwarders` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-forwarders/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **where a DC sends names it doesn't own**.

The student: resolve internal, partner and internet names.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Configure DNS forwarders" / "Understanding Forwarders" (forwarding timeout, "Use root hints if no forwarders are available"); "Conditional forwarders" (Add-DnsServerConditionalForwarderZone); "Add-DnsServerForwarder" (`-Timeout`, `-UseRootHint`)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md`, "Tko odgovara kad se pita za ime" → "Šire o temi" (definition prosljeđivač, korijenski poslužitelji)
- RFC 1034 §5.3.3 (resolver algorithm); RFC 9499 (term "forwarder")
- Catalogue seed: preset of inet-dns-resolution → §5.4

## Model and presets

- **Scene:** K1 message sequence chart reused from `dns-resolution`. Lanes: client PC-07, DC1 (DNS for `corp.example`), conditional forwarder target `10.20.0.53` (partner's DNS for `partner.example`), forwarder `198.51.100.53` (the ISP's resolver), root, TLD, authoritative. A decision panel next to DC1 lights the rule that sent the query where it went.
- **State:** `t`, `query: { name, type }`, `dc: { zones: [name], condForwarders: [{ domain, targets }], forwarders: [ip], useRootHints: bool, recursion: bool, cache: […] }`, `up: { [serverId]: bool }`, `msgs`, `phase`.
- **One step:** one message. DC1's decision order, checked once per query: (1) cache; (2) a zone it hosts; (3) a conditional forwarder for the longest matching domain; (4) the server-level forwarders, in list order; (5) root hints, if forwarders failed or there are none, and root-hint fallback is allowed; otherwise SERVFAIL.
- **Rules:**
  1. A name in a zone DC1 hosts is answered from that zone with `aa`, nothing is forwarded; NXDOMAIN there is final (Microsoft, "How DNS query works" (check)).
  2. A conditional forwarder applies to names in its domain; the most specific matching domain wins (Microsoft, "Conditional forwarders" (check)).
  3. Otherwise the query goes to the server-level forwarders, first in the list first; each gets a timeout of 3 s before the next is tried (Windows default forwarding timeout (check)).
  4. If every forwarder times out and "Use root hints if no forwarders are available" is on (default on (check)), DC1 resolves iteratively from the root hints, as in `dns-resolution`.
  5. A forwarder that *answers* — even NXDOMAIN — ends the search: no fallback to root hints or to the next forwarder.
  6. With recursion disabled on DC1, forwarders and root hints are not used: only hosted zones answer, everything else gets SERVFAIL/REFUSED (check exact rcode).
  7. Answers are cached by TTL; a cached answer is used before rule 1–5 (RFC 1035 §7.4; `dns-resolution` rule 5).
- **Params:** `name` choice `fs1.corp.example` / `crm.partner.example` / `www.example.org` (default fs1); `condFwd` toggle (partner.example → 10.20.0.53, default on); `forwarderUp` toggle (default on); `rootHints` toggle (default on); `recursion` toggle (default on).
- **Presets:**
  1. `internal` — derived, unchecked: `fs1.corp.example` → DC1 answers `10.0.0.21` from its zone, `aa`; 2 messages.
  2. `partner` — derived, unchecked: `crm.partner.example` → conditional forwarder to `10.20.0.53` → `10.20.5.8`; 4 messages.
  3. `internet` — derived, unchecked: `www.example.org` → forwarder `198.51.100.53` → answer; 4 messages; repeat → 2 messages from cache.
  4. `forwarder-down` — derived, unchecked: forwarder down → 3 s timeout, then root → `.org` → `example.org` → answer; 10 messages, about 3 s slower.
  5. `no-cond-fwd` — derived, unchecked: conditional forwarder removed → `crm.partner.example` goes to `198.51.100.53` → NXDOMAIN (the partner's names are internal), and no fallback (rule 5).
  6. `no-fallback` — derived, unchecked: forwarder down and root hints off → SERVFAIL after 3 s.
- **Steps:** internal 2; partner 4; internet 4 (+2 warm); forwarder-down 10; no-cond-fwd 4; no-fallback 3.
- **Legend:** as `dns-resolution`, plus a "rule that matched" badge on DC1 (zone / conditional / forwarder / root hints / fail) and a ⏱ mark on a timed-out arrow. "Changed" marks the newest message and the decision row that fired.
- **Captions:**
  - hr: "Ime `crm.partner.example` pripada partneru: DC1 ga šalje *conditional forwarder*-u (uvjetnom prosljeđivaču) 10.20.0.53."
  - en: "`crm.partner.example` belongs to the partner: DC1 sends it to the conditional forwarder 10.20.0.53."
  - hr: "Prosljeđivač je odgovorio NXDOMAIN — to je odgovor, ne kvar, pa DC1 ne pokušava preko korijenskih poslužitelja."
  - en: "The forwarder answered NXDOMAIN. That's an answer, not a failure, so DC1 doesn't try the root hints."
- **Terms:** forwarder — prosljeđivač (UL ch19); conditional forwarder — uvjetni prosljeđivač; root hints — popis korijenskih poslužitelja (*root hints*); recursion — rekurzija; timeout — istek vremena čekanja; authoritative — autoritativni.
- **Misconceptions:** "if the forwarder says the name doesn't exist, the DC asks the root" (only on no answer); "a forwarder is needed to reach the internet" (root hints work alone); "conditional forwarders and stub zones are the same" (a stub zone learns the NS list itself; contrast in the explanation).
- **Out of scope:** stub zones in depth (`win-dns-zone-types`), client-side order (`win-dns-client-order`), DNS policies, recursion scopes, DNSSEC.
- **Reuse from `dns-resolution` (soft dependency):** the K1 lanes, the iterative walk (root → TLD → authoritative), the cache with TTL; new: the DC decision order, conditional and server forwarders, timeout and fallback.
- **Note for the coordinator:** the catalogue seed calls this a "preset of `inet-dns-resolution`", but the task is a separate stepper. The decision order (rules 1–6) is a concept of its own, so a separate page on the shared model looks right; confirm.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-forwarders sims/win-dns-forwarders` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-forwarders/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
