/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of retention-gfs, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. The title and subtitle are not here: they come from
   sim.json (title, concept). Rule ids (last, daily, weekly, monthly, yearly, all) are the model's. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kalendar godine 2026. s kopijama koje se čuvaju i brojke retencije',
      date: '{d}. {mon}',
      dateY: '{d}. {mon} {y}.',
      dmon1: '1.', dmon2: '2.', dmon3: '3.', dmon4: '4.', dmon5: '5.', dmon6: '6.',
      dmon7: '7.', dmon8: '8.', dmon9: '9.', dmon10: '10.', dmon11: '11.', dmon12: '12.',
      mon1: 'sij', mon2: 'velj', mon3: 'ožu', mon4: 'tra', mon5: 'svi', mon6: 'lip',
      mon7: 'srp', mon8: 'kol', mon9: 'ruj', mon10: 'lis', mon11: 'stu', mon12: 'pro',
      wd1: 'pon', wd2: 'uto', wd3: 'sri', wd4: 'čet', wd5: 'pet', wd6: 'sub', wd7: 'ned',
      daysN: ['{n} dan', '{n} dana', '{n} dana'],
      pointsN: ['{n} točka oporavka', '{n} točke oporavka', '{n} točaka oporavka'],
      and: ' i ',

      'tag-last': 'Z', 'tag-daily': 'D', 'tag-weekly': 'T', 'tag-monthly': 'M', 'tag-yearly': 'G', 'tag-all': 'S',
      'adj-last': ['{n} zadnja', '{n} zadnje', '{n} zadnjih'],
      'adj-daily': ['{n} dnevna', '{n} dnevne', '{n} dnevnih'],
      'adj-weekly': ['{n} tjedna', '{n} tjedne', '{n} tjednih'],
      'adj-monthly': ['{n} mjesečna', '{n} mjesečne', '{n} mjesečnih'],
      'adj-yearly': ['{n} godišnja', '{n} godišnje', '{n} godišnjih'],
      'rule-last': 'Pravilo zadnjih kopija', 'rule-daily': 'Dnevno pravilo', 'rule-weekly': 'Tjedno pravilo',
      'rule-monthly': 'Mjesečno pravilo', 'rule-yearly': 'Godišnje pravilo',
      'per-last': ['{n} kopiju', '{n} kopije', '{n} kopija'],
      'per-daily': ['{n} dan', '{n} dana', '{n} dana'],
      'per-weekly': ['{n} tjedan', '{n} tjedna', '{n} tjedana'],
      'per-monthly': ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      'per-yearly': ['{n} godinu', '{n} godine', '{n} godina'],

      'c-last': 'Zadnje kopije',
      'c-daily': 'Dnevne',
      'c-weekly': 'Tjedne',
      'c-monthly': 'Mjesečne',
      'c-yearly': 'Godišnje',
      cFail: 'Posao pada od',
      'fail-none': 'nikad',
      'fail-2026-09-14': '14. 9.',
      cDetect: 'Greška primijećena nakon',
      detectOff: 'isključeno',
      cDay: 'Godina teče do',

      presetUl: 'Primjer 6: greška nakon 42 dana',
      presetUlHint: '7 dnevnih + 4 tjedne: najstarija točka stara je 32 dana, nema se kamo vratiti',
      presetGfs: 'Djed-otac-sin: 7 + 4 + 12',
      presetGfsHint: '21 točka, najstarija 340 dana unatrag',
      presetLast: 'Samo 30 zadnjih',
      presetLastHint: '30 točaka, ali samo 29 dana unatrag',
      presetDr: 'Noćne kopije virtualnih strojeva',
      presetDrHint: 'Do 13. 9.: 4 tjedne i 7 dnevnih, ukupno 11',
      presetDrFail: 'Isto, a poslovi padaju od 14. 9.',
      presetDrFailHint: 'Do 1. 11.: istih 11, najnovija stara 49 dana',

      lgDaily: 'dnevna (D)',
      lgWeekly: 'tjedna (T)',
      lgMonthly: 'mjesečna (M)',
      lgYearly: 'godišnja (G)',
      lgLast: 'zadnja (Z)',
      lgAll: 'sve (S)',
      lgPruned: 'orezana',
      lgFailed: 'posao pao',
      lgChanged: 'promijenjeno',

      stripHead: 'Jedna kopija svake noći u {time}; danas je {today}',
      stripFault: 'Greška je nastala {fault}',
      stPoints: 'Točke oporavka',
      stOldest: 'Najstarija točka, starost',
      stNewest: 'Najnovija točka, starost',
      stGap: 'Najveći razmak',
      stToday: 'danas',
      stRange: '{from} → {to}',
      stNone: 'nema',
      stAll: 'sve, bez orezivanja',
      stVerdict: 'Greška od prije {after}',
      vNo: 'nema čiste točke',
      vNoSub: 'nastala {fault}, a najstarija je točka novija',
      vYes: 'vrati na {date}',
      vYesSub: 'točka stara {age}',

      chRule: '{rule} {a} → {b}: točaka oporavka {c0} → {c1}, najstarija {o0} → {o1}.',
      sPlain: '{list}: {points}, najstarija stara {oldest}. Najveći razmak između dviju točaka: {gap}.',
      sShortCovered: '{rule} zadržava samo {got} od {asked}: dosad ih je bilo {total}, a {covered} od toga već pokrivaju pravila prije njega.',
      sShortRun: '{rule} zadržava samo {got} od {asked}: dosad ih je bilo tek {total}.',
      sAll: 'Nijedno pravilo nije postavljeno, pa se ništa ne orezuje: čuva se svih {points} i prostor samo raste.',
      sNone: 'Nema nijedne kopije.',
      sFailing: 'Poslovi padaju od {fail}, pa se ni orezivanje ne pokreće: {points} ostaju kakve su bile, a najnovija je stara {newest}. Nitko o tome ne dobiva obavijest.',
      vcNo: 'Greška primijećena nakon {after} nema se kamo vratiti: najstarija točka ({oldest}) novija je od greške, nastale {fault}, pa su sve kopije već zahvaćene.',
      vcYes: 'Greška primijećena nakon {after} ima čistu točku: oporavak se vraća na {clean}, {age} unatrag.',

      explain:
        '<p>[[retention]] je pravilo koje kaže koliko se kopija čuva i koliko dugo. Ovdje se kopija radi svake noći ' +
        'kroz 2026., a nakon svakog <b>uspješnog</b> posla slijedi orezivanje (<em lang="en">prune</em>): briše se sve ' +
        'što nijedno pravilo ne zadržava. Ono što ostane skup je točaka na koje se oporavkom može vratiti; svaka je ' +
        '[[recovery point]].</p>' +
        '<p>Pravila se primjenjuju redom: zadnje, dnevne, tjedne (tjedan od ponedjeljka do nedjelje), mjesečne, ' +
        'godišnje. Svako zadržava najnoviju kopiju u svakom od zadnjih N razdoblja, ali razdoblje koje je pravilo prije ' +
        'već pokrilo preskače i ne broji. Zato 7 dnevnih i 4 tjedne daju 11 točaka koje sežu pet tjedana unatrag, a ne ' +
        '11 tjedana.</p>' +
        '<p>Djed-otac-sin (<em lang="en">grandfather-father-son</em>, GFS): sinovi su dnevne kopije, očevi tjedne, ' +
        'djedovi mjesečne. Točke su guste blizu danas, a sve rjeđe što su starije, pa malo kopija seže daleko. ' +
        '30 zadnjih kopija ima ih više nego 7 + 4 + 12, a seže samo 29 dana unatrag.</p>' +
        '<p>Orezivanje je postupno: kopija obrisana danas ne vraća se kad je kasnije pravilo „htjelo”. Zato je ' +
        'mjesečna točka siječnja 25. 1., zadnja tjedna koja je preživjela, a ne 31. 1.</p>' +
        '<p>Kad posao padne, ne nastaje nova kopija i ništa se ne briše: stare kopije ostaju, ali stare. Retencija ne ' +
        'štiti od posla koji ne radi; to otkrivaju nadzor i [[restore test]]. Ako su sve brojke 0, ništa se ne ' +
        'orezuje i prostor samo raste.</p>' +
        '<p>Brojke se izvode iz dvaju pitanja: koliko posla smijete izgubiti (razmak između točaka) i koliko dugo ' +
        'greška može ostati neprimijećena (koliko unatrag mora postojati točka).</p>'
    },
    en: {
      stage: 'Calendar of 2026 with the backups kept, and the retention numbers',
      date: '{d} {mon}',
      dateY: '{d} {mon} {y}',
      dmon1: 'Jan', dmon2: 'Feb', dmon3: 'Mar', dmon4: 'Apr', dmon5: 'May', dmon6: 'Jun',
      dmon7: 'Jul', dmon8: 'Aug', dmon9: 'Sep', dmon10: 'Oct', dmon11: 'Nov', dmon12: 'Dec',
      mon1: 'Jan', mon2: 'Feb', mon3: 'Mar', mon4: 'Apr', mon5: 'May', mon6: 'Jun',
      mon7: 'Jul', mon8: 'Aug', mon9: 'Sep', mon10: 'Oct', mon11: 'Nov', mon12: 'Dec',
      wd1: 'Mon', wd2: 'Tue', wd3: 'Wed', wd4: 'Thu', wd5: 'Fri', wd6: 'Sat', wd7: 'Sun',
      daysN: ['{n} day', '{n} days'],
      pointsN: ['{n} recovery point', '{n} recovery points'],
      and: ' and ',

      'tag-last': 'L', 'tag-daily': 'D', 'tag-weekly': 'W', 'tag-monthly': 'M', 'tag-yearly': 'Y', 'tag-all': 'A',
      'adj-last': ['{n} newest', '{n} newest'],
      'adj-daily': ['{n} daily', '{n} daily'],
      'adj-weekly': ['{n} weekly', '{n} weekly'],
      'adj-monthly': ['{n} monthly', '{n} monthly'],
      'adj-yearly': ['{n} yearly', '{n} yearly'],
      'rule-last': 'The newest-copies rule', 'rule-daily': 'The daily rule', 'rule-weekly': 'The weekly rule',
      'rule-monthly': 'The monthly rule', 'rule-yearly': 'The yearly rule',
      'per-last': ['{n} backup', '{n} backups'],
      'per-daily': ['{n} day', '{n} days'],
      'per-weekly': ['{n} week', '{n} weeks'],
      'per-monthly': ['{n} month', '{n} months'],
      'per-yearly': ['{n} year', '{n} years'],

      'c-last': 'Newest copies',
      'c-daily': 'Daily',
      'c-weekly': 'Weekly',
      'c-monthly': 'Monthly',
      'c-yearly': 'Yearly',
      cFail: 'Jobs fail from',
      'fail-none': 'never',
      'fail-2026-09-14': '14 Sep',
      cDetect: 'Fault noticed after',
      detectOff: 'off',
      cDay: 'Run the year to',

      presetUl: 'Example 6: a fault 42 days old',
      presetUlHint: '7 daily + 4 weekly: the oldest point is 32 days old, nowhere to go back to',
      presetGfs: 'Grandfather-father-son: 7 + 4 + 12',
      presetGfsHint: '21 points, the oldest 340 days back',
      presetLast: 'Only the newest 30',
      presetLastHint: '30 points, but only 29 days back',
      presetDr: 'Nightly backups of virtual machines',
      presetDrHint: 'To 13 Sep: 4 weekly and 7 daily, 11 in all',
      presetDrFail: 'The same, jobs failing from 14 Sep',
      presetDrFailHint: 'To 1 Nov: the same 11, the newest 49 days old',

      lgDaily: 'daily (D)',
      lgWeekly: 'weekly (W)',
      lgMonthly: 'monthly (M)',
      lgYearly: 'yearly (Y)',
      lgLast: 'newest (L)',
      lgAll: 'all (A)',
      lgPruned: 'pruned',
      lgFailed: 'job failed',
      lgChanged: 'changed',

      stripHead: 'One backup every night at {time}; today is {today}.',
      stripFault: 'The fault appeared on {fault}.',
      stPoints: 'Recovery points',
      stOldest: 'Oldest point, age',
      stNewest: 'Newest point, age',
      stGap: 'Largest gap',
      stToday: 'today',
      stRange: '{from} → {to}',
      stNone: 'none',
      stAll: 'all of them, nothing pruned',
      stVerdict: 'Fault from {after} ago',
      vNo: 'no clean point',
      vNoSub: 'appeared {fault}; the oldest point is newer',
      vYes: 'restore {date}',
      vYesSub: 'a point {age} old',

      chRule: '{rule} {a} → {b}: recovery points {c0} → {c1}, oldest {o0} → {o1}.',
      sPlain: '{list}: {points}, the oldest {oldest} old. Largest gap between two points: {gap}.',
      sShortCovered: '{rule} keeps only {got} of {asked}: the run so far has had {total}, and {covered} of them are covered by the rules before it.',
      sShortRun: '{rule} keeps only {got} of {asked}: the run so far has had only {total}.',
      sAll: 'No rule is set, so nothing is pruned: all {points} stay and the space only grows.',
      sNone: 'There is no backup at all.',
      sFailing: 'Jobs have failed since {fail}, so the prune never ran: the same {points} sit there and the newest is {newest} old. Nobody is told.',
      vcNo: 'A fault noticed after {after} has nowhere to go back to: the oldest point ({oldest}) is newer than the fault, which appeared on {fault}, so every copy already holds it.',
      vcYes: 'A fault noticed after {after} has a clean point: the restore goes back to {clean}, {age} back.',

      explain:
        '<p>[[retention]] is the rule that says how many copies are kept and for how long. Here a backup is taken every ' +
        'night through 2026, and after every <b>successful</b> job a prune deletes whatever no rule keeps. What is left ' +
        'is the set of points a restore can go back to; each is a [[recovery point]].</p>' +
        '<p>The rules apply in order: newest, daily, weekly (Monday to Sunday), monthly, yearly. Each keeps the newest ' +
        'backup in each of the last N periods, but skips a period an earlier rule already covers, without counting it. ' +
        'That is why 7 daily and 4 weekly give 11 points reaching five weeks back, not 11 weeks.</p>' +
        '<p>Grandfather-father-son (GFS): the sons are the daily copies, the fathers the weekly, the grandfathers the ' +
        'monthly. Points are dense near today and sparser the older they get, so a few copies reach far. The newest 30 ' +
        'are more copies than 7 + 4 + 12, and reach only 29 days back.</p>' +
        '<p>The prune is progressive: a copy deleted today does not come back when a later rule “would have” kept it. ' +
        'That is why January’s monthly point is 25 Jan, the last weekly that survived, not 31 Jan.</p>' +
        '<p>When the job fails, no new copy is made and nothing is deleted: the old copies stay, and grow old. ' +
        'Retention does not protect against a job that does not run; monitoring and a [[restore test]] find that. If ' +
        'every count is 0, nothing is pruned and the space only grows.</p>' +
        '<p>The numbers come from two questions: how much work you may lose (the gap between points), and how long a ' +
        'fault may go unnoticed (how far back a point must exist).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
