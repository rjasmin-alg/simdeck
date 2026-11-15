<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-bitlocker-tpm: specification

One concept: **PCR measurements, and what triggers the recovery key**. The student changes firmware and boot settings,
then steps one reboot: every stage is measured into a TPM register before it runs, and at the BitLocker stage the TPM
releases the volume master key (VMK) only if the registers in the seal profile still hold the values recorded when the
key was sealed. Task: `docs/tasks/w3/win-bitlocker-tpm.md`. Model reused: `sims/lnx-boot-chain/` (data-driven stage
list, one stage per step; not yet in `models/`, so the pattern is copied, see NOTES.md).

Unchecked rules and numbers are marked *(check)* and listed in NOTES.md.

## Model

**Stages** (data, in this order): `firmware` (UEFI firmware), `secureboot` (Secure Boot policy), `bootmgr` (Windows
Boot Manager), `bitlocker` (BitLocker unlock), `winload` (Windows loader). Each stage lists what it measures:
`{ pcr, label }` pairs, where `label` is the toy measurement (a short ASCII text, data on the page).

**State:** `{ stages: [ids], power, at, done: [ids], changed, extended: [pcr], pcr: { 0, 2, 4, 7, 11 } (64-hex or
null), log: [{ pcr, label, stage }] (every extend in order, the cap included), sealed: { profile: [pcr], values: { pcr: hex }, tpm }, settings: { firmware,
secureBoot, bootManager, sameTpm }, suspended, compare, unlocked: null|true|false, how: null|'tpm'|'clearKey',
recovery, capped, resealed, atUnlock }`.

- Step 0: power off. `pcr` all `null` (the TPM holds nothing yet this boot), `at = -1`. The seal and the settings are
  shown.
- Step 1 (power on): TPM reset: every PCR = 0 (64 zero hex digits); `extended` = all five; `at = 0`.
- Steps 2–4: stage `at` is measured (each of its `{ pcr, label }` extended), then it runs and hands on (`done` += id,
  `at` += 1). `changed` = that stage, `extended` = the PCRs it extended.
- Step 5 (`bitlocker`): the unseal (rule 4, 6, 7). On release the Boot Manager extends PCR 11 (the cap, rule 8).
- Step 6 (`winload`): unlocked → winload runs, Windows starts (`done` += winload); after a suspended boot, BitLocker
  reseals (rule 6). Not unlocked → the recovery screen (`recovery = true`); winload never runs.
- **Steps per demo: 6 for every setting** (power on + 5 stages).

**Seal time** (fixed): the VMK was sealed on machine A, firmware `v1.07`, Secure Boot on, Boot Manager `v1`, with the
`profile` param's PCR list. `sealed.values` = the values those PCRs held at the unlock moment of such a boot.

## Rules

1. **PCRs start at zero on reset and change only by extend**: `PCR_new = SHA-256(PCR_old ‖ SHA-256(measurement))`,
   32 + 32 bytes in, 32 bytes out; no other write (TCG *TPM 2.0 Library*, Part 1, PCR extend; SHA-256 bank). The page
   shows the first 8 hex digits. Toy measurement = the UTF-8 bytes of the label.
2. **Measured boot: each stage is measured before it runs** (Microsoft Learn, *BitLocker countermeasures* / Group
   Policy *Configure TPM platform validation profile for native UEFI firmware configurations*, PCR list *(check)*):
   - `firmware`: PCR 0 ← `firmware=<board> <version>` (firmware code), PCR 2 ← `optionROM=<board> …` (option ROMs);
   - `secureboot`: PCR 7 ← `SecureBoot=on|off` (Secure Boot state; in reality also the keys and the authority that
     signed each loaded image, *(check)*);
   - `bootmgr`: PCR 4 ← `bootmgr=v1|v2` (the boot manager's code);
   - `bitlocker`: no measurement before the unseal; PCR 11 after it (rule 8);
   - `winload`: nothing in the five registers shown.
   Tie-break: within a stage, extends run in ascending PCR order (0 before 2).
3. **The seal profile**: BitLocker seals the VMK to a list of PCRs. With UEFI and Secure Boot the default is **7, 11**;
   without Secure Boot **0, 2, 4, 11** (Microsoft Learn, *BitLocker overview* / *countermeasures* *(check)*). Param
   `profile`.
4. **Unseal**: the TPM releases the VMK only if **every** PCR in the profile equals its sealed value (and the blob
   belongs to this TPM, rule 7); otherwise the Boot Manager asks for the **48-digit recovery password** (Microsoft
   Learn, *BitLocker recovery overview* *(check)*). `compare` = `{ pcr: { <i>: { now, sealed, match } }, sameTpm, ok }` for
   the profile's PCRs, in ascending order.
5. **A change outside the profile does not trigger recovery** (derived from rule 4): PCR 0 changes after a firmware
   update, but profile 7, 11 does not look at it.
6. **Suspend** before a planned change: the VMK is also protected by a clear key on the disk; the next boot unlocks
   with it **without the TPM check** (`how = 'clearKey'`), then BitLocker **reseals** to the values of this boot and
   protection resumes (`Suspend-BitLocker -RebootCount 1`; Microsoft Learn, *Suspend-BitLocker* *(check)*). Reseal
   values = the profile PCRs at the unlock moment (`atUnlock`, before the cap), `sealed.tpm` = this machine's TPM,
   `suspended = false`, `resealed = true`. The next boot with the same settings unlocks by the TPM.
   Tie-break: with suspend on, the clear key wins over every mismatch and over another TPM *(check: a suspended volume
   opens on any machine, because the clear key is on the disk; derived)*.
7. **Another machine has another TPM**: the sealed blob can only be unsealed by the TPM that sealed it (its keys never
   leave the chip), so with `otherMachine` on the unseal fails **even where the profile values match** (derived).
   Tie-break: `sameTpm` is checked with the values; a wrong TPM fails even if every PCR matches.
8. **Cap**: after the VMK is released, the Boot Manager extends PCR 11 (`BitLocker=unlocked`), so nothing that runs
   later in this boot can unseal the key again; that is why PCR 11 is in both profiles and its sealed value is zero
   (Microsoft Learn, PCR 11 "BitLocker access control" *(check)*). No cap on a failed unseal.

## Params

`profile` choice `7,11` / `0,2,4,11` (`7,11`); `secureBoot` toggle (on); `firmwareUpdate` toggle (off: `v1.07`, on:
`v1.08`); `bootManager` choice `original` (`v1`) / `changed` (`v2`, a newer signed version; same signer, so PCR 7 does
not change) (`original`); `suspend` toggle (off); `otherMachine` toggle (off: board A; on: board B, its own TPM, firmware
`B`, option ROM `B gpu 4.0`). Params do not reset the step: flipping one at step 6 answers "what if" at the same point.
The task's `bootDevice` setting has no param and is left out.

## Expected numbers (SHA-256 over the labels, first 8 hex; `scratchpad/pcr.py`, rechecked in `sim.test.js` against
node's `crypto`)

| PCR | label | value after the extend from zero |
|---|---|---|
| 0 | `firmware=A v1.07` | `2e30ba63` |
| 0 | `firmware=A v1.08` | `74907f7c` |
| 0 | `firmware=B v1.07` | `53333798` |
| 0 | `firmware=B v1.08` | `1279baad` |
| 2 | `optionROM=A gpu 3.1` | `c90de95b` |
| 2 | `optionROM=B gpu 4.0` | `d8ce3b26` |
| 4 | `bootmgr=v1` | `792970f9` |
| 4 | `bootmgr=v2` | `bce8fbb7` |
| 7 | `SecureBoot=on` | `8e0194f0` (task) |
| 7 | `SecureBoot=off` | `c421304f` (task) |
| 11 | `BitLocker=unlocked` (cap) | `062dacc9` |
| 11 | (not extended before the unseal) | `00000000` |

Sealed values: profile 7, 11 → `{ 7: 8e0194f0…, 11: 00000000… }`; profile 0, 2, 4, 11 → `{ 0: 2e30ba63…, 2: c90de95b…,
4: 792970f9…, 11: 00000000… }`.

## Presets (6 steps each)

| id | params | step 5 | step 6 |
|---|---|---|---|
| `normal` | defaults | PCR 7 8e0194f0 = 8e0194f0, 11 = 0: released, PCR 11 → 062dacc9 | Windows starts |
| `secure-boot-off` | `secureBoot: false` | PCR 7 c421304f ≠ 8e0194f0: held | recovery |
| `firmware-update` | `firmwareUpdate: true` | PCR 0 = 74907f7c (changed, not in profile 7, 11): released | Windows starts; with profile 0,2,4,11: PCR 0 ≠ → recovery |
| `suspended` | `firmwareUpdate, suspend: true, profile: '0,2,4,11'` | PCR 0 differs, clear key unlocks, no TPM check | Windows starts; resealed PCR 0 = 74907f7c; next boot normal |
| `disk-moved` | `otherMachine: true` | PCR 7, 11 match, but another TPM: held | recovery |
