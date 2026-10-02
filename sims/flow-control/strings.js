/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of flow-control, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian is the original (the URM book's kontrola-toka.html and chapter 13);
   its terms follow the book: prozor, kontrola toka, kontrola zagušenja, potvrda, oktet, segment.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Niz okteta koje pošiljatelj šalje i prozor primatelja',
      win: 'Prozor koji primatelj oglašava',
      winHint: 'Koliko je okteta, od potvrde nadalje, primatelj spreman primiti.',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Prozor od 1000 okteta, kao na slici u poglavlju 13: korak 1 je trenutak 1, korak 4 trenutak 2. Za koliko se prozor pomaknuo, i je li promijenio veličinu?',
      presetSmall: 'Mali prozor: 500 okteta',
      presetSmallHint: 'Primatelj dopušta samo jedan segment. Čemu služi polje prozora: čiji kapacitet štiti, i od koga?',
      presetLarge: 'Veliki prozor: 2000 okteta',
      presetLargeHint: 'Koliko segmenata pošiljatelj pošalje prije prvog čekanja? Bi li veći prozor pomogao i kad je zagušena mreža između njih?',
      legendAcked: 'potvrđeno',
      legendFlight: 'poslano, nepotvrđeno',
      legendAllowed: 'smije se poslati',
      legendBlocked: 'ne smije se još',
      sender: 'Pošiljatelj',
      receiver: 'Primatelj',
      senderNote: 'ima još podataka',
      receiverNote: 'oglašava prozor',
      evStart: 'veza je otvorena, ništa još nije u letu',
      evSend: 'segment',
      evWait: 'čeka: segment ne stane u prozor',
      evAck: 'potvrda',
      evAckWindow: 'prozor {win}',
      winLabel: 'prozor: {win} okteta, od potvrde {ack}',
      regionAcked: 'potvrđeno',
      regionFlight: 'poslano, nepotvrđeno',
      regionAllowed: 'smije se poslati',
      regionBlocked: 'ne smije se još',
      andOn: 'i dalje',
      factAck: 'Potvrda (lijevi rub)',
      factRight: 'Desni rub prozora',
      factFlight: 'U letu / prozor',
      factFree: 'Smije još poslati',
      factSent: 'Poslano segmenata',
      factWaits: ['{n} čekanje', '{n} čekanja', '{n} čekanja'],
      captionStart: 'Primatelj je potvrdio sve do okteta {last} (potvrda {ack}: „čekam {ackAgain}”). Prozor od {win} okteta počinje od {ackStart}; desni rub je oktet {right}. Pritisni → za sljedeći korak.',
      captionSend: 'Pošiljatelj šalje segment {range}. U letu je sada {flight} od {win} okteta, pa smije poslati još {free} okteta.',
      captionSendFull: 'Pošiljatelj šalje segment {range}. U letu je sada {flight} od {win} okteta: prozor je pun.',
      captionWait: 'Sljedeći segment {range} prešao bi desni rub prozora, oktet {right}. Pošiljatelj ima podatke, ali ih ne smije poslati: čeka potvrdu.',
      captionAck: 'Stigla je potvrda {ack}: sve do okteta {last} je primljeno. Prozor se pomaknuo za {moved} okteta udesno, sada je {ackStart}–{right}, a veličina mu je ista: {win} okteta.',
      captionMoment1: 'Ovo je trenutak 1 sa slike u poglavlju 13.',
      captionMoment2: 'Ovo je trenutak 2 sa slike u poglavlju 13.',
      explain: '<p><strong>Prozor je granica koja se pomiče, ne brojka.</strong> Polje prozora (16 bita) u zaglavlju TCP-a ' +
        'govori koliko je okteta, računajući od onog iz polja potvrde, primatelj spreman primiti. Lijevi rub prozora zato ' +
        'je uvijek potvrda, a desni rub potvrda + prozor − 1. Kad potvrda napreduje, cijeli se prozor pomiče s njom, a ' +
        'njegova veličina ostaje ista dok je primatelj ne promijeni.</p>' +
        '<p><strong>Primatelj ograničava pošiljatelja.</strong> Pošiljatelj smije imati u letu (poslano, a nepotvrđeno) ' +
        'najviše onoliko okteta koliko prozor kaže. Segment čiji bi zadnji oktet prešao desni rub mora čekati, iako ' +
        'pošiljatelj ima podatke i mreža bi ih mogla prenijeti.</p>' +
        '<p><strong>Kontrola toka naspram kontrole zagušenja.</strong> Polje prozora rješava kontrolu toka: njime ' +
        'primatelj pošiljatelju govori koliko je trenutačno spreman primiti, čime ga štiti od preplavljivanja vlastitim ' +
        'kapacitetom: pitanje od kraja do kraja, između dva sudionika u razgovoru. Kontrola zagušenja rješava drugo ' +
        'pitanje: sprječava da se u samu mrežu, usmjernike i veze između njih, ubaci previše podataka odjednom. Ovaj ' +
        'prikaz pokazuje samo prvo od ta dva; poglavlje 13 objašnjava zašto ih vrijedi držati razdvojenima.</p>' +
        '<p><strong>Pojednostavnjenje.</strong> Segmenti imaju po 500 okteta, a potvrda ovdje stiže tek dok pošiljatelj ' +
        'čeka, jedna po segmentu: tako izgleda put na kojem potvrda putuje dulje nego što traje slanje cijelog prozora. ' +
        'Pravi primatelj potvrđuje čim podaci stignu i u svakoj potvrdi može oglasiti drukčiji prozor. Brojke prvog ' +
        'primjera su sa slike u poglavlju 13; veličinu prozora od 1000 okteta odabrala je slika, ne tekst.</p>'
    },
    en: {
      stage: 'The octets the sender sends, and the receiver\'s window',
      win: 'Window the receiver advertises',
      winHint: 'How many octets, from the acknowledgment on, the receiver is willing to accept.',
      presetBook: 'Example from the book',
      presetBookHint: 'A window of 1000 octets, as in the figure in chapter 13: step 1 is moment 1, step 4 is moment 2. How far did the window move, and did its size change?',
      presetSmall: 'Small window: 500 octets',
      presetSmallHint: 'The receiver allows only one segment. What is the window field for: whose capacity does it protect, and from whom?',
      presetLarge: 'Large window: 2000 octets',
      presetLargeHint: 'How many segments does the sender send before its first wait? Would a larger window also help when the network between them is congested?',
      legendAcked: 'acknowledged',
      legendFlight: 'sent, not acknowledged',
      legendAllowed: 'may be sent',
      legendBlocked: 'may not be sent yet',
      sender: 'Sender',
      receiver: 'Receiver',
      senderNote: 'has more data',
      receiverNote: 'advertises a window',
      evStart: 'the connection is open, nothing in flight yet',
      evSend: 'segment',
      evWait: 'waits: the segment does not fit in the window',
      evAck: 'acknowledgment',
      evAckWindow: 'window {win}',
      winLabel: 'window: {win} octets, from acknowledgment {ack}',
      regionAcked: 'acknowledged',
      regionFlight: 'sent, not acknowledged',
      regionAllowed: 'may be sent',
      regionBlocked: 'may not be sent yet',
      andOn: 'and on',
      factAck: 'Acknowledgment (left edge)',
      factRight: 'Right edge of the window',
      factFlight: 'In flight / window',
      factFree: 'May still send',
      factSent: 'Segments sent',
      factWaits: ['{n} wait', '{n} waits'],
      captionStart: 'The receiver has acknowledged everything up to octet {last} (acknowledgment {ack}: "I expect {ackAgain}"). The window of {win} octets starts at {ackStart}; its right edge is octet {right}. Press → for the next step.',
      captionSend: 'The sender sends segment {range}. Now {flight} of {win} octets are in flight, so it may send {free} more octets.',
      captionSendFull: 'The sender sends segment {range}. Now {flight} of {win} octets are in flight: the window is full.',
      captionWait: 'The next segment, {range}, would cross the right edge of the window, octet {right}. The sender has data but may not send it: it waits for an acknowledgment.',
      captionAck: 'Acknowledgment {ack} has arrived: everything up to octet {last} was received. The window moved {moved} octets to the right, it is now {ackStart}–{right}, and its size is the same: {win} octets.',
      captionMoment1: 'This is moment 1 of the figure in chapter 13.',
      captionMoment2: 'This is moment 2 of the figure in chapter 13.',
      explain: '<p><strong>The window is an edge that moves, not a number.</strong> The window field (16 bits) of the TCP ' +
        'header says how many octets, counting from the one in the acknowledgment field, the receiver is willing to ' +
        'accept. So the left edge of the window is always the acknowledgment, and the right edge is acknowledgment + ' +
        'window − 1. When the acknowledgment advances, the whole window moves with it, and its size stays the same until ' +
        'the receiver changes it.</p>' +
        '<p><strong>The receiver limits the sender.</strong> The sender may have in flight (sent, not yet acknowledged) ' +
        'at most as many octets as the window says. A segment whose last octet would cross the right edge has to wait, ' +
        'even though the sender has the data and the network could carry it.</p>' +
        '<p><strong>Flow control versus congestion control.</strong> The window field solves flow control: with it the ' +
        'receiver tells the sender how much it is ready to accept right now, which protects the receiver from being ' +
        'overrun beyond its own capacity: an end-to-end question, between the two parties of the conversation. ' +
        'Congestion control solves a different question: it keeps too much data from being put into the network itself, ' +
        'the routers and the links between them, at once. This page shows only the first of the two; chapter 13 explains ' +
        'why they are worth keeping apart.</p>' +
        '<p><strong>A simplification.</strong> Segments carry 500 octets each, and here an acknowledgment arrives only ' +
        'while the sender waits, one per segment: that is a path on which an acknowledgment takes longer to come back ' +
        'than it takes to send a whole window. A real receiver acknowledges as soon as data arrives and may advertise a ' +
        'different window in every acknowledgment. The numbers of the first example are from the figure in chapter 13; ' +
        'the window of 1000 octets was the figure\'s choice, not the text\'s.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
