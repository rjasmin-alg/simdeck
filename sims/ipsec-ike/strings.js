/* SPDX-License-Identifier: AGPL-3.0-or-later
   ipsec-ike: every visible string, Croatian and English (docs/sim-ui.md §9). Same keys and placeholders in both.
   Addresses, SPIs, message and payload names, formulas are data: the page puts them in translate="no" elements. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Tunel IPsec između dvaju sudionika: IKE, SA-ovi i ESP',

      // params
      mode: 'Način',
      modeTunnel: 'tunelski',
      modeTransport: 'transportni',
      auth: 'Provjera identiteta',
      authPsk: 'unaprijed dijeljeni ključ',
      authCert: 'certifikat',
      action: 'Radnja',
      actBringUp: 'uspostava',
      actSend: 'slanje',
      actRekey: 'obnova',
      selectorMatch: 'Odredište u selektorima',
      selectorMatchHint: 'Isključeno: paket ide na 10.2.1.9, izvan selektora tunela.',
      notRekey: 'Ne vrijedi za obnovu ključeva.',

      // presets
      presetS2s: 'Pristupnik–pristupnik',
      presetS2sHint: 'Uspostava tunela i paket 10.1.0.5 → 10.2.0.9 u tunelskom načinu.',
      presetTransport: 'Transportni način',
      presetTransportHint: 'Računalo–računalo: izvorno zaglavlje ostaje.',
      presetNoSel: 'Izvan selektora',
      presetNoSelHint: 'Paket za 10.2.1.9 ne ulazi u tunel.',
      presetRekey: 'Obnova ključeva',
      presetRekeyHint: 'Novi par SA-ova, promet prelazi na njega, stari se briše.',

      // legend
      legIke: 'IKE SA (upravljanje)',
      legEsp: 'ESP SA (podaci), sa SPI-jem',
      legEnc: 'šifrirano',
      legTunnel: 'tunelski: novo vanjsko zaglavlje',
      legTransport: 'transportni: zaglavlje ostaje',
      legOk: 'provjera prošla / nije',
      legChanged: 'promijenjeno',

      // lane cards
      laneHostA: 'Računalo A',
      laneHostB: 'Računalo B',
      genHostA: 'računala A',
      genHostB: 'računala B',
      laneRouterA: 'Usmjernik A',
      laneRouterB: 'Usmjernik B',
      tagPeer: 'IPsec',
      kAddr: 'adresa',
      kIke: 'IKE SA',
      kOut: '→ van',
      kIn: '← unutra',
      ikeNone: 'nema',
      ikeKeyed: 'ključevi, bez provjere',
      none: 'nema',
      plainHost: 'Bez IPseca: šalje i prima običan IP. Štiti ga pristupnik.',
      plainRouter: 'Bez IPseca: usmjerava unutar privatne mreže. ESP ne može pročitati.',

      // chart
      chartEmpty: 'Na mreži još ništa.',
      earlier: ['↑ još {n} raniji redak', '↑ još {n} ranija retka', '↑ još {n} ranijih redaka'],
      noteBorn: 'aplikacija šalje',
      noteMatch: 'SPD: {act}',
      noteDecrypted: 'SPI ✓ ICV ✓ dešifrirano',
      noteNoSA: '✕ nepoznat SPI',
      noteAuthFail: '✕ neispravan ICV',
      noteTsFail: '✕ izvan selektora',
      noteDelivered: '✓ predano TCP-u',
      noteDiscarded: '✕ odbačeno',
      noteBypassed: 'nešifrirano van',
      noteLifetime: 'vijek SA-a: obnova prije isteka',
      noteSoft: 'meki vijek istekao',

      // SPD table (K4)
      spdTitle: 'SPD kod {who}, promet iz {src}',
      colDst: 'odredište',
      colAction: 'radnja',
      markIdle: 'čeka paket',
      actProtect: 'ZAŠTITI',
      actDiscard: 'ODBACI',
      actBypass: 'PROPUSTI',
      implicitAny: 'sve ostalo',
      wWin: 'odlučuje',
      wBeaten: 'širi',
      outProtect: 'u SA {spi}',
      outDiscard: 'odbačen',
      outBypass: 'nešifrirano',

      // packet view
      pkTitle: 'Paket',
      pkNone: 'U ovom koraku nema paketa.',
      pkOriginal: 'izvorni',
      pkWire: 'na mreži',
      pkTitleTunnel: 'Paket, tunelski način',
      pkTitleTransport: 'Paket, transportni način',
      pkDelivered: 'isporučen',
      pkRequest: 'zahtjev',
      pkResponse: 'odgovor',
      pkData: 'podaci',
      pkTrailer: 'ESP rep',
      pkNext: 'sljedeće {n}',
      pkEncrypted: 'šifrirano',
      pkAuthenticated: 'autenticirano (ICV)',
      pkSk: 'šifrirano ključevima IKE SA (SK)',
      pkDhBoth: 'svaka strana računa',
      pkVerdictProtect: 'SPD: ZAŠTITI, u SA {spi}',
      pkVerdictDiscard: '✕ odbačen kod {who}: ne ide u tunel ni nešifriran van',
      pkVerdictRecv: 'SPI {spi} ✓ · ICV ✓ · dešifrirano',
      pkVerdictDeliver: '✓ adrese su u selektorima · isporučen na {dst}',

      // captions
      capStartTunnel: 'Dva pristupnika, GW-A i GW-B, štite svaki svoju mrežu, 10.1.0.0/24 i 10.2.0.0/24. Između njih još nema ničega: ni ključeva ni SA-ova.',
      capStartTransport: 'Računala 10.1.0.5 i 10.2.0.9, u dvjema podmrežama iste privatne mreže, sama će štititi svoj promet; usmjernici između njih samo prosljeđuju. Ključeva još nema.',
      capStartUp: 'Tunel je već uspostavljen: postoje IKE SA i par ESP SA-ova od ranije.',
      capStartUpTransport: 'Računala već imaju IKE SA i par ESP SA-ova od ranije.',
      peersTunnel: 'pristupnici {a} i {b}',
      peersTransport: 'računala {a} i {b}',
      capInit: 'IKE_SA_INIT: {peers} Diffie–Hellmanom dogovaraju ključeve za upravljački kanal. Nešifrirano idu ponude, KE i jednokratni brojevi (nonce): {kei} i {ker}, a obje strane izračunaju {s}. Još nitko nije dokazao tko je.',
      capAuth: 'IKE_AUTH, već šifriran ključevima iz prvog koraka (SK): svaka strana dokazuje identitet {how} i odmah se stvara prvi par ESP SA-ova sa selektorima {tsi} ↔ {tsr}. IKE SA je uspostavljen.',
      howPsk: 'unaprijed dijeljenim ključem',
      howCert: 'certifikatom i potpisom',
      capSendTunnel: 'Računalo 10.1.0.5 šalje paket za {dst}. Do svog pristupnika ide kao običan IP: u lokalnoj mreži nije zaštićen.',
      capSendTransport: 'Aplikacija na 10.1.0.5 šalje paket za {dst}. Računalo je i samo sudionik IPseca, pa paket još nije izašao iz njega.',
      capMatchProtect: '{who} traži paket u SPD-u: {dst} je i u {tsr} i u 10.0.0.0/8. Pobjeđuje uži unos, ZAŠTITI, kroz izlazni SA {spi}.',
      capMatchDiscard: '{who} traži paket u SPD-u: {dst} nije u selektorima tunela ({tsr}), nego samo u 10.0.0.0/8, a taj unos kaže ODBACI.',
      capPolicy: 'Paket se odbacuje već kod {who}: izvan selektora ne ulazi u tunel, a privatni promet ne smije ni nešifriran van. Druga strana ne vidi ništa.',
      capWrapTunnel: 'Tunelski način: cijeli izvorni paket dobiva novo vanjsko IP zaglavlje. ESP ga šifrira i autenticira (SPI {spi}, slijedni broj {seq}); na mreži se vide samo adrese pristupnika, {src} → {dst}.',
      capWrapTransport: 'Transportni način: izvorno IP zaglavlje ostaje, a ESP se umeće iza njega i štiti samo sadržaj (TCP). Vanjske adrese su adrese samih računala, {src} → {dst}.',
      capReceive: '{who} po SPI-ju {spi} nalazi svoj ulazni SA, provjerava ICV (paket nitko nije mijenjao) i tek onda dešifrira.',
      capDeliverTunnel: 'GW-B provjerava unutarnje adrese prema selektorima tog SA-a ({tsi} → {tsr}). Odgovaraju, pa paket ide do {dst} kao običan IP.',
      capDeliverTransport: 'Računalo B provjerava adrese prema selektorima SA-a. Odgovaraju, pa sadržaj predaje TCP-u: zaštita je išla od računala do računala.',
      capLifetime: 'SA ne traje vječno: svaka strana po svojoj politici određuje njegov vijek (ovdje 1 h). Prije isteka razmjena CREATE_CHILD_SA napravi novi par; vidi primjer „Obnova ključeva”.',
      capTraffic: 'Promet ide starim parom SA-ova: SPI {spi}, slijedni broj {seq}.',
      capSoft: '{who}: istječe meki vijek SA-a. Vrijeme je za nove ključeve, prije nego što SA prestane vrijediti.',
      capCcs: 'CREATE_CHILD_SA, unutar postojećeg IKE SA-a i šifrirano: novi par SA-ova, {b} i {a}, s istim selektorima. IKE SA ostaje isti.',
      capMoved: 'Promet prelazi na novi SA {spi}; slijedni broj kreće ispočetka, od {seq}.',
      capDelete: 'INFORMATIONAL s Delete: svaka strana briše stari SA koji prima, navodeći njegov SPI ({a}, {b}). Stari par više ne postoji.',
      capReply: '10.2.0.9 odgovara: {who} šalje drugim SA-om novog para, {spi}. Jedan SA nosi promet samo u jednom smjeru.',

      explain:
        '<p><b>IKE uspostavlja, ESP nosi.</b> IKEv2 najprije gradi upravljački kanal, <em lang="en">IKE SA</em>, u dvije ' +
        'razmjene. <em lang="en">IKE_SA_INIT</em> je <em lang="en">key exchange</em> (razmjena ključa) Diffie–Hellmanom, ' +
        'nešifrirano; nakon nje strane dijele ključeve, ali ne znaju s kim. <em lang="en">IKE_AUTH</em> putuje već ' +
        'šifriran: svaka strana dokazuje identitet (<em lang="en">pre-shared key</em>, unaprijed dijeljeni ključ, ili ' +
        '[[certificate]]) i dogovara prvi par <em lang="en">Child SA</em> za podatke. Same podatke IKE nikad ne nosi.</p>' +
        '<p><em lang="en">Security association</em> (sigurnosna asocijacija, SA) jednosmjerna je: prepoznaje se po SPI-ju, ' +
        'protokolu (ESP) i odredištu. Za promet u oba smjera treba par, a SPI bira strana koja prima.</p>' +
        '<p>Koji paket ulazi u koji SA, odlučuje <em lang="en">traffic selector</em> (selektor prometa) i SPD, baza ' +
        'sigurnosnih politika pošiljatelja: ZAŠTITI (<em lang="en">PROTECT</em>), ODBACI (<em lang="en">DISCARD</em>) ' +
        'ili PROPUSTI (<em lang="en">BYPASS</em>). Ovdje pobjeđuje najuži unos.</p>' +
        '<p><em lang="en">Tunnel mode</em> (tunelski način): cijeli izvorni paket dobiva novo vanjsko zaglavlje, pa ' +
        '[[gateway]] štiti računala iza sebe. <em lang="en">Transport mode</em> (transportni način): zaglavlje ostaje, ' +
        'štiti se samo sadržaj, a sudionici su sama računala. Oba koriste isti ESP: razlika nije u jačini, nego u tome ' +
        'koga se štiti. ESP šifrira i autenticira; AH bi samo autenticirao, i to zajedno s nepromjenjivim dijelom vanjskog IP zaglavlja, a ovdje se ne prikazuje. Vanjsko zaglavlje s protokolom 50 kaže da slijedi ESP.</p>',

      // lane names (fixed words kept for the gate's word check)
      gwA: 'GW-A',
      gwB: 'GW-B'
    },

    en: {
      stage: 'An IPsec tunnel between two peers: IKE, SAs and ESP',

      // params
      mode: 'Mode',
      modeTunnel: 'tunnel',
      modeTransport: 'transport',
      auth: 'Authentication',
      authPsk: 'pre-shared key',
      authCert: 'certificate',
      action: 'Action',
      actBringUp: 'bring-up',
      actSend: 'send',
      actRekey: 'rekey',
      selectorMatch: 'Destination in the selectors',
      selectorMatchHint: 'Off: the packet goes to 10.2.1.9, outside the tunnel\'s selectors.',
      notRekey: 'Does not apply to a rekey.',

      // presets
      presetS2s: 'Site to site',
      presetS2sHint: 'The tunnel comes up and 10.1.0.5 → 10.2.0.9 crosses it in tunnel mode.',
      presetTransport: 'Transport mode',
      presetTransportHint: 'Host to host: the original header stays.',
      presetNoSel: 'Outside the selectors',
      presetNoSelHint: 'A packet for 10.2.1.9 does not enter the tunnel.',
      presetRekey: 'Rekey',
      presetRekeyHint: 'A new SA pair, traffic moves to it, the old one is deleted.',

      // legend
      legIke: 'IKE SA (control)',
      legEsp: 'ESP SA (data), with its SPI',
      legEnc: 'encrypted',
      legTunnel: 'tunnel: a new outer header',
      legTransport: 'transport: the header stays',
      legOk: 'check passed / failed',
      legChanged: 'changed',

      // lane cards
      laneHostA: 'Host A',
      laneHostB: 'Host B',
      genHostA: 'Host A',
      genHostB: 'Host B',
      laneRouterA: 'Router A',
      laneRouterB: 'Router B',
      tagPeer: 'IPsec',
      kAddr: 'address',
      kIke: 'IKE SA',
      kOut: '→ out',
      kIn: '← in',
      ikeNone: 'none',
      ikeKeyed: 'keys, not authenticated',
      none: 'none',
      plainHost: 'No IPsec: sends and receives plain IP. Its gateway protects it.',
      plainRouter: 'No IPsec: routes inside the private network. It cannot read the ESP.',

      // chart
      chartEmpty: 'Nothing on the network yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteBorn: 'an application sends',
      noteMatch: 'SPD: {act}',
      noteDecrypted: 'SPI ✓ ICV ✓ decrypted',
      noteNoSA: '✕ unknown SPI',
      noteAuthFail: '✕ bad ICV',
      noteTsFail: '✕ outside the selectors',
      noteDelivered: '✓ handed to TCP',
      noteDiscarded: '✕ discarded',
      noteBypassed: 'out in the clear',
      noteLifetime: 'SA lifetime: rekey before it ends',
      noteSoft: 'soft lifetime reached',

      // SPD table (K4)
      spdTitle: 'SPD at {who}, traffic from {src}',
      colDst: 'destination',
      colAction: 'action',
      markIdle: 'waiting for a packet',
      actProtect: 'PROTECT',
      actDiscard: 'DISCARD',
      actBypass: 'BYPASS',
      implicitAny: 'everything else',
      wWin: 'decides',
      wBeaten: 'wider',
      outProtect: 'into SA {spi}',
      outDiscard: 'discarded',
      outBypass: 'in the clear',

      // packet view
      pkTitle: 'Packet',
      pkNone: 'No packet in this step.',
      pkOriginal: 'original',
      pkWire: 'on the wire',
      pkTitleTunnel: 'Packet, tunnel mode',
      pkTitleTransport: 'Packet, transport mode',
      pkDelivered: 'delivered',
      pkRequest: 'request',
      pkResponse: 'response',
      pkData: 'data',
      pkTrailer: 'ESP trailer',
      pkNext: 'next {n}',
      pkEncrypted: 'encrypted',
      pkAuthenticated: 'authenticated (ICV)',
      pkSk: 'encrypted with the IKE SA keys (SK)',
      pkDhBoth: 'each side computes',
      pkVerdictProtect: 'SPD: PROTECT, into SA {spi}',
      pkVerdictDiscard: '✕ discarded at {who}: not into the tunnel, not out in the clear',
      pkVerdictRecv: 'SPI {spi} ✓ · ICV ✓ · decrypted',
      pkVerdictDeliver: '✓ addresses within the selectors · delivered to {dst}',

      // captions
      capStartTunnel: 'Two gateways, GW-A and GW-B, each protect their own network, 10.1.0.0/24 and 10.2.0.0/24. There is nothing between them yet: no keys, no SAs.',
      capStartTransport: 'Hosts 10.1.0.5 and 10.2.0.9, in two subnets of the same private network, will protect their own traffic; the routers between them only forward. No keys yet.',
      capStartUp: 'The tunnel is already up: an IKE SA and a pair of ESP SAs from earlier.',
      capStartUpTransport: 'The hosts already have an IKE SA and a pair of ESP SAs from earlier.',
      peersTunnel: 'the gateways {a} and {b}',
      peersTransport: 'the hosts {a} and {b}',
      capInit: 'IKE_SA_INIT: {peers} agree keys for the control channel with Diffie–Hellman. Proposals, KE and nonces go in the clear: {kei} and {ker}, and both sides compute {s}. Nobody has proved who they are yet.',
      capAuth: 'IKE_AUTH, already encrypted with the keys from step 1 (SK): each side proves who it is {how}, and the first pair of ESP SAs is created, with traffic selectors {tsi} ↔ {tsr}. The IKE SA is up.',
      howPsk: 'with the pre-shared key',
      howCert: 'with a certificate and a signature',
      capSendTunnel: 'Host 10.1.0.5 sends a packet to {dst}. It goes to its gateway as plain IP: on the local network it is not protected.',
      capSendTransport: 'An application on 10.1.0.5 sends a packet to {dst}. The host is its own IPsec peer, so the packet has not left it yet.',
      capMatchProtect: '{who} looks the packet up in its SPD: {dst} lies in {tsr} and in 10.0.0.0/8. The narrower entry wins, PROTECT, through outbound SA {spi}.',
      capMatchDiscard: '{who} looks the packet up in its SPD: {dst} is not in the tunnel\'s selectors ({tsr}), only in 10.0.0.0/8, and that entry says DISCARD.',
      capPolicy: 'The packet is discarded at {who} already: outside the selectors it does not enter the tunnel, and private traffic may not go out in the clear either. The other side sees nothing.',
      capWrapTunnel: 'Tunnel mode: the whole original packet gets a new outer IP header. ESP encrypts and authenticates it (SPI {spi}, sequence number {seq}); on the wire only the gateways\' addresses show, {src} → {dst}.',
      capWrapTransport: 'Transport mode: the original IP header stays, and ESP goes in behind it, protecting only the payload (TCP). The outer addresses are the hosts\' own, {src} → {dst}.',
      capReceive: '{who} finds its inbound SA by SPI {spi}, checks the ICV (nobody changed the packet), and only then decrypts.',
      capDeliverTunnel: 'GW-B checks the inner addresses against that SA\'s selectors ({tsi} → {tsr}). They match, so the packet goes on to {dst} as plain IP.',
      capDeliverTransport: 'Host B checks the addresses against the SA\'s selectors. They match, so it hands the payload to TCP: the protection ran from host to host.',
      capLifetime: 'An SA does not last for ever: each side sets its lifetime by its own policy (here 1 h). Before it ends, a CREATE_CHILD_SA exchange makes a new pair; see the "Rekey" example.',
      capTraffic: 'Traffic runs on the old SA pair: SPI {spi}, sequence number {seq}.',
      capSoft: '{who}: the SA\'s soft lifetime runs out. Time for new keys, before the SA stops being valid.',
      capCcs: 'CREATE_CHILD_SA, inside the existing IKE SA and encrypted: a new SA pair, {b} and {a}, with the same selectors. The IKE SA stays the same.',
      capMoved: 'Traffic moves to the new SA {spi}; the sequence number starts again at {seq}.',
      capDelete: 'INFORMATIONAL with Delete: each side deletes the old SA it receives on, naming its SPI ({a}, {b}). The old pair is gone.',
      capReply: '10.2.0.9 answers: {who} sends on the other SA of the new pair, {spi}. One SA carries traffic in one direction only.',

      explain:
        '<p><b>IKE sets up, ESP carries.</b> IKEv2 first builds a control channel, the IKE SA, in two exchanges. ' +
        'IKE_SA_INIT is a key exchange with Diffie–Hellman, in the clear; after it the sides share keys but do not know ' +
        'whom with. IKE_AUTH is already encrypted: each side proves who it is (a pre-shared key or a [[certificate]]) and ' +
        'they agree the first Child SA pair for the data. IKE never carries the data itself.</p>' +
        '<p>A security association (SA) is one-way: it is found by its SPI, the protocol (ESP) and the destination. ' +
        'Traffic both ways needs a pair, and the receiving side picks the SPI.</p>' +
        '<p>Which packet enters which SA is decided by the traffic selectors and the sender\'s SPD, its security policy ' +
        'database: PROTECT, DISCARD or BYPASS. Here the narrowest entry wins.</p>' +
        '<p>Tunnel mode: the whole original packet gets a new outer header, so a [[gateway]] protects the hosts behind ' +
        'it. Transport mode: the header stays, only the payload is protected, and the hosts themselves are the peers. ' +
        'Both use the same ESP: the difference is not strength but who is protected. ESP encrypts and authenticates; AH ' +
        'would only authenticate, covering the unchanging part of the outer IP header too, and is not shown here. The outer ' +
        'header\'s protocol 50 says that ESP follows.</p>',

      // lane names (fixed words kept for the gate's word check)
      gwA: 'GW-A',
      gwB: 'GW-B'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
