/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of aaa-8021x, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms missing
   from kit/glossary.js are written out this way, English term then the Croatian in parentheses (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). Message names (EAP-Request, Access-Accept, DHCPDISCOVER),
   attribute names, the identity ana@fakultet, VLAN and UDP numbers are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Laptop, preklopnik i RADIUS poslužitelj: poruke 802.1X prijave, stanje priključka i korak AAA svake poruke',

      // lanes
      sta: 'Laptop',
      staRole: '*supplicant* (klijent)',
      sw: 'Preklopnik',
      ap: 'Pristupna točka',
      swRole: 'autentikator',
      as: 'RADIUS poslužitelj',
      asRole: 'poslužitelj za autentikaciju',
      kId: 'identitet',
      kPass: 'lozinka',
      kCert: 'certifikat',
      credOk: 'ispravna',
      credWrong: 'pogrešna',
      certOk: 'valjan',
      certWrong: 'nevaljan',
      kPort: 'priključak',
      portClosed: 'zatvoren: samo EAPOL',
      portOpen: 'otvoren',
      kSecret: 'lozinke',
      swNoSecret: 'ne zna nijednu',
      kUser: 'korisnik',
      userRule: '→ djelatnici, VLAN {vlan}',
      kUdp: 'UDP',
      udpRule: '{auth} pristup, {acct} evidencija',
      asDown: 'ne radi',

      // chart
      aaaTitle: 'Korak AAA',
      chartEmpty: 'Još ništa nije poslano.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteLinkUp: 'veza uspostavljena; priključak neovlašten',
      noteAssociated: 'pridružen; priključak neovlašten',
      notePortUp: 'priključak ovlašten, VLAN {vlan}',
      noteNoReply: 'nema odgovora: priključak ostaje zatvoren',
      timerWait: 'čeka odgovor',
      causeRetry: 'ponovno',
      reDropped: 'odbačeno: priključak zatvoren',
      rePasses: 'prolazi u VLAN {vlan}',
      reOk: 'dokaz ispravan',
      reWrongPass: 'pogrešna lozinka',
      reWrongCert: 'certifikat nevaljan',

      // round contents (the EAP inside, shown beside the message name)
      r_identity: 'identitet',
      r_peapStart: 'početak PEAP-a',
      r_tlsStart: 'početak EAP-TLS-a',
      r_tlsHello: 'TLS pozdrav',
      r_serverCert: 'certifikat poslužitelja',
      r_keyFinished: 'razmjena ključa',
      r_innerChallenge: 'TLS gotov; u tunelu: izazov',
      r_innerProof: 'u tunelu: dokaz lozinke',
      r_innerResult: 'u tunelu: rezultat',
      r_serverCertReq: 'certifikat, traži laptopov',
      r_clientCert: 'certifikat i dokaz',
      r_serverFinished: 'TLS gotov',
      r_ack: 'potvrda',
      fVlan: 'VLAN {vlan}',
      fHandshake: 'PMK → ključevi sesije',

      // AAA column and strip
      aI: 'identifikacija',
      aA1: 'autentikacija',
      aA2: 'nadzor pristupa',
      aA3: 'revizija',
      stripAaa: 'AAA',
      stripAaaLong: '*Authentication, Authorization, Accounting*',
      sI: 'tvrdi tko je',
      sA1: 'dokazuje to',
      sA2: 'što smije',
      sA3: 'tko i kada',
      stWait: 'još ne',
      stDone: 'korak {n}',
      stFailed: 'ne prolazi, korak {n}',
      stDenied: 'odbijeno, korak {n}',
      stNever: 'nema sesije',
      stNoServer: 'nema odgovora',

      // params
      medium: 'Medij',
      mWired: 'kabel',
      mWifi: 'Wi-Fi',
      credentials: 'Podaci za prijavu',
      cCorrect: 'ispravni',
      cWrong: 'pogrešni',
      server: 'RADIUS poslužitelj radi',
      serverHint: 'Isključeno: poslužitelj ne odgovara na zahtjeve.',
      method: 'Metoda EAP',

      // presets
      presetBook: 'Prijava na kabel',
      presetBookHint: 'Ispravna prijava: Access-Accept, VLAN 20, DHCP prolazi, evidencija počinje.',
      presetReject: 'Pogrešna lozinka',
      presetRejectHint: 'Access-Reject i EAP-Failure: priključak ostaje zatvoren.',
      presetDown: 'Poslužitelj ne radi',
      presetDownHint: 'Zahtjevi ostaju bez odgovora: priključak ostaje zatvoren.',
      presetWifi: 'Poslovni Wi-Fi',
      presetWifiHint: 'Isti EAP; zatim PMK i rukovanje u četiri koraka otvaraju priključak.',

      // legend
      legEapol: 'EAPOL',
      legRadius: 'RADIUS',
      legOther: 'ostali promet (DHCP)',
      legDropped: 'odbačeno na priključku',
      legGate: 'priključak zatvoren / otvoren',
      legBadge: 'korak AAA',
      legChanged: 'promijenjeno u ovom koraku',

      // captions
      capStart: 'Laptop se spaja na mrežu fakulteta. Pritisnite → i pratite svaku poruku i stanje priključka.',
      capLink: 'Kabel je utaknut i veza je gore, ali priključak je *unauthorized* (neovlašten): propušta samo EAPOL okvire.',
      capAssociated: 'Laptop se pridružio pristupnoj točki, ali njegov priključak je *unauthorized* (neovlašten): propušta samo EAPOL okvire.',
      capDhcpDrop: 'Laptop odmah traži adresu (DHCP). Priključak to odbacuje: nije EAPOL, a priključak je zatvoren.',
      capDhcpAgain: 'Laptop opet traži adresu. Priključak i dalje odbacuje sve osim EAPOL-a.',
      capReqId: 'Preklopnik (*authenticator*, autentikator) pita tko je na priključku: EAP-Request/Identity u EAPOL okviru, koji zatvoren priključak propušta.',
      capReqIdAp: 'Pristupna točka (*authenticator*, autentikator) pita tko je na priključku: EAP-Request/Identity u EAPOL okviru, koji zatvoren priključak propušta.',
      capRespId: 'Laptop (*supplicant*) odgovara identitetom {user}. To je identifikacija: tvrdnja tko je, još bez dokaza.',
      capAccessReq: '{who} ne zna lozinku: EAP poruku samo prepakira u RADIUS Access-Request.',
      capAccessReqCert: '{who} ne provjerava certifikat: EAP poruku samo prepakira u RADIUS Access-Request.',
      whoSw: 'Preklopnik',
      whoAp: 'Pristupna točka',
      capAccessReqTail: 'Ide poslužitelju na UDP {udp}.',
      capAccessReqLost: 'Poslužitelj ne radi i zahtjev ostaje bez odgovora.',
      capRetry: 'Još nema odgovora, pa autentikator ponavlja Access-Request.',
      capTimeout: 'I dalje ništa. Autentikator prestaje čekati: nitko nije odlučio, pa priključak ostaje zatvoren. Nema ni Access-Rejecta.',
      capRound: 'Krug {r} od {of}: poslužitelj pita (Access-Challenge), autentikator to prenosi laptopu kao EAP-Request, a odgovor se vraća istim putem.',
      capRound_peap1: 'Poslužitelj bira PEAP; laptop započinje TLS.',
      capRound_peap2: 'Poslužitelj šalje svoj certifikat, laptop ga provjerava i šalje svoj dio razmjene ključa.',
      capRound_peap3: 'Poslužitelj završava TLS i tunel stoji; kroz njega traži dokaz lozinke, a laptop ga šalje.',
      capRound_peap4: 'Poslužitelj javlja da je unutarnja provjera prošla, laptop potvrđuje.',
      capRound_tls1: 'Poslužitelj bira EAP-TLS; laptop započinje TLS.',
      capRound_tls2: 'Poslužitelj šalje svoj certifikat i traži laptopov; laptop šalje certifikat i dokaz da ima njegov ključ.',
      capRound_tls3: 'TLS je gotov, laptop potvrđuje.',
      capCheckOk: 'Poslužitelj provjerava dokaz i on prolazi: to je autentikacija.',
      capCheckWrong: 'Poslužitelj provjerava dokaz i on ne prolazi.',
      capAccept: 'Access-Accept s EAP-Success: poslužitelj pušta korisnika u mrežu i šalje mu VLAN {vlan}. To je nadzor pristupa, korak odvojen od autentikacije.',
      capAcceptPmk: 'U istoj poruci, zaštićen, PMK za pristupnu točku.',
      capReject: 'Access-Reject s EAP-Failure: poslužitelj odbija. Odluka je poslužiteljeva, ne autentikatorova.',
      capSuccess: 'Autentikator javlja laptopu EAP-Success. Priključak je još zatvoren.',
      capFailure: 'EAP-Failure stiže laptopu. Priključak ostaje neovlašten.',
      capPortUp: 'Tek sada je priključak *authorized* (ovlašten), u VLAN-u {vlan}.',
      capHandshake: 'Laptop je PMK izveo iz EAP-a, pristupna točka ga je dobila u Access-Acceptu. Iz njega [[4-way handshake]] (EAPOL-Key) izvodi ključeve sesije; tek tada se priključak otvara, u VLAN-u {vlan}.',
      capDhcpPass: 'Access-Accept s VLAN-om {vlan}: tek sada priključak propušta DHCP.',
      capAcct: 'Autentikator javlja poslužitelju početak sesije (Accounting-Request Start, UDP {udp}). To je revizija: zapis tko se spojio i kada.',

      explain:
        '<p><strong>802.1X</strong> je nadzor pristupa po <em lang="en">portu</em>: priključak preklopnika (ili veza s pristupnom točkom) ' +
        'ne propušta ništa osim EAPOL okvira dok poslužitelj ne kaže da korisnik smije. Sudjeluju tri strane: ' +
        '<em lang="en">supplicant</em> (klijent, ovdje laptop), <em lang="en">authenticator</em> (autentikator: preklopnik ili pristupna točka) ' +
        'i poslužitelj za autentikaciju (RADIUS).</p>' +
        '<p><strong>Autentikator ne odlučuje.</strong> EAP poruke laptopa prepakira u RADIUS i šalje poslužitelju (UDP 1812), ' +
        'a odgovore poslužitelja vraća laptopu. Lozinku ne zna i ne vidi; odluku donosi poslužitelj, porukom Access-Accept ili Access-Reject.</p>' +
        '<p><strong>Četiri koraka.</strong> Identifikacija (identitet <span translate="no">ana@fakultet</span>), autentikacija (krugovi metode), ' +
        'nadzor pristupa (Access-Accept s VLAN-om: što ovaj korisnik smije) i revizija (Accounting Start, UDP 1813: zapis tko se spojio i kada). ' +
        'AAA (<em lang="en">Authentication, Authorization, Accounting</em>) imenuje posljednja tri; identifikacija im prethodi.</p>' +
        '<p><strong>Česte zablude.</strong> Preklopnik ne provjerava lozinku. Autentikacija i nadzor pristupa nisu isti korak: ' +
        'točna lozinka ne znači da korisnik smije sve. 802.1X na kabelu ne šifrira promet: odlučuje samo hoće li se priključak otvoriti.</p>' +
        '<p><strong>Wi-Fi.</strong> U poslovnom načinu isti EAP daje PMK, a rukovanje u četiri koraka iz njega izvodi ključeve i otvara priključak. ' +
        'U osobnom načinu nema poslužitelja: PMK se izvodi iz zajedničke lozinke.</p>' +
        '<p><strong>Izostavljeno:</strong> unutrašnjost metoda EAP (TLS u PEAP-u), prijava po MAC adresi, šifriranje na kabelu, ' +
        'samo rukovanje u četiri koraka.</p>'
    },

    en: {
      stage: 'Laptop, switch and RADIUS server: the messages of an 802.1X login, the state of the port and the AAA step of each message',

      // lanes
      sta: 'Laptop',
      staRole: 'supplicant',
      sw: 'Switch',
      ap: 'Access point',
      swRole: 'authenticator',
      as: 'RADIUS server',
      asRole: 'authentication server',
      kId: 'identity',
      kPass: 'password',
      kCert: 'certificate',
      credOk: 'correct',
      credWrong: 'wrong',
      certOk: 'valid',
      certWrong: 'not valid',
      kPort: 'port',
      portClosed: 'closed: EAPOL only',
      portOpen: 'open',
      kSecret: 'passwords',
      swNoSecret: 'knows none',
      kUser: 'user',
      userRule: '→ staff, VLAN {vlan}',
      kUdp: 'UDP',
      udpRule: '{auth} access, {acct} accounting',
      asDown: 'down',

      // chart
      aaaTitle: 'AAA step',
      chartEmpty: 'Nothing sent yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteLinkUp: 'link up; port unauthorized',
      noteAssociated: 'associated; port unauthorized',
      notePortUp: 'port authorized, VLAN {vlan}',
      noteNoReply: 'no reply: the port stays closed',
      timerWait: 'waiting for a reply',
      causeRetry: 'retry',
      reDropped: 'dropped: port closed',
      rePasses: 'passes into VLAN {vlan}',
      reOk: 'proof correct',
      reWrongPass: 'wrong password',
      reWrongCert: 'certificate not valid',

      // round contents
      r_identity: 'identity',
      r_peapStart: 'PEAP start',
      r_tlsStart: 'EAP-TLS start',
      r_tlsHello: 'TLS hello',
      r_serverCert: 'server certificate',
      r_keyFinished: 'key exchange',
      r_innerChallenge: 'TLS done; in the tunnel: challenge',
      r_innerProof: 'in the tunnel: password proof',
      r_innerResult: 'in the tunnel: result',
      r_serverCertReq: 'certificate, asks for the laptop’s',
      r_clientCert: 'certificate and proof',
      r_serverFinished: 'TLS finished',
      r_ack: 'acknowledgement',
      fVlan: 'VLAN {vlan}',
      fHandshake: 'PMK → session keys',

      // AAA column and strip
      aI: 'identification',
      aA1: 'authentication',
      aA2: 'access control',
      aA3: 'audit',
      stripAaa: 'AAA',
      stripAaaLong: 'Authentication, Authorization, Accounting',
      sI: 'claims who it is',
      sA1: 'proves it',
      sA2: 'what it may do',
      sA3: 'who and when',
      stWait: 'not yet',
      stDone: 'step {n}',
      stFailed: 'fails, step {n}',
      stDenied: 'denied, step {n}',
      stNever: 'no session',
      stNoServer: 'no answer',

      // params
      medium: 'Medium',
      mWired: 'cable',
      mWifi: 'Wi-Fi',
      credentials: 'Login details',
      cCorrect: 'correct',
      cWrong: 'wrong',
      server: 'RADIUS server up',
      serverHint: 'Off: the server does not answer any request.',
      method: 'EAP method',

      // presets
      presetBook: 'Login on a cable',
      presetBookHint: 'A correct login: Access-Accept, VLAN 20, DHCP passes, accounting starts.',
      presetReject: 'Wrong password',
      presetRejectHint: 'Access-Reject and EAP-Failure: the port stays closed.',
      presetDown: 'Server down',
      presetDownHint: 'The requests get no answer: the port stays closed.',
      presetWifi: 'Enterprise Wi-Fi',
      presetWifiHint: 'The same EAP; then the PMK and the 4-way handshake open the port.',

      // legend
      legEapol: 'EAPOL',
      legRadius: 'RADIUS',
      legOther: 'other traffic (DHCP)',
      legDropped: 'dropped at the port',
      legGate: 'port closed / open',
      legBadge: 'AAA step',
      legChanged: 'changed in this step',

      // captions
      capStart: 'A laptop connects to the faculty network. Press → and follow every message and the state of the port.',
      capLink: 'The cable is in and the link is up, but the port is unauthorized: it passes EAPOL frames only.',
      capAssociated: 'The laptop has associated with the access point, but its port is unauthorized: it passes EAPOL frames only.',
      capDhcpDrop: 'The laptop asks for an address straight away (DHCP). The port drops it: it is not EAPOL, and the port is closed.',
      capDhcpAgain: 'The laptop asks for an address again. The port still drops everything but EAPOL.',
      capReqId: 'The switch (the authenticator) asks who is on the port: EAP-Request/Identity in an EAPOL frame, which the closed port lets through.',
      capReqIdAp: 'The access point (the authenticator) asks who is on the port: EAP-Request/Identity in an EAPOL frame, which the closed port lets through.',
      capRespId: 'The laptop (the supplicant) answers with the identity {user}. That is identification: a claim of who it is, with no proof yet.',
      capAccessReq: '{who} does not know the password: it just repacks the EAP message into a RADIUS Access-Request.',
      capAccessReqCert: '{who} does not check the certificate: it just repacks the EAP message into a RADIUS Access-Request.',
      whoSw: 'The switch',
      whoAp: 'The access point',
      capAccessReqTail: 'It goes to the server on UDP {udp}.',
      capAccessReqLost: 'The server is down and the request gets no answer.',
      capRetry: 'Still no answer, so the authenticator sends the Access-Request again.',
      capTimeout: 'Still nothing. The authenticator stops waiting: nobody decided, so the port stays closed. There is no Access-Reject either.',
      capRound: 'Round {r} of {of}: the server asks (Access-Challenge), the authenticator passes it to the laptop as an EAP-Request, and the answer comes back the same way.',
      capRound_peap1: 'The server picks PEAP; the laptop starts TLS.',
      capRound_peap2: 'The server sends its certificate, the laptop checks it and sends its part of the key exchange.',
      capRound_peap3: 'The server finishes TLS and the tunnel is up; through it the server asks for proof of the password, and the laptop sends it.',
      capRound_peap4: 'The server reports that the inner check passed; the laptop acknowledges.',
      capRound_tls1: 'The server picks EAP-TLS; the laptop starts TLS.',
      capRound_tls2: 'The server sends its certificate and asks for the laptop’s; the laptop sends its certificate and proof that it holds its key.',
      capRound_tls3: 'TLS is finished; the laptop acknowledges.',
      capCheckOk: 'The server checks the proof and it holds: that is authentication.',
      capCheckWrong: 'The server checks the proof and it fails.',
      capAccept: 'Access-Accept with EAP-Success: the server lets the user in and sends VLAN {vlan}. That is access control, a step apart from authentication.',
      capAcceptPmk: 'In the same message, protected, the PMK for the access point.',
      capReject: 'Access-Reject with EAP-Failure: the server says no. The decision is the server’s, not the authenticator’s.',
      capSuccess: 'The authenticator tells the laptop EAP-Success. The port is still closed.',
      capFailure: 'EAP-Failure reaches the laptop. The port stays unauthorized.',
      capPortUp: 'Only now is the port authorized, in VLAN {vlan}.',
      capHandshake: 'The laptop derived the PMK from EAP, the access point got it in the Access-Accept. From it the [[4-way handshake]] (EAPOL-Key) derives the session keys; only then does the port open, in VLAN {vlan}.',
      capDhcpPass: 'Access-Accept with VLAN {vlan}: only now does the port let DHCP through.',
      capAcct: 'The authenticator tells the server that the session starts (Accounting-Request Start, UDP {udp}). That is audit: a record of who connected and when.',

      explain:
        '<p><strong>802.1X</strong> is port-based access control: a switch port (or the link to an access point) passes nothing ' +
        'but EAPOL frames until the server says the user may connect. Three parties take part: the supplicant (here the laptop), ' +
        'the authenticator (the switch or access point) and the authentication server (RADIUS).</p>' +
        '<p><strong>The authenticator does not decide.</strong> It repacks the laptop’s EAP messages into RADIUS for the server (UDP 1812) ' +
        'and passes the server’s answers back. It neither knows nor sees the password; the server decides, with Access-Accept or Access-Reject.</p>' +
        '<p><strong>Four steps.</strong> Identification (the identity <span translate="no">ana@fakultet</span>), authentication (the method rounds), ' +
        'access control (Access-Accept with a VLAN: what this user may reach) and audit (Accounting Start, UDP 1813: a record of who connected and when). ' +
        'AAA (Authentication, Authorization, Accounting) names the last three; identification comes before them.</p>' +
        '<p><strong>Common mistakes.</strong> The switch does not check the password. Authentication and access control are not one step: ' +
        'a correct password does not mean the user may reach everything. 802.1X on a cable does not encrypt the traffic: it only decides whether the port opens.</p>' +
        '<p><strong>Wi-Fi.</strong> In enterprise mode the same EAP yields the PMK, and the 4-way handshake derives the keys from it and opens the port. ' +
        'In personal mode there is no server: the PMK comes from the shared password.</p>' +
        '<p><strong>Left out:</strong> the inside of the EAP methods (TLS in PEAP), login by MAC address, encryption on the cable, ' +
        'the 4-way handshake itself.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
