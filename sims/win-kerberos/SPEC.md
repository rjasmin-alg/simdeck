<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-kerberos: specification

One concept: **AS → TGT, TGS → service ticket, AP; clock skew breaks it** (task `docs/tasks/w2/win-kerberos.md`,
catalogue `win-kerberos`, §4.5.1 and §5.6). The student steps `ana` opening a file share on `FS01`, then skews
`PC07`'s clock.

## Scene

Kit view K1 (message sequence chart), three lanes left to right:

| Lane | Party | Keys it holds | Clock |
|---|---|---|---|
| `pc` | `PC07`, user `ana` (`ana@QUILLMOOR.EXAMPLE`) | `ana` (from her password); then the session keys it receives | KDC + `skewMin` |
| `kdc` | `KDC` on `DC01`, two halves: AS and TGS | `krbtgt`, `ana`, `FS01$` (every account's key) | domain time |
| `fs` | `FS01`, `cifs/fs01.quillmoor.example`, address `10.10.0.20` | `FS01$`; then the service session key from the ticket | domain time |

Beside the chart: the **message card** (what this step carries: each ticket as a box with a padlock naming the key
that locks it, each authenticator as a small clock card with its timestamp and key) and **PC07's ticket cache** (TGT
and service tickets, each with its expiry).

## State

`{ clocks: { pc, kdc, fs }, cache: { tgt: null | { issued, expires, renewTill }, st: { <spn>: { issued, expires } } },
keys: { pc: [], kdc: [], fs: [] }, replay: [], phase, error: null | code, log: [] }`.
Times are seconds since midnight of the logon day (domain time). `log` holds one entry per step: a message
(`kind: 'msg'`, `name`, `from`, `to`, `carries`) or a check (`kind: 'check'`, `at`, `half`, `ok`, `skew`, …).
`phase` is the next thing to happen: `as-req`, `as-check`, `as-rep`, `tgs-req`, `tgs-rep`, `ap-req`, `ap-check`,
`ap-rep`, `error`, `done`.

## One step

One message (request, reply or error) or one check at a party. The KDC's check of a TGS-REQ is folded into its reply
(TGS-REP or the error): the task's count for `open-share` is 8 with a check after AS-REQ and after AP-REQ only.

## Rules

1. **Pre-authentication.** AS-REQ carries the user name and a timestamp (the PC's clock) encrypted with `ana`'s key
   (PA-ENC-TIMESTAMP). The password itself never leaves PC07. (RFC 4120 §3.1.1, §5.2.7.2.)
2. **Skew at the AS.** The KDC decrypts the timestamp with `ana`'s stored key and compares it with its own clock:
   |PC − KDC| > 5 min → `KRB_AP_ERR_SKEW` (37) back to PC07, and the logon fails. (RFC 4120 §3.1.2; Microsoft
   "Maximum tolerance for computer clock synchronization", default 5 minutes.)
3. **AS-REP.** The TGT is encrypted with the `krbtgt` key and holds the TGS session key and the PAC (`ana`'s SIDs);
   beside it the TGS session key and the expiry, encrypted with `ana`'s key. PC07 can open the second part, not the
   TGT. The KDC keeps no copy of the session key: it is inside the TGT. (RFC 4120 §3.1.3, §3.1.5; [MS-KILE] PAC.)
4. **TGS-REQ.** The TGT, an authenticator (PC's clock, encrypted with the TGS session key) and the target SPN.
   (RFC 4120 §3.3.1.)
5. **TGS-REP.** The KDC opens the TGT with `krbtgt`, takes the session key, checks the authenticator's time (the
   same 5-minute skew, `KRB_AP_ERR_SKEW` first), then finds the account owning the SPN: `cifs/fs01.quillmoor.example`
   → `FS01$`. It returns a service ticket encrypted with `FS01$`'s key (holding the service session key and the PAC)
   plus the service session key encrypted with the TGS session key. No account owns the SPN (the share opened by IP,
   `cifs/10.10.0.20`) → `KDC_ERR_S_PRINCIPAL_UNKNOWN` (7); Windows then tries NTLM (`win-ntlm-vs-kerberos`, not
   shown). (RFC 4120 §3.3.2–3.3.3; Microsoft "Kerberos authentication overview".) Order: the authenticator is
   checked before the SPN is looked up (the TGS-REQ's AP-REQ is processed first, RFC 4120 §3.3.2).
6. **AP-REQ and the check at FS01.** Inside SMB session setup: the service ticket and an authenticator (PC's clock,
   service session key). FS01 opens the ticket with its own `FS01$` key, takes the service session key, opens the
   authenticator, checks its time (5 min, `KRB_AP_ERR_SKEW`) and its replay cache (the same authenticator seen
   before → `KRB_AP_ERR_REPEAT` (34)), and builds `ana`'s access token from the PAC. The DC is not contacted. Then
   AP-REP (the reply inside the session setup response): access to `\\fs01\projects`. (RFC 4120 §3.2.2–3.2.4;
   [MS-KILE] §3.4.5.)
7. **Lifetimes** (Default Domain Policy, Microsoft "Kerberos policy"): TGT 10 h, renewal up to 7 days, service ticket
   600 min. A service ticket never outlives the TGT it came from: expires = min(issue + 600 min, TGT expires)
   (RFC 4120 §3.3.3). PC07 uses a cached ticket while it is unexpired: a cached service ticket for the SPN skips the
   TGS exchange; a cached TGT skips the AS exchange.
8. **Tie-break: skew boundary.** Failure is |client − server| > limit: exactly 5:00 passes, 5:01 fails
   (RFC 4120 §3.1.2 "not within the allowable skew"). `skewMin` moves in whole minutes, so ±5 passes and ±6 fails.
9. **Tie-break: expiry boundary.** A ticket is usable while now < expires: at exactly 10 h after logon the TGT and a
   service ticket from logon are expired, and PC07 starts again with AS-REQ.
10. **Simplification: whose clock judges a lifetime.** Lifetimes are judged on domain time (the KDC's clock); `skewMin`
    changes only the timestamps PC07 writes. (A real client judges its cache by its own clock and a server allows
    the skew around a ticket's end time; at whole hours and ±10 min this only moves the 10 h boundary by minutes.)

## Times

Logon is at 08:00:00 domain time. The run happens `hoursLater` hours after logon: domain time
`T = 08:00 + hoursLater h`; `kdc = fs = T`; `pc = T + skewMin min`. Messages take no time.

Cache at the start of the run:

| `hoursLater` | `cached` | TGT | service ticket for `cifs/fs01…` |
|---|---|---|---|
| 0 | off | none (ana is logging on now) | none |
| > 0 | off | issued 08:00, expires 18:00, renew until 08:00 + 7 d | none |
| any | on | issued 08:00, expires 18:00 | issued 08:00, expires min(18:00, 18:00) = 18:00 |

Then rule 7 and 9 decide what is still valid at T.

## Params

| Param | Values | Default |
|---|---|---|
| `skewMin` | −10…+10 min, step 1 (PC07's clock minus the KDC's) | 0 |
| `byName` | on: `\\fs01\projects` (SPN `cifs/fs01.quillmoor.example`); off: `\\10.10.0.20\projects` (`cifs/10.10.0.20`) | on |
| `cached` | "service ticket already cached" | off |
| `hoursLater` | 0–12 h after logon | 0 |

## Steps and presets

Paths: AS = AS-REQ, check, AS-REP (3) or AS-REQ, check, error (3, ends). TGS = TGS-REQ, TGS-REP (2) or TGS-REQ, error
(2, ends). AP = AP-REQ, check, AP-REP (3) or AP-REQ, check, error (3, ends).

| Preset | Params | Path | Steps |
|---|---|---|---|
| `open-share` (derived, unchecked) | defaults | AS, TGS, AP | 8 |
| `skew-7` | skewMin +7 | AS fails at the check: `KRB_AP_ERR_SKEW` | 3 |
| `skew-4` | skewMin +4 | AS, TGS, AP; every check "within 5 minutes" | 8 |
| `cached` | cached on, hoursLater 2 | AP only (ticket valid until 18:00, now 10:00) | 3 |
| `by-ip` | byName off | AS, TGS fails: `KDC_ERR_S_PRINCIPAL_UNKNOWN`, NTLM note | 5 |

Other combinations: TGT cached, no service ticket (hoursLater 1–9, cached off) → TGS, AP = 5; hoursLater ≥ 10 →
everything expired → 8; a cached TGT and |skew| > 5 → TGS-REQ, `KRB_AP_ERR_SKEW` = 2; a cached service ticket and
|skew| > 5 → AP-REQ, check fails at FS01 = 3; by IP with a cached TGT → 2. Maximum 8 (task: max 8). Default = 8 =
`sim.json` `steps`.

## Legend

Message arrow (solid); a ticket (box with a padlock and the name of the key that locks it); an authenticator (small
card with a clock face, its time and key); a check (diamond, a note on the lane: plain if it passes, inverted if it
fails); "changed" marks this step's message, the newly issued ticket and the key used.

## Out of scope

Delegation, cross-realm referrals (`win-trusts`), PAC validation by the DC, encryption types, offline attacks on
tickets, background TGT renewal, the KDC's own `PREAUTH_REQUIRED` first round trip, the client correcting its clock
from the error's server time, and NTLM itself (`win-ntlm-vs-kerberos`).
