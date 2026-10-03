/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the speech spectrum page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/spektrum_sprachsignale.html and sections/sprachsignale.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), the model's words written for simdeck;
   English written for simdeck from them and the German original. Terms missing from kit/glossary.js (speech signal,
   amplitude spectrum, harmonic, fundamental frequency, formant, envelope, noise, bandwidth, modulating signal) are
   written out here: NOTES.md "Term pairs". Values in captions are nodes (bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Amplitudni spektar govornog glasa, od 50 Hz do 20 kHz',
      // controls
      sound: 'Glas',
      soundHint: 'Samoglasnici a, i, u su zvučni; „s“ je bezvučan (šum).',
      soundA: 'a',
      soundI: 'i',
      soundU: 'u',
      soundS: 's',
      pitch: 'Osnovna frekvencija f0',
      pitchHint: 'Visina glasa: muški oko 120 Hz, ženski oko 220 Hz.',
      pitchNone: '„s“ je šum i nema osnovnu frekvenciju.',
      pitchLive: 'Isključeno dok je mikrofon uključen.',
      band: 'Pojas radiouređaja 300–2700 Hz',
      bandHint: 'Ono što radiouređaj prenosi; izvan pojasa je isprekidano.',
      mic: 'Mikrofon uključi / isključi',
      // units
      hz: '{v} Hz',
      khz: '{v} kHz',
      db: '{v} dB',
      pct: '{v} %',
      pctLow: '< 1 %',
      pctHigh: '> 99 %',
      // presets
      presetA: 'Samoglasnik a',
      presetAHint: 'F1 i F2 blizu, oko 1 kHz',
      presetI: 'Samoglasnik i',
      presetIHint: 'F1 nisko, F2 visoko',
      presetU: 'Samoglasnik u',
      presetUHint: 'Sve ispod 1 kHz',
      presetHigh: 'Viši glas',
      presetHighHint: 'a s f0 = 240 Hz: crte se razmaknu, formanti ostaju',
      presetS: 'Bezvučni s',
      presetSHint: 'Šum: kontinuirani spektar, visoko gore',
      presetBand: 'Pojas 300–2700 Hz',
      presetBandHint: 'Što prenosi radiouređaj',
      // legend
      legendLine: 'harmonik',
      legendEnv: 'ovojnica (formanti)',
      legendNoise: 'šum',
      legendPeak: 'najjača komponenta',
      legendBand: 'pojas 300–2700 Hz',
      // stage
      axisF: 'frekvencija →',
      axisDb: 'razina ↑',
      modeModel: 'Model: {sound}',
      modeLive: 'Mikrofon uživo',
      nameA: 'samoglasnik „a“',
      nameI: 'samoglasnik „i“',
      nameU: 'samoglasnik „u“',
      nameS: 'bezvučni „s“',
      readPeak: 'Najjača komponenta: f = {f}',
      readPitch: 'f0 = {f}',
      readShare: 'U pojasu: {v} snage',
      bandLo: '300 Hz',
      bandHi: '2700 Hz',
      // captions
      captionVoiced: 'Zvučni {sound}, f0 = {f0}: spektar su crte na višekratnicima osnovne frekvencije, harmonici. Najjači je {k}. harmonik na {peak}, ondje gdje ga vokalni trakt najviše pojačava (formant). Iznad {top} sve je ispod −60 dB.',
      captionS: 'Bezvučni „s“ nema osnovnu frekvenciju: to je šum, pa spektar nema crta, nego je kontinuiran. Najjači je oko {peak}, a seže do {top}.',
      captionBand: ' Radiouređaj prenosi samo 300–2700 Hz, širina pojasa 2400 Hz: ostaje {share} snage.',
      captionBandLowF0: ' Osnovna frekvencija je ispod pojasa, ali uho visinu glasa čuje i iz razmaka harmonika.',
      captionBandS: ' Zato se „s“ na radiju teško razlikuje od „f“.',
      captionLiveWait: 'Mikrofon: dopusti pristup u pregledniku …',
      captionLive: 'Mikrofon uživo: najjača komponenta je na {peak}. Izgovori dugi samoglasnik, pa „sss“: crte harmonika, pa šum.',
      captionLiveQuiet: 'Mikrofon uživo: tiho je. Govori u mikrofon.',
      captionLiveBand: ' U pojasu 300–2700 Hz je {share} snage.',
      captionLiveError: 'Mikrofon nije dostupan ({why}).',
      errNoApi: 'preglednik ne nudi pristup mikrofonu',
      errDenied: 'pristup nije dopušten ili mikrofona nema',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden, prilagođen za simdeck i dopunjen modelom glasa.',
      explain:
        '<p>Kad govorimo, nastaju mnogi niski i visoki, tihi i glasni tonovi: <i>speech signal</i> (govorni signal). Mikrofon ga pretvara u električne titraje, pa ga radiouređaj može obraditi.</p>' +
        '<p><i>Amplitude spectrum</i> (amplitudni spektar) pokazuje koliko je koja frekvencija jaka: lijevo niski, desno visoki tonovi, a visina je amplituda. Ovdje je razina u decibelima prema najjačoj komponenti, a frekvencija na logaritamskoj skali.</p>' +
        '<p><b>Zvučni glasovi</b> (samoglasnici) nastaju titranjem glasnica. Njihov spektar su crte: osnovna frekvencija f0 (<i>fundamental frequency</i>) i <i>harmonics</i> (harmonici) na 2 · f0, 3 · f0 … Usna i ždrijelna šupljina pojačavaju neka područja, <i>formants</i> (formanti) F1, F2, F3; po njima razlikujemo a, i i u. Viši glas razmakne crte, ali formanti ostaju.</p>' +
        '<p><b>Bezvučni glasovi</b> poput „s“ su <i>noise</i> (šum): nemaju osnovnu frekvenciju, a spektar im je kontinuiran i leži visoko.</p>' +
        '<p>Govor ne sadrži proizvoljno visoke frekvencije, a za radijski prijenos dovoljno je još uže područje, na primjer 300–2700 Hz. <i>Bandwidth</i> (širina pojasa) je tada 2700 Hz − 300 Hz = 2400 Hz. Takav govorni signal zatim modulira nositelj: to je <i>modulating signal</i> (modulacijski signal).</p>' +
        '<p>Gumb <b>Mikrofon</b> (tipka M) prikazuje spektar vlastitog glasa uživo. Model je pojednostavljen: srednje formante muškog glasa i glatka ovojnica.</p>'
    },
    en: {
      stage: 'The amplitude spectrum of a speech sound, from 50 Hz to 20 kHz',
      sound: 'Sound',
      soundHint: 'The vowels a, i, u are voiced; "s" is unvoiced (noise).',
      soundA: 'a',
      soundI: 'i',
      soundU: 'u',
      soundS: 's',
      pitch: 'Fundamental frequency f0',
      pitchHint: 'The pitch of the voice: about 120 Hz for men, 220 Hz for women.',
      pitchNone: '"s" is noise and has no fundamental frequency.',
      pitchLive: 'Off while the microphone is on.',
      band: 'Radio band 300–2700 Hz',
      bandHint: 'What a transmitter passes on; outside the band is dashed.',
      mic: 'Microphone on / off',
      hz: '{v} Hz',
      khz: '{v} kHz',
      db: '{v} dB',
      pct: '{v} %',
      pctLow: '< 1 %',
      pctHigh: '> 99 %',
      presetA: 'Vowel a',
      presetAHint: 'F1 and F2 close together, near 1 kHz',
      presetI: 'Vowel i',
      presetIHint: 'F1 low, F2 high',
      presetU: 'Vowel u',
      presetUHint: 'Everything below 1 kHz',
      presetHigh: 'Higher voice',
      presetHighHint: 'a at f0 = 240 Hz: the lines move apart, the formants stay',
      presetS: 'Unvoiced s',
      presetSHint: 'Noise: a continuous spectrum, high up',
      presetBand: 'Band 300–2700 Hz',
      presetBandHint: 'What a radio passes on',
      legendLine: 'harmonic',
      legendEnv: 'envelope (formants)',
      legendNoise: 'noise',
      legendPeak: 'strongest component',
      legendBand: 'band 300–2700 Hz',
      axisF: 'frequency →',
      axisDb: 'level ↑',
      modeModel: 'Model: {sound}',
      modeLive: 'Live microphone',
      nameA: 'vowel "a"',
      nameI: 'vowel "i"',
      nameU: 'vowel "u"',
      nameS: 'unvoiced "s"',
      readPeak: 'Strongest component: f = {f}',
      readPitch: 'f0 = {f}',
      readShare: 'In the band: {v} of the power',
      bandLo: '300 Hz',
      bandHi: '2700 Hz',
      captionVoiced: 'The voiced {sound}, f0 = {f0}: the spectrum is lines at multiples of the fundamental frequency, the harmonics. The strongest is harmonic {k} at {peak}, where the vocal tract boosts it most (a formant). Above {top} everything is below −60 dB.',
      captionS: 'The unvoiced "s" has no fundamental frequency: it is noise, so its spectrum has no lines but is continuous. It is strongest near {peak} and reaches up to {top}.',
      captionBand: ' A radio passes only 300–2700 Hz, a bandwidth of 2400 Hz: {share} of the power is left.',
      captionBandLowF0: ' The fundamental lies below the band, but the ear still hears the pitch from the spacing of the harmonics.',
      captionBandS: ' That is why on the radio "s" is hard to tell from "f".',
      captionLiveWait: 'Microphone: allow access in the browser …',
      captionLive: 'Live microphone: the strongest component is at {peak}. Say a long vowel, then "sss": harmonic lines, then noise.',
      captionLiveQuiet: 'Live microphone: it is quiet. Speak into the microphone.',
      captionLiveBand: ' {share} of the power lies in 300–2700 Hz.',
      captionLiveError: 'The microphone is not available ({why}).',
      errNoApi: 'the browser offers no microphone access',
      errDenied: 'access was refused or there is no microphone',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated, adapted for simdeck and extended with a voice model.',
      explain:
        '<p>When we speak, many low and high, soft and loud tones arise: the speech signal. A microphone turns it into electrical oscillations, so a radio can process it.</p>' +
        '<p>The amplitude spectrum shows how strong each frequency is: low tones on the left, high tones on the right, and the height is the amplitude. Here the level is in decibels relative to the strongest component, and frequency is on a log scale.</p>' +
        '<p><b>Voiced sounds</b> (the vowels) come from the vibrating vocal folds. Their spectrum is lines: the fundamental frequency f0 and the harmonics at 2 · f0, 3 · f0 … The mouth and throat boost some regions, the formants F1, F2, F3; they are what tells a, i and u apart. A higher voice moves the lines apart, but the formants stay.</p>' +
        '<p><b>Unvoiced sounds</b> such as "s" are noise: they have no fundamental frequency, and their spectrum is continuous and lies high up.</p>' +
        '<p>Speech does not contain arbitrarily high frequencies, and for radio an even narrower range is enough, for example 300–2700 Hz. The bandwidth is then 2700 Hz − 300 Hz = 2400 Hz. Such a speech signal then modulates a carrier: it is the modulating signal.</p>' +
        '<p>The <b>Microphone</b> button (key M) shows the spectrum of your own voice live. The model is simplified: average formants of a male voice and a smooth envelope.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
