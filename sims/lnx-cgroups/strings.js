/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-cgroups, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. In captions
   *word* is an English term (italic) and `x` a file or value (code); the page renders both.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Domaćin s tri kontrolne grupe, A, B i C, i njihove granice',
      host: 'Domaćin',
      hostCpu: 'Procesor',
      hostRam: 'RAM',
      hostOwn: 'domaćin',
      idle: 'slobodno',
      free: 'slobodno',
      group: 'Grupa {g}',
      procs: 'Procesi',
      files: 'Datoteke grupe',
      cpuLine: 'Procesor: {got} od traženih {want}',
      memLine: 'Memorija: {used} MB od traženih {want} MB',
      statThrottled: 'prigušena: cpu.max',
      statHigh: 'usporena: iznad memory.high',
      statOom: 'OOM u grupi',
      sleeping: 'miruje',
      allKilled: 'svi procesi ubijeni',
      nCores: ['{n} jezgra', '{n} jezgre', '{n} jezgri'],
      nCoresFrac: '{n} jezgre',

      legUsed: 'korišteno',
      legWanted: 'traženo, nije dobiveno',
      legCap: 'cpu.max',
      legHigh: 'memory.high',
      legMax: 'memory.max',
      legOom: 'ubijen (OOM)',
      legChanged: 'promijenjeno',

      cores: 'Jezgre domaćina',
      editGroup: 'Uređujem',
      weight: 'Težina, cpu.weight',
      quota: 'Granica, cpu.max',
      quotaMax: 'max',
      cpu: 'Grupa traži procesora',
      mem: 'Grupa traži memorije',
      memHigh: 'memory.high',
      memMax: 'memory.max',
      opt_off: 'isklj.',
      opt_256M: '256M',
      opt_384M: '384M',
      opt_512M: '512M',
      opt_1G: '1G',
      opt_2G: '2G',
      opt_max: 'max',
      oomGroup: 'memory.oom.group',

      pContention: 'Težine',
      pContentionHint: 'A i B žele po dvije jezgre od dvije; težine 100 i 300.',
      pIdle: 'Nije granica',
      pIdleHint: 'B ne traži procesor: A uzima obje jezgre.',
      pQuota: 'cpu.max',
      pQuotaHint: 'Tvrda granica: četiri jezgre, A traži četiri, a smije pola jedne.',
      pOom: 'OOM u grupi',
      pOomHint: 'A traži 600 MB uz memory.max 512M.',
      pHigh: 'memory.high',
      pHighHint: 'memory.high usporava: A traži 450 MB uz memory.high 384M; zatim podigni na 600.',
      pOomGroup: 'Cijela grupa',
      pOomGroupHint: 'Ubij cijelu grupu: kao OOM u grupi, uz memory.oom.group = 1.',

      cContention: 'Pod opterećenjem {hi} dobiva {ratio} puta više procesora od {lo} (težina {wh} prema {wl}): {ch} prema {cl}.',
      cEqual: 'Jednake težine ({w}): {a} i {b} dijele procesor jednako, {ca} i {cb}.',
      cSplit: 'Procesor se dijeli po težinama među grupama koje ga traže: A {a}, B {b}, C {c} (težine {wa}, {wb}, {wc}). Grupa koja traži manje od svog udjela uzima samo koliko treba, a ostatak se dijeli dalje.',
      cWorkConserving: 'Grupa {g} dobiva {got}, više od svog udjela po težini ({share}), jer ostale grupe svoj udio ne troše: težina nije granica.',
      cNoContention: 'Nema natjecanja: grupa {g} dobiva koliko traži ({got}), a slobodno ostaje {idle}. Težine vrijede tek kad procesora nema dovoljno za sve.',
      cCpuNone: 'Grupa {g} ne traži procesor, pa ne uzima ništa; njezin udio po težini dobivaju ostale grupe.',
      cCpuNoneIdle: 'Grupa {g} ne traži procesor, pa ne uzima ništa; domaćin ima {idle} slobodno.',
      cAlone: 'Samo grupa {g} traži procesor: dobiva sve što domaćin ima, {got}, iako traži {want}. Težine nemaju s kim dijeliti.',
      cThrottled: 'Grupa {g} traži {want}, ali `cpu.max` joj dopušta najviše {quota}: grupa je prigušena, a `nr_throttled` u `cpu.stat` raste u svakom razdoblju.',
      cThrottledIdle: 'Grupa {g} traži {want}, ali `cpu.max` joj dopušta najviše {quota}, iako domaćin ima {idle} slobodno: to je tvrda granica, ne udio. Grupa je prigušena, a `nr_throttled` u `cpu.stat` raste.',
      cOom: 'Grupa {g} je prešla `memory.max` od {max}: *OOM killer* (ubojica pri nedostatku memorije) ubija proces unutar {g}, najveći ({name}, {rss} MB), iako domaćin ima {free} slobodno.',
      cOomMore: 'Ni to nije dovoljno, pa umire i sljedeći.',
      cOomTie: 'Grupa {g} je prešla `memory.max` od {max}: *OOM killer* (ubojica pri nedostatku memorije) ubija jedan od dva jednako velika procesa unutar {g} ({rss} MB); stranica tada bira niži PID, {pid}. Domaćin ima {free} slobodno.',
      cOomGroup: 'Grupa {g} je prešla `memory.max` od {max}, a `memory.oom.group` je 1: *OOM killer* (ubojica pri nedostatku memorije) ubija cijelu grupu, sve procese ({n}), iako domaćin ima {free} slobodno.',
      cHigh: 'Grupa {g} koristi {used} MB, iznad `memory.high` ({high}): jezgra sustava joj oduzima memoriju i usporava je, ali je ne ubija. Ubija tek prelazak `memory.max` ({max}).',
      cHighNoMax: 'Grupa {g} koristi {used} MB, iznad `memory.high` ({high}): jezgra sustava joj oduzima memoriju i usporava je, ali je ne ubija. `memory.max` nije postavljen.',
      cMemFits: 'Grupa {g} koristi {used} MB od dopuštenih {max}: stane, nitko ne umire.',
      cMemNoMax: 'Grupa {g} koristi {used} MB; `memory.max` je `max`, pa je granica tek RAM domaćina ({free} slobodno).',
      cMemNone: 'Grupa {g} ne traži memoriju, pa joj `memory.max` ništa ne radi.',

      explain: '<p><em lang="en">Control group</em> (kontrolna grupa, <em lang="en">cgroup</em>) je mapa u ' +
        '<code translate="no">/sys/fs/cgroup</code> čije datoteke određuju koliko procesora i memorije dobivaju njezini ' +
        'procesi; svaki [[process]] pripada točno jednoj. <em lang="en">Container</em> (kontejner) dobiva svoju grupu, a ' +
        'sustav za kontejnere upisuje u nju granice: granica od 1,5 procesora postaje <code translate="no">cpu.max 150000 ' +
        '100000</code>, granica od 512 MB <code translate="no">memory.max</code>, a stari udio procesora (zadano 1024) ' +
        '<code translate="no">cpu.weight</code> 100. Istu datoteku piše i <code translate="no">systemd-run -p MemoryMax=</code>.</p>' +
        '<p><b>Procesor.</b> <code translate="no">cpu.weight</code> (1–10000, zadano 100) vrijedi samo pod opterećenjem: ' +
        '[[scheduler]] dijeli procesor razmjerno težinama grupa koje ga traže. Težina nije granica: udio koji grupa ne ' +
        'troši dobivaju ostale (stranica to računa idealizirano, punjenjem dok ima procesora). ' +
        '<code translate="no">cpu.max</code> je kvota po razdoblju, npr. <code translate="no">50000 100000</code> = pola ' +
        'procesora, i vrijedi i kad je stroj prazan; grupa koja je potroši čeka sljedeće razdoblje, a broji se u ' +
        '<code translate="no">nr_throttled</code>.</p>' +
        '<p><b>Memorija.</b> <code translate="no">memory.current</code> broji svu memoriju grupe, i priručnu memoriju ' +
        'datoteka. Iznad <code translate="no">memory.high</code> [[kernel]] grupi oduzima memoriju i usporava je, ali ' +
        'zbog toga nikoga ne ubija. <code translate="no">memory.max</code> je [[hard limit]]: kad se memorija ne može ' +
        'osloboditi, <em lang="en">OOM killer</em> bira žrtvu samo među procesima te grupe, onaj s najvećom ocjenom ' +
        '(veličina u memoriji, pomaknuta s <code translate="no">oom_score_adj</code>), iako domaćin ima slobodne memorije. ' +
        'Uz <code translate="no">memory.oom.group</code> = 1 umire cijela grupa. Kod jednakih ocjena stranica ubija niži ' +
        'PID. Ovdje nema [[swap area]], pa se memorija procesa ne može nigdje odložiti.</p>'
    },
    en: {
      stage: 'A host with three control groups, A, B and C, and their limits',
      host: 'Host',
      hostCpu: 'CPU',
      hostRam: 'RAM',
      hostOwn: 'host',
      idle: 'idle',
      free: 'free',
      group: 'Group {g}',
      procs: 'Processes',
      files: 'The group\'s files',
      cpuLine: 'CPU: {got} of {want} wanted',
      memLine: 'Memory: {used} MB of {want} MB wanted',
      statThrottled: 'throttled: cpu.max',
      statHigh: 'slowed: over memory.high',
      statOom: 'OOM in the group',
      sleeping: 'idle',
      allKilled: 'every process killed',
      nCores: ['{n} core', '{n} cores'],
      nCoresFrac: '{n} cores',

      legUsed: 'used',
      legWanted: 'wanted, not given',
      legCap: 'cpu.max',
      legHigh: 'memory.high',
      legMax: 'memory.max',
      legOom: 'killed (OOM)',
      legChanged: 'changed',

      cores: 'Host cores',
      editGroup: 'Editing',
      weight: 'Weight, cpu.weight',
      quota: 'Cap, cpu.max',
      quotaMax: 'max',
      cpu: 'CPU the group wants',
      mem: 'Memory the group wants',
      memHigh: 'memory.high',
      memMax: 'memory.max',
      opt_off: 'off',
      opt_256M: '256M',
      opt_384M: '384M',
      opt_512M: '512M',
      opt_1G: '1G',
      opt_2G: '2G',
      opt_max: 'max',
      oomGroup: 'memory.oom.group',

      pContention: 'Weights',
      pContentionHint: 'A and B each want two cores of two; weights 100 and 300.',
      pIdle: 'Not a limit',
      pIdleHint: 'B wants no CPU: A takes both cores.',
      pQuota: 'cpu.max',
      pQuotaHint: 'A hard cap: four cores, A wants four and may use half of one.',
      pOom: 'OOM in group',
      pOomHint: 'A wants 600 MB with memory.max 512M.',
      pHigh: 'memory.high',
      pHighHint: 'memory.high slows down: A wants 450 MB with memory.high 384M; then raise it to 600.',
      pOomGroup: 'Whole group',
      pOomGroupHint: 'Kill the whole group: as OOM in group, with memory.oom.group = 1.',

      cContention: 'Under contention {hi} gets {ratio} times {lo}\'s CPU (weight {wh} to {wl}): {ch} to {cl}.',
      cEqual: 'Equal weights ({w}): {a} and {b} split the CPU evenly, {ca} and {cb}.',
      cSplit: 'The CPU is split by weight among the groups that want it: A {a}, B {b}, C {c} (weights {wa}, {wb}, {wc}). A group that wants less than its share takes only what it needs, and the rest is split again.',
      cWorkConserving: 'Group {g} gets {got}, more than its share by weight ({share}), because the other groups leave theirs unused: a weight is not a limit.',
      cNoContention: 'No contention: group {g} gets what it asks for ({got}), with {idle} left idle. Weights only matter when there is not enough CPU for everyone.',
      cCpuNone: 'Group {g} wants no CPU, so it takes none; its share by weight goes to the other groups.',
      cCpuNoneIdle: 'Group {g} wants no CPU, so it takes none; the host has {idle} idle.',
      cAlone: 'Only group {g} wants CPU: it gets all the host has, {got}, though it wants {want}. The weights have nobody to split with.',
      cThrottled: 'Group {g} wants {want}, but `cpu.max` allows it {quota} at most: the group is throttled, and `nr_throttled` in `cpu.stat` rises every period.',
      cThrottledIdle: 'Group {g} wants {want}, but `cpu.max` allows it {quota} at most, though the host has {idle} idle: it is a hard cap, not a share. The group is throttled, and `nr_throttled` in `cpu.stat` rises.',
      cOom: 'Group {g} crossed its {max} `memory.max`: the *OOM killer* kills a process inside {g}, the largest ({name}, {rss} MB), though the host has {free} free.',
      cOomMore: 'That is still not enough, so the next one dies too.',
      cOomTie: 'Group {g} crossed its {max} `memory.max`: the *OOM killer* kills one of two equal processes inside {g} ({rss} MB each); the page breaks the tie by the lower PID, {pid}. The host has {free} free.',
      cOomGroup: 'Group {g} crossed its {max} `memory.max` and `memory.oom.group` is 1: the *OOM killer* kills the whole group, all {n} processes, though the host has {free} free.',
      cHigh: 'Group {g} uses {used} MB, above `memory.high` ({high}): the kernel reclaims its memory hard and slows it down, but does not kill it. Only crossing `memory.max` ({max}) kills.',
      cHighNoMax: 'Group {g} uses {used} MB, above `memory.high` ({high}): the kernel reclaims its memory hard and slows it down, but does not kill it. `memory.max` is not set.',
      cMemFits: 'Group {g} uses {used} MB of the {max} it may: it fits, nobody dies.',
      cMemNoMax: 'Group {g} uses {used} MB; `memory.max` is `max`, so only the host\'s RAM limits it ({free} free).',
      cMemNone: 'Group {g} wants no memory, so its `memory.max` does nothing.',

      explain: '<p>A control group (<em>cgroup</em>) is a folder in <code translate="no">/sys/fs/cgroup</code> whose files ' +
        'set how much CPU and memory its processes get; every [[process]] belongs to exactly one. A container gets a group ' +
        'of its own, and the container engine writes its limits there: a limit of 1.5 CPUs becomes ' +
        '<code translate="no">cpu.max 150000 100000</code>, a 512 MB limit <code translate="no">memory.max</code>, and the ' +
        'old CPU-share setting (default 1024) <code translate="no">cpu.weight</code> 100. ' +
        '<code translate="no">systemd-run -p MemoryMax=</code> writes the same file.</p>' +
        '<p><b>CPU.</b> <code translate="no">cpu.weight</code> (1–10000, default 100) matters only under contention: the ' +
        '[[scheduler]] splits the CPU in proportion to the weights of the groups that want it. A weight is not a limit: a ' +
        'share a group does not use goes to the others (the page computes this idealised, filling until the CPU runs out). ' +
        '<code translate="no">cpu.max</code> is a quota per period, e.g. <code translate="no">50000 100000</code> = half a ' +
        'CPU, and holds even when the machine is idle; a group that has used it up waits for the next period, and is ' +
        'counted in <code translate="no">nr_throttled</code>.</p>' +
        '<p><b>Memory.</b> <code translate="no">memory.current</code> counts all of the group\'s memory, the page cache ' +
        'too. Above <code translate="no">memory.high</code> the [[kernel]] reclaims the group\'s memory and slows it down, ' +
        'but kills nobody for it. <code translate="no">memory.max</code> is a [[hard limit]]: when memory cannot be freed, ' +
        'the <em>OOM killer</em> picks a victim among that group\'s processes only, the one with the highest score (its ' +
        'size in memory, shifted by <code translate="no">oom_score_adj</code>), though the host has memory free. With ' +
        '<code translate="no">memory.oom.group</code> = 1 the whole group dies. On equal scores the page kills the lower ' +
        'PID. There is no [[swap area]] here, so a process\'s memory cannot be put anywhere else.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
