<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-bitlocker-tpm: notes

New stepper (task `docs/tasks/w3/win-bitlocker-tpm.md`, catalogue §4.5.7). Rules and expected numbers: `SPEC.md`. The
task names no kit view; the page draws the chain, the PCR table, the seal and the screen itself.

## Decisions

- **Scene:** above, the five stages as boxes (number, name, what each measures into which PCR, the measured label in
  monospace once measured, a mark: ✓ done, ▶ running, · waiting, ✕ never ran). Filled (series 1) once measured; the
  stage of this step has the kit's `sd-changed` ring. Below left: the TPM (PCR 0, 2, 4, 7, 11, what each records, its
  8-hex value; the profile's PCRs in a ring, the PCRs extended this step on the highlighter) and "Settings of this
  boot" (seal time vs now, a changed value outlined). Below right: the sealed VMK (profile, sealed vs now vs equal,
  the TPM row, a lock closed / open / dashed while waiting) and the screen.
- **Steps:** step 1 is power on (TPM reset: every PCR to zero, all five highlighted); steps 2–6 are the five stages.
  The compare is at step 5; step 6 is winload (Windows starts) or the recovery screen. 6 steps for every setting.
- **PCR 11 is the cap, not a measurement before the unseal.** The task's rule 2 lists "BitLocker access control →
  PCR 11" with the measurements. As far as I know the Boot Manager extends PCR 11 *after* it has the key, so nothing
  later in the boot can unseal it again; that is why PCR 11 is in both profiles with the sealed value zero. The model
  does this (SPEC rule 8) *(check)*. On a failed unseal there is no cap.
- **Toy measurements are short labels** (`firmware=A v1.07`, `SecureBoot=on`, …), extended once per PCR from zero with
  real SHA-256 (a small pure implementation in `sim.js`, tested against node's `crypto`). The task's two numbers
  (8e0194f0, c421304f) come out of `SecureBoot=on|off`, so those labels were reverse-engineered from the task's values.
  PCR 7 in reality also holds the Secure Boot keys and the signing authority of every loaded image; one label stands
  for all of it.
- **"Newer Boot Manager"** is a newer *signed* build: PCR 4 changes, PCR 7 does not (same signer). It shows why the
  7, 11 profile survives Boot Manager updates and 0, 2, 4, 11 does not. An unsigned Boot Manager (Secure Boot refusing
  it) is a different concept (Secure Boot itself) and is left out.
- **Seal time is fixed** (machine A, firmware v1.07, Secure Boot on, Boot Manager v1); the `profile` param is the
  profile used at seal time. With 0, 2, 4, 11 and Secure Boot on, the profile was chosen by policy; the explanation
  says which profile is the default when.
- **Suspend** shows the compare (so the student sees what *would* fail) but the header says "not checked" and the lock
  opens by the clear key. At step 6 the seal is replaced with this boot's values (highlighted) and the compare column
  is re-read against the new seal; the next boot with the same settings unlocks by the TPM (tested with a second boot
  in `sim.test.js`). Reseal values are those at the unlock moment, before the cap.
- **Suspend + another machine** unlocks (the clear key is on the disk) and the caption says so; reseal then binds to
  machine B's TPM *(check: whether resume re-creates the TPM protector on a new TPM)*.
- **Disk in another machine:** board B, its own firmware and option ROM, so PCR 0 and 2 differ, but PCR 7 and 11 match
  (same Secure Boot keys); with profile 7, 11 every value matches and the unseal still fails, which isolates rule 7.
- **Params do not reset the step**, so a lecturer at step 6 can flip the profile and see the outcome change in place.
- **Recovery screen:** described in words in the page's language, plus 8 empty 6-digit groups; not an imitation of
  the vendor screen. Where the key is kept (printout, account, AD, Entra ID) is named only, as the task says.
- **Settings card** has no `bootDevice` row: the task's state lists it but no param drives it.

- **Review (fresh agent, mutations):** sim.js matched SPEC; four missing tests added (reseal to machine B's TPM, reseal
  of every profile PCR, recovery only at step 6, the measurement log). Page fixes from the review: the explanation no
  longer says BitLocker "records what ran" (it encrypts and gets its key only if the measurements match); the sealed
  key is said to be stored on the disk (only that TPM unseals it), which is what makes "disk in another machine" work;
  the seal table's column reads "at the compare" from step 5 (the TPM table beside it shows PCR 11 after the cap); no
  ✓/✕ after a reseal (no TPM check ran on that boot); the other-TPM caption says "would keep it even if every value
  matched"; the Secure Boot box says "measured, no check" when Secure Boot is off; a failed BitLocker box says "key
  held"; the legend's filled box is "stage ran"; the file name `bootmgfw.efi` and the cmdlet alias are gone.

## Deviations from the task

- PCR 11 is extended after the unseal (the cap), not before it (see Decisions).
- `bootDevice` left out of `settings` (no param).
- Presets: `firmware-update` uses profile 7, 11 (unlocks; the hint says to try 0, 2, 4, 11), `suspended` uses profile
  0, 2, 4, 11, because with 7, 11 the firmware update would unlock anyway and suspend would show nothing.

## Model reuse

`lnx-boot-chain` is not in `models/`. Its chain model (`CHAINS`, `failIndex`, hand-over with needs) does not fit a
measurement-and-compare model, so I copied the **pattern** (a data-driven stage list, power on as step 1, one stage
per step, `done`/`at`/`changed`), not code; the header of `sim.js` says so. Nothing here needs promoting, and nothing
in `lnx-boot-chain` needs to change.

## Sources

- TCG, *TPM 2.0 Library Specification*, Part 1: PCR extend (new = H(old ‖ data)); reset to zero. From memory; the
  "measurement is itself a hash" (H(old ‖ H(m))) is how measured boot uses it.
- Microsoft Learn, *BitLocker overview*; *BitLocker recovery overview*; *BitLocker countermeasures*; Group Policy
  *Configure TPM platform validation profile for native UEFI firmware configurations*; *Suspend-BitLocker*. Not
  fetched (offline overnight run); every rule taken from them is marked *(check)* below.
- UL ch10 "Od struje do prvog procesa" (term *pokretač sustava*); `sims/lnx-boot-chain/` (model pattern).

## Unchecked *(check)*

1. PCR assignments: 0 firmware code, 2 option ROM code, 4 boot manager, 7 Secure Boot state, 11 BitLocker access
   control.
2. Default profiles: 7, 11 with UEFI + Secure Boot; 0, 2, 4, 11 without Secure Boot.
3. Secure Boot off is a listed recovery trigger (it follows from 1–2 here).
4. A firmware update with profile 7, 11 does not trigger recovery (real updates can also change PCR 7 if they change
   the Secure Boot databases; not modelled).
5. The PCR 11 cap after the unseal (SPEC rule 8).
6. `Suspend-BitLocker -RebootCount 1`: clear key, unlock without the TPM, reseal, automatic resume after one reboot.
7. A suspended volume unlocks in another machine (clear key on the disk), and what resume does with a new TPM.
8. The recovery password is 48 digits in 8 groups of 6.
9. Term pairs below.

## Term pairs (missing in `kit/glossary.js`; written out in `strings.js`)

| en | hr |
|---|---|
| Trusted Platform Module, TPM | sigurnosni čip (TPM) *(check)* |
| measured boot | izmjereno podizanje *(check)* |
| platform configuration register, PCR | registar konfiguracije platforme (PCR) *(check)*; the page says "registar PCR" |
| seal | zapečatiti *(check)* |
| recovery key | ključ za oporavak |
| Secure Boot | sigurno podizanje *(check)* |
| volume master key, VMK | glavni ključ volumena (VMK) |
| extend (PCR) | proširiti / proširenje |

`boot loader` / `pokretač sustava` is in the glossary and used in the explanation.

## Shared requests

None.

## Time

Started 15:04, done (gate pass, review applied, full tests and check) 15:21: about 17 min by the machine clock.
