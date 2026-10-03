/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the I/Q phasor page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_iq_zeiger.html and sections/iq_verfahren.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; Croatian by the 50ohm-contents-hr team; changed), English written for simdeck from them and
   from the German original. Terms missing from kit/glossary.js (phasor, in-phase and quadrature component, I/Q plane,
   constellation diagram, phase position) are written out here: NOTES.md "Term pairs". Values in captions are nodes
   (bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kazaljka u I/Q ravnini, desno njezina okomita projekcija (sinus), dolje vodoravna (kosinus)',
      // controls
      a: 'Amplituda A',
      aHint: 'Duljina kazaljke, u postocima pune amplitude.',
      phi: 'Faza φ',
      phiHint: 'Kut kazaljke prema I osi pri t = 0 (početni fazni položaj simbola).',
      // units
      pct: '{v} %',
      deg: '{v}°',
      // presets
      presetStart: 'A = 80 %, φ = 30°',
      presetStartHint: 'I i Q oba različita od nule',
      presetIonly: 'φ = 0°',
      presetIonlyHint: 'Kazaljka na I osi: Q = 0',
      presetQonly: 'φ = 90°',
      presetQonlyHint: 'Kazaljka na Q osi: I = 0',
      presetReverse: 'φ = 180°',
      presetReverseHint: 'I negativan, Q = 0',
      presetMinus45: 'φ = −45°',
      presetMinus45Hint: 'I i Q jednako veliki, Q negativan',
      presetNone: 'A = 0',
      presetNoneHint: 'Nema signala, faza nema značenja',
      // legend
      legendPhasor: 'kazaljka',
      legendI: 'I: vodoravna projekcija',
      legendQ: 'Q: okomita projekcija',
      legendStart: 'položaj pri t = 0',
      // stage
      waveQ: 'Q: sinus',
      waveI: 'I: kosinus',
      timeRight: 'ωt →',
      timeDown: 'ωt ↓',
      readNow: 'Sada',
      readStart: 'Pri t = 0',
      readWt: 'ωt = {v}',
      readI: 'I = {v}',
      readQ: 'Q = {v}',
      readA: 'A = {v}',
      readPhi: 'φ = {v}',
      // captions
      captionStart: 'Pri t = 0: početno stanje simbola. Kazaljka duljine A = {a} stoji pod kutom φ = {phi}. Vodoravna projekcija je I = A · cos φ = {i}, okomita Q = A · sin φ = {q}.',
      captionTurn: 'ωt = {wt}: kazaljka se okrenula za {turn} i stoji pod kutom {angle}. Vodoravna projekcija (kosinus) je sada {i}, okomita (sinus) {q}.',
      captionFull: 'ωt = {wt}: jedan puni okret. Kazaljka je opet na početku, a obje su projekcije prešle po jednu punu periodu, međusobno pomaknute za 90°.',
      captionNone: 'A = {zero}: nema kazaljke, pa obje projekcije ostaju nula. Bez amplitude ni faza nema značenja.',
      axisIpos: ' Kazaljka leži na pozitivnoj I osi: Q je nula, a kosinus je na vrhu.',
      axisIneg: ' Kazaljka leži na negativnoj I osi: Q je nula, a kosinus je na dnu.',
      axisQpos: ' Kazaljka leži na pozitivnoj Q osi: I je nula, a sinus je na vrhu.',
      axisQneg: ' Kazaljka leži na negativnoj Q osi: I je nula, a sinus je na dnu.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Stanje signala u trenutku t = 0 određeno je amplitudom A i faznim položajem φ. U prikazu kazaljkom amplituda je duljina kazaljke, a fazni položaj njezin kut prema vodoravnoj osi.</p>' +
        '<p>Kazaljka se rastavlja na vodoravni i okomiti udio. Vodoravni je <i>I</i>, za <i>in-phase component</i> (komponenta u fazi), a okomiti <i>Q</i>, za <i>quadrature component</i> (kvadraturna komponenta):<br>I = A · cos φ,&nbsp;&nbsp; Q = A · sin φ.</p>' +
        '<p>Pustimo li vrijeme dalje teći, kazaljka se okreće s nositeljem. Njezine projekcije na obje osi teku sinusno i međusobno su fazno pomaknute za 90°: vodoravna je kosinus, okomita sinus.</p>' +
        '<p>Za simbol nas ne zanima trajno okretanje, nego početno stanje. Ucrtaju li se moguća početna stanja kao točke u <b>I/Q ravnini</b>, nastaje <b>konstelacijski dijagram</b>: udaljenost točke od ishodišta je amplituda, a kut prema I osi fazni položaj.</p>'
    },
    en: {
      stage: 'The phasor in the I/Q plane, its vertical projection (sine) to the right and its horizontal one (cosine) below',
      a: 'Amplitude A',
      aHint: 'Length of the phasor, in percent of full amplitude.',
      phi: 'Phase φ',
      phiHint: 'Angle of the phasor to the I axis at t = 0 (the symbol\'s starting phase).',
      pct: '{v} %',
      deg: '{v}°',
      presetStart: 'A = 80 %, φ = 30°',
      presetStartHint: 'Neither I nor Q is zero',
      presetIonly: 'φ = 0°',
      presetIonlyHint: 'Phasor on the I axis: Q = 0',
      presetQonly: 'φ = 90°',
      presetQonlyHint: 'Phasor on the Q axis: I = 0',
      presetReverse: 'φ = 180°',
      presetReverseHint: 'I negative, Q = 0',
      presetMinus45: 'φ = −45°',
      presetMinus45Hint: 'I and Q the same size, Q negative',
      presetNone: 'A = 0',
      presetNoneHint: 'No signal, the phase means nothing',
      legendPhasor: 'phasor',
      legendI: 'I: horizontal projection',
      legendQ: 'Q: vertical projection',
      legendStart: 'position at t = 0',
      waveQ: 'Q: sine',
      waveI: 'I: cosine',
      timeRight: 'ωt →',
      timeDown: 'ωt ↓',
      readNow: 'Now',
      readStart: 'At t = 0',
      readWt: 'ωt = {v}',
      readI: 'I = {v}',
      readQ: 'Q = {v}',
      readA: 'A = {v}',
      readPhi: 'φ = {v}',
      captionStart: 'At t = 0: the symbol\'s starting state. The phasor of length A = {a} stands at the angle φ = {phi}. Its horizontal projection is I = A · cos φ = {i}, its vertical one Q = A · sin φ = {q}.',
      captionTurn: 'ωt = {wt}: the phasor has turned by {turn} and stands at {angle}. The horizontal projection (cosine) is now {i}, the vertical one (sine) {q}.',
      captionFull: 'ωt = {wt}: one full turn. The phasor is back at its start, and each projection has run through one full period, the two 90° apart.',
      captionNone: 'A = {zero}: there is no phasor, so both projections stay at zero. Without an amplitude the phase means nothing either.',
      axisIpos: ' The phasor lies on the positive I axis: Q is zero and the cosine is at its peak.',
      axisIneg: ' The phasor lies on the negative I axis: Q is zero and the cosine is at its trough.',
      axisQpos: ' The phasor lies on the positive Q axis: I is zero and the sine is at its peak.',
      axisQneg: ' The phasor lies on the negative Q axis: I is zero and the sine is at its trough.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>The state of a signal at the moment t = 0 is set by its amplitude A and its phase φ. In the phasor picture the amplitude is the length of the phasor and the phase its angle to the horizontal axis.</p>' +
        '<p>The phasor splits into a horizontal and a vertical part. The horizontal part is <i>I</i>, the in-phase component, the vertical part <i>Q</i>, the quadrature component:<br>I = A · cos φ,&nbsp;&nbsp; Q = A · sin φ.</p>' +
        '<p>Let time run on and the phasor turns with the carrier. Its projections onto the two axes run as sine waves, 90° apart: the horizontal one is a cosine, the vertical one a sine.</p>' +
        '<p>For a symbol it is not the turning that matters but the starting state. Plot the possible starting states as points in the <b>I/Q plane</b> and you get a <b>constellation diagram</b>: a point\'s distance from the origin is the amplitude, its angle to the I axis the phase.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
