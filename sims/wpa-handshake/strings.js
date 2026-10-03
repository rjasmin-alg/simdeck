/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of wpa-handshake, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms missing
   from kit/glossary.js are written out this way, English term then the Croatian in parentheses (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). Message names (M1 … M4, SAE commit, 802.1X/EAP), field
   names (ANonce, SNonce, MIC, {GTK}KEK), MAC addresses, SSIDs, keys and numbers are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent, pristupna točka i promatrač u dometu: poruke rukovanja, ključevi na svakoj strani i ono što se može snimiti',

      // lanes and key panels
      sta: 'Klijent',
      ap: 'Pristupna točka',
      as: 'Poslužitelj za autentikaciju',
      kPass: 'lozinka',
      kCred: 'podaci za prijavu',
      kUsers: 'korisnici',
      kAllUsers: 'svi',
      kNone: 'nema',
      kPtk: 'PTK',

      // chart
      eveTitle: 'Promatrač snima',
      chartEmpty: 'Još ništa nije poslano.',
      chartWait: 'WPA2 nema razmjene prije rukovanja: čeka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      notePmkPsk: 'PMK iz lozinke i SSID-a',
      notePmkSae: 'PMK iz SAE-a',
      notePmkEap: 'PMK iz EAP-a, samo za ovog korisnika',
      notePtk: 'PTK → KCK, KEK, TK',
      noteInstall: 'TK instaliran',
      reMicOk: 'MIC ispravan',
      reChecks: 'provjerava korisnika',
      reWired: 'žičanom vezom',
      seenLocal: 'ništa: događa se lokalno',
      seenWire: 'ništa: nije u zraku',
      seenOpaque: 'bez koristi za provjeru lozinke',
      seenEap: 'razmjena prijave, bez zajedničke lozinke',
      seenEnc: 'šifrirano',
      seenFirst: 'i MAC adrese, SSID',

      // observer panel and verdicts
      obsTitle: 'Promatrač: snimljeno',
      obsNone: 'Još ništa.',
      obsNever: 'Nikad u zraku: lozinka, PMK, PTK, nešifrirani GTK.',
      obsEnc: 'šifrirano',
      vNothing: 'Promatrač još nema ništa.',
      vWaiting: 'Još nije dovoljno: nedostaje odgovor klijenta.',
      vTestable: 'Pokušaj pogađanja lozinke sada se može provjeriti bez mreže.',
      vTestableHow: 'pogodak → PMK → PTK → MIC, usporedba sa snimljenim MIC-om',
      vNoShared: 'Nema zajedničke lozinke koju bi se moglo provjeravati.',
      vOnline: 'Svaki pokušaj treba AP, uživo.',
      vOnlineHow: 'AP može odbiti ili usporiti pokušaje; snimka ne pomaže.',
      vCount: ['{n} snimljena stavka', '{n} snimljene stavke', '{n} snimljenih stavki'],

      // explorer
      exTitle: 'Koliko traje isprobati sve lozinke, pri {rate} pokušaja u sekundi',
      exNote: 'Aritmetika je točna; brzina je klizač, a ne tvrdnja o opremi.',
      exYou: 'ova mreža',
      cl_lower8: '8 malih slova',
      cl_mixed8: '8 slova i znamenki',
      cl_words4: '4 nasumične riječi s popisa od 7776',
      cl_rand12: '12 nasumičnih znakova',
      cl_rand20: '20 nasumičnih znakova',
      tS: '{v} s',
      tMin: '{v} min',
      tH: '{v} h',
      tD: ['{n} dan', '{n} dana', '{n} dana'],
      tY: ['{n} godina', '{n} godine', '{n} godina'],
      tYBig: '{v} godina',

      // params
      mode: 'Način rada',
      modePsk: 'WPA2 osobni',
      modeEap: 'WPA2 poslovni',
      modeSae: 'WPA3 osobni',
      modeCmp: 'WPA2 i WPA3',
      observer: 'Promatrač u dometu',
      observerHint: 'Prikaži što bilo tko u dometu može snimiti.',
      passClass: 'Vrsta lozinke',
      passClassOff: 'U poslovnom načinu nema zajedničke lozinke.',
      guessRate: 'Pokušaja u sekundi',
      guessRateOff: 'Samo za WPA2 osobni s promatračem: drugdje nema pogađanja bez mreže ili nema što prikazati.',
      rateFmt: '{v}/s',

      // presets
      presetHome: 'Kod kuće',
      presetHomeHint: 'WPA2 osobni: PMK, četiri poruke, ključevi na obje strane.',
      presetObserver: 'Promatrač',
      presetObserverHint: 'Isto rukovanje; nakon poruke 2 pogađanje se može provjeravati bez mreže.',
      presetFaculty: 'Na fakultetu',
      presetFacultyHint: 'WPA2 poslovni: 802.1X/EAP daje PMK za jednog korisnika, rukovanje je isto.',
      presetWpa3: 'WPA3',
      presetWpa3Hint: 'SAE prije rukovanja: svaki pokušaj treba AP.',
      presetCompare: 'Usporedba',
      presetCompareHint: 'WPA2 osobni i WPA3 osobni jedan uz drugi.',

      // legend
      legClear: 'nešifrirano',
      legProtected: 'zaštićeno, žičanom vezom',
      legEnc: 'šifrirano (GTK)',
      legSecret: 'tajna, ostaje na svojoj strani',
      legSeen: 'snimio promatrač',
      legChanged: 'promijenjeno u ovom koraku',

      // captions
      capStartPsk: 'Kućna mreža, osobni način rada: klijent i pristupna točka znaju istu lozinku. Pritisni → za prvi korak.',
      capStartEap: 'Fakultetska mreža, poslovni način rada: klijent ima vlastite podatke za prijavu, zajedničke lozinke nema. Pritisni →.',
      capStartSae: 'WPA3, osobni način rada: ista zajednička lozinka kao kod kuće, ali PMK će dati SAE. Pritisni →.',
      capStartCmp: 'Lijevo WPA2, desno WPA3, ista lozinka. Gledaj kad promatrač dobije nešto što može provjeravati. Pritisni →.',
      capPmkPsk: 'Obje strane same izračunaju PMK iz lozinke i SSID-a {ssid} (PBKDF2, 4096 ponavljanja). PMK se nikad ne šalje.',
      capPmkSae: 'PMK izlazi iz SAE-a: ovisi o lozinci i o svježim slučajnim vrijednostima obiju strana. Nova veza, novi PMK.',
      capEap: '802.1X/EAP: klijent se prijavljuje vlastitim podacima kod poslužitelja za autentikaciju, preko pristupne točke. Klijent i poslužitelj iz te razmjene dobivaju PMK samo za ovog korisnika.',
      capPmkToAp: 'Poslužitelj predaje PMK pristupnoj točki žičanom vezom, zaštićeno, ne zrakom. Rukovanje koje slijedi isto je kao kod kuće.',
      capSaeCommit: 'SAE *commit*: obje strane pošalju vrijednost izvedenu iz lozinke i svježeg slučajnog broja. Lozinka se ne šalje.',
      capSaeConfirm: 'SAE *confirm*: obje strane dokazuju da su izračunale isto. Svaki pokušaj pogađanja lozinke tražio bi ovu razmjenu uživo s pristupnom točkom.',
      capM1: 'Poruka 1: pristupna točka šalje svoj *ANonce*, nešifrirano. Nema MIC-a, jer još nitko nema sesijski ključ: pristupnoj točki nedostaje SNonce klijenta.',
      capStaPtk: 'Klijent sada ima oba jednokratna broja i izvodi PTK iz PMK-a, obje MAC adrese i oba broja, pa ga dijeli na KCK (za MIC), KEK (za GTK) i TK (za podatke).',
      capM2: 'Poruka 2: klijent šalje svoj *SNonce* i MIC. Lozinka i PMK nisu poslani — ali sve ostalo od čega ovisi sesijski ključ sada je u zraku.',
      capM2Ap: 'Pristupna točka izvodi isti PTK i MIC se slaže: klijent zna PMK.',
      capM3: 'Poruka 3: pristupna točka šalje *ANonce*, GTK šifriran KEK-om i MIC, uz poruku da se ključevi instaliraju. GTK putuje samo šifriran.',
      capM4: 'Poruka 4: klijent potvrđuje MIC-om. Obje strane instaliraju TK i od sada je promet šifriran.',
      capObsWaiting: 'Promatrač je snimio *ANonce*, obje MAC adrese i SSID — još nedovoljno.',
      capObsTestable: 'Promatrač sada ima sve osim PMK-a, a PMK ovisi samo o lozinci i SSID-u: svaki pokušaj pogađanja lozinke može provjeriti bez mreže, brzinom kojoj je granica samo računalo.',
      capObsNoShared: 'Promatrač vidi razmjenu, ali PMK pripada jednom korisniku i ne izvodi se iz zajedničke lozinke: nema što provjeravati.',
      capObsOnline: 'Promatrač snima, ali iz snimke ne može provjeriti lozinku: svaki pokušaj treba novu SAE-razmjenu s pristupnom točkom.',
      cmp1: 'WPA3 počinje SAE *commit* razmjenom. WPA2 nema ništa prije rukovanja: PMK izračuna iz lozinke kad zatreba.',
      cmp2: 'WPA3: SAE *confirm*. Promatrač snima, ali te vrijednosti ne omogućuju provjeru lozinke.',
      cmp3: 'Obje strane imaju PMK: lijevo iz lozinke i SSID-a, desno iz SAE-a. Od ovog koraka rukovanje je isto.',
      cmp4: 'Poruka 1 na obje strane: *ANonce*, nešifrirano.',
      cmp5: 'Klijent na obje strane izvodi PTK.',
      cmp6: 'Poruka 2: *SNonce* i MIC. Lijevo promatrač sada može provjeravati pokušaje pogađanja lozinke bez mreže; desno ne, jer PMK ovisi i o slučajnim vrijednostima koje nikad ne idu zrakom, a snimljene SAE vrijednosti ne omogućuju provjeru pokušaja.',
      cmp7: 'Poruka 3: GTK šifriran KEK-om, na obje strane jednako.',
      cmp8: 'Poruka 4 i instalacija ključeva. Iste četiri poruke, različita presuda: WPA2 osobni ovisi o snazi lozinke, WPA3 osobni ne dopušta pogađanje iz snimke.',

      explain: '<p>[[4-way handshake]] dogovara sesijski ključ, <em lang="en">Pairwise Transient Key</em> (sesijski ključ, PTK), ' +
        'iz glavnog ključa, <em lang="en">Pairwise Master Key</em> (glavni ključ, PMK). Poruke 1 i 2 razmijene dva jednokratna ' +
        'broja (<em lang="en">nonce</em>), a PTK ovisi o PMK-u, obje MAC adrese i oba broja.</p>' +
        '<p>Razlika između načina rada je samo u tome odakle dolazi PMK. U osobnom načinu izvodi se iz unaprijed dijeljene lozinke ' +
        '(<em lang="en">Pre-Shared Key</em>, PSK) i SSID-a. U poslovnom načinu daje ga 802.1X prijava kod poslužitelja za ' +
        'autentikaciju, posebno za svakog korisnika. Rukovanje je u oba slučaja isto.</p>' +
        '<p>Lozinka i PMK nikad ne idu zrakom. No u WPA2 osobnom načinu sve ostalo od čega ovisi MIC poruke 2 jest u zraku, pa ' +
        'promatrač koji je snimio poruke 1 i 2 može pogađati lozinku bez mreže (<em lang="en">offline guessing</em>, pogađanje ' +
        'lozinke bez mreže). Obrana je duga, nasumična lozinka.</p>' +
        '<p>WPA3 prije rukovanja pokreće <em lang="en">Simultaneous Authentication of Equals</em> (SAE). PMK tada ovisi i o ' +
        'svježim slučajnim vrijednostima koje nikad ne idu zrakom, a snimljene SAE vrijednosti ne omogućuju provjeru pokušaja. Zato svaki pokušaj treba razmjenu s pristupnom točkom, a kasnije otkrivena lozinka ne ' +
        'otključava stare snimke.</p>'
    },
    en: {
      stage: 'Client, access point and an observer in range: the handshake messages, the keys on each side and what can be recorded',

      sta: 'Client',
      ap: 'Access point',
      as: 'Authentication server',
      kPass: 'password',
      kCred: 'login',
      kUsers: 'users',
      kAllUsers: 'all',
      kNone: 'none',
      kPtk: 'PTK',

      eveTitle: 'Observer records',
      chartEmpty: 'Nothing sent yet.',
      chartWait: 'WPA2 has no exchange before the handshake: it waits.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      notePmkPsk: 'PMK from password and SSID',
      notePmkSae: 'PMK from SAE',
      notePmkEap: 'PMK from EAP, for this user only',
      notePtk: 'PTK → KCK, KEK, TK',
      noteInstall: 'TK installed',
      reMicOk: 'MIC correct',
      reChecks: 'checks the user',
      reWired: 'over the wire',
      seenLocal: 'nothing: it happens locally',
      seenWire: 'nothing: not on the air',
      seenOpaque: 'no use for testing a password',
      seenEap: 'a login exchange, no shared password',
      seenEnc: 'encrypted',
      seenFirst: 'and MAC addresses, SSID',

      obsTitle: 'Observer: recorded',
      obsNone: 'Nothing yet.',
      obsNever: 'Never on the air: password, PMK, PTK, the GTK in clear.',
      obsEnc: 'encrypted',
      vNothing: 'The observer has nothing yet.',
      vWaiting: 'Not enough yet: the client\'s reply is missing.',
      vTestable: 'A guessed password can now be tested offline.',
      vTestableHow: 'guess → PMK → PTK → MIC, compared with the recorded MIC',
      vNoShared: 'No shared password to test.',
      vOnline: 'Each guess needs the AP, online.',
      vOnlineHow: 'The AP can refuse or slow down guesses; a recording does not help.',
      vCount: ['{n} item recorded', '{n} items recorded'],

      exTitle: 'Time to try every password, at {rate} guesses per second',
      exNote: 'The arithmetic is exact; the rate is a slider, not a claim about hardware.',
      exYou: 'this network',
      cl_lower8: '8 lowercase letters',
      cl_mixed8: '8 mixed letters and digits',
      cl_words4: '4 random words from a 7776-word list',
      cl_rand12: '12 random characters',
      cl_rand20: '20 random characters',
      tS: '{v} s',
      tMin: '{v} min',
      tH: '{v} h',
      tD: ['{n} day', '{n} days'],
      tY: ['{n} year', '{n} years'],
      tYBig: '{v} years',

      mode: 'Mode',
      modePsk: 'WPA2-Personal',
      modeEap: 'WPA2-Enterprise',
      modeSae: 'WPA3-Personal',
      modeCmp: 'WPA2 and WPA3',
      observer: 'Observer in range',
      observerHint: 'Show what anyone in range can record.',
      passClass: 'Kind of password',
      passClassOff: 'Enterprise mode has no shared password.',
      guessRate: 'Guesses per second',
      guessRateOff: 'WPA2-Personal with the observer only: elsewhere there is no offline guessing or nothing to show.',
      rateFmt: '{v}/s',

      presetHome: 'At home',
      presetHomeHint: 'WPA2-Personal: the PMK, four messages, the keys on both sides.',
      presetObserver: 'Observer',
      presetObserverHint: 'The same handshake; after message 2 a guess can be tested offline.',
      presetFaculty: 'At the faculty',
      presetFacultyHint: 'WPA2-Enterprise: 802.1X/EAP gives a PMK for one user; the handshake is the same.',
      presetWpa3: 'WPA3',
      presetWpa3Hint: 'SAE before the handshake: each guess needs the AP.',
      presetCompare: 'Compare',
      presetCompareHint: 'WPA2-Personal and WPA3-Personal side by side.',

      legClear: 'in clear',
      legProtected: 'protected, over the wire',
      legEnc: 'encrypted (GTK)',
      legSecret: 'secret, stays on its side',
      legSeen: 'recorded by the observer',
      legChanged: 'changed in this step',

      capStartPsk: 'Home network, personal mode: client and access point know the same password. Press → for the first step.',
      capStartEap: 'Faculty network, enterprise mode: the client has its own login, there is no shared password. Press →.',
      capStartSae: 'WPA3, personal mode: the same shared password as at home, but SAE will produce the PMK. Press →.',
      capStartCmp: 'WPA2 on the left, WPA3 on the right, the same password. Watch when the observer gets something it can test. Press →.',
      capPmkPsk: 'Both sides compute the PMK themselves from the password and the SSID {ssid} (PBKDF2, 4096 iterations). The PMK is never sent.',
      capPmkSae: 'The PMK comes out of SAE: it depends on the password and on fresh random values from both sides. A new connection, a new PMK.',
      capEap: '802.1X/EAP: the client logs in with its own credentials at the authentication server, through the access point. From that exchange the client and the server get a PMK for this user only.',
      capPmkToAp: 'The server hands the PMK to the access point over the wired network, protected, not over the air. The handshake that follows is the same as at home.',
      capSaeCommit: 'SAE commit: both sides send a value derived from the password and a fresh random number. The password is not sent.',
      capSaeConfirm: 'SAE confirm: both sides prove they computed the same thing. Every guess at the password would need this exchange, live, with the access point.',
      capM1: 'Message 1: the access point sends its ANonce, in clear. No MIC, because nobody has the session key yet: the access point lacks the client\'s SNonce.',
      capStaPtk: 'The client now has both nonces and derives the PTK from the PMK, both MAC addresses and both nonces, then splits it into KCK (for the MIC), KEK (for the GTK) and TK (for data).',
      capM2: 'Message 2: the client sends its SNonce and a MIC. The password and the PMK are not sent, but everything else the session key depends on is now on the air.',
      capM2Ap: 'The access point derives the same PTK and the MIC matches: the client knows the PMK.',
      capM3: 'Message 3: the access point sends the ANonce, the GTK encrypted with the KEK and a MIC, saying to install the keys. The GTK travels only encrypted.',
      capM4: 'Message 4: the client acknowledges with a MIC. Both sides install the TK, and from now on traffic is encrypted.',
      capObsWaiting: 'The observer has recorded the ANonce, both MAC addresses and the SSID: not enough yet.',
      capObsTestable: 'The observer now has everything except the PMK, and the PMK depends only on the password and the SSID: it can test a guessed password offline, as fast as its computer allows.',
      capObsNoShared: 'The observer sees the exchange, but the PMK belongs to one user and is not derived from a shared password: there is nothing to test.',
      capObsOnline: 'The observer records, but cannot test a password from the recording: every guess needs a new SAE exchange with the access point.',
      cmp1: 'WPA3 starts with the SAE commit exchange. WPA2 has nothing before the handshake: it computes the PMK from the password when needed.',
      cmp2: 'WPA3: SAE confirm. The observer records, but these values do not allow testing a password.',
      cmp3: 'Both sides have a PMK: on the left from the password and SSID, on the right from SAE. From this step on the handshake is the same.',
      cmp4: 'Message 1 on both sides: the ANonce, in clear.',
      cmp5: 'The client on both sides derives the PTK.',
      cmp6: 'Message 2: the SNonce and a MIC. On the left the observer can now test guesses at the password offline; on the right it cannot, because the PMK also depends on random values that never go on the air, and the recorded SAE values do not let a guess be checked.',
      cmp7: 'Message 3: the GTK encrypted with the KEK, the same on both sides.',
      cmp8: 'Message 4 and key installation. The same four messages, a different verdict: WPA2-Personal depends on the password\'s strength, WPA3-Personal allows no guessing from a recording.',

      explain: '<p>The [[4-way handshake]] agrees on a session key, the Pairwise Transient Key (PTK), from the Pairwise Master ' +
        'Key (PMK). Messages 1 and 2 exchange two nonces, and the PTK depends on the PMK, both MAC addresses and both nonces.</p>' +
        '<p>The modes differ only in where the PMK comes from. In personal mode it is derived from the Pre-Shared Key (PSK), ' +
        'the shared password, and the SSID. In enterprise mode an 802.1X login at the authentication server produces it, ' +
        'separately for every user. The handshake is the same in both.</p>' +
        '<p>The password and the PMK never go over the air. But in WPA2-Personal everything else message 2\'s MIC depends on ' +
        'is on the air, so an observer who recorded messages 1 and 2 can guess the password offline. The defence is a long, ' +
        'random password.</p>' +
        '<p>WPA3 runs Simultaneous Authentication of Equals (SAE) before the handshake. The PMK then also depends on fresh ' +
        'random values that never go on the air, and the recorded SAE values do not let a guess be checked. So every guess needs an exchange with the access point, and a password learned later does not open ' +
        'old recordings.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
