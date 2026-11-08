/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vremenska crta zapisa: rok čuvanja, brisanje, spor i sigurnosne kopije',

      years: ['{n} godina', '{n} godine', '{n} godina'],
      months: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],

      // the lanes
      cls_app: 'Prijave na natječaj',
      cls_contract: 'Ugovori s kupcima',
      cls_staff: 'Dosjei radnika',
      trig_app: 'rok od odluke o odabiru',
      trig_contract: 'rok od kraja ugovora',
      trig_staff: 'rok od kraja radnog odnosa',
      appName: 'natječaj {y}',
      rec_app: 'natječaj {name}',
      rec_contract: 'ugovor {name}',
      rec_staff: 'dosje {name}',
      retDown: '{what}: kraći rok čuvanja',
      retUp: '{what}: dulji rok čuvanja',
      touched: 'spor',
      rowLabel: '{name}: {status}',
      st_active: 'u upotrebi',
      st_kept: 'u roku čuvanja',
      st_held: 'potreban zbog spora',
      st_tooLong: 'predugo čuvan',
      st_onTime: 'obrisan na vrijeme',
      st_late: 'obrisan kasno',
      st_underHold: 'obrisan tijekom spora',

      // the tiles
      kTooLong: 'Predugo čuvano',
      kTooLongSub: ['ukupno {m} mjesec viška', 'ukupno {m} mjeseca viška', 'ukupno {m} mjeseci viška'],
      kOnTime: 'Obrisano na vrijeme',
      kOnTimeSub: 'obrisano {d}, kasno {l}',
      kUnderHold: 'Obrisano tijekom spora',
      kUnderHoldSub: 'dok ga je spor trebao',
      kUnderHoldNone: 'nema spora',
      kBackup: 'Obrisano, još u sigurnosnim kopijama',
      kBackupSub: 'zadnji do {date}',
      kBackupNone: 'nijedan',

      // the controls on the stage
      ctlDispute: 'Spor:',
      ctlFrom: 'od {y}.',
      ctlNone: 'nema spora',
      fromDown: 'Spor počinje ranije',
      fromUp: 'Spor počinje kasnije',
      lenDown: 'Spor traje kraće',
      lenUp: 'Spor traje dulje',
      ctlBackup: 'Jedna sigurnosna kopija čuva se',
      backupDown: 'Sigurnosne kopije čuvaju se kraće',
      backupUp: 'Sigurnosne kopije čuvaju se dulje',

      // the bands
      bandDispute: 'spor {a}–{b}',
      bandDispute1: 'spor {a}.',
      bandPaper: 'obustava samo najavljena',
      bandHeld: 'obustava u rutini brisanja',
      bandAll: 'obustava na sve zapise',
      bandForgotten: 'obustava nije ukinuta',
      nowLabel: 'kraj {y}.',

      // params, presets, legend
      ctlNow: 'Godina:',
      nowDown: 'Godinu ranije',
      nowUp: 'Godinu kasnije',
      purge: 'Brisanje kad rok istekne',
      purgeNone: 'nema',
      purgeYearly: 'jednom godišnje',
      purgeMonthly: 'svaki mjesec',
      dispute: 'Spor',
      disputeNone: 'nema',
      disputeCustomer: 's kupcem',
      disputeEmployee: 's bivšim radnikom',
      hold: 'Obustava brisanja zbog spora',
      holdPaper: 'najava',
      holdHeld: 'u rutini',
      holdForgotten: 'neukinuta',
      holdAll: 'na sve',
      noDispute: 'Nema spora.',
      pNone: 'Ništa se ne briše',
      pNoneHint: 'Rokovi su zapisani, a nitko ništa ne briše: zapisi ostaju godinama nakon roka.',
      pRoutine: 'Brisanje svaki mjesec',
      pRoutineHint: 'Svaki mjesec briše se što je isteklo, a obrisano ostaje u sigurnosnim kopijama još godinu.',
      pPaper: 'Obustava samo najavljena',
      pPaperHint: 'Spor s kupcem Lipa 2027.–2029.: obustava je najavljena e-poštom, a rutina brisanja ne zna za nju.',
      pHeld: 'Obustava u rutini',
      pHeldHint: 'Rutina preskače ugovor koji spor treba i briše ga kad se obustava ukine.',
      pForgotten: 'Obustava nikad ukinuta',
      pForgottenHint: 'Spor je završen 2029., a obustava nije ukinuta: ugovor ostaje predugo.',
      pArchive: 'Arhiva od deset godina',
      pArchiveHint: 'Brisanje radi na vrijeme, ali sigurnosne kopije čuvaju se deset godina.',
      legUse: 'u upotrebi',
      legKeep: 'rok čuvanja',
      legNeed: 'za spor',
      legOver: 'predugo',
      legDel: 'obrisan na vrijeme',
      legLate: 'obrisan kasno',
      legUnder: 'obrisan u sporu',
      legBackup: 'u kopiji',

      // the caption
      capMain: 'Kraj {y}.: s razlogom čuvano {kept}, predugo čuvano {tooLong}, obrisano {del} (na vrijeme {ok}).',
      nPaper: 'Obustava je samo najavljena, a rutina brisanja ne zna za nju: {rec} obrisan je {date}, dok ga je spor trebao do {end}.',
      nGone: 'Još {date} obrisan je {rec}, prije početka spora: obustava nema što zadržati, a podaci su možda još samo u sigurnosnim kopijama.',
      nGoneAged: 'Još {date} obrisan je {rec}, prije početka spora, a sigurnosne kopije s njim već su istekle: obustava nema što zadržati.',
      nForgotten: 'Spor je završen {end}, a obustava nije ukinuta: {rec} čuva se već {n} bez razloga.',
      nAll: 'Obustava na sve zapise zadržala je i zapise koji sa sporom nemaju veze ({n}): obrisani su kasno, tek kad je obustava ukinuta.',
      nHeld: 'Rutina preskače samo {rec}, jer ga spor treba; ostalo briše na vrijeme. Kad se obustava ukine, briše se i on.',
      nNone: 'Bez rutine brisanja ništa se ne briše, a čuvanje dulje od roka također krši načelo ograničenja pohrane.',
      nYearly: 'Brisanje jednom godišnje: zapisi čekaju i do {max} nakon roka.',
      nBackup: 'Obrisanih zapisa još u skupu sigurnosnih kopija: {n}, zadnji do {until}.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, zapisi i rokovi su izmišljeni; zakonski rokovi su drugačiji.',

      explain:
        '<p>Svaka vrsta zapisa čuva se <b>rok čuvanja</b> (<i>retention period</i>) koji se računa od događaja: ' +
        'kraja ugovora, kraja radnog odnosa, odluke o odabiru. Kad rok istekne, zapis s osobnim podacima treba ' +
        'obrisati: <b>ograničenje pohrane</b> (<i>storage limitation</i>) je obveza jednako kao čuvanje.</p>' +
        '<ul>' +
        '<li>Rok zapisan u politici ne briše ništa: briše <b>rutina brisanja</b>. Bez nje zapisi ostaju godinama, ' +
        'a jednom godišnje znači do godinu dana viška.</li>' +
        '<li><b>Obustava brisanja zbog spora</b> (<i>legal hold</i>) zadržava samo zapise koje spor ili istraga ' +
        'trebaju, i samo dok traju. Najava koju rutina brisanja ne zna briše dokaz; obustava koja se nikad ne ' +
        'ukine i obustava na sve zapise čuvaju predugo.</li>' +
        '<li>Obrisan zapis ostaje u <b>sigurnosnim kopijama</b> (<i>backups</i>) dok one ne isteknu. Rok čuvanja ' +
        'kopija određuje koliko dugo; obnova iz kopije ne smije vratiti obrisano u upotrebu.</li>' +
        '</ul>' +
        '<p>U Hrvatskoj zakonske rokove čuvanja računovodstvenih, platnih i kadrovskih zapisa određuje više zakona ' +
        '(Zakon o računovodstvu, Zakon o radu, Zakon o arhivskom gradivu i arhivima); rokovi na ovoj stranici su ' +
        'izmišljeni.</p>' +
        '<p>Srodno: pravila čuvanja sigurnosnih kopija; zahtjev ispitanika za brisanje.</p>' +
        '<p>Odakle: Opća uredba o zaštiti podataka (EU) 2016/679, čl. 5. st. 1. t. (e) (ograničenje pohrane), ' +
        'čl. 17. (pravo na brisanje; st. 3. t. (e): pravni zahtjevi), čl. 30. st. 1. t. (f) (predviđeni rokovi ' +
        'za brisanje u evidenciji aktivnosti obrade); ISO/IEC 27001:2022, kontrole 5.33, 8.10 i 8.13.</p>'
    },

    en: {
      stage: 'Records on a timeline: retention, deletion, the dispute and the backups',

      years: ['{n} year', '{n} years'],
      months: ['{n} month', '{n} months'],

      cls_app: 'Job applications',
      cls_contract: 'Customer contracts',
      cls_staff: 'Personnel files',
      trig_app: 'counted from the hiring decision',
      trig_contract: 'counted from the end of the contract',
      trig_staff: 'counted from the end of employment',
      appName: 'hiring {y}',
      rec_app: 'hiring {name}',
      rec_contract: 'the {name} contract',
      rec_staff: '{name}\'s personnel file',
      retDown: '{what}: shorter retention',
      retUp: '{what}: longer retention',
      touched: 'dispute',
      rowLabel: '{name}: {status}',
      st_active: 'in use',
      st_kept: 'within retention',
      st_held: 'needed by the dispute',
      st_tooLong: 'kept too long',
      st_onTime: 'deleted on time',
      st_late: 'deleted late',
      st_underHold: 'deleted during the dispute',

      kTooLong: 'Kept too long',
      kTooLongSub: ['{m} month over in all', '{m} months over in all'],
      kOnTime: 'Deleted on time',
      kOnTimeSub: 'deleted {d}, late {l}',
      kUnderHold: 'Deleted during the dispute',
      kUnderHoldSub: 'while the dispute needed it',
      kUnderHoldNone: 'no dispute',
      kBackup: 'Erased, still in the backups',
      kBackupSub: 'the last until {date}',
      kBackupNone: 'none',

      ctlDispute: 'Dispute:',
      ctlFrom: 'from {y}',
      ctlNone: 'no dispute',
      fromDown: 'The dispute starts earlier',
      fromUp: 'The dispute starts later',
      lenDown: 'The dispute is shorter',
      lenUp: 'The dispute is longer',
      ctlBackup: 'One backup is kept for',
      backupDown: 'Backups are kept for less time',
      backupUp: 'Backups are kept for longer',

      bandDispute: 'dispute {a}–{b}',
      bandDispute1: 'dispute {a}',
      bandPaper: 'hold announced only',
      bandHeld: 'hold in the deletion routine',
      bandAll: 'hold on every record',
      bandForgotten: 'hold never lifted',
      nowLabel: 'end of {y}',

      ctlNow: 'Year:',
      nowDown: 'A year earlier',
      nowUp: 'A year later',
      purge: 'Deletion when retention ends',
      purgeNone: 'none',
      purgeYearly: 'once a year',
      purgeMonthly: 'every month',
      dispute: 'Dispute',
      disputeNone: 'none',
      disputeCustomer: 'a customer',
      disputeEmployee: 'a former employee',
      hold: 'Legal hold',
      holdPaper: 'notice',
      holdHeld: 'in routine',
      holdForgotten: 'not lifted',
      holdAll: 'on all',
      noDispute: 'There is no dispute.',
      pNone: 'Nothing is deleted',
      pNoneHint: 'The periods are written down and nobody deletes anything: records stay for years past their date.',
      pRoutine: 'Deleted every month',
      pRoutineHint: 'Each month what has expired is deleted, and the erased data stays in the backups for another year.',
      pPaper: 'Hold announced only',
      pPaperHint: 'A dispute with the customer Lipa, 2027–2029: the hold goes out by e-mail; the deletion routine never hears of it.',
      pHeld: 'Hold in the routine',
      pHeldHint: 'The routine skips the contract the dispute needs and deletes it when the hold is lifted.',
      pForgotten: 'Hold never lifted',
      pForgottenHint: 'The dispute ended in 2029 and nobody lifted the hold: the contract stays too long.',
      pArchive: 'A ten-year archive',
      pArchiveHint: 'Deletion runs on time, but the backups are kept for ten years.',
      legUse: 'in use',
      legKeep: 'retention',
      legNeed: 'held for dispute',
      legOver: 'too long',
      legDel: 'deleted on time',
      legLate: 'deleted late',
      legUnder: 'deleted in dispute',
      legBackup: 'in a backup',

      capMain: 'End of {y}: kept for a reason {kept}, kept too long {tooLong}, deleted {del} (on time {ok}).',
      nPaper: 'The hold was only announced and the deletion routine does not know of it: {rec} was deleted in {date}, while the dispute needed it until {end}.',
      nGone: 'Back in {date} {rec} was deleted, before the dispute began: the hold has nothing to keep, and the data may be left only in the backups.',
      nGoneAged: 'Back in {date} {rec} was deleted, before the dispute began, and the backups holding it have aged out: the hold has nothing to keep.',
      nForgotten: 'The dispute ended in {end} and the hold was never lifted: {rec} has been kept for {n} with no reason.',
      nAll: 'A hold on every record also kept records that have nothing to do with the dispute ({n}): they were deleted late, only when the hold was lifted.',
      nHeld: 'The routine skips only {rec}, because the dispute needs it, and deletes the rest on time. When the hold is lifted, it goes too.',
      nNone: 'Without a deletion routine nothing is deleted, and keeping data past its period infringes the storage limitation principle too.',
      nYearly: 'Deleted once a year: records wait up to {max} past their date.',
      nBackup: 'Erased records still in the backup set: {n}, the last until {until}.',

      foot: 'Simplified, not legal advice. The firm, the records and the periods are made up; statutory periods differ.',

      explain:
        '<p>Each class of records is kept for a <b>retention period</b> counted from an event: the end of a ' +
        'contract, the end of employment, the hiring decision. When it runs out, a record with personal data ' +
        'must be deleted: <b>storage limitation</b> is as much an obligation as keeping.</p>' +
        '<ul>' +
        '<li>A period written in the policy deletes nothing; a <b>deletion routine</b> does. Without one, records ' +
        'stay for years; once a year means up to a year too long.</li>' +
        '<li>A <b>legal hold</b> keeps only the records a dispute or an investigation needs, and only while it ' +
        'lasts. An announcement the deletion routine never hears of destroys the evidence; a hold never lifted, ' +
        'or one on every record, keeps too much for too long.</li>' +
        '<li>An erased record stays in the <b>backups</b> until they age out. The backups\' own retention decides ' +
        'how long; a restore must not bring erased data back into use.</li>' +
        '</ul>' +
        '<p>In Croatia the statutory retention periods for accounting, payroll and personnel records come from ' +
        'several laws (Zakon o računovodstvu, Zakon o radu, Zakon o arhivskom gradivu i arhivima); the periods on ' +
        'this page are made up.</p>' +
        '<p>Related: backup retention rules; a data subject\'s request for erasure.</p>' +
        '<p>Sources: General Data Protection Regulation (EU) 2016/679, art. 5(1)(e) (storage limitation), ' +
        'art. 17 (right to erasure; 17(3)(e): legal claims), art. 30(1)(f) (envisaged time limits for erasure in the ' +
        'record of processing activities); ISO/IEC 27001:2022, controls 5.33, 8.10 and 8.13.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
