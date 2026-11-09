/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of directed-net, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The radio terms are not in
   kit/glossary.js yet, so the term pairs are written out here (NOTES.md "Term pairs").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jedan kanal: stanice, NCS i kanal po odsječcima',
      // params
      mode: 'Mreža',
      modeFree: 'Svi odjednom',
      modeDirected: 'S NCS-om',
      modeBoth: 'Usporedno',
      stations: 'Broj stanica',
      backoff: 'Odgoda nakon dupliranja',
      backoffSame: 'Svi 2',
      backoffMixed: '1, 1, 2, 2, 3…',
      backoffSpread: '1, 2, 3, 4, 5…',
      // presets
      presetSame: 'Svi čekaju 2',
      presetSameHint: 'Pet stanica tipka odjednom, a nakon dupliranja svaka pristojno čeka dva odsječka.',
      presetMixed: 'Mješovite odgode',
      presetMixedHint: 'Odgode 1, 1, 2, 2 i 3 odsječka: parovi se i dalje sudaraju.',
      presetLucky: 'Sretan slučaj',
      presetLuckyHint: 'Odgode 1 do 5: nakon jednog dupliranja svi prođu, ali bez potvrda i bez reda.',
      presetDirected: 'Usmjerena mreža',
      presetDirectedHint: 'NCS otvara mrežu i poziva stanice abecednim redom pozivnih znakova.',
      presetBoth: 'Usporedno',
      presetBothHint: 'Isti incident bez NCS-a (gore) i s NCS-om (dolje), odsječak po odsječak.',
      // legend
      legendHeard: 'čuto: jedna stanica',
      legendDoubled: 'dupliranje: nitko ne čuje',
      legendIdle: 'prazan odsječak',
      legendNcs: 'odašilje NCS',
      legendAck: 'potvrda primitka (ACK)',
      legendChanged: 'promijenjeno u ovom koraku',
      // lanes
      laneFree: 'Svi odjednom, bez NCS-a',
      laneDirected: 'Usmjerena mreža s NCS-om',
      ackImplicit: 'potvrda se ovdje podrazumijeva',
      ackExplicit: 'poruka vrijedi tek s potvrdom',
      delivered: 'predano',
      slotsUsed: 'odsječci',
      doubledSlots: 'duplirani',
      idleSlots: 'prazni',
      // NCS card
      ncsName: 'NCS',
      ncsRole: 'mrežna kontrolna stanica',
      listWaiting: 'čekaju',
      listCalled: 'pozvana',
      listSent: 'čeka potvrdu',
      listDone: 'gotovo',
      listNone: '—',
      // stations
      priority: 'RUTINSKO',
      backoffOf: 'odgoda {b}',
      stNextTry: 'pokušaj u {k}.',
      stTxNow: 'odašilje sad',
      stDoubled: 'duplirano, opet u {k}.',
      stHeard: '✓ čuta u {n}.',
      stWaitCall: 'čeka poziv',
      stCalled: 'pozvana: šalje',
      stSent: 'poslala, čeka potvrdu',
      stAcked: '✓ potvrđeno u {n}.',
      // strip
      channel: 'Kanal, odsječci od oko 15 s',
      cellMsg: 'poruka',
      cellOpen: 'otvara',
      cellClose: 'kraj',
      slotLabel: 'odsječak {n}',
      // captions: single lane
      capFreeStart: ['Incident: {n} stanica ima poruku i svaka tipka u 1. odsječku. NCS-a nema; nakon dupliranja svaka čeka svoju odgodu. Pritisni →.',
        'Incident: {n} stanice imaju poruku i svaka tipka u 1. odsječku. NCS-a nema; nakon dupliranja svaka čeka svoju odgodu. Pritisni →.',
        'Incident: {n} stanica ima poruku i svaka tipka u 1. odsječku. NCS-a nema; nakon dupliranja svaka čeka svoju odgodu. Pritisni →.'],
      capDirStart: 'NCS vodi mrežu: stanice odašilju samo kad ih NCS pozove, abecednim redom pozivnih znakova. Pritisni →.',
      capBothStart: 'Isti incident dvaput: gore bez NCS-a, svaka stanica čeka svoju odgodu; dolje NCS poziva stanice redom. Pritisni →.',
      capSlot: 'Odsječak {n}:',
      capDoubledFirst: '{list} odašilju istodobno. Dupliranje: nitko nije čuo nikoga. Svaka čeka svoju odgodu i pokušava ponovno.',
      capDoubledSame: '{list} opet odašilju istodobno – svi su pristojno čekali po dva odsječka. Dupliranje: nitko nije čuo nikoga.',
      capDoubledAgain: '{list} opet odašilju istodobno: njihovi su ponovni pokušaji pali u isti odsječak. Dupliranje: nitko nije čuo nikoga.',
      capHeard: 'Stanica {st} odašilje sama i čuje se: poruka je predana.',
      capIdle: 'Kanal je prazan: stanice s porukom čekaju svoju odgodu.',
      capOpen: 'NCS otvara mrežu: „Ovdje NCS, mreža je otvorena, stanice se javljaju samo na poziv.“',
      capCall: 'NCS poziva prvu stanicu: „{call}, predajte.“ Svi ostali šute.',
      capCallAck: 'NCS potvrđuje poruku stanice {ack} („primljeno“) i poziva sljedeću: „{call}, predajte.“',
      capMsg: 'Stanica {st} šalje poruku. Kanal je samo njezin: nema dupliranja. Predana je tek kad je NCS potvrdi.',
      capClose: 'NCS potvrđuje posljednju poruku, stanice {ack} („primljeno“).',
      capEndFreeAll: ['Sva {n} poruka predana je u {k} odsječaka, ali samo zato što su se odgode slučajno razlikovale: bez potvrda i bez reda važnosti.',
        'Sve {n} poruke predane su u {k} odsječaka, ali samo zato što su se odgode slučajno razlikovale: bez potvrda i bez reda važnosti.',
        'Svih {n} poruka predano je u {k} odsječaka, ali samo zato što su se odgode slučajno razlikovale: bez potvrda i bez reda važnosti.'],
      capEndFree: 'Nakon {k} odsječaka predano je {d} od {n}.',
      capEndSame: 'Pristojnost koja je jednaka za sve ponavlja sudar zauvijek.',
      capEndPairs: 'Stanice čiji ponovni pokušaji padaju u isti odsječak sudaraju se iznova.',
      capEndDir: ['Sva {n} poruka potvrđena je u {k} odsječaka, redom i bez ijednog dupliranja. Sporije od sretnog slučaja, ali zajamčeno i svaki put jednako.',
        'Sve {n} poruke potvrđene su u {k} odsječaka, redom i bez ijednog dupliranja. Sporije od sretnog slučaja, ali zajamčeno i svaki put jednako.',
        'Svih {n} poruka potvrđeno je u {k} odsječaka, redom i bez ijednog dupliranja. Sporije od sretnog slučaja, ali zajamčeno i svaki put jednako.'],
      // captions: side by side (short)
      capLaneFree: 'Bez NCS-a:',
      capLaneDir: 'S NCS-om:',
      shortDoubled: '{list} – dupliranje.',
      shortHeard: '{st} se čuje.',
      shortIdle: 'tišina.',
      shortDone: 'sve je predano.',
      shortOpen: 'NCS otvara mrežu.',
      shortCall: 'NCS poziva {st}.',
      shortCallAck: 'NCS potvrđuje {ack} i poziva {st}.',
      shortMsg: '{st} šalje poruku.',
      shortClose: 'NCS potvrđuje {ack}.',
      capEndBoth: 'Nakon {k} odsječaka: bez NCS-a predano {a} od {n}, s NCS-om {b} od {n}.',
      listAnd: ' i ',
      // explanation
      explain: '<p>Nakon incidenta svi imaju nešto za javiti i svi tipkaju odjednom. Na jednom kanalu dvije stanice koje odašilju ' +
        'istodobno poništavaju jedna drugu: to je <i>doubling</i> (dupliranje) i nitko ne čuje nijednu poruku.</p>' +
        '<p>Čekanje prije ponavljanja ne pomaže ako svi čekaju jednako dugo: sudar se samo seli u kasniji odsječak. ' +
        'Ni slušanje prije odašiljanja ne pomaže stanicama koje počnu u istom trenutku: nemaju što čuti.</p>' +
        '<p>U <i>directed net</i> (usmjerena mreža) govori samo <i>net control station</i> (mrežna kontrolna stanica, NCS) ili ' +
        'stanica koju je pozvao. NCS otvara mrežu, poziva stanice abecednim redom njihovih <i>call sign</i> (pozivni znak) ' +
        'i svaku poruku potvrđuje na početku sljedećeg poziva: <i>acknowledgement</i> (potvrda primitka, ACK). Poruka bez ' +
        'potvrde nije predana. Nadmetanje za kanal postaje red čekanja.</p>' +
        '<p>NCS mrežu ne čini bržom od sretnog slučaja, nego predvidljivom: 1 + 2·n + 1 odsječaka, svaki put jednako.</p>' +
        '<p>Pojednostavljeno: jedan odsječak traje oko 15 s, odgode su zadane, a ne slučajne, i bez NCS-a potvrdu ' +
        'podrazumijevamo. Pozivni znakovi su izmišljeni.</p>'
    },
    en: {
      stage: 'One channel: the stations, the NCS and the channel by slots',
      // params
      mode: 'Net',
      modeFree: 'Free-for-all',
      modeDirected: 'With an NCS',
      modeBoth: 'Side by side',
      stations: 'Stations',
      backoff: 'Backoff after doubling',
      backoffSame: 'All 2',
      backoffMixed: '1, 1, 2, 2, 3…',
      backoffSpread: '1, 2, 3, 4, 5…',
      // presets
      presetSame: 'Everyone waits 2',
      presetSameHint: 'Five stations key up at once, and after a doubling each politely waits two slots.',
      presetMixed: 'Mixed backoffs',
      presetMixedHint: 'Backoffs of 1, 1, 2, 2 and 3 slots: pairs still collide.',
      presetLucky: 'Lucky',
      presetLuckyHint: 'Backoffs 1 to 5: after one doubling everyone gets through, but with no ACKs and no order.',
      presetDirected: 'Directed net',
      presetDirectedHint: 'The NCS opens the net and calls the stations in alphabetical order of call signs.',
      presetBoth: 'Side by side',
      presetBothHint: 'The same incident without an NCS (top) and with one (bottom), slot by slot.',
      // legend
      legendHeard: 'heard: one station',
      legendDoubled: 'doubling: nobody hears',
      legendIdle: 'idle slot',
      legendNcs: 'NCS transmits',
      legendAck: 'acknowledgement (ACK)',
      legendChanged: 'changed in this step',
      // lanes
      laneFree: 'Free-for-all, no NCS',
      laneDirected: 'Directed net with an NCS',
      ackImplicit: 'the ACK is assumed here',
      ackExplicit: 'a message counts only once ACKed',
      delivered: 'delivered',
      slotsUsed: 'slots',
      doubledSlots: 'doubled',
      idleSlots: 'idle',
      // NCS card
      ncsName: 'NCS',
      ncsRole: 'net control station',
      listWaiting: 'waiting',
      listCalled: 'called',
      listSent: 'awaits ACK',
      listDone: 'done',
      listNone: '—',
      // stations
      priority: 'ROUTINE',
      backoffOf: 'backoff {b}',
      stNextTry: 'tries in {k}',
      stTxNow: 'transmits now',
      stDoubled: 'doubled, again in {k}',
      stHeard: '✓ heard in {n}',
      stWaitCall: 'waits for a call',
      stCalled: 'called: sends',
      stSent: 'sent, awaits ACK',
      stAcked: '✓ ACKed in {n}',
      // strip
      channel: 'Channel, slots of about 15 s',
      cellMsg: 'message',
      cellOpen: 'opens',
      cellClose: 'end',
      slotLabel: 'slot {n}',
      // captions: single lane
      capFreeStart: ['Incident: {n} station has a message and keys up in slot 1. There is no NCS; after a doubling each waits its own backoff. Press →.',
        'Incident: {n} stations have a message and each keys up in slot 1. There is no NCS; after a doubling each waits its own backoff. Press →.'],
      capDirStart: 'The NCS runs the net: stations transmit only when the NCS calls them, in alphabetical order of call signs. Press →.',
      capBothStart: 'The same incident twice: on top without an NCS, each station waits its own backoff; below, the NCS calls the stations in turn. Press →.',
      capSlot: 'Slot {n}:',
      capDoubledFirst: '{list} transmit at the same time. Doubling: nobody heard anybody. Each waits its own backoff and tries again.',
      capDoubledSame: '{list} transmit together again – each politely waited two slots. Doubling: nobody heard anybody.',
      capDoubledAgain: '{list} transmit together again: their retries fell in the same slot. Doubling: nobody heard anybody.',
      capHeard: 'Station {st} transmits alone and is heard: the message is delivered.',
      capIdle: 'The channel is idle: the stations with a message wait out their backoff.',
      capOpen: 'The NCS opens the net: "This is NCS, the net is open, stations call only when called."',
      capCall: 'The NCS calls the first station: "{call}, go ahead." Everyone else keeps quiet.',
      capCallAck: 'The NCS acknowledges station {ack}\'s message ("received") and calls the next: "{call}, go ahead."',
      capMsg: 'Station {st} sends its message. The channel is its alone: no doubling. It is delivered only once the NCS acknowledges it.',
      capClose: 'The NCS acknowledges the last message, station {ack}\'s ("received").',
      capEndFreeAll: ['The {n} message was delivered in {k} slots, but only because the backoffs happened to differ: no ACKs and no order of importance.',
        'All {n} messages were delivered in {k} slots, but only because the backoffs happened to differ: no ACKs and no order of importance.'],
      capEndFree: 'After {k} slots {d} of {n} delivered.',
      capEndSame: 'Politeness that is identical for everyone repeats the collision forever.',
      capEndPairs: 'Stations whose retries line up in the same slot keep colliding.',
      capEndDir: ['The {n} message was acknowledged in {k} slots, in order, without a single doubling. Slower than the lucky case, but guaranteed and the same every time.',
        'All {n} messages were acknowledged in {k} slots, in order, without a single doubling. Slower than the lucky case, but guaranteed and the same every time.'],
      // captions: side by side (short)
      capLaneFree: 'No NCS:',
      capLaneDir: 'With NCS:',
      shortDoubled: '{list} – doubling.',
      shortHeard: '{st} is heard.',
      shortIdle: 'silence.',
      shortDone: 'everything delivered.',
      shortOpen: 'the NCS opens the net.',
      shortCall: 'the NCS calls {st}.',
      shortCallAck: 'the NCS ACKs {ack} and calls {st}.',
      shortMsg: '{st} sends its message.',
      shortClose: 'the NCS ACKs {ack}.',
      capEndBoth: 'After {k} slots: without an NCS {a} of {n} delivered, with an NCS {b} of {n}.',
      listAnd: ' and ',
      // explanation
      explain: '<p>After an incident everyone has something to report and everyone keys up at once. On one channel two stations ' +
        'transmitting at the same time cancel each other out: that is doubling, and nobody hears either message.</p>' +
        '<p>Waiting before repeating does not help when everyone waits equally long: the collision only moves to a later slot. ' +
        'Listening before talking does not help stations that start at the same moment either: there is nothing to hear yet.</p>' +
        '<p>In a directed net only the net control station (NCS) speaks, or the station it has called. The NCS opens the net, ' +
        'calls the stations in alphabetical order of their call signs and acknowledges each message at the start of the next ' +
        'call (ACK). A message without an ACK is not delivered. Contention for the channel becomes a queue.</p>' +
        '<p>The NCS does not make the net faster than the lucky case; it makes it predictable: 1 + 2·n + 1 slots, the same every time.</p>' +
        '<p>Simplified: one slot lasts about 15 s, the backoffs are fixed rather than random, and without an NCS the ACK is ' +
        'assumed. The call signs are made up.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
