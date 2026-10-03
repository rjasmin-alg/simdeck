/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the chirp-2 page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_chirp_2.html and sections/oszillator_spannungsstabilitaet.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md
   (Chirp kept as the loanword, točka / crta, prolaz); English written for simdeck from it and the German original.
   Terms missing from kit/glossary.js are written out here: NOTES.md "Term pairs".
   Caption values ({t}, {r0}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Chirp u QSO-u: visina tona dviju postaja kroz vrijeme i promjena visine u svakoj crti, za snimku jedne veze',
      dec: ',',
      hz: '{v} Hz',
      ms: '{v} ms',
      s: '{v} s',
      // controls
      play: 'Reproduciraj / pauza',
      t: 'Položaj u snimci',
      tHint: 'Klik na traku ispod krivulje također skače.',
      // presets
      presetFirst: 'Prvi prolaz',
      presetFirstHint: 'Postaja s mirnim tonom, od početka',
      presetSecond: 'Drugi prolaz',
      presetSecondHint: 'OM3YCY odgovara: svaka crta raste',
      presetWhole: 'Cijela veza',
      presetWholeHint: 'Sve odslušano: obje postaje jedna uz drugu',
      // legend
      legendA: 'prvi prolaz',
      legendB: 'drugi prolaz',
      legendKey: 'tipka pritisnuta',
      legendHead: 'trenutak reprodukcije',
      // stage
      plotTime: 'Visina tona gdje se ton izdiže iz šuma',
      plotRise: 'Svaka crta od pritiska tipke: promjena visine tona',
      riseEmpty: 'Puni se kako se snimka sluša.',
      passA: '1. prolaz',
      passB: '2. prolaz',
      axisF: 'f / Hz',
      axisT: 't / s',
      axisDf: 'Δf / Hz',
      axisMs: 'od pritiska / ms',
      whole: 'cijela snimka',
      // captions
      captionPos: 'Snimka, {t} od {d}. ',
      nowA: 'Šalje prva postaja. ',
      nowB: 'Šalje druga postaja, OM3YCY. ',
      nowNone: 'Još nitko nije poslao znak. ',
      captionRise: 'Od pritiska do otpuštanja tipke crte prvog prolaza promijene visinu za {r0}, a crte drugog porastu prosječno za {r1}: to je Chirp. ',
      captionNote: 'Da su dvije postaje na različitim visinama (oko 263 i 400 Hz), određuje samo ugađanje prijamnika; važna je promjena unutar elementa.',
      credit: 'Prema apletu i snimci s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; dodane izmjerene krivulje visine tona, prevedeno i prilagođeno za simdeck.',
      explain:
        '<p>Frekvencija VFO-a izravno ovisi o njegovu radnom naponu. Kod vrlo jednostavnih CW odašiljača s lošom stabilizacijom napona to se čuje kao <em lang="en">Chirp</em>: na početku svake točke ili crte visina tona isprva je nešto viša ili nešto niža, a zatim se približava stvarnoj visini tona.</p>' +
        '<p>Snimka je stvarna veza (QSO) između RA1OW i OM3YCY u dva prolaza. U prvom prolazu postaja zove OM3YCY i ton joj je miran: crta završi na istoj visini na kojoj je počela. U drugom prolazu OM3YCY odgovara (DA DA OK RA1OW DE OM3YCY) i Chirp se jasno čuje: svaka crta počne niže i raste dok se tipka ne otpusti.</p>' +
        '<p>Gornja slika pokazuje visinu tona kroz vrijeme. Donja slaže sve dosad odslušane crte jednu na drugu, od trenutka pritiska tipke, kao promjenu visine od početka crte: ravne crte prvog prolaza i uzlazne crte drugog.</p>' +
        '<p>Lijek: radni napon VFO-a treba biti neovisan o radnim naponima ostalih stupnjeva (stabiliziran) te što bolje filtriran i odvezan. Uzrok i lijek pokazuje model u simulatoru „Chirp u CW odašiljaču”.</p>' +
        '<p>Krivulje visine tona simdeck je izmjerio iz snimke; za crtu uzima medijan prvih i zadnjih pet uzoraka (50 ms).</p>'
    },
    en: {
      stage: 'Chirp in a QSO: the pitch of two stations over time and the change of pitch in every dah, for the recording of one contact',
      dec: '.',
      hz: '{v} Hz',
      ms: '{v} ms',
      s: '{v} s',
      // controls
      play: 'Play / pause',
      t: 'Position in the recording',
      tHint: 'Clicking the strip under the curve jumps too.',
      // presets
      presetFirst: 'First pass',
      presetFirstHint: 'A station with a steady tone, from the start',
      presetSecond: 'Second pass',
      presetSecondHint: 'OM3YCY answers: every dah rises',
      presetWhole: 'The whole contact',
      presetWholeHint: 'All heard: both stations side by side',
      // legend
      legendA: 'first pass',
      legendB: 'second pass',
      legendKey: 'key down',
      legendHead: 'play position',
      // stage
      plotTime: 'The pitch where the tone stands out of the noise',
      plotRise: 'Every dah from key-down: the change of pitch',
      riseEmpty: 'Fills up as the recording is heard.',
      passA: 'pass 1',
      passB: 'pass 2',
      axisF: 'f / Hz',
      axisT: 't / s',
      axisDf: 'Δf / Hz',
      axisMs: 'from key-down / ms',
      whole: 'whole recording',
      // captions
      captionPos: 'Recording, {t} of {d}. ',
      nowA: 'The first station is sending. ',
      nowB: 'The second station, OM3YCY, is sending. ',
      nowNone: 'Nobody has sent a character yet. ',
      captionRise: 'From key-down to key-up the first pass\'s dahs change pitch by {r0}, the second\'s rise by {r1} on average: that is chirp. ',
      captionNote: 'That the two stations sit at different pitches (about 263 and 400 Hz) is only the receiver\'s tuning; what matters is the change inside an element.',
      credit: 'After an applet and recording from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; measured pitch curves added, translated and adapted for simdeck.',
      explain:
        '<p>A VFO\'s frequency depends directly on its supply voltage. In very simple CW transmitters with poor voltage regulation this is heard as <em>chirp</em>: at the start of every dit or dah the pitch is first a little higher or lower, then approaches the true pitch.</p>' +
        '<p>The recording is a real contact (QSO) between RA1OW and OM3YCY, in two passes. In the first a station calls OM3YCY with a steady tone: a dah ends at the pitch it started on. In the second OM3YCY answers (DA DA OK RA1OW DE OM3YCY) and the chirp is clearly heard: every dah starts lower and rises until the key comes up.</p>' +
        '<p>The upper plot shows the pitch over time. The lower one lays every dah heard so far on top of the others, from the moment of key-down, as the change of pitch since the dah began: the flat dahs of the first pass and the rising dahs of the second.</p>' +
        '<p>The cure: the VFO\'s supply should not depend on the other stages\' supplies (regulated), and should be filtered and decoupled as well as possible. The simulator "Chirp in a CW transmitter" shows the cause and the cure in a model.</p>' +
        '<p>simdeck measured the pitch curves from the recording; for a dah it takes the median of the first and of the last five samples (50 ms).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
