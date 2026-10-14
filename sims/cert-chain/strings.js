/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cert-chain, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Subjects, file names, dates, host names, the client's messages and the alert names are data, put in by the page.
   Croatian terms follow UL ch21: certifikat, lanac povjerenja, spremište povjerenja, sidro povjerenja, tijelo za
   izdavanje certifikata, samopotpisan certifikat, rok valjanosti, upozorenje TLS-a, izlazni status. "Posrednički
   certifikat" (intermediate) and "krajnji certifikat" (leaf, the book's "certifikat krajnjeg entiteta") are not in the
   glossary yet (NOTES.md, Term pairs). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lanac povjerenja i klijentova provjera',

      // controls
      https443Open: 'Vatrozid propušta 443',
      serverCert: 'Poslužitelj šalje',
      certSelf: 'iz paketa (localhost.crt)',
      certLab: 'od lab. tijela (www1.crt)',
      certExpired: 'istekao (www1-istekao.crt)',
      certPublic: 'od javnog CA-a, preko posrednika',
      sendIntermediate: '… i posrednika',
      anchorInStore: 'Lab. tijelo u spremištu',
      clockOffsetDays: 'Klijentov sat odstupa',
      days: ['{n} dan', '{n} dana', '{n} dana'],
      advanceDay: 'Sat klijenta +1 dan',
      offOnlyPublic: 'Posrednika ima samo lanac javnog CA-a.',
      offPublicRoot: 'Javni korijen već je u spremištu.',
      offStoryPublic: 'Ovaj slijed koristi javni CA.',
      offBookCert: 'Certifikat mijenja slijed iz knjige.',

      // presets
      presetBook: 'Jedna naredba, pet stanja',
      presetBookHint: 'Izlazni statusi 7, 60, 60, 0, 60',
      presetIntermediate: 'Nedostaje posrednički certifikat',
      presetIntermediateHint: 'Poslužitelj šalje samo krajnji certifikat',
      presetClocks: 'Satovi isteka',
      presetClocksHint: 'Na dan 2026-11-02: *.quillmoor.example ističe za 17 dana',
      presetWrongClock: 'Krivi sat klijenta',
      presetWrongClockHint: 'Na poslužitelju se ništa ne mijenja',
      presetBuild: 'Složi sam',
      presetBuildHint: 'Jedno stanje: mijenjaj postavke',

      // legend
      legendLeaf: 'krajnji',
      legendIntermediate: 'posrednički',
      legendSelf: 'samopotpisan',
      legendAnchor: 'sidro u spremištu',
      legendChanged: 'promijenjeno',

      // stage
      server: 'Poslužitelj',
      client: 'Klijent',
      sends: 'šalje',
      store: 'Spremište povjerenja',
      storeNote: 'drži klijent, dodaje se mimo veze',
      portOpen: 'port 443 otvoren',
      portClosed: 'port 443 zatvoren',
      roleLeaf: 'krajnji',
      roleIntermediate: 'posrednički',
      roleAnchor: 'sidro',
      roleSelf: 'samopotpisan',
      issuer: 'izdavatelj',
      selfIssuer: 'izdavatelj = subjekt',
      signedBy: 'potpisao',
      daysLeft: ['još {n} dan', 'još {n} dana', 'još {n} dana'],
      lastDay: 'zadnji dan',
      expiredAgo: ['istekao prije {n} dana', 'istekao prije {n} dana', 'istekao prije {n} dana'],
      notYet: ['vrijedi tek za {n} dan', 'vrijedi tek za {n} dana', 'vrijedi tek za {n} dana'],
      ghost: 'nije poslan, nije u spremištu',
      found: 'nađen',
      clientClock: 'sat klijenta',
      trueDate: 'stvarni datum {d}, sat odstupa {o}',
      state: 'Stanje',
      stateOf: 'Stanje {i} od {n}',
      checks: 'Provjere',
      notYetRun: 'Klijent još nije pokrenuo zahtjev.',
      checkConnect: 'Veza na port 443',
      checkIssuerSent: '{cn}: izdavatelj među poslanima, potpis vrijedi',
      checkIssuerStore: '{cn}: izdavatelj u spremištu, potpis vrijedi',
      checkSelf: '{cn}: samopotpisan, nije u spremištu',
      checkUnknown: '{cn}: izdavatelja nema ni među poslanima ni u spremištu',
      checkBadSig: '{cn}: potpis ne odgovara ključu izdavatelja',
      checkValid: '{cn}: vrijedi na datum klijenta',
      checkExpired: '{cn}: istekao na datum klijenta',
      checkNotYet: '{cn}: na datum klijenta još ne vrijedi',
      checkAnchor: '{cn}: sidro u spremištu, vrijedi',
      checkAnchorBad: '{cn}: sidro u spremištu, ali ne vrijedi',
      exitStatus: 'izlazni status',
      message: 'poruka klijenta',
      alert: 'upozorenje TLS-a',
      noAlert: 'nema: razgovor nije ni počeo',
      okPage: 'stiže stranica',
      fixServer: 'popravak: na poslužitelju',
      fixClient: 'popravak: na klijentu',
      endpointsShare: ['{n} krajnja točka', '{n} krajnje točke', '{n} krajnjih točaka'],

      // captions
      capStart: '{state}: {desc} Klijent u svakom stanju šalje isti zahtjev. Pritisni →.',
      capStartOne: 'Klijent šalje zahtjev na {host}. Pritisni → za prvu provjeru.',
      descSelf: 'poslužitelj šalje certifikat koji je stigao s paketom, potpisan paketovim vlastitim samopotpisanim tijelom',
      descLab: 'poslužitelj šalje www1.crt, koji je potpisalo lab. tijelo',
      descExpired: 'poslužitelj šalje www1-istekao.crt',
      descPublic: 'poslužitelj šalje certifikat koji je potpisao posrednik javnog CA-a',
      descPublicInt: 'poslužitelj šalje certifikat i posrednički certifikat javnog CA-a',
      descClosed: 'vatrozid ne propušta port 443',
      descAnchor: 'lab. tijelo je u klijentovu spremištu',
      descNoAnchor: 'u klijentovu spremištu je samo korijen javnog CA-a',
      evOpenFirewall: 'Vatrozid sada propušta HTTPS.',
      evLabCert: 'Poslužitelj sada šalje www1.crt, koji je potpisalo lab. tijelo.',
      evAddAnchor: 'Certifikat lab. tijela dodan je u klijentovo spremište povjerenja, mimo veze koja se provjerava.',
      evExpiredCert: 'Poslužitelj sada šalje www1-istekao.crt.',
      evSendIntermediate: 'Poslužitelj sada šalje i posrednički certifikat.',
      evNoChange: '(Tako je već bilo.)',
      capConnectOk: 'Klijent se spaja na port 443 i prima lanac: {certs}.',
      certsN: ['{n} certifikat', '{n} certifikata', '{n} certifikata'],
      capConnectFail: 'Nema veze: vatrozid ne propušta port 443. Izlazni status {exit} stiže prije ijednog certifikata i bez upozorenja TLS-a, jer razgovor nije ni počeo. Popravak je na poslužitelju (vatrozid).',
      capIssuerSent: '{cn} upućuje na izdavatelja {issuer}; klijent ga nalazi među certifikatima koje je poslužitelj poslao i njegovim javnim ključem provjerava potpis.',
      capIssuerStore: '{cn} upućuje na izdavatelja {issuer}; klijent ga nalazi u svojem spremištu povjerenja i njegovim javnim ključem provjerava potpis.',
      capSelf: '{cn} je samopotpisan: subjekt i izdavatelj su isti, pa jamči samo sam za sebe. Klijent ga nema u spremištu i odbija vezu (izlazni status {exit}, upozorenje {alert}).',
      capSelfFixServer: 'Popravak je na poslužitelju: neka šalje certifikat koji je potpisalo tijelo za izdavanje certifikata kojemu klijenti vjeruju.',
      capSelfFixClient: 'Popravak je na klijentu: tom korijenu treba vjerovati u spremištu.',
      capUnknownClient: 'Lanac vodi do izdavatelja {issuer}, ali njega nema u klijentovu spremištu povjerenja: klijent odbija vezu (izdavatelj nepoznat, upozorenje {alert}). Popravak je na klijentu.',
      capUnknownServer: 'Lanac vodi do izdavatelja {issuer}, ali poslužitelj ga nije poslao, a klijentovo spremište drži samo korijene: klijent odbija vezu (izdavatelj nepoznat, upozorenje {alert}). Popravak je na poslužitelju: neka šalje i posrednički certifikat.',
      capBadSig: 'Potpis na {cn} ne odgovara javnom ključu izdavatelja {issuer}: klijent odbija vezu (upozorenje {alert}).',
      capValid: '{cn} vrijedi na klijentov datum {date}: rok valjanosti {from} … {to}, {left}.',
      capExpired: '{cn}: notAfter {to} je prije klijentova datuma {date}, certifikat je istekao (izlazni status {exit}, upozorenje {alert}).',
      capNotYet: '{cn} vrijedi tek od {from}, a klijentov je datum {date}: certifikat još ne vrijedi (izlazni status {exit}, upozorenje {alert}).',
      capDateFixServer: 'Ključ i potpis su ispravni; isteklo je obećanje. Popravak je na poslužitelju: obnoviti certifikat.',
      capDateFixClient: 'Na poslužitelju se ništa nije promijenilo; sat klijenta odstupa {o}. Popravak je na klijentu: namjestiti sat.',
      capAnchor: '{cn} je u klijentovu spremištu, dakle sidro povjerenja: staza tu završava. Izlazni status {exit}, stiže stranica.',
      capAnchorBad: '{cn} je sidro u klijentovu spremištu, ali na klijentov datum {date} ne vrijedi (izlazni status {exit}, upozorenje {alert}).',
      capClocksStart: 'Pregled od 2026-11-01, stanje na {date}: {list} Pritisni → za sljedeći datum.',
      capClocksStep: '{date}: {list}',
      clkLeft: '{cn} vrijedi još {left}.',
      clkLast: '{cn} vrijedi zadnji dan (pregled ne daje sat).',
      clkExpired: ['{cn} je istekao: {n} krajnja točka koja ga dijeli javlja izlazni status {exit} ({alert}).', '{cn} je istekao: sve {n} krajnje točke koje ga dijele javljaju izlazni status {exit} ({alert}).', '{cn} je istekao: svih {n} krajnjih točaka koje ga dijele javlja izlazni status {exit} ({alert}).'],
      clkExpiredOne: '{cn} je istekao: {host} javlja izlazni status {exit} ({alert}).',
      clkNotYet: ['{cn} još ne vrijedi: {n} krajnja točka koja ga dijeli javlja izlazni status {exit} ({alert}).', '{cn} još ne vrijedi: sve {n} krajnje točke koje ga dijele javljaju izlazni status {exit} ({alert}).', '{cn} još ne vrijedi: svih {n} krajnjih točaka koje ga dijele javlja izlazni status {exit} ({alert}).'],
      clkNotYetOne: '{cn} još ne vrijedi: {host} javlja izlazni status {exit} ({alert}).',
      clkDays: ['{n} dan', '{n} dana', '{n} dana'],

      explain: '<p>[[certificate]] je potpisana tvrdnja da javni ključ pripada subjektu. Poslužitelj šalje svoj certifikat i, ' +
        'ako ga nije potpisao korijen, posredničke certifikate (<em lang="en">intermediate</em>); klijent od svakoga traži ' +
        'izdavatelja, provjerava potpis i datum, i ide prema gore. Tako nastaje [[certificate chain]].</p>' +
        '<p>Klijent drži svoj [[trust store]] i lanac mora završiti u njemu: [[trust anchor]] vrijedi zato što je do klijenta stigao mimo veze, ' +
        'a ne zato što je potpisan. [[self-signed certificate]] jamči samo sam za sebe. Spremište obično drži samo korijene, ' +
        'pa posrednički certifikat mora poslati poslužitelj.</p>' +
        '<p>Svaki certifikat ima [[validity period]], i on se mjeri <b>satom klijenta</b>. Istekao certifikat nije pokvarena ' +
        'matematika: isteklo je jamstvo koje [[certificate authority]] daje uz njega. Krivi sat sam može izazvati ili sakriti kvar.</p>' +
        '<p>Tri različita kvara daju isti [[exit status]] 60; tek poruka (ili [[TLS alert]] <span translate="no">unknown_ca</span>, ' +
        '<span translate="no">certificate_expired</span>) kaže koji je. Status 7 znači da veze nije ni bilo. I popravak nije ' +
        'uvijek na poslužitelju: nepoznat korijen i krivi sat popravljaju se na klijentu.</p>'
    },
    en: {
      stage: 'Certificate chain and the client\'s check',

      https443Open: 'Firewall lets 443 in',
      serverCert: 'Server sends',
      certSelf: 'from the package (localhost.crt)',
      certLab: 'by the lab CA (www1.crt)',
      certExpired: 'expired (www1-istekao.crt)',
      certPublic: 'by a public CA, via an intermediate',
      sendIntermediate: '… and the intermediate',
      anchorInStore: 'Lab CA in the store',
      clockOffsetDays: 'Client clock off by',
      days: ['{n} day', '{n} days'],
      advanceDay: 'Client clock +1 day',
      offOnlyPublic: 'Only the public CA has an intermediate.',
      offPublicRoot: 'The public root is already in the store.',
      offStoryPublic: 'This sequence uses the public CA.',
      offBookCert: 'The book\'s sequence sets the certificate.',

      presetBook: 'One command, five states',
      presetBookHint: 'Exit statuses 7, 60, 60, 0, 60',
      presetIntermediate: 'Missing intermediate',
      presetIntermediateHint: 'The server sends only the leaf',
      presetClocks: 'Expiry clocks',
      presetClocksHint: 'On 2026-11-02: *.quillmoor.example expires in 17 days',
      presetWrongClock: 'Wrong client clock',
      presetWrongClockHint: 'Nothing changes on the server',
      presetBuild: 'Build your own',
      presetBuildHint: 'One state: change the settings',

      legendLeaf: 'leaf',
      legendIntermediate: 'intermediate',
      legendSelf: 'self-signed',
      legendAnchor: 'anchor in the store',
      legendChanged: 'changed',

      server: 'Server',
      client: 'Client',
      sends: 'sends',
      store: 'Trust store',
      storeNote: 'held by the client, added out of band',
      portOpen: 'port 443 open',
      portClosed: 'port 443 closed',
      roleLeaf: 'leaf',
      roleIntermediate: 'intermediate',
      roleAnchor: 'anchor',
      roleSelf: 'self-signed',
      issuer: 'issuer',
      selfIssuer: 'issuer = subject',
      signedBy: 'signed by',
      daysLeft: ['{n} day left', '{n} days left'],
      lastDay: 'last day',
      expiredAgo: ['expired {n} day ago', 'expired {n} days ago'],
      notYet: ['valid in {n} day', 'valid in {n} days'],
      ghost: 'not sent, not in the store',
      found: 'found',
      clientClock: 'client clock',
      trueDate: 'true date {d}, clock off by {o}',
      state: 'State',
      stateOf: 'State {i} of {n}',
      checks: 'Checks',
      notYetRun: 'The client has not sent its request yet.',
      checkConnect: 'Connect to port 443',
      checkIssuerSent: '{cn}: issuer among those sent, signature verifies',
      checkIssuerStore: '{cn}: issuer in the store, signature verifies',
      checkSelf: '{cn}: self-signed, not in the store',
      checkUnknown: '{cn}: issuer neither sent nor in the store',
      checkBadSig: '{cn}: signature does not match the issuer\'s key',
      checkValid: '{cn}: valid at the client\'s date',
      checkExpired: '{cn}: expired at the client\'s date',
      checkNotYet: '{cn}: not yet valid at the client\'s date',
      checkAnchor: '{cn}: anchor in the store, valid',
      checkAnchorBad: '{cn}: anchor in the store, but not valid',
      exitStatus: 'exit status',
      message: 'client\'s message',
      alert: 'TLS alert',
      noAlert: 'none: the conversation never started',
      okPage: 'the page arrives',
      fixServer: 'fix: on the server',
      fixClient: 'fix: on the client',
      endpointsShare: ['{n} endpoint', '{n} endpoints'],

      capStart: '{state}: {desc} In every state the client sends the same request. Press →.',
      capStartOne: 'The client sends a request to {host}. Press → for the first check.',
      descSelf: 'the server sends the certificate that came with the package, signed by the package\'s own self-signed CA',
      descLab: 'the server sends www1.crt, signed by the lab CA',
      descExpired: 'the server sends www1-istekao.crt',
      descPublic: 'the server sends a certificate signed by a public CA\'s intermediate',
      descPublicInt: 'the server sends its certificate and the public CA\'s intermediate',
      descClosed: 'the firewall does not let port 443 in',
      descAnchor: 'the lab CA is in the client\'s store',
      descNoAnchor: 'the client\'s store holds only the public CA\'s root',
      evOpenFirewall: 'The firewall now lets HTTPS in.',
      evLabCert: 'The server now sends www1.crt, signed by the lab CA.',
      evAddAnchor: 'The lab CA\'s certificate has been added to the client\'s trust store, outside the connection being checked.',
      evExpiredCert: 'The server now sends www1-istekao.crt.',
      evSendIntermediate: 'The server now sends the intermediate too.',
      evNoChange: '(It already was so.)',
      capConnectOk: 'The client connects to port 443 and receives the chain: {certs}.',
      certsN: ['{n} certificate', '{n} certificates'],
      capConnectFail: 'No connection: the firewall does not let port 443 in. Exit status {exit} comes before any certificate and with no TLS alert, because the conversation never started. The fix is on the server (the firewall).',
      capIssuerSent: '{cn} points to the issuer {issuer}; the client finds it among the certificates the server sent and verifies the signature with its public key.',
      capIssuerStore: '{cn} points to the issuer {issuer}; the client finds it in its own trust store and verifies the signature with its public key.',
      capSelf: '{cn} is self-signed: subject and issuer are the same, so it vouches only for itself. The client does not hold it in its store and rejects the connection (exit status {exit}, alert {alert}).',
      capSelfFixServer: 'The fix is on the server: send a certificate signed by a certificate authority that clients trust.',
      capSelfFixClient: 'The fix is on the client: that root must be trusted in its store.',
      capUnknownClient: 'The chain leads to the issuer {issuer}, but it is not in the client\'s trust store: the client rejects the connection (unknown issuer, alert {alert}). The fix is on the client.',
      capUnknownServer: 'The chain leads to the issuer {issuer}, but the server did not send it and the client\'s store holds only roots: the client rejects the connection (unknown issuer, alert {alert}). The fix is on the server: send the intermediate too.',
      capBadSig: 'The signature on {cn} does not match the public key of the issuer {issuer}: the client rejects the connection (alert {alert}).',
      capValid: '{cn} is valid at the client\'s date {date}: validity period {from} … {to}, {left}.',
      capExpired: '{cn}: notAfter {to} is before the client\'s date {date}, so the certificate has expired (exit status {exit}, alert {alert}).',
      capNotYet: '{cn} is valid only from {from}, and the client\'s date is {date}: the certificate is not yet valid (exit status {exit}, alert {alert}).',
      capDateFixServer: 'Key and signature are sound; the promise has expired. The fix is on the server: renew the certificate.',
      capDateFixClient: 'Nothing changed on the server; the client\'s clock is off by {o}. The fix is on the client: set the clock.',
      capAnchor: '{cn} is in the client\'s store, so it is a trust anchor: the path ends here. Exit status {exit}, the page arrives.',
      capAnchorBad: '{cn} is an anchor in the client\'s store, but it is not valid at the client\'s date {date} (exit status {exit}, alert {alert}).',
      capClocksStart: 'Scan of 2026-11-01, status on {date}: {list} Press → for the next date.',
      capClocksStep: '{date}: {list}',
      clkLeft: '{cn} has {left} left.',
      clkLast: '{cn} is on its last day (the scan gives no time of day).',
      clkExpired: ['{cn} has expired: the {n} endpoint that shares it reports exit status {exit} ({alert}).', '{cn} has expired: all {n} endpoints that share it report exit status {exit} ({alert}).'],
      clkExpiredOne: '{cn} has expired: {host} reports exit status {exit} ({alert}).',
      clkNotYet: ['{cn} is not yet valid: the {n} endpoint that shares it reports exit status {exit} ({alert}).', '{cn} is not yet valid: all {n} endpoints that share it report exit status {exit} ({alert}).'],
      clkNotYetOne: '{cn} is not yet valid: {host} reports exit status {exit} ({alert}).',
      clkDays: ['{n} day', '{n} days'],

      explain: '<p>A [[certificate]] is a signed statement that a public key belongs to a subject. The server sends its ' +
        'certificate and, unless a root signed it, the intermediates; for each one the client finds the issuer, checks ' +
        'the signature and the date, and moves up. That is the [[certificate chain]].</p>' +
        '<p>The chain must end in the client\'s [[trust store]]: a [[trust anchor]] counts because it reached the client ' +
        'outside the connection, not because it is signed. A [[self-signed certificate]] vouches only for itself. The ' +
        'store usually holds only roots, so the server must send the intermediate.</p>' +
        '<p>Every certificate has a [[validity period]], and it is measured by <b>the client\'s clock</b>. An expired ' +
        'certificate is not broken mathematics: the promise the [[certificate authority]] made with it has expired. A ' +
        'wrong clock alone can cause or hide the fault.</p>' +
        '<p>Three different faults give the same [[exit status]] 60; only the message (or the [[TLS alert]] ' +
        '<span translate="no">unknown_ca</span>, <span translate="no">certificate_expired</span>) says which. Status 7 means ' +
        'there was no connection at all. And the fix is not always on the server: an unknown root and a wrong clock are ' +
        'fixed on the client.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
