<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntlm-vs-kerberos: specification

One concept: **challenge-response vs tickets; when Windows falls back to NTLM; why pass-the-hash works.** Task:
`docs/tasks/w3/win-ntlm-vs-kerberos.md`. Model: `sim.js`; tests: `sim.test.js`. Names (`quillmoor.example`, NetBIOS
domain `QUILLMOOR`, `PC07`, `FS01` at `10.10.0.20`, `DC01`, user `ana`, share `projects`) are the task's and
`win-kerberos`'s.

## Parties (lanes, left to right)

| Lane | Who | Holds |
|---|---|---|
| `pc` PC07 | ana, logged on interactively | in memory: ana's NT hash (kept for NTLM single sign-on) and a TGT from logon |
| `x` attacker's host | only with `attacker = admin` | nothing, then ana's NT hash copied from PC07 |
| `fs` FS01 | the file server | its own key `FS01$`; **no** hash of ana |
| `dc` DC01 | KDC and domain controller | every account's NT hash (`ana`, `ivan`), `krbtgt`, `FS01$` |

## Params

- `target`: `name` (`\\fs01\projects`, default) or `ip` (`\\10.10.0.20\projects`).
- `attacker`: `none` (default), `observer` (on the client's network segment: it sees what the client sends and receives, to FS01 and to DC01, but not FS01↔DC01), `admin` (administrator on
  PC07). With `admin` the run is the attacker's access from the attacker's own host by the address (rule 8); `target` is
  disabled in the page and ignored by the model.

## Rules

1. **Negotiate tries Kerberos first** (RFC 4178 SPNEGO; Microsoft Learn "Microsoft Negotiate"). It falls back to
   NTLM when the client cannot get a service ticket: `negotiate(o)` returns `{ protocol, reason, spn }`. Reasons,
   checked in this order (**tie-break**: the first that holds is the reason given):
   1. `local`: a local account (no domain account, no KDC knows it);
   2. `realm`: the name is not in an AD realm the client can reach;
   3. `no-dc`: no DC reachable;
   4. `ip`: the target is an IP address. By default Windows does not try Kerberos for an address at all
      (Microsoft Learn "Configuring Kerberos for IP Address" *(check title)*); since Windows 10 1507 / Server 2016 a
      client with `TryIPSPN` set does try, and succeeds only if an SPN for the address is registered *(check)*. The
      function takes `tryIpSpn` and `ipSpn`; the page uses the default (both off).
   Otherwise `kerberos` with SPN `cifs/fs01.quillmoor.example` (by name).
2. **Kerberos path** (as `win-kerberos`): ana already holds a TGT from logon, so access is TGS-REQ (TGT locked with
   `krbtgt` + authenticator + SPN) → TGS-REP (service ticket locked with the SPN owner's key `FS01$`) → AP-REQ
   (ticket + authenticator) → access (AP-REP in the session setup response). 4 steps. **FS01 never contacts the DC**:
   it opens the ticket with its own key and reads ana's groups from the PAC. PC07 contacts DC01 once.
3. **NTLM** ([MS-NLMP] §3.1.5, §3.3.2): NEGOTIATE → CHALLENGE (FS01's 8-byte random challenge, and the target
   info: NetBIOS domain `QUILLMOOR`, computer `FS01`) → AUTHENTICATE (user `ana`, domain `QUILLMOOR`, NTLMv2
   response).
   - `NTOWFv2 = HMAC-MD5(NT hash, UTF-16LE(UPPER(user) ‖ domain))`
   - `blob = 01 01 00 00 00 00 00 00 ‖ timestamp(8) ‖ client challenge(8) ‖ 00000000 ‖ target info ‖ 00000000`
   - `NTProofStr = HMAC-MD5(NTOWFv2, server challenge ‖ blob)`; the response is `NTProofStr ‖ blob`.
4. **Pass-through:** FS01 has no hash of ana, so it sends user, domain, challenge and response to DC01 (Netlogon
   pass-through, over the secure channel) — its own step. DC01 recomputes NTProofStr from its stored hash and
   answers OK with ana's groups (or refuses) — its own step. Then FS01 grants access. 6 steps. FS01 contacts DC01
   on every NTLM logon; the client never does.
5. **NT hash = MD4(UTF-16LE(password)), no salt** ([MS-NLMP] §3.3.1): ana and ivan both have the password the
   helpdesk handed out, so DC01 holds the same hash for both.
6. **Pass-the-hash:** the response is computed from the hash, never from the password (rule 3 takes the NT hash as
   its only secret). Whoever holds the hash — copied from the memory of a machine where ana logged on — answers any
   challenge as ana, with no cracking. The DC cannot tell the difference: the attacker's response for its own
   challenge verifies exactly as ana's does.
7. **A captured challenge/response is offline material only:** it does not answer a new challenge (the DC refuses
   it), and the only use left is guessing passwords offline: a guess is right when it reproduces NTProofStr. A strong
   password resists, a weak one falls (no numbers on guessing speed on the page *(check)*).
8. **The attacker's host** holds only ana's NT hash, no ticket and no password; it connects by the address, so
   rule 1 gives NTLM (`reason: 'ip'`). Using the hash as a Kerberos key (overpass-the-hash, RC4) is out of scope.

## State

`{ target, protocol, reason, client, unc, wire: [], attacker: { hash, capture }, phase, contacts: { pcToDc, fsToDc },
challenge, response, access, log: [] }` (the task's shape plus what the page needs). `wire` is what the attacker
gained, `{ n, item }`, items `hash`, `challenge`, `response`. `log` has one event per step.

## Fixed values (checked with an independent Python model: RFC 1320 MD4, `hmac`/`hashlib` MD5)

| What | Value |
|---|---|
| password of ana and ivan (never shown) | `Jesen2026` |
| NT hash (ana = ivan) | `28ccf512b96343c8ba6ad44df5c5fe9a` |
| NTOWFv2 (ana, QUILLMOOR) | `a82e73650d4f8fc5eb8abf6af1dd8e2f` |
| timestamp (2026-11-04 08:30 UTC, FILETIME LE) | `00b457ae366cdd01` |
| PC07: server challenge / client challenge | `8c2f61d04ab7e935` / `5e1f0c3a9b2d7748` |
| PC07: NTProofStr | `023cb28a6572a5d0486c1f8454abc57e` |
| attacker's host: server challenge / client challenge | `3d90e2b7c1458a6f` / `a7046b1e93cd2f58` |
| attacker's host: NTProofStr | `75e614ada747b09c00ae4876d4c0bdb2` |
| captured response vs new challenge | refused |

Self-checks of the implementations: MD4 of `""`, `"abc"`, `"message digest"`, the 80-digit string (RFC 1320 §A.5);
NT hash of `Password` = `a4f49c406510bdcab6824ee7c30fd852`, NTOWFv2(User, Domain) =
`0c868a403bfd7a93a3001ef22ef02e3f`, NTProofStr = `68cd0ab851e51c96aabc927bebef6a1c` ([MS-NLMP] §4.2.4).

Simplifications: the target info has only the NetBIOS domain and computer names (Windows sends more pairs, and a
timestamp the client then reuses); challenges are fixed constants per client so the page is deterministic.

## Steps and presets

| Preset | Params | Steps |
|---|---|---|
| `by-name` | default | 4: TGS-REQ, TGS-REP, AP-REQ, access |
| `by-ip` | `target: ip` | 6: NEGOTIATE, CHALLENGE, AUTHENTICATE, pass-through, DC reply, access |
| `capture` | `target: ip, attacker: observer` | 6 (as `by-ip`); the observer gains the challenge (step 2) and the response (step 3) |
| `pass-the-hash` | `attacker: admin` | 7: hash copied from PC07's memory, then the NTLM 6 from the attacker's host |

`target: name, attacker: observer` is 4 steps (the observer gains nothing reusable); `admin` with either target is 7.
Maximum 7; `sim.json` `steps` is the default's, 4.
