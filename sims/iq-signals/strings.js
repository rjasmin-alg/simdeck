/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the I/Q signals page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_iq.html and sections/iq_verfahren.md, the explanation from the German
   sections/qam.md (I/Q modulator), which the Croatian repo does not have yet (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from them. Terms missing from
   kit/glossary.js (in-phase and quadrature component, I/Q plane, constellation diagram, carrier, phase, I/Q modulator)
   are written out here: NOTES.md "Term pairs". Values in captions are nodes (bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'I i Q signal, njihov zbroj te točka u I/Q ravnini',
      // controls
      i: 'I (komponenta u fazi)',
      iHint: 'Težina nositelja cos(ωt), u postocima pune amplitude.',
      q: 'Q (kvadraturna komponenta)',
      qHint: 'Težina nositelja pomaknutog za 90°, cos(ωt + 90°).',
      // units
      pct: '{v} %',
      deg: '{v}°',
      // presets
      presetStart: 'I = 60 %, Q = 80 %',
      presetStartHint: 'A = 100 %, φ ≈ 53°',
      presetIonly: 'Samo I',
      presetIonlyHint: 'Zbroj je I nositelj, φ = 0°',
      presetQonly: 'Samo Q',
      presetQonlyHint: 'Zbroj prednjači za 90°',
      presetEqual: 'I = Q',
      presetEqualHint: 'φ = 45°, A ≈ 99 %',
      presetReverse: 'Negativni I',
      presetReverseHint: 'φ = 180°: nositelj naopako',
      presetCorner: 'I = Q = 100 %',
      presetCornerHint: 'A ≈ 141 %: više od svakog dijela',
      presetNone: 'I = Q = 0',
      presetNoneHint: 'Nema signala, faza nije određena',
      // legend
      legendI: 'I · cos(ωt)',
      legendQ: 'Q · cos(ωt + 90°)',
      legendSum: 'zbroj A · cos(ωt + φ)',
      legendRef: 'vrh I nositelja',
      legendPeak: 'vrh zbroja',
      // stage
      rowI: 'I dio: I · cos(ωt)',
      rowQ: 'Q dio: Q · cos(ωt + 90°)',
      rowSum: 'Zbrojni I/Q signal',
      time: 'vrijeme →',
      constTitle: 'Konstelacijski dijagram',
      readA: 'A = {v}',
      readPhi: 'φ = {v}',
      undefinedPhi: 'nije određen',
      // captions
      captionNone: 'I = Q = {zero}: oba su nositelja isključena, zbroj je nula. Bez amplitude ni faza nije određena; točka stoji u ishodištu.',
      captionInPhase: 'Samo I = {i}: zbroj je sam I nositelj, A = {a}, φ = {phi}. Vrhovi zbroja padaju na oznake I nositelja.',
      captionReverse: 'Negativni I = {i}: zbroj je I nositelj okrenut naopako, A = {a}, φ = {phi}. Vrhovi zbroja leže između oznaka.',
      captionLead: 'I = {i}, Q = {q}: zbroj je opet kosinus iste frekvencije, s A = √(I² + Q²) = {a} i φ = atan2(Q, I) = {phi}. Njegov vrh dolazi {phiAbs} prije vrha I nositelja (prednjači).',
      captionLag: 'I = {i}, Q = {q}: zbroj je opet kosinus iste frekvencije, s A = √(I² + Q²) = {a} i φ = atan2(Q, I) = {phi}. Njegov vrh dolazi {phiAbs} poslije vrha I nositelja (kasni).',
      captionOver: ' A je veći od 100 %: veći od svakog dijela posebno.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p><b>I/Q modulator</b> radi s dva nositelja iste frekvencije, međusobno fazno pomaknuta za 90°. Prvi se nositelj množi s I signalom (<i>in-phase</i>, komponenta u fazi), a drugi, pomaknut za 90°, s Q signalom (<i>quadrature</i>, kvadraturna komponenta). Zatim se oba zbroje.</p>' +
        '<p>Zbroj je ponovno kosinusni titraj iste frekvencije:<br>I · cos(ωt) + Q · cos(ωt + 90°) = A · cos(ωt + φ),<br>s amplitudom A = √(I² + Q²) i faznim pomakom φ = atan2(Q, I).</p>' +
        '<p>Mijenjanjem I i Q mijenjaju se dakle i amplituda i faza signala. Par (I, Q) je točka u <b>I/Q ravnini</b>: udaljenost od ishodišta je amplituda, kut prema I osi fazni položaj. Ucrtaju li se tako sva dopuštena stanja, nastaje <b>konstelacijski dijagram</b>, s jednom točkom po simbolu.</p>' +
        '<p>Oznake na vremenskoj osi su vrhovi I nositelja. Kada je φ pozitivan, vrh zbroja dolazi ranije (signal prednjači), a kada je negativan, kasnije.</p>'
    },
    en: {
      stage: 'The I and Q signals, their sum, and the point in the I/Q plane',
      i: 'I (in-phase component)',
      iHint: 'Weight of the carrier cos(ωt), in percent of full amplitude.',
      q: 'Q (quadrature component)',
      qHint: 'Weight of the carrier shifted by 90°, cos(ωt + 90°).',
      pct: '{v} %',
      deg: '{v}°',
      presetStart: 'I = 60 %, Q = 80 %',
      presetStartHint: 'A = 100 %, φ ≈ 53°',
      presetIonly: 'Only I',
      presetIonlyHint: 'The sum is the I carrier, φ = 0°',
      presetQonly: 'Only Q',
      presetQonlyHint: 'The sum leads by 90°',
      presetEqual: 'I = Q',
      presetEqualHint: 'φ = 45°, A ≈ 99 %',
      presetReverse: 'Negative I',
      presetReverseHint: 'φ = 180°: the carrier upside down',
      presetCorner: 'I = Q = 100 %',
      presetCornerHint: 'A ≈ 141 %: more than either part',
      presetNone: 'I = Q = 0',
      presetNoneHint: 'No signal, the phase is undefined',
      legendI: 'I · cos(ωt)',
      legendQ: 'Q · cos(ωt + 90°)',
      legendSum: 'sum A · cos(ωt + φ)',
      legendRef: 'I carrier peak',
      legendPeak: 'sum peak',
      rowI: 'I part: I · cos(ωt)',
      rowQ: 'Q part: Q · cos(ωt + 90°)',
      rowSum: 'Summed I/Q signal',
      time: 'time →',
      constTitle: 'Constellation diagram',
      readA: 'A = {v}',
      readPhi: 'φ = {v}',
      undefinedPhi: 'undefined',
      captionNone: 'I = Q = {zero}: both carriers are off and the sum is zero. With no amplitude the phase is undefined too; the point sits at the origin.',
      captionInPhase: 'Only I = {i}: the sum is the I carrier itself, A = {a}, φ = {phi}. The sum\'s peaks fall on the I carrier\'s marks.',
      captionReverse: 'Negative I = {i}: the sum is the I carrier upside down, A = {a}, φ = {phi}. The sum\'s peaks lie between the marks.',
      captionLead: 'I = {i}, Q = {q}: the sum is again a cosine of the same frequency, with A = √(I² + Q²) = {a} and φ = atan2(Q, I) = {phi}. Its peak comes {phiAbs} before the I carrier\'s peak (it leads).',
      captionLag: 'I = {i}, Q = {q}: the sum is again a cosine of the same frequency, with A = √(I² + Q²) = {a} and φ = atan2(Q, I) = {phi}. Its peak comes {phiAbs} after the I carrier\'s peak (it lags).',
      captionOver: ' A is above 100 %: larger than either part on its own.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>An <b>I/Q modulator</b> works with two carriers of the same frequency, 90° apart in phase. The first carrier is weighted by the I signal (in-phase component), the second, shifted by 90°, by the Q signal (quadrature component). Then the two are added.</p>' +
        '<p>The sum is again a cosine of the same frequency:<br>I · cos(ωt) + Q · cos(ωt + 90°) = A · cos(ωt + φ),<br>with amplitude A = √(I² + Q²) and phase shift φ = atan2(Q, I).</p>' +
        '<p>So changing I and Q changes both the amplitude and the phase of the signal. The pair (I, Q) is a point in the <b>I/Q plane</b>: its distance from the origin is the amplitude, its angle to the I axis the phase. Plot every allowed state this way and you get a <b>constellation diagram</b>, one point per symbol.</p>' +
        '<p>The marks on the time axis are the I carrier\'s peaks. When φ is positive the sum\'s peak comes earlier (the signal leads); when it is negative, later.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
