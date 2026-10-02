/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-window, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian is the original (the URM book's prozor.html and chapters 6 and 13); its
   terms follow the book: prozor, potvrda, oktet, segment, kružno vrijeme, nazivna propusnost, ostvarena brzina
   prijenosa, kontrola toka, kontrola zagušenja.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put između pošiljatelja i primatelja, i što veza radi svake milisekunde',
      win: 'Prozor (okteta)',
      winHint: 'Koliko okteta pošiljatelj smije imati poslano, a nepotvrđeno.',
      rtt: 'Kružno vrijeme (ms)',
      rttHint: 'Od početka slanja segmenta do dolaska njegove potvrde.',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Prozor od 1000 okteta, kao na slici u poglavlju 13, i kružno vrijeme od 4 ms. Kad stigne potvrda 2000, za koliko se prozor pomakne? Koliki dio vremena veza radi?',
      presetFull: 'Prozor jednak putu',
      presetFullHint: 'Prozor od 2000 okteta: točno onoliko koliko put primi u jednom kružnom vremenu. Miruje li veza ijednom?',
      presetFar: 'Dvostruko dulji put',
      presetFarHint: 'Isti prozor od 2000 okteta, kružno vrijeme 8 ms. Kolika je sada brzina, i koliki bi prozor trebao? Polje prozora ima 16 bita: koliko najviše okteta samo po sebi može pokazati?',
      presetBig: 'Prozor veći od puta',
      presetBigHint: 'Prozor od 4000 okteta, kružno vrijeme 4 ms. Što sada ograničava pošiljatelja? Bi li još veći prozor pomogao kad je mreža između njih zagušena?',
      legendBusy: 'veza šalje segment',
      legendIdle: 'veza miruje: prozor je pun',
      legendAck: 'stigla potvrda',
      legendEmpty: 'prazno mjesto na putu',
      sender: 'Pošiljatelj',
      receiver: 'Primatelj',
      pathLabel: 'Put: {rtt} ms tamo i natrag, stane {pipe} okteta',
      slotMs: '{k}. ms',
      goes: 'segmenti idu primatelju →',
      returns: '← potvrde se vraćaju pošiljatelju',
      rowSend: 'Veza',
      rowAck: 'Potvrda',
      msAxis: 'ms',
      factWin: 'Prozor',
      factPipe: 'Put primi',
      factPipeNote: 'veza × kružno vrijeme',
      factFlight: 'U letu / prozor',
      factBusy: 'Veza radila',
      factBusyValue: '{busy} od {ms} ms',
      factRate: 'Ostvarena brzina prijenosa',
      factLimit: 'Granica',
      rateValue: '{rate} okteta/ms = {mbit} Mbit/s',
      limitWindow: 'ograničava prozor',
      limitLink: 'ograničava veza',
      limitBoth: 'prozor točno puni put',
      captionStart: 'Sve do okteta {last} je potvrđeno. Veza nosi 500 okteta u milisekundi (4 Mbit/s), segment ima 500 okteta, a potvrda se vraća {rtt} ms nakon početka slanja. Prozor dopušta {win} okteta u letu. Pritisni → za sljedeću milisekundu.',
      captionAcks: 'Stigla je potvrda {ack}: prozor se pomaknuo i sada je {left}–{right}.',
      captionSend: '{ms}. ms: pošiljatelj šalje segment {k} ({range}). U letu je {flight} od {win} okteta.',
      captionSendFull: '{ms}. ms: pošiljatelj šalje segment {k} ({range}). U letu je {flight} od {win} okteta: prozor je pun.',
      captionIdle: '{ms}. ms: veza miruje. Pošiljatelj ima podatke, ali u letu je već cijeli prozor od {win} okteta, a sljedeća potvrda još nije stigla.',
      captionEndWindow: 'Nakon {ms} ms veza je radila {busy} ms: {rate} okteta/ms, prozor / kružno vrijeme = {win} / {rtt}. Ograničava prozor, ne veza.',
      captionEndLink: 'Nakon {ms} ms veza je radila svih {busy} ms: {rate} okteta/ms, koliko veza nosi. Ograničava veza: prozor od {win} okteta nikad se ne napuni.',
      captionEndBoth: 'Nakon {ms} ms veza je radila svih {busy} ms: {rate} okteta/ms. Prozor od {win} okteta točno je onoliko koliko put primi; manji bi ostavio rupe.',
      explain: '<p><strong>Jedan prozor po kružnom vremenu.</strong> Pošiljatelj smije imati u letu (poslano, a ' +
        'nepotvrđeno) najviše onoliko okteta koliko kaže prozor. Kad ih pošalje, čeka: nove smije poslati tek kad stigne ' +
        'potvrda i pomakne prozor, a potvrda stiže tek nakon kružnog vremena. Zato je [[achieved throughput]] najviše ' +
        'prozor / kružno vrijeme, a nikad više od nazivne propusnosti veze.</p>' +
        '<p><strong>Koliko put primi.</strong> Veza brzine R u jednom kružnom vremenu primi R × kružno vrijeme okteta ' +
        '(umnožak propusnosti i kašnjenja). Prozor manji od toga ostavlja vezu da miruje dok se čeka potvrda; prozor ' +
        'jednak tome puni vezu bez rupa; veći prozor ne ubrzava ništa, jer tada ograničava veza. Isti prozor na dvostruko ' +
        'duljem putu daje upola manju brzinu.</p>' +
        '<p><strong>16 bita.</strong> Polje prozora u zaglavlju TCP-a ima samo 16 bita, pa samo po sebi pokazuje najviše ' +
        '65 535 okteta, premalo za mnoge današnje veze velike brzine i velikog kašnjenja. Zato TCP ima proširenje za ' +
        'skaliranje prozora (poglavlje 13, „Šire o temi”).</p>' +
        '<p><strong>Kontrola toka naspram kontrole zagušenja.</strong> Polje prozora rješava kontrolu toka: njime ' +
        'primatelj pošiljatelju govori koliko je trenutačno spreman primiti, čime ga štiti od preplavljivanja vlastitim ' +
        'kapacitetom: pitanje od kraja do kraja, između dva sudionika u razgovoru. Kontrola zagušenja rješava drugo ' +
        'pitanje: sprječava da se u samu mrežu, usmjernike i veze između njih, ubaci previše podataka odjednom. Ovaj ' +
        'prikaz pokazuje samo prvo od ta dva.</p>' +
        '<p><strong>Pojednostavnjenje.</strong> Nema gubitaka, kružno vrijeme je stalno, svaki segment dobije svoju ' +
        'potvrdu, a prozor se ne mijenja. Jedna milisekunda je vrijeme slanja jednog segmenta od 500 okteta. Prozor od ' +
        '1000 okteta i početak na oktetu 1500 su sa slike u poglavlju 13; kružno vrijeme od 4 ms odabrao je simdeck.</p>'
    },
    en: {
      stage: 'The path between sender and receiver, and what the link does every millisecond',
      win: 'Window (octets)',
      winHint: 'How many octets the sender may have sent and not yet acknowledged.',
      rtt: 'Round-trip time (ms)',
      rttHint: 'From the start of sending a segment to the arrival of its acknowledgment.',
      presetBook: 'Example from the book',
      presetBookHint: 'A window of 1000 octets, as in the figure in chapter 13, and a round trip of 4 ms. When acknowledgment 2000 arrives, how far does the window move? For what share of the time is the link busy?',
      presetFull: 'Window equal to the path',
      presetFullHint: 'A window of 2000 octets: exactly what the path holds in one round trip. Is the link ever idle?',
      presetFar: 'A path twice as long',
      presetFarHint: 'The same window of 2000 octets, a round trip of 8 ms. What is the rate now, and what window would it need? The window field has 16 bits: how many octets can it show on its own at most?',
      presetBig: 'Window larger than the path',
      presetBigHint: 'A window of 4000 octets, a round trip of 4 ms. What limits the sender now? Would an even larger window help when the network between them is congested?',
      legendBusy: 'the link sends a segment',
      legendIdle: 'the link is idle: the window is full',
      legendAck: 'acknowledgment arrived',
      legendEmpty: 'an empty place on the path',
      sender: 'Sender',
      receiver: 'Receiver',
      pathLabel: 'Path: {rtt} ms there and back, holds {pipe} octets',
      slotMs: 'ms {k}',
      goes: 'segments go to the receiver →',
      returns: '← acknowledgments come back to the sender',
      rowSend: 'Link',
      rowAck: 'Ack',
      msAxis: 'ms',
      factWin: 'Window',
      factPipe: 'The path holds',
      factPipeNote: 'link × round-trip time',
      factFlight: 'In flight / window',
      factBusy: 'Link busy',
      factBusyValue: '{busy} of {ms} ms',
      factRate: 'Achieved throughput',
      factLimit: 'Limit',
      rateValue: '{rate} octets/ms = {mbit} Mbit/s',
      limitWindow: 'the window limits',
      limitLink: 'the link limits',
      limitBoth: 'the window exactly fills the path',
      captionStart: 'Everything up to octet {last} is acknowledged. The link carries 500 octets per millisecond (4 Mbit/s), a segment has 500 octets, and an acknowledgment comes back {rtt} ms after sending starts. The window allows {win} octets in flight. Press → for the next millisecond.',
      captionAcks: 'Acknowledgment {ack} has arrived: the window moved and is now {left}–{right}.',
      captionSend: 'ms {ms}: the sender sends segment {k} ({range}). {flight} of {win} octets are in flight.',
      captionSendFull: 'ms {ms}: the sender sends segment {k} ({range}). {flight} of {win} octets are in flight: the window is full.',
      captionIdle: 'ms {ms}: the link is idle. The sender has data, but the whole window of {win} octets is already in flight, and the next acknowledgment has not arrived yet.',
      captionEndWindow: 'After {ms} ms the link was busy for {busy} ms: {rate} octets/ms, window / round-trip time = {win} / {rtt}. The window limits, not the link.',
      captionEndLink: 'After {ms} ms the link was busy for all {busy} ms: {rate} octets/ms, what the link carries. The link limits: the window of {win} octets never fills.',
      captionEndBoth: 'After {ms} ms the link was busy for all {busy} ms: {rate} octets/ms. The window of {win} octets is exactly what the path holds; a smaller one would leave gaps.',
      explain: '<p><strong>One window per round trip.</strong> The sender may have in flight (sent, not yet ' +
        'acknowledged) at most as many octets as the window says. Once it has sent them, it waits: it may send new ones ' +
        'only when an acknowledgment arrives and moves the window, and an acknowledgment arrives only after a round ' +
        'trip. So the [[achieved throughput]] is at most window / round-trip time, and never more than the nominal ' +
        'bandwidth of the link.</p>' +
        '<p><strong>What the path holds.</strong> A link of rate R holds R × round-trip time octets in one round trip ' +
        '(the bandwidth-delay product). A window smaller than that leaves the link idle while the sender waits for an ' +
        'acknowledgment; a window equal to it fills the link without gaps; a larger window speeds nothing up, because ' +
        'then the link limits. The same window on a path twice as long gives half the rate.</p>' +
        '<p><strong>16 bits.</strong> The window field of the TCP header has only 16 bits, so on its own it shows at ' +
        'most 65 535 octets, too few for many of today\'s fast, long-delay links. That is why TCP has the window scaling ' +
        'extension (chapter 13, "Šire o temi").</p>' +
        '<p><strong>Flow control versus congestion control.</strong> The window field solves flow control: with it the ' +
        'receiver tells the sender how much it is ready to accept right now, which protects the receiver from being ' +
        'overrun beyond its own capacity: an end-to-end question, between the two parties of the conversation. ' +
        'Congestion control solves a different question: it keeps too much data from being put into the network itself, ' +
        'the routers and the links between them, at once. This page shows only the first of the two.</p>' +
        '<p><strong>A simplification.</strong> No loss, a fixed round-trip time, an acknowledgment for every segment, ' +
        'and a window that does not change. One millisecond is the time to send one segment of 500 octets. The window ' +
        'of 1000 octets and the start at octet 1500 are from the figure in chapter 13; the round trip of 4 ms is ' +
        'simdeck\'s choice.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
