/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the multipath-interference page, in both languages (docs/sim-ui.md §9). Same keys in hr
   and en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_interferenz.html and sections/mehrwegeausbreitung.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (multipath, interference, phase difference, fading) are
   written out here: NOTES.md "Term pairs". Caption values ({phi}, {sum}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Izravni signal i reflektirani signal u vremenu, a ispod njih njihov zbroj u prijamniku',
      // controls
      phase: 'Fazna razlika φ',
      phaseHint: 'Koliko reflektirani signal kasni za izravnim, u stupnjevima jedne periode (360° = cijela perioda).',
      amp: 'Jakost reflektiranog signala',
      ampHint: 'Amplituda reflektiranog signala u postotku amplitude izravnog. Refleksija obično oslabi signal.',
      deg: '{v}°',
      pct: '{v} %',
      // presets
      presetInPhase: 'U fazi (0°)',
      presetInPhaseHint: 'Bregovi se poklapaju: zbroj je dvostruko jači',
      presetQuarter: 'Četvrt periode (90°)',
      presetQuarterHint: 'Početni prikaz izvornog apleta',
      presetThird: 'Trećina periode (120°)',
      presetThirdHint: 'Zbroj je jednako jak kao izravni signal',
      presetOpposite: 'Protufazno (180°)',
      presetOppositeHint: 'Brijeg nailazi na dol: signali se poništavaju',
      presetOppositeWeak: 'Protufazno, slabija refleksija',
      presetOppositeWeakHint: '180° i reflektirani signal od 50 %: oslabljen, ali ne poništen',
      presetQuarterWeak: '90°, slabija refleksija',
      presetQuarterWeakHint: '90° i reflektirani signal od 50 %',
      presetFull: 'Cijela perioda (360°)',
      presetFullHint: 'Kasni točno jednu periodu: isto kao u fazi',
      // legend
      legendDirect: 'izravni signal',
      legendReflected: 'reflektirani signal (crtkano)',
      legendSum: 'zbroj u prijamniku',
      // stage
      plotPaths: 'dva puta do prijamnika',
      plotSum: 'zbroj',
      axisTime: 'vrijeme →',
      sumLabel: 'A = {v}',
      lagLabel: 'φ',
      lambdas: '{v} λ',
      // captions
      caption: 'Fazna razlika {phi}, reflektirani signal {amp} izravnog. Zbroj ima amplitudu {sum} izravnog signala ({db}): {effect}. Tu faznu razliku daje put dulji za {path} ili za još cijeli broj valnih duljina više.',
      eff_stronger: 'konstruktivna interferencija, signal je pojačan',
      eff_weaker: 'destruktivna interferencija, signal je oslabljen',
      eff_same: 'pojačanje i slabljenje se ovdje točno izjednačuju',
      cap_cancelled: 'Fazna razlika {phi}, reflektirani signal {amp} izravnog. Brijeg jednoga nailazi na dol drugoga, pa je zbroj {sum}: {effect}, prijamnik ne prima ništa. Tu faznu razliku daje put dulji za {path} ili za još cijeli broj valnih duljina više.',
      eff_cancelled: 'potpuno poništenje',
      cap_none: 'Nema reflektiranog signala ({amp}): prijamnik prima samo izravni signal, pa zbroj ima amplitudu {sum} ({db}), {effect}.',
      eff_none: 'bez interferencije',
      db: '{v} dB',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Kada radijski signal dolazi od odašiljača do prijamnika na više od jednog puta, govorimo o <em lang="en">multipath</em> (višestaznom širenju). Važan uzrok je refleksija na zgradama, terenu ili zrakoplovima; na kratkim valovima signal se k tome lomi u ionosferi na više mjesta.</p>' +
        '<p>Prijamnik tada istodobno prima više signala. Zbog različitih duljina puta oni stižu s različitim kašnjenjem, a time i s različitom fazom. U prijamniku se zbrajaju; to se naziva <em lang="en">interference</em> (interferencija). Ovisno o <em lang="en">phase difference</em> (faznoj razlici) zbroj je pojačan ili oslabljen, a u krajnjem slučaju potpuno poništen.</p>' +
        '<p>Kašnjenje od cijele periode (360°) izgleda isto kao da kašnjenja nema: zato jednaku faznu razliku daje put dulji za dio valne duljine ili za taj dio i još cijelih valnih duljina. I sama refleksija može pomaknuti fazu.</p>' +
        '<p>Ako se nešto na putu giba (vozilo iz kojeg se radi, zrakoplov kao reflektor, ionosfera u sumraku), fazna razlika se neprestano mijenja, a s njom i zbroj u prijamniku. Jakost signala koleba, što se naziva <em lang="en">fading</em> (feding, <i>QSB</i>), a ovisno o vrsti modulacije signal je i izobličen i slabije razumljiv.</p>'
    },
    en: {
      stage: 'The direct and the reflected signal over time, and below them their sum at the receiver',
      phase: 'Phase difference φ',
      phaseHint: 'How far the reflected signal lags behind the direct one, in degrees of one period (360° = a whole period).',
      amp: 'Strength of the reflected signal',
      ampHint: 'The reflected signal\'s amplitude as a percentage of the direct one. A reflection usually weakens the signal.',
      deg: '{v}°',
      pct: '{v}%',
      presetInPhase: 'In phase (0°)',
      presetInPhaseHint: 'The crests coincide: the sum is twice as strong',
      presetQuarter: 'Quarter period (90°)',
      presetQuarterHint: 'Where the original applet starts',
      presetThird: 'Third of a period (120°)',
      presetThirdHint: 'The sum is exactly as strong as the direct signal',
      presetOpposite: 'Opposite phase (180°)',
      presetOppositeHint: 'Crest meets trough: the signals cancel',
      presetOppositeWeak: 'Opposite phase, weaker reflection',
      presetOppositeWeakHint: '180° with a 50% reflected signal: weakened, not cancelled',
      presetQuarterWeak: '90°, weaker reflection',
      presetQuarterWeakHint: '90° with a 50% reflected signal',
      presetFull: 'Whole period (360°)',
      presetFullHint: 'One full period late: the same as in phase',
      legendDirect: 'direct signal',
      legendReflected: 'reflected signal (dashed)',
      legendSum: 'sum at the receiver',
      plotPaths: 'two paths to the receiver',
      plotSum: 'sum',
      axisTime: 'time →',
      sumLabel: 'A = {v}',
      lagLabel: 'φ',
      lambdas: '{v} λ',
      caption: 'Phase difference {phi}, reflected signal {amp} of the direct one. The sum has {sum} of the direct signal\'s amplitude ({db}): {effect}. A path longer by {path}, or by that plus any whole number of wavelengths, gives this phase difference.',
      eff_stronger: 'constructive interference, the signal is stronger',
      eff_weaker: 'destructive interference, the signal is weaker',
      eff_same: 'here the gain and the loss balance exactly',
      cap_cancelled: 'Phase difference {phi}, reflected signal {amp} of the direct one. Each crest of one meets a trough of the other, so the sum is {sum}: {effect}, the receiver gets nothing. A path longer by {path}, or by that plus any whole number of wavelengths, gives this phase difference.',
      eff_cancelled: 'complete cancellation',
      cap_none: 'No reflected signal ({amp}): the receiver gets only the direct signal, so the sum has {sum} of its amplitude ({db}), {effect}.',
      eff_none: 'no interference',
      db: '{v} dB',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>When a radio signal reaches the receiver from the transmitter along more than one path, this is called <em lang="en">multipath</em> propagation. An important cause is reflection from buildings, terrain or aircraft; on short wave the signal is also often refracted in the ionosphere at several places.</p>' +
        '<p>The receiver then gets several signals at once. Because the paths differ in length, they arrive with different delays, and so with different phases. The receiver adds them; this is called <em lang="en">interference</em>. Depending on the <em lang="en">phase difference</em>, the sum is stronger or weaker, and in the extreme case cancelled completely.</p>' +
        '<p>A delay of a whole period (360°) looks the same as no delay: so the same phase difference comes from a path longer by a fraction of a wavelength, or by that fraction plus any number of whole wavelengths. The reflection itself can shift the phase as well.</p>' +
        '<p>If something on the way moves (a vehicle operating on the move, an aircraft as a reflector, the ionosphere at dusk), the phase difference keeps changing, and so does the sum at the receiver. The signal strength rises and falls, which is called <em lang="en">fading</em> (<i>QSB</i>), and depending on the modulation the signal is also distorted and harder to understand.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
