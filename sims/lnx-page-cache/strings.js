/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-page-cache, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a glossary
   term (first mention; [[=term]] later ones). The free -m and /proc/meminfo listings, the file names a.dat and b.dat
   and the numbers are data (translate="no"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Radna memorija s predmemorijom stranica, prljave stranice, disk, ispisi free -m i /proc/meminfo',

      // controls
      readMiB: 'Pročitaj datoteku a.dat',
      reread: 'Pročitaj a.dat opet',
      writeMiB: 'Zapiši datoteku b.dat',
      seconds: 'Sekundi od pisanja',
      sync: 'sync',
      dropCaches: 'drop_caches',
      powerLoss: 'Nestanak struje',
      ratios: 'Pragovi prljavog',
      none: 'ništa',
      mib: '{n} MiB',
      sec: '{n} s',
      pct: '{n} %',
      decSep: ',',

      // presets
      pBookFree: 'Stroj iz knjige',
      pBookFreeHint: 'free 598, a raspoloživo 1324 MiB.',
      pReadTwice: 'Dvaput pročitaj',
      pReadTwiceHint: '400 MiB dvaput: s diska se čita samo 400.',
      pSmallWrite: 'Malo pisanje',
      pSmallWriteHint: '100 MiB prljavo; pomakni sekunde na 30.',
      pBigWrite: 'Veliko pisanje',
      pBigWriteHint: '500 MiB: pisanje u pozadini od 132, usporavanje na 265.',
      pDropCaches: 'drop_caches',
      pDropCachesHint: 'free raste na 1324, raspoloživo ostaje 1324.',
      pPowerLoss: 'Nestanak struje',
      pPowerLossHint: '100 MiB, 10 s nakon pisanja; uključi sync i usporedi.',

      // legend
      legProc: 'memorija procesa',
      legClean: 'čista predmemorija',
      legDirty: 'prljavo, sat = starost',
      legWb: 'upisuje se na disk',
      legFixed: 'predmemorija koja ostaje',
      legFree: 'slobodno',
      legMark: 'prag',
      legLost: 'izgubljeno',
      legChanged: 'promijenjeno',

      // stage: RAM bar
      ram: 'Radna memorija',
      segProc: 'procesi',
      segFixed: 'ostaje',
      segOld: 'ranije datoteke',
      segWb: 'na disk',
      segDirty: 'prljavo',
      segFree: 'slobodno',
      availLine: 'raspoloživo = slobodno + predmemorija koja se može vratiti = {free} + {cache} = {avail} MiB',

      // stage: dirty gauge
      gauge: 'Prljavo + Writeback',
      markBg: 'pozadinsko pisanje',
      markLimit: 'granica',
      throttled: 'pisanje usporeno',

      // stage: disk
      disk: 'Disk',
      diskRead: 'pročitano s diska',
      diskWritten: 'zapisano na disk',
      onDisk: 'na disku',
      partOnDisk: '{n} od {m} MiB na disku',
      lostPart: 'izgubljeno {n} MiB',
      diskBusy: 'piše 25 MiB/s',
      diskIdle: 'miruje',
      powerBanner: 'Struja je nestala u {t} s; prikazano je stanje u tom trenutku.',

      // stage: what happened
      trace: 'Što se dogodilo',
      noEvents: 'Još ništa: pročitaj ili zapiši datoteku.',
      evRead: 'čitanje, {size} MiB s diska u predmemoriju',
      evEvicted: '{n} MiB istisnuto iz stare predmemorije',
      evReread: 'ponovno čitanje iz predmemorije, 0 MiB s diska',
      evWrite: 'write() od {size} MiB → prljave stranice',
      evReturnedNow: 'write() se vratio odmah',
      evReturnedAt: 'write() se vratio nakon {s} s',
      evBackground: 'prljavo iznad {mark} MiB: pozadinsko pisanje počinje odmah',
      evThrottle: 'prljavo + Writeback na {limit} MiB: proces usporen do {until} s',
      evExpire: 'otkucaj u {tick} s: {size} MiB starih 30 s ide na disk',
      evSync: 'sync: {size} MiB na disk, vratio se nakon {took} s',
      evDrop: 'drop_caches: oslobođeno {size} MiB čiste predmemorije',
      evDropKept: 'prljavo i Writeback ostaju, {kept} MiB',
      evPower: 'nestanak struje: izgubljeno {lost} MiB',

      // captions
      cBook: 'Stroj iz knjige: slobodno je samo {free} MiB, ali raspoloživo je {avail} MiB, jer {cache} MiB predmemorije stranica jezgra vraća čim memorija zatreba. Ta memorija nije izgubljena, samo posuđena.',
      cRead: 'a.dat ({size} MiB) pročitan je s diska u predmemoriju: slobodno je palo na {free} MiB, buff/cache je narastao na {bc} MiB, a raspoloživo je ostalo {avail} MiB.',
      cReread: 'Drugo čitanje datoteke a.dat došlo je iz predmemorije: s diska je pročitano {disk} MiB, a ne {twice}. Raspoloživo je i dalje {avail} MiB.',
      cDirty: 'write() se vratio, ali {dirty} MiB datoteke b.dat prljavo je: u memoriji, ne na disku (na disku {written} od {size} MiB). Stranice su stare {age} s; nisu iznad praga od {bg} MiB, pa čekaju da navrše 30 s.',
      cBackground: 'Prljavo je bilo iznad praga od {bg} MiB, pa se višak odmah piše na disk: {wb} MiB upravo se upisuje (Writeback), {dirty} MiB čeka. Na disku je {written} od {size} MiB.',
      cThrottled: 'Prljavo + Writeback stiglo je do granice od {limit} MiB: proces koji piše je usporen i čeka disk, a write() se vraća tek nakon {ret} s. Na disku je {written} od {size} MiB.',
      cExpired: 'Na otkucaju u {tick} s stranice su navršile 30 s: {wb} MiB upravo se upisuje na disk (Writeback), prljavih je 0. Na disku je {written} od {size} MiB.',
      cWritten: 'Cijeli b.dat ({size} MiB) je na disku, a stranice su ostale u memoriji kao čista predmemorija. Raspoloživo je i dalje {avail} MiB.',
      cSync: 'sync je zapisao {n} MiB i vratio se nakon {took} s, tek kad ih je disk imao: prljavih je 0, Writeback 0, a b.dat je sada čista predmemorija.',
      cDrop: 'drop_caches je oslobodio {n} MiB predmemorije: free je narastao na {free}, a available je ostao {avail}. Ta memorija nikad nije bila izgubljena, samo posuđena.',
      cDropKept: '{kept} MiB prljavih stranica i stranica koje se upisuju ostaje: drop_caches ih ne dira.',
      cLost: 'Struja je nestala u {t} s: {lost} MiB datoteke b.dat nije bilo na disku i više ga nema, iako je write() već javio uspjeh. Čista predmemorija nije izgubila ništa: disk to ima.',
      cLostMid: 'Struja je nestala u {t} s, dok je proces još pisao: {lost} MiB datoteke b.dat nije stiglo na disk. Čista predmemorija nije izgubila ništa: disk to ima.',
      cSafeNone: 'Struja je nestala i ništa nije izgubljeno: ništa nije bilo zapisano, a čista predmemorija samo je kopija onoga što disk već ima.',
      cSafe: 'Struja je nestala i ništa nije izgubljeno: na disku je sve što je zapisano ({written} MiB), a čista predmemorija samo je kopija onoga što disk već ima.',

      explain:
        '<p>Sve je u MiB. Početak je ispis <code>free -h</code> iz knjige: 1741 ukupno, 598 slobodno, 885 buff/cache, ' +
        '1324 raspoloživo. Buff/cache je [[cache]], uglavnom <em lang="en">page cache</em> (predmemorija stranica): ' +
        'sadržaj datoteka koje su pročitane ili zapisane. 159 MiB od toga ne može se osloboditi (izabrano tako da se dobije ' +
        'redak iz knjige). Disk ovdje piše 25 MiB/s.</p>' +
        '<ol>' +
        '<li>Raspoloživo = slobodno + predmemorija stranica koja se može vratiti; zauzeto = ukupno − raspoloživo.</li>' +
        '<li>Čitanje datoteke koje nema u predmemoriji puni je iz slobodnog (pa najstariju čistu predmemoriju): slobodno ' +
        'pada, raspoloživo ne. Ponovno čitanje ide iz predmemorije, bez diska.</li>' +
        '<li><em lang="en">Buffered write</em> (pisanje kroz međuspremnik) stvara <em lang="en">dirty pages</em> (prljave ' +
        'stranice) i <code>write()</code> se vraća prije nego što disk išta dobije.</li>' +
        '<li><em lang="en">Flusher threads</em> (niti za pražnjenje) bude se svakih 5 s i šalju na disk stranice prljave ' +
        'barem 30 s (<code>dirty_writeback_centisecs</code>, <code>dirty_expire_centisecs</code>); stranica koja ' +
        'navrši 30 s točno na otkucaju ide na tom otkucaju. Dok ih disk piše, to je <em lang="en">writeback</em> ' +
        '(upisivanje na disk), a nakon toga su čiste.</li>' +
        '<li>Iznad <code>dirty_background_ratio</code> (10 % raspoloživog, 132 MiB) višak prljavog odmah ide na disk; ' +
        'na <code>dirty_ratio</code> (20 %, 265 MiB) prljavo + <em>writeback</em> je puno i proces koji piše čeka disk.</li>' +
        '<li><code>sync</code> zapiše sve što nije na disku i vrati se kad je disk to primio.</li>' +
        '<li><code>echo 1 &gt; /proc/sys/vm/drop_caches</code> oslobađa samo čistu predmemoriju; prljave stranice ostaju. ' +
        'Slobodno raste, raspoloživo ne.</li>' +
        '<li>Nestanak struje briše ono što nije na disku; čista predmemorija ne gubi ništa.</li>' +
        '</ol>' +
        '<p>Izvan teme: nedostatak memorije, odlagalište i ubojica OOM, <code>O_DIRECT</code>, čitanje unaprijed, ' +
        'cgroupe.</p>'
    },
    en: {
      stage: 'RAM with the page cache, dirty pages, the disk, and the free -m and /proc/meminfo listings',

      // controls
      readMiB: 'Read the file a.dat',
      reread: 'Read a.dat again',
      writeMiB: 'Write the file b.dat',
      seconds: 'Seconds since the write',
      sync: 'sync',
      dropCaches: 'drop_caches',
      powerLoss: 'Power loss',
      ratios: 'Dirty marks',
      none: 'nothing',
      mib: '{n} MiB',
      sec: '{n} s',
      pct: '{n} %',
      decSep: '.',

      // presets
      pBookFree: 'The book\'s machine',
      pBookFreeHint: 'free 598, but available 1324 MiB.',
      pReadTwice: 'Read twice',
      pReadTwiceHint: '400 MiB twice: only 400 comes from the disk.',
      pSmallWrite: 'Small write',
      pSmallWriteHint: '100 MiB dirty; move the seconds to 30.',
      pBigWrite: 'Big write',
      pBigWriteHint: '500 MiB: background writeback from 132, throttled at 265.',
      pDropCaches: 'drop_caches',
      pDropCachesHint: 'free rises to 1324, available stays 1324.',
      pPowerLoss: 'Power loss',
      pPowerLossHint: '100 MiB, 10 s after the write; turn on sync and compare.',

      // legend
      legProc: 'process memory',
      legClean: 'clean cache',
      legDirty: 'dirty, clock = age',
      legWb: 'being written to disk',
      legFixed: 'cache that stays',
      legFree: 'free',
      legMark: 'mark',
      legLost: 'lost',
      legChanged: 'changed',

      // stage: RAM bar
      ram: 'RAM',
      segProc: 'processes',
      segFixed: 'stays',
      segOld: 'earlier files',
      segWb: 'to disk',
      segDirty: 'dirty',
      segFree: 'free',
      availLine: 'available = free + page cache that can be given back = {free} + {cache} = {avail} MiB',

      // stage: dirty gauge
      gauge: 'Dirty + Writeback',
      markBg: 'background',
      markLimit: 'limit',
      throttled: 'writer throttled',

      // stage: disk
      disk: 'Disk',
      diskRead: 'read from disk',
      diskWritten: 'written to disk',
      onDisk: 'on disk',
      partOnDisk: '{n} of {m} MiB on disk',
      lostPart: '{n} MiB lost',
      diskBusy: 'writing 25 MiB/s',
      diskIdle: 'idle',
      powerBanner: 'The power went at {t} s; this is the state at that moment.',

      // stage: what happened
      trace: 'What happened',
      noEvents: 'Nothing yet: read or write a file.',
      evRead: 'read, {size} MiB from the disk into the cache',
      evEvicted: '{n} MiB evicted from old cache',
      evReread: 'read again from the cache, 0 MiB from the disk',
      evWrite: 'write() of {size} MiB → dirty pages',
      evReturnedNow: 'write() returned at once',
      evReturnedAt: 'write() returned after {s} s',
      evBackground: 'dirty above {mark} MiB: background writeback starts at once',
      evThrottle: 'dirty + Writeback at {limit} MiB: the writer is throttled until {until} s',
      evExpire: 'tick at {tick} s: {size} MiB 30 s old goes to the disk',
      evSync: 'sync: {size} MiB to the disk, returned after {took} s',
      evDrop: 'drop_caches: {size} MiB of clean cache freed',
      evDropKept: '{kept} MiB dirty and Writeback stay',
      evPower: 'power loss: {lost} MiB lost',

      // captions
      cBook: 'The book\'s machine: only {free} MiB is free, but {avail} MiB is available, because the kernel gives back {cache} MiB of page cache as soon as memory is needed. That memory is not lost, only lent.',
      cRead: 'a.dat ({size} MiB) was read from the disk into the cache: free fell to {free} MiB, buff/cache grew to {bc} MiB, and available stayed at {avail} MiB.',
      cReread: 'The second read of a.dat came from the cache: {disk} MiB was read from the disk, not {twice}. Available is still {avail} MiB.',
      cDirty: 'write() has returned, but {dirty} MiB of b.dat is dirty: in memory, not on the disk ({written} of {size} MiB on disk). The pages are {age} s old; not above the {bg} MiB mark, they wait until they are 30 s old.',
      cBackground: 'Dirty went above the {bg} MiB mark, so the excess goes to the disk at once: {wb} MiB is being written (Writeback), {dirty} MiB waits. {written} of {size} MiB is on disk.',
      cThrottled: 'Dirty + Writeback reached the {limit} MiB limit: the writing process is throttled and waits for the disk, and write() returns only after {ret} s. {written} of {size} MiB is on disk.',
      cExpired: 'On the tick at {tick} s the pages turned 30 s old: {wb} MiB is being written to the disk (Writeback), dirty is 0. {written} of {size} MiB is on disk.',
      cWritten: 'All of b.dat ({size} MiB) is on disk, and its pages stay in memory as clean cache. Available is still {avail} MiB.',
      cSync: 'sync wrote {n} MiB and returned after {took} s, only once the disk had it: dirty is 0, Writeback 0, and b.dat is now clean cache.',
      cDrop: 'drop_caches freed {n} MiB of page cache: free rose to {free} and available stayed at {avail}. That memory was never lost, only lent.',
      cDropKept: '{kept} MiB of dirty pages and pages under writeback stays: drop_caches does not touch them.',
      cLost: 'The power went at {t} s: {lost} MiB of b.dat was not on the disk and is gone, although write() had already reported success. Clean cache lost nothing: the disk has it.',
      cLostMid: 'The power went at {t} s while the process was still writing: {lost} MiB of b.dat never reached the disk. Clean cache lost nothing: the disk has it.',
      cSafeNone: 'The power went and nothing was lost: nothing had been written, and clean cache is only a copy of what the disk already has.',
      cSafe: 'The power went and nothing was lost: everything written is on the disk ({written} MiB), and clean cache is only a copy of what the disk already has.',

      explain:
        '<p>Everything is in MiB. The start is the book\'s <code>free -h</code>: 1741 total, 598 free, 885 buff/cache, ' +
        '1324 available. Buff/cache is [[cache]], mostly page cache: the contents of files that were read or written. ' +
        '159 MiB of it cannot be freed (chosen to reproduce the book\'s line). The disk here writes 25 MiB/s.</p>' +
        '<ol>' +
        '<li><b>Available</b> = free + page cache that can be given back; <b>used</b> = total − available.</li>' +
        '<li>Reading a file that is not cached fills the cache from free memory (then from the oldest clean cache): free ' +
        'drops, available does not. Reading it again comes from the cache, without the disk.</li>' +
        '<li>A buffered write makes <b>dirty pages</b>, and <code>write()</code> returns before the disk gets anything.</li>' +
        '<li>Flusher threads wake every 5 s and send pages dirty for at least 30 s to the disk ' +
        '(<code>dirty_writeback_centisecs</code>, <code>dirty_expire_centisecs</code>); a page that turns 30 s old ' +
        'exactly on a tick goes on that tick. While the disk writes them they are <b>writeback</b>, then clean.</li>' +
        '<li>Above <code>dirty_background_ratio</code> (10 % of available, 132 MiB) the excess dirty goes to the disk at ' +
        'once; at <code>dirty_ratio</code> (20 %, 265 MiB) dirty + writeback is full and the writing process waits for ' +
        'the disk.</li>' +
        '<li><code>sync</code> writes everything not on disk and returns once the disk has it.</li>' +
        '<li><code>echo 1 &gt; /proc/sys/vm/drop_caches</code> frees clean cache only; dirty pages stay. Free rises, ' +
        'available does not.</li>' +
        '<li>A power loss wipes what is not on disk; clean cache loses nothing.</li>' +
        '</ol>' +
        '<p>Out of scope: running out of memory, swap and the OOM killer, <code>O_DIRECT</code>, readahead, cgroups.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
