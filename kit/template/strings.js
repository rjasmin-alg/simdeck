/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle are not here: they come from sim.json (title, concept).
   Copying the template? Replace the strings, keep the shape; sim.test.js checks that both tables match. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Brojač',
      bits: 'Broj bitova',
      start: 'Početna vrijednost',
      inc: 'Pribrajamo',
      signed: 'Dvojni komplement',
      signedHint: 'Isti bitovi, čitani s predznakom.',
      places: 'Težine mjesta',
      random: 'Nasumični početak',
      presetCount: 'Brojanje od nule',
      presetCarry: 'Prijenos kroz sve bitove',
      presetCarryHint: 'Korak 2: 0111 + 1 = 1000',
      presetOverflow: 'Preljev',
      presetSigned: 'Dvojni komplement',
      presetByte: '8 bitova, korak +3',
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendChanged: 'promijenjen u ovom koraku',
      before: 'prije: {bits}  + {added}',
      bitLabel: 'bit {i}: {v}',
      wrapped: 'preljev!',
      captionStart: 'Početak: {now}. Pritisni → za sljedeći korak.',
      captionStep: 'Korak {n}: {sum} = {now}.',
      flipped: ['Promijenio se {n} bit.', 'Promijenila su se {n} bita.', 'Promijenilo se {n} bitova.'],
      overflowWord: 'Preljev',
      overflowRest: ': rezultat ne stane u {bits}, brojač kreće ispočetka.',
      bitsIn: ['{n} bit', '{n} bita', '{n} bitova'],
      ripple: ['Prijenos je prošao kroz {n} jedinicu.', 'Prijenos je prošao kroz {n} jedinice.', 'Prijenos je prošao kroz {n} jedinica.'],
      explain: '<p>Brojač ima fiksni broj bitova. Pribrajanje jedinice mijenja najniži bit, a svaka jedinica koja se pretvori u ' +
        'nulu šalje [[carry]] jedno mjesto ulijevo.</p><p>Kad rezultat ne stane u zadani broj bitova, nastaje [[overflow]] i ' +
        'brojač nastavlja od nule. Isti uzorak bitova čitan kao [[two\'s complement]] tada prelazi s najvećeg pozitivnog na ' +
        'najmanji negativni broj.</p>'
    },
    en: {
      stage: 'Counter',
      bits: 'Number of bits',
      start: 'Start value',
      inc: 'Add',
      signed: 'Two\'s complement',
      signedHint: 'The same bits, read with a sign.',
      places: 'Place values',
      random: 'Random start',
      presetCount: 'Counting from zero',
      presetCarry: 'Carry through every bit',
      presetCarryHint: 'Step 2: 0111 + 1 = 1000',
      presetOverflow: 'Overflow',
      presetSigned: 'Two\'s complement',
      presetByte: '8 bits, step +3',
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendChanged: 'changed in this step',
      before: 'before: {bits}  + {added}',
      bitLabel: 'bit {i}: {v}',
      wrapped: 'overflow!',
      captionStart: 'Start: {now}. Press → for the next step.',
      captionStep: 'Step {n}: {sum} = {now}.',
      flipped: ['{n} bit changed.', '{n} bits changed.'],
      overflowWord: 'Overflow',
      overflowRest: ': the result does not fit in {bits}, so the counter starts again.',
      bitsIn: ['{n} bit', '{n} bits'],
      ripple: ['The carry rippled through {n} one.', 'The carry rippled through {n} ones.'],
      explain: '<p>The counter has a fixed number of bits. Adding one changes the lowest bit, and every one that turns into a ' +
        'zero sends a [[carry]] one place to the left.</p><p>When the result does not fit in the given number of bits, an ' +
        '[[overflow]] happens and the counter continues from zero. Read as [[two\'s complement]], the same bit pattern then ' +
        'jumps from the largest positive to the smallest negative number.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
