<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntlm-vs-kerberos: notes

New stepper (task `docs/tasks/w3/win-ntlm-vs-kerberos.md`, catalogue `win-ntlm-vs-kerberos`, §4.5.1, wave 3). Drawn
with kit view **K1, message sequence chart** (`kit/sequence.js`); the task's "attacker sees" overlay is K1's
eavesdropper column (`eve`, `seen`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Lanes** `PC07`, `FS01`, `DC01` as the task says, plus a fourth lane **attacker** (its own host) only when the
  attacker is admin on PC07: the task's pass-the-hash answers FS01's challenge "from another host", which needs a
  sender other than PC07. Lane cards hold what each party has: PC07 the NT hash and TGT in memory, the attacker
  nothing then ana's hash, FS01 its key `FS01$` and "no hash of ana", DC01 the NT hashes of ana and ivan marked
  "same" (rule 5).
- **The NTLM arithmetic is real** (MD4, MD5, HMAC-MD5, NTLMv2 in `sim.js`, about 100 lines), checked against RFC 1320
  and the [MS-NLMP] §4.2.4 test vectors and against an independent Python model. Hashes, challenges and proofs on the
  page are the real values for the page's fixed inputs, shortened to 8 hex digits where space is short.
- **The password is never shown.** ana and ivan share it (SPEC.md); only the hashes appear.
- **The Kerberos half starts from a TGT from logon** (3 messages + access, as rule 2 says); the AS exchange is
  `win-kerberos`'s page. Ticket locks are drawn as in `win-kerberos` (K1's CSS lock with the key name).
- **By address the client does not ask the KDC at all**: Windows' default (no `TryIPSPN`). `win-kerberos`'s `by-ip`
  preset shows a TGS-REQ for `cifs/10.10.0.20` failing with `KDC_ERR_S_PRINCIPAL_UNKNOWN`, which is what a client with
  `TryIPSPN` set and no address SPN does. Both end in NTLM; this page follows the task's 6 steps. Worth one line in
  `win-kerberos`'s explanation some day (not this task's folder).
- **The attacker connects by address** (SPEC rule 8), so the `target` choice is disabled with a reason while the
  attacker is admin on PC07. The alternative, an attacker using the hash for Kerberos (overpass-the-hash, RC4), is
  out of scope in the task.
- **The observer sits on the client's network segment** (labelled so in the control): it sees PC07↔DC01 and PC07↔FS01, not FS01↔DC01 (the column says "not
  on its path" for the pass-through rows). With Kerberos it gains nothing reusable; with NTLM it gains the challenge
  (step 2) and the response (step 3), marked with the eye and highlighted on their step.
- **The two panels** (Kerberos, NTLM) list how often FS01 and the client asked DC01, what an attacker gets from the
  wire and from PC07's memory, and (NTLM) the response formula with this run's challenge and proof. The panel of the
  protocol in use is outlined and counts live; the other shows the other path run to its end (playbook: "run the
  others to their own end"), with the same attacker (none when the attacker is admin, whose run is NTLM only).
- **Time column** shows the protocol of the row (`Kerberos`, `NTLM`, `Netlogon`; the theft row "memory"): with line
  style it gives a second, non-colour carrier for the legend.
- **Theft note on the attacker lane** ("copies ana's NT hash from PC07's memory"): on PC07's lane the note ran into
  the time column.
- **Netlogon rows use `place: 'mid'`** so "challenge + response" sits between FS01 and DC01.
- **Pass-through** is drawn dotted (task legend). The kit has no dotted or eye legend swatch: the page draws both.
- **Fallback reasons beyond the address** (realm, no DC, local account) are in the explanation and in
  `negotiate()` with tests; there is no param for them (the task's params are `target` and `attacker`).
- **No guessing-speed numbers** anywhere (task rule 7).
- Related: `win-kerberos`, `lateral-movement` (credential reuse after the hash: linked through `related`, not
  repeated; the task's note for the coordinator).

## Deviations from the task

- Fourth lane for the attacker's host (above).
- The `target` param is disabled while the attacker is admin (above).
- en caption for the attacker: "— the password is never needed" instead of "he never needs the password" (no gendered
  pronoun for the attacker). The hr caption is the task's.
- Title "NTLM i Kerberos / NTLM vs Kerberos"; concept shortened to fit 80 characters ("NTLM fallback").

## Sources

- [MS-NLMP] §3.3.1 (NT hash, `NTOWFv1` = MD4(UNICODE(password))), §3.3.2 (NTLMv2: `NTOWFv2`, `NTProofStr`, the
  blob), §2.2.2.1 (AV_PAIR ids: 1 NetBIOS computer, 2 NetBIOS domain, 0 EOL), §4.2.4 (test vectors).
- RFC 1320 (MD4, §A.5 test suite), RFC 1321 (MD5), RFC 2104 (HMAC), RFC 4178 (SPNEGO).
- Microsoft Learn: "Microsoft Negotiate"; "NTLM overview"; "Configuring Kerberos for IP Address" *(check title)*
  (by default no Kerberos for an address; `TryIPSPN` from Windows 10 1507 / Server 2016).
- `docs/tasks/w2/win-kerberos.md` and `sims/win-kerberos/` (Kerberos half: SPN owner, ticket locks; copied
  `SPNS`/`spnOwner` from `sims/win-kerberos/sim.js @ 11f419a`; `models/` has no Kerberos model yet).
- Names: `quillmoor.example` / `QUILLMOOR`, `PC07`, `FS01` (`10.10.0.20`), `DC01`, user `ana`, share `projects`
  (the task's); `ivan` (the second account with the same password) is this page's.

## Checks

- Numbers: an independent Python model (pure-Python MD4 checked on the RFC 1320 suite, `hmac`/`hashlib` MD5) computed
  the NT hash, NTOWFv2 and both NTProofStr values and the step counts (by-name 4, by-ip 6, capture 6,
  pass-the-hash 7; max 7) before the model was written; the JS model agrees on every value (SPEC.md "Fixed values").
- Rule tests: 20 tests, tie-breaks first (fallback reason order, `TryIPSPN` needs both flags, the attacker goes by
  address whatever the target).
- Fresh review (a separate agent read the code against SPEC.md, the task and [MS-NLMP], recomputed every value with
  `node:crypto`, ran 60 mutants and drove 160 pages: every preset and param combination, steps 0–7, hr and en; no
  console errors, no `undefined`/`NaN`/placeholders, no overflow). Model and protocol facts confirmed. Fixed from it:
  "Negotiate tries Kerberos first" next to "does not try Kerberos for an address" (now "prefers Kerberos … does not even
  ask for a ticket"); "PC07 sends its TGT" → ana's TGT; the observer is now defined and labelled as on the client's
  network (it sees PC07↔DC01 too); the attacker's challenge caption no longer says "not the one ana got"; the proof in
  parentheses (no "….."); Croatian genitive after negation ("nema aninog sažetka"), "drugi protokol", "nikad; to
  radi FS01", "DC01 nitko ništa ne pita"; the capture hint got its step count; "their own host". Mutants that
  survived (the client computing from PC07's memory or from the password instead of its own memory; the AP-REQ ticket
  under krbtgt) now fail a test; the two left are equivalent (an unused salt parameter, an unset `auth.challenge`).
  Not changed: with the admin attacker the disabled target control still shows `\\fs01\projects` selected (the
  reason is written under it); the Netlogon field touches DC01's lifeline in the 4-lane chart.
- `npm run gate -- win-ntlm-vs-kerberos`: passes (61/61 browser checks). Screenshots reviewed: 1920×1080 light, dark,
  grayscale and 375×812 in hr and en; also pass-the-hash at 1 and 7 (hr, en), capture at 3 (light, dark) and 6 (en),
  by-name with an observer at 4.

## Unchecked *(check)*

- The Microsoft Learn title "Configuring Kerberos for IP Address" and the exact `TryIPSPN` behaviour (both flags
  needed) are from memory.
- Netlogon pass-through runs over the DC secure channel; the page only says the observer is "not on its path".
- Windows sends more target-info pairs (DNS names, timestamp, flags) than the two the model uses; the arithmetic is
  the same.
- Croatian terms not in the glossary (below).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| challenge | izazov | task *(check)* |
| challenge-response | izazov-odgovor | task *(check)* |
| hash | sažetak | task, URM ch18 *(check)* |
| pass-the-hash | napad prosljeđivanjem sažetka (English term kept) | task *(check)* |
| pass-through (authentication) | prosljeđivanje provjere | simdeck *(check)* |
| fallback (to NTLM) | prelazak na NTLM | simdeck; task has "povratak na NTLM" *(check)* |
| ticket | karta | NLA T57 |
| service principal name (SPN) | ime principala usluge | task *(check)* |
| on-path observer | promatrač na putu | simdeck *(check)* |

## Shared requests

- **Kit legend swatches** `dotted` (a dotted line, to match K1's `line: 'dotted'`) and `eye` (an observer): the page
  defines them in its CSS.
- **K1 eavesdropper cell, "gained" mark**: the page wraps what the attacker gained in its own boxed eye; a kit-level
  `seen` flag ("new for the eavesdropper") would make that common across `tls-handshake`, `oauth-flow` and this page.
- **`models/kerberos`**: `SPNS`/`spnOwner` are copied from `win-kerberos` (COMMON.md §6); promote with
  `win-kerberos`'s model when the coordinator does.

## Time

Start 2026-11-04 04:29; model, page, review, review fixed, gate passing and status ready 04:52: about 23 min.
