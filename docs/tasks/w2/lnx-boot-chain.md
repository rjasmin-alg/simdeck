# lnx-boot-chain: The boot chain

| | |
|---|---|
| Task | `lnx-boot-chain` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-boot-chain` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-boot-chain/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `boot` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **firmware → bootloader → kernel → initramfs → systemd**.

The student: step a boot; break one stage.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-10/`
- Catalogue seed: UL ch10 (lanac-podizanja.svg) → §5.15
- UL ch10, section "Od struje do prvog procesa" (Što treba znati: the five links; Šire o temi:
  `initrd.target`, `root=UUID=`, `journalctl -b`, `systemd-analyze`), and "Jedinice: čime `systemd`
  upravlja" → Šire o temi (`rescue.target`, `emergency.target`); figure
  `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-10/lanac-podizanja.svg`
- bootup(7) and systemd.special(7) (systemd project); dracut(8), dracut.cmdline(7) (as cited in UL ch10)
- Windows presets: `docs/tasks/w3/win-boot.md` (adds a preset to this folder)

## Overlaps (catalogue §5)

- **§5.15 Boot and service ordering:** One boot-chain page with Linux and Windows presets. One dependency-graph page with systemd and Windows-services presets.

## Model and presets

- **Scene:** a horizontal chain of stage boxes (decision-path style), as in `lanac-podizanja.svg`:
  firmware → pokretač sustava (GRUB) → jezgra → `initramfs` → init proces (`systemd`, PID 1) →
  `default.target`. Each box shows where it lives (ROM in the machine / disk / RAM disk) and what it hands
  on; a "screen" panel shows what the console would show at the current stage; a time bar fills with the
  `systemd-analyze` split (kernel / initrd / userspace).
- **Data-driven stages** (needed for §5.15): the model takes `stages: [{ id, label, lives, hands, needs,
  failText, failState }]` from the preset, so `win-boot` can add UEFI → Boot Manager → winload → kernel →
  smss → winlogon as a preset without new model code.
- **State:** `{ stages, at: index, done: [ids], failedAt: id|null, screen, root: { initramfs, real },
  pid1: null|'systemd', target: null|string, t: { kernel, initrd, userspace } }`.
- **One step:** the current stage checks what it needs (`needs`: boot entry, kernel file, driver in
  initramfs, `root=UUID=` found, default target units); if present it does its job and hands control to the
  next stage (box lit, arrow drawn); if the broken param hits it, the chain stops there and the screen shows
  that stage's failure.
- **Rules:**
  1. Order is fixed: firmware → boot loader → kernel → initramfs → init; each hands control to the next
     (UL ch10 "Od struje do prvog procesa", fig. `lanac-podizanja.svg`).
  2. Firmware is in the machine (ROM), present before anything is installed (UL ch10; bootup(7)).
  3. The boot loader finds the kernel, loads it and starts it; it (or the firmware) also loads the
     initramfs; the kernel version is chosen here (UL ch10; bootup(7)).
  4. The kernel unpacks initramfs into a RAM disk and uses it as the first root; modules needed for the real
     root device are inside it; the real root is named by `root=UUID=…` on the kernel command line
     (UL ch10; dracut(8), dracut.cmdline(7)).
  5. `systemd` in the initrd runs up to `basic.target`, then `initrd.target`, then switches root to the real
     filesystem; the same `systemd` continues as PID 1 (UL ch10 "Šire o temi"; bootup(7)).
  6. PID 1 starts `default.target` (on the book machine `multi-user.target`); if it cannot, `rescue.target`
     (base system, filesystems mounted) or `emergency.target` (almost nothing) (UL ch10 "Jedinice…").
  7. A failure stops the chain at the first stage whose input is missing; later stages never run, so their
     logs don't exist (derived).
- **Params:** `break` select: none / no boot entry / kernel file missing / initramfs without disk driver /
  wrong `root=UUID` / default target unit fails, default none (`resets: true`); `target` choice
  multi-user / graphical, default multi-user.
- **Presets:**
  1. `normal` — full chain; screen ends at a login prompt; time bar `1.363 s (kernel) + 3.996 s (initrd) +
     26.504 s (userspace)`, `multi-user.target reached after 8.130 s` (from UL ch10, `systemd-analyze`).
  2. `no-kernel` — the loader finds no kernel image: stops at stage 2, GRUB error/prompt, no kernel log
     (derived, unchecked wording).
  3. `no-driver` — initramfs lacks the storage driver: kernel runs, root device never appears, dracut
     drops to its emergency shell after the timeout (derived, unchecked; dracut(8)).
  4. `wrong-uuid` — `root=UUID=` names a disk that isn't there: same stage, same shell as 3 — two causes,
     one symptom (derived, unchecked).
  5. `rescue` — a unit `default.target` requires fails: init is up (PID 1 exists) but the target is not
     reached; `rescue.target` vs `emergency.target` shown (derived from UL ch10 definitions).
- **Steps:** normal = 7 (power on, firmware, loader, kernel, initramfs, switch root + PID 1, target);
  failure presets 3–6.
- **Legend:** lit box = done; outlined = current; ✗ box = failed stage; grey = never reached; "changed" =
  the stage that just took control.
- **Captions:**
  - hr: "Jezgra je pokrenuta, ali pravi korijenski datotečni sustav još nije: do njega vodi `initramfs`."
  - en: "The kernel is running, but the real root filesystem isn't yet: `initramfs` is the way to it."
  - hr: "Lanac je stao na trećoj karici; ono što slijedi nije ni pokušano, pa ni zapisa o tome nema."
  - en: "The chain stopped at the third link; nothing after it was even tried, so there are no logs from it."
- **Terms:** firmware — firmware; boot loader — pokretač sustava; kernel — jezgra; initramfs — initramfs
  (početni korijenski datotečni sustav); init process — init proces; target — cilj; kernel command line —
  naredbeni redak jezgre.
- **Misconceptions:** the kernel mounts the root disk directly; boot is one event rather than a chain of
  hand-overs; the longest unit in `systemd-analyze blame` is what delayed the boot (units overlap).
- **Out of scope:** unit ordering (`lnx-systemd-ordering`), Secure Boot, BIOS vs UEFI partition details,
  GRUB configuration. Windows stages come from the `win-boot` preset task.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-boot-chain` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-boot-chain sims/lnx-boot-chain` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-boot-chain/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
