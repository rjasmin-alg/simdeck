/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of http-versions, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms follow URM ch13–14: veza, tok, rukovanje, ponovni prijenos, kružno vrijeme (ch06, "kružno (round-trip)
   vrijeme"); multipleksiranje and zastoj na čelu reda are not in kit/glossary.js yet and are written out (NOTES.md,
   "Term pairs"). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri vremenske crte: ista stranica preko HTTP/1.1, HTTP/2 i HTTP/3',
      rtt: 'Kružno vrijeme (RTT)',
      objects: 'Broj objekata na stranici',
      h1conns: 'Broj HTTP/1.1 veza',
      h1connsHint: 'Preglednik otvara do 6 veza prema jednom poslužitelju.',
      loss: 'Gubitak jednog segmenta',
      lossHint: 'Jedan se segment odabranog objekta izgubi.',
      lostObject: 'Izgubljen segment objekta',
      lostOff: 'Uključi gubitak.',
      ms: '{v}\u00a0ms',

      'preset_no-loss': 'Bez gubitka',
      'hint_no-loss': 'RTT 100 ms, 6 objekata, 6 HTTP/1.1 veza',
      'preset_one-connection': 'Jedna HTTP/1.1 veza',
      'hint_one-connection': 'Kao primjer 1, ali HTTP/1.1 ima samo jednu vezu',
      preset_loss: 'Izgubljen segment',
      hint_loss: 'Kao primjer 1, gubitak na objektu 1',
      'preset_high-rtt': 'Dugo kružno vrijeme',
      'hint_high-rtt': 'RTT 250 ms, 12 objekata, gubitak na objektu 1',

      legSetup: 'uspostava veze (TCP, TLS, QUIC)',
      legObject: 'objekt: zahtjev i odgovor',
      legBlocked: 'čeka ponovni prijenos',
      legLost: 'izgubljen segment',
      legChanged: 'kraj pomaknut ili nov',

      h1: 'HTTP/1.1',
      h2: 'HTTP/2',
      h3: 'HTTP/3',
      sub1: ['{n} TCP veza', '{n} TCP veze', '{n} TCP veza'],
      sub2: ['1 TCP veza, {n} tok', '1 TCP veza, {n} toka', '1 TCP veza, {n} tokova'],
      sub3: ['1 QUIC veza (UDP), {n} tok', '1 QUIC veza (UDP), {n} toka', '1 QUIC veza (UDP), {n} tokova'],
      setupTcp: 'TCP',
      setupTls: 'TLS',
      setupQuic: 'QUIC',
      waits: 'čeka',
      done: 'gotovo',
      was: 'bilo {v}\u00a0ms',
      axis: 'vrijeme (ms)',
      objTitle: 'Objekt {id}: {s}–{e}\u00a0ms',
      objWait: 'Objekt {id}: {s}–{e}\u00a0ms, od toga {w}\u00a0ms čeka',
      connTitle: 'Veza {n}',

      capNoLoss: 'Stranica je gotova: HTTP/1.1 u {a}\u00a0ms, HTTP/2 u {b}\u00a0ms, HTTP/3 u {c}\u00a0ms. HTTP/3 štedi jedno kružno ' +
        'vrijeme: QUIC uspostavlja vezu i TLS zajedno, a TCP i TLS idu jedan za drugim.',
      capSerial: 'HTTP/1.1: na jednoj vezi ide do {k} zahtjeva zaredom i svaki čeka odgovor na prethodni, pa je stranica ' +
        'gotova u {a}\u00a0ms. HTTP/2 šalje sve zahtjeve ({n}) odjednom, kao tokove na jednoj vezi: {b}\u00a0ms.',
      capLoss: 'HTTP/2: izgubljen je jedan TCP segment objekta {k}, a {all} njegov ponovni prijenos. Stranica je gotova ' +
        'u {a}\u00a0ms umjesto {b}\u00a0ms. HTTP/3: čeka samo tok {k}, gotovo u {c}\u00a0ms.',
      allStreams: ['{n} tok čeka', 'sva {n} toka čekaju', 'svih {n} tokova čeka'],
      bothStreams: 'oba toka čekaju',
      capLossOne: 'Jedan objekt: svaka inačica čeka jedno kružno vrijeme na ponovni prijenos izgubljenog segmenta. Iza ' +
        'njega nema ničeg drugog što bi zapelo.',

      explain: '<p><b>HTTP/1.1</b> na jednoj vezi šalje jedan zahtjev i čeka odgovor prije sljedećeg (preglednici ne šalju zahtjeve u nizu bez čekanja). Više objekata ' +
        'odjednom dobiva samo s više veza, a svaka plaća svoje [[handshake]]: TCP i TLS, po jedno kružno vrijeme (RTT).</p>' +
        '<p><b>HTTP/2</b> šalje sve zahtjeve odjednom na <b>jednoj</b> TCP vezi, svaki kao svoj tok: to je ' +
        '<i>multiplexing</i> (multipleksiranje). <b>HTTP/3</b> radi isto preko QUIC-a, koji ide preko UDP-a i uspostavlja ' +
        'vezu i TLS u jednom kružnom vremenu. Metode, statusni kodovi i [[request and response]] isti su u sve tri ' +
        'inačice; mijenja se samo kako putuju.</p>' +
        '<p>TCP predaje bajtove samo pravim redom. Kad se izgubi segment, sve iza njega na toj vezi čeka ponovni prijenos, ' +
        'pa u HTTP/2 jedan gubitak zaustavi <b>sve</b> tokove: <i>head-of-line blocking</i> (zastoj na čelu reda). ' +
        'QUIC predaje svaki tok zasebno, pa kad se izgubi QUIC paket, čeka samo tok kojem je pripadao. „UDP je nepouzdan” vrijedi za ' +
        'UDP, ne za QUIC: pouzdanost QUIC gradi sam.</p>' +
        '<p>HTTP/2 nije uvijek brži: uz gubitak (primjer 3) pet od šest objekata stiže kasnije nego preko šest HTTP/1.1 ' +
        'veza.</p>' +
        '<p><b>Pojednostavljeno:</b> jedan objekt = jedno kružno vrijeme, ponovni prijenos = još jedno; propusnost, ' +
        'spori početak, vrijeme poslužitelja i sažimanje zaglavlja nisu u modelu.</p>'
    },
    en: {
      stage: 'Three timelines: the same page over HTTP/1.1, HTTP/2 and HTTP/3',
      rtt: 'Round-trip time (RTT)',
      objects: 'Objects on the page',
      h1conns: 'HTTP/1.1 connections',
      h1connsHint: 'A browser opens up to 6 connections to one server.',
      loss: 'One segment lost',
      lossHint: 'One segment of the chosen object is lost.',
      lostObject: 'Segment lost from object',
      lostOff: 'Turn loss on.',
      ms: '{v}\u00a0ms',

      'preset_no-loss': 'No loss',
      'hint_no-loss': 'RTT 100 ms, 6 objects, 6 HTTP/1.1 connections',
      'preset_one-connection': 'One HTTP/1.1 connection',
      'hint_one-connection': 'As preset 1, but HTTP/1.1 has only one connection',
      preset_loss: 'A lost segment',
      hint_loss: 'As preset 1, loss on object 1',
      'preset_high-rtt': 'Long round trip',
      'hint_high-rtt': 'RTT 250 ms, 12 objects, loss on object 1',

      legSetup: 'set-up (TCP, TLS, QUIC)',
      legObject: 'object: request and response',
      legBlocked: 'waits for retransmission',
      legLost: 'lost segment',
      legChanged: 'end moved or new',

      h1: 'HTTP/1.1',
      h2: 'HTTP/2',
      h3: 'HTTP/3',
      sub1: ['{n} TCP connection', '{n} TCP connections'],
      sub2: ['1 TCP connection, {n} stream', '1 TCP connection, {n} streams'],
      sub3: ['1 QUIC connection (UDP), {n} stream', '1 QUIC connection (UDP), {n} streams'],
      setupTcp: 'TCP',
      setupTls: 'TLS',
      setupQuic: 'QUIC',
      waits: 'waits',
      done: 'done',
      was: 'was {v}\u00a0ms',
      axis: 'time (ms)',
      objTitle: 'Object {id}: {s}–{e}\u00a0ms',
      objWait: 'Object {id}: {s}–{e}\u00a0ms, {w}\u00a0ms of it waiting',
      connTitle: 'Connection {n}',

      capNoLoss: 'The page is done: HTTP/1.1 at {a}\u00a0ms, HTTP/2 at {b}\u00a0ms, HTTP/3 at {c}\u00a0ms. HTTP/3 saves one round ' +
        'trip: QUIC sets up the connection and TLS together, while TCP and TLS go one after the other.',
      capSerial: 'HTTP/1.1: up to {k} requests go in a row on one connection, each waiting for the response to the one ' +
        'before, so the page is done at {a}\u00a0ms. HTTP/2 sends all the requests ({n}) at once, as streams on one ' +
        'connection: {b}\u00a0ms.',
      capLoss: 'HTTP/2: one TCP segment of object {k} was lost, and {all} for its retransmission. The page is done at ' +
        '{a}\u00a0ms instead of {b}\u00a0ms. HTTP/3: only stream {k} waits, done at {c}\u00a0ms.',
      allStreams: ['its {n} stream waits', 'all {n} streams wait'],
      bothStreams: 'both streams wait',
      capLossOne: 'One object: every version waits one round trip for the lost segment to be retransmitted. There is ' +
        'nothing else behind it to hold back.',

      explain: '<p><b>HTTP/1.1</b> sends one request on a connection and waits for the response before the next (browsers do not pipeline requests). It gets ' +
        'several objects at once only by opening more connections, and each pays for its own [[handshake]]: TCP and ' +
        'TLS, one round-trip time (RTT) each.</p>' +
        '<p><b>HTTP/2</b> sends all requests at once on <b>one</b> TCP connection, each as its own stream: ' +
        '<i>multiplexing</i>. <b>HTTP/3</b> does the same over QUIC, which runs over UDP and sets up the connection and ' +
        'TLS in one round trip. The methods, the status codes and the [[request and response]] are the same in all ' +
        'three versions; only how they travel changes.</p>' +
        '<p>TCP hands bytes over only in order. When a segment is lost, everything behind it on that connection waits ' +
        'for the retransmission, so in HTTP/2 one loss stops <b>every</b> stream: <i>head-of-line blocking</i>. QUIC ' +
        'delivers each stream on its own, so when a QUIC packet is lost only the stream it belonged to waits. "UDP is unreliable" is ' +
        'true of UDP, not of QUIC: QUIC builds its reliability itself.</p>' +
        '<p>HTTP/2 is not always faster: with a loss (preset 3) five of the six objects arrive later than over six ' +
        'HTTP/1.1 connections.</p>' +
        '<p><b>Simplified:</b> one object = one round trip, a retransmission = one more; bandwidth, slow start, server ' +
        'time and header compression are not in the model.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
