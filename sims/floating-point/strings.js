/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of floating-point, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The glossary has no floating-point terms yet (NOTES.md "Term pairs"), so the Croatian term rule is written out in
   the explanation: the English term in italics with the Croatian in parentheses at first mention.
   Numbers keep a decimal point in both languages: they are what a program reads and prints (SPEC.md "Captions").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Bitovi broja s pomičnim zarezom i zbroj a + b',

      // params
      format: 'Format',
      fmt_binary32: 'binary32',
      fmt_binary64: 'binary64',
      value: 'Vrijednost na traci',
      value_p01: '0.1',
      value_p02: '0.2',
      value_p03: '0.3',
      value_one: '1',
      value_two24: '16777216 = 2^24',
      value_sum: 'zbroj a + b',
      value_inf: '+∞',
      value_max: 'najveći konačni broj',
      'value_min-normal': 'najmanji normalni broj',
      'value_min-sub': 'najmanji subnormalni broj',
      'value_neg-zero': '−0',
      value_nan: 'NaN',
      value_typed: 'upisani broj',
      value_bits: 'kliknuti bitovi',
      a: 'Pribrojnik a',
      b: 'Pribrojnik b',
      digits: 'Sve znamenke dugih vrijednosti, ili skraćeno',
      digitsTitle: 'Prikaži sve znamenke ili skrati (D)',
      fewer: 'skrati',

      // presets
      'preset_point-one': '0.1 u binary32',
      'hint_point-one': '0x3DCCCCCD: spremljeno je 0.100000001490116…',
      'preset_sum-64': '0.1 + 0.2 u binary64',
      'hint_sum-64': 'Zbroj je jedan ULP iznad 0.3: usporedba s 0.3 nije istinita',
      'preset_sum-32': '0.1 + 0.2 u binary32',
      'hint_sum-32': 'Isti zbroj u binary32 pada na isti broj kao 0.3',
      'preset_one-and-next': '1 i sljedeći broj',
      'hint_one-and-next': 'Klikni zadnji bit mantise: 1 + 2^−23',
      preset_specials: 'Posebne vrijednosti',
      hint_specials: '∞, najveći, najmanji normalni i subnormalni broj u izborniku',
      'preset_big-plus-one': '16777216 + 1',
      'hint_big-plus-one': 'Kod 2^24 ULP je 2: jedinica se izgubi',

      // legend
      legendS: 's: predznak',
      legendE: 'e: eksponent',
      legendF: 'f: mantisa',
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendChanged: 'promijenjen bit',

      // stage: value head and the typed field
      valueHead: 'Vrijednost',
      typedLabel: 'Upiši broj:',
      typedPlaceholder: 'npr. 0.1 ili 1e16',
      typedError: 'to nije broj',
      kind_normal: 'normalni broj',
      kind_subnormal: 'subnormalni broj',
      kind_zero: 'nula',
      kind_inf: 'beskonačno',
      kind_nan: 'NaN: nije broj',

      // the strip
      groupS: 's',
      groupE: 'e · eksponent',
      groupF: 'f · mantisa',
      groupFcont: 'f · nastavak mantise',
      bitLabel: 'bit {i}, {g}: {v}. Klikni za promjenu.',
      gS: 'predznak',
      gE: 'eksponent',
      gF: 'mantisa',

      // the decoding
      lineValue: 'zapis',
      lineSign: 'predznak',
      lineExp: 'eksponent',
      lineFrac: 'mantisa',
      lineExact: 'točna vrijednost',
      lineUlp: 'razmak',
      plus: 'plus',
      minus: 'minus',
      stored: 'spremljeni',
      unbiased: 'stvarni',
      noHidden: 'subnormalni: bez skrivene jedinice, eksponent ostaje',
      allOnes: 'sve jedinice',
      allZeros: 'sve nule',
      infWords: 'svi bitovi e su jedinice, f = 0',
      nanWords: 'svi bitovi e su jedinice, f ≠ 0',
      zeroWords: 'e = 0 i f = 0',
      noValue: 'nema brojčane vrijednosti',
      ofWhich: 'od',
      exactSame: 'točno upisani broj',
      exactDiff: 'nije {dec}: razlika',
      ulpOf: 'ULP do sljedećeg broja dalje od nule',
      ulpMax: 'ULP, razmak najvećih brojeva; sljedeći uzorak je već ∞:',
      printed: 'program ispisuje',
      elided: ['još {n} znamenka', 'još {n} znamenke', 'još {n} znamenki'],

      // the sum panel
      sumHead: 'Zbroj a + b u formatu',
      rowA: 'a',
      rowB: 'b',
      rowExact: 'točan zbroj',
      rowRounded: 'zaokruženo',
      rowExpected: 'očekivano',
      storedAs: 'spremljeno',
      tieBadge: 'točno na pola: ide parnom susjedu',
      roundedOnce: 'zaokruženo jednom',
      exactOp: 'točno, bez zaokruživanja',
      verdict: 'usporedba',
      verdictEq: 'isti broj',
      verdictNe: ['{n} ULP razlike', '{n} ULP-a razlike', '{n} ULP-ova razlike'],
      lostB: 'b se izgubi',
      lostA: 'a se izgubi',

      // captions: the strip
      capInexact: '{dec} nije točno prikaziv u binarnom zapisu: spremljena vrijednost je {exact}',
      capInexactBits: '{dec} treba više značajnih bitova nego što ih {f} ima: spremljena vrijednost je {exact}',
      capExactDec: '{dec} je točno prikaziv: {exact}. Sljedeći broj dalje od nule udaljen je jedan ULP = {ulp}.',
      capSumValue: 'Traka prikazuje zaokruženi zbroj a + b, {hex}.',
      capNormal: 'Normalni broj {hex}: {exact}; do sljedećeg broja dalje od nule razmak je ULP = {ulp}.',
      capMax: 'Najveći konačni broj {exact}: sljedeći uzorak bitova je već +∞.',
      capMinNormal: 'Najmanji normalni broj {exact}: ispod njega su subnormalni brojevi.',
      capSub: 'Eksponent 0 i f ≠ 0: subnormalni broj bez skrivene jedinice, {exact}.',
      capZero: '{v}: svi bitovi e i f su nule. +0 i −0 su dva uzorka bitova, ali su jednaki.',
      capInf: '{v}: svi bitovi e su jedinice, a f = 0.',
      capNan: 'Svi bitovi e su jedinice, a f ≠ 0: NaN, nije broj. NaN nije jednak ni samom sebi.',
      capOverflow: '{dec} je prevelik za {f}: zaokružuje se na {v}.',
      capUnderflow: '{dec} je premalen za {f}: zaokružuje se na {v}.',
      capTypedEmpty: 'Upiši broj u polje iznad trake ili klikni bit.',
      capTypedError: '„{text}” nije broj koji mogu pročitati; traka prikazuje +0.',

      // captions: the sum
      capSumNe1: 'Zbroj {a} + {b} zaokružuje se na broj koji je za jedan ULP {dir} od {e}.',
      capSumNe: ['Zbroj {a} + {b} zaokružuje se na broj koji je za {n} ULP {dir} od {e}.',
        'Zbroj {a} + {b} zaokružuje se na broj koji je za {n} ULP-a {dir} od {e}.',
        'Zbroj {a} + {b} zaokružuje se na broj koji je za {n} ULP-ova {dir} od {e}.'],
      above: 'veći',
      below: 'manji',
      capAbsorbTie: '{a} + {b}: točan zbroj {x} je točno na pola između dva susjedna broja (ULP = {ulp}), pa ide parnom, {r}: {lost} se izgubi.',
      capAbsorb: '{a} + {b}: {lost} je manji od pola ULP-a ({ulp}), pa zbroj ostaje {r}: {lost} se izgubi.',
      capSumEqExact: 'Zbroj {a} + {b} = {r} je točan: nema zaokruživanja.',
      capSumEq: 'Zbroj {a} + {b} zaokružuje se na isti broj kao {e}: jednaki su. „≠” nije zakon, ovisi o formatu i vrijednostima.',
      capSumEqOpExact: 'Zbrajanje {a} + {b} ovdje je točno i daje isti broj kao {e}: jednaki su. „≠” nije zakon, ovisi o formatu i vrijednostima.',

      explain: '<p>Broj s <i lang="en">floating point</i> (pomičnim zarezom) zapisan je u tri polja: <b>s</b> je ' +
        'predznak, <b>e</b> spremljeni eksponent, <b>f</b> mantisa (razlomak: bitovi iza vodeće jedinice). Normalni broj vrijedi ' +
        '(−1)<sup>s</sup> × 1.f × 2<sup>e − <i lang="en">bias</i></sup>; <i lang="en">bias</i> (pomak) je 127 u binary32 ' +
        'i 1023 u binary64. Vodeća jedinica se ne sprema.</p>' +
        '<p>e = 0 znači nulu (dvije: +0 i −0, jednake) ili <i lang="en">subnormal</i> (subnormalni, ' +
        'denormalizirani broj) bez skrivene jedinice. e od samih jedinica znači ±∞ (f = 0) ili NaN (f ≠ 0); ' +
        'NaN nije jednak ni samom sebi.</p>' +
        '<p>Upisani broj se <i lang="en">rounding</i> (zaokruživanjem) svodi na najbliži prikazivi, a kod izjednačenja na ' +
        'onaj kojem je zadnji bit 0. Svaka operacija zaokružuje svoj točan rezultat jednom. Razmak do sljedećeg broja je ' +
        '<i lang="en">ULP</i> (jedinica na zadnjem mjestu); raste s veličinom broja.</p>' +
        '<p>Tri zablude: <b>„float je nasumični šum”</b>: ne, svaka vrijednost je točan binarni razlomak, a greška nastaje ' +
        'pri pretvorbi i zaokruživanju. <b>„0.1 + 0.2 ≠ 0.3 uvijek”</b>: u binary32 su jednaki (primjer 3). ' +
        '<b>„veliki brojevi su jednako precizni”</b>: kod 2<sup>24</sup> je ULP u binary32 već 2 (primjer 6).</p>'
    },
    en: {
      stage: 'The bits of a floating-point number, and the sum a + b',

      // params
      format: 'Format',
      fmt_binary32: 'binary32',
      fmt_binary64: 'binary64',
      value: 'Value on the strip',
      value_p01: '0.1',
      value_p02: '0.2',
      value_p03: '0.3',
      value_one: '1',
      value_two24: '16777216 = 2^24',
      value_sum: 'the sum a + b',
      value_inf: '+∞',
      value_max: 'largest finite number',
      'value_min-normal': 'smallest normal number',
      'value_min-sub': 'smallest subnormal number',
      'value_neg-zero': '−0',
      value_nan: 'NaN',
      value_typed: 'typed number',
      value_bits: 'clicked bits',
      a: 'Operand a',
      b: 'Operand b',
      digits: 'Every digit of long values, or shortened',
      digitsTitle: 'Show every digit, or shorten (D)',
      fewer: 'shorten',

      // presets
      'preset_point-one': '0.1 in binary32',
      'hint_point-one': '0x3DCCCCCD: what is stored is 0.100000001490116…',
      'preset_sum-64': '0.1 + 0.2 in binary64',
      'hint_sum-64': 'The sum is one ULP above 0.3: the comparison is false',
      'preset_sum-32': '0.1 + 0.2 in binary32',
      'hint_sum-32': 'The same sum in binary32 lands on the same number as 0.3',
      'preset_one-and-next': '1 and the next number',
      'hint_one-and-next': 'Click the last fraction bit: 1 + 2^−23',
      preset_specials: 'Special values',
      hint_specials: '∞, the largest, the smallest normal and subnormal number in the menu',
      'preset_big-plus-one': '16777216 + 1',
      'hint_big-plus-one': 'At 2^24 the ULP is 2: the 1 is lost',

      // legend
      legendS: 's: sign',
      legendE: 'e: exponent',
      legendF: 'f: fraction',
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendChanged: 'changed bit',

      // stage: value head and the typed field
      valueHead: 'Value',
      typedLabel: 'Type a number:',
      typedPlaceholder: 'e.g. 0.1 or 1e16',
      typedError: 'not a number',
      kind_normal: 'normal number',
      kind_subnormal: 'subnormal number',
      kind_zero: 'zero',
      kind_inf: 'infinity',
      kind_nan: 'NaN: not a number',

      // the strip
      groupS: 's',
      groupE: 'e · exponent',
      groupF: 'f · fraction',
      groupFcont: 'f · fraction, continued',
      bitLabel: 'bit {i}, {g}: {v}. Click to flip.',
      gS: 'sign',
      gE: 'exponent',
      gF: 'fraction',

      // the decoding
      lineValue: 'formula',
      lineSign: 'sign',
      lineExp: 'exponent',
      lineFrac: 'fraction',
      lineExact: 'exact value',
      lineUlp: 'spacing',
      plus: 'plus',
      minus: 'minus',
      stored: 'stored',
      unbiased: 'actual',
      noHidden: 'subnormal: no hidden 1, the exponent stays at',
      allOnes: 'all ones',
      allZeros: 'all zeros',
      infWords: 'e is all ones, f = 0',
      nanWords: 'e is all ones, f ≠ 0',
      zeroWords: 'e = 0 and f = 0',
      noValue: 'no numeric value',
      ofWhich: 'of',
      exactSame: 'exactly the typed number',
      exactDiff: 'not {dec}: off by',
      ulpOf: 'ULP to the next number away from zero',
      ulpMax: 'ULP, the spacing of the largest numbers; the next pattern is already ∞:',
      printed: 'a program prints',
      elided: ['{n} more digit', '{n} more digits'],

      // the sum panel
      sumHead: 'The sum a + b in',
      rowA: 'a',
      rowB: 'b',
      rowExact: 'exact sum',
      rowRounded: 'rounded',
      rowExpected: 'expected',
      storedAs: 'stored',
      tieBadge: 'exactly halfway: goes to the even neighbour',
      roundedOnce: 'rounded once',
      exactOp: 'exact, no rounding',
      verdict: 'comparison',
      verdictEq: 'the same number',
      verdictNe: ['{n} ULP apart', '{n} ULPs apart'],
      lostB: 'b is lost',
      lostA: 'a is lost',

      // captions: the strip
      capInexact: '{dec} cannot be stored exactly in binary: the stored value is {exact}',
      capInexactBits: '{dec} needs more significant bits than {f} has: the stored value is {exact}',
      capExactDec: '{dec} is stored exactly: {exact}. The next number away from zero is one ULP = {ulp} further.',
      capSumValue: 'The strip shows the rounded sum a + b, {hex}.',
      capNormal: 'Normal number {hex}: {exact}; the gap to the next one away from zero is one ULP = {ulp}.',
      capMax: 'The largest finite number, {exact}: the next bit pattern is already +∞.',
      capMinNormal: 'The smallest normal number, {exact}: below it are the subnormal numbers.',
      capSub: 'Exponent 0 and f ≠ 0: a subnormal number without the hidden 1, {exact}.',
      capZero: '{v}: e and f are all zeros. +0 and −0 are two bit patterns, but they are equal.',
      capInf: '{v}: e is all ones and f = 0.',
      capNan: 'e is all ones and f ≠ 0: NaN, not a number. NaN is not even equal to itself.',
      capOverflow: '{dec} is too large for {f}: it rounds to {v}.',
      capUnderflow: '{dec} is too small for {f}: it rounds to {v}.',
      capTypedEmpty: 'Type a number in the field above the strip, or click a bit.',
      capTypedError: '"{text}" is not a number I can read; the strip shows +0.',

      // captions: the sum
      capSumNe1: 'The sum {a} + {b} rounds to the number one ULP {dir} {e}.',
      capSumNe: ['The sum {a} + {b} rounds to the number {n} ULP {dir} {e}.',
        'The sum {a} + {b} rounds to the number {n} ULPs {dir} {e}.'],
      above: 'above',
      below: 'below',
      capAbsorbTie: '{a} + {b}: the exact sum {x} lies exactly halfway between two neighbours (ULP = {ulp}), so it goes to the even one, {r}: {lost} is lost.',
      capAbsorb: '{a} + {b}: {lost} is less than half a ULP ({ulp}), so the sum stays {r}: {lost} is lost.',
      capSumEqExact: 'The sum {a} + {b} = {r} is exact: no rounding.',
      capSumEq: 'The sum {a} + {b} rounds to the same number as {e}: they are equal. "≠" is not a law; it depends on the format and the values.',
      capSumEqOpExact: 'The addition {a} + {b} is exact here and gives the same number as {e}: they are equal. "≠" is not a law; it depends on the format and the values.',

      explain: '<p>A <i>floating-point</i> number is stored in three fields: <b>s</b> is the sign, <b>e</b> the stored ' +
        'exponent, <b>f</b> the fraction (the mantissa bits after the leading 1). A normal number is worth ' +
        '(−1)<sup>s</sup> × 1.f × 2<sup>e − bias</sup>; the <i>bias</i> is 127 in binary32 and 1023 in binary64. The ' +
        'leading 1 is not stored.</p>' +
        '<p>e = 0 means zero (two of them, +0 and −0, equal) or a <i>subnormal</i> number without the hidden 1. ' +
        'e of all ones means ±∞ (f = 0) or NaN (f ≠ 0); NaN is not even equal to itself.</p>' +
        '<p>A typed number is <i>rounded</i> to the nearest representable one, and a tie goes to the one whose last ' +
        'bit is 0. Every operation rounds its exact result once. The gap to the next number is one <i>ULP</i> (unit ' +
        'in the last place); it grows with the size of the number.</p>' +
        '<p>Three misconceptions: <b>"floats are random noise"</b>: no, every value is an exact binary fraction; the ' +
        'error comes from the conversion and the rounding. <b>"0.1 + 0.2 ≠ 0.3 always"</b>: in binary32 they are ' +
        'equal (preset 3). <b>"big numbers are as precise as small ones"</b>: at 2<sup>24</sup> the binary32 ULP is ' +
        'already 2 (preset 6).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
