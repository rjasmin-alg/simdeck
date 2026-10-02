/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-handshake, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM
   book's fragment trostruko-rukovanje.html and chapter 13); English is written for simdeck. Croatian terms follow
   the book: trostruko rukovanje, redni broj, početni redni broj, broj potvrde, oktet, segment, zastavica, veza. The
   glossary has only "handshake" = rukovanje (from the UL book), not the URM book's three-way handshake terms, so the
   pairs are written out in both tables and listed in NOTES.md. Numbers, flags (SYN, ACK) and the side names A and B
   are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent A i poslužitelj B razmjenjuju tri poruke trostrukog rukovanja; ispod je niz rednih brojeva svake strane',
      isn: 'Početni redni brojevi',
      isnOwn: 'Biram ih',
      isnReal: 'Kao u snimci veze',
      isnWrap: 'Kraj 32 bita',
      x: 'X (A-in početni redni broj)',
      y: 'Y (B-ov početni redni broj)',
      slidersOff: 'Brojeve sad daje odabir iznad; klizači vrijede za „Biram ih”.',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 13, Primjer 3: X = 4000, Y = 9500. Zašto B kao broj potvrde šalje 4001, a ne 4000?',
      presetSmall: 'X = 100, Y = 500',
      presetSmallHint: 'Koji broj potvrde B šalje u drugoj poruci, i koji A šalje u trećoj?',
      presetMerged: 'Tri poruke, četiri koraka',
      presetMergedHint: 'Zašto se ukupno pošalju tri poruke iako postupak ima četiri koncepcijska koraka?',
      presetOwn: 'Svaka strana svoj broj',
      presetOwnHint: 'Ovdje su oba početna broja 4000. Zašto B ipak mora poslati svoj redni broj, a ne samo potvrditi A-in?',
      presetReal: 'Pravi brojevi',
      presetRealHint: 'Početni redni brojevi iz snimke stvarne veze nisu okrugli. Vrijedi li i za njih isto pravilo potvrde?',
      presetWrap: 'Kraj 32 bita',
      presetWrapHint: 'A-in početni redni broj je najveći 32-bitni broj. Koji broj potvrde B tada šalje?',
      legendA: 'A, klijent',
      legendB: 'B, poslužitelj',
      legendNow: 'promijenjeno u ovom koraku',
      legendLater: 'još nije poslana',
      client: 'klijent',
      server: 'poslužitelj',
      iss: 'početni redni broj',
      sndNxt: 'sljedeći redni broj koji šalje',
      rcvNxt: 'očekuje od {other}',
      unknown: 'još ne zna',
      acked: '{other} je potvrdio njegov broj',
      notAcked: 'njegov broj još nije potvrđen',
      established: 'veza uspostavljena',
      step1: 'korak 1',
      step23: 'koraci 2 i 3',
      step4: 'korak 4',
      seqField: 'redni broj',
      ackField: 'potvrda',
      part2: 'korak 2: potvrda A-ina SYN-a',
      part3: 'korak 3: B-ov SYN',
      notYet: 'još nije poslano',
      lineA: 'Niz okteta koje A šalje',
      lineB: 'Niz okteta koje B šalje',
      cellSyn: 'zauzima SYN',
      cellFirst: 'prvi oktet podataka',
      cellNext: 'drugi oktet',
      expects: '{who} čeka',
      captionStart: 'Veza još nije započela. A je odabrao početni redni broj X = {x}, B će odabrati Y = {y}. ' +
        'Pritisni →.',
      caption1: 'A šalje SYN s rednim brojem {x}. Taj broj zauzima sam SYN, pa B sad čeka {x1}: na tom mjestu ' +
        'dolazi prvi oktet A-inih podataka.',
      caption2: 'B istovremeno potvrđuje A-in SYN (potvrda {x1}) i šalje vlastiti SYN (redni broj {y}), u jednoj ' +
        'poruci: SYN+ACK. Dva koncepcijska koraka, jedna poruka.',
      caption3: 'A potvrđuje B-ov SYN brojem potvrde {y1} (Y + 1). Veza je uspostavljena: svaka strana svoj je ' +
        'početni broj izgovorila i vidjela ga vraćenog s druge strane.',
      captionWrap: 'Redni broj ima 32 bita: iza {last} dolazi {zero}.',
      explain: '<p><strong>Zašto broj potvrde nije jednak rednom broju koji potvrđuje.</strong> Broj potvrde ne kaže ' +
        'što je zadnje stiglo, nego koji redni broj se očekuje sljedeći. A-in SYN zauzima redni broj X, pa prvi oktet ' +
        'A-inih stvarnih podataka dolazi na X+1, i upravo taj broj B čeka: otud potvrda X+1, a ne X.</p>' +
        '<p><strong>Četiri koraka, tri poruke.</strong> A šalje SYN sa svojim rednim brojem X (1); B potvrđuje X (2) i ' +
        'šalje vlastiti SYN s rednim brojem Y (3); A potvrđuje Y (4). B ne mora čekati zaseban krug da pošalje oboje, ' +
        'pa se koraci 2 i 3 spajaju u jednu poruku, SYN+ACK: otud trostruko, a ne četverostruko rukovanje.</p>' +
        '<p><strong>Zašto svaka strana svoj broj.</strong> TCP veza je dvosmjerna: B će i sam slati podatke A-u, pa mu ' +
        'treba vlastita polazna točka rednih brojeva, neovisna o A-inoj. Svaka strana svoj početni broj mora izgovoriti ' +
        'i vidjeti ga vraćenog s druge strane; to je jedini dokaz da druga strana govori upravo o ovoj vezi, a ne o ' +
        'nekoj staroj, zakašnjeloj poruci.</p>' +
        '<p><strong>32 bita.</strong> Redni broj i broj potvrde imaju po 32 bita i računaju se modulo 2³². Početni ' +
        'redni brojevi u stvarnoj vezi nisu okrugli, a iza najvećeg broja, 4294967295, dolazi 0.</p>'
    },
    en: {
      stage: 'Client A and server B exchange the three messages of the three-way handshake; below, each side\'s sequence numbers',
      isn: 'Initial sequence numbers',
      isnOwn: 'I choose them',
      isnReal: 'As in a captured connection',
      isnWrap: 'End of 32 bits',
      x: 'X (A\'s initial sequence number)',
      y: 'Y (B\'s initial sequence number)',
      slidersOff: 'The choice above sets the numbers now; the sliders apply to “I choose them”.',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 13, Example 3: X = 4000, Y = 9500. Why does B send 4001 as its acknowledgment number, not 4000?',
      presetSmall: 'X = 100, Y = 500',
      presetSmallHint: 'Which acknowledgment number does B send in the second message, and which does A send in the third?',
      presetMerged: 'Three messages, four steps',
      presetMergedHint: 'Why are only three messages sent when the procedure has four conceptual steps?',
      presetOwn: 'Each side its own number',
      presetOwnHint: 'Here both initial numbers are 4000. Why must B still send its own sequence number, not just acknowledge A\'s?',
      presetReal: 'Real numbers',
      presetRealHint: 'The initial sequence numbers in a captured connection are not round. Does the same acknowledgment rule hold?',
      presetWrap: 'End of 32 bits',
      presetWrapHint: 'A\'s initial sequence number is the largest 32-bit number. Which acknowledgment number does B send?',
      legendA: 'A, the client',
      legendB: 'B, the server',
      legendNow: 'changed in this step',
      legendLater: 'not sent yet',
      client: 'client',
      server: 'server',
      iss: 'initial sequence number',
      sndNxt: 'next sequence number it sends',
      rcvNxt: 'expects from {other}',
      unknown: 'does not know yet',
      acked: '{other} has acknowledged its number',
      notAcked: 'its number is not acknowledged yet',
      established: 'connection established',
      step1: 'step 1',
      step23: 'steps 2 and 3',
      step4: 'step 4',
      seqField: 'seq',
      ackField: 'ack',
      part2: 'step 2: acknowledges A\'s SYN',
      part3: 'step 3: B\'s SYN',
      notYet: 'not sent yet',
      lineA: 'The octets A sends',
      lineB: 'The octets B sends',
      cellSyn: 'taken by the SYN',
      cellFirst: 'first data octet',
      cellNext: 'second octet',
      expects: '{who} waits for',
      captionStart: 'The connection has not started. A has chosen the initial sequence number X = {x}; B will choose ' +
        'Y = {y}. Press →.',
      caption1: 'A sends a SYN with sequence number {x}. The SYN itself takes that number, so B now waits for {x1}: ' +
        'A\'s first data octet will come there.',
      caption2: 'B acknowledges A\'s SYN (ack {x1}) and sends its own SYN (seq {y}) at the same time, in one message: ' +
        'SYN+ACK. Two conceptual steps, one message.',
      caption3: 'A acknowledges B\'s SYN with acknowledgment number {y1} (Y + 1). The connection is established: each ' +
        'side has stated its initial number and seen it come back from the other side.',
      captionWrap: 'A sequence number has 32 bits: after {last} comes {zero}.',
      explain: '<p><strong>Why the acknowledgment number is not the sequence number it acknowledges.</strong> The ' +
        'acknowledgment number does not say what arrived last; it says which sequence number is expected next. A\'s SYN ' +
        'takes sequence number X, so the first octet of A\'s real data comes at X+1, and that is the number B waits for: ' +
        'hence the acknowledgment X+1, not X.</p>' +
        '<p><strong>Four steps, three messages.</strong> A sends a SYN with its sequence number X (1); B acknowledges X ' +
        '(2) and sends its own SYN with sequence number Y (3); A acknowledges Y (4). B need not wait for a separate round ' +
        'to send both, so steps 2 and 3 combine into one message, the SYN+ACK: hence a three-way, not a four-way, ' +
        'handshake.</p>' +
        '<p><strong>Why each side has its own number.</strong> A TCP connection runs both ways: B will send data to A ' +
        'too, so it needs its own starting point for sequence numbers, independent of A\'s. Each side must state its ' +
        'initial number and see it come back from the other side; that is the only proof that the other side is talking ' +
        'about this connection, not an old, delayed message.</p>' +
        '<p><strong>32 bits.</strong> The sequence and acknowledgment numbers have 32 bits each and are counted modulo ' +
        '2³². Initial sequence numbers in a real connection are not round, and after the largest number, 4294967295, ' +
        'comes 0.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
