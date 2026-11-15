/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of twos-complement, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms missing from kit/glossary.js (sign bit, signed, unsigned, flag, wrap-around) are written out here, the
   English in italics with the Croatian in parentheses (NOTES.md, "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zbrajalo s n bitova: bitovi, prijenosi, kotač brojeva i zastavice',

      // controls
      width: 'Širina',
      bitsN: ['{n} bit', '{n} bita', '{n} bitova'],
      a: 'Pribrojnik a',
      b: 'Pribrojnik b',
      view: 'Čitanje',
      view_signed: 'S predznakom',
      view_unsigned: 'Bez predznaka',
      view_both: 'Oba',

      // presets
      preset_overflow: 'Preljev: 100 + 50',
      hint_overflow: 'Dva pozitivna daju negativan: V = 1, C = 0',
      'preset_max-plus-one': 'Najveći + 1',
      'hint_max-plus-one': '127 + 1 = −128: omatanje na vrhu raspona',
      'preset_carry-not-overflow': 'Prijenos bez preljeva',
      'hint_carry-not-overflow': '−1 + 1 = 0: C = 1, V = 0, Z = 1',
      preset_both: 'C i V zajedno',
      hint_both: '−100 + (−50) daje 106: dva negativna, zbroj pozitivan',
      preset_subtract: 'Oduzimanje',
      hint_subtract: '5 − 3 = 5 + (−3): prijenos C = 1 ovdje nije greška',
      'preset_16-bit': '16 bitova',
      'hint_16-bit': '30000 + 10000 = −25536: isti preljev, samo kasnije',

      // legend
      legendOne: 'bit ili zastavica 1: ispunjen',
      legendZero: 'bit ili zastavica 0: prazan',
      legendSign: 'bit predznaka: debeli rub, negativna težina',
      legendCarry: 'prijenos u stupac',
      legendChanged: 'promijenjeno',

      // the rows
      weight: 'težina',
      carryRow: 'prijenos',
      rowA: 'a',
      rowB: 'b',
      rowR: 'r',
      plus: '+',
      negate: 'Promijeni predznak broja {name}: ~{name} + 1',
      bitLabel: '{row}, bit {i} = {v}, težina {w}',
      carryLabel: 'prijenos u bit {i}',
      carryOutLabel: 'prijenos iz gornjeg bita {v}: ide u zastavicu C, ne u rezultat',
      readUnsigned: 'bez predznaka',
      readSigned: 's predznakom',
      readHex: 'hex',
      exactSum: 'a + b točno',
      fits: 'stane',
      noFit: 'ne stane',

      // the wheel
      wheel: 'Kotač: {m} uzoraka u krugu, 0 gore',
      wheelOuter: 'izvana bez predznaka',
      wheelInner: 'iznutra s predznakom',
      seamC: 'C: prijelaz preko vrha, s najvećeg bez predznaka na 0',
      seamV: 'V: prijelaz preko dna, s najvećeg s predznakom na najmanji',
      markA: 'a',
      markR: 'r',

      // the flags
      flags: 'Zastavice',
      flagN: 'N',
      flagZ: 'Z',
      flagC: 'C',
      flagV: 'V',
      nameN: 'negativan',
      nameZ: 'nula',
      nameC: 'prijenos',
      nameV: 'preljev',
      ruleN: 'gornji bit rezultata',
      ruleZ: 'svi bitovi rezultata su 0',
      ruleC: 'prijenos iz gornjeg bita: rezultat bez predznaka se omotao',
      ruleV: 'pribrojnici istog predznaka, rezultat drugoga: rezultat s predznakom se omotao',
      flagOn: 'postavljena',
      flagOff: 'obrisana',

      // captions
      bitsSigned: ['{n} bit s predznakom', '{n} bita s predznakom', '{n} bitova s predznakom'],
      capVPos: '{a} + {b} = {sum} ne stane u {bits}: rezultat {rbits} čita se kao {r}. Oba pribrojnika su pozitivna, ' +
        'zbroj je negativan → zastavica V (preljev).',
      capVNeg: '{a} + {b} = {sum} ne stane u {bits}: rezultat {rbits} čita se kao {r}. Oba pribrojnika su negativna, ' +
        'a zbroj nije → zastavica V (preljev).',
      capAlsoC: 'Prijenos iz gornjeg bita postavlja i C: bez predznaka {ua} + {ub} = {usum} također se omotao na {ur}.',
      capC: 'Bez predznaka {ua} + {ub} = {usum} ne stane u {ubits} pa se omota na {ur}: zastavica C (prijenos). ' +
        'S predznakom {a} + {b} = {r} je točno: V = 0, ovaj prijenos nije greška.',
      capSub: 'Tako se oduzima: {a} − {nb} je {a} + ({b}), a {b} je ~{nb} + 1.',
      capNone: '{a} + {b} = {r} stane u {bits}, a bez predznaka {ua} + {ub} = {ur} stane u {ubits}: ni C ni V.',
      capZero: 'Rezultat je 0: Z = 1.',
      capNeg: 'Promjena predznaka: −{x} = ~{xbits} + 1 = {inv} + 1 = {rbits}, to jest {v}.',
      capNegMin: 'Promjena predznaka: −{x} = ~{xbits} + 1 = {inv} + 1 = {rbits}, opet {v}: +{abs} ne stane u {bits}, ' +
        'pa dodavanje jedinice izaziva preljev (postavilo bi V).',

      explain: '<p>U zapisu [[two\'s complement]] n bitova ima uobičajene težine, osim gornjega: on teži −2<sup>n−1</sup> ' +
        '(−128 u 8 bitova). Zato je gornji bit, <em>sign bit</em> (bit predznaka), 1 točno kod negativnih brojeva, ali ' +
        'nije samo znak minus: 1000 0000 je −128, a ne „−0”. Raspon je −2<sup>n−1</sup> … 2<sup>n−1</sup> − 1.</p>' +
        '<p>Zbrajalo je isto za brojeve <em>signed</em> (s predznakom) i <em>unsigned</em> (bez predznaka): računa ' +
        '(a + b) mod 2<sup>n</sup>, stupac po stupac, a [[carry]] ide ulijevo. Procesor ne zna je li broj s predznakom; ' +
        'iste bitove rezultata samo čitamo na dva načina, a <em>flags</em> (zastavice) kažu koje se čitanje ' +
        'omotalo (<em>wrapped around</em>).</p>' +
        '<p>N je gornji bit rezultata, Z kaže da je rezultat 0. C je prijenos iz gornjeg bita: rezultat bez predznaka ' +
        'se omotao. V je [[overflow]]: oba pribrojnika imaju isti predznak, a rezultat drugi; isto je reći da se ' +
        'prijenos u gornji bit razlikuje od prijenosa iz njega. C i V su neovisni: −1 + 1 daje C bez V, 100 + 50 daje ' +
        'V bez C.</p>' +
        '<p>Kotač ima 2<sup>n</sup> uzoraka u krugu, 0 gore. Izvana su vrijednosti bez predznaka, iznutra s ' +
        'predznakom. Strelica izvana koja prijeđe vrh (s 255 na 0) postavlja C; strelica iznutra koja prijeđe dno ' +
        '(sa 127 na −128) postavlja V.</p>' +
        '<p>Promjena predznaka: −x = (~x) + 1, okreni sve bitove i dodaj 1 (gumb ± uz a i b). −(−128) je opet ' +
        '−128, jer +128 ne stane u 8 bitova. Oduzimanje a − b je zbrajanje a + (~b + 1). Klikom na bit pribrojnika ' +
        'mijenjaš taj bit.</p>' +
        '<p>Starije sheme, <em>one\'s complement</em> (nepotpuni komplement) i <em>sign-magnitude</em> (predznak i ' +
        'iznos), imaju dvije nule; ovdje ih nema.</p>'
    },
    en: {
      stage: 'An n-bit adder: bits, carries, the number wheel and the flags',

      width: 'Width',
      bitsN: ['{n} bit', '{n} bits'],
      a: 'Operand a',
      b: 'Operand b',
      view: 'Reading',
      view_signed: 'Signed',
      view_unsigned: 'Unsigned',
      view_both: 'Both',

      preset_overflow: 'Overflow: 100 + 50',
      hint_overflow: 'Two positives give a negative: V = 1, C = 0',
      'preset_max-plus-one': 'Largest + 1',
      'hint_max-plus-one': '127 + 1 = −128: the wrap at the top of the range',
      'preset_carry-not-overflow': 'Carry, no overflow',
      'hint_carry-not-overflow': '−1 + 1 = 0: C = 1, V = 0, Z = 1',
      preset_both: 'C and V together',
      hint_both: '−100 + (−50) gives 106: two negatives, a positive sum',
      preset_subtract: 'Subtraction',
      hint_subtract: '5 − 3 = 5 + (−3): the carry C = 1 is not an error here',
      'preset_16-bit': '16 bits',
      'hint_16-bit': '30000 + 10000 = −25536: the same wrap, only later',

      legendOne: 'bit or flag 1: filled',
      legendZero: 'bit or flag 0: hollow',
      legendSign: 'sign bit: thick border, negative weight',
      legendCarry: 'carry into a column',
      legendChanged: 'changed',

      weight: 'weight',
      carryRow: 'carry',
      rowA: 'a',
      rowB: 'b',
      rowR: 'r',
      plus: '+',
      negate: 'Negate {name}: ~{name} + 1',
      bitLabel: '{row}, bit {i} = {v}, weight {w}',
      carryLabel: 'carry into bit {i}',
      carryOutLabel: 'carry out of the top bit {v}: goes to the C flag, not into the result',
      readUnsigned: 'unsigned',
      readSigned: 'signed',
      readHex: 'hex',
      exactSum: 'a + b exactly',
      fits: 'fits',
      noFit: 'does not fit',

      wheel: 'Wheel: {m} patterns in a circle, 0 at the top',
      wheelOuter: 'outside unsigned',
      wheelInner: 'inside signed',
      seamC: 'C: crossing the top, from the largest unsigned to 0',
      seamV: 'V: crossing the bottom, from the largest signed to the smallest',
      markA: 'a',
      markR: 'r',

      flags: 'Flags',
      flagN: 'N',
      flagZ: 'Z',
      flagC: 'C',
      flagV: 'V',
      nameN: 'negative',
      nameZ: 'zero',
      nameC: 'carry',
      nameV: 'overflow',
      ruleN: 'the top bit of the result',
      ruleZ: 'every bit of the result is 0',
      ruleC: 'carry out of the top bit: the unsigned result wrapped',
      ruleV: 'operands of one sign, result of the other: the signed result wrapped',
      flagOn: 'set',
      flagOff: 'clear',

      bitsSigned: ['{n} signed bit', '{n} signed bits'],
      capVPos: '{a} + {b} = {sum} does not fit in {bits}: {rbits} reads as {r}. Both operands positive, result ' +
        'negative → the V (overflow) flag.',
      capVNeg: '{a} + {b} = {sum} does not fit in {bits}: {rbits} reads as {r}. Both operands negative, result not ' +
        '→ the V (overflow) flag.',
      capAlsoC: 'The carry out of the top bit sets C too: unsigned, {ua} + {ub} = {usum} wrapped to {ur} as well.',
      capC: 'Unsigned, {ua} + {ub} = {usum} does not fit in {ubits} and wraps to {ur}: the C (carry) flag. ' +
        'Signed, {a} + {b} = {r} is right: V = 0, this carry is not an error.',
      capSub: 'This is how subtraction works: {a} − {nb} is {a} + ({b}), and {b} is ~{nb} + 1.',
      capNone: '{a} + {b} = {r} fits in {bits}, and unsigned {ua} + {ub} = {ur} fits in {ubits}: neither C nor V.',
      capZero: 'The result is 0: Z = 1.',
      capNeg: 'Negation: −{x} = ~{xbits} + 1 = {inv} + 1 = {rbits}, that is {v}.',
      capNegMin: 'Negation: −{x} = ~{xbits} + 1 = {inv} + 1 = {rbits}, {v} again: +{abs} does not fit in {bits}, ' +
        'so adding the 1 overflows (it would set V).',

      explain: '<p>In [[two\'s complement]] n bits have the usual weights, except the top one: it weighs ' +
        '−2<sup>n−1</sup> (−128 in 8 bits). So the top bit, the sign bit, is 1 exactly for negative numbers, but it ' +
        'is not just a minus sign: 1000 0000 is −128, not “−0”. The range is −2<sup>n−1</sup> … 2<sup>n−1</sup> − 1.</p>' +
        '<p>The adder is the same for signed and unsigned numbers: it computes (a + b) mod 2<sup>n</sup>, column by ' +
        'column, with each [[carry]] going left. The processor does not know whether a number is signed; the same ' +
        'result bits are only read two ways, and the flags say which reading wrapped around.</p>' +
        '<p>N is the top bit of the result, Z says the result is 0. C is the carry out of the top bit: the unsigned ' +
        'result wrapped. V is [[overflow]]: both operands have the same sign and the result the other; that is the ' +
        'same as the carry into the top bit differing from the carry out of it. C and V are independent: −1 + 1 gives ' +
        'C without V, 100 + 50 gives V without C.</p>' +
        '<p>The wheel holds 2<sup>n</sup> patterns in a circle, 0 at the top. Unsigned values are outside, signed ' +
        'values inside. The outer arrow crossing the top (255 to 0) sets C; the inner arrow crossing the bottom ' +
        '(127 to −128) sets V.</p>' +
        '<p>Negation: −x = (~x) + 1, flip every bit and add 1 (the ± button next to a and b). −(−128) is −128 again, ' +
        'because +128 does not fit in 8 bits. Subtracting a − b is adding a + (~b + 1). Click a bit of an operand to ' +
        'flip it.</p>' +
        '<p>Older schemes, one\'s complement and sign-magnitude, have two zeros; they are not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
