/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of write-cache, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node or a value), an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term (first mention; [[=term]] later ones), *term* an English term the glossary lacks, set in
   italics by the page (the Croatian term rule; NOTES.md, Term pairs). Write labels (A, B, X, D, C) are data. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Aplikacija, upravljač s predmemorijom i disk',
      dec: ',',
      ms: '{v} ms',

      // controls
      policy: 'Način pisanja',
      polWT: 'izravno',
      polWB: 'odgođeno',
      bbu: 'Baterija predmemorije',
      bbuOff: 'nema',
      bbuOn: 'ispravna',
      bbuFailed: 'neispravna',
      pattern: 'Pisanja',
      patSix: 'šest blokova',
      patJournal: 'dnevnik',
      patRewrite: 'isti blok dvaput',
      flush: 'Flush + FUA',
      diskMs: 'Upis na disk',
      cutAt: 'Nestanak struje',
      cutNow: 'Isključi struju sada',

      presetWT: 'Izravno pisanje',
      presetWTHint: 'Potvrda tek s diska: sporo, ništa potvrđeno se ne gubi.',
      presetWB: 'Odgođeno, bez baterije',
      presetWBHint: 'Brze potvrde; nestanak struje briše prljave blokove.',
      presetBBU: 'Odgođeno, s baterijom',
      presetBBUHint: 'Iste brze potvrde; blokovi čekaju struju u predmemoriji.',
      presetReorder: 'Redoslijed: dnevnik',
      presetReorderHint: 'Zaključni zapis stigne na disk prije podataka. Zatim uključi Flush + FUA.',
      presetFailed: 'Baterija neispravna',
      presetFailedHint: 'Upravljač se vraća na izravno pisanje.',

      // legend
      legDirty: 'prljavi blok (samo u predmemoriji)',
      legClean: 'na disku',
      legAck: 'potvrđeno aplikaciji',
      legLost: 'izgubljeno',
      legBattery: 'baterija',
      legChanged: 'u ovom koraku',

      // stage
      appTitle: 'Aplikacija',
      cacheTitle: 'Predmemorija upravljača (DRAM)',
      diskTitle: 'Disk',
      timeTitle: 'Vremenska crta',
      wait: 'čeka',
      notYet: 'još nije',
      waitFlush: 'čeka flush',
      flushOp: 'flush',
      flushWaits: 'čeka disk',
      flushDone: 'gotovo',
      neverSent: 'nije poslano',
      unackedShort: 'nepotvrđeno',
      ackAt: '✓ {t}',
      empty: 'prazno',
      cacheEmptied: 'ispražnjeno nestankom struje',
      writing: 'piše se',
      head: 'glava',
      old: 'staro',
      bbuNone: 'bez baterije',
      bbuOk: 'baterija ispravna',
      bbuBad: 'baterija neispravna',
      runsWT: 'piše izravno',
      powerOn: 'struja: uključena',
      powerOff: 'struja: NEMA',
      powerBack: 'struja: vraćena',
      cutMark: 'nestanak struje',
      axis: 'ms',
      wX: 'druga datoteka',
      wD: 'podaci',
      wC: 'zaključni zapis',

      // card
      cardSoFar: 'Dosad',
      cardCut: 'Pri nestanku struje',
      cardAfter: 'Nakon povratka struje',
      rAck: 'potvrđeno',
      rDisk: 'na disku',
      rDiskNoAck: 'na disku, bez potvrde',
      rLost: 'izgubljeno',
      rUnacked: 'nepotvrđeno (aplikacija zna)',
      rWaiting: 'prljavo u predmemoriji',
      rReplaced: 'zamijenjeno novijim',
      rNever: 'nije ni poslano',
      rMean: 'prosječno do potvrde',
      jTitle: 'Dnevnik na disku',
      jNew: 'nova transakcija, dosljedno',
      jOld: 'staro stanje, dosljedno',
      jCorrupt: 'zaključni zapis bez podataka: neispravno',
      jPending: 'još nije gotovo',

      // captions
      cap0WB: 'Aplikacija šalje {n}, jedno svake milisekunde. Upravljač radi kao *write-back* (odgođeno upisivanje): potvrđuje čim je blok u predmemoriji. Pritisni → za sljedeći korak.',
      cap0WT: 'Aplikacija šalje {n}, jedno svake milisekunde. Upravljač radi kao *write-through* (izravno upisivanje): potvrđuje tek kad je blok na disku. Pritisni → za sljedeći korak.',
      cap0Fallback: 'Aplikacija šalje {n}, jedno svake milisekunde. Postavljeno je *write-back*, ali baterija je neispravna pa upravljač piše izravno (*write-through*). Pritisni →.',
      nWrites: ['{n} pisanje', '{n} pisanja', '{n} pisanja'],
      capT: 't = {t}:',
      capAckWB: '{w} je u predmemoriji i potvrđeno za 0,1 ms; ostaje prljavo dok ga disk ne upiše.',
      capFwd: '{w} ide prema disku; aplikacija čeka potvrdu.',
      capFua: 'Zaključni zapis {w} ide s FUA: potvrda tek kad bude na disku.',
      capSupersede: '{w} zamjenjuje {old} u predmemoriji: jedan upis na disk umjesto dva.',
      capFlush: 'Aplikacija traži *flush* (pražnjenje predmemorije) i čeka da sve dosad bude na disku.',
      capFlushDone: '*Flush* je gotov: sve prije njega je na disku.',
      capDurable: 'Disk je upisao {w}.',
      capDurableAck: 'Disk je upisao {w}; tek sada aplikacija dobiva potvrdu, nakon {lat}.',
      capStart: 'Sljedeći je {w}: najniži LBA iznad glave ([[elevator algorithm]]).',
      capStartWrap: 'Iznad glave nema ništa pa se glava vraća na najniži LBA: {w}.',
      capCutWB: 'Nestanak struje u {t}! Upravljač je potvrdio {n}, ali na disku {d}. Predmemorija bez baterije gubi {lost}, a aplikacija misli da je sve zapisano.',
      capCutBBU: 'Nestanak struje u {t}. Baterija čuva predmemoriju: {k} čekaju povratak struje.',
      capCutWT: ['Nestanak struje u {t}. {n} pisanje nikad nije potvrđeno, pa aplikacija zna da nije zapisano. Sve potvrđeno je na disku.',
        'Nestanak struje u {t}. {n} pisanja nikad nisu potvrđena, pa aplikacija zna da nisu zapisana. Sve potvrđeno je na disku.',
        'Nestanak struje u {t}. {n} pisanja nikad nije potvrđeno, pa aplikacija zna da nisu zapisana. Sve potvrđeno je na disku.'],
      capCutClean: 'Nestanak struje u {t}. Sve potvrđeno već je na disku: ništa se ne gubi.',
      nBlocks: ['{n} prljavi blok', '{n} prljava bloka', '{n} prljavih blokova'],
      nAcked: ['{n} pisanje', '{n} pisanja', '{n} pisanja'],
      nOnDisk: ['je tek {n}', 'su tek {n}', 'je tek {n}'],
      nOnDisk0: 'nije nijedno',
      nLost: ['{n} potvrđeno pisanje', '{n} potvrđena pisanja', '{n} potvrđenih pisanja'],
      capRestore: 'Struja se vratila. Predmemorija je prazna; izgubljeno: {lost}.',
      capRestoreNone: 'Struja se vratila. Ništa potvrđeno nije izgubljeno.',
      capRestoreBBUn: ['Struja se vratila. S baterijom je {n} prljavi blok čekao u predmemoriji i sad se upisuje na disk.', 'Struja se vratila. S baterijom su {n} prljava bloka čekala u predmemoriji i sad se upisuju na disk.', 'Struja se vratila. S baterijom je {n} prljavih blokova čekalo u predmemoriji i sad se upisuju na disk.'],
      capDone: 'Sve je na disku; ništa potvrđeno nije izgubljeno.',
      capDoneSent: 'Sve poslano je na disku; ništa potvrđeno nije izgubljeno.',
      capJCorrupt: 'Na disku je zaključni zapis C bez svojih podataka D: dnevnik će ponoviti transakciju čijih podataka nema.',
      capJOld: 'Podaci D su na disku, zaključni zapis nije: dnevnik zanemaruje nedovršenu transakciju, staro stanje je dosljedno.',
      capJNew: 'Podaci i zaključni zapis su na disku: transakcija je dovršena.',

      explain: '<p>Upravljač diska ima [[cache]] (DRAM). Uz <em lang="en">write-through</em> (izravno upisivanje) potvrđuje ' +
        'pisanje tek kad ga disk upiše: aplikacija čeka oko 8 ms po bloku, a u redu i dulje. Uz <em lang="en">write-back</em> ' +
        '(odgođeno upisivanje) potvrđuje čim je blok u [[=cache]]: potvrda stiže za 0,1 ms, a blok ostaje ' +
        '<em lang="en">dirty</em> (prljav) dok ga disk ne upiše.</p>' +
        '<p><b>Potvrđeno ne znači na disku.</b> Nestanak struje prazni običnu DRAM [[=cache]]: svako potvrđeno, a neupisano ' +
        'pisanje je izgubljeno. S baterijom ili flash modulom prljavi blokovi prežive i upisuju se kad se struja vrati; zato ' +
        'je <em lang="en">write-back</em> s baterijom uobičajena postavka. Dok je baterija neispravna ili se puni, mnogi ' +
        'upravljači pišu izravno.</p>' +
        '<p>Disk upisuje prljave blokove redom po LBA ([[elevator algorithm]]), ne redom pisanja. Dnevnik ([[journaling]]) ' +
        'zato prije zaključnog zapisa traži <em lang="en">flush</em> (pražnjenje predmemorije), a zaključni zapis šalje s ' +
        'FUA (potvrda tek s diska). I sam disk ima svoju predmemoriju, pa vrijedi isto i za nju.</p>'
    },
    en: {
      stage: 'Application, controller with cache, and disk',
      dec: '.',
      ms: '{v} ms',

      policy: 'Write policy',
      polWT: 'write-through',
      polWB: 'write-back',
      bbu: 'Cache battery',
      bbuOff: 'none',
      bbuOn: 'working',
      bbuFailed: 'failed',
      pattern: 'Writes',
      patSix: 'six blocks',
      patJournal: 'journal',
      patRewrite: 'same block twice',
      flush: 'Flush + FUA',
      diskMs: 'Disk write',
      cutAt: 'Power cut',
      cutNow: 'Cut the power now',

      presetWT: 'Write-through',
      presetWTHint: 'Acknowledged only from disk: slow, nothing acknowledged is lost.',
      presetWB: 'Write-back, no battery',
      presetWBHint: 'Fast acks; a power cut wipes the dirty blocks.',
      presetBBU: 'Write-back with battery',
      presetBBUHint: 'The same fast acks; the blocks wait for power in cache.',
      presetReorder: 'Order: a journal',
      presetReorderHint: 'The commit record reaches the disk before the data. Then turn on Flush + FUA.',
      presetFailed: 'Battery failed',
      presetFailedHint: 'The controller falls back to write-through.',

      legDirty: 'dirty block (only in cache)',
      legClean: 'on disk',
      legAck: 'acknowledged to the application',
      legLost: 'lost',
      legBattery: 'battery',
      legChanged: 'in this step',

      appTitle: 'Application',
      cacheTitle: 'Controller cache (DRAM)',
      diskTitle: 'Disk',
      timeTitle: 'Timeline',
      wait: 'waiting',
      notYet: 'not yet',
      waitFlush: 'waits for flush',
      flushOp: 'flush',
      flushWaits: 'waits for disk',
      flushDone: 'done',
      neverSent: 'never sent',
      unackedShort: 'no ack',
      ackAt: '✓ {t}',
      empty: 'empty',
      cacheEmptied: 'emptied by the power cut',
      writing: 'writing',
      head: 'head',
      old: 'old',
      bbuNone: 'no battery',
      bbuOk: 'battery working',
      bbuBad: 'battery failed',
      runsWT: 'writes through',
      powerOn: 'power: on',
      powerOff: 'power: OFF',
      powerBack: 'power: back',
      cutMark: 'power cut',
      axis: 'ms',
      wX: 'another file',
      wD: 'data',
      wC: 'commit record',

      cardSoFar: 'So far',
      cardCut: 'At the power cut',
      cardAfter: 'After power returns',
      rAck: 'acknowledged',
      rDisk: 'on disk',
      rDiskNoAck: 'on disk, never acknowledged',
      rLost: 'lost',
      rUnacked: 'not acknowledged (the app knows)',
      rWaiting: 'dirty in cache',
      rReplaced: 'replaced by a newer write',
      rNever: 'never sent',
      rMean: 'mean time to ack',
      jTitle: 'Journal on disk',
      jNew: 'new transaction, consistent',
      jOld: 'old state, consistent',
      jCorrupt: 'commit without its data: corrupt',
      jPending: 'not finished yet',

      cap0WB: 'The application sends {n}, one every millisecond. The controller runs *write-back*: it acknowledges as soon as a block is in cache. Press → for the next step.',
      cap0WT: 'The application sends {n}, one every millisecond. The controller runs *write-through*: it acknowledges only once a block is on disk. Press → for the next step.',
      cap0Fallback: 'The application sends {n}, one every millisecond. *Write-back* is set, but the battery has failed, so the controller writes through (*write-through*). Press →.',
      nWrites: ['{n} write', '{n} writes'],
      capT: 't = {t}:',
      capAckWB: '{w} is in cache and acknowledged after 0.1 ms; it stays dirty until the disk writes it.',
      capFwd: '{w} goes on to the disk; the application waits for the ack.',
      capFua: 'The commit record {w} goes with FUA: acknowledged only once it is on disk.',
      capSupersede: '{w} replaces {old} in cache: one disk write instead of two.',
      capFlush: 'The application asks for a *flush* and waits until everything so far is on disk.',
      capFlushDone: 'The *flush* is done: everything before it is on disk.',
      capDurable: 'The disk has written {w}.',
      capDurableAck: 'The disk has written {w}; only now does the application get its ack, after {lat}.',
      capStart: 'Next is {w}: the lowest LBA above the head ([[elevator algorithm]]).',
      capStartWrap: 'Nothing is above the head, so it goes back to the lowest LBA: {w}.',
      capCutWB: 'Power cut at {t}! The controller acknowledged {n}, but {d} on disk. Without a battery the cache loses {lost}, and the application thinks it was all written.',
      capCutBBU: 'Power cut at {t}. The battery keeps the cache: {k} wait for power to return.',
      capCutWT: ['Power cut at {t}. {n} write was never acknowledged, so the application knows it was not written. Everything acknowledged is on disk.',
        'Power cut at {t}. {n} writes were never acknowledged, so the application knows they were not written. Everything acknowledged is on disk.'],
      capCutClean: 'Power cut at {t}. Everything acknowledged is already on disk: nothing is lost.',
      nBlocks: ['{n} dirty block', '{n} dirty blocks'],
      nAcked: ['{n} write', '{n} writes'],
      nOnDisk: ['only {n} is', 'only {n} are'],
      nOnDisk0: 'none is',
      nLost: ['{n} acknowledged write', '{n} acknowledged writes'],
      capRestore: 'Power is back. The cache is empty; lost: {lost}.',
      capRestoreNone: 'Power is back. Nothing acknowledged was lost.',
      capRestoreBBUn: ['Power is back. With the battery, the {n} dirty block waited in cache and is now written to disk.', 'Power is back. With the battery, the {n} dirty blocks waited in cache and are now written to disk.'],
      capDone: 'Everything is on disk; nothing acknowledged was lost.',
      capDoneSent: 'Everything sent is on disk; nothing acknowledged was lost.',
      capJCorrupt: 'The disk has the commit record C without its data D: the journal will replay a transaction whose data is missing.',
      capJOld: 'The data D is on disk, the commit record is not: the journal ignores the unfinished transaction, and the old state is consistent.',
      capJNew: 'Data and commit record are on disk: the transaction is complete.',

      explain: '<p>The disk controller has a [[cache]] (DRAM). With <em>write-through</em> it acknowledges a write only once ' +
        'the disk has it: the application waits about 8 ms per block, longer in a queue. With <em>write-back</em> it ' +
        'acknowledges as soon as the block is in [[=cache]]: the ack comes after 0.1 ms, and the block stays ' +
        '<em>dirty</em> until the disk writes it.</p>' +
        '<p><b>Acknowledged does not mean on disk.</b> A power cut empties a plain DRAM [[=cache]]: every acknowledged but ' +
        'unwritten write is lost. With a battery or a flash module the dirty blocks survive and are written when power ' +
        'returns, which is why write-back with a battery is the normal setting. While the battery has failed or is ' +
        'charging, many controllers write through.</p>' +
        '<p>The disk writes dirty blocks in LBA order ([[elevator algorithm]]), not in the order they were written. So a ' +
        '[[journaling]] file system asks for a <em>flush</em> before its commit record and sends the commit with FUA ' +
        '(acknowledged only from disk). The drive itself has a cache of its own, and the same holds for it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
