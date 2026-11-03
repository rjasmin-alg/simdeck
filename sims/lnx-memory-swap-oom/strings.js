/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-memory-swap-oom, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The free -m lines, the process names, PIDs and the kernel's log line are program output (translate="no"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Radna memorija, odlagalište memorije, ispis free -m i tablica procesa',

      // controls
      swap: 'Odlagalište memorije (swap)',
      swapNone: 'nema',
      backup: 'Backup (čita 800 MiB)',
      dbSize: 'Baza (db) traži',
      notStarted: 'ne radi',
      dbAdj: 'oom_score_adj baze',
      buildSize: 'Build traži',
      orderHint: 'pokreću se redom: backup, baza, build',

      // presets
      pBookFree: 'Stroj iz knjige',
      pBookFreeHint: 'Ništa nije pokrenuto: free 598, a raspoloživo 1324 MiB.',
      pBackupReads: 'Backup čita datoteke',
      pBackupReadsHint: 'free pada na 0, buff/cache raste na 1483, raspoloživo ostaje 1324.',
      pCacheGivesWay: 'Predmemorija se povlači',
      pCacheGivesWayHint: 'Build od 900 MiB: free 0, raspoloživo 424, nitko nije ubijen.',
      pOomKillsDb: 'Ubojica OOM ubija bazu',
      pOomKillsDbHint: 'Baza 900, pa build 600, bez odlagališta: buildu nedostaje 176 MiB.',
      pSwapSaves: 'Odlagalište spašava bazu',
      pSwapSavesHint: 'Isto, uz 512 MiB odlagališta: 176 MiB baze odlazi u odlagalište.',
      pProtectDb: 'Zaštićena baza',
      pProtectDbHint: 'Isto kao kod ubijanja baze, ali s oom_score_adj −1000: umire build.',

      // legend
      legProc: 'memorija procesa',
      legOther: 'ostali',
      legCache: 'predmemorija, vraća se',
      legFixed: 'predmemorija, fiksna',
      legFree: 'slobodno',
      legSwap: 'u odlagalištu',
      legKilled: 'ubijen (OOM)',
      legChanged: 'promijenjeno',

      // stage: bars
      ram: 'Radna memorija',
      swapBar: 'Odlagalište memorije',
      noSwap: 'nema odlagališta memorije',
      segOther: 'ostali',
      segFixed: 'fiksno',
      segCache: 'predmemorija',
      segFree: 'slobodno',
      mib: '{n} MiB',
      availLine: 'raspoloživo = slobodno + predmemorija koja se može vratiti = {free} + {cache} = {avail} MiB',

      // stage: process table
      procs: 'Procesi',
      noProcs: 'Nijedan proces nije pokrenut.',
      thPid: 'PID',
      thName: 'ime',
      thAsk: 'traži',
      thRss: 'RSS',
      thSwap: 'swap',
      thAdj: 'oom_score_adj',
      thScore: 'bodovi',
      never: 'nikad',
      killed: 'ubijen',

      // stage: what happened
      trace: 'Što se dogodilo',
      evRead: 'backup: pročitao 800 MiB datoteka; {free} MiB iz slobodnog ušlo je u predmemoriju, {rest} MiB zamijenilo je stariju predmemoriju.',
      evAsk: '{name}: traži {ask} MiB',
      evFree: '{n} iz slobodnog',
      evCache: '{n} vraćeno iz predmemorije',
      evSwap: '{n} MiB stranica procesa {who} u odlagalište',
      evShort: 'nedostaje {n}',
      evScores: 'bodovi: {list}',
      evKill: 'ubojica OOM ubija {who}',
      evFail: 'zahtjev nije ispunjen',
      evDone: 'dobio sve',
      kernelLog: 'Dnevnik jezgre',

      // process names in prose: nominative, genitive
      nDb: 'baza',
      gDb: 'baze',
      nBuild: 'build',
      gBuild: 'builda',
      nBackup: 'backup',
      gBackup: 'backupa',

      // captions
      cBook: 'Stroj iz knjige: slobodno je samo {free} MiB, ali raspoloživo (available) je {avail} MiB, jer se {cache} od {bc} MiB predmemorije (buff/cache) dade vratiti. Zauzeto (used, {used} MiB) je ukupno minus raspoloživo.',
      cRead: 'Backup je čitao datoteke: slobodno je palo na {free} MiB, a buff/cache je narastao na {bc} MiB. Raspoloživo je i dalje {avail} MiB: to je predmemorija stranica i jezgra je vraća čim memorija zatreba.',
      cReclaim: 'free pokazuje {free} MiB slobodnog, ali stroj nije ostao bez memorije: iz predmemorije stranica vraćeno je {took} MiB. Raspoloživo je još {avail} MiB.',
      cFits: 'Sve što je pokrenuto stalo je u slobodnu memoriju: slobodno {free} MiB, raspoloživo {avail} MiB, predmemorija nije dirana.',
      cSwap: 'Slobodno i predmemorija su potrošeni, pa je {n} MiB stranica procesa {who} otišlo u odlagalište memorije. Nitko nije ubijen: {who2} radi dalje, samo sporije kad zatreba te stranice.',
      cOomDb: 'Za build nedostaje {short} MiB, a {why}. Ubojica OOM bira proces s najvećim zbrojem: baza ({vs} MiB) ima više od builda ({as} MiB), pa umire baza.',
      cOomProtected: 'Za build nedostaje {short} MiB, a {why}. Baza ima oom_score_adj −1000 i nikad nije izabrana, pa ubojica OOM ubija sam build ({as} MiB): umire proces koji je tražio.',
      cOomSelf: 'Za build nedostaje {short} MiB, a {why}. Ubojica OOM bira proces s najvećim zbrojem: build ({as} MiB) ima više od baze ({vs} MiB), pa umire upravo onaj koji je tražio.',
      whyNoSwap: 'odlagališta memorije nema',
      whySwapFull: 'odlagalište nije bilo dovoljno',

      explain:
        '<p>Sve je u MiB. Početak je ispis <code>free -h</code> iz knjige: 1741 ukupno, 598 slobodno, 885 buff/cache, ' +
        '1324 raspoloživo. Buff/cache je [[cache]], uglavnom <em lang="en">page cache</em> (predmemorija stranica): ' +
        'sadržaj pročitanih datoteka. Od nje se 159 MiB ne može vratiti (izabrano tako da se dobije redak iz knjige).</p>' +
        '<ol>' +
        '<li><em lang="en">Available memory</em> (raspoloživa memorija) = slobodno + predmemorija koja se može vratiti; ' +
        '<em lang="en">used memory</em> (zauzeta memorija) = ukupno − raspoloživo.</li>' +
        '<li>Čitanje datoteka puni predmemoriju iz slobodnog: slobodno pada, raspoloživo ne.</li>' +
        '<li>Zahtjev za memorijom uzima prvo slobodno, pa vraća predmemoriju (najdulje nekorištenu prvu).</li>' +
        '<li>Kad nestane i predmemorije, stranice procesa pokrenutog najranije idu u [[swap area]], dok ima mjesta; to je [[paging]]. ' +
        'Pravi sustav to dvoje miješa (<code>vm.swappiness</code>); ovdje idu redom.</li>' +
        '<li>Ako ni to nije dovoljno, <em lang="en">OOM killer</em> (ubojica OOM) bira proces s najviše bodova: RSS + swap + ' +
        'oom_score_adj × (RAM + swap) / 1000; RSS je [[resident set]], dio procesa u radnoj memoriji. Proces s −1000 nikad nije izabran. Žrtva može biti i proces koji nije tražio.</li>' +
        '<li>Pri jednakim bodovima umire kasnije pokrenuti proces.</li>' +
        '</ol>' +
        '<p>Izvan teme: ograničenja memorije cgroupa, overcommit, velike stranice, prljave stranice i zapisivanje na ' +
        'disk.</p>'
    },
    en: {
      stage: 'RAM, the swap area, the free -m listing and the process table',

      // controls
      swap: 'Swap area',
      swapNone: 'none',
      backup: 'Backup (reads 800 MiB)',
      dbSize: 'Database (db) asks for',
      notStarted: 'not started',
      dbAdj: 'Database oom_score_adj',
      buildSize: 'Build asks for',
      orderHint: 'they start in order: backup, database, build',

      // presets
      pBookFree: 'The book\'s machine',
      pBookFreeHint: 'Nothing started: free 598, but available 1324 MiB.',
      pBackupReads: 'The backup reads files',
      pBackupReadsHint: 'free drops to 0, buff/cache grows to 1483, available stays 1324.',
      pCacheGivesWay: 'The cache gives way',
      pCacheGivesWayHint: 'A 900 MiB build: free 0, available 424, nobody killed.',
      pOomKillsDb: 'The OOM killer kills the database',
      pOomKillsDbHint: 'Database 900, then build 600, no swap: the build is 176 MiB short.',
      pSwapSaves: 'Swap saves the database',
      pSwapSavesHint: 'The same with 512 MiB of swap: 176 MiB of the database goes to swap.',
      pProtectDb: 'Protected database',
      pProtectDbHint: 'As in the database kill, but with oom_score_adj −1000: the build dies.',

      // legend
      legProc: 'process memory',
      legOther: 'other',
      legCache: 'cache, reclaimable',
      legFixed: 'cache, fixed',
      legFree: 'free',
      legSwap: 'in swap',
      legKilled: 'killed (OOM)',
      legChanged: 'changed',

      // stage: bars
      ram: 'RAM',
      swapBar: 'Swap area',
      noSwap: 'no swap area',
      segOther: 'other',
      segFixed: 'fixed',
      segCache: 'cache',
      segFree: 'free',
      mib: '{n} MiB',
      availLine: 'available = free + reclaimable cache = {free} + {cache} = {avail} MiB',

      // stage: process table
      procs: 'Processes',
      noProcs: 'No process started.',
      thPid: 'PID',
      thName: 'name',
      thAsk: 'asks',
      thRss: 'RSS',
      thSwap: 'swap',
      thAdj: 'oom_score_adj',
      thScore: 'score',
      never: 'never',
      killed: 'killed',

      // stage: what happened
      trace: 'What happened',
      evRead: 'backup: read 800 MiB of files; {free} MiB from free went into the page cache, {rest} MiB replaced older cache.',
      evAsk: '{name}: asks for {ask} MiB',
      evFree: '{n} from free',
      evCache: '{n} reclaimed from cache',
      evSwap: '{n} MiB of {who}\'s pages to swap',
      evShort: '{n} short',
      evScores: 'scores: {list}',
      evKill: 'the OOM killer kills {who}',
      evFail: 'request not met',
      evDone: 'got it all',
      kernelLog: 'Kernel log',

      // process names in prose (English needs no cases)
      nDb: 'the database',
      gDb: 'the database',
      nBuild: 'the build',
      gBuild: 'the build',
      nBackup: 'the backup',
      gBackup: 'the backup',

      // captions
      cBook: 'The book\'s machine: only {free} MiB is free, but {avail} MiB is available, because {cache} of the {bc} MiB of cache (buff/cache) can be given back. Used ({used} MiB) is total minus available.',
      cRead: 'The backup read files: free fell to {free} MiB and buff/cache grew to {bc} MiB. Available is still {avail} MiB: this is page cache, and the kernel gives it back as soon as memory is needed.',
      cReclaim: 'free shows {free} MiB free, but the machine is not out of memory: {took} MiB was taken back from the page cache. {avail} MiB is still available.',
      cFits: 'Everything started fit in free memory: free {free} MiB, available {avail} MiB, the cache untouched.',
      cSwap: 'Free memory and the cache ran out, so {n} MiB of {who}\'s pages went to the swap area. Nobody was killed: {who2} keeps running, only slower when it needs those pages.',
      cOomDb: 'The build is {short} MiB short and {why}. The OOM killer picks the highest score: the database ({vs} MiB) outscores the build ({as} MiB), so the database dies.',
      cOomProtected: 'The build is {short} MiB short and {why}. The database has oom_score_adj −1000 and is never picked, so the OOM killer kills the build itself ({as} MiB): the process that asked dies.',
      cOomSelf: 'The build is {short} MiB short and {why}. The OOM killer picks the highest score: the build ({as} MiB) outscores the database ({vs} MiB), so the very process that asked dies.',
      whyNoSwap: 'there is no swap',
      whySwapFull: 'swap was not enough',

      explain:
        '<p>Everything is in MiB. The start is the book\'s <code>free -h</code>: 1741 total, 598 free, 885 buff/cache, ' +
        '1324 available. Buff/cache is [[cache]], mostly page cache: the contents of files that were read. 159 MiB of ' +
        'it cannot be reclaimed (chosen to reproduce the book\'s line).</p>' +
        '<ol>' +
        '<li><b>Available</b> = free + reclaimable cache; <b>used</b> = total − available.</li>' +
        '<li>Reading files fills the cache from free memory: free drops, available does not.</li>' +
        '<li>An allocation takes free memory first, then reclaims cache (least recently used first).</li>' +
        '<li>When the cache is gone too, the pages of the earliest-started process go to the [[swap area]] while it has room; this is [[paging]]. ' +
        'A real system mixes the two (<code>vm.swappiness</code>); here they go in order.</li>' +
        '<li>If that is not enough, the OOM killer picks the process with the highest score: RSS + swap + ' +
        'oom_score_adj × (RAM + swap) / 1000; RSS is the [[resident set]], the part of the process in RAM. A process at −1000 is never picked. The victim may be a process that did ' +
        'not ask.</li>' +
        '<li>On equal scores the later-started process dies.</li>' +
        '</ol>' +
        '<p>Out of scope: cgroup memory limits, overcommit, huge pages, dirty pages and writeback.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
