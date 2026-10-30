<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lateral-movement: notes

New stepper (task `docs/tasks/w3/lateral-movement.md`, catalogue `sec-lateral-movement`, §4.3, wave 3). Drawn with
kit view **K2, topology** (`kit/topology.js`) over three tier bands of the page's own. Rules, tie-breaks and
expected numbers: `SPEC.md`.

## Decisions

- **Five machines**: DC1 (Tier 0), FS1 and APP1 (Tier 1), WS1 and WS2 (Tier 2), as the task's scene asks (a
  workstation, a few servers, a file server, a DC). Generic names, not the DR estate's.
- **K2 for the graph.** Machines are K2 cards placed in three grid rows; K2 draws the links (path in ink, usable
  solid, cut dashed with a cross) and the packet of a move or a refused try. The tier bands are a grid of the same
  three rows behind the drawing. On a phone the bands go and K2 lists the cards.
- **Credential chips** carry the tier by colour and by shape (◆ ■ ● ○); the tier bands also differ by the style of
  their left edge (solid, double, dotted), so both survive grayscale.
- **The attacker panel** answers "what does each stolen credential open": the machines where it works, and the
  machines where the attacker would try it and fail, struck through. This is how the `laps` preset shows that the
  local hash no longer opens WS2 while the Domain Admin still opens everything (the graph shows one edge per pair
  of machines, and WS2 is open with the Domain Admin).
- **What the attacker tries**: domain accounts exactly where they are admins (any domain user can read group
  memberships); a local Administrator hash on the other machines of the same tier. Without this, LAPS would never
  show as a refused try.
- **The DC dump is the outcome step**: arriving on DC1 is a move; the next step reads the directory (every
  account's hash, krbtgt included) and ends the run as `compromised`. A stall ends it as `contained` at the highest
  tier reached.
- **Tiering overrides `daLogsOnWS`**: with tiering on, the toggle is shown disabled with the reason ("tiering does
  not allow this logon"), and the refused logons stay on the cards as struck chips. That makes rule 4 visible
  rather than just an absent chip. Likewise LAPS overrides `sharedLocalAdmin`.
- **Tiering direction**: an admin never logs on to a machine of a *lower* tier (higher number). The estate has no
  lower-tier admin logging on to a higher-tier machine, so the other direction of the tier model is not needed.
- **The shared local password is the workstation image's**: servers have their own (built one by one). The task's
  param says "same local admin password everywhere"; with servers sharing it, the `tiered` preset would reach Tier 1
  through the local hash and not "stall at Tier 2" as the task expects.
- **Hash fragments** (`#7c1e`) make "the same hash" visible at a glance; they are illustrative, not real hashes.
- **Rule 5 (leavers)** needs something to compare, so it is a fifth toggle `leaverAdmin` (on by default): a leaver's
  Domain Admin account, still enabled, runs a scheduled task on APP1 (its password in the machine's secrets, kind
  `password`). It is what the hop-by-hop path reaches; switched off, the path stops at Tier 1 (FS1).

## Deviations from the task

- **`flat` and `laps` are 5 steps, not 8.** With the Domain Admin cached on WS1, the dump hands over Tier 0 at once:
  the task's steps 4–7 (hold, move, repeat, reach) collapse into one move to the DC. The task's "~3 hops" is the
  foothold, escalation and dump before the DC. `tiered` (6) and `both` (5) match the task. `laps` = `flat`, which is
  the point: LAPS alone does not stop the cached Domain Admin.
- **A fifth preset `chain`** (no Domain Admin on WS1, 9 steps) gives the hop-by-hop path the student is meant to
  follow (WS1 → WS2 → APP1 → DC1). The high-tier credential it finds sits on an application server, not where the
  DR estate's S3 model answer has one.
- **A fifth toggle `leaverAdmin`** for rule 5 (above).
- **`sharedLocalAdmin`** covers the workstations only (above); its label says so.
- **Not reused: `win-ntlm-vs-kerberos`.** The task's soft dependency is not built yet (no `sims/win-ntlm-vs-kerberos/`,
  nothing in `models/`). Its model would contribute only "the NT hash is a password equivalent", which this model
  states as a rule of its own (`kind: 'hash'`, used as is). No code was copied. When that sim exists, the overlap is
  the explanation's pass-the-hash paragraph; the task's note says to link rather than repeat.
- **Tie-break order:** the task says "highest tier first; ties broken by node id". The model reads it as the
  credential's tier, then the target's tier, then the node id. By node id alone, a Domain Admin would go to APP1
  before DC1 ("APP1" < "DC1") and the `flat` path would take a detour.
- **The tiering caption** is shown on a stall only when tiering refused a Tier 0 logon on a workstation, not on every
  stall with tiering on (with the Domain Admin toggle off, tiering is not what stopped the attacker).
- Title "Bočno kretanje i slojevi ovlasti" in Croatian (the task gives only the English).

## Sources

See `SPEC.md` "Sources". Unchecked, marked *(check)* there:
- the section numbers of Microsoft's *Mitigating Pass-the-Hash* v1/v2 (not re-read for this task);
- the current title of the tier model: *Enterprise access model* under *Securing privileged access*, which replaced
  the *Active Directory administrative tier model*; the page says "tiering" and "Tier 0/1/2" as the task does;
- Croatian terms (below).

Instructor material (`dr-lecture-estate/instructor/`: CV-17, CV-19, CV-23, S3) informed only the estate's shape. No
names, numbers or caveat texts from it are on the page or in a preset.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| lateral movement | bočno kretanje | task *(check)* |
| pass-the-hash | *pass-the-hash* (ponovna uporaba sažetka) | task *(check)* |
| hash (NT hash) | sažetak (NT sažetak) | task, URM ch18 not found *(check)* |
| credential | vjerodajnica | task |
| privilege escalation | eskalacija ovlasti | task |
| domain controller | kontroler domene | task |
| tiering | raslojavanje administrativnih ovlasti; on the page "slojevi ovlasti" | task *(check)* |
| least privilege | najmanja ovlast | task (aliases only) |
| Domain Admin | domenski administrator | task |
| pass-the-ticket | *pass-the-ticket* | simdeck |

## Shared requests

None. K2 did everything the graph needs; the tier bands are the page's own (a band behind a grid row). If a second
sim wants bands, K2 could take `bands: [{ row, label, c }]`.

## Promotable model

`win-laps` (catalogue: "→ `sec-lateral-movement`") will build on this model. `estate`, `works`, `expects`,
`candidates`, `edges`, `dumpOf` are pure functions over plain data with no strings, ready to move to `models/`.

## Checks

- `node --test sims/lateral-movement/sim.test.js`: 26 tests. Each rule and tie-break was broken once (15 mutations,
  all caught).
- Fresh review (a separate agent, against SPEC.md, 32 mutations of its own): four survived (credential tier
  dropped from the sort, the leaver flag, a server's local hash and its tier); tests added, all four now caught. It
  also found the tiering caption shown on stalls tiering did not cause, English word order in "WS1 Administrator" in
  Croatian captions, a hard-coded foothold user, an unused badge string and two Croatian slips; all fixed.
- `npm run gate -- lateral-movement`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus each preset's key steps (dump, refused try, outcome) shot separately.

## Time

Start 2026-10-30 13:51 CET; done 14:13 CET (one session).
