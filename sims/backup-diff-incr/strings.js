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
      capTwice: 'Blok {i} pisan je dvaput, {a} pa {b}: na disku je samo zadnji sadržaj, {c}.',
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
      capVerdict: 'Prirasne: spremljeno blokova {sa}, kopija za oporavak {na}. Diferencijalne: {sb} i {nb}. Prirasne se jeftino prave i ' +
        'skupo vraćaju, diferencijalne obrnuto.',
      capVerdictSame: 'Za oporavak na {day} obje trebaju jednako kopija: razlika u oporavku raste što je dan kasniji.',
      capStopped: '{lane}: oporavak je stao, stanje: {state}.',
      capCostShort: 'Ovdje je niz još kratak; što je dan kasniji, to je dulji, a oporavak skuplji.',
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

      // lnx-send-receive (param repl): replication from snapshot pairs
      srStage: 'Izvor s datotečnim sustavom i snimkama, tok koji slanje nosi i odredište sa snimkama koje je primilo',
      srSubtitle: 'Inkrementalna replikacija iz parova snimki',
      repl: 'Slanje i primanje',
      replOff: 'tjedan kopija',
      force: 'Prisilno primanje (-F)',
      forceHint: 'Odredište se prvo vraća na svoju zadnju snimku.',
      presetChain: 'Lanac slanja',
      presetChainHint: 'Potpuno, pa inkrementalno; oporavak iz jedne snimke.',
      presetMissing: 'Nema roditelja',
      presetMissingHint: 'Odredište je obrisalo @mon.',
      presetCommon: 'Zajednička ostaje',
      presetCommonHint: 'Izvor briše @mon, a @tue je zajednička.',
      presetTouched: 'Dirano odredište',
      presetTouchedHint: 'Upis na odredištu između dva slanja.',
      legSrNow: 'promijenjen ili nošen u ovom koraku',
      legSrFlag: 'snimka, samo za čitanje',
      legSrBlock: 'blok jedne snimke ili podataka',
      legSrShared: 'blok koji snimke dijele (×n)',
      legSrStream: 'tok: blokovi koje slanje nosi',
      legSrSlot: 'tok ga ne nosi',
      legSrLink: 'primjenjuje se u snimku',
      legSrRefused: 'odbijeno primanje',
      legSrCommon: 'zajednička snimka, na obje strane',
      legSrGone: 'obrisana snimka',
      srSrc: 'Izvor',
      srTgt: 'Odredište',
      srLive: 'podaci',
      srStream: 'tok',
      srRest: 'vraćeno',
      srEmpty: 'još prazno',
      srSnaps: ['{n} snimka', '{n} snimke', '{n} snimki'],
      srStored: ['{n} blok na disku', '{n} bloka na disku', '{n} blokova na disku'],
      srParent: 'roditelj',
      srSent: 'šalje se',
      srGone: 'obrisana',
      srFullTag: 'potpuno',
      srIncrTag: 'inkrementalno',
      srRefused: 'odbijeno',
      srChanged: 'mijenjano nakon snimke',
      srRolledBack: 'vraćeno, upis izgubljen',
      srSame: 'isto kao izvor',

      srCapStart: 'Dva računala. Na izvoru je datotečni sustav od osam blokova, A–H; odredište je još prazno. Svaki dan ' +
        'uzima se *snapshot* (snimka), samo za čitanje, i šalje na odredište.',
      srCapSnap: 'Snimka {snap}.',
      srCapDaySnap: '{day}: snimka {snap}.',
      srCapFull: 'Odredište nema nijednu snimku zajedničku s izvorom, pa je slanje potpuno: tok nosi svih osam blokova. ' +
        'Na odredištu je sada {snap}.',
      srCapIncr: ['Inkrementalno slanje od {parent} do {snap} nosi samo {n} blok, {list}: onaj koji se među njima razlikuje.',
        'Inkrementalno slanje od {parent} do {snap} nosi samo {n} bloka, {list}: one koji se među njima razlikuju.',
        'Inkrementalno slanje od {parent} do {snap} nosi samo {n} blokova, {list}: one koji se među njima razlikuju.'],
      srCapWhole: 'Na odredištu je {snap} time cijeli datotečni sustav: za oporavak {day} ne treba lanac.',
      srCapTie: 'Na obje strane su {list}; roditelj je najnovija, {parent}.',
      srCapKept: 'Na izvoru više nema {gone}, ali {parent} je na obje strane, pa slanje radi.',
      srCapNoParent: 'Primanje je odbijeno: odredište nema {parent}, a inkrementalni tok samo je razlika od nje. Odredište je ' +
        'ostalo kakvo je bilo.',
      srCapResend: 'Bez zajedničke snimke radi samo potpuno slanje: cijela {snap}, svih osam blokova. Na odredištu je sada {snap2}.',
      srCapModified: 'Primanje je odbijeno: odredište je promijenjeno nakon svoje zadnje snimke, {parent} (tako radi ZFS). ' +
        'Prisilno primanje (-F) prvo bi ga vratilo na {parent2} i izgubilo taj upis.',
      srCapForced: 'Prisilno primanje (-F) vraća odredište na {parent}: upis u blok {i} ({c}) je izgubljen. Zatim se tok ' +
        'primjenjuje i na odredištu je {snap}.',
      srCapDelTgt: 'Na odredištu je obrisana snimka {snap}. Podaci odredišta ostaju, ali {snap2} više nije zajednička.',
      srCapDelSrc: 'Na izvoru je obrisana snimka {snap}; oslobođeni su blokovi koje nijedna druga snimka ne dijeli. {later} ' +
        'je i dalje cijela na obje strane: snimke dijele blokove, ali ne ovise jedna o drugoj.',
      srCapTouch: 'Na odredištu je upisana datoteka: blok {i} je sada {c}. Odredište se promijenilo nakon svoje zadnje ' +
        'snimke, {snap}.',
      srCapRestore: 'Oporavak {day} na odredištu: čita se samo {snap}, {r} blokova iz jedne snimke, i svi su isti kao u ' +
        'izvornoj {snap2}. Primanje je svaki tok već primijenilo, pa lanac ne treba; prirasnim kopijama trebao bi cijeli, redom.',

      explainSr: '<p><em lang="en">Replication</em> (replikacija) šalje snimke s jednog računala na drugo. Prvo slanje ' +
        'je potpuno: tok nosi sve blokove jedne snimke. Svako sljedeće je inkrementalno, od <b>roditeljske snimke</b> do ' +
        'nove, i nosi samo blokove koji se među njima razlikuju. Šalju se samo snimke, a one su samo za čitanje.</p>' +
        '<p>Primanje tok <b>primjenjuje</b>: na odredištu nastaje cijela snimka istog imena. Za oporavak srijede dovoljna ' +
        'je <span translate="no">@wed</span>; lanac ne treba, za razliku od prirasnih kopija. Snimke dijele nepromijenjene ' +
        'blokove, pa brisanje starije ne kvari kasniju.</p>' +
        '<p>Inkrementalni tok samo je razlika, pa roditelj mora postojati <b>na obje strane</b>; inače se primanje odbija ' +
        'i radi samo potpuno slanje. Od više zajedničkih snimki uzima se najnovija. ZFS primanje odbija i kad je odredište ' +
        'promijenjeno nakon svoje zadnje snimke, osim prisilnog (<code translate="no">receive -F</code>), koje ga vraća ' +
        'na nju i taj upis gubi. Btrfs prima u snimke samo za čitanje. Roditelj se u ZFS-u zadaje s ' +
        '<code translate="no">send -i</code>, u Btrfs-u s <code translate="no">send -p</code>.</p>' +
        '<p>Replikacija sama nije [[backup]]: i brisanje se replicira, osim ako se snimke čuvaju.</p>',

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
      capWrite: ['{day}: block {list} was changed.', '{day}: blocks {list} were changed.'],
      capTwice: 'Block {i} was written twice, {a} then {b}: the disk holds only the last content, {c}.',
      capFullSun: 'Sunday night: a [[full backup]], level 0. It stores all eight blocks: the [[snapshot file]] does not ' +
        'exist yet, so everything counts as new.',
      capIncr: ['{day}, {kind}: only block {list} is stored, because only it has changed since {prev}.',
        '{day}, {kind}: only blocks {list} are stored, because only they have changed since {prev}.'],
      capIncrNeed: ['Restoring {day} will need {n} set, the whole chain from Sunday.', 'Restoring {day} will need {n} sets, the whole chain from Sunday.'],
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
      capVerdict: 'Incremental: blocks stored {sa}, sets to restore {na}. Differential: {sb} and {nb}. Incremental is cheap to make and ' +
        'expensive to restore, differential the reverse.',
      capVerdictSame: 'Restoring {day} takes as many sets either way: the gap in restore cost grows the later the day.',
      capStopped: '{lane}: the restore stopped, state: {state}.',
      capCostShort: 'Here the chain is still short; the later the day, the longer it gets and the more a restore costs.',
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

      srStage: 'The source with its filesystem and snapshots, the stream a send carries, and the target with the snapshots it received',
      srSubtitle: 'Incremental replication from snapshot pairs',
      repl: 'Send and receive',
      replOff: 'a week of backups',
      force: 'Forced receive (-F)',
      forceHint: 'The target is first rolled back to its newest snapshot.',
      presetChain: 'Send chain',
      presetChainHint: 'Full, then incremental; restore from one snapshot.',
      presetMissing: 'Missing parent',
      presetMissingHint: 'The target deleted @mon.',
      presetCommon: 'Common kept',
      presetCommonHint: 'The source deletes @mon; @tue is common.',
      presetTouched: 'Target touched',
      presetTouchedHint: 'A write on the target between two sends.',
      legSrNow: 'changed or carried in this step',
      legSrFlag: 'snapshot, read-only',
      legSrBlock: 'a block of one snapshot or of the data',
      legSrShared: 'a block snapshots share (×n)',
      legSrStream: 'stream: the blocks a send carries',
      legSrSlot: 'not carried',
      legSrLink: 'applied into the snapshot',
      legSrRefused: 'refused receive',
      legSrCommon: 'common snapshot, on both sides',
      legSrGone: 'deleted snapshot',
      srSrc: 'Source',
      srTgt: 'Target',
      srLive: 'data',
      srStream: 'stream',
      srRest: 'restored',
      srEmpty: 'still empty',
      srSnaps: ['{n} snapshot', '{n} snapshots'],
      srStored: ['{n} block on disk', '{n} blocks on disk'],
      srParent: 'parent',
      srSent: 'sent',
      srGone: 'deleted',
      srFullTag: 'full',
      srIncrTag: 'incremental',
      srRefused: 'refused',
      srChanged: 'changed after the snapshot',
      srRolledBack: 'rolled back, write lost',
      srSame: 'matches the source',

      srCapStart: 'Two machines. The source has a filesystem of eight blocks, A–H; the target is still empty. Every day a ' +
        'read-only snapshot is taken and sent to the target.',
      srCapSnap: 'Snapshot {snap}.',
      srCapDaySnap: '{day}: snapshot {snap}.',
      srCapFull: 'The target shares no snapshot with the source, so the send is full: the stream carries all eight blocks. ' +
        'The target now holds {snap}.',
      srCapIncr: ['The incremental send from {parent} to {snap} carries only {n} block, {list}: the one that differs between them.',
        'The incremental send from {parent} to {snap} carries only {n} blocks, {list}: those that differ between them.'],
      srCapWhole: 'On the target {snap} is then a whole filesystem: restoring {day} needs no chain.',
      srCapTie: 'Both sides hold {list}; the parent is the newest, {parent}.',
      srCapKept: '{gone} is gone from the source, but {parent} is on both sides, so the send works.',
      srCapNoParent: 'The receive is refused: the target has no {parent}, and an incremental stream is only the difference ' +
        'from it. The target stays as it was.',
      srCapResend: 'With no common snapshot only a full send works: all of {snap}, eight blocks. The target now holds {snap2}.',
      srCapModified: 'The receive is refused: the target was changed after its newest snapshot, {parent} (this is how ZFS ' +
        'behaves). A forced receive (-F) would first roll it back to {parent2} and lose that write.',
      srCapForced: 'The forced receive (-F) rolls the target back to {parent}: the write to block {i} ({c}) is lost. Then the ' +
        'stream is applied and the target holds {snap}.',
      srCapDelTgt: 'Snapshot {snap} is deleted on the target. The target\'s data stays, but {snap2} is no longer common.',
      srCapDelSrc: 'Snapshot {snap} is deleted on the source; the blocks no other snapshot shares are freed. {later} stays ' +
        'whole on both sides: snapshots share blocks but do not depend on each other.',
      srCapTouch: 'A file is written on the target: block {i} is now {c}. The target has changed since its newest snapshot, ' +
        '{snap}.',
      srCapRestore: 'Restoring {day} on the target: only {snap} is read, {r} blocks from one snapshot, and all match the ' +
        'source\'s {snap2}. Each receive already applied its stream, so no chain is needed; incremental backups would need ' +
        'all of it, in order.',

      explainSr: '<p>Replication sends snapshots from one machine to another. The first send is full: the stream carries ' +
        'every block of one snapshot. Every later one is incremental, from a <b>parent snapshot</b> to the new one, and ' +
        'carries only the blocks that differ between them. Only snapshots are sent, and they are read-only.</p>' +
        '<p>The receive <b>applies</b> the stream: the target gets a whole snapshot of the same name. Restoring Wednesday ' +
        'needs only <span translate="no">@wed</span>; no chain, unlike incremental backups. Snapshots share their ' +
        'unchanged blocks, so deleting an older one does not break a later one.</p>' +
        '<p>An incremental stream is only a difference, so the parent must exist <b>on both sides</b>; otherwise the ' +
        'receive is refused and only a full send works. Of several common snapshots the newest is used. ZFS also refuses ' +
        'the receive when the target was changed after its newest snapshot, unless it is forced ' +
        '(<code translate="no">receive -F</code>), which rolls the target back to it and loses that write. Btrfs receives ' +
        'into read-only snapshots. The parent is named with <code translate="no">send -i</code> in ZFS and ' +
        '<code translate="no">send -p</code> in Btrfs.</p>' +
        '<p>Replication alone is not a [[backup]]: a deletion replicates too, unless snapshots are kept.</p>',

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
