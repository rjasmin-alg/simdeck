/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-load-average, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Numbers in prose use the page's decimal mark; the uptime and nproc lines are program output (translate="no"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stroj: jezgre, red za izvođenje, disk i opterećenje kroz vrijeme',

      // controls
      cores: 'Jezgre (nproc)',
      cpuTasks: 'Poslovi koji računaju (R)',
      ioTasks: 'Poslovi koji čekaju disk (D)',
      runFor: 'Poslovi rade do',
      t: 'Trenutak t',

      // presets
      pBookYes: 'Dva posla, 2 jezgre, 65 s',
      pBookYesHint: 'Dva usporedna posla koji samo troše procesor, mjereno nakon 65 s: 1,32 · 0,39 · 0,14 (u knjizi 1,33 · 0,40 · 0,14).',
      pBookTopLater: 'Isto, 15 s kasnije',
      pBookTopLaterHint: 'Poslovi su prekinuti u 65 s; u 80 s: 1,03 · 0,37 · 0,13 (u knjizi, druga sjednica: 1,04 · 0,38 · 0,13).',
      pOneCoreQueue: 'Dva posla, 1 jezgra',
      pOneCoreQueueHint: 'Isti posao na jednoj jezgri: jedan se izvodi, drugi čeka; opterećenje 2,00 uz 100 % procesora.',
      pIoBound: 'Četiri čekaju disk',
      pIoBoundHint: 'Četiri posla u stanju D na 4 jezgre: opterećenje 4,00, a procesor 0 %.',
      pEasing: 'Opterećenje popušta',
      pEasingHint: 'Četiri posla 10 min, gledano 5 min nakon kraja: 0,03 · 1,27 · 1,38, niz raste slijeva nadesno.',

      // legend
      legBusy: 'zauzeta jezgra',
      legIdle: 'slobodna jezgra',
      legQueued: 'čeka jezgru (R)',
      legDisk: 'čeka disk (D)',
      legChanged: 'promijenjeno',

      // stage
      machine: 'Stroj',
      coreN: 'jezgra {i}',
      idle: 'slobodna',
      queue: 'Red za izvođenje',
      queueEmpty: 'prazan',
      disk: 'Disk',
      diskEmpty: 'nitko ne čeka',
      stoppedAt: ['{n} posao je završio u {stop}.', '{n} posla su završila u {stop}.', '{n} poslova je završilo u {stop}.'],
      notStarted: 'Nema poslova.',
      nowTitle: 'U trenutku {t}',
      sampleLine: 'sada: R {r} + D {d} = {n}',
      perCore: 'minutni prosjek po jezgri: {v}',
      cpuBusy: 'zauzeto {v} %',
      cpuWa: 'čeka U/I {v} %',
      cpuIdle: 'slobodno {v} %',
      cpuTitle: '%CPU',

      // chart
      chart: 'Opterećenje kroz vrijeme',
      k1: '1 min',
      k5: '5 min',
      k15: '15 min',
      kLater: 'nakon t (blijedo)',
      capacity: 'kapacitet: {n}',
      axisMin: 'vrijeme (min)',
      axisLoad: 'opterećenje',
      stopMark: 'kraj',

      // units
      uMin: 'min',
      uS: 's',
      cores1: ['{n} jezgri', '{n} jezgre', '{n} jezgri'],

      // captions: the reading (rule 2), then what is happening at the cursor
      cFirst: 'Poslovi već rade, ali prvi uzorak dolazi tek u 5 s: sva tri prosjeka još su 0,00.',
      cZero: 'Sva tri prosjeka su 0,00: nijedan posao nije bio u stanju R ni D.',
      cFaded: 'Sva tri prosjeka opet pokazuju 0,00: posao je gotov već {ago}, a prosjeci su u međuvremenu izblijedjeli.',
      whoWants: ['{n} posao traži', '{n} posla traže', '{n} poslova traži'],
      cLag: 'Opterećenje {l1} na {cores}, a upravo sada {who} jezgru ili disk: minutni prosjek kasni za redom i još raste.',
      cDisk: 'Opterećenje {l1} na {cores}, a sve su jezgre slobodne (%CPU 0 %): brojka broji poslove koji čekaju disk (D), ne red za jezgrom.',
      cUnderOne: 'Opterećenje {l1} na {cores}: red nije premašio ono što stroj vodi usporedno. Na 1 jezgri ista bi brojka značila red dulji od kapaciteta.',
      cUnder: 'Opterećenje {l1} na {cores}: u prosjeku najviše jedan posao, unutar onoga što stroj vodi usporedno.',
      cOver: 'Opterećenje {l1} na {cores}: u prosjeku je više poslova tražilo jezgru ili disk nego što stroj vodi usporedno; red je dulji od kapaciteta.',
      bQueue: [
        '{n} posao čeka u redu za izvođenje: nema jezgru, ali ulazi u opterećenje.',
        '{n} posla čekaju u redu za izvođenje: nemaju jezgru, ali ulaze u opterećenje.',
        '{n} poslova čeka u redu za izvođenje: nemaju jezgru, ali ulaze u opterećenje.'
      ],
      bDisk: [
        'Uz to {n} posao čeka disk (D): ulazi u opterećenje, a %CPU-u ne dodaje ništa.',
        'Uz to {n} posla čekaju disk (D): ulaze u opterećenje, a %CPU-u ne dodaju ništa.',
        'Uz to {n} poslova čeka disk (D): ulaze u opterećenje, a %CPU-u ne dodaju ništa.'
      ],
      bFalling: 'Niz pada slijeva nadesno ({l1} → {l5} → {l15}): opterećenje je tek nastalo.',
      bSteady: ['{n} posao radi već {dur}: sva tri prosjeka približavaju se broju {n}, minutni prvi.', '{n} posla rade već {dur}: sva tri prosjeka približavaju se broju {n}, minutni prvi.', '{n} poslova radi već {dur}: sva tri prosjeka približavaju se broju {n}, minutni prvi.'],
      bStopped: 'Posao je gotov već {ago}: minutni prosjek pada prvi, petnaestominutni zadnji.',
      bRising: 'Posao je gotov već {ago}; niz raste slijeva nadesno ({l1} → {l5} → {l15}): opterećenje je bilo veće ranije i sada popušta.',

      explain: '<p>[[load average]] čine tri brojke: koliko je poslova u prosjeku bilo u stanju <code>R</code> (izvodi se ili ' +
        'čeka jezgru u <i>run queue</i> (redu za izvođenje)) ili u stanju <code>D</code> (<i>uninterruptible sleep</i>, ' +
        'čekanje na ulaz/izlaz diska), kroz 1, 5 i 15 minuta. Broje se i poslovi koji ništa ne računaju: opterećenje mjeri ' +
        'duljinu reda, a ne zauzetost procesora.</p>' +
        '<p>Brojke nisu podijeljene brojem jezgri. Opterećenje 1 na jednoj jezgri znači da je bila zauzeta cijelo vrijeme, ' +
        'a na četiri jezgre da su bile slobodne 75 % vremena. Zato se čitaju uz <code>nproc</code>. Pomakni klizač jezgri: ' +
        'mijenjaju se %CPU i red, brojke ne.</p>' +
        '<p>Svakih 5 s sustav prebroji n = R + D i svaki prosjek pomakne prema tom broju: novi = stari · e + n · (1 − e), ' +
        's e ≈ 0,920, 0,983 i 0,995. Minutni prosjek zato prvi raste i prvi pada, petnaestominutni zadnji. Niz koji pada ' +
        'slijeva nadesno (1,33 → 0,40 → 0,14) opisuje opterećenje koje je tek nastalo; niz koji raste opisuje ono koje je ' +
        'bilo veće ranije i sada popušta.</p>' +
        '<p>Četvrto i peto polje datoteke <code>/proc/loadavg</code> (broj izvršivih i svih procesa i dretvi, zadnji PID) ovdje se ne ' +
        'prikazuju.</p>'
    },
    en: {
      stage: 'One machine: cores, run queue, disk and the load over time',

      cores: 'Cores (nproc)',
      cpuTasks: 'CPU-bound tasks (R)',
      ioTasks: 'Tasks waiting for disk (D)',
      runFor: 'Tasks run until',
      t: 'Time t',

      pBookYes: 'Two tasks, 2 cores, 65 s',
      pBookYesHint: 'Two parallel tasks that only burn CPU, measured after 65 s: 1.32 · 0.39 · 0.14 (the book: 1.33 · 0.40 · 0.14).',
      pBookTopLater: 'The same, 15 s later',
      pBookTopLaterHint: 'The tasks were killed at 65 s; at 80 s: 1.03 · 0.37 · 0.13 (the book, another session: 1.04 · 0.38 · 0.13).',
      pOneCoreQueue: 'Two tasks, 1 core',
      pOneCoreQueueHint: 'The same work on one core: one runs, one waits; load 2.00 at 100 % CPU.',
      pIoBound: 'Four wait for disk',
      pIoBoundHint: 'Four tasks in state D on 4 cores: load 4.00, CPU 0 %.',
      pEasing: 'The load is easing',
      pEasingHint: 'Four tasks for 10 min, seen 5 min after they stopped: 0.03 · 1.27 · 1.38, rising left to right.',

      legBusy: 'busy core',
      legIdle: 'idle core',
      legQueued: 'waits for a core (R)',
      legDisk: 'waits for disk (D)',
      legChanged: 'changed',

      machine: 'One machine',
      coreN: 'core {i}',
      idle: 'idle',
      queue: 'Run queue',
      queueEmpty: 'empty',
      disk: 'Disk',
      diskEmpty: 'nobody waits',
      stoppedAt: ['{n} task stopped at {stop}.', '{n} tasks stopped at {stop}.'],
      notStarted: 'No tasks.',
      nowTitle: 'At {t}',
      sampleLine: 'now: R {r} + D {d} = {n}',
      perCore: '1-minute load per core: {v}',
      cpuBusy: 'busy {v} %',
      cpuWa: 'I/O wait {v} %',
      cpuIdle: 'idle {v} %',
      cpuTitle: '%CPU',

      chart: 'Load over time',
      k1: '1 min',
      k5: '5 min',
      k15: '15 min',
      kLater: 'after t (faint)',
      capacity: 'capacity: {n}',
      axisMin: 'time (min)',
      axisLoad: 'load',
      stopMark: 'stop',

      uMin: 'min',
      uS: 's',
      cores1: ['{n} core', '{n} cores'],

      cFirst: 'The tasks are already running, but the first sample comes at 5 s: all three averages are still 0.00.',
      cZero: 'All three averages are 0.00: no task was in state R or D.',
      cFaded: 'All three averages print 0.00 again: the work ended {ago} ago and the averages have faded since.',
      whoWants: ['{n} task wants', '{n} tasks want'],
      cLag: 'Load {l1} on {cores}, while {who} a core or the disk right now: the 1-minute average lags behind the queue and is still rising.',
      cDisk: 'Load {l1} on {cores}, with every core idle (%CPU 0 %): the number counts tasks waiting for disk (D), not a queue for a core.',
      cUnderOne: 'Load {l1} on {cores}: the queue never exceeded what the machine runs in parallel. On 1 core the same number would mean a queue longer than capacity.',
      cUnder: 'Load {l1} on {cores}: at most one task on average, within what the machine runs in parallel.',
      cOver: 'Load {l1} on {cores}: on average more tasks wanted a core or the disk than the machine runs in parallel; the queue is longer than capacity.',
      bQueue: [
        '{n} task waits in the run queue: it has no core, but it counts in the load.',
        '{n} tasks wait in the run queue: they have no core, but they count in the load.'
      ],
      bDisk: [
        'Besides, {n} task waits for disk (D): it counts in the load but adds nothing to %CPU.',
        'Besides, {n} tasks wait for disk (D): they count in the load but add nothing to %CPU.'
      ],
      bFalling: 'The series falls left to right ({l1} → {l5} → {l15}): a load that just started.',
      bSteady: ['{n} task has run for {dur}: all three averages approach {n}, the 1-minute one first.', '{n} tasks have run for {dur}: all three averages approach {n}, the 1-minute one first.'],
      bStopped: 'The work ended {ago} ago: the 1-minute average falls first, the 15-minute one last.',
      bRising: 'The work ended {ago} ago; the series rises left to right ({l1} → {l5} → {l15}): the load was higher earlier and is easing.',

      explain: '<p>The [[load average]] is three numbers: how many tasks were, on average, in state <code>R</code> (running, ' +
        'or waiting for a core in the run queue) or in state <code>D</code> (uninterruptible sleep, waiting for disk I/O), ' +
        'over 1, 5 and 15 minutes. Tasks that compute nothing count too: the load measures the length of a queue, not how ' +
        'busy the CPU is.</p>' +
        '<p>The numbers are not divided by the number of cores. Load 1 on one core means it was busy all the time; on four ' +
        'cores it means they were idle 75 % of the time. So read them next to <code>nproc</code>. Move the cores slider: ' +
        '%CPU and the queue change, the numbers do not.</p>' +
        '<p>Every 5 s the system counts n = R + D and moves each average towards it: new = old · e + n · (1 − e), with ' +
        'e ≈ 0.920, 0.983 and 0.995. So the 1-minute average rises first and falls first, the 15-minute one last. A series ' +
        'falling left to right (1.33 → 0.40 → 0.14) is a load that just started; a rising one is a load that was higher ' +
        'earlier and is easing.</p>' +
        '<p>The fourth and fifth fields of <code>/proc/loadavg</code> (the number of runnable and of all processes and threads, the last PID) are not shown ' +
        'here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
