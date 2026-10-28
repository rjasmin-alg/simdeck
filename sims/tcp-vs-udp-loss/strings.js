/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-vs-udp-loss, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *word* in a caption or label is an English term in italics (the Croatian term rule: *English* (hrvatski) at first
   mention). Terms follow URM ch13: segment, datagram, oktet, broj potvrde, ponovni prijenos, rok za ponovni prijenos
   (RTO), pravim redoslijedom. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti niz preko TCP-a i preko UDP-a, s istim gubicima',

      // the two panels
      colTcp: 'TCP',
      colTcpSub: 'potvrđuje, šalje ponovno, predaje pravim redoslijedom',
      colUdp: 'UDP',
      colUdpSub: 'šalje jednom, ništa se ne vraća',
      laneA: 'pošiljatelj',
      laneB: 'primatelj',

      // controls
      mode: 'Gubici',
      modePattern: 'odabrani',
      modeRandom: 'slučajni',
      n: 'Broj jedinica',
      size: 'Veličina jedinice',
      loss: 'Gubitak',
      seed: 'Sjeme',
      rto: 'Rok za ponovni prijenos (RTO)',
      t: 'Vrijeme: korak',
      lose: 'Izgubljena prva slanja',
      lose2: 'Izgubljena i ponovna slanja',
      play: 'Pokreni / zaustavi',
      playBtn: 'Pokreni',
      pause: 'Pauza',
      now: 'Korak {t} od {end}',
      modeHint: 'klikni jedinicu da je izgubiš',

      // presets
      presetBook: 'Knjiga: izgubljeni segment',
      presetBookHint: 'Poglavlje 13, primjer 4: 1000, 1500, 2000; izgubi se 1500.',
      presetCall: 'Datoteka ili razgovor',
      presetCallHint: 'Poglavlje 13, primjer 6: 20 jedinica, izgube se 5. i 13.',
      presetRetx: 'Izgubi se i ponovno slanje',
      presetRetxHint: 'Jedinica 4 izgubi se dvaput; rok se udvostručuje.',
      presetNoLoss: 'Bez gubitka',
      presetNoLossHint: 'Je li UDP brži kad se ništa ne gubi?',
      presetRandom: 'Slučajno, 20 %',
      presetRandomHint: '20 jedinica, gubitak 20 %, sjeme 3.',

      // legend
      legSeg: 'podaci',
      legAck: 'ACK',
      legLost: 'izgubljeno',
      legRetx: 'ponovno',
      legHeld: 'čeka',
      legDone: 'predano',
      legLate: 'kasni (+d)',
      legChanged: 'promijenjeno',

      // chart
      slot: 'korak {n}',
      cResend: 'ponovno',
      cAgain: 'opet',
      reFlight: 'na putu',
      reHeld: 'čeka',
      reFills: 'popunjava rupu',
      dgram: '{k}. datagram',
      chartEmpty: 'Još ništa nije poslano.',
      earlier: ['↑ još {n} ranija poruka', '↑ još {n} ranije poruke', '↑ još {n} ranijih poruka'],

      // strip and summary
      strip: 'Aplikacija dobiva',
      cell: '{k}. jedinica: {fate}',
      fWait: 'još nije stigla',
      fGap: 'izgubljena, čeka ponovno slanje',
      fHeld: 'stigla, čeka u međuspremniku',
      fDone: 'predana u koraku {n}',
      fLate: 'predana u koraku {n}, kasni {d}',
      fNever: 'nikad',
      got: 'dobiveno {got} od {total} ({bytes} B)',
      finish: 'kraj u koraku {slot}',
      stall: ['najdulje čekanje {n} korak', 'najdulje čekanje {n} koraka', 'najdulje čekanje {n} koraka'],
      noStall: 'bez zastoja',
      retx: ['{n} ponovno slanje', '{n} ponovna slanja', '{n} ponovnih slanja'],
      lostN: ['{n} izgubljen zauvijek', '{n} izgubljena zauvijek', '{n} izgubljenih zauvijek'],
      slots: ['{n} korak', '{n} koraka', '{n} koraka'],

      // captions: the start
      capStart: 'Isti niz, {units} po {size} B, i isti gubici: TCP lijevo, UDP desno. {lost} Pokreni (P) ili povuci vrijeme.',
      units: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      unitsAcc: ['{n} jedinicu', '{n} jedinice', '{n} jedinica'],
      lostOne: 'Gubi se jedinica {list}.',
      lostMany: 'Gube se jedinice {list}.',
      lostTwice: '{k} (i njezino ponovno slanje)',
      lostNone: 'Ništa se ne gubi.',
      lostRandom: 'Svako slanje gubi se s vjerojatnošću {loss} % (sjeme {seed}).',
      and: ' i ',

      // captions: one slot
      capSlot: 'Korak {t}.',
      tSend: 'TCP: A šalje {seg}.',
      tResend: 'TCP: rok za {seg} je istekao; A ga šalje ponovno, a rok se udvostručuje na {rto}.',
      tResendCap: 'TCP: rok za {seg} je istekao; A ga šalje ponovno, a rok je sada {rto} (najviše).',
      tLost: 'TCP: {seg} se izgubio; B to ne vidi, a A još ne zna.',
      tHeld: 'TCP: {seg} stiže iza rupe i čeka u međuspremniku; potvrda ostaje {ack}.',
      tFills: 'TCP: {seg} popunjava rupu, pa aplikacija odjednom dobiva {units}.',
      tInorder: 'TCP: {seg} stiže i ide aplikaciji.',
      tDupAck: 'TCP: A opet dobiva ACK {ack}: broj potvrde ne napreduje.',
      tWait: 'TCP: A čeka da istekne rok za {seg}.',
      tDone: 'TCP je gotov u koraku {slot}.',
      uSend: 'UDP: A šalje {dg}.',
      uLost: 'UDP: {dg} nestaje.',
      uArrive: 'UDP: {dg} stiže i odmah ide aplikaciji.',
      uDone: 'UDP je gotov u koraku {slot}.',

      // captions: the end
      endNoLoss: 'Bez gubitka obje strane predaju sve jedinice do koraka {finish}: TCP ovdje nije sporiji.',
      endTcp: 'TCP: broj potvrde zastaje na {ack}, pa se segment {seg} šalje ponovno.',
      endHeldOne: 'Segment {next} već je stigao, ali aplikacija ga dobiva tek s njim, u koraku {slot}.',
      endHeldMany: 'Segmenti {next} već su stigli, ali aplikacija ih dobiva tek s njim, u koraku {slot}.',
      endTcpMore: ['Tako još {n} put.', 'Tako još {n} puta.', 'Tako još {n} puta.'],
      endUdp1: 'UDP: {dg} nestaje i nitko to ne doznaje; aplikacija dobiva {got} od {total} bajtova, bez zastoja.',
      endUdpN: ['UDP: {n} datagram nestaje i nitko to ne doznaje; aplikacija dobiva {got} od {total} bajtova, bez zastoja.',
        'UDP: {n} datagrama nestaju i nitko to ne doznaje; aplikacija dobiva {got} od {total} bajtova, bez zastoja.',
        'UDP: {n} datagrama nestaje i nitko to ne doznaje; aplikacija dobiva {got} od {total} bajtova, bez zastoja.'],

      explain: '<p>Lijevo i desno ide <b>isti niz</b> jedinica podataka preko istog puta, s istim gubicima. Vrijeme teče u ' +
        'koracima: jedinica k kreće u koraku k i stiže u sljedećem; potvrda se vraća još jedan korak. Traka ispod svake ' +
        'strane pokazuje što je aplikacija dobila i kada. Klikni jedinicu na traci da je izgubiš (drugi klik: izgubi se i ' +
        'njezino ponovno slanje; treći: vrati).</p>' +
        '<p><b>UDP</b> šalje svaki datagram jednom. Datagram nema rednog broja ni potvrde: što se izgubi, nestaje, i nitko to ' +
        'ne doznaje. Aplikacija odmah dobiva ono što stigne, bez zastoja, i sama odlučuje što s rupom.</p>' +
        '<p><b>TCP</b> numerira oktete. <i>Acknowledgment number</i> (broj potvrde) je sljedeći oktet koji primatelj očekuje; ' +
        'iza rupe se samo ponavlja. Primatelj ne javlja što nedostaje: potvrda prestane napredovati. Kad istekne ' +
        '<i>retransmission timeout</i> (rok za ponovni prijenos, RTO), pošiljatelj ponovno šalje najstariji nepotvrđeni ' +
        'segment, a rok za sljedeći pokušaj udvostručuje (ovdje najviše do 32 koraka). TCP podatke predaje potpune i ' +
        '<b>pravim redoslijedom</b>, pa ono što stigne iza rupe čeka u međuspremniku: to je <i>head-of-line blocking</i> ' +
        '(zastoj na čelu reda).</p>' +
        '<p>Tri zablude. „UDP je brži”: bez gubitka obje strane završavaju u istom koraku. „TCP ništa ne gubi i ništa ne ' +
        'košta”: zastoj pada na jedinice iza gubitka. „Primatelj javlja što se izgubilo”: ne javlja; kod TCP-a potvrda samo prestane napredovati.</p>' +
        '<p>Pojednostavljeno: potvrde se ne gube, nema brzog ponovnog prijenosa (to je simulator „TCP: gubitak i ponovni ' +
        'prijenos”), prozor prima sve jedinice, rok se računa od zadnjeg slanja svakog segmenta (pravi TCP ima jedan brojač koji ' +
        'svaka nova potvrda pokreće iznova), a uspostava veze se ne broji.</p>'
    },

    en: {
      stage: 'The same stream over TCP and over UDP, with the same losses',

      colTcp: 'TCP',
      colTcpSub: 'acknowledges, resends, delivers in order',
      colUdp: 'UDP',
      colUdpSub: 'sends once, nothing comes back',
      laneA: 'sender',
      laneB: 'receiver',

      mode: 'Losses',
      modePattern: 'chosen',
      modeRandom: 'random',
      n: 'Units',
      size: 'Unit size',
      loss: 'Loss',
      seed: 'Seed',
      rto: 'Retransmission timeout (RTO)',
      t: 'Time: slot',
      lose: 'First sends lost',
      lose2: 'Resends lost too',
      play: 'Play / pause',
      playBtn: 'Play',
      pause: 'Pause',
      now: 'Slot {t} of {end}',
      modeHint: 'click a unit to lose it',

      presetBook: 'Book: a lost segment',
      presetBookHint: 'Chapter 13, example 4: 1000, 1500, 2000; 1500 is lost.',
      presetCall: 'File or live call',
      presetCallHint: 'Chapter 13, example 6: 20 units, the 5th and 13th are lost.',
      presetRetx: 'The resend is lost too',
      presetRetxHint: 'Unit 4 is lost twice; the timeout doubles.',
      presetNoLoss: 'No loss',
      presetNoLossHint: 'Is UDP faster when nothing is lost?',
      presetRandom: 'Random, 20 %',
      presetRandomHint: '20 units, 20 % loss, seed 3.',

      legSeg: 'data',
      legAck: 'ACK',
      legLost: 'lost',
      legRetx: 'resend',
      legHeld: 'held',
      legDone: 'delivered',
      legLate: 'late (+d)',
      legChanged: 'changed',

      slot: 'slot {n}',
      cResend: 'resend',
      cAgain: 'again',
      reFlight: 'on its way',
      reHeld: 'held',
      reFills: 'fills the gap',
      dgram: 'datagram {k}',
      chartEmpty: 'Nothing sent yet.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],

      strip: 'The application gets',
      cell: 'unit {k}: {fate}',
      fWait: 'not arrived yet',
      fGap: 'lost, waiting for the resend',
      fHeld: 'arrived, held in the buffer',
      fDone: 'delivered in slot {n}',
      fLate: 'delivered in slot {n}, {d} late',
      fNever: 'never',
      got: 'got {got} of {total} ({bytes} B)',
      finish: 'done in slot {slot}',
      stall: ['longest wait {n} slot', 'longest wait {n} slots'],
      noStall: 'no stall',
      retx: ['{n} resend', '{n} resends'],
      lostN: ['{n} lost for good', '{n} lost for good'],
      slots: ['{n} slot', '{n} slots'],

      capStart: 'The same stream, {units} of {size} B, and the same losses: TCP on the left, UDP on the right. {lost} Play (P) or drag the time.',
      units: ['{n} unit', '{n} units'],
      unitsAcc: ['{n} unit', '{n} units'],
      lostOne: 'Unit {list} is lost.',
      lostMany: 'Units {list} are lost.',
      lostTwice: '{k} (and its resend)',
      lostNone: 'Nothing is lost.',
      lostRandom: 'Every send is lost with probability {loss} % (seed {seed}).',
      and: ' and ',

      capSlot: 'Slot {t}.',
      tSend: 'TCP: A sends {seg}.',
      tResend: 'TCP: the timeout for {seg} has run out; A sends it again and the timeout doubles to {rto}.',
      tResendCap: 'TCP: the timeout for {seg} has run out; A sends it again and the timeout is now {rto} (the maximum).',
      tLost: 'TCP: {seg} is lost; B does not see it and A does not know yet.',
      tHeld: 'TCP: {seg} arrives after a gap and is held in the buffer; the acknowledgment stays at {ack}.',
      tFills: 'TCP: {seg} fills the gap, so the application gets {units} at once.',
      tInorder: 'TCP: {seg} arrives and goes to the application.',
      tDupAck: 'TCP: A gets ACK {ack} again: the acknowledgment number does not move.',
      tWait: 'TCP: A waits for the timeout of {seg} to run out.',
      tDone: 'TCP is done in slot {slot}.',
      uSend: 'UDP: A sends {dg}.',
      uLost: 'UDP: {dg} vanishes.',
      uArrive: 'UDP: {dg} arrives and goes straight to the application.',
      uDone: 'UDP is done in slot {slot}.',

      endNoLoss: 'Without loss both deliver every unit by slot {finish}: TCP is not slower here.',
      endTcp: 'TCP: the acknowledgment stays at {ack}, so segment {seg} is sent again.',
      endHeldOne: 'Segment {next} has already arrived, but the application only gets it together with that one, in slot {slot}.',
      endHeldMany: 'Segments {next} have already arrived, but the application only gets them together with that one, in slot {slot}.',
      endTcpMore: ['The same happens {n} more time.', 'The same happens {n} more times.'],
      endUdp1: 'UDP: {dg} vanishes and nobody finds out; the application gets {got} of {total} bytes, with no stall.',
      endUdpN: ['UDP: {n} datagram vanishes and nobody finds out; the application gets {got} of {total} bytes, with no stall.',
        'UDP: {n} datagrams vanish and nobody finds out; the application gets {got} of {total} bytes, with no stall.'],

      explain: '<p>Left and right carry <b>the same stream</b> of data units over the same path, with the same losses. Time ' +
        'runs in slots: unit k leaves in slot k and arrives in the next one; an acknowledgment takes one more slot back. The ' +
        'strip under each side shows what the application got and when. Click a unit on the strip to lose it (second ' +
        'click: its resend is lost too; third: back).</p>' +
        '<p><b>UDP</b> sends each datagram once. A datagram carries no sequence number and gets no acknowledgment: what is ' +
        'lost is gone, and nobody finds out. The application gets what arrives at once, with no stall, and decides for ' +
        'itself what to do about the gap.</p>' +
        '<p><b>TCP</b> numbers bytes. The <i>acknowledgment number</i> is the next byte the receiver expects; after a gap it ' +
        'just repeats. The receiver does not report what is missing: the acknowledgment stops moving. When the ' +
        '<i>retransmission timeout</i> (RTO) runs out, the sender resends the oldest unacknowledged segment and doubles the ' +
        'timeout for the next try (here up to 32 slots). TCP delivers data complete and <b>in order</b>, so what arrives ' +
        'after a gap waits in the buffer: <i>head-of-line blocking</i>.</p>' +
        '<p>Three misconceptions. "UDP is faster": without loss both finish in the same slot. "TCP loses nothing and costs ' +
        'nothing": the stall falls on the units after the loss. "The receiver reports what was lost": it does not; in TCP the ' +
        'acknowledgment just stops moving.</p>' +
        '<p>Simplified: acknowledgments are never lost, there is no fast retransmit (that is the simulator "TCP: loss and ' +
        'retransmission"), the window takes every unit, the timeout counts from each segment\'s last send (a real TCP has one timer that every ' +
        'new acknowledgment restarts), and connection setup is not counted.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
