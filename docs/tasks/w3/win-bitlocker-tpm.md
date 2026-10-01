# win-bitlocker-tpm: BitLocker and the TPM

| | |
|---|---|
| Task | `win-bitlocker-tpm` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-bitlocker-tpm` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-bitlocker-tpm/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2, SEC |
| Topic / tags / level | `windows-admin` / `boot` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-boot-chain` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **PCR measurements; what triggers the recovery key**.

The student: change firmware/boot settings, reboot.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-boot-chain/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material on BitLocker or the TPM; the boot chain is in UL ch10 (below). Use the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn, *BitLocker overview*; *BitLocker recovery overview* (recovery triggers); *BitLocker countermeasures* / Group Policy setting *Configure TPM platform validation profile for native UEFI firmware configurations* (PCR list and defaults); *Suspend-BitLocker* (PowerShell reference) (check titles).
- Trusted Computing Group, *TPM 2.0 Library Specification*, Part 1, PCR extend.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, „Od struje do prvog procesa" (the boot chain and term *pokretač sustava*); `docs/tasks/w2/lnx-boot-chain.md` (model reused).

## Model and presets

- **Scene:** the boot chain as stage boxes (from `lnx-boot-chain`'s data-driven stages, Windows labels): UEFI
  firmware → Secure Boot policy → Windows Boot Manager → BitLocker unlock → winload. Under the chain the TPM with
  its PCR registers 0, 2, 4, 7, 11 (8-hex toy values); beside it the sealed volume master key (VMK) with a lock
  that lists the PCR values recorded at seal time. A "settings" card holds what the student can change before
  rebooting.
- **State:** `{ stages, at, pcr: {0, 2, 4, 7, 11}, sealed: {profile: [7, 11], values: {...}}, settings: {firmware,
  secureBoot, bootManager, bootDevice, sameTpm}, suspended, unlocked: null|true|false, recovery }`.
- **One step:** one boot stage: the stage is measured (its hash extended into its PCR), then it runs and hands
  on; at the BitLocker stage the TPM compares the current values of the profile's PCRs with the sealed values
  and releases the VMK or not.
- **Rules:**
  1. PCRs start at zero on reset and change only by extend: PCR_new = H(PCR_old ‖ H(measurement)); they cannot be
     set directly (TCG *TPM 2.0 Library* specification, PCR extend; model hash SHA-256 truncated for display).
  2. Each stage measures the next before handing control (measured boot): firmware → PCR 0, option ROMs → PCR 2,
     boot manager → PCR 4, Secure Boot state and keys → PCR 7, BitLocker access control → PCR 11 (Microsoft Learn,
     *BitLocker Group Policy settings*, PCR descriptions (check)).
  3. BitLocker seals the VMK to a PCR profile; with UEFI and Secure Boot the default profile is PCR 7 and 11,
     without Secure Boot 0, 2, 4, 11 (Microsoft Learn, *BitLocker overview* / *BitLocker countermeasures*
     (check)).
  4. Unseal succeeds only if every PCR in the profile equals its sealed value; otherwise Windows asks for the
     48-digit recovery password (Microsoft Learn, *BitLocker recovery overview* (check)).
  5. A change measured into a PCR outside the profile does not trigger recovery (derived from rule 4).
  6. Suspend before a planned change: the VMK is temporarily protected by a clear key, the next boot unlocks
     without the TPM check and BitLocker reseals to the new values (`Suspend-BitLocker -RebootCount 1`)
     (Microsoft Learn, *Suspend-BitLocker* (check)).
  7. Another machine has another TPM: the sealed blob cannot be unsealed there at all (derived; TPM keys are not
     exportable).
- **Params:** `profile` choice `7,11` / `0,2,4,11` (7,11); `secureBoot` toggle (on); `firmwareUpdate` toggle (off);
  `bootManager` choice original / changed (original); `suspend` toggle (off); `otherMachine` toggle (off).
- **Presets** (toy PCR values from rule 1 with SHA-256 over the labels, checked by script):
  - `normal` nothing changed: PCR 7 = 8e0194f0 matches, VMK released, Windows starts. Derived.
  - `secure-boot-off` Secure Boot disabled in firmware setup: PCR 7 = c421304f ≠ 8e0194f0 → recovery key. From
    rule 3–4, (check) that this is a listed recovery trigger.
  - `firmware-update` firmware updated, profile 7,11: PCR 0 changes, not in profile → unlocks; profile 0,2,4,11 →
    recovery. Derived from rule 5, unchecked.
  - `suspended` same update with `suspend` on: unlocks, reseals to the new values; the next boot is normal.
    From rule 6.
  - `disk-moved` disk in another PC: unseal impossible → recovery key. Derived.
- **Steps:** 6 for every preset (power on + 5 stages; the last shows unlock or recovery).
- **Legend:** measured stage (filled box), PCR value (monospace), PCR in the profile (ring), mismatch (cross + red
  outline), VMK released (open lock) / held (closed lock), changed (kit highlight on the PCR extended in this step).
- **Captions:** hr: "Boot Manager je izmjeren u PCR 4 prije nego što je pokrenut." / en: "The Boot Manager is
  measured into PCR 4 before it runs." — hr: "PCR 7 se ne poklapa sa zapečaćenom vrijednošću: TPM ne otpušta ključ,
  traži se ključ za oporavak." / en: "PCR 7 does not match the sealed value: the TPM keeps the key and asks for
  the recovery key."
- **Terms:** Trusted Platform Module — TPM (sigurnosni čip) *(check)*; measured boot — izmjereno podizanje *(check)*;
  platform configuration register — PCR (registar konfiguracije platforme) *(check)*; seal — zapečatiti *(check)*;
  recovery key — ključ za oporavak; Secure Boot — sigurno podizanje *(check)*; boot loader — pokretač sustava (UL ch10).
- **Misconceptions:** the TPM stores the disk password and checks it; Secure Boot and BitLocker are the same thing;
  any BIOS change triggers recovery.
- **Out of scope:** PIN/startup key protectors, network unlock, key escrow to AD/Entra (named only), DMA attacks,
  TPM internals beyond extend.
- **Builds on `lnx-boot-chain`:** reuses its data-driven `stages` list and stepping; new are measurement into PCRs,
  the sealed key and the unseal comparison.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-bitlocker-tpm` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-bitlocker-tpm sims/win-bitlocker-tpm` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-bitlocker-tpm/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
