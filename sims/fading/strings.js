/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the fading page, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is
   a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/fading_applet.html and sections/fading.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and the German original.
   Terms missing from kit/glossary.js (fading, ground wave, sky wave, interference, phase difference) are written out
   here: NOTES.md "Term pairs". Caption values ({phi}, {sum}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Prostorni i prizemni val u vremenu, njihov zbroj u prijamniku, i jakost tog zbroja u zadnjih 60 sekundi',
      // controls
      amp: 'Jakost prizemnog vala',
      ampHint: 'Amplituda prizemnog vala u postotku amplitude prostornog. Što je prijamnik dalje od odašiljača, prizemni val je slabiji.',
      phase: 'Fazna razlika φ',
      phaseHint: 'Pomak faze prizemnog vala prema prostornom, u stupnjevima jedne periode.',
      drift: 'Pomakni ionosferu',
      driftStop: 'Zaustavi ionosferu',
      driftHint: 'Fazna razlika raste za 18° u sekundi (u modelu jedan feding svakih 20 s), kao kad se ionosfera diže ili spušta.',
      deg: '{v}°',
      pct: '{v} %',
      sec: '{v} s',
      // presets
      presetOriginal: 'Izvorni aplet (80 %, 180°)',
      presetOriginalHint: 'Početni prikaz izvornog apleta: dno fedinga',
      presetInPhase: 'U fazi (100 %, 0°)',
      presetInPhaseHint: 'Bregovi se poklapaju: signal je najjači',
      presetFalling: 'Signal slabi (100 %, 90°)',
      presetFallingHint: 'Na pola puta prema dnu fedinga',
      presetDropout: 'Potpuni nestanak (100 %, 180°)',
      presetDropoutHint: 'Jednako jaki valovi u protufazi poništavaju se',
      presetWeakGround: 'Slab prizemni val (30 %, 180°)',
      presetWeakGroundHint: 'Feding je plitak: signal samo malo oslabi',
      presetSkyOnly: 'Samo prostorni val (0 %)',
      presetSkyOnlyHint: 'Izvan dosega prizemnog vala: nema ovog fedinga',
      // legend
      legendSky: 'prostorni val',
      legendGround: 'prizemni val (crtkano)',
      legendSum: 'zbroj u prijamniku',
      legendStrength: 'jakost zbroja kroz vrijeme',
      // stage
      plotWaves: 'dva vala istog odašiljača',
      plotSum: 'zbroj',
      plotStrength: 'jakost signala u prijamniku',
      plotDrifting: 'ionosfera se pomiče',
      axisTime: 'vrijeme →',
      now: 'sada',
      sumLabel: 'A = {v}',
      maxLabel: 'najjači {v}',
      minLabel: 'najslabiji {v}',
      // captions
      caption: 'Prizemni val {amp} prostornog, fazna razlika {phi}: zbroj ima {sum} amplitude prostornog vala, {trend}. Dok se faza mijenja, jakost koleba između {min} i {max}: feding dubok {depth}.',
      caption_inf: 'Prizemni val jednako jak kao prostorni ({amp}), fazna razlika {phi}: zbroj ima {sum} amplitude prostornog vala, {trend}. Dok se faza mijenja, jakost koleba između {min} i {max}: na dnu svakog fedinga signal potpuno nestaje.',
      trend_peak: 'signal je najjači',
      trend_trough: 'signal je na dnu fedinga',
      trend_fading: 'a s rastom faze signal slabi',
      trend_rising: 'a s rastom faze signal opet jača',
      cap_dropout: 'Prizemni val jednako jak kao prostorni ({amp}), fazna razlika {phi}: brijeg jednoga nailazi na dol drugoga, pa je zbroj {sum}, signal potpuno nestaje. Dok se faza mijenja, jakost koleba između {min} i {max}: feding je beskonačno dubok.',
      cap_steady: 'Nema prizemnog vala ({amp}): prijamnik prima samo prostorni val, pa je zbroj {sum} i ne koleba, kako god se faza mijenjala. Ovaj feding nastaje tek kad stignu oba vala.',
      db: '{v} dB',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Odašiljač na kratkim valovima stiže do prijamnika na dva načina: <em lang="en">ground wave</em> (prizemni val) širi se duž Zemljine površine i slabi s udaljenošću, a <em lang="en">sky wave</em> (prostorni val) lomi se u ionosferi i vraća na Zemlju. Prostorni val može stići još unutar dosega prizemnog vala; tada prijamnik prima oba.</p>' +
        '<p>Dva signala iste frekvencije u prijamniku se zbrajaju (<em lang="en">interference</em>, interferencija). Ovisno o <em lang="en">phase difference</em> (faznoj razlici) zbroj je pojačan ili oslabljen. Ako su oba vala jednako jaka, a faza im je pomaknuta za 180°, zbroj je nula: signal nestaje.</p>' +
        '<p>Ionosfera nije mirna: diže se, spušta i mijenja, pa se mijenja i put prostornog vala, a s njim faza i amplituda. Jakost polja u prijamniku zato neprestano koleba. To se naziva <em lang="en">fading</em> (feding), a kratica je <i>QSB</i>, pa to možete javiti i svom radijskom partneru. Na VHF-u i iznad njega feding često uzrokuje refleksija na pokretnim objektima.</p>' +
        '<p>Feding je najdublji gdje su oba vala podjednako jaka; gdje je jedan mnogo jači, zbroj samo malo koleba. U modelu se faza mijenja jednoliko, 18° u sekundi; prava ionosfera mijenja i brzinu i amplitudu, pa je pravi QSB nepravilan, brži ili sporiji.</p>'
    },
    en: {
      stage: 'The sky wave and the ground wave over time, their sum at the receiver, and that sum\'s strength over the last 60 seconds',
      amp: 'Strength of the ground wave',
      ampHint: 'The ground wave\'s amplitude as a percentage of the sky wave\'s. The farther the receiver is from the transmitter, the weaker the ground wave.',
      phase: 'Phase difference φ',
      phaseHint: 'How far the ground wave is shifted against the sky wave, in degrees of one period.',
      drift: 'Move the ionosphere',
      driftStop: 'Stop the ionosphere',
      driftHint: 'The phase difference grows by 18° a second (one fade every 20 s in the model), as when the ionosphere rises or sinks.',
      deg: '{v}°',
      pct: '{v}%',
      sec: '{v} s',
      presetOriginal: 'Original applet (80%, 180°)',
      presetOriginalHint: 'Where the original applet starts: the bottom of a fade',
      presetInPhase: 'In phase (100%, 0°)',
      presetInPhaseHint: 'The crests coincide: the signal is at its strongest',
      presetFalling: 'Signal fading (100%, 90°)',
      presetFallingHint: 'Halfway down into a fade',
      presetDropout: 'Complete dropout (100%, 180°)',
      presetDropoutHint: 'Equally strong waves in opposite phase cancel',
      presetWeakGround: 'Weak ground wave (30%, 180°)',
      presetWeakGroundHint: 'A shallow fade: the signal weakens only a little',
      presetSkyOnly: 'Sky wave only (0%)',
      presetSkyOnlyHint: 'Beyond the ground wave\'s range: no fading of this kind',
      legendSky: 'sky wave',
      legendGround: 'ground wave (dashed)',
      legendSum: 'sum at the receiver',
      legendStrength: 'its strength over time',
      plotWaves: 'two waves from one transmitter',
      plotSum: 'sum',
      plotStrength: 'signal strength at the receiver',
      plotDrifting: 'the ionosphere is moving',
      axisTime: 'time →',
      now: 'now',
      sumLabel: 'A = {v}',
      maxLabel: 'strongest {v}',
      minLabel: 'weakest {v}',
      caption: 'Ground wave {amp} of the sky wave, phase difference {phi}: the sum has {sum} of the sky wave\'s amplitude, {trend}. As the phase changes, the strength swings between {min} and {max}: a fade {depth} deep.',
      caption_inf: 'Ground wave as strong as the sky wave ({amp}), phase difference {phi}: the sum has {sum} of the sky wave\'s amplitude, {trend}. As the phase changes, the strength swings between {min} and {max}: at the bottom of every fade the signal drops out completely.',
      trend_peak: 'the signal is at its strongest',
      trend_trough: 'the signal is at the bottom of a fade',
      trend_fading: 'and as the phase grows the signal weakens',
      trend_rising: 'and as the phase grows the signal recovers',
      cap_dropout: 'Ground wave as strong as the sky wave ({amp}), phase difference {phi}: each crest of one meets a trough of the other, so the sum is {sum} and the signal drops out completely. As the phase changes, the strength swings between {min} and {max}: an infinitely deep fade.',
      cap_steady: 'No ground wave ({amp}): the receiver gets only the sky wave, so the sum is {sum} and does not swing, however the phase changes. This fading needs both waves.',
      db: '{v} dB',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>On short wave a transmitter reaches the receiver in two ways: the <em lang="en">ground wave</em> travels along the Earth\'s surface and weakens with distance, and the <em lang="en">sky wave</em> is refracted in the ionosphere and comes back to Earth. The sky wave can come down while the receiver is still within the ground wave\'s range; then the receiver gets both.</p>' +
        '<p>Two signals of the same frequency add up at the receiver (<em lang="en">interference</em>). Depending on the <em lang="en">phase difference</em>, the sum is stronger or weaker. If both waves are equally strong and shifted by 180°, the sum is zero: the signal disappears.</p>' +
        '<p>The ionosphere does not stand still: it rises, sinks and changes, so the sky wave\'s path changes, and with it its phase and amplitude. The field strength at the receiver keeps rising and falling. This is called <em lang="en">fading</em>, abbreviated <i>QSB</i>, so you can tell your radio partner about it too. On VHF and above, fading is often caused by reflections from moving objects.</p>' +
        '<p>Fading is deepest where both waves are about equally strong; where one is much stronger, the sum swings only a little. In the model the phase changes evenly, 18° a second; the real ionosphere changes both the rate and the amplitude, so real QSB is irregular, faster or slower.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
