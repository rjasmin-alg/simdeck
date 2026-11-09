/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of priority-traffic, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json. The procedure words HITNO, PRIORITET, RUTINSKO, INFORMATIVNO and
   "PROMET SAMO PRIORITET I HITNO" are the course's Croatian prowords and stay Croatian on the English page too,
   with the English meaning beside them (as the task's English caption does). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Usmjerena mreža s prioritetima: stanice, red čekanja NCS-a i kanal po odsječcima',
      // params
      priorities: 'Prioriteti',
      prioritiesHint: 'Isključeno: običan red (FIFO), HITNO ne prekida.',
      cutoff: 'Ne doseže NCS',
      cutoffHint: 'NCS ne čuje tu stanicu; njezin relej je susjed (A↔B, C↔D, E↔F).',
      nobody: 'nitko',
      stationN: 'stanica {id}',
      from: 'Pošiljatelj nove poruke',
      injHit: '◆ HITNO',
      injPri: '▲ PRIORITET',
      injRut: '● RUTINSKO',
      injInf: '○ INFORMATIVNO',
      injHint: 'Pošiljatelj je prijavljuje u sljedećem odsječku.',
      restrict: 'NCS: samo PRIORITET i HITNO',
      restrictHint: 'NCS to objavljuje u svom sljedećem odašiljanju; drugi pritisak ukida ograničenje.',
      // presets
      presetEmergency: 'Hitna poruka',
      presetEmergencyHint: 'A, B i C čekaju s rutinskim porukama; u odsječku 3 stanica D ima hitnu poruku. Što se dogodi s porukom koja je tada na kanalu?',
      presetFifo: 'Bez prioriteta',
      presetFifoHint: 'Isti promet kao u prvom primjeru, ali NCS poslužuje red redom prijave. Kada stiže D-ova hitna poruka?',
      presetFour: 'Četiri razine',
      presetFourHint: 'A je prvi prijavio informativnu poruku, B rutinsku, zatim C, D, E i F istodobno prioritetne. Kojim redom ih NCS poziva?',
      presetNoAck: 'Nema potvrde',
      presetNoAckHint: 'NCS ne čuje stanicu E. Koliko puta E ponavlja i što radi zatim?',
      // legend
      legendPrio: 'prioritet: oblik i prefiks',
      legendCut: 'prekinuto',
      legendWait: 'čeka potvrdu (ACK)',
      legendDone: 'isporučeno (ACK)',
      legendRelay: 'preko releja',
      legendChanged: 'promijenjeno u ovom koraku',
      // priorities
      pHIT: 'HITNO',
      pPRI: 'PRIORITET',
      pRUT: 'RUTINSKO',
      pINF: 'INFORMATIVNO',
      accHIT: 'hitnu',
      accPRI: 'prioritetnu',
      accRUT: 'rutinsku',
      accINF: 'informativnu',
      // stage: stations
      ncsName: 'NCS',
      ncsRole: 'mrežna kontrolna stanica',
      reachOk: 'NCS je čuje',
      reachNo: 'NCS je ne čuje',
      relayOf: 'relej {r}',
      // stage: queue and state
      queueTitle: 'Red čekanja NCS-a',
      order: 'redoslijed:',
      orderFifo: 'FIFO, redom prijave',
      onAir: 'na kanalu',
      queueEmpty: 'nitko ne čeka',
      held: 'zadržano',
      cutTag: 'prekinuto',
      viaTag: '{from} via {via}',
      tryTag: 'pokušaj {k}/3',
      phSend: 'pozvana, predaje',
      phResend: 'ponavlja',
      phViaSend: 'relej predaje NCS-u',
      phAck: 'poslano, čeka ACK',
      phWait: 'čeka ACK, NCS je nije čuo',
      phGoahead: 'HITNO najavljeno, čeka NCS',
      phRelay: 'bez ACK-a 3 puta: ide releju',
      phRelayAck: 'kod releja, čeka njegov ACK',
      netTitle: 'Stanje mreže',
      restrictedOn: 'PROMET SAMO PRIORITET I HITNO',
      restrictedOff: 'bez ograničenja',
      announcePending: 'objava čeka NCS-ovo odašiljanje',
      owed: 'ACK se duguje',
      doneTitle: 'Isporučeno',
      doneNone: 'još ništa',
      doneAt: 'u {n}.',
      offTitle: 'Na drugom kanalu',
      // stage: strip
      channel: 'Kanal, odsječak po odsječak (≈ 15 s)',
      slotLabel: 'odsječak {n}',
      cellNotHeard: 'ne čuje',
      cellBreak: 'HITNO ×3',
      cellGo: 'predajte',
      cellNoAck: 'bez ACK',
      cellOn: 'samo PRI+HIT',
      cellOff: 'ukinuto',
      cellIdle: '—',
      // captions
      capStart: 'Mreža radi. NCS je upravo pozvao {st} ({p}); u redu još čeka: {list}.',
      capStartAlone: 'Mreža radi. NCS je upravo pozvao {st} ({p}); u redu nema nikoga drugog.',
      capStartEmpty: 'Mreža radi, a red je prazan. Prijavi poruku tipkama desno.',
      capSlot: 'Odsječak {n}:',
      capReg: '{st} prijavljuje {acc} poruku i dolazi na {k}. mjesto u redu.',
      capMsg: '{st} predaje {acc} poruku. NCS ju je čuo, ali isporučuje je tek njegova potvrda (ACK).',
      capMsgLost: '{st} predaje poruku ({k}. od 3 pokušaja), ali NCS je ne čuje.',
      capMsgVia: '{relay} predaje NCS-u poruku „{from} via {relay}“, istog prioriteta ({p}).',
      capAck: 'NCS potvrđuje primitak ({list}): „primljeno, razumijem …“. Tek sada je poruka isporučena.',
      capAckOwed: 'Prekinuti ACK za {list} stiže sada.',
      capPass: 'Hitnu poruku NCS prosljeđuje nadležnima.',
      capCall: 'NCS poziva {st} ({p}).',
      capCallHit: 'NCS poziva {st}: druga hitna poruka čekala je dok prva nije potvrđena.',
      capOn: 'NCS objavljuje „PROMET SAMO PRIORITET I HITNO“: rutinske i informativne poruke ostaju u redu.',
      capOff: 'NCS ukida ograničenje: rutinske i informativne poruke opet dolaze na red.',
      capHeld: ['Pod ograničenjem {n} poruka čeka.', 'Pod ograničenjem {n} poruke čekaju.', 'Pod ograničenjem {n} poruka čeka.'],
      capBreakSend: '{st} javlja „HITNO HITNO HITNO“ i prekida {acc} poruku stanice {cut}. NCS u sljedećem odsječku traži hitnu poruku; {cut} će svoju ponoviti tek kad NCS potvrdi HITNO.',
      capBreakAck: '{st} javlja „HITNO HITNO HITNO“ i prekida NCS-ovu potvrdu za {cut}. NCS je poruku čuo, pa ACK duguje: dat će ga s potvrdom hitne poruke.',
      capBreakNcs: '{st} javlja „HITNO HITNO HITNO“ i prekida NCS-ovo odašiljanje; ono čeka da hitna poruka prođe.',
      capBreakIdle: '{st} javlja „HITNO HITNO HITNO“ na tihom kanalu. Čekanje za HITNO: 0.',
      capBreakWait: '{st} javlja „HITNO HITNO HITNO“ dok {cut} čeka ACK. Ništa nije prekinuto, ali razmjena stanice {cut} staje i vraća se na čelo svog prioriteta.',
      capBreakRelayAck: '{st} javlja „HITNO HITNO HITNO“ i prekida potvrdu releja {cut}. Relej poruku već ima: predat će je NCS-u kad dođe na red.',
      capGo: 'NCS: „{call}, primljeno, predajte hitnu poruku“. Sav ostali promet stoji.',
      capNoAck: 'nema ACK-a za {st} ({k}. pokušaj od 3); {st} ponavlja u sljedećem odsječku.',
      capNoAckRelay: 'ni nakon trećeg pokušaja nema ACK-a. Glasnije ne pomaže: {st} poruku predaje releju {relay}.',
      capNoAckOff: 'ni nakon trećeg pokušaja nema ACK-a, a relej {relay} ne doseže NCS: {st} poruku šalje drugim kanalom.',
      capRelay: '{st} predaje poruku releju {relay}, koji je čuje.',
      capRelayAck: '{relay} potvrđuje stanici {st} primitak. Poruka još nije isporučena: NCS je nije potvrdio.',
      capIdle: 'kanal je tih.',
      capEnd: ['Kraj: isporučena je {d} poruka od {m}.', 'Kraj: isporučene su {d} poruke od {m}.', 'Kraj: isporučeno je {d} poruka od {m}.'],
      capEndHitOn: 'S prioritetima hitna poruka stanice {st} isporučena je u odsječku {a}; bez njih bila bi u {b}.',
      capEndHitOff: 'Bez prioriteta hitna poruka stanice {st} isporučena je tek u odsječku {a}; s njima bila bi u {b}.',
      capEndFifoNote: 'Ovdje su to samo 2 odsječka, ali s 10 rutinskih poruka ispred čekao bi 20.',
      capEndHeld: ['{n} poruka čeka da NCS ukine ograničenje.', '{n} poruke čekaju da NCS ukine ograničenje.', '{n} poruka čeka da NCS ukine ograničenje.'],
      capEndOff: 'Poruka stanice {st} otišla je drugim kanalom.',
      capCap: 'Demonstracija staje na 20 odsječaka.',
      // refusals
      noteCutoff: 'Stanica {st} ne doseže NCS, pa ne može prijaviti novu poruku. Odaberi drugog pošiljatelja.',
      noteFull: 'Nema mjesta: najviše 12 poruka i najkasnije u odsječku 19.',
      noteRestrictFull: 'Nema mjesta za još jednu objavu.',
      listAnd: ' i ',
      listNone: 'nitko',
      explain: '<p>Usmjerena mreža ima <em>queue</em> (red čekanja), a <em>priority</em> (prioritet) određuje tko je prvi: HITNO, pa PRIORITET, pa ' +
        'RUTINSKO, a INFORMATIVNO tek kad nitko drugi ne čeka. Unutar istog prioriteta prvi je onaj tko se prvi prijavio; ' +
        'istodobne prijave idu po pozivnom znaku.</p>' +
        '<p>HITNO ne čeka u redu: pošiljatelj odmah javlja „HITNO HITNO HITNO“ i prekida ono što je na kanalu ' +
        '(<em>preemption</em> (prekidanje)). Prekinuta poruka nije isporučena i vraća se na čelo svog prioriteta. NCS ' +
        'traži hitnu poruku, potvrđuje je i prosljeđuje, a tek tada poziva dalje.</p>' +
        '<p>Poruka je isporučena tek kad NCS pošalje <em>acknowledgement</em> (potvrda primitka, ACK) i ponovi ključnu ' +
        'informaciju. Bez ACK-a pošiljatelj ponavlja; nakon tri neuspjela pokušaja ne pomaže ni glasnije ni sporije, ' +
        'nego <em>relay</em> (relejna stanica) ili drugi kanal. Relej potvrdi pošiljatelju i preda poruku NCS-u kao ' +
        '„E via F“, istog prioriteta.</p>' +
        '<p>Kad je mreža preopterećena, NCS objavljuje „PROMET SAMO PRIORITET I HITNO“: rutinske i informativne poruke ' +
        'ostaju u redu dok on ne ukine ograničenje. Jedan odsječak ovdje je oko 15 sekundi (ilustrativno).</p>'
    },
    en: {
      stage: 'A directed net with priorities: the stations, the NCS\'s queue and the channel by slots',
      // params
      priorities: 'Priorities',
      prioritiesHint: 'Off: a plain queue (FIFO), HITNO does not break in.',
      cutoff: 'Cut off from the NCS',
      cutoffHint: 'The NCS cannot hear this station; its relay is its neighbour (A↔B, C↔D, E↔F).',
      nobody: 'nobody',
      stationN: 'station {id}',
      from: 'Sender of a new message',
      injHit: '◆ HITNO',
      injPri: '▲ PRIORITET',
      injRut: '● RUTINSKO',
      injInf: '○ INFORMATIVNO',
      injHint: 'The sender registers it in the next slot.',
      restrict: 'NCS: priority and emergency only',
      restrictHint: 'The NCS announces it in its next transmission; a second press lifts it.',
      // presets
      presetEmergency: 'Emergency message',
      presetEmergencyHint: 'A, B and C wait with routine messages; in slot 3 station D has an emergency. What happens to the message on the air?',
      presetFifo: 'No priorities',
      presetFifoHint: 'The same traffic as the first example, but the NCS serves the queue in order of registration. When does D\'s emergency get through?',
      presetFour: 'Four levels',
      presetFourHint: 'A registered an informational message first, B a routine one, then C, D, E and F priority ones together. In what order does the NCS call them?',
      presetNoAck: 'No acknowledgement',
      presetNoAckHint: 'The NCS cannot hear station E. How often does E repeat, and what does it do then?',
      // legend
      legendPrio: 'priority: shape and prefix',
      legendCut: 'interrupted',
      legendWait: 'waiting for the ACK',
      legendDone: 'delivered (ACK)',
      legendRelay: 'via a relay',
      legendChanged: 'changed in this step',
      // priorities
      pHIT: 'HITNO',
      pPRI: 'PRIORITET',
      pRUT: 'RUTINSKO',
      pINF: 'INFORMATIVNO',
      accHIT: 'emergency',
      accPRI: 'priority',
      accRUT: 'routine',
      accINF: 'informational',
      // stage: stations
      ncsName: 'NCS',
      ncsRole: 'net control station',
      reachOk: 'the NCS hears it',
      reachNo: 'the NCS cannot hear it',
      relayOf: 'relay {r}',
      // stage: queue and state
      queueTitle: 'The NCS\'s queue',
      order: 'order:',
      orderFifo: 'FIFO, in order of registration',
      onAir: 'on the air',
      queueEmpty: 'nobody waits',
      held: 'held',
      cutTag: 'interrupted',
      viaTag: '{from} via {via}',
      tryTag: 'try {k}/3',
      phSend: 'called, sending',
      phResend: 'repeats',
      phViaSend: 'the relay sends it to the NCS',
      phAck: 'sent, awaits the ACK',
      phWait: 'awaits the ACK; the NCS did not hear it',
      phGoahead: 'HITNO announced, waits for the NCS',
      phRelay: 'no ACK 3 times: goes to the relay',
      phRelayAck: 'with the relay, awaits its ACK',
      netTitle: 'State of the net',
      restrictedOn: 'PROMET SAMO PRIORITET I HITNO (priority and emergency only)',
      restrictedOff: 'no restriction',
      announcePending: 'the announcement waits for the NCS to transmit',
      owed: 'ACK owed',
      doneTitle: 'Delivered',
      doneNone: 'nothing yet',
      doneAt: 'in {n}',
      offTitle: 'On another channel',
      // stage: strip
      channel: 'The channel, slot by slot (≈ 15 s)',
      slotLabel: 'slot {n}',
      cellNotHeard: 'not heard',
      cellBreak: 'HITNO ×3',
      cellGo: 'go ahead',
      cellNoAck: 'no ACK',
      cellOn: 'PRI+HIT only',
      cellOff: 'lifted',
      cellIdle: '—',
      // captions
      capStart: 'The net is running. The NCS has just called {st} ({p}); still in the queue: {list}.',
      capStartAlone: 'The net is running. The NCS has just called {st} ({p}); nobody else is in the queue.',
      capStartEmpty: 'The net is running and the queue is empty. Register a message with the buttons on the right.',
      capSlot: 'Slot {n}:',
      capReg: '{st} registers a {acc} message and takes place {k} in the queue.',
      capMsg: '{st} sends its {acc} message. The NCS heard it, but only its acknowledgement (ACK) delivers it.',
      capMsgLost: '{st} sends its message (try {k} of 3), but the NCS cannot hear it.',
      capMsgVia: '{relay} sends the NCS the message "{from} via {relay}", at the same priority ({p}).',
      capAck: 'The NCS acknowledges ({list}): "received, understood …". Only now is the message delivered.',
      capAckOwed: 'The interrupted ACK for {list} comes now.',
      capPass: 'The NCS passes the emergency message on to the authorities.',
      capCall: 'The NCS calls {st} ({p}).',
      capCallHit: 'The NCS calls {st}: the second emergency waited until the first was acknowledged.',
      capOn: 'The NCS announces "PROMET SAMO PRIORITET I HITNO" (priority and emergency only): routine and informational messages stay in the queue.',
      capOff: 'The NCS lifts the restriction: routine and informational messages get their turn again.',
      capHeld: ['Under the restriction {n} message waits.', 'Under the restriction {n} messages wait.'],
      capBreakSend: '{st} calls "HITNO HITNO HITNO" and cuts off {cut}\'s {acc} message. In the next slot the NCS asks for the emergency message; {cut} repeats its own only after the NCS has acknowledged the HITNO.',
      capBreakAck: '{st} calls "HITNO HITNO HITNO" and cuts off the NCS\'s acknowledgement to {cut}. The NCS heard that message, so it owes the ACK and gives it with the emergency\'s.',
      capBreakNcs: '{st} calls "HITNO HITNO HITNO" and cuts off the NCS\'s transmission; it waits until the emergency is through.',
      capBreakIdle: '{st} calls "HITNO HITNO HITNO" on a quiet channel. Wait for a HITNO: 0.',
      capBreakWait: '{st} calls "HITNO HITNO HITNO" while {cut} awaits its ACK. Nothing is cut, but {cut}\'s exchange stops and goes back to the front of its priority.',
      capBreakRelayAck: '{st} calls "HITNO HITNO HITNO" and cuts off relay {cut}\'s acknowledgement. The relay already holds the message: it sends it to the NCS when its turn comes.',
      capGo: 'NCS: "{call}, received, send your emergency message". All other traffic stands by.',
      capNoAck: 'no ACK for {st} (try {k} of 3); {st} repeats in the next slot.',
      capNoAckRelay: 'still no ACK after the third try. Louder does not help: {st} hands the message to its relay {relay}.',
      capNoAckOff: 'still no ACK after the third try, and relay {relay} cannot reach the NCS: {st} sends the message on another channel.',
      capRelay: '{st} hands its message to relay {relay}, which hears it.',
      capRelayAck: '{relay} acknowledges receipt to {st}. The message is not delivered yet: the NCS has not acknowledged it.',
      capIdle: 'the channel is quiet.',
      capEnd: ['End: {d} message of {m} delivered.', 'End: {d} messages of {m} delivered.'],
      capEndHitOn: 'With priorities the HITNO from {st} was delivered in slot {a}; without them it would be in {b}.',
      capEndHitOff: 'Without priorities the HITNO from {st} was delivered only in slot {a}; with them it would be in {b}.',
      capEndFifoNote: 'Here that is only 2 slots, but with 10 routine messages ahead it would wait 20.',
      capEndHeld: ['{n} message waits for the NCS to lift the restriction.', '{n} messages wait for the NCS to lift the restriction.'],
      capEndOff: 'Station {st}\'s message left on another channel.',
      capCap: 'The demo stops at 20 slots.',
      // refusals
      noteCutoff: 'Station {st} cannot reach the NCS, so it cannot register a new message. Pick another sender.',
      noteFull: 'No room: at most 12 messages, and no later than slot 19.',
      noteRestrictFull: 'No room for another announcement.',
      listAnd: ' and ',
      listNone: 'nobody',
      explain: '<p>A directed net has a <em>queue</em>, and the <em>priority</em> decides who goes first: HITNO (emergency), then ' +
        'PRIORITET (priority), then RUTINSKO (routine), and INFORMATIVNO (informational) only when nobody else waits. ' +
        'Within a priority the first to register goes first; registrations in the same slot go by call sign.</p>' +
        '<p>A HITNO does not wait in the queue: the sender calls "HITNO HITNO HITNO" at once and cuts off whatever is on ' +
        'the air (<em>preemption</em>). The cut message is not delivered and goes back to the front of its priority. The ' +
        'NCS asks for the emergency message, acknowledges it and passes it on, and only then calls anyone else.</p>' +
        '<p>A message is delivered only when the NCS sends the <em>acknowledgement</em> (ACK), repeating the key ' +
        'information. Without an ACK the sender repeats; after three failed tries, louder or slower does not help, a ' +
        '<em>relay</em> or another channel does. The relay acknowledges the sender and hands the message to the NCS as ' +
        '"E via F", at the same priority.</p>' +
        '<p>When the net is overloaded the NCS announces "PROMET SAMO PRIORITET I HITNO" (priority and emergency only): ' +
        'routine and informational messages stay in the queue until it lifts the restriction. One slot here is about ' +
        '15 seconds (illustrative).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
