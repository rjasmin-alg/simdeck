/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ntlm-vs-kerberos, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). None of the terms here is in
   kit/glossary.js yet, so the pairs are written out (NOTES.md, "Term pairs").
   Host names, account names, SPNs, message names, hashes and challenges are data: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kerberos i NTLM: poruke, ključevi i što napadač dobiva',

      // lanes
      lanePc: 'PC07',
      laneX: 'napadač',
      laneFs: 'FS01',
      laneDc: 'DC01',
      rolePc: 'ana je prijavljena',
      roleX: 'svoje računalo; admin na PC07',
      roleFs: 'datotečni poslužitelj',
      roleDc: 'KDC i kontroler domene',
      inMemory: 'u memoriji:',
      holds: 'ima:',
      nothing: 'ništa',
      ntHash: 'NT sažetak',
      tgt: 'TGT',
      keys: 'ključ:',
      fsNoHash: 'nema aninog sažetka',
      dcHashes: 'NT sažeci:',
      sameHash: 'isti',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      timeMemory: 'memorija',
      noteTheft: 'kopira anin NT sažetak iz memorije PC07',
      chipAccess: 'pristup',
      fAccess: 'pristup',
      fAsAna: 'kao ana',
      fDenied: 'odbijeno',
      fOk: 'OK + grupe',
      fPass: 'izazov + odgovor',
      eveObserver: 'promatrač vidi',
      eveAdmin: 'napadač ima',
      seenTicket: 'karta',
      seenAuth: 'autentifikator',
      seenKey: 'ključ sesije',
      seenFlags: 'samo mogućnosti',
      seenOffPath: 'nije na njegovu putu',
      seenGranted: 'pristup odobren',
      seenNothing: 'ništa za ponovnu uporabu',
      seenFromHash: 'odgovor iz sažetka',
      seenIn: 'unutra kao ana',
      seenResponse: 'odgovor',

      // panels
      panelActive: 'ovaj prolaz',
      panelOther: 'drugi protokol, do kraja',
      fsAsks: 'FS01 pita DC01',
      pcAsks: 'klijent pita DC01',
      times: '{v}×',
      kFs: 'kartu otvara svojim ključem FS01$',
      kPc: 'za kartu, prije FS01',
      nFs: 'pri svakoj prijavi (prosljeđivanje)',
      nPc: 'nikad; to radi FS01',
      wire: 's mreže napadač dobiva',
      memory: 'iz memorije PC07',
      kWire: 'karte zaključane ključevima koje nema: ništa za ponovnu uporabu',
      nWire: 'izazov + odgovor: samo pogađanje lozinke izvan mreže; slaba pada, jaka odolijeva',
      kMem: 'i ovdje je NT sažetak: vrijedi svugdje gdje se NTLM još prima',
      nMem: 'NT sažetak odgovara na svaki izazov kao ana',
      formula: 'odgovor',
      formulaText: 'HMAC-MD5(ključ iz NT sažetka, izazov ‖ blob)',
      formulaNone: 'još nije izračunat',

      // params
      target: 'Klijent otvara',
      optName: '\\\\fs01\\projects',
      optIp: '\\\\10.10.0.20\\projects',
      attacker: 'Napadač',
      attNone: 'nema',
      attObserver: 'promatrač u mreži klijenta',
      attAdmin: 'admin na PC07',
      targetFixed: 'Napadač se spaja po adresi, pa Negotiate bira NTLM.',

      // presets
      presetByName: 'Po imenu',
      presetByNameHint: 'Kerberos: karta, FS01 ne pita DC, 4 koraka',
      presetByIp: 'Po IP adresi',
      presetByIpHint: 'Nema SPN-a: NTLM s prosljeđivanjem na DC01, 6 koraka',
      presetCapture: 'Prisluškivanje',
      presetCaptureHint: 'Promatrač dobiva izazov i odgovor: samo pogađanje izvan mreže, 6 koraka',
      presetPth: 'Pass-the-hash',
      presetPthHint: 'Admin na PC07 uzima anin sažetak i ulazi bez lozinke, 7 koraka',

      // legend
      legendKerberos: 'Kerberos',
      legendNtlm: 'NTLM',
      legendPass: 'prosljeđivanje na DC',
      legendEye: 'napadač to ima',
      legendChanged: 'ovaj korak',

      // captions
      capStartKerb: '{unc}: ana je prijavljena na PC07 i od prijave ima TGT. Po imenu postoji *SPN* (ime principala usluge) {spn}, pa Negotiate bira Kerberos.',
      capStartNtlm: '{unc}: ana otvara mapu po adresi. Negotiate daje prednost Kerberosu, ali za adresu nema SPN-a, pa klijent kartu ni ne traži i uzima NTLM.',
      capStartAdmin: 'Napadač je administrator na PC07, gdje je ana prijavljena. Njezin NT *hash* (sažetak) je u memoriji, za NTLM prijavu bez ponovnog upisa lozinke.',
      capTheft: '{n}. Napadač kopira anin NT sažetak {hash} iz memorije PC07 na svoje računalo. Lozinku i dalje ne zna.',
      capTgsReq: '{n}. TGS-REQ: PC07 šalje anin TGT (zaključan ključem krbtgt) i traži od DC01 kartu za {spn}.',
      capTgsRep: '{n}. TGS-REP: DC01 vraća *ticket* (kartu) za uslugu zaključanu ključem FS01$. Otvoriti je mogu samo FS01 i DC.',
      capApReq: '{n}. AP-REQ: PC07 predaje FS01 kartu i svježi autentifikator.',
      capApRep: '{n}. FS01 otvara kartu svojim ključem i iz nje čita anine grupe: pristup, a DC01 nitko ništa ne pita.',
      capApRepObs: ' Promatrač je vidio samo zaključane karte; isti autentifikator FS01 ne prima dvaput.',
      capNegotiate: '{n}. NEGOTIATE: {who} nudi NTLM. Poruka navodi mogućnosti, bez tajne.',
      capChallenge: '{n}. Pristup po IP adresi nema SPN, pa Windows prelazi na NTLM: poslužitelj šalje *challenge* (izazov) od 8 bajtova: {ch}.',
      capChallengeX: '{n}. FS01 šalje svjež izazov od 8 bajtova, {ch}: svaka prijava dobiva novi.',
      capChallengeObs: ' Promatrač ga vidi.',
      capAuth: '{n}. AUTHENTICATE: PC07 računa odgovor iz aninog NT sažetka, izazova i svog bloba ({proof}). Ni lozinka ni sažetak ne idu mrežom.',
      capAuthX: '{n}. Napadač ima NT *hash* (sažetak) korisnice ana i njime računa odgovor — lozinka mu ne treba.',
      capAuthObs: ' Promatrač sada ima izazov i odgovor.',
      capPass: '{n}. FS01 nema aninog sažetka, pa korisnika, izazov i odgovor šalje DC01 (*pass-through*, prosljeđivanje provjere).',
      capReplyOk: '{n}. DC01 iz sažetka koji čuva za anu računa isti odgovor: podudara se. Vraća OK i anine grupe.',
      capReplyOkX: '{n}. DC01 iz sažetka koji čuva za anu računa isti odgovor: podudara se. DC ne može razlikovati napadača od ane.',
      capReplyBad: '{n}. DC01 računa drugi odgovor: ne podudara se, prijava je odbijena.',
      capAccess: '{n}. FS01 pušta anu u {unc}. Svaka NTLM prijava na FS01 ponovno pita DC01.',
      capAccessObs: '{n}. Pristup odobren. Promatrač ima izazov i odgovor: s njima može samo pogađati lozinku izvan mreže. Slaba lozinka pada, jaka odolijeva; ponoviti ih ne može, jer je sljedeći izazov drukčiji.',
      capAccessX: '{n}. Napadač je u {unc} kao ana, bez lozinke: *pass-the-hash* (napad prosljeđivanjem sažetka). Za NTLM onaj tko ima sažetak jest ana.',
      capDenied: '{n}. FS01 odbija pristup.',
      whoPc: 'PC07',
      whoX: 'napadačevo računalo',

      explain:
        '<p><b>Negotiate bira.</b> Windows daje prednost Kerberosu. Na NTLM prelazi kad klijent ne može dobiti kartu ' +
        'za uslugu: cilj je zadan IP adresom (za adresu Windows ne pokušava Kerberos, osim ako je uključen ' +
        '<span translate="no">TryIPSPN</span> i za adresu je registriran SPN), ime nije u domeni AD-a, nijedan DC nije ' +
        'dostupan ili je račun lokalni. NTLM zato nije nestao: domena ne znači da se uvijek koristi Kerberos.</p>' +
        '<p><b>Karta ili izazov.</b> Kod Kerberosa FS01 dobiva kartu zaključanu svojim ključem i sam je otvara; DC01 je ' +
        'pitan samo jednom, kad klijent traži kartu. Kod NTLM-a FS01 šalje 8 slučajnih bajtova, klijent vraća ' +
        '<span translate="no">HMAC-MD5</span> izazova i svog bloba ključem izvedenim iz NT sažetka (NTLMv2), a FS01, koji ' +
        'sažetak nema, pita DC01 pri svakoj prijavi.</p>' +
        '<p><b>Sažetak.</b> NT sažetak je <span translate="no">MD4</span> lozinke, bez soli: dva računa s istom lozinkom ' +
        'imaju isti sažetak (ana i ivan). Odgovor se računa iz sažetka, nikad iz lozinke. Zato tko god ima sažetak, ' +
        'primjerice iz memorije računala na kojem je ana bila prijavljena, odgovara na svaki izazov kao ana: sažetak ne treba ' +
        'razbijati.</p>' +
        '<p><b>Prisluškivanje.</b> Izazov i odgovor s mreže ne mogu se ponoviti, jer je sljedeći izazov drukčiji. Ostaje ' +
        'pogađanje lozinke izvan mreže: pogodak je lozinka koja daje isti odgovor. Slaba lozinka pada, jaka odolijeva.</p>' +
        '<p><b>Izvan ove stranice:</b> NTLMv1 i LM, napadi prosljeđivanjem poruka (<i>relay</i>), sažetak kao ključ ' +
        'Kerberosa, zaštita memorije. NTLM se politikom može ograničiti ili isključiti, uz provjeru što se tada ruši.</p>'
    },

    en: {
      stage: 'Kerberos and NTLM: messages, keys and what an attacker gets',

      lanePc: 'PC07',
      laneX: 'attacker',
      laneFs: 'FS01',
      laneDc: 'DC01',
      rolePc: 'ana is logged on',
      roleX: 'own host; admin on PC07',
      roleFs: 'file server',
      roleDc: 'KDC and domain controller',
      inMemory: 'in memory:',
      holds: 'holds:',
      nothing: 'nothing',
      ntHash: 'NT hash',
      tgt: 'TGT',
      keys: 'key:',
      fsNoHash: 'no hash of ana',
      dcHashes: 'NT hashes:',
      sameHash: 'same',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      timeMemory: 'memory',
      noteTheft: 'copies ana\'s NT hash from PC07\'s memory',
      chipAccess: 'access',
      fAccess: 'access',
      fAsAna: 'as ana',
      fDenied: 'refused',
      fOk: 'OK + groups',
      fPass: 'challenge + response',
      eveObserver: 'observer sees',
      eveAdmin: 'attacker holds',
      seenTicket: 'ticket',
      seenAuth: 'authenticator',
      seenKey: 'session key',
      seenFlags: 'options only',
      seenOffPath: 'not on its path',
      seenGranted: 'access granted',
      seenNothing: 'nothing to reuse',
      seenFromHash: 'response from the hash',
      seenIn: 'in as ana',
      seenResponse: 'response',

      panelActive: 'this run',
      panelOther: 'the other protocol, to its end',
      fsAsks: 'FS01 asks DC01',
      pcAsks: 'client asks DC01',
      times: '{v}×',
      kFs: 'opens the ticket with its own key FS01$',
      kPc: 'for the ticket, before FS01',
      nFs: 'at every logon (pass-through)',
      nPc: 'never; FS01 does',
      wire: 'from the wire, an attacker gets',
      memory: 'from PC07\'s memory',
      kWire: 'tickets locked with keys it lacks: nothing to reuse',
      nWire: 'challenge + response: offline password guessing only; a weak one falls, a strong one resists',
      kMem: 'the NT hash is there too: it works wherever NTLM is still accepted',
      nMem: 'the NT hash answers any challenge as ana',
      formula: 'response',
      formulaText: 'HMAC-MD5(key from the NT hash, challenge ‖ blob)',
      formulaNone: 'not computed yet',

      target: 'The client opens',
      optName: '\\\\fs01\\projects',
      optIp: '\\\\10.10.0.20\\projects',
      attacker: 'Attacker',
      attNone: 'none',
      attObserver: 'observer on the client\'s network',
      attAdmin: 'admin on PC07',
      targetFixed: 'The attacker connects by address, so Negotiate picks NTLM.',

      presetByName: 'By name',
      presetByNameHint: 'Kerberos: a ticket, FS01 does not ask the DC, 4 steps',
      presetByIp: 'By IP address',
      presetByIpHint: 'No SPN: NTLM with pass-through to DC01, 6 steps',
      presetCapture: 'Capture',
      presetCaptureHint: 'The observer gets challenge and response: offline guessing only, 6 steps',
      presetPth: 'Pass-the-hash',
      presetPthHint: 'An admin on PC07 takes ana\'s hash and gets in without the password, 7 steps',

      legendKerberos: 'Kerberos',
      legendNtlm: 'NTLM',
      legendPass: 'pass-through to the DC',
      legendEye: 'the attacker has it',
      legendChanged: 'this step',

      capStartKerb: '{unc}: ana is logged on to PC07 and holds a TGT from logon. By name there is an SPN (service principal name), {spn}, so Negotiate picks Kerberos.',
      capStartNtlm: '{unc}: ana opens the share by address. Negotiate prefers Kerberos, but an address has no SPN, so the client does not even ask for a ticket and uses NTLM.',
      capStartAdmin: 'An attacker is an administrator on PC07, where ana is logged on. Her NT hash is in memory, so NTLM can log her on without asking for the password again.',
      capTheft: '{n}. The attacker copies ana\'s NT hash {hash} from PC07\'s memory to their own host. The password is still unknown.',
      capTgsReq: '{n}. TGS-REQ: PC07 sends ana\'s TGT (locked with krbtgt) and asks DC01 for a ticket for {spn}.',
      capTgsRep: '{n}. TGS-REP: DC01 returns a service ticket locked with FS01$\'s key. Only FS01 and the DC can open it.',
      capApReq: '{n}. AP-REQ: PC07 hands FS01 the ticket and a fresh authenticator.',
      capApRep: '{n}. FS01 opens the ticket with its own key and reads ana\'s groups from it: access, and DC01 is not asked at all.',
      capApRepObs: ' The observer saw only locked tickets; FS01 does not accept the same authenticator twice.',
      capNegotiate: '{n}. NEGOTIATE: {who} offers NTLM. The message lists options, no secret.',
      capChallenge: '{n}. Access by IP address has no SPN, so Windows falls back to NTLM: the server sends an 8-byte challenge: {ch}.',
      capChallengeX: '{n}. FS01 sends a fresh 8-byte challenge, {ch}: every logon gets a new one.',
      capChallengeObs: ' The observer sees it.',
      capAuth: '{n}. AUTHENTICATE: PC07 computes the response from ana\'s NT hash, the challenge and its own blob ({proof}). Neither the password nor the hash crosses the wire.',
      capAuthX: '{n}. The attacker holds ana\'s NT hash and computes the response with it — the password is never needed.',
      capAuthObs: ' The observer now holds the challenge and the response.',
      capPass: '{n}. FS01 has no hash of ana, so it sends user, challenge and response to DC01 (pass-through).',
      capReplyOk: '{n}. DC01 computes the same response from the hash it stores for ana: they match. It answers OK with ana\'s groups.',
      capReplyOkX: '{n}. DC01 computes the same response from the hash it stores for ana: they match. The DC cannot tell the attacker from ana.',
      capReplyBad: '{n}. DC01 computes a different response: no match, the logon is refused.',
      capAccess: '{n}. FS01 lets ana into {unc}. Every NTLM logon to FS01 asks DC01 again.',
      capAccessObs: '{n}. Access granted. The observer holds challenge and response: all it can do is guess the password offline. A weak password falls, a strong one resists; replaying them fails, because the next challenge differs.',
      capAccessX: '{n}. The attacker is in {unc} as ana, without the password: pass-the-hash. For NTLM, whoever holds the hash is ana.',
      capDenied: '{n}. FS01 refuses access.',
      whoPc: 'PC07',
      whoX: 'the attacker\'s host',

      explain:
        '<p><b>Negotiate decides.</b> Windows prefers Kerberos. It falls back to NTLM when the client cannot get a ' +
        'service ticket: the target is an IP address (Windows does not try Kerberos for an address unless ' +
        '<span translate="no">TryIPSPN</span> is set and an SPN is registered for the address), the name is not in an AD ' +
        'domain, no DC is reachable, or the account is local. So NTLM has not gone away: a domain does not mean Kerberos ' +
        'every time.</p>' +
        '<p><b>Ticket or challenge.</b> With Kerberos, FS01 gets a ticket locked with its own key and opens it itself; ' +
        'DC01 is asked once, when the client asks for the ticket. With NTLM, FS01 sends 8 random bytes, the client returns ' +
        'an <span translate="no">HMAC-MD5</span> of the challenge and its blob under a key derived from the NT hash ' +
        '(NTLMv2), and FS01, which has no hash, asks DC01 at every logon.</p>' +
        '<p><b>The hash.</b> The NT hash is <span translate="no">MD4</span> of the password, unsalted: two accounts with the ' +
        'same password have the same hash (ana and ivan). The response is computed from the hash, never from the password. ' +
        'So whoever holds the hash, for instance from the memory of a machine where ana was logged on, answers any challenge ' +
        'as ana: the hash does not need cracking.</p>' +
        '<p><b>Capture.</b> A challenge and response taken off the wire cannot be replayed, because the next challenge ' +
        'differs. What is left is guessing the password offline: a guess is right when it gives the same response. A weak ' +
        'password falls, a strong one resists.</p>' +
        '<p><b>Not on this page:</b> NTLMv1 and LM, relay attacks, the hash as a Kerberos key, memory protection. NTLM ' +
        'can be restricted or switched off by policy, after checking what then breaks.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
