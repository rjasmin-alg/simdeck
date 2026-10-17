/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-retransmit, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *word* in a caption is an English term in italics (the Croatian term rule: *English* (hrvatski) at first mention).
   Terms follow URM ch13 and ch15: segment, redni broj, broj potvrde, oktet, ponovni prijenos, rok za ponovni prijenos
   (RTO), dupla potvrda, brzi ponovni prijenos, kružno vrijeme. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pošiljatelj i primatelj: segmenti, potvrde i rok za ponovni prijenos',

      // controls
      flow: 'Segmenti × okteti',
      flowRto: '3 × 500',
      flowFast: '5 × 375',
      flowFive: '5 × 500',
      lose: 'Izgubi se',
      loseNone: 'ništa',
      loseSeg: '{k}. segment',
      loseAck: '{k}. potvrda (ACK)',
      loseRetx: 'Koliko se ponovnih slanja izgubi',
      bufferOoo: 'B čuva segmente iza rupe',
      rtt: 'Kružno vrijeme (RTT)',

      // presets
      presetRto: 'Knjiga: istek roka',
      presetRtoHint: 'Poglavlje 13, primjer 4: 1000, 1500, 2000; izgubi se 1500.',
      presetFast: 'Knjiga: tri duple potvrde',
      presetFastHint: 'Poglavlje 15, primjer 5: ACK 4500 četiri puta, pa 6000.',
      presetAck: 'Izgubljena potvrda',
      presetAckHint: 'Izgubi se ACK 2000. Šalje li A išta ponovno?',
      presetBackoff: 'Udvostručavanje roka',
      presetBackoffHint: 'Izgube se i prva dva ponovna slanja: rok 1 s, 2 s, 4 s.',
      presetNoBuffer: 'Primatelj bez međuspremnika',
      presetNoBufferHint: 'B odbacuje segmente iza rupe. Koliko toga A mora poslati ponovno?',

      // legend
      legSeg: 'segment',
      legAck: 'potvrda (ACK)',
      legDup: 'dupla potvrda',
      legLost: 'izgubljen',
      legRetx: 'ponovni prijenos',
      legTimer: 'rok (RTO)',
      legChanged: 'promijenjeno u ovom koraku',

      // chart
      laneA: 'Pošiljatelj',
      laneB: 'Primatelj',
      chartEmpty: 'Još ništa nije poslano.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      reFlight: 'putuje',
      reLost: 'izgubljen',
      reHeld: 'čuva',
      reDiscarded: 'odbacuje',
      reFills: 'rupa popunjena',
      reAlready: 'već ima',
      reFast: 'brzo ponovno',
      rePartial: 'djelomična',
      cRto: 'RTO',
      cFast: 'brzi',
      cPartial: 'djelom.',
      cDup: 'dupla {k}',
      noteRto: 'rok istekao',

      // sender panel
      aTitle: 'Pošiljatelj A',
      now: 'vrijeme',
      win: 'Poslano',
      cellAcked: 'potvrđen',
      cellOut: 'čeka potvrdu',
      cellNot: 'nije poslan',
      sent: ['poslan {n}×', 'poslan {n}×', 'poslan {n}×'],
      una: 'najstariji nepotvrđeni',
      allAcked: 'sve potvrđeno',
      timer: 'Rok za ponovni prijenos',
      timerLeft: 'još {left} ms (istječe u {at} ms)',
      timerOff: 'ne teče: ništa ne čeka potvrdu',
      timerIdle: 'ne teče: ništa još nije poslano',
      timerExpired: 'istekao, novi rok {rto}',
      dups: 'Duple potvrde',
      dupOf: '{k} od 3',
      dupFast: '3. pokreće brzi ponovni prijenos',
      rttSample: 'Uzorak kružnog vremena',
      rttNone: 'još nema',
      rttKarn: 'nema (Karn: potvrda za ponovno poslan segment)',

      // receiver panel
      bTitle: 'Primatelj B',
      buf: 'Primljeno',
      cellIn: 'primljen redom',
      cellHeld: 'čuva iza rupe',
      cellGap: 'rupa',
      cellDropped: 'odbačen',
      cellWait: 'još nije stigao',
      expects: 'očekuje (broj potvrde)',
      noBuffer: 'B ne čuva ništa iza rupe.',
      gapIs: 'rupa {from}–{to}',

      // captions
      capStart: 'A treba primatelju B poslati {count}, od {first} do {last}. {lost} Pritisni → za sljedeći korak.',
      capLostNone: 'Ništa se ne gubi.',
      capLostSeg: 'Na putu se izgubi {k}. segment.',
      capLostAck: 'Na putu se izgubi {k}. potvrda.',
      capLostRetx: ['I njegovo prvo ponovno slanje.', 'I njegova prva {n} ponovna slanja.', 'I njegovih prvih {n} ponovnih slanja.'],
      segCount: ['{n} segment od {len} okteta', '{n} segmenta od {len} okteta', '{n} segmenata od {len} okteta'],
      capWindow: 'A šalje {count} zaredom, jedan svakih 10 ms (do {last} ms). Prvo slanje pokreće *retransmission timeout* (rok za ponovni prijenos, RTO) od {rto}.',
      capInorder: 'Segment {seg} stiže redom. B sad očekuje oktet {n} i odgovara ACK {n}: broj potvrde je sljedeći oktet koji očekuje, ne zadnji koji je primio.',
      capHeld: 'Segment {seg} stiže iza rupe: nedostaje {gap}. B ga čuva, ali ne može pomaknuti potvrdu: njegova potvrda ostaje ACK {n}. Ne javlja što nedostaje.',
      capDiscarded: 'Segment {seg} stiže iza rupe: nedostaje {gap}. Ovaj B ne čuva ništa iza rupe: odbacuje ga, a potvrda ostaje ACK {n}.',
      capFills: 'Ponovno poslan segment {seg} popunjava rupu. B već čuva {held}, pa potvrda preskače sve to: ACK {n}.',
      capAlready: 'Segment {seg} donosi podatke koje B već ima. B ih ne uzima drugi put i ponavlja ACK {n}.',
      capSegLost: 'Segment {seg} se izgubio na putu. B ne zna da je uopće poslan, a A to još ne zna.',
      capAckLost: 'Potvrda ACK {n} se izgubila na putu. A za nju ne zna.',
      capAckNew: 'Stiže ACK {n}: sve do okteta {n} je potvrđeno. A briše brojač duplih potvrda i ponovno pokreće rok ({rto}) za podatke koji još čekaju.',
      capAckCovers: 'Pokriva i ono što je potvrđivala izgubljena ACK {m}: potvrda je kumulativna, pa se ništa ne šalje ponovno.',
      capSample: 'Uzorak kružnog vremena: {ms} ms.',
      capKarn: 'Karn: segment je poslan više puta, pa A iz ove potvrde ne uzima uzorak kružnog vremena (ne zna na koju kopiju odgovara).',
      capAckAll: 'Stiže ACK {n}: potvrđeno je sve što je A poslao. Rok se zaustavlja.',
      capDup: 'Stiže ACK {n}, a A već zna da B očekuje {n}: broj se nije pomaknuo. To je *duplicate ACK* (dupla potvrda), {k}. po redu. A je broji, ali još ništa ne šalje.',
      capDupMore: 'Opet ACK {n}, dupla {k}. A je segment od {n} već poslao ponovno i ne šalje ga još jednom.',
      capFast: 'Stigla je treća *duplicate ACK* (dupla potvrda) {n}. A ne čeka istek roka (RTO): odmah ponovno šalje segment od {n}. To je *fast retransmit* (brzi ponovni prijenos).',
      capPartial: 'Stiže ACK {n}: potvrda se pomaknula, ali ne do kraja poslanog ({end}), pa nedostaje i segment od {n}. A ga odmah šalje ponovno; što još B ima, A ne zna.',
      capRto: 'Rok za segment od {seg} je istekao, a nijedna potvrda nije prešla {seg}. A ga šalje ponovno i udvostručuje rok na {rto}.',
      capRtoFew: ['Stigla je samo {n} dupla potvrda: premalo za brzi ponovni prijenos.', 'Stigle su samo {n} duple potvrde: premalo za brzi ponovni prijenos.', 'Stiglo je samo {n} duplih potvrda: premalo za brzi ponovni prijenos.'],
      capRtoCap: 'Rok je već na najvećoj vrijednosti od {rto}.',
      capDone: 'Sve je potvrđeno za {t} ms.',
      capTrunc: 'Prikaz staje nakon 20 koraka; razmjena se nastavlja na isti način.',
      ms: '{n} ms',
      sec: '{n} s',

      explain: '<p>TCP numerira oktete. <b>Broj potvrde</b> je sljedeći oktet koji primatelj očekuje, a potvrda je ' +
        'kumulativna: ACK 2500 znači „imam sve do 2499”. Zato izgubljena potvrda obično ne smeta, sljedeća je pokriva.</p>' +
        '<p>Kad se segment izgubi, primatelj ne šalje poruku o tome što nedostaje. Svaki segment koji stigne iza rupe ' +
        'samo ponovi isti broj potvrde: to je <i>duplicate ACK</i> (dupla potvrda). Hoće li segmente iza rupe sačuvati, ' +
        'stvar je implementacije; norma to preporučuje i današnji TCP ih čuva. Primjer bez međuspremnika pokazuje zašto.</p>' +
        '<p>Pošiljatelj ima dva načina da sazna za gubitak. <b><i>Retransmission timeout</i> (rok za ponovni prijenos, RTO):</b> ako potvrda ne prijeđe ' +
        'najstariji nepotvrđeni oktet prije isteka roka, pošiljatelj taj segment šalje ponovno i rok udvostručuje. Ovdje rok ' +
        'kreće od 1 s; inače se računa iz izmjerenog kružnog vremena. <b><i>Fast retransmit</i> (brzi ponovni prijenos):</b> treća dupla potvrda ' +
        'znači da podaci iza rupe stižu, pa pošiljatelj ne čeka rok i odmah šalje segment koji nedostaje. Dvije duple ' +
        'potvrde nisu dovoljne: mogu značiti i samo zamijenjen redoslijed.</p>' +
        '<p>Iz potvrde za segment koji je poslan više puta ne uzima se uzorak kružnog vremena (Karnov algoritam): ne zna se ' +
        'na koju kopiju odgovara.</p>' +
        '<p>Promjena onoga što se gubi vrijedi od sljedećeg koraka; ono što se već dogodilo, ostaje.</p>' +
        '<p>Izvori: URM, poglavlje 13 (primjer 4) i 15 (primjer 5); RFC 9293, RFC 6298, RFC 5681, RFC 6582.</p>'
    },
    en: {
      stage: 'Sender and receiver: segments, acknowledgments and the retransmission timer',

      flow: 'Segments × bytes',
      flowRto: '3 × 500',
      flowFast: '5 × 375',
      flowFive: '5 × 500',
      lose: 'Lost',
      loseNone: 'nothing',
      loseSeg: 'segment #{k}',
      loseAck: 'B\'s ACK #{k}',
      loseRetx: 'How many resends are lost too',
      bufferOoo: 'B keeps segments after a gap',
      rtt: 'Round-trip time (RTT)',

      presetRto: 'Book: the timer expires',
      presetRtoHint: 'Chapter 13, example 4: 1000, 1500, 2000; 1500 is lost.',
      presetFast: 'Book: three duplicate ACKs',
      presetFastHint: 'Chapter 15, example 5: ACK 4500 four times, then 6000.',
      presetAck: 'A lost ACK',
      presetAckHint: 'ACK 2000 is lost. Does A resend anything?',
      presetBackoff: 'The timer doubles',
      presetBackoffHint: 'The first two resends are lost too: timeouts of 1 s, 2 s, 4 s.',
      presetNoBuffer: 'A receiver without a buffer',
      presetNoBufferHint: 'B discards segments after a gap. How much must A resend?',

      legSeg: 'segment',
      legAck: 'acknowledgment (ACK)',
      legDup: 'duplicate ACK',
      legLost: 'lost',
      legRetx: 'retransmission',
      legTimer: 'timer (RTO)',
      legChanged: 'changed in this step',

      laneA: 'Sender',
      laneB: 'Receiver',
      chartEmpty: 'Nothing sent yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      reFlight: 'on its way',
      reLost: 'lost',
      reHeld: 'kept',
      reDiscarded: 'discarded',
      reFills: 'gap filled',
      reAlready: 'already has it',
      reFast: 'resend now',
      rePartial: 'partial',
      cRto: 'RTO',
      cFast: 'fast',
      cPartial: 'partial',
      cDup: 'dup {k}',
      noteRto: 'timer expired',

      aTitle: 'Sender A',
      now: 'time',
      win: 'Sent',
      cellAcked: 'acknowledged',
      cellOut: 'awaiting ACK',
      cellNot: 'not sent',
      sent: ['sent {n}×', 'sent {n}×'],
      una: 'oldest unacknowledged',
      allAcked: 'all acknowledged',
      timer: 'Retransmission timer',
      timerLeft: '{left} ms left (expires at {at} ms)',
      timerOff: 'stopped: nothing awaits an ACK',
      timerIdle: 'stopped: nothing sent yet',
      timerExpired: 'expired, new timeout {rto}',
      dups: 'Duplicate ACKs',
      dupOf: '{k} of 3',
      dupFast: 'the 3rd triggers fast retransmit',
      rttSample: 'Round-trip time sample',
      rttNone: 'none yet',
      rttKarn: 'none (Karn: ACK for a resent segment)',

      bTitle: 'Receiver B',
      buf: 'Received',
      cellIn: 'received in order',
      cellHeld: 'kept after a gap',
      cellGap: 'gap',
      cellDropped: 'discarded',
      cellWait: 'not arrived yet',
      expects: 'expects (ACK number)',
      noBuffer: 'B keeps nothing after a gap.',
      gapIs: 'gap {from}–{to}',

      capStart: 'A has {count} to send to B, from {first} to {last}. {lost} Press → for the next step.',
      capLostNone: 'Nothing is lost.',
      capLostSeg: 'Segment #{k} is lost on the way.',
      capLostAck: 'B\'s ACK #{k} is lost on the way.',
      capLostRetx: ['So is its first resend.', 'So are its first {n} resends.'],
      segCount: ['{n} segment of {len} bytes', '{n} segments of {len} bytes'],
      capWindow: 'A sends {count} back to back, one every 10 ms (until {last} ms). The first send starts the retransmission timeout (RTO) of {rto}.',
      capInorder: 'Segment {seg} arrives in order. B now expects byte {n} and answers ACK {n}: the ACK number is the next byte it expects, not the last one it got.',
      capHeld: 'Segment {seg} arrives after a gap: {gap} is missing. B keeps it but cannot move the ACK: its ACK stays at {n}. It does not say what is missing.',
      capDiscarded: 'Segment {seg} arrives after a gap: {gap} is missing. This B keeps nothing after a gap: it discards the segment, and its ACK stays at {n}.',
      capFills: 'The resent segment {seg} fills the gap. B already holds {held}, so the ACK jumps over all of it: ACK {n}.',
      capAlready: 'Segment {seg} carries data B already has. B does not take it twice and repeats ACK {n}.',
      capSegLost: 'Segment {seg} is lost on the way. B does not know it was ever sent, and A does not know yet.',
      capAckLost: 'ACK {n} is lost on the way. A never hears of it.',
      capAckNew: 'ACK {n} arrives: everything before byte {n} is acknowledged. A clears its duplicate count and restarts the timer ({rto}) for the data still outstanding.',
      capAckCovers: 'It also covers what the lost ACK {m} acknowledged: ACKs are cumulative, so nothing is resent.',
      capSample: 'Round-trip time sample: {ms} ms.',
      capKarn: 'Karn: the segment was sent more than once, so A takes no round-trip time sample from this ACK (it cannot tell which copy it answers).',
      capAckAll: 'ACK {n} arrives: everything A sent is acknowledged. The timer stops.',
      capDup: 'ACK {n} arrives, and A already knew B expects {n}: the number has not moved. A duplicate ACK, number {k}. A counts it but sends nothing yet.',
      capDupMore: 'ACK {n} again, duplicate {k}. A has already resent the segment at {n} and does not resend it again.',
      capFast: 'The third duplicate ACK {n} has arrived. A does not wait for the RTO: it resends the segment at {n} at once. This is fast retransmit.',
      capPartial: 'ACK {n} arrives: the ACK moves, but not to the end of what was sent ({end}), so the segment at {n} is missing too. A resends it at once; it cannot tell what else B holds.',
      capRto: 'The RTO for the segment at {seg} has expired with no ACK past {seg}. A resends it and doubles the timer to {rto}.',
      capRtoFew: ['Only {n} duplicate ACK came: not enough for fast retransmit.', 'Only {n} duplicate ACKs came: not enough for fast retransmit.'],
      capRtoCap: 'The timer is already at its maximum of {rto}.',
      capDone: 'Everything is acknowledged after {t} ms.',
      capTrunc: 'The demo stops after 20 steps; the exchange goes on the same way.',
      ms: '{n} ms',
      sec: '{n} s',

      explain: '<p>TCP numbers bytes. The <b>acknowledgment number</b> is the next byte the receiver expects, and ACKs are ' +
        'cumulative: ACK 2500 means "I have everything up to 2499". So a lost ACK usually does no harm; the next one covers it.</p>' +
        '<p>When a segment is lost, the receiver sends no message about what is missing. Every segment that arrives after the ' +
        'gap just repeats the same ACK number: a <i>duplicate ACK</i>. Whether the segments after the gap are kept is up to ' +
        'the implementation; the standard recommends it and today\'s TCPs do. The example without a buffer shows why.</p>' +
        '<p>The sender learns of a loss in two ways. <b>Retransmission timeout (RTO):</b> if no ACK passes the oldest ' +
        'unacknowledged byte before the timer expires, the sender resends that segment and doubles the timer. Here the ' +
        'timer starts at 1 s; normally it is computed from the measured round-trip time. <b>Fast retransmit:</b> a third ' +
        'duplicate ACK means data after the gap is arriving, so the sender does not wait for the timer and resends the ' +
        'missing segment at once. Two duplicates are not enough: they may only mean reordering.</p>' +
        '<p>No round-trip time sample is taken from an ACK for a segment that was sent more than once (Karn\'s algorithm): ' +
        'nobody can tell which copy it answers.</p>' +
        '<p>A change to what is lost applies from the next step; what has already happened stays.</p>' +
        '<p>Sources: URM chapters 13 (example 4) and 15 (example 5); RFC 9293, RFC 6298, RFC 5681, RFC 6582.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
