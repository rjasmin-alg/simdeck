/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of crc-error-detection, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). Bit strings are data, not language: the page puts them in translate="no" elements.
   The parity part follows 50ohm-contents-hr/contents/sections/fehlererkennung.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.), rewritten for simdeck; the credit line is in the explanation. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Paritet i CRC na istoj poruci',
      gen: 'Generatorski polinom',
      gen4: 'CRC-4',
      gen3: 'CRC-3',
      gen8: 'CRC-8',
      genHint: 'Stupanj generatora = broj bitova FCS-a.',
      message: 'Poruka',
      messageHint: 'Ili klikni bit poruke kod pošiljatelja.',
      pattern: 'Uzorak pogreške',
      patternHint: 'Jedinica = bit koji vod promijeni. Ili klikni bit kod primatelja.',
      random: 'Nasumična poruka',
      clear: 'Bez pogrešaka',
      presetBuild: 'Pošiljatelj računa FCS',
      presetBuildHint: '1101011111 ÷ 10011: pet redova, ostatak 0010',
      presetBurst: 'Rafal: CRC otkriva, paritet promaši',
      presetBurstHint: 'Bitovi 3–6 na vodu: ostatak 0011',
      presetSingle: 'Jedan bit: otkrivaju oba',
      presetSingleHint: 'Bit 3 na vodu: ostatak 0111',
      presetBlind: 'Slijepa točka CRC-a',
      presetBlindHint: 'Bitovi 2, 5, 6: ostatak 0000',
      legendData: 'bit poruke',
      legendCheck: 'zaštitni bit (P, FCS)',
      legendFlip: 'promijenjen na vodu',
      legendChanged: 'novo u ovom koraku',
      sender: 'Pošiljatelj',
      receiver: 'Primatelj',
      frameParity: 'Paritet: poruka + P',
      frameCrc: 'CRC: poruka + FCS',
      editHint: 'klik na bit poruke mijenja poruku',
      flipHint: 'klik na bit = pogreška na vodu',
      line: 'vod',
      lineFlips: ['{n} bit promijenjen', '{n} bita promijenjena', '{n} bitova promijenjeno'],
      lineClean: 'bez pogrešaka',
      planned: ['planiran {n} bit', 'planirana {n} bita', 'planirano {n} bitova'],
      onesP: ['{n} jedinica → P = {p}', '{n} jedinice → P = {p}', '{n} jedinica → P = {p}'],
      ones: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      even: 'parno',
      odd: 'neparno',
      fcsIs: 'FCS = ostatak',
      remainder: 'ostatak',
      waiting: 'čeka okvir',
      ok: 'prihvaćeno',
      detected: 'otkriveno',
      missed: 'promašeno',
      divSender: 'Pošiljatelj dijeli poruku s dopisanim nulama',
      divReceiver: 'Primatelj dijeli primljeni okvir',
      genBox: 'generator',
      rowMark: 'red {n}',
      bitLabel: 'bit {i}: {v}',
      editLabel: 'bit poruke {i}: {v}, klik ga mijenja',
      flipLabel: 'bit {i} na vodu: {state}, klik mijenja',
      flipOn: 'promijenjen',
      flipOff: 'ispravan',
      captionStart: 'Ista poruka {data} šalje se dvaput: s bitom parnog pariteta (P = {p}) i s CRC-om. Za CRC pošiljatelj dopisuje {zeros} i dijeli s {gen} modulo 2.',
      zeros: ['{n} nulu', '{n} nule', '{n} nula'],
      captionRow: 'Red {n}: vodeći bit na mjestu {at} je 1, pa se ispod piše {gen} i radi XOR, bit po bit, bez posudbe.',
      skipped: ['Ispred toga {n} nula samo se spušta.', 'Ispred toga {n} nule samo se spuštaju.', 'Ispred toga {n} nula samo se spušta.'],
      captionNoRow: 'Poruka nema nijedne jedinice, pa nema ni reda dijeljenja.',
      captionSent: 'Ostalo je manje bitova od generatora: ostatak {fcs} je FCS. Pošiljatelj šalje {codeword}, poruku pa FCS.',
      captionSentFlip: 'Na vodu čeka pogreška; → je šalje.',
      captionSentClean: 'Klikni bitove poruke kod primatelja da ubaciš pogrešku na vodu, pa →.',
      captionLine1: 'Na vodu: {flips}, na mjestu {list}. Ista pogreška pogađa oba okvira; zaštitni bitovi stižu ispravni.',
      captionLine: 'Na vodu: {flips}, na mjestima {list}. Ista pogreška pogađa oba okvira; zaštitni bitovi stižu ispravni.',
      burst: ['Rafal je dug {n} bit, od prvog do zadnjeg promijenjenog.', 'Rafal je dug {n} bita, od prvog do zadnjeg promijenjenog.',
        'Rafal je dug {n} bitova, od prvog do zadnjeg promijenjenog.'],
      captionParityDetected: 'Primatelj broji jedinice s P: {ones}, neparno. Paritet je otkrio pogrešku.',
      captionParityMissed: 'Primatelj broji jedinice s P: {ones}, parno. Paritet prihvaća okvir i promašuje pogrešku: promijenjen je paran broj bitova.',
      captionCrcDetected: 'Ostatak dijeljenja je {rem}, različit od nule — CRC je otkrio pogrešku.',
      captionCrcMissed: 'Ostatak je {rem}: CRC prihvaća okvir, a pogreška je prošla. Uzorak pogreške je višekratnik generatora; ostatak 0 znači samo da pogreška nije otkrivena.',
      recapParityMissed: ['Paritet je promašio jer je promijenjen {n} bit (paran broj).', 'Paritet je promašio jer su promijenjena {n} bita (paran broj).',
        'Paritet je promašio jer je promijenjeno {n} bitova (paran broj).'],
      recapParityDetected: 'I paritet ju je otkrio: promijenjen je neparan broj bitova.',
      recapParityOnly: 'Paritet ju je otkrio: promijenjen je neparan broj bitova.',
      explain: '<p>Pošiljatelj uz poruku šalje zaštitne bitove, a primatelj ih ponovno izračuna i usporedi. To je ' +
        '<em lang="en">error detection</em> (otkrivanje pogrešaka): pogreška se vidi, ali se ne ispravlja.</p>' +
        '<p>Najjednostavniji je [[parity]]: jedan <em lang="en">parity bit</em> (paritetni bit) postavi se tako da je broj ' +
        'jedinica paran. Primatelj ponovno broji: neparan broj znači pogrešku. Tako otkriva svaki neparan broj promijenjenih ' +
        'bitova, a svaki paran promaši, jer dvije promjene vrate parnost.</p>' +
        '<p><em lang="en">Cyclic redundancy check</em> (ciklička provjera redundancije, CRC) čita bitove kao polinom i dijeli ' +
        'ih s <em lang="en">generator polynomial</em> (generatorski polinom), npr. x⁴ + x + 1 = 10011. Dijeli se modulo 2: ' +
        'oduzimanje je XOR, bez posudbe. Pošiljatelj dopiše r nula (r je stupanj generatora), a <em lang="en">remainder</em> ' +
        '(ostatak) od r bitova šalje iza poruke kao <em lang="en">frame check sequence</em> (provjera ispravnosti okvira, ' +
        'FCS). Primatelj dijeli cijeli primljeni okvir: ostatak 0 prihvaća, svaki drugi znači pogrešku.</p>' +
        '<p>Generator stupnja r s članom +1 (kao ova tri) otkriva svaku <em lang="en">burst error</em> (rafalna pogreška) do r bitova i svaku ' +
        'pogrešku jednog bita. Promaši samo uzorke pogrešaka koji su i sami višekratnik generatora (primjer 4), pa ostatak 0 ' +
        'znači „pogreška nije otkrivena”, a ne „poruka je ispravna”. CRC ne ispravlja: Ethernet okvir s pogrešnim FCS-om ' +
        '(CRC-32) primatelj tiho odbacuje.</p>' +
        '<p class="ce-credit">Paritet prema odjeljku o otkrivanju pogrešaka s <a href="https://50ohm.de">50ohm.de</a>, © ' +
        '50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC ' +
        'BY 4.0</a>; prerađeno za simdeck.</p>'
    },
    en: {
      stage: 'Parity and CRC on the same message',
      gen: 'Generator polynomial',
      gen4: 'CRC-4',
      gen3: 'CRC-3',
      gen8: 'CRC-8',
      genHint: 'The degree of the generator = the number of FCS bits.',
      message: 'Message',
      messageHint: 'Or click a message bit at the sender.',
      pattern: 'Error pattern',
      patternHint: 'A 1 = a bit the line flips. Or click a bit at the receiver.',
      random: 'Random message',
      clear: 'No errors',
      presetBuild: 'The sender computes the FCS',
      presetBuildHint: '1101011111 ÷ 10011: five rows, remainder 0010',
      presetBurst: 'Burst: CRC detects, parity misses',
      presetBurstHint: 'Bits 3–6 on the line: remainder 0011',
      presetSingle: 'One bit: both detect',
      presetSingleHint: 'Bit 3 on the line: remainder 0111',
      presetBlind: 'The CRC\'s blind spot',
      presetBlindHint: 'Bits 2, 5, 6: remainder 0000',
      legendData: 'message bit',
      legendCheck: 'check bit (P, FCS)',
      legendFlip: 'flipped on the line',
      legendChanged: 'new in this step',
      sender: 'Sender',
      receiver: 'Receiver',
      frameParity: 'Parity: message + P',
      frameCrc: 'CRC: message + FCS',
      editHint: 'click a message bit to change the message',
      flipHint: 'click a bit = an error on the line',
      line: 'line',
      lineFlips: ['{n} bit flipped', '{n} bits flipped'],
      lineClean: 'no errors',
      planned: ['{n} bit planned', '{n} bits planned'],
      onesP: ['{n} one → P = {p}', '{n} ones → P = {p}'],
      ones: ['{n} one', '{n} ones'],
      even: 'even',
      odd: 'odd',
      fcsIs: 'FCS = remainder',
      remainder: 'remainder',
      waiting: 'waiting for the frame',
      ok: 'accepted',
      detected: 'detected',
      missed: 'missed',
      divSender: 'The sender divides the message with zeros appended',
      divReceiver: 'The receiver divides the frame it got',
      genBox: 'generator',
      rowMark: 'row {n}',
      bitLabel: 'bit {i}: {v}',
      editLabel: 'message bit {i}: {v}, click to change it',
      flipLabel: 'bit {i} on the line: {state}, click to change',
      flipOn: 'flipped',
      flipOff: 'intact',
      captionStart: 'The same message {data} is sent twice: with an even parity bit (P = {p}) and with a CRC. For the CRC the sender appends {zeros} and divides by {gen} modulo 2.',
      zeros: ['{n} zero', '{n} zeros'],
      captionRow: 'Row {n}: the leading bit at position {at} is 1, so {gen} is written below and XORed, bit by bit, with no borrows.',
      skipped: ['Before it, {n} zero is only brought down.', 'Before it, {n} zeros are only brought down.'],
      captionNoRow: 'The message has no 1 at all, so there is no division row.',
      captionSent: 'Fewer bits are left than the generator has: the remainder {fcs} is the FCS. The sender sends {codeword}, the message then the FCS.',
      captionSentFlip: 'An error is waiting on the line; → sends the frame.',
      captionSentClean: 'Click message bits at the receiver to put an error on the line, then →.',
      captionLine1: 'On the line: {flips}, at position {list}. The same error hits both frames; the check bits arrive intact.',
      captionLine: 'On the line: {flips}, at positions {list}. The same error hits both frames; the check bits arrive intact.',
      burst: ['The burst is {n} bit long, from the first flipped bit to the last.', 'The burst is {n} bits long, from the first flipped bit to the last.'],
      captionParityDetected: 'The receiver counts the 1s with P: {ones}, odd. Even parity flips to odd, so parity detected the error.',
      captionParityMissed: 'The receiver counts the 1s with P: {ones}, even. Parity accepts the frame and misses the error: an even number of bits flipped.',
      captionCrcDetected: 'The remainder of the division is {rem}, not zero — the CRC detected the error.',
      captionCrcMissed: 'The remainder is {rem}: the CRC accepts the frame and the error got through. The error pattern is a multiple of the generator; a zero remainder only means no error was detected.',
      recapParityMissed: ['Parity missed it because {n} bit flipped (an even number).', 'Parity missed it because {n} bits flipped (an even number).'],
      recapParityDetected: 'Parity caught it too: an odd number of bits flipped.',
      recapParityOnly: 'Parity caught it: an odd number of bits flipped.',
      explain: '<p>The sender adds check bits to the message, and the receiver computes them again and compares. That is ' +
        '<em>error detection</em>: an error is seen, not corrected.</p>' +
        '<p>The simplest is [[parity]]: one <em>parity bit</em> is set so that the number of 1s is even. The receiver counts ' +
        'again: an odd count means an error. So it detects every odd number of flipped bits and misses every even number, ' +
        'because two flips restore the parity.</p>' +
        '<p>A <em>cyclic redundancy check</em> (CRC) reads the bits as a polynomial and divides them by a <em>generator ' +
        'polynomial</em>, e.g. x⁴ + x + 1 = 10011. The division is modulo 2: subtraction is XOR, with no borrows. The sender ' +
        'appends r zeros (r is the degree of the generator) and sends the r-bit <em>remainder</em> after the message as the ' +
        '<em>frame check sequence</em> (FCS). The receiver divides the whole frame it got: a remainder of 0 accepts, any ' +
        'other means an error.</p>' +
        '<p>A generator of degree r with a +1 term (like these three) detects every <em>burst error</em> of up to r bits and every single-bit error. It misses ' +
        'only error patterns that are themselves a multiple of the generator (example 4), so a zero remainder means "no ' +
        'error detected", not "the message is correct". A CRC does not correct: an Ethernet frame with a wrong FCS (CRC-32) ' +
        'is silently dropped by the receiver.</p>' +
        '<p class="ce-credit">Parity after the error detection section of <a href="https://50ohm.de">50ohm.de</a>, © ' +
        '50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY ' +
        '4.0</a>; rewritten for simdeck.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
