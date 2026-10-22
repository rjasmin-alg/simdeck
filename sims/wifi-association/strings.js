/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of wifi-association, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *word* in a caption is an English term in italics (the Croatian term rule: *English* (hrvatski) at first mention).
   Frame names (Probe Request, Beacon, Authentication, Association Request/Response, Data) stay English in both
   languages, as in the book; the page draws them as data. Terms follow URM ch17: pridruživanje, signalni okvir
   (beacon), sonda, odgovor na sondu, autentikacija, access point, osnovni skup usluga (BSS), distribucijski sustav,
   SSID (mrežno ime). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stanica se pridružuje mreži: okviri između stanice i access pointova, popis mreža i stanje stanice',

      // controls
      scan: 'Skeniranje',
      scanActive: 'aktivno',
      scanPassive: 'pasivno',
      security: 'Zaštita mreže Grafo',
      secOpen: 'otvorena',
      secWpa2: 'WPA2',
      secWpa3: 'WPA3',
      reject: 'Prvi AP odbija pridruživanje',

      // presets
      presetBook: 'Knjiga: redoslijed okvira',
      presetBookHint: 'Poglavlje 17, primjer 2: sonda, odgovori, autentikacija, pridruživanje.',
      presetPassive: 'Pasivno skeniranje',
      presetPassiveHint: 'Stanica samo sluša signalne okvire, kanal po kanal.',
      presetChoose: 'Tko bira AP?',
      presetChooseHint: 'Oba AP-a mreže Grafo odgovorila su. Koji će stanica uzeti?',
      presetOpen: 'Otvorena mreža',
      presetOpenHint: 'Bez ključeva: podaci odmah nakon pridruživanja, nešifrirani.',
      presetWpa3: 'WPA3: SAE',
      presetWpa3Hint: 'Okviri Authentication nose SAE umjesto otvorenog sustava.',
      presetReject: 'Odbijeno pridruživanje',
      presetRejectHint: 'AP1 odgovara statusom 17. Što stanica radi dalje?',

      // legend
      legFrame: 'upravljački okvir',
      legProbe: 'sonda svima (broadcast)',
      legLock: 'šifrirano',
      legBadge: 'zaštita mreže',
      legRung: 'stanje postignuto',
      legChanged: 'novo u ovom koraku',

      // chart
      laneSta: 'Stanica',
      chartEmpty: 'Još nijedan okvir.',
      earlier: ['↑ {n} raniji okvir', '↑ {n} ranija okvira', '↑ {n} ranijih okvira'],
      chan: 'kanal {n}',
      chans: 'kan. {list}',
      anySsid: 'bilo koji SSID',
      fStatus: 'status {n}',
      fAid: 'AID {n}',
      hsChip: 'rukovanje',
      reClear: 'nešifrirano',
      reKeys: 'ključevi',
      noteDs: 'javlja distribucijskom sustavu',
      cardWants: 'traži mrežu',
      cardOn: 'na kanalu',
      cardOff: 'skenira',
      pair1: 'neautenticirana',
      pair2: 'autenticirana',
      pair3: 'pridružena',
      pair4: 'ključevi',

      // station panel
      staTitle: 'Stanica STA',
      wants: 'Želi u mrežu',
      pwSaved: 'lozinka spremljena',
      pwNone: 'bez lozinke',
      listTitle: 'Popis mreža',
      listEmpty: 'Prazan: stanica još nije skenirala.',
      colSsid: 'SSID',
      colCh: 'kanal',
      colSig: 'signal (dBm)',
      colSec: 'zaštita',
      viaProbe: 'iz odgovora na sondu',
      viaBeacon: 'iz signalnog okvira',
      rowChosen: 'odabran',
      rowRefused: 'odbio',
      ladderTitle: 'Stanje prema {ap}',
      ladderNone: 'Stanje (AP još nije odabran)',
      rungNone: 'nije autenticirana',
      rungAuth: 'autenticirana',
      rungAssoc: 'pridružena',
      rungKeys: 'ključevi postavljeni',
      rungData: 'podaci prolaze',
      rungNa: 'ne postoji na otvorenoj mreži',
      aidIs: 'AID {n}',

      // captions
      capStart: 'Stanica želi u mrežu Grafo ({sec}). Prije ijednog okvira podataka mora pronaći *access point*, autenticirati se i pridružiti mu se. Skeniranje: {scan}. Pritisni → za sljedeći korak.',
      capStartActive: 'aktivno, sama šalje sondu',
      capStartPassive: 'pasivno, samo sluša',
      capProbe: 'Stanica šalje *Probe Request* (sonda) na kanalu 1, kratko čeka odgovore, pa isto na kanalu 6 i 11. Sonda ide svima koji slušaju, za bilo koju mrežu. Tako skenira aktivno: ne čeka signalne okvire, nego pita.',
      capResponses: 'Odgovori skupljeni na tri kanala: svaki *access point* koji je čuo sondu odgovorio je na svom kanalu okvirom *Probe Response* (odgovor na sondu), AP3 na 1, AP1 na 6, AP2 na 11. Odgovor nosi sve što treba za pridruživanje, i SSID (mrežno ime). Popis je pun; nitko još nije ništa odabrao.',
      capBeacon: 'Na kanalu {ch} stanica čuje *beacon* (signalni okvir) koji {ap} periodički šalje: mreža {ssid}. Stanica ne šalje ništa, samo sluša pa prelazi na sljedeći kanal.',
      capBeaconLast: 'Popis je isti kao nakon aktivnog skeniranja: signalni okvir nosi istu informaciju kao odgovor na sondu.',
      capChoose: '{who} Odlučuje stanica, ne mreža: uzima {ap}, jači signal ({rssi} dBm prema {other} dBm). Kafic je jači od AP2, ali to je druga mreža.',
      capWhoProbe: 'Odgovorila su oba AP-a s imenom Grafo.',
      capWhoBeacon: 'Stanica je čula signalne okvire oba AP-a s imenom Grafo.',
      capAuthOpen: 'Autentikacija s {ap}: dva okvira *Authentication* (autentikacija), otvoreni sustav (*Open System*). {ap} pušta svakog klijenta: ovo nije zaštitni korak.',
      capAuthOpenWpa: 'Lozinka se ovdje ne provjerava; to će učiniti rukovanje.',
      capAuthOpenOpen: 'Na otvorenoj mreži drugog koraka zaštite neće ni biti.',
      capSaeCommit: 'WPA3: okviri *Authentication* nose SAE umjesto otvorenog sustava. Prvo *Commit* u oba smjera: svaka strana šalje vrijednost izvedenu iz lozinke i svježeg slučajnog broja. Lozinka se ne šalje.',
      capSaeConfirm: 'SAE *Confirm* u oba smjera: obje strane dokazuju da su izračunale isto, dakle znaju istu lozinku. Tek sad je stanica autenticirana s {ap}.',
      capAssocReq: 'Stanica šalje *Association Request* (zahtjev za pridruživanje) {ap} tek nakon uspješne autentikacije. Autentikacija uvijek prethodi pridruživanju.',
      capAssoc: '{ap} odgovara okvirom *Association Response* sa statusom 0: uspjeh. Stanica je pridružena i dobiva {aid}; {ap} o tome obavještava distribucijski sustav.',
      capAssocWpa: 'Podaci još ne prolaze: prvo ključevi.',
      capAssocOpen: 'Na otvorenoj mreži podaci mogu odmah.',
      capRefused: '{ap} odgovara okvirom *Association Response* sa statusom {status}: ne može primiti još jednu stanicu. Stanica ostaje autenticirana s {ap}, ali nije pridružena. Sama bira sljedeći: {next}, idući po jačini signala.',
      capKeys: '[[4-way handshake]]: {ap} i stanica iz zajedničkog glavnog ključa (PMK; {pmk}) izvode ključeve sesije i postavljaju ih. Ovdje je sažeto u jedan korak; korak po korak: {link}.',
      linkHs: 'WPA2 i WPA3: rukovanje',
      pmkWpa2: 'kod WPA2 iz lozinke i SSID-a',
      pmkWpa3: 'kod WPA3 iz SAE razmjene',
      capDataEnc: 'Prvi okvir podataka prolazi, šifriran ključevima iz rukovanja. Stanica je u mreži.',
      capDataOpen: 'Prvi okvir podataka prolazi odmah nakon pridruživanja, nešifriran. Svatko u dometu može ga pročitati.',

      explain: '<p>Prije ijednog okvira podataka stanica prolazi kroz <b>pridruživanje mreži</b> (<i>association</i>). ' +
        'Prvo skenira: <b>pasivno</b>, slušajući <i>beacon</i> (signalni okvir) koji svaki <i>access point</i> ' +
        'periodički šalje, ili <b>aktivno</b>, šaljući <i>Probe Request</i> (sondu) na svakom kanalu i čekajući ' +
        '<i>Probe Response</i> (odgovor na sondu). Oba načina daju istu informaciju, i SSID (mrežno ime).</p>' +
        '<p>Odgovara svaki <i>access point</i> koji čuje sondu. <b>Bira stanica</b>, obično prema najjačem signalu ' +
        'mreže koju želi; norma ne propisuje kako.</p>' +
        '<p><b>Autentikacija uvijek prethodi pridruživanju.</b> Kod WPA2 to je otvoreni sustav (<i>Open System</i>): ' +
        'pušta svakoga i ne štiti ništa; lozinku provjerava tek [[4-way handshake]]. Kod WPA3 u okvirima ' +
        '<i>Authentication</i> teče SAE (<i>Commit</i> i <i>Confirm</i> u oba smjera).</p>' +
        '<p>Zatim <i>Association Request</i> i <i>Association Response</i>: status 0 znači uspjeh, stanica dobiva ' +
        'AID (identifikator pridruživanja), a <i>access point</i> obavještava distribucijski sustav. Bilo koji drugi status ' +
        'znači odbijanje: stanica ostaje samo autenticirana i pokušava drugdje. Na WPA mreži podaci prolaze tek ' +
        'kad rukovanje postavi ključeve; na otvorenoj odmah, nešifrirani, i svatko u dometu ih može pročitati.</p>' +
        '<p>Izvor: Uvod u računalne mreže, poglavlje 17 (primjer 2).</p>'
    },

    en: {
      stage: 'A station joins a network: frames between the station and the access points, the network list and the station\'s state',

      // controls
      scan: 'Scan',
      scanActive: 'active',
      scanPassive: 'passive',
      security: 'Security of Grafo',
      secOpen: 'open',
      secWpa2: 'WPA2',
      secWpa3: 'WPA3',
      reject: 'The first AP refuses',

      // presets
      presetBook: 'Book: frame order',
      presetBookHint: 'Chapter 17, example 2: probe, responses, authentication, association.',
      presetPassive: 'Passive scan',
      presetPassiveHint: 'The station only listens for Beacons, channel by channel.',
      presetChoose: 'Who picks the AP?',
      presetChooseHint: 'Both Grafo APs answered. Which one will the station take?',
      presetOpen: 'Open network',
      presetOpenHint: 'No keys: data right after association, unencrypted.',
      presetWpa3: 'WPA3: SAE',
      presetWpa3Hint: 'The Authentication frames carry SAE instead of Open System.',
      presetReject: 'Association refused',
      presetRejectHint: 'AP1 answers with status 17. What does the station do next?',

      // legend
      legFrame: 'management frame',
      legProbe: 'probe to all (broadcast)',
      legLock: 'encrypted',
      legBadge: 'network security',
      legRung: 'state reached',
      legChanged: 'new in this step',

      // chart
      laneSta: 'Station',
      chartEmpty: 'No frames yet.',
      earlier: ['↑ {n} earlier frame', '↑ {n} earlier frames'],
      chan: 'ch {n}',
      chans: 'ch {list}',
      anySsid: 'any SSID',
      fStatus: 'status {n}',
      fAid: 'AID {n}',
      hsChip: 'handshake',
      reClear: 'unencrypted',
      reKeys: 'keys',
      noteDs: 'tells the distribution system',
      cardWants: 'wants',
      cardOn: 'on channel',
      cardOff: 'scanning',
      pair1: 'unauthenticated',
      pair2: 'authenticated',
      pair3: 'associated',
      pair4: 'keys',

      // station panel
      staTitle: 'Station STA',
      wants: 'Wants to join',
      pwSaved: 'password saved',
      pwNone: 'no password',
      listTitle: 'Network list',
      listEmpty: 'Empty: the station has not scanned yet.',
      colSsid: 'SSID',
      colCh: 'ch',
      colSig: 'signal (dBm)',
      colSec: 'security',
      viaProbe: 'from a Probe Response',
      viaBeacon: 'from a Beacon',
      rowChosen: 'chosen',
      rowRefused: 'refused',
      ladderTitle: 'State with {ap}',
      ladderNone: 'State (no AP chosen yet)',
      rungNone: 'not authenticated',
      rungAuth: 'authenticated',
      rungAssoc: 'associated',
      rungKeys: 'keys installed',
      rungData: 'data passes',
      rungNa: 'none on an open network',
      aidIs: 'AID {n}',

      // captions
      capStart: 'The station wants to join the network Grafo ({sec}). Before any data frame it must find an access point, authenticate and associate with it. Scan: {scan}. Press → for the next step.',
      capStartActive: 'active, it sends a probe itself',
      capStartPassive: 'passive, it only listens',
      capProbe: 'The station sends a Probe Request on channel 1, waits briefly for answers, then does the same on channels 6 and 11. The probe goes to anyone listening, for any network. This is an active scan: instead of waiting for Beacons, it asks.',
      capResponses: 'The answers collected on the three channels: every access point that heard the probe answered on its own channel with a Probe Response, AP3 on 1, AP1 on 6, AP2 on 11. The response carries everything needed to join, the SSID (network name) included. The list is full; nobody has chosen anything yet.',
      capBeacon: 'On channel {ch} the station hears the Beacon that {ap} sends periodically: network {ssid}. The station sends nothing; it listens, then moves to the next channel.',
      capBeaconLast: 'The list is the same as after an active scan: a Beacon carries the same information as a Probe Response.',
      capChoose: '{who} The station, not the network, decides which to join: it picks {ap}, the stronger signal ({rssi} dBm over {other} dBm). Kafic is stronger than AP2, but it is another network.',
      capWhoProbe: 'Both APs named Grafo answered the probe.',
      capWhoBeacon: 'The station heard the Beacons of both APs named Grafo.',
      capAuthOpen: 'Authentication with {ap}: two Authentication frames, Open System. {ap} lets any client in: this is not the security step.',
      capAuthOpenWpa: 'The password is not checked here; the handshake will do that.',
      capAuthOpenOpen: 'On an open network there will be no other security step.',
      capSaeCommit: 'WPA3: the Authentication frames carry SAE instead of Open System. First Commit, each way: each side sends a value derived from the password and a fresh random number. The password is not sent.',
      capSaeConfirm: 'SAE Confirm, each way: both sides prove they computed the same thing, so they know the same password. Only now is the station authenticated with {ap}.',
      capAssocReq: 'The station sends an Association Request to {ap} only after authentication succeeded. Authentication always comes before association.',
      capAssoc: '{ap} answers with an Association Response, status 0: success. The station is associated and gets {aid}; {ap} informs the distribution system.',
      capAssocWpa: 'No data passes yet: keys first.',
      capAssocOpen: 'On an open network data may flow at once.',
      capRefused: '{ap} answers with an Association Response, status {status}: it cannot take another station. The station stays authenticated with {ap} but not associated. It picks the next one itself: {next}, the next strongest signal.',
      capKeys: 'The [[4-way handshake]]: {ap} and the station derive session keys from their shared master key (PMK; {pmk}) and install them. Collapsed into one step here; step by step: {link}.',
      linkHs: 'WPA2 and WPA3: the handshake',
      pmkWpa2: 'with WPA2 from the password and SSID',
      pmkWpa3: 'with WPA3 from the SAE exchange',
      capDataEnc: 'The first data frame passes, encrypted with the keys from the handshake. The station is on the network.',
      capDataOpen: 'The first data frame passes right after association, unencrypted. Anyone in range can read it.',

      explain: '<p>Before any data frame a station goes through <b>association</b>. First it scans: <b>passively</b>, ' +
        'listening for the Beacon each access point sends periodically, or <b>actively</b>, sending a Probe Request on ' +
        'each channel and waiting for Probe Responses. Both give the same information, the SSID (network name) included.</p>' +
        '<p>Every access point that hears the probe answers. <b>The station chooses</b>, usually the strongest signal of ' +
        'the network it wants; the standard does not say how.</p>' +
        '<p><b>Authentication always comes before association.</b> With WPA2 it is Open System: it lets anyone in and ' +
        'protects nothing; the password is checked only by the [[4-way handshake]]. With WPA3 the Authentication frames ' +
        'carry SAE (Commit and Confirm, each way).</p>' +
        '<p>Then the Association Request and Association Response: status 0 means success, the station gets an AID ' +
        '(association ID) and the access point informs the distribution system. Any other status is a refusal: the ' +
        'station stays only authenticated and tries elsewhere. On a WPA network data passes only once the handshake ' +
        'has installed keys; on an open one at once, unencrypted, and anyone in range can read it.</p>' +
        '<p>Source: Uvod u računalne mreže (Introduction to computer networks), chapter 17 (example 2).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
