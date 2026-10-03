/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the mains hum and ripple page, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_brumm.html and sections/restwelligkeit.md, gleichrichter_2.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), the model's words written for simdeck;
   English written for simdeck from them and the German original. Terms missing from kit/glossary.js (ripple, hum,
   half-wave / full-wave rectification, reservoir capacitor, load resistor, peak voltage, AC coupling) are written out
   here: NOTES.md "Term pairs". Values in captions are nodes (bold); R_L, C_L, Û are nodes too. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Napon na otporu opterećenja iza ispravljača, tijekom 60 ms',
      // controls
      rect: 'Ispravljač',
      rectHint: 'Punovalni okreće i negativnu poluperiodu prema gore.',
      rectHalf: 'poluvalni',
      rectFull: 'punovalni',
      tau: 'Kondenzator: τ = R·C',
      tauHint: 'Vremenska konstanta pražnjenja kroz R.',
      tauNone: 'bez C',
      ac: 'Osciloskop: AC-vezanje',
      acHint: 'Samo izmjenični dio, povećan: valovitost.',
      sound: 'Brujanje: slušaj / zaustavi',
      // units
      ms: '{v} ms',
      hz: '{v} Hz',
      pct: '{v} %',
      // presets
      presetHalf0: 'Poluvalno, bez C',
      presetHalf0Hint: 'Jedna poluperioda svakih 20 ms: 50 Hz',
      presetFull0: 'Punovalno, bez C',
      presetFull0Hint: 'Dvije poluperiode svakih 20 ms: 100 Hz',
      presetHalf: 'Poluvalno s C',
      presetHalfHint: 'Brujanje od 50 Hz, kao prvi gumb izvornika',
      presetFull: 'Punovalno s C',
      presetFullHint: 'Brujanje od 100 Hz, kao drugi gumb izvornika',
      presetBig: 'Veći kondenzator',
      presetBigHint: 'τ = 160 ms: manja valovitost, tiše brujanje',
      presetAc: 'Samo valovitost (AC)',
      presetAcHint: 'Osciloskop s AC-vezanjem ulaza',
      // legend
      legendMains: 'mrežni napon 50 Hz',
      legendRect: 'ispravljeno, bez C',
      legendOut: 'napon na R',
      legendDc: 'istosmjerni dio',
      // stage
      axisT: 't',
      axisAc: 'samo izmjenični dio, povećano',
      readF: 'Valovitost: f = {f}',
      readT: 'T = {t}',
      readPp: 'vrh–vrh: {v} od Û',
      readMean: 'istosmjerni dio: {v} od Û',
      readPlaying: 'Svira: brujanje {f}',
      readSilent: 'Zvuk: isključen',
      bracketMains: 'mreža: 20 ms',
      bracketRipple: 'T = {t}',
      // captions
      captionHalf0: 'Poluvalni ispravljač bez kondenzatora propušta samo pozitivne poluperiode, jednu svakih 20 ms. Napon na {r} pulsira frekvencijom {f}; kroz pojačalo i zvučnik čulo bi se brujanje od {f}.',
      captionFull0: 'Punovalni ispravljač okreće i negativnu poluperiodu u pozitivno područje: poluperioda dolazi svakih 10 ms. Napon na {r} pulsira frekvencijom {f}, dvostruko većom od mrežnih 50 Hz.',
      captionCap: 'S kondenzatorom {c} (τ = {tau}) napon ne pada na nulu: {c} se na vrhu napuni do {u}, a između vrhova prazni kroz {r}. Ostaje preostala valovitost od {pp} od {u} (vrh–vrh), frekvencije {f}.',
      captionBig: ' Veći kondenzator: manja valovitost i tiše brujanje, a frekvencija ostaje ista.',
      captionHalfCap: ' Poluvalni ispravljač puni {c} samo jednom u 20 ms, pa je valovitost veća nego kod punovalnog s istim τ.',
      captionAc: ' Na osciloskopu s AC-vezanjem ulaza istosmjerni dio nestaje i ostaje samo valovitost, koju sada možemo povećati.',
      // attribution
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden, prilagođen za simdeck i dopunjen modelom ispravljača.',
      explain:
        '<p>Budući da nijedan sklop ne radi idealno, na otporu opterećenja R<sub>L</sub> ispravljača ne vlada potpuno konstantan istosmjerni napon, nego pulsirajući napon. On nastaje iz uzastopnih pozitivnih sinusoidnih poluperioda i djelovanja kondenzatora za izglađivanje. Taj preostali dio izmjeničnog napona naziva se <em>preostala valovitost</em>.</p>' +
        '<p>Kod punovalnog ispravljača njezina frekvencija iznosi 100 Hz, jer se i negativna poluperioda preslikava u pozitivno područje, pa se mrežna frekvencija od 50 Hz udvostručuje. Poluvalni ispravljač propušta samo svaku drugu poluperiodu, pa valovitost ima 50 Hz. Kada bismo taj pulsirajući istosmjerni napon preko naponskog djelitelja doveli u pojačalo sa zvučnikom, čuli bismo brujanje te frekvencije.</p>' +
        '<p>Kondenzator za punjenje C<sub>L</sub> puni se na vrhu poluperiode do vršnog napona Û i prazni se kroz R<sub>L</sub> dok sljedeća poluperioda ne dođe do njega. Što je kapacitet veći (veći τ = R<sub>L</sub>·C<sub>L</sub>), napon je ravnomjernije izglađen.</p>' +
        '<p>Valovitost se gleda osciloskopom s AC-vezanjem ulaza: ulaz je tada vezan kapacitivno, pa se prikazuje samo izmjenični dio signala.</p>' +
        '<p>Zvuk je izmjenični dio napona na R<sub>L</sub> kakav je nacrtan: što je valovitost manja, brujanje je tiše. Mali zvučnici prijenosnih računala slabo reproduciraju 50 Hz; čuje se ponajviše nadtonovima.</p>'
    },
    en: {
      stage: 'The voltage on the load resistor behind a rectifier, over 60 ms',
      // controls
      rect: 'Rectifier',
      rectHint: 'Full-wave turns the negative half-period up as well.',
      rectHalf: 'half-wave',
      rectFull: 'full-wave',
      tau: 'Capacitor: τ = R·C',
      tauHint: 'The time constant of the discharge through R.',
      tauNone: 'no C',
      ac: 'Oscilloscope: AC coupling',
      acHint: 'Only the AC part, enlarged: the ripple.',
      sound: 'Hum: listen / stop',
      // units
      ms: '{v} ms',
      hz: '{v} Hz',
      pct: '{v} %',
      // presets
      presetHalf0: 'Half-wave, no C',
      presetHalf0Hint: 'One half-period every 20 ms: 50 Hz',
      presetFull0: 'Full-wave, no C',
      presetFull0Hint: 'Two half-periods every 20 ms: 100 Hz',
      presetHalf: 'Half-wave with C',
      presetHalfHint: 'A 50 Hz hum, as the original\'s first button',
      presetFull: 'Full-wave with C',
      presetFullHint: 'A 100 Hz hum, as the original\'s second button',
      presetBig: 'Larger capacitor',
      presetBigHint: 'τ = 160 ms: less ripple, a quieter hum',
      presetAc: 'Ripple only (AC)',
      presetAcHint: 'An oscilloscope with AC-coupled input',
      // legend
      legendMains: 'mains voltage 50 Hz',
      legendRect: 'rectified, no C',
      legendOut: 'voltage on R',
      legendDc: 'DC part',
      // stage
      axisT: 't',
      axisAc: 'AC part only, enlarged',
      readF: 'Ripple: f = {f}',
      readT: 'T = {t}',
      readPp: 'peak to peak: {v} of Û',
      readMean: 'DC part: {v} of Û',
      readPlaying: 'Playing: a {f} hum',
      readSilent: 'Sound: off',
      bracketMains: 'mains: 20 ms',
      bracketRipple: 'T = {t}',
      // captions
      captionHalf0: 'A half-wave rectifier without a capacitor passes only the positive half-periods, one every 20 ms. The voltage on {r} pulses at {f}; through an amplifier and a speaker you would hear a {f} hum.',
      captionFull0: 'A full-wave rectifier turns the negative half-period up into the positive range as well: a half-period arrives every 10 ms. The voltage on {r} pulses at {f}, twice the mains\' 50 Hz.',
      captionCap: 'With the capacitor {c} (τ = {tau}) the voltage no longer drops to zero: {c} charges to {u} at each peak and discharges through {r} in between. What is left is a ripple of {pp} of {u} (peak to peak) at {f}.',
      captionBig: ' A larger capacitor: less ripple and a quieter hum, at the same frequency.',
      captionHalfCap: ' The half-wave rectifier charges {c} only once every 20 ms, so the ripple is larger than full-wave with the same τ.',
      captionAc: ' On an oscilloscope with AC-coupled input the DC part is gone and only the ripple is left, which can now be enlarged.',
      // attribution
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated, adapted for simdeck and extended with a rectifier model.',
      explain:
        '<p>Since no circuit works ideally, the load resistor R<sub>L</sub> of a rectifier does not see a perfectly constant DC voltage but a pulsating one. It comes from the successive positive sine half-waves and the smoothing of the capacitor. This remaining AC part is called the <em>ripple</em>.</p>' +
        '<p>With a full-wave rectifier its frequency is 100 Hz, because the negative half-wave is mirrored into the positive range as well, which doubles the mains frequency of 50 Hz. A half-wave rectifier passes only every other half-wave, so its ripple is at 50 Hz. If you fed this pulsating DC voltage through a voltage divider into an amplifier with a speaker, you would hear a hum at that frequency.</p>' +
        '<p>The reservoir capacitor C<sub>L</sub> charges to the peak voltage Û at the top of each half-wave and discharges through R<sub>L</sub> until the next half-wave reaches it. The larger the capacitance (the larger τ = R<sub>L</sub>·C<sub>L</sub>), the more evenly the voltage is smoothed.</p>' +
        '<p>You look at the ripple with an oscilloscope whose input is AC-coupled: the input is then coupled through a capacitor, so only the AC part of the signal is shown.</p>' +
        '<p>The sound is the AC part of the voltage on R<sub>L</sub> as drawn: the smaller the ripple, the quieter the hum. Small laptop speakers reproduce 50 Hz poorly; you hear it mostly through its overtones.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
