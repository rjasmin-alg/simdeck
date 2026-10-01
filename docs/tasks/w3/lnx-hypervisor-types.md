# lnx-hypervisor-types: Type 1 vs type 2, containers vs VMs

| | |
|---|---|
| Task | `lnx-hypervisor-types` (wave 3, Linux) |
| Catalogue entry | `lnx-hypervisor-types` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-hypervisor-types/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `virtualization` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **where the kernel and the hypervisor sit**.

The student: compare stacks, click layers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/02-distribucije.md` § "Kako doći do sustava za vježbu" ("Što treba znati": definitions virtualni stroj, hipervizor, domaćin, gostujući sustav; bare metal vs hostirana virtualizacija; "Šire o temi") and Primjer 4 ("Koliko računala staje u jedno računalo")
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §1 Laboratorij, topic T01 ("KVM i libvirt — domene, spremišta, mreže") and §3 Kontejneri, topic T11 ("… zašto to nije virtualni stroj"); chapters not written yet
- NIST SP 800-125, K. Scarfone, M. Souppaya, P. Hoffman, "Guide to Security for Full Virtualization Technologies" (cited in UL ch02 as [18]: VM, hypervisor, forms of full virtualisation; facts 1–2)
- Linux kernel documentation "KVM" (Documentation/virt/kvm/); libvirt documentation "Domain XML format" (fact 4: guest = QEMU process, `qemu-kvm` in `ps`); namespaces(7) (fact 5); Xen dom0 / Hyper-V parent partition (fact 7); UL ch02 Primjer 4 uses VirtualBox and a Rocky Linux guest (preset 1)
- Catalogue seed: NLA T01, T07 (T07 is network namespaces; the container contrast is T11)

## Model and presets

- **Scene:** four layer stacks side by side on one screen, bottom to top: (a) **bare metal / type 1**:
  hardware → hypervisor → VM 1 (guest kernel → apps), VM 2 (guest kernel → apps); (b) **hosted / type 2**:
  hardware → host OS kernel → host apps and a desktop hypervisor app → VMs with guest kernels; (c) **kernel-based hypervisor**:
  hardware → Linux kernel with the `kvm` module (the kernel is the hypervisor) → one emulator process per
  VM → guest kernel → apps; (d) **containers**: hardware → host Linux kernel → container processes (no
  guest kernel), with namespaces and cgroups drawn as fences between them. Each layer is a clickable block.
- **State:** `{ stacks: ['type1','type2','kernel','containers'], selected: {stack, layer} | null,
  compare: [stackA, stackB], answer }` — a reference page; state only records what is selected.
- **What clicking does:** selecting a layer highlights it and fills an info panel: what it is, which
  kernel runs there, what boundary isolates it from its neighbour, and what `uname -r` prints in an app at
  that position. A compare toggle dims all but two stacks.
- **Facts shown (one per layer, each with its source):**
  1. A virtual machine is a simulated environment; the hypervisor manages guests on a host and mediates
     their instruction flow to CPU, disk, memory and NICs (UL ch02 § "Kako doći do sustava za vježbu",
     definitions virtualni stroj, hipervizor; Sources).
  2. Bare metal: the hypervisor runs directly on hardware, no host OS. Hosted: the hypervisor runs on top of a
     host OS (Windows, Linux, macOS) (UL ch02, same section, "forms of full
     virtualization").
  3. Every VM runs its own guest kernel, so a VM can run a different OS than the host (UL ch02: guest sees a
     CPU, disk and NIC that are not the host's physical devices).
  4. The `kvm` module turns the Linux kernel into the hypervisor; each guest is a normal emulator process on
     the host, visible in `ps` — classed as type 1 by most sources; draw it as its own stack and say that the type 1/2 line is blurred here
     *(check wording)*.
  5. Containers share the host kernel: one kernel for all; `uname -r` inside prints the host's version; a
     Linux host cannot run a Windows container natively (NLA toc T11 "zašto to nije virtualni stroj").
  6. Isolation boundary: VM ↔ VM is the hypervisor (hardware virtualisation, separate kernels); container ↔
     container is the kernel's namespaces and cgroups (`lnx-namespaces`, `lnx-cgroups`); a kernel bug is a
     shared risk for containers, not for VMs (derived).
  7. Kernel count: type 1 with 2 VMs → 2 guest kernels (+ a management OS, the parent or control
     partition, on some type 1 hypervisors);
     type 2 with 2 VMs → 1 host + 2 guest = 3; kernel-based with 2 VMs → 3; containers with 2 containers → 1
     (derived).
- **Params:** `choice` `compare` = `all` | `vm-vs-container` | `type1-vs-type2` | `kernel` (default `all`);
  `range` `guests` 1–3 (default 2) to redraw the number of VMs/containers and the kernel count.
- **Presets:**
  1. `book` (default): type 1 vs type 2 as in UL ch02 — the student laptop case: a desktop hypervisor on the host OS, a Linux
     guest with 2 GB of the laptop's 8 GB (UL ch02 Primjer 4). From UL ch02.
  2. `vm-vs-container`: kernel-based stack with 2 VMs vs containers stack with 2 containers; kernel count 3 vs 1;
     `uname -r` in a container = host kernel. Derived.
  3. `kernel-hypervisor`: the kernel-based stack selected, the `kvm` module and an emulator process
     highlighted; `ps` shows one emulator process per guest. Derived.
  4. `windows-guest`: Windows guest in a VM on the kernel-based stack works; Windows container on a Linux host does not (no
     Windows kernel). Derived.
- **Steps:** 0 (reference page; presets set selection and compare).
- **Legend:** hardware (dark band), hypervisor (thick outline + "H"), kernel (striped block + "K"), app
  (plain), isolation boundary (double line). "Changed" outlines the layer just selected and its info row.
- **Captions:**
  - hr: "Kod hostirane virtualizacije *hypervisor* (hipervizor) radi povrh domaćinskog sustava; svaki gost ima svoju jezgru."
  - en: "In hosted virtualisation the hypervisor runs on top of the host OS; every guest has its own kernel."
  - hr: "Dva kontejnera, jedna jezgra: `uname -r` u kontejneru ispisuje jezgru domaćina."
  - en: "Two containers, one kernel: uname -r inside a container prints the host's kernel."
- **Terms:** virtual machine — virtualni stroj; hypervisor — hipervizor; host — domaćin; guest — gostujući
  sustav; disk image — slika diska / slika sustava (all UL ch02); kernel — jezgra (UL ch10); container —
  kontejner (NLA T11).
- **Misconceptions:** a container is a lightweight VM with its own kernel; type 2 means "slow toy" (UL ch02:
  the difference is where the hypervisor sits, not the idea); a kernel-based hypervisor is just another desktop
  hypervisor app.
- **Out of scope:** paravirtualisation and virtio details, nested virtualisation, Popek–Goldberg criteria,
  performance numbers, live migration (`lnx-live-migration`), libvirt networks and pools (rest of T01).
- **Note for the coordinator:** NLA T01 is KVM/libvirt operations; the type 1/2 concept is in UL ch02 and the
  VM-vs-container contrast in NLA T11. Sources now cite both. The concept is close to a poster
  (catalogue §4.11 reference posters); fine as `ref`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-hypervisor-types sims/lnx-hypervisor-types` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-hypervisor-types/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
