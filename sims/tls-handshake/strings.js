/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tls-handshake, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a glossary term
   (first mention; [[=term]] later ones). *word* in a caption is an English term in italics (the page turns it into
   <em lang="en">). Message names, host names, cipher suites and error texts are data, put in by the page.
   Croatian terms follow the books: rukovanje, certifikat, upozorenje TLS-a, kriptografska politika sustava (UL ch21);
   šifrarnik (UL ch21); vrijeme kruženja (URM ch13); razmjena ključeva (task). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva rukovanja jedno uz drugo: TLS 1.2 i TLS 1.3',
      rttMs: 'Vrijeme kruženja (RTT)',
      rttFmt: '{v} ms',
      clientOffers: 'Klijent nudi',
      clientOffersHint: 'Je li 1.1 dopušten, odlučuje kriptografska politika sustava na klijentu.',
      offModern: '1.2 i 1.3',
      offOldOk: 'samo 1.1, dopušteno',
      offOldNo: 'samo 1.1, zabranjeno',
      attackerView: 'Što čita promatrač',
      attackerViewHint: 'Pasivni promatrač na putu: vidi sve što putuje nešifrirano.',
      suites: 'Dogovoreni šifrarnik',
      suitesHint: 'Šifrarnik koji ServerHello izabere, kao u knjizi.',
      suitesOff: 'Samo kad klijent nudi 1.2 i 1.3.',

      presetSide: 'Usporedno',
      presetSideHint: 'RTT 50 ms. Kad koji klijent smije poslati prvi bajt podataka? Tko vidi certifikat?',
      presetBook: 'Šifrarnici iz knjige',
      presetBookHint: 'Isti koraci, s dogovorenim šifrarnicima. Zašto u imenu za 1.3 nema razmjene ključeva?',
      presetLocal: 'Stari TLS: na klijentu',
      presetLocalHint: 'Klijent traži TLS 1.1, a politika mu ga ne dopušta. Je li poslužitelj išta odbio?',
      presetAlert: 'Stari TLS: upozorenje 70',
      presetAlertHint: 'Klijent smije ponuditi TLS 1.1. Što odgovara poslužitelj?',

      legPlain: 'čitljivo na mreži',
      legLock: 'šifrirano',
      legKey: 'strana ima ključeve',
      legTcp: 'TCP',
      legChanged: 'novo u ovom koraku',

      client: 'Klijent',
      server: 'Poslužitelj',
      markC: 'K',
      markS: 'P',
      keysYes: 'ključevi',
      keysNone: 'bez ključeva',
      appData: 'aplikacijski podaci',
      colOld: 'Klijent nudi samo TLS 1.1',
      eveTitle: 'promatrač čita',
      chartEmpty: 'Još ništa nije poslano.',
      earlier: ['↑ još {n} redak iznad', '↑ još {n} retka iznad', '↑ još {n} redaka iznad'],
      noteLocal: 'nema što ponuditi',

      sName: 'ime',
      sVersions: 'inačice',
      sSuites: 'šifrarnici',
      sVersion: 'inačica',
      sSuite: 'šifrarnik',
      sCert: 'certifikat',
      sShare: 'javni dio ključa',
      sCcs: 'prelazak na šifriranje',
      sEnc: 'šifrirano',
      sNothing: 'ništa: nije poslano',

      ctrElapsed: 'Zadnji let stiže',
      ctrElapsedVal: '{rtt} RTT · {ms} ms',
      ctrFirst: 'Prvi bajt podataka',
      ctrFirstVal: '{ms} ms = TCP 1 + TLS {k} = {n} RTT',
      ctrFirstNot: 'još ne',
      ctrWaiting: 'gotovo, čeka TLS 1.2',
      ctrSuite: 'Šifrarnik',
      obsTitle: 'Promatrač je pročitao',
      obsNothing: 'ništa',
      oName: 'ime poslužitelja',
      oOffered: 'ponuđene inačice i šifrarnike',
      oChosen: 'izabranu inačicu i šifrarnik',
      oCert: 'certifikat',
      oCertHidden: 'certifikat ne: šifriran je',
      oShares: 'oba javna dijela ključa',
      oShare: 'jedan javni dio ključa',
      oAlert: 'upozorenje',

      failTitle: 'Odakle dolazi pogreška?',
      failWants: 'Klijent želi',
      failPolicy: 'Politika klijenta',
      polAllows: 'dopušta 1.1',
      polForbids: 'ne dopušta 1.1',
      failServer: 'Poslužitelj prihvaća',
      failPending: 'još nema pogreške',
      failLocal: 'Na klijentu, lokalno: ništa nije poslano, poslužitelj nije ni pitan.',
      failRemote: 'S poslužitelja: upozorenje TLS-a, odgovor s druge strane veze.',

      cap0: 'Lijevo TLS 1.2, desno TLS 1.3: isti klijent, isti poslužitelj, isto vrijeme kruženja. Jedan korak je jedan let poruka, u oba stupca u isto vrijeme. Pritisni →.',
      cap1: 'Prvo TCP: SYN i SYN, ACK, jedan krug ({ms} ms). TLS ne zamjenjuje TCP nego stoji na njemu. Treći segment, ACK, odlazi zajedno s ClientHello i nije nacrtan.',
      cap2: 'ClientHello: ime poslužitelja, inačice i šifrarnici koje klijent nudi, sve čitljivo. TLS 1.3 odmah šalje i svoj dio razmjene ključeva (*key share*), pa poslužitelj već ima ključeve.',
      cap3: 'TLS 1.2: poslužitelj šalje ServerHello, certifikat i svoj dio razmjene ključeva, sve nešifrirano. TLS 1.3: već u drugom letu poslužitelj šalje svoj dio razmjene ključeva, a sve iza ServerHello, pa i certifikat, putuje šifrirano.',
      cap3Suites: 'ServerHello bira šifrarnik, čitljivo u oba stupca. 1.2: {s12} imenuje razmjenu ključeva (ECDHE) i potpis (RSA). 1.3: {s13} samo šifru i sažetak; razmjena je u *key share*, potpis se dogovara zasebno. Certifikat: u 1.2 čitljiv, u 1.3 šifriran.',
      cap4: 'TLS 1.2: klijent šalje svoj dio razmjene ključeva, prelazi na šifriranje i šalje šifrirani Finished. TLS 1.3: klijent šalje Finished i odmah za njim podatke, nakon jednog kruga TLS-a ({ms} ms od početka).',
      cap5: 'TLS 1.2: poslužitelj prelazi na šifriranje i šalje Finished. Tek sada klijent smije slati podatke. TLS 1.3 je gotov i čeka.',
      cap6: 'TLS 1.2: prvi bajt podataka nakon {ms12} ms, TCP 1 + TLS 2 = 3 RTT. TLS 1.3: {ms13} ms, 2 RTT. Jedan krug manje ({d} ms) pri svakom punom rukovanju.',
      capCert: 'Certifikat veže poslužiteljev javni ključ uz ime; da ima privatni ključ, poslužitelj dokazuje potpisom (ServerKeyExchange u 1.2, CertificateVerify u 1.3). Ključevi dolaze iz razmjene, ne iz certifikata.',
      capF0Local: 'Klijent želi samo TLS 1.1, ali mu kriptografska politika sustava to ne dopušta. Poslužitelj prihvaća TLS 1.2 i 1.3. Pritisni →.',
      capF0Alert: 'Klijent nudi samo TLS 1.1; ovdje mu politika to dopušta. Poslužitelj prihvaća samo TLS 1.2 i 1.3: 1.0 i 1.1 su zastarjeli. Pritisni →.',
      capFTcp: 'TCP veza se uspostavi normalno, jedan krug ({ms} ms). TLS još nije ništa poslao.',
      capLocal: 'Klijent priprema rukovanje i nema nijednu inačicu koju smije ponuditi: pogreška {err} nastaje na klijentu. Ništa nije poslano; o poslužitelju ova pogreška ne govori ništa.',
      capOldCh: 'ClientHello nudi samo TLS 1.1. Promatrač to čita: ponuđene inačice putuju nešifrirano.',
      capAlert: 'Poslužitelj odgovara upozorenjem {alert} i zatvara vezu (zatvaranje nije nacrtano). Ta pogreška dolazi s druge strane veze, sa svojim brojem: to je *TLS alert*, odgovor poslužitelja.',

      explain: '<p>[[handshake]] je početno pregovaranje klijenta i poslužitelja: dogovaraju inačicu i algoritme, ' +
        'poslužitelj dokazuje tko je, a obje strane dobiju zajedničke ključeve. Tek nakon njega putuju podaci, šifrirani. ' +
        'TLS pritom ne zamjenjuje TCP: traži pouzdan tok podataka u ispravnom redoslijedu, pa TCP veza dolazi prva, jedan krug.</p>' +
        '<p><strong>Ključevi dolaze iz razmjene, ne iz certifikata.</strong> U razmjeni ključeva (<i lang="en">key exchange</i>) ' +
        'svaka strana pošalje javni dio, a tajnu izračuna sama iz svojega privatnog dijela i tuđeg javnog; promatrač vidi oba javna dijela i ipak ne zna ključ. ' +
        '[[certificate]] veže poslužiteljev javni ključ uz ime <span translate="no">www1.lab.example</span>; da drži pripadni privatni ključ, ' +
        'poslužitelj dokazuje potpisom (ServerKeyExchange u 1.2, CertificateVerify u 1.3).</p>' +
        '<p><strong>Krugovi.</strong> U TLS-u 1.2 poslužitelj tek u drugom letu pošalje svoj dio razmjene, klijent svoj u trećem, ' +
        'i tek nakon poslužiteljeva Finished šalje podatke: dva kruga za TLS (<i lang="en">round-trip time</i>, vrijeme kruženja, RTT). ' +
        'U TLS-u 1.3 klijent svoj dio šalje već u ClientHello, pa je jedan krug dovoljan, a sve iza ServerHello, i certifikat, putuje šifrirano.</p>' +
        '<p><strong>Šifrarnik.</strong> <i lang="en">Cipher suite</i> (šifrarnik) u 1.2 imenuje i razmjenu ključeva i potpis ' +
        '(<span translate="no">ECDHE-RSA-…</span>); u 1.3 samo šifru i sažetak, jer razmjena ide u <i lang="en">key share</i>, ' +
        'a algoritam potpisa dogovara se zasebno.</p>' +
        '<p><strong>Stara inačica.</strong> TLS 1.0 i 1.1 ne smiju se upotrebljavati. Ako ih klijentu zabrani ' +
        '[[system-wide cryptographic policy]], pogreška nastaje na klijentu i ništa nije poslano. Ako ih smije ponuditi, ' +
        'poslužitelj odgovara porukom [[TLS alert]] broj 70: tek to je odgovor poslužitelja.</p>'
    },

    en: {
      stage: 'Two handshakes side by side: TLS 1.2 and TLS 1.3',
      rttMs: 'Round-trip time (RTT)',
      rttFmt: '{v} ms',
      clientOffers: 'Client offers',
      clientOffersHint: 'Whether 1.1 is allowed is up to the client’s system-wide cryptographic policy.',
      offModern: '1.2 and 1.3',
      offOldOk: '1.1 only, allowed',
      offOldNo: '1.1 only, forbidden',
      attackerView: 'What an eavesdropper reads',
      attackerViewHint: 'A passive eavesdropper on the path: it sees everything sent in clear.',
      suites: 'Negotiated cipher suite',
      suitesHint: 'The cipher suite ServerHello picks, as in the book.',
      suitesOff: 'Only when the client offers 1.2 and 1.3.',

      presetSide: 'Side by side',
      presetSideHint: 'RTT 50 ms. When may each client send its first data byte? Who sees the certificate?',
      presetBook: 'The book’s cipher suites',
      presetBookHint: 'The same steps, with the negotiated cipher suites. Why does the 1.3 name have no key exchange in it?',
      presetLocal: 'Old TLS: local error',
      presetLocalHint: 'The client asks for TLS 1.1 and its policy forbids it. Did the server refuse anything?',
      presetAlert: 'Old TLS: alert 70',
      presetAlertHint: 'The client may offer TLS 1.1. What does the server answer?',

      legPlain: 'readable on the wire',
      legLock: 'encrypted',
      legKey: 'side has the keys',
      legTcp: 'TCP',
      legChanged: 'new in this step',

      client: 'Client',
      server: 'Server',
      markC: 'C',
      markS: 'S',
      keysYes: 'keys',
      keysNone: 'no keys',
      appData: 'application data',
      colOld: 'The client offers only TLS 1.1',
      eveTitle: 'eavesdropper reads',
      chartEmpty: 'Nothing sent yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteLocal: 'nothing to offer',

      sName: 'name',
      sVersions: 'versions',
      sSuites: 'suites',
      sVersion: 'version',
      sSuite: 'suite',
      sCert: 'certificate',
      sShare: 'key share',
      sCcs: 'switch to encryption',
      sEnc: 'encrypted',
      sNothing: 'nothing: not sent',

      ctrElapsed: 'Last flight arrives',
      ctrElapsedVal: '{rtt} RTT · {ms} ms',
      ctrFirst: 'First data byte',
      ctrFirstVal: '{ms} ms = TCP 1 + TLS {k} = {n} RTT',
      ctrFirstNot: 'not yet',
      ctrWaiting: 'done, waiting for TLS 1.2',
      ctrSuite: 'Cipher suite',
      obsTitle: 'The eavesdropper has read',
      obsNothing: 'nothing',
      oName: 'server name',
      oOffered: 'offered versions and suites',
      oChosen: 'chosen version and suite',
      oCert: 'certificate',
      oCertHidden: 'not the certificate (encrypted)',
      oShares: 'both key shares',
      oShare: 'one key share',
      oAlert: 'alert',

      failTitle: 'Where is the error from?',
      failWants: 'Client wants',
      failPolicy: 'Client policy',
      polAllows: 'allows 1.1',
      polForbids: 'forbids 1.1',
      failServer: 'Server accepts',
      failPending: 'no error yet',
      failLocal: 'From the client, local: nothing was sent, the server was never asked.',
      failRemote: 'From the server: a TLS alert, an answer from the other end.',

      cap0: 'TLS 1.2 on the left, TLS 1.3 on the right: the same client, the same server, the same round-trip time. One step is one flight of messages, at the same time in both columns. Press →.',
      cap1: 'TCP first: SYN and SYN, ACK, one round trip ({ms} ms). TLS does not replace TCP; it runs on top of it. The third segment, ACK, leaves together with the ClientHello and is not drawn.',
      cap2: 'ClientHello: the server name and the versions and cipher suites the client offers, all readable. TLS 1.3 also sends its key share, its part of the key exchange, at once, so the server already has the keys.',
      cap3: 'TLS 1.2: the server sends ServerHello, its certificate and its part of the key exchange, all in clear. TLS 1.3: in the second flight the server already sends its key share, and everything after ServerHello, the certificate included, is encrypted.',
      cap3Suites: 'ServerHello picks the cipher suite, readable in both columns. 1.2: {s12} names the key exchange (ECDHE) and the signature (RSA). 1.3: {s13} only the cipher and the hash; the exchange is in the key share, the signature agreed separately. Certificate: readable in 1.2, encrypted in 1.3.',
      cap4: 'TLS 1.2: the client sends its part of the key exchange, switches to encryption and sends an encrypted Finished. TLS 1.3: the client sends Finished and its data right after it, after one round trip of TLS ({ms} ms from the start).',
      cap5: 'TLS 1.2: the server switches to encryption and sends Finished. Only now may the client send data. TLS 1.3 is done and waits.',
      cap6: 'TLS 1.2: the first data byte after {ms12} ms, TCP 1 + TLS 2 = 3 RTT. TLS 1.3: {ms13} ms, 2 RTT. One round trip less ({d} ms) on every full handshake.',
      capCert: 'The certificate binds the server’s public key to its name; the server proves it holds the private key by signing (ServerKeyExchange in 1.2, CertificateVerify in 1.3). The keys come from the exchange, not from the certificate.',
      capF0Local: 'The client wants TLS 1.1 only, but its system-wide cryptographic policy does not allow it. The server accepts TLS 1.2 and 1.3. Press →.',
      capF0Alert: 'The client offers TLS 1.1 only; here its policy allows that. The server accepts only TLS 1.2 and 1.3: 1.0 and 1.1 are deprecated. Press →.',
      capFTcp: 'The TCP connection is set up as usual, one round trip ({ms} ms). TLS has sent nothing yet.',
      capLocal: 'The client prepares the handshake and has no version it may offer: the error {err} happens on the client. Nothing was sent; this error says nothing about the server.',
      capOldCh: 'The ClientHello offers TLS 1.1 only. The eavesdropper reads it: the offered versions travel in clear.',
      capAlert: 'The server answers with the alert {alert} and closes the connection (not drawn). This error comes from the other end, with its number: a TLS alert, the server’s answer.',

      explain: '<p>The [[handshake]] is the first negotiation between client and server: they agree on the version and the ' +
        'algorithms, the server proves who it is, and both sides end up with shared keys. Only after it does data flow, ' +
        'encrypted. TLS does not replace TCP: it needs a reliable, ordered byte stream, so the TCP connection comes first, ' +
        'one round trip.</p>' +
        '<p><strong>The keys come from the exchange, not from the certificate.</strong> In the key exchange each side sends ' +
        'a public part and computes the secret itself from its own private part and the other side’s public part; the ' +
        'eavesdropper sees both public parts and still does not know the key. The [[certificate]] binds the server’s public ' +
        'key to the name <span translate="no">www1.lab.example</span>; the server proves it holds the matching private key by ' +
        'signing (ServerKeyExchange in 1.2, CertificateVerify in 1.3).</p>' +
        '<p><strong>Round trips.</strong> In TLS 1.2 the server sends its part of the exchange in the second flight, the ' +
        'client its own in the third, and the client sends data only after the server’s Finished: two round trips (RTT) of ' +
        'TLS. In TLS 1.3 the client sends its part in the ClientHello already, so one round trip is enough, and everything after ' +
        'ServerHello, the certificate too, is encrypted.</p>' +
        '<p><strong>Cipher suite.</strong> In 1.2 the cipher suite names both the key exchange and the signature ' +
        '(<span translate="no">ECDHE-RSA-…</span>); in 1.3 only the cipher and the hash, because the key exchange goes in ' +
        'the key share and the signature algorithm is agreed separately.</p>' +
        '<p><strong>An old version.</strong> TLS 1.0 and 1.1 must not be used. If the client’s ' +
        '[[system-wide cryptographic policy]] forbids them, the error happens on the client and nothing is sent. If the ' +
        'client may offer them, the server answers with [[TLS alert]] number 70: only that is the server’s answer.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
