/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of mesi-coherence, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term (first mention; [[=term]] later ones). Core names (C0 …), X, the state letters and the bus
   transactions (BusRd, BusRdX, BusUpgr) are not language: the page puts them in translate="no" elements.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Linija X u predmemorijama jezgri, sabirnica i RAM',
      cores: 'Broj jezgri',
      coresHint: 'Operacije jezgri koje ne postoje izostavljaju se.',
      presetClassic: 'Klasični slijed',
      presetClassicHint: 'C0 čita, C1 čita, C0 piše, C1 čita (2 jezgre)',
      presetSilent: 'Tihi prijelaz E → M',
      presetSilentHint: 'Pisanje u stanju E ne treba sabirnicu (2 jezgre)',
      presetPing: 'Ping-pong pisanja',
      presetPingHint: 'C0 i C1 naizmjence pišu istu liniju (2 jezgre)',
      presetReaders: 'Tri čitača i pisac',
      presetReadersHint: 'Tri kopije S, pa jedno pisanje (3 jezgre)',
      legM: 'izmijenjena',
      legE: 'isključiva',
      legS: 'dijeljena',
      legI: 'nevaljana',
      legBus: 'transakcija na sabirnici',
      legWb: 'pisanje natrag',
      legChanged: 'promijenjeno u ovom koraku',
      ram: 'RAM',
      stale: 'zastarjelo',
      fresh: 'ažurno',
      bus: 'sabirnica',
      noCopy: 'nema kopije',
      read: 'čitaj',
      write: 'piši',
      reads: 'čita',
      writes: 'piše',
      hit: 'pogodak',
      wb: 'natrag u RAM',
      snoops: 'njuška',
      opR: 'Č',
      opW: 'P',
      seqTitle: 'Slijed (Č čita, P piše)',
      seqNone: 'Nema operacija: zadaj ih gumbima ispod jezgri.',
      diagram: 'Dijagram stanja',
      thisStep: 'U ovom koraku',
      noChange: 'nijedno se stanje ne mijenja',
      counts: 'Brojači',
      cntHits: 'Pogoci',
      cntBus: 'Transakcije na sabirnici',
      cntInval: 'Poništavanja (→ I)',
      cntDown: 'Snižavanja (M/E → S)',
      cntWb: 'Pisanja natrag',
      stateLabel: '{core}: stanje {st}',
      opLabel: 'Korak {n}: {core} {op}',
      readBtn: '{core} čita',
      writeBtn: '{core} piše',
      keyRead: 'jezgra {k} čita (dodaj iza trenutnog koraka)',
      keyWrite: 'jezgra {k} piše (dodaj iza trenutnog koraka)',
      and: ' i ',
      capStart: 'Nijedna jezgra nema kopiju linije {x} (sve su I), a RAM drži {x} = {mem}. Pritisni → ili zadaj operaciju gumbima ispod jezgri.',
      capNone: 'Nema operacija za ovaj broj jezgri: zadaj ih gumbima ispod jezgri.',
      capReadHit: '{core} čita u stanju {st}: pogodak u vlastitoj predmemoriji, sabirnica miruje i nijedno se stanje ne mijenja.',
      capReadMiss: '{core} čita, a nema kopiju (I): na sabirnicu ide {bus}.',
      capFlushS: '{other} je drži u M: prvo je piše natrag u RAM ({x} = {v}) i prelazi u S.',
      capDownE: '{other} prelazi iz E u S.',
      capGetS: '{core} je sada S: liniju dijeli s drugima.',
      capGetE: 'Nitko drugi nema kopiju, pa je {core} sada E: jedina kopija, jednaka RAM-u.',
      capWriteM: '{core} piše u stanju M: pogodak, sabirnica miruje. {x} = {v} je samo u {core}, a RAM je zastario.',
      capWriteE: '{core} piše u stanju E: tiho prelazi u M, bez poruke na sabirnici. Upravo zato postoji E. RAM je zastario.',
      capWriteS: '{core} piše u stanju S: na sabirnicu ide {bus}, {inv}. {core} je sada M, a RAM je zastario.',
      capWriteMiss: '{core} piše, a nema kopiju (I): na sabirnicu ide {bus}.',
      capFlushI: '{other} je drži u M: prvo je piše natrag u RAM ({x} = {v}).',
      capInvalMiss: '{inv}.',
      capAlone: 'Nitko drugi nema kopiju.',
      capNowM: '{core} je sada M ({x} = {v}), a RAM je zastario.',
      invOne: 'kopija u {list} postaje I',
      invMany: 'kopije u {list} postaju I',
      invOneCap: 'Kopija u {list} postaje I',
      invManyCap: 'Kopije u {list} postaju I',
      full: 'Slijed ima najviše 20 operacija: vrati se korak unatrag ili učitaj primjer.',
      explain: '<p>Svaka jezgra ima svoju [[cache]], pa ista linija X može biti u više kopija. ' +
        '<i>Cache coherence</i> (koherencija predmemorije) znači da sve jezgre vide istu, najnoviju vrijednost. ' +
        'Protokol MESI to postiže <i>snoopingom</i> (njuškanjem sabirnice): svaka predmemorija prati [[bus]] i ' +
        'mijenja stanje svoje kopije kad druga jezgra zatraži liniju.</p>' +
        '<p><b>M</b> (<i>Modified</i>): jedina kopija, izmijenjena, RAM je zastario. <b>E</b> (<i>Exclusive</i>): ' +
        'jedina kopija, jednaka RAM-u. <b>S</b> (<i>Shared</i>): jedna od više jednakih kopija. <b>I</b> (<i>Invalid</i>): ' +
        'kopije nema.</p>' +
        '<p>Čitanje bez kopije šalje <i>BusRd</i>; jezgra u M prvo radi [[write-back]], pa svi prelaze u S. Pisanje u S ' +
        'šalje <i>BusUpgr</i>, a pisanje bez kopije <i>BusRdX</i>: sve ostale kopije postaju I. To je <i>invalidation</i> ' +
        '(poništavanje). Prijelaz M ili E u S je samo snižavanje: kopija ostaje valjana.</p>' +
        '<p><b>Česte zablude.</b> Pisanje ne osvježava kopije drugih jezgri, nego ih poništava. RAM nije uvijek ' +
        'ažuran: dok je neka jezgra u M, zastario je. Stanje E nije suvišno: pisanje u E prelazi u M bez ijedne ' +
        'poruke na sabirnici (primjer 2), dok bi u S trebalo poslati <i>BusUpgr</i>.</p>' +
        '<p>Izvan ovog prikaza: MOESI i MESIF, direktoriji, izbacivanje linija i lažno dijeljenje (simulator ' +
        '„Homogeni višejezgreni procesor”).</p>'
    },
    en: {
      stage: 'Line X in the cores\' caches, the bus and RAM',
      cores: 'Number of cores',
      coresHint: 'Operations of cores that do not exist are left out.',
      presetClassic: 'The classic walk-through',
      presetClassicHint: 'C0 reads, C1 reads, C0 writes, C1 reads (2 cores)',
      presetSilent: 'Silent upgrade E → M',
      presetSilentHint: 'A write in state E needs no bus message (2 cores)',
      presetPing: 'Write ping-pong',
      presetPingHint: 'C0 and C1 take turns writing the same line (2 cores)',
      presetReaders: 'Readers and a writer',
      presetReadersHint: 'Three S copies, then one write (3 cores)',
      legM: 'modified',
      legE: 'exclusive',
      legS: 'shared',
      legI: 'invalid',
      legBus: 'bus transaction',
      legWb: 'write-back',
      legChanged: 'changed in this step',
      ram: 'RAM',
      stale: 'stale',
      fresh: 'current',
      bus: 'bus',
      noCopy: 'no copy',
      read: 'read',
      write: 'write',
      reads: 'reads',
      writes: 'writes',
      hit: 'hit',
      wb: 'back to RAM',
      snoops: 'snoops',
      opR: 'R',
      opW: 'W',
      seqTitle: 'Sequence (R read, W write)',
      seqNone: 'No operations: add them with the buttons under the cores.',
      diagram: 'State diagram',
      thisStep: 'In this step',
      noChange: 'no state changes',
      counts: 'Counters',
      cntHits: 'Hits',
      cntBus: 'Bus transactions',
      cntInval: 'Invalidations (→ I)',
      cntDown: 'Downgrades (M/E → S)',
      cntWb: 'Write-backs',
      stateLabel: '{core}: state {st}',
      opLabel: 'Step {n}: {core} {op}',
      readBtn: '{core} reads',
      writeBtn: '{core} writes',
      keyRead: 'core {k} reads (add after the current step)',
      keyWrite: 'core {k} writes (add after the current step)',
      and: ' and ',
      capStart: 'No core has a copy of line {x} (all are I), and RAM holds {x} = {mem}. Press → or add an operation with the buttons under the cores.',
      capNone: 'No operations for this number of cores: add them with the buttons under the cores.',
      capReadHit: '{core} reads in state {st}: a hit in its own cache, the bus stays quiet and no state changes.',
      capReadMiss: '{core} reads without a copy (I): a {bus} goes on the bus.',
      capFlushS: '{other} holds it in M: it first writes it back to RAM ({x} = {v}) and goes to S.',
      capDownE: '{other} goes from E to S.',
      capGetS: '{core} is now S: it shares the line with others.',
      capGetE: 'Nobody else has a copy, so {core} is now E: the only copy, equal to RAM.',
      capWriteM: '{core} writes in state M: a hit, the bus stays quiet. {x} = {v} is only in {core}, and RAM is stale.',
      capWriteE: '{core} writes in state E: it silently goes to M, with no message on the bus. That is why E exists. RAM is stale.',
      capWriteS: '{core} writes in S: a {bus} goes on the bus and {inv}. {core} is now M and RAM is stale.',
      capWriteMiss: '{core} writes without a copy (I): a {bus} goes on the bus.',
      capFlushI: '{other} holds it in M: it first writes it back to RAM ({x} = {v}).',
      capInvalMiss: '{inv}.',
      capAlone: 'Nobody else has a copy.',
      capNowM: '{core} is now M ({x} = {v}), and RAM is stale.',
      invOne: 'the copy in {list} becomes I',
      invMany: 'the copies in {list} become I',
      invOneCap: 'The copy in {list} becomes I',
      invManyCap: 'The copies in {list} become I',
      full: 'The sequence holds at most 20 operations: step back or load an example.',
      explain: '<p>Every core has its own [[cache]], so the same line X can exist in several copies. ' +
        '<i>Cache coherence</i> means that every core sees the same, newest value. The MESI protocol gets there by ' +
        '<i>snooping</i>: every cache watches the [[bus]] and changes the state of its copy when another core asks for ' +
        'the line.</p>' +
        '<p><b>M</b> (<i>Modified</i>): the only copy, changed, RAM is stale. <b>E</b> (<i>Exclusive</i>): the only ' +
        'copy, equal to RAM. <b>S</b> (<i>Shared</i>): one of several equal copies. <b>I</b> (<i>Invalid</i>): no ' +
        'copy.</p>' +
        '<p>A read without a copy sends <i>BusRd</i>; a core in M first does a [[write-back]], and all end in S. A ' +
        'write in S sends <i>BusUpgr</i>, a write without a copy <i>BusRdX</i>: every other copy becomes I. That is ' +
        'an <i>invalidation</i>. M or E going to S is only a downgrade: the copy stays valid.</p>' +
        '<p><b>Common mistakes.</b> A write does not update the other cores\' copies; it invalidates them. RAM is not ' +
        'always current: while a core is in M, it is stale. E is not redundant: a write in E goes to M without a single ' +
        'bus message (example 2), where S would have to send a <i>BusUpgr</i>.</p>' +
        '<p>Not shown here: MOESI and MESIF, directories, evicting lines, and false sharing (the "Homogeneous ' +
        'multicore" simulator).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
