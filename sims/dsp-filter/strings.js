/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the dsp-filter page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_dsp_filter.html, its figures' alt texts and sections/modulatoren.md
   (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its
   TRANSLATION_GLOSSARY.md; English written for simdeck from it and the German original. Terms missing from
   kit/glossary.js (sideband, carrier, bandpass filter, passband, balanced mixer, crystal oscillator, SSB, LSB, USB)
   are written out here: NOTES.md "Term pairs". Caption values ({fo}, {lo}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Filtarska metoda za SSB: blok-dijagram s preklopkom kvarcnih oscilatora, spektar govora i spektar na izlazu mješača s propusnim područjem filtra',
      dec: ',',
      // controls
      sb: 'Bočni pojas (preklopka kvarca)',
      sbHint: 'Bira kvarcni oscilator. Filtar ostaje isti.',
      sbLsb: 'LSB',
      sbUsb: 'USB',
      tone: 'Ispitni ton',
      toneHint: 'Jedna frekvencija iz govora: gdje završava nakon mješača i filtra?',
      hz: '{v} Hz',
      khz: '{v} kHz',
      range: '{a} – {b}',
      // presets
      presetLsb: 'LSB',
      presetLsbHint: 'Kvarc 9001,5 kHz: filtar propušta donji bočni pojas',
      presetUsb: 'USB',
      presetUsbHint: 'Kvarc 8998,5 kHz: filtar propušta gornji bočni pojas',
      presetLsbEdge: 'LSB, ton 3 kHz',
      presetLsbEdgeHint: 'Najviši ton pada točno na donji rub filtra',
      presetUsbLow: 'USB, ton 300 Hz',
      presetUsbLowHint: 'Najniži ton: njegove dvije slike razmaknute su samo 600 Hz',
      // legend
      legendKept: 'propušteni bočni pojas',
      legendGone: 'potisnuti bočni pojas',
      legendFilter: 'propusno područje filtra',
      legendTone: 'ispitni ton',
      // stage: the block diagram
      blockMic: 'mikrofon',
      blockAmp: 'pojačalo',
      blockMix: 'balansni mješač',
      blockFilter: 'pojasni filtar',
      blockOut: 'izlaz',
      blockOsc: 'kvarcni oscilator',
      sigAf: 'NF',
      sigDsb: 'DSB',
      sigSsb: 'SSB',
      sigOsc: 'OSC',
      dsbLower: 'donji',
      dsbUpper: 'gornji',
      // stage: the plots
      plotAf: 'Spektar govora (NF)',
      plotRf: 'Iza mješača (DSB) i propusno područje filtra',
      axisPower: 'snaga',
      axisF: 'f',
      axisKhz: 'f / kHz',
      tagFilter: 'filtar',
      tagCarrier: 'nositelj (potisnut)',
      tagLower: 'LSB',
      tagUpper: 'USB',
      // captions
      captionLsb: 'Kvarc {fo}: mješač daje {lo} i {hi}. Filtar ({f0} – {f1}) propušta donji bočni pojas, a gornji počinje {gap} iznad njegova ruba i potisnut je. ',
      captionUsb: 'Kvarc {fo}: mješač daje {lo} i {hi}. Filtar ({f0} – {f1}) propušta gornji bočni pojas, a donji završava {gap} ispod njegova ruba i potisnut je. ',
      captionTone: 'Ton {tone} izlazi na {out}. ',
      captionMirror: 'U LSB-u je spektar zrcaljen: viši ton izlazi na nižoj frekvenciji.',
      captionKeep: 'U USB-u redoslijed ostaje: viši ton izlazi na višoj frekvenciji.',
      captionEdge: ' Ton je točno na rubu propusnog područja: idealni filtar ga još propušta, stvarni bi ga već prigušio.',
      credit: 'Prema apletu i slikama s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; slike ponovno nacrtane, prevedeno i prilagođeno za simdeck.',
      explain:
        '<p>Filtarska metoda stvara <em lang="en">SSB</em> (jednobočnopojasni signal) u dva stupnja. Prvi je <em lang="en">balanced mixer</em> (balansni mješač): miješa govor (300 Hz – 3 kHz) s oscilatorom i daje oba <em lang="en">sidebands</em> (bočni pojasevi), na f<sub>OSC</sub> − f<sub>NF</sub> i f<sub>OSC</sub> + f<sub>NF</sub>, bez <em lang="en">carrier</em> (nositelj): to je DSB signal. Drugi stupanj je uskopojasni <em lang="en">bandpass filter</em> (pojasni filtar), koji propušta samo jedan bočni pojas, a drugi potiskuje.</p>' +
        '<p>Trik je u tome da filtar ostaje fiksno ugođen na 9000 kHz ± 1,5 kHz. Gornji ili donji bočni pojas ne bira se promjenom filtra, nego frekvencijom oscilatora: za to postoje dva kvarcna oscilatora. S 8998,5 kHz gornji bočni pojas upada točno u <em lang="en">passband</em> (propusno područje) filtra (<em lang="en">USB</em>); s 9001,5 kHz cijeli se DSB spektar pomiče tako da u njega upada donji (<em lang="en">LSB</em>). Kao kod međufrekvencije prijamnika, jedan visokokvalitetan filtar služi za oba položaja.</p>' +
        '<p>U donjem bočnom pojasu viša NF frekvencija daje nižu frekvenciju na izlazu: spektar je zrcaljen. Nositelj leži točno na rubu propusnog područja; filtar ga ne bi potisnuo, to radi balansni mješač.</p>' +
        '<p>Govor počinje tek na 300 Hz, pa između dvaju bočnih pojaseva ostaje samo 600 Hz razmaka, a potisnuti bočni pojas počinje 300 Hz iza ruba filtra. Filtar zato mora biti vrlo strm. Ovdje je nacrtan kao idealni filtar s oštrim rubovima.</p>'
    },
    en: {
      stage: 'Filter method for SSB: block diagram with the crystal oscillator switch, the speech spectrum, and the spectrum after the mixer with the filter\'s passband',
      dec: '.',
      sb: 'Sideband (crystal switch)',
      sbHint: 'Selects the crystal oscillator. The filter stays the same.',
      sbLsb: 'LSB',
      sbUsb: 'USB',
      tone: 'Test tone',
      toneHint: 'One frequency from the speech: where does it end up after the mixer and the filter?',
      hz: '{v} Hz',
      khz: '{v} kHz',
      range: '{a} – {b}',
      presetLsb: 'LSB',
      presetLsbHint: 'Crystal 9001.5 kHz: the filter passes the lower sideband',
      presetUsb: 'USB',
      presetUsbHint: 'Crystal 8998.5 kHz: the filter passes the upper sideband',
      presetLsbEdge: 'LSB, 3 kHz tone',
      presetLsbEdgeHint: 'The highest tone lands exactly on the filter\'s lower edge',
      presetUsbLow: 'USB, 300 Hz tone',
      presetUsbLowHint: 'The lowest tone: its two images are only 600 Hz apart',
      legendKept: 'sideband passed',
      legendGone: 'sideband suppressed',
      legendFilter: 'filter passband',
      legendTone: 'test tone',
      blockMic: 'microphone',
      blockAmp: 'amplifier',
      blockMix: 'balanced mixer',
      blockFilter: 'bandpass filter',
      blockOut: 'output',
      blockOsc: 'crystal oscillator',
      sigAf: 'AF',
      sigDsb: 'DSB',
      sigSsb: 'SSB',
      sigOsc: 'OSC',
      dsbLower: 'lower',
      dsbUpper: 'upper',
      plotAf: 'Speech spectrum (AF)',
      plotRf: 'After the mixer (DSB) and the filter\'s passband',
      axisPower: 'power',
      axisF: 'f',
      axisKhz: 'f / kHz',
      tagFilter: 'filter',
      tagCarrier: 'carrier (suppressed)',
      tagLower: 'LSB',
      tagUpper: 'USB',
      captionLsb: 'Crystal {fo}: the mixer gives {lo} and {hi}. The filter ({f0} – {f1}) passes the lower sideband; the upper one starts {gap} above its edge and is suppressed. ',
      captionUsb: 'Crystal {fo}: the mixer gives {lo} and {hi}. The filter ({f0} – {f1}) passes the upper sideband; the lower one ends {gap} below its edge and is suppressed. ',
      captionTone: 'The tone at {tone} comes out at {out}. ',
      captionMirror: 'In LSB the spectrum is mirrored: a higher tone comes out at a lower frequency.',
      captionKeep: 'In USB the order stays: a higher tone comes out at a higher frequency.',
      captionEdge: ' The tone is exactly on the edge of the passband: the ideal filter still passes it, a real one would already attenuate it.',
      credit: 'After an applet and figures from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; figures redrawn, translated and adapted for simdeck.',
      explain:
        '<p>The filter method makes an <em lang="en">SSB</em> (single sideband) signal in two stages. The first is a <em lang="en">balanced mixer</em>: it mixes the speech (300 Hz – 3 kHz) with an oscillator and gives both <em lang="en">sidebands</em>, at f<sub>OSC</sub> − f<sub>AF</sub> and f<sub>OSC</sub> + f<sub>AF</sub>, without the <em lang="en">carrier</em>: a DSB signal. The second stage is a narrow <em lang="en">bandpass filter</em> that passes only one sideband and suppresses the other.</p>' +
        '<p>The trick is that the filter stays fixed at 9000 kHz ± 1.5 kHz. Upper or lower sideband is chosen not by changing the filter but by the oscillator\'s frequency, so there are two crystal oscillators. With 8998.5 kHz the upper sideband falls exactly into the filter\'s <em lang="en">passband</em> (<em lang="en">USB</em>); with 9001.5 kHz the whole DSB spectrum moves so that the lower one falls into it (<em lang="en">LSB</em>). As with a receiver\'s intermediate frequency, one high-quality filter serves both positions.</p>' +
        '<p>In the lower sideband a higher AF frequency gives a lower output frequency: the spectrum is mirrored. The carrier lies exactly on the edge of the passband; the filter would not suppress it, the balanced mixer does.</p>' +
        '<p>Speech starts only at 300 Hz, so the two sidebands are just 600 Hz apart, and the suppressed sideband starts 300 Hz beyond the filter\'s edge. The filter must therefore be very steep. Here it is drawn as an ideal filter with sharp edges.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
