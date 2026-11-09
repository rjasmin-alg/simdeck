/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of multiple-access, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The terms are not in kit/glossary.js yet, so the pairs are written out
   here (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jedan kanal: vrijeme × frekvencija',
      scheme: 'Postupak',
      nameFdma: 'FDMA',
      nameTdma: 'TDMA',
      nameCdma: 'CDMA',
      band100: '100 kHz',
      band12: '12,5 kHz',
      users: 'Broj korisnika',
      idle: 'Tko šuti',
      idleNone: 'nitko',
      idleUser: 'korisnik {k}',
      guard: 'Zaštitni pojas i vrijeme',
      band: 'Pojas',
      bits: 'Bitovi korisnika',
      'preset_fdma-4': 'FDMA, 4 korisnika',
      'preset_fdma-4Hint': '4 kanala po 23,1 kHz u 100 kHz, između njih zaštitni pojasevi',
      'preset_fdma-idle': 'FDMA: kanal koji šuti',
      'preset_fdma-idleHint': 'Korisnik 2 ne šalje, a njegov kanal ostaje rezerviran',
      'preset_tdma-dmr': 'TDMA kao DMR',
      'preset_tdma-dmrHint': '2 korisnika u jednom kanalu od 12,5 kHz, 2 slota u okviru od 60 ms',
      'preset_cdma-2': 'CDMA, 2 korisnika',
      'preset_cdma-2Hint': 'Na zraku (0, 2, 0, 2); svaki prijamnik izvuče svoj bit',
      'preset_cdma-overflow': 'CDMA: 5 korisnika, 4 koda',
      'preset_cdma-overflowHint': 'Korisnik 5 mora dijeliti kod 1: sudar',
      legendUser: 'korisnik (boja i broj)',
      legendGuard: 'zaštitni pojas ili vrijeme',
      legendIdle: 'rezervirano, a šuti',
      legendCollision: 'sudar: kod dijele dvojica',
      legendChanged: 'promijenjeno',
      axisF: 'f (kHz)',
      axisT: 't (ms)',
      frame: 'okvir {k}',
      clock: 'zajednički takt',
      quiet: 'šuti',
      layers: 'svi istodobno, cijeli pojas',
      tableFdma: 'Kanali',
      tableTdma: 'Slotovi u okviru',
      colUser: 'korisnik',
      colChannel: 'kanal',
      colSlot: 'slot',
      colState: 'stanje',
      stSend: 'šalje',
      stIdle: 'šuti, rezervirano',
      stRefused: 'odbijen',
      chipsTitle: 'Bit × kod (4 čipa)',
      rowUser: 'K{k}: bit {b}',
      rowUserIdle: 'K{k}: šuti',
      flipHint: 'Klikni za promjenu bita korisnika {k}',
      codeAside: 'kod',
      airRow: 'na zraku Σ',
      rxRow: 'P{j}',
      rxBit: '= {corr} → bit {bit}',
      rxNobody: '= 0 → nitko',
      rxCollision: '= {corr} → sudar',
      cntServed: 'posluženo',
      cntServedV: '{s} od {n}',
      cntLeft: 'slobodnih mjesta',
      cntUnused: 'neiskorišteno',
      cntPerUser: 'po korisniku',
      perUserV: '{bw} kHz × {ts} % vremena',
      perUserCdma: '{bw} kHz × 100 % vremena, svoj kod',
      cntGuard: 'zaštita',
      cntCollided: 'u sudaru',
      pct: '{v} %',
      capFdma: [
        'FDMA: jedan kanal od {w} kHz zauzima cijeli pojas; korisnik ga drži stalno, i kad ne šalje.',
        'FDMA: pojas je podijeljen na {n} kanala po {w} kHz, između njih zaštitni pojasevi; svaki korisnik stalno drži svoj kanal.',
        'FDMA: pojas je podijeljen na {n} kanala po {w} kHz, između njih zaštitni pojasevi; svaki korisnik stalno drži svoj kanal.'
      ],
      capFdmaNoGuard: 'FDMA: pojas je podijeljen na {n} kanala po {w} kHz, bez zaštitnih pojaseva; svaki korisnik stalno drži svoj kanal.',
      capFdmaIdle: 'Korisnik {k} šuti, ali njegov kanal od {w} kHz ostaje rezerviran: {pct} pojasa nitko ne koristi.',
      capFdmaRefused: [
        'Korisnik {ids} odbijen: kanali bi bili po {w} kHz, uži od najmanjih 12,5 kHz; u {b} kHz stane ih najviše {cap}.',
        'Korisnici {ids} odbijeni: kanali bi bili po {w} kHz, uži od najmanjih 12,5 kHz; u {b} kHz stane ih najviše {cap}.',
        'Korisnici {ids} odbijeni: kanali bi bili po {w} kHz, uži od najmanjih 12,5 kHz; u {b} kHz stane ih najviše {cap}.'
      ],
      slotWord: ['slot', 'slota', 'slotova'],
      capTdma1: 'TDMA: jedini korisnik ima cijeli pojas od {b} kHz u jednom slotu od {len} ms svakih 60 ms.',
      capTdma: 'TDMA: svi dijele cijeli pojas od {b} kHz, ali svatko šalje samo u svom slotu od {len} ms u okviru od 60 ms; zato svi moraju imati isti takt.',
      capTdmaIdle: 'Korisnik {k} šuti, ali njegov slot od {len} ms ostaje rezerviran: {pct} vremena nitko ne koristi.',
      capTdmaRefused: [
        'Korisnik {ids} odbijen: okvir ima samo {cap} {slots}.',
        'Korisnici {ids} odbijeni: okvir ima samo {cap} {slots}.',
        'Korisnici {ids} odbijeni: okvir ima samo {cap} {slots}.'
      ],
      capCdma2: 'CDMA: oba korisnika odašilju istodobno na istom pojasu. Na zraku je zbroj ({air}); množenjem s vlastitim kodom prijamnik 1 dobiva {r1}, a prijamnik 2 {r2}.',
      capCdma: 'CDMA: {m} korisnika odašilju istodobno na istom pojasu. Na zraku je zbroj ({air}); množenjem s vlastitim kodom svaki prijamnik dobiva samo svoj bit, a ostali se ponište.',
      capCdma1: 'CDMA: šalje samo korisnik {k} i zauzima cijeli pojas cijelo vrijeme; na zraku je njegov bit puta kod ({air}).',
      capCdma0: 'CDMA: nitko ne šalje, na zraku je ({air}) i svi prijamnici dobivaju 0.',
      capCdmaIdle: ' Korisnik {k} šuti: nema ga na zraku, a njegov prijamnik dobiva 0.',
      capCdmaIdleShared: ' Korisnik {k} šuti, pa korisnik {o} sam drži kod 1 i prijamnik 1 čita njegov bit.',
      capCdmaCollision: 'Korisnik {k} nema svoj kod: dijeli kod 1 s korisnikom 1. Na zraku je ({air}); prijamnik 1 dobiva {corr} umjesto ±1 i ne može odlučiti.',
      explain: '<p><i>Multiple access</i> (višestruki pristup): više korisnika dijeli isti kanal. Ravnina pokazuje kanal kao ' +
        'vrijeme (vodoravno) × frekvenciju (okomito); svaki postupak je reže na drugi način.</p>' +
        '<p><i>FDMA</i> (frekvencijski multipleks) reže pojas na kanale, s <i>guard band</i> (zaštitni pojas) između njih. ' +
        'Kanal je korisnikov trajno, pa kanal korisnika koji šuti ostaje neiskorišten. Najuži kanal ovdje je 12,5 kHz.</p>' +
        '<p><i>TDMA</i> (vremenski multipleks) daje svakom korisniku cijeli pojas, ali samo u svojem <i>time slot</i> ' +
        '(vremenski slot) okvira, sa zaštitnim vremenom iza. To traži preciznu <i>synchronisation</i> (vremenska ' +
        'sinkronizacija): svi broje isti takt. Okvir ovdje ima najviše 4 slota.</p>' +
        '<p><i>CDMA</i> (kodni multipleks): svi šalju istodobno na cijelom pojasu. Korisnik množi svoj bit (+1 ili −1) ' +
        'svojim <i>spreading code</i> (kod za proširenje spektra) od 4 čipa; na zraku je zbroj. Prijamnik množi zbroj svojim ' +
        'kodom i dijeli s 4: kodovi su ortogonalni, pa ostali daju 0 i ostaje samo njegov bit. Ortogonalnih kodova duljine 4 ' +
        'ima samo 4: peti korisnik mora ponoviti kod i dva se korisnika sudare.</p>' +
        '<p>Primjeri: FDMA u ranim analognim mobilnim mrežama, TDMA u GSM-u, DECT-u i DMR-u, CDMA u UMTS-u i GPS-u. ' +
        'Brojevi u ravnini (100 kHz, 60 ms, 2,5 kHz, 2,5 ms) su ilustrativni.</p>' +
        '<p class="sd-attrib">Pravila prema tečaju 50ohm.de (odjeljak vielfachzugriff), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; prilagođeno za simdeck.</p>'
    },
    en: {
      stage: 'One channel: time × frequency',
      scheme: 'Scheme',
      nameFdma: 'FDMA',
      nameTdma: 'TDMA',
      nameCdma: 'CDMA',
      band100: '100 kHz',
      band12: '12.5 kHz',
      users: 'Number of users',
      idle: 'Silent',
      idleNone: 'nobody',
      idleUser: 'user {k}',
      guard: 'Guard band and time',
      band: 'Band',
      bits: 'Users\' bits',
      'preset_fdma-4': 'FDMA, 4 users',
      'preset_fdma-4Hint': '4 channels of 23.1 kHz in 100 kHz, guard bands between them',
      'preset_fdma-idle': 'FDMA: a silent channel',
      'preset_fdma-idleHint': 'User 2 does not send, and its channel stays reserved',
      'preset_tdma-dmr': 'TDMA as in DMR',
      'preset_tdma-dmrHint': '2 users in one 12.5 kHz channel, 2 slots in a 60 ms frame',
      'preset_cdma-2': 'CDMA, 2 users',
      'preset_cdma-2Hint': 'The air carries (0, 2, 0, 2); each receiver pulls out its own bit',
      'preset_cdma-overflow': 'CDMA: 5 users, 4 codes',
      'preset_cdma-overflowHint': 'User 5 has to share code 1: a collision',
      legendUser: 'user (colour and number)',
      legendGuard: 'guard band or time',
      legendIdle: 'reserved but silent',
      legendCollision: 'collision: two share a code',
      legendChanged: 'changed',
      axisF: 'f (kHz)',
      axisT: 't (ms)',
      frame: 'frame {k}',
      clock: 'shared clock',
      quiet: 'silent',
      layers: 'all at once, the whole band',
      tableFdma: 'Channels',
      tableTdma: 'Slots in the frame',
      colUser: 'user',
      colChannel: 'channel',
      colSlot: 'slot',
      colState: 'state',
      stSend: 'sending',
      stIdle: 'silent, reserved',
      stRefused: 'refused',
      chipsTitle: 'Bit × code (4 chips)',
      rowUser: 'U{k}: bit {b}',
      rowUserIdle: 'U{k}: silent',
      flipHint: 'Click to flip user {k}\'s bit',
      codeAside: 'code',
      airRow: 'on the air Σ',
      rxRow: 'R{j}',
      rxBit: '= {corr} → bit {bit}',
      rxNobody: '= 0 → nobody',
      rxCollision: '= {corr} → collision',
      cntServed: 'served',
      cntServedV: '{s} of {n}',
      cntLeft: 'room for',
      cntUnused: 'unused',
      cntPerUser: 'per user',
      perUserV: '{bw} kHz × {ts} % of the time',
      perUserCdma: '{bw} kHz × 100 % of the time, own code',
      cntGuard: 'guard',
      cntCollided: 'colliding',
      pct: '{v} %',
      capFdma: [
        'FDMA: the band is one channel of {w} kHz; the user keeps it all the time, even when silent.',
        'FDMA: the band is split into {n} channels of {w} kHz with guard bands between them; each user keeps its channel all the time.'
      ],
      capFdmaNoGuard: 'FDMA: the band is split into {n} channels of {w} kHz with no guard bands; each user keeps its channel all the time.',
      capFdmaIdle: 'User {k} is silent, but its {w} kHz channel stays reserved: {pct} of the band is used by nobody.',
      capFdmaRefused: [
        'User {ids} refused: the channels would be {w} kHz, narrower than the minimum 12.5 kHz; {b} kHz holds at most {cap}.',
        'Users {ids} refused: the channels would be {w} kHz, narrower than the minimum 12.5 kHz; {b} kHz holds at most {cap}.'
      ],
      slotWord: ['slot', 'slota', 'slotova'],
      capTdma1: 'TDMA: jedini korisnik ima cijeli pojas od {b} kHz u jednom slotu od {len} ms svakih 60 ms.',
      slotWord: ['slot', 'slots'],
      capTdma1: 'TDMA: the only user has the whole {b} kHz band in one {len} ms slot every 60 ms.',
      capTdma: 'TDMA: everyone shares the whole {b} kHz band, but each sends only in its own {len} ms slot of the 60 ms frame, so all must keep the same clock.',
      capTdmaIdle: 'User {k} is silent, but its {len} ms slot stays reserved: {pct} of the time is used by nobody.',
      capTdmaRefused: [
        'User {ids} refused: the frame has only {cap} {slots}.',
        'Users {ids} refused: the frame has only {cap} {slots}.'
      ],
      capCdma2: 'CDMA: both users send at the same time on the same band. The air carries the sum ({air}); by multiplying with its own code receiver 1 gets {r1} and receiver 2 gets {r2}.',
      capCdma: 'CDMA: {m} users send at the same time on the same band. The air carries the sum ({air}); multiplying with its own code, each receiver gets only its own bit and the others cancel.',
      capCdma1: 'CDMA: only user {k} sends and takes the whole band all the time; the air carries its bit times its code ({air}).',
      capCdma0: 'CDMA: nobody sends; the air carries ({air}) and every receiver gets 0.',
      capCdmaIdle: ' User {k} is silent: it is simply absent from the air, and its receiver gets 0.',
      capCdmaIdleShared: ' User {k} is silent, so user {o} has code 1 to itself and receiver 1 reads its bit.',
      capCdmaCollision: 'User {k} has no code of its own: it shares code 1 with user 1. The air carries ({air}); receiver 1 gets {corr} instead of ±1 and cannot decide.',
      explain: '<p><i>Multiple access</i>: several users share one channel. The plane shows the channel as time (across) × ' +
        'frequency (up); each scheme cuts it another way.</p>' +
        '<p><i>FDMA</i> (frequency division) cuts the band into channels with a <i>guard band</i> between them. A channel ' +
        'belongs to its user for good, so a silent user\'s channel stays unused. Here the narrowest channel is 12.5 kHz.</p>' +
        '<p><i>TDMA</i> (time division) gives every user the whole band, but only in its own <i>time slot</i> of the frame, ' +
        'with a guard time after it. That needs precise <i>synchronisation</i>: everyone counts the same clock. Here a frame ' +
        'holds at most 4 slots.</p>' +
        '<p><i>CDMA</i> (code division): everyone sends at once on the whole band. A user multiplies its bit (+1 or −1) by its ' +
        '<i>spreading code</i> of 4 chips; the air carries the sum. A receiver multiplies the sum by its own code and divides ' +
        'by 4: the codes are orthogonal, so the others give 0 and only its own bit is left. There are only 4 orthogonal codes ' +
        'of length 4: a fifth user must repeat a code, and two users collide.</p>' +
        '<p>Examples: FDMA in early analogue mobile networks, TDMA in GSM, DECT and DMR, CDMA in UMTS and GPS. The numbers on ' +
        'the plane (100 kHz, 60 ms, 2.5 kHz, 2.5 ms) are illustrative.</p>' +
        '<p class="sd-attrib">Rules after the 50ohm.de course (section vielfachzugriff), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; adapted for simdeck.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
