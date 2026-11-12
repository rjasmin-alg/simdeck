/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-quotas, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term
   (first mention; [[=term]] later ones). Paths, devices, numbers, commands, file names and the system's messages are
   data: the page puts them in translate="no" elements. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Korisnica piše na datotečni sustav s kvotom, a vrijeme prolazi',

      // params
      graceDays: 'Razdoblje odgode',
      fileLimits: 'Ograničenje broja datoteka (3 i 5)',
      fileLimitsHint: 'setquota dobiva 3 5 umjesto 0 0',
      script: 'Naredbe',

      // presets
      'preset_book-ana': 'Iz knjige: meko pa tvrdo',
      'preset_book-ana_hint': '45 MiB prolazi i pokreće sat, 20 MiB staje na 51200',
      'preset_grace-expires': 'Rok istekne',
      'preset_grace-expires_hint': 'nakon 8 dana ni 1 MiB ne prolazi, iako je ispod tvrdog',
      'preset_delete-resets': 'Brisanje vraća sat',
      'preset_delete-resets_hint': 'ispod mekog sat nestaje; novo prekoračenje dobiva novi rok',
      'preset_file-limit': 'Broj datoteka',
      'preset_file-limit_hint': 'meko 3, tvrdo 5 (i mapa se broji): treći touch prelazi meko, peti ne prolazi',
      'preset_other-fs': 'Drugi datotečni sustav',
      'preset_other-fs_hint': 'na /home kvota nema: istih 60 MiB prolazi',

      // legend
      legUsed: 'zauzeti blokovi',
      legSoft: 'meko ograničenje',
      legHard: 'tvrdo ograničenje',
      legOver: 'iznad mekog',
      legGrace: 'sat razdoblja odgode',
      legRefused: 'odbijeno pisanje',
      legChanged: 'promijenjeno u ovom koraku',

      // command box
      cmdTitle: 'Naredba',
      idle: 'Još nije pokrenuta nijedna naredba.',
      daysPass: ['Prošao je {n} dan', 'Prošla su {n} dana', 'Prošlo je {n} dana'],
      todayIs: 'danas je dan {day}',
      noOutput: 'bez ispisa',
      reportBelow: 'ispis: izvještaj ispod',

      // filesystem cards
      fsDev: '{type} na {dev}',
      fsOther: 'drugi datotečni sustav istog stroja',
      quotaOn: 'kvote uključene',
      quotaOff: 'kvote još nisu uključene',
      quotaNone: 'kvote nisu uključene',
      blocksRow: 'blokovi',
      filesRow: 'datoteke',
      softAt: 'meko {n}',
      hardAt: 'tvrdo {n}',
      usedIs: 'zauzeto {n}',
      noLimits: 'bez ograničenja',
      tick: '{n} MiB',
      rootLine: '{blocks}, {files}, bez ograničenja',
      graceLeft: 'još {left}',
      graceGone: 'isteklo',
      unitNote: 'blok = 1 KiB',

      // report and calendar
      reportTitle: 'Izvještaj',
      calTitle: 'Kalendar',
      calDays: 'dan',
      calToday: 'danas',
      calBlocks: 'sat za blokove',
      calFiles: 'sat za datoteke',
      calSpan: 'od dana {from} do roka {until}',
      calNoClock: 'Nijedan sat ne teče.',

      // plurals
      blocks: ['{n} blok', '{n} bloka', '{n} blokova'],
      files: ['{n} datoteka', '{n} datoteke', '{n} datoteka'],
      days: ['{n} dan', '{n} dana', '{n} dana'],
      filesAcc: ['{n} datoteku', '{n} datoteke', '{n} datoteka'],

      // captions: what the command did
      cap_start: 'Na {mount} kvote još nisu uključene i ana nema ograničenja; zauzima {used} i ima {files}.',
      cap_setquota: '{cmd} je korisnici ana postavio meko ograničenje {soft} i tvrdo {hard} blokova od 1 KiB ({softM} × 1024 i {hardM} × 1024).',
      cap_setquotaFilesNone: 'Za broj datoteka nema ograničenja ({zero}).',
      cap_setquotaFiles: 'Za broj datoteka: meko {isoft}, tvrdo {ihard}.',
      cap_notYet: 'Kvote još nisu uključene, pa se ništa ne provodi.',
      cap_repquota: '{cmd} ispisuje zauzeće i ograničenja u blokovima od 1 KiB: ana {used} / {soft} / {hard}. Ograničenja postoje, ali se još ne provode.',
      cap_repquotaOn: '{cmd} ispisuje zauzeće i ograničenja u blokovima od 1 KiB: ana {used} / {soft} / {hard}.',
      cap_quotaon: '{cmd} je uključio kvote na {dev}: od sada se ograničenja provode.',
      cap_crossed: 'ana je s {used} iznad mekog ograničenja ({soft}), a ispod tvrdog ({hard}). Pisanje je prošlo, ali od sada teče razdoblje odgode od {g} dana.',
      cap_crossedAtHard: 'ana je s {used} iznad mekog ograničenja ({soft}) i točno na tvrdom ({hard}), što je još dopušteno. Pisanje je prošlo, ali od sada teče razdoblje odgode od {g} dana.',
      cap_ddUnder: 'Pisanje je prošlo ({st}): s {used} ana je ispod mekog ograničenja ({soft}).',
      cap_ddAtSoft: 'Pisanje je prošlo ({st}): {used} je točno meko ograničenje, a to još nije prekoračenje.',
      cap_ddInGrace: 'Pisanje je prošlo ({st}): ana je i dalje iznad mekog ograničenja, a do roka ima još {left}.',
      cap_ddNoLimit: 'Pisanje je prošlo ({st}): ana ovdje nema ograničenja.',
      cap_ddOff: 'Pisanje je prošlo ({st}) bez ikakve provjere: kvote još nisu uključene.',
      cap_ddHome: 'Na {mount} kvote nisu uključene: ista ana upisala je {mib} MiB ({st}), iako je na {other} puna. Ograničenja vrijede po datotečnom sustavu.',
      cap_ddHard: 'Tvrdo ograničenje: od {want} KiB upisano je samo {written}, do zida na {hard}; ostatak je odbijen ({msg}, {st}). Datoteka {file} ostaje, nepotpuna.',
      cap_alsoCrossed: 'Usput je prijeđeno meko ograničenje ({soft}), pa teče razdoblje odgode od {g} dana.',
      cap_ddExpired: 'Razdoblje odgode isteklo je na dan {until}, pa se meko ograničenje provodi kao tvrdo: pisanje je odbijeno ({msg}, {st}) iako je {used} ispod tvrdog ograničenja ({hard}). Datoteka {file} je nastala, ali prazna.',
      cap_inodeHard: 'Tvrdo ograničenje broja datoteka: ana ih ima {files}, a smije najviše {ihard}, pa {file} nije stvorena ({msg}, {st}). Blokova ima napretek: ograničenja su odvojena.',
      cap_inodeExpired: 'Razdoblje odgode za datoteke isteklo je na dan {until}: nova datoteka {file} nije stvorena ({msg}, {st}).',
      cap_touch: '{cmd} je stvorio praznu datoteku {file}: ana sada ima {files}, a blokova nije trošila.',
      cap_touchNoLimit: 'Za broj datoteka nema ograničenja.',
      cap_touchUnder: 'Meko ograničenje broja datoteka je {isoft}.',
      cap_touchAtSoft: 'To je točno meko ograničenje ({isoft}), a to još nije prekoračenje: druga oznaka ostaje {flag}.',
      cap_touchCrossed: 'To je iznad mekog ograničenja ({isoft}): druga oznaka je {flag} i za datoteke teče vlastito razdoblje odgode od {g} dana.',
      cap_touchAtHard: 'To je točno tvrdo ograničenje ({ihard}): dopušteno, ali sljedeća datoteka više ne prolazi.',
      cap_touchInGrace: 'Iznad mekog ograničenja ({isoft}); do roka ima još {left}.',
      cap_rm: '{cmd} je obrisao {file} i oslobodio {freed}; ana je sada na {used}.',
      cap_rmCleared: 'To nije iznad mekog ograničenja ({soft}), pa je sat razdoblja odgode obrisan: sljedeće prekoračenje dobiva novo puno razdoblje ({g}).',
      cap_rmStill: 'I dalje je iznad mekog ograničenja: sat teče dalje.',
      cap_days: '{passed}; danas je dan {day}.',
      cap_daysRunning: 'Razdoblju odgode ostaje još {left} (sat je krenuo na dan {from}, rok je dan {until}): ana smije pisati do tvrdog ograničenja.',
      cap_daysExpired: 'Razdoblje odgode isteklo je na dan {until}: u stupcu grace sada piše {none}, a meko se ograničenje provodi kao tvrdo.',
      cap_daysNone: 'Nijedan sat ne teče, pa se ništa ne mijenja.',

      explain: '<p>Ograničenje zvano [[quota]] određuje koliko diskovnog prostora korisnik smije zauzeti, i to <b>po korisniku (ili grupi, projektu) i po datotečnom sustavu</b>: ista ana na drugom datotečnom sustavu istog stroja ima druga ograničenja ili nikakva.</p>' +
        '<p>Granice su dvije. [[hard limit]] se ne može prijeći: pisanje staje točno na njemu, uz poruku <code>Disk quota exceeded</code>, a [[exit status]] je 1. [[soft limit]] se smije prijeći, ali tada kreće sat: [[grace period]], zadano 7 dana. Dok sat teče, pisanje prolazi do tvrdog ograničenja; na dan roka meko se ograničenje počinje provoditi kao tvrdo. Kad zauzeće padne na meko ograničenje ili ispod njega, sat se briše, a sljedeće prekoračenje dobiva novi puni rok.</p>' +
        '<p>Brojke su u blokovima od 1 KiB (<code>40M</code> = 40 × 1024 = 40960). Zauzeće jednako mekom ograničenju nije iznad njega. Blokovi i broj datoteka ograničavaju se odvojeno, svaki sa svojim granicama i svojim satom; zato izvještaj ima dvije oznake (prva za blokove, druga za datoteke) i dva stupca <code>grace</code>. Ograničenja se provode tek kad su kvote uključene.</p>' +
        '<p>Česte zablude: da je meko ograničenje samo upozorenje (nakon roka je zid); da se tvrdo provjerava nakon pisanja (pisanje staje na njemu, a upisani dio ostaje); da kvota vrijedi za cijeli stroj (vrijedi za jedan datotečni sustav).</p>' +
        '<p>Izvan ovog prikaza: kvote grupa i projekata, poruke upozorenja, root koji ograničenja smije zaobići.</p>'
    },

    en: {
      stage: 'A user writes on a filesystem with a quota, and time passes',

      graceDays: 'Grace period',
      fileLimits: 'File limits (3 and 5)',
      fileLimitsHint: 'setquota gets 3 5 instead of 0 0',
      script: 'Commands',

      'preset_book-ana': 'From the book: soft, then hard',
      'preset_book-ana_hint': '45 MiB passes and starts the clock, 20 MiB stops at 51200',
      'preset_grace-expires': 'The grace period runs out',
      'preset_grace-expires_hint': 'after 8 days not even 1 MiB passes, though below hard',
      'preset_delete-resets': 'Deleting resets the clock',
      'preset_delete-resets_hint': 'below soft the clock is gone; a new crossing gets a new deadline',
      'preset_file-limit': 'Number of files',
      'preset_file-limit_hint': 'soft 3, hard 5 (her directory counts): the 3rd touch passes soft, the 5th is refused',
      'preset_other-fs': 'Another filesystem',
      'preset_other-fs_hint': 'no quotas on /home: the same 60 MiB goes through',

      legUsed: 'used blocks',
      legSoft: 'soft limit',
      legHard: 'hard limit',
      legOver: 'above soft',
      legGrace: 'grace period clock',
      legRefused: 'refused write',
      legChanged: 'changed in this step',

      cmdTitle: 'Command',
      idle: 'No command has run yet.',
      daysPass: ['{n} day passes', '{n} days pass'],
      todayIs: 'today is day {day}',
      noOutput: 'no output',
      reportBelow: 'output: the report below',

      fsDev: '{type} on {dev}',
      fsOther: 'another filesystem of the same machine',
      quotaOn: 'quotas on',
      quotaOff: 'quotas not on yet',
      quotaNone: 'quotas not on',
      blocksRow: 'blocks',
      filesRow: 'files',
      softAt: 'soft {n}',
      hardAt: 'hard {n}',
      usedIs: 'used {n}',
      noLimits: 'no limits',
      tick: '{n} MiB',
      rootLine: '{blocks}, {files}, no limits',
      graceLeft: '{left} left',
      graceGone: 'expired',
      unitNote: 'block = 1 KiB',

      reportTitle: 'Report',
      calTitle: 'Calendar',
      calDays: 'day',
      calToday: 'today',
      calBlocks: 'block clock',
      calFiles: 'file clock',
      calSpan: 'from day {from} to the deadline, day {until}',
      calNoClock: 'No clock is running.',

      blocks: ['{n} block', '{n} blocks'],
      files: ['{n} file', '{n} files'],
      days: ['{n} day', '{n} days'],
      filesAcc: ['{n} file', '{n} files'],

      cap_start: 'On {mount} quotas are not on yet and ana has no limits; she uses {used} and has {files}.',
      cap_setquota: '{cmd} gave ana a soft limit of {soft} and a hard limit of {hard} one-KiB blocks ({softM} × 1024 and {hardM} × 1024).',
      cap_setquotaFilesNone: 'There is no limit on the number of files ({zero}).',
      cap_setquotaFiles: 'Number of files: soft {isoft}, hard {ihard}.',
      cap_notYet: 'Quotas are not on yet, so nothing is enforced.',
      cap_repquota: '{cmd} prints usage and limits in one-KiB blocks: ana {used} / {soft} / {hard}. The limits exist but are not enforced yet.',
      cap_repquotaOn: '{cmd} prints usage and limits in one-KiB blocks: ana {used} / {soft} / {hard}.',
      cap_quotaon: '{cmd} turned quotas on for {dev}: from now on the limits are enforced.',
      cap_crossed: 'At {used} ana is above the soft limit ({soft}) and below the hard one ({hard}). The write went through, but the {g}-day grace period has started.',
      cap_crossedAtHard: 'At {used} ana is above the soft limit ({soft}) and exactly at the hard one ({hard}), which is still allowed. The write went through, but the {g}-day grace period has started.',
      cap_ddUnder: 'The write went through ({st}): at {used} ana is below the soft limit ({soft}).',
      cap_ddAtSoft: 'The write went through ({st}): {used} is exactly the soft limit, and that is not over it yet.',
      cap_ddInGrace: 'The write went through ({st}): ana is still above the soft limit, with {left} to the deadline.',
      cap_ddNoLimit: 'The write went through ({st}): ana has no limits here.',
      cap_ddOff: 'The write went through ({st}) with no check at all: quotas are not on yet.',
      cap_ddHome: 'Quotas are not on for {mount}: the same ana wrote {mib} MiB ({st}), although {other} is full for her. Limits are per filesystem.',
      cap_ddHard: 'Hard limit: of {want} KiB only {written} were written, up to the wall at {hard}; the rest was refused ({msg}, {st}). The file {file} stays, incomplete.',
      cap_alsoCrossed: 'On the way the soft limit ({soft}) was passed, so the {g}-day grace period has started.',
      cap_ddExpired: 'The grace period ran out on day {until}, so the soft limit is enforced like the hard one: the write was refused ({msg}, {st}) although {used} is below the hard limit ({hard}). The file {file} was created, but empty.',
      cap_inodeHard: 'Hard limit on files: ana has {files} and may have at most {ihard}, so {file} was not created ({msg}, {st}). There are blocks to spare: the limits are separate.',
      cap_inodeExpired: 'The grace period for files ran out on day {until}: the new file {file} was not created ({msg}, {st}).',
      cap_touch: '{cmd} created the empty file {file}: ana now has {files}, and used no blocks.',
      cap_touchNoLimit: 'There is no limit on the number of files.',
      cap_touchUnder: 'The soft limit on files is {isoft}.',
      cap_touchAtSoft: 'That is exactly the soft limit ({isoft}), and that is not over it yet: the second flag stays {flag}.',
      cap_touchCrossed: 'That is above the soft limit ({isoft}): the second flag is {flag}, and files get their own {g}-day grace period.',
      cap_touchAtHard: 'That is exactly the hard limit ({ihard}): allowed, but the next file will not pass.',
      cap_touchInGrace: 'Above the soft limit ({isoft}); {left} to the deadline.',
      cap_rm: '{cmd} deleted {file} and freed {freed}; ana is now at {used}.',
      cap_rmCleared: 'That is not above the soft limit ({soft}), so the grace clock is cleared: the next crossing gets a new full period ({g}).',
      cap_rmStill: 'Still above the soft limit: the clock keeps running.',
      cap_days: '{passed}; today is day {day}.',
      cap_daysRunning: 'The grace period has {left} left (the clock started on day {from}, the deadline is day {until}): ana may write up to the hard limit.',
      cap_daysExpired: 'The grace period ran out on day {until}: the grace column now says {none}, and the soft limit is enforced like the hard one.',
      cap_daysNone: 'No clock is running, so nothing changes.',

      explain: '<p>A [[quota]] limits how much disk space a user may take, <b>per user (or group, project) and per filesystem</b>: the same ana on another filesystem of the same machine has other limits, or none.</p>' +
        '<p>There are two limits. The [[hard limit]] cannot be passed: a write stops exactly at it with <code>Disk quota exceeded</code>, and the [[exit status]] is 1. The [[soft limit]] may be passed, but then a clock starts: the [[grace period]], 7 days by default. While it runs, writes go through up to the hard limit; on the deadline day the soft limit starts to be enforced like the hard one. When usage drops to the soft limit or below, the clock is cleared, and the next crossing gets a new full period.</p>' +
        '<p>The numbers are one-KiB blocks (<code>40M</code> = 40 × 1024 = 40960). Usage equal to the soft limit is not above it. Blocks and the number of files are limited separately, each with its own limits and its own clock; that is why the report has two flags (the first for blocks, the second for files) and two <code>grace</code> columns. The limits are enforced only once quotas are on.</p>' +
        '<p>Common misconceptions: that the soft limit is only a warning (after the deadline it is a wall); that the hard limit is checked after the write (the write stops at it, and the part written stays); that a quota holds for the whole machine (it holds for one filesystem).</p>' +
        '<p>Not shown here: group and project quotas, warning messages, root being allowed past the limits.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
