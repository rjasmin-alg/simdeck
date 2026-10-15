<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-domain-join: notes

New stepper (task `docs/tasks/w2/win-domain-join.md`, catalogue `win-domain-join`, §4.5.1, wave 2b). Drawn with
kit view **K1, message sequence chart** (`kit/sequence.js`) under a strip of the parties' state. Rules, tie-breaks
and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Top, a strip of four boxes in lane order: PC07 (DNS server, the LSA secret `cur`/`prev`, the
  snapshot), the secure channel (none: thin dotted line and –; works: double line and ✓; broken: dashed line and a
  red ✕, each with its word), DC01's computer object (DN, password `cur`/`prev`) and the joining user (`ana`, a
  ten-cell quota meter and `n / 10`) or, for the revert, the administrator. For the revert a day timeline 0–90
  sits under the strip: the snapshot and the changes above the axis (dashed until they happen), the revert under
  it, a thick bar along the axis for the days that have passed. Below, K1.
- **Lanes.** Join: PC07, DNS (on DC01, or the public resolver), DC01, as the task names them. The revert never
  uses DNS, so its chart has two lanes (PC07, DC01) and wider arrows. The task's "admin card" is the strip's fourth
  box, not a lane: the administrator acts from the client (the reset is a message PC07 → DC01).
- **Arrow styles** (the task's three): DNS dotted, LDAP and SAMR solid, Netlogon K1's `lock` (double line and
  padlock: it runs over the secure channel). The user's logon is a plain arrow labelled "logon", not Netlogon:
  an interactive domain logon is mainly Kerberos, and the page only shows that it needs the channel (rule 4). A refused message has K1's ✕ at DC01 (`lost`), coloured `--danger`
  by the page; the ✕ shape carries it in grayscale.
- **One step = one message or one event.** A request and its answer are two steps where the answer is the point
  (SRV, LDAP ping); where the DC's verdict is the point (create, set password, secure channel, logon, change,
  reset) it is one arrow with the verdict as K1's receiver word (`re`). Events (restart, snapshot, revert, join
  fails, logon refused) are K1 notes on PC07's lane.
- **Password chips** are boxed mono labels; a slot that changed in this step is highlighted with the kit's
  changed outline; at a channel step the matched one on the object gets a thick border and ✓, a non-match is struck
  through in `--danger`. An empty slot is a dashed `—`.
- **Names and numbers** are the task's (`PC07` 10.10.20.57, `DC01` 10.10.0.10, `quillmoor.example`). Added:
  NetBIOS `QUILLMOOR`, the public resolver 198.51.100.53 (TEST-NET-2), the joining user `QUILLMOOR\ana` (the name
  `win-kerberos` uses), the administrator `QUILLMOOR\admin`, the DN `CN=PC07,CN=Computers,DC=quillmoor,DC=example`.
- **The snapshot is taken right after the join (day 0)**, so the restored secret has no previous password; that
  keeps rule 6 ("the client's current") free of the question whether the client also tries its own previous one.
- **After a revert with one change** the client's copy is 35 days old by its own record, so it changes the
  password at once (SPEC rule 7); that is the task's sixth step of `revert-35-days`.
- **Reusable model.** `locate`, `mayCreate`, `channelMatch`, `rotate` and `due` are pure, string-free functions over
  plain data, should `win-domain-logon` (DC locator) or `win-ad-backup-restore` want them.

## Deviations from the task

- **Added a param `scenario` (join | snapshot and revert).** The task's three params cannot tell the join presets
  (8, 3, 4 steps from a workgroup machine) from the revert presets (9, 6 steps from a joined one). The params that do
  not apply to the scenario are disabled with the reason as their hint.
- **`snapshotAge` step 5, not 15.** With step 15 from 0 the slider cannot reach the task's own 35 and 65.
- **`quota` preset: 5 steps (task 4).** SRV query, SRV answer, LDAP ping, ping reply, refused creation; with the
  task's "one step: one message" the join's first four messages come before the quota is checked. `join` 8 and
  `wrong-dns` 3 match the task.
- **Revert step counts vary with `snapshotAge`:** 4 (under 30 days, no change since the snapshot), 6 (30–55), 9
  (60–85), 10 (90). The presets give the task's 9 and 6. Maximum 10, within the 20-step limit.

## Sources

- Task file, model and presets.
- [MS-ADTS] §6.3 "Publishing and locating a domain controller"; Microsoft Learn "How domain controllers are located
  in Windows" (SRV `_ldap._tcp.dc._msdcs.<domain>`, LDAP ping over UDP 389).
- Microsoft Learn "Default limit to number of workstations a user can join to the domain"
  (`ms-DS-MachineAccountQuota` = 10).
- Microsoft Learn "Domain member: Maximum machine account password age": domain members change their password
  every 30 days by default (confirmed in this session's search; the page's defaults table itself was not shown).
- Ask the Directory Services Team, "Machine account password process" (techcommunity.microsoft.com/blog/askds/…):
  the title is confirmed; the page did not render here, so its text was read only through search snippets: the
  change is client-initiated, every 30 days, machine passwords do not expire in AD.
- A secondary source (ITPro Today, "How do I reset a machine account password?") says the domain keeps the current
  and the previous password.

## Unchecked *(check)*

- Rule 6: the DC accepting the object's previous password on a secure-channel setup (secondary source only).
- Rule 7: right after a revert with one change since the snapshot, the client changes its password at once because
  its copy is ≥ 30 days old by its own record (Netlogon checks the age periodically; "at once" is the model's
  simplification).
- T1: a change due on the revert day happens before the revert (a modelling choice, not a documented rule).
- The exact error text of the join failure ("An Active Directory Domain Controller for the domain … could not be
  contacted") is paraphrased on the page, not quoted.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| domain join | učlanjenje u domenu | task *(check)* |
| computer account | račun računala | task *(check)*; also `win-dns-dynamic-update` |
| secure channel | sigurni kanal | task *(check)* |
| machine password | lozinka računala | task *(check)* |
| snapshot | snimka | task *(check)*; the glossary has "snapshot file" — datoteka snimka |
| SRV record | SRV zapis | task |
| LSA secret | tajna LSA | simdeck *(check)* |
| public resolver | javni razrješivač | simdeck *(check)* |
| trust relationship | odnos povjerenja | simdeck *(check)* |

`virtual machine` (virtualni stroj) is used from the glossary, as `[[virtual machine]]` in the explanation.

## Checks

- Numbers: an independent Python hand model of all 41 combinations (join: 2 DNS servers × `joinsByUser` 0–10;
  revert: `snapshotAge` 0–90 step 5: steps, both password pairs, the user's count) before the page was written;
  the model agrees on every one.
- Browser sweep: 328 pages (every preset and six more param sets × every step × both languages, at 1920×1080 and
  375×812) from `file://`: no page scroll at 1920×1080, no sideways scroll at 375×812, nothing outside the stage,
  no box overflow, no `undefined`/`NaN`/`null`/unfilled placeholder, no empty caption, no console errors or
  warnings. Found and fixed on the way: the full DN in a caption was one unbreakable word and scrolled the phone page
  sideways (DNs and SRV names now break after commas and dots); the strip's two columns on a phone overflowed (one
  column now); the reset and logon arrows' words ran past the phone's edge (only the label stays there); the revert
  mark at day 90 sat on the "90" tick (the revert row is now under the numbers); a "now" cursor sat on the change
  label (now a bar along the axis).

## Known limits

- A pre-staged computer object (an administrator creates it first, so the quota does not apply) is in the
  explanation, not modelled.
- Replication of the new password to other DCs is out of scope (one DC).

## Shared requests

- **K1:** a receiver mark for "refused by the receiver" that differs from "lost" (`lost` draws the same ✕ as a
  receiver that is down); the page colours `.sd-seq-x` with `--danger` for the legend's "red ✕".
- **Kit legend swatches** `dot` (dotted line), `double` (Netlogon double line), `pw` (password chip), `broken`
  (dashed line with a red ✕): the page defines them in its CSS (`win-dns-dynamic-update` also defines a double-line
  swatch, `signed`).
- **Glossary:** the term pairs above.

## Fresh review

A separate agent read the task, SPEC.md, sim.js, the tests, strings.js and the page, made 30 single mutations of
`sim.js` and drove the page (12 states, both languages, 1920×1080 and 375×812). It confirmed the model, the step
counts, the Windows facts and the deviations (it reads the task's quota 4 as an error in the task). 26 mutations
were killed; of the 4 survivors, 2 are equivalent in every reachable state (dropping the `prev !== null` guard,
whose case a null client already returns from; the `joinsByUser` clamp, within the slider's range) and 2 were
real gaps, now tested and killed: the revert must leave the channel `none` until it is built again, and setting
the password makes the client a domain member. Fixed from it as well:
- the Croatian term rule: "lozinka računala (*machine password*, lozinka računala)" repeated the Croatian; now
  *machine password* (lozinka računala), and the join run introduces *machine password* and *secure channel* too;
  the explanation gives the English terms at first mention;
- the timeline shows the passwords set after the revert (the client's own change, the admin's reset) next to the
  revert mark;
- `ms-DS-MachineAccountQuota` in the quota caption is data (it broke at the hyphen);
- the logon row is "logon", not Netlogon (above);
- Croatian: "vraćanje ne dira AD", "prihvaća", "nova lozinka p3".
Not changed: `capChannelBroken` gives *secure channel* (sigurni kanal) again after the start caption, because it is
the task's own caption; the trust error stays in English (its Croatian localisation was not checked); the legend's
"channel broken" swatch is the strip's dashed line with ✕, while the chart's refused row keeps K1's lock line with
the same red ✕; the disabled `joinsByUser` slider shows 0 in the revert scenario, where the model counts 1.

## Time

Start 2026-10-15 23:24; model, page and sweep by 23:46; review fixed, gate passing and status ready by 23:58:
about 35 min.
