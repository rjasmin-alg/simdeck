/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the chirp-1 page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_chirp_1.html and sections/oszillator_spannungsstabilitaet.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md
   (Chirp kept as the loanword, točka / crta, stabilizacija napona); English written for simdeck from it and the German
   original. Terms missing from kit/glossary.js are written out here: NOTES.md "Term pairs".
   Caption values ({jump}, {tau}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Chirp: visina tona CW signala kroz vrijeme, za snimku ili za model odašiljača s padom napona pri pritisku tipke',
      dec: ',',
      hz: '{v} Hz',
      ms: '{v} ms',
      s: '{v} s',
      // controls
      src: 'Izvor',
      srcRec: 'Snimka',
      srcModel: 'Model',
      play: 'Reproduciraj / pauza',
      t: 'Položaj u snimci',
      tHint: 'Klik na traku ispod krivulje također skače.',
      reg: 'Stabilizirani napon VFO-a',
      regHint: 'Regulator stalnog napona: napon ne padne pri pritisku tipke.',
      regOn: 'Napon je stabiliziran: nema skoka.',
      jump: 'Skok pri pritisku tipke',
      jumpHint: 'Odstupanje na početku elementa (minus: niže).',
      tau: 'Vremenska konstanta povratka',
      tauHint: 'Nakon tog vremena ostaje trećina skoka.',
      // presets
      presetRec: 'Snimka',
      presetRecHint: 'Stvarni signal s chirpom, od početka',
      presetLikeRec: 'Model kao snimka',
      presetLikeRecHint: 'Kreće 90 Hz niže i sporo raste: ni crta se ne smiri',
      presetRegulated: 'Stabilizirani napon',
      presetRegulatedHint: 'Isti odašiljač s regulatorom: čist ton',
      presetFast: 'Brzi povratak',
      presetFastHint: 'Crte se smire, točke ne',
      presetAbove: 'Odozgo: cvrkut',
      presetAboveHint: 'Ton prilazi odozgo i brzo se smiri',
      // legend
      legendPitch: 'visina tona',
      legendTrue: 'prava visina tona',
      legendKey: 'tipka pritisnuta',
      legendHead: 'trenutak reprodukcije',
      // stage
      plotRec: 'Snimka: visina tona gdje se ton izdiže iz šuma',
      plotModel: 'Model: visina tona za vrijeme tipkanja',
      heard: 'Dosad odslušano:',
      sending: 'Odašilje se:',
      axisF: 'f / Hz',
      axisT: 't / s',
      tagTrue: 'prava visina tona',
      whole: 'cijela snimka',
      // captions
      captionRec: 'Snimka, {t} od {d}. Svaki element počinje prenisko i visina tona raste do njegova kraja: crta prosječno za oko 50 Hz. To je Chirp. ',
      captionRecNote: 'Iznos visine (ovdje oko 250 Hz) određuje ugađanje prijamnika; važna je samo promjena.',
      captionReg: 'Napon VFO-a je stabiliziran i ne padne kad se tipka pritisne, pa svaki element odmah ima pravu visinu tona {f0}. Nema chirpa.',
      captionZero: 'Skok je 0 Hz: svaki element odmah ima pravu visinu tona {f0}. Nema chirpa.',
      captionBelow: 'Pri svakom pritisku tipke napon padne i VFO krene {jump} ispod prave visine tona ({f0}), a zatim joj se vraća s vremenskom konstantom {tau}. ',
      captionAbove: 'Pri svakom pritisku tipke VFO krene {jump} iznad prave visine tona ({f0}) i spušta se prema njoj s vremenskom konstantom {tau}: zvuči kao cvrkut. ',
      elDit: 'Točka',
      elDah: 'Crta',
      endLow: '{el} ({len}) završava {off} prenisko. ',
      endHigh: '{el} ({len}) završava {off} previsoko. ',
      endSettled: '{el} ({len}) završava na pravoj visini. ',
      credit: 'Prema apletu i snimci s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; dodani model i izmjerena krivulja visine tona, prevedeno i prilagođeno za simdeck.',
      explain:
        '<p>Frekvencija VFO-a izravno ovisi o njegovu radnom naponu, ponajprije zato što o njemu ovisi radna točka tranzistora u oscilatoru. Kod vrlo jednostavnih CW odašiljača s lošom stabilizacijom napona to se čuje kao <em lang="en">Chirp</em>: na početku svake točke ili crte visina tona isprva je nešto viša ili nešto niža, a zatim se približava stvarnoj visini tona. Engleska riječ <em lang="en">chirp</em> znači „cvrkutanje”; kad se visina tona približava odozgo, zvuk doista pomalo podsjeća na cvrkut.</p>' +
        '<p>Zašto baš na početku elementa: kad se tipka pritisne, izlazni stupanj počne vući struju, zajednički napon napajanja na trenutak padne i zatim se oporavlja, a VFO ga slijedi. Model to opisuje jednim skokom i eksponencijalnim povratkom, f(t) = f<sub>0</sub> + Δf · e<sup>−t/τ</sup>. Točka pri 12 riječi u minuti traje samo 100 ms, pa završi prije nego što se ton smiri; zato se chirp najjače čuje u točkama.</p>' +
        '<p>Lijek: radni napon VFO-a treba biti neovisan o radnim naponima ostalih stupnjeva (stabiliziran) te što bolje filtriran i odvezan, primjerice regulatorom stalnog napona.</p>' +
        '<p>Snimka je stvaran signal s chirpom; postaja šalje QTH RHEINHAUSEN RHEINHAUSEN HW?. Krivulju visine tona simdeck je izmjerio iz snimke ondje gdje se ton jasno izdiže iz šuma, pa slabe točke mogu nedostajati.</p>'
    },
    en: {
      stage: 'Chirp: the pitch of a CW signal over time, for a recording or for a model transmitter whose supply voltage dips at key-down',
      dec: '.',
      hz: '{v} Hz',
      ms: '{v} ms',
      s: '{v} s',
      // controls
      src: 'Source',
      srcRec: 'Recording',
      srcModel: 'Model',
      play: 'Play / pause',
      t: 'Position in the recording',
      tHint: 'Clicking the strip under the curve jumps too.',
      reg: 'Regulated VFO supply',
      regHint: 'A voltage regulator: no dip at key-down.',
      regOn: 'The supply is regulated: no jump.',
      jump: 'Jump at key-down',
      jumpHint: 'How far off an element starts (minus: lower).',
      tau: 'Settling time constant',
      tauHint: 'After this time a third of the jump is left.',
      // presets
      presetRec: 'Recording',
      presetRecHint: 'A real signal with chirp, from the start',
      presetLikeRec: 'Model like the recording',
      presetLikeRecHint: 'Starts 90 Hz low and rises slowly: not even a dah settles',
      presetRegulated: 'Regulated supply',
      presetRegulatedHint: 'The same transmitter with a regulator: a clean tone',
      presetFast: 'Fast settling',
      presetFastHint: 'Dahs settle, dits do not',
      presetAbove: 'From above: a tweet',
      presetAboveHint: 'The pitch comes down from above and settles fast',
      // legend
      legendPitch: 'pitch',
      legendTrue: 'true pitch',
      legendKey: 'key down',
      legendHead: 'play position',
      // stage
      plotRec: 'Recording: the pitch where the tone stands out of the noise',
      plotModel: 'Model: the pitch while keying',
      heard: 'Heard so far:',
      sending: 'Sending:',
      axisF: 'f / Hz',
      axisT: 't / s',
      tagTrue: 'true pitch',
      whole: 'whole recording',
      // captions
      captionRec: 'Recording, {t} of {d}. Every element starts too low and the pitch rises until it ends: a dah by about 50 Hz on average. That is chirp. ',
      captionRecNote: 'The pitch itself (about 250 Hz here) is set by the receiver\'s tuning; only the change matters.',
      captionReg: 'The VFO supply is regulated and does not dip when the key goes down, so every element has the true pitch {f0} at once. No chirp.',
      captionZero: 'The jump is 0 Hz: every element has the true pitch {f0} at once. No chirp.',
      captionBelow: 'At every key-down the supply dips and the VFO starts {jump} below the true pitch ({f0}), then returns to it with time constant {tau}. ',
      captionAbove: 'At every key-down the VFO starts {jump} above the true pitch ({f0}) and comes down to it with time constant {tau}: it sounds like a tweet. ',
      elDit: 'A dit',
      elDah: 'A dah',
      endLow: '{el} ({len}) ends {off} too low. ',
      endHigh: '{el} ({len}) ends {off} too high. ',
      endSettled: '{el} ({len}) ends on the true pitch. ',
      credit: 'After an applet and recording from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; model and measured pitch curve added, translated and adapted for simdeck.',
      explain:
        '<p>A VFO\'s frequency depends directly on its supply voltage, mainly because the operating point of the transistor in the oscillator does. In very simple CW transmitters with poor voltage regulation this is heard as <em>chirp</em>: at the start of every dit or dah the pitch is first a little higher or lower, then approaches the true pitch. When the pitch comes down from above, it does sound a little like a bird\'s chirp.</p>' +
        '<p>Why at the start of an element: when the key goes down, the output stage starts to draw current, the shared supply voltage dips for a moment and then recovers, and the VFO follows it. The model describes this with one jump and an exponential return, f(t) = f<sub>0</sub> + Δf · e<sup>−t/τ</sup>. At 12 words per minute a dit lasts only 100 ms, so it ends before the tone has settled; that is why chirp is heard most in the dits.</p>' +
        '<p>The cure: the VFO\'s supply should not depend on the other stages\' supplies (regulated), and should be filtered and decoupled as well as possible, for example with a fixed voltage regulator.</p>' +
        '<p>The recording is a real signal with chirp; the station sends QTH RHEINHAUSEN RHEINHAUSEN HW?. simdeck measured the pitch curve from the recording where the tone clearly stands out of the noise, so weak dits may be missing.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
