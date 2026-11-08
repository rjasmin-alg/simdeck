/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-data-subject-request, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian terms: NOTES.md "Term pairs". Dates and day
   numbers are data, not language. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zahtjev ispitanika: rok, osam mjesta s njegovim podacima i što je pronađeno, obrisano ili propušteno',

      // the request and the clock
      reqTitle: 'Zahtjev ispitanika',
      reqAccess: 'Pošaljite mi kopiju svih mojih podataka.',
      reqErasure: 'Obrišite sve moje podatke.',
      reqWho: 'bivši kupac, stigao {date}',
      laneClock: 'Rok',
      laneClockSub: 'jedan mjesec od primitka',
      mReceived: '▲ primljen',
      mDue: 'rok {date}',
      mAnswer: '■ odgovor, dan {d}',
      mExt: 'Produljenje do {date} samo za složen zahtjev ili mnogo zahtjeva, uz najavu i razloge u prvom mjesecu.',
      dayN: 'dan {d}',

      // the places
      pl_crm: 'Evidencija kupaca',
      pl_invoices: 'Računi',
      pl_support: 'Pretinac podrške',
      pl_newsletter: 'Bilten, vanjska usluga',
      pl_sales: 'Pretinac prodavača',
      pl_export: 'Izvoz u dijeljenoj mapi',
      pl_test: 'Testna kopija baze',
      pl_backups: 'Sigurnosne kopije',
      wh_crm: 'ime, adresa, kupnje',
      wh_invoices: '14 računa, 2024.–2026.',
      wh_support: '9 e-poruka s podrškom',
      wh_newsletter: 'pretplata; vodi je izvršitelj obrade',
      wh_sales: '3 e-poruke s ponudom',
      wh_export: 'tablica za kampanju 2025.',
      wh_test: 'kopija evidencije kupaca',
      wh_backups: 'svake noći, svaka se čuva {b}',
      onList: 'na popisu',
      offList: 'nije na popisu',

      // statuses on a card
      st_wait: '… čeka',
      st_found: '✓ u kopiji',
      st_noted: '≡ rok čuvanja u odgovoru',
      st_missed: '✕ nitko nije tražio',
      st_erased: '✓ obrisano',
      st_processor: '✓ obrisao izvršitelj',
      st_kept: '§ zadržano po zakonu',
      st_recorded: '⌛ u kopijama do {date}',
      st_aged: '✓ isteklo {date}',
      st_agedPart: '⌛ obrisano isteklo {date}; propušteno se i dalje kopira',
      st_still: '✕ i dalje postoji',
      st_unrecorded: '⌛ do {date}, nigdje zapisano',

      // the summary row
      sumFound: 'pronađeno',
      sumAnswer: 'odgovor',
      sumOnTime: 'na vrijeme',
      sumLate: 'kasni {d}',
      sumErased: 'obrisano',
      sumKept: 'zadržano',
      sumBackups: 'u kopijama do',
      sumStill: 'i dalje postoji',
      sumWait: 'odgovor još nije poslan',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, ispitanik, mjesta i trajanja su izmišljeni.',

      // caption
      cReceivedAccess: 'Bivši kupac traži kopiju svih svojih osobnih podataka (pravo na pristup). Zahtjev je stigao {date} u pretinac podrške.',
      cReceivedErase: 'Bivši kupac traži brisanje svih svojih osobnih podataka (pravo na brisanje). Zahtjev je stigao {date} u pretinac podrške.',
      cClock: 'Rok teče od primitka: odgovor do {due}.',
      cLogged: 'Isti dan stiže do osobe zadužene za zahtjeve; sutradan je zaveden, a identitet se slaže s adresom računa.',
      cLoggedLate: 'Zahtjev je {noticed} čekao u pretincu dok ga netko nije proslijedio; rok je za to vrijeme tekao.',
      cMap_good: 'Evidencija i karta podataka navode svih osam mjesta s vlasnikom, i izvoz, i testnu kopiju, i pretinac prodavača.',
      cMap_partial: 'Evidencija navodi sustave, ali ne i kopije koje su ljudi napravili: izvoz, testnu kopiju, osobne pretince.',
      cMap_none: 'Evidencije nema: tim traži ondje gdje se sjeti i pita okolo tko još što ima.',
      cDone_found: '{place}: pronađeno za {d}, ide u kopiju.',
      cDone_noted: '{place}: iste podatke čuvaju još {b}; odgovor navodi i taj rok.',
      cDone_erased: '{place}: pronađeno i obrisano za {d}.',
      cDone_processor: '{place}: izvršitelj obrade briše po uputi; potvrda za {d}.',
      cDone_kept: '{place}: zakon traži da se računi čuvaju; ostaju, samo za tu svrhu, i odgovor to kaže.',
      cDone_recorded: '{place}: jednu osobu iz njih obično nije moguće izbrisati. Zapis o brisanju bilježi da podaci ostaju do {gone} i da se nakon svake obnove moraju ponovno obrisati.',
      cMissed: '{place}: nije na popisu i nitko ne gleda ondje. Podaci ostaju, a odgovor ih neće spomenuti.',
      cMissedBackups: '{place}: nisu na popisu; odgovor neće reći koliko se podaci u njima čuvaju.',
      cMissedBackupsErase: '{place}: nisu na popisu. Podaci ostaju u kopijama do {gone}, a to nigdje nije zapisano: obnova bi ih vratila.',
      cLeft: 'Dan {day}, ostaje {left}.',
      cOver: 'Dan {day}, {over} nakon roka.',
      cLeftDue: 'Dan {day}, danas je zadnji dan roka.',
      cAnswerOnTime: 'Odgovor odlazi {date}, {left} prije roka.',
      cAnswerOnDue: 'Odgovor odlazi {date}, na sam dan roka: još na vrijeme.',
      cAnswerLate: 'Odgovor odlazi {date}, {over} nakon roka. Produljenje za još dva mjeseca moguće je samo za složen zahtjev ili mnogo zahtjeva, uz najavu i razloge u prvom mjesecu; zahtjev zaboravljen u pretincu nije ni jedno ni drugo.',
      cAccessAll: 'Odgovor pokriva svih 8 mjesta.',
      cAccessPart: 'Odgovor pokriva {found} od 8 mjesta, a tvrdi da je to sve.',
      cEraseAll: 'Obrisano na {erased}; računi su zadržani, a kopije će isteći.',
      cErasePart: 'Obrisano na {erased}; na {still} podaci i dalje postoje, a odgovor kaže da je sve obrisano.',
      cAfterAccessAll: 'Ispitanik je dobio sve što tvrtka o njemu ima i zna koliko se što čuva.',
      cAfterAccessPart: 'Ispitanik nije dobio podatke s {notGot}. Ako za njih sazna, recimo iz kampanje poslane iz izvoza, može se obratiti nadzornom tijelu.',
      cAfterRecorded: '{gone}: obrisani podaci istekli su i iz posljednje sigurnosne kopije. Do tada je zapis o brisanju jamčio da ih obnova ne vrati u uporabu.',
      cAfterUnrecorded: '{gone}: obrisani podaci istekli su iz kopija sami od sebe. Da je u međuvremenu bilo obnove, obrisani bi se podaci vratili i nitko ne bi znao da ih treba ponovno obrisati.',
      cAfterStill: 'Na {still} podaci postoje i dalje: nitko ih nije tražio, pa ih nitko neće ni obrisati, a nove sigurnosne kopije ih i dalje sadrže.',
      cAfterClean: 'Osim računa, koje traži zakon, o ispitaniku više nema ništa.',

      daysN: ['{n} dan', '{n} dana', '{n} dana'],
      monthsN: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      placesLocN: ['{n} mjestu', '{n} mjesta', '{n} mjesta'],
      placesGenN: ['{n} mjesta', '{n} mjesta', '{n} mjesta'],
      date: '{d}. {m}. {y}.',
      monthNames: '1,2,3,4,5,6,7,8,9,10,11,12',

      // controls
      pKind: 'Zahtjev',
      oAccess: 'kopija (pristup)',
      oErasure: 'brisanje',
      pMap: 'Karta podataka',
      oGood: 'potpuna',
      oPartial: 'samo sustavi',
      oNone: 'nema je',
      pNoticed: 'Čeka u pretincu',
      pBackup: 'Kopije se čuvaju',

      // presets
      prGood: 'Potpuna karta',
      prGoodHint: 'svih osam mjesta, odgovor dan 19.',
      prPartial: 'Samo sustavi',
      prPartialHint: 'brzo, ali bez izvoza, testne kopije i pretinca prodavača',
      prNone: 'Bez karte',
      prNoneHint: 'tri mjesta, pita se okolo',
      prLate: 'Čekao dva tjedna',
      prLateHint: 'bez karte i 14 dana u pretincu: rok probijen',
      prEraseGood: 'Brisanje, potpuna karta',
      prEraseGoodHint: 'računi ostaju, kopije zapisane do isteka',
      prEraseNone: 'Brisanje bez karte',
      prEraseNoneHint: 'četiri mjesta i dalje imaju podatke',

      // legend
      legOn: 'na popisu',
      legOff: 'nije na popisu',
      legDone: '✓ pronađeno / obrisano',
      legKept: '§ zadržano po zakonu',
      legBackup: '⌛ u sigurnosnim kopijama',
      legMissed: '✕ propušteno',

      explain:
        '<p><b>Zahtjev ispitanika.</b> Svatko može od voditelja obrade tražiti kopiju svojih osobnih podataka ' +
        '(<b>pravo na pristup</b>, <i>right of access</i>, GDPR čl. 15.) ili njihovo brisanje (<b>pravo na ' +
        'brisanje</b>, <i>right to erasure</i>, čl. 17.). Voditelj obrade odgovara bez nepotrebnog odgađanja, a ' +
        'najkasnije <b>u roku od mjesec dana od zaprimanja</b> zahtjeva (čl. 12. st. 3.). Rok se može produljiti za ' +
        'još dva mjeseca samo ako je zahtjev složen ili ih je mnogo, ali ispitanika treba o tome obavijestiti, s razlozima, u prvom mjesecu. ' +
        'Rok teče od primitka, a ne od trenutka kad zahtjev stigne do zadužene osobe.</p>' +
        '<p><b>Gdje su podaci.</b> Glavni sustav nije jedino mjesto: tu su i pretinci e-pošte, izvozi u dijeljenim ' +
        'mapama, testne kopije baze, usluge koje vodi <b>izvršitelj obrade</b> (<i>processor</i>) i sigurnosne ' +
        'kopije. Pronaći se može samo ono za što netko zna. <b>Evidencija aktivnosti obrade</b> (<i>record of ' +
        'processing activities</i>, čl. 30.) navodi obrade, primatelje i rokove brisanja; karta podataka uz nju kaže ' +
        'u kojim se sustavima i kopijama podaci nalaze i tko je za njih odgovoran. Što je karta potpunija, to je ' +
        'potraga brža i odgovor potpuniji.</p>' +
        '<p><b>Što odgovor sadrži.</b> Kopiju podataka (čl. 15. st. 3.), svrhe, primatelje i predviđeno razdoblje ' +
        'pohrane (čl. 15. st. 1.). Odgovor koji izostavi mjesta za koja tvrtka ne zna nije potpun, ma koliko bio brz.</p>' +
        '<p><b>Brisanje nije uvijek potpuno.</b> Što zakon traži da se čuva (ovdje računi) ostaje, ali samo za tu ' +
        'svrhu (čl. 17. st. 3. (b)). Izvršitelj briše po uputi voditelja i pomaže mu odgovoriti (čl. 28. st. 3. (a) i (e)), a primatelje treba ' +
        'obavijestiti (čl. 19.). Iz sigurnosnih kopija jednu osobu obično nije moguće izbrisati: podaci ostaju dok ' +
        'kopije ne isteknu, a <b>zapis o brisanju</b> bilježi da se nakon obnove moraju ponovno obrisati prije ' +
        'uporabe. Kako kopije istječu, pokazuje <i>cmp-retention-hold</i>, a rotaciju kopija <i>retention-gfs</i>.</p>' +
        '<p><b>U Hrvatskoj.</b> Nadzorno tijelo kojem se ispitanik može obratiti je Agencija za zaštitu osobnih ' +
        'podataka (AZOP). Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) dodaje nacionalna pravila.</p>' +
        '<p><b>Pojednostavljeno.</b> Identitet se odmah potvrđuje; svako mjesto zbilja sadrži podatke; trajanja su ' +
        'izmišljena, kao i tvrtka i ispitanik. Nije pravni savjet.</p>'
    },
    en: {
      stage: 'A data subject\'s request: the deadline, eight places that hold their data, and what is found, erased or missed',

      reqTitle: 'Data subject\'s request',
      reqAccess: 'Please send me a copy of all my data.',
      reqErasure: 'Please erase all my data.',
      reqWho: 'a former customer, received {date}',
      laneClock: 'Deadline',
      laneClockSub: 'one month from receipt',
      mReceived: '▲ received',
      mDue: 'due {date}',
      mAnswer: '■ answer, day {d}',
      mExt: 'Extension to {date} only for a complex request or many requests, announced with reasons in the first month.',
      dayN: 'day {d}',

      pl_crm: 'Customer records',
      pl_invoices: 'Invoices',
      pl_support: 'Support mailbox',
      pl_newsletter: 'Newsletter, external service',
      pl_sales: 'A salesperson\'s mailbox',
      pl_export: 'Export in a shared folder',
      pl_test: 'Test copy of the database',
      pl_backups: 'Backups',
      wh_crm: 'name, address, purchases',
      wh_invoices: '14 invoices, 2024–2026',
      wh_support: '9 e-mails with support',
      wh_newsletter: 'subscription; run by a processor',
      wh_sales: '3 e-mails with a quote',
      wh_export: 'a 2025 campaign spreadsheet',
      wh_test: 'a copy of the customer records',
      wh_backups: 'nightly, each kept {b}',
      onList: 'on the list',
      offList: 'not on the list',

      st_wait: '… waiting',
      st_found: '✓ in the copy',
      st_noted: '≡ period stated in the answer',
      st_missed: '✕ nobody looked',
      st_erased: '✓ erased',
      st_processor: '✓ erased by the processor',
      st_kept: '§ kept by law',
      st_recorded: '⌛ in backups until {date}',
      st_aged: '✓ aged out {date}',
      st_agedPart: '⌛ erased data aged out {date}; missed data still backed up',
      st_still: '✕ still there',
      st_unrecorded: '⌛ until {date}, not recorded',

      sumFound: 'found',
      sumAnswer: 'answer',
      sumOnTime: 'on time',
      sumLate: '{d} late',
      sumErased: 'erased',
      sumKept: 'kept',
      sumBackups: 'in backups until',
      sumStill: 'still there',
      sumWait: 'answer not sent yet',
      foot: 'Simplified, not legal advice. The firm, the data subject, the places and the durations are made up.',

      cReceivedAccess: 'A former customer asks for a copy of all their personal data (right of access). The request arrived on {date} in the support mailbox.',
      cReceivedErase: 'A former customer asks for all their personal data to be erased (right to erasure). The request arrived on {date} in the support mailbox.',
      cClock: 'The clock runs from receipt: the answer is due by {due}.',
      cLogged: 'It reaches the person in charge of requests the same day; the next day it is logged, and the identity matches the account\'s address.',
      cLoggedLate: 'The request sat in the mailbox for {noticed} before anyone passed it on; the clock ran all the same.',
      cMap_good: 'The record and the data map list all eight places with an owner, the export, the test copy and the salesperson\'s mailbox too.',
      cMap_partial: 'The record lists the systems, not the copies people made: exports, test copies, personal mailboxes.',
      cMap_none: 'There is no record: the team looks where it remembers and asks around who has what.',
      cDone_found: '{place}: found in {d}, it goes into the copy.',
      cDone_noted: '{place}: they hold the same data for {b} more; the answer states that period too.',
      cDone_erased: '{place}: found and erased in {d}.',
      cDone_processor: '{place}: the processor erases on instruction; confirmed in {d}.',
      cDone_kept: '{place}: the law requires invoices to be kept; they stay, for that purpose only, and the answer says so.',
      cDone_recorded: '{place}: one person usually cannot be erased from them. The erasure record notes that the data stay until {gone} and must be erased again after any restore.',
      cMissed: '{place}: not on the list, so nobody looks there. The data stay, and the answer won\'t mention them.',
      cMissedBackups: '{place}: not on the list; the answer won\'t say how long they keep the data.',
      cMissedBackupsErase: '{place}: not on the list. The data stay in the backups until {gone}, and nobody has written that down: a restore would bring them back.',
      cLeft: 'Day {day}, {left} left.',
      cOver: 'Day {day}, {over} past the deadline.',
      cLeftDue: 'Day {day}, today is the due day itself.',
      cAnswerOnTime: 'The answer goes out on {date}, {left} before the deadline.',
      cAnswerOnDue: 'The answer goes out on {date}, the due day itself: still on time.',
      cAnswerLate: 'The answer goes out on {date}, {over} late. Two more months are possible only for a complex request or many requests, announced with reasons within the first month; a request left in the mailbox is neither.',
      cAccessAll: 'The answer covers all 8 places.',
      cAccessPart: 'The answer covers {found} of 8 places, and says that is all.',
      cEraseAll: 'Erased in {erased}; the invoices are kept, and the backups will age out.',
      cErasePart: 'Erased in {erased}; in {still} the data still exist, and the answer says everything was erased.',
      cAfterAccessAll: 'The data subject received everything the firm holds about them, and how long each part is kept.',
      cAfterAccessPart: 'The data subject did not receive the data from {notGot}. If they learn of them, say from a campaign sent from the export, they can complain to the supervisory authority.',
      cAfterRecorded: '{gone}: the erased data have aged out of the last backup that held them. Until then the erasure record made sure a restore would not bring them back into use.',
      cAfterUnrecorded: '{gone}: the erased data aged out of the backups by themselves. Had there been a restore meanwhile, the erased data would have come back, and nobody would have known to erase them again.',
      cAfterStill: 'In {still} the data still exist: nobody looked there, so nobody will erase them either, and new backups still contain them.',
      cAfterClean: 'Apart from the invoices the law requires, nothing about the data subject remains.',

      daysN: ['{n} day', '{n} days'],
      monthsN: ['{n} month', '{n} months'],
      placesLocN: ['{n} place', '{n} places'],
      placesGenN: ['{n} place', '{n} places'],
      date: '{d} {m} {y}',
      monthNames: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',

      pKind: 'Request',
      oAccess: 'a copy (access)',
      oErasure: 'erasure',
      pMap: 'Data map',
      oGood: 'complete',
      oPartial: 'systems only',
      oNone: 'none',
      pNoticed: 'Waits in the mailbox',
      pBackup: 'Backups are kept',

      prGood: 'Complete map',
      prGoodHint: 'all eight places, answer on day 19',
      prPartial: 'Systems only',
      prPartialHint: 'fast, but no export, test copy or salesperson\'s mailbox',
      prNone: 'No map',
      prNoneHint: 'three places, asking around',
      prLate: 'Waited two weeks',
      prLateHint: 'no map and 14 days in the mailbox: deadline missed',
      prEraseGood: 'Erasure, complete map',
      prEraseGoodHint: 'invoices stay, backups recorded until they age out',
      prEraseNone: 'Erasure, no map',
      prEraseNoneHint: 'four places still hold the data',

      legOn: 'on the list',
      legOff: 'not on the list',
      legDone: '✓ found / erased',
      legKept: '§ kept by law',
      legBackup: '⌛ in backups',
      legMissed: '✕ missed',

      explain:
        '<p><b>A data subject\'s request.</b> Anyone may ask a controller for a copy of their personal data ' +
        '(the <b>right of access</b>, GDPR art. 15) or for its erasure (the <b>right to erasure</b>, art. 17). The ' +
        'answer is due without undue delay and at the latest <b>one month after receipt</b> (art. 12(3)). The period ' +
        'may be extended by two further months only for complex or numerous requests, but the data subject must be told, ' +
        'with the reasons, within the first month. The clock runs from receipt, not from when the request reaches ' +
        'the person in charge.</p>' +
        '<p><b>Where the data are.</b> The main system is not the only place: there are mailboxes, exports in shared ' +
        'folders, test copies of the database, services a <b>processor</b> runs, and backups. Only what someone ' +
        'knows about can be found. The <b>record of processing activities</b> (art. 30) lists the processing, the ' +
        'recipients and the time limits for erasure; a data map beside it says which systems and copies hold the ' +
        'data and who owns them. The more complete the map, the faster the search and the more complete the answer.</p>' +
        '<p><b>What the answer contains.</b> A copy of the data (art. 15(3)), the purposes, the recipients and the ' +
        'envisaged storage period (art. 15(1)). An answer that leaves out places the firm does not know of is ' +
        'incomplete, however fast it is.</p>' +
        '<p><b>Erasure is not always complete.</b> What a law requires to be kept (here, invoices) stays, for that ' +
        'purpose only (art. 17(3)(b)). A processor erases on the controller\'s instruction and helps it answer (art. 28(3)(a) and (e)), and ' +
        'recipients are to be told (art. 19). One person usually cannot be erased from backups: the data stay until ' +
        'the backups age out, and an <b>erasure record</b> notes that they must be erased again after a restore, ' +
        'before use. How backups age out is <i>cmp-retention-hold</i>; how they rotate is <i>retention-gfs</i>.</p>' +
        '<p><b>In Croatia.</b> The supervisory authority a data subject can turn to is the Agencija za zaštitu ' +
        'osobnih podataka (AZOP). The Zakon o provedbi Opće uredbe o zaštiti podataka (the GDPR Implementation Act, ' +
        'NN 42/2018) adds national rules.</p>' +
        '<p><b>Simplified.</b> Identity is confirmed at once; every place really holds the data; the durations are ' +
        'made up, as are the firm and the data subject. Not legal advice.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
