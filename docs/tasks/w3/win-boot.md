# win-boot: Windows boot chain

| | |
|---|---|
| Task | `win-boot` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-boot` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/lnx-boot-chain/`** (no page of its own) |
| Folder | `sims/lnx-boot-chain/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `boot` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `lnx-boot-chain` merged; only one preset task per host folder at a time |

## Goal

One concept: **UEFI → Boot Manager → winload → kernel → smss → winlogon**.

The student: step a boot; break the BCD.

This is a **preset on `lnx-boot-chain`** (The boot chain), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-boot-chain/` (the host page) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Catalogue seed: → §5.15
- Microsoft Learn: "Overview of the boot process" / "Windows boot issues troubleshooting" (phases PreBoot, Boot Manager, OS Loader, Kernel) *(check titles)*; "BCD system store settings for UEFI"; "Advanced troubleshooting for Stop error 7B or Inaccessible_Boot_Device".
- M. Russinovich et al., *Windows Internals*, 7th ed., Part 2, chapter "Startup and shutdown" (smss, wininit, winlogon) *(check chapter number)*.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, „Od struje do prvog procesa" (the Linux chain this preset parallels; terms *pokretač sustava*, *jezgra*).
- Host spec: `docs/tasks/w2/lnx-boot-chain.md`, Model and presets (data-driven stages).

## Overlaps (catalogue §5)

- **§5.15 Boot and service ordering:** One boot-chain page with Linux and Windows presets. One dependency-graph page with systemd and Windows-services presets.

## Model and presets

- **Preset task on `lnx-boot-chain`.** The host takes `stages: [{id, label, lives, hands, needs, failText,
  failState}]` from the preset; this task adds a Windows chain on the same stage, same screen panel.
- **Windows stages (UEFI, Windows 10/11, Server 2019+):**
  1. UEFI firmware (NVRAM boot entry "Windows Boot Manager") → loads `\EFI\Microsoft\Boot\bootmgfw.efi` from the
     EFI System Partition (Microsoft "Windows boot process" / "Overview of boot options" *(check title)*).
  2. Windows Boot Manager → reads the BCD store (`\EFI\Microsoft\Boot\BCD`), picks the default entry, loads
     `\Windows\System32\winload.efi` (needs: BCD present and pointing to the right partition).
  3. winload → loads `ntoskrnl.exe`, HAL, the SYSTEM hive and the **boot-start drivers** (storage driver
     included); hands on to the kernel.
  4. Kernel (ntoskrnl) → initialises, starts the first user-mode process, `smss.exe` (Session Manager).
  5. smss → creates session 0 (`csrss.exe`, `wininit.exe`, which starts `services.exe` and `lsass.exe`) and
     session 1 (`csrss.exe`, `winlogon.exe`) (Windows Internals, 7th ed., Part 2 ch. 12 "Startup and shutdown"
     *(check chapter)*).
  6. winlogon → logon screen (LogonUI); after logon, `userinit.exe` → `explorer.exe`.
- **Failure presets (host `break` options for this chain):**
  - `win-normal` full chain to the logon screen. 7 steps (power on + 6 stages). Derived from the sources above.
  - `win-no-bcd` BCD missing or damaged: stops at stage 2; the screen shows the Boot Manager recovery error
    ("Your PC/Device needs to be repaired", 0xc000000f *(check code)*). 3 steps.
  - `win-no-driver` the storage controller driver is not boot-start (changed controller mode): stage 3/4 stops with
    stop code INACCESSIBLE_BOOT_DEVICE (0x7B). The Windows twin of the host's `no-driver` (initramfs without the
    disk driver): same cause, same place in the chain. 5 steps. From Microsoft "Advanced troubleshooting for Stop
    error 7B or Inaccessible_Boot_Device" *(check title)*.
  - `win-critical-service` a critical session-0 process dies (e.g. `wininit`/`csrss` missing): stop error after the
    kernel, no logon screen. 6 steps. Derived *(check stop code CRITICAL_PROCESS_DIED 0xEF)*.
- **What the host must support:** a hidden or per-preset time bar (no `systemd-analyze` split on Windows); a
  stage that **fans out** into two sessions (stage 5) shown as one box with two lines rather than a branch; a stop
  screen style per stage (`failText` already covers it).
- **Legend:** as the host; changed: the stage that just took control.
- **Captions:** hr: "Boot Manager čita BCD i u njemu pronalazi koji `winload.efi` treba pokrenuti." / en: "Boot
  Manager reads the BCD and finds in it which `winload.efi` to start." — hr: "Upravljački program diska nije
  učitan pri pokretanju: jezgra ne vidi sistemski disk — INACCESSIBLE_BOOT_DEVICE, isto mjesto kao `initramfs`
  bez upravljačkog programa." / en: "The disk driver was not loaded at boot: the kernel cannot see the system
  disk — INACCESSIBLE_BOOT_DEVICE, the same place as an initramfs without the driver."
- **Terms:** firmware — firmware (UL ch10); boot loader / boot manager — pokretač sustava (UL ch10); kernel —
  jezgra (UL ch10); boot configuration data — podaci o konfiguraciji pokretanja (BCD) *(check)*; driver —
  upravljački program; session — sesija; stop error — zaustavna pogreška (*bugcheck*) *(check)*.
- **Misconceptions:** Windows boots from `C:` directly (the EFI System Partition starts it); a blue screen at boot is
  a broken kernel (it is usually a missing driver or BCD); Windows has no init process.
- **Out of scope:** BIOS/MBR boot (`bootmgr`), Secure Boot and Measured Boot (`win-bitlocker-tpm`), Fast Startup
  (hybrid shutdown), WinRE details, service start order (`win-services`).

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-boot-chain/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
