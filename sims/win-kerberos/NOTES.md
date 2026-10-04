<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-kerberos: notes

New stepper (task `docs/tasks/w2/win-kerberos.md`, catalogue `win-kerberos`, §4.5.1 and §5.6, wave 2b). Drawn with
kit view **K1, message sequence chart** (`kit/sequence.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three lanes** as the task says (`PC07`, `KDC`, `FS01`). The KDC's two halves are two small tags in its card (AS,
  TGS); the one handling this step is outlined. Each lane card holds the party's clock (PC07's with its offset from
  the KDC, inverted when it is past 5 min) and the keys it holds as pills: long-term keys solid, session keys dashed,
  the keys used in this step bold, a key that arrived in this step highlighted. So the student sees PC07 gain the TGS
  and FS01 session keys, FS01 gain the FS01 session key only from the ticket, and the KDC keep no session key.
- **Checks are notes** on the checking lane with a diamond (filled when it passes, the note inverted when it fails).
  K1 has no check shape; a note is the closest and reads well.
- **The time column shows the sender's (or checker's) clock**, so a skewed PC07 writes 08:07:00 above the KDC's
  08:00:00: the skew is visible in the chart itself.
- **Tickets are boxes in the message card** (thick border: a ticket; thin: the part for the receiver), each headed
  with a padlock and the name of the key that locks it, and a line "opened by: …". Authenticators are dashed cards
  with a clock face, the time and the key. The chart's chips carry the lock of the ticket a message carries
  (`🔒 krbtgt` on AS-REP, `🔒 FS01$` on TGS-REP and AP-REQ), drawn with the kit's CSS lock (no icon font).
- **PC07's ticket cache** under the message card, as the task's state has it (`cache.tgt`, `cache.st[spn]`), with
  expiry on domain time; an expired entry is struck through.
- **The KDC's TGS check is folded into its reply** (TGS-REP or the error): that keeps `open-share` at the task's 8
  steps (AS-REQ, check, AS-REP, TGS-REQ, TGS-REP, AP-REQ, check, access). Its caption names the checks (krbtgt opens
  the TGT, the time, the SPN's owner).
- **The last step (`access`) is AP-REP**: the session setup response with the AP-REP under the service session key.
- **Order at the TGS:** the authenticator's time is checked before the SPN is looked up (RFC 4120 §3.3.2, the
  TGS-REQ's AP-REQ first); a skewed clock by IP fails with `KRB_AP_ERR_SKEW`, not with the unknown principal.
- **Start of the run (`hoursLater`, `cached`):** logon is at 08:00. `hoursLater` 0 and `cached` off = ana is logging
  on now (empty cache). `hoursLater` > 0 = the logon was that long ago, so the TGT from 08:00 is cached; `cached` on
  also caches the service ticket from 08:00 (and therefore the TGT). The run starts at the first exchange that has no
  valid ticket (SPEC.md, "Times").
- **A service ticket never outlives its TGT** (RFC 4120 §3.3.3): asked for at 11:00 with a TGT from 08:00, it ends at
  18:00, not 21:00. The caption says so. Not in the task's rules; needed for correct numbers.
- **Lifetimes are judged on domain time** (SPEC rule 10, a stated simplification): `skewMin` changes only the times
  PC07 writes. A real client judges its cache by its own clock and servers allow the skew around a ticket's end
  time; at whole hours and ±10 min this only moves the 10 h boundary by minutes.
- **Replay cache:** FS01 records the authenticator it accepted; `apCheck` refuses the same one again with
  `KRB_AP_ERR_REPEAT` (34). No preset sends an authenticator twice, so the page shows the check as a passed line
  ("not a replay"); the rule is tested on the function.
- **Long names stay off the arrows:** the TGS-REQ's field is `🔒 krbtgt + SPN` and a KRB-ERROR's field is its number
  (37, 7); the SPN and the error name are in the message card and the caption. With three lanes on the left of a
  24rem card column, `cifs/fs01.quillmoor.example` or `KDC_ERR_S_PRINCIPAL_UNKNOWN` ran over the next lifeline.

## Deviations from the task

- **Preset `cached` is 3 steps, not 2:** AP-REQ, check, AP-REP. The task counts `open-share` as 8 with the final
  `access` step, so the cached access has the same last step; dropping it would end the run on a check with the share
  not yet open.
- **`cached` preset params:** `cached` on and `hoursLater` 2 ("second access within 10 h"; the task gives no hour).
- **Croatian skew caption:** the task's hr caption says "Sat na PC07 *kasni* 7 minuta" for `skewMin` +7, but +7 means
  PC07's clock is ahead (it "žuri"). The page says "žuri {m} min pred KDC-om" for a positive skew and "kasni {m} min za
  KDC-om" for a negative one. The en caption is the task's ("{m} minutes off").
- **Title** "Kerberos: karte i satovi / Kerberos: tickets and clocks" (the task's title is "Kerberos"; the clocks are
  half the concept).
- Added SPEC rules beyond the task's list: the service ticket capped at the TGT's end (rule 7), the TGS check order
  (rule 5), the expiry boundary (rule 9) and the domain-time simplification (rule 10).

## Sources

- Task file, model and presets.
- RFC 4120 §3.1.1–3.1.5 (AS exchange, `KRB_AP_ERR_SKEW`), §3.2.2–3.2.4 (AP exchange, replay cache), §3.3.1–3.3.3
  (TGS exchange; a new ticket's end time is at most the TGT's), §5.2.7.2 (PA-ENC-TIMESTAMP), §7.5.9 (error codes: 7
  `KDC_ERR_S_PRINCIPAL_UNKNOWN`, 34 `KRB_AP_ERR_REPEAT`, 37 `KRB_AP_ERR_SKEW`).
- [MS-KILE] (the PAC in the TGT and service ticket; the server builds the token from it).
- Microsoft Learn: "Kerberos authentication overview"; "Maximum tolerance for computer clock synchronization" (5 min);
  "Maximum lifetime for user ticket" (10 h); "Maximum lifetime for user ticket renewal" (7 days); "Maximum lifetime for
  service ticket" (600 min).
- NLA `meta/toc.md` T57 "Kerberos — karte, povjerenje, jedinstvena prijava" (chapters not written yet).
- Names: `quillmoor.example` (realm `QUILLMOOR.EXAMPLE`), `PC07`, `DC01`, `FS01` (`10.10.0.20`), user `ana`, share
  `projects`: the task's.

## Checks

- Numbers: an independent Python hand model of the step counts (SPEC.md "Steps and presets") before the model was
  written: open-share 8, skew-7 3, skew-4 8, cached 3, by-ip 5; TGT only 5; 10 h later 8; a cached TGT with skew 7: 2;
  a cached ticket with skew −6: 3; ±5 passes, ±6 fails; maximum over all 1092 combinations 8. The model agrees
  (`sim.test.js`, "presets").
- Rule tests broken on purpose, 29 mutations one at a time (skew `<` for `≤`, skew one-sided, valid at the expiry, no
  cap at the TGT, wrong service ticket and renewal lifetimes, SPN looked up before the time, no skew check at the TGS,
  at FS01 or at the AS, no replay check, replay not recorded, TGT under ana's key, service ticket under krbtgt,
  pre-authentication under krbtgt or with the KDC's time, an SPN for the address, the SPN always by name, cached
  ticket or cached TGT ignored, `hoursLater` ignored, FS01's check moved to the KDC, PC07 given krbtgt, the KDC
  keeping the session key, the skew's sign, FS01's clock off, no NTLM hand-off, a wrong error number, AP-REP without
  access): every one fails a test.
- Fresh review (a separate agent read the code against SPEC.md and RFC 4120, broke rules and drove the page: 799
  pages over presets, skew −10…+10, both toggles, hoursLater 0/1/9/10/12, every step, hr and en; no console errors,
  no `undefined`/`NaN`/placeholders, no page scroll). Model, keys, error numbers and check order confirmed. Fixed from
  it: the FS01 check note said the *ticket* was not a replay (it is the authenticator; the note is now the time
  check, the card lists the replay line); the start caption after 10 h said "logs on … no tickets yet … tickets
  expired" (now its own caption: the TGT expired, PC07 asks for a new one with ana's stored key, and its error
  caption does not say the logon fails); Croatian "DC ne pita ništa" → "DC se ništa ne pita", "autentifikator je
  {m} min od njegova sata" → "vrijeme u autentifikatoru odstupa {m} min od sata KDC-a / FS01"; the check notes got a
  colon ("+4 min: unutar 5 min"); the unknown-SPN caption says the SPN is registered for the name, not the address
  (an SPN for an address can exist); the explanation says Windows can fall back to NTLM after other Kerberos errors
  too, and which clock the time column shows. Its surviving mutations (tickets issued on PC07's clock, `hoursLater`
  1, starting keys, a session key at FS01 after a failed check, replay per client and after the time check, the
  entries' parties, halves, skew signs, NTLM and cache flags and highlight marks, the REPEAT number, the expired
  ticket purged by a new TGT) now have tests: 24 of its 25 die, the last is equivalent (the SPN key of a ticket that
  is only ever issued for the name).
- `npm run gate -- win-kerberos`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus open-share at steps 3, 5 and 8, skew-7 at 3, by-ip at 5, cached at 3, a cached ticket with −6 min at
  2 and a cached TGT with −8 min at 2.

## Unchecked *(check)*

- Croatian terms not in the glossary (below), in particular "karta za uslugu" for *service ticket* and
  "autentifikator".
- Windows behaviour around skew is simplified: a Windows client can retry after `KRB_AP_ERR_SKEW` using the server
  time in the error *(check)*; the page shows the failure the task describes.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| ticket | karta | NLA T57 |
| ticket-granting ticket (TGT) | karta za dobivanje karata | task *(check)* |
| service ticket | karta za uslugu | simdeck *(check)* |
| key distribution center (KDC) | centar za distribuciju ključeva | task *(check)* |
| service principal name (SPN) | ime principala usluge | task *(check)* |
| authenticator | autentifikator | task *(check)* |
| clock skew | razlika satova | task *(check)* |
| session key | ključ sesije | task *(check)* |
| pre-authentication | predautentifikacija | simdeck *(check)* |

## Shared requests

- **K1: a check row** (a diamond on a lane, pass or fail), distinct from a note. The page draws it as a note whose
  text starts with a CSS diamond.
- **Kit legend swatches** `ticket`, `auth` (a card with a clock face), `check` (a diamond) and `key`: the page
  defines them in its CSS.
- **Kit padlock:** the page reuses `.sd-seq-lock` (K1's CSS lock) outside the chart for its ticket boxes and key
  labels; a kit-level lock class would make that use official.

## Time

Start 2026-10-04 12:41; built, reviewed, review fixed, gate passing and status ready 13:04: about 23 min.
