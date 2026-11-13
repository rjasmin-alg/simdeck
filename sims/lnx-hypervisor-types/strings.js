/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of "where the kernel and the hypervisor sit", in both languages (docs/sim-ui.md §9).
   Same keys in hr and en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term (first mention). Key prefixes: s_/sh_ stack title and subtitle; b_ block label; n_ card
   name; w_ what it is; k_ the caption's one-line takeaway; bd_ boundary; kh_ kernel here; un_ why uname -r prints
   nothing; cmp_/cap_ compare choice and its caption. Terms missing from kit/glossary.js are written out (NOTES.md). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stogovi slojeva',
      compare: 'Usporedi',
      'cmp_all': 'sva četiri',
      'cmp_vm-vs-container': 'VM ili kontejner',
      'cmp_type1-vs-type2': 'tip 1 ili tip 2',
      'cmp_kernel': 'program ili jezgra',
      guests: 'Gosti (VM-ovi, kontejneri)',
      win: 'Zadnji gost: Windows',
      winHint: 'VM ga pokreće, kontejner na Linuxu ne.',

      pBook: 'Knjiga: tip 1 i tip 2',
      pBookHint: 'Prijenosno računalo od 8 GB, gost s 2 GB (Uvod u Linux, pogl. 2, Primjer 4)',
      pVmCtr: 'VM ili kontejner',
      pVmCtrHint: '3 jezgre prema 1; uname -r u kontejneru',
      pKernel: 'Jezgra kao hipervizor',
      pKernelHint: 'modul kvm i po jedan proces emulatora za svakog gosta',
      pWin: 'Gost s Windowsima',
      pWinHint: 'U VM-u radi, kao kontejner na Linuxu ne',

      legHw: 'sklopovlje',
      legHv: 'hipervizor (H)',
      legK: 'jezgra (K)',
      legApp: 'programi',
      legBoundary: 'granica izolacije',
      legChanged: 'odabrani sloj',
      legLinked: 'povezani sloj',
      badgeH: 'H',
      badgeK: 'K',

      's_type1': 'Tip 1: bare metal',
      's_type2': 'Tip 2: hostirana',
      's_kernel': 'Hipervizor u jezgri',
      's_containers': 'Kontejneri',
      'sh_type1': 'hipervizor na sklopovlju',
      'sh_type2': 'hipervizor na sustavu domaćina',
      'sh_kernel': 'jezgra je hipervizor (KVM)',
      'sh_containers': 'jedna jezgra za sve',
      kernelsN: ['{n} jezgra', '{n} jezgre', '{n} jezgri'],
      kernelsExtra: '+1 upravljački OS kod nekih',

      'b_hw': 'Sklopovlje',
      'b_hv': 'Hipervizor',
      'b_hostk': 'Jezgra domaćina',
      'b_kvmk': 'Jezgra Linuxa + kvm',
      'b_ctrk': 'Jezgra Linuxa',
      b_ctrkSub: 'imenski prostori · cgroups',
      'b_hostapp': 'Programi domaćina',
      'b_dhv': 'Hipervizor (program)',
      'b_emu': 'Proces emulatora',
      'b_gk': 'Jezgra',
      b_gkWin: 'Jezgra Windowsa',
      'b_app': 'Programi',
      'b_ctr': 'Procesi',
      vmN: 'VM {i}',
      ctrN: 'Kontejner {i}',
      ctrWin: 'Windows kontejner',
      rejected: '✕ nema jezgre Windowsa',
      memHw: '{n} GB memorije',
      memVm: '{n} GB',
      memHost: 'domaćinu ostaje {n} GB',

      'n_hw': 'Sklopovlje',
      'n_hv': 'Hipervizor na sklopovlju',
      'n_hostk': 'Jezgra domaćina',
      'n_kvmk': 'Jezgra Linuxa s modulom kvm',
      'n_ctrk': 'Jezgra domaćina (Linux)',
      'n_hostapp': 'Programi domaćina',
      'n_dhv': 'Hipervizor kao program',
      'n_emu': 'Proces emulatora · VM {i}',
      'n_gk': 'Jezgra gosta · VM {i}',
      'n_app': 'Programi · VM {i}',
      'n_ctr': 'Kontejner {i}',
      layerLabel: '{name}, {stack}',

      'w_hw': 'Fizičko računalo: procesor, memorija, disk i mrežne kartice.',
      'w_hv': 'Hipervizor koji radi izravno na sklopovlju, bez domaćinskog operacijskog sustava. Upravlja gostima i nadzire tok ' +
        'njihovih instrukcija prema sklopovlju.',
      'w_hostk': 'Jezgra običnog operacijskog sustava domaćina (Windows, Linux, macOS; ovdje Linux, pa uname -r radi). ' +
        'Hipervizor se u taj sustav instalira kao program.',
      'w_kvmk': 'Jezgra Linuxa s učitanim modulom kvm: sama jezgra postaje hipervizor. Većina izvora to svrstava u tip 1, ali ' +
        'domaćin je i dalje običan Linux, pa granica tipa 1 i 2 ovdje nije oštra.',
      'w_ctrk': 'Jedina jezgra na ovom stogu. Svi kontejneri pozivaju nju, a ona ih imenskim prostorima i kontrolnim grupama ' +
        'odvaja jedne od drugih.',
      'w_hostapp': 'Preglednik i sve ostalo što na domaćinu radi uz hipervizor.',
      'w_dhv': 'Hipervizor kao program na sustavu domaćina, uz ostale programe (obično s pomoćnim upravljačkim programom u ' +
        'jezgri domaćina). Od tipa 1 razlikuje se po tome gdje stoji, a ne po zamisli.',
      'w_emu': 'Običan proces na domaćinu, jedan po VM-u, vidljiv u ps. U njemu radi gost: proces mu oponaša uređaje, a ' +
        'procesor i memoriju daje mu jezgra s modulom kvm.',
      'w_gk': 'Vlastita jezgra ovog VM-a. Gost vidi procesor, disk i mrežnu karticu, ali nijedno od toga nije fizički uređaj ' +
        'domaćina, pa u VM-u može raditi i drugi operacijski sustav.',
      'w_app': 'Programi u gostu. Pozivaju jezgru svog gosta, ne domaćinovu.',
      'w_ctr': 'Skupina običnih procesa domaćina u vlastitim imenskim prostorima. Nema svoju jezgru: poziva jezgru domaćina.',
      w_ctrWin: 'Kontejner s programima za Windows trebao bi jezgru Windowsa, a jedina jezgra ovdje je Linux. Na domaćinu s ' +
        'Linuxom ne može se pokrenuti izravno.',

      cardHint: 'Klikni sloj: što je, koja jezgra ondje radi, što ga odvaja od susjeda i što ondje ispisuje uname -r.',
      cKernel: 'Jezgra ovdje',
      cBoundary: 'Što ga odvaja',
      cUname: 'uname -r',
      cPs: 'ps na domaćinu',
      cRisk: 'Greška u jezgri',
      cMem: 'Memorija',
      cExtra: 'Neki hipervizori tipa 1 imaju i upravljački OS u roditeljskoj ili upravljačkoj particiji: tada je jezgri jedna više.',
      'kh_none': 'nijedna: ispod svih jezgri',
      'kh_hv': 'nijedna opća jezgra: hipervizor radi izravno na sklopovlju',
      'kh_host': 'jezgra domaćina, {v}',
      'kh_guest': 'jezgra gosta u VM-u {i}, {v}',
      kh_guestWin: 'jezgra Windowsa u VM-u {i}',
      kh_rejected: 'nijedna: jezgra domaćina je Linux, a jezgre Windowsa nema',
      'un_no-app': 'ništa: ondje ne radi nijedan program',
      'un_windows': 'ništa: Windows nema uname; gost ima vlastitu jezgru Windowsa',
      'un_rejected': 'ništa: kontejner se ne može pokrenuti',
      psRow: 'proces emulatora · VM {i}',
      riskOwn: 'ostaje u ovom VM-u',
      riskShared: ['pogađa jedini kontejner na ovoj jezgri ({n})', 'pogađa svaki od {n} kontejnera na ovoj jezgri', 'pogađa svaki od {n} kontejnera na ovoj jezgri'],
      memLine: '{total} GB ukupno, {guest} GB svakom gostu, domaćinu ostaje {host} GB',

      'bd_none': 'Ispod njega nema ničega; svi slojevi iznad dijele isto fizičko računalo.',
      'bd_hv-is': 'On je granica: svaki VM vidi samo svoj procesor, disk i mrežnu karticu, a instrukcije prema sklopovlju idu ' +
        'kroz njega.',
      'bd_host-kernel': 'Odvaja procese domaćina jedne od drugih; virtualne strojeve odvaja hipervizor iznad nje.',
      'bd_kvm-is': 'Ona je granica između VM-ova: modul kvm svakom gostu daje zaseban virtualni procesor i memoriju.',
      'bd_ns-cgroups-owner': 'Njezini imenski prostori i kontrolne grupe ograđuju kontejnere: svaki vidi samo svoje i troši ' +
        'samo koliko mu se dopusti.',
      'bd_process': 'Obična izolacija procesa: odvaja ih jezgra domaćina.',
      'bd_process-hv': 'Program domaćina; virtualne strojeve u sebi odvaja on sam.',
      'bd_process-emu': 'Običan proces domaćina, jedan po VM-u; gosta u njemu odvaja jezgra s modulom kvm.',
      'bd_hypervisor': 'Hipervizor: drugi VM-ovi imaju svoje jezgre, pa greška u ovoj jezgri ostaje u ovom VM-u.',
      'bd_guest-kernel': 'Od drugih programa u istom VM-u odvaja ga jezgra gosta, a od drugih VM-ova hipervizor.',
      'bd_ns-cgroups': 'Imenski prostori i kontrolne grupe jezgre domaćina: ograda, a ne zasebna jezgra.',
      'bd_rejected': 'Ništa: kontejner se ne pokreće, pa nema što ograditi.',

      'cap_all': 'Gdje sjede jezgra i hipervizor: klikni bilo koji sloj. Broj jezgri: {a}, {b}, {c} i {d}.',
      'cap_type1-vs-type2': 'Tip 1 stoji na sklopovlju, tip 2 na sustavu domaćina; razlika je gdje hipervizor stoji, a ne zamisao.',
      'cap_vm-vs-container': 'VM-ovi: {a} jezgre, domaćinova i po jedna za svakog gosta; kontejneri: samo jedna, domaćinova.',
      'cap_kernel': 'Lijevo je hipervizor program na domaćinu; desno je hipervizor sama jezgra, a svaki gost običan proces.',
      capBook: 'Kod hostirane virtualizacije [[hypervisor]] radi povrh domaćinskog sustava; svaki gost ima svoju jezgru.',
      capLaptop: 'Prijenosno računalo od {total} GB: svakom gostu {guest} GB, domaćinu ostaje {host} GB.',
      capVmCtr: ['{n} kontejner, jedna jezgra: uname -r u kontejneru ispisuje jezgru domaćina.',
        '{n} kontejnera, jedna jezgra: uname -r u kontejneru ispisuje jezgru domaćina.',
        '{n} kontejnera, jedna jezgra: uname -r u kontejneru ispisuje jezgru domaćina.'],
      capKernel: ['Jezgra s modulom kvm je hipervizor; ps na domaćinu pokazuje {n} proces emulatora, po jedan za svakog gosta.',
        'Jezgra s modulom kvm je hipervizor; ps na domaćinu pokazuje {n} procesa emulatora, po jedan za svakog gosta.',
        'Jezgra s modulom kvm je hipervizor; ps na domaćinu pokazuje {n} procesa emulatora, po jedan za svakog gosta.'],
      capWin: 'Gost s Windowsima radi u VM-u jer donosi svoju jezgru; kontejner za Windows na domaćinu s Linuxom ne može se ' +
        'pokrenuti: nema jezgre Windowsa.',
      capSel: '{name} ({stack}): ',
      'k_hw': 'ispod svih jezgri; ovdje ne radi nijedan program.',
      'k_hv': 'stoji izravno na sklopovlju, bez sustava domaćina.',
      'k_hostk': 'jezgra domaćina; hipervizor radi povrh nje kao program.',
      'k_kvmk': 'jezgra je hipervizor, a svaki gost je proces na njoj.',
      'k_ctrk': ['jedna jezgra za {n} kontejner.', 'jedna jezgra za {n} kontejnera.', 'jedna jezgra za {n} kontejnera.'],
      'k_hostapp': 'obični programi domaćina; uname -r ispisuje {v}.',
      'k_dhv': 'hipervizor je ovdje program na domaćinu.',
      'k_emu': 'običan proces domaćina; uname -r u njemu ispisuje {v}, jezgru domaćina.',
      'k_gk': 'vlastita jezgra ovog VM-a; uname -r u njemu ispisuje {v}.',
      k_gkWin: 'vlastita jezgra ovog VM-a, i to jezgra Windowsa: drugi OS radi jer gost donosi svoju jezgru.',
      'k_app': 'uname -r ispisuje {v}, jezgru gosta, a ne domaćina.',
      k_appWin: 'programi gosta s Windowsima pozivaju jezgru Windowsa u svom VM-u.',
      'k_ctr': 'nema svoju jezgru; uname -r ispisuje {v}, jezgru domaćina.',
      k_ctrWin: 'ne može se pokrenuti: domaćin s Linuxom nema jezgru Windowsa.',

      explain: '<p>Jedno pitanje: gdje sjedi [[kernel]], a gdje [[hypervisor]]. [[virtual machine]] je simulirana okolina u ' +
        'kojoj radi drugi softver; hipervizor upravlja gostima i nadzire tok njihovih instrukcija prema procesoru, disku, ' +
        'memoriji i mrežnim karticama. Računalo na kojem se to događa je [[host]], a sustav u virtualnom stroju je ' +
        '[[guest]].</p>' +
        '<p><b>Tip 1 i tip 2.</b> Kod <em lang="en">bare metal</em> virtualizacije hipervizor radi izravno na sklopovlju, bez ' +
        'sustava domaćina. Kod hostirane (<em lang="en">hosted</em>) virtualizacije radi povrh sustava domaćina, kao program. ' +
        'Razlika je gdje hipervizor stoji, a ne zamisao: vježba u VM-u na prijenosnom računalu isti je posao u malom. Svaki VM ' +
        'ima svoju jezgru, pa u njemu može raditi i drugi operacijski sustav.</p>' +
        '<p><b>Jezgra kao hipervizor.</b> S modulom kvm sama jezgra Linuxa postaje hipervizor, a svaki gost radi u običnom ' +
        'procesu emulatora koji se vidi u <code>ps</code>. Većina izvora to svrstava u tip 1; domaćin je ipak običan Linux, pa ' +
        'granica tipa 1 i 2 ovdje nije oštra. To nije još jedan hipervizor-program: hipervizor je jezgra.</p>' +
        '<p><b>Kontejneri.</b> <em lang="en">Container</em> (kontejner) nije lagani virtualni stroj s vlastitom jezgrom. To su ' +
        'procesi domaćina koje jezgra drži u zasebnim imenskim prostorima, <em lang="en">namespaces</em>, i kontrolnim ' +
        'grupama, <em lang="en">cgroups</em>. Zato <code>uname -r</code> u kontejneru ispisuje jezgru domaćina, a kontejner za ' +
        'Windows na domaćinu s Linuxom ne radi. Greška u jezgri pogađa sve kontejnere na njoj; greška u jezgri gosta ostaje u ' +
        'svom VM-u.</p>' +
        '<p><b>Broj jezgri</b> s dva gosta: tip 1 — 2 (neki imaju i upravljački OS, +1), tip 2 — 3, jezgra kao hipervizor — ' +
        '3, kontejneri — 1.</p>'
    },
    en: {
      stage: 'Layer stacks',
      compare: 'Compare',
      'cmp_all': 'all four',
      'cmp_vm-vs-container': 'VM vs container',
      'cmp_type1-vs-type2': 'type 1 vs 2',
      'cmp_kernel': 'app vs kernel',
      guests: 'Guests (VMs, containers)',
      win: 'Last guest: Windows',
      winHint: 'A VM runs it; a container on Linux does not.',

      pBook: 'Book: type 1 and type 2',
      pBookHint: 'An 8 GB laptop, a guest with 2 GB (Uvod u Linux, ch. 2, Example 4)',
      pVmCtr: 'VM or container',
      pVmCtrHint: '3 kernels vs 1; uname -r in a container',
      pKernel: 'The kernel as hypervisor',
      pKernelHint: 'the kvm module and one emulator process per guest',
      pWin: 'A Windows guest',
      pWinHint: 'Works in a VM, not as a container on Linux',

      legHw: 'hardware',
      legHv: 'hypervisor (H)',
      legK: 'kernel (K)',
      legApp: 'programs',
      legBoundary: 'isolation boundary',
      legChanged: 'selected layer',
      legLinked: 'linked layer',
      badgeH: 'H',
      badgeK: 'K',

      's_type1': 'Type 1: bare metal',
      's_type2': 'Type 2: hosted',
      's_kernel': 'Kernel-based',
      's_containers': 'Containers',
      'sh_type1': 'hypervisor on the hardware',
      'sh_type2': 'hypervisor on the host OS',
      'sh_kernel': 'the kernel is the hypervisor (KVM)',
      'sh_containers': 'one kernel for all',
      kernelsN: ['{n} kernel', '{n} kernels'],
      kernelsExtra: '+1 management OS on some',

      'b_hw': 'Hardware',
      'b_hv': 'Hypervisor',
      'b_hostk': 'Host OS kernel',
      'b_kvmk': 'Linux kernel + kvm',
      'b_ctrk': 'Linux kernel',
      b_ctrkSub: 'namespaces · cgroups',
      'b_hostapp': 'Host programs',
      'b_dhv': 'Hypervisor (app)',
      'b_emu': 'Emulator process',
      'b_gk': 'Kernel',
      b_gkWin: 'Windows kernel',
      'b_app': 'Programs',
      'b_ctr': 'Processes',
      vmN: 'VM {i}',
      ctrN: 'Container {i}',
      ctrWin: 'Windows container',
      rejected: '✕ no Windows kernel',
      memHw: '{n} GB memory',
      memVm: '{n} GB',
      memHost: 'host keeps {n} GB',

      'n_hw': 'Hardware',
      'n_hv': 'Bare-metal hypervisor',
      'n_hostk': 'Host OS kernel',
      'n_kvmk': 'Linux kernel with the kvm module',
      'n_ctrk': 'Host kernel (Linux)',
      'n_hostapp': 'Host programs',
      'n_dhv': 'Desktop hypervisor',
      'n_emu': 'Emulator process · VM {i}',
      'n_gk': 'Guest kernel · VM {i}',
      'n_app': 'Programs · VM {i}',
      'n_ctr': 'Container {i}',
      layerLabel: '{name}, {stack}',

      'w_hw': 'The physical machine: CPU, memory, disk and network cards.',
      'w_hv': 'A hypervisor that runs directly on the hardware, with no host OS. It manages the guests and controls their ' +
        'instruction flow to the hardware.',
      'w_hostk': 'The kernel of the host\'s ordinary OS (Windows, Linux, macOS; here Linux, so uname -r works). The ' +
        'hypervisor is installed into that system as a program.',
      'w_kvmk': 'The Linux kernel with the kvm module loaded: the kernel itself becomes the hypervisor. Most sources class it as ' +
        'type 1, but the host is still an ordinary Linux, so the type 1/2 line is blurred here.',
      'w_ctrk': 'The only kernel in this stack. Every container calls it, and it keeps them apart with namespaces and control ' +
        'groups.',
      'w_hostapp': 'The browser and everything else that runs on the host next to the hypervisor.',
      'w_dhv': 'A hypervisor as a program on the host OS, next to the other programs (usually with a helper driver in the host ' +
        'kernel). It differs from type 1 in where it sits, not in the idea.',
      'w_emu': 'An ordinary process on the host, one per VM, visible in ps. The guest runs inside it: the process emulates its ' +
        'devices, and the kernel with the kvm module gives it the CPU and memory.',
      'w_gk': 'This VM\'s own kernel. The guest sees a CPU, a disk and a network card, but none of them is the host\'s physical ' +
        'device, so a VM can even run another operating system.',
      'w_app': 'Programs in the guest. They call their guest\'s kernel, not the host\'s.',
      'w_ctr': 'A group of ordinary host processes in namespaces of their own. No kernel of its own: it calls the host kernel.',
      w_ctrWin: 'A container of Windows programs would need a Windows kernel, and the only kernel here is Linux. It cannot run ' +
        'natively on a Linux host.',

      cardHint: 'Click a layer: what it is, which kernel runs there, what separates it from its neighbour, and what uname -r ' +
        'prints there.',
      cKernel: 'Kernel here',
      cBoundary: 'What isolates it',
      cUname: 'uname -r',
      cPs: 'ps on the host',
      cRisk: 'A kernel bug',
      cMem: 'Memory',
      cExtra: 'Some type 1 hypervisors also run a management OS in a parent or control partition: then there is one kernel more.',
      'kh_none': 'none: it is below every kernel',
      'kh_hv': 'no general-purpose kernel: the hypervisor runs directly on the hardware',
      'kh_host': 'the host kernel, {v}',
      'kh_guest': 'the guest kernel of VM {i}, {v}',
      kh_guestWin: 'the Windows kernel of VM {i}',
      kh_rejected: 'none: the host kernel is Linux, and there is no Windows kernel',
      'un_no-app': 'nothing: no program runs there',
      'un_windows': 'nothing: Windows has no uname; the guest has its own Windows kernel',
      'un_rejected': 'nothing: the container cannot start',
      psRow: 'emulator process · VM {i}',
      riskOwn: 'stays in this VM',
      riskShared: ['reaches the one container on this kernel ({n})', 'reaches each of the {n} containers on this kernel'],
      memLine: '{total} GB in all, {guest} GB per guest, the host keeps {host} GB',

      'bd_none': 'Nothing below it; every layer above shares the same physical machine.',
      'bd_hv-is': 'It is the boundary: each VM sees only its own CPU, disk and network card, and instructions to the hardware ' +
        'pass through it.',
      'bd_host-kernel': 'It isolates the host\'s processes from each other; the VMs are isolated by the hypervisor above it.',
      'bd_kvm-is': 'It is the boundary between the VMs: the kvm module gives each guest a virtual CPU and memory of its own.',
      'bd_ns-cgroups-owner': 'Its namespaces and control groups fence the containers: each sees only its own and uses only ' +
        'what it is allowed.',
      'bd_process': 'Ordinary process isolation by the host kernel.',
      'bd_process-hv': 'A program on the host; it isolates its own VMs from each other.',
      'bd_process-emu': 'An ordinary host process, one per VM; the guest inside is isolated by the kernel with the kvm module.',
      'bd_hypervisor': 'The hypervisor: other VMs have kernels of their own, so a bug in this kernel stays in this VM.',
      'bd_guest-kernel': 'The guest kernel isolates it from other programs in the same VM, and the hypervisor from other VMs.',
      'bd_ns-cgroups': 'The host kernel\'s namespaces and control groups: a fence, not a kernel of its own.',
      'bd_rejected': 'Nothing: the container does not start, so there is nothing to fence.',

      'cap_all': 'Where the kernel and the hypervisor sit: click any layer. Kernels: {a}, {b}, {c} and {d}.',
      'cap_type1-vs-type2': 'Type 1 sits on the hardware, type 2 on the host OS; the difference is where the hypervisor sits, ' +
        'not the idea.',
      'cap_vm-vs-container': 'VMs: {a} kernels, the host\'s and one for each guest; containers: only one, the host\'s.',
      'cap_kernel': 'On the left the hypervisor is a program on the host; on the right it is the kernel itself, and each ' +
        'guest is an ordinary process.',
      capBook: 'In hosted virtualisation the [[hypervisor]] runs on top of the host OS; every guest has its own kernel.',
      capLaptop: 'A laptop with {total} GB: {guest} GB per guest, the host keeps {host} GB.',
      capVmCtr: ['{n} container, one kernel: uname -r inside a container prints the host\'s kernel.',
        '{n} containers, one kernel: uname -r inside a container prints the host\'s kernel.'],
      capKernel: ['The kernel with the kvm module is the hypervisor; ps on the host shows {n} emulator process, one per guest.',
        'The kernel with the kvm module is the hypervisor; ps on the host shows {n} emulator processes, one per guest.'],
      capWin: 'A Windows guest runs in a VM because it brings its own kernel; a Windows container on a Linux host cannot ' +
        'start: there is no Windows kernel.',
      capSel: '{name} ({stack}): ',
      'k_hw': 'below every kernel; no program runs here.',
      'k_hv': 'it sits directly on the hardware, with no host OS.',
      'k_hostk': 'the host\'s kernel; the hypervisor runs on top of it as a program.',
      'k_kvmk': 'the kernel is the hypervisor, and each guest is a process on it.',
      'k_ctrk': ['one kernel for {n} container.', 'one kernel for {n} containers.'],
      'k_hostapp': 'ordinary host programs; uname -r prints {v}.',
      'k_dhv': 'here the hypervisor is a program on the host.',
      'k_emu': 'an ordinary host process; uname -r in it prints {v}, the host kernel.',
      'k_gk': 'this VM\'s own kernel; uname -r in it prints {v}.',
      k_gkWin: 'this VM\'s own kernel, a Windows one: another OS works because the guest brings its own kernel.',
      'k_app': 'uname -r prints {v}, the guest\'s kernel, not the host\'s.',
      k_appWin: 'the Windows guest\'s programs call the Windows kernel in their own VM.',
      'k_ctr': 'no kernel of its own; uname -r prints {v}, the host\'s kernel.',
      k_ctrWin: 'it cannot start: a Linux host has no Windows kernel.',

      explain: '<p>One question: where the [[kernel]] sits and where the [[hypervisor]] sits. A [[virtual machine]] is a ' +
        'simulated environment in which other software runs; the hypervisor manages the guests and controls their ' +
        'instruction flow to the CPU, disk, memory and network cards. The computer this happens on is the [[host]], and the ' +
        'system inside a virtual machine is a [[guest]].</p>' +
        '<p><b>Type 1 and type 2.</b> In bare-metal virtualisation the hypervisor runs directly on the hardware, with no host ' +
        'OS. In hosted virtualisation it runs on top of the host OS, as a program. The difference is where the hypervisor ' +
        'sits, not the idea: practising in a VM on a laptop is the same work at a smaller scale. Every VM has its own kernel, ' +
        'so it can run another operating system.</p>' +
        '<p><b>The kernel as hypervisor.</b> With the kvm module the Linux kernel itself becomes the hypervisor, and each guest ' +
        'runs in an ordinary emulator process that shows in <code>ps</code>. Most sources class it as type 1; the host is ' +
        'still an ordinary Linux, so the type 1/2 line is blurred here. It is not one more hypervisor app: the hypervisor is ' +
        'the kernel.</p>' +
        '<p><b>Containers.</b> A container is not a lightweight virtual machine with a kernel of its own. It is host processes ' +
        'that the kernel keeps in separate namespaces and control groups (cgroups). So <code>uname -r</code> in a container ' +
        'prints the host\'s kernel, and a Windows container does not run on a Linux host. A kernel bug reaches every ' +
        'container on that kernel; a bug in a guest kernel stays in its VM.</p>' +
        '<p><b>Kernel count</b> with two guests: type 1 — 2 (some also run a management OS, +1), type 2 — 3, kernel-based — ' +
        '3, containers — 1.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
