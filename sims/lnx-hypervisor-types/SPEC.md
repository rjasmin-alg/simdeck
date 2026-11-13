<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-hypervisor-types: where the kernel and the hypervisor sit (spec)

A reference page (no steps). Four layer stacks side by side, bottom to top; every layer is a clickable block. Clicking
a layer fills a card: what it is, which kernel runs there, what isolates it from its neighbour, and what `uname -r`
prints in a program at that position. A compare choice dims all but two stacks. The state is derived from the params
only; it records what is selected and what is dimmed. Task: `docs/tasks/w3/lnx-hypervisor-types.md`.

Sources, short names used below:

- **UL ch02**: *Uvod u Linux*, ch. 02, § "Kako doći do sustava za vježbu" ("Što treba znati": definitions *virtualni
  stroj*, *hipervizor*, *domaćin*, *gostujući sustav*; the two forms of full virtualisation; "Šire o temi") and
  Primjer 4 ("Koliko računala staje u jedno računalo"). Both footnotes quote NIST SP 800-125 [18].
- **NIST**: K. Scarfone, M. Souppaya, P. Hoffman, *Guide to Security for Full Virtualization Technologies*, NIST SP
  800-125 (as quoted in UL ch02's footnotes `ch2-nist-vm`, `ch2-nist-forms`).
- **NLA T01 / T11**: *Napredna Linux administracija*, `meta/toc.md`: T01 "KVM i libvirt — domene, spremišta, mreže",
  T11 "Što kontejner jest — imenski prostori, cgroups, sposobnosti; zašto to nije virtualni stroj" (chapters not yet
  written).
- **KVM doc**: Linux kernel documentation, Documentation/virt/kvm/ (the `kvm` module); **libvirt**: "Domain XML
  format" (a KVM guest runs as one emulator process on the host); **namespaces(7)**. Read for the builder; not
  re-read in this session *(check)*.
- **derived**: follows from the rules above; no single source states it.

## 1. The stacks (the data)

Stack ids, in screen order: `type1`, `type2`, `kernel`, `containers`. `g` = the `guests` param (1–3). Layer ids are
the kind, with the guest number for per-guest layers (`gk2`, `ctr1`). Every layer stands on exactly one layer
(`on`), so each stack is a tree rooted at the hardware.

| Stack | Layers, bottom to top (`on` in brackets) | Source |
|---|---|---|
| `type1` bare metal | `hw`; `hv` (hw); for i = 1…g: `gk<i>` (hv), `app<i>` (gk<i>) | UL ch02, NIST "bare metal" |
| `type2` hosted | `hw`; `hostk` (hw); `hostapp` (hostk); `dhv` (hostk); for i: `gk<i>` (dhv), `app<i>` (gk<i>) | UL ch02, NIST "hosted" |
| `kernel` kernel-based | `hw`; `kvmk` (hw); for i: `emu<i>` (kvmk), `gk<i>` (emu<i>), `app<i>` (gk<i>) | KVM doc, libvirt; NLA T01 |
| `containers` | `hw`; `ctrk` (hw); for i: `ctr<i>` (ctrk) | namespaces(7); NLA T11 |

Kinds: `hw` hardware; `hv` bare-metal hypervisor; `hostk` host OS kernel; `kvmk` Linux kernel with the `kvm`
module (the kernel is the hypervisor); `ctrk` host Linux kernel with namespaces and cgroups; `hostapp` host
programs; `dhv` desktop hypervisor (a program on the host OS); `emu` emulator process (one per VM, a host process);
`gk` guest kernel; `app` programs in a VM; `ctr` a container (a group of host processes).

Marks (legend): hardware is a dark band; **hypervisor** kinds `hv`, `dhv`, `kvmk` get a thick outline and "H";
**kernel** kinds `hostk`, `kvmk`, `ctrk`, `gk` get a striped edge and "K" (`kvmk` gets both). Each VM's `gk<i>` and
`app<i>` sit in a double-lined frame (the VM); each `ctr<i>` is a double-lined frame with no kernel inside.

`win` (the Windows case, preset 4): the **last** guest (i = g) runs Windows. On the VM stacks its `gk<g>` and
`app<g>` have `os: 'windows'` (an `emu<i>` is a host process and has no `os`); on `containers`, `ctr<g>` is a Windows container that is **rejected** (it cannot
start: there is no Windows kernel to share). Every other guest has `os: 'linux'`.

## 2. Rules

1. **VM and hypervisor** (UL ch02, NIST): a VM is a simulated environment; the hypervisor manages the guests on a
   host and mediates their instruction flow to CPU, disk, memory and NICs. Every VM stack has exactly one layer of a
   hypervisor kind (`hv`, `dhv` or `kvmk`), and every `gk<i>` stands on it or on its own `emu<i>` above it.
2. **Where the hypervisor sits** (UL ch02, NIST): `type1`: the hypervisor stands on `hw`, no host OS. `type2`: it
   stands on the host kernel (`dhv` on `hostk`), next to the host's own programs. The difference is where the
   hypervisor sits, not the idea (UL ch02, "Šire o temi"; misconception "type 2 = slow toy").
3. **Own kernel per VM** (UL ch02: the guest sees a CPU, disk and NIC that are not the host's): each VM has its own
   `gk<i>`; so a VM may run another OS than the host (`win`: a Windows guest works on every VM stack).
4. **Kernel-based hypervisor** (KVM doc, libvirt): in `kernel` the hypervisor is the host Linux kernel with the
   `kvm` module (`kvmk` is both a kernel and a hypervisor); each guest runs inside one ordinary emulator process
   `emu<i>`, which `ps` on the host lists: one per guest. Most sources class it as type 1; the type 1/2 line is
   blurred here, so it is its own stack *(check wording)*. Not "just another desktop hypervisor app": the hypervisor
   is the kernel, the emulator process only hosts one guest.
5. **Containers share the host kernel** (namespaces(7), NLA T11): `containers` has one kernel, `ctrk`; no `ctr<i>`
   has a kernel of its own. `uname -r` in a container prints the host kernel's version. A Windows container on a
   Linux host is rejected: no Windows kernel (with `win`).
6. **Isolation boundary** (derived from 1, 3, 5): VM ↔ VM is the hypervisor (separate kernels); container ↔
   container is the shared kernel's namespaces and cgroups (`lnx-namespaces`, `lnx-cgroups`). A kernel bug in a
   guest kernel stays in that VM; a bug in `ctrk` is a risk for every container on it.
7. **Kernel count** (derived): the number of layers of kind `hostk`, `kvmk`, `ctrk` or `gk`:
   `type1` = g, `type2` = g + 1, `kernel` = g + 1, `containers` = 1. `type1` also notes **+1** (`extra`): some type 1
   hypervisors run a management OS in a parent or control partition. The hypervisor `hv` itself is not counted as an
   OS kernel (the task's count: "type 1 with 2 VMs → 2 guest kernels").
8. **Which kernel serves a layer** (derived; the card's "kernel here" and `uname -r`):
   - `hw`: none. `hv`: none (the hypervisor itself; no program runs on it directly).
   - `hostk`, `kvmk`, `ctrk`: the host kernel itself. `hostapp`, `dhv`, `emu<i>`, `ctr<i>`: the host kernel.
   - `gk<i>`, `app<i>`: guest i's kernel.
   - a rejected `ctr<g>`: none.
   - risk (the card's "a kernel bug" row): `own` for `gk<i>`, `app<i>`; `shared` for `ctrk` and a running `ctr<i>`;
     none for every other layer, a rejected container included.
9. **`uname -r`** (derived from 8): the version of the kernel that serves the layer. Host `6.12.0`; guest i (Linux)
   `6.1.0`, `5.14.0`, `6.6.0` for i = 1, 2, 3: illustrative versions, each different from the host's, so the page
   shows that a VM's program prints its own kernel and a container's prints the host's. `null` with a reason where no
   Linux program runs: `no-app` (`hw`, `hv`), `windows` (a Windows guest: its own Windows kernel, no `uname`),
   `rejected` (the Windows container).
10. **Linked layers** (this page): selecting a kernel or hypervisor kind (`hv`, `hostk`, `kvmk`, `ctrk`, `dhv`,
    `gk<i>`) lights what stands directly on it, rejected layers left out; selecting `hostapp`, `emu<i>`, `app<i>` or
    `ctr<i>` lights the kernel layer that serves it (rule 8); `hw` lights nothing.
11. **Compare** (task): `all` dims nothing; `type1-vs-type2` keeps `type1`, `type2`; `vm-vs-container` keeps
    `kernel`, `containers`; `kernel` keeps `type2`, `kernel` (the kernel-based hypervisor next to the desktop one:
    both have a host Linux and a process per VM, but only one has the hypervisor in the kernel; misconception 3).
    The others are dimmed, still drawn and clickable.
12. **The laptop** (UL ch02 Primjer 4, `view: 'book'`): the `type2` stack is the student's laptop with 8 GB; each
    guest gets 2 GB (the text-install minimum); the host keeps 8 − 2·g GB.

## 3. Expected numbers (checked by `numbers.py`, an independent script, before coding)

| g | win | layers type1 / type2 / kernel / containers | kernels | running guests (containers) |
|---|---|---|---|---|
| 1 | no | 4 / 6 / 5 / 3 | 1 / 2 / 2 / 1 | 1 |
| 2 | no | 6 / 8 / 8 / 4 | **2 / 3 / 3 / 1** (fact 7) | 2 |
| 3 | no | 8 / 10 / 11 / 5 | 3 / 4 / 4 / 1 | 3 |
| 1 | yes | as g = 1 | as g = 1 | 0 |
| 2 | yes | as g = 2 | as g = 2 | 1 |
| 3 | yes | as g = 3 | as g = 3 | 2 |

`win` changes no kernel count: the rejected container never had a kernel, and a Windows guest still has one.
Laptop (g = 1, 2, 3): host keeps 6, 4, 2 GB of 8. `ps` on the `kernel` host: g emulator processes.

## 4. Params and presets

| Param | Type | Values | Default |
|---|---|---|---|
| `compare` | choice | `all`, `vm-vs-container`, `type1-vs-type2`, `kernel` | `all` |
| `guests` | range | 1–3 | 2 |
| `win` | toggle | last guest runs Windows | off |
| `sel` | hidden | `'<stack>:<layer>'` or `''` | `''` |
| `view` | hidden | `none`, `book` | `none` |

| # | Preset | Params | Shows |
|---|---|---|---|
| 1 | `book` (default) | compare `type1-vs-type2`, guests 1, view `book`, sel `type2:dhv` | the student laptop: a desktop hypervisor on the host OS, a Linux guest with 2 GB of 8 (UL ch02 Primjer 4) |
| 2 | `vm-vs-container` | compare `vm-vs-container`, guests 2, sel `containers:ctr1` | kernels 3 vs 1; `uname -r` in a container = host's |
| 3 | `kernel-hypervisor` | compare `kernel`, guests 2, sel `kernel:kvmk` | `kvmk` selected, the emulator processes lit; `ps` lists one per guest |
| 4 | `windows-guest` | compare `vm-vs-container`, guests 2, win on, sel `kernel:gk2` | a Windows guest works in a VM; a Windows container on Linux is rejected |

The page opens on the param defaults (all four stacks, two guests, nothing selected): the poster. `book` is preset 1,
key `1`, first in the list (the kit has no "default preset"; the task's param defaults are `all` and 2).

## 5. Tie-breaks

1. **Unknown or stale selection is none**: a `sel` that names no layer of the current stacks (unknown stack, unknown
   kind, a guest number above `guests`, an own property name like `constructor`) gives `selected: null`, no card, no
   lit layers. It is not an error.
2. **Rejected layers are selectable** (the card says why it cannot run) but are never lit and never counted as
   running.
3. **A selection in a dimmed stack stays**: compare dims; it does not clear the selection.
4. **Unknown `compare`** is `all`; `guests` is rounded to the nearest whole number (2.4 → 2, 2.6 → 3) and clamped to
   1–3; anything that is not a finite number (`null`, `''`, `true`, `'x'`) gives the default 2.
5. **Order**: stacks always in screen order; layers in tree order (bottom first, then left to right, depth first);
   lit lists in layer order.

## 6. Out of scope

Paravirtualisation and virtio, nested virtualisation, Popek–Goldberg criteria, performance numbers, live migration
(`lnx-live-migration`), libvirt networks and pools, how namespaces and cgroups work inside (`lnx-namespaces`,
`lnx-cgroups`), real `ps` output and process names.
