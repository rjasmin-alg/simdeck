/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the multicore page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   single-page-labs/homogeni-multicore-simulator.html; English written for simdeck. Terms missing from kit/glossary.js
   are written out here: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Homogeni višejezgreni procesor: Amdahlov zakon, MESI i lažno dijeljenje',
      // controls
      view: 'Prikaz',
      viewAmdahl: 'Amdahl',
      viewMesi: 'MESI',
      viewFs: 'Lažno dijeljenje',
      parallel: 'Paralelizabilan udio',
      cores: 'Broj jezgri',
      writes: 'Broj upisa',
      writesHint: 'Jezgra 0 i jezgra 1 pišu naizmjence, jezgra 0 prva.',
      pad: 'Dopuna (64 B po brojaču)',
      padHint: 'Svaki brojač počinje na svojoj liniji predmemorije.',
      opSlot: 'Operacija {i}',
      keyR0: 'Jezgra 0 čita',
      keyW0: 'Jezgra 0 piše',
      keyR1: 'Jezgra 1 čita',
      keyW1: 'Jezgra 1 piše',
      keyUndo: 'Poništi zadnju operaciju',
      // presets
      presetAmdahl80: 'Amdahl: 80 %, 8 jezgri',
      presetAmdahl80Hint: 'Početni primjer: 20 % serijskog koda',
      presetAmdahl95: 'Amdahl: 95 %, 64 jezgre',
      presetAmdahl95Hint: 'I 5 % serijskog koda drži ubrzanje ispod 20×',
      presetMesiEmpty: 'MESI: prazne predmemorije',
      presetMesiEmptyHint: 'Obje kopije nevaljane (I); klikni Čitaj ili Piši',
      presetMesiShare: 'MESI: obje jezgre čitaju',
      presetMesiShareHint: 'Jezgra 0 dobiva E, a kad čita i jezgra 1, obje imaju S',
      presetMesiInval: 'MESI: upis poništava kopiju',
      presetMesiInvalHint: 'Obje čitaju, pa jezgra 0 piše: kopija u jezgri 1 postaje I',
      presetMesiPing: 'MESI: naizmjenični upisi',
      presetMesiPingHint: 'Linija skače između jezgri, svaki put uz pisanje natrag',
      presetFsShared: 'Lažno dijeljenje: bez dopune',
      presetFsSharedHint: 'Dva brojača na istoj liniji, osam upisa',
      presetFsPadded: 'Lažno dijeljenje: s dopunom',
      presetFsPaddedHint: 'Svaki brojač na svojoj liniji, osam upisa',
      // legend
      legendM: 'M izmijenjena',
      legendE: 'E isključiva',
      legendS: 'S dijeljena',
      legendI: 'I nevaljana',
      pct: '{v} %',
      // Amdahl
      meterSpeedup: 'Ubrzanje',
      meterEff: 'Efikasnost',
      meterEffSub: 'ubrzanje podijeljeno brojem jezgri',
      meterMax: 'Najviše (∞ jezgri)',
      meterMaxSub: 'granica 1 / (1 − p)',
      wall: 'Sekvencijalni zid: {serial} koda ne može biti paralelno, pa ubrzanje ne prelazi {max} bez obzira na broj jezgri.',
      chartTitle: 'Ubrzanje prema broju jezgri',
      axisN: 'broj jezgri',
      lineSpeedup: 'stvarno ubrzanje',
      lineMax: 'najviše (Amdahl)',
      point: 'sada: {v}',
      captionAmdahl: 'Jezgri: {n}. Ubrzanje {s}, efikasnost {e}. Serijski dio od {serial} ostaje isti, pa ni beskonačno jezgri ne daje više od {max}.',
      // MESI
      core: 'Jezgra {c}',
      read: 'Čitaj',
      write: 'Piši',
      nameM: 'Modified (izmijenjena)',
      nameE: 'Exclusive (isključiva)',
      nameS: 'Shared (dijeljena)',
      nameI: 'Invalid (nevaljana)',
      descM: 'jedina kopija, RAM je zastario',
      descE: 'jedina kopija, jednaka RAM-u',
      descS: 'kopiju ima i druga jezgra',
      descI: 'nema kopije',
      inCache: 'u predmemoriji',
      ram: 'RAM',
      ramStale: 'zastario: novija vrijednost je u predmemoriji',
      ramFresh: 'ažuran',
      logTitle: 'Događaji',
      logEmpty: 'Klikni Čitaj ili Piši na jezgri.',
      opsCount: 'Operacije: {n} od {max}',
      statHits: 'Pogoci',
      statMisses: 'Promašaji',
      statInval: 'Invalidacije',
      statWb: 'Pisanja natrag',
      undo: 'Poništi zadnju',
      clear: 'Isprazni predmemorije',
      full: 'Najviše {max} operacija: poništi zadnju ili isprazni predmemorije.',
      evReadHit: 'Jezgra {c} čita X = {v}: pogodak.',
      evReadMiss: 'Jezgra {c} čita X = {v}: promašaj, linija dolazi preko sabirnice.',
      evWriteHit: 'Jezgra {c} piše X = {v}: pogodak.',
      evWriteMiss: 'Jezgra {c} piše X = {v}: promašaj, jezgra traži liniju za upis.',
      evWriteUpgrade: 'Jezgra {c} piše X = {v}: ima dijeljenu kopiju, pa poništava ostale.',
      evWb: 'Jezgra {c} najprije piše X natrag u RAM.',
      evChange: 'jezgra {c}: {from}→{to}',
      whyReadHit: 'Kopija je valjana, sabirnica nije potrebna.',
      whyReadE: 'Nitko drugi nema kopiju, pa jezgra dobiva isključivu kopiju (E).',
      whyReadS: 'Druga jezgra ima kopiju, pa su sada obje dijeljene (S).',
      whyWriteM: 'Kopija je već izmijenjena: upis ostaje u predmemoriji, a RAM ostaje zastario.',
      whyWriteE: 'Isključiva kopija postaje izmijenjena (E→M) bez ikakvog prometa na sabirnici.',
      whyWriteUpgrade: 'Prije upisa kopija u drugoj jezgri postaje nevaljana (I).',
      whyWriteMiss: 'Kopija u drugoj jezgri postaje nevaljana; ova jezgra sada ima jedinu, izmijenjenu kopiju (M).',
      captionMesiEmpty: 'Obje predmemorije su prazne: kopije su nevaljane (I), a X = 0 je samo u RAM-u. Klikni Čitaj ili Piši na jezgri.',
      // false sharing
      memTitle: 'Raspored u memoriji: linija predmemorije = 64 B = 16 cijelih brojeva',
      line: 'Linija {l}',
      lineState: 'jezgra {c}:',
      cellKey0: 'dretva 0 na jezgri 0 piše counter[0]',
      cellKey1: 'dretva 1 na jezgri 1 piše counter[1]',
      cellKeyLast: 'zadnji upis',
      fsSame: 'Oba brojača su na istoj liniji.',
      fsApart: 'Svaki brojač je na svojoj liniji.',
      fsLast: 'Zadnji upis: jezgra {c} piše svoj brojač,',
      fsLastHit: 'pogodak bez sabirnice.',
      fsLastMiss: 'promašaj preko sabirnice.',
      fsWrites: 'Upisi',
      fsMisses: 'Promašaji',
      fsInval: 'Invalidacije',
      fsHits: 'Upisi bez sabirnice: {v}',
      fsHitsNone: 'Upisi bez sabirnice: još nema upisa',
      captionFsNone: 'Dvije dretve na dvije jezgre povećavaju svaka svoj brojač. Pomakni Broj upisa.',
      captionFsShared: 'Upisi: {k}, promašaji: {m}, invalidacije: {i}. Dretve ne dijele podatke, ali dijele liniju, pa svaki upis poništava kopiju druge jezgre.',
      captionFsPadded: 'Upisi: {k}, promašaji: {m}, invalidacije: {i}. Svaki brojač ima svoju liniju: nakon prvog promašaja svaka jezgra piše u svoju kopiju (M) bez sabirnice.',
      explain:
        '<h3>Amdahlov zakon</h3>' +
        '<p>Ako se udio <i>p</i> programa može izvoditi paralelno na <i>n</i> jezgri, a ostatak ostaje serijski, ' +
        '<em lang="en">speedup</em> (ubrzanje) je <code>S(n) = 1 / ((1 − p) + p / n)</code>. Kad <i>n</i> raste, <i>p / n</i> nestaje i ' +
        'ostaje granica <code>1 / (1 − p)</code>: s 20 % serijskog koda najviše 5×, s 5 % najviše 20×. Efikasnost <i>S / n</i> pada sa svakom ' +
        'novom jezgrom.</p>' +
        '<h3>Koherencija predmemorija: MESI</h3>' +
        '<p>Svaka jezgra ima svoju priručnu memoriju, [[cache]]. Kad dvije jezgre drže kopiju iste linije, upis jedne mora poništiti kopiju druge, inače bi druga ' +
        'čitala staru vrijednost. To je <em lang="en">cache coherence</em> (koherencija predmemorija). Protokol MESI daje svakoj kopiji ' +
        'jedno od četiri stanja: <em lang="en">Modified</em> (izmijenjena, RAM je zastario), <em lang="en">Exclusive</em> (jedina kopija, ' +
        'jednaka RAM-u), <em lang="en">Shared</em> (kopiju ima više jezgri) i <em lang="en">Invalid</em> (nema valjane kopije).</p>' +
        '<p>Čitanje s kopijom u bilo kojem stanju osim I je [[hit]]. Promašaj dohvaća liniju preko sabirnice, [[bus]]: ako je druga jezgra drži kao M, ' +
        'najprije je piše natrag u RAM, [[write-back]], i obje završe u S. Upis u E prelazi u M bez sabirnice; upis u S ili I poništava sve ' +
        'druge kopije (<em lang="en">invalidation</em>, invalidacija). RAM se ne mijenja dok izmijenjena kopija ne bude zapisana natrag.</p>' +
        '<h3>Lažno dijeljenje</h3>' +
        '<p>Koherencija radi s cijelim linijama (ovdje 64 B), ne s pojedinim varijablama. Dvije dretve koje pišu svaka svoj brojač ' +
        'ne dijele podatke, ali ako su brojači u istoj liniji, svaki upis poništava kopiju druge jezgre i linija skače između jezgri: ' +
        '<em lang="en">false sharing</em> (lažno dijeljenje). <em lang="en">Padding</em> (dopuna) od 64 B stavlja svaki brojač na svoju ' +
        'liniju; nakon prvog promašaja svaka jezgra piše u svoju izmijenjenu kopiju bez prometa na sabirnici.</p>'
    },
    en: {
      stage: 'Homogeneous multicore: Amdahl\'s law, MESI and false sharing',
      // controls
      view: 'View',
      viewAmdahl: 'Amdahl',
      viewMesi: 'MESI',
      viewFs: 'False sharing',
      parallel: 'Parallel share',
      cores: 'Number of cores',
      writes: 'Number of writes',
      writesHint: 'Core 0 and core 1 write in turn, core 0 first.',
      pad: 'Padding (64 B per counter)',
      padHint: 'Each counter starts a cache line of its own.',
      opSlot: 'Operation {i}',
      keyR0: 'Core 0 reads',
      keyW0: 'Core 0 writes',
      keyR1: 'Core 1 reads',
      keyW1: 'Core 1 writes',
      keyUndo: 'Undo the last operation',
      // presets
      presetAmdahl80: 'Amdahl: 80%, 8 cores',
      presetAmdahl80Hint: 'The starting example: 20% serial code',
      presetAmdahl95: 'Amdahl: 95%, 64 cores',
      presetAmdahl95Hint: 'Even 5% serial code keeps the speedup under 20×',
      presetMesiEmpty: 'MESI: empty caches',
      presetMesiEmptyHint: 'Both copies invalid (I); click Read or Write',
      presetMesiShare: 'MESI: both cores read',
      presetMesiShareHint: 'Core 0 gets E; when core 1 reads too, both hold S',
      presetMesiInval: 'MESI: a write invalidates',
      presetMesiInvalHint: 'Both read, then core 0 writes: the copy in core 1 becomes I',
      presetMesiPing: 'MESI: writes in turn',
      presetMesiPingHint: 'The line jumps between the cores, with a write-back each time',
      presetFsShared: 'False sharing: no padding',
      presetFsSharedHint: 'Two counters in one line, eight writes',
      presetFsPadded: 'False sharing: with padding',
      presetFsPaddedHint: 'Each counter in its own line, eight writes',
      // legend
      legendM: 'M modified',
      legendE: 'E exclusive',
      legendS: 'S shared',
      legendI: 'I invalid',
      pct: '{v}%',
      // Amdahl
      meterSpeedup: 'Speedup',
      meterEff: 'Efficiency',
      meterEffSub: 'speedup divided by the number of cores',
      meterMax: 'Maximum (∞ cores)',
      meterMaxSub: 'ceiling 1 / (1 − p)',
      wall: 'Sequential wall: {serial} of the code cannot run in parallel, so the speedup stays below {max} however many cores there are.',
      chartTitle: 'Speedup by number of cores',
      axisN: 'number of cores',
      lineSpeedup: 'actual speedup',
      lineMax: 'maximum (Amdahl)',
      point: 'now: {v}',
      captionAmdahl: 'Cores: {n}. Speedup {s}, efficiency {e}. The serial part of {serial} stays the same, so not even infinitely many cores give more than {max}.',
      // MESI
      core: 'Core {c}',
      read: 'Read',
      write: 'Write',
      nameM: 'Modified',
      nameE: 'Exclusive',
      nameS: 'Shared',
      nameI: 'Invalid',
      descM: 'only copy, RAM is stale',
      descE: 'only copy, same as RAM',
      descS: 'the other core has a copy too',
      descI: 'no copy',
      inCache: 'in the cache',
      ram: 'RAM',
      ramStale: 'stale: the newer value is in a cache',
      ramFresh: 'up to date',
      logTitle: 'Events',
      logEmpty: 'Click Read or Write on a core.',
      opsCount: 'Operations: {n} of {max}',
      statHits: 'Hits',
      statMisses: 'Misses',
      statInval: 'Invalidations',
      statWb: 'Write-backs',
      undo: 'Undo last',
      clear: 'Empty the caches',
      full: 'At most {max} operations: undo the last one or empty the caches.',
      evReadHit: 'Core {c} reads X = {v}: hit.',
      evReadMiss: 'Core {c} reads X = {v}: miss, the line comes over the bus.',
      evWriteHit: 'Core {c} writes X = {v}: hit.',
      evWriteMiss: 'Core {c} writes X = {v}: miss, the core fetches the line to write it.',
      evWriteUpgrade: 'Core {c} writes X = {v}: it has a shared copy, so it invalidates the others.',
      evWb: 'Core {c} first writes X back to RAM.',
      evChange: 'core {c}: {from}→{to}',
      whyReadHit: 'The copy is valid; the bus is not needed.',
      whyReadE: 'No other core has a copy, so this core gets an exclusive copy (E).',
      whyReadS: 'The other core has a copy, so both are now shared (S).',
      whyWriteM: 'The copy is already modified: the write stays in the cache and RAM stays stale.',
      whyWriteE: 'The exclusive copy becomes modified (E→M) with no bus traffic at all.',
      whyWriteUpgrade: 'Before the write, the copy in the other core becomes invalid (I).',
      whyWriteMiss: 'The copy in the other core becomes invalid; this core now has the only, modified copy (M).',
      captionMesiEmpty: 'Both caches are empty: the copies are invalid (I), and X = 0 is only in RAM. Click Read or Write on a core.',
      // false sharing
      memTitle: 'Memory layout: cache line = 64 B = 16 integers',
      line: 'Line {l}',
      lineState: 'core {c}:',
      cellKey0: 'thread 0 on core 0 writes counter[0]',
      cellKey1: 'thread 1 on core 1 writes counter[1]',
      cellKeyLast: 'last write',
      fsSame: 'Both counters are in the same line.',
      fsApart: 'Each counter has a line of its own.',
      fsLast: 'Last write: core {c} writes its counter,',
      fsLastHit: 'a hit with no bus.',
      fsLastMiss: 'a miss over the bus.',
      fsWrites: 'Writes',
      fsMisses: 'Misses',
      fsInval: 'Invalidations',
      fsHits: 'Writes without the bus: {v}',
      fsHitsNone: 'Writes without the bus: no writes yet',
      captionFsNone: 'Two threads on two cores each increment their own counter. Move Number of writes.',
      captionFsShared: 'Writes: {k}, misses: {m}, invalidations: {i}. The threads share no data, but they share a line, so every write invalidates the other core\'s copy.',
      captionFsPadded: 'Writes: {k}, misses: {m}, invalidations: {i}. Each counter has its own line: after its first miss, each core writes to its own copy (M) without the bus.',
      explain:
        '<h3>Amdahl\'s law</h3>' +
        '<p>If a share <i>p</i> of a program can run in parallel on <i>n</i> cores and the rest stays serial, the <em>speedup</em> is ' +
        '<code>S(n) = 1 / ((1 − p) + p / n)</code>. As <i>n</i> grows, <i>p / n</i> vanishes and the ceiling <code>1 / (1 − p)</code> ' +
        'remains: with 20% serial code at most 5×, with 5% at most 20×. The efficiency <i>S / n</i> drops with every core added.</p>' +
        '<h3>Cache coherence: MESI</h3>' +
        '<p>Each core has its own [[cache]]. When two cores hold a copy of the same line, a write by one must invalidate the copy of the ' +
        'other, or the other would read an old value. That is <em>cache coherence</em>. The MESI protocol gives every copy one of four ' +
        'states: <em>Modified</em> (RAM is stale), <em>Exclusive</em> (the only copy, same as RAM), <em>Shared</em> (several cores ' +
        'have a copy) and <em>Invalid</em> (no valid copy).</p>' +
        '<p>A read with a copy in any state but I is a [[hit]]. A miss fetches the line over the [[bus]]: if the other core holds it as M, ' +
        'that core first writes it back to RAM, a [[write-back]], and both end in S. A write to E becomes M without the bus; a write to S ' +
        'or I invalidates every other copy (<em>invalidation</em>). RAM does not change until a modified copy is written back.</p>' +
        '<h3>False sharing</h3>' +
        '<p>Coherence works on whole lines (64 B here), not on single variables. Two threads that each write their own counter ' +
        'share no data, but if the counters are in the same line, every write invalidates the other core\'s copy and the line jumps ' +
        'between the cores: <em>false sharing</em>. <em>Padding</em> of 64 B puts each counter in a line of its own; after the first ' +
        'miss, each core writes to its own modified copy with no bus traffic.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
