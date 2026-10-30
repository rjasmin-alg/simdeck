/* SPDX-License-Identifier: AGPL-3.0-or-later
   wireguard: every visible string, Croatian and English (docs/sim-ui.md §9). Same keys and placeholders in both.
   Addresses, keys, prefixes and message names are data: the page puts them in translate="no" elements. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Dva sudionika tunela: rukovanje, AllowedIPs i adrese',

      // params
      action: 'Radnja',
      actHandshake: 'Rukovanje',
      actSend: 'Slanje',
      actRoam: 'Roaming',
      innerDst: 'Unutarnje odredište',
      innerDstHint: 'Kamo ide paket unutar tunela.',
      allowedOk: 'Izvor u AllowedIPs',
      allowedOkHint: 'Isključeno: izvor je 192.168.1.20, računalo iza A koje B ne dopušta.',
      endpointKnown: 'A zna adresu sudionika B',
      endpointKnownHint: 'Isključeno: A ima ključ sudionika B, ali ne i njegovu adresu.',
      onlyWithSend: 'Samo uz slanje ili roaming.',

      // presets
      presetHandshake: 'Rukovanje',
      presetHandshakeHint: 'Dvije poruke i obje strane imaju ključeve sesije.',
      presetRouting: 'Usmjeravanje',
      presetRoutingHint: 'Paket za 10.0.0.2: AllowedIPs bira sudionika B.',
      presetDrop: 'Izvor izvan AllowedIPs',
      presetDropHint: 'B dešifrira paket, a zatim ga odbacuje.',
      presetRoaming: 'Roaming',
      presetRoamingHint: 'A mijenja adresu, B ju uči iz sljedećeg paketa.',

      // legend
      legKey: 'statički javni ključ',
      legEph: 'privremeni ključ',
      legSession: 'ključ sesije',
      legTunnel: 'paket u tunelu',
      legMatch: 'poklapa se / ne',
      legPin: 'adresa',
      legChanged: 'promijenjeno',

      // lane cards
      peerA: 'Sudionik A',
      peerB: 'Sudionik B',
      initiator: 'pokreće',
      responder: 'odgovara',
      kAddr: 'adresa',
      kKeys: 'ključevi',
      kPriv: 'privatni',
      kPeer: 'sudionik {p}',
      kSession: 'sesija',
      kNone: 'nema',
      kUnknown: 'još ne zna',
      kSend: 'šalje {k}',
      kRecv: 'prima {k}',

      // chart
      chartEmpty: 'Na mreži još ništa.',
      earlier: ['↑ još {n} raniji redak', '↑ još {n} ranija retka', '↑ još {n} ranijih redaka'],
      reKnows: 'prepoznaje A',
      reNewAddr: 'nova adresa A',
      ctr: 'brojač {n}',
      noteKeys: 'ključevi sesije',
      noteLookup: 'traži {ip}',
      noteNoPeer: 'nema sudionika',
      noteOther: 'za C, nije nacrtan',
      noteNoEp: 'ne zna adresu sudionika B',
      noteOk: '✓ isporučen',
      noteDrop: '✕ odbačen, bez odgovora',
      noteRoam: 'nova adresa',

      // tables (K4)
      tabA: 'AllowedIPs kod A: kome šifrirati',
      tabB: 'AllowedIPs kod B: je li izvor dopušten',
      colPrefix: 'prefiks',
      colPeer: 'sudionik',
      markIdle: 'čeka paket',
      implA: 'nijedan prefiks',
      implAAct: 'ne šalje',
      implB: 'izvan AllowedIPs',
      implBAct: 'odbaci',
      wWin: 'najdulji',
      wBeaten: 'kraći',
      outEncrypt: 'šifrira za {p}',
      outNone: 'nema sudionika',
      outAccept: 'od A: prima',
      outDrop: 'odbačen',
      notDrawn: 'nije nacrtan',

      // packet card
      pkTitle: 'Paket',
      pkNone: 'Još nema paketa.',
      pkWire: 'Na mreži',
      pkAtA: 'Kod A, prije šifriranja',
      pkAtB: 'Kod B, nakon dešifriranja',
      pkInner: 'unutarnji paket',
      pkData: 'podaci',
      pkEph: 'privremeni ključ',
      pkStatic: 'statički ključ od A, šifriran za B',
      pkTime: 'vrijeme, šifrirano',
      pkEmpty: 'prazno, šifrirano',
      pkRecv: 'primatelj, brojač {n}',
      pkEncWith: 'šifrirano s {k}',
      pkDelivered: '✓ isporučen na {dst}',
      pkDropped: '✕ odbačen: izvor {src} nije u AllowedIPs sudionika A',
      pkNotSent: '✕ ne šalje se',
      pkForC: '→ za sudionika C, ne za B',

      // captions
      capStart: 'Dva sudionika, svaki sa svojim parom ključeva. Još ne znaju jedan za drugoga i ništa ne šalju.',
      cap1: 'Svaki sudionik upisuje javni ključ drugoga i njegove AllowedIPs, bez certifikata i korisničkih imena. Na mreži je tišina: dok nema prometa, ništa se ne šalje.',
      cap1NoEp: 'A pritom ne zna adresu sudionika B.',
      cap2: 'A šalje Initiation: privremeni ključ, nešifriran, i svoj statički javni ključ, šifriran za javni ključ sudionika B. B prepoznaje A po ključu i pamti adresu s koje je paket stigao: {ep}.',
      cap2NoEp: 'A zna ključ sudionika B, ali ne i njegovu adresu: nema kamo poslati Initiation. Na mrežu ne ide ništa.',
      cap3: 'B odgovara porukom Response na adresu koju je upravo naučio. To je druga i posljednja poruka rukovanja.',
      cap3None: 'Do B ništa nije stiglo, pa B šuti.',
      cap4: 'Nakon jednog povratnog puta (1-RTT) obje strane imaju isti par ključeva sesije: A šalje s k1, a B s k1 prima; s k2 obrnuto.',
      cap4None: 'Bez rukovanja nema ključeva sesije.',
      cap5: 'A traži odredište {dst} u svojim AllowedIPs: pobjeđuje {prefix} sudionika {peer}, najdulji prefiks koji ga sadrži.',
      cap5Beaten: '{other} sudionika C također ga sadrži, ali je kraći.',
      cap5None: 'A traži {dst} u svojim AllowedIPs: nijedan prefiks ga ne sadrži. Za tu adresu A nema ni sudionika ni ključa.',
      cap6: 'Odredišna adresa {dst} poklapa se s AllowedIPs sudionika B — paket se šifrira ključem sesije sa sudionikom B (k1) i u UDP-u šalje na {ep}.',
      cap6NoPeer: 'Paket se ne šalje: ničije AllowedIPs ne sadrže {dst}. Na mrežu ne ide ništa.',
      cap6Other: 'Paket pripada sudioniku C: A bi najprije obavio rukovanje s C (ovdje nije nacrtan). Sudionik B ne dobiva ništa.',
      cap6NoEp: 'A nema sesiju sa sudionikom B, jer bez adrese nije bilo rukovanja: paket se ne šalje.',
      cap7: 'B dešifrira paket s k1 i provjerava unutarnji izvor {src}: on je u AllowedIPs sudionika A, pa B isporučuje paket na {dst}.',
      cap7Drop: 'B dešifrira paket, ali unutarnji izvor {src} nije u AllowedIPs sudionika A: paket se odbacuje, bez ikakvog odgovora. AllowedIPs je i ruta i filtar.',
      cap7None: 'Do B ništa nije stiglo; B nema što provjeriti i šuti.',
      cap8: 'A prelazi u drugu mrežu: njegova vanjska adresa sada je {ep}. Nikome to ne javlja; B i dalje pamti {old}.',
      cap9NoneUnknown: 'A ne šalje ništa sudioniku B, pa B i dalje ne zna adresu sudionika A.',
      cap8Unknown: 'A prelazi u drugu mrežu: njegova vanjska adresa sada je {ep}. B ionako ne zna njegovu adresu.',
      cap9: 'Sudionik A promijenio je adresu; B ju je naučio iz sljedećeg provjerenog paketa. Odgovori sudionika B sada idu na {ep}.',
      cap9Drop: 'Sam paket ipak je odbačen: izvor {src} nije u AllowedIPs sudionika A.',
      cap9None: 'A ne šalje ništa sudioniku B, pa B nema iz čega naučiti novu adresu: i dalje pamti {old}.',

      explain:
        '<p>WireGuard je VPN: <em lang="en">tunnel</em> (tunel) između dviju strana, od kojih je svaka <em lang="en">peer</em> ' +
        '(sudionik). Kroz tunel putuju obični IP paketi, šifrirani i zapakirani u UDP. Svaki sudionik ima statički ' +
        '[[private key]] i [[public key]], i to je sav njegov identitet: nema certifikata ni korisničkih imena. ' +
        'Javni ključ drugoga upisuje se u konfiguraciju unaprijed.</p>' +
        '<p>[[handshake]] ima samo dvije poruke, <em lang="en">Initiation</em> i <em lang="en">Response</em> (jedan ' +
        'povratni put, 1-RTT). Nakon njih obje strane imaju isti par ključeva, <em lang="en">session key</em> (ključ sesije). ' +
        'U stvarnosti rukovanje pokreće prvi paket koji treba poslati; ovdje je izdvojeno kao zaseban korak.</p>' +
        '<p><em lang="en">Cryptokey routing</em> (usmjeravanje po ključu): svaki unos u AllowedIPs sudionika je ' +
        '[[network prefix]]. Za paket koji odlazi, odredište bira sudionika, a time i ključ (najdulji prefiks ' +
        'pobjeđuje). Za paket koji stiže, unutarnji izvor mora biti u AllowedIPs sudionika čiji ga je ključ ' +
        'dešifrirao, inače se odbacuje. AllowedIPs je dakle i tablica usmjeravanja i [[access control list]].</p>' +
        '<p><em lang="en">Roaming</em> (promjena mreže): <em lang="en">endpoint</em> (krajnja točka, adresa i ' +
        'priključak) sudionika uči se iz vanjske adrese zadnjeg <b>provjerenog</b> paketa. Sudionik može promijeniti ' +
        'mrežu bez nove konfiguracije, a paket s lažnom adresom ne prolazi provjeru i ništa ne mijenja. ' +
        'Paket koji ne prođe provjeru ne dobiva odgovor, pa se tunel izvana teško otkriva.</p>'
    },
    en: {
      stage: 'Two tunnel peers: handshake, AllowedIPs and addresses',

      action: 'Action',
      actHandshake: 'Handshake',
      actSend: 'Send',
      actRoam: 'Roaming',
      innerDst: 'Inner destination',
      innerDstHint: 'Where the packet inside the tunnel goes.',
      allowedOk: 'Source in AllowedIPs',
      allowedOkHint: 'Off: the source is 192.168.1.20, a host behind A that B does not allow.',
      endpointKnown: 'A knows B\'s endpoint',
      endpointKnownHint: 'Off: A has B\'s key but not its address.',
      onlyWithSend: 'Only with send or roaming.',

      presetHandshake: 'Handshake',
      presetHandshakeHint: 'Two messages, and both sides hold session keys.',
      presetRouting: 'Routing',
      presetRoutingHint: 'A packet for 10.0.0.2: AllowedIPs picks peer B.',
      presetDrop: 'Source outside AllowedIPs',
      presetDropHint: 'B decrypts the packet, then drops it.',
      presetRoaming: 'Roaming',
      presetRoamingHint: 'A changes address; B learns it from the next packet.',

      legKey: 'static public key',
      legEph: 'ephemeral key',
      legSession: 'session key',
      legTunnel: 'tunnel packet',
      legMatch: 'match / no match',
      legPin: 'endpoint',
      legChanged: 'changed',

      peerA: 'Peer A',
      peerB: 'Peer B',
      initiator: 'initiator',
      responder: 'responder',
      kAddr: 'address',
      kKeys: 'keys',
      kPriv: 'private',
      kPeer: 'peer {p}',
      kSession: 'session',
      kNone: 'none',
      kUnknown: 'not known yet',
      kSend: 'send {k}',
      kRecv: 'receive {k}',

      chartEmpty: 'Nothing on the wire yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      reKnows: 'knows A by key',
      reNewAddr: 'A\'s new address',
      ctr: 'counter {n}',
      noteKeys: 'session keys',
      noteLookup: 'look up {ip}',
      noteNoPeer: 'no peer',
      noteOther: 'for C, not drawn',
      noteNoEp: 'no endpoint for B',
      noteOk: '✓ delivered',
      noteDrop: '✕ dropped, no reply',
      noteRoam: 'new address',

      tabA: 'A\'s AllowedIPs: whom to encrypt for',
      tabB: 'B\'s AllowedIPs: is the source allowed?',
      colPrefix: 'prefix',
      colPeer: 'peer',
      markIdle: 'waiting for a packet',
      implA: 'no prefix',
      implAAct: 'not sent',
      implB: 'outside AllowedIPs',
      implBAct: 'drop',
      wWin: 'longest',
      wBeaten: 'shorter',
      outEncrypt: 'encrypt for {p}',
      outNone: 'no peer',
      outAccept: 'from A: accept',
      outDrop: 'dropped',
      notDrawn: 'not drawn',

      pkTitle: 'Packet',
      pkNone: 'No packet yet.',
      pkWire: 'On the wire',
      pkAtA: 'At A, before encryption',
      pkAtB: 'At B, after decryption',
      pkInner: 'inner packet',
      pkData: 'data',
      pkEph: 'ephemeral key',
      pkStatic: 'A\'s static key, encrypted to B',
      pkTime: 'timestamp, encrypted',
      pkEmpty: 'empty, encrypted',
      pkRecv: 'receiver, counter {n}',
      pkEncWith: 'encrypted with {k}',
      pkDelivered: '✓ delivered to {dst}',
      pkDropped: '✕ dropped: source {src} is not in A\'s AllowedIPs',
      pkNotSent: '✕ not sent',
      pkForC: '→ for peer C, not for B',

      capStart: 'Two peers, each with its own key pair. They do not know each other yet, and nothing is sent.',
      cap1: 'Each peer enters the other\'s public key and its AllowedIPs, with no certificates and no user names. The wire stays silent: with no traffic, nothing is sent.',
      cap1NoEp: 'A does not know B\'s endpoint.',
      cap2: 'A sends the Initiation: an ephemeral key in the clear, and its static public key encrypted to B\'s public key. B recognises A by that key and records the address the packet came from: {ep}.',
      cap2NoEp: 'A knows B\'s key but not its endpoint: there is nowhere to send the Initiation. Nothing goes on the wire.',
      cap3: 'B answers with the Response, to the address it has just learned. That is the second and last handshake message.',
      cap3None: 'Nothing reached B, so B stays silent.',
      cap4: 'After one round trip (1-RTT) both sides hold the same pair of session keys: A sends with k1 and B receives with k1; k2 the other way.',
      cap4None: 'No handshake, no session keys.',
      cap5: 'A looks {dst} up in its AllowedIPs: {prefix} of peer {peer} wins, the longest prefix that contains it.',
      cap5Beaten: 'Peer C\'s {other} contains it too, but is shorter.',
      cap5None: 'A looks {dst} up in its AllowedIPs: no prefix contains it. A has no peer, and no key, for that address.',
      cap6: 'Destination {dst} matches peer B\'s AllowedIPs — the packet is encrypted with the session key A shares with B (k1) and sent in UDP to {ep}.',
      cap6NoPeer: 'The packet is not sent: no peer\'s AllowedIPs contain {dst}. Nothing goes on the wire.',
      cap6Other: 'The packet belongs to peer C: A would first run a handshake with C (not drawn here). Peer B gets nothing.',
      cap6NoEp: 'A has no session with B, since without an endpoint there was no handshake: the packet is not sent.',
      cap7: 'B decrypts it with k1 and checks the inner source {src}: it is in peer A\'s AllowedIPs, so B delivers the packet to {dst}.',
      cap7Drop: 'B decrypts it, but the inner source {src} is not in peer A\'s AllowedIPs: the packet is dropped, with no reply at all. AllowedIPs is route and filter at once.',
      cap7None: 'Nothing reached B; B has nothing to check and stays silent.',
      cap8: 'A moves to another network: its outer address is now {ep}. It tells nobody; B still has {old}.',
      cap8Unknown: 'A moves to another network: its outer address is now {ep}. B has no address for A anyway.',
      cap9: 'Peer A changed its address; B learned it from the next authenticated packet. B\'s replies now go to {ep}.',
      cap9Drop: 'The packet itself is still dropped: source {src} is not in A\'s AllowedIPs.',
      cap9None: 'A sends nothing to B, so B has nothing to learn the new address from: it still has {old}.',
      cap9NoneUnknown: 'A sends nothing to B, so B still has no address for A.',

      explain:
        '<p>WireGuard is a VPN: a tunnel between two peers that carries ordinary IP packets, encrypted and wrapped ' +
        'in UDP. Each peer has a static [[private key]] and [[public key]], and that is all its identity: no ' +
        'certificates, no user names. The other side\'s public key goes into the configuration beforehand.</p>' +
        '<p>The [[handshake]] has just two messages, <em>Initiation</em> and <em>Response</em> (one round trip, ' +
        '1-RTT). After them both sides hold the same pair of session keys. In practice the first packet to send ' +
        'starts the handshake; here it is a step of its own.</p>' +
        '<p>Cryptokey routing: each entry in a peer\'s AllowedIPs is a [[network prefix]]. For an outgoing packet the ' +
        'destination picks the peer, and with it the key (the longest prefix wins). For an incoming packet the ' +
        'inner source must lie in the AllowedIPs of the peer whose key decrypted it, or it is dropped. So ' +
        'AllowedIPs is both a routing table and an [[access control list]].</p>' +
        '<p>Roaming: a peer\'s endpoint (address and port) is learned from the outer address of its latest ' +
        '<b>authenticated</b> packet. A peer can change networks without new configuration, and a packet with a ' +
        'forged address fails the check and changes nothing. A packet that fails gets no reply, so the tunnel is ' +
        'hard to probe from outside.</p>'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
