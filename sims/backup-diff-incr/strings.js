/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of backup-diff-incr, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   [[term]] is a glossary term (kit/glossary.js); *word* marks an English term in italics on the Croatian page for a
   term the glossary lacks (the page turns it into <em lang="en">; NOTES.md, "Term pairs").
   Day names are lists split on "|" (Sunday … Thursday), one per grammatical case the Croatian sentences need.
   Data (block numbers, content labels such as B2) is not language: the page shows it with translate="no".
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Disk od osam blokova, noćne kopije od nedjelje do četvrtka i vraćeni disk',

      daysNom: 'nedjelja|ponedjeljak|utorak|srijeda|četvrtak',
      daysGen: 'nedjelje|ponedjeljka|utorka|srijede|četvrtka',
      daysAcc: 'nedjelju|ponedjeljak|utorak|srijedu|četvrtak',
      daysShort: 'ned|pon|uto|sri|čet',
      and: 'i',

      // params
      mode: 'Noćna kopija',
      modeIncr: 'prirasna',
      modeDiff: 'diferencijalna',
      modeFull: 'potpuna svake noći',
      compare: 'Usporedi prirasne i diferencijalne',
      compareHint: 'Jedne pokraj drugih; izbor noćne kopije tada se ne gleda.',
      restoreDay: 'Vrati disk na',
      lose: 'Izgubljena kopija',
      loseNone: 'nijedna',

      // presets
      presetIncr: 'Tjedan prirasnih',
      presetIncrHint: 'Jeftino spremiti, skupo vratiti.',
      presetDiff: 'Tjedan diferencijalnih',
      presetDiffHint: 'Svake noći sve više, oporavak iz dvije.',
      presetFull: 'Potpuna svake noći',
      presetFullHint: 'Najviše spremljeno, oporavak iz jedne.',
      presetLost: 'Izgubljen utorak',
      presetLostHint: 'Prirasni niz s rupom.',
      presetCompare: 'Usporedba',
      presetCompareHint: 'Prirasne i diferencijalne istodobno.',

      // legend
      legChanged: 'u ovom koraku',
      legStored: 'spremljen u kopiji',
      legSlot: 'nije spremljen',
      legRestored: 'vraćen, ispod dan kopije',
      legLost: 'izgubljena kopija',
      legStale: 'nije kao na disku',
      legLink: 'kopija koja se vraća',

      // stage
      diskTitle: 'Disk',
      diskToday: 'danas: {day}',
      diskTarget: 'cilj oporavka: {day}',
      diskEmpty: 'još prazan',
      cntChanged: 'promijenjeno od zadnje kopije {a}, od potpune {b}',
      laneIncr: 'Prirasne kopije',
      laneDiff: 'Diferencijalne kopije',
      laneFull: 'Potpuna kopija svake noći',
      lnIncr: 'Prirasno',
      lnDiff: 'Diferencijalno',
      lnFull: 'Potpuno',
      tagLevel0: 'razina 0',
      tagIncr: 'prirasna',
      tagDiff: 'diferencijalna',
      tagFull: 'potpuna',
      tagLost: 'izgubljena',
      cntStored: ['spremljen {n} blok', 'spremljena {n} bloka', 'spremljeno {n} blokova'],
      rowRest: 'vraćeno',
      restNone: 'Oporavak: još nije počeo',
      restLine: 'Oporavak: kopija {a} od {b}, pročitano blokova {r}',
      asideOk: 'isto kao disk',
      asideGap: 'stanje: {day}',
      asideNothing: 'ništa',

      // captions
      capStart: 'Disk od osam blokova, 0–7. Od nedjelje do četvrtka podaci se mijenjaju, a svake noći radi se [[backup]]. ' +
        'Na kraju se disk vraća na odabrani dan: koje kopije za to trebaju?',
      capWriteSun: 'Nedjelja: na disk su upisani podaci, blokovi A–H.',
      capWrite: ['{day}: promijenjen je blok {list}.', '{day}: promijenjeni su blokovi {list}.', '{day}: promijenjeni su blokovi {list}.'],
      capTwice: 'Blok {i} pisan je dvaput, {a} pa {b}: na disku je samo zadnji sadržaj, {b}.',
      capFullSun: 'Nedjelja navečer: [[full backup]], razina 0. Sprema svih osam blokova, jer [[snapshot file]] još ne ' +
        'postoji, pa se sve smatra novim.',
      capIncr: ['{day}, {kind}: sprema se samo blok {list}, jer je od {prev} samo on promijenjen.',
        '{day}, {kind}: spremaju se samo blokovi {list}, jer su od {prev} promijenjeni samo oni.',
        '{day}, {kind}: spremaju se samo blokovi {list}, jer su od {prev} promijenjeni samo oni.'],
      capIncrNeed: ['Za povratak na {day} trebat će {n} kopija, cijeli niz od nedjelje.', 'Za povratak na {day} trebat će {n} kopije, cijeli niz od nedjelje.',
        'Za povratak na {day} trebat će svih {n} kopija, cijeli niz od nedjelje.'],
      capDiff: ['{day}, {kind}: blok {list}, sve što je promijenjeno od nedjeljne potpune kopije.',
        '{day}, {kind}: blokovi {list}, sve što je promijenjeno od nedjeljne potpune kopije.',
        '{day}, {kind}: blokovi {list}, sve što je promijenjeno od nedjeljne potpune kopije.'],
      capDiffAgain: ['Blok {list} bio je spremljen već prethodne noći, a sprema se opet.', 'Blokovi {list} bili su spremljeni već prethodne noći, a spremaju se opet.',
        'Blokovi {list} bili su spremljeni već prethodne noći, a spremaju se opet.'],
      capDiffNeed: 'Za povratak na {day} trebaju samo nedjelja i ova kopija.',
      capFullNight: '{day}, {kind}: opet svih osam blokova, iako ih je od jučer promijenjeno manje. Za povratak na {target} dovoljna je ova jedna kopija.',
      capCmpNight: '{day}: prirasna sprema {a}, diferencijalna {b}. Spremljeno dosad: {sa} prema {sb}.',
      capTarget: 'Oporavak: disk se vraća na {day}.',
      planN: ['{lane}: treba {n} kopija, {days}.', '{lane}: trebaju {n} kopije, redom: {days}.', '{lane}: treba {n} kopija, redom: {days}.'],
      planOnly: ['{lane}: dovoljna je {n} kopija, {days}.', '{lane}: dovoljne su {n} kopije, {days}.', '{lane}: dovoljno je {n} kopija, {days}.'],
      capLostSet: 'Kopija od {lost} je izgubljena: medij se ne da pročitati.',
      capApply: ['{day}, {kind}: u vraćeni disk upisuje se blok {list}.', '{day}, {kind}: u vraćeni disk upisuju se blokovi {list}.',
        '{day}, {kind}: u vraćeni disk upisuju se blokovi {list}.'],
      capApplyAll: '{day}, {kind}: u vraćeni disk upisuju se svi blokovi, 0–7.',
      capNewer: ['Blok {list} prepisan je novijim sadržajem: {chg}.', 'Blokovi {list} prepisani su novijim sadržajem: {chg}.',
        'Blokovi {list} prepisani su novijim sadržajem: {chg}.'],
      capWait: '{lane}: gotovo, čeka.',
      capOk: ['Usporedba s diskom od {day}: svih osam blokova je isto. Pročitano je blokova {r}, iz {n} kopije.',
        'Usporedba s diskom od {day}: svih osam blokova je isto. Pročitano je blokova {r}, iz {n} kopije.',
        'Usporedba s diskom od {day}: svih osam blokova je isto. Pročitano je blokova {r}, iz {n} kopija.'],
      capCostIncr: 'Prirasne se jeftino prave (spremljeno blokova {s}), a skupo vraćaju: treba cijeli niz, redom.',
      capCostDiff: 'Diferencijalne se skuplje prave (spremljeno blokova {s}), a jeftino vraćaju: potpuna i jedna kopija.',
      capCostFull: 'Potpuna svake noći najskuplja je (spremljeno blokova {s}), a oporavak treba samo jednu kopiju.',
      capVerdict: 'Jedna je skupa da se napravi i jeftina da se vrati, druga obrnuto: prirasne {sa} spremljenih blokova i {na} kopija ' +
        'za oporavak, diferencijalne {sb} i {nb}.',
      capGap: 'Kopija od {lost} nedostaje, a oporavak je treba: tu staje.',
      capGapReached: ['Vraćeno je stanje od {reached}, a ne od {target}: blok {list} nije isti.', 'Vraćeno je stanje od {reached}, a ne od {target}: blokovi {list} nisu isti.',
        'Vraćeno je stanje od {reached}, a ne od {target}: blokovi {list} nisu isti.'],
      capGapNothing: 'Ništa nije vraćeno.',
      capGapSkip: ['Da se ona preskoči, blok {list} vratio bi se kao stari {old}, a izgledao bi ispravno.',
        'Da se ona preskoči, blokovi {list} vratili bi se kao stari {old}, a izgledali bi ispravno.',
        'Da se ona preskoči, blokovi {list} vratili bi se kao stari {old}, a izgledali bi ispravno.'],
      capGapNewest: 'Najnovija [[recovery point]] koja se još može vratiti: {day}.',
      capGapNone: 'Nijedna točka oporavka do tog dana ne može se vratiti.',
      capGapChain: 'Jedna izgubljena kopija odnijela je sve dane od {from} do {to}, a ne jednu noć.',
      capGapDiffHint: 'Uz diferencijalne kopije isti gubitak košta samo {lost}: za {target} dovoljne su nedjelja i kopija od {targetGen}.',
      termDiff: '*differential backup* (diferencijalna kopija)',
      termDiffLater: '*differential backup*',

      explain: '<p>[[full backup]] sprema sve, promijenjeno ili ne: to je razina 0. Prva kopija uvijek je takva: ' +
        '[[snapshot file]], u kojoj se pamti stanje zatečeno pri zadnjoj kopiji, još ne postoji.</p>' +
        '<p>[[incremental backup]] sprema samo ono što se promijenilo od <b>prethodne kopije bilo koje vrste</b> ' +
        '(razina 1 s istom datotekom snimka). Mala je, ali sama za sebe ne daje stanje diska: oporavak treba potpunu kopiju i ' +
        '<b>svaku</b> prirasnu iza nje, redom. Kasnija kopija bloka prepisuje raniju.</p>' +
        '<p><em lang="en">Differential backup</em> (diferencijalna kopija) sprema sve što se promijenilo od <b>zadnje potpune</b> ' +
        'kopije: svake noći je veća, ali oporavak treba samo potpunu i kopiju traženog dana. Napravi se kao kopija razine 1 ' +
        'iz svježeg primjerka datoteke snimka od razine 0.</p>' +
        '<p>Izgubi li se jedna prirasna kopija, svaka kasnija [[recovery point]] više se ne može vratiti, jer se niz prekida. ' +
        'Oporavak tada staje i kaže dokle je došao; stari blokovi ne smiju se vratiti kao da su ispravni. Kod diferencijalnih ' +
        'nestaje samo taj jedan dan.</p>'
    },
    en: {
      stage: 'A disk of eight blocks, the nightly backup sets from Sunday to Thursday and the restored disk',

      daysNom: 'Sunday|Monday|Tuesday|Wednesday|Thursday',
      daysGen: 'Sunday|Monday|Tuesday|Wednesday|Thursday',
      daysAcc: 'Sunday|Monday|Tuesday|Wednesday|Thursday',
      daysShort: 'Sun|Mon|Tue|Wed|Thu',
      and: 'and',

      mode: 'Nightly backup',
      modeIncr: 'incremental',
      modeDiff: 'differential',
      modeFull: 'full every night',
      compare: 'Compare incremental and differential',
      compareHint: 'Side by side; the nightly backup choice is then ignored.',
      restoreDay: 'Restore the disk to',
      lose: 'Lost set',
      loseNone: 'none',

      presetIncr: 'A week of incrementals',
      presetIncrHint: 'Cheap to make, expensive to restore.',
      presetDiff: 'A week of differentials',
      presetDiffHint: 'More every night, restore from two.',
      presetFull: 'Full every night',
      presetFullHint: 'The most stored, restore from one.',
      presetLost: 'Tuesday lost',
      presetLostHint: 'An incremental chain with a gap.',
      presetCompare: 'Compare',
      presetCompareHint: 'Incremental and differential at once.',

      legChanged: 'in this step',
      legStored: 'stored in the set',
      legSlot: 'not stored',
      legRestored: 'restored, the set\'s day under it',
      legLost: 'lost set',
      legStale: 'not as on the disk',
      legLink: 'set being restored',

      diskTitle: 'Disk',
      diskToday: 'today: {day}',
      diskTarget: 'restore target: {day}',
      diskEmpty: 'still empty',
      cntChanged: 'changed since the last backup {a}, since the full {b}',
      laneIncr: 'Incremental',
      laneDiff: 'Differential',
      laneFull: 'Full every night',
      lnIncr: 'Incremental',
      lnDiff: 'Differential',
      lnFull: 'Full',
      tagLevel0: 'level 0',
      tagIncr: 'incremental',
      tagDiff: 'differential',
      tagFull: 'full',
      tagLost: 'lost',
      cntStored: ['{n} block stored', '{n} blocks stored'],
      rowRest: 'restored',
      restNone: 'Restore: not started',
      restLine: 'Restore: set {a} of {b}, blocks read {r}',
      asideOk: 'matches the disk',
      asideGap: 'state: {day}',
      asideNothing: 'nothing',

      capStart: 'A disk of eight blocks, 0–7. From Sunday to Thursday the data changes, and every night a [[backup]] is taken. ' +
        'At the end the disk is restored to a chosen day: which sets does that need?',
      capWriteSun: 'Sunday: the data is written to the disk, blocks A–H.',
      capWrite: ['{day}: block {list} is changed.', '{day}: blocks {list} are changed.'],
      capTwice: 'Block {i} is written twice, {a} then {b}: the disk holds only the last content, {b}.',
      capFullSun: 'Sunday night: a [[full backup]], level 0. It stores all eight blocks: the [[snapshot file]] does not ' +
        'exist yet, so everything counts as new.',
      capIncr: ['{day}, {kind}: only block {list} is stored, because only it has changed since {prev}.',
        '{day}, {kind}: only blocks {list} are stored, because only they have changed since {prev}.'],
      capIncrNeed: ['Restoring {day} will need {n} set, the whole chain from Sunday.', 'Restoring {day} will need all {n} sets, the whole chain from Sunday.'],
      capDiff: ['{day}, {kind}: block {list}, everything changed since Sunday\'s full backup.',
        '{day}, {kind}: blocks {list}, everything changed since Sunday\'s full backup.'],
      capDiffAgain: ['Block {list} was stored the night before already, and is stored again.', 'Blocks {list} were stored the night before already, and are stored again.'],
      capDiffNeed: 'Restoring {day} needs only Sunday and this set.',
      capFullNight: '{day}, {kind}: all eight blocks again, though fewer have changed since yesterday. Restoring {target} needs only this one set.',
      capCmpNight: '{day}: incremental stores {a}, differential {b}. Stored so far: {sa} against {sb}.',
      capTarget: 'Restore: the disk goes back to {day}.',
      planN: ['{lane}: needs {n} set, {days}.', '{lane}: needs {n} sets, in order: {days}.'],
      planOnly: ['{lane}: {n} set is enough, {days}.', '{lane}: {n} sets are enough, {days}.'],
      capLostSet: '{lost}\'s set is lost: its medium cannot be read.',
      capApply: ['{day}, {kind}: block {list} goes onto the restored disk.', '{day}, {kind}: blocks {list} go onto the restored disk.'],
      capApplyAll: '{day}, {kind}: every block, 0–7, goes onto the restored disk.',
      capNewer: ['Block {list} is overwritten with newer content: {chg}.', 'Blocks {list} are overwritten with newer content: {chg}.'],
      capWait: '{lane}: done, waiting.',
      capOk: ['Compared with {day}\'s disk: all eight blocks match. Blocks read {r}, from {n} set.',
        'Compared with {day}\'s disk: all eight blocks match. Blocks read {r}, from {n} sets.'],
      capCostIncr: 'Incremental is cheap to make (blocks stored {s}) and expensive to restore: it needs the whole chain, in order.',
      capCostDiff: 'Differential costs more to make (blocks stored {s}) and little to restore: the full and one set.',
      capCostFull: 'A full backup every night costs the most (blocks stored {s}); a restore needs one set.',
      capVerdict: 'One is expensive to make and cheap to restore, the other the reverse: incremental {sa} blocks stored and {na} sets ' +
        'to restore, differential {sb} and {nb}.',
      capGap: '{lost}\'s set is missing and the restore needs it: it stops here.',
      capGapReached: ['The restored disk is {reached}\'s state, not {target}\'s: block {list} differs.', 'The restored disk is {reached}\'s state, not {target}\'s: blocks {list} differ.'],
      capGapNothing: 'Nothing is restored.',
      capGapSkip: ['Skipping it would bring block {list} back as the old {old}, looking correct.', 'Skipping it would bring blocks {list} back as the old {old}, looking correct.'],
      capGapNewest: 'The newest [[recovery point]] that can still be restored: {day}.',
      capGapNone: 'No recovery point up to that day can be restored.',
      capGapChain: 'One lost set took every day from {from} to {to} with it, not one night.',
      capGapDiffHint: 'With differential sets the same loss costs only {lost}: {target} restores from Sunday and {targetGen}\'s set.',
      termDiff: 'differential backup',
      termDiffLater: 'differential backup',

      explain: '<p>A [[full backup]] (level 0) stores everything, changed or not. The first backup is always one: the ' +
        '[[snapshot file]], which records the state found at the last backup, does not exist yet.</p>' +
        '<p>An [[incremental backup]] stores only what changed since the <b>previous backup of any kind</b> (level 1 with ' +
        'the same snapshot file). It is small, but on its own it gives no disk state: a restore needs the full backup and ' +
        '<b>every</b> incremental after it, in order. A later copy of a block overwrites an earlier one.</p>' +
        '<p>A differential backup stores everything that changed since the <b>last full</b> backup: it grows every night, ' +
        'but a restore needs only the full and the set of the day wanted. It is made as a level 1 backup from a fresh copy ' +
        'of the level 0 snapshot file.</p>' +
        '<p>Lose one incremental set and every later [[recovery point]] can no longer be restored, because the chain is ' +
        'broken. The restore then stops and says how far it got; old blocks must never come back as if they were ' +
        'current. With differentials only that one day is gone.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
