<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-hypervisor-types: notes

Task `docs/tasks/w3/lnx-hypervisor-types.md` (wave 3, Linux, reference, S, P3, NLA). Rules and numbers: `SPEC.md`.

## What it is

A reference page (no steps): four layer stacks side by side on one hardware line: bare metal (type 1), hosted
(type 2), kernel-based (the kernel is the hypervisor, KVM) and containers. Every layer is a button. Clicking one
selects it (yellow, ink outline), lights its linked layers (blue dashed outline: what stands on a kernel, or the
kernel that serves a program) and fills a card: what it is, which kernel runs there, what isolates it, what
`uname -r` prints there, and where it applies the `ps` list (kernel-based), the kernel-bug reach (VM vs container)
and the laptop's memory (book view). Each stack's foot counts its kernels with one K per kernel. A compare choice
dims all but two stacks; `guests` (1–3) redraws the VMs and containers; `win` makes the last guest Windows.

## Decisions

- **Stacks as trees.** Each layer stands on exactly one layer (`on`); the page draws a node with what stands on it
  above. Column widths are one share per leaf, so a VM column is equally wide in every stack and the hardware bands
  line up at the bottom: the height of each stack shows how many layers sit between a program and the hardware.
- **Kernel count** (fact 7) counts layers of kind `hostk`, `kvmk`, `ctrk`, `gk`. The bare-metal hypervisor is not
  counted as an OS kernel, as in the task ("type 1 with 2 VMs → 2 guest kernels"); type 1's foot says "+1 management
  OS on some" and the hypervisor's card explains the parent or control partition, without naming a product.
- **`compare: 'kernel'` keeps `type2` and `kernel`**: the task names the option but not its pair. Placing the
  kernel-based hypervisor next to the desktop one answers misconception 3 ("just another desktop hypervisor app"):
  both hosts are ordinary systems, only one has the hypervisor in the kernel. The option reads "app vs kernel".
- **`uname -r` versions are illustrative**: host `6.12.0`, guests `6.1.0`, `5.14.0`, `6.6.0` (each different from
  the host's, so the contrast shows). No distribution suffixes; no product is implied.
- **Windows.** The task's preset 4 needs a Windows guest and a Windows container; the model has a `win` toggle (the
  last guest runs Windows), shown in the panel so the lecturer can flip it live. On VM stacks the guest gets a Windows
  kernel (works; `uname -r` "nothing: Windows has no uname"); on containers the last container is drawn rejected
  (dashed frame, ✕, red text) and is not counted as running. Naming Windows is allowed: the concept depends on it.
- **The emulator process** is drawn under each VM frame in the kernel-based stack (a host process, served by the host
  kernel, its `uname -r` is the host's). `ps` is not shown as real output (no fake PIDs or process names): the card
  lists one "emulator process · VM i" per guest. QEMU is not named (not a course topic; COMMON §1); KVM and the `kvm`
  module are (NLA T01).
- **The laptop** (preset 1, UL ch02 Primjer 4) is a hidden `view: 'book'` param: the hosted stack's hardware says
  8 GB, each VM frame 2 GB, the host programs "host keeps 6 GB", and the card a memory line. With more guests the host
  keeps 8 − 2·g.
- **Selection** lives in a hidden `sel` param (`'<stack>:<layer>'`), as `linux-dirs` does, so it is in the URL and a
  preset can set it; a click keeps the active preset (its caption shows while the selection is the preset's own).
- **Captions**: the preset's caption while its selection stands (the task's two captions are presets 1 and 2), else
  the selected layer's one-line takeaway, else the compare mode's line with the kernel counts.
- **Three guests** switch the stage to a compact mode (16 px block labels, thinner frames) so "Programs" and
  "Processes" fit in a column at 1920×1080.
- **Phone**: one stack per row.

## Deviations from the task

- **State shape**: the task's `{ stacks, selected, compare, answer }` became `{ stacks, selected, compare, mode, info,
  lit, guests, win, view, laptop }`. `answer` is the card's data, named `info`; the rest is what the page draws.
- **Opening view**: the task calls preset 1 `book` "default", but the kit has no default preset and the task's param
  defaults are `all` and 2 guests. The page opens on those defaults (all four stacks, nothing selected, the "click a
  layer" card); `book` is preset 1, key `1`.
- **Extra param `win`** (toggle) for preset 4; the task lists only `compare` and `guests`.
- **Rejected container's boundary** is "nothing: it does not start" rather than namespaces and cgroups.

## Sources

- *Uvod u Linux*, ch. 02 (`~/projects/uvod-u-linux/book/chapters/02-distribucije.md`), § "Kako doći do sustava za
  vježbu": definitions *virtualni stroj*, *hipervizor*, *domaćin*, *gostujući sustav*; the two forms of full
  virtualisation (bare metal, hosted; footnote `ch2-nist-forms`); "the guest sees a CPU, disk and NIC that are not the
  host's"; "Šire o temi": the difference is where the hypervisor sits, not the idea; Primjer 4: 8 GB laptop, 2 GB
  guest, the host keeps 6 GB. Read in this session.
- NIST SP 800-125, Scarfone, Souppaya, Hoffman, *Guide to Security for Full Virtualization Technologies*, as quoted in
  UL ch02's footnotes `ch2-nist-vm` and `ch2-nist-forms` (facts 1–2). Read through the book's quotes only *(check)*.
- *Napredna Linux administracija*, `meta/toc.md`: T01 "KVM i libvirt", T07 network namespaces, T11 "Što kontejner
  jest … zašto to nije virtualni stroj". Read in this session; chapters not yet written.
- Linux kernel documentation, Documentation/virt/kvm/ (the `kvm` module makes the kernel the hypervisor); libvirt
  "Domain XML format" (a KVM guest is one emulator process on the host, visible in `ps`); namespaces(7) (containers
  share the host kernel). From the task file; not re-read in this session (no network) *(check)*.
- "Most sources class kernel-based as type 1; the type 1/2 line is blurred here": the task's wording, marked *(check
  wording)* there; kept as written on the page *(check)*.
- "The kvm module gives each guest a virtual CPU and memory; the emulator process emulates its devices" (cards of
  `kvmk` and `emu`): from general knowledge of the KVM split, not from a source read here *(check)*.
- Management OS in a parent or control partition on some type 1 hypervisors (fact 7): from the task (Xen dom0,
  Hyper-V parent partition); written generically on the page *(check)*.

## Term pairs

From the glossary: *virtual machine* (virtualni stroj), *hypervisor* (hipervizor), *host* (domaćin), *guest*
(gostujući sustav), *kernel* (jezgra). Missing from `kit/glossary.js`, written out in both tables (as in
`lnx-namespaces`, `lnx-cgroups`):

| en | hr | source |
|---|---|---|
| container | kontejner | NLA T11 |
| namespace | imenski prostor | NLA T07, T11 |
| control group (cgroup) | kontrolna grupa *(check: NLA T11 writes `cgroups`)* | as in `lnx-cgroups` |
| bare metal (virtualisation) | *bare metal* virtualizacija | UL ch02 (kept in English in italics) |
| hosted (virtualisation) | hostirana virtualizacija | UL ch02 |
| desktop hypervisor | hipervizor kao program | this sim *(check)* |
| emulator process | proces emulatora | this sim *(check)* |
| management OS (parent / control partition) | upravljački OS (roditeljska / upravljačka particija) | this sim *(check)* |

## Shared requests

None. The page draws with plain HTML blocks; no kit view fits a layer stack (K3 block grid is rows of cells, not a
tree). If more layer-stack posters come (catalogue §4.11), a "layer stack" view could be extracted from this page.

## Checks

- `node --test sims/lnx-hypervisor-types/sim.test.js`: 27 tests (tie-breaks, rules 1–12, numbers, generic block).
- Mutation run, author: 25 mutations, one per rule and tie-break (selection parsing, stale guest, rejected lit and
  running, dim, clamp, default, order, where the hosted hypervisor stands, Windows on one guest only, emulator served by
  the host, `ps` only on the kernel-based stack, containers without a kernel, rejected only for containers, boundaries,
  risk, kernel count and +1, serving kernel, `uname -r` versions, Windows `uname`, linked layers, compare pair, laptop
  memory, rejected boundary); every one fails at least one test.
- Fresh review (a separate agent, playbook §7.4): read the diff against SPEC.md and the task; no factual errors, no
  product names. Of its 20 mutations, 7 got through the tests then: a rejected container still "shared" in the card,
  the selection or its links leaking into the other stacks with the same layer ids, a Windows guest's emulator process
  carrying `os: 'windows'` (latent: only the check order kept its `uname -r` right), `risk` on host-side layers,
  `kernelGuest` on host-served layers, and `Math.floor` for `guests`. Fixed: the emulator process has no `os`; tests
  added for each; SPEC.md tie-break 4 now states rounding and what "not a number" means (`null`, `''`, `true` gave 1
  before, now 2). Re-run with all 34 mutations: 33 caught; the one left (Windows check before the host check in
  `unameAt`) is now equivalent, since no host-served layer has a guest OS. Wording fixes from the same review: `kh_hv`
  (the hypervisor runs on the hardware, not "drives" it, given the management-OS note), the hosted host is Linux
  here (so `uname -r` prints), the desktop hypervisor "usually with a helper driver in the host kernel", Croatian
  locative "u VM-u {i}", compare labels "ili" instead of ":", "u malom", "the one container".
- Expected numbers checked first with an independent script (`numbers.py`, scratch; the table is in SPEC.md §3).
- `npm run gate -- lnx-hypervisor-types`: see the report for the final run.
- Screenshots reviewed: 1920×1080 light, dark, grayscale and 375×812 in hr and en (gate); each preset and the edge
  cases (3 guests, 1 guest with Windows) at 1920×1080 by a page script, no page scroll, console clean.

## Time

Start 2026-11-13 02:35 (CET); end recorded in the report.
