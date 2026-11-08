/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zahtjevi jednog tima, odobravateljev sat i ono što pokazuje zapis',

      // the numbers
      kRecord: 'Zapis',
      recSigned: '{k} od {n} s dva potpisa',
      recTest: 'Ispitivanje „svaki zahtjev ima drugi potpis”: prolazi',
      recRejected: 'odbijeno: {k}',
      barEven: 'Jednako za sve',
      barRisk: 'Prema riziku, {d} detaljno',
      barOf: '{k} od {b} uhvaćeno',
      barExp: 'očekivano {e}',
      kTime: 'Vrijeme po zahtjevu',
      kAvg: 'prosječno {t}',
      apInd: 'neovisan odobravatelj',
      apDep: 'kolega iz istog tima',
      newStream: 'Novi zahtjevi',
      min: '{m} min',
      sec: '{s} s',

      // the approver's hour
      headDay: 'Odobravateljev sat dnevno: {l} zahtjeva u redu',
      dayDeep: '{n} × {t} detaljno',
      dayThin: '{n} × {t}',
      dayStamp: '{n} × {t}: potpis bez čitanja',
      dayLabel: 'Sat od 60 minuta podijeljen na {l} zahtjeva',

      // the stream
      headGrid: 'Mjesec zahtjeva jednog tima: {n}, od toga {b} neispravnih',
      gridLabel: 'Neispravnih zahtjeva {b}: uhvaćeno {k}, odobreno s dva potpisa {p}',

      // params, presets, legend
      policy: 'Kako se pregledava',
      policyAll: 'jednako za sve',
      policyRisk: 'prema riziku',
      deep: 'Udio pregledan detaljno',
      noDeep: 'Jednako za sve: nitko ne dobiva detaljan pregled.',
      load: 'Zahtjeva dnevno u redu',
      independent: 'Odobravatelj je neovisan',
      seed: 'Novi zahtjevi',
      pQuiet: 'Miran dan',
      pQuietHint: 'Deset zahtjeva dnevno, šest minuta po zahtjevu: neovisan odobravatelj hvata većinu.',
      pBusy: 'Pun red',
      pBusyHint: 'Osamdeset dnevno, 45 sekundi po zahtjevu: potpis bez čitanja, a zapis je potpun.',
      pColleague: 'Potpisuje kolega',
      pColleagueHint: 'Ima vremena, ali potpisuje kolega iz istog tima: rijetko se usprotivi.',
      pByRisk: 'Pun red, prema riziku',
      pByRiskHint: 'Isti red, ali najrizičnijih 10 % dobiva detaljan pregled, ostalo samo potpis.',
      pTooDeep: 'Detaljno za pola',
      pTooDeepHint: 'Pola reda „detaljno”: minuta i pol po zahtjevu, opet tanko.',
      legRisk: 'visok rizik',
      legRoutine: 'rutinski',
      legDeep: 'pregledan detaljno',
      legStamp: 'potpisan bez čitanja',
      legCaught: 'neispravan, odbijen',
      legPassed: 'neispravan, odobren',

      // the caption
      nReq: ['{c} zahtjev', '{c} zahtjeva', '{c} zahtjeva'],
      capAll: '{l} dnevno u jednom satu: {t} po zahtjevu. Uhvaćeno {k} od {b} neispravnih (očekivano {e}), a zapis pokazuje {r} s dva potpisa.',
      capRisk: '{d} od {l} dnevno detaljno ({td} svaki), ostali po {tt}: uhvaćeno {k} od {b} (očekivano {e}). Isti red, jednako za sve: {k2} od {b2}.',
      nStamp: 'Ispod minute nitko ne otvara zahtjev: potpis je klik, a zapis to ne vidi.',
      nThinDeep: 'Detaljno za previše zahtjeva: ispod pet minuta ni to nije detaljan pregled.',
      nDep: 'Odobravatelj nije neovisan: i kad ima vremena, rijetko se usprotivi kolegi.',
      nRest: 'Ostali se potpisuju bez čitanja: neispravan zahtjev među njima prolazi.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, ljudi i brojevi su izmišljeni.',

      explain:
        '<p><b>Načelo četiri oka</b> (<i>four-eyes principle</i>): zahtjev (novo pravo pristupa, promjena u ' +
        'produkciji, plaćanje iznad granice) vrijedi tek kad ga odobri druga osoba. Drugi potpis zaustavlja ' +
        'neispravan zahtjev samo ako je odobravatelj <b>neovisan</b> (nije podređen podnositelju ni kolega koji ' +
        'radi isti posao) i ako zahtjev stvarno pogleda.</p>' +
        '<ul>' +
        '<li>Vrijeme po zahtjevu je odobravateljevo vrijeme ÷ broj zahtjeva u redu. Vjerojatnost da uoči problem ' +
        'raste s vremenom: q × (1 − e^(−t / 4 min)), q = 1 za neovisnog, 0,25 za kolegu. Ispod minute zahtjev ' +
        'se ne otvara: odobrenje postaje <b>formalnost</b> (<i>rubber stamp</i>).</li>' +
        '<li>Zapis svaki put pokazuje dva potpisa. Revizor koji provjerava samo postoji li drugi potpis vidi ' +
        'kontrolu koja je dobro osmišljena; radi li ona, vidi tek kad ponovno pogleda odobrene zahtjeve.</li>' +
        '<li><b>Pregled prema riziku</b>: najrizičniji udio dobiva detaljan pregled (15 minuta), ostalo manje ili ' +
        'ništa. Ovdje je 9 od 12 neispravnih među visokorizičnima, pa to hvata više nego tanak pogled na sve; ' +
        'preširok udio opet je tanak, a neispravan rutinski zahtjev tada prolazi. Kraći red (unaprijed odobreni ' +
        'standardni zahtjevi, više odobravatelja) pomaže objema politikama.</li>' +
        '</ul>' +
        '<p>Srodno: razdvajanje dužnosti; uzorkovanje u reviziji; razredi rizika za promjene.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 5.3 (razdvajanje dužnosti); NIS2, Direktiva (EU) 2022/2555, ' +
        'čl. 21. st. 2. t. (i): politike kontrole pristupa. Model gledanja je standardna formula slučajnog ' +
        'pretraživanja; konstante su izmišljene.</p>'
    },

    en: {
      stage: 'One team\'s requests, the approver\'s hour and what the record shows',

      // the numbers
      kRecord: 'The record',
      recSigned: '{k} of {n} with two signatures',
      recTest: 'Test "every request has a second signature": passes',
      recRejected: 'rejected: {k}',
      barEven: 'Everything the same',
      barRisk: 'By risk, {d} in depth',
      barOf: '{k} of {b} caught',
      barExp: 'expected {e}',
      kTime: 'Time per request',
      kAvg: 'on average {t}',
      apInd: 'independent approver',
      apDep: 'a colleague on the same team',
      newStream: 'New requests',
      min: '{m} min',
      sec: '{s} s',

      // the approver's hour
      headDay: 'The approver\'s hour a day: {l} requests in the queue',
      dayDeep: '{n} × {t} in depth',
      dayThin: '{n} × {t}',
      dayStamp: '{n} × {t}: signed unread',
      dayLabel: 'An hour of 60 minutes split over {l} requests',

      // the stream
      headGrid: 'A month of one team\'s requests: {n}, {b} of them bad',
      gridLabel: 'Bad requests {b}: caught {k}, approved with two signatures {p}',

      // params, presets, legend
      policy: 'How requests are reviewed',
      policyAll: 'everything the same',
      policyRisk: 'by risk',
      deep: 'Share reviewed in depth',
      noDeep: 'Everything the same: nothing gets an in-depth review.',
      load: 'Requests a day in the queue',
      independent: 'The approver is independent',
      seed: 'New requests',
      pQuiet: 'A quiet day',
      pQuietHint: 'Ten requests a day, six minutes each: an independent approver catches most.',
      pBusy: 'A full queue',
      pBusyHint: 'Eighty a day, 45 seconds each: signed unread, and the record is complete.',
      pColleague: 'A colleague signs',
      pColleagueHint: 'There is time, but a colleague on the same team signs: they rarely object.',
      pByRisk: 'A full queue, by risk',
      pByRiskHint: 'The same queue, but the riskiest 10 % get an in-depth review, the rest only a signature.',
      pTooDeep: 'In depth for half',
      pTooDeepHint: 'Half "in depth": a minute and a half each, thin again.',
      legRisk: 'high risk',
      legRoutine: 'routine',
      legDeep: 'reviewed in depth',
      legStamp: 'signed unread',
      legCaught: 'bad, rejected',
      legPassed: 'bad, approved',

      // the caption
      nReq: ['{c} request', '{c} requests'],
      capAll: '{l} a day in one hour: {t} per request. Caught {k} of {b} bad ones (expected {e}), and the record shows {r} with two signatures.',
      capRisk: '{d} of {l} a day in depth ({td} each), the rest {tt} each: caught {k} of {b} (expected {e}). The same queue reviewed evenly: {k2} of {b2}.',
      nStamp: 'Under a minute nobody opens the request: the signature is a click, and the record cannot tell.',
      nThinDeep: 'In depth for too many: under five minutes each, that is not in depth either.',
      nDep: 'The approver is not independent: even with time, they rarely object to a colleague.',
      nRest: 'The rest are signed unread: a bad request among them passes.',

      foot: 'Simplified, not legal advice. The firm, the people and the numbers are made up.',

      explain:
        '<p>The <b>four-eyes principle</b>: a request (a new access right, a change to production, a payment over ' +
        'the limit) counts only once a second person approves it. The second signature stops a bad request only if ' +
        'the approver is <b>independent</b> (not reporting to the requester, not a colleague doing the same work) ' +
        'and actually looks at it.</p>' +
        '<ul>' +
        '<li>Time per request is the approver\'s time ÷ the requests in the queue. The chance of spotting a problem ' +
        'grows with the time spent: q × (1 − e^(−t / 4 min)), q = 1 for an independent approver, 0.25 for a ' +
        'colleague. Under a minute the request is not opened: approval becomes a <b>rubber stamp</b>.</li>' +
        '<li>The record shows two signatures every time. An auditor who only checks that a second signature exists ' +
        'sees a well-designed control; whether it operates shows only when someone looks again at what was ' +
        'approved.</li>' +
        '<li><b>Review by risk</b>: the riskiest share gets an in-depth review (15 minutes), the rest less or ' +
        'nothing. Here 9 of the 12 bad requests are high-risk, so this catches more than a thin look at everything; ' +
        'too wide a share is thin again, and a bad routine request then passes. A shorter queue (standard requests ' +
        'approved in advance, more approvers) helps both policies.</li>' +
        '</ul>' +
        '<p>Related: segregation of duties; audit sampling; risk classes for changes.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, control 5.3 (segregation of duties); NIS2, Directive (EU) 2022/2555, ' +
        'art. 21(2)(i): access control policies. The look is the standard random-search formula; its constants are ' +
        'made up.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
