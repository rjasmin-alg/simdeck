/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of email-path, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   [[term]] is a glossary term, [[=term]] a later mention. Addresses, host names, ports, SMTP commands, header lines
   and the letter's text are data, drawn by the page with translate="no". Terms follow UL ch20 and URM ch14:
   poštanski klijent, agent za predaju / prijenos / dostavu pošte, omotnica poruke, prosljeđivanje, spremište
   poruka, poštanski sandučić; log role words from the UL ch20 figure (prima s mreže, nosi dalje, odlaže). The title
   and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put e-poruke: tko je preuzima na kojem portu, što joj tko dodaje i kako je dohvaćaju primateljevi uređaji',

      // controls
      fetch: 'Dohvat',
      fetchPop3: 'POP3 s brisanjem',
      headerFromDiffers: 'Zaglavlje From: drukčije od omotnice',
      authenticated: 'Prijava pri predaji',
      script: 'Scenarij',

      // presets
      presetTwo: 'Dvije domene',
      presetTwoHint: 'Od ana@lab.example do ivan@drugdje.example: predaja, MX, prijenos, dostava, dohvat.',
      presetUrm: 'Dva uređaja',
      presetUrmHint: 'URM, poglavlje 14, primjer 4: poruka unutar tvrtke, pročitana na telefonu, pa na računalu. Probaj i POP3.',
      presetEnv: 'Omotnica i zaglavlje',
      presetEnvHint: 'MAIL FROM je ana, a u zaglavlju piše direktor.',
      presetNoAuth: 'Predaja bez prijave',
      presetNoAuthHint: 'Klijent ne prijavljuje korisnika na portu 587.',

      // legend
      legEnvelope: 'omotnica: MAIL FROM, RCPT TO',
      legLetter: 'pismo: zaglavlje i tijelo',
      legPort: 'port',
      legDot: 'pročitano / nepročitano',
      legChanged: 'novo u ovom koraku',

      // lanes
      roleA: 'pošiljateljev klijent',
      roleP: 'predaja, pa prijenos',
      roleD: 'zapisi MX',
      roleM: 'prijemni poslužitelj',
      roleS: 'dostava u sandučić',
      roleI: 'primateljev klijent',
      hasMsg: 'ima poruku',
      outbox: 'poruka čeka u klijentu',
      mailboxEmpty: '(prazno)',
      msgN: 'poruka {n}',
      removedQuit: 'obrisana na QUIT',
      notSynced: 'nije se javio',
      notSent: 'nije poslano',
      devPhoneName: 'telefon',
      devComputerName: 'računalo',
      chartEmpty: 'Još se ništa nije dogodilo.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],

      // chart rows
      noAuth: 'bez prijave',
      refused: 'odbijeno',
      rowNone: 'nema poruka',
      noteLocal: 'domena je njegova: bez MX-a',
      noteRead: 'pročitano samo ovdje',
      cSubmit: 'predaja',
      cRefuse: 'odbijanje',
      cRelay: 'prijenos',
      cLocal: 'lokalno',
      cDeliver: 'dostava',
      cFetch: 'dohvat',
      cRead: 'čitanje',

      // message panel
      msgTitle: 'Poruka',
      envTitle: 'omotnica: naredbe SMTP-a',
      letterTitle: 'pismo: zaglavlje i tijelo',
      traceNote: 'Retke Received dodaju poslužitelji, najnoviji na vrh.',
      logTitle: 'Dnevnici poslužitelja',
      logEmpty: 'Još nijedan zapis.',
      logReceive: 'prima s mreže',
      logSend: 'nosi dalje',
      logDeliver: 'odlaže',
      logIn: 'dnevnik:',
      fromDiffers: 'iz omotnice',

      // captions
      capStart: '{from} je napisala poruku za {to}. Pritisni → i klijent će je predati poslužitelju.',
      capStartUrm: 'Zaposlenik Prodaje, {from}, piše internu poruku kolegi u Proizvodnji, {to}, preko poslužitelja {srv}. Pritisni →.',
      capSubmit: '[[mail user agent]] predaje poruku na port 587, uz prijavu. Omotnicu šalje kao naredbe (MAIL FROM {from}, RCPT TO {to}), pismo iza njih. [[mail submission agent]] provjerava pravila ustanove, prima poruku i na vrh stavlja prvi redak Received. To je [[submission]], a ne slanje na port 25.',
      capSubmitDiff: 'U pismu piše From: {hdr}, u omotnici MAIL FROM {env}: dva podatka, a ovaj ih agent za predaju ne uspoređuje.',
      capTry: 'Klijent otvara sjednicu na portu 587, ali ne prijavljuje korisnika, i šalje MAIL FROM {from}.',
      capRefuse: '[[mail submission agent]] zadano odbija MAIL iz neprijavljene sjednice: 530 5.7.0. Poruka ostaje u klijentu i nije napustila domenu pošiljatelja: nema retka Received, upita MX ni prijenosa. U dnevniku poslužitelja ostaje samo odbijenica.',
      capMx: '[[mail transfer agent]] pita DNS za zapis MX domene {domain}, domene iz RCPT TO, ne iz zaglavlja. Od {count} zapisa bira onaj s najmanjom prednošću: {host}, prednost {pref}, iako je u zoni prvi naveden drugi zapis. Poruku nosi jedan skok dalje, na port 25.',
      capLocal: 'Domena {domain} iz RCPT TO domena je ovog poslužitelja: nema upita MX ni prijenosa drugom poslužitelju. Agent za prijenos poruku predaje ravno na dostavu.',
      capRelay: 'Jedan skok, poslužitelj–poslužitelj: {from} poruku nosi dalje SMTP-om, na port 25 stroja {to}; to je [[relay]]. Omotnica opet putuje kao naredbe, pismo kao podaci. Prijemni poslužitelj na vrh stavlja svoj redak Received; osim tog traga poruka se ne mijenja. Obje strane pišu u svoj dnevnik, svaka na svom stroju.',
      capDeliver: '[[mail delivery agent]] prenosi odgovornost u [[mailbox]] korisnika {to}: poruka je u [[message store]] i više nije u poštanskom sustavu. Dostava upisuje Return-Path iz omotnice ({from}) i još jedan redak Received.',
      capDeliverDiff: 'Return-Path kaže {env}, From: kaže {hdr}. Nijedan ih poslužitelj na putu nije usporedio.',
      capFetchImap: '{device} dohvaća poštu IMAP-om, na portu 143: ne SMTP-om. Vidi poruku onakvu kakva je na poslužitelju, {state}. Ništa se ne odnosi ni briše: poruka ostaje u spremištu.',
      capFetchPop: '{device} dohvaća poštu POP3-om, na portu 110: preuzima poruku (RETR) i označava je za brisanje (DELE), a poslužitelj je briše kad sjednica završi (QUIT). Sandučić na poslužitelju je prazan.',
      capFetchNone: '{device} se javlja istom poslužitelju, ali poruke više nema: POP3 ju je s brisanjem odnio na prvi uređaj. Nije „nepročitana“: na ovaj uređaj nikad nije ni stigla.',
      capFetchHdr: 'Primatelj vidi From: {hdr}. Pošiljatelj iz omotnice, {env}, ne prikazuje se: u spremljenoj poruci čuva ga Return-Path, a na putu su ga zapisali dnevnici poslužitelja.',
      capReadImap: 'Korisnik otvara poruku na uređaju: {device}. IMAP stanje drži na poslužitelju, pa se zastavica \\Seen postavlja u spremištu, ne na uređaju.',
      capReadPop: 'Korisnik čita poruku na uređaju: {device}. Oznaka „pročitano“ postoji samo u kopiji na tom uređaju; na poslužitelju poruke više nema.',
      stUnread: 'nepročitanu',
      stRead: 'već pročitanu',
      devPhone: 'Telefon',
      devComputer: 'Računalo',
      capEndTwo: 'Na kraju puta: tri retka Received i četiri zapisa u dnevnicima, po jedan za svaku ulogu.',

      explain: '<p>Poruku na putu dodiruje nekoliko programa, svaki sa svojom ulogom. [[mail user agent]] je ono s čime radi ' +
        'čovjek. Predaje je na port <b>587</b>; [[mail submission agent]] provodi pravila ustanove i zadano odbija ' +
        'neprijavljenu sjednicu (530). Zatim [[mail transfer agent]] nosi poruku <b>jedan skok</b>, SMTP-om na port ' +
        '<b>25</b>: sljedeći poslužitelj nalazi u zapisu MX domene primatelja, onaj s najmanjom prednošću (jednake: bilo ' +
        'koji). Na kraju [[mail delivery agent]] prenosi odgovornost u [[mailbox]], odakle je klijent dohvaća.</p>' +
        '<p>Poruka ima dva sloja. [[envelope]], MAIL FROM i RCPT TO, putuje kao naredbe SMTP-a i po njoj se usmjerava; ' +
        'pismo, zaglavlje (From:, To:, Subject:) i tijelo, putuje kao podaci. To su dva podatka koja se ne moraju ' +
        'podudarati. [[=relay]] ne mijenja poruku osim što na vrh dodaje redak Received, a dostava upisuje ' +
        'Return-Path iz omotnice.</p>' +
        '<p>Dohvat nikad nije SMTP. <b>IMAP</b> (143, uz implicitni TLS 993) drži poruke i njihovo stanje u ' +
        '[[message store]] na poslužitelju, pa svi uređaji vide isto. <b>POP3</b> (110, odnosno 995) poštu obično ' +
        'preuzme i obriše, pa je drugi uređaj ne vidi. Šifriranje veze ima dva oblika, STARTTLS na istom portu i ' +
        'implicitni TLS na zasebnom; ovdje se ne prikazuju.</p>' +
        '<p>Izvori: Uvod u Linux, poglavlje 20; Uvod u računalne mreže, poglavlje 14 (primjer 4); RFC 5598, 5321, 6409, ' +
        '9051 i 1939.</p>'
    },

    en: {
      stage: 'The path of an e-mail: who takes it over on which port, what each one adds to it, and how the recipient\'s devices fetch it',

      // controls
      fetch: 'Fetch',
      fetchPop3: 'POP3 with delete',
      headerFromDiffers: 'Header From: differs from the envelope',
      authenticated: 'Login at submission',
      script: 'Scenario',

      // presets
      presetTwo: 'Two domains',
      presetTwoHint: 'From ana@lab.example to ivan@drugdje.example: submission, MX, relay, delivery, fetch.',
      presetUrm: 'Two devices',
      presetUrmHint: 'URM, chapter 14, example 4: a message inside the firm, read on the phone, then on the computer. Try POP3 too.',
      presetEnv: 'Envelope and header',
      presetEnvHint: 'MAIL FROM is ana, the header says direktor.',
      presetNoAuth: 'Submission without login',
      presetNoAuthHint: 'The client does not log the user in on port 587.',

      // legend
      legEnvelope: 'envelope: MAIL FROM, RCPT TO',
      legLetter: 'letter: header and body',
      legPort: 'port',
      legDot: 'read / unread',
      legChanged: 'new in this step',

      // lanes
      roleA: 'sender\'s client',
      roleP: 'submission, then transfer',
      roleD: 'MX records',
      roleM: 'receiving server',
      roleS: 'delivery to the mailbox',
      roleI: 'recipient\'s client',
      hasMsg: 'has the message',
      outbox: 'the message waits in the client',
      mailboxEmpty: '(empty)',
      msgN: 'message {n}',
      removedQuit: 'deleted at QUIT',
      notSynced: 'not connected yet',
      notSent: 'not sent',
      devPhoneName: 'phone',
      devComputerName: 'computer',
      chartEmpty: 'Nothing has happened yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      // chart rows
      noAuth: 'no login',
      refused: 'refused',
      rowNone: 'no messages',
      noteLocal: 'its own domain: no MX',
      noteRead: 'read only here',
      cSubmit: 'submission',
      cRefuse: 'refusal',
      cRelay: 'relay',
      cLocal: 'local',
      cDeliver: 'delivery',
      cFetch: 'fetch',
      cRead: 'read',

      // message panel
      msgTitle: 'The message',
      envTitle: 'envelope: SMTP commands',
      letterTitle: 'letter: header and body',
      traceNote: 'Servers add the Received: lines, the newest on top.',
      logTitle: 'Server logs',
      logEmpty: 'No entries yet.',
      logReceive: 'receives',
      logSend: 'carries on',
      logDeliver: 'puts it down',
      logIn: 'log:',
      fromDiffers: 'in the envelope',

      // captions
      capStart: '{from} has written a message for {to}. Press → and the client hands it to the server.',
      capStartUrm: 'A Sales employee, {from}, writes an internal message to a colleague in Production, {to}, through the server {srv}. Press →.',
      capSubmit: 'The [[mail user agent]] submits the message on port 587, logged in. It sends the envelope as commands (MAIL FROM {from}, RCPT TO {to}) and the letter after them. The [[mail submission agent]] checks the organisation\'s policy, accepts the message and puts the first Received: line on top. This is [[submission]], not sending to port 25.',
      capSubmitDiff: 'The letter says From: {hdr}, the envelope MAIL FROM {env}: two pieces of data, and this submission agent does not compare them.',
      capTry: 'The client opens a session on port 587 but does not log the user in, and sends MAIL FROM {from}.',
      capRefuse: 'By default the [[mail submission agent]] refuses MAIL from a session that has not logged in: 530 5.7.0. The message stays in the client and never leaves the sender\'s domain: no Received: line, no MX lookup, no relay. The server\'s log holds only the refusal.',
      capMx: 'The [[mail transfer agent]] asks DNS for the MX record of {domain}, the domain from RCPT TO, not from the header. Of {count} records it takes the lowest preference: {host}, preference {pref}, although the zone lists another first. It carries the message one hop further, to port 25.',
      capLocal: 'The domain {domain} from RCPT TO is this server\'s own: no MX lookup and no relay to another server. The transfer agent hands the message straight to delivery.',
      capRelay: 'One hop, server to server: {from} carries the message on over SMTP, to port 25 of {to}; that is a [[relay]]. The envelope again travels as commands, the letter as data. The receiving server puts its own Received: line on top; apart from that trace the message does not change. Both sides write to their own log, each on its own machine.',
      capDeliver: 'The [[mail delivery agent]] moves responsibility into the [[mailbox]] of {to}: the message is in the [[message store]] and no longer in the mail system. Delivery writes Return-Path from the envelope ({from}) and one more Received: line.',
      capDeliverDiff: 'Return-Path says {env}, From: says {hdr}. No server on the way compared them.',
      capFetchImap: '{device} fetches the mail over IMAP, on port 143: not SMTP. It sees the message as it is on the server, {state}. Nothing is taken away or deleted: the message stays in the store.',
      capFetchPop: '{device} fetches the mail over POP3, on port 110: it downloads the message (RETR) and marks it for deletion (DELE), and the server deletes it when the session ends (QUIT). The mailbox on the server is empty.',
      capFetchNone: '{device} asks the same server, but the message is gone: POP3 with delete took it to the first device. It is not "unread": it never reached this device at all.',
      capFetchHdr: 'The recipient sees From: {hdr}. The sender from the envelope, {env}, is not shown: in the stored message Return-Path keeps it, and on the way the servers\' logs recorded it.',
      capReadImap: 'The user opens the message on the {device}. IMAP keeps state on the server, so the \\Seen flag is set in the store, not on the device.',
      capReadPop: 'The user reads the message on the {device}. "Read" exists only in that device\'s copy; the server no longer has the message.',
      stUnread: 'unread',
      stRead: 'already read',
      devPhone: 'The phone',
      devComputer: 'The computer',
      capEndTwo: 'At the end of the path: three Received lines and four log entries, one for each role.',

      explain: '<p>On its way a message is touched by several programs, each with its own role. The [[mail user agent]] is ' +
        'what a person works with. It submits the message on port <b>587</b>; the [[mail submission agent]] applies the ' +
        'organisation\'s policy and by default refuses a session that has not logged in (530). Then the [[mail transfer ' +
        'agent]] carries the message <b>one hop</b>, over SMTP to port <b>25</b>: it finds the next server in the MX ' +
        'record of the recipient\'s domain, the lowest preference first (equal ones: either). At the end the [[mail ' +
        'delivery agent]] moves responsibility into the [[mailbox]], from where the client fetches it.</p>' +
        '<p>A message has two layers. The [[envelope]], MAIL FROM and RCPT TO, travels as SMTP commands and the routing ' +
        'uses it; the letter, header (From:, To:, Subject:) and body, travels as data. They are two pieces of data that ' +
        'need not match. A [[=relay]] does not change the message except for adding a Received: line on top, and ' +
        'delivery writes Return-Path from the envelope.</p>' +
        '<p>Fetching is never SMTP. <b>IMAP</b> (143, or 993 with implicit TLS) keeps messages and their state in ' +
        'the [[message store]] on the server, so every device sees the same. <b>POP3</b> (110, or 995) usually downloads ' +
        'and deletes the mail, so a second device does not see it. Encrypting the connection comes in two forms, ' +
        'STARTTLS on the same port and implicit TLS on a port of its own; they are not shown here.</p>' +
        '<p>Sources: Uvod u Linux, chapter 20; Uvod u računalne mreže, chapter 14 (example 4); RFC 5598, 5321, 6409, ' +
        '9051 and 1939.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
