/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the aurora page, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is
   a placeholder. The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_aurora.html and sections/aurora_1.md, aurora_2.md, slides/aurora_1.md
   (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck
   from them and the German originals. Terms missing from kit/glossary.js (Doppler spread, aurora, over, monitor
   tone) are written out here: NOTES.md "Term pairs". Caption values ({t}, {w}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Aurora CW veza: prijepis triju prolaza, spektrogram cijele snimke i spektar signala preko aurore uz spektar vlastitog signala',
      dec: ',',
      hz: '{v} Hz',
      s: '{v} s',
      // controls
      play: 'Reproduciraj / pauza',
      t: 'Položaj u snimci',
      tHint: 'Klik na spektrogram također skače.',
      // presets
      presetAurora: 'GM4YXI preko aurore',
      presetAuroraHint: 'Od početka: grub, šuškav ton',
      presetOwn: 'Vlastiti signal',
      presetOwnHint: 'OK/DF7TR/P odgovara: čist ton',
      presetLast: 'Zadnji prolaz',
      presetLastHint: 'GM4YXI se odjavljuje, opet preko aurore',
      // legend
      legendAurora: 'preko aurore',
      legendOwn: 'vlastiti signal',
      legendHead: 'trenutak reprodukcije',
      // stage
      pathAurora: 'preko aurore',
      pathOwn: 'vlastiti signal',
      plotSg: 'Spektrogram cijele snimke: frekvencija kroz vrijeme',
      plotSpec: 'Spektar svakog puta, bez šuma prijamnika',
      weak: 'slabo',
      strong: 'jako',
      axisF: 'f / Hz',
      axisT: 't / s',
      axisDb: 'dB',
      widthLabel: '≈ {w}',
      // captions
      captionPos: 'Snimka, {t} od {d}. ',
      nowAurora: '{who} preko aurore: ton je razmazan po oko {w} (10 dB ispod vrha), grubo šuškanje umjesto čiste note. ',
      nowOwn: '{who}, vlastiti signal koji je postaja čula dok je slala: jedna čista crta, uža od {w} (granica analize). ',
      captionNote: 'Ista visina tona, oko {f}: razliku čini samo put preko aurore.',
      credit: 'Prema apletu i snimci s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; dodani spektrogram i izmjereni spektri, prevedeno i prilagođeno za simdeck.',
      explain:
        '<p>Kada se nabijene čestice iz Sunčeva vjetra uklope u Zemljino magnetsko polje, usmjeravaju se prema polovima. Tamo ioniziraju kisik i dušik gornje atmosfere do visine od otprilike 90 km, u području E-regije. Tako nastaje polarna svjetlost (aurora), a ista ionizirana područja lome radiovalove. To se koristi pretežno u VHF području (pojasevi 6 m i 2 m) za DX veze; za nas u Europi to je područje na sjeveru.</p>' +
        '<p>Ta su područja vrlo dinamična i neprestano se gibaju. Svaki dio odbija val s malo drugačijim Dopplerovim pomakom, pa se jedan ton u prijamniku raširi na stotine herca: <em lang="en">Doppler spread</em> (Dopplerovo širenje). Signal je „treperav” i „brujeći”, govor je teško razumljiv, a CW je najprikladniji. Zbog grubog tona u RST izvještaju umjesto ocjene tona T daje se slovo „A” (aurora).</p>' +
        '<p>Snimka je kraj stvarne CW veze na 2 m između GM4YXI i OK/DF7TR/P, u tri prolaza kao tri oblačića izvornog apleta. GM4YXI dolazi preko aurore. U srednjem prolazu OK/DF7TR/P odgovara, a snimka bilježi njegov vlastiti signal onako kako ga postaja čuje dok šalje, bez aurore na putu. Zato je ista snimka i usporedba: čista crta i razmazana mrlja na istoj visini tona.</p>' +
        '<p>Spektrogram pokazuje frekvenciju kroz vrijeme; tamnija (u tamnoj temi svjetlija) točka znači jači signal. Donja slika pokazuje spektar svakog puta: prosjek trenutaka kad je tipka pritisnuta, umanjen za prosjek stanki (šum prijamnika). Širina se mjeri 10 dB ispod vrha. Za vlastiti signal izmjerenih oko 30 Hz granica je same analize (okviri od 128 ms); stvarna crta je uža.</p>'
    },
    en: {
      stage: 'An aurora CW contact: the transcript of three overs, a spectrogram of the whole recording, and the spectrum of the signal via the aurora next to that of the own signal',
      dec: '.',
      hz: '{v} Hz',
      s: '{v} s',
      // controls
      play: 'Play / pause',
      t: 'Position in the recording',
      tHint: 'Clicking the spectrogram jumps too.',
      // presets
      presetAurora: 'GM4YXI via the aurora',
      presetAuroraHint: 'From the start: a rough, hissing tone',
      presetOwn: 'Own signal',
      presetOwnHint: 'OK/DF7TR/P answers: a clean tone',
      presetLast: 'Last over',
      presetLastHint: 'GM4YXI signs off, via the aurora again',
      // legend
      legendAurora: 'via the aurora',
      legendOwn: 'own signal',
      legendHead: 'play position',
      // stage
      pathAurora: 'via the aurora',
      pathOwn: 'own signal',
      plotSg: 'Spectrogram of the whole recording: frequency over time',
      plotSpec: 'The spectrum of each path, receiver noise taken out',
      weak: 'weak',
      strong: 'strong',
      axisF: 'f / Hz',
      axisT: 't / s',
      axisDb: 'dB',
      widthLabel: '≈ {w}',
      // captions
      captionPos: 'Recording, {t} of {d}. ',
      nowAurora: '{who} via the aurora: the tone is smeared over about {w} (10 dB below the peak), a rough hiss instead of a clean note. ',
      nowOwn: '{who}, the own signal as the station heard it while sending: one clean line, narrower than {w} (the analysis\'s limit). ',
      captionNote: 'The same pitch, about {f}: the path via the aurora alone makes the difference.',
      credit: 'After an applet and recording from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; spectrogram and measured spectra added, translated and adapted for simdeck.',
      explain:
        '<p>When charged particles from the solar wind enter the Earth\'s magnetic field, they are steered towards the poles. There they ionise the oxygen and nitrogen of the upper atmosphere down to about 90 km, in the E region. This makes the polar lights (aurora), and the same ionised regions refract radio waves. It is used mostly on VHF (the 6 m and 2 m bands) for DX contacts; for us in Europe the region is to the north.</p>' +
        '<p>These regions are very dynamic and keep moving. Each part reflects the wave with a slightly different Doppler shift, so one tone spreads over hundreds of hertz in the receiver: <em>Doppler spread</em>. The signal flutters and buzzes, speech is hard to understand, and CW suits best. Because of the rough tone, an RST report gives the letter "A" (aurora) instead of the tone figure T.</p>' +
        '<p>The recording is the end of a real CW contact on 2 m between GM4YXI and OK/DF7TR/P, in three overs, as the original applet\'s three bubbles. GM4YXI comes in via the aurora. In the middle over OK/DF7TR/P answers, and the recording holds that station\'s own signal as it is heard while sending, with no aurora on the way. So the one recording is also a comparison: a clean line and a smeared patch at the same pitch.</p>' +
        '<p>The spectrogram shows frequency over time; a darker point (lighter in the dark theme) is a stronger signal. The lower plot shows each path\'s spectrum: the average of the moments the key is down, less the average of the gaps (the receiver\'s noise). The width is measured 10 dB below the peak. The own signal\'s measured 30 Hz or so is the limit of the analysis itself (frames of 128 ms); the real line is narrower.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
