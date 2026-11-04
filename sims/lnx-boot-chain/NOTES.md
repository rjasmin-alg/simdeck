<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-boot-chain: notes

New stepper (task `docs/tasks/w2/lnx-boot-chain.md`, catalogue §4.4, overlap §5.15). Rules and expected numbers:
`SPEC.md`. The task names no kit view; the page draws the chain, the console and the time bar itself.

## Decisions

- **Scene:** above, six boxes in a row (firmware, boot loader, kernel, initramfs, init process, target), each with its
  number, its state in words and a mark (✓ done, ▶ in control, ✗ stopped, – never tried, · waiting), the sub-label
  (`GRUB`, `systemd, PID 1`, `default.target → multi-user.target`), where it lives (a chip), what it needs (✓/✗ per
  need once checked) and what it hands on. Below, left: the console of this moment (dark panel; console text is data,
  `translate="no"`); right: a card with the root, PID 1 and the target, plus while the initramfs is the root what
  `root=` asks for against what the disk has (the two causes of one symptom side by side), the halt state, and on the
  emergency stop `rescue.target` ✗ vs `emergency.target` ▶. Bottom: the time bar (kernel / initrd / userspace to scale
  of the book's 31.863 s, initrd hatched, a tick at the target, the raw `Startup finished …` line when done).
- **One step = one hand-over.** Step 1 is power on (the firmware takes control); each later step the stage in control
  checks its needs and hands on, or stops. So the six boxes give 7 steps (task: "power on, firmware, loader, kernel,
  initramfs, switch root + PID 1, target"), and a stop at stage *i* (0-based) is step *i* + 2.
- **Data-driven chains:** `CHAINS.linux` holds the stages (`id, label, sub, lives, hands, needs, screen, failText,
  failState, does, onFail`), the break options, `vars(params)` for the console placeholders, the end screens per target
  and the timing. `label`/`lives`/`hands`/need ids are string keys, so a second chain brings its own strings. The hidden
  `chain` param selects it (only `linux` now). The page builds the `break` options from every chain's `breaks`.
- **PID 1 from the initramfs on:** `pid1 = 'systemd'` once the kernel hands over (systemd in the initrd is PID 1, the
  same process continues after switch root; rule 5). So in `no-driver` and `wrong-uuid` PID 1 exists while the chain
  is stopped in the initramfs; the caption says so.
- **The `rescue` preset ends in `emergency.target`:** the failing unit is the book's `/mnt/vjezba` line in `/etc/fstab`
  (UL ch11) whose disk is gone; the mount fails `local-fs.target`, whose failure starts `emergency.target`. The card shows
  `rescue.target` crossed out (it pulls in those very mounts: `rescue.target` requires `sysinit.target`, which wants
  `local-fs.target`) and `emergency.target` taken. The task says "rescue.target vs
  emergency.target shown", which this does; the preset id stays `rescue` as the task names it, its label is "Cilj nije
  dosegnut" / "Target not reached".
- **Two causes, one symptom:** `no-driver` and `wrong-uuid` stop at the same stage with the same console lines; only
  the UUID differs (`wrong-uuid` swaps the last two digits: `…4b720` → `…4b702`). The card's "Traži se / Na disku" rows
  show the difference: the disk is invisible without the driver, visible but with another UUID otherwise.
- **Console text** is the console without `quiet`, with systemd's `unit - Description` status format; the GRUB menu
  entry is written generically as `Linux (<version>)` (no distribution name). Kernel messages `Trying to unpack rootfs
  image as initramfs...` and `Run /init as init process` are the kernel's own; the command line is the book's
  `BOOT_IMAGE=(hd0,gpt3)/vm…` completed with the kernel version and `root=UUID=` of `vda4` and `ro`.
- **Time bar** (kernel solid, initrd hatched, userspace striped, so they differ by more than colour); the raw line is
  `Startup finished in 1.363s (kernel) + 3.996s (initrd) + 26.504s (userspace)` without the `= total` systemd adds,
  because the book's line is cut there.
- **Time fill:** `t.kernel` fills when the kernel hands over, `t.initrd` at switch root, `t.userspace` and the target tick
  when the target is reached. On a stop the unfinished phases are hatched "nije izvedeno", and the head says there is no
  total. With `graphical` the book has no measurement, so userspace says "nije izmjereno" and there is no tick; kernel
  and initrd keep the book's numbers (they do not depend on the default target).
- **The card** shows only the rows the chain's stages fill (`does.root`, `does.pid1`, `does.target`). "Traži se / Na
  disku" shows while the initramfs is the root; the answer (disk invisible, or its UUID) appears only once the initramfs
  has stopped, and the wrong row is the red one (`root=` for a wrong UUID, the disk for a missing driver).
- **`changed`** (yellow + outline) is the stage that just took control, as the task's legend says; nothing on a stop
  and at the end. The card marks the root, PID 1 or target value that changed in this step the same way.
- **Captions:** one per finished stage (`capDone_<id>`), the task's two captions at step 4 and on a stop
  (`capStopped`, with the ordinal of the link; not on the last link, which has nothing after it), a cause per break
  (`capFail_<break>`).

## Deviations from the task

- **`rescue` has 7 steps**, not 3–6: it stops at the last link (the target), one step after the init process.
- **The `rescue` preset reaches `emergency.target`, not `rescue.target`** (see Decisions): systemd does not go to
  `rescue.target` by itself when a unit fails; the book's two definitions are both shown.
- **`break: bootEntry`** has no preset (the task lists five presets); it stops at the firmware in 2 steps.
- **Firmware screens** are described in words (`(firmware checks memory and devices …)`, `(the firmware reports that
  there is no device to boot from)`), not imitated: they are vendor-specific and differ between BIOS and UEFI.

## Sources

- UL ch10 "Od struje do prvog procesa" (Što treba znati, Šire o temi: `initrd.target`, `root=UUID=`, `journalctl -b`,
  `systemd-analyze` 1.363 / 3.996 / 26.504 s and `multi-user.target reached after 8.130s`), "Jedinice…" (`systemctl
  get-default` → `multi-user.target`; Šire o temi: `rescue.target`, `emergency.target`), fig. `lanac-podizanja.svg`
  (the five links and their one-line descriptions). Read in full for this task.
- UL ch11: `lsblk -f` (`vda3` `/boot` xfs, `vda4` `/` xfs `01582c00-2b49-4e9b-86ee-75f418a4b720`), the `/etc/fstab` line
  `UUID=77b8714b-… /mnt/vjezba ext4 defaults 0 2`, "cilj `local-fs.target` znači upravo to". UL ch13/ch23: the full
  kernel version `6.12.0-211.16.1.el10_2.0.1.x86_64`.
- boot(7), bootup(7), dracut(8), dracut.cmdline(7), systemd.special(7) as quoted in UL ch10's footnotes.
- Checked in the systemd units on this build machine: `local-fs.target`, `initrd.target`, `initrd-root-fs.target`
  and `initrd-switch-root.target` have `OnFailure=emergency.target`; `rescue.target` `Requires=sysinit.target`,
  `sysinit.target` `Wants=local-fs.target`; the descriptions `Basic System`, `Local File Systems`, `Initrd Root File
  System`, `Initrd Default Target`, `Switch Root`, `Multi-User System`, `Graphical Interface`.
- From memory *(check)*: the systemd status lines (`[ TIME ] Timed out waiting for device …`, `[DEPEND] Dependency
  failed for …`, the `unit - Description` format of systemd 257); the emergency mode text (the book machine is a cloud image whose root account may be
  locked, in which case the console asks for no password but says the root account is locked); dracut's `Warning: /dev/disk/by-uuid/… does not exist`, `Entering emergency mode. Exit the shell to
  continue.` and the `dracut:/#` prompt; GRUB's `error: file '…' not found.` / `you need to load the kernel first.` /
  `Press any key to continue...` and its menu help lines.
- Numbers: printed by a script from the model before the page was written, and asserted in `sim.test.js`.

## Concepts, not tools

The concept is the Linux boot chain, so Linux, systemd (the catalogue concept names it) and GRUB (the task's box label,
named in UL ch10) appear. dracut is named nowhere on the page in words; its prompt `dracut:/#` appears only as console
text. No distribution is named (the book machine is Rocky Linux 10.2; the GRUB entry is written `Linux (…)`).
Commands and files appear where they are the subject: `root=UUID=`, `/etc/fstab`, `default.target`, `systemd-analyze`.

## Term pairs

From the glossary: *boot loader* (pokretač sustava), *kernel* (jezgra), *init process* (init proces), *unit*
(jedinica), *target* (cilj). Missing from `kit/glossary.js`, written out in both tables (`*…*` / `<em lang="en">`):

- *firmware* — **firmware** (UL ch10 definition: "**firmware** (*firmware*)").
- *initramfs* — **initramfs** (početni korijenski datotečni sustav) (UL ch10; the task's Terms).
- *kernel command line* — **naredbeni redak jezgre** (UL ch10, the task's Terms).
- *root file system* — **korijenski datotečni sustav** (UL ch10).
- *RAM disk* — **RAM disk** (UL ch10 uses it untranslated).
- *emergency shell* — **hitna ljuska**; *rescue shell* — **spasilačka ljuska** (UL ch10 "Šire o temi").
- *switch root* — **zamjena korijena** (UL ch10 "jedinicu koja sustavu zamjenjuje korijen") *(check)*.

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (same as `lnx-overlayfs-layers`,
  `lnx-links-inodes`); worked around in the page CSS.
- **Done in `w3/win-boot`:** the Windows chain is in (see "Windows preset" below); the earlier request for it is closed.
- **Title and subtitle are Linux-only (owner/coordinator, from `w3/win-boot`):** `sim.json` `concept` is "Firmware →
  boot loader → kernel → initramfs → systemd", and the kit shows it on the Windows presets too. A neutral concept such
  as "Firmware → boot loader → kernel → first process: a chain of hand-overs" / "Firmware → pokretač sustava → jezgra →
  prvi proces: lanac predaja" would fit both. Left unchanged: the host's title is not the preset task's to change.
- **Entries carry no topic (site, from `w3/win-boot`):** the task gives `win-boot` the topic `windows-admin`, but an
  `entries` item has no `topic`, so the Windows chips sit on the `linux-admin` tile. The WIN1 course file can name
  `lnx-boot-chain#win-normal` meanwhile.

## Windows preset (task `w3/win-boot`)

Rules, numbers and sources: `SPEC.md` "Windows". Decisions:

- **Its own break param, `winBreak`.** One `break` select with every chain's options would offer Linux breaks on a
  Windows boot (no-ops, T2), and two controls on one key break the URL (the kit coerces a query value with every spec
  of that key, the last wins). So a chain names its key (`breakKey`); the page builds one select per chain and shows
  the chosen chain's. The model reads the break through `breakOf(p)`; the page's caption and the ✗ on a need too (the
  caption read `p['break']` before and printed a missing key on Windows: found in the browser run, fixed).
- **The chain stays a hidden param, set by the four Windows presets.** A visible Linux/Windows switch was tried: with
  nine presets it pushed the panel 65 px past one screen at 1920×1080 (the gate failed). Each Windows preset label
  starts "Windows:".
- **The card's Windows rows** come from the chain (`factRows`, `does.facts`, `onFail.facts`): files from (ESP, then C:),
  the BCD's default entry, the disk driver (`storahci.sys`, `Start=0` loaded / `Start=3` not loaded), the first
  process (`smss.exe`), session 0 and session 1, then the halt state. The row a failure set is red. These answer the
  three misconceptions: not from C:, a blue screen is a missing driver or a broken BCD and not the kernel, `smss.exe`
  is the first user-mode process. On Windows the card takes a bit more width (`.bc[data-chain="windows"]`; no time bar).
- **The fan-out (stage 5)** is one box with three sub-lines: `smss.exe`, "session 0: csrss, wininit", "session 1: csrss,
  winlogon" (`sub` may now be a list).
- **Screens:** the recovery screen and the two stop screens as text (English, as on an English install; console text is
  data, `translate="no"`); the rest described in words, since Windows shows a logo there, not text.
- **Stage labels:** en "UEFI firmware, Boot Manager, OS loader, kernel, Session Manager, logon"; hr "UEFI firmware,
  pokretač sustava, učitavač sustava, jezgra, upravitelj sesija, prijava". The box sub-label carries the file name.
- **`win-no-driver` stops at the kernel, not at winload:** winload does not check for the storage driver, it loads only
  boot-start drivers and leaves the rest out; the kernel is the first that needs it (W-T3). Same step (5) and same
  place after the loader as Linux `no-driver`.
- **`win-critical-service`:** `wininit.exe` dies (the task's "e.g. wininit/csrss"); `CRITICAL_PROCESS_DIED` 0xEF.
- **Entries:** `win-normal` ("The Windows boot chain") and `win-no-bcd` (the task's "break the BCD"). Aliases gain the
  Windows terms (BCD, winload, smss, …).

Unchecked *(check)*: the recovery screen's exact text on Windows 10/11 (taken from reports of 0xc000000f, UEFI path);
the stop screens' wording (`Your PC ran into a problem…`, `Stop code: …` with underscores; versions differ);
`storahci` `Start=3` as the example of a driver that is not boot-start (the Microsoft 7B article names a changed
controller mode; the storahci detail is from memory); 0xEF vs 0xC000021A for a session-0 process (a missing csrss or
winlogon at start-up is often reported as 0xC000021A); the hr terms below.

Term pairs (Windows, not in `kit/glossary.js`; written out in the tables): *boot configuration data* — podaci o
konfiguraciji pokretanja (BCD) *(check)*; *OS loader* — učitavač sustava *(check)*; *Session Manager* — upravitelj
sesija *(check)*; *session* — sesija; *driver* — upravljački program; *stop error* — zaustavna pogreška *(check)*;
*boot-start driver* — upravljački program za pokretanje *(check)*; *hive* — košnica (registry hive) *(check)*.

Tests: W-T1…W-T3 first, W1…W10 per rule (`sim.test.js`, "the Windows chain"). Each rule was broken once (14 mutations of
`sim.js`: break key, bad facts, facts dropped, `{var}` in `t` keys, the sub list, each need moved, the driver state, the
ESP row, the sessions, the first process, the error code): every one fails a test. Every Windows preset rendered at its
key steps in hr and en at 1920×1080 and 375×812: one screen, no sideways scroll, no console errors.

Time: 2026-11-04 20:11 to 20:35, about 25 minutes.

## Checks

- `node --test sims/lnx-boot-chain/sim.test.js`: tie-breaks first (T1 first stage wins with a made-up chain where two
  stages need the same thing, T2 a break no stage has, T3 two causes one symptom, T4 idempotent after a stop, T5 the
  target param only touches the last stage, T6 `changed`), one or more per rule, the presets' steps and ends read from
  the page, the time numbers, then the template's generic block and a check that every string key the chain names
  exists in both tables.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; checked the numbers against
  the book; ran 50 mutations of `sim.js`, 15 survived, one of them equivalent; rendered every preset in both languages
  at 1920×1080 and 375×812, no console errors). Fixed from it: tests for the 14 real survivors (the target param at step
  6, graphical `targetAt`, the rescue preset's times, `initial` taking the chosen chain, the console of each moment, the
  book's values pinned as literals, the two emergency screens told apart, the graphical end screen); all 16 re-run
  mutations now fail. The explanation now says a *required* unit stops the target (a merely wanted one does not); no
  invented total; firmware stop described rather than a BIOS message; kernel version cited from ch13/ch16; the card's
  red mark on the wrong row and no early answer; captions take 8.130/26.504 from the state; per-chain caption keys;
  Croatian wording (`retke`, no sentence starting with a lowercase glossary term, `capPowerOn`, `capDone_loader` "koji
  imenuje pravi korijen", `capDone_initramfs`, `capFail_diskDriver`, `capDone_targetOther`, `breakHint`, aspect in the
  explanation; hr and en explanations now say the same). Left as it is: PID 1 shows `systemd` from step 4 while box 5
  still waits — that is the point of rule 5 (the same PID 1 later runs on the real root), and the step-4 caption says so.
- `npm run gate -- lnx-boot-chain`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus every preset at its key step.

## Time

2026-10-22 16:51 to 17:20, about 30 minutes (including an 8-minute fresh review).
