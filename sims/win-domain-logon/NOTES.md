<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-domain-logon: notes

New stepper (task `docs/tasks/w2/win-domain-logon.md`, catalogue `win-domain-logon`, §4.5.1 and §5.21, wave 2b).
Drawn with kit view K1 (message sequence chart); the topology strip on top, the result and the cache box are page
code. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Top: site HQ and site Branch as shaded zones (border and tint in the site's series colour, the site name
  and its subnet object written in the zone header), the IPsec tunnel between them (solid when up, dashed with a red ✕
  when down, thick ink with "a message crosses it" / "the message is lost" when this step's message uses it), and a
  dashed "offline" spot. PC07's card sits where it is; the chosen DC has a thick border and a "✓ chosen" badge (the
  kit's changed mark on the step it is chosen). Below: K1 with the lanes PC07, DNS, DC01, RODC01; on the right the
  result box and "Cached credentials on PC07" (count / 10, one key per user; new ones highlighted, the one used by a
  cached logon thick, the missing user dashed with ✕).
- **The topology is page HTML, not kit view K2**: the task names only K1, and K2 has no zones; the site boundary is
  the zone itself.
- **Four lanes, not three** (task: `PC`, `DNS`, `DC`): the branch presets need RODC01 forwarding to DC01, which is a
  message between two DCs. The DNS lane is the DNS server of PC07's site (DNS on DC01 in HQ, on RODC01 at the branch,
  dashed "unreachable" offline).
- **Names.** `quillmoor.example`, DC01 10.10.0.10 and PC07 as in `win-dns-srv-records` / `win-domain-join`; RODC01
  10.20.0.10 from topologydrafter `two-sites`. PC07 at the branch is 10.20.20.57 as in `win-dns-srv-records` (task:
  10.20.0.57; the task's caption is kept with the address changed).
- **Two params added** (state `pc.site` and the user, both in the task's model but not in its param list):
  `lastSite` (HQ / Branch / none: the site PC07 remembers) and `user` (ana / marko). `branch-first` needs a remembered
  HQ, `branch-wan-down` a remembered Branch (see below), `no-subnets` none; `offline-new-user` needs marko next to a
  cached ana, which shows that the cache is per user. `cachedOnPc` means "ana has logged on here before".
- **The RODC is not in the domain-wide record** (SPEC "Records", *(check)*). With it, "no subnets → DC01 over the WAN
  although RODC01 is next door" holds whatever the answer order, and a laptop remembering HQ at a branch with the
  tunnel down never finds RODC01 (only the Branch record names it). If the claim is wrong, `RECORDS[LDAP_DC]` gets
  RODC01 second and `branch` + `wan` off + `lastSite` HQ becomes the RODC path (tests T3 and "records" change).
- **Ping in answer order, first that answers** (rule 1). Every answer here has one target, so `order()` (RFC 2782
  priority, weight, then first listed; from `win-dns-srv-records`' `pick`) is tested on its own.
- **Unreachable = lost.** A DNS query offline and a ping or forward across a down tunnel are drawn as dropped arrows
  (✕ half way); no timeout step. Offline, the locator still tries the domain-wide record after the site record (rule
  2a, uniform with "site DC did not answer").
- **Kerberos is two arrows** (AS-REQ, AS-REP with a TGT); the service ticket for PC07 is named in the caption. No
  separate KDC lookup (that is `win-dns-srv-records`' page).
- **Cache step.** The verifier stored, the cached logon and the "no logon servers" end are one event each (a note on
  PC07), so the student sees the cache change in its own step.
- **Error text.** The result box shows current Windows' "We can't sign you in with this credential because your
  domain isn't available." (as `win-dns-srv-records` does); the caption adds the older "There are currently no logon
  servers available to service the logon request." (the task's text). The Croatian versions are translations, not the
  localised Windows texts.
- **Croatian without gendered participles for {u}** ("prijava za {u} uspijeva", "{c} pamti raniju prijavu za {u}"),
  since the user may be ana or marko. The task's caption "`ana` je već prijavljena…" is rewritten that way.
- **`rodcHasPwd` means the passwords of the user and of PC07** (fresh review): a branch logon with the WAN down needs
  both cached on the RODC (the computer's for PC07's own ticket). Label, lane, captions and SPEC say so.
- **Cache order is least recently used first** (fresh review): a refresh moves the user to the end; an 11th user
  replaces the least recently used. Only the unit test reaches 10.
- **"No DC the locator found answers"** for the end caption when online (fresh review): at the branch with the tunnel
  down and HQ remembered, RODC01 next door would answer but was never found; offline it is "No DC answers".
- **Params reset the demo** (`resets: true` on all): each can change the step count.

## Deviations from the task

- **Step counts** (task 7 / 9 / 7 / 4 / 6, ours 7 / 13 / 8 / 3 / 7): `branch-first` pings RODC01 before using it
  (rule 2) and draws the forward and DC01's reply (rule 7); `branch-wan-down` remembers Branch and draws the RODC's
  error; `offline-new-user` has no "type the password" step; `no-subnets` has the cache step. Maximum 13 (task: 9).
- **`branch-wan-down` remembers site Branch** (task: "same" as `branch-first`, i.e. remembering HQ): with HQ
  remembered the laptop never reaches RODC01 (above), so the RODC lesson (rule 7) would not show. The HQ-remembering
  case is still there through the params (6 steps, cached logon).
- **Four lanes; `user` and `lastSite` params; PC07's branch address** (above).

## Sources

- Task file, model and presets; catalogue §4.5.1, §5.21.
- Microsoft Learn (titles from the task and from memory, not opened in this session *(check)*): "How domain
  controllers are located in Windows" / "Locating Active Directory domain controllers in Windows and Windows Server";
  "Interactive logon: Number of previous logons to cache (in case domain controller is not available)" (default 10);
  the RODC planning and deployment guide (generic SRV records, credential forwarding).
- [MS-ADTS] §6.3 "Publishing and locating a domain controller" *(check: section numbers)*.
- `/home/rjasmin/projects/topologydrafter/js/samples.js`, sample `two-sites`.
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` ("no subnets defined — … clients pick DCs at
  random"); only the student folder was used.
- `sims/win-dns-srv-records/` (record names, `pick`, PC07's addresses), `sims/win-ad-structure/` (sites, subnets).

## Unchecked *(check)*

- That an RODC does not register the generic (domain-wide) locator records by default.
- That the locator falls back to the domain-wide record when no DC of the remembered site answers the ping.
- That an RODC with the user's and the computer's passwords authenticates a branch logon without the WAN.
- What PC07 gets when RODC01 cannot reach a writable DC (drawn as `KRB-ERROR`), and that Windows then logs on with
  cached credentials.
- That the client forgets its remembered site when a DC's reply carries no site.
- The two error texts and their Croatian translations.

## Checks

- **Numbers:** `numbers.py` (a Python hand count written from SPEC "Steps" before the model, in the thread's
  scratchpad, not committed) agrees with the model on all 288 param combinations: steps, outcome and DC.
- **Tests:** 35, tie-breaks first; every rule and tie-break has a test (T4 and rule 2's "keep the DC that did" are
  guards no combination reaches; SPEC says so).
- **Fresh review** (a separate agent, no shared context: SPEC against the code, 34 mutations of its own, captions over
  all 288 combinations): fixed RODC01's last AS-REP not marked as crossing the tunnel when PC07 is in HQ, the result
  and caption calling a forwarded branch logon "across the tunnel" (now "forwarded to DC01 across the tunnel" /
  "RODC01 had to ask DC01"), "next door" only for Branch/DC01 (now any site), "No DC answers" at a branch whose RODC
  was never found, the RODC toggle (both passwords), LRU eviction, the Croatian legend; 6 surviving mutations
  (`result.site` with no subnets, `rodcCached`, the initial DNS server, the pong's and AS-REQ's tunnel flags, the phase
  after an RODC error) now have tests, and each of those plus the AS-REP flag and LRU fails a test when reapplied.
- **Caption sweep** (headless, every combination, every step, both languages, 4032 captions): no empty placeholder,
  no console error. It found a reused placeholder node that the second caption part moved away ("prijava za
  uspijeva"); the page's `rich()` now always copies placeholder nodes.
- **Gate:** `npm run gate -- win-domain-logon` passes (61/61 browser checks). Screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus extra states: `branch-first` step 13 (hr), `branch-wan-down`
  step 8 (en), `offline-new-user` step 3 (hr), `no-subnets` step 4 (en), `hq` step 7, the RODC with the password and
  the tunnel down, and `branch-first` step 9 on the phone. At 1920×1080, `branch-first`'s last step drops its 5 oldest
  rows ("↑ 5 earlier rows"); the topology and the caption carry them.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| DC locator | lociranje kontrolera domene | task |
| site | lokacija | task, `win-dns-srv-records` |
| subnet | podmreža | task (URM ch09) |
| cached credentials | spremljene vjerodajnice | task |
| ticket | karta | task (NLA T57) |
| read-only domain controller | kontroler domene samo za čitanje | simdeck *(check)* |
| writable DC | DC s upisom | simdeck *(check)* |
| cached verifier | spremljena vjerodajnica | simdeck |

## Shared requests

- **Shared model** (§5.21): this sim copies `pick` and the locator record names from `win-dns-srv-records` (commented
  in `sim.js`). A promoted `small-domain` model would hold the domain, the DCs with their sites and RODC flag, the
  subnet objects, the records and `pick`; `order`, `reaches`, `siteOf`, `store` and `plan` here are pure and
  string-free.
- **K1:** a dropped arrow's `re` word on a short arrow (PC07 → DNS, one lane apart) is drawn over the `fields` text;
  the lost DNS queries here therefore have no `re` word. Smallest fix: put `re` under the arrow when it would overlap
  the fields.

## Time

Start 10:02, done 10:26 (one session, including the fresh review).
