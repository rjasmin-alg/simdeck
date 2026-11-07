/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tjedan administratorskog tima, krađe vjerodajnica i račun za hitne slučajeve',

      // the people (made up; the same in both languages)
      n_0: 'Ana', n_1: 'Bruno', n_2: 'Iva', n_3: 'Dino', n_4: 'Maja', n_5: 'Luka', n_6: 'Sara', n_7: 'Toni',
      d_0: 'Pon', d_1: 'Uto', d_2: 'Sri', d_3: 'Čet', d_4: 'Pet', d_5: 'Sub', d_6: 'Ned',

      // the numbers
      kThefts: 'Ukradene vjerodajnice',
      barStanding: 'Stalna prava',
      barJit: 'Privremena prava',
      barOf: '{k} od {t} ({pct})',
      barExp: 'očekivano {e}',
      barHours: '{h} h godišnje po osobi',
      kElev: 'Podizanja ovlasti godišnje',
      kElevSub: 'svako zatraženo, odobreno, zapisano',
      kNone: 'nema ih',

      // the week
      headWeek: 'Tjedan tima: kad tko ima administratorska prava i kad je vjerodajnica ukradena',
      rowLabel: '{who}: krađa {n}, s administratorskim pravima {k}',
      rowStanding: 'prava cijeli tjedan',
      idpDown: 'Sustav identiteta ne radi: nitko se ne može prijaviti kao administrator ni dobiti podizanje ovlasti',

      // the break-glass account
      headGlass: 'Račun za hitne slučajeve',
      s_0: 'Zapečaćen',
      s_1: 'Ispad sustava identiteta',
      s_1day: 'Običan dan',
      s_3off: 'Bez upozorenja',
      s_4none: 'Bez pregleda',
      s_5none: 'Nije zapečaćen',
      s_2: 'Otvoren',
      s_3: 'Upozorenje',
      s_4: 'Naknadni pregled',
      s_5: 'Ponovno zapečaćen',
      stageLabel: 'Faza {i}: {name}',
      stNow: 'trenutna faza',
      fPass: 'Lozinka',
      fPassSafe: 'u sefu, u dvije polovice',
      fPassOut: 'izvan sefa',
      fPassNew: 'nova, zapečaćena',
      fAlert: 'Upozorenje',
      fAlertNone: '–',
      fAlertSent: 'poslano',
      fAlertOff: 'nije poslano',
      o_justified: 'Opravdano i pregledano',
      o_known: 'Nalaz: nije bilo upozorenja',
      o_caught: 'Nalaz: upotreba bez potrebe, uhvaćena',
      o_unnoticed: 'Nitko ne zna',

      // params, presets, legend
      mode: 'Administratorska prava',
      modeStanding: 'stalna',
      modeJit: 'privremena',
      team: 'Administratora u timu',
      per: 'Podizanja tjedno po osobi',
      len: 'Trajanje podizanja',
      hours: '{h} h',
      noWindows: 'Stalna prava nemaju prozore.',
      work: 'Krađa samo u radno vrijeme',
      thefts: 'Broj krađa',
      newThefts: 'Nove krađe',
      glass: 'Račun za hitne slučajeve',
      nextStage: 'Sljedeća faza',
      outage: 'Sustav identiteta stvarno ne radi',
      alert: 'Upozorenje pri prijavi',
      pStanding: 'Stalna prava',
      pStandingHint: 'Četvero administratora s pravima cijele godine: svaka krađa nosi prava.',
      pJit: 'Privremena prava',
      pJitHint: 'Tri podizanja tjedno po dva sata: iste krađe, rijetko s pravima.',
      pWork: 'Krađa u radno vrijeme',
      pWorkHint: 'Krađe samo u radno vrijeme, jedine sate u kojima prozor može biti otvoren.',
      pAllDay: 'Cijeli dan, svaki dan',
      pAllDayHint: 'Podizanje traje cijeli radni dan: privremeno samo po imenu.',
      pGlass: 'Ispad i račun za hitne slučajeve',
      pGlassHint: 'Sustav identiteta ne radi; račun je otvoren i javlja se upozorenje.',
      pQuiet: 'Otvoren bez razloga, bez upozorenja',
      pQuietHint: 'Nema ispada ni upozorenja: račun ostaje otvoren i nitko ne zna.',
      legWindow: 'administratorska prava',
      legWork: 'radno vrijeme 08–16',
      legHit: 'krađa s pravima',
      legMiss: 'krađa bez prava',

      // the caption
      nThefts: ['{c} ukradena vjerodajnica', '{c} ukradene vjerodajnice', '{c} ukradenih vjerodajnica'],
      capStanding: '{t}, svaka s administratorskim pravima: stalna prava postoje svaki sat u godini ({h} sati po osobi). Iste krađe uz privremena prava: s pravima {j}.',
      capJit: '{t}, s administratorskim pravima {k} ({pct}), očekivano {e}. Prozor je {h} h godišnje po osobi umjesto {y} h.',
      nAlways: 'Podizanje traje cijeli radni dan, svaki dan: privremena prava samo po imenu, a krađa u radno vrijeme uvijek nosi prava.',
      nNone: 'Ovaj put nijedna, ali rizik nije nula: povećaj broj krađa.',
      nWork: 'Krađe u radno vrijeme padaju u jedine sate u kojima prozor može biti otvoren, pa je udio veći.',
      g1Outage: 'Sustav identiteta ne radi: nitko se ne može prijaviti kao administrator, a nijedan zahtjev za podizanje ne može biti odobren. Za to postoji račun za hitne slučajeve.',
      g1Day: 'Običan dan: sustav identiteta radi i podizanja se odobravaju kao i uvijek. Račun za hitne slučajeve ne treba.',
      g2Outage: 'Dvoje ljudi otvara obje zapečaćene polovice lozinke i prijavljuje se računom za hitne slučajeve, koji ne ovisi o sustavu identiteta.',
      g2Day: 'Netko ipak vadi lozinku iz sefa, iako sve radi: račun je pri ruci i ima sva prava.',
      g3Alert: 'Prijava tim računom odmah šalje upozorenje voditelju sigurnosti i upravi, a svaka radnja se zapisuje.',
      g3Silent: 'Prijava ne šalje upozorenje: osim onih koji su ga otvorili, nitko ne zna da je račun u upotrebi.',
      g4_justified: 'Sustav je vraćen. Naknadni pregled čita zapis: tko je otvorio račun, kada, zašto i što je napravio. Upotreba je opravdana.',
      g4_known: 'Sustav je vraćen i za upotrebu se zna zbog ispada, ali upozorenje nije stiglo: kontrola ne radi, to je nalaz.',
      g4_caught: 'Upozorenje je stiglo odmah, a ispada nije bilo: pregled utvrđuje upotrebu bez potrebe. To je nalaz, ali upotreba je otkrivena odmah.',
      g4_unnoticed: 'Nije bilo ispada ni upozorenja, pa nema ni pregleda: upotreba ostaje nevidljiva.',
      g5_justified: 'Lozinka je promijenjena, nove polovice zapečaćene: račun opet čeka u sefu, a pregled je dokaz da je upotrijebljen s razlogom.',
      g5_known: 'Lozinka je promijenjena i zapečaćena, a upozorenje se mora popraviti i ispitati prije sljedećeg ispada.',
      g5_caught: 'Lozinka je promijenjena i zapečaćena; upotreba bez potrebe ide upravi kao nalaz.',
      g5_unnoticed: 'Nitko nije promijenio lozinku: račun sa svim pravima ostaje otvoren, a lozinku zna netko tko ga je upotrijebio bez razloga.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, ljudi i brojevi su izmišljeni.',

      explain:
        '<p><b>Stalna administratorska prava</b> (<i>standing privileges</i>) postoje svaki sat u godini, pa ' +
        'ukradena prijava administratora (sesija koju napadač odmah upotrijebi) uvijek otvara sve. <b>Privremena prava</b> ' +
        '(<i>just-in-time access</i>) dodjeljuju se samo kad zatrebaju: <b>podizanje ovlasti</b> (<i>elevation</i>) ' +
        'se zatraži, netko ga odobri, traje ograničeno vrijeme i istječe samo, a sve se zapisuje. Ista krađa tada ' +
        'nosi prava samo ako padne u otvoren prozor, a sam napadač podizanje ne može dobiti jer ga odobrava netko drugi.</p>' +
        '<ul>' +
        '<li>Udio krađa s pravima je udio sati s pravima: podizanja tjedno × trajanje ÷ 168 sati (÷ 40 za krađe u ' +
        'radno vrijeme). Uz mali broj krađa ishod jako varira; uz tisuću se približi očekivanom.</li>' +
        '<li>Podizanje koje traje cijeli radni dan, svaki dan, privremeno je samo po imenu.</li>' +
        '<li><b>Račun za hitne slučajeve</b> (<i>break-glass account</i>) služi kad sam sustav identiteta ne radi, ' +
        'pa ni podizanje nije moguće. To je stalni administrator, zato je zapečaćen (lozinka u sefu, u dvije ' +
        'polovice), ne koristi se za svakodnevni rad, svaka prijava šalje upozorenje, a nakon upotrebe slijede ' +
        'pregled i nova lozinka. Bez upozorenja upotreba bez potrebe ostaje nevidljiva.</li>' +
        '</ul>' +
        '<p>Srodno: kako se ovlasti gomilaju s dolascima, premještajima i odlascima; razdvajanje dužnosti.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 8.2 (povlaštena prava pristupa); NIS2, Direktiva (EU) ' +
        '2022/2555, čl. 21. st. 2. t. (i): politike kontrole pristupa.</p>'
    },

    en: {
      stage: 'The admin team\'s week, stolen credentials and the break-glass account',

      n_0: 'Ana', n_1: 'Bruno', n_2: 'Iva', n_3: 'Dino', n_4: 'Maja', n_5: 'Luka', n_6: 'Sara', n_7: 'Toni',
      d_0: 'Mon', d_1: 'Tue', d_2: 'Wed', d_3: 'Thu', d_4: 'Fri', d_5: 'Sat', d_6: 'Sun',

      kThefts: 'Credentials stolen',
      barStanding: 'Standing rights',
      barJit: 'Just in time',
      barOf: '{k} of {t} ({pct})',
      barExp: 'expected {e}',
      barHours: '{h} h a year per person',
      kElev: 'Elevations a year',
      kElevSub: 'each requested, approved, logged',
      kNone: 'none',

      headWeek: 'The team\'s week: who holds admin rights when, and when a credential is stolen',
      rowLabel: '{who}: thefts {n}, with admin rights {k}',
      rowStanding: 'rights all week',
      idpDown: 'Identity system down: nobody can sign in as an administrator or get an elevation',

      headGlass: 'Break-glass account',
      s_0: 'Sealed',
      s_1: 'Identity system down',
      s_1day: 'An ordinary day',
      s_3off: 'No alert',
      s_4none: 'No review',
      s_5none: 'Not resealed',
      s_2: 'Opened',
      s_3: 'Alert',
      s_4: 'Review afterwards',
      s_5: 'Resealed',
      stageLabel: 'Stage {i}: {name}',
      stNow: 'current stage',
      fPass: 'Password',
      fPassSafe: 'in the safe, in two halves',
      fPassOut: 'out of the safe',
      fPassNew: 'new, sealed',
      fAlert: 'Alert',
      fAlertNone: '–',
      fAlertSent: 'sent',
      fAlertOff: 'not sent',
      o_justified: 'Justified and reviewed',
      o_known: 'Finding: no alert came',
      o_caught: 'Finding: used without need, caught',
      o_unnoticed: 'Nobody knows',

      mode: 'Admin rights',
      modeStanding: 'standing',
      modeJit: 'just in time',
      team: 'Administrators in the team',
      per: 'Elevations a week per person',
      len: 'Elevation lasts',
      hours: '{h} h',
      noWindows: 'Standing rights have no windows.',
      work: 'Thefts only in working hours',
      thefts: 'Thefts',
      newThefts: 'New thefts',
      glass: 'Break-glass account',
      nextStage: 'Next stage',
      outage: 'Identity system really down',
      alert: 'Alert on sign-in',
      pStanding: 'Standing rights',
      pStandingHint: 'Four administrators with rights all year: every theft carries them.',
      pJit: 'Just in time',
      pJitHint: 'Three elevations a week, two hours each: the same thefts, rarely with rights.',
      pWork: 'Theft in working hours',
      pWorkHint: 'Thefts only in working hours, the only hours a window can be open.',
      pAllDay: 'All day, every day',
      pAllDayHint: 'The elevation lasts the whole working day: just in time in name only.',
      pGlass: 'Outage and the break-glass account',
      pGlassHint: 'The identity system is down; the account is opened and an alert goes out.',
      pQuiet: 'Opened for no reason, no alert',
      pQuietHint: 'No outage and no alert: the account stays open and nobody knows.',
      legWindow: 'admin rights',
      legWork: 'working hours 08–16',
      legHit: 'theft with admin rights',
      legMiss: 'theft without',

      nThefts: ['{c} credential stolen', '{c} credentials stolen'],
      capStanding: '{t}, every one with admin rights: standing rights are there every hour of the year ({h} hours per person). The same thefts just in time: with rights {j}.',
      capJit: '{t}, with admin rights {k} ({pct}), expected {e}. The window is {h} h a year per person instead of {y} h.',
      nAlways: 'The elevation lasts the whole working day, every day: just in time in name only, and a theft in working hours always carries the rights.',
      nNone: 'None this time, but the risk is not zero: raise the number of thefts.',
      nWork: 'Thefts in working hours fall in the only hours a window can be open, so the share is higher.',
      g1Outage: 'The identity system is down: nobody can sign in as an administrator, and no elevation request can be approved. This is what the break-glass account is for.',
      g1Day: 'An ordinary day: the identity system works and elevations are approved as always. The break-glass account is not needed.',
      g2Outage: 'Two people open both sealed halves of the password and sign in with the break-glass account, which does not depend on the identity system.',
      g2Day: 'Someone takes the password out of the safe anyway, although nothing is down: the account is at hand and has every right.',
      g3Alert: 'Signing in with it alerts the security lead and the management at once, and every action is logged.',
      g3Silent: 'Signing in raises no alert: apart from those who opened it, nobody knows the account is in use.',
      g4_justified: 'The system is back. The review reads the log: who opened the account, when, why and what they did. The use was justified.',
      g4_known: 'The system is back and the use is known because of the outage, but no alert came: the control does not work, which is a finding.',
      g4_caught: 'The alert came at once and there was no outage: the review finds the account used without need. A finding, but caught at once.',
      g4_unnoticed: 'No outage and no alert, so no review either: the use stays invisible.',
      g5_justified: 'The password is changed and the new halves sealed: the account waits in the safe again, and the review is the evidence that it was used for a reason.',
      g5_known: 'The password is changed and sealed; the alert must be fixed and tested before the next outage.',
      g5_caught: 'The password is changed and sealed; the use without need goes to the management as a finding.',
      g5_unnoticed: 'Nobody changed the password: an account with every right stays open, and its password is known to someone who used it for no reason.',

      foot: 'Simplified, not legal advice. The firm, the people and the numbers are made up.',

      explain:
        '<p><b>Standing admin rights</b> are there every hour of the year, so a stolen admin session (one the ' +
        'attacker uses at once) always opens everything. <b>Just-in-time access</b> grants the rights only when needed: an ' +
        '<b>elevation</b> is requested, someone approves it, it lasts a limited time and expires by itself, and all ' +
        'of it is logged. The same theft then carries the rights only if it falls into an open window, and the attacker cannot get an elevation on their own, because someone else approves it.</p>' +
        '<ul>' +
        '<li>The share of thefts with rights is the share of hours with rights: elevations a week × length ÷ 168 ' +
        'hours (÷ 40 for thefts in working hours). With few thefts the result varies a lot; with a thousand it ' +
        'comes close to the expected share.</li>' +
        '<li>An elevation that lasts the whole working day, every day, is just in time in name only.</li>' +
        '<li>A <b>break-glass account</b> is for when the identity system itself is down, so no elevation is ' +
        'possible. It is a standing administrator, so it stays sealed (the password in a safe, in two halves), is ' +
        'never used for daily work, alerts on every sign-in, and after use comes a review and a new password. ' +
        'Without the alert, a use without need stays invisible.</li>' +
        '</ul>' +
        '<p>Related: how access piles up with joiners, movers and leavers; segregation of duties.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, control 8.2 (privileged access rights); NIS2, Directive (EU) 2022/2555, ' +
        'art. 21(2)(i): access control policies.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
