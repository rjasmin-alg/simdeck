/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-log-evidence, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian terms: NOTES.md "Term pairs". Account names,
   addresses and times are data, not language: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zapisnici triju poslužitelja i središnje pohrane, čuvanje, redoslijed i pitanja istrage',

      // hosts
      hostGw: 'VPN pristupnik',
      hostIdm: 'Poslužitelj identiteta',
      hostFs: 'Datotečni poslužitelj',
      hostStore: 'Središnja pohrana zapisa',
      badgeGw: 'VPN',
      badgeIdm: 'ID',
      badgeFs: 'DAT',
      clockOk: 'sat točan',
      clockSlow: 'sat kasni {d} min',
      rightsNo: 'adm07 ovdje nije administrator',
      rightsYes: 'adm07 je ovdje administrator',
      storeOn: 'samo dodavanje, izvan poslužitelja',
      storeOff: 'nema je: zapisi ostaju na poslužiteljima',

      // records
      rLogin: 'prijava adm07 s 203.0.113.45',
      rChange: 'adm07: svc-bkp2 postaje administrator',
      rExport: 'adm07 kopira mapu Kupci',
      rWipe: 'lokalni zapisnik obrisan',
      rUnlogged: 'čitanje datoteka se ne bilježi',
      rGap: 'zapisnik počinje u {time}',
      sWiped: '✗',
      sAged: '⌛',
      sWipedL: 'obrisano',
      sAgedL: 'isteklo',

      // retention strip
      laneKeep: 'Čuvanje',
      mNight: '▲ noć incidenta, dan 0',
      mFound: '● otkriveno, dan {d}',
      mWindow: 'u zapisima: dan {from}–{to}',

      // timeline strip
      laneOrder: 'Redoslijed',
      laneOrderSub: 'po vremenskim oznakama',
      aLogin: 'prijava',
      aChange: 'novi administrator',
      aExport: 'kopiranje',
      oxLogin: 'prijava',
      oxChange: 'dodjela administratorskih prava',
      orderNone: 'premalo zapisa',
      orderTie: '= ista minuta',

      // questions
      thQuestion: 'Pitanje istrage',
      thAnswer: 'Odgovor',
      thWhy: 'Što kažu zapisi',
      qWho: 'Tko se prijavio i odakle?',
      qWhat: 'Što je račun promijenio?',
      qData: 'Koje je osobne podatke kopirao?',
      qOrder: 'Kojim redom?',
      qTamper: 'Je li netko brisao tragove?',
      qAccess: 'Sam zapisnik: osobni podaci',
      ansYes: '✓ da',
      ansPartly: '~ djelomično',
      ansNo: '✗ ne',
      ansWait: '?',
      ansOk: '✓ ograničen',
      ansBad: '✗ otvoren',
      yWho: 'adm07, s adrese 203.0.113.45',
      yWhat: 'svc-bkp2 je postao administrator',
      yData: 'mapa Kupci, 4 812 datoteka',
      yOrder: 'prijava → novi administrator → kopiranje',
      yTamper: 'u 23:31 adm07 je obrisao lokalne zapisnike; kopije su u pohrani',
      whyUnlogged: 'čitanje datoteka nije se bilježilo',
      whyWiped: 'obrisano s poslužitelja u 23:31, druge kopije nema',
      whyAged: 'isteklo: čuva se {keep}, otkriveno {found}. dana',
      whyOrderGaps: 'samo za {n} od 3 radnje',
      whyOrderDrift: 'izgleda dobro, ali sat kasni {d} min: ne može se dokazati',
      whyOrderTie: 'dvije radnje u istoj minuti: ne zna se što je prvo',
      whyOrderWrong: 'pogrešan: sat datotečnog poslužitelja kasni {d} min',
      whyOrderNone: 'premalo zapisa',
      whyTamperGap: 'zapisnici oba poslužitelja počinju u trenutku brisanja: ne zna se što je obrisano ni tko',
      whyTamperAged: 'isteklo zajedno s ostalim zapisima',
      accessHost: 'čuva se {keep}; čita ga i briše svaki administrator poslužitelja',
      accessAdmins: 'čuva se {keep}; pretražuju ga svi administratori, i adm07',
      accessNamed: 'čuva se {keep}; čitaju ga dvoje imenovanih, i to se bilježi',
      waitAnswer: 'odgovor u zadnjem koraku',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, računi, adrese i brojevi su izmišljeni; vrijeme je ' +
        'u minutama, dani se broje od noći incidenta.',

      // units
      daysN: ['{n} dan', '{n} dana', '{n} dana'],
      minN: '{n} min',

      // caption sentences (sim.js captionKeys)
      cStart: 'Mala tvrtka, tri poslužitelja; svaki bilježi što se na njemu radi. Račun adm07 je administrator na ' +
        'poslužitelju identiteta i datotečnom poslužitelju, ali ne i na VPN pristupniku.',
      cStartLocal: 'Zapisi ostaju na poslužiteljima koji ih pišu.',
      cStartCentral: 'Svaki zapis odmah ide i u središnju pohranu, u koju se može samo dodavati.',
      cLogin: '{time}: netko se prijavljuje računom adm07 s adrese {ip}.',
      cLoginLocal: 'Zapis ostaje na pristupniku.',
      cLoginCentral: 'Kopija zapisa odmah odlazi u središnju pohranu.',
      cChange: '{time}: adm07 daje novom računu svc-bkp2 administratorska prava. Poslužitelj identiteta to bilježi.',
      cExport: '{time}: adm07 kopira mapu Kupci, punu osobnih podataka kupaca.',
      cExportDrift: 'Sat datotečnog poslužitelja kasni {drift}, pa zapis nosi oznaku {stamp}.',
      cExportUnlogged: '{time}: adm07 kopira mapu Kupci, punu osobnih podataka. Čitanje datoteka se ne bilježi, pa ' +
        'zapisa nema.',
      cCoverLocal: '{time}: adm07 briše lokalne zapisnike na poslužitelju identiteta i datotečnom poslužitelju. ' +
        'Ondje je administrator, pa može, a to su jedine kopije.',
      cCoverCentral: '{time}: adm07 briše lokalne zapisnike na oba poslužitelja. Kopije su već u središnjoj ' +
        'pohrani, koju ne može mijenjati, a ondje ostaje i zapis o samom brisanju.',
      cFound: 'Dan {found}: kupci prijavljuju lažne poruke u ime tvrtke i počinje istraga.',
      cFoundKept: 'Zapisi se čuvaju {keep}, pa je noć incidenta još unutar razdoblja čuvanja.',
      cFoundAged: 'Zapisi se čuvaju samo {keep}: noć incidenta istekla je {expired}. dana, prije otkrivanja.',
      cOrderYes: 'Satovi se slažu: vremenske oznake daju pravi redoslijed, prijava, novi administrator, kopiranje.',
      cOrderGaps: 'Redoslijed se vidi samo za {n} od 3 radnje; za ostale zapisa nema.',
      cOrderNone: 'Ostalo je premalo zapisa za bilo kakav redoslijed.',
      cOrderLucky: 'Redoslijed izgleda dobro, ali sat datotečnog poslužitelja kasni {drift}: bez usklađenih satova ' +
        'to se ne može dokazati.',
      cOrderTie: 'Sat datotečnog poslužitelja kasni {drift}, pa kopiranje ima istu minutu kao radnja „{other}“: ' +
        'ne zna se što je bilo prije.',
      cOrderWrong: 'Sat datotečnog poslužitelja kasni {drift}: kopiranje nosi oznaku {stamp} i izgleda kao da je ' +
        'bilo prije radnje „{other}“.',
      cAnswersAll: 'Istraga odgovara na svih 5 pitanja.',
      cAnswersSome: 'Od 5 pitanja istraga odgovara na {yes}, djelomično na {partly}.',
      cAnswersCount: 'Od 5 pitanja istraga odgovara na {yes}.',
      cAnswersNone: 'Istraga ne može odgovoriti ni na jedno pitanje.',
      cAccessHost: 'A zapisnik i sam sadrži osobne podatke: na poslužiteljima ga čita i briše svaki njihov ' +
        'administrator.',
      cAccessAdmins: 'Zapisnik i sam sadrži osobne podatke, a pohranu pretražuju svi administratori, i adm07: ' +
        'vidi što je o njemu zabilježeno, i tuđe aktivnosti.',
      cAccessNamed: 'Zapisnik i sam sadrži osobne podatke: čitaju ga samo dvoje imenovanih, a koliko se čuva ' +
        'zasebno je pravilo, zapisano i obrazloženo.',

      // controls
      pStore: 'Gdje su zapisi',
      oLocal: 'na poslužiteljima',
      oCentral: 'i u središnjoj pohrani',
      pDrift: 'Sat datotečnog poslužitelja kasni',
      pKeep: 'Zapisi se čuvaju',
      pFound: 'Incident otkriven nakon',
      pFileReads: 'Bilježi se čitanje datoteka',
      pReaders: 'Pohranu čitaju',
      oAdmins: 'svi administratori',
      oNamed: 'dvoje imenovanih',

      // presets
      prLocal: 'Zapisi na poslužiteljima',
      prLocalHint: 'adm07 briše lokalne zapisnike; ostaje samo zapis s pristupnika do kojeg ne doseže',
      prCentral: 'Središnja pohrana',
      prCentralHint: 'kopije su izvan dosega adm07: istraga odgovara na svih pet pitanja',
      prDrift: 'Sat kasni 12 min',
      prDriftHint: 'kopiranje izgleda kao da je bilo prije prijave',
      prShortKeep: 'Čuva se 30 dana',
      prShortKeepHint: 'otkriveno 45. dana: noć incidenta je istekla; probaj 180 dana',
      prNotLogged: 'Čitanje se ne bilježi',
      prNotLoggedHint: 'ne zna se koji su osobni podaci kopirani',
      prOpenStore: 'Pohranu čitaju svi',
      prOpenStoreHint: 'dokazi su tu, ali zapisnik s osobnim podacima čita i adm07',

      // legend
      legKept: 'zapis postoji',
      legWiped: 'obrisan',
      legAged: 'istekao',
      legWindow: 'razdoblje čuvanja',

      explain:
        '<p><b>Kad je zapisnik dokaz.</b> Istraga pita tko je što napravio i kada. Zapisnik (<i>log</i>) na to ' +
        'odgovara samo ako je <b>potpun</b> (radnja se uopće bilježi), ako se <b>satovi slažu</b> (vremenske oznake ' +
        'različitih poslužitelja mogu se usporediti), ako je <b>izvan dosega</b> administratora koje bilježi ' +
        '(zapisi odmah odlaze s poslužitelja u pohranu u koju se može samo dodavati, <i>append-only</i>) i ako se ' +
        '<b>čuva dovoljno dugo</b> da pokrije koliko kasno se incidenti otkrivaju.</p>' +
        '<p><b>Što pokazuje pozornica.</b> Administrator koji može obrisati lokalni zapisnik može obrisati i trag ' +
        'o sebi; preživi samo ono što je izvan njegova dosega (pristupnik, središnja pohrana). Kopija poslana ' +
        'odmah, prije brisanja, sačuva i zapis o samom brisanju. Sat koji kasni nekoliko minuta zamijeni redoslijed ' +
        'radnji na različitim poslužiteljima, a čak i kad redoslijed slučajno ispadne dobar, ne može se dokazati. ' +
        'Ako se čitanje datoteka ne bilježi, ne zna se koji su osobni podaci kopirani ni koliko je ljudi pogođeno, ' +
        'a obavijest o povredi traži kategorije i približan broj ispitanika (GDPR, čl. 33. st. 3.). Ako se zapisi ' +
        'čuvaju kraće nego što prođe do otkrivanja, istraga nema što čitati.</p>' +
        '<p><b>Sam zapisnik sadrži osobne podatke</b>: tko se kada prijavio, s koje adrese, koje je datoteke ' +
        'otvorio. Zato treba vlastita pravila: razdoblje čuvanja koje je zapisano i obrazloženo (dovoljno za ' +
        'istragu, ne dulje; GDPR čl. 5. st. 1. (c) i (e), smanjenje količine podataka i ograničenje pohrane) i ' +
        'pristup samo onima koji ga trebaju, uz bilježenje i tog pristupa (sigurnost obrade, čl. 32.).</p>' +
        '<p><b>Odakle pravila.</b> ISO/IEC 27001:2022 u Prilogu A ima kontrole za bilježenje (8.15), nadzor ' +
        '(8.16) i usklađivanje satova (8.17). NIS2 (Direktiva (EU) 2022/2555, čl. 21.) traži mjere za postupanje ' +
        's incidentima, a u Hrvatskoj je provodi Zakon o kibernetičkoj sigurnosti. Koliko dugo čuvati zapise ' +
        'ovdje je samo primjer.</p>' +
        '<p><b>Pojednostavljeno.</b> Kopija stiže u pohranu u istoj minuti; pohrana čuva vremensku oznaku ' +
        'poslužitelja; sat kasni samo na jednom poslužitelju. Tvrtka, računi i brojevi su izmišljeni. Nije pravni ' +
        'savjet. Povezano: put zapisa na Linuxu (<i>lnx-log-path</i>), usklađivanje satova (<i>ntp-sync</i>).</p>'
    },
    en: {
      stage: 'Logs of three hosts and a central store, retention, order and the investigation\'s questions',

      hostGw: 'VPN gateway',
      hostIdm: 'Identity server',
      hostFs: 'File server',
      hostStore: 'Central log store',
      badgeGw: 'VPN',
      badgeIdm: 'ID',
      badgeFs: 'FS',
      clockOk: 'clock right',
      clockSlow: 'clock {d} min slow',
      rightsNo: 'adm07 is not an admin here',
      rightsYes: 'adm07 is an admin here',
      storeOn: 'append-only, off the hosts',
      storeOff: 'none: logs stay on the hosts',

      rLogin: 'adm07 logs in from 203.0.113.45',
      rChange: 'adm07 makes svc-bkp2 an admin',
      rExport: 'adm07 copies the Customers folder',
      rWipe: 'local log deleted',
      rUnlogged: 'file reads are not logged',
      rGap: 'log begins at {time}',
      sWiped: '✗',
      sAged: '⌛',
      sWipedL: 'deleted',
      sAgedL: 'aged out',

      laneKeep: 'Retention',
      mNight: '▲ the night, day 0',
      mFound: '● found, day {d}',
      mWindow: 'still held: day {from}–{to}',

      laneOrder: 'Order',
      laneOrderSub: 'by timestamps',
      aLogin: 'login',
      aChange: 'new admin',
      aExport: 'copy',
      oxLogin: 'login',
      oxChange: 'admin grant',
      orderNone: 'too few records',
      orderTie: '= same minute',

      thQuestion: 'The investigation asks',
      thAnswer: 'Answer',
      thWhy: 'What the logs say',
      qWho: 'Who logged in, from where?',
      qWhat: 'What did the account change?',
      qData: 'Which personal data did it copy?',
      qOrder: 'In what order?',
      qTamper: 'Did anyone delete evidence?',
      qAccess: 'The log itself: personal data',
      ansYes: '✓ yes',
      ansPartly: '~ partly',
      ansNo: '✗ no',
      ansWait: '?',
      ansOk: '✓ restricted',
      ansBad: '✗ open',
      yWho: 'adm07, from 203.0.113.45',
      yWhat: 'svc-bkp2 became an admin',
      yData: 'the Customers folder, 4,812 files',
      yOrder: 'login → new admin → copy',
      yTamper: 'at 23:31 adm07 deleted the local logs; the store has copies',
      whyUnlogged: 'file reads were never logged',
      whyWiped: 'deleted from the host at 23:31, no other copy',
      whyAged: 'aged out: kept {keep}, found on day {found}',
      whyOrderGaps: 'only for {n} of 3 actions',
      whyOrderDrift: 'looks right, but a clock is {d} min slow: unprovable',
      whyOrderTie: 'two actions in the same minute: which came first is unknown',
      whyOrderWrong: 'wrong: the file server\'s clock is {d} min slow',
      whyOrderNone: 'too few records',
      whyTamperGap: 'both servers\' logs begin at the deletion: what was deleted, and by whom, is unknown',
      whyTamperAged: 'aged out with the other records',
      accessHost: 'kept {keep}; every admin of the host reads and deletes it',
      accessAdmins: 'kept {keep}; every admin can search it, adm07 too',
      accessNamed: 'kept {keep}; two named reviewers read it, and that is logged',
      waitAnswer: 'answered in the last step',

      foot: 'Simplified, not legal advice. The firm, accounts, addresses and numbers are made up; times in ' +
        'minutes, days counted from the night of the incident.',

      daysN: ['{n} day', '{n} days'],
      minN: '{n} min',

      cStart: 'A small firm, three hosts; each logs what is done on it. The account adm07 is an admin on the ' +
        'identity server and the file server, but not on the VPN gateway.',
      cStartLocal: 'The records stay on the hosts that write them.',
      cStartCentral: 'Every record also goes at once to a central store that can only be appended to.',
      cLogin: '{time}: someone logs in as adm07 from {ip}.',
      cLoginLocal: 'The record stays on the gateway.',
      cLoginCentral: 'A copy goes to the central store at once.',
      cChange: '{time}: adm07 gives a new account, svc-bkp2, admin rights. The identity server logs it.',
      cExport: '{time}: adm07 copies the Customers folder, full of customers\' personal data.',
      cExportDrift: 'The file server\'s clock is {drift} slow, so the record is stamped {stamp}.',
      cExportUnlogged: '{time}: adm07 copies the Customers folder, full of personal data. File reads are not ' +
        'logged, so there is no record.',
      cCoverLocal: '{time}: adm07 deletes the local logs on the identity server and the file server. It is an ' +
        'admin there, so it can, and those were the only copies.',
      cCoverCentral: '{time}: adm07 deletes the local logs on both servers. The copies are already in the central ' +
        'store, which it cannot change, and the store also keeps a record of the deletion itself.',
      cFound: 'Day {found}: customers report fake messages in the firm\'s name, and the investigation starts.',
      cFoundKept: 'Records are kept {keep}, so the night of the incident is still inside the retention period.',
      cFoundAged: 'Records are kept only {keep}: the night of the incident aged out on day {expired}, before it was ' +
        'found.',
      cOrderYes: 'The clocks agree: the timestamps give the true order, login, new admin, copy.',
      cOrderGaps: 'The order shows for only {n} of the 3 actions; the others have no record.',
      cOrderNone: 'Too few records are left for any order.',
      cOrderLucky: 'The order looks right, but the file server\'s clock is {drift} slow: without synchronised ' +
        'clocks nobody can prove it.',
      cOrderTie: 'The file server\'s clock is {drift} slow, so the copy has the same minute as the {other}: which ' +
        'came first is unknown.',
      cOrderWrong: 'The file server\'s clock is {drift} slow: the copy is stamped {stamp} and seems to come before ' +
        'the {other}.',
      cAnswersAll: 'The investigation answers all 5 questions.',
      cAnswersSome: 'Of the 5 questions the investigation answers {yes}, and {partly} in part.',
      cAnswersCount: 'Of the 5 questions the investigation answers {yes}.',
      cAnswersNone: 'The investigation cannot answer a single question.',
      cAccessHost: 'And the log itself holds personal data: on the hosts every admin of each host reads and deletes ' +
        'it.',
      cAccessAdmins: 'The log itself holds personal data, and every admin can search the store, adm07 included: it ' +
        'sees what was recorded about it, and everyone else\'s activity.',
      cAccessNamed: 'The log itself holds personal data: only two named reviewers read it, and how long it is kept ' +
        'is a rule of its own, written down and justified.',

      pStore: 'Where the logs are',
      oLocal: 'on the hosts',
      oCentral: 'also in a central store',
      pDrift: 'File server\'s clock is slow by',
      pKeep: 'Records are kept',
      pFound: 'Incident found after',
      pFileReads: 'File reads are logged',
      pReaders: 'Who reads the store',
      oAdmins: 'every admin',
      oNamed: 'two named reviewers',

      prLocal: 'Logs on the hosts',
      prLocalHint: 'adm07 deletes the local logs; only the gateway\'s record, out of its reach, is left',
      prCentral: 'Central store',
      prCentralHint: 'the copies are out of adm07\'s reach: all five questions answered',
      prDrift: 'Clock 12 min slow',
      prDriftHint: 'the copy seems to come before the login',
      prShortKeep: 'Kept 30 days',
      prShortKeepHint: 'found on day 45: the night has aged out; try 180 days',
      prNotLogged: 'File reads not logged',
      prNotLoggedHint: 'which personal data was copied is unknown',
      prOpenStore: 'Open log store',
      prOpenStoreHint: 'the evidence is there, but adm07 can read a log full of personal data',

      legKept: 'record held',
      legWiped: 'deleted',
      legAged: 'aged out',
      legWindow: 'retention window',

      explain:
        '<p><b>When a log is evidence.</b> An investigation asks who did what, and when. A log answers only if it ' +
        'is <b>complete</b> (the action is recorded at all), if the <b>clocks agree</b> (timestamps from different ' +
        'hosts can be compared), if it is <b>out of reach</b> of the administrators it records (records leave the ' +
        'host at once for a store that can only be appended to) and if it is <b>kept long enough</b> to cover how ' +
        'late incidents are found.</p>' +
        '<p><b>What the stage shows.</b> An admin who can delete a local log can delete the trace of itself; only ' +
        'what is out of its reach survives (the gateway, the central store). A copy sent at once, before the ' +
        'deletion, also keeps the record of the deletion itself. A clock a few minutes slow swaps the order of ' +
        'actions on different hosts, and even when the order happens to come out right, nobody can prove it. If ' +
        'file reads are not logged, nobody can say which personal data was copied or how many people are concerned, ' +
        'while the breach notification asks for the categories and approximate number of people (GDPR art. 33(3)). If ' +
        'records are kept for less time than it takes to find the incident, the investigation has nothing to read.</p>' +
        '<p><b>The log itself holds personal data</b>: who logged in when, from which address, which files they ' +
        'opened. So it needs rules of its own: a retention period that is written down and justified (long enough ' +
        'for an investigation, no longer; GDPR art. 5(1)(c) and (e), data minimisation and storage limitation) and ' +
        'access only for those who need it, with that access logged too (security of processing, art. 32).</p>' +
        '<p><b>Where the rules come from.</b> ISO/IEC 27001:2022 has Annex A controls for logging (8.15), ' +
        'monitoring (8.16) and clock synchronisation (8.17). NIS2 (Directive (EU) 2022/2555, art. 21) requires ' +
        'incident-handling measures; in Croatia the Zakon o kibernetičkoj sigurnosti implements it. How long to keep ' +
        'records is only an example here.</p>' +
        '<p><b>Simplified.</b> A copy reaches the store in the same minute; the store keeps the host\'s timestamp; ' +
        'only one host\'s clock drifts. The firm, accounts and numbers are made up. Not legal advice. Related: the ' +
        'path of a log record on Linux (<i>lnx-log-path</i>), clock synchronisation (<i>ntp-sync</i>).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
