/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of hash-properties, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Terms missing from kit/glossary.js are written out (NOTES.md, Term pairs). The title and subtitle come from sim.json.
   Inputs, digests, toy messages ("poruka 5") and toy values are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva ulaza i njihovi sažeci',
      inputA: 'Ulaz A',
      inputB: 'Ulaz B',
      inputHint: 'Upiši ili promijeni tekst',
      bytes: ['{n} bajt', '{n} bajta', '{n} bajtova'],
      plusNewline: '+ znak novog retka',
      digestLabel: 'Sažetak SHA-256 · 256 bitova = 64 heksadekadska znaka',
      gridLabel: 'Bitovi sažetka {which}: 16 × 16, bajtovi slijeva nadesno, najznačajniji bit prvi',
      diffCount: '{n} od 256 bitova se razlikuje',
      verdictSame: 'Isti sažetak: ulaz je (gotovo sigurno) isti.',
      verdictDiff: 'Različit sažetak: ulaz nije isti.',
      oneWay: 'Natrag nema puta: iz sažetka se ulaz ne izračunava, samo pogađa.',

      toyTitle: 'Mali sažetak od {bits} bitova',
      toySub: 'prvih {bits} bitova SHA-256 za poruke „{first}” … „{last}”',
      toyMessages: 'Poruka',
      toyPossible: 'Mogućih vrijednosti',
      toyUsed: 'Zauzetih vrijednosti',
      toyRepeats: 'Kolizija (ponovljenih)',
      toyExpected: 'Prva kolizija očekuje se oko',
      toyExpectedVal: '{n}. poruke',
      toyFirst: 'Prva kolizija',
      toyNone: 'Još nema kolizije.',
      toyMapTaken: 'Zauzeta vrijednost',
      toyMapRepeated: 'Ponovljena vrijednost',
      toyMapLabel: 'Svih 256 vrijednosti, od 0x00 do 0xff',
      toyMapAria: 'Karta 256 vrijednosti: zauzete ispunjene, ponovljene šrafirane, vrijednost prve kolizije označena rombom',
      toyMeter: 'Za crtež je previše vrijednosti: zauzeto {used} od {size}.',

      newline: 'B: znak novog retka na kraju',
      newlineHint: 'Mnogi programi ga dodaju na kraj retka.',
      toyBits: 'Mali sažetak',
      toyBits8: '8 bitova',
      toyBits16: '16 bitova',
      toyCount: 'Broj poruka',

      presetAbc: 'abc = abc',
      presetAbcHint: 'Primjer iz norme: ba7816bf…f20015ad',
      presetOneChar: 'Jedan znak: abc → abd',
      presetOneCharHint: '122 od 256 bitova se mijenja',
      presetPayment: 'Plaćanje: 100 → 900',
      presetPaymentHint: 'Jedna znamenka, 133 bita drugačije',
      presetEmpty: 'Prazan ulaz i dugi ulaz',
      presetEmptyHint: 'Oba sažetka imaju 64 znaka',
      presetNewline: 'Znak novog retka',
      presetNewlineHint: 'abc i abc s novim retkom',
      presetToy8: 'Kolizija, 8 bitova',
      presetToy8Hint: 'poruka 5 i poruka 22',
      presetToy16: 'Kolizija, 16 bitova',
      presetToy16Hint: 'poruka 248 i poruka 449',

      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendDiff: 'bit se razlikuje (A ≠ B)',
      legendPair: 'par u koliziji',

      capSame: 'A i B su isti ulaz, pa je i sažetak isti: {n} od 256 bitova se razlikuje. Na tome počiva provjera cjelovitosti.',
      capOne: 'Promijenjen je jedan znak, a u sažetku se promijenilo {n} od 256 bitova.',
      capNewline: 'Jedina razlika je znak novog retka na kraju B, a u sažetku se razlikuje {n} od 256 bitova.',
      capMore: 'Ulazi se razlikuju u više znakova; u sažetku se razlikuje {n} od 256 bitova, a duljina je ista: 64 znaka.',
      capToyHit: 'Sažetak od {bits} bitova prvi se put ponovio već kod {j}. poruke: {mi} i {mj} daju {value}.',
      capToyNone: 'Poruka: {n}. Sažetak od {bits} bitova još se nije ponovio; prva kolizija očekuje se oko {exp}. poruke.',

      explain: '<p><i lang="en">Hash function</i> (funkcija sažimanja) od ulaza bilo koje duljine računa ' +
        '<i lang="en">hash</i> (sažetak) stalne duljine: SHA-256 uvijek daje 256 bitova, 64 heksadekadska znaka, i za prazan ulaz.</p>' +
        '<p>Isti ulaz uvijek daje isti sažetak. Zato se <i lang="en">integrity</i> (cjelovitost) provjerava usporedbom sažetaka: ' +
        'isti sažetak, dakle ista datoteka. Tako radi i <i lang="en">checksum</i> (kontrolni zbroj) uz preuzeti paket.</p>' +
        '<p><i lang="en">Avalanche effect</i> (lavinski učinak): promjena jednog znaka mijenja otprilike polovicu bitova sažetka, ' +
        'ne jedan. Slični ulazi ne daju slične sažetke.</p>' +
        '<p>Sažetak nije šifriranje: nema ključa ni puta natrag. Funkcija je <i lang="en">one-way</i> (jednosmjerna): ulaz se može ' +
        'samo pogađati, pokušaj po pokušaj. O tome ovisi spremanje lozinki.</p>' +
        '<p><i lang="en">Collision</i> (kolizija) mora postojati: ulaza ima beskonačno mnogo, a sažetaka 2²⁵⁶. Za sažetak ' +
        'od n bitova prva se očekuje nakon oko √(π/2 · 2ⁿ) ulaza: oko 20 za 8 bitova, 321 za 16, 82 000 za 32. ' +
        'Za 256 bitova to je oko 2¹²⁸ pokušaja: kolizije postoje, ali ih nitko ne zna naći.</p>'
    },
    en: {
      stage: 'Two inputs and their digests',
      inputA: 'Input A',
      inputB: 'Input B',
      inputHint: 'Type or change the text',
      bytes: ['{n} byte', '{n} bytes'],
      plusNewline: '+ a newline character',
      digestLabel: 'Digest SHA-256 · 256 bits = 64 hex characters',
      gridLabel: 'Bits of digest {which}: 16 × 16, bytes left to right, most significant bit first',
      diffCount: '{n} of 256 bits differ',
      verdictSame: 'Same digest: the input is (almost certainly) the same.',
      verdictDiff: 'Different digest: the input is not the same.',
      oneWay: 'There is no way back: the input is not computed from the digest, only guessed.',

      toyTitle: 'Toy hash of {bits} bits',
      toySub: 'the first {bits} bits of SHA-256 for the messages “{first}” … “{last}”',
      toyMessages: 'Messages',
      toyPossible: 'Possible values',
      toyUsed: 'Values taken',
      toyRepeats: 'Collisions (repeats)',
      toyExpected: 'First collision expected around',
      toyExpectedVal: 'message {n}',
      toyFirst: 'First collision',
      toyNone: 'No collision yet.',
      toyMapTaken: 'Value taken',
      toyMapRepeated: 'Value hit twice or more',
      toyMapLabel: 'All 256 values, from 0x00 to 0xff',
      toyMapAria: 'Map of the 256 values: taken ones filled, repeated ones hatched, the first collision\'s value marked with a diamond',
      toyMeter: 'Too many values to draw: {used} of {size} taken.',

      newline: 'B: a newline at the end',
      newlineHint: 'Many programs add one at the end of a line.',
      toyBits: 'Toy hash',
      toyBits8: '8 bits',
      toyBits16: '16 bits',
      toyCount: 'Number of messages',

      presetAbc: 'abc = abc',
      presetAbcHint: 'The standard\'s example: ba7816bf…f20015ad',
      presetOneChar: 'One character: abc → abd',
      presetOneCharHint: '122 of 256 bits change',
      presetPayment: 'Payment: 100 → 900',
      presetPaymentHint: 'One digit, 133 bits different',
      presetEmpty: 'Empty input and a long one',
      presetEmptyHint: 'Both digests have 64 characters',
      presetNewline: 'Newline character',
      presetNewlineHint: 'abc and abc with a newline',
      presetToy8: 'Collision, 8 bits',
      presetToy8Hint: 'poruka 5 and poruka 22',
      presetToy16: 'Collision, 16 bits',
      presetToy16Hint: 'poruka 248 and poruka 449',

      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendDiff: 'bit differs (A ≠ B)',
      legendPair: 'colliding pair',

      capSame: 'A and B are the same input, so the digest is the same too: {n} of 256 bits differ. Integrity checks rest on this.',
      capOne: 'One character changed, and {n} of the 256 digest bits flipped.',
      capNewline: 'The only difference is a newline at the end of B, and {n} of the 256 digest bits differ.',
      capMore: 'The inputs differ in more than one character; {n} of the 256 digest bits differ, and the length is the same: 64 characters.',
      capToyHit: 'The {bits}-bit digest repeated already at message {j}: {mi} and {mj} both give {value}.',
      capToyNone: 'Messages: {n}. The {bits}-bit digest has not repeated yet; the first collision is expected around message {exp}.',

      explain: '<p>A hash function computes a hash (digest) of fixed length from an input of any length: SHA-256 always gives ' +
        '256 bits, 64 hex characters, even for an empty input.</p>' +
        '<p>The same input always gives the same digest. That is why integrity is checked by comparing digests: same digest, ' +
        'so the same file. A checksum published with a downloaded package works the same way.</p>' +
        '<p>Avalanche effect: changing one character flips about half of the digest bits, not one. Similar inputs do not give ' +
        'similar digests.</p>' +
        '<p>A hash is not encryption: there is no key and no way back. The function is one-way: the input can only be guessed, ' +
        'one try at a time. Password storage depends on this.</p>' +
        '<p>A collision must exist: there are infinitely many inputs and 2²⁵⁶ digests. For an n-bit digest the first ' +
        'one is expected after about √(π/2 · 2ⁿ) inputs: about 20 for 8 bits, 321 for 16, 82 000 for 32. ' +
        'For 256 bits that is about 2¹²⁸ tries: collisions exist, but nobody knows how to find one.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
