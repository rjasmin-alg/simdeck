/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ssh-key-auth, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Host names, fingerprints, file names, method names and what the client prints are data: the page puts them in
   placeholders with translate="no". The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'SSH spajanje: ključ poslužitelja i autentikacija korisnika',

      laneClient: 'Klijent',
      laneServer: 'Poslužitelj',
      cliRole: 'korisnik {user}',
      srvRole: 'SSH poslužitelj, port 22',
      waitsHost: 'čeka odgovor: yes ili no?',
      waitsPassword: 'čeka lozinku',

      q1: '1. Je li ovo pravi poslužitelj?',
      q2: '2. Tko je korisnik?',
      qIdle: 'još ne',
      qNow: 'sada',
      qAsk: 'pita korisnika',
      qKnown: 'poznat, isti ključ',
      qStored: 'prihvaćen i spremljen',
      qRefused: 'ključ se promijenio: odbijeno',
      qDeclined: 'korisnik je odbio (no)',
      qNever: 'nije ni postavljeno',
      qKey: 'ključem',
      qPassword: 'lozinkom',
      qDenied: 'odbijen',

      boxClient: 'Klijent {host}',
      boxServer: 'Poslužitelj {host}',
      khTitle: '{file}: poznati poslužitelji',
      khEmpty: 'prazno: nijedan poslužitelj još nije poznat',
      khRemoved: 'uklonjeno',
      colLine: 'redak',
      colHost: 'poslužitelj',
      colType: 'vrsta',
      colFp: 'otisak ključa',
      kpTitle: 'Par ključeva korisnika',
      kpNone: 'nema (nije napravljen)',
      kpPriv: 'privatni: ostaje na ovom stroju',
      kpPub: 'javni',
      hkTitle: 'Ključ poslužitelja',
      hkOob: 'ovaj otisak administrator javlja drugim putem',
      akTitle: '{file}: dopušteni ključevi korisnika {user}',
      akEmpty: 'prazno: nijedan ključ',
      pwTitle: 'prijava lozinkom',
      termTitle: 'Terminal na klijentu',
      termEmpty: 'Još ništa nije upisano.',

      rowKex: 'TCP {port}, razmjena ključeva',
            rowSig: '+ potpis',
      rowNone: 'koje metode?',
      rowPw: 'lozinka, otvoreni tekst',
      rowNoPw: 'bez password',
      rowInstall: 'samo javni dio',
      rowInstallDup: 'već je ondje',
      rowInstallRefused: 'nema ulaza',
      noteKnown: 'isti kao redak {line}',
      noteUnknown: 'nepoznat: pitaj',
      noteMismatch: 'drukčiji od retka {line}: odbij',
      noteYes: 'yes: spremi',
      noteNo: 'no: kraj',
      noteSession: 'sjednica',
      noteDenied: 'Permission denied',
      noteReinstall: 'ponovno instaliran: novi ključ',
      noteKeygen: 'napravljen par ključeva',
      noteForget: ['uklonjen {n} redak', 'uklonjena {n} retka', 'uklonjeno {n} redaka'],
      noteForgetNone: 'nema retka za ukloniti',
      chartEmpty: 'Nijedna poruka još. Pritisni → za prvi korak.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],

      answer: 'Odgovor na pitanje',
      offer: 'Klijent nudi',
      offerAny: 'ključ, pa lozinku',
      offerPassword: 'samo lozinku',
      btnConnect: 'Spoji se',
      btnReinstall: 'Reinstaliraj',
      btnKey: 'Ključ korisnika',
      btnPw: 'Lozinka da/ne',
      btnForget: 'Ukloni redak',

      presetFirst: 'Prvo spajanje',
      presetFirstHint: 'known_hosts je prazan: klijent pita',
      presetSecond: 'Drugo spajanje',
      presetSecondHint: 'Ključ je poznat: bez pitanja',
      presetChanged: 'Ključ poslužitelja promijenjen',
      presetChangedHint: 'Poslužitelj je ponovno instaliran',
      presetKey: 'Prijava ključem',
      presetKeyHint: 'Par ključeva, pa bez lozinke',
      presetPwOff: 'Lozinka isključena',
      presetPwOffHint: 'Ključem prolazi, samo lozinkom ne',

      legSrvFp: 'otisak ključa poslužitelja',
      legUsrFp: 'otisak ključa korisnika',
      legLock: 'šifrirano',
      legPrompt: 'klijent pita korisnika',
      legChanged: 'upisano u ovom koraku',

      capStartFirst: 'Klijent se još nikad nije spojio na {host}: {file} je prazan. Korisnik nema par ključeva, a poslužitelj dopušta lozinku. Pritisni → za spajanje.',
      capStartSecond: 'Ključ poslužitelja {fp} već je spremljen u {file} nakon prvog spajanja. Pritisni → za drugo spajanje.',
      capStartChanged: 'Poslužitelj {host} ponovno je instaliran i ima novi ključ {fp}; klijent još pamti stari {old}. Pritisni → za spajanje.',
      capStartKey: 'Poslužitelj je poznat, ali korisnik se prijavljuje lozinkom: para ključeva još nema. Pritisni → da ga napraviš.',
      capStartPwOff: 'Ključ korisnika {fp} je u {file}, a poslužitelj je isključio prijavu lozinkom ({pw}). Dva pokušaja: jedan mora proći, jedan pasti.',
      capKex: 'Spajanje {n}: TCP na port 22 i razmjena ključeva. Poslužitelj pokazuje svoj ključ {fp} i potpisuje razmjenu privatnim dijelom tog ključa. Počinje pitanje 1.',
      capKexPw: 'Spajanje {n}, i klijent ovaj put ne smije upotrijebiti svoj ključ: ostaje mu samo lozinka. TCP na port 22 i razmjena ključeva, poslužitelj pokazuje {fp}.',
      capKnown: 'Otisak {fp} isti je kao u retku {line} datoteke {file}: to je poslužitelj od prošlog puta. Pitanje 1 riješeno je bez pitanja korisniku.',
      capUnknown: 'Prvo spajanje: klijent ključ poslužitelja ne poznaje i pokazuje njegov otisak {fp}. Odgovor yes bez usporedbe isključuje zaštitu od aktivnog posrednika.',
      capUnknownAgain: 'Stari redak je uklonjen, pa je ključ opet nepoznat: klijent pita kao pri prvom spajanju. Usporedi otisak {fp} s onim koji je javio administrator.',
      capMismatch: 'Poslužitelj pokazuje ključ {fp}, a u retku {line} spremljen je {old}. Klijent upozorava da se identitet poslužitelja promijenio i odbija vezu, bez pitanja: s ove strane ponovna instalacija i aktivni posrednik izgledaju jednako.',
      capYes: 'yes: ključ {fp} upisan je u redak {line} datoteke {file} ([[trust on first use]]). Od sada klijent uspoređuje sam. Pitanje 1 je riješeno; slijedi pitanje 2.',
      capNo: 'no: klijent ništa ne sprema i prekida vezu (Host key verification failed). Do pitanja 2 nije ni došlo.',
      capAuthKey: 'Pitanje 2: klijent šalje javni ključ {fp} i potpis napravljen privatnim ključem. Poslužitelj ga nalazi u {file} i prihvaća: sjednica je otvorena, bez lozinke. Privatni ključ nije prešao mrežu.',
      capAuthKeyFailPw: 'Ključ {fp} nije u {file}: failure. Poslužitelj u popisu i dalje navodi password, pa klijent pita korisnika za lozinku.',
      capAuthNonePw: 'Pitanje 2: klijent nema ključ koji bi ponudio, pa pita koje metode poslužitelj prihvaća. U popisu je password: klijent traži lozinku od korisnika.',
      capAuthRefusePw: 'Pitanje 2: klijent ovaj put ne nudi svoj ključ, pa pita koje metode poslužitelj prihvaća. U popisu je password: klijent traži lozinku od korisnika.',
      capAuthDeniedNoKey: 'PasswordAuthentication no, a korisnik nema ključ: u popisu metoda nema password ({list}). Permission denied: bez ključa više nitko ne ulazi. Zato ključ mora raditi prije nego što se lozinka isključi.',
      capAuthDenied: 'PasswordAuthentication no: u popisu metoda nema password ({list}), a ključ klijent ne nudi: Permission denied. Taj neuspjeh dokazuje da otvrdnjavanje radi.',
      capAuthDeniedKey: 'Ključ {fp} nije u {file}, a password nije u popisu ({list}): Permission denied.',
      capPassword: 'Lozinka pri svakoj prijavi putuje mrežom kao otvoreni tekst unutar šifriranog paketa; štiti je samo prijenosni sloj. Poslužitelj je prihvaća: sjednica je otvorena, ispis {out}.',
      capReinstall: 'Poslužitelj je ponovno instaliran i dobio je novi ključ {fp} (prije {old}). Klijenti i dalje pamte stari.',
      capKeygen: 'Na klijentu je napravljen par ključeva: id_ed25519 (privatni, ostaje ovdje) i id_ed25519.pub (javni). Njegov otisak {fp} pripada korisniku, a ne poslužitelju ({host}).',
      capInstall: 'Javni dio ključa {fp} dodan je u {file} na poslužitelju. Samo javni dio: privatni ostaje na klijentu.',
      capInstallDup: 'Ključ {fp} već je u {file}: ništa nije dodano.',
      capInstallRefused: 'Javni dio ključa {fp} ne može na poslužitelj: za kopiranje treba prijava, a bez ključa u {file} to je prijava lozinkom, koja je isključena. Pred tim zaključavanjem knjiga upozorava.',
      capPwOff: 'Poslužitelj je isključio prijavu lozinkom (PasswordAuthentication no). Ključ korisnika mora raditi prije toga, inače nitko više ne ulazi.',
      capPwOn: 'Prijava lozinkom ponovno je uključena (PasswordAuthentication yes).',
      capForget: 'Novi otisak {fp} potvrđen je s administratorom drugim putem, pa je stari redak uklonjen iz {file}. Iduće spajanje opet pita.',
      capForgetSame: 'Redak je uklonjen iz {file}, iako se ključ poslužitelja nije promijenio. Iduće spajanje opet pita, i otisak {fp} treba opet usporediti.',
      capForgetNone: 'U {file} nema retka za ovaj poslužitelj: nema što ukloniti.',
      capMore: 'Gumbi dodaju korake (S, N, K, P, D).',
      capFull: 'Demonstracija je puna: R počinje ispočetka.',

      explain: '<p>Svako SSH spajanje odgovara na <strong>dva pitanja, dvama različitim ključevima</strong>. Prvo: je li ovo pravi poslužitelj? ' +
        'Pri razmjeni ključeva poslužitelj pokazuje svoj [[host key]], a klijent ga uspoređuje s ' +
        'datotekom <code translate="no">~/.ssh/known_hosts</code>. Da bi to mogao, mora ga <em>unaprijed</em> poznavati. ' +
        'Drugo: tko je korisnik? To rješava [[user authentication]], ključem ili lozinkom.</p>' +
        '<p><strong>Prvo spajanje.</strong> Ključ još nije spremljen, pa klijent pokazuje njegov [[key fingerprint]] i pita. ' +
        'Nakon <code>yes</code> ključ je spremljen i idući put klijent ne pita. Pri prvom spajanju taj je odgovor jedina ' +
        'provjera poslužitelja: <code>yes</code> bez usporedbe s otiskom dobivenim drugim putem čuva samo od pasivnog prisluškivanja, ' +
        'ne od [[man in the middle]]. Kad se spremljeni ključ i pokazani razlikuju, klijent ne pita nego odbija.</p>' +
        '<p><strong>Ključ ili lozinka.</strong> Na klijentu nastaje [[key pair]]; [[public key]] ide u <code translate="no">authorized_keys</code> ' +
        'na poslužitelju, a [[private key]] ne prelazi mrežu nikad: klijent njime samo potpisuje. Lozinka mrežu prelazi pri svakoj prijavi, ' +
        'kao otvoreni tekst unutar paketa koji šifrira prijenosni sloj. Specifikacija za <code>publickey</code> kaže REQUIRED, za ' +
        '<code>password</code> SHOULD. Kad ključ dokazano radi, prijava lozinkom može se isključiti: to je [[hardening]].</p>' +
        '<p><strong>Dva otiska.</strong> <code translate="no">SHA256:a8FjBS…</code> je otisak ključa <em>poslužitelja</em>, ' +
        '<code translate="no">SHA256:ACblrD…</code> otisak ključa <em>korisnika</em>. Dva para ključeva, dvije uloge.</p>' +
        '<p>Gumbi dodaju korake na kraj: S spoji (s izborom „Klijent nudi”), N ponovno instalira poslužitelj, K napravi i postavi ključ, ' +
        'P uključuje i isključuje lozinku, D uklanja stari redak iz <code translate="no">known_hosts</code>.</p>'
    },
    en: {
      stage: 'An SSH connection: the host key and user authentication',

      laneClient: 'Client',
      laneServer: 'Server',
      cliRole: 'user {user}',
      srvRole: 'SSH server, port 22',
      waitsHost: 'waits for the answer: yes or no?',
      waitsPassword: 'waits for the password',

      q1: '1. Is this the right server?',
      q2: '2. Who is the user?',
      qIdle: 'not yet',
      qNow: 'now',
      qAsk: 'asking the user',
      qKnown: 'known, same key',
      qStored: 'accepted and stored',
      qRefused: 'key changed: refused',
      qDeclined: 'declined (no)',
      qNever: 'never asked',
      qKey: 'by key',
      qPassword: 'by password',
      qDenied: 'denied',

      boxClient: 'Client {host}',
      boxServer: 'Server {host}',
      khTitle: '{file}: known servers',
      khEmpty: 'empty: no server known yet',
      khRemoved: 'removed',
      colLine: 'line',
      colHost: 'server',
      colType: 'type',
      colFp: 'key fingerprint',
      kpTitle: 'The user\'s key pair',
      kpNone: 'none (not made)',
      kpPriv: 'private: stays on this machine',
      kpPub: 'public',
      hkTitle: 'Host key',
      hkOob: 'the admin tells you this fingerprint another way',
      akTitle: '{file}: keys allowed for {user}',
      akEmpty: 'empty: no key',
      pwTitle: 'password login',
      termTitle: 'Terminal on the client',
      termEmpty: 'Nothing typed yet.',

      rowKex: 'TCP {port}, key exchange',
            rowSig: '+ signature',
      rowNone: 'which methods?',
      rowPw: 'the password, plain text',
      rowNoPw: 'no password',
      rowInstall: 'public half only',
      rowInstallDup: 'already there',
      rowInstallRefused: 'no way in',
      noteKnown: 'same as line {line}',
      noteUnknown: 'unknown: ask',
      noteMismatch: 'differs from line {line}: refuse',
      noteYes: 'yes: store',
      noteNo: 'no: end',
      noteSession: 'session',
      noteDenied: 'Permission denied',
      noteReinstall: 'reinstalled: new key',
      noteKeygen: 'key pair made',
      noteForget: ['{n} line removed', '{n} lines removed'],
      noteForgetNone: 'no line to remove',
      chartEmpty: 'No messages yet. Press → for the first step.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      answer: 'Answer to the question',
      offer: 'The client offers',
      offerAny: 'key, then password',
      offerPassword: 'password only',
      btnConnect: 'Connect',
      btnReinstall: 'Reinstall',
      btnKey: 'User key',
      btnPw: 'Password on/off',
      btnForget: 'Remove line',

      presetFirst: 'First connection',
      presetFirstHint: 'known_hosts is empty: the client asks',
      presetSecond: 'Second connection',
      presetSecondHint: 'The key is known: no question',
      presetChanged: 'Host key changed',
      presetChangedHint: 'The server was reinstalled',
      presetKey: 'Key login',
      presetKeyHint: 'A key pair, then no password',
      presetPwOff: 'Password off',
      presetPwOffHint: 'The key gets in, password only does not',

      legSrvFp: 'host key fingerprint',
      legUsrFp: 'user key fingerprint',
      legLock: 'encrypted',
      legPrompt: 'the client asks the user',
      legChanged: 'written in this step',

      capStartFirst: 'The client has never connected to {host}: {file} is empty. The user has no key pair, and the server allows passwords. Press → to connect.',
      capStartSecond: 'The host key {fp} was stored in {file} at the first connection. Press → for the second connection.',
      capStartChanged: 'The server {host} was reinstalled and has a new key {fp}; the client still remembers the old {old}. Press → to connect.',
      capStartKey: 'The server is known, but the user logs in with a password: there is no key pair yet. Press → to make one.',
      capStartPwOff: 'The user\'s key {fp} is in {file}, and the server has turned password login off ({pw}). Two attempts: one must get in, one must fail.',
      capKex: 'Connection {n}: TCP to port 22 and the key exchange. The server presents its key {fp} and signs the exchange with its private half. Question 1 begins.',
      capKexPw: 'Connection {n}, and this time the client may not use its key: only the password is left. TCP to port 22 and the key exchange; the server presents {fp}.',
      capKnown: 'The fingerprint {fp} is the same as line {line} of {file}: this is the server from last time. Question 1 is settled without asking the user.',
      capUnknown: 'First connection: the client does not know the server\'s key and shows its fingerprint {fp}. Answering yes without comparing switches off the protection against an active man in the middle.',
      capUnknownAgain: 'The old line is gone, so the key is unknown again: the client asks as on a first connection. Compare the fingerprint {fp} with the one the admin gave you.',
      capMismatch: 'The server presents the key {fp}, but line {line} holds {old}. The client warns that the server\'s identification has changed and refuses to connect, without a question: from here a reinstall and an active man in the middle look the same.',
      capYes: 'yes: the key {fp} is written to line {line} of {file} ([[trust on first use]]). From now on the client compares by itself. Question 1 is settled; question 2 follows.',
      capNo: 'no: the client stores nothing and ends the connection (Host key verification failed). Question 2 never comes.',
      capAuthKey: 'Question 2: the client sends the public key {fp} and a signature made with the private key. The server finds it in {file} and accepts: the session opens, no password. The private key never crossed the network.',
      capAuthKeyFailPw: 'The key {fp} is not in {file}: failure. The server still lists password, so the client asks the user for it.',
      capAuthNonePw: 'Question 2: the client has no key to offer, so it asks which methods the server accepts. password is in the list: the client asks the user for the password.',
      capAuthRefusePw: 'Question 2: this time the client does not offer its key, so it asks which methods the server accepts. password is in the list: the client asks the user for the password.',
      capAuthDeniedNoKey: 'PasswordAuthentication no, and the user has no key: password is not in the list of methods ({list}). Permission denied: without a key nobody gets in any more. That is why the key must work before the password is turned off.',
      capAuthDenied: 'PasswordAuthentication no: password is not in the list of methods ({list}), and the client does not offer its key: Permission denied. This failure proves the hardening works.',
      capAuthDeniedKey: 'The key {fp} is not in {file}, and password is not in the list ({list}): Permission denied.',
      capPassword: 'At every login the password crosses the network as plain text inside an encrypted packet; only the transport layer protects it. The server accepts it: the session opens and prints {out}.',
      capReinstall: 'The server was reinstalled and got a new key {fp} (before: {old}). Clients still remember the old one.',
      capKeygen: 'A key pair is made on the client: id_ed25519 (private, stays here) and id_ed25519.pub (public). Its fingerprint {fp} belongs to the user, not to the server ({host}).',
      capInstall: 'The public half of the key {fp} is added to {file} on the server. Only the public half: the private one stays on the client.',
      capInstallDup: 'The key {fp} is already in {file}: nothing is added.',
      capInstallRefused: 'The public half of the key {fp} cannot reach the server: copying it needs a login, and with no key in {file} that is a password login, which is off. This is the lockout the book warns about.',
      capPwOff: 'The server turns password login off (PasswordAuthentication no). The user\'s key must work before this, or nobody gets in any more.',
      capPwOn: 'Password login is on again (PasswordAuthentication yes).',
      capForget: 'The new fingerprint {fp} was confirmed with the admin another way, so the old line is removed from {file}. The next connection asks again.',
      capForgetSame: 'The line is removed from {file} although the server\'s key did not change. The next connection asks again, and the fingerprint {fp} has to be compared again.',
      capForgetNone: '{file} has no line for this server: nothing to remove.',
      capMore: 'The buttons add steps (S, N, K, P, D).',
      capFull: 'The demo is full: R starts again.',

      explain: '<p>Every SSH connection answers <strong>two questions, with two different keys</strong>. First: is this the right server? ' +
        'During the key exchange the server presents its [[host key]], and the client compares it with the file ' +
        '<code translate="no">~/.ssh/known_hosts</code>. To do that it must know the key <em>in advance</em>. ' +
        'Second: who is the user? That is [[user authentication]], by key or by password.</p>' +
        '<p><strong>First connection.</strong> The key is not stored yet, so the client shows its [[key fingerprint]] and asks. ' +
        'After <code>yes</code> the key is stored and the client does not ask again. At the first connection that answer is the only ' +
        'check of the server: <code>yes</code> without comparing with a fingerprint obtained another way protects against passive ' +
        'eavesdropping only, not against an active [[man in the middle]]. When the stored key and the presented one differ, the client does not ask: it refuses.</p>' +
        '<p><strong>Key or password.</strong> The [[key pair]] is made on the client; the [[public key]] goes into ' +
        '<code translate="no">authorized_keys</code> on the server, and the [[private key]] never crosses the network: the client only signs with it. ' +
        'A password crosses the network at every login, as plain text inside a packet the transport layer encrypts. The specification ' +
        'says REQUIRED for <code>publickey</code> and SHOULD for <code>password</code>. Once the key is proven to work, password login ' +
        'can be turned off: that is [[hardening]].</p>' +
        '<p><strong>Two fingerprints.</strong> <code translate="no">SHA256:a8FjBS…</code> is the fingerprint of the <em>server\'s</em> key, ' +
        '<code translate="no">SHA256:ACblrD…</code> that of the <em>user\'s</em> key. Two key pairs, two roles.</p>' +
        '<p>The buttons add steps at the end: S connects (with the choice "The client offers"), N reinstalls the server, K makes and ' +
        'installs the key, P turns passwords on and off, D removes the old line from <code translate="no">known_hosts</code>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
