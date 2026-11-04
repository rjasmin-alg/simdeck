<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-boot-chain: specification

One concept: **booting is a chain of hand-overs** — firmware → boot loader → kernel → initramfs → init process
(`systemd`, PID 1) → `default.target`. The student steps a boot and breaks one link. Task:
`docs/tasks/w2/lnx-boot-chain.md`. Sources are UL ch10 ("Od struje do prvog procesa", "Jedinice: čime `systemd`
upravlja") unless a rule says otherwise; `UL ch11` is the book's disk and `/etc/fstab` chapter.

## Model

A **chain** is data: `{ stages: [...], breaks: [...], targets: [...], vars: (params) => {...}, end: { <target>: [screen] },
timing }`. Each stage is `{ id, label, sub, lives, hands, needs: [needId], screen: [line], failText: [line],
failState, does: {...}, onFail: {...} }`, where `label`, `sub`, `lives`, `hands` and need ids are string keys (the page
translates them) and screen lines are console text (data, not language) or `{ t: key }` (a described screen, in the
page's language). `{name}` in a console line is filled from `vars` and the params. The Windows preset task
(`w3/win-boot`) adds a second chain without new model code.

State: `{ chain, stages: [ids], power, at, changed, done: [ids], failedAt, halt, screen: [lines], root: { initramfs,
real }, pid1, target, t: { kernel, initrd, userspace, targetAt } }`.

- Step 0: power off; nothing has run; `at = -1`; the screen is dark.
- Step 1 ("power on"): stage 0 takes control (`at = 0`, `changed` = its id); screen = stage 0's `screen`.
- Step k ≥ 2: the current stage `i = k − 2` checks its `needs`. If a need is the broken one, the chain stops:
  `failedAt` = this stage, `halt` = its `failState`, screen = its `failText`, `at` stays, `changed = null`; apply its
  `onFail`. Otherwise the stage is done (its `does` applied) and the next one takes control (`at = i + 1`, `changed` =
  that id), screen = the next stage's `screen`; after the last stage, `at = stages.length` and screen = `end[target]`.
- Steps per demo: `1 + stages.length` for a whole chain; `1 + (index of the failing stage) + 1` when a stage fails.

Params: `chain` (hidden; `linux`, or `windows` from the Windows presets, see "Windows"), `break` (none / `bootEntry` / `kernelFile` / `diskDriver` / `rootUuid` /
`targetUnit`, default none, resets), `target` (`multi-user` / `graphical`, default `multi-user`).

## Rules

1. **Order is fixed**, each stage hands control to the next: firmware → boot loader → kernel → initramfs → init
   (UL ch10 "Od struje do prvog procesa", "Lanac je time cjelovit"; fig. `lanac-podizanja.svg`). `default.target` is
   the sixth box, the task's scene. One stage takes control per step.
2. **Firmware is in the machine (ROM)**, there before anything is installed; it is the first to run, and its need is a
   boot entry on a disk (UL ch10 definition *firmware*; boot(7): "control is given to a program stored in read-only
   memory"). `lives: rom`; every other Linux stage comes from the disk.
3. **The boot loader finds the kernel, loads it and starts it**; it (or the firmware) also loads the initramfs; the
   kernel version is chosen here (UL ch10 definition *pokretač sustava*; bootup(7) "It's the boot loader or the
   firmware that loads both the kernel and initrd/initramfs images"). Need: the kernel file. The kernel's command line
   carries `root=UUID=…` (dracut.cmdline(7)).
4. **The kernel unpacks initramfs into a RAM disk and uses it as the first root**; the modules for the real root
   device are inside it; the real root is named by `root=UUID=` (UL ch10 definition *initramfs*, "Šire o temi";
   dracut(8), dracut.cmdline(7)). After the kernel stage: `root.initramfs = true`, `root.real = false`. The initramfs
   needs the disk driver **and** a partition with that UUID.
5. **`systemd` in the initrd is the same PID 1** that runs on the real root: the kernel starts it from the initramfs
   (`pid1 = 'systemd'` after the kernel stage); it runs to `basic.target`, then `initrd.target`, then switches root;
   `pid1` does not change, the root does (`root.initramfs = false`, `root.real = true`) (UL ch10 "Šire o temi";
   bootup(7)).
6. **PID 1 starts `default.target`** (`multi-user.target` on the book machine; `graphical.target` by the `target`
   param). If a unit it needs fails, the target is not reached: the special targets are `rescue.target` (base system
   with system mounts, rescue shell) and `emergency.target` (an emergency shell on the console, almost nothing)
   (UL ch10 "Jedinice…" "Šire o temi"; systemd.special(7)). The failing unit here is a mount from `/etc/fstab` (the
   book's `/mnt/vjezba` line, UL ch11): it fails `local-fs.target`, whose failure starts `emergency.target`; `rescue.target`
   is not a way out, because it pulls in the very mounts that failed (`local-fs.target` `OnFailure=emergency.target`;
   `rescue.target` requires `sysinit.target`, which wants `local-fs.target`: checked in the systemd units). State: `target = 'emergency.target'`, `halt = 'emergency'`, `pid1` stays `'systemd'`.
7. **A failure stops the chain at the first stage whose input is missing**; later stages never run (not in `done`, no
   screen, no time), so there are no logs from them (derived).

## Tie-breaks and edge cases

- **T1, first stage wins:** when two stages need the same thing, the earlier one fails (rule 7, "first stage").
- **T2, a break the chain does not have** (no stage needs it) changes nothing: the chain runs to the end.
- **T3, two causes, one symptom:** `diskDriver` and `rootUuid` stop the same stage (initramfs) with the same `halt`
  (`initrdEmergency`) and the same screen lines apart from the UUID they print (task preset 4).
- **T4, after a failure** `step` returns the state unchanged (the page cannot step past it; the model stays total).
- **T5, the target param** changes only the last stage (its sub-label, end screen and `target`), never the steps
  before it, nor `t.kernel` and `t.initrd`.
- **T6, `changed`** is the stage that just took control; `null` at step 0 and when a stage fails.

## Numbers (UL ch10 `systemd-analyze`; machine of UL ch11)

| What | Value | Source |
|---|---|---|
| kernel / initrd / userspace | 1.363 s / 3.996 s / 26.504 s (the bar's scale: 31.863 s) | ch10 `systemd-analyze`; the book cuts the line before systemd's `= total`, so the page prints no total |
| `multi-user.target` reached | 8.130 s in userspace | ch10 |
| kernel version | `6.12.0-211.16.1.el10_2.0.1.x86_64` | ch13, ch16 (ch10's journal line is cut) |
| `BOOT_IMAGE=(hd0,gpt3)/vm…` | `/boot` is `vda3` | ch10 journal, ch11 `lsblk -f` |
| root UUID | `01582c00-2b49-4e9b-86ee-75f418a4b720` (`vda4`, `/`) | ch11 `lsblk -f` |
| wrong UUID (preset 4) | `01582c00-2b49-4e9b-86ee-75f418a4b702` (last two digits swapped) | ours |
| `/mnt/vjezba` | `UUID=77b8714b-1cf6-4d6b-bce3-57d9763fb1e6` in `/etc/fstab` | ch11 |
| host | `demosrv1` | the book's prompt |

`t` fills as stages finish: `kernel` after the kernel stage, `initrd` after the initramfs stage (switch root),
`userspace` and `targetAt` after the target is reached. With `graphical` there is no measurement in the source:
`userspace` and `targetAt` stay `null` and the bar says so; kernel and initrd do not depend on the target (T5).
On a failure the bar keeps what finished; "Startup finished" is never printed.

## Presets and expected steps

| Preset | Params | Steps | Ends |
|---|---|---|---|
| `normal` | — | 7 | all six done; login prompt; `t` = 1.363 / 3.996 / 26.504, target at 8.130 |
| `no-kernel` | `break: kernelFile` | 3 | loader ✗; `halt = loaderPrompt`; kernel, initramfs, init, target never reached; `t` all null |
| `no-driver` | `break: diskDriver` | 5 | initramfs ✗; `halt = initrdEmergency`; `pid1 = systemd`, root = initramfs; `t.kernel` only |
| `wrong-uuid` | `break: rootUuid` | 5 | as `no-driver`; the command line and the error print the wrong UUID |
| `rescue` | `break: targetUnit` | 7 | target ✗; `target = emergency.target`; root real, `pid1 = systemd`; `t.kernel`, `t.initrd` |

`break: bootEntry` (no preset) stops at the firmware: 2 steps, `halt = firmwareHalt`.

Deviation: the task gives failure presets 3–6 steps; `rescue` fails at the last link, so it has 7 like `normal`.

## Windows (preset task `w3/win-boot`)

A second chain, `CHAINS.windows`, on the same stage and the same model: **UEFI → Boot Manager → winload → kernel →
smss → winlogon** (UEFI, Windows 10/11, Server 2019+). Sources: Microsoft Learn "Advanced troubleshooting for Windows
boot problems" (the phases PreBoot, Windows Boot Manager, Windows OS Loader, Windows NT OS Kernel; `bootmgfw.efi`,
`winload.efi`, `ntoskrnl.exe`, the kernel starts `smss.exe`), "Advanced troubleshooting for Stop error 7B or
Inaccessible_Boot_Device", M. Russinovich et al., *Windows Internals* 7th ed. Part 2, ch. 12 "Startup and shutdown"
(smss, csrss, wininit, services, lsass, winlogon, userinit). Titles and the chapter number checked on the web
(2026-11-04); the books' text was not read here.

Model additions (additive; every Linux result unchanged, the Linux tests pass untouched apart from the preset list):

- A chain may name its break param (`breakKey`); Windows reads `winBreak` (none / `bcd` / `bootDriver` /
  `criticalProcess`), Linux keeps `break`. So a Linux break never reaches the Windows chain and the other way round
  (W-T1), and the page shows one break control per chain.
- `does.facts` / `onFail.facts` fill the card rows a chain lists in `factRows`; a row set by `onFail` is a bad one
  (`factsBad`, red on the page). State gains `facts: {}` and `factsBad: []` (empty for Linux).
- A stage's `sub` may be a list (one line each): the smss box shows `smss.exe`, session 0 and session 1, one box with
  two session lines rather than a branch (the task's fan-out).
- `{ t: key }` lines are `{var}`-filled like console lines (the driver row picks `wDrvLoaded` / `wDrvNotLoaded`).
- No `targets`, no `timing`: the page hides the target choice and the time bar.

Rules:

- **W1, order:** UEFI firmware (ROM, NVRAM entry "Windows Boot Manager"; needs the boot entry) → Boot Manager
  (`\EFI\Microsoft\Boot\bootmgfw.efi` on the ESP, FAT32; needs the BCD `\EFI\Microsoft\Boot\BCD`) → winload
  (`\Windows\system32\winload.efi` on C:) → kernel (`ntoskrnl.exe`; needs the disk driver loaded at boot) → smss
  (needs its critical processes running) → winlogon (LogonUI; after logon `userinit.exe` → `explorer.exe`, not
  stepped). One hand-over per step; 7 steps.
- **W2, not from C::** "Files from" is the ESP after the firmware, C: after Boot Manager; the BCD's default entry
  (`device partition=C:`, `path \Windows\system32\winload.efi`) shows once Boot Manager has read it.
- **W3, no BCD:** Boot Manager stops (3 steps); recovery screen `Your PC/Device needs to be repaired` / `The Boot
  Configuration Data for your PC is missing or contains errors.` / `File: \EFI\Microsoft\Boot\BCD` / `Error code:
  0xc000000f` (the message and code as reported for Windows 10; *(check)* on a real machine); no stop error, the kernel
  never ran.
- **W4, driver not boot-start:** the controller was switched to AHCI and `storahci.sys` has `Start=3` (demand), so
  winload, which loads only boot-start drivers (`Start=0`), leaves it out; the card shows it at step 4. The kernel
  cannot see the system disk and stops with `INACCESSIBLE_BOOT_DEVICE` (0x7B), 5 steps: the twin of Linux `no-driver`,
  the stage after the loader at the same step. `storahci`/`Start` as the example *(check)*.
- **W5, smss is the first user-mode process**, started by the kernel (the misconception "Windows has no init process").
- **W6, smss fans out:** session 0 `csrss.exe, wininit.exe → services.exe, lsass.exe`; session 1 `csrss.exe,
  winlogon.exe`.
- **W7, a critical process dies:** `wininit.exe` in session 0 dies; stop code `CRITICAL_PROCESS_DIED` (0xEF), 6 steps;
  no logon screen; the kernel stage is done (fine) *(check: a missing csrss/winlogon at start can also give
  0xC000021A)*.
- **W8:** no time bar, no target, no PID 1 or root rows.

Tie-breaks: **W-T1** each chain reads only its own break; **W-T2** `none` and a break no stage needs change nothing;
**W-T3** the first stage that needs the driver is the kernel, not winload (winload does not check, it leaves the driver
out). Steps before a stop equal the whole boot's (W9; only the driver row differs at step 4 under `bootDriver`).

| Preset | Params | Steps | Ends |
|---|---|---|---|
| `win-normal` | `chain: windows` | 7 | all six done; logon screen |
| `win-no-bcd` | `winBreak: bcd` | 3 | Boot Manager ✗; `halt = bcdRecovery`; BCD row red |
| `win-no-driver` | `winBreak: bootDriver` | 5 | kernel ✗; `halt = bugcheck7b`; driver row red |
| `win-critical-service` | `winBreak: criticalProcess` | 6 | smss ✗; `halt = bugcheckEf`; session 0 row red |

Screens other than the recovery screen and the stop screens are described in words (logo, spinning dots, logon
screen): Windows shows graphics there, not text.

## Out of scope

Unit ordering (`lnx-systemd-ordering`), Secure Boot and Measured Boot (`win-bitlocker-tpm`), BIOS/MBR Windows boot (`bootmgr`), Fast Startup, WinRE, Windows service order (`win-services`), BIOS vs UEFI details, GRUB configuration. Console text is the
console without `quiet` (the book machine's real console shows a splash); its wording is from memory *(check)*.
