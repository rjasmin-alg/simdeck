/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of hidden-node, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian is the original (the URM book's skriveni-cvor.html and chapter 17); its
   terms follow the book: skriveni čvor, stanica, access point (in italics, untranslated, as in the book), okvir,
   sudar, potvrda primitka (ACK), polje trajanja, NAV, slučajno čekanje. A, B, C and the frame names (RTS, CTS, DATA,
   ACK) are data, shown with translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri stanice, tko koga čuje, i što svaka šalje u svakom odsječku',
      rts: 'RTS/CTS',
      rtsHint: 'Prije podataka kratka razmjena RTS i CTS koja najavljuje koliko će medij biti zauzet.',
      hear: 'A i C se čuju',
      hearHint: 'Isključeno: A i C su izvan međusobnog dometa, kao u knjizi.',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 17, Primjer 1: A i C se ne čuju, RTS/CTS je isključen. Što se događa na B? Zašto ni A ni C same neće primijetiti sudar?',
      presetRts: 'S RTS/CTS-om',
      presetRtsHint: 'Isti raspored, RTS/CTS uključen. Kako C sazna da treba pričekati kad nikad nije čula A?',
      presetHear: 'A i C se čuju',
      presetHearHint: 'Bez RTS/CTS-a, ali A i C su u dometu jedna druge. Što C sada čuje u 2. odsječku, i zašto nema sudara?',
      presetHearRts: 'Čuju se, i RTS/CTS',
      presetHearRtsHint: 'A i C se čuju, a RTS/CTS je ipak uključen. Koliko odsječaka sada traje isporuka oba okvira? Je li RTS/CTS obavezan za svaki prijenos?',
      legendA: 'okvir stanice A',
      legendC: 'okvir stanice C',
      legendB: 'odgovor stanice B',
      legendCollide: 'sudar na B',
      legendNav: 'NAV: ne pokušava slati',
      station: 'stanica',
      ap: 'access point',
      inRange: 'u dometu',
      outRange: 'izvan dometa',
      rowAtB: 'Na B',
      slot: 'odsječak',
      stIdle: 'nema što slati',
      stBusy: 'medij zauzet, čeka',
      stNav: 'NAV do {until}.',
      stBackoff: 'čeka do {ready}.',
      stReady: 'ima okvir za B',
      stSend: 'šalje, {k}. pokušaj',
      stAwait: 'čeka odgovor',
      stDone: 'isporučeno',
      stBSend: 'šalje odgovor',
      stBCollide: 'sudar',
      stBHear: 'prima',
      stBQuiet: 'tišina',
      factDelivered: 'Isporučeno',
      factCollide: 'Odsječci sa sudarom na B',
      factLost: 'Izgubljeni okviri',
      captionStart: 'A ima podatke za B od 1. odsječka, C od 3., dok A još šalje. {hearing} {rtsState} Pritisni → za sljedeći odsječak.',
      startHidden: 'A i C ne čuju jedna drugu, ali obje čuju B.',
      startHear: 'A i C se čuju, i obje čuju B.',
      rtsOn: 'RTS/CTS je uključen.',
      rtsOff: 'RTS/CTS je isključen.',
      evStart: '{who} čuje tišinu i počinje slati {kind} prema B ({k}. pokušaj).',
      evStartHidden: '{who} ne čuje {other}, misli da je medij slobodan i počinje slati {kind} prema B ({k}. pokušaj).',
      evReplyCts: 'B odgovara CTS-om za {owner}; čuju ga i A i C.',
      evReplyAck: 'B je primio okvir od {owner} i vraća ACK.',
      evReplyData: '{who} je dobila CTS i šalje DATA.',
      evDeferBusy: "{who} je u prošlom odsječku čula da je medij zauzet, pa još ne šalje.",
      evDeferNav: '{who} ima NAV do {until}. odsječka i ne pokušava slati.',
      evCollide: 'Na B se sudaraju okviri od A i C: B ne može razaznati nijedan. A i C to ne primjećuju, jer ne čuju jedna drugu.',
      evNav: '{who} čuje {kind} i upisuje NAV do {until}. odsječka.',
      evNavHidden: '{who} čuje CTS od B, iako nikad nije čula {other}, i upisuje NAV do {until}. odsječka.',
      evTimeout: '{who} nije dobila {kind}: pokušaj nije uspio. Ponovno pokušava nakon {wait}, od {ready}. odsječka.',
      wait: ['{n} odsječka čekanja', '{n} odsječka čekanja', '{n} odsječaka čekanja'],
      evDelivered: 'Stigao je ACK: okvir od {who} je isporučen ({k}. pokušaj).',
      evQuiet: 'Medij je tih.',
      captionEnd: 'Nakon {n} odsječaka: isporučeno {done} od 2 okvira, odsječaka sa sudarom na B: {coll}, izgubljenih okvira: {lost}.',
      explain: '<p><strong>Skriveni čvor.</strong> Bežična stanica dok šalje ne može slušati, pa 802.11 sudare ' +
        'izbjegava (CSMA/CA): prije slanja osluškuje je li medij slobodan. To ne pomaže kad se dvije stanice ne čuju: ' +
        'A i C su obje u dometu <em>access pointa</em> B, ali ne i jedna druge. C osluškuje dok A šalje, ne čuje ništa ' +
        'i počne slati, pa se okviri sudare na B. To je <em>hidden node</em> (skriveni čvor).</p>' +
        '<p><strong>Zašto ni A ni C ne primijete sudar.</strong> Sudar se dogodi na B, ne kod pošiljatelja. Jedini ' +
        'znak je izostanak potvrde primitka (ACK); svaka stanica nakon isteka roka pokušava ponovno nakon slučajnog ' +
        'čekanja, a kako se i dalje ne čuju, sudar se može ponoviti.</p>' +
        '<p><strong>Zašto C uopće nešto poduzima kad ne čuje A.</strong> RTS i CTS oba nose polje trajanja koje svaka ' +
        'stanica koja ih čuje upisuje u vlastiti <em>NAV</em> (Network Allocation Vector). C rješenje dobiva ne zato ' +
        'što čuje A, nego zato što čuje <strong>CTS od B</strong>, a B čuju obje. Dok NAV traje, C ne pokušava slati.</p>' +
        '<p><strong>Je li RTS/CTS obavezan?</strong> Uporaba je opcionalna po pojedinom prijenosu, a uključuje se ' +
        'pragom veličine okvira po stanici (RTS_Threshold); svaki uređaj sukladan normi mora je podržavati. RTS/CTS ' +
        'ima cijenu: dva odsječka više po okviru, i kad se stanice ionako čuju.</p>' +
        '<p><strong>Pojednostavnjenje.</strong> Vrijeme teče u odsječcima: RTS, CTS i ACK traju po jedan, DATA tri. ' +
        'Novi pokušaj smije početi tek nakon jednog tihog odsječka, a odgovor odmah. Čekanja nakon neuspjeha su ' +
        'stalna (A: 1 pa 3 odsječka, C: 1 pa 5), da svaki prikaz bude isti; prava stanica ih bira slučajno. Nema ' +
        'smetnji: svaki gubitak je sudar.</p>'
    },
    en: {
      stage: 'Three stations, who hears whom, and what each sends in every slot',
      rts: 'RTS/CTS',
      rtsHint: 'Before the data, a short RTS and CTS exchange announces how long the medium will be busy.',
      hear: 'A and C hear each other',
      hearHint: 'Off: A and C are out of each other\'s range, as in the book.',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 17, Primjer 1: A and C do not hear each other, RTS/CTS is off. What happens at B? Why does neither A nor C notice the collision?',
      presetRts: 'With RTS/CTS',
      presetRtsHint: 'The same layout, RTS/CTS on. How does C learn to wait when it has never heard A?',
      presetHear: 'A and C hear each other',
      presetHearHint: 'No RTS/CTS, but A and C are in each other\'s range. What does C hear in slot 2 now, and why is there no collision?',
      presetHearRts: 'In range, and RTS/CTS',
      presetHearRtsHint: 'A and C hear each other, and RTS/CTS is on anyway. How many slots does delivering both frames take now? Is RTS/CTS required for every transmission?',
      legendA: 'a frame from station A',
      legendC: 'a frame from station C',
      legendB: 'a reply from station B',
      legendCollide: 'collision at B',
      legendNav: 'NAV: does not try to send',
      station: 'station',
      ap: 'access point',
      inRange: 'in range',
      outRange: 'out of range',
      rowAtB: 'At B',
      slot: 'slot',
      stIdle: 'nothing to send',
      stBusy: 'medium busy, waits',
      stNav: 'NAV until {until}',
      stBackoff: 'waits until {ready}',
      stReady: 'has a frame for B',
      stSend: 'sends, attempt {k}',
      stAwait: 'awaits the reply',
      stDone: 'delivered',
      stBSend: 'sends a reply',
      stBCollide: 'collision',
      stBHear: 'receives',
      stBQuiet: 'silence',
      factDelivered: 'Delivered',
      factCollide: 'Slots with a collision at B',
      factLost: 'Frames lost',
      captionStart: 'A has data for B from slot 1, C from slot 3, while A is still sending. {hearing} {rtsState} Press → for the next slot.',
      startHidden: 'A and C do not hear each other, but both hear B.',
      startHear: 'A and C hear each other, and both hear B.',
      rtsOn: 'RTS/CTS is on.',
      rtsOff: 'RTS/CTS is off.',
      evStart: '{who} hears silence and starts sending {kind} to B (attempt {k}).',
      evStartHidden: '{who} does not hear {other}, thinks the medium is free and starts sending {kind} to B (attempt {k}).',
      evReplyCts: 'B answers with a CTS for {owner}; both A and C hear it.',
      evReplyAck: 'B has received the frame from {owner} and sends back an ACK.',
      evReplyData: '{who} got the CTS and sends DATA.',
      evDeferBusy: '{who} heard the medium busy in the previous slot, so it does not send yet.',
      evDeferNav: '{who} has a NAV until slot {until} and does not try to send.',
      evCollide: 'The frames from A and C collide at B: B can make out neither. A and C do not notice, because they do not hear each other.',
      evNav: '{who} hears the {kind} and sets its NAV until slot {until}.',
      evNavHidden: '{who} hears the CTS from B, although it has never heard {other}, and sets its NAV until slot {until}.',
      evTimeout: '{who} did not get the {kind}: the attempt failed. It tries again after {wait}, from slot {ready}.',
      wait: ['a wait of {n} slot', 'a wait of {n} slots'],
      evDelivered: 'The ACK has arrived: the frame from {who} is delivered (attempt {k}).',
      evQuiet: 'The medium is quiet.',
      captionEnd: 'After {n} slots: {done} of 2 frames delivered, slots with a collision at B: {coll}, frames lost: {lost}.',
      explain: '<p><strong>The hidden node.</strong> A wireless station cannot listen while it sends, so 802.11 avoids ' +
        'collisions (CSMA/CA): before sending it listens whether the medium is free. That does not help when two ' +
        'stations cannot hear each other: A and C are both in range of the access point B, but not of each other. C ' +
        'listens while A sends, hears nothing and starts sending, so the frames collide at B. This is the hidden node ' +
        'problem.</p>' +
        '<p><strong>Why neither A nor C notices the collision.</strong> The collision happens at B, not at the senders. ' +
        'The only sign is a missing acknowledgment (ACK); after the timeout each station tries again after a random ' +
        'wait, and as they still do not hear each other, the collision can happen again.</p>' +
        '<p><strong>Why C does anything at all when it does not hear A.</strong> RTS and CTS both carry a duration ' +
        'field that every station hearing them writes into its own NAV (Network Allocation Vector). C gets the answer ' +
        'not because it hears A, but because it hears <strong>the CTS from B</strong>, and both hear B. While the NAV ' +
        'lasts, C does not try to send.</p>' +
        '<p><strong>Is RTS/CTS required?</strong> Its use is optional per transmission, switched on by a frame-size ' +
        'threshold per station (RTS_Threshold); every device that conforms to the standard must support it. RTS/CTS ' +
        'has a cost: two more slots per frame, even when the stations hear each other anyway.</p>' +
        '<p><strong>A simplification.</strong> Time runs in slots: RTS, CTS and ACK take one each, DATA three. A new ' +
        'attempt may start only after one quiet slot, a reply at once. The waits after a failure are fixed (A: 1 then ' +
        '3 slots, C: 1 then 5) so that every run is the same; a real station picks them at random. No interference: ' +
        'every loss is a collision.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
