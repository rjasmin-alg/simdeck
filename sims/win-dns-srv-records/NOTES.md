<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-srv-records: notes

New stepper (task `docs/tasks/w2/win-dns-srv-records.md`, catalogue `win-dns-srv-records`, §4.5.3 and §5.21, wave
2b). Drawn with kit view K1 (message sequence chart) on the right; the record list on the left is page code. Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Left: "What the domain controllers put in DNS", 14 owner names in four groups by what uses them (DC
  locator, Kerberos, global catalog, replication), each with its port and one chip per target DC (DC01 with an
  orange edge, DC02 pink, and the name written in the chip, so colour is not the only carrier). A deleted record's
  chip is dashed, struck through and ends in a red ✕; a present one ends in ✓. The row the client queries this step
  is highlighted; in an answer step the picked target's chip has a thick border and ◂. Right: the result box (… /
  ✓ / ✓ with ⚠ tags for WAN and NTLM / ✕ with the error message), then K1 with the lanes PC07, the public DNS (only
  when the client asks it), the DNS server on DC01, DC01 and DC02.
- **Names: `quillmoor.example`, not `corp.example`.** Every other Windows sim (`win-dc-promotion`,
  `win-domain-join`, `win-ad-structure`, `win-kerberos`, …) uses `quillmoor.example`, DC01 10.10.0.10 and PC07
  10.10.20.57; the task's `corp.example`, DC1 10.0.0.10 would have been the only exception. The sites are
  `win-ad-structure`'s HQ (10.10.0.0/16) and Branch (10.20.0.0/16), not HQ and Split; DC02 is 10.20.0.10. The DSA
  GUIDs are `win-dc-promotion`'s. The task's captions are kept with the names changed.
- **Owner names are shown relative to the domain** (`_ldap._tcp.dc._msdcs`, not `…​.quillmoor.example`), with a note
  above the list; the captions give the full name. The two replication CNAMEs show the GUID's first 8 hex digits
  (`3b6f0c2e…._msdcs`), the full name in the tooltip.
- **Records modelled (SPEC rule 2):** the task's nine plus the site Kerberos records
  (`_kerberos._tcp.<site>._sites.dc._msdcs`), `_ldap._tcp.<site>._sites.dc._msdcs` for both sites and
  `_ldap._tcp.gc._msdcs`: 14 names, 21 records. The site Kerberos records are needed because the KDC lookup is
  site-aware like the LDAP one; they belong to both the `kerberos` and the `siteRecord` groups (deleted by either
  toggle), so "no Kerberos records" and "no site records" each mean what they say.
- **One step = one message or event:** each DNS query and each answer, each LDAP ping and reply, AS-REQ, AS-REP, the
  NTLM request and answer; the restart, the UPDATE and its answer. The result appears with the last message (no extra
  step); a failed run adds a "✕ no DC" note on the client in that same step.
- **The KDC is looked up separately** after the locator (SPEC rule 6): site record first, then domain-wide. This is
  why `no-site-record` is 12 steps, not 9.
- **NTLM fallback** is one request and one answer (the three NTLM messages and the pass-through are not drawn); the
  result is ✓ with "⚠ NTLM, no Kerberos ticket". Where policy forbids NTLM the logon would fail; not modelled.
- **A join never knows its site** (fresh review): a computer being joined is not a member and has no stored site, so
  it always asks `_ldap._tcp.dc._msdcs` first and learns its site from the LDAP ping. The task's preset and caption
  had the joining client ask the site record; that made "delete the locator records" harmless for a join, against
  the task's own rule 5. The task's site-record caption now belongs to a logon. For a join, `branch` and `unknown`
  run the same.
- **Site "unknown"** is a computer in Branch that has not learnt its site yet: it asks the domain-wide record, pings
  DC01 (first listed), learns "Branch, not closest", asks Branch's record and pings DC02. In HQ the same client would
  land on DC01 at once and show nothing new, so the option is Branch only.
- **Tie-break (rule 8):** every answer lists DC01 before DC02 and the model takes the first. In `no-site-record` that
  sends a Branch client to DC01 in HQ, which is the WAN story without a contrived answer order.
- **GC toggle** changes nothing in the run (one-domain forest); the last caption says so. It is there because the
  task asks for it and the misconception "every deleted record breaks logon" is worth answering.
- **Params reset the demo** (`resets: true` on all): every one changes the step count.
- **Panel fit.** The toggles have no hints (the record list shows what each deletes) and the preset labels are short,
  with the detail in the tooltip; with hints the panel was 177 px too tall at 1920×1080.
- **No time column** in K1 (`timeWidth: 0.4rem`): there are no times, and the protocol is carried by the line style
  and the legend (DNS dashed, CLDAP dotted, Kerberos and NTLM solid, NTLM thin). Without it the lanes are wide enough
  for the short fields (`_ldap HQ`, `_kerberos dc`).

## Deviations from the task

- **Names** (above): `quillmoor.example`, DC01/DC02, sites HQ/Branch, DC02 10.20.0.10.
- **`no-locator` and `public-dns` are 2 steps** (task: 4): a join asks only the domain-wide record (above). As
  logons they are 4.
- **`no-site-record`**: the client is in Branch and lands on DC01 in HQ (task: client in HQ, DC2 listed first). Same
  lesson, and the first-listed tie-break needs no special answer order. 12 steps (task: 9), because the KDC lookup is
  its own two DNS queries (site, then domain-wide).
- **`restartNetlogon` is a toggle, not a button:** the kit replays the state from the params, so a button that changed
  the run halfway would need hidden state. The toggle puts the restart in front of the client's run (the task's "3 +
  8").
- **Added preset `no-kerberos`** (logon, Kerberos records deleted: NTLM fallback), so rule 6 has a preset.
- **Re-registration interval** not named on the page ("periodically"): [MS-ADTS] §6.3.1.10 says 60 minutes, other
  sources 24 hours (the task says 24 h *(check)*); `win-dc-promotion` made the same choice.
- **Croatian "domain join"**: the task's term list says *pridruživanje domeni*, `win-domain-join` (already merged)
  uses *učlanjenje u domenu* in its title and captions. This page uses *učlanjenje* for consistency on the site and
  lists *pridruživanje domeni* as an alias; owner to decide (report).
- **"Public resolver"** is *javni DNS (poslužitelj)* in Croatian, as in the task's caption; `win-domain-join` says
  *javni razrješivač*, the glossary has *resolver — rezolver*.

## Sources

- Task file, model and presets; catalogue §4.5.3, §5.21.
- Microsoft Learn (titles from the task, cited from memory, not opened in this session *(check)*): "How domain
  controllers are located in Windows" / "Locating Active Directory domain controllers in Windows and Windows Server";
  "How DNS Support for Active Directory Works"; "Verify SRV DNS records have been created"; "DNS requirements for
  installing Active Directory"; `nltest` reference (`/dsgetdc`, `/dsregdns`).
- [MS-ADTS] §6.3 "Publishing and locating a domain controller": §6.3.2 records, §6.3.1.10 refresh, §6.3.6 locating
  *(check: section numbers)*.
- RFC 2782 (SRV format, priority and weight; weighted random selection), RFC 4120 §7.2.3 (KDC by SRV), RFC 5737.
- `sims/win-dc-promotion/` (domain, DCs, GUIDs, the record set it registers), `sims/win-domain-join/` (PC07, the
  join failure), `sims/win-ad-structure/` (sites and subnets).

## Unchecked *(check)*

- The site-specific KDC lookup (`_kerberos._tcp.<site>._sites.dc._msdcs` first, then `_kerberos._tcp.dc._msdcs`) for
  Windows' Kerberos client; that the locator retries with the site record after a "not closest" ping when the client
  did not know its site.
- The error texts: "An Active Directory Domain Controller (AD DC) for the domain … could not be contacted." and "We
  can't sign you in with this credential because your domain isn't available." (current Windows; older: "There are
  currently no logon servers available to service the logon request."); the Croatian versions are translations, not
  the localised Windows texts.
- NTLM fallback when no KDC is found (and that a join also falls back).
- That neither join nor logon in a one-domain forest needs a GC.
- 24 h (Group Policy default, as the review says) vs 60 min ([MS-ADTS]) re-registration; that restarting Netlogon re-registers at once (`nltest /dsregdns` does).
- Record list completeness ("about 25 per DC"); the records not drawn are listed in SPEC.

## Checks

- **Numbers:** a separate Python hand count of the steps and outcome for all 384 param combinations (written from
  SPEC "Steps" before the model) agrees with the model everywhere; presets 8 / 4 / 12 / 4 / 11 / 10, maximum 17.
- **Mutation test:** 26 mutations of `sim.js`, one at a time (first listed vs last, weight and priority order, an
  unknown client asking the site record, a second site query after a failed one, no re-query, closest always true,
  restart restoring DC02, restoring at the UPDATE instead of its answer, the UPDATE count, a KDC lookup after no DC,
  the public resolver answering, group membership of site Kerberos and PDC records, the GC toggle deleting locator
  records, a port, no domain-wide fallback for LDAP or KDC, NTLM failing, no site KDC query, WAN from the DC only, the
  client learning its site early, the result on the first step, the KDC not stored, GC records in the Kerberos group),
  then 9 more after the fresh review (a joining computer knowing its site, and the reviewer's survivors: WAN from the
  KDC only, NTLM never over the WAN, an extra ping after a failed site query, NTLM to DC01 always, AS to the located DC
  instead of the KDC, restoring every DC01 record, no focus on an answer, the DC taken from a KDC answer): all 35 fail
  a test.
- **Fresh review** (a separate agent, no shared context; read SPEC against the code, 22 mutations of its own, a
  headless sweep of every combination in both languages): fixed the join-site rule (above), "NXDOMAIN again" after a
  single query, "every record exists" with the public resolver when records were deleted, no caption for staying
  across the WAN after the learnt site's record was missing, the logon message, the UPDATE's `+k` in SPEC, the
  refresh interval, and the Croatian term rule for runs that never ask a site record; 7 surviving mutations now have
  tests.
- **Gate:** `npm run gate -- win-dns-srv-records` passes (61/61 browser checks); screenshots at 1920×1080 light,
  dark and grayscale and 375×812, both languages, reviewed, plus extra states (healthy join start and end,
  no-site-record end, public DNS end, netlogon-fix step 3, no-kerberos end, unknown site step 8).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| SRV record | SRV zapis | task |
| domain controller | kontroler domene | task |
| DC locator | lociranje kontrolera domene | task |
| site | lokacija (*site*) | task |
| priority / weight | prioritet / težina | task |
| global catalog | globalni katalog | task |
| domain join | učlanjenje u domenu (task: pridruživanje domeni) | `win-domain-join` |
| (site) learnt from the LDAP ping | (lokacija) naučena / pamti | simdeck *(check)* |
| dynamic update | dinamičko ažuriranje | `win-dns-dynamic-update` |

## Shared requests

- **Shared model** (§5.21): this sim copies `win-dc-promotion`'s domain, DC names, addresses and GUIDs (not its
  functions: the record set here is longer and per site). A promoted `small-domain` model would hold DOMAIN, the DCs
  with sites, the GUIDs and `dcRecords(dc, { site, gc, pdc })`; `ROWS`, `pick`, `resolve` and `plan` here are pure and
  string-free, ready to move.
- **check-page:** the deep-link check opens the second preset at `min(3, steps at the defaults)`; a second preset with
  fewer than 3 steps fails it although the page is right. Here the presets are ordered so that the second
  (`no-site-record`, 12 steps) is long enough; `no-locator` (2 steps) is third. Smallest fix: take the step count
  of that preset.
- **K1:** a field beside a chip is drawn over the lifelines it crosses (no background); a light background behind
  `fields` would keep `_kerberos Branch` readable where it crosses DC01's lifeline.

## Time

Start 09:30, done 10:05 (one session, about 35 minutes including the fresh review).
