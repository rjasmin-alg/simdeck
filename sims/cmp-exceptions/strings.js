/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Iznimke od standarda tijekom dvije godine: što kaže registar i koliko sustava stvarno zadovoljava standard',

      // the numbers
      kMeets: 'Zadovoljava standard',
      meetsOf: '{k} od {n} sustava',
      kOldest: 'Najstarija otvorena iznimka',
      oldestNone: 'nijedna otvorena',
      yearOld: 'godinu dana ili starijih: {k}',
      ageM: ['{c} mjesec', '{c} mjeseca', '{c} mjeseci'],
      why0: 'stari operacijski sustav za staru aplikaciju',
      why1: 'uređaj dobavljača bez standardnih postavki',
      why2: 'nadogradnja ruši poslovnu aplikaciju',
      why3: 'servisni račun bez višefaktorske prijave',
      why4: 'stari protokol šifriranja za partnera',
      why5: 'testno računalo izvan standardne instalacije',
      kRegister: 'Registar iznimki',
      stOpen: 'bez roka',
      stValid: 'u roku',
      stRenewed: 'obnovljene',
      stEscalated: 'eskalirane',
      stExpired: 'istekle',
      regOk: 'sve su u roku',
      regNoDate: 'nema roka, nema što provjeriti',
      regExpired: 'istekle, a sustavi isti',
      regEscalated: 'neke čekaju odluku uprave',
      kReviews: 'Pregledi o isteku dosad',
      revFixed: 'ispravljeno',
      revRenewed: 'obnovljeno',
      revEscalated: 'eskalirano',
      revNone: 'nema roka, nema pregleda',
      revNothing: 'rok prođe, nitko ne odlučuje',
      revRenew: 'obnovi se, nitko ne odlučuje',

      // the history
      headHist: 'Otvorene iznimke mjesec po mjesec (visina = svih 48 sustava); klikni stupac ili strelice',
      histLabel: 'Otvorene iznimke po mjesecima, od 0 do 24; u mjesecu {m} otvoreno {o} od {n}',
      axisMonth: '{m}. mj.',
      gaps: 'Otvorene: bez kompenzacijske kontrole {c} · odobrene bez vlasnika {o} · iznad apetita, potpisuje uprava {b}',

      // the estate
      headGrid: 'Okruženje u mjesecu {m}: broj je starost iznimke u mjesecima',
      gridLabel: '{n} sustava: {k} zadovoljava standard, {o} na iznimci',

      // the comparison
      headCmp: 'Isti zahtjevi u mjesecu {m}, rok {e} mj.:',
      cmpNone: 'bez roka',
      cmpNothing: 'rok, bez provjere',
      cmpRenew: 'obnova bez odluke',
      cmpReview: 'pregled o isteku',

      // params, presets, legend
      expiry: 'Rok isteka',
      expNone: 'bez roka',
      expM: '{m} mj.',
      atExpiry: 'Kad rok istekne',
      atNothing: 'ništa',
      atRenew: 'obnovi',
      atReview: 'pregled',
      noExpiry: 'Bez roka isteka nema ni isteka.',
      complete: 'Traži vlasnika i kontrolu',
      monthBack: 'Mjesec ranije',
      monthOn: 'Mjesec kasnije',
      monthNow: '{m}. mjesec',
      month: 'Mjesec',
      pOpenEnded: 'Bez roka',
      pOpenEndedHint: 'Svaka iznimka vrijedi zauvijek: nitko ih ponovno ne pita i gomilaju se.',
      pDateOnly: 'Rok koji nitko ne provjerava',
      pDateOnlyHint: 'Šest mjeseci, ali kad rok prođe, ništa se ne dogodi: registar je pun isteklih.',
      pAutoRenew: 'Obnova bez odluke',
      pAutoRenewHint: 'Svaka se iznimka o isteku obnovi: registar je uredan, okruženje isto.',
      pReview: 'Pregled o isteku',
      pReviewHint: 'O isteku vlasnik pokaže ispravak ili jednom obnovi s planom, inače iznimka ide upravi.',
      pIncomplete: 'Nepotpuni zahtjevi',
      pIncompleteHint: 'Pregled o isteku, ali se odobravaju i nepotpuni zahtjevi.',
      pYearly: 'Godina počeka',
      pYearlyHint: 'Pregled o isteku s rokom od godine: ispravci čekaju rok.',
      legValid: 'u roku',
      legRenewed: 'obnovljena',
      legEscalated: 'eskalirana upravi',
      legExpired: 'istekla',
      legOpen: 'bez roka',
      legMeets: 'u skladu sa standardom',
      legNoCtl: 'bez kontrole',
      legNoOwner: 'odobrena bez vlasnika',
      legOldest: 'najstarija',

      // the caption
      capNone: 'Mjesec {m}: otvorenih iznimki bez roka {o}, standard zadovoljava {p} okruženja, najstarija traje {a}. Nitko ih ponovno ne pita: zatvara ih samo zamjena sustava.',
      capNothing: 'Mjesec {m}: u registru je isteklih {x}, ali ih nitko ne pregledava, pa sustavi ostaju isti: standard zadovoljava {p}, najstarija iznimka traje {a}.',
      capRenew: 'Mjesec {m}: sve su iznimke u roku (obnovljenih bez odluke {x}), a standard zadovoljava samo {p}; najstarija traje {a}.',
      capReview: 'Mjesec {m}: pregledi o isteku ispravili su {f}, jednom obnovili {r}, eskalirali {e}; standard zadovoljava {p}, najstarija otvorena iznimka traje {a}.',
      nSlack: 'Godina počeka: ovdje vlasnik ispravak završi kad dođe rok, ne prije.',
      nOwner: 'Bez vlasnika nitko ne odgovara na pregled: iznimka ide upravi, a ispravak kreće jedno razdoblje kasnije.',
      nCtl: 'Neke otvorene iznimke nemaju kompenzacijsku kontrolu: prihvaćen je cijeli rizik.',
      nPile: 'Četvrtina okruženja ili više je na iznimci: iznimke su postale stvarna politika.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, sustavi, zahtjevi i brojevi su izmišljeni.',

      explain:
        '<p><b>Iznimka</b> (<i lang="en">exception</i>) od standarda je <b>prihvaćanje rizika</b> (<i lang="en">risk acceptance</i>): ' +
        'tvrtka zna da sustav ne zadovoljava standard i odlučuje to neko vrijeme podnositi. Kao svaki prihvaćeni ' +
        'rizik, treba <b>vlasnika</b> (<i lang="en">owner</i>) koji za nju odgovara, <b>kompenzacijsku kontrolu</b> ' +
        '(<i lang="en">compensating control</i>) koja u međuvremenu smanjuje rizik, i <b>rok isteka</b> (<i lang="en">expiry date</i>). ' +
        'Unutar apetita za rizik potpisuje vlasnik, iznad njega uprava.</p>' +
        '<ul>' +
        '<li>Bez roka nitko ponovno ne pita: iznimke se gomilaju dok okruženje ne opisuju bolje od standarda. ' +
        'Tada su one stvarna politika.</li>' +
        '<li>Rok djeluje samo ako netko po njemu postupi. Rok koji prođe bez provjere daje istekle iznimke, a ' +
        'obnova bez odluke registar u kojem je sve u roku. U oba slučaja okruženje ostaje isto.</li>' +
        '<li><b>Pregled o isteku</b> odlučuje: ispravljeno (iznimka se zatvara), obnovljeno jednom s planom ili ' +
        'eskalirano upravi, koja ga prati, a iznimci bez vlasnika imenuje vlasnika. Ovdje vlasnik ispravak završi kad dođe ' +
        'rok, pa dulji rok znači kasnije ispravke.</li>' +
        '</ul>' +
        '<p>Srodno: registar rizika (bodovanje i tko potpisuje); rokovi za otklanjanje ranjivosti; razdvajanje ' +
        'dužnosti (kompenzacijske kontrole).</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, točka 6.1.3 (postupanje s rizikom; vlasnici rizika prihvaćaju preostali ' +
        'rizik) i 10.2 (nesukladnost i korektivne radnje); NIS2, Direktiva (EU) 2022/2555, čl. 20. st. 1. ' +
        '(upravljačka tijela odobravaju mjere upravljanja kibernetičkim rizicima i nadziru ih) i čl. 21. st. 1.</p>'
    },

    en: {
      stage: 'Exceptions to a standard over two years: what the register says and how many systems really meet the standard',

      // the numbers
      kMeets: 'Meets the standard',
      meetsOf: '{k} of {n} systems',
      kOldest: 'Oldest open exception',
      oldestNone: 'none open',
      yearOld: 'a year or older: {k}',
      ageM: ['{c} month', '{c} months'],
      why0: 'an old OS for an old application',
      why1: 'a supplier\'s device without the standard settings',
      why2: 'an update breaks a business application',
      why3: 'a service account without multi-factor sign-in',
      why4: 'an old encryption protocol for a partner',
      why5: 'a test machine outside the standard build',
      kRegister: 'The exception register',
      stOpen: 'no end date',
      stValid: 'in date',
      stRenewed: 'renewed',
      stEscalated: 'escalated',
      stExpired: 'expired',
      regOk: 'all in date',
      regNoDate: 'no end date, nothing to check',
      regExpired: 'expired, systems unchanged',
      regEscalated: 'some await the board',
      kReviews: 'Reviews at expiry so far',
      revFixed: 'fixed',
      revRenewed: 'renewed',
      revEscalated: 'escalated',
      revNone: 'no end date, no review',
      revNothing: 'the date passes, nobody decides',
      revRenew: 'renewed, nobody decides',

      // the history
      headHist: 'Open exceptions month by month (height = all 48 systems); click a column or the arrows',
      histLabel: 'Open exceptions per month, 0 to 24; in month {m}, {o} of {n} open',
      axisMonth: 'month {m}',
      gaps: 'Open: without a compensating control {c} · granted without an owner {o} · above the appetite, the board signs {b}',

      // the estate
      headGrid: 'The estate in month {m}: a number is the exception\'s age in months',
      gridLabel: '{n} systems: {k} meet the standard, {o} on exception',

      // the comparison
      headCmp: 'The same requests in month {m}, end date {e} months:',
      cmpNone: 'no end date',
      cmpNothing: 'date, never checked',
      cmpRenew: 'renewed, no decision',
      cmpReview: 'review at expiry',

      // params, presets, legend
      expiry: 'End date',
      expNone: 'none',
      expM: '{m} mo',
      atExpiry: 'When the end date comes',
      atNothing: 'nothing',
      atRenew: 'renew',
      atReview: 'review',
      noExpiry: 'With no end date nothing ever expires.',
      complete: 'Require owner and control',
      monthBack: 'One month back',
      monthOn: 'One month on',
      monthNow: 'month {m}',
      month: 'Month',
      pOpenEnded: 'No end date',
      pOpenEndedHint: 'Every exception holds for ever: nobody asks again and they pile up.',
      pDateOnly: 'A date nobody checks',
      pDateOnlyHint: 'Six months, but when the date passes nothing happens: the register fills with expired ones.',
      pAutoRenew: 'Renewed, no decision',
      pAutoRenewHint: 'Every exception is renewed at expiry: the register is tidy, the estate unchanged.',
      pReview: 'Review at expiry',
      pReviewHint: 'At expiry the owner shows the fix, renews once with a plan, or it goes to the board.',
      pIncomplete: 'Incomplete requests',
      pIncompleteHint: 'Review at expiry, but incomplete requests are granted too.',
      pYearly: 'A year\'s grace',
      pYearlyHint: 'Review at expiry with a one-year end date: fixes wait for the deadline.',
      legValid: 'in date',
      legRenewed: 'renewed',
      legEscalated: 'escalated to the board',
      legExpired: 'expired',
      legOpen: 'no end date',
      legMeets: 'meets the standard',
      legNoCtl: 'no control',
      legNoOwner: 'granted with no owner',
      legOldest: 'the oldest',

      // the caption
      capNone: 'Month {m}: {o} exceptions open with no end date, {p} of the estate meets the standard, the oldest is {a} old. Nobody asks again: only a replaced system closes one.',
      capNothing: 'Month {m}: the register shows {x} expired, but nobody reviews them, so the systems stay as they are: {p} meets the standard, the oldest exception is {a} old.',
      capRenew: 'Month {m}: every exception is in date ({x} renewed without a decision), yet only {p} meets the standard; the oldest is {a} old.',
      capReview: 'Month {m}: reviews at expiry fixed {f}, renewed {r} once and escalated {e}; {p} meets the standard, the oldest open exception is {a} old.',
      nSlack: 'A year\'s grace: here the owner finishes the fix when it is due, not before.',
      nOwner: 'With no owner nobody answers the review: it goes to the board, and the fix starts a period late.',
      nCtl: 'Some open exceptions have no compensating control: the whole risk is accepted.',
      nPile: 'A quarter of the estate or more is on exception: the exceptions have become the real policy.',

      foot: 'Simplified, not legal advice. The firm, systems, requests and numbers are made up.',

      explain:
        '<p>An <b>exception</b> to a standard is a <b>risk acceptance</b>: the firm knows a system does not meet the ' +
        'standard and decides to live with it for a while. Like any accepted risk it needs an <b>owner</b> who ' +
        'answers for it, a <b>compensating control</b> that lowers the risk in the meantime, and an <b>expiry ' +
        'date</b>. Within the risk appetite the owner signs, above it the board.</p>' +
        '<ul>' +
        '<li>Without an end date nobody asks again: the exceptions pile up until they describe the estate better ' +
        'than the standard does. Then they are the real policy.</li>' +
        '<li>An end date works only if someone acts on it. A date that passes unchecked gives expired exceptions; ' +
        'renewal without a decision gives a register in which everything is in date. Either way the estate stays as ' +
        'it was.</li>' +
        '<li>A <b>review at expiry</b> decides: fixed (the exception closes), renewed once with a plan, or ' +
        'escalated to the board, which tracks it and names an owner where there is none. Here the owner finishes the fix when it is ' +
        'due, so a longer end date means later fixes.</li>' +
        '</ul>' +
        '<p>Related: risk register (scoring and who signs); vulnerability fix deadlines; segregation of duties ' +
        '(compensating controls).</p>' +
        '<p>Sources: ISO/IEC 27001:2022, clauses 6.1.3 (risk treatment; the risk owners accept the residual risk) ' +
        'and 10.2 (nonconformity and corrective action); NIS2, Directive (EU) 2022/2555, art. 20(1) (management ' +
        'bodies approve the cybersecurity risk-management measures and oversee them) and art. 21(1).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
