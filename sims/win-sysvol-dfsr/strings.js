/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-sysvol-dfsr, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); none of the
   page's terms is in kit/glossary.js yet, so they are written out this way, English term then the Croatian in
   parentheses at the first mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title,
   concept). DC and host names, site names, version numbers, paths, file names and drive maps are data, shown with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva kontrolera domene, DC01 u središnjici i DC03 u podružnici, svaki s GPO-om u dvije polovice (GPC u AD-u i GPT u SYSVOL-u); između njih replikacija AD-a i DFS replikacija preko WAN-a; klijent PC-B u podružnici',

      // DC cards
      pdc: 'emulator PDC-a',
      gpoName: 'GPO „Mapiranje pogona”',
      gpcHead: 'GPC · objekt u AD-u',
      gptHead: 'GPT · mapa u SYSVOL-u',
      verSplit: 'korisnik {u} · računalo {c}',
      mapLabel: 'mapiranje',
      gpmc: 'GPMC:',
      inSync: 'usklađeno',
      mismatch: 'nepodudaranje',
      cadHead: 'izgubljena kopija',
      cadFrom: 's {dc}',
      bSaves: 'sprema',
      bReceives: 'prima',
      bRefresh: 'osvježava',
      bForce: 'prisilno',
      bSkip: 'preskače',
      bApplies: 'primjenjuje',

      // client card
      reads: 'pravila grupe čita s {dc}',
      applied: 'zadnje primijenio',
      withFiles: 's datotekama',
      staleNote: 'stare postavke pod novim brojem',

      // pipes
      pipeAd: 'replikacija AD-a nosi GPC',
      pipeDfsr: 'DFS replikacija nosi GPT',
      due: 'stiže u t = {t}',
      held: 'čeka WAN',
      arrived: 'stiglo',
      arrivedOld: 'starije, ne mijenja ništa',
      arrivedEqual: 'ista verzija',
      lostItem: 'gubi: ConflictAndDeleted',
      wonItem: 'pobjeđuje, lokalna kopija u ConflictAndDeleted',
      empty: 'ništa na putu',
      wanUp: 'WAN radi',
      wanDown: 'WAN prekinut',

      // timeline
      tlTitle: 'Tijek',
      evEdit: '{dc} sprema GPO',
      evAd: 'replikacija AD-a',
      evDfsr: 'DFS replikacija',
      evCut: 'WAN pada',
      evRestore: 'WAN se vraća',
      evRefresh: 'PC-B osvježava',
      evFinal: 'PC-B opet osvježava',
      evForce: 'prisilno osvježavanje',
      evStart: 'početak',

      // legend
      lgGpc: 'GPC u AD-u',
      lgGpt: 'GPT u SYSVOL-u',
      lgAd: 'replikacija AD-a',
      lgDfsr: 'DFS replikacija',
      lgVer: 'verzija',
      lgNeq: 'nepodudaranje',
      lgChanged: 'promijenjeno u ovom koraku',

      // params and presets
      pCut: 'Prekid WAN-a',
      cutNever: 'nikad',
      cutAfterAd: 'nakon AD-a',
      cutAfterDfsr: 'nakon DFSR-a',
      pCutHint: 'WAN pada odmah nakon te isporuke i vraća se dva takta kasnije.',
      pAd: 'Replikacija AD-a traje',
      pDfsr: 'DFS replikacija traje',
      pRefresh: 'PC-B osvježava u',
      pTwo: 'Dva administratora istodobno',
      pTwoHint: 'Drugi sprema isti GPO na DC03 u istom taktu.',
      ticks: ['{n} takt', '{n} takta', '{n} taktova'],
      prNormal: 'Obje polovice stignu',
      prHalf: 'GPO stigne napola',
      prFiles: 'Datoteke prije GPC-a',
      prTwo: 'Dva administratora',

      // captions
      capStart: 'Početak: oba DC-a imaju GPO u verziji {v} u obje polovice, a PC-B je primijenio verziju {v}.',
      planOne: 'Administrator ga uređuje na {dc}, emulatoru PDC-a.',
      planTwo: 'Dva administratora uređuju ga u istom taktu, jedan na DC01, drugi na DC03.',
      planTiming: 'Replikacija AD-a traje {a}, DFS replikacija {d}.',
      planCutAd: 'WAN prema Branchu pada odmah nakon replikacije AD-a.',
      planCutDfsr: 'WAN prema Branchu pada odmah nakon DFS replikacije.',
      capEdit: 'Administrator sprema GPO na {dc}; konzola GPMC po zadanome uređuje na emulatoru PDC-a. Na {dc} obje polovice prelaze s verzije {v0} na {v}: *versionNumber* (broj verzije) {n0} → {n}, jer postavka na korisničkoj strani dodaje 65536. GPC kreće replikacijom AD-a, mapa GPT DFS replikacijom.',
      capEdit2: 'U istom taktu drugi administrator sprema isti GPO na {dc}, s drugim mapiranjem. I tamo su obje polovice verzija {v}; DFS replikacija ih još nije uskladila.',
      capAd: 'Replikacija AD-a donosi GPC na {to}: verzija {v}.',
      capAdTwo: 'Replikacija AD-a razmjenjuje GPC-ove: oba kažu {v}, pa se ništa vidljivo ne mijenja; AD zadržava jednu od dviju jednakih vrijednosti.',
      capDfsr: 'DFS replikacija donosi mapu GPT na {to}: GPT.INI verzije {v} i novi Drives.xml.',
      capDfsrTwo: 'DFS replikacija nalazi dva spremanja istih datoteka. Pobjeđuje kasnije, ono s {win}, na oba DC-a; kopija s {lose} ide u ConflictAndDeleted. Svi brojevi verzije kažu {v}, pa ništa ne pokazuje da je promjena s {lose} nestala.',
      capHalf: 'Na DC-u u Branchu GPC je verzija {c}, a GPT još {g}: GPO je stigao napola.',
      capHalfFiles: 'Na DC-u u Branchu GPT je verzija {g}, a GPC još {c}: datoteke su tu, a broj koji klijent provjerava nije.',
      capWhole: 'Obje polovice na {dc} sada su verzija {v}.',
      capTwoPaths: '*SYSVOL* replicira DFSR, a ne replikacija AD-a — dva puta, dva vremena.',
      capCut: 'WAN prema Branchu pada. Čeka: {list}.',
      capCutNone: 'WAN prema Branchu pada, ali ništa nije na putu: obje polovice su već stigle.',
      capRestore: 'WAN se vraća i promet ponovno teče: {list}.',
      capCutLater: 'WAN prema Branchu pada, ali ništa ne zadržava: {list} ionako stiže tek nakon što se WAN vrati.',
      capRestoreNone: 'WAN se vraća; ništa nije čekalo.',
      wAd: 'replikacija AD-a (GPC)',
      wDfsr: 'DFS replikacija (GPT)',
      wAnd: ' i ',
      capRefSkip: 'PC-B osvježava: GPC na {dc} kaže {c}, istu verziju koju je već primijenio, pa GPO preskače.',
      capRefSkipFiles: 'Nove datoteke su tu, ali klijent gleda broj u GPC-u.',
      capRefSkipStale: 'Nove datoteke su sada na {dc}, ali PC-B zadržava staro mapiranje: broj verzije se nije promijenio, pa obično osvježavanje ne gleda ponovno, iako je *mismatch* (nepodudaranje) na DC-u nestao.',
      capRefUpToDate: '{dc} nema ništa novije od onoga što je PC-B primijenio.',
      capRefApplyStale: 'PC-B osvježava: GPC na {dc} kaže {c}, novije od {old}, pa primjenjuje GPO — s datotekama koje {dc} ima, još verzije {g}. Primjenjuje staro mapiranje i bilježi {c}.',
      capRefApply: 'PC-B osvježava: GPC na {dc} kaže {c}, novije od {old}; primjenjuje GPO s datotekama verzije {g}: {map}.',
      capRefTwo: 'PC-B dobiva mapiranje s DC03; promjena s DC01 ostala je samo u ConflictAndDeleted.',
      capForce: 'Prisilno osvježavanje ({cmd}) primjenjuje GPO bez obzira na verziju: PC-B sada mapira {map}.',

      explain: '<p>GPO su dva objekta. <em lang="en">Group Policy container</em> (spremnik pravila grupe, GPC) je objekt ' +
        'u AD-u, s atributom <code>versionNumber</code>. <em lang="en">Group Policy template</em> (predložak pravila grupe, ' +
        'GPT) je mapa u SYSVOL-u: <code>GPT.INI</code> s istim brojem i datoteke s postavkama (ovdje ' +
        '<code>Drives.xml</code>).</p>' +
        '<p>GPC replicira replikacija AD-a, a SYSVOL <em lang="en">DFS Replication</em> (DFS replikacija, DFSR): dva puta, ' +
        'svaki sa svojim vremenom. Ako WAN padne između njih, DC u podružnici ima jednu polovicu novu, a drugu staru.</p>' +
        '<p>Broj verzije je verzija korisničke strane × 65536 + verzija strane računala. Spremanje mijenja obje polovice ' +
        'odjednom, na jednom DC-u: konzola po zadanome uređuje na emulatoru PDC-a.</p>' +
        '<p>Klijent uspoređuje broj u GPC-u sa zadnjim primijenjenim. Ako je noviji, primjenjuje GPO s datotekama koje ' +
        'njegov DC ima u tom trenutku i bilježi novi broj. Sa starim datotekama primijeni stare postavke pod novim brojem, ' +
        'pa ga sljedeće obično osvježavanje preskoči i kad datoteke stignu; pomaže tek prisilno osvježavanje ili sljedeća ' +
        'promjena. Konzola pokazuje <em lang="en">mismatch</em> (nepodudaranje) verzija AD-a i SYSVOL-a, ali samo dok traje.</p>' +
        '<p>Dva administratora na dva DC-a: DFSR zadržava datoteke kasnijeg spremanja, a drugu kopiju premješta u ' +
        '<code>ConflictAndDeleted</code>. Brojevi se slažu, sadržaj ne. Zato se GPO uređuje na jednom DC-u.</p>' +
        '<p>Pojednostavnjeno: dva DC-a, jedan GPO, vrijeme u taktovima; WAN se vraća dva takta nakon prekida. Stvarna ' +
        'kašnjenja su minute, a raspored replikacije ovdje se ne prikazuje.</p>'
    },
    en: {
      stage: 'Two domain controllers, DC01 at HQ and DC03 at Branch, each holding the GPO in two halves (the GPC in AD and the GPT in SYSVOL); between them AD replication and DFS Replication over the WAN; the client PC-B at Branch',

      pdc: 'PDC emulator',
      gpoName: 'GPO “Drive Maps”',
      gpcHead: 'GPC · object in AD',
      gptHead: 'GPT · folder in SYSVOL',
      verSplit: 'user {u} · computer {c}',
      mapLabel: 'drive map',
      gpmc: 'GPMC:',
      inSync: 'in sync',
      mismatch: 'mismatch',
      cadHead: 'lost copy',
      cadFrom: 'from {dc}',
      bSaves: 'saves',
      bReceives: 'receives',
      bRefresh: 'refreshes',
      bForce: 'forced',
      bSkip: 'skips',
      bApplies: 'applies',

      reads: 'reads Group Policy from {dc}',
      applied: 'last applied',
      withFiles: 'with files',
      staleNote: 'old settings under the new number',

      pipeAd: 'AD replication carries the GPC',
      pipeDfsr: 'DFS Replication carries the GPT',
      due: 'due at t = {t}',
      held: 'waits for the WAN',
      arrived: 'arrived',
      arrivedOld: 'older, changes nothing',
      arrivedEqual: 'same version',
      lostItem: 'loses: ConflictAndDeleted',
      wonItem: 'wins, local copy to ConflictAndDeleted',
      empty: 'nothing in flight',
      wanUp: 'WAN up',
      wanDown: 'WAN down',

      tlTitle: 'Timeline',
      evEdit: '{dc} saves the GPO',
      evAd: 'AD replication',
      evDfsr: 'DFS Replication',
      evCut: 'WAN goes down',
      evRestore: 'WAN comes back',
      evRefresh: 'PC-B refreshes',
      evFinal: 'PC-B refreshes again',
      evForce: 'forced refresh',
      evStart: 'start',

      lgGpc: 'GPC in AD',
      lgGpt: 'GPT in SYSVOL',
      lgAd: 'AD replication',
      lgDfsr: 'DFS Replication',
      lgVer: 'version',
      lgNeq: 'mismatch',
      lgChanged: 'changed in this step',

      pCut: 'WAN cut',
      cutNever: 'never',
      cutAfterAd: 'after AD',
      cutAfterDfsr: 'after DFSR',
      pCutHint: 'The WAN goes down right after that delivery and comes back two ticks later.',
      pAd: 'AD replication takes',
      pDfsr: 'DFS Replication takes',
      pRefresh: 'PC-B refreshes at',
      pTwo: 'Two admins at once',
      pTwoHint: 'The second saves the same GPO on DC03 in the same tick.',
      ticks: ['{n} tick', '{n} ticks'],
      prNormal: 'Both halves arrive',
      prHalf: 'The GPO half-arrives',
      prFiles: 'Files before the GPC',
      prTwo: 'Two admins',

      capStart: 'Start: both DCs hold the GPO at version {v} in both halves, and PC-B has applied version {v}.',
      planOne: 'An admin edits it on {dc}, the PDC emulator.',
      planTwo: 'Two admins edit it in the same tick, one on DC01, one on DC03.',
      planTiming: 'AD replication takes {a}, DFS Replication {d}.',
      planCutAd: 'The WAN to Branch goes down right after AD replication.',
      planCutDfsr: 'The WAN to Branch goes down right after DFS Replication.',
      capEdit: 'An admin saves the GPO on {dc}; the GPMC console edits on the PDC emulator by default. On {dc} both halves go from version {v0} to {v}: versionNumber {n0} → {n}, as a user-side setting adds 65536. The GPC leaves by AD replication, the GPT folder by DFS Replication.',
      capEdit2: 'In the same tick a second admin saves the same GPO on {dc}, with another drive map. Its halves are version {v} there too; DFS Replication has not synced them yet.',
      capAd: 'AD replication delivers the GPC to {to}: version {v}.',
      capAdTwo: 'AD replication swaps the GPCs: both say {v}, so nothing visible changes; AD keeps one of two equal values.',
      capDfsr: 'DFS Replication delivers the GPT folder to {to}: GPT.INI at version {v} and the new Drives.xml.',
      capDfsrTwo: 'DFS Replication finds two saves of the same files. The later one, from {win}, wins on both DCs; the copy from {lose} goes to ConflictAndDeleted. Every version number says {v}, so nothing shows that the change from {lose} is gone.',
      capHalf: 'On the Branch DC the GPC is version {c} but the GPT is still {g}: the GPO has half-arrived.',
      capHalfFiles: 'On the Branch DC the GPT is version {g} but the GPC is still {c}: the files are there, the number the client checks is not.',
      capWhole: 'Both halves on {dc} are now version {v}.',
      capTwoPaths: 'SYSVOL is replicated by DFSR, not by AD replication — two paths, two timings.',
      capCut: 'The WAN to Branch goes down. Waiting: {list}.',
      capCutNone: 'The WAN to Branch goes down, but nothing is in flight: both halves have arrived.',
      capRestore: 'The WAN is back; {list} can go now.',
      capCutLater: 'The WAN to Branch goes down, but holds nothing up: {list} is not due until after it comes back.',
      capRestoreNone: 'The WAN is back; nothing was waiting.',
      wAd: 'AD replication (GPC)',
      wDfsr: 'DFS Replication (GPT)',
      wAnd: ' and ',
      capRefSkip: 'PC-B refreshes: the GPC on {dc} says {c}, the version it has already applied, so it skips the GPO.',
      capRefSkipFiles: 'The new files are there, but the client goes by the number in the GPC.',
      capRefSkipStale: 'The new files are on {dc} now, but PC-B keeps the old drive map: the version number has not changed, so a normal refresh does not look again, though the mismatch on the DC is gone.',
      capRefUpToDate: '{dc} holds nothing newer than what PC-B has applied.',
      capRefApplyStale: 'PC-B refreshes: the GPC on {dc} says {c}, newer than {old}, so it applies the GPO — with the files {dc} has, still version {g}. It maps the old drive and records {c}.',
      capRefApply: 'PC-B refreshes: the GPC on {dc} says {c}, newer than {old}; it applies the GPO with the version {g} files: {map}.',
      capRefTwo: 'PC-B gets the drive map from DC03; the change from DC01 survives only in ConflictAndDeleted.',
      capForce: 'A forced refresh ({cmd}) applies the GPO whatever the version: PC-B now maps {map}.',

      explain: '<p>A GPO is two objects. The <em lang="en">Group Policy container</em> (GPC) is an object in AD, with the ' +
        'attribute <code>versionNumber</code>. The <em lang="en">Group Policy template</em> (GPT) is a folder in SYSVOL: ' +
        '<code>GPT.INI</code> with the same number, and the settings files (here <code>Drives.xml</code>).</p>' +
        '<p>AD replication carries the GPC; <em lang="en">DFS Replication</em> (DFSR) carries SYSVOL: two paths, each with ' +
        'its own timing. If the WAN goes down between them, the branch DC holds one half new and the other old.</p>' +
        '<p>The version number is the user-side version × 65536 + the computer-side version. A save changes both halves ' +
        'at once, on one DC: the console edits on the PDC emulator by default.</p>' +
        '<p>The client compares the number in the GPC with the one it last applied. If it is newer, it applies the GPO ' +
        'with whatever files its DC holds at that moment and records the new number. With old files it applies old ' +
        'settings under the new number, so the next normal refresh skips it even after the files arrive; only a forced ' +
        'refresh or the next change helps. The console shows an AD / SYSVOL version <em lang="en">mismatch</em>, but only ' +
        'while it lasts.</p>' +
        '<p>Two admins on two DCs: DFSR keeps the files of the later save and moves the other copy to ' +
        '<code>ConflictAndDeleted</code>. The numbers agree, the content does not. That is why a GPO is edited on one DC.</p>' +
        '<p>Simplified: two DCs, one GPO, time in ticks; the WAN comes back two ticks after the cut. Real delays are ' +
        'minutes, and replication schedules are not shown.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
