/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of packet-aprs, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Call signs, frames and path elements are data
   (translate="no"), not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Radijske stanice na jednom APRS kanalu, vremenska traka i okvir u eteru',
      topology: 'Raspored stanica',
      path: 'Put u svjetioniku',
      csma: 'Osluškivanje kanala (CSMA)',
      beacon: 'T1 šalje svjetionik',
      beaconHint: 'Novi svjetionik iz T1 u sljedećem odsječku.',
      pathW1W2: 'WIDE1-1,WIDE2-1',
      pathW22: 'WIDE2-2',
      pathW77: 'WIDE7-7',
      pathNone: 'bez puta',
      topoTwoHops: 'Dva skoka',
      topoTwoWides: 'Dva široka digipeatera',
      topoWide7: 'Lanac od pet digipeatera',
      topoCsma: 'Dvije stanice koje se čuju',
      topoHidden: 'Skrivene stanice',
      presetTwoHops: 'Dva skoka',
      presetTwoHopsHint: 'Na koji element puta odgovara svaki digipeater?',
      presetTwoWides: 'Dva široka digipeatera',
      presetTwoWidesHint: 'D2 i D3 čuju istu kopiju. Što čuje R?',
      presetWide7: 'Dugi put WIDE7-7',
      presetWide7Hint: 'Usporedi s WIDE2-2: kad paket stigne do R i koliko dugo je kanal zauzet?',
      presetCsma: 'CSMA',
      presetCsmaHint: 'Isključi pa uključi osluškivanje kanala.',
      presetHidden: 'Skrivene stanice',
      presetHiddenHint: 'Pomaže li ovdje osluškivanje kanala?',
      legTracker: 'tracker',
      legFillIn: 'fill-in digipeater',
      legWide: 'široki digipeater',
      legIgate: 'iGate',
      legTx: 'odašilje',
      legCollision: 'sudar',
      legDupe: 'duplikat odbačen',
      legUsed: 'iskorišten element puta',
      legChanged: 'promijenjen u ovom koraku',
      kindTracker: 'tracker',
      kindFillIn: 'fill-in digipeater',
      kindWide: 'široki digipeater',
      kindIgate: 'iGate',
      bQueue: 'ponavlja',
      bSkip: 'ne ponavlja',
      bDupe: 'duplikat',
      bCollision: 'sudar',
      bBusy: 'odašilje, ne čuje',
      bDeliver: 'primio',
      bDefer: 'čeka',
      bQueued: 'u redu',
      cardTitle: 'Okvir u eteru',
      cardLast: 'Zadnji okvir',
      cardFrom: '{who}, odsječci {a}–{b}',
      cardNone: 'Još ništa nije poslano.',
      stripLabel: 'Kanal',
      slotLabel: 'Odsječak',
      factBusy: 'kanal zauzet',
      factTx: 'odašiljanja',
      factDelivered: 'do iGatea',
      factLost: 'paketa izgubljeno u sudaru',
      csmaOn: 'uključeno',
      csmaOff: 'isključeno',
      introTwoHops: 'T1 dopire samo do D1 (fill-in), D1 do D2 (široki), a samo D2 do iGatea R.',
      introTwoWides: 'D1 čuju i D2 i D3; oni se međusobno ne čuju, a oba dopiru do R.',
      introWide7: 'Lanac: tracker T1, pa D1 … D5 (svi široki); svaki čuje samo susjede, a iGate R je kod D2.',
      introCsma: 'T1 i T2 čuju jedan drugoga i oba dopiru do R. T1 je spreman u 1. odsječku, T2 u 2.',
      introHidden: 'T1 i T2 se ne čuju, a oba dopiru do D1. Oba su spremna u 1. odsječku.',
      captionStart: '{intro} Put: {path}. Osluškivanje kanala: {csma}. Pritisni → za prvi odsječak.',
      evTx: '{who} šalje svjetionik {n}.',
      evTxDigi: '{who} odašilje svoju kopiju.',
      evTxSame: '{list} počinju u istom odsječku.',
      evTxSameHear: 'Osluškivanje kanala to ne sprječava: početak se čuje tek od sljedećeg odsječka.',
      evDefer: '{who} čuje {by} i čeka.',
      evQueueUsed: '{who} je {kind}: odgovara na {el}. Umeće svoj pozivni znak, a {el2} postaje {elNew}.',
      evQueueDec: '{who} je {kind}: odgovara na {el}. Umeće svoj pozivni znak i smanjuje N: {el2} postaje {elNew}, pa put i dalje traži još jedan skok.',
      evQueueNext: 'U sljedećem odsječku paket nastavlja s putem {rest}.',
      evQueueLast: 'Nakon ove kopije nitko ga više ne ponavlja.',
      evSkipFill: '{who} čuje paket, ali ga ne ponavlja: fill-in odgovara samo na WIDE1-1, a prvi neiskorišteni element je {el}.',
      evSkipDone: '{who} čuje paket, ali ga ne ponavlja: u putu nema neiskorištenog elementa.',
      evSkipEmpty: '{who} čuje paket, ali ga ne ponavlja: put ne traži nijedan digipeater.',
      evDupeSent: '{who} opet čuje isti paket (od {from}) i odbacuje ga: već ga je poslao.',
      evDupeHeard: '{who} opet čuje isti paket (od {from}) i odbacuje ga: već ga je čuo ponovljenog.',
      evCollision: 'Kod {at} preklapaju se paketi od {list}: izgubljeni su (sudar).',
      evBusy: '{who} je i sam odašiljao i nije čuo paket od {from}.',
      evDeliver: '{who} prima paket s putem {path}: stigao je do iGatea.',
      evDeliverDirect: '{who} prima paket izravno od {from}: stigao je do iGatea.',
      evOnAir: ['{list} još odašilje (2. odsječak paketa).', '{list} još odašilju (2. odsječak paketa).', '{list} još odašilju (2. odsječak paketa).'],
      evQuiet: 'Kanal je tih.',
      captionEnd: 'Kraj: do iGatea {delivered}, kanal je bio zauzet {busy}.',
      captionCut: 'Demonstracija staje u 20. odsječku, a nisu svi paketi prošli.',
      nPackets: ['je stigao {n} svjetionik od {m}', 'su stigla {n} svjetionika od {m}', 'je stiglo {n} svjetionika od {m}'],
      nSlots: ['{n} odsječak', '{n} odsječka', '{n} odsječaka'],
      and: ' i ',
      beaconFull: 'Više svjetionika ne stane u ovu demonstraciju.',
      explain: '<p><em>APRS</em> šalje kratke pakete, npr. <em>beacon</em> (svjetionik) s položajem ili stanjem, na ' +
        'jednom zajedničkom kanalu (u Europi 144,800 MHz), s AFSK-om preko FM-a pri 1200 bit/s. Prije odašiljanja stanica ' +
        'osluškuje kanal, <em>carrier sense</em> (osluškivanje kanala), i čeka dok čuje drugoga. Radio ne može otkriti ' +
        'sudar dok odašilje, a dvije stanice koje se ne čuju, <em>hidden node</em> (skriveni čvor), ne mogu čekati jedna ' +
        'drugu: njihovi se paketi kod zajedničkog prijamnika preklope i oba propadnu, <em>collision</em> (sudar).</p>' +
        '<p><em>Digipeater</em> prima podatkovne pakete i ponovno ih odašilje, pri čemu smije mijenjati pojedina polja. ' +
        'Koji će digipeater ponoviti paket, piše u polju <em>path</em> (put) iza odredišta, kao <em>alias</em> ' +
        '(zamjensko ime): <b>WIDE1-1</b> traži jedan skok preko bliskog digipeatera (<em>fill-in</em> ili širokog), a <b>WIDEn-N</b> ' +
        'skokove preko širokih digipeatera na visokim točkama. Digipeater odgovara samo na prvi neiskorišteni element: ' +
        'umeće svoj pozivni znak (vidi se kuda je paket prošao) i smanjuje N; kad N padne na 0, element postaje ' +
        '<b>WIDEn*</b> (iskorišten).</p>' +
        '<p>Digipeater ne ponavlja paket (isti izvor, odredište i sadržaj) koji je u zadnjih 30 s već poslao (neki ni onaj ' +
        'koji su već čuli ponovljenog). Duži put ne čini dostavu pouzdanijom: isti paket samo zauzme kanal na većem području i dulje.</p>' +
        '<p>U modelu je odsječak oko 0,25 s, a paket traje 2 odsječka (ilustrativno). <em>iGate</em> R bilježi prvu ' +
        'kopiju koju čuje; prijenos dalje na internet nije dio modela. Gumb „T1 šalje svjetionik” dodaje svjetionik u ' +
        'sljedećem odsječku.</p>' +
        '<p class="pa-credit">Opis APRS-a i digipeatera prema 50ohm.de (odjeljci afsk i relaisfunkstellen), ' +
        '50ohm.de-Autorenteam, AJW-Referat des DARC e.V., CC BY 4.0, sažeto i prerađeno.</p>'
    },
    en: {
      stage: 'Radio stations on one APRS channel, a time strip and the frame on the air',
      topology: 'Station layout',
      path: 'Path in the beacon',
      csma: 'Carrier sense (CSMA)',
      beacon: 'T1 sends a beacon',
      beaconHint: 'A new beacon from T1 in the next slot.',
      pathW1W2: 'WIDE1-1,WIDE2-1',
      pathW22: 'WIDE2-2',
      pathW77: 'WIDE7-7',
      pathNone: 'no path',
      topoTwoHops: 'Two hops',
      topoTwoWides: 'Two wide digipeaters',
      topoWide7: 'A chain of five digipeaters',
      topoCsma: 'Two stations that hear each other',
      topoHidden: 'Hidden stations',
      presetTwoHops: 'Two hops',
      presetTwoHopsHint: 'Which path element does each digipeater answer?',
      presetTwoWides: 'Two wide digipeaters',
      presetTwoWidesHint: 'D2 and D3 hear the same copy. What does R hear?',
      presetWide7: 'The long path WIDE7-7',
      presetWide7Hint: 'Compare with WIDE2-2: when does R get the packet, and how long is the channel busy?',
      presetCsma: 'CSMA',
      presetCsmaHint: 'Switch carrier sense off and on again.',
      presetHidden: 'Hidden stations',
      presetHiddenHint: 'Does carrier sense help here?',
      legTracker: 'tracker',
      legFillIn: 'fill-in digipeater',
      legWide: 'wide digipeater',
      legIgate: 'iGate',
      legTx: 'transmitting',
      legCollision: 'collision',
      legDupe: 'duplicate dropped',
      legUsed: 'used path element',
      legChanged: 'changed in this step',
      kindTracker: 'tracker',
      kindFillIn: 'fill-in digipeater',
      kindWide: 'wide digipeater',
      kindIgate: 'iGate',
      bQueue: 'repeats',
      bSkip: 'does not repeat',
      bDupe: 'duplicate',
      bCollision: 'collision',
      bBusy: 'sending, deaf',
      bDeliver: 'got it',
      bDefer: 'waits',
      bQueued: 'queued',
      cardTitle: 'Frame on the air',
      cardLast: 'Last frame',
      cardFrom: '{who}, slots {a}–{b}',
      cardNone: 'Nothing sent yet.',
      stripLabel: 'Channel',
      slotLabel: 'Slot',
      factBusy: 'channel busy',
      factTx: 'transmissions',
      factDelivered: 'at the iGate',
      factLost: 'packets lost in collisions',
      csmaOn: 'on',
      csmaOff: 'off',
      introTwoHops: 'T1 reaches only D1 (fill-in), D1 reaches D2 (wide), and only D2 reaches the iGate R.',
      introTwoWides: 'Both D2 and D3 hear D1; they do not hear each other, and both reach R.',
      introWide7: 'A chain: the tracker T1, then D1 … D5 (all wide); each hears only its neighbours, and the iGate R is next to D2.',
      introCsma: 'T1 and T2 hear each other, and both reach R. T1 is ready in slot 1, T2 in slot 2.',
      introHidden: 'T1 and T2 do not hear each other, and both reach D1. Both are ready in slot 1.',
      captionStart: '{intro} Path: {path}. Carrier sense: {csma}. Press → for the first slot.',
      evTx: '{who} sends beacon {n}.',
      evTxDigi: '{who} transmits its copy.',
      evTxSame: '{list} start in the same slot.',
      evTxSameHear: 'Carrier sense cannot stop this: a start is heard only from the next slot.',
      evDefer: '{who} hears {by} and waits.',
      evQueueUsed: '{who} is a {kind}: it answers {el}. It inserts its call sign and {el2} becomes {elNew}.',
      evQueueDec: '{who} is a {kind}: it answers {el}. It inserts its call sign and decrements N: {el2} becomes {elNew}, so the path still asks for another hop.',
      evQueueNext: 'In the next slot the packet goes on with {rest}.',
      evQueueLast: 'After this copy nobody repeats it any more.',
      evSkipFill: '{who} hears the packet but does not repeat it: a fill-in answers only WIDE1-1, and the first unused element is {el}.',
      evSkipDone: '{who} hears the packet but does not repeat it: no unused element is left in the path.',
      evSkipEmpty: '{who} hears the packet but does not repeat it: the path asks for no digipeater.',
      evDupeSent: '{who} hears the same packet again (from {from}) and drops it: it has already sent it.',
      evDupeHeard: '{who} hears the same packet again (from {from}) and drops it: it has already heard it repeated.',
      evCollision: 'At {at} the packets from {list} overlap: they are lost (collision).',
      evBusy: '{who} was transmitting itself and missed the packet from {from}.',
      evDeliver: '{who} receives the packet with the path {path}: it reached the iGate.',
      evDeliverDirect: '{who} receives the packet directly from {from}: it reached the iGate.',
      evOnAir: ['{list} is still transmitting (the packet\'s 2nd slot).', '{list} are still transmitting (the packets\' 2nd slot).'],
      evQuiet: 'The channel is quiet.',
      captionEnd: 'End: {delivered} at the iGate, and the channel was busy for {busy}.',
      captionCut: 'The demo stops at slot 20 before every packet is through.',
      nPackets: ['{n} beacon of {m} arrived', '{n} beacons of {m} arrived'],
      nSlots: ['{n} slot', '{n} slots'],
      and: ' and ',
      beaconFull: 'No more beacons fit into this demo.',
      explain: '<p><em>APRS</em> sends short packets (position, status, messages) on one shared channel (144.800 MHz in Europe), ' +
        'with AFSK over FM at 1200 bit/s. Everyone shares that channel: before transmitting a station uses ' +
        '<em>carrier sense</em> and waits while it hears someone else. A radio cannot detect a collision while it ' +
        'transmits, and two stations that do not hear each other (a <em>hidden node</em>) cannot wait for each other: ' +
        'their packets overlap at a common receiver and both are lost (a <em>collision</em>).</p>' +
        '<p>A <em>digipeater</em> receives data packets and transmits them again, and may change certain fields. Which ' +
        'digipeater repeats a packet is written in the <em>path</em> after the destination, as <em>aliases</em>: ' +
        '<b>WIDE1-1</b> asks for one hop through a nearby digipeater (<em>fill-in</em> or wide), <b>WIDEn-N</b> for hops through ' +
        'wide digipeaters on high sites. A digipeater answers only the first unused element: it inserts its call sign ' +
        '(so the route can be traced) and decrements N; when N reaches 0 the element becomes <b>WIDEn*</b> (used).</p>' +
        '<p>A digipeater does not repeat a packet (same source, destination and content) that it has sent in the last ' +
        '30 s (some also skip one they have already heard repeated). A longer path does not make delivery more reliable: the same packet just occupies ' +
        'the channel over a larger area for longer.</p>' +
        '<p>In the model a slot is about 0.25 s and a packet lasts 2 slots (illustrative). The <em>iGate</em> R records ' +
        'the first copy it hears; passing it on to the internet is not part of the model. The button "T1 sends a ' +
        'beacon" adds a beacon in the next slot.</p>' +
        '<p class="pa-credit">The description of APRS and digipeaters follows 50ohm.de (sections afsk and ' +
        'relaisfunkstellen), 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., CC BY 4.0, summarised and adapted.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
